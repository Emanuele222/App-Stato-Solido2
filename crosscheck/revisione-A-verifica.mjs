import * as P from './physics_bundle.mjs'

function logSection(title) {
  console.log(`\n==================== ${title} ====================`)
}

// 1. LINALG COMPLEX HERMITIAN
logSection('1. linalg.ts eighComplexHermitian')
{
  // Simple deterministic PRNG
  let seed = 1337
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0xffffffff - 0.5
  }

  for (const n of [1, 2, 5, 15, 25]) {
    const Hre = new Float64Array(n * n)
    const Him = new Float64Array(n * n)
    for (let i = 0; i < n; i++) {
      Hre[i * n + i] = rand() * 10
      Him[i * n + i] = 0
      for (let j = i + 1; j < n; j++) {
        const re = rand() * 4
        const im = rand() * 4
        Hre[i * n + j] = re
        Hre[j * n + i] = re
        Him[i * n + j] = im
        Him[j * n + i] = -im
      }
    }
    const { values, vectors } = P.eigh({ kind: 'complex-hermitian', n, re: Hre, im: Him }, { vectors: true })
    const { values: valuesOnly } = P.eigh({ kind: 'complex-hermitian', n, re: Hre, im: Him }, { vectors: false })
    let maxValDiff = 0
    for (let k = 0; k < n; k++) maxValDiff = Math.max(maxValDiff, Math.abs(values[k] - valuesOnly[k]))
    let maxRes = 0
    let maxOrtho = 0
    for (let k = 0; k < n; k++) {
      const lam = values[k]
      const vk = P.eigenvector(vectors, k)
      // Check H v - lam v
      for (let i = 0; i < n; i++) {
        let sRe = 0
        let sIm = 0
        for (let j = 0; j < n; j++) {
          const hRe = Hre[i * n + j]
          const hIm = Him[i * n + j]
          const vRe = vk.re[j]
          const vIm = vk.im[j]
          sRe += hRe * vRe - hIm * vIm
          sIm += hRe * vIm + hIm * vRe
        }
        const diffRe = sRe - lam * vk.re[i]
        const diffIm = sIm - lam * vk.im[i]
        maxRes = Math.max(maxRes, Math.hypot(diffRe, diffIm))
      }
      // Orthonormality V^H V = I
      for (let l = 0; l < n; l++) {
        const vl = P.eigenvector(vectors, l)
        let dotRe = 0
        let dotIm = 0
        for (let i = 0; i < n; i++) {
          const aRe = vk.re[i]
          const aIm = vk.im[i]
          const bRe = vl.re[i]
          const bIm = vl.im[i]
          dotRe += aRe * bRe + aIm * bIm
          dotIm += aRe * bIm - aIm * bRe
        }
        const target = k === l ? 1 : 0
        maxOrtho = Math.max(maxOrtho, Math.hypot(dotRe - target, dotIm))
      }
    }
    console.log(`n=${n}: maxRes=${maxRes.toExponential(3)}, maxOrtho=${maxOrtho.toExponential(3)}, maxValDiff=${maxValDiff.toExponential(3)}`)
  }

  // Decoupled block + degeneracies (zero imaginary diagonal / zero subdiagonals)
  const n = 6
  const Hre = new Float64Array(n * n)
  const Him = new Float64Array(n * n)
  // Two identical 3x3 Hermitian blocks (triple/double degeneracies)
  for (const off of [0, 3]) {
    Hre[(off + 0) * n + (off + 0)] = 2
    Hre[(off + 1) * n + (off + 1)] = 2
    Hre[(off + 2) * n + (off + 2)] = -1
    Hre[(off + 0) * n + (off + 1)] = 0
    Him[(off + 0) * n + (off + 1)] = 1.5
    Hre[(off + 1) * n + (off + 0)] = 0
    Him[(off + 1) * n + (off + 0)] = -1.5
  }
  const resBlock = P.eigh({ kind: 'complex-hermitian', n, re: Hre, im: Him }, { vectors: true })
  console.log('Decoupled degenerate eigenvalues:', Array.from(resBlock.values).map((x) => x.toFixed(12)))
}

// 2. KRONIG-PENNEY
logSection('2. kronigPenney.ts continuity, narrow bands, wf norm, delta limit')
{
  const b = 4, c = 1, v0 = 10
  for (const dE of [-1e-12, -1e-14, 0, 1e-14, 1e-12]) {
    const val = P.kronigPenneyRectangularL(v0 + dE, b, c, v0)
    console.log(`L(V0 + ${dE}) = ${val.toPrecision(16)}`)
  }

  // Sweep extreme RECT_PARAMS
  const bs = [1.5, 2.5, 4.0, 6.0, 8.0]
  const cs = [0.05, 0.5, 1.0, 3.0, 5.0]
  const v0s = [0, 0.01, 5, 15, 30]
  let failCount = 0
  let narrowestW = Infinity
  let narrowestCase = null
  for (const bb of bs) {
    for (const cc of cs) {
      for (const vv of v0s) {
        try {
          const edges = P.kronigPenneyRectangularBandEdges(bb, cc, vv, 5)
          if (edges.length !== 5) {
            failCount++
            console.log(`FAIL length=${edges.length} for b=${bb},c=${cc},v0=${vv}`)
          }
          for (let i = 0; i < edges.length; i++) {
            const e = edges[i]
            if (!(e.lower <= e.upper) || e.width < 0) {
              failCount++
              console.log(`FAIL ordering band=${i} for b=${bb},c=${cc},v0=${vv}:`, e)
            }
            if (i > 0 && e.lower < edges[i - 1].upper - 1e-12) {
              failCount++
              console.log(`FAIL overlap band=${i} for b=${bb},c=${cc},v0=${vv}:`, edges[i - 1], e)
            }
            if (e.width < narrowestW) {
              narrowestW = e.width
              narrowestCase = { bb, cc, vv, band: i, width: e.width, lower: e.lower, upper: e.upper }
            }
          }
        } catch (err) {
          failCount++
          console.log(`THROW for b=${bb},c=${cc},v0=${vv}:`, err.message)
        }
      }
    }
  }
  console.log(`Grid sweep 125 combos: failCount=${failCount}, narrowestCase=`, narrowestCase)

  // Check bands near E = v0 (quasi-bound boundary)
  for (const [bb, cc, vv] of [[4, 2, 10], [6, 5, 30], [8, 5, 30], [3, 0.05, 30]]) {
    const edges = P.kronigPenneyRectangularBandEdges(bb, cc, vv, 5)
    console.log(`Edges (b=${bb}, c=${cc}, v0=${vv}):`, edges.map((e) => `[${e.lower.toFixed(6)}, ${e.upper.toFixed(6)}] (W=${e.width.toExponential(2)})`).join(' | '))
  }

  // Wavefunction normalization check (N=240 inside function vs high-res N=4000) & Bloch periodicity
  for (const [spec, kFrac, band] of [
    [{ variant: 'delta', a: 4, P: 30 }, 0.35, 0],
    [{ variant: 'delta', a: 4, P: 30 }, 0.0, 0],
    [{ variant: 'delta', a: 4, P: 30 }, 1.0, 1],
    [{ variant: 'rectangular', b: 4, c: 4, v0: 30 }, 0.4, 0],
    [{ variant: 'rectangular', b: 4, c: 4, v0: 30 }, 0.9, 1],
    [{ variant: 'rectangular', b: 1.5, c: 5, v0: 30 }, 0.5, 0]
  ]) {
    const a = P.kronigPenneyPeriod(spec)
    const k = kFrac * (Math.PI / a)
    const nHi = 4000
    const xsHi = Float64Array.from({ length: nHi }, (_, i) => ((i + 0.5) / nHi) * a)
    const dHi = P.kronigPenneyDensity1D(spec, k, band, xsHi)
    let sumHi = 0
    for (let i = 0; i < nHi; i++) sumHi += dHi[i]
    const meanHi = sumHi / nHi
    const dEdges = P.kronigPenneyDensity1D(spec, k, band, [0, 0.5 * a - 1e-9, 0.5 * a + 1e-9, a, 2 * a])
    console.log(`WF norm (${spec.variant} b/a=${spec.a ?? spec.b} k=${kFrac} band=${band}): mean(|psi|^2)_4000=${meanHi.toFixed(8)}, |psi(0)|^2=${dEdges[0].toFixed(6)}, |psi(a/2-)|^2=${dEdges[1].toFixed(6)}, |psi(a/2+)|^2=${dEdges[2].toFixed(6)}, |psi(a)|^2=${dEdges[3].toFixed(6)}, |psi(2a)|^2=${dEdges[4].toFixed(6)}`)
  }

  // Delta limit: P = m0 * a * (c * V0) / hbar^2 = (c * V0) * a / (2 * HBAR2_OVER_2M0)
  // Thus c * V0 = 2 * P * HBAR2_OVER_2M0 / a
  const aFix = 4, PFix = 4
  const cV0 = (2 * PFix * P.HBAR2_OVER_2M0) / aFix
  const deltaEdges = P.kronigPenneyDeltaBandEdges(aFix, PFix, 3)
  console.log('Delta a=4, P=4 edges:', deltaEdges.map((e) => `[${e.lower.toFixed(6)}, ${e.upper.toFixed(6)}]`).join(' | '))
  for (const cc of [0.5, 0.1, 0.01, 0.001]) {
    const bb = aFix - cc
    const vv = cV0 / cc
    const rEdges = P.kronigPenneyRectangularBandEdges(bb, cc, vv, 3)
    const maxDiff = Math.max(
      ...rEdges.map((e, i) => Math.max(Math.abs(e.lower - deltaEdges[i].lower), Math.abs(e.upper - deltaEdges[i].upper)))
    )
    console.log(`Rect -> Delta c=${cc}: maxEdgeDiff=${maxDiff.toExponential(3)} eV`)
  }
}

// 3. TIGHT BINDING
logSection('3. tightBinding.ts diatomic eigenvector, bonding, overlap N=2')
{
  const eA = -1.5, eB = 1.2, t = 0.8, a = 4.0
  for (const kFrac of [0, 0.37, 0.99, 1.0]) {
    const k = kFrac * (Math.PI / a)
    const st = P.diatomicStateAt({ eA, eB, t, a }, k)
    for (const [label, bIdx] of [
      ['minus', 0],
      ['plus', 1]
    ]) {
      const E = st.energies[bIdx]
      const { bA, bB, bA2, bB2 } = st.weights[bIdx]
      const v = -2 * t * Math.cos(0.5 * k * a)
      const r0Sym = (eA - E) * bA + v * bB
      const r1Sym = v * bA + (eB - E) * bB
      const norm = bA2 + bB2
      console.log(`Diatomic kFrac=${kFrac} ${label}: norm=${norm.toFixed(12)}, Hsym_res=(${Math.abs(r0Sym).toExponential(2)}, ${Math.abs(r1Sym).toExponential(2)}), bA=${bA.toFixed(4)}, bB=${bB.toFixed(4)}`)
    }
  }

  // Test diatomicWaveSamples at k=0 and k=pi/a (midpoint x = 0.25*a between A at 0 and B at 0.5a)
  const xs = Float64Array.from({ length: 101 }, (_, i) => (i / 100) * a)
  const wave0M = P.diatomicWaveSamples({ eA, eB, t, a }, 0, 0, xs)
  const wave0P = P.diatomicWaveSamples({ eA, eB, t, a }, 0, 1, xs)
  const wavePiM = P.diatomicWaveSamples({ eA, eB, t, a }, Math.PI / a, 0, xs)
  console.log(`Diatomic wave k=0 minus: A(0)=${wave0M.rePsi[0].toFixed(4)}, mid(0.25a)=${wave0M.rePsi[25].toFixed(4)}, B(0.5a)=${wave0M.rePsi[50].toFixed(4)}`)
  console.log(`Diatomic wave k=0 plus:  A(0)=${wave0P.rePsi[0].toFixed(4)}, mid(0.25a)=${wave0P.rePsi[25].toFixed(4)}, B(0.5a)=${wave0P.rePsi[50].toFixed(4)}`)
  console.log(`Diatomic wave k=pi/a minus: A(0)=${wavePiM.rePsi[0].toFixed(4)}, B(0.5a)=${wavePiM.rePsi[50].toFixed(4)}`)

  // Test fillBands on monoatomic when s and p bands overlap and N = 2
  const monoSpec = { a: 3.5, centerS: -5, centerP: -3.5, tS: 1.0, absTP: 1.0 }
  const path = P.zonePath1D(3.5, 201)
  const monoBands = P.tightBindingMonoatomicBands(monoSpec, path)
  const fillOverlap2 = P.fillBands(monoBands, 2)
  const fillOverlap1 = P.fillBands(monoBands, 1)
  console.log(`Monoatomic overlapping s & p (N=2): kind=${fillOverlap2.kind}, gap=${fillOverlap2.gap?.toFixed(6) ?? null}, Ef=${fillOverlap2.fermiLevel.toFixed(6)}, occ=${Array.from(fillOverlap2.occupations).map((x) => x.toFixed(3))}`)
  console.log(`Monoatomic overlapping s & p (N=1): kind=${fillOverlap1.kind}, Ef=${fillOverlap1.fermiLevel.toFixed(6)}, occ=${Array.from(fillOverlap1.occupations).map((x) => x.toFixed(3))}`)

  // Test fillBands on monoatomic when bands are inverted (centerS > centerP, non-overlapping, N=2)
  const monoInvSpec = { a: 3.5, centerS: -2, centerP: -6, tS: 0.4, absTP: 0.4 }
  const monoInvBands = P.tightBindingMonoatomicBands(monoInvSpec, path)
  const fillInv2 = P.fillBands(monoInvBands, 2)
  console.log(`Monoatomic INVERTED separated (N=2): kind=${fillInv2.kind}, gap=${fillInv2.gap}, Ef=${fillInv2.fermiLevel.toFixed(6)}, ho=${fillInv2.highestOccupied.toFixed(6)}, lu=${fillInv2.lowestUnoccupied.toFixed(6)}, occ=${Array.from(fillInv2.occupations).map((x) => x.toFixed(3))}`)
}

// 4. K DOT P
logSection('4. kDotP.ts exact two-band breakdown vs 4th-order diff & ep===eg')
{
  const eg = 1.42, ep = 22.0
  const twoP = { eg, ep }
  for (const k of [0, 0.02, 0.05, 0.12]) {
    const bdC = P.twoBandMassBreakdown(twoP, 'c', k)
    const bdLh = P.twoBandMassBreakdown(twoP, 'lh', k)
    // 4th order centered difference for d^2E/dk^2
    const h = 1e-5
    const fC = (kk) => P.twoBandStateAt(twoP, kk).energies[2]
    const fLh = (kk) => P.twoBandStateAt(twoP, kk).energies[0]
    const d2C = (-fC(k + 2 * h) + 16 * fC(k + h) - 30 * fC(k) + 16 * fC(k - h) - fC(k - 2 * h)) / (12 * h * h)
    const d2Lh = (-fLh(k + 2 * h) + 16 * fLh(k + h) - 30 * fLh(k) + 16 * fLh(k - h) - fLh(k - 2 * h)) / (12 * h * h)
    const invCNum = d2C / (2 * P.HBAR2_OVER_2M0)
    const invLhNum = d2Lh / (2 * P.HBAR2_OVER_2M0)
    console.log(`k=${k}: invMc exact=${bdC.totalInvMass.toFixed(8)} num=${invCNum.toFixed(8)}, invMlh exact=${bdLh.totalInvMass.toFixed(8)} num=${invLhNum.toFixed(8)}`)
  }
  const sing = P.twoBandMassBreakdown({ eg: 1.5, ep: 1.5 }, 'lh', 0)
  console.log('ep === eg singularity:', sing)
}

// 5. PSEUDOPOTENTIAL EPM
logSection('5. pseudopotential.ts Si & GaAs fast(51PW/10pts) vs full(113PW/40pts), kinematics at Gamma & inflection')
{
  console.log(`Constants: HBAR2_OVER_2M0=${P.HBAR2_OVER_2M0}, RYDBERG_EV=${P.RYDBERG_EV}`)
  const PRESETS = {
    si: { a: 5.43, formFactors: { v3s: -0.21, v8s: 0.04, v11s: 0.08, v3a: 0, v4a: 0, v11a: 0 } },
    gaas: { a: 5.65, formFactors: { v3s: -0.252, v8s: 0.0, v11s: 0.08, v3a: 0.068, v4a: 0.066, v11a: 0.012 } },
    gaas_sym: { a: 5.65, formFactors: { v3s: -0.252, v8s: 0.0, v11s: 0.08, v3a: 0, v4a: 0, v11a: 0 } }
  }
  for (const [presetId, params] of Object.entries(PRESETS)) {
    const fullBands = P.pseudopotentialBands(params, { gMaxSq: 21, pointsPerSegment: 40 })
    const fastBands = P.pseudopotentialBands(params, { gMaxSq: 11, pointsPerSegment: 10 })
    const fullPw = P.fccReciprocalVectors(21).length
    const fastPw = P.fccReciprocalVectors(11).length
    const full = P.analyzeEpmBands(fullBands, undefined, fullPw)
    const fast = P.analyzeEpmBands(fastBands, undefined, fastPw)
    console.log(`${presetId.toUpperCase()} FULL (N_PW=${full.planeWaves}, gMaxSq=21, 40pts): gap=${full.gap.toFixed(4)} eV, direct=${full.isDirect}, gapGamma=${(full.ecGamma - full.vbmEnergy).toFixed(4)}, cbm=${full.cbmDescription}(frac=${full.cbmSegmentFraction.toFixed(3)}, E=${full.cbmEnergy.toFixed(4)}), vbmIdx=${full.vbmIndex}(E=${full.vbmEnergy.toFixed(4)})`)
    console.log(`${presetId.toUpperCase()} FAST (N_PW=${fast.planeWaves}, gMaxSq=11, 10pts): gap=${fast.gap.toFixed(4)} eV, direct=${fast.isDirect}, gapGamma=${(fast.ecGamma - fast.vbmEnergy).toFixed(4)}, cbm=${fast.cbmDescription}(frac=${fast.cbmSegmentFraction.toFixed(3)}, E=${fast.cbmEnergy.toFixed(4)}), vbmIdx=${fast.vbmIndex}(E=${fast.vbmEnergy.toFixed(4)})`)
  }

  // Test directional kinematics at Gamma (index 40 = L-G/G-X junction, and index 200 = K-G end) on Si & GaAs
  for (const presetId of ['si', 'gaas']) {
    const params = PRESETS[presetId]
    const fullBands = P.pseudopotentialBands(params, { gMaxSq: 21, pointsPerSegment: 40 })
    console.log(`--- ${presetId.toUpperCase()} kinematics at Γ (idx 40 dir=[1,0,0] vs idx 200 dir=[-1,-1,0]/sqrt2) ---`)
    for (const idx of [40, 200]) {
      const dir = P.epmSegmentDirection(fullBands.path, idx)
      const kCart = fullBands.path.points[idx]
      for (const bandIdx of [1, 2, 3, 4]) {
        const kin = P.epmDirectionalKinematics(params, kCart, dir, bandIdx, 21)
        console.log(`  idx=${idx} band=${bandIdx}: E=${fullBands.energies[bandIdx][idx].toFixed(5)}, dE/dk=${kin.slope.toFixed(5)}, d2E/dk2=${kin.curvature.toFixed(5)}, m*/m0=${kin.effectiveMassRatio.toFixed(5)}`)
      }
    }
    // Find minimum |curvature| across all points on bands 0..4
    let minAbsCurv = Infinity
    let minInfo = null
    for (let b = 0; b < 5; b++) {
      for (let i = 0; i < fullBands.path.points.length; i++) {
        const dir = P.epmSegmentDirection(fullBands.path, i)
        const kin = P.epmDirectionalKinematics(params, fullBands.path.points[i], dir, b, 21)
        if (Math.abs(kin.curvature) < minAbsCurv) {
          minAbsCurv = Math.abs(kin.curvature)
          minInfo = { b, i, dist: fullBands.path.distance[i], curv: kin.curvature, mStar: kin.effectiveMassRatio }
        }
      }
    }
    console.log(`  smallest |curvature| in full grid:`, minInfo)
  }

  // Test metallic overlap (Vps = 0, empty lattice) in EPM
  const emptyParams = { a: 5.43, formFactors: { v3s: 0, v8s: 0, v11s: 0, v3a: 0, v4a: 0, v11a: 0 } }
  const emptyBands = P.pseudopotentialBands(emptyParams, { gMaxSq: 11, pointsPerSegment: 10 })
  const emptySummary = P.analyzeEpmBands(emptyBands, undefined, 51)
  console.log('EPM Vps=0 summary:', emptySummary)
}

// 6. INFLECTION POINT NUMERICAL NOISE TEST (semiclassical.ts)
logSection('6. semiclassical.ts m* at exact inflection points')
{
  // Tight binding: cos(ka) = 0 at k = pi/(2a)
  const a = 4, eS = -5, eP = 0, tS = 0.8, tP = -0.8
  const kInf = Math.PI / (2 * a)
  const fS = (k) => P.monoatomicEnergiesAt({ a, centerS: eS, centerP: eP, tS, absTP: -tP }, k)[0]
  const cS = P.bandCurvature(fS, kInf)
  const mS = P.effectiveMassRatio(fS, kInf)
  console.log(`TB inflection k=pi/(2a): curvature=${cS}, effectiveMassRatio=${mS}`)

  // Nearly free: find inflection point of band 0 and band 1 (e.g. a=3, V1=1.0)
  const pot = { a: 3, harmonics: [{ n: 1, v: 0.5 }] }
  const fNF = P.centralEquationBand(pot, 0, { planeWaves: 41 })
  // Scan for zero crossing of curvature
  const edge = Math.PI / 3
  let bestK = 0, bestC = Infinity
  for (let i = 1; i < 1000; i++) {
    const k = (i / 1000) * edge
    const c = P.bandCurvature(fNF, k)
    if (Math.abs(c) < Math.abs(bestC)) {
      bestC = c
      bestK = k
    }
  }
  console.log(`NF band 0 near inflection k=${bestK.toFixed(6)}: curvature=${bestC}, m*=${P.effectiveMassRatio(fNF, bestK)}`)

  // Kronig-Penney inflection with h = Math.min(2e-3, 0.01 * edge)
  const spec = { variant: 'delta', a: 4, P: 4 }
  const edges = P.kronigPenneyBandEdges(spec, 3)
  const fKP = P.kronigPenneyBandFunction(spec, 0, edges)
  const hKP = Math.min(2e-3, 0.01 * (Math.PI / 4))
  let kpBestK = 0, kpBestC = Infinity
  for (let i = 1; i < 500; i++) {
    const k = (i / 500) * (Math.PI / 4)
    const c = P.bandCurvature(fKP, k, hKP)
    if (Math.abs(c) < Math.abs(kpBestC)) {
      kpBestC = c
      kpBestK = k
    }
  }
  console.log(`KP delta band 0 near inflection k=${kpBestK.toFixed(6)}: curvature=${kpBestC}, m*=${P.effectiveMassRatio(fKP, kpBestK, hKP)}`)
}
