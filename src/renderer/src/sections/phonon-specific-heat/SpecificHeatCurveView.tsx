/**
 * Vista 1 — Grafico interattivo del calore specifico molare C_V(T)
 * Commutabile Lineare / Log–Log e C_V/3R / J·mol⁻¹·K⁻¹, con cursore mobile su T,
 * asintoto T³ opzionale e dati sperimentali Tab. 2 della dispensa.
 */
import { memo, useCallback, useMemo, useRef, type JSX, type KeyboardEvent, type PointerEvent } from 'react'
import { THREE_R } from '../../physics/specificHeat'
import { formatNumber } from '../../ui/format'
import { RichText } from '../../ui/tex'
import { quantityColor, TOKENS, toneColor, type QuantityId } from '../../ui/theme'
import { ChartLegend, type LegendEntry } from '../../viz/ChartLegend'
import {
  buildObstacleMap,
  drawMathText,
  drawRichText,
  niceStep,
  placeFreeLabel,
  sansFont,
  useCanvasDraw,
  type PolylinePoint,
  type RectBox
} from '../../viz/canvas'
import { NUMERICS, type CvUnit, type PlotScale } from './manifest'
import type { SpecificHeatModel } from './model'
import { strings as s } from './strings'

export interface SpecificHeatCurveViewProps {
  readonly model: SpecificHeatModel
  readonly highlight: QuantityId | null
  readonly onChangeT: (temperatureK: number) => void
  readonly onNudgeT: (deltaK: number) => void
  readonly onChangeScale: (scale: PlotScale) => void
  readonly onChangeUnit: (unit: CvUnit) => void
  readonly onToggleT3: () => void
}

const DIM = 0.24

interface PlotMetrics {
  readonly padL: number
  readonly padR: number
  readonly padT: number
  readonly padB: number
  readonly plotW: number
  readonly plotH: number
  readonly scale: PlotScale
}

function pxToTemperature(px: number, m: PlotMetrics): number {
  const frac = Math.min(1, Math.max(0, (px - m.padL) / Math.max(1, m.plotW)))
  if (m.scale === 'loglog') {
    return NUMERICS.tMinPlotK * Math.pow(NUMERICS.tMaxPlotK / NUMERICS.tMinPlotK, frac)
  }
  return NUMERICS.tMaxPlotK * frac
}

export const SpecificHeatCurveView = memo(function SpecificHeatCurveView({
  model,
  highlight,
  onChangeT,
  onNudgeT,
  onChangeScale,
  onChangeUnit,
  onToggleT3
}: SpecificHeatCurveViewProps): JSX.Element {
  const draggingRef = useRef(false)
  const metricsRef = useRef<PlotMetrics>({
    padL: 54,
    padR: 18,
    padT: 22,
    padB: 34,
    plotW: 300,
    plotH: 180,
    scale: model.scale
  })

  const showEinstein =
    model.stage === 'einstein' || model.stage === 'debye' || model.stage === 'comparison'
  const showDebye =
    model.stage === 'debye' || model.stage === 'beyond-1953' || model.stage === 'comparison'
  const showT3 =
    model.showT3Asymptote && (model.stage === 'debye' || model.stage === 'comparison')
  const showChain1D = model.stage === 'beyond-1953'
  const hasExp = (model.activeMaterial?.experimentalPoints.length ?? 0) > 0

  const legend = useMemo<readonly LegendEntry[]>(() => {
    const entries: LegendEntry[] = [
      {
        id: 'dp',
        keyKind: model.stage === 'dulong-petit' ? 'solid' : 'dashed',
        color: 'var(--q-Ek)',
        label: <RichText text={s.curveScene.legendDulongPetit} />
      }
    ]
    if (showEinstein) {
      entries.push({
        id: 'einstein',
        keyKind: model.stage === 'einstein' ? 'solid' : 'dashed',
        color: 'var(--q-omegaOpt)',
        label: <RichText text={s.curveScene.legendEinstein} />
      })
    }
    if (showDebye) {
      entries.push({
        id: 'debye',
        keyKind: 'solid',
        color: 'var(--q-CV)',
        label: <RichText text={s.curveScene.legendDebye} />
      })
    }
    if (showT3) {
      entries.push({
        id: 't3',
        keyKind: 'dotted',
        color: 'var(--q-omega)',
        label: <RichText text={s.curveScene.legendDebyeT3} />
      })
    }
    if (showChain1D) {
      entries.push({
        id: 'chain1d',
        keyKind: 'dashed',
        color: 'var(--tone-van-hove-dos)',
        label: <RichText text={s.curveScene.legendChain1D} />
      })
    }
    if (hasExp) {
      entries.push({
        id: 'exp',
        keyKind: 'diamond',
        color: 'var(--tone-light-line)',
        label: (
          <RichText
            text={
              model.activeMaterial?.id === 'diamond'
                ? s.curveScene.legendDiamondEst
                : s.curveScene.legendExp
            }
          />
        )
      })
    }
    entries.push({
      id: 'cursor',
      keyKind: 'dot',
      color: 'var(--q-T)',
      label: <RichText text={s.curveScene.legendCursor} />
    })
    return entries
  }, [model.stage, model.activeMaterial?.id, showEinstein, showDebye, showT3, showChain1D, hasExp])

  const canvasRef = useCanvasDraw((ctx, { w, h }) => {
    const isLog = model.scale === 'loglog'
    const isMolar = model.unit === 'molar'
    const scaleFactor = model.cvScaleFactor
    const padL = isMolar ? 54 : 52
    const padR = 18
    const padT = 22
    const padB = 34
    const plotW = Math.max(100, w - padL - padR)
    const plotH = Math.max(80, h - padT - padB)
    const x0 = padL
    const x1 = padL + plotW
    const y0 = padT
    const y1 = padT + plotH

    metricsRef.current = { padL, padR, padT, padB, plotW, plotH, scale: model.scale }

    const em = (q: QuantityId): number => (highlight === null || highlight === q ? 1 : DIM)
    const emDebye = highlight === null || highlight === 'CV' || highlight === 'Theta' ? 1 : DIM
    const emT3 = highlight === null || highlight === 'omega' || highlight === 'Theta' ? 1 : DIM
    const lw = (q: QuantityId, base: number): number => (highlight === q ? base + 1.2 : base)

    const logTMin = Math.log10(NUMERICS.tMinPlotK)
    const logTMax = Math.log10(NUMERICS.tMaxPlotK)
    const toPxX = (t: number): number => {
      if (isLog) {
        const clamped = Math.max(NUMERICS.tMinPlotK, Math.min(NUMERICS.tMaxPlotK, t))
        return x0 + ((Math.log10(clamped) - logTMin) / (logTMax - logTMin)) * plotW
      }
      return x0 + (Math.max(0, Math.min(NUMERICS.tMaxPlotK, t)) / NUMERICS.tMaxPlotK) * plotW
    }

    const logYMinVal = NUMERICS.logRatioMin * scaleFactor
    const logYMaxVal = NUMERICS.logRatioMax * scaleFactor
    const logYMin = Math.log10(logYMinVal)
    const logYMax = Math.log10(logYMaxVal)
    const linYMaxRatio = NUMERICS.linearRatioMax

    const toPxYRatio = (ratio: number): number => {
      if (isLog) {
        const val = ratio * scaleFactor
        const clamped = Math.max(logYMinVal * 0.5, Math.min(logYMaxVal * 1.1, val))
        const ly = Math.log10(Math.max(1e-12, clamped))
        return y1 - ((ly - logYMin) / (logYMax - logYMin)) * plotH
      }
      return y1 - (Math.max(0, Math.min(linYMaxRatio, ratio)) / linYMaxRatio) * plotH
    }

    // --- Griglia e assi ---
    ctx.save()
    ctx.strokeStyle = TOKENS.line
    ctx.lineWidth = 1

    const xTicks = isLog
      ? [5, 10, 20, 50, 100, 200, 500, 1000, 1500]
      : [0, 300, 600, 900, 1200, 1500]

    for (const tv of xTicks) {
      const px = toPxX(tv)
      ctx.beginPath()
      ctx.moveTo(Math.round(px) + 0.5, y0)
      ctx.lineTo(Math.round(px) + 0.5, y1)
      ctx.stroke()
    }

    if (isLog) {
      const minExp = Math.floor(logYMin)
      const maxExp = Math.ceil(logYMax)
      for (let e = minExp; e <= maxExp; e++) {
        const v = Math.pow(10, e)
        if (v < logYMinVal * 0.99 || v > logYMaxVal * 1.01) continue
        const py = toPxYRatio(v / scaleFactor)
        ctx.beginPath()
        ctx.moveTo(x0, Math.round(py) + 0.5)
        ctx.lineTo(x1, Math.round(py) + 0.5)
        ctx.stroke()
      }
    } else {
      const yMaxDisp = linYMaxRatio * scaleFactor
      const yStep = isMolar ? niceStep(yMaxDisp, 4) : 0.25
      for (let v = yStep; v <= yMaxDisp * 0.995; v += yStep) {
        const py = toPxYRatio(v / scaleFactor)
        ctx.beginPath()
        ctx.moveTo(x0, Math.round(py) + 0.5)
        ctx.lineTo(x1, Math.round(py) + 0.5)
        ctx.stroke()
      }
    }

    // Cornice assi principali
    ctx.strokeStyle = TOKENS.lineStrong
    ctx.beginPath()
    ctx.moveTo(x0 + 0.5, y0)
    ctx.lineTo(x0 + 0.5, y1 + 0.5)
    ctx.lineTo(x1, y1 + 0.5)
    ctx.stroke()
    ctx.restore()

    // Etichette assi (fuori dall'area curve per zero sovrapposizioni)
    ctx.save()
    ctx.fillStyle = TOKENS.muted
    ctx.font = sansFont(10.5)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    let lastTickX = -Infinity
    for (const tv of xTicks) {
      const px = toPxX(tv)
      if (px - lastTickX < 28 && tv !== 5 && tv !== 1500) continue
      ctx.fillText(String(tv), px, y1 + 5)
      lastTickX = px
    }

    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    if (isLog) {
      const minExp = Math.floor(logYMin)
      const maxExp = Math.ceil(logYMax)
      for (let e = minExp; e <= maxExp; e++) {
        const v = Math.pow(10, e)
        if (v < logYMinVal * 0.99 || v > logYMaxVal * 1.01) continue
        const py = toPxYRatio(v / scaleFactor)
        const label = e === 0 ? '1' : e === 1 ? '10' : `10^{${e}}`
        drawMathText(ctx, label, x0 - 6, py + 3.5, {
          size: 10.5,
          color: TOKENS.muted,
          align: 'right',
          italic: false
        })
      }
    } else {
      const yMaxDisp = linYMaxRatio * scaleFactor
      const yStep = isMolar ? niceStep(yMaxDisp, 4) : 0.25
      for (let v = 0; v <= yMaxDisp * 0.995; v += yStep) {
        const py = toPxYRatio(v / scaleFactor)
        const lbl = isMolar ? formatNumber(v, 0) : formatNumber(v, 2)
        ctx.fillText(lbl, x0 - 6, py)
      }
    }

    // Titolo asse Y in alto sopra y0 e titolo asse X in basso a destra
    drawRichText(
      ctx,
      isMolar ? '$C_V$ [J/(mol·K)]' : '$C_V / 3R$',
      x0,
      y0 - 7,
      { size: 11, color: TOKENS.textSoft, align: 'left' }
    )
    drawRichText(ctx, '$T$ (K)', x1, h - 5, {
      size: 11,
      color: TOKENS.textSoft,
      align: 'right'
    })
    ctx.restore()

    // Clipping nell'area del grafico per le curve
    ctx.save()
    ctx.beginPath()
    ctx.rect(x0, y0, plotW, plotH)
    ctx.clip()

    const samples = isLog ? model.logSamples : model.linearSamples
    const polylinesForObstacles: PolylinePoint[][] = []
    const occupied: RectBox[] = []

    const drawCurve = (
      extractor: (pt: (typeof samples)[number]) => number,
      color: string,
      width: number,
      alpha: number,
      dash: readonly number[] = []
    ): void => {
      const pts: PolylinePoint[] = []
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.globalAlpha = alpha
      ctx.setLineDash([...dash])
      ctx.beginPath()
      let started = false
      for (const sPt of samples) {
        const ratio = extractor(sPt)
        if (!Number.isFinite(ratio)) continue
        if (isLog && ratio * scaleFactor < logYMinVal * 0.4) {
          started = false
          continue
        }
        if (isLog && ratio * scaleFactor > logYMaxVal * 1.15) {
          started = false
          continue
        }
        const px = toPxX(sPt.t)
        const py = toPxYRatio(ratio)
        pts.push({ x: px, y: py })
        if (!started) {
          ctx.moveTo(px, py)
          started = true
        } else {
          ctx.lineTo(px, py)
        }
      }
      ctx.stroke()
      ctx.restore()
      if (pts.length > 1) polylinesForObstacles.push(pts)
    }

    // 1. Dulong-Petit (3R)
    const dpPy = toPxYRatio(1)
    ctx.save()
    ctx.strokeStyle = quantityColor('Ek')
    ctx.lineWidth = lw('Ek', model.stage === 'dulong-petit' ? 2.4 : 1.5)
    ctx.globalAlpha = em('Ek') * (model.stage === 'dulong-petit' ? 0.95 : 0.72)
    if (model.stage !== 'dulong-petit') ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.moveTo(x0, dpPy)
    ctx.lineTo(x1, dpPy)
    ctx.stroke()
    ctx.restore()
    polylinesForObstacles.push([
      { x: x0, y: dpPy },
      { x: x1, y: dpPy }
    ])

    // 2. Asintoto T³ (quando attivo)
    if (showT3) {
      drawCurve(
        (pt) => pt.debyeT3,
        quantityColor('omega'),
        highlight === 'omega' || highlight === 'Theta' ? 2.4 : 1.8,
        emT3 * 0.9,
        [2, 4]
      )
    }

    // 3. Catena 1D (solo tappa 1953 Oltre Debye)
    if (showChain1D) {
      drawCurve(
        (pt) => pt.chain1D,
        toneColor('vanHoveDos'),
        lw('CV', 1.8),
        em('CV') * 0.85,
        [6, 4]
      )
    }

    // 4. Einstein (1907, 1912 per confronto, Confronto completo)
    if (showEinstein) {
      const isPrimaryEinstein = model.stage === 'einstein'
      drawCurve(
        (pt) => pt.einstein,
        quantityColor('omegaOpt'),
        lw('omegaOpt', isPrimaryEinstein ? 2.4 : 1.7),
        em('omegaOpt') * (isPrimaryEinstein ? 0.98 : 0.8),
        isPrimaryEinstein ? [] : [7, 4]
      )
    }

    // 5. Debye
    if (showDebye) {
      drawCurve(
        (pt) => pt.debye,
        quantityColor('CV'),
        highlight === 'CV' || highlight === 'Theta' ? 3.2 : 2.4,
        emDebye * 0.98
      )
    }

    // 6. Cursore verticale alla temperatura corrente T
    const cursorX = toPxX(model.params.temperatureK)
    ctx.save()
    ctx.strokeStyle = quantityColor('T')
    ctx.lineWidth = lw('T', 1.5)
    ctx.globalAlpha = em('T') * 0.78
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(cursorX, y0)
    ctx.lineTo(cursorX, y1)
    ctx.stroke()
    ctx.restore()
    polylinesForObstacles.push([
      { x: cursorX, y: y0 },
      { x: cursorX, y: y1 }
    ])

    // Pallini sui valori correnti a T
    const drawDot = (ratio: number, color: string, q: QuantityId, radius = 4.2): void => {
      if (isLog && ratio * scaleFactor < logYMinVal * 0.5) return
      const py = toPxYRatio(ratio)
      ctx.save()
      ctx.globalAlpha = em(q)
      ctx.fillStyle = color
      ctx.strokeStyle = TOKENS.bg
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(cursorX, py, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }

    drawDot(1, quantityColor('Ek'), 'Ek', 3.5)
    if (showEinstein) drawDot(model.summary.einsteinNorm, quantityColor('omegaOpt'), 'omegaOpt', 4)
    if (showDebye) {
      const pyDebye = toPxYRatio(model.summary.debyeNorm)
      if (!(isLog && model.summary.debyeNorm * scaleFactor < logYMinVal * 0.5)) {
        ctx.save()
        ctx.globalAlpha = emDebye
        ctx.fillStyle = quantityColor('CV')
        ctx.strokeStyle = TOKENS.bg
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(cursorX, pyDebye, 4.6, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        ctx.restore()
      }
    }
    if (showChain1D) drawDot(model.chain1DCvNormAtT, toneColor('vanHoveDos'), 'CV', 3.8)

    // 7. Punti sperimentali / di riferimento dalla dispensa (non collegati a q=k)
    const expPts = model.activeMaterial?.experimentalPoints ?? []
    const expAlpha = highlight === null || highlight === 'CV' || highlight === 'T' ? 0.96 : 0.42
    const expColor = toneColor('lightLine')
    const expMarkers: Array<{ x: number; y: number; text: string }> = []
    for (const ep of expPts) {
      const ratio = ep.cvJmolK / THREE_R
      if (isLog && ratio * scaleFactor < logYMinVal * 0.6) continue
      const mx = toPxX(ep.temperatureK)
      const my = toPxYRatio(ratio)
      const r = 5.2
      ctx.save()
      ctx.globalAlpha = expAlpha
      ctx.fillStyle = expColor
      ctx.strokeStyle = TOKENS.bg
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(mx, my - r)
      ctx.lineTo(mx + r, my)
      ctx.lineTo(mx, my + r)
      ctx.lineTo(mx - r, my)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.restore()
      const valText = isMolar
        ? `${ep.temperatureK} K: ${formatNumber(ep.cvJmolK, ep.cvJmolK < 1 ? 2 : 1)}`
        : `${ep.temperatureK} K: ${formatNumber(ratio, 2)}`
      expMarkers.push({ x: mx, y: my, text: valText })
      occupied.push({ x0: mx - 7, y0: my - 7, x1: mx + 7, y1: my + 7 })
    }

    // Posizionamento automatico senza collisioni per etichette sperimentali e label 3R
    const region: RectBox = { x0: x0 + 4, y0: y0 + 4, x1: x1 - 4, y1: y1 - 4 }
    const obstacles = buildObstacleMap(region, polylinesForObstacles, occupied, { curve: 4, rect: 14 })

    placeFreeLabel(ctx, {
      text: isMolar ? `3R = ${formatNumber(THREE_R, 2)}` : '3R',
      size: 10.5,
      color: quantityColor('Ek'),
      backdrop: TOKENS.bg,
      anchor: { x: x1 - 44, y: dpPy - 12 },
      obstacles,
      region,
      occupied,
      leader: false
    })

    for (const mk of expMarkers) {
      const obsExp = buildObstacleMap(region, polylinesForObstacles, occupied, { curve: 4, rect: 16 })
      placeFreeLabel(ctx, {
        text: mk.text,
        size: 10,
        color: expColor,
        backdrop: TOKENS.bg,
        anchor: { x: mk.x, y: mk.y + (mk.y > y0 + 36 ? -18 : 18) },
        obstacles: obsExp,
        region,
        occupied,
        leaderColor: expColor
      })
    }

    // In log-log per Debye / Confronto completo: etichetta pendenza 3
    if (isLog && showT3) {
      const refT = Math.max(NUMERICS.tMinPlotK * 1.4, Math.min(model.params.thetaDK * 0.08, 120))
      const refRatio = Math.pow(refT / model.params.thetaDK, 3) * (4 * Math.PI ** 4 / 5)
      if (refRatio * scaleFactor > logYMinVal * 2 && refRatio * scaleFactor < 0.3 * scaleFactor) {
        const obsSlope = buildObstacleMap(region, polylinesForObstacles, occupied, { curve: 4, rect: 16 })
        placeFreeLabel(ctx, {
          text: '∝ $T^3$',
          rich: true,
          size: 10.5,
          color: quantityColor('omega'),
          backdrop: TOKENS.bg,
          anchor: { x: toPxX(refT) + 20, y: toPxYRatio(refRatio) + 12 },
          obstacles: obsSlope,
          region,
          occupied,
          leader: false
        })
      }
    }

    ctx.restore() // fine clip area grafico

    // Badge temperatura corrente sopra il cursore nella fascia padT
    const tLabel = `T = ${Math.round(model.params.temperatureK)} K`
    const badgeX = Math.max(x0 + 96, Math.min(x1 - 36, cursorX))
    drawRichText(ctx, tLabel, badgeX, y0 - 7, {
      size: 11,
      weight: 600,
      color: quantityColor('T'),
      align: 'center'
    })

    return false
  })

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const localX = clientX - rect.left
      onChangeT(pxToTemperature(localX, metricsRef.current))
    },
    [canvasRef, onChangeT]
  )

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      draggingRef.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      updateFromClientX(e.clientX)
    },
    [updateFromClientX]
  )

  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      if (!draggingRef.current) return
      updateFromClientX(e.clientX)
    },
    [updateFromClientX]
  )

  const handlePointerUp = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLCanvasElement>) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault()
        onNudgeT(-NUMERICS.tNudgeK)
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault()
        onNudgeT(NUMERICS.tNudgeK)
      }
    },
    [onNudgeT]
  )

  return (
    <div className="phonon-sh-view phonon-sh-curve-stage">
      <div className="phonon-sh-bar">
        <ChartLegend entries={legend} ariaLabel={s.curveScene.legendAria} />
        <div className="phonon-sh-controls">
          <div className="phonon-sh-quick" role="group" aria-label={s.controls.scaleLabel}>
            <button
              type="button"
              className="phonon-sh-quick-btn"
              aria-pressed={model.scale === 'linear'}
              onClick={() => onChangeScale('linear')}
            >
              {s.controls.linear}
            </button>
            <button
              type="button"
              className="phonon-sh-quick-btn"
              aria-pressed={model.scale === 'loglog'}
              onClick={() => onChangeScale('loglog')}
            >
              {s.controls.loglog}
            </button>
          </div>
          <div className="phonon-sh-quick" role="group" aria-label={s.controls.unitLabel}>
            <button
              type="button"
              className="phonon-sh-quick-btn"
              aria-pressed={model.unit === 'ratio'}
              onClick={() => onChangeUnit('ratio')}
            >
              {s.controls.unitRatio}
            </button>
            <button
              type="button"
              className="phonon-sh-quick-btn"
              aria-pressed={model.unit === 'molar'}
              onClick={() => onChangeUnit('molar')}
            >
              {s.controls.unitMolar}
            </button>
          </div>
          {(model.stage === 'debye' || model.stage === 'comparison') && (
            <button
              type="button"
              className="phonon-sh-pill-btn"
              aria-pressed={model.showT3Asymptote}
              title={s.controls.t3Title}
              onClick={onToggleT3}
            >
              {s.controls.t3Toggle}
            </button>
          )}
        </div>
      </div>
      <div className="phonon-sh-stage">
        <div className="phonon-sh-main-wrap">
          <canvas
            ref={canvasRef}
            className="phonon-sh-canvas is-interactive"
            tabIndex={0}
            role="slider"
            aria-label={s.curveScene.aria}
            aria-valuemin={5}
            aria-valuemax={1500}
            aria-valuenow={Math.round(model.params.temperatureK)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
    </div>
  )
})
