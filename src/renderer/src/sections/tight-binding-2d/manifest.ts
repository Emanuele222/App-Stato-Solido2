/**
 * Manifest della sezione «Legami forti in 2D» (dispense P4 §1.4, §6).
 */
import { GRAPHENE_A } from '../../physics'
import type { QuantityId } from '../../ui/theme'

export type Lattice2D = 'square' | 'graphene'

export interface ParamSpec2D {
  readonly id: 't' | 'a'
  readonly symbol: string
  readonly quantity: QuantityId
  readonly unit: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly initial: number
  readonly digits: number
}

export const SQUARE_PARAMS: readonly ParamSpec2D[] = [
  { id: 't', symbol: 't', quantity: 't', unit: 'eV', min: 0.2, max: 3.0, step: 0.05, initial: 1.0, digits: 2 },
  { id: 'a', symbol: 'a', quantity: 'a', unit: 'Å', min: 2.0, max: 5.0, step: 0.05, initial: 3.0, digits: 2 }
]

export const GRAPHENE_T_PARAM: ParamSpec2D = {
  id: 't',
  symbol: 't',
  quantity: 't',
  unit: 'eV',
  min: 0.5,
  max: 4.0,
  step: 0.05,
  initial: 2.8,
  digits: 2
}

export const INITIAL_SQUARE = { t: 1.0, a: 3.0 } as const
export const INITIAL_GRAPHENE_T = 2.8
export const GRAPHENE_FIXED_A = GRAPHENE_A

export const NUMERICS_2D = {
  pathPointsPerSeg: 50,
  squareGrid: 44,
  grapheneRings: 26,
  dosGridN: 120,
  dosBins: 160,
  electrons: { min: 1, max: 2, initial: 1 as 1 | 2 }
} as const
