/**
 * Stato della sezione «Catena biatomica, gap fononico e luce infrarossa» (Zustand).
 * I parametri in `params` sono i valori bersaglio; la scena li raggiunge con
 * interpolazione fluida (ui/motion.ts).
 */
import { create } from 'zustand'
import type { DiatomicBranch } from '../../physics'
import type { QuantityId } from '../../ui/theme'
import type { QuantityPulse } from '../../viz/LiveFormula'
import { INITIAL_PARAMS, NUMERICS, PARAMS, PRESETS, type ParamId, type Params } from './manifest'

export type ToolId = 'infrared' | 'folding' | 'matrix'
export type TransitionKind = 'follow' | 'glide'

export interface PhononDiatomicState {
  readonly params: Params
  readonly transition: TransitionKind
  readonly presetId: string | null
  /** Stato scelto: k in unità di π/a (−1…+1) e ramo ('acoustic' | 'optical'). */
  readonly kFrac: number
  readonly branch: DiatomicBranch
  readonly tools: Readonly<Record<ToolId, boolean>>
  readonly highlight: QuantityId | null
  readonly pulse: QuantityPulse | null

  setParam(id: ParamId, value: number): void
  applyPreset(id: string | null): void
  select(kFrac: number, branch: DiatomicBranch): void
  selectExact(kFrac: number, branch: DiatomicBranch): void
  nudge(dk: number, dBranch: number): void
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

export const usePhononDiatomicStore = create<PhononDiatomicState>()((set, get) => ({
  params: INITIAL_PARAMS,
  transition: 'follow',
  presetId: 'nacl-pair',
  // Stato iniziale: modo ottico a k = 0 (centro di massa fermo, opposizione di fase, dipolo IR)
  kFrac: 0,
  branch: 'optical',
  tools: { infrared: false, folding: false, matrix: false },
  highlight: null,
  pulse: null,

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
      params: {
        a: preset.a,
        massHeavyAmu: preset.massHeavyAmu,
        massLightAmu: preset.massLightAmu,
        springC: preset.springC
      },
      transition: 'glide',
      presetId: id,
      pulse: { quantities: ['a', 'M', 'm', 'C'], seq }
    })
  },

  select(kFrac, branch) {
    set({ kFrac: snapKFrac(kFrac), branch })
  },

  selectExact(kFrac, branch) {
    set({ kFrac: clamp(kFrac, -1, 1), branch })
  },

  nudge(dk, dBranch) {
    const st = get()
    const nextBranch: DiatomicBranch =
      dBranch > 0 ? 'optical' : dBranch < 0 ? 'acoustic' : st.branch
    const nextK =
      dk === 0
        ? st.kFrac
        : clamp(
            Math.round((st.kFrac + dk * NUMERICS.kNudge) / NUMERICS.kNudge) * NUMERICS.kNudge,
            -1,
            1
          )
    set({ kFrac: nextK, branch: nextBranch })
  },

  toggleTool(id) {
    const st = get()
    const nextOn = !st.tools[id]
    set({ tools: { ...st.tools, [id]: nextOn } })
  },

  setHighlight(q) {
    if (get().highlight !== q) set({ highlight: q })
  }
}))
