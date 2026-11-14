/**
 * Densità di probabilità degli stati di Bloch dei quasi liberi.
 * ψ_k(x) = Σ_G c_G e^{i(k+G)x} = e^{ikx} u_k(x)  (P3 §11.3, «è già la forma di Bloch»),
 * quindi |ψ_k(x)|² = |u_k(x)|² = |Σ_G c_G e^{iGx}|², periodica di passo a.
 */
import { blochCoefficients, type CentralSolution1D } from './centralEquation1d'

/**
 * |ψ(x)|² dello stato (k, banda) nei punti `xs` (Å), normalizzata a media 1 su
 * una cella (con questa normalizzazione un'onda piana ha densità 1 e le onde
 * stazionarie al bordo 1 ± cos(2πx/a), come in P3 §11.5).
 */
export function blochDensity1D(
  solution: CentralSolution1D,
  band: number,
  xs: ArrayLike<number>
): Float64Array {
  const { g, re, im } = blochCoefficients(solution, band)
  const G = (2 * Math.PI) / solution.a
  // Media su una cella di |u|² = Σ|c_G|² (Parseval): si divide per questa.
  let norm = 0
  for (let j = 0; j < g.length; j++) norm += re[j] * re[j] + (im ? im[j] * im[j] : 0)
  if (!(norm > 0)) throw new Error('stato nullo')
  const out = new Float64Array(xs.length)
  for (let p = 0; p < xs.length; p++) {
    const x = xs[p]
    let ur = 0
    let ui = 0
    for (let j = 0; j < g.length; j++) {
      const phase = g[j] * G * x
      const c = Math.cos(phase)
      const s = Math.sin(phase)
      const cr = re[j]
      const ci = im ? im[j] : 0
      ur += cr * c - ci * s
      ui += cr * s + ci * c
    }
    out[p] = (ur * ur + ui * ui) / norm
  }
  return out
}

/** Onda stazionaria al bordo di zona: ψ_c (coseno) o ψ_s (seno), P3 §11.5. */
export type StandingWave = 'c' | 's'

/**
 * Riconosce se lo stato (k = ±π/a, banda `band`) è l'onda stazionaria ψ_c ∝
 * cos(πx/a), con la carica sugli ioni (x = n·a), o ψ_s ∝ sin(πx/a), con la
 * carica fra gli ioni. Si usa il rapporto fra i pesi delle due onde degeneri
 * e^{±iπx/a} (formulario «gap»: c_{−G}/c₀ = ±1, + per ψ_c, − per ψ_s); con
 * più onde piane il segno resta quello, perché un potenziale pari separa gli
 * stati al bordo in pari e dispari.
 * Restituisce null se k non è sul bordo di zona o se lo stato è degenere
 * (V_G = 0: qualunque combinazione è autostato).
 */
export function zoneEdgeStandingWave(solution: CentralSolution1D, band: number): StandingWave | null {
  const G = (2 * Math.PI) / solution.a
  const edge = G / 2
  if (Math.abs(Math.abs(solution.k) - edge) > 1e-9 * G) return null
  const e = solution.energies
  const scale = Math.max(1, Math.abs(e[band]))
  const degenerate =
    (band > 0 && Math.abs(e[band] - e[band - 1]) < 1e-9 * scale) ||
    (band + 1 < e.length && Math.abs(e[band + 1] - e[band]) < 1e-9 * scale)
  if (degenerate) return null
  const { g, re, im } = blochCoefficients(solution, band)
  // Parità x → −x: l'onda n (vettore k + nG) va nell'onda m con k + mG = −(k + nG),
  // cioè m = −1 − n per k = π/a e m = 1 − n per k = −π/a. Stato pari (ψ_c):
  // c_m = c_n; dispari (ψ_s): c_m = −c_n. La proiezione Σ Re(c_n c*_m) vale ±1.
  const mirror = solution.k > 0 ? -1 : 1
  let projection = 0
  for (let i = 0; i < g.length; i++) {
    const j = indexOf(g, mirror - g[i])
    if (j < 0) continue
    projection += re[i] * re[j] + (im ? im[i] * im[j] : 0)
  }
  if (Math.abs(projection) < 1e-6) return null
  return projection > 0 ? 'c' : 's'
}

function indexOf(g: Int32Array, n: number): number {
  for (let i = 0; i < g.length; i++) if (g[i] === n) return i
  return -1
}
