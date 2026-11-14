/**
 * Modello della sezione «Pseudopotenziale»:
 * - anteprima reattiva immediata (51 onde piane × 51 punti, ricampionata sui 201 punti del cammino);
 * - calcolo esatto completo in Web Worker (113 onde piane × 201 punti) con cache LRU e stato «in affinamento…»;
 * - curve di modello dello spazio reale, fattore di forma v(q) di Ashcroft+TF e confronto ione nudo vs V^s.
 * Tutta la fisica viene da ../../physics.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  analyzeEpmBands,
  bareIonFourierAmplitudeEv,
  emptyLatticeFccBands,
  epmBrillouinPath,
  epmDirectionalKinematics,
  epmSegmentDirection,
  fccReciprocalVectors,
  pseudopotentialBands,
  pseudopotentialStateAt,
  RYDBERG_EV,
  type BandStructure,
  type EpmBandSummary,
  type EpmFormFactors,
  type EpmLocalKinematics,
  type EpmStateBreakdown,
  type FormFactorCurve,
  type KPath,
  type RealSpaceModelCurves,
  realSpacePseudopotentialModel,
  screenedAshcroftFormFactorCurve
} from '../../physics'
import type { EpmWorkerRequest, EpmWorkerResponse } from './epmWorker'
import {
  buildFormFactors,
  NUMERICS,
  PARAMS,
  type AntisymmetricFactors,
  type EpmParamValues,
  type EpmPreset
} from './manifest'
import type { PseudopotentialTools } from './store'

export interface FullEpmResult {
  readonly key: string
  readonly path: KPath
  readonly energies: readonly Float64Array[]
  readonly summary: EpmBandSummary
  readonly elapsedMs: number
}

export interface BareIonRow {
  readonly gSq: number
  readonly bareEv: number
  readonly siPseudoEv: number | null
}

export interface GaasGammaComparison {
  readonly calculatedMassRatio: number
  readonly measuredMassRatio: number
  readonly kpEstimateRatio: number
  readonly egGammaEv: number
}

export interface PseudopotentialModel {
  readonly a: number
  readonly formFactors: EpmFormFactors
  readonly path: KPath
  readonly bands: BandStructure
  readonly summary: EpmBandSummary
  readonly isFullResolution: boolean
  readonly refining: boolean
  readonly lastWorkerMs: number | null
  readonly eRange: readonly [number, number]
  readonly pointIndex: number
  readonly bandIndex: number
  readonly stateBreakdown: EpmStateBreakdown
  readonly selectedEnergy: number
  readonly segmentDirection: readonly [number, number, number]
  readonly massProbe: EpmLocalKinematics | null
  readonly gaasGammaCompare: GaasGammaComparison | null
  readonly emptyLatticeAligned: BandStructure | null
  readonly chemicalPotential: number | null
  readonly realSpace: RealSpaceModelCurves
  readonly formFactorCurve: FormFactorCurve
  readonly bareIonRows: readonly BareIonRow[]
}

const MAX_CACHE_ENTRIES = 24
const fullCache = new Map<string, FullEpmResult>()

let sharedWorker: Worker | null | undefined
let reqSeq = 0
const pendingCallbacks = new Map<number, (res: FullEpmResult, key: string) => void>()

function getEpmWorker(): Worker | null {
  if (sharedWorker !== undefined) return sharedWorker
  if (typeof Worker === 'undefined') {
    sharedWorker = null
    return null
  }
  try {
    const worker = new Worker(new URL('./epmWorker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (ev: MessageEvent<EpmWorkerResponse>) => {
      const data = ev.data
      const cb = pendingCallbacks.get(data.id)
      pendingCallbacks.delete(data.id)
      const res: FullEpmResult = {
        key: '',
        path: data.path,
        energies: data.energies,
        summary: data.summary,
        elapsedMs: data.elapsedMs
      }
      cb?.(res, '')
    }
    worker.onerror = () => {
      pendingCallbacks.clear()
    }
    sharedWorker = worker
    return worker
  } catch {
    sharedWorker = null
    return null
  }
}

function storeInCache(key: string, result: FullEpmResult): void {
  if (fullCache.has(key)) fullCache.delete(key)
  fullCache.set(key, { ...result, key })
  if (fullCache.size > MAX_CACHE_ENTRIES) {
    const oldest = fullCache.keys().next().value
    if (oldest !== undefined) fullCache.delete(oldest)
  }
}

function makeKey(a: number, ff: EpmFormFactors): string {
  return [
    a.toFixed(4),
    ff.v3s.toFixed(5),
    ff.v8s.toFixed(5),
    ff.v11s.toFixed(5),
    ff.v3a.toFixed(5),
    ff.v4a.toFixed(5),
    ff.v11a.toFixed(5)
  ].join('|')
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}

function clampParams(raw: EpmParamValues): EpmParamValues {
  const byId = Object.fromEntries(PARAMS.map((p) => [p.id, p]))
  return {
    a: clamp(raw.a, byId.a.min, byId.a.max),
    v3s: clamp(raw.v3s, byId.v3s.min, byId.v3s.max),
    v8s: clamp(raw.v8s, byId.v8s.min, byId.v8s.max),
    v11s: clamp(raw.v11s, byId.v11s.min, byId.v11s.max)
  }
}

/** Ricampiona le bande ridotte (10 passi/tratto = 51 punti) sul cammino canonico a 201 punti (40/tratto). */
function upsampleSegmentBands(
  rawEnergies: readonly Float64Array[],
  fastPerSeg: number,
  fullPerSeg: number
): readonly Float64Array[] {
  const ratio = fullPerSeg / fastPerSeg // 4
  const fullLen = fullPerSeg * 5 + 1 // 201
  return rawEnergies.map((fastBand) => {
    const out = new Float64Array(fullLen)
    for (let seg = 0; seg < 5; seg++) {
      for (let j = 0; j < fastPerSeg; j++) {
        const i0 = seg * fastPerSeg + j
        const i1 = i0 + 1
        const e0 = fastBand[i0]
        const e1 = fastBand[i1]
        for (let r = 0; r < ratio; r++) {
          const t = r / ratio
          out[seg * fullPerSeg + j * ratio + r] = e0 + (e1 - e0) * t
        }
      }
    }
    out[fullLen - 1] = fastBand[fastBand.length - 1]
    return out
  })
}

function computeFastOnCanonical(a: number, formFactors: EpmFormFactors) {
  const canonicalPath = epmBrillouinPath(a, NUMERICS.fullPointsPerSegment)
  const rawFast = pseudopotentialBands(
    { a, formFactors },
    {
      gMaxSq: NUMERICS.fastGMaxSq,
      pointsPerSegment: NUMERICS.fastPointsPerSegment,
      numBands: NUMERICS.numBands,
      zeroAtValenceTop: false
    }
  )
  const rawEnergies = upsampleSegmentBands(rawFast.energies, NUMERICS.fastPointsPerSegment, NUMERICS.fullPointsPerSegment)
  let rawVbm = -Infinity
  for (let i = 0; i < rawEnergies[3].length; i++) {
    if (rawEnergies[3][i] > rawVbm) rawVbm = rawEnergies[3][i]
  }
  const shiftedEnergies = rawEnergies.map((band) => {
    const out = new Float64Array(band.length)
    for (let i = 0; i < band.length; i++) out[i] = band[i] - rawVbm
    return out
  })
  const rawBands: BandStructure = { method: 'pseudopotential', path: canonicalPath, energies: rawEnergies }
  const bands: BandStructure = { method: 'pseudopotential', path: canonicalPath, energies: shiftedEnergies }
  const nPw = fccReciprocalVectors(NUMERICS.fastGMaxSq).length
  const summary = analyzeEpmBands(bands, rawBands, nPw)
  return { path: canonicalPath, bands, summary }
}

function computeFullSync(a: number, formFactors: EpmFormFactors): FullEpmResult {
  const t0 = performance.now()
  const raw = pseudopotentialBands(
    { a, formFactors },
    {
      gMaxSq: NUMERICS.fullGMaxSq,
      pointsPerSegment: NUMERICS.fullPointsPerSegment,
      numBands: NUMERICS.numBands,
      zeroAtValenceTop: false
    }
  )
  let rawVbm = -Infinity
  for (let i = 0; i < raw.energies[3].length; i++) {
    if (raw.energies[3][i] > rawVbm) rawVbm = raw.energies[3][i]
  }
  const shifted = raw.energies.map((band) => {
    const out = new Float64Array(band.length)
    for (let i = 0; i < band.length; i++) out[i] = band[i] - rawVbm
    return out
  })
  const nPw = fccReciprocalVectors(NUMERICS.fullGMaxSq).length
  const bands: BandStructure = { method: 'pseudopotential', path: raw.path, energies: shifted }
  const summary = analyzeEpmBands(bands, raw, nPw)
  return {
    key: makeKey(a, formFactors),
    path: raw.path,
    energies: shifted,
    summary,
    elapsedMs: performance.now() - t0
  }
}

export function usePseudopotentialModel(
  shownParams: EpmParamValues,
  targetParams: EpmParamValues,
  antisymmetric: AntisymmetricFactors | null,
  antisymmetricOn: boolean,
  vaMix: number,
  transition: 'follow' | 'glide',
  pointIndex: number,
  bandIndex: number,
  tools: PseudopotentialTools,
  activePreset: EpmPreset | null
): PseudopotentialModel {
  const clampedShown = clampParams(shownParams)
  const clampedTarget = clampParams(targetParams)

  const targetFormFactors = useMemo(
    () => buildFormFactors(clampedTarget, antisymmetric, antisymmetricOn),
    [clampedTarget, antisymmetric, antisymmetricOn]
  )
  const targetKey = makeKey(clampedTarget.a, targetFormFactors)

  const shownFormFactors = useMemo(() => {
    const base = buildFormFactors(clampedShown, antisymmetric, true)
    const mix = antisymmetric ? clamp(vaMix, 0, 1) : 0
    return {
      ...base,
      v3a: base.v3a * mix,
      v4a: base.v4a * mix,
      v11a: base.v11a * mix
    }
  }, [clampedShown, antisymmetric, vaMix])

  const [, setCacheTick] = useState(0)

  // Pianifica calcolo completo nel Web Worker sui parametri bersaglio
  useEffect(() => {
    if (fullCache.has(targetKey)) return

    let cancelled = false
    const delayMs = transition === 'glide' ? 0 : 90
    const timer = window.setTimeout(() => {
      if (cancelled) return
      const worker = getEpmWorker()
      if (!worker) {
        const res = computeFullSync(clampedTarget.a, targetFormFactors)
        storeInCache(targetKey, res)
        if (!cancelled) setCacheTick((n) => n + 1)
        return
      }
      reqSeq += 1
      const reqId = reqSeq
      pendingCallbacks.set(reqId, (res) => {
        storeInCache(targetKey, res)
        if (!cancelled) setCacheTick((n) => n + 1)
      })
      const req: EpmWorkerRequest = {
        id: reqId,
        a: clampedTarget.a,
        formFactors: targetFormFactors,
        gMaxSq: NUMERICS.fullGMaxSq,
        pointsPerSegment: NUMERICS.fullPointsPerSegment,
        numBands: NUMERICS.numBands
      }
      worker.postMessage(req)
    }, delayMs)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [targetKey, clampedTarget.a, targetFormFactors, transition])

  const isSettled =
    Math.abs(clampedShown.a - clampedTarget.a) < 1e-4 &&
    Math.abs(clampedShown.v3s - clampedTarget.v3s) < 1e-5 &&
    Math.abs(clampedShown.v8s - clampedTarget.v8s) < 1e-5 &&
    Math.abs(clampedShown.v11s - clampedTarget.v11s) < 1e-5 &&
    Math.abs(vaMix - (antisymmetricOn ? 1 : 0)) < 1e-3

  const cachedFull = fullCache.get(targetKey) ?? null
  const isFullResolution = isSettled && cachedFull !== null
  const refining = !isFullResolution

  const fastResult = useMemo(
    () => (isFullResolution ? null : computeFastOnCanonical(clampedShown.a, shownFormFactors)),
    [isFullResolution, clampedShown.a, shownFormFactors]
  )

  const activePath = isFullResolution ? cachedFull.path : fastResult!.path
  const activeBands: BandStructure = isFullResolution
    ? { method: 'pseudopotential', path: cachedFull.path, energies: cachedFull.energies }
    : fastResult!.bands
  const activeSummary = isFullResolution ? cachedFull.summary : fastResult!.summary
  const activeA = isFullResolution ? clampedTarget.a : clampedShown.a
  const activeFf = isFullResolution ? targetFormFactors : shownFormFactors
  const activeGMaxSq = isFullResolution ? NUMERICS.fullGMaxSq : NUMERICS.fastGMaxSq

  // Confronto con reticolo vuoto fcc allineato al fondo della valenza corrente
  const emptyLatticeAligned = useMemo(() => {
    if (!tools.compare) return null
    const rawEmpty = emptyLatticeFccBands(activeA, {
      gMaxSq: NUMERICS.fullGMaxSq,
      pointsPerSegment: NUMERICS.fullPointsPerSegment,
      numBands: NUMERICS.numBands
    })
    const shift = activeSummary.valenceBottom
    const shifted = rawEmpty.energies.map((band) => {
      const out = new Float64Array(band.length)
      for (let i = 0; i < band.length; i++) out[i] = band[i] + shift
      return out
    })
    return { method: 'empty-lattice' as const, path: rawEmpty.path, energies: shifted }
  }, [tools.compare, activeA, activeSummary.valenceBottom])

  // Intervallo verticale stabile che racchiude tutte le 8 bande (e il reticolo vuoto se attivo)
  const eRange = useMemo<readonly [number, number]>(() => {
    let minE = activeSummary.valenceBottom
    let maxE = activeBands.energies[NUMERICS.numBands - 1][0]
    for (let b = 0; b < activeBands.energies.length; b++) {
      const arr = activeBands.energies[b]
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] < minE) minE = arr[i]
        if (arr[i] > maxE) maxE = arr[i]
      }
    }
    if (emptyLatticeAligned) {
      for (let b = 0; b < emptyLatticeAligned.energies.length; b++) {
        const arr = emptyLatticeAligned.energies[b]
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] < minE) minE = arr[i]
          if (arr[i] > maxE) maxE = arr[i]
        }
      }
    }
    return [Math.min(-13.8, Math.floor(minE - 1.0)), Math.max(8.5, Math.ceil(maxE + 1.0))]
  }, [activeSummary.valenceBottom, activeBands, emptyLatticeAligned])

  const safePointIndex = clamp(pointIndex, 0, activePath.points.length - 1)
  const safeBandIndex = clamp(bandIndex, 0, NUMERICS.numBands - 1)

  const stateBreakdown = useMemo(
    () =>
      pseudopotentialStateAt(
        { a: activeA, formFactors: activeFf },
        activePath.points[safePointIndex],
        safeBandIndex,
        activeGMaxSq,
        NUMERICS.numBands,
        activeSummary.rawVbmEv
      ),
    [activeA, activeFf, activePath, safePointIndex, safeBandIndex, activeGMaxSq, activeSummary.rawVbmEv]
  )

  const segmentDirection = useMemo(
    () => epmSegmentDirection(activePath, safePointIndex),
    [activePath, safePointIndex]
  )

  const massProbe = useMemo(() => {
    if (!tools.mass) return null
    return epmDirectionalKinematics(
      { a: activeA, formFactors: activeFf },
      activePath.points[safePointIndex],
      segmentDirection,
      safeBandIndex,
      activeGMaxSq
    )
  }, [tools.mass, activeA, activeFf, activePath, safePointIndex, segmentDirection, safeBandIndex, activeGMaxSq])

  const gaasGammaCompare = useMemo<GaasGammaComparison | null>(() => {
    if (!tools.mass || activePreset?.id !== 'gaas' || !antisymmetricOn || !activePreset.measuredGammaMass || !activePreset.kpEpEv) {
      return null
    }
    const kin = epmDirectionalKinematics(
      { a: activeA, formFactors: activeFf },
      [0, 0, 0],
      [1, 0, 0],
      4,
      activeGMaxSq
    )
    const egGammaEv = activeSummary.ecGamma
    return {
      calculatedMassRatio: kin.effectiveMassRatio,
      measuredMassRatio: activePreset.measuredGammaMass,
      kpEstimateRatio: egGammaEv / activePreset.kpEpEv,
      egGammaEv
    }
  }, [tools.mass, activePreset, antisymmetricOn, activeA, activeFf, activeGMaxSq, activeSummary.ecGamma])

  const realSpace = useMemo(() => realSpacePseudopotentialModel(2.6, 0.72, 241), [])
  const formFactorCurve = useMemo(() => screenedAshcroftFormFactorCurve(activeA, 14, 160, 0.57), [activeA])

  const bareIonRows = useMemo<readonly BareIonRow[]>(() => {
    const siV: Record<number, number> = {
      3: -0.21 * RYDBERG_EV,
      8: 0.04 * RYDBERG_EV,
      11: 0.08 * RYDBERG_EV
    }
    return [3, 8, 11].map((gSq) => ({
      gSq,
      bareEv: bareIonFourierAmplitudeEv(NUMERICS.siBareIonA, NUMERICS.siBareIonZ, gSq),
      siPseudoEv: siV[gSq] ?? null
    }))
  }, [])

  const chemicalPotential = tools.fill
    ? activeSummary.gap > 0
      ? 0.5 * (activeSummary.vbmEnergy + activeSummary.cbmEnergy)
      : activeSummary.vbmEnergy
    : null

  return {
    a: activeA,
    formFactors: activeFf,
    path: activePath,
    bands: activeBands,
    summary: activeSummary,
    isFullResolution,
    refining,
    lastWorkerMs: cachedFull?.elapsedMs ?? null,
    eRange,
    pointIndex: safePointIndex,
    bandIndex: safeBandIndex,
    stateBreakdown,
    selectedEnergy: activeBands.energies[safeBandIndex][safePointIndex],
    segmentDirection,
    massProbe,
    gaasGammaCompare,
    emptyLatticeAligned,
    chemicalPotential,
    realSpace,
    formFactorCurve,
    bareIonRows
  }
}
