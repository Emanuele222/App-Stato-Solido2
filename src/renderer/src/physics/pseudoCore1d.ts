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
 * ψ(0) = ∑ c_G > 0 sullo ione in x = 0; se ψ(0) ≈ 0 (stato dispari),
 * usa la pendenza in x = 0 (∑ (k+G) c_G > 0) o la prima componente non nulla.
 */
function fixEigenvectorSign(vec: Float64Array, k: number, G: Float64Array): Float64Array {
  const out = Float64Array.from(vec)
  let sumAtZero = 0
  for (let m = 0; m < out.length; m++) sumAtZero += out[m]

  let flip = false
  if (Math.abs(sumAtZero) > 1e-8) {
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
      vecList.push(fixEigenvectorSign(raw, k, G))
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
 * Scelta «più liscia»: restituisce l'α che minimizza l'energia cinetica media
 * ⟨ψ^f|T|ψ^f⟩ / ⟨ψ^f|ψ^f⟩ della pseudo-funzione normalizzata ψ^f = ψ_k + α ψ_ck.
 */
export function smoothestAlpha(
  cValence: Float64Array,
  cCore: Float64Array,
  k: number,
  G: Float64Array
): number {
  let tvv = 0
  let tcc = 0
  let tvc = 0
  for (let m = 0; m < G.length; m++) {
    const t = HBAR2_OVER_2M0 * (k + G[m]) ** 2
    const v = cValence[m]
    const c = cCore[m]
    tvv += t * v * v
    tcc += t * c * c
    tvc += t * v * c
  }
  if (Math.abs(tvc) < 1e-12) return 0

  const diff = tcc - tvv
  const disc = Math.sqrt(diff * diff + 4 * tvc * tvc)
  const a1 = (diff + disc) / (2 * tvc)
  const a2 = (diff - disc) / (2 * tvc)
  const evalT = (a: number): number => (tvv + 2 * a * tvc + a * a * tcc) / (1 + a * a)
  return evalT(a1) <= evalT(a2) ? a1 : a2
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
