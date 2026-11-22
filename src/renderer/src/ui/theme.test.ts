import { describe, expect, it } from 'vitest'
import { DERIVED_TONES, QUANTITIES, isQuantityId, quantityColor, themeCss, toneColor } from './theme'

describe('ui/theme: grandezze fononiche e toni derivati', () => {
  it('espone tutte le 10 nuove grandezze fononiche e i 5 toni derivati con hex validi', () => {
    const expectedPhononQuantities = [
      'omega',
      'omegaOpt',
      'C',
      'M',
      'm',
      'u',
      'vp',
      'T',
      'Theta',
      'CV'
    ] as const
    const hexRe = /^#[0-9a-f]{6}$/i

    for (const id of expectedPhononQuantities) {
      expect(isQuantityId(id)).toBe(true)
      expect(quantityColor(id)).toMatch(hexRe)
    }

    const expectedTones = [
      'acousticTransverse',
      'opticalTransverse',
      'lightLine',
      'vanHoveDos',
      'activatedModes'
    ] as const
    for (const id of expectedTones) {
      expect(toneColor(id)).toMatch(hexRe)
      expect(DERIVED_TONES[id].from).toBeTruthy()
    }
  })

  it('mantiene colori distinti tra tutte le grandezze di QUANTITIES e li inietta in themeCss', () => {
    const colors = Object.values(QUANTITIES).map((q) => q.color.toLowerCase())
    expect(new Set(colors).size).toBe(colors.length)

    const css = themeCss()
    expect(css).toContain('--q-omega:#72d67c;')
    expect(css).toContain('--q-omegaOpt:#f59e56;')
    expect(css).toContain('--q-u:#c9e663;')
    expect(css).toContain('--q-Theta:#a07ef5;')
    expect(css).toContain('--q-CV:#45b7f7;')
    expect(css).toContain('[data-q="CV"]{--q:var(--q-CV)}')
    expect(css).toContain('--tone-acoustic-transverse:#a8e6ae;')
    expect(css).toContain('--tone-light-line:#f9e28b;')
    expect(css).toContain('--tone-van-hove-dos:#8cd4fa;')
  })
})
