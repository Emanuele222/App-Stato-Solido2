/**
 * Vista spazio reale della catena monatomica 1D (dispensa Parte 6, Figg. 2, 4, 5, 14):
 * - Modalità catena lineare: atomi di massa M, molle C, quote di equilibrio x_n⁰ = na,
 *   frecce longitudinali u_n(t) e profilo d'onda continuo campionato sugli atomi;
 *   con Aliasing attivo sovrappone l'onda equivalente k' = k ± G che coincide sugli atomi.
 * - Modalità anello di Born–von Kármán: N atomi e N molle chiusi ad anello (u_{n+N} = u_n),
 *   senza estremi, che oscillano nel modo quantizzato k_j = 2πj/(Na).
 *
 * Rispetta `prefers-reduced-motion` tramite PlaybackControls/usePlaybackPhase e
 * non lascia cicli requestAnimationFrame attivi a riposo o in pausa.
 * Nessun colore hex hardcoded: tutti i colori vengono da ui/theme.ts.
 */
import { memo, useCallback, useMemo, useRef, type JSX } from 'react'
import { monatomicDisplacements, monatomicWaveProfile } from '../../physics'
import { RichText } from '../../ui/tex'
import { quantityColor, TOKENS, type QuantityId } from '../../ui/theme'
import { ChartLegend, type LegendEntry } from '../../viz/ChartLegend'
import { drawMathText, measureMathText, sansFont, useCanvasDraw, withAlpha } from '../../viz/canvas'
import { PlaybackControls, usePlaybackPhase } from '../../viz/PlaybackControls'
import { NUMERICS } from './manifest'
import { strings as s } from './strings'
import './phonon-monatomic.css'

export interface MonatomicChainViewProps {
  /** Passo reticolare a (Å). */
  readonly a: number
  /** Massa atomica M (u). */
  readonly massAmu: number
  /** Costante elastica C (N/m). */
  readonly springC: number
  /** Vettore d'onda selezionato k (Å⁻¹). */
  readonly k: number
  /** Frazione di bordo zona k / (π/a). */
  readonly kFrac: number
  /** Pulsazione ω(k) in rad·s⁻¹. */
  readonly omegaRadS: number
  /** Pulsazione massima ω_max in rad·s⁻¹. */
  readonly omegaMaxRadS: number
  /** Vettore equivalente k' = k ± G (Å⁻¹). */
  readonly aliasK: number
  /** Mostra l'onda aliasata k' = k ± G sopra la catena. */
  readonly showAliasing: boolean
  /** Chiude la catena ad anello di Born–von Kármán con N atomi. */
  readonly bvkMode: boolean
  /** Numero di atomi nell'anello N (quando bvkMode è attivo). */
  readonly bvkN: number
  /** Indice j del modo Born–von Kármán. */
  readonly bvkJ: number | null
  readonly highlight: QuantityId | null
  readonly onQuickSelect: (kFrac: number) => void
}

const DIM = 0.26

/** Disegna una molla a zig-zag piatta tra (x1, y1) e (x2, y2). */
function drawZigZagSpring(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  coils: number,
  amp: number
): void {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len < 6) {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    return
  }
  const ux = dx / len
  const uy = dy / len
  const nx = -uy
  const ny = ux
  const lead = Math.min(6, len * 0.14)
  const bodyLen = Math.max(2, len - 2 * lead)
  const steps = Math.max(4, coils * 2)

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 + ux * lead, y1 + uy * lead)
  for (let i = 1; i < steps; i++) {
    const t = lead + (bodyLen * i) / steps
    const side = i % 2 === 1 ? 1 : -1
    ctx.lineTo(x1 + ux * t + nx * side * amp, y1 + uy * t + ny * side * amp)
  }
  ctx.lineTo(x2 - ux * lead, y2 - uy * lead)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

/** Disegna una freccia netta con punta triangolare da (x1, y1) a (x2, y2). */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  headLen = 5.5
): void {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len < 3) return
  const ux = dx / len
  const uy = dy / len
  const nx = -uy
  const ny = ux
  const hl = Math.min(headLen, len * 0.45)
  const hw = hl * 0.58
  const bx = x2 - ux * hl
  const by = y2 - uy * hl

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(bx, by)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(bx + nx * hw, by + ny * hw)
  ctx.lineTo(bx - nx * hw, by - ny * hw)
  ctx.closePath()
  ctx.fill()
}

export const MonatomicChainView = memo(function MonatomicChainView(
  props: MonatomicChainViewProps
): JSX.Element {
  const playback = usePlaybackPhase({ initialPlaying: true, initialSpeed: 1 })
  // Fase visiva integrata con la pulsazione corrente (in radianti), così variare k/C/M non fa saltare la fase
  const phaseRadRef = useRef(0)

  const handleReset = useCallback(() => {
    phaseRadRef.current = 0
    playback.resetPhase()
  }, [playback.resetPhase])

  const legend = useMemo<readonly LegendEntry[]>(() => {
    const entries: LegendEntry[] = [
      { id: 'atoms', keyKind: 'dot', color: 'var(--q-M)', label: <RichText text={s.scene.legendAtoms} /> },
      { id: 'springs', keyKind: 'solid', color: 'var(--q-C)', label: <RichText text={s.scene.legendSprings} /> },
      { id: 'wave-k', keyKind: 'solid', color: 'var(--q-u)', label: <RichText text={s.scene.legendWaveK} /> }
    ]
    if (props.showAliasing && !props.bvkMode) {
      entries.push({
        id: 'wave-alias',
        keyKind: 'dashed',
        color: 'var(--q-k)',
        label: <RichText text={s.scene.legendWaveAlias} />
      })
    }
    return entries
  }, [props.showAliasing, props.bvkMode])

  const canvasRef = useCanvasDraw((ctx, { w, h }, dt) => {
    const p = props
    const isOrigin = Math.abs(p.kFrac) < 1e-4

    // Velocità angolare visiva proporzionale a ω(k), modulata dolcemente da ω_max/ω_max,rif
    const omegaRatio = p.omegaMaxRadS > 0 ? p.omegaRadS / p.omegaMaxRadS : 0
    const scaleFactor = Math.sqrt(Math.max(0.2, p.omegaMaxRadS / NUMERICS.refOmegaMaxRadS))
    const visOmega = Math.min(2 * Math.PI * 1.85, 2 * Math.PI * 0.72 * omegaRatio * scaleFactor)

    const shouldAnimate = playback.effectivePlaying && !isOrigin && visOmega > 1e-4
    if (shouldAnimate) {
      phaseRadRef.current = (phaseRadRef.current + dt * playback.speed * visOmega) % (2 * Math.PI)
    }
    const phase = isOrigin ? 0 : phaseRadRef.current

    const em = (q: QuantityId): number => (p.highlight === null || p.highlight === q ? 1 : DIM)
    const lw = (q: QuantityId, base: number): number => (p.highlight === q ? base + 1.1 : base)

    // Raggio qualitativo dell'atomo legato a M^(1/3) (C < metallo < Pb)
    const massScale = Math.min(1, Math.max(0, (Math.cbrt(p.massAmu) - 2.1) / 3.9))

    if (p.bvkMode) {
      drawBvkRing(ctx, w, h, p, phase, massScale, em, lw)
    } else {
      drawLinearChain(ctx, w, h, p, phase, massScale, em, lw)
    }

    return shouldAnimate
  })

  const quickItems: readonly { readonly kFrac: number; readonly label: string }[] = [
    { kFrac: 0, label: s.quickModes.origin },
    { kFrac: 0.5, label: s.quickModes.half },
    { kFrac: 1, label: s.quickModes.edge }
  ]

  return (
    <div className="phonon-mono-chain-view">
      <div className="phonon-mono-chain-bar">
        <ChartLegend entries={legend} ariaLabel={s.scene.legendChainAria} />
        <div className="phonon-mono-chain-controls">
          <div className="phonon-mono-quick" role="group" aria-label={s.quickModes.group}>
            {quickItems.map((item) => {
              const active = Math.abs(props.kFrac - item.kFrac) < 1e-3
              return (
                <button
                  key={item.kFrac}
                  type="button"
                  className="phonon-mono-quick-btn num"
                  aria-pressed={active}
                  onClick={() => props.onQuickSelect(item.kFrac)}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
          <PlaybackControls
            playing={playback.playing}
            speed={playback.speed}
            onTogglePlay={playback.togglePlay}
            onSpeedChange={playback.setSpeed}
            onReset={handleReset}
          />
        </div>
      </div>
      <div className="phonon-mono-chain-stage">
        <canvas
          ref={canvasRef}
          className="phonon-mono-chain-canvas"
          role="img"
          aria-label={props.bvkMode ? s.scene.ringAria : s.scene.chainAria}
        />
      </div>
    </div>
  )
})

function drawLinearChain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: MonatomicChainViewProps,
  phase: number,
  massScale: number,
  em: (q: QuantityId) => number,
  lw: (q: QuantityId, base: number) => number
): void {
  const count = NUMERICS.chainAtoms
  const padX = Math.max(26, w * 0.06)
  const usableW = Math.max(80, w - 2 * padX)
  const spacing = usableW / count
  const halfSpan = (count - 1) / 2
  const xCenter = w / 2
  const isStandingEdge = Math.abs(Math.abs(p.kFrac) - 1) < 1e-4

  const xEqToPx = (xAng: number): number => xCenter + (xAng / p.a) * spacing
  const samples = monatomicDisplacements(p.a, p.k, phase, count)

  // Suddivisione verticale: profilo continuo in alto, catena reale longitudinale in basso
  const yWave = Math.max(24, h * 0.27)
  const ampWave = Math.max(12, Math.min(26, h * 0.16))
  const yChain = Math.min(h - 26, Math.max(yWave + ampWave + 28, h * 0.72))

  const atomR = Math.min(spacing * 0.22, 6.8 + 3.4 * massScale)
  const maxShift = Math.min(spacing * 0.31, Math.max(8, spacing * 0.5 - atomR - 5))

  // 1. Asse zero del profilo d'onda continuo
  ctx.strokeStyle = TOKENS.line
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padX * 0.5, Math.round(yWave) + 0.5)
  ctx.lineTo(w - padX * 0.5, Math.round(yWave) + 0.5)
  ctx.stroke()

  // Etichetta discreta u(x) a sinistra della banda superiore
  ctx.save()
  ctx.globalAlpha = em('u') * 0.85
  drawMathText(ctx, 'u(x)', Math.max(8, padX * 0.45), yWave - ampWave + 3, {
    color: quantityColor('u'),
    size: 11.5,
    align: 'left'
  })
  ctx.restore()

  // 2. Curve continue u(x, t) per k (e per k' = k ± G se Aliasing attivo)
  const xMinAng = (-halfSpan - 0.55) * p.a
  const xMaxAng = (halfSpan + 0.55) * p.a
  const curveSteps = Math.max(160, Math.round(w * 0.6))

  // Al bordo zona k = ±π/a il profilo fisico senza aliasing è l'onda stazionaria cos(kx)·cos(φ)
  const evalWave = (xAng: number, kVal: number, standing: boolean): number =>
    standing ? Math.cos(kVal * xAng) * Math.cos(phase) : monatomicWaveProfile(xAng, kVal, phase)

  if (p.showAliasing) {
    ctx.save()
    ctx.globalAlpha = em('k') * 0.88
    ctx.strokeStyle = quantityColor('k')
    ctx.lineWidth = lw('k', 1.45)
    ctx.setLineDash([5, 3.5])
    ctx.beginPath()
    for (let i = 0; i <= curveSteps; i++) {
      const xAng = xMinAng + ((xMaxAng - xMinAng) * i) / curveSteps
      const uVal = evalWave(xAng, p.aliasK, false)
      const px = xEqToPx(xAng)
      const py = yWave - uVal * ampWave
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }

  ctx.save()
  ctx.globalAlpha = em('u')
  ctx.strokeStyle = quantityColor('u')
  ctx.lineWidth = lw('u', 1.75)
  ctx.beginPath()
  for (let i = 0; i <= curveSteps; i++) {
    const xAng = xMinAng + ((xMaxAng - xMinAng) * i) / curveSteps
    const uVal = evalWave(xAng, p.k, isStandingEdge && !p.showAliasing)
    const px = xEqToPx(xAng)
    const py = yWave - uVal * ampWave
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()
  ctx.restore()

  // 3. Guide verticali di equilibrio x_n⁰ = n·a e punti campionati sull'onda
  ctx.save()
  ctx.setLineDash([2, 3])
  ctx.lineWidth = 1
  for (const smp of samples) {
    const px = xEqToPx(smp.xEq)
    const pyWavePt = yWave - smp.u * ampWave
    ctx.strokeStyle = withAlpha(TOKENS.dim, 0.55 * em('a'))
    ctx.beginPath()
    ctx.moveTo(px, pyWavePt)
    ctx.lineTo(px, yChain + atomR + 6)
    ctx.stroke()
  }
  ctx.setLineDash([])
  ctx.restore()

  // Punti campionati sul profilo continuo (dove k e k + G coincidono!)
  ctx.save()
  ctx.globalAlpha = em('u')
  for (const smp of samples) {
    const px = xEqToPx(smp.xEq)
    const py = yWave - smp.u * ampWave
    ctx.fillStyle = TOKENS.bg
    ctx.strokeStyle = quantityColor('u')
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.arc(px, py, 3.2, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()

  // 4. Molle elastiche C tra atomi adiacenti (e mezze molle agli estremi per indicare catena infinita)
  const atomX = samples.map((smp) => xEqToPx(smp.xEq) + smp.u * maxShift)
  const springAmp = Math.max(3.5, Math.min(6, atomR * 0.55))
  const coils = spacing > 62 ? 5 : 4
  const cWidth = lw('C', 1.3 + Math.min(1.1, p.springC / 90))

  ctx.save()
  ctx.strokeStyle = quantityColor('C')
  ctx.lineWidth = cWidth
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  // Mezze molle attenuate ai bordi sinistro e destro
  ctx.globalAlpha = em('C') * 0.35
  const edgeSpan = Math.min(spacing * 0.45, padX * 0.75)
  drawZigZagSpring(ctx, atomX[0] - atomR - edgeSpan, yChain, atomX[0] - atomR, yChain, 2, springAmp * 0.85)
  const lastIdx = atomX.length - 1
  drawZigZagSpring(
    ctx,
    atomX[lastIdx] + atomR,
    yChain,
    atomX[lastIdx] + atomR + edgeSpan,
    yChain,
    2,
    springAmp * 0.85
  )

  // Molle interne a piena opacità
  ctx.globalAlpha = em('C') * 0.92
  for (let i = 0; i < atomX.length - 1; i++) {
    drawZigZagSpring(ctx, atomX[i] + atomR, yChain, atomX[i + 1] - atomR, yChain, coils, springAmp)
  }
  ctx.restore()

  // 5. Atomi di massa M
  ctx.save()
  ctx.globalAlpha = em('M')
  const colM = quantityColor('M')
  for (let i = 0; i < atomX.length; i++) {
    const cx = atomX[i]
    ctx.fillStyle = withAlpha(colM, 0.28)
    ctx.strokeStyle = colM
    ctx.lineWidth = lw('M', 1.8)
    ctx.beginPath()
    ctx.arc(cx, yChain, atomR, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()

  // 6. Frecce di spostamento longitudinale u_n(t) sopra gli atomi
  const yArrow = yChain - atomR - 7
  ctx.save()
  ctx.globalAlpha = em('u')
  ctx.strokeStyle = quantityColor('u')
  ctx.fillStyle = quantityColor('u')
  ctx.lineWidth = lw('u', 1.55)
  for (let i = 0; i < samples.length; i++) {
    const x0 = xEqToPx(samples[i].xEq)
    const x1 = atomX[i]
    if (Math.abs(x1 - x0) >= 3.2) {
      drawArrow(ctx, x0, yArrow, x1, yArrow, 5)
    }
  }
  ctx.restore()

  // 7. Quota del passo reticolare a tra n = 0 e n = 1
  const midIdx = Math.floor(count / 2)
  const qa0 = xEqToPx(samples[midIdx].xEq)
  const qa1 = xEqToPx(samples[midIdx + 1].xEq)
  const yDim = Math.min(h - 9, yChain + atomR + 13)
  ctx.save()
  ctx.globalAlpha = em('a')
  ctx.strokeStyle = quantityColor('a')
  ctx.lineWidth = lw('a', 1.15)
  ctx.beginPath()
  ctx.moveTo(qa0, yDim - 3)
  ctx.lineTo(qa0, yDim + 3)
  ctx.moveTo(qa1, yDim - 3)
  ctx.lineTo(qa1, yDim + 3)
  ctx.moveTo(qa0, yDim)
  ctx.lineTo(qa1, yDim)
  ctx.stroke()
  drawMathText(ctx, 'a', (qa0 + qa1) / 2, yDim - 3, {
    color: quantityColor('a'),
    size: 12,
    align: 'center',
    backdrop: TOKENS.bg
  })
  ctx.restore()
}

function drawBvkRing(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: MonatomicChainViewProps,
  phase: number,
  massScale: number,
  em: (q: QuantityId) => number,
  lw: (q: QuantityId, base: number) => number
): void {
  const N = p.bvkN
  const j = p.bvkJ ?? Math.round((p.kFrac * N) / 2)

  // Raggio dimensionato con margine verticale garantito per frecce + etichette 1/N
  const outerClearance = 26
  const R = Math.max(24, Math.min(w * 0.22, h / 2 - outerClearance))
  const chord = 2 * R * Math.sin(Math.PI / N)
  const atomR = Math.max(3.5, Math.min(chord * 0.25, 5.2 + 2.4 * massScale))
  const maxDTheta = Math.min(0.24, (0.3 * (2 * Math.PI)) / N)

  // Misura della didascalia: dentro l'anello solo se c'è spazio comodo, altrimenti di fianco a destra
  const topText = s.scene.ringCenterTop
  const botText = s.scene.ringCenterBottom(N, j)
  const topSize = R >= 58 ? 12.5 : 11.5
  const botSize = R >= 58 ? 11 : 10.5
  const topW = measureMathText(ctx, topText, topSize)
  ctx.font = sansFont(botSize)
  const botW = ctx.measureText(botText).width
  const labelW = Math.max(topW, botW)
  const innerClearW = 2 * (R - atomR - 9)
  const fitsInside = innerClearW >= labelW + 10

  const sideGap = 24
  const totalSideW = 2 * (R + atomR + 16) + sideGap + labelW
  const cx = fitsInside ? w / 2 : Math.max(R + atomR + 22, (w - totalSideW) / 2 + R + atomR + 16)
  const cy = h / 2

  // 1. Circonferenza di equilibrio tratteggiata
  ctx.save()
  ctx.globalAlpha = em('a') * 0.45
  ctx.strokeStyle = quantityColor('a')
  ctx.lineWidth = lw('a', 1)
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, 2 * Math.PI)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()

  // Spostamenti u_n(t) calcolati direttamente da physics/phononDispersion.ts
  const samples = monatomicDisplacements(p.a, p.k, phase, N, 0)
  const thetaEq: number[] = []
  const posX: number[] = []
  const posY: number[] = []
  for (let n = 0; n < N; n++) {
    const th0 = -Math.PI / 2 + (2 * Math.PI * n) / N
    const th = th0 + samples[n].u * maxDTheta
    thetaEq.push(th0)
    posX.push(cx + R * Math.cos(th))
    posY.push(cy + R * Math.sin(th))
  }

  // 2. Tacche radiali delle posizioni di equilibrio
  ctx.save()
  ctx.strokeStyle = withAlpha(TOKENS.dim, 0.65 * em('a'))
  ctx.lineWidth = 1
  for (let n = 0; n < N; n++) {
    const th0 = thetaEq[n]
    ctx.beginPath()
    ctx.moveTo(cx + (R - atomR - 3) * Math.cos(th0), cy + (R - atomR - 3) * Math.sin(th0))
    ctx.lineTo(cx + (R + atomR + 3) * Math.cos(th0), cy + (R + atomR + 3) * Math.sin(th0))
    ctx.stroke()
  }
  ctx.restore()

  // 3. N molle lungo la circonferenza (atomo N collegato ad atomo 1)
  const springAmp = Math.max(2.2, Math.min(4.2, chord * 0.1))
  const coils = N <= 10 ? 4 : N <= 16 ? 3 : 2
  ctx.save()
  ctx.globalAlpha = em('C') * 0.9
  ctx.strokeStyle = quantityColor('C')
  ctx.lineWidth = lw('C', 1.35)
  ctx.lineJoin = 'round'
  for (let n = 0; n < N; n++) {
    const next = (n + 1) % N
    const dx = posX[next] - posX[n]
    const dy = posY[next] - posY[n]
    const d = Math.hypot(dx, dy)
    if (d <= 2 * atomR + 1) continue
    const ux = dx / d
    const uy = dy / d
    drawZigZagSpring(
      ctx,
      posX[n] + ux * atomR,
      posY[n] + uy * atomR,
      posX[next] - ux * atomR,
      posY[next] - uy * atomR,
      coils,
      springAmp
    )
  }
  ctx.restore()

  // 4. Atomi sull'anello
  ctx.save()
  ctx.globalAlpha = em('M')
  const colM = quantityColor('M')
  for (let n = 0; n < N; n++) {
    ctx.fillStyle = withAlpha(colM, 0.3)
    ctx.strokeStyle = colM
    ctx.lineWidth = lw('M', 1.65)
    ctx.beginPath()
    ctx.arc(posX[n], posY[n], atomR, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()

  // 5. Frecce tangenziali di spostamento u_n appena fuori dall'anello
  const rArr = R + atomR + 5
  ctx.save()
  ctx.globalAlpha = em('u')
  ctx.strokeStyle = quantityColor('u')
  ctx.fillStyle = quantityColor('u')
  ctx.lineWidth = lw('u', 1.4)
  for (let n = 0; n < N; n++) {
    const dTh = samples[n].u * maxDTheta
    if (Math.abs(dTh * rArr) < 3.5) continue
    const th0 = thetaEq[n]
    const th1 = th0 + dTh
    drawArrow(
      ctx,
      cx + rArr * Math.cos(th0),
      cy + rArr * Math.sin(th0),
      cx + rArr * Math.cos(th1),
      cy + rArr * Math.sin(th1),
      4.5
    )
  }
  ctx.restore()

  // 6. Numerazione 1 e N sempre dentro i margini del canvas
  const rLbl = R + atomR + 13
  const drawIndexLabel = (idx: number, label: string): void => {
    const th = thetaEq[idx]
    const lx = cx + rLbl * Math.cos(th)
    const ly = Math.max(9, Math.min(h - 9, cy + rLbl * Math.sin(th)))
    ctx.fillText(label, lx, ly)
  }
  ctx.save()
  ctx.font = sansFont(10.5)
  ctx.fillStyle = TOKENS.muted
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  drawIndexLabel(0, '1')
  drawIndexLabel(N - 1, 'N')
  ctx.restore()

  // 7. Didascalia: dentro l'anello se ci sta con margine, altrimenti affiancata a destra
  const textX = fitsInside ? cx : cx + R + atomR + sideGap
  const align: 'center' | 'left' = fitsInside ? 'center' : 'left'
  ctx.save()
  ctx.globalAlpha = em('u')
  drawMathText(ctx, topText, textX, cy - 4, {
    color: quantityColor('u'),
    size: topSize,
    align
  })
  ctx.restore()

  ctx.save()
  ctx.font = sansFont(botSize)
  ctx.fillStyle = TOKENS.muted
  ctx.textAlign = align
  ctx.textBaseline = 'top'
  ctx.fillText(botText, textX, cy + 5)
  ctx.restore()
}
