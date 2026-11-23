/**
 * Seconda vista (Sezione A «Pseudopotenziale»): Spazio reale [-a, a].
 *  - In alto: V(x) con le buche gaussiane sugli ioni in x = -a, 0, a.
 *  - Sotto: ψ_c(x) localizzata sullo ione, ψ_k(x) vera (oscilla nel core),
 *    e ψ^f(x) (cambia con α), con il raggio indicativo di core ±r_c segnato.
 */
import type { JSX } from 'react'
import { quantityColor, toneColor, TOKENS, type QuantityId } from '../../ui/theme'
import { drawMathText, sansFont, useCanvasDraw, withAlpha } from '../../viz/canvas'
import type { PseudoCoreModel } from './model'

const MARGIN = { left: 38, right: 12, top: 8, bottom: 22 }
const DIM = 0.25

export function PseudoCoreRealSpaceCanvas({
  model,
  highlight
}: {
  readonly model: PseudoCoreModel
  readonly highlight: QuantityId | null
}): JSX.Element {
  const canvasRef = useCanvasDraw((ctx, { w, h }) => {
    const L = MARGIN.left
    const T = MARGIN.top
    const W = Math.max(40, w - MARGIN.left - MARGIN.right)
    const H = Math.max(60, h - MARGIN.top - MARGIN.bottom)
    const { a, v0 } = model.params
    const { xGrid, potential, psiCoreRe, psiTrueRe, psiSmoothRe, rc } = model.realSpace

    const X = (x: number): number => L + ((x + a) / (2 * a)) * W
    const emV = highlight === null || highlight === 'VG' ? 1 : DIM
    const emPsi = highlight === null || highlight === 'psi' ? 1 : DIM

    // Fascia superiore: V(x) (36% dell'altezza)
    const potH = H * 0.34
    const potTop = T
    const potBot = potTop + potH
    const yV = (V: number): number => potTop + 4 + (Math.abs(V) / Math.max(10, v0)) * (potH - 8)

    ctx.strokeStyle = TOKENS.line
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(L, potTop + 4)
    ctx.lineTo(L + W, potTop + 4)
    ctx.stroke()

    ctx.save()
    ctx.strokeStyle = withAlpha(quantityColor('VG'), emV)
    ctx.lineWidth = 1.8
    ctx.beginPath()
    for (let i = 0; i < xGrid.length; i++) {
      const px = X(xGrid[i])
      const py = yV(potential[i])
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.restore()

    // Ioni in x = -a, 0, a
    for (const xIon of [-a, 0, a]) {
      const px = X(xIon)
      ctx.fillStyle = quantityColor('VG')
      ctx.beginPath()
      ctx.arc(px, potTop + 4, 3.2, 0, Math.PI * 2)
      ctx.fill()
    }

    // Fascia inferiore: funzioni d'onda (60% dell'altezza)
    const wfTop = potBot + 10
    const wfH = T + H - wfTop
    const wfMid = wfTop + wfH * 0.5
    let maxAbs = 0.2
    for (let i = 0; i < xGrid.length; i++) {
      maxAbs = Math.max(
        maxAbs,
        Math.abs(psiCoreRe[i]),
        Math.abs(psiTrueRe[i]),
        Math.abs(psiSmoothRe[i])
      )
    }
    const yPsi = (val: number): number => wfMid - (val / (maxAbs * 1.12)) * (wfH * 0.46)

    // Zona core ±r_c attorno a x = 0
    const xL = X(-rc)
    const xR = X(rc)
    ctx.save()
    ctx.fillStyle = withAlpha(quantityColor('VG'), 0.08)
    ctx.fillRect(xL, potTop, xR - xL, T + H - potTop)
    ctx.strokeStyle = withAlpha(quantityColor('VG'), 0.45)
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(xL, potTop)
    ctx.lineTo(xL, T + H)
    ctx.moveTo(xR, potTop)
    ctx.lineTo(xR, T + H)
    ctx.stroke()
    ctx.restore()

    drawMathText(ctx, 'r_{c}', xR + 4, wfTop + 8, { color: quantityColor('VG'), size: 10, align: 'left' })

    // Asse zero delle ψ
    ctx.strokeStyle = TOKENS.line
    ctx.beginPath()
    ctx.moveTo(L, wfMid)
    ctx.lineTo(L + W, wfMid)
    ctx.stroke()

    const drawWave = (arr: Float64Array, color: string, width: number, dash: number[] = []): void => {
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.setLineDash(dash)
      ctx.beginPath()
      for (let i = 0; i < xGrid.length; i++) {
        const px = X(xGrid[i])
        const py = yPsi(arr[i])
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.restore()
    }

    drawWave(psiCoreRe, withAlpha(quantityColor('VG'), 0.65 * emV), 1.4, [2, 2])
    drawWave(psiTrueRe, withAlpha(quantityColor('psi'), emPsi), 2.0)
    drawWave(psiSmoothRe, withAlpha(toneColor('smoothWavefunction'), emPsi), 2.1, [6, 4])

    // Etichette asse x
    ctx.font = sansFont(10.5)
    for (const [xv, lbl] of [
      [-a, '−a'],
      [0, '0'],
      [a, 'a']
    ] as const) {
      drawMathText(ctx, lbl, X(xv), T + H + 13, { color: TOKENS.muted, size: 10.5, align: 'center' })
    }
    return false
  })

  return <canvas ref={canvasRef} />
}
