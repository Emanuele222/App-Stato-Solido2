/**
 * Seconda vista (Sezione A «Pseudopotenziale»): Vista delle onde piane.
 * Due schede selezionabili nell'intestazione:
 *  - «Quante onde piane» (iniziale): a sinistra i pesi |c_G|² per n = −4…4 di ψ_k vs ψ^f;
 *    a destra l'errore su E(k) in funzione di N onde piane (scala logaritmica) per H vera
 *    contro H + (E − E_c)|ψ_c⟩⟨ψ_c|, soglia 0,01 eV e numeri di onde necessarie.
 *  - «Cancellazione»: elementi di matrice ⟨k+G|V|k⟩ contro ⟨k+G|V+V′|k⟩ in eV.
 */
import type { JSX } from 'react'
import { formatNumber } from '../../ui/format'
import { quantityColor, toneColor, TOKENS, type QuantityId } from '../../ui/theme'
import {
  drawMathText,
  drawRichText,
  niceStep,
  sansFont,
  useCanvasDraw,
  withAlpha
} from '../../viz/canvas'
import type { PseudoCoreModel } from './model'
import type { GuidedReadingStep, PlaneWaveViewTab } from './store'

const MARGIN = { left: 36, right: 12, top: 24, bottom: 22 }
const DIM = 0.25

export function PseudoCoreReciprocalCanvas({
  model,
  tab,
  highlight,
  guidedStep
}: {
  readonly model: PseudoCoreModel
  readonly tab: PlaneWaveViewTab
  readonly highlight: QuantityId | null
  readonly guidedStep: GuidedReadingStep
}): JSX.Element {
  const canvasRef = useCanvasDraw((ctx, { w, h }) => {
    const L = MARGIN.left
    const T = MARGIN.top
    const W = Math.max(80, w - MARGIN.left - MARGIN.right)
    const H = Math.max(50, h - MARGIN.top - MARGIN.bottom)

    const psiColor = quantityColor('psi')
    const smoothColor = toneColor('smoothWavefunction')
    const potColor = quantityColor('VG')
    const screenedColor = toneColor('screenedPotential')

    const hl = highlight !== null
    const emPsiTrue = hl ? (highlight === 'psi' ? 1 : DIM) : guidedStep === 2 ? DIM : 1
    const emPsiSmooth = hl ? (highlight === 'psi' ? 1 : DIM) : guidedStep === 1 ? DIM : 1
    const emV = hl ? (highlight === 'VG' ? 1 : DIM) : 1
    const emVps = hl ? (highlight === 'VG' || highlight === 'E' ? 1 : DIM) : guidedStep === 1 ? DIM : 1

    if (tab === 'convergence') {
      const gapMid = 34
      const leftW = Math.max(60, (W - gapMid) * 0.44)
      const rightL = L + leftW + gapMid
      const rightW = Math.max(60, W - leftW - gapMid)

      // --- SINISTRA: Pesi |c_G|² per n = -4..4 ---
      const { weightsTrue, weightsSmooth } = model
      const nDisp = (weightsTrue.length - 1) / 2 // 4
      const maxW = Math.max(0.2, ...weightsTrue, ...weightsSmooth, 1)
      const barStep = leftW / weightsTrue.length

      // Asse y pesi (0, 0.5, 1)
      ctx.font = sansFont(9.5)
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      for (const frac of [0, 0.5, 1]) {
        const yy = T + H - frac * (H - 6)
        ctx.strokeStyle = frac === 0 ? TOKENS.lineStrong : TOKENS.line
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(L, yy)
        ctx.lineTo(L + leftW, yy)
        ctx.stroke()
        ctx.fillStyle = TOKENS.dim
        ctx.fillText(`${Math.round(frac * 100)}%`, L - 4, yy)
      }

      for (let i = 0; i < weightsTrue.length; i++) {
        const x0 = L + i * barStep + 1
        const bw = Math.max(2, barStep - 2)
        const hT = (weightsTrue[i] / maxW) * (H - 6)
        const hS = (weightsSmooth[i] / maxW) * (H - 6)

        ctx.fillStyle = withAlpha(psiColor, 0.85 * emPsiTrue)
        ctx.fillRect(x0, T + H - hT, bw * 0.46, hT)

        ctx.fillStyle = withAlpha(smoothColor, 0.9 * emPsiSmooth)
        ctx.fillRect(x0 + bw * 0.5, T + H - hS, bw * 0.46, hS)

        const n = i - nDisp
        if (n % 2 === 0) {
          drawMathText(ctx, String(n), x0 + bw * 0.5, T + H + 13, {
            color: TOKENS.muted,
            size: 10,
            align: 'center'
          })
        }
      }
      drawRichText(ctx, '$|c_{G}|^{2}$ (n = −4…4)', L, T - 8, {
        size: 10.5,
        color: TOKENS.muted,
        align: 'left'
      })

      // --- DESTRA: Errore su E(k) vs N onde piane (scala logaritmica) ---
      const { points, nNeededTrue, nNeededPseudo } = model.convergence
      const maxPlotN = Math.max(15, nNeededTrue ?? 15, nNeededPseudo ?? 15)
      const shownPts = points.filter((pt) => pt.nWaves <= maxPlotN)
      const logMin = -4 // 1e-4 eV
      const logMax = 0.7 // ~5 eV

      const xN = (N: number): number =>
        rightL + ((N - 1) / Math.max(1, maxPlotN - 1)) * (rightW - 6)
      const yErr = (err: number): number => {
        const clamped = Math.max(Math.pow(10, logMin), Math.min(Math.pow(10, logMax), err))
        const lg = Math.log10(clamped)
        return T + ((logMax - lg) / (logMax - logMin)) * (H - 4)
      }

      // Griglia logaritmica (1, 0.1, 0.01, 0.001)
      ctx.font = sansFont(9.5)
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      for (const [val, lbl] of [
        [1, '1'],
        [0.1, '0,1'],
        [0.01, '0,01'],
        [0.001, '10⁻³']
      ] as const) {
        const yy = yErr(val)
        const isThresh = val === 0.01
        ctx.save()
        ctx.strokeStyle = isThresh ? withAlpha(TOKENS.focus, 0.7) : TOKENS.line
        ctx.lineWidth = isThresh ? 1.2 : 1
        if (isThresh) ctx.setLineDash([4, 3])
        ctx.beginPath()
        ctx.moveTo(rightL, yy)
        ctx.lineTo(rightL + rightW, yy)
        ctx.stroke()
        ctx.restore()
        ctx.fillStyle = isThresh ? TOKENS.textSoft : TOKENS.dim
        ctx.fillText(lbl, rightL - 4, yy)
      }

      // Asse N
      ctx.strokeStyle = TOKENS.lineStrong
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(rightL, T + H)
      ctx.lineTo(rightL + rightW, T + H)
      ctx.stroke()

      for (const pt of shownPts) {
        if (pt.nWaves === 1 || pt.nWaves % 4 === 3 || pt.nWaves === maxPlotN) {
          drawMathText(ctx, String(pt.nWaves), xN(pt.nWaves), T + H + 13, {
            color: TOKENS.muted,
            size: 10,
            align: 'center'
          })
        }
      }

      const drawConvSeries = (
        pick: (pt: (typeof shownPts)[number]) => number | null,
        color: string,
        em: number
      ): void => {
        ctx.save()
        ctx.strokeStyle = withAlpha(color, em)
        ctx.fillStyle = withAlpha(color, em)
        ctx.lineWidth = 1.9
        ctx.beginPath()
        let started = false
        for (const pt of shownPts) {
          const val = pick(pt)
          if (val === null) continue
          const px = xN(pt.nWaves)
          const py = yErr(val)
          if (!started) {
            ctx.moveTo(px, py)
            started = true
          } else {
            ctx.lineTo(px, py)
          }
        }
        ctx.stroke()
        for (const pt of shownPts) {
          const val = pick(pt)
          if (val === null) continue
          ctx.beginPath()
          ctx.arc(xN(pt.nWaves), yErr(val), 2.8, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      drawConvSeries((pt) => pt.errorTrue, potColor, emV)
      drawConvSeries((pt) => pt.errorPseudo, screenedColor, emVps)

      // Indicatori numerici (es. «11» e «3») accanto alla soglia 0,01 eV
      const yThresh = yErr(0.01)
      if (nNeededPseudo !== null) {
        const ptP = shownPts.find((p) => p.nWaves === nNeededPseudo)
        const xp = xN(nNeededPseudo)
        const yp = ptP && ptP.errorPseudo !== null ? yErr(ptP.errorPseudo) : yThresh
        drawMathText(ctx, String(nNeededPseudo), xp + 6, Math.max(T + 10, yp - 8), {
          color: withAlpha(screenedColor, emVps),
          size: 11,
          align: 'left',
          backdrop: TOKENS.bg
        })
      }
      if (nNeededTrue !== null) {
        const ptT = shownPts.find((p) => p.nWaves === nNeededTrue)
        const xt = xN(nNeededTrue)
        const yt = ptT && ptT.errorTrue !== null ? yErr(ptT.errorTrue) : yThresh
        const sameAsPseudo = nNeededTrue === nNeededPseudo
        drawMathText(
          ctx,
          String(nNeededTrue),
          xt + (sameAsPseudo ? -6 : 5),
          Math.max(T + 10, yt - (sameAsPseudo ? 16 : 9)),
          {
            color: withAlpha(potColor, emV),
            size: 11,
            align: sameAsPseudo ? 'right' : 'left',
            backdrop: TOKENS.bg
          }
        )
      }

      drawRichText(ctx, 'errore su $E$ (eV) vs $N$', rightL, T - 8, {
        size: 10.5,
        color: TOKENS.muted,
        align: 'left'
      })
      return false
    }

    // ==================== SCHEDA «CANCELLAZIONE» ====================
    const { nValues, vMat, vPsMat } = model.cancellation
    let maxMat = 1
    for (let i = 0; i < nValues.length; i++) {
      maxMat = Math.max(maxMat, Math.abs(vMat[i]), Math.abs(vPsMat[i]))
    }
    const midY = T + H * 0.5
    const yScale = (H * 0.44) / maxMat
    const step = niceStep(maxMat, 2)

    ctx.font = sansFont(9.5)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (const sgn of [-1, 0, 1] as const) {
      for (let m = sgn === 0 ? 0 : 1; m <= 3; m++) {
        const val = sgn * m * step
        if (Math.abs(val) > maxMat * 1.02) continue
        const yy = midY - val * yScale
        ctx.strokeStyle = val === 0 ? TOKENS.lineStrong : TOKENS.line
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(L, yy)
        ctx.lineTo(L + W, yy)
        ctx.stroke()
        ctx.fillStyle = TOKENS.dim
        ctx.fillText(formatNumber(val, step < 1 ? 1 : 0), L - 4, yy)
        if (sgn === 0) break
      }
    }

    const rStep = W / nValues.length
    for (let i = 0; i < nValues.length; i++) {
      const x0 = L + i * rStep + 1
      const bw = Math.max(3, rStep - 2)

      const hV = vMat[i] * yScale
      ctx.fillStyle = withAlpha(potColor, 0.85 * emV)
      ctx.fillRect(x0, hV >= 0 ? midY - hV : midY, bw * 0.46, Math.abs(hV))

      const hPs = vPsMat[i] * yScale
      ctx.fillStyle = withAlpha(screenedColor, 0.9 * emVps)
      ctx.fillRect(x0 + bw * 0.5, hPs >= 0 ? midY - hPs : midY, bw * 0.46, Math.abs(hPs))

      const n = nValues[i]
      if (n % 2 === 0) {
        drawMathText(ctx, String(n), x0 + bw * 0.5, T + H + 13, {
          color: TOKENS.muted,
          size: 10,
          align: 'center'
        })
      }
    }

    // Valori leggibili per n = 1 (prima armonica di reticolo)
    const idx1 = nValues.indexOf(1)
    if (idx1 >= 0) {
      const readout = `n = 1: V = ${formatNumber(vMat[idx1], 2)} eV, V+V′ = ${formatNumber(vPsMat[idx1], 2)} eV`
      drawRichText(ctx, readout, L + W, T - 8, {
        size: 10,
        color: TOKENS.textSoft,
        align: 'right'
      })
    }
    drawRichText(ctx, '⟨k+G|V|k⟩ vs V+V′ (eV)', L, T - 8, {
      size: 10.5,
      color: TOKENS.muted,
      align: 'left'
    })

    return false
  })

  return <canvas ref={canvasRef} />
}
