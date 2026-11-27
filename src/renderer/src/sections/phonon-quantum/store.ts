/**
 * Stato Zustand della sezione «Modi quantizzati e processi Umklapp».
 */
import { create } from 'zustand'
import type { QuantityId } from '../../ui/theme'
import type { QuantityPulse } from '../../viz/LiveFormula'
import {
  INITIAL_QUANT_PARAMS,
  INITIAL_UMKLAPP_PARAMS,
  NUMERICS,
  QUANT_PARAMS,
  QUANT_PRESETS,
  UMKLAPP_PARAMS,
  UMKLAPP_PRESETS,
  type QuantParamId,
  type QuantParams,
  type QuantizationSource,
  type SectionMode,
  type UmklappParamId,
  type UmklappParams
} from './manifest'

export type TransitionKind = 'follow' | 'glide'

export interface PhononQuantumState {
  readonly mode: SectionMode
  readonly source: QuantizationSource
  readonly quantParams: QuantParams
  readonly quantPresetId: string | null
  readonly umklappParams: UmklappParams
  readonly umklappPresetId: string | null
  readonly transition: TransitionKind
  readonly highlight: QuantityId | null
  readonly pulse: QuantityPulse | null

  setMode(mode: SectionMode): void
  setSource(source: QuantizationSource): void
  setQuantParam(id: QuantParamId, value: number): void
  applyQuantPreset(id: string | null): void
  setUmklappParam(id: UmklappParamId, value: number): void
  setUmklappK(which: 'k1' | 'k2', kFrac: number): void
  nudgeUmklapp(which: 'k1' | 'k2', dx: number): void
  applyUmklappPreset(id: string | null): void
  setHighlight(q: QuantityId | null): void
}

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x))

function quantizeStep(v: number, step: number): number {
  return Math.round(v / step) * step
}

function snapUmklappKFrac(raw: number): number {
  const k = clamp(raw, -0.95, 1.0)
  for (const target of [-0.7, -0.5, 0, 0.5, 0.6, 0.7, 1.0]) {
    if (Math.abs(k - target) < NUMERICS.kSnap) return target
  }
  return Math.round(k * 100) / 100
}

export const usePhononQuantumStore = create<PhononQuantumState>()((set, get) => ({
  mode: 'quantization',
  source: 'level',
  quantParams: INITIAL_QUANT_PARAMS,
  quantPresetId: 'ground',
  umklappParams: INITIAL_UMKLAPP_PARAMS,
  umklappPresetId: 'umklapp-dispensa',
  transition: 'follow',
  highlight: null,
  pulse: null,

  setMode(mode) {
    if (get().mode !== mode) {
      set({ mode, highlight: null })
    }
  },

  setSource(source) {
    if (get().source !== source) {
      const seq = (get().pulse?.seq ?? 0) + 1
      set({
        source,
        quantPresetId: null,
        transition: 'follow',
        pulse: { quantities: [source === 'thermal' ? 'T' : 'psi'], seq }
      })
    }
  },

  setQuantParam(id, value) {
    const spec = QUANT_PARAMS.find((p) => p.id === id)
    if (!spec) return
    const stepped = id === 'n' ? Math.round(value) : quantizeStep(value, spec.step)
    const v = clamp(stepped, spec.min, spec.max)
    const seq = (get().pulse?.seq ?? 0) + 1
    set({
      quantParams: { ...get().quantParams, [id]: id === 'freqThz' ? Math.round(v * 10) / 10 : v },
      quantPresetId: null,
      transition: 'follow',
      pulse: { quantities: [spec.quantity], seq }
    })
  },

  applyQuantPreset(id) {
    if (id === null) {
      set({ quantPresetId: null })
      return
    }
    const preset = QUANT_PRESETS.find((p) => p.id === id)
    if (!preset) return
    const seq = (get().pulse?.seq ?? 0) + 1
    set({
      source: preset.source,
      quantParams: preset.params,
      quantPresetId: preset.id,
      transition: 'glide',
      pulse: { quantities: [preset.source === 'thermal' ? 'T' : 'psi', 'omega'], seq }
    })
  },

  setUmklappParam(id, value) {
    const spec = UMKLAPP_PARAMS.find((p) => p.id === id)
    if (!spec) return
    const v = clamp(Math.round(value / spec.step) * spec.step, spec.min, spec.max)
    const rounded = Math.round(v * 100) / 100
    const seq = (get().pulse?.seq ?? 0) + 1
    set({
      umklappParams: { ...get().umklappParams, [id]: rounded },
      umklappPresetId: null,
      transition: 'follow',
      pulse: { quantities: ['k'], seq }
    })
  },

  setUmklappK(which, kFrac) {
    const snapped = snapUmklappKFrac(kFrac)
    const id: UmklappParamId = which === 'k1' ? 'k1Frac' : 'k2Frac'
    set({
      umklappParams: { ...get().umklappParams, [id]: snapped },
      umklappPresetId: null,
      transition: 'follow'
    })
  },

  nudgeUmklapp(which, dx) {
    if (dx === 0) return
    const id: UmklappParamId = which === 'k1' ? 'k1Frac' : 'k2Frac'
    const cur = get().umklappParams[id]
    const next = clamp(
      Math.round((cur + Math.sign(dx) * NUMERICS.kNudge) * 100) / 100,
      -0.95,
      1.0
    )
    set({
      umklappParams: { ...get().umklappParams, [id]: next },
      umklappPresetId: null,
      transition: 'follow'
    })
  },

  applyUmklappPreset(id) {
    if (id === null) {
      set({ umklappPresetId: null })
      return
    }
    const preset = UMKLAPP_PRESETS.find((p) => p.id === id)
    if (!preset) return
    const seq = (get().pulse?.seq ?? 0) + 1
    set({
      umklappParams: preset.params,
      umklappPresetId: preset.id,
      transition: 'glide',
      pulse: { quantities: ['k'], seq }
    })
  },

  setHighlight(q) {
    if (get().highlight !== q) set({ highlight: q })
  }
}))
