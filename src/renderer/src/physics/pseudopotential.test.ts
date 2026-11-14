import { describe, expect, it } from 'vitest'
import { RYDBERG_EV } from './constants'
import {
  analyzeEpmBands,
  bareIonFourierAmplitudeEv,
  emptyLatticeFccBands,
  epmBrillouinPath,
  epmDirectionalKinematics,
  epmSegmentDirection,
  fccReciprocalVectors,
  fccShellCounts,
  pseudopotentialBands,
  pseudopotentialHamiltonian,
  pseudopotentialStateAt,
  realSpacePseudopotentialModel,
  screenedAshcroftFormFactorCurve,
  thomasFermiZeroLimitEv,
  type PseudopotentialParams
} from './pseudopotential'

/**
 * Piccolo lettore di file .npz non compressi (ZIP stored + formato .npy <f8),
 * scritto con i soli Uint8Array / DataView / TextDecoder standard (nessuna dipendenza).
 */
function parseUncompressedNpzFloat64(bytes: Uint8Array): Record<string, { shape: number[]; data: Float64Array }> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const latin1 = new TextDecoder('latin1')
  const utf8 = new TextDecoder('utf-8')

  let eocd = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('NPZ: EOCD ZIP non trovato')

  const totalEntries = view.getUint16(eocd + 10, true)
  let cdOff = view.getUint32(eocd + 16, true)
  const out: Record<string, { shape: number[]; data: Float64Array }> = {}

  for (let e = 0; e < totalEntries; e++) {
    if (view.getUint32(cdOff, true) !== 0x02014b50) throw new Error('NPZ: Central Directory header non valido')
    const compression = view.getUint16(cdOff + 10, true)
    if (compression !== 0) throw new Error(`NPZ: compressione non supportata (${compression})`)
    const uncompSize = view.getUint32(cdOff + 24, true)
    const nameLen = view.getUint16(cdOff + 28, true)
    const extraLen = view.getUint16(cdOff + 30, true)
    const commentLen = view.getUint16(cdOff + 32, true)
    const localOff = view.getUint32(cdOff + 42, true)
    const fileName = utf8.decode(bytes.subarray(cdOff + 46, cdOff + 46 + nameLen))
    cdOff += 46 + nameLen + extraLen + commentLen

    if (view.getUint32(localOff, true) !== 0x04034b50) throw new Error('NPZ: Local File Header non valido')
    const lfNameLen = view.getUint16(localOff + 26, true)
    const lfExtraLen = view.getUint16(localOff + 28, true)
    const dataStart = localOff + 30 + lfNameLen + lfExtraLen
    const npy = bytes.subarray(dataStart, dataStart + uncompSize)
    const npyView = new DataView(npy.buffer, npy.byteOffset, npy.byteLength)

    if (npy[0] !== 0x93 || latin1.decode(npy.subarray(1, 6)) !== 'NUMPY') {
      throw new Error(`NPY magic non valido in ${fileName}`)
    }
    const major = npy[6]
    const headerLen = major === 1 ? npyView.getUint16(8, true) : npyView.getUint32(8, true)
    const hdrOff = major === 1 ? 10 : 12
    const header = latin1.decode(npy.subarray(hdrOff, hdrOff + headerLen))
    const descrMatch = header.match(/'descr':\s*'([^']+)'/)
    const shapeMatch = header.match(/'shape':\s*\(([^)]*)\)/)
    if (!descrMatch || descrMatch[1] !== '<f8') {
      throw new Error(`NPY descr atteso <f8, trovato ${descrMatch?.[1]} in ${fileName}`)
    }
    const shape = shapeMatch
      ? shapeMatch[1]
          .split(',')
          .map((tok: string) => tok.trim())
          .filter(Boolean)
          .map(Number)
      : []

    const arrStart = hdrOff + headerLen
    const count = (npy.byteLength - arrStart) / 8
    const data = new Float64Array(count)
    for (let i = 0; i < count; i++) data[i] = npyView.getFloat64(arrStart + i * 8, true)
    out[fileName.replace(/\.npy$/, '')] = { shape, data }
  }
  return out
}

const SI_PARAMS: PseudopotentialParams = {
  a: 5.43,
  formFactors: { v3s: -0.21, v8s: 0.04, v11s: 0.08, v3a: 0, v4a: 0, v11a: 0 }
}

const GAAS_PARAMS: PseudopotentialParams = {
  a: 5.65,
  formFactors: { v3s: -0.252, v8s: 0, v11s: 0.08, v3a: 0.068, v4a: 0.066, v11a: 0.012 }
}

describe('pseudopotential: reticolo reciproco fcc, reticolo vuoto e stime di §4', () => {
  it('113 vettori reciproci con |G|² ≤ 21 e conteggi dei gusci 0, 3, 4, 8, 11', () => {
    const G = fccReciprocalVectors(21)
    expect(G.length).toBe(113)
    const counts = fccShellCounts(21)
    expect(counts.get(0)).toBe(1)
    expect(counts.get(3)).toBe(8)
    expect(counts.get(4)).toBe(6)
    expect(counts.get(8)).toBe(12)
    expect(counts.get(11)).toBe(24)
  })

  it('V_ps = 0 riproduce il reticolo vuoto fcc (in Γ: 1 stato a 0 eV e 8 stati a 3·E_0)', () => {
    const a = 5.43
    const empty = emptyLatticeFccBands(a)
    expect(empty.energies.length).toBe(8)
    expect(empty.path.points.length).toBe(201)

    const eZero = pseudopotentialBands(
      {
        a,
        formFactors: { v3s: 0, v8s: 0, v11s: 0, v3a: 0, v4a: 0, v11a: 0 }
      },
      { zeroAtValenceTop: false }
    )
    for (let b = 0; b < 8; b++) {
      for (let i = 0; i < 201; i++) {
        expect(eZero.energies[b][i]).toBeCloseTo(empty.energies[b][i], 10)
      }
    }

    // In Γ (indice 40), la 1ª banda è 0 eV e le bande 1..7 stanno tutte a 3·(ħ²/2m₀)(2π/a)²
    const unitE = 3.80998 * Math.pow((2 * Math.PI) / a, 2)
    const Hgamma = pseudopotentialHamiltonian(
      {
        a,
        formFactors: { v3s: 0, v8s: 0, v11s: 0, v3a: 0, v4a: 0, v11a: 0 }
      },
      [0, 0, 0],
      21
    )
    expect(Hgamma.kind).toBe('real-symmetric')
    expect(empty.energies[0][40]).toBeCloseTo(0, 12)
    for (let b = 1; b < 8; b++) {
      expect(empty.energies[b][40]).toBeCloseTo(3 * unitE, 10)
    }
  })

  it('ione nudo nel Si (a = 5,431 Å, Z = 14) vs fattore di forma |G|² = 3', () => {
    const v3 = bareIonFourierAmplitudeEv(5.431, 14, 3)
    const v8 = bareIonFourierAmplitudeEv(5.431, 14, 8)
    const v11 = bareIonFourierAmplitudeEv(5.431, 14, 11)
    expect(v3).toBeCloseTo(31.5, 1)
    expect(v8).toBeCloseTo(11.8, 1)
    expect(v11).toBeCloseTo(8.6, 1)
    expect(-0.211 * RYDBERG_EV).toBeCloseTo(-2.87, 1)
  })

  it('limite q → 0: v(0) = −⅔ E_F per Na (3,24 eV) e Al (11,7 eV)', () => {
    expect(thomasFermiZeroLimitEv(3.24)).toBeCloseTo(-2.16, 12)
    expect(thomasFermiZeroLimitEv(11.7)).toBeCloseTo(-7.8, 12)
  })
})

describe('pseudopotential: confronto con materiale/parte4/epm_bande.npz e numeri della dispensa', () => {
  it('confronta tutte le 8 bande × 201 punti di Si e GaAs con epm_bande.npz entro 10⁻³ eV', async () => {
    const nodeFsId = 'node:fs'
    const { readFileSync } = (await import(/* @vite-ignore */ nodeFsId)) as {
      readFileSync(p: URL): Uint8Array
    }
    const npzBytes = readFileSync(new URL('../../../../materiale/parte4/epm_bande.npz', import.meta.url))
    const ref = parseUncompressedNpzFloat64(npzBytes)
    expect(ref.Si.shape).toEqual([201, 8])
    expect(ref.GaAs.shape).toEqual([201, 8])

    const t0Si = performance.now()
    const siBands = pseudopotentialBands(SI_PARAMS)
    const dtSi = performance.now() - t0Si

    const t0GaAs = performance.now()
    const gaasBands = pseudopotentialBands(GAAS_PARAMS)
    const dtGaAs = performance.now() - t0GaAs

    const t0Fast = performance.now()
    pseudopotentialBands(GAAS_PARAMS, { gMaxSq: 11, pointsPerSegment: 14 })
    const dtFast = performance.now() - t0Fast

    console.log(
      `[EPM timing] Si full (113×201): ${dtSi.toFixed(1)} ms | GaAs full (113×201): ${dtGaAs.toFixed(1)} ms | GaAs ridotto: ${dtFast.toFixed(1)} ms`
    )

    const bSi = (2 * Math.PI) / SI_PARAMS.a
    for (let i = 0; i < 201; i++) {
      expect(siBands.path.distance[i] / bSi).toBeCloseTo(ref.x.data[i], 10)
    }

    let maxErrSi = 0
    let maxErrGaAs = 0
    for (let i = 0; i < 201; i++) {
      for (let b = 0; b < 8; b++) {
        const errSi = Math.abs(siBands.energies[b][i] - ref.Si.data[i * 8 + b])
        const errGaAs = Math.abs(gaasBands.energies[b][i] - ref.GaAs.data[i * 8 + b])
        if (errSi > maxErrSi) maxErrSi = errSi
        if (errGaAs > maxErrGaAs) maxErrGaAs = errGaAs
      }
    }
    expect(maxErrSi).toBeLessThan(1e-3)
    expect(maxErrGaAs).toBeLessThan(1e-3)

    // Si: gap ~0.8 eV indiretto con minimo a ~0.85 di ΓX, fondo valenza a −12.6 eV
    const siRaw = pseudopotentialBands(SI_PARAMS, { zeroAtValenceTop: false })
    const siSum = analyzeEpmBands(siBands, siRaw, 113)
    expect(siSum.isDirect).toBe(false)
    expect(siSum.cbmDescription).toBe('ΓX')
    expect(siSum.cbmSegmentFraction).toBeCloseTo(0.85, 2)
    expect(siSum.gap).toBeCloseTo(0.8, 1)
    expect(siSum.valenceBottom).toBeCloseTo(-12.6, 1)

    // GaAs: gap ~1.9 eV diretto in Γ
    const gaasRaw = pseudopotentialBands(GAAS_PARAMS, { zeroAtValenceTop: false })
    const gaasSum = analyzeEpmBands(gaasBands, gaasRaw, 113)
    expect(gaasSum.isDirect).toBe(true)
    expect(gaasSum.cbmDescription).toBe('Γ')
    expect(gaasSum.gap).toBeCloseTo(1.9, 1)
  })

  it('pesi per guscio |c_G|² sommano a 1 nello stato scelto e curve di modello sono ben definite', () => {
    const path = epmBrillouinPath(GAAS_PARAMS.a, 40)
    const state = pseudopotentialStateAt(GAAS_PARAMS, path.points[40], 4, 21, 8)
    const sumW = state.shellWeights.reduce((acc, s) => acc + s.weight, 0)
    expect(sumW).toBeCloseTo(1, 10)

    const ffCurve = screenedAshcroftFormFactorCurve(5.43)
    expect(ffCurve.vRy[0]).toBeCloseTo(ffCurve.v0Ry, 10)
    expect(ffCurve.vRy[0]).toBeLessThan(0)

    const rs = realSpacePseudopotentialModel()
    expect(rs.bareIon.length).toBe(rs.softCore.length)
    expect(rs.truePsi[0]).toBeCloseTo(rs.smoothPsi[0], 12)

    // Massa efficace direzionale del GaAs in Γ nella prima banda di conduzione (banda 4)
    const kin = epmDirectionalKinematics(GAAS_PARAMS, path.points[40], epmSegmentDirection(path, 40), 4, 21)
    expect(kin.slope).toBeCloseTo(0, 2)
    expect(kin.effectiveMassRatio).toBeGreaterThan(0.05)
    expect(kin.effectiveMassRatio).toBeLessThan(0.2)
  })
})
