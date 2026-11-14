/**
 * Stato della sezione «Reticolo vuoto e schemi di zona» (Zustand).
 * Il parametro `a` è il bersaglio per l'inseguimento interpolato (FOLLOW);
 * lo schema guida l'animazione continua di ripiegamento nel canvas.
 */
import { create } from 'zustand'
import type { QuantityPulse } from '../../viz/LiveFormula'
import type { QuantityId } from '../../ui/theme'
import { branchCoordinates1D, emptyLatticeBranchIndex, emptyLatticeBranchState1D, zoneEdge1D } from '../../physics'
import { INITIAL_PARAMS, NUMERICS, PARAMS, type ParamId, type Params, type ZoneScheme } from './manifest'

export type ToolId = 'fill' | 'mass' | 'compare'
export type HighlightTarget = 'a' | 'G' | null

export interface EmptyLatticeState {
  readonly params: Params
  readonly scheme: ZoneScheme
  /** k′ nella prima zona, in unità di π/a (−1…1). */
  readonly kFracReduced: number
  /** Indice intero n del ramo G = 2πn/a (k_ext = k′ + G). */
  readonly branchN: number
  readonly tools: Readonly<Record<ToolId, boolean>>
  readonly electrons: number
  readonly highlight: QuantityId | null
  readonly highlightTarget: HighlightTarget
  readonly pulse: QuantityPulse | null

  setParam(id: ParamId, value: number): void
  setScheme(scheme: ZoneScheme): void
  selectBranchState(kFracReduced: number, branchN: number): void
  selectExtended(kExtended: number): void
  nudge(dk: number, dBand: number): void
  toggleTool(id: ToolId): void
  setElectrons(n: number): void
  setHighlight(q: QuantityId | null, target?: HighlightTarget): void
}

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x))

function snapKFrac(kFrac: number): number {
  const k = clamp(kFrac, -1, 1)
  if (Math.abs(k) < NUMERICS.kSnap) return 0
  if (1 - Math.abs(k) < NUMERICS.kSnap) return Math.sign(k)
  return k
}

export const useEmptyLatticeStore = create<EmptyLatticeState>()((set, get) => ({
  params: INITIAL_PARAMS,
  scheme: 'extended',
  kFracReduced: NUMERICS.initialState.kFracReduced,
  branchN: NUMERICS.initialState.branchN,
  tools: { fill: false, mass: false, compare: false },
  electrons: NUMERICS.electrons.initial,
  highlight: null,
  highlightTarget: null,
  pulse: null,

  setParam(id, value) {
    const spec = PARAMS.find((p) => p.id === id)
    if (!spec) return
    const v = clamp(value, spec.min, spec.max)
    const seq = (get().pulse?.seq ?? 0) + 1
    set({
      params: { ...get().params, [id]: v },
      pulse: { quantities: [spec.quantity], seq }
    })
  },

  setScheme(scheme) {
    if (get().scheme !== scheme) set({ scheme })
  },

  selectBranchState(kFracReduced, branchN) {
    set({
      kFracReduced: snapKFrac(kFracReduced),
      branchN: clamp(Math.round(branchN), -NUMERICS.maxBranchN, NUMERICS.maxBranchN)
    })
  },

  selectExtended(kExtended) {
    const c = branchCoordinates1D(kExtended, get().params.a, NUMERICS.maxBranchN)
    set({
      kFracReduced: snapKFrac(c.kFracReduced),
      branchN: c.branchN
    })
  },

  nudge(dk, dBand) {
    const { params, scheme, kFracReduced, branchN } = get()
    const a = params.a
    const edge = zoneEdge1D(a)
    if (scheme === 'extended' && dk !== 0 && dBand === 0) {
      const current = emptyLatticeBranchState1D(kFracReduced * edge, branchN, a).kExtended / edge
      const kExtFrac = current + dk * NUMERICS.kNudge
      const maxFrac = 2 * NUMERICS.maxBranchN + 1
      const clamped = Math.round(clamp(kExtFrac, -maxFrac, maxFrac) / NUMERICS.kNudge) * NUMERICS.kNudge
      const c = branchCoordinates1D(clamped * edge, a, NUMERICS.maxBranchN)
      set({ kFracReduced: c.kFracReduced, branchN: c.branchN })
      return
    }

    const nextKFrac =
      dk !== 0
        ? clamp(Math.round((kFracReduced + dk * NUMERICS.kNudge) / NUMERICS.kNudge) * NUMERICS.kNudge, -1, 1)
        : kFracReduced

    if (dBand !== 0) {
      const kRed = nextKFrac * edge
      const currentState = emptyLatticeBranchState1D(kRed, branchN, a)
      const nextBand = clamp(currentState.band + dBand, 0, NUMERICS.compareBands - 1)
      const nextN = clamp(
        emptyLatticeBranchIndex(kRed, nextBand, a),
        -NUMERICS.maxBranchN,
        NUMERICS.maxBranchN
      )
      set({ kFracReduced: nextKFrac, branchN: nextN })
      return
    }

    set({ kFracReduced: nextKFrac })
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
