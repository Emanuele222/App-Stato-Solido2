/**
 * Formule KaTeX della sezione «Kronig–Penney» (P3 §10 e formulario),
 * marcate con \htmlData{q=<id>}{…} per l'evidenziazione bidirezionale.
 */

export const MAIN_FORMULA_DELTA = String.raw`\cos \htmlData{q=k}{k}\htmlData{q=a}{a} = \htmlData{q=kp}{f(\alpha a)} = \cos \htmlData{q=kp}{\alpha}\htmlData{q=a}{a} + \htmlData{q=VG}{P}\,\frac{\sin \htmlData{q=kp}{\alpha}\htmlData{q=a}{a}}{\htmlData{q=kp}{\alpha}\htmlData{q=a}{a}}`

export const DEFINITIONS_DELTA: readonly string[] = [
  String.raw`\htmlData{q=kp}{L(E)} = \htmlData{q=kp}{f(\alpha a)}\quad\text{(caso a delta)}`,
  String.raw`\htmlData{q=kp}{\alpha} = \frac{\sqrt{2m_0 \htmlData{q=E}{E}}}{\hbar}`,
  String.raw`\htmlData{q=VG}{P} = \frac{m_0 \htmlData{q=a}{a}\,(\htmlData{q=a}{a}\htmlData{q=VG}{V_0})}{\hbar^2},\quad \text{area }\htmlData{q=a}{a}\htmlData{q=VG}{V_0},\ \htmlData{q=VG}{V_0}\text{ medio/cella}`
]

export const MAIN_FORMULA_RECT = String.raw`\begin{aligned}\cos \htmlData{q=k}{k}\htmlData{q=a}{a} &= \htmlData{q=kp}{L(E)} \\ &= \cos \htmlData{q=kp}{\alpha}\htmlData{q=a}{b}\cosh \htmlData{q=kp}{\beta}\htmlData{q=a}{c} + \frac{\htmlData{q=kp}{\beta}^2 - \htmlData{q=kp}{\alpha}^2}{2\htmlData{q=kp}{\alpha}\htmlData{q=kp}{\beta}}\sin \htmlData{q=kp}{\alpha}\htmlData{q=a}{b}\sinh \htmlData{q=kp}{\beta}\htmlData{q=a}{c}\end{aligned}`

export const DEFINITIONS_RECT: readonly string[] = [
  String.raw`\htmlData{q=kp}{\alpha} = \frac{\sqrt{2m_0 \htmlData{q=E}{E}}}{\hbar},\quad \htmlData{q=kp}{\beta} = \frac{\sqrt{2m_0(\htmlData{q=VG}{V_0} - \htmlData{q=E}{E})}}{\hbar}`,
  String.raw`\htmlData{q=a}{a} = \htmlData{q=a}{b} + \htmlData{q=a}{c},\quad \htmlData{q=VG}{P_{\mathrm{eff}}} = \frac{m_0 \htmlData{q=a}{a}\,\htmlData{q=VG}{V_0}\,\htmlData{q=a}{c}}{\hbar^2}`,
  String.raw`\htmlData{q=E}{E} > \htmlData{q=VG}{V_0}:\; \htmlData{q=kp}{\beta} \to i\beta',\qquad \htmlData{q=t}{W} \propto e^{-\htmlData{q=kp}{\beta}\htmlData{q=a}{c}}`
]

/** Banda a coseno con il segno effettivo della banda scelta (− per le dispari 1, 3, …; + per le pari 2, 4, …). */
export function cosineFormulaForBand(bandZeroBased: number): string {
  const sign = bandZeroBased % 2 === 0 ? '-' : '+'
  return String.raw`\htmlData{q=E}{E}(k) \approx \bar E ${sign} 2\htmlData{q=t}{t}\cos \htmlData{q=k}{k}\htmlData{q=a}{a}\;(\text{banda }${bandZeroBased + 1}),\quad \htmlData{q=t}{W} = 4\htmlData{q=t}{t},\quad \htmlData{q=mstar}{m^*}_{\text{min}} = \frac{\hbar^2}{2\htmlData{q=t}{t}\htmlData{q=a}{a}^2}`
}
