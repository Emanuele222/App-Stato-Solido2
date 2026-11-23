/**
 * Formule vive della sezione «Catena monatomica e prima zona di Brillouin»
 * (dispensa Parte 6: Lezione 1 §§1–5, Lezione 3 §13).
 *
 * Ogni termine legato a una grandezza è marcato \htmlData{q=<id>}{…}
 * (id della tabella unica in ui/theme.ts). Nessun apostrofo tipografico in TeX.
 * Le definizioni secondarie sono mantenute compatte per non generare scrollbar
 * orizzontali nella colonna destra (anche a 800 px).
 */

const q = (id: string, body: string): string => `\\htmlData{q=${id}}{${body}}`

const omega = q('omega', '\\omega')
const omegaMax = q('omega', '\\omega_{\\max}')
const k = q('k', 'k')
const kPrime = q('k', "k'")
const C = q('C', 'C')
const M = q('M', 'M')
const a = q('a', 'a')
const G = q('a', 'G')
const vs = q('v', 'v_s')
const vg = q('v', 'v_g')
const vp = q('vp', 'v_p')
const uDot = q('u', '\\ddot{u}_n')
const uNext = q('u', 'u_{n+1}')
const uPrev = q('u', 'u_{n-1}')
const uCur = q('u', 'u_n')

/** Eq. (8), dispensa Parte 6 Lezione 1 §3.1: relazione di dispersione della catena monatomica. */
export const MAIN_FORMULA = `${omega}(${k}) = 2\\sqrt{\\dfrac{${C}}{${M}}}\\,\\left|\\sin\\dfrac{${k}${a}}{2}\\right|`

/** Equazione del moto (eq. 6) e limiti (eq. 9, §3.2–3.3). */
export const DEFINITIONS: readonly string[] = [
  `${M}\\,${uDot} = ${C}(${uNext} + ${uPrev} - 2${uCur})`,
  `${vs} = ${a}\\sqrt{${C}/${M}}`,
  `${omegaMax} = 2\\sqrt{${C}/${M}}`
]

/** Velocità di gruppo/fase, equivalenza k ~ k + G e 1BZ (§3.3, §4.1). */
export const VELOCITY_AND_BZ_FORMULAS: readonly string[] = [
  `${vg}(${k}) = ${vs}\\cos\\tfrac{${k}${a}}{2}\\,\\operatorname{sgn}(${k})`,
  `${vp} = ${omega}/${k}`,
  `${kPrime} = ${k} + ${G},\\; ${G} = \\tfrac{2\\pi}{${a}}m`,
  `-\\tfrac{\\pi}{${a}} < ${k} \\le \\tfrac{\\pi}{${a}}`
]

/** Condizioni periodiche di Born–von Kármán (Lezione 3 §13.3, eq. 31–32). */
export const BVK_FORMULAS: readonly string[] = [
  `${q('u', 'u_{n+N}')} = ${uCur}`,
  `${k} = \\tfrac{2\\pi}{N${a}}\\,j,\\; \\Delta ${k} = \\tfrac{2\\pi}{N${a}}`
]
