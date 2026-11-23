/**
 * Manifest della sezione «Catena monatomica e prima zona di Brillouin»
 * (dispensa Parte 6: Lezione 1 §§1–5, Lezione 3 §13).
 * Registro dei parametri (id, simbolo, grandezza/colore, unità, intervallo,
 * valore iniziale), preset e scelte numeriche.
 */
import type { QuantityId } from '../../ui/theme'

export type ParamId = 'a' | 'massAmu' | 'springC'

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
  { id: 'a', symbol: 'a', quantity: 'a', unit: 'Å', min: 2.0, max: 6.0, step: 0.05, initial: 2.5, digits: 2 },
  { id: 'massAmu', symbol: 'M', quantity: 'M', unit: 'u', min: 6, max: 210, step: 0.2, initial: 63.2, digits: 1 },
  { id: 'springC', symbol: 'C', quantity: 'C', unit: 'N/m', min: 2, max: 100, step: 0.5, initial: 20, digits: 1 }
]

export type Params = Readonly<Record<ParamId, number>>

/** Metallo tipico (dispensa Parte 6, Lezione 1 §3, p. 9: M ≈ 1,05·10⁻²⁵ kg ≈ 63,2 u, a = 2,50 Å, C = 20 N/m). */
export const INITIAL_PARAMS: Params = {
  a: 2.5,
  massAmu: 63.2,
  springC: 20
}

export interface MonatomicPreset {
  readonly id: string
  readonly name: string
  /** Passo reticolare a (Å). */
  readonly a: number
  /** Massa atomica M (u). */
  readonly massAmu: number
  /** Costante elastica C (N/m). */
  readonly springC: number
  /** Vero per l'esempio numerico della dispensa §3; falso per i profili 1D illustrativi. */
  readonly fromDispensa: boolean
}

export const PRESETS: readonly MonatomicPreset[] = [
  { id: 'typical-metal', name: 'Metallo tipico (§3)', a: 2.5, massAmu: 63.2, springC: 20, fromDispensa: true },
  { id: 'lead-1d', name: 'Piombo 1D (pesante, molle)', a: 3.5, massAmu: 207.2, springC: 6, fromDispensa: false },
  { id: 'carbon-1d', name: 'Carbonio 1D (leggero, rigido)', a: 2.0, massAmu: 12.0, springC: 90, fromDispensa: false }
]

/**
 * Scelte numeriche della sezione.
 * - 401 punti su [−2π/a, 2π/a] (dispari: k = 0, ±π/a, ±2π/a cadono esattamente su campioni).
 * - 9 atomi visibili nella catena lineare (n = −4…+4) per vedere ≥ 2 lunghezze d'onda a k = π/2a.
 * - Anello di Born–von Kármán con N ∈ [4, 24] (default 10, come Fig. 15 della dispensa).
 */
export const NUMERICS = {
  kPoints: 401,
  /** Finestra orizzontale del diagramma ω(k) in unità di π/a: [−2π/a, +2π/a] (Fig. 3 e Fig. 15). */
  kZonesHalf: 2,
  /** Numero di atomi disegnati nella catena lineare. */
  chainAtoms: 9,
  /** Passo della tastiera sullo stato scelto in modalità continua (in unità di π/a). */
  kNudge: 1 / 40,
  /** Aggancio morbido a k = 0, ±π/2a e ±π/a (in unità di π/a). */
  kSnap: 0.025,
  /** Intervallo di N per le condizioni periodiche di Born–von Kármán. */
  bvk: { min: 4, max: 24, initial: 10 },
  /** Pulsazione massima di riferimento per normalizzare la velocità visiva dell'animazione (metallo tipico). */
  refOmegaMaxRadS: 2.76e13
} as const
