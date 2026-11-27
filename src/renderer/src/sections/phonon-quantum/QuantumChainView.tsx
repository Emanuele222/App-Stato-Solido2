/**
 * Vista 2 della Modalità A — Catena vibrante sincronizzata nel modo quantizzato:
 * l'ampiezza degli atomi è proporzionale a √(2n + 1) (o √(2n̄ + 1) in bagno termico),
 * così già a n = 0 si vede l'oscillazione non nulla di punto zero Δx_zp ≠ 0.
 * Dotata di PlaybackControls (Play/Pausa, velocità, reset) e rispetto di prefers-reduced-motion.
 */
import { memo, useCallback, useMemo, useRef, type JSX } from 'react'
import { monatomicDisplacements, monatomicWaveProfile, monatomicZoneEdge } from '../../physics'
import { formatNumber } from '../../ui/format'
import { RichText } from '../../ui/tex'
import { quantityColor, TOKENS, type QuantityId } from '../../ui/theme'
import { ChartLegend, type LegendEntry } from '../../viz/ChartLegend'
import { drawMathText, drawRichText, useCanvasDraw, withAlpha } from '../../viz/canvas'
import { PlaybackControls, usePlaybackPhase } from '../../viz/PlaybackControls'
import { NUMERICS, REFERENCE_CRYSTAL } from './manifest'
import type { QuantizationModel } from './model'
import { strings as s } from './strings'
import './phonon-quantum.css'

export interface QuantumChainViewProps {
  readonly model: QuantizationModel
  readonly highlight: QuantityId | null
}

const DIM = 0.26

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

export const QuantumChainView = memo(function QuantumChainView({
  model,
  highlight
}: QuantumChainViewProps): JSX.Element {
  const playback = usePlaybackPhase({ initialPlaying: true, initialSpeed: 1 })
  const phaseRadRef = useRef(0)

  const handleReset = useCallback(() => {
    phaseRadRef.current = 0
    playback.resetPhase()
  }, [playback.resetPhase])

  const isThermal = model.source === 'thermal'
  const ampQ: QuantityId = isThermal ? 'T' : 'psi'

  const legend = useMemo<readonly LegendEntry[]>(
    () => [
      { id: 'atoms', keyKind: 'dot', color: 'var(--q-M)', label: <RichText text={s.quantScene.legendAtoms} /> },
      { id: 'springs', keyKind: 'solid', color: 'var(--q-C)', label: <RichText text={s.quantScene.legendSprings} /> },
      { id: 'wave', keyKind: 'solid', color: 'var(--q-u)', label: <RichText text={s.quantScene.legendWave} /> },
      {
        id: 'env',
        keyKind: 'dashed',
        color: `var(--q-${ampQ})`,
        label: <RichText text={isThermal ? s.quantScene.legendEnvThermal : s.quantScene.legendEnvLevel} />
      }
    ],
    [ampQ, isThermal]
  )

  const canvasRef = useCanvasDraw((ctx, { w, h }, dt) => {
    const freqThz = model.modeSummary.freqThz
    const visOmega = Math.min(2 * Math.PI * 1.9, 2 * Math.PI * 0.72 * (freqThz / NUMERICS.refFreqThz))
    if (playback.effectivePlaying && visOmega > 1e-4) {
      phaseRadRef.current = (phaseRadRef.current + dt * playback.speed * visOmega) % (2 * Math.PI)
    }
    const phase = phaseRadRef.current

    const em = (q: QuantityId): number => (highlight === null || highlight === q ? 1 : DIM)
    const lw = (q: QuantityId, base: number): number => (highlight === q ? base + 1.1 : base)

    const count = NUMERICS.chainAtoms
    const a = REFERENCE_CRYSTAL.a
    // Modo rappresentativo in zona k = π/(2a) (λ = 4a) così le onde e gli spostamenti sono ben leggibili
    const kMode = 0.5 * monatomicZoneEdge(a)

    const padX = Math.max(24, w * 0.06)
    const usableW = Math.max(80, w - 2 * padX)
    const spacing = usableW / count
    const halfSpan = (count - 1) / 2
    const xCenter = w / 2
    const xEqToPx = (xAng: number): number => xCenter + (xAng / a) * spacing

    const atomR = Math.min(spacing * 0.21, 8.2)
    const maxSafeShift = Math.max(6, spacing * 0.41 - atomR)
    // Scala strettamente proporzionale a √(2n+1) fino a n=25 (√51 ≈ 7,14), limitata solo se T molto alta
    const ampFactor = model.ampFactorOverZp
    const zpShiftPx = Math.min(3.0, maxSafeShift / Math.sqrt(51))
    const shiftPx = Math.min(maxSafeShift, zpShiftPx * ampFactor)

    // Banda superiore per il profilo d'onda continuo con inviluppo ±A_n
    const yWave = Math.max(24, h * 0.28)
    const maxWaveAmp = Math.max(12, Math.min(24, h * 0.16))
    const zpWaveAmp = Math.max(3.2, maxWaveAmp / Math.sqrt(51))
    const waveAmp = Math.min(maxWaveAmp, zpWaveAmp * ampFactor)
    const yChain = Math.min(h - 24, Math.max(yWave + maxWaveAmp + 24, h * 0.72))

    // 1. Asse zero del profilo d'onda e fasce inviluppo ±√(2n+1)
    ctx.strokeStyle = TOKENS.line
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padX * 0.5, Math.round(yWave) + 0.5)
    ctx.lineTo(w - padX * 0.5, Math.round(yWave) + 0.5)
    ctx.stroke()

    ctx.save()
    ctx.globalAlpha = em(ampQ) * 0.65
    ctx.strokeStyle = quantityColor(ampQ)
    ctx.lineWidth = lw(ampQ, 1.15)
    ctx.setLineDash([4, 4])
    for (const sign of [-1, 1]) {
      const ye = yWave - sign * waveAmp
      ctx.beginPath()
      ctx.moveTo(padX * 0.5, ye)
      ctx.lineTo(w - padX * 0.5, ye)
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.restore()

    // 2. Onda continua campionata sugli atomi
    const xMinAng = (-halfSpan - 0.5) * a
    const xMaxAng = (halfSpan + 0.5) * a
    const steps = Math.max(140, Math.round(w * 0.5))
    ctx.save()
    ctx.globalAlpha = em('u')
    ctx.strokeStyle = quantityColor('u')
    ctx.lineWidth = lw('u', 1.7)
    ctx.beginPath()
    for (let i = 0; i <= steps; i++) {
      const xAng = xMinAng + ((xMaxAng - xMinAng) * i) / steps
      const uVal = monatomicWaveProfile(xAng, kMode, phase)
      const px = xEqToPx(xAng)
      const py = yWave - uVal * waveAmp
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.restore()

    const samples = monatomicDisplacements(a, kMode, phase, count)

    // 3. Guide verticali di equilibrio + escursioni ±x_cl lungo la catena
    ctx.save()
    for (const smp of samples) {
      const px0 = xEqToPx(smp.xEq)
      const pyWavePt = yWave - smp.u * waveAmp

      ctx.strokeStyle = withAlpha(TOKENS.dim, 0.5 * em('a'))
      ctx.lineWidth = 1
      ctx.setLineDash([2, 3])
      ctx.beginPath()
      ctx.moveTo(px0, pyWavePt)
      ctx.lineTo(px0, yChain + atomR + 6)
      ctx.stroke()
      ctx.setLineDash([])

      // Pallino campionato sul profilo
      ctx.fillStyle = TOKENS.bg
      ctx.strokeStyle = quantityColor('u')
      ctx.lineWidth = 1.5
      ctx.globalAlpha = em('u')
      ctx.beginPath()
      ctx.arc(px0, pyWavePt, 2.9, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
    }
    ctx.restore()

    // 4. Molle elastiche C e atomi di massa M
    const atomX = samples.map((smp) => xEqToPx(smp.xEq) + smp.u * shiftPx)
    const springAmp = Math.max(3.2, Math.min(5.5, atomR * 0.55))

    ctx.save()
    ctx.strokeStyle = quantityColor('C')
    ctx.lineWidth = lw('C', 1.5)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    ctx.globalAlpha = em('C') * 0.35
    const edgeSpan = Math.min(spacing * 0.42, padX * 0.75)
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

    ctx.globalAlpha = em('C') * 0.92
    for (let i = 0; i < atomX.length - 1; i++) {
      drawZigZagSpring(ctx, atomX[i] + atomR, yChain, atomX[i + 1] - atomR, yChain, 4, springAmp)
    }
    ctx.restore()

    // Fascia di oscillazione attorno a ogni sito di equilibrio
    ctx.save()
    ctx.globalAlpha = em(ampQ) * 0.45
    ctx.strokeStyle = quantityColor(ampQ)
    ctx.lineWidth = 2
    for (const smp of samples) {
      const px0 = xEqToPx(smp.xEq)
      ctx.beginPath()
      ctx.moveTo(px0 - shiftPx, yChain + atomR + 5)
      ctx.lineTo(px0 + shiftPx, yChain + atomR + 5)
      ctx.stroke()
    }
    ctx.restore()

    ctx.save()
    ctx.globalAlpha = em('M')
    const colM = quantityColor('M')
    for (let i = 0; i < atomX.length; i++) {
      ctx.fillStyle = withAlpha(colM, 0.28)
      ctx.strokeStyle = colM
      ctx.lineWidth = lw('M', 1.8)
      ctx.beginPath()
      ctx.arc(atomX[i], yChain, atomR, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
    }
    ctx.restore()

    // Quota passo reticolare a e informazione Δx_rms / a
    const midIdx = Math.floor(count / 2)
    const qa0 = xEqToPx(samples[midIdx].xEq)
    const qa1 = xEqToPx(samples[midIdx + 1].xEq)
    const yDim = Math.min(h - 8, yChain + atomR + 14)
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
      size: 11.5,
      align: 'center',
      backdrop: TOKENS.bg
    })
    ctx.restore()

    // Etichetta discreta della scala fisica reale in alto a destra (pedici renderizzati senza _ letterale)
    const rmsAng = isThermal ? model.thermalSummary.rmsAmpAng : model.modeSummary.deltaXRmsAng
    const pct = (rmsAng / a) * 100
    const rmsLabel =
      !isThermal && model.nInt === 0
        ? `$Δx_{zp}$ = ${formatNumber(rmsAng, 3)} Å (${formatNumber(pct, 1)}% di $a$)`
        : `$Δx_{rms}$ = ${formatNumber(rmsAng, 3)} Å (${formatNumber(pct, 1)}% di $a$)`
    ctx.save()
    ctx.globalAlpha = em('u')
    drawRichText(ctx, rmsLabel, w - 12, 13, {
      color: quantityColor('u'),
      size: 10.5,
      align: 'right'
    })
    ctx.restore()

    return playback.effectivePlaying
  })

  return (
    <div className="phonon-q-view">
      <div className="phonon-q-bar">
        <ChartLegend entries={legend} ariaLabel={s.quantScene.chainAria} />
        <PlaybackControls
          playing={playback.playing}
          speed={playback.speed}
          onTogglePlay={playback.togglePlay}
          onSpeedChange={playback.setSpeed}
          onReset={handleReset}
        />
      </div>
      <div className="phonon-q-stage">
        <canvas
          ref={canvasRef}
          className="phonon-q-canvas"
          role="img"
          aria-label={s.quantScene.chainAria}
        />
      </div>
    </div>
  )
})
