/**
 * Stato della sezione (Zustand). I parametri qui sono i valori «bersaglio»:
 * la scena mostra valori interpolati verso di essi (ui/motion.ts).
 */
import { create } from 'zustand'
import type { QuantityPulse } from '../../viz/LiveFormula'
import type { QuantityId } from '../../ui/theme'
import { INITIAL_PARAMS, NUMERICS, PARAMS, PRESETS, type ParamId, type Params } from './manifest'

export type ToolId = 'fill' | 'mass' | 'compare'
export type TransitionKind = 'follow' | 'glide'

export interface NearlyFreeState {
  readonly params: Params
  /** Come raggiungere i nuovi parametri: inseguimento breve (cursori) o planata (preset). */
  readonly transition: TransitionKind
  readonly presetId: string | null
  /** Stato scelto: k in unità di π/a (−1…1) e indice di banda (0 = la più bassa). */
  readonly kFrac: number
  readonly band: number
  readonly tools: Readonly<Record<ToolId, boolean>>
  readonly electrons: number
  readonly highlight: QuantityId | null
  readonly pulse: QuantityPulse | null

  setParam(id: ParamId, value: number): void
  applyPreset(id: string | null): void
  select(kFrac: number, band: number): void
  /** Frecce: passo in k e cambio di banda a partire dalla banda mostrata `fromBand`. */
  nudge(dk: number, dBand: number, fromBand: number): void
  toggleTool(id: ToolId): void
  setElectrons(n: number): void
  setHighlight(q: QuantityId | null): void
}

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x))

function snapK(kFrac: number): number {
  const k = clamp(kFrac, -1, 1)
  if (Math.abs(k) < NUMERICS.kSnap) return 0
  if (1 - Math.abs(k) < NUMERICS.kSnap) return Math.sign(k)
  return k
}

export const useNearlyFreeStore = create<NearlyFreeState>()((set, get) => ({
  params: INITIAL_PARAMS,
  transition: 'follow',
  presetId: null,
  kFrac: 1,
  band: 0,
  tools: { fill: false, mass: false, compare: false },
  electrons: NUMERICS.electrons.initial,
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
      params: { ...get().params, a: preset.a, vG: -preset.gap / 2, v2G: 0 },
      transition: 'glide',
      presetId: id,
      pulse: { quantities: ['a', 'VG', 'V2G'], seq }
    })
  },

  select(kFrac, band) {
    set({ kFrac: snapK(kFrac), band: clamp(Math.round(band), 0, NUMERICS.bands - 1) })
  },

  nudge(dk, dBand, fromBand) {
    const { kFrac, band } = get()
    // la banda mostrata può essere più bassa di quella chiesta (fuori dalla finestra in energia)
    const from = Math.min(band, fromBand)
    // con la tastiera si attraversano esattamente 0 e ±π/a
    const next = Math.round((kFrac + dk * NUMERICS.kNudge) / NUMERICS.kNudge) * NUMERICS.kNudge
    set({
      kFrac: clamp(next, -1, 1),
      band: clamp(from + dBand, 0, NUMERICS.bands - 1)
    })
  },

  toggleTool(id) {
    set({ tools: { ...get().tools, [id]: !get().tools[id] } })
  },

  setElectrons(n) {
    set({ electrons: clamp(n, NUMERICS.electrons.min, NUMERICS.electrons.max) })
  },

  setHighlight(q) {
    if (get().highlight !== q) set({ highlight: q })
  }
}))
