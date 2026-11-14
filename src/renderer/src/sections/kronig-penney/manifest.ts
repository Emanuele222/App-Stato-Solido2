/**
 * Manifest della sezione «Kronig–Penney» (dispensa P3 §10):
 * due varianti («a delta» e «barriere rettangolari»), intervalli dei parametri
 * dal limite quasi libero (P → 0, V₀ → 0) alle bande strette (P = 30, c grande),
 * e scelte numeriche.
 */
import type { QuantityId } from '../../ui/theme'

export type KronigVariant = 'delta' | 'rectangular'
export type DeltaParamId = 'a' | 'P'
export type RectParamId = 'b' | 'c' | 'v0'

export interface ParamSpec<Id extends string> {
  readonly id: Id
  readonly symbol: string
  readonly quantity: QuantityId
  readonly target?: 'a' | 'b' | 'c'
  readonly unit: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly initial: number
  readonly digits: number
}

export const DELTA_PARAMS: readonly ParamSpec<DeltaParamId>[] = [
  { id: 'a', symbol: 'a', quantity: 'a', target: 'a', unit: 'Å', min: 2.5, max: 6, step: 0.01, initial: 3, digits: 2 },
  // P = m₀·a²·V₀/ħ²: opacità adimensionale (0 = elettrone libero; 2 = fig. 10.2; 3π/2 = es. §10.4; 30 = bande strette)
  { id: 'P', symbol: 'P', quantity: 'VG', unit: '', min: 0, max: 30, step: 0.05, initial: 2, digits: 2 }
]

export const RECT_PARAMS: readonly ParamSpec<RectParamId>[] = [
  { id: 'b', symbol: 'b', quantity: 'a', target: 'b', unit: 'Å', min: 1.5, max: 8, step: 0.05, initial: 4.5, digits: 2 },
  { id: 'c', symbol: 'c', quantity: 'a', target: 'c', unit: 'Å', min: 0.05, max: 5, step: 0.05, initial: 1, digits: 2 },
  { id: 'v0', symbol: 'V_{0}', quantity: 'VG', unit: 'eV', min: 0, max: 30, step: 0.1, initial: 10, digits: 1 }
]

export type DeltaParams = Readonly<Record<DeltaParamId, number>>
export type RectParams = Readonly<Record<RectParamId, number>>

export const INITIAL_DELTA_PARAMS: DeltaParams = { a: 3, P: 2 }
export const INITIAL_RECT_PARAMS: RectParams = { b: 4.5, c: 1, v0: 10 }

/**
 * Scelte numeriche:
 * - 5 bande: coprono sempre i primi 4 elettroni/cella e gli stati sopra V₀.
 * - 201 punti in k su [−π/a, π/a] (dispari: k = 0 incluso).
 * - xWindow = 11 Å: mostra più celle intere su tutto l'intervallo di a.
 * - kNudge = 1/40 di π/a; aggancio a 0 e ±π/a entro 0,025 π/a.
 */
export const NUMERICS = {
  bands: 5,
  kPoints: 201,
  lCurveSamples: 260,
  xWindow: 11,
  xSamples: 481,
  kNudge: 1 / 40,
  kSnap: 0.025,
  electrons: { min: 1, max: 4, initial: 2 },
  initialState: { kFrac: 0.45, band: 0 }
} as const
