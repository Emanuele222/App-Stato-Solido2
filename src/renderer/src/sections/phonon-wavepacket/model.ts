/**
 * Calcolo dello stato fisico derivato per la sezione «Pacchetti d'onda: velocità di fase e di gruppo».
 * Chiama esclusivamente funzioni pure di `physics/phononDispersion.ts`.
 */
import { useMemo } from 'react'
import {
  ANGSTROM_IN_M,
  monatomicSoundSpeed,
  velocityMsToThzAngstrom,
  wavepacketCharacteristics,
  wavepacketDispersionCurve,
  wavepacketWidthAt,
  type WavepacketCharacteristics,
  type WavepacketDispersionCurve,
  type WavepacketParams,
  type WavepacketRegime
} from '../../physics'
import { DIATOMIC_REF, MONATOMIC_REF, NUMERICS, type Params } from './manifest'

export interface SpreadCurveData {
  readonly tS: Float64Array
  readonly ratio: Float64Array
  readonly tMaxS: number
  readonly maxRatio: number
  readonly unitLabel: 'ps' | 'fs'
  readonly unitFactor: number
}

export interface SpectralProfileData {
  readonly k: Float64Array
  /** Valore scalato in THz per essere sovrapposto alla base di DispersionPlot. */
  readonly yThz: Float64Array
  readonly kLeft: number
  readonly kRight: number
}

export interface WavepacketModel {
  readonly wpParams: WavepacketParams
  readonly characteristics: WavepacketCharacteristics
  readonly curve: WavepacketDispersionCurve
  readonly linearRefCurve: WavepacketDispersionCurve | null
  readonly spectralProfile: SpectralProfileData
  readonly spreadCurve: SpreadCurveData
  readonly kRange: readonly [number, number]
  readonly yRange: readonly [number, number]
  readonly slopeVpThzA: number | null
  readonly slopeVgThzA: number
}

export function usePhononWavepacketModel(
  regime: WavepacketRegime,
  params: Params
): WavepacketModel {
  const { kFrac, sigma0InA } = params
  const latticeA = regime === 'optical' ? DIATOMIC_REF.a : MONATOMIC_REF.a
  const zoneEdge = Math.PI / latticeA
  const k0 = kFrac * zoneEdge
  const sigma0Ang = sigma0InA * latticeA

  const wpParams = useMemo<WavepacketParams>(
    () => ({
      regime,
      k0,
      sigma0Ang,
      monatomic: MONATOMIC_REF,
      diatomic: DIATOMIC_REF,
      freeMassRatio: 1
    }),
    [regime, k0, sigma0Ang]
  )

  const characteristics = useMemo(() => wavepacketCharacteristics(wpParams), [wpParams])

  const curve = useMemo(
    () => wavepacketDispersionCurve(wpParams, -zoneEdge, zoneEdge, NUMERICS.kPoints1BZ),
    [wpParams, zoneEdge]
  )

  const linearRefCurve = useMemo(() => {
    if (regime !== 'acoustic') return null
    return wavepacketDispersionCurve(
      { ...wpParams, regime: 'linear' },
      -zoneEdge,
      zoneEdge,
      NUMERICS.kPoints1BZ
    )
  }, [regime, wpParams, zoneEdge])

  let yPeakCurve = 0
  for (let i = 0; i < curve.freqThz.length; i++) {
    if (curve.freqThz[i] > yPeakCurve) yPeakCurve = curve.freqThz[i]
  }
  const yMax = Math.max(1.2, yPeakCurve * 1.18)

  const spectralProfile = useMemo<SpectralProfileData>(() => {
    const n = curve.k.length
    const yThz = new Float64Array(n)
    const dk = characteristics.deltaKAngInv
    const amp = yMax * 0.17
    const invTwoDkSq = 1 / (2 * dk * dk)
    for (let i = 0; i < n; i++) {
      const diff = curve.k[i] - k0
      yThz[i] = amp * Math.exp(-diff * diff * invTwoDkSq)
    }
    return {
      k: curve.k,
      yThz,
      kLeft: Math.max(-zoneEdge, k0 - dk),
      kRight: Math.min(zoneEdge, k0 + dk)
    }
  }, [curve.k, characteristics.deltaKAngInv, k0, yMax, zoneEdge])

  const spreadCurve = useMemo<SpreadCurveData>(() => {
    const vgAngPerS = characteristics.vgMs / ANGSTROM_IN_M
    const vsAngPerS = monatomicSoundSpeed(MONATOMIC_REF) / ANGSTROM_IN_M
    const tRef = (NUMERICS.maxTravelInA * latticeA) / vsAngPerS
    const tTravel =
      Math.abs(vgAngPerS) > 1e-6 ? (NUMERICS.maxTravelInA * latticeA) / Math.abs(vgAngPerS) : Infinity
    const tauDisp = characteristics.spreadingTimeScaleS

    let tMaxS: number
    if (Number.isFinite(tTravel)) {
      if (regime === 'quadratic') {
        tMaxS = tTravel
      } else {
        tMaxS = tauDisp !== null ? Math.min(tTravel, Math.max(1.8 * tauDisp, 1.5 * tRef)) : Math.min(tTravel, 2.5 * tRef)
      }
    } else {
      tMaxS = tauDisp !== null ? 1.8 * tauDisp : 2.5 * tRef
    }

    const n = NUMERICS.spreadPoints
    const tS = new Float64Array(n)
    const ratio = new Float64Array(n)
    let maxRatio = 1
    for (let i = 0; i < n; i++) {
      const ti = (tMaxS * i) / (n - 1)
      const w = wavepacketWidthAt(characteristics.sigma0Ang, characteristics.omegaSecondAng2S, ti)
      tS[i] = ti
      ratio[i] = w.spreadRatio
      if (w.spreadRatio > maxRatio) maxRatio = w.spreadRatio
    }

    const useFs = tMaxS < 5e-13
    return {
      tS,
      ratio,
      tMaxS,
      maxRatio,
      unitLabel: useFs ? 'fs' : 'ps',
      unitFactor: useFs ? 1e15 : 1e12
    }
  }, [
    characteristics.vgMs,
    characteristics.spreadingTimeScaleS,
    characteristics.sigma0Ang,
    characteristics.omegaSecondAng2S,
    latticeA,
    regime
  ])

  const slopeVpThzA =
    characteristics.vpMs !== null ? velocityMsToThzAngstrom(characteristics.vpMs) : null
  const slopeVgThzA = velocityMsToThzAngstrom(characteristics.vgMs)

  return {
    wpParams,
    characteristics,
    curve,
    linearRefCurve,
    spectralProfile,
    spreadCurve,
    kRange: [-zoneEdge, zoneEdge],
    yRange: [0, yMax],
    slopeVpThzA,
    slopeVgThzA
  }
}
