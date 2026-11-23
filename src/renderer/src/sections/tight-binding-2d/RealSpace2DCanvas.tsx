/**
 * Vista 3: Spazio reale bidimensionale (reticolo quadrato o grafene)
 * con cella primitiva, vettori primitivi a₁, a₂ e (per il grafene)
 * sottoreticoli A/B e primi vicini δ₁, δ₂, δ₃.
 */
import type { JSX } from 'react'
import { grapheneVectors } from '../../physics'
import { quantityColor, TOKENS, type QuantityId } from '../../ui/theme'
import { drawMathText, sansFont, useCanvasDraw, withAlpha } from '../../viz/canvas'
import type { TightBinding2DModel } from './model'
import { strings as s } from './strings'

const DIM = 0.28

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  width = 1.8
): void {
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy)
  if (len < 2) return
  const ux = dx / len
  const uy = dy / len
  const head = 7
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1 - ux * 4, y1 - uy * 4)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 - ux * head - uy * (head * 0.48), y1 - uy * head + ux * (head * 0.48))
  ctx.lineTo(x1 - ux * head + uy * (head * 0.48), y1 - uy * head - ux * (head * 0.48))
  ctx.closePath()
  ctx.fill()
}

export function RealSpace2DCanvas({
  model,
  highlight
}: {
  readonly model: TightBinding2DModel
  readonly highlight: QuantityId | null
}): JSX.Element {
  const canvasRef = useCanvasDraw((ctx, { w, h }) => {
    const emA = highlight === null || highlight === 'a' ? 1 : DIM
    const cx = w * 0.46
    const cy = h * 0.54

    if (model.lattice === 'square') {
      const a = model.a
      const scale = Math.min(w, h) / (4.4 * a)
      const X = (x: number): number => cx + x * scale
      const Y = (y: number): number => cy - y * scale

      // Griglia di legami
      ctx.strokeStyle = TOKENS.lineStrong
      ctx.lineWidth = 1
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath()
        ctx.moveTo(X(i * a), Y(-2 * a))
        ctx.lineTo(X(i * a), Y(2 * a))
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(X(-2 * a), Y(i * a))
        ctx.lineTo(X(2 * a), Y(i * a))
        ctx.stroke()
      }

      // Cella primitiva (0,0)–(a,a)
      ctx.save()
      ctx.globalAlpha = emA
      ctx.fillStyle = withAlpha(quantityColor('a'), 0.14)
      ctx.fillRect(X(0), Y(a), a * scale, a * scale)
      ctx.strokeStyle = quantityColor('a')
      ctx.lineWidth = 1.4
      ctx.strokeRect(X(0), Y(a), a * scale, a * scale)

      // Vettori primitivi a₁ e a₂
      drawArrow(ctx, X(0), Y(0), X(a), Y(0), quantityColor('a'), 2.1)
      drawArrow(ctx, X(0), Y(0), X(0), Y(a), quantityColor('a'), 2.1)
      ctx.font = sansFont(11.5)
      ctx.fillStyle = quantityColor('a')
      drawMathText(ctx, 'a_1', X(a * 0.52), Y(-0.22 * a), { size: 12, color: quantityColor('a'), align: 'center' })
      drawMathText(ctx, 'a_2', X(-0.26 * a), Y(a * 0.52), { size: 12, color: quantityColor('a'), align: 'center' })
      ctx.restore()

      // Atomi
      for (let ix = -2; ix <= 2; ix++) {
        for (let iy = -2; iy <= 2; iy++) {
          ctx.beginPath()
          ctx.arc(X(ix * a), Y(iy * a), 4.5, 0, Math.PI * 2)
          ctx.fillStyle = TOKENS.text
          ctx.fill()
          ctx.strokeStyle = TOKENS.bg
          ctx.lineWidth = 1.2
          ctx.stroke()
        }
      }
      return false
    }

    // Grafene
    const { a, a1, a2, delta } = grapheneVectors(model.a)
    const scale = Math.min(w, h) / (3.9 * a)
    const X = (x: number): number => cx - a * 0.45 * scale + x * scale
    const Y = (y: number): number => cy - y * scale

    // Legami C–C
    ctx.strokeStyle = TOKENS.lineStrong
    ctx.lineWidth = 1.3
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        const ax = i * a1[0] + j * a2[0]
        const ay = i * a1[1] + j * a2[1]
        for (const d of delta) {
          ctx.beginPath()
          ctx.moveTo(X(ax), Y(ay))
          ctx.lineTo(X(ax + d[0]), Y(ay + d[1]))
          ctx.stroke()
        }
      }
    }

    // Cella primitiva (rombo a₁, a₂)
    ctx.save()
    ctx.globalAlpha = emA
    ctx.beginPath()
    ctx.moveTo(X(0), Y(0))
    ctx.lineTo(X(a1[0]), Y(a1[1]))
    ctx.lineTo(X(a1[0] + a2[0]), Y(a1[1] + a2[1]))
    ctx.lineTo(X(a2[0]), Y(a2[1]))
    ctx.closePath()
    ctx.fillStyle = withAlpha(quantityColor('a'), 0.14)
    ctx.fill()
    ctx.strokeStyle = quantityColor('a')
    ctx.lineWidth = 1.3
    ctx.stroke()

    drawArrow(ctx, X(0), Y(0), X(a1[0]), Y(a1[1]), quantityColor('a'), 2)
    drawArrow(ctx, X(0), Y(0), X(a2[0]), Y(a2[1]), quantityColor('a'), 2)
    ctx.fillStyle = quantityColor('a')
    drawMathText(ctx, 'a_1', X(a1[0] * 0.62), Y(a1[1] * 0.62 - 0.16 * a), { size: 12, color: quantityColor('a'), align: 'center' })
    drawMathText(ctx, 'a_2', X(a2[0] * 0.62), Y(a2[1] * 0.62 + 0.2 * a), { size: 12, color: quantityColor('a'), align: 'center' })
    ctx.restore()

    // Vettori primi vicini δ₁, δ₂, δ₃ dall'atomo A in (0,0)
    const nnColor = quantityColor('t')
    for (let k = 0; k < 3; k++) {
      const d = delta[k]
      drawArrow(ctx, X(0), Y(0), X(d[0]), Y(d[1]), nnColor, 1.8)
      ctx.fillStyle = nnColor
      drawMathText(
        ctx,
        `δ_${k + 1}`,
        X(d[0] * 1.32),
        Y(d[1] * 1.32),
        { size: 11.5, color: nnColor, align: 'center' }
      )
    }

    // Atomi A e B
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        const ax = i * a1[0] + j * a2[0]
        const ay = i * a1[1] + j * a2[1]
        const bx = ax + delta[0][0]
        const by = ay + delta[0][1]

        ctx.beginPath()
        ctx.arc(X(ax), Y(ay), 4.4, 0, Math.PI * 2)
        ctx.fillStyle = quantityColor('a')
        ctx.fill()
        ctx.strokeStyle = TOKENS.bg
        ctx.lineWidth = 1.2
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(X(bx), Y(by), 4.4, 0, Math.PI * 2)
        ctx.fillStyle = quantityColor('EF')
        ctx.fill()
        ctx.strokeStyle = TOKENS.bg
        ctx.lineWidth = 1.2
        ctx.stroke()
      }
    }

    return false
  })

  return <canvas ref={canvasRef} className="tb2d-canvas" role="img" aria-label={s.views.realSpace.ariaLabel} />
}
