/**
 * Vista 2: Diagramma delle bande lungo il cammino (Γ–X–M–Γ o Γ–M–K–Γ)
 * nello stile di BandPlot/EpmBandPlot, con la striscia della densità degli
 * stati g(E) affiancata sullo stesso asse dell'energia per il grafene.
 */
import { useRef, type JSX, type PointerEvent } from 'react'
import { formatNumber } from '../../ui/format'
import { Smoothed, useReducedMotion } from '../../ui/motion'
import { quantityColor, toneColor, TOKENS, type QuantityId } from '../../ui/theme'
import { drawSegmentedHorizontalLine, niceStep, sansFont, useCanvasDraw, withAlpha } from '../../viz/canvas'
import type { TightBinding2DModel } from './model'
import { strings as s } from './strings'

const MARGIN = { left: 48, right: 12, top: 10, bottom: 26 }
const DIM = 0.26

export function PathBandPlot({
  model,
  pathFrac,
  highlight,
  onPickPath
}: {
  readonly model: TightBinding2DModel
  readonly pathFrac: number | null
  readonly highlight: QuantityId | null
  readonly onPickPath: (kx: number, ky: number, band: 0 | 1, pathFrac: number) => void
}): JSX.Element {
  const reduced = useReducedMotion()
  const dragging = useRef(false)
  const anim = useRef({
    eMin: new Smoothed(model.eRange[0], 0.16),
    eMax: new Smoothed(model.eRange[1], 0.16)
  }).current

  const hasDos = model.dos !== null

  const canvasRef = useCanvasDraw((ctx, { w, h }, dt) => {
    anim.eMin.set(model.eRange[0])
    anim.eMax.set(model.eRange[1])
    let moving = false
    moving = anim.eMin.step(dt, reduced) || moving
    moving = anim.eMax.step(dt, reduced) || moving

    const L = MARGIN.left
    const T = MARGIN.top
    const totalW = Math.max(40, w - MARGIN.left - MARGIN.right)
    const dosGap = hasDos ? 14 : 0
    const dosW = hasDos ? Math.max(52, Math.round(totalW * 0.26)) : 0
    const W = Math.max(40, totalW - dosW - dosGap)
    const H = Math.max(30, h - MARGIN.top - MARGIN.bottom)

    const e0 = anim.eMin.value
    const e1 = anim.eMax.value
    const dist = model.pathBands.path.distance
    const dMax = dist[dist.length - 1] || 1

    const X = (d: number): number => L + (d / dMax) * W
    const Y = (E: number): number => T + ((e1 - E) / (e1 - e0)) * H
    const emE = highlight === null || highlight === 'E' ? 1 : DIM
    const emK = highlight === null || highlight === 'k' ? 1 : DIM

    // Griglia energetica condivisa tra bande e g(E)
    const eStep = niceStep(e1 - e0, Math.max(3, Math.min(7, Math.round(H / 38))))
    ctx.font = sansFont(11)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let E = Math.ceil(e0 / eStep) * eStep; E <= e1 + 1e-9; E += eStep) {
      const y = Y(E)
      const isZero = Math.abs(E) < 1e-6
      ctx.strokeStyle = isZero ? TOKENS.lineStrong : TOKENS.line
      ctx.lineWidth = isZero ? 1.2 : 1
      ctx.beginPath()
      ctx.moveTo(L, Math.round(y) + 0.5)
      ctx.lineTo(L + W, Math.round(y) + 0.5)
      if (hasDos) {
        ctx.moveTo(L + W + dosGap, Math.round(y) + 0.5)
        ctx.lineTo(L + W + dosGap + dosW, Math.round(y) + 0.5)
      }
      ctx.stroke()
      ctx.fillStyle = TOKENS.muted
      ctx.fillText(formatNumber(E, eStep < 1 ? 1 : 0), L - 6, y)
    }

    // Etichetta asse E
    ctx.save()
    ctx.translate(13, T + H / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.globalAlpha = emE
    ctx.font = sansFont(11)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = quantityColor('E')
    ctx.fillText(s.views.bands.energyAxis, 0, 0)
    ctx.restore()

    // Linee verticali dei punti di alta simmetria
    ctx.font = sansFont(11.5)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    for (const lbl of model.pathBands.path.labels) {
      const x = X(dist[lbl.index])
      ctx.save()
      ctx.globalAlpha = emK
      ctx.strokeStyle = TOKENS.lineStrong
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(Math.round(x) + 0.5, T)
      ctx.lineTo(Math.round(x) + 0.5, T + H)
      ctx.stroke()
      ctx.fillStyle = quantityColor('k')
      ctx.fillText(lbl.label, x, T + H + 6)
      ctx.restore()
    }

    // Livello di Fermi E_F
    if (model.fermiLevel !== null) {
      const fy = Y(model.fermiLevel)
      if (fy >= T && fy <= T + H) {
        ctx.save()
        ctx.globalAlpha = highlight === null || highlight === 'EF' ? 0.95 : DIM
        ctx.strokeStyle = quantityColor('EF')
        ctx.lineWidth = 1.6
        ctx.setLineDash([5, 4])
        drawSegmentedHorizontalLine(ctx, L, L + (hasDos ? W + dosGap + dosW : W), fy, [])
        ctx.restore()
      }
    }

    // Curve di confronto (tratteggiate)
    if (model.comparePathBands) {
      const cmpColor = model.lattice === 'graphene' ? quantityColor('v') : quantityColor('Ek')
      ctx.save()
      ctx.beginPath()
      ctx.rect(L, T, W, H)
      ctx.clip()
      ctx.strokeStyle = cmpColor
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 4])
      ctx.globalAlpha = 0.85
      for (const band of model.comparePathBands.energies) {
        ctx.beginPath()
        for (let i = 0; i < band.length; i++) {
          const x = X(dist[i])
          const y = Y(band[i])
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      ctx.restore()
    }

    // Bande principali
    ctx.save()
    ctx.beginPath()
    ctx.rect(L, T, W, H)
    ctx.clip()
    const energies = model.pathBands.energies
    for (let b = 0; b < energies.length; b++) {
      const band = energies[b]
      const color =
        model.lattice === 'graphene' && b === 1 ? toneColor('conductionBands') : quantityColor('E')
      ctx.globalAlpha = emE
      ctx.strokeStyle = color
      ctx.lineWidth = highlight === 'E' ? 2.8 : 2.1
      ctx.beginPath()
      for (let i = 0; i < band.length; i++) {
        const x = X(dist[i])
        const y = Y(band[i])
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    ctx.restore()

    // Stato selezionato sul cammino
    if (pathFrac !== null) {
      const idx = Math.max(
        0,
        Math.min(model.pathBands.path.points.length - 1, Math.round(pathFrac * (model.pathBands.path.points.length - 1)))
      )
      const sx = X(dist[idx])
      const sy = Y(model.selectedState.E)
      ctx.save()
      ctx.fillStyle = quantityColor('k')
      ctx.strokeStyle = TOKENS.bg
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(sx, sy, 4.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }

    // Striscia g(E) per il grafene
    if (hasDos && model.dos) {
      const dosL = L + W + dosGap
      let maxDos = 0
      for (let i = 0; i < model.dos.dosPerCell.length; i++) {
        if (model.dos.dosPerCell[i] > maxDos) maxDos = model.dos.dosPerCell[i]
      }
      maxDos = Math.max(maxDos, 1e-6)

      ctx.save()
      ctx.beginPath()
      ctx.rect(dosL, T, dosW, H)
      ctx.clip()

      // Area riempita g(E)
      ctx.beginPath()
      ctx.moveTo(dosL, Y(model.dos.energies[0]))
      for (let i = 0; i < model.dos.energies.length; i++) {
        const x = dosL + (model.dos.dosPerCell[i] / maxDos) * (dosW - 4)
        const y = Y(model.dos.energies[i])
        ctx.lineTo(x, y)
      }
      ctx.lineTo(dosL, Y(model.dos.energies[model.dos.energies.length - 1]))
      ctx.closePath()
      ctx.fillStyle = withAlpha(quantityColor('E'), 0.22)
      ctx.fill()

      // Contorno g(E)
      ctx.beginPath()
      for (let i = 0; i < model.dos.energies.length; i++) {
        const x = dosL + (model.dos.dosPerCell[i] / maxDos) * (dosW - 4)
        const y = Y(model.dos.energies[i])
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = quantityColor('E')
      ctx.lineWidth = 1.6
      ctx.stroke()
      ctx.restore()

      // Bordo sinistro e etichetta g(E)
      ctx.strokeStyle = TOKENS.lineStrong
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(dosL + 0.5, T)
      ctx.lineTo(dosL + 0.5, T + H)
      ctx.stroke()

      ctx.font = sansFont(11)
      ctx.fillStyle = TOKENS.muted
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(s.views.bands.dosAxis, dosL + dosW / 2, T + H + 6)
    }

    // Bordo esterno del grafico bande
    ctx.strokeStyle = TOKENS.lineStrong
    ctx.lineWidth = 1
    ctx.strokeRect(L + 0.5, T + 0.5, W, H)

    return moving
  })

  const pickAt = (e: PointerEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const totalW = Math.max(40, rect.width - MARGIN.left - MARGIN.right)
    const dosGap = hasDos ? 14 : 0
    const dosW = hasDos ? Math.max(52, Math.round(totalW * 0.26)) : 0
    const W = Math.max(40, totalW - dosW - dosGap)
    const H = Math.max(30, rect.height - MARGIN.top - MARGIN.bottom)

    const xRel = e.clientX - rect.left - MARGIN.left
    if (xRel < -8 || xRel > W + 8) return
    const frac = Math.max(0, Math.min(1, xRel / W))
    const pts = model.pathBands.path.points
    const idx = Math.max(0, Math.min(pts.length - 1, Math.round(frac * (pts.length - 1))))
    const [kx, ky] = pts[idx]

    let band: 0 | 1 = 0
    if (model.pathBands.energies.length > 1) {
      const yRel = e.clientY - rect.top - MARGIN.top
      const eVal = model.eRange[1] - (yRel / H) * (model.eRange[1] - model.eRange[0])
      const e0 = model.pathBands.energies[0][idx]
      const e1 = model.pathBands.energies[1][idx]
      band = Math.abs(eVal - e1) < Math.abs(eVal - e0) ? 1 : 0
    }
    onPickPath(kx, ky, band, idx / (pts.length - 1))
  }

  return (
    <canvas
      ref={canvasRef}
      className="tb2d-canvas"
      role="img"
      aria-label={s.views.bands.ariaLabel}
      onPointerDown={(e) => {
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        pickAt(e)
      }}
      onPointerMove={(e) => {
        if (dragging.current) pickAt(e)
      }}
      onPointerUp={(e) => {
        dragging.current = false
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId)
        }
      }}
    />
  )
}
