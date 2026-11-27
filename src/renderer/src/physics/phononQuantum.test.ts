import { describe, expect, it } from 'vitest'
import { AMU_KG, HBAR_J_S, KB_EV_K } from './constants'
import { monatomicGroupVelocity, monatomicOmega, type MonatomicParams } from './phononDispersion'
import {
  TYPICAL_METAL_MASS_AMU,
  analyze1BZCollision,
  boseEinsteinLevelProbabilities,
  boseEinsteinOccupation,
  classicalProbabilityDensity,
  classicalProbabilityDensityDimless,
  classicalTurningPointAng,
  classicalTurningPointDimless,
  erfc,
  freqThzToOmegaRadS,
  harmonicEigenfunction,
  harmonicEigenfunctionDimless,
  harmonicLengthAng,
  oscillatorCurvesDimless,
  quantumEnergyLevel,
  quantumModeSummary,
  quantumProbabilityDensity,
  quantumProbabilityDensityDimless,
  quantumTunnelingFraction,
  thermalOscillatorSummary,
  thermalProbabilityDensityDimless,
  zeroPointRmsAng
} from './phononQuantum'

/** Esempio della dispensa Parte 6 (§3 p. 9 e §18.4 p. 47): M = 1,05·10⁻²⁵ kg, ω_max = 2,8·10¹³ rad/s, a = 2,5 Å. */
const DISPENSA_ZP_PARAMS = {
  massAmu: 1.05e-25 / AMU_KG,
  omegaRadS: 2.8e13,
  latticeA: 2.5
} as const

/** Catena monatomica tipica (§3, p. 9). */
const TYPICAL_METAL_CHAIN: MonatomicParams = {
  a: 2.5,
  massAmu: TYPICAL_METAL_MASS_AMU,
  springC: 20
}

/** Quadratura composita di Gauss–Legendre su [a, b] per verificare gli integrali nei test. */
function integrateSimpson(fn: (x: number) => number, a: number, b: number, steps = 2000): number {
  const n = steps % 2 === 0 ? steps : steps + 1
  const h = (b - a) / n
  let sum = fn(a) + fn(b)
  for (let i = 1; i < n; i++) {
    sum += (i % 2 === 0 ? 2 : 4) * fn(a + i * h)
  }
  return (sum * h) / 3
}

describe('phononQuantum — oscillatore armonico quantistico vs classico (Parte 6 §18)', () => {
  it('riproduce a_ho, Δx_zp e il rapporto 1,7% dell’esempio §18.4 (p. 47)', () => {
    const aHo = harmonicLengthAng(DISPENSA_ZP_PARAMS.massAmu, DISPENSA_ZP_PARAMS.omegaRadS)
    const dxZp = zeroPointRmsAng(DISPENSA_ZP_PARAMS.massAmu, DISPENSA_ZP_PARAMS.omegaRadS)
    const summary = quantumModeSummary(DISPENSA_ZP_PARAMS, 0)

    // dispensa §18.4: a_ho ≈ 0,060 Å, Δx = a_ho/√2 ≈ 0,042 Å, circa 1,7% di a = 2,5 Å
    expect(aHo).toBeCloseTo(0.05989, 3)
    expect(dxZp).toBeCloseTo(0.04235, 3)
    expect(summary.zpOverLattice).not.toBeNull()
    expect(summary.zpOverLattice! * 100).toBeCloseTo(1.69, 1)
    expect(summary.uCl).toBe(1)
    expect(summary.xClAng).toBeCloseTo(aHo, 12)
  })

  it('calcola correttamente erfc(1) ≈ 0,1573 e i livelli energetici E_n = (n + 1/2)ħω', () => {
    expect(erfc(0)).toBeCloseTo(1, 14)
    expect(erfc(1)).toBeCloseTo(0.157299207050285, 12)
    expect(erfc(2)).toBeCloseTo(0.004677734981047, 12)
    expect(erfc(3.5)).toBeCloseTo(7.430983723721985e-7, 15)
    expect(erfc(-1)).toBeCloseTo(2 - erfc(1), 12)

    const omega = freqThzToOmegaRadS(4.4)
    const e0 = quantumEnergyLevel(0, omega)
    const e3 = quantumEnergyLevel(3, omega)
    expect(e0.unitsHbarOmega).toBe(0.5)
    expect(e3.unitsHbarOmega).toBe(3.5)
    expect(e3.energyJ / e0.energyJ).toBeCloseTo(7, 14)
    expect(e0.energyMev).toBeCloseTo(0.5 * 4.4 * 4.135667696, 6)
  })

  it('mantiene normalizzazione ∫|Ψ_n(x)|² dx = 1, ⟨x²⟩ = (n+1/2)a_ho² e Δx·Δp = ħ/2 fino a n = 25 senza overflow', () => {
    const aHo = 0.06
    for (const n of [0, 1, 2, 6, 12, 20, 25]) {
      const normDimless = integrateSimpson(
        (u) => quantumProbabilityDensityDimless(n, u),
        -12,
        12,
        2400
      )
      expect(normDimless).toBeCloseTo(1, 10)

      // Verifica normalizzazione anche in coordinate fisiche x (Å)
      const normPhys = integrateSimpson(
        (x) => quantumProbabilityDensity(n, x, aHo),
        -12 * aHo,
        12 * aHo,
        2400
      )
      expect(normPhys).toBeCloseTo(1, 10)

      // Verifica ⟨u²⟩ = n + 1/2 ⇒ ⟨x²⟩ = (n + 1/2) a_ho²
      const u2Mean = integrateSimpson(
        (u) => u * u * quantumProbabilityDensityDimless(n, u),
        -12,
        12,
        2400
      )
      expect(u2Mean).toBeCloseTo(n + 0.5, 9)

      // Verifica assenza di NaN/Infinity agli estremi e sui nodi
      const psi0 = harmonicEigenfunction(n, 0, aHo)
      expect(Number.isFinite(psi0)).toBe(true)
      if (n % 2 === 1) {
        expect(Math.abs(psi0)).toBeLessThan(1e-14)
      }
    }

    // Ortogonalità tra stati diversi
    const overlap02 = integrateSimpson(
      (u) => harmonicEigenfunctionDimless(0, u) * harmonicEigenfunctionDimless(2, u),
      -10,
      10,
      1200
    )
    expect(Math.abs(overlap02)).toBeLessThan(1e-12)

    const overlap21_25 = integrateSimpson(
      (u) => harmonicEigenfunctionDimless(21, u) * harmonicEigenfunctionDimless(25, u),
      -12,
      12,
      2000
    )
    expect(Math.abs(overlap21_25)).toBeLessThan(1e-10)

    // Principio di indeterminazione minimo per n = 0 (eq. 51): Δx · Δp = ħ/2
    const omega = DISPENSA_ZP_PARAMS.omegaRadS
    const mKg = DISPENSA_ZP_PARAMS.massAmu * AMU_KG
    const aHoM = harmonicLengthAng(DISPENSA_ZP_PARAMS.massAmu, omega) * 1e-10
    const dxM = aHoM / Math.SQRT2
    const dpKgMs = HBAR_J_S / (Math.SQRT2 * aHoM)
    expect(dxM * dpKgMs).toBeCloseTo(0.5 * HBAR_J_S, 45)
    expect((0.5 * mKg * omega * omega * dxM * dxM) / (HBAR_J_S * omega)).toBeCloseTo(0.25, 12)
  })

  it('verifica la probabilità di tunneling erfc(1) ≈ 0,1573 a n = 0 e la decrescita con n', () => {
    const t0 = quantumTunnelingFraction(0)
    expect(t0).toBeCloseTo(erfc(1), 14)
    expect(t0).toBeCloseTo(0.1573, 4)

    const t1 = quantumTunnelingFraction(1)
    const t6 = quantumTunnelingFraction(6)
    const t20 = quantumTunnelingFraction(20)
    const t25 = quantumTunnelingFraction(25)

    // Confronto diretto con integrazione numerica esterna delle code 2 ∫_{u_cl}^∞ |ψ_n|² du
    const t6Direct = 2 * integrateSimpson((u) => quantumProbabilityDensityDimless(6, u), Math.sqrt(13), 12, 1600)
    const t20Direct = 2 * integrateSimpson((u) => quantumProbabilityDensityDimless(20, u), Math.sqrt(41), 14, 1600)
    expect(t6).toBeCloseTo(t6Direct, 10)
    expect(t20).toBeCloseTo(t20Direct, 10)

    expect(t1).toBeLessThan(t0)
    expect(t6).toBeLessThan(t1)
    expect(t20).toBeLessThan(t6)
    expect(t25).toBeLessThan(t20)
    expect(t25).toBeGreaterThan(0.01)
  })

  it('confronta P_cl(x) normalizzata e i punti di inversione x_cl = a_ho √(2n + 1)', () => {
    const uCl = classicalTurningPointDimless(6)
    expect(uCl).toBeCloseTo(Math.sqrt(13), 14)
    expect(classicalTurningPointAng(6, 0.06)).toBeCloseTo(0.06 * Math.sqrt(13), 14)

    // Minimo al centro: P_cl(0) = 1/(π u_cl)
    expect(classicalProbabilityDensityDimless(uCl, 0)).toBeCloseTo(1 / (Math.PI * uCl), 14)
    // Fuori dalla zona permessa è esattamente 0
    expect(classicalProbabilityDensityDimless(uCl, uCl)).toBe(0)
    expect(classicalProbabilityDensityDimless(uCl, uCl + 0.1)).toBe(0)
    expect(classicalProbabilityDensity(0.5, -0.6)).toBe(0)

    // Integrale di P_cl(u) mediante sostituzione trigonometrica u = u_cl sin θ (senza singolarità ai bordi)
    const normCl = integrateSimpson(
      (theta) => uCl * Math.cos(theta) * classicalProbabilityDensityDimless(uCl, uCl * Math.sin(theta)),
      -Math.PI / 2 + 1e-6,
      Math.PI / 2 - 1e-6,
      1000
    )
    expect(normCl).toBeCloseTo(1, 5)

    // Curve campionate coerenti
    const curves = oscillatorCurvesDimless(2, 4, 201)
    expect(curves.u.length).toBe(201)
    expect(curves.u[100]).toBeCloseTo(0, 12)
    expect(curves.probQuantum[100]).toBeCloseTo(1 / (2 * Math.sqrt(Math.PI)), 12)
  })
})

describe('phononQuantum — statistica di Bose–Einstein con μ = 0 (eq. 30, §11 e §17.3)', () => {
  it('rispetta i limiti bassa T (congelamento), alta T (k_B T / ħω) e somma unitaria dei pesi p_n(T)', () => {
    const omega = freqThzToOmegaRadS(4.4) // ħω ≈ 18,2 meV
    const hbarOmegaMev = 4.4 * 4.135667696

    // T = 0 → n̄ = 0, p_0 = 1; T = +∞ → n̄ = +∞
    expect(boseEinsteinOccupation(omega, 0)).toBe(0)
    expect(boseEinsteinOccupation(omega, Infinity)).toBe(Infinity)
    const pZero = boseEinsteinLevelProbabilities(omega, 0, 10)
    expect(pZero[0]).toBe(1)
    expect(pZero[1]).toBe(0)

    // Bassa T (10 K): k_B T ≈ 0,86 meV ≪ ħω ≈ 18,2 meV → n̄ ≈ e^{-ħω/k_B T}
    const nLow = boseEinsteinOccupation(omega, 10)
    const xLow = (hbarOmegaMev * 1e-3) / (KB_EV_K * 10)
    expect(nLow).toBeCloseTo(Math.exp(-xLow), 10)
    expect(nLow).toBeLessThan(1e-8)

    // T = 300 K: ħω / k_B T ≈ 0,7039 → n̄ ≈ 0,9789
    const n300 = boseEinsteinOccupation(omega, 300)
    expect(n300).toBeCloseTo(0.978857, 5)

    // Alta T (10000 K): n̄ ≃ k_B T / ħω − 1/2
    const nHigh = boseEinsteinOccupation(omega, 10000)
    const xHigh = (hbarOmegaMev * 1e-3) / (KB_EV_K * 10000)
    expect(nHigh).toBeCloseTo(1 / xHigh - 0.5, 2)

    // Somma dei pesi p_n(300 K) e valore atteso ∑ n p_n = n̄(300 K)
    const probs = boseEinsteinLevelProbabilities(omega, 300, 60)
    let sumP = 0
    let meanN = 0
    for (let n = 0; n < probs.length; n++) {
      sumP += probs[n]
      meanN += n * probs[n]
    }
    expect(sumP).toBeCloseTo(1, 12)
    expect(meanN).toBeCloseTo(n300, 10)
  })

  it('verifica la coincidenza tra somma diretta ∑ p_n(T)|ψ_n(u)|² e densità termica esatta (Mehler)', () => {
    const omega = freqThzToOmegaRadS(4.4)
    const T = 350
    const probs = boseEinsteinLevelProbabilities(omega, T, 70)

    for (const u of [0, 0.7, -1.4, 2.3]) {
      let sumSeries = 0
      for (let n = 0; n < probs.length; n++) {
        sumSeries += probs[n] * quantumProbabilityDensityDimless(n, u)
      }
      const exact = thermalProbabilityDensityDimless(omega, T, u)
      expect(sumSeries).toBeCloseTo(exact, 11)
    }

    const thSum = thermalOscillatorSummary(
      { massAmu: TYPICAL_METAL_MASS_AMU, omegaRadS: omega, latticeA: 2.5 },
      T
    )
    expect(thSum.meanUnitsHbarOmega).toBeCloseTo(thSum.nBar + 0.5, 14)
    expect(thSum.rmsAmpAng).toBeGreaterThan(zeroPointRmsAng(TYPICAL_METAL_MASS_AMU, omega))
  })
})

describe('phononQuantum — processi Normali vs Umklapp nella 1BZ (Lezione 3 §16.2, Fig. 19)', () => {
  it('riproduce esplicitamente l’esempio della dispensa §16.2: 0,7 + 0,6 π/a → −0,7 π/a con inversione di v_g', () => {
    const res = analyze1BZCollision(0.7, 0.6, TYPICAL_METAL_CHAIN)

    expect(res.kind).toBe('umklapp')
    expect(res.kSumFrac).toBeCloseTo(1.3, 12)
    expect(res.mG).toBe(-1)
    expect(res.gFrac).toBe(-2)
    expect(res.k3Frac).toBeCloseTo(-0.7, 12)
    expect(res.k3).toBeCloseTo(-0.7 * (Math.PI / TYPICAL_METAL_CHAIN.a), 12)

    // k₁, k₂ > 0 hanno v_g > 0; k₃ < 0 ha v_g < 0 (inversione del flusso)
    expect(res.vg1Ms).toBeGreaterThan(0)
    expect(res.vg2Ms).toBeGreaterThan(0)
    expect(res.vg3Ms).toBeLessThan(0)
    expect(res.vg3Ms).toBeCloseTo(-res.vg1Ms, 8)
    expect(res.sameInputDirection).toBe(true)
    expect(res.flowReversed).toBe(true)

    // Coerenza diretta con phononDispersion.ts
    expect(res.omega3RadS).toBeCloseTo(monatomicOmega(res.k3, TYPICAL_METAL_CHAIN), 10)
    expect(res.vg3Ms).toBeCloseTo(monatomicGroupVelocity(res.k3, TYPICAL_METAL_CHAIN), 10)
  })

  it('classifica correttamente processi Normali (G = 0) e Umklapp negativi (G = +2π/a)', () => {
    // Processo Normale: 0,3 + 0,4 = 0,7 ∈ (−1, 1]
    const norm = analyze1BZCollision(0.3, 0.4, TYPICAL_METAL_CHAIN)
    expect(norm.kind).toBe('normal')
    expect(norm.mG).toBe(0)
    expect(norm.gFrac).toBe(0)
    expect(norm.k3Frac).toBeCloseTo(0.7, 12)
    expect(norm.vg1Ms).toBeGreaterThan(0)
    expect(norm.vg2Ms).toBeGreaterThan(0)
    expect(norm.vg3Ms).toBeGreaterThan(0)
    expect(norm.flowReversed).toBe(false)

    // Umklapp negativo: −0,7 + (−0,6) = −1,3 → +0,7 π/a (G = +2π/a)
    const umkNeg = analyze1BZCollision(-0.7, -0.6, TYPICAL_METAL_CHAIN)
    expect(umkNeg.kind).toBe('umklapp')
    expect(umkNeg.mG).toBe(1)
    expect(umkNeg.gFrac).toBe(2)
    expect(umkNeg.k3Frac).toBeCloseTo(0.7, 12)
    expect(umkNeg.vg1Ms).toBeLessThan(0)
    expect(umkNeg.vg2Ms).toBeLessThan(0)
    expect(umkNeg.vg3Ms).toBeGreaterThan(0)
    expect(umkNeg.flowReversed).toBe(true)

    // Limite superiore di zona: 0,5 + 0,5 = +1,0 π/a resta in 1BZ (−π/a, π/a] ⇒ G = 0
    const edgePos = analyze1BZCollision(0.5, 0.5, TYPICAL_METAL_CHAIN)
    expect(edgePos.kind).toBe('normal')
    expect(edgePos.mG).toBe(0)
    expect(edgePos.k3Frac).toBeCloseTo(1, 12)
    expect(edgePos.vg3Ms).toBe(0)

    // Limite inferiore aperto −π/a: −0,5 − 0,5 = −1,0 π/a ripiega in +π/a ∈ (−π/a, π/a] tramite G = +2π/a
    const edgeNeg = analyze1BZCollision(-0.5, -0.5, TYPICAL_METAL_CHAIN)
    expect(edgeNeg.kind).toBe('umklapp')
    expect(edgeNeg.mG).toBe(1)
    expect(edgeNeg.k3Frac).toBeCloseTo(1, 12)
    expect(edgeNeg.vg3Ms).toBe(0)
  })
})
