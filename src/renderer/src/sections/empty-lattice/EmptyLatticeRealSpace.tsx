/**
 * Spazio reale del reticolo vuoto su Canvas 2D:
 * - ioni in x = n·a con indicatore del passo reticolare a;
 * - parte reale dell'onda piana Re ψ(x) = cos((k′+G)x);
 * - punti evidenziati sugli ioni x = n·a per mostrare che la fase da uno ione
 *   al successivo (e^{ik′a}) non cambia cambiando ramo n;
 * - riferimento della densità uniforme |ψ|² = 1.
 */
import { memo, type JSX } from 'react'
import { planeWaveRealPartAtIon } from '../../physics'
import { quantityColor, TOKENS, type QuantityId } from '../../ui/theme'
import { drawMathText, sansFont, useCanvasDraw, withAlpha } from '../../viz/canvas'
import type { HighlightTarget } from './store'

export interface EmptyLatticeRealSpaceProps {
  readonly xs: Float64Array
  readonly waveReal: Float64Array
  readonly kReduced: number
  readonly a: number
  readonly highlight: QuantityId | null
  readonly highlightTarget: HighlightTarget
  readonly labels: {
    readonly ariaLabel: string
    readonly waveLabel: string
    readonly densityLabel: string
    readonly ions: string
  }
}

const DIM = 0.28

export const EmptyLatticeRealSpace = memo(function EmptyLatticeRealSpace(
  props: EmptyLatticeRealSpaceProps
): JSX.Element {
  const canvasRef = useCanvasDraw((ctx, { w, h }) => {
    const p = props
    const n = p.xs.length
    if (n < 2) return false
    const x0 = p.xs[0]
    const x1 = p.xs[n - 1]
    const left = 50
    const padX = 16
    const X = (x: number): number => left + ((x - x0) / (x1 - x0)) * (w - left - padX)

    const hlA = p.highlight === 'a' && p.highlightTarget !== 'G'
    const emA = p.highlight === null || hlA ? 1 : p.highlight === 'a' ? 0.6 : DIM
    const emPsi = p.highlight === null || p.highlight === 'psi' || p.highlight === 'k' ? 1 : DIM

    const ionY = h - 16
    const top = 12
    const waveAreaBottom = ionY - 24
    const waveMid = Math.round((top + waveAreaBottom) * 0.54)
    const waveAmp = Math.max(12, Math.min((waveMid - top - 8) * 0.72, (waveAreaBottom - waveMid - 4) * 0.85))
    const densityY = Math.round(waveMid - waveAmp)

    // Guide verticali sugli ioni x = m·a
    const a = p.a
    const nFirst = Math.ceil(x0 / a)
    const nLast = Math.floor(x1 / a)
    ctx.globalAlpha = emA
    ctx.strokeStyle = hlA ? TOKENS.lineStrong : TOKENS.line
    ctx.lineWidth = hlA ? 1.5 : 1
    for (let i = nFirst; i <= nLast; i++) {
      const x = Math.round(X(i * a)) + 0.5
      ctx.beginPath()
      ctx.moveTo(x, top)
      ctx.lineTo(x, ionY)
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    const colPsi = quantityColor('psi')
    ctx.globalAlpha = emPsi

    // Livello di riferimento |ψ|² = 1 (uniforme)
    ctx.strokeStyle = withAlpha(colPsi, 0.5)
    ctx.setLineDash([3, 4])
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(left, densityY + 0.5)
    ctx.lineTo(w - padX, densityY + 0.5)
    ctx.stroke()
    ctx.setLineDash([])
    drawMathText(ctx, p.labels.densityLabel, w - padX - 2, densityY - 5, {
      color: withAlpha(colPsi, 0.85),
      size: 12,
      align: 'right',
      backdrop: TOKENS.bg
    })

    // Asse zero di Re ψ(x)
    ctx.strokeStyle = TOKENS.dim
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(left, waveMid + 0.5)
    ctx.lineTo(w - padX, waveMid + 0.5)
    ctx.stroke()

    // Area morbida sotto Re ψ(x)
    ctx.beginPath()
    ctx.moveTo(X(x0), waveMid)
    for (let i = 0; i < n; i++) {
      ctx.lineTo(X(p.xs[i]), waveMid - p.waveReal[i] * waveAmp)
    }
    ctx.lineTo(X(x1), waveMid)
    ctx.closePath()
    ctx.fillStyle = withAlpha(colPsi, 0.08)
    ctx.fill()

    // Curva Re ψ(x) = cos((k′+G)x)
    ctx.strokeStyle = colPsi
    ctx.lineWidth = p.highlight === 'psi' ? 2.8 : 2
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const y = waveMid - p.waveReal[i] * waveAmp
      if (i === 0) ctx.moveTo(X(p.xs[i]), y)
      else ctx.lineTo(X(p.xs[i]), y)
    }
    ctx.stroke()

    // Valore invariante sugli ioni: Re ψ(m·a) = cos(k′·m·a)
    for (let i = nFirst; i <= nLast; i++) {
      const x = X(i * a)
      const val = planeWaveRealPartAtIon(p.kReduced, a, i)
      const y = waveMid - val * waveAmp
      ctx.strokeStyle = withAlpha(quantityColor('k'), 0.65)
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(x, waveMid)
      ctx.lineTo(x, y)
      ctx.stroke()

      ctx.fillStyle = TOKENS.bg
      ctx.strokeStyle = quantityColor('k')
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, 3.5, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
    }

    drawMathText(ctx, p.labels.waveLabel, left - 8, waveMid + 4, {
      color: colPsi,
      size: 13,
      align: 'right'
    })
    ctx.globalAlpha = 1

    // Ioni e passo a
    ctx.fillStyle = TOKENS.muted
    for (let i = nFirst; i <= nLast; i++) {
      ctx.beginPath()
      ctx.arc(X(i * a), ionY, 4, 0, 2 * Math.PI)
      ctx.fill()
    }

    const nMid = Math.floor((x0 + x1) / 2 / a)
    const xa0 = X(nMid * a)
    const xa1 = X((nMid + 1) * a)
    ctx.globalAlpha = emA
    ctx.strokeStyle = quantityColor('a')
    ctx.lineWidth = hlA ? 3 : 2
    ctx.beginPath()
    ctx.moveTo(xa0 + 7, ionY)
    ctx.lineTo(xa1 - 7, ionY)
    ctx.stroke()
    drawMathText(ctx, 'a', (xa0 + xa1) / 2, ionY - 7, {
      color: quantityColor('a'),
      align: 'center',
      size: 16
    })
    ctx.globalAlpha = 1

    ctx.font = sansFont(11)
    ctx.fillStyle = TOKENS.dim
    ctx.textAlign = 'right'
    ctx.textBaseline = 'alphabetic'
    const lastIonX = X(nLast * a)
    const ionsW = ctx.measureText(p.labels.ions).width
    if (w - padX - lastIonX > ionsW + 12) {
      ctx.fillText(p.labels.ions, w - padX, ionY + 4)
    } else {
      ctx.fillStyle = TOKENS.bg
      ctx.fillRect(w - padX - ionsW - 4, ionY - 14, ionsW + 6, 13)
      ctx.fillStyle = TOKENS.dim
      ctx.fillText(p.labels.ions, w - padX, ionY - 4)
    }

    return false
  })

  return <canvas ref={canvasRef} className="real-canvas" role="img" aria-label={props.labels.ariaLabel} />
})
