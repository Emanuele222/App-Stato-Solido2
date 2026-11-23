/**
 * Prima vista (Sezione A «Pseudopotenziale»): bande 1D nella prima zona di Brillouin [-π/a, π/a].
 * Mostra la banda di core E_c(k), la banda di core spostata E_c(k) + f (non unicità di V_ps),
 * le 3 bande di valenza E_v(k) e gli strumenti trasversali (Riempimento, Massa efficace, Confronto).
 */
import { useRef, type JSX, type KeyboardEvent, type PointerEvent } from 'react'
import { formatEffectiveMassRatio, formatNumber } from '../../ui/format'
import { Smoothed, useReducedMotion } from '../../ui/motion'
import { quantityColor, TOKENS, type QuantityId } from '../../ui/theme'
import { ChartLegend, type LegendEntry } from '../../viz/ChartLegend'
import {
  drawMathText,
  niceStep,
  sansFont,
  useCanvasDraw,
  withAlpha
} from '../../viz/canvas'
import type { PseudoCoreModel } from './model'
import { strings as s } from './strings'

const MARGIN = { left: 48, right: 14, top: 10, bottom: 26 }
const DIM = 0.25

export function PseudoCoreBandPlot({
  model,
  highlight,
  showFill,
  showMass,
  showCompare,
  onPick,
  onNudge
}: {
  readonly model: PseudoCoreModel
  readonly highlight: QuantityId | null
  readonly showFill: boolean
  readonly showMass: boolean
  readonly showCompare: boolean
  readonly onPick: (kIndex: number, bandIndex: number) => void
  readonly onNudge: (dk: number, dBand: number) => void
}): JSX.Element {
  const reduced = useReducedMotion()
  const dragging = useRef(false)
  const anim = useRef({
    eMin: new Smoothed(model.eRange[0], 0.14),
    eMax: new Smoothed(model.eRange[1], 0.14)
  }).current

  const canvasRef = useCanvasDraw((ctx, { w, h }, dt) => {
    anim.eMin.set(model.eRange[0])
    anim.eMax.set(model.eRange[1])
    let moving = anim.eMin.step(dt, reduced)
    moving = anim.eMax.step(dt, reduced) || moving

    const L = MARGIN.left
    const T = MARGIN.top
    const W = Math.max(40, w - MARGIN.left - MARGIN.right)
    const H = Math.max(40, h - MARGIN.top - MARGIN.bottom)
    const e0 = anim.eMin.value
    const e1 = anim.eMax.value
    const kMax = Math.PI / model.params.a

    const X = (k: number): number => L + ((k + kMax) / (2 * kMax)) * W
    const Y = (E: number): number => T + ((e1 - E) / (e1 - e0)) * H

    const emE = highlight === null || highlight === 'E' ? 1 : DIM
    const emK = highlight === null || highlight === 'k' ? 1 : DIM
    const emF = highlight === null || highlight === 'V2G' ? 1 : DIM

    // Griglia energie
    const eStep = niceStep(e1 - e0, Math.max(4, Math.min(8, Math.round(H / 40))))
    ctx.font = sansFont(11)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let E = Math.ceil(e0 / eStep) * eStep; E <= e1 + 1e-9; E += eStep) {
      const y = Y(E)
      ctx.strokeStyle = Math.abs(E) < 1e-6 ? TOKENS.lineStrong : TOKENS.line
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(L, y)
      ctx.lineTo(L + W, y)
      ctx.stroke()
      ctx.fillStyle = TOKENS.dim
      ctx.fillText(formatNumber(E, 0), L - 6, y)
    }

    // Assi k = -π/a, 0, +π/a
    const kTicks = [
      { k: -kMax, label: '−π/a' },
      { k: 0, label: '0' },
      { k: kMax, label: 'π/a' }
    ]
    for (const tk of kTicks) {
      const x = X(tk.k)
      ctx.strokeStyle = tk.k === 0 ? TOKENS.lineStrong : TOKENS.line
      ctx.beginPath()
      ctx.moveTo(x, T)
      ctx.lineTo(x, T + H)
      ctx.stroke()
      drawMathText(ctx, tk.label, x, T + H + 15, { color: TOKENS.muted, size: 11, align: 'center' })
    }

    // Confronto: reticolo vuoto 1D
    if (showCompare && model.emptyBands) {
      ctx.save()
      ctx.strokeStyle = withAlpha(quantityColor('Ek'), 0.65)
      ctx.lineWidth = 1.4
      ctx.setLineDash([4, 4])
      for (const band of model.emptyBands.energies) {
        ctx.beginPath()
        for (let i = 0; i < band.length; i++) {
          const x = X(model.emptyBands.path.points[i][0])
          const y = Y(band[i])
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      ctx.restore()
    }

    // Riempimento: banda di core piena
    if (showFill) {
      const coreBand = model.bands.energies[0]
      ctx.save()
      ctx.fillStyle = withAlpha(quantityColor('EF'), 0.22)
      ctx.beginPath()
      for (let i = 0; i < coreBand.length; i++) {
        const x = X(model.path.points[i][0])
        const y = Y(coreBand[i])
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.lineTo(X(model.path.points[coreBand.length - 1][0]), Y(e0))
      ctx.lineTo(X(model.path.points[0][0]), Y(e0))
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    // Banda di core (b = 0)
    ctx.save()
    ctx.strokeStyle = withAlpha(quantityColor('VG'), emE)
    ctx.lineWidth = 2.2
    ctx.beginPath()
    for (let i = 0; i < model.bands.energies[0].length; i++) {
      const x = X(model.path.points[i][0])
      const y = Y(model.bands.energies[0][i])
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.restore()

    // Livello di core spostato E_c + f (quando f != 0 o evidenziato)
    if (Math.abs(model.params.f) > 1e-6 || highlight === 'V2G') {
      ctx.save()
      ctx.strokeStyle = withAlpha(quantityColor('V2G'), emF)
      ctx.lineWidth = 1.8
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      for (let i = 0; i < model.shiftedCoreBand.length; i++) {
        const x = X(model.path.points[i][0])
        const y = Y(model.shiftedCoreBand[i])
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.restore()
    }

    // Bande di valenza (b >= 1)
    ctx.save()
    ctx.strokeStyle = withAlpha(quantityColor('E'), emE)
    ctx.lineWidth = 2.1
    for (let b = 1; b < model.bands.energies.length; b++) {
      const band = model.bands.energies[b]
      ctx.beginPath()
      for (let i = 0; i < band.length; i++) {
        const x = X(model.path.points[i][0])
        const y = Y(band[i])
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    ctx.restore()

    // Stato scelto e tacca f = E - E_c
    const xSel = X(model.kValue)
    const ySel = Y(model.selectedEnergy)
    const yCore = Y(model.eCore)
    const yVal = Y(model.eValence)

    // Linea verticale k scelto
    ctx.save()
    ctx.strokeStyle = withAlpha(quantityColor('k'), 0.45 * emK)
    ctx.setLineDash([2, 3])
    ctx.beginPath()
    ctx.moveTo(xSel, T)
    ctx.lineTo(xSel, T + H)
    ctx.stroke()
    ctx.restore()

    // Tacca f = E_v - E_c su E_v (mostra la risonanza di degenerazione f = E - E_c)
    ctx.save()
    ctx.strokeStyle = withAlpha(quantityColor('V2G'), 0.85 * emF)
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(xSel - 9, yVal)
    ctx.lineTo(xSel + 9, yVal)
    ctx.stroke()
    ctx.restore()

    // Sonda di massa efficace (parabola osculatrice)
    if (showMass && model.massProbe && Number.isFinite(model.massProbe.curvature)) {
      const { curvature, effectiveMassRatio } = model.massProbe
      const dkSpan = 0.25 * kMax
      ctx.save()
      ctx.strokeStyle = quantityColor('mstar')
      ctx.lineWidth = 1.8
      ctx.beginPath()
      for (let j = -16; j <= 16; j++) {
        const dk = (j / 16) * dkSpan
        const k = model.kValue + dk
        const eParab =
          model.selectedEnergy + model.massProbe.slope * dk + 0.5 * curvature * dk * dk
        const px = X(k)
        const py = Y(eParab)
        if (j === -16) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      const label = `m*/m₀ ${formatEffectiveMassRatio(effectiveMassRatio, { digits: 2, withEquals: true })}`
      ctx.font = sansFont(11, 600)
      ctx.fillStyle = quantityColor('mstar')
      ctx.textAlign = xSel > L + W * 0.6 ? 'right' : 'left'
      ctx.fillText(label, xSel + (xSel > L + W * 0.6 ? -10 : 10), Math.max(T + 14, ySel - 12))
      ctx.restore()
    }

    // Pallino sullo stato selezionato
    ctx.save()
    ctx.fillStyle = quantityColor('k')
    ctx.strokeStyle = TOKENS.bg
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(xSel, ySel, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    if (Math.abs(model.params.f) > 1e-6) {
      ctx.fillStyle = quantityColor('V2G')
      ctx.beginPath()
      ctx.arc(xSel, Y(model.shiftedCoreAtK), 4, 0, Math.PI * 2)
      ctx.fill()
    }
    void yCore
    ctx.restore()

    return moving
  })

  const pickAt = (clientX: number, clientY: number): void => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const px = clientX - rect.left
    const py = clientY - rect.top
    const W = Math.max(40, rect.width - MARGIN.left - MARGIN.right)
    const H = Math.max(40, rect.height - MARGIN.top - MARGIN.bottom)
    const frac = Math.max(0, Math.min(1, (px - MARGIN.left) / W))
    const ki = Math.round(frac * (model.path.points.length - 1))
    const [e0, e1] = model.eRange
    let bestBand = model.bandIndex
    let bestDist = Infinity
    for (let b = 0; b < model.bands.energies.length; b++) {
      const yB = MARGIN.top + ((e1 - model.bands.energies[b][ki]) / (e1 - e0)) * H
      const d = Math.abs(py - yB)
      if (d < bestDist) {
        bestDist = d
        bestBand = b
      }
    }
    onPick(ki, bestBand)
  }

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>): void => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    pickAt(e.clientX, e.clientY)
  }
  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>): void => {
    if (!dragging.current) return
    pickAt(e.clientX, e.clientY)
  }
  const onPointerUp = (e: PointerEvent<HTMLCanvasElement>): void => {
    if (!dragging.current) return
    dragging.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLCanvasElement>): void => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      onNudge(1, 0)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onNudge(-1, 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      onNudge(0, 1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      onNudge(0, -1)
    }
  }

  const legend: LegendEntry[] = [
    { id: 'core', keyKind: 'solid', color: 'var(--q-VG)', label: s.scene.coreBandLegend },
    ...(Math.abs(model.params.f) > 1e-6
      ? [{ id: 'fcore', keyKind: 'dashed' as const, color: 'var(--q-V2G)', label: s.scene.shiftedCoreLegend }]
      : []),
    { id: 'val', keyKind: 'solid', color: 'var(--q-E)', label: s.scene.valenceBandLegend },
    ...(showCompare
      ? [{ id: 'empty', keyKind: 'dashed' as const, color: 'var(--q-Ek)', label: s.scene.emptyLegend }]
      : [])
  ]

  return (
    <div className="pseudo1d-bandplot-box">
      <ChartLegend entries={legend} ariaLabel={s.scene.bandsAria} />
      <div className="pseudo1d-canvas-box">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          role="slider"
          aria-label={s.scene.bandsAria}
          aria-valuenow={model.kIndex}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  )
}
