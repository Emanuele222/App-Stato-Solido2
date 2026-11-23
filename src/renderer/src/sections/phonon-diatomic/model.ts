/**
 * Calcolo dello stato fisico derivato per la sezione «Catena biatomica, gap fononico e luce infrarossa».
 * Chiama esclusivamente funzioni pure di `physics/phononDispersion.ts`.
 */
import { useMemo } from 'react'
import {
  diatomicDispersionCurve,
  diatomicDynamicalMatrix,
  diatomicGroupVelocity,
  diatomicInfraredCrossing,
  diatomicModeAmplitude,
  diatomicOmega,
  diatomicPhaseVelocity,
  diatomicSummary,
  monatomicDispersionCurve,
  radSToMev,
  radSToThz,
  velocityMsToThzAngstrom,
  type DiatomicBranch,
  type DiatomicCurve,
  type DiatomicDynamicalMatrix2x2,
  type DiatomicInfraredCrossing,
  type DiatomicModeAmplitude,
  type DiatomicParams,
  type DiatomicSummary,
  type MonatomicCurve
} from '../../physics'
import { NUMERICS, type Params } from './manifest'
import type { ToolId } from './store'

export interface DiatomicSelection {
  readonly kFrac: number
  readonly branch: DiatomicBranch
  /** Vettore d'onda k in Å⁻¹. */
  readonly k: number
  /** Pulsazione ω(k) in rad·s⁻¹. */
  readonly omegaRadS: number
  /** Frequenza ν(k) in THz. */
  readonly freqThz: number
  /** Energia fononica ħω(k) in meV. */
  readonly energyMev: number
  /** Velocità di gruppo v_g(k) in m·s⁻¹. */
  readonly vgMs: number
  /** Velocità di fase v_p(k) in m·s⁻¹ (null in k = 0). */
  readonly vpMs: number | null
  /** Rapporto d'ampiezza α e ampiezze normalizzate (ampM, ampm). */
  readonly amplitude: DiatomicModeAmplitude
  /** Vero se k = 0 (centro di zona). */
  readonly atOrigin: boolean
  /** Vero se k = ±π/a (bordo di zona). */
  readonly atEdge: boolean
  /** Vero se ci si trova su un punto angoloso (k = 0 acustico, oppure bordo zona con M = m). */
  readonly atCusp: boolean
}

export interface DiatomicFoldingReference {
  /** Curva monatomica distesa di passo a/2 con massa media m̄ = (M + m)/2 su [−2π/a, 2π/a]. */
  readonly unfolded: MonatomicCurve
  /** Parte ripiegata dentro [−π/a, π/a] (traslata di G = 2π/a) che genera il ramo ottico per M = m. */
  readonly foldedOpticalK: Float64Array
  readonly foldedOpticalFreqThz: Float64Array
  readonly meanMassAmu: number
}

export interface DiatomicModel {
  readonly params: DiatomicParams
  readonly summary: DiatomicSummary
  readonly curve: DiatomicCurve
  readonly foldingRef: DiatomicFoldingReference | null
  readonly kRange: readonly [number, number]
  readonly yRange: readonly [number, number]
  /** Pendenza dν/dk della retta acustica ν = v_s|k|/(2π) in THz·Å. */
  readonly soundSlopeThzA: number
  readonly selection: DiatomicSelection
  readonly dynamicalMatrix: DiatomicDynamicalMatrix2x2 | null
  readonly infrared: DiatomicInfraredCrossing
}

export function usePhononDiatomicModel(
  params: Params,
  kFrac: number,
  branch: DiatomicBranch,
  tools: Readonly<Record<ToolId, boolean>>
): DiatomicModel {
  const { a, massHeavyAmu, massLightAmu, springC } = params
  const physParams = useMemo<DiatomicParams>(
    () => ({ a, massHeavyAmu, massLightAmu, springC }),
    [a, massHeavyAmu, massLightAmu, springC]
  )

  const summary = useMemo(() => diatomicSummary(physParams), [physParams])

  const kHalfSpan = tools.folding ? 2 * summary.zoneEdge : summary.zoneEdge
  const nPoints = tools.folding ? NUMERICS.kPointsExtended : NUMERICS.kPoints1BZ

  const curve = useMemo(
    () => diatomicDispersionCurve(physParams, -kHalfSpan, kHalfSpan, nPoints),
    [physParams, kHalfSpan, nPoints]
  )

  const foldingRef = useMemo<DiatomicFoldingReference | null>(() => {
    if (!tools.folding) return null
    const meanMassAmu = 0.5 * (massHeavyAmu + massLightAmu)
    const halfA = 0.5 * a
    const unfolded = monatomicDispersionCurve(
      { a: halfA, massAmu: meanMassAmu, springC },
      -2 * summary.zoneEdge,
      2 * summary.zoneEdge,
      NUMERICS.kPointsExtended
    )
    // Ramo ripiegato dentro [−π/a, π/a]: ω(k − 2π/a) per la catena di passo a/2 (= 2√(C/m̄)|cos(ka/4)|)
    const n1 = NUMERICS.kPoints1BZ
    const foldedOpticalK = new Float64Array(n1)
    const foldedOpticalFreqThz = new Float64Array(n1)
    const eqParams: DiatomicParams = {
      a,
      massHeavyAmu: meanMassAmu,
      massLightAmu: meanMassAmu,
      springC
    }
    const eqCurve = diatomicDispersionCurve(eqParams, -summary.zoneEdge, summary.zoneEdge, n1)
    foldedOpticalK.set(eqCurve.k)
    foldedOpticalFreqThz.set(eqCurve.opticalFreqThz)
    return { unfolded, foldedOpticalK, foldedOpticalFreqThz, meanMassAmu }
  }, [tools.folding, a, massHeavyAmu, massLightAmu, springC, summary.zoneEdge])

  const selection = useMemo<DiatomicSelection>(() => {
    const k = kFrac * summary.zoneEdge
    const omegaRadS = diatomicOmega(k, branch, physParams)
    const freqThz = radSToThz(omegaRadS)
    const energyMev = radSToMev(omegaRadS)
    const vgMs = diatomicGroupVelocity(k, branch, physParams)
    const vpMs = diatomicPhaseVelocity(k, branch, physParams)
    const amplitude = diatomicModeAmplitude(k, branch, physParams)
    const atOrigin = Math.abs(kFrac) < 1e-4
    const atEdge = Math.abs(Math.abs(kFrac) - 1) < 1e-4
    const atCusp = (atOrigin && branch === 'acoustic') || (atEdge && summary.equalMasses)

    return {
      kFrac,
      branch,
      k,
      omegaRadS,
      freqThz,
      energyMev,
      vgMs,
      vpMs,
      amplitude,
      atOrigin,
      atEdge,
      atCusp
    }
  }, [kFrac, branch, physParams, summary.zoneEdge, summary.equalMasses])

  const dynamicalMatrix = useMemo(
    () => (tools.matrix ? diatomicDynamicalMatrix(selection.k, physParams) : null),
    [tools.matrix, selection.k, physParams]
  )

  const infrared = useMemo(() => diatomicInfraredCrossing(physParams, 1), [physParams])

  const soundSlopeThzA = velocityMsToThzAngstrom(summary.soundSpeedMs)
  const yTopRef = Math.max(
    summary.freqOpticalZeroThz,
    foldingRef ? foldingRef.foldedOpticalFreqThz[Math.floor(foldingRef.foldedOpticalFreqThz.length / 2)] : 0
  )
  const yMax = Math.max(1.2, yTopRef * 1.18)

  return {
    params: physParams,
    summary,
    curve,
    foldingRef,
    kRange: [-kHalfSpan, kHalfSpan],
    yRange: [0, yMax],
    soundSlopeThzA,
    selection,
    dynamicalMatrix,
    infrared
  }
}
