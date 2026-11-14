import { describe, expect, it } from 'vitest'
import {
  HBAR2_OVER_2M0,
  effectiveMassRatio,
  kDotPPath1D,
  kaneBands,
  kaneConductionFreeParabola,
  kaneEffectiveMasses,
  kaneEnergiesAt,
  kaneEpFromP,
  kaneMassBreakdown,
  kanePFromEp,
  nearlyFreeKpVerification,
  planeWaveMomentumElementSq,
  solveCentralEquation1D,
  spinOrbitGammaLevels,
  twoBandExactBands,
  twoBandMassBreakdown,
  twoBandParabolicBands,
  twoBandStateAt,
  twoBandValidityLimitK,
  zoneEdge1D
} from './index'

describe('metodo k·p — parametro di Kane, spin–orbita e bande di Kane', () => {
  it('conversione P di Kane ↔ E_P (E_P = 20 eV ⇒ P = 8,729 eV·Å)', () => {
    const p = kanePFromEp(20)
    expect(p).toBeCloseTo(8.729, 3)
    expect(kaneEpFromP(p)).toBeCloseTo(20, 12)
    expect(kanePFromEp(0)).toBe(0)
  })

  it('GaAs (E_g = 1,43, Δ = 0,34, E_P = 20 eV) e InSb (0,18; 0,82; 20): masse efficaci di Kane', () => {
    const gaas = kaneEffectiveMasses({ eg: 1.43, delta: 0.34, ep: 20 })
    expect(gaas.mc).toBeCloseTo(0.0710, 4)
    expect(gaas.mlh).toBeCloseTo(0.0969, 4)
    expect(gaas.mso).toBeCloseTo(0.2098, 4)
    expect(gaas.mhh).toBe(1)
    expect(gaas.pKane).toBeCloseTo(8.729, 3)

    const insb = kaneEffectiveMasses({ eg: 0.18, delta: 0.82, ep: 20 })
    expect(insb.mc).toBeCloseTo(0.0122, 4)
  })

  it('Δ → 0: E_c → E_g + ħ²k²/2m₀ + P²k²/E_g (pesi 2/3 e 1/3 sommano a 1)', () => {
    const eg = 1.43
    const ep = 20
    const p = kanePFromEp(ep)
    const k = 0.06
    const [, , , ecDeltaZero] = kaneEnergiesAt({ eg, delta: 0, ep }, k)
    const expected = eg + HBAR2_OVER_2M0 * k * k + (p * p * k * k) / eg
    expect(ecDeltaZero).toBeCloseTo(expected, 12)

    const br = kaneMassBreakdown({ eg, delta: 0, ep }, 'c')
    const lhTerm = br.terms.find((t) => t.source === 'lh')?.value ?? 0
    const soTerm = br.terms.find((t) => t.source === 'so')?.value ?? 0
    expect(lhTerm + soTerm).toBeCloseTo(ep / eg, 12)
    expect(lhTerm / (lhTerm + soTerm)).toBeCloseTo(2 / 3, 12)
    expect(soTerm / (lhTerm + soTerm)).toBeCloseTo(1 / 3, 12)
    expect(br.totalInvMass).toBeCloseTo(1 + ep / eg, 12)

    // Anche hh ha contributo di accoppiamento nullo
    const brHh = kaneMassBreakdown({ eg, delta: 0.34, ep }, 'hh')
    expect(brHh.terms).toEqual([{ source: 'free', value: -1 }])
    expect(brHh.massMagnitude).toBe(1)
  })

  it('BandStructure di Kane, cammino attorno a Γ e parabola libera di confronto', () => {
    const params = { eg: 1.43, delta: 0.34, ep: 20 }
    const path = kDotPPath1D(0.12, 101)
    expect(path.dimension).toBe(1)
    const mid = (path.points.length - 1) / 2
    expect(path.points[mid][0]).toBe(0)

    const bs = kaneBands(params, path)
    expect(bs.method).toBe('k-dot-p')
    expect(bs.energies).toHaveLength(4)
    expect(bs.energies[0][mid]).toBeCloseTo(-params.delta, 12) // so
    expect(bs.energies[1][mid]).toBeCloseTo(0, 12) // lh
    expect(bs.energies[2][mid]).toBeCloseTo(0, 12) // hh
    expect(bs.energies[3][mid]).toBeCloseTo(params.eg, 12) // c

    // Confronto con curvatura numerica di effectiveMassRatio
    const masses = kaneEffectiveMasses(params)
    expect(effectiveMassRatio((k) => kaneEnergiesAt(params, k)[3], 0)).toBeCloseTo(masses.mc, 5)
    expect(-effectiveMassRatio((k) => kaneEnergiesAt(params, k)[1], 0)).toBeCloseTo(masses.mlh, 5)
    expect(-effectiveMassRatio((k) => kaneEnergiesAt(params, k)[0], 0)).toBeCloseTo(masses.mso, 5)
    expect(-effectiveMassRatio((k) => kaneEnergiesAt(params, k)[2], 0)).toBeCloseTo(masses.mhh, 5)

    const cmp = kaneConductionFreeParabola(params.eg, path)
    expect(cmp.energies[0][mid]).toBeCloseTo(params.eg, 12)
    expect(cmp.energies[0][0]).toBeCloseTo(params.eg + HBAR2_OVER_2M0 * 0.12 * 0.12, 12)
  })

  it('spin–orbita: +½λħ² (J=3/2, 4 stati), −λħ² (J=1/2, 2 stati), Δ=(3/2)λħ², baricentro fisso', () => {
    const so = spinOrbitGammaLevels(1.43, 0.29) // Ge: Δ = 0,29 eV (E3 dispensa)
    expect(so.lambdaHbar2).toBeCloseTo((2 * 0.29) / 3, 12)
    expect(so.j32Shift).toBeCloseTo(0.5 * so.lambdaHbar2, 12)
    expect(so.j12Shift).toBeCloseTo(-so.lambdaHbar2, 12)
    expect(so.j32Shift - so.j12Shift).toBeCloseTo(0.29, 12)
    expect(so.barycenterCheck).toBeCloseTo(0, 12)

    const statesJ32 = so.withSo.filter((l) => l.jLabel === 'J = 3/2').reduce((s, l) => s + l.states, 0)
    const statesJ12 = so.withSo.filter((l) => l.jLabel === 'J = 1/2').reduce((s, l) => s + l.states, 0)
    expect(statesJ32).toBe(4)
    expect(statesJ12).toBe(2)

    // Con Δ = 0 la separazione si chiude esattamente
    const closed = spinOrbitGammaLevels(1.43, 0)
    expect(closed.j32Shift).toBe(0)
    expect(closed.j12Shift).toBe(0)
  })
})

describe('metodo k·p — modello esatto a due bande e verifica sui quasi liberi', () => {
  it('due bande esatto: in k = 0 autovalori E_g e 0, curvatura dà m₀/m* = 1 ± E_P/E_g, P·k ≪ E_g coincide con parabola', () => {
    const params = { eg: 1.43, ep: 20 }
    const s0 = twoBandStateAt(params, 0)
    expect(s0.energies[0]).toBeCloseTo(0, 12)
    expect(s0.energies[1]).toBeCloseTo(0, 12)
    expect(s0.energies[2]).toBeCloseTo(params.eg, 12)
    expect(s0.withinValidity).toBe(true)

    const invMcExact = 1 / effectiveMassRatio((k) => twoBandStateAt(params, k).energies[2], 0)
    const invMlhExact = 1 / effectiveMassRatio((k) => twoBandStateAt(params, k).energies[0], 0)
    expect(invMcExact).toBeCloseTo(1 + params.ep / params.eg, 4)
    expect(invMlhExact).toBeCloseTo(1 - params.ep / params.eg, 4)

    // Per Pk ≪ E_g la curva esatta coincide con la parabola
    const tinyK = 0.004
    const sTiny = twoBandStateAt(params, tinyK)
    expect(Math.abs(sTiny.energies[2] - sTiny.parabolic.c)).toBeLessThan(1e-6)
    expect(Math.abs(sTiny.energies[0] - sTiny.parabolic.lh)).toBeLessThan(1e-6)

    // Soglia P·k = E_g/2 e scomposizione locale in funzione di k
    const kLim = twoBandValidityLimitK(params.eg, params.ep)
    expect(twoBandStateAt(params, 0.99 * kLim).withinValidity).toBe(true)
    expect(twoBandStateAt(params, 1.01 * kLim).withinValidity).toBe(false)

    const kNonPar = 0.08
    const brC = twoBandMassBreakdown(params, 'c', kNonPar)
    const invNumC = 1 / effectiveMassRatio((k) => twoBandStateAt(params, k).energies[2], kNonPar)
    expect(brC.totalInvMass).toBeCloseTo(invNumC, 4)

    const path = kDotPPath1D(0.12, 81)
    expect(twoBandExactBands(params, path).energies).toHaveLength(3)
    expect(twoBandParabolicBands(params, path).energies).toHaveLength(3)
  })

  it('verifica sui quasi liberi (a = 3 Å, V_G = −0,5 eV, bordo di zona): somma m₀/m*₊ = 17,731 = curvatura numerica e 1 + 4E₀/E_g', () => {
    const potential = { a: 3.0, fourier: [-0.5] }
    const kb = zoneEdge1D(potential.a)
    const summary = nearlyFreeKpVerification(potential, kb, 1, 41)
    expect(summary.invMassSum).toBeCloseTo(17.731, 3)
    expect(summary.invMassSum).toBeCloseTo(summary.invMassExact, 4)
    expect(summary.invMassTwoBand).toBeCloseTo(1 + (4 * summary.e0) / summary.gapAtZoneEdge, 12)
    expect(summary.invMassTwoBand).toBeGreaterThan(17.7)
    expect(summary.p01Abs).toBeCloseTo(Math.PI / 3.0, 2)

    // Verifica diretta anche su band 0 (con il segno meno) e planeWaveMomentumElementSq
    const summaryMinus = nearlyFreeKpVerification(potential, kb, 0, 41)
    expect(summaryMinus.invMassSum).toBeCloseTo(summaryMinus.invMassExact, 4)
    expect(summaryMinus.invMassTwoBand).toBeCloseTo(1 - (4 * summaryMinus.e0) / summaryMinus.gapAtZoneEdge, 12)

    const sol = solveCentralEquation1D(potential, kb, { planeWaves: 41, coefficients: true })
    expect(planeWaveMomentumElementSq(sol, 0, 1)).toBeCloseTo(summary.p01Abs * summary.p01Abs, 10)
  })
})
