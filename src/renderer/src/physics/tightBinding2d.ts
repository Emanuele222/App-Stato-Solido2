/**
 * Legami forti in 2D: reticolo quadrato (banda s) e grafene (bande π e π*,
 * cono di Dirac, densità degli stati, massa efficace alternativa).
 * Fonte: materiale/parte4/dispensa.tex (§1.4 r. 223–283, §6 r. 1733–1950).
 * Unità: Å, Å⁻¹, eV, m/s. Zero dell'energia in Ē_s (quadrato) e Ē_p (grafene).
 */
import { ANGSTROM_IN_M, HBAR2_OVER_2M0, HBAR2_OVER_M0, HBAR_EV_S } from './constants'
import { kPathFromVertices, type BandStructure, type KPath } from './bandStructure'

const SQRT3 = Math.sqrt(3)

/** Passo reticolare del grafene in Å (dispensa P4 §6.1, r. 1738). */
export const GRAPHENE_A = 2.46

/** Distanza C–C del grafene, a_CC = a/√3 = 1,42 Å (dispensa P4 §6.1, r. 1738). */
export const GRAPHENE_ACC = GRAPHENE_A / SQRT3

/** Velocità della luce nel vuoto (m/s), per il rapporto v_F / c. */
export const SPEED_OF_LIGHT_M_S = 299792458

export type Vec2 = readonly [number, number]

export interface GrapheneVectors {
  readonly a: number
  readonly aCC: number
  readonly a1: Vec2
  readonly a2: Vec2
  readonly b1: Vec2
  readonly b2: Vec2
  /** Vettori dal sito A ai tre primi vicini B: δ₁ = a_CC(1,0), δ₂ = δ₁ − a₁, δ₃ = δ₁ − a₂. */
  readonly delta: readonly [Vec2, Vec2, Vec2]
}

// ---------------------------------------------------------------------------
// Reticolo quadrato (dispensa P4 §1.4)
// ---------------------------------------------------------------------------

/** Energia della banda s del reticolo quadrato: E(k) = −2t (cos k_x a + cos k_y a). */
export function squareEnergy(kx: number, ky: number, t: number, a: number): number {
  return -2 * t * (Math.cos(kx * a) + Math.cos(ky * a))
}

/** Cammino Γ–X–M–Γ nella prima zona di Brillouin del reticolo quadrato. */
export function squarePath(a: number, pointsPerSegment = 60): KPath {
  const kEdge = Math.PI / a
  return kPathFromVertices(
    [
      { label: 'Γ', k: [0, 0, 0] },
      { label: 'X', k: [kEdge, 0, 0] },
      { label: 'M', k: [kEdge, kEdge, 0] },
      { label: 'Γ', k: [0, 0, 0] }
    ],
    pointsPerSegment,
    2
  )
}

/** Banda s del reticolo quadrato lungo un KPath 2D. */
export function squareBands(params: { readonly a: number; readonly t: number }, path: KPath): BandStructure {
  const { a, t } = params
  const n = path.points.length
  const e = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const [kx, ky] = path.points[i]
    e[i] = squareEnergy(kx, ky, t, a)
  }
  return { method: 'tight-binding', path, energies: [e] }
}

/** Rapporto m* / m₀ al fondo della banda del reticolo quadrato (Γ): ħ²/(2 t a² m₀). */
export function squareBottomEffectiveMassRatio(t: number, a: number): number {
  return HBAR2_OVER_2M0 / (t * a * a)
}

/**
 * Rapporto m* / m₀ lungo il versore u = (ux, uy) in (kx, ky):
 * ∂²E/∂k_u² = 2 t a² (u_x² cos k_x a + u_y² cos k_y a).
 */
export function squareDirectionalMassRatio(
  kx: number,
  ky: number,
  ux: number,
  uy: number,
  t: number,
  a: number
): number {
  const norm = Math.hypot(ux, uy) || 1
  const nx = ux / norm
  const ny = uy / norm
  const curv = 2 * t * a * a * (nx * nx * Math.cos(kx * a) + ny * ny * Math.cos(ky * a))
  if (Math.abs(curv) < 1e-12) return Infinity
  return HBAR2_OVER_M0 / curv
}

/** Livello di Fermi del reticolo quadrato per N = 1 (0 eV) o N = 2 (+4t, banda piena). */
export function squareFermiLevel(electrons: 1 | 2, t: number): number {
  return electrons === 1 ? 0 : 4 * t
}

/** Parabola dell'elettrone libero ancorata al fondo della banda (−4t): −4t + ħ²|k|²/(2m₀). */
export function squareFreeElectronEnergy(kx: number, ky: number, t: number): number {
  return -4 * t + HBAR2_OVER_2M0 * (kx * kx + ky * ky)
}

/** Paraboloide osculatore al fondo della banda (Γ): −4t + t a² (k_x² + k_y²). */
export function squareOsculatingParaboloid(kx: number, ky: number, t: number, a: number): number {
  return -4 * t + t * a * a * (kx * kx + ky * ky)
}

// ---------------------------------------------------------------------------
// Grafene (dispensa P4 §6)
// ---------------------------------------------------------------------------

/** Vettori primitivi diretti, reciproci e primi vicini del grafene (dispensa P4 §6.1). */
export function grapheneVectors(a = GRAPHENE_A): GrapheneVectors {
  const sqrt3 = SQRT3
  const aCC = a / sqrt3
  const a1: Vec2 = [(a * sqrt3) / 2, -a / 2]
  const a2: Vec2 = [(a * sqrt3) / 2, a / 2]
  const bScale = (2 * Math.PI) / a
  const b1: Vec2 = [bScale / sqrt3, -bScale]
  const b2: Vec2 = [bScale / sqrt3, bScale]
  const delta1: Vec2 = [aCC, 0]
  const delta2: Vec2 = [-aCC / 2, (aCC * sqrt3) / 2]
  const delta3: Vec2 = [-aCC / 2, -(aCC * sqrt3) / 2]
  return { a, aCC, a1, a2, b1, b2, delta: [delta1, delta2, delta3] }
}

/** Fattore di struttura f(k) = Σ_{i=1}^3 e^{i k·δ_i} del grafene. */
export function grapheneStructureFactor(
  kx: number,
  ky: number,
  a = GRAPHENE_A
): { readonly re: number; readonly im: number; readonly abs: number } {
  const { delta } = grapheneVectors(a)
  let re = 0
  let im = 0
  for (let i = 0; i < 3; i++) {
    const phase = kx * delta[i][0] + ky * delta[i][1]
    re += Math.cos(phase)
    im += Math.sin(phase)
  }
  return { re, im, abs: Math.hypot(re, im) }
}

/** Energie delle due bande [π, π*] = [−t|f(k)|, +t|f(k)|]. */
export function grapheneEnergies(kx: number, ky: number, t: number, a = GRAPHENE_A): readonly [number, number] {
  const e = t * grapheneStructureFactor(kx, ky, a).abs
  return [-e, e]
}

export interface GrapheneSymmetryPoints {
  readonly Gamma: Vec2
  readonly M: Vec2
  readonly K: Vec2
  readonly KPrime: Vec2
  /** I 6 vertici della prima zona di Brillouin, alternati K e K′. */
  readonly vertices: readonly { readonly label: 'K' | 'K′'; readonly k: Vec2 }[]
  /** I 6 punti M (punti medi dei lati dell'esagono). */
  readonly mPoints: readonly Vec2[]
}

/** Punti di alta simmetria e vertici della prima zona esagonale del grafene. */
export function grapheneHighSymmetryPoints(a = GRAPHENE_A): GrapheneSymmetryPoints {
  const rK = (4 * Math.PI) / (3 * a)
  const rM = (2 * Math.PI) / (SQRT3 * a)
  const vertices: { label: 'K' | 'K′'; k: Vec2 }[] = []
  const mPoints: Vec2[] = []
  for (let m = 0; m < 6; m++) {
    const thetaK = Math.PI / 6 + (m * Math.PI) / 3
    vertices.push({
      label: m % 2 === 0 ? 'K' : 'K′',
      k: [rK * Math.cos(thetaK), rK * Math.sin(thetaK)]
    })
    const thetaM = (m * Math.PI) / 3
    mPoints.push([rM * Math.cos(thetaM), rM * Math.sin(thetaM)])
  }
  return {
    Gamma: [0, 0],
    M: mPoints[0],
    K: vertices[0].k,
    KPrime: vertices[1].k,
    vertices,
    mPoints
  }
}

/** Cammino Γ–M–K–Γ nella prima zona di Brillouin del grafene. */
export function graphenePath(a = GRAPHENE_A, pointsPerSegment = 60): KPath {
  const sym = grapheneHighSymmetryPoints(a)
  return kPathFromVertices(
    [
      { label: 'Γ', k: [sym.Gamma[0], sym.Gamma[1], 0] },
      { label: 'M', k: [sym.M[0], sym.M[1], 0] },
      { label: 'K', k: [sym.K[0], sym.K[1], 0] },
      { label: 'Γ', k: [sym.Gamma[0], sym.Gamma[1], 0] }
    ],
    pointsPerSegment,
    2
  )
}

/** Bande π e π* del grafene lungo un KPath 2D. */
export function grapheneBands(params: { readonly t: number; readonly a?: number }, path: KPath): BandStructure {
  const a = params.a ?? GRAPHENE_A
  const t = params.t
  const n = path.points.length
  const pi = new Float64Array(n)
  const piStar = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const [kx, ky] = path.points[i]
    const [eMinus, ePlus] = grapheneEnergies(kx, ky, t, a)
    pi[i] = eMinus
    piStar[i] = ePlus
  }
  return { method: 'tight-binding', path, energies: [pi, piStar] }
}

/** Prodotto ħ v_F = (3/2) t a_CC in eV·Å. */
export function grapheneHbarVf(t: number, a = GRAPHENE_A): number {
  return 1.5 * t * (a / SQRT3)
}

/** Velocità di Fermi v_F = 3 t a_CC / (2 ħ) in m/s. */
export function grapheneFermiVelocity(t: number, a = GRAPHENE_A): number {
  return (grapheneHbarVf(t, a) / HBAR_EV_S) * ANGSTROM_IN_M
}

/** Area della cella primitiva del grafene A_c = |a₁ × a₂| = (√3/2) a² in Å². */
export function grapheneCellArea(a = GRAPHENE_A): number {
  return (a * a * SQRT3) / 2
}

/** Formula analitica della densità degli stati vicino a E_F: g(E) = 2|E| / (π ħ² v_F²) [stati/(eV·Å²)]. */
export function grapheneDiracDos(energyEv: number, t: number, a = GRAPHENE_A): number {
  const hv = grapheneHbarVf(t, a)
  if (hv <= 0) return 0
  return (2 * Math.abs(energyEv)) / (Math.PI * hv * hv)
}

export interface GrapheneDosResult {
  /** Centri dei bin di energia (eV) da −3t a +3t. */
  readonly energies: Float64Array
  /** g(E) in stati / (eV · Å²) (spin e valle inclusi). */
  readonly dosPerArea: Float64Array
  /** g(E) in stati / (eV · cella primitiva). */
  readonly dosPerCell: Float64Array
  readonly dE: number
}

/**
 * Calcolo numerico della densità degli stati g(E) su tutta la banda [−3t, +3t]
 * con il metodo dei triangoli lineari 2D su una griglia uniforme N×N nella cella
 * reciproca (b₁, b₂). Conserva esattamente i 2 stati per cella per banda.
 */
export function grapheneNumericalDos(
  t: number,
  a = GRAPHENE_A,
  options: { readonly gridN?: number; readonly nBins?: number } = {}
): GrapheneDosResult {
  const gridN = options.gridN ?? 140
  const nBins = options.nBins ?? 240
  const { b1, b2 } = grapheneVectors(a)
  const eMin = -3 * t
  const eMax = 3 * t
  const dE = (eMax - eMin) / nBins
  const cellArea = grapheneCellArea(a)

  const energies = new Float64Array(nBins)
  for (let b = 0; b < nBins; b++) {
    energies[b] = eMin + (b + 0.5) * dE
  }
  const dosPerCell = new Float64Array(nBins)

  // Griglia (gridN+1) x (gridN+1) su u, v in [0, 1] per |f(k)|
  const stride = gridN + 1
  const eGrid = new Float64Array(stride * stride)
  for (let i = 0; i <= gridN; i++) {
    const u = i / gridN
    for (let j = 0; j <= gridN; j++) {
      const v = j / gridN
      const kx = u * b1[0] + v * b2[0]
      const ky = u * b1[1] + v * b2[1]
      eGrid[i * stride + j] = t * grapheneStructureFactor(kx, ky, a).abs
    }
  }

  // Ogni quadratino ha 2 triangoli; peso di 1 triangolo per una banda (spin 2) = 2 / (2 * gridN^2) = 1 / gridN^2
  const triWeight = 1 / (gridN * gridN)

  for (let i = 0; i < gridN; i++) {
    for (let j = 0; j < gridN; j++) {
      const e00 = eGrid[i * stride + j]
      const e10 = eGrid[(i + 1) * stride + j]
      const e01 = eGrid[i * stride + (j + 1)]
      const e11 = eGrid[(i + 1) * stride + (j + 1)]

      // Banda π* (+E) e banda π (−E) simmetriche
      accumulateTriangle(dosPerCell, e00, e10, e11, triWeight, eMin, dE, nBins)
      accumulateTriangle(dosPerCell, e00, e11, e01, triWeight, eMin, dE, nBins)
      accumulateTriangle(dosPerCell, -e00, -e10, -e11, triWeight, eMin, dE, nBins)
      accumulateTriangle(dosPerCell, -e00, -e11, -e01, triWeight, eMin, dE, nBins)
    }
  }

  const dosPerArea = new Float64Array(nBins)
  for (let b = 0; b < nBins; b++) {
    dosPerCell[b] /= dE
    dosPerArea[b] = dosPerCell[b] / cellArea
  }

  return { energies, dosPerArea, dosPerCell, dE }
}

function triangleCdf(E: number, e0: number, e1: number, e2: number): number {
  if (E <= e0) return 0
  if (E >= e2) return 1
  if (E <= e1) {
    const denom = (e1 - e0) * (e2 - e0)
    return denom > 0 ? ((E - e0) * (E - e0)) / denom : 0
  }
  const denom = (e2 - e1) * (e2 - e0)
  return denom > 0 ? 1 - ((e2 - E) * (e2 - E)) / denom : 1
}

function accumulateTriangle(
  bins: Float64Array,
  va: number,
  vb: number,
  vc: number,
  weight: number,
  eMin: number,
  dE: number,
  nBins: number
): void {
  // Ordina va <= vb <= vc
  let e0 = va
  let e1 = vb
  let e2 = vc
  if (e0 > e1) { const tmp = e0; e0 = e1; e1 = tmp }
  if (e1 > e2) { const tmp = e1; e1 = e2; e2 = tmp }
  if (e0 > e1) { const tmp = e0; e0 = e1; e1 = tmp }

  const bStart = Math.max(0, Math.floor((e0 - eMin) / dE))
  const bEnd = Math.min(nBins - 1, Math.floor((e2 - eMin) / dE))
  if (e2 - e0 < 1e-12) {
    const idx = Math.max(0, Math.min(nBins - 1, Math.floor((e0 - eMin) / dE)))
    bins[idx] += weight
    return
  }
  for (let b = bStart; b <= bEnd; b++) {
    const lo = eMin + b * dE
    const hi = lo + dE
    const frac = triangleCdf(hi, e0, e1, e2) - triangleCdf(lo, e0, e1, e2)
    if (frac > 0) bins[b] += weight * frac
  }
}

/** Distanza q = |k − K_vicino| dal vertice K o K′ più prossimo (Å⁻¹). */
export function grapheneNearestDiracPoint(
  kx: number,
  ky: number,
  a = GRAPHENE_A
): { readonly q: number; readonly vertex: Vec2; readonly label: 'K' | 'K′' } {
  const { vertices } = grapheneHighSymmetryPoints(a)
  let best = vertices[0]
  let bestDist = Infinity
  for (const v of vertices) {
    const d = Math.hypot(kx - v.k[0], ky - v.k[1])
    if (d < bestDist) {
      bestDist = d
      best = v
    }
  }
  return { q: bestDist, vertex: best.k, label: best.label }
}

/**
 * Confronto tra le due masse efficaci nel grafene (dispensa P4 §6.4):
 * - curvatureMassRatio: m* / m₀ = (ħ²/m₀) / (∂²E/∂q²) lungo la direzione radiale da K_vicino
 *   (sul cono di Dirac diverge: m* → ∞);
 * - diracMassRatio: m̃ / m₀ = ± ħ q / (m₀ v_F) = ± (ħ²/m₀) q / (ħ v_F), che va a 0 in K.
 */
export function grapheneEffectiveMassComparison(
  kx: number,
  ky: number,
  band: 0 | 1,
  t: number,
  a = GRAPHENE_A
): { readonly curvatureMassRatio: number; readonly diracMassRatio: number; readonly q: number } {
  const { q, vertex } = grapheneNearestDiracPoint(kx, ky, a)
  const sign = band === 1 ? 1 : -1
  const hv = grapheneHbarVf(t, a)
  const diracMassRatio = hv > 0 ? (sign * HBAR2_OVER_M0 * q) / hv : 0

  if (q < 1e-5) {
    return { curvatureMassRatio: Infinity, diracMassRatio: 0, q }
  }
  const ux = (kx - vertex[0]) / q
  const uy = (ky - vertex[1]) / q
  const h = 1e-4
  const e0 = grapheneEnergies(kx, ky, t, a)[band]
  const ePlus = grapheneEnergies(kx + h * ux, ky + h * uy, t, a)[band]
  const eMinus = grapheneEnergies(kx - h * ux, ky - h * uy, t, a)[band]
  const curv = (ePlus - 2 * e0 + eMinus) / (h * h)
  const curvatureMassRatio = Math.abs(curv) < 1e-9 ? Infinity : HBAR2_OVER_M0 / curv
  return { curvatureMassRatio, diracMassRatio, q }
}
