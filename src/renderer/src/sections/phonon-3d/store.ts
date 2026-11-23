/**
 * Stato della sezione «Rami 3D, polarizzazioni e cristalli reali» (Zustand).
 */
import { create } from 'zustand'
import { CRYSTALS_3D, type BranchRole3D, type Crystal3DId } from '../../physics'
import type { QuantityId } from '../../ui/theme'
import type { QuantityPulse } from '../../viz/LiveFormula'
import {
  CRYSTAL_PRESETS,
  INITIAL_CRYSTAL_ID,
  INITIAL_PARAMS,
  NUMERICS,
  PARAMS,
  type ParamId,
  type Params
} from './manifest'

export type DisplayUnit = 'meV' | 'THz'
export type TransitionKind = 'follow' | 'glide'

export interface Phonon3DState {
  readonly crystalId: Crystal3DId
  readonly params: Params
  readonly transition: TransitionKind
  /** Non null quando i parametri corrispondono al profilo calibrato Tab. 1 del cristallo. */
  readonly presetId: Crystal3DId | null
  /** Indice del punto lungo il cammino Γ–X–K–Γ–L (0…160). */
  readonly pointIndex: number
  /** Ruolo fisico del ramo selezionato (LA, TA1, TA2, LO, TO1, TO2). */
  readonly selectedRole: BranchRole3D
  /** Unità verticale di DispersionPlot e indicatori principali ('THz' | 'meV'). */
  readonly unit: DisplayUnit
  /** Strumento «Conteggio modi 3D (1BZ)» (Fig. 17 + bilancio 3p·N_c). */
  readonly showCounting: boolean
  /** Celle convenzionali per lato N nello strumento di conteggio (4…12, default 8). */
  readonly bvkN: number
  readonly highlight: QuantityId | null
  readonly pulse: QuantityPulse | null

  selectCrystal(id: Crystal3DId): void
  setParam(id: ParamId, value: number): void
  selectState(pointIndex: number, role: BranchRole3D): void
  nudge(dx: number, dBranch: number, freqOrderedRoles?: readonly BranchRole3D[]): void
  toggleUnit(): void
  setUnit(unit: DisplayUnit): void
  toggleCounting(): void
  setBvkN(n: number): void
  setHighlight(q: QuantityId | null): void
}

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x))

const ROLES_P1: readonly BranchRole3D[] = ['TA1', 'TA2', 'LA']
const ROLES_P2: readonly BranchRole3D[] = ['TA1', 'TA2', 'LA', 'TO1', 'TO2', 'LO']

export const usePhonon3DStore = create<Phonon3DState>()((set, get) => ({
  crystalId: INITIAL_CRYSTAL_ID,
  params: INITIAL_PARAMS,
  transition: 'follow',
  presetId: INITIAL_CRYSTAL_ID,
  pointIndex: NUMERICS.initialPointIndex,
  selectedRole: 'LO',
  unit: 'THz',
  showCounting: false,
  bvkN: NUMERICS.defaultBvkN,
  highlight: null,
  pulse: null,

  selectCrystal(id) {
    const preset = CRYSTAL_PRESETS.find((p) => p.id === id)
    if (!preset) return
    const mat = CRYSTALS_3D[id]
    const curRole = get().selectedRole
    const nextRole: BranchRole3D =
      mat.basisCount === 1 && (curRole === 'LO' || curRole === 'TO1' || curRole === 'TO2')
        ? 'LA'
        : curRole
    const seq = (get().pulse?.seq ?? 0) + 1
    set({
      crystalId: id,
      params: {
        transverseRatio: preset.transverseRatio,
        polarRatio: preset.polarRatio
      },
      transition: 'glide',
      presetId: id,
      selectedRole: nextRole,
      unit: preset.defaultUnit,
      pulse: { quantities: ['C', 'omega', 'omegaOpt', 'M'], seq }
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

  selectState(pointIndex, role) {
    const mat = CRYSTALS_3D[get().crystalId]
    const validRoles = mat.basisCount === 1 ? ROLES_P1 : ROLES_P2
    const nextRole = validRoles.includes(role) ? role : 'LA'
    set({
      pointIndex: clamp(Math.round(pointIndex), 0, NUMERICS.totalPoints - 1),
      selectedRole: nextRole
    })
  },

  nudge(dx, dBranch, freqOrderedRoles) {
    const st = get()
    const mat = CRYSTALS_3D[st.crystalId]
    const roles =
      freqOrderedRoles && freqOrderedRoles.length === 3 * mat.basisCount
        ? freqOrderedRoles
        : mat.basisCount === 1
          ? ROLES_P1
          : ROLES_P2
    const nextIdx = clamp(st.pointIndex + dx * NUMERICS.kNudgePoints, 0, NUMERICS.totalPoints - 1)
    let nextRole = st.selectedRole
    if (dBranch !== 0) {
      const curPos = Math.max(0, roles.indexOf(st.selectedRole))
      const nextPos = clamp(curPos + dBranch, 0, roles.length - 1)
      nextRole = roles[nextPos]
    }
    set({ pointIndex: nextIdx, selectedRole: nextRole })
  },

  toggleUnit() {
    set({ unit: get().unit === 'THz' ? 'meV' : 'THz' })
  },

  setUnit(unit) {
    set({ unit })
  },

  toggleCounting() {
    set({ showCounting: !get().showCounting })
  },

  setBvkN(n) {
    set({ bvkN: clamp(Math.round(n), NUMERICS.minBvkN, NUMERICS.maxBvkN) })
  },

  setHighlight(q) {
    if (get().highlight !== q) set({ highlight: q })
  }
}))
