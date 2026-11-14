/**
 * Modello della sezione «Reticolo vuoto e schemi di zona»:
 * tutte le grandezze fisiche (stato ripiegato, segmenti di zona, incroci,
 * banda di confronto, onda piana nello spazio reale, riempimento, massa
 * efficace) arrivano da physics/.
 */
import { useMemo } from 'react'
import {
  bandCurvature,
  bandSlope,
  directGap1D,
  effectiveMassRatio,
  emptyLatticeBands,
  emptyLatticeBranchFunction,
  emptyLatticeBranchState1D,
  emptyLatticeCrossings1D,
  groupVelocity,
  nearlyFreeBands,
  planeWaveIonPhaseAngle,
  planeWaveRealPart1D,
  reciprocalVector1D,
  zoneBoundaryEnergy,
  zoneEdge1D,
  zoneFoldingSegments1D,
  zonePath1D,
  fillBands,
  type BandFilling,
  type BandStructure,
  type DirectGap,
  type EmptyLatticeCrossing,
  type FoldedState1D,
  type ZoneFoldingSegment
} from '../../physics'
import { NUMERICS, type Params } from './manifest'

export interface StateProbe {
  readonly slope: number
  readonly curvature: number
  readonly massRatio: number
  readonly velocity: number
}

export interface EmptyLatticeModel {
  readonly a: number
  readonly zoneEdge: number
  readonly G1: number
  readonly E0: number
  readonly crossings: readonly EmptyLatticeCrossing[]
  readonly segments: readonly ZoneFoldingSegment[]
  /** Finestra del diagramma E(k) (eV), adattiva in a. */
  readonly eRange: readonly [number, number]
  /** Finestra del diagramma E(k) (Å⁻¹), adattiva in a. */
  readonly kRange: readonly [number, number]
  readonly reducedBands: BandStructure
  readonly compareBands: BandStructure | null
  readonly compareEdgeGap: DirectGap | null
  readonly selection: FoldedState1D & { readonly kFracReduced: number; readonly kFracExtended: number }
  readonly xs: Float64Array
  readonly waveReal: Float64Array
  readonly ionPhaseAngle: number
  readonly filling: BandFilling | null
  readonly probe: StateProbe | null
}

const XS = Float64Array.from(
  { length: NUMERICS.xSamples },
  (_, i) => -NUMERICS.xWindow + (2 * NUMERICS.xWindow * i) / (NUMERICS.xSamples - 1)
)

export function useEmptyLatticeModel(
  params: Params,
  kFracReduced: number,
  branchN: number,
  options: {
    readonly fill: boolean
    readonly electrons: number
    readonly mass: boolean
    readonly compare: boolean
  }
): EmptyLatticeModel {
  const { a } = params
  const zoneEdge = zoneEdge1D(a)
  const G1 = reciprocalVector1D(a)

  const path = useMemo(() => zonePath1D(a, NUMERICS.kPoints), [a])

  const reducedBands = useMemo(
    () => emptyLatticeBands(a, path, NUMERICS.compareBands),
    [a, path]
  )

  const compareData = useMemo(() => {
    if (!options.compare) return { bands: null, edgeGap: null }
    const pot = { a, fourier: [NUMERICS.compareVG] }
    return {
      bands: nearlyFreeBands(pot, path, {
        planeWaves: NUMERICS.comparePlaneWaves,
        bands: NUMERICS.compareBands
      }),
      edgeGap: directGap1D(pot, zoneEdge, 0, { planeWaves: NUMERICS.comparePlaneWaves })
    }
  }, [options.compare, a, path, zoneEdge])

  const derived = useMemo(() => {
    const E0 = zoneBoundaryEnergy(a)
    // finestra adattiva (manifest): segue a interpolato, 9E₀ e ±3π/a restano dentro
    const eMax = NUMERICS.eMaxOverE0 * E0
    const kMax = NUMERICS.kWindowRef * Math.sqrt(NUMERICS.aWindowRef / a)
    return {
      E0,
      crossings: emptyLatticeCrossings1D(a, 3),
      segments: zoneFoldingSegments1D(a, NUMERICS.maxZones),
      eRange: [-NUMERICS.eMinFrac * eMax, eMax] as const,
      kRange: [-kMax, kMax] as const
    }
  }, [a])

  const selectionData = useMemo(() => {
    const kRed = kFracReduced * zoneEdge
    const state = emptyLatticeBranchState1D(kRed, branchN, a)
    const waveReal = planeWaveRealPart1D(state.kExtended, XS)
    const ionPhaseAngle = planeWaveIonPhaseAngle(state.kReduced, a)
    return {
      selection: {
        ...state,
        kFracReduced,
        kFracExtended: state.kExtended / zoneEdge
      },
      waveReal,
      ionPhaseAngle
    }
  }, [kFracReduced, branchN, a, zoneEdge])

  const filling = useMemo(
    () => (options.fill ? fillBands(reducedBands, options.electrons) : null),
    [options.fill, options.electrons, reducedBands]
  )

  const probe = useMemo<StateProbe | null>(() => {
    if (!options.mass) return null
    const branchFn = emptyLatticeBranchFunction(branchN, a)
    const k = selectionData.selection.kReduced
    return {
      slope: bandSlope(branchFn, k),
      curvature: bandCurvature(branchFn, k),
      massRatio: effectiveMassRatio(branchFn, k),
      velocity: groupVelocity(branchFn, k)
    }
  }, [options.mass, branchN, a, selectionData.selection.kReduced])

  return {
    a,
    zoneEdge,
    G1,
    E0: derived.E0,
    crossings: derived.crossings,
    segments: derived.segments,
    eRange: derived.eRange,
    kRange: derived.kRange,
    reducedBands,
    compareBands: compareData.bands,
    compareEdgeGap: compareData.edgeGap,
    selection: selectionData.selection,
    xs: XS,
    waveReal: selectionData.waveReal,
    ionPhaseAngle: selectionData.ionPhaseAngle,
    filling,
    probe
  }
}
