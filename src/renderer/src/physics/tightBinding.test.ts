import { describe, expect, it } from 'vitest'
import {
  alignBandStructureBottom,
  blochSiteRealAmplitude,
  calibrateIndicativeHoppingAtA0,
  cosineBandExtremumMassRatio,
  diatomicApproxBandwidth,
  diatomicBondingCharacter,
  diatomicCenterSeparation,
  diatomicExactBandwidth,
  diatomicGapAtZoneEdge,
  diatomicGapEffectiveMassRatio,
  diatomicStateAt,
  diatomicWaveSamples,
  effectiveMassRatio,
  eigh,
  fillBands,
  indicativeHoppingAtDistance,
  kFromZoneFraction,
  modelOrbitalP,
  modelOrbitalS,
  monoatomicBandSummary,
  monoatomicBondingCharacter,
  monoatomicCenterSeparation,
  monoatomicEdgesVsDistance,
  monoatomicEnergiesAt,
  monoatomicGapAtZoneEdge,
  monoatomicWaveSamples,
  nearlyFreeBands,
  realSymmetricMatrix,
  tightBindingBandwidth,
  tightBindingDiatomicBands,
  tightBindingMonoatomicBands,
  zonePath1D
} from './index'

describe('legami forti — catena monoatomica s e p', () => {
  const params = { a: 3.0, centerS: -8.0, centerP: -2.0, tS: 1.0, absTP: 1.2 }

  it('larghezza W = 4|t| ed energie al centro e al bordo di zona', () => {
    expect(tightBindingBandwidth(1.0)).toBeCloseTo(4.0, 12)
    expect(tightBindingBandwidth(-1.2)).toBeCloseTo(4.8, 12)

    const [es0, ep0] = monoatomicEnergiesAt(params, 0)
    expect(es0).toBeCloseTo(params.centerS - 2 * params.tS, 12)
    expect(ep0).toBeCloseTo(params.centerP + 2 * params.absTP, 12)

    const [esPi, epPi] = monoatomicEnergiesAt(params, Math.PI / params.a)
    expect(esPi).toBeCloseTo(params.centerS + 2 * params.tS, 12)
    expect(epPi).toBeCloseTo(params.centerP - 2 * params.absTP, 12)

    const sumS = monoatomicBandSummary(params.centerS, params.tS)
    const sumP = monoatomicBandSummary(params.centerP, -params.absTP)
    expect(sumS.width).toBeCloseTo(4.0, 12)
    expect(sumP.tSigned).toBeCloseTo(-1.2, 12)
    expect(sumP.width).toBeCloseTo(4.8, 12)

    expect(monoatomicGapAtZoneEdge(params)).toBeCloseTo(
      params.centerP - params.centerS - 2 * (params.tS + params.absTP),
      12
    )
    expect(monoatomicGapAtZoneEdge(params)).toBeCloseTo(1.6, 12)
    expect(monoatomicCenterSeparation(params)).toBeCloseTo(ep0 - es0, 12)
  })

  it('bande sovrapposte danno gap negativo al bordo di zona e comportamento metallico a 2 elettroni', () => {
    const overlapParams = { a: 2.5, centerS: -5.0, centerP: -2.0, tS: 1.2, absTP: 1.1 }
    expect(monoatomicGapAtZoneEdge(overlapParams)).toBeCloseTo(-1.6, 12)
    const path = zonePath1D(overlapParams.a, 201)
    const bands = tightBindingMonoatomicBands(overlapParams, path)
    const filling = fillBands(bands, 2)
    expect(filling.kind).toBe('metal')
    expect(filling.gap).toBeNull()
  })

  it('massa efficace m*/m₀ = 0,4233 al fondo della banda s (t_s = 1 eV, a = 3 Å) e ±0,3528 per la banda p', () => {
    const mBottom = cosineBandExtremumMassRatio(1.0, 3.0, 'bottom')
    const mTop = cosineBandExtremumMassRatio(1.0, 3.0, 'top')
    expect(mBottom).toBeCloseTo(0.4233, 4)
    expect(mTop).toBeCloseTo(-0.4233, 4)

    // Confronto con la derivata seconda numerica (semiclassical.ts)
    expect(effectiveMassRatio((k) => monoatomicEnergiesAt(params, k)[0], 0)).toBeCloseTo(mBottom, 5)

    // Banda p (t_p = -1,2 eV): fondo in k = ±π/a (m* > 0) e cima in k = 0 (m* < 0)
    const mpBottom = cosineBandExtremumMassRatio(params.absTP, params.a, 'bottom')
    const mpTop = cosineBandExtremumMassRatio(params.absTP, params.a, 'top')
    expect(mpBottom).toBeCloseTo(0.3528, 4)
    expect(mpTop).toBeCloseTo(-0.3528, 4)
    expect(effectiveMassRatio((k) => monoatomicEnergiesAt(params, k)[1], Math.PI / params.a)).toBeCloseTo(mpBottom, 5)
    expect(effectiveMassRatio((k) => monoatomicEnergiesAt(params, k)[1], 0)).toBeCloseTo(mpTop, 5)
  })

  it('legge esponenziale indicativa t(a), taratura di t(a₀) e fase di Bloch sul sito', () => {
    expect(indicativeHoppingAtDistance(3.0, 3.0, 1.0, 0.8)).toBeCloseTo(1.0, 12)
    expect(indicativeHoppingAtDistance(3.8, 3.0, 1.0, 0.8)).toBeCloseTo(Math.exp(-1), 12)
    const calibrated = calibrateIndicativeHoppingAtA0(3.8, 3.0, 0.45, 0.8)
    expect(indicativeHoppingAtDistance(3.8, 3.0, calibrated, 0.8)).toBeCloseTo(0.45, 12)

    const kHalf = kFromZoneFraction(0.5, 3.0)
    expect(kHalf).toBeCloseTo(Math.PI / 6, 12)
    expect(blochSiteRealAmplitude(Math.PI / 3, 3.0, 1)).toBeCloseTo(-1, 12)
    expect(blochSiteRealAmplitude(Math.PI / 3, 1.5, 0.8)).toBeCloseTo(0, 12)

    const curve = monoatomicEdgesVsDistance([2.4, 3.0, 5.0], {
      centerS: -8,
      centerP: -2,
      tSAtA0: 0.9,
      absTPAtA0: 1.0,
      a0: 3.0,
      ell: 0.8
    })
    expect(curve[2].sMax - curve[2].sMin).toBeLessThan(curve[1].sMax - curve[1].sMin)
    expect(curve[0].sMax - curve[0].sMin).toBeGreaterThan(curve[1].sMax - curve[1].sMin)
  })

  it('carattere legante/antilegante opposto per bande s e p tra centro e bordo', () => {
    const kb = Math.PI / params.a
    expect(monoatomicBondingCharacter('s', 0, params.a)).toBe('bonding')
    expect(monoatomicBondingCharacter('s', kb, params.a)).toBe('antibonding')
    expect(monoatomicBondingCharacter('p', 0, params.a)).toBe('antibonding')
    expect(monoatomicBondingCharacter('p', kb, params.a)).toBe('bonding')
  })
})

describe('legami forti — catena biatomica A–B', () => {
  it('gap E_B − E_A al bordo, distanza in k = 0, peso |b_A|² = 0,85 e massa m*_c = 0,8467 m₀', () => {
    const p1 = { a: 3.0, eA: -1.0, eB: 1.0, t: 1.0 }
    expect(diatomicGapAtZoneEdge(p1)).toBeCloseTo(2.0, 12)
    expect(diatomicCenterSeparation(p1)).toBeCloseTo(2 * Math.sqrt(0.25 * 4 + 4), 12)

    const atPi = diatomicStateAt(p1, Math.PI / p1.a)
    expect(atPi.energies[0]).toBeCloseTo(p1.eA, 12)
    expect(atPi.energies[1]).toBeCloseTo(p1.eB, 12)
    expect(atPi.weights[0].bA2).toBeCloseTo(1, 12)
    expect(atPi.weights[0].bB2).toBeCloseTo(0, 12)
    expect(atPi.weights[1].bA2).toBeCloseTo(0, 12)
    expect(atPi.weights[1].bB2).toBeCloseTo(1, 12)

    expect(diatomicGapEffectiveMassRatio(p1, 1)).toBeCloseTo(0.8467, 4)
    expect(diatomicGapEffectiveMassRatio(p1, 0)).toBeCloseTo(-0.8467, 4)

    const path = zonePath1D(p1.a, 201)
    const bands = tightBindingDiatomicBands(p1, path)
    expect(effectiveMassRatio((k) => diatomicStateAt(p1, k).energies[1], Math.PI / p1.a)).toBeCloseTo(
      diatomicGapEffectiveMassRatio(p1, 1),
      4
    )
    expect(fillBands(bands, 2).kind).toBe('insulator')

    // E_B - E_A = 4t -> |b_A|² ≈ 0.85355 = 0.85 in k = 0 nella valenza
    const pRatio = { a: 3.0, eA: -2.0, eB: 2.0, t: 1.0 }
    const atZero = diatomicStateAt(pRatio, 0)
    expect(atZero.weights[0].bA2).toBeCloseTo((2 + Math.SQRT2) / 4, 12)
    expect(atZero.weights[0].bA2).toBeCloseTo(0.85, 2)

    // Regime asintotico t << E_B - E_A
    const pWeak = { a: 3.0, eA: -3.0, eB: 3.0, t: 0.25 }
    expect(diatomicExactBandwidth(pWeak)).toBeCloseTo(diatomicApproxBandwidth(pWeak), 3)
    expect(diatomicBondingCharacter(0, 0, p1)).toBe('bonding')
    expect(diatomicBondingCharacter(1, 0, p1)).toBe('antibonding')
  })

  it('limite E_A = E_B: E± = E_A ± 2t|cos(ka/2)| e stato metallico a 2 elettroni/cella', () => {
    const pEq = { a: 3.2, eA: -1.5, eB: -1.5, t: 1.1 }
    const path = zonePath1D(pEq.a, 101)
    const bands = tightBindingDiatomicBands(pEq, path)
    path.points.forEach(([k], idx) => {
      const expectedShift = 2 * pEq.t * Math.abs(Math.cos(0.5 * k * pEq.a))
      expect(bands.energies[0][idx]).toBeCloseTo(pEq.eA - expectedShift, 12)
      expect(bands.energies[1][idx]).toBeCloseTo(pEq.eA + expectedShift, 12)
    })
    expect(fillBands(bands, 2).kind).toBe('metal')
  })

  it('coincide con la diagonalizzazione diretta di un anello di N celle (2N siti)', () => {
    const N = 12
    const p = { a: 3.0, eA: -1.4, eB: 0.9, t: 0.85 }
    const H = realSymmetricMatrix(2 * N)
    for (let cell = 0; cell < N; cell++) {
      const iA = 2 * cell
      const iB = 2 * cell + 1
      const prevB = 2 * ((cell - 1 + N) % N) + 1
      H.data[iA * (2 * N) + iA] = p.eA
      H.data[iB * (2 * N) + iB] = p.eB
      // Legame interno alla cella (A_cell - B_cell)
      H.data[iA * (2 * N) + iB] = -p.t
      H.data[iB * (2 * N) + iA] = -p.t
      // Legame verso la cella precedente (A_cell - B_{cell-1})
      H.data[iA * (2 * N) + prevB] = -p.t
      H.data[prevB * (2 * N) + iA] = -p.t
    }
    const eig = eigh(H, { vectors: false }).values
    const blochVals: number[] = []
    for (let m = 0; m < N; m++) {
      const k = (2 * Math.PI * m) / (N * p.a)
      const [em, ep] = diatomicStateAt(p, k).energies
      blochVals.push(em, ep)
    }
    blochVals.sort((a, b) => a - b)
    for (let i = 0; i < 2 * N; i++) {
      expect(eig[i]).toBeCloseTo(blochVals[i], 10)
    }
  })
})

describe('legami forti — orbitali modello, densità e allineamento confronto', () => {
  it('orbitali s e p normalizzati in L²(ℝ) e accumulo/svuotamento al punto medio tra atomi', () => {
    const sigma = 0.8
    const dx = 0.02
    let normS = 0
    let normP = 0
    for (let x = -8; x <= 8; x += dx) {
      const vs = modelOrbitalS(x, sigma)
      const vp = modelOrbitalP(x, sigma)
      normS += vs * vs * dx
      normP += vp * vp * dx
    }
    expect(normS).toBeCloseTo(1, 5)
    expect(normP).toBeCloseTo(1, 5)

    const a = 3.0
    const mid = [a / 2]
    const sBonding = monoatomicWaveSamples(a, 0, 's', mid)
    const sAntibonding = monoatomicWaveSamples(a, Math.PI / a, 's', mid)
    expect(sBonding.density[0]).toBeGreaterThan(0.2)
    expect(sAntibonding.density[0]).toBeLessThan(1e-12)

    const pAntibonding = monoatomicWaveSamples(a, 0, 'p', mid)
    const pBonding = monoatomicWaveSamples(a, Math.PI / a, 'p', mid)
    expect(pBonding.density[0]).toBeGreaterThan(0.2)
    expect(pAntibonding.density[0]).toBeLessThan(1e-12)

    const diat = { a, eA: -1.2, eB: 0.8, t: 0.9 }
    const dMid = [a * 0.25]
    const dBond = diatomicWaveSamples(diat, 0, 0, dMid)
    const dAnti = diatomicWaveSamples(diat, 0, 1, dMid)
    expect(dBond.density[0]).toBeGreaterThan(dAnti.density[0])
  })

  it('allineamento del fondo banda per il confronto con elettroni quasi liberi', () => {
    const a = 3.0
    const path = zonePath1D(a, 101)
    const tb = tightBindingMonoatomicBands({ a, centerS: -8, centerP: -2, tS: 1, absTP: 1.2 }, path)
    const nf = nearlyFreeBands({ a, fourier: [-0.5] }, path, { planeWaves: 9, bands: 2 })
    const aligned = alignBandStructureBottom(nf, tb.energies[0][Math.floor(path.points.length / 2)])
    const nfMin = Math.min(...Array.from(aligned.energies[0]))
    const tbMin = Math.min(...Array.from(tb.energies[0]))
    expect(nfMin).toBeCloseTo(tbMin, 10)
  })
})
