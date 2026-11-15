/**
 * Collegamento fra lo stato della sezione e physics/: tutte le grandezze
 * fisiche mostrate (bande, gap, stato scelto, |ψ|², riempimento, massa
 * efficace) si calcolano qui chiamando il modulo di fisica; l'interfaccia
 * le disegna e basta.
 *
 * Strategia di ricalcolo: i parametri mostrati cambiano a ogni fotogramma
 * durante una transizione; la struttura a bande (201 k × 11 onde piane,
 * ≈ 4 ms) si ricalcola solo quando cambiano (useMemo sui valori), il resto
 * (uno stato, due gap, la sonda) costa microsecondi.
 */
import { useMemo } from 'react'
import {
  bandCurvature,
  bandSlope,
  blochDensity1D,
  centralEquationBand,
  directGap1D,
  dominantPlaneWaves1D,
  effectiveMassRatio,
  emptyLatticeBands,
  fillBands,
  groupVelocity,
  nearlyFreeBands,
  potentialAt,
  solveCentralEquation1D,
  twoWaveGap,
  weakPotentialRatio,
  zoneBoundaryEnergy,
  zoneEdge1D,
  zoneEdgeStandingWave,
  zonePath1D,
  type BandFilling,
  type BandStructure,
  type DirectGap,
  type PeriodicPotential1D,
  type PlaneWaveWeight,
  type StandingWave
} from '../../physics'
import { NUMERICS, type Params } from './manifest'

export interface StateProbe {
  readonly slope: number
  readonly curvature: number
  /** Rapporto m* : m₀ (con segno). */
  readonly massRatio: number
  /** v in m/s. */
  readonly velocity: number
}

export interface NearlyFreeModel {
  readonly potential: PeriodicPotential1D
  readonly zoneEdge: number
  readonly E0: number
  readonly bands: BandStructure
  readonly emptyLattice: BandStructure
  readonly edgeGap: DirectGap
  readonly centerGap: DirectGap
  readonly twoWaveEdgeGap: number
  readonly twoWaveCenterGap: number
  readonly weakPotentialRatio: number
  readonly eRange: readonly [number, number]
  readonly selection: {
    readonly kFrac: number
    readonly k: number
    readonly band: number
    readonly energy: number
    readonly standingWave: StandingWave | null
    readonly atEdge: boolean
    readonly dominantWeights: readonly PlaneWaveWeight[]
  }
  readonly xs: Float64Array
  readonly potentialSamples: Float64Array
  readonly density: Float64Array
  readonly filling: BandFilling | null
  readonly probe: StateProbe | null
}

const XS = Float64Array.from(
  { length: NUMERICS.xSamples },
  (_, i) => -NUMERICS.xWindow + (2 * NUMERICS.xWindow * i) / (NUMERICS.xSamples - 1)
)

export function useNearlyFreeModel(
  params: Params,
  kFrac: number,
  requestedBand: number,
  options: { readonly fill: boolean; readonly electrons: number; readonly mass: boolean }
): NearlyFreeModel {
  const { a, vG, v2G } = params
  const pw = NUMERICS.planeWaves

  const potential = useMemo<PeriodicPotential1D>(() => ({ a, fourier: [vG, v2G] }), [a, vG, v2G])
  const path = useMemo(() => zonePath1D(a, NUMERICS.kPoints), [a])
  const bands = useMemo(
    () => nearlyFreeBands(potential, path, { planeWaves: pw, bands: NUMERICS.bands }),
    [potential, path, pw]
  )
  const emptyLattice = useMemo(() => emptyLatticeBands(a, path, NUMERICS.bands), [a, path])
  const zoneEdge = zoneEdge1D(a)

  const derived = useMemo(() => {
    const E0 = zoneBoundaryEnergy(a)
    const edgeGap = directGap1D(potential, zoneEdge, 0, { planeWaves: pw })
    const centerGap = directGap1D(potential, 0, 1, { planeWaves: pw })
    let lowest = Infinity
    for (const e of bands.energies[0]) lowest = Math.min(lowest, e)
    const eRange: [number, number] = [Math.min(-2, Math.floor(lowest - 1)), NUMERICS.eMax]
    return {
      E0,
      edgeGap,
      centerGap,
      twoWaveEdgeGap: twoWaveGap(vG),
      twoWaveCenterGap: twoWaveGap(v2G),
      weakRatio: weakPotentialRatio(vG, E0),
      eRange
    }
  }, [a, vG, v2G, potential, zoneEdge, bands, pw])

  const state = useMemo(() => {
    const k = kFrac * zoneEdge
    const solution = solveCentralEquation1D(potential, k, { planeWaves: pw })
    // banda mostrata: la richiesta, o la più alta che entra nella finestra in energia
    let band = Math.min(requestedBand, NUMERICS.bands - 1)
    while (band > 0 && solution.energies[band] > NUMERICS.eMax) band--
    const density = blochDensity1D(solution, band, XS)
    const atEdge = Math.abs(kFrac) === 1
    const dominantWeights = dominantPlaneWaves1D(solution, band, 3)
    return {
      kFrac,
      k,
      band,
      energy: solution.energies[band],
      standingWave: atEdge ? zoneEdgeStandingWave(solution, band) : null,
      atEdge,
      dominantWeights,
      density
    }
  }, [kFrac, zoneEdge, potential, pw, requestedBand])

  const potentialSamples = useMemo(() => XS.map((x) => potentialAt(potential, x)), [potential])

  const filling = useMemo(
    () => (options.fill ? fillBands(bands, options.electrons) : null),
    [options.fill, options.electrons, bands]
  )

  const probe = useMemo<StateProbe | null>(() => {
    if (!options.mass) return null
    // base fissa nel punto scelto: derivate per differenze finite senza cambi di base
    const energy = centralEquationBand(potential, state.band, { planeWaves: pw, basisK: state.k })
    return {
      slope: bandSlope(energy, state.k),
      curvature: bandCurvature(energy, state.k),
      massRatio: effectiveMassRatio(energy, state.k),
      velocity: groupVelocity(energy, state.k)
    }
  }, [options.mass, potential, state.band, state.k, pw])

  const { density, ...selection } = state
  return {
    potential,
    zoneEdge,
    E0: derived.E0,
    bands,
    emptyLattice,
    edgeGap: derived.edgeGap,
    centerGap: derived.centerGap,
    twoWaveEdgeGap: derived.twoWaveEdgeGap,
    twoWaveCenterGap: derived.twoWaveCenterGap,
    weakPotentialRatio: derived.weakRatio,
    eRange: derived.eRange,
    selection,
    xs: XS,
    potentialSamples,
    density,
    filling,
    probe
  }
}
