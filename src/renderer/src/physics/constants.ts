/**
 * Costanti fisiche: unico file dell'app che le definisce.
 * Unità di lavoro: lunghezze in Å, numeri d'onda in Å⁻¹, energie in eV.
 */

/** ħ²/2m₀ in eV·Å² (progetto.md «Notazione»; dispensa P3 formulario, «Scatola 1D»: 3,81). */
export const HBAR2_OVER_2M0 = 3.80998

/** ħ²/m₀ in eV·Å² (= 2 · ħ²/2m₀). */
export const HBAR2_OVER_M0 = 2 * HBAR2_OVER_2M0

/** Rydberg in eV (progetto.md «Notazione»). */
export const RYDBERG_EV = 13.6057

/** Converte un'energia in Rydberg nella scala in eV. */
export function rydbergToEv(energyRy: number): number {
  return energyRy * RYDBERG_EV
}

/**
 * ħ in eV·s (CODATA 2018, 6,582119569·10⁻¹⁶). Serve solo per convertire
 * v = (1/ħ)·dE/dk in m/s; è coerente con ħ²/2m₀ = 3,80998 eV·Å² entro 1 su 10⁶.
 */
export const HBAR_EV_S = 6.582119569e-16

/** 1 Å in metri. */
export const ANGSTROM_IN_M = 1e-10

// --- Costanti SI e fononiche (CODATA 2018, dispensa Parte 6) ---

/** ħ in J·s (CODATA 2018). */
export const HBAR_J_S = 1.054571817e-34

/** Costante di Boltzmann k_B in J·K⁻¹ (CODATA 2018, valore esatto SI). */
export const KB_J_K = 1.380649e-23

/** Costante di Boltzmann k_B in eV·K⁻¹ (CODATA 2018). */
export const KB_EV_K = 8.617333262e-5

/** Unità di massa atomica (1 u) in kg (CODATA 2018). */
export const AMU_KG = 1.6605390666e-27

/** Costante di Avogadro N_A in mol⁻¹ (CODATA 2018, valore esatto SI). */
export const NA_MOL = 6.02214076e23

/** Costante dei gas perfetti R = N_A · k_B in J·mol⁻¹·K⁻¹ (≈ 8,31446). */
export const R_GAS = NA_MOL * KB_J_K

/** Velocità della luce nel vuoto c in m·s⁻¹ (valore esatto SI). */
export const C_LIGHT_M_S = 2.99792458e8

/** Conversione da frequenza ν (THz) a energia ħω = hν (meV): 1 THz ↔ 4,13567 meV. */
export const THZ_TO_MEV = 4.135667696

/** Conversione da pulsazione ω (rad·s⁻¹) a frequenza ν = ω / (2π) in THz. */
export const RAD_S_TO_THZ = 1 / (2 * Math.PI * 1e12)

/** Converte una pulsazione ω (rad·s⁻¹) in frequenza ν (THz). */
export function radSToThz(omegaRadS: number): number {
  return omegaRadS * RAD_S_TO_THZ
}

/** Converte una pulsazione ω (rad·s⁻¹) in energia fononica ħω (meV). */
export function radSToMev(omegaRadS: number): number {
  return omegaRadS * RAD_S_TO_THZ * THZ_TO_MEV
}

/** Converte una frequenza ν (THz) in energia ħω = hν (meV). */
export function thzToMev(freqThz: number): number {
  return freqThz * THZ_TO_MEV
}

/** Converte un'energia ħω (meV) in frequenza ν = ħω / h (THz). */
export function mevToThz(energyMev: number): number {
  return energyMev / THZ_TO_MEV
}

/** Converte una massa atomica in u.m.a. in kg. */
export function amuToKg(massAmu: number): number {
  return massAmu * AMU_KG
}
