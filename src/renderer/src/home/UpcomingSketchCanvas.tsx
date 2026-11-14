/**
 * Illustrazioni statiche per i 4 capitoli bloccati «in arrivo».
 *
 * Tutte generate da codice su Canvas 2D:
 * 1. Cristallografia: punti del reticolo (reticolo 2D con cella unitaria)
 * 2. Reticolo reciproco e diffrazione: macchie di diffrazione (pattern simmetrico con fascio centrale)
 * 3. Fononi: catena di atomi oscillante (fotogramma d'onda con molle e spostamenti)
 * 4. Semiconduttori: due bande (valenza e conduzione) con livelli di drogaggio nel gap
 */
import type { JSX } from 'react'
import { QUANTITIES, TOKENS } from '../ui/theme'
import { drawMathText, useCanvasDraw, withAlpha, type CanvasSize } from '../viz/canvas'

export type UpcomingSketchKind =
  | 'crystallography'
  | 'reciprocal-diffraction'
  | 'phonons'
  | 'semiconductors'

export function UpcomingSketchCanvas({ kind }: { kind: UpcomingSketchKind }): JSX.Element {
  const canvasRef = useCanvasDraw((ctx, size) => {
    drawUpcomingSketch(ctx, size, kind)
    return false // Disegno statico, non richiede ciclo di animazione continuo
  })

  return <canvas ref={canvasRef} className="upcoming-sketch-canvas" aria-hidden="true" />
}

function drawUpcomingSketch(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  kind: UpcomingSketchKind
): void {
  const { w, h } = size
  if (w <= 0 || h <= 0) return

  switch (kind) {
    case 'crystallography':
      drawCrystallography(ctx, w, h)
      break
    case 'reciprocal-diffraction':
      drawReciprocalDiffraction(ctx, w, h)
      break
    case 'phonons':
      drawPhonons(ctx, w, h)
      break
    case 'semiconductors':
      drawSemiconductors(ctx, w, h)
      break
  }
}

/** Punti del reticolo cristallino con reticolo 2D e cella elementare */
function drawCrystallography(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const rows = 4
  const cols = 6
  const dx = w / (cols + 1)
  const dy = h / (rows + 1)
  const shear = 0.25 * dx

  // Linee di reticolo
  ctx.strokeStyle = withAlpha(TOKENS.line, 0.8)
  ctx.lineWidth = 1
  for (let r = 0; r < rows; r++) {
    const y = dy * (r + 1)
    ctx.beginPath()
    ctx.moveTo(dx * 0.8 + r * shear, y)
    ctx.lineTo(dx * cols + 0.2 * dx + r * shear, y)
    ctx.stroke()
  }

  for (let c = 0; c < cols; c++) {
    const xBase = dx * (c + 1)
    ctx.beginPath()
    ctx.moveTo(xBase, dy)
    ctx.lineTo(xBase + (rows - 1) * shear, dy * rows)
    ctx.stroke()
  }

  // Cella primitiva evidenziata
  const r0 = 1
  const c0 = 2
  const p0x = dx * (c0 + 1) + r0 * shear
  const p0y = dy * (r0 + 1)
  const p1x = dx * (c0 + 2) + r0 * shear
  const p1y = dy * (r0 + 1)
  const p2x = dx * (c0 + 2) + (r0 + 1) * shear
  const p2y = dy * (r0 + 2)
  const p3x = dx * (c0 + 1) + (r0 + 1) * shear
  const p3y = dy * (r0 + 2)

  ctx.fillStyle = withAlpha(QUANTITIES.a.color, 0.12)
  ctx.strokeStyle = withAlpha(QUANTITIES.a.color, 0.6)
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(p0x, p0y)
  ctx.lineTo(p1x, p1y)
  ctx.lineTo(p2x, p2y)
  ctx.lineTo(p3x, p3y)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Nodi del reticolo (atomi)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = dx * (c + 1) + r * shear
      const cy = dy * (r + 1)
      const isCell = (r === r0 || r === r0 + 1) && (c === c0 || c === c0 + 1)

      ctx.fillStyle = isCell ? QUANTITIES.a.color : TOKENS.muted
      ctx.beginPath()
      ctx.arc(cx, cy, isCell ? 3.5 : 2.5, 0, 2 * Math.PI)
      ctx.fill()
    }
  }

  // Vettori di base a_1 e a_2
  drawVector(ctx, p0x, p0y, p1x, p1y, QUANTITIES.a.color)
  drawVector(ctx, p0x, p0y, p3x, p3y, QUANTITIES.a.color)
}

/** Macchie di diffrazione (pattern di Laue / reticolo reciproco) */
function drawReciprocalDiffraction(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2
  const cy = h / 2

  // Anelli di diffrazione molto tenui
  const rings = [32, 54, 76]
  ctx.strokeStyle = withAlpha(TOKENS.line, 0.5)
  ctx.setLineDash([2, 4])
  for (const r of rings) {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, 2 * Math.PI)
    ctx.stroke()
  }
  ctx.setLineDash([])

  // Assi di simmetria tenui
  ctx.strokeStyle = withAlpha(TOKENS.line, 0.4)
  ctx.beginPath()
  ctx.moveTo(cx - 85, cy)
  ctx.lineTo(cx + 85, cy)
  ctx.moveTo(cx, cy - 65)
  ctx.lineTo(cx, cy + 65)
  ctx.stroke()

  // Punti di diffrazione (h, k) con simmetria quadrata/esagonale
  const spots = [
    // Raggio 1 (basso ordine)
    { dx: 32, dy: 0, r: 2.8, a: 0.85 },
    { dx: -32, dy: 0, r: 2.8, a: 0.85 },
    { dx: 0, dy: 32, r: 2.8, a: 0.85 },
    { dx: 0, dy: -32, r: 2.8, a: 0.85 },
    // Diagonali ordine 1
    { dx: 26, dy: 26, r: 2.4, a: 0.7 },
    { dx: -26, dy: 26, r: 2.4, a: 0.7 },
    { dx: 26, dy: -26, r: 2.4, a: 0.7 },
    { dx: -26, dy: -26, r: 2.4, a: 0.7 },
    // Raggio 2
    { dx: 54, dy: 0, r: 2.5, a: 0.65 },
    { dx: -54, dy: 0, r: 2.5, a: 0.65 },
    { dx: 0, dy: 54, r: 2.5, a: 0.65 },
    { dx: 0, dy: -54, r: 2.5, a: 0.65 },
    { dx: 48, dy: 24, r: 2.0, a: 0.55 },
    { dx: -48, dy: 24, r: 2.0, a: 0.55 },
    { dx: 48, dy: -24, r: 2.0, a: 0.55 },
    { dx: -48, dy: -24, r: 2.0, a: 0.55 },
    { dx: 24, dy: 48, r: 2.0, a: 0.55 },
    { dx: -24, dy: 48, r: 2.0, a: 0.55 },
    { dx: 24, dy: -48, r: 2.0, a: 0.55 },
    { dx: -24, dy: -48, r: 2.0, a: 0.55 },
    // Raggio 3
    { dx: 72, dy: 25, r: 1.6, a: 0.4 },
    { dx: -72, dy: 25, r: 1.6, a: 0.4 },
    { dx: 72, dy: -25, r: 1.6, a: 0.4 },
    { dx: -72, dy: -25, r: 1.6, a: 0.4 }
  ]

  for (const s of spots) {
    ctx.fillStyle = withAlpha(QUANTITIES.k.color, s.a)
    ctx.beginPath()
    ctx.arc(cx + s.dx, cy + s.dy, s.r, 0, 2 * Math.PI)
    ctx.fill()
  }

  // Fascio trasmesso centrale (fascio primario)
  ctx.fillStyle = TOKENS.text
  ctx.beginPath()
  ctx.arc(cx, cy, 3.5, 0, 2 * Math.PI)
  ctx.fill()
  ctx.strokeStyle = withAlpha(TOKENS.dim, 0.7)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(cx, cy, 7, 0, 2 * Math.PI)
  ctx.stroke()
}

/** Catena lineare di atomi con onda stazionaria di oscillazione */
function drawPhonons(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const nAtoms = 10
  const yCenter = h * 0.52
  const xStart = 28
  const xEnd = w - 28
  const span = xEnd - xStart
  const dx = span / (nAtoms - 1)
  const amplitude = Math.min(22, h * 0.22)
  const waveVector = (2 * Math.PI) / span

  // Linea di equilibrio tratteggiata
  ctx.strokeStyle = withAlpha(TOKENS.line, 0.7)
  ctx.setLineDash([3, 4])
  ctx.beginPath()
  ctx.moveTo(xStart, yCenter)
  ctx.lineTo(xEnd, yCenter)
  ctx.stroke()
  ctx.setLineDash([])

  // Profilo d'onda sinusoidale u(x) = A sin(kx)
  ctx.strokeStyle = withAlpha(QUANTITIES.v.color, 0.45)
  ctx.lineWidth = 1.2
  ctx.beginPath()
  for (let x = xStart; x <= xEnd; x += 2) {
    const u = amplitude * Math.sin(waveVector * (x - xStart))
    if (x === xStart) ctx.moveTo(x, yCenter - u)
    else ctx.lineTo(x, yCenter - u)
  }
  ctx.stroke()

  // Connessioni elastiche (molle) tra gli atomi
  const atomPositions: { x: number; y: number }[] = []
  for (let i = 0; i < nAtoms; i++) {
    const xEq = xStart + i * dx
    const u = amplitude * Math.sin(waveVector * (xEq - xStart))
    atomPositions.push({ x: xEq, y: yCenter - u })
  }

  ctx.strokeStyle = withAlpha(TOKENS.dim, 0.6)
  ctx.lineWidth = 1
  for (let i = 0; i < nAtoms - 1; i++) {
    drawSpring(ctx, atomPositions[i].x, atomPositions[i].y, atomPositions[i + 1].x, atomPositions[i + 1].y)
  }

  // Atomi oscillanti
  for (let i = 0; i < nAtoms; i++) {
    const p = atomPositions[i]

    // Lineetta di spostamento dalla posizione di riposo
    ctx.strokeStyle = withAlpha(QUANTITIES.psi.color, 0.5)
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(p.x, yCenter)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()

    // Sfera atomica
    ctx.fillStyle = QUANTITIES.psi.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI)
    ctx.fill()
  }
}

/** Disegna una molla a zig-zag tra due punti */
function drawSpring(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  const dX = x2 - x1
  const dY = y2 - y1
  const dist = Math.hypot(dX, dY)
  if (dist < 10) return

  const angle = Math.atan2(dY, dX)
  const coils = 4
  const rStart = 6
  const rEnd = dist - 6
  const coilSpan = rEnd - rStart

  ctx.save()
  ctx.translate(x1, y1)
  ctx.rotate(angle)

  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(rStart, 0)

  for (let c = 0; c < coils; c++) {
    const seg = coilSpan / coils
    const sX = rStart + c * seg
    ctx.lineTo(sX + seg * 0.25, -3)
    ctx.lineTo(sX + seg * 0.75, 3)
    ctx.lineTo(sX + seg, 0)
  }

  ctx.lineTo(dist, 0)
  ctx.stroke()
  ctx.restore()
}

/** Semiconduttori: due bande (valenza e conduzione) con livelli di drogaggio nel gap */
function drawSemiconductors(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const padX = 24
  const plotW = w - 2 * padX
  const kMid = padX + plotW / 2

  // Bande di conduzione (sopra, curva convessa) e valenza (sotto, curva concava)
  const yCondMin = h * 0.28
  const yValMax = h * 0.72

  // Banda di conduzione Ec
  ctx.strokeStyle = QUANTITIES.E.color
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let x = padX; x <= w - padX; x += 2) {
    const kRel = (x - kMid) / (plotW / 2)
    const y = yCondMin - 16 * (1 - kRel * kRel * 1.5)
    if (x === padX) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  // Banda di valenza Ev
  ctx.beginPath()
  for (let x = padX; x <= w - padX; x += 2) {
    const kRel = (x - kMid) / (plotW / 2)
    const y = yValMax + 16 * (1 - kRel * kRel * 1.5)
    if (x === padX) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  // Riempimento valenza tenue
  ctx.fillStyle = withAlpha(QUANTITIES.E.color, 0.08)
  ctx.beginPath()
  ctx.moveTo(padX, h - 8)
  for (let x = padX; x <= w - padX; x += 2) {
    const kRel = (x - kMid) / (plotW / 2)
    const y = yValMax + 16 * (1 - kRel * kRel * 1.5)
    ctx.lineTo(x, y)
  }
  ctx.lineTo(w - padX, h - 8)
  ctx.closePath()
  ctx.fill()

  // Livello donatore E_d (appena sotto E_c)
  const yDonor = yCondMin + 14
  ctx.strokeStyle = QUANTITIES.EF.color
  ctx.lineWidth = 1.2
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(padX + 20, yDonor)
  ctx.lineTo(w - padX - 20, yDonor)
  ctx.stroke()

  // Livello accettore E_a (appena sopra E_v)
  const yAcceptor = yValMax - 14
  ctx.strokeStyle = QUANTITIES.VG.color
  ctx.beginPath()
  ctx.moveTo(padX + 20, yAcceptor)
  ctx.lineTo(w - padX - 20, yAcceptor)
  ctx.stroke()
  ctx.setLineDash([])

  // Elettroni donatori e buche accettatrici (pallini)
  ctx.fillStyle = QUANTITIES.EF.color
  for (const dx of [-40, -10, 20, 50]) {
    ctx.beginPath()
    ctx.arc(kMid + dx, yDonor, 2.5, 0, 2 * Math.PI)
    ctx.fill()
  }

  ctx.fillStyle = QUANTITIES.VG.color
  for (const dx of [-30, 0, 30]) {
    ctx.beginPath()
    ctx.arc(kMid + dx, yAcceptor, 2.5, 0, 2 * Math.PI)
    ctx.fill()
  }

  // Etichette matematiche E_c, E_v, E_g
  drawMathText(ctx, 'E_{c}', padX + 2, yCondMin - 6, {
    color: TOKENS.muted,
    size: 11
  })
  drawMathText(ctx, 'E_{v}', padX + 2, yValMax + 16, {
    color: TOKENS.muted,
    size: 11
  })
  drawMathText(ctx, 'E_{d}', w - padX - 16, yDonor - 2, {
    color: QUANTITIES.EF.color,
    size: 10
  })
  drawMathText(ctx, 'E_{a}', w - padX - 16, yAcceptor + 11, {
    color: QUANTITIES.VG.color,
    size: 10
  })
}

function drawVector(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string
): void {
  const angle = Math.atan2(y1 - y0, x1 - x0)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 1.5

  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()

  const headLen = 6
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(
    x1 - headLen * Math.cos(angle - Math.PI / 6),
    y1 - headLen * Math.sin(angle - Math.PI / 6)
  )
  ctx.lineTo(
    x1 - headLen * Math.cos(angle + Math.PI / 6),
    y1 - headLen * Math.sin(angle + Math.PI / 6)
  )
  ctx.closePath()
  ctx.fill()
}
