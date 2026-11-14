/**
 * Diagramma a bande E(k) su Canvas 2D, riusabile da tutte le sezioni 1D.
 * Assi assoluti (k in Å⁻¹, E in eV): cambiando a si vedono muoversi i bordi
 * di zona ±π/a. Disegna le bande di una BandStructure nella prima zona e,
 * a richiesta: confronto (seconda BandStructure tratteggiata), riempimento
 * (livello di Fermi, stati occupati marcati), indicatori dei gap, livelli di
 * riferimento (es. E₀), stato scelto e sonda di massa efficace (parabola
 * osculatrice). Ogni elemento appartiene a una grandezza: con un'evidenziazione
 * attiva si accende quella e il resto si attenua.
 *
 * Nessuna fisica qui: le energie arrivano già calcolate da physics/.
 */
import { memo, useRef, type JSX, type KeyboardEvent, type PointerEvent } from 'react'
import type { BandStructure } from '../physics'
import { Smoothed, useReducedMotion } from '../ui/motion'
import { formatNumber } from '../ui/format'
import { quantityColor, TOKENS, type QuantityId } from '../ui/theme'
import { drawMathText, niceStep, sansFont, useCanvasDraw } from './canvas'
import './viz.css'

export interface GapMarker {
  readonly k: number
  readonly lower: number
  readonly upper: number
  /** Etichetta con pedici, es. «2|V_{G}|». */
  readonly label: string
  readonly quantity: QuantityId
}

export interface LevelMarker {
  readonly energy: number
  /** k attorno a cui disegnare il segmento (Å⁻¹). */
  readonly k: number
  readonly label: string
  readonly quantity: QuantityId
}

export interface BandPlotProps {
  readonly bands: BandStructure
  /** Finestra in k (Å⁻¹), fissa: assi assoluti. */
  readonly kRange: readonly [number, number]
  /** Finestra in energia (eV); i cambi sono interpolati. */
  readonly eRange: readonly [number, number]
  /** Bordo della prima zona, π/a (Å⁻¹). */
  readonly zoneEdge: number
  readonly compare?: {
    readonly bands: BandStructure
    readonly visible: boolean
    readonly quantity: QuantityId
    readonly label: string
  }
  readonly filling?: {
    readonly fermiLevel: number
    readonly label: string
  } | null
  readonly gaps?: readonly GapMarker[]
  readonly levels?: readonly LevelMarker[]
  readonly selection?: { readonly k: number; readonly energy: number } | null
  readonly probe?: {
    readonly k: number
    readonly energy: number
    /** dE/dk (eV·Å) */
    readonly slope: number
    /** d²E/dk² (eV·Å²) */
    readonly curvature: number
    readonly label: string
  } | null
  readonly highlight: QuantityId | null
  /** Clic o trascinamento: k (Å⁻¹, dentro la zona) e banda più vicina al puntatore. */
  readonly onPick?: (k: number, band: number) => void
  /** Frecce della tastiera: passo in k (−1, 0, 1) e cambio di banda (−1, 0, 1). */
  readonly onNudge?: (dk: number, dBand: number) => void
  readonly labels: {
    readonly ariaLabel: string
    readonly energyAxis: string
    readonly kAxis: string
    readonly bandsLegend: string
  }
}

const MARGIN = { left: 50, right: 14, top: 12, bottom: 44 }
const DIM = 0.26

export const BandPlot = memo(function BandPlot(props: BandPlotProps): JSX.Element {
  const reduced = useReducedMotion()
  const anim = useRef({
    eMin: new Smoothed(props.eRange[0], 0.18),
    eMax: new Smoothed(props.eRange[1], 0.18),
    compare: new Smoothed(0, 0.12),
    filling: new Smoothed(0, 0.12),
    fermi: new Smoothed(props.filling?.fermiLevel ?? 0, 0.1),
    probe: new Smoothed(0, 0.12)
  }).current
  const dragging = useRef(false)

  const canvasRef = useCanvasDraw((ctx, { w, h }, dt) => {
    const p = props
    anim.eMin.set(p.eRange[0])
    anim.eMax.set(p.eRange[1])
    const compareOn = !!p.compare && (p.compare.visible || p.highlight === p.compare.quantity)
    anim.compare.set(compareOn ? 1 : 0)
    anim.filling.set(p.filling ? 1 : 0)
    if (p.filling) anim.fermi.set(p.filling.fermiLevel, anim.filling.value < 0.02)
    anim.probe.set(p.probe ? 1 : 0)
    let moving = false
    for (const s of [anim.eMin, anim.eMax, anim.compare, anim.filling, anim.fermi, anim.probe]) {
      moving = s.step(dt, reduced) || moving
    }

    const L = MARGIN.left
    const T = MARGIN.top
    const W = Math.max(10, w - MARGIN.left - MARGIN.right)
    const H = Math.max(10, h - MARGIN.top - MARGIN.bottom)
    const [k0, k1] = p.kRange
    const e0 = anim.eMin.value
    const e1 = anim.eMax.value
    const X = (k: number): number => L + ((k - k0) / (k1 - k0)) * W
    const Y = (E: number): number => T + ((e1 - E) / (e1 - e0)) * H
    const em = (q: QuantityId): number => (p.highlight === null || p.highlight === q ? 1 : DIM)
    const lw = (q: QuantityId, base: number): number => (p.highlight === q ? base + 1.25 : base)
    const kb = p.zoneEdge

    // --- griglia ed energia ---
    const step = niceStep(e1 - e0, Math.max(3, Math.min(7, Math.round(H / 60))))
    ctx.font = sansFont(12)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let E = Math.ceil(e0 / step) * step; E <= e1 + 1e-9; E += step) {
      const y = Y(E)
      ctx.strokeStyle = Math.abs(E) < 1e-9 ? TOKENS.lineStrong : TOKENS.line
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(L, Math.round(y) + 0.5)
      ctx.lineTo(L + W, Math.round(y) + 0.5)
      ctx.stroke()
      ctx.fillStyle = TOKENS.muted
      ctx.fillText(formatNumber(E, step < 1 ? 1 : 0), L - 8, y)
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

    // --- fuori dalla prima zona ---
    ctx.fillStyle = 'rgba(255,255,255,0.025)'
    ctx.fillRect(L, T, Math.max(0, X(-kb) - L), H)
    ctx.fillRect(X(kb), T, Math.max(0, L + W - X(kb)), H)
    ctx.strokeStyle = TOKENS.dim
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(L, T + H + 0.5)
    ctx.lineTo(L + W, T + H + 0.5)
    ctx.stroke()

    // --- asse k: tacche in Å⁻¹ (riga 1), bordi di zona ±π/a (riga 2) ---
    const kStep = niceStep(k1 - k0, Math.max(2, Math.round(W / 110)))
    ctx.font = sansFont(12)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    const kTitleW = 64
    for (let k = Math.ceil(k0 / kStep) * kStep; k <= k1 + 1e-9; k += kStep) {
      const x = X(k)
      if (x > L + W - kTitleW) continue
      ctx.strokeStyle = TOKENS.dim
      ctx.beginPath()
      ctx.moveTo(x, T + H)
      ctx.lineTo(x, T + H + 4)
      ctx.stroke()
      ctx.fillStyle = TOKENS.muted
      ctx.fillText(formatNumber(k, kStep < 1 ? 1 : 0), x, T + H + 17)
    }
    ctx.globalAlpha = em('k')
    ctx.fillStyle = quantityColor('k')
    ctx.textAlign = 'right'
    ctx.fillText(p.labels.kAxis, L + W, T + H + 17)
    ctx.globalAlpha = 1

    ctx.globalAlpha = em('a')
    ctx.strokeStyle = quantityColor('a')
    ctx.lineWidth = lw('a', 1.25)
    ctx.setLineDash([5, 5])
    for (const s of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(X(s * kb), T)
      ctx.lineTo(X(s * kb), T + H + 22)
      ctx.stroke()
    }
    ctx.setLineDash([])
    drawMathText(ctx, '−π/a', X(-kb), T + H + 36, { color: quantityColor('a'), align: 'center', size: 15 })
    drawMathText(ctx, 'π/a', X(kb), T + H + 36, { color: quantityColor('a'), align: 'center', size: 15 })
    ctx.globalAlpha = 1

    // --- contenuto del grafico (ritagliato) ---
    ctx.save()
    ctx.beginPath()
    ctx.rect(L, T, W, H)
    ctx.clip()

    const trace = (bands: BandStructure, n: number): void => {
      const pts = bands.path.points
      const en = bands.energies[n]
      ctx.beginPath()
      for (let i = 0; i < pts.length; i++) {
        const x = X(pts[i][0])
        const y = Y(en[i])
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
    }
    const visibleBands = (bands: BandStructure): number[] => {
      const out: number[] = []
      bands.energies.forEach((en, n) => {
        let lo = Infinity
        for (const v of en) lo = Math.min(lo, v)
        if (lo <= e1) out.push(n)
      })
      return out
    }

    // livelli di riferimento (E₀)
    for (const lv of p.levels ?? []) {
      const y = Y(lv.energy)
      const c = quantityColor(lv.quantity)
      ctx.globalAlpha = em(lv.quantity) * (p.highlight === lv.quantity ? 1 : 0.85)
      ctx.strokeStyle = c
      ctx.lineWidth = lw(lv.quantity, 1)
      ctx.setLineDash([3, 3])
      const half = Math.min(46, 0.18 * (X(kb) - X(0)))
      for (const s of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(X(s * lv.k) - half, y)
        ctx.lineTo(X(s * lv.k) + half, y)
        ctx.stroke()
      }
      ctx.setLineDash([])
      // etichetta sul segmento di sinistra (−k), dentro la zona: a destra c'è l'indicatore del gap
      drawMathText(ctx, lv.label, X(-lv.k) + half + 4, y + 5, { color: c, size: 14, backdrop: TOKENS.bg })
    }
    ctx.globalAlpha = 1

    // confronto
    if (p.compare && anim.compare.value > 0.01) {
      const cmp = p.compare
      ctx.globalAlpha = anim.compare.value * (p.highlight === null || p.highlight === cmp.quantity ? 1 : DIM)
      ctx.strokeStyle = quantityColor(cmp.quantity)
      ctx.lineWidth = lw(cmp.quantity, 1.25)
      ctx.setLineDash([4, 4])
      for (const n of visibleBands(cmp.bands)) {
        trace(cmp.bands, n)
        ctx.stroke()
      }
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }

    // bande
    const fill = anim.filling.value
    const fermiY = Y(anim.fermi.value)
    const shown = visibleBands(p.bands)
    ctx.strokeStyle = quantityColor('E')
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.globalAlpha = em('E') * (1 - 0.55 * fill)
    ctx.lineWidth = lw('E', 2)
    for (const n of shown) {
      trace(p.bands, n)
      ctx.stroke()
    }
    if (fill > 0.01) {
      // stati occupati: tratto spesso sotto E_F
      ctx.save()
      ctx.beginPath()
      ctx.rect(L, fermiY, W, T + H - fermiY)
      ctx.clip()
      ctx.globalAlpha = em('E') * fill
      ctx.lineWidth = lw('E', 4)
      for (const n of shown) {
        trace(p.bands, n)
        ctx.stroke()
      }
      ctx.restore()
    }
    ctx.globalAlpha = 1

    // gap
    for (const g of p.gaps ?? []) {
      const yLo = Y(g.lower)
      const yHi = Y(g.upper)
      if (yLo - yHi < 1.5) continue
      const x = X(g.k)
      const c = quantityColor(g.quantity)
      ctx.globalAlpha = em(g.quantity)
      ctx.strokeStyle = c
      ctx.lineWidth = lw(g.quantity, 2.5)
      ctx.beginPath()
      ctx.moveTo(x, yLo)
      ctx.lineTo(x, yHi)
      ctx.moveTo(x - 4, yLo)
      ctx.lineTo(x + 4, yLo)
      ctx.moveTo(x - 4, yHi)
      ctx.lineTo(x + 4, yHi)
      ctx.stroke()
      if (yLo - yHi > 3) {
        const right = L + W - x > 52
        drawMathText(ctx, g.label, right ? x + 8 : x - 8, (yLo + yHi) / 2 + 5, {
          color: c,
          align: right ? 'left' : 'right',
          size: 14,
          backdrop: TOKENS.bg
        })
      }
    }
    ctx.globalAlpha = 1

    // livello di Fermi
    if (p.filling && fill > 0.01) {
      const c = quantityColor('EF')
      ctx.globalAlpha = fill * em('EF')
      ctx.strokeStyle = c
      ctx.lineWidth = lw('EF', 1.5)
      ctx.setLineDash([8, 4])
      ctx.beginPath()
      ctx.moveTo(L, fermiY)
      ctx.lineTo(L + W, fermiY)
      ctx.stroke()
      ctx.setLineDash([])
      const wF = drawMathText(ctx, 'E_{F}', L + 8, fermiY - 6, { color: c, size: 15, backdrop: TOKENS.bg })
      ctx.font = sansFont(12)
      const label = p.filling.label
      const lwid = ctx.measureText(label).width
      ctx.fillStyle = TOKENS.bg
      ctx.fillRect(L + 16 + wF, fermiY - 19, lwid + 8, 17)
      ctx.fillStyle = c
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(label, L + 20 + wF, fermiY - 6)
      ctx.globalAlpha = 1
    }

    // sonda di massa efficace
    if (p.probe && anim.probe.value > 0.01) {
      const pr = p.probe
      const c = quantityColor('mstar')
      ctx.globalAlpha = anim.probe.value * em('mstar')
      ctx.strokeStyle = c
      // tratto continuo: si distingue dal confronto, che è tratteggiato
      ctx.lineWidth = lw('mstar', 2)
      ctx.beginPath()
      // tratto limitato: al più 0,4·π/a e al più ±¼ della finestra in energia
      const bend = Math.abs(0.5 * pr.curvature)
      const span = Math.min(0.4 * kb, bend > 0 ? Math.sqrt((0.25 * (e1 - e0)) / bend) : Infinity)
      for (let i = 0; i <= 60; i++) {
        const dk = -span + (2 * span * i) / 60
        const y = Y(pr.energy + pr.slope * dk + 0.5 * pr.curvature * dk * dk)
        if (i === 0) ctx.moveTo(X(pr.k + dk), y)
        else ctx.lineTo(X(pr.k + dk), y)
      }
      ctx.stroke()
      ctx.setLineDash([])
      // etichetta all'estremo rivolto verso il centro della zona (al bordo c'è l'indicatore del gap)
      const side = pr.k > 0 ? -1 : 1
      const dkTip = side * span
      const tipY = Y(pr.energy + pr.slope * dkTip + 0.5 * pr.curvature * dkTip * dkTip)
      const tx = X(pr.k + dkTip) + side * 6
      const ty = Math.max(T + 16, Math.min(T + H - 6, tipY + 5))
      drawMathText(ctx, pr.label, tx, ty, { color: c, size: 14, backdrop: TOKENS.bg, align: side < 0 ? 'right' : 'left' })
      ctx.globalAlpha = 1
    }

    // stato scelto
    if (p.selection) {
      const sx = X(p.selection.k)
      const sy = Y(p.selection.energy)
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
    }

    // legenda (solo con il confronto attivo)
    if (p.compare && anim.compare.value > 0.01) {
      ctx.globalAlpha = anim.compare.value
      ctx.font = sansFont(12)
      const items: { text: string; color: string; dash: number[] }[] = [
        { text: p.labels.bandsLegend, color: quantityColor('E'), dash: [] },
        { text: p.compare.label, color: quantityColor(p.compare.quantity), dash: [4, 4] }
      ]
      const widths = items.map((it) => ctx.measureText(it.text).width)
      const boxW = Math.max(...widths) + 40
      const bx = L + W - boxW - 6
      const by = T + 6
      ctx.fillStyle = TOKENS.bg
      ctx.fillRect(bx, by, boxW, items.length * 18 + 8)
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
        ctx.fillStyle = TOKENS.textSoft
        ctx.textAlign = 'left'
        ctx.fillText(it.text, bx + 34, y)
      })
      ctx.globalAlpha = 1
    }

    ctx.restore()
    return moving
  })

  // --- interazione ---
  const pick = (e: PointerEvent<HTMLCanvasElement>): void => {
    const p = props
    if (!p.onPick) return
    const canvas = e.currentTarget
    const r = canvas.getBoundingClientRect()
    const W = r.width - MARGIN.left - MARGIN.right
    const H = r.height - MARGIN.top - MARGIN.bottom
    const [k0, k1] = p.kRange
    const e0 = anim.eMin.value
    const e1 = anim.eMax.value
    const kRaw = k0 + ((e.clientX - r.left - MARGIN.left) / W) * (k1 - k0)
    const k = Math.max(-p.zoneEdge, Math.min(p.zoneEdge, kRaw))
    const py = e.clientY - r.top
    let best = 0
    let bestD = Infinity
    p.bands.energies.forEach((en, n) => {
      const E = interpolate(p.bands, en, k)
      if (E > e1 + 0.05 * (e1 - e0)) return
      const y = MARGIN.top + ((e1 - E) / (e1 - e0)) * H
      const d = Math.abs(y - py)
      if (d < bestD) {
        bestD = d
        best = n
      }
    })
    p.onPick(k, best)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLCanvasElement>): void => {
    if (!props.onNudge) return
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

/** E_n(k) per interpolazione lineare sul cammino 1D (solo geometria del disegno). */
function interpolate(bands: BandStructure, en: Float64Array, k: number): number {
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
