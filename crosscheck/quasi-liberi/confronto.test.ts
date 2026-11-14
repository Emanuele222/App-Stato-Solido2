import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  blochDensity1D,
  centralEquationBand,
  directGap1D,
  fillBands,
  freeElectronEnergy,
  groupVelocity,
  inverseEffectiveMassRatio,
  nearlyFreeBands,
  solveCentralEquation1D,
  twoWaveEnergies,
  zoneBoundaryEnergy,
  zoneEdgeStandingWave,
  zonePath1D
} from '../../src/renderer/src/physics/index'
import {
  computeFermi1D,
  effectiveMassRatioAtK,
  probabilityDensity,
  solveCentral1D,
  velocityAtK
} from './solve.mjs'

interface ComparisonRow {
  grandezza: string
  mioValore: number | string
  valoreApp: number | string
  valoreDispensa: string
  diffAssoluta: number | string
  diffRelativa: number | string
}

const rows: ComparisonRow[] = []

function addRow(
  grandezza: string,
  mio: number | string,
  app: number | string,
  dispensa = '—'
): void {
  if (typeof mio === 'number' && typeof app === 'number') {
    const absDiff = app - mio
    const denom = Math.max(Math.abs(mio), Math.abs(app))
    const relDiff = denom > 0 ? Math.abs(absDiff) / denom : 0
    rows.push({
      grandezza,
      mioValore: mio,
      valoreApp: app,
      valoreDispensa: dispensa,
      diffAssoluta: absDiff,
      diffRelativa: relDiff
    })
  } else {
    rows.push({
      grandezza,
      mioValore: mio,
      valoreApp: app,
      valoreDispensa: dispensa,
      diffAssoluta: mio === app ? '0' : 'diverso',
      diffRelativa: mio === app ? '0' : 'diverso'
    })
  }
}

describe('Parte B e C: confronto indipendente vs src/renderer/src/physics', () => {
  const a = 3
  const vG = -0.5
  const edge = Math.PI / a
  const E0 = zoneBoundaryEnergy(a)

  it('1. Prime quattro bande in k = 0, pi/(2a), pi/a (15 e 41 onde piane)', () => {
    for (const nPW of [15, 41]) {
      for (const [label, k] of [
        ['0', 0],
        ['pi/2a', Math.PI / (2 * a)],
        ['pi/a', edge]
      ] as const) {
        const ref = solveCentral1D({ a, k, vG, v2G: 0, nPW })
        const app = solveCentralEquation1D({ a, fourier: [vG] }, k, { planeWaves: nPW })
        for (let b = 0; b < 4; b++) {
          addRow(
            `Banda ${b + 1} (k=${label}, ${nPW} PW) [eV]`,
            ref.eigenvalues[b],
            app.energies[b],
            b < 2 && label === 'pi/a' ? `~E0±|V_G|` : '—'
          )
          expect(app.energies[b]).toBeCloseTo(ref.eigenvalues[b], 10)
        }
      }
    }
  })

  it('2. Gap in pi/a confrontato con 2|V_G|', () => {
    for (const nPW of [15, 41]) {
      const ref = solveCentral1D({ a, k: edge, vG, v2G: 0, nPW })
      const appGap = directGap1D({ a, fourier: [vG] }, edge, 0, { planeWaves: nPW })
      addRow(`Gap in pi/a (${nPW} PW) [eV]`, ref.eigenvalues[1] - ref.eigenvalues[0], appGap.width, '1 (2|V_G|)')
      expect(appGap.width).toBeCloseTo(ref.eigenvalues[1] - ref.eigenvalues[0], 12)
    }
  })

  it('3. m0/m* al bordo di zona per banda superiore e inferiore', () => {
    for (const nPW of [15, 41]) {
      const refLower = effectiveMassRatioAtK({ a, k: edge, vG, v2G: 0, nPW }, 0)
      const refUpper = effectiveMassRatioAtK({ a, k: edge, vG, v2G: 0, nPW }, 1)
      const appLowerFn = centralEquationBand({ a, fourier: [vG] }, 0, { planeWaves: nPW, basisK: edge })
      const appUpperFn = centralEquationBand({ a, fourier: [vG] }, 1, { planeWaves: nPW, basisK: edge })
      const appLower = inverseEffectiveMassRatio(appLowerFn, edge)
      const appUpper = inverseEffectiveMassRatio(appUpperFn, edge)
      addRow(`m0/m* banda 1 inf (${nPW} PW)`, refLower.m0OverM_kp, appLower, '—')
      addRow(`m0/m* banda 2 sup (${nPW} PW)`, refUpper.m0OverM_kp, appUpper, '17,731 (P4 §3.2)')
      // Differenze finite app (h=1e-4, 3pt) vs k.p esatto
      expect(Math.abs(appLower - refLower.m0OverM_kp) / Math.abs(refLower.m0OverM_kp)).toBeLessThan(1e-5)
      expect(Math.abs(appUpper - refUpper.m0OverM_kp) / Math.abs(refUpper.m0OverM_kp)).toBeLessThan(1e-5)
    }
  })

  it('4. |psi|^2 in x = 0 e x = a/2 al bordo, normalizzata a media 1, V_G < 0 e V_G > 0', () => {
    for (const vSign of [-0.5, 0.5]) {
      const ref = solveCentral1D({ a, k: edge, vG: vSign, v2G: 0, nPW: 41 })
      const app = solveCentralEquation1D({ a, fourier: [vSign] }, edge, { planeWaves: 41 })
      for (const band of [0, 1]) {
        const ref0 = probabilityDensity(ref.eigenvectors[band], ref.gIndices, a, edge, 0)
        const refHalf = probabilityDensity(ref.eigenvectors[band], ref.gIndices, a, edge, a / 2)
        const appRho = blochDensity1D(app, band, [0, a / 2])
        addRow(`|psi|^2(x=0) banda ${band + 1}, V_G=${vSign}`, ref0, appRho[0], band === (vSign < 0 ? 0 : 1) ? '~2' : '0')
        addRow(
          `|psi|^2(x=a/2) banda ${band + 1}, V_G=${vSign}`,
          refHalf,
          appRho[1],
          band === (vSign < 0 ? 0 : 1) ? '0' : '~2'
        )
        expect(appRho[0]).toBeCloseTo(ref0, 11)
        expect(appRho[1]).toBeCloseTo(refHalf, 11)
      }
      expect(zoneEdgeStandingWave(app, 0)).toBe(vSign < 0 ? 'c' : 's')
      expect(zoneEdgeStandingWave(app, 1)).toBe(vSign < 0 ? 's' : 'c')
    }
  })

  it('5. Velocita v = (1/hbar) dE/dk in m/s al bordo e elettrone libero k = 1 A^-1', () => {
    const refEdge0 = velocityAtK({ a, k: edge, vG, v2G: 0, nPW: 41 }, 0)
    const refEdge1 = velocityAtK({ a, k: edge, vG, v2G: 0, nPW: 41 }, 1)
    const appEdge0 = groupVelocity(centralEquationBand({ a, fourier: [vG] }, 0, { planeWaves: 41, basisK: edge }), edge)
    const appEdge1 = groupVelocity(centralEquationBand({ a, fourier: [vG] }, 1, { planeWaves: 41, basisK: edge }), edge)
    addRow('v bordo banda 1 [m/s]', refEdge0.v_ms_HF, appEdge0, '0')
    addRow('v bordo banda 2 [m/s]', refEdge1.v_ms_HF, appEdge1, '0')
    expect(Math.abs(appEdge0)).toBeLessThan(1e-2)
    expect(Math.abs(appEdge1)).toBeLessThan(1e-2)

    const refFree = velocityAtK({ a, k: 1.0, vG: 0, v2G: 0, nPW: 41 }, 0)
    const appFree = groupVelocity(freeElectronEnergy, 1.0)
    addRow('v elettrone libero (k=1 A^-1) [m/s]', refFree.v_ms_HF, appFree, '—')
    expect(Math.abs(appFree - refFree.v_ms_HF) / refFree.v_ms_HF).toBeLessThan(1e-9)
  })

  it('6. Livello di Fermi e classificazione per 1, 2, 3, 4 elettroni per cella', () => {
    const path401 = zonePath1D(a, 401)
    const bs401 = nearlyFreeBands({ a, fourier: [vG] }, path401, { planeWaves: 41, bands: 4 })
    const path2001 = zonePath1D(a, 2001)
    const bs2001 = nearlyFreeBands({ a, fourier: [vG] }, path2001, { planeWaves: 41, bands: 4 })

    for (const nEl of [1, 2, 3, 4]) {
      const ref = computeFermi1D({ a, vG, v2G: 0, nPW: 41, nElectronsPerCell: nEl, nK: 2000 })
      const refEf = 'fermiEnergy_exact_kF' in ref ? ref.fermiEnergy_exact_kF! : ref.fermiEnergy!
      const refClass = ref.classification === 'isolante' ? 'insulator' : 'metal'

      const app401 = fillBands(bs401, nEl)
      const app2001 = fillBands(bs2001, nEl)

      addRow(`E_F (n=${nEl}, griglia 401) [eV]`, refEf, app401.fermiLevel, '—')
      addRow(`E_F (n=${nEl}, griglia 2001) [eV]`, refEf, app2001.fermiLevel, '—')
      addRow(`Classificazione (n=${nEl})`, refClass, app401.kind, nEl % 2 === 1 ? 'metallo' : 'isolante')

      expect(app401.kind).toBe(refClass)
      expect(app2001.kind).toBe(refClass)
      expect(app2001.fermiLevel).toBeCloseTo(refEf, 2)
    }
  })

  it('7. Due armoniche V_G = 0,45*E0 e V_2G = 0,3*E0 (15 e 41 onde piane)', () => {
    const vG2 = 0.45 * E0
    const v2G2 = 0.3 * E0
    for (const nPW of [15, 41]) {
      const refEdge = solveCentral1D({ a, k: edge, vG: vG2, v2G: v2G2, nPW })
      const refGamma = solveCentral1D({ a, k: 0, vG: vG2, v2G: v2G2, nPW })
      const appGapEdge = directGap1D({ a, fourier: [vG2, v2G2] }, edge, 0, { planeWaves: nPW })
      const appGapGamma = directGap1D({ a, fourier: [vG2, v2G2] }, 0, 1, { planeWaves: nPW })
      addRow(
        `2 armoniche: gap pi/a (${nPW} PW) [eV]`,
        refEdge.eigenvalues[1] - refEdge.eigenvalues[0],
        appGapEdge.width,
        '—'
      )
      addRow(
        `2 armoniche: gap k=0 bande 2-3 (${nPW} PW) [eV]`,
        refGamma.eigenvalues[2] - refGamma.eigenvalues[1],
        appGapGamma.width,
        '—'
      )
      expect(appGapEdge.width).toBeCloseTo(refEdge.eigenvalues[1] - refEdge.eigenvalues[0], 11)
      expect(appGapGamma.width).toBeCloseTo(refGamma.eigenvalues[2] - refGamma.eigenvalues[1], 11)
    }
  })

  it('Parte C: casi limite e stress test agli estremi degli slider', () => {
    // 1. Estremi slider: a in [2.5, 6], V_G in [-3, 3], V_2G in [-1.5, 1.5]
    for (const aExt of [2.5, 6.0]) {
      for (const vGExt of [-3.0, 0, 3.0]) {
        for (const v2GExt of [-1.5, 0, 1.5]) {
          for (const kTest of [0, Math.PI / (2 * aExt), Math.PI / aExt]) {
            const ref = solveCentral1D({ a: aExt, k: kTest, vG: vGExt, v2G: v2GExt, nPW: 41 })
            const app = solveCentralEquation1D({ a: aExt, fourier: [vGExt, v2GExt] }, kTest, { planeWaves: 41 })
            for (let b = 0; b < 5; b++) {
              expect(Math.abs(app.energies[b] - ref.eigenvalues[b])).toBeLessThan(1e-10)
            }
          }
        }
      }
    }

    // 2. Test specifico: potenziale forte (a = 6, V_G = -3) con 11 onde piane -> verifica parita e zoneEdgeStandingWave
    const strongSol11 = solveCentralEquation1D({ a: 6, fourier: [-3] }, Math.PI / 6, { planeWaves: 11 })
    const strongDensity11 = blochDensity1D(strongSol11, 0, [0, 3])
    const strongSol41 = solveCentralEquation1D({ a: 6, fourier: [-3] }, Math.PI / 6, { planeWaves: 41 })
    const strongDensity41 = blochDensity1D(strongSol41, 0, [0, 3])

    // 3. Test specifico: V_G molto piccolo (V_G = -0.001, -0.01, -0.05 eV, a = 3 A) -> accuratezza della differenza finita h = 1e-4 per massa efficace!
    const smallGapChecks = [-0.001, -0.01, -0.05].map((vSmall) => {
      const refSmall = effectiveMassRatioAtK({ a: 3, k: Math.PI / 3, vG: vSmall, v2G: 0, nPW: 41 }, 1, 1e-6)
      const appSmallFn = centralEquationBand({ a: 3, fourier: [vSmall] }, 1, { planeWaves: 41, basisK: Math.PI / 3 })
      const appSmallDefault = inverseEffectiveMassRatio(appSmallFn, Math.PI / 3) // h = 1e-4
      const appSmallFine = inverseEffectiveMassRatio(appSmallFn, Math.PI / 3, 1e-6)
      return {
        vG_eV: vSmall,
        exact_kp_m0_over_m: refSmall.m0OverM_kp,
        app_default_h1e4: appSmallDefault,
        app_fine_h1e6: appSmallFine,
        relError_default_h1e4: Math.abs(appSmallDefault - refSmall.m0OverM_kp) / Math.abs(refSmall.m0OverM_kp)
      }
    })

    // 3b. Massa efficace con 11 onde piane (usata in convergence.test.ts)
    const upper11Fn = centralEquationBand({ a: 3, fourier: [-0.5] }, 1, { planeWaves: 11, basisK: Math.PI / 3 })
    const upper11Mass = inverseEffectiveMassRatio(upper11Fn, Math.PI / 3)

    // 3c. fillBands con due armoniche e n=4
    const twoHarmPath = zonePath1D(3, 401)
    const twoHarmBands = nearlyFreeBands({ a: 3, fourier: [0.45 * E0, 0.3 * E0] }, twoHarmPath, {
      planeWaves: 41,
      bands: 4
    })
    const twoHarmFill4 = fillBands(twoHarmBands, 4)

    // 4. Test specifico: k fuori dalla prima zona (es. k = 3*pi/a, schema esteso)
    const kExt = (3 * Math.PI) / 3
    const refExt = solveCentral1D({ a: 3, k: kExt, vG: -0.5, v2G: 0, nPW: 41 })
    const appExt = solveCentralEquation1D({ a: 3, fourier: [-0.5] }, kExt, { planeWaves: 41 })
    // Nota: per k = 3*pi/a, planeWaveBasis1D si centra attorno a n0 = -round(1.5) = -2 o -1, quindi la banda 0 coincide con k = pi/a!
    const appEdge = solveCentralEquation1D({ a: 3, fourier: [-0.5] }, Math.PI / 3, { planeWaves: 41 })
    expect(appExt.energies[0]).toBeCloseTo(appEdge.energies[0], 11)
    expect(appExt.energies[1]).toBeCloseTo(appEdge.energies[1], 11)

    // 5. Test twoWaveEnergies per k' = k - G
    const tw = twoWaveEnergies(Math.PI / a, Math.PI / a - (2 * Math.PI) / a, -0.5)
    expect(tw.lower).toBeCloseTo(E0 - 0.5, 12)
    expect(tw.upper).toBeCloseTo(E0 + 0.5, 12)

    const diagnostics = {
      strongPotential_a6_vGneg3_11pw_vs_41pw: {
        E0_eV: zoneBoundaryEnergy(6),
        band0_11pw: strongSol11.energies[0],
        band0_41pw: strongSol41.energies[0],
        psi2_at_0_11pw: strongDensity11[0],
        psi2_at_a2_11pw: strongDensity11[1],
        psi2_at_0_41pw: strongDensity41[0],
        psi2_at_a2_41pw: strongDensity41[1],
        standingWave_11pw: zoneEdgeStandingWave(strongSol11, 0)
      },
      smallGapEffectiveMass_a3: smallGapChecks,
      effMass11PW_a3_vGneg0_5: upper11Mass,
      twoHarmonics_fill4: {
        kind: twoHarmFill4.kind,
        fermiLevel: twoHarmFill4.fermiLevel,
        gap: twoHarmFill4.gap
      },
      extendedK_3pi_over_a: {
        app_band0_at_3pi_over_a: appExt.energies[0],
        app_band0_at_pi_over_a: appEdge.energies[0],
        solveCentral1D_naive_center_band0: refExt.eigenvalues[0]
      }
    }

    const outDir = join(process.cwd(), 'crosscheck', 'quasi-liberi')
    writeFileSync(
      join(outDir, 'confronto.json'),
      JSON.stringify({ rows, diagnostics }, null, 2) + '\n',
      'utf8'
    )
  })
})
