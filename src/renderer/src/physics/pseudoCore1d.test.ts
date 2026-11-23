import { describe, expect, it } from 'vitest'
import { zonePath1D } from './bandStructure'
import { emptyLatticeBands } from './freeElectron'
import { eigh } from './linalg'
import {
  buildPseudoHamiltonianWithF,
  cancellationMatrixElements,
  computeCoreRadius,
  planeWaveTailWeight,
  pseudoCore1DBands,
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

    // Benchmark di calcolo completo (bande 41 punti + stato a k)
    const t0 = performance.now()
    const path = zonePath1D(params.a, 41)
    pseudoCore1DBands(params, path, 4, 40)
    solvePseudoCore1DAtK(kpt, params, 40)
    const dt = performance.now() - t0
    console.info(`[pseudoCore1d timing] 41 k-points + state = ${dt.toFixed(1)} ms`)
    expect(dt).toBeLessThan(200)
  })
})
