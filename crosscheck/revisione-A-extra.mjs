import * as P from './physics_bundle.mjs'

console.log('=== A. Inflection-point noise in semiclassical.ts ===')
{
  const a = 4
  const fS = (k) => P.monoatomicEnergiesAt({ a, centerS: -5, centerP: 0, tS: 0.8, absTP: 0.8 }, k)[0]
  const kExact = Math.PI / (2 * a)
  const kNext = kExact + 1e-15
  console.log('TB exact pi/(2a): curv=', P.bandCurvature(fS, kExact), 'm*=', P.effectiveMassRatio(fS, kExact))
  console.log('TB +1e-15 rad/A: curv=', P.bandCurvature(fS, kNext), 'm*=', P.effectiveMassRatio(fS, kNext))
  // Check closest grid point on 201-pt path vs slightly off
  console.log('TB pi/(2a) + 0.005*(pi/a): curv=', P.bandCurvature(fS, kExact + 0.005 * (Math.PI / a)), 'm*=', P.effectiveMassRatio(fS, kExact + 0.005 * (Math.PI / a)))

  const pot = { a: 3, fourier: [-0.5] }
  const edge = Math.PI / 3
  const fNF = P.centralEquationBand(pot, 0, { planeWaves: 21, basisK: 0.5 * edge })
  let lo = 0.1, hi = edge * 0.99
  for (let it = 0; it < 60; it++) {
    const mid = 0.5 * (lo + hi)
    if (P.bandCurvature(fNF, mid) > 0) lo = mid
    else hi = mid
  }
  const kNF = 0.5 * (lo + hi)
  console.log('NF inflection bisected k=', kNF, 'curv=', P.bandCurvature(fNF, kNF), 'm*=', P.effectiveMassRatio(fNF, kNF))

  const spec = { variant: 'delta', a: 4, P: 4 }
  const edges = P.kronigPenneyBandEdges(spec, 3)
  const fKP = P.kronigPenneyBandFunction(spec, 0, edges)
  const hKP = Math.min(2e-3, 0.01 * (Math.PI / 4))
  lo = 0.1; hi = (Math.PI / 4) * 0.95
  for (let it = 0; it < 50; it++) {
    const mid = 0.5 * (lo + hi)
    if (P.bandCurvature(fKP, mid, hKP) > 0) lo = mid
    else hi = mid
  }
  const kKP = 0.5 * (lo + hi)
  console.log('KP inflection bisected: curv=', P.bandCurvature(fKP, kKP, hKP), 'm*=', P.effectiveMassRatio(fKP, kKP, hKP))

  const kpParams = { eg: 0.4, ep: 15 }
  lo = 0; hi = 0.12
  const fKpLh = (k) => P.twoBandStateAt(kpParams, k).energies[0]
  for (let it = 0; it < 60; it++) {
    const mid = 0.5 * (lo + hi)
    if (P.bandCurvature(fKpLh, mid) < 0) lo = mid
    else hi = mid
  }
  const kKp = 0.5 * (lo + hi)
  console.log('k.p 2-band lh inflection k=', kKp, 'curv=', P.bandCurvature(fKpLh, kKp), 'm*=', P.effectiveMassRatio(fKpLh, kKp))
  console.log('k.p 2-band exact twoBandMassBreakdown at kKp:', P.twoBandMassBreakdown(kpParams, 'lh', kKp).effectiveMassRatio)
}

console.log('\n=== B. EPM 51-PW vs 113-PW targeted cases ===')
{
  const cases = [
    { name: 'Si preset', a: 5.43, v3s: -0.21, v8s: 0.04, v11s: 0.08, v3a: 0, v4a: 0, v11a: 0 },
    { name: 'GaAs preset', a: 5.65, v3s: -0.252, v8s: 0.0, v11s: 0.08, v3a: 0.068, v4a: 0.066, v11a: 0.012 },
    { name: 'Si high-v11s', a: 5.43, v3s: -0.21, v8s: 0.04, v11s: 0.14, v3a: 0, v4a: 0, v11a: 0 },
    { name: 'Borderline Ge-like sym', a: 5.65, v3s: -0.27, v8s: 0.04, v11s: 0.035, v3a: 0, v4a: 0, v11a: 0 },
    { name: 'Weak v3s (small/neg gap)', a: 5.43, v3s: -0.10, v8s: 0.0, v11s: 0.02, v3a: 0, v4a: 0, v11a: 0 },
    { name: 'Si large a=6.2', a: 6.2, v3s: -0.21, v8s: 0.04, v11s: 0.08, v3a: 0, v4a: 0, v11a: 0 },
    { name: 'GaAs v8s=-0.06 v11s=0.02', a: 5.65, v3s: -0.25, v8s: -0.06, v11s: 0.02, v3a: 0.068, v4a: 0.066, v11a: 0.012 },
    { name: 'Flip test 1', a: 5.65, v3s: -0.25, v8s: -0.02, v11s: 0.14, v3a: 0, v4a: 0, v11a: 0 },
    { name: 'Flip test 2 (v3s=-0.24,v8s=0.06,v11s=0.0)', a: 5.65, v3s: -0.24, v8s: 0.06, v11s: 0.0, v3a: 0, v4a: 0, v11a: 0 },
    { name: 'Flip test 3 (a=5.65,v3s=-0.27,v8s=0.0,v11s=0.06)', a: 5.65, v3s: -0.27, v8s: 0.0, v11s: 0.06, v3a: 0, v4a: 0, v11a: 0 }
  ]
  for (const c of cases) {
    const p = { a: c.a, formFactors: c }
    const full = P.analyzeEpmBands(P.pseudopotentialBands(p, { gMaxSq: 21, pointsPerSegment: 40 }), undefined, 113)
    const fast = P.analyzeEpmBands(P.pseudopotentialBands(p, { gMaxSq: 11, pointsPerSegment: 10 }), undefined, 51)
    console.log(`${c.name}: FULL=(gap=${full.gap.toFixed(3)}, dir=${full.isDirect}, cbm=${full.cbmDescription}@${full.cbmSegmentFraction.toFixed(2)}, Γ=${full.ecGamma.toFixed(3)}, L=${full.ecL.toFixed(3)}, X=${full.ecX.toFixed(3)}) | FAST=(gap=${fast.gap.toFixed(3)}, dir=${fast.isDirect}, cbm=${fast.cbmDescription}@${fast.cbmSegmentFraction.toFixed(2)}, Γ=${fast.ecGamma.toFixed(3)}, L=${fast.ecL.toFixed(3)}, X=${fast.ecX.toFixed(3)})`)
  }
}

console.log('\n=== C. EPM directional kinematics at band crossing along L-G or G-X ===')
{
  const si = { a: 5.43, formFactors: { v3s: -0.21, v8s: 0.04, v11s: 0.08, v3a: 0, v4a: 0, v11a: 0 } }
  const bands = P.pseudopotentialBands(si, { gMaxSq: 21, pointsPerSegment: 40 })
  let crossings = []
  for (let b = 0; b < 5; b++) {
    for (let i = 1; i < bands.path.points.length - 1; i++) {
      if (i % 40 === 0) continue
      const gap = bands.energies[b + 1][i] - bands.energies[b][i]
      if (gap < 0.06) {
        const dir = P.epmSegmentDirection(bands.path, i)
        const k0 = P.epmDirectionalKinematics(si, bands.path.points[i], dir, b, 21)
        const k1 = P.epmDirectionalKinematics(si, bands.path.points[i], dir, b + 1, 21)
        crossings.push({ b, i, gap: +gap.toFixed(4), mLower: +k0.effectiveMassRatio.toFixed(3), mUpper: +k1.effectiveMassRatio.toFixed(3), curvL: +k0.curvature.toFixed(1), curvU: +k1.curvature.toFixed(1) })
      }
    }
  }
  console.log('Near crossings in Si (interior):', crossings.slice(0, 8))
}
