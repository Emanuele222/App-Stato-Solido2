/**
 * Modello calcolato della sezione «Calore specifico del reticolo».
 * Separa i calcoli fisici (memoizzati) dal rendering su Canvas 2D.
 */
import { useMemo } from 'react'
import {
  MATERIAL_PRESETS,
  PHONON_TO_PHOTON_POLARIZATION_FACTOR,
  THREE_R,
  debyeCvRatio,
  debyeDosDimless,
  debyeLowTCvRatio,
  debyeSpectralContribution,
  einsteinCvRatio,
  einsteinFunction,
  monatomic1DCvRatio,
  monatomicDos1DDimless,
  phononBlackBodyEnergyDensity,
  photonBlackBodyEnergyDensity,
  specificHeatSummary,
  type MaterialPresetData,
  type SpecificHeatSummary
} from '../../physics/specificHeat'
import {
  NUMERICS,
  type CvUnit,
  type HistoricalStage,
  type PlotScale,
  type SpecificHeatParams
} from './manifest'

export interface CurveSample {
  readonly t: number
  readonly dulongPetit: number
  readonly einstein: number
  readonly debye: number
  readonly debyeT3: number
  readonly chain1D: number
}

export interface SpectrumSample {
  readonly w: number
  readonly debyeDos: number
  readonly debyeActive: number
  readonly einsteinWeight: number
  readonly dos1D: number
  readonly dos1DActive: number
}

export interface BlackBodyComparison {
  readonly soundSpeedMS: number
  readonly phononEnergyDensityJm3: number
  readonly photonEnergyDensityJm3: number
  readonly polarizationFactor: number
  readonly regimeValidLowT: boolean
}

export interface SpecificHeatModel {
  readonly stage: HistoricalStage
  readonly scale: PlotScale
  readonly unit: CvUnit
  readonly showT3Asymptote: boolean
  readonly params: SpecificHeatParams
  readonly activeMaterial: MaterialPresetData | null
  readonly summary: SpecificHeatSummary
  readonly cvScaleFactor: number
  readonly linearSamples: readonly CurveSample[]
  readonly logSamples: readonly CurveSample[]
  readonly spectrumSamples: readonly SpectrumSample[]
  readonly blackBody: BlackBodyComparison
  readonly chain1DCvNormAtT: number
}

function buildCurveSamples(
  thetaDK: number,
  thetaEK: number,
  scale: PlotScale,
  include1D: boolean
): readonly CurveSample[] {
  const n = NUMERICS.curvePoints
  const tMin = NUMERICS.tMinPlotK
  const tMax = NUMERICS.tMaxPlotK
  const out: CurveSample[] = []
  for (let i = 0; i < n; i++) {
    const frac = i / (n - 1)
    const t =
      scale === 'loglog'
        ? tMin * Math.pow(tMax / tMin, frac)
        : tMin + (tMax - tMin) * frac
    out.push({
      t,
      dulongPetit: 1,
      einstein: einsteinCvRatio(t, thetaEK),
      debye: debyeCvRatio(t, thetaDK),
      debyeT3: debyeLowTCvRatio(t, thetaDK),
      chain1D: include1D ? monatomic1DCvRatio(t, thetaDK) : 0
    })
  }
  return out
}

function buildSpectrumSamples(
  temperatureK: number,
  thetaDK: number,
  include1D: boolean
): readonly SpectrumSample[] {
  const n = NUMERICS.spectrumPoints
  const out: SpectrumSample[] = []
  for (let i = 0; i < n; i++) {
    const w = (i / (n - 1)) * 1.0
    const debyeDos = debyeDosDimless(w)
    const einsteinWeight = einsteinFunction((w * thetaDK) / Math.max(1e-9, temperatureK))
    const debyeActive = debyeSpectralContribution(w, temperatureK, thetaDK)
    const wSafe1D = Math.min(w, NUMERICS.vanHoveMaxW)
    const raw1D = include1D ? monatomicDos1DDimless(wSafe1D) : 0
    const dos1D = include1D ? Math.min(NUMERICS.dos1DClipMax, raw1D) : 0
    const dos1DActive = dos1D * einsteinWeight
    out.push({
      w,
      debyeDos,
      debyeActive,
      einsteinWeight,
      dos1D,
      dos1DActive
    })
  }
  return out
}

export function useSpecificHeatModel(
  stage: HistoricalStage,
  scale: PlotScale,
  unit: CvUnit,
  showT3Asymptote: boolean,
  params: SpecificHeatParams,
  presetId: string | null
): SpecificHeatModel {
  const activeMaterial = useMemo(
    () => (presetId ? MATERIAL_PRESETS.find((m) => m.id === presetId) ?? null : null),
    [presetId]
  )

  const thetaDK = params.thetaDK
  const thetaEK = params.thetaDK * params.einsteinRatio
  const include1D = stage === 'beyond-1953'

  const linearSamples = useMemo(
    () => buildCurveSamples(thetaDK, thetaEK, 'linear', include1D),
    [thetaDK, thetaEK, include1D]
  )

  const logSamples = useMemo(
    () => buildCurveSamples(thetaDK, thetaEK, 'loglog', include1D),
    [thetaDK, thetaEK, include1D]
  )

  const spectrumSamples = useMemo(
    () => buildSpectrumSamples(params.temperatureK, thetaDK, include1D),
    [params.temperatureK, thetaDK, include1D]
  )

  const summary = useMemo(
    () => specificHeatSummary(params.temperatureK, thetaDK, params.einsteinRatio),
    [params.temperatureK, thetaDK, params.einsteinRatio]
  )

  const blackBody = useMemo<BlackBodyComparison>(() => {
    const soundSpeedMS = activeMaterial?.approxSoundSpeedMS ?? 3800
    return {
      soundSpeedMS,
      phononEnergyDensityJm3: phononBlackBodyEnergyDensity(params.temperatureK, soundSpeedMS),
      photonEnergyDensityJm3: photonBlackBodyEnergyDensity(params.temperatureK),
      polarizationFactor: PHONON_TO_PHOTON_POLARIZATION_FACTOR,
      regimeValidLowT: params.temperatureK <= thetaDK / 10
    }
  }, [activeMaterial, params.temperatureK, thetaDK])

  const chain1DCvNormAtT = useMemo(
    () => (include1D ? monatomic1DCvRatio(params.temperatureK, thetaDK) : 0),
    [include1D, params.temperatureK, thetaDK]
  )

  return {
    stage,
    scale,
    unit,
    showT3Asymptote,
    params,
    activeMaterial,
    summary,
    cvScaleFactor: unit === 'molar' ? THREE_R : 1,
    linearSamples,
    logSamples,
    spectrumSamples,
    blackBody,
    chain1DCvNormAtT
  }
}
