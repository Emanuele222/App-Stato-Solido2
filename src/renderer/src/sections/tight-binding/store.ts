/**
 * Stato della sezione «Legami forti» (Zustand).
 */
import { create } from 'zustand'
import { calibrateIndicativeHoppingAtA0, indicativeHoppingAtDistance } from '../../physics'
import type { QuantityId } from '../../ui/theme'
import type { QuantityPulse } from '../../viz/LiveFormula'
import {
  DIATOMIC_PARAMS,
  INDICATIVE_DISTANCE_LAW,
  INITIAL_DIATOMIC_PARAMS,
  INITIAL_MONO_PARAMS,
  MONO_PARAMS,
  NUMERICS,
  type DiatomicParamId,
  type DiatomicParams,
  type MonoParamId,
  type MonoParams,
  type TightBindingVariant
} from './manifest'

export type ToolId = 'fill' | 'mass' | 'compare'

export type TightBindingHighlightTarget = 'tS' | 'absTP' | 'centerS' | 'centerP' | 'eA' | 'eB' | null

export interface TightBindingState {
  readonly variant: TightBindingVariant
  readonly monoParams: MonoParams
  readonly diatomicParams: DiatomicParams
  /** Interruttore «Avvicina gli atomi» nella monoatomica. */
  readonly linkDistance: boolean
  /** Valori di riferimento t(a₀) salvati quando si attiva l'interruttore. */
  readonly tRefAtA0: { readonly tS: number; readonly absTP: number }
  /** Stato scelto: k in unità di π/a (−1…1), indice di banda 0..1. */
  readonly kFrac: number
  readonly band: 0 | 1
  readonly tools: Readonly<Record<ToolId, boolean>>
  readonly electrons: number
  readonly highlight: QuantityId | null
  readonly highlightTarget: TightBindingHighlightTarget
  readonly pulse: QuantityPulse | null

  setVariant(variant: TightBindingVariant): void
  setMonoParam(id: MonoParamId, value: number): void
  setDiatomicParam(id: DiatomicParamId, value: number): void
  toggleLinkDistance(): void
  select(kFrac: number, band: number): void
  nudge(dk: number, dBand: number): void
  toggleTool(id: ToolId): void
  setElectrons(n: number): void
  setHighlight(q: QuantityId | null, target?: TightBindingHighlightTarget): void
}

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x))

function snapK(kFrac: number): number {
  const k = clamp(kFrac, -1, 1)
  if (Math.abs(k) < NUMERICS.kSnap) return 0
  if (1 - Math.abs(k) < NUMERICS.kSnap) return Math.sign(k)
  return k
}

export const useTightBindingStore = create<TightBindingState>()((set, get) => ({
  variant: 'monoatomic',
  monoParams: INITIAL_MONO_PARAMS,
  diatomicParams: INITIAL_DIATOMIC_PARAMS,
  linkDistance: false,
  tRefAtA0: { tS: INITIAL_MONO_PARAMS.tS, absTP: INITIAL_MONO_PARAMS.absTP },
  kFrac: 0,
  band: 0,
  tools: { fill: false, mass: false, compare: false },
  electrons: NUMERICS.electrons.initial,
  highlight: null,
  highlightTarget: null,
  pulse: null,

  setVariant(variant) {
    if (get().variant === variant) return
    const nextElectrons = variant === 'diatomic' ? Math.min(get().electrons, 2) : get().electrons
    set({ variant, electrons: nextElectrons })
  },

  setMonoParam(id, value) {
    const spec = MONO_PARAMS.find((p) => p.id === id)
    if (!spec) return
    const v = clamp(value, spec.min, spec.max)
    const cur = get()
    const seq = (cur.pulse?.seq ?? 0) + 1
    let next = { ...cur.monoParams, [id]: v }
    const pulseQuantities: QuantityId[] = [spec.quantity]

    if (cur.linkDistance && id === 'a') {
      next = {
        ...next,
        tS: indicativeHoppingAtDistance(v, INDICATIVE_DISTANCE_LAW.a0, cur.tRefAtA0.tS, INDICATIVE_DISTANCE_LAW.ell),
        absTP: indicativeHoppingAtDistance(
          v,
          INDICATIVE_DISTANCE_LAW.a0,
          cur.tRefAtA0.absTP,
          INDICATIVE_DISTANCE_LAW.ell
        )
      }
      pulseQuantities.push('t')
    }

    set({
      monoParams: next,
      pulse: { quantities: pulseQuantities, seq }
    })
  },

  setDiatomicParam(id, value) {
    const spec = DIATOMIC_PARAMS.find((p) => p.id === id)
    if (!spec) return
    const cur = get()
    let v = clamp(value, spec.min, spec.max)
    // Impone E_A ≤ E_B rendendo raggiungibile E_A = E_B da entrambi i lati.
    if (id === 'eA') v = Math.min(v, cur.diatomicParams.eB)
    if (id === 'eB') v = Math.max(v, cur.diatomicParams.eA)
    const seq = (cur.pulse?.seq ?? 0) + 1
    set({
      diatomicParams: { ...cur.diatomicParams, [id]: v },
      pulse: { quantities: [spec.quantity], seq }
    })
  },

  toggleLinkDistance() {
    const cur = get()
    const nextOn = !cur.linkDistance
    const { a0, ell } = INDICATIVE_DISTANCE_LAW
    if (nextOn) {
      set({
        linkDistance: true,
        tRefAtA0: {
          tS: calibrateIndicativeHoppingAtA0(cur.monoParams.a, a0, cur.monoParams.tS, ell),
          absTP: calibrateIndicativeHoppingAtA0(cur.monoParams.a, a0, cur.monoParams.absTP, ell)
        }
      })
    } else {
      const tSSpec = MONO_PARAMS.find((p) => p.id === 'tS')!
      const tPSpec = MONO_PARAMS.find((p) => p.id === 'absTP')!
      set({
        linkDistance: false,
        monoParams: {
          ...cur.monoParams,
          tS: clamp(cur.monoParams.tS, tSSpec.min, tSSpec.max),
          absTP: clamp(cur.monoParams.absTP, tPSpec.min, tPSpec.max)
        }
      })
    }
  },

  select(kFrac, band) {
    set({
      kFrac: snapK(kFrac),
      band: band >= 1 ? 1 : 0
    })
  },

  nudge(dk, dBand) {
    const cur = get()
    const kFrac = dk !== 0 ? snapK(cur.kFrac + dk * NUMERICS.kNudge) : cur.kFrac
    const band: 0 | 1 = dBand > 0 ? 1 : dBand < 0 ? 0 : cur.band
    set({ kFrac, band })
  },

  toggleTool(id) {
    const cur = get().tools
    set({ tools: { ...cur, [id]: !cur[id] } })
  },

  setElectrons(n) {
    const maxE = get().variant === 'diatomic' ? 2 : NUMERICS.electrons.max
    set({ electrons: clamp(Math.round(n), NUMERICS.electrons.min, maxE) })
  },

  setHighlight(highlight, highlightTarget = null) {
    set({ highlight, highlightTarget })
  }
}))
