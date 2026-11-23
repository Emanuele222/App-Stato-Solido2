/**
 * Vista spazio reale della catena biatomica 1D (dispensa Parte 6, Figg. 10, 12 e §24):
 * - Atomi pesanti M (siti pari n, blu --q-M) e leggeri m (siti dispari n−1, rosa --q-m),
 *   collegati da molle identiche C (--q-C), posizioni di equilibrio x_n⁰ = n·a/2.
 * - Frecce longitudinali u_n(t) (--q-u), quote di distanza primi vicini a/2 e passo Bravais a (--q-a).
 * - Marcatore del centro di massa di cella R_cm = (M·u_0 + m·u_{−1})/(M + m) (fermo nel modo ottico k = 0).
 * - Con «Luce infrarossa» attiva: cariche ioniche (+ su m, − su M per M ≠ m) e dipolo oscillante p(t).
 * - 4 pulsanti rapidi per i modi canonici di Fig. 12 + PlaybackControls (zero RAF in pausa/riposo).
 *
 * Nessun colore hex hardcoded: tutti i colori vengono da ui/theme.ts.
 */
import { memo, useCallback, useMemo, useRef, type JSX } from 'react'
import {
  diatomicDisplacements,
  type DiatomicBranch,
  type DiatomicParams
} from '../../physics'
import { RichText } from '../../ui/tex'
import { quantityColor, TOKENS, toneColor, type QuantityId } from '../../ui/theme'
import { ChartLegend, type LegendEntry } from '../../viz/ChartLegend'
import { drawMathText, useCanvasDraw, withAlpha } from '../../viz/canvas'
import { PlaybackControls, usePlaybackPhase } from '../../viz/PlaybackControls'
import { NUMERICS } from './manifest'
import { strings as s } from './strings'
import './phonon-diatomic.css'

export interface DiatomicChainViewProps {
  readonly params: DiatomicParams
  readonly k: number
  readonly kFrac: number
  readonly branch: DiatomicBranch
  readonly omegaRadS: number
  readonly omegaRefRadS: number
  readonly equalMasses: boolean
  readonly showInfrared: boolean
  readonly highlight: QuantityId | null
  readonly onQuickSelect: (kFrac: number, branch: DiatomicBranch) => void
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
  const lead = Math.min(5, len * 0.14)
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
  headLen = 5
): void {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len < 3) return
  const ux = dx / len
  const uy = dy / len
  const nx = -uy
  const ny = ux
  const hl = Math.min(headLen, len * 0.46)
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

function atomRadiusForMass(massAmu: number, spacing: number): number {
  const massScale = Math.min(1, Math.max(0, (Math.cbrt(massAmu) - 1.85) / 4.1))
  return Math.max(5.0, Math.min(spacing * 0.27, 5.6 + 5.2 * massScale))
}

export const DiatomicChainView = memo(function DiatomicChainView(
  props: DiatomicChainViewProps
): JSX.Element {
  const playback = usePlaybackPhase({ initialPlaying: true, initialSpeed: 1 })
  const phaseRadRef = useRef(0)

  const handleReset = useCallback(() => {
    phaseRadRef.current = 0
    playback.resetPhase()
  }, [playback.resetPhase])

  const legend = useMemo<readonly LegendEntry[]>(() => {
    const entries: LegendEntry[] = [
      { id: 'heavy', keyKind: 'dot', color: 'var(--q-M)', label: <RichText text={s.scene.legendHeavy} /> },
      { id: 'light', keyKind: 'dot', color: 'var(--q-m)', label: <RichText text={s.scene.legendLight} /> },
      { id: 'springs', keyKind: 'solid', color: 'var(--q-C)', label: <RichText text={s.scene.legendSprings} /> },
      { id: 'arrows', keyKind: 'solid', color: 'var(--q-u)', label: <RichText text={s.scene.legendArrows} /> },
      { id: 'cm', keyKind: 'dot', color: 'var(--text-soft)', label: <RichText text={s.scene.legendCm} /> }
    ]
    if (props.showInfrared) {
      entries.push({
        id: 'dipole',
        keyKind: 'solid',
        color: 'var(--tone-light-line)',
        label: <RichText text={s.scene.legendDipole} />
      })
    }
    return entries
  }, [props.showInfrared])

  const canvasRef = useCanvasDraw((ctx, { w, h }, dt) => {
    const p = props
    const isZeroOmega = p.omegaRadS < 1e-6 * Math.max(1, p.omegaRefRadS)

    // Velocità angolare visiva proporzionale a ω(k), scalata dolcemente sul riferimento Na–Cl
    const omegaRatio = p.omegaRefRadS > 0 ? p.omegaRadS / p.omegaRefRadS : 0
    const scaleFactor = Math.sqrt(Math.max(0.25, p.omegaRefRadS / NUMERICS.refOmegaOptRadS))
    const visOmega = Math.min(2 * Math.PI * 1.9, 2 * Math.PI * 0.78 * omegaRatio * scaleFactor)

    const shouldAnimate = playback.effectivePlaying && !isZeroOmega && visOmega > 1e-4
    if (shouldAnimate) {
      phaseRadRef.current = (phaseRadRef.current + dt * playback.speed * visOmega) % (2 * Math.PI)
    }
    const phase = isZeroOmega ? 0 : phaseRadRef.current

    const em = (q: QuantityId): number => (p.highlight === null || p.highlight === q ? 1 : DIM)
    const lw = (q: QuantityId, base: number): number => (p.highlight === q ? base + 1.1 : base)

    drawDiatomicChain(ctx, w, h, p, phase, em, lw)

    return shouldAnimate
  })

  const quickItems: readonly {
    readonly id: string
    readonly kFrac: number
    readonly branch: DiatomicBranch
    readonly label: string
    readonly title: string
  }[] = [
    { id: 'ac0', kFrac: 0, branch: 'acoustic', label: s.quickModes.acZero, title: s.quickModes.acZeroTitle },
    { id: 'op0', kFrac: 0, branch: 'optical', label: s.quickModes.optZero, title: s.quickModes.optZeroTitle },
    { id: 'edgeC', kFrac: 1, branch: 'acoustic', label: s.quickModes.edgeC, title: s.quickModes.edgeCTitle },
    { id: 'edgeB', kFrac: 1, branch: 'optical', label: s.quickModes.edgeB, title: s.quickModes.edgeBTitle }
  ]

  return (
    <div className="phonon-diat-chain-view">
      <div className="phonon-diat-chain-bar">
        <ChartLegend entries={legend} ariaLabel={s.scene.legendChainAria} />
        <div className="phonon-diat-chain-controls">
          <div className="phonon-diat-quick" role="group" aria-label={s.quickModes.group}>
            {quickItems.map((item) => {
              const active =
                props.branch === item.branch && Math.abs(props.kFrac - item.kFrac) < 1e-3
              return (
                <button
                  key={item.id}
                  type="button"
                  className="phonon-diat-quick-btn num"
                  aria-pressed={active}
                  title={item.title}
                  onClick={() => props.onQuickSelect(item.kFrac, item.branch)}
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
      <div className="phonon-diat-chain-stage">
        <canvas
          ref={canvasRef}
          className="phonon-diat-chain-canvas"
          role="img"
          aria-label={s.scene.chainAria}
        />
      </div>
    </div>
  )
})

function drawDiatomicChain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: DiatomicChainViewProps,
  phase: number,
  em: (q: QuantityId) => number,
  lw: (q: QuantityId, base: number) => number
): void {
  const samples = diatomicDisplacements(p.params, p.k, p.branch, phase, NUMERICS.chainCells)
  const count = samples.length // 10 atomi (5 celle)
  const padX = Math.max(22, w * 0.05)
  const usableW = Math.max(100, w - 2 * padX)
  const spacing = usableW / count // distanza a/2 in pixel
  const halfA = 0.5 * p.params.a
  const xMinEq = samples[0].xEq
  const xMaxEq = samples[count - 1].xEq
  const xMidEq = 0.5 * (xMinEq + xMaxEq)
  const xCenter = w / 2

  const xEqToPx = (xAng: number): number => xCenter + ((xAng - xMidEq) / halfA) * spacing

  const rM = atomRadiusForMass(p.params.massHeavyAmu, spacing)
  const rm = atomRadiusForMass(p.params.massLightAmu, spacing)
  const rMax = Math.max(rM, rm)
  const maxShift = Math.min(spacing * 0.30, Math.max(7, spacing * 0.5 - rMax - 4))

  // Distribuzione verticale adattiva (compatta anche su canvas ~105 px a 800×700)
  const compact = h < 140
  const yChain = Math.round(h * (p.showInfrared ? 0.54 : 0.50))
  const yArrow = yChain - rMax - (compact ? 8 : 11)
  const yTopStrip = Math.max(14, yArrow - (compact ? 14 : 20))
  const yDimHalf = Math.min(h - (compact ? 18 : 26), yChain + rMax + (compact ? 12 : 16))
  const yDimFull = Math.min(h - 6, yDimHalf + (compact ? 13 : 17))

  // Trova la cella centrale: coppia (n = -1 [m], n = 0 [M]) come in R_cm = (M·u_n + m·u_{n−1})/(M+m)
  const idxLightCell = samples.findIndex((smp) => smp.n === -1)
  const idxHeavyCell = samples.findIndex((smp) => smp.n === 0)
  const idxNextLight = samples.findIndex((smp) => smp.n === 1)
  const idxNextHeavy = samples.findIndex((smp) => smp.n === 2)

  // 1. Riquadro leggerissimo della cella primitiva centrale (n = -1, n = 0)
  if (idxLightCell >= 0 && idxHeavyCell >= 0) {
    const xCell0 = xEqToPx(samples[idxLightCell].xEq) - spacing * 0.42
    const xCell1 = xEqToPx(samples[idxHeavyCell].xEq) + spacing * 0.42
    ctx.save()
    ctx.globalAlpha = em('a') * 0.42
    ctx.strokeStyle = quantityColor('a')
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.strokeRect(xCell0, yChain - rMax - 4, xCell1 - xCell0, 2 * rMax + 8)
    ctx.setLineDash([])
    ctx.restore()
  }

  // 2. Tacche verticali delle posizioni di equilibrio x_n⁰ = n·a/2
  ctx.save()
  ctx.strokeStyle = withAlpha(TOKENS.dim, 0.72 * em('a'))
  ctx.lineWidth = 1
  ctx.setLineDash([2, 3])
  for (const smp of samples) {
    const px = xEqToPx(smp.xEq)
    ctx.beginPath()
    ctx.moveTo(px, yChain - rMax - 5)
    ctx.lineTo(px, yChain + rMax + 6)
    ctx.stroke()
  }
  ctx.setLineDash([])
  ctx.restore()

  // Posizioni istantanee x_n(t)
  const atomX = samples.map((smp) => xEqToPx(smp.xEq) + smp.u * maxShift)
  const atomR = samples.map((smp) => (smp.species === 'M' ? rM : rm))

  // 3. Molle elastiche identiche C tra primi vicini (e mezze molle agli estremi)
  const springAmp = Math.max(3.2, Math.min(5.5, rMax * 0.5))
  const coils = spacing > 52 ? 4 : 3
  const cWidth = lw('C', 1.25 + Math.min(1.0, p.params.springC / 75))

  ctx.save()
  ctx.strokeStyle = quantityColor('C')
  ctx.lineWidth = cWidth
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  const edgeSpan = Math.min(spacing * 0.45, padX * 0.75)
  ctx.globalAlpha = em('C') * 0.35
  drawZigZagSpring(ctx, atomX[0] - atomR[0] - edgeSpan, yChain, atomX[0] - atomR[0], yChain, 2, springAmp * 0.85)
  const last = count - 1
  drawZigZagSpring(
    ctx,
    atomX[last] + atomR[last],
    yChain,
    atomX[last] + atomR[last] + edgeSpan,
    yChain,
    2,
    springAmp * 0.85
  )

  ctx.globalAlpha = em('C') * 0.92
  for (let i = 0; i < count - 1; i++) {
    drawZigZagSpring(
      ctx,
      atomX[i] + atomR[i],
      yChain,
      atomX[i + 1] - atomR[i + 1],
      yChain,
      coils,
      springAmp
    )
  }
  ctx.restore()

  // 4. Atomi M (pari, --q-M) e m (dispari, --q-m)
  const colM = quantityColor('M')
  const colm = quantityColor('m')
  for (let i = 0; i < count; i++) {
    const smp = samples[i]
    const isHeavy = smp.species === 'M'
    const qId: QuantityId = isHeavy ? 'M' : 'm'
    const col = isHeavy ? colM : colm
    const r = atomR[i]
    const cx = atomX[i]

    ctx.save()
    ctx.globalAlpha = em(qId)
    ctx.fillStyle = withAlpha(col, 0.28)
    ctx.strokeStyle = col
    ctx.lineWidth = lw(qId, 1.8)
    ctx.beginPath()
    ctx.arc(cx, yChain, r, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()

    // Etichetta interna: carica ionica (−/+) in modalità luce IR (se M ≠ m), altrimenti M/m se il cerchio è abbastanza grande
    if (p.showInfrared && !p.equalMasses && r >= 5.5) {
      drawMathText(ctx, isHeavy ? '−' : '+', cx, yChain + 3.5, {
        color: TOKENS.text,
        size: Math.min(12, r * 1.15),
        align: 'center'
      })
    } else if (r >= 7.2) {
      drawMathText(ctx, isHeavy ? 'M' : 'm', cx, yChain + 3.5, {
        color: TOKENS.text,
        size: Math.min(11, r * 1.05),
        align: 'center'
      })
    }
    ctx.restore()
  }

  // 5. Frecce di spostamento longitudinale u_n(t) sopra gli atomi
  ctx.save()
  ctx.globalAlpha = em('u')
  ctx.strokeStyle = quantityColor('u')
  ctx.fillStyle = quantityColor('u')
  ctx.lineWidth = lw('u', 1.55)
  for (let i = 0; i < count; i++) {
    const x0 = xEqToPx(samples[i].xEq)
    const x1 = atomX[i]
    if (Math.abs(x1 - x0) >= 2.8) {
      drawArrow(ctx, x0, yArrow, x1, yArrow, 4.8)
    }
  }
  ctx.restore()

  // 6. Marcatore del centro di massa R_cm della cella centrale (n = −1, n = 0)
  if (idxLightCell >= 0 && idxHeavyCell >= 0) {
    const M = p.params.massHeavyAmu
    const m = p.params.massLightAmu
    const xEqM = xEqToPx(samples[idxHeavyCell].xEq)
    const xEqm = xEqToPx(samples[idxLightCell].xEq)
    const xCmEq = (M * xEqM + m * xEqm) / (M + m)
    const xCmNow = (M * atomX[idxHeavyCell] + m * atomX[idxLightCell]) / (M + m)

    // Tacca di riferimento del centro di massa a riposo
    ctx.save()
    ctx.strokeStyle = withAlpha(TOKENS.textSoft, 0.45)
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(xCmEq, yChain - rMax - 3)
    ctx.lineTo(xCmEq, yChain + rMax + 3)
    ctx.stroke()

    // Rombo del centro di massa istantaneo sulla linea della catena
    const dR = 4.2
    ctx.fillStyle = TOKENS.bg
    ctx.strokeStyle = TOKENS.text
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(xCmNow, yChain - dR)
    ctx.lineTo(xCmNow + dR, yChain)
    ctx.lineTo(xCmNow, yChain + dR)
    ctx.lineTo(xCmNow - dR, yChain)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Etichetta R_cm in alto se non sovrapposta al dipolo, altrimenti subito a fianco sopra la cella
    if (!p.showInfrared) {
      drawMathText(ctx, s.scene.cmLabel, xCmNow, Math.max(12, yArrow - 8), {
        color: TOKENS.textSoft,
        size: 11,
        align: 'center',
        backdrop: TOKENS.bg
      })
    }
    ctx.restore()

    // 7. Dipolo ionico oscillante p(t) ∝ u_m − u_M quando «Luce infrarossa» è attiva
    if (p.showInfrared) {
      const colLight = toneColor('lightLine')
      const relShift = samples[idxLightCell].u - samples[idxHeavyCell].u
      const dipolePx = p.equalMasses ? 0 : Math.max(-spacing * 0.72, Math.min(spacing * 0.72, relShift * maxShift * 0.85))
      ctx.save()
      ctx.globalAlpha = em('omegaOpt')
      ctx.strokeStyle = colLight
      ctx.fillStyle = colLight
      ctx.lineWidth = 1.8
      if (Math.abs(dipolePx) >= 3) {
        drawArrow(ctx, xCmEq, yTopStrip, xCmEq + dipolePx, yTopStrip, 5.2)
        drawMathText(ctx, s.scene.dipoleLabel, xCmEq + dipolePx + (dipolePx >= 0 ? 7 : -7), yTopStrip + 3.5, {
          color: colLight,
          size: 11.5,
          align: dipolePx >= 0 ? 'left' : 'right',
          backdrop: TOKENS.bg
        })
      } else {
        drawMathText(ctx, s.scene.dipoleZeroLabel, xCmEq, yTopStrip + 3.5, {
          color: TOKENS.muted,
          size: 11,
          align: 'center',
          backdrop: TOKENS.bg
        })
      }
      ctx.restore()
    }
  }

  // 8. Quote di distanza primi vicini a/2 (tra n = 0 e n = 1) e passo reticolare a (tra n = 0 e n = 2)
  if (idxHeavyCell >= 0 && idxNextLight >= 0 && idxNextHeavy >= 0) {
    const q0 = xEqToPx(samples[idxHeavyCell].xEq)
    const qHalf = xEqToPx(samples[idxNextLight].xEq)
    const qFull = xEqToPx(samples[idxNextHeavy].xEq)
    const colA = quantityColor('a')

    ctx.save()
    ctx.globalAlpha = em('a')
    ctx.strokeStyle = colA
    ctx.lineWidth = lw('a', 1.1)

    // Quota a/2 (primi vicini M–m)
    ctx.beginPath()
    ctx.moveTo(q0, yDimHalf - 3)
    ctx.lineTo(q0, yDimHalf + 3)
    ctx.moveTo(qHalf, yDimHalf - 3)
    ctx.lineTo(qHalf, yDimHalf + 3)
    ctx.moveTo(q0, yDimHalf)
    ctx.lineTo(qHalf, yDimHalf)
    ctx.stroke()
    drawMathText(ctx, 'a/2', (q0 + qHalf) / 2, yDimHalf - 2.5, {
      color: colA,
      size: 10.5,
      align: 'center',
      backdrop: TOKENS.bg
    })

    // Quota a (passo del reticolo di Bravais M–M)
    ctx.beginPath()
    ctx.moveTo(q0, yDimFull - 3)
    ctx.lineTo(q0, yDimFull + 3)
    ctx.moveTo(qFull, yDimFull - 3)
    ctx.lineTo(qFull, yDimFull + 3)
    ctx.moveTo(q0, yDimFull)
    ctx.lineTo(qFull, yDimFull)
    ctx.stroke()
    drawMathText(ctx, 'a', (q0 + qFull) / 2, yDimFull - 2.5, {
      color: colA,
      size: 11.5,
      align: 'center',
      backdrop: TOKENS.bg
    })
    ctx.restore()
  }
}
