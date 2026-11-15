/**
 * Strumenti comuni dei disegni su Canvas 2D: adattamento alla densità dello
 * schermo e al ridimensionamento, ciclo di disegno su richiesta (un solo
 * fotogramma per volta, altri solo finché qualche transizione è in corso),
 * testo matematico con pedici.
 */
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { FONTS } from '../ui/theme'

export interface CanvasSize {
  /** Larghezza e altezza in pixel CSS. */
  readonly w: number
  readonly h: number
}

/**
 * `draw(ctx, size, dt)` disegna una scena intera (in pixel CSS) e restituisce
 * true se serve un altro fotogramma (animazione non conclusa). Si ridisegna a
 * ogni render del componente, al ridimensionamento e quando arrivano i font.
 */
export function useCanvasDraw(
  draw: (ctx: CanvasRenderingContext2D, size: CanvasSize, dt: number) => boolean
): RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawRef = useRef(draw)
  const frame = useRef(0)
  const last = useRef(0)
  const request = useRef<() => void>(() => {})

  useLayoutEffect(() => {
    drawRef.current = draw
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const run = (now: number): void => {
      frame.current = 0
      const dt = last.current ? Math.min(0.1, (now - last.current) / 1000) : 1 / 60
      last.current = now
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const w = Math.max(1, rect.width)
      const h = Math.max(1, rect.height)
      const pw = Math.round(w * dpr)
      const ph = Math.round(h * dpr)
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw
        canvas.height = ph
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      const again = drawRef.current(ctx, { w, h }, dt)
      if (again) frame.current = requestAnimationFrame(run)
      else last.current = 0
    }
    request.current = () => {
      if (!frame.current) frame.current = requestAnimationFrame(run)
    }
    const ro = new ResizeObserver(() => request.current())
    ro.observe(canvas)
    const fonts = document.fonts
    const onFonts = (): void => request.current()
    fonts?.addEventListener?.('loadingdone', onFonts)
    request.current()
    return () => {
      ro.disconnect()
      fonts?.removeEventListener?.('loadingdone', onFonts)
      cancelAnimationFrame(frame.current)
      frame.current = 0
    }
  }, [])

  // ogni render (nuovi dati) chiede un fotogramma
  useEffect(() => {
    request.current()
  })

  return canvasRef
}

export interface MathTextOptions {
  readonly size?: number
  readonly color: string
  readonly align?: 'left' | 'center' | 'right'
  /** Corsivo matematico (default) o tondo. */
  readonly italic?: boolean
  /** Fondo dietro il testo, per staccarlo da linee e curve. */
  readonly backdrop?: string
}

export interface RectBox {
  readonly x0: number
  readonly y0: number
  readonly x1: number
  readonly y1: number
}

export interface XSpan {
  readonly x0: number
  readonly x1: number
}

interface Run {
  readonly text: string
  readonly kind: 'base' | 'sub' | 'sup'
}

interface RichSegment {
  readonly text: string
  readonly math: boolean
}

const UPRIGHT_CHUNK_RE = /([0-9|=()+\-−*/,.\[\]<>·:\s²³]+|[^0-9|=()+\-−*/,.\[\]<>·:\s²³]+)/g
const IS_UPRIGHT_RE = /^[0-9|=()+\-−*/,.\[\]<>·:\s²³]+$/

function fontForRun(size: number, kind: Run['kind'], italic: boolean): string {
  const px = kind === 'base' ? size : Math.round(size * 0.72)
  return `${italic ? 'italic ' : ''}${px}px ${italic ? FONTS.math : FONTS.mathUpright}`
}

interface GlyphChunk {
  readonly text: string
  readonly kind: Run['kind']
  readonly italic: boolean
}

function buildMathChunks(text: string, italic: boolean): GlyphChunk[] {
  const out: GlyphChunk[] = []
  for (const r of parseRuns(text)) {
    if (!italic) {
      out.push({ text: r.text, kind: r.kind, italic: false })
      continue
    }
    for (const part of r.text.match(UPRIGHT_CHUNK_RE) ?? [r.text]) {
      out.push({ text: part, kind: r.kind, italic: !IS_UPRIGHT_RE.test(part) })
    }
  }
  return out
}

/** Misura la larghezza di un testo matematico con pedici (`_{…}`, `_x`) e apici (`^{…}`, `^x`). */
export function measureMathText(ctx: CanvasRenderingContext2D, text: string, size = 15, italic = true): number {
  const chunks = buildMathChunks(text, italic)
  let width = 0
  let prevKind: Run['kind'] | null = null
  for (const c of chunks) {
    ctx.font = fontForRun(size, c.kind, c.italic)
    const pad = c.kind !== 'base' && c.kind !== prevKind ? 1 : 0
    width += ctx.measureText(c.text).width + pad
    prevKind = c.kind
  }
  return width
}

/** «E_{F}», «2|V_{G}|», «V_3^s», «−π/a»: testo matematico con pedici e apici. Restituisce la larghezza. */
export function drawMathText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: MathTextOptions
): number {
  const size = options.size ?? 15
  const italic = options.italic !== false
  const chunks = buildMathChunks(text, italic)
  let width = 0
  let prevKind: Run['kind'] | null = null
  const widths = chunks.map((c) => {
    ctx.font = fontForRun(size, c.kind, c.italic)
    const pad = c.kind !== 'base' && c.kind !== prevKind ? 1 : 0
    const w = ctx.measureText(c.text).width + pad
    width += w
    prevKind = c.kind
    return { w, pad }
  })
  let x0 = x
  if (options.align === 'center') x0 = x - width / 2
  else if (options.align === 'right') x0 = x - width
  ctx.save()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  if (options.backdrop) {
    ctx.fillStyle = options.backdrop
    ctx.fillRect(x0 - 3, y - size * 0.9, width + 6, size * 1.25)
  }
  ctx.fillStyle = options.color
  let cx = x0
  chunks.forEach((c, i) => {
    ctx.font = fontForRun(size, c.kind, c.italic)
    const dy = c.kind === 'sub' ? size * 0.24 : c.kind === 'sup' ? -size * 0.36 : 0
    ctx.fillText(c.text, cx + widths[i].pad, y + dy)
    cx += widths[i].w
  })
  ctx.restore()
  return width
}

export interface RichTextOptions {
  readonly size?: number
  readonly weight?: number
  readonly color: string
  readonly align?: 'left' | 'center' | 'right'
  readonly italicMath?: boolean
  readonly backdrop?: string
}

function parseRichSegments(text: string): RichSegment[] {
  const out: RichSegment[] = []
  // Segmenti espliciti `$…$` oppure token isolati con pedice/apice (`V^s`, `|c_G|^2`, `E_F`, `m_0`).
  const tokenRe =
    /\$[^$]+\$|[A-Za-zΑ-Ωα-ωψℏħ|][A-Za-z0-9Α-Ωα-ωψ'*]*(?:[_^](?:\{[^}]+\}|[A-Za-z0-9Α-Ωα-ω+\-*′'|]+))+(?:\|(?:\^\{[^}]+\}|\^[A-Za-z0-9+\-*]+))?/g
  let last = 0
  for (const m of text.matchAll(tokenRe)) {
    const idx = m.index ?? 0
    if (idx > last) out.push({ text: text.slice(last, idx), math: false })
    const raw = m[0]
    out.push({ text: raw.startsWith('$') && raw.endsWith('$') ? raw.slice(1, -1) : raw, math: true })
    last = idx + raw.length
  }
  if (last < text.length) out.push({ text: text.slice(last), math: false })
  return out
}

/** Misura una riga mista (sans + token matematici con pedici/apici). */
export function measureRichText(
  ctx: CanvasRenderingContext2D,
  text: string,
  options?: { size?: number; weight?: number; italicMath?: boolean }
): number {
  const size = options?.size ?? 12
  const weight = options?.weight ?? 400
  const italicMath = options?.italicMath !== false
  let total = 0
  for (const seg of parseRichSegments(text)) {
    if (seg.math) {
      total += measureMathText(ctx, seg.text, size + 0.5, italicMath)
    } else {
      ctx.font = sansFont(size, weight)
      total += ctx.measureText(seg.text).width
    }
  }
  return total
}

/** Disegna una riga mista (sans + matematica formattata con pedici/apici, senza `_` o `^` letterali). */
export function drawRichText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: RichTextOptions
): number {
  const size = options.size ?? 12
  const weight = options.weight ?? 400
  const italicMath = options.italicMath !== false
  const segs = parseRichSegments(text)
  const widths = segs.map((seg) => {
    if (seg.math) return measureMathText(ctx, seg.text, size + 0.5, italicMath)
    ctx.font = sansFont(size, weight)
    return ctx.measureText(seg.text).width
  })
  const total = widths.reduce((a, b) => a + b, 0)
  let cx = x
  if (options.align === 'center') cx = x - total / 2
  else if (options.align === 'right') cx = x - total
  ctx.save()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  if (options.backdrop) {
    ctx.fillStyle = options.backdrop
    ctx.fillRect(cx - 3, y - size * 0.9, total + 6, size * 1.25)
  }
  segs.forEach((seg, i) => {
    if (seg.math) {
      drawMathText(ctx, seg.text, cx, y, {
        size: size + 0.5,
        color: options.color,
        align: 'left',
        italic: italicMath
      })
    } else {
      ctx.font = sansFont(size, weight)
      ctx.fillStyle = options.color
      ctx.fillText(seg.text, cx, y)
    }
    cx += widths[i]
  })
  ctx.restore()
  return total
}

function parseRuns(text: string): Run[] {
  const runs: Run[] = []
  let i = 0
  let buf = ''
  while (i < text.length) {
    const ch = text[i]
    if ((ch === '_' || ch === '^') && i + 1 < text.length) {
      const kind: Run['kind'] = ch === '_' ? 'sub' : 'sup'
      if (buf) runs.push({ text: buf, kind: 'base' })
      buf = ''
      if (text[i + 1] === '{') {
        const end = text.indexOf('}', i + 2)
        runs.push({ text: text.slice(i + 2, end < 0 ? text.length : end), kind })
        i = end < 0 ? text.length : end + 1
      } else {
        runs.push({ text: text[i + 1], kind })
        i += 2
      }
    } else {
      buf += ch
      i++
    }
  }
  if (buf) runs.push({ text: buf, kind: 'base' })
  return runs
}

/** Verifica se due riquadri si sovrappongono considerando un margine `pad`. */
export function boxesOverlap(a: RectBox, b: RectBox, pad = 4): boolean {
  return !(a.x1 + pad <= b.x0 || b.x1 + pad <= a.x0 || a.y1 + pad <= b.y0 || b.y1 + pad <= a.y0)
}

/**
 * Traccia una linea orizzontale (es. livello di Fermi) spezzandola attorno agli
 * intervalli orizzontali delle etichette che intersecano la sua fascia verticale.
 */
export function drawSegmentedHorizontalLine(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y: number,
  skipSpans: readonly XSpan[],
  pad = 6
): void {
  const blocked = skipSpans
    .map((s) => ({ x0: Math.max(x0, s.x0 - pad), x1: Math.min(x1, s.x1 + pad) }))
    .filter((s) => s.x1 > s.x0)
    .sort((a, b) => a.x0 - b.x0)
  const merged: XSpan[] = []
  for (const s of blocked) {
    const prev = merged[merged.length - 1]
    if (prev && s.x0 <= prev.x1) merged[merged.length - 1] = { x0: prev.x0, x1: Math.max(prev.x1, s.x1) }
    else merged.push(s)
  }
  let cursor = x0
  for (const s of merged) {
    if (s.x0 > cursor + 1) {
      ctx.beginPath()
      ctx.moveTo(cursor, y)
      ctx.lineTo(s.x0, y)
      ctx.stroke()
    }
    cursor = Math.max(cursor, s.x1)
  }
  if (cursor < x1 - 1) {
    ctx.beginPath()
    ctx.moveTo(cursor, y)
    ctx.lineTo(x1, y)
    ctx.stroke()
  }
}

export interface PlaceGapLabelOptions {
  readonly text: string
  readonly size?: number
  readonly color: string
  readonly backdrop?: string
  readonly centerX: number
  readonly preferredY: number
  readonly minX: number
  readonly maxX: number
  readonly minY: number
  readonly maxY: number
  readonly fermiY?: number | null
  readonly occupied: RectBox[]
  readonly fermiSkips?: XSpan[]
  readonly rich?: boolean
}

/** Posiziona un'etichetta di gap (con eventuale pillola di sfondo) evitando collisioni ed E_F. */
export function placeGapLabelBox(ctx: CanvasRenderingContext2D, opts: PlaceGapLabelOptions): RectBox {
  const size = opts.size ?? 12.5
  const w = opts.rich
    ? measureRichText(ctx, opts.text, { size })
    : measureMathText(ctx, opts.text, size)
  const halfW = w / 2
  const asc = size * 0.85
  const desc = size * 0.35
  const clampCx = (cx: number): number =>
    Math.max(opts.minX + halfW + 4, Math.min(opts.maxX - halfW - 4, cx))
  const clampBaseY = (by: number): number =>
    Math.max(opts.minY + asc + 2, Math.min(opts.maxY - desc - 2, by))

  const basePref = opts.preferredY + size * 0.35
  const dyStep = size * 1.35
  const dxStep = halfW + 18
  const candidates: Array<{ cx: number; baseY: number }> = [
    { cx: clampCx(opts.centerX), baseY: clampBaseY(basePref) },
    { cx: clampCx(opts.centerX), baseY: clampBaseY(basePref - dyStep) },
    { cx: clampCx(opts.centerX), baseY: clampBaseY(basePref + dyStep) },
    { cx: clampCx(opts.centerX - dxStep), baseY: clampBaseY(basePref) },
    { cx: clampCx(opts.centerX + dxStep), baseY: clampBaseY(basePref) },
    { cx: clampCx(opts.centerX - dxStep), baseY: clampBaseY(basePref - dyStep) },
    { cx: clampCx(opts.centerX + dxStep), baseY: clampBaseY(basePref + dyStep) }
  ]

  const boxFor = (c: { cx: number; baseY: number }): RectBox => ({
    x0: c.cx - halfW - 3,
    y0: c.baseY - asc,
    x1: c.cx + halfW + 3,
    y1: c.baseY + desc
  })

  const conflictsFermi = (b: RectBox): boolean =>
    opts.fermiY != null && opts.fermiY >= b.y0 - 4 && opts.fermiY <= b.y1 + 4

  let best = candidates[0]
  let bestScore = Infinity
  for (const c of candidates) {
    const b = boxFor(c)
    let score = 0
    for (const occ of opts.occupied) {
      if (boxesOverlap(b, occ, 3)) score += 10
    }
    if (conflictsFermi(b)) score += 3
    if (score < bestScore) {
      bestScore = score
      best = c
      if (score === 0) break
    }
  }

  const finalBox = boxFor(best)
  if (opts.rich) {
    drawRichText(ctx, opts.text, best.cx, best.baseY, {
      size,
      color: opts.color,
      align: 'center',
      backdrop: opts.backdrop
    })
  } else {
    drawMathText(ctx, opts.text, best.cx, best.baseY, {
      size,
      color: opts.color,
      align: 'center',
      backdrop: opts.backdrop
    })
  }
  opts.occupied.push(finalBox)
  if (opts.fermiSkips && conflictsFermi(finalBox)) {
    opts.fermiSkips.push({ x0: finalBox.x0, x1: finalBox.x1 })
  }
  return finalBox
}

export interface PlaceProbeLabelOptions {
  readonly text: string
  readonly size?: number
  readonly color: string
  readonly backdrop: string
  readonly anchorX: number
  readonly anchorY: number
  readonly minX: number
  readonly maxX: number
  readonly minY: number
  readonly maxY: number
  readonly occupied: RectBox[]
  readonly curvePoints?: readonly { readonly x: number; readonly y: number }[]
  readonly rich?: boolean
}

/** Posiziona l'etichetta di una sonda (k, E, m*) evitando curve e altre etichette. */
export function placeProbeLabel(ctx: CanvasRenderingContext2D, opts: PlaceProbeLabelOptions): RectBox {
  const size = opts.size ?? 12.5
  const w = opts.rich
    ? measureRichText(ctx, opts.text, { size })
    : measureMathText(ctx, opts.text, size)
  const asc = size * 0.9
  const desc = size * 0.35
  const offsets: Array<{ dx: number; dy: number; align: 'left' | 'right' | 'center' }> = [
    { dx: 10, dy: -10, align: 'left' },
    { dx: -10, dy: -10, align: 'right' },
    { dx: 10, dy: 18, align: 'left' },
    { dx: -10, dy: 18, align: 'right' },
    { dx: 14, dy: -22, align: 'left' },
    { dx: -14, dy: -22, align: 'right' },
    { dx: 0, dy: -18, align: 'center' },
    { dx: 0, dy: 22, align: 'center' }
  ]

  const makeCandidate = (off: { dx: number; dy: number; align: 'left' | 'right' | 'center' }) => {
    const rawX = opts.anchorX + off.dx
    let x0 =
      off.align === 'left' ? rawX : off.align === 'right' ? rawX - w : rawX - w / 2
    x0 = Math.max(opts.minX + 3, Math.min(opts.maxX - w - 3, x0))
    const baseY = Math.max(opts.minY + asc + 2, Math.min(opts.maxY - desc - 2, opts.anchorY + off.dy))
    return {
      x: off.align === 'left' ? x0 : off.align === 'right' ? x0 + w : x0 + w / 2,
      baseY,
      align: off.align,
      box: { x0: x0 - 3, y0: baseY - asc, x1: x0 + w + 3, y1: baseY + desc }
    }
  }

  let best = makeCandidate(offsets[0])
  let bestScore = Infinity
  for (const off of offsets) {
    const cand = makeCandidate(off)
    let score = 0
    for (const occ of opts.occupied) {
      if (boxesOverlap(cand.box, occ, 3)) score += 20
    }
    if (opts.curvePoints) {
      let curveHits = 0
      for (const p of opts.curvePoints) {
        if (p.x >= cand.box.x0 - 3 && p.x <= cand.box.x1 + 3 && p.y >= cand.box.y0 - 3 && p.y <= cand.box.y1 + 3) {
          curveHits++
        }
      }
      score += Math.min(curveHits, 10) * 2
    }
    if (score < bestScore) {
      bestScore = score
      best = cand
      if (score === 0) break
    }
  }

  if (opts.rich) {
    drawRichText(ctx, opts.text, best.x, best.baseY, {
      size,
      color: opts.color,
      align: best.align,
      backdrop: opts.backdrop
    })
  } else {
    drawMathText(ctx, opts.text, best.x, best.baseY, {
      size,
      color: opts.color,
      align: best.align,
      backdrop: opts.backdrop
    })
  }
  opts.occupied.push(best.box)
  return best.box
}

export interface PolylinePoint {
  readonly x: number
  readonly y: number
}

/**
 * Mappa degli ingombri di un grafico: curve (spezzate in pixel) e riquadri già occupati,
 * rasterizzati su una griglia fine con somme cumulate, così il costo di un riquadro
 * candidato si legge in tempo costante.
 */
export interface ObstacleMap {
  readonly x0: number
  readonly y0: number
  readonly x1: number
  readonly y1: number
  readonly cell: number
  readonly cols: number
  readonly rows: number
  readonly sat: Float32Array
}

const OBSTACLE_CELL = 3

export function buildObstacleMap(
  bounds: RectBox,
  polylines: readonly (readonly PolylinePoint[])[],
  rects: readonly RectBox[] = [],
  weights: { readonly curve?: number; readonly rect?: number } = {}
): ObstacleMap {
  const cell = OBSTACLE_CELL
  const cols = Math.max(1, Math.ceil((bounds.x1 - bounds.x0) / cell))
  const rows = Math.max(1, Math.ceil((bounds.y1 - bounds.y0) / cell))
  const grid = new Float32Array(cols * rows)
  const wCurve = weights.curve ?? 3
  const wRect = weights.rect ?? 12

  const mark = (x: number, y: number, w: number): void => {
    const c = Math.floor((x - bounds.x0) / cell)
    const r = Math.floor((y - bounds.y0) / cell)
    if (c < 0 || r < 0 || c >= cols || r >= rows) return
    const i = r * cols + c
    if (grid[i] < w) grid[i] = w
  }

  for (const line of polylines) {
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1]
      const b = line[i]
      if (!Number.isFinite(a.x + a.y + b.x + b.y)) continue
      const len = Math.hypot(b.x - a.x, b.y - a.y)
      const steps = Math.min(4000, Math.max(1, Math.ceil(len / (cell * 0.5))))
      for (let s = 0; s <= steps; s++) mark(a.x + ((b.x - a.x) * s) / steps, a.y + ((b.y - a.y) * s) / steps, wCurve)
    }
  }
  for (const rc of rects) {
    const c0 = Math.max(0, Math.floor((rc.x0 - bounds.x0) / cell))
    const c1 = Math.min(cols - 1, Math.floor((rc.x1 - bounds.x0) / cell))
    const r0 = Math.max(0, Math.floor((rc.y0 - bounds.y0) / cell))
    const r1 = Math.min(rows - 1, Math.floor((rc.y1 - bounds.y0) / cell))
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const i = r * cols + c
        if (grid[i] < wRect) grid[i] = wRect
      }
    }
  }

  const stride = cols + 1
  const sat = new Float32Array(stride * (rows + 1))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      sat[(r + 1) * stride + (c + 1)] =
        grid[r * cols + c] + sat[r * stride + (c + 1)] + sat[(r + 1) * stride + c] - sat[r * stride + c]
    }
  }
  return { x0: bounds.x0, y0: bounds.y0, x1: bounds.x1, y1: bounds.y1, cell, cols, rows, sat }
}

/** Ingombro totale (curve e riquadri) dentro un rettangolo; fuori mappa conta zero. */
export function obstacleCost(map: ObstacleMap, box: RectBox): number {
  const c0 = Math.max(0, Math.floor((box.x0 - map.x0) / map.cell))
  const c1 = Math.min(map.cols, Math.ceil((box.x1 - map.x0) / map.cell))
  const r0 = Math.max(0, Math.floor((box.y0 - map.y0) / map.cell))
  const r1 = Math.min(map.rows, Math.ceil((box.y1 - map.y0) / map.cell))
  if (c1 <= c0 || r1 <= r0) return 0
  const stride = map.cols + 1
  return map.sat[r1 * stride + c1] - map.sat[r0 * stride + c1] - map.sat[r1 * stride + c0] + map.sat[r0 * stride + c0]
}

export interface PlaceFreeLabelOptions {
  readonly text: string
  readonly size?: number
  readonly color: string
  /** Fondo opaco dietro il testo. */
  readonly backdrop: string
  readonly rich?: boolean
  /** Punto del grafico a cui l'etichetta si riferisce. */
  readonly anchor: PolylinePoint
  readonly obstacles: ObstacleMap
  /** Area in cui l'etichetta può stare (di norma l'area del grafico). */
  readonly region: RectBox
  /** Peso della distanza dall'ancora rispetto agli ingombri (default 0,05 per pixel). */
  readonly distWeight?: number
  /** Riquadri già occupati: il nuovo viene aggiunto. */
  readonly occupied?: RectBox[]
  /** Colore del trattino di richiamo, se l'etichetta finisce lontana dall'ancora. */
  readonly leaderColor?: string
  /** Se false non disegna mai il trattino di richiamo (etichette senza oggetto a cui puntare). */
  readonly leader?: boolean
}

/**
 * Cerca nell'area indicata la posizione libera più vicina all'ancora (meno curve e
 * riquadri sotto il testo), disegna l'etichetta su fondo opaco e, se è finita lontana
 * dall'ancora, un trattino di richiamo. Le linee restano dove sono: si sposta solo il testo.
 */
export function placeFreeLabel(ctx: CanvasRenderingContext2D, opts: PlaceFreeLabelOptions): RectBox {
  const size = opts.size ?? 11
  const textW = opts.rich ? measureRichText(ctx, opts.text, { size }) : measureMathText(ctx, opts.text, size)
  const w = textW + 6
  const h = size * 1.25
  const pad = 3
  const step = OBSTACLE_CELL
  const dw = opts.distWeight ?? 0.05
  const reg = opts.region

  let bestX = Math.min(Math.max(opts.anchor.x - w / 2, reg.x0), Math.max(reg.x0, reg.x1 - w))
  let bestY = Math.min(Math.max(opts.anchor.y - h / 2, reg.y0), Math.max(reg.y0, reg.y1 - h))
  let bestCost = Infinity
  for (let y = reg.y0; y + h <= reg.y1 + 0.5; y += step) {
    for (let x = reg.x0; x + w <= reg.x1 + 0.5; x += step) {
      const cost =
        obstacleCost(opts.obstacles, { x0: x - pad, y0: y - pad, x1: x + w + pad, y1: y + h + pad }) +
        dw * Math.hypot(x + w / 2 - opts.anchor.x, y + h / 2 - opts.anchor.y)
      if (cost < bestCost) {
        bestCost = cost
        bestX = x
        bestY = y
      }
    }
  }

  const box: RectBox = { x0: bestX, y0: bestY, x1: bestX + w, y1: bestY + h }

  // Trattino di richiamo dal punto del riquadro più vicino all'ancora
  const nx = Math.min(Math.max(opts.anchor.x, box.x0), box.x1)
  const ny = Math.min(Math.max(opts.anchor.y, box.y0), box.y1)
  if (opts.leader !== false && Math.hypot(opts.anchor.x - nx, opts.anchor.y - ny) > 5) {
    ctx.save()
    ctx.strokeStyle = opts.leaderColor ?? opts.color
    ctx.globalAlpha = 0.75
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(nx, ny)
    ctx.lineTo(opts.anchor.x, opts.anchor.y)
    ctx.stroke()
    ctx.restore()
  }

  const baseY = box.y0 + size * 0.9
  if (opts.rich) {
    drawRichText(ctx, opts.text, box.x0 + 3, baseY, { size, color: opts.color, align: 'left', backdrop: opts.backdrop })
  } else {
    drawMathText(ctx, opts.text, box.x0 + 3, baseY, { size, color: opts.color, align: 'left', backdrop: opts.backdrop })
  }
  opts.occupied?.push(box)
  return box
}

/** Testo d'interfaccia (sans) su canvas. */
export function sansFont(size: number, weight = 400): string {
  return `${weight} ${size}px ${FONTS.sans}`
}

/** Passo «tondo» (1, 2, 5 × 10ⁿ) per circa `target` tacche su `span`. */
export function niceStep(span: number, target: number): number {
  const raw = span / Math.max(1, target)
  const p = Math.pow(10, Math.floor(Math.log10(raw)))
  const m = raw / p
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p
}

/** Colore esadecimale (#rrggbb) con trasparenza. */
export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}
