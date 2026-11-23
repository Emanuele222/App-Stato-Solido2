/**
 * Crosscheck numerico indipendente — Sezione 1 Fononi:
 * Catena monatomica 1D e prima zona di Brillouin.
 *
 * Fonti: materiale/parte6/dispensa.pdf (Lezione 1 §§1–5, Lezione 3 §13)
 *        e materiale/parte6/riferimento-formule.md.
 *
 * Tutte le formule fisiche di riferimento sono ricavate e implementate da zero
 * in questo file (senza condividere logica con src/renderer/src/physics/),
 * usando metodi numerici indipendenti (diagonalizzazione di Jacobi della matrice
 * delle costanti di forza N×N, verifica diretta sull'equazione di Newton discreta,
 * differenze finite centrate al 2° e 4° ordine, formula asinh priva di cancellazione
 * per il decadimento evanescente).
 *
 * Esecuzione (dalla root del repository):
 *   .\.tools\node\node.exe crosscheck/fononi/phonon_monatomic.mjs
 */
import { registerHooks } from 'node:module'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Hook nativo Node 26 per risolvere gli import TypeScript senza estensione (es. './constants')
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context)
    } catch (err) {
      if (specifier.startsWith('.') && !specifier.endsWith('.ts') && context.parentURL) {
        return nextResolve(`${specifier}.ts`, context)
      }
      throw err
    }
  }
})

// Import del modulo reale sotto verifica (sola lettura, nessuna copia)
const app = await import('../../src/renderer/src/physics/phononDispersion.ts')
const appConst = await import('../../src/renderer/src/physics/constants.ts')

// ============================================================================
// 1. COSTANTI INDIPENDENTI (SI 2019 esatte + CODATA 2018 / dispensa Parte 6)
// ============================================================================
const H_SI = 6.62607015e-34            // J·s (esatta SI 2019)
const E_SI = 1.602176634e-19           // C   (esatta SI 2019)
const HBAR_SI = H_SI / (2 * Math.PI)   // J·s
const AMU_KG_SI = 1.6605390666e-27     // kg  (CODATA 2018; dispensa: 1.660539e-27)
const ANGSTROM_M = 1e-10               // m/Å

// Conversioni indipendenti direttamente da SI
const refRadSToThz = (w) => w / (2 * Math.PI * 1e12)
const refRadSToMev = (w) => (HBAR_SI * w) / (E_SI * 1e-3)
const refThzToMev = (nuThz) => ((H_SI * 1e12) / (E_SI * 1e-3)) * nuThz

// ============================================================================
// 2. IMPLEMENTAZIONE INDIPENDENTE DA ZERO (dalla dispensa Parte 6)
// ============================================================================

/** Scala √(C/M) in s⁻¹ con M in kg. */
const refSqrtCOverM_kg = (C, M_kg) => Math.sqrt(C / M_kg)

/** Scala √(C/M) in s⁻¹ con M in u.m.a. */
const refSqrtCOverM = (C, massAmu) => Math.sqrt(C / (massAmu * AMU_KG_SI))

/** Velocità del suono v_s = a √(C/M) in m/s (Lezione 1, eq. 9). */
const refSoundSpeed = (aAng, massAmu, C) => aAng * ANGSTROM_M * refSqrtCOverM(C, massAmu)

/** Pulsazione massima ω_max = 2√(C/M) in rad/s (Lezione 1, §3.3). */
const refOmegaMax = (massAmu, C) => 2 * refSqrtCOverM(C, massAmu)

/** Dispersione ω(k) = 2√(C/M) |sin(ka/2)| in rad/s (Lezione 1, eq. 8). */
const refOmega = (kAngInv, aAng, massAmu, C) =>
  refOmegaMax(massAmu, C) * Math.abs(Math.sin(0.5 * kAngInv * aAng))

/**
 * Velocità di gruppo analitica dω/dk in m/s (Lezione 1 §3.3, Lezione 3 §16):
 * Periodica su tutto ℝ: v_g(k) = v_s cos(ka/2) sgn(sin(ka/2)).
 */
function refGroupVelocityAnalytic(kAngInv, aAng, massAmu, C) {
  const vs = refSoundSpeed(aAng, massAmu, C)
  const halfKa = 0.5 * kAngInv * aAng
  const s = Math.sin(halfKa)
  if (Math.abs(s) < 1e-14) return 0
  const c = Math.cos(halfKa)
  if (Math.abs(c) < 1e-14) return 0
  return vs * c * Math.sign(s)
}

/**
 * Velocità di gruppo tramite differenze finite centrate al 4° ordine su ω(k):
 * dω/dk_m ≈ [-ω(k+2h) + 8ω(k+h) - 8ω(k-h) + ω(k-2h)] / (12 h_m)
 * con k e h in Å⁻¹ e h_m = h / 1e-10 in m⁻¹.
 */
function refGroupVelocityFD4(omegaFn, kAngInv, hAngInv = 1e-5) {
  const fP2 = omegaFn(kAngInv + 2 * hAngInv)
  const fP1 = omegaFn(kAngInv + hAngInv)
  const fM1 = omegaFn(kAngInv - hAngInv)
  const fM2 = omegaFn(kAngInv - 2 * hAngInv)
  const dOmegaDkAng = (-fP2 + 8 * fP1 - 8 * fM1 + fM2) / (12 * hAngInv)
  // dω/dk_m = (dω/dk_Å⁻¹) * (dk_Å⁻¹ / dk_m) = (dω/dk_Å⁻¹) * 1e-10
  return dOmegaDkAng * ANGSTROM_M
}

/** Differenza finita centrata al 2° ordine su ω(k). */
function refGroupVelocityFD2(omegaFn, kAngInv, hAngInv = 1e-6) {
  return ((omegaFn(kAngInv + hAngInv) - omegaFn(kAngInv - hAngInv)) / (2 * hAngInv)) * ANGSTROM_M
}

/** Velocità di fase v_p = ω/k in m/s (k in Å⁻¹ → k_m = k / 1e-10). */
function refPhaseVelocity(kAngInv, aAng, massAmu, C) {
  if (Math.abs(kAngInv) < 1e-14) return 0
  return refOmega(kAngInv, aAng, massAmu, C) / (kAngInv / ANGSTROM_M)
}

/**
 * Costante di decadimento evanescente κ (Å⁻¹) per ω > ω_max (Lezione 1 §3.4):
 * Da cosh(κa/2) = r = ω/ω_max:
 *   κ = (2/a) arcosh(r) = (2/a) arsinh(√((r-1)(r+1)))
 * La forma con arsinh evita cancellazione catastrofica per r → 1⁺.
 */
function refEvDecayKappa(omegaRadS, aAng, massAmu, C) {
  const wMax = refOmegaMax(massAmu, C)
  if (omegaRadS <= wMax) return 0
  const r = omegaRadS / wMax
  return (2 / aAng) * Math.asinh(Math.sqrt((r - 1) * (r + 1)))
}

/** Ripiegamento in 1BZ (−π/a, π/a] tramite intero m = ceil(k/G - 1/2). */
function refFoldToFirstBZ(kAngInv, aAng) {
  const G = (2 * Math.PI) / aAng
  const m = Math.ceil(kAngInv / G - 0.5 - 1e-12)
  let kFold = kAngInv - m * G
  const half = Math.PI / aAng
  if (Math.abs(kFold + half) < 1e-12) kFold = half
  return kFold
}

/** Griglia Born–von Kármán in 1BZ (−π/a, π/a] (Lezione 3 §13.3, eq. 32). */
function refBvkModes(aAng, N) {
  const dk = (2 * Math.PI) / (N * aAng)
  const jMin = N % 2 === 0 ? -N / 2 + 1 : -(N - 1) / 2
  const jMax = N % 2 === 0 ? N / 2 : (N - 1) / 2
  const modes = []
  for (let j = jMin; j <= jMax; j++) {
    modes.push({ j, k: dk * j, kFrac: (2 * j) / N })
  }
  return { deltaK: dk, modes }
}

/**
 * Costruisce la matrice dinamica reale simmetrica D = (1/M) Φ (N×N)
 * della catena monatomica chiusa ad anello (Born–von Kármán, §2.1 e §13.2)
 * e ne trova tutti gli autovalori con il metodo iterativo di Jacobi.
 */
function buildForceConstantMatrixRing(N, C) {
  const Phi = Array.from({ length: N }, () => new Float64Array(N))
  if (N === 1) {
    // 1 atomo su anello: u_{n+1} = u_n ⇒ V = 0 ⇒ Φ = [[0]]
    return Phi
  }
  if (N === 2) {
    // 2 atomi su anello: due molle in parallelo tra atomo 0 e atomo 1
    // V = (1/2)C[(u1-u0)^2 + (u0-u1)^2] = C(u0-u1)^2 ⇒ Φ00=2C, Φ01=-2C
    Phi[0][0] = 2 * C
    Phi[1][1] = 2 * C
    Phi[0][1] = -2 * C
    Phi[1][0] = -2 * C
    return Phi
  }
  for (let n = 0; n < N; n++) {
    Phi[n][n] = 2 * C
    Phi[n][(n + 1) % N] = -C
    Phi[n][(n - 1 + N) % N] = -C
  }
  return Phi
}

/** Autovalori di una matrice reale simmetrica n×n via rotazioni di Jacobi. */
function jacobiEigenvalues(matrix) {
  const n = matrix.length
  const A = matrix.map((row) => Float64Array.from(row))
  const maxIter = 100 * n * n
  for (let iter = 0; iter < maxIter; iter++) {
    let p = 0
    let q = 1
    let maxOff = 0
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const v = Math.abs(A[i][j])
        if (v > maxOff) {
          maxOff = v
          p = i
          q = j
        }
      }
    }
    if (maxOff < 1e-15) break
    const app = A[p][p]
    const aqq = A[q][q]
    const apq = A[p][q]
    const tau = (aqq - app) / (2 * apq)
    const t = tau >= 0 ? 1 / (tau + Math.sqrt(1 + tau * tau)) : -1 / (-tau + Math.sqrt(1 + tau * tau))
    const c = 1 / Math.sqrt(1 + t * t)
    const s = t * c

    A[p][p] = app - t * apq
    A[q][q] = aqq + t * apq
    A[p][q] = 0
    A[q][p] = 0
    for (let k = 0; k < n; k++) {
      if (k !== p && k !== q) {
        const akp = A[k][p]
        const akq = A[k][q]
        A[k][p] = c * akp - s * akq
        A[p][k] = A[k][p]
        A[k][q] = s * akp + c * akq
        A[q][k] = A[k][q]
      }
    }
  }
  const eigs = []
  for (let i = 0; i < n; i++) eigs.push(Math.max(0, A[i][i]))
  eigs.sort((x, y) => x - y)
  return eigs
}

// ============================================================================
// 3. STRUMENTI DI CONFRONTO E REGISTRAZIONE RISULTATI
// ============================================================================
const checks = []

function relErr(actual, expected) {
  const abs = Math.abs(actual - expected)
  if (expected === 0) return abs
  return abs / Math.abs(expected)
}

function recordCheck(group, name, inputDesc, dispensaVal, appVal, refVal, tol, mode = 'rel', note = '') {
  const finite = Number.isFinite(appVal) && Number.isFinite(refVal)
  const abs = finite ? Math.abs(appVal - refVal) : Number.POSITIVE_INFINITY
  const rel = finite ? relErr(appVal, refVal) : Number.POSITIVE_INFINITY
  const err = mode === 'abs' ? abs : rel
  const pass = finite && err <= tol
  checks.push({
    group,
    name,
    inputDesc,
    dispensaVal,
    appVal,
    refVal,
    absErr: abs,
    relErr: rel,
    tol,
    mode,
    pass,
    note
  })
  return { pass, abs, rel }
}

// ============================================================================
// 4. VERIFICA A: COSTANTI FISICHE E CONVERSIONI
// ============================================================================
recordCheck(
  'Costanti',
  '1 THz → meV (THZ_TO_MEV)',
  '1 THz',
  '4,13567 meV (riferimento-formule.md)',
  appConst.THZ_TO_MEV,
  refThzToMev(1),
  1e-9,
  'rel',
  'CODATA 2018 a 10 cifre (4.135667696) vs SI 2019 esatto h/e = 4.135667696923859'
)

recordCheck(
  'Costanti',
  'radSToMev(1e13 rad/s)',
  'ω = 10¹³ rad/s',
  'ħω in meV',
  appConst.radSToMev(1e13),
  refRadSToMev(1e13),
  1e-9,
  'rel',
  'Differenza ~2.23e-10 dovuta al troncamento a 10 cifre di THZ_TO_MEV'
)

recordCheck(
  'Costanti',
  'radSToThz(2π·10¹² rad/s)',
  'ω = 2π·10¹² rad/s',
  '1 THz',
  appConst.radSToThz(2 * Math.PI * 1e12),
  1.0,
  1e-14,
  'rel'
)

recordCheck(
  'Costanti',
  'amuToKg(1 u)',
  '1 u',
  '1,660539·10⁻²⁷ kg',
  appConst.amuToKg(1),
  AMU_KG_SI,
  1e-14,
  'rel'
)

// ============================================================================
// 5. VERIFICA B: METALLO TIPICO (§3 p. 9), PIOMBO 1D, CARBONIO 1D, ESTREMI SLIDER
// ============================================================================

// B1. Metallo tipico con M esatto della dispensa (M = 1.05e-25 kg)
const massDispensaAmu = 1.05e-25 / AMU_KG_SI // ≈ 63.232478 u
const dispensaMetalParams = { a: 2.5, massAmu: massDispensaAmu, springC: 20 }
const sumDispensa = app.monatomicSummary(dispensaMetalParams)

recordCheck(
  'Dispensa §3 (M=1.05e-25 kg)',
  '√(C/M)',
  'a=2.5 Å, M=1.05e-25 kg, C=20 N/m',
  '1,38·10¹³ s⁻¹',
  sumDispensa.sqrtCOverM,
  refSqrtCOverM_kg(20, 1.05e-25),
  1e-13
)
recordCheck(
  'Dispensa §3 (M=1.05e-25 kg)',
  'v_s',
  'a=2.5 Å, M=1.05e-25 kg, C=20 N/m',
  '≈ 3,5·10³ m/s',
  sumDispensa.soundSpeedMs,
  2.5e-10 * refSqrtCOverM_kg(20, 1.05e-25),
  1e-13
)
recordCheck(
  'Dispensa §3 (M=1.05e-25 kg)',
  'ω_max',
  'a=2.5 Å, M=1.05e-25 kg, C=20 N/m',
  '≈ 2,8·10¹³ rad/s',
  sumDispensa.omegaMaxRadS,
  2 * refSqrtCOverM_kg(20, 1.05e-25),
  1e-13
)
recordCheck(
  'Dispensa §3 (M=1.05e-25 kg)',
  'ν_max',
  'a=2.5 Å, M=1.05e-25 kg, C=20 N/m',
  '≈ 4,4 THz',
  sumDispensa.freqMaxThz,
  refRadSToThz(2 * refSqrtCOverM_kg(20, 1.05e-25)),
  1e-13
)
recordCheck(
  'Dispensa §3 (M=1.05e-25 kg)',
  'ħω_max',
  'a=2.5 Å, M=1.05e-25 kg, C=20 N/m',
  '≈ 18 meV',
  sumDispensa.energyMaxMev,
  refRadSToMev(2 * refSqrtCOverM_kg(20, 1.05e-25)),
  1e-9
)

// B2. Preset dell'app (manifest.ts)
const PRESETS = [
  { id: 'typical-metal', label: 'Metallo tipico (§3, M=63.2 u)', a: 2.5, massAmu: 63.2, springC: 20 },
  { id: 'lead-1d', label: 'Piombo 1D (pesante, molle)', a: 3.5, massAmu: 207.2, springC: 6 },
  { id: 'carbon-1d', label: 'Carbonio 1D (leggero, rigido)', a: 2.0, massAmu: 12.0, springC: 90 }
]

const presetSummaries = {}
for (const p of PRESETS) {
  const s = app.monatomicSummary(p)
  const refW0 = refSqrtCOverM(p.springC, p.massAmu)
  const refWmax = 2 * refW0
  const refVs = refSoundSpeed(p.a, p.massAmu, p.springC)
  const refNuMax = refRadSToThz(refWmax)
  const refEmax = refRadSToMev(refWmax)
  const refEdge = Math.PI / p.a
  const refG = (2 * Math.PI) / p.a

  presetSummaries[p.id] = {
    params: p,
    app: s,
    ref: { sqrtCOverM: refW0, omegaMaxRadS: refWmax, freqMaxThz: refNuMax, energyMaxMev: refEmax, soundSpeedMs: refVs, zoneEdge: refEdge, reciprocalG: refG }
  }

  const grp = `Preset: ${p.label}`
  const inp = `a=${p.a} Å, M=${p.massAmu} u, C=${p.springC} N/m`
  recordCheck(grp, '√(C/M)', inp, p.id === 'typical-metal' ? '1,38·10¹³ s⁻¹' : '—', s.sqrtCOverM, refW0, 1e-13)
  recordCheck(grp, 'ω_max', inp, p.id === 'typical-metal' ? '≈ 2,8·10¹³ rad/s' : '—', s.omegaMaxRadS, refWmax, 1e-13)
  recordCheck(grp, 'ν_max (THz)', inp, p.id === 'typical-metal' ? '≈ 4,4 THz' : '—', s.freqMaxThz, refNuMax, 1e-13)
  recordCheck(grp, 'ħω_max (meV)', inp, p.id === 'typical-metal' ? '≈ 18 meV' : '—', s.energyMaxMev, refEmax, 1e-9)
  recordCheck(grp, 'v_s (m/s)', inp, p.id === 'typical-metal' ? '≈ 3,5·10³ m/s' : '—', s.soundSpeedMs, refVs, 1e-13)
  recordCheck(grp, 'π/a (Å⁻¹)', inp, 'π/a', s.zoneEdge, refEdge, 1e-14)
  recordCheck(grp, 'G = 2π/a (Å⁻¹)', inp, '2π/a', s.reciprocalG, refG, 1e-14)
}

// B3. Estremi degli slider (manifest.ts: a ∈ [2.0, 6.0], M ∈ [6, 210], C ∈ [2, 100])
const sliderCorners = []
for (const a of [2.0, 6.0]) {
  for (const massAmu of [6.0, 210.0]) {
    for (const springC of [2.0, 100.0]) {
      sliderCorners.push({ a, massAmu, springC })
    }
  }
}

let maxSliderOmegaRel = 0
let maxSliderVgRel = 0
let maxSliderVpRel = 0
let sliderNonFiniteCount = 0

for (const p of sliderCorners) {
  const edge = Math.PI / p.a
  const kFracs = [-2, -1.5, -1, -0.75, -0.5, -0.25, -0.01, 0, 0.01, 0.25, 0.5, 0.75, 1, 1.5, 2]
  for (const kf of kFracs) {
    const k = kf * edge
    const wApp = app.monatomicOmega(k, p)
    const wRef = refOmega(k, p.a, p.massAmu, p.springC)
    const vgApp = app.monatomicGroupVelocity(k, p)
    const vgRef = refGroupVelocityAnalytic(k, p.a, p.massAmu, p.springC)
    const vpApp = app.monatomicPhaseVelocity(k, p)
    const vpRef = refPhaseVelocity(k, p.a, p.massAmu, p.springC)

    if (![wApp, vgApp, vpApp].every(Number.isFinite)) sliderNonFiniteCount++
    if (wRef > 0) maxSliderOmegaRel = Math.max(maxSliderOmegaRel, relErr(wApp, wRef))
    if (Math.abs(vgRef) > 0) maxSliderVgRel = Math.max(maxSliderVgRel, relErr(vgApp, vgRef))
    if (Math.abs(vpRef) > 0) maxSliderVpRel = Math.max(maxSliderVpRel, relErr(vpApp, vpRef))
  }
}

recordCheck('Estremi slider (8 vertici × 15 k)', 'max relErr ω(k)', 'a∈{2,6}, M∈{6,210}, C∈{2,100}', 'eq. (8)', maxSliderOmegaRel, 0, 1e-13, 'abs')
recordCheck('Estremi slider (8 vertici × 15 k)', 'max relErr v_g(k)', 'a∈{2,6}, M∈{6,210}, C∈{2,100}', '§3.3 / §16', maxSliderVgRel, 0, 1e-13, 'abs')
recordCheck('Estremi slider (8 vertici × 15 k)', 'max relErr v_p(k)', 'a∈{2,6}, M∈{6,210}, C∈{2,100}', '§3.2', maxSliderVpRel, 0, 1e-13, 'abs')
recordCheck('Estremi slider (8 vertici × 15 k)', 'NaN / Infinity count', '120 punti estremi', '0', sliderNonFiniteCount, 0, 0, 'abs')

// ============================================================================
// 6. VERIFICA C: LIMITE k → 0 E TERMINE DISPERSIVO (ka)²/24 (§3.2 p. 8)
// ============================================================================
const metal = PRESETS[0]
const vsMetal = refSoundSpeed(metal.a, metal.massAmu, metal.springC)
const smallKaValues = [1e-4, 1e-3, 1e-2, 0.05, 0.1, 0.2]
const smallKTable = []

for (const ka of smallKaValues) {
  const k = ka / metal.a
  const kM = k / ANGSTROM_M
  const wApp = app.monatomicOmega(k, metal)
  const wLinear = vsMetal * kM
  const wTaylor3 = wLinear * (1 - (ka * ka) / 24)
  // coefficiente estratto: [1 - ω/(v_s k)] / (ka)² → 1/24
  const coeff24 = (1 - wApp / wLinear) / (ka * ka)
  const expectedCoeff = 1 / 24 - (ka * ka) / 1920
  const vgApp = app.monatomicGroupVelocity(k, metal)
  const vpApp = app.monatomicPhaseVelocity(k, metal)
  smallKTable.push({ ka, k, wApp, wLinear, wTaylor3, coeff24, expectedCoeff, vgApp, vpApp })
}

// Verifica del coefficiente 1/24 per ka = 1e-3 (dove (ka)²/1920 ≈ 5.2e-10)
const entry1e3 = smallKTable.find((r) => r.ka === 1e-3)
recordCheck(
  'Limite k → 0 (§3.2)',
  'Coefficiente (ka)²/24 a ka=10⁻³',
  'ka = 10⁻³, metallo tipico',
  '1/24 = 0,0416667',
  entry1e3.coeff24,
  1 / 24,
  1e-5,
  'rel',
  'Termine O((ka)²) = 1/1920 · 10⁻⁶ ≈ 5.2e-10; precisione float64 su (1 - sin(x)/x) ~ 1e-10/1e-6 = 1e-4? Verifichiamo!'
)

// Verifica a ka = 0.01 (bilanciamento ottimale tra troncamento (ka)²/1920 = 5.2e-8 e cancellazione 1e-16/1e-4 = 1e-12)
const entry1e2 = smallKTable.find((r) => r.ka === 1e-2)
recordCheck(
  'Limite k → 0 (§3.2)',
  'Coefficiente (ka)²/24 a ka=10⁻²',
  'ka = 10⁻², metallo tipico',
  '1/24 = 0,04166667',
  entry1e2.coeff24,
  1 / 24,
  2e-6,
  'rel'
)
recordCheck(
  'Limite k → 0 (§3.2)',
  'Taylor ω ≃ v_s k [1 − (ka)²/24] vs ω(k) a ka=0.1',
  'ka = 0.1',
  'residuo ≈ (ka)⁴/1920 ≈ 5,21·10⁻⁸',
  Math.abs(smallKTable.find((r) => r.ka === 0.1).wApp - smallKTable.find((r) => r.ka === 0.1).wTaylor3) /
    smallKTable.find((r) => r.ka === 0.1).wLinear,
  Math.pow(0.1, 4) / 1920,
  1e-3,
  'rel'
)

// Limiti v_g(0±) → ±v_s e v_p(0±) → ±v_s
const kTiny = 1e-7 // Å⁻¹ (molto sopra la soglia 1e-14)
recordCheck('Limite k → 0 (§3.2)', 'v_g(k→0⁺) → +v_s', 'k = +10⁻⁷ Å⁻¹', '+v_s', app.monatomicGroupVelocity(kTiny, metal), +vsMetal, 1e-12)
recordCheck('Limite k → 0 (§3.2)', 'v_g(k→0⁻) → −v_s', 'k = −10⁻⁷ Å⁻¹', '−v_s', app.monatomicGroupVelocity(-kTiny, metal), -vsMetal, 1e-12)
recordCheck('Limite k → 0 (§3.2)', 'v_p(k→0⁺) → +v_s', 'k = +10⁻⁷ Å⁻¹', '+v_s', app.monatomicPhaseVelocity(kTiny, metal), +vsMetal, 1e-12)
recordCheck('Limite k → 0 (§3.2)', 'v_p(k→0⁻) → −v_s', 'k = −10⁻⁷ Å⁻¹', '−v_s', app.monatomicPhaseVelocity(-kTiny, metal), -vsMetal, 1e-12)
recordCheck('Limite k → 0 (§3.2)', 'ω(0) = 0', 'k = 0', '0', app.monatomicOmega(0, metal), 0, 0, 'abs')
recordCheck('Limite k → 0 (§3.2)', 'v_g(0) = 0 (disparità/cuspide)', 'k = 0', '0 (convenzione app)', app.monatomicGroupVelocity(0, metal), 0, 0, 'abs')
recordCheck('Limite k → 0 (§3.2)', 'v_p(0) = 0 (traslazione rigida)', 'k = 0', '0 (convenzione app)', app.monatomicPhaseVelocity(0, metal), 0, 0, 'abs')

// ============================================================================
// 7. VERIFICA D: BORDO ZONA k = ±π/a (§3.3 p. 8, §6.2 p. 16, §6.3 p. 17)
// ============================================================================
for (const p of PRESETS) {
  const edge = Math.PI / p.a
  const vs = refSoundSpeed(p.a, p.massAmu, p.springC)
  const wMax = refOmegaMax(p.massAmu, p.springC)
  const grp = `Bordo zona (${p.id})`

  recordCheck(grp, 'ω(+π/a) = ω_max', 'k = +π/a', 'ω_max', app.monatomicOmega(+edge, p), wMax, 1e-14)
  recordCheck(grp, 'ω(−π/a) = ω_max', 'k = −π/a', 'ω_max', app.monatomicOmega(-edge, p), wMax, 1e-14)
  recordCheck(grp, 'v_g(+π/a) = 0', 'k = +π/a', '0', app.monatomicGroupVelocity(+edge, p), 0, 0, 'abs')
  recordCheck(grp, 'v_g(−π/a) = 0', 'k = −π/a', '0', app.monatomicGroupVelocity(-edge, p), 0, 0, 'abs')
  recordCheck(grp, 'v_p(+π/a) = +(2/π)v_s', 'k = +π/a', '+(2/π)v_s', app.monatomicPhaseVelocity(+edge, p), +(2 / Math.PI) * vs, 1e-14)
  recordCheck(grp, 'v_p(−π/a) = −(2/π)v_s', 'k = −π/a', '−(2/π)v_s', app.monatomicPhaseVelocity(-edge, p), -(2 / Math.PI) * vs, 1e-14)

  // Curvatura al bordo di zona ω''(π/a) = −a² ω_max / 4 (dispensa §6.3 p. 17)
  const h = 1e-4 // Å⁻¹
  const w2FD = (app.monatomicOmega(edge + h, p) - 2 * app.monatomicOmega(edge, p) + app.monatomicOmega(edge - h, p)) / (h * h)
  const w2Ref = -0.25 * p.a * p.a * wMax // rad·s⁻¹·Å²
  recordCheck(grp, 'Curvatura ω″(π/a) = −a²ω_max/4', 'FD2 a k=π/a, h=10⁻⁴ Å⁻¹', '−a²ω_max/4 (§6.3 p. 17)', w2FD, w2Ref, 1e-7)
}

// Onda stazionaria al bordo di zona: u_n(φ) = (-1)^n cos(φ)
const standingPhases = [0, 0.7, Math.PI / 3, Math.PI / 2, 2.3]
let maxStandingErr = 0
for (const phi of standingPhases) {
  const disp = app.monatomicDisplacements(metal.a, Math.PI / metal.a, phi, 11)
  for (const s of disp) {
    const expected = (s.n % 2 === 0 ? 1 : -1) * Math.cos(phi)
    maxStandingErr = Math.max(maxStandingErr, Math.abs(s.u - expected))
  }
}
recordCheck('Bordo zona (onda stazionaria)', 'u_n(φ) = (−1)^n cos(φ)', 'k=π/a, 11 atomi, 5 fasi', '(−1)^n cos(ω_max t)', maxStandingErr, 0, 1e-14, 'abs')

// ============================================================================
// 8. VERIFICA E: DIFFERENZE FINITE CENTRATE PER v_g VS FORMULA ANALITICA
//    (in 1BZ e fuori 1BZ, fino a ±3π/a) + CONVERSIONI PENDENZA + CURVA
// ============================================================================
let maxFd4RelIn1BZ = 0
let maxFd4RelOut1BZ = 0
let maxFd2RelAll = 0
let maxSlopeThzRel = 0
let maxSlopeMevRel = 0

for (const p of PRESETS) {
  const edge = Math.PI / p.a
  const omegaFn = (k) => app.monatomicOmega(k, p)
  const freqFn = (k) => appConst.radSToThz(app.monatomicOmega(k, p))
  const mevFn = (k) => appConst.radSToMev(app.monatomicOmega(k, p))

  // 200 punti su [-3π/a, +3π/a], evitando solo un intorno ±0.02 dei punti angolosi k = mG (kf pari)
  for (let i = 0; i <= 240; i++) {
    const kf = -3 + (6 * i) / 240
    // Evita cuspidi k = 0, ±2π/a (kf = -2, 0, 2) e punti a distanza < 0.01 da essi
    const distToCusp = Math.min(Math.abs(kf + 2), Math.abs(kf), Math.abs(kf - 2))
    if (distToCusp < 0.015) continue
    // Evita bordo esatto dove v_g = 0 per errore relativo (controlliamo a parte l'errore assoluto)
    const distToEdge = Math.min(Math.abs(kf + 3), Math.abs(kf + 1), Math.abs(kf - 1), Math.abs(kf - 3))
    const k = kf * edge
    const vgApp = app.monatomicGroupVelocity(k, p)
    const vgFD4 = refGroupVelocityFD4(omegaFn, k, 1e-4)
    const vgFD2 = refGroupVelocityFD2(omegaFn, k, 1e-5)

    if (distToEdge < 1e-9) {
      // Al bordo v_g = 0: controlla errore assoluto rispetto a v_s
      const vs = refSoundSpeed(p.a, p.massAmu, p.springC)
      const normErr = Math.abs(vgApp - vgFD4) / vs
      maxFd4RelIn1BZ = Math.max(maxFd4RelIn1BZ, normErr)
      continue
    }

    const r4 = relErr(vgApp, vgFD4)
    const r2 = relErr(vgApp, vgFD2)
    maxFd2RelAll = Math.max(maxFd2RelAll, r2)
    if (Math.abs(kf) <= 1) {
      maxFd4RelIn1BZ = Math.max(maxFd4RelIn1BZ, r4)
    } else {
      maxFd4RelOut1BZ = Math.max(maxFd4RelOut1BZ, r4)
    }

    // Verifica conversioni pendenza dν/dk (THz·Å) e d(ħω)/dk (meV·Å) con FD4 diretto
    const h = 1e-4
    const dNuDkFD4 = (-freqFn(k + 2 * h) + 8 * freqFn(k + h) - 8 * freqFn(k - h) + freqFn(k - 2 * h)) / (12 * h)
    const dEDkFD4 = (-mevFn(k + 2 * h) + 8 * mevFn(k + h) - 8 * mevFn(k - h) + mevFn(k - 2 * h)) / (12 * h)
    maxSlopeThzRel = Math.max(maxSlopeThzRel, relErr(app.velocityMsToThzAngstrom(vgApp), dNuDkFD4))
    maxSlopeMevRel = Math.max(maxSlopeMevRel, relErr(app.velocityMsToMevAngstrom(vgApp), dEDkFD4))
  }
}

recordCheck('Derivate finite v_g(k)', 'v_g analitica vs FD4 in 1BZ', '3 preset, |k| ≤ π/a', 'dω/dk', maxFd4RelIn1BZ, 0, 1e-10, 'abs')
recordCheck('Derivate finite v_g(k)', 'v_g analitica vs FD4 fuori 1BZ (2ª–3ª BZ)', '3 preset, π/a < |k| ≤ 3π/a', 'periodicità G', maxFd4RelOut1BZ, 0, 1e-10, 'abs')
recordCheck('Derivate finite v_g(k)', 'v_g analitica vs FD2 su [-3π/a, 3π/a]', '3 preset, h=10⁻⁵ Å⁻¹', 'dω/dk', maxFd2RelAll, 0, 1e-8, 'abs')
recordCheck('Derivate finite v_g(k)', 'velocityMsToThzAngstrom vs dν/dk FD4', '3 preset, [-3π/a, 3π/a]', 'dν/dk in THz·Å', maxSlopeThzRel, 0, 1e-10, 'abs')
recordCheck('Derivate finite v_g(k)', 'velocityMsToMevAngstrom vs d(ħω)/dk FD4', '3 preset, [-3π/a, 3π/a]', 'd(ħω)/dk in meV·Å', maxSlopeMevRel, 0, 1e-10, 'abs')

// Verifica monatomicDispersionCurve (401 punti come NUMERICS.kPoints)
const edgeM = Math.PI / metal.a
const curve = app.monatomicDispersionCurve(metal, -2 * edgeM, 2 * edgeM, 401)
let maxCurveOmegaErr = 0
let maxCurveThzErr = 0
let maxCurveMevErr = 0
const wMaxCurve = refOmegaMax(metal.massAmu, metal.springC)
const nuMaxCurve = refRadSToThz(wMaxCurve)
const eMaxCurve = refRadSToMev(wMaxCurve)
for (let i = 0; i < curve.k.length; i++) {
  const k = curve.k[i]
  const wRef = refOmega(k, metal.a, metal.massAmu, metal.springC)
  maxCurveOmegaErr = Math.max(maxCurveOmegaErr, wRef > 1e-12 * wMaxCurve ? relErr(curve.omegaRadS[i], wRef) : Math.abs(curve.omegaRadS[i] - wRef) / wMaxCurve)
  const nuRef = refRadSToThz(wRef)
  maxCurveThzErr = Math.max(maxCurveThzErr, nuRef > 1e-12 * nuMaxCurve ? relErr(curve.freqThz[i], nuRef) : Math.abs(curve.freqThz[i] - nuRef) / nuMaxCurve)
  const eRef = refRadSToMev(wRef)
  maxCurveMevErr = Math.max(maxCurveMevErr, eRef > 1e-12 * eMaxCurve ? relErr(curve.energyMev[i], eRef) : Math.abs(curve.energyMev[i] - eRef) / eMaxCurve)
}
recordCheck('Campionamento curva', 'monatomicDispersionCurve ω (401 pt)', '[-2π/a, 2π/a], 401 punti', 'eq. (8)', maxCurveOmegaErr, 0, 1e-13, 'abs')
recordCheck('Campionamento curva', 'monatomicDispersionCurve ν (THz)', '[-2π/a, 2π/a], 401 punti', 'ω/(2π)', maxCurveThzErr, 0, 1e-13, 'abs')
recordCheck('Campionamento curva', 'monatomicDispersionCurve ħω (meV)', '[-2π/a, 2π/a], 401 punti', 'ħω', maxCurveMevErr, 0, 1e-9, 'abs')
// Verifica che k = 0, ±π/a, ±2π/a cadano esattamente sugli indici 0, 100, 200, 300, 400
const specialIdxErr = Math.max(
  Math.abs(curve.k[0] + 2 * edgeM),
  Math.abs(curve.k[100] + edgeM),
  Math.abs(curve.k[200]),
  Math.abs(curve.k[300] - edgeM),
  Math.abs(curve.k[400] - 2 * edgeM)
)
recordCheck('Campionamento curva', 'Campioni esatti k = 0, ±π/a, ±2π/a', 'indici 0,100,200,300,400', 'esatti', specialIdxErr, 0, 1e-14, 'abs')

// ============================================================================
// 9. VERIFICA F: ALIASING k + mG, FOLDING 1BZ E EQUAZIONE DI NEWTON DISCRETA
// ============================================================================
let maxAliasOmegaRel = 0
let maxAliasVgRel = 0
let maxAliasDispErr = 0
let maxFoldErr = 0
let maxNewtonResidual = 0

// Include caso Fig. 5 della dispensa (ka = 0.9, Ga = 2π) + altri k
const aliasKs = [0.9 / metal.a, 0, 0.5 * edgeM, -0.5 * edgeM, edgeM, -edgeM, 0.7 * edgeM, -0.31 * edgeM]
const ms = [-3, -2, -1, 1, 2, 3]
const phases = [0, 0.42, 1.9]

for (const k of aliasKs) {
  const w0 = app.monatomicOmega(k, metal)
  const vg0 = app.monatomicGroupVelocity(k, metal)

  // Verifica equazione del moto discreta di Newton (6): M ü_n = C(u_{n+1} + u_{n-1} - 2 u_n)
  // Per u_n(t) = cos(k n a - φ), ü_n = -ω² u_n.
  const Mkg = metal.massAmu * AMU_KG_SI
  for (const phi of phases) {
    const atoms = app.monatomicDisplacements(metal.a, k, phi, 15, -7)
    for (let idx = 1; idx < atoms.length - 1; idx++) {
      const lhs = -Mkg * w0 * w0 * atoms[idx].u
      const rhs = metal.springC * (atoms[idx + 1].u + atoms[idx - 1].u - 2 * atoms[idx].u)
      const scale = Mkg * refOmegaMax(metal.massAmu, metal.springC) ** 2
      maxNewtonResidual = Math.max(maxNewtonResidual, Math.abs(lhs - rhs) / scale)
    }
  }

  for (const m of ms) {
    const kAlias = app.monatomicAliasK(k, metal.a, m)
    const wA = app.monatomicOmega(kAlias, metal)
    const vgA = app.monatomicGroupVelocity(kAlias, metal)
    const wScale = refOmegaMax(metal.massAmu, metal.springC)
    maxAliasOmegaRel = Math.max(maxAliasOmegaRel, w0 > 1e-12 * wScale ? relErr(wA, w0) : Math.abs(wA - w0) / wScale)
    maxAliasVgRel = Math.max(maxAliasVgRel, Math.abs(vg0) > 1e-12 * vsMetal ? relErr(vgA, vg0) : Math.abs(vgA - vg0) / vsMetal)

    for (const phi of phases) {
      const d0 = app.monatomicDisplacements(metal.a, k, phi, 21, -10)
      const dA = app.monatomicDisplacements(metal.a, kAlias, phi, 21, -10)
      for (let i = 0; i < d0.length; i++) {
        maxAliasDispErr = Math.max(maxAliasDispErr, Math.abs(d0[i].u - dA[i].u))
      }
    }
  }
}

// Verifica specifica Fig. 5 della dispensa: ka = 0.9, k' = k + G
const kFig5 = 0.9 / metal.a
const kFig5Alias = app.monatomicAliasK(kFig5, metal.a, 1)
const midX = 1.37 * metal.a // posizione NON atomica: i profili continui devono differire
const continuousDiffFig5 = Math.abs(
  app.monatomicWaveProfile(midX, kFig5, 0) - app.monatomicWaveProfile(midX, kFig5Alias, 0)
)

// Verifica foldToFirstBZ (incluso esempio Umklapp p. 40: 1.3 π/a → -0.7 π/a)
const foldTestCases = [
  { kFrac: 0, expectedFrac: 0 },
  { kFrac: 1, expectedFrac: 1 },
  { kFrac: -1, expectedFrac: 1 },        // convenzione (-π/a, π/a]
  { kFrac: 1.3, expectedFrac: -0.7 },    // esempio Umklapp §16 p. 40
  { kFrac: -1.3, expectedFrac: 0.7 },
  { kFrac: 2.0, expectedFrac: 0 },
  { kFrac: -2.0, expectedFrac: 0 },
  { kFrac: 3.0, expectedFrac: 1 },
  { kFrac: -3.0, expectedFrac: 1 },
  { kFrac: 5.4, expectedFrac: -0.6 },
  { kFrac: -4.25, expectedFrac: -0.25 }
]
for (const tc of foldTestCases) {
  const got = app.foldToFirstBZ(tc.kFrac * edgeM, metal.a)
  const exp = tc.expectedFrac * edgeM
  const ref = refFoldToFirstBZ(tc.kFrac * edgeM, metal.a)
  maxFoldErr = Math.max(maxFoldErr, Math.abs(got - exp), Math.abs(got - ref))
}

// Verifica monatomicAdjacentAlias su [-π/a, π/a]
let adjacentAliasOk = true
for (const kf of [-1, -0.75, -0.5, -0.1, 0, 0.1, 0.5, 0.75, 1]) {
  const k = kf * edgeM
  const { kAlias, m } = app.monatomicAdjacentAlias(k, metal.a)
  const expectedM = k > 0 ? -1 : 1
  if (m !== expectedM) adjacentAliasOk = false
  if (Math.abs(kAlias) > 2 * edgeM + 1e-12) adjacentAliasOk = false
  if (Math.abs(app.monatomicOmega(kAlias, metal) - app.monatomicOmega(k, metal)) > 1e-1) adjacentAliasOk = false
}

recordCheck('Aliasing & Equazione di Newton', 'Residuo eq. Newton (6) M ü_n = C(u_{n+1}+u_{n-1}-2u_n)', '8 k × 3 fasi × 13 atomi', '0 (esatto)', maxNewtonResidual, 0, 1e-14, 'abs')
recordCheck('Aliasing & Equazione di Newton', 'Invarianza ω(k + mG) = ω(k)', 'm ∈ {±1, ±2, ±3}, 8 valori k', 'esatta (§4.1)', maxAliasOmegaRel, 0, 1e-13, 'abs')
recordCheck('Aliasing & Equazione di Newton', 'Invarianza v_g(k + mG) = v_g(k)', 'm ∈ {±1, ±2, ±3}, 8 valori k', 'esatta', maxAliasVgRel, 0, 1e-13, 'abs')
recordCheck('Aliasing & Equazione di Newton', 'Invarianza u_n(k + mG) = u_n(k) sui siti x_n=na', '21 atomi, m ∈ {±1..±3}, Fig. 5 inclusa', '0 (§4.1)', maxAliasDispErr, 0, 1e-13, 'abs')
recordCheck('Aliasing & Equazione di Newton', 'Differenza profilo continuo tra siti (Fig. 5, ka=0.9)', 'x = 1.37 a', '> 0 (aliasing)', continuousDiffFig5 > 0.1 ? 1 : 0, 1, 0, 'abs', `|u_cont(k)-u_cont(k+G)| = ${continuousDiffFig5.toFixed(6)}`)
recordCheck('Aliasing & Equazione di Newton', 'foldToFirstBZ su (−π/a, π/a]', '11 casi (incl. ±π/a, 1.3π/a Umklapp)', '−π/a < k ≤ π/a', maxFoldErr, 0, 1e-13, 'abs')
recordCheck('Aliasing & Equazione di Newton', 'monatomicAdjacentAlias ∈ [−2π/a, 2π/a]', '9 valori k in [−π/a, π/a]', 'k′ = k ± G', adjacentAliasOk ? 1 : 0, 1, 0, 'abs')

// ============================================================================
// 10. VERIFICA G: DECADIMENTO EVANESCENTE κ PER ω > ω_max (§3.4 p. 8)
// ============================================================================
const wMaxMetal = refOmegaMax(metal.massAmu, metal.springC)
const evRatios = [0, 0.5, 1.0, 1 + 1e-10, 1 + 1e-8, 1 + 1e-6, 1.001, 1.01, 1.1, 1.5, 2.0, 5.0, 10.0, 100.0]
const evTable = []
let maxEvRelFar = 0
let maxEvRelNear = 0
let maxEvNewtonResidual = 0

for (const r of evRatios) {
  const w = r * wMaxMetal
  const kApp = app.monatomicEvDecayKappa(w, metal)
  const kRef = refEvDecayKappa(w, metal.a, metal.massAmu, metal.springC)

  let newtonRes = 0
  if (r > 1) {
    // Verifica diretta su equazione del moto (6) con u_n = (-1)^n exp(-κ n a):
    // M ω² = C (2 + e^{-κa} + e^{+κa}) = 4 C cosh²(κa/2)
    const Mkg = metal.massAmu * AMU_KG_SI
    const lhs = Mkg * w * w
    const rhs = metal.springC * (2 + Math.exp(-kApp * metal.a) + Math.exp(kApp * metal.a))
    newtonRes = Math.abs(lhs - rhs) / lhs
    maxEvNewtonResidual = Math.max(maxEvNewtonResidual, newtonRes)
    const rel = relErr(kApp, kRef)
    if (r >= 1.001) {
      maxEvRelFar = Math.max(maxEvRelFar, rel)
    } else {
      maxEvRelNear = Math.max(maxEvRelNear, rel)
    }
    evTable.push({ ratio: r, kappaApp: kApp, kappaRef: kRef, relErr: rel, newtonRes })
  } else {
    evTable.push({ ratio: r, kappaApp: kApp, kappaRef: kRef, relErr: Math.abs(kApp), newtonRes: 0 })
  }
}

recordCheck('Onda evanescente (§3.4)', 'κ = 0 per ω ≤ ω_max', 'ω/ω_max ∈ {0, 0.5, 1}', '0 (propagante)', Math.max(...evTable.filter((x) => x.ratio <= 1).map((x) => Math.abs(x.kappaApp))), 0, 0, 'abs')
recordCheck('Onda evanescente (§3.4)', 'κ(ω) per ω/ω_max ∈ [1.001, 100]', '9 rapporti fino a 100×ω_max', '(2/a) arcosh(ω/ω_max)', maxEvRelFar, 0, 1e-13, 'abs')
recordCheck('Onda evanescente (§3.4)', 'κ(ω) molto vicino a soglia (1+10⁻¹⁰…1+10⁻⁶)', 'r = 1+10⁻¹⁰, 1+10⁻⁸, 1+10⁻⁶', 'stabilità numerica vicino a ω_max⁺', maxEvRelNear, 0, 1e-5, 'abs', 'acosh(2r²-1) vs 2·asinh(√((r-1)(r+1)))')
recordCheck('Onda evanescente (§3.4)', 'Residuo eq. Newton Mω² = C(2+e⁻ᴷᵃ+e⁺ᴷᵃ)', 'tutti r > 1 fino a r = 100', '0 (esatto)', maxEvNewtonResidual, 0, 1e-13, 'abs')

// ============================================================================
// 11. VERIFICA H: BORN–VON KÁRMÁN (N pari/dispari, Jacobi N×N, esempio L=1 cm)
// ============================================================================
const bvkNs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 17, 23, 24, 100, 101]
let bvkStructOk = true
let maxBvkDeltaKRel = 0
let maxBvkModeKErr = 0
let maxBvkPeriodicityErr = 0
let maxJacobiRelErr = 0
let maxSumRuleErr = 0

for (const N of bvkNs) {
  const grid = app.bvkAllowedK1D(metal.a, N)
  const ref = refBvkModes(metal.a, N)

  if (grid.nCells !== N || grid.modes.length !== N) bvkStructOk = false
  maxBvkDeltaKRel = Math.max(maxBvkDeltaKRel, relErr(grid.deltaK, ref.deltaK))

  for (let i = 0; i < N; i++) {
    const gm = grid.modes[i]
    const rm = ref.modes[i]
    if (gm.j !== rm.j) bvkStructOk = false
    maxBvkModeKErr = Math.max(maxBvkModeKErr, Math.abs(gm.k - rm.k), Math.abs(gm.kFrac - rm.kFrac))
    // 1BZ: -π/a < k ≤ π/a
    if (!(gm.k > -edgeM + 1e-12 && gm.k <= edgeM + 1e-12)) bvkStructOk = false
    // Condizione periodica u_{n+N} = u_n
    const u0 = Math.cos(gm.k * 3 * metal.a - 0.73)
    const uN = Math.cos(gm.k * (3 + N) * metal.a - 0.73)
    maxBvkPeriodicityErr = Math.max(maxBvkPeriodicityErr, Math.abs(uN - u0))
  }

  // Verifica parità N pari vs N dispari (dispensa §13.3 p. 33)
  if (N % 2 === 0) {
    if (grid.modes[0].j !== -N / 2 + 1 || grid.modes[N - 1].j !== N / 2) bvkStructOk = false
  } else {
    if (grid.modes[0].j !== -(N - 1) / 2 || grid.modes[N - 1].j !== (N - 1) / 2) bvkStructOk = false
  }

  // Diagonalizzazione indipendente di Jacobi della matrice dinamica N×N (fino a N=24)
  if (N <= 24) {
    const Phi = buildForceConstantMatrixRing(N, metal.springC)
    // Regola di somma nulla §1.2 eq. (3): ∑_m Φ(n,m) = 0
    for (let r = 0; r < N; r++) {
      let rowSum = 0
      for (let c = 0; c < N; c++) rowSum += Phi[r][c]
      maxSumRuleErr = Math.max(maxSumRuleErr, Math.abs(rowSum))
    }
    const Mkg = metal.massAmu * AMU_KG_SI
    const D = Phi.map((row) => Float64Array.from(row, (v) => v / Mkg))
    // Normalizza D con ω_max² per condizionamento ottimale di Jacobi
    const wMax2 = wMaxMetal * wMaxMetal
    const Dnorm = D.map((row) => Float64Array.from(row, (v) => v / wMax2))
    const eigsNorm = jacobiEigenvalues(Dnorm)
    const omegasJacobi = eigsNorm.map((lam) => Math.sqrt(lam) * wMaxMetal)
    const omegasApp = grid.modes.map((m) => app.monatomicOmega(m.k, metal)).sort((x, y) => x - y)

    for (let i = 0; i < N; i++) {
      if (omegasApp[i] === 0 && omegasJacobi[i] < 1e-7 * wMaxMetal) {
        // Modo k = 0 (traslazione rigida, autovalore 0; radice di 1e-15 è ~3e-8)
        continue
      }
      maxJacobiRelErr = Math.max(maxJacobiRelErr, relErr(omegasApp[i], omegasJacobi[i]))
    }
  }
}

recordCheck('Born–von Kármán (§13)', 'Conteggio N modi, j∈(-N/2,N/2], 1BZ', 'N ∈ {1..24, 100, 101} (pari e dispari)', 'N modi in (-π/a, π/a]', bvkStructOk ? 1 : 0, 1, 0, 'abs')
recordCheck('Born–von Kármán (§13)', 'Passo Δk = 2π/(Na)', '18 valori di N', '2π/L', maxBvkDeltaKRel, 0, 1e-14, 'abs')
recordCheck('Born–von Kármán (§13)', 'Posizione k_j e kFrac = 2j/N', '18 valori di N', '2πj/(Na)', maxBvkModeKErr, 0, 1e-14, 'abs')
recordCheck('Born–von Kármán (§13)', 'Periodicità u_{n+N} = u_n', 'tutti i modi permessi', '0 (esatto)', maxBvkPeriodicityErr, 0, 1e-13, 'abs')
recordCheck('Born–von Kármán (§13)', 'Regola di somma nulla ∑_m Φ(n,m) = 0', 'N = 1…24', '0 (eq. 3)', maxSumRuleErr, 0, 1e-14, 'abs')
recordCheck('Born–von Kármán (§13)', 'Spettro Jacobi matrice D (N×N) vs monatomicOmega(k_j)', 'N = 1…24 (tutti i modi > 0)', 'coincidenza esatta', maxJacobiRelErr, 0, 1e-12, 'abs')

// Verifica bvkSnapToAllowedK: casi interni + CASO BORDO k = −π/a con N pari!
const snapInside = app.bvkSnapToAllowedK(0.51 * edgeM, metal.a, 10) // modi: -0.8,-0.6,-0.4,-0.2,0,0.2,0.4,0.6,0.8,1.0 → 0.6 (j=3)
recordCheck('Born–von Kármán (§13)', 'bvkSnapToAllowedK interno (k=0.51 π/a, N=10)', 'N=10, k=0.51 π/a', 'j=3 (kFrac=0.6)', snapInside.j, 3, 0, 'abs')

const snapMinusEdgeEven = app.bvkSnapToAllowedK(-edgeM, metal.a, 10)
// NOTA IMPORTANTE: fisicamente k = -π/a ≡ +π/a (j = +5, ω = ω_max, v_g = 0),
// ma bvkSnapToAllowedK usa distanza euclidea non periodica su (-π/a, π/a] e aggancia j = -4 (k = -0.8 π/a)!
const snapMinusEdgeInfo = {
  inputKFrac: -1,
  returnedJ: snapMinusEdgeEven.j,
  returnedKFrac: snapMinusEdgeEven.kFrac,
  omegaAtInput: app.monatomicOmega(-edgeM, metal),
  omegaAtSnapped: app.monatomicOmega(snapMinusEdgeEven.k, metal),
  periodicEquivalentJ: 5,
  periodicEquivalentKFrac: 1
}

// Esempio macroscopico della dispensa (§13.4, p. 33): L = 1 cm, a = 2.5 Å
const L_macro_m = 1e-2
const a_macro_A = 2.5
const N_macro = Math.round(L_macro_m / (a_macro_A * ANGSTROM_M)) // 4e7
const G_app_mInv = app.monatomicReciprocalG(a_macro_A) / ANGSTROM_M // 2π/a in m⁻¹
const deltaK_macro_mInv = G_app_mInv / N_macro // = 2π/L in m⁻¹
const ratio_macro = deltaK_macro_mInv / G_app_mInv // = 1/N

// Verifica legge di scala bvkAllowedK1D(a, N).deltaK * N = monatomicReciprocalG(a) fino a N = 10000
let maxScaleErr = 0
for (const N of [10, 100, 1000, 10000]) {
  const g = app.bvkAllowedK1D(a_macro_A, N)
  maxScaleErr = Math.max(maxScaleErr, relErr(g.deltaK * N, app.monatomicReciprocalG(a_macro_A)))
}

recordCheck('Esempio macroscopico (§13.4 p. 33)', 'N = L/a per L=1 cm, a=2.5 Å', 'L=1 cm, a=2.5 Å', '4·10⁷', N_macro, 4e7, 0, 'abs')
recordCheck('Esempio macroscopico (§13.4 p. 33)', 'Δk = 2π/L (m⁻¹)', 'L=1 cm, a=2.5 Å', '≈ 6,3·10² m⁻¹', deltaK_macro_mInv, (2 * Math.PI) / L_macro_m, 1e-13)
recordCheck('Esempio macroscopico (§13.4 p. 33)', 'Ampiezza zona G = 2π/a (m⁻¹)', 'a=2.5 Å', '≈ 2,5·10¹⁰ m⁻¹', G_app_mInv, (2 * Math.PI) / (a_macro_A * ANGSTROM_M), 1e-13)
recordCheck('Esempio macroscopico (§13.4 p. 33)', 'Rapporto Δk / (2π/a) = 1/N', 'L=1 cm, a=2.5 Å', '2,5·10⁻⁸', ratio_macro, 2.5e-8, 1e-13)
recordCheck('Esempio macroscopico (§13.4 p. 33)', 'Scala N·Δk = G fino a N=10⁴', 'N ∈ {10,100,1000,10000}', 'esatto', maxScaleErr, 0, 1e-14, 'abs')

// Confronto BvK vs estremi bloccati (Approfondimento p. 33-34): stesso conteggio N e media ω convergente
const N_cmp = 200
const bvk200 = app.bvkAllowedK1D(metal.a, N_cmp)
const meanOmegaBvK = bvk200.modes.reduce((acc, m) => acc + app.monatomicOmega(m.k, metal), 0) / N_cmp
let sumFixed = 0
for (let j = 1; j <= N_cmp; j++) {
  sumFixed += wMaxMetal * Math.sin((j * Math.PI) / (2 * (N_cmp + 1)))
}
const meanOmegaFixed = sumFixed / N_cmp
const meanOmegaAnalytic = (2 / Math.PI) * wMaxMetal // (1/(2π/a)) ∫_{-π/a}^{π/a} ω_max |sin(ka/2)| dk = (2/π) ω_max
recordCheck(
  'BvK vs Estremi bloccati (p. 33–34)',
  'Media ⟨ω⟩ BvK (N=200) vs integrale continuo (2/π)ω_max',
  'N=200, metallo tipico',
  '(2/π)ω_max (errore O(1/N²))',
  meanOmegaBvK,
  meanOmegaAnalytic,
  1e-4,
  'rel'
)
recordCheck(
  'BvK vs Estremi bloccati (p. 33–34)',
  'Media ⟨ω⟩ estremi bloccati (N=200) vs BvK (N=200)',
  'N=200, metallo tipico',
  'stesso limite N→∞ (O(1/N))',
  meanOmegaFixed,
  meanOmegaBvK,
  5e-3,
  'rel'
)

// ============================================================================
// 12. VERIFICA I: VALIDAZIONE INPUT (RangeError su parametri non validi)
// ============================================================================
const invalidCases = [
  () => app.monatomicZoneEdge(0),
  () => app.monatomicZoneEdge(-1),
  () => app.monatomicZoneEdge(Number.NaN),
  () => app.monatomicOmega(0.5, { a: 0, massAmu: 63.2, springC: 20 }),
  () => app.monatomicOmega(0.5, { a: 2.5, massAmu: -1, springC: 20 }),
  () => app.monatomicOmega(0.5, { a: 2.5, massAmu: 63.2, springC: 0 }),
  () => app.bvkAllowedK1D(0, 10),
  () => app.monatomicDisplacements(-2, 0.5, 0, 5)
]
const invalidAllThrew = invalidCases.every((fn) => {
  try {
    fn()
    return false
  } catch (e) {
    return e instanceof RangeError
  }
})
recordCheck('Validazione input', 'RangeError su a,M,C ≤ 0 o NaN', '8 casi non validi', 'throw RangeError', invalidAllThrew ? 1 : 0, 1, 0, 'abs')

// ============================================================================
// 13. STAMPA SOMMARIO E SALVATAGGIO JSON
// ============================================================================
const failed = checks.filter((c) => !c.pass)
const summary = {
  timestamp: new Date().toISOString(),
  totalChecks: checks.length,
  passedChecks: checks.length - failed.length,
  failedChecks: failed.length,
  presets: presetSummaries,
  dispensaExactMetal: {
    massKg: 1.05e-25,
    massAmu: massDispensaAmu,
    app: sumDispensa
  },
  smallKTable,
  evanescentTable: evTable,
  snapMinusEdgeEdgeCase: snapMinusEdgeInfo,
  macroscopicExample: {
    L_m: L_macro_m,
    a_A: a_macro_A,
    N: N_macro,
    deltaK_mInv: deltaK_macro_mInv,
    G_mInv: G_app_mInv,
    ratio: ratio_macro
  },
  checks
}

const outPath = resolve('crosscheck/fononi/phonon_monatomic_results.json')
writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8')

console.log('=== CROSSCHECK NUMERICO INDIPENDENTE — CATENA MONATOMICA 1D ===')
console.log(`Verifiche totali: ${summary.totalChecks} | Superate: ${summary.passedChecks} | Fallite: ${summary.failedChecks}`)
console.log('')

for (const c of checks) {
  const status = c.pass ? 'PASS' : 'FAIL'
  const errStr = c.mode === 'abs' ? `abs=${c.absErr.toExponential(2)}` : `rel=${c.relErr.toExponential(2)}`
  console.log(`[${status}] ${c.group} :: ${c.name} | ${errStr} (tol=${c.tol.toExponential(1)})`)
}

console.log('')
console.log('--- Preset Summaries (app) ---')
for (const [id, data] of Object.entries(presetSummaries)) {
  const s = data.app
  console.log(
    `${id}: √(C/M)=${s.sqrtCOverM.toExponential(6)} s⁻¹, ω_max=${s.omegaMaxRadS.toExponential(6)} rad/s, ν_max=${s.freqMaxThz.toFixed(6)} THz, ħω_max=${s.energyMaxMev.toFixed(6)} meV, v_s=${s.soundSpeedMs.toFixed(3)} m/s, π/a=${s.zoneEdge.toFixed(6)} Å⁻¹`
  )
}

console.log('')
console.log('--- Dettaglio Evanescente vicino a ω_max⁺ ---')
for (const row of evTable.filter((r) => r.ratio > 1)) {
  console.log(
    `r=${row.ratio}: κ_app=${row.kappaApp.toExponential(8)} Å⁻¹, κ_ref=${row.kappaRef.toExponential(8)} Å⁻¹, relErr=${row.relErr.toExponential(2)}, NewtonRes=${row.newtonRes.toExponential(2)}`
  )
}

console.log('')
console.log('--- Caso bordo bvkSnapToAllowedK(−π/a, a, N=10) ---')
console.log(JSON.stringify(snapMinusEdgeInfo, null, 2))
console.log(`\nRisultati completi salvati in: ${outPath}`)

if (failed.length > 0) {
  process.exitCode = 1
}
