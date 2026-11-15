/**
 * Grandezze semiclassiche da una banda E(k) qualunque (P3 §13; formulario
 * «Velocità» e «Massa efficace»), con derivate per differenze finite centrate.
 * Le funzioni accettano una E(k) generica: valgono per ogni metodo.
 * Unità: k in Å⁻¹, E in eV.
 */
import { ANGSTROM_IN_M, HBAR2_OVER_M0, HBAR_EV_S } from './constants'

/** Una banda come funzione: k (Å⁻¹) → E (eV). */
export type EnergyFunction = (k: number) => number

/** Passo di default delle differenze finite (Å⁻¹). */
export const DEFAULT_K_STEP = 1e-4

/** dE/dk in eV·Å (differenza centrata). */
export function bandSlope(energy: EnergyFunction, k: number, h: number = DEFAULT_K_STEP): number {
  checkStep(h)
  return (energy(k + h) - energy(k - h)) / (2 * h)
}

/** d²E/dk² in eV·Å² (differenza seconda centrata). */
export function bandCurvature(energy: EnergyFunction, k: number, h: number = DEFAULT_K_STEP): number {
  checkStep(h)
  return (energy(k + h) - 2 * energy(k) + energy(k - h)) / (h * h)
}

/** Velocità di gruppo v = (1/ħ)·dE/dk, in m/s. */
export function groupVelocity(energy: EnergyFunction, k: number, h: number = DEFAULT_K_STEP): number {
  // eV·Å / (eV·s) = Å/s
  return (bandSlope(energy, k, h) / HBAR_EV_S) * ANGSTROM_IN_M
}

/**
 * m₀/m* = (d²E/dk²)/(ħ²/m₀): inverso della massa efficace in unità di m₀.
 * È la grandezza regolare (si annulla nei flessi, dove m* diverge).
 */
export function inverseEffectiveMassRatio(
  energy: EnergyFunction,
  k: number,
  h: number = DEFAULT_K_STEP
): number {
  return bandCurvature(energy, k, h) / HBAR2_OVER_M0
}

/**
 * m* / m₀ = (ħ²/m₀)/(d²E/dk²). Negativa dove la banda è concava (cima di banda);
 * ±Infinity in un flesso.
 */
export function effectiveMassRatio(energy: EnergyFunction, k: number, h: number = DEFAULT_K_STEP): number {
  return 1 / inverseEffectiveMassRatio(energy, k, h)
}

function checkStep(h: number): void {
  if (!(h > 0) || !Number.isFinite(h)) throw new RangeError(`passo di derivazione non valido: ${h}`)
}

/** Soglia su |m* / m₀| oltre la quale la curvatura è nulla nei limiti numerici (flesso: m* → ∞). */
export const EFFECTIVE_MASS_DIVERGENCE_THRESHOLD = 1e4

/** Vero se m* / m₀ non è finito oppure |m* / m₀| ≥ EFFECTIVE_MASS_DIVERGENCE_THRESHOLD. */
export function isEffectiveMassDivergent(massRatio: number): boolean {
  return !Number.isFinite(massRatio) || Math.abs(massRatio) >= EFFECTIVE_MASS_DIVERGENCE_THRESHOLD
}

/** Curvatura d²E/dk² (in eV·Å²) corrispondente a un dato rapporto inverso m₀/m*. */
export function curvatureFromInverseMassRatio(invMassRatio: number): number {
  return HBAR2_OVER_M0 * invMassRatio
}
