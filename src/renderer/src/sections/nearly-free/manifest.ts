/**
 * Manifest della sezione «Elettroni quasi liberi» (dispensa P3 §11):
 * registro dei parametri (id, simbolo, grandezza/colore, unità, intervallo,
 * valore iniziale), preset dei materiali e scelte numeriche.
 */
import type { QuantityId } from '../../ui/theme'

export type ParamId = 'a' | 'vG' | 'v2G'

export interface ParamSpec {
  readonly id: ParamId
  /** Simbolo in TeX. */
  readonly symbol: string
  readonly quantity: QuantityId
  readonly unit: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly initial: number
  readonly digits: number
}

export const PARAMS: readonly ParamSpec[] = [
  { id: 'a', symbol: 'a', quantity: 'a', unit: 'Å', min: 2.5, max: 6, step: 0.01, initial: 3, digits: 2 },
  // V_G con il suo segno; −0,5 eV: ioni attrattivi, come nell'esempio della dispensa (P3 §11.5; P4 §3.2)
  { id: 'vG', symbol: 'V_{G}', quantity: 'VG', unit: 'eV', min: -3, max: 3, step: 0.01, initial: -0.5, digits: 2 },
  { id: 'v2G', symbol: 'V_{2G}', quantity: 'V2G', unit: 'eV', min: -1.5, max: 1.5, step: 0.01, initial: 0, digits: 2 }
]

export type Params = Readonly<Record<ParamId, number>>

export const INITIAL_PARAMS: Params = { a: 3, vG: -0.5, v2G: 0 }

export interface MaterialPreset {
  readonly id: string
  readonly name: string
  /** Passo reticolare (Å). */
  readonly a: number
  /** Gap reale (eV): il preset imposta V_G = −E_g/2. */
  readonly gap: number
}

/** Indicativi: in 1D contano solo il passo e il gap reali (progetto.md, «Preset»). */
export const PRESETS: readonly MaterialPreset[] = [
  { id: 'si', name: 'Silicio', a: 5.43, gap: 1.12 },
  { id: 'ge', name: 'Germanio', a: 5.66, gap: 0.66 },
  { id: 'gaas', name: 'GaAs', a: 5.65, gap: 1.42 },
  { id: 'diamond', name: 'Diamante', a: 3.57, gap: 5.5 }
]

/**
 * Scelte numeriche.
 * - 11 onde piane (n = −5…5): sull'intero intervallo dei cursori le bande sotto
 *   22 eV restano entro 1 meV dal calcolo con 41 onde e m₀/m*₊ = 17,73 della
 *   dispensa è riprodotto (test in physics/convergence.test.ts). Costo misurato
 *   ≈ 4 ms per struttura completa: si ricalcola a ogni fotogramma.
 * - 201 punti in k nella prima zona (dispari: k = 0 incluso).
 * - 7 bande: bastano a riempire la finestra fino a 20 eV anche con a = 6 Å.
 */
export const NUMERICS = {
  planeWaves: 11,
  kPoints: 201,
  bands: 7,
  /** Finestra in k del diagramma (Å⁻¹): fissa, contiene π/a per ogni a ≥ 2,5 Å. */
  kWindow: 1.45,
  /** Energia massima mostrata (eV). */
  eMax: 20,
  /** Finestra in x dello spazio reale (Å) e numero di campioni. */
  xWindow: 9.5,
  xSamples: 481,
  /** Passo della tastiera sullo stato scelto, in unità di π/a. */
  kNudge: 1 / 40,
  /** Aggancio dello stato scelto a k = 0 e ±π/a (in unità di π/a). */
  kSnap: 0.025,
  /** Elettroni per cella dello strumento Riempimento. */
  electrons: { min: 1, max: 4, initial: 2 }
} as const
