/**
 * Gap diretti delle bande 1D calcolate con l'equazione centrale.
 * Dispensa P3 §11.4 («Il gap dal calcolo»): al bordo di zona k = ±π/a il gap
 * fra la prima e la seconda banda è 2|V_G|; per k = ±nπ/a è 2|V_nG|, quindi
 * il secondo gap (n = 2) cade in k = 0 del ridotto (2π/a ≡ 0) ed è ≃ 2|V_2G|.
 */
import { solveCentralEquation1D, type PeriodicPotential1D } from './centralEquation1d'

export interface DirectGap {
  /** Punto k (Å⁻¹) in cui si misura il gap. */
  readonly k: number
  /** Indice della banda inferiore (0 = la più bassa); la superiore è `lowerBand + 1`. */
  readonly lowerBand: number
  /** E_lowerBand(k), in eV. */
  readonly lower: number
  /** E_{lowerBand+1}(k), in eV. */
  readonly upper: number
  /** upper − lower, in eV (≥ 0). */
  readonly width: number
}

/**
 * Separazione verticale fra le bande `lowerBand` e `lowerBand + 1` nel punto k.
 * In 1D, per i quasi liberi, massimo della banda inferiore e minimo della
 * superiore cadono nello stesso k (P3 §11.5, «il gap è un intervallo proibito
 * per ogni k»): in π/a e in 0 questa separazione è il gap E_g.
 */
export function directGap1D(
  potential: PeriodicPotential1D,
  k: number,
  lowerBand: number,
  options: { readonly planeWaves: number }
): DirectGap {
  if (!Number.isInteger(lowerBand) || lowerBand < 0 || lowerBand + 1 >= options.planeWaves) {
    throw new RangeError(`indice di banda fuori intervallo: ${lowerBand}`)
  }
  const { energies } = solveCentralEquation1D(potential, k, {
    planeWaves: options.planeWaves,
    coefficients: false
  })
  const lower = energies[lowerBand]
  const upper = energies[lowerBand + 1]
  return { k, lowerBand, lower, upper, width: upper - lower }
}
