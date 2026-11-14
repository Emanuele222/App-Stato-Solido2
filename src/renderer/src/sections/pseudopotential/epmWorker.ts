/**
 * Web Worker per il calcolo completo EPM (113 onde piane × 201 punti) fuori dal
 * thread principale: in JS puro ~0,8–1,0 s restano così impercettibili in UI.
 */
import {
  analyzeEpmBands,
  fccReciprocalVectors,
  pseudopotentialBands,
  type EpmBandSummary,
  type EpmFormFactors,
  type KPath
} from '../../physics'

export interface EpmWorkerRequest {
  readonly id: number
  readonly a: number
  readonly formFactors: EpmFormFactors
  readonly gMaxSq: number
  readonly pointsPerSegment: number
  readonly numBands: number
}

export interface EpmWorkerResponse {
  readonly id: number
  readonly path: KPath
  readonly energies: readonly Float64Array[]
  readonly summary: EpmBandSummary
  readonly elapsedMs: number
}

self.onmessage = (ev: MessageEvent<EpmWorkerRequest>): void => {
  const { id, a, formFactors, gMaxSq, pointsPerSegment, numBands } = ev.data
  const t0 = performance.now()
  const raw = pseudopotentialBands({ a, formFactors }, { gMaxSq, pointsPerSegment, numBands, zeroAtValenceTop: false })
  let vbm = -Infinity
  for (let i = 0; i < raw.energies[3].length; i++) {
    if (raw.energies[3][i] > vbm) vbm = raw.energies[3][i]
  }
  const shiftedEnergies = raw.energies.map((band) => {
    const out = new Float64Array(band.length)
    for (let i = 0; i < band.length; i++) out[i] = band[i] - vbm
    return out
  })
  const nPw = fccReciprocalVectors(gMaxSq).length
  const summary = analyzeEpmBands({ method: 'pseudopotential', path: raw.path, energies: shiftedEnergies }, raw, nPw)
  const elapsedMs = performance.now() - t0

  const res: EpmWorkerResponse = {
    id,
    path: raw.path,
    energies: shiftedEnergies,
    summary,
    elapsedMs
  }
  self.postMessage(res)
}
