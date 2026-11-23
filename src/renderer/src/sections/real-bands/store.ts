/**
 * Stato Zustand della sezione «Bande dei materiali veri».
 */
import { create } from 'zustand'
import type { QuantityId } from '../../ui/theme'
import {
  NUMERICS,
  PARAMS,
  PRESETS,
  type AntisymmetricFactors,
  type EpmParamId,
  type EpmParamValues,
  type EpmPresetId,
  type FormFactorId
} from './manifest'

export interface RealBandsTools {
  readonly fill: boolean
  readonly mass: boolean
  readonly compare: boolean
}

export interface RealBandsState {
  readonly presetId: EpmPresetId | null
  readonly params: EpmParamValues
  readonly antisymmetric: AntisymmetricFactors | null
  readonly antisymmetricOn: boolean
  readonly alElectrons: 3 | 1
  readonly transition: 'follow' | 'glide'
  readonly pointIndex: number
  readonly bandIndex: number
  readonly tools: RealBandsTools
  readonly highlight: QuantityId | null
  readonly activeFactor: FormFactorId | null
  readonly pulse: { readonly quantities: readonly QuantityId[]; readonly seq: number } | null

  setParam: (id: EpmParamId, value: number) => void
  applyPreset: (id: string | null) => void
  toggleAntisymmetric: () => void
  setAlElectrons: (n: 3 | 1) => void
  selectState: (pointIndex: number, bandIndex: number) => void
  nudgeState: (dPoint: number, dBand: number) => void
  toggleTool: (tool: keyof RealBandsTools) => void
  setHighlight: (q: QuantityId | null) => void
  setActiveFactor: (factor: FormFactorId | null) => void
}

const DEFAULT_PRESET = PRESETS.find((p) => p.id === 'si') ?? PRESETS[0]
const MAX_POINT_INDEX = NUMERICS.fullPointsPerSegment * 5

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x))

let pulseSeq = 0
function nextPulse(quantities: readonly QuantityId[]) {
  pulseSeq += 1
  return { quantities, seq: pulseSeq }
}

export const useRealBandsStore = create<RealBandsState>((set, get) => ({
  presetId: DEFAULT_PRESET.id,
  params: { ...DEFAULT_PRESET.params },
  antisymmetric: DEFAULT_PRESET.antisymmetric,
  antisymmetricOn: false,
  alElectrons: 3,
  transition: 'follow',
  pointIndex: NUMERICS.defaultPointIndex,
  bandIndex: NUMERICS.defaultBandIndex,
  tools: { fill: false, mass: false, compare: false },
  highlight: null,
  activeFactor: null,
  pulse: null,

  setParam: (id, value) => {
    if (get().presetId === 'al') return
    const spec = PARAMS.find((p) => p.id === id)
    if (!spec) return
    const rounded = Math.round(clamp(value, spec.min, spec.max) / spec.step) * spec.step
    const nextVal = clamp(Number(rounded.toFixed(4)), spec.min, spec.max)
    set((cur) => ({
      params: { ...cur.params, [id]: nextVal },
      presetId: null,
      transition: 'follow',
      pulse: nextPulse([spec.quantity, 'E'])
    }))
  },

  applyPreset: (id) => {
    if (id === null) {
      set({ presetId: null })
      return
    }
    const preset = PRESETS.find((p) => p.id === id)
    if (!preset) return
    const nextPoint = preset.id === 'gaas' || preset.id === 'al' ? 40 : get().pointIndex
    const nextBand = preset.id === 'al' ? 0 : get().bandIndex
    set({
      presetId: preset.id,
      params: { ...preset.params },
      antisymmetric: preset.antisymmetric ? { ...preset.antisymmetric } : null,
      antisymmetricOn: preset.antisymmetric !== null,
      pointIndex: nextPoint,
      bandIndex: nextBand,
      transition: 'glide',
      pulse: nextPulse(['a', 'VG', 'E'])
    })
  },

  toggleAntisymmetric: () => {
    const cur = get()
    if (!cur.antisymmetric) return
    const nextOn = !cur.antisymmetricOn
    const gaas = PRESETS.find((p) => p.id === 'gaas')
    const matchesGaas =
      nextOn &&
      gaas !== undefined &&
      cur.params.a === gaas.params.a &&
      cur.params.v3s === gaas.params.v3s &&
      cur.params.v8s === gaas.params.v8s &&
      cur.params.v11s === gaas.params.v11s
    set({
      antisymmetricOn: nextOn,
      presetId: matchesGaas ? 'gaas' : null,
      transition: 'glide',
      pulse: nextPulse(['V2G', 'E'])
    })
  },

  setAlElectrons: (n) => {
    set({
      alElectrons: n,
      pulse: nextPulse(['EF', 'k'])
    })
  },

  selectState: (pointIndex, bandIndex) => {
    const pi = clamp(Math.round(pointIndex), 0, MAX_POINT_INDEX)
    const bi = clamp(Math.round(bandIndex), 0, NUMERICS.numBands - 1)
    set({ pointIndex: pi, bandIndex: bi })
  },

  nudgeState: (dPoint, dBand) => {
    const cur = get()
    const pi = clamp(cur.pointIndex + dPoint, 0, MAX_POINT_INDEX)
    const bi = clamp(cur.bandIndex + dBand, 0, NUMERICS.numBands - 1)
    set({ pointIndex: pi, bandIndex: bi })
  },

  toggleTool: (tool) => {
    set((cur) => ({
      tools: { ...cur.tools, [tool]: !cur.tools[tool] }
    }))
  },

  setHighlight: (q) => set({ highlight: q }),

  setActiveFactor: (factor) =>
    set({
      activeFactor: factor,
      highlight: factor ? 'VG' : null
    })
}))
