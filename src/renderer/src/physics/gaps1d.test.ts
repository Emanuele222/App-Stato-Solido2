import { describe, expect, it } from 'vitest'
import { HBAR2_OVER_2M0 } from './constants'
import { zoneBoundaryEnergy } from './freeElectron'
import { directGap1D } from './gaps1d'

describe('gap diretti (P3 §11.4)', () => {
  it('«quanto è buono il troncamento»: ħ²/m₀ = 1, a = 1, V_G = −0,3 → bordi 4,6325 e 5,2325, gap 0,59997 (15 onde)', () => {
    // ħ²/2m₀ = 1/2 in unità ridotte: si riscala a in Å perché E₀ = π²/2 eV.
    const a = Math.sqrt(2 * HBAR2_OVER_2M0)
    expect(zoneBoundaryEnergy(a)).toBeCloseTo((Math.PI * Math.PI) / 2, 12)
    const gap = directGap1D({ a, fourier: [-0.3] }, Math.PI / a, 0, { planeWaves: 15 })
    expect(gap.lower).toBeCloseTo(4.6325, 4)
    expect(gap.upper).toBeCloseTo(5.2325, 4)
    expect(gap.width).toBeCloseTo(0.59997, 5)
    // il modello a due onde dà 4,6348 e 5,2348
    const two = directGap1D({ a, fourier: [-0.3] }, Math.PI / a, 0, { planeWaves: 2 })
    expect(two.lower).toBeCloseTo(4.6348, 4)
    expect(two.width).toBeCloseTo(0.6, 12)
  })

  it('solo V_2G: gap 2|V_2G| in k = 0 e nessun gap in π/a (periodo a/2)', () => {
    const a = 3
    const pot = { a, fourier: [0, 0.3] }
    const center = directGap1D(pot, 0, 1, { planeWaves: 21 })
    expect(center.width).toBeCloseTo(0.6, 4)
    const edge = directGap1D(pot, Math.PI / a, 0, { planeWaves: 21 })
    expect(Math.abs(edge.width)).toBeLessThan(1e-9)
  })

  it('V_G → −V_G equivale a traslare il potenziale di a/2: stessi gap, in +π/a e in −π/a', () => {
    const a = 4
    const plus = directGap1D({ a, fourier: [0.4, -0.1] }, Math.PI / a, 0, { planeWaves: 15 })
    const minus = directGap1D({ a, fourier: [-0.4, -0.1] }, -Math.PI / a, 0, { planeWaves: 15 })
    expect(plus.lower).toBeCloseTo(minus.lower, 10)
    expect(plus.width).toBeCloseTo(minus.width, 10)
    expect(Math.abs(plus.width - 0.8)).toBeLessThan(0.05)
  })

  it('rifiuta indici di banda fuori dalla base', () => {
    expect(() => directGap1D({ a: 3, fourier: [-0.5] }, 0, 4, { planeWaves: 5 })).toThrow()
    expect(() => directGap1D({ a: 3, fourier: [-0.5] }, 0, -1, { planeWaves: 5 })).toThrow()
  })
})
