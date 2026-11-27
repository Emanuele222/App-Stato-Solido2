/**
 * Vista principale (Sezione A «Pseudopotenziale»): Spazio reale su una cella x ∈ [−a/2, a/2]
 * centrata sullo ione in x = 0, divisa in tre fasce sovrapposte con asse x comune e zona |x| < r_c:
 *  1. Energie (~25%): V(x) (media zero, stesso zero di E ed E_c), E_c ed E(k).
 *  2. Funzioni d'onda (~50%): ψ_c piena (tono core), ψ_k continua con pallini sui cambi di segno,
 *     ψ^f = ψ_k + α ψ_c non normalizzata tratteggiata e area β_c ψ_c fra ψ_k e ψ^f.
 *  3. Ortogonalità (~25%): integrando Re[ψ_c*(x) ψ_k(x)] con lobi + e − e scritta «∫ = 0».
 */
import type { JSX } from 'react'
import { formatNumber } from '../../ui/format'
import { quantityColor, toneColor, TOKENS, type QuantityId } from '../../ui/theme'
import {
  buildObstacleMap,
  drawMathText,
  drawRichText,
  niceStep,
  placeFreeLabel,
  sansFont,
  useCanvasDraw,
  withAlpha,
  type PolylinePoint,
  type RectBox
} from '../../viz/canvas'
import type { PseudoCoreModel } from './model'
import type { GuidedReadingStep } from './store'

const MARGIN = { left: 44, right: 14, top: 8, bottom: 22 }
const DIM = 0.25

export function PseudoCoreRealSpaceCanvas({
  model,
  highlight,
  guidedStep
}: {
  readonly model: PseudoCoreModel
  readonly highlight: QuantityId | null
  readonly guidedStep: GuidedReadingStep
}): JSX.Element {
  const canvasRef = useCanvasDraw((ctx, { w, h }) => {
    const L = MARGIN.left
    const T = MARGIN.top
    const W = Math.max(60, w - MARGIN.left - MARGIN.right)
    const H = Math.max(120, h - MARGIN.top - MARGIN.bottom)
    const { a } = model.params
    const halfA = 0.5 * a
    const { xGrid, potential, psiCoreRe, psiTrueRe, psiSmoothRe, rc, signChanges, ortho } =
      model.realSpace

    const X = (x: number): number => L + ((x + halfA) / a) * W

    // Enfasi combinata: evidenziazione da formula/cursore oppure lettura guidata (passi 1..3)
    const hl = highlight !== null
    const emPot = hl ? (highlight === 'VG' ? 1 : DIM) : guidedStep === 1 || guidedStep === 2 ? DIM : 1
    const emValE = hl ? (highlight === 'E' ? 1 : DIM) : guidedStep === 1 || guidedStep === 2 ? DIM : 1
    const emCoreE = hl ? (highlight === 'E' || highlight === 'VG' ? 1 : DIM) : guidedStep === 1 || guidedStep === 2 ? DIM : 1
    const emCoreW = hl ? (highlight === 'psi' ? 0.5 : DIM) : guidedStep === 2 || guidedStep === 3 ? DIM : 1
    const emTrueW = hl ? (highlight === 'psi' ? 1 : DIM) : guidedStep === 2 || guidedStep === 3 ? DIM : 1
    const emDots = hl ? (highlight === 'psi' ? 1 : DIM) : guidedStep === 2 || guidedStep === 3 ? DIM : 1
    const emSmoothW = hl ? (highlight === 'psi' ? 1 : DIM) : guidedStep === 1 || guidedStep === 3 ? DIM : 1
    const emBetaArea = hl ? (highlight === 'psi' ? 1 : DIM) : guidedStep === 1 || guidedStep === 3 ? DIM : 1
    const emOrtho = hl ? (highlight === 'psi' ? 1 : DIM) : guidedStep === 2 || guidedStep === 3 ? DIM : 1

    const coreColor = toneColor('coreState')
    const potColor = quantityColor('VG')
    const valEColor = quantityColor('E')
    const psiColor = quantityColor('psi')
    const smoothColor = toneColor('smoothWavefunction')

    // Ripartizione verticale: 25% energie, 50% funzioni d'onda, 25% ortogonalità
    const bandGap = 10
    const usableH = Math.max(90, H - 2 * bandGap)
    const eTop = T
    const eH = usableH * 0.25
    const wTop = eTop + eH + bandGap
    const wH = usableH * 0.5
    const oTop = wTop + wH + bandGap
    const oH = usableH * 0.25

    // Banda tenue del core |x| < r_c su tutte e tre le fasce
    const xL = Math.max(L, X(-rc))
    const xR = Math.min(L + W, X(rc))
    ctx.save()
    ctx.fillStyle = withAlpha(coreColor, 0.08)
    ctx.fillRect(xL, T, xR - xL, H)
    ctx.strokeStyle = withAlpha(coreColor, 0.42)
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(xL, T)
    ctx.lineTo(xL, T + H)
    ctx.moveTo(xR, T)
    ctx.lineTo(xR, T + H)
    ctx.stroke()
    ctx.restore()

    // Separatori sottili fra le fasce
    ctx.strokeStyle = TOKENS.line
    ctx.lineWidth = 1
    for (const sepY of [wTop - bandGap * 0.5, oTop - bandGap * 0.5]) {
      ctx.beginPath()
      ctx.moveTo(L, sepY)
      ctx.lineTo(L + W, sepY)
      ctx.stroke()
    }

    // ==================== FASCIA 1: ENERGIE ====================
    let minPot = potential[0]
    let maxPot = potential[0]
    for (let i = 1; i < potential.length; i++) {
      if (potential[i] < minPot) minPot = potential[i]
      if (potential[i] > maxPot) maxPot = potential[i]
    }
    const eMin = Math.min(minPot, model.eCore) - 4
    const eMax = Math.max(maxPot, model.eValence) + 6
    const yE = (E: number): number => eTop + 3 + ((eMax - E) / Math.max(1, eMax - eMin)) * (eH - 6)

    const eStep = niceStep(eMax - eMin, 2.5)
    ctx.font = sansFont(10)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let ev = Math.ceil(eMin / eStep) * eStep; ev <= eMax + 1e-6; ev += eStep) {
      const yy = yE(ev)
      if (yy < eTop + 3 || yy > eTop + eH - 3) continue
      ctx.strokeStyle = Math.abs(ev) < 1e-6 ? TOKENS.lineStrong : TOKENS.line
      ctx.beginPath()
      ctx.moveTo(L, yy)
      ctx.lineTo(L + W, yy)
      ctx.stroke()
      if (yy > eTop + 14) {
        ctx.fillStyle = TOKENS.dim
        ctx.fillText(formatNumber(ev, 0), L - 5, yy)
      }
    }

    // Segmenti verticali di energia cinetica locale E − V sullo ione e al bordo cella
    const xIon = X(0)
    const xEdge = X(halfA) - 6
    ctx.save()
    ctx.strokeStyle = withAlpha(valEColor, 0.55 * emValE)
    ctx.lineWidth = 1.4
    ctx.setLineDash([2, 2])
    ctx.beginPath()
    ctx.moveTo(xIon, yE(model.eValence))
    ctx.lineTo(xIon, yE(potential[(potential.length - 1) >> 1]))
    ctx.moveTo(xEdge, yE(model.eValence))
    ctx.lineTo(xEdge, yE(potential[potential.length - 1]))
    ctx.stroke()
    ctx.restore()

    // Livelli orizzontali E_c ed E(k)
    const yCoreLevel = yE(model.eCore)
    ctx.save()
    ctx.strokeStyle = withAlpha(coreColor, 0.85 * emCoreE)
    ctx.lineWidth = 1.4
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(L, yCoreLevel)
    ctx.lineTo(L + W, yCoreLevel)
    ctx.stroke()
    ctx.restore()

    const yValLevel = yE(model.eValence)
    ctx.save()
    ctx.strokeStyle = withAlpha(valEColor, 0.9 * emValE)
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(L, yValLevel)
    ctx.lineTo(L + W, yValLevel)
    ctx.stroke()
    ctx.restore()

    // Curva V(x)
    const potLine: PolylinePoint[] = []
    ctx.save()
    ctx.strokeStyle = withAlpha(potColor, emPot)
    ctx.lineWidth = 1.9
    ctx.beginPath()
    for (let i = 0; i < xGrid.length; i++) {
      const px = X(xGrid[i])
      const py = yE(potential[i])
      potLine.push({ x: px, y: py })
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.restore()

    // Etichette libere nella fascia energie (evitando anche collisioni tra etichette)
    const eRegion: RectBox = { x0: L + 4, y0: eTop + 1, x1: L + W - 4, y1: eTop + eH - 1 }
    const eLines: readonly PolylinePoint[][] = [
      potLine,
      [{ x: L, y: yCoreLevel }, { x: L + W, y: yCoreLevel }],
      [{ x: L, y: yValLevel }, { x: L + W, y: yValLevel }]
    ]
    const eOcc: RectBox[] = []
    placeFreeLabel(ctx, {
      text: 'E(k)',
      size: 10.5,
      color: withAlpha(valEColor, emValE),
      backdrop: TOKENS.bg,
      anchor: { x: L + W * 0.86, y: yValLevel },
      obstacles: buildObstacleMap(eRegion, eLines, eOcc),
      region: eRegion,
      occupied: eOcc,
      leader: false
    })
    placeFreeLabel(ctx, {
      text: 'E_{c}',
      size: 10.5,
      color: withAlpha(coreColor, emCoreE),
      backdrop: TOKENS.bg,
      anchor: { x: L + W * 0.82, y: yCoreLevel },
      obstacles: buildObstacleMap(eRegion, eLines, eOcc),
      region: eRegion,
      occupied: eOcc,
      leader: false
    })
    placeFreeLabel(ctx, {
      text: 'V(x)',
      size: 10.5,
      color: withAlpha(potColor, emPot),
      backdrop: TOKENS.bg,
      anchor: { x: X(-0.18 * a), y: yE(potential[Math.floor(xGrid.length * 0.35)]) },
      obstacles: buildObstacleMap(eRegion, eLines, eOcc),
      region: eRegion,
      occupied: eOcc,
      leader: false
    })

    // Unità eV in alto a sinistra fuori griglia
    ctx.font = sansFont(9.5)
    ctx.fillStyle = TOKENS.dim
    ctx.textAlign = 'right'
    ctx.fillText('eV', L - 5, eTop + 6)

    // ==================== FASCIA 2: FUNZIONI D'ONDA ====================
    const wMid = wTop + wH * 0.5
    let maxAbs = 0.25
    for (let i = 0; i < xGrid.length; i++) {
      maxAbs = Math.max(
        maxAbs,
        Math.abs(psiCoreRe[i]),
        Math.abs(psiTrueRe[i]),
        Math.abs(psiSmoothRe[i])
      )
    }
    const yW = (val: number): number => wMid - (val / (maxAbs * 1.12)) * (wH * 0.46)

    // Asse dello zero delle funzioni d'onda
    ctx.strokeStyle = TOKENS.lineStrong
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(L, wMid)
    ctx.lineTo(L + W, wMid)
    ctx.stroke()

    ctx.font = sansFont(10)
    ctx.fillStyle = TOKENS.dim
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText('0', L - 5, wMid)

    // 1. Area tra ψ_k e ψ^f (= β_c ψ_c)
    if (Math.abs(model.effectiveAlpha) > 0.01) {
      ctx.save()
      ctx.fillStyle = withAlpha(coreColor, 0.16 * emBetaArea)
      ctx.beginPath()
      for (let i = 0; i < xGrid.length; i++) {
        const px = X(xGrid[i])
        const py = yW(psiTrueRe[i])
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      for (let i = xGrid.length - 1; i >= 0; i--) {
        ctx.lineTo(X(xGrid[i]), yW(psiSmoothRe[i]))
      }
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    // 2. ψ_c come area piena + contorno continuo >= 2 px nel colore del core
    const coreLine: PolylinePoint[] = []
    ctx.save()
    ctx.fillStyle = withAlpha(coreColor, 0.22 * emCoreW)
    ctx.beginPath()
    ctx.moveTo(X(xGrid[0]), wMid)
    for (let i = 0; i < xGrid.length; i++) {
      const px = X(xGrid[i])
      const py = yW(psiCoreRe[i])
      coreLine.push({ x: px, y: py })
      ctx.lineTo(px, py)
    }
    ctx.lineTo(X(xGrid[xGrid.length - 1]), wMid)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = withAlpha(coreColor, emCoreW)
    ctx.lineWidth = 2.4
    ctx.beginPath()
    for (let i = 0; i < coreLine.length; i++) {
      if (i === 0) ctx.moveTo(coreLine[i].x, coreLine[i].y)
      else ctx.lineTo(coreLine[i].x, coreLine[i].y)
    }
    ctx.stroke()
    ctx.restore()

    // 3. ψ_k vera continua + pallini sui cambi di segno dentro il core
    const trueLine: PolylinePoint[] = []
    ctx.save()
    ctx.strokeStyle = withAlpha(psiColor, emTrueW)
    ctx.lineWidth = 2.1
    ctx.beginPath()
    for (let i = 0; i < xGrid.length; i++) {
      const px = X(xGrid[i])
      const py = yW(psiTrueRe[i])
      trueLine.push({ x: px, y: py })
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.restore()

    const dotBoxes: RectBox[] = []
    for (const xc of signChanges) {
      const px = X(xc)
      ctx.save()
      ctx.fillStyle = withAlpha(psiColor, emDots)
      ctx.strokeStyle = TOKENS.bg
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.arc(px, wMid, 4.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
      dotBoxes.push({ x0: px - 6, y0: wMid - 6, x1: px + 6, y1: wMid + 6 })
    }

    // 4. ψ^f = ψ_k + α ψ_c non normalizzata, tratteggiata
    const smoothLine: PolylinePoint[] = []
    ctx.save()
    ctx.strokeStyle = withAlpha(smoothColor, emSmoothW)
    ctx.lineWidth = 2.2
    ctx.setLineDash([7, 4])
    ctx.beginPath()
    for (let i = 0; i < xGrid.length; i++) {
      const px = X(xGrid[i])
      const py = yW(psiSmoothRe[i])
      smoothLine.push({ x: px, y: py })
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.restore()

    // Etichette libere nella fascia funzioni d'onda (ricostruendo gli ingombri dopo ogni etichetta)
    const wRegion: RectBox = { x0: L + 4, y0: wTop + 2, x1: L + W - 4, y1: wTop + wH - 2 }
    const wLines: readonly PolylinePoint[][] = [coreLine, trueLine, smoothLine]
    const wOcc: RectBox[] = [...dotBoxes]

    const ionIdx = (xGrid.length - 1) >> 1
    const edgeIdx = Math.round(xGrid.length * 0.86)
    placeFreeLabel(ctx, {
      text: 'ψ_{c}',
      size: 11.5,
      color: withAlpha(coreColor, emCoreW),
      backdrop: TOKENS.bg,
      anchor: { x: X(0) + 12, y: yW(psiCoreRe[ionIdx] * 0.82) },
      obstacles: buildObstacleMap(wRegion, wLines, wOcc),
      region: wRegion,
      occupied: wOcc,
      leaderColor: withAlpha(coreColor, 0.7 * emCoreW)
    })
    placeFreeLabel(ctx, {
      text: 'ψ_{k}',
      size: 11.5,
      color: withAlpha(psiColor, emTrueW),
      backdrop: TOKENS.bg,
      anchor: { x: X(xGrid[edgeIdx]), y: yW(psiTrueRe[edgeIdx]) },
      obstacles: buildObstacleMap(wRegion, wLines, wOcc),
      region: wRegion,
      occupied: wOcc,
      leaderColor: withAlpha(psiColor, 0.7 * emTrueW)
    })
    if (Math.abs(model.effectiveAlpha) > 0.03) {
      placeFreeLabel(ctx, {
        text: 'ψ^{f}',
        size: 11.5,
        color: withAlpha(smoothColor, emSmoothW),
        backdrop: TOKENS.bg,
        anchor: { x: X(0) - 22, y: yW(psiSmoothRe[ionIdx]) },
        obstacles: buildObstacleMap(wRegion, wLines, wOcc),
        region: wRegion,
        occupied: wOcc,
        leaderColor: withAlpha(smoothColor, 0.7 * emSmoothW)
      })
      const midCoreIdx = Math.round(xGrid.length * 0.54)
      placeFreeLabel(ctx, {
        text: 'β_{c}ψ_{c}',
        size: 10.5,
        color: withAlpha(coreColor, emBetaArea),
        backdrop: TOKENS.bg,
        anchor: {
          x: X(xGrid[midCoreIdx]),
          y: yW(0.5 * (psiTrueRe[midCoreIdx] + psiSmoothRe[midCoreIdx]))
        },
        obstacles: buildObstacleMap(wRegion, wLines, wOcc),
        region: wRegion,
        occupied: wOcc,
        leaderColor: withAlpha(coreColor, 0.65 * emBetaArea)
      })
    }

    // ==================== FASCIA 3: ORTOGONALITÀ ====================
    const { integrand, posArea, negArea } = ortho
    let maxOrtho = 0.05
    for (let i = 0; i < integrand.length; i++) {
      maxOrtho = Math.max(maxOrtho, Math.abs(integrand[i]))
    }
    const oMid = oTop + oH * 0.5
    const yO = (v: number): number => oMid - (v / (maxOrtho * 1.18)) * (oH * 0.44)

    ctx.strokeStyle = TOKENS.lineStrong
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(L, oMid)
    ctx.lineTo(L + W, oMid)
    ctx.stroke()

    ctx.font = sansFont(10)
    ctx.fillStyle = TOKENS.dim
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText('0', L - 5, oMid)

    // Riempimento lobi positivi e negativi divisi agli zeri
    const fillSignedLobe = (positive: boolean, fillStyle: string): void => {
      ctx.save()
      ctx.fillStyle = fillStyle
      ctx.beginPath()
      ctx.moveTo(X(xGrid[0]), oMid)
      for (let i = 0; i < xGrid.length; i++) {
        const v = integrand[i]
        const clamped = positive ? Math.max(0, v) : Math.min(0, v)
        if (i > 0) {
          const prev = integrand[i - 1]
          if (prev * v < 0) {
            const frac = Math.abs(prev) / (Math.abs(prev) + Math.abs(v))
            const xZero = xGrid[i - 1] + frac * (xGrid[i] - xGrid[i - 1])
            ctx.lineTo(X(xZero), oMid)
          }
        }
        ctx.lineTo(X(xGrid[i]), yO(clamped))
      }
      ctx.lineTo(X(xGrid[xGrid.length - 1]), oMid)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    fillSignedLobe(true, withAlpha(coreColor, 0.45 * emOrtho))
    fillSignedLobe(false, withAlpha(psiColor, 0.4 * emOrtho))

    ctx.save()
    ctx.strokeStyle = withAlpha(TOKENS.textSoft, 0.85 * emOrtho)
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let i = 0; i < xGrid.length; i++) {
      const px = X(xGrid[i])
      const py = yO(integrand[i])
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.restore()

    // Etichette fascia ortogonalità con sfondo opaco
    drawRichText(ctx, 'Re[$ψ_{c}^* ψ_{k}$]', L + 6, oTop + 12, {
      size: 10.5,
      color: withAlpha(TOKENS.textSoft, emOrtho),
      align: 'left',
      backdrop: TOKENS.bg
    })
    const areaText = `+${formatNumber(posArea, 3)} / ${formatNumber(negArea, 3)}  (∫ = 0)`
    drawRichText(ctx, areaText, L + W - 6, oTop + 12, {
      size: 10.5,
      color: withAlpha(TOKENS.textSoft, emOrtho),
      align: 'right',
      backdrop: TOKENS.bg
    })

    // ==================== ASSE X COMUNE ====================
    const axisY = T + H + 13
    drawMathText(ctx, '−a/2', X(-halfA) + 4, axisY, { color: TOKENS.muted, size: 10.5, align: 'left' })
    drawMathText(ctx, '0', X(0), axisY, { color: TOKENS.muted, size: 10.5, align: 'center' })
    drawMathText(ctx, 'a/2', X(halfA) - 4, axisY, { color: TOKENS.muted, size: 10.5, align: 'right' })
    if (xR - X(0) > 16 && X(halfA) - xR > 22) {
      drawMathText(ctx, 'r_{c}', xR, axisY, { color: coreColor, size: 10.5, align: 'center' })
    }

    return false
  })

  return <canvas ref={canvasRef} />
}
