/**
 * Formule vive della sezione «Calore specifico del reticolo»
 * (dispensa Parte 6, Lezione 4: §§20–23, §25, eqq. 52–59 e 61–62).
 *
 * Tutti gli id usati in \htmlData{q=...} esistono in src/renderer/src/ui/theme.ts.
 */
import type { HistoricalStage } from './manifest'

const q = (id: string, body: string): string => `\\htmlData{q=${id}}{${body}}`

const CV = q('CV', 'C_V')
const CVE = q('omegaOpt', 'C_V^{\\mathrm{E}}')
const T = q('T', 'T')
const ThetaD = q('Theta', '\\Theta_D')
const omegaD = q('Theta', '\\omega_D')
const kD = q('Theta', 'k_D')
const kT = q('k', 'k_T')
const ThetaE = q('omegaOpt', '\\Theta_E')
const omegaE = q('omegaOpt', '\\omega_E')
const threeR = q('Ek', '3R')
const t3 = q('omega', 'T^3')
const vs = q('v', 'v_s')
const vg = q('v', 'v_g')

export function mainFormulaTex(stage: HistoricalStage): string {
  switch (stage) {
    case 'dulong-petit':
      return `${CV} = \\left(\\dfrac{\\partial U}{\\partial ${T}}\\right)_V = ${threeR} \\approx 24{,}94\\;\\mathrm{J\\,mol^{-1}K^{-1}}`
    case 'einstein':
      return `${CVE} = ${threeR}\\,\\mathcal{E}\\!\\left(\\dfrac{${ThetaE}}{${T}}\\right),\\quad \\mathcal{E}(x) = \\dfrac{x^2 e^x}{(e^x - 1)^2}`
    case 'debye':
      return `${CV}^{\\mathrm{D}} = 9R\\left(\\dfrac{${T}}{${ThetaD}}\\right)^3\\!\\int_0^{${ThetaD}/${T}} \\dfrac{x^4 e^x}{(e^x - 1)^2}\\,\\mathrm{d}x`
    case 'beyond-1953':
      return `\\tilde{u}_{\\mathrm{ph}} = \\dfrac{\\pi^2 k_B^4}{10\\hbar^3 ${vs}^3}${T}^4 \\;\\;\\mathrm{vs}\\;\\; \\tilde{u}_\\gamma = \\dfrac{\\pi^2 k_B^4}{15\\hbar^3 c^3}${T}^4`
    case 'comparison':
      return `${CV}(${T}) = ${threeR}\\int_0^1 3w^2\\,\\mathcal{E}\\!\\left(w\\dfrac{${ThetaD}}{${T}}\\right)\\mathrm{d}w`
  }
}

export function secondaryFormulasTex(stage: HistoricalStage): readonly string[] {
  switch (stage) {
    case 'dulong-petit':
      return [
        `\\langle E_{\\mathrm{1D}}\\rangle = \\tfrac{1}{2}k_B ${T} + \\tfrac{1}{2}k_B ${T} = k_B ${T}`,
        `U = 3 N_A k_B ${T} = ${threeR}\\,${T}`
      ]
    case 'einstein':
      return [
        `${ThetaE} = \\dfrac{\\hbar${omegaE}}{k_B},\\quad \\bar{n} = \\dfrac{1}{\\exp(\\hbar${omegaE}/k_B ${T}) - 1}`,
        `${T} \\ll ${ThetaE}:\\; ${CVE} \\simeq ${threeR}\\left(\\dfrac{${ThetaE}}{${T}}\\right)^2 e^{-${ThetaE}/${T}}`
      ]
    case 'debye':
      return [
        `g(\\omega) = \\dfrac{V\\omega^2}{2\\pi^2 ${vs}^3}\\;(\\text{per pol.}),\\quad 3\\int_0^{${omegaD}} g(\\omega)\\,\\mathrm{d}\\omega = 3N`,
        `${T} \\ll ${ThetaD}:\\; ${CV}^{\\mathrm{D}} \\simeq \\dfrac{12\\pi^4}{5}R\\left(\\dfrac{${T}}{${ThetaD}}\\right)^3 \\;(${t3})`
      ]
    case 'beyond-1953':
      return [
        `g_{\\mathrm{1D}}(\\omega) = \\dfrac{2N}{\\pi\\omega_{\\max}}\\dfrac{1}{\\sqrt{1 - \\omega^2/\\omega_{\\max}^2}},\\quad ${vg}(\\omega_{\\max}) = 0`,
        `${CV} = k_B \\sum_j \\mathcal{E}\\!\\left(\\dfrac{\\hbar\\omega_j}{k_B ${T}}\\right),\\quad \\dfrac{\\tilde{u}_{\\mathrm{ph}}}{\\tilde{u}_\\gamma}\\Big|_{v_s=c} = \\dfrac{3}{2}`
      ]
    case 'comparison':
      return [
        `${CVE} = ${threeR}\\,\\mathcal{E}\\!\\left(\\dfrac{${ThetaE}}{${T}}\\right),\\quad ${q('omega', 'C_V^{(T^3)}')} \\simeq 233{,}78\\,R\\left(\\dfrac{${T}}{${ThetaD}}\\right)^3`,
        `w = \\dfrac{\\omega}{${omegaD}},\\quad \\dfrac{${kT}}{${kD}} = \\dfrac{${T}}{${ThetaD}}`
      ]
  }
}
