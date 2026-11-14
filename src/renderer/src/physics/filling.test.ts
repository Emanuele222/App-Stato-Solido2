import { describe, expect, it } from 'vitest'
import { kPathFromVertices, zonePath1D } from './bandStructure'
import { nearlyFreeBands } from './centralEquation1d'
import { fillBands } from './filling'
import { zoneBoundaryEnergy } from './freeElectron'

const a = 3
const path = zonePath1D(a, 401)
const bands = (vG: number) => nearlyFreeBands({ a, fourier: [vG] }, path, { planeWaves: 21, bands: 4 })

describe('riempimento in 1D: 2 elettroni per banda per cella (P4 §5.6)', () => {
  it('V_G ≠ 0, N = 1 → metallo, banda 1 piena a metà', () => {
    const f = fillBands(bands(-0.5), 1)
    expect(f.kind).toBe('metal')
    expect(f.gap).toBeNull()
    expect(f.occupations[0]).toBeCloseTo(0.5, 12)
    expect(f.occupations[1]).toBe(0)
  })

  it('V_G ≠ 0, N = 2 → isolante con E_g ≃ 2|V_G|, E_F a metà del gap', () => {
    const f = fillBands(bands(-0.5), 2)
    expect(f.kind).toBe('insulator')
    expect(f.gap).toBeCloseTo(1, 3)
    expect(f.fermiLevel).toBeCloseTo(0.5 * (f.highestOccupied + f.lowestUnoccupied), 12)
    expect(Array.from(f.occupations)).toEqual([1, 0, 0, 0])
  })

  it('V_G = 0, N = 2 → nessun gap (metallo), E_F = E₀ = 4,18 eV (P3 §11.6: k_F = π/a, E_F = 4,2 eV)', () => {
    const f = fillBands(bands(0), 2)
    expect(f.kind).toBe('metal')
    expect(f.gap).toBeNull()
    expect(f.fermiLevel).toBeCloseTo(zoneBoundaryEnergy(a), 9)
  })

  it('V_G = 0, N = 1 → k_F = π/2a, E_F = E₀/4 (entro la risoluzione del campionamento)', () => {
    const f = fillBands(bands(0), 1)
    expect(f.kind).toBe('metal')
    expect(Math.abs(f.fermiLevel / (zoneBoundaryEnergy(a) / 4) - 1)).toBeLessThan(0.01)
  })

  it('N = 3 → metallo: banda 1 piena, banda 2 a metà', () => {
    const f = fillBands(bands(-0.5), 3)
    expect(f.kind).toBe('metal')
    expect(f.occupations[0]).toBeCloseTo(1, 12)
    expect(f.occupations[1]).toBeCloseTo(0.5, 12)
  })

  it('errori: cammino senza pesi, troppe poche bande, N non intero', () => {
    const open = kPathFromVertices(
      [
        { label: '0', k: [0, 0, 0] },
        { label: 'π/a', k: [Math.PI / a, 0, 0] }
      ],
      10,
      1
    )
    const bsOpen = nearlyFreeBands({ a, fourier: [-0.5] }, open, { planeWaves: 5, bands: 2 })
    expect(() => fillBands(bsOpen, 1)).toThrow(/pesi/)
    expect(() => fillBands(bands(-0.5), 8)).toThrow()
    expect(() => fillBands(bands(-0.5), 1.5)).toThrow()
  })
})
