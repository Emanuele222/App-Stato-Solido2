/**
 * Diagramma E(k) del reticolo vuoto nei tre schemi di zona (estesa, ridotta,
 * periodica) su Canvas 2D:
 * - assi assoluti (k in Å⁻¹, E in eV), con i bordi di zona ±π/a, ±2π/a, ±3π/a
 *   che si muovono cambiando a;
 * - transizione animata continua fra gli schemi (ogni tratto della parabola
 *   trasla orizzontalmente di −G nella prima zona, o si replica di ±pG);
 * - stato scelto mostrato in tutti gli schemi (k esteso, k′ ridotto, freccia −G);
 * - strumenti trasversali: riempimento (E_F), massa efficace (m* = m₀),
 *   confronto con gli elettroni quasi liberi (V_G = −0,5 eV).
 */
import { memo, useRef, type JSX, type KeyboardEvent, type PointerEvent } from 'react'
import {
  freeElectronEnergy,
  freeElectronWaveNumber,
  type BandStructure,
  type DirectGap,
  type ZoneFoldingSegment
} from '../../physics'
import { formatNumber } from '../../ui/format'
import { easeInOutCubic, Smoothed, useReducedMotion } from '../../ui/motion'
import { quantityColor, TOKENS, type QuantityId } from '../../ui/theme'
import {
  boxesOverlap,
  drawMathText,
  drawRichText,
  drawSegmentedHorizontalLine,
  measureMathText,
  measureRichText,
  niceStep,
  placeGapLabelBox,
  placeProbeLabel,
  sansFont,
  useCanvasDraw,
  withAlpha,
  type RectBox,
  type XSpan
} from '../../viz/canvas'
import { NUMERICS, type ZoneScheme } from './manifest'
import type { HighlightTarget } from './store'

export interface ZoneSchemesPlotProps {
  readonly scheme: ZoneScheme
  readonly a: number
  readonly zoneEdge: number
  readonly G1: number
  readonly E0: number
  readonly kRange: readonly [number, number]
  readonly eRange: readonly [number, number]
  readonly segments: readonly ZoneFoldingSegment[]
  readonly reducedBands: BandStructure
  readonly compare?: {
    readonly bands: BandStructure
    readonly edgeGap: DirectGap | null
    readonly visible: boolean
    readonly label: string
    readonly gapLabel: string
  } | null
  readonly filling?: {
    readonly fermiLevel: number
    readonly label: string
  } | null
  readonly selection: {
    readonly kExtended: number
    readonly kReduced: number
    readonly n: number
    readonly G: number
    readonly energy: number
  }
  readonly probe?: {
    readonly slope: number
    readonly curvature: number
    readonly label: string
  } | null
  readonly highlight: QuantityId | null
  readonly highlightTarget: HighlightTarget
  readonly onPickBranch: (kFracReduced: number, branchN: number) => void
  readonly onPickExtended: (kExtended: number) => void
  readonly onNudge: (dk: number, dBand: number) => void
  readonly labels: {
    readonly ariaLabel: string
    readonly energyAxis: string
    readonly kAxis: string
    readonly bandsLegend: string
    readonly e0: string
  }
}

const MARGIN = { left: 50, right: 14, top: 12, bottom: 48 }
const DIM = 0.25
const FOLD_DURATION = 0.68
const PERIODIC_DURATION = 0.62

export const ZoneSchemesPlot = memo(function ZoneSchemesPlot(props: ZoneSchemesPlotProps): JSX.Element {
  const reduced = useReducedMotion()
  const targetFold = props.scheme === 'extended' ? 0 : 1
  const targetPer = props.scheme === 'periodic' ? 1 : 0

  const anim = useRef({
    foldFrom: targetFold,
    foldTo: targetFold,
    foldVal: targetFold,
    foldT: 1,
    perFrom: targetPer,
    perTo: targetPer,
    perVal: targetPer,
    perT: 1,
    compare: new Smoothed(0, 0.12),
    filling: new Smoothed(0, 0.12),
    fermi: new Smoothed(props.filling?.fermiLevel ?? 0, 0.1),
    probe: new Smoothed(0, 0.12)
  }).current

  if (anim.foldTo !== targetFold) {
    anim.foldFrom = anim.foldVal
    anim.foldTo = targetFold
    anim.foldT = reduced ? 1 : 0
    if (reduced) anim.foldVal = targetFold
  }
  if (anim.perTo !== targetPer) {
    anim.perFrom = anim.perVal
    anim.perTo = targetPer
    anim.perT = reduced ? 1 : 0
    if (reduced) anim.perVal = targetPer
  }

  const dragging = useRef(false)

  const canvasRef = useCanvasDraw((ctx, { w, h }, dt) => {
    const p = props
    if (reduced) {
      anim.foldT = 1
      anim.foldVal = anim.foldTo
      anim.perT = 1
      anim.perVal = anim.perTo
    } else {
      if (anim.foldT < 1) {
        anim.foldT = Math.min(1, anim.foldT + dt / FOLD_DURATION)
        anim.foldVal = anim.foldFrom + (anim.foldTo - anim.foldFrom) * easeInOutCubic(anim.foldT)
      }
      if (anim.perT < 1) {
        anim.perT = Math.min(1, anim.perT + dt / PERIODIC_DURATION)
        anim.perVal = anim.perFrom + (anim.perTo - anim.perFrom) * easeInOutCubic(anim.perT)
      }
    }

    const compareOn = !!p.compare && (p.compare.visible || p.highlight === 'VG')
    anim.compare.set(compareOn ? 1 : 0)
    anim.filling.set(p.filling ? 1 : 0)
    if (p.filling) anim.fermi.set(p.filling.fermiLevel, anim.filling.value < 0.02)
    anim.probe.set(p.probe ? 1 : 0)

    let moving = anim.foldT < 1 || anim.perT < 1
    for (const s of [anim.compare, anim.filling, anim.fermi, anim.probe]) {
      moving = s.step(dt, reduced) || moving
    }

    const fold = anim.foldVal
    const per = anim.perVal

    const L = MARGIN.left
    const T = MARGIN.top
    const W = Math.max(10, w - MARGIN.left - MARGIN.right)
    const H = Math.max(10, h - MARGIN.top - MARGIN.bottom)
    const [k0, k1] = p.kRange
    const [e0, e1] = p.eRange
    const X = (k: number): number => L + ((k - k0) / (k1 - k0)) * W
    const Y = (E: number): number => T + ((e1 - E) / (e1 - e0)) * H

    const hlG = p.highlight === 'a' && p.highlightTarget === 'G'
    const hlA = p.highlight === 'a' && p.highlightTarget !== 'G'
    const em = (q: QuantityId): number => (p.highlight === null || p.highlight === q ? 1 : DIM)
    const lw = (q: QuantityId, base: number): number => (p.highlight === q ? base + 1.2 : base)
    const kb = p.zoneEdge

    // --- griglia orizzontale ed energia ---
    const eStep = niceStep(e1 - e0, Math.max(4, Math.min(7, Math.round(H / 58))))
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
    ctx.fillText(p.labels.energyAxis, 0, 0)
    ctx.restore()

    // --- ombreggiatura fuori dalla prima zona (si attenua in zona periodica) ---
    const outerShadeAlpha = 0.025 * (1 - 0.65 * per)
    if (outerShadeAlpha > 0.002) {
      ctx.fillStyle = withAlpha(TOKENS.text, outerShadeAlpha)
      ctx.fillRect(L, T, Math.max(0, X(-kb) - L), H)
      ctx.fillRect(X(kb), T, Math.max(0, L + W - X(kb)), H)
    }

    // asse k
    ctx.strokeStyle = TOKENS.dim
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(L, T + H + 0.5)
    ctx.lineTo(L + W, T + H + 0.5)
    ctx.stroke()

    // --- tacche numeriche in k (Å⁻¹) ---
    const kStep = niceStep(k1 - k0, Math.max(3, Math.round(W / 95)))
    ctx.font = sansFont(12)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    const kTitleW = 64
    let lastTickX = -Infinity
    for (let k = Math.ceil(k0 / kStep) * kStep; k <= k1 + 1e-9; k += kStep) {
      const x = X(k)
      if (x < L + 12 || x > L + W - kTitleW - 10) continue
      if (x - lastTickX < 34) continue
      ctx.strokeStyle = TOKENS.dim
      ctx.beginPath()
      ctx.moveTo(x, T + H)
      ctx.lineTo(x, T + H + 4)
      ctx.stroke()
      ctx.fillStyle = TOKENS.muted
      ctx.fillText(formatNumber(k, kStep < 1 ? 1 : 0), x, T + H + 17)
      lastTickX = x
    }
    ctx.globalAlpha = em('k')
    ctx.fillStyle = quantityColor('k')
    ctx.textAlign = 'right'
    ctx.fillText(p.labels.kAxis, L + W, T + H + 17)
    ctx.globalAlpha = 1

    // --- bordi di zona ±π/a, ±2π/a, ±3π/a (si muovono con a, si illuminano su a) ---
    const aCol = quantityColor('a')
    const zoneSpacingPx = X(2 * kb) - X(kb)
    const boundaries = [
      { mult: 1, label: 'π/a', negLabel: '−π/a', primary: true },
      { mult: 2, label: '2π/a', negLabel: '−2π/a', primary: false },
      { mult: 3, label: '3π/a', negLabel: '−3π/a', primary: false }
    ]

    for (const b of boundaries) {
      const baseAlpha = b.primary ? 0.9 : 0.48
      ctx.globalAlpha = hlA ? 1 : p.highlight === null ? baseAlpha : hlG ? baseAlpha * 0.55 : DIM * baseAlpha
      ctx.strokeStyle = aCol
      ctx.lineWidth = hlA ? (b.primary ? 2.2 : 1.7) : b.primary ? 1.35 : 1
      ctx.setLineDash(b.primary ? [5, 5] : [3, 5])
      for (const s of [-1, 1]) {
        const kx = s * b.mult * kb
        if (kx < k0 || kx > k1) continue
        const xp = X(kx)
        ctx.beginPath()
        ctx.moveTo(xp, T)
        ctx.lineTo(xp, T + H + (b.primary || zoneSpacingPx >= 36 ? 22 : 6))
        ctx.stroke()
      }
      ctx.setLineDash([])

      const showLabel =
        b.primary ||
        (b.mult === 2 && zoneSpacingPx >= 36) ||
        (b.mult === 3 && zoneSpacingPx >= 42)
      if (showLabel) {
        for (const s of [-1, 1]) {
          const kx = s * b.mult * kb
          const xp = X(kx)
          if (xp < L + 14 || xp > L + W - 14) continue
          drawMathText(ctx, s < 0 ? b.negLabel : b.label, xp, T + H + 38, {
            color: aCol,
            align: 'center',
            size: b.primary ? 14 : 12.5
          })
        }
      }
    }
    ctx.globalAlpha = 1

    // --- contenuto ritagliato ---
    ctx.save()
    ctx.beginPath()
    ctx.rect(L, T, W, H)
    ctx.clip()

    // ingombri già disegnati (pallini, etichette, sonda): le etichette dei rami
    // n, disegnate per ultime, scelgono una posizione lungo il ramo che non li copra
    const occupied: RectBox[] = []
    const fermiSkips: XSpan[] = []
    const occupy = (x: number, y: number, rw: number, rh: number): void => {
      occupied.push({ x0: x, y0: y, x1: x + rw, y1: y + rh })
    }
    const occupyMath = (x: number, y: number, width: number, size: number, align: 'left' | 'center' | 'right'): void => {
      const x0 = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x
      occupy(x0 - 3, y - size * 0.85, width + 6, size * 1.2)
    }

    const eCol = quantityColor('E')
    const activeFermiY = p.filling && anim.filling.value > 0.01 ? Y(anim.fermi.value) : null
    let legendSpec: { items: { text: string; color: string; dash: number[] }[]; bx: number; by: number; boxW: number; boxH: number } | null = null
    if (p.compare && anim.compare.value > 0.01) {
      const items: { text: string; color: string; dash: number[] }[] = [
        { text: p.labels.bandsLegend, color: eCol, dash: [] },
        { text: p.compare.label, color: quantityColor('VG'), dash: [4, 4] }
      ]
      const widths = items.map((it) => measureRichText(ctx, it.text, { size: 12 }))
      const boxW = Math.max(...widths) + 40
      const boxH = items.length * 18 + 8
      const bx = L + W - boxW - 6
      const by = T + 6
      legendSpec = { items, bx, by, boxW, boxH }
      occupy(bx, by, boxW, boxH)
    }

    // livello E₀ di riferimento
    {
      const y = Y(p.E0)
      if (y >= T && y <= T + H) {
        const c = quantityColor('Ek')
        ctx.globalAlpha = em('Ek') * 0.85
        ctx.strokeStyle = c
        ctx.lineWidth = lw('Ek', 1)
        ctx.setLineDash([3, 3])
        const half = Math.min(36, Math.max(14, 0.22 * (X(kb) - X(0))))
        for (const s of [-1, 1]) {
          ctx.beginPath()
          ctx.moveTo(X(s * kb) - half, y)
          ctx.lineTo(X(s * kb) + half, y)
          ctx.stroke()
        }
        ctx.setLineDash([])
        const wE0 = drawMathText(ctx, p.labels.e0, X(-kb) - half - 4, y + 4, {
          color: c,
          size: 13,
          align: 'right',
          backdrop: TOKENS.bg
        })
        occupyMath(X(-kb) - half - 4, y + 4, wE0, 13, 'right')
        ctx.globalAlpha = 1
      }
    }

    // fantasma della parabola libera estesa quando si è in ridotta/periodica
    if (fold > 0.04) {
      ctx.globalAlpha = 0.28 * fold * (p.highlight === null || p.highlight === 'Ek' ? 1 : DIM)
      ctx.strokeStyle = quantityColor('Ek')
      ctx.lineWidth = p.highlight === 'Ek' ? 1.8 : 1.1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      const steps = 160
      for (let i = 0; i <= steps; i++) {
        const k = k0 + ((k1 - k0) * i) / steps
        const y = Y(freeElectronEnergy(k))
        if (i === 0) ctx.moveTo(X(k), y)
        else ctx.lineTo(X(k), y)
      }
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }

    // helper per tracciare un tratto parabolico traslato di `shiftK`
    const traceSegment = (seg: ZoneFoldingSegment, shiftK: number): void => {
      const steps = 36
      ctx.beginPath()
      for (let i = 0; i <= steps; i++) {
        const u = i / steps
        const kExt = seg.kExtStart + u * (seg.kExtEnd - seg.kExtStart)
        const x = X(kExt + shiftK)
        const y = Y(freeElectronEnergy(kExt))
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
    }

    // helper per tracciare la banda di confronto sullo stesso tratto
    const traceCompareSegment = (cmp: BandStructure, seg: ZoneFoldingSegment, shiftK: number): void => {
      const en = cmp.energies[seg.band]
      if (!en) return
      const pts = cmp.path.points
      const mid = (pts.length - 1) >> 1
      const rightHalf = Math.min(seg.kRedStart, seg.kRedEnd) >= -1e-9
      const i0 = rightHalf ? mid : 0
      const i1 = rightHalf ? pts.length - 1 : mid
      ctx.beginPath()
      for (let i = i0; i <= i1; i++) {
        const kRed = pts[i][0]
        const kExt = kRed + seg.G
        const x = X(kExt + shiftK)
        const y = Y(en[i])
        if (i === i0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
    }

    // --- copie periodiche (quando per > 0.01) ---
    const fill = anim.filling.value
    const fermiY = Y(anim.fermi.value)
    const periodicShifts = [-3, -2, -1, 1, 2, 3]

    if (per > 0.01) {
      const perAlphaBase = Math.min(1, per * 1.25) * 0.52
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      for (const pShift of periodicShifts) {
        const dx = pShift * per * p.G1
        if (kb + dx < k0 || -kb + dx > k1) continue
        ctx.strokeStyle = eCol
        ctx.lineWidth = lw('E', 1.6)
        ctx.globalAlpha = em('E') * perAlphaBase * (1 - 0.55 * fill)
        for (const seg of p.segments) {
          traceSegment(seg, -fold * seg.G + dx)
          ctx.stroke()
        }
        if (fill > 0.01) {
          ctx.save()
          ctx.beginPath()
          ctx.rect(L, fermiY, W, T + H - fermiY)
          ctx.clip()
          ctx.globalAlpha = em('E') * perAlphaBase * fill
          ctx.lineWidth = lw('E', 3.4)
          for (const seg of p.segments) {
            traceSegment(seg, -fold * seg.G + dx)
            ctx.stroke()
          }
          ctx.restore()
        }
      }
      ctx.globalAlpha = 1
    }

    // --- confronto con gli elettroni quasi liberi (V_G = −0,5 eV) ---
    if (p.compare && anim.compare.value > 0.01) {
      const cmp = p.compare
      const cmpCol = quantityColor('VG')
      const cmpAlpha = anim.compare.value * (p.highlight === null || p.highlight === 'VG' ? 1 : DIM)
      ctx.strokeStyle = cmpCol
      ctx.lineWidth = lw('VG', 1.5)
      ctx.setLineDash([4, 4])
      ctx.globalAlpha = cmpAlpha
      for (const seg of p.segments) {
        traceCompareSegment(cmp.bands, seg, -fold * seg.G)
        ctx.stroke()
      }
      if (per > 0.01) {
        ctx.globalAlpha = cmpAlpha * Math.min(1, per * 1.25) * 0.45
        for (const pShift of periodicShifts) {
          const dx = pShift * per * p.G1
          if (kb + dx < k0 || -kb + dx > k1) continue
          for (const seg of p.segments) {
            traceCompareSegment(cmp.bands, seg, -fold * seg.G + dx)
            ctx.stroke()
          }
        }
      }
      ctx.setLineDash([])
      ctx.globalAlpha = 1

      // indicatore del gap 2|V_G| in ±π/a
      if (cmp.edgeGap) {
        const yLo = Y(cmp.edgeGap.lower)
        const yHi = Y(cmp.edgeGap.upper)
        if (yLo - yHi >= 1.5) {
          const gx = X(kb)
          ctx.globalAlpha = cmpAlpha
          ctx.strokeStyle = cmpCol
          ctx.lineWidth = lw('VG', 2.4)
          ctx.beginPath()
          ctx.moveTo(gx, yLo)
          ctx.lineTo(gx, yHi)
          ctx.moveTo(gx - 4, yLo)
          ctx.lineTo(gx + 4, yLo)
          ctx.moveTo(gx - 4, yHi)
          ctx.lineTo(gx + 4, yHi)
          ctx.stroke()
          const labelW = measureMathText(ctx, cmp.gapLabel, 13.5)
          occupy(gx - 5, yHi - 2, 10, yLo - yHi + 4)
          placeGapLabelBox(ctx, {
            text: cmp.gapLabel,
            size: 13.5,
            color: cmpCol,
            backdrop: TOKENS.bg,
            centerX: gx + 8 + labelW / 2,
            preferredY: (yLo + yHi) / 2,
            minX: L,
            maxX: L + W,
            minY: T,
            maxY: T + H,
            fermiY: activeFermiY,
            occupied,
            fermiSkips
          })
          ctx.globalAlpha = 1
        }
      }
    }

    // --- guide di movimento dei segmenti durante il ripiegamento ---
    if (fold > 0.04 && fold < 0.96) {
      ctx.globalAlpha = Math.sin(Math.PI * fold) * 0.45
      ctx.strokeStyle = aCol
      ctx.lineWidth = 1
      ctx.setLineDash([2, 3])
      for (const seg of p.segments) {
        if (seg.n === 0) continue
        const kMidExt = 0.5 * (seg.kExtStart + seg.kExtEnd)
        const E = freeElectronEnergy(kMidExt)
        if (E > e1) continue
        const y = Y(E)
        const xStart = X(kMidExt)
        const xCurr = X(kMidExt - fold * seg.G)
        ctx.beginPath()
        ctx.moveTo(xStart, y)
        ctx.lineTo(xCurr, y)
        ctx.stroke()
      }
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }

    // --- rami principali del reticolo vuoto ---
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    const drawMainSegments = (onlySelected: boolean, widthBase: number, alphaScale: number): void => {
      for (const seg of p.segments) {
        const isSel = seg.n === p.selection.n
        if (isSel !== onlySelected) continue
        const col = isSel && hlG ? aCol : eCol
        ctx.strokeStyle = col
        ctx.lineWidth = isSel && hlG ? widthBase + 1.4 : isSel ? widthBase + 0.8 : lw('E', widthBase)
        const baseEm = isSel && hlG ? 1 : em('E')
        ctx.globalAlpha = baseEm * alphaScale
        traceSegment(seg, -fold * seg.G)
        ctx.stroke()
      }
    }

    drawMainSegments(false, 2, 1 - 0.55 * fill)
    drawMainSegments(true, 2.3, 1 - 0.55 * fill)

    if (fill > 0.01) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(L, fermiY, W, T + H - fermiY)
      ctx.clip()
      drawMainSegments(false, 4, fill)
      drawMainSegments(true, 4.2, fill)
      ctx.restore()
    }
    ctx.globalAlpha = 1

    // --- livello di Fermi ---
    if (p.filling && fill > 0.01) {
      const c = quantityColor('EF')
      ctx.globalAlpha = fill * em('EF')
      ctx.strokeStyle = c
      ctx.lineWidth = lw('EF', 1.5)
      ctx.setLineDash([8, 4])
      drawSegmentedHorizontalLine(ctx, L, L + W, fermiY, fermiSkips, 6)
      ctx.setLineDash([])
      const labelY = Math.max(T + 18, fermiY - 6)
      const wF = drawMathText(ctx, 'E_{F}', L + 8, labelY, { color: c, size: 15, backdrop: TOKENS.bg })
      ctx.font = sansFont(12)
      const label = p.filling.label
      const lwid = ctx.measureText(label).width
      ctx.fillStyle = TOKENS.bg
      ctx.fillRect(L + 16 + wF, labelY - 13, lwid + 8, 17)
      ctx.fillStyle = c
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(label, L + 20 + wF, labelY)
      occupy(L + 5, labelY - 14, wF + lwid + 22, 19)
      ctx.globalAlpha = 1
    }

    // --- stato scelto (e corrispondenza fra i tre schemi) ---
    {
      const sel = p.selection
      const kShown = sel.kExtended - fold * sel.G
      const sx = X(kShown)
      const sy = Y(sel.energy)

      // freccia / collegamento con lo stato esteso e ridotto
      if (sel.n !== 0 && sel.energy <= e1) {
        const xExt = X(sel.kExtended)
        const xRed = X(sel.kReduced)
        const arrowCol = hlG ? aCol : withAlpha(aCol, 0.72)
        ctx.globalAlpha = hlG ? 1 : p.highlight === null || p.highlight === 'a' || p.highlight === 'k' ? 0.85 : DIM

        // punto fantasma sulla posizione di arrivo / partenza
        const ghostX = fold >= 0.5 ? xExt : xRed
        if (ghostX >= L && ghostX <= L + W) {
          ctx.strokeStyle = arrowCol
          ctx.lineWidth = hlG ? 1.8 : 1.25
          ctx.setLineDash([3, 3])
          ctx.beginPath()
          ctx.moveTo(xExt, sy)
          ctx.lineTo(xRed, sy)
          ctx.stroke()
          ctx.setLineDash([])

          // punta della freccia
          const dir = xRed < xExt ? -1 : 1
          const tipX = fold >= 0.5 ? xRed + dir * 7 : xExt - dir * 7
          const arrowDir = fold >= 0.5 ? dir : -dir
          ctx.beginPath()
          ctx.moveTo(tipX, sy)
          ctx.lineTo(tipX - arrowDir * 6, sy - 3.5)
          ctx.moveTo(tipX, sy)
          ctx.lineTo(tipX - arrowDir * 6, sy + 3.5)
          ctx.stroke()

          // etichetta G / −G lungo la freccia
          const midX = 0.5 * (xExt + xRed)
          if (Math.abs(xExt - xRed) > 44 && midX > L + 24 && midX < L + W - 24) {
            const gSign = sel.n > 0 ? (fold >= 0.5 ? '−G' : '+G') : fold >= 0.5 ? '+G' : '−G'
            const gText = Math.abs(sel.n) > 1 ? `${gSign} (${Math.abs(sel.n)}·2π/a)` : gSign
            const wG = drawMathText(ctx, gText, midX, sy - 8, {
              color: aCol,
              align: 'center',
              size: 12.5,
              backdrop: TOKENS.bg
            })
            occupyMath(midX, sy - 8, wG, 12.5, 'center')
          }

          // cerchio vuoto fantasma
          ctx.fillStyle = TOKENS.bg
          ctx.strokeStyle = arrowCol
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(ghostX, sy, 4, 0, 2 * Math.PI)
          ctx.fill()
          ctx.stroke()
          occupy(ghostX - 7, sy - 7, 14, 14)
        }
        ctx.globalAlpha = 1
      }

      // repliche fantasma in zona periodica
      if (per > 0.08 && sel.energy <= e1) {
        ctx.globalAlpha = per * 0.65
        for (const pShift of periodicShifts) {
          const px = X(sel.kReduced + pShift * per * p.G1)
          if (px < L || px > L + W) continue
          ctx.fillStyle = TOKENS.bg
          ctx.strokeStyle = quantityColor('k')
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(px, sy, 3.8, 0, 2 * Math.PI)
          ctx.fill()
          ctx.stroke()
          occupy(px - 7, sy - 7, 14, 14)
        }
        ctx.globalAlpha = 1
      }

      // sonda di massa efficace attorno allo stato scelto
      if (p.probe && anim.probe.value > 0.01 && sel.energy <= e1) {
        const pr = p.probe
        const c = quantityColor('mstar')
        ctx.globalAlpha = anim.probe.value * em('mstar')
        ctx.strokeStyle = c
        ctx.lineWidth = lw('mstar', 2.2)
        ctx.beginPath()
        const bend = Math.abs(0.5 * pr.curvature)
        const span = Math.min(0.45 * kb, bend > 0 ? Math.sqrt((0.22 * (e1 - e0)) / bend) : Infinity)
        const probePts: { x: number; y: number }[] = []
        for (let i = 0; i <= 48; i++) {
          const dk = -span + (2 * span * i) / 48
          const px = X(kShown + dk)
          const py = Y(sel.energy + pr.slope * dk + 0.5 * pr.curvature * dk * dk)
          probePts.push({ x: px, y: py })
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
          if (i % 6 === 0) occupy(px - 4, py - 4, 8, 8)
        }
        ctx.stroke()
        const side = pr.slope > 0 ? -1 : 1
        const dkTip = side * span
        const tipX = X(kShown + dkTip)
        const tipY = Y(sel.energy + pr.slope * dkTip + 0.5 * pr.curvature * dkTip * dkTip)
        placeProbeLabel(ctx, {
          text: pr.label,
          size: 13.5,
          color: c,
          backdrop: TOKENS.bg,
          anchorX: tipX,
          anchorY: tipY,
          minX: L,
          maxX: L + W,
          minY: T,
          maxY: T + H,
          occupied,
          curvePoints: probePts
        })
        ctx.globalAlpha = 1
      }

      // linee di proiezione agli assi e pallino principale
      if (sy >= T && sy <= T + H) {
        ctx.setLineDash([2, 4])
        ctx.globalAlpha = em('k')
        ctx.strokeStyle = quantityColor('k')
        ctx.lineWidth = lw('k', 1.25)
        ctx.beginPath()
        ctx.moveTo(sx, T + H)
        ctx.lineTo(sx, sy)
        ctx.stroke()

        ctx.globalAlpha = em('E')
        ctx.strokeStyle = eCol
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
        occupy(sx - 10, sy - 10, 20, 20)
      }
    }

    // --- legenda confronto ---
    if (legendSpec) {
      const { items, bx, by, boxW, boxH } = legendSpec
      ctx.globalAlpha = anim.compare.value
      ctx.fillStyle = TOKENS.bg
      ctx.fillRect(bx, by, boxW, boxH)
      items.forEach((it, i) => {
        const y = by + 14 + i * 18
        ctx.strokeStyle = it.color
        ctx.lineWidth = 2
        ctx.setLineDash(it.dash)
        ctx.beginPath()
        ctx.moveTo(bx + 6, y - 4)
        ctx.lineTo(bx + 28, y - 4)
        ctx.stroke()
        ctx.setLineDash([])
        drawRichText(ctx, it.text, bx + 34, y, { size: 12, color: TOKENS.textSoft, align: 'left' })
      })
      ctx.globalAlpha = 1
    }

    // --- etichette dell'indice n su ogni ramo (per ultime: evitano gli ingombri) ---
    {
      const anchors: readonly { n: number; kExtFrac: number }[] = [
        { n: 0, kExtFrac: 0.42 },
        { n: 1, kExtFrac: 1.32 },
        { n: -1, kExtFrac: -1.78 },
        { n: 2, kExtFrac: 3.30 },
        { n: -2, kExtFrac: -3.72 },
        { n: 3, kExtFrac: 5.25 },
        { n: -3, kExtFrac: -5.65 }
      ]
      const ordered = [...anchors].sort((u, v) => Number(v.n === p.selection.n) - Number(u.n === p.selection.n))
      const offsets = [0, -0.18, 0.18, -0.36, 0.36, -0.54, 0.54, -0.72, 0.72]
      const hits = (b: RectBox): boolean => occupied.some((o) => boxesOverlap(b, o, 6))
      ctx.font = sansFont(11, 600)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const anchor of ordered) {
        const isSel = anchor.n === p.selection.n
        const tag = anchor.n === 0 ? 'n=0' : anchor.n > 0 ? `n=+${anchor.n}` : `n=−${Math.abs(anchor.n)}`
        const tw = ctx.measureText(tag).width + 8
        const G = anchor.n * p.G1
        // tratto del ramo n nella zona estesa: |k|/(π/a) in [2|n| − 1, 2|n| + 1] (n = 0: [−1, 1])
        const lo = anchor.n === 0 ? -0.92 : 2 * Math.abs(anchor.n) - 0.92
        const hi = anchor.n === 0 ? 0.92 : 2 * Math.abs(anchor.n) + 0.92
        const sign = anchor.n < 0 ? -1 : 1
        let chosen: RectBox | null = null
        let fallback: RectBox | null = null
        for (const off of offsets) {
          const f = Math.abs(anchor.kExtFrac) + off
          if (f < lo || f > hi) continue
          const kExt = sign * f * kb
          const E = freeElectronEnergy(kExt)
          if (E > e0 + 0.93 * (e1 - e0) || E < e0 + 0.03 * (e1 - e0)) continue
          const x = X(kExt - fold * G)
          const y = Y(E)
          if (x < L + tw / 2 + 2 || x > L + W - tw / 2 - 2) continue
          const b: RectBox = { x0: x - tw / 2, y0: y - 9, x1: x + tw / 2, y1: y + 9 }
          if (!fallback) fallback = b
          if (!hits(b)) {
            chosen = b
            break
          }
        }
        // nessuna posizione libera: il ramo scelto tiene la prima; gli altri si omettono
        const r = chosen ?? (isSel ? fallback : null)
        if (!r) continue
        occupied.push(r)
        const rw = r.x1 - r.x0
        const rh = r.y1 - r.y0
        ctx.globalAlpha = isSel && hlG ? 1 : em('E') * (isSel ? 1 : 0.78)
        ctx.fillStyle = TOKENS.bg
        ctx.fillRect(r.x0, r.y0, rw, rh)
        ctx.strokeStyle = isSel ? (hlG ? aCol : eCol) : TOKENS.line
        ctx.lineWidth = 1
        ctx.strokeRect(r.x0, r.y0, rw, rh)
        ctx.fillStyle = isSel ? (hlG ? aCol : TOKENS.text) : TOKENS.muted
        ctx.fillText(tag, r.x0 + rw / 2, r.y0 + 9.5)
      }
      ctx.globalAlpha = 1
    }

    ctx.restore()
    return moving
  })

  // --- interazione ---
  const pick = (e: PointerEvent<HTMLCanvasElement>): void => {
    const p = props
    const canvas = e.currentTarget
    const r = canvas.getBoundingClientRect()
    const W = r.width - MARGIN.left - MARGIN.right
    const H = r.height - MARGIN.top - MARGIN.bottom
    const [k0, k1] = p.kRange
    const [e0, e1] = p.eRange
    const kRaw = k0 + ((e.clientX - r.left - MARGIN.left) / W) * (k1 - k0)
    const py = e.clientY - r.top
    const edge = p.zoneEdge

    if (p.scheme === 'extended') {
      const kVisibleMax = Math.min(
        (2 * NUMERICS.maxBranchN + 1) * edge,
        freeElectronWaveNumber(e1),
        Math.abs(k1)
      )
      const kClamped = Math.max(-kVisibleMax, Math.min(kVisibleMax, kRaw))
      p.onPickExtended(kClamped)
      return
    }

    if (p.scheme === 'reduced') {
      const kRed = Math.max(-edge, Math.min(edge, kRaw))
      let bestN = 0
      let bestD = Infinity
      for (let n = -NUMERICS.maxBranchN; n <= NUMERICS.maxBranchN; n++) {
        const E = freeElectronEnergy(kRed + n * p.G1)
        if (E > e1 + 0.05 * (e1 - e0)) continue
        const y = MARGIN.top + ((e1 - E) / (e1 - e0)) * H
        const d = Math.abs(y - py)
        if (d < bestD) {
          bestD = d
          bestN = n
        }
      }
      p.onPickBranch(kRed / edge, bestN)
      return
    }

    // schema periodico: il clic può avvenire su qualunque replica in kRange
    const kClamped = Math.max(k0, Math.min(k1, kRaw))
    let bestExt = kClamped
    let bestD = Infinity
    for (let m = -8; m <= 8; m++) {
      const kExt = kClamped + m * p.G1
      const E = freeElectronEnergy(kExt)
      if (E > e1 + 0.05 * (e1 - e0)) continue
      const y = MARGIN.top + ((e1 - E) / (e1 - e0)) * H
      const d = Math.abs(y - py)
      if (d < bestD) {
        bestD = d
        bestExt = kExt
      }
    }
    p.onPickExtended(bestExt)
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
})
