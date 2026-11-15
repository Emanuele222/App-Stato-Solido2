/**
 * Barra di scomposizione dei contributi a m₀/m* per la banda scelta:
 * termine libero (±1) più ciascuna banda accoppiata con il suo segno (+ o −)
 * e il colore della grandezza corrispondente.
 */
import { useRef, type JSX } from 'react'
import type { MassTermSource } from '../../physics'
import { formatEffectiveMassRatio, formatNumber } from '../../ui/format'
import { Smoothed, useReducedMotion } from '../../ui/motion'
import { quantityColor, TOKENS, type QuantityId } from '../../ui/theme'
import { drawMathText, sansFont, useCanvasDraw } from '../../viz/canvas'
import type { KpModel } from './model'
import { strings as s } from './strings'

function termQuantity(src: MassTermSource): QuantityId {
  switch (src) {
    case 'free':
      return 'Ek'
    case 'c':
      return 'VG'
    case 'lh':
      return 'E'
    case 'so':
      return 'Delta'
    case 'hh':
      return 'Ek'
  }
}

export function MassContributionsBar({
  model,
  highlight
}: {
  readonly model: KpModel
  readonly highlight: QuantityId | null
}): JSX.Element {
  const reduced = useReducedMotion()
  const bd = model.breakdown
  const animTotal = useRef(new Smoothed(bd.totalInvMass, 0.14)).current

  const canvasRef = useCanvasDraw((ctx, { w, h }, dt) => {
    animTotal.set(bd.totalInvMass)
    const moving = animTotal.step(dt, reduced)

    const kittelFlip = bd.freeTermConvention === 'kittel-valence-flip'
    const posTerms = bd.terms.filter((t) => t.value > 0)
    const negTerms = bd.terms.filter((t) => t.value < 0)
    const posSum = posTerms.reduce((acc, t) => acc + t.value, 0)
    const negSum = negTerms.reduce((acc, t) => acc + t.value, 0) // <= 0

    // Scala orizzontale della barra attorno a 0 (con entrambe le direzioni visibili se ci sono termini ±)
    const leftPad = 14
    const rightPad = 14
    const innerW = Math.max(80, w - leftPad - rightPad)

    const maxPos = Math.max(posSum, 1)
    const maxNeg = Math.max(Math.abs(negSum), 0.5)
    // Se tutti i termini hanno lo stesso segno diamo quasi tutta la larghezza a quel segno
    const onlyPos = negTerms.length === 0
    const onlyNeg = posTerms.length === 0
    const spanNeg = onlyPos ? 0.08 * maxPos : onlyNeg ? maxNeg * 1.12 : maxNeg * 1.1
    const spanPos = onlyNeg ? 0.08 * maxNeg : onlyPos ? maxPos * 1.12 : maxPos * 1.1
    const totalSpan = spanNeg + spanPos
    const xZero = leftPad + (spanNeg / totalSpan) * innerW
    const scale = innerW / totalSpan

    const barTop = Math.round(h * 0.42)
    const barH = 18

    // Riga superiore: somma algebrica esatta in testo + m*/m₀ risultante
    const pieces = bd.terms.map((t) => {
      const signStr = t.value >= 0 ? '+' : '−'
      const absStr = formatNumber(Math.abs(t.value), 2)
      return `${signStr}${absStr} (${t.source === 'free' ? 'libero' : t.source})`
    })
    const sumAbs = formatNumber(bd.totalInvMass, 2)
    const mStr = formatEffectiveMassRatio(bd.effectiveMassRatio, { digits: 4, withEquals: true })
    const topLine =
      bd.terms.length === 1 && model.selection.role === 'hh'
        ? `m₀/m* = ${sumAbs}   ·   ${s.scene.contribNoCoupling}`
        : `m₀/m* = ${pieces.join(' ')} = ${sumAbs}   ⇒   m*/m₀ ${mStr}`

    ctx.font = sansFont(w < 540 ? 10.5 : 11.5)
    ctx.fillStyle = TOKENS.textSoft
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(topLine, leftPad, barTop - 10, innerW)

    // Sfondo barra e asse zero
    ctx.fillStyle = TOKENS.panel
    ctx.fillRect(leftPad, barTop, innerW, barH)
    ctx.strokeStyle = TOKENS.line
    ctx.lineWidth = 1
    ctx.strokeRect(leftPad + 0.5, barTop + 0.5, innerW - 1, barH - 1)

    const emTerm = (q: QuantityId, src: MassTermSource): number => {
      if (highlight === null) return 0.92
      if (highlight === q) return 1
      // Hover su E_P ('EP') illumina tutte le bande accoppiate (non il termine libero ±1)
      if (highlight === 'EP' && src !== 'free') return 1
      return 0.25
    }

    // Disegna segmenti positivi (da xZero verso destra) e negativi (da xZero verso sinistra)
    interface DrawnSeg {
      readonly x0: number
      readonly x1: number
      readonly label: string
      readonly color: string
      readonly alpha: number
    }
    const segs: DrawnSeg[] = []

    let curR = xZero
    for (const t of posTerms) {
      const wSeg = t.value * scale
      const q = termQuantity(t.source)
      const col = quantityColor(q)
      const alpha = emTerm(q, t.source)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = col
      ctx.fillRect(curR, barTop + 1, Math.max(1, wSeg - 1), barH - 2)
      ctx.restore()
      segs.push({
        x0: curR,
        x1: curR + wSeg,
        label: `+${formatNumber(t.value, 2)} (${s.scene.contribSource(t.source, kittelFlip)})`,
        color: col,
        alpha
      })
      curR += wSeg
    }

    let curL = xZero
    for (const t of negTerms) {
      const wSeg = Math.abs(t.value) * scale
      const q = termQuantity(t.source)
      const col = quantityColor(q)
      const alpha = emTerm(q, t.source)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = col
      ctx.fillRect(curL - wSeg + 1, barTop + 1, Math.max(1, wSeg - 1), barH - 2)
      ctx.restore()
      segs.push({
        x0: curL - wSeg,
        x1: curL,
        label: `−${formatNumber(Math.abs(t.value), 2)} (${s.scene.contribSource(t.source, kittelFlip)})`,
        color: col,
        alpha
      })
      curL -= wSeg
    }

    // Tacca dello zero
    ctx.strokeStyle = TOKENS.text
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(xZero, barTop - 4)
    ctx.lineTo(xZero, barTop + barH + 4)
    ctx.stroke()
    drawMathText(ctx, '0', xZero, barTop + barH + 15, { color: TOKENS.muted, size: 11, align: 'center', italic: false })

    // Legenda compatta sotto la barra (senza sovrapporre 0)
    const legendY = barTop + barH + 28
    if (legendY < h - 2) {
      ctx.font = sansFont(10.5)
      let lx = leftPad
      for (const seg of segs) {
        ctx.save()
        ctx.globalAlpha = seg.alpha
        ctx.fillStyle = seg.color
        ctx.fillRect(lx, legendY - 8, 8, 8)
        ctx.fillStyle = TOKENS.textSoft
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
        const txtW = ctx.measureText(seg.label).width
        if (lx + 14 + txtW <= leftPad + innerW + 2) {
          ctx.fillText(seg.label, lx + 12, legendY)
        }
        ctx.restore()
        lx += 24 + txtW
      }
    }

    return moving
  })

  return (
    <canvas
      ref={canvasRef}
      className="kp-contrib-canvas"
      role="img"
      aria-label={s.scene.contribAria}
    />
  )
}
