import { describe, expect, it } from 'vitest'
import {
  centralEquationBand,
  twoWaveEdgeMassRatio,
  twoWaveGap,
  weakPotentialRatio
} from './centralEquation1d'
import { rydbergToEv, RYDBERG_EV } from './constants'
import { freeElectronEnergy, zoneBoundaryEnergy } from './freeElectron'
import {
  intrinsicFermiLevel,
  kanePFromEp,
  twoBandMassBreakdown,
  twoBandStateAt
} from './kDotP'
import { kronigPenneyBandFunction } from './kronigPenney'
import {
  epmBrillouinPath,
  epmDirectionalKinematics
} from './pseudopotential'
import {
  bandCurvature,
  bandSlope,
  EFFECTIVE_MASS_DIVERGENCE_THRESHOLD,
  effectiveMassRatio,
  groupVelocity,
  inverseEffectiveMassRatio,
  isEffectiveMassDivergent
} from './semiclassical'
import { diatomicStateAt, monoatomicEnergiesAt } from './tightBinding'

const a = 3
const edge = Math.PI / a

describe('velocità di gruppo v = (1/ħ)·dE/dk', () => {
  it('elettrone libero: v = ħk/m₀, k = 1 Å⁻¹ → 1,158·10⁶ m/s', () => {
    expect(groupVelocity(freeElectronEnergy, 1) / 1e6).toBeCloseTo(1.158, 3)
    expect(bandSlope(freeElectronEnergy, 1)).toBeCloseTo(7.61996, 8)
  })

  it('nulla al bordo di zona e in k = 0 (quasi liberi, 21 onde piane)', () => {
    const pot = { a, fourier: [-0.5, 0.15] }
    for (const band of [0, 1, 2]) {
      const atEdge = centralEquationBand(pot, band, { planeWaves: 21, basisK: edge })
      expect(Math.abs(groupVelocity(atEdge, edge))).toBeLessThan(1) // m/s, contro ~10⁶ m/s dentro la zona
      const atCenter = centralEquationBand(pot, band, { planeWaves: 21, basisK: 0 })
      expect(Math.abs(groupVelocity(atCenter, 0))).toBeLessThan(1)
    }
    const inside = centralEquationBand(pot, 0, { planeWaves: 21, basisK: 0.5 * edge })
    expect(groupVelocity(inside, 0.5 * edge)).toBeGreaterThan(1e5)
  })
})

describe('massa efficace m* = ħ²/(d²E/dk²)', () => {
  it('elettrone libero: m* = m₀', () => {
    expect(effectiveMassRatio(freeElectronEnergy, 0.7)).toBeCloseTo(1, 6)
    expect(inverseEffectiveMassRatio(freeElectronEnergy, -1.3)).toBeCloseTo(1, 6)
    expect(bandCurvature(freeElectronEnergy, 0)).toBeCloseTo(7.61996, 6)
  })

  it('cima della banda inferiore: massa negativa, m₀/m*₋ = 1 − 2E₀/|V_G| e |m*| ≃ m₀|V_G|/2E₀ (formulario)', () => {
    const E0 = zoneBoundaryEnergy(a)
    const lower = centralEquationBand({ a, fourier: [-0.05] }, 0, { planeWaves: 21, basisK: edge })
    const ratio = effectiveMassRatio(lower, edge)
    expect(ratio).toBeLessThan(0)
    // formula a due onde (esatta per V_G piccolo, qui 21 onde piane)
    expect(ratio * (1 - (2 * E0) / 0.05)).toBeCloseTo(1, 3)
    // approssimazione |m*| ≃ m₀|V_G|/2E₀: vale a meno di |V_G|/2E₀ ≈ 0,6 %
    expect(Math.abs(Math.abs(ratio) / (0.05 / (2 * E0)) - 1)).toBeLessThan(0.01)
  })

  it('banda a coseno E = −2t·cos ka: m* = ħ²/(2ta²) in fondo banda (formulario legami forti)', () => {
    const t = 0.8
    const band = (k: number): number => -2 * t * Math.cos(k * a)
    expect(effectiveMassRatio(band, 0)).toBeCloseTo(7.61996 / (2 * t * a * a), 6)
    expect(groupVelocity(band, Math.PI / (2 * a)) / 1e6).toBeCloseTo((2 * t * a) / 6.582119569e-16 / 1e16, 6)
  })

  it('rifiuta passi non validi', () => {
    expect(() => bandSlope(freeElectronEnergy, 0, 0)).toThrow()
  })
})

function bisectZeroCurvature(evalCurv: (k: number) => number, kLo: number, kHi: number): number {
  let lo = kLo
  let hi = kHi
  const cLo = evalCurv(lo)
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi)
    const cMid = evalCurv(mid)
    if (cMid === 0) return mid
    if ((cMid > 0) === (cLo > 0)) lo = mid
    else hi = mid
  }
  return 0.5 * (lo + hi)
}

describe('soglia unica massa divergente ai flessi (incarico 09 punto 3)', () => {
  it('classifica correttamente valori finiti grandi, ±Infinity e NaN', () => {
    expect(EFFECTIVE_MASS_DIVERGENCE_THRESHOLD).toBe(1e4)
    expect(isEffectiveMassDivergent(Infinity)).toBe(true)
    expect(isEffectiveMassDivergent(-Infinity)).toBe(true)
    expect(isEffectiveMassDivergent(NaN)).toBe(true)
    expect(isEffectiveMassDivergent(1e4)).toBe(true)
    expect(isEffectiveMassDivergent(-2.5e4)).toBe(true)
    expect(isEffectiveMassDivergent(9999)).toBe(false)
    expect(isEffectiveMassDivergent(-0.082)).toBe(false)
  })

  it('elettrone libero: parabola pura senza flessi (m*/m₀ = 1 ovunque)', () => {
    expect(isEffectiveMassDivergent(effectiveMassRatio(freeElectronEnergy, 0.5))).toBe(false)
    expect(effectiveMassRatio(freeElectronEnergy, 0.5)).toBeCloseTo(1, 5)
  })

  it('quasi liberi 1D: la banda 0 ha un flesso tra 0 e π/a dove scatta la soglia', () => {
    const pot = { a: 3, fourier: [-0.8] }
    const fn = centralEquationBand(pot, 0, { planeWaves: 11, basisK: 0.5 })
    const kFlex = bisectZeroCurvature((k) => bandCurvature(fn, k), 0.05, Math.PI / 3 - 0.05)
    expect(isEffectiveMassDivergent(effectiveMassRatio(fn, kFlex))).toBe(true)
  })

  it('Kronig–Penney: la prima banda ha un flesso tra 0 e π/a dove scatta la soglia', () => {
    const spec = { variant: 'delta' as const, a: 3, P: 3 }
    const fn = kronigPenneyBandFunction(spec, 0)
    const kFlex = bisectZeroCurvature((k) => bandCurvature(fn, k), 0.05, Math.PI / 3 - 0.05)
    expect(isEffectiveMassDivergent(effectiveMassRatio(fn, kFlex))).toBe(true)
  })

  it('legami forti monoatomica (k = π/2a) e biatomica (flesso su E_-): scatta la soglia', () => {
    const mono = { a: 3.0, centerS: -8.0, centerP: -2.0, tS: 1.0, absTP: 1.2 }
    const mMono = effectiveMassRatio((k) => monoatomicEnergiesAt(mono, k)[0], Math.PI / (2 * mono.a))
    expect(isEffectiveMassDivergent(mMono)).toBe(true)

    const diat = { a: 3.0, eA: -1.0, eB: 1.0, t: 1.0 }
    const fnDiat = (k: number) => diatomicStateAt(diat, k).energies[0]
    const kFlexDiat = bisectZeroCurvature((k) => bandCurvature(fnDiat, k), 0.05, Math.PI / 3 - 0.05)
    expect(isEffectiveMassDivergent(effectiveMassRatio(fnDiat, kFlexDiat))).toBe(true)
  })

  it('k·p a due bande: al flesso analitico della banda lh la massa analitica è divergente (nessuna inversione spuria di segno)', () => {
    const params = { eg: 1.52, ep: 20.0 }
    const P = kanePFromEp(params.ep)
    const kFlex = ((0.5 * params.eg) / P) * Math.sqrt(Math.pow(params.ep / params.eg, 2 / 3) - 1)
    const bdAtFlex = twoBandMassBreakdown(params, 'lh', kFlex)
    expect(isEffectiveMassDivergent(bdAtFlex.effectiveMassRatio)).toBe(true)
    // Sotto il flesso m* < 0, oltre il flesso m* > 0
    expect(twoBandMassBreakdown(params, 'lh', kFlex - 0.02).effectiveMassRatio).toBeLessThan(0)
    expect(twoBandMassBreakdown(params, 'lh', kFlex + 0.02).effectiveMassRatio).toBeGreaterThan(0)
    // Coerenza con la banda esatta lontano dal flesso
    expect(effectiveMassRatio((k) => twoBandStateAt(params, k).energies[0], kFlex + 0.02)).toBeCloseTo(
      twoBandMassBreakdown(params, 'lh', kFlex + 0.02).effectiveMassRatio,
      2
    )
  })

  it('pseudopotenziale (Si lungo Γ–X): il flesso di banda supera la soglia', () => {
    const si = {
      a: 5.43,
      formFactors: { v3s: -0.21, v8s: 0.04, v11s: 0.08, v3a: 0, v4a: 0, v11a: 0 }
    }
    const path = epmBrillouinPath(si.a, 40)
    const gxStart = path.points[40] // Γ
    const gxEnd = path.points[80] // X
    const frac = bisectZeroCurvature(
      (s) => {
        const k: readonly [number, number, number] = [
          gxStart[0] + s * (gxEnd[0] - gxStart[0]),
          gxStart[1] + s * (gxEnd[1] - gxStart[1]),
          gxStart[2] + s * (gxEnd[2] - gxStart[2])
        ]
        return -epmDirectionalKinematics(si, k, [1, 0, 0], 4, 11).curvature
      },
      0.05,
      0.95
    )
    const kFlex: readonly [number, number, number] = [frac * gxEnd[0], 0, 0]
    const kin = epmDirectionalKinematics(si, kFlex, [1, 0, 0], 4, 11)
    expect(isEffectiveMassDivergent(kin.effectiveMassRatio)).toBe(true)
  })

  it('helper di fisica estratti dai componenti (incarico 09 punto 4)', () => {
    expect(rydbergToEv(-0.211)).toBeCloseTo(-0.211 * RYDBERG_EV, 12)
    expect(intrinsicFermiLevel(1.52)).toBeCloseTo(0.76, 12)
    expect(twoWaveGap(-0.75)).toBeCloseTo(1.5, 12)
    const e0 = zoneBoundaryEnergy(3)
    expect(weakPotentialRatio(-0.5, e0)).toBeCloseTo(0.5 / e0, 12)
    expect(1 / twoWaveEdgeMassRatio(-0.5, e0, 1)).toBeCloseTo(1 + (2 * e0) / 0.5, 12)
    expect(1 / twoWaveEdgeMassRatio(-0.5, e0, -1)).toBeCloseTo(1 - (2 * e0) / 0.5, 12)
  })
})
