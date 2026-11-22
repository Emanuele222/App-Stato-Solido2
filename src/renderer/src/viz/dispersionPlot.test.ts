import { describe, expect, it } from 'vitest'
import { interpolateBranchY } from './DispersionPlot'
import { PLAYBACK_SPEEDS, formatPlaybackSpeed } from './PlaybackControls'

describe('viz: helper di DispersionPlot e PlaybackControls', () => {
  it('interpolateBranchY interpola linearmente e blocca agli estremi', () => {
    const xs = new Float64Array([-1, 0, 1])
    const ys = new Float64Array([2, 0, 2])
    expect(interpolateBranchY(xs, ys, -2)).toBe(2)
    expect(interpolateBranchY(xs, ys, -0.5)).toBeCloseTo(1, 12)
    expect(interpolateBranchY(xs, ys, 0)).toBeCloseTo(0, 12)
    expect(interpolateBranchY(xs, ys, 0.25)).toBeCloseTo(0.5, 12)
    expect(interpolateBranchY(xs, ys, 3)).toBe(2)
    expect(interpolateBranchY([], [], 0)).toBeNull()
  })

  it('formatPlaybackSpeed formatta le 4 velocità canoniche con virgola italiana', () => {
    expect(PLAYBACK_SPEEDS).toEqual([0.25, 0.5, 1, 2])
    expect(PLAYBACK_SPEEDS.map(formatPlaybackSpeed)).toEqual(['0,25×', '0,5×', '1×', '2×'])
  })
})
