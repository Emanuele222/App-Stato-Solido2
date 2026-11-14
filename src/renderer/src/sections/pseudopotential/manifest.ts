/**
 * Parametri, intervalli, preset e costanti numeriche della sezione
 * «Pseudopotenziale» (dispensa P4 §4, §5.4 e verifica_bande_reali.py).
 */
import type { EpmFormFactors } from '../../physics'
import type { QuantityId } from '../../ui/theme'

export type EpmParamId = 'a' | 'v3s' | 'v8s' | 'v11s'
export type FormFactorId = 'v3s' | 'v8s' | 'v11s'

export interface EpmParamSpec {
  readonly id: EpmParamId
  readonly quantity: QuantityId
  readonly symbol: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly digits: number
  readonly unit: string
  readonly default: number
}

/**
 * Intervalli scelti per contenere tutta la tabella dei fattori di forma
 * simmetrici in P4 §4 (r. 1105–1113: V₃ˢ ∈ [−0,27; −0,211], V₈ˢ ∈ [−0,015; +0,04],
 * V₁₁ˢ ∈ [+0,035; +0,083] Ry) e includere i passi reticolari di Si e GaAs (e
 * gli altri semiconduttori della colonna diamante/zincoblenda, oltre al limite 0).
 */
export const PARAMS: readonly EpmParamSpec[] = [
  { id: 'a', quantity: 'a', symbol: 'a', min: 5.0, max: 6.6, step: 0.01, digits: 2, unit: 'Å', default: 5.43 },
  { id: 'v3s', quantity: 'VG', symbol: 'V_3^s', min: -0.35, max: 0.0, step: 0.005, digits: 3, unit: 'Ry', default: -0.21 },
  { id: 'v8s', quantity: 'VG', symbol: 'V_8^s', min: -0.08, max: 0.12, step: 0.005, digits: 3, unit: 'Ry', default: 0.04 },
  { id: 'v11s', quantity: 'VG', symbol: 'V_{11}^s', min: -0.05, max: 0.15, step: 0.005, digits: 3, unit: 'Ry', default: 0.08 }
]

export type EpmParamValues = Record<EpmParamId, number>

export interface AntisymmetricFactors {
  readonly v3a: number
  readonly v4a: number
  readonly v11a: number
}

export interface EpmPreset {
  readonly id: 'si' | 'gaas'
  readonly name: string
  readonly params: EpmParamValues
  readonly antisymmetric: AntisymmetricFactors | null
  readonly measuredGapEv: number
  readonly measuredGapKind: 'diretto' | 'indiretto'
  /** Massa efficace misurata della conduzione in Γ (in unità di m₀), se disponibile (P4 §4, r. 1201). */
  readonly measuredGammaMass: number | null
  readonly kpEpEv: number | null
}

/**
 * Preset esclusivamente da verifica_bande_reali.py (r. 140–141) e P4 §5.4 (r. 1484–1488).
 * Ge e gli altri materiali della tabella §4 restano fuori perché il passo reticolare
 * del Ge manca nelle dispense e gli altri composti mancano dei fattori antisimmetrici.
 */
export const PRESETS: readonly EpmPreset[] = [
  {
    id: 'si',
    name: 'Si',
    params: { a: 5.43, v3s: -0.21, v8s: 0.04, v11s: 0.08 },
    antisymmetric: null,
    measuredGapEv: 1.12,
    measuredGapKind: 'indiretto',
    measuredGammaMass: null,
    kpEpEv: null
  },
  {
    id: 'gaas',
    name: 'GaAs',
    params: { a: 5.65, v3s: -0.252, v8s: 0.0, v11s: 0.08 },
    antisymmetric: { v3a: 0.068, v4a: 0.066, v11a: 0.012 },
    measuredGapEv: 1.42,
    measuredGapKind: 'diretto',
    measuredGammaMass: 0.067,
    kpEpEv: 20.0
  }
]

export const DEFAULT_ANTISYMMETRIC: AntisymmetricFactors = {
  v3a: 0.068,
  v4a: 0.066,
  v11a: 0.012
}

export function buildFormFactors(
  params: EpmParamValues,
  antisymmetric: AntisymmetricFactors | null,
  antisymmetricOn: boolean
): EpmFormFactors {
  const va = antisymmetricOn && antisymmetric ? antisymmetric : null
  return {
    v3s: params.v3s,
    v8s: params.v8s,
    v11s: params.v11s,
    v3a: va ? va.v3a : 0,
    v4a: va ? va.v4a : 0,
    v11a: va ? va.v11a : 0
  }
}

export const NUMERICS = {
  fullGMaxSq: 21, // 113 onde piane
  fullPointsPerSegment: 40, // 201 punti lungo L–Γ–X–W–K–Γ
  fastGMaxSq: 11, // 51 onde piane (include gusci 3, 8, 11 per aggiornamento reattivo in trascinamento)
  fastPointsPerSegment: 10, // 51 punti totali (~20–30 ms)
  numBands: 8,
  defaultPointIndex: 40, // Γ
  defaultBandIndex: 4, // fondo conduzione
  siBareIonA: 5.431, // P4 §4 r. 905
  siBareIonZ: 14
} as const
