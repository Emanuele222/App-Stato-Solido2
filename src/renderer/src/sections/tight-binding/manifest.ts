/**
 * Manifest della sezione «Legami forti» (dispense P3 §12, P4 §§1.4–2):
 *  - due varianti animate: catena monoatomica (bande s e p indipendenti) e catena
 *    biatomica A–B di passo a (A in n·a, B in (n+½)·a, E_A ≤ E_B);
 *  - legge esponenziale indicativa t(a) = t(a₀)·e^{−(a−a₀)/ℓ} («Avvicina gli atomi»);
 *  - scelte numeriche per diagramma E(k), spazio reale e confronto quasi liberi.
 */
import type { QuantityId } from '../../ui/theme'

export type TightBindingVariant = 'monoatomic' | 'diatomic'

export type MonoParamId = 'a' | 'centerS' | 'centerP' | 'tS' | 'absTP'
export type DiatomicParamId = 'a' | 'eA' | 'eB' | 't'

export interface ParamSpec<Id extends string> {
  readonly id: Id
  readonly symbol: string
  readonly quantity: QuantityId
  readonly unit: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly initial: number
  readonly digits: number
}

export const MONO_PARAMS: readonly ParamSpec<MonoParamId>[] = [
  { id: 'a', symbol: 'a', quantity: 'a', unit: 'Å', min: 2.0, max: 6.0, step: 0.01, initial: 3.0, digits: 2 },
  { id: 'centerS', symbol: '\\bar{E}_s', quantity: 'Ek', unit: 'eV', min: -12.0, max: -2.0, step: 0.1, initial: -8.0, digits: 1 },
  { id: 'centerP', symbol: '\\bar{E}_p', quantity: 'Ek', unit: 'eV', min: -6.0, max: 4.0, step: 0.1, initial: -2.0, digits: 1 },
  { id: 'tS', symbol: 't_s', quantity: 't', unit: 'eV', min: 0.02, max: 2.5, step: 0.01, initial: 1.0, digits: 2 },
  { id: 'absTP', symbol: '|t_p|', quantity: 't', unit: 'eV', min: 0.02, max: 2.5, step: 0.01, initial: 1.2, digits: 2 }
]

export const DIATOMIC_PARAMS: readonly ParamSpec<DiatomicParamId>[] = [
  { id: 'a', symbol: 'a', quantity: 'a', unit: 'Å', min: 2.5, max: 7.0, step: 0.01, initial: 3.5, digits: 2 },
  { id: 'eA', symbol: 'E_A', quantity: 'Ek', unit: 'eV', min: -6.0, max: 4.0, step: 0.05, initial: -1.5, digits: 2 },
  { id: 'eB', symbol: 'E_B', quantity: 'Ek', unit: 'eV', min: -4.0, max: 6.0, step: 0.05, initial: 1.5, digits: 2 },
  { id: 't', symbol: 't', quantity: 't', unit: 'eV', min: 0.02, max: 2.5, step: 0.01, initial: 0.9, digits: 2 }
]

export type MonoParams = Readonly<Record<MonoParamId, number>>
export type DiatomicParams = Readonly<Record<DiatomicParamId, number>>

export const INITIAL_MONO_PARAMS: MonoParams = {
  a: 3.0,
  centerS: -8.0,
  centerP: -2.0,
  tS: 1.0,
  absTP: 1.2
}

export const INITIAL_DIATOMIC_PARAMS: DiatomicParams = {
  a: 3.5,
  eA: -1.5,
  eB: 1.5,
  t: 0.9
}

/** Parametri della legge esponenziale indicativa t(a) = t(a₀)·e^{−(a−a₀)/ℓ} (P3 §12.1 qualitativo). */
export const INDICATIVE_DISTANCE_LAW = {
  a0: 3.0,
  ell: 0.8
} as const

export const NUMERICS = {
  kPoints: 201,
  /** Finestra in k del diagramma (Å⁻¹): contiene ±π/a per ogni a ≥ 2,0 Å (π/2 = 1,571). */
  kWindow: 1.65,
  /** Finestra spaziale mostrata (Å) e numero di campioni per Re ψ_k e |ψ_k|². */
  xWindow: 9.5,
  xSamples: 481,
  /** Passo della tastiera sullo stato scelto (in unità di π/a). */
  kNudge: 1 / 40,
  /** Aggancio a k = 0 e ±π/a (in unità di π/a). */
  kSnap: 0.025,
  /** Potenziale usato dal confronto con gli elettroni quasi liberi (stesso a). */
  compareVG: -0.5,
  comparePlaneWaves: 9,
  /** Elettroni per cella / atomo nello strumento Riempimento (con 2 bande). */
  electrons: { min: 1, max: 3, initial: 2 }
} as const
