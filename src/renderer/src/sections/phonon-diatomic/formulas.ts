/**
 * Formule vive della sezione «Catena biatomica, gap fononico e luce infrarossa»
 * (dispensa Parte 6: Lezione 2 §§7–8 e §10.3; Lezione 4 §24).
 *
 * Ogni termine legato a una grandezza è marcato \htmlData{q=<id>}{…}
 * (id della tabella unica in ui/theme.ts). Nessun apostrofo tipografico in TeX.
 * Le formule secondarie sono spezzate in blocchi compatti per evitare qualsiasi
 * scrollbar orizzontale nella colonna destra (anche a 800×700).
 */

const q = (id: string, body: string): string => `\\htmlData{q=${id}}{${body}}`

const wAc = q('omega', '\\omega_-')
const wOpt = q('omegaOpt', '\\omega_+')
const wAcMax = q('omega', '\\omega_{\\max}^{\\mathrm{ac}}')
const wOptMin = q('omegaOpt', '\\omega_{\\min}^{\\mathrm{ott}}')
const dGap = q('omegaOpt', '\\Delta\\omega_{\\mathrm{gap}}')
const k = q('k', 'k')
const C = q('C', 'C')
const M = q('M', 'M')
const m = q('m', 'm')
const a = q('a', 'a')
const vs = q('v', 'v_s')
const alpha = q('u', '\\alpha')
const uN = q('u', 'u_n')
const uPrev = q('u', 'u_{n-1}')

/** Eq. (20), dispensa Parte 6 Lezione 2 §7.4: i due rami ω₋ (acustico) e ω₊ (ottico). */
export const MAIN_FORMULA =
  `\\omega_{\\mp}^2(${k}) = ${C}\\tfrac{${m}+${M}}{${m}${M}} \\mp ${C}\\sqrt{\\left(\\tfrac{${m}+${M}}{${m}${M}}\\right)^{\\!2} - \\tfrac{4\\sin^2(${k}${a}/2)}{${m}${M}}}`

/** Legenda dei segni e limiti a k = 0 (eqq. 21–22, §8.1). */
export const BRANCH_AND_ZERO_FORMULAS: readonly string[] = [
  `${wAc}\\;\\text{(ac.)},\\; ${wOpt}\\;\\text{(ott.)}`,
  `${vs} = ${a}\\sqrt{\\tfrac{${C}}{2(${m}+${M})}}`,
  `${wOpt}(0) = \\sqrt{\\tfrac{2${C}(${m}+${M})}{${m}${M}}}`
]

/**
 * Bordi di zona C/B, gap (eq. 23, §8.2–8.3) e rapporto d'ampiezza α (eqq. 17–18).
 * Se `invertedMasses` è vero (m > M), i ruoli simbolici ai bordi riflettono max(M, m) = m e min(M, m) = M.
 */
export function edgeAndAlphaFormulas(invertedMasses: boolean): readonly string[] {
  const heavySym = invertedMasses ? m : M
  const lightSym = invertedMasses ? M : m
  return [
    `${wAcMax} = \\sqrt{\\tfrac{2${C}}{${heavySym}}}`,
    `${wOptMin} = \\sqrt{\\tfrac{2${C}}{${lightSym}}}`,
    `${dGap} = ${wOptMin} - ${wAcMax}`,
    `${alpha} = \\tfrac{2${C} - \\omega^2 ${M}}{2${C}\\cos(${k}${a}/2)}`
  ]
}

/** Limiti di α a k = 0 e definizione del centro di massa di cella R_cm (§8.1, slide 43). */
export const ALPHA_LIMIT_FORMULAS: readonly string[] = [
  `${wAc}:\\; ${alpha}(0) = 1`,
  `${wOpt}:\\; ${alpha}(0) = -\\tfrac{${M}}{${m}}`,
  `R_{\\mathrm{cm}} = \\tfrac{${M}${uN} + ${m}${uPrev}}{${M}+${m}}`
]

/** Matrice dinamica 2×2 ed equazione secolare (Lezione 2 §10.3, p. 27, eq. 28). */
export const DYNAMICAL_MATRIX_FORMULA =
  `\\mathbf{D}(${k}) = \\begin{pmatrix} \\tfrac{2${C}}{${M}} & -\\tfrac{2${C}}{\\sqrt{${M}${m}}}\\cos\\tfrac{${k}${a}}{2} \\\\[4pt] -\\tfrac{2${C}}{\\sqrt{${M}${m}}}\\cos\\tfrac{${k}${a}}{2} & \\tfrac{2${C}}{${m}} \\end{pmatrix}`

export const SECULAR_FORMULA = `\\det\\!\\left(\\mathbf{D}(${k}) - \\omega^2\\mathbf{1}\\right) = 0`

/** Leggi di conservazione per l'assorbimento infrarosso (Lezione 4 §24, eq. 60). */
export const INFRARED_FORMULAS: readonly string[] = [
  `\\hbar\\omega_{\\mathrm{luce}} = \\hbar${wOpt}(${k})`,
  `${q('k', 'k_{\\mathrm{luce}}')} = ${k}\\,(+G),\\; ${q('k', 'k_{\\mathrm{luce}}')} = \\tfrac{n\\omega}{c} \\ll \\tfrac{\\pi}{${a}}`
]
