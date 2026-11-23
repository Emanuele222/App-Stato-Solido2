import { describe, expect, it } from 'vitest'
import {
  buildDynamicalMatrix3D,
  bvkGrid2D,
  classifySymmetryDirection,
  computeModeCounting3D,
  computePhonon3DDispersion,
  CRYSTALS_3D,
  defaultParamsForCrystal,
  eigh,
  fccHighSymmetryPath,
  macroscopicAluminumEstimate,
  phonon3DTab1Summary,
  solvePhonon3DAtK,
  type Crystal3DId
} from './index'

describe('phonon3d — matrice dinamica hermitiana 3p×3p e simmetrie 3D', () => {
  const crystals: readonly Crystal3DId[] = ['aluminum', 'diamond', 'pbte']

  it('costruisce matrici strettamente hermitiane e semidefinite positive su tutta la 1BZ', () => {
    for (const id of crystals) {
      const mat = CRYSTALS_3D[id]
      const base = defaultParamsForCrystal(id)
      const scale = (2 * Math.PI) / mat.a

      // Griglia 3D rappresentativa inclusi vertici e punti generici, più estremi dello slider C_T/C_L
      for (const r of [0.15, base.transverseRatio, 0.85]) {
        const params = { ...base, transverseRatio: r }
        for (const [qx, qy, qz] of [
          [0, 0, 0],
          [0.5, 0, 0],
          [1, 0, 0],
          [0.75, 0.75, 0],
          [0.5, 0.5, 0.5],
          [0.85, 0.4, 0],
          [0.37, 0.21, 0.63]
        ]) {
          const dyn = buildDynamicalMatrix3D([qx * scale, qy * scale, qz * scale], params)
          expect(dyn.n).toBe(3 * mat.basisCount)
          // eigh verifica internamente la simmetria/hermiticità entro 1e-12
          const { values } = eigh(dyn, { vectors: false })
          const scaleW2 = Math.max(1, values[values.length - 1] ?? 1)
          for (let s = 0; s < values.length; s++) {
            expect(values[s]).toBeGreaterThanOrEqual(-1e-12 * scaleW2)
          }
        }
      }
    }
  })

  it('soddisfa esattamente la regola di somma acustica: 3 autovalori nulli a Γ', () => {
    for (const id of crystals) {
      const params = defaultParamsForCrystal(id)
      const modes = solvePhonon3DAtK([0, 0, 0], params, [1, 0, 0])
      expect(modes.length).toBe(3 * CRYSTALS_3D[id].basisCount)
      const ac = modes.filter((m) => !m.isOptical)
      const opt = modes.filter((m) => m.isOptical)
      expect(ac.length).toBe(3)
      expect(opt.length).toBe(3 * (CRYSTALS_3D[id].basisCount - 1))
      for (const m of ac) {
        expect(m.omegaRadS).toBeLessThan(1e-3)
        expect(m.freqThz).toBeLessThan(1e-9)
      }
      for (const m of opt) {
        expect(m.freqThz).toBeGreaterThan(0.5)
      }
    }
  })

  it('riproduce esattamente i valori di riferimento di Tab. 1 (dispensa Parte 6, §14.4 p. 36)', () => {
    // 1. Alluminio (fcc, p = 1, a = 4,05 Å): a X, LA ≈ 40 meV (9,7 THz), TA₁,₂ ≈ 24 meV (5,8 THz)
    const alSum = phonon3DTab1Summary(defaultParamsForCrystal('aluminum'))
    expect(alSum.laAtXMev).toBeCloseTo(40.0, 2)
    expect(alSum.laAtXThz).toBeCloseTo(9.67, 1)
    expect(alSum.taAtXMev).toBeCloseTo(24.0, 2)
    expect(alSum.taAtXThz).toBeCloseTo(5.8, 1)
    expect(alSum.loAtGammaMev).toBeNull()
    expect(alSum.toAtGammaMev).toBeNull()

    // 2. Diamante (fcc base C–C, p = 2): ottici degeneri a Γ ≈ 160 meV (39 THz)
    const diaSum = phonon3DTab1Summary(defaultParamsForCrystal('diamond'))
    expect(diaSum.loAtGammaMev).toBeCloseTo(160.0, 2)
    expect(diaSum.toAtGammaMev).toBeCloseTo(160.0, 2)
    expect(diaSum.loAtGammaThz).toBeCloseTo(38.69, 1)
    expect(diaSum.loToSplitThz).toBeCloseTo(0, 6)

    // 3. PbTe (NaCl polare, p = 2): a Γ, LO ≈ 3,3 THz (14 meV), TO ≈ 1,1 THz (4,5 meV)
    const pbteSum = phonon3DTab1Summary(defaultParamsForCrystal('pbte'))
    expect(pbteSum.loAtGammaThz).toBeCloseTo(3.3, 2)
    expect(pbteSum.toAtGammaThz).toBeCloseTo(1.1, 2)
    expect(pbteSum.loAtGammaMev).toBeCloseTo(13.65, 1)
    expect(pbteSum.toAtGammaMev).toBeCloseTo(4.55, 1)
    expect(pbteSum.loToSplitThz).toBeCloseTo(2.2, 2)
  })

  it('impone degenerazione doppia di TA e TO lungo [100] (Γ–X) e [111] (Γ–L) per simmetria cubica', () => {
    for (const id of crystals) {
      const mat = CRYSTALS_3D[id]
      const params = defaultParamsForCrystal(id)
      const scale = (2 * Math.PI) / mat.a

      for (const q of [
        [0.45, 0, 0], // Γ–X ([100])
        [0.85, 0, 0], // Γ–X ([100])
        [0.25, 0.25, 0.25], // Γ–L ([111])
        [0.5, 0.5, 0.5] // L ([111])
      ] as const) {
        const modes = solvePhonon3DAtK([q[0] * scale, q[1] * scale, q[2] * scale], params)
        const ta1 = modes.find((m) => m.role === 'TA1')!
        const ta2 = modes.find((m) => m.role === 'TA2')!
        const la = modes.find((m) => m.role === 'LA')!
        expect(Math.abs(ta1.freqThz - ta2.freqThz)).toBeLessThan(1e-9)
        expect(la.longitudinalFraction).toBeCloseTo(1, 6)
        expect(ta1.longitudinalFraction).toBeLessThan(1e-6)
        expect(ta2.longitudinalFraction).toBeLessThan(1e-6)

        if (mat.basisCount === 2) {
          const to1 = modes.find((m) => m.role === 'TO1')!
          const to2 = modes.find((m) => m.role === 'TO2')!
          const lo = modes.find((m) => m.role === 'LO')!
          expect(Math.abs(to1.freqThz - to2.freqThz)).toBeLessThan(1e-9)
          expect(lo.longitudinalFraction).toBeCloseTo(1, 6)
          expect(to1.longitudinalFraction).toBeLessThan(1e-6)
          expect(to2.longitudinalFraction).toBeLessThan(1e-6)
        }
      }
    }
  })

  it('rimuove la degenerazione trasversale lungo [110] (K–Γ): tutti i 3p rami distinti', () => {
    for (const id of crystals) {
      const mat = CRYSTALS_3D[id]
      const params = defaultParamsForCrystal(id)
      const scale = (2 * Math.PI) / mat.a
      const k110: readonly [number, number, number] = [0.4 * scale, 0.4 * scale, 0]
      const modes = solvePhonon3DAtK(k110, params)

      const ta1 = modes.find((m) => m.role === 'TA1')!
      const ta2 = modes.find((m) => m.role === 'TA2')!
      expect(Math.abs(ta2.freqThz - ta1.freqThz)).toBeGreaterThan(0.05)

      if (mat.basisCount === 2) {
        const to1 = modes.find((m) => m.role === 'TO1')!
        const to2 = modes.find((m) => m.role === 'TO2')!
        expect(Math.abs(to2.freqThz - to1.freqThz)).toBeGreaterThan(0.01)

        // Verifica che tutti e 6 i rami di PbTe lungo [110] abbiano frequenze distinte
        if (id === 'pbte') {
          const sorted = [...modes].map((m) => m.freqThz).sort((a, b) => a - b)
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i + 1] - sorted[i]).toBeGreaterThan(0.01)
          }
        }
      }
    }
  })

  it('mostra polarizzazione mista (né puramente L né puramente T) lungo una direzione generica X–K', () => {
    const mat = CRYSTALS_3D.aluminum
    const scale = (2 * Math.PI) / mat.a
    // Punto intermedio su X–K: (0,875, 0,375, 0) · 2π/a
    const kGeneric: readonly [number, number, number] = [0.875 * scale, 0.375 * scale, 0]
    expect(classifySymmetryDirection(kGeneric)).toBe('generic')
    const modes = solvePhonon3DAtK(kGeneric, defaultParamsForCrystal('aluminum'))
    // Il modo fuori piano z è puramente trasversale (0), ma i due modi nel piano xy sono misti (0 < L < 1)
    const mixed = modes.filter((m) => m.longitudinalFraction > 0.02 && m.longitudinalFraction < 0.98)
    expect(mixed.length).toBe(2)
  })

  it('verifica lo sticking nonsimmetrico LA = LO al punto X nel diamante e continuità sul cammino Γ–X–K–Γ–L', () => {
    const disp = computePhonon3DDispersion(defaultParamsForCrystal('diamond'), 20)
    expect(disp.path.labels.map((l) => l.label)).toEqual(['Γ', 'X', 'K', 'Γ', 'L'])
    expect(disp.branches.length).toBe(6)
    const xIndex = disp.path.labels[1].index
    const atXModes = disp.modesAtPoint[xIndex]
    const laX = atXModes.find((m) => m.role === 'LA')!.energyMev
    const loX = atXModes.find((m) => m.role === 'LO')!.energyMev
    expect(Math.abs(loX - laX)).toBeLessThan(1e-6)

    // Nel PbTe i due passaggi per Γ (indice 0 e indice 3*20 = 60) hanno gli stessi autovalori
    const pbteDisp = computePhonon3DDispersion(defaultParamsForCrystal('pbte'), 20)
    const g0 = pbteDisp.path.labels[0].index
    const g1 = pbteDisp.path.labels[3].index
    for (const br of pbteDisp.branches) {
      expect(br.freqThz[g1]).toBeCloseTo(br.freqThz[g0], 6)
    }

    // Continuità liscia di tutti i rami globali e di ciascun segmento su default ed estremi slider
    for (const id of crystals) {
      const base = defaultParamsForCrystal(id)
      const configs = [
        base,
        { ...base, transverseRatio: 0.15 },
        { ...base, transverseRatio: 0.85 },
        ...(CRYSTALS_3D[id].basisCount === 2
          ? [
              { ...base, polarRatio: 1.0 },
              { ...base, polarRatio: 3.5 }
            ]
          : [])
      ]
      for (const cfg of configs) {
        const d = computePhonon3DDispersion(cfg, 40)
        const maxJumpAllowed = d.maxFreqThz * 0.06
        for (const br of d.branches) {
          for (let i = 1; i < br.freqThz.length; i++) {
            expect(Math.abs(br.freqThz[i] - br.freqThz[i - 1])).toBeLessThan(maxJumpAllowed)
          }
        }
        for (const seg of d.segments) {
          for (const sbr of seg.branches) {
            for (let i = 1; i < sbr.freqThz.length; i++) {
              expect(Math.abs(sbr.freqThz[i] - sbr.freqThz[i - 1])).toBeLessThan(maxJumpAllowed)
            }
          }
        }
        // Coerenza esatta tra branches[b].role e modesAtPoint[i][b].role
        for (let i = 0; i < d.path.points.length; i++) {
          for (let b = 0; b < d.branches.length; b++) {
            expect(d.modesAtPoint[i][b].role).toBe(d.branches[b].role)
          }
        }
      }
    }

    // Verifica near-Gamma nel Diamante (nessun mescolamento LO/TO a idx 1, 119, 121)
    const diaDisp = computePhonon3DDispersion(defaultParamsForCrystal('diamond'), 40)
    for (const idx of [1, 121]) {
      const to1 = diaDisp.modesAtPoint[idx].find((m) => m.role === 'TO1')!
      const to2 = diaDisp.modesAtPoint[idx].find((m) => m.role === 'TO2')!
      expect(Math.abs(to1.freqThz - to2.freqThz)).toBeLessThan(1e-9)
    }
  })

  it('costruisce il cammino fcc con lunghezze geometriche coerenti (Γ–X = 2π/a, Γ–L = √3·π/a)', () => {
    const a = 4.05
    const path = fccHighSymmetryPath(a, 10)
    const [lG0, lX, lK, lG1, lL] = path.labels
    const twoPiOverA = (2 * Math.PI) / a
    expect(path.distance[lX.index] - path.distance[lG0.index]).toBeCloseTo(twoPiOverA, 6)
    expect(path.distance[lG1.index] - path.distance[lK.index]).toBeCloseTo(
      Math.hypot(0.75, 0.75) * twoPiOverA,
      6
    )
    expect(path.distance[lL.index] - path.distance[lG1.index]).toBeCloseTo(
      Math.hypot(0.5, 0.5, 0.5) * twoPiOverA,
      6
    )
  })
})

describe('phonon3d — conteggio 3D Born–von Kármán (dispensa §14, Fig. 17)', () => {
  it('usa v_c = a³/4 per il reticolo fcc (mai a³) e rispetta p − 1 LO + 2(p − 1) TO', () => {
    const cAl = computeModeCounting3D(8, 1, 4.05)
    expect(cAl.primitiveCellVolumeFccAng3).toBeCloseTo(4.05 ** 3 / 4, 8)
    expect(cAl.primitiveCellsFcc).toBe(4 * 8 ** 3) // 2048 celle primitive fcc
    expect(cAl.primitiveCellsSimpleCubic).toBe(8 ** 3) // 512 per sc
    expect(cAl.grid2DPoints).toBe(64)
    expect(cAl.totalBranches).toBe(3)
    expect(cAl.acousticBranches).toBe(3)
    expect(cAl.opticalBranches).toBe(0)
    expect(cAl.loBranches).toBe(0)
    expect(cAl.toBranches).toBe(0)
    expect(cAl.totalModesFcc).toBe(3 * 2048)
    // Identità V_1BZ / ΔV_k = N_c
    expect(cAl.bzVolumeFccAngInv3 / cAl.deltaVkAngInv3).toBeCloseTo(cAl.primitiveCellsFcc, 8)

    // Test anche per p = 2 (Diamante / PbTe) e p = 3 (controllo correzione slide: p−1 = 2 LO, 2(p−1) = 4 TO!)
    const cP2 = computeModeCounting3D(8, 2, 6.46)
    expect(cP2.totalBranches).toBe(6)
    expect(cP2.opticalBranches).toBe(3)
    expect(cP2.loBranches).toBe(1)
    expect(cP2.toBranches).toBe(2)

    const cP3 = computeModeCounting3D(4, 3, 5.0)
    expect(cP3.totalBranches).toBe(9)
    expect(cP3.opticalBranches).toBe(6)
    expect(cP3.loBranches).toBe(2) // p - 1 = 2 (NON 1 come nelle slide!)
    expect(cP3.toBranches).toBe(4) // 2(p - 1) = 4 (NON 3p - 4 = 5 come nelle slide!)
    expect(cP3.acousticBranches + cP3.loBranches + cP3.toBranches).toBe(cP3.totalBranches)
  })

  it('riproduce la stima macroscopica di 1 cm³ di Al (dispensa §14.2 p. 35: N_c ≈ 6,0·10²², 3N_c ≈ 1,8·10²³)', () => {
    const est = macroscopicAluminumEstimate()
    expect(est.primitiveCells).toBeGreaterThan(5.9e22)
    expect(est.primitiveCells).toBeLessThan(6.15e22)
    expect(est.totalModes).toBeGreaterThan(1.78e23)
    expect(est.totalModes).toBeLessThan(1.85e23)
    expect(est.deltaKMInv).toBeCloseTo(200 * Math.PI, 4) // ≈ 628,3 m⁻¹
    expect(est.spacingRatio).toBeLessThan(1e-7)
  })

  it('genera esattamente N² punti contati nella griglia 2D di Fig. 17 (con copie vuote sul bordo per N pari)', () => {
    const g8 = bvkGrid2D(8)
    const counted8 = g8.filter((pt) => pt.counted)
    const ghosts8 = g8.filter((pt) => !pt.counted)
    expect(counted8.length).toBe(64)
    expect(ghosts8.length).toBe(17) // 9² - 8² = 17 copie sul bordo −π/a

    const g7 = bvkGrid2D(7)
    expect(g7.filter((pt) => pt.counted).length).toBe(49)
    expect(g7.filter((pt) => !pt.counted).length).toBe(0)
  })
})
