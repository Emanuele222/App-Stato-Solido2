/**
 * Riempimento delle bande (P4 §5.6 «Il riempimento delle bande»): ogni banda
 * contiene 2 elettroni per cella primitiva (N valori di k × 2 spin). Dato il
 * numero di elettroni per cella si trovano il livello di Fermi e se il sistema
 * è metallo o isolante:
 *  - numero dispari → almeno una banda piena a metà → metallo;
 *  - numero pari → isolante solo se c'è un gap assoluto tra l'ultima banda
 *    piena e la successiva (min della superiore > max dell'inferiore).
 */
import type { BandStructure } from './bandStructure'

export interface BandFillingOptions {
  /** Sotto questa ampiezza (eV) il gap si considera chiuso. Default 1e-6 eV. */
  readonly gapTolerance?: number
}

export interface BandFilling {
  readonly electronsPerCell: number
  readonly kind: 'metal' | 'insulator'
  /**
   * Livello di Fermi (eV). Isolante: a metà del gap (convenzione; a T = 0 è
   * qualunque energia nel gap). Metallo: tra l'ultimo livello occupato e il
   * primo vuoto del campionamento.
   */
  readonly fermiLevel: number
  /** E_g = min(prima banda vuota) − max(ultima banda piena), solo per l'isolante; altrimenti null. */
  readonly gap: number | null
  /** Frazione di riempimento di ogni banda (0…1), nell'ordine di `energies`. */
  readonly occupations: Float64Array
  /** Energia massima occupata (eV). */
  readonly highestOccupied: number
  /** Energia minima non occupata (eV). */
  readonly lowestUnoccupied: number
}

/**
 * Riempie le bande con `electronsPerCell` elettroni per cella (intero ≥ 1).
 * Richiede un cammino che campiona l'intera zona (`path.weights`, ad es. da
 * `zonePath1D`) e almeno ⌊N/2⌋ + 1 bande.
 */
export function fillBands(
  bands: BandStructure,
  electronsPerCell: number,
  options: BandFillingOptions = {}
): BandFilling {
  const weights = bands.path.weights
  if (!weights) throw new Error('fillBands: il cammino non campiona la zona (mancano i pesi)')
  const N = electronsPerCell
  if (!Number.isInteger(N) || N < 1) throw new RangeError(`elettroni per cella non validi: ${N}`)
  const nBands = bands.energies.length
  if (nBands < Math.floor(N / 2) + 1) {
    throw new RangeError(`servono almeno ${Math.floor(N / 2) + 1} bande per ${N} elettroni per cella`)
  }
  const tol = options.gapTolerance ?? 1e-6
  const nk = weights.length

  // Isolante: N pari e gap assoluto tra la banda N/2 e la N/2 + 1.
  if (N % 2 === 0) {
    const top = max(bands.energies[N / 2 - 1])
    const bottom = min(bands.energies[N / 2])
    if (bottom - top > tol) {
      const occupations = new Float64Array(nBands)
      occupations.fill(1, 0, N / 2)
      return {
        electronsPerCell: N,
        kind: 'insulator',
        fermiLevel: 0.5 * (top + bottom),
        gap: bottom - top,
        occupations,
        highestOccupied: top,
        lowestUnoccupied: bottom
      }
    }
  }

  // Metallo: si occupano i livelli (n, k) dal basso, 2·w_k elettroni ciascuno.
  const levels: { e: number; w: number; band: number }[] = []
  for (let n = 0; n < nBands; n++) {
    for (let i = 0; i < nk; i++) if (weights[i] > 0) levels.push({ e: bands.energies[n][i], w: weights[i], band: n })
  }
  levels.sort((p, q) => p.e - q.e || p.band - q.band)
  const occupations = new Float64Array(nBands)
  let remaining = N
  let last = -1
  for (let i = 0; i < levels.length && remaining > 1e-12; i++) {
    const take = Math.min(2 * levels[i].w, remaining)
    occupations[levels[i].band] += take / 2 // una banda piena = 2 elettroni per cella
    remaining -= take
    last = i
  }
  const highestOccupied = levels[last].e
  const lowestUnoccupied = last + 1 < levels.length ? levels[last + 1].e : Number.POSITIVE_INFINITY
  return {
    electronsPerCell: N,
    kind: 'metal',
    fermiLevel: 0.5 * (highestOccupied + lowestUnoccupied),
    gap: null,
    occupations,
    highestOccupied,
    lowestUnoccupied
  }
}

function max(values: Float64Array): number {
  let m = Number.NEGATIVE_INFINITY
  for (const v of values) if (v > m) m = v
  return m
}

function min(values: Float64Array): number {
  let m = Number.POSITIVE_INFINITY
  for (const v of values) if (v < m) m = v
  return m
}
