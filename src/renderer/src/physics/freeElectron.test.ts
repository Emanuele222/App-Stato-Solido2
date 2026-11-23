import { describe, expect, it } from 'vitest'
import { HBAR2_OVER_2M0, HBAR2_OVER_M0, HBAR_EV_S, RYDBERG_EV } from './constants'
import { zonePath1D } from './bandStructure'
import { nearlyFreeBands } from './centralEquation1d'
import {
  emptyLatticeBands,
  emptyLatticeEnergies,
  fccFreeElectronFermiSphere,
  freeElectronEnergy,
  reciprocalVector1D,
  twoWaveEnergies,
  zoneBoundaryEnergy
} from './freeElectron'

describe('costanti', () => {
  it('valori di progetto.md e coerenza di ħ con ħ²/2m₀', () => {
    expect(HBAR2_OVER_2M0).toBe(3.80998)
    expect(HBAR2_OVER_M0).toBe(7.61996)
    expect(RYDBERG_EV).toBe(13.6057)
    // ħ²/2m₀ da ħ (eV·s) e m₀c² = 510998,95 eV: (ħc)²/(2 m₀c²) in eV·Å²
    const hbarC = HBAR_EV_S * 2.99792458e18 // eV·Å
    expect((hbarC * hbarC) / (2 * 510998.95)).toBeCloseTo(HBAR2_OVER_2M0, 4)
  })
})

describe('elettrone libero', () => {
  it('E_k = ħ²k²/2m₀', () => {
    expect(freeElectronEnergy(1)).toBe(3.80998)
    expect(freeElectronEnergy(-2)).toBeCloseTo(4 * 3.80998, 12)
  })

  it('E₀ per a = 3 Å vale 4,18 eV (P3 §11.6: E₁ = 4,2 eV per L = 3 Å; E_F = 4,2 eV del metallo bivalente)', () => {
    expect(zoneBoundaryEnergy(3)).toBeCloseTo(4.17811, 5)
    expect(reciprocalVector1D(3)).toBeCloseTo((2 * Math.PI) / 3, 14)
  })

  it('reticolo vuoto: ħ²(k+G)²/2m₀ ordinate, degenerazione al bordo e in k = 0', () => {
    const a = 3
    const E0 = zoneBoundaryEnergy(a)
    const edge = emptyLatticeEnergies(Math.PI / a, a, 4)
    expect(edge[0]).toBeCloseTo(E0, 12)
    expect(edge[1]).toBeCloseTo(E0, 12)
    expect(edge[2]).toBeCloseTo(9 * E0, 10)
    expect(edge[3]).toBeCloseTo(9 * E0, 10)
    const center = emptyLatticeEnergies(0, a, 3)
    expect(center[0]).toBe(0)
    expect(center[1]).toBeCloseTo(4 * E0, 10)
    expect(center[2]).toBeCloseTo(4 * E0, 10)
    // periodicità in k: E(k + G) = E(k)
    const k = 0.37
    const shifted = emptyLatticeEnergies(k + reciprocalVector1D(a), a, 5)
    emptyLatticeEnergies(k, a, 5).forEach((e, n) => expect(shifted[n]).toBeCloseTo(e, 10))
  })
})

describe('modello a due onde (formulario «Due onde, k′ = k − G»)', () => {
  const a = 3
  const G = (2 * Math.PI) / a
  const E0 = zoneBoundaryEnergy(a)

  it('al bordo E± = E₀ ± |V_G|, per entrambi i segni di V_G', () => {
    for (const vG of [-0.5, 0.5]) {
      const { lower, upper } = twoWaveEnergies(Math.PI / a, Math.PI / a - G, vG)
      expect(lower).toBeCloseTo(E0 - 0.5, 13)
      expect(upper).toBeCloseTo(E0 + 0.5, 13)
    }
  })

  it('lontano dal bordo E ≃ E_k + V_G²/(E_k − E_k′) (P3 §11.5: |V_G| = 0,1E₀, k = π/2a → −0,005E₀)', () => {
    const vG = -0.1 * E0
    const k = Math.PI / (2 * a)
    const { lower } = twoWaveEnergies(k, k - G, vG)
    const shift = (lower - freeElectronEnergy(k)) / E0
    expect(shift).toBeCloseTo(-0.005, 4)
  })

  it('con V_G = 0 restano le parabole libere', () => {
    const k = 0.8
    const { lower, upper } = twoWaveEnergies(k, k - G, 0)
    expect(lower).toBeCloseTo(Math.min(freeElectronEnergy(k), freeElectronEnergy(k - G)), 13)
    expect(upper).toBeCloseTo(Math.max(freeElectronEnergy(k), freeElectronEnergy(k - G)), 13)
  })
})

describe('emptyLatticeBands', () => {
  it('coincide con l’equazione centrale a potenziale nullo', () => {
    const a = 4
    const path = zonePath1D(a, 41)
    const closed = emptyLatticeBands(a, path, 5)
    const solved = nearlyFreeBands({ a, fourier: [] }, path, { planeWaves: 11, bands: 5 })
    expect(closed.method).toBe('empty-lattice')
    for (let n = 0; n < 5; n++) {
      for (let i = 0; i < path.points.length; i++) expect(closed.energies[n][i]).toBeCloseTo(solved.energies[n][i], 9)
    }
    // al bordo le prime due bande sono degeneri in E₀
    expect(closed.energies[0][40]).toBeCloseTo(zoneBoundaryEnergy(a), 12)
    expect(closed.energies[1][40]).toBeCloseTo(zoneBoundaryEnergy(a), 12)
  })
})

describe('fccFreeElectronFermiSphere (alluminio, P4 §5.2 r. 1384–1396)', () => {
  const aAl = 4.05

  it('N = 3 elettroni per cella: k_F = 1,75 Å⁻¹ = 1,127·(2π/a), E_F = 11,65 eV', () => {
    const al3 = fccFreeElectronFermiSphere(aAl, 3)
    expect(al3.kFAngInv).toBeCloseTo(1.75, 2)
    expect(al3.kFDimless).toBeCloseTo(1.127, 3)
    expect(al3.eFEv).toBeCloseTo(11.65, 2)
  })

  it('N = 1 elettrone per cella: k_F′ = 0,78·(2π/a), E_F′ = 5,60 eV', () => {
    const al1 = fccFreeElectronFermiSphere(aAl, 1)
    expect(al1.kFDimless).toBeCloseTo(0.78, 2)
    expect(al1.eFEv).toBeCloseTo(5.6, 1)
  })
})
