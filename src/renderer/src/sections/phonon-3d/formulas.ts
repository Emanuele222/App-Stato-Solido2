/**
 * Formule vive della sezione «Rami 3D, polarizzazioni e cristalli reali»
 * (dispensa Parte 6: Lezione 2 §§9–10, eqq. 27–28; Lezione 3 §14, eqq. 34–36).
 *
 * Ogni grandezza usa \htmlData{q=<id>}{…} dalla tabella unica ui/theme.ts.
 * Nessun apostrofo tipografico in TeX.
 */

const q = (id: string, body: string): string => `\\htmlData{q=${id}}{${body}}`

const kVec = q('k', '\\mathbf{k}')
const a = q('a', 'a')
const Malpha = q('M', 'M_\\alpha')
const Mbeta = q('M', 'M_\\beta')
const Phi = q('C', '\\Phi_{\\alpha i,\\beta j}')
const wAc = q('omega', '\\omega_s')
const wOpt = q('omegaOpt', '\\omega_{\\mathrm{ott}}')
const epsVec = q('u', '\\boldsymbol{\\varepsilon}^s')
const uVec = q('u', '\\mathbf{u}_{n\\alpha}')

/** Eq. (27), dispensa Parte 6 Lezione 2 §10.2: matrice dinamica hermitiana 3p×3p. */
export const MAIN_FORMULA =
  `D_{\\alpha i,\\beta j}(${kVec}) = \\frac{1}{\\sqrt{${Malpha}${Mbeta}}}\\sum_m ${Phi}(0,m)\\,e^{i${kVec}\\cdot\\mathbf{R}_m}`

/** Equazione secolare (eq. 28) e onda di Bloch con polarizzazione (eq. 26). */
export const SECULAR_FORMULAS: readonly string[] = [
  `\\det\\!\\left(\\mathbf{D}(${kVec}) - ${wAc}^2\\mathbf{1}\\right) = 0`,
  `${uVec}(t) = \\tfrac{1}{\\sqrt{${Malpha}}}\\,${epsVec}_{\\alpha}(${kVec})\\,e^{i(${kVec}\\cdot\\mathbf{R}_n - ${wAc}t)}`
]

/** Regola di conteggio dei 3p rami (§9.1, con correzione esplicita delle slide: p − 1 LO e 2(p − 1) TO). */
export function branchCountFormulas(p: 1 | 2): readonly string[] {
  if (p === 1) {
    return [
      `p = 1:\\; 3p = 3\\;\\text{rami}\\;(${q('omega', '1\\,\\text{LA} + 2\\,\\text{TA}')},\\; 0\\;\\text{ott.})`
    ]
  }
  return [
    `3p = ${q('omega', '3\\;\\text{ac.}')} + ${q('omegaOpt', '(3p-3)\\;\\text{ott.}')}`,
    `${wOpt}:\\; (p-1)\\,\\text{LO} + 2(p-1)\\,\\text{TO}`
  ]
}

/** Formule 3D di Born–von Kármán (Lezione 3 §14, eqq. 34–36 e nota v_c = a³/4 per fcc). */
export const BVK_3D_FORMULAS: readonly string[] = [
  `${kVec} = \\tfrac{2\\pi}{L}(n_x,n_y,n_z),\\; \\Delta V_k = \\tfrac{(2\\pi)^3}{V}`,
  `\\mathcal{N}_k = \\tfrac{V_{\\mathrm{1BZ}}}{\\Delta V_k} = \\tfrac{V}{v_c} = N_c,\\; v_c^{\\mathrm{fcc}} = \\tfrac{${a}^3}{4}`,
  `3pN_c = N_c \\times 3p,\\; \\sum_{${kVec}} f(${kVec}) \\to \\tfrac{V}{(2\\pi)^3}\\!\\int f(${kVec})\\,\\mathrm{d}^3k`
]
