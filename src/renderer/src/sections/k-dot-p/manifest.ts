/**
 * Registro di parametri, intervalli, preset e costanti numeriche della
 * sezione «Metodo k·p» (dispensa P4 §3, «Il metodo k·p»).
 */
import type { QuantityId } from '../../ui/theme'

export type KpParamId = 'eg' | 'delta' | 'ep'

export interface KpParamSpec {
  readonly id: KpParamId
  readonly quantity: QuantityId
  readonly symbol: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly digits: number
  readonly unit: string
  readonly default: number
  readonly kaneOnly?: boolean
}

export const PARAMS: readonly KpParamSpec[] = [
  { id: 'eg', quantity: 'VG', symbol: 'E_{g}', min: 0.1, max: 2.5, step: 0.01, digits: 2, unit: 'eV', default: 1.43 },
  {
    id: 'delta',
    quantity: 'psi',
    symbol: '\\Delta',
    min: 0.0,
    max: 1.2,
    step: 0.01,
    digits: 2,
    unit: 'eV',
    default: 0.34,
    kaneOnly: true
  },
  { id: 'ep', quantity: 'v', symbol: 'E_{P}', min: 0.0, max: 30.0, step: 0.5, digits: 1, unit: 'eV', default: 20.0 }
]

export type KpParamValues = Record<KpParamId, number>

export const DEFAULT_PARAMS: KpParamValues = {
  eg: 1.43,
  delta: 0.34,
  ep: 20.0
}

export interface KpMeasuredMasses {
  readonly mc: number | null
  readonly mhh: number | null
  readonly mlh: number | null
  readonly mso: number | null
}

export interface KpPreset {
  readonly id: string
  readonly name: string
  readonly eg: number
  readonly delta: number
  readonly ep: number
  /** Masse misurate dalla dispensa (P4 §3 tabella e esempio, P3 §13.3); null dove non tabulato. */
  readonly measured: KpMeasuredMasses
  readonly indirectNote?: string
}

/**
 * Preset esclusivamente dai dati riportati in dispensa P4 §3 (esempio r. 784–785,
 * tabella r. 790–801, bande calcolate r. 803–813):
 *  - GaAs: E_g = 1,43 eV, Δ = 0,34 eV, E_P = 20 eV (m_c = 0,067; m_hh = 0,5; m_lh = 0,082; m_so = 0,17).
 *  - InSb: E_g = 0,18 eV, Δ = 0,82 eV, E_P = 20 eV (m_c = 0,0145; m_hh = 0,39; m_lh = 0,021; m_so = 0,11).
 *  - Ge:   E_g(Γ) ≈ 1,1 eV (calcolo in Γ, §3 r. 809), Δ = 0,29 eV, E_P = 20 eV (m_hh = 0,34; m_lh = 0,043).
 * Il Si non è incluso perché le dispense riportano solo Δ = 0,044 eV e non E_g(Γ).
 */
export const PRESETS: readonly KpPreset[] = [
  {
    id: 'gaas',
    name: 'GaAs',
    eg: 1.43,
    delta: 0.34,
    ep: 20.0,
    measured: { mc: 0.067, mhh: 0.5, mlh: 0.082, mso: 0.17 }
  },
  {
    id: 'insb',
    name: 'InSb',
    eg: 0.18,
    delta: 0.82,
    ep: 20.0,
    measured: { mc: 0.0145, mhh: 0.39, mlh: 0.021, mso: 0.11 }
  },
  {
    id: 'ge',
    name: 'Ge',
    eg: 1.1,
    delta: 0.29,
    ep: 20.0,
    measured: { mc: null, mhh: 0.34, mlh: 0.043, mso: null },
    indirectNote:
      'Ge: gap indiretto con minimo di conduzione in $L$ ($0{,}66$ eV mis.); in $\\Gamma$ la conduzione è a $\\approx 1{,}1$ eV (§3) e qui si descrive solo l’intorno di $\\Gamma$.'
  }
]

export const DEFAULT_PRESET_ID = 'gaas'

export const NUMERICS = {
  /** Semilarghezza in k attorno a Γ (Å⁻¹): mostra curvatura e distacco P·k ≥ E_g/2 in GaAs e Ge. */
  kMax: 0.12,
  nPoints: 241,
  kStep: 0.005,
  defaultK: 0.04,
  kSnap: 0.015,
  nearlyFreeCheck: {
    a: 3.0,
    vg: -0.5,
    planeWaves: 41
  }
} as const
