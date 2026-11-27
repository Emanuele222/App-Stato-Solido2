import { describe, expect, it } from 'vitest'
import { zonePath1D } from './bandStructure'
import { emptyLatticeBands } from './freeElectron'
import { eigh } from './linalg'
import {
  buildPseudoHamiltonianWithF,
  cancellationMatrixElements,
  computeCoreRadius,
  dominantPlaneWaveWeight,
  evalBlochWavefunction1D,
  findSignChangesInCore,
  gaussianCrystalPotentialZeroMean,
  meanKineticEnergy1D,
  orthogonalityIntegrand1D,
  parityDecomposition1D,
  planeWaveConvergence1D,
  planeWaveTailWeight,
  pseudoCore1DBands,
  pseudoCore1DBandsWithStates,
  pseudoWavefunctionAndTrue,
  smoothestAlpha,
  solvePseudoCore1DAtK,
  type PseudoCore1DParams
} from './pseudoCore1d'

function dot(a: Float64Array, b: Float64Array): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

function norm(a: Float64Array): number {
  return Math.sqrt(dot(a, a))
}

function matVec(data: Float64Array, n: number, v: Float64Array): Float64Array {
  const out = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    let s = 0
    const row = i * n
    for (let j = 0; j < n; j++) s += data[row + j] * v[j]
    out[i] = s
  }
  return out
}

describe('pseudoCore1d — modello 1D con stato di core (verifica_pseudo.py r. 58–92)', () => {
  const params: PseudoCore1DParams = { a: 4.0, v0: 60.0, s: 0.25 }
  const kpt = (0.3 * Math.PI) / params.a

  it('ortogonalità ⟨ψ_ck|ψ_k⟩ < 10⁻¹⁰ e banda di core molto più stretta della prima banda di valenza', () => {
    const state = solvePseudoCore1DAtK(kpt, params, 40)
    const cCore = state.vectors[0]
    const cVal = state.vectors[1]
    expect(Math.abs(dot(cCore, cVal))).toBeLessThan(1e-10)

    const path = zonePath1D(params.a, 41)
    const bs = pseudoCore1DBands(params, path, 4, 40)
    const coreWidth = Math.max(...bs.energies[0]) - Math.min(...bs.energies[0])
    const valWidth = Math.max(...bs.energies[1]) - Math.min(...bs.energies[1])
    expect(coreWidth).toBeLessThan(0.05)
    expect(valWidth).toBeGreaterThan(1.0)
    expect(coreWidth).toBeLessThan(valWidth * 0.05)
  })

  it('residuo |(H + V′ − E)ψ^f| < 10⁻⁸ per α = 0; 0,7; −2 e (1 − Π_c)ψ^f parallelo a ψ_k', () => {
    const state = solvePseudoCore1DAtK(kpt, params, 40)
    const eCore = state.energies[0]
    const eVal = state.energies[1]
    const cCore = state.vectors[0]
    const cVal = state.vectors[1]
    const Hps = buildPseudoHamiltonianWithF(state.hamiltonian, cCore, eVal - eCore)

    for (const alpha of [0, 0.7, -2.0]) {
      const { cPseudoRaw, cProjected } = pseudoWavefunctionAndTrue(cVal, cCore, alpha)
      const HpsPsi = matVec(Hps.data, Hps.n, cPseudoRaw)
      const res = new Float64Array(Hps.n)
      for (let i = 0; i < Hps.n; i++) res[i] = HpsPsi[i] - eVal * cPseudoRaw[i]
      expect(norm(res)).toBeLessThan(1e-8)

      const overlap = Math.abs(dot(cVal, cProjected)) / norm(cProjected)
      expect(overlap).toBeCloseTo(1, 10)
    }
  })

  it('non unicità con f = 0; 5; 50; −3: autovalore di valenza invariato entro 10⁻⁸, livello di core a E_c + f', () => {
    const state = solvePseudoCore1DAtK(kpt, params, 40)
    const eCore = state.energies[0]
    const eVal = state.energies[1]
    const cCore = state.vectors[0]

    for (const f of [0, 5, 50, -3]) {
      const Htilde = buildPseudoHamiltonianWithF(state.hamiltonian, cCore, f)
      const { values } = eigh(Htilde, { vectors: false })

      let minDistVal = Infinity
      let minDistCore = Infinity
      for (let i = 0; i < values.length; i++) {
        minDistVal = Math.min(minDistVal, Math.abs(values[i] - eVal))
        minDistCore = Math.min(minDistCore, Math.abs(values[i] - (eCore + f)))
      }
      expect(minDistVal).toBeLessThan(1e-8)
      expect(minDistCore).toBeLessThan(1e-8)
    }
  })

  it('limite V₀ → 0 riproduce il reticolo vuoto 1D (emptyLatticeBands)', () => {
    const path = zonePath1D(params.a, 21)
    const bsZero = pseudoCore1DBands({ a: params.a, v0: 0, s: params.s }, path, 4, 40)
    const empty = emptyLatticeBands(params.a, path, 4)
    for (let b = 0; b < 4; b++) {
      for (let i = 0; i < path.points.length; i++) {
        expect(bsZero.energies[b][i]).toBeCloseTo(empty.energies[b][i], 10)
      }
    }
  })

  it('convergenza: i primi tre livelli cambiano meno di 10⁻³ eV passando da 81 a 121 onde', () => {
    const s81 = solvePseudoCore1DAtK(kpt, params, 40)
    const s121 = solvePseudoCore1DAtK(kpt, params, 60)
    for (let b = 0; b < 3; b++) {
      expect(Math.abs(s81.energies[b] - s121.energies[b])).toBeLessThan(1e-3)
    }
  })

  it('con α «più liscia» il peso |c_G|² oltre |n| = 3 (e |n| = 1) è minore che in ψ_k', () => {
    const state = solvePseudoCore1DAtK(kpt, params, 40)
    const cCore = state.vectors[0]
    const cVal1 = state.vectors[1]
    const alpha1 = smoothestAlpha(cVal1, cCore, kpt, state.G)
    const { cPseudoNorm: psif1 } = pseudoWavefunctionAndTrue(cVal1, cCore, alpha1)
    const tail3True = planeWaveTailWeight(cVal1, state.nHalf, 3)
    const tail3Smooth = planeWaveTailWeight(psif1, state.nHalf, 3)
    const tail1True = planeWaveTailWeight(cVal1, state.nHalf, 1)
    const tail1Smooth = planeWaveTailWeight(psif1, state.nHalf, 1)

    console.info(
      `[pseudoCore1d tail] b=1, alphaSmooth=${alpha1.toFixed(4)} | |n|>1: ${tail1True.toFixed(5)} -> ${tail1Smooth.toFixed(5)} | |n|>3: ${tail3True.toFixed(6)} -> ${tail3Smooth.toFixed(6)}`
    )
    expect(tail3Smooth).toBeLessThan(tail3True)
    expect(tail1Smooth).toBeLessThan(tail1True)
  })

  it('cancellazione: ⟨k+G|V+V′|k⟩ è molto minore di ⟨k+G|V|k⟩ ai bassi G e r_c è ben definito', () => {
    const state = solvePseudoCore1DAtK(kpt, params, 40)
    const cancel = cancellationMatrixElements(
      state.G,
      state.nHalf,
      params,
      state.energies[1],
      state.energies[0],
      state.vectors[0],
      5
    )
    // Per n = 1 (G = 2π/a), V_G è negativo e V'_G positivo: |V + V'| < |V|
    const idx1 = 5 + 1
    expect(cancel.vMat[idx1]).toBeLessThan(0)
    expect(cancel.vPrimeMat[idx1]).toBeGreaterThan(0)
    expect(Math.abs(cancel.vPsMat[idx1])).toBeLessThan(Math.abs(cancel.vMat[idx1]))

    const rc = computeCoreRadius(state.vectors[0], state.G, kpt, params.a)
    expect(rc).toBeGreaterThan(0.1)
    expect(rc).toBeLessThan(params.a * 0.4)
  })

  it('intervalli dei cursori: una sola banda di core (larghezza < 0,2 eV) e seconda banda larga ≥ 1 eV agli 8 estremi', () => {
    const aVals = [3.5, 4.8]
    const v0Vals = [50, 75]
    const sVals = [0.2, 0.28]
    const report: string[] = []

    for (const a of aVals) {
      for (const v0 of v0Vals) {
        for (const s of sVals) {
          const path = zonePath1D(a, 21)
          const bs = pseudoCore1DBands({ a, v0, s }, path, 3, 40)
          const w0 = Math.max(...bs.energies[0]) - Math.min(...bs.energies[0])
          const w1 = Math.max(...bs.energies[1]) - Math.min(...bs.energies[1])
          report.push(`a=${a}, V0=${v0}, s=${s}: w0=${w0.toFixed(4)} eV, w1=${w1.toFixed(4)} eV`)
          expect(w0).toBeLessThan(0.2)
          expect(w1).toBeGreaterThanOrEqual(1.0)
        }
      }
    }
    console.info('[pseudoCore1d corner widths]\n' + report.join('\n'))
  })

  it('tempo di calcolo: bande su 41 punti + stato a k ben sotto il mezzo secondo', () => {
    // Obiettivo d'interattività: ~200 ms da solo. Con la suite intera in parallelo una
    // misura singola arriva a ~300 ms, quindi: un giro a vuoto, il migliore di tre e un
    // margine (500 ms) che coglie solo i rallentamenti veri, di un ordine di grandezza.
    const run = (): number => {
      const t0 = performance.now()
      pseudoCore1DBands(params, zonePath1D(params.a, 41), 4, 40)
      solvePseudoCore1DAtK(kpt, params, 40)
      return performance.now() - t0
    }
    run()
    const dt = Math.min(run(), run(), run())
    console.info(`[pseudoCore1d timing] 41 k-points + state = ${dt.toFixed(1)} ms (migliore di 3)`)
    expect(dt).toBeLessThan(500)
  })

  it('Γ banda 1: numeri di riferimento completi, cambi di segno, ortogonalità, cinetiche e α sempre finito', () => {
    const st0 = solvePseudoCore1DAtK(0, params, 40)
    const cCore = st0.vectors[0]
    const cVal1 = st0.vectors[1]
    expect(st0.energies[0]).toBeCloseTo(-19.079, 2)
    expect(st0.energies[1]).toBeCloseTo(13.089, 2)
    expect(st0.energies[1] - st0.energies[0]).toBeCloseTo(32.17, 1)

    const rc = computeCoreRadius(cCore, st0.G, 0, params.a)
    expect(rc).toBeCloseTo(0.641, 2)

    const ptCheck = evalBlochWavefunction1D(cCore, st0.G, 0, params.a, new Float64Array([0, params.a / 2]))
    const valCheck = evalBlochWavefunction1D(cVal1, st0.G, 0, params.a, new Float64Array([0, params.a / 2]))
    expect(ptCheck.re[0]).toBeCloseTo(1.202, 2)
    expect(valCheck.re[0]).toBeCloseTo(-0.232, 2)
    expect(valCheck.re[1]).toBeCloseTo(0.783, 2)

    const alpha1 = smoothestAlpha(cVal1, cCore, 0, st0.G)
    expect(alpha1).toBeCloseTo(0.586, 3)

    const { cPseudoRaw, cPseudoNorm } = pseudoWavefunctionAndTrue(cVal1, cCore, alpha1)
    const nGrid = 401
    const xGrid = new Float64Array(nGrid)
    for (let i = 0; i < nGrid; i++) xGrid[i] = -params.a / 2 + (params.a * i) / (nGrid - 1)

    const wCore = evalBlochWavefunction1D(cCore, st0.G, 0, params.a, xGrid)
    const wTrue = evalBlochWavefunction1D(cVal1, st0.G, 0, params.a, xGrid)
    const wPsRaw = evalBlochWavefunction1D(cPseudoRaw, st0.G, 0, params.a, xGrid)

    const crossings = findSignChangesInCore(wTrue.re, xGrid, rc)
    expect(crossings).toHaveLength(2)
    expect(crossings[0]).toBeCloseTo(-0.413, 2)
    expect(crossings[1]).toBeCloseTo(0.413, 2)

    const ionIdx = (nGrid - 1) / 2
    expect(wPsRaw.re[ionIdx]).toBeCloseTo(0.472, 2)
    let minInCore = Infinity
    let maxDiffOut = 0
    for (let i = 0; i < nGrid; i++) {
      if (Math.abs(xGrid[i]) < rc) minInCore = Math.min(minInCore, wPsRaw.re[i])
      if (Math.abs(xGrid[i]) > 2 * rc) maxDiffOut = Math.max(maxDiffOut, Math.abs(wPsRaw.re[i] - wTrue.re[i]))
    }
    expect(minInCore).toBeCloseTo(0.383, 2)
    expect(maxDiffOut).toBeLessThanOrEqual(0.04)

    expect(meanKineticEnergy1D(cCore, st0.G, 0)).toBeCloseTo(10.57, 2)
    expect(meanKineticEnergy1D(cVal1, st0.G, 0)).toBeCloseTo(4.83, 2)
    expect(meanKineticEnergy1D(cPseudoNorm, st0.G, 0)).toBeCloseTo(0.9, 2)

    expect(dominantPlaneWaveWeight(cVal1)).toBeCloseTo(0.541, 2)
    expect(dominantPlaneWaveWeight(cPseudoNorm)).toBeCloseTo(0.935, 2)

    const ortho = orthogonalityIntegrand1D(wCore.re, wCore.im, wTrue.re, wTrue.im, xGrid)
    expect(ortho.posArea).toBeCloseTo(0.1275, 3)
    expect(ortho.negArea).toBeCloseTo(-0.1275, 3)
    expect(Math.abs(ortho.netIntegral)).toBeLessThan(1e-4)

    expect(st0.energies[1] - gaussianCrystalPotentialZeroMean(0, params)).toBeCloseTo(63.7, 1)
    expect(st0.energies[1] - gaussianCrystalPotentialZeroMean(params.a / 2, params)).toBeCloseTo(3.69, 2)
    expect(st0.energies[0] - gaussianCrystalPotentialZeroMean(0, params)).toBeCloseTo(31.5, 1)
  })

  it('α «più liscia» = 0 su stati dispari e |α| < 2 su bande 1–3 agli 8 estremi dei cursori; nessun salto su banda 1', () => {
    const stGamma = solvePseudoCore1DAtK(0, params, 40)
    expect(Math.abs(smoothestAlpha(stGamma.vectors[2], stGamma.vectors[0], 0, stGamma.G))).toBeLessThan(1e-8)

    const stPi = solvePseudoCore1DAtK(Math.PI / params.a, params, 40)
    expect(Math.abs(smoothestAlpha(stPi.vectors[1], stPi.vectors[0], Math.PI / params.a, stPi.G))).toBeLessThan(1e-8)

    // Nessun salto di segno lungo la banda 1 in (-π/a, π/a)
    let prevIonSign = 0
    for (let ki = 1; ki < 80; ki++) {
      const k = (-1 + (2 * ki) / 80) * (Math.PI / params.a)
      const st = solvePseudoCore1DAtK(k, params, 40)
      const w = evalBlochWavefunction1D(st.vectors[1], st.G, k, params.a, new Float64Array([0, params.a / 2]))
      expect(w.re[1]).toBeGreaterThan(0)
      const ionSign = Math.sign(w.re[0])
      if (prevIonSign !== 0) expect(ionSign).toBe(prevIonSign)
      prevIonSign = ionSign
    }

    for (const a of [3.5, 4.8]) {
      for (const v0 of [50, 75]) {
        for (const s of [0.2, 0.28]) {
          for (let ki = 0; ki <= 20; ki++) {
            const k = (-1 + (2 * ki) / 20) * (Math.PI / a)
            const st = solvePseudoCore1DAtK(k, { a, v0, s }, 40)
            for (let b = 1; b <= 3; b++) {
              expect(Math.abs(smoothestAlpha(st.vectors[b], st.vectors[0], k, st.G))).toBeLessThan(2)
            }
          }
        }
      }
    }
  })

  it('convergenza con N onde piane in Γ banda 1: potenziale vero (11 onde) vs H + (E − E_c)|ψ_c⟩⟨ψ_c| (3 onde)', () => {
    const st0 = solvePseudoCore1DAtK(0, params, 40)
    const conv = planeWaveConvergence1D(st0, 1, [1, 3, 5, 7, 9, 11])
    const expectedTrue: Record<number, number> = {
      3: 0.529,
      5: 0.174,
      7: 0.061,
      9: 0.019,
      11: 0.005
    }
    const expectedPseudo: Record<number, number> = {
      1: 0.829,
      3: 0.003,
      5: 0.0002
    }
    let prevTrue = Infinity
    let prevPseudo = Infinity
    for (const pt of conv.points) {
      if (pt.errorTrue !== null) {
        expect(pt.errorTrue).toBeGreaterThanOrEqual(-1e-9)
        expect(pt.errorTrue).toBeLessThanOrEqual(prevTrue + 1e-9)
        prevTrue = pt.errorTrue
        if (expectedTrue[pt.nWaves] !== undefined) {
          expect(Math.abs(pt.errorTrue - expectedTrue[pt.nWaves])).toBeLessThan(0.002)
        }
      }
      if (pt.errorPseudo !== null) {
        expect(pt.errorPseudo).toBeGreaterThanOrEqual(-1e-9)
        expect(pt.errorPseudo).toBeLessThanOrEqual(prevPseudo + 1e-9)
        prevPseudo = pt.errorPseudo
        if (expectedPseudo[pt.nWaves] !== undefined) {
          expect(Math.abs(pt.errorPseudo - expectedPseudo[pt.nWaves])).toBeLessThan(0.002)
        }
      }
    }
    expect(conv.nNeededTrue).toBe(11)
    expect(conv.nNeededPseudo).toBe(3)
  })

  it('decomposizione pari/dispari (cella e core) e onde necessarie lungo la banda 1 e in Γ bande 2–3', () => {
    const cases: readonly {
      readonly label: string
      readonly fracPi: number
      readonly band: number
      readonly oddCorePct?: number
      readonly oddCellPct?: number
      readonly nTrue: number
      readonly nPseudo: number
    }[] = [
      { label: 'Γ, b1', fracPi: 0, band: 1, oddCorePct: 0, oddCellPct: 0, nTrue: 11, nPseudo: 3 },
      { label: '0,025π/a, b1', fracPi: 0.025, band: 1, nTrue: 11, nPseudo: 3 },
      { label: '0,05π/a, b1', fracPi: 0.05, band: 1, oddCorePct: 28.3, oddCellPct: 4.2, nTrue: 11, nPseudo: 7 },
      { label: '0,1π/a, b1', fracPi: 0.1, band: 1, oddCorePct: 58.6, oddCellPct: 13.7, nTrue: 11, nPseudo: 9 },
      { label: '0,2π/a, b1', fracPi: 0.2, band: 1, oddCorePct: 81.4, oddCellPct: 33.8, nTrue: 11, nPseudo: 11 },
      { label: '0,3π/a, b1', fracPi: 0.3, band: 1, oddCorePct: 89.1, oddCellPct: 49.9, nTrue: 13, nPseudo: 11 },
      { label: '0,6π/a, b1', fracPi: 0.6, band: 1, oddCorePct: 97.2, oddCellPct: 82.9, nTrue: 13, nPseudo: 11 },
      { label: 'π/a, b1', fracPi: 1.0, band: 1, oddCorePct: 100, oddCellPct: 100, nTrue: 13, nPseudo: 11 },
      { label: 'Γ, b2', fracPi: 0, band: 2, oddCorePct: 100, oddCellPct: 100, nTrue: 13, nPseudo: 13 },
      { label: 'Γ, b3', fracPi: 0, band: 3, oddCorePct: 0, oddCellPct: 0, nTrue: 15, nPseudo: 5 }
    ]

    const lines: string[] = []
    for (const c of cases) {
      const k = (c.fracPi * Math.PI) / params.a
      const st = solvePseudoCore1DAtK(k, params, 40)
      const rc = computeCoreRadius(st.vectors[0], st.G, k, params.a)
      const p = parityDecomposition1D(st.vectors[c.band], st.G, k, params.a, rc, 2001)
      const conv = planeWaveConvergence1D(st, c.band)
      const oddCore = p.oddWeightCore * 100
      const oddCell = p.oddWeightCell * 100
      lines.push(
        `${c.label}: oddCore=${oddCore.toFixed(2)}% oddCell=${oddCell.toFixed(2)}% waves=${conv.nNeededTrue}/${conv.nNeededPseudo} evenX=[${p.evenSignChanges.map((x) => x.toFixed(3)).join(',')}] oddX=[${p.oddSignChanges.map((x) => x.toFixed(3)).join(',')}]`
      )
      if (c.oddCorePct !== undefined) {
        expect(Math.abs(oddCore - c.oddCorePct)).toBeLessThan(0.5)
      }
      if (c.oddCellPct !== undefined) {
        expect(Math.abs(oddCell - c.oddCellPct)).toBeLessThan(0.5)
      }
      expect(conv.nNeededTrue).toBe(c.nTrue)
      expect(conv.nNeededPseudo).toBe(c.nPseudo)
    }

    // Verifica esplicita dei cambi di segno in Γ banda 2 (1 cambio in x = 0 sulla parte dispari)
    const stG2 = solvePseudoCore1DAtK(0, params, 40)
    const rcG2 = computeCoreRadius(stG2.vectors[0], stG2.G, 0, params.a)
    const pG2 = parityDecomposition1D(stG2.vectors[2], stG2.G, 0, params.a, rcG2, 2001)
    expect(pG2.oddSignChanges).toHaveLength(1)
    expect(Math.abs(pG2.oddSignChanges[0])).toBeLessThan(1e-6)
    expect(pG2.evenSignChanges).toHaveLength(0)

    console.info('[pseudoCore1d parity table]\n' + lines.join('\n'))
  })

  it('segno continuo lungo le bande 1–3 su 81 punti (indici 0–80) al default e agli 8 estremi dei cursori', () => {
    const configs: PseudoCore1DParams[] = [params]
    for (const a of [3.5, 4.8]) {
      for (const v0 of [50, 75]) {
        for (const s of [0.2, 0.28]) {
          configs.push({ a, v0, s })
        }
      }
    }

    for (const cfg of configs) {
      const path = zonePath1D(cfg.a, 81)
      const { states } = pseudoCore1DBandsWithStates(cfg, path, 4, 40)
      expect(states).toHaveLength(81)
      for (let i = 0; i < states.length; i++) {
        // ψ_c(0) > 0 ovunque
        let sumCore = 0
        for (let m = 0; m < states[i].vectors[0].length; m++) sumCore += states[i].vectors[0][m]
        expect(sumCore).toBeGreaterThan(0)
        if (i > 0) {
          for (let b = 1; b <= 3; b++) {
            const ov = dot(states[i - 1].vectors[b], states[i].vectors[b])
            expect(ov).toBeGreaterThan(0)
          }
        }
      }
    }
  })
})
