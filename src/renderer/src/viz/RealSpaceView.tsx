/**
 * Spazio reale su Canvas 2D: ioni in x = n·a, indicatore del passo a,
 * potenziale V(x) e densità |ψ|² dello stato scelto, tutti sulla stessa
 * ascissa assoluta in Å (cambiando a gli ioni si allargano o si stringono).
 * Le guide verticali passano per gli ioni, così si vede subito se la carica
 * sta sugli ioni o fra gli ioni.
 *
 * Nessuna fisica qui: V(x) e |ψ|² arrivano già campionati da physics/.
 */
import { memo, useRef, type JSX } from 'react'
import { Smoothed, useReducedMotion } from '../ui/motion'
import { formatNumber } from '../ui/format'
import { quantityColor, TOKENS, type QuantityId } from '../ui/theme'
import { drawMathText, sansFont, useCanvasDraw, withAlpha } from './canvas'
import './viz.css'

export interface RealSpaceViewProps {
  /** Ascissa campionata (Å), crescente; la finestra è [xs[0], xs[n−1]]. */
  readonly xs: Float64Array
  /** V(x) in eV sugli stessi punti. */
  readonly potential: Float64Array
  /** |ψ|² a media 1 sugli stessi punti, o null se non c'è uno stato. */
  readonly density: Float64Array | null
  /** Passo reticolare (Å): ioni in x = n·a. */
  readonly a: number
  /** Grandezza a cui appartiene la curva del potenziale (per l'evidenziazione). */
  readonly potentialQuantity: QuantityId
  /** Altre grandezze che accendono il potenziale (es. V_2G). */
  readonly potentialAlso?: readonly QuantityId[]
  readonly highlight: QuantityId | null
  readonly labels: {
    readonly ariaLabel: string
    readonly ions: string
    readonly density: string
    readonly potential: string
  }
}

const DIM = 0.3

export const RealSpaceView = memo(function RealSpaceView(props: RealSpaceViewProps): JSX.Element {
  const reduced = useReducedMotion()
  const scales = useRef({
    v: new Smoothed(2, 0.2),
    rho: new Smoothed(2.2, 0.2)
  }).current

  const canvasRef = useCanvasDraw((ctx, { w, h }, dt) => {
    const p = props
    const n = p.xs.length
    if (n < 2) return false
    const x0 = p.xs[0]
    const x1 = p.xs[n - 1]
    // margine sinistro per le etichette (allineato a quello del diagramma E(k))
    const left = 50
    const padX = 16
    const X = (x: number): number => left + ((x - x0) / (x1 - x0)) * (w - left - padX)
    const vPotential = [p.potentialQuantity, ...(p.potentialAlso ?? [])]
    const emV = p.highlight === null || vPotential.includes(p.highlight) ? 1 : DIM
    const em = (q: QuantityId): number => (p.highlight === null || p.highlight === q ? 1 : DIM)
    const potHl = p.highlight !== null && vPotential.includes(p.highlight)

    // scale con isteresi: crescono subito, calano solo se la curva è molto più piccola
    let vMax = 0
    for (const v of p.potential) vMax = Math.max(vMax, Math.abs(v))
    let rMax = 0
    if (p.density) for (const r of p.density) rMax = Math.max(rMax, r)
    const vTarget = Math.max(1.5, vMax * 1.15)
    if (vTarget > scales.v.target || vMax < 0.45 * scales.v.target) scales.v.set(vTarget)
    const rTarget = Math.max(2.2, rMax * 1.08)
    if (rTarget > scales.rho.target || rMax < 0.5 * scales.rho.target) scales.rho.set(rTarget)
    let moving = scales.v.step(dt, reduced)
    moving = scales.rho.step(dt, reduced) || moving

    // fasce verticali
    const ionY = h - 16
    const psiTop = 8
    const psiBase = Math.round(psiTop + (ionY - 26 - psiTop) * 0.58)
    const vHalf = Math.max(8, (ionY - 26 - psiBase - 8) / 2)
    const vMid = Math.round(psiBase + 8 + vHalf)

    // guide sugli ioni
    const a = p.a
    const nFirst = Math.ceil(x0 / a)
    const nLast = Math.floor(x1 / a)
    ctx.globalAlpha = em('a')
    ctx.strokeStyle = p.highlight === 'a' ? TOKENS.lineStrong : TOKENS.line
    ctx.lineWidth = 1
    for (let i = nFirst; i <= nLast; i++) {
      const x = Math.round(X(i * a)) + 0.5
      ctx.beginPath()
      ctx.moveTo(x, psiTop)
      ctx.lineTo(x, ionY)
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // |ψ|²
    if (p.density) {
      const s = (psiBase - psiTop - 4) / scales.rho.value
      const col = quantityColor('psi')
      ctx.globalAlpha = em('psi')
      ctx.strokeStyle = TOKENS.dim
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(left, psiBase + 0.5)
      ctx.lineTo(w - padX, psiBase + 0.5)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(X(x0), psiBase)
      for (let i = 0; i < n; i++) ctx.lineTo(X(p.xs[i]), psiBase - p.density[i] * s)
      ctx.lineTo(X(x1), psiBase)
      ctx.closePath()
      ctx.fillStyle = withAlpha(col, 0.1)
      ctx.fill()
      ctx.strokeStyle = col
      ctx.lineWidth = p.highlight === 'psi' ? 3 : 2
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const y = psiBase - p.density[i] * s
        if (i === 0) ctx.moveTo(X(p.xs[i]), y)
        else ctx.lineTo(X(p.xs[i]), y)
      }
      ctx.stroke()
      // livello dell'onda piana (|ψ|² = 1)
      ctx.strokeStyle = TOKENS.dim
      ctx.setLineDash([2, 4])
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(left, psiBase - s)
      ctx.lineTo(w - padX, psiBase - s)
      ctx.stroke()
      ctx.setLineDash([])
      drawMathText(ctx, p.labels.density, left - 8, (psiTop + psiBase) / 2 + 5, { color: col, size: 15, align: 'right' })
      ctx.globalAlpha = 1
    }

    // V(x)
    {
      const s = vHalf / scales.v.value
      const col = quantityColor(p.potentialQuantity)
      ctx.globalAlpha = emV
      ctx.strokeStyle = TOKENS.line
      ctx.lineWidth = 1
      ctx.setLineDash([2, 4])
      ctx.beginPath()
      ctx.moveTo(left, vMid + 0.5)
      ctx.lineTo(w - padX, vMid + 0.5)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.strokeStyle = col
      ctx.lineWidth = potHl ? 3 : 1.75
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const y = vMid - p.potential[i] * s
        if (i === 0) ctx.moveTo(X(p.xs[i]), y)
        else ctx.lineTo(X(p.xs[i]), y)
      }
      ctx.stroke()
      drawMathText(ctx, p.labels.potential, left - 8, vMid + 5, { color: col, size: 15, align: 'right' })
      ctx.globalAlpha = 1
      // scala verticale del potenziale, a destra
      ctx.font = sansFont(11)
      ctx.fillStyle = TOKENS.dim
      ctx.textAlign = 'right'
      ctx.textBaseline = 'alphabetic'
      const tick = Math.max(1, Math.round(scales.v.value / 2))
      const ty = vMid - tick * s
      if (ty > vMid - vHalf - 2) {
        const tx = w - padX - 2
        const label = `${formatNumber(tick, 0)} eV`
        const tw = ctx.measureText(label).width
        ctx.fillStyle = TOKENS.bg
        ctx.fillRect(tx - tw - 12, ty - 10, tw + 14, 14 + (vMid - ty))
        ctx.strokeStyle = TOKENS.muted
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(tx, vMid)
        ctx.lineTo(tx, ty)
        ctx.moveTo(tx - 3, ty)
        ctx.lineTo(tx + 3, ty)
        ctx.moveTo(tx - 3, vMid)
        ctx.lineTo(tx + 3, vMid)
        ctx.stroke()
        ctx.fillStyle = TOKENS.muted
        ctx.fillText(label, tx - 6, ty + 4)
      }
      ctx.globalAlpha = 1
    }

    // ioni e passo a
    ctx.fillStyle = TOKENS.muted
    for (let i = nFirst; i <= nLast; i++) {
      ctx.beginPath()
      ctx.arc(X(i * a), ionY, 4, 0, 2 * Math.PI)
      ctx.fill()
    }
    // il passo: fra lo ione più vicino al centro e il successivo
    const nMid = Math.floor((x0 + x1) / 2 / a)
    const xa0 = X(nMid * a)
    const xa1 = X((nMid + 1) * a)
    ctx.globalAlpha = em('a')
    ctx.strokeStyle = quantityColor('a')
    ctx.lineWidth = p.highlight === 'a' ? 3 : 2
    ctx.beginPath()
    ctx.moveTo(xa0 + 7, ionY)
    ctx.lineTo(xa1 - 7, ionY)
    ctx.stroke()
    drawMathText(ctx, 'a', (xa0 + xa1) / 2, ionY - 7, { color: quantityColor('a'), align: 'center', size: 16 })
    ctx.globalAlpha = 1
    ctx.font = sansFont(11)
    ctx.fillStyle = TOKENS.dim
    ctx.textAlign = 'right'
    ctx.textBaseline = 'alphabetic'
    const lastIonX = X(nLast * a)
    const ionsW = ctx.measureText(p.labels.ions).width
    if (w - padX - lastIonX > ionsW + 12) ctx.fillText(p.labels.ions, w - padX, ionY + 4)
    else {
      ctx.fillStyle = TOKENS.bg
      ctx.fillRect(w - padX - ionsW - 4, ionY - 14, ionsW + 6, 13)
      ctx.fillStyle = TOKENS.dim
      ctx.fillText(p.labels.ions, w - padX, ionY - 4)
    }

    return moving
  })

  return <canvas ref={canvasRef} className="real-canvas" role="img" aria-label={props.labels.ariaLabel} />
})
