/**
 * Modello 1D esatto per lo pseudopotenziale con stato di core (dispensa P4 §4 e verifica_pseudo.py r. 58–92).
 *
 * Cristallo 1D di buche gaussiane:
 *   V(x) = −V₀ ∑_m exp(−(x − m a)² / (2 s²))
 *   V_G  = −V₀ √(2π) (s/a) exp(−G² s² / 2)
 *
 * Base di onde piane G = 2πn/a, n = −nHalf…nHalf (default nHalf = 40 → 81 onde).
 * Sulla diagonale ħ²(k + G)²/2m₀: la componente G = 0 del potenziale è uno spostamento
 * costante e viene omessa, come in verifica_pseudo.py.
 *
 * Unità: lunghezze in Å, vettori d'onda in Å⁻¹, energie in eV.
 */
import type { BandStructure, KPath } from './bandStructure'
import { HBAR2_OVER_2M0 } from './constants'
import { eigh, eigenvector, realSymmetricMatrix, type RealSymmetricMatrix } from './linalg'

export interface PseudoCore1DParams {
  /** Passo reticolare a (Å). */
  readonly a: number
  /** Profondità della buca gaussiana V₀ (eV, > 0). */
  readonly v0: number
  /** Larghezza gaussiana s (Å, > 0). */
  readonly s: number
}

export interface PseudoCore1DState {
  readonly k: number
  readonly nHalf: number
  readonly G: Float64Array
  readonly energies: Float64Array
  /** Autovettori normalizzati per banda: vectors[b][m] = c_{b, G_m}. */
  readonly vectors: readonly Float64Array[]
  readonly hamiltonian: RealSymmetricMatrix
}

export interface CancellationElements {
  readonly nValues: Int32Array
  readonly gValues: Float64Array
  /** ⟨k+G|V|k⟩ = V_G (0 per G = 0 nello zero di potenziale adottato). */
  readonly vMat: Float64Array
  /** ⟨k+G|V′|k⟩ = (E_v − E_c) c_{c,G} c_{c,0}. */
  readonly vPrimeMat: Float64Array
  /** ⟨k+G|V + V′|k⟩ = vMat + vPrimeMat. */
  readonly vPsMat: Float64Array
}

export const DEFAULT_N_HALF = 40

function validateParams(params: PseudoCore1DParams): void {
  if (!(params.a > 0)) throw new RangeError(`passo reticolare non valido: ${params.a}`)
  if (!(params.v0 >= 0)) throw new RangeError(`profondità V₀ non valida: ${params.v0}`)
  if (!(params.s > 0)) throw new RangeError(`larghezza s non valida: ${params.s}`)
}

/** Coefficiente di Fourier V_G = −V₀ √(2π) (s/a) exp(−G² s² / 2) in eV. */
export function gaussianWellFourierCoeff(G: number, params: PseudoCore1DParams): number {
  const { a, v0, s } = params
  return -v0 * Math.sqrt(2 * Math.PI) * (s / a) * Math.exp(-0.5 * (G * s) ** 2)
}

/**
 * Potenziale cristallino periodico V(x) = −V₀ ∑_m exp(−(x − m a)² / (2 s²)) (eV),
 * centrato sullo ione in x = 0 e sommato sui primi vicini periodici.
 */
export function gaussianCrystalPotential(x: number, params: PseudoCore1DParams): number {
  const { a, v0, s } = params
  const mCenter = Math.round(x / a)
  const inv2s2 = 1 / (2 * s * s)
  let sum = 0
  for (let dm = -3; dm <= 3; dm++) {
    const dx = x - (mCenter + dm) * a
    sum += Math.exp(-dx * dx * inv2s2)
  }
  return -v0 * sum
}

/**
 * Potenziale cristallino V(x) − V̄ con media V̄ = V_{G=0} sottratta,
 * cioè nello stesso zero di energia dell'Hamiltoniana (dove G = 0 è omesso).
 */
export function gaussianCrystalPotentialZeroMean(x: number, params: PseudoCore1DParams): number {
  return gaussianCrystalPotential(x, params) - gaussianWellFourierCoeff(0, params)
}

/** Vettori reciproci 1D G = 2πn/a per n = −nHalf…nHalf. */
export function pseudoCore1DPlaneWaves(a: number, nHalf: number = DEFAULT_N_HALF): Float64Array {
  if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`)
  if (!Number.isInteger(nHalf) || nHalf < 1) throw new RangeError(`nHalf non valido: ${nHalf}`)
  const nWaves = 2 * nHalf + 1
  const G = new Float64Array(nWaves)
  const gStep = (2 * Math.PI) / a
  for (let m = 0; m < nWaves; m++) {
    G[m] = (m - nHalf) * gStep
  }
  return G
}

function buildHamiltonian1D(
  k: number,
  params: PseudoCore1DParams,
  G: Float64Array
): RealSymmetricMatrix {
  const nWaves = G.length
  const H = realSymmetricMatrix(nWaves)
  const data = H.data
  for (let i = 0; i < nWaves; i++) {
    const kPlusG = k + G[i]
    data[i * nWaves + i] = HBAR2_OVER_2M0 * kPlusG * kPlusG
    for (let j = i + 1; j < nWaves; j++) {
      const vg = gaussianWellFourierCoeff(G[i] - G[j], params)
      data[i * nWaves + j] = vg
      data[j * nWaves + i] = vg
    }
  }
  return H
}

/**
 * Fissa in modo deterministico il segno di ciascun autovettore:
 *  - banda di core (bandIndex = 0): ψ_c(0) = ∑ c_G > 0 sullo ione;
 *  - bande di valenza (bandIndex ≥ 1): Re ψ(a/2) > 0 tra gli ioni se non nulla
 *    (così lungo tutta la banda 1 non ci sono salti di segno e in Γ ψ_k(a/2) > 0),
 *    altrimenti ψ(0) > 0, poi pendenza in x = 0 > 0, infine prima componente non nulla.
 */
function fixEigenvectorSign(
  vec: Float64Array,
  k: number,
  G: Float64Array,
  a: number,
  bandIndex: number
): Float64Array {
  const out = Float64Array.from(vec)
  let sumAtZero = 0
  for (let m = 0; m < out.length; m++) sumAtZero += out[m]

  let sumAtMid = 0
  if (bandIndex >= 1) {
    const halfA = 0.5 * a
    for (let m = 0; m < out.length; m++) sumAtMid += out[m] * Math.cos((k + G[m]) * halfA)
  }

  let flip = false
  if (bandIndex >= 1 && Math.abs(sumAtMid) > 1e-8) {
    flip = sumAtMid < 0
  } else if (Math.abs(sumAtZero) > 1e-8) {
    flip = sumAtZero < 0
  } else {
    let slopeAtZero = 0
    for (let m = 0; m < out.length; m++) slopeAtZero += (k + G[m]) * out[m]
    if (Math.abs(slopeAtZero) > 1e-8) {
      flip = slopeAtZero < 0
    } else {
      for (let m = 0; m < out.length; m++) {
        if (Math.abs(out[m]) > 1e-8) {
          flip = out[m] < 0
          break
        }
      }
    }
  }

  if (flip) {
    for (let m = 0; m < out.length; m++) out[m] = -out[m]
  }
  return out
}

/** Risolve l'equazione di Schrödinger 1D nel singolo punto k. */
export function solvePseudoCore1DAtK(
  k: number,
  params: PseudoCore1DParams,
  nHalf: number = DEFAULT_N_HALF
): PseudoCore1DState {
  validateParams(params)
  const G = pseudoCore1DPlaneWaves(params.a, nHalf)
  const H = buildHamiltonian1D(k, params, G)
  const { values, vectors } = eigh(H, { vectors: true })
  const vecList: Float64Array[] = []
  if (vectors) {
    for (let b = 0; b < vectors.count; b++) {
      const raw = eigenvector(vectors, b).re
      vecList.push(fixEigenvectorSign(raw, k, G, params.a, b))
    }
  }
  return { k, nHalf, G, energies: values, vectors: vecList, hamiltonian: H }
}

/** Calcola le bande 1D (banda 0 = core, bande 1..nBands-1 = valenza) lungo un cammino 1D. */
export function pseudoCore1DBands(
  params: PseudoCore1DParams,
  path: KPath,
  nBands: number = 4,
  nHalf: number = DEFAULT_N_HALF
): BandStructure {
  validateParams(params)
  if (path.dimension !== 1) throw new RangeError('pseudoCore1DBands: serve un cammino 1D')
  const G = pseudoCore1DPlaneWaves(params.a, nHalf)
  const count = Math.min(nBands, G.length)
  const energies = Array.from({ length: count }, () => new Float64Array(path.points.length))
  for (let i = 0; i < path.points.length; i++) {
    const k = path.points[i][0]
    const H = buildHamiltonian1D(k, params, G)
    const { values } = eigh(H, { vectors: false })
    for (let b = 0; b < count; b++) {
      energies[b][i] = values[b]
    }
  }
  return { method: 'pseudopotential', path, energies }
}

/** Valuta ψ(x) = (1/√a) ∑_G c_G exp(i(k+G)x) sui punti `xGrid`. */
export function evalBlochWavefunction1D(
  coeffs: Float64Array,
  G: Float64Array,
  k: number,
  a: number,
  xGrid: Float64Array
): { readonly re: Float64Array; readonly im: Float64Array; readonly absSq: Float64Array } {
  const n = xGrid.length
  const re = new Float64Array(n)
  const im = new Float64Array(n)
  const absSq = new Float64Array(n)
  const norm = 1 / Math.sqrt(a)
  for (let i = 0; i < n; i++) {
    const x = xGrid[i]
    let r = 0
    let imPart = 0
    for (let m = 0; m < G.length; m++) {
      const c = coeffs[m]
      if (c === 0) continue
      const phase = (k + G[m]) * x
      r += c * Math.cos(phase)
      imPart += c * Math.sin(phase)
    }
    r *= norm
    imPart *= norm
    re[i] = r
    im[i] = imPart
    absSq[i] = r * r + imPart * imPart
  }
  return { re, im, absSq }
}

/**
 * Raggio indicativo del core r_c (Å) ricavato da |ψ_c(x)|² nella cella [−a/2, a/2]:
 * semilarghezza centrata sullo ione (x = 0) che racchiude il 95% della probabilità di core.
 */
export function computeCoreRadius(
  cCore: Float64Array,
  G: Float64Array,
  k: number,
  a: number,
  nSamples: number = 200
): number {
  const dx = (0.5 * a) / nSamples
  const xGrid = new Float64Array(nSamples + 1)
  for (let i = 0; i <= nSamples; i++) xGrid[i] = i * dx
  const { absSq } = evalBlochWavefunction1D(cCore, G, k, a, xGrid)

  // Integrale cumulativo su [0, a/2] con regola dei trapezi (simmetrico per |ψ_c|²)
  const cum = new Float64Array(nSamples + 1)
  for (let i = 1; i <= nSamples; i++) {
    cum[i] = cum[i - 1] + 0.5 * (absSq[i - 1] + absSq[i]) * dx
  }
  const total = cum[nSamples]
  if (!(total > 0)) return 0
  const target = 0.95 * total
  for (let i = 1; i <= nSamples; i++) {
    if (cum[i] >= target) {
      const prev = cum[i - 1]
      const frac = cum[i] > prev ? (target - prev) / (cum[i] - prev) : 0
      return xGrid[i - 1] + frac * dx
    }
  }
  return 0.5 * a
}

/**
 * Costruisce la pseudo-Hamiltoniana H + f |ψ_ck⟩⟨ψ_ck| per f arbitraria
 * (non unicità dello pseudopotenziale: le bande di valenza restano invariate,
 * il livello di core si sposta a E_c + f).
 */
export function buildPseudoHamiltonianWithF(
  H: RealSymmetricMatrix,
  cCore: Float64Array,
  f: number
): RealSymmetricMatrix {
  const n = H.n
  const out = realSymmetricMatrix(n)
  const src = H.data
  const dst = out.data
  for (let i = 0; i < n; i++) {
    const fi = f * cCore[i]
    for (let j = i; j < n; j++) {
      const val = src[i * n + j] + fi * cCore[j]
      dst[i * n + j] = val
      dst[j * n + i] = val
    }
  }
  return out
}

/**
 * Costruisce la pseudo-funzione ψ^f = ψ_k + α ψ_ck (non normalizzata e normalizzata)
 * e la sua proiezione vera (1 − Π_c) ψ^f = ψ^f − ⟨ψ_ck|ψ^f⟩ ψ_ck.
 */
export function pseudoWavefunctionAndTrue(
  cValence: Float64Array,
  cCore: Float64Array,
  alpha: number
): {
  readonly cPseudoRaw: Float64Array
  readonly cPseudoNorm: Float64Array
  readonly cProjected: Float64Array
} {
  const n = cValence.length
  const cPseudoRaw = new Float64Array(n)
  const cPseudoNorm = new Float64Array(n)
  const cProjected = new Float64Array(n)

  let normSq = 0
  let overlap = 0
  for (let m = 0; m < n; m++) {
    const val = cValence[m] + alpha * cCore[m]
    cPseudoRaw[m] = val
    normSq += val * val
    overlap += cCore[m] * val
  }
  const invNorm = normSq > 0 ? 1 / Math.sqrt(normSq) : 1
  for (let m = 0; m < n; m++) {
    cPseudoNorm[m] = cPseudoRaw[m] * invNorm
    cProjected[m] = cPseudoRaw[m] - overlap * cCore[m]
  }
  return { cPseudoRaw, cPseudoNorm, cProjected }
}

/**
 * Scelta «più liscia»: restituisce l'α = −⟨ψ_c|T|ψ_k⟩ / ⟨ψ_c|T|ψ_c⟩ che minimizza
 * l'energia cinetica della pseudo-funzione non normalizzata ψ^f = ψ_k + α ψ_c
 * (coincide con ψ_k fuori dal core, ha ∫|dψ/dx|² minimo e resta sempre finita;
 * vale 0 per gli stati dispari attorno allo ione).
 */
export function smoothestAlpha(
  cValence: Float64Array,
  cCore: Float64Array,
  k: number,
  G: Float64Array
): number {
  let tcc = 0
  let tvc = 0
  for (let m = 0; m < G.length; m++) {
    const t = HBAR2_OVER_2M0 * (k + G[m]) ** 2
    const c = cCore[m]
    tcc += t * c * c
    tvc += t * cValence[m] * c
  }
  if (tcc <= 1e-18) return 0
  const alpha = -tvc / tcc
  return Math.abs(alpha) < 1e-15 ? 0 : alpha
}

/** Posizioni (Å) dei cambi di segno di `psiValues` dentro la regione di core |x| < r_c. */
export function findSignChangesInCore(
  psiValues: Float64Array,
  xGrid: Float64Array,
  rc: number
): number[] {
  const crossings: number[] = []
  const n = Math.min(psiValues.length, xGrid.length)
  if (n < 2 || !(rc > 0)) return crossings

  const eps = 1e-12
  for (let i = 1; i < n; i++) {
    const y0 = psiValues[i - 1]
    const y1 = psiValues[i]
    if (Math.abs(y1) <= eps) {
      if (i + 1 < n && y0 * psiValues[i + 1] < 0) {
        const xZero = xGrid[i]
        if (Math.abs(xZero) < rc) crossings.push(xZero)
      }
      continue
    }
    if (Math.abs(y0) <= eps) continue
    if (y0 * y1 < 0) {
      const frac = -y0 / (y1 - y0)
      const xZero = xGrid[i - 1] + frac * (xGrid[i] - xGrid[i - 1])
      if (Math.abs(xZero) < rc) crossings.push(xZero)
    }
  }
  return crossings
}

export interface OrthogonalityProfile {
  readonly integrand: Float64Array
  readonly posArea: number
  readonly negArea: number
  readonly netIntegral: number
}

/**
 * Calcola l'integrando di ortogonalità Re[ψ_c*(x) ψ_k(x)] su `xGrid`
 * e le aree positiva e negativa (regola dei trapezi, dividendo gli intervalli che cambiano segno).
 */
export function orthogonalityIntegrand1D(
  psiCoreRe: Float64Array,
  psiCoreIm: Float64Array,
  psiValRe: Float64Array,
  psiValIm: Float64Array,
  xGrid: Float64Array
): OrthogonalityProfile {
  const n = xGrid.length
  const integrand = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    integrand[i] = psiCoreRe[i] * psiValRe[i] + psiCoreIm[i] * psiValIm[i]
  }
  let posArea = 0
  let negArea = 0
  for (let i = 1; i < n; i++) {
    const dx = xGrid[i] - xGrid[i - 1]
    const y0 = integrand[i - 1]
    const y1 = integrand[i]
    if (y0 * y1 >= 0) {
      const area = 0.5 * (y0 + y1) * dx
      if (area >= 0) posArea += area
      else negArea += area
    } else {
      const frac = Math.abs(y0) / (Math.abs(y0) + Math.abs(y1))
      const dx0 = frac * dx
      const dx1 = (1 - frac) * dx
      const a0 = 0.5 * y0 * dx0
      const a1 = 0.5 * y1 * dx1
      if (a0 >= 0) posArea += a0
      else negArea += a0
      if (a1 >= 0) posArea += a1
      else negArea += a1
    }
  }
  return { integrand, posArea, negArea, netIntegral: posArea + negArea }
}

/** Energia cinetica media ⟨ψ|T|ψ⟩ / ⟨ψ|ψ⟩ (eV) di un vettore di coefficienti in onde piane. */
export function meanKineticEnergy1D(
  coeffs: Float64Array,
  G: Float64Array,
  k: number
): number {
  let num = 0
  let den = 0
  for (let m = 0; m < G.length; m++) {
    const c2 = coeffs[m] * coeffs[m]
    if (c2 === 0) continue
    const t = HBAR2_OVER_2M0 * (k + G[m]) ** 2
    num += t * c2
    den += c2
  }
  return den > 0 ? num / den : 0
}

/** Peso frazionario max_G |c_G|² / ∑_G |c_G|² dell'onda piana dominante. */
export function dominantPlaneWaveWeight(coeffs: Float64Array): number {
  let maxSq = 0
  let sumSq = 0
  for (let m = 0; m < coeffs.length; m++) {
    const w = coeffs[m] * coeffs[m]
    sumSq += w
    if (w > maxSq) maxSq = w
  }
  return sumSq > 0 ? maxSq / sumSq : 0
}

export interface PlaneWaveConvergencePoint {
  readonly nWaves: number
  readonly errorTrue: number | null
  readonly errorPseudo: number | null
}

export interface PlaneWaveConvergenceResult {
  readonly points: readonly PlaneWaveConvergencePoint[]
  readonly nNeededTrue: number | null
  readonly nNeededPseudo: number | null
}

export const DEFAULT_CONVERGENCE_N_LIST: readonly number[] = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21]

/**
 * Errore su E(k) della banda di valenza `bandIndex` (≥ 1) troncando alle `N` onde piane
 * di energia cinetica ħ²(k + G)² / 2m₀ più bassa:
 *  (a) H vera (autovalore di indice `bandIndex`),
 *  (b) H + (E − E_c)|ψ_c⟩⟨ψ_c| con ψ_c esatta (autovalore di indice `bandIndex − 1`).
 */
export function planeWaveConvergence1D(
  state: PseudoCore1DState,
  bandIndex: number,
  nList: readonly number[] = DEFAULT_CONVERGENCE_N_LIST,
  thresholdEv: number = 0.01
): PlaneWaveConvergenceResult {
  if (bandIndex < 1 || bandIndex >= state.energies.length) {
    throw new RangeError(`bandIndex di valenza non valido: ${bandIndex}`)
  }
  const { k, G, energies, vectors, hamiltonian } = state
  const eExact = energies[bandIndex]
  const eCore = energies[0]
  const cCore = vectors[0]
  const Hps = buildPseudoHamiltonianWithF(hamiltonian, cCore, eExact - eCore)

  const order = Array.from({ length: G.length }, (_, idx) => idx).sort((i, j) => {
    const ti = (k + G[i]) ** 2
    const tj = (k + G[j]) ** 2
    return ti - tj || Math.abs(G[i]) - Math.abs(G[j])
  })

  const points: PlaneWaveConvergencePoint[] = []
  let nNeededTrue: number | null = null
  let nNeededPseudo: number | null = null

  for (const rawN of nList) {
    const N = Math.min(G.length, Math.max(1, Math.round(rawN)))
    const sub = order.slice(0, N)
    const subH = realSymmetricMatrix(N)
    const subHps = realSymmetricMatrix(N)
    const nFull = hamiltonian.n
    for (let i = 0; i < N; i++) {
      const si = sub[i] * nFull
      const row = i * N
      for (let j = i; j < N; j++) {
        const sj = sub[j]
        const vH = hamiltonian.data[si + sj]
        const vP = Hps.data[si + sj]
        subH.data[row + j] = vH
        subH.data[j * N + i] = vH
        subHps.data[row + j] = vP
        subHps.data[j * N + i] = vP
      }
    }

    const evH = eigh(subH, { vectors: false }).values
    const evHps = eigh(subHps, { vectors: false }).values
    const errorTrue = N > bandIndex ? evH[bandIndex] - eExact : null
    const errorPseudo = N > bandIndex - 1 ? evHps[bandIndex - 1] - eExact : null

    if (nNeededTrue === null && errorTrue !== null && errorTrue < thresholdEv) {
      nNeededTrue = N
    }
    if (nNeededPseudo === null && errorPseudo !== null && errorPseudo < thresholdEv) {
      nNeededPseudo = N
    }

    points.push({ nWaves: N, errorTrue, errorPseudo })
  }

  return { points, nNeededTrue, nNeededPseudo }
}

/** Peso ∑_{|n| > nCutoff} |c_G|² delle onde piane ad alto impulso. */
export function planeWaveTailWeight(
  coeffs: Float64Array,
  nHalf: number,
  nCutoff: number = 3
): number {
  let normSq = 0
  let tailSq = 0
  for (let m = 0; m < coeffs.length; m++) {
    const w = coeffs[m] * coeffs[m]
    normSq += w
    const n = m - nHalf
    if (Math.abs(n) > nCutoff) tailSq += w
  }
  return normSq > 0 ? tailSq / normSq : 0
}

/**
 * Elementi di matrice ⟨k+G|V|k⟩ contro ⟨k+G|V + V′|k⟩ per n = −nDisplay…nDisplay,
 * con V′ = (E_v − E_c)|ψ_ck⟩⟨ψ_ck| (mostra la cancellazione nello spazio reciproco).
 */
export function cancellationMatrixElements(
  G: Float64Array,
  nHalf: number,
  params: PseudoCore1DParams,
  eValence: number,
  eCore: number,
  cCore: Float64Array,
  nDisplay: number = 12
): CancellationElements {
  const maxN = Math.min(nDisplay, nHalf)
  const len = 2 * maxN + 1
  const nValues = new Int32Array(len)
  const gValues = new Float64Array(len)
  const vMat = new Float64Array(len)
  const vPrimeMat = new Float64Array(len)
  const vPsMat = new Float64Array(len)

  const c0 = cCore[nHalf]
  const dE = eValence - eCore
  for (let idx = 0; idx < len; idx++) {
    const n = idx - maxN
    const m = nHalf + n
    const g = G[m]
    const v = n === 0 ? 0 : gaussianWellFourierCoeff(g, params)
    const vp = dE * cCore[m] * c0
    nValues[idx] = n
    gValues[idx] = g
    vMat[idx] = v
    vPrimeMat[idx] = vp
    vPsMat[idx] = v + vp
  }
  return { nValues, gValues, vMat, vPrimeMat, vPsMat }
}
