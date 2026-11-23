/**
 * Modello della sezione «Pseudopotenziale» (modello 1D esatto con stato di core):
 * tutta la fisica viene da ../../physics/pseudoCore1d.
 */
import { useMemo } from 'react'
import {
  HBAR2_OVER_2M0,
  bareIonFourierAmplitudeEv,
  cancellationMatrixElements,
  computeCoreRadius,
  emptyLatticeBands,
  evalBlochWavefunction1D,
  gaussianCrystalPotential,
  planeWaveTailWeight,
  pseudoCore1DBands,
  pseudoWavefunctionAndTrue,
  rydbergToEv,
  smoothestAlpha,
  solvePseudoCore1DAtK,
  zonePath1D,
  type BandStructure,
  type CancellationElements,
  type KPath
} from '../../physics'
import { NUMERICS, type PseudoCoreParamValues } from './manifest'
import type { PseudoCoreTools } from './store'

export interface BareIonRow {
  readonly gSq: number
  readonly bareEv: number
  readonly siPseudoEv: number | null
}

export interface PseudoCoreMassProbe {
  readonly slope: number
  readonly curvature: number
  readonly effectiveMassRatio: number
}

export interface PseudoCoreRealSpaceData {
  readonly xGrid: Float64Array
  readonly potential: Float64Array
  readonly psiCoreRe: Float64Array
  readonly psiTrueRe: Float64Array
  readonly psiSmoothRe: Float64Array
  readonly rc: number
}

export interface PseudoCoreModel {
  readonly params: PseudoCoreParamValues
  readonly path: KPath
  readonly bands: BandStructure
  readonly shiftedCoreBand: Float64Array
  readonly emptyBands: BandStructure | null
  readonly kIndex: number
  readonly bandIndex: number
  readonly kValue: number
  readonly eCore: number
  readonly eValence: number
  readonly selectedEnergy: number
  readonly eDiff: number
  readonly shiftedCoreAtK: number
  readonly orthoOverlap: number
  readonly alphaSmooth: number
  readonly lowWaveWeightTrue: number
  readonly lowWaveWeightSmooth: number
  readonly weightsTrue: Float64Array
  readonly weightsSmooth: Float64Array
  readonly cancellation: CancellationElements
  readonly realSpace: PseudoCoreRealSpaceData
  readonly massProbe: PseudoCoreMassProbe | null
  readonly eRange: readonly [number, number]
  readonly bareIonRows: readonly BareIonRow[]
}

export function usePseudoCoreModel(
  params: PseudoCoreParamValues,
  kIndex: number,
  bandIndex: number,
  tools: PseudoCoreTools
): PseudoCoreModel {
  const { a, v0, s, f, alpha } = params

  const path = useMemo(() => zonePath1D(a, NUMERICS.kPoints), [a])

  const bands = useMemo(
    () => pseudoCore1DBands({ a, v0, s }, path, NUMERICS.numBands, NUMERICS.nHalf),
    [a, v0, s, path]
  )

  const emptyBands = useMemo(
    () => (tools.compare ? emptyLatticeBands(a, path, NUMERICS.numBands) : null),
    [tools.compare, a, path]
  )

  const safeKIndex = Math.max(0, Math.min(path.points.length - 1, kIndex))
  const safeBandIndex = Math.max(0, Math.min(NUMERICS.numBands - 1, bandIndex))
  const kValue = path.points[safeKIndex][0]

  const stateAtK = useMemo(
    () => solvePseudoCore1DAtK(kValue, { a, v0, s }, NUMERICS.nHalf),
    [kValue, a, v0, s]
  )

  const shiftedCoreBand = useMemo(() => {
    const src = bands.energies[0]
    const out = new Float64Array(src.length)
    for (let i = 0; i < src.length; i++) out[i] = src[i] + f
    return out
  }, [bands.energies, f])

  const cCore = stateAtK.vectors[0]
  // Se l'utente ha selezionato la banda di core (0), mostriamo ψ_k sulla prima banda di valenza (1) per il confronto
  const valenceBandForWave = safeBandIndex === 0 ? 1 : safeBandIndex
  const cVal = stateAtK.vectors[valenceBandForWave]
  const eCore = stateAtK.energies[0]
  const eValence = stateAtK.energies[valenceBandForWave]
  const selectedEnergy = stateAtK.energies[safeBandIndex]

  const orthoOverlap = useMemo(() => {
    let dot = 0
    for (let m = 0; m < cCore.length; m++) dot += cCore[m] * cVal[m]
    return Math.abs(dot)
  }, [cCore, cVal])

  const alphaSmooth = useMemo(
    () => smoothestAlpha(cVal, cCore, kValue, stateAtK.G),
    [cVal, cCore, kValue, stateAtK.G]
  )

  const { cPseudoNorm } = useMemo(
    () => pseudoWavefunctionAndTrue(cVal, cCore, alpha),
    [cVal, cCore, alpha]
  )

  const lowWaveWeightTrue = useMemo(
    () => 1 - planeWaveTailWeight(cVal, stateAtK.nHalf, 3),
    [cVal, stateAtK.nHalf]
  )
  const lowWaveWeightSmooth = useMemo(
    () => 1 - planeWaveTailWeight(cPseudoNorm, stateAtK.nHalf, 3),
    [cPseudoNorm, stateAtK.nHalf]
  )

  const { weightsTrue, weightsSmooth } = useMemo(() => {
    const nDisp = 12
    const len = 2 * nDisp + 1
    const wt = new Float64Array(len)
    const ws = new Float64Array(len)
    for (let i = 0; i < len; i++) {
      const m = stateAtK.nHalf + (i - nDisp)
      wt[i] = cVal[m] * cVal[m]
      ws[i] = cPseudoNorm[m] * cPseudoNorm[m]
    }
    return { weightsTrue: wt, weightsSmooth: ws }
  }, [cVal, cPseudoNorm, stateAtK.nHalf])

  const cancellation = useMemo(
    () =>
      cancellationMatrixElements(
        stateAtK.G,
        stateAtK.nHalf,
        { a, v0, s },
        eValence,
        eCore,
        cCore,
        6
      ),
    [stateAtK.G, stateAtK.nHalf, a, v0, s, eValence, eCore, cCore]
  )

  const realSpace = useMemo<PseudoCoreRealSpaceData>(() => {
    const nGrid = 241
    const xGrid = new Float64Array(nGrid)
    const potential = new Float64Array(nGrid)
    const halfSpan = a // [-a, a] mostra due celle centrate su 0, ±a
    for (let i = 0; i < nGrid; i++) {
      const x = -halfSpan + (2 * halfSpan * i) / (nGrid - 1)
      xGrid[i] = x
      potential[i] = gaussianCrystalPotential(x, { a, v0, s })
    }
    const psiCoreRe = evalBlochWavefunction1D(cCore, stateAtK.G, kValue, a, xGrid).re
    const psiTrueRe = evalBlochWavefunction1D(cVal, stateAtK.G, kValue, a, xGrid).re
    const psiSmoothRe = evalBlochWavefunction1D(cPseudoNorm, stateAtK.G, kValue, a, xGrid).re
    const rc = computeCoreRadius(cCore, stateAtK.G, kValue, a)
    return { xGrid, potential, psiCoreRe, psiTrueRe, psiSmoothRe, rc }
  }, [a, v0, s, cCore, cVal, cPseudoNorm, stateAtK.G, kValue])

  const massProbe = useMemo<PseudoCoreMassProbe | null>(() => {
    if (!tools.mass) return null
    const h = 1.5e-3
    const eMinus = solvePseudoCore1DAtK(kValue - h, { a, v0, s }, NUMERICS.nHalf).energies[safeBandIndex]
    const eZero = stateAtK.energies[safeBandIndex]
    const ePlus = solvePseudoCore1DAtK(kValue + h, { a, v0, s }, NUMERICS.nHalf).energies[safeBandIndex]
    const slope = (ePlus - eMinus) / (2 * h)
    const curvature = (ePlus - 2 * eZero + eMinus) / (h * h)
    const effectiveMassRatio =
      Math.abs(curvature) < 1e-9 ? Number.POSITIVE_INFINITY : (2 * HBAR2_OVER_2M0) / curvature
    return { slope, curvature, effectiveMassRatio }
  }, [tools.mass, kValue, a, v0, s, safeBandIndex, stateAtK.energies])

  const eRange = useMemo<readonly [number, number]>(() => {
    const minCore = Math.min(...bands.energies[0])
    const maxVal = Math.max(...bands.energies[NUMERICS.numBands - 1])
    const shiftedMax = Math.max(...shiftedCoreBand)
    const shiftedMin = Math.min(...shiftedCoreBand)
    return [
      Math.floor(Math.min(minCore, shiftedMin) - 3),
      Math.ceil(Math.max(maxVal, shiftedMax) + 3)
    ]
  }, [bands.energies, shiftedCoreBand])

  const bareIonRows = useMemo<readonly BareIonRow[]>(() => {
    const siV: Record<number, number> = {
      3: rydbergToEv(-0.211),
      8: rydbergToEv(0.04),
      11: rydbergToEv(0.08)
    }
    return [3, 8, 11].map((gSq) => ({
      gSq,
      bareEv: bareIonFourierAmplitudeEv(NUMERICS.siBareIonA, NUMERICS.siBareIonZ, gSq),
      siPseudoEv: siV[gSq] ?? null
    }))
  }, [])

  return {
    params,
    path,
    bands,
    shiftedCoreBand,
    emptyBands,
    kIndex: safeKIndex,
    bandIndex: safeBandIndex,
    kValue,
    eCore,
    eValence,
    selectedEnergy,
    eDiff: eValence - eCore,
    shiftedCoreAtK: eCore + f,
    orthoOverlap,
    alphaSmooth,
    lowWaveWeightTrue,
    lowWaveWeightSmooth,
    weightsTrue,
    weightsSmooth,
    cancellation,
    realSpace,
    massProbe,
    eRange,
    bareIonRows
  }
}
