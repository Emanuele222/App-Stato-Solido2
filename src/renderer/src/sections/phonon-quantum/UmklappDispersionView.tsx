/**
 * Vista 2 della Modalità B — Curva ν(k) con marcatori (k₁, k₂, k₃), punto ripiegato
 * e frecce direzionali di velocità di gruppo v_g(k₁), v_g(k₂), v_g(k₃),
 * per mostrare visivamente l'inversione del flusso di quasi-impulso ed energia negli Umklapp.
 */
import {
  memo,
  useCallback,
  useMemo,
  useRef,
  type JSX,
  type KeyboardEvent,
  type PointerEvent
} from 'react'
import { formatNumber } from '../../ui/format'
import { RichText } from '../../ui/tex'
import { quantityColor, toneColor, TOKENS, type QuantityId } from '../../ui/theme'
import { ChartLegend, type LegendEntry } from '../../viz/ChartLegend'
import {
  drawMathText,
  drawRichText,
  measureRichText,
  niceStep,
  placeProbeLabel,
  sansFont,
  useCanvasDraw,
  withAlpha,
  type RectBox
} from '../../viz/canvas'
import type { UmklappModel } from './model'
import { strings as s } from './strings'
import './phonon-quantum.css'

export interface UmklappDispersionViewProps {
  readonly model: UmklappModel
  readonly highlight: QuantityId | null
  readonly onChangeK: (which: 'k1' | 'k2', kFrac: number) => void
  readonly onNudge: (which: 'k1' | 'k2', dx: number) => void
}

const DIM = 0.26

function drawTangentArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  dxPx: number,
  dyPx: number,
  color: string,
  lineWidth: number
): void {
  const len = Math.hypot(dxPx, dyPx)
  if (len < 3) return
  const ux = dxPx / len
  const uy = dyPx / len
  const nx = -uy
  const ny = ux
  const x0 = cx - dxPx * 0.45
  const y0 = cy - dyPx * 0.45
  const x1 = cx + dxPx * 0.55
  const y1 = cy + dyPx * 0.55
  const hl = 6
  const hw = 3.5
  const bx = x1 - ux * hl
  const by = y1 - uy * hl

  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(bx, by)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(bx + nx * hw, by + ny * hw)
  ctx.lineTo(bx - nx * hw, by - ny * hw)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export const UmklappDispersionView = memo(function UmklappDispersionView({
  model,
  highlight,
  onChangeK,
  onNudge
}: UmklappDispersionViewProps): JSX.Element {
  const dragTargetRef = useRef<'k1' | 'k2' | null>(null)
  const activeKeyTargetRef = useRef<'k1' | 'k2'>('k2')
  const layoutRef = useRef<{ padL: number; plotW: number }>({ padL: 52, plotW: 400 })

  const col = model.collision
  const isUmklapp = col.kind === 'umklapp'

  const legend = useMemo<readonly LegendEntry[]>(
    () => [
      { id: 'curve', keyKind: 'solid', color: 'var(--q-omega)', label: <RichText text={s.umklappScene.legendCurve} /> },
      { id: 'vg', keyKind: 'solid', color: 'var(--q-v)', label: <RichText text={s.umklappScene.legendVg} /> },
      { id: 'k1', keyKind: 'dot', color: 'var(--q-k)', label: <RichText text={s.umklappScene.legendK1} /> },
      {
        id: 'k2',
        keyKind: 'dot',
        color: 'var(--tone-light-line)',
        label: <RichText text={s.umklappScene.legendK2} />
      },
      { id: 'k3', keyKind: 'dot', color: 'var(--q-omega)', label: <RichText text={s.umklappScene.legendK3} /> }
    ],
    []
  )

  const pxToClamped1BZ = useCallback(
    (clientX: number, rect: DOMRect): number => {
      const { padL, plotW } = layoutRef.current
      const [kMin, kMax] = model.kRange
      const x = clientX - rect.left
      const k = kMin + ((x - padL) / plotW) * (kMax - kMin)
      const kFrac = k / model.summary.zoneEdge
      return Math.max(-0.95, Math.min(1.0, kFrac))
    },
    [model.kRange, model.summary.zoneEdge]
  )

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const f = pxToClamped1BZ(e.clientX, rect)
      const target: 'k1' | 'k2' =
        Math.abs(f - col.k1Frac) <= Math.abs(f - col.k2Frac) ? 'k1' : 'k2'
      dragTargetRef.current = target
      activeKeyTargetRef.current = target
      e.currentTarget.setPointerCapture(e.pointerId)
      onChangeK(target, f)
    },
    [col.k1Frac, col.k2Frac, onChangeK, pxToClamped1BZ]
  )

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      const target = dragTargetRef.current
      if (!target) return
      const rect = e.currentTarget.getBoundingClientRect()
      onChangeK(target, pxToClamped1BZ(e.clientX, rect))
    },
    [onChangeK, pxToClamped1BZ]
  )

  const onPointerUp = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    if (dragTargetRef.current) {
      dragTargetRef.current = null
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    }
  }, [])

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLCanvasElement>) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onNudge(activeKeyTargetRef.current, -1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        onNudge(activeKeyTargetRef.current, 1)
      }
    },
    [onNudge]
  )

  const canvasRef = useCanvasDraw((ctx, { w, h }) => {
    const em = (q: QuantityId): number => (highlight === null || highlight === q ? 1 : DIM)
    const lw = (q: QuantityId, base: number): number => (highlight === q ? base + 1.1 : base)

    const padL = 52
    const padR = 16
    const padT = 12
    const padB = 34
    const plotW = Math.max(100, w - padL - padR)
    const plotH = Math.max(80, h - padT - padB)
    layoutRef.current = { padL, plotW }

    const zoneEdge = model.summary.zoneEdge
    const [kMin, kMax] = model.kRange
    const [yMin, yMax] = model.yRange
    const toPxX = (k: number): number => padL + ((k - kMin) / (kMax - kMin)) * plotW
    const toPxY = (freq: number): number => padT + plotH - ((freq - yMin) / (yMax - yMin)) * plotH

    const xLeftBZ = toPxX(-zoneEdge)
    const xRightBZ = toPxX(zoneEdge)
    const xZero = toPxX(0)

    // 1. Sfondo 1BZ
    ctx.save()
    ctx.fillStyle = withAlpha(quantityColor('a'), 0.06 * em('a'))
    ctx.fillRect(xLeftBZ, padT, xRightBZ - xLeftBZ, plotH)
    ctx.strokeStyle = withAlpha(quantityColor('a'), 0.6 * em('a'))
    ctx.lineWidth = lw('a', 1.1)
    ctx.setLineDash([4, 4])
    for (const bx of [xLeftBZ, xRightBZ]) {
      ctx.beginPath()
      ctx.moveTo(bx, padT)
      ctx.lineTo(bx, padT + plotH)
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.restore()

    // Assi
    ctx.strokeStyle = TOKENS.line
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padL + 0.5, padT)
    ctx.lineTo(padL + 0.5, padT + plotH)
    ctx.lineTo(padL + plotW, padT + plotH)
    ctx.moveTo(xZero, padT)
    ctx.lineTo(xZero, padT + plotH)
    ctx.stroke()

    // Tacche asse y
    const yStep = niceStep(yMax - yMin, 4)
    ctx.font = sansFont(10)
    ctx.fillStyle = TOKENS.muted
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let yv = 0; yv <= yMax + 1e-6; yv += yStep) {
      const py = toPxY(yv)
      if (py < padT + 8 || py > padT + plotH) continue
      ctx.strokeStyle = TOKENS.line
      ctx.beginPath()
      ctx.moveTo(padL - 3, py)
      ctx.lineTo(padL, py)
      ctx.stroke()
      ctx.fillText(formatNumber(yv, yStep < 1 ? 1 : 0), padL - 6, py)
    }

    drawRichText(ctx, s.umklappScene.yAxis, padL + 6, padT + 11, {
      color: quantityColor('omega'),
      size: 11,
      align: 'left',
      backdrop: TOKENS.bg
    })

    // Tacche asse x
    const xTicks: readonly { readonly frac: number; readonly label: string }[] = [
      { frac: -2, label: '-2π/a' },
      { frac: -1, label: '-π/a' },
      { frac: 0, label: '0' },
      { frac: 1, label: '+π/a' },
      { frac: 2, label: '+2π/a' }
    ]
    for (const xt of xTicks) {
      const tx = toPxX(xt.frac * zoneEdge)
      drawMathText(ctx, xt.label, tx, padT + plotH + 16, {
        color: Math.abs(xt.frac) === 1 ? quantityColor('a') : TOKENS.muted,
        size: 11,
        align: 'center'
      })
    }

    // 2. Curva ν(k): attenuata fuori 1BZ, piena dentro 1BZ
    const { k, freqThz } = model.curve
    const drawCurveSpan = (inside: boolean): void => {
      ctx.save()
      ctx.globalAlpha = em('omega') * (inside ? 1 : 0.28)
      ctx.strokeStyle = quantityColor('omega')
      ctx.lineWidth = lw('omega', inside ? 2.2 : 1.5)
      if (!inside) ctx.setLineDash([4, 3])
      ctx.beginPath()
      let drawing = false
      for (let i = 0; i < k.length; i++) {
        const inBZ = Math.abs(k[i]) <= zoneEdge + 1e-6
        if (inBZ !== inside) {
          drawing = false
          continue
        }
        const px = toPxX(k[i])
        const py = toPxY(freqThz[i])
        if (!drawing) {
          ctx.moveTo(px, py)
          drawing = true
        } else {
          ctx.lineTo(px, py)
        }
      }
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()
    }
    drawCurveSpan(false)
    drawCurveSpan(true)

    const occupied: RectBox[] = []
    // Riserva il riquadro di riepilogo flusso in alto a destra
    const dirLabel = (vg: number): string =>
      Math.abs(vg) < 1e-3 ? '0' : vg > 0 ? '→' : '←'
    const flowRich = `$v_{g}$: $k_{1}$ ${dirLabel(col.vg1Ms)} · $k_{2}$ ${dirLabel(col.vg2Ms)}  ⇒  $k_{3}$ ${dirLabel(col.vg3Ms)}`
    const fw = measureRichText(ctx, flowRich, { size: 10.5 }) + 14
    const fx = padL + plotW - fw - 4
    const fy = padT + 2
    occupied.push({ x0: fx, y0: fy, x1: fx + fw, y1: fy + 18 })

    // 3. Se Umklapp: punto fantasma k₁ + k₂ in zona estesa e freccia orizzontale −G → k₃
    const px3 = toPxX(col.k3)
    const py3 = toPxY(col.freq3Thz)
    if (isUmklapp) {
      const pxSum = toPxX(col.kSum)
      ctx.save()
      ctx.globalAlpha = em('a') * 0.9
      ctx.strokeStyle = quantityColor('a')
      ctx.fillStyle = quantityColor('a')
      ctx.lineWidth = lw('a', 1.6)
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(pxSum, py3)
      ctx.lineTo(px3, py3)
      ctx.stroke()
      ctx.setLineDash([])

      // Punta freccia su k3
      const dir = Math.sign(px3 - pxSum)
      ctx.beginPath()
      ctx.moveTo(px3, py3)
      ctx.lineTo(px3 - dir * 7, py3 - 3.8)
      ctx.lineTo(px3 - dir * 7, py3 + 3.8)
      ctx.closePath()
      ctx.fill()

      const gText = col.mG < 0 ? '-G = -2π/a' : '-G = +2π/a'
      const gx = xZero
      const gy = py3 - 8
      const gw = drawMathText(ctx, gText, gx, gy, {
        color: quantityColor('a'),
        size: 11,
        align: 'center',
        backdrop: TOKENS.bg
      })
      occupied.push({ x0: gx - gw / 2 - 4, y0: gy - 11, x1: gx + gw / 2 + 4, y1: gy + 4 })

      // Cerchio cavo in k₁ + k₂
      ctx.fillStyle = TOKENS.bg
      ctx.strokeStyle = quantityColor('Ek')
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.arc(pxSum, py3, 4.2, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
      const sumW = drawMathText(ctx, 'k_{1}+k_{2}', pxSum, py3 + 15, {
        color: quantityColor('Ek'),
        size: 10.5,
        align: 'center',
        backdrop: TOKENS.bg
      })
      occupied.push({ x0: pxSum - sumW / 2 - 3, y0: py3 + 4, x1: pxSum + sumW / 2 + 3, y1: py3 + 19 })
      ctx.restore()
    }

    // 4. Marcatori k₁, k₂, k₃ e frecce direzionali v_g
    const sxPerUnit = plotW / (kMax - kMin)
    const syPerUnit = plotH / (yMax - yMin)
    const tangentScale = 34

    const points: readonly {
      readonly label: string
      readonly kVal: number
      readonly fVal: number
      readonly slopeVg: number
      readonly vgMs: number
      readonly color: string
      readonly q: QuantityId
    }[] = [
      {
        label: 'k_{1}',
        kVal: col.k1,
        fVal: col.freq1Thz,
        slopeVg: col.slopeVg1ThzA,
        vgMs: col.vg1Ms,
        color: quantityColor('k'),
        q: 'k'
      },
      {
        label: 'k_{2}',
        kVal: col.k2,
        fVal: col.freq2Thz,
        slopeVg: col.slopeVg2ThzA,
        vgMs: col.vg2Ms,
        color: toneColor('lightLine'),
        q: 'k'
      },
      {
        label: 'k_{3}',
        kVal: col.k3,
        fVal: col.freq3Thz,
        slopeVg: col.slopeVg3ThzA,
        vgMs: col.vg3Ms,
        color: quantityColor('omega'),
        q: 'omega'
      }
    ]

    const curvePixels = Array.from({ length: k.length }, (_, i) => ({
      x: toPxX(k[i]),
      y: toPxY(freqThz[i])
    }))

    for (const pt of points) {
      const px = toPxX(pt.kVal)
      const py = toPxY(pt.fVal)

      // Freccia tangente di velocità di gruppo v_g (orientata nel verso fisico di v_g!)
      if (Math.abs(pt.vgMs) > 1e-3) {
        const vxPx = Math.sign(pt.vgMs) * sxPerUnit
        const vyPx = -Math.sign(pt.vgMs) * pt.slopeVg * syPerUnit
        const norm = Math.hypot(vxPx, vyPx) || 1
        ctx.save()
        ctx.globalAlpha = em('v')
        drawTangentArrow(
          ctx,
          px,
          py,
          (vxPx / norm) * tangentScale,
          (vyPx / norm) * tangentScale,
          quantityColor('v'),
          lw('v', 2.0)
        )
        ctx.restore()
      }

      // Pallino del modo
      ctx.save()
      ctx.globalAlpha = em(pt.q)
      ctx.fillStyle = pt.color
      ctx.strokeStyle = TOKENS.bg
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.arc(px, py, 4.6, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()

      const dirSym = Math.abs(pt.vgMs) < 1e-3 ? '·' : pt.vgMs > 0 ? '→' : '←'
      placeProbeLabel(ctx, {
        text: `${pt.label} (${dirSym})`,
        size: 11,
        color: pt.color,
        backdrop: TOKENS.bg,
        anchorX: px,
        anchorY: py,
        minX: padL + 2,
        maxX: padL + plotW - 2,
        minY: padT + 2,
        maxY: padT + plotH - 2,
        occupied,
        curvePoints: curvePixels
      })
      ctx.restore()
    }

    // 5. Riepilogo visivo del verso del flusso in alto a destra (formattato senza _ letterali)
    ctx.save()
    ctx.fillStyle = TOKENS.bg
    ctx.fillRect(fx, fy, fw, 18)
    ctx.strokeStyle = withAlpha(quantityColor('v'), 0.55 * em('v'))
    ctx.lineWidth = 1
    ctx.strokeRect(fx + 0.5, fy + 0.5, fw - 1, 17)
    drawRichText(ctx, flowRich, fx + fw / 2, fy + 13, {
      color: quantityColor('v'),
      size: 10.5,
      align: 'center'
    })
    ctx.restore()

    return false
  })

  return (
    <div className="phonon-q-view">
      <div className="phonon-q-bar">
        <ChartLegend entries={legend} ariaLabel={s.umklappScene.dispersionAria} />
      </div>
      <div className="phonon-q-stage">
        <canvas
          ref={canvasRef}
          className="phonon-q-canvas is-interactive"
          tabIndex={0}
          role="application"
          aria-label={s.umklappScene.dispersionAria}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  )
})
