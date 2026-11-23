/**
 * Stato Zustand della sezione «Pseudopotenziale» (modello 1D con stato di core).
 */
import { create } from 'zustand'
import type { QuantityId } from '../../ui/theme'
import { DEFAULT_PARAMS, NUMERICS, PARAMS, type PseudoCoreParamId, type PseudoCoreParamValues } from './manifest'

export interface PseudoCoreTools {
  readonly fill: boolean
  readonly mass: boolean
  readonly compare: boolean
}

export interface PseudoCoreState {
  readonly params: PseudoCoreParamValues
  readonly kIndex: number
  readonly bandIndex: number
  readonly tools: PseudoCoreTools
  readonly highlight: QuantityId | null
  readonly pulse: { readonly quantities: readonly QuantityId[]; readonly seq: number } | null

  setParam: (id: PseudoCoreParamId, value: number) => void
  selectState: (kIndex: number, bandIndex: number) => void
  nudgeState: (dk: number, dBand: number) => void
  toggleTool: (tool: keyof PseudoCoreTools) => void
  setHighlight: (q: QuantityId | null) => void
}

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x))

let pulseSeq = 0
function nextPulse(quantities: readonly QuantityId[]) {
  pulseSeq += 1
  return { quantities, seq: pulseSeq }
}

export const usePseudoCoreStore = create<PseudoCoreState>((set, get) => ({
  params: { ...DEFAULT_PARAMS },
  kIndex: NUMERICS.defaultKIndex,
  bandIndex: NUMERICS.defaultBandIndex,
  tools: { fill: false, mass: false, compare: false },
  highlight: null,
  pulse: null,

  setParam: (id, value) => {
    const spec = PARAMS.find((p) => p.id === id)
    if (!spec) return
    const rounded = Math.round(clamp(value, spec.min, spec.max) / spec.step) * spec.step
    const nextVal = clamp(Number(rounded.toFixed(4)), spec.min, spec.max)
    set((cur) => ({
      params: { ...cur.params, [id]: nextVal },
      pulse: nextPulse([spec.quantity, 'E'])
    }))
  },

  selectState: (kIndex, bandIndex) => {
    const ki = clamp(Math.round(kIndex), 0, NUMERICS.kPoints - 1)
    const bi = clamp(Math.round(bandIndex), 0, NUMERICS.numBands - 1)
    set({ kIndex: ki, bandIndex: bi })
  },

  nudgeState: (dk, dBand) => {
    const cur = get()
    const ki = clamp(cur.kIndex + dk, 0, NUMERICS.kPoints - 1)
    const bi = clamp(cur.bandIndex + dBand, 0, NUMERICS.numBands - 1)
    set({ kIndex: ki, bandIndex: bi })
  },

  toggleTool: (tool) => {
    set((cur) => ({
      tools: { ...cur.tools, [tool]: !cur.tools[tool] }
    }))
  },

  setHighlight: (q) => set({ highlight: q })
}))
