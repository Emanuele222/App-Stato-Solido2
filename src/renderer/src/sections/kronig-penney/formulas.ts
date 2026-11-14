/**
 * Formule KaTeX della sezione «Kronig–Penney» (P3 §10 e formulario),
 * marcate con \htmlData{q=<id>}{…} per l'evidenziazione bidirezionale.
 */

export const MAIN_FORMULA_DELTA = String.raw`\cos \htmlData{q=k}{k}\htmlData{q=a}{a} = \cos \htmlData{q=E}{\alpha}\htmlData{q=a}{a} + \htmlData{q=VG}{P}\,\frac{\sin \htmlData{q=E}{\alpha}\htmlData{q=a}{a}}{\htmlData{q=E}{\alpha}\htmlData{q=a}{a}}`

export const DEFINITIONS_DELTA: readonly string[] = [
  String.raw`\htmlData{q=E}{L_\delta(E)} = \cos \alpha a + P\,\frac{\sin \alpha a}{\alpha a}`,
  String.raw`\htmlData{q=E}{\alpha} = \frac{\sqrt{2m_0 \htmlData{q=E}{E}}}{\hbar}`,
  String.raw`\htmlData{q=VG}{P} = \frac{m_0 \htmlData{q=a}{a}^2 \htmlData{q=VG}{V_0}}{\hbar^2}`
]

export const MAIN_FORMULA_RECT = String.raw`\begin{aligned}\cos \htmlData{q=k}{k}\htmlData{q=a}{a} &= \htmlData{q=E}{L(E)} \\ &= \cos \htmlData{q=E}{\alpha}\htmlData{q=a}{b}\cosh \htmlData{q=E}{\beta}\htmlData{q=a}{c} + \frac{\htmlData{q=E}{\beta}^2 - \htmlData{q=E}{\alpha}^2}{2\htmlData{q=E}{\alpha}\htmlData{q=E}{\beta}}\sin \htmlData{q=E}{\alpha}\htmlData{q=a}{b}\sinh \htmlData{q=E}{\beta}\htmlData{q=a}{c}\end{aligned}`

export const DEFINITIONS_RECT: readonly string[] = [
  String.raw`\htmlData{q=E}{\alpha} = \frac{\sqrt{2m_0 \htmlData{q=E}{E}}}{\hbar},\quad \htmlData{q=E}{\beta} = \frac{\sqrt{2m_0(\htmlData{q=VG}{V_0} - \htmlData{q=E}{E})}}{\hbar}`,
  String.raw`\htmlData{q=a}{a} = \htmlData{q=a}{b} + \htmlData{q=a}{c},\quad \htmlData{q=E}{E} > \htmlData{q=VG}{V_0}:\; \beta \to i\beta'`
]

export const COSINE_FORMULA = String.raw`\htmlData{q=E}{E}(k) \approx \bar E \mp 2t\cos \htmlData{q=k}{k}\htmlData{q=a}{a},\quad W = 4t,\quad \htmlData{q=mstar}{m^*}_{\text{min}} = \frac{\hbar^2}{2t\htmlData{q=a}{a}^2}`
