/**
 * Modello derivato della sezione «Metodo k·p»: combina lo stato (parametri
 * interpolati, variante, stato k e banda scelti) usando esclusivamente `physics/`.
 */
import { useMemo } from 'react'
import {
  bandCurvature,
  bandSlope,
  curvatureFromInverseMassRatio,
  effectiveMassRatio,
  intrinsicFermiLevel,
  isEffectiveMassDivergent,
  kDotPPath1D,
  kaneBands,
  kaneConductionFreeParabola,
  kaneEffectiveMasses,
  kaneEnergiesAt,
  kaneMassBreakdown,
  nearlyFreeKpVerification,
  spinOrbitGammaLevels,
  twoBandExactBands,
  twoBandMassBreakdown,
  twoBandParabolicBands,
  twoBandStateAt,
  twoBandValidityLimitK,
  type BandStructure,
  type KaneMasses,
  type KpKaneBandRole,
  type KpVariant,
  type MassBreakdown,
  type NearlyFreeKpSummary,
  type SpinOrbitGammaSummary
} from '../../physics'
import { NUMERICS, PRESETS, type KpMeasuredMasses, type KpParamValues } from './manifest'
import type { KpBandRole, KpTools } from './store'

export interface KpCurveEntry {
  readonly role: KpKaneBandRole
  readonly label: string
  readonly values: Float64Array
  readonly dashed?: boolean
  readonly alpha: number
}

export interface KpSelectionInfo {
  readonly k: number
  readonly role: KpBandRole
  readonly energy: number
  readonly slope: number
  readonly curvature: number
  /** Massa locale dalla curvatura numerica (con segno della concavità d²E/dk²). */
  readonly numericalMassRatio: number
  /** Massa analitica dalla formula del modello attivo (con segno della curvatura d²E/dk²). */
  readonly formulaMassRatio: number
  /** Rapporto |P·k| / (E_g/2): < 1 entro il criterio indicativo parabolico (due bande). */
  readonly pkOverHalfEg: number
  readonly withinValidity: boolean
}

export interface KpModel {
  readonly variant: KpVariant
  /** 0 = Kane, 1 = Due bande esatto (interpolato durante il cambio variante). */
  readonly variantMix: number
  readonly effectiveVariant: KpVariant
  readonly params: KpParamValues
  readonly kRange: readonly [number, number]
  readonly eRange: readonly [number, number]
  readonly kValues: Float64Array
  readonly curves: readonly KpCurveEntry[]
  readonly compareBands: BandStructure | null
  readonly kaneMasses: KaneMasses
  readonly twoBandGammaMasses: { readonly mc: number; readonly mlh: number }
  readonly gammaLevels: SpinOrbitGammaSummary
  readonly breakdown: MassBreakdown
  readonly selection: KpSelectionInfo
  readonly fermiLevel: number | null
  readonly validityLimitK: number | null
  readonly presetMeasured: KpMeasuredMasses | null
  readonly nearlyFreeCheck: NearlyFreeKpSummary
}

export function useKpModel(
  params: KpParamValues,
  variant: KpVariant,
  variantMix: number,
  k: number,
  role: KpBandRole,
  tools: KpTools,
  presetId: string | null
): KpModel {
  const mix = Math.min(1, Math.max(0, variantMix))
  const effectiveVariant: KpVariant = mix < 0.5 ? 'kane' : 'two-band'
  const activeRole: KpBandRole = effectiveVariant === 'two-band' && role === 'so' ? 'lh' : role

  const path = useMemo(() => kDotPPath1D(NUMERICS.kMax, NUMERICS.nPoints), [])
  const kValues = useMemo(() => Float64Array.from(path.points, (pt) => pt[0]), [path])

  const kaneParams = useMemo(() => ({ eg: params.eg, delta: params.delta, ep: params.ep }), [params])
  const twoBandParams = useMemo(() => ({ eg: params.eg, ep: params.ep }), [params.eg, params.ep])

  const kaneBS = useMemo(() => kaneBands(kaneParams, path), [kaneParams, path])
  const twoBandBS = useMemo(() => twoBandExactBands(twoBandParams, path), [twoBandParams, path])

  // Interpola [lh, hh, c] durante la transizione e sfuma la banda split-off
  const curves = useMemo<readonly KpCurveEntry[]>(() => {
    const nPts = kValues.length
    const mixBand = (kaneIdx: number, twoIdx: number): Float64Array => {
      if (mix <= 1e-4) return kaneBS.energies[kaneIdx]
      if (mix >= 1 - 1e-4) return twoBandBS.energies[twoIdx]
      const out = new Float64Array(nPts)
      for (let i = 0; i < nPts; i++) {
        out[i] = (1 - mix) * kaneBS.energies[kaneIdx][i] + mix * twoBandBS.energies[twoIdx][i]
      }
      return out
    }
    const list: KpCurveEntry[] = []
    if (1 - mix > 0.02) {
      list.push({ role: 'so', label: 'so', values: kaneBS.energies[0], alpha: 1 - mix })
    }
    list.push({ role: 'lh', label: 'lh', values: mixBand(1, 0), dashed: true, alpha: 1 })
    list.push({
      role: 'hh',
      label: effectiveVariant === 'two-band' ? 'hh (X,Y)' : 'hh',
      values: mixBand(2, 1),
      alpha: 1
    })
    list.push({ role: 'c', label: 'c', values: mixBand(3, 2), alpha: 1 })
    return list
  }, [kaneBS, twoBandBS, kValues.length, mix, effectiveVariant])

  const compareBands = useMemo(() => {
    if (!tools.compare && mix <= 1e-4) return null
    if (effectiveVariant === 'kane') return kaneConductionFreeParabola(params.eg, path)
    return twoBandParabolicBands(twoBandParams, path)
  }, [tools.compare, mix, effectiveVariant, params.eg, twoBandParams, path])

  // Finestra energetica in Γ: mostra sempre gap E_g, eventuale split-off Δ e parte delle bande,
  // evitando che masse minuscole (es. InSb) schiaccino E_g e Δ con un'escursione di decine di eV.
  const eRange = useMemo<readonly [number, number]>(() => {
    const cExact = twoBandBS.energies[2]
    const topTarget =
      effectiveVariant === 'kane'
        ? Math.min(kaneBS.energies[3][kValues.length - 1], Math.max(params.eg + 1.1, 2.2 * cExact[kValues.length - 1]))
        : Math.min(Math.max(params.eg + 1.0, 1.3 * cExact[kValues.length - 1]), params.eg + 3.2)
    const lowScale =
      effectiveVariant === 'kane'
        ? Math.max(params.delta + 0.55, 0.9 * params.eg, 0.85)
        : Math.max(Math.abs(twoBandBS.energies[0][kValues.length - 1]) * 1.15, 0.8 * params.eg, 0.75)
    const eLo = -Math.min(Math.max(lowScale, 0.85), Math.max(params.delta + 0.8, 2.4))
    const eHi = Math.max(params.eg + 0.75, Math.min(topTarget, Math.max(params.eg + 2.8, 3.6)))
    return [eLo, eHi]
  }, [effectiveVariant, kaneBS, twoBandBS, kValues.length, params.eg, params.delta])

  const kaneMasses = useMemo(() => kaneEffectiveMasses(kaneParams), [kaneParams])
  const twoBandGammaMasses = useMemo(
    () => ({
      mc: twoBandMassBreakdown(twoBandParams, 'c', 0).effectiveMassRatio,
      mlh: twoBandMassBreakdown(twoBandParams, 'lh', 0).effectiveMassRatio
    }),
    [twoBandParams]
  )

  // Livelli in Γ con separazione spin–orbita modulata continuamente in Δ·(1 − mix)
  const gammaLevels = useMemo(
    () => spinOrbitGammaLevels(params.eg, params.delta * (1 - mix)),
    [params.eg, params.delta, mix]
  )

  const breakdown = useMemo(() => {
    if (effectiveVariant === 'kane') {
      return kaneMassBreakdown(kaneParams, activeRole)
    }
    const twoRole = activeRole === 'so' ? 'lh' : activeRole
    return twoBandMassBreakdown(twoBandParams, twoRole, k)
  }, [effectiveVariant, kaneParams, twoBandParams, activeRole, k])

  const selection = useMemo<KpSelectionInfo>(() => {
    const roleIdx = activeRole === 'so' ? 0 : activeRole === 'lh' ? 1 : activeRole === 'hh' ? 2 : 3
    const twoIdx = activeRole === 'c' ? 2 : activeRole === 'hh' ? 1 : 0
    const evalBand = (kv: number): number => {
      if (mix <= 1e-4) return kaneEnergiesAt(kaneParams, kv)[roleIdx]
      if (mix >= 1 - 1e-4) return twoBandStateAt(twoBandParams, kv).energies[twoIdx]
      if (activeRole === 'so') return kaneEnergiesAt(kaneParams, kv)[0]
      return (1 - mix) * kaneEnergiesAt(kaneParams, kv)[roleIdx] + mix * twoBandStateAt(twoBandParams, kv).energies[twoIdx]
    }
    const energy = evalBand(k)
    const slope = bandSlope(evalBand, k)
    const rawNumMass = effectiveMassRatio(evalBand, k)
    const rawNumCurv = bandCurvature(evalBand, k)
    const useExactTwoBand = mix >= 1 - 1e-4
    const numericalMassRatio = useExactTwoBand ? breakdown.effectiveMassRatio : rawNumMass
    const curvature = useExactTwoBand
      ? isEffectiveMassDivergent(breakdown.effectiveMassRatio)
        ? 0
        : curvatureFromInverseMassRatio(breakdown.totalInvMass)
      : isEffectiveMassDivergent(rawNumMass)
        ? 0
        : rawNumCurv
    const twoSt = twoBandStateAt(twoBandParams, k)
    return {
      k,
      role: activeRole,
      energy,
      slope,
      curvature,
      numericalMassRatio,
      formulaMassRatio: breakdown.effectiveMassRatio,
      pkOverHalfEg: twoSt.pkOverHalfEg,
      withinValidity: twoSt.withinValidity
    }
  }, [activeRole, mix, kaneParams, twoBandParams, k, breakdown])

  const validityLimitK = useMemo(
    () => (effectiveVariant === 'two-band' ? twoBandValidityLimitK(params.eg, params.ep) : null),
    [effectiveVariant, params.eg, params.ep]
  )

  const presetMeasured = useMemo(() => PRESETS.find((p) => p.id === presetId)?.measured ?? null, [presetId])

  const nearlyFreeCheck = useMemo(
    () =>
      nearlyFreeKpVerification(
        { a: NUMERICS.nearlyFreeCheck.a, fourier: [NUMERICS.nearlyFreeCheck.vg] },
        undefined,
        1,
        NUMERICS.nearlyFreeCheck.planeWaves
      ),
    []
  )

  return {
    variant,
    variantMix: mix,
    effectiveVariant,
    params,
    kRange: [-NUMERICS.kMax, NUMERICS.kMax],
    eRange,
    kValues,
    curves,
    compareBands,
    kaneMasses,
    twoBandGammaMasses,
    gammaLevels,
    breakdown,
    selection,
    fermiLevel: tools.fill ? intrinsicFermiLevel(params.eg) : null,
    validityLimitK,
    presetMeasured,
    nearlyFreeCheck
  }
}
