import { describe, expect, it } from 'vitest'
import {
  AMU_KG,
  C_LIGHT_M_S,
  HBAR_EV_S,
  HBAR_J_S,
  KB_EV_K,
  KB_J_K,
  NA_MOL,
  RAD_S_TO_THZ,
  R_GAS,
  THZ_TO_MEV,
  amuToKg,
  mevToThz,
  radSToMev,
  radSToThz,
  thzToMev
} from './constants'

describe('physics/constants: costanti SI e fononiche (Parte 6)', () => {
  it('verifica la coerenza CODATA 2018 tra ħ, k_B, R e conversioni THz/meV', () => {
    // Carica elementare e = ħ_J / ħ_eV = k_B_J / k_B_eV ≈ 1,602176634e-19 C
    const eFromHbar = HBAR_J_S / HBAR_EV_S
    const eFromKb = KB_J_K / KB_EV_K
    expect(eFromHbar).toBeCloseTo(1.602176634e-19, 27)
    expect(eFromKb).toBeCloseTo(eFromHbar, 26)

    // Costante dei gas R = N_A k_B ≈ 8,31446 J/(mol·K), Dulong-Petit 3R ≈ 24,943
    expect(R_GAS).toBeCloseTo(8.314462618, 6)
    expect(3 * R_GAS).toBeCloseTo(24.94338785, 5)

    // 1 THz ↔ 4,13567 meV = h · 10^12 / e · 10^3
    const hEvS = 2 * Math.PI * HBAR_EV_S
    expect(THZ_TO_MEV).toBeCloseTo(hEvS * 1e15, 7)

    // Velocità della luce e costante di Avogadro esatte SI
    expect(C_LIGHT_M_S).toBe(299792458)
    expect(NA_MOL).toBe(6.02214076e23)
    expect(AMU_KG).toBeCloseTo(1.6605390666e-27, 36)
  })

  it('riproduce i fattori di conversione numerici della dispensa Parte 6', () => {
    // Metallo tipico §3: ω_max ≈ 2,76e13 rad/s → ν ≈ 4,39 THz, ħω ≈ 18,2 meV
    const omegaMax = 2 * Math.sqrt(20 / 1.05e-25)
    expect(radSToThz(omegaMax)).toBeCloseTo(4.394, 2)
    expect(radSToMev(omegaMax)).toBeCloseTo(18.17, 1)

    // Coerenza inversa delle funzioni helper
    expect(mevToThz(thzToMev(4.7))).toBeCloseTo(4.7, 12)
    expect(radSToThz(2 * Math.PI * 1e12)).toBeCloseTo(1, 12)
    expect(RAD_S_TO_THZ * 2 * Math.PI * 1e12).toBeCloseTo(1, 12)
    // Na (23 u) ≈ 3,82e-26 kg (§8)
    expect(amuToKg(23)).toBeCloseTo(3.81924e-26, 30)
  })
})
