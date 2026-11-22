/**
 * Canvas per la miniatura a riposo e l'anteprima ciclica animata delle bande.
 * Supporta la transizione morbida (cross-fade interpolata) tra i metodi.
 */
import type { JSX } from 'react'
import { QUANTITIES, TOKENS } from '../ui/theme'
import { drawMathText, useCanvasDraw, withAlpha, type CanvasSize } from '../viz/canvas'
import type { MethodPreviewData } from './curves'

interface BandPreviewCanvasProps {
  readonly current: MethodPreviewData
  readonly next?: MethodPreviewData | null
  readonly fadeProgress?: number
}

export function BandPreviewCanvas({
  current,
  next = null,
  fadeProgress = 0
}: BandPreviewCanvasProps): JSX.Element {
  const canvasRef = useCanvasDraw((ctx, size) => {
    const { w, h } = size
    if (w <= 0 || h <= 0) return false

    ctx.clearRect(0, 0, w, h)

    if (!next || fadeProgress <= 0) {
      drawMethodBands(ctx, current, size, 1)
    } else if (fadeProgress >= 1) {
      drawMethodBands(ctx, next, size, 1)
    } else {
      drawMethodBands(ctx, current, size, 1 - fadeProgress)
      drawMethodBands(ctx, next, size, fadeProgress)
    }

    return false
  })

  return <canvas ref={canvasRef} className="band-preview-canvas" aria-hidden="true" />
}

function drawMethodBands(
  ctx: CanvasRenderingContext2D,
  data: MethodPreviewData,
  size: CanvasSize,
  alpha: number
): void {
  if (alpha <= 0.005) return

  ctx.save()
  ctx.globalAlpha = alpha

  const padLeft = 24
  const padRight = 16
  const padTop = 24
  const padBottom = 22

  const plotW = size.w - padLeft - padRight
  const plotH = size.h - padTop - padBottom

  // Linea di base orizzontale
  ctx.strokeStyle = withAlpha(TOKENS.lineStrong, 0.8)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padLeft, size.h - padBottom)
  ctx.lineTo(size.w - padRight, size.h - padBottom)
  ctx.stroke()

  // Linee di simmetria verticali e etichette k
  for (const tick of data.kLabels) {
    const x = padLeft + tick.frac * plotW
    ctx.strokeStyle = withAlpha(TOKENS.line, 0.6)
    ctx.setLineDash([2, 3])
    ctx.beginPath()
    ctx.moveTo(x, padTop)
    ctx.lineTo(x, size.h - padBottom)
    ctx.stroke()

    drawMathText(ctx, tick.label, x, size.h - 6, {
      color: TOKENS.muted,
      size: 10,
      align: 'center'
    })
  }
  ctx.setLineDash([])

  // Disegno delle bande / rami calcolati
  ctx.lineWidth = 1.75
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const eSpan = data.eMax - data.eMin || 1
  const fallbackColor = data.defaultColor ?? QUANTITIES.E.color
  data.bands.forEach((band, bandIdx) => {
    ctx.strokeStyle = data.bandColors?.[bandIdx] ?? fallbackColor
    ctx.beginPath()
    for (let i = 0; i < band.length; i++) {
      const x = padLeft + data.kNormalized[i] * plotW
      const y = size.h - padBottom - ((band[i] - data.eMin) / eSpan) * plotH
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  })

  ctx.restore()
}
