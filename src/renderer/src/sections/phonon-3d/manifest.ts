/**
 * Manifest della sezione «Rami 3D, polarizzazioni e cristalli reali»
 * (dispensa Parte 6: Lezione 2 §§9–10, Fig. 13, §12; Lezione 3 §14, Tab. 1, Figg. 17–18, §19).
 */
import type { Crystal3DId } from '../../physics'
import type { QuantityId } from '../../ui/theme'

export type ParamId = 'transverseRatio' | 'polarRatio'

export interface ParamSpec {
  readonly id: ParamId
  /** Simbolo in TeX. */
  readonly symbol: string
  readonly quantity: QuantityId
  readonly unit: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly digits: number
  /** Vero se lo slider ha effetto solo per cristalli con base p = 2 (rami ottici). */
  readonly requiresOptical?: boolean
}

export const PARAMS: readonly ParamSpec[] = [
  {
    id: 'transverseRatio',
    symbol: 'C_T/C_L',
    quantity: 'C',
    unit: '',
    min: 0.15,
    max: 0.85,
    step: 0.01,
    digits: 2
  },
  {
    id: 'polarRatio',
    symbol: '\\omega_{\\mathrm{LO}}/\\omega_{\\mathrm{TO}}',
    quantity: 'omegaOpt',
    unit: '',
    min: 1.0,
    max: 3.5,
    step: 0.05,
    digits: 2,
    requiresOptical: true
  }
]

export type Params = Readonly<Record<ParamId, number>>

export interface CrystalPreset {
  readonly id: Crystal3DId
  readonly name: string
  readonly subtitle: string
  readonly transverseRatio: number
  readonly polarRatio: number
  readonly defaultUnit: 'THz' | 'meV'
}

/** I tre cristalli reali della Tab. 1 (dispensa Parte 6, §14.4 p. 36). */
export const CRYSTAL_PRESETS: readonly CrystalPreset[] = [
  {
    id: 'pbte',
    name: 'PbTe (NaCl polare, p = 2)',
    subtitle: 'LO 3,3 THz · TO 1,1 THz a Γ',
    transverseRatio: 0.28,
    polarRatio: 3.0,
    defaultUnit: 'THz'
  },
  {
    id: 'aluminum',
    name: 'Alluminio (fcc, p = 1)',
    subtitle: 'LA 40 meV · TA 24 meV a X',
    transverseRatio: 0.36,
    polarRatio: 1.0,
    defaultUnit: 'meV'
  },
  {
    id: 'diamond',
    name: 'Diamante (fcc C–C, p = 2)',
    subtitle: 'ottici degeneri 160 meV a Γ',
    transverseRatio: 0.3,
    polarRatio: 1.0,
    defaultUnit: 'meV'
  }
]

export const INITIAL_CRYSTAL_ID: Crystal3DId = 'pbte'

export const INITIAL_PARAMS: Params = {
  transverseRatio: 0.28,
  polarRatio: 3.0
}

/**
 * Scelte numeriche della sezione:
 * - 40 punti per ciascuno dei 4 tratti Γ–X, X–K, K–Γ, Γ–L (161 punti totali):
 *   vertici esatti agli indici 0 (Γ), 40 (X), 80 (K), 120 (Γ), 160 (L).
 * - N = 8 predefinito per la griglia 2D Born–von Kármán (come Fig. 17, p. 36: N² = 64 punti).
 */
export const NUMERICS = {
  pointsPerSegment: 40,
  totalPoints: 161,
  initialPointIndex: 16, // 0,40 lungo Γ–X ([100]): lunghezza d'onda ben leggibile in 3D
  kNudgePoints: 2,
  defaultBvkN: 8,
  minBvkN: 4,
  maxBvkN: 12
} as const
