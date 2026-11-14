/**
 * Scelta del numero di onde piane per la sezione «Elettroni quasi liberi»:
 * 11 onde (n = −5…5) bastano su tutto l'intervallo dei cursori
 * (a = 2,5–6 Å, |V_G| ≤ 3 eV, |V_2G| ≤ 1,5 eV) per le bande sotto 22 eV.
 */
import { describe, expect, it } from 'vitest'
import { zonePath1D } from './bandStructure'
import { centralEquationBand, nearlyFreeBands } from './centralEquation1d'
import { inverseEffectiveMassRatio } from './semiclassical'

describe('convergenza con 11 onde piane', () => {
  it('bande sotto 22 eV entro 1 meV dal calcolo con 41 onde, ai bordi dell’intervallo dei parametri', () => {
    let worst = 0
    for (const a of [2.5, 6]) {
      const path = zonePath1D(a, 41)
      for (const vG of [-3, 3]) {
        for (const v2G of [-1.5, 1.5]) {
          const pot = { a, fourier: [vG, v2G] }
          const ref = nearlyFreeBands(pot, path, { planeWaves: 41, bands: 7 })
          const used = nearlyFreeBands(pot, path, { planeWaves: 11, bands: 7 })
          for (let n = 0; n < 7; n++) {
            for (let i = 0; i < path.points.length; i++) {
              if (ref.energies[n][i] < 22) worst = Math.max(worst, Math.abs(ref.energies[n][i] - used.energies[n][i]))
            }
          }
        }
      }
    }
    expect(worst).toBeLessThan(1e-3)
  })

  it('massa efficace della dispensa (a = 3 Å, V_G = −0,5 eV): m₀/m*₊ = 17,731 anche con 11 onde', () => {
    const edge = Math.PI / 3
    const upper = centralEquationBand({ a: 3, fourier: [-0.5] }, 1, { planeWaves: 11, basisK: edge })
    expect(Math.abs(inverseEffectiveMassRatio(upper, edge) - 17.731)).toBeLessThan(0.01)
  })
})
