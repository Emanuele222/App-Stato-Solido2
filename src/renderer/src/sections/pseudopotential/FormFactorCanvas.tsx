/**
 * Seconda vista: «Fattore di forma v(q)».
 *  - Curva tratteggiata indicativa: modello empty-core di Ashcroft + schermatura di
 *    Thomas–Fermi (tipo Si), che parte dal limite metallico v(0) = −⅔ E_F verso 0.
 *  - I tre pallini in |G|² = 3, 8, 11 sono i parametri reali V₃ˢ, V₈ˢ, V₁₁ˢ (trascinabili
 *    in verticale e sincronizzati con gli slider e con la Formula viva).
 *  - Quando il termine antisimmetrico è acceso (GaAs), mostra anche i riferimenti Vᵃ.
 */
import { useRef, useState, type JSX, type PointerEvent } from 'react'
import { formatNumber } from '../../ui/format'
import { quantityColor, TOKENS, type QuantityId } from '../../ui/theme'
import { drawMathText, measureMathText, niceStep, sansFont, useCanvasDraw, withAlpha } from '../../viz/canvas'
import type { EpmFormFactors, FormFactorCurve } from '../../physics'
import { PARAMS, type FormFactorId } from './manifest'
import { strings as s } from './strings'

const MARGIN = { left: 48, right: 16, top: 18, bottom: 38 }
const Q2_MAX = 13.5
const V_MIN = -0.60
const V_MAX = 0.24
const DIM = 0.28

interface HandleDef {
  readonly id: FormFactorId
  readonly gSq: number
  readonly texLabel: string
  readonly value: number
}

export function FormFactorCanvas({
  curve,
  formFactors,
  antisymmetricOn,
  highlight,
  activeFactor,
  onDragParam,
  onActiveFactor
}: {
  readonly curve: FormFactorCurve
  readonly formFactors: EpmFormFactors
  readonly antisymmetricOn: boolean
  readonly highlight: QuantityId | null
  readonly activeFactor: FormFactorId | null
  readonly onDragParam: (id: FormFactorId, value: number) => void
  readonly onActiveFactor: (id: FormFactorId | null) => void
}): JSX.Element {
  const dragId = useRef<FormFactorId | null>(null)
  const [cursorStyle, setCursorStyle] = useState<'default' | 'ns-resize'>('default')

  const handles: readonly HandleDef[] = [
    { id: 'v3s', gSq: 3, texLabel: 'V_{3}ˢ', value: formFactors.v3s },
    { id: 'v8s', gSq: 8, texLabel: 'V_{8}ˢ', value: formFactors.v8s },
    { id: 'v11s', gSq: 11, texLabel: 'V_{11}ˢ', value: formFactors.v11s }
  ]

  const canvasRef = useCanvasDraw((ctx, { w, h }) => {
    const L = MARGIN.left
    const T = MARGIN.top
    const W = Math.max(40, w - MARGIN.left - MARGIN.right)
    const H = Math.max(40, h - MARGIN.top - MARGIN.bottom)

    const X = (q2: number): number => L + (q2 / Q2_MAX) * W
    const Y = (vRy: number): number => T + ((V_MAX - vRy) / (V_MAX - V_MIN)) * H

    const emMain = highlight === null || highlight === 'VG' || highlight === 'V2G' ? 1 : DIM
    const emEf = highlight === null || highlight === 'EF' || highlight === 'VG' ? 1 : DIM

    // Griglia orizzontale v(q) in Ry
    const stepV = niceStep(V_MAX - V_MIN, 4)
    ctx.font = sansFont(11)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let v = Math.ceil(V_MIN / stepV) * stepV; v <= V_MAX + 1e-9; v += stepV) {
      const py = Y(v)
      const isZero = Math.abs(v) < 1e-6
      ctx.strokeStyle = isZero ? TOKENS.lineStrong : TOKENS.line
      ctx.lineWidth = isZero ? 1.2 : 1
      ctx.beginPath()
      ctx.moveTo(L, Math.round(py) + 0.5)
      ctx.lineTo(L + W, Math.round(py) + 0.5)
      ctx.stroke()
      ctx.fillStyle = TOKENS.muted
      ctx.fillText(formatNumber(v, 1), L - 7, py)
    }

    // Asse verticale q² = 0 e tacche sui gusci fcc |G|² = 3, 4, 8, 11
    ctx.strokeStyle = TOKENS.lineStrong
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(L + 0.5, T)
    ctx.lineTo(L + 0.5, T + H)
    ctx.stroke()

    const shellTicks = antisymmetricOn ? [0, 3, 4, 8, 11] : [0, 3, 8, 11]
    ctx.font = sansFont(11)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    for (const g2 of shellTicks) {
      const px = X(g2)
      if (g2 > 0) {
        ctx.strokeStyle = withAlpha(TOKENS.lineStrong, 0.7)
        ctx.beginPath()
        ctx.moveTo(Math.round(px) + 0.5, T)
        ctx.lineTo(Math.round(px) + 0.5, T + H)
        ctx.stroke()
      }
      ctx.fillStyle = TOKENS.muted
      ctx.fillText(String(g2), px, T + H + 4)
    }
    drawMathText(ctx, '|q|^{2} / (2π/a)^{2}', L + W - 2, T + H + 26, {
      color: TOKENS.muted,
      size: 10.5,
      align: 'right',
      italic: false
    })
    drawMathText(ctx, 'Ry', L - 8, T - 4, {
      color: TOKENS.muted,
      size: 10.5,
      align: 'right',
      italic: false
    })

    // Curva indicativa di modello Ashcroft + Thomas–Fermi (tratteggiata)
    ctx.save()
    ctx.globalAlpha = emMain * 0.72
    ctx.setLineDash([6, 4])
    ctx.strokeStyle = TOKENS.textSoft
    ctx.lineWidth = 1.7
    ctx.beginPath()
    let started = false
    for (let i = 0; i < curve.qSqDimless.length; i++) {
      const q2 = curve.qSqDimless[i]
      if (q2 > Q2_MAX) break
      const px = X(q2)
      const py = Y(Math.max(V_MIN, Math.min(V_MAX, curve.vRy[i])))
      if (!started) {
        ctx.moveTo(px, py)
        started = true
      } else {
        ctx.lineTo(px, py)
      }
    }
    ctx.stroke()
    ctx.restore()

    // Punto limite metallico v(0) = −⅔ E_F: sotto-destra se possibile (evita la curva crescente)
    const yV0 = Y(Math.max(V_MIN, curve.v0Ry))
    const badgeW = measureMathText(ctx, s.scene.v0Badge, 10.5)
    const belowY = Math.min(T + H - 12, yV0 + 14)
    const aboveY = Math.max(T + 14, yV0 - 11)
    let curveHitsBelow = 0
    for (let i = 0; i < curve.qSqDimless.length; i++) {
      if (curve.qSqDimless[i] > 3.5) break
      const cx = X(curve.qSqDimless[i])
      const cy = Y(Math.max(V_MIN, Math.min(V_MAX, curve.vRy[i])))
      if (cx >= X(0) + 4 && cx <= X(0) + 12 + badgeW && cy >= belowY - 12 && cy <= belowY + 4) curveHitsBelow++
    }
    const v0LabelY = curveHitsBelow === 0 ? belowY : aboveY
    ctx.save()
    ctx.globalAlpha = emEf
    ctx.fillStyle = quantityColor('EF')
    ctx.beginPath()
    ctx.arc(X(0), yV0, 4.2, 0, Math.PI * 2)
    ctx.fill()
    drawMathText(ctx, s.scene.v0Badge, X(0) + 8, v0LabelY, {
      color: quantityColor('EF'),
      size: 10.5,
      align: 'left',
      backdrop: TOKENS.bg
    })
    ctx.restore()

    // Riferimenti antisimmetrici Vᵃ (diamanti) quando il toggle GaAs è attivo
    const vaCol = quantityColor('V2G')
    if (antisymmetricOn) {
      const vaPoints = [
        { gSq: 3, val: formFactors.v3a, label: 'V_{3}^{a}', align: 'right' as const, dx: -7, dy: 4 },
        { gSq: 4, val: formFactors.v4a, label: 'V_{4}^{a}', align: 'left' as const, dx: 7, dy: 4 },
        { gSq: 11, val: formFactors.v11a, label: 'V_{11}^{a}', align: 'right' as const, dx: -7, dy: 4 }
      ]
      ctx.save()
      ctx.globalAlpha = highlight === null || highlight === 'V2G' ? 0.92 : DIM
      for (const vp of vaPoints) {
        const px = X(vp.gSq)
        const py = Y(vp.val)
        ctx.fillStyle = TOKENS.bg
        ctx.strokeStyle = vaCol
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(px, py - 5)
        ctx.lineTo(px + 5, py)
        ctx.lineTo(px, py + 5)
        ctx.lineTo(px - 5, py)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        drawMathText(ctx, vp.label, px + vp.dx, py + vp.dy, {
          color: vaCol,
          size: 10,
          align: vp.align,
          backdrop: TOKENS.bg
        })
      }
      ctx.restore()
    }

    // I tre parametri reali trascinabili V₃ˢ, V₈ˢ, V₁₁ˢ
    const vgCol = quantityColor('VG')
    for (const hDef of handles) {
      const isActive = activeFactor === hDef.id
      const isEm = isActive || (activeFactor === null && (highlight === null || highlight === 'VG'))
      const px = X(hDef.gSq)
      const py = Y(hDef.value)
      const yZero = Y(0)

      ctx.save()
      ctx.globalAlpha = isEm ? 1 : 0.42
      // Stelo verticale da v = 0 al valore del parametro
      ctx.strokeStyle = withAlpha(vgCol, isActive ? 0.9 : 0.55)
      ctx.lineWidth = isActive ? 2.2 : 1.5
      ctx.beginPath()
      ctx.moveTo(px, yZero)
      ctx.lineTo(px, py)
      ctx.stroke()

      if (isActive) {
        ctx.fillStyle = withAlpha(vgCol, 0.25)
        ctx.beginPath()
        ctx.arc(px, py, 10, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.fillStyle = vgCol
      ctx.strokeStyle = TOKENS.bg
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.arc(px, py, isActive ? 6.5 : 5.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      const labelY = hDef.value < -0.05 ? py - 12 : py - 12
      drawMathText(ctx, `${hDef.texLabel}`, px, labelY, {
        color: vgCol,
        size: 11.5,
        align: 'center',
        backdrop: TOKENS.bg
      })
      ctx.restore()
    }

    // (la legenda sta fuori dal grafico: riga HTML sotto il titolo della vista)

    return false
  })

  const locateHandle = (e: PointerEvent<HTMLCanvasElement>): HandleDef | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const W = Math.max(40, rect.width - MARGIN.left - MARGIN.right)
    const H = Math.max(40, rect.height - MARGIN.top - MARGIN.bottom)
    let best: HandleDef | null = null
    let bestDist = 20
    for (const hDef of handles) {
      const hx = MARGIN.left + (hDef.gSq / Q2_MAX) * W
      const hy = MARGIN.top + ((V_MAX - hDef.value) / (V_MAX - V_MIN)) * H
      const d = Math.hypot(px - hx, py - hy)
      if (d < bestDist) {
        bestDist = d
        best = hDef
      }
    }
    return best
  }

  const applyDragAtY = (e: PointerEvent<HTMLCanvasElement>, id: FormFactorId): void => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const py = e.clientY - rect.top
    const H = Math.max(40, rect.height - MARGIN.top - MARGIN.bottom)
    const rawV = V_MAX - ((py - MARGIN.top) / H) * (V_MAX - V_MIN)
    const spec = PARAMS.find((p) => p.id === id)
    if (!spec) return
    const clamped = Math.min(spec.max, Math.max(spec.min, rawV))
    onDragParam(id, clamped)
  }

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>): void => {
    const hit = locateHandle(e)
    if (!hit) return
    dragId.current = hit.id
    onActiveFactor(hit.id)
    e.currentTarget.setPointerCapture(e.pointerId)
    applyDragAtY(e, hit.id)
  }

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>): void => {
    if (dragId.current) {
      applyDragAtY(e, dragId.current)
      return
    }
    const hit = locateHandle(e)
    onActiveFactor(hit?.id ?? null)
    setCursorStyle(hit ? 'ns-resize' : 'default')
  }

  const onPointerUp = (e: PointerEvent<HTMLCanvasElement>): void => {
    if (dragId.current) {
      e.currentTarget.releasePointerCapture(e.pointerId)
      dragId.current = null
      setCursorStyle('default')
    }
  }

  const onPointerLeave = (): void => {
    if (!dragId.current) {
      onActiveFactor(null)
      setCursorStyle('default')
    }
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ cursor: cursorStyle, touchAction: 'none' }}
      role="img"
      aria-label={s.scene.formAria}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerLeave}
    />
  )
}
