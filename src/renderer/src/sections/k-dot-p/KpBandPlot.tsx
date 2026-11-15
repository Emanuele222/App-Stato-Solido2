/**
 * Diagramma E(k) vicino a Γ (k = 0) per la sezione «Metodo k·p»:
 * - asse centrato in Γ, nessun bordo ±π/a (si è nel piccolo intorno di k = 0);
 * - nella variante a due bande evidenzia la fascia |P·k| < E_g/2 (criterio indicativo);
 * - strumenti trasversali: riempimento (semicond. intrinseco a T=0), sonda m* e confronto.
 */
import { useRef, type JSX, type KeyboardEvent, type PointerEvent } from 'react'
import { formatNumber } from '../../ui/format'
import { Smoothed, useReducedMotion } from '../../ui/motion'
import { quantityColor, TOKENS, type QuantityId } from '../../ui/theme'
import {
  buildObstacleMap,
  drawMathText,
  drawSegmentedHorizontalLine,
  measureMathText,
  niceStep,
  placeFreeLabel,
  placeProbeLabel,
  sansFont,
  useCanvasDraw,
  withAlpha,
  type PolylinePoint,
  type RectBox,
  type XSpan
} from '../../viz/canvas'
import type { KpModel } from './model'
import type { KpBandRole } from './store'
import { strings as s } from './strings'

const MARGIN = { left: 50, right: 16, top: 14, bottom: 38 }
const DIM = 0.25

export function KpBandPlot({
  model,
  highlight,
  showProbe,
  showCompare,
  onPick,
  onNudge
}: {
  readonly model: KpModel
  readonly highlight: QuantityId | null
  readonly showProbe: boolean
  readonly showCompare: boolean
  readonly onPick: (k: number, role: KpBandRole) => void
  readonly onNudge: (dkSteps: number, dBand: number) => void
}): JSX.Element {
  const reduced = useReducedMotion()
  const dragging = useRef(false)
  const anim = useRef({
    eMin: new Smoothed(model.eRange[0], 0.16),
    eMax: new Smoothed(model.eRange[1], 0.16),
    compare: new Smoothed(showCompare ? 1 : 0, 0.12),
    filling: new Smoothed(model.fermiLevel !== null ? 1 : 0, 0.12),
    fermi: new Smoothed(model.fermiLevel ?? 0.5 * model.params.eg, 0.1),
    probe: new Smoothed(showProbe ? 1 : 0, 0.12)
  }).current

  const canvasRef = useCanvasDraw((ctx, { w, h }, dt) => {
    anim.eMin.set(model.eRange[0])
    anim.eMax.set(model.eRange[1])
    anim.compare.set(showCompare ? 1 : 0)
    anim.filling.set(model.fermiLevel !== null ? 1 : 0)
    if (model.fermiLevel !== null) anim.fermi.set(model.fermiLevel, anim.filling.value < 0.02)
    anim.probe.set(showProbe ? 1 : 0)

    let moving = false
    for (const sm of [anim.eMin, anim.eMax, anim.compare, anim.filling, anim.fermi, anim.probe]) {
      moving = sm.step(dt, reduced) || moving
    }

    const L = MARGIN.left
    const T = MARGIN.top
    const W = Math.max(20, w - MARGIN.left - MARGIN.right)
    const H = Math.max(20, h - MARGIN.top - MARGIN.bottom)
    const [k0, k1] = model.kRange
    const e0 = anim.eMin.value
    const e1 = anim.eMax.value

    const X = (k: number): number => L + ((k - k0) / (k1 - k0)) * W
    const Y = (E: number): number => T + ((e1 - E) / (e1 - e0)) * H
    const em = (q: QuantityId): number => (highlight === null || highlight === q ? 1 : DIM)
    const lw = (q: QuantityId, base: number): number => (highlight === q ? base + 1.2 : base)

    // --- griglia energetica ---
    const eStep = niceStep(e1 - e0, Math.max(3, Math.min(7, Math.round(H / 52))))
    ctx.font = sansFont(12)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let E = Math.ceil(e0 / eStep) * eStep; E <= e1 + 1e-9; E += eStep) {
      const y = Y(E)
      ctx.strokeStyle = Math.abs(E) < 1e-9 ? TOKENS.lineStrong : TOKENS.line
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(L, Math.round(y) + 0.5)
      ctx.lineTo(L + W, Math.round(y) + 0.5)
      ctx.stroke()
      ctx.fillStyle = TOKENS.muted
      ctx.fillText(formatNumber(E, eStep < 1 ? 1 : 0), L - 8, y)
    }

    ctx.save()
    ctx.translate(14, T + H / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.globalAlpha = em('E')
    ctx.font = sansFont(12)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = quantityColor('E')
    ctx.fillText(s.scene.energyAxis, 0, 0)
    ctx.restore()

    // --- asse k centrato in Γ ---
    ctx.strokeStyle = TOKENS.dim
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(L, T + H + 0.5)
    ctx.lineTo(L + W, T + H + 0.5)
    ctx.stroke()

    const kStep = niceStep(k1 - k0, Math.max(3, Math.round(W / 95)))
    ctx.font = sansFont(11.5)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    for (let kv = Math.ceil(k0 / kStep) * kStep; kv <= k1 + 1e-9; kv += kStep) {
      const x = X(kv)
      if (x > L + W - 54) continue
      ctx.strokeStyle = TOKENS.dim
      ctx.beginPath()
      ctx.moveTo(x, T + H)
      ctx.lineTo(x, T + H + 4)
      ctx.stroke()
      if (Math.abs(kv) < 1e-9) {
        drawMathText(ctx, 'Γ', x, T + H + 18, { color: TOKENS.text, size: 13.5, italic: false })
      } else {
        ctx.fillStyle = TOKENS.muted
        ctx.fillText(formatNumber(kv, kStep < 0.1 ? 2 : 1), x, T + H + 17)
      }
    }
    ctx.globalAlpha = em('k')
    ctx.fillStyle = quantityColor('k')
    ctx.textAlign = 'right'
    ctx.fillText(s.scene.kAxis, L + W, T + H + 17)
    ctx.globalAlpha = 1

    // --- area di disegno ritagliata ---
    ctx.save()
    ctx.beginPath()
    ctx.rect(L, T, W, H)
    ctx.clip()

    // Linea verticale in Γ (k = 0)
    ctx.strokeStyle = TOKENS.lineStrong
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(X(0), T)
    ctx.lineTo(X(0), T + H)
    ctx.stroke()
    ctx.setLineDash([])

    const occupied: RectBox[] = []
    const probeLine: PolylinePoint[] = []

    // Fascia di validità parabolica |P·k| < E_g/2 (due bande); l'etichetta si disegna dopo le curve
    let zoneBadge: { xA: number; xB: number } | null = null
    if (model.validityLimitK !== null && Number.isFinite(model.validityLimitK)) {
      const klim = model.validityLimitK
      const xA = Math.max(L, X(-klim))
      const xB = Math.min(L + W, X(klim))
      if (xB > xA + 2) {
        const epCol = quantityColor('EP')
        ctx.save()
        ctx.fillStyle = withAlpha(epCol, 0.06)
        ctx.fillRect(xA, T, xB - xA, H)
        ctx.strokeStyle = withAlpha(epCol, 0.45)
        ctx.lineWidth = 1
        ctx.setLineDash([3, 4])
        for (const sgn of [-1, 1]) {
          const xEdge = X(sgn * klim)
          if (xEdge > L + 2 && xEdge < L + W - 2) {
            ctx.beginPath()
            ctx.moveTo(xEdge, T)
            ctx.lineTo(xEdge, T + H)
            ctx.stroke()
          }
        }
        ctx.setLineDash([])
        zoneBadge = { xA, xB }
        ctx.restore()
      }
    }

    // Confronto (libero o parabole m*)
    if (model.compareBands && anim.compare.value > 0.01) {
      ctx.save()
      ctx.globalAlpha = anim.compare.value * em('Ek')
      ctx.strokeStyle = quantityColor('Ek')
      ctx.lineWidth = lw('Ek', 1.35)
      ctx.setLineDash([5, 4])
      for (let b = 0; b < model.compareBands.energies.length; b++) {
        const en = model.compareBands.energies[b]
        ctx.beginPath()
        for (let i = 0; i < model.kValues.length; i++) {
          const x = X(model.kValues[i])
          const y = Y(en[i])
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      ctx.setLineDash([])
      ctx.restore()
    }

    // Bande principali
    const fill = anim.filling.value
    const fermiY = Y(anim.fermi.value)
    const traceCurve = (vals: Float64Array): void => {
      ctx.beginPath()
      for (let i = 0; i < model.kValues.length; i++) {
        const x = X(model.kValues[i])
        const y = Y(vals[i])
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
    }

    const edgeLabels: { y: number; text: string; color: string; x: number; align: 'left' | 'right' }[] = []
    for (const c of model.curves) {
      const bandColor = c.role === 'so' && model.effectiveVariant === 'kane' ? quantityColor('Delta') : quantityColor('E')
      const baseAlpha = c.alpha * em(highlight === 'EP' && (c.role === 'c' || c.role === 'lh' || c.role === 'so') ? 'EP' : 'E')
      const isOccupied = c.role !== 'c'

      ctx.save()
      ctx.strokeStyle = bandColor
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.setLineDash(c.dashed ? [6, 4] : [])

      // Con riempimento attivo: valenze spesse (piene), conduzione sottile (vuota)
      const width =
        fill > 0.01 ? (isOccupied ? lw('E', 2 + 1.8 * fill) : lw('E', 2 - 0.5 * fill)) : lw('E', c.role === model.selection.role ? 2.6 : 2)
      ctx.globalAlpha = baseAlpha * (fill > 0.01 && !isOccupied ? 1 - 0.4 * fill : 1)
      ctx.lineWidth = width
      traceCurve(c.values)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()

      // Etichetta inline della banda sul punto visibile più a destra (evita legenda e bordi)
      let labelIdx = c.values.length - 1
      let yRight = Y(c.values[labelIdx])
      let xRight = X(model.kValues[labelIdx])
      while (
        labelIdx > Math.floor(c.values.length * 0.52) &&
        (yRight < T + 14 || yRight > T + H - 10)
      ) {
        labelIdx -= 1
        yRight = Y(c.values[labelIdx])
        xRight = X(model.kValues[labelIdx])
      }
      if (yRight >= T + 12 && yRight <= T + H - 8) {
        edgeLabels.push({
          y: yRight + 4,
          text: c.label,
          color: bandColor,
          x: Math.min(L + W - 8, xRight - 4),
          align: 'right'
        })
      }
    }

    // Evita sovrapposizioni verticali fra le etichette c, hh, lh, so vicino al lato destro
    edgeLabels.sort((a, b) => a.y - b.y)
    const minSep = 15
    for (let i = 1; i < edgeLabels.length; i++) {
      for (let j = i - 1; j >= 0; j--) {
        if (Math.abs(edgeLabels[i].x - edgeLabels[j].x) < 48 && edgeLabels[i].y - edgeLabels[j].y < minSep) {
          edgeLabels[i].y = edgeLabels[j].y + minSep
        }
      }
    }
    for (let i = edgeLabels.length - 1; i >= 0; i--) {
      if (edgeLabels[i].y > T + H - 6) edgeLabels[i].y = T + H - 6
      if (i > 0 && Math.abs(edgeLabels[i].x - edgeLabels[i - 1].x) < 48 && edgeLabels[i].y - edgeLabels[i - 1].y < minSep) {
        edgeLabels[i - 1].y = Math.max(T + 14, edgeLabels[i].y - minSep)
      }
    }
    for (const lb of edgeLabels) {
      const lwPx = drawMathText(ctx, lb.text, lb.x, lb.y, {
        color: lb.color,
        size: 13,
        align: lb.align,
        backdrop: TOKENS.bg
      })
      const lx0 = lb.align === 'right' ? lb.x - lwPx : lb.x
      occupied.push({ x0: lx0 - 3, y0: lb.y - 12, x1: lx0 + lwPx + 3, y1: lb.y + 4 })
    }

    const fermiSkips: XSpan[] = []
    const registerSkipIfNearFermi = (x0: number, x1: number, y0: number, y1: number): void => {
      if (model.fermiLevel !== null && fermiY >= y0 - 6 && fermiY <= y1 + 6) {
        fermiSkips.push({ x0, x1 })
      }
    }

    // Indicatori di E_g e Δ vicino a Γ (sfalsati orizzontalmente per non sovrapporsi)
    const xEg = X(0) + 12
    const yVbm = Y(0)
    const yCbm = Y(model.params.eg)
    if (yVbm - yCbm > 4) {
      ctx.save()
      ctx.globalAlpha = em('VG')
      ctx.strokeStyle = quantityColor('VG')
      ctx.lineWidth = lw('VG', 2.2)
      ctx.beginPath()
      ctx.moveTo(xEg, yVbm)
      ctx.lineTo(xEg, yCbm)
      ctx.moveTo(xEg - 4, yVbm)
      ctx.lineTo(xEg + 4, yVbm)
      ctx.moveTo(xEg - 4, yCbm)
      ctx.lineTo(xEg + 4, yCbm)
      ctx.stroke()
      // Se E_F taglia un gap molto stretto (< 34 px, es. InSb), sposta E_g alla punta superiore della parentesi
      const egLabelY = fill > 0.05 && yVbm - yCbm < 34 ? Math.max(T + 14, yCbm - 2) : 0.5 * (yVbm + yCbm) + 4
      const egW = drawMathText(ctx, 'E_{g}', xEg + 6, egLabelY, {
        color: quantityColor('VG'),
        size: 13.5,
        backdrop: TOKENS.bg
      })
      const egBox = { x0: xEg - 4, y0: Math.min(yCbm, egLabelY - 12), x1: xEg + 8 + egW, y1: Math.max(yVbm, egLabelY + 4) }
      occupied.push(egBox)
      registerSkipIfNearFermi(xEg - 5, xEg + 8 + egW, egLabelY - 13, egLabelY + 5)
      ctx.restore()
    }

    const deltaEff = model.gammaLevels.delta
    const ySo0 = Y(-deltaEff)
    if (deltaEff > 0.025 && ySo0 - yVbm > 4 && 1 - model.variantMix > 0.05) {
      const xDel = X(0) - 10
      ctx.save()
      ctx.globalAlpha = (1 - model.variantMix) * em('Delta')
      ctx.strokeStyle = quantityColor('Delta')
      ctx.lineWidth = lw('Delta', 2)
      ctx.beginPath()
      ctx.moveTo(xDel, yVbm)
      ctx.lineTo(xDel, ySo0)
      ctx.moveTo(xDel - 4, yVbm)
      ctx.lineTo(xDel + 4, yVbm)
      ctx.moveTo(xDel - 4, ySo0)
      ctx.lineTo(xDel + 4, ySo0)
      ctx.stroke()
      const dLabelY = 0.5 * (yVbm + ySo0) + 4
      const dW = drawMathText(ctx, 'Δ', xDel - 6, dLabelY, {
        color: quantityColor('Delta'),
        align: 'right',
        size: 13.5,
        backdrop: TOKENS.bg
      })
      occupied.push({ x0: xDel - 9 - dW, y0: dLabelY - 12, x1: xDel + 4, y1: dLabelY + 4 })
      registerSkipIfNearFermi(xDel - 9 - dW, xDel + 5, dLabelY - 13, dLabelY + 5)
      ctx.restore()
    }

    // Livello di Fermi (semiconduttore intrinseco a T = 0): etichetta confinata a sinistra di Γ e linea spezzata sulle etichette
    if (model.fermiLevel !== null && fill > 0.01) {
      const c = quantityColor('EF')
      ctx.save()
      ctx.globalAlpha = fill * em('EF')
      const wF = measureMathText(ctx, 'E_{F}', 14)
      ctx.font = sansFont(11.5)
      const maxLeftWidth = X(0) - (L + 22 + wF)
      const label = ctx.measureText(s.scene.fillingLabel).width <= maxLeftWidth ? s.scene.fillingLabel : 'intrinseco (T = 0)'
      const lwid = ctx.measureText(label).width
      const textRight = lwid <= maxLeftWidth + 6 ? L + 23 + wF + lwid : L + 12 + wF
      fermiSkips.push({ x0: L + 6, x1: textRight })

      ctx.strokeStyle = c
      ctx.lineWidth = lw('EF', 1.5)
      ctx.setLineDash([8, 4])
      drawSegmentedHorizontalLine(ctx, L, L + W, fermiY, fermiSkips, 5)
      ctx.setLineDash([])
      drawMathText(ctx, 'E_{F}', L + 8, fermiY - 6, { color: c, size: 14, backdrop: TOKENS.bg })
      if (lwid <= maxLeftWidth + 6) {
        ctx.fillStyle = TOKENS.bg
        ctx.fillRect(L + 15 + wF, fermiY - 18, lwid + 8, 16)
        ctx.fillStyle = c
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
        ctx.fillText(label, L + 19 + wF, fermiY - 6)
      }
      occupied.push({ x0: L + 6, y0: fermiY - 19, x1: textRight, y1: fermiY + 2 })
      ctx.restore()
    }

    // Sonda m* (parabola osculatrice locale): posizione collision-free con bande ed etichette
    if (showProbe && anim.probe.value > 0.01) {
      const pr = model.selection
      const c = quantityColor('mstar')
      ctx.save()
      ctx.globalAlpha = anim.probe.value * em('mstar')
      ctx.strokeStyle = c
      ctx.lineWidth = lw('mstar', 2)
      const bend = Math.abs(0.5 * pr.curvature)
      const span = Math.min(0.42 * k1, bend > 0 ? Math.sqrt((0.25 * (e1 - e0)) / bend) : Infinity)
      const curvePts: { x: number; y: number }[] = []
      for (const cur of model.curves) {
        for (let i = 0; i < model.kValues.length; i += 4) {
          curvePts.push({ x: X(model.kValues[i]), y: Y(cur.values[i]) })
        }
      }
      ctx.beginPath()
      for (let i = 0; i <= 60; i++) {
        const dk = -span + (2 * span * i) / 60
        const px = X(pr.k + dk)
        const py = Y(pr.energy + pr.slope * dk + 0.5 * pr.curvature * dk * dk)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
        if (i % 6 === 0) curvePts.push({ x: px, y: py })
        probeLine.push({ x: px, y: py })
      }
      ctx.stroke()
      placeProbeLabel(ctx, {
        text: s.scene.probeLabel,
        size: 13.5,
        color: c,
        backdrop: TOKENS.bg,
        anchorX: X(pr.k),
        anchorY: Y(pr.energy),
        minX: L,
        maxX: L + W,
        minY: T,
        maxY: T + H,
        occupied,
        curvePoints: curvePts
      })
      ctx.restore()
    }

    // Etichette di contesto (fascia di validità, «vicino a Γ»): disegnate dopo le curve,
    // in un posto libero vicino al loro oggetto, su fondo opaco e con trattino di richiamo.
    const sx = X(model.selection.k)
    const sy = Y(model.selection.energy)
    {
      const labelRegion: RectBox = { x0: L + 4, y0: T + 4, x1: L + W - 4, y1: T + H - 4 }
      const curvePx: PolylinePoint[][] = model.curves.map((c) =>
        Array.from(model.kValues, (kv, i) => ({ x: X(kv), y: Y(c.values[i]) }))
      )
      if (model.compareBands && anim.compare.value > 0.01) {
        for (const en of model.compareBands.energies) {
          curvePx.push(Array.from(model.kValues, (kv, i) => ({ x: X(kv), y: Y(en[i]) })))
        }
      }
      if (probeLine.length > 0) curvePx.push(probeLine)
      const selBox: RectBox = { x0: sx - 10, y0: sy - 10, x1: sx + 10, y1: sy + 10 }
      const hasZone = zoneBadge !== null
      const badgeText = hasZone ? s.scene.validZoneBadge : s.scene.nearGammaBadge
      const anchor = zoneBadge
        ? { x: Math.min(zoneBadge.xB, L + W - 4), y: T + 6 }
        : { x: L + 4, y: T + 4 }
      const obstacles = buildObstacleMap(labelRegion, curvePx, [...occupied, selBox])
      ctx.save()
      ctx.globalAlpha = hasZone ? 1 : 0.85
      placeFreeLabel(ctx, {
        text: badgeText,
        rich: true,
        size: 10.5,
        color: hasZone ? TOKENS.textSoft : TOKENS.dim,
        backdrop: TOKENS.bg,
        anchor,
        obstacles,
        region: labelRegion,
        occupied,
        leader: hasZone,
        leaderColor: quantityColor('EP')
      })
      ctx.restore()
    }

    // Stato scelto (linee tratteggiate k/E e punto)
    ctx.save()
    ctx.setLineDash([2, 4])
    ctx.globalAlpha = em('k')
    ctx.strokeStyle = quantityColor('k')
    ctx.lineWidth = lw('k', 1.25)
    ctx.beginPath()
    ctx.moveTo(sx, T + H)
    ctx.lineTo(sx, sy)
    ctx.stroke()
    ctx.globalAlpha = em('E')
    ctx.strokeStyle = quantityColor('E')
    ctx.lineWidth = lw('E', 1.25)
    ctx.beginPath()
    ctx.moveTo(L, sy)
    ctx.lineTo(sx, sy)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1
    ctx.fillStyle = TOKENS.bg
    ctx.strokeStyle = TOKENS.text
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(sx, sy, 5.5, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    ctx.restore()
    return moving
  })

  const pick = (e: PointerEvent<HTMLCanvasElement>): void => {
    const r = e.currentTarget.getBoundingClientRect()
    const W = r.width - MARGIN.left - MARGIN.right
    const H = r.height - MARGIN.top - MARGIN.bottom
    if (W <= 0 || H <= 0) return
    const [k0, k1] = model.kRange
    const [e0, e1] = model.eRange
    const k = Math.max(k0, Math.min(k1, k0 + ((e.clientX - r.left - MARGIN.left) / W) * (k1 - k0)))
    const py = e.clientY - r.top

    // Indice più vicino in kValues
    const nPts = model.kValues.length
    const frac = (k - k0) / (k1 - k0)
    const idx = Math.max(0, Math.min(nPts - 1, Math.round(frac * (nPts - 1))))

    let bestRole: KpBandRole = model.selection.role
    let bestD = Infinity
    for (const c of model.curves) {
      const E = c.values[idx]
      const y = MARGIN.top + ((e1 - E) / (e1 - e0)) * H
      const d = Math.abs(y - py)
      if (d < bestD) {
        bestD = d
        bestRole = c.role
      }
    }
    onPick(k, bestRole)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLCanvasElement>): void => {
    const map: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, 1],
      ArrowDown: [0, -1]
    }
    const m = map[e.key]
    if (!m) return
    e.preventDefault()
    onNudge(m[0], m[1])
  }

  return (
    <canvas
      ref={canvasRef}
      className="band-canvas"
      tabIndex={0}
      role="img"
      aria-label={s.scene.bandsAria}
      onPointerDown={(e) => {
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        pick(e)
      }}
      onPointerMove={(e) => {
        if (dragging.current) pick(e)
      }}
      onPointerUp={() => {
        dragging.current = false
      }}
      onPointerCancel={() => {
        dragging.current = false
      }}
      onKeyDown={onKeyDown}
    />
  )
}
