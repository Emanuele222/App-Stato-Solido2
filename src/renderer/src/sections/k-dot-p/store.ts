/**
 * Stato Zustand della sezione «Metodo k·p».
 * I cambi di preset o variante usano transizioni interpolate ('glide'); il
 * trascinamento degli slider segue subito ('follow').
 */
import { create } from 'zustand'
import type { KpKaneBandRole, KpTwoBandRole, KpVariant } from '../../physics'
import type { QuantityId } from '../../ui/theme'
import { DEFAULT_PARAMS, DEFAULT_PRESET_ID, NUMERICS, PARAMS, PRESETS, type KpParamId, type KpParamValues } from './manifest'

export interface KpTools {
  readonly fill: boolean
  readonly mass: boolean
  readonly compare: boolean
}

export type KpBandRole = KpKaneBandRole | KpTwoBandRole

export interface KpState {
  readonly variant: KpVariant
  readonly params: KpParamValues
  readonly presetId: string | null
  readonly transition: 'follow' | 'glide'
  /** Vettore d'onda scelto k ∈ [−kMax, +kMax] in Å⁻¹. */
  readonly k: number
  /** Ruolo della banda scelta ('c' | 'hh' | 'lh' | 'so'); in due bande 'so' ricade su 'lh'. */
  readonly role: KpBandRole
  readonly tools: KpTools
  readonly highlight: QuantityId | null
  readonly pulse: { readonly quantities: readonly QuantityId[]; readonly seq: number } | null

  setVariant: (variant: KpVariant) => void
  setParam: (id: KpParamId, value: number) => void
  applyPreset: (id: string | null) => void
  select: (k: number, role: KpBandRole) => void
  nudge: (dkSteps: number, dBand: number) => void
  toggleTool: (tool: keyof KpTools) => void
  setHighlight: (q: QuantityId | null) => void
}

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x))

function snapK(raw: number): number {
  const k = clamp(raw, -NUMERICS.kMax, NUMERICS.kMax)
  if (Math.abs(k) < NUMERICS.kSnap * 0.45) return 0
  return k
}

const KANE_ROLES: readonly KpKaneBandRole[] = ['so', 'lh', 'hh', 'c']
const TWO_BAND_ROLES: readonly KpTwoBandRole[] = ['lh', 'hh', 'c']

export function rolesForVariant(variant: KpVariant): readonly KpBandRole[] {
  return variant === 'kane' ? KANE_ROLES : TWO_BAND_ROLES
}

export function resolveRole(variant: KpVariant, role: KpBandRole): KpBandRole {
  if (variant === 'two-band' && role === 'so') return 'lh'
  return role
}

let pulseSeq = 0
function nextPulse(quantities: readonly QuantityId[]) {
  pulseSeq += 1
  return { quantities, seq: pulseSeq }
}

export const useKpStore = create<KpState>((set, get) => ({
  variant: 'kane',
  params: { ...DEFAULT_PARAMS },
  presetId: DEFAULT_PRESET_ID,
  transition: 'follow',
  k: NUMERICS.defaultK,
  role: 'c',
  tools: { fill: false, mass: false, compare: false },
  highlight: null,
  pulse: null,

  setVariant: (variant) => {
    const cur = get()
    if (cur.variant === variant) return
    set({
      variant,
      role: resolveRole(variant, cur.role),
      transition: 'glide',
      pulse: nextPulse(['E', 'Delta', 'mstar'])
    })
  },

  setParam: (id, value) => {
    const spec = PARAMS.find((p) => p.id === id)
    if (!spec) return
    const nextVal = clamp(value, spec.min, spec.max)
    set((cur) => ({
      params: { ...cur.params, [id]: nextVal },
      presetId: null,
      transition: 'follow',
      pulse: nextPulse([spec.quantity])
    }))
  },

  applyPreset: (id) => {
    if (!id) {
      set({ presetId: null })
      return
    }
    const preset = PRESETS.find((p) => p.id === id)
    if (!preset) return
    set({
      params: { eg: preset.eg, delta: preset.delta, ep: preset.ep },
      presetId: preset.id,
      transition: 'glide',
      pulse: nextPulse(['VG', 'Delta', 'EP', 'mstar'])
    })
  },

  select: (k, role) => {
    const cur = get()
    set({
      k: snapK(k),
      role: resolveRole(cur.variant, role)
    })
  },

  nudge: (dkSteps, dBand) => {
    const cur = get()
    const roles = rolesForVariant(cur.variant)
    const active = resolveRole(cur.variant, cur.role)
    const idx = Math.max(0, roles.indexOf(active))
    const nextIdx = clamp(idx + dBand, 0, roles.length - 1)
    const nextK = clamp(Math.round((cur.k + dkSteps * NUMERICS.kStep) / NUMERICS.kStep) * NUMERICS.kStep, -NUMERICS.kMax, NUMERICS.kMax)
    set({
      k: Math.abs(nextK) < 1e-6 ? 0 : nextK,
      role: roles[nextIdx]
    })
  },

  toggleTool: (tool) =>
    set((cur) => ({
      tools: { ...cur.tools, [tool]: !cur.tools[tool] }
    })),

  setHighlight: (q) => set({ highlight: q })
}))
