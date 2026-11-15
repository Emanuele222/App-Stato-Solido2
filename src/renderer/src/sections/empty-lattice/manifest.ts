/**
 * Manifest della sezione «Reticolo vuoto e schemi di zona»
 * (dispensa P3 §9.3, §11.6 e P4 §5.1): registro del parametro a,
 * schemi di zona e scelte numeriche.
 */
import type { QuantityId } from '../../ui/theme'

export type ParamId = 'a'
export type ZoneScheme = 'extended' | 'reduced' | 'periodic'

export interface ParamSpec {
  readonly id: ParamId
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
  { id: 'a', symbol: 'a', quantity: 'a', unit: 'Å', min: 2.5, max: 6, step: 0.01, initial: 3, digits: 2 }
]

export type Params = Readonly<Record<ParamId, number>>

export const INITIAL_PARAMS: Params = { a: 3 }

/**
 * Scelte numeriche:
 * - maxZones = 7 (rami n = −3…+3): copre ampiamente i primi 3 incroci (E₀, 4E₀, 9E₀)
 *   e riempie la finestra in energia su tutto l'intervallo di a.
 * - Finestra adattiva (calcolata nel modello dai parametri interpolati, come la
 *   pilota, quindi segue a con la stessa transizione dei cursori):
 *   E_max = 11·E₀(a), così 9E₀ resta dentro con margine per ogni a
 *   (a = 2,5 Å: 66,2 eV; a = 3 Å: 46,0 eV; a = 6 Å: 11,5 eV);
 *   E_min = −0,035·E_max (spazio per lo zero dell'asse).
 *   k_max = 3,85·√(2,5/a) Å⁻¹: contiene sempre ±3π/a (a = 2,5 Å: 3,77 su 3,85)
 *   ma scala più lentamente di π/a, così cambiando a i bordi di zona si muovono
 *   davvero nella figura (con una scala del tutto proporzionale la figura
 *   resterebbe identica).
 * - Stato iniziale: k = 1,5 π/a → k′ = −0,5 π/a, n = +1 (esempio fig. 9.1b della dispensa),
 *   in zona estesa: lo studente parte dalla parabola che conosce.
 */
export const NUMERICS = {
  maxZones: 7,
  maxBranchN: 3,
  comparePlaneWaves: 11,
  compareBands: 7,
  compareVG: -2.2,
  compareV2G: -1.4,
  kPoints: 201,
  kWindowRef: 3.85,
  aWindowRef: 2.5,
  eMaxOverE0: 11,
  eMinFrac: 0.035,
  xWindow: 9.5,
  xSamples: 481,
  kNudge: 1 / 40,
  kSnap: 0.025,
  electrons: { min: 1, max: 4, initial: 2 },
  initialState: { kFracReduced: -0.5, branchN: 1 }
} as const
