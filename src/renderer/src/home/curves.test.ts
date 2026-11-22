import { describe, expect, it } from 'vitest'
import {
  computeAllPreviewCurves,
  computePhononPreviewCurves,
  computePhononRestingCurves,
  computeRestingCurves,
  getPhononPreviewCurves,
  getPhononRestingCurves,
  getPreviewCalculationTimeMs,
  getPreviewCurves,
  getRestingCurves
} from './curves'

describe('home/curves: preparazione curve anteprima e miniatura', () => {
  it('produce esattamente 6 serie di curve per i 6 metodi', () => {
    const series = computeAllPreviewCurves()
    expect(series).toHaveLength(6)

    const ids = series.map((s) => s.id)
    expect(ids).toEqual([
      'empty-lattice',
      'kronig-penney',
      'nearly-free',
      'tight-binding',
      'k-dot-p',
      'pseudopotential'
    ])
  })

  it('tutte le 6 serie hanno valori numerici finiti, ascisse [0, 1] e bande ordinate in energia', () => {
    const series = computeAllPreviewCurves()

    for (const method of series) {
      expect(method.bands.length).toBeGreaterThanOrEqual(2)
      expect(Number.isFinite(method.eMin)).toBe(true)
      expect(Number.isFinite(method.eMax)).toBe(true)
      expect(method.eMin).toBeLessThan(method.eMax)
      expect(method.kNormalized.length).toBeGreaterThanOrEqual(10)

      // Verifica kNormalized compreso tra 0 e 1, monotono crescente
      for (let i = 0; i < method.kNormalized.length; i++) {
        const k = method.kNormalized[i]
        expect(Number.isFinite(k)).toBe(true)
        expect(k).toBeGreaterThanOrEqual(-1e-12)
        expect(k).toBeLessThanOrEqual(1 + 1e-12)
        if (i > 0) {
          expect(k).toBeGreaterThanOrEqual(method.kNormalized[i - 1])
        }
      }

      // Verifica che ogni valore di energia sia finito
      const numK = method.kNormalized.length
      for (let b = 0; b < method.bands.length; b++) {
        const band = method.bands[b]
        expect(band.length).toBe(numK)
        for (let i = 0; i < numK; i++) {
          const val = band[i]
          expect(Number.isFinite(val)).toBe(true)
        }
      }

      // Verifica ordinamento delle bande in energia: E_b(k) <= E_{b+1}(k)
      for (let b = 0; b < method.bands.length - 1; b++) {
        const lowerBand = method.bands[b]
        const upperBand = method.bands[b + 1]
        for (let i = 0; i < numK; i++) {
          expect(lowerBand[i]).toBeLessThanOrEqual(upperBand[i] + 1e-9)
        }
      }
    }
  })

  it('la curva a riposo ha valori finiti ed energie ordinate con gap', () => {
    const resting = computeRestingCurves()
    expect(resting.bands.length).toBe(2)
    expect(Number.isFinite(resting.eMin)).toBe(true)
    expect(Number.isFinite(resting.eMax)).toBe(true)
    expect(resting.eMin).toBeLessThan(resting.eMax)

    const numK = resting.kNormalized.length
    for (let b = 0; b < resting.bands.length; b++) {
      const band = resting.bands[b]
      expect(band.length).toBe(numK)
      for (let i = 0; i < numK; i++) {
        expect(Number.isFinite(band[i])).toBe(true)
      }
    }

    for (let b = 0; b < resting.bands.length - 1; b++) {
      for (let i = 0; i < numK; i++) {
        expect(resting.bands[b][i]).toBeLessThanOrEqual(resting.bands[b + 1][i] + 1e-9)
      }
    }
  })

  it('getPreviewCurves memorizza i risultati e misura il tempo di calcolo', () => {
    const first = getPreviewCurves()
    const time = getPreviewCalculationTimeMs()
    expect(first).toHaveLength(6)
    expect(time).toBeGreaterThanOrEqual(0)
    expect(time).toBeLessThan(1000) // Deve completarsi in tempi ampiamente interattivi

    // La seconda chiamata deve restituire la stessa istanza cached
    const second = getPreviewCurves()
    expect(second).toBe(first)
  })

  it('getRestingCurves memorizza il risultato della miniatura a riposo', () => {
    const r1 = getRestingCurves()
    const r2 = getRestingCurves()
    expect(r1).toBe(r2)
  })
})

describe('home/curves: curve anteprima e miniatura del capitolo Fononi', () => {
  it('produce 6 serie di curve per le 6 sezioni di Fononi con id ordinati', () => {
    const series = computePhononPreviewCurves()
    expect(series).toHaveLength(6)
    expect(series.map((s) => s.id)).toEqual([
      'phonon-monatomic',
      'phonon-diatomic',
      'phonon-3d',
      'phonon-wavepacket',
      'phonon-quantum',
      'phonon-specific-heat'
    ])
  })

  it('tutte le curve di Fononi (a riposo e anteprima) hanno valori finiti e ascisse in [0, 1]', () => {
    const all = [computePhononRestingCurves(), ...computePhononPreviewCurves()]
    for (const item of all) {
      expect(item.bands.length).toBeGreaterThanOrEqual(1)
      expect(item.eMin).toBeLessThan(item.eMax)
      expect(item.kNormalized.length).toBeGreaterThanOrEqual(20)
      if (item.bandColors) {
        expect(item.bandColors.length).toBe(item.bands.length)
      }
      for (let i = 0; i < item.kNormalized.length; i++) {
        const k = item.kNormalized[i]
        expect(Number.isFinite(k)).toBe(true)
        expect(k).toBeGreaterThanOrEqual(0)
        expect(k).toBeLessThanOrEqual(1)
        if (i > 0) expect(k).toBeGreaterThanOrEqual(item.kNormalized[i - 1])
      }
      for (const band of item.bands) {
        expect(band.length).toBe(item.kNormalized.length)
        for (let i = 0; i < band.length; i++) {
          expect(Number.isFinite(band[i])).toBe(true)
        }
      }
    }
  })

  it('la miniatura a riposo Fononi (Na–Cl) ha ramo acustico sotto ramo ottico con gap positivo', () => {
    const resting = computePhononRestingCurves()
    expect(resting.bands).toHaveLength(2)
    const [acoustic, optical] = resting.bands
    let maxAc = -Infinity
    let minOpt = Infinity
    for (let i = 0; i < acoustic.length; i++) {
      if (acoustic[i] > maxAc) maxAc = acoustic[i]
      if (optical[i] < minOpt) minOpt = optical[i]
    }
    // Dispensa §8: ω_max^ac ≈ 2,9 THz, ω_min^ott ≈ 3,6 THz, gap ≈ 0,7 THz
    expect(maxAc).toBeCloseTo(2.93, 1)
    expect(minOpt).toBeCloseTo(3.64, 1)
    expect(minOpt - maxAc).toBeGreaterThan(0.6)
  })

  it('memorizza in cache getPhononRestingCurves e getPhononPreviewCurves', () => {
    expect(getPhononRestingCurves()).toBe(getPhononRestingCurves())
    expect(getPhononPreviewCurves()).toBe(getPhononPreviewCurves())
  })
})
