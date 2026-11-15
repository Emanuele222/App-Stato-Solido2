/**
 * Equazione centrale in 1D (dispensa P3 §11.3, eq. centrale):
 *   (E_{k+G} − E) c_G + Σ_{G'} V_{G−G'} c_{G'} = 0,   E_{k+G} = ħ²(k+G)²/2m₀.
 * Per ogni k è il problema agli autovalori della matrice
 *   H_{GG'} = E_{k+G} δ_{GG'} + V_{G−G'}
 * sulla base delle onde piane e^{i(k+G)x}, G = 2πn/a.
 *
 * Convenzione (P3 eq. fourierV): V(x) = Σ_G V_G e^{iGx}. Con V_G reali e pari,
 * V(x) = V̄ + 2·V_G·cos(2πx/a) + 2·V_2G·cos(4πx/a) + …; gli ioni stanno in x = n·a
 * e per ioni attrattivi V_G < 0 (minimi di V sugli ioni).
 */
import type { BandStructure, KPath } from './bandStructure'
import { HBAR2_OVER_2M0 } from './constants'
import { eigenvector, eigh, realSymmetricMatrix, type EigenVectors, type RealSymmetricMatrix } from './linalg'

/** Potenziale periodico 1D descritto dai suoi coefficienti di Fourier. */
export interface PeriodicPotential1D {
  /** Passo reticolare a (Å). */
  readonly a: number
  /**
   * Coefficienti di Fourier reali e con segno, in eV:
   * fourier[0] = V_G, fourier[1] = V_2G, … (V_{−nG} = V_{nG}).
   */
  readonly fourier: readonly number[]
  /** Media V̄ = V_{G=0} (eV); default 0. Sposta tutte le bande di V̄. */
  readonly mean?: number
}

export interface CentralEquationOptions {
  /** Numero di onde piane della base (≥ 1). Con 2 si ottiene il modello a due onde vicino a ±π/a. */
  readonly planeWaves: number
  /**
   * k (Å⁻¹) con cui scegliere la base; default: il k del calcolo. Fissarlo serve
   * quando si deriva E(k) per differenze finite, per non cambiare base tra k ± h.
   */
  readonly basisK?: number
  /** Calcolare i coefficienti c_G (default true). */
  readonly coefficients?: boolean
}

/** Soluzione dell'equazione centrale in un punto k. */
export interface CentralSolution1D {
  /** Vettore di Bloch (Å⁻¹). */
  readonly k: number
  /** Passo reticolare (Å). */
  readonly a: number
  /** Indici n delle onde piane della base, G = 2πn/a, in ordine crescente. */
  readonly g: Int32Array
  /** E_n(k) (eV), crescenti; una per onda piana della base. */
  readonly energies: Float64Array
  /**
   * c_G per ogni banda: l'autovettore j contiene i pesi della banda j sulle onde
   * e^{i(k+G)x} nell'ordine di `g`; normalizzati, Σ|c_G|² = 1. Segno fissato
   * in modo che la componente di modulo massimo sia reale positiva. `null` se non richiesti.
   */
  readonly coefficients: EigenVectors | null
}

/** V(x) in eV, x in Å: V̄ + 2 Σ_n V_nG cos(2πnx/a). */
export function potentialAt(potential: PeriodicPotential1D, x: number): number {
  const { a, fourier } = potential
  let v = potential.mean ?? 0
  for (let n = 1; n <= fourier.length; n++) v += 2 * fourier[n - 1] * Math.cos((2 * Math.PI * n * x) / a)
  return v
}

/**
 * Base di `count` onde piane per il punto k: i G = 2πn/a con |k + G| più
 * piccolo (cioè energia cinetica più bassa). Per k nella prima zona e `count`
 * dispari è la base simmetrica n = −M…M; con `count` = 2 e k vicino a π/a è
 * {−1, 0}, le due onde del modello a due onde. A parità di |k + G| vince |n|
 * minore. Restituisce gli n in ordine crescente.
 */
export function planeWaveBasis1D(k: number, a: number, count: number): Int32Array {
  if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`)
  if (!Number.isInteger(count) || count < 1) throw new RangeError(`numero di onde piane non valido: ${count}`)
  const G = (2 * Math.PI) / a
  const n0 = -Math.round(k / G)
  const candidates: number[] = []
  for (let n = n0 - count - 1; n <= n0 + count + 1; n++) candidates.push(n)
  const tol = 1e-9 * G
  candidates.sort((n1, n2) => {
    const d = Math.abs(k + n1 * G) - Math.abs(k + n2 * G)
    if (Math.abs(d) > tol) return d
    if (Math.abs(n1) !== Math.abs(n2)) return Math.abs(n1) - Math.abs(n2)
    return n1 - n2
  })
  const chosen = candidates.slice(0, count).sort((x, y) => x - y)
  return Int32Array.from(chosen)
}

/** Matrice H_{GG'} = E_{k+G} δ_{GG'} + V_{G−G'} sulla base `g` (indici n). */
export function centralEquationMatrix1D(
  potential: PeriodicPotential1D,
  k: number,
  g: Int32Array
): RealSymmetricMatrix {
  const { a, fourier } = potential
  const mean = potential.mean ?? 0
  const G = (2 * Math.PI) / a
  const size = g.length
  const H = realSymmetricMatrix(size)
  for (let i = 0; i < size; i++) {
    const q = k + g[i] * G
    H.data[i * size + i] = HBAR2_OVER_2M0 * q * q + mean
    for (let j = i + 1; j < size; j++) {
      const m = Math.abs(g[i] - g[j])
      const v = m <= fourier.length ? fourier[m - 1] : 0
      H.data[i * size + j] = v
      H.data[j * size + i] = v
    }
  }
  return H
}

/** Risolve l'equazione centrale nel punto k (Å⁻¹). */
export function solveCentralEquation1D(
  potential: PeriodicPotential1D,
  k: number,
  options: CentralEquationOptions
): CentralSolution1D {
  validatePotential(potential)
  if (!Number.isFinite(k)) throw new RangeError(`k non valido: ${k}`)
  const g = planeWaveBasis1D(options.basisK ?? k, potential.a, options.planeWaves)
  const H = centralEquationMatrix1D(potential, k, g)
  const wantCoefficients = options.coefficients ?? true
  const { values, vectors } = eigh(H, { vectors: wantCoefficients })
  if (vectors) fixPhases(vectors)
  return { k, a: potential.a, g, energies: values, coefficients: vectors }
}

/**
 * La banda `band` (0 = la più bassa) come funzione E(k), calcolata con una base
 * fissa scelta in `basisK`: adatta a derivate numeriche (velocità, massa efficace).
 */
export function centralEquationBand(
  potential: PeriodicPotential1D,
  band: number,
  options: { readonly planeWaves: number; readonly basisK: number }
): (k: number) => number {
  validatePotential(potential)
  if (!Number.isInteger(band) || band < 0 || band >= options.planeWaves) {
    throw new RangeError(`indice di banda fuori intervallo: ${band}`)
  }
  const g = planeWaveBasis1D(options.basisK, potential.a, options.planeWaves)
  return (k: number) => eigh(centralEquationMatrix1D(potential, k, g), { vectors: false }).values[band]
}

export interface NearlyFreeBandsOptions {
  /** Numero di onde piane della base. */
  readonly planeWaves: number
  /** Numero di bande da restituire (default: tutte, = planeWaves). */
  readonly bands?: number
  /** Conservare gli autostati (coefficienti c_G) per ogni k (default false). */
  readonly states?: boolean
}

/**
 * Bande degli elettroni quasi liberi lungo un cammino 1D (si usa la prima
 * componente dei punti del cammino). Con `fourier` tutti nulli è il reticolo vuoto.
 */
export function nearlyFreeBands(
  potential: PeriodicPotential1D,
  path: KPath,
  options: NearlyFreeBandsOptions
): BandStructure<CentralSolution1D> {
  if (path.dimension !== 1) throw new RangeError('nearlyFreeBands: serve un cammino 1D')
  const nBands = options.bands ?? options.planeWaves
  if (!Number.isInteger(nBands) || nBands < 1 || nBands > options.planeWaves) {
    throw new RangeError(`numero di bande non valido: ${nBands}`)
  }
  const wantStates = options.states ?? false
  const energies = Array.from({ length: nBands }, () => new Float64Array(path.points.length))
  const states: CentralSolution1D[] = []
  path.points.forEach((point, i) => {
    const solution = solveCentralEquation1D(potential, point[0], {
      planeWaves: options.planeWaves,
      coefficients: wantStates
    })
    for (let n = 0; n < nBands; n++) energies[n][i] = solution.energies[n]
    if (wantStates) states.push(solution)
  })
  const isEmpty = potential.fourier.every((v) => v === 0)
  return {
    method: isEmpty ? 'empty-lattice' : 'nearly-free',
    path,
    energies,
    ...(wantStates ? { states } : {})
  }
}

/** Coefficienti c_G della banda `band` nello stato `solution`, con gli indici n delle onde. */
export function blochCoefficients(
  solution: CentralSolution1D,
  band: number
): { readonly g: Int32Array; readonly re: Float64Array; readonly im: Float64Array | null } {
  if (!solution.coefficients) throw new Error('coefficienti non calcolati (opzione coefficients: false)')
  const v = eigenvector(solution.coefficients, band)
  return { g: solution.g, re: v.re, im: v.im }
}

function validatePotential(potential: PeriodicPotential1D): void {
  if (!(potential.a > 0)) throw new RangeError(`passo reticolare non valido: ${potential.a}`)
  for (const v of potential.fourier) {
    if (!Number.isFinite(v)) throw new RangeError(`coefficiente di Fourier non valido: ${v}`)
  }
  if (potential.mean !== undefined && !Number.isFinite(potential.mean)) {
    throw new RangeError(`media del potenziale non valida: ${potential.mean}`)
  }
}

/** Fissa la fase arbitraria di ogni autovettore: componente di modulo massimo reale positiva. */
function fixPhases(vectors: EigenVectors): void {
  const { n, count, re, im } = vectors
  for (let j = 0; j < count; j++) {
    let best = 0
    let bestAbs = -1
    for (let i = 0; i < n; i++) {
      const abs = Math.hypot(re[j * n + i], im ? im[j * n + i] : 0)
      if (abs > bestAbs * (1 + 1e-12)) {
        best = i
        bestAbs = abs
      }
    }
    if (bestAbs <= 0) continue
    // Moltiplica per e^{−iφ}, con φ la fase della componente scelta.
    const cr = re[j * n + best] / bestAbs
    const ci = im ? -im[j * n + best] / bestAbs : 0
    for (let i = 0; i < n; i++) {
      const xr = re[j * n + i]
      const xi = im ? im[j * n + i] : 0
      re[j * n + i] = xr * cr - xi * ci
      if (im) im[j * n + i] = xr * ci + xi * cr
    }
  }
}

/** Gap al primo ordine nella formula a due onde: ΔE = 2|V_G| (o 2|V_{2G}| in k = 0). */
export function twoWaveGap(fourierAmplitude: number): number {
  return 2 * Math.abs(fourierAmplitude)
}

/** Rapporto adimensionale |V_G| / E₀ che misura la forza del potenziale rispetto all'energia di bordo. */
export function weakPotentialRatio(vG: number, e0: number): number {
  return e0 > 0 ? Math.abs(vG) / e0 : Infinity
}

/** Massa efficace al bordo di zona (±π/a) nella formula a due onde: m₀/m*_± = 1 ± 2E₀/|V_G|. */
export function twoWaveEdgeMassRatio(vG: number, e0: number, branch: -1 | 1): number {
  const absV = Math.abs(vG)
  if (absV === 0) return branch === 1 ? 0 : -0
  const inv = 1 + branch * ((2 * e0) / absV)
  return Math.abs(inv) < 1e-12 ? Infinity : 1 / inv
}

export interface PlaneWaveWeight {
  /** Multiplo intero m di G = 2π/a nella componente e^{i(k+mG)x}. */
  readonly gMultiple: number
  /** Peso |c_{k+mG}|² normalizzato rispetto alla norma della soluzione. */
  readonly weight: number
}

/** Componenti in onde piane dominanti dello stato scelto, ordinate per peso |c_G|² decrescente. */
export function dominantPlaneWaves1D(
  solution: CentralSolution1D,
  band: number,
  limit = 3
): readonly PlaneWaveWeight[] {
  const c = blochCoefficients(solution, band)
  const items: PlaneWaveWeight[] = []
  for (let i = 0; i < solution.g.length; i++) {
    const im = c.im ? c.im[i] : 0
    items.push({
      gMultiple: solution.g[i],
      weight: c.re[i] * c.re[i] + im * im
    })
  }
  items.sort((a, b) => b.weight - a.weight || Math.abs(a.gMultiple) - Math.abs(b.gMultiple) || a.gMultiple - b.gMultiple)
  return items.slice(0, Math.max(0, limit))
}
