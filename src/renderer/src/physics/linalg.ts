/**
 * Diagonalizzazione di matrici hermitiane.
 *
 * L'interfaccia pubblica (`eigh`) accetta già sia matrici reali simmetriche sia
 * hermitiane complesse, e restituisce autovettori con parte reale e immaginaria:
 * chi la usa (equazione centrale, densità) lavora sempre con coefficienti
 * complessi, con `im === null` nel caso reale. Oggi è implementato solo il caso
 * reale simmetrico (Householder + QL implicito, come JAMA/EISPACK tred2+tql2);
 * il caso hermitiano complesso (servirà per il GaAs con fattori antisimmetrici)
 * si aggiunge dentro `eigh` senza toccare i chiamanti.
 */

/** Matrice reale simmetrica n×n, memorizzata per righe (data[i·n + j]). */
export interface RealSymmetricMatrix {
  readonly kind: 'real-symmetric'
  readonly n: number
  readonly data: Float64Array
}

/** Matrice hermitiana complessa n×n, parti reale e immaginaria per righe. */
export interface ComplexHermitianMatrix {
  readonly kind: 'complex-hermitian'
  readonly n: number
  readonly re: Float64Array
  readonly im: Float64Array
}

export type HermitianMatrix = RealSymmetricMatrix | ComplexHermitianMatrix

/**
 * Autovettori ortonormali. L'autovettore j occupa gli indici [j·n, (j+1)·n)
 * di `re` (e di `im`, se presente). `im === null` ⇔ autovettori reali.
 */
export interface EigenVectors {
  readonly n: number
  readonly count: number
  readonly re: Float64Array
  readonly im: Float64Array | null
}

export interface EigenDecomposition {
  /** Autovalori in ordine crescente. */
  readonly values: Float64Array
  /** Autovettori nello stesso ordine degli autovalori; `null` se non richiesti. */
  readonly vectors: EigenVectors | null
}

export interface EighOptions {
  /** Calcolare gli autovettori (default true). Senza, il calcolo è più rapido. */
  readonly vectors?: boolean
}

/** Matrice reale simmetrica n×n di zeri. */
export function realSymmetricMatrix(n: number): RealSymmetricMatrix {
  if (!Number.isInteger(n) || n < 0) throw new RangeError(`dimensione non valida: ${n}`)
  return { kind: 'real-symmetric', n, data: new Float64Array(n * n) }
}

/** Matrice hermitiana complessa n×n di zeri. */
export function complexHermitianMatrix(n: number): ComplexHermitianMatrix {
  if (!Number.isInteger(n) || n < 0) throw new RangeError(`dimensione non valida: ${n}`)
  return { kind: 'complex-hermitian', n, re: new Float64Array(n * n), im: new Float64Array(n * n) }
}

/** Vista sull'autovettore j (sottoarray, senza copia). */
export function eigenvector(
  vectors: EigenVectors,
  j: number
): { readonly re: Float64Array; readonly im: Float64Array | null } {
  if (!Number.isInteger(j) || j < 0 || j >= vectors.count) {
    throw new RangeError(`indice di autovettore fuori intervallo: ${j}`)
  }
  const start = j * vectors.n
  const end = start + vectors.n
  return {
    re: vectors.re.subarray(start, end),
    im: vectors.im ? vectors.im.subarray(start, end) : null
  }
}

/** Autovalori (crescenti) e autovettori di una matrice hermitiana. */
export function eigh(matrix: HermitianMatrix, options: EighOptions = {}): EigenDecomposition {
  const wantVectors = options.vectors ?? true
  switch (matrix.kind) {
    case 'real-symmetric':
      return eighRealSymmetric(matrix, wantVectors)
    case 'complex-hermitian':
      return eighComplexHermitian(matrix, wantVectors)
  }
}

// ---------------------------------------------------------------------------
// Caso reale simmetrico: tridiagonalizzazione di Householder (tred2) e
// algoritmo QL con shift implicito (tql2), da JAMA (dominio pubblico),
// derivati da EISPACK. Complessità O(n³); stabile anche con autovalori degeneri.
// ---------------------------------------------------------------------------

const MAX_QL_ITERATIONS = 100

function eighRealSymmetric(matrix: RealSymmetricMatrix, wantVectors: boolean): EigenDecomposition {
  const n = matrix.n
  if (matrix.data.length !== n * n) throw new RangeError('eigh: dati della matrice di lunghezza errata')
  checkSymmetric(matrix)
  if (n === 0) {
    return {
      values: new Float64Array(0),
      vectors: wantVectors ? { n: 0, count: 0, re: new Float64Array(0), im: null } : null
    }
  }

  // V[i·n + j]: all'inizio la matrice, alla fine gli autovettori per colonne.
  const V = Float64Array.from(matrix.data)
  const d = new Float64Array(n)
  const e = new Float64Array(n)
  tred2(n, V, d, e)
  tql2(n, V, d, e, wantVectors)

  if (!wantVectors) return { values: d, vectors: null }

  // Da colonne (V[i·n + j] = componente i del vettore j) a vettori contigui.
  const re = new Float64Array(n * n)
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) re[j * n + i] = V[i * n + j]
  }
  return { values: d, vectors: { n, count: n, re, im: null } }
}

function checkSymmetric(matrix: RealSymmetricMatrix): void {
  const { n, data } = matrix
  let scale = 0
  for (let i = 0; i < n * n; i++) scale = Math.max(scale, Math.abs(data[i]))
  const tol = 1e-12 * Math.max(scale, Number.MIN_VALUE)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(data[i * n + j] - data[j * n + i]) > tol) {
        throw new Error(`eigh: matrice non simmetrica in (${i}, ${j})`)
      }
    }
  }
}

/** Householder: riduce V (simmetrica) a tridiagonale; d diagonale, e sottodiagonale. */
function tred2(n: number, V: Float64Array, d: Float64Array, e: Float64Array): void {
  for (let j = 0; j < n; j++) d[j] = V[(n - 1) * n + j]

  for (let i = n - 1; i > 0; i--) {
    let scale = 0
    let h = 0
    for (let k = 0; k < i; k++) scale += Math.abs(d[k])
    if (scale === 0) {
      e[i] = d[i - 1]
      for (let j = 0; j < i; j++) {
        d[j] = V[(i - 1) * n + j]
        V[i * n + j] = 0
        V[j * n + i] = 0
      }
    } else {
      for (let k = 0; k < i; k++) {
        d[k] /= scale
        h += d[k] * d[k]
      }
      let f = d[i - 1]
      let g = Math.sqrt(h)
      if (f > 0) g = -g
      e[i] = scale * g
      h -= f * g
      d[i - 1] = f - g
      for (let j = 0; j < i; j++) e[j] = 0
      for (let j = 0; j < i; j++) {
        f = d[j]
        V[j * n + i] = f
        g = e[j] + V[j * n + j] * f
        for (let k = j + 1; k <= i - 1; k++) {
          g += V[k * n + j] * d[k]
          e[k] += V[k * n + j] * f
        }
        e[j] = g
      }
      f = 0
      for (let j = 0; j < i; j++) {
        e[j] /= h
        f += e[j] * d[j]
      }
      const hh = f / (h + h)
      for (let j = 0; j < i; j++) e[j] -= hh * d[j]
      for (let j = 0; j < i; j++) {
        f = d[j]
        g = e[j]
        for (let k = j; k <= i - 1; k++) V[k * n + j] -= f * e[k] + g * d[k]
        d[j] = V[(i - 1) * n + j]
        V[i * n + j] = 0
      }
    }
    d[i] = h
  }

  // Accumula le trasformazioni (serve anche per ricavare la diagonale d).
  for (let i = 0; i < n - 1; i++) {
    V[(n - 1) * n + i] = V[i * n + i]
    V[i * n + i] = 1
    const h = d[i + 1]
    if (h !== 0) {
      for (let k = 0; k <= i; k++) d[k] = V[k * n + i + 1] / h
      for (let j = 0; j <= i; j++) {
        let g = 0
        for (let k = 0; k <= i; k++) g += V[k * n + i + 1] * V[k * n + j]
        for (let k = 0; k <= i; k++) V[k * n + j] -= g * d[k]
      }
    }
    for (let k = 0; k <= i; k++) V[k * n + i + 1] = 0
  }
  for (let j = 0; j < n; j++) {
    d[j] = V[(n - 1) * n + j]
    V[(n - 1) * n + j] = 0
  }
  V[(n - 1) * n + (n - 1)] = 1
  e[0] = 0
}

/** QL implicito sulla tridiagonale (d, e); ordina autovalori (e autovettori) in modo crescente. */
function tql2(n: number, V: Float64Array, d: Float64Array, e: Float64Array, wantVectors: boolean): void {
  for (let i = 1; i < n; i++) e[i - 1] = e[i]
  e[n - 1] = 0

  let f = 0
  let tst1 = 0
  const eps = Number.EPSILON
  for (let l = 0; l < n; l++) {
    tst1 = Math.max(tst1, Math.abs(d[l]) + Math.abs(e[l]))
    let m = l
    while (m < n) {
      if (Math.abs(e[m]) <= eps * tst1) break
      m++
    }
    if (m === n) m = n - 1 // e[n-1] = 0: non accade, ma protegge gli indici

    if (m > l) {
      let iter = 0
      do {
        if (++iter > MAX_QL_ITERATIONS) throw new Error('eigh: QL non converge')
        let g = d[l]
        let p = (d[l + 1] - g) / (2 * e[l])
        let r = Math.hypot(p, 1)
        if (p < 0) r = -r
        d[l] = e[l] / (p + r)
        d[l + 1] = e[l] * (p + r)
        const dl1 = d[l + 1]
        let h = g - d[l]
        for (let i = l + 2; i < n; i++) d[i] -= h
        f += h

        p = d[m]
        let c = 1
        let c2 = c
        let c3 = c
        const el1 = e[l + 1]
        let s = 0
        let s2 = 0
        for (let i = m - 1; i >= l; i--) {
          c3 = c2
          c2 = c
          s2 = s
          g = c * e[i]
          h = c * p
          r = Math.hypot(p, e[i])
          e[i + 1] = s * r
          s = e[i] / r
          c = p / r
          p = c * d[i] - s * g
          d[i + 1] = h + s * (c * g + s * d[i])
          if (wantVectors) {
            for (let k = 0; k < n; k++) {
              const row = k * n
              h = V[row + i + 1]
              V[row + i + 1] = s * V[row + i] + c * h
              V[row + i] = c * V[row + i] - s * h
            }
          }
        }
        p = (-s * s2 * c3 * el1 * e[l]) / dl1
        e[l] = s * p
        d[l] = c * p
      } while (Math.abs(e[l]) > eps * tst1)
    }
    d[l] += f
    e[l] = 0
  }

  // Ordinamento per selezione (n piccolo): autovalori crescenti.
  for (let i = 0; i < n - 1; i++) {
    let k = i
    let p = d[i]
    for (let j = i + 1; j < n; j++) {
      if (d[j] < p) {
        k = j
        p = d[j]
      }
    }
    if (k !== i) {
      d[k] = d[i]
      d[i] = p
      if (wantVectors) {
        for (let j = 0; j < n; j++) {
          const row = j * n
          const tmp = V[row + i]
          V[row + i] = V[row + k]
          V[row + k] = tmp
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Caso hermitiano complesso: riduzione unitaria di Householder a tridiagonale
// reale (via fase diagonale unitaria τ), tql2 già presente e trasformazione
// inversa sugli autovettori.
// ---------------------------------------------------------------------------

function checkHermitian(matrix: ComplexHermitianMatrix): void {
  const { n, re, im } = matrix
  let scale = 0
  for (let i = 0; i < n * n; i++) {
    scale = Math.max(scale, Math.abs(re[i]), Math.abs(im[i]))
  }
  const tol = 1e-12 * Math.max(scale, Number.MIN_VALUE)
  for (let i = 0; i < n; i++) {
    if (Math.abs(im[i * n + i]) > tol) {
      throw new Error(`eigh: parte immaginaria non nulla sulla diagonale in (${i}, ${i})`)
    }
    for (let j = i + 1; j < n; j++) {
      const a = i * n + j
      const b = j * n + i
      if (Math.abs(re[a] - re[b]) > tol || Math.abs(im[a] + im[b]) > tol) {
        throw new Error(`eigh: matrice non hermitiana in (${i}, ${j})`)
      }
    }
  }
}

function eighComplexHermitian(matrix: ComplexHermitianMatrix, wantVectors: boolean): EigenDecomposition {
  const n = matrix.n
  if (matrix.re.length !== n * n || matrix.im.length !== n * n) {
    throw new RangeError('eigh: dati della matrice di lunghezza errata')
  }
  checkHermitian(matrix)
  if (n === 0) {
    return {
      values: new Float64Array(0),
      vectors: wantVectors ? { n: 0, count: 0, re: new Float64Array(0), im: new Float64Array(0) } : null
    }
  }
  if (n === 1) {
    const values = Float64Array.of(matrix.re[0])
    return {
      values,
      vectors: wantVectors ? { n: 1, count: 1, re: Float64Array.of(1), im: Float64Array.of(0) } : null
    }
  }

  const Ar = Float64Array.from(matrix.re)
  const Ai = Float64Array.from(matrix.im)
  const d = new Float64Array(n)
  const e = new Float64Array(n)

  // Vettori di Householder (solo per i rami in cui servono gli autovettori) e loro denominatori H_i.
  const uStoreRe = wantVectors ? new Float64Array(n * n) : null
  const uStoreIm = wantVectors ? new Float64Array(n * n) : null
  const hStore = wantVectors ? new Float64Array(n) : null

  const ur = new Float64Array(n)
  const ui = new Float64Array(n)
  const pr = new Float64Array(n)
  const pi = new Float64Array(n)

  for (let i = n - 1; i > 0; i--) {
    const l = i - 1
    let scale = 0
    for (let k = 0; k <= l; k++) {
      // Colonna i del blocco corrente: v_k = A[k, i] = Ar[k*n + i] + i*Ai[k*n + i]
      scale += Math.abs(Ar[k * n + i]) + Math.abs(Ai[k * n + i])
    }
    if (scale === 0) {
      e[i] = 0
      continue
    }

    let h = 0
    for (let k = 0; k <= l; k++) {
      const vr = Ar[k * n + i] / scale
      const vi = Ai[k * n + i] / scale
      ur[k] = vr
      ui[k] = vi
      h += vr * vr + vi * vi
    }
    if (h === 0) {
      e[i] = 0
      continue
    }

    const g = Math.sqrt(h)
    const fRe = ur[l]
    const fIm = ui[l]
    const rL = Math.hypot(fRe, fIm)
    // α = −g · phase(v_l) così u = v − α e_l evita cancellazione in H_denom = h + g·|v_l|
    let alphaRe: number
    let alphaIm: number
    if (rL > 0) {
      alphaRe = (-g * fRe) / rL
      alphaIm = (-g * fIm) / rL
    } else {
      alphaRe = -g
      alphaIm = 0
    }
    ur[l] = fRe - alphaRe
    ui[l] = fIm - alphaIm
    const hDenom = h + g * rL

    // Elemento sottodiagonale complesso (i, l) dopo P_i = conj(α) * scale
    Ar[i * n + l] = scale * alphaRe
    Ai[i * n + l] = -scale * alphaIm

    if (wantVectors && uStoreRe && uStoreIm && hStore) {
      hStore[i] = hDenom
      const base = i * n
      for (let k = 0; k <= l; k++) {
        uStoreRe[base + k] = ur[k]
        uStoreIm[base + k] = ui[k]
      }
    }

    // p = (A_sub · u) / hDenom, sfruttando che A_sub è hermitiana (triangolo inferiore o intero blocco)
    for (let r = 0; r <= l; r++) {
      let sumRe = 0
      let sumIm = 0
      const rowOff = r * n
      for (let c = 0; c <= l; c++) {
        const ar = Ar[rowOff + c]
        const ai = Ai[rowOff + c]
        const xr = ur[c]
        const xi = ui[c]
        sumRe += ar * xr - ai * xi
        sumIm += ar * xi + ai * xr
      }
      pr[r] = sumRe / hDenom
      pi[r] = sumIm / hDenom
    }

    // K = Re(u^H · p) / (2 · hDenom)
    let uDotP = 0
    for (let k = 0; k <= l; k++) {
      uDotP += ur[k] * pr[k] + ui[k] * pi[k]
    }
    const kScalar = uDotP / (2 * hDenom)

    // q = p − K·u (sovrascrive pr, pi)
    for (let k = 0; k <= l; k++) {
      pr[k] -= kScalar * ur[k]
      pi[k] -= kScalar * ui[k]
    }

    // A_sub ← A_sub − u·q^H − q·u^H (aggiorna tutto il blocco hermitiano [0..l, 0..l])
    for (let r = 0; r <= l; r++) {
      const urr = ur[r]
      const uir = ui[r]
      const qrr = pr[r]
      const qir = pi[r]
      const rowOff = r * n
      for (let c = 0; c <= r; c++) {
        const urc = ur[c]
        const uic = ui[c]
        const qrc = pr[c]
        const qic = pi[c]
        // (u_r q_c^* + q_r u_c^*)
        const subRe = urr * qrc + uir * qic + (qrr * urc + qir * uic)
        const subIm = uir * qrc - urr * qic + (qir * urc - qrr * uic)
        const nr = Ar[rowOff + c] - subRe
        const ni = r === c ? 0 : Ai[rowOff + c] - subIm
        Ar[rowOff + c] = nr
        Ai[rowOff + c] = ni
        if (r !== c) {
          Ar[c * n + r] = nr
          Ai[c * n + r] = -ni
        }
      }
    }
  }

  // Rimozione delle fasi complesse dalla sottodiagonale: D^H T D ha sottodiagonali reali e[i] ≥ 0
  for (let i = 0; i < n; i++) d[i] = Ar[i * n + i]
  const tauRe = wantVectors ? new Float64Array(n) : null
  const tauIm = wantVectors ? new Float64Array(n) : null
  if (tauRe && tauIm) tauRe[0] = 1

  let prevTauRe = 1
  let prevTauIm = 0
  for (let i = 1; i < n; i++) {
    const cr = Ar[i * n + (i - 1)]
    const ci = Ai[i * n + (i - 1)]
    const mod = Math.hypot(cr, ci)
    e[i] = mod
    if (wantVectors && tauRe && tauIm) {
      if (mod > 0) {
        const nr = (cr * prevTauRe - ci * prevTauIm) / mod
        const ni = (cr * prevTauIm + ci * prevTauRe) / mod
        tauRe[i] = nr
        tauIm[i] = ni
        prevTauRe = nr
        prevTauIm = ni
      } else {
        tauRe[i] = 1
        tauIm[i] = 0
        prevTauRe = 1
        prevTauIm = 0
      }
    }
  }

  // Autovalori (e autovettori reali della tridiagonale reale) tramite tql2 già presente
  const Z = wantVectors ? new Float64Array(n * n) : new Float64Array(0)
  if (wantVectors) {
    for (let i = 0; i < n; i++) Z[i * n + i] = 1
  }
  tql2(n, Z, d, e, wantVectors)

  if (!wantVectors) return { values: d, vectors: null }

  // W = D · Z (colonne j diventano righe contigue j*n + i in outRe/outIm)
  const outRe = new Float64Array(n * n)
  const outIm = new Float64Array(n * n)
  if (tauRe && tauIm) {
    for (let j = 0; j < n; j++) {
      const colOff = j * n
      for (let i = 0; i < n; i++) {
        const zij = Z[i * n + j]
        outRe[colOff + i] = tauRe[i] * zij
        outIm[colOff + i] = tauIm[i] * zij
      }
    }
  }

  // Trasformazione inversa: W ← P_1 · P_2 · … · P_{n-1} · W
  if (uStoreRe && uStoreIm && hStore) {
    for (let i = 1; i < n; i++) {
      const hDenom = hStore[i]
      if (hDenom === 0) continue
      const base = i * n
      for (let j = 0; j < n; j++) {
        const vecOff = j * n
        let dotRe = 0
        let dotIm = 0
        for (let k = 0; k < i; k++) {
          const ukR = uStoreRe[base + k]
          const ukI = uStoreIm[base + k]
          const wkR = outRe[vecOff + k]
          const wkI = outIm[vecOff + k]
          // u^H · w
          dotRe += ukR * wkR + ukI * wkI
          dotIm += ukR * wkI - ukI * wkR
        }
        const sRe = dotRe / hDenom
        const sIm = dotIm / hDenom
        for (let k = 0; k < i; k++) {
          const ukR = uStoreRe[base + k]
          const ukI = uStoreIm[base + k]
          outRe[vecOff + k] -= sRe * ukR - sIm * ukI
          outIm[vecOff + k] -= sRe * ukI + sIm * ukR
        }
      }
    }
  }

  return {
    values: d,
    vectors: { n, count: n, re: outRe, im: outIm }
  }
}
