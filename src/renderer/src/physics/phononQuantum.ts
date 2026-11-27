/**
 * Fisica dei modi quantizzati (fononi), oscillatore armonico quantistico vs classico,
 * statistica di Bose–Einstein (μ = 0) e processi Normali / Umklapp nella 1BZ
 * (dispensa Parte 6: Lezione 2 §11 eqq. 29–30; Lezione 3 §§15–18, Figg. 19–21, eqq. 40–42 e 46–51).
 *
 * Modulo TypeScript puro (zero React, zero DOM).
 * Convenzioni di unità:
 * - masse atomiche `massAmu` in u.m.a. (1 u = AMU_KG kg)
 * - pulsazioni `omegaRadS` in rad·s⁻¹, frequenze `freqThz` in THz
 * - coordinate `xAng`, lunghezza caratteristica `aHoAng`, passo `latticeA` in Å
 * - temperature `temperatureK` in K, energie in J / eV / meV
 * - vettori d'onda `k` in Å⁻¹ (o frazioni `kFrac = k / (π/a)` in (−1, 1])
 */
import {
  AMU_KG,
  ANGSTROM_IN_M,
  HBAR_J_S,
  KB_EV_K,
  KB_J_K,
  amuToKg,
  radSToMev,
  radSToThz
} from './constants'
import {
  monatomicGroupVelocity,
  monatomicOmega,
  monatomicReciprocalG,
  monatomicZoneEdge,
  velocityMsToThzAngstrom,
  type MonatomicParams
} from './phononDispersion'

export interface QuantumOscillatorParams {
  /** Massa atomica M (u.m.a.), > 0. */
  readonly massAmu: number
  /** Pulsazione del modo ω (rad·s⁻¹), > 0. */
  readonly omegaRadS: number
  /** Passo reticolare opzionale a (Å) per il confronto Δx / a. */
  readonly latticeA?: number
}

export interface QuantumEnergyLevel {
  /** Numero quantico (numero di fononi nel modo), intero ≥ 0. */
  readonly n: number
  /** Energia in unità di ħω: E_n / (ħω) = n + 1/2. */
  readonly unitsHbarOmega: number
  /** Energia in Joule. */
  readonly energyJ: number
  /** Energia in eV. */
  readonly energyEv: number
  /** Energia in meV. */
  readonly energyMev: number
}

export interface QuantumModeSummary {
  readonly n: number
  readonly freqThz: number
  readonly hbarOmegaMev: number
  readonly energyMev: number
  readonly unitsHbarOmega: number
  /** Lunghezza caratteristica a_ho = √(ħ / Mω) in Å. */
  readonly aHoAng: number
  /** Ampiezza RMS di punto zero Δx_zp = a_ho / √2 in Å. */
  readonly deltaXzpAng: number
  /** Ampiezza RMS nello stato |n⟩: Δx_n = a_ho √(n + 1/2) in Å. */
  readonly deltaXRmsAng: number
  /** Punto di inversione classico x_cl = a_ho √(2n + 1) in Å. */
  readonly xClAng: number
  /** Punto di inversione adimensionale u_cl = x_cl / a_ho = √(2n + 1). */
  readonly uCl: number
  /** Probabilità di tunneling nella regione |x| > x_cl (per n = 0 vale erfc(1) ≈ 0,1573). */
  readonly tunnelingFraction: number
  /** Rapporto Δx_zp / a (null se `latticeA` non è specificato). */
  readonly zpOverLattice: number | null
  /** Rapporto Δx_n / a (null se `latticeA` non è specificato). */
  readonly rmsOverLattice: number | null
}

export interface OscillatorCurvesDimless {
  /** Griglia adimensionale u = x / a_ho. */
  readonly u: Float64Array
  /** Autofunzione adimensionale ψ_n(u) = a_ho^{1/2} Ψ_n(x). */
  readonly psiN: Float64Array
  /** Densità di probabilità quantistica adimensionale P_n(u) = |ψ_n(u)|². */
  readonly probQuantum: Float64Array
  /** Densità di probabilità classica adimensionale P_cl(u) = 1 / (π√(u_cl² − u²)) per |u| < u_cl. */
  readonly probClassical: Float64Array
}

export interface ThermalOscillatorSummary {
  readonly temperatureK: number
  readonly freqThz: number
  readonly hbarOmegaMev: number
  readonly kBTmev: number
  /** Rapporto adimensionale x = ħω / (k_B T) (Infinity per T = 0). */
  readonly xRatio: number
  /** Occupazione media di Bose–Einstein (μ = 0): n̄(T) = (e^x − 1)⁻¹. */
  readonly nBar: number
  /** Energia media ⟨E⟩ = (n̄ + 1/2)ħω in meV. */
  readonly meanEnergyMev: number
  /** Energia media in unità di ħω: n̄ + 1/2. */
  readonly meanUnitsHbarOmega: number
  /** Ampiezza RMS termica Δx(T) = a_ho √(n̄ + 1/2) in Å. */
  readonly rmsAmpAng: number
  /** Punto di inversione equivalente x_cl,eff = a_ho √(2n̄ + 1) in Å. */
  readonly xClEffAng: number
  /** Punto di inversione equivalente adimensionale u_cl,eff = √(2n̄ + 1). */
  readonly uClEff: number
  /** Rapporto Δx(T) / a (null se `latticeA` non è specificato). */
  readonly rmsOverLattice: number | null
}

export type CollisionProcessKind = 'normal' | 'umklapp'

export interface UmklappCollisionResult {
  readonly k1Frac: number
  readonly k2Frac: number
  /** Somma grezza k₁ + k₂ in unità di π/a. */
  readonly kSumFrac: number
  /** Molteplicità m ∈ {−1, 0, +1} di G = m·2π/a tale che k₃ = k₁ + k₂ + G ∈ (−π/a, π/a]. */
  readonly mG: -1 | 0 | 1
  /** Vettore di ripiegamento G in unità di π/a (0, +2, −2). */
  readonly gFrac: number
  /** Vettore risultante k₃ nella 1BZ (−1, +1] in unità di π/a. */
  readonly k3Frac: number
  /** Vettori d'onda in Å⁻¹. */
  readonly k1: number
  readonly k2: number
  readonly kSum: number
  readonly g: number
  readonly k3: number
  readonly kind: CollisionProcessKind
  /** Pulsazioni ω(k_i) sulla dispersione monatomica (rad·s⁻¹). */
  readonly omega1RadS: number
  readonly omega2RadS: number
  readonly omega3RadS: number
  /** Frequenze ν(k_i) (THz). */
  readonly freq1Thz: number
  readonly freq2Thz: number
  readonly freq3Thz: number
  /** Energie ħω(k_i) (meV). */
  readonly energy1Mev: number
  readonly energy2Mev: number
  readonly energy3Mev: number
  /** Bilancio energetico ħ(ω₃ − ω₁ − ω₂) in meV (0 solo per terne cinematicamente risonanti). */
  readonly energyMismatchMev: number
  /** Velocità di gruppo v_g(k_i) in m·s⁻¹. */
  readonly vg1Ms: number
  readonly vg2Ms: number
  readonly vg3Ms: number
  /** Pendenze dν/dk in THz·Å sul diagramma ν(k). */
  readonly slopeVg1ThzA: number
  readonly slopeVg2ThzA: number
  readonly slopeVg3ThzA: number
  /** Vero se k₁ e k₂ propagano energia nello stesso verso (v_g(k₁)·v_g(k₂) > 0). */
  readonly sameInputDirection: boolean
  /** Vero se è un Umklapp che inverte il verso di v_g(k₃) rispetto ai due fononi entranti. */
  readonly flowReversed: boolean
}

const INV_PI_QUARTER = Math.pow(Math.PI, -0.25)
const J_TO_EV = KB_EV_K / KB_J_K

/** Nodi e pesi di Gauss–Legendre a 24 punti su [−1, 1] per integrazione ad alta precisione. */
const GL24_X = [
  -0.9951872199970213, -0.9747285559713095, -0.9382745520027328, -0.886415527004401,
  -0.820001985973903, -0.7401241915785544, -0.6480936519369755, -0.5454214713888396,
  -0.4337935076260451, -0.3150426796961634, -0.1911188674736163, -0.06405689286260563,
  0.06405689286260563, 0.1911188674736163, 0.3150426796961634, 0.4337935076260451,
  0.5454214713888396, 0.6480936519369755, 0.7401241915785544, 0.820001985973903,
  0.886415527004401, 0.9382745520027328, 0.9747285559713095, 0.9951872199970213
] as const

const GL24_W = [
  0.0123412297999872, 0.028531388628933663, 0.04427743881741981, 0.05929858491543678,
  0.0733464814110803, 0.08619016153195327, 0.09761865210411388, 0.10744427011596563,
  0.1155056680537256, 0.12167047292780339, 0.1258374563468283, 0.12793819534675216,
  0.12793819534675216, 0.1258374563468283, 0.12167047292780339, 0.1155056680537256,
  0.10744427011596563, 0.09761865210411388, 0.08619016153195327, 0.0733464814110803,
  0.05929858491543678, 0.04427743881741981, 0.028531388628933663, 0.0123412297999872
] as const

function assertPositiveFinite(value: number, name: string): void {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new RangeError(`${name} deve essere finito e positivo.`)
  }
}

function assertNonNegativeInt(n: number): number {
  if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
    throw new RangeError('Il numero quantico n deve essere un intero non negativo.')
  }
  return n
}

/**
 * Funzione degli errori complementare erfc(x) = (2/√π) ∫_x^∞ e^{-t²} dt
 * tramite quadratura di Gauss–Legendre a 24 punti per |x| ≤ 2,0 e frazione continua
 * di Laplace per x > 2,0 (precisione < 10⁻¹⁵ senza cancellazione numerica).
 */
export function erfc(x: number): number {
  if (!Number.isFinite(x)) {
    if (Number.isNaN(x)) return NaN
    return x > 0 ? 0 : 2
  }
  if (x < 0) return 2 - erfc(-x)
  if (x === 0) return 1
  if (x > 26.6) return 0

  if (x <= 2.0) {
    // erf(x) = (2/√π) ∫₀ˣ e^{-t²} dt con quadratura Gauss–Legendre a 24 punti
    const half = 0.5 * x
    let integral = 0
    for (let i = 0; i < GL24_X.length; i++) {
      const t = half * (GL24_X[i] + 1)
      integral += GL24_W[i] * Math.exp(-t * t)
    }
    const erf = (2 / Math.sqrt(Math.PI)) * half * integral
    return Math.max(0, 1 - erf)
  }

  // Frazione continua di Laplace per x > 2,0:
  // √π e^{x²} erfc(x) = 1 / (x + (1/2)/(x + 1/(x + (3/2)/(x + ...))))
  let cf = x
  for (let k = 44; k >= 1; k--) {
    cf = x + (0.5 * k) / cf
  }
  return Math.exp(-x * x) / (Math.sqrt(Math.PI) * cf)
}

/**
 * Lunghezza caratteristica dell'oscillatore armonico a_ho = √(ħ / (Mω)) in Å
 * (dispensa Parte 6, Lezione 3 §18.2, p. 44).
 */
export function harmonicLengthAng(massAmu: number, omegaRadS: number): number {
  assertPositiveFinite(massAmu, 'La massa atomica M')
  assertPositiveFinite(omegaRadS, 'La pulsazione ω')
  const aHoM = Math.sqrt(HBAR_J_S / (amuToKg(massAmu) * omegaRadS))
  return aHoM / ANGSTROM_IN_M
}

/**
 * Spostamento quadratico medio (RMS) nello stato fondamentale:
 * Δx_zp = a_ho / √2 in Å (dispensa Parte 6, §18.2 p. 45 e §18.4 p. 47).
 */
export function zeroPointRmsAng(massAmu: number, omegaRadS: number): number {
  return harmonicLengthAng(massAmu, omegaRadS) / Math.SQRT2
}

/**
 * Livello energetico quantizzato E_n = (n + 1/2)ħω (dispensa Parte 6, eq. 29).
 */
export function quantumEnergyLevel(n: number, omegaRadS: number): QuantumEnergyLevel {
  const ni = assertNonNegativeInt(n)
  assertPositiveFinite(omegaRadS, 'La pulsazione ω')
  const unitsHbarOmega = ni + 0.5
  const energyJ = unitsHbarOmega * HBAR_J_S * omegaRadS
  const energyEv = energyJ * J_TO_EV
  return {
    n: ni,
    unitsHbarOmega,
    energyJ,
    energyEv,
    energyMev: energyEv * 1e3
  }
}

/**
 * Punto di inversione classico adimensionale u_cl = x_cl / a_ho = √(2n + 1)
 * (dispensa Parte 6, §18.3 p. 46: E = ½Mω²x_cl² = (n + ½)ħω).
 */
export function classicalTurningPointDimless(n: number): number {
  const ni = assertNonNegativeInt(n)
  return Math.sqrt(2 * ni + 1)
}

/** Punto di inversione classico x_cl = a_ho √(2n + 1) in Å. */
export function classicalTurningPointAng(n: number, aHoAng: number): number {
  assertPositiveFinite(aHoAng, 'a_ho')
  return aHoAng * classicalTurningPointDimless(n)
}

/**
 * Autofunzione ortonormale adimensionale dell'oscillatore armonico quantistico:
 * ψ_n(u) = (2^n n! √π)^{-1/2} H_n(u) e^{-u²/2}, u = x / a_ho (eq. 49).
 * Calcolata con ricorrenza a tre termini normalizzata, priva di fattoriali e
 * numericamente stabile anche per n ≫ 25:
 *   ψ₀(u) = π^{-1/4} e^{-u²/2},  ψ₁(u) = √2 u ψ₀(u),
 *   ψ_k(u) = √(2/k) u ψ_{k−1}(u) − √((k−1)/k) ψ_{k−2}(u).
 */
export function harmonicEigenfunctionDimless(n: number, u: number): number {
  const ni = assertNonNegativeInt(n)
  if (!Number.isFinite(u)) return 0
  const halfU2 = 0.5 * u * u
  if (halfU2 > 745) return 0

  const psi0 = INV_PI_QUARTER * Math.exp(-halfU2)
  if (ni === 0) return psi0
  const psi1 = Math.SQRT2 * u * psi0
  if (ni === 1) return psi1

  let prev2 = psi0
  let prev1 = psi1
  for (let k = 2; k <= ni; k++) {
    const cur = Math.sqrt(2 / k) * u * prev1 - Math.sqrt((k - 1) / k) * prev2
    prev2 = prev1
    prev1 = cur
  }
  return prev1
}

/**
 * Autofunzione fisica normalizzata Ψ_n(x) = a_ho^{-1/2} ψ_n(x / a_ho) in Å^{-1/2},
 * con ∫ |Ψ_n(x)|² dx = 1.
 */
export function harmonicEigenfunction(n: number, xAng: number, aHoAng: number): number {
  assertPositiveFinite(aHoAng, 'a_ho')
  return harmonicEigenfunctionDimless(n, xAng / aHoAng) / Math.sqrt(aHoAng)
}

/** Densità di probabilità quantistica adimensionale P_n(u) = |ψ_n(u)|². */
export function quantumProbabilityDensityDimless(n: number, u: number): number {
  const psi = harmonicEigenfunctionDimless(n, u)
  return psi * psi
}

/** Densità di probabilità quantistica fisica P_n(x) = |Ψ_n(x)|² in Å⁻¹. */
export function quantumProbabilityDensity(n: number, xAng: number, aHoAng: number): number {
  const psi = harmonicEigenfunction(n, xAng, aHoAng)
  return psi * psi
}

/**
 * Densità di probabilità classica adimensionale (dispensa Parte 6, eq. 46):
 * P_cl(u) = 1 / (π √(u_cl² − u²)) per |u| < u_cl, e 0 nella regione proibita |u| ≥ u_cl.
 */
export function classicalProbabilityDensityDimless(uCl: number, u: number): number {
  assertPositiveFinite(uCl, 'u_cl')
  const diffSq = uCl * uCl - u * u
  if (diffSq <= 0) return 0
  return 1 / (Math.PI * Math.sqrt(diffSq))
}

/** Densità di probabilità classica fisica P_cl(x) = 1 / (π √(x_cl² − x²)) in Å⁻¹. */
export function classicalProbabilityDensity(xClAng: number, xAng: number): number {
  assertPositiveFinite(xClAng, 'x_cl')
  const diffSq = xClAng * xClAng - xAng * xAng
  if (diffSq <= 0) return 0
  return 1 / (Math.PI * Math.sqrt(diffSq))
}

/**
 * Frazione di probabilità nella regione classicamente proibita |x| > x_cl (effetto tunnel).
 * Per n = 0 restituisce esattamente erfc(1) ≈ 0,1572992 (dispensa Parte 6, §18.3 p. 46).
 * Per n ≥ 1 integra 1 − 2 ∫₀^{u_cl} |ψ_n(u)|² du con quadratura composta di Gauss–Legendre.
 */
export function quantumTunnelingFraction(n: number): number {
  const ni = assertNonNegativeInt(n)
  if (ni === 0) return erfc(1)

  const uCl = classicalTurningPointDimless(ni)
  const panels = Math.max(4, Math.ceil((ni + 1) / 4))
  const h = uCl / panels
  let insideIntegral = 0
  for (let p = 0; p < panels; p++) {
    const a = p * h
    const mid = a + 0.5 * h
    const half = 0.5 * h
    let sub = 0
    for (let i = 0; i < GL24_X.length; i++) {
      const u = mid + half * GL24_X[i]
      sub += GL24_W[i] * quantumProbabilityDensityDimless(ni, u)
    }
    insideIntegral += half * sub
  }
  const tunneling = 1 - 2 * insideIntegral
  return Math.max(0, Math.min(1, tunneling))
}

/** Riepilogo completo delle scale e quantità del modo quantizzato nello stato |n⟩. */
export function quantumModeSummary(params: QuantumOscillatorParams, n: number): QuantumModeSummary {
  const ni = assertNonNegativeInt(n)
  assertPositiveFinite(params.massAmu, 'La massa atomica M')
  assertPositiveFinite(params.omegaRadS, 'La pulsazione ω')

  const aHoAng = harmonicLengthAng(params.massAmu, params.omegaRadS)
  const deltaXzpAng = aHoAng / Math.SQRT2
  const deltaXRmsAng = aHoAng * Math.sqrt(ni + 0.5)
  const uCl = classicalTurningPointDimless(ni)
  const xClAng = aHoAng * uCl
  const level = quantumEnergyLevel(ni, params.omegaRadS)
  const hbarOmegaMev = radSToMev(params.omegaRadS)
  const freqThz = radSToThz(params.omegaRadS)
  const tunnelingFraction = quantumTunnelingFraction(ni)
  const hasA = params.latticeA !== undefined && params.latticeA > 0

  return {
    n: ni,
    freqThz,
    hbarOmegaMev,
    energyMev: level.energyMev,
    unitsHbarOmega: level.unitsHbarOmega,
    aHoAng,
    deltaXzpAng,
    deltaXRmsAng,
    xClAng,
    uCl,
    tunnelingFraction,
    zpOverLattice: hasA ? deltaXzpAng / params.latticeA! : null,
    rmsOverLattice: hasA ? deltaXRmsAng / params.latticeA! : null
  }
}

/** Campiona ψ_n(u), P_n(u) = |ψ_n(u)|² e P_cl(u) su [−uMax, +uMax]. */
export function oscillatorCurvesDimless(
  n: number,
  uMax: number,
  nPoints: number
): OscillatorCurvesDimless {
  const ni = assertNonNegativeInt(n)
  assertPositiveFinite(uMax, 'uMax')
  const count = Math.max(3, Math.round(nPoints))
  const uCl = classicalTurningPointDimless(ni)
  const u = new Float64Array(count)
  const psiN = new Float64Array(count)
  const probQuantum = new Float64Array(count)
  const probClassical = new Float64Array(count)
  const step = (2 * uMax) / (count - 1)

  for (let i = 0; i < count; i++) {
    const uv = -uMax + i * step
    const psi = harmonicEigenfunctionDimless(ni, uv)
    u[i] = uv
    psiN[i] = psi
    probQuantum[i] = psi * psi
    probClassical[i] = classicalProbabilityDensityDimless(uCl, uv)
  }

  return { u, psiN, probQuantum, probClassical }
}

/**
 * Occupazione media di Bose–Einstein con potenziale chimico nullo μ = 0
 * (dispensa Parte 6, Lezione 2 eq. 30 e Lezione 3 eq. 45):
 * n̄(T) = [exp(ħω / k_B T) − 1]⁻¹.
 */
export function boseEinsteinOccupation(omegaRadS: number, temperatureK: number): number {
  assertPositiveFinite(omegaRadS, 'La pulsazione ω')
  if (Number.isNaN(temperatureK) || temperatureK <= 0) return 0
  if (temperatureK === Infinity) return Infinity
  const x = (HBAR_J_S * omegaRadS) / (KB_J_K * temperatureK)
  if (x > 709) return 0
  return 1 / Math.expm1(x)
}

/**
 * Distribuzione di equilibrio termico dei livelli n = 0, …, maxN del modo:
 * p_n(T) = (1 − e^{−x}) e^{−n x}, con x = ħω / (k_B T) e ∑_{n=0}^∞ p_n = 1.
 */
export function boseEinsteinLevelProbabilities(
  omegaRadS: number,
  temperatureK: number,
  maxN: number
): Float64Array {
  assertPositiveFinite(omegaRadS, 'La pulsazione ω')
  const count = assertNonNegativeInt(maxN) + 1
  const probs = new Float64Array(count)
  if (!Number.isFinite(temperatureK) || temperatureK <= 0) {
    probs[0] = 1
    return probs
  }
  const x = (HBAR_J_S * omegaRadS) / (KB_J_K * temperatureK)
  if (x > 709) {
    probs[0] = 1
    return probs
  }
  const z = Math.exp(-x)
  const norm = -Math.expm1(-x)
  let p = norm
  for (let n = 0; n < count; n++) {
    probs[n] = p
    p *= z
  }
  return probs
}

/**
 * Densità di probabilità termica esatta ∑_{n=0}^∞ p_n(T) |ψ_n(u)|² in coordinate adimensionali u = x/a_ho.
 * Per il teorema di Bloch / formula di Mehler dell'oscillatore armonico quantistico è esattamente
 * una gaussiana centrata di varianza σ_u²(T) = n̄(T) + 1/2 = ½ coth(ħω / 2k_B T).
 */
export function thermalProbabilityDensityDimless(
  omegaRadS: number,
  temperatureK: number,
  u: number
): number {
  const nBar = boseEinsteinOccupation(omegaRadS, temperatureK)
  const sigmaSq = nBar + 0.5
  return Math.exp((-u * u) / (2 * sigmaSq)) / Math.sqrt(2 * Math.PI * sigmaSq)
}

/** Riepilogo termodinamico del modo singolo a temperatura T secondo Bose–Einstein (μ = 0). */
export function thermalOscillatorSummary(
  params: QuantumOscillatorParams,
  temperatureK: number
): ThermalOscillatorSummary {
  assertPositiveFinite(params.massAmu, 'La massa atomica M')
  assertPositiveFinite(params.omegaRadS, 'La pulsazione ω')
  const t = Math.max(0, temperatureK)
  const hbarOmegaMev = radSToMev(params.omegaRadS)
  const kBTmev = KB_EV_K * t * 1e3
  const xRatio = t > 0 ? (HBAR_J_S * params.omegaRadS) / (KB_J_K * t) : Infinity
  const nBar = boseEinsteinOccupation(params.omegaRadS, t)
  const meanUnitsHbarOmega = nBar + 0.5
  const meanEnergyMev = meanUnitsHbarOmega * hbarOmegaMev
  const aHoAng = harmonicLengthAng(params.massAmu, params.omegaRadS)
  const rmsAmpAng = aHoAng * Math.sqrt(meanUnitsHbarOmega)
  const uClEff = Math.sqrt(2 * nBar + 1)
  const xClEffAng = aHoAng * uClEff
  const hasA = params.latticeA !== undefined && params.latticeA > 0

  return {
    temperatureK: t,
    freqThz: radSToThz(params.omegaRadS),
    hbarOmegaMev,
    kBTmev,
    xRatio,
    nBar,
    meanEnergyMev,
    meanUnitsHbarOmega,
    rmsAmpAng,
    xClEffAng,
    uClEff,
    rmsOverLattice: hasA ? rmsAmpAng / params.latticeA! : null
  }
}

/** Riporta un valore adimensionale k/(π/a) nella convenzione 1BZ (−1, +1]. */
function normalizeKFracTo1BZ(kFrac: number): number {
  if (!Number.isFinite(kFrac)) {
    throw new RangeError("Il vettore d'onda k deve essere finito.")
  }
  let r = ((kFrac + 1) % 2 + 2) % 2 - 1
  if (Math.abs(r + 1) < 1e-12 || Math.abs(r - 1) < 1e-12) r = 1
  if (Math.abs(r) < 1e-14) r = 0
  return r
}

/**
 * Analisi cinematica nella prima zona di Brillouin (−π/a, π/a] di una collisione
 * a tre fononi k₁ + k₂ = k₃ − G (dispensa Parte 6, Lezione 3 §16.2, eq. 40 e Fig. 19):
 * - Normale (N): k₁ + k₂ ∈ (−π/a, π/a] ⇒ G = 0, k₃ = k₁ + k₂.
 * - Umklapp (U): k₁ + k₂ esce dalla 1BZ ⇒ G = ±2π/a riporta k₃ = k₁ + k₂ + G ∈ (−π/a, π/a].
 * Le pulsazioni e le velocità di gruppo v_g(k_i) usano la dispersione monatomica (eq. 8–9).
 */
export function analyze1BZCollision(
  k1Frac: number,
  k2Frac: number,
  params: MonatomicParams
): UmklappCollisionResult {
  const f1 = normalizeKFracTo1BZ(k1Frac)
  const f2 = normalizeKFracTo1BZ(k2Frac)
  const fSum = f1 + f2

  let mG: -1 | 0 | 1 = 0
  if (fSum > 1 + 1e-12) {
    mG = -1
  } else if (fSum <= -1 + 1e-12) {
    mG = 1
  }

  let f3 = fSum + 2 * mG
  if (Math.abs(f3) < 1e-14) f3 = 0
  if (Math.abs(f3 - 1) < 1e-12) f3 = 1

  const zoneEdge = monatomicZoneEdge(params.a)
  const recG = monatomicReciprocalG(params.a)
  const k1 = f1 * zoneEdge
  const k2 = f2 * zoneEdge
  const kSum = fSum * zoneEdge
  const g = mG * recG
  const k3 = f3 * zoneEdge

  const omega1RadS = monatomicOmega(k1, params)
  const omega2RadS = monatomicOmega(k2, params)
  const omega3RadS = monatomicOmega(k3, params)

  const freq1Thz = radSToThz(omega1RadS)
  const freq2Thz = radSToThz(omega2RadS)
  const freq3Thz = radSToThz(omega3RadS)

  const energy1Mev = radSToMev(omega1RadS)
  const energy2Mev = radSToMev(omega2RadS)
  const energy3Mev = radSToMev(omega3RadS)

  const vg1Ms = monatomicGroupVelocity(k1, params)
  const vg2Ms = monatomicGroupVelocity(k2, params)
  const vg3Ms = monatomicGroupVelocity(k3, params)

  const kind: CollisionProcessKind = mG === 0 ? 'normal' : 'umklapp'
  const sameInputDirection = vg1Ms * vg2Ms > 1e-6
  const flowReversed = kind === 'umklapp' && sameInputDirection && vg1Ms * vg3Ms < -1e-6

  return {
    k1Frac: f1,
    k2Frac: f2,
    kSumFrac: fSum,
    mG,
    gFrac: 2 * mG,
    k3Frac: f3,
    k1,
    k2,
    kSum,
    g,
    k3,
    kind,
    omega1RadS,
    omega2RadS,
    omega3RadS,
    freq1Thz,
    freq2Thz,
    freq3Thz,
    energy1Mev,
    energy2Mev,
    energy3Mev,
    energyMismatchMev: energy3Mev - (energy1Mev + energy2Mev),
    vg1Ms,
    vg2Ms,
    vg3Ms,
    slopeVg1ThzA: velocityMsToThzAngstrom(vg1Ms),
    slopeVg2ThzA: velocityMsToThzAngstrom(vg2Ms),
    slopeVg3ThzA: velocityMsToThzAngstrom(vg3Ms),
    sameInputDirection,
    flowReversed
  }
}

/** Converte masse in u.m.a. e frequenza in THz in pulsazione rad·s⁻¹. */
export function freqThzToOmegaRadS(freqThz: number): number {
  assertPositiveFinite(freqThz, 'La frequenza ν')
  return 2 * Math.PI * 1e12 * freqThz
}

/** Esposizione della massa del metallo tipico in u.m.a. dalla dispensa §3 / §18.4 (1,05·10⁻²⁵ kg). */
export const TYPICAL_METAL_MASS_AMU = 1.05e-25 / AMU_KG
