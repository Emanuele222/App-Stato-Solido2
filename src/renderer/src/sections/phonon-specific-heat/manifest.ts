/**
 * Manifest della sezione 6 — Calore specifico del reticolo: evoluzione storica e modello di Debye
 * (dispensa Parte 6, Lezione 4: §§20–23, §25, Figg. 22–27, Tabb. 2–4, eqq. 52–59 e 61–62).
 */
import { MATERIAL_PRESETS, type MaterialPresetData } from '../../physics/specificHeat'
import type { QuantityId } from '../../ui/theme'

export type HistoricalStage =
  | 'dulong-petit'
  | 'einstein'
  | 'debye'
  | 'beyond-1953'
  | 'comparison'

export type PlotScale = 'linear' | 'loglog'
export type CvUnit = 'ratio' | 'molar'

export type SpecificHeatParamId = 'temperatureK' | 'thetaDK' | 'einsteinRatio'
export type SpecificHeatParams = Readonly<Record<SpecificHeatParamId, number>>

export interface SpecificHeatParamSpec {
  readonly id: SpecificHeatParamId
  readonly symbol: string
  readonly quantity: QuantityId
  readonly unit: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly digits: number
}

export const SPECIFIC_HEAT_PARAMS: readonly SpecificHeatParamSpec[] = [
  {
    id: 'temperatureK',
    symbol: 'T',
    quantity: 'T',
    unit: 'K',
    min: 5,
    max: 1500,
    step: 1,
    digits: 0
  },
  {
    id: 'thetaDK',
    symbol: '\\Theta_D',
    quantity: 'Theta',
    unit: 'K',
    min: 30,
    max: 2500,
    step: 5,
    digits: 0
  },
  {
    id: 'einsteinRatio',
    symbol: '\\Theta_E/\\Theta_D',
    quantity: 'omegaOpt',
    unit: '',
    min: 0.5,
    max: 1.0,
    step: 0.01,
    digits: 2
  }
]

export const HISTORICAL_STAGES: readonly {
  readonly id: HistoricalStage
  readonly quantity: QuantityId
}[] = [
  { id: 'dulong-petit', quantity: 'Ek' },
  { id: 'einstein', quantity: 'omegaOpt' },
  { id: 'debye', quantity: 'CV' },
  { id: 'beyond-1953', quantity: 'omega' },
  { id: 'comparison', quantity: 'T' }
]

export const DEFAULT_PRESET_ID = 'copper'

export const INITIAL_PARAMS: SpecificHeatParams = {
  temperatureK: 77,
  thetaDK: 343,
  einsteinRatio: 0.75
}

export const MATERIAL_PRESET_OPTIONS: readonly {
  readonly id: string
  readonly label: string
  readonly data: MaterialPresetData
}[] = MATERIAL_PRESETS.map((m) => ({
  id: m.id,
  label: `${m.name} (${m.symbol}, ${m.thetaDK} K)`,
  data: m
}))

export const NUMERICS = {
  /** Numero di punti campionati lungo T per la curva C_V(T) (lineare e log-log). */
  curvePoints: 260,
  /** Numero di punti campionati lungo w = ω / ω_D per lo spettro DOS. */
  spectrumPoints: 220,
  /** Temperatura minima del dominio grafico C_V(T) in K. */
  tMinPlotK: 5,
  /** Temperatura massima del dominio grafico C_V(T) in K. */
  tMaxPlotK: 1500,
  /** Limite superiore in unità di 3R per lasciare margine ai dati sopra 3R (es. Na 27,6). */
  linearRatioMax: 1.18,
  /** Intervallo log-log verticale in unità di C_V / 3R. */
  logRatioMin: 1e-5,
  logRatioMax: 1.6,
  /** Passo tastiera su T sul canvas C_V(T). */
  tNudgeK: 5,
  /** Massima w/ω_max per il campionamento della singolarità di Van Hove 1D senza plateau prematuro. */
  vanHoveMaxW: 0.997,
  /** Rapporto massimo verticale della DOS adimensionale nel grafico 1953. */
  dos1DClipMax: 6.2
} as const
