/**
 * Vista 1 della Modalità A — Oscillatore armonico quantistico vs classico:
 * - Parte superiore: parabola del potenziale V(x) = ½ Mω² x² (in unità ħω) con i livelli E_n,
 *   l'autofunzione Ψ_n (o i pesi termici) e i punti di inversione ±x_cl.
 * - Parte inferiore (asse x/a_ho condiviso): confronto P_n(x) = |Ψ_n(x)|² vs P_cl(x)
 *   con le code di tunneling |x| > x_cl evidenziate e corrispondenza di Bohr fino a n = 25.
 * - Pannello laterale opzionale (quando è attivo il bagno termico T): pesi p_n(T) e n̄(T).
 */
import { memo, useMemo, type JSX } from 'react'
import { formatNumber } from '../../ui/format'
import { RichText } from '../../ui/tex'
import { quantityColor, TOKENS, type QuantityId } from '../../ui/theme'
import { ChartLegend, type LegendEntry } from '../../viz/ChartLegend'
import {
  drawMathText,
  drawRichText,
  measureMathText,
  niceStep,
  sansFont,
  useCanvasDraw,
  withAlpha
} from '../../viz/canvas'
import { NUMERICS } from './manifest'
import type { QuantizationModel } from './model'
import { strings as s } from './strings'
import './phonon-quantum.css'

export interface QuantumOscillatorViewProps {
  readonly model: QuantizationModel
  readonly highlight: QuantityId | null
}

const DIM = 0.26

export const QuantumOscillatorView = memo(function QuantumOscillatorView({
  model,
  highlight
}: QuantumOscillatorViewProps): JSX.Element {
  const isThermal = model.source === 'thermal'

  const legend = useMemo<readonly LegendEntry[]>(() => {
    const entries: LegendEntry[] = []
    if (isThermal) {
      entries.push({
        id: 'thermal',
        keyKind: 'solid',
        color: 'var(--q-T)',
        label: <RichText text={s.quantScene.legendThermal} />
      })
      entries.push({
        id: 'p0-ref',
        keyKind: 'dotted',
        color: 'var(--q-psi)',
        label: <RichText text={s.quantScene.legendP0} />
      })
    } else {
      entries.push({
        id: 'pn',
        keyKind: 'solid',
        color: 'var(--q-psi)',
        label: <RichText text={s.quantScene.legendPn} />
      })
    }
    entries.push(
      {
        id: 'pcl',
        keyKind: 'dashed',
        color: 'var(--q-Ek)',
        label: <RichText text={isThermal ? s.quantScene.legendPclThermal : s.quantScene.legendPcl} />
      },
      { id: 'pot', keyKind: 'solid', color: 'var(--q-omega)', label: <RichText text={s.quantScene.legendPotential} /> }
    )
    if (!isThermal) {
      entries.push({
        id: 'tunnel',
        keyKind: 'dot',
        color: 'var(--q-psi)',
        label: <RichText text={s.quantScene.legendTunnel} />
      })
    }
    return entries
  }, [isThermal])

  const mainCanvasRef = useCanvasDraw((ctx, { w, h }) => {
    const em = (q: QuantityId): number => (highlight === null || highlight === q ? 1 : DIM)
    const lw = (q: QuantityId, base: number): number => (highlight === q ? base + 1.1 : base)

    const padL = 46
    const padR = 16
    const padT = 10
    const padB = 26
    const plotW = Math.max(80, w - padL - padR)
    const totalH = Math.max(120, h - padT - padB)
    const gapH = 14
    const topH = Math.max(52, (totalH - gapH) * 0.44)
    const botH = Math.max(60, totalH - gapH - topH)

    const topY0 = padT
    const topY1 = topY0 + topH
    const botY0 = topY1 + gapH
    const botY1 = botY0 + botH

    const uMax = model.uMax
    const toPxX = (u: number): number => padL + ((u + uMax) / (2 * uMax)) * plotW

    // --- 1. Sotto-grafico superiore: parabola V(u) = u²/2 e livelli E_n ---
    const eMax = model.energyMaxUnits
    const toTopY = (eUnits: number): number => topY1 - (eUnits / eMax) * topH

    // Griglia verticale leggera e asse y superiore
    ctx.strokeStyle = TOKENS.line
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padL + 0.5, topY0)
    ctx.lineTo(padL + 0.5, topY1)
    ctx.lineTo(padL + plotW, topY1)
    ctx.stroke()

    const eStep = niceStep(eMax, 3)
    ctx.font = sansFont(10)
    ctx.fillStyle = TOKENS.muted
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let ev = 0; ev <= eMax + 1e-6; ev += eStep) {
      if (ev < 0.05) continue
      const py = toTopY(ev)
      if (py < topY0 + 8 || py > topY1 - 6) continue
      ctx.strokeStyle = TOKENS.line
      ctx.beginPath()
      ctx.moveTo(padL - 3, py)
      ctx.lineTo(padL, py)
      ctx.stroke()
      ctx.fillText(formatNumber(ev, ev < 2 ? 1 : 0), padL - 6, py)
    }

    drawMathText(ctx, 'V/ħω', padL - 6, topY0 + 9, {
      color: quantityColor('omega'),
      size: 10.5,
      align: 'right'
    })

    // Parabola V(u) = ½ u² (solo dove V ≤ eMax)
    ctx.save()
    ctx.globalAlpha = em('omega') * 0.9
    ctx.strokeStyle = quantityColor('omega')
    ctx.lineWidth = lw('omega', 1.7)
    ctx.beginPath()
    let started = false
    const pSteps = 160
    for (let i = 0; i <= pSteps; i++) {
      const u = -uMax + (2 * uMax * i) / pSteps
      const v = 0.5 * u * u
      if (v > eMax) continue
      const px = toPxX(u)
      const py = toTopY(v)
      if (!started) {
        ctx.moveTo(px, py)
        started = true
      } else {
        ctx.lineTo(px, py)
      }
    }
    ctx.stroke()
    ctx.restore()

    // Livelli energetici E_k = (k + ½) ħω dentro la parabola
    const maxLevel = Math.min(30, Math.floor(eMax - 0.5))
    const p0Weight = model.levelWeights[0] || 1
    for (let k = 0; k <= maxLevel; k++) {
      const eUnits = k + 0.5
      const uTurn = Math.sqrt(2 * eUnits)
      const xL = toPxX(-uTurn)
      const xR = toPxX(uTurn)
      const py = toTopY(eUnits)

      if (isThermal) {
        const wNorm = k < model.levelWeights.length ? model.levelWeights[k] / p0Weight : 0
        const alpha = (0.14 + 0.86 * Math.min(1, wNorm)) * em('T')
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.strokeStyle = quantityColor('T')
        ctx.lineWidth = wNorm > 0.25 ? lw('T', 1.6) : 1
        ctx.beginPath()
        ctx.moveTo(xL, py)
        ctx.lineTo(xR, py)
        ctx.stroke()
        ctx.restore()
      } else {
        const isActive = k === model.nInt
        ctx.save()
        ctx.globalAlpha = isActive ? em('psi') : 0.32
        ctx.strokeStyle = isActive ? quantityColor('psi') : TOKENS.lineStrong
        ctx.lineWidth = isActive ? lw('psi', 1.8) : 1
        ctx.beginPath()
        ctx.moveTo(xL, py)
        ctx.lineTo(xR, py)
        ctx.stroke()
        ctx.restore()
      }
    }

    // In modalità livello puro: disegna Ψ_n attorno al livello E_n (stile Fig. 20)
    if (!isThermal) {
      const eActive = model.modeSummary.unitsHbarOmega
      const basePy = toTopY(eActive)
      const ampScale = Math.min(topH * 0.2, Math.max(7, (topH / eMax) * 0.85))
      ctx.save()
      ctx.globalAlpha = em('psi') * 0.82
      ctx.strokeStyle = quantityColor('psi')
      ctx.lineWidth = lw('psi', 1.35)
      ctx.beginPath()
      const { u, psiN } = model.curves
      for (let i = 0; i < u.length; i++) {
        const px = toPxX(u[i])
        const py = basePy - psiN[i] * ampScale * 1.35
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.restore()
    } else {
      // In bagno termico: linea media ⟨E⟩ = (n̄ + ½) ħω
      const meanE = Math.min(eMax * 0.96, model.thermalSummary.meanUnitsHbarOmega)
      const uMean = Math.sqrt(2 * meanE)
      const pyMean = toTopY(meanE)
      ctx.save()
      ctx.globalAlpha = em('T')
      ctx.strokeStyle = quantityColor('T')
      ctx.lineWidth = lw('T', 1.8)
      ctx.setLineDash([5, 3])
      ctx.beginPath()
      ctx.moveTo(toPxX(-uMean), pyMean)
      ctx.lineTo(toPxX(uMean), pyMean)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()
    }

    // --- 2. Sotto-grafico inferiore: P_n(u) vs P_cl(u) ---
    const activeUCl = isThermal ? model.thermalSummary.uClEff : model.modeSummary.uCl
    const activeEUnits = isThermal ? model.thermalSummary.meanUnitsHbarOmega : model.modeSummary.unitsHbarOmega

    // Trova scala verticale pulita basata sul picco quantistico (P_cl diverge ai bordi e va clippata)
    let maxQ = 0
    const qArr = isThermal ? model.thermalProb : model.curves.probQuantum
    for (let i = 0; i < qArr.length; i++) {
      if (qArr[i] > maxQ) maxQ = qArr[i]
    }
    const pClCenter = 1 / (Math.PI * activeUCl)
    const refP0Peak = isThermal && model.thermalSummary.nBar <= 4 ? 0.58 : 0
    const pMax = Math.max(0.42, maxQ * 1.28, pClCenter * 2.4, refP0Peak * 1.08)
    const toBotY = (pVal: number): number => botY1 - Math.min(1.03, pVal / pMax) * botH

    // Linee di caduta verticali dai punti di inversione ±x_cl sulla parabola fino a P = 0
    const pyTurnTop = toTopY(Math.min(eMax, activeEUnits))
    const xClLeft = toPxX(-activeUCl)
    const xClRight = toPxX(activeUCl)
    ctx.save()
    ctx.globalAlpha = em('Ek') * 0.72
    ctx.strokeStyle = quantityColor('Ek')
    ctx.lineWidth = 1.15
    ctx.setLineDash([3, 3])
    for (const pxTurn of [xClLeft, xClRight]) {
      ctx.beginPath()
      ctx.moveTo(pxTurn, pyTurnTop)
      ctx.lineTo(pxTurn, botY1)
      ctx.stroke()
    }
    ctx.setLineDash([])
    // Pallini di intersezione sulla parabola
    ctx.fillStyle = TOKENS.bg
    ctx.strokeStyle = quantityColor('Ek')
    ctx.lineWidth = 1.6
    for (const pxTurn of [xClLeft, xClRight]) {
      ctx.beginPath()
      ctx.arc(pxTurn, pyTurnTop, 3.2, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
    }
    ctx.restore()

    // Assi inferiori
    ctx.strokeStyle = TOKENS.line
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padL + 0.5, botY0)
    ctx.lineTo(padL + 0.5, botY1)
    ctx.lineTo(padL + plotW, botY1)
    ctx.stroke()

    // Tacche asse x condiviso (u = x / a_ho)
    const uStep = niceStep(2 * uMax, 6)
    const xLblW = measureMathText(ctx, s.quantScene.xAxisLabel, 11)
    const tickRightLimit = padL + plotW - xLblW - 12
    ctx.font = sansFont(10.5)
    ctx.fillStyle = TOKENS.muted
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    for (let uTick = -Math.floor(uMax / uStep) * uStep; uTick <= uMax + 1e-6; uTick += uStep) {
      if (Math.abs(uTick) < 1e-6) uTick = 0
      const px = toPxX(uTick)
      if (px < padL + 10 || px > padL + plotW - 10) continue
      ctx.strokeStyle = TOKENS.line
      ctx.beginPath()
      ctx.moveTo(px, botY1)
      ctx.lineTo(px, botY1 + 4)
      ctx.stroke()
      const tickLabel = formatNumber(uTick, uStep < 1 ? 1 : 0)
      const halfTickW = ctx.measureText(tickLabel).width * 0.5
      if (px + halfTickW <= tickRightLimit) {
        ctx.fillText(tickLabel, px, botY1 + 6)
      }
    }

    drawMathText(ctx, s.quantScene.xAxisLabel, padL + plotW - 4, botY1 + 6, {
      color: TOKENS.muted,
      size: 11,
      align: 'right',
      backdrop: TOKENS.bg
    })

    // Etichetta asse y inferiore
    drawMathText(ctx, s.quantScene.probLabel, padL + 6, botY0 + 10, {
      color: quantityColor(isThermal ? 'T' : 'psi'),
      size: 11,
      align: 'left',
      backdrop: TOKENS.bg
    })

    const { u } = model.curves
    const tunnelColor = quantityColor(isThermal ? 'T' : 'psi')

    // Riempimento code di tunneling nelle regioni proibite |u| > u_cl
    ctx.save()
    ctx.globalAlpha = em(isThermal ? 'T' : 'psi') * 0.24
    ctx.fillStyle = tunnelColor
    const fillTail = (side: 'left' | 'right'): void => {
      ctx.beginPath()
      let any = false
      let firstX = 0
      let lastX = 0
      for (let i = 0; i < u.length; i++) {
        const uv = u[i]
        const inTail = side === 'left' ? uv <= -activeUCl : uv >= activeUCl
        if (!inTail) continue
        const px = toPxX(uv)
        const py = toBotY(qArr[i])
        if (!any) {
          firstX = px
          ctx.moveTo(px, botY1)
          ctx.lineTo(px, py)
          any = true
        } else {
          ctx.lineTo(px, py)
        }
        lastX = px
      }
      if (any) {
        ctx.lineTo(lastX, botY1)
        ctx.lineTo(firstX, botY1)
        ctx.closePath()
        ctx.fill()
      }
    }
    fillTail('left')
    fillTail('right')
    ctx.restore()

    // Curva classica P_cl(u) tratteggiata (clippata dentro botY0..botY1)
    const pClArr = isThermal ? model.thermalClassicalProb : model.curves.probClassical
    ctx.save()
    ctx.beginPath()
    ctx.rect(padL, botY0, plotW, botH)
    ctx.clip()
    ctx.globalAlpha = em('Ek') * 0.9
    ctx.strokeStyle = quantityColor('Ek')
    ctx.lineWidth = lw('Ek', 1.55)
    ctx.setLineDash([5, 3.5])
    ctx.beginPath()
    let clStarted = false
    for (let i = 0; i < u.length; i++) {
      if (Math.abs(u[i]) >= activeUCl) continue
      const px = toPxX(u[i])
      const py = toBotY(pClArr[i])
      if (!clStarted) {
        ctx.moveTo(px, py)
        clStarted = true
      } else {
        ctx.lineTo(px, py)
      }
    }
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()

    // In modalità termica: riferimento punteggiato P_0(u) (clippato al riquadro inferiore)
    if (isThermal) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(padL, botY0, plotW, botH)
      ctx.clip()
      ctx.globalAlpha = em('psi') * 0.48
      ctx.strokeStyle = quantityColor('psi')
      ctx.lineWidth = 1.2
      ctx.setLineDash([2, 3])
      ctx.beginPath()
      for (let i = 0; i < u.length; i++) {
        const px = toPxX(u[i])
        const py = toBotY(model.groundProb[i])
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()
    }

    // Curva quantistica principale P_n(u) oppure ⟨P(u)⟩_T
    const mainQ: QuantityId = isThermal ? 'T' : 'psi'
    ctx.save()
    ctx.globalAlpha = em(mainQ)
    ctx.strokeStyle = quantityColor(mainQ)
    ctx.lineWidth = lw(mainQ, 2.0)
    ctx.beginPath()
    for (let i = 0; i < u.length; i++) {
      const px = toPxX(u[i])
      const py = toBotY(qArr[i])
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.restore()

    // Etichette dei punti di inversione ±x_cl appena sopra la linea dell'asse inferiore
    ctx.save()
    ctx.globalAlpha = em('Ek')
    drawMathText(ctx, '-x_{cl}', xClLeft - 2, botY1 - 6, {
      color: quantityColor('Ek'),
      size: 10.5,
      align: 'right',
      backdrop: TOKENS.bg
    })
    drawMathText(ctx, '+x_{cl}', xClRight + 3, botY1 - 6, {
      color: quantityColor('Ek'),
      size: 10.5,
      align: 'left',
      backdrop: TOKENS.bg
    })
    ctx.restore()

    // Annotazione sintetica in alto a destra del sotto-grafico inferiore
    const badgeText = isThermal
      ? `n̄ = ${formatNumber(model.thermalSummary.nBar, 2)}`
      : `tunnel = ${formatNumber(model.modeSummary.tunnelingFraction * 100, 1)}%`
    ctx.save()
    ctx.font = sansFont(11, 600)
    const bw = ctx.measureText(badgeText).width + 12
    const bx = padL + plotW - bw - 4
    const by = botY0 + 3
    ctx.fillStyle = TOKENS.bg
    ctx.fillRect(bx, by, bw, 18)
    ctx.strokeStyle = withAlpha(tunnelColor, 0.55)
    ctx.lineWidth = 1
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, 17)
    ctx.fillStyle = tunnelColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(badgeText, bx + bw / 2, by + 9.5)
    ctx.restore()

    return false
  })

  return (
    <div className="phonon-q-view phonon-q-quant-stage">
      <div className="phonon-q-bar">
        <ChartLegend entries={legend} ariaLabel={s.quantScene.oscillatorAria} />
      </div>
      <div className="phonon-q-stage">
        <div className="phonon-q-main-wrap">
          <canvas
            ref={mainCanvasRef}
            className="phonon-q-canvas"
            role="img"
            aria-label={s.quantScene.oscillatorAria}
          />
        </div>
        {isThermal && <ThermalBathStrip model={model} highlight={highlight} />}
      </div>
    </div>
  )
})

const ThermalBathStrip = memo(function ThermalBathStrip({
  model,
  highlight
}: {
  readonly model: QuantizationModel
  readonly highlight: QuantityId | null
}): JSX.Element {
  const bathCanvasRef = useCanvasDraw((ctx, { w, h }) => {
    const emT = highlight === null || highlight === 'T' ? 1 : DIM

    const padL = 24
    const padR = 28
    const padT = 36
    const padB = 18
    const barMaxW = Math.max(24, w - padL - padR)
    const availH = Math.max(60, h - padT - padB)

    // Titolo colonna formattato senza $ letterali
    drawRichText(ctx, s.quantScene.bathTitle, 10, 16, {
      color: quantityColor('T'),
      size: 11.5,
      align: 'left'
    })

    const subInfo = `$n̄$=${formatNumber(model.thermalSummary.nBar, 2)} · $k_{B}T/ħω$=${formatNumber(
      1 / Math.max(1e-6, model.thermalSummary.xRatio),
      2
    )}`
    drawRichText(ctx, subInfo, 10, 30, {
      color: TOKENS.muted,
      size: 9.5,
      align: 'left'
    })

    const weights = model.levelWeights
    const count = Math.min(NUMERICS.maxThermalBars, weights.length)
    const stepY = availH / count
    const barH = Math.max(3, Math.min(11, stepY * 0.65))
    const pMax = Math.max(0.08, weights[0])

    // Linea tratteggiata n̄ disegnata prima delle barre e delle percentuali
    const nBarClamped = Math.min(count - 0.5, model.thermalSummary.nBar)
    const yMean = h - padB - (nBarClamped + 0.5) * stepY
    ctx.save()
    ctx.globalAlpha = emT * 0.8
    ctx.strokeStyle = quantityColor('T')
    ctx.lineWidth = 1.2
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(padL, yMean)
    ctx.lineTo(w - 8, yMean)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()

    for (let k = 0; k < count; k++) {
      const pk = weights[k]
      const yBottom = h - padB - (k + 0.5) * stepY
      const barW = (pk / pMax) * barMaxW

      if (stepY >= 13 || k % 2 === 0) {
        ctx.font = sansFont(9.5)
        ctx.fillStyle = TOKENS.muted
        ctx.textAlign = 'right'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(k), padL - 5, yBottom)
      }

      ctx.save()
      ctx.globalAlpha = emT * (0.28 + 0.72 * Math.min(1, pk / pMax))
      ctx.fillStyle = quantityColor('T')
      ctx.fillRect(padL, yBottom - barH / 2, Math.max(1.5, barW), barH)
      ctx.restore()

      if (k < 3 && stepY >= 8 && pk >= 0.01) {
        const pctStr = `${formatNumber(pk * 100, 0)}%`
        const pctSize = stepY >= 11 ? 9.5 : 8.5
        ctx.font = sansFont(pctSize)
        const tw = ctx.measureText(pctStr).width
        ctx.fillStyle = TOKENS.bg
        ctx.fillRect(padL + barW + 2, yBottom - 5.5, tw + 4, 11)
        ctx.fillStyle = TOKENS.textSoft
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(pctStr, padL + barW + 4, yBottom)
      }
    }

    ctx.strokeStyle = TOKENS.line
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padL + 0.5, padT + 2)
    ctx.lineTo(padL + 0.5, h - padB)
    ctx.stroke()

    return false
  })

  return (
    <div className="phonon-q-bath-wrap">
      <canvas
        ref={bathCanvasRef}
        className="phonon-q-canvas"
        aria-label={s.quantScene.bathAria}
      />
    </div>
  )
})
