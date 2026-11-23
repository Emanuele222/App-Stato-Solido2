/**
 * Parametri, intervalli e costanti numeriche della sezione «Pseudopotenziale»
 * (modello 1D esatto con stato di core, dispensa P4 §4 e verifica_pseudo.py r. 58–92).
 *
 * Gli intervalli di a, V₀, s sono scelti in modo che in tutti gli 8 estremi ci sia
 * una sola banda di tipo core (larghezza < 0,2 eV) e la prima banda di valenza
 * abbia larghezza >= 1,0 eV.
 */
import type { QuantityId } from '../../ui/theme'

export type PseudoCoreParamId = 'a' | 'v0' | 's' | 'f' | 'alpha'

export interface PseudoCoreParamSpec {
  readonly id: PseudoCoreParamId
  readonly quantity: QuantityId
  readonly symbol: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly digits: number
  readonly unit: string
  readonly default: number
}

export const PARAMS: readonly PseudoCoreParamSpec[] = [
  { id: 'a', quantity: 'a', symbol: 'a', min: 3.5, max: 4.8, step: 0.1, digits: 1, unit: 'Å', default: 4.0 },
  { id: 'v0', quantity: 'VG', symbol: 'V_0', min: 50, max: 75, step: 1, digits: 0, unit: 'eV', default: 60 },
  { id: 's', quantity: 'VG', symbol: 's', min: 0.2, max: 0.28, step: 0.01, digits: 2, unit: 'Å', default: 0.25 },
  { id: 'f', quantity: 'V2G', symbol: 'f', min: -10, max: 65, step: 0.5, digits: 1, unit: 'eV', default: 0 },
  { id: 'alpha', quantity: 'psi', symbol: '\\alpha', min: -2.0, max: 2.0, step: 0.01, digits: 2, unit: '', default: 0 }
]

export type PseudoCoreParamValues = Record<PseudoCoreParamId, number>

export const DEFAULT_PARAMS: PseudoCoreParamValues = {
  a: 4.0,
  v0: 60,
  s: 0.25,
  f: 0,
  alpha: 0
}

export const NUMERICS = {
  nHalf: 40, // 81 onde piane (n = -40..40)
  kPoints: 81, // zona ridotta [-π/a, π/a]
  numBands: 4, // 1 core + 3 valenza
  defaultKIndex: 52, // k ≈ 0,3 π/a (40 + 0,3 * 40 = 52)
  defaultBandIndex: 1, // prima banda di valenza
  siBareIonA: 5.431,
  siBareIonZ: 14
} as const
