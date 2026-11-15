/**
 * Terza vista: Diagramma delle 8 bande E(k) lungo L–Γ–X–W–K–Γ (zero alla cima della valenza).
 *  - 4 bande di valenza (verde) e 4 di conduzione (ciano), con gap assoluto ombreggiato,
 *    punti VBM / CBM e freccia («gap diretto» / «gap indiretto»).
 *  - Strumenti trasversali: Riempimento (8 e/cella, μ nel gap), Massa efficace (parabola
 *    osculatrice direzionale lungo il tratto corrente), Confronto (reticolo vuoto fcc
 *    allineato al fondo della valenza).
 *  - Selezione interattiva (click/trascinamento/frecce) + indicatore «in affinamento…».
 *  - Legenda in HTML sopra il grafico (fuori dall'area di disegno); le etichette «gap diretto/indiretto»
 *    e quella della massa efficace cercano una posizione libera tra le curve (fondo opaco, trattino di richiamo).
 */
import { useRef, type JSX, type KeyboardEvent, type PointerEvent } from 'react'
import { formatEffectiveMassRatio, formatNumber } from '../../ui/format'
import { Smoothed, useReducedMotion } from '../../ui/motion'
import { quantityColor, toneColor, TOKENS, type QuantityId } from '../../ui/theme'
import { ChartLegend, type LegendEntry } from '../../viz/ChartLegend'
import {
  buildObstacleMap,
  drawMathText,
  drawSegmentedHorizontalLine,
  measureMathText,
  niceStep,
  placeFreeLabel,
  sansFont,
  useCanvasDraw,
  withAlpha,
  type PolylinePoint,
  type RectBox,
  type XSpan
} from '../../viz/canvas'
import type { PseudopotentialModel } from './model'
import { strings as s } from './strings'

const MARGIN = { left: 52, right: 16, top: 10, bottom: 28 }
const DIM = 0.25

export function EpmBandPlot({
  model,
  highlight,
  showProbe,
  showCompare,
  onPick,
  onNudge
}: {
  readonly model: PseudopotentialModel
  readonly highlight: QuantityId | null
  readonly showProbe: boolean
  readonly showCompare: boolean
  readonly onPick: (pointIndex: number, bandIndex: number) => void
  readonly onNudge: (dPoint: number, dBand: number) => void
}): JSX.Element {
  const reduced = useReducedMotion()
  const dragging = useRef(false)
  const anim = useRef({
    eMin: new Smoothed(model.eRange[0], 0.16),
    eMax: new Smoothed(model.eRange[1], 0.16),
    compare: new Smoothed(showCompare ? 1 : 0, 0.14),
    filling: new Smoothed(model.chemicalPotential !== null ? 1 : 0, 0.14),
    mu: new Smoothed(model.chemicalPotential ?? 0.5, 0.12),
    probe: new Smoothed(showProbe ? 1 : 0, 0.14),
    provisional: new Smoothed(model.isProvisional ? 1 : 0, 0.08)
  }).current

  const canvasRef = useCanvasDraw((ctx, { w, h }, dt) => {
    anim.eMin.set(model.eRange[0])
    anim.eMax.set(model.eRange[1])
    anim.compare.set(showCompare ? 1 : 0)
    anim.filling.set(model.chemicalPotential !== null ? 1 : 0)
    if (model.chemicalPotential !== null) anim.mu.set(model.chemicalPotential, anim.filling.value < 0.02)
    anim.probe.set(showProbe ? 1 : 0)
    anim.provisional.set(model.isProvisional ? 1 : 0)

    let moving = false
    for (const sm of [anim.eMin, anim.eMax, anim.compare, anim.filling, anim.mu, anim.probe, anim.provisional]) {
      moving = sm.step(dt, reduced) || moving
    }

    const L = MARGIN.left
    const T = MARGIN.top
    const W = Math.max(40, w - MARGIN.left - MARGIN.right)
    const H = Math.max(40, h - MARGIN.top - MARGIN.bottom)
    const dist = model.path.distance
    const dMax = dist[dist.length - 1] || 1
    const e0 = anim.eMin.value
    const e1 = anim.eMax.value

    const X = (d: number): number => L + (d / dMax) * W
    const Y = (E: number): number => T + ((e1 - E) / (e1 - e0)) * H
    const emE = highlight === null || highlight === 'E' ? 1 : DIM
    const emK = highlight === null || highlight === 'k' ? 1 : DIM

    // Griglia energetica
    const eStep = niceStep(e1 - e0, Math.max(4, Math.min(8, Math.round(H / 44))))
    ctx.font = sansFont(11)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let E = Math.ceil(e0 / eStep) * eStep; E <= e1 + 1e-9; E += eStep) {
      const y = Y(E)
      const isZero = Math.abs(E) < 1e-6
      ctx.strokeStyle = isZero ? TOKENS.lineStrong : TOKENS.line
      ctx.lineWidth = isZero ? 1.3 : 1
      ctx.beginPath()
      ctx.moveTo(L, Math.round(y) + 0.5)
      ctx.lineTo(L + W, Math.round(y) + 0.5)
      ctx.stroke()
      ctx.fillStyle = TOKENS.muted
      ctx.fillText(formatNumber(E, eStep < 1 ? 1 : 0), L - 7, y)
    }

    ctx.save()
    ctx.translate(14, T + H / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.globalAlpha = emE
    ctx.font = sansFont(11.5)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = quantityColor('E')
    ctx.fillText('E (eV)', 0, 0)
    ctx.restore()

    // Linee verticali ed etichette L–Γ–X–W–K–Γ
    ctx.font = sansFont(12, 600)
    ctx.textBaseline = 'top'
    model.path.labels.forEach((lbl, idx) => {
      const px = X(dist[lbl.index])
      ctx.strokeStyle = lbl.label === 'Γ' ? TOKENS.lineStrong : withAlpha(TOKENS.lineStrong, 0.6)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(Math.round(px) + 0.5, T)
      ctx.lineTo(Math.round(px) + 0.5, T + H)
      ctx.stroke()
      ctx.fillStyle = TOKENS.textSoft
      ctx.textAlign = idx === 0 ? 'left' : idx === model.path.labels.length - 1 ? 'right' : 'center'
      ctx.fillText(lbl.label, px, T + H + 7)
    })

    // Clip grafico per bande e sovrapposizioni
    ctx.save()
    ctx.beginPath()
    ctx.rect(L, T, W, H)
    ctx.clip()

    // Fascia del gap assoluto tra VBM (0) e CBM
    const { summary } = model
    if (summary.gap > 0.02) {
      const yTop = Y(summary.cbmEnergy)
      const yBot = Y(summary.vbmEnergy)
      ctx.fillStyle = withAlpha(quantityColor('VG'), 0.08)
      ctx.fillRect(L, yTop, W, Math.max(1, yBot - yTop))
    }

    // Confronto: reticolo vuoto fcc allineato al fondo della valenza
    if (anim.compare.value > 0.02 && model.emptyLatticeAligned) {
      const cmpCol = quantityColor('Ek')
      ctx.save()
      ctx.globalAlpha = anim.compare.value * (highlight === null || highlight === 'Ek' ? 0.65 : DIM)
      ctx.setLineDash([5, 4])
      ctx.strokeStyle = cmpCol
      ctx.lineWidth = highlight === 'Ek' ? 2.0 : 1.35
      for (const band of model.emptyLatticeAligned.energies) {
        ctx.beginPath()
        for (let i = 0; i < band.length; i++) {
          const px = X(dist[i])
          const py = Y(band[i])
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()
      }
      ctx.restore()
    }

    // 4 bande di valenza (0..3) e 4 di conduzione (4..7) con dissolvenza fluida dopo isProvisional
    const valCol = quantityColor('E')
    const condCol = toneColor('conductionBands')
    const provFade = 1 - 0.35 * anim.provisional.value
    for (let b = 0; b < model.bands.energies.length; b++) {
      const band = model.bands.energies[b]
      const isVal = b < 4
      const isSel = b === model.bandIndex
      const fillBoost = anim.filling.value > 0.02 && isVal ? 0.5 : 0
      ctx.save()
      ctx.globalAlpha = emE * provFade * (isSel ? 1 : isVal ? 0.92 : 0.86)
      ctx.strokeStyle = isVal ? valCol : condCol
      ctx.lineWidth = (isSel ? 2.8 : 1.9) + fillBoost
      ctx.beginPath()
      for (let i = 0; i < band.length; i++) {
        const px = X(dist[i])
        const py = Y(band[i])
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.restore()
    }

    const occupied: RectBox[] = []
    const muSkips: XSpan[] = []
    const labelRegion: RectBox = { x0: L + 4, y0: T + 4, x1: L + W - 4, y1: T + H - 4 }

    // Curve in pixel (bande, confronto): ingombri per le etichette
    const bandPolylines: PolylinePoint[][] = model.bands.energies.map((band) =>
      Array.from(band, (E, i) => ({ x: X(dist[i]), y: Y(E) }))
    )
    if (anim.compare.value > 0.02 && model.emptyLatticeAligned) {
      for (const band of model.emptyLatticeAligned.energies) {
        bandPolylines.push(Array.from(band, (E, i) => ({ x: X(dist[i]), y: Y(E) })))
      }
    }
    const xSelPx = X(dist[model.pointIndex])
    const ySelPx = Y(model.selectedEnergy)
    const selectionBox: RectBox = { x0: xSelPx - 11, y0: ySelPx - 11, x1: xSelPx + 11, y1: ySelPx + 11 }

    const yMuActive = anim.filling.value > 0.02 && model.chemicalPotential !== null ? Y(anim.mu.value) : null

    // Etichetta di μ (se il riempimento è acceso): prenotata prima delle altre
    if (yMuActive !== null) {
      const muW = measureMathText(ctx, s.scene.chemicalPotential, 12)
      const muBox: RectBox = { x0: L + W - 12 - muW, y0: yMuActive - 19, x1: L + W - 4, y1: yMuActive - 2 }
      occupied.push(muBox)
      muSkips.push({ x0: muBox.x0, x1: muBox.x1 })
    }

    // VBM, CBM e freccia del gap assoluto
    if (summary.gap > 0.02) {
      const xVbm = X(dist[summary.vbmIndex])
      const yVbm = Y(summary.vbmEnergy)
      const xCbm = X(dist[summary.cbmIndex])
      const yCbm = Y(summary.cbmEnergy)

      ctx.save()
      ctx.globalAlpha = emE * provFade
      ctx.strokeStyle = TOKENS.textSoft
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(xVbm, yVbm)
      ctx.lineTo(xCbm, yCbm)
      ctx.stroke()

      // Punta della freccia al CBM
      const ang = Math.atan2(yCbm - yVbm, xCbm - xVbm)
      const head = 6.5
      ctx.fillStyle = TOKENS.textSoft
      ctx.beginPath()
      ctx.moveTo(xCbm, yCbm)
      ctx.lineTo(xCbm - head * Math.cos(ang - 0.42), yCbm - head * Math.sin(ang - 0.42))
      ctx.lineTo(xCbm - head * Math.cos(ang + 0.42), yCbm - head * Math.sin(ang + 0.42))
      ctx.closePath()
      ctx.fill()

      // Pallini VBM e CBM
      ctx.fillStyle = valCol
      ctx.beginPath()
      ctx.arc(xVbm, yVbm, 4.2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = condCol
      ctx.beginPath()
      ctx.arc(xCbm, yCbm, 4.2, 0, Math.PI * 2)
      ctx.fill()

      const gapTag = model.isProvisional
        ? `gap ≈ ${formatNumber(summary.gap, 2)} eV`
        : `${summary.isDirect ? s.scene.directGap : s.scene.indirectGap} ${formatNumber(summary.gap, 2)} eV`
      const anchor = { x: 0.5 * (xVbm + xCbm), y: 0.5 * (yVbm + yCbm) }
      const gapObstacles = buildObstacleMap(
        labelRegion,
        [
          ...bandPolylines,
          [
            { x: xVbm, y: yVbm },
            { x: xCbm, y: yCbm }
          ],
          ...(yMuActive !== null
            ? [
                [
                  { x: L, y: yMuActive },
                  { x: L + W, y: yMuActive }
                ]
              ]
            : [])
        ],
        [...occupied, selectionBox]
      )
      ctx.globalAlpha = emE
      const gapBox = placeFreeLabel(ctx, {
        text: gapTag,
        rich: true,
        size: 11,
        color: TOKENS.text,
        backdrop: TOKENS.bg,
        anchor,
        obstacles: gapObstacles,
        region: labelRegion,
        occupied,
        leaderColor: TOKENS.textSoft
      })
      if (yMuActive !== null && yMuActive >= gapBox.y0 - 4 && yMuActive <= gapBox.y1 + 4) {
        muSkips.push({ x0: gapBox.x0, x1: gapBox.x1 })
      }
      ctx.restore()
    }

    // Riempimento: livello chimico μ nel gap (omesso se gap ≤ 0), spezzato sulle etichette
    if (yMuActive !== null) {
      const yMu = yMuActive
      const muCol = quantityColor('EF')
      ctx.save()
      ctx.globalAlpha = anim.filling.value * (highlight === null || highlight === 'EF' ? 0.95 : DIM)

      ctx.setLineDash([6, 4])
      ctx.strokeStyle = muCol
      ctx.lineWidth = highlight === 'EF' ? 2.4 : 1.7
      drawSegmentedHorizontalLine(ctx, L, L + W, yMu, muSkips, 5)
      ctx.setLineDash([])
      drawMathText(ctx, s.scene.chemicalPotential, L + W - 8, yMu - 7, {
        color: muCol,
        size: 12,
        align: 'right',
        backdrop: TOKENS.bg
      })
      ctx.restore()
    }

    // Sonda massa efficace: parabola osculatrice direzionale lungo il segmento corrente
    const xSel = xSelPx
    const ySel = ySelPx

    if (anim.probe.value > 0.02 && model.massProbe) {
      const mCol = quantityColor('mstar')
      const labels = model.path.labels
      let segD0 = dist[0]
      let segD1 = dMax
      for (let seg = 0; seg < labels.length - 1; seg++) {
        const isLast = seg === labels.length - 2
        if (
          model.pointIndex >= labels[seg].index &&
          (isLast ? model.pointIndex <= labels[seg + 1].index : model.pointIndex < labels[seg + 1].index)
        ) {
          segD0 = dist[labels[seg].index]
          segD1 = dist[labels[seg + 1].index]
          break
        }
      }
      const dSel = dist[model.pointIndex]
      const span = 0.14
      const dsMin = Math.max(-span, segD0 - dSel)
      const dsMax = Math.min(span, segD1 - dSel)
      const { slope, curvature, effectiveMassRatio } = model.massProbe

      ctx.save()
      ctx.globalAlpha = anim.probe.value * (highlight === null || highlight === 'mstar' ? 0.96 : DIM)
      ctx.strokeStyle = mCol
      ctx.lineWidth = highlight === 'mstar' ? 3.2 : 2.3
      const parabola: PolylinePoint[] = []
      ctx.beginPath()
      const steps = 28
      for (let i = 0; i <= steps; i++) {
        const ds = dsMin + ((dsMax - dsMin) * i) / steps
        const ePar = model.selectedEnergy + slope * ds + 0.5 * curvature * ds * ds
        const px = X(dSel + ds)
        const py = Y(ePar)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
        parabola.push({ x: px, y: py })
      }
      ctx.stroke()

      const mLabel = `$m^*/m_0$ ${formatEffectiveMassRatio(effectiveMassRatio, { digits: 3, withEquals: true })}`
      const probeObstacles = buildObstacleMap(labelRegion, [...bandPolylines, parabola], [...occupied, selectionBox])
      placeFreeLabel(ctx, {
        text: mLabel,
        rich: true,
        size: 11,
        color: mCol,
        backdrop: TOKENS.bg,
        anchor: { x: xSel, y: ySel },
        obstacles: probeObstacles,
        region: labelRegion,
        occupied,
        leaderColor: mCol
      })
      ctx.restore()
    }

    // Linea verticale e pallino dello stato scelto
    ctx.save()
    ctx.globalAlpha = emK
    ctx.strokeStyle = withAlpha(quantityColor('k'), 0.45)
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(xSel, T)
    ctx.lineTo(xSel, T + H)
    ctx.stroke()

    ctx.fillStyle = withAlpha(quantityColor('k'), 0.25)
    ctx.beginPath()
    ctx.arc(xSel, ySel, 9.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = quantityColor('k')
    ctx.strokeStyle = TOKENS.bg
    ctx.lineWidth = 1.8
    ctx.beginPath()
    ctx.arc(xSel, ySel, 5.0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    ctx.restore() // fine clip

    return moving
  })

  const pickAt = (e: PointerEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const W = Math.max(40, rect.width - MARGIN.left - MARGIN.right)
    const H = Math.max(40, rect.height - MARGIN.top - MARGIN.bottom)
    const dist = model.path.distance
    const dMax = dist[dist.length - 1] || 1
    const targetDist = Math.max(0, Math.min(dMax, ((px - MARGIN.left) / W) * dMax))

    // Indice più vicino per distanza d'arco
    let bestPoint = 0
    let bestDx = Infinity
    for (let i = 0; i < dist.length; i++) {
      const dx = Math.abs(dist[i] - targetDist)
      if (dx < bestDx) {
        bestDx = dx
        bestPoint = i
      }
    }

    // Banda più vicina per energia
    const [e0, e1] = model.eRange
    const targetE = e1 - ((py - MARGIN.top) / H) * (e1 - e0)
    let bestBand = 0
    let bestDe = Infinity
    for (let b = 0; b < model.bands.energies.length; b++) {
      const de = Math.abs(model.bands.energies[b][bestPoint] - targetE)
      if (de < bestDe) {
        bestDe = de
        bestBand = b
      }
    }
    onPick(bestPoint, bestBand)
  }

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>): void => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    pickAt(e)
  }

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>): void => {
    if (dragging.current) pickAt(e)
  }

  const onPointerUp = (e: PointerEvent<HTMLCanvasElement>): void => {
    if (dragging.current) {
      dragging.current = false
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLCanvasElement>): void => {
    const step = e.shiftKey ? 1 : 2
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onNudge(-step, 0)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      onNudge(step, 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      onNudge(0, 1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      onNudge(0, -1)
    }
  }

  const legend: LegendEntry[] = [
    { id: 'val', keyKind: 'solid', color: 'var(--q-E)', label: s.scene.valenceLegend },
    { id: 'cond', keyKind: 'solid', color: 'var(--tone-conduction-bands)', label: s.scene.conductionLegend },
    ...(showCompare
      ? [{ id: 'empty', keyKind: 'dashed' as const, color: 'var(--q-Ek)', label: s.scene.emptyLegend }]
      : [])
  ]

  return (
    <div className="pseudo-bandplot-box">
      <div className="pseudo-legend-row">
        <ChartLegend entries={legend} ariaLabel={s.scene.bandsLegendAria} />
        <span
          className={'pseudo-refine-pill' + (model.refining ? ' is-refining' : '')}
          title={model.lastWorkerMs !== null ? `${Math.round(model.lastWorkerMs)} ms` : undefined}
          aria-live="polite"
        >
          {model.refining ? s.scene.refining : `${model.summary.planeWaves} onde piane`}
        </span>
      </div>
      <div className="pseudo-canvas-box">
        <canvas
          ref={canvasRef}
          className="pseudo-bands-canvas"
          tabIndex={0}
          role="img"
          aria-label={s.scene.bandsAria}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  )
}
