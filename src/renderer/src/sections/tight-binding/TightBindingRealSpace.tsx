/**
 * Vista spazio reale per i legami forti:
 *  - fascia superiore: Re ψ_k(x) attorno allo zero;
 *  - fascia centrale: densità |ψ_k(x)|² in magenta;
 *  - fascia inferiore: catena 1D con legami (evidenziati su hover di t),
 *    passo a e orbitali atomici s (1 lobo), p (2 lobi opposti lungo x) oppure
 *    A–B (colori distinti e raggio proporzionale a |b_A|, |b_B|).
 *    Tutte le fasi di Bloch e i campioni arrivano già calcolati da model.ts / physics/.
 */
import { memo, type JSX } from 'react'
import { LOBE_PALETTES, quantityColor, toneColor, TOKENS, type QuantityId } from '../../ui/theme'
import { drawMathText, sansFont, useCanvasDraw } from '../../viz/canvas'
import { NUMERICS } from './manifest'
import type { TightBindingModel } from './model'
import { strings as s } from './strings'

interface TightBindingRealSpaceProps {
  readonly model: TightBindingModel
  readonly highlight: QuantityId | null
}

export const TightBindingRealSpace = memo(function TightBindingRealSpace({
  model,
  highlight
}: TightBindingRealSpaceProps): JSX.Element {
  const canvasRef = useCanvasDraw((ctx, { w, h }) => {
    const m = model
    const L = 50
    const R = 14
    const W = Math.max(20, w - L - R)
    const xMin = -NUMERICS.xWindow
    const xMax = NUMERICS.xWindow
    const X = (x: number): number => L + ((x - xMin) / (xMax - xMin)) * W

    const em = (q: QuantityId): number => (highlight === null || highlight === q ? 1 : 0.26)

    // --- 1. Re ψ_k(x) ---
    const reTop = 6
    const reH = Math.max(26, h * 0.25)
    const reZeroY = reTop + reH * 0.54
    let reMaxAbs = 0.5
    for (let i = 0; i < m.wave.rePsi.length; i++) {
      const a = Math.abs(m.wave.rePsi[i])
      if (a > reMaxAbs) reMaxAbs = a
    }
    const reScale = (reH * 0.4) / reMaxAbs

    ctx.save()
    ctx.beginPath()
    ctx.rect(L, reTop, W, reH)
    ctx.clip()
    ctx.globalAlpha = em('psi')
    ctx.strokeStyle = TOKENS.lineStrong
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(L, reZeroY)
    ctx.lineTo(L + W, reZeroY)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.strokeStyle = toneColor('realPartWave')
    ctx.lineWidth = highlight === 'psi' ? 2.4 : 1.75
    ctx.beginPath()
    for (let i = 0; i < m.xs.length; i++) {
      const px = X(m.xs[i])
      const py = reZeroY - m.wave.rePsi[i] * reScale
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.restore()

    drawMathText(ctx, 'Re ψ_{k}', L - 6, reZeroY + 4, {
      color: toneColor('realPartWave'),
      align: 'right',
      size: 12
    })

    // --- 2. |ψ_k(x)|² ---
    const densTop = reTop + reH + 6
    const densH = Math.max(28, h * 0.26)
    const densBaseY = densTop + densH - 3
    let densMax = 1.6
    for (let i = 0; i < m.wave.density.length; i++) {
      if (m.wave.density[i] > densMax) densMax = m.wave.density[i]
    }
    const densScale = (densH - 7) / (densMax * 1.08)

    ctx.save()
    ctx.beginPath()
    ctx.rect(L, densTop, W, densH)
    ctx.clip()
    ctx.globalAlpha = em('psi')

    const meanY = densBaseY - 1.0 * densScale
    ctx.strokeStyle = TOKENS.line
    ctx.lineWidth = 1
    ctx.setLineDash([2, 4])
    ctx.beginPath()
    ctx.moveTo(L, meanY)
    ctx.lineTo(L + W, meanY)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = quantityColor('psi')
    ctx.globalAlpha = em('psi') * 0.16
    ctx.beginPath()
    ctx.moveTo(X(m.xs[0]), densBaseY)
    for (let i = 0; i < m.xs.length; i++) {
      ctx.lineTo(X(m.xs[i]), densBaseY - m.wave.density[i] * densScale)
    }
    ctx.lineTo(X(m.xs[m.xs.length - 1]), densBaseY)
    ctx.closePath()
    ctx.fill()

    ctx.globalAlpha = em('psi')
    ctx.strokeStyle = quantityColor('psi')
    ctx.lineWidth = highlight === 'psi' ? 2.6 : 1.9
    ctx.beginPath()
    for (let i = 0; i < m.xs.length; i++) {
      const px = X(m.xs[i])
      const py = densBaseY - m.wave.density[i] * densScale
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.restore()

    drawMathText(ctx, '|ψ_{k}|²', L - 6, densBaseY - densH * 0.36, {
      color: quantityColor('psi'),
      align: 'right',
      size: 12
    })

    // --- 3. Catena di atomi e orbitali ---
    const chainTop = densTop + densH + 6
    const chainH = Math.max(54, h - chainTop - 6)
    const chainY = chainTop + chainH * 0.42
    const aPx = (m.aEff / (xMax - xMin)) * W
    const maxR = Math.min(18, Math.max(8, aPx * (m.effectiveVariant === 'diatomic' ? 0.19 : 0.28)), chainH * 0.32)

    ctx.save()
    ctx.beginPath()
    ctx.rect(L, chainTop - 4, W, chainH + 10)
    ctx.clip()

    if (m.effectiveVariant === 'monoatomic') {
      const sites = m.mono.sites

      ctx.globalAlpha = highlight === 't' ? 1 : em('t') * 0.65
      ctx.strokeStyle = highlight === 't' ? quantityColor('t') : TOKENS.lineStrong
      ctx.lineWidth = highlight === 't' ? 3.2 : 1.5
      for (let i = 0; i < sites.length - 1; i++) {
        ctx.beginPath()
        ctx.moveTo(X(sites[i].x), chainY)
        ctx.lineTo(X(sites[i + 1].x), chainY)
        ctx.stroke()
      }

      if (highlight === 't' && sites.length >= 2) {
        drawMathText(ctx, m.selection.band === 0 ? 't_{s}' : 't_{p}', X(0.5 * m.aEff), chainY - 12, {
          color: quantityColor('t'),
          align: 'center',
          size: 13,
          backdrop: TOKENS.bg
        })
      }

      ctx.globalAlpha = 1
      for (const site of sites) {
        const cx = X(site.x)
        const rePhase = site.rePhase
        if (m.selection.band === 0) {
          drawLobe(ctx, cx, chainY, maxR, maxR * 0.9, rePhase, 'mono')
        } else {
          const lobeW = maxR * 0.72
          const lobeH = maxR * 0.62
          const offset = lobeW * 0.98
          drawLobe(ctx, cx - offset, chainY, lobeW, lobeH, -rePhase, 'mono')
          drawLobe(ctx, cx + offset, chainY, lobeW, lobeH, +rePhase, 'mono')
        }
        ctx.fillStyle = TOKENS.bg
        ctx.strokeStyle = TOKENS.text
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(cx, chainY, 2.8, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
      }
    } else {
      const sites = m.diatomic.weightsAll
      ctx.globalAlpha = highlight === 't' ? 1 : em('t') * 0.65
      ctx.strokeStyle = highlight === 't' ? quantityColor('t') : TOKENS.lineStrong
      ctx.lineWidth = highlight === 't' ? 3.2 : 1.5
      for (let i = 0; i < sites.length - 1; i++) {
        ctx.beginPath()
        ctx.moveTo(X(sites[i].x), chainY)
        ctx.lineTo(X(sites[i + 1].x), chainY)
        ctx.stroke()
      }
      if (highlight === 't') {
        drawMathText(ctx, 't', X(0.25 * m.aEff), chainY - 12, {
          color: quantityColor('t'),
          align: 'center',
          size: 13,
          backdrop: TOKENS.bg
        })
      }

      ctx.globalAlpha = 1
      for (const site of sites) {
        const cx = X(site.x)
        const r = maxR * Math.sqrt(Math.max(0, site.amp))
        const family = site.kind === 'A' ? 'A' : 'B'
        if (r >= 2.2) {
          drawLobe(ctx, cx, chainY, r, r * 0.9, site.signRe, family)
        } else {
          ctx.save()
          ctx.setLineDash([2, 2])
          ctx.strokeStyle = family === 'A' ? toneColor('faintOrbitalA') : toneColor('faintOrbitalB')
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(cx, chainY, Math.max(5, maxR * 0.35), 0, 2 * Math.PI)
          ctx.stroke()
          ctx.restore()
        }
        ctx.fillStyle = family === 'A' ? quantityColor('a') : quantityColor('EF')
        ctx.beginPath()
        ctx.arc(cx, chainY, 2.8, 0, 2 * Math.PI)
        ctx.fill()

        ctx.font = sansFont(10)
        ctx.fillStyle = family === 'A' ? quantityColor('a') : quantityColor('EF')
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(site.kind, cx, chainY + maxR + 2)
      }
    }

    // Indicatore passo reticolare a
    const x0 = X(0)
    const xa = X(m.aEff)
    const bracketY = chainTop + chainH - 8
    ctx.globalAlpha = highlight === 'a' ? 1 : em('a') * 0.85
    ctx.strokeStyle = quantityColor('a')
    ctx.lineWidth = highlight === 'a' ? 2.2 : 1.4
    ctx.beginPath()
    ctx.moveTo(x0, bracketY - 4)
    ctx.lineTo(x0, bracketY)
    ctx.lineTo(xa, bracketY)
    ctx.lineTo(xa, bracketY - 4)
    ctx.stroke()
    drawMathText(ctx, 'a', (x0 + xa) / 2, bracketY - 3, {
      color: quantityColor('a'),
      align: 'center',
      size: 13,
      backdrop: TOKENS.bg
    })
    ctx.globalAlpha = 1
    ctx.restore()

    return false
  })

  return (
    <canvas
      ref={canvasRef}
      className="viz-canvas tb-real-canvas"
      role="img"
      aria-label={s.scene.realAria}
    />
  )
})

function drawLobe(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  signedVal: number,
  family: 'mono' | 'A' | 'B'
): void {
  const palette = LOBE_PALETTES[family]

  const abs = Math.abs(signedVal)
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(cx, cy, Math.max(2, rx), Math.max(2, ry), 0, 0, 2 * Math.PI)
  if (abs <= 0.12) {
    ctx.fillStyle = palette.zeroFill
    ctx.strokeStyle = palette.zeroStroke
    ctx.lineWidth = 1.2
    ctx.setLineDash([2, 2])
    ctx.fill()
    ctx.stroke()
    ctx.restore()
    return
  }

  const pos = signedVal > 0
  ctx.fillStyle = pos ? palette.posFill : palette.negFill
  ctx.strokeStyle = pos ? palette.posStroke : palette.negStroke
  ctx.lineWidth = 1.4
  ctx.globalAlpha *= 0.45 + 0.55 * Math.min(1, abs)
  ctx.fill()
  ctx.stroke()

  if (rx >= 8 && abs > 0.35) {
    ctx.font = sansFont(11, 600)
    ctx.fillStyle = pos ? palette.posText : palette.negText
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(pos ? '+' : '−', cx, cy + 0.5)
  }
  ctx.restore()
}
