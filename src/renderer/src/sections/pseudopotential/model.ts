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
  dominantPlaneWaveWeight,
  emptyLatticeBands,
  evalBlochWavefunction1D,
  gaussianCrystalPotentialZeroMean,
  meanKineticEnergy1D,
  orthogonalityIntegrand1D,
  planeWaveConvergence1D,
  pseudoWavefunctionAndTrue,
  rydbergToEv,
  smoothestAlpha,
  solvePseudoCore1DAtK,
  zonePath1D,
  type BandStructure,
  type CancellationElements,
  type KPath,
  type OrthogonalityProfile,
  type PlaneWaveConvergenceResult
} from '../../physics'
import {
  parityDecomposition1D,
  pseudoCore1DBandsWithStates,
  type ParityDecomposition
} from '../../physics/pseudoCore1d'
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
  readonly psiCoreIm: Float64Array
  readonly psiTrueRe: Float64Array
  readonly psiTrueIm: Float64Array
  readonly psiSmoothRe: Float64Array
  readonly psiSmoothIm: Float64Array
  readonly coreOddWeightCell: number
  readonly smoothOddWeightCell: number
  readonly rc: number
  readonly ortho: OrthogonalityProfile
  readonly eKinIon: number
  readonly eKinMid: number
  readonly eKinCoreIon: number
}

export interface PseudoCoreModel {
  readonly params: PseudoCoreParamValues
  readonly path: KPath
  readonly bands: BandStructure
  readonly shiftedCoreBand: Float64Array
  readonly emptyBands: BandStructure | null
  readonly kIndex: number
  readonly bandIndex: number
  readonly valenceBandForWave: number
  readonly kValue: number
  readonly eCore: number
  readonly eValence: number
  readonly selectedEnergy: number
  readonly eDiff: number
  readonly shiftedCoreAtK: number
  readonly orthoOverlap: number
  readonly alphaSmooth: number
  readonly effectiveAlpha: number
  readonly betaC: number
  readonly isOddState: boolean
  readonly parity: ParityDecomposition
  readonly kineticCore: number
  readonly kineticTrue: number
  readonly kineticSmooth: number
  readonly dominantWeightTrue: number
  readonly dominantWeightSmooth: number
  readonly weightsTrue: Float64Array
  readonly weightsSmooth: Float64Array
  readonly convergence: PlaneWaveConvergenceResult
  readonly cancellation: CancellationElements
  readonly realSpace: PseudoCoreRealSpaceData
  readonly massProbe: PseudoCoreMassProbe | null
  readonly eRange: readonly [number, number]
  readonly bareIonRows: readonly BareIonRow[]
}

function oddWeightFraction(re: Float64Array, im: Float64Array, xGrid: Float64Array): number {
  let evenInt = 0
  let oddInt = 0
  for (let i = 1; i < xGrid.length; i++) {
    const dx = xGrid[i] - xGrid[i - 1]
    evenInt += 0.5 * (re[i - 1] * re[i - 1] + re[i] * re[i]) * dx
    oddInt += 0.5 * (im[i - 1] * im[i - 1] + im[i] * im[i]) * dx
  }
  const tot = evenInt + oddInt
  return tot > 0 ? oddInt / tot : 0
}

export function usePseudoCoreModel(
  params: PseudoCoreParamValues,
  smoothLock: boolean,
  kIndex: number,
  bandIndex: number,
  tools: PseudoCoreTools
): PseudoCoreModel {
  const { a, v0, s, f, alpha } = params

  const path = useMemo(() => zonePath1D(a, NUMERICS.kPoints), [a])

  const pathResult = useMemo(
    () => pseudoCore1DBandsWithStates({ a, v0, s }, path, NUMERICS.numBands, NUMERICS.nHalf),
    [a, v0, s, path]
  )
  const bands = pathResult.bands

  const emptyBands = useMemo(
    () => (tools.compare ? emptyLatticeBands(a, path, NUMERICS.numBands) : null),
    [tools.compare, a, path]
  )

  const safeKIndex = Math.max(0, Math.min(path.points.length - 1, kIndex))
  const safeBandIndex = Math.max(0, Math.min(NUMERICS.numBands - 1, bandIndex))
  const kValue = path.points[safeKIndex][0]
  const stateAtK = pathResult.states[safeKIndex]

  const shiftedCoreBand = useMemo(() => {
    const src = bands.energies[0]
    const out = new Float64Array(src.length)
    for (let i = 0; i < src.length; i++) out[i] = src[i] + f
    return out
  }, [bands.energies, f])

  const cCore = stateAtK.vectors[0]
  // Se l'utente ha selezionato la banda di core (0), mostriamo ψ_k sulla prima banda di valenza (1)
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

  const effectiveAlpha = smoothLock ? alphaSmooth : alpha
  const betaC = -effectiveAlpha

  const { cPseudoRaw, cPseudoNorm } = useMemo(
    () => pseudoWavefunctionAndTrue(cVal, cCore, effectiveAlpha),
    [cVal, cCore, effectiveAlpha]
  )

  const kineticCore = useMemo(
    () => meanKineticEnergy1D(cCore, stateAtK.G, kValue),
    [cCore, stateAtK.G, kValue]
  )
  const kineticTrue = useMemo(
    () => meanKineticEnergy1D(cVal, stateAtK.G, kValue),
    [cVal, stateAtK.G, kValue]
  )
  const kineticSmooth = useMemo(
    () => meanKineticEnergy1D(cPseudoNorm, stateAtK.G, kValue),
    [cPseudoNorm, stateAtK.G, kValue]
  )

  const dominantWeightTrue = useMemo(() => dominantPlaneWaveWeight(cVal), [cVal])
  const dominantWeightSmooth = useMemo(() => dominantPlaneWaveWeight(cPseudoNorm), [cPseudoNorm])

  // Pesi |c_G|² per n = -4..4 (9 componenti centrali)
  const { weightsTrue, weightsSmooth } = useMemo(() => {
    const nDisp = 4
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

  const convergence = useMemo(
    () => planeWaveConvergence1D(stateAtK, valenceBandForWave),
    [stateAtK, valenceBandForWave]
  )

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

  const rc = useMemo(
    () => computeCoreRadius(cCore, stateAtK.G, kValue, a),
    [cCore, stateAtK.G, kValue, a]
  )

  const parity = useMemo(
    () => parityDecomposition1D(cVal, stateAtK.G, kValue, a, rc, 2001),
    [cVal, stateAtK.G, kValue, a, rc]
  )
  const isOddState = parity.evenWeightCell < 1e-8 && Math.abs(alphaSmooth) < 1e-8

  const realSpace = useMemo<PseudoCoreRealSpaceData>(() => {
    const nGrid = 401
    const xGrid = new Float64Array(nGrid)
    const potential = new Float64Array(nGrid)
    const halfCell = 0.5 * a // una cella [-a/2, a/2] centrata sullo ione in x = 0
    for (let i = 0; i < nGrid; i++) {
      const x = -halfCell + (a * i) / (nGrid - 1)
      xGrid[i] = x
      potential[i] = gaussianCrystalPotentialZeroMean(x, { a, v0, s })
    }
    const wCore = evalBlochWavefunction1D(cCore, stateAtK.G, kValue, a, xGrid)
    const wTrue = evalBlochWavefunction1D(cVal, stateAtK.G, kValue, a, xGrid)
    const wSmooth = evalBlochWavefunction1D(cPseudoRaw, stateAtK.G, kValue, a, xGrid)

    const coreOddWeightCell = oddWeightFraction(wCore.re, wCore.im, xGrid)
    const smoothOddWeightCell = oddWeightFraction(wSmooth.re, wSmooth.im, xGrid)
    const ortho = orthogonalityIntegrand1D(wCore.re, wCore.im, wTrue.re, wTrue.im, xGrid)

    const eKinIon = eValence - gaussianCrystalPotentialZeroMean(0, { a, v0, s })
    const eKinMid = eValence - gaussianCrystalPotentialZeroMean(halfCell, { a, v0, s })
    const eKinCoreIon = eCore - gaussianCrystalPotentialZeroMean(0, { a, v0, s })

    return {
      xGrid,
      potential,
      psiCoreRe: wCore.re,
      psiCoreIm: wCore.im,
      psiTrueRe: wTrue.re,
      psiTrueIm: wTrue.im,
      psiSmoothRe: wSmooth.re,
      psiSmoothIm: wSmooth.im,
      coreOddWeightCell,
      smoothOddWeightCell,
      rc,
      ortho,
      eKinIon,
      eKinMid,
      eKinCoreIon
    }
  }, [a, v0, s, cCore, cVal, cPseudoRaw, stateAtK.G, kValue, rc, eValence, eCore])

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
    valenceBandForWave,
    kValue,
    eCore,
    eValence,
    selectedEnergy,
    eDiff: eValence - eCore,
    shiftedCoreAtK: eCore + f,
    orthoOverlap,
    alphaSmooth,
    effectiveAlpha,
    betaC,
    isOddState,
    parity,
    kineticCore,
    kineticTrue,
    kineticSmooth,
    dominantWeightTrue,
    dominantWeightSmooth,
    weightsTrue,
    weightsSmooth,
    convergence,
    cancellation,
    realSpace,
    massProbe,
    eRange,
    bareIonRows
  }
}
