/**
 * Stato della sezione «Catena monatomica e prima zona di Brillouin» (Zustand).
 * I parametri in `params` sono i valori bersaglio; la scena li raggiunge con
 * interpolazione fluida (ui/motion.ts).
 */
import { create } from 'zustand'
import { bvkAllowedK1D } from '../../physics'
import type { QuantityId } from '../../ui/theme'
import type { QuantityPulse } from '../../viz/LiveFormula'
import { INITIAL_PARAMS, NUMERICS, PARAMS, PRESETS, type ParamId, type Params } from './manifest'

export type ToolId = 'aliasing' | 'bvk' | 'probe'
export type TransitionKind = 'follow' | 'glide'

export interface PhononMonatomicState {
  readonly params: Params
  readonly transition: TransitionKind
  readonly presetId: string | null
  /** Stato scelto: k in unità di π/a (−1…+1). */
  readonly kFrac: number
  readonly tools: Readonly<Record<ToolId, boolean>>
  /** Numero di atomi/celle N nell'anello di Born–von Kármán. */
  readonly bvkN: number
  readonly highlight: QuantityId | null
  readonly pulse: QuantityPulse | null

  setParam(id: ParamId, value: number): void
  applyPreset(id: string | null): void
  select(kFrac: number): void
  selectExact(kFrac: number): void
  nudge(dk: number): void
  toggleTool(id: ToolId): void
  setBvkN(n: number): void
  setHighlight(q: QuantityId | null): void
}

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x))

function snapContinuousKFrac(kFrac: number): number {
  const k = clamp(kFrac, -1, 1)
  for (const target of [-1, -0.5, 0, 0.5, 1]) {
    if (Math.abs(k - target) < NUMERICS.kSnap) return target
  }
  return k
}

function snapBvkKFrac(kFrac: number, a: number, nCells: number): number {
  const grid = bvkAllowedK1D(a, nCells)
  let best = grid.modes[0].kFrac
  let bestDist = Math.abs(kFrac - best)
  for (let i = 1; i < grid.modes.length; i++) {
    const d = Math.abs(kFrac - grid.modes[i].kFrac)
    if (d < bestDist) {
      bestDist = d
      best = grid.modes[i].kFrac
    }
  }
  return best
}

export const usePhononMonatomicStore = create<PhononMonatomicState>()((set, get) => ({
  params: INITIAL_PARAMS,
  transition: 'follow',
  presetId: 'typical-metal',
  // k = π/(2a), λ = 4a (Fig. 4 centrale): onda viaggiante, v_p ≠ v_g, aliasing ben visibile
  kFrac: 0.5,
  tools: { aliasing: false, bvk: false, probe: false },
  bvkN: NUMERICS.bvk.initial,
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
      params: { a: preset.a, massAmu: preset.massAmu, springC: preset.springC },
      transition: 'glide',
      presetId: id,
      pulse: { quantities: ['a', 'M', 'C'], seq }
    })
  },

  select(kFrac) {
    const { tools, params, bvkN } = get()
    const next = tools.bvk ? snapBvkKFrac(kFrac, params.a, bvkN) : snapContinuousKFrac(kFrac)
    set({ kFrac: next })
  },

  selectExact(kFrac) {
    const { tools, params, bvkN } = get()
    const clamped = clamp(kFrac, -1, 1)
    const next = tools.bvk ? snapBvkKFrac(clamped, params.a, bvkN) : clamped
    set({ kFrac: next })
  },

  nudge(dk) {
    if (dk === 0) return
    const { tools, params, bvkN, kFrac } = get()
    if (tools.bvk) {
      const grid = bvkAllowedK1D(params.a, bvkN)
      let idx = 0
      let best = Math.abs(kFrac - grid.modes[0].kFrac)
      for (let i = 1; i < grid.modes.length; i++) {
        const d = Math.abs(kFrac - grid.modes[i].kFrac)
        if (d < best) {
          best = d
          idx = i
        }
      }
      const nextIdx = clamp(idx + Math.sign(dk), 0, grid.modes.length - 1)
      set({ kFrac: grid.modes[nextIdx].kFrac })
      return
    }
    const next = Math.round((kFrac + dk * NUMERICS.kNudge) / NUMERICS.kNudge) * NUMERICS.kNudge
    set({ kFrac: clamp(next, -1, 1) })
  },

  toggleTool(id) {
    const { tools, params, bvkN, kFrac } = get()
    const nextOn = !tools[id]
    const nextTools = { ...tools, [id]: nextOn }
    const nextK = id === 'bvk' && nextOn ? snapBvkKFrac(kFrac, params.a, bvkN) : kFrac
    set({ tools: nextTools, kFrac: nextK })
  },

  setBvkN(n) {
    const nextN = clamp(Math.round(n), NUMERICS.bvk.min, NUMERICS.bvk.max)
    const { tools, params, kFrac } = get()
    const nextK = tools.bvk ? snapBvkKFrac(kFrac, params.a, nextN) : kFrac
    set({ bvkN: nextN, kFrac: nextK })
  },

  setHighlight(q) {
    if (get().highlight !== q) set({ highlight: q })
  }
}))
