import { describe, expect, it } from 'vitest'
import { zonePath1D } from './bandStructure'
import {
  blochCoefficients,
  centralEquationBand,
  dominantPlaneWaves1D,
  nearlyFreeBands,
  planeWaveBasis1D,
  potentialAt,
  solveCentralEquation1D
} from './centralEquation1d'
import { HBAR2_OVER_2M0 } from './constants'
import { emptyLatticeEnergies, twoWaveEnergies, zoneBoundaryEnergy } from './freeElectron'
import { inverseEffectiveMassRatio } from './semiclassical'

const a = 3 // Å
const G = (2 * Math.PI) / a
const edge = Math.PI / a

describe('potenziale V(x) = V̄ + 2V_G cos(2πx/a) + 2V_2G cos(4πx/a)', () => {
  it('con V_G < 0 i minimi stanno sugli ioni (x = n·a)', () => {
    const pot = { a, fourier: [-0.5] }
    expect(potentialAt(pot, 0)).toBeCloseTo(-1, 14)
    expect(potentialAt(pot, a)).toBeCloseTo(-1, 14)
    expect(potentialAt(pot, a / 2)).toBeCloseTo(1, 14)
    expect(potentialAt({ a, fourier: [-0.5, 0.2], mean: 0.1 }, 0)).toBeCloseTo(0.1 - 1 + 0.4, 14)
  })
})

describe('base di onde piane', () => {
  it('numero dispari: base simmetrica −M…M nella prima zona, anche al bordo', () => {
    expect(Array.from(planeWaveBasis1D(0.3, a, 5))).toEqual([-2, -1, 0, 1, 2])
    expect(Array.from(planeWaveBasis1D(edge, a, 41))).toEqual(Array.from({ length: 41 }, (_, i) => i - 20))
    expect(Array.from(planeWaveBasis1D(-edge, a, 3))).toEqual([-1, 0, 1])
  })

  it('due onde vicino a π/a: e^{ikx} ed e^{i(k−G)x}', () => {
    expect(Array.from(planeWaveBasis1D(0.9 * edge, a, 2))).toEqual([-1, 0])
    expect(Array.from(planeWaveBasis1D(-0.9 * edge, a, 2))).toEqual([0, 1])
  })
})

describe('equazione centrale: limiti analitici', () => {
  it('V = 0 riproduce il reticolo vuoto E = ħ²(k+G)²/2m₀', () => {
    for (const k of [-edge, -0.7, 0, 0.123, 0.5 * edge, edge]) {
      const sol = solveCentralEquation1D({ a, fourier: [] }, k, { planeWaves: 11 })
      const free = emptyLatticeEnergies(k, a, 11)
      sol.energies.forEach((e, n) => expect(e).toBeCloseTo(free[n], 9))
    }
    // anche con coefficienti esplicitamente nulli
    const sol = solveCentralEquation1D({ a, fourier: [0, 0] }, 0.4, { planeWaves: 7 })
    sol.energies.forEach((e, n) => expect(e).toBeCloseTo(emptyLatticeEnergies(0.4, a, 7)[n], 9))
  })

  it('due onde al bordo: E± = E₀ ± |V_G| esatto, per V_G < 0 e V_G > 0', () => {
    const E0 = zoneBoundaryEnergy(a)
    for (const vG of [-0.5, 0.3]) {
      const sol = solveCentralEquation1D({ a, fourier: [vG] }, edge, { planeWaves: 2 })
      expect(sol.energies[0]).toBeCloseTo(E0 - Math.abs(vG), 12)
      expect(sol.energies[1]).toBeCloseTo(E0 + Math.abs(vG), 12)
    }
  })

  it('due onde lontano dal bordo coincide con la formula E±(k), k′ = k − G', () => {
    for (const k of [0.2 * edge, 0.6 * edge, 0.97 * edge]) {
      const sol = solveCentralEquation1D({ a, fourier: [-0.4] }, k, { planeWaves: 2 })
      const ref = twoWaveEnergies(k, k - G, -0.4)
      expect(sol.energies[0]).toBeCloseTo(ref.lower, 12)
      expect(sol.energies[1]).toBeCloseTo(ref.upper, 12)
    }
  })

  it('P3 §11.4 «quanto è buono il troncamento»: ħ²/m₀ = 1, a = 1, V_G = −0,3', () => {
    // ħ²/m₀ = 1 e a = 1 equivalgono, nelle nostre unità, a a = √(ħ²/m₀) Å.
    const aUnit = Math.sqrt(2 * HBAR2_OVER_2M0)
    const k = Math.PI / aUnit
    const two = solveCentralEquation1D({ a: aUnit, fourier: [-0.3] }, k, { planeWaves: 2 })
    expect(two.energies[0]).toBeCloseTo(4.6348, 4)
    expect(two.energies[1]).toBeCloseTo(5.2348, 4)
    const fifteen = solveCentralEquation1D({ a: aUnit, fourier: [-0.3] }, k, { planeWaves: 15 })
    expect(fifteen.energies[0]).toBeCloseTo(4.6325, 4)
    expect(fifteen.energies[1]).toBeCloseTo(5.2325, 4)
    expect(fifteen.energies[1] - fifteen.energies[0]).toBeCloseTo(0.59997, 5)
  })

  it('con molte onde piane il gap in π/a tende a 2|V_G| per V_G piccolo', () => {
    let previous = Number.POSITIVE_INFINITY
    for (const vG of [-0.5, -0.1, -0.02]) {
      const sol = solveCentralEquation1D({ a, fourier: [vG] }, edge, { planeWaves: 21 })
      const relErr = Math.abs((sol.energies[1] - sol.energies[0]) / (2 * Math.abs(vG)) - 1)
      expect(relErr).toBeLessThan(previous)
      previous = relErr
    }
    expect(previous).toBeLessThan(1e-6)
    const sol = solveCentralEquation1D({ a, fourier: [-0.5] }, edge, { planeWaves: 41 })
    expect(sol.energies[1] - sol.energies[0]).toBeCloseTo(1, 3)
  })

  it('con V_2G ≠ 0 il gap in k = 0 tra le bande 2 e 3 vale circa 2|V_2G|', () => {
    const E0 = zoneBoundaryEnergy(a)
    // Solo V_2G: il gap è 2|V_2G| a meno di correzioni di ordine superiore.
    const only = solveCentralEquation1D({ a, fourier: [0, -0.2] }, 0, { planeWaves: 21 })
    expect(only.energies[2] - only.energies[1]).toBeCloseTo(0.4, 5)
    // Con anche V_G la combinazione pari cos(Gx) si accoppia all'onda G = 0 e sale di
    // V_G²/2E₀ (secondo ordine): gap ≈ 2|V_2G| + sgn(V_2G)·V_G²/2E₀.
    for (const v2 of [-0.2, 0.2]) {
      const sol = solveCentralEquation1D({ a, fourier: [-0.3, v2] }, 0, { planeWaves: 21 })
      const gap = sol.energies[2] - sol.energies[1]
      expect(Math.abs(gap - 0.4)).toBeLessThan(0.05 * 0.4)
      expect(gap).toBeCloseTo(0.4 + Math.sign(v2) * (0.09 / (2 * E0)), 3)
    }
  })

  it('V̄ sposta tutte le bande di una costante (P3 §11.6)', () => {
    const base = solveCentralEquation1D({ a, fourier: [-0.5, 0.1] }, 0.3, { planeWaves: 9 })
    const shifted = solveCentralEquation1D({ a, fourier: [-0.5, 0.1], mean: 0.7 }, 0.3, { planeWaves: 9 })
    base.energies.forEach((e, n) => expect(shifted.energies[n]).toBeCloseTo(e + 0.7, 12))
  })
})

describe('massa efficace al bordo (P4 §3.2: a = 3 Å, V_G = −0,5 eV)', () => {
  it('banda superiore: m₀/m*₊ = 17,731 dalla curvatura numerica con molte onde piane', () => {
    // Come materiale/parte4/verifica_kp.py: 41 onde piane, base fissa, passo 1e-4 Å⁻¹.
    const upper = centralEquationBand({ a, fourier: [-0.5] }, 1, { planeWaves: 41, basisK: edge })
    expect(Math.abs(inverseEffectiveMassRatio(upper, edge) - 17.731)).toBeLessThan(0.01)
  })

  it('modello a due onde: m₀/m*± = 1 ± 2E₀/|V_G| (formulario «massa efficace»)', () => {
    const E0 = zoneBoundaryEnergy(a)
    const pot = { a, fourier: [-0.5] }
    const lower = centralEquationBand(pot, 0, { planeWaves: 2, basisK: edge })
    const upper = centralEquationBand(pot, 1, { planeWaves: 2, basisK: edge })
    expect(inverseEffectiveMassRatio(upper, edge)).toBeCloseTo(1 + (2 * E0) / 0.5, 3)
    expect(inverseEffectiveMassRatio(lower, edge)).toBeCloseTo(1 - (2 * E0) / 0.5, 3)
  })
})

describe('autostati e strutture a bande', () => {
  it('coefficienti c_G normalizzati; al bordo con due onde c_{−G}/c₀ = ±1 (formulario «gap»)', () => {
    const sol = solveCentralEquation1D({ a, fourier: [-0.5] }, edge, { planeWaves: 2 })
    expect(Array.from(sol.g)).toEqual([-1, 0])
    for (const band of [0, 1]) {
      const c = blochCoefficients(sol, band)
      expect(c.re[0] ** 2 + c.re[1] ** 2).toBeCloseTo(1, 14)
      expect(Math.abs(c.re[0])).toBeCloseTo(Math.SQRT1_2, 12)
    }
    // V_G < 0: la banda inferiore (E₋) è ψ_c, c_{−G}/c₀ = +1; la superiore ψ_s, −1.
    const lower = blochCoefficients(sol, 0)
    const upper = blochCoefficients(sol, 1)
    expect(lower.re[0] / lower.re[1]).toBeCloseTo(1, 12)
    expect(upper.re[0] / upper.re[1]).toBeCloseTo(-1, 12)
  })

  it('nearlyFreeBands: una riga per banda, stati su richiesta, metodo dichiarato', () => {
    const path = zonePath1D(a, 21)
    const bs = nearlyFreeBands({ a, fourier: [-0.5] }, path, { planeWaves: 9, bands: 3, states: true })
    expect(bs.method).toBe('nearly-free')
    expect(bs.energies.length).toBe(3)
    expect(bs.energies[0].length).toBe(21)
    expect(bs.states?.length).toBe(21)
    // E(−k) = E(k) per un potenziale pari
    for (let n = 0; n < 3; n++) expect(bs.energies[n][0]).toBeCloseTo(bs.energies[n][20], 10)
    const empty = nearlyFreeBands({ a, fourier: [0] }, path, { planeWaves: 9, bands: 2 })
    expect(empty.method).toBe('empty-lattice')
    expect(empty.states).toBeUndefined()
  })

  it('dominantPlaneWaves1D: al bordo ±π/a le prime due onde pesano ~50% ciascuna', () => {
    const sol = solveCentralEquation1D({ a, fourier: [-0.5] }, edge, { planeWaves: 11 })
    const top = dominantPlaneWaves1D(sol, 0, 3)
    expect(top).toHaveLength(3)
    expect(new Set([top[0].gMultiple, top[1].gMultiple])).toEqual(new Set([-1, 0]))
    expect(top[0].weight).toBeCloseTo(0.5, 2)
    expect(top[1].weight).toBeCloseTo(0.5, 2)
    expect(top[2].weight).toBeLessThan(0.01)
  })
})
