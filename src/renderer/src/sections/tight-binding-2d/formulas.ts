/**
 * Formule vive della sezione «Legami forti in 2D» (dispense P4 §1.4, §6).
 * Colori canonici: t -> t, a -> a, k e q -> k, E -> E, v_F -> v, E_F -> EF, m* e m̃ -> mstar.
 */

const q = (id: string, body: string): string => `\\htmlData{q=${id}}{${body}}`

const k = q('k', '\\mathbf{k}')
const kx = q('k', 'k_x')
const ky = q('k', 'k_y')
const qq = q('k', '\\mathbf{q}')
const a = q('a', 'a')
const aCC = q('a', 'a_{\\mathrm{CC}}')
const E = q('E', 'E')
const Epm = q('E', 'E_\\pm')
const EbarS = q('Ek', '\\bar{E}_s')
const t = q('t', 't')
const W = q('t', 'W')
const vF = q('v', 'v_F')
const EF = q('EF', 'E_F')
const mstar = q('mstar', 'm^*')
const mtilde = q('mstar', '\\tilde{m}')

export const SQUARE_MAIN_FORMULA = `${E}(${k}) = ${EbarS} - 2${t}\\bigl(\\cos ${kx}${a} + \\cos ${ky}${a}\\bigr)`

export const SQUARE_DEFINITIONS: readonly string[] = [
  `${W} = 8${t}`,
  `${mstar}_{\\text{fondo}} = \\dfrac{\\hbar^2}{2${t}${a}^2}`,
  `${EF}\\,(N=1) = ${EbarS},\\quad |${kx}| + |${ky}| = \\dfrac{\\pi}{${a}}`
]

export const GRAPHENE_MAIN_FORMULA = [
  '\\begin{aligned}',
  `${Epm}(${k}) &= \\pm ${t}\\,|f(${k})|, \\qquad f(${k}) = \\sum_{i=1}^3 e^{i${k}\\cdot\\boldsymbol{\\delta}_i},\\\\[3pt]`,
  `${Epm}(${qq}) &= \\pm \\hbar ${vF}\\,|${qq}|, \\qquad ${vF} = \\dfrac{3${t}${aCC}}{2\\hbar}`,
  '\\end{aligned}'
].join('\n')

export const GRAPHENE_DEFINITIONS: readonly string[] = [
  `g(${E}) = \\dfrac{2|${E}|}{\\pi \\hbar^2 ${q('v', 'v_F^2')}}, \\qquad g(${EF}) = 0`,
  `${mtilde} = \\dfrac{\\hbar^2 |${qq}|}{\\dd ${E}/\\dd q} = \\dfrac{\\hbar |${qq}|}{${vF}} \\xrightarrow{q\\to 0} 0`
]
