/**
 * Fisica della catena monatomica 1D e prima zona di Brillouin
 * (dispensa Parte 6: Lezione 1 §§1–5, Lezione 3 §13).
 *
 * Modulo TypeScript puro (zero React, zero DOM).
 * Convenzioni di unità:
 * - passo reticolare `a` in Å
 * - vettore d'onda `k` in Å⁻¹
 * - massa atomica `massAmu` in unità di massa atomica u (1 u = AMU_KG kg)
 * - costante elastica a primi vicini `springC` in N/m
 * - pulsazioni `omega` in rad·s⁻¹, velocità `v_s, v_g, v_p` in m·s⁻¹
 */
import {
  ANGSTROM_IN_M,
  RAD_S_TO_THZ,
  amuToKg,
  radSToMev,
  radSToThz
} from './constants'

export interface MonatomicParams {
  /** Passo reticolare a (Å), > 0. */
  readonly a: number
  /** Massa atomica M (u.m.a.), > 0. */
  readonly massAmu: number
  /** Costante elastica a primi vicini C (N/m), > 0. */
  readonly springC: number
}

export interface MonatomicSummary {
  /** √(C/M) in s⁻¹. */
  readonly sqrtCOverM: number
  /** Pulsazione massima ω_max = 2√(C/M) in rad·s⁻¹ (a k = ±π/a). */
  readonly omegaMaxRadS: number
  /** Frequenza massima ν_max = ω_max / (2π) in THz. */
  readonly freqMaxThz: number
  /** Energia fononica massima ħω_max in meV. */
  readonly energyMaxMev: number
  /** Velocità del suono v_s = a√(C/M) in m·s⁻¹. */
  readonly soundSpeedMs: number
  /** Bordo della prima zona di Brillouin π/a in Å⁻¹. */
  readonly zoneEdge: number
  /** Primo vettore del reticolo reciproco G = 2π/a in Å⁻¹. */
  readonly reciprocalG: number
}

export interface MonatomicCurve {
  /** Griglia di vettori d'onda k in Å⁻¹. */
  readonly k: Float64Array
  /** Pulsazione ω(k) in rad·s⁻¹. */
  readonly omegaRadS: Float64Array
  /** Frequenza ν(k) = ω(k)/(2π) in THz. */
  readonly freqThz: Float64Array
  /** Energia ħω(k) in meV. */
  readonly energyMev: Float64Array
}

export interface BvkMode1D {
  /** Intero j con −N/2 < j ≤ N/2. */
  readonly j: number
  /** Vettore d'onda k_j = 2πj/(Na) in Å⁻¹. */
  readonly k: number
  /** Frazione di bordo zona k_j / (π/a) = 2j/N ∈ (−1, 1]. */
  readonly kFrac: number
}

export interface BvkGrid1D {
  /** Numero di atomi/celle N nell'anello. */
  readonly nCells: number
  /** Passo Δk = 2π/(Na) in Å⁻¹. */
  readonly deltaK: number
  /** Esattamente N modi permessi nella prima zona −π/a < k ≤ π/a. */
  readonly modes: readonly BvkMode1D[]
}

export interface MonatomicDisplacementSample {
  /** Indice intero dell'atomo n. */
  readonly n: number
  /** Posizione di equilibrio x_n⁰ = n·a (Å). */
  readonly xEq: number
  /** Spostamento adimensionale u_n(t) / A = cos(k·n·a − φ) ∈ [−1, 1]. */
  readonly u: number
}

/** Valida i parametri positivi della catena monatomica. */
function assertMonatomicParams(params: MonatomicParams): void {
  if (!(params.a > 0) || !(params.massAmu > 0) || !(params.springC > 0)) {
    throw new RangeError('I parametri della catena monatomica (a, M, C) devono essere positivi.')
  }
}

/** Bordo della prima zona di Brillouin π/a (Å⁻¹). */
export function monatomicZoneEdge(a: number): number {
  if (!(a > 0)) throw new RangeError('Il passo reticolare a deve essere positivo.')
  return Math.PI / a
}

/** Primo vettore del reticolo reciproco G = 2π/a (Å⁻¹). */
export function monatomicReciprocalG(a: number): number {
  if (!(a > 0)) throw new RangeError('Il passo reticolare a deve essere positivo.')
  return (2 * Math.PI) / a
}

/** Pulsazione caratteristica √(C/M) in s⁻¹. */
export function monatomicSqrtCOverM(params: MonatomicParams): number {
  assertMonatomicParams(params)
  return Math.sqrt(params.springC / amuToKg(params.massAmu))
}

/**
 * Pulsazione massima ω_max = 2√(C/M) in rad·s⁻¹ al bordo di zona k = ±π/a
 * (dispensa Parte 6, Lezione 1 §3.3).
 */
export function monatomicOmegaMax(params: MonatomicParams): number {
  return 2 * monatomicSqrtCOverM(params)
}

/**
 * Velocità del suono nel limite di grande lunghezza d'onda (k → 0):
 * v_s = a√(C/M) in m·s⁻¹ (dispensa Parte 6, Lezione 1 eq. 9).
 */
export function monatomicSoundSpeed(params: MonatomicParams): number {
  const w0 = monatomicSqrtCOverM(params)
  return params.a * ANGSTROM_IN_M * w0
}

/** Riepilogo completo delle scale caratteristiche della catena monatomica. */
export function monatomicSummary(params: MonatomicParams): MonatomicSummary {
  const sqrtCOverM = monatomicSqrtCOverM(params)
  const omegaMaxRadS = 2 * sqrtCOverM
  return {
    sqrtCOverM,
    omegaMaxRadS,
    freqMaxThz: radSToThz(omegaMaxRadS),
    energyMaxMev: radSToMev(omegaMaxRadS),
    soundSpeedMs: params.a * ANGSTROM_IN_M * sqrtCOverM,
    zoneEdge: Math.PI / params.a,
    reciprocalG: (2 * Math.PI) / params.a
  }
}

/**
 * Relazione di dispersione della catena monatomica (dispensa Parte 6, eq. 8):
 * ω(k) = 2√(C/M) |sin(ka/2)| in rad·s⁻¹.
 * Funzione pari in k e periodica di periodo G = 2π/a.
 */
export function monatomicOmega(k: number, params: MonatomicParams): number {
  const omegaMax = monatomicOmegaMax(params)
  return omegaMax * Math.abs(Math.sin(0.5 * k * params.a))
}

/**
 * Velocità di gruppo v_g(k) = dω/dk in m·s⁻¹ (dispensa Parte 6, Lezione 1 §3.3 e §16):
 * nella 1BZ: v_g(k) = a√(C/M) cos(ka/2) sgn(k);
 * periodicamente su tutto ℝ: v_g(k) = v_s cos(ka/2) sgn(sin(ka/2)).
 * Al bordo di zona k = ±π/a vale esattamente 0 (onda stazionaria).
 * Nell'origine k = 0 (punto angoloso di |sin|) restituisce 0 per disparità;
 * i limiti destro/sinistro valgono ±v_s.
 */
export function monatomicGroupVelocity(k: number, params: MonatomicParams): number {
  const vs = monatomicSoundSpeed(params)
  const halfKa = 0.5 * k * params.a
  const s = Math.sin(halfKa)
  if (Math.abs(s) < 1e-14) return 0
  const c = Math.cos(halfKa)
  if (Math.abs(c) < 1e-14) return 0
  return vs * c * Math.sign(s)
}

/**
 * Velocità di fase v_p(k) = ω(k)/k in m·s⁻¹ (dispensa Parte 6, §3.2 e §6.1).
 * Ha lo stesso segno di k (per k > 0 l'onda e^{i(kx−ωt)} avanza verso destra).
 * Per k → 0± tende a ±v_s; al bordo di zona k = ±π/a vale ±(2/π)v_s ≠ 0.
 * In k = 0 esatto restituisce 0 (traslazione rigida).
 */
export function monatomicPhaseVelocity(k: number, params: MonatomicParams): number {
  assertMonatomicParams(params)
  if (Math.abs(k) < 1e-14) return 0
  const omega = monatomicOmega(k, params)
  const kM = k / ANGSTROM_IN_M
  return omega / kM
}

/**
 * Converte una velocità in m·s⁻¹ nella pendenza equivalente dν/dk in THz·Å
 * usata sul diagramma ν(k) con ν in THz e k in Å⁻¹.
 */
export function velocityMsToThzAngstrom(velocityMs: number): number {
  return (velocityMs / ANGSTROM_IN_M) * RAD_S_TO_THZ
}

/**
 * Converte una velocità in m·s⁻¹ nella pendenza equivalente d(ħω)/dk in meV·Å.
 */
export function velocityMsToMevAngstrom(velocityMs: number): number {
  return radSToMev(velocityMs / ANGSTROM_IN_M)
}

/**
 * Campiona la curva di dispersione ω(k) (rad·s⁻¹, THz, meV) su [kMin, kMax].
 */
export function monatomicDispersionCurve(
  params: MonatomicParams,
  kMin: number,
  kMax: number,
  nPoints: number
): MonatomicCurve {
  assertMonatomicParams(params)
  const n = Math.max(2, Math.round(nPoints))
  const omegaMax = monatomicOmegaMax(params)
  const kArr = new Float64Array(n)
  const omegaRadS = new Float64Array(n)
  const freqThz = new Float64Array(n)
  const energyMev = new Float64Array(n)
  const step = (kMax - kMin) / (n - 1)

  for (let i = 0; i < n; i++) {
    const kv = kMin + i * step
    const w = omegaMax * Math.abs(Math.sin(0.5 * kv * params.a))
    kArr[i] = kv
    omegaRadS[i] = w
    freqThz[i] = radSToThz(w)
    energyMev[i] = radSToMev(w)
  }

  return { k: kArr, omegaRadS, freqThz, energyMev }
}

/**
 * Vettore d'onda equivalente per traslazione di un vettore del reticolo reciproco
 * k' = k + m·G con G = 2π/a (dispensa Parte 6, Lezione 1 §4.1).
 */
export function monatomicAliasK(k: number, a: number, m = 1): number {
  return k + m * monatomicReciprocalG(a)
}

/**
 * Sceglie lo spostamento ±1·G che porta k ∈ [−π/a, π/a] nella replica adiacente
 * dentro [−2π/a, 2π/a]:
 * - k > 0  → m = −1 (k' = k − G ∈ [−2π/a, −π/a])
 * - k ≤ 0  → m = +1 (k' = k + G ∈ [π/a, 2π/a])
 */
export function monatomicAdjacentAlias(k: number, a: number): { readonly kAlias: number; readonly m: -1 | 1 } {
  const m: -1 | 1 = k > 0 ? -1 : 1
  return { kAlias: monatomicAliasK(k, a, m), m }
}

/**
 * Riporta un vettore d'onda qualunque nella prima zona di Brillouin (−π/a, π/a].
 */
export function foldToFirstBZ(k: number, a: number): number {
  const g = monatomicReciprocalG(a)
  const half = 0.5 * g
  let r = ((k + half) % g + g) % g - half
  // convenzione della dispensa: −π/a < k ≤ π/a
  if (Math.abs(r + half) < 1e-12) r = half
  return r
}

/**
 * Costante di decadimento evanescente κ (Å⁻¹) per una forzante a ω > ω_max
 * (dispensa Parte 6, Lezione 1 §3.4):
 * k = π/a + iκ  ⇒  cos(ka) = −cosh(κa) = 1 − Mω²/(2C)
 *               ⇒  cosh(κa) = 2(ω/ω_max)² − 1.
 * Restituisce 0 per ω ≤ ω_max (modo propagante).
 */
export function monatomicEvDecayKappa(omegaRadS: number, params: MonatomicParams): number {
  const omegaMax = monatomicOmegaMax(params)
  if (omegaRadS <= omegaMax) return 0
  const ratio = omegaRadS / omegaMax
  // Identità esatta acosh(2r² − 1) = 2·asinh(√(r² − 1)), stabile vicino alla soglia r → 1⁺
  return (2 * Math.asinh(Math.sqrt((ratio - 1) * (ratio + 1)))) / params.a
}

/**
 * Spostamento adimensionale continuo u(x, t) / A = cos(kx − φ) di un'onda piana.
 * Sugli atomi x_n⁰ = n·a coincide identicamente per k e k + mG.
 */
export function monatomicWaveProfile(x: number, k: number, phaseRad: number): number {
  return Math.cos(k * x - phaseRad)
}

/**
 * Spostamenti longitudinali adimensionali u_n(t) / A = cos(k·n·a − φ) per una
 * finestra di `count` atomi centrata in n = 0 (o a partire da `nStart`).
 */
export function monatomicDisplacements(
  a: number,
  k: number,
  phaseRad: number,
  count: number,
  nStart?: number
): readonly MonatomicDisplacementSample[] {
  if (!(a > 0)) throw new RangeError('Il passo reticolare a deve essere positivo.')
  const n0 = nStart ?? -Math.floor((count - 1) / 2)
  const out: MonatomicDisplacementSample[] = []
  for (let i = 0; i < count; i++) {
    const n = n0 + i
    const xEq = n * a
    out.push({ n, xEq, u: Math.cos(k * xEq - phaseRad) })
  }
  return out
}

/**
 * Valori permessi di k con condizioni periodiche di Born–von Kármán u_{n+N} = u_n
 * nella prima zona di Brillouin −π/a < k ≤ π/a (dispensa Parte 6, Lezione 3 §13.3, eq. 32):
 * k_j = (2π / (Na)) · j, con −N/2 < j ≤ N/2 (esattamente N valori).
 */
export function bvkAllowedK1D(a: number, nCells: number): BvkGrid1D {
  if (!(a > 0)) throw new RangeError('Il passo reticolare a deve essere positivo.')
  const N = Math.max(1, Math.round(nCells))
  const deltaK = (2 * Math.PI) / (N * a)
  const jMin = -Math.floor((N - 1) / 2)
  const jMax = Math.floor(N / 2)
  const modes: BvkMode1D[] = []
  for (let j = jMin; j <= jMax; j++) {
    const jj = j === 0 ? 0 : j
    modes.push({
      j: jj,
      k: deltaK * jj,
      kFrac: (2 * jj) / N
    })
  }
  return { nCells: N, deltaK, modes }
}

/**
 * Restituisce il modo Born–von Kármán in 1BZ più vicino al valore k dato.
 */
export function bvkSnapToAllowedK(k: number, a: number, nCells: number): BvkMode1D {
  const grid = bvkAllowedK1D(a, nCells)
  let best = grid.modes[0]
  let bestDist = Math.abs(k - best.k)
  for (let i = 1; i < grid.modes.length; i++) {
    const d = Math.abs(k - grid.modes[i].k)
    if (d < bestDist) {
      bestDist = d
      best = grid.modes[i]
    }
  }
  return best
}
