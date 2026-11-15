/**
 * Collegamento tra stato Zustand e physics/tightBinding.ts.
 * Nessun calcolo fisico qui: usa zoneEdge1D, kFromZoneFraction,
 * blochSiteRealAmplitude e i calcolatori di physics/.
 */
import { useMemo } from 'react'
import {
  alignBandStructureBottom,
  bandCurvature,
  bandSlope,
  blochSiteRealAmplitude,
  cosineBandExtremumMassRatio,
  diatomicApproxBandwidth,
  diatomicBondingCharacter,
  diatomicCenterSeparation,
  diatomicExactBandwidth,
  diatomicGapAtZoneEdge,
  diatomicGapEffectiveMassRatio,
  diatomicStateAt,
  diatomicWaveSamples,
  effectiveMassRatio,
  fillBands,
  groupVelocity,
  kFromZoneFraction,
  monoatomicBandSummary,
  monoatomicBondingCharacter,
  monoatomicCenterSeparation,
  monoatomicEdgesVsDistance,
  monoatomicEnergiesAt,
  monoatomicGapAtZoneEdge,
  monoatomicWaveSamples,
  nearlyFreeBands,
  tightBindingDiatomicBands,
  tightBindingMonoatomicBands,
  zoneEdge1D,
  zonePath1D,
  type BandFilling,
  type BandStructure,
  type BondingCharacter,
  type TightBindingEdgePoint,
  type TightBindingWaveSamples
} from '../../physics'
import { INDICATIVE_DISTANCE_LAW, NUMERICS, type DiatomicParams, type MonoParams, type TightBindingVariant } from './manifest'

export interface ExtBadge {
  readonly k: number
  readonly energy: number
  readonly label: string
  readonly kind: 'bonding' | 'antibonding'
  readonly position: 'above' | 'below'
}

export interface MonoSiteSample {
  readonly x: number
  readonly rePhase: number
}

export interface DiatomicSiteSample {
  readonly x: number
  readonly kind: 'A' | 'B'
  readonly amp: number
  readonly signRe: number
}

export interface TightBindingModel {
  readonly mix: number
  readonly effectiveVariant: TightBindingVariant
  readonly aEff: number
  readonly zoneEdge: number
  readonly bands: BandStructure
  readonly compareBands: BandStructure | null
  readonly eRange: readonly [number, number]
  readonly levels: readonly {
    readonly energy: number
    readonly label: string
  }[]
  readonly gapAtPi: {
    readonly lower: number
    readonly upper: number
    readonly value: number
    readonly label: string
  }
  readonly centerSeparation: number
  readonly extBadges: readonly ExtBadge[]
  readonly mono: {
    readonly s: ReturnType<typeof monoatomicBandSummary>
    readonly p: ReturnType<typeof monoatomicBandSummary>
    readonly edgesVsA: readonly TightBindingEdgePoint[] | null
    readonly sites: readonly MonoSiteSample[]
  }
  readonly diatomic: {
    readonly exactWidth: number
    readonly approxWidth: number
    readonly massC: number
    readonly massV: number
    readonly bA2: number
    readonly bB2: number
    readonly weightsAll: readonly DiatomicSiteSample[]
  }
  readonly monoMassAnalytic: {
    readonly sBottom: number
    readonly sTop: number
    readonly pBottom: number
    readonly pTop: number
  }
  readonly selection: {
    readonly kFrac: number
    readonly k: number
    readonly band: 0 | 1
    readonly energy: number
    readonly character: BondingCharacter
  }
  readonly xs: Float64Array
  readonly wave: TightBindingWaveSamples
  readonly filling: BandFilling | null
  readonly probe: {
    readonly slope: number
    readonly curvature: number
    readonly massRatio: number
    readonly velocity: number
  } | null
}

const XS = Float64Array.from(
  { length: NUMERICS.xSamples },
  (_, i) => -NUMERICS.xWindow + (2 * NUMERICS.xWindow * i) / (NUMERICS.xSamples - 1)
)

const A_SAMPLES = Array.from({ length: 49 }, (_, i) => 2.0 + (4.0 * i) / 48)

export function useTightBindingModel(
  monoParams: MonoParams,
  diatomicParams: DiatomicParams,
  variantMix: number,
  activeVariant: TightBindingVariant,
  kFrac: number,
  band: 0 | 1,
  options: {
    readonly linkDistance: boolean
    readonly tRefAtA0: { readonly tS: number; readonly absTP: number }
    readonly fill: boolean
    readonly electrons: number
    readonly mass: boolean
    readonly compare: boolean
  }
): TightBindingModel {
  const mix = Math.min(1, Math.max(0, variantMix))
  const effectiveVariant: TightBindingVariant = mix < 0.5 ? 'monoatomic' : 'diatomic'
  const aEff = (1 - mix) * monoParams.a + mix * diatomicParams.a
  const zoneEdge = zoneEdge1D(aEff)
  const k = kFromZoneFraction(kFrac, aEff)

  const monoPhysics = useMemo(
    () => ({
      a: monoParams.a,
      centerS: monoParams.centerS,
      centerP: monoParams.centerP,
      tS: monoParams.tS,
      absTP: monoParams.absTP
    }),
    [monoParams.a, monoParams.centerS, monoParams.centerP, monoParams.tS, monoParams.absTP]
  )

  const diatPhysics = useMemo(
    () => ({
      a: diatomicParams.a,
      eA: diatomicParams.eA,
      eB: Math.max(diatomicParams.eA, diatomicParams.eB),
      t: diatomicParams.t
    }),
    [diatomicParams.a, diatomicParams.eA, diatomicParams.eB, diatomicParams.t]
  )

  const bands = useMemo(() => {
    const path = zonePath1D(aEff, NUMERICS.kPoints)
    if (mix <= 1e-4) {
      return tightBindingMonoatomicBands(monoPhysics, path)
    }
    if (mix >= 1 - 1e-4) {
      return tightBindingDiatomicBands(diatPhysics, path)
    }
    const pathMono = zonePath1D(monoPhysics.a, NUMERICS.kPoints)
    const pathDiat = zonePath1D(diatPhysics.a, NUMERICS.kPoints)
    const bM = tightBindingMonoatomicBands(monoPhysics, pathMono)
    const bD = tightBindingDiatomicBands(diatPhysics, pathDiat)
    const e0 = new Float64Array(NUMERICS.kPoints)
    const e1 = new Float64Array(NUMERICS.kPoints)
    for (let i = 0; i < NUMERICS.kPoints; i++) {
      e0[i] = (1 - mix) * bM.energies[0][i] + mix * bD.energies[0][i]
      e1[i] = (1 - mix) * bM.energies[1][i] + mix * bD.energies[1][i]
    }
    return {
      method: 'tight-binding' as const,
      path,
      energies: [e0, e1]
    }
  }, [aEff, mix, monoPhysics, diatPhysics])

  const lowestBottom = useMemo(() => {
    let m = Infinity
    for (const v of bands.energies[0]) if (v < m) m = v
    return m
  }, [bands])

  const compareBands = useMemo(() => {
    if (!options.compare) return null
    const path = bands.path
    const nf = nearlyFreeBands({ a: aEff, fourier: [NUMERICS.compareVG] }, path, {
      planeWaves: NUMERICS.comparePlaneWaves,
      bands: 2
    })
    return alignBandStructureBottom(nf, lowestBottom)
  }, [options.compare, bands.path, aEff, lowestBottom])

  const eRange = useMemo<readonly [number, number]>(() => {
    let lo = Infinity
    let hi = -Infinity
    for (const b of bands.energies) {
      for (const v of b) {
        if (v < lo) lo = v
        if (v > hi) hi = v
      }
    }
    if (compareBands) {
      for (const b of compareBands.energies) {
        for (const v of b) {
          if (v < lo) lo = v
          if (v > hi) hi = Math.max(hi, Math.min(v, hi + 4))
        }
      }
    }
    const span = Math.max(2, hi - lo)
    return [lo - 0.16 * span, hi + 0.2 * span]
  }, [bands, compareBands])

  const sSum = useMemo(() => monoatomicBandSummary(monoPhysics.centerS, monoPhysics.tS), [monoPhysics])
  const pSum = useMemo(() => monoatomicBandSummary(monoPhysics.centerP, -monoPhysics.absTP), [monoPhysics])

  const edgesVsA = useMemo(() => {
    if (!options.linkDistance) return null
    return monoatomicEdgesVsDistance(A_SAMPLES, {
      centerS: monoPhysics.centerS,
      centerP: monoPhysics.centerP,
      tSAtA0: options.tRefAtA0.tS,
      absTPAtA0: options.tRefAtA0.absTP,
      a0: INDICATIVE_DISTANCE_LAW.a0,
      ell: INDICATIVE_DISTANCE_LAW.ell
    })
  }, [options.linkDistance, monoPhysics.centerS, monoPhysics.centerP, options.tRefAtA0.tS, options.tRefAtA0.absTP])

  const kMono = kFromZoneFraction(kFrac, monoPhysics.a)
  const kDiat = kFromZoneFraction(kFrac, diatPhysics.a)
  const monoEnergyAtSel = monoatomicEnergiesAt(monoPhysics, kMono)
  const diatStateAtSel = diatomicStateAt(diatPhysics, kDiat)
  const selEnergy =
    mix <= 1e-4
      ? monoEnergyAtSel[band]
      : mix >= 1 - 1e-4
        ? diatStateAtSel.energies[band]
        : (1 - mix) * monoEnergyAtSel[band] + mix * diatStateAtSel.energies[band]

  const monoGap = monoatomicGapAtZoneEdge(monoPhysics)
  const diatGap = diatomicGapAtZoneEdge(diatPhysics)
  const monoCenterSep = monoatomicCenterSeparation(monoPhysics)
  const diatCenterSep = diatomicCenterSeparation(diatPhysics)

  const levels =
    effectiveVariant === 'monoatomic'
      ? [
          { energy: monoPhysics.centerS, label: 'Ē_{s}' },
          { energy: monoPhysics.centerP, label: 'Ē_{p}' }
        ]
      : [
          { energy: diatPhysics.eA, label: 'E_{A}' },
          { energy: diatPhysics.eB, label: 'E_{B}' }
        ]

  const gapAtPi =
    effectiveVariant === 'monoatomic'
      ? {
          lower: sSum.max,
          upper: pSum.min,
          value: monoGap,
          label: 'E_{g}'
        }
      : {
          lower: diatPhysics.eA,
          upper: diatPhysics.eB,
          value: diatGap,
          label: 'E_{B} − E_{A}'
        }

  const extBadges: readonly ExtBadge[] = useMemo(() => {
    if (effectiveVariant === 'monoatomic') {
      const kb = zoneEdge1D(monoPhysics.a)
      const [es0, ep0] = monoatomicEnergiesAt(monoPhysics, 0)
      const [esPi, epPi] = monoatomicEnergiesAt(monoPhysics, kb)
      // Lato esterno rispetto all'altra banda in k = −π/a: se s è sotto p, la pillola s va sotto (all'interno dell'arco s) e p sopra.
      const sBelowAtPi = esPi <= epPi
      return [
        { k: 0, energy: es0, label: 'legante', kind: 'bonding', position: es0 <= ep0 ? 'below' : 'above' },
        { k: 0, energy: ep0, label: 'antilegante', kind: 'antibonding', position: ep0 >= es0 ? 'above' : 'below' },
        { k: -kb, energy: esPi, label: 'antilegante', kind: 'antibonding', position: sBelowAtPi ? 'below' : 'above' },
        { k: -kb, energy: epPi, label: 'legante', kind: 'bonding', position: sBelowAtPi ? 'above' : 'below' }
      ]
    }
    const kb = zoneEdge1D(diatPhysics.a)
    const st0 = diatomicStateAt(diatPhysics, 0)
    const stPi = diatomicStateAt(diatPhysics, kb)
    return [
      { k: 0, energy: st0.energies[0], label: 'legante', kind: 'bonding', position: 'below' },
      { k: 0, energy: st0.energies[1], label: 'antilegante', kind: 'antibonding', position: 'above' },
      { k: -kb, energy: stPi.energies[0], label: 'solo A', kind: 'bonding', position: 'below' },
      { k: -kb, energy: stPi.energies[1], label: 'solo B', kind: 'antibonding', position: 'above' }
    ]
  }, [effectiveVariant, monoPhysics, diatPhysics])

  const character: BondingCharacter =
    effectiveVariant === 'monoatomic'
      ? monoatomicBondingCharacter(band === 0 ? 's' : 'p', kMono, monoPhysics.a)
      : diatomicBondingCharacter(band, kDiat, diatPhysics)

  const wave = useMemo<TightBindingWaveSamples>(() => {
    if (effectiveVariant === 'monoatomic') {
      return monoatomicWaveSamples(monoPhysics.a, kMono, band === 0 ? 's' : 'p', XS)
    }
    return diatomicWaveSamples(diatPhysics, kDiat, band, XS)
  }, [effectiveVariant, monoPhysics.a, diatPhysics, kMono, kDiat, band])

  const filling = useMemo<BandFilling | null>(() => {
    if (!options.fill) return null
    const maxElectrons = activeVariant === 'diatomic' ? 2 : NUMERICS.electrons.max
    const nEl = Math.min(options.electrons, maxElectrons)
    return fillBands(bands, nEl)
  }, [options.fill, options.electrons, activeVariant, bands])

  const probe = useMemo(() => {
    if (!options.mass) return null
    const fn =
      effectiveVariant === 'monoatomic'
        ? (kk: number) => monoatomicEnergiesAt(monoPhysics, kk)[band]
        : (kk: number) => diatomicStateAt(diatPhysics, kk).energies[band]
    const kEval = effectiveVariant === 'monoatomic' ? kMono : kDiat
    return {
      slope: bandSlope(fn, kEval),
      curvature: bandCurvature(fn, kEval),
      massRatio: effectiveMassRatio(fn, kEval),
      velocity: groupVelocity(fn, kEval)
    }
  }, [options.mass, effectiveVariant, monoPhysics, diatPhysics, band, kMono, kDiat])

  const monoSites = useMemo(() => {
    const sites: MonoSiteSample[] = []
    const nMax = Math.ceil(NUMERICS.xWindow / monoPhysics.a) + 1
    for (let n = -nMax; n <= nMax; n++) {
      const x = n * monoPhysics.a
      if (Math.abs(x) <= NUMERICS.xWindow + monoPhysics.a * 0.6) {
        sites.push({ x, rePhase: blochSiteRealAmplitude(kMono, x, 1) })
      }
    }
    return sites
  }, [monoPhysics.a, kMono])

  const selW = diatStateAtSel.weights[band]
  const weightsAll = useMemo(() => {
    const sites: DiatomicSiteSample[] = []
    const nMax = Math.ceil(NUMERICS.xWindow / diatPhysics.a) + 1
    for (let n = -nMax; n <= nMax; n++) {
      const xA = n * diatPhysics.a
      if (Math.abs(xA) <= NUMERICS.xWindow + diatPhysics.a * 0.4) {
        sites.push({
          x: xA,
          kind: 'A',
          amp: Math.abs(selW.bA),
          signRe: blochSiteRealAmplitude(kDiat, xA, selW.bA)
        })
      }
      const xB = (n + 0.5) * diatPhysics.a
      if (Math.abs(xB) <= NUMERICS.xWindow + diatPhysics.a * 0.4) {
        sites.push({
          x: xB,
          kind: 'B',
          amp: Math.abs(selW.bB),
          signRe: blochSiteRealAmplitude(kDiat, xB, selW.bB)
        })
      }
    }
    return sites
  }, [diatPhysics.a, kDiat, selW.bA, selW.bB])

  return {
    mix,
    effectiveVariant,
    aEff,
    zoneEdge,
    bands,
    compareBands,
    eRange,
    levels,
    gapAtPi,
    centerSeparation: effectiveVariant === 'monoatomic' ? monoCenterSep : diatCenterSep,
    extBadges,
    mono: { s: sSum, p: pSum, edgesVsA, sites: monoSites },
    diatomic: {
      exactWidth: diatomicExactBandwidth(diatPhysics),
      approxWidth: diatomicApproxBandwidth(diatPhysics),
      massC: diatomicGapEffectiveMassRatio(diatPhysics, 1),
      massV: diatomicGapEffectiveMassRatio(diatPhysics, 0),
      bA2: selW.bA2,
      bB2: selW.bB2,
      weightsAll
    },
    monoMassAnalytic: {
      sBottom: cosineBandExtremumMassRatio(monoPhysics.tS, monoPhysics.a, 'bottom'),
      sTop: cosineBandExtremumMassRatio(monoPhysics.tS, monoPhysics.a, 'top'),
      pBottom: cosineBandExtremumMassRatio(monoPhysics.absTP, monoPhysics.a, 'bottom'),
      pTop: cosineBandExtremumMassRatio(monoPhysics.absTP, monoPhysics.a, 'top')
    },
    selection: { kFrac, k, band, energy: selEnergy, character },
    xs: XS,
    wave,
    filling,
    probe
  }
}
