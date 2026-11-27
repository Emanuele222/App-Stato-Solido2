/**
 * Vista 1 della Modalità B — Schema vettoriale interattivo nella 1BZ (−π/a, π/a]:
 * mostra i vettori k₁, k₂ testa-coda, la somma k₁ + k₂, l'eventuale scatto del
 * vettore reciproco G = ∓2π/a (processo Umklapp) e il risultante k₃ ∈ (−π/a, π/a].
 * Supporta trascinamento diretto delle punte di k₁ e k₂ sul canvas e frecce tastiera.
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
import { drawMathText, sansFont, useCanvasDraw, withAlpha } from '../../viz/canvas'
import type { UmklappModel } from './model'
import { strings as s } from './strings'
import './phonon-quantum.css'

export interface Umklapp1BZViewProps {
  readonly model: UmklappModel
  readonly highlight: QuantityId | null
  readonly onChangeK: (which: 'k1' | 'k2', kFrac: number) => void
  readonly onNudge: (which: 'k1' | 'k2', dx: number) => void
}

const DIM = 0.26
const K_AXIS_MAX = 2.15

function drawHorizontalArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
  headLen = 7
): void {
  const dx = x2 - x1
  const len = Math.abs(dx)
  if (len < 2) {
    ctx.beginPath()
    ctx.arc(x1, y, 2.5, 0, 2 * Math.PI)
    ctx.fill()
    return
  }
  const dir = Math.sign(dx)
  const hl = Math.min(headLen, len * 0.45)
  const hw = hl * 0.56
  const bx = x2 - dir * hl

  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(bx, y)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x2, y)
  ctx.lineTo(bx, y - hw)
  ctx.lineTo(bx, y + hw)
  ctx.closePath()
  ctx.fill()
}

export const Umklapp1BZView = memo(function Umklapp1BZView({
  model,
  highlight,
  onChangeK,
  onNudge
}: Umklapp1BZViewProps): JSX.Element {
  const dragTargetRef = useRef<'k1' | 'k2' | null>(null)
  const activeKeyTargetRef = useRef<'k1' | 'k2'>('k2')
  const layoutRef = useRef<{
    padL: number
    plotW: number
    y1: number
    y2: number
  }>({ padL: 28, plotW: 400, y1: 40, y2: 72 })

  const col = model.collision
  const isUmklapp = col.kind === 'umklapp'

  const legend = useMemo<readonly LegendEntry[]>(() => {
    const entries: LegendEntry[] = [
      { id: 'k1', keyKind: 'solid', color: 'var(--q-k)', label: <RichText text={s.umklappScene.legendK1} /> },
      {
        id: 'k2',
        keyKind: 'solid',
        color: 'var(--tone-light-line)',
        label: <RichText text={s.umklappScene.legendK2} />
      },
      { id: 'k3', keyKind: 'solid', color: 'var(--q-omega)', label: <RichText text={s.umklappScene.legendK3} /> }
    ]
    if (isUmklapp) {
      entries.push(
        { id: 'ksum', keyKind: 'dashed', color: 'var(--q-Ek)', label: <RichText text={s.umklappScene.legendKSum} /> },
        { id: 'g', keyKind: 'solid', color: 'var(--q-a)', label: <RichText text={s.umklappScene.legendG} /> }
      )
    }
    return entries
  }, [isUmklapp])

  const pxToKFrac = useCallback((clientX: number, rect: DOMRect): number => {
    const { padL, plotW } = layoutRef.current
    const x = clientX - rect.left
    return ((x - padL) / plotW) * (2 * K_AXIS_MAX) - K_AXIS_MAX
  }, [])

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const { y1, y2 } = layoutRef.current
      const py = e.clientY - rect.top
      const kAt = pxToKFrac(e.clientX, rect)

      // Scegli k1 se più vicino alla riga 1 o alla punta k1; altrimenti k2
      const distRow1 = Math.abs(py - y1)
      const distRow2 = Math.abs(py - y2)
      const distTip1 = Math.abs(kAt - col.k1Frac)
      const distTip2 = Math.abs(kAt - col.kSumFrac)

      const target: 'k1' | 'k2' =
        distRow1 < distRow2 - 6 || (Math.abs(distRow1 - distRow2) <= 10 && distTip1 < distTip2)
          ? 'k1'
          : 'k2'

      dragTargetRef.current = target
      activeKeyTargetRef.current = target
      e.currentTarget.setPointerCapture(e.pointerId)

      if (target === 'k1') {
        onChangeK('k1', kAt)
      } else {
        onChangeK('k2', kAt - col.k1Frac)
      }
    },
    [col.k1Frac, col.kSumFrac, onChangeK, pxToKFrac]
  )

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      const target = dragTargetRef.current
      if (!target) return
      const rect = e.currentTarget.getBoundingClientRect()
      const kAt = pxToKFrac(e.clientX, rect)
      if (target === 'k1') {
        onChangeK('k1', kAt)
      } else {
        onChangeK('k2', kAt - col.k1Frac)
      }
    },
    [col.k1Frac, onChangeK, pxToKFrac]
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
      } else if (e.key === '1') {
        activeKeyTargetRef.current = 'k1'
      } else if (e.key === '2') {
        activeKeyTargetRef.current = 'k2'
      }
    },
    [onNudge]
  )

  const canvasRef = useCanvasDraw((ctx, { w, h }) => {
    const em = (q: QuantityId): number => (highlight === null || highlight === q ? 1 : DIM)
    const lw = (q: QuantityId, base: number): number => (highlight === q ? base + 1.1 : base)

    const padL = 22
    const padR = 22
    const padT = 18
    const padB = 22
    const plotW = Math.max(120, w - padL - padR)
    const plotH = Math.max(48, h - padT - padB)

    const toPxX = (kFrac: number): number => padL + ((kFrac + K_AXIS_MAX) / (2 * K_AXIS_MAX)) * plotW

    const xLeftBZ = toPxX(-1)
    const xRightBZ = toPxX(1)
    const xZero = toPxX(0)

    const y1 = padT + plotH * 0.14
    const y2 = padT + plotH * 0.39
    const y3 = padT + plotH * 0.64
    const y4 = padT + plotH * 0.87
    layoutRef.current = { padL, plotW, y1, y2 }

    // 1. Sfondo 1BZ (−π/a, π/a] e zone estese attenuate
    ctx.save()
    ctx.fillStyle = withAlpha(quantityColor('a'), 0.08 * em('a'))
    ctx.fillRect(xLeftBZ, padT, xRightBZ - xLeftBZ, plotH)

    ctx.strokeStyle = withAlpha(quantityColor('a'), 0.72 * em('a'))
    ctx.lineWidth = lw('a', 1.2)
    ctx.setLineDash([4, 4])
    for (const bx of [xLeftBZ, xRightBZ]) {
      ctx.beginPath()
      ctx.moveTo(bx, padT)
      ctx.lineTo(bx, padT + plotH)
      ctx.stroke()
    }
    ctx.setLineDash([])

    // Origine k = 0
    ctx.strokeStyle = TOKENS.lineStrong
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(xZero, padT)
    ctx.lineTo(xZero, padT + plotH)
    ctx.stroke()
    ctx.restore()

    // Etichette discrete delle zone sopra l'area vettori (mai sovrapposte a k₁ né ai bordi)
    ctx.font = sansFont(10)
    ctx.textBaseline = 'bottom'
    ctx.fillStyle = withAlpha(quantityColor('a'), 0.85 * em('a'))
    ctx.textAlign = 'center'
    ctx.fillText(xRightBZ - xLeftBZ > 195 ? '1ª zona di Brillouin (1BZ)' : '1BZ', xZero, padT - 4)
    if (xLeftBZ - padL > 72) {
      ctx.fillStyle = TOKENS.dim
      ctx.fillText('zona estesa', (padL + xLeftBZ) / 2, padT - 4)
      ctx.fillText('zona estesa', (xRightBZ + padL + plotW) / 2, padT - 4)
    }

    // 2. Asse inferiore in unità di π/a
    const axisY = padT + plotH
    ctx.strokeStyle = TOKENS.line
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padL, axisY)
    ctx.lineTo(padL + plotW, axisY)
    ctx.stroke()

    const ticks: readonly { readonly k: number; readonly label: string }[] = [
      { k: -2, label: '-2π/a' },
      { k: -1, label: '-π/a' },
      { k: 0, label: '0' },
      { k: 1, label: '+π/a' },
      { k: 2, label: '+2π/a' }
    ]
    for (const t of ticks) {
      const tx = toPxX(t.k)
      ctx.strokeStyle = Math.abs(t.k) === 1 ? quantityColor('a') : TOKENS.lineStrong
      ctx.beginPath()
      ctx.moveTo(tx, axisY)
      ctx.lineTo(tx, axisY + 3.5)
      ctx.stroke()
      drawMathText(ctx, t.label, tx, axisY + 14.5, {
        color: Math.abs(t.k) === 1 ? quantityColor('a') : TOKENS.muted,
        size: 10.5,
        align: 'center'
      })
    }

    // 3. Vettori k₁, k₂, somma, G, k₃
    const pxK1 = toPxX(col.k1Frac)
    const pxKSum = toPxX(col.kSumFrac)
    const pxK3 = toPxX(col.k3Frac)

    // Linea verticale di caduta alla somma grezza k₁ + k₂
    ctx.save()
    ctx.globalAlpha = 0.45
    ctx.strokeStyle = quantityColor('Ek')
    ctx.lineWidth = 1
    ctx.setLineDash([2, 3])
    ctx.beginPath()
    ctx.moveTo(pxKSum, y2)
    ctx.lineTo(pxKSum, isUmklapp ? y3 : y4)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()

    // Riga 1: k₁ da 0 a k₁
    ctx.save()
    ctx.globalAlpha = em('k')
    ctx.strokeStyle = quantityColor('k')
    ctx.fillStyle = quantityColor('k')
    ctx.lineWidth = lw('k', 2.4)
    drawHorizontalArrow(ctx, xZero, pxK1, y1, 7)
    // Maniglia interattiva k₁
    ctx.fillStyle = TOKENS.bg
    ctx.beginPath()
    ctx.arc(pxK1, y1, 4.2, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
    drawMathText(
      ctx,
      `k_{1} = ${formatNumber(col.k1Frac, 2)} π/a`,
      (xZero + pxK1) / 2,
      y1 - 8,
      { color: quantityColor('k'), size: 11.5, align: 'center', backdrop: TOKENS.bg }
    )
    ctx.restore()

    // Riga 2: k₂ testa-coda da k₁ a k₁ + k₂
    const colK2 = toneColor('lightLine')
    ctx.save()
    ctx.globalAlpha = em('k')
    ctx.strokeStyle = colK2
    ctx.fillStyle = colK2
    ctx.lineWidth = lw('k', 2.4)
    drawHorizontalArrow(ctx, pxK1, pxKSum, y2, 7)
    // Maniglia interattiva k₂
    ctx.fillStyle = TOKENS.bg
    ctx.beginPath()
    ctx.arc(pxKSum, y2, 4.2, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
    drawMathText(
      ctx,
      `k_{2} = ${formatNumber(col.k2Frac, 2)} π/a`,
      (pxK1 + pxKSum) / 2,
      y2 - 8,
      { color: colK2, size: 11.5, align: 'center', backdrop: TOKENS.bg }
    )
    ctx.restore()

    // Riga 3: somma grezza (se Umklapp) + scatto −G (Fig. 19b)
    if (isUmklapp) {
      ctx.save()
      ctx.globalAlpha = em('a')
      ctx.strokeStyle = quantityColor('a')
      ctx.fillStyle = quantityColor('a')
      ctx.lineWidth = lw('a', 2.1)
      drawHorizontalArrow(ctx, pxKSum, pxK3, y3, 7.5)
      const gLabel = col.mG < 0 ? '-G = -2π/a' : '-G = +2π/a'
      drawMathText(ctx, gLabel, (pxKSum + pxK3) / 2, y3 - 8, {
        color: quantityColor('a'),
        size: 11.5,
        align: 'center',
        backdrop: TOKENS.bg
      })
      ctx.restore()
    } else {
      ctx.save()
      ctx.font = sansFont(10.5)
      ctx.fillStyle = TOKENS.dim
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('k₁ + k₂ resta dentro la 1BZ ⇒ G = 0', xZero, y3)
      ctx.restore()
    }

    // Riga 4: risultante k₃ = k₁ + k₂ + G
    ctx.save()
    ctx.globalAlpha = em('omega')
    ctx.strokeStyle = quantityColor('omega')
    ctx.fillStyle = quantityColor('omega')
    ctx.lineWidth = lw('omega', 2.6)
    drawHorizontalArrow(ctx, xZero, pxK3, y4, 8)
    const k3Label = `k_{3} = ${formatNumber(col.k3Frac, 2)} π/a`
    drawMathText(ctx, k3Label, (xZero + pxK3) / 2, y4 - 8, {
      color: quantityColor('omega'),
      size: 11.5,
      align: 'center',
      backdrop: TOKENS.bg
    })
    ctx.restore()

    return false
  })

  const badgeClass =
    'phonon-q-status-pill ' + (isUmklapp ? 'is-umklapp' : 'is-normal')
  const badgeText = !isUmklapp
    ? s.umklappScene.badgeNormal
    : col.flowReversed
      ? s.umklappScene.badgeUmklappReversed
      : s.umklappScene.badgeUmklapp

  return (
    <div className="phonon-q-view phonon-q-umklapp-stage">
      <div className="phonon-q-bar">
        <ChartLegend entries={legend} ariaLabel={s.umklappScene.zoneAria} />
        <span className={badgeClass}>{badgeText}</span>
      </div>
      <div className="phonon-q-stage">
        <canvas
          ref={canvasRef}
          className="phonon-q-canvas is-draggable"
          tabIndex={0}
          role="application"
          aria-label={s.umklappScene.zoneAria}
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
