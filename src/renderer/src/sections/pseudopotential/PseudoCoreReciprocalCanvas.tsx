/**
 * Terza vista (Sezione A «Pseudopotenziale»): Spazio reciproco.
 *  - Sinistra: pesi |c_G|² per n = −12…12 di ψ_k (coda lunga) contro ψ^f (poche onde).
 *  - Destra: elementi di matrice ⟨k+G|V|k⟩ contro ⟨k+G|V+V′|k⟩ per n = −6…6 (cancellazione).
 */
import type { JSX } from 'react'
import { quantityColor, toneColor, TOKENS, type QuantityId } from '../../ui/theme'
import { drawMathText, sansFont, useCanvasDraw, withAlpha } from '../../viz/canvas'
import type { PseudoCoreModel } from './model'

const MARGIN = { left: 28, right: 12, top: 14, bottom: 22 }
const DIM = 0.25

export function PseudoCoreReciprocalCanvas({
  model,
  highlight
}: {
  readonly model: PseudoCoreModel
  readonly highlight: QuantityId | null
}): JSX.Element {
  const canvasRef = useCanvasDraw((ctx, { w, h }) => {
    const L = MARGIN.left
    const T = MARGIN.top
    const W = Math.max(80, w - MARGIN.left - MARGIN.right)
    const H = Math.max(40, h - MARGIN.top - MARGIN.bottom)
    const gapMid = 22
    const leftW = (W - gapMid) * 0.54
    const rightL = L + leftW + gapMid
    const rightW = W - leftW - gapMid

    const emPsi = highlight === null || highlight === 'psi' ? 1 : DIM
    const emV = highlight === null || highlight === 'VG' ? 1 : DIM

    // --- SINISTRA: Pesi |c_G|² ---
    const { weightsTrue, weightsSmooth } = model
    const nDisp = (weightsTrue.length - 1) / 2 // 12
    const maxW = Math.max(0.1, ...weightsTrue, ...weightsSmooth)
    const barStep = leftW / weightsTrue.length

    ctx.strokeStyle = TOKENS.line
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(L, T + H)
    ctx.lineTo(L + leftW, T + H)
    ctx.stroke()

    for (let i = 0; i < weightsTrue.length; i++) {
      const x0 = L + i * barStep + 1
      const bw = Math.max(2, barStep - 2)
      const hT = (weightsTrue[i] / maxW) * (H - 8)
      const hS = (weightsSmooth[i] / maxW) * (H - 8)

      ctx.fillStyle = withAlpha(quantityColor('psi'), 0.75 * emPsi)
      ctx.fillRect(x0, T + H - hT, bw * 0.48, hT)

      ctx.fillStyle = withAlpha(toneColor('smoothWavefunction'), 0.85 * emPsi)
      ctx.fillRect(x0 + bw * 0.5, T + H - hS, bw * 0.48, hS)

      const n = i - nDisp
      if (n % 4 === 0) {
        drawMathText(ctx, String(n), x0 + bw * 0.5, T + H + 12, {
          color: TOKENS.muted,
          size: 10,
          align: 'center'
        })
      }
    }
    ctx.font = sansFont(10.5)
    ctx.fillStyle = TOKENS.dim
    ctx.textAlign = 'left'
    ctx.fillText('|c_G|² (n)', L, T + 4)

    // --- DESTRA: Cancellazione V vs V + V' ---
    const { nValues, vMat, vPsMat } = model.cancellation
    let maxMat = 1
    for (let i = 0; i < nValues.length; i++) {
      maxMat = Math.max(maxMat, Math.abs(vMat[i]), Math.abs(vPsMat[i]))
    }
    const midY = T + H * 0.5
    const rStep = rightW / nValues.length

    ctx.strokeStyle = TOKENS.lineStrong
    ctx.beginPath()
    ctx.moveTo(rightL, midY)
    ctx.lineTo(rightL + rightW, midY)
    ctx.stroke()

    for (let i = 0; i < nValues.length; i++) {
      const x0 = rightL + i * rStep + 1
      const bw = Math.max(2, rStep - 2)
      const yScale = (H * 0.44) / maxMat

      const hV = vMat[i] * yScale
      ctx.fillStyle = withAlpha(quantityColor('VG'), 0.8 * emV)
      ctx.fillRect(x0, hV >= 0 ? midY - hV : midY, bw * 0.48, Math.abs(hV))

      const hPs = vPsMat[i] * yScale
      ctx.fillStyle = withAlpha(quantityColor('E'), 0.85 * emV)
      ctx.fillRect(x0 + bw * 0.5, hPs >= 0 ? midY - hPs : midY, bw * 0.48, Math.abs(hPs))

      const n = nValues[i]
      if (n % 2 === 0) {
        drawMathText(ctx, String(n), x0 + bw * 0.5, T + H + 12, {
          color: TOKENS.muted,
          size: 10,
          align: 'center'
        })
      }
    }
    ctx.font = sansFont(10.5)
    ctx.fillStyle = TOKENS.dim
    ctx.textAlign = 'left'
    ctx.fillText('V vs V+V′ (eV)', rightL, T + 4)

    return false
  })

  return <canvas ref={canvasRef} />
}
