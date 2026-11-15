/**
 * Formule vive della sezione «Legami forti» (dispense P3 §12, P4 §§1.4–2).
 * Termini marcati \htmlData{q=<id>}{…} con i colori canonici (ui/theme.ts):
 * t e W usano q=t (come Kronig–Penney); Ē_n usa q=Ek; E_g usa q=VG.
 */

const q = (id: string, body: string): string => `\\htmlData{q=${id}}{${body}}`

const k = q('k', 'k')
const a = q('a', 'a')
const E = q('E', 'E')
const Es = q('E', 'E_s')
const Ep = q('E', 'E_p')
const Epm = q('E', 'E_\\pm')
const EbarN = q('Ek', '\\bar{E}_n')
const EbarS = q('Ek', '\\bar{E}_s')
const EbarP = q('Ek', '\\bar{E}_p')
const EA = q('Ek', 'E_A')
const EB = q('Ek', 'E_B')
const t = q('t', 't')
const ts = q('t', 't_s')
const tp = q('t', '|t_p|')
const Eg = q('VG', 'E_g')
const W = q('t', 'W')

/** Formula generale (P3 §12.2): E(k) = Ē_n − Σ_{R≠0} t(R) e^{ikR}. */
export const GENERAL_FORMULA = `${E}(${k}) = ${EbarN} - \\sum_{R\\neq 0} ${q('t', 't(R)')}\\, e^{i${k}R}`

/** Catena monoatomica (P3 §12.3, P4 §1.4). */
export const MONO_MAIN_FORMULA = [
  '\\begin{aligned}',
  `${Es}(${k}) &= ${EbarS} - 2${ts}\\cos(${k}${a}),\\\\[2pt]`,
  `${Ep}(${k}) &= ${EbarP} + 2${tp}\\cos(${k}${a})`,
  '\\end{aligned}'
].join('\n')

export const MONO_DEFINITIONS: readonly string[] = [
  `${W} = 4|${t}|`,
  `${Eg}\\!\\left(\\tfrac{\\pi}{${a}}\\right) = (${EbarP} - ${EbarS}) - 2(${ts} + ${tp})`,
  `${q('mstar', 'm^*_{s,\\text{fondo}}')} = \\dfrac{\\hbar^2}{2${ts}${a}^2}`
]

/** Catena biatomica A–B (P4 §2). */
export const DIATOMIC_MAIN_FORMULA = [
  '\\begin{array}{l}',
  `${Epm}(${k}) = \\tfrac12(${EA}+${EB})\\\\[2pt]`,
  `\\qquad\\pm\\Bigl[\\tfrac14(${EB}-${EA})^2+4${q('t', 't^2')}\\cos^2\\!\\tfrac{${k}${a}}{2}\\Bigr]^{1/2}`,
  '\\end{array}'
].join('\n')

export const DIATOMIC_DEFINITIONS: readonly string[] = [
  `${q('psi', '\\psi_k')}(x) = \\tfrac{1}{\\sqrt{N}}\\sum_n e^{i${k}n${a}}\\bigl[${q('psi', 'b_A')}\\varphi_A(x-n${a}) + ${q('psi', 'b_B')}e^{i${k}${a}/2}\\varphi_B(x-n${a}-\\tfrac{${a}}{2})\\bigr]`,
  `${Epm}(${k}) \\simeq ${q('Ek', 'E_{B,A}')} \\pm ${W}\\cos^2\\!\\tfrac{${k}${a}}{2} \\quad (${t}\\ll ${EB}-${EA})`,
  `${Eg}\\!\\left(\\tfrac{\\pi}{${a}}\\right) = ${EB} - ${EA}`,
  `${W} \\simeq \\dfrac{4${q('t', 't^2')}}{${EB} - ${EA}} \\quad (${t}\\ll ${EB}-${EA})`,
  `${q('mstar', 'm^*_c')} = -${q('mstar', 'm^*_v')} = \\dfrac{\\hbar^2(${EB}-${EA})}{2${q('t', 't^2')}${a}^2}`
]
