/**
 * Vista 1 — Proiezione isometrica 3D animata (Canvas 2D nativo, niente Three.js):
 * - Blocco cristallino in assi cartesiani fissi (x, y, z) con piani atomici di equilibrio
 *   e spostamenti reali u_{nα}(t) = Re[(ε_α / √M_α) e^{i(k·(R_n + τ_α) − ωt)}].
 * - Sulla destra della lavagna: triade vettoriale isometrica con k (--q-k) e
 *   polarizzazione εˢ(k) (colore del ramo; con ellisse di polarizzazione per modi complessi),
 *   così si distingue immediatamente LA/LO (∥ k) da TA₁/TA₂/TO₁/TO₂ (⊥ k) e dai modi misti.
 * - Barra superiore con legenda esterna ChartLegend, salti rapidi ai modi chiave
 *   e PlaybackControls (Play/Pausa, 0,25×–2×, reset fase, prefers-reduced-motion).
 *
 * Zero colori hex hardcoded: tutto arriva da ui/theme.ts.
 */
import { memo, useCallback, useMemo, useRef, type JSX } from 'react'
import {
  crystalBasisTau2,
  type BranchRole3D,
  type Crystal3DMaterial,
  type KVector,
  type Phonon3DMode,
  type SymmetryLineKind
} from '../../physics'
import { formatNumber } from '../../ui/format'
import { RichText } from '../../ui/tex'
import { quantityColor, TOKENS, toneColor, type QuantityId } from '../../ui/theme'
import { ChartLegend, type LegendEntry } from '../../viz/ChartLegend'
import { drawMathText, sansFont, useCanvasDraw, withAlpha } from '../../viz/canvas'
import { PlaybackControls, usePlaybackPhase } from '../../viz/PlaybackControls'
import { NUMERICS } from './manifest'
import { strings as s } from './strings'
import './phonon-3d.css'

export interface Polarization3DViewProps {
  readonly material: Crystal3DMaterial
  readonly k: KVector
  readonly kHat: KVector
  readonly mode: Phonon3DMode
  readonly symmetry: SymmetryLineKind
  readonly atGamma: boolean
  readonly maxOmegaRadS: number
  readonly pointIndex: number
  readonly highlight: QuantityId | null
  readonly onQuickSelect: (pointIndex: number, role: BranchRole3D) => void
}

const DIM = 0.26

export function formatRoleUnicode(role: BranchRole3D): string {
  switch (role) {
    case 'TA1':
      return 'TA₁'
    case 'TA2':
      return 'TA₂'
    case 'TO1':
      return 'TO₁'
    case 'TO2':
      return 'TO₂'
    default:
      return role
  }
}

/** Proiezione ortografica isometrica fissa di un punto 3D (x, y, z) su schermo (sx, sy) e profondità. */
function projectIso(
  x: number,
  y: number,
  z: number,
  cx: number,
  cy: number,
  scale: number
): { sx: number; sy: number; depth: number } {
  const sx = cx + (x * 0.84 - y * 0.72) * scale
  const sy = cy + (x * 0.34 + y * 0.42 - z * 0.92) * scale
  const depth = x * 0.42 + y * 0.56 - z * 0.22
  return { sx, sy, depth }
}

/** Disegna una freccia netta con punta triangolare da (x1, y1) a (x2, y2). */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  headLen = 6
): void {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len < 2.5) return
  const ux = dx / len
  const uy = dy / len
  const nx = -uy
  const ny = ux
  const hl = Math.min(headLen, len * 0.45)
  const hw = hl * 0.46

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2 - ux * hl * 0.72, y2 - uy * hl * 0.72)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - ux * hl + nx * hw, y2 - uy * hl + ny * hw)
  ctx.lineTo(x2 - ux * hl - nx * hw, y2 - uy * hl - ny * hw)
  ctx.closePath()
  ctx.fill()
}

function branchVisualColor(role: BranchRole3D): string {
  switch (role) {
    case 'LA':
      return quantityColor('omega')
    case 'TA1':
    case 'TA2':
      return toneColor('acousticTransverse')
    case 'LO':
      return quantityColor('omegaOpt')
    case 'TO1':
    case 'TO2':
      return toneColor('opticalTransverse')
  }
}

function branchQuantity(role: BranchRole3D): QuantityId {
  return role === 'LO' || role === 'TO1' || role === 'TO2' ? 'omegaOpt' : 'omega'
}

interface QuickAction {
  readonly id: string
  readonly label: string
  readonly title: string
  readonly pointIndex: number
  readonly role: BranchRole3D
}

export const Polarization3DView = memo(function Polarization3DView(
  props: Polarization3DViewProps
): JSX.Element {
  const playback = usePlaybackPhase({ initialPlaying: true, initialSpeed: 1 })
  const phaseAngleRef = useRef(0)

  const handleReset = useCallback(() => {
    phaseAngleRef.current = 0
    playback.resetPhase()
  }, [playback.resetPhase])

  const p = props.material.basisCount
  const isDiamond = props.material.structure === 'diamond'

  const quickActions = useMemo<readonly QuickAction[]>(() => {
    const pps = NUMERICS.pointsPerSegment
    const gxMid = Math.round(pps * 0.4) // 16: Γ–X
    const xkMid = pps + Math.round(pps * 0.5) // 60: X–K
    const kgMid = 2 * pps + Math.round(pps * 0.5) // 100: K–Γ ([110])
    const list: QuickAction[] = [
      { id: 'gx-la', label: s.quickModes.gxLA, title: s.quickModes.gxLATitle, pointIndex: gxMid, role: 'LA' },
      { id: 'gx-ta', label: s.quickModes.gxTA, title: s.quickModes.gxTATitle, pointIndex: gxMid, role: 'TA1' },
      { id: 'kg-ta1', label: s.quickModes.kgTA1, title: s.quickModes.kgTA1Title, pointIndex: kgMid, role: 'TA1' },
      { id: 'kg-ta2', label: s.quickModes.kgTA2, title: s.quickModes.kgTA2Title, pointIndex: kgMid, role: 'TA2' },
      { id: 'xk-mix', label: s.quickModes.xkMix, title: s.quickModes.xkMixTitle, pointIndex: xkMid, role: 'LA' }
    ]
    if (p === 2) {
      list.push(
        { id: 'gx-lo', label: s.quickModes.gLO, title: s.quickModes.gLOTitle, pointIndex: gxMid, role: 'LO' },
        { id: 'gx-to', label: s.quickModes.gTO, title: s.quickModes.gTOTitle, pointIndex: gxMid, role: 'TO1' }
      )
    }
    return list
  }, [p])

  const legend = useMemo<readonly LegendEntry[]>(() => {
    const entries: LegendEntry[] = [
      {
        id: 'atom1',
        keyKind: 'dot',
        color: 'var(--q-M)',
        label: <RichText text={s.scene.legendAtom1(p, isDiamond, props.material.species[0])} />
      }
    ]
    if (p === 2) {
      entries.push({
        id: 'atom2',
        keyKind: 'dot',
        color: isDiamond ? 'var(--tone-real-part-wave)' : 'var(--q-m)',
        label: (
          <RichText
            text={
              isDiamond
                ? s.scene.legendDiamondSub2
                : s.scene.legendAtom2(props.material.species[1])
            }
          />
        )
      })
    }
    entries.push(
      {
        id: 'kvec',
        keyKind: 'solid',
        color: 'var(--q-k)',
        label: <RichText text={s.scene.legendKVec} />
      },
      {
        id: 'disp',
        keyKind: 'solid',
        color: 'var(--q-u)',
        label: <RichText text={s.scene.legendDispArrows} />
      }
    )
    return entries
  }, [p, isDiamond, props.material.species])

  const canvasRef = useCanvasDraw((ctx, { w, h }, dt) => {
    const { material, k, kHat, mode, atGamma, maxOmegaRadS, highlight } = props
    const em = (q: QuantityId): number => (highlight === null || highlight === q ? 1 : DIM)
    const branchQ = branchQuantity(mode.role)
    const branchCol = branchVisualColor(mode.role)

    // Avanza la fase ω·t (ferma a ω = 0 in fase 0 così la traslazione rigida resta visibile)
    const relOmega = maxOmegaRadS > 1e-9 ? mode.omegaRadS / maxOmegaRadS : 0
    const visualRate = relOmega > 1e-4 ? 1.5 + 3.4 * relOmega : 0
    if (playback.effectivePlaying && visualRate > 0) {
      phaseAngleRef.current = (phaseAngleRef.current + dt * playback.speed * visualRate) % (2 * Math.PI)
    }
    const phaseT = visualRate === 0 ? 0 : playback.reducedMotion ? 0.35 : phaseAngleRef.current

    // Geometria delle due aree: sinistra blocco cristallino 3D (~68%), destra triade vettoriale (~32%)
    const splitX = Math.min(w - 148, Math.max(w * 0.66, 220))
    const leftCx = splitX * 0.5
    const leftCy = h * 0.53
    const scale = Math.min(splitX / 6.2, h / 4.2)

    ctx.strokeStyle = TOKENS.line
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(Math.round(splitX) + 0.5, 10)
    ctx.lineTo(Math.round(splitX) + 0.5, h - 10)
    ctx.stroke()

    // --- 1. Blocco cristallino 3D con piani atomici ---
    const nxCount = 4
    const nyCount = material.basisCount === 1 ? 3 : 2
    const nzCount = 2
    const halfX = (nxCount - 1) * 0.5
    const halfY = (nyCount - 1) * 0.5
    const halfZ = (nzCount - 1) * 0.5
    const cellStepA = material.a * 0.5
    const ampWorld = 0.36

    ctx.save()
    ctx.strokeStyle = withAlpha(TOKENS.lineStrong, 0.55)
    ctx.lineWidth = 1
    for (let iy = 0; iy < nyCount; iy++) {
      for (let iz = 0; iz < nzCount; iz++) {
        const p0 = projectIso(-halfX, iy - halfY, iz - halfZ, leftCx, leftCy, scale)
        const p1 = projectIso(halfX, iy - halfY, iz - halfZ, leftCx, leftCy, scale)
        ctx.beginPath()
        ctx.moveTo(p0.sx, p0.sy)
        ctx.lineTo(p1.sx, p1.sy)
        ctx.stroke()
      }
    }
    for (let ix = 0; ix < nxCount; ix++) {
      for (let iz = 0; iz < nzCount; iz++) {
        const p0 = projectIso(ix - halfX, -halfY, iz - halfZ, leftCx, leftCy, scale)
        const p1 = projectIso(ix - halfX, halfY, iz - halfZ, leftCx, leftCy, scale)
        ctx.beginPath()
        ctx.moveTo(p0.sx, p0.sy)
        ctx.lineTo(p1.sx, p1.sy)
        ctx.stroke()
      }
    }
    for (let ix = 0; ix < nxCount; ix++) {
      for (let iy = 0; iy < nyCount; iy++) {
        const p0 = projectIso(ix - halfX, iy - halfY, -halfZ, leftCx, leftCy, scale)
        const p1 = projectIso(ix - halfX, iy - halfY, halfZ, leftCx, leftCy, scale)
        ctx.beginPath()
        ctx.moveTo(p0.sx, p0.sy)
        ctx.lineTo(p1.sx, p1.sy)
        ctx.stroke()
      }
    }
    ctx.restore()

    interface AtomDrawItem {
      readonly sx: number
      readonly sy: number
      readonly eqSx: number
      readonly eqSy: number
      readonly depth: number
      readonly radius: number
      readonly fill: string
      readonly stroke: string
      readonly quantity: QuantityId
      readonly hasPartner: boolean
      readonly partnerSx?: number
      readonly partnerSy?: number
    }

    const items: AtomDrawItem[] = []
    const colM1 = quantityColor('M')
    const colM2 = isDiamond ? toneColor('realPartWave') : quantityColor('m')
    const baseR1 = Math.max(4.4, Math.min(7.5, scale * 0.16))
    const baseR2 = isDiamond ? baseR1 : baseR1 * 0.82
    const basisOff: KVector =
      material.structure === 'diamond' ? [0.27, 0.25, 0.25] : [0.42, 0, 0]

    const tau2 = crystalBasisTau2(material.id)
    const kDotTau2 = tau2 ? k[0] * tau2[0] + k[1] * tau2[1] + k[2] * tau2[2] : 0

    const uRe0 = mode.displacementVectors[0]
    const uIm0 = mode.displacementVectorsIm[0]
    const uRe1 = material.basisCount === 2 ? mode.displacementVectors[1] : null
    const uIm1 = material.basisCount === 2 ? mode.displacementVectorsIm[1] : null

    for (let ix = 0; ix < nxCount; ix++) {
      for (let iy = 0; iy < nyCount; iy++) {
        for (let iz = 0; iz < nzCount; iz++) {
          const gx = ix - halfX
          const gy = iy - halfY
          const gz = iz - halfZ
          const phi =
            k[0] * (ix * cellStepA) + k[1] * (iy * cellStepA) + k[2] * (iz * cellStepA)
          const c = Math.cos(phi - phaseT)
          const sn = Math.sin(phi - phaseT)

          const du1x = (uRe0[0] * c - uIm0[0] * sn) * ampWorld
          const du1y = (uRe0[1] * c - uIm0[1] * sn) * ampWorld
          const du1z = (uRe0[2] * c - uIm0[2] * sn) * ampWorld
          const pEq1 = projectIso(gx, gy, gz, leftCx, leftCy, scale)
          const pCur1 = projectIso(gx + du1x, gy + du1y, gz + du1z, leftCx, leftCy, scale)

          let pCur2: { sx: number; sy: number; depth: number } | null = null
          if (material.basisCount === 2 && uRe1 && uIm1) {
            const bx = gx + basisOff[0]
            const by = gy + basisOff[1]
            const bz = gz + basisOff[2]
            const phi2 = phi + kDotTau2
            const c2 = Math.cos(phi2 - phaseT)
            const sn2 = Math.sin(phi2 - phaseT)
            const du2x = (uRe1[0] * c2 - uIm1[0] * sn2) * ampWorld
            const du2y = (uRe1[1] * c2 - uIm1[1] * sn2) * ampWorld
            const du2z = (uRe1[2] * c2 - uIm1[2] * sn2) * ampWorld
            const pEq2 = projectIso(bx, by, bz, leftCx, leftCy, scale)
            pCur2 = projectIso(bx + du2x, by + du2y, bz + du2z, leftCx, leftCy, scale)
            items.push({
              sx: pCur2.sx,
              sy: pCur2.sy,
              eqSx: pEq2.sx,
              eqSy: pEq2.sy,
              depth: pCur2.depth,
              radius: baseR2,
              fill: colM2,
              stroke: TOKENS.bg,
              quantity: isDiamond ? 'M' : 'm',
              hasPartner: false
            })
          }

          items.push({
            sx: pCur1.sx,
            sy: pCur1.sy,
            eqSx: pEq1.sx,
            eqSy: pEq1.sy,
            depth: pCur1.depth,
            radius: baseR1,
            fill: colM1,
            stroke: TOKENS.bg,
            quantity: 'M',
            hasPartner: pCur2 !== null,
            partnerSx: pCur2?.sx,
            partnerSy: pCur2?.sy
          })
        }
      }
    }

    items.sort((a, b) => a.depth - b.depth)

    const colU = quantityColor('u')
    for (const item of items) {
      if (item.hasPartner && item.partnerSx !== undefined && item.partnerSy !== undefined) {
        ctx.save()
        ctx.globalAlpha = em('C') * 0.72
        ctx.strokeStyle = quantityColor('C')
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(item.sx, item.sy)
        ctx.lineTo(item.partnerSx, item.partnerSy)
        ctx.stroke()
        ctx.restore()
      }

      const dispLen = Math.hypot(item.sx - item.eqSx, item.sy - item.eqSy)
      if (dispLen > 1.8) {
        ctx.save()
        ctx.globalAlpha = em('u') * 0.92
        ctx.strokeStyle = colU
        ctx.fillStyle = colU
        ctx.lineWidth = 1.65
        drawArrow(ctx, item.eqSx, item.eqSy, item.sx, item.sy, 5.5)
        ctx.restore()
      }

      ctx.save()
      ctx.globalAlpha = em(item.quantity)
      ctx.fillStyle = item.fill
      ctx.strokeStyle = item.stroke
      ctx.lineWidth = 1.25
      ctx.beginPath()
      ctx.arc(item.sx, item.sy, item.radius, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }

    const axisLen = Math.min(20, Math.max(12, h * 0.28))
    const axisOriginX = 32
    const axisOriginY = Math.max(axisLen + 6, h - Math.min(22, h * 0.34))
    const axisSpecs: readonly { v: KVector; label: string }[] = [
      { v: [1, 0, 0], label: 'x' },
      { v: [0, 1, 0], label: 'y' },
      { v: [0, 0, 1], label: 'z' }
    ]
    ctx.save()
    ctx.strokeStyle = TOKENS.dim
    ctx.fillStyle = TOKENS.dim
    ctx.lineWidth = 1.15
    for (const ax of axisSpecs) {
      const pt = projectIso(ax.v[0], ax.v[1], ax.v[2], axisOriginX, axisOriginY, axisLen)
      drawArrow(ctx, axisOriginX, axisOriginY, pt.sx, pt.sy, 4)
      const lblPt = projectIso(ax.v[0] * 1.38, ax.v[1] * 1.38, ax.v[2] * 1.38, axisOriginX, axisOriginY, axisLen)
      drawMathText(ctx, ax.label, lblPt.sx, lblPt.sy + 3, {
        color: TOKENS.muted,
        size: 11,
        align: 'center'
      })
    }
    ctx.restore()

    // --- 2. Pannello destro: Triade vettoriale k e polarizzazione εˢ(k) ---
    // Su viewport compatte verticalmente (es. 800×700) affianca testo e triade per zero sovrapposizioni.
    const rightW = w - splitX
    const compactRight = h < 105
    const footerH = compactRight ? 4 : 42
    const usableH = Math.max(36, h - footerH)
    const triadCx = compactRight ? splitX + rightW * 0.26 : splitX + rightW * 0.5
    const triadCy = compactRight ? h * 0.52 : Math.max(20, usableH * 0.46)
    const triadScale = compactRight
      ? Math.min(rightW * 0.14, h * 0.27, 30)
      : Math.min(rightW * 0.28, usableH * 0.26, 52)
    const triadLabelMaxX = compactRight ? splitX + rightW * 0.50 : w - 10
    const triadLabelMinY = compactRight ? 12 : 14
    const triadLabelMaxY = compactRight ? h - 7 : usableH - 10

    ctx.save()
    ctx.strokeStyle = withAlpha(TOKENS.lineStrong, 0.7)
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    for (const ax of axisSpecs) {
      const pNeg = projectIso(-ax.v[0] * 0.85, -ax.v[1] * 0.85, -ax.v[2] * 0.85, triadCx, triadCy, triadScale)
      const pPos = projectIso(ax.v[0] * 0.85, ax.v[1] * 0.85, ax.v[2] * 0.85, triadCx, triadCy, triadScale)
      ctx.beginPath()
      ctx.moveTo(pNeg.sx, pNeg.sy)
      ctx.lineTo(pPos.sx, pPos.sy)
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.restore()

    // Vettore d'onda k̂ (giallo --q-k)
    const kTip = projectIso(kHat[0] * 1.12, kHat[1] * 1.12, kHat[2] * 1.12, triadCx, triadCy, triadScale)
    ctx.save()
    ctx.globalAlpha = em('k')
    ctx.strokeStyle = quantityColor('k')
    ctx.fillStyle = quantityColor('k')
    ctx.lineWidth = 2.4
    drawArrow(ctx, triadCx, triadCy, kTip.sx, kTip.sy, 7.5)
    const kRight = kTip.sx >= triadCx
    const kLabelX = kRight
      ? Math.min(triadLabelMaxX - 18, kTip.sx + 8)
      : Math.max(splitX + 8, kTip.sx - 8)
    drawMathText(
      ctx,
      atGamma ? 'k̂' : s.scene.canvasKLabel,
      kLabelX,
      Math.max(triadLabelMinY, Math.min(triadLabelMaxY, kTip.sy - 4)),
      {
        color: quantityColor('k'),
        size: 13,
        align: kRight ? 'left' : 'right',
        backdrop: TOKENS.bg
      }
    )
    ctx.restore()

    // Scegli il sottoreticolo con ampiezza maggiore (così se l'atomo 1 è fermo, es. PbTe a L, usa l'atomo 2!)
    let activeIdx = 0
    let bestNormSq = -1
    for (let alpha = 0; alpha < material.basisCount; alpha++) {
      const vr = mode.displacementVectors[alpha]
      const vi = mode.displacementVectorsIm[alpha]
      const nSq =
        vr[0] * vr[0] + vr[1] * vr[1] + vr[2] * vr[2] +
        vi[0] * vi[0] + vi[1] * vi[1] + vi[2] * vi[2]
      if (nSq > bestNormSq) {
        bestNormSq = nSq
        activeIdx = alpha
      }
    }
    const vRe = mode.displacementVectors[activeIdx]
    const vIm = mode.displacementVectorsIm[activeIdx]
    const activePhaseShift = activeIdx === 1 ? kDotTau2 : 0
    const ca = Math.cos(activePhaseShift)
    const sa = Math.sin(activePhaseShift)
    // Ruota di e^{i k·τ_2} se è il secondo sottoreticolo
    const effRe: KVector = [
      vRe[0] * ca - vIm[0] * sa,
      vRe[1] * ca - vIm[1] * sa,
      vRe[2] * ca - vIm[2] * sa
    ]
    const effIm: KVector = [
      vRe[0] * sa + vIm[0] * ca,
      vRe[1] * sa + vIm[1] * ca,
      vRe[2] * sa + vIm[2] * ca
    ]
    const normRe = Math.hypot(effRe[0], effRe[1], effRe[2])
    const normIm = Math.hypot(effIm[0], effIm[1], effIm[2])
    const totalNorm = Math.hypot(normRe, normIm) || 1
    const uR: KVector = [effRe[0] / totalNorm, effRe[1] / totalNorm, effRe[2] / totalNorm]
    const uI: KVector = [effIm[0] / totalNorm, effIm[1] / totalNorm, effIm[2] / totalNorm]
    const domVec = normRe >= normIm ? uR : uI
    const domNorm = Math.hypot(domVec[0], domVec[1], domVec[2]) || 1
    const eUnit: KVector = [domVec[0] / domNorm, domVec[1] / domNorm, domVec[2] / domNorm]

    const eScale = 0.92
    const ePos = projectIso(eUnit[0] * eScale, eUnit[1] * eScale, eUnit[2] * eScale, triadCx, triadCy, triadScale)
    const eNeg = projectIso(-eUnit[0] * eScale, -eUnit[1] * eScale, -eUnit[2] * eScale, triadCx, triadCy, triadScale)

    // Vettore istantaneo animato Re[u e^{-i phaseT}]
    const cT = Math.cos(-phaseT)
    const sT = Math.sin(-phaseT)
    const liveX = (uR[0] * cT - uI[0] * sT) * eScale
    const liveY = (uR[1] * cT - uI[1] * sT) * eScale
    const liveZ = (uR[2] * cT - uI[2] * sT) * eScale
    const eLive = projectIso(liveX, liveY, liveZ, triadCx, triadCy, triadScale)

    ctx.save()
    ctx.globalAlpha = em(branchQ)
    if (normIm > 0.08 * totalNorm && normRe > 0.08 * totalNorm) {
      // Modo complesso (ellittico/circolare): disegna l'orbita della polarizzazione
      ctx.strokeStyle = withAlpha(branchCol, 0.58)
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      const steps = 36
      for (let sIdx = 0; sIdx <= steps; sIdx++) {
        const ang = (sIdx / steps) * 2 * Math.PI
        const ca2 = Math.cos(ang)
        const sa2 = Math.sin(ang)
        const px = (uR[0] * ca2 - uI[0] * sa2) * eScale
        const py = (uR[1] * ca2 - uI[1] * sa2) * eScale
        const pz = (uR[2] * ca2 - uI[2] * sa2) * eScale
        const pt = projectIso(px, py, pz, triadCx, triadCy, triadScale)
        if (sIdx === 0) ctx.moveTo(pt.sx, pt.sy)
        else ctx.lineTo(pt.sx, pt.sy)
      }
      ctx.stroke()
      ctx.setLineDash([])
    } else {
      ctx.strokeStyle = withAlpha(branchCol, 0.55)
      ctx.lineWidth = 1.6
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(eNeg.sx, eNeg.sy)
      ctx.lineTo(ePos.sx, ePos.sy)
      ctx.stroke()
      ctx.setLineDash([])
    }

    ctx.strokeStyle = branchCol
    ctx.fillStyle = branchCol
    ctx.lineWidth = 2.2
    drawArrow(ctx, triadCx, triadCy, ePos.sx, ePos.sy, 7)

    ctx.fillStyle = quantityColor('u')
    ctx.beginPath()
    ctx.arc(eLive.sx, eLive.sy, 3.6, 0, 2 * Math.PI)
    ctx.fill()

    const eRight = ePos.sx >= triadCx
    const eLabelX = eRight
      ? Math.min(triadLabelMaxX - 18, ePos.sx + 7)
      : Math.max(splitX + 8, ePos.sx - 7)
    drawMathText(
      ctx,
      s.scene.canvasPolLabel,
      eLabelX,
      Math.max(triadLabelMinY, Math.min(triadLabelMaxY, ePos.sy + (ePos.sy >= triadCy ? 10 : -6))),
      {
        color: branchCol,
        size: 13,
        align: eRight ? 'left' : 'right',
        backdrop: TOKENS.bg
      }
    )
    ctx.restore()

    const lPct = Math.round(mode.longitudinalFraction * 100)
    const relStr =
      mode.longitudinalFraction > 0.98
        ? 'ε ∥ k (100% L)'
        : mode.longitudinalFraction < 0.02
          ? 'ε ⊥ k (0% L)'
          : `misto (${formatNumber(lPct, 0)}% L)`
    ctx.save()
    if (compactRight) {
      const infoX = splitX + rightW * 0.54
      const midY = h * 0.50
      ctx.font = sansFont(11.5, 600)
      ctx.fillStyle = branchCol
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(formatRoleUnicode(mode.role), infoX, midY - 2)
      ctx.font = sansFont(10.5)
      ctx.fillStyle = TOKENS.textSoft
      ctx.fillText(relStr, infoX, midY + 12)
    } else {
      ctx.font = sansFont(11.5, 600)
      ctx.fillStyle = branchCol
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(formatRoleUnicode(mode.role), triadCx, h - 24)
      ctx.font = sansFont(11)
      ctx.fillStyle = TOKENS.textSoft
      ctx.fillText(relStr, triadCx, h - 9)
    }
    ctx.restore()

    return playback.effectivePlaying && visualRate > 0
  })

  return (
    <div className="phonon-3d-view">
      <div className="phonon-3d-bar">
        <ChartLegend entries={legend} ariaLabel={s.scene.legend3dAria} />
        <div className="phonon-3d-controls">
          <div className="phonon-3d-quick" role="group" aria-label={s.quickModes.group}>
            {quickActions.map((act) => (
              <button
                key={act.id}
                type="button"
                className="phonon-3d-quick-btn"
                title={act.title}
                aria-pressed={props.pointIndex === act.pointIndex && props.mode.role === act.role}
                onClick={() => props.onQuickSelect(act.pointIndex, act.role)}
              >
                {act.label}
              </button>
            ))}
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
      <div className="phonon-3d-stage">
        <canvas
          ref={canvasRef}
          className="phonon-3d-canvas"
          role="img"
          aria-label={s.scene.view3dAria}
        />
      </div>
    </div>
  )
})
