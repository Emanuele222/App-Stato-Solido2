/**
 * Stato della sezione «Pacchetti d'onda: velocità di fase e di gruppo» (Zustand).
 */
import { create } from 'zustand'
import type { WavepacketRegime } from '../../physics'
import type { QuantityId } from '../../ui/theme'
import type { QuantityPulse } from '../../viz/LiveFormula'
import { INITIAL_PARAMS, INITIAL_REGIME, NUMERICS, PARAMS, PRESETS, type ParamId, type Params } from './manifest'

export type ToolId = 'comoving' | 'initialProfile'
export type TransitionKind = 'follow' | 'glide'

export interface PhononWavepacketState {
  readonly regime: WavepacketRegime
  readonly params: Params
  readonly transition: TransitionKind
  readonly presetId: string | null
  readonly tools: Readonly<Record<ToolId, boolean>>
  readonly highlight: QuantityId | null
  readonly pulse: QuantityPulse | null

  setRegime(regime: WavepacketRegime): void
  setParam(id: ParamId, value: number): void
  applyPreset(id: string | null): void
  selectKFrac(kFrac: number): void
  nudge(dk: number): void
  toggleTool(id: ToolId): void
  setHighlight(q: QuantityId | null): void
}

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x))

function snapKFrac(kFrac: number): number {
  const k = clamp(kFrac, -1, 1)
  for (const target of [-1, -0.5, 0, 0.5, 1]) {
    if (Math.abs(k - target) < NUMERICS.kSnap) return target
  }
  return k
}

export const usePhononWavepacketStore = create<PhononWavepacketState>()((set, get) => ({
  regime: INITIAL_REGIME,
  params: INITIAL_PARAMS,
  transition: 'follow',
  presetId: 'acoustic-dispersive',
  tools: { comoving: false, initialProfile: true },
  highlight: null,
  pulse: null,

  setRegime(regime) {
    if (get().regime === regime) return
    const seq = (get().pulse?.seq ?? 0) + 1
    const q: QuantityId = regime === 'optical' ? 'omegaOpt' : regime === 'quadratic' ? 'Ek' : 'omega'
    set({
      regime,
      transition: 'glide',
      presetId: null,
      pulse: { quantities: [q, 'v', 'vp'], seq }
    })
  },

  setParam(id, value) {
    const spec = PARAMS.find((p) => p.id === id)
    if (!spec) return
    const v = clamp(value, spec.min, spec.max)
    const seq = (get().pulse?.seq ?? 0) + 1
    set({
      params: { ...get().params, [id]: v },
      transition: 'follow',
      presetId: null,
      pulse: { quantities: [spec.quantity], seq }
    })
  },

  applyPreset(id) {
    if (id === null) {
      set({ presetId: null })
      return
    }
    const preset = PRESETS.find((p) => p.id === id)
    if (!preset) return
    const seq = (get().pulse?.seq ?? 0) + 1
    set({
      regime: preset.regime,
      params: {
        kFrac: preset.kFrac,
        sigma0InA: preset.sigma0InA
      },
      transition: 'glide',
      presetId: id,
      pulse: { quantities: ['k', 'u', 'v', 'vp'], seq }
    })
  },

  selectKFrac(kFrac) {
    const snapped = snapKFrac(kFrac)
    const seq = (get().pulse?.seq ?? 0) + 1
    set({
      params: { ...get().params, kFrac: snapped },
      transition: 'follow',
      presetId: null,
      pulse: { quantities: ['k', 'v', 'vp'], seq }
    })
  },

  nudge(dk) {
    if (dk === 0) return
    const st = get()
    const nextK = clamp(
      Math.round((st.params.kFrac + dk * NUMERICS.kNudge) / NUMERICS.kNudge) * NUMERICS.kNudge,
      -1,
      1
    )
    const seq = (st.pulse?.seq ?? 0) + 1
    set({
      params: { ...st.params, kFrac: nextK },
      transition: 'follow',
      presetId: null,
      pulse: { quantities: ['k', 'v', 'vp'], seq }
    })
  },

  toggleTool(id) {
    const st = get()
    set({ tools: { ...st.tools, [id]: !st.tools[id] } })
  },

  setHighlight(q) {
    if (get().highlight !== q) set({ highlight: q })
  }
}))
