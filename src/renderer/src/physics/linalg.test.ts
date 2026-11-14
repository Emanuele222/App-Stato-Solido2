import { describe, expect, it } from 'vitest'
import { complexHermitianMatrix, eigenvector, eigh, realSymmetricMatrix } from './linalg'

/** Generatore pseudo-casuale riproducibile (mulberry32). */
function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('eigh, caso reale simmetrico', () => {
  it('tridiagonale di Toeplitz: autovalori analitici a + 2b·cos(jπ/(n+1))', () => {
    const n = 12
    const a = 1.5
    const b = -0.7
    const M = realSymmetricMatrix(n)
    for (let i = 0; i < n; i++) {
      M.data[i * n + i] = a
      if (i + 1 < n) {
        M.data[i * n + i + 1] = b
        M.data[(i + 1) * n + i] = b
      }
    }
    const { values } = eigh(M)
    const expected = Array.from({ length: n }, (_, j) => a + 2 * b * Math.cos(((j + 1) * Math.PI) / (n + 1))).sort(
      (x, y) => x - y
    )
    values.forEach((v, j) => expect(v).toBeCloseTo(expected[j], 12))
  })

  it('matrice casuale: A·v = λ·v, autovettori ortonormali, autovalori crescenti', () => {
    const n = 30
    const rand = rng(42)
    const M = realSymmetricMatrix(n)
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        const x = rand() * 2 - 1
        M.data[i * n + j] = x
        M.data[j * n + i] = x
      }
    }
    const { values, vectors } = eigh(M)
    expect(vectors).not.toBeNull()
    if (!vectors) return
    expect(vectors.im).toBeNull()
    for (let j = 1; j < n; j++) expect(values[j]).toBeGreaterThanOrEqual(values[j - 1])
    for (let j = 0; j < n; j++) {
      const v = eigenvector(vectors, j).re
      for (let i = 0; i < n; i++) {
        let Av = 0
        for (let k = 0; k < n; k++) Av += M.data[i * n + k] * v[k]
        expect(Math.abs(Av - values[j] * v[i])).toBeLessThan(1e-12)
      }
      for (let l = 0; l <= j; l++) {
        const w = eigenvector(vectors, l).re
        let dot = 0
        for (let i = 0; i < n; i++) dot += v[i] * w[i]
        expect(dot).toBeCloseTo(l === j ? 1 : 0, 12)
      }
    }
  })

  it('senza autovettori dà gli stessi autovalori', () => {
    const M = realSymmetricMatrix(3)
    M.data.set([2, 1, 0, 1, 3, 1, 0, 1, 4])
    const full = eigh(M)
    const only = eigh(M, { vectors: false })
    expect(only.vectors).toBeNull()
    only.values.forEach((v, j) => expect(v).toBeCloseTo(full.values[j], 14))
    // 2x2 noto: [[2,1],[1,2]] → 1 e 3
    const N = realSymmetricMatrix(2)
    N.data.set([2, 1, 1, 2])
    expect(Array.from(eigh(N).values)).toEqual([expect.closeTo(1, 14), expect.closeTo(3, 14)])
  })

  it('casi degeneri: 1×1, identità, matrice nulla', () => {
    const one = realSymmetricMatrix(1)
    one.data[0] = -2.5
    expect(eigh(one).values[0]).toBe(-2.5)
    const I = realSymmetricMatrix(4)
    for (let i = 0; i < 4; i++) I.data[i * 4 + i] = 1
    const r = eigh(I)
    r.values.forEach((v) => expect(v).toBeCloseTo(1, 14))
    expect(eigh(realSymmetricMatrix(3)).values.every((v) => v === 0)).toBe(true)
    expect(eigh(realSymmetricMatrix(0)).values.length).toBe(0)
  })

  it('rifiuta matrici non simmetriche', () => {
    const M = realSymmetricMatrix(2)
    M.data.set([1, 2, 3, 4])
    expect(() => eigh(M)).toThrow(/simmetrica/)
  })
})

describe('eigh, caso hermitiano complesso', () => {
  it('caso analitico 2×2 e matrice di Pauli σ_y', () => {
    // [[2, 1 − 2i], [1 + 2i, −1]]: traccia 1, deviazione 1.5, raggio √(1.5² + 1² + 2²) = √7.25
    const M = complexHermitianMatrix(2)
    M.re.set([2, 1, 1, -1])
    M.im.set([0, -2, 2, 0])
    const { values, vectors } = eigh(M)
    const r = Math.sqrt(1.5 * 1.5 + 1 + 4)
    expect(values[0]).toBeCloseTo(0.5 - r, 12)
    expect(values[1]).toBeCloseTo(0.5 + r, 12)
    expect(vectors?.im).not.toBeNull()

    // Pauli σ_y: [[0, −i], [i, 0]] → −1, +1 e H v = λ v
    const Sy = complexHermitianMatrix(2)
    Sy.im.set([0, -1, 1, 0])
    const syRes = eigh(Sy)
    expect(syRes.values[0]).toBeCloseTo(-1, 14)
    expect(syRes.values[1]).toBeCloseTo(1, 14)
    if (!syRes.vectors?.im) return
    for (let j = 0; j < 2; j++) {
      const v = eigenvector(syRes.vectors, j)
      const vi = v.im!
      // σ_y [v0, v1] = [-i v1, i v0]
      const res0Re = vi[1] - syRes.values[j] * v.re[0]
      const res0Im = -v.re[1] - syRes.values[j] * vi[0]
      const res1Re = -vi[0] - syRes.values[j] * v.re[1]
      const res1Im = v.re[0] - syRes.values[j] * vi[1]
      expect(Math.hypot(res0Re, res0Im, res1Re, res1Im)).toBeLessThan(1e-13)
    }
  })

  it('matrice hermitiana casuale: residuo ‖Hv − λv‖ < 10⁻¹⁰ e autovettori ortonormali', () => {
    const n = 28
    const rand = rng(1337)
    const M = complexHermitianMatrix(n)
    for (let i = 0; i < n; i++) {
      M.re[i * n + i] = rand() * 4 - 2
      M.im[i * n + i] = 0
      for (let j = i + 1; j < n; j++) {
        const re = rand() * 2 - 1
        const im = rand() * 2 - 1
        M.re[i * n + j] = re
        M.re[j * n + i] = re
        M.im[i * n + j] = im
        M.im[j * n + i] = -im
      }
    }
    const { values, vectors } = eigh(M)
    expect(vectors).not.toBeNull()
    expect(vectors?.im).not.toBeNull()
    if (!vectors || !vectors.im) return

    for (let j = 1; j < n; j++) expect(values[j]).toBeGreaterThanOrEqual(values[j - 1])
    for (let j = 0; j < n; j++) {
      const vj = eigenvector(vectors, j)
      const vji = vj.im!
      let resSq = 0
      for (let r = 0; r < n; r++) {
        let hvRe = 0
        let hvIm = 0
        for (let c = 0; c < n; c++) {
          const ar = M.re[r * n + c]
          const ai = M.im[r * n + c]
          hvRe += ar * vj.re[c] - ai * vji[c]
          hvIm += ar * vji[c] + ai * vj.re[c]
        }
        const dr = hvRe - values[j] * vj.re[r]
        const di = hvIm - values[j] * vji[r]
        resSq += dr * dr + di * di
      }
      expect(Math.sqrt(resSq)).toBeLessThan(1e-10)

      for (let l = 0; l <= j; l++) {
        const wl = eigenvector(vectors, l)
        const wli = wl.im!
        let dotRe = 0
        let dotIm = 0
        for (let i = 0; i < n; i++) {
          dotRe += vj.re[i] * wl.re[i] + vji[i] * wli[i]
          dotIm += vj.re[i] * wli[i] - vji[i] * wl.re[i]
        }
        expect(dotRe).toBeCloseTo(l === j ? 1 : 0, 11)
        expect(dotIm).toBeCloseTo(0, 11)
      }
    }

    const onlyVals = eigh(M, { vectors: false })
    expect(onlyVals.vectors).toBeNull()
    onlyVals.values.forEach((v, j) => expect(v).toBeCloseTo(values[j], 12))
  })

  it('autovalori degeneri: spettro unitariamente ruotato con molteplicità', () => {
    // U diag(-2, -2, 1.5, 1.5, 4, 4) U^H tramite Householder complesso U = I - 2 w w^H
    const n = 6
    const spec = [-2, -2, 1.5, 1.5, 4, 4]
    const wr = [0.3, -0.4, 0.2, 0.5, -0.1, 0.35]
    const wi = [0.1, 0.3, -0.25, 0.2, 0.4, -0.15]
    let norm2 = 0
    for (let k = 0; k < n; k++) norm2 += wr[k] * wr[k] + wi[k] * wi[k]
    const M = complexHermitianMatrix(n)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        let re = 0
        let im = 0
        for (let k = 0; k < n; k++) {
          // U_{ik} = δ_{ik} − 2 w_i w_k^* / norm2
          const uikR = (i === k ? 1 : 0) - (2 * (wr[i] * wr[k] + wi[i] * wi[k])) / norm2
          const uikI = (-2 * (wi[i] * wr[k] - wr[i] * wi[k])) / norm2
          const ujkR = (j === k ? 1 : 0) - (2 * (wr[j] * wr[k] + wi[j] * wi[k])) / norm2
          const ujkI = (-2 * (wi[j] * wr[k] - wr[j] * wi[k])) / norm2
          // U_{ik} spec_k U_{jk}^*
          re += spec[k] * (uikR * ujkR + uikI * ujkI)
          im += spec[k] * (uikI * ujkR - uikR * ujkI)
        }
        M.re[i * n + j] = re
        M.im[i * n + j] = i === j ? 0 : im
      }
    }
    const { values, vectors } = eigh(M)
    values.forEach((v, idx) => expect(v).toBeCloseTo(spec[idx], 11))
    expect(vectors).not.toBeNull()
  })

  it('matrice reale risolta dai due rami dà gli stessi autovalori', () => {
    const n = 10
    const rand = rng(77)
    const R = realSymmetricMatrix(n)
    const C = complexHermitianMatrix(n)
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        const x = rand() * 3 - 1.5
        R.data[i * n + j] = x
        R.data[j * n + i] = x
        C.re[i * n + j] = x
        C.re[j * n + i] = x
      }
    }
    const vr = eigh(R, { vectors: false }).values
    const vc = eigh(C, { vectors: false }).values
    for (let i = 0; i < n; i++) expect(vc[i]).toBeCloseTo(vr[i], 12)
  })

  it('casi degeneri 0×0, 1×1 e rifiuto di matrici non hermitiane', () => {
    expect(eigh(complexHermitianMatrix(0)).values.length).toBe(0)
    const one = complexHermitianMatrix(1)
    one.re[0] = -3.25
    expect(eigh(one).values[0]).toBe(-3.25)

    const badDiag = complexHermitianMatrix(2)
    badDiag.im[0] = 0.1
    expect(() => eigh(badDiag)).toThrow(/diagonale/)

    const badOff = complexHermitianMatrix(2)
    badOff.im[1] = 1
    badOff.im[2] = 1
    expect(() => eigh(badOff)).toThrow(/non hermitiana/)
  })
})
