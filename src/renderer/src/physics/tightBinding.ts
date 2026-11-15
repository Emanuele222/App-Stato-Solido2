/**
 * Modello a legami forti (tight binding) in 1D (dispense P3 §12, P4 §§1.4–2):
 *  - catena monoatomica con bande indipendenti s (t_s > 0) e p (t_p < 0);
 *  - legge esponenziale indicativa t(a) = t(a₀)·e^{-(a−a₀)/ℓ} (non ricavata dalle
 *    dispense, solo modello qualitativo di §12.1);
 *  - catena biatomica A–B di passo a (A in n·a, B in (n+½)·a, E_A ≤ E_B, t > 0),
 *    con autovalori E±(k), pesi |b_A|², |b_B|² e masse efficaci al gap;
 *  - funzioni d'onda di Bloch e densità |ψ_k(x)|² costruite come somma di orbitali
 *    atomici modello (gaussiana per s/A/B, x·gaussiana per p lungo la catena).
 *
 * Unità: lunghezze in Å, vettori d'onda in Å⁻¹, energie in eV.
 */
import type { BandStructure, KPath } from './bandStructure'
import { HBAR2_OVER_2M0, HBAR2_OVER_M0 } from './constants'
import { zoneEdge1D } from './emptyLattice'

export type TightBindingBandKind = 's' | 'p'
export type BondingCharacter = 'bonding' | 'antibonding' | 'mixed'

export interface TightBindingMonoatomicParams {
  /** Passo reticolare a (Å). */
  readonly a: number
  /** Centro della banda s, Ē_s (eV). */
  readonly centerS: number
  /** Centro della banda p, Ē_p (eV). */
  readonly centerP: number
  /** Integrale di sovrapposizione per la banda s, t_s ≥ 0 (eV). */
  readonly tS: number
  /** Modulo dell'integrale di sovrapposizione per la banda p, |t_p| ≥ 0 (eV), con t_p = −|t_p| ≤ 0. */
  readonly absTP: number
}

export interface TightBindingBandSummary {
  readonly center: number
  readonly tSigned: number
  readonly min: number
  readonly max: number
  readonly width: number
}

export interface TightBindingDiatomicParams {
  /** Passo della cella primitiva A–B, a (Å); distanza A–B = a/2. */
  readonly a: number
  /** Livello atomico dell'atomo A (eV). */
  readonly eA: number
  /** Livello atomico dell'atomo B (eV), con E_A ≤ E_B. */
  readonly eB: number
  /** Integrale di sovrapposizione tra primi vicini A–B, t ≥ 0 (eV). */
  readonly t: number
}

export interface DiatomicState {
  readonly energies: readonly [number, number]
  /** Componenti reali nella base simmetrizzata (b_A, b̃_B = e^{-ika/2} b_B) per ciascuna banda [E_-, E_+]. */
  readonly weights: readonly [
    { readonly bA: number; readonly bB: number; readonly bA2: number; readonly bB2: number },
    { readonly bA: number; readonly bB: number; readonly bA2: number; readonly bB2: number }
  ]
}

export interface TightBindingWaveSamples {
  readonly rePsi: Float64Array
  readonly density: Float64Array
}

export interface TightBindingEdgePoint {
  readonly a: number
  readonly sMin: number
  readonly sMax: number
  readonly pMin: number
  readonly pMax: number
}

/** Larghezza di una banda 1D a primi vicini: W = 4|t| (P3 §12.3, P4 §1.4). */
export function tightBindingBandwidth(t: number): number {
  if (!Number.isFinite(t)) throw new RangeError(`t non valido: ${t}`)
  return 4 * Math.abs(t)
}

/** Legge esponenziale indicativa t(a) = t(a₀)·exp(−(a − a₀)/ℓ). */
export function indicativeHoppingAtDistance(a: number, a0: number, tAtA0: number, ell: number): number {
  if (!(a > 0) || !(a0 > 0) || !(ell > 0) || !Number.isFinite(tAtA0)) {
    throw new RangeError('parametri non validi per indicativeHoppingAtDistance')
  }
  return tAtA0 * Math.exp(-(a - a0) / ell)
}

/** Inversa della legge indicativa: ricava t(a₀) dal valore corrente t(a) al passo a. */
export function calibrateIndicativeHoppingAtA0(a: number, a0: number, tAtA: number, ell: number): number {
  if (!(a > 0) || !(a0 > 0) || !(ell > 0) || !Number.isFinite(tAtA)) {
    throw new RangeError('parametri non validi per calibrateIndicativeHoppingAtA0')
  }
  return tAtA * Math.exp((a - a0) / ell)
}

/** Parte reale dell'ampiezza di Bloch su un sito x: Re(c · e^{ikx}) = c · cos(kx). */
export function blochSiteRealAmplitude(k: number, x: number, coefficient = 1): number {
  if (!Number.isFinite(k) || !Number.isFinite(x) || !Number.isFinite(coefficient)) {
    throw new RangeError('parametri non validi per blochSiteRealAmplitude')
  }
  return coefficient * Math.cos(k * x)
}

/** Converte la frazione di zona k/(π/a) nel vettore d'onda k in Å⁻¹. */
export function kFromZoneFraction(kFrac: number, a: number): number {
  if (!Number.isFinite(kFrac)) throw new RangeError(`kFrac non valido: ${kFrac}`)
  return kFrac * zoneEdge1D(a)
}

/** Energie [E_s(k), E_p(k)] in eV per la catena monoatomica a un dato k (Å⁻¹). */
export function monoatomicEnergiesAt(
  params: TightBindingMonoatomicParams,
  k: number
): readonly [number, number] {
  validateMonoatomic(params)
  if (!Number.isFinite(k)) throw new RangeError(`k non valido: ${k}`)
  const c = Math.cos(k * params.a)
  return [params.centerS - 2 * params.tS * c, params.centerP + 2 * params.absTP * c]
}

/** Estremi e larghezza di una banda monoatomica s (t_s ≥ 0) o p (t_p = −|t_p| ≤ 0). */
export function monoatomicBandSummary(
  center: number,
  tSigned: number
): TightBindingBandSummary {
  if (!Number.isFinite(center) || !Number.isFinite(tSigned)) {
    throw new RangeError('centro o t non valido')
  }
  const absT = Math.abs(tSigned)
  return {
    center,
    tSigned,
    min: center - 2 * absT,
    max: center + 2 * absT,
    width: 4 * absT
  }
}

/**
 * Gap al bordo di zona k = π/a nella catena monoatomica s–p:
 * E_g(π/a) = (Ē_p − 2|t_p|) − (Ē_s + 2t_s) = (Ē_p − Ē_s) − 2(t_s + |t_p|).
 * Negativo se le due bande si sovrappongono.
 */
export function monoatomicGapAtZoneEdge(params: TightBindingMonoatomicParams): number {
  validateMonoatomic(params)
  return params.centerP - params.centerS - 2 * (params.tS + params.absTP)
}

/** Distanza E_p(0) − E_s(0) al centro zona k = 0 nella catena monoatomica. */
export function monoatomicCenterSeparation(params: TightBindingMonoatomicParams): number {
  validateMonoatomic(params)
  return params.centerP + 2 * params.absTP - (params.centerS - 2 * params.tS)
}

/** Rapporto m* / m₀ analitico al fondo (k = 0) o in cima (k = ±π/a) di una banda a coseno. */
export function cosineBandExtremumMassRatio(
  tSigned: number,
  a: number,
  at: 'bottom' | 'top'
): number {
  if (!(a > 0) || !Number.isFinite(tSigned) || Math.abs(tSigned) === 0) {
    return at === 'bottom' ? Infinity : -Infinity
  }
  const mag = HBAR2_OVER_2M0 / (Math.abs(tSigned) * a * a)
  return at === 'bottom' ? mag : -mag
}

/**
 * Carattere legante/antilegante nella catena monoatomica lungo il cammino [−π/a, π/a]:
 *  - banda s: cos(ka) > 0 → legante (massimo vicino a k = 0), cos(ka) < 0 → antilegante (bordo);
 *  - banda p: cos(ka) < 0 → legante (bordo π/a), cos(ka) > 0 → antilegante (k = 0).
 */
export function monoatomicBondingCharacter(
  band: TightBindingBandKind,
  k: number,
  a: number
): BondingCharacter {
  const c = Math.cos(k * a)
  const signed = band === 's' ? c : -c
  if (signed > 0.15) return 'bonding'
  if (signed < -0.15) return 'antibonding'
  return 'mixed'
}

/** Bande [E_s, E_p] su un cammino 1D come BandStructure. */
export function tightBindingMonoatomicBands(
  params: TightBindingMonoatomicParams,
  path: KPath
): BandStructure {
  validateMonoatomic(params)
  if (path.dimension !== 1) throw new RangeError('tightBindingMonoatomicBands: serve un cammino 1D')
  const n = path.points.length
  const es = new Float64Array(n)
  const ep = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const c = Math.cos(path.points[i][0] * params.a)
    es[i] = params.centerS - 2 * params.tS * c
    ep[i] = params.centerP + 2 * params.absTP * c
  }
  return {
    method: 'tight-binding',
    path,
    energies: [es, ep]
  }
}

/** Andamento dei bordi [sMin, sMax, pMin, pMax] in funzione di a con t(a) esponenziale indicativa. */
export function monoatomicEdgesVsDistance(
  aValues: readonly number[],
  config: {
    readonly centerS: number
    readonly centerP: number
    readonly tSAtA0: number
    readonly absTPAtA0: number
    readonly a0: number
    readonly ell: number
  }
): TightBindingEdgePoint[] {
  return aValues.map((a) => {
    const tS = indicativeHoppingAtDistance(a, config.a0, config.tSAtA0, config.ell)
    const absTP = indicativeHoppingAtDistance(a, config.a0, config.absTPAtA0, config.ell)
    return {
      a,
      sMin: config.centerS - 2 * tS,
      sMax: config.centerS + 2 * tS,
      pMin: config.centerP - 2 * absTP,
      pMax: config.centerP + 2 * absTP
    }
  })
}

/**
 * Stato esatto della catena biatomica A–B (P4 §2):
 *  E±(k) = (E_A + E_B)/2 ± √[((E_B − E_A)/2)² + 4t²·cos²(ka/2)].
 */
export function diatomicStateAt(params: TightBindingDiatomicParams, k: number): DiatomicState {
  validateDiatomic(params)
  if (!Number.isFinite(k)) throw new RangeError(`k non valido: ${k}`)
  const mean = 0.5 * (params.eA + params.eB)
  const halfDiff = 0.5 * (params.eB - params.eA)
  const coupling = 2 * params.t * Math.cos(0.5 * k * params.a)
  const delta = Math.hypot(halfDiff, coupling)
  const eMinus = mean - delta
  const ePlus = mean + delta

  let wMinus: { bA: number; bB: number; bA2: number; bB2: number }
  let wPlus: { bA: number; bB: number; bA2: number; bB2: number }

  if (delta === 0) {
    // Limite degenere E_A = E_B al bordo di zona k = ±π/a: si preserva la continuità dal ramo interno.
    wMinus = { bA: Math.SQRT1_2, bB: Math.SQRT1_2, bA2: 0.5, bB2: 0.5 }
    wPlus = { bA: Math.SQRT1_2, bB: -Math.SQRT1_2, bA2: 0.5, bB2: 0.5 }
  } else if (Math.abs(coupling) <= 1e-12 * Math.max(1, delta)) {
    // Al bordo di zona k = ±π/a con E_B > E_A: E_- è puro A, E_+ è puro B.
    wMinus = { bA: 1, bB: 0, bA2: 1, bB2: 0 }
    wPlus = { bA: 0, bB: 1, bA2: 0, bB2: 1 }
  } else {
    const signC = coupling >= 0 ? 1 : -1
    // Per E_- = mean - delta: b_A² = (delta + halfDiff)/(2*delta) quando E_A <= E_B.
    const bA2Minus = 0.5 * (1 + halfDiff / delta)
    const bB2Minus = Math.max(0, 1 - bA2Minus)
    const bAMinus = Math.sqrt(bA2Minus)
    const bBMinus = signC * Math.sqrt(bB2Minus)
    wMinus = { bA: bAMinus, bB: bBMinus, bA2: bA2Minus, bB2: bB2Minus }

    const bA2Plus = Math.max(0, 1 - bA2Minus)
    const bB2Plus = bA2Minus
    const bAPlus = Math.sqrt(bA2Plus)
    const bBPlus = -signC * Math.sqrt(bB2Plus)
    wPlus = { bA: bAPlus, bB: bBPlus, bA2: bA2Plus, bB2: bB2Plus }
  }

  return {
    energies: [eMinus, ePlus],
    weights: [wMinus, wPlus]
  }
}

/** Gap al bordo di zona k = ±π/a nella catena biatomica: E_g = E_B − E_A. */
export function diatomicGapAtZoneEdge(params: TightBindingDiatomicParams): number {
  validateDiatomic(params)
  return params.eB - params.eA
}

/** Separazione in k = 0 tra le bande biatomiche: 2·√[¼(E_B − E_A)² + 4t²]. */
export function diatomicCenterSeparation(params: TightBindingDiatomicParams): number {
  validateDiatomic(params)
  const diff = params.eB - params.eA
  return 2 * Math.sqrt(0.25 * diff * diff + 4 * params.t * params.t)
}

/** Larghezza esatta (uguale per valenza e conduzione) delle due bande biatomiche. */
export function diatomicExactBandwidth(params: TightBindingDiatomicParams): number {
  validateDiatomic(params)
  const halfDiff = 0.5 * (params.eB - params.eA)
  return Math.hypot(halfDiff, 2 * params.t) - halfDiff
}

/** Stima asintotica W ≃ 4t²/(E_B − E_A) valida per t ≪ E_B − E_A (P4 §2). */
export function diatomicApproxBandwidth(params: TightBindingDiatomicParams): number {
  validateDiatomic(params)
  const diff = params.eB - params.eA
  if (diff <= 0) return Infinity
  return (4 * params.t * params.t) / diff
}

/**
 * Massa efficace analitica al bordo di zona k = ±π/a (gap della catena biatomica):
 * m*_c / m₀ = ħ²(E_B − E_A) / (2 m₀ t² a²), m*_v = −m*_c (P4 §2).
 */
export function diatomicGapEffectiveMassRatio(
  params: TightBindingDiatomicParams,
  band: 0 | 1
): number {
  validateDiatomic(params)
  const diff = params.eB - params.eA
  if (params.t === 0) return band === 1 ? Infinity : -Infinity
  if (diff === 0) return 0
  const mag = (HBAR2_OVER_M0 * diff) / (2 * params.t * params.t * params.a * params.a)
  return band === 1 ? mag : -mag
}

/** Carattere legante/antilegante nella catena biatomica rispetto al legame A–B. */
export function diatomicBondingCharacter(
  band: 0 | 1,
  k: number,
  params: TightBindingDiatomicParams
): BondingCharacter {
  const c = Math.cos(0.5 * k * params.a)
  if (c < 0.15 && params.eB - params.eA > 1e-6) return 'mixed'
  return band === 0 ? 'bonding' : 'antibonding'
}

/** Bande [E_-, E_+] della catena biatomica su un cammino 1D come BandStructure. */
export function tightBindingDiatomicBands(
  params: TightBindingDiatomicParams,
  path: KPath
): BandStructure {
  validateDiatomic(params)
  if (path.dimension !== 1) throw new RangeError('tightBindingDiatomicBands: serve un cammino 1D')
  const n = path.points.length
  const eMinus = new Float64Array(n)
  const ePlus = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const st = diatomicStateAt(params, path.points[i][0])
    eMinus[i] = st.energies[0]
    ePlus[i] = st.energies[1]
  }
  return {
    method: 'tight-binding',
    path,
    energies: [eMinus, ePlus]
  }
}

/**
 * Sposta tutte le bande di una BandStructure in energia così che il minimo della
 * banda più bassa coincida con `targetBottom` (usato per il confronto con i quasi liberi).
 */
export function alignBandStructureBottom(bands: BandStructure, targetBottom: number): BandStructure {
  if (bands.energies.length === 0) return bands
  let lowest = Infinity
  for (const v of bands.energies[0]) {
    if (v < lowest) lowest = v
  }
  const shift = targetBottom - lowest
  const shifted = bands.energies.map((band) => {
    const out = new Float64Array(band.length)
    for (let i = 0; i < band.length; i++) out[i] = band[i] + shift
    return out
  })
  return {
    method: bands.method,
    path: bands.path,
    energies: shifted
  }
}

/** Orbitale 1D modello s (gaussiana normalizzata in L²(ℝ)). */
export function modelOrbitalS(u: number, sigma: number): number {
  const norm = Math.pow(Math.PI * sigma * sigma, -0.25)
  return norm * Math.exp(-(u * u) / (2 * sigma * sigma))
}

/** Orbitale 1D modello p lungo la catena (x·gaussiana normalizzata in L²(ℝ)). */
export function modelOrbitalP(u: number, sigma: number): number {
  const norm = Math.pow(4 / (Math.PI * Math.pow(sigma, 6)), 0.25)
  return norm * u * Math.exp(-(u * u) / (2 * sigma * sigma))
}

/**
 * Campiona Re ψ_k(x) e |ψ_k(x)|² per la catena monoatomica (orbitali modello s o p)
 * su una griglia `xs`, normalizzando la densità in modo che la media su una cella sia 1.
 */
export function monoatomicWaveSamples(
  a: number,
  k: number,
  band: TightBindingBandKind,
  xs: ArrayLike<number>
): TightBindingWaveSamples {
  if (!(a > 0) || !Number.isFinite(k)) throw new RangeError('parametri non validi per monoatomicWaveSamples')
  const sigma = band === 's' ? 0.31 * a : 0.27 * a
  const evalPhi = band === 's' ? modelOrbitalS : modelOrbitalP
  const nCellSamples = 96
  let cellMean = 0
  for (let m = 0; m < nCellSamples; m++) {
    const x = ((m + 0.5) * a) / nCellSamples
    const [re, im] = sumMonoatomicSite(x, a, k, sigma, evalPhi)
    cellMean += re * re + im * im
  }
  cellMean /= nCellSamples
  const scale = cellMean > 1e-18 ? 1 / Math.sqrt(cellMean) : 1

  const rePsi = new Float64Array(xs.length)
  const density = new Float64Array(xs.length)
  for (let i = 0; i < xs.length; i++) {
    const [re, im] = sumMonoatomicSite(xs[i], a, k, sigma, evalPhi)
    const r = re * scale
    const imS = im * scale
    rePsi[i] = r
    density[i] = r * r + imS * imS
  }
  return { rePsi, density }
}

/**
 * Campiona Re ψ_k(x) e |ψ_k(x)|² per la catena biatomica A–B sommando gaussiane modello
 * centrate su A (n·a) e B ((n+½)·a) pesate per b_A e b̃_B e normalizzate a media 1 su cella.
 */
export function diatomicWaveSamples(
  params: TightBindingDiatomicParams,
  k: number,
  band: 0 | 1,
  xs: ArrayLike<number>
): TightBindingWaveSamples {
  validateDiatomic(params)
  const st = diatomicStateAt(params, k)
  const { bA, bB } = st.weights[band]
  const sigma = 0.16 * params.a
  const nCellSamples = 96
  let cellMean = 0
  for (let m = 0; m < nCellSamples; m++) {
    const x = ((m + 0.5) * params.a) / nCellSamples
    const [re, im] = sumDiatomicSite(x, params.a, k, bA, bB, sigma)
    cellMean += re * re + im * im
  }
  cellMean /= nCellSamples
  const scale = cellMean > 1e-18 ? 1 / Math.sqrt(cellMean) : 1

  const rePsi = new Float64Array(xs.length)
  const density = new Float64Array(xs.length)
  for (let i = 0; i < xs.length; i++) {
    const [re, im] = sumDiatomicSite(xs[i], params.a, k, bA, bB, sigma)
    const r = re * scale
    const imS = im * scale
    rePsi[i] = r
    density[i] = r * r + imS * imS
  }
  return { rePsi, density }
}

function sumMonoatomicSite(
  x: number,
  a: number,
  k: number,
  sigma: number,
  evalPhi: (u: number, sigma: number) => number
): [number, number] {
  const nCenter = Math.round(x / a)
  let re = 0
  let im = 0
  for (let n = nCenter - 4; n <= nCenter + 4; n++) {
    const phi = evalPhi(x - n * a, sigma)
    const phase = k * n * a
    re += Math.cos(phase) * phi
    im += Math.sin(phase) * phi
  }
  return [re, im]
}

function sumDiatomicSite(
  x: number,
  a: number,
  k: number,
  bA: number,
  bB: number,
  sigma: number
): [number, number] {
  const nCenter = Math.round(x / a)
  let re = 0
  let im = 0
  for (let n = nCenter - 4; n <= nCenter + 4; n++) {
    const xA = n * a
    const phiA = modelOrbitalS(x - xA, sigma)
    const pA = k * xA
    re += bA * Math.cos(pA) * phiA
    im += bA * Math.sin(pA) * phiA

    const xB = (n + 0.5) * a
    const phiB = modelOrbitalS(x - xB, sigma)
    const pB = k * xB
    re += bB * Math.cos(pB) * phiB
    im += bB * Math.sin(pB) * phiB
  }
  return [re, im]
}

function validateMonoatomic(p: TightBindingMonoatomicParams): void {
  if (!(p.a > 0)) throw new RangeError(`passo reticolare non valido: ${p.a}`)
  if (!Number.isFinite(p.centerS) || !Number.isFinite(p.centerP) || p.tS < 0 || p.absTP < 0) {
    throw new RangeError('parametri non validi per la catena monoatomica')
  }
}

function validateDiatomic(p: TightBindingDiatomicParams): void {
  if (!(p.a > 0)) throw new RangeError(`passo reticolare non valido: ${p.a}`)
  if (!Number.isFinite(p.eA) || !Number.isFinite(p.eB) || p.t < 0 || p.eB < p.eA - 1e-12) {
    throw new RangeError('parametri non validi per la catena biatomica (serve E_B ≥ E_A, t ≥ 0)')
  }
}
