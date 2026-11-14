import { describe, expect, it } from 'vitest'
import { kPathFromVertices, zonePath1D } from './bandStructure'

describe('zonePath1D', () => {
  it('copre −π/a…π/a, contiene k = 0, pesi a somma 1', () => {
    const a = 3
    const path = zonePath1D(a, 101)
    expect(path.dimension).toBe(1)
    expect(path.points.length).toBe(101)
    expect(path.points[0][0]).toBe(-Math.PI / a)
    expect(path.points[100][0]).toBe(Math.PI / a)
    expect(path.points[50][0]).toBe(0)
    expect(path.distance[100]).toBeCloseTo((2 * Math.PI) / a, 12)
    const w = path.weights
    expect(w).toBeDefined()
    expect(w!.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 14)
    expect(path.labels.map((l) => l.label)).toEqual(['−π/a', '0', 'π/a'])
  })

  it('rifiuta un numero pari di punti', () => {
    expect(() => zonePath1D(3, 100)).toThrow()
  })
})

describe('kPathFromVertices', () => {
  it('cammino 3D a tratti: etichette nei vertici, distanza cumulata', () => {
    // L–Γ–X di un fcc con a = 1 (unità 2π/a): |ΓL| = π√3, |ΓX| = 2π
    const s = 2 * Math.PI
    const path = kPathFromVertices(
      [
        { label: 'L', k: [0.5 * s, 0.5 * s, 0.5 * s] },
        { label: 'Γ', k: [0, 0, 0] },
        { label: 'X', k: [s, 0, 0] }
      ],
      10,
      3
    )
    expect(path.points.length).toBe(21)
    expect(path.labels).toEqual([
      { index: 0, label: 'L' },
      { index: 10, label: 'Γ' },
      { index: 20, label: 'X' }
    ])
    expect(path.distance[10]).toBeCloseTo(Math.PI * Math.sqrt(3), 12)
    expect(path.distance[20]).toBeCloseTo(Math.PI * Math.sqrt(3) + 2 * Math.PI, 12)
    expect(path.weights).toBeUndefined()
  })
})
