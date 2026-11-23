import { describe, expect, it } from 'vitest'
import { AMU_KG, ANGSTROM_IN_M, radSToMev, radSToThz } from './constants'
import {
  bvkAllowedK1D,
  bvkSnapToAllowedK,
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
