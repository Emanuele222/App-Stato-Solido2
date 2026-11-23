/**
 * Calcolo dello stato fisico derivato per la sezione «Catena monatomica».
 * Chiama esclusivamente funzioni pure di `physics/phononDispersion.ts`.
 */
import { useMemo } from 'react'
import {
  bvkAllowedK1D,
  bvkSnapToAllowedK,
  monatomicAdjacentAlias,
  monatomicDispersionCurve,
  monatomicGroupVelocity,
  monatomicOmega,
  monatomicPhaseVelocity,
  monatomicSummary,
  radSToMev,
  radSToThz,
  velocityMsToThzAngstrom,
  type BvkGrid1D,
  type MonatomicCurve,
  type MonatomicSummary
} from '../../physics'
import { NUMERICS, type Params } from './manifest'
import type { ToolId } from './store'

export interface MonatomicSelection {
  readonly kFrac: number
  /** Vettore d'onda k in Å⁻¹. */
  readonly k: number
  /** Pulsazione ω(k) in rad·s⁻¹. */
  readonly omegaRadS: number
  /** Frequenza ν(k) in THz. */
  readonly freqThz: number
  /** Energia fononica ħω(k) in meV. */
  readonly energyMev: number
  /** Lunghezza d'onda λ = 2π/|k| in Å (null per k = 0). */
  readonly wavelengthA: number | null
  /** Velocità di gruppo v_g(k) in m·s⁻¹. */
  readonly vgMs: number
  /** Velocità di fase v_p(k) in m·s⁻¹. */
  readonly vpMs: number
  /** Pendenza locale dν/dk in THz·Å per la tangente sul diagramma. */
  readonly slopeVgThzA: number
  readonly atOrigin: boolean
  readonly atEdge: boolean
  /** Vettore equivalente fuori 1BZ k' = k + m·G (m ∈ {−1, +1}). */
  readonly aliasK: number
  readonly aliasM: -1 | 1
  /** Intero j del modo Born–von Kármán più vicino (se BvK è attivo). */
  readonly bvkJ: number | null
}

export interface MonatomicModel {
  readonly summary: MonatomicSummary
  readonly curve: MonatomicCurve
  readonly kRange: readonly [number, number]
  readonly yRange: readonly [number, number]
  /** Pendenza dν/dk della retta acustica ω = v_s |k| in THz·Å. */
  readonly soundSlopeThzA: number
  readonly selection: MonatomicSelection
  readonly bvkGrid: BvkGrid1D | null
  readonly bvkPoints: readonly { readonly x: number; readonly y: number }[]
}

export function usePhononMonatomicModel(
  params: Params,
  kFrac: number,
  tools: Readonly<Record<ToolId, boolean>>,
  bvkN: number
): MonatomicModel {
  const { a, massAmu, springC } = params

  const summary = useMemo(
    () => monatomicSummary({ a, massAmu, springC }),
    [a, massAmu, springC]
  )

  const kMaxPlot = NUMERICS.kZonesHalf * summary.zoneEdge
  const curve = useMemo(
    () => monatomicDispersionCurve({ a, massAmu, springC }, -kMaxPlot, kMaxPlot, NUMERICS.kPoints),
    [a, massAmu, springC, kMaxPlot]
  )

  const bvkGrid = useMemo(
    () => (tools.bvk ? bvkAllowedK1D(a, bvkN) : null),
    [tools.bvk, a, bvkN]
  )

  const bvkPoints = useMemo(() => {
    if (!bvkGrid) return []
    const p = { a, massAmu, springC }
    return bvkGrid.modes.map((m) => ({
      x: m.k,
      y: radSToThz(monatomicOmega(m.k, p))
    }))
  }, [bvkGrid, a, massAmu, springC])

  const selection = useMemo<MonatomicSelection>(() => {
    const p = { a, massAmu, springC }
    const snappedMode = tools.bvk ? bvkSnapToAllowedK(kFrac * summary.zoneEdge, a, bvkN) : null
    const effKFrac = snappedMode ? snappedMode.kFrac : kFrac
    const k = effKFrac * summary.zoneEdge
    const omegaRadS = monatomicOmega(k, p)
    const freqThz = radSToThz(omegaRadS)
    const energyMev = radSToMev(omegaRadS)
    const atOrigin = Math.abs(effKFrac) < 1e-4
    const atEdge = Math.abs(Math.abs(effKFrac) - 1) < 1e-4
    const wavelengthA = atOrigin ? null : (2 * Math.PI) / Math.abs(k)
    const vgMs = monatomicGroupVelocity(k, p)
    const vpMs = monatomicPhaseVelocity(k, p)
    const slopeVgThzA = velocityMsToThzAngstrom(vgMs)
    const { kAlias, m } = monatomicAdjacentAlias(k, a)

    return {
      kFrac: effKFrac,
      k,
      omegaRadS,
      freqThz,
      energyMev,
      wavelengthA,
      vgMs,
      vpMs,
      slopeVgThzA,
      atOrigin,
      atEdge,
      aliasK: kAlias,
      aliasM: m,
      bvkJ: snappedMode ? snappedMode.j : null
    }
  }, [a, massAmu, springC, kFrac, tools.bvk, bvkN, summary.zoneEdge])

  const soundSlopeThzA = velocityMsToThzAngstrom(summary.soundSpeedMs)
  const yMax = Math.max(1.2, summary.freqMaxThz * 1.32)

  return {
    summary,
    curve,
    kRange: [-kMaxPlot, kMaxPlot],
    yRange: [0, yMax],
    soundSlopeThzA,
    selection,
    bvkGrid,
    bvkPoints
  }
}
