/**
 * Stato Zustand della sezione «Calore specifico del reticolo».
 */
import { create } from 'zustand'
import { MATERIAL_PRESETS } from '../../physics/specificHeat'
import type { QuantityId } from '../../ui/theme'
import type { QuantityPulse } from '../../viz/LiveFormula'
import {
  DEFAULT_PRESET_ID,
  INITIAL_PARAMS,
  SPECIFIC_HEAT_PARAMS,
  type CvUnit,
  type HistoricalStage,
  type PlotScale,
  type SpecificHeatParamId,
  type SpecificHeatParams
} from './manifest'

export type TransitionKind = 'follow' | 'glide'

export interface PhononSpecificHeatState {
  readonly stage: HistoricalStage
  readonly scale: PlotScale
  readonly unit: CvUnit
  readonly showT3Asymptote: boolean
  readonly params: SpecificHeatParams
  readonly presetId: string | null
  readonly transition: TransitionKind
  readonly highlight: QuantityId | null
  readonly pulse: QuantityPulse | null

  setStage(stage: HistoricalStage): void
  setScale(scale: PlotScale): void
  setUnit(unit: CvUnit): void
  toggleT3Asymptote(): void
  setParam(id: SpecificHeatParamId, value: number): void
  setTemperature(temperatureK: number): void
  nudgeTemperature(deltaK: number): void
  applyPreset(id: string | null): void
  setHighlight(q: QuantityId | null): void
}

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x))

function quantizeStep(v: number, step: number): number {
  return Math.round(v / step) * step
}

export const usePhononSpecificHeatStore = create<PhononSpecificHeatState>()((set, get) => ({
  stage: 'debye',
  scale: 'linear',
  unit: 'molar',
  showT3Asymptote: true,
  params: INITIAL_PARAMS,
  presetId: DEFAULT_PRESET_ID,
  transition: 'follow',
  highlight: null,
  pulse: null,

  setStage(stage) {
    if (get().stage === stage) return
    const nextScale: PlotScale =
      stage === 'comparison' || stage === 'beyond-1953' ? get().scale : get().scale
    set({
      stage,
      scale: nextScale,
      highlight: null
    })
  },

  setScale(scale) {
    if (get().scale !== scale) set({ scale })
  },

  setUnit(unit) {
    if (get().unit !== unit) set({ unit })
  },

  toggleT3Asymptote() {
    set({ showT3Asymptote: !get().showT3Asymptote })
  },

  setParam(id, value) {
    const spec = SPECIFIC_HEAT_PARAMS.find((p) => p.id === id)
    if (!spec) return
    const raw = clamp(quantizeStep(value, spec.step), spec.min, spec.max)
    const rounded = id === 'einsteinRatio' ? Math.round(raw * 100) / 100 : Math.round(raw)
    const seq = (get().pulse?.seq ?? 0) + 1
    // Modificare Θ_D porta il preset materiale in modalità "Libero"; variare solo T o Θ_E/Θ_D conserva il materiale selezionato per i punti sperimentali.
    const nextPresetId = id === 'thetaDK' ? null : get().presetId
    set({
      params: { ...get().params, [id]: rounded },
      presetId: nextPresetId,
      transition: 'follow',
      pulse: { quantities: [spec.quantity], seq }
    })
  },

  setTemperature(temperatureK) {
    const spec = SPECIFIC_HEAT_PARAMS[0]
    const rounded = clamp(Math.round(temperatureK), spec.min, spec.max)
    set({
      params: { ...get().params, temperatureK: rounded },
      transition: 'follow'
    })
  },

  nudgeTemperature(deltaK) {
    if (deltaK === 0) return
    const spec = SPECIFIC_HEAT_PARAMS[0]
    const cur = get().params.temperatureK
    const next = clamp(Math.round(cur + deltaK), spec.min, spec.max)
    set({
      params: { ...get().params, temperatureK: next },
      transition: 'follow'
    })
  },

  applyPreset(id) {
    if (id === null) {
      set({ presetId: null })
      return
    }
    const preset = MATERIAL_PRESETS.find((m) => m.id === id)
    if (!preset) return
    const seq = (get().pulse?.seq ?? 0) + 1
    // Per il diamante a 77 K è istruttivo mostrare il punto criogenico o mantenere T corrente;
    // lasciamo T invariata tranne quando si sceglie diamante se T > 1200, oppure manteniamo T corrente
    // così lo studente confronta materiali diversi alla stessa T!
    set({
      params: {
        ...get().params,
        thetaDK: preset.thetaDK,
        einsteinRatio: preset.defaultEinsteinRatio
      },
      presetId: preset.id,
      transition: 'glide',
      pulse: { quantities: ['Theta'], seq }
    })
  },

  setHighlight(q) {
    if (get().highlight !== q) set({ highlight: q })
  }
}))
