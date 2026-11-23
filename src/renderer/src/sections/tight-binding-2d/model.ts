/**
 * View-model della sezione «Legami forti in 2D».
 * Prepara mesh 3D, cammini 2D, densità degli stati e valori numerici
 * chiamando solo funzioni pure di `physics/tightBinding2d`.
 */
import { useMemo } from 'react'
import {
  GRAPHENE_A,
  GRAPHENE_ACC,
  SPEED_OF_LIGHT_M_S,
  grapheneBands,
  grapheneEffectiveMassComparison,
  grapheneEnergies,
  grapheneFermiVelocity,
  grapheneHighSymmetryPoints,
  grapheneHbarVf,
  grapheneNumericalDos,
  graphenePath,
  grapheneVectors,
  squareBands,
  squareBottomEffectiveMassRatio,
  squareEnergy,
  squareFermiLevel,
  squareFreeElectronEnergy,
  squareOsculatingParaboloid,
  squarePath,
  type BandStructure,
  type GrapheneDosResult,
  type Vec2
} from '../../physics'
import { quantityColor, toneColor } from '../../ui/theme'
import type { SurfaceMeshSpec, SurfacePathPoint, SurfaceSymmetryPoint } from '../../viz/Surface3D'
import { NUMERICS_2D, type Lattice2D } from './manifest'

export interface TightBinding2DModel {
  readonly lattice: Lattice2D
  readonly t: number
  readonly a: number
  readonly surfaces: readonly SurfaceMeshSpec[]
  readonly bzOutline: readonly Vec2[]
  readonly symmetryPoints: readonly SurfaceSymmetryPoint[]
  readonly bzRadius: number
  readonly pathBands: BandStructure
  readonly comparePathBands: BandStructure | null
  readonly pathOnSurface: readonly SurfacePathPoint[]
  readonly selectedState: SurfacePathPoint & { readonly band: 0 | 1 }
  readonly fermiLevel: number | null
  readonly eRange: readonly [number, number]
  readonly dos: GrapheneDosResult | null
  readonly summary: {
    readonly eGamma: number
    readonly eXOrM: number
    readonly eMOrK: number
    readonly width: number
    readonly vF: number | null
    readonly vFOverC: number | null
    readonly mStarBottom: number | null
    readonly curvatureMassRatio: number | null
    readonly diracMassRatio: number | null
    readonly qFromDirac: number | null
  }
}

function buildSquareMesh(
  a: number,
  nGrid: number,
  evalE: (kx: number, ky: number) => number
): { positions: Float32Array; indices: Uint32Array } {
  const kMax = Math.PI / a
  const stride = nGrid + 1
  const positions = new Float32Array(stride * stride * 3)
  let ptr = 0
  for (let iy = 0; iy <= nGrid; iy++) {
    const ky = -kMax + (2 * kMax * iy) / nGrid
    for (let ix = 0; ix <= nGrid; ix++) {
      const kx = -kMax + (2 * kMax * ix) / nGrid
      positions[ptr++] = kx
      positions[ptr++] = ky
      positions[ptr++] = evalE(kx, ky)
    }
  }
  const indices = new Uint32Array(nGrid * nGrid * 6)
  let idx = 0
  for (let iy = 0; iy < nGrid; iy++) {
    for (let ix = 0; ix < nGrid; ix++) {
      const a0 = iy * stride + ix
      const a1 = a0 + 1
      const b0 = a0 + stride
      const b1 = b0 + 1
      indices[idx++] = a0
      indices[idx++] = a1
      indices[idx++] = b1
      indices[idx++] = a0
      indices[idx++] = b1
      indices[idx++] = b0
    }
  }
  return { positions, indices }
}

function buildDiskMesh(
  cx: number,
  cy: number,
  radius: number,
  nRings: number,
  nSectors: number,
  evalE: (kx: number, ky: number) => number
): { positions: Float32Array; indices: Uint32Array } {
  const pos: number[] = [cx, cy, evalE(cx, cy)]
  for (let r = 1; r <= nRings; r++) {
    const rad = (radius * r) / nRings
    for (let s = 0; s < nSectors; s++) {
      const ang = (2 * Math.PI * s) / nSectors
      const kx = cx + rad * Math.cos(ang)
      const ky = cy + rad * Math.sin(ang)
      pos.push(kx, ky, evalE(kx, ky))
    }
  }
  const idx: number[] = []
  for (let s = 0; s < nSectors; s++) {
    const next = (s + 1) % nSectors
    idx.push(0, 1 + s, 1 + next)
  }
  for (let r = 1; r < nRings; r++) {
    const base0 = 1 + (r - 1) * nSectors
    const base1 = 1 + r * nSectors
    for (let s = 0; s < nSectors; s++) {
      const next = (s + 1) % nSectors
      idx.push(base0 + s, base1 + s, base1 + next)
      idx.push(base0 + s, base1 + next, base0 + next)
    }
  }
  return { positions: new Float32Array(pos), indices: new Uint32Array(idx) }
}

function buildHexMesh(
  a: number,
  nRings: number,
  evalE: (kx: number, ky: number) => number
): { positions: Float32Array; indices: Uint32Array } {
  const sym = grapheneHighSymmetryPoints(a)
  const verts = sym.vertices.map((v) => v.k)
  const pos: number[] = []
  const idx: number[] = []

  for (let s = 0; s < 6; s++) {
    const v0 = verts[s]
    const v1 = verts[(s + 1) % 6]
    const baseOffset = pos.length / 3
    const rowStart: number[] = []

    for (let i = 0; i <= nRings; i++) {
      rowStart.push(pos.length / 3 - baseOffset)
      for (let j = 0; j <= i; j++) {
        const w1 = j / nRings
        const w0 = (i - j) / nRings
        const kx = w0 * v0[0] + w1 * v1[0]
        const ky = w0 * v0[1] + w1 * v1[1]
        pos.push(kx, ky, evalE(kx, ky))
      }
    }

    for (let i = 0; i < nRings; i++) {
      for (let j = 0; j <= i; j++) {
        const p0 = baseOffset + rowStart[i] + j
        const p1 = baseOffset + rowStart[i + 1] + j
        const p2 = p1 + 1
        idx.push(p0, p1, p2)
        if (j < i) {
          const p3 = p0 + 1
          idx.push(p0, p2, p3)
        }
      }
    }
  }

  return { positions: new Float32Array(pos), indices: new Uint32Array(idx) }
}

function makeContourLevels(eMin: number, eMax: number, count: number): number[] {
  const levels: number[] = []
  const span = eMax - eMin
  if (span <= 0) return levels
  for (let i = 1; i < count; i++) {
    levels.push(eMin + (span * i) / count)
  }
  return levels
}

export function useTightBinding2DModel(
  lattice: Lattice2D,
  squareParams: { readonly t: number; readonly a: number },
  grapheneT: number,
  electrons: 1 | 2,
  selectedK: { readonly kx: number; readonly ky: number; readonly band: 0 | 1 },
  tools: { readonly fill: boolean; readonly mass: boolean; readonly compare: boolean }
): TightBinding2DModel {
  const t = lattice === 'square' ? squareParams.t : grapheneT
  const a = lattice === 'square' ? squareParams.a : GRAPHENE_A

  return useMemo(() => {
    if (lattice === 'square') {
      const path = squarePath(a, NUMERICS_2D.pathPointsPerSeg)
      const pathBands = squareBands({ a, t }, path)
      const kEdge = Math.PI / a
      const bzOutline: Vec2[] = [
        [-kEdge, -kEdge],
        [kEdge, -kEdge],
        [kEdge, kEdge],
        [-kEdge, kEdge]
      ]
      const symmetryPoints: SurfaceSymmetryPoint[] = [
        { label: 'Γ', k: [0, 0] },
        { label: 'X', k: [kEdge, 0] },
        { label: 'M', k: [kEdge, kEdge] }
      ]

      const mainMesh = buildSquareMesh(a, NUMERICS_2D.squareGrid, (kx, ky) => squareEnergy(kx, ky, t, a))
      const surfaces: SurfaceMeshSpec[] = [
        {
          id: 'square-s',
          positions: mainMesh.positions,
          indices: mainMesh.indices,
          color: quantityColor('E'),
          opacity: 0.9,
          contourLevels: makeContourLevels(-4 * t, 4 * t, 9),
          pickable: true,
          bandIndex: 0
        }
      ]

      let maxE = 4 * t
      if (tools.mass) {
        const oscMesh = buildDiskMesh(0, 0, kEdge * 0.72, 14, 32, (kx, ky) =>
          squareOsculatingParaboloid(kx, ky, t, a)
        )
        surfaces.push({
          id: 'square-osc',
          positions: oscMesh.positions,
          indices: oscMesh.indices,
          color: quantityColor('mstar'),
          opacity: 0.42,
          wireframe: true
        })
      }

      let comparePathBands: BandStructure | null = null
      if (tools.compare) {
        const freeMesh = buildDiskMesh(0, 0, kEdge * 0.92, 16, 32, (kx, ky) =>
          squareFreeElectronEnergy(kx, ky, t)
        )
        surfaces.push({
          id: 'square-free',
          positions: freeMesh.positions,
          indices: freeMesh.indices,
          color: quantityColor('Ek'),
          opacity: 0.36,
          wireframe: true
        })
        const freeE = new Float64Array(path.points.length)
        for (let i = 0; i < path.points.length; i++) {
          const [kx, ky] = path.points[i]
          freeE[i] = squareFreeElectronEnergy(kx, ky, t)
          if (freeE[i] > maxE) maxE = freeE[i]
        }
        comparePathBands = { method: 'free-electron' as unknown as BandStructure['method'], path, energies: [freeE] }
      }

      const pathOnSurface: SurfacePathPoint[] = path.points.map(([kx, ky], i) => ({
        kx,
        ky,
        E: pathBands.energies[0][i]
      }))

      const selE = squareEnergy(selectedK.kx, selectedK.ky, t, a)
      const fermiLevel = tools.fill ? squareFermiLevel(electrons, t) : null
      const pad = Math.max(0.4, t * 0.35)

      return {
        lattice,
        t,
        a,
        surfaces,
        bzOutline,
        symmetryPoints,
        bzRadius: kEdge * Math.SQRT2,
        pathBands,
        comparePathBands,
        pathOnSurface,
        selectedState: { kx: selectedK.kx, ky: selectedK.ky, E: selE, band: 0 },
        fermiLevel,
        eRange: [-4 * t - pad, Math.min(maxE, 4 * t + 6) + pad],
        dos: null,
        summary: {
          eGamma: -4 * t,
          eXOrM: 0,
          eMOrK: 4 * t,
          width: 8 * t,
          vF: null,
          vFOverC: null,
          mStarBottom: squareBottomEffectiveMassRatio(t, a),
          curvatureMassRatio: null,
          diracMassRatio: null,
          qFromDirac: null
        }
      }
    }

    // Grafene
    const sym = grapheneHighSymmetryPoints(a)
    const path = graphenePath(a, NUMERICS_2D.pathPointsPerSeg)
    const pathBands = grapheneBands({ t, a }, path)
    const bzOutline: Vec2[] = sym.vertices.map((v) => v.k)
    const symmetryPoints: SurfaceSymmetryPoint[] = [
      { label: 'Γ', k: sym.Gamma },
      { label: 'M', k: sym.M },
      { label: 'K', k: sym.vertices[0].k },
      { label: 'K′', k: sym.vertices[1].k },
      { label: 'K', k: sym.vertices[2].k },
      { label: 'K′', k: sym.vertices[3].k },
      { label: 'K', k: sym.vertices[4].k },
      { label: 'K′', k: sym.vertices[5].k }
    ]

    const piMesh = buildHexMesh(a, NUMERICS_2D.grapheneRings, (kx, ky) => grapheneEnergies(kx, ky, t, a)[0])
    const piStarMesh = buildHexMesh(a, NUMERICS_2D.grapheneRings, (kx, ky) => grapheneEnergies(kx, ky, t, a)[1])

    const surfaces: SurfaceMeshSpec[] = [
      {
        id: 'graphene-pi',
        positions: piMesh.positions,
        indices: piMesh.indices,
        color: quantityColor('E'),
        opacity: 0.9,
        contourLevels: makeContourLevels(-3 * t, 0, 5),
        pickable: true,
        bandIndex: 0
      },
      {
        id: 'graphene-pi-star',
        positions: piStarMesh.positions,
        indices: piStarMesh.indices,
        color: toneColor('conductionBands'),
        opacity: 0.86,
        contourLevels: makeContourLevels(0, 3 * t, 5),
        pickable: true,
        bandIndex: 1
      }
    ]

    const hv = grapheneHbarVf(t, a)
    let comparePathBands: BandStructure | null = null
    if (tools.compare) {
      const coneR = Math.hypot(sym.M[0], sym.M[1]) * 0.52
      const coneTop = buildDiskMesh(sym.K[0], sym.K[1], coneR, 12, 32, (kx, ky) => {
        const q = Math.hypot(kx - sym.K[0], ky - sym.K[1])
        return hv * q
      })
      const coneBot = buildDiskMesh(sym.K[0], sym.K[1], coneR, 12, 32, (kx, ky) => {
        const q = Math.hypot(kx - sym.K[0], ky - sym.K[1])
        return -hv * q
      })
      surfaces.push(
        {
          id: 'graphene-dirac-top',
          positions: coneTop.positions,
          indices: coneTop.indices,
          color: quantityColor('v'),
          opacity: 0.45,
          wireframe: true
        },
        {
          id: 'graphene-dirac-bot',
          positions: coneBot.positions,
          indices: coneBot.indices,
          color: quantityColor('v'),
          opacity: 0.45,
          wireframe: true
        }
      )

      const diracBot = new Float64Array(path.points.length)
      const diracTop = new Float64Array(path.points.length)
      for (let i = 0; i < path.points.length; i++) {
        const [kx, ky] = path.points[i]
        const q = Math.hypot(kx - sym.K[0], ky - sym.K[1])
        diracBot[i] = -hv * q
        diracTop[i] = hv * q
      }
      comparePathBands = { method: 'tight-binding', path, energies: [diracBot, diracTop] }
    }

    const pathOnSurface: SurfacePathPoint[] = path.points.map(([kx, ky], i) => ({
      kx,
      ky,
      E: pathBands.energies[selectedK.band][i]
    }))

    const [ePi, ePiStar] = grapheneEnergies(selectedK.kx, selectedK.ky, t, a)
    const selE = selectedK.band === 1 ? ePiStar : ePi
    const dos = grapheneNumericalDos(t, a, { gridN: NUMERICS_2D.dosGridN, nBins: NUMERICS_2D.dosBins })
    const vF = grapheneFermiVelocity(t, a)
    const massCmp = grapheneEffectiveMassComparison(selectedK.kx, selectedK.ky, selectedK.band, t, a)
    const pad = Math.max(0.5, t * 0.25)

    // Evita warning su variabili non usate
    void grapheneVectors
    void GRAPHENE_ACC

    return {
      lattice,
      t,
      a,
      surfaces,
      bzOutline,
      symmetryPoints,
      bzRadius: (4 * Math.PI) / (3 * a),
      pathBands,
      comparePathBands,
      pathOnSurface,
      selectedState: { kx: selectedK.kx, ky: selectedK.ky, E: selE, band: selectedK.band },
      fermiLevel: tools.fill ? 0 : null,
      eRange: [-3 * t - pad, 3 * t + pad],
      dos,
      summary: {
        eGamma: -3 * t,
        eXOrM: -t,
        eMOrK: 0,
        width: 6 * t,
        vF,
        vFOverC: vF / SPEED_OF_LIGHT_M_S,
        mStarBottom: null,
        curvatureMassRatio: massCmp.curvatureMassRatio,
        diracMassRatio: massCmp.diracMassRatio,
        qFromDirac: massCmp.q
      }
    }
  }, [lattice, t, a, electrons, selectedK.kx, selectedK.ky, selectedK.band, tools.fill, tools.mass, tools.compare])
}
