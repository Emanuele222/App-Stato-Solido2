import { describe, expect, it } from 'vitest'
import { C_LIGHT_M_S, HBAR_J_S, KB_J_K } from './constants'
import {
  DEBYE_T3_PREFACTOR,
  MATERIAL_PRESETS,
  PHONON_TO_PHOTON_POLARIZATION_FACTOR,
  THREE_R,
  boseEinsteinOccupancy,
  debyeCv,
  debyeCvRatio,
  debyeDosDimless,
  debyeEnergyIntegral,
  debyeFreqThz,
  debyeHighTAsymptote,
  debyeIntegralD3,
  debyeLowTCv,
  debyeLowTCvRatio,
  debyeOmegaRadS,
  debyeSpectralContribution,
  debyeThermalEnergyMolarJ,
  debyeThermalSphereRadiusFraction,
  dulongPetitCv,
  einsteinCv,
  einsteinCvRatio,
  einsteinFunction,
  einsteinHighTAsymptote,
  einsteinLowTAsymptote,
  fermiDiracOccupancy,
  maxwellBoltzmannOccupancy,
  monatomic1DCvRatio,
  monatomicDos1DDimless,
  phononBlackBodyEnergyDensity,
  photonBlackBodyEnergyDensity,
  specificHeatSummary
} from './specificHeat'

describe('specificHeat — Dulong–Petit, Einstein, Debye, DOS e corpo nero (Parte 6 Lezione 4)', () => {
  it('verifica Dulong–Petit 3R ≈ 24,943 J/(mol·K) e la funzione di Einstein ℰ(x) senza overflow né cancellazione', () => {
    expect(THREE_R).toBeCloseTo(24.943387, 5)
    expect(dulongPetitCv()).toBeCloseTo(24.943387, 5)

    // Limite x → 0⁺: Taylor 1 - x²/12 + x⁴/240
    expect(einsteinFunction(0)).toBe(1)
    expect(einsteinFunction(1e-6)).toBeCloseTo(1 - 1e-12 / 12, 15)
    expect(einsteinFunction(1e-4)).toBeCloseTo(1 - 1e-8 / 12 + 1e-16 / 240, 14)

    // Limite x grande: nessuna NaN/Infinity, cade come x² e^(-x)
    expect(einsteinFunction(50)).toBeCloseTo(2500 * Math.exp(-50), 25)
    expect(einsteinFunction(600)).toBeCloseTo(360000 * Math.exp(-600), 300)
    expect(Number.isFinite(einsteinFunction(1000))).toBe(true)
    expect(einsteinFunction(1000)).toBe(0)

    // Asintoti alta e bassa T di Einstein (§21.4–21.5)
    const thetaE = 300
    expect(einsteinCv(15000, thetaE)).toBeCloseTo(einsteinHighTAsymptote(15000, thetaE), 7)
    expect(einsteinCv(15, thetaE)).toBeCloseTo(einsteinLowTAsymptote(15, thetaE), 8)
  })

  it('calcola l’integrale di Debye D₃(u) con Gauss–Legendre composita su tutti i regimi (u ≪ 1 e u ≫ 1)', () => {
    // Limite u → 0⁺: 1 - u²/20 + u⁴/560
    expect(debyeIntegralD3(0)).toBe(1)
    expect(debyeIntegralD3(1e-4)).toBeCloseTo(1 - 1e-8 / 20, 14)
    expect(debyeIntegralD3(0.05)).toBeCloseTo(1 - 0.05 ** 2 / 20 + 0.05 ** 4 / 560, 10)

    // Alta T: asintoto 3R[1 - (1/20)(Θ_D/T)²] (§22.6)
    expect(debyeCv(1500, 300)).toBeCloseTo(debyeHighTAsymptote(1500, 300), 3)
    expect(debyeCv(15000, 300)).toBeCloseTo(debyeHighTAsymptote(15000, 300), 7)

    // Bassa T (T = Θ_D / 50, u = 50): D₃(u) → 4π⁴ / (5 u³) a precisione altissima
    const u50 = 50
    const expectedD3 = (4 * Math.PI ** 4) / (5 * u50 ** 3)
    expect(debyeIntegralD3(u50)).toBeCloseTo(expectedD3, 12)

    // Regime estremo dell'interfaccia: T = 5 K, Θ_D = 2500 K (u = 500)
    const u500 = 500
    expect(debyeIntegralD3(u500)).toBeCloseTo((4 * Math.PI ** 4) / (5 * u500 ** 3), 14)
    expect(debyeCv(5, 2500)).toBeCloseTo(debyeLowTCv(5, 2500), 10)

    // Verifica coerenza U_term vs derivata numerica (∂U_term/∂T)_V = C_V^D(T) (eq. 58)
    const T = 180
    const thetaD = 343
    const h = 1e-3
    const dUdT =
      (debyeThermalEnergyMolarJ(T + h, thetaD) - debyeThermalEnergyMolarJ(T - h, thetaD)) / (2 * h)
    expect(dUdT).toBeCloseTo(debyeCv(T, thetaD), 7)

    // Verifica limite bassa T energia: U_term → (3π⁴/5) R T⁴ / Θ_D³
    const uLarge = 100
    expect(debyeEnergyIntegral(uLarge)).toBeCloseTo((3 * (Math.PI ** 4 / 15)) / uLarge ** 3, 12)
  })

  it('riproduce il confronto Einstein vs Debye a T = Θ_D/10 e Θ_D/20 (§21.5 p. 53 e §22.7 p. 57)', () => {
    const theta = 1000
    const t10 = theta / 10
    const einstein10 = einsteinCvRatio(t10, theta)
    const debye10 = debyeCvRatio(t10, theta)
    const t3Asymp10 = debyeLowTCvRatio(t10, theta)

    // Dispensa §21.5: Einstein ≈ 4,54e-3, Debye ≈ 7,58e-2, rapporto ~ 16,7–17
    expect(einstein10).toBeCloseTo(4.54e-3, 4)
    expect(debye10).toBeCloseTo(7.58e-2, 3)
    expect(debye10 / einstein10).toBeGreaterThan(16.5)
    expect(debye10 / einstein10).toBeLessThan(17.1)

    // Dispensa §22.7: a T = Θ_D/10 la legge T³ sovrastima Debye di circa il 3%
    const relOverestimate = (t3Asymp10 - debye10) / debye10
    expect(relOverestimate).toBeCloseTo(0.03, 2)
    expect(DEBYE_T3_PREFACTOR).toBeCloseTo(233.78, 2)

    // A T = Θ_D/20 il rapporto Debye / Einstein sale a ~ 10⁴
    const t20 = theta / 20
    const ratio20 = debyeCvRatio(t20, theta) / einsteinCvRatio(t20, theta)
    expect(ratio20).toBeGreaterThan(8e3)
    expect(ratio20).toBeLessThan(1.5e4)
  })

  it('riproduce i valori Debye di Tab. 2 (77 K e 273 K) e il diamante a 77 K (§22.7, Tabb. 2–3)', () => {
    const byId = new Map(MATERIAL_PRESETS.map((m) => [m.id, m]))

    // Verifica tutti i 9 preset attesi
    expect(MATERIAL_PRESETS).toHaveLength(9)
    for (const id of ['copper', 'aluminum', 'silicon', 'diamond', 'iron', 'gold', 'sodium', 'lead', 'cesium']) {
      expect(byId.has(id)).toBe(true)
    }

    // Confronto con Tab. 2 (colonne "Debye" a 77 K e 273 K, entro 0,15 J/(mol·K) per arrotondamento a 1 decimale in tabella)
    for (const id of ['copper', 'aluminum', 'silicon', 'iron', 'gold', 'sodium', 'lead']) {
      const m = byId.get(id)!
      expect(m.dispensaTab2Debye).toBeDefined()
      expect(debyeCv(77, m.thetaDK)).toBeCloseTo(m.dispensaTab2Debye!.cv77K, 1)
      expect(debyeCv(273, m.thetaDK)).toBeCloseTo(m.dispensaTab2Debye!.cv273K, 1)
    }

    // Specifici richiesti dalla traccia:
    // Al (428 K -> 7,7 / 22,1), Cu (343 K -> 10,9 / 23,1), Si (645 K -> 3,1 / 19,2), Pb (105 K -> 22,8 / 24,8)
    expect(debyeCv(77, 428)).toBeCloseTo(7.7, 1)
    expect(debyeCv(273, 428)).toBeCloseTo(22.1, 1)
    expect(debyeCv(77, 343)).toBeCloseTo(10.9, 1)
    expect(debyeCv(273, 343)).toBeCloseTo(23.1, 1)
    expect(debyeCv(77, 645)).toBeCloseTo(3.1, 1)
    expect(debyeCv(273, 645)).toBeCloseTo(19.2, 1)
    expect(debyeCv(77, 105)).toBeCloseTo(22.8, 1)
    expect(debyeCv(273, 105)).toBeCloseTo(24.8, 1)

    // Diamante (2230 K -> ≈ 0,08 J/(mol·K) a 77 K)
    expect(debyeCv(77, 2230)).toBeCloseTo(0.08, 2)

    // Cu: ω_D ≈ 4,5·10¹³ s⁻¹ (§23.2 p. 58)
    expect(debyeOmegaRadS(343) / 1e13).toBeCloseTo(4.49, 2)
    expect(debyeFreqThz(343)).toBeCloseTo((KB_J_K * 343) / (HBAR_J_S * 2 * Math.PI * 1e12), 10)
  })

  it('verifica la normalizzazione della DOS di Debye, la DOS 1D con Van Hove, il raggio k_T/k_D e il corpo nero', () => {
    // Integrale della DOS adimensionale di Debye ∫₀¹ 3w² dw = 1 (equivale a ∫₀^{ω_D} g dω = N per polarizzazione)
    let sumDebye = 0
    const nSteps = 1000
    const dw = 1 / nSteps
    for (let i = 0; i < nSteps; i++) {
      const w = (i + 0.5) * dw
      sumDebye += debyeDosDimless(w) * dw
    }
    expect(sumDebye).toBeCloseTo(1, 5)
    expect(debyeDosDimless(1.01)).toBe(0)

    // Coerenza tra integrale spettrale ∫₀¹ 3w² ℰ(w Θ_D/T) dw e debyeCvRatio(T, Θ_D)
    const T = 120
    const thetaD = 343
    let specSum = 0
    for (let i = 0; i < nSteps; i++) {
      const w = (i + 0.5) * dw
      specSum += debyeSpectralContribution(w, T, thetaD) * dw
    }
    expect(specSum).toBeCloseTo(debyeCvRatio(T, thetaD), 4)

    // Raggio termico nella sfera di Debye
    expect(debyeThermalSphereRadiusFraction(77, 343)).toBeCloseTo(77 / 343, 12)
    expect(debyeThermalSphereRadiusFraction(500, 343)).toBe(1)

    // DOS 1D della catena monatomica: valore a ω=0 è 2/π, diverge a ω=ω_max (v_g → 0)
    expect(monatomicDos1DDimless(0)).toBeCloseTo(2 / Math.PI, 12)
    expect(monatomicDos1DDimless(0.999)).toBeGreaterThan(10)
    expect(monatomicDos1DDimless(1)).toBe(Infinity)

    // C_V 1D ha andamento lineare a bassa T: C_V^1D(T) / R → (2π/3) (T / Θ_max) per T ≪ Θ_max
    // perché ∫₀^∞ (2/π) ℰ(x) dx = (2/π)·(π²/3) = 2π/3 ≈ 2,0944
    const ratio1dLow = monatomic1DCvRatio(10, 1000)
    expect(ratio1dLow).toBeCloseTo(((2 * Math.PI) / 3) * (10 / 1000), 4)
    expect(monatomic1DCvRatio(5, 2500)).toBeCloseTo(((2 * Math.PI) / 3) * (5 / 2500), 5)
    expect(monatomic1DCvRatio(5, 2230)).toBeCloseTo(((2 * Math.PI) / 3) * (5 / 2230), 5)
    expect(monatomic1DCvRatio(5000, 100)).toBeCloseTo(1, 3)

    // Analogia corpo nero (§25, eq. 62): 3 polarizzazioni vs 2 polarizzazioni fotoniche → fattore 3/2
    const uPhAtC = phononBlackBodyEnergyDensity(300, C_LIGHT_M_S)
    const uGamma = photonBlackBodyEnergyDensity(300)
    expect(uPhAtC / uGamma).toBeCloseTo(PHONON_TO_PHOTON_POLARIZATION_FACTOR, 12)
    expect(PHONON_TO_PHOTON_POLARIZATION_FACTOR).toBe(1.5)

    // Scaling T⁴ della densità di energia fononica
    expect(phononBlackBodyEnergyDensity(20, 3800) / phononBlackBodyEnergyDensity(10, 3800)).toBeCloseTo(16, 12)

    // Statistiche di occupazione (Fig. 22)
    expect(fermiDiracOccupancy(0)).toBeCloseTo(0.5, 12)
    expect(boseEinsteinOccupancy(0)).toBe(Infinity)
    expect(maxwellBoltzmannOccupancy(10)).toBeCloseTo(fermiDiracOccupancy(10), 7)
    expect(maxwellBoltzmannOccupancy(10)).toBeCloseTo(boseEinsteinOccupancy(10), 7)

    // Summary helper
    const summary = specificHeatSummary(300, 343, 0.75)
    expect(summary.thetaEK).toBeCloseTo(257.25, 10)
    expect(summary.debyeJmolK).toBeCloseTo(debyeCv(300, 343), 12)
    expect(summary.einsteinJmolK).toBeCloseTo(einsteinCv(300, 257.25), 12)
  })
})
