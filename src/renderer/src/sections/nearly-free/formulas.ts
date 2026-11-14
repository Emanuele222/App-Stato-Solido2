/**
 * Formule vive della sezione, con la notazione della dispensa (P3 §11).
 * Ogni termine legato a una grandezza è marcato \htmlData{q=<id>}{…}
 * (id della tabella in ui/theme.ts).
 */

const q = (id: string, body: string): string => `\\htmlData{q=${id}}{${body}}`

const k = q('k', 'k')
const kp = q('k', "k'")
const Ek = q('Ek', `E_{${k}}`)
const Ekp = q('Ek', `E_{${kp}}`)
const VG = q('VG', 'V_G')
const V2G = q('V2G', 'V_{2G}')
const a = q('a', 'a')
const G = q('a', 'G')
const E0 = q('Ek', 'E_0')
const Epm = q('E', 'E_\\pm')

/**
 * Modello a due onde (P3 eq. dueonde; formulario «Due onde, k′ = k − G»):
 * E±(k) = ½(E_k + E_k′) ± [¼(E_k′ − E_k)² + V_G²]^½, su due righe per stare
 * nella colonna destra anche a 800 px.
 */
export const MAIN_FORMULA = [
  '\\begin{array}{l}',
  `${Epm}(${k}) = \\tfrac12\\bigl(${Ek}+${Ekp}\\bigr)\\\\[2pt]`,
  `\\qquad\\pm\\Bigl[\\tfrac14\\bigl(${Ekp}-${Ek}\\bigr)^2+${q('VG', 'V_G^{\\,2}')}\\Bigr]^{1/2}`,
  '\\end{array}'
].join('\n')

/** Definizioni (P3 §11.3–11.4, formulario «Elettroni quasi liberi»). */
export const DEFINITIONS: readonly string[] = [
  `${Ek}=\\dfrac{\\hbar^2${k}^2}{2m_0}`,
  `${kp}=${k}-${G},\\quad ${G}=\\dfrac{2\\pi}{${a}}`,
  `${E0}=\\dfrac{\\hbar^2\\pi^2}{2m_0${a}^2}`,
  `${q('VG', 'E_g')}=2|${VG}|`
]

/** Al bordo di zona (P3 §11.4 «Il gap dal calcolo», §11.5 onde stazionarie). */
export const EDGE_FORMULAS: readonly string[] = [
  `${k}=\\pm\\dfrac{\\pi}{${a}}:\\quad ${Epm}=${E0}\\pm|${VG}|`,
  `${q('psi', '\\psi_c')}\\propto\\cos\\dfrac{\\pi x}{${a}},\\quad ${q('psi', '\\psi_s')}\\propto\\sin\\dfrac{\\pi x}{${a}}`,
  `${k}=\\pm\\dfrac{2\\pi}{${a}}\\equiv 0:\\quad ${q('V2G', 'E_g')}=2|${V2G}|`
]
