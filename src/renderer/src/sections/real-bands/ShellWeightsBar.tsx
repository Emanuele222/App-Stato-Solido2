/**
 * Istogramma compatto dei pesi in onde piane ∑_{|G|²=s} |c_G|² raggruppati per guscio di |G|²
 * nello stato (k, banda) scelto. Racchiuso in `.pseudo-shells-box` (position: relative), che
 * dà al canvas la sua area (vedi pseudopotential.css).
 * In alto una riga per il titolo e una fascia riservata alle percentuali: la barra più alta
 * non tocca mai il testo.
 */
import type { JSX } from 'react'
import { formatNumber } from '../../ui/format'
import { quantityColor, TOKENS, type QuantityId } from '../../ui/theme'
import { drawMathText, drawRichText, sansFont, useCanvasDraw, withAlpha } from '../../viz/canvas'
import type { ShellWeight } from '../../physics'
import { strings as s } from './strings'

const MARGIN = { left: 48, right: 16, top: 27, bottom: 17 }
const DIM = 0.25

export function ShellWeightsBar({
  shellWeights,
  highlight
}: {
  readonly shellWeights: readonly ShellWeight[]
  readonly highlight: QuantityId | null
}): JSX.Element {
  const canvasRef = useCanvasDraw((ctx, { w, h }) => {
    const L = MARGIN.left
    const T = MARGIN.top
    const W = Math.max(40, w - MARGIN.left - MARGIN.right)
    const H = Math.max(14, h - MARGIN.top - MARGIN.bottom)

    const emPsi = highlight === null || highlight === 'psi' ? 1 : DIM
    const psiCol = quantityColor('psi')

    drawRichText(ctx, s.scene.shellsTitle, L, 10, {
      size: 11,
      color: TOKENS.muted,
      weight: 500
    })

    ctx.strokeStyle = TOKENS.line
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(L, T + H + 0.5)
    ctx.lineTo(L + W, T + H + 0.5)
    ctx.stroke()

    const n = shellWeights.length
    if (n === 0) return false

    const maxWeight = Math.max(0.25, ...shellWeights.map((sw) => sw.weight))
    const slotW = W / n
    const barW = Math.min(36, Math.max(10, slotW * 0.58))

    shellWeights.forEach((sw, i) => {
      const cx = L + (i + 0.5) * slotW
      const bh = Math.max(1.5, (sw.weight / maxWeight) * H)
      const bx = cx - barW / 2
      const by = T + H - bh

      ctx.save()
      ctx.globalAlpha = emPsi * (sw.weight > 0.01 ? 0.88 : 0.38)
      ctx.fillStyle = withAlpha(psiCol, 0.34)
      ctx.strokeStyle = psiCol
      ctx.lineWidth = 1.4
      ctx.fillRect(bx, by, barW, bh)
      ctx.strokeRect(bx + 0.5, by + 0.5, Math.max(1, barW - 1), Math.max(1, bh - 1))
      ctx.restore()

      const pct = sw.weight * 100
      if (pct >= 0.5) {
        ctx.font = sansFont(10)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillStyle = withAlpha(TOKENS.textSoft, emPsi)
        ctx.fillText(`${formatNumber(pct, pct >= 10 ? 0 : 1)}%`, cx, by - 2)
      }

      ctx.font = sansFont(10.5)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = TOKENS.muted
      ctx.fillText(String(sw.gSq), cx, T + H + 2)
    })

    drawMathText(ctx, '|G|^{2}', L - 8, T + H + 11, {
      color: TOKENS.dim,
      size: 10.5,
      align: 'right',
      italic: false
    })

    return false
  })

  return (
    <div className="pseudo-shells-box">
      <canvas
        ref={canvasRef}
        className="pseudo-shells-canvas"
        role="img"
        aria-label={s.scene.shellsAria}
      />
    </div>
  )
}
