/**
 * Fisica delle catene 1D monatomica e biatomica, prima zona di Brillouin,
 * matrice dinamica 2×2 e incrocio con la luce infrarossa
 * (dispensa Parte 6: Lezione 1 §§1–5, Lezione 2 §§7–8 e §10.3, Lezione 3 §13, Lezione 4 §24).
 *
 * Modulo TypeScript puro (zero React, zero DOM).
 * Convenzioni di unità:
 * - passo reticolare `a` in Å (nella biatomica: distanza primi vicini a/2, passo Bravais a)
 * - vettore d'onda `k` in Å⁻¹
 * - masse atomiche `massAmu`, `massHeavyAmu`, `massLightAmu` in unità di massa atomica u (1 u = AMU_KG kg)
 * - costante elastica a primi vicini `springC` in N/m
 * - pulsazioni `omega` in rad·s⁻¹, velocità `v_s, v_g, v_p` in m·s⁻¹
 */
import {
  ANGSTROM_IN_M,
  C_LIGHT_M_S,
  HBAR2_OVER_2M0,
  HBAR_EV_S,
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

// ---------------------------------------------------------------------------
// Catena biatomica 1D, gap fononico, matrice dinamica 2×2 e luce infrarossa
// (dispensa Parte 6: Lezione 2 §§7–8 e §10.3; Lezione 4 §24)
// ---------------------------------------------------------------------------

export type DiatomicBranch = 'acoustic' | 'optical'

export interface DiatomicParams {
  /** Passo del reticolo di Bravais a (Å), > 0 (distanza primi vicini = a/2). */
  readonly a: number
  /** Massa dell'atomo sui siti pari n, M (u.m.a.), > 0. */
  readonly massHeavyAmu: number
  /** Massa dell'atomo sui siti dispari n−1, m (u.m.a.), > 0. */
  readonly massLightAmu: number
  /** Costante elastica a primi vicini C (N/m), > 0. */
  readonly springC: number
}

export interface DiatomicSummary {
  /** Velocità del suono acustica v_s = a√(C / 2(m+M)) in m·s⁻¹ (eq. 21). */
  readonly soundSpeedMs: number
  /** Pulsazione massima ramo acustico (punto C, k = ±π/a): √(2C / max(M, m)) in rad·s⁻¹. */
  readonly omegaAcousticMaxRadS: number
  /** Frequenza massima ramo acustico ν_max^ac in THz. */
  readonly freqAcousticMaxThz: number
  /** Energia massima ramo acustico ħω_max^ac in meV. */
  readonly energyAcousticMaxMev: number
  /** Pulsazione minima ramo ottico (punto B, k = ±π/a): √(2C / min(M, m)) in rad·s⁻¹. */
  readonly omegaOpticalMinRadS: number
  /** Frequenza minima ramo ottico ν_min^ott in THz. */
  readonly freqOpticalMinThz: number
  /** Energia minima ramo ottico ħω_min^ott in meV. */
  readonly energyOpticalMinMev: number
  /** Pulsazione massima ramo ottico in k = 0: ω_+(0) = √(2C(m+M)/(mM)) in rad·s⁻¹ (eq. 22). */
  readonly omegaOpticalZeroRadS: number
  /** Frequenza ottica in k = 0: ν_+(0) in THz. */
  readonly freqOpticalZeroThz: number
  /** Energia ottica in k = 0: ħω_+(0) in meV. */
  readonly energyOpticalZeroMev: number
  /** Ampiezza del gap fononico Δω_gap = ω_min^ott − ω_max^ac ≥ 0 in rad·s⁻¹ (eq. 23). */
  readonly omegaGapRadS: number
  /** Ampiezza del gap in frequenza Δν_gap in THz. */
  readonly freqGapThz: number
  /** Ampiezza del gap in energia ħΔω_gap in meV. */
  readonly energyGapMev: number
  /** Bordo della prima zona di Brillouin π/a in Å⁻¹. */
  readonly zoneEdge: number
  /** Primo vettore del reticolo reciproco G = 2π/a in Å⁻¹. */
  readonly reciprocalG: number
  /** Rapporto delle masse M/m. */
  readonly massRatio: number
  /** Vero se M = m (gap chiuso, ripiegamento della catena monatomica di passo a/2). */
  readonly equalMasses: boolean
  /** Vero se m > M (ruoli invertiti rispetto alla convenzione standard M > m). */
  readonly invertedMasses: boolean
}

export interface DiatomicCurve {
  /** Griglia di vettori d'onda k in Å⁻¹. */
  readonly k: Float64Array
  /** Pulsazione del ramo acustico ω₋(k) in rad·s⁻¹. */
  readonly acousticOmegaRadS: Float64Array
  /** Pulsazione del ramo ottico ω₊(k) in rad·s⁻¹. */
  readonly opticalOmegaRadS: Float64Array
  /** Frequenza del ramo acustico ν₋(k) in THz. */
  readonly acousticFreqThz: Float64Array
  /** Frequenza del ramo ottico ν₊(k) in THz. */
  readonly opticalFreqThz: Float64Array
  /** Energia del ramo acustico ħω₋(k) in meV. */
  readonly acousticEnergyMev: Float64Array
  /** Energia del ramo ottico ħω₊(k) in meV. */
  readonly opticalEnergyMev: Float64Array
}

export interface DiatomicModeAmplitude {
  /**
   * Rapporto α = u_{n−1}/u_n (ampiezza di m rispetto a M nella scelta di fase x_n⁰ = na/2,
   * eqq. 15–18). Vale null quando 1/α = 0 (atomo M fermo, oscilla solo m).
   */
  readonly alpha: number | null
  /** Rapporto inverso 1/α = u_n/u_{n−1}; vale 0 quando M è fermo e null quando m è fermo. */
  readonly invAlpha: number | null
  /** Ampiezza normalizzata dell'atomo M (siti pari), con max(|ampM|, |ampm|) = 1. */
  readonly ampM: number
  /** Ampiezza normalizzata dell'atomo m (siti dispari), con max(|ampM|, |ampm|) = 1. */
  readonly ampm: number
  /** Vero se l'atomo M è fermo (u_n = 0). */
  readonly heavyStationary: boolean
  /** Vero se l'atomo m è fermo (u_{n−1} = 0). */
  readonly lightStationary: boolean
  /**
   * Ampiezza normalizzata adimensionale |R_cm| / u_max del centro di massa della cella
   * (|M·ampM + m·ampm·e^{−ika/2}| / (M + m)): vale esattamente 0 nel modo ottico a k = 0
   * (slide 43), 1 nel modo acustico a k = 0 e tiene conto dello sfasamento ka/2 per k ≠ 0.
   */
  readonly cmAmp: number
}

export interface DiatomicDisplacementSample {
  /** Indice intero del sito n (pari: massa M; dispari: massa m). */
  readonly n: number
  /** Tipo di atomo sul sito: 'M' per n pari, 'm' per n dispari. */
  readonly species: 'M' | 'm'
  /** Posizione di equilibrio x_n⁰ = n·(a/2) in Å (Fig. 10). */
  readonly xEq: number
  /** Spostamento longitudinale adimensionale u_n(t) ∈ [−1, 1]. */
  readonly u: number
}

export interface DiatomicDynamicalMatrix2x2 {
  /** Elemento D₁₁ = 2C/M in s⁻² (§10.3, p. 27). */
  readonly d11: number
  /** Elemento fuori diagonale D₁₂ = D₂₁ = −(2C/√(Mm))·cos(ka/2) in s⁻². */
  readonly d12: number
  /** Elemento D₂₂ = 2C/m in s⁻². */
  readonly d22: number
  /** Traccia D₁₁ + D₂₂ = ω₋² + ω₊² in s⁻². */
  readonly trace: number
  /** Determinante D₁₁D₂₂ − D₁₂² = ω₋²ω₊² in s⁻⁴. */
  readonly det: number
  /** Autovalori ω₋² (acustico) e ω₊² (ottico) ottenuti per diagonalizzazione diretta 2×2 (s⁻²). */
  readonly eigenvalues: readonly [number, number]
  /** Pulsazioni ω₋ e ω₊ in rad·s⁻¹ dalla diagonalizzazione diretta 2×2. */
  readonly omegasRadS: readonly [number, number]
  /** Autovettori ortonormali ε⁻ = (ε_M, ε_m) ed ε⁺ = (ε_M, ε_m) di D(k) (eq. 26–28). */
  readonly eigenvectors: readonly [readonly [number, number], readonly [number, number]]
}

export interface DiatomicInfraredCrossing {
  /** Indice di rifrazione del dielettrico n (default 1 nel vuoto/aria come esempio §24 p. 60). */
  readonly refractiveIndex: number
  /** Pulsazione all'incrocio ω_IR ≈ ω_+(0) in rad·s⁻¹. */
  readonly omegaRadS: number
  /** Frequenza all'incrocio ν_IR = ω_IR/(2π) in THz. */
  readonly freqThz: number
  /** Energia del fotone assorbito ħω_IR in meV. */
  readonly energyMev: number
  /** Lunghezza d'onda nel vuoto λ = 2πc/ω_IR in µm (§24, p. 60: ≈ 64 µm per Na–Cl). */
  readonly wavelengthUm: number
  /** Vettore d'onda della luce k_luce = n·ω_IR/c in m⁻¹. */
  readonly kLightMInv: number
  /** Vettore d'onda della luce k_luce in Å⁻¹. */
  readonly kLightAngInv: number
  /** Rapporto k_luce / (π/a) ≈ 2·10⁻⁵ per Na–Cl (§24, p. 60). */
  readonly kOverZoneEdge: number
  /** Rapporto tra velocità della luce nel mezzo (c/n) e velocità del suono v_s (~10⁵). */
  readonly speedRatio: number
}

/** Valida i parametri positivi della catena biatomica. */
function assertDiatomicParams(params: DiatomicParams): void {
  if (
    !(params.a > 0) ||
    !Number.isFinite(params.a) ||
    !(params.massHeavyAmu > 0) ||
    !Number.isFinite(params.massHeavyAmu) ||
    !(params.massLightAmu > 0) ||
    !Number.isFinite(params.massLightAmu) ||
    !(params.springC > 0) ||
    !Number.isFinite(params.springC)
  ) {
    throw new RangeError('I parametri della catena biatomica (a, M, m, C) devono essere finiti e positivi.')
  }
}

/** Calcola S = (m+M)/(mM), √D ≥ 0 e le pulsazioni quadre ω₋², ω₊² senza cancellazione numerica. */
function diatomicOmegaSquaredPair(
  k: number,
  params: DiatomicParams
): {
  readonly wMinusSq: number
  readonly wPlusSq: number
  readonly S: number
  readonly sqrtD: number
  readonly mHeavyKg: number
  readonly mLightKg: number
} {
  assertDiatomicParams(params)
  const mHeavyKg = amuToKg(params.massHeavyAmu)
  const mLightKg = amuToKg(params.massLightAmu)
  const invM = 1 / mHeavyKg
  const invm = 1 / mLightKg
  const S = invM + invm
  const diff = invm - invM
  const halfKa = 0.5 * k * params.a
  const cosHalf = Math.cos(halfKa)
  const sinHalf = Math.sin(halfKa)
  // Identità esatta: S² − 4·sin²(ka/2)/(mM) = (1/m − 1/M)² + 4·cos²(ka/2)/(mM) ≥ 0
  const sqrtD = Math.sqrt(diff * diff + 4 * invM * invm * cosHalf * cosHalf)
  const wPlusSq = params.springC * (S + sqrtD)
  // Forma coniugata esatta per ω₋²: azzera la cancellazione numerica per k → 0
  const wMinusSq = wPlusSq > 0 ? (4 * params.springC * invM * invm * sinHalf * sinHalf) / (S + sqrtD) : 0
  return { wMinusSq, wPlusSq, S, sqrtD, mHeavyKg, mLightKg }
}

/**
 * Velocità del suono della catena biatomica per k → 0 (dispensa Parte 6, eq. 21):
 * v_s = a√(C / (2(m + M))) in m·s⁻¹.
 */
export function diatomicSoundSpeed(params: DiatomicParams): number {
  assertDiatomicParams(params)
  const totalMassKg = amuToKg(params.massHeavyAmu + params.massLightAmu)
  return params.a * ANGSTROM_IN_M * Math.sqrt(params.springC / (2 * totalMassKg))
}

/**
 * Riepilogo completo delle scale caratteristiche della catena biatomica
 * (dispensa Parte 6, Lezione 2 §§7–8, eqq. 21–23).
 * Gestisce in modo continuo sia M = m (gap nullo) sia m > M (ruoli invertiti ai bordi B/C).
 */
export function diatomicSummary(params: DiatomicParams): DiatomicSummary {
  assertDiatomicParams(params)
  const mHeavyKg = amuToKg(params.massHeavyAmu)
  const mLightKg = amuToKg(params.massLightAmu)
  const mMaxKg = Math.max(mHeavyKg, mLightKg)
  const mMinKg = Math.min(mHeavyKg, mLightKg)

  const soundSpeedMs = params.a * ANGSTROM_IN_M * Math.sqrt(params.springC / (2 * (mHeavyKg + mLightKg)))
  const omegaAcousticMaxRadS = Math.sqrt((2 * params.springC) / mMaxKg)
  const omegaOpticalMinRadS = Math.sqrt((2 * params.springC) / mMinKg)
  const omegaOpticalZeroRadS = Math.sqrt((2 * params.springC * (mHeavyKg + mLightKg)) / (mHeavyKg * mLightKg))
  const omegaGapRadS = Math.max(0, omegaOpticalMinRadS - omegaAcousticMaxRadS)
  const equalMasses = Math.abs(mHeavyKg - mLightKg) / mMaxKg < 1e-12

  return {
    soundSpeedMs,
    omegaAcousticMaxRadS,
    freqAcousticMaxThz: radSToThz(omegaAcousticMaxRadS),
    energyAcousticMaxMev: radSToMev(omegaAcousticMaxRadS),
    omegaOpticalMinRadS,
    freqOpticalMinThz: radSToThz(omegaOpticalMinRadS),
    energyOpticalMinMev: radSToMev(omegaOpticalMinRadS),
    omegaOpticalZeroRadS,
    freqOpticalZeroThz: radSToThz(omegaOpticalZeroRadS),
    energyOpticalZeroMev: radSToMev(omegaOpticalZeroRadS),
    omegaGapRadS,
    freqGapThz: radSToThz(omegaGapRadS),
    energyGapMev: radSToMev(omegaGapRadS),
    zoneEdge: Math.PI / params.a,
    reciprocalG: (2 * Math.PI) / params.a,
    massRatio: params.massHeavyAmu / params.massLightAmu,
    equalMasses,
    invertedMasses: !equalMasses && params.massLightAmu > params.massHeavyAmu
  }
}

/**
 * Relazione di dispersione della catena biatomica ω₋(k) e ω₊(k) in rad·s⁻¹
 * (dispensa Parte 6, Lezione 2 eq. 20).
 */
export function diatomicOmega(
  k: number,
  branch: DiatomicBranch,
  params: DiatomicParams
): number {
  const pair = diatomicOmegaSquaredPair(k, params)
  return Math.sqrt(branch === 'acoustic' ? pair.wMinusSq : pair.wPlusSq)
}

/**
 * Campiona entrambi i rami ω₋(k) e ω₊(k) (rad·s⁻¹, THz, meV) su [kMin, kMax].
 */
export function diatomicDispersionCurve(
  params: DiatomicParams,
  kMin: number,
  kMax: number,
  nPoints: number
): DiatomicCurve {
  assertDiatomicParams(params)
  const n = Math.max(2, Math.round(nPoints))
  const kArr = new Float64Array(n)
  const acousticOmegaRadS = new Float64Array(n)
  const opticalOmegaRadS = new Float64Array(n)
  const acousticFreqThz = new Float64Array(n)
  const opticalFreqThz = new Float64Array(n)
  const acousticEnergyMev = new Float64Array(n)
  const opticalEnergyMev = new Float64Array(n)
  const step = (kMax - kMin) / (n - 1)

  for (let i = 0; i < n; i++) {
    const kv = kMin + i * step
    const pair = diatomicOmegaSquaredPair(kv, params)
    const wAc = Math.sqrt(pair.wMinusSq)
    const wOp = Math.sqrt(pair.wPlusSq)
    kArr[i] = kv
    acousticOmegaRadS[i] = wAc
    opticalOmegaRadS[i] = wOp
    acousticFreqThz[i] = radSToThz(wAc)
    opticalFreqThz[i] = radSToThz(wOp)
    acousticEnergyMev[i] = radSToMev(wAc)
    opticalEnergyMev[i] = radSToMev(wOp)
  }

  return {
    k: kArr,
    acousticOmegaRadS,
    opticalOmegaRadS,
    acousticFreqThz,
    opticalFreqThz,
    acousticEnergyMev,
    opticalEnergyMev
  }
}

/**
 * Velocità di gruppo v_g(k) = dω_∓/dk in m·s⁻¹ sulla catena biatomica
 * (dispensa Parte 6, Lezione 2 §6.2 e §8.1).
 * - Sul ramo ottico per 0 < k < π/a è negativa (pendenza negativa, §8.1 p. 21).
 * - A k = 0 sul ramo ottico vale esattamente 0 (massimo liscio).
 * - A k = ±π/a con M ≠ m vale esattamente 0 su entrambi i rami (onda stazionaria).
 * - Nei punti angolosi (k = 0 sul ramo acustico, oppure k = ±π/a con M = m) restituisce 0
 *   per convenzione di disparità (la UI non deve stamparlo come «0,00 km/s» ma mostrare i limiti).
 */
export function diatomicGroupVelocity(
  k: number,
  branch: DiatomicBranch,
  params: DiatomicParams
): number {
  const pair = diatomicOmegaSquaredPair(k, params)
  const wSq = branch === 'acoustic' ? pair.wMinusSq : pair.wPlusSq
  const w = Math.sqrt(wSq)
  if (w < 1e-14 * Math.sqrt(pair.wPlusSq + 1)) return 0
  if (pair.sqrtD < 1e-14 * pair.S) return 0

  const sinKa = Math.sin(k * params.a)
  if (Math.abs(sinKa) < 1e-14) return 0

  const aM = params.a * ANGSTROM_IN_M
  const dOmegaSqDk = (params.springC * aM * sinKa) / (pair.mHeavyKg * pair.mLightKg * pair.sqrtD)
  const signed = branch === 'acoustic' ? dOmegaSqDk : -dOmegaSqDk
  return signed / (2 * w)
}

/**
 * Velocità di fase v_p(k) = ω_∓(k)/k in m·s⁻¹ sulla catena biatomica.
 * Restituisce `null` in k = 0 (forma 0/0 sul ramo acustico con limiti ±v_s; divergenza ±∞ sul ramo ottico).
 */
export function diatomicPhaseVelocity(
  k: number,
  branch: DiatomicBranch,
  params: DiatomicParams
): number | null {
  assertDiatomicParams(params)
  if (Math.abs(k) < 1e-12) return null
  const w = diatomicOmega(k, branch, params)
  return w / (k / ANGSTROM_IN_M)
}

/**
 * Rapporto di ampiezza α = u_{n−1}/u_n (eqq. 17–18, dispensa Parte 6 §7.3–§8.2)
 * e ampiezze normalizzate (ampM, ampm) con max(|ampM|, |ampm|) = 1.
 * Stabile su tutta la 1BZ, inclusi k = 0, k = ±π/a (punti C e B), M = m e m > M.
 */
export function diatomicModeAmplitude(
  k: number,
  branch: DiatomicBranch,
  params: DiatomicParams
): DiatomicModeAmplitude {
  const pair = diatomicOmegaSquaredPair(k, params)
  const wSq = branch === 'acoustic' ? pair.wMinusSq : pair.wPlusSq
  const cosHalf = Math.cos(0.5 * k * params.a)
  const twoC = 2 * params.springC
  const dM = twoC - wSq * pair.mHeavyKg
  const dm = twoC - wSq * pair.mLightKg
  const coupling = twoC * cosHalf

  // Sistema omogeneo: [dM, −coupling; −coupling, dm] · [u_M; u_m] = 0
  // Riga 1 ⇒ (coupling, dM); Riga 2 ⇒ (dm, coupling). Si sceglie la riga con norma maggiore.
  const n1Sq = coupling * coupling + dM * dM
  const n2Sq = dm * dm + coupling * coupling
  const scaleTol = (1e-12 * twoC) ** 2

  let uM: number
  let um: number
  if (Math.max(n1Sq, n2Sq) < scaleTol) {
    // Punto degenere M = m e cos(ka/2) = 0 (bordo zona chiuso): limite continuo da 1BZ interna
    uM = 1
    um = branch === 'acoustic' ? 1 : -1
  } else if (n1Sq >= n2Sq) {
    uM = coupling
    um = dM
  } else {
    uM = dm
    um = coupling
  }

  // Convenzione di segno coerente: ampM ≥ 0 (o ampm > 0 se ampM = 0)
  if (uM < -1e-14 * Math.abs(um) || (Math.abs(uM) <= 1e-14 * Math.abs(um) && um < 0)) {
    uM = -uM
    um = -um
  }

  const maxAbs = Math.max(Math.abs(uM), Math.abs(um))
  let ampM = maxAbs > 0 ? uM / maxAbs : 1
  let ampm = maxAbs > 0 ? um / maxAbs : 0

  const heavyStationary = Math.abs(ampM) < 1e-11
  const lightStationary = Math.abs(ampm) < 1e-11
  if (heavyStationary) {
    ampM = 0
    ampm = ampm >= 0 ? 1 : -1
  } else if (lightStationary) {
    ampm = 0
    ampM = 1
  }

  const alpha = heavyStationary ? null : lightStationary ? 0 : ampm / ampM
  const invAlpha = lightStationary ? null : heavyStationary ? 0 : ampM / ampm
  // Ampiezza esatta del centro di massa della cella |M·ampM + m·ampm·e^{−ika/2}| / (M + m):
  // a k = 0 si riduce a |M·ampM + m·ampm|/(M+m) (= 0 esattamente sul modo ottico k = 0)
  const reCm = params.massHeavyAmu * ampM + params.massLightAmu * ampm * cosHalf
  const imCm = -params.massLightAmu * ampm * Math.sin(0.5 * k * params.a)
  const rawCm = Math.hypot(reCm, imCm) / (params.massHeavyAmu + params.massLightAmu)
  const cmAmp = rawCm < 1e-12 ? 0 : rawCm

  return {
    alpha,
    invAlpha,
    ampM,
    ampm,
    heavyStationary,
    lightStationary,
    cmAmp
  }
}

/**
 * Spostamenti longitudinali adimensionali u_n(t) della catena biatomica (eqq. 15–16):
 * - n pari (massa M): x_n⁰ = n·(a/2), u_n(t) = ampM · cos(k·x_n⁰ − φ)
 * - n dispari (massa m): x_n⁰ = n·(a/2), u_n(t) = ampm · cos(k·x_n⁰ − φ)
 * Quando al bordo di zona oscilla solo la specie dispari (punto B con M > m, o C con m > M),
 * si sceglie un offset di fase temporale di π/2 (cfr. Fig. 12 della dispensa) così che a φ = 0
 * (e con `prefers-reduced-motion`) lo spostamento dell'onda stazionaria sia massimo.
 */
export function diatomicDisplacements(
  params: DiatomicParams,
  k: number,
  branch: DiatomicBranch,
  phaseRad: number,
  nCells: number
): readonly DiatomicDisplacementSample[] {
  assertDiatomicParams(params)
  const cells = Math.max(1, Math.round(nCells))
  const totalAtoms = 2 * cells
  const mode = diatomicModeAmplitude(k, branch, params)
  // Indici n centrati attorno a 0, partendo da un indice pari (atomo M)
  const nStart = -2 * Math.floor(cells / 2)
  const halfA = 0.5 * params.a
  const phiOffset = mode.heavyStationary ? Math.PI / 2 : 0
  const effPhase = phaseRad + phiOffset

  const out: DiatomicDisplacementSample[] = []
  for (let i = 0; i < totalAtoms; i++) {
    const n = nStart + i
    const isEven = ((n % 2) + 2) % 2 === 0
    const species: 'M' | 'm' = isEven ? 'M' : 'm'
    const amp = isEven ? mode.ampM : mode.ampm
    const xEq = n * halfA
    const rawU = amp * Math.cos(k * xEq - effPhase)
    const u = Math.abs(rawU) < 1e-14 ? 0 : rawU
    out.push({ n, species, xEq, u })
  }
  return out
}

/**
 * Matrice dinamica 2×2 della catena biatomica (dispensa Parte 6, Lezione 2 §10.3, p. 27)
 * con diagonalizzazione diretta simmetrica 2×2 (indipendente dall'eq. 20).
 *
 * D(k) = [[2C/M, −(2C/√(Mm))·cos(ka/2)], [−(2C/√(Mm))·cos(ka/2), 2C/m]].
 */
export function diatomicDynamicalMatrix(
  k: number,
  params: DiatomicParams
): DiatomicDynamicalMatrix2x2 {
  assertDiatomicParams(params)
  const mHeavyKg = amuToKg(params.massHeavyAmu)
  const mLightKg = amuToKg(params.massLightAmu)
  const halfKa = 0.5 * k * params.a
  const cosHalf = Math.cos(halfKa)
  const sinHalf = Math.sin(halfKa)

  const d11 = (2 * params.springC) / mHeavyKg
  const d22 = (2 * params.springC) / mLightKg
  const d12 = (-2 * params.springC * cosHalf) / Math.sqrt(mHeavyKg * mLightKg)

  const trace = d11 + d22
  const halfDiff = 0.5 * (d11 - d22)
  const rad = Math.hypot(halfDiff, d12)
  // Identità esatta det(D) = D₁₁D₂₂ − D₁₂² = D₁₁D₂₂·sin²(ka/2): elimina ogni cancellazione per k → 0
  const det = d11 * d22 * sinHalf * sinHalf

  const eigHigh = 0.5 * trace + rad
  const eigLow = eigHigh > 0 ? Math.max(0, det / eigHigh) : 0

  // Rotazione di Jacobi esatta per matrice reale simmetrica 2×2
  let theta: number
  if (Math.abs(d12) < 1e-15 * Math.max(d11, d22) && Math.abs(d11 - d22) < 1e-15 * Math.max(d11, d22)) {
    // Degenerazione esatta (M = m, cos(ka/2) = 0): base simmetrica/antisimmetrica continua da 1BZ
    theta = Math.PI / 4
  } else {
    theta = 0.5 * Math.atan2(2 * d12, d11 - d22)
  }

  const v1: [number, number] = [Math.cos(theta), Math.sin(theta)]
  const v2: [number, number] = [-Math.sin(theta), Math.cos(theta)]
  const rayleigh = (v: readonly [number, number]): number =>
    d11 * v[0] * v[0] + 2 * d12 * v[0] * v[1] + d22 * v[1] * v[1]

  const orient = (v: readonly [number, number]): readonly [number, number] =>
    v[0] < -1e-14 || (Math.abs(v[0]) <= 1e-14 && v[1] < 0) ? [-v[0], -v[1]] : [v[0], v[1]]

  const [eAcoustic, eOptical] =
    rayleigh(v1) <= rayleigh(v2) ? [orient(v1), orient(v2)] : [orient(v2), orient(v1)]

  return {
    d11,
    d12,
    d22,
    trace,
    det,
    eigenvalues: [eigLow, eigHigh],
    omegasRadS: [Math.sqrt(eigLow), Math.sqrt(eigHigh)],
    eigenvectors: [eAcoustic, eOptical]
  }
}

/**
 * Punto di incrocio tra la retta della luce infrarossa ω = (c/n)k e il ramo ottico ω₊(k)
 * (dispensa Parte 6, Lezione 4 §24, pp. 59–60, eq. 60 e Fig. 28).
 * Risolve numericamente ω₊(k) = (c/n)k per iterazione di punto fisso (convergenza in ~2 passi).
 */
export function diatomicInfraredCrossing(
  params: DiatomicParams,
  refractiveIndex = 1
): DiatomicInfraredCrossing {
  assertDiatomicParams(params)
  if (!(refractiveIndex > 0) || !Number.isFinite(refractiveIndex)) {
    throw new RangeError('L’indice di rifrazione n deve essere finito e positivo.')
  }

  const cMedium = C_LIGHT_M_S / refractiveIndex
  const zoneEdge = Math.PI / params.a
  let kAngInv = (diatomicOmega(0, 'optical', params) / cMedium) * ANGSTROM_IN_M
  let omegaRadS = diatomicOmega(kAngInv, 'optical', params)

  for (let iter = 0; iter < 6; iter++) {
    omegaRadS = diatomicOmega(kAngInv, 'optical', params)
    const nextK = (omegaRadS / cMedium) * ANGSTROM_IN_M
    if (Math.abs(nextK - kAngInv) <= 1e-15 * Math.max(1e-15, nextK)) {
      kAngInv = nextK
      break
    }
    kAngInv = nextK
  }

  const kLightMInv = kAngInv / ANGSTROM_IN_M
  const freqThz = radSToThz(omegaRadS)
  const energyMev = radSToMev(omegaRadS)
  // Lunghezza d'onda nel vuoto λ = 2πc / ω (come nell'esempio §24 p. 60: λ = 2πc/ω ≈ 64 µm)
  const wavelengthUm = ((2 * Math.PI * C_LIGHT_M_S) / omegaRadS) * 1e6
  const vs = diatomicSoundSpeed(params)

  return {
    refractiveIndex,
    omegaRadS,
    freqThz,
    energyMev,
    wavelengthUm,
    kLightMInv,
    kLightAngInv: kAngInv,
    kOverZoneEdge: kAngInv / zoneEdge,
    speedRatio: cMedium / vs
  }
}

// ---------------------------------------------------------------------------
// Pacchetti d'onda: velocità di fase, velocità di gruppo e allargamento
// (dispensa Parte 6: Lezione 2 §6, pp. 14–17, eqq. 10–12, Figg. 7–9)
// ---------------------------------------------------------------------------

export type WavepacketRegime = 'linear' | 'acoustic' | 'optical' | 'quadratic'

export interface WavepacketParams {
  /** Regime di dispersione (§6.2–§6.3). */
  readonly regime: WavepacketRegime
  /** Vettore d'onda centrale k₀ (Å⁻¹). */
  readonly k0: number
  /** Larghezza spaziale iniziale σ₀ = 1/(2s) di |Ψ(x,0)|² (Å), > 0. */
  readonly sigma0Ang: number
  /** Parametri della catena monatomica (usati per 'linear' e 'acoustic', e passo di riferimento per 'quadratic'). */
  readonly monatomic: MonatomicParams
  /** Parametri della catena biatomica (usati per 'optical'). */
  readonly diatomic: DiatomicParams
  /** Massa efficace in unità di m₀ per il regime 'quadratic' (default 1). */
  readonly freeMassRatio?: number
}

export interface WavepacketCharacteristics {
  readonly regime: WavepacketRegime
  /** Passo reticolare di riferimento a (Å); per 'quadratic' è il passo usato per la scala di k₀. */
  readonly latticeA: number
  /** Bordo della prima zona π/a (Å⁻¹). */
  readonly zoneEdge: number
  /** Vettore d'onda centrale k₀ (Å⁻¹) e frazione di bordo zona k₀/(π/a). */
  readonly k0: number
  readonly k0Frac: number
  /** Pulsazione centrale ω(k₀) (rad·s⁻¹), frequenza ν(k₀) (THz) ed energia ħω(k₀) (meV). */
  readonly omega0RadS: number
  readonly freq0Thz: number
  readonly energy0Mev: number
  /**
   * Velocità di fase v_p = ω(k₀)/k₀ in m·s⁻¹.
   * Vale `null` in k₀ = 0 per i regimi reticolari (forma 0/0 su 'linear'/'acoustic',
   * divergenza ±∞ su 'optical'); vale 0 in k₀ = 0 per 'quadratic' (v_p = ħk/2m → 0).
   */
  readonly vpMs: number | null
  /**
   * Velocità di gruppo v_g = dω/dk in m·s⁻¹.
   * Nei punti angolosi (k₀ = 0 su 'linear'/'acoustic', o bordo zona con M = m su 'optical')
   * vale 0 per convenzione di disparità (la UI deve mostrare i limiti destro/sinistro).
   */
  readonly vgMs: number
  /** Velocità asintotica del suono v_s (m·s⁻¹) per 'linear'/'acoustic'; null negli altri regimi. */
  readonly soundSpeedMs: number | null
  /** Curvatura ω''(k₀) = d²ω/dk² in Å²·s⁻¹. */
  readonly omegaSecondAng2S: number
  /** Curvatura ω''(k₀) = d²ω/dk² in m²·s⁻¹. */
  readonly omegaSecondM2S: number
  /** Larghezza iniziale σ₀ (Å). */
  readonly sigma0Ang: number
  /** Larghezza spettrale Δk = s = 1/(2σ₀) in Å⁻¹ (soddisfa σ₀·Δk = 1/2). */
  readonly deltaKAngInv: number
  /** Tempo caratteristico di dispersione τ_disp = 2σ₀²/|ω''| in s (null se ω'' = 0). */
  readonly spreadingTimeScaleS: number | null
  /** Vero se k₀ = 0 su 'linear' o 'acoustic' (punto angoloso: limiti v_p, v_g = ±v_s). */
  readonly isOriginCusp: boolean
  /** Vero se k₀ = 0 su 'optical' (v_g = 0 liscio, v_p → ±∞). */
  readonly isVpDivergent: boolean
  /** Vero se al bordo zona k₀ = ±π/a si ha onda stazionaria (v_g = 0, ω'' ≠ 0). */
  readonly isZoneEdgeStanding: boolean
  /** Vero se il regime possiede un reticolo discreto campionabile a passo a ('linear', 'acoustic', 'optical'). */
  readonly hasDiscreteLattice: boolean
}

export interface WavepacketDispersionCurve {
  readonly k: Float64Array
  readonly omegaRadS: Float64Array
  readonly freqThz: Float64Array
  readonly energyMev: Float64Array
}

export interface WavepacketFieldSample {
  /** Posizione x (Å) nel laboratorio (o coordinata comovente ξ se `comoving` = true). */
  readonly x: number
  /** Inviluppo gaussiano F(ξ, t) ≥ 0 (picco unitario a t = 0). */
  readonly envelope: number
  /** Parte reale della portante modulata Re Ψ(x, t). */
  readonly realPsi: number
  /** Parte immaginaria Im Ψ(x, t). */
  readonly imagPsi: number
  /** Densità |Ψ(x, t)|² = F(ξ, t)². */
  readonly probDensity: number
}

export interface WavepacketLatticeSample {
  readonly n: number
  /** Posizione di equilibrio x_n⁰ = n·a (Å). */
  readonly xEq: number
  /** Spostamento normalizzato u_n(t) = Re Ψ(x_n⁰, t). */
  readonly u: number
  /** Valore dell'inviluppo F(x_n⁰ − v_g t, t). */
  readonly envelope: number
}

export interface WavepacketFieldSnapshot {
  readonly characteristics: WavepacketCharacteristics
  readonly timeS: number
  readonly sigmaAng: number
  readonly spreadRatio: number
  readonly gamma: number
  /** Posizione del centro dell'inviluppo x_g = v_g·t (Å) nel laboratorio. */
  readonly groupCenterAng: number
  /** Posizione di una cresta di riferimento della portante x_p = v_p·t (Å) (0 se v_p = null). */
  readonly phaseCenterAng: number
  readonly profile: readonly WavepacketFieldSample[]
  readonly atoms: readonly WavepacketLatticeSample[]
}

/** Valida i parametri di input per il pacchetto d'onda. */
function assertWavepacketParams(params: WavepacketParams): number {
  assertMonatomicParams(params.monatomic)
  assertDiatomicParams(params.diatomic)
  if (!Number.isFinite(params.k0)) {
    throw new RangeError('Il vettore d’onda centrale k₀ deve essere finito.')
  }
  if (!(params.sigma0Ang > 0) || !Number.isFinite(params.sigma0Ang)) {
    throw new RangeError('La larghezza iniziale σ₀ deve essere finita e positiva.')
  }
  const freeMassRatio = params.freeMassRatio ?? 1
  if (!(freeMassRatio > 0) || !Number.isFinite(freeMassRatio)) {
    throw new RangeError('Il rapporto di massa efficace deve essere finito e positivo.')
  }
  return freeMassRatio
}

/** Costante quadratica α_q = ħ/m_eff in Å²·s⁻¹ tale che ω(k) = ½ α_q k² per la particella libera. */
function quadraticAlphaAng2S(freeMassRatio: number): number {
  return (2 * HBAR2_OVER_2M0) / (freeMassRatio * HBAR_EV_S)
}

/** Passo reticolare a (Å) associato al regime scelto. */
export function wavepacketLatticeA(params: Pick<WavepacketParams, 'regime' | 'monatomic' | 'diatomic'>): number {
  return params.regime === 'optical' ? params.diatomic.a : params.monatomic.a
}

/**
 * Pulsazione ω(k) in rad·s⁻¹ per ciascuno dei 4 regimi di dispersione (§6.2–§6.3).
 */
export function wavepacketOmega(
  k: number,
  params: Pick<WavepacketParams, 'regime' | 'monatomic' | 'diatomic' | 'freeMassRatio'>
): number {
  assertMonatomicParams(params.monatomic)
  assertDiatomicParams(params.diatomic)
  const freeMassRatio = params.freeMassRatio ?? 1
  if (!(freeMassRatio > 0) || !Number.isFinite(freeMassRatio)) {
    throw new RangeError('Il rapporto di massa efficace deve essere finito e positivo.')
  }

  switch (params.regime) {
    case 'linear': {
      const vsAngS = monatomicSoundSpeed(params.monatomic) / ANGSTROM_IN_M
      return vsAngS * Math.abs(k)
    }
    case 'acoustic':
      return monatomicOmega(k, params.monatomic)
    case 'optical':
      return diatomicOmega(k, 'optical', params.diatomic)
    case 'quadratic': {
      const alphaQ = quadraticAlphaAng2S(freeMassRatio)
      return 0.5 * alphaQ * k * k
    }
  }
}

/**
 * Velocità di gruppo v_g(k) = dω/dk in m·s⁻¹ per ciascuno dei 4 regimi.
 */
export function wavepacketGroupVelocity(
  k: number,
  params: Pick<WavepacketParams, 'regime' | 'monatomic' | 'diatomic' | 'freeMassRatio'>
): number {
  assertMonatomicParams(params.monatomic)
  assertDiatomicParams(params.diatomic)
  const freeMassRatio = params.freeMassRatio ?? 1
  if (!(freeMassRatio > 0) || !Number.isFinite(freeMassRatio)) {
    throw new RangeError('Il rapporto di massa efficace deve essere finito e positivo.')
  }

  switch (params.regime) {
    case 'linear': {
      if (Math.abs(k) < 1e-12) return 0
      return monatomicSoundSpeed(params.monatomic) * Math.sign(k)
    }
    case 'acoustic':
      return Math.abs(k) < 1e-12 ? 0 : monatomicGroupVelocity(k, params.monatomic)
    case 'optical':
      return diatomicGroupVelocity(k, 'optical', params.diatomic)
    case 'quadratic': {
      const alphaQ = quadraticAlphaAng2S(freeMassRatio)
      return alphaQ * k * ANGSTROM_IN_M
    }
  }
}

/**
 * Velocità di fase v_p(k) = ω(k)/k in m·s⁻¹ per ciascuno dei 4 regimi.
 * Restituisce `null` in k = 0 per i regimi reticolari (forma 0/0 su 'linear'/'acoustic',
 * divergenza ±∞ su 'optical'); per 'quadratic' vale 0 in k = 0 (v_p = ħk/2m → 0).
 */
export function wavepacketPhaseVelocity(
  k: number,
  params: Pick<WavepacketParams, 'regime' | 'monatomic' | 'diatomic' | 'freeMassRatio'>
): number | null {
  assertMonatomicParams(params.monatomic)
  assertDiatomicParams(params.diatomic)
  const freeMassRatio = params.freeMassRatio ?? 1
  if (!(freeMassRatio > 0) || !Number.isFinite(freeMassRatio)) {
    throw new RangeError('Il rapporto di massa efficace deve essere finito e positivo.')
  }

  if (params.regime === 'quadratic') {
    const alphaQ = quadraticAlphaAng2S(freeMassRatio)
    return 0.5 * alphaQ * k * ANGSTROM_IN_M
  }
  if (Math.abs(k) < 1e-12) return null
  const omega = wavepacketOmega(k, params)
  return omega / (k / ANGSTROM_IN_M)
}

/**
 * Derivata seconda della dispersione ω''(k) = d²ω/dk² in Å²·s⁻¹ (§6.3, eq. 12):
 * - 'linear': 0 ovunque (k ≠ 0);
 * - 'acoustic': −(a² ω_max / 4)|sin(ka/2)| = −(a²/4)ω(k) (al bordo di zona −a²ω_max/4 ≠ 0);
 * - 'optical': derivata seconda analitica esatta di ω₊(k) da eq. (20);
 * - 'quadratic': ħ/m_eff = cost > 0.
 */
export function wavepacketCurvatureAng2S(
  k: number,
  params: Pick<WavepacketParams, 'regime' | 'monatomic' | 'diatomic' | 'freeMassRatio'>
): number {
  assertMonatomicParams(params.monatomic)
  assertDiatomicParams(params.diatomic)
  const freeMassRatio = params.freeMassRatio ?? 1
  if (!(freeMassRatio > 0) || !Number.isFinite(freeMassRatio)) {
    throw new RangeError('Il rapporto di massa efficace deve essere finito e positivo.')
  }

  switch (params.regime) {
    case 'linear':
      return 0
    case 'acoustic': {
      const a = params.monatomic.a
      return -0.25 * a * a * monatomicOmega(k, params.monatomic)
    }
    case 'optical': {
      const pair = diatomicOmegaSquaredPair(k, params.diatomic)
      if (pair.sqrtD < 1e-14 * pair.S) return 0
      const wPlus = Math.sqrt(pair.wPlusSq)
      const a = params.diatomic.a
      const ka = k * a
      const sinKa = Math.sin(ka)
      const cosKa = Math.cos(ka)
      const invMm = 1 / (pair.mHeavyKg * pair.mLightKg)
      const c = params.diatomic.springC
      // f(k) = ω₊²(k) = C(S + √D) con D = S² − 4sin²(ka/2)/(mM)
      const fPrime = (-c * a * sinKa * invMm) / pair.sqrtD
      const wPrime = fPrime / (2 * wPlus)
      const fSecond =
        ((-c * a * a * invMm) / pair.sqrtD) *
        (cosKa + (sinKa * sinKa * invMm) / (pair.sqrtD * pair.sqrtD))
      return (fSecond - 2 * wPrime * wPrime) / (2 * wPlus)
    }
    case 'quadratic':
      return quadraticAlphaAng2S(freeMassRatio)
  }
}

/**
 * Calcola tutte le caratteristiche cinematiche e dispersive del pacchetto d'onda in k₀.
 */
export function wavepacketCharacteristics(params: WavepacketParams): WavepacketCharacteristics {
  const freeMassRatio = assertWavepacketParams(params)
  const latticeA = wavepacketLatticeA(params)
  const zoneEdge = Math.PI / latticeA
  const k0Frac = params.k0 / zoneEdge

  const omega0RadS = wavepacketOmega(params.k0, { ...params, freeMassRatio })
  const freq0Thz = radSToThz(omega0RadS)
  const energy0Mev = radSToMev(omega0RadS)
  const vpMs = wavepacketPhaseVelocity(params.k0, { ...params, freeMassRatio })
  const vgMs = wavepacketGroupVelocity(params.k0, { ...params, freeMassRatio })
  const omegaSecondAng2S = wavepacketCurvatureAng2S(params.k0, { ...params, freeMassRatio })
  const omegaSecondM2S = omegaSecondAng2S * ANGSTROM_IN_M * ANGSTROM_IN_M

  const soundSpeedMs =
    params.regime === 'linear' || params.regime === 'acoustic'
      ? monatomicSoundSpeed(params.monatomic)
      : null

  const deltaKAngInv = 0.5 / params.sigma0Ang
  const absCurv = Math.abs(omegaSecondAng2S)
  const curvScaleRef = Math.max(1, omega0RadS * latticeA * latticeA)
  const spreadingTimeScaleS =
    absCurv > 1e-11 * curvScaleRef ? (2 * params.sigma0Ang * params.sigma0Ang) / absCurv : null

  const atOrigin = Math.abs(params.k0) < 1e-12
  const atEdge = Math.abs(Math.abs(k0Frac) - 1) < 1e-4
  const equalDiatomicMasses =
    Math.abs(params.diatomic.massHeavyAmu - params.diatomic.massLightAmu) /
      Math.max(params.diatomic.massHeavyAmu, params.diatomic.massLightAmu) <
    1e-12

  return {
    regime: params.regime,
    latticeA,
    zoneEdge,
    k0: params.k0,
    k0Frac,
    omega0RadS,
    freq0Thz,
    energy0Mev,
    vpMs,
    vgMs,
    soundSpeedMs,
    omegaSecondAng2S,
    omegaSecondM2S,
    sigma0Ang: params.sigma0Ang,
    deltaKAngInv,
    spreadingTimeScaleS,
    isOriginCusp: atOrigin && (params.regime === 'linear' || params.regime === 'acoustic'),
    isVpDivergent: atOrigin && params.regime === 'optical',
    isZoneEdgeStanding:
      atEdge &&
      (params.regime === 'acoustic' || (params.regime === 'optical' && !equalDiatomicMasses)),
    hasDiscreteLattice: params.regime !== 'quadratic'
  }
}

/**
 * Campiona la curva di dispersione ω(k) (rad·s⁻¹, THz, meV) su [kMin, kMax] per uno dei 4 regimi.
 */
export function wavepacketDispersionCurve(
  params: Pick<WavepacketParams, 'regime' | 'monatomic' | 'diatomic' | 'freeMassRatio'>,
  kMin: number,
  kMax: number,
  nPoints: number
): WavepacketDispersionCurve {
  assertMonatomicParams(params.monatomic)
  assertDiatomicParams(params.diatomic)
  const n = Math.max(2, Math.round(nPoints))
  const kArr = new Float64Array(n)
  const omegaRadS = new Float64Array(n)
  const freqThz = new Float64Array(n)
  const energyMev = new Float64Array(n)
  const step = (kMax - kMin) / (n - 1)

  for (let i = 0; i < n; i++) {
    const kv = kMin + i * step
    const w = wavepacketOmega(kv, params)
    kArr[i] = kv
    omegaRadS[i] = w
    freqThz[i] = radSToThz(w)
    energyMev[i] = radSToMev(w)
  }

  return { k: kArr, omegaRadS, freqThz, energyMev }
}

/**
 * Legge di allargamento gaussiano σ(t) = σ₀ √(1 + (ω'' t / (2σ₀²))²)
 * (dispensa Parte 6, Lezione 2 §6.3, eq. 12).
 */
export function wavepacketWidthAt(
  sigma0Ang: number,
  omegaSecondAng2S: number,
  timeS: number
): { readonly sigmaAng: number; readonly spreadRatio: number; readonly gamma: number } {
  if (!(sigma0Ang > 0) || !Number.isFinite(sigma0Ang)) {
    throw new RangeError('La larghezza iniziale σ₀ deve essere finita e positiva.')
  }
  const gamma = (omegaSecondAng2S * timeS) / (2 * sigma0Ang * sigma0Ang)
  const spreadRatio = Math.hypot(1, gamma)
  return {
    sigmaAng: sigma0Ang * spreadRatio,
    spreadRatio,
    gamma
  }
}

/**
 * Valuta il campo del pacchetto d'onda Ψ(x, t) a una posizione `xAng` (Å) e tempo `timeS` (s)
 * secondo l'integrale gaussiano al secondo ordine (eqq. 10–12), con norma L² conservata
 * (∫|Ψ|² dx = √(2π)·σ₀, picco unitario a t = 0).
 */
export function wavepacketFieldAt(
  xAng: number,
  timeS: number,
  char: WavepacketCharacteristics
): WavepacketFieldSample {
  const vgAngPerS = char.vgMs / ANGSTROM_IN_M
  const xi = xAng - vgAngPerS * timeS
  const { sigmaAng, gamma } = wavepacketWidthAt(char.sigma0Ang, char.omegaSecondAng2S, timeS)
  const ampScale = Math.sqrt(char.sigma0Ang / sigmaAng)
  const invFourSigmaSq = 1 / (4 * sigmaAng * sigmaAng)
  const envelope = ampScale * Math.exp(-xi * xi * invFourSigmaSq)

  const phase =
    char.k0 * xAng -
    char.omega0RadS * timeS +
    gamma * xi * xi * invFourSigmaSq -
    0.5 * Math.atan(gamma)

  const realPsi = envelope * Math.cos(phase)
  const imagPsi = envelope * Math.sin(phase)

  return {
    x: xAng,
    envelope,
    realPsi,
    imagPsi,
    probDensity: envelope * envelope
  }
}

/**
 * Genera l'istantanea completa del pacchetto d'onda su una finestra spaziale
 * centrata sull'origine del laboratorio oppure nel riferimento comovente (ξ = x − v_g t).
 * Nei 3 regimi reticolari campiona inoltre gli atomi discreti a passo a sotto l'onda.
 */
export function wavepacketSnapshot(
  params: WavepacketParams,
  timeS: number,
  options: {
    readonly halfSpanAng: number
    readonly nProfilePoints: number
    readonly comoving?: boolean
  }
): WavepacketFieldSnapshot {
  const char = wavepacketCharacteristics(params)
  const halfSpan = Math.max(char.latticeA, options.halfSpanAng)
  const nPts = Math.max(16, Math.round(options.nProfilePoints))
  const comoving = options.comoving ?? false

  const vgAngPerS = char.vgMs / ANGSTROM_IN_M
  const groupCenterAng = vgAngPerS * timeS
  const phaseCenterAng = char.vpMs !== null ? (char.vpMs / ANGSTROM_IN_M) * timeS : 0
  const { sigmaAng, spreadRatio, gamma } = wavepacketWidthAt(
    char.sigma0Ang,
    char.omegaSecondAng2S,
    timeS
  )

  const profile: WavepacketFieldSample[] = []
  const xStart = (comoving ? groupCenterAng : 0) - halfSpan
  const step = (2 * halfSpan) / (nPts - 1)
  for (let i = 0; i < nPts; i++) {
    const xLab = xStart + i * step
    const sample = wavepacketFieldAt(xLab, timeS, char)
    profile.push(
      comoving
        ? {
            ...sample,
            x: xLab - groupCenterAng
          }
        : sample
    )
  }

  const atoms: WavepacketLatticeSample[] = []
  if (char.hasDiscreteLattice) {
    const xMinLab = (comoving ? groupCenterAng : 0) - halfSpan
    const xMaxLab = (comoving ? groupCenterAng : 0) + halfSpan
    const nMin = Math.ceil(xMinLab / char.latticeA)
    const nMax = Math.floor(xMaxLab / char.latticeA)
    for (let n = nMin; n <= nMax; n++) {
      const xEq = n * char.latticeA
      const sample = wavepacketFieldAt(xEq, timeS, char)
      atoms.push({
        n,
        xEq: comoving ? xEq - groupCenterAng : xEq,
        u: sample.realPsi,
        envelope: sample.envelope
      })
    }
  }

  return {
    characteristics: char,
    timeS,
    sigmaAng,
    spreadRatio,
    gamma,
    groupCenterAng,
    phaseCenterAng,
    profile,
    atoms
  }
}
