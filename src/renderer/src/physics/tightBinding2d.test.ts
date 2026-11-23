import { describe, expect, it } from 'vitest'
import { HBAR2_OVER_2M0 } from './constants'
import { isEffectiveMassDivergent } from './semiclassical'
import {
  GRAPHENE_A,
  GRAPHENE_ACC,
  grapheneBands,
  grapheneDiracDos,
  grapheneEffectiveMassComparison,
  grapheneEnergies,
  grapheneFermiVelocity,
  grapheneHighSymmetryPoints,
  grapheneNumericalDos,
  graphenePath,
  grapheneStructureFactor,
  grapheneVectors,
  squareBands,
  squareBottomEffectiveMassRatio,
  squareDirectionalMassRatio,
  squareEnergy,
  squareFermiLevel,
  squarePath
} from './tightBinding2d'

describe('physics/tightBinding2d — reticolo quadrato', () => {
  const a = 3.0
  const t = 1.2

  it('riproduce i valori esatti in Γ (−4t), X (0), M (+4t) e la larghezza 8t', () => {
    const kEdge = Math.PI / a
    const eGamma = squareEnergy(0, 0, t, a)
    const eX = squareEnergy(kEdge, 0, t, a)
    const eM = squareEnergy(kEdge, kEdge, t, a)

    expect(eGamma).toBeCloseTo(-4 * t, 12)
    expect(eX).toBeCloseTo(0, 12)
    expect(eM).toBeCloseTo(4 * t, 12)
    expect(eM - eGamma).toBeCloseTo(8 * t, 12)

    const path = squarePath(a, 40)
    const bs = squareBands({ a, t }, path)
    expect(bs.energies).toHaveLength(1)
    expect(bs.energies[0][0]).toBeCloseTo(-4 * t, 12)
    expect(bs.energies[0][40]).toBeCloseTo(0, 12)
    expect(bs.energies[0][80]).toBeCloseTo(4 * t, 12)
  })

  it('è periodica rispetto ai vettori del reticolo reciproco G = (2π/a)(n, m)', () => {
    const Gx = (2 * Math.PI) / a
    const Gy = (2 * Math.PI) / a
    const kx = 0.43
    const ky = -0.71
    const e0 = squareEnergy(kx, ky, t, a)
    expect(squareEnergy(kx + Gx, ky, t, a)).toBeCloseTo(e0, 12)
    expect(squareEnergy(kx, ky + Gy, t, a)).toBeCloseTo(e0, 12)
    expect(squareEnergy(kx - 2 * Gx, ky + 3 * Gy, t, a)).toBeCloseTo(e0, 12)
  })

  it('a metà riempimento (N = 1) E_F = 0 e la linea di Fermi è |k_x| + |k_y| = π/a', () => {
    const ef = squareFermiLevel(1, t)
    expect(ef).toBe(0)
    const kEdge = Math.PI / a
    for (const sgnX of [-1, 1]) {
      for (const sgnY of [-1, 1]) {
        for (const frac of [0, 0.25, 0.5, 0.75, 1]) {
          const kx = sgnX * frac * kEdge
          const ky = sgnY * (1 - frac) * kEdge
          expect(squareEnergy(kx, ky, t, a)).toBeCloseTo(ef, 12)
        }
      }
    }
    expect(squareFermiLevel(2, t)).toBeCloseTo(4 * t, 12)
  })

  it('ha m* isotropa al fondo della banda pari a ħ²/(2ta²)', () => {
    const mBottom = squareBottomEffectiveMassRatio(t, a)
    expect(mBottom).toBeCloseTo(HBAR2_OVER_2M0 / (t * a * a), 12)
    expect(squareDirectionalMassRatio(0, 0, 1, 0, t, a)).toBeCloseTo(mBottom, 12)
    expect(squareDirectionalMassRatio(0, 0, 0, 1, t, a)).toBeCloseTo(mBottom, 12)
    expect(squareDirectionalMassRatio(0, 0, 1, 1, t, a)).toBeCloseTo(mBottom, 12)
  })
})

describe('physics/tightBinding2d — grafene', () => {
  const t = 2.8

  it('riproduce i valori in Γ (±3t), M (±t) e K (0)', () => {
    const sym = grapheneHighSymmetryPoints()
    const [eGammaPi, eGammaPiStar] = grapheneEnergies(sym.Gamma[0], sym.Gamma[1], t)
    expect(eGammaPi).toBeCloseTo(-3 * t, 12)
    expect(eGammaPiStar).toBeCloseTo(3 * t, 12)

    const [eMPi, eMPiStar] = grapheneEnergies(sym.M[0], sym.M[1], t)
    expect(eMPi).toBeCloseTo(-t, 12)
    expect(eMPiStar).toBeCloseTo(t, 12)

    const [eKPi, eKPiStar] = grapheneEnergies(sym.K[0], sym.K[1], t)
    expect(eKPi).toBeCloseTo(0, 12)
    expect(eKPiStar).toBeCloseTo(0, 12)

    const path = graphenePath(GRAPHENE_A, 40)
    const bs = grapheneBands({ t }, path)
    expect(bs.energies).toHaveLength(2)
    expect(bs.energies[0][0]).toBeCloseTo(-3 * t, 12)
    expect(bs.energies[1][40]).toBeCloseTo(t, 12)
    expect(bs.energies[1][80]).toBeCloseTo(0, 12)
  })

  it('ha f(k) = 0 in tutti e sei i vertici K e K′ della prima zona', () => {
    const sym = grapheneHighSymmetryPoints()
    expect(sym.vertices).toHaveLength(6)
    for (const v of sym.vertices) {
      const f = grapheneStructureFactor(v.k[0], v.k[1])
      expect(f.abs).toBeLessThan(1e-12)
    }
  })

  it('ha pendenza vicino a K uguale a (3/2)·a_CC·t entro l’1 % e v_F = 9,1·10⁵ m/s per t = 2,8 eV', () => {
    const sym = grapheneHighSymmetryPoints()
    const q = 1e-3 // Å⁻¹
    const expectedSlope = 1.5 * GRAPHENE_ACC * t
    for (const angle of [0, Math.PI / 4, Math.PI / 2, Math.PI]) {
      const kx = sym.K[0] + q * Math.cos(angle)
      const ky = sym.K[1] + q * Math.sin(angle)
      const [, ePlus] = grapheneEnergies(kx, ky, t)
      const slope = ePlus / q
      expect(Math.abs(slope - expectedSlope) / expectedSlope).toBeLessThan(0.01)
    }

    const vF = grapheneFermiVelocity(2.8)
    expect(vF).toBeGreaterThan(9.0e5)
    expect(vF).toBeLessThan(9.2e5)
  })

  it('è periodica rispetto ai vettori reciproci b₁, b₂ del grafene', () => {
    const { a1, a2, b1, b2 } = grapheneVectors()
    // Verifica ortogonalità a_i · b_j = 2π δ_ij
    expect(a1[0] * b1[0] + a1[1] * b1[1]).toBeCloseTo(2 * Math.PI, 12)
    expect(a2[0] * b2[0] + a2[1] * b2[1]).toBeCloseTo(2 * Math.PI, 12)
    expect(a1[0] * b2[0] + a1[1] * b2[1]).toBeCloseTo(0, 12)
    expect(a2[0] * b1[0] + a2[1] * b1[1]).toBeCloseTo(0, 12)

    const kx = 0.55
    const ky = -0.32
    const [e0m, e0p] = grapheneEnergies(kx, ky, t)
    const [e1m, e1p] = grapheneEnergies(kx + b1[0], ky + b1[1], t)
    const [e2m, e2p] = grapheneEnergies(kx + 2 * b1[0] - b2[0], ky + 2 * b1[1] - b2[1], t)
    expect(e1m).toBeCloseTo(e0m, 11)
    expect(e1p).toBeCloseTo(e0p, 11)
    expect(e2m).toBeCloseTo(e0m, 11)
    expect(e2p).toBeCloseTo(e0p, 11)
  })

  it('g(E) numerica coincide con la formula lineare entro il 2 % fino a 0,3 eV e integra a 2 stati per cella per banda', () => {
    const dos = grapheneNumericalDos(t, GRAPHENE_A, { gridN: 240, nBins: 240 })

    // Integrale su ciascuna banda = 2 stati per cella
    let intPi = 0
    let intPiStar = 0
    for (let i = 0; i < dos.energies.length; i++) {
      if (dos.energies[i] < 0) intPi += dos.dosPerCell[i] * dos.dE
      else intPiStar += dos.dosPerCell[i] * dos.dE
    }
    expect(intPi).toBeCloseTo(2, 5)
    expect(intPiStar).toBeCloseTo(2, 5)

    // Confronto con la formula lineare 2|E| / (π ħ² v_F²) per 0,10 ≤ |E| ≤ 0,30 eV
    let checked = 0
    for (let i = 0; i < dos.energies.length; i++) {
      const E = Math.abs(dos.energies[i])
      if (E >= 0.10 && E <= 0.30) {
        const analytic = grapheneDiracDos(E, t)
        const relErr = Math.abs(dos.dosPerArea[i] - analytic) / analytic
        expect(relErr).toBeLessThan(0.02)
        checked++
      }
    }
    expect(checked).toBeGreaterThanOrEqual(4)
  })

  it('sul cono di Dirac la massa da curvatura diverge mentre m̃ = ħq/v_F tende a zero in K', () => {
    const sym = grapheneHighSymmetryPoints()
    const atK = grapheneEffectiveMassComparison(sym.K[0], sym.K[1], 1, t)
    expect(isEffectiveMassDivergent(atK.curvatureMassRatio)).toBe(true)
    expect(atK.diracMassRatio).toBe(0)

    // Lontano dal punto di Dirac (q piccolo) m̃ = ħq/v_F è piccolo e positivo nella banda π*
    const nearK = grapheneEffectiveMassComparison(sym.K[0] + 0.01, sym.K[1], 1, t)
    expect(nearK.diracMassRatio).toBeGreaterThan(0)
    expect(nearK.diracMassRatio).toBeLessThan(0.05)
  })
})
