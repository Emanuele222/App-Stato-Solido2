import { describe, expect, it } from 'vitest'
import { zonePath1D } from './bandStructure'
import { fillBands } from './filling'
import { emptyLatticeBands, emptyLatticeEnergies, freeElectronEnergy, reciprocalVector1D, zoneBoundaryEnergy } from './freeElectron'
import { effectiveMassRatio, groupVelocity } from './semiclassical'
import {
  branchCoordinates1D,
  emptyLatticeBranchFunction,
  emptyLatticeBranchIndex,
  emptyLatticeBranchState1D,
  emptyLatticeCrossings1D,
  foldToFirstZone1D,
  freeElectronWaveNumber,
  planeWaveIonPhaseAngle,
  planeWaveRealPart1D,
  planeWaveRealPartAtIon,
  zoneEdge1D,
  zoneFoldingSegments1D
} from './emptyLattice'

describe('ripiegamento nella prima zona (P3 §9.3)', () => {
  const a = 3
  const G1 = (2 * Math.PI) / a
  const edge = Math.PI / a

  it('esempio di fig. 9.1b: k = 1,5 π/a finisce in k′ = −0,5 π/a con G = +2π/a (n = +1)', () => {
    const folded = foldToFirstZone1D(1.5 * edge, a)
    expect(folded.kReduced).toBeCloseTo(-0.5 * edge, 14)
    expect(folded.n).toBe(1)
    expect(folded.G).toBeCloseTo(G1, 14)
    expect(folded.kReduced + folded.G).toBeCloseTo(folded.kExtended, 14)
    expect(folded.zone).toBe(2)
    expect(folded.band).toBe(1)
    expect(folded.energy).toBeCloseTo(2.25 * zoneBoundaryEnergy(a), 12)
  })

  it('simmetria a sinistra: k = −1,5 π/a finisce in k′ = +0,5 π/a con n = −1', () => {
    const folded = foldToFirstZone1D(-1.5 * edge, a)
    expect(folded.kReduced).toBeCloseTo(0.5 * edge, 14)
    expect(folded.n).toBe(-1)
    expect(folded.zone).toBe(2)
    expect(folded.band).toBe(1)
  })

  it('estremi della prima zona (−π/a, π/a] e seconda/terza zona', () => {
    expect(foldToFirstZone1D(0, a).kReduced).toBe(0)
    expect(foldToFirstZone1D(edge, a)).toMatchObject({ n: 0, zone: 1, band: 0 })
    expect(foldToFirstZone1D(edge, a).kReduced).toBeCloseTo(edge, 14)
    // −π/a si riporta a +π/a con G = −2π/a
    const leftEdge = foldToFirstZone1D(-edge, a)
    expect(leftEdge.kReduced).toBeCloseTo(edge, 14)
    expect(leftEdge.n).toBe(-1)
    // 2,5 π/a (3ª zona) va in +0,5 π/a con n = +1
    const z3 = foldToFirstZone1D(2.5 * edge, a)
    expect(z3.kReduced).toBeCloseTo(0.5 * edge, 14)
    expect(z3.n).toBe(1)
    expect(z3.zone).toBe(3)
    expect(z3.band).toBe(2)
  })
})

describe('corrispondenza tra rami e bande della zona ridotta', () => {
  const a = 3.5
  const edge = Math.PI / a

  it('emptyLatticeBranchIndex riproduce le energie ordinate di emptyLatticeEnergies per ogni k e banda', () => {
    const ks = [-edge, -0.73 * edge, -0.2 * edge, 0, 0.31 * edge, 0.88 * edge, edge]
    for (const k of ks) {
      const sorted = emptyLatticeEnergies(k, a, 7)
      for (let b = 0; b < 7; b++) {
        const n = emptyLatticeBranchIndex(k, b, a)
        const state = emptyLatticeBranchState1D(k, n, a)
        expect(state.energy).toBeCloseTo(sorted[b], 11)
      }
    }
  })

  it('segmenti di ripiegamento: ogni tratto finisce dentro [−π/a, π/a] e conserva l’energia', () => {
    const segs = zoneFoldingSegments1D(a, 5)
    expect(segs).toHaveLength(10)
    for (const s of segs) {
      expect(s.kRedStart).toBeGreaterThanOrEqual(-edge - 1e-12)
      expect(s.kRedStart).toBeLessThanOrEqual(edge + 1e-12)
      expect(s.kRedEnd).toBeGreaterThanOrEqual(-edge - 1e-12)
      expect(s.kRedEnd).toBeLessThanOrEqual(edge + 1e-12)
      expect(s.kExtStart - s.G).toBeCloseTo(s.kRedStart, 14)
      expect(s.kExtEnd - s.G).toBeCloseTo(s.kRedEnd, 14)
    }
  })
})

describe('incroci dei rami (dispensa P3 §9.3, esempio a = 3 Å)', () => {
  it('riproduce i valori numerici della dispensa per a = 3 Å', () => {
    const crossings = emptyLatticeCrossings1D(3, 4)
    // E₀ = 4,18 eV al bordo, 4E₀ = 16,7 eV in k = 0, 9E₀ = 37,6 eV al bordo, 16E₀ = 66,9 eV in k = 0
    expect(crossings[0]).toMatchObject({ order: 1, lowerBand: 0, location: 'edge' })
    expect(crossings[0].energy).toBeCloseTo(4.18, 2)
    expect(crossings[1]).toMatchObject({ order: 2, lowerBand: 1, location: 'center' })
    expect(crossings[1].energy).toBeCloseTo(16.71, 2)
    expect(crossings[2]).toMatchObject({ order: 3, lowerBand: 2, location: 'edge' })
    expect(crossings[2].energy).toBeCloseTo(37.6, 2)
    expect(crossings[3]).toMatchObject({ order: 4, lowerBand: 3, location: 'center' })
    expect(crossings[3].energy).toBeCloseTo(66.85, 2)
  })
})

describe('spazio reale e strumenti trasversali nel reticolo vuoto', () => {
  const a = 3
  const edge = Math.PI / a

  it('Re ψ(x) sugli ioni x = m·a è invariante rispetto a G (e^{i(k′+G)a} = e^{ik′a})', () => {
    const kReduced = 0.37 * edge
    const ions = Float64Array.from([-2 * a, -a, 0, a, 2 * a, 3 * a])
    const base = planeWaveRealPart1D(kReduced, ions)
    for (const n of [-2, -1, 1, 2]) {
      const st = emptyLatticeBranchState1D(kReduced, n, a)
      const shifted = planeWaveRealPart1D(st.kExtended, ions)
      for (let i = 0; i < ions.length; i++) {
        expect(shifted[i]).toBeCloseTo(base[i], 12)
      }
      expect(Math.cos(planeWaveIonPhaseAngle(kReduced, a))).toBeCloseTo(base[3], 12)
      for (const m of [-2, -1, 0, 1, 2]) {
        expect(planeWaveRealPartAtIon(kReduced, a, m)).toBeCloseTo(planeWaveRealPart1D(st.kExtended, [m * a])[0], 12)
      }
    }
  })

  it('massa efficace m* = m₀ ovunque sul ramo, anche agli incroci', () => {
    for (const n of [-1, 0, 1, 2]) {
      const fn = emptyLatticeBranchFunction(n, a)
      for (const k of [0, 0.4 * edge, edge]) {
        expect(effectiveMassRatio(fn, k)).toBeCloseTo(1, 5)
        const expectedV = ((k + n * ((2 * Math.PI) / a)) * 7.61996 * 1e-10) / 6.582119569e-16
        expect(groupVelocity(fn, k)).toBeCloseTo(expectedV, 0)
      }
    }
  })

  it('riempimento: sempre metallo; per 2 elettroni per cella E_F = E₀ (P3 §11.6)', () => {
    const path = zonePath1D(a, 201)
    const bands = emptyLatticeBands(a, path, 7)
    const E0 = zoneBoundaryEnergy(a)
    for (const ne of [1, 2, 3, 4]) {
      const f = fillBands(bands, ne)
      expect(f.kind).toBe('metal')
    }
    const two = fillBands(bands, 2)
    expect(two.fermiLevel).toBeCloseTo(E0, 12)
    expect(fillBands(bands, 4).fermiLevel).toBeCloseTo(4 * E0, 12)
  })
})

describe('bordo di zona, inversione della parabola e coordinate di ramo', () => {
  it('zoneEdge1D: π/a, e per a = 3 Å la parabola al bordo dà E₀ = 4,18 eV (P3 §9.3)', () => {
    expect(zoneEdge1D(3)).toBeCloseTo(Math.PI / 3, 15)
    expect(zoneEdge1D(2)).toBeCloseTo(0.5 * reciprocalVector1D(2), 15)
    expect(freeElectronEnergy(zoneEdge1D(3))).toBeCloseTo(4.18, 2)
    expect(() => zoneEdge1D(0)).toThrow(RangeError)
  })

  it('freeElectronWaveNumber inverte E = ħ²k²/2m₀; E₀ → π/a, 9E₀ → 3π/a, E ≤ 0 → 0', () => {
    for (const k of [0.1, 0.7, 1.3, 3.2]) {
      expect(freeElectronWaveNumber(freeElectronEnergy(k))).toBeCloseTo(k, 12)
    }
    expect(freeElectronWaveNumber(zoneBoundaryEnergy(3))).toBeCloseTo(Math.PI / 3, 12)
    expect(freeElectronWaveNumber(9 * zoneBoundaryEnergy(3))).toBeCloseTo(Math.PI, 12)
    // ħ²/2m₀ = 3,80998 eV·Å²: E = 3,80998 eV ↔ k = 1 Å⁻¹
    expect(freeElectronWaveNumber(3.80998)).toBeCloseTo(1, 12)
    expect(freeElectronWaveNumber(0)).toBe(0)
    expect(freeElectronWaveNumber(-1)).toBe(0)
  })

  it('branchCoordinates1D: fig. 9.1b (k = 1,5 π/a → k′ = −0,5 π/a, n = +1) e limite sui rami', () => {
    const a = 3
    const edge = Math.PI / a
    const c = branchCoordinates1D(1.5 * edge, a, 3)
    expect(c.kFracReduced).toBeCloseTo(-0.5, 12)
    expect(c.branchN).toBe(1)
    expect(c.kFracExtended).toBeCloseTo(1.5, 12)
    // coerente con foldToFirstZone1D dentro l'intervallo dei rami
    for (const f of [-6.3, -2.4, -0.7, 0, 0.2, 1.1, 3.6, 5.9]) {
      const cc = branchCoordinates1D(f * edge, a, 3)
      const folded = foldToFirstZone1D(f * edge, a)
      expect(cc.branchN).toBe(folded.n)
      expect(cc.kFracReduced * edge).toBeCloseTo(folded.kReduced, 12)
      expect(cc.kFracExtended).toBeCloseTo(f, 12)
    }
    // oltre il ramo n = +3 (k = 8,2 π/a ricadrebbe in n = +4): si ferma al bordo π/a di n = +3
    const far = branchCoordinates1D(8.2 * edge, a, 3)
    expect(far.branchN).toBe(3)
    expect(far.kFracReduced).toBe(1)
    expect(far.kFracExtended).toBeCloseTo(7, 12)
  })
})
