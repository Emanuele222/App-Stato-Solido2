/**
 * Grafici collegati con asse dell'energia condiviso:
 *  - a sinistra: condizione di banda L(E) con fascia ombreggiata [-1, +1];
 *  - al centro (sulla spina di E(k)): tacche dei livelli «genitori» della buca isolata;
 *  - a destra: diagramma E(k) nella prima zona [-π/a, +π/a] con bande permesse, gap,
 *    banda a coseno Ē ∓ 2t·cos ka, reticolo vuoto, riempimento E_F, massa efficace m*.
 */
import { memo, useRef, type JSX, type KeyboardEvent, type PointerEvent } from 'react'
import {
  kronigPenneyStateFromEnergy,
  type BandStructure,
  type LCurveSample
} from '../../physics'
import { formatNumber } from '../../ui/format'
import { Smoothed, useReducedMotion } from '../../ui/motion'
import { quantityColor, TOKENS, type QuantityId } from '../../ui/theme'
import { drawMathText, niceStep, sansFont, useCanvasDraw, withAlpha } from '../../viz/canvas'
import type { KronigVariant } from './manifest'
import type { VariantModel } from './model'
import type { HighlightTarget } from './store'

export interface KronigBandsAndConditionPlotProps {
  readonly variant: KronigVariant
  readonly delta: VariantModel
  readonly rect: VariantModel
  readonly showCosine: boolean
  readonly showCompare: boolean
  readonly highlight: QuantityId | null
  readonly highlightTarget: HighlightTarget
  readonly onSelect: (kFrac: number, band: number) => void
  readonly onNudge: (dk: number, dBand: number) => void
  readonly labels: {
    readonly ariaLabel: string
    readonly energyAxis: string
    readonly kAxis: string
    readonly lAxisDelta: string
    readonly lAxisRect: string
    readonly bandsLegend: string
    readonly cosineLegend: string
    readonly compareLegend: string
    readonly gapLabel: string
    readonly metal: string
    readonly insulator: string
    readonly probe: string
    readonly wellLevelsBadge: string
  }
}

const MARGIN = { left: 54, right: 14, top: 14, bottom: 44 }
const L_RANGE: readonly [number, number] = [-2.2, 2.2]
const DIM = 0.25

interface RectBox {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

function splitLayout(w: number, h: number, topPad = MARGIN.top): {
  lBox: RectBox
  kBox: RectBox
  gutter: number
} {
  const totalW = Math.max(120, w - MARGIN.left - MARGIN.right)
  const gutter = Math.max(18, Math.min(26, Math.round(totalW * 0.045)))
  const wL = Math.max(78, Math.min(230, Math.round((totalW - gutter) * 0.31)))
  const wK = Math.max(120, totalW - gutter - wL)
  const H = Math.max(40, h - topPad - MARGIN.bottom)
  return {
    lBox: { x: MARGIN.left, y: topPad, w: wL, h: H },
    kBox: { x: MARGIN.left + wL + gutter, y: topPad, w: wK, h: H },
    gutter
  }
}

function boxesOverlap(a: RectBox, b: RectBox, pad = 2): boolean {
  return !(
    a.x + a.w + pad < b.x ||
    b.x + b.w + pad < a.x ||
    a.y + a.h + pad < b.y ||
    b.y + b.h + pad < a.y
  )
}

export const KronigBandsAndConditionPlot = memo(function KronigBandsAndConditionPlot(
  props: KronigBandsAndConditionPlotProps
): JSX.Element {
  const reduced = useReducedMotion()
  const activeInit = props.variant === 'rectangular' ? props.rect : props.delta
  const anim = useRef({
    mix: new Smoothed(props.variant === 'rectangular' ? 1 : 0, 0.14),
    eMin: new Smoothed(activeInit.eRange[0], 0.16),
    eMax: new Smoothed(activeInit.eRange[1], 0.16),
    kMin: new Smoothed(activeInit.kRange[0], 0.16),
    kMax: new Smoothed(activeInit.kRange[1], 0.16),
    cosine: new Smoothed(0, 0.12),
    compare: new Smoothed(0, 0.12),
    filling: new Smoothed(0, 0.12),
    fermi: new Smoothed(activeInit.filling?.fermiLevel ?? 0, 0.1),
    probe: new Smoothed(0, 0.12),
    topPad: new Smoothed(MARGIN.top, 0.14)
  }).current

  const dragging = useRef<'k' | 'L' | null>(null)

  const canvasRef = useCanvasDraw((ctx, { w, h }, dt) => {
    const p = props
    const active = p.variant === 'rectangular' ? p.rect : p.delta

    anim.mix.set(p.variant === 'rectangular' ? 1 : 0)
    anim.eMin.set(active.eRange[0])
    anim.eMax.set(active.eRange[1])
    anim.kMin.set(active.kRange[0])
    anim.kMax.set(active.kRange[1])
    anim.cosine.set(p.showCosine ? 1 : 0)
    anim.compare.set(p.showCompare || p.highlight === 'Ek' ? 1 : 0)
    anim.filling.set(active.filling ? 1 : 0)
    if (active.filling) anim.fermi.set(active.filling.fermiLevel, anim.filling.value < 0.02)
    anim.probe.set(active.probe ? 1 : 0)
    const legendWanted = p.showCosine || p.showCompare || p.highlight === 'Ek'
    const compactOutside = legendWanted && w < 640
    anim.topPad.set(compactOutside ? MARGIN.top + 22 : MARGIN.top)

    let moving = false
    for (const s of [
      anim.mix,
      anim.eMin,
      anim.eMax,
      anim.kMin,
      anim.kMax,
      anim.cosine,
      anim.compare,
      anim.filling,
      anim.fermi,
      anim.probe,
      anim.topPad
    ]) {
      moving = s.step(dt, reduced) || moving
    }

    const { lBox, kBox } = splitLayout(w, h, anim.topPad.value)
    const e0 = anim.eMin.value
    const e1 = anim.eMax.value
    const k0 = anim.kMin.value
    const k1 = anim.kMax.value
    const [l0, l1] = L_RANGE
    const mix = anim.mix.value

    const XL = (lv: number): number => lBox.x + ((lv - l0) / (l1 - l0)) * lBox.w
    const XK = (k: number): number => kBox.x + ((k - k0) / (k1 - k0)) * kBox.w
    const Y = (E: number): number => kBox.y + ((e1 - E) / (e1 - e0)) * kBox.h

    const em = (q: QuantityId): number => (p.highlight === null || p.highlight === q ? 1 : DIM)
    const emL = (): number => {
      if (p.highlight === null) return 1
      if (p.highlight === 'E') return 1
      return DIM
    }
    const lw = (q: QuantityId, base: number): number => (p.highlight === q ? base + 1.25 : base)

    // --- 1. Griglia energia condivisa su entrambi i riquadri ---
    const eStep = niceStep(e1 - e0, Math.max(3, Math.min(7, Math.round(kBox.h / 58))))
    ctx.font = sansFont(12)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let E = Math.ceil(e0 / eStep) * eStep; E <= e1 + 1e-9; E += eStep) {
      const y = Y(E)
      ctx.strokeStyle = Math.abs(E) < 1e-9 ? TOKENS.lineStrong : TOKENS.line
      ctx.lineWidth = 1
      const ry = Math.round(y) + 0.5
      ctx.beginPath()
      ctx.moveTo(lBox.x, ry)
      ctx.lineTo(lBox.x + lBox.w, ry)
      ctx.moveTo(kBox.x, ry)
      ctx.lineTo(kBox.x + kBox.w, ry)
      ctx.stroke()

      ctx.fillStyle = TOKENS.muted
      ctx.fillText(formatNumber(E, eStep < 1 ? 1 : 0), lBox.x - 8, y)
    }

    ctx.save()
    ctx.translate(14, kBox.y + kBox.h / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.globalAlpha = em('E')
    ctx.font = sansFont(12)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = quantityColor('E')
    ctx.fillText(p.labels.energyAxis, 0, 0)
    ctx.restore()

    // --- 2. Fascia |L| ≤ 1 e proiezione orizzontale delle bande permesse ---
    const xLm1 = XL(-1)
    const xLp1 = XL(1)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
    ctx.fillRect(xLm1, lBox.y, xLp1 - xLm1, lBox.h)

    // proiezione bande permesse su entrambi i riquadri (variante attiva, con leggera dissolvenza in morph)
    const kb = active.zoneEdge
    for (const edge of active.edges) {
      const yLo = Y(edge.lower)
      const yHi = Y(edge.upper)
      if (yLo < kBox.y || yHi > kBox.y + kBox.h) continue
      const yTop = Math.max(kBox.y, yHi)
      const yBot = Math.min(kBox.y + kBox.h, yLo)
      const bandH = Math.max(1.5, yBot - yTop)
      ctx.fillStyle = withAlpha(quantityColor('E'), 0.11)
      ctx.fillRect(xLm1, yTop, xLp1 - xLm1, bandH)
      ctx.fillStyle = withAlpha(quantityColor('E'), 0.065)
      ctx.fillRect(XK(-kb), yTop, XK(kb) - XK(-kb), bandH)
    }

    // fuori dalla prima zona in E(k)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)'
    ctx.fillRect(kBox.x, kBox.y, Math.max(0, XK(-kb) - kBox.x), kBox.h)
    ctx.fillRect(XK(kb), kBox.y, Math.max(0, kBox.x + kBox.w - XK(kb)), kBox.h)

    // rette verticali L = -1, 0, +1
    ctx.strokeStyle = TOKENS.lineStrong
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    for (const lv of [-1, 1]) {
      const xl = Math.round(XL(lv)) + 0.5
      ctx.beginPath()
      ctx.moveTo(xl, lBox.y)
      ctx.lineTo(xl, lBox.y + lBox.h)
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.strokeStyle = TOKENS.line
    ctx.beginPath()
    ctx.moveTo(Math.round(XL(0)) + 0.5, lBox.y)
    ctx.lineTo(Math.round(XL(0)) + 0.5, lBox.y + lBox.h)
    ctx.stroke()

    // assi inferiori dei due riquadri
    ctx.strokeStyle = TOKENS.dim
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(lBox.x, lBox.y + lBox.h + 0.5)
    ctx.lineTo(lBox.x + lBox.w, lBox.y + lBox.h + 0.5)
    ctx.moveTo(kBox.x, kBox.y + kBox.h + 0.5)
    ctx.lineTo(kBox.x + kBox.w, kBox.y + kBox.h + 0.5)
    // spina verticale sinistra di E(k) (asse dell'energia condiviso fra L ed E(k))
    ctx.moveTo(kBox.x + 0.5, kBox.y)
    ctx.lineTo(kBox.x + 0.5, kBox.y + kBox.h)
    ctx.stroke()

    // tacche asse L(E)
    ctx.font = sansFont(11.5)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    for (const lv of [-2, -1, 0, 1, 2]) {
      const lx = XL(lv)
      if (lx < lBox.x + 4 || lx > lBox.x + lBox.w - 4) continue
      ctx.strokeStyle = TOKENS.dim
      ctx.beginPath()
      ctx.moveTo(lx, lBox.y + lBox.h)
      ctx.lineTo(lx, lBox.y + lBox.h + 4)
      ctx.stroke()
      ctx.fillStyle = Math.abs(lv) === 1 ? TOKENS.textSoft : TOKENS.muted
      ctx.fillText(lv > 0 ? `+${lv}` : lv < 0 ? `−${Math.abs(lv)}` : '0', lx, lBox.y + lBox.h + 16)
    }
    ctx.globalAlpha = p.highlightTarget === 'L' ? 1 : emL()
    drawMathText(ctx, mix > 0.5 ? p.labels.lAxisRect : p.labels.lAxisDelta, XL(0), lBox.y + lBox.h + 35, {
      color: quantityColor('E'),
      align: 'center',
      size: 13.5
    })
    ctx.globalAlpha = 1

    // tacche asse k + bordi ±π/a
    const kStep = niceStep(k1 - k0, Math.max(2, Math.round(kBox.w / 100)))
    ctx.font = sansFont(11.5)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    const kTitleW = 52
    const xEdgeL = XK(-kb)
    const xEdgeR = XK(kb)
    for (let k = Math.ceil(k0 / kStep) * kStep; k <= k1 + 1e-9; k += kStep) {
      const x = XK(k)
      if (x < kBox.x + 6 || x > kBox.x + kBox.w - kTitleW) continue
      if (Math.abs(x - xEdgeL) < 16 || Math.abs(x - xEdgeR) < 16) continue
      ctx.strokeStyle = TOKENS.dim
      ctx.beginPath()
      ctx.moveTo(x, kBox.y + kBox.h)
      ctx.lineTo(x, kBox.y + kBox.h + 4)
      ctx.stroke()
      ctx.fillStyle = TOKENS.muted
      ctx.fillText(formatNumber(k, kStep < 1 ? 1 : 0), x, kBox.y + kBox.h + 16)
    }
    ctx.globalAlpha = em('k')
    ctx.fillStyle = quantityColor('k')
    ctx.textAlign = 'right'
    ctx.fillText(p.labels.kAxis, kBox.x + kBox.w, kBox.y + kBox.h + 16)
    ctx.globalAlpha = 1

    ctx.globalAlpha = em('a')
    ctx.strokeStyle = quantityColor('a')
    ctx.lineWidth = lw('a', 1.25)
    ctx.setLineDash([5, 5])
    for (const s of [-1, 1]) {
      const xz = XK(s * kb)
      if (xz >= kBox.x && xz <= kBox.x + kBox.w) {
        ctx.beginPath()
        ctx.moveTo(xz, kBox.y)
        ctx.lineTo(xz, kBox.y + kBox.h + 22)
        ctx.stroke()
      }
    }
    ctx.setLineDash([])
    drawMathText(ctx, '−π/a', XK(-kb), kBox.y + kBox.h + 36, { color: quantityColor('a'), align: 'center', size: 14 })
    drawMathText(ctx, 'π/a', XK(kb), kBox.y + kBox.h + 36, { color: quantityColor('a'), align: 'center', size: 14 })
    ctx.globalAlpha = 1

    // --- 3. Contenuto del grafico L(E) (ritagliato) ---
    ctx.save()
    ctx.beginPath()
    ctx.rect(lBox.x, lBox.y, lBox.w, lBox.h)
    ctx.clip()

    const traceLCurve = (samples: readonly LCurveSample[], alpha: number): void => {
      if (alpha <= 0.01 || samples.length < 2) return
      ctx.globalAlpha = alpha * (p.highlightTarget === 'L' ? 1 : emL())
      ctx.strokeStyle = quantityColor('E')
      ctx.lineWidth = p.highlightTarget === 'L' ? 3.2 : lw('E', 2)
      ctx.lineJoin = 'round'
      ctx.beginPath()
      const minX = lBox.x - 160
      const maxX = lBox.x + lBox.w + 160
      for (let i = 0; i < samples.length; i++) {
        const pt = samples[i]
        const px = Math.max(minX, Math.min(maxX, XL(pt.L)))
        const py = Y(pt.energy)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    traceLCurve(p.delta.lCurve, 1 - mix)
    traceLCurve(p.rect.lCurve, mix)

    // livello V₀ in L(E) (modalità rettangolare)
    if (mix > 0.05 && p.rect.spec.variant === 'rectangular') {
      const v0 = p.rect.spec.v0
      const yV0 = Y(v0)
      if (yV0 >= lBox.y && yV0 <= lBox.y + lBox.h) {
        ctx.globalAlpha = mix * em('VG') * 0.7
        ctx.strokeStyle = quantityColor('VG')
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(lBox.x, yV0)
        ctx.lineTo(lBox.x + lBox.w, yV0)
        ctx.stroke()
        ctx.setLineDash([])
        drawMathText(ctx, 'V_{0}', lBox.x + 6, yV0 - 5, {
          color: quantityColor('VG'),
          size: 12.5,
          backdrop: TOKENS.bg
        })
        ctx.globalAlpha = 1
      }
    }
    ctx.restore()

    // --- 4. Contenuto di E(k) (ritagliato) ---
    const occupiedBoxes: RectBox[] = []
    const hitsBox = (r: RectBox, pad = 2): boolean => occupiedBoxes.some((b) => boxesOverlap(b, r, pad))
    const selDotX = XK(active.selection.k)
    const selDotY = Y(active.selection.energy)
    if (selDotY >= kBox.y && selDotY <= kBox.y + kBox.h) {
      occupiedBoxes.push({ x: selDotX - 10, y: selDotY - 10, w: 20, h: 20 })
    }
    ctx.save()
    ctx.beginPath()
    ctx.rect(kBox.x, kBox.y, kBox.w, kBox.h)
    ctx.clip()

    // reticolo vuoto (confronto)
    const cmpAlpha = anim.compare.value
    if (cmpAlpha > 0.01) {
      ctx.globalAlpha = cmpAlpha * em('Ek')
      ctx.strokeStyle = quantityColor('Ek')
      ctx.lineWidth = lw('Ek', 1.35)
      ctx.setLineDash([4, 4])
      for (const n of visibleBands(active.emptyLattice, e1)) {
        traceBand(ctx, active.emptyLattice, n, XK, Y)
        ctx.stroke()
      }
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }

    // bande E_n(k) di Kronig–Penney (con morphing morbido in cambio variante)
    const fillAlpha = anim.filling.value
    const fermiY = Y(anim.fermi.value)
    const shown = visibleBands(active.bands, e1)

    const drawMorphBand = (n: number): void => {
      const ptsD = p.delta.bands.path.points
      const enD = p.delta.bands.energies[n]
      const ptsR = p.rect.bands.path.points
      const enR = p.rect.bands.energies[n]
      if (!enD || !enR) return
      const count = Math.min(ptsD.length, ptsR.length)
      ctx.beginPath()
      for (let i = 0; i < count; i++) {
        const kx = (1 - mix) * ptsD[i][0] + mix * ptsR[i][0]
        const ey = (1 - mix) * enD[i] + mix * enR[i]
        const px = XK(kx)
        const py = Y(ey)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
    }

    ctx.strokeStyle = quantityColor('E')
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.globalAlpha = (p.highlightTarget === 'L' ? DIM : em('E')) * (1 - 0.55 * fillAlpha)
    ctx.lineWidth = lw('E', 2.2)
    for (const n of shown) {
      drawMorphBand(n)
      ctx.stroke()
    }

    if (fillAlpha > 0.01) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(kBox.x, fermiY, kBox.w, kBox.y + kBox.h - fermiY)
      ctx.clip()
      ctx.globalAlpha = em('E') * fillAlpha
      ctx.lineWidth = lw('E', 4.2)
      for (const n of shown) {
        drawMorphBand(n)
        ctx.stroke()
      }
      ctx.restore()
    }
    ctx.globalAlpha = 1

    // banda a coseno Ē ∓ 2t·cos ka sulla banda selezionata
    if (anim.cosine.value > 0.01) {
      const cosCol = quantityColor('v')
      const cos = active.cosine
      ctx.globalAlpha = anim.cosine.value * (p.highlight === null || p.highlight === 'E' || p.highlight === 'v' ? 1 : DIM)
      ctx.strokeStyle = cosCol
      ctx.lineWidth = 2.2
      ctx.setLineDash([7, 4])
      ctx.beginPath()
      const segs = 120
      for (let i = 0; i <= segs; i++) {
        const k = -kb + (2 * kb * i) / segs
        const px = XK(k)
        const py = Y(cos.evalAt(k))
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }

    // legenda dentro kBox solo quando c'è spazio (altrimenti va fuori in alto sotto step 4b)
    if (!compactOutside && (anim.cosine.value > 0.05 || cmpAlpha > 0.05)) {
      ctx.globalAlpha = Math.max(anim.cosine.value, cmpAlpha)
      ctx.font = sansFont(11.5)
      const items: { text: string; color: string; dash: number[] }[] = [
        { text: p.labels.bandsLegend, color: quantityColor('E'), dash: [] }
      ]
      if (anim.cosine.value > 0.05) {
        items.push({ text: p.labels.cosineLegend, color: quantityColor('v'), dash: [6, 3] })
      }
      if (cmpAlpha > 0.05) {
        items.push({ text: p.labels.compareLegend, color: quantityColor('Ek'), dash: [4, 4] })
      }
      const boxW = Math.max(...items.map((it) => ctx.measureText(it.text).width)) + 36
      const boxH = items.length * 17 + 8
      const bx = kBox.x + kBox.w - boxW - 6
      const by = kBox.y + 6
      ctx.fillStyle = withAlpha(TOKENS.bg, 0.92)
      ctx.fillRect(bx, by, boxW, boxH)
      occupiedBoxes.push({ x: bx, y: by, w: boxW, h: boxH })
      items.forEach((it, i) => {
        const yy = by + 13 + i * 17
        ctx.strokeStyle = it.color
        ctx.lineWidth = 2
        ctx.setLineDash(it.dash)
        ctx.beginPath()
        ctx.moveTo(bx + 6, yy - 4)
        ctx.lineTo(bx + 26, yy - 4)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = TOKENS.textSoft
        ctx.textAlign = 'left'
        ctx.fillText(it.text, bx + 32, yy)
      })
      ctx.globalAlpha = 1
    }

    // livello di Fermi (prima dei gap e di m*, così ogni etichetta evita quelle già posate)
    if (active.filling && fillAlpha > 0.01) {
      const c = quantityColor('EF')
      ctx.globalAlpha = fillAlpha * em('EF')
      ctx.strokeStyle = c
      ctx.lineWidth = lw('EF', 1.5)
      ctx.setLineDash([8, 4])
      ctx.beginPath()
      ctx.moveTo(kBox.x, fermiY)
      ctx.lineTo(kBox.x + kBox.w, fermiY)
      ctx.stroke()
      ctx.setLineDash([])

      const kindLabel = active.filling.kind === 'insulator' ? p.labels.insulator : p.labels.metal
      const wF = drawMathText(ctx, 'E_{F}', -9999, -9999, { color: c, size: 14.5 })
      ctx.font = sansFont(11.5)
      const lwid = ctx.measureText(kindLabel).width
      const totalBadgeW = wF + lwid + 20
      const candidates: { fx: number; fy: number }[] = [
        { fx: kBox.x + 8, fy: Math.max(kBox.y + 18, Math.min(kBox.y + kBox.h - 6, fermiY - 6)) },
        { fx: kBox.x + 8, fy: Math.min(kBox.y + kBox.h - 6, fermiY + 15) },
        { fx: kBox.x + kBox.w - totalBadgeW - 6, fy: Math.max(kBox.y + 18, Math.min(kBox.y + kBox.h - 6, fermiY - 6)) },
        { fx: kBox.x + kBox.w - totalBadgeW - 6, fy: Math.min(kBox.y + kBox.h - 6, fermiY + 15) }
      ]
      const chosen =
        candidates.find((cd) => !hitsBox({ x: cd.fx - 2, y: cd.fy - 14, w: totalBadgeW, h: 18 })) ?? candidates[0]
      drawMathText(ctx, 'E_{F}', chosen.fx, chosen.fy, {
        color: c,
        size: 14.5,
        backdrop: TOKENS.bg
      })
      ctx.font = sansFont(11.5)
      ctx.fillStyle = withAlpha(TOKENS.bg, 0.92)
      ctx.fillRect(chosen.fx + 6 + wF, chosen.fy - 12, lwid + 8, 15)
      ctx.fillStyle = c
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(kindLabel, chosen.fx + 10 + wF, chosen.fy)
      occupiedBoxes.push({ x: chosen.fx - 2, y: chosen.fy - 14, w: totalBadgeW, h: 18 })
      ctx.globalAlpha = 1
    }

    // indicatori dei gap ai bordi ±π/a o al centro k = 0
    for (const g of active.gaps) {
      const yLo = Y(g.lower)
      const yHi = Y(g.upper)
      if (yLo < kBox.y || yHi > kBox.y + kBox.h) continue
      if (yLo - yHi < 2) continue
      const gx = XK(g.location === 'edge' ? kb : 0)
      const c = quantityColor('VG')
      ctx.globalAlpha = em('VG') * (mix < 0.05 || mix > 0.95 ? 1 : 0.4)
      ctx.strokeStyle = c
      ctx.lineWidth = lw('VG', 2.4)
      ctx.beginPath()
      ctx.moveTo(gx, yLo)
      ctx.lineTo(gx, yHi)
      ctx.moveTo(gx - 4, yLo)
      ctx.lineTo(gx + 4, yLo)
      ctx.moveTo(gx - 4, yHi)
      ctx.lineTo(gx + 4, yHi)
      ctx.stroke()

      if (yLo - yHi > 12) {
        const lbl = `${p.labels.gapLabel}${' '}`.trim()
        const tag = `${lbl}_{${g.index + 1}}`
        const wTag = drawMathText(ctx, tag, -9999, -9999, { color: c, size: 13 }) + 2
        const yMid = (yLo + yHi) / 2 + 5
        const prefRight = kBox.x + kBox.w - gx > wTag + 14
        const sides: ('left' | 'right')[] = prefRight ? ['left', 'right'] : ['right', 'left']
        const yOffsets = [0, -11, 11]
        let placed = false
        for (const dy of yOffsets) {
          for (const align of sides) {
            const tx = align === 'left' ? gx + 7 : gx - 7
            const ty = yMid + dy
            if (ty - 13 < kBox.y + 2 || ty + 2 > kBox.y + kBox.h - 2) continue
            const bx = align === 'left' ? tx : tx - wTag
            if (bx < kBox.x + 2 || bx + wTag > kBox.x + kBox.w - 2) continue
            const box: RectBox = { x: bx, y: ty - 13, w: wTag, h: 15 }
            if (!hitsBox(box)) {
              drawMathText(ctx, tag, tx, ty, { color: c, align, size: 13, backdrop: TOKENS.bg })
              occupiedBoxes.push(box)
              placed = true
              break
            }
          }
          if (placed) break
        }
      }
    }
    ctx.globalAlpha = 1

    // sonda di massa efficace (parabola osculatrice)
    if (active.probe && anim.probe.value > 0.01) {
      const pr = active.probe
      const sel = active.selection
      const c = quantityColor('mstar')
      ctx.globalAlpha = anim.probe.value * em('mstar')
      ctx.strokeStyle = c
      ctx.lineWidth = lw('mstar', 2)
      const bend = Math.abs(0.5 * pr.curvature)
      const span = Math.min(0.42 * kb, bend > 0 ? Math.sqrt((0.25 * (e1 - e0)) / bend) : Infinity)
      ctx.beginPath()
      for (let i = 0; i <= 60; i++) {
        const dk = -span + (2 * span * i) / 60
        const px = XK(sel.k + dk)
        const py = Y(sel.energy + pr.slope * dk + 0.5 * pr.curvature * dk * dk)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()

      const prefSide = sel.k > 0 ? -1 : 1
      const wProbe = drawMathText(ctx, p.labels.probe, -9999, -9999, { color: c, size: 13.5 }) + 2
      const probeTries: { side: -1 | 1; dy: number }[] = [
        { side: prefSide, dy: 5 },
        { side: prefSide, dy: -11 },
        { side: (-prefSide) as -1 | 1, dy: 5 },
        { side: (-prefSide) as -1 | 1, dy: -11 }
      ]
      for (const tr of probeTries) {
        const dkTip = tr.side * span
        const tipY = Y(sel.energy + pr.slope * dkTip + 0.5 * pr.curvature * dkTip * dkTip)
        const tx = XK(sel.k + dkTip) + tr.side * 6
        const ty = Math.max(kBox.y + 16, Math.min(kBox.y + kBox.h - 6, tipY + tr.dy))
        const align = tr.side < 0 ? 'right' : 'left'
        const bx = align === 'right' ? tx - wProbe : tx
        if (bx < kBox.x + 2 || bx + wProbe > kBox.x + kBox.w - 2) continue
        const box: RectBox = { x: bx, y: ty - 13, w: wProbe, h: 15 }
        if (!hitsBox(box)) {
          drawMathText(ctx, p.labels.probe, tx, ty, {
            color: c,
            size: 13.5,
            backdrop: TOKENS.bg,
            align
          })
          occupiedBoxes.push(box)
          break
        }
      }
      ctx.globalAlpha = 1
    }

    ctx.restore() // fine clip kBox

    // --- 4b. Legenda compatta fuori dall'area delle curve (spazio stretto / 800 px) ---
    if (compactOutside && (anim.cosine.value > 0.05 || cmpAlpha > 0.05)) {
      ctx.globalAlpha = Math.max(anim.cosine.value, cmpAlpha)
      ctx.font = sansFont(11)
      const items: { text: string; color: string; dash: number[] }[] = [
        { text: p.labels.bandsLegend, color: quantityColor('E'), dash: [] }
      ]
      if (anim.cosine.value > 0.05) {
        items.push({ text: p.labels.cosineLegend, color: quantityColor('v'), dash: [6, 3] })
      }
      if (cmpAlpha > 0.05) {
        items.push({ text: p.labels.compareLegend, color: quantityColor('Ek'), dash: [4, 4] })
      }
      const gap = 12
      const itemWidths = items.map((it) => 22 + ctx.measureText(it.text).width)
      const totalLegW = itemWidths.reduce((s, x) => s + x, 0) + gap * (items.length - 1)
      let lx = Math.max(lBox.x, kBox.x + kBox.w - totalLegW)
      const ly = 16
      items.forEach((it, i) => {
        ctx.strokeStyle = it.color
        ctx.lineWidth = 2
        ctx.setLineDash(it.dash)
        ctx.beginPath()
        ctx.moveTo(lx, ly - 4)
        ctx.lineTo(lx + 18, ly - 4)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = TOKENS.textSoft
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
        ctx.fillText(it.text, lx + 22, ly)
        lx += itemWidths[i] + gap
      })
      ctx.globalAlpha = 1
    }

    // --- 5. Livelli «genitori» della buca finita isolata sulla spina condivisa ---
    if (mix > 0.05 && p.rect.wellLevels.length > 0) {
      const parentCol = quantityColor('V2G')
      ctx.globalAlpha = mix * (p.highlight === null || p.highlight === 'VG' || p.highlight === 'V2G' ? 1 : DIM)
      for (const lv of p.rect.wellLevels) {
        const y = Y(lv.energy)
        if (y < kBox.y || y > kBox.y + kBox.h) continue

        // proiezione orizzontale dal livello isolato attraverso |L| ≤ 1 e dentro la propria banda in E(k)
        ctx.strokeStyle = withAlpha(parentCol, 0.52)
        ctx.lineWidth = 1
        ctx.setLineDash([2, 3])
        ctx.beginPath()
        ctx.moveTo(xLm1, y)
        ctx.lineTo(xLp1, y)
        ctx.moveTo(kBox.x, y)
        ctx.lineTo(XK(kb), y)
        ctx.stroke()
        ctx.setLineDash([])

        // tacca marcata sull'asse dell'energia condiviso (spina sinistra di E(k))
        ctx.strokeStyle = parentCol
        ctx.lineWidth = 2.4
        ctx.beginPath()
        ctx.moveTo(kBox.x - 6, y)
        ctx.lineTo(kBox.x + 5, y)
        ctx.stroke()

        // etichetta E_n nel corridoio a sinistra di kBox (evitando sovrapposizioni)
        const lbl = `E_{${lv.index + 1}}`
        const lblBox: RectBox = { x: kBox.x - 23, y: y - 7, w: 16, h: 14 }
        if (!occupiedBoxes.some((b) => boxesOverlap(b, lblBox, 1))) {
          drawMathText(ctx, lbl, kBox.x - 8, y + 4, {
            color: parentCol,
            align: 'right',
            size: 11.5,
            backdrop: TOKENS.bg
          })
          occupiedBoxes.push(lblBox)
        }
      }
      ctx.globalAlpha = 1
    }

    // --- 6. Collegamento orizzontale stato scelto fra E(k) ed L(E) ---
    {
      const sel = active.selection
      const sxK = XK(sel.k)
      const sxL = XL(sel.L)
      const sy = Y(sel.energy)
      if (sy >= kBox.y && sy <= kBox.y + kBox.h) {
        // linea tratteggiata su k
        ctx.setLineDash([2, 4])
        ctx.globalAlpha = em('k')
        ctx.strokeStyle = quantityColor('k')
        ctx.lineWidth = lw('k', 1.25)
        ctx.beginPath()
        ctx.moveTo(sxK, kBox.y + kBox.h)
        ctx.lineTo(sxK, sy)
        ctx.stroke()

        // proiezione orizzontale condivisa da E(k) fino a (L(E), E)
        ctx.globalAlpha = em('E')
        ctx.strokeStyle = quantityColor('E')
        ctx.lineWidth = lw('E', 1.25)
        ctx.beginPath()
        if (sxL >= lBox.x && sxL <= lBox.x + lBox.w) {
          ctx.moveTo(sxL, sy)
          ctx.lineTo(sxK, sy)
        } else {
          ctx.moveTo(kBox.x, sy)
          ctx.lineTo(sxK, sy)
        }
        ctx.stroke()
        ctx.setLineDash([])
        ctx.globalAlpha = 1

        // pallino su E(k)
        ctx.fillStyle = TOKENS.bg
        ctx.strokeStyle = TOKENS.text
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(sxK, sy, 5.5, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()

        // pallino collegato su L(E)
        if (sxL >= lBox.x && sxL <= lBox.x + lBox.w) {
          ctx.fillStyle = TOKENS.bg
          ctx.strokeStyle = quantityColor('E')
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(sxL, sy, 4.5, 0, 2 * Math.PI)
          ctx.fill()
          ctx.stroke()
        }
      }
    }

    return moving
  })

  // --- Interazione puntatore su E(k) e su L(E) ---
  const pickAt = (e: PointerEvent<HTMLCanvasElement>, mode: 'down' | 'move'): void => {
    const p = props
    const active = p.variant === 'rectangular' ? p.rect : p.delta
    const canvas = e.currentTarget
    const r = canvas.getBoundingClientRect()
    const px = e.clientX - r.left
    const py = e.clientY - r.top
    const { lBox, kBox } = splitLayout(r.width, r.height, anim.topPad.value)
    const e0 = anim.eMin.value
    const e1 = anim.eMax.value

    if (mode === 'down') {
      if (px >= lBox.x && px <= lBox.x + lBox.w) dragging.current = 'L'
      else dragging.current = 'k'
    }

    if (dragging.current === 'L') {
      const energy = e1 - ((py - lBox.y) / lBox.h) * (e1 - e0)
      const hit = kronigPenneyStateFromEnergy(active.spec, energy, active.edges)
      if (!hit) return
      const sign = active.selection.kFrac < 0 ? -1 : 1
      p.onSelect(sign * hit.kFracAbs, hit.band)
      return
    }

    const [k0, k1] = [anim.kMin.value, anim.kMax.value]
    const kRaw = k0 + ((px - kBox.x) / kBox.w) * (k1 - k0)
    const k = Math.max(-active.zoneEdge, Math.min(active.zoneEdge, kRaw))
    let bestBand = 0
    let bestDist = Infinity
    active.bands.energies.forEach((en, n) => {
      const E = interpolateBand(active.bands, en, k)
      if (E > e1 + 0.05 * (e1 - e0)) return
      const y = kBox.y + ((e1 - E) / (e1 - e0)) * kBox.h
      const d = Math.abs(y - py)
      if (d < bestDist) {
        bestDist = d
        bestBand = n
      }
    })
    p.onSelect(k / active.zoneEdge, bestBand)
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
    props.onNudge(m[0], m[1])
  }

  return (
    <canvas
      ref={canvasRef}
      className="band-canvas"
      tabIndex={0}
      role="img"
      aria-label={props.labels.ariaLabel}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        pickAt(e, 'down')
      }}
      onPointerMove={(e) => {
        if (dragging.current) pickAt(e, 'move')
      }}
      onPointerUp={() => {
        dragging.current = null
      }}
      onPointerCancel={() => {
        dragging.current = null
      }}
      onKeyDown={onKeyDown}
    />
  )
})

function visibleBands(bands: BandStructure, e1: number): number[] {
  const out: number[] = []
  bands.energies.forEach((en, n) => {
    let lo = Infinity
    for (const v of en) lo = Math.min(lo, v)
    if (lo <= e1) out.push(n)
  })
  return out
}

function traceBand(
  ctx: CanvasRenderingContext2D,
  bands: BandStructure,
  n: number,
  XK: (k: number) => number,
  Y: (E: number) => number
): void {
  const pts = bands.path.points
  const en = bands.energies[n]
  ctx.beginPath()
  for (let i = 0; i < pts.length; i++) {
    const px = XK(pts[i][0])
    const py = Y(en[i])
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
}

function interpolateBand(bands: BandStructure, en: Float64Array, k: number): number {
  const pts = bands.path.points
  const n = pts.length
  if (k <= pts[0][0]) return en[0]
  if (k >= pts[n - 1][0]) return en[n - 1]
  let lo = 0
  let hi = n - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (pts[mid][0] <= k) lo = mid
    else hi = mid
  }
  const t = (k - pts[lo][0]) / (pts[hi][0] - pts[lo][0])
  return en[lo] + t * (en[hi] - en[lo])
}
