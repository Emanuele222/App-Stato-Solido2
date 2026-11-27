/**
 * Fisica del calore specifico del reticolo cristallino
 * (dispensa Parte 6, Lezione 4: §§20–23, §25, Tabb. 2–4, eqq. 52–59 e 61–62).
 *
 * Modulo TypeScript puro (nessun import React/DOM).
 * Unità principali:
 * - Temperature T, Θ_E, Θ_D in K
 * - Calore specifico molare C_V in J·mol⁻¹·K⁻¹ (e adimensionale C_V / 3R)
 * - Energia termica molare U_term in J·mol⁻¹
 * - Pulsazione ω in rad·s⁻¹ (o adimensionale w = ω / ω_D)
 * - Densità di energia fononica/fotonica ũ in J·m⁻³
 */
import { C_LIGHT_M_S, HBAR_J_S, KB_EV_K, KB_J_K, R_GAS, THZ_TO_MEV } from './constants'

/** Valore classico molare di Dulong–Petit: 3R ≈ 24,943 J·mol⁻¹·K⁻¹ (eq. 52). */
export const THREE_R = 3 * R_GAS

/** Costante esatta del limite di bassa temperatura di Debye: 12π⁴ / 5 ≈ 233,7798. */
export const DEBYE_T3_PREFACTOR = (12 * Math.PI ** 4) / 5

/**
 * Nodi e pesi della quadratura di Gauss–Legendre a 16 punti su [-1, 1]
 * (simmetrici attorno a 0, precisione doppia piena).
 */
const GL16_HALF_NODES: readonly number[] = [
  0.09501250983763744,
  0.2816035507792589,
  0.4580167776572274,
  0.6178762444026438,
  0.755404408355003,
  0.8656312023878318,
  0.9445750230732326,
  0.9894009349916499
]

const GL16_HALF_WEIGHTS: readonly number[] = [
  0.1894506104550685,
  0.18260341504492358,
  0.16915651939500254,
  0.14959598881657673,
  0.12462897125553388,
  0.09515851168249279,
  0.062253523938647894,
  0.027152459411754095
]

/** Integra `fn` su [a, b] con quadratura di Gauss–Legendre a 16 punti. */
function gaussLegendre16(fn: (x: number) => number, a: number, b: number): number {
  if (b <= a) return 0
  const mid = 0.5 * (a + b)
  const half = 0.5 * (b - a)
  let sum = 0
  for (let i = 0; i < GL16_HALF_NODES.length; i++) {
    const dx = half * GL16_HALF_NODES[i]
    sum += GL16_HALF_WEIGHTS[i] * (fn(mid - dx) + fn(mid + dx))
  }
  return half * sum
}

/** Punti di suddivisione compositi su [0, 65] per gli integrali di Debye. */
const DEBYE_BREAKPOINTS: readonly number[] = [0, 0.5, 1.5, 3.5, 7.5, 15, 32, 65]

/** Integrazione composita Gauss–Legendre su [0, upper] con nodi concentrati vicino a 0 e al picco. */
function integrateDebyeComposite(fn: (x: number) => number, upper: number): number {
  if (upper <= 0) return 0
  const uCap = Math.min(upper, 65)
  let sum = 0
  for (let i = 0; i < DEBYE_BREAKPOINTS.length - 1; i++) {
    const lo = DEBYE_BREAKPOINTS[i]
    if (lo >= uCap) break
    const hi = Math.min(uCap, DEBYE_BREAKPOINTS[i + 1])
    sum += gaussLegendre16(fn, lo, hi)
  }
  return sum
}

// ---------------------------------------------------------------------------
// 1. Dulong–Petit (1819, eq. 52)
// ---------------------------------------------------------------------------

/** Calore specifico molare classico di Dulong–Petit: C_V = 3R (J·mol⁻¹·K⁻¹). */
export function dulongPetitCv(): number {
  return THREE_R
}

// ---------------------------------------------------------------------------
// 2. Modello di Einstein (1907, eqq. 53–55)
// ---------------------------------------------------------------------------

/**
 * Funzione di Einstein adimensionale per un singolo modo di oscillazione:
 *   ℰ(x) = x² e^x / (e^x - 1)² = (x / (2 sinh(x/2)))²
 * Stabile numericamente per ogni x ≥ 0 (sviluppo di Taylor per x → 0⁺,
 * riscrittura con e^(-x) ed expm1(-x) senza overflow per x grande).
 */
export function einsteinFunction(x: number): number {
  if (!Number.isFinite(x)) return x > 0 ? 0 : 1
  if (x <= 0) return 1
  if (x < 1e-4) {
    const x2 = x * x
    return 1 - x2 / 12 + (x2 * x2) / 240
  }
  if (x > 700) return 0
  const oneMinusExp = -Math.expm1(-x)
  return (x * x * Math.exp(-x)) / (oneMinusExp * oneMinusExp)
}

/** Calore specifico molare di Einstein C_V^E(T) = 3R · ℰ(Θ_E / T) in J·mol⁻¹·K⁻¹ (eq. 54). */
export function einsteinCv(temperatureK: number, thetaEK: number): number {
  if (temperatureK <= 0) return 0
  if (thetaEK <= 0) return THREE_R
  return THREE_R * einsteinFunction(thetaEK / temperatureK)
}

/** Rapporto adimensionale C_V^E(T) / 3R = ℰ(Θ_E / T). */
export function einsteinCvRatio(temperatureK: number, thetaEK: number): number {
  if (temperatureK <= 0) return 0
  if (thetaEK <= 0) return 1
  return einsteinFunction(thetaEK / temperatureK)
}

/** Sviluppo asintotico di Einstein ad alta temperatura: 3R [1 - (1/12)(Θ_E/T)²] (§21.4). */
export function einsteinHighTAsymptote(temperatureK: number, thetaEK: number): number {
  if (temperatureK <= 0) return 0
  const x = thetaEK / temperatureK
  return THREE_R * (1 - (x * x) / 12)
}

/** Sviluppo asintotico di Einstein a bassa temperatura: 3R (Θ_E/T)² e^(-Θ_E/T) (eq. 55). */
export function einsteinLowTAsymptote(temperatureK: number, thetaEK: number): number {
  if (temperatureK <= 0) return 0
  const x = thetaEK / temperatureK
  if (x > 700) return 0
  return THREE_R * x * x * Math.exp(-x)
}

// ---------------------------------------------------------------------------
// 3. Modello di Debye (1912, eqq. 56–59)
// ---------------------------------------------------------------------------

/** Integrando di Debye per il calore specifico: x⁴ e^x / (e^x - 1)² = x² ℰ(x). */
function debyeHeatIntegrand(x: number): number {
  if (x <= 0) return 0
  return x * x * einsteinFunction(x)
}

/** Integrando di Debye per l'energia interna: x³ / (e^x - 1). */
function debyeEnergyIntegrand(x: number): number {
  if (x <= 0) return 0
  if (x < 1e-4) {
    return x * x * (1 - 0.5 * x + (x * x) / 12 - (x ** 4) / 720)
  }
  if (x > 700) return 0
  return (x * x * x * Math.exp(-x)) / (-Math.expm1(-x))
}

/**
 * Funzione integrale di Debye:
 *   D₃(u) = (3 / u³) ∫₀^u x⁴ e^x / (e^x - 1)² dx
 * così che C_V^D(T) = 3R · D₃(Θ_D / T).
 * Calcolata con quadratura composita di Gauss–Legendre a 16 punti per subintervallo
 * (e sviluppo di Taylor per u < 10⁻³ per evitare cancellazioni).
 */
export function debyeIntegralD3(u: number): number {
  if (!Number.isFinite(u)) return u > 0 ? 0 : 1
  if (u <= 0) return 1
  if (u < 1e-3) {
    const u2 = u * u
    return 1 - u2 / 20 + (u2 * u2) / 560 - (u2 * u2 * u2) / 18144
  }
  const integral = integrateDebyeComposite(debyeHeatIntegrand, u)
  return (3 * integral) / (u * u * u)
}

/**
 * Funzione integrale per l'energia interna di Debye:
 *   Φ_D(u) = (3 / u³) ∫₀^u x³ / (e^x - 1) dx
 * così che U_term(T) = 3RT · Φ_D(Θ_D / T) = 9RT (T/Θ_D)³ ∫₀^(Θ_D/T) x³/(e^x - 1) dx (eq. 58).
 */
export function debyeEnergyIntegral(u: number): number {
  if (!Number.isFinite(u)) return u > 0 ? 0 : 1
  if (u <= 0) return 1
  if (u < 1e-3) {
    const u2 = u * u
    return 1 - (3 * u) / 8 + u2 / 20 - (u2 * u2) / 1680
  }
  const integral = integrateDebyeComposite(debyeEnergyIntegrand, u)
  return (3 * integral) / (u * u * u)
}

/** Calore specifico molare di Debye C_V^D(T) = 3R · D₃(Θ_D / T) in J·mol⁻¹·K⁻¹ (eq. 58). */
export function debyeCv(temperatureK: number, thetaDK: number): number {
  if (temperatureK <= 0) return 0
  if (thetaDK <= 0) return THREE_R
  return THREE_R * debyeIntegralD3(thetaDK / temperatureK)
}

/** Rapporto adimensionale C_V^D(T) / 3R = D₃(Θ_D / T). */
export function debyeCvRatio(temperatureK: number, thetaDK: number): number {
  if (temperatureK <= 0) return 0
  if (thetaDK <= 0) return 1
  return debyeIntegralD3(thetaDK / temperatureK)
}

/** Energia termica molare di Debye U_term(T) in J·mol⁻¹ (eq. 58, senza termine di punto zero). */
export function debyeThermalEnergyMolarJ(temperatureK: number, thetaDK: number): number {
  if (temperatureK <= 0) return 0
  if (thetaDK <= 0) return THREE_R * temperatureK
  return THREE_R * temperatureK * debyeEnergyIntegral(thetaDK / temperatureK)
}

/** Legge T³ asintotica di Debye a bassa temperatura (eq. 59): (12π⁴/5) R (T/Θ_D)³ in J·mol⁻¹·K⁻¹. */
export function debyeLowTCv(temperatureK: number, thetaDK: number): number {
  if (temperatureK <= 0 || thetaDK <= 0) return 0
  const r = temperatureK / thetaDK
  return DEBYE_T3_PREFACTOR * R_GAS * r * r * r
}

/** Rapporto adimensionale della legge T³: (4π⁴/5) (T/Θ_D)³ = C_V^(T³) / 3R. */
export function debyeLowTCvRatio(temperatureK: number, thetaDK: number): number {
  if (temperatureK <= 0 || thetaDK <= 0) return 0
  const r = temperatureK / thetaDK
  return (DEBYE_T3_PREFACTOR / 3) * r * r * r
}

/** Sviluppo asintotico di Debye ad alta temperatura (§22.6): 3R [1 - (1/20)(Θ_D/T)²]. */
export function debyeHighTAsymptote(temperatureK: number, thetaDK: number): number {
  if (temperatureK <= 0) return 0
  const u = thetaDK / temperatureK
  return THREE_R * (1 - (u * u) / 20)
}

// ---------------------------------------------------------------------------
// 4. Scale di frequenza, densità degli stati (DOS) e analogia corpo nero
// ---------------------------------------------------------------------------

/** Pulsazione di Debye ω_D = k_B Θ_D / ħ in rad·s⁻¹ (eq. 57). */
export function debyeOmegaRadS(thetaDK: number): number {
  return (KB_J_K * thetaDK) / HBAR_J_S
}

/** Frequenza di Debye ν_D = ω_D / (2π) in THz. */
export function debyeFreqThz(thetaDK: number): number {
  return debyeOmegaRadS(thetaDK) / (2 * Math.PI * 1e12)
}

/** Energia massima di Debye ħω_D = k_B Θ_D in meV. */
export function debyeEnergyMev(thetaDK: number): number {
  return KB_EV_K * thetaDK * 1e3
}

/** Scala di energia termica k_B T in meV e frequenza corrispondente k_B T / ħ. */
export function thermalScaleMev(temperatureK: number): number {
  return KB_EV_K * temperatureK * 1e3
}

/** Pulsazione termica ω_T = k_B T / ħ in rad·s⁻¹. */
export function thermalOmegaRadS(temperatureK: number): number {
  return (KB_J_K * temperatureK) / HBAR_J_S
}

/**
 * Frazione lineare k_T / k_D = T / Θ_D del raggio termico nella sfera di Debye
 * (limitata a 1 per il raggio geometrico dentro la sfera, §22.7).
 */
export function debyeThermalSphereRadiusFraction(temperatureK: number, thetaDK: number): number {
  if (temperatureK <= 0 || thetaDK <= 0) return 0
  return Math.min(1, temperatureK / thetaDK)
}

/**
 * DOS adimensionale di Debye per polarizzazione, normalizzata a ∫₀¹ g̃(w) dw = 1
 * (corrisponde a g(ω) · (ω_D / N) = 3(ω/ω_D)² con 3∫₀^{ω_D} g(ω)dω = 3N, eq. 56).
 * Vale per w = ω / ω_D ∈ [0, 1]; è 0 per w > 1.
 */
export function debyeDosDimless(w: number): number {
  if (w < 0 || w > 1) return 0
  return 3 * w * w
}

/**
 * DOS fisica di Debye per polarizzazione g(ω) = Vω² / (2π² v_s³) = 3N ω² / ω_D³
 * espressa in unità di (modi molari per THz), cioè 3 N_A ω² / ω_D³ / (10¹² · 2π)?
 * Più direttamente, per unità adimensionale w = ω/ω_D l'integrando termico del calore
 * specifico (normalizzato a 3R) è 3 w² · ℰ(w · Θ_D / T).
 */
export function debyeSpectralContribution(w: number, temperatureK: number, thetaDK: number): number {
  if (w < 0 || w > 1 || temperatureK <= 0) return 0
  return debyeDosDimless(w) * einsteinFunction((w * thetaDK) / Math.max(1e-9, temperatureK))
}

/**
 * DOS fisica di Debye in unità di (3N / ω_D) per w = ω/ω_D:
 * per una polarizzazione vale N/ω_D · 3w², per 3 polarizzazioni vale 3N/ω_D · 3w².
 * Qui restituiamo il fattore g(ω) / (N/ω_D) = 3w² per polarizzazione (integrale = 1).
 */
export function debyeDosPerPolarizationNorm(omegaRadS: number, omegaDRadS: number): number {
  if (omegaDRadS <= 0 || omegaRadS < 0 || omegaRadS > omegaDRadS) return 0
  const w = omegaRadS / omegaDRadS
  return 3 * w * w
}

/**
 * DOS 1D della catena monatomica normalizzata a ∫₀¹ g̃_1D(w) dw = 1 (§23.2):
 *   g_1D(ω) = (2N / (π ω_max)) / √(1 - ω² / ω_max²)
 * in funzione di w = ω / ω_max ∈ [0, 1).
 * Restituisce Infinity esattamente a w = 1 (singolarità di Van Hove, v_g → 0).
 */
export function monatomicDos1DDimless(w: number): number {
  if (w < 0 || w >= 1) return w === 1 ? Infinity : 0
  return 2 / (Math.PI * Math.sqrt((1 - w) * (1 + w)))
}

/**
 * Calore specifico molare della catena monatomica 1D (con 1 ramo e N gradi di libertà,
 * normalizzato a R) oppure 3 copie indipendenti normalizzate a 3R:
 *   C_V^1D / (N k_B) = ∫₀¹ (2 / (π √(1 - w²))) ℰ(w · Θ_max / T) dw.
 */
export function monatomic1DCvRatio(temperatureK: number, thetaMaxK: number): number {
  if (temperatureK <= 0) return 0
  if (thetaMaxK <= 0) return 1
  // Cambio di variabile w = sin(θ) per rimuovere la singolarità integrabile a w → 1:
  // ∫₀^1 (2 / (π √(1-w²))) f(w) dw = (2/π) ∫₀^(π/2) f(sin θ) dθ.
  // Per u = Θ_max/T grande l'integrando è concentrato in θ ≲ 10/u: suddividiamo
  // dinamicamente sulla scala 1/u per mantenere precisione di macchina su tutto il dominio.
  const u = thetaMaxK / temperatureK
  const halfPi = Math.PI / 2
  const integrand = (t: number): number => einsteinFunction(u * Math.sin(t))
  if (u <= 6) {
    return (
      (2 / Math.PI) *
      (gaussLegendre16(integrand, 0, halfPi * 0.5) +
        gaussLegendre16(integrand, halfPi * 0.5, halfPi))
    )
  }
  const rawBreaks = [0, 1.5 / u, 4 / u, 10 / u, 25 / u, 65 / u, halfPi * 0.5, halfPi]
  const breaks: number[] = [0]
  for (const b of rawBreaks) {
    const clamped = Math.min(halfPi, b)
    if (clamped > breaks[breaks.length - 1] + 1e-12) breaks.push(clamped)
  }
  let integral = 0
  for (let i = 0; i < breaks.length - 1; i++) {
    integral += gaussLegendre16(integrand, breaks[i], breaks[i + 1])
  }
  return (2 / Math.PI) * integral
}

/**
 * Distribuzioni statistiche di occupazione (Fig. 22, §21.2):
 * x = (E - μ) / k_B T (per i fononi μ = 0, x = ħω / k_B T > 0).
 */
export function fermiDiracOccupancy(x: number): number {
  if (x > 700) return 0
  if (x < -700) return 1
  return 1 / (Math.exp(x) + 1)
}

export function maxwellBoltzmannOccupancy(x: number): number {
  if (x > 700) return 0
  if (x < -700) return Infinity
  return Math.exp(-x)
}

export function boseEinsteinOccupancy(x: number): number {
  if (x <= 0) return Infinity
  if (x > 700) return 0
  return 1 / Math.expm1(x)
}

// ---------------------------------------------------------------------------
// 5. Analogia con il corpo nero (§25, eq. 62)
// ---------------------------------------------------------------------------

/**
 * Densità di energia fononica a bassa temperatura (T ≪ Θ_D, 3 polarizzazioni acustiche
 * con velocità media v_s):
 *   ũ_ph(T) = (π² k_B⁴ / (10 ħ³ v_s³)) T⁴  [J·m⁻³]  (eq. 62)
 */
export function phononBlackBodyEnergyDensity(temperatureK: number, soundSpeedMS: number): number {
  if (temperatureK <= 0 || soundSpeedMS <= 0) return 0
  const num = Math.PI ** 2 * KB_J_K ** 4 * temperatureK ** 4
  const den = 10 * HBAR_J_S ** 3 * soundSpeedMS ** 3
  return num / den
}

/**
 * Densità di energia della radiazione di corpo nero (2 polarizzazioni trasversali):
 *   ũ_γ(T) = (π² k_B⁴ / (15 ħ³ c³)) T⁴  [J·m⁻³]  (§25)
 */
export function photonBlackBodyEnergyDensity(temperatureK: number): number {
  if (temperatureK <= 0) return 0
  const num = Math.PI ** 2 * KB_J_K ** 4 * temperatureK ** 4
  const den = 15 * HBAR_J_S ** 3 * C_LIGHT_M_S ** 3
  return num / den
}

/**
 * Rapporto strutturale delle polarizzazioni nell'analogia corpo nero a parità di velocità:
 * 3 polarizzazioni fononiche / 2 polarizzazioni fotoniche = 3/2 = 1,5.
 */
export const PHONON_TO_PHOTON_POLARIZATION_FACTOR = 3 / 2

// ---------------------------------------------------------------------------
// 6. Dataset sperimentale e tabellare della dispensa (Tab. 2 e Tab. 3, pp. 51, 58)
// ---------------------------------------------------------------------------

export interface ExperimentalCvPoint {
  readonly temperatureK: number
  readonly cvJmolK: number
  readonly source: 'tab2-slide' | 'dispensa-diamond-77k'
  readonly note?: string
}

export interface MaterialPresetData {
  readonly id: string
  readonly symbol: string
  readonly name: string
  readonly thetaDK: number
  /** Valore alternativo di Θ_D segnalato nel testo della dispensa (es. diamante 1880 K nel grafico delle slide). */
  readonly thetaDAltK?: number
  /** Rapporto illustrativo di default Θ_E / Θ_D. */
  readonly defaultEinsteinRatio: number
  /** Velocità del suono rappresentativa (m/s) per il confronto corpo nero (§25). */
  readonly approxSoundSpeedMS: number
  /** Punti sperimentali / di riferimento dalla dispensa (Tab. 2 e §22.7). */
  readonly experimentalPoints: readonly ExperimentalCvPoint[]
  /** Valori Debye calcolati dalla Tab. 2 della dispensa a 77 K e 273 K (per verifica). */
  readonly dispensaTab2Debye?: {
    readonly cv77K: number
    readonly cv273K: number
  }
  readonly thetaDSource: 'tab2-slide' | 'tab2-kittel' | 'tab3-kittel'
  readonly description: string
}

/**
 * I 9 preset della dispensa (Tab. 2 p. 51 e Tab. 3 p. 58).
 * Le velocità del suono indicative servono solo per il confronto dimensionale ũ_ph vs ũ_γ (§25).
 */
export const MATERIAL_PRESETS: readonly MaterialPresetData[] = [
  {
    id: 'copper',
    symbol: 'Cu',
    name: 'Rame',
    thetaDK: 343,
    defaultEinsteinRatio: 0.75,
    approxSoundSpeedMS: 3800,
    experimentalPoints: [
      { temperatureK: 77, cvJmolK: 12.5, source: 'tab2-slide' },
      { temperatureK: 273, cvJmolK: 24.3, source: 'tab2-slide' }
    ],
    dispensaTab2Debye: { cv77K: 10.9, cv273K: 23.1 },
    thetaDSource: 'tab2-slide',
    description: 'Metallo tipico (ω_D ≈ 4,5·10¹³ s⁻¹); a 273 K è vicino a 3R, a 77 K scende a ~12,5 J/(mol·K).'
  },
  {
    id: 'aluminum',
    symbol: 'Al',
    name: 'Alluminio',
    thetaDK: 428,
    defaultEinsteinRatio: 0.75,
    approxSoundSpeedMS: 5100,
    experimentalPoints: [
      { temperatureK: 77, cvJmolK: 9.1, source: 'tab2-slide' },
      { temperatureK: 273, cvJmolK: 23.8, source: 'tab2-slide' }
    ],
    dispensaTab2Debye: { cv77K: 7.7, cv273K: 22.1 },
    thetaDSource: 'tab2-slide',
    description: 'Metallo leggero (Θ_D = 428 K): a 77 K il calore specifico è già circa un terzo di 3R.'
  },
  {
    id: 'silicon',
    symbol: 'Si',
    name: 'Silicio',
    thetaDK: 645,
    defaultEinsteinRatio: 0.75,
    approxSoundSpeedMS: 6500,
    experimentalPoints: [
      { temperatureK: 77, cvJmolK: 5.8, source: 'tab2-slide' },
      { temperatureK: 273, cvJmolK: 21.8, source: 'tab2-slide' }
    ],
    dispensaTab2Debye: { cv77K: 3.1, cv273K: 19.2 },
    thetaDSource: 'tab2-slide',
    description: 'Semiconduttore con Θ_D elevata: prova che la caduta a bassa T è vibrazionale, non elettronica.'
  },
  {
    id: 'diamond',
    symbol: 'C',
    name: 'Diamante',
    thetaDK: 2230,
    thetaDAltK: 1880,
    defaultEinsteinRatio: 0.75,
    approxSoundSpeedMS: 12000,
    experimentalPoints: [
      {
        temperatureK: 77,
        cvJmolK: 0.08,
        source: 'dispensa-diamond-77k',
        note: 'Dispensa §22.7 (legge T³ con Θ_D = 2230 K): ≈ 0,08 J/(mol·K)'
      }
    ],
    thetaDSource: 'tab3-kittel',
    description: 'Atomi leggeri e legami rigidi (Θ_D = 2230 K in Tab. 3; 1880 K nel grafico delle slide).'
  },
  {
    id: 'iron',
    symbol: 'Fe',
    name: 'Ferro',
    thetaDK: 470,
    defaultEinsteinRatio: 0.75,
    approxSoundSpeedMS: 4900,
    experimentalPoints: [
      { temperatureK: 77, cvJmolK: 8.1, source: 'tab2-slide' },
      { temperatureK: 273, cvJmolK: 24.8, source: 'tab2-slide' }
    ],
    dispensaTab2Debye: { cv77K: 6.4, cv273K: 21.6 },
    thetaDSource: 'tab2-slide',
    description: 'Metallo di transizione rigido: a 273 K raggiunge praticamente 3R, a 77 K scende a 8,1 J/(mol·K).'
  },
  {
    id: 'gold',
    symbol: 'Au',
    name: 'Oro',
    thetaDK: 165,
    defaultEinsteinRatio: 0.75,
    approxSoundSpeedMS: 2100,
    experimentalPoints: [
      { temperatureK: 77, cvJmolK: 19.1, source: 'tab2-slide' },
      { temperatureK: 273, cvJmolK: 25.2, source: 'tab2-slide' }
    ],
    dispensaTab2Debye: { cv77K: 20.0, cv273K: 24.5 },
    thetaDSource: 'tab2-slide',
    description: 'Atomi pesanti e Θ_D bassa (165 K): anche all’azoto liquido (77 K) resta a ~80% di 3R.'
  },
  {
    id: 'sodium',
    symbol: 'Na',
    name: 'Sodio',
    thetaDK: 158,
    defaultEinsteinRatio: 0.75,
    approxSoundSpeedMS: 2300,
    experimentalPoints: [
      { temperatureK: 77, cvJmolK: 20.4, source: 'tab2-slide' },
      {
        temperatureK: 273,
        cvJmolK: 27.6,
        source: 'tab2-slide',
        note: 'Supera 3R per anarmonicità / C_P − C_V (§20.3)'
      }
    ],
    dispensaTab2Debye: { cv77K: 20.4, cv273K: 24.5 },
    thetaDSource: 'tab2-kittel',
    description: 'Metallo alcalino tenero (Θ_D = 158 K da Kittel); a 273 K C_P supera 3R per effetti anarmonici.'
  },
  {
    id: 'lead',
    symbol: 'Pb',
    name: 'Piombo',
    thetaDK: 105,
    defaultEinsteinRatio: 0.75,
    approxSoundSpeedMS: 1300,
    experimentalPoints: [
      { temperatureK: 77, cvJmolK: 23.6, source: 'tab2-slide' },
      {
        temperatureK: 273,
        cvJmolK: 26.7,
        source: 'tab2-slide',
        note: 'Supera 3R per anarmonicità / C_P − C_V (§20.3)'
      }
    ],
    dispensaTab2Debye: { cv77K: 22.8, cv273K: 24.8 },
    thetaDSource: 'tab2-slide',
    description: 'Molle e pesante (Θ_D = 105 K): già a 77 K è prossimo al limite classico di Dulong–Petit.'
  },
  {
    id: 'cesium',
    symbol: 'Cs',
    name: 'Cesio',
    thetaDK: 38,
    defaultEinsteinRatio: 0.75,
    approxSoundSpeedMS: 970,
    experimentalPoints: [],
    thetaDSource: 'tab3-kittel',
    description: 'Elemento più molle e pesante in Tab. 3 (Θ_D = 38 K): è già classico anche all’azoto liquido.'
  }
]

/** Converte C_V (J·mol⁻¹·K⁻¹) nel rapporto adimensionale C_V / 3R e viceversa. */
export function cvToRatio(cvJmolK: number): number {
  return cvJmolK / THREE_R
}

export function ratioToCv(ratio: number): number {
  return ratio * THREE_R
}

/** Riepilogo dei valori termodinamici calcolati per un punto (T, Θ_D, Θ_E/Θ_D). */
export interface SpecificHeatSummary {
  readonly temperatureK: number
  readonly thetaDK: number
  readonly thetaEK: number
  readonly einsteinRatio: number
  readonly dulongPetitJmolK: number
  readonly einsteinJmolK: number
  readonly einsteinNorm: number
  readonly debyeJmolK: number
  readonly debyeNorm: number
  readonly debyeT3JmolK: number
  readonly debyeT3Norm: number
  readonly thermalEnergyJmol: number
  readonly omegaDRadS: number
  readonly freqDThz: number
  readonly energyDMev: number
  readonly thermalEnergyMev: number
  readonly sphereRadiusFraction: number
  readonly tOverThetaD: number
  readonly tOverThetaE: number
}

export function specificHeatSummary(
  temperatureK: number,
  thetaDK: number,
  einsteinRatio: number
): SpecificHeatSummary {
  const thetaEK = thetaDK * einsteinRatio
  const einsteinNorm = einsteinCvRatio(temperatureK, thetaEK)
  const debyeNorm = debyeCvRatio(temperatureK, thetaDK)
  const debyeT3Norm = debyeLowTCvRatio(temperatureK, thetaDK)
  return {
    temperatureK,
    thetaDK,
    thetaEK,
    einsteinRatio,
    dulongPetitJmolK: THREE_R,
    einsteinJmolK: THREE_R * einsteinNorm,
    einsteinNorm,
    debyeJmolK: THREE_R * debyeNorm,
    debyeNorm,
    debyeT3JmolK: THREE_R * debyeT3Norm,
    debyeT3Norm,
    thermalEnergyJmol: debyeThermalEnergyMolarJ(temperatureK, thetaDK),
    omegaDRadS: debyeOmegaRadS(thetaDK),
    freqDThz: debyeFreqThz(thetaDK),
    energyDMev: debyeEnergyMev(thetaDK),
    thermalEnergyMev: thermalScaleMev(temperatureK),
    sphereRadiusFraction: debyeThermalSphereRadiusFraction(temperatureK, thetaDK),
    tOverThetaD: thetaDK > 0 ? temperatureK / thetaDK : 0,
    tOverThetaE: thetaEK > 0 ? temperatureK / thetaEK : 0
  }
}

/** Verifica di coerenza con la costante THZ_TO_MEV esportata. */
export function freqThzToMevLocal(freqThz: number): number {
  return freqThz * THZ_TO_MEV
}
