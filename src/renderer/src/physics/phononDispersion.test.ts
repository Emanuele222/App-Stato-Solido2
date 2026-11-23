import { describe, expect, it } from 'vitest'
import { AMU_KG, ANGSTROM_IN_M, C_LIGHT_M_S, radSToMev, radSToThz } from './constants'
import {
  bvkAllowedK1D,
  bvkSnapToAllowedK,
  diatomicDispersionCurve,
  diatomicDisplacements,
  diatomicDynamicalMatrix,
  diatomicGroupVelocity,
  diatomicInfraredCrossing,
  diatomicModeAmplitude,
  diatomicOmega,
  diatomicPhaseVelocity,
  diatomicSoundSpeed,
  diatomicSummary,
  foldToFirstBZ,
  monatomicAdjacentAlias,
  monatomicAliasK,
  monatomicDispersionCurve,
  monatomicDisplacements,
  monatomicEvDecayKappa,
  monatomicGroupVelocity,
  monatomicOmega,
  monatomicOmegaMax,
  monatomicPhaseVelocity,
  monatomicSoundSpeed,
  monatomicSqrtCOverM,
  monatomicSummary,
  monatomicZoneEdge,
  velocityMsToMevAngstrom,
  velocityMsToThzAngstrom,
  type DiatomicParams,
  type MonatomicParams
} from './phononDispersion'

/** Esempio numerico della dispensa Parte 6, Lezione 1 §3 (p. 9): metallo tipico. */
const TYPICAL_METAL_KG: MonatomicParams = {
  a: 2.5,
  massAmu: 1.05e-25 / AMU_KG, // ≈ 63,2325 u
  springC: 20
}

describe('phononDispersion — catena monatomica (Parte 6, Lezione 1 §§1–5)', () => {
  it('riproduce i numeri di riferimento del metallo tipico (§3, p. 9)', () => {
    const summary = monatomicSummary(TYPICAL_METAL_KG)

    // √(C/M) = 1,38 · 10¹³ s⁻¹
    expect(summary.sqrtCOverM).toBeCloseTo(1.3801e13, -10)
    // v_s ≈ 3,5 · 10³ m/s (valore esatto 3450,3 m/s)
    expect(summary.soundSpeedMs).toBeGreaterThan(3400)
    expect(summary.soundSpeedMs).toBeLessThan(3500)
    expect(summary.soundSpeedMs / 1e3).toBeCloseTo(3.45, 2)
    // ω_max ≈ 2,8 · 10¹³ rad/s (valore esatto 2,760 · 10¹³)
    expect(summary.omegaMaxRadS / 1e13).toBeCloseTo(2.76, 2)
    // ν_max ≈ 4,4 THz (valore esatto 4,393 THz)
    expect(summary.freqMaxThz).toBeCloseTo(4.39, 2)
    // ħω_max ≈ 18 meV (valore esatto 18,17 meV)
    expect(summary.energyMaxMev).toBeCloseTo(18.17, 1)
  })

  it('rispetta i limiti analitici in k → 0, parità e correzione dispersiva (§3.2)', () => {
    const p = TYPICAL_METAL_KG
    const vs = monatomicSoundSpeed(p)

    // k = 0 → ω = 0
    expect(monatomicOmega(0, p)).toBe(0)

    // Limite acustico ka ≪ 1: ω ≃ v_s k [1 − (ka)²/24]
    const kSmall = 0.01 // Å⁻¹ → ka = 0,025 ≪ 1
    const ka = kSmall * p.a
    const wExact = monatomicOmega(kSmall, p)
    const wLinear = vs * (kSmall / ANGSTROM_IN_M)
    const wNext = wLinear * (1 - (ka * ka) / 24)
    expect(Math.abs(wExact - wLinear) / wExact).toBeLessThan(1e-4)
    expect(Math.abs(wExact - wNext) / wExact).toBeLessThan(1e-8)

    // v_p e v_g coincidono con v_s per k → 0⁺
    expect(monatomicPhaseVelocity(kSmall, p)).toBeCloseTo(vs, 0)
    expect(monatomicGroupVelocity(kSmall, p)).toBeCloseTo(vs, 0)

    // Parità di ω(k) e disparità di v_g(k), v_p(k)
    const kTest = 0.72
    const wTest = monatomicOmega(kTest, p)
    expect(Math.abs(monatomicOmega(-kTest, p) - wTest) / wTest).toBeLessThan(1e-14)
    expect(monatomicGroupVelocity(-kTest, p)).toBeCloseTo(-monatomicGroupVelocity(kTest, p), 6)
    expect(monatomicPhaseVelocity(-kTest, p)).toBeCloseTo(-monatomicPhaseVelocity(kTest, p), 6)
  })

  it('riproduce le proprietà al bordo di zona k = ±π/a (§3.3)', () => {
    const p = TYPICAL_METAL_KG
    const kb = monatomicZoneEdge(p.a)
    const wMax = monatomicOmegaMax(p)
    const vs = monatomicSoundSpeed(p)

    expect(Math.abs(monatomicOmega(kb, p) - wMax) / wMax).toBeLessThan(1e-14)
    expect(Math.abs(monatomicOmega(-kb, p) - wMax) / wMax).toBeLessThan(1e-14)

    // Onda stazionaria: v_g = 0, ma v_p = ω_max·a/π = (2/π)·v_s ≠ 0
    expect(monatomicGroupVelocity(kb, p)).toBe(0)
    expect(monatomicGroupVelocity(-kb, p)).toBe(0)
    expect(monatomicPhaseVelocity(kb, p)).toBeCloseTo((2 / Math.PI) * vs, 6)
    expect(monatomicPhaseVelocity(-kb, p)).toBeCloseTo(-(2 / Math.PI) * vs, 6)

    // Al bordo di zona u_n(t = 0) = (−1)^n (opposizione di fase)
    const disp = monatomicDisplacements(p.a, kb, 0, 7)
    for (const s of disp) {
      expect(s.u).toBeCloseTo(s.n % 2 === 0 ? 1 : -1, 12)
    }
  })

  it('verifica l’identità di aliasing per k′ = k + mG (§4.1)', () => {
    const p = TYPICAL_METAL_KG
    const k = 0.9 / p.a // esempio Fig. 5 della dispensa: ka = 0,9
    const phase = 1.23
    const w0 = monatomicOmega(k, p)

    for (const m of [-2, -1, 1, 2]) {
      const kPrime = monatomicAliasK(k, p.a, m)
      expect(Math.abs(monatomicOmega(kPrime, p) - w0) / w0).toBeLessThan(1e-14)
      const u1 = monatomicDisplacements(p.a, k, phase, 9)
      const u2 = monatomicDisplacements(p.a, kPrime, phase, 9)
      for (let i = 0; i < u1.length; i++) {
        expect(u2[i].u).toBeCloseTo(u1[i].u, 11)
      }
    }

    // Alias adiacente resta in [−2π/a, 2π/a]
    const kb = monatomicZoneEdge(p.a)
    const adjPos = monatomicAdjacentAlias(0.4 * kb, p.a)
    expect(adjPos.m).toBe(-1)
    expect(adjPos.kAlias).toBeCloseTo(-1.6 * kb, 12)
    const adjNeg = monatomicAdjacentAlias(-0.4 * kb, p.a)
    expect(adjNeg.m).toBe(1)
    expect(adjNeg.kAlias).toBeCloseTo(1.6 * kb, 12)
    expect(foldToFirstBZ(adjPos.kAlias, p.a)).toBeCloseTo(0.4 * kb, 12)
    expect(foldToFirstBZ(-kb, p.a)).toBeCloseTo(kb, 12)
  })

  it('calcola la costante di decadimento evanescente per ω > ω_max (§3.4)', () => {
    const p = TYPICAL_METAL_KG
    const wMax = monatomicOmegaMax(p)
    expect(monatomicEvDecayKappa(0.5 * wMax, p)).toBe(0)
    expect(monatomicEvDecayKappa(wMax, p)).toBe(0)

    const wAbove = 1.35 * wMax
    const kappa = monatomicEvDecayKappa(wAbove, p)
    expect(kappa).toBeGreaterThan(0)
    // cos(π + iκa) = −cosh(κa) = 1 − Mω²/(2C)
    const rhs = 1 - (wAbove * wAbove) / (2 * monatomicSqrtCOverM(p) ** 2)
    expect(-Math.cosh(kappa * p.a)).toBeCloseTo(rhs, 12)
  })

  it('campiona la curva di dispersione coerente con le conversioni THz/meV e pendenza dν/dk', () => {
    const p = TYPICAL_METAL_KG
    const kb = monatomicZoneEdge(p.a)
    const curve = monatomicDispersionCurve(p, -2 * kb, 2 * kb, 401)
    expect(curve.k.length).toBe(401)
    // k = 0 è al centro (indice 200)
    expect(curve.k[200]).toBeCloseTo(0, 12)
    expect(curve.freqThz[200]).toBeCloseTo(0, 12)
    // k = π/a è all'indice 300
    expect(curve.k[300]).toBeCloseTo(kb, 12)
    expect(curve.freqThz[300]).toBeCloseTo(radSToThz(monatomicOmegaMax(p)), 10)
    expect(curve.energyMev[300]).toBeCloseTo(radSToMev(monatomicOmegaMax(p)), 10)

    // Verifica numerica della pendenza dν/dk rispetto a velocityMsToThzAngstrom(v_g)
    const k0 = 0.55 * kb
    const dk = 1e-5
    const numSlope =
      (radSToThz(monatomicOmega(k0 + dk, p)) - radSToThz(monatomicOmega(k0 - dk, p))) / (2 * dk)
    const analyticSlope = velocityMsToThzAngstrom(monatomicGroupVelocity(k0, p))
    expect(numSlope).toBeCloseTo(analyticSlope, 6)

    // Verifica d(ħω)/dk in meV·Å e periodicità di v_g(k + G) fuori 1BZ
    const numSlopeMev =
      (radSToMev(monatomicOmega(k0 + dk, p)) - radSToMev(monatomicOmega(k0 - dk, p))) / (2 * dk)
    expect(numSlopeMev).toBeCloseTo(velocityMsToMevAngstrom(monatomicGroupVelocity(k0, p)), 6)
    expect(monatomicGroupVelocity(monatomicAliasK(k0, p.a, 1), p)).toBeCloseTo(
      monatomicGroupVelocity(k0, p),
      6
    )
    expect(monatomicGroupVelocity(monatomicAliasK(k0, p.a, -1), p)).toBeCloseTo(
      monatomicGroupVelocity(k0, p),
      6
    )
  })

  it('rifiuta parametri non positivi (a, M, C ≤ 0)', () => {
    expect(() => monatomicOmega(0.5, { a: 0, massAmu: 63.2, springC: 20 })).toThrow(RangeError)
    expect(() => monatomicOmega(0.5, { a: 2.5, massAmu: -1, springC: 20 })).toThrow(RangeError)
    expect(() => monatomicOmega(0.5, { a: 2.5, massAmu: 63.2, springC: 0 })).toThrow(RangeError)
    expect(() => bvkAllowedK1D(0, 10)).toThrow(RangeError)
  })
})

describe('phononDispersion — condizioni periodiche di Born–von Kármán (Lezione 3 §13)', () => {
  it('genera esattamente N modi in (−π/a, π/a] per N pari e N dispari (eq. 32, Fig. 15–16)', () => {
    const a = 2.5
    const kb = monatomicZoneEdge(a)

    for (const N of [4, 7, 8, 9, 10, 24]) {
      const grid = bvkAllowedK1D(a, N)
      expect(grid.modes.length).toBe(N)
      expect(grid.deltaK).toBeCloseTo((2 * Math.PI) / (N * a), 12)

      // Tutti i k cadono strettamente in (−π/a, π/a]
      for (const mode of grid.modes) {
        expect(mode.k).toBeGreaterThan(-kb + 1e-12)
        expect(mode.k).toBeLessThanOrEqual(kb + 1e-12)
      }

      // Per N pari j_max = N/2 → include +π/a e esclude −π/a; per N dispari simmetrico
      if (N % 2 === 0) {
        expect(grid.modes[grid.modes.length - 1].k).toBeCloseTo(kb, 12)
        expect(grid.modes[0].j).toBe(-N / 2 + 1)
      } else {
        expect(grid.modes[0].j).toBe(-(N - 1) / 2)
        expect(grid.modes[grid.modes.length - 1].j).toBe((N - 1) / 2)
      }
    }

    // Esempio macroscopico (§13.4, p. 33): L = 1 cm, a = 2,5 Å → N = 4·10⁷, Δk ≈ 6,28·10² m⁻¹
    const L = 1e-2 // m
    const aM = 2.5 * ANGSTROM_IN_M
    const nMacro = Math.round(L / aM)
    expect(nMacro).toBe(4e7)
    const deltaKMacro = (2 * Math.PI) / (nMacro * aM)
    expect(deltaKMacro).toBeCloseTo(628.32, 1)
  })

  it('aggancia al modo Born–von Kármán più vicino', () => {
    const a = 2.5
    const kb = monatomicZoneEdge(a)
    // Con N = 10 i passi in kFrac sono 0,2: −0,8, −0,6, …, 0,8, 1,0
    expect(bvkSnapToAllowedK(0.38 * kb, a, 10).j).toBe(2)
    expect(bvkSnapToAllowedK(-0.99 * kb, a, 10).j).toBe(-4)
    expect(bvkSnapToAllowedK(0.95 * kb, a, 10).j).toBe(5)
  })
})

/** Esempio numerico della dispensa Parte 6, Lezione 2 §8 (p. 23) e Lezione 4 §24 (p. 60): coppia Na–Cl. */
const NACL_PAIR: DiatomicParams = {
  a: 5.64,
  massHeavyAmu: 35.5,
  massLightAmu: 23.0,
  springC: 10
}

/** Caso canonico M = 2m (dispensa Parte 6, Figg. 11–12 e Fig. 28). */
const MASS_RATIO_2: DiatomicParams = {
  a: 5.0,
  massHeavyAmu: 40.0,
  massLightAmu: 20.0,
  springC: 10
}

describe('phononDispersion — catena biatomica, gap, matrice 2×2 e luce IR (Parte 6 §§7–8, §10.3, §24)', () => {
  it('riproduce i numeri di riferimento della coppia Na–Cl (§8 p. 23)', () => {
    const sum = diatomicSummary(NACL_PAIR)

    // v_s ≈ 4,1·10³ m/s (valore esatto 4046,3 m/s)
    expect(sum.soundSpeedMs / 1e3).toBeCloseTo(4.05, 2)
    expect(diatomicSoundSpeed(NACL_PAIR)).toBeCloseTo(sum.soundSpeedMs, 10)

    // Punto C: ω_max^ac = √(2C/M) ≈ 1,84·10¹³ rad/s (≈ 2,9 THz)
    expect(sum.omegaAcousticMaxRadS / 1e13).toBeCloseTo(1.84, 2)
    expect(sum.freqAcousticMaxThz).toBeCloseTo(2.93, 2)

    // Punto B: ω_min^ott = √(2C/m) ≈ 2,29·10¹³ rad/s (≈ 3,6 THz)
    expect(sum.omegaOpticalMinRadS / 1e13).toBeCloseTo(2.29, 2)
    expect(sum.freqOpticalMinThz).toBeCloseTo(3.64, 2)

    // Centro ottico: ω_+(0) = √(2C(1/m + 1/M)) ≈ 2,94·10¹³ rad/s (≈ 4,7 THz, ħω ≈ 19 meV)
    expect(sum.omegaOpticalZeroRadS / 1e13).toBeCloseTo(2.94, 2)
    expect(sum.freqOpticalZeroThz).toBeCloseTo(4.68, 2)
    expect(sum.energyOpticalZeroMev).toBeCloseTo(19.3, 1)

    // Gap fononico ≈ 0,7 THz (valore esatto 0,711 THz)
    expect(sum.freqGapThz).toBeCloseTo(0.71, 2)
    expect(sum.omegaGapRadS).toBeCloseTo(sum.omegaOpticalMinRadS - sum.omegaAcousticMaxRadS, 1)
    expect(sum.equalMasses).toBe(false)
    expect(sum.invertedMasses).toBe(false)
  })

  it('riproduce i numeri della luce infrarossa su Na–Cl (§24 p. 60, eq. 60)', () => {
    const ir = diatomicInfraredCrossing(NACL_PAIR, 1)
    const sum = diatomicSummary(NACL_PAIR)

    // Incrocio praticamente a ω_+(0) (scarto relativo ~10⁻¹⁰)
    expect(Math.abs(ir.omegaRadS - sum.omegaOpticalZeroRadS) / sum.omegaOpticalZeroRadS).toBeLessThan(1e-9)
    // Verifica esatta dell'equazione d'incrocio ω_+(k_luce) = c·k_luce
    const wAtCross = diatomicOmega(ir.kLightAngInv, 'optical', NACL_PAIR)
    expect(Math.abs(wAtCross - C_LIGHT_M_S * ir.kLightMInv) / wAtCross).toBeLessThan(1e-12)

    // Dispensa §24 p. 60: λ ≈ 64 µm, k_luce ≈ 1·10⁵ m⁻¹, k_luce/(π/a) ≈ 2·10⁻⁵
    expect(ir.wavelengthUm).toBeCloseTo(64.1, 1)
    expect(ir.kLightMInv / 1e5).toBeCloseTo(0.98, 2)
    expect(ir.kOverZoneEdge / 1e-5).toBeCloseTo(1.76, 2)
    expect(ir.speedRatio).toBeGreaterThan(5e4)
  })

  it('soddisfa i limiti esatti in k → 0 e al bordo di zona k = ±π/a (punti C e B, Fig. 11–12)', () => {
    const p = MASS_RATIO_2
    const sum = diatomicSummary(p)
    const kb = sum.zoneEdge

    // k = 0 acustico: ω = 0, α = 1 (in fase), R_cm = 1
    expect(diatomicOmega(0, 'acoustic', p)).toBe(0)
    const acZero = diatomicModeAmplitude(0, 'acoustic', p)
    expect(acZero.alpha).toBeCloseTo(1, 12)
    expect(acZero.cmAmp).toBeCloseTo(1, 12)
    expect(diatomicPhaseVelocity(0, 'acoustic', p)).toBeNull()

    // Limite acustico k → 0⁺: ω_- ≃ v_s k, v_p ≈ v_g ≈ v_s
    const kSmall = 1e-4
    expect(diatomicOmega(kSmall, 'acoustic', p) / (kSmall / ANGSTROM_IN_M)).toBeCloseTo(sum.soundSpeedMs, 2)
    expect(diatomicGroupVelocity(kSmall, 'acoustic', p)).toBeCloseTo(sum.soundSpeedMs, 2)
    expect(diatomicPhaseVelocity(kSmall, 'acoustic', p)).toBeCloseTo(sum.soundSpeedMs, 2)

    // k = 0 ottico: ω_+(0), α = −M/m = −2, R_cm = 0 (centro di massa fermo), v_g = 0, v_p = null (∞)
    expect(diatomicOmega(0, 'optical', p)).toBeCloseTo(sum.omegaOpticalZeroRadS, 0)
    const opZero = diatomicModeAmplitude(0, 'optical', p)
    expect(opZero.alpha).toBeCloseTo(-2, 12)
    expect(opZero.cmAmp).toBe(0)
    expect(diatomicGroupVelocity(0, 'optical', p)).toBe(0)
    expect(diatomicPhaseVelocity(0, 'optical', p)).toBeNull()

    // Bordo zona k = π/a, punto C (acustico): ω = √(2C/M), α = 0 (m ferma), v_g = 0
    expect(Math.abs(diatomicOmega(kb, 'acoustic', p) - sum.omegaAcousticMaxRadS) / sum.omegaAcousticMaxRadS).toBeLessThan(1e-14)
    const modeC = diatomicModeAmplitude(kb, 'acoustic', p)
    expect(modeC.alpha).toBe(0)
    expect(modeC.lightStationary).toBe(true)
    expect(modeC.heavyStationary).toBe(false)
    expect(diatomicGroupVelocity(kb, 'acoustic', p)).toBe(0)

    // Bordo zona k = π/a, punto B (ottico): ω = √(2C/m), 1/α = 0 (M ferma), v_g = 0
    expect(Math.abs(diatomicOmega(kb, 'optical', p) - sum.omegaOpticalMinRadS) / sum.omegaOpticalMinRadS).toBeLessThan(1e-14)
    const modeB = diatomicModeAmplitude(kb, 'optical', p)
    expect(modeB.alpha).toBeNull()
    expect(modeB.invAlpha).toBe(0)
    expect(modeB.heavyStationary).toBe(true)
    expect(modeB.lightStationary).toBe(false)
    expect(diatomicGroupVelocity(kb, 'optical', p)).toBe(0)

    // Verifica spostamenti al punto C e al punto B a φ = 0: specie mobile ha |u| = 1, ferma ha u = 0
    const dispC = diatomicDisplacements(p, kb, 'acoustic', 0, 4)
    for (const s of dispC) {
      if (s.species === 'm') expect(s.u).toBe(0)
      else expect(Math.abs(s.u)).toBeCloseTo(1, 12)
    }
    const dispB = diatomicDisplacements(p, kb, 'optical', 0, 4)
    for (const s of dispB) {
      if (s.species === 'M') expect(s.u).toBe(0)
      else expect(Math.abs(s.u)).toBeCloseTo(1, 12)
    }
  })

  it('chiude il gap con continuità per M = m e riproduce la monatomica ripiegata di passo a/2 (§8.3 p. 23)', () => {
    const eqParams: DiatomicParams = { a: 5.0, massHeavyAmu: 28, massLightAmu: 28, springC: 10 }
    const monoHalfA: MonatomicParams = { a: 2.5, massAmu: 28, springC: 10 }
    const sum = diatomicSummary(eqParams)
    const kb = sum.zoneEdge

    expect(sum.equalMasses).toBe(true)
    expect(sum.omegaGapRadS).toBe(0)
    expect(sum.freqGapThz).toBe(0)
    expect(sum.soundSpeedMs).toBeCloseTo(monatomicSoundSpeed(monoHalfA), 8)
    expect(sum.omegaOpticalZeroRadS).toBeCloseTo(monatomicOmegaMax(monoHalfA), 0)

    // In 1BZ [−π/a, π/a]: ω_- = 2√(C/m)|sin(ka/4)| = monatomica(a/2); ω_+ = monatomica(a/2) in k − 2π/a
    for (const frac of [-0.9, -0.5, -0.2, 0, 0.25, 0.6, 1.0]) {
      const k = frac * kb
      const wAc = diatomicOmega(k, 'acoustic', eqParams)
      const wOp = diatomicOmega(k, 'optical', eqParams)
      const wMonoK = monatomicOmega(k, monoHalfA)
      const wMonoFolded = monatomicOmega(k - sum.reciprocalG, monoHalfA)
      expect(Math.abs(wAc - wMonoK) / (sum.omegaOpticalZeroRadS)).toBeLessThan(1e-13)
      expect(Math.abs(wOp - wMonoFolded) / (sum.omegaOpticalZeroRadS)).toBeLessThan(1e-13)
    }

    // Continuità del gap per M → m⁺
    const nearEq: DiatomicParams = { a: 5.0, massHeavyAmu: 28.001, massLightAmu: 28, springC: 10 }
    expect(diatomicSummary(nearEq).freqGapThz).toBeGreaterThan(0)
    expect(diatomicSummary(nearEq).freqGapThz).toBeLessThan(1e-3)
  })

  it('gestisce in modo sicuro e simmetrico il caso invertito m > M', () => {
    const swapped: DiatomicParams = {
      a: NACL_PAIR.a,
      massHeavyAmu: NACL_PAIR.massLightAmu,
      massLightAmu: NACL_PAIR.massHeavyAmu,
      springC: NACL_PAIR.springC
    }
    const sumOrig = diatomicSummary(NACL_PAIR)
    const sumSwap = diatomicSummary(swapped)
    const kb = sumSwap.zoneEdge

    expect(sumSwap.invertedMasses).toBe(true)
    expect(sumSwap.soundSpeedMs).toBeCloseTo(sumOrig.soundSpeedMs, 10)
    expect(sumSwap.omegaAcousticMaxRadS).toBeCloseTo(sumOrig.omegaAcousticMaxRadS, 0)
    expect(sumSwap.omegaOpticalMinRadS).toBeCloseTo(sumOrig.omegaOpticalMinRadS, 0)
    expect(sumSwap.omegaGapRadS).toBeCloseTo(sumOrig.omegaGapRadS, 0)
    expect(sumSwap.omegaGapRadS).toBeGreaterThan(0)

    // A k = π/a con m > M: sul ramo acustico (C) oscilla la massa più pesante (ora m) e M è ferma
    const modeC = diatomicModeAmplitude(kb, 'acoustic', swapped)
    expect(modeC.heavyStationary).toBe(true)
    expect(modeC.lightStationary).toBe(false)
    // Sul ramo ottico (B) oscilla la massa più leggera (ora M) e m è ferma
    const modeB = diatomicModeAmplitude(kb, 'optical', swapped)
    expect(modeB.lightStationary).toBe(true)
    expect(modeB.heavyStationary).toBe(false)
  })

  it('coincide con la diagonalizzazione diretta della matrice dinamica 2×2 (§10.3 p. 27)', () => {
    const kb = monatomicZoneEdge(NACL_PAIR.a)
    const mH = NACL_PAIR.massHeavyAmu * AMU_KG
    const mL = NACL_PAIR.massLightAmu * AMU_KG

    for (const frac of [-1, -0.7, -0.3, 0, 0.25, 0.5, 0.85, 1]) {
      const k = frac * kb
      const dm = diatomicDynamicalMatrix(k, NACL_PAIR)
      const wAc = diatomicOmega(k, 'acoustic', NACL_PAIR)
      const wOp = diatomicOmega(k, 'optical', NACL_PAIR)

      // Autovalori ω² e pulsazioni ω identici all'eq. (20)
      expect(Math.abs(dm.omegasRadS[0] - wAc) / wOp).toBeLessThan(1e-13)
      expect(Math.abs(dm.omegasRadS[1] - wOp) / wOp).toBeLessThan(1e-13)

      // Invarianti: traccia = ω₋² + ω₊², determinante = ω₋²ω₊²
      expect(Math.abs(dm.trace - (wAc * wAc + wOp * wOp)) / dm.trace).toBeLessThan(1e-13)
      expect(Math.abs(dm.det - wAc * wAc * wOp * wOp) / (dm.trace * dm.trace)).toBeLessThan(1e-13)

      // Equazione agli autovalori D·ε = ω²·ε e ortonormalità degli autovettori
      const [eAc, eOp] = dm.eigenvectors
      expect(eAc[0] * eAc[0] + eAc[1] * eAc[1]).toBeCloseTo(1, 13)
      expect(eOp[0] * eOp[0] + eOp[1] * eOp[1]).toBeCloseTo(1, 13)
      expect(Math.abs(eAc[0] * eOp[0] + eAc[1] * eOp[1])).toBeLessThan(1e-13)

      for (const [idx, eig] of [
        [0, dm.eigenvalues[0]],
        [1, dm.eigenvalues[1]]
      ] as const) {
        const v = dm.eigenvectors[idx]
        const r0 = dm.d11 * v[0] + dm.d12 * v[1] - eig * v[0]
        const r1 = dm.d12 * v[0] + dm.d22 * v[1] - eig * v[1]
        expect(Math.hypot(r0, r1) / dm.trace).toBeLessThan(1e-13)
      }

      // Rapporto α dagli autovettori pesati (u_m/u_M = (ε_m/√m)/(ε_M/√M)) coincide con diatomicModeAmplitude
      const ampOp = diatomicModeAmplitude(k, 'optical', NACL_PAIR)
      if (ampOp.alpha !== null) {
        const alphaFromEig = (eOp[1] / Math.sqrt(mL)) / (eOp[0] / Math.sqrt(mH))
        expect(alphaFromEig).toBeCloseTo(ampOp.alpha, 10)
      }
    }
  })

  it('verifica velocità di gruppo analitica (incluso v_g < 0 sul ramo ottico) contro derivata numerica e curva campionata', () => {
    const p = NACL_PAIR
    const kb = monatomicZoneEdge(p.a)
    const dk = 1e-5

    for (const frac of [-0.7, -0.35, 0.35, 0.7]) {
      const k = frac * kb
      for (const branch of ['acoustic', 'optical'] as const) {
        const vgAnalytic = diatomicGroupVelocity(k, branch, p)
        const dOmegaDkNum = (diatomicOmega(k + dk, branch, p) - diatomicOmega(k - dk, branch, p)) / (2 * dk)
        const vgNum = dOmegaDkNum * ANGSTROM_IN_M
        expect(vgAnalytic).toBeCloseTo(vgNum, 3)
        // Parità/disparità: per k > 0 acustico ha v_g > 0 e ottico ha v_g < 0 (§8.1 p. 21)
        if (k > 0) {
          if (branch === 'acoustic') expect(vgAnalytic).toBeGreaterThan(0)
          else expect(vgAnalytic).toBeLessThan(0)
        }
      }
    }

    // Campionamento della curva
    const curve = diatomicDispersionCurve(p, -kb, kb, 201)
    expect(curve.k.length).toBe(201)
    expect(curve.acousticFreqThz[100]).toBe(0)
    expect(curve.opticalFreqThz[100]).toBeCloseTo(diatomicSummary(p).freqOpticalZeroThz, 10)
    expect(curve.acousticFreqThz[200]).toBeCloseTo(diatomicSummary(p).freqAcousticMaxThz, 10)
    expect(curve.opticalFreqThz[200]).toBeCloseTo(diatomicSummary(p).freqOpticalMinThz, 10)
  })

  it('rifiuta parametri non validi nella catena biatomica e nella luce IR', () => {
    expect(() => diatomicSummary({ a: 0, massHeavyAmu: 35.5, massLightAmu: 23, springC: 10 })).toThrow(RangeError)
    expect(() => diatomicSummary({ a: 5.64, massHeavyAmu: -1, massLightAmu: 23, springC: 10 })).toThrow(RangeError)
    expect(() => diatomicSummary({ a: 5.64, massHeavyAmu: 35.5, massLightAmu: 0, springC: 10 })).toThrow(RangeError)
    expect(() => diatomicSummary({ a: 5.64, massHeavyAmu: 35.5, massLightAmu: 23, springC: Number.NaN })).toThrow(RangeError)
    expect(() => diatomicInfraredCrossing(NACL_PAIR, 0)).toThrow(RangeError)
  })

  it('verifica casi limite aggiuntivi: D(k) per k → 0, punto degenere M = m al bordo, m > M in D(k), R_cm a k ≠ 0 e IR con n > 1', () => {
    // 1. Stabilità di diatomicDynamicalMatrix per k molto piccolo (nessuna cancellazione in det)
    const kTiny = 1e-8
    const dmTiny = diatomicDynamicalMatrix(kTiny, NACL_PAIR)
    const wAcTiny = diatomicOmega(kTiny, 'acoustic', NACL_PAIR)
    expect(Math.abs(dmTiny.omegasRadS[0] - wAcTiny) / wAcTiny).toBeLessThan(1e-13)

    // 2. Punto degenere M = m al bordo zona k = π/a
    const eqParams: DiatomicParams = { a: 5.0, massHeavyAmu: 28, massLightAmu: 28, springC: 10 }
    const kbEq = monatomicZoneEdge(eqParams.a)
    const dmDeg = diatomicDynamicalMatrix(kbEq, eqParams)
    expect(Math.abs(dmDeg.omegasRadS[0] - dmDeg.omegasRadS[1]) / dmDeg.omegasRadS[1]).toBeLessThan(1e-14)
    const ampAcDeg = diatomicModeAmplitude(kbEq, 'acoustic', eqParams)
    const ampOpDeg = diatomicModeAmplitude(kbEq, 'optical', eqParams)
    expect(ampAcDeg.alpha).toBeCloseTo(1, 12)
    expect(ampOpDeg.alpha).toBeCloseTo(-1, 12)
    // Con M = m e ka/2 = π/2: |1 ± i|/2 = 1/√2 ≈ 0,7071
    expect(ampAcDeg.cmAmp).toBeCloseTo(Math.SQRT1_2, 12)
    expect(ampOpDeg.cmAmp).toBeCloseTo(Math.SQRT1_2, 12)

    // 3. Caso invertito m > M in diatomicDynamicalMatrix
    const swapped: DiatomicParams = { a: 5.64, massHeavyAmu: 23.0, massLightAmu: 35.5, springC: 10 }
    const kTest = 0.6 * monatomicZoneEdge(swapped.a)
    const dmSwap = diatomicDynamicalMatrix(kTest, swapped)
    expect(Math.abs(dmSwap.omegasRadS[0] - diatomicOmega(kTest, 'acoustic', swapped)) / dmSwap.omegasRadS[1]).toBeLessThan(1e-13)
    expect(Math.abs(dmSwap.omegasRadS[1] - diatomicOmega(kTest, 'optical', swapped)) / dmSwap.omegasRadS[1]).toBeLessThan(1e-13)

    // 4. R_cm a k ≠ 0 sul ramo ottico è > 0 (sfasamento ka/2)
    const ampMid = diatomicModeAmplitude(0.5 * monatomicZoneEdge(NACL_PAIR.a), 'optical', NACL_PAIR)
    expect(ampMid.cmAmp).toBeGreaterThan(0.1)
    expect(ampMid.cmAmp).toBeLessThan(1)

    // 5. Incrocio luce IR in dielettrico con indice di rifrazione n = 1,5 (k_luce scala di n)
    const ir1 = diatomicInfraredCrossing(NACL_PAIR, 1)
    const irN = diatomicInfraredCrossing(NACL_PAIR, 1.5)
    expect(irN.refractiveIndex).toBe(1.5)
    expect(irN.kLightMInv / ir1.kLightMInv).toBeCloseTo(1.5, 6)
    expect(irN.wavelengthUm).toBeCloseTo(ir1.wavelengthUm, 6)
  })
})
