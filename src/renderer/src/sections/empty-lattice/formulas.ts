/**
 * Formule vive della sezione «Reticolo vuoto e schemi di zona»
 * (dispensa P3 §9.3, formulario «Periodicità in k» e «Zona ridotta», P4 §5.1).
 */

const q = (id: string, body: string): string => `\\htmlData{q=${id}}{${body}}`

const E = q('E', 'E')
const k = q('k', 'k')
const kp = q('k', "k'")
const G = q('a', 'G')
const a = q('a', 'a')
const E0 = q('Ek', 'E_0')

/**
 * Formula principale (su due righe per stare comodamente nella colonna destra
 * anche a 800 px): E = ħ²(k + G)² / 2m₀, con G = 2πn/a.
 */
export const MAIN_FORMULA = [
  '\\begin{array}{l}',
  `${E} = \\dfrac{\\hbar^2(${k}+${G})^2}{2m_0},\\\\[8pt]`,
  `${G} = \\dfrac{2\\pi n}{${a}} \\quad (n\\in\\mathbb{Z})`,
  '\\end{array}'
].join('\n')

/** Definizioni della sezione (P3 §9.1 e §9.3; P4 §5.1). */
export const DEFINITIONS: readonly string[] = [
  `${E}(${k}+${G}) = ${E}(${k})`,
  `-\\dfrac{\\pi}{${a}} < ${k} \\le \\dfrac{\\pi}{${a}}`,
  `${E0} = \\dfrac{\\hbar^2\\pi^2}{2m_0${a}^2}`,
  `${k} = ${kp} + ${G}`
]
