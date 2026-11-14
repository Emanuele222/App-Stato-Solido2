/**
 * Piccolo diagramma «bordi delle bande in funzione di a» mostrato nella sezione
 * quando l'interruttore «Avvicina gli atomi» è attivo.
 */
import { memo, type JSX } from 'react'
import type { TightBindingEdgePoint } from '../../physics'
import { formatNumber } from '../../ui/format'
import { quantityColor, TOKENS } from '../../ui/theme'
import { sansFont, useCanvasDraw } from '../../viz/canvas'
import { strings as s } from './strings'

interface EdgesVsDistancePlotProps {
  readonly points: readonly TightBindingEdgePoint[]
  readonly currentA: number
}

export const EdgesVsDistancePlot = memo(function EdgesVsDistancePlot({
  points,
  currentA
}: EdgesVsDistancePlotProps): JSX.Element {
  const canvasRef = useCanvasDraw((ctx, { w, h }) => {
    if (points.length < 2) return false
    const L = 32
    const R = 16
    const T = 6
    const B = 24
    const W = Math.max(10, w - L - R)
    const H = Math.max(10, h - T - B)

    const aMin = points[0].a
    const aMax = points[points.length - 1].a
    let eLo = Infinity
    let eHi = -Infinity
    for (const pt of points) {
      eLo = Math.min(eLo, pt.sMin, pt.pMin)
      eHi = Math.max(eHi, pt.sMax, pt.pMax)
    }
    const pad = Math.max(0.5, 0.1 * (eHi - eLo))
    eLo -= pad
    eHi += pad

    const X = (a: number): number => L + ((a - aMin) / (aMax - aMin)) * W
    const Y = (E: number): number => T + ((eHi - E) / (eHi - eLo)) * H

    ctx.strokeStyle = TOKENS.line
    ctx.lineWidth = 1
    ctx.strokeRect(L, T, W, H)

    const fillBand = (minKey: 'sMin' | 'pMin', maxKey: 'sMax' | 'pMax', fill: string, stroke: string): void => {
      ctx.fillStyle = fill
      ctx.beginPath()
      ctx.moveTo(X(points[0].a), Y(points[0][minKey]))
      for (let i = 1; i < points.length; i++) ctx.lineTo(X(points[i].a), Y(points[i][minKey]))
      for (let i = points.length - 1; i >= 0; i--) ctx.lineTo(X(points[i].a), Y(points[i][maxKey]))
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = stroke
      ctx.lineWidth = 1.4
      for (const key of [minKey, maxKey]) {
        ctx.beginPath()
        points.forEach((pt, i) => {
          const x = X(pt.a)
          const y = Y(pt[key])
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
      }
    }

    fillBand('sMin', 'sMax', 'rgba(131, 193, 103, 0.22)', quantityColor('E'))
    fillBand('pMin', 'pMax', 'rgba(92, 208, 179, 0.22)', quantityColor('v'))

    // Valore corrente di a
    const ax = X(Math.max(aMin, Math.min(aMax, currentA)))
    ctx.strokeStyle = quantityColor('a')
    ctx.lineWidth = 1.8
    ctx.beginPath()
    ctx.moveTo(ax, T)
    ctx.lineTo(ax, T + H)
    ctx.stroke()

    ctx.font = sansFont(10)
    ctx.fillStyle = TOKENS.muted
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText(formatNumber(eHi, 0), L - 4, T + 5)
    ctx.fillText(formatNumber(eLo, 0), L - 4, T + H - 4)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    for (const aTick of [2, 3, 4, 5]) {
      ctx.fillText(`${aTick}`, X(aTick), T + H + 4)
    }
    ctx.fillText('6', Math.min(w - 18, X(6)), T + H + 4)

    ctx.textAlign = 'right'
    ctx.fillStyle = quantityColor('a')
    ctx.fillText('a (Å)', w - 4, T + H + 13)

    return false
  })

  return (
    <div className="tb-edges-card">
      <p className="tb-edges-caption">
        <span>{s.scene.indicativeModelDiagram}</span>
        <span className="num">a = {formatNumber(currentA, 2)} Å</span>
      </p>
      <div className="tb-edges-canvas-box">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={s.scene.indicativeModelDiagram}
        />
      </div>
    </div>
  )
})
