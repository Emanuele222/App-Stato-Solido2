/**
 * Parametri, intervalli, preset e costanti numeriche della sezione
 * «Bande dei materiali veri» (dispensa P4 §5).
 */
import type { EpmFormFactors } from '../../physics'
import type { QuantityId } from '../../ui/theme'

export type EpmParamId = 'a' | 'v3s' | 'v8s' | 'v11s'
export type FormFactorId = 'v3s' | 'v8s' | 'v11s'

export interface EpmParamSpec {
  readonly id: EpmParamId
  readonly quantity: QuantityId
  readonly symbol: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly digits: number
  readonly unit: string
  readonly default: number
}

export const PARAMS: readonly EpmParamSpec[] = [
  { id: 'a', quantity: 'a', symbol: 'a', min: 4.0, max: 6.6, step: 0.01, digits: 2, unit: 'Å', default: 5.43 },
  { id: 'v3s', quantity: 'VG', symbol: 'V_3^s', min: -0.35, max: 0.0, step: 0.005, digits: 3, unit: 'Ry', default: -0.21 },
  { id: 'v8s', quantity: 'VG', symbol: 'V_8^s', min: -0.08, max: 0.12, step: 0.005, digits: 3, unit: 'Ry', default: 0.04 },
  { id: 'v11s', quantity: 'VG', symbol: 'V_{11}^s', min: -0.05, max: 0.15, step: 0.005, digits: 3, unit: 'Ry', default: 0.08 }
]

export type EpmParamValues = Record<EpmParamId, number>

export interface AntisymmetricFactors {
  readonly v3a: number
  readonly v4a: number
  readonly v11a: number
}

export type EpmPresetId = 'al' | 'si' | 'ge' | 'gaas'

export interface EpmPreset {
  readonly id: EpmPresetId
  readonly name: string
  readonly structureTag: string
  readonly params: EpmParamValues
  readonly antisymmetric: AntisymmetricFactors | null
  readonly isAluminum?: boolean
  readonly measuredGapEv: number | null
  readonly measuredGapKind: 'diretto' | 'indiretto' | null
  readonly measuredGammaMass: number | null
  readonly kpEpEv: number | null
  readonly factorsSource: 'tabella-P4' | 'esterni' | 'reticolo-vuoto'
}

export const PRESETS: readonly EpmPreset[] = [
  {
    id: 'al',
    name: 'Al',
    structureTag: 'fcc, 1 atomo/cella',
    params: { a: 4.05, v3s: 0, v8s: 0, v11s: 0 },
    antisymmetric: null,
    isAluminum: true,
    measuredGapEv: null,
    measuredGapKind: null,
    measuredGammaMass: null,
    kpEpEv: null,
    factorsSource: 'reticolo-vuoto'
  },
  {
    id: 'si',
    name: 'Si',
    structureTag: 'diamante',
    params: { a: 5.43, v3s: -0.21, v8s: 0.04, v11s: 0.08 },
    antisymmetric: null,
    measuredGapEv: 1.12,
    measuredGapKind: 'indiretto',
    measuredGammaMass: null,
    kpEpEv: null,
    factorsSource: 'tabella-P4'
  },
  {
    id: 'ge',
    name: 'Ge',
    structureTag: 'diamante',
    params: { a: 5.658, v3s: -0.23, v8s: 0.01, v11s: 0.06 },
    antisymmetric: null,
    measuredGapEv: 0.66,
    measuredGapKind: 'indiretto',
    measuredGammaMass: null,
    kpEpEv: null,
    factorsSource: 'esterni'
  },
  {
    id: 'gaas',
    name: 'GaAs',
    structureTag: 'zincoblenda',
    params: { a: 5.65, v3s: -0.252, v8s: 0.0, v11s: 0.08 },
    antisymmetric: { v3a: 0.068, v4a: 0.066, v11a: 0.012 },
    measuredGapEv: 1.42,
    measuredGapKind: 'diretto',
    measuredGammaMass: 0.067,
    kpEpEv: 20.0,
    factorsSource: 'tabella-P4'
  }
]

export const DEFAULT_ANTISYMMETRIC: AntisymmetricFactors = {
  v3a: 0.068,
  v4a: 0.066,
  v11a: 0.012
}

export function buildFormFactors(
  params: EpmParamValues,
  antisymmetric: AntisymmetricFactors | null,
  antisymmetricOn: boolean
): EpmFormFactors {
  const va = antisymmetricOn && antisymmetric ? antisymmetric : null
  return {
    v3s: params.v3s,
    v8s: params.v8s,
    v11s: params.v11s,
    v3a: va ? va.v3a : 0,
    v4a: va ? va.v4a : 0,
    v11a: va ? va.v11a : 0
  }
}

export const NUMERICS = {
  fullGMaxSq: 21, // 113 onde piane
  fullPointsPerSegment: 40, // 201 punti lungo L–Γ–X–W–K–Γ
  fastGMaxSq: 11, // 51 onde piane
  fastPointsPerSegment: 20, // 101 punti totali
  numBands: 8,
  defaultPointIndex: 40, // Γ
  defaultBandIndex: 4, // fondo conduzione (per Al si seleziona 0)
  siBareIonA: 5.431,
  siBareIonZ: 14
} as const
