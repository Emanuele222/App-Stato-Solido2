/**
 * Manifest della sezione «Catena biatomica, gap fononico e luce infrarossa»
 * (dispensa Parte 6: Lezione 2 §§7–8 e §10.3; Lezione 4 §24).
 * Registro dei parametri (id, simbolo, grandezza/colore, unità, intervallo,
 * valore iniziale), preset e scelte numeriche.
 */
import type { QuantityId } from '../../ui/theme'

export type ParamId = 'a' | 'massHeavyAmu' | 'massLightAmu' | 'springC'

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
  { id: 'a', symbol: 'a', quantity: 'a', unit: 'Å', min: 3.0, max: 7.0, step: 0.02, initial: 5.64, digits: 2 },
  { id: 'massHeavyAmu', symbol: 'M', quantity: 'M', unit: 'u', min: 6, max: 210, step: 0.1, initial: 35.5, digits: 1 },
  { id: 'massLightAmu', symbol: 'm', quantity: 'm', unit: 'u', min: 6, max: 210, step: 0.1, initial: 23.0, digits: 1 },
  { id: 'springC', symbol: 'C', quantity: 'C', unit: 'N/m', min: 2, max: 80, step: 0.5, initial: 10, digits: 1 }
]

export type Params = Readonly<Record<ParamId, number>>

/** Coppia Na–Cl (dispensa Parte 6, Lezione 2 §8 p. 23 e Lezione 4 §24 p. 60). */
export const INITIAL_PARAMS: Params = {
  a: 5.64,
  massHeavyAmu: 35.5,
  massLightAmu: 23.0,
  springC: 10
}

export interface DiatomicPreset {
  readonly id: string
  readonly name: string
  /** Passo del reticolo di Bravais a (Å). */
  readonly a: number
  /** Massa atomo sui siti pari M (u). */
  readonly massHeavyAmu: number
  /** Massa atomo sui siti dispari m (u). */
  readonly massLightAmu: number
  /** Costante elastica C (N/m). */
  readonly springC: number
  /** Vero per la coppia numerica della dispensa §8; falso per i profili illustrativi. */
  readonly fromDispensa: boolean
}

export const PRESETS: readonly DiatomicPreset[] = [
  {
    id: 'nacl-pair',
    name: 'Coppia Na–Cl (§8)',
    a: 5.64,
    massHeavyAmu: 35.5,
    massLightAmu: 23.0,
    springC: 10,
    fromDispensa: true
  },
  {
    id: 'mass-ratio-2',
    name: 'Masse M = 2m (Fig. 11)',
    a: 5.0,
    massHeavyAmu: 40.0,
    massLightAmu: 20.0,
    springC: 10,
    fromDispensa: false
  },
  {
    id: 'equal-masses',
    name: 'Limite M = m (gap chiuso)',
    a: 5.64,
    massHeavyAmu: 29.0,
    massLightAmu: 29.0,
    springC: 10,
    fromDispensa: false
  },
  {
    id: 'lii-contrast',
    name: 'Contrasto forte (Li–I)',
    a: 6.0,
    massHeavyAmu: 126.9,
    massLightAmu: 6.9,
    springC: 10,
    fromDispensa: false
  }
]

/**
 * Scelte numeriche della sezione.
 * - 241 punti su [−π/a, +π/a] (e 401 su [−2π/a, +2π/a] con Confronto M = m): dispari,
 *   così k = 0 e k = ±π/a cadono esattamente su campioni.
 * - 5 celle primitive (10 atomi: 5 M + 5 m) nella catena 1D per mostrare bene sia il moto
 *   interno di cella sia l'inversione di fase e^{iπ} = −1 tra celle adiacenti al bordo zona.
 */
export const NUMERICS = {
  kPoints1BZ: 241,
  kPointsExtended: 401,
  /** Numero di celle primitive disegnate nella catena 1D (2 atomi per cella → 10 atomi). */
  chainCells: 5,
  /** Passo della tastiera sullo stato scelto (in unità di π/a). */
  kNudge: 1 / 40,
  /** Aggancio morbido a k = 0, ±π/2a e ±π/a (in unità di π/a). */
  kSnap: 0.025,
  /** Pulsazione ottica di riferimento (Na–Cl, ω_+(0) ≈ 2,94·10¹³ rad/s) per normalizzare la velocità visiva. */
  refOmegaOptRadS: 2.94e13,
  /**
   * Frazione di bordo zona a cui la retta della luce (disegnata con pendenza esagerata
   * come in Fig. 28 della dispensa) incrocia ω_+(0). Il valore reale k_luce/(π/a) ~ 2·10⁻⁵
   * è calcolato esattamente e mostrato nei valori numerici.
   */
  lightLineVisualKFrac: 0.09
} as const
