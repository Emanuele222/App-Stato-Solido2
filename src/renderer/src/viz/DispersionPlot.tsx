/**
 * Diagramma di dispersione fononica ω(k) su Canvas 2D, riusabile da tutte le
 * sezioni del capitolo Fononi (1D monatomica/biatomica, cammini 3D lungo punti
 * di alta simmetria, pacchetti d'onda e processi Umklapp).
 *
 * Funzionalità:
 * - Assi 1D (k in Å⁻¹ con bordi di zona ±π/a e repliche periodiche attenuate)
 *   oppure 3D (cammini di alta simmetria es. Γ–X–K–Γ–L).
 * - Rami acustici/ottici con colore legato alla grandezza fisica (QUANTITIES / DERIVED_TONES).
 * - Fasce orizzontali: gap fononico (ω_max^ac < ω < ω_min^ott) e banda evanescente (ω > ω_max).
 * - Sonda velocità di fase (corda v_p dall'origine) e di gruppo (tangente v_g).
 * - Punti discreti di Born–von Kármán (k_j = 2πj/Na) e marcatori di punti notevoli (B, C, …).
 * - Retta della luce infrarossa (ω = ck/n) con eventuale punto d'incrocio ottico.
 * - Selezione interattiva via click/trascinamento e frecce tastiera; legenda esterna ChartLegend.
 *
 * Nessuna fisica qui: tutte le curve arrivano già calcolate da physics/.
 */
import { memo, useRef, type JSX, type KeyboardEvent, type PointerEvent } from 'react'
import { formatNumber } from '../ui/format'
import { Smoothed, useReducedMotion } from '../ui/motion'
import {
  quantityColor,
  toneColor,
  TOKENS,
  type DerivedToneId,
  type QuantityId
} from '../ui/theme'
import { ChartLegend, type LegendEntry } from './ChartLegend'
import {
  buildObstacleMap,
  drawMathText,
  measureMathText,
  niceStep,
  placeFreeLabel,
  placeProbeLabel,
  sansFont,
  useCanvasDraw,
  withAlpha,
  type PolylinePoint,
  type RectBox
} from './canvas'
import './viz.css'

export interface DispersionBranch {
  readonly id: string
  /** Ascisse: k in Å⁻¹ (1D) oppure distanza cumulativa lungo il cammino (3D). */
  readonly x: Float64Array | readonly number[]
  /** Ordinate: ω, ν (THz) o ħω (meV) nelle unità di yRange. */
  readonly y: Float64Array | readonly number[]
  /** Grandezza fisica per colore e highlight ('omega', 'omegaOpt', …). */
  readonly quantity: QuantityId
  /** Tinta derivata opzionale (es. 'acousticTransverse', 'opticalTransverse'). */
  readonly tone?: DerivedToneId
  /** Stile del tratto (default 'solid'). */
  readonly style?: 'solid' | 'dashed' | 'dotted'
  /** Spessore base del tratto in px CSS (default 2). */
  readonly lineWidth?: number
  /** Se true, il ramo è selezionabile via click/drag (default true). */
  readonly selectable?: boolean
  /** Se true (solo 1D con zoneEdge), fuori da [−π/a, +π/a] il ramo è attenuato. */
  readonly fadeOutsideZone?: boolean
  /** Etichetta opzionale (es. «2× TA», «LO») collocata automaticamente in spazio libero. */
  readonly tag?: { readonly x: number; readonly y: number; readonly label: string }
}

export interface HorizontalBand {
  readonly id: string
  readonly yMin: number
  /** Se omesso, si estende fino al bordo superiore del grafico (es. banda evanescente). */
  readonly yMax?: number
  readonly quantity: QuantityId
  readonly label?: string
  readonly kind?: 'gap' | 'evanescent'
}

export interface DispersionPoint {
  readonly x: number
  readonly y: number
  readonly quantity: QuantityId
  readonly tone?: DerivedToneId
  readonly radius?: number
  readonly label?: string
}

export interface PathSymmetryTick {
  readonly x: number
  readonly label: string
}

export interface VelocityProbeOverlay {
  readonly x: number
  readonly y: number
  /** Pendenza dω/dk nelle stesse unità (y / x) del grafico, per la tangente v_g. */
  readonly slopeVg: number
  /** Mostra la corda v_p dall'origine (0, 0) a (x, y) (default true). */
  readonly showVp?: boolean
  /** Mostra la tangente v_g centrata in (x, y) (default true). */
  readonly showVg?: boolean
  readonly vpLabel?: string
  readonly vgLabel?: string
}

export interface LightLineOverlay {
  /** Pendenza ω/k nelle unità del grafico (tipicamente molto ripida vicino a k = 0). */
  readonly slope: number
  /** Eventuale punto d'incrocio col ramo ottico. */
  readonly crossing?: { readonly x: number; readonly y: number; readonly label?: string }
  readonly label?: string
}

export interface ReferenceLine {
  readonly x0: number
  readonly y0: number
  readonly x1: number
  readonly y1: number
  readonly quantity: QuantityId
  readonly tone?: DerivedToneId
  readonly dash?: readonly number[]
  readonly label?: string
}

export interface DispersionSelection {
  readonly x: number
  readonly y: number
  readonly branchId?: string
  /** Eventuale punto aliasato (es. k + G) collegato orizzontalmente alla stessa ω. */
  readonly aliasX?: number
  readonly aliasLabel?: string
}

export interface DispersionPlotProps {
  /** Modalità assi: '1d' (k in Å⁻¹ con ±π/a opzionale) o '3d' (cammino di alta simmetria). */
  readonly mode?: '1d' | '3d'
  readonly branches: readonly DispersionBranch[]
  /** Finestra orizzontale [xMin, xMax]. */
  readonly xRange: readonly [number, number]
  /** Finestra verticale [yMin, yMax] (interpolata con Smoothed). */
  readonly yRange: readonly [number, number]
  /** Bordo della prima zona di Brillouin π/a in Å⁻¹ (modalità 1D). */
  readonly zoneEdge?: number
  /** Se true (default in 1D con zoneEdge), limita la selezione click/drag a [−π/a, +π/a]. */
  readonly clampToZone?: boolean
  /** Punti di alta simmetria lungo il cammino (modalità 3D, es. Γ–X–K–Γ–L). */
  readonly pathTicks?: readonly PathSymmetryTick[]
  /** Fasce orizzontali (gap fononico, banda evanescente ω > ω_max). */
  readonly bands?: readonly HorizontalBand[]
  /** Punti discreti di Born–von Kármán. */
  readonly bvkPoints?: readonly DispersionPoint[]
  /** Punti notevoli etichettati (es. B, C, ω_+(0), k₁, k₂, k₃). */
  readonly markers?: readonly DispersionPoint[]
  /** Linee di riferimento opzionali (es. retta velocità del suono v_s|k|). */
  readonly referenceLines?: readonly ReferenceLine[]
  /** Retta della luce infrarossa ω = ck/n. */
  readonly lightLine?: LightLineOverlay | null
  /** Sonda v_p (corda dall'origine) e v_g (tangente locale). */
  readonly probe?: VelocityProbeOverlay | null
  /** Stato fononico selezionato. */
  readonly selection?: DispersionSelection | null
  /** Grandezza evidenziata (da formula viva o hover su slider). */
  readonly highlight: QuantityId | null
  /** Quantità usata per il colore dell'etichetta asse y (default 'omega'). */
  readonly yAxisQuantity?: QuantityId
  /** Clic o trascinamento: ascissa x e indice/id del ramo più vicino. */
  readonly onPick?: (x: number, branchIndex: number, branchId: string) => void
  /** Frecce tastiera: passo orizzontale (−1, 0, 1) e cambio ramo (−1, 0, 1). */
  readonly onNudge?: (dx: number, dBranch: number) => void
  /** Legenda esterna resa tramite ChartLegend sopra il grafico. */
  readonly legend?: readonly LegendEntry[]
  readonly legendAriaLabel?: string
  readonly labels: {
    readonly ariaLabel: string
    readonly yAxis: string
    readonly xAxis?: string
  }
  readonly className?: string
}

const DIM = 0.26

function resolveColor(quantity: QuantityId, tone?: DerivedToneId): string {
  return tone ? toneColor(tone) : quantityColor(quantity)
}

function dashForStyle(style?: 'solid' | 'dashed' | 'dotted'): number[] {
  if (style === 'dashed') return [5, 4]
  if (style === 'dotted') return [2, 3]
  return []
}

/** Interpolazione lineare y(x) su un ramo ordinato per ascissa crescente. */
export function interpolateBranchY(
  xs: Float64Array | readonly number[],
  ys: Float64Array | readonly number[],
  x: number
): number | null {
  const n = Math.min(xs.length, ys.length)
  if (n === 0) return null
  if (n === 1) return ys[0]
  if (x <= xs[0]) return ys[0]
  if (x >= xs[n - 1]) return ys[n - 1]
  let lo = 0
  let hi = n - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (xs[mid] <= x) lo = mid
    else hi = mid
  }
  const dx = xs[hi] - xs[lo]
  if (Math.abs(dx) < 1e-12) return ys[lo]
  const t = (x - xs[lo]) / dx
  return ys[lo] + t * (ys[hi] - ys[lo])
}

export const DispersionPlot = memo(function DispersionPlot(props: DispersionPlotProps): JSX.Element {
  const reduced = useReducedMotion()
  const anim = useRef({
    yMin: new Smoothed(props.yRange[0], 0.16),
    yMax: new Smoothed(props.yRange[1], 0.16),
    probe: new Smoothed(props.probe ? 1 : 0, 0.12),
    light: new Smoothed(props.lightLine ? 1 : 0, 0.12)
  }).current
  const dragging = useRef(false)
  const lastProbeRef = useRef<VelocityProbeOverlay | null>(props.probe ?? null)
  const lastLightRef = useRef<LightLineOverlay | null>(props.lightLine ?? null)
  if (props.probe) lastProbeRef.current = props.probe
  if (props.lightLine) lastLightRef.current = props.lightLine

  const mode = props.mode ?? '1d'
  const hasZone = mode === '1d' && props.zoneEdge !== undefined && props.zoneEdge > 0
  const margin = {
    left: 52,
    right: 16,
    top: 12,
    bottom: hasZone ? 44 : 28
  }

  const canvasRef = useCanvasDraw((ctx, { w, h }, dt) => {
    const p = props
    anim.yMin.set(p.yRange[0])
    anim.yMax.set(p.yRange[1])
    anim.probe.set(p.probe ? 1 : 0)
    anim.light.set(p.lightLine ? 1 : 0)

    let moving = false
    for (const sm of [anim.yMin, anim.yMax, anim.probe, anim.light]) {
      moving = sm.step(dt, reduced) || moving
    }

    const L = margin.left
    const T = margin.top
    const W = Math.max(20, w - margin.left - margin.right)
    const H = Math.max(20, h - margin.top - margin.bottom)
    const [x0, x1] = p.xRange
    const xSpan = Math.max(1e-9, x1 - x0)
    const y0 = anim.yMin.value
    const y1 = anim.yMax.value
    const ySpan = Math.max(1e-9, y1 - y0)

    const X = (xv: number): number => L + ((xv - x0) / xSpan) * W
    const Y = (yv: number): number => T + ((y1 - yv) / ySpan) * H
    const em = (q: QuantityId): number => (p.highlight === null || p.highlight === q ? 1 : DIM)
    const lw = (q: QuantityId, base: number): number => (p.highlight === q ? base + 1.2 : base)

    // --- griglia orizzontale e asse y (ω / ν / ħω) ---
    const yStep = niceStep(ySpan, Math.max(3, Math.min(7, Math.round(H / 54))))
    ctx.font = sansFont(11.5)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let yv = Math.ceil(y0 / yStep) * yStep; yv <= y1 + 1e-9; yv += yStep) {
      const py = Y(yv)
      const isZero = Math.abs(yv) < 1e-9
      ctx.strokeStyle = isZero ? TOKENS.lineStrong : TOKENS.line
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(L, Math.round(py) + 0.5)
      ctx.lineTo(L + W, Math.round(py) + 0.5)
      ctx.stroke()
      ctx.fillStyle = TOKENS.muted
      ctx.fillText(formatNumber(yv, yStep < 0.1 ? 2 : yStep < 1 ? 1 : 0), L - 8, py)
    }

    const yAxisQ = p.yAxisQuantity ?? 'omega'
    ctx.save()
    ctx.translate(14, T + H / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.globalAlpha = em(yAxisQ)
    ctx.font = sansFont(11.5)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = quantityColor(yAxisQ)
    ctx.fillText(p.labels.yAxis, 0, 0)
    ctx.restore()

    // --- asse x: 1D oppure cammino 3D ---
    ctx.strokeStyle = TOKENS.dim
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(L, T + H + 0.5)
    ctx.lineTo(L + W, T + H + 0.5)
    ctx.stroke()

    if (mode === '3d' && p.pathTicks && p.pathTicks.length > 0) {
      ctx.font = sansFont(12, 600)
      ctx.textBaseline = 'top'
      p.pathTicks.forEach((tick, idx) => {
        const px = X(tick.x)
        ctx.strokeStyle = tick.label === 'Γ' ? TOKENS.lineStrong : withAlpha(TOKENS.lineStrong, 0.6)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(Math.round(px) + 0.5, T)
        ctx.lineTo(Math.round(px) + 0.5, T + H)
        ctx.stroke()
        ctx.fillStyle = TOKENS.textSoft
        ctx.textAlign =
          idx === 0 ? 'left' : idx === p.pathTicks!.length - 1 ? 'right' : 'center'
        ctx.fillText(tick.label, px, T + H + 7)
      })
    } else {
      // Modalità 1D
      const kb = p.zoneEdge ?? 0
      if (hasZone) {
        // Ombreggiatura tenue fuori dalla 1BZ
        ctx.fillStyle = withAlpha(TOKENS.text, 0.028)
        const leftEnd = Math.min(L + W, Math.max(L, X(-kb)))
        const rightStart = Math.max(L, Math.min(L + W, X(kb)))
        if (leftEnd > L) ctx.fillRect(L, T, leftEnd - L, H)
        if (rightStart < L + W) ctx.fillRect(rightStart, T, L + W - rightStart, H)
      }

      // Linea verticale k = 0 se interna
      if (x0 < 0 && x1 > 0) {
        const xZero = Math.round(X(0)) + 0.5
        ctx.strokeStyle = withAlpha(TOKENS.lineStrong, 0.7)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(xZero, T)
        ctx.lineTo(xZero, T + H)
        ctx.stroke()
      }

      // Tacche numeriche su asse k
      const kStep = niceStep(xSpan, Math.max(2, Math.round(W / 105)))
      ctx.font = sansFont(11.5)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      const xTitleW = p.labels.xAxis ? 62 : 0
      for (let kv = Math.ceil(x0 / kStep) * kStep; kv <= x1 + 1e-9; kv += kStep) {
        const px = X(kv)
        if (px < L - 1 || px > L + W - xTitleW) continue
        ctx.strokeStyle = TOKENS.dim
        ctx.beginPath()
        ctx.moveTo(px, T + H)
        ctx.lineTo(px, T + H + 4)
        ctx.stroke()
        ctx.fillStyle = TOKENS.muted
        ctx.fillText(formatNumber(kv, kStep < 1 ? 1 : 0), px, T + H + 17)
      }
      if (p.labels.xAxis) {
        ctx.globalAlpha = em('k')
        ctx.fillStyle = quantityColor('k')
        ctx.textAlign = 'right'
        ctx.fillText(p.labels.xAxis, L + W, T + H + 17)
        ctx.globalAlpha = 1
      }

      // Bordi di zona ±π/a
      if (hasZone) {
        ctx.globalAlpha = em('a')
        ctx.strokeStyle = quantityColor('a')
        ctx.lineWidth = lw('a', 1.2)
        ctx.setLineDash([5, 5])
        for (const sgn of [-1, 1]) {
          const xb = sgn * kb
          if (xb < x0 - 1e-9 || xb > x1 + 1e-9) continue
          const px = X(xb)
          ctx.beginPath()
          ctx.moveTo(px, T)
          ctx.lineTo(px, T + H + 22)
          ctx.stroke()
          drawMathText(ctx, sgn < 0 ? '−π/a' : 'π/a', px, T + H + 36, {
            color: quantityColor('a'),
            align: 'center',
            size: 14
          })
        }
        ctx.setLineDash([])
        ctx.globalAlpha = 1
      }
    }

    // --- area interna ritagliata ---
    ctx.save()
    ctx.beginPath()
    ctx.rect(L, T, W, H)
    ctx.clip()

    const occupied: RectBox[] = []
    const curvePolylines: PolylinePoint[][] = []
    const plotRegion: RectBox = { x0: L + 4, y0: T + 4, x1: L + W - 4, y1: T + H - 4 }

    // 1. Fasce orizzontali (gap fononico, banda evanescente ω > ω_max)
    for (const band of p.bands ?? []) {
      const yTopVal = band.yMax ?? y1
      if (yTopVal <= band.yMin) continue
      const pyTop = Math.max(T, Y(yTopVal))
      const pyBot = Math.min(T + H, Y(band.yMin))
      if (pyBot <= pyTop) continue
      const col = quantityColor(band.quantity)
      ctx.save()
      ctx.globalAlpha = em(band.quantity)
      ctx.fillStyle = withAlpha(col, band.kind === 'evanescent' ? 0.075 : 0.095)
      ctx.fillRect(L, pyTop, W, pyBot - pyTop)

      // Tratteggio leggero obliquo nella banda evanescente per distinguerla dal gap
      if (band.kind === 'evanescent') {
        ctx.strokeStyle = withAlpha(col, 0.14)
        ctx.lineWidth = 1
        ctx.beginPath()
        const stepHatch = 14
        const bandH = pyBot - pyTop
        for (let hx = L - bandH; hx < L + W + bandH; hx += stepHatch) {
          ctx.moveTo(hx, pyBot)
          ctx.lineTo(hx + bandH, pyTop)
        }
        ctx.stroke()
      }

      // Linee di bordo tratteggiate
      ctx.strokeStyle = withAlpha(col, 0.55)
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(L, pyBot)
      ctx.lineTo(L + W, pyBot)
      if (band.yMax !== undefined) {
        ctx.moveTo(L, pyTop)
        ctx.lineTo(L + W, pyTop)
      }
      ctx.stroke()
      ctx.setLineDash([])

      if (band.label && pyBot - pyTop >= 14) {
        const ly = (pyTop + pyBot) / 2 + 4
        const lx = L + 10
        const wText = drawMathText(ctx, band.label, lx, ly, {
          color: col,
          size: 12,
          align: 'left',
          backdrop: TOKENS.bg
        })
        occupied.push({ x0: lx - 3, y0: ly - 11, x1: lx + wText + 3, y1: ly + 4 })
      }
      ctx.restore()
    }

    // 2. Linee di riferimento (es. velocità del suono v_s|k|)
    for (const ref of p.referenceLines ?? []) {
      const col = resolveColor(ref.quantity, ref.tone)
      ctx.save()
      ctx.globalAlpha = em(ref.quantity) * 0.8
      ctx.strokeStyle = col
      ctx.lineWidth = lw(ref.quantity, 1.3)
      ctx.setLineDash(ref.dash ? [...ref.dash] : [4, 4])
      ctx.beginPath()
      ctx.moveTo(X(ref.x0), Y(ref.y0))
      ctx.lineTo(X(ref.x1), Y(ref.y1))
      ctx.stroke()
      ctx.setLineDash([])
      if (ref.label) {
        const mx = X(ref.x0 + 0.65 * (ref.x1 - ref.x0))
        const my = Y(ref.y0 + 0.65 * (ref.y1 - ref.y0))
        const tw = drawMathText(ctx, ref.label, mx + 6, my - 4, {
          color: col,
          size: 12.5,
          align: 'left',
          backdrop: TOKENS.bg
        })
        occupied.push({ x0: mx + 3, y0: my - 15, x1: mx + 9 + tw, y1: my + 2 })
      }
      ctx.restore()
    }

    // 3. Rami di dispersione ω_s(k)
    const traceBranch = (br: DispersionBranch): PolylinePoint[] => {
      const n = Math.min(br.x.length, br.y.length)
      const pts: PolylinePoint[] = []
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const px = X(br.x[i])
        const py = Y(br.y[i])
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
        if (i % 3 === 0 || i === n - 1) pts.push({ x: px, y: py })
      }
      return pts
    }

    const kb = p.zoneEdge ?? 0
    for (const br of p.branches) {
      const col = resolveColor(br.quantity, br.tone)
      const baseW = br.lineWidth ?? 2
      const isSelected = p.selection?.branchId === br.id
      const dash = dashForStyle(br.style)

      if (br.fadeOutsideZone && hasZone) {
        // Prima disegna l'intera curva attenuata (repliche periodiche fuori 1BZ)
        ctx.save()
        ctx.globalAlpha = em(br.quantity) * 0.34
        ctx.strokeStyle = col
        ctx.lineWidth = lw(br.quantity, baseW * 0.85)
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.setLineDash(dash.length ? dash : [4, 4])
        traceBranch(br)
        ctx.stroke()
        ctx.restore()

        // Poi ritaglia sulla 1BZ [−π/a, +π/a] a piena opacità
        ctx.save()
        ctx.beginPath()
        ctx.rect(X(-kb), T, Math.max(0, X(kb) - X(-kb)), H)
        ctx.clip()
        ctx.globalAlpha = em(br.quantity)
        ctx.strokeStyle = col
        ctx.lineWidth = lw(br.quantity, isSelected ? baseW + 0.7 : baseW)
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.setLineDash(dash)
        const pts = traceBranch(br)
        ctx.stroke()
        ctx.restore()
        curvePolylines.push(pts)
      } else {
        ctx.save()
        ctx.globalAlpha = em(br.quantity)
        ctx.strokeStyle = col
        ctx.lineWidth = lw(br.quantity, isSelected ? baseW + 0.7 : baseW)
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.setLineDash(dash)
        const pts = traceBranch(br)
        ctx.stroke()
        ctx.restore()
        curvePolylines.push(pts)
      }
    }

    // 4. Retta della luce infrarossa (ω = c·k/n)
    const activeLight = p.lightLine ?? lastLightRef.current
    if (activeLight && anim.light.value > 0.01) {
      const ll = activeLight
      const col = toneColor('lightLine')
      const alpha = anim.light.value * em('k')
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.strokeStyle = col
      ctx.lineWidth = lw('k', 1.6)
      ctx.setLineDash([6, 3])
      const yMaxLine = y1
      const xAtTop = ll.slope > 1e-9 ? yMaxLine / ll.slope : 0
      ctx.beginPath()
      ctx.moveTo(X(0), Y(0))
      ctx.lineTo(X(Math.min(x1, xAtTop)), Y(Math.min(yMaxLine, ll.slope * x1)))
      if (x0 < 0) {
        ctx.moveTo(X(0), Y(0))
        ctx.lineTo(X(Math.max(x0, -xAtTop)), Y(Math.min(yMaxLine, ll.slope * Math.abs(x0))))
      }
      ctx.stroke()
      ctx.setLineDash([])

      if (ll.crossing) {
        const cx = X(ll.crossing.x)
        const cy = Y(ll.crossing.y)
        ctx.fillStyle = TOKENS.bg
        ctx.strokeStyle = col
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(cx, cy, 4.5, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
        if (ll.crossing.label) {
          const wLbl = drawMathText(ctx, ll.crossing.label, cx + 8, cy - 6, {
            color: col,
            size: 12,
            align: 'left',
            backdrop: TOKENS.bg
          })
          occupied.push({ x0: cx + 5, y0: cy - 17, x1: cx + 11 + wLbl, y1: cy })
        }
      } else if (ll.label) {
        const lx = X(Math.min(x1 * 0.6, (y1 * 0.85) / Math.max(1e-6, ll.slope))) + 6
        const ly = Y(y1 * 0.85)
        const wLbl = drawMathText(ctx, ll.label, lx, ly, {
          color: col,
          size: 12,
          align: 'left',
          backdrop: TOKENS.bg
        })
        occupied.push({ x0: lx - 3, y0: ly - 11, x1: lx + wLbl + 3, y1: ly + 4 })
      }
      ctx.restore()
    }

    // 5. Punti discreti di Born–von Kármán
    if (p.bvkPoints && p.bvkPoints.length > 0) {
      for (const pt of p.bvkPoints) {
        const col = resolveColor(pt.quantity, pt.tone)
        const px = X(pt.x)
        const py = Y(pt.y)
        ctx.save()
        ctx.globalAlpha = em(pt.quantity)
        ctx.fillStyle = TOKENS.bg
        ctx.strokeStyle = col
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.arc(px, py, pt.radius ?? 3.4, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
        ctx.restore()
      }
    }

    // 6. Sonda velocità di fase (corda v_p) e velocità di gruppo (tangente v_g)
    const activeProbe = p.probe ?? lastProbeRef.current
    if (activeProbe && anim.probe.value > 0.01) {
      const pr = activeProbe
      const alphaP = anim.probe.value
      const sx = X(pr.x)
      const sy = Y(pr.y)
      const allCurvePts = curvePolylines.flat()

      // Corda v_p dall'origine (0, 0) a (x, y)
      if (pr.showVp !== false && Math.abs(pr.x) > 1e-6) {
        const cVp = quantityColor('vp')
        ctx.save()
        ctx.globalAlpha = alphaP * em('vp')
        ctx.strokeStyle = cVp
        ctx.lineWidth = lw('vp', 1.75)
        ctx.setLineDash([5, 4])
        ctx.beginPath()
        ctx.moveTo(X(0), Y(0))
        ctx.lineTo(sx, sy)
        ctx.stroke()
        ctx.setLineDash([])
        if (pr.vpLabel) {
          const midX = (X(0) + sx) / 2
          const midY = (Y(0) + sy) / 2
          placeProbeLabel(ctx, {
            text: pr.vpLabel,
            size: 13,
            color: cVp,
            backdrop: TOKENS.bg,
            anchorX: midX,
            anchorY: midY,
            minX: L,
            maxX: L + W,
            minY: T,
            maxY: T + H,
            occupied,
            curvePoints: allCurvePts
          })
        }
        ctx.restore()
      }

      // Tangente v_g centrata in (x, y)
      if (pr.showVg !== false) {
        const cVg = quantityColor('v')
        const halfDx = hasZone ? 0.24 * kb : 0.16 * xSpan
        const xA = pr.x - halfDx
        const yA = pr.y - pr.slopeVg * halfDx
        const xB = pr.x + halfDx
        const yB = pr.y + pr.slopeVg * halfDx
        ctx.save()
        ctx.globalAlpha = alphaP * em('v')
        ctx.strokeStyle = cVg
        ctx.lineWidth = lw('v', 2.2)
        ctx.beginPath()
        ctx.moveTo(X(xA), Y(yA))
        ctx.lineTo(X(xB), Y(yB))
        ctx.stroke()
        if (pr.vgLabel) {
          const tipX = pr.x >= 0 ? X(xB) : X(xA)
          const tipY = pr.x >= 0 ? Y(yB) : Y(yA)
          placeProbeLabel(ctx, {
            text: pr.vgLabel,
            size: 13,
            color: cVg,
            backdrop: TOKENS.bg,
            anchorX: tipX,
            anchorY: tipY,
            minX: L,
            maxX: L + W,
            minY: T,
            maxY: T + H,
            occupied,
            curvePoints: allCurvePts
          })
        }
        ctx.restore()
      }
    }

    // 7. Punti notevoli etichettati (es. B, C, ω_+(0))
    if (p.markers && p.markers.length > 0) {
      for (const mk of p.markers) {
        const col = resolveColor(mk.quantity, mk.tone)
        const mx = X(mk.x)
        const my = Y(mk.y)
        ctx.save()
        ctx.globalAlpha = em(mk.quantity)
        ctx.fillStyle = col
        ctx.beginPath()
        ctx.arc(mx, my, mk.radius ?? 4, 0, 2 * Math.PI)
        ctx.fill()
        if (mk.label) {
          const tw = measureMathText(ctx, mk.label, 12.5)
          const alignRight = mx + tw + 12 > L + W
          const lx = alignRight ? Math.max(L + tw + 4, mx - 7) : Math.min(L + W - tw - 4, mx + 7)
          const ly = my - 6 < T + 14 ? Math.min(T + H - 4, my + 16) : my - 6
          drawMathText(ctx, mk.label, lx, ly, {
            color: col,
            size: 12.5,
            align: alignRight ? 'right' : 'left',
            backdrop: TOKENS.bg
          })
          occupied.push({
            x0: alignRight ? lx - tw - 3 : lx - 3,
            y0: ly - 11,
            x1: alignRight ? lx + 3 : lx + tw + 3,
            y1: ly + 4
          })
        }
        ctx.restore()
      }
    }

    // 8. Etichette di ramo (es. degenerazioni 3D «2× TA», «LO») in spazio libero
    const taggedBranches = p.branches.filter((b) => b.tag !== undefined)
    if (taggedBranches.length > 0) {
      const obsMap = buildObstacleMap(plotRegion, curvePolylines, occupied)
      for (const br of taggedBranches) {
        const tag = br.tag!
        const col = resolveColor(br.quantity, br.tone)
        ctx.save()
        ctx.globalAlpha = em(br.quantity)
        placeFreeLabel(ctx, {
          text: tag.label,
          size: 11.5,
          color: col,
          backdrop: TOKENS.bg,
          anchor: { x: X(tag.x), y: Y(tag.y) },
          obstacles: obsMap,
          region: plotRegion,
          occupied
        })
        ctx.restore()
      }
    }

    // 9. Stato selezionato (e eventuale alias k + G)
    if (p.selection) {
      const sx = X(p.selection.x)
      const sy = Y(p.selection.y)

      // Crosshair tratteggiato
      ctx.save()
      ctx.setLineDash([2, 4])
      ctx.globalAlpha = em('k')
      ctx.strokeStyle = quantityColor('k')
      ctx.lineWidth = lw('k', 1.25)
      ctx.beginPath()
      ctx.moveTo(sx, T + H)
      ctx.lineTo(sx, sy)
      ctx.stroke()

      ctx.globalAlpha = em(yAxisQ)
      ctx.strokeStyle = quantityColor(yAxisQ)
      ctx.lineWidth = lw(yAxisQ, 1.25)
      ctx.beginPath()
      ctx.moveTo(L, sy)
      ctx.lineTo(sx, sy)
      ctx.stroke()
      ctx.setLineDash([])

      // Eventuale collegamento orizzontale con punto aliasato k + G
      if (p.selection.aliasX !== undefined) {
        const ax = X(p.selection.aliasX)
        ctx.globalAlpha = em('k')
        ctx.strokeStyle = quantityColor('k')
        ctx.lineWidth = 1.4
        ctx.setLineDash([4, 3])
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(ax, sy)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = TOKENS.bg
        ctx.strokeStyle = quantityColor('k')
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(ax, sy, 5, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()

        if (p.selection.aliasLabel) {
          const aTw = measureMathText(ctx, p.selection.aliasLabel, 12)
          const aLx = Math.max(L + aTw / 2 + 4, Math.min(L + W - aTw / 2 - 4, ax))
          const aLy = sy - 10 < T + 14 ? Math.min(T + H - 4, sy + 18) : sy - 10
          drawMathText(ctx, p.selection.aliasLabel, aLx, aLy, {
            color: quantityColor('k'),
            size: 12,
            align: 'center',
            backdrop: TOKENS.bg
          })
        }
      }

      // Pallino principale dello stato selezionato
      ctx.globalAlpha = 1
      ctx.fillStyle = TOKENS.bg
      ctx.strokeStyle = TOKENS.text
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(sx, sy, 5.5, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }

    ctx.restore()
    return moving
  })

  // --- interazione puntatore e tastiera ---
  const pick = (e: PointerEvent<HTMLCanvasElement>): void => {
    const p = props
    if (!p.onPick) return
    const rect = e.currentTarget.getBoundingClientRect()
    const W = Math.max(1, rect.width - margin.left - margin.right)
    const H = Math.max(1, rect.height - margin.top - margin.bottom)
    const [x0, x1] = p.xRange
    const y0 = anim.yMin.value
    const y1 = anim.yMax.value
    const rawX = x0 + ((e.clientX - rect.left - margin.left) / W) * (x1 - x0)
    const shouldClampZone = (p.clampToZone ?? true) && hasZone
    const minPickX = shouldClampZone ? Math.max(x0, -(p.zoneEdge ?? 0)) : x0
    const maxPickX = shouldClampZone ? Math.min(x1, p.zoneEdge ?? 0) : x1
    const pickedX = Math.max(minPickX, Math.min(maxPickX, rawX))
    const py = e.clientY - rect.top

    let bestIdx = -1
    let bestId = ''
    let bestDist = Infinity
    p.branches.forEach((br, idx) => {
      if (br.selectable === false) return
      const yVal = interpolateBranchY(br.x, br.y, pickedX)
      if (yVal === null) return
      const by = margin.top + ((y1 - yVal) / Math.max(1e-9, y1 - y0)) * H
      const dist = Math.abs(by - py)
      if (dist < bestDist) {
        bestDist = dist
        bestIdx = idx
        bestId = br.id
      }
    })
    if (bestIdx >= 0) {
      p.onPick(pickedX, bestIdx, bestId)
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLCanvasElement>): void => {
    if (!props.onNudge) return
    const map: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, 1],
      ArrowDown: [0, -1]
    }
    const delta = map[e.key]
    if (!delta) return
    e.preventDefault()
    props.onNudge(delta[0], delta[1])
  }

  const interactive = Boolean(props.onPick || props.onNudge)

  const canvasEl = (
    <canvas
      ref={canvasRef}
      className={interactive ? 'dispersion-canvas is-interactive' : 'dispersion-canvas'}
      tabIndex={interactive ? 0 : undefined}
      role="img"
      aria-label={props.labels.ariaLabel}
      onPointerDown={
        props.onPick
          ? (e) => {
              dragging.current = true
              e.currentTarget.setPointerCapture(e.pointerId)
              pick(e)
            }
          : undefined
      }
      onPointerMove={
        props.onPick
          ? (e) => {
              if (dragging.current) pick(e)
            }
          : undefined
      }
      onPointerUp={() => {
        dragging.current = false
      }}
      onPointerCancel={() => {
        dragging.current = false
      }}
      onKeyDown={onKeyDown}
    />
  )

  return (
    <div className={'dispersion-plot' + (props.className ? ' ' + props.className : '')}>
      {props.legend && props.legend.length > 0 && (
        <ChartLegend
          entries={props.legend}
          ariaLabel={props.legendAriaLabel ?? 'Legenda diagramma di dispersione'}
        />
      )}
      <div className="dispersion-plot-stage">{canvasEl}</div>
    </div>
  )
})
