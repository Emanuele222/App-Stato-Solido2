/**
 * Modello fisico derivato della sezione «Modi quantizzati e processi Umklapp».
 * Chiama esclusivamente funzioni pure di `physics/phononQuantum.ts` e `physics/phononDispersion.ts`.
 */
import { useMemo } from 'react'
import {
  analyze1BZCollision,
  boseEinsteinLevelProbabilities,
  classicalProbabilityDensityDimless,
  freqThzToOmegaRadS,
  monatomicDispersionCurve,
  monatomicSummary,
  oscillatorCurvesDimless,
  quantumModeSummary,
  thermalOscillatorSummary,
  thermalProbabilityDensityDimless,
  type MonatomicCurve,
  type MonatomicSummary,
  type OscillatorCurvesDimless,
  type QuantumModeSummary,
  type ThermalOscillatorSummary,
  type UmklappCollisionResult
} from '../../physics'
import {
  NUMERICS,
  REFERENCE_CRYSTAL,
  type QuantParams,
  type QuantizationSource,
  type UmklappParams
} from './manifest'

export interface QuantizationModel {
  readonly source: QuantizationSource
  readonly nInt: number
  readonly omegaRadS: number
  readonly modeSummary: QuantumModeSummary
  readonly thermalSummary: ThermalOscillatorSummary
  /** Intervallo simmetrico [−uMax, +uMax] in unità di a_ho. */
  readonly uMax: number
  /** Energia massima della finestra verticale sulla parabola (in unità di ħω). */
  readonly energyMaxUnits: number
  /** Curve campionate P_n(u), P_cl(u), ψ_n(u). */
  readonly curves: OscillatorCurvesDimless
  /** Densità termica esatta ⟨P(u)⟩_T (Mehler), profilo classico equivalente e riferimento P₀(u). */
  readonly thermalProb: Float64Array
  readonly thermalClassicalProb: Float64Array
  readonly groundProb: Float64Array
  /** Pesi di Bose–Einstein p_n(T) per n = 0 … maxBarN. */
  readonly levelWeights: Float64Array
  /** Rapporto visivo di ampiezza √(2n+1) oppure √(2n̄+1) rispetto allo stato fondamentale. */
  readonly ampFactorOverZp: number
}

export interface UmklappModel {
  readonly summary: MonatomicSummary
  readonly curve: MonatomicCurve
  readonly collision: UmklappCollisionResult
  readonly kRange: readonly [number, number]
  readonly yRange: readonly [number, number]
}

export function useQuantizationModel(
  source: QuantizationSource,
  params: QuantParams
): QuantizationModel {
  const nInt = Math.max(0, Math.min(25, Math.round(params.n)))
  const freqThz = Math.max(0.5, params.freqThz)
  const temperatureK = Math.max(1, params.temperatureK)

  return useMemo(() => {
    const omegaRadS = freqThzToOmegaRadS(freqThz)
    const oscParams = {
      massAmu: REFERENCE_CRYSTAL.massAmu,
      omegaRadS,
      latticeA: REFERENCE_CRYSTAL.a
    }
    const modeSummary = quantumModeSummary(oscParams, nInt)
    const thermalSummary = thermalOscillatorSummary(oscParams, temperatureK)

    const activeUCl = source === 'thermal' ? thermalSummary.uClEff : modeSummary.uCl
    const activeEUnits =
      source === 'thermal'
        ? Math.max(4.5, Math.min(28, thermalSummary.meanUnitsHbarOmega * 1.9 + 1.5))
        : Math.max(4.5, modeSummary.unitsHbarOmega + 1.5)

    // Finestra orizzontale simmetrica in unità di a_ho con margine per le code di tunneling
    const uMax = Math.max(3.6, activeUCl + 2.1, Math.sqrt(2 * activeEUnits) + 0.4)
    const energyMaxUnits = Math.max(activeEUnits, 0.5 * uMax * uMax * 0.92)

    const curves = oscillatorCurvesDimless(nInt, uMax, NUMERICS.oscillatorPoints)
    const groundCurves = nInt === 0 ? curves : oscillatorCurvesDimless(0, uMax, NUMERICS.oscillatorPoints)
    const thermalProb = new Float64Array(curves.u.length)
    const thermalClassicalProb = new Float64Array(curves.u.length)
    for (let i = 0; i < curves.u.length; i++) {
      const uv = curves.u[i]
      thermalProb[i] = thermalProbabilityDensityDimless(omegaRadS, temperatureK, uv)
      thermalClassicalProb[i] = classicalProbabilityDensityDimless(thermalSummary.uClEff, uv)
    }

    const levelWeights = boseEinsteinLevelProbabilities(
      omegaRadS,
      temperatureK,
      NUMERICS.maxThermalBars
    )

    const ampFactorOverZp =
      source === 'thermal'
        ? Math.sqrt(2 * thermalSummary.nBar + 1)
        : Math.sqrt(2 * nInt + 1)

    return {
      source,
      nInt,
      omegaRadS,
      modeSummary,
      thermalSummary,
      uMax,
      energyMaxUnits,
      curves,
      thermalProb,
      thermalClassicalProb,
      groundProb: groundCurves.probQuantum,
      levelWeights,
      ampFactorOverZp
    }
  }, [source, nInt, freqThz, temperatureK])
}

export function useUmklappModel(params: UmklappParams): UmklappModel {
  const { k1Frac, k2Frac } = params

  const summary = useMemo(() => monatomicSummary(REFERENCE_CRYSTAL), [])

  const kMaxPlot = 2 * summary.zoneEdge
  const curve = useMemo(
    () => monatomicDispersionCurve(REFERENCE_CRYSTAL, -kMaxPlot, kMaxPlot, NUMERICS.dispersionPoints),
    [kMaxPlot]
  )

  const collision = useMemo(
    () => analyze1BZCollision(k1Frac, k2Frac, REFERENCE_CRYSTAL),
    [k1Frac, k2Frac]
  )

  const yMax = Math.max(1.2, summary.freqMaxThz * 1.28)

  return {
    summary,
    curve,
    collision,
    kRange: [-kMaxPlot, kMaxPlot],
    yRange: [0, yMax]
  }
}
