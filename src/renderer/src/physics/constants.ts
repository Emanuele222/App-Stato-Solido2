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

/**
 * ħ in eV·s (CODATA 2018, 6,582119569·10⁻¹⁶). Serve solo per convertire
 * v = (1/ħ)·dE/dk in m/s; è coerente con ħ²/2m₀ = 3,80998 eV·Å² entro 1 su 10⁶.
 */
export const HBAR_EV_S = 6.582119569e-16

/** 1 Å in metri. */
export const ANGSTROM_IN_M = 1e-10
