/**
 * Calcolo dello stato fisico derivato per la sezione «Rami 3D, polarizzazioni e cristalli reali».
 * Chiama esclusivamente funzioni pure di `physics/phonon3d.ts`.
 */
import { useMemo } from 'react'
import {
  bvkGrid2D,
  classifySymmetryDirection,
  computeModeCounting3D,
  computePhonon3DDispersion,
  CRYSTALS_3D,
  macroscopicAluminumEstimate,
  phonon3DTab1Summary,
  type BranchRole3D,
  type BvkGrid2DPoint,
  type Crystal3DId,
  type Crystal3DMaterial,
  type KVector,
  type MacroscopicAlEstimate,
  type ModeCounting3D,
  type Phonon3DDispersion,
  type Phonon3DMode,
  type Phonon3DParams,
  type Phonon3DTab1Summary,
  type SymmetryLineKind
} from '../../physics'
import { NUMERICS, type Params } from './manifest'
import type { DisplayUnit } from './store'

export interface SelectedMode3D {
  readonly pointIndex: number
  readonly distance: number
  /** Vettore d'onda k in Å⁻¹. */
  readonly k: KVector
  /** Coordinate adimensionali di k in unità di 2π/a. */
  readonly kDimless: KVector
  /** Versore di propagazione k̂ (o direzione del segmento a Γ). */
  readonly kHat: KVector
  /** Etichetta del tratto corrente (es. 'Γ–X', 'X–K', 'K–Γ', 'Γ–L'). */
  readonly segmentLabel: string
  readonly symmetry: SymmetryLineKind
  readonly atGamma: boolean
  readonly mode: Phonon3DMode
  /** Vero se questo modo è doppiamente degenere con un altro modo allo stesso k. */
  readonly isDoublyDegenerate: boolean
  /** Vero se è triplamente degenere (es. ottici a Γ nel diamante, o 3 acustici a Γ). */
  readonly isTriplyDegenerate: boolean
  /** Valore ordinata nel grafico nell'unità scelta (meV o THz). */
  readonly plotY: number
  /** Id del segmento-ramo attivo in DispersionPlot. */
  readonly activeSegmentBranchId: string
}

export interface Phonon3DModel {
  readonly physParams: Phonon3DParams
  readonly material: Crystal3DMaterial
  readonly dispersion: Phonon3DDispersion
  readonly tab1: Phonon3DTab1Summary
  readonly selection: SelectedMode3D
  readonly xRange: readonly [number, number]
  readonly yRange: readonly [number, number]
  readonly counting: ModeCounting3D
  readonly grid2D: readonly BvkGrid2DPoint[]
  readonly alEstimate: MacroscopicAlEstimate
}

function normalize3(v: KVector, fallback: KVector = [1, 0, 0]): KVector {
  const n = Math.hypot(v[0], v[1], v[2])
  return n < 1e-12 ? fallback : [v[0] / n, v[1] / n, v[2] / n]
}

export function usePhonon3DModel(
  crystalId: Crystal3DId,
  params: Params,
  pointIndex: number,
  selectedRole: BranchRole3D,
  unit: DisplayUnit,
  bvkN: number,
  targetParams?: Params
): Phonon3DModel {
  const physParams = useMemo<Phonon3DParams>(
    () => ({
      crystalId,
      transverseRatio: params.transverseRatio,
      polarRatio: CRYSTALS_3D[crystalId].basisCount === 2 ? params.polarRatio : 1.0
    }),
    [crystalId, params.transverseRatio, params.polarRatio]
  )

  const targetPhysParams = useMemo<Phonon3DParams>(
    () => ({
      crystalId,
      transverseRatio: (targetParams ?? params).transverseRatio,
      polarRatio: CRYSTALS_3D[crystalId].basisCount === 2 ? (targetParams ?? params).polarRatio : 1.0
    }),
    [crystalId, targetParams, params]
  )

  const material = CRYSTALS_3D[crystalId]

  const dispersion = useMemo(
    () => computePhonon3DDispersion(physParams, NUMERICS.pointsPerSegment),
    [physParams]
  )

  const tab1 = useMemo(() => phonon3DTab1Summary(physParams), [physParams])
  const targetTab1 = useMemo(() => phonon3DTab1Summary(targetPhysParams), [targetPhysParams])

  const counting = useMemo(
    () => computeModeCounting3D(bvkN, material.basisCount, material.a),
    [bvkN, material.basisCount, material.a]
  )

  const grid2D = useMemo(() => bvkGrid2D(bvkN), [bvkN])

  const alEstimate = useMemo(() => macroscopicAluminumEstimate(), [])

  const selection = useMemo<SelectedMode3D>(() => {
    const nPts = dispersion.path.points.length
    const idx = Math.max(0, Math.min(nPts - 1, pointIndex))
    const k = dispersion.path.points[idx]
    const invTwoPiOverA = material.a / (2 * Math.PI)
    const kDimless: KVector = [k[0] * invTwoPiOverA, k[1] * invTwoPiOverA, k[2] * invTwoPiOverA]
    const distance = dispersion.path.distance[idx]

    // Trova il segmento di appartenenza
    let seg = dispersion.segments[0]
    for (const s of dispersion.segments) {
      if (idx >= s.startIndex && idx <= s.endIndex) {
        seg = s
        break
      }
    }
    const kStart = dispersion.path.points[seg.startIndex]
    const kEnd = dispersion.path.points[seg.endIndex]
    const segDir: KVector = [kEnd[0] - kStart[0], kEnd[1] - kStart[1], kEnd[2] - kStart[2]]
    const kHat = normalize3(k, normalize3(segDir, [1, 0, 0]))
    const atGamma = Math.hypot(k[0], k[1], k[2]) < 1e-9
    const symmetry = atGamma ? seg.symmetry : classifySymmetryDirection(k, segDir)

    const modesHere = dispersion.modesAtPoint[idx]
    const mode = modesHere.find((m) => m.role === selectedRole) ?? modesHere[modesHere.length - 1]

    // Conta la molteplicità di degenerazione al punto k scelto
    const tol = Math.max(1e-3, dispersion.maxFreqThz * 2e-3)
    let degCount = 0
    for (const m of modesHere) {
      if (Math.abs(m.freqThz - mode.freqThz) <= tol) degCount++
    }

    const plotY = unit === 'meV' ? mode.energyMev : mode.freqThz

    return {
      pointIndex: idx,
      distance,
      k,
      kDimless,
      kHat,
      segmentLabel: seg.label,
      symmetry,
      atGamma,
      mode,
      isDoublyDegenerate: degCount === 2,
      isTriplyDegenerate: degCount >= 3,
      plotY,
      activeSegmentBranchId: `seg${seg.index}-${mode.role}`
    }
  }, [dispersion, material.a, pointIndex, selectedRole, unit])

  const maxDist = dispersion.path.distance[dispersion.path.distance.length - 1] || 1
  const maxY = unit === 'meV' ? dispersion.maxEnergyMev : dispersion.maxFreqThz
  // Se uno slider sta espandendo verso l'alto, anticipa il tetto target così la curva LO non esce mai dal grafico durante l'inseguimento
  const targetPeak =
    material.basisCount === 2
      ? unit === 'meV'
        ? (targetTab1.loAtGammaMev ?? maxY)
        : (targetTab1.loAtGammaThz ?? maxY)
      : unit === 'meV'
        ? targetTab1.laAtXMev
        : targetTab1.laAtXThz
  const yMax = Math.max(1, Math.max(maxY, targetPeak) * 1.15)

  return {
    physParams,
    material,
    dispersion,
    tab1,
    selection,
    xRange: [0, maxDist],
    yRange: [0, yMax],
    counting,
    grid2D,
    alEstimate
  }
}
