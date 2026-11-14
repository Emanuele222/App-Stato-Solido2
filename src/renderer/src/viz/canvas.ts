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

interface Run {
  readonly text: string
  readonly sub: boolean
}

/** «E_{F}», «2|V_{G}|», «−π/a»: testo con pedici `_{…}`. Restituisce la larghezza. */
export function drawMathText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: MathTextOptions
): number {
  const size = options.size ?? 15
  const runs = parseRuns(text)
  const fontFor = (sub: boolean): string =>
    `${options.italic === false ? '' : 'italic '}${sub ? Math.round(size * 0.7) : size}px ${
      options.italic === false ? FONTS.mathUpright : FONTS.math
    }`
  let width = 0
  const widths = runs.map((r) => {
    ctx.font = fontFor(r.sub)
    const w = ctx.measureText(r.text).width + (r.sub ? 1 : 0)
    width += w
    return w
  })
  let x0 = x
  if (options.align === 'center') x0 = x - width / 2
  else if (options.align === 'right') x0 = x - width
  ctx.save()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  if (options.backdrop) {
    ctx.fillStyle = options.backdrop
    ctx.fillRect(x0 - 3, y - size * 0.85, width + 6, size * 1.2)
  }
  ctx.fillStyle = options.color
  let cx = x0
  runs.forEach((r, i) => {
    ctx.font = fontFor(r.sub)
    ctx.fillText(r.text, cx + (r.sub ? 1 : 0), r.sub ? y + size * 0.22 : y)
    cx += widths[i]
  })
  ctx.restore()
  return width
}

function parseRuns(text: string): Run[] {
  const runs: Run[] = []
  let i = 0
  let buf = ''
  while (i < text.length) {
    if (text[i] === '_' && text[i + 1] === '{') {
      if (buf) runs.push({ text: buf, sub: false })
      buf = ''
      const end = text.indexOf('}', i + 2)
      runs.push({ text: text.slice(i + 2, end < 0 ? text.length : end), sub: true })
      i = end < 0 ? text.length : end + 1
    } else {
      buf += text[i]
      i++
    }
  }
  if (buf) runs.push({ text: buf, sub: false })
  return runs
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
