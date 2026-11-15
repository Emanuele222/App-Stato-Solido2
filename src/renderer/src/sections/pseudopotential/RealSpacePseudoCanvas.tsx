/**
 * Prima vista: «L’idea, nello spazio reale» (P4 §4, fig. 4.1a).
 * Curve di modello indicative:
 *  - sopra: potenziale dello ione nudo (∝ −1/r) contro pseudopotenziale soft core e hard core;
 *  - sotto: funzione d’onda vera ψ(r) oscillante nel core (|r| < r_c) contro parte liscia ψᶠ(r).
 */
import type { JSX } from 'react'
import { quantityColor, toneColor, TOKENS, type QuantityId } from '../../ui/theme'
import { drawMathText, useCanvasDraw, withAlpha } from '../../viz/canvas'
import type { RealSpaceModelCurves } from '../../physics'
import { strings as s } from './strings'

const MARGIN = { left: 46, right: 14, top: 12, bottom: 12 }
const DIM = 0.25

export function RealSpacePseudoCanvas({
  curves,
  highlight
}: {
  readonly curves: RealSpaceModelCurves
  readonly highlight: QuantityId | null
}): JSX.Element {
  const canvasRef = useCanvasDraw((ctx, { w, h }) => {
    const L = MARGIN.left
    const W = Math.max(40, w - MARGIN.left - MARGIN.right)
    const totalH = Math.max(80, h - MARGIN.top - MARGIN.bottom)
    const gapH = 16
    const topH = (totalH - gapH) * 0.52
    const botTop = MARGIN.top + topH + gapH
    const botH = totalH - topH - gapH

    const { r, bareIon, softCore, hardCore, truePsi, smoothPsi, rc } = curves
    const rMax = r[r.length - 1]
    const X = (x: number): number => L + ((x + rMax) / (2 * rMax)) * W

    const emPot = highlight === null || highlight === 'VG' ? 1 : DIM
    const emPsi = highlight === null || highlight === 'psi' ? 1 : DIM

    // Fascia del raggio di core |r| < r_c su entrambi i riquadri
    const xLeftRc = X(-rc)
    const xRightRc = X(rc)
    ctx.fillStyle = withAlpha(TOKENS.lineStrong, 0.28)
    ctx.fillRect(xLeftRc, MARGIN.top, xRightRc - xLeftRc, topH + gapH + botH)

    ctx.save()
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = withAlpha(TOKENS.muted, 0.55)
    ctx.lineWidth = 1
    for (const xr of [xLeftRc, xRightRc]) {
      ctx.beginPath()
      ctx.moveTo(xr, MARGIN.top)
      ctx.lineTo(xr, botTop + botH)
      ctx.stroke()
    }
    ctx.restore()

    // Etichette ±r_c nella fascia centrale
    const midY = MARGIN.top + topH + gapH * 0.5 + 3
    drawMathText(ctx, `−${s.scene.rcLabel}`, xLeftRc - 4, midY, {
      color: TOKENS.muted,
      size: 11,
      align: 'right'
    })
    drawMathText(ctx, `+${s.scene.rcLabel}`, xRightRc + 4, midY, {
      color: TOKENS.muted,
      size: 11,
      align: 'left'
    })

    // --- Pannello superiore: Potenziali V(r) ---
    const potMin = -3.65
    const potMax = 0.55
    const Yp = (v: number): number => MARGIN.top + ((potMax - v) / (potMax - potMin)) * topH

    // Asse E = 0 del potenziale
    ctx.strokeStyle = TOKENS.lineStrong
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(L, Yp(0))
    ctx.lineTo(L + W, Yp(0))
    ctx.stroke()

    drawMathText(ctx, 'V(r)', L - 8, MARGIN.top + topH * 0.45, {
      color: quantityColor('VG'),
      size: 12,
      align: 'right'
    })

    // Clip sull'area superiore per non sforare in -1/r
    ctx.save()
    ctx.beginPath()
    ctx.rect(L, MARGIN.top, W, topH)
    ctx.clip()

    // 1. Ione nudo (tratteggiato)
    ctx.save()
    ctx.globalAlpha = emPot * 0.65
    ctx.setLineDash([5, 4])
    ctx.strokeStyle = TOKENS.textSoft
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let i = 0; i < r.length; i++) {
      const px = X(r[i])
      const py = Yp(bareIon[i])
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.restore()

    // 2. Hard core (puntinato, stesso colore di V_ps)
    ctx.save()
    ctx.globalAlpha = emPot * 0.85
    ctx.setLineDash([2, 3])
    ctx.strokeStyle = quantityColor('VG')
    ctx.lineWidth = highlight === 'VG' ? 2.4 : 1.8
    ctx.beginPath()
    for (let i = 0; i < r.length; i++) {
      const px = X(r[i])
      const py = Yp(hardCore[i])
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.restore()

    // 3. Soft core (continuo)
    ctx.save()
    ctx.globalAlpha = emPot
    ctx.strokeStyle = quantityColor('VG')
    ctx.lineWidth = highlight === 'VG' ? 3 : 2.2
    ctx.beginPath()
    for (let i = 0; i < r.length; i++) {
      const px = X(r[i])
      const py = Yp(softCore[i])
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.restore()
    ctx.restore()

    // (la legenda sta fuori dal grafico: riga HTML sotto il titolo della vista)

    // --- Pannello inferiore: Funzioni d'onda ψ(r) vs ψᶠ(r) ---
    const psiMin = -1.3
    const psiMax = 1.15
    const Yw = (v: number): number => botTop + ((psiMax - v) / (psiMax - psiMin)) * botH

    ctx.strokeStyle = TOKENS.line
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(L, Yw(0))
    ctx.lineTo(L + W, Yw(0))
    ctx.stroke()

    drawMathText(ctx, 'ψ(r)', L - 8, botTop + botH * 0.45, {
      color: quantityColor('psi'),
      size: 12,
      align: 'right'
    })

    ctx.save()
    ctx.beginPath()
    ctx.rect(L, botTop, W, botH)
    ctx.clip()

    // ψ vera (oscillante nel core)
    ctx.save()
    ctx.globalAlpha = emPsi * 0.88
    ctx.strokeStyle = quantityColor('psi')
    ctx.lineWidth = highlight === 'psi' ? 2.8 : 2.0
    ctx.beginPath()
    for (let i = 0; i < r.length; i++) {
      const px = X(r[i])
      const py = Yw(truePsi[i])
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.restore()

    // ψᶠ parte liscia (tratteggiata, tinta chiara di ψ)
    const smoothPsiColor = toneColor('smoothWavefunction')
    ctx.save()
    ctx.globalAlpha = emPsi
    ctx.setLineDash([6, 4])
    ctx.strokeStyle = smoothPsiColor
    ctx.lineWidth = 2.0
    ctx.beginPath()
    for (let i = 0; i < r.length; i++) {
      const px = X(r[i])
      const py = Yw(smoothPsi[i])
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.restore()
    ctx.restore()

    return false
  })

  return (
    <canvas
      ref={canvasRef}
      className="pseudo-static-canvas"
      role="img"
      aria-label={s.scene.realAria}
    />
  )
}
