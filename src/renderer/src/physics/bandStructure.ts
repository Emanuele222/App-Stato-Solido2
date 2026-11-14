/**
 * Tipo comune per le strutture a bande di tutti i metodi (reticolo vuoto,
 * quasi liberi, Kronig–Penney, legami forti, k·p, pseudopotenziale): un cammino
 * in k e le energie per banda. Due BandStructure sullo stesso KPath si possono
 * sovrapporre nello stesso grafico (strumento «Confronto»).
 */

/** Vettore d'onda cartesiano in Å⁻¹. In 1D si usa [k, 0, 0]. */
export type KVector = readonly [number, number, number]

/** Etichetta di un punto notevole del cammino (es. 'Γ', 'X', 'π/a'). */
export interface KPathLabel {
  /** Indice del punto in `points`. */
  readonly index: number
  readonly label: string
}

export interface KPath {
  readonly dimension: 1 | 2 | 3
  /** Punti del cammino, in ordine, in Å⁻¹. */
  readonly points: readonly KVector[]
  /** Ascissa del grafico: lunghezza d'arco cumulata lungo il cammino (Å⁻¹), parte da 0. */
  readonly distance: Float64Array
  readonly labels: readonly KPathLabel[]
  /**
   * Pesi di campionamento della zona di Brillouin (somma 1), presenti solo se il
   * cammino campiona uniformemente un'intera zona (in 1D: da −π/a a π/a).
   * Servono al riempimento delle bande.
   */
  readonly weights?: Float64Array
}

/** Metodo che ha prodotto le bande. */
export type BandMethod =
  | 'empty-lattice'
  | 'nearly-free'
  | 'kronig-penney'
  | 'tight-binding'
  | 'k-dot-p'
  | 'pseudopotential'

/**
 * Struttura a bande. `S` è il tipo dell'autostato, specifico del metodo
 * (onde piane per i quasi liberi, orbitali per i legami forti…); `states` c'è
 * solo se richiesto al calcolo.
 */
export interface BandStructure<S = unknown> {
  readonly method: BandMethod
  readonly path: KPath
  /** energies[n][i] = E_n(k_i) in eV; n = 0 è la banda più bassa. */
  readonly energies: readonly Float64Array[]
  /** states[i] = autostati nel punto k_i (tutte le bande), se richiesti. */
  readonly states?: readonly S[]
}

/** Vertice di un cammino a tratti. */
export interface KPathVertex {
  readonly label: string
  readonly k: KVector
}

/**
 * Cammino a tratti rettilinei tra punti notevoli (es. L–Γ–X in 3D).
 * `pointsPerSegment` punti per tratto, estremo iniziale incluso; l'ultimo
 * vertice è aggiunto in fondo. I vertici non sono duplicati.
 */
export function kPathFromVertices(
  vertices: readonly KPathVertex[],
  pointsPerSegment: number,
  dimension: 1 | 2 | 3
): KPath {
  if (vertices.length < 2) throw new RangeError('servono almeno due vertici')
  if (!Number.isInteger(pointsPerSegment) || pointsPerSegment < 1) {
    throw new RangeError(`pointsPerSegment non valido: ${pointsPerSegment}`)
  }
  const points: KVector[] = []
  const labels: KPathLabel[] = []
  for (let s = 0; s < vertices.length - 1; s++) {
    const from = vertices[s].k
    const to = vertices[s + 1].k
    labels.push({ index: points.length, label: vertices[s].label })
    for (let i = 0; i < pointsPerSegment; i++) {
      const t = i / pointsPerSegment
      points.push([
        from[0] + t * (to[0] - from[0]),
        from[1] + t * (to[1] - from[1]),
        from[2] + t * (to[2] - from[2])
      ])
    }
  }
  const last = vertices[vertices.length - 1]
  labels.push({ index: points.length, label: last.label })
  points.push([last.k[0], last.k[1], last.k[2]])
  return { dimension, points, distance: cumulativeDistance(points), labels }
}

/**
 * Prima zona di Brillouin in 1D, −π/a ≤ k ≤ π/a, con `nPoints` punti
 * equispaziati (dispari, così k = 0 è incluso). I pesi (regola dei trapezi,
 * metà peso ai due estremi equivalenti) sommano a 1.
 */
export function zonePath1D(a: number, nPoints: number): KPath {
  if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`)
  if (!Number.isInteger(nPoints) || nPoints < 3 || nPoints % 2 === 0) {
    throw new RangeError(`nPoints deve essere un intero dispari ≥ 3: ${nPoints}`)
  }
  const kMax = Math.PI / a
  const intervals = nPoints - 1
  const points: KVector[] = []
  const weights = new Float64Array(nPoints)
  for (let i = 0; i < nPoints; i++) {
    // L'indice centrale dà esattamente k = 0.
    const k = i === intervals / 2 ? 0 : -kMax + (2 * kMax * i) / intervals
    points.push([k, 0, 0])
    weights[i] = (i === 0 || i === intervals ? 0.5 : 1) / intervals
  }
  // Estremi esatti (evita k = π/a·(1 − 1e-16)).
  points[0] = [-kMax, 0, 0]
  points[intervals] = [kMax, 0, 0]
  return {
    dimension: 1,
    points,
    distance: cumulativeDistance(points),
    labels: [
      { index: 0, label: '−π/a' },
      { index: intervals / 2, label: '0' },
      { index: intervals, label: 'π/a' }
    ],
    weights
  }
}

/** Numero di bande di una struttura. */
export function bandCount(bands: BandStructure): number {
  return bands.energies.length
}

function cumulativeDistance(points: readonly KVector[]): Float64Array {
  const distance = new Float64Array(points.length)
  for (let i = 1; i < points.length; i++) {
    const p = points[i]
    const q = points[i - 1]
    distance[i] = distance[i - 1] + Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
  }
  return distance
}
