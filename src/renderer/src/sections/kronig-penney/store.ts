/**
 * Stato della sezione «Kronig–Penney» (Zustand): variante (delta / rettangolare),
 * parametri di ciascuna variante, stato scelto (k′, banda), strumenti e
 * evidenziazione con sotto-bersagli per distinguere a, b, c ed L(E).
 */
import { create } from 'zustand'
import type { QuantityPulse } from '../../viz/LiveFormula'
import type { QuantityId } from '../../ui/theme'
import {
  DELTA_PARAMS,
  INITIAL_DELTA_PARAMS,
  INITIAL_RECT_PARAMS,
  NUMERICS,
  RECT_PARAMS,
  type DeltaParamId,
  type DeltaParams,
  type KronigVariant,
  type RectParamId,
  type RectParams
} from './manifest'

export type ToolId = 'fill' | 'mass' | 'cosine' | 'compare'
export type HighlightTarget = 'a' | 'b' | 'c' | 'L' | null

export interface KronigPenneyState {
  readonly variant: KronigVariant
  readonly deltaParams: DeltaParams
  readonly rectParams: RectParams
  /** k nella prima zona, in unità di π/a (−1…1). */
  readonly kFrac: number
  /** Indice 0-based della banda scelta. */
  readonly band: number
  readonly tools: Readonly<Record<ToolId, boolean>>
  readonly electrons: number
  readonly highlight: QuantityId | null
  readonly highlightTarget: HighlightTarget
  readonly pulse: QuantityPulse | null

  setVariant(variant: KronigVariant): void
  setDeltaParam(id: DeltaParamId, value: number): void
  setRectParam(id: RectParamId, value: number): void
  select(kFrac: number, band: number): void
  nudge(dk: number, dBand: number): void
  toggleTool(id: ToolId): void
  setElectrons(n: number): void
  setHighlight(q: QuantityId | null, target?: HighlightTarget): void
}

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x))

function snapK(kFrac: number): number {
  const k = clamp(kFrac, -1, 1)
  if (Math.abs(k) < NUMERICS.kSnap) return 0
  if (1 - Math.abs(k) < NUMERICS.kSnap) return Math.sign(k)
  return k
}

export const useKronigPenneyStore = create<KronigPenneyState>()((set, get) => ({
  variant: 'delta',
  deltaParams: INITIAL_DELTA_PARAMS,
  rectParams: INITIAL_RECT_PARAMS,
  kFrac: NUMERICS.initialState.kFrac,
  band: NUMERICS.initialState.band,
  tools: { fill: false, mass: false, cosine: false, compare: false },
  electrons: NUMERICS.electrons.initial,
  highlight: null,
  highlightTarget: null,
  pulse: null,

  setVariant(variant) {
    if (get().variant !== variant) set({ variant })
  },

  setDeltaParam(id, value) {
    const spec = DELTA_PARAMS.find((p) => p.id === id)
    if (!spec) return
    const v = clamp(value, spec.min, spec.max)
    const seq = (get().pulse?.seq ?? 0) + 1
    set({
      deltaParams: { ...get().deltaParams, [id]: v },
      pulse: { quantities: [spec.quantity], seq }
    })
  },

  setRectParam(id, value) {
    const spec = RECT_PARAMS.find((p) => p.id === id)
    if (!spec) return
    const v = clamp(value, spec.min, spec.max)
    const seq = (get().pulse?.seq ?? 0) + 1
    set({
      rectParams: { ...get().rectParams, [id]: v },
      pulse: { quantities: [spec.quantity], seq }
    })
  },

  select(kFrac, band) {
    set({
      kFrac: snapK(kFrac),
      band: clamp(Math.round(band), 0, NUMERICS.bands - 1)
    })
  },

  nudge(dk, dBand) {
    const st = get()
    const nextK =
      dk !== 0 ? clamp(Math.round((st.kFrac + dk * NUMERICS.kNudge) / NUMERICS.kNudge) * NUMERICS.kNudge, -1, 1) : st.kFrac
    const nextB = clamp(st.band + dBand, 0, NUMERICS.bands - 1)
    set({ kFrac: nextK, band: nextB })
  },

  toggleTool(id) {
    set({ tools: { ...get().tools, [id]: !get().tools[id] } })
  },

  setElectrons(n) {
    set({ electrons: clamp(n, NUMERICS.electrons.min, NUMERICS.electrons.max) })
  },

  setHighlight(q, target = null) {
    const cur = get()
    if (cur.highlight !== q || cur.highlightTarget !== target) {
      set({ highlight: q, highlightTarget: target })
    }
  }
}))
