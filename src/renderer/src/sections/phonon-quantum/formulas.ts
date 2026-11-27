/**
 * Formule vive della sezione «Modi quantizzati e processi Umklapp»
 * (dispensa Parte 6: Lezione 2 §11 eqq. 29–30; Lezione 3 §§15–18, eqq. 40–42 e 46–51).
 *
 * Tutti gli id usati in \htmlData{q=...} esistono in ui/theme.ts.
 */
import type { QuantizationSource, SectionMode } from './manifest'

const q = (id: string, body: string): string => `\\htmlData{q=${id}}{${body}}`

const E = q('E', 'E')
const n = q('psi', 'n')
const nBar = q('T', '\\bar{n}')
const T = q('T', 'T')
const omega = q('omega', '\\omega')
const nu = q('omega', '\\nu')
const M = q('M', 'M')
const aHo = q('psi', 'a_{\\mathrm{ho}}')
const xCl = q('Ek', 'x_{\\mathrm{cl}}')
const Pcl = q('Ek', 'P_{\\mathrm{cl}}')
const Pn = q('psi', 'P_n')
const PsiN = q('psi', '\\Psi_n')
const dxZp = q('u', '\\Delta x_{\\mathrm{zp}}')

const k1 = q('k', 'k_1')
const k2 = q('k', 'k_2')
const k3 = q('omega', 'k_3')
const G = q('a', 'G')
const a = q('a', 'a')
const vg = q('v', 'v_g')

export function mainFormulaTex(mode: SectionMode, source: QuantizationSource): string {
  if (mode === 'quantization') {
    if (source === 'thermal') {
      return `${nBar}(${T}) = \\dfrac{1}{\\exp(\\hbar${omega} / k_B ${T}) - 1}`
    }
    return `${E}_{${n}} = \\left(${n} + \\tfrac{1}{2}\\right)\\hbar${omega}`
  }
  return `${k1} + ${k2} = ${k3} + ${G}`
}

export function secondaryFormulasTex(mode: SectionMode, source: QuantizationSource): readonly string[] {
  if (mode === 'quantization') {
    const base = [
      `${aHo} = \\sqrt{\\dfrac{\\hbar}{${M}${omega}}}`,
      `${dxZp} = \\dfrac{${aHo}}{\\sqrt{2}}`
    ]
    if (source === 'thermal') {
      return [
        ...base,
        `\\langle ${E} \\rangle = (${nBar} + \\tfrac{1}{2})\\hbar${omega}`,
        `p_n(${T}) = (1 - e^{-\\hbar${omega}/k_B ${T}})e^{-n\\hbar${omega}/k_B ${T}}`
      ]
    }
    return [
      ...base,
      `${xCl} = ${aHo}\\sqrt{2${n}+1}`,
      `${Pn}(x) = |${PsiN}(x)|^2,\\; ${Pcl}(x) = \\dfrac{1}{\\pi\\sqrt{${xCl}^2 - x^2}}`
    ]
  }

  return [
    `${G} \\in \\{0, \\pm\\tfrac{2\\pi}{${a}}\\},\\; -\\tfrac{\\pi}{${a}} < ${k3} \\le \\tfrac{\\pi}{${a}}`,
    `${vg}(k) = \\dfrac{\\mathrm{d}${omega}}{\\mathrm{d}k} = ${a}\\sqrt{\\tfrac{C}{${M}}}\\cos\\tfrac{k${a}}{2}\\,\\operatorname{sgn}(k)`,
    `${omega}(k) = 2\\sqrt{\\tfrac{C}{${M}}}\\left|\\sin\\tfrac{k${a}}{2}\\right|,\\; ${nu} = \\dfrac{${omega}}{2\\pi}`
  ]
}
