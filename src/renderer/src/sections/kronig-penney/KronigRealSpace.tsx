/**
 * Spazio reale per «Kronig–Penney»:
 *  - ioni centrati nelle buche in x = n·a;
 *  - buche larghe b (V = 0) e barriere rettangolari larghe c e alte V₀ centrate in (n + ½)a,
 *    oppure picchi a delta V(x) = aV₀ Σ δ(x − (n + ½)a), con morfing continuo fra i due;
 *  - densità di probabilità esatta |ψ(x)|² dello stato scelto (media 1).
 */
import { memo, useRef, type JSX } from 'react'
import { formatNumber } from '../../ui/format'
import { Smoothed, useReducedMotion } from '../../ui/motion'
import { quantityColor, TOKENS, type QuantityId } from '../../ui/theme'
import { drawMathText, sansFont, useCanvasDraw, withAlpha } from '../../viz/canvas'
import type { KronigVariant } from './manifest'
import type { VariantModel } from './model'
import type { HighlightTarget } from './store'

export interface KronigRealSpaceProps {
  readonly xs: Float64Array
  readonly variant: KronigVariant
  readonly delta: VariantModel
  readonly rect: VariantModel
  readonly highlight: QuantityId | null
  readonly highlightTarget: HighlightTarget
  readonly labels: {
    readonly ariaLabel: string
    readonly ions: string
    readonly density: string
    readonly potentialDelta: string
    readonly potentialRect: string
  }
}

const DIM = 0.28

export const KronigRealSpace = memo(function KronigRealSpace(props: KronigRealSpaceProps): JSX.Element {
  const reduced = useReducedMotion()
  const anim = useRef({
    mix: new Smoothed(props.variant === 'rectangular' ? 1 : 0, 0.14),
    rhoMax: new Smoothed(2.4, 0.2),
    v0Max: new Smoothed(12, 0.2),
    strMax: new Smoothed(16, 0.2)
  }).current

  const canvasRef = useCanvasDraw((ctx, { w, h }, dt) => {
    const p = props
    const n = p.xs.length
    if (n < 2) return false

    anim.mix.set(p.variant === 'rectangular' ? 1 : 0)
    const mix = anim.mix.value

    const dDens = p.delta.density
    const rDens = p.rect.density
    let maxRho = 1
    for (let i = 0; i < n; i++) {
      const val = (1 - mix) * dDens[i] + mix * rDens[i]
      if (val > maxRho) maxRho = val
    }
    const rhoTarget = Math.max(2.2, maxRho * 1.1)
    if (rhoTarget > anim.rhoMax.target || maxRho < 0.48 * anim.rhoMax.target) {
      anim.rhoMax.set(rhoTarget)
    }

    const rectV0 = p.rect.spec.variant === 'rectangular' ? p.rect.spec.v0 : 0
    const v0Target = Math.max(4, rectV0 * 1.18)
    if (v0Target > anim.v0Max.target || rectV0 < 0.45 * anim.v0Max.target) {
      anim.v0Max.set(v0Target)
    }

    const strVal = p.delta.barrierStrength
    const strTarget = Math.max(8, strVal * 1.2)
    if (strTarget > anim.strMax.target || strVal < 0.45 * anim.strMax.target) {
      anim.strMax.set(strTarget)
    }

    let moving = false
    for (const s of [anim.mix, anim.rhoMax, anim.v0Max, anim.strMax]) {
      moving = s.step(dt, reduced) || moving
    }

    const t = anim.mix.value
    const a = (1 - t) * p.delta.a + t * p.rect.a
    const x0 = p.xs[0]
    const x1 = p.xs[n - 1]
    const left = 54
    const padX = 16
    const X = (x: number): number => left + ((x - x0) / (x1 - x0)) * (w - left - padX)

    const em = (q: QuantityId): number => (p.highlight === null || p.highlight === q ? 1 : DIM)
    const emA = (sub: 'a' | 'b' | 'c'): number => {
      if (p.highlight === null) return 1
      if (p.highlight !== 'a') return DIM
      if (p.highlightTarget === null || p.highlightTarget === sub) return 1
      return DIM
    }

    const ionY = h - 16
    const psiTop = 8
    const psiBase = Math.round(psiTop + (ionY - 26 - psiTop) * 0.55)
    const vBase = ionY - 24
    const vTop = psiBase + 10
    const vSpan = Math.max(18, vBase - vTop)

    // --- guide verticali sugli ioni (centro delle buche: x = n·a) ---
    const nFirst = Math.ceil(x0 / a)
    const nLast = Math.floor(x1 / a)
    ctx.globalAlpha = emA('a')
    ctx.strokeStyle = p.highlight === 'a' ? TOKENS.lineStrong : TOKENS.line
    ctx.lineWidth = 1
    for (let i = nFirst; i <= nLast; i++) {
      const gx = Math.round(X(i * a)) + 0.5
      ctx.beginPath()
      ctx.moveTo(gx, psiTop)
      ctx.lineTo(gx, ionY)
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // --- densità |ψ(x)|² ---
    {
      const scaleRho = (psiBase - psiTop - 4) / anim.rhoMax.value
      const col = quantityColor('psi')
      ctx.globalAlpha = em('psi')
      ctx.strokeStyle = TOKENS.dim
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(left, psiBase + 0.5)
      ctx.lineTo(w - padX, psiBase + 0.5)
      ctx.stroke()

      // onda piana di riferimento |ψ|² = 1
      ctx.strokeStyle = TOKENS.dim
      ctx.setLineDash([2, 4])
      ctx.beginPath()
      ctx.moveTo(left, psiBase - scaleRho)
      ctx.lineTo(w - padX, psiBase - scaleRho)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.beginPath()
      ctx.moveTo(X(x0), psiBase)
      for (let i = 0; i < n; i++) {
        const rho = (1 - t) * dDens[i] + t * rDens[i]
        ctx.lineTo(X(p.xs[i]), psiBase - rho * scaleRho)
      }
      ctx.lineTo(X(x1), psiBase)
      ctx.closePath()
      ctx.fillStyle = withAlpha(col, 0.12)
      ctx.fill()

      ctx.strokeStyle = col
      ctx.lineWidth = p.highlight === 'psi' ? 3 : 2
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const rho = (1 - t) * dDens[i] + t * rDens[i]
        const py = psiBase - rho * scaleRho
        if (i === 0) ctx.moveTo(X(p.xs[i]), py)
        else ctx.lineTo(X(p.xs[i]), py)
      }
      ctx.stroke()

      drawMathText(ctx, p.labels.density, left - 8, (psiTop + psiBase) / 2 + 5, {
        color: col,
        size: 15,
        align: 'right'
      })
      ctx.globalAlpha = 1
    }

    // --- potenziale V(x): buche in V = 0 sugli ioni, barriere in (n + ½)a ---
    {
      const colV = quantityColor('VG')
      const bRect = p.rect.spec.variant === 'rectangular' ? p.rect.spec.b : a
      const cRect = p.rect.spec.variant === 'rectangular' ? p.rect.spec.c : 0
      // durante il morphing: spessore della barriera passa da sottile (delta) a c_rect
      const spikePhysW = Math.min(0.08 * a, 0.18)
      const cShown = (1 - t) * spikePhysW + t * cRect
      const halfC = cShown / 2

      const rectH = Math.min(vSpan - 2, (rectV0 / anim.v0Max.value) * (vSpan - 4))
      const deltaH = Math.min(vSpan - 2, (p.delta.barrierStrength / anim.strMax.value) * (vSpan - 4))
      const barH = (1 - t) * deltaH + t * rectH

      ctx.globalAlpha = em('VG')
      ctx.strokeStyle = TOKENS.line
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(left, vBase + 0.5)
      ctx.lineTo(w - padX, vBase + 0.5)
      ctx.stroke()

      const bFirst = Math.floor(x0 / a - 0.5) - 1
      const bLast = Math.ceil(x1 / a - 0.5) + 1

      ctx.save()
      ctx.beginPath()
      ctx.rect(left, vTop - 4, w - left - padX, vBase - vTop + 6)
      ctx.clip()

      // riempimento rettangoli barriera (cresce con t, e leggero anche in delta se P > 0)
      if (barH > 0.5) {
        ctx.fillStyle = withAlpha(colV, 0.07 + 0.11 * t)
        for (let m = bFirst; m <= bLast; m++) {
          const xb = (m + 0.5) * a
          const xl = X(xb - halfC)
          const xr = X(xb + halfC)
          ctx.fillRect(xl, vBase - barH, Math.max(2, xr - xl), barH)
        }
      }

      // profilo a cremagliera del potenziale V(x)
      ctx.strokeStyle = colV
      ctx.lineWidth = p.highlight === 'VG' ? 2.8 : 1.9
      ctx.beginPath()
      ctx.moveTo(left, vBase)
      for (let m = bFirst; m <= bLast; m++) {
        const xb = (m + 0.5) * a
        const xl = X(xb - halfC)
        const xr = X(xb + halfC)
        if (xr < left || xl > w - padX) continue
        ctx.lineTo(xl, vBase)
        ctx.lineTo(xl, vBase - barH)
        ctx.lineTo(xr, vBase - barH)
        ctx.lineTo(xr, vBase)
      }
      ctx.lineTo(w - padX, vBase)
      ctx.stroke()

      // freccia delta in cima ai picchi quando siamo vicini al modello a delta
      if (t < 0.75 && deltaH > 4) {
        ctx.globalAlpha = em('VG') * (1 - t / 0.75)
        ctx.fillStyle = colV
        for (let m = bFirst; m <= bLast; m++) {
          const xb = (m + 0.5) * a
          const xc = X(xb)
          if (xc < left + 2 || xc > w - padX - 2) continue
          const yt = vBase - barH
          ctx.beginPath()
          ctx.moveTo(xc, yt - 4)
          ctx.lineTo(xc - 3.5, yt + 2)
          ctx.lineTo(xc + 3.5, yt + 2)
          ctx.closePath()
          ctx.fill()
        }
      }

      ctx.restore()

      ctx.globalAlpha = em('VG')
      drawMathText(ctx, t > 0.5 ? p.labels.potentialRect : p.labels.potentialDelta, left - 8, (vTop + vBase) / 2 + 5, {
        color: colV,
        size: 13.5,
        align: 'right'
      })

      // quota dell'altezza / opacità a destra
      ctx.font = sansFont(11)
      ctx.textAlign = 'right'
      ctx.textBaseline = 'alphabetic'
      const potInfo =
        t > 0.5
          ? `V₀ = ${formatNumber(rectV0, rectV0 < 10 ? 1 : 0)} eV`
          : `aV₀ = ${formatNumber(p.delta.barrierStrength, 1)} eV·Å`
      const tw = ctx.measureText(potInfo).width
      ctx.fillStyle = withAlpha(TOKENS.bg, 0.88)
      ctx.fillRect(w - padX - tw - 6, vTop - 2, tw + 8, 14)
      ctx.fillStyle = colV
      ctx.fillText(potInfo, w - padX, vTop + 9)
      ctx.globalAlpha = 1

      // --- quote b e c (in modalità rettangolare, o durante hover su b/c) ---
      if (t > 0.2) {
        const alphaBC = Math.min(1, (t - 0.2) / 0.5)
        const cCol = quantityColor('a')

        // larghezza della buca b attorno allo ione centrale x = 0
        const bx0 = X(-bRect / 2)
        const bx1 = X(bRect / 2)
        if (bx1 - bx0 > 18) {
          ctx.globalAlpha = alphaBC * emA('b')
          ctx.strokeStyle = cCol
          ctx.lineWidth = p.highlightTarget === 'b' ? 2.4 : 1.4
          const by = vBase - 5
          ctx.beginPath()
          ctx.moveTo(bx0 + 2, by)
          ctx.lineTo(bx1 - 2, by)
          ctx.moveTo(bx0 + 2, by - 3)
          ctx.lineTo(bx0 + 2, by + 3)
          ctx.moveTo(bx1 - 2, by - 3)
          ctx.lineTo(bx1 - 2, by + 3)
          ctx.stroke()
          drawMathText(ctx, 'b', (bx0 + bx1) / 2, by - 6, {
            color: cCol,
            align: 'center',
            size: 13,
            backdrop: TOKENS.bg
          })
        }

        // spessore della barriera c in x = a/2 (se il pixel width lo permette)
        const cx0 = X(a / 2 - cRect / 2)
        const cx1 = X(a / 2 + cRect / 2)
        if (cx1 - cx0 >= 4 && cx1 < w - padX - 48) {
          ctx.globalAlpha = alphaBC * emA('c')
          ctx.strokeStyle = cCol
          ctx.lineWidth = p.highlightTarget === 'c' ? 2.4 : 1.4
          const cy = Math.max(vTop + 4, vBase - barH - 6)
          ctx.beginPath()
          ctx.moveTo(cx0, cy)
          ctx.lineTo(cx1, cy)
          ctx.moveTo(cx0, cy - 3)
          ctx.lineTo(cx0, cy + 3)
          ctx.moveTo(cx1, cy - 3)
          ctx.lineTo(cx1, cy + 3)
          ctx.stroke()
          drawMathText(ctx, 'c', (cx0 + cx1) / 2, cy - 5, {
            color: cCol,
            align: 'center',
            size: 13,
            backdrop: TOKENS.bg
          })
        }
        ctx.globalAlpha = 1
      }
    }

    // --- ioni e passo reticolare a ---
    ctx.fillStyle = TOKENS.muted
    for (let i = nFirst; i <= nLast; i++) {
      ctx.beginPath()
      ctx.arc(X(i * a), ionY, 4, 0, 2 * Math.PI)
      ctx.fill()
    }
    const nMid = Math.floor((x0 + x1) / 2 / a)
    const xa0 = X(nMid * a)
    const xa1 = X((nMid + 1) * a)
    ctx.globalAlpha = emA('a')
    ctx.strokeStyle = quantityColor('a')
    ctx.lineWidth = p.highlight === 'a' && (p.highlightTarget === null || p.highlightTarget === 'a') ? 3 : 2
    ctx.beginPath()
    ctx.moveTo(xa0 + 7, ionY)
    ctx.lineTo(xa1 - 7, ionY)
    ctx.stroke()
    drawMathText(ctx, 'a', (xa0 + xa1) / 2, ionY - 7, { color: quantityColor('a'), align: 'center', size: 15 })
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
      ctx.fillStyle = withAlpha(TOKENS.bg, 0.9)
      ctx.fillRect(w - padX - ionsW - 4, ionY - 14, ionsW + 6, 13)
      ctx.fillStyle = TOKENS.dim
      ctx.fillText(p.labels.ions, w - padX, ionY - 4)
    }

    return moving
  })

  return <canvas ref={canvasRef} className="real-canvas" role="img" aria-label={props.labels.ariaLabel} />
})
