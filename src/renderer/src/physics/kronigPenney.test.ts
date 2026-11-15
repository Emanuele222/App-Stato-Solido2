import { describe, expect, it } from 'vitest'
import { zonePath1D } from './bandStructure'
import { HBAR2_OVER_2M0 } from './constants'
import { fillBands } from './filling'
import { emptyLatticeBands, zoneBoundaryEnergy } from './freeElectron'
import { effectiveMassRatio } from './semiclassical'
import {
  deltaPotentialScaleV0,
  finiteWellLevels1D,
  kronigBarrierStrength,
  kronigEffectiveP,
  kronigPenneyBandEdges,
  kronigPenneyBandFunction,
  kronigPenneyBands,
  kronigPenneyCosineApproximation,
  kronigPenneyDeltaBandEdges,
  kronigPenneyDeltaL,
  kronigPenneyDensity1D,
  kronigPenneyEnergyAt,
  kronigPenneyGaps,
  kronigPenneyL,
  kronigPenneyRectangularBandEdges,
  kronigPenneyRectangularL,
  kronigPenneyStateFromEnergy,
  sampleKronigConditionCurve,
  type KronigPenneySpec
} from './kronigPenney'

describe('buca finita isolata (dispensa P3 §10.2 e E7)', () => {
  it('esempio b = 10 Å, V₀ = 1 eV: ρ = 2,56, 2 livelli (0,191 eV pari e 0,703 eV dispari)', () => {
    const b = 10
    const v0 = 1
    const levels = finiteWellLevels1D(b, v0)
    expect(levels).toHaveLength(2)
    expect(levels[0].parity).toBe('even')
    expect(levels[1].parity).toBe('odd')
    expect(levels[0].xi).toBeCloseTo(1.119, 3)
    expect(levels[1].xi).toBeCloseTo(2.147, 3)
    expect(levels[0].energy).toBeCloseTo(0.191, 3)
    expect(levels[1].energy).toBeCloseTo(0.703, 3)
  })

  it('soglia di un solo livello: ρ < π/2 ⇔ b < 6,13 Å per V₀ = 1 eV (E7c)', () => {
    expect(finiteWellLevels1D(6.1, 1)).toHaveLength(1)
    expect(finiteWellLevels1D(6.16, 1)).toHaveLength(2)
  })

  it('figura 10.3: γ_b = √(2m₀V₀/ħ²)·b = 10,4 dà 4 livelli legati in E/V₀', () => {
    // V₀ = 16 eV, b = 10,4 * √(ħ²/2m₀ / 16) = 5,075 Å
    const v0 = 16
    const b = 10.4 * Math.sqrt(HBAR2_OVER_2M0 / v0)
    const levels = finiteWellLevels1D(b, v0)
    expect(levels).toHaveLength(4)
  })
})

describe('Kronig–Penney a delta (dispensa P3 §10.3–10.4 e E8)', () => {
  it('esempio a = 3 Å, P = 3π/2: bande, gap, V₀ e massa efficace (E8)', () => {
    const a = 3
    const P = 1.5 * Math.PI
    const spec: KronigPenneySpec = { variant: 'delta', a, P }
    const u = zoneBoundaryEnergy(a) // 4,18 eV
    expect(u).toBeCloseTo(4.18, 2)
    expect(deltaPotentialScaleV0(a, P)).toBeCloseTo(3.99, 2)

    const edges = kronigPenneyDeltaBandEdges(a, P, 3)
    expect(edges[0].lower).toBeCloseTo(2.14, 2)
    expect(edges[0].upper).toBeCloseTo(u, 10) // αa = π esatto
    expect(edges[0].width).toBeCloseTo(2.03, 2)

    const gaps = kronigPenneyGaps(edges)
    expect(gaps[0].lower).toBeCloseTo(4.18, 2)
    expect(gaps[0].upper).toBeCloseTo(9.4, 2)
    expect(gaps[0].width).toBeCloseTo(5.22, 2)

    expect(edges[1].lower).toBeCloseTo(9.4, 2)
    expect(edges[1].upper).toBeCloseTo(4 * u, 10)
    expect(edges[1].width).toBeCloseTo(7.31, 2)

    // E8(d): banda a coseno vs massa efficace esatta in k = 0
    const cos = kronigPenneyCosineApproximation(edges, a, 0)
    expect(cos.t).toBeCloseTo(0.51, 2)
    expect(cos.minMassRatio).toBeCloseTo(0.83, 2)

    const fn0 = kronigPenneyBandFunction(spec, 0, edges)
    expect(effectiveMassRatio(fn0, 0, 1e-3)).toBeCloseTo(1.25, 2)
  })

  it('P = 2 riproduce i bordi adimensionali E/E₀ della fig. 10.2 e massa efficace per P = 0,1 (§13)', () => {
    const a = 3
    const u = zoneBoundaryEnergy(a)
    const edges = kronigPenneyDeltaBandEdges(a, 2, 5)
    // Dalla dispensa (§10.4): gap per P = 2 in unità E₀ tendono a 4P/π² = 0,811
    const gapsU = kronigPenneyGaps(edges).map((g) => g.width / u)
    expect(gapsU[0]).toBeCloseTo(0.668, 2)
    expect(gapsU[1]).toBeCloseTo(0.756, 2)
    expect(gapsU[2]).toBeCloseTo(0.783, 2)
    expect(gapsU[3]).toBeCloseTo(0.795, 2)

    // P3 §13: con P = 0,1 la massa efficace al bordo coincide con m₀·Eg/(Eg ± 4E₀)
    const specWeak: KronigPenneySpec = { variant: 'delta', a, P: 0.1 }
    const edgesW = kronigPenneyBandEdges(specWeak, 2)
    const Eg = kronigPenneyGaps(edgesW)[0].width
    const fn0 = kronigPenneyBandFunction(specWeak, 0, edgesW)
    const fn1 = kronigPenneyBandFunction(specWeak, 1, edgesW)
    const mMinusAnalytic = -Eg / (4 * u - Eg)
    const mPlusAnalytic = Eg / (4 * u + Eg)
    expect(effectiveMassRatio(fn0, Math.PI / a, 1e-3)).toBeCloseTo(mMinusAnalytic, 3)
    expect(effectiveMassRatio(fn1, Math.PI / a, 1e-3)).toBeCloseTo(mPlusAnalytic, 3)
  })

  it('limite analitico P → 0: riproduce il reticolo vuoto e gap nulli', () => {
    const a = 3.5
    const spec: KronigPenneySpec = { variant: 'delta', a, P: 0 }
    const path = zonePath1D(a, 51)
    const kp = kronigPenneyBands(spec, path, 4)
    const empty = emptyLatticeBands(a, path, 4)
    for (let b = 0; b < 4; b++) {
      for (let i = 0; i < path.points.length; i++) {
        expect(kp.energies[b][i]).toBeCloseTo(empty.energies[b][i], 10)
      }
    }
    const gaps = kronigPenneyGaps(kronigPenneyBandEdges(spec, 4))
    for (const g of gaps) expect(g.width).toBeLessThan(1e-12)
  })

  it('limite analitico P → ∞: le bande si stringono sui livelli αa = nπ della buca infinita', () => {
    const a = 3
    const E0 = zoneBoundaryEnergy(a)
    const edges = kronigPenneyDeltaBandEdges(a, 100000, 4)
    for (let n = 0; n < 4; n++) {
      const enInf = (n + 1) * (n + 1) * E0
      expect(edges[n].upper).toBeCloseTo(enInf, 10)
      expect(edges[n].lower).toBeCloseTo(enInf, 2)
      expect(edges[n].width).toBeLessThan(0.0005 * enInf)
    }
  })
})

describe('Kronig–Penney a barriere rettangolari, limiti e funzione d’onda', () => {
  it('continuità analitica di L(E) attraverso E = V₀ e caso V₀ = 0', () => {
    const b = 4
    const c = 1.2
    const v0 = 10
    expect(kronigPenneyRectangularL(v0 - 1e-7, b, c, v0)).toBeCloseTo(
      kronigPenneyRectangularL(v0 + 1e-7, b, c, v0),
      5
    )
    expect(kronigPenneyRectangularL(v0, b, c, v0)).toBeCloseTo(
      kronigPenneyRectangularL(v0 + 1e-9, b, c, v0),
      7
    )
    // V₀ = 0 ⇒ L(E) = cos(α(b+c))
    const E = 7.3
    const alpha = Math.sqrt(E / HBAR2_OVER_2M0)
    expect(kronigPenneyRectangularL(E, b, c, 0)).toBeCloseTo(Math.cos(alpha * (b + c)), 12)
  })

  it('limite a delta delle barriere rettangolari: c → 0 con V₀·c fisso', () => {
    const a = 3
    const P = 2
    const S = (2 * HBAR2_OVER_2M0 * P) / a // V₀·c = a·V₀_delta (eV·Å)
    expect(kronigBarrierStrength({ variant: 'delta', a, P })).toBeCloseTo(S, 12)

    const testE = 6.2
    const Ldelta = kronigPenneyDeltaL(testE, a, P)
    const c1 = 0.05
    const c2 = 0.002
    const L1 = kronigPenneyRectangularL(testE, a - c1, c1, S / c1)
    const L2 = kronigPenneyRectangularL(testE, a - c2, c2, S / c2)
    expect(Math.abs(L2 - Ldelta)).toBeLessThan(Math.abs(L1 - Ldelta))
    expect(L2).toBeCloseTo(Ldelta, 2)

    // Anche i bordi di banda convergono al modello a delta
    const edDelta = kronigPenneyDeltaBandEdges(a, P, 3)
    const edRect = kronigPenneyRectangularBandEdges(a - c2, c2, S / c2, 3)
    for (let i = 0; i < 3; i++) {
      expect(edRect[i].lower).toBeCloseTo(edDelta[i].lower, 2)
      expect(edRect[i].upper).toBeCloseTo(edDelta[i].upper, 2)
    }
  })

  it('ogni livello della buca finita isolata cade dentro la propria banda con |L| ≤ e^{−βc} < 1', () => {
    const v0 = 16
    const b = 10.4 * Math.sqrt(HBAR2_OVER_2M0 / v0)
    const c = 0.2 * b
    const levels = finiteWellLevels1D(b, v0)
    const edges = kronigPenneyRectangularBandEdges(b, c, v0, 5)
    expect(levels).toHaveLength(4)
    for (let j = 0; j < levels.length; j++) {
      const Ewell = levels[j].energy
      expect(Ewell).toBeGreaterThanOrEqual(edges[j].lower)
      expect(Ewell).toBeLessThanOrEqual(edges[j].upper)
      expect(Math.abs(kronigPenneyRectangularL(Ewell, b, c, v0))).toBeLessThan(1)
    }
  })

  it('la larghezza della banda 1 decresce esponenzialmente come e^{−β₁c} (P3 §10.7)', () => {
    const v0 = 16
    const b = 10.4 * Math.sqrt(HBAR2_OVER_2M0 / v0)
    const levels = finiteWellLevels1D(b, v0)
    const beta1 = Math.sqrt((v0 - levels[0].energy) / HBAR2_OVER_2M0)
    const cA = 0.4 * b
    const cB = 0.8 * b
    const wA = kronigPenneyRectangularBandEdges(b, cA, v0, 1)[0].width
    const wB = kronigPenneyRectangularBandEdges(b, cB, v0, 1)[0].width
    const measuredDecay = -Math.log(wB / wA) / (cB - cA)
    expect(measuredDecay).toBeCloseTo(beta1, 2)
  })

  it('densità |ψ(x)|²: media 1, nodo sulle barriere delta al bordo banda 1, continua e decadente nelle barriere rettangolari', () => {
    const specDelta: KronigPenneySpec = { variant: 'delta', a: 3, P: 4 }
    const xs = Float64Array.from({ length: 301 }, (_, i) => -4.5 + (9 * i) / 300)
    const rhoEdge = kronigPenneyDensity1D(specDelta, Math.PI / 3, 0, xs)
    // media ≈ 1 su intervallo multiplo intero del passo (3a)
    let avg = 0
    for (let i = 0; i < 300; i++) avg += rhoEdge[i]
    avg /= 300
    expect(avg).toBeCloseTo(1, 2)
    // barriere a ±1,5 Å hanno un nodo (cos²(π x / a) = 0 in x = ±a/2)
    const idxIon = 150 // x = 0
    const idxBarrier = 200 // x = +1,5 Å = a/2
    expect(rhoEdge[idxIon]).toBeGreaterThan(1.8)
    expect(rhoEdge[idxBarrier]).toBeLessThan(1e-6)

    // Caso rettangolare con barriera alta: |ψ|² più alta al centro buca (x = 0) che al centro barriera (x = a/2)
    const specRect: KronigPenneySpec = { variant: 'rectangular', b: 4, c: 2, v0: 15 }
    const E0 = kronigPenneyEnergyAt(specRect, 0, 0)
    expect(kronigPenneyL(specRect, E0)).toBeCloseTo(1, 8)
    const rhoRect = kronigPenneyDensity1D(specRect, 0, 0, Float64Array.from([0, 3]), E0)
    expect(rhoRect[0]).toBeGreaterThan(5 * rhoRect[1])
  })

  it('integrazione con fillBands: 2 elettroni per cella dànno isolante con P > 0 e metallo con P = 0', () => {
    const a = 3.5
    const path = zonePath1D(a, 101)
    const ins = fillBands(kronigPenneyBands({ variant: 'delta', a, P: 2 }, path, 4), 2)
    expect(ins.kind).toBe('insulator')
    expect(ins.gap).toBeGreaterThan(1)

    const met = fillBands(kronigPenneyBands({ variant: 'delta', a, P: 0 }, path, 4), 2)
    expect(met.kind).toBe('metal')
  })

  it('sampleKronigConditionCurve tocca i bordi |L| = 1 e kronigPenneyStateFromEnergy inverte nei gap e nelle bande', () => {
    const spec: KronigPenneySpec = { variant: 'rectangular', b: 4.5, c: 2.5, v0: 14 }
    const edges = kronigPenneyBandEdges(spec, 4)
    const curve = sampleKronigConditionCurve(spec, 0, 20, edges, 120)
    expect(curve.some((p) => Math.abs(p.energy - edges[0].lower) < 1e-8 && Math.abs(p.L - 1) < 1e-6)).toBe(true)
    expect(curve.some((p) => Math.abs(p.energy - edges[0].upper) < 1e-8 && Math.abs(p.L + 1) < 1e-6)).toBe(true)

    const mid0 = 0.5 * (edges[0].lower + edges[0].upper)
    const st = kronigPenneyStateFromEnergy(spec, mid0, edges)
    expect(st?.band).toBe(0)
    expect(st?.kFracAbs).toBeGreaterThan(0)
    expect(st?.kFracAbs).toBeLessThan(1)

    const midGap = 0.5 * (edges[0].upper + edges[1].lower)
    expect(kronigPenneyStateFromEnergy(spec, midGap, edges)).toBeNull()
  })
})

describe('test aggiuntivi Kronig–Penney (incarico 09 punto 7)', () => {
  it('kronigEffectiveP e kronigBarrierStrength per caso a delta e rettangolare', () => {
    const deltaSpec: KronigPenneySpec = { variant: 'delta', a: 3.5, P: 2.5 }
    expect(kronigEffectiveP(deltaSpec)).toBeCloseTo(2.5, 12)
    expect(kronigBarrierStrength(deltaSpec)).toBeCloseTo(2 * 2.5 * HBAR2_OVER_2M0 / 3.5, 12)

    const rectSpec: KronigPenneySpec = { variant: 'rectangular', b: 2.8, c: 0.7, v0: 8.0 }
    const aRect = 2.8 + 0.7
    expect(kronigEffectiveP(rectSpec)).toBeCloseTo((aRect * rectSpec.v0 * rectSpec.c) / (2 * HBAR2_OVER_2M0), 12)
    expect(kronigBarrierStrength(rectSpec)).toBeCloseTo(rectSpec.v0 * rectSpec.c, 12)
  })

  it('continuità di kronigPenneyRectangularL in E = V₀ ± ε', () => {
    const b = 2.5
    const c = 0.8
    const v0 = 10.0
    const lAt = kronigPenneyRectangularL(v0, b, c, v0)
    const lBelow = kronigPenneyRectangularL(v0 - 1e-6, b, c, v0)
    const lAbove = kronigPenneyRectangularL(v0 + 1e-6, b, c, v0)
    expect(lBelow).toBeCloseTo(lAt, 5)
    expect(lAbove).toBeCloseTo(lAt, 5)
  })

  it('normalizzazione di kronigPenneyDensity1D su una cella con tolleranza 1e-4 (delta e rettangolare)', () => {
    const nCell = 1000
    const deltaSpec: KronigPenneySpec = { variant: 'delta', a: 3.0, P: 2.0 }
    const aDelta = 3.0
    const xsDelta = Float64Array.from({ length: nCell }, (_, i) => ((i + 0.5) * aDelta) / nCell)
    const densDelta = kronigPenneyDensity1D(deltaSpec, Math.PI / (3 * aDelta), 0, xsDelta)
    const meanDelta = densDelta.reduce((s, v) => s + v, 0) / nCell
    expect(Math.abs(meanDelta - 1)).toBeLessThan(1e-4)

    const rectSpec: KronigPenneySpec = { variant: 'rectangular', b: 2.4, c: 0.6, v0: 12.0 }
    const aRect = 3.0
    const xsRect = Float64Array.from({ length: nCell }, (_, i) => ((i + 0.5) * aRect) / nCell)
    const densRect = kronigPenneyDensity1D(rectSpec, Math.PI / (2 * aRect), 1, xsRect)
    const meanRect = densRect.reduce((s, v) => s + v, 0) / nCell
    expect(Math.abs(meanRect - 1)).toBeLessThan(1e-4)
  })
})
