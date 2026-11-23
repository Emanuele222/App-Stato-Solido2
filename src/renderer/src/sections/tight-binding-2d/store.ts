/**
 * Stato Zustand della sezione «Legami forti in 2D».
 */
import { create } from 'zustand'
import { grapheneHighSymmetryPoints } from '../../physics'
import type { QuantityId } from '../../ui/theme'
import type { QuantityPulse } from '../../viz/LiveFormula'
import { INITIAL_GRAPHENE_T, INITIAL_SQUARE, NUMERICS_2D, type Lattice2D } from './manifest'

export type Tool2DId = 'fill' | 'mass' | 'compare'

export interface TightBinding2DState {
  readonly lattice: Lattice2D
  readonly squareParams: { readonly t: number; readonly a: number }
  readonly grapheneT: number
  readonly electrons: 1 | 2
  readonly selectedK: {
    readonly kx: number
    readonly ky: number
    readonly band: 0 | 1
    /** null se scelto cliccando fuori dal cammino sulla superficie 3D */
    readonly pathFrac: number | null
  }
  readonly tools: Readonly<Record<Tool2DId, boolean>>
  readonly cameraAction: { readonly seq: number; readonly mode: 'reset' | 'focus' }
  readonly highlight: QuantityId | null
  readonly pulse: QuantityPulse | null

  setLattice(lattice: Lattice2D): void
  setSquareParam(id: 't' | 'a', value: number): void
  setGrapheneT(value: number): void
  setElectrons(n: 1 | 2): void
  selectOnPath(kx: number, ky: number, band: 0 | 1, pathFrac: number): void
  selectSurfacePoint(kx: number, ky: number, band: 0 | 1): void
  toggleTool(id: Tool2DId): void
  triggerCamera(mode: 'reset' | 'focus'): void
  setHighlight(q: QuantityId | null): void
}

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x))

export const useTightBinding2DStore = create<TightBinding2DState>()((set, get) => ({
  lattice: 'square',
  squareParams: INITIAL_SQUARE,
  grapheneT: INITIAL_GRAPHENE_T,
  electrons: NUMERICS_2D.electrons.initial,
  selectedK: { kx: 0, ky: 0, band: 0, pathFrac: 0 },
  tools: { fill: false, mass: false, compare: false },
  cameraAction: { seq: 0, mode: 'reset' },
  highlight: null,
  pulse: null,

  setLattice(lattice) {
    if (get().lattice === lattice) return
    const sym = grapheneHighSymmetryPoints()
    const nextK =
      lattice === 'graphene'
        ? { kx: sym.K[0], ky: sym.K[1], band: 1 as const, pathFrac: 2 / 3 }
        : { kx: 0, ky: 0, band: 0 as const, pathFrac: 0 }
    set((s) => ({
      lattice,
      selectedK: nextK,
      cameraAction: { seq: s.cameraAction.seq + 1, mode: 'reset' }
    }))
  },

  setSquareParam(id, value) {
    const lo = id === 't' ? 0.2 : 2.0
    const hi = id === 't' ? 3.0 : 5.0
    const v = clamp(value, lo, hi)
    const cur = get()
    const seq = (cur.pulse?.seq ?? 0) + 1
    set({
      squareParams: { ...cur.squareParams, [id]: v },
      pulse: { quantities: [id], seq }
    })
  },

  setGrapheneT(value) {
    const v = clamp(value, 0.5, 4.0)
    const cur = get()
    const seq = (cur.pulse?.seq ?? 0) + 1
    set({
      grapheneT: v,
      pulse: { quantities: ['t'], seq }
    })
  },

  setElectrons(n) {
    set({ electrons: n === 2 ? 2 : 1 })
  },

  selectOnPath(kx, ky, band, pathFrac) {
    set({ selectedK: { kx, ky, band, pathFrac } })
  },

  selectSurfacePoint(kx, ky, band) {
    set({ selectedK: { kx, ky, band, pathFrac: null } })
  },

  toggleTool(id) {
    const cur = get().tools
    set({ tools: { ...cur, [id]: !cur[id] } })
  },

  triggerCamera(mode) {
    const cur = get()
    if (mode === 'focus' && cur.lattice === 'graphene') {
      const sym = grapheneHighSymmetryPoints()
      set({
        selectedK: { kx: sym.K[0], ky: sym.K[1], band: 1, pathFrac: null },
        cameraAction: { seq: cur.cameraAction.seq + 1, mode }
      })
      return
    }
    set({ cameraAction: { seq: cur.cameraAction.seq + 1, mode } })
  },

  setHighlight(highlight) {
    set({ highlight })
  }
}))
