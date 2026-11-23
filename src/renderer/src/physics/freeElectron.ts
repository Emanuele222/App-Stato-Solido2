/**
 * Formule chiuse dell'elettrone libero e del modello a due onde
 * (dispensa P3 §11 e formulario «Elettroni quasi liberi»). Unità: Å, eV.
 */
import type { BandStructure, KPath } from './bandStructure'
import { HBAR2_OVER_2M0 } from './constants'

/** Parabola libera E_k = ħ²k²/2m₀ (eV), k in Å⁻¹. */
export function freeElectronEnergy(k: number): number {
  return HBAR2_OVER_2M0 * k * k
}

/** Energia libera al bordo di zona E₀ = ħ²π²/2m₀a² (eV), a in Å (P3 §11.4). */
export function zoneBoundaryEnergy(a: number): number {
  if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`)
  return freeElectronEnergy(Math.PI / a)
}

/** Modulo del vettore reciproco più corto, G = 2π/a (Å⁻¹). */
export function reciprocalVector1D(a: number): number {
  if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`)
  return (2 * Math.PI) / a
}

/**
 * Reticolo vuoto (zona ridotta): le `nBands` energie più basse fra
 * E = ħ²(k+G)²/2m₀, G = 2πn/a, in ordine crescente (P3 formulario «Zona ridotta»).
 */
export function emptyLatticeEnergies(k: number, a: number, nBands: number): Float64Array {
  if (!Number.isInteger(nBands) || nBands < 1) throw new RangeError(`nBands non valido: ${nBands}`)
  const G = reciprocalVector1D(a)
  const n0 = -Math.round(k / G)
  const values: number[] = []
  for (let n = n0 - nBands; n <= n0 + nBands; n++) values.push(freeElectronEnergy(k + n * G))
  values.sort((x, y) => x - y)
  return Float64Array.from(values.slice(0, nBands))
}

/**
 * Reticolo vuoto lungo un cammino 1D, in forma chiusa (zona ridotta): stesse
 * energie di `nearlyFreeBands` con potenziale nullo, senza diagonalizzare.
 * Serve allo strumento «Confronto» (P3 §11.5: per V_G → 0 si hanno le parabole libere).
 */
export function emptyLatticeBands(a: number, path: KPath, nBands: number): BandStructure<never> {
  if (path.dimension !== 1) throw new RangeError('emptyLatticeBands: serve un cammino 1D')
  const energies = Array.from({ length: nBands }, () => new Float64Array(path.points.length))
  path.points.forEach((point, i) => {
    const e = emptyLatticeEnergies(point[0], a, nBands)
    for (let n = 0; n < nBands; n++) energies[n][i] = e[n]
  })
  return { method: 'empty-lattice', path, energies }
}

export interface TwoWaveEnergies {
  /** Banda inferiore, E₋. */
  readonly lower: number
  /** Banda superiore, E₊ (sempre la più alta). */
  readonly upper: number
}

/**
 * Modello a due onde (P3 eq. dueonde; formulario «Due onde, k′ = k − G»):
 * E± = ½(E_k + E_k′) ± [¼(E_k′ − E_k)² + V_G²]^½.
 * `kPrime` è l'onda partner (di solito k − G con G = 2π/a, per k vicino a π/a);
 * `vG` è il coefficiente che accoppia le due onde (eV, con segno: conta solo |V_G|).
 */
export function twoWaveEnergies(k: number, kPrime: number, vG: number): TwoWaveEnergies {
  const ek = freeElectronEnergy(k)
  const ekp = freeElectronEnergy(kPrime)
  const mean = 0.5 * (ek + ekp)
  const half = 0.5 * (ekp - ek)
  const root = Math.sqrt(half * half + vG * vG)
  return { lower: mean - root, upper: mean + root }
}

export interface FccFermiSphere {
  /** Densità elettronica n = N · 4 / a³ (Å⁻³). */
  readonly densityAng3: number
  /** Vettore d'onda di Fermi k_F (Å⁻¹). */
  readonly kFAngInv: number
  /** Vettore d'onda di Fermi in unità di 2π/a. */
  readonly kFDimless: number
  /** Energia di Fermi E_F = ħ²k_F² / 2m₀ (eV) sopra il fondo della banda. */
  readonly eFEv: number
}

/**
 * Sfera di Fermi del gas di elettroni liberi su reticolo fcc (4 celle primitive per
 * cubo di lato a, quindi n = electronsPerCell · 4 / a³). Usata per l'alluminio
 * (P4 §5.2, r. 1384–1396: a = 4,05 Å, N = 3 → k_F = 1,75 Å⁻¹, E_F = 11,65 eV;
 * N = 1 → k_F′ = 0,78 (2π/a), E_F′ = 5,6 eV).
 */
export function fccFreeElectronFermiSphere(a: number, electronsPerCell: number): FccFermiSphere {
  if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`)
  if (!(electronsPerCell > 0)) throw new RangeError(`numero di elettroni non valido: ${electronsPerCell}`)
  const densityAng3 = (electronsPerCell * 4) / (a * a * a)
  const kFAngInv = Math.cbrt(3 * Math.PI * Math.PI * densityAng3)
  const kFDimless = kFAngInv / ((2 * Math.PI) / a)
  const eFEv = freeElectronEnergy(kFAngInv)
  return { densityAng3, kFAngInv, kFDimless, eFEv }
}
