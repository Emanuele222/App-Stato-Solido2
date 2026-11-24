/**
 * Formule vive della sezione «Pacchetti d'onda: velocità di fase e di gruppo»
 * (dispensa Parte 6: Lezione 2 §6 pp. 14–17, eqq. 10–12).
 *
 * Ogni termine legato a una grandezza usa \htmlData{q=<id>}{…} dalla tabella
 * unica in ui/theme.ts. Nessun apostrofo tipografico in TeX.
 */
import type { WavepacketRegime } from '../../physics'

const q = (id: string, body: string): string => `\\htmlData{q=${id}}{${body}}`

const psi = q('psi', '\\Psi')
const phi = q('psi', '\\Phi')
const k = q('k', 'k')
const k0 = q('k', 'k_0')
const dk = q('k', '\\Delta k')
const vp = q('vp', 'v_p')
const vg = q('v', 'v_g')
const vs = q('v', 'v_s')
const env = q('u', 'F')
const sig0 = q('u', '\\sigma_0')
const sigT = q('u', '\\sigma(t)')
const a = q('a', 'a')
const C = q('C', 'C')
const M = q('M', 'M')
const m = q('m', 'm')

function omegaColor(regime: WavepacketRegime): string {
  return regime === 'optical' ? 'omegaOpt' : regime === 'quadratic' ? 'Ek' : 'omega'
}

/** Eq. (10)–(11), §6.1: sovrapposizione di onde piane e separazione portante × inviluppo (su 2 righe per evitare overflow). */
export function mainFormulaTex(regime: WavepacketRegime): string {
  const oq = omegaColor(regime)
  const w = q(oq, '\\omega')
  const w0 = q(oq, '\\omega_0')
  return `\\begin{aligned} ${psi}(x,t) &= \\tfrac{1}{\\sqrt{2\\pi}}\\!\\int_{-\\infty}^{+\\infty}\\! ${phi}(${k})\\,e^{i[${k}x - ${w}(${k})t]}\\,\\mathrm{d}${k} \\\\ &\\simeq e^{i(${k0}x - ${w0}t)}\\,${env}(x - ${vg}t) \\end{aligned}`
}

/** Definizioni di v_p, v_g (corda e tangente, §6.1 Fig. 8) e indeterminazione Δx·Δk ≥ 1/2. */
export function velocityAndUncertaintyFormulas(regime: WavepacketRegime): readonly string[] {
  const w = q(omegaColor(regime), '\\omega')
  return [
    `${vp} = \\tfrac{${w}}{${k}}`,
    `${vg} = \\tfrac{\\mathrm{d}${w}}{\\mathrm{d}${k}}`,
    `${sig0}\\,${dk} = \\tfrac{1}{2}\\;(\\Delta x\\,\\Delta k \\ge \\tfrac{1}{2})`
  ]
}

/** Eq. (12), §6.3: allargamento gaussiano nel riferimento comovente ξ = x − v_g t. */
export const SPREADING_FORMULA =
  `${sigT} = ${sig0}\\sqrt{1 + \\left(\\tfrac{\\omega'' t}{2${sig0}^2}\\right)^{\\!2}},\\quad ${sig0} = \\tfrac{1}{2s}\\;(s = ${dk})`

/** Formule specifiche del regime di dispersione selezionato (§6.2–§6.3), spezzate per zero overflow a 800 px. */
export function regimeFormulas(regime: WavepacketRegime): readonly string[] {
  switch (regime) {
    case 'linear':
      return [
        `${q('omega', '\\omega')}(${k}) = ${vs}|${k}|`,
        `${vp} = ${vg} = \\pm ${vs},\\; \\omega'' = 0`
      ]
    case 'acoustic':
      return [
        `${q('omega', '\\omega')}(${k}) = \\omega_{\\max}\\!\\left|\\sin\\tfrac{${k}${a}}{2}\\right|`,
        `\\omega''\\!\\left(\\tfrac{\\pi}{${a}}\\right) = -\\tfrac{${a}^2\\omega_{\\max}}{4}`
      ]
    case 'optical':
      return [
        `${q('omegaOpt', '\\omega_+')}^2(${k}) = ${C}\\tfrac{${m}+${M}}{${m}${M}} + ${C}\\sqrt{\\left(\\tfrac{${m}+${M}}{${m}${M}}\\right)^{\\!2} - \\tfrac{4\\sin^2(${k}${a}/2)}{${m}${M}}}`,
        `${vg} < 0,\\; ${vp} > 0\\;(${k} > 0)`
      ]
    case 'quadratic':
      return [
        `\\hbar${q('Ek', '\\omega')} = \\tfrac{\\hbar^2 ${k}^2}{2m_0}`,
        `${vg} = \\tfrac{\\hbar ${k}}{m_0} = 2${vp},\\; \\omega'' = \\tfrac{\\hbar}{m_0}`
      ]
  }
}
