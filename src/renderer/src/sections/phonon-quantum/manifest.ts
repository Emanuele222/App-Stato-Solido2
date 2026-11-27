/**
 * Manifest della sezione «Modi quantizzati (fononi) e processi Umklapp»
 * (dispensa Parte 6: Lezione 2 §11 eqq. 29–30; Lezione 3 §§15–18, Figg. 19–21).
 */
import { TYPICAL_METAL_MASS_AMU } from '../../physics'
import type { QuantityId } from '../../ui/theme'

export type SectionMode = 'quantization' | 'umklapp'
export type QuantizationSource = 'level' | 'thermal'

export type QuantParamId = 'n' | 'temperatureK' | 'freqThz'
export type UmklappParamId = 'k1Frac' | 'k2Frac'

export type QuantParams = Readonly<Record<QuantParamId, number>>

export type UmklappParams = Readonly<Record<UmklappParamId, number>>

export interface QuantParamSpec {
  readonly id: QuantParamId
  readonly symbol: string
  readonly quantity: QuantityId
  readonly unit: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly digits: number
}

export interface UmklappParamSpec {
  readonly id: UmklappParamId
  readonly symbol: string
  readonly quantity: QuantityId
  readonly unit: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly digits: number
}

export const QUANT_PARAMS: readonly QuantParamSpec[] = [
  { id: 'n', symbol: 'n', quantity: 'psi', unit: '', min: 0, max: 25, step: 1, digits: 0 },
  { id: 'temperatureK', symbol: 'T', quantity: 'T', unit: 'K', min: 10, max: 1000, step: 5, digits: 0 },
  { id: 'freqThz', symbol: '\\nu', quantity: 'omega', unit: 'THz', min: 1.0, max: 12.0, step: 0.1, digits: 1 }
]

export const UMKLAPP_PARAMS: readonly UmklappParamSpec[] = [
  { id: 'k1Frac', symbol: 'k_1', quantity: 'k', unit: 'π/a', min: -0.95, max: 1.0, step: 0.05, digits: 2 },
  { id: 'k2Frac', symbol: 'k_2', quantity: 'k', unit: 'π/a', min: -0.95, max: 1.0, step: 0.05, digits: 2 }
]

export const INITIAL_QUANT_PARAMS: QuantParams = {
  n: 0,
  temperatureK: 300,
  freqThz: 4.4
}

export const INITIAL_UMKLAPP_PARAMS: UmklappParams = {
  k1Frac: 0.7,
  k2Frac: 0.6
}

export interface QuantPreset {
  readonly id: string
  readonly name: string
  readonly source: QuantizationSource
  readonly params: QuantParams
}

export const QUANT_PRESETS: readonly QuantPreset[] = [
  {
    id: 'ground',
    name: 'Punto zero (n = 0)',
    source: 'level',
    params: { n: 0, temperatureK: 300, freqThz: 4.4 }
  },
  {
    id: 'excited-2',
    name: 'Eccitato (n = 2)',
    source: 'level',
    params: { n: 2, temperatureK: 300, freqThz: 4.4 }
  },
  {
    id: 'bohr-20',
    name: 'Limite Bohr (n = 20)',
    source: 'level',
    params: { n: 20, temperatureK: 300, freqThz: 4.4 }
  },
  {
    id: 'thermal-300',
    name: 'Bagno termico 300 K',
    source: 'thermal',
    params: { n: 0, temperatureK: 300, freqThz: 4.4 }
  },
  {
    id: 'thermal-30',
    name: 'Modo congelato 30 K',
    source: 'thermal',
    params: { n: 0, temperatureK: 30, freqThz: 4.4 }
  }
]

export interface UmklappPreset {
  readonly id: string
  readonly name: string
  readonly params: UmklappParams
}

export const UMKLAPP_PRESETS: readonly UmklappPreset[] = [
  {
    id: 'umklapp-dispensa',
    name: 'Umklapp dispensa §16 (0,7 + 0,6 π/a)',
    params: { k1Frac: 0.7, k2Frac: 0.6 }
  },
  {
    id: 'normal-dispensa',
    name: 'Normale in 1BZ (0,3 + 0,4 π/a)',
    params: { k1Frac: 0.3, k2Frac: 0.4 }
  },
  {
    id: 'umklapp-neg',
    name: 'Umklapp verso destra (−0,7 − 0,6 π/a)',
    params: { k1Frac: -0.7, k2Frac: -0.6 }
  },
  {
    id: 'opposite',
    name: 'Scontro opposto (0,6 − 0,4 π/a)',
    params: { k1Frac: 0.6, k2Frac: -0.4 }
  },
  {
    id: 'zone-edge',
    name: 'Bordo di zona (0,5 + 0,5 π/a)',
    params: { k1Frac: 0.5, k2Frac: 0.5 }
  }
]

/**
 * Parametri di riferimento del metallo tipico dalla dispensa (§3 p. 9 e §18.4 p. 47):
 * M = 1,05·10⁻²⁵ kg (≈ 63,23 u), a = 2,50 Å, C = 20 N/m (ν_max ≈ 4,39 THz).
 */
export const REFERENCE_CRYSTAL = {
  a: 2.5,
  massAmu: TYPICAL_METAL_MASS_AMU,
  springC: 20
} as const

export const NUMERICS = {
  /** Punti per il campionamento delle curve P_n(u) e P_cl(u). */
  oscillatorPoints: 481,
  /** Numero di atomi visibili nella catena sincronizzata della Modalità A. */
  chainAtoms: 7,
  /** Massima molteplicità di livello n mostrata nell'istogramma termico p_n(T). */
  maxThermalBars: 18,
  /** Punti di campionamento della curva di dispersione ω(k) in Modalità B. */
  dispersionPoints: 321,
  /** Passo tastiera per i vettori k₁, k₂ in unità di π/a. */
  kNudge: 0.05,
  /** Aggancio morbido vicino ai valori notevoli nella 1BZ. */
  kSnap: 0.02,
  /** Frequenza di riferimento (THz) per normalizzare la velocità dell'animazione. */
  refFreqThz: 4.4
} as const
