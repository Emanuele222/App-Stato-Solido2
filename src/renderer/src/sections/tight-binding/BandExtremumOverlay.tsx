/**
 * Sovrapposizione trasparente su BandPlot per le pillole «legante» / «antilegante»
 * agli estremi delle bande (k = 0 e k = −π/a). Evita dinamicamente ogni collisione
 * con ciò che BandPlot disegna (E_F, sonda m*, livelli Ē_s/Ē_p o E_A/E_B, gap,
 * selezione e legenda) e nasconde una pillola se non trova spazio libero.
 */
import { memo, useRef, type JSX } from 'react'
import { Smoothed, useReducedMotion } from '../../ui/motion'
import { EXTREMUM_PILLS } from '../../ui/theme'
import { sansFont, useCanvasDraw } from '../../viz/canvas'
import type { ExtBadge } from './model'

const BANDPLOT_MARGIN = { left: 50, right: 14, top: 12, bottom: 44 }

interface Rect {
  readonly x0: number
  readonly y0: number
  readonly x1: number
  readonly y1: number
}

interface BandExtremumOverlayProps {
  readonly kRange: readonly [number, number]
  readonly eRange: readonly [number, number]
  readonly zoneEdge: number
  readonly badges: readonly ExtBadge[]
  readonly levels: readonly { readonly energy: number; readonly label: string }[]
  readonly gap: { readonly lower: number; readonly upper: number; readonly label: string } | null
  readonly filling: { readonly fermiLevel: number; readonly label: string } | null
  readonly probe: {
    readonly k: number
    readonly energy: number
    readonly slope: number
    readonly curvature: number
    readonly label: string
  } | null
  readonly selection: { readonly k: number; readonly energy: number } | null
  readonly compareVisible: boolean
}

export const BandExtremumOverlay = memo(function BandExtremumOverlay({
  kRange,
  eRange,
  zoneEdge,
  badges,
  levels,
  gap,
  filling,
  probe,
  selection,
  compareVisible
}: BandExtremumOverlayProps): JSX.Element {
  const reduced = useReducedMotion()
  const anim = useRef({
    eMin: new Smoothed(eRange[0], 0.18),
    eMax: new Smoothed(eRange[1], 0.18),
    fermi: new Smoothed(filling?.fermiLevel ?? 0, 0.1)
  }).current

  const canvasRef = useCanvasDraw((ctx, { w, h }, dt) => {
    anim.eMin.set(eRange[0])
    anim.eMax.set(eRange[1])
    if (filling) anim.fermi.set(filling.fermiLevel)
    let moving = false
    moving = anim.eMin.step(dt, reduced) || moving
    moving = anim.eMax.step(dt, reduced) || moving
    if (filling) moving = anim.fermi.step(dt, reduced) || moving

    const L = BANDPLOT_MARGIN.left
    const T = BANDPLOT_MARGIN.top
    const W = Math.max(10, w - BANDPLOT_MARGIN.left - BANDPLOT_MARGIN.right)
    const H = Math.max(10, h - BANDPLOT_MARGIN.top - BANDPLOT_MARGIN.bottom)
    const [k0, k1] = kRange
    const e0 = anim.eMin.value
    const e1 = anim.eMax.value
    const X = (k: number): number => L + ((k - k0) / (k1 - k0)) * W
    const Y = (E: number): number => T + ((e1 - E) / (e1 - e0)) * H
    const kb = zoneEdge

    const occupied: Rect[] = []

    // 0. Riserva i bordi di zona verticali ±π/a così le pillole non toccano i tratteggi
    occupied.push({ x0: X(-kb) - 4, y0: T, x1: X(-kb) + 4, y1: T + H })
    occupied.push({ x0: X(kb) - 4, y0: T, x1: X(kb) + 4, y1: T + H })

    // 1. Legenda confronto in alto a destra
    if (compareVisible) {
      occupied.push({ x0: L + W - 210, y0: T + 2, x1: L + W, y1: T + 50 })
    }

    // 2. Livelli di riferimento attorno a k = 0
    const half = Math.min(46, 0.18 * (X(kb) - X(0)))
    const xCenter = X(0)
    for (const lv of levels) {
      const y = Y(lv.energy)
      occupied.push({ x0: xCenter - half - 2, y0: y - 9, x1: xCenter + half + 40, y1: y + 9 })
    }

    // 3. Indicatore gap in +π/a
    if (gap && gap.upper > gap.lower) {
      const yLo = Y(gap.lower)
      const yHi = Y(gap.upper)
      const gx = X(kb)
      const right = L + W - gx > 52
      occupied.push({
        x0: right ? gx - 6 : gx - 68,
        y0: yHi - 6,
        x1: right ? gx + 68 : gx + 6,
        y1: yLo + 6
      })
    }

    // 4. Livello di Fermi ed etichetta isolante/metallo
    if (filling) {
      const fy = Y(anim.fermi.value)
      occupied.push({ x0: L, y0: fy - 6, x1: L + W, y1: fy + 6 })
      occupied.push({ x0: L, y0: fy - 22, x1: L + 210, y1: fy + 6 })
    }

    // 5. Stato scelto
    if (selection) {
      const sx = X(selection.k)
      const sy = Y(selection.energy)
      occupied.push({ x0: sx - 9, y0: sy - 9, x1: sx + 9, y1: sy + 9 })
    }

    // 6. Sonda m* e relativa etichetta
    if (probe) {
      const bend = Math.abs(0.5 * probe.curvature)
      const span = Math.min(0.4 * kb, bend > 0 ? Math.sqrt((0.25 * (e1 - e0)) / bend) : Infinity)
      const side = probe.k > 0 ? -1 : 1
      const dkTip = side * span
      const tipY = Y(probe.energy + probe.slope * dkTip + 0.5 * probe.curvature * dkTip * dkTip)
      const tx = X(probe.k + dkTip) + side * 6
      const ty = Math.max(T + 16, Math.min(T + H - 6, tipY + 5))
      const labelW = 28
      occupied.push({
        x0: side < 0 ? tx - labelW : tx,
        y0: ty - 16,
        x1: side < 0 ? tx : tx + labelW,
        y1: ty + 4
      })
      const pxMid = X(probe.k)
      const pyMid = Y(probe.energy)
      occupied.push({ x0: pxMid - 12, y0: pyMid - 12, x1: pxMid + 12, y1: pyMid + 12 })
    }

    ctx.save()
    ctx.beginPath()
    ctx.rect(L, T, W, H)
    ctx.clip()
    ctx.font = sansFont(10.5, 500)
    ctx.textBaseline = 'middle'

    for (const b of badges) {
      const px = X(b.k)
      const py = Y(b.energy)
      const textW = ctx.measureText(b.label).width
      const pillW = textW + 10
      const pillH = 15
      const dir = b.position === 'above' ? -1 : 1

      // Candidati ordinati intorno al lato esterno della banda, poi piccoli scostamenti laterali.
      const candidates: readonly { readonly x: number; readonly y: number }[] =
        b.k < 0
          ? [
              { x: px + 10, y: py + dir * 15 },
              { x: px + 18, y: py + dir * 24 },
              { x: px + 10, y: py + dir * 26 },
              { x: px - pillW - 10, y: py + dir * 15 }
            ]
          : [
              { x: px - pillW / 2, y: py + dir * 15 },
              { x: px - pillW - 8, y: py + dir * 15 },
              { x: px + 8, y: py + dir * 15 },
              { x: px - pillW / 2, y: py + dir * 26 }
            ]

      let chosen: Rect | null = null
      for (const c of candidates) {
        const rx0 = Math.max(L + 3, Math.min(L + W - pillW - 3, c.x))
        const ry0 = c.y - pillH / 2
        const rect: Rect = { x0: rx0, y0: ry0, x1: rx0 + pillW, y1: ry0 + pillH }
        if (rect.y0 < T + 2 || rect.y1 > T + H - 2) continue
        if (occupied.every((o) => !overlaps(rect, o))) {
          chosen = rect
          break
        }
      }

      if (!chosen) continue
      occupied.push(chosen)

      const pill = b.kind === 'bonding' ? EXTREMUM_PILLS.bonding : EXTREMUM_PILLS.antibonding
      ctx.fillStyle = pill.fill
      ctx.strokeStyle = pill.stroke
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(chosen.x0, chosen.y0, pillW, pillH, 4)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = pill.text
      ctx.textAlign = 'center'
      ctx.fillText(b.label, chosen.x0 + pillW / 2, chosen.y0 + pillH / 2 + 0.5)
    }

    ctx.restore()
    return moving
  })

  return <canvas ref={canvasRef} className="tb-bands-overlay" aria-hidden="true" />
})

function overlaps(a: Rect, b: Rect): boolean {
  return a.x0 < b.x1 + 2 && a.x1 + 2 > b.x0 && a.y0 < b.y1 + 2 && a.y1 + 2 > b.y0
}
