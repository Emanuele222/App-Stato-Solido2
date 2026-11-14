/**
 * Modello della sezione «Kronig–Penney»: calcola tutto tramite `physics/`
 * (L(E), livelli della buca finita isolata, bordi di banda, E_n(k), densità
 * esatta |ψ|², banda a coseno, riempimento, massa efficace, reticolo vuoto).
 *
 * Strategia di ricalcolo: le due varianti (`delta` e `rectangular`) hanno
 * memoizzazioni separate sui rispettivi parametri; trascinando un cursore si
 * ricalcola solo la variante attiva (< 1 ms), e al cambio variante entrambi gli
 * stati sono già pronti per la transizione animata continua senza ricalcoli
 * per fotogramma.
 */
import { useMemo } from 'react'
import {
  bandCurvature,
  bandSlope,
  deltaPotentialScaleV0,
  effectiveMassRatio,
  emptyLatticeBands,
  fillBands,
  finiteWellLevels1D,
  groupVelocity,
  kronigBarrierStrength,
  kronigEffectiveP,
  kronigPenneyBandEdges,
  kronigPenneyBandFunction,
  kronigPenneyBands,
  kronigPenneyCosineApproximation,
  kronigPenneyDensity1D,
  kronigPenneyGaps,
  kronigPenneyL,
  kronigPenneyPeriod,
  sampleKronigConditionCurve,
  zoneBoundaryEnergy,
  zoneEdge1D,
  zonePath1D,
  type BandFilling,
  type BandStructure,
  type CosineBandApprox,
  type FiniteWellLevel,
  type KronigBandEdge,
  type KronigGap,
  type KronigPenneySpec,
  type LCurveSample
} from '../../physics'
import { NUMERICS, type DeltaParams, type RectParams } from './manifest'

export interface StateProbe {
  readonly slope: number
  readonly curvature: number
  readonly massRatio: number
  readonly velocity: number
  readonly cosineMassRatio: number
  readonly cosineMinMassRatio: number
}

export interface VariantModel {
  readonly spec: KronigPenneySpec
  readonly a: number
  readonly zoneEdge: number
  readonly E0: number
  readonly deltaV0: number | null
  readonly barrierStrength: number
  readonly effectiveP: number
  readonly kRange: readonly [number, number]
  readonly eRange: readonly [number, number]
  readonly edges: readonly KronigBandEdge[]
  readonly gaps: readonly KronigGap[]
  readonly wellLevels: readonly FiniteWellLevel[]
  readonly bands: BandStructure
  readonly emptyLattice: BandStructure
  readonly lCurve: readonly LCurveSample[]
  readonly cosine: CosineBandApprox
  readonly selection: {
    readonly kFrac: number
    readonly k: number
    readonly band: number
    readonly energy: number
    readonly L: number
    readonly cosineEnergy: number
  }
  readonly density: Float64Array
  readonly filling: BandFilling | null
  readonly probe: StateProbe | null
}

const XS = Float64Array.from(
  { length: NUMERICS.xSamples },
  (_, i) => -NUMERICS.xWindow + (2 * NUMERICS.xWindow * i) / (NUMERICS.xSamples - 1)
)

function adaptivePlotRanges(spec: KronigPenneySpec, a: number, E0: number): {
  kRange: readonly [number, number]
  eRange: readonly [number, number]
} {
  // kMax cresce come 1/a ma con un termine fisso: ±π/a resta sempre dentro e si muove visivamente al variare di a
  const kMax = 1.12 * zoneEdge1D(a) + 0.28
  const v0 = spec.variant === 'rectangular' ? spec.v0 : 0
  const eMax = Math.max(1.4 * v0, 10.5 * E0)
  return {
    kRange: [-kMax, kMax],
    eRange: [-0.04 * eMax, eMax]
  }
}

function useVariantModel(
  spec: KronigPenneySpec,
  kFrac: number,
  requestedBand: number,
  options: {
    readonly fill: boolean
    readonly electrons: number
    readonly mass: boolean
    readonly compare: boolean
  }
): VariantModel {
  const a = kronigPenneyPeriod(spec)
  const zoneEdge = zoneEdge1D(a)
  const path = useMemo(() => zonePath1D(a, NUMERICS.kPoints), [a])

  const structure = useMemo(() => {
    const E0 = zoneBoundaryEnergy(a)
    const edges = kronigPenneyBandEdges(spec, NUMERICS.bands)
    const gaps = kronigPenneyGaps(edges)
    const wellLevels = spec.variant === 'rectangular' ? finiteWellLevels1D(spec.b, spec.v0) : []
    const bands = kronigPenneyBands(spec, path, NUMERICS.bands, edges)
    const ranges = adaptivePlotRanges(spec, a, E0)
    const lCurve = sampleKronigConditionCurve(spec, 0, ranges.eRange[1], edges, NUMERICS.lCurveSamples)
    return {
      E0,
      edges,
      gaps,
      wellLevels,
      bands,
      lCurve,
      kRange: ranges.kRange,
      eRange: ranges.eRange
    }
  }, [spec, a, path])

  const emptyLattice = useMemo(
    () => emptyLatticeBands(a, path, NUMERICS.bands),
    [a, path]
  )

  const band = Math.max(0, Math.min(NUMERICS.bands - 1, requestedBand))
  const cosine = useMemo(
    () => kronigPenneyCosineApproximation(structure.edges, a, band),
    [structure.edges, a, band]
  )

  const state = useMemo(() => {
    const k = kFrac * zoneEdge
    const fn = kronigPenneyBandFunction(spec, band, structure.edges)
    const energy = fn(k)
    const L = kronigPenneyL(spec, energy)
    const density = kronigPenneyDensity1D(spec, k, band, XS, energy)
    return {
      kFrac,
      k,
      band,
      energy,
      L,
      cosineEnergy: cosine.evalAt(k),
      density
    }
  }, [spec, kFrac, zoneEdge, band, structure.edges, cosine])

  const filling = useMemo(
    () => (options.fill ? fillBands(structure.bands, options.electrons) : null),
    [options.fill, options.electrons, structure.bands]
  )

  const probe = useMemo<StateProbe | null>(() => {
    if (!options.mass) return null
    const fn = kronigPenneyBandFunction(spec, band, structure.edges)
    const k = state.k
    const h = Math.min(2e-3, 0.01 * zoneEdge)
    return {
      slope: bandSlope(fn, k, h),
      curvature: bandCurvature(fn, k, h),
      massRatio: effectiveMassRatio(fn, k, h),
      velocity: groupVelocity(fn, k, h),
      cosineMassRatio: cosine.effectiveMassRatioAt(k),
      cosineMinMassRatio: cosine.minMassRatio
    }
  }, [options.mass, spec, band, structure.edges, state.k, zoneEdge, cosine])

  return {
    spec,
    a,
    zoneEdge,
    E0: structure.E0,
    deltaV0: spec.variant === 'delta' ? deltaPotentialScaleV0(spec.a, spec.P) : null,
    barrierStrength: kronigBarrierStrength(spec),
    effectiveP: kronigEffectiveP(spec),
    kRange: structure.kRange,
    eRange: structure.eRange,
    edges: structure.edges,
    gaps: structure.gaps,
    wellLevels: structure.wellLevels,
    bands: structure.bands,
    emptyLattice,
    lCurve: structure.lCurve,
    cosine,
    selection: {
      kFrac: state.kFrac,
      k: state.k,
      band: state.band,
      energy: state.energy,
      L: state.L,
      cosineEnergy: state.cosineEnergy
    },
    density: state.density,
    filling,
    probe
  }
}

export interface KronigPenneyModel {
  readonly xs: Float64Array
  readonly delta: VariantModel
  readonly rect: VariantModel
}

export function useKronigPenneyModel(
  deltaParams: DeltaParams,
  rectParams: RectParams,
  kFrac: number,
  band: number,
  options: {
    readonly fill: boolean
    readonly electrons: number
    readonly mass: boolean
    readonly compare: boolean
  }
): KronigPenneyModel {
  const deltaSpec = useMemo<KronigPenneySpec>(
    () => ({ variant: 'delta', a: deltaParams.a, P: deltaParams.P }),
    [deltaParams.a, deltaParams.P]
  )
  const rectSpec = useMemo<KronigPenneySpec>(
    () => ({ variant: 'rectangular', b: rectParams.b, c: rectParams.c, v0: rectParams.v0 }),
    [rectParams.b, rectParams.c, rectParams.v0]
  )

  const delta = useVariantModel(deltaSpec, kFrac, band, options)
  const rect = useVariantModel(rectSpec, kFrac, band, options)

  return { xs: XS, delta, rect }
}
