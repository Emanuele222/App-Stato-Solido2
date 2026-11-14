/**
 * Metodo dello pseudopotenziale empirico (EPM) per cristalli fcc a base di due atomi
 * (diamante e zincoblenda) lungo L–Γ–X–W–K–Γ, più curve di modello dello ione
 * schermato, stima dello ione nudo e limite q → 0 di Thomas–Fermi (dispensa P4 §4, §5.4).
 *
 * Unità: lunghezze in Å, vettori d'onda in Å⁻¹, energie in eV; fattori di forma in Ry.
 */
import { HBAR2_OVER_2M0, RYDBERG_EV } from './constants'
import {
  kPathFromVertices,
  type BandStructure,
  type KPath,
  type KPathVertex
} from './bandStructure'
import {
  complexHermitianMatrix,
  eigh,
  eigenvector,
  realSymmetricMatrix,
  type HermitianMatrix
} from './linalg'

/** Raggio di Bohr a₀ (Å) e costante coulombiana e²/(4πε₀) (eV·Å) da verifica_pseudo.py. */
export const BOHR_RADIUS_ANG = 0.529177
export const E2_OVER_4PI_EPS0 = 14.39964

/** Vertici adimensionali del percorso standard in unità di 2π/a (L–Γ–X–W–K–Γ). */
export const EPM_PATH_VERTICES_DIMLESS: readonly KPathVertex[] = [
  { label: 'L', k: [0.5, 0.5, 0.5] },
  { label: 'Γ', k: [0, 0, 0] },
  { label: 'X', k: [1, 0, 0] },
  { label: 'W', k: [1, 0.5, 0] },
  { label: 'K', k: [0.75, 0.75, 0] },
  { label: 'Γ', k: [0, 0, 0] }
]

/** Fattore di forma simmetrico e antisimmetrico (Ry) per lo pseudopotenziale locale fcc. */
export interface EpmFormFactors {
  readonly v3s: number
  readonly v8s: number
  readonly v11s: number
  readonly v3a: number
  readonly v4a: number
  readonly v11a: number
}

export interface PseudopotentialParams {
  /** Passo reticolare cubico a in Å. */
  readonly a: number
  readonly formFactors: EpmFormFactors
}

export interface EpmBandOptions {
  /** Taglio |G|² in unità di (2π/a)² (default 21 → 113 onde piane). */
  readonly gMaxSq?: number
  /** Punti per ciascuno dei 5 tratti L–Γ–X–W–K–Γ (default 40 → 201 punti totali). */
  readonly pointsPerSegment?: number
  /** Numero di bande restituite dal basso (default 8). */
  readonly numBands?: number
  /** Se true (default) trasla le energie in modo che max(E_valenza) = 0. */
  readonly zeroAtValenceTop?: boolean
}

export interface ReciprocalVectorFcc {
  readonly h: number
  readonly k: number
  readonly l: number
  /** Norma quadra intera |G|² in unità (2π/a)². */
  readonly gSq: number
}

export interface ShellWeight {
  readonly gSq: number
  readonly weight: number
  readonly planeWaveCount: number
}

export interface EpmStateBreakdown {
  /** Energie delle prime numBands bande (con lo stesso zero dell'asse passato, cioè vbmOffsetEv sottratto). */
  readonly energies: Float64Array
  readonly shellWeights: readonly ShellWeight[]
  readonly planeWaves: number
}

export interface EpmBandSummary {
  readonly planeWaves: number
  readonly vbmEnergy: number
  readonly vbmIndex: number
  readonly cbmEnergy: number
  readonly cbmIndex: number
  readonly gap: number
  readonly isDirect: boolean
  readonly cbmDescription: 'Γ' | 'L' | 'X' | 'ΓX' | 'altro'
  /** Posizione frazionaria del minimo lungo il tratto in cui cade (es. ~0,85 in ΓX). */
  readonly cbmSegmentFraction: number
  readonly ecGamma: number
  readonly ecX: number
  readonly ecL: number
  readonly valenceBottom: number
  readonly valenceWidth: number
  /** Energia di traslazione applicata (= VBM assoluto prima dello zero in valenza). */
  readonly rawVbmEv: number
}

export interface RealSpaceModelCurves {
  readonly r: Float64Array
  readonly bareIon: Float64Array
  readonly softCore: Float64Array
  readonly hardCore: Float64Array
  readonly truePsi: Float64Array
  readonly smoothPsi: Float64Array
  readonly rc: number
}

export interface FormFactorCurve {
  /** Ascissa adimensionale q² in unità di (2π/a)² per confronto diretto con |G|² = 3, 8, 11. */
  readonly qSqDimless: Float64Array
  /** Ascissa fisica q in Å⁻¹. */
  readonly qAngInv: Float64Array
  /** v(q) schermato in Ry. */
  readonly vRy: Float64Array
  /** Limite q → 0 in Ry (−⅔ E_F / Ry). */
  readonly v0Ry: number
  readonly efEv: number
  readonly zeroCrossingGSq: number
}

/**
 * Tutti i vettori reciproci fcc (h, k, l) con h ≡ k ≡ l (mod 2) in unità di 2π/a
 * e |G|² = h² + k² + l² ≤ gMaxSq. Ordinati per guscio crescente (|G|²).
 */
export function fccReciprocalVectors(gMaxSq: number = 21): readonly ReciprocalVectorFcc[] {
  if (!Number.isFinite(gMaxSq) || gMaxSq < 0) {
    throw new RangeError(`taglio |G|² non valido: ${gMaxSq}`)
  }
  const bound = Math.ceil(Math.sqrt(gMaxSq)) + 1
  const out: ReciprocalVectorFcc[] = []
  for (let h = -bound; h <= bound; h++) {
    for (let k = -bound; k <= bound; k++) {
      for (let l = -bound; l <= bound; l++) {
        if ((h & 1) === (k & 1) && (h & 1) === (l & 1)) {
          const gSq = h * h + k * k + l * l
          if (gSq <= gMaxSq) out.push({ h, k, l, gSq })
        }
      }
    }
  }
  out.sort((a, b) => a.gSq - b.gSq || a.h - b.h || a.k - b.k || a.l - b.l)
  return out
}

/** Conteggio dei vettori in ciascun guscio di |G|² (es. 0→1, 3→8, 4→6, 8→12, 11→24). */
export function fccShellCounts(gMaxSq: number = 21): ReadonlyMap<number, number> {
  const counts = new Map<number, number>()
  for (const g of fccReciprocalVectors(gMaxSq)) {
    counts.set(g.gSq, (counts.get(g.gSq) ?? 0) + 1)
  }
  return counts
}

/** Percorso L–Γ–X–W–K–Γ in coordinate cartesiane (Å⁻¹) per il passo `a` (Å). */
export function epmBrillouinPath(a: number, pointsPerSegment: number = 40): KPath {
  if (!(a > 0) || !Number.isFinite(a)) throw new RangeError(`passo reticolare non valido: ${a}`)
  const scale = (2 * Math.PI) / a
  const vertices: KPathVertex[] = EPM_PATH_VERTICES_DIMLESS.map((v) => ({
    label: v.label,
    k: [v.k[0] * scale, v.k[1] * scale, v.k[2] * scale]
  }))
  return kPathFromVertices(vertices, pointsPerSegment, 3)
}

interface PotentialCacheKeyed {
  readonly planeWaves: number
  readonly G: readonly ReciprocalVectorFcc[]
  readonly hasAntisymmetric: boolean
  readonly vRe: Float64Array
  readonly vIm: Float64Array
}

function buildPotentialTemplate(
  formFactors: EpmFormFactors,
  gMaxSq: number
): PotentialCacheKeyed {
  const G = fccReciprocalVectors(gMaxSq)
  const n = G.length
  const vRe = new Float64Array(n * n)
  const vIm = new Float64Array(n * n)
  const { v3s, v8s, v11s, v3a, v4a, v11a } = formFactors
  const hasAntisymmetric = Math.abs(v3a) > 0 || Math.abs(v4a) > 0 || Math.abs(v11a) > 0

  for (let i = 0; i < n; i++) {
    const gi = G[i]
    for (let j = i + 1; j < n; j++) {
      const gj = G[j]
      const dx = gi.h - gj.h
      const dy = gi.k - gj.k
      const dz = gi.l - gj.l
      const q2 = dx * dx + dy * dy + dz * dz

      let vs = 0
      if (q2 === 3) vs = v3s
      else if (q2 === 8) vs = v8s
      else if (q2 === 11) vs = v11s

      let va = 0
      if (hasAntisymmetric) {
        if (q2 === 3) va = v3a
        else if (q2 === 4) va = v4a
        else if (q2 === 11) va = v11a
      }

      if (vs !== 0 || va !== 0) {
        // ΔG · τ = (2π/a)(dx,dy,dz) · (a/8)(1,1,1) = (π/4)(dx + dy + dz)
        const phase = (Math.PI / 4) * (dx + dy + dz)
        const re = vs * Math.cos(phase) * RYDBERG_EV
        const im = va * Math.sin(phase) * RYDBERG_EV
        vRe[i * n + j] = re
        vRe[j * n + i] = re
        vIm[i * n + j] = im
        vIm[j * n + i] = -im
      }
    }
  }

  return { planeWaves: n, G, hasAntisymmetric, vRe, vIm }
}

/**
 * Costruisce la matrice hamiltoniana dello pseudopotenziale H(k) = diag(E_{k+G}) + V_ps
 * nel punto `kCart` (Å⁻¹). Ritorna una matrice reale simmetrica se Vᵃ = 0, altrimenti
 * hermitiana complessa.
 */
export function pseudopotentialHamiltonian(
  params: PseudopotentialParams,
  kCart: readonly [number, number, number],
  gMaxSq: number = 21
): HermitianMatrix {
  validateEpmParams(params)
  const tpl = buildPotentialTemplate(params.formFactors, gMaxSq)
  return assembleHamiltonianAt(tpl, params.a, kCart)
}

function assembleHamiltonianAt(
  tpl: PotentialCacheKeyed,
  a: number,
  kCart: readonly [number, number, number]
): HermitianMatrix {
  const n = tpl.planeWaves
  const b = (2 * Math.PI) / a
  const kx = kCart[0]
  const ky = kCart[1]
  const kz = kCart[2]

  if (!tpl.hasAntisymmetric) {
    const H = realSymmetricMatrix(n)
    H.data.set(tpl.vRe)
    for (let i = 0; i < n; i++) {
      const g = tpl.G[i]
      const qx = kx + g.h * b
      const qy = ky + g.k * b
      const qz = kz + g.l * b
      H.data[i * n + i] = HBAR2_OVER_2M0 * (qx * qx + qy * qy + qz * qz)
    }
    return H
  }

  const H = complexHermitianMatrix(n)
  H.re.set(tpl.vRe)
  H.im.set(tpl.vIm)
  for (let i = 0; i < n; i++) {
    const g = tpl.G[i]
    const qx = kx + g.h * b
    const qy = ky + g.k * b
    const qz = kz + g.l * b
    H.re[i * n + i] = HBAR2_OVER_2M0 * (qx * qx + qy * qy + qz * qz)
  }
  return H
}

/**
 * Calcola le prime `numBands` bande dello pseudopotenziale lungo `path` (di default L–Γ–X–W–K–Γ).
 * Usa `vectors: false` su tutti i punti per massime prestazioni interattive.
 */
export function pseudopotentialBands(
  params: PseudopotentialParams,
  options: EpmBandOptions = {},
  customPath?: KPath
): BandStructure {
  validateEpmParams(params)
  const gMaxSq = options.gMaxSq ?? 21
  const pointsPerSegment = options.pointsPerSegment ?? 40
  const numBands = options.numBands ?? 8
  const zeroAtValenceTop = options.zeroAtValenceTop ?? true

  const path = customPath ?? epmBrillouinPath(params.a, pointsPerSegment)
  const tpl = buildPotentialTemplate(params.formFactors, gMaxSq)
  if (tpl.planeWaves < numBands) {
    throw new RangeError(`onde piane (${tpl.planeWaves}) insufficienti per ${numBands} bande`)
  }

  const nPts = path.points.length
  const energies = Array.from({ length: numBands }, () => new Float64Array(nPts))
  for (let i = 0; i < nPts; i++) {
    const H = assembleHamiltonianAt(tpl, params.a, path.points[i])
    const { values } = eigh(H, { vectors: false })
    for (let b = 0; b < numBands; b++) energies[b][i] = values[b]
  }

  if (zeroAtValenceTop && numBands >= 4) {
    let vbm = -Infinity
    const vTop = energies[3]
    for (let i = 0; i < nPts; i++) {
      if (vTop[i] > vbm) vbm = vTop[i]
    }
    for (let b = 0; b < numBands; b++) {
      const arr = energies[b]
      for (let i = 0; i < nPts; i++) arr[i] -= vbm
    }
  }

  return { method: 'pseudopotential', path, energies }
}

/** Bande del reticolo vuoto fcc (V_ps = 0) sullo stesso percorso L–Γ–X–W–K–Γ. */
export function emptyLatticeFccBands(
  a: number,
  options: { readonly gMaxSq?: number; readonly pointsPerSegment?: number; readonly numBands?: number } = {},
  customPath?: KPath
): BandStructure {
  if (!(a > 0) || !Number.isFinite(a)) throw new RangeError(`passo reticolare non valido: ${a}`)
  const gMaxSq = options.gMaxSq ?? 21
  const pointsPerSegment = options.pointsPerSegment ?? 40
  const numBands = options.numBands ?? 8

  const path = customPath ?? epmBrillouinPath(a, pointsPerSegment)
  const G = fccReciprocalVectors(gMaxSq)
  const b = (2 * Math.PI) / a
  const nPts = path.points.length
  const energies = Array.from({ length: numBands }, () => new Float64Array(nPts))
  const vals = new Float64Array(G.length)

  for (let i = 0; i < nPts; i++) {
    const [kx, ky, kz] = path.points[i]
    for (let m = 0; m < G.length; m++) {
      const g = G[m]
      const qx = kx + g.h * b
      const qy = ky + g.k * b
      const qz = kz + g.l * b
      vals[m] = HBAR2_OVER_2M0 * (qx * qx + qy * qy + qz * qz)
    }
    vals.sort()
    for (let band = 0; band < numBands; band++) {
      energies[band][i] = vals[band]
    }
  }

  return { method: 'empty-lattice', path, energies }
}

/**
 * Calcola autovettore e pesi per guscio ∑_{|G|²=s} |c_G|² nel singolo punto `kCart`
 * per la banda `bandIndex` (0..numBands-1), così l'istogramma si aggiorna sul solo stato scelto.
 */
export function pseudopotentialStateAt(
  params: PseudopotentialParams,
  kCart: readonly [number, number, number],
  bandIndex: number,
  gMaxSq: number = 21,
  numBands: number = 8,
  vbmShiftEv: number = 0
): EpmStateBreakdown {
  validateEpmParams(params)
  const tpl = buildPotentialTemplate(params.formFactors, gMaxSq)
  if (!Number.isInteger(bandIndex) || bandIndex < 0 || bandIndex >= tpl.planeWaves) {
    throw new RangeError(`indice di banda non valido: ${bandIndex}`)
  }
  const H = assembleHamiltonianAt(tpl, params.a, kCart)
  const { values, vectors } = eigh(H, { vectors: true })
  const energies = new Float64Array(Math.min(numBands, tpl.planeWaves))
  for (let b = 0; b < energies.length; b++) energies[b] = values[b] - vbmShiftEv

  const weightsMap = new Map<number, { weight: number; count: number }>()
  if (vectors) {
    const vec = eigenvector(vectors, bandIndex)
    for (let m = 0; m < tpl.planeWaves; m++) {
      const re = vec.re[m]
      const im = vec.im ? vec.im[m] : 0
      const w = re * re + im * im
      const gSq = tpl.G[m].gSq
      const cur = weightsMap.get(gSq)
      if (cur) {
        cur.weight += w
        cur.count += 1
      } else {
        weightsMap.set(gSq, { weight: w, count: 1 })
      }
    }
  }

  const shellWeights: ShellWeight[] = Array.from(weightsMap.entries())
    .sort((x, y) => x[0] - y[0])
    .map(([gSq, { weight, count }]) => ({ gSq, weight, planeWaveCount: count }))

  return { energies, shellWeights, planeWaves: tpl.planeWaves }
}

/** Versore unitario del tratto del percorso a cui appartiene `pointIndex`. */
export function epmSegmentDirection(path: KPath, pointIndex: number): readonly [number, number, number] {
  const n = path.points.length
  if (n < 2) return [1, 0, 0]
  // Se l'indice è in Γ (fine di L–Γ, inizio di Γ–X), privilegiamo la direzione Γ–X [1,0,0]
  const i0 = pointIndex >= n - 1 ? n - 2 : pointIndex
  const i1 = i0 + 1
  const p0 = path.points[i0]
  const p1 = path.points[i1]
  const dx = p1[0] - p0[0]
  const dy = p1[1] - p0[1]
  const dz = p1[2] - p0[2]
  const norm = Math.hypot(dx, dy, dz) || 1
  return [dx / norm, dy / norm, dz / norm]
}

export interface EpmLocalKinematics {
  /** Pendenza direzionale dE/dk_∥ (eV·Å). */
  readonly slope: number
  /** Curvatura direzionale d²E/dk_∥² (eV·Å²). */
  readonly curvature: number
  /** Rapporto m* / m₀ = (ħ²/m₀) / (d²E/dk_∥²). */
  readonly effectiveMassRatio: number
}

/**
 * Derivate prima e seconda direzionali della banda `bandIndex` lungo il versore
 * unitario `dirUnit` del tratto corrente (differenze centrate esatte con passo h).
 */
export function epmDirectionalKinematics(
  params: PseudopotentialParams,
  kCart: readonly [number, number, number],
  dirUnit: readonly [number, number, number],
  bandIndex: number,
  gMaxSq: number = 21,
  h: number = 1.5e-3
): EpmLocalKinematics {
  validateEpmParams(params)
  const tpl = buildPotentialTemplate(params.formFactors, gMaxSq)
  const norm = Math.hypot(dirUnit[0], dirUnit[1], dirUnit[2]) || 1
  const ux = dirUnit[0] / norm
  const uy = dirUnit[1] / norm
  const uz = dirUnit[2] / norm

  const evalBand = (t: number): number => {
    const H = assembleHamiltonianAt(tpl, params.a, [
      kCart[0] + t * ux,
      kCart[1] + t * uy,
      kCart[2] + t * uz
    ])
    return eigh(H, { vectors: false }).values[bandIndex]
  }

  const eMinus = evalBand(-h)
  const eZero = evalBand(0)
  const ePlus = evalBand(h)
  const slope = (ePlus - eMinus) / (2 * h)
  const curvature = (ePlus - 2 * eZero + eMinus) / (h * h)
  // ħ²/m₀ = 2 · HBAR2_OVER_2M0
  const effectiveMassRatio = (2 * HBAR2_OVER_2M0) / curvature
  return { slope, curvature, effectiveMassRatio }
}

/** Estrae VBM, CBM, gap assoluto (diretto/indiretto), posizione lungo ΓX e larghezza di valenza. */
export function analyzeEpmBands(
  bands: BandStructure,
  rawBands?: BandStructure,
  planeWaves: number = 113
): EpmBandSummary {
  if (bands.energies.length < 5) {
    throw new RangeError('servono almeno 5 bande (4 di valenza + 1 di conduzione)')
  }
  const vTop = bands.energies[3]
  const cBot = bands.energies[4]
  const vBot = bands.energies[0]
  const nPts = vTop.length

  let vbmIndex = 0
  let vbmEnergy = vTop[0]
  let cbmIndex = 0
  let cbmEnergy = cBot[0]
  let valenceBottom = vBot[0]

  for (let i = 1; i < nPts; i++) {
    if (vTop[i] > vbmEnergy) {
      vbmEnergy = vTop[i]
      vbmIndex = i
    }
    if (cBot[i] < cbmEnergy) {
      cbmEnergy = cBot[i]
      cbmIndex = i
    }
    if (vBot[i] < valenceBottom) valenceBottom = vBot[i]
  }

  // Indici dei punti L (0), Γ (1), X (2) nel percorso L–Γ–X–W–K–Γ
  const labels = bands.path.labels
  const iL = labels[0]?.index ?? 0
  const iG = labels[1]?.index ?? 0
  const iX = labels[2]?.index ?? Math.min(nPts - 1, 2)

  // Posizione relativa del minimo nel tratto in cui cade
  let segStart = 0
  let segEnd = nPts - 1
  for (let s = 0; s < labels.length - 1; s++) {
    if (cbmIndex >= labels[s].index && cbmIndex <= labels[s + 1].index) {
      segStart = labels[s].index
      segEnd = labels[s + 1].index
      break
    }
  }
  const dSeg = bands.path.distance[segEnd] - bands.path.distance[segStart]
  const cbmSegmentFraction =
    dSeg > 0 ? (bands.path.distance[cbmIndex] - bands.path.distance[segStart]) / dSeg : 0

  const isDirect = cbmIndex === vbmIndex || Math.hypot(
    bands.path.points[cbmIndex][0] - bands.path.points[vbmIndex][0],
    bands.path.points[cbmIndex][1] - bands.path.points[vbmIndex][1],
    bands.path.points[cbmIndex][2] - bands.path.points[vbmIndex][2]
  ) < 1e-6

  let cbmDescription: EpmBandSummary['cbmDescription'] = 'altro'
  if (cbmIndex === iG) cbmDescription = 'Γ'
  else if (cbmIndex === iL) cbmDescription = 'L'
  else if (cbmIndex === iX) cbmDescription = 'X'
  else if (cbmIndex > iG && cbmIndex < iX) cbmDescription = 'ΓX'

  let rawVbmEv = 0
  if (rawBands && rawBands.energies[3]) {
    rawVbmEv = -Infinity
    for (let i = 0; i < nPts; i++) {
      if (rawBands.energies[3][i] > rawVbmEv) rawVbmEv = rawBands.energies[3][i]
    }
  }

  return {
    planeWaves,
    vbmEnergy,
    vbmIndex,
    cbmEnergy,
    cbmIndex,
    gap: cbmEnergy - vbmEnergy,
    isDirect,
    cbmDescription,
    cbmSegmentFraction,
    ecGamma: cBot[iG],
    ecX: cBot[iX],
    ecL: cBot[iL],
    valenceBottom,
    valenceWidth: vbmEnergy - valenceBottom,
    rawVbmEv
  }
}

/**
 * Stima di Ashcroft–Mermin (P4 §4, eq. 11.4) del modulo |V_G| (eV) dello ione nudo
 * nel reticolo del diamante (8 atomi per cella cubica, Ω = a³/8):
 * |V_G| = Z · 4π (e²/4πε₀) / (Ω G²).
 */
export function bareIonFourierAmplitudeEv(a: number, atomicNumberZ: number, gSqDimless: number): number {
  if (!(a > 0) || !Number.isFinite(a)) throw new RangeError(`passo reticolare non valido: ${a}`)
  if (!(atomicNumberZ > 0) || !Number.isFinite(atomicNumberZ)) {
    throw new RangeError(`numero atomico non valido: ${atomicNumberZ}`)
  }
  if (!(gSqDimless > 0) || !Number.isFinite(gSqDimless)) {
    throw new RangeError(`|G|² non valido: ${gSqDimless}`)
  }
  const omegaAtom = (a * a * a) / 8
  const b = (2 * Math.PI) / a
  const g2 = gSqDimless * b * b
  return (atomicNumberZ * 4 * Math.PI * E2_OVER_4PI_EPS0) / (omegaAtom * g2)
}

/** Limite q → 0 dello pseudopotenziale schermato alla Thomas–Fermi: v(0) = −⅔ E_F (eV). */
export function thomasFermiZeroLimitEv(fermiEnergyEv: number): number {
  if (!(fermiEnergyEv >= 0) || !Number.isFinite(fermiEnergyEv)) {
    throw new RangeError(`E_F non valida: ${fermiEnergyEv}`)
  }
  return -(2 / 3) * fermiEnergyEv
}

/**
 * Curva di modello dello pseudopotenziale locale «empty core» di Ashcroft con schermatura
 * di Thomas–Fermi (parametri di tipo Si, P4 §4 fig. 4.1b):
 * v(q) = −(2/3) E_F · [k_TF² / (q² + k_TF²)] · cos(q · R_c).
 */
export function screenedAshcroftFormFactorCurve(
  a: number,
  qSqMaxDimless: number = 14,
  nPoints: number = 160,
  emptyCoreRadiusAng: number = 0.57
): FormFactorCurve {
  if (!(a > 0) || !Number.isFinite(a)) throw new RangeError(`passo reticolare non valido: ${a}`)
  const nValence = 8 / (a * a * a / 4) // 8 elettroni di valenza per cella primitiva (a³/4)
  const kF = Math.cbrt(3 * Math.PI * Math.PI * nValence)
  const efEv = HBAR2_OVER_2M0 * kF * kF
  const gDos = (3 * nValence) / (2 * efEv)
  const kTfSq = 4 * Math.PI * E2_OVER_4PI_EPS0 * gDos
  const v0Ev = thomasFermiZeroLimitEv(efEv)
  const v0Ry = v0Ev / RYDBERG_EV
  const b = (2 * Math.PI) / a

  const qSqDimless = new Float64Array(nPoints)
  const qAngInv = new Float64Array(nPoints)
  const vRy = new Float64Array(nPoints)

  for (let i = 0; i < nPoints; i++) {
    const q2Dim = (qSqMaxDimless * i) / (nPoints - 1)
    const q = Math.sqrt(q2Dim) * b
    const q2 = q * q
    qSqDimless[i] = q2Dim
    qAngInv[i] = q
    vRy[i] = (v0Ry * (kTfSq / (q2 + kTfSq)) * Math.cos(q * emptyCoreRadiusAng))
  }

  const qZero = Math.PI / (2 * emptyCoreRadiusAng)
  const zeroCrossingGSq = (qZero / b) * (qZero / b)

  return { qSqDimless, qAngInv, vRy, v0Ry, efEv, zeroCrossingGSq }
}

/**
 * Curve didattiche indicative nello spazio reale (P4 §4, fig. 4.1a):
 *  - potenziale dello ione nudo (∝ −1/|r|), soft core (→ 0 a r=0) e hard core (costante per |r| < r_c);
 *  - funzione di valenza vera ψ(r) con oscillazioni di ortogonalità al core contro parte liscia ψᶠ(r)
 *    coincidente fuori dal core |r| ≥ r_c.
 */
export function realSpacePseudopotentialModel(
  rMaxAng: number = 2.6,
  rcAng: number = 0.72,
  nPoints: number = 241
): RealSpaceModelCurves {
  const r = new Float64Array(nPoints)
  const bareIon = new Float64Array(nPoints)
  const softCore = new Float64Array(nPoints)
  const hardCore = new Float64Array(nPoints)
  const truePsi = new Float64Array(nPoints)
  const smoothPsi = new Float64Array(nPoints)

  // Unica scala normalizzata di potenziale: fuori da r_c tutte convergono a -rc/|r|
  for (let i = 0; i < nPoints; i++) {
    const x = -rMaxAng + (2 * rMaxAng * i) / (nPoints - 1)
    const ax = Math.abs(x)
    r[i] = x

    // Potenziale ione nudo smussato solo sul picco numerico centrale (clamp grafico a −4.2)
    bareIon[i] = -Math.min(4.2, (rcAng * 1.0) / Math.max(ax, 0.08))

    // Soft core: tende dolcemente a 0 dentro r_c e raccorda -r_c/|r| fuori
    const u = ax / rcAng
    const switchOutside = 1 - Math.exp(-(u * u * u))
    softCore[i] = u < 1e-4 ? 0 : (-rcAng / ax) * switchOutside

    // Hard core: costante negativa continua al raccordo in r = r_c, poi -r_c/|r| fuori
    hardCore[i] = ax < rcAng ? -1.0 : -rcAng / ax

    // Parte liscia ψᶠ: massimo interstiziale positivo tra atomi e liscia nell'origine
    const env = 0.58 + 0.36 * Math.cos((Math.PI * x) / rMaxAng)
    const coreDamp = 1 - 0.38 * Math.exp(-(u * u))
    const psiF = env * coreDamp
    smoothPsi[i] = psiF

    // Funzione vera ψ: oscilla rapidamente dentro |r| < r_c (ortogonale agli stati di core)
    // e coincide con ψᶠ fuori dal raggio di core r_c.
    if (ax < rcAng) {
      const s = ax / rcAng
      const bell = Math.pow(1 - s * s, 2) // derivata nulla in r = r_c per raccordo C¹
      const osc = -1.45 * Math.cos(2.5 * Math.PI * s)
      truePsi[i] = psiF + bell * osc
    } else {
      truePsi[i] = psiF
    }
  }

  return { r, bareIon, softCore, hardCore, truePsi, smoothPsi, rc: rcAng }
}

function validateEpmParams(params: PseudopotentialParams): void {
  if (!(params.a > 0) || !Number.isFinite(params.a)) {
    throw new RangeError(`passo reticolare non valido: ${params.a}`)
  }
  const ff = params.formFactors
  for (const val of [ff.v3s, ff.v8s, ff.v11s, ff.v3a, ff.v4a, ff.v11a]) {
    if (!Number.isFinite(val)) throw new RangeError(`fattore di forma non valido: ${val}`)
  }
}
