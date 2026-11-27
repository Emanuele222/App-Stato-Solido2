/**
 * Vista 2 — Spettro g(ω), pesi termici ℰ(ħω/k_B T) e mini-schema sfera di Debye
 * (nella tappa «1953 Oltre Debye» mostra DOS Debye vs 1D Van Hove e analogia corpo nero 3 vs 2 pol.).
 */
import { memo, useMemo, type JSX } from 'react'
import { formatNumber } from '../../ui/format'
import { RichText } from '../../ui/tex'
import { quantityColor, TOKENS, toneColor, type QuantityId } from '../../ui/theme'
import { ChartLegend, type LegendEntry } from '../../viz/ChartLegend'
import {
  drawMathText,
  drawRichText,
  sansFont,
  useCanvasDraw,
  withAlpha
} from '../../viz/canvas'
import type { SpecificHeatModel } from './model'
import { strings as s } from './strings'

export interface SpectrumDebyeViewProps {
  readonly model: SpecificHeatModel
  readonly highlight: QuantityId | null
}

const DIM = 0.24

function formatSci(val: number): string {
  if (!Number.isFinite(val) || val <= 0) return '0'
  const exp = Math.floor(Math.log10(val))
  const mant = val / Math.pow(10, exp)
  return `${formatNumber(mant, 2)}·10^{${exp}}`
}

export const SpectrumDebyeView = memo(function SpectrumDebyeView({
  model,
  highlight
}: SpectrumDebyeViewProps): JSX.Element {
  const is1953 = model.stage === 'beyond-1953'
  const isDP = model.stage === 'dulong-petit'
  const isEinstein = model.stage === 'einstein'

  const legend = useMemo<readonly LegendEntry[]>(() => {
    if (isDP) {
      return [
        {
          id: 'dp-all',
          keyKind: 'solid',
          color: 'var(--q-Ek)',
          label: <RichText text={s.spectrumScene.legendClassicalAll} />
        },
        {
          id: 'debye-ref',
          keyKind: 'dashed',
          color: 'var(--q-Theta)',
          label: <RichText text={s.spectrumScene.legendDebyeDos} />
        }
      ]
    }
    if (isEinstein) {
      return [
        {
          id: 'ein-spike',
          keyKind: 'solid',
          color: 'var(--q-omegaOpt)',
          label: <RichText text={s.spectrumScene.legendEinsteinSpike} />
        },
        {
          id: 'weight',
          keyKind: 'dashed',
          color: 'var(--q-T)',
          label: <RichText text={s.spectrumScene.legendWeightCurve} />
        },
        {
          id: 'threshold',
          keyKind: 'dotted',
          color: 'var(--q-T)',
          label: <RichText text={s.spectrumScene.legendThermalThreshold} />
        }
      ]
    }
    if (is1953) {
      return [
        {
          id: 'debye-dos',
          keyKind: 'dashed',
          color: 'var(--q-Theta)',
          label: <RichText text={s.spectrumScene.legendDebyeDos} />
        },
        {
          id: 'vh-dos',
          keyKind: 'solid',
          color: 'var(--tone-van-hove-dos)',
          label: <RichText text={s.spectrumScene.legendVanHove} />
        },
        {
          id: 'active',
          keyKind: 'dot',
          color: 'var(--tone-activated-modes)',
          label: <RichText text={s.spectrumScene.legendActiveArea} />
        }
      ]
    }
    // Debye o Confronto completo
    const entries: LegendEntry[] = [
      {
        id: 'debye-dos',
        keyKind: 'solid',
        color: 'var(--q-Theta)',
        label: <RichText text={s.spectrumScene.legendDebyeDos} />
      },
      {
        id: 'active',
        keyKind: 'dot',
        color: 'var(--tone-activated-modes)',
        label: <RichText text={s.spectrumScene.legendActiveArea} />
      },
      {
        id: 'weight',
        keyKind: 'dashed',
        color: 'var(--q-T)',
        label: <RichText text={s.spectrumScene.legendWeightCurve} />
      },
      {
        id: 'threshold',
        keyKind: 'dotted',
        color: 'var(--q-T)',
        label: <RichText text={s.spectrumScene.legendThermalThreshold} />
      }
    ]
    if (model.stage === 'comparison') {
      entries.push({
        id: 'ein-ref',
        keyKind: 'solid',
        color: 'var(--q-omegaOpt)',
        label: <RichText text={s.spectrumScene.legendEinsteinSpike} />
      })
    }
    return entries
  }, [isDP, isEinstein, is1953, model.stage])

  // --- Canvas sinistra: spettro g(ω) e pesi termici ---
  const leftCanvasRef = useCanvasDraw((ctx, { w, h }) => {
    const em = (q: QuantityId): number => (highlight === null || highlight === q ? 1 : DIM)
    const hasRightWeightAxis = !isEinstein && !is1953
    const padL = 42
    const padR = hasRightWeightAxis ? 30 : 14
    const padT = 20
    const padB = 30
    const plotW = Math.max(90, w - padL - padR)
    const plotH = Math.max(60, h - padT - padB)
    const x0 = padL
    const x1 = padL + plotW
    const y0 = padT
    const y1 = padT + plotH

    const wMaxAxis = 1.12
    const yMaxAxis = is1953 ? 6.4 : isEinstein ? 1.15 : 3.25
    const toPxX = (ww: number): number => x0 + (ww / wMaxAxis) * plotW
    const toPxY = (yy: number): number => y1 - (Math.min(yMaxAxis, Math.max(0, yy)) / yMaxAxis) * plotH

    // Griglia leggera
    ctx.save()
    ctx.strokeStyle = TOKENS.line
    ctx.lineWidth = 1
    for (const wt of [0.25, 0.5, 0.75, 1.0]) {
      const px = Math.round(toPxX(wt)) + 0.5
      ctx.beginPath()
      ctx.moveTo(px, y0)
      ctx.lineTo(px, y1)
      ctx.stroke()
    }
    const yTicks = is1953 ? [2, 4, 6] : isEinstein ? [0.5, 1] : [1, 2, 3]
    for (const yt of yTicks) {
      const py = Math.round(toPxY(yt)) + 0.5
      ctx.beginPath()
      ctx.moveTo(x0, py)
      ctx.lineTo(x1, py)
      ctx.stroke()
    }
    ctx.strokeStyle = TOKENS.lineStrong
    ctx.beginPath()
    ctx.moveTo(x0 + 0.5, y0)
    ctx.lineTo(x0 + 0.5, y1 + 0.5)
    ctx.lineTo(x1, y1 + 0.5)
    if (hasRightWeightAxis) {
      ctx.moveTo(x1 + 0.5, y0)
      ctx.lineTo(x1 + 0.5, y1 + 0.5)
    }
    ctx.stroke()
    ctx.restore()

    // Etichette assi
    ctx.save()
    ctx.fillStyle = TOKENS.muted
    ctx.font = sansFont(10)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    for (const wt of [0, 0.5, 1.0]) {
      const lbl = wt === 0 ? '0' : wt === 0.5 ? '0,5' : '1'
      ctx.fillText(lbl, toPxX(wt), y1 + 4)
    }
    drawMathText(
      ctx,
      is1953 ? 'ω_{max}' : 'ω_D',
      toPxX(1.0) - 5,
      y1 - 8,
      {
        size: 10,
        color: quantityColor('Theta'),
        align: 'right',
        backdrop: TOKENS.bg
      }
    )
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (const yt of yTicks) {
      const lbl = yt === 0.5 ? '0,5' : String(yt)
      ctx.fillText(lbl, x0 - 6, toPxY(yt))
    }

    if (hasRightWeightAxis) {
      const weightColor = isDP ? quantityColor('Ek') : quantityColor('T')
      ctx.fillStyle = weightColor
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      for (const [wv, wLbl] of [
        [0, '0'],
        [1.35, '0,5'],
        [2.7, '1']
      ] as const) {
        ctx.fillText(wLbl, x1 + 5, toPxY(wv))
      }
      drawRichText(ctx, 'ℰ', x1 + 5, y0 - 6, {
        size: 11,
        color: weightColor,
        align: 'left'
      })
    }

    drawRichText(
      ctx,
      isEinstein ? 'Peso ℰ($ħω/k_B T$)' : '$g(ω)$ norm.',
      x0,
      y0 - 6,
      { size: 11, color: TOKENS.textSoft, align: 'left' }
    )
    drawMathText(ctx, is1953 ? 'ω / ω_{max}' : 'ω / ω_D', x1, h - 5, {
      size: 10.5,
      color: TOKENS.textSoft,
      align: 'right'
    })
    ctx.restore()

    const samples = model.spectrumSamples
    const xCut = toPxX(1.0)

    if (isDP) {
      // Dulong–Petit: tutta l'area sotto g(ω) di Debye ha peso classico = 1
      ctx.save()
      ctx.globalAlpha = em('Ek')
      ctx.fillStyle = withAlpha(quantityColor('Ek'), 0.22)
      ctx.beginPath()
      ctx.moveTo(toPxX(0), y1)
      for (const sPt of samples) {
        ctx.lineTo(toPxX(sPt.w), toPxY(sPt.debyeDos))
      }
      ctx.lineTo(xCut, y1)
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = quantityColor('Theta')
      ctx.lineWidth = 1.6
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      samples.forEach((sPt, i) => {
        const px = toPxX(sPt.w)
        const py = toPxY(sPt.debyeDos)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.lineTo(xCut, y1)
      ctx.stroke()

      // Linea orizzontale peso classico = 1 (in scala secondaria 1 -> 2.7)
      const pyOne = toPxY(2.7)
      ctx.setLineDash([])
      ctx.strokeStyle = quantityColor('Ek')
      ctx.lineWidth = 2.1
      ctx.beginPath()
      ctx.moveTo(x0, pyOne)
      ctx.lineTo(xCut, pyOne)
      ctx.stroke()
      drawRichText(ctx, 'peso classico = 1 (tutti i modi attivi)', (x0 + xCut) / 2, pyOne - 7, {
        size: 10.5,
        color: quantityColor('Ek'),
        align: 'center'
      })
      ctx.restore()
      return false
    }

    if (is1953) {
      // 1953 Oltre Debye: DOS 1D con Van Hove + riempimento termico vs Debye 3D
      // Area attiva sulla DOS 1D
      ctx.save()
      ctx.globalAlpha = em('T')
      ctx.fillStyle = withAlpha(toneColor('activatedModes'), 0.34)
      ctx.beginPath()
      ctx.moveTo(x0, y1)
      for (const sPt of samples) {
        ctx.lineTo(toPxX(sPt.w), toPxY(sPt.dos1DActive))
      }
      ctx.lineTo(xCut, y1)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      // Curva Debye tratteggiata (sempre colore Theta per coerenza fra tutte le tappe)
      ctx.save()
      ctx.globalAlpha = em('Theta') * 0.9
      ctx.strokeStyle = quantityColor('Theta')
      ctx.lineWidth = 1.8
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      samples.forEach((sPt, i) => {
        const px = toPxX(sPt.w)
        const py = toPxY(sPt.debyeDos)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.lineTo(xCut, y1)
      ctx.stroke()
      ctx.restore()

      // Curva 1D Van Hove solida
      ctx.save()
      ctx.globalAlpha = em('CV')
      ctx.strokeStyle = toneColor('vanHoveDos')
      ctx.lineWidth = 2.2
      ctx.beginPath()
      samples.forEach((sPt, i) => {
        const px = toPxX(sPt.w)
        const py = toPxY(sPt.dos1D)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.stroke()

      // Asintoto Van Hove a ω = ω_max (v_g → 0)
      ctx.strokeStyle = withAlpha(quantityColor('v'), 0.65)
      ctx.lineWidth = 1.2
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(xCut, y0)
      ctx.lineTo(xCut, y1)
      ctx.stroke()
      ctx.restore()

      drawRichText(ctx, '$v_g$ → 0 (Van Hove)', Math.min(xCut - 6, x1 - 4), y0 + 13, {
        size: 10.5,
        color: quantityColor('v'),
        align: 'right',
        backdrop: TOKENS.bg
      })
      return false
    }

    // --- Modalità Einstein, Debye, Confronto completo ---
    if (!isEinstein) {
      // 1. Area congelata (tutta la parabola Debye tenue)
      ctx.save()
      ctx.globalAlpha = em('Theta')
      ctx.fillStyle = withAlpha(quantityColor('Theta'), 0.11)
      ctx.beginPath()
      ctx.moveTo(x0, y1)
      for (const sPt of samples) {
        ctx.lineTo(toPxX(sPt.w), toPxY(sPt.debyeDos))
      }
      ctx.lineTo(xCut, y1)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      // 2. Area termicamente attiva: g(ω) * ℰ(ħω / k_B T)
      ctx.save()
      ctx.globalAlpha = em('T')
      ctx.fillStyle = withAlpha(toneColor('activatedModes'), 0.42)
      ctx.beginPath()
      ctx.moveTo(x0, y1)
      for (const sPt of samples) {
        ctx.lineTo(toPxX(sPt.w), toPxY(sPt.debyeActive))
      }
      ctx.lineTo(xCut, y1)
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = quantityColor('T')
      ctx.lineWidth = 1.7
      ctx.beginPath()
      samples.forEach((sPt, i) => {
        const px = toPxX(sPt.w)
        const py = toPxY(sPt.debyeActive)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.stroke()
      ctx.restore()

      // 3. Bordo superiore parabola Debye + taglio verticale a ω_D
      ctx.save()
      ctx.globalAlpha = em('Theta')
      ctx.strokeStyle = quantityColor('Theta')
      ctx.lineWidth = 2.1
      ctx.beginPath()
      samples.forEach((sPt, i) => {
        const px = toPxX(sPt.w)
        const py = toPxY(sPt.debyeDos)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.lineTo(xCut, y1)
      ctx.stroke()
      ctx.restore()
    }

    // 4. Picco di Einstein δ(ω - ω_E) (in Einstein e Confronto completo)
    if (isEinstein || model.stage === 'comparison') {
      const wE = model.params.einsteinRatio
      const pxE = toPxX(wE)
      const spikeH = isEinstein ? 1.0 : 2.35
      const pyTop = toPxY(spikeH)
      const activeFrac = model.summary.einsteinNorm
      const pyFill = toPxY(spikeH * activeFrac)
      ctx.save()
      ctx.globalAlpha = em('omegaOpt')
      // Stelo completo (grigio/arancio tenue)
      ctx.strokeStyle = withAlpha(quantityColor('omegaOpt'), 0.35)
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(pxE, y1)
      ctx.lineTo(pxE, pyTop)
      ctx.stroke()
      // Parte termicamente attivata dal basso
      ctx.strokeStyle = quantityColor('omegaOpt')
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(pxE, y1)
      ctx.lineTo(pxE, pyFill)
      ctx.stroke()
      // Capocchia
      ctx.fillStyle = quantityColor('omegaOpt')
      ctx.beginPath()
      ctx.arc(pxE, pyTop, 4.5, 0, Math.PI * 2)
      ctx.fill()
      drawMathText(ctx, 'ω_E', pxE + 7, pyTop + 4, {
        size: 11,
        color: quantityColor('omegaOpt'),
        align: 'left',
        backdrop: TOKENS.bg
      })
      ctx.restore()
    }

    // 5. Curva peso termico ℰ(ħω / k_B T): scala reale [0, 1] in Einstein, [0, 2.7] su asse destro in Debye/Confronto
    const weightTop = isEinstein ? 1.0 : 2.7
    ctx.save()
    ctx.globalAlpha = em('T') * 0.9
    ctx.strokeStyle = quantityColor('T')
    ctx.lineWidth = 1.6
    ctx.setLineDash([5, 4])
    ctx.beginPath()
    for (let i = 0; i < samples.length; i++) {
      const sPt = samples[i]
      const px = toPxX(sPt.w)
      const py = toPxY(sPt.einsteinWeight * weightTop)
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.restore()

    // 6. Soglia mobile ħω = k_B T (w_T = T / Θ_D)
    const wT = model.summary.tOverThetaD
    const thresholdColor = quantityColor('T')
    if (wT <= wMaxAxis) {
      const pxT = toPxX(wT)
      ctx.save()
      ctx.globalAlpha = em('T') * 0.92
      ctx.strokeStyle = thresholdColor
      ctx.lineWidth = 1.5
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(pxT, y0)
      ctx.lineTo(pxT, y1)
      ctx.stroke()
      drawRichText(
        ctx,
        '$ħω = k_B T$',
        Math.min(Math.max(pxT, x0 + 48), x1 - 46),
        y0 + 11,
        {
          size: 10,
          color: thresholdColor,
          align: 'center',
          backdrop: TOKENS.bg
        }
      )
      ctx.restore()
    } else {
      drawRichText(ctx, '$k_B T > ħω_D$ →', x1 - 4, y0 + 11, {
        size: 10,
        color: thresholdColor,
        align: 'right',
        backdrop: TOKENS.bg
      })
    }

    return false
  })

  // --- Canvas destra: Sfera di Debye (k_D vs k_T) oppure Analogia corpo nero 1953 ---
  const rightCanvasRef = useCanvasDraw((ctx, { w, h }) => {
    const em = (q: QuantityId): number => (highlight === null || highlight === q ? 1 : DIM)
    const padX = 12
    const padTop = 22
    const padBot = 40

    if (is1953) {
      // Analogia corpo nero: 3 polarizzazioni fononi vs 2 polarizzazioni fotoni (T⁴)
      drawRichText(ctx, s.spectrumScene.blackBodyTitle, w / 2, 14, {
        size: 11,
        weight: 600,
        color: TOKENS.textSoft,
        align: 'center'
      })

      const innerW = Math.max(80, w - padX * 2)
      const barMaxW = Math.max(40, innerW - 10)
      const avail = Math.max(95, h - padTop - 10)
      const yRow1 = padTop + Math.round(avail * 0.14)
      const rowGap = Math.min(40, Math.max(30, Math.round(avail * 0.27)))
      const yRow2 = yRow1 + rowGap

      // Barra 1: Fononi (3 pol.: 1 LA + 2 TA)
      ctx.save()
      ctx.globalAlpha = em('omega')
      drawRichText(ctx, 'Fononi: 3 pol. (LA + 2 TA)', padX, yRow1 - 6, {
        size: 10,
        color: quantityColor('omega'),
        align: 'left'
      })
      ctx.fillStyle = withAlpha(quantityColor('omega'), 0.25)
      ctx.strokeStyle = quantityColor('omega')
      ctx.lineWidth = 1.5
      ctx.fillRect(padX, yRow1, barMaxW, 12)
      ctx.strokeRect(padX + 0.5, yRow1 + 0.5, barMaxW - 1, 11)
      ctx.restore()

      // Barra 2: Fotoni (2 pol. trasversali -> 2/3 della lunghezza a parità di velocità)
      const photonBarW = barMaxW * (2 / 3)
      ctx.save()
      ctx.globalAlpha = em('Ek')
      drawRichText(ctx, 'Fotoni: 2 pol. trasv.', padX, yRow2 - 6, {
        size: 10,
        color: quantityColor('Ek'),
        align: 'left'
      })
      ctx.fillStyle = withAlpha(quantityColor('Ek'), 0.25)
      ctx.strokeStyle = quantityColor('Ek')
      ctx.lineWidth = 1.5
      ctx.fillRect(padX, yRow2, photonBarW, 12)
      ctx.strokeRect(padX + 0.5, yRow2 + 0.5, photonBarW - 1, 11)
      ctx.restore()

      // Riepilogo numerico sotto le barre
      const yInfo = yRow2 + 24
      const lineStep = Math.min(15, Math.max(13, Math.floor((h - yInfo - 6) / 3.2)))
      drawRichText(
        ctx,
        `Stima $v_s$ ≈ ${Math.round(model.blackBody.soundSpeedMS)} m/s`,
        padX,
        yInfo,
        { size: 9.8, color: TOKENS.muted, align: 'left' }
      )
      drawRichText(
        ctx,
        'Rapporto ($v_s=c$): 3/2 = 1,5',
        padX,
        yInfo + lineStep,
        { size: 10, color: TOKENS.textSoft, align: 'left' }
      )
      drawRichText(
        ctx,
        `$ũ_{ph} = ${formatSci(model.blackBody.phononEnergyDensityJm3)}$ J/m³`,
        padX,
        yInfo + lineStep * 2,
        { size: 10, color: quantityColor('T'), align: 'left' }
      )
      const regimeTxt = model.blackBody.regimeValidLowT
        ? 'Regime $T^4$ ($T$ ≤ $Θ_D$/10)'
        : 'Taglio $ω_D$ attivo ($T > Θ_D$/10)'
      drawRichText(ctx, regimeTxt, padX, Math.min(h - 6, yInfo + lineStep * 3), {
        size: 9.8,
        color: model.blackBody.regimeValidLowT ? quantityColor('omega') : TOKENS.muted,
        align: 'left'
      })
      return false
    }

    if (isEinstein) {
      // --- Scala dei livelli equi-spaziati di Einstein (stile Fig. 23 dispensa) ---
      drawRichText(ctx, s.spectrumScene.einsteinModesTitle, w / 2, 14, {
        size: 11,
        weight: 600,
        color: TOKENS.textSoft,
        align: 'center'
      })
      const ladderX0 = padX + 18
      const ladderX1 = w - padX - 24
      const baseY = h - 42
      const topY = padTop + 14
      const maxSteps = 3.6
      const stepPx = Math.max(16, (baseY - topY) / maxSteps)

      ctx.save()
      ctx.globalAlpha = em('omegaOpt')
      ctx.strokeStyle = quantityColor('omegaOpt')
      ctx.lineWidth = 2
      for (let n = 0; n <= 3; n++) {
        const ly = baseY - n * stepPx
        if (ly < padTop + 4) break
        ctx.beginPath()
        ctx.moveTo(ladderX0, ly)
        ctx.lineTo(ladderX1, ly)
        ctx.stroke()
      }
      // Freccia spaziatura ΔE = ħω_E tra n=0 e n=1
      const y0Lvl = baseY
      const y1Lvl = baseY - stepPx
      const arrowX = ladderX1 + 8
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(arrowX, y0Lvl)
      ctx.lineTo(arrowX, y1Lvl)
      ctx.stroke()
      drawMathText(ctx, 'ħω_E', arrowX - 2, (y0Lvl + y1Lvl) / 2 + 4, {
        size: 10,
        color: quantityColor('omegaOpt'),
        align: 'right',
        backdrop: TOKENS.bg
      })
      ctx.restore()

      // Barra energia termica k_B T a sinistra rispetto alla spaziatura ħω_E
      const ratioT = model.summary.tOverThetaE
      const barH = Math.min(baseY - topY, ratioT * stepPx)
      const barX = padX + 4
      ctx.save()
      ctx.globalAlpha = em('T')
      ctx.strokeStyle = quantityColor('T')
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(barX, baseY)
      ctx.lineTo(barX, baseY - barH)
      ctx.stroke()
      drawMathText(
        ctx,
        'k_B T',
        barX + 6,
        Math.max(topY + 6, baseY - barH),
        {
          size: 10,
          color: quantityColor('T'),
          align: 'left',
          backdrop: TOKENS.bg
        }
      )
      ctx.restore()

      drawRichText(
        ctx,
        `Peso modo ℰ = ${formatNumber(model.summary.einsteinNorm * 100, 1)}%`,
        w / 2,
        h - 22,
        { size: 10, color: quantityColor('omegaOpt'), align: 'center' }
      )
      drawRichText(
        ctx,
        `$k_B T / ħω_E$ = ${formatNumber(ratioT, 2)}`,
        w / 2,
        h - 8,
        { size: 10, color: TOKENS.textSoft, align: 'center' }
      )
      return false
    }

    // --- Mini-schema Sfera di Debye (k_D vs raggio termico k_T) ---
    drawRichText(ctx, s.spectrumScene.sphereTitle, w / 2, 14, {
      size: 11,
      weight: 600,
      color: TOKENS.textSoft,
      align: 'center'
    })

    const availW = Math.max(60, w - padX * 2)
    const availH = Math.max(60, h - padTop - padBot)
    const rDebye = Math.max(24, Math.min(availW, availH) * 0.41)
    const cx = w / 2
    const cy = padTop + availH * 0.5

    // 1BZ quadrata circoscritta (area ≈ area cerchio -> lato = sqrt(π) * rDebye)
    const bzHalf = rDebye * 0.886
    ctx.save()
    ctx.strokeStyle = TOKENS.lineStrong
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.strokeRect(cx - bzHalf, cy - bzHalf, bzHalf * 2, bzHalf * 2)
    ctx.restore()

    // Griglia discreta di punti k (Born–von Kármán, stile Fig. 24)
    const gridN = 4
    const step = (rDebye * 1.9) / (gridN * 2)
    ctx.save()
    for (let ix = -gridN; ix <= gridN; ix++) {
      for (let iy = -gridN; iy <= gridN; iy++) {
        const px = cx + ix * step
        const py = cy + iy * step
        const dist = Math.hypot(px - cx, py - cy)
        if (dist > rDebye * 1.03) continue
        ctx.fillStyle = withAlpha(TOKENS.muted, 0.45)
        ctx.beginPath()
        ctx.arc(px, py, 1.35, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()

    if (isDP) {
      // Dulong–Petit: sfera completamente piena (equipartizione su tutti i 3N modi)
      ctx.save()
      ctx.globalAlpha = em('Ek')
      ctx.fillStyle = withAlpha(quantityColor('Ek'), 0.24)
      ctx.strokeStyle = quantityColor('Ek')
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, rDebye, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    } else if (isEinstein) {
      // Einstein: guscio singolo a k_E (una sola frequenza ω_E)
      const rE = rDebye * model.params.einsteinRatio
      ctx.save()
      ctx.globalAlpha = em('Theta') * 0.5
      ctx.strokeStyle = quantityColor('Theta')
      ctx.lineWidth = 1.4
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.arc(cx, cy, rDebye, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()

      ctx.save()
      ctx.globalAlpha = em('omegaOpt')
      ctx.strokeStyle = quantityColor('omegaOpt')
      ctx.lineWidth = 3.2
      ctx.beginPath()
      ctx.arc(cx, cy, rE, 0, Math.PI * 2)
      ctx.stroke()
      drawMathText(ctx, 'ω_E', cx + rE * 0.65, cy - rE * 0.65, {
        size: 10.5,
        color: quantityColor('omegaOpt'),
        align: 'left',
        backdrop: TOKENS.bg
      })
      ctx.restore()
    } else {
      // Debye / Confronto: sfera esterna k_D e sfera termica interna k_T = k_D · min(1, T/Θ_D)
      const frac = model.summary.sphereRadiusFraction
      const rTherm = Math.max(2, rDebye * frac)

      ctx.save()
      ctx.globalAlpha = em('T')
      ctx.fillStyle = withAlpha(toneColor('activatedModes'), 0.34)
      ctx.strokeStyle = quantityColor('T')
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.arc(cx, cy, rTherm, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.restore()

      ctx.save()
      ctx.globalAlpha = em('Theta')
      ctx.strokeStyle = quantityColor('Theta')
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, rDebye, 0, Math.PI * 2)
      ctx.stroke()

      // Vettore raggio k_D in alto a destra
      const angD = -Math.PI / 5
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + rDebye * Math.cos(angD), cy + rDebye * Math.sin(angD))
      ctx.stroke()
      drawMathText(
        ctx,
        'k_D',
        cx + (rDebye + 6) * Math.cos(angD),
        cy + (rDebye + 6) * Math.sin(angD),
        {
          size: 10.5,
          color: quantityColor('Theta'),
          align: 'left',
          backdrop: TOKENS.bg
        }
      )
      ctx.restore()

      if (frac > 0.14 && frac < 0.96) {
        ctx.save()
        ctx.globalAlpha = em('k')
        ctx.strokeStyle = quantityColor('k')
        ctx.lineWidth = 1.5
        const angT = Math.PI / 4
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + rTherm * Math.cos(angT), cy + rTherm * Math.sin(angT))
        ctx.stroke()
        drawMathText(
          ctx,
          'k_T',
          cx + (rTherm + 6) * Math.cos(angT),
          cy + (rTherm + 6) * Math.sin(angT) + 4,
          {
            size: 10,
            color: quantityColor('k'),
            align: 'left',
            backdrop: TOKENS.bg
          }
        )
        ctx.restore()
      }
    }

    // Didascalia quantitativa in basso
    const volPct = Math.pow(model.summary.sphereRadiusFraction, 3) * 100
    const bottomText1 = isDP
      ? 'Modi attivi: 100% (classico)'
      : isEinstein
        ? `Peso modo: ${formatNumber(model.summary.einsteinNorm * 100, 1)}%`
        : `$k_T / k_D$ = ${formatNumber(model.summary.sphereRadiusFraction, 2)}`
    const bottomText2 = isDP
      ? 'Indipendente da $T$'
      : isEinstein
        ? 'Singola frequenza $ω_E$'
        : `Vol. $(T/Θ_D)^3$ = ${formatNumber(volPct, volPct < 1 ? 2 : 1)}%`

    drawRichText(ctx, bottomText1, cx, h - 22, {
      size: 10,
      color: isDP ? quantityColor('Ek') : isEinstein ? quantityColor('omegaOpt') : quantityColor('k'),
      align: 'center'
    })
    drawRichText(ctx, bottomText2, cx, h - 8, {
      size: 10,
      color: TOKENS.textSoft,
      align: 'center'
    })

    return false
  })

  return (
    <div className="phonon-sh-view phonon-sh-spectrum-stage">
      <div className="phonon-sh-bar">
        <ChartLegend entries={legend} ariaLabel={s.spectrumScene.legendAria} />
      </div>
      <div className="phonon-sh-stage">
        <div className="phonon-sh-main-wrap">
          <canvas
            ref={leftCanvasRef}
            className="phonon-sh-canvas"
            role="img"
            aria-label={
              is1953
                ? s.spectrumScene.aria1953
                : isEinstein
                  ? s.spectrumScene.ariaEinstein
                  : s.spectrumScene.ariaStandard
            }
          />
        </div>
        <div className="phonon-sh-side-wrap">
          <canvas
            ref={rightCanvasRef}
            className="phonon-sh-canvas"
            role="img"
            aria-label={
              is1953
                ? s.spectrumScene.blackBodyTitle
                : isEinstein
                  ? s.spectrumScene.einsteinModesTitle
                  : s.spectrumScene.sphereTitle
            }
          />
        </div>
      </div>
    </div>
  )
})
