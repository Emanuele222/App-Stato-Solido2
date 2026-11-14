import { describe, expect, it } from 'vitest'
import { solveCentralEquation1D } from './centralEquation1d'
import { blochDensity1D, zoneEdgeStandingWave } from './density'

const a = 3
const edge = Math.PI / a
const grid = (n: number): Float64Array => Float64Array.from({ length: n }, (_, i) => (i * a) / n)

function argmax(values: Float64Array): number {
  let best = 0
  values.forEach((v, i) => {
    if (v > values[best]) best = i
  })
  return best
}

describe('onde stazionarie al bordo di zona (P3 §11.5)', () => {
  it('V_G < 0: la banda inferiore è ψ_c (massima sugli ioni, nulla a metà cella), la superiore ψ_s', () => {
    const sol = solveCentralEquation1D({ a, fourier: [-0.5] }, edge, { planeWaves: 21 })
    const xs = grid(200)
    const lower = blochDensity1D(sol, 0, xs)
    const upper = blochDensity1D(sol, 1, xs)
    expect(argmax(lower)).toBe(0) // x = 0, sull'ione
    expect(lower[100]).toBeLessThan(1e-12) // x = a/2
    expect(upper[0]).toBeLessThan(1e-12)
    expect(argmax(upper)).toBe(100)
  })

  it('V_G > 0: le due onde si scambiano', () => {
    const sol = solveCentralEquation1D({ a, fourier: [0.5] }, edge, { planeWaves: 21 })
    const xs = grid(200)
    const lower = blochDensity1D(sol, 0, xs)
    const upper = blochDensity1D(sol, 1, xs)
    expect(lower[0]).toBeLessThan(1e-12)
    expect(argmax(lower)).toBe(100)
    expect(argmax(upper)).toBe(0)
    expect(upper[100]).toBeLessThan(1e-12)
  })

  it('modello a due onde: |ψ_c|² = 1 + cos(2πx/a), |ψ_s|² = 1 − cos(2πx/a)', () => {
    const sol = solveCentralEquation1D({ a, fourier: [-0.5] }, edge, { planeWaves: 2 })
    const xs = grid(37)
    const c = blochDensity1D(sol, 0, xs)
    const s = blochDensity1D(sol, 1, xs)
    xs.forEach((x, i) => {
      expect(c[i]).toBeCloseTo(1 + Math.cos((2 * Math.PI * x) / a), 12)
      expect(s[i]).toBeCloseTo(1 - Math.cos((2 * Math.PI * x) / a), 12)
    })
  })
})

describe('normalizzazione', () => {
  it('|ψ|² ha media 1 sulla cella (stati generici)', () => {
    const pot = { a, fourier: [-0.5, 0.2, -0.05] }
    const xs = grid(256) // campionamento esatto per polinomi trigonometrici di grado < 128
    for (const k of [0, 0.3, edge]) {
      const sol = solveCentralEquation1D(pot, k, { planeWaves: 15 })
      for (const band of [0, 1, 4]) {
        const rho = blochDensity1D(sol, band, xs)
        expect(rho.reduce((sum, v) => sum + v, 0) / rho.length).toBeCloseTo(1, 12)
      }
    }
  })

  it('senza potenziale, lontano dalle degenerazioni, densità costante (onda viaggiante)', () => {
    const sol = solveCentralEquation1D({ a, fourier: [] }, 0.4, { planeWaves: 7 })
    blochDensity1D(sol, 0, grid(10)).forEach((v) => expect(v).toBeCloseTo(1, 12))
  })

  it('senza coefficienti calcolati segnala l’errore', () => {
    const sol = solveCentralEquation1D({ a, fourier: [-0.5] }, 0, { planeWaves: 5, coefficients: false })
    expect(() => blochDensity1D(sol, 0, [0])).toThrow()
  })
})

describe('zoneEdgeStandingWave: ψ_c o ψ_s al bordo (P3 §11.5)', () => {
  it('V_G < 0 (ioni attrattivi): in basso ψ_c, in alto ψ_s; in +π/a e in −π/a', () => {
    for (const k of [edge, -edge]) {
      const sol = solveCentralEquation1D({ a, fourier: [-0.5, 0.2] }, k, { planeWaves: 11 })
      expect(zoneEdgeStandingWave(sol, 0)).toBe('c')
      expect(zoneEdgeStandingWave(sol, 1)).toBe('s')
      // coerente con la densità: ψ_c massima sull'ione, ψ_s nulla sull'ione
      const [onIon] = blochDensity1D(sol, 0, [0])
      expect(onIon).toBeGreaterThan(1.5)
      expect(blochDensity1D(sol, 1, [0])[0]).toBeLessThan(1e-12)
    }
  })

  it('V_G > 0: si scambiano (in basso ψ_s)', () => {
    const sol = solveCentralEquation1D({ a, fourier: [0.5] }, edge, { planeWaves: 11 })
    expect(zoneEdgeStandingWave(sol, 0)).toBe('s')
    expect(zoneEdgeStandingWave(sol, 1)).toBe('c')
  })

  it('null fuori dal bordo e per stati degeneri (V_G = 0)', () => {
    const inside = solveCentralEquation1D({ a, fourier: [-0.5] }, 0.9 * edge, { planeWaves: 11 })
    expect(zoneEdgeStandingWave(inside, 0)).toBeNull()
    const free = solveCentralEquation1D({ a, fourier: [0, 0.3] }, edge, { planeWaves: 11 })
    expect(zoneEdgeStandingWave(free, 0)).toBeNull()
    expect(zoneEdgeStandingWave(free, 1)).toBeNull()
  })
})
