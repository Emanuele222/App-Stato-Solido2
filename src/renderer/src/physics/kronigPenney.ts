/**
 * Modello di Kronig–Penney 1D (dispensa Parte 3, §10 e formulario):
 *  - potenziale a delta periodiche: V(x) = aV₀ Σ δ(x − x_barriera), P = m₀a²V₀/ħ²;
 *  - potenziale a barriere rettangolari: buche larghe b (V = 0), barriere larghe
 *    c e alte V₀, periodo a = b + c (anche E > V₀);
 *  - livelli della buca finita isolata (livelli «genitori» delle bande);
 *  - ricerca esatta dei bordi di banda |L(E)| = 1 e inversione E_n(k);
 *  - approssimazione lineare a coseno E = Ē ∓ 2t·cos ka (ponte verso legami forti);
 *  - densità esatta |ψ_k(x)|² tramite matrice di trasferimento 2×2 sulla cella,
 *    con ioni centrati nelle buche in x = n·a (barriere a metà tra due ioni).
 * Unità: Å, Å⁻¹, eV.
 */
import type { BandStructure, KPath } from './bandStructure'
import { HBAR2_OVER_2M0, HBAR2_OVER_M0 } from './constants'
import { zoneBoundaryEnergy } from './freeElectron'

export type KronigPenneySpec =
  | { readonly variant: 'delta'; readonly a: number; readonly P: number }
  | { readonly variant: 'rectangular'; readonly b: number; readonly c: number; readonly v0: number }

export interface FiniteWellLevel {
  /** Indice 0-based dal basso. */
  readonly index: number
  readonly parity: 'even' | 'odd'
  /** Variabile adimensionale ξ = αb/2. */
  readonly xi: number
  /** Variabile adimensionale η = βb/2. */
  readonly eta: number
  /** Energia dal fondo della buca (eV). */
  readonly energy: number
}

export interface KronigBandEdge {
  /** Indice di banda 0-based (0 = banda più bassa). */
  readonly band: number
  /** Bordo inferiore della banda (eV). */
  readonly lower: number
  /** Bordo superiore della banda (eV). */
  readonly upper: number
  /** Larghezza W = upper − lower (eV). */
  readonly width: number
  /** Dove cade il bordo inferiore: centro zona (k = 0) o bordo (±π/a). */
  readonly lowerAt: 'center' | 'edge'
  /** Dove cade il bordo superiore: bordo (±π/a) o centro zona (k = 0). */
  readonly upperAt: 'center' | 'edge'
}

export interface KronigGap {
  /** Indice 0-based (0 = gap fra banda 1 e banda 2). */
  readonly index: number
  readonly lower: number
  readonly upper: number
  readonly width: number
  readonly location: 'edge' | 'center'
}

export interface CosineBandApprox {
  readonly band: number
  /** Centro della banda Ē = (E_lo + E_hi)/2 (eV). */
  readonly center: number
  /** Larghezza W = E_hi − E_lo (eV). */
  readonly width: number
  /** Integrale di salto effettivo t = W/4 (eV, ≥ 0). */
  readonly t: number
  /** −1 se il minimo è in k = 0 (banda pari), +1 se in ±π/a (banda dispari). */
  readonly cosSign: -1 | 1
  /** E_cos(k) = Ē + cosSign · 2t · cos(ka) (eV). */
  evalAt(k: number): number
  /** Massa efficace al minimo di banda in unità di m₀: ħ²/(2ta²). */
  readonly minMassRatio: number
  /** Rapporto m* : m₀ della banda a coseno nel punto k (Å⁻¹). */
  effectiveMassRatioAt(k: number): number
}

function sinc(x: number): number {
  const ax = Math.abs(x)
  if (ax < 1e-4) {
    const x2 = x * x
    return 1 - x2 / 6 + (x2 * x2) / 120
  }
  return Math.sin(x) / x
}

function sinhc(x: number): number {
  const ax = Math.abs(x)
  if (ax < 1e-4) {
    const x2 = x * x
    return 1 + x2 / 6 + (x2 * x2) / 120
  }
  return Math.sinh(x) / x
}

/** Periodo reticolare a (Å) del modello Kronig–Penney. */
export function kronigPenneyPeriod(spec: KronigPenneySpec): number {
  if (spec.variant === 'delta') {
    if (!(spec.a > 0)) throw new RangeError(`passo a non valido: ${spec.a}`)
    if (!(spec.P >= 0) || !Number.isFinite(spec.P)) throw new RangeError(`P non valido: ${spec.P}`)
    return spec.a
  }
  if (!(spec.b > 0) || !(spec.c >= 0) || !(spec.v0 >= 0)) {
    throw new RangeError(`parametri rettangolari non validi: b=${spec.b}, c=${spec.c}, V₀=${spec.v0}`)
  }
  return spec.b + spec.c
}

/**
 * Altezza ausiliaria V₀ (eV) definita da P = m₀a²V₀/ħ² nel modello a delta
 * (così l'intensità della delta è a·V₀ in eV·Å).
 */
export function deltaPotentialScaleV0(a: number, P: number): number {
  if (!(a > 0)) throw new RangeError(`passo a non valido: ${a}`)
  if (!(P >= 0)) throw new RangeError(`P non valido: ${P}`)
  return (2 * HBAR2_OVER_2M0 * P) / (a * a)
}

/**
 * Intensità effettiva della barriera (eV·Å): a·V₀ nel caso a delta,
 * V₀·c nel caso rettangolare (nel limite a delta c → 0 con V₀·c fisso coincidono).
 */
export function kronigBarrierStrength(spec: KronigPenneySpec): number {
  if (spec.variant === 'delta') return spec.a * deltaPotentialScaleV0(spec.a, spec.P)
  return spec.v0 * spec.c
}

/** Parametro adimensionale effettivo P_eff = m₀·a·(V₀c)/ħ² per il confronto con il delta. */
export function kronigEffectiveP(spec: KronigPenneySpec): number {
  if (spec.variant === 'delta') return spec.P
  const a = spec.b + spec.c
  return (a * spec.v0 * spec.c) / (2 * HBAR2_OVER_2M0)
}

/**
 * Funzione L_δ(E) = cos(αa) + P·sin(αa)/(αa) del modello a delta (P3 §10.3),
 * regolare anche in E = 0 (dove vale 1 + P) e per E < 0.
 */
export function kronigPenneyDeltaL(energy: number, a: number, P: number): number {
  if (!(a > 0)) throw new RangeError(`passo a non valido: ${a}`)
  if (!(P >= 0)) throw new RangeError(`P non valido: ${P}`)
  if (energy >= 0) {
    const x = a * Math.sqrt(energy / HBAR2_OVER_2M0)
    return Math.cos(x) + P * sinc(x)
  }
  const x = a * Math.sqrt(-energy / HBAR2_OVER_2M0)
  return Math.cosh(x) + P * sinhc(x)
}

/**
 * Funzione L(E) del modello a barriere rettangolari (P3 §10.5, eq. rettangolare):
 * L = cos(αb)cosh(βc) + [(β²−α²)/2αβ]·sin(αb)sinh(βc) per 0 ≤ E ≤ V₀,
 * con prolungamento analitico continuo per E > V₀ (β → iβ′) ed E ≤ 0.
 */
export function kronigPenneyRectangularL(energy: number, b: number, c: number, v0: number): number {
  if (!(b > 0) || !(c >= 0) || !(v0 >= 0)) {
    throw new RangeError(`parametri non validi: b=${b}, c=${c}, V₀=${v0}`)
  }
  const alpha2 = energy / HBAR2_OVER_2M0
  const beta2 = (v0 - energy) / HBAR2_OVER_2M0

  // parte della buca: cos(αb) e sinc(αb)
  let cosA: number
  let sincA: number
  if (alpha2 >= 0) {
    const ab = b * Math.sqrt(alpha2)
    cosA = Math.cos(ab)
    sincA = sinc(ab)
  } else {
    const kb = b * Math.sqrt(-alpha2)
    cosA = Math.cosh(kb)
    sincA = sinhc(kb)
  }

  // parte della barriera: cosh(βc) e sinhc(βc)
  let coshB: number
  let sinhcB: number
  if (beta2 >= 0) {
    const bc = c * Math.sqrt(beta2)
    coshB = Math.cosh(bc)
    sinhcB = sinhc(bc)
  } else {
    const bpc = c * Math.sqrt(-beta2)
    coshB = Math.cos(bpc)
    sinhcB = sinc(bpc)
  }

  // [(β² − α²)/(2αβ)]·sin(αb)·sinh(βc) = [(β² − α²)·b·c / 2]·sinc(αb)·sinhc(βc)
  return cosA * coshB + 0.5 * (beta2 - alpha2) * b * c * sincA * sinhcB
}

/** Valuta L(E) per uno dei due modelli. */
export function kronigPenneyL(spec: KronigPenneySpec, energy: number): number {
  return spec.variant === 'delta'
    ? kronigPenneyDeltaL(energy, spec.a, spec.P)
    : kronigPenneyRectangularL(energy, spec.b, spec.c, spec.v0)
}

/**
 * Ricerca di radice con brent/bisezione garantita su [lo, hi] con f(lo)·f(hi) ≤ 0.
 * Tolleranza relativa e assoluta vicine alla precisione macchina.
 */
function findRoot(fn: (x: number) => number, lo: number, hi: number, tol = 1e-13): number {
  let a = lo
  let b = hi
  let fa = fn(a)
  let fb = fn(b)
  if (Math.abs(fa) === 0) return a
  if (Math.abs(fb) === 0) return b
  if (fa * fb > 0) {
    // ripiego: punto col modulo minore
    return Math.abs(fa) < Math.abs(fb) ? a : b
  }
  let c = a
  let fc = fa
  let d = b - a
  let e = d
  for (let iter = 0; iter < 90; iter++) {
    if ((fb > 0 && fc > 0) || (fb < 0 && fc < 0)) {
      c = a
      fc = fa
      d = b - a
      e = d
    }
    if (Math.abs(fc) < Math.abs(fb)) {
      a = b
      b = c
      c = a
      fa = fb
      fb = fc
      fc = fa
    }
    const tolAct = 2e-15 * Math.abs(b) + 0.5 * tol
    const m = 0.5 * (c - b)
    if (Math.abs(m) <= tolAct || fb === 0) return b
    if (Math.abs(e) >= tolAct && Math.abs(fa) > Math.abs(fb)) {
      const s = fb / fa
      let p: number
      let q: number
      if (a === c) {
        p = 2 * m * s
        q = 1 - s
      } else {
        q = fa / fc
        const r = fb / fc
        p = s * (2 * m * q * (q - r) - (b - a) * (r - 1))
        q = (q - 1) * (r - 1) * (s - 1)
      }
      if (p > 0) q = -q
      else p = -p
      if (2 * p < Math.min(3 * m * q - Math.abs(tolAct * q), Math.abs(e * q))) {
        e = d
        d = p / q
      } else {
        d = m
        e = d
      }
    } else {
      d = m
      e = d
    }
    a = b
    fa = fb
    b += Math.abs(d) > tolAct ? d : m > 0 ? tolAct : -tolAct
    fb = fn(b)
  }
  return b
}

/**
 * Livelli legati della buca finita isolata di larghezza `b` (Å) e profondità
 * `v0` (eV) (P3 §10.2, soluzione grafica senza singolarità di tan/cot).
 */
export function finiteWellLevels1D(b: number, v0: number): readonly FiniteWellLevel[] {
  if (!(b > 0)) throw new RangeError(`larghezza b non valida: ${b}`)
  if (!(v0 >= 0)) throw new RangeError(`V₀ non valido: ${v0}`)
  if (v0 === 0) return []

  const rho = 0.5 * b * Math.sqrt(v0 / HBAR2_OVER_2M0)
  const count = Math.floor((2 * rho) / Math.PI) + 1
  const out: FiniteWellLevel[] = []

  for (let j = 0; j < count; j++) {
    const even = j % 2 === 0
    const lo = (j * Math.PI) / 2
    const hi = Math.min(rho, ((j + 1) * Math.PI) / 2)
    if (hi <= lo) continue
    // Risolviamo sqrt(ρ²−ξ²)·cos ξ − ξ·sin ξ = 0 (pari)
    // o sqrt(ρ²−ξ²)·sin ξ + ξ·cos ξ = 0 (dispari): regolari su [lo, hi].
    const fn = even
      ? (xi: number): number => Math.sqrt(Math.max(0, rho * rho - xi * xi)) * Math.cos(xi) - xi * Math.sin(xi)
      : (xi: number): number => Math.sqrt(Math.max(0, rho * rho - xi * xi)) * Math.sin(xi) + xi * Math.cos(xi)
    const xi = findRoot(fn, lo, hi, 1e-13)
    const eta = Math.sqrt(Math.max(0, rho * rho - xi * xi))
    const alpha = (2 * xi) / b
    const energy = HBAR2_OVER_2M0 * alpha * alpha
    out.push({
      index: j,
      parity: even ? 'even' : 'odd',
      xi,
      eta,
      energy
    })
  }
  return out
}

/**
 * Bordi delle prime `nBands` bande permesse nel caso a delta (P3 §10.4):
 * ogni banda n (0-based) sta esattamente in αa ∈ [nπ, (n+1)π], con bordo
 * superiore (nel caso di αa crescente) esattamente in αa = (n+1)π.
 */
export function kronigPenneyDeltaBandEdges(a: number, P: number, nBands: number): readonly KronigBandEdge[] {
  if (!(a > 0)) throw new RangeError(`passo a non valido: ${a}`)
  if (!(P >= 0)) throw new RangeError(`P non valido: ${P}`)
  if (!Number.isInteger(nBands) || nBands < 1) throw new RangeError(`nBands non valido: ${nBands}`)

  const toE = (x: number): number => HBAR2_OVER_2M0 * (x / a) * (x / a)
  const out: KronigBandEdge[] = []

  for (let n = 0; n < nBands; n++) {
    const xMin = n * Math.PI
    const xMax = (n + 1) * Math.PI
    const targetLo = n % 2 === 0 ? 1 : -1
    let xLo: number
    if (P === 0) {
      xLo = xMin
    } else {
      const f = (x: number): number => Math.cos(x) + P * sinc(x) - targetLo
      // Per n ≥ 1 in xMin = nπ la funzione vale targetLo e cresce di modulo appena dopo;
      // partiamo un filo a destra dove f ha il segno opposto rispetto a xMax.
      const eps = n === 0 ? 0 : Math.min(1e-7, 1e-4 / (1 + P))
      xLo = findRoot(f, xMin + eps, xMax, 1e-13)
    }
    const lower = toE(xLo)
    const upper = toE(xMax)
    out.push({
      band: n,
      lower,
      upper,
      width: upper - lower,
      lowerAt: n % 2 === 0 ? 'center' : 'edge',
      upperAt: n % 2 === 0 ? 'edge' : 'center'
    })
  }
  return out
}

function goldenExtremum(fn: (x: number) => number, a: number, b: number, findMax: boolean): { x: number; val: number } {
  const phi = 0.5 * (Math.sqrt(5) - 1)
  let lo = a
  let hi = b
  let x1 = hi - phi * (hi - lo)
  let x2 = lo + phi * (hi - lo)
  let f1 = fn(x1)
  let f2 = fn(x2)
  for (let i = 0; i < 48; i++) {
    const pickLeft = findMax ? f1 > f2 : f1 < f2
    if (pickLeft) {
      hi = x2
      x2 = x1
      f2 = f1
      x1 = hi - phi * (hi - lo)
      f1 = fn(x1)
    } else {
      lo = x1
      x1 = x2
      f1 = f2
      x2 = lo + phi * (hi - lo)
      f2 = fn(x2)
    }
  }
  const xm = 0.5 * (lo + hi)
  return { x: xm, val: fn(xm) }
}

/**
 * Bordi delle prime `nBands` bande permesse nel caso a barriere rettangolari.
 * Combina una griglia in α = √(E/(ħ²/2m₀)) con un raffinamento multiscala attorno
 * ai livelli genitori della buca isolata, così nessuna banda stretta (es. W ~ 10⁻¹¹ eV)
 * può essere saltata.
 */
export function kronigPenneyRectangularBandEdges(
  b: number,
  c: number,
  v0: number,
  nBands: number
): readonly KronigBandEdge[] {
  if (!(b > 0) || !(c >= 0) || !(v0 >= 0)) {
    throw new RangeError(`parametri non validi: b=${b}, c=${c}, V₀=${v0}`)
  }
  if (!Number.isInteger(nBands) || nBands < 1) throw new RangeError(`nBands non valido: ${nBands}`)

  if (c === 0 || v0 === 0) {
    return kronigPenneyDeltaBandEdges(b + c, 0, nBands)
  }

  const a = b + c
  const eMaxSearch = (nBands + 1) * (nBands + 1) * zoneBoundaryEnergy(a) + v0 + 1
  const alphaMax = Math.sqrt(eMaxSearch / HBAR2_OVER_2M0)
  const wellLevels = finiteWellLevels1D(b, v0)

  // Raccogliamo α uniformi + stencil diadico attorno ai livelli della buca isolata
  const nGrid = Math.max(700, 140 * nBands)
  const alphas: number[] = []
  for (let i = 0; i <= nGrid; i++) alphas.push((alphaMax * i) / nGrid)

  for (let j = 0; j < wellLevels.length; j++) {
    const aj = Math.sqrt(wellLevels[j].energy / HBAR2_OVER_2M0)
    alphas.push(aj)
    const prev = j > 0 ? Math.sqrt(wellLevels[j - 1].energy / HBAR2_OVER_2M0) : 0
    const next = j + 1 < wellLevels.length ? Math.sqrt(wellLevels[j + 1].energy / HBAR2_OVER_2M0) : alphaMax
    const spanL = 0.45 * (aj - prev)
    const spanR = 0.45 * (next - aj)
    for (let m = 0; m <= 36; m++) {
      const scale = Math.pow(2, -m)
      alphas.push(aj - spanL * scale)
      alphas.push(aj + spanR * scale)
    }
  }

  alphas.sort((x, y) => x - y)
  const uniq: number[] = []
  for (const al of alphas) {
    if (uniq.length === 0 || al - uniq[uniq.length - 1] > 1e-13 * (1 + al)) uniq.push(al)
  }

  const Lalpha = (al: number): number => kronigPenneyRectangularL(HBAR2_OVER_2M0 * al * al, b, c, v0)
  const Ls = uniq.map(Lalpha)

  // Punti di ingresso/uscita (|L| = 1) e tocchi tangenziali ai gap chiusi (E > V₀)
  interface EdgePair {
    lo: number
    hi: number
  }
  const rawBands: EdgePair[] = []
  let inBand = Math.abs(Ls[0]) <= 1
  let curStart = inBand ? uniq[0] : 0

  for (let i = 0; i < uniq.length - 1; i++) {
    const l0 = Ls[i]
    const l1 = Ls[i + 1]
    const in0 = Math.abs(l0) <= 1
    const in1 = Math.abs(l1) <= 1

    if (!in0 && !in1) {
      // controllo raro di attraversamento di una banda strettissima: segno opposto di L
      if (l0 * l1 < 0) {
        const s = l0 > 0 ? 1 : -1
        const r1 = findRoot((al) => Lalpha(al) - s, uniq[i], uniq[i + 1], 1e-13)
        const r2 = findRoot((al) => Lalpha(al) + s, r1, uniq[i + 1], 1e-13)
        rawBands.push({ lo: r1, hi: r2 })
      }
      continue
    }

    if (!in0 && in1) {
      const target = l0 > 1 ? 1 : -1
      curStart = findRoot((al) => Lalpha(al) - target, uniq[i], uniq[i + 1], 1e-13)
      inBand = true
      continue
    }

    if (in0 && !in1) {
      const target = l1 > 1 ? 1 : -1
      const end = findRoot((al) => Lalpha(al) - target, uniq[i], uniq[i + 1], 1e-13)
      rawBands.push({ lo: curStart, hi: end })
      inBand = false
      continue
    }

    // Entrambi dentro |L| ≤ 1: verifichiamo un possibile estremo vicino a ±1 (gap quasi chiuso / chiuso)
    if (Math.abs(l0) > 0.85 || Math.abs(l1) > 0.85) {
      const slopeL = i > 0 ? l0 - Ls[i - 1] : l1 - l0
      const slopeR = i + 2 < uniq.length ? Ls[i + 2] - l1 : l1 - l0
      if (slopeL * slopeR < 0) {
        const findMax = l0 + l1 > 0
        const ext = goldenExtremum(Lalpha, uniq[i], uniq[i + 1], findMax)
        if (Math.abs(ext.val) >= 1 - 1e-10) {
          const target = findMax ? 1 : -1
          if (Math.abs(ext.val) > 1 + 1e-13) {
            const end1 = findRoot((al) => Lalpha(al) - target, uniq[i], ext.x, 1e-13)
            const start2 = findRoot((al) => Lalpha(al) - target, ext.x, uniq[i + 1], 1e-13)
            rawBands.push({ lo: curStart, hi: end1 })
            curStart = start2
          } else {
            rawBands.push({ lo: curStart, hi: ext.x })
            curStart = ext.x
          }
        }
      }
    }
  }

  if (inBand) rawBands.push({ lo: curStart, hi: uniq[uniq.length - 1] })

  return rawBands.slice(0, nBands).map((p, n) => {
    const lower = HBAR2_OVER_2M0 * p.lo * p.lo
    const upper = HBAR2_OVER_2M0 * p.hi * p.hi
    return {
      band: n,
      lower,
      upper,
      width: upper - lower,
      lowerAt: n % 2 === 0 ? 'center' : 'edge',
      upperAt: n % 2 === 0 ? 'edge' : 'center'
    }
  })
}

/** Bordi delle prime `nBands` bande per entrambi i modelli. */
export function kronigPenneyBandEdges(spec: KronigPenneySpec, nBands: number): readonly KronigBandEdge[] {
  return spec.variant === 'delta'
    ? kronigPenneyDeltaBandEdges(spec.a, spec.P, nBands)
    : kronigPenneyRectangularBandEdges(spec.b, spec.c, spec.v0, nBands)
}

/** Estrae i gap tra bande successive dai bordi già calcolati. */
export function kronigPenneyGaps(edges: readonly KronigBandEdge[]): readonly KronigGap[] {
  const gaps: KronigGap[] = []
  for (let i = 0; i + 1 < edges.length; i++) {
    const lower = edges[i].upper
    const upper = edges[i + 1].lower
    gaps.push({
      index: i,
      lower,
      upper,
      width: Math.max(0, upper - lower),
      location: i % 2 === 0 ? 'edge' : 'center'
    })
  }
  return gaps
}

/**
 * Risolve L(E) = cos(k·a) sulla banda `band` per un vettore d'onda di Bloch `k` (Å⁻¹).
 * Poiché L(E) è monotona su ciascuna banda permessa, l'inversione è univoca e regolare
 * anche agli estremi k = 0 e k = ±π/a (per periodicità di cos ka).
 */
export function kronigPenneyEnergyAt(
  spec: KronigPenneySpec,
  k: number,
  band: number,
  precomputedEdges?: readonly KronigBandEdge[]
): number {
  const a = kronigPenneyPeriod(spec)
  const edges = precomputedEdges ?? kronigPenneyBandEdges(spec, band + 1)
  const edge = edges[band]
  if (!edge) throw new RangeError(`banda ${band} non disponibile`)

  const cka = Math.cos(k * a)
  if (edge.width <= 1e-15 * Math.max(1, edge.lower)) {
    return 0.5 * (edge.lower + edge.upper)
  }
  const targetLo = band % 2 === 0 ? 1 : -1
  const targetHi = -targetLo
  if (Math.abs(cka - targetLo) <= 1e-14) return edge.lower
  if (Math.abs(cka - targetHi) <= 1e-14) return edge.upper

  return findRoot(
    (E) => kronigPenneyL(spec, E) - cka,
    edge.lower,
    edge.upper,
    Math.min(1e-13, 1e-10 * edge.width + 1e-15)
  )
}

/** Funzione E_n(k) della banda `band` (per `bandSlope`, `bandCurvature`, `effectiveMassRatio`). */
export function kronigPenneyBandFunction(
  spec: KronigPenneySpec,
  band: number,
  precomputedEdges?: readonly KronigBandEdge[]
): (k: number) => number {
  const edges = precomputedEdges ?? kronigPenneyBandEdges(spec, band + 1)
  return (k: number) => kronigPenneyEnergyAt(spec, k, band, edges)
}

/**
 * Struttura a bande 1D nel formato comune `BandStructure` (compatibile con
 * `fillBands`, `BandPlot` e confronto con `emptyLatticeBands`).
 */
export function kronigPenneyBands(
  spec: KronigPenneySpec,
  path: KPath,
  nBands: number,
  precomputedEdges?: readonly KronigBandEdge[]
): BandStructure {
  if (path.dimension !== 1) throw new RangeError('kronigPenneyBands: serve un cammino 1D')
  const a = kronigPenneyPeriod(spec)
  const edges = precomputedEdges ?? kronigPenneyBandEdges(spec, nBands)
  const nk = path.points.length
  const energies = Array.from({ length: nBands }, () => new Float64Array(nk))

  // Cache su |k| quando il cammino è simmetrico come zonePath1D
  const cache = new Map<string, number>()
  for (let b = 0; b < nBands; b++) {
    const edge = edges[b]
    for (let i = 0; i < nk; i++) {
      const kAbs = Math.abs(path.points[i][0])
      const key = `${b}:${Math.round(kAbs * 1e12)}`
      let E = cache.get(key)
      if (E === undefined) {
        const cka = Math.cos(kAbs * a)
        if (edge.width <= 1e-15 * Math.max(1, edge.lower)) {
          E = 0.5 * (edge.lower + edge.upper)
        } else {
          const targetLo = b % 2 === 0 ? 1 : -1
          const targetHi = -targetLo
          if (Math.abs(cka - targetLo) <= 1e-14) E = edge.lower
          else if (Math.abs(cka - targetHi) <= 1e-14) E = edge.upper
          else {
            E = findRoot(
              (val) => kronigPenneyL(spec, val) - cka,
              edge.lower,
              edge.upper,
              Math.min(1e-13, 1e-10 * edge.width + 1e-15)
            )
          }
        }
        cache.set(key, E)
      }
      energies[b][i] = E
    }
  }
  return { method: 'kronig-penney', path, energies }
}

/**
 * Approssimazione a coseno per la banda `band` (P3 §10.6):
 * E(k) ≈ Ē ∓ 2t·cos ka, con t = W/4 ≥ 0, W = 4t e m*(k_min) = ħ²/(2ta²).
 */
export function kronigPenneyCosineApproximation(
  edges: readonly KronigBandEdge[],
  a: number,
  band: number
): CosineBandApprox {
  if (!(a > 0)) throw new RangeError(`passo a non valido: ${a}`)
  const edge = edges[band]
  if (!edge) throw new RangeError(`banda ${band} non disponibile`)
  const center = 0.5 * (edge.lower + edge.upper)
  const width = edge.width
  const t = 0.25 * width
  const cosSign: -1 | 1 = band % 2 === 0 ? -1 : 1
  const minMassRatio = t > 0 ? HBAR2_OVER_M0 / (2 * t * a * a) : Infinity

  return {
    band,
    center,
    width,
    t,
    cosSign,
    evalAt(k: number): number {
      return center + cosSign * 2 * t * Math.cos(k * a)
    },
    minMassRatio,
    effectiveMassRatioAt(k: number): number {
      const denom = -cosSign * 2 * t * a * a * Math.cos(k * a)
      return denom === 0 ? Infinity : HBAR2_OVER_M0 / denom
    }
  }
}

/**
 * Matrice di trasferimento 2×2 [ψ(d), ψ′(d)]ᵀ = T(d, E−V) [ψ(0), ψ′(0)]ᵀ
 * su un tratto piatto lungo `d` (Å) con energia relativa `deltaE = E − V` (eV).
 */
function flatTransfer(d: number, deltaE: number): readonly [number, number, number, number] {
  const q2 = deltaE / HBAR2_OVER_2M0
  if (q2 >= 0) {
    const qd = d * Math.sqrt(q2)
    const c = Math.cos(qd)
    const ds = d * sinc(qd)
    return [c, ds, -q2 * ds, c]
  }
  const k2 = -q2
  const kd = d * Math.sqrt(k2)
  const c = Math.cosh(kd)
  const ds = d * sinhc(kd)
  return [c, ds, k2 * ds, c]
}

/**
 * Calcola |ψ_k(x)|² esatta del modello di Kronig–Penney sui punti `xs` (Å),
 * normalizzata in modo che la media su una cella sia 1 (come `blochDensity1D`).
 * Convenzione spaziale: le buche (e gli ioni) sono centrate in x = n·a;
 * le barriere (o le delta) stanno a metà tra due ioni, in x = (n + ½)a.
 */
export function kronigPenneyDensity1D(
  spec: KronigPenneySpec,
  k: number,
  band: number,
  xs: ArrayLike<number>,
  precomputedEnergy?: number
): Float64Array {
  const a = kronigPenneyPeriod(spec)
  const E = precomputedEnergy ?? kronigPenneyEnergyAt(spec, k, band)
  const b = spec.variant === 'delta' ? a : spec.b
  const c = spec.variant === 'delta' ? 0 : spec.c
  const v0 = spec.variant === 'delta' ? 0 : spec.v0

  // Matrice della cella r ∈ [0, a]: buca [0, b] poi barriera [b, a] (o kick delta)
  const W = flatTransfer(b, E)
  let M11: number, M12: number, M21: number, M22: number
  if (spec.variant === 'delta') {
    const kick = (2 * spec.P) / a
    M11 = W[0]
    M12 = W[1]
    M21 = kick * W[0] + W[2]
    M22 = kick * W[1] + W[3]
  } else {
    const B = flatTransfer(c, E - v0)
    M11 = B[0] * W[0] + B[1] * W[2]
    M12 = B[0] * W[1] + B[1] * W[3]
    M21 = B[2] * W[0] + B[3] * W[2]
    M22 = B[2] * W[1] + B[3] * W[3]
  }

  // Autovettore di Bloch M·v = λ·v, λ = e^{ika}
  const lamRe = Math.cos(k * a)
  const lamIm = Math.sin(k * a)
  const n1 = M12 * M12 + (lamRe - M11) * (lamRe - M11) + lamIm * lamIm
  const n2 = (lamRe - M22) * (lamRe - M22) + lamIm * lamIm + M21 * M21

  let psi0Re: number, psi0Im: number, dpsi0Re: number, dpsi0Im: number
  if (Math.max(n1, n2) < 1e-18) {
    // Punto degenere a gap chiuso (es. P = 0 al bordo): onda piana
    const alpha = Math.sqrt(Math.max(0, E) / HBAR2_OVER_2M0)
    psi0Re = 1
    psi0Im = 0
    dpsi0Re = 0
    dpsi0Im = (k >= 0 ? 1 : -1) * alpha
  } else if (n1 >= n2) {
    psi0Re = M12
    psi0Im = 0
    dpsi0Re = lamRe - M11
    dpsi0Im = lamIm
  } else {
    psi0Re = lamRe - M22
    psi0Im = lamIm
    dpsi0Re = M21
    dpsi0Im = 0
  }

  // Valore di ψ(b) e ψ'(b) all'ingresso della barriera (nel caso rettangolare)
  const psiBRe = W[0] * psi0Re + W[1] * dpsi0Re
  const psiBIm = W[0] * psi0Im + W[1] * dpsi0Im
  const dpsiBRe = W[2] * psi0Re + W[3] * dpsi0Re
  const dpsiBIm = W[2] * psi0Im + W[3] * dpsi0Im

  const evalAbs2AtR = (r: number): number => {
    if (r <= b || c === 0) {
      const T = flatTransfer(r, E)
      const re = T[0] * psi0Re + T[1] * dpsi0Re
      const im = T[0] * psi0Im + T[1] * dpsi0Im
      return re * re + im * im
    }
    const T = flatTransfer(r - b, E - v0)
    const re = T[0] * psiBRe + T[1] * dpsiBRe
    const im = T[0] * psiBIm + T[1] * dpsiBIm
    return re * re + im * im
  }

  // Normalizzazione a media 1 su una cella [0, a] (regola del punto medio)
  const nNorm = 240
  let sum = 0
  for (let i = 0; i < nNorm; i++) {
    sum += evalAbs2AtR(((i + 0.5) * a) / nNorm)
  }
  const mean = sum / nNorm
  const invMean = mean > 0 ? 1 / mean : 1

  const out = new Float64Array(xs.length)
  const shift = 0.5 * b
  for (let i = 0; i < xs.length; i++) {
    const xShift = xs[i] + shift
    let r = xShift % a
    if (r < 0) r += a
    out[i] = evalAbs2AtR(r) * invMean
  }
  return out
}

export interface LCurveSample {
  readonly energy: number
  readonly L: number
}

/**
 * Campiona L(E) su [eStart, eEnd] fondendo una griglia uniforme con infittimento
 * dentro ciascuna banda trovata: garantisce che anche bande strettissime
 * tocchino esattamente L = ±1 sul grafico di L(E).
 */
export function sampleKronigConditionCurve(
  spec: KronigPenneySpec,
  eStart: number,
  eEnd: number,
  edges: readonly KronigBandEdge[],
  uniformCount = 240
): readonly LCurveSample[] {
  const lo = Math.max(0, eStart)
  const hi = Math.max(lo + 1e-6, eEnd)
  const energies: number[] = []
  for (let i = 0; i <= uniformCount; i++) {
    energies.push(lo + ((hi - lo) * i) / uniformCount)
  }
  for (const ed of edges) {
    if (ed.lower > hi) break
    const a = Math.max(lo, ed.lower)
    const b = Math.min(hi, ed.upper)
    if (b < a) continue
    const inner = 8
    for (let j = 0; j <= inner; j++) {
      energies.push(a + ((b - a) * j) / inner)
    }
  }
  energies.sort((x, y) => x - y)
  const out: LCurveSample[] = []
  const eps = 1e-9 * (hi - lo)
  for (const E of energies) {
    if (out.length > 0 && E - out[out.length - 1].energy <= eps) continue
    out.push({ energy: E, L: kronigPenneyL(spec, E) })
  }
  return out
}

/**
 * Data un'energia E (eV) dentro una delle bande `edges`, restituisce l'indice
 * di banda e |k|/(π/a) ∈ [0, 1] tramite cos(ka) = L(E); null se E è in un gap.
 */
export function kronigPenneyStateFromEnergy(
  spec: KronigPenneySpec,
  energy: number,
  edges: readonly KronigBandEdge[]
): { readonly band: number; readonly kFracAbs: number } | null {
  for (let b = 0; b < edges.length; b++) {
    const ed = edges[b]
    if (energy >= ed.lower - 1e-9 && energy <= ed.upper + 1e-9) {
      const clampedE = Math.max(ed.lower, Math.min(ed.upper, energy))
      const L = Math.max(-1, Math.min(1, kronigPenneyL(spec, clampedE)))
      const kFracAbs = Math.acos(L) / Math.PI
      return { band: b, kFracAbs }
    }
  }
  return null
}
