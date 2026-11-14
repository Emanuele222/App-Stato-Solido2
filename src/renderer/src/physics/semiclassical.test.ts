import { describe, expect, it } from 'vitest'
import { centralEquationBand } from './centralEquation1d'
import { freeElectronEnergy, zoneBoundaryEnergy } from './freeElectron'
import {
  bandCurvature,
  bandSlope,
  effectiveMassRatio,
  groupVelocity,
  inverseEffectiveMassRatio
} from './semiclassical'

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
