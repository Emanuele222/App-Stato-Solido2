/**
 * Vista alternativa di Vista 1 quando è attivo lo strumento «Conteggio modi 3D (1BZ)»:
 * - Sinistra: griglia 2D di Born–von Kármán nella prima zona di Brillouin quadrata
 *   (dispensa Parte 6, Lezione 3 §14, Fig. 17 p. 36) con N² punti pieni contati e
 *   cerchi vuoti sui bordi equivalenti per un vettore G del reticolo reciproco.
 * - Destra: schema isometrico della cella convenzionale cubica fcc (a³) che contiene
 *   4 celle primitive (v_c = a³/4, correzione esplicita) + bilancio contabile
 *   interattivo 3p·N_c = N_c × [3 + (p − 1) + 2(p − 1)] con veri pedici matematici.
 *
 * Zero colori hex hardcoded: tutto arriva da ui/theme.ts.
 */
import { memo, type JSX } from 'react'
import type { BvkGrid2DPoint, ModeCounting3D } from '../../physics'
import { formatNumber } from '../../ui/format'
import { quantityColor, TOKENS, type QuantityId } from '../../ui/theme'
import { drawMathText, measureMathText, sansFont, useCanvasDraw, withAlpha } from '../../viz/canvas'
import { strings as s } from './strings'
import './phonon-3d.css'

export interface ModeCounting3DViewProps {
  readonly counting: ModeCounting3D
  readonly grid2D: readonly BvkGrid2DPoint[]
  readonly highlight: QuantityId | null
}

const DIM = 0.26

function isoCube(
  x: number,
  y: number,
  z: number,
  cx: number,
  cy: number,
  size: number
): { sx: number; sy: number } {
  return {
    sx: cx + (x * 0.84 - y * 0.68) * size,
    sy: cy + (x * 0.34 + y * 0.4 - z * 0.9) * size
  }
}

export const ModeCounting3DView = memo(function ModeCounting3DView(
  props: ModeCounting3DViewProps
): JSX.Element {
  const canvasRef = useCanvasDraw((ctx, { w, h }) => {
    const { counting, grid2D, highlight } = props
    const em = (q: QuantityId): number => (highlight === null || highlight === q ? 1 : DIM)
    const N = counting.cellsPerSideN

    const splitX = Math.max(196, Math.min(w - 220, w * 0.48))
    ctx.strokeStyle = TOKENS.line
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(Math.round(splitX) + 0.5, 10)
    ctx.lineTo(Math.round(splitX) + 0.5, h - 10)
    ctx.stroke()

    // --- 1. Sinistra: Griglia 2D di Born–von Kármán in 1BZ (Fig. 17) ---
    const padTop = 36
    const padBot = 32
    const side = Math.max(66, Math.min(splitX - 64, h - padTop - padBot - 10))
    const gx0 = (splitX - side) * 0.5
    const gy0 = padTop + (h - padTop - padBot - side) * 0.5
    const gcx = gx0 + side * 0.5
    const gcy = gy0 + side * 0.5

    ctx.font = sansFont(11.5, 600)
    ctx.fillStyle = TOKENS.textSoft
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(s.scene.canvasGridTitle(N), splitX * 0.5, 16)

    // Quadrato 1BZ (lato 2π/a)
    ctx.save()
    ctx.globalAlpha = em('a')
    ctx.fillStyle = withAlpha(quantityColor('a'), 0.065)
    ctx.strokeStyle = withAlpha(quantityColor('a'), 0.72)
    ctx.lineWidth = 1.4
    ctx.fillRect(gx0, gy0, side, side)
    ctx.strokeRect(gx0, gy0, side, side)
    ctx.restore()

    // Assi k_x e k_y passanti per Γ
    ctx.strokeStyle = TOKENS.lineStrong
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(gx0 - 10, gcy)
    ctx.lineTo(gx0 + side + 12, gcy)
    ctx.moveTo(gcx, gy0 + side + 10)
    ctx.lineTo(gcx, gy0 - 10)
    ctx.stroke()

    drawMathText(ctx, 'k_x', gx0 + side + 15, gcy + 4, { color: TOKENS.muted, size: 11, align: 'left' })
    drawMathText(ctx, 'k_y', gcx + 6, gy0 - 2, { color: TOKENS.muted, size: 11, align: 'left' })

    const colK = quantityColor('k')
    const dotR = Math.max(2.2, Math.min(3.8, side / (N * 4.4)))
    for (const pt of grid2D) {
      const px = gcx + pt.kxOverPiA * (side * 0.5)
      const py = gcy - pt.kyOverPiA * (side * 0.5)
      ctx.save()
      ctx.globalAlpha = em('k')
      if (pt.counted) {
        ctx.fillStyle = colK
        ctx.beginPath()
        ctx.arc(px, py, dotR, 0, 2 * Math.PI)
        ctx.fill()
      } else {
        ctx.fillStyle = TOKENS.bg
        ctx.strokeStyle = TOKENS.muted
        ctx.lineWidth = 1.25
        ctx.beginPath()
        ctx.arc(px, py, dotR, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
      }
      ctx.restore()
    }

    drawMathText(ctx, 'Γ', gcx - 7, gcy + 13, {
      color: TOKENS.text,
      size: 11.5,
      align: 'right',
      backdrop: TOKENS.bg
    })
    drawMathText(ctx, '2π/a', gcx, gy0 + side + 15, {
      color: quantityColor('a'),
      size: 11,
      align: 'center'
    })

    // Mini legenda in basso a sinistra
    const legY = h - 7
    ctx.font = sansFont(10.5)
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = colK
    ctx.beginPath()
    ctx.arc(14, legY - 3.5, 3, 0, 2 * Math.PI)
    ctx.fill()
    ctx.fillStyle = TOKENS.muted
    ctx.textAlign = 'left'
    ctx.fillText(s.scene.canvasGridLegendCounted, 21, legY)

    const ghostLegX = Math.min(splitX - 98, 108)
    ctx.fillStyle = TOKENS.bg
    ctx.strokeStyle = TOKENS.muted
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(ghostLegX, legY - 3.5, 3, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = TOKENS.muted
    ctx.fillText(s.scene.canvasGridLegendGhost, ghostLegX + 7, legY)

    // --- 2. Destra: Cella convenzionale fcc (v_c = a³/4) + bilancio 3p·N_c ---
    const rightW = w - splitX
    const rightCx = splitX + rightW * 0.5
    ctx.font = sansFont(11.5, 600)
    ctx.fillStyle = TOKENS.textSoft
    ctx.textAlign = 'center'
    ctx.fillText(s.scene.canvasCellTitle, rightCx, 16)

    // Cubo convenzionale fcc compatto a sinistra del pannello destro per lasciare spazio ai testi
    const cubeSize = Math.max(28, Math.min(rightW * 0.21, h * 0.25, 54))
    const cubeCx = splitX + Math.max(44, rightW * 0.23)
    const cubeCy = h * 0.46

    const corners: readonly (readonly [number, number, number])[] = [
      [-0.5, -0.5, -0.5],
      [0.5, -0.5, -0.5],
      [0.5, 0.5, -0.5],
      [-0.5, 0.5, -0.5],
      [-0.5, -0.5, 0.5],
      [0.5, -0.5, 0.5],
      [0.5, 0.5, 0.5],
      [-0.5, 0.5, 0.5]
    ]
    const edges: readonly (readonly [number, number])[] = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ]
    const projectedCorners = corners.map(([x, y, z]) => isoCube(x, y, z, cubeCx, cubeCy, cubeSize))

    ctx.save()
    ctx.globalAlpha = em('a')
    ctx.strokeStyle = withAlpha(quantityColor('a'), 0.6)
    ctx.lineWidth = 1.25
    for (const [i, j] of edges) {
      ctx.beginPath()
      ctx.moveTo(projectedCorners[i].sx, projectedCorners[i].sy)
      ctx.lineTo(projectedCorners[j].sx, projectedCorners[j].sy)
      ctx.stroke()
    }
    const p0 = projectedCorners[0]
    const primVecs: readonly (readonly [number, number, number])[] = [
      [0, 0, -0.5],
      [0, -0.5, 0],
      [-0.5, 0, 0]
    ]
    ctx.strokeStyle = quantityColor('omega')
    ctx.lineWidth = 1.9
    for (const [fx, fy, fz] of primVecs) {
      const pf = isoCube(fx, fy, fz, cubeCx, cubeCy, cubeSize)
      ctx.beginPath()
      ctx.moveTo(p0.sx, p0.sy)
      ctx.lineTo(pf.sx, pf.sy)
      ctx.stroke()
    }
    ctx.fillStyle = quantityColor('M')
    for (const pc of projectedCorners) {
      ctx.beginPath()
      ctx.arc(pc.sx, pc.sy, 3.0, 0, 2 * Math.PI)
      ctx.fill()
    }
    const faces: readonly (readonly [number, number, number])[] = [
      [0, 0, -0.5], [0, 0, 0.5],
      [0, -0.5, 0], [0, 0.5, 0],
      [-0.5, 0, 0], [0.5, 0, 0]
    ]
    ctx.fillStyle = quantityColor('omega')
    for (const [fx, fy, fz] of faces) {
      const pf = isoCube(fx, fy, fz, cubeCx, cubeCy, cubeSize)
      ctx.beginPath()
      ctx.arc(pf.sx, pf.sy, 3.3, 0, 2 * Math.PI)
      ctx.fill()
    }
    drawMathText(ctx, 'a', projectedCorners[1].sx + 7, projectedCorners[1].sy + 9, {
      color: quantityColor('a'),
      size: 11.5,
      align: 'left'
    })
    ctx.restore()

    // Riquadro bilancio numerico con veri pedici matematici (drawMathText) e adattamento alla larghezza disponibile
    const infoX = splitX + Math.max(92, rightW * 0.43)
    const availW = Math.max(60, w - infoX - 8)
    const rows: readonly { math: string; color: string }[] = [
      { math: `v_c = a^3/4 = ${formatNumber(counting.primitiveCellVolumeFccAng3, 1)} Å³`, color: quantityColor('a') },
      { math: `fcc: N_c = 4N^3 = ${counting.primitiveCellsFcc.toLocaleString('it-IT')}`, color: TOKENS.text },
      { math: `(sc: N^3 = ${counting.primitiveCellsSimpleCubic.toLocaleString('it-IT')})`, color: TOKENS.muted },
      {
        math: `3p = ${counting.totalBranches} (${counting.acousticBranches} ac. + ${counting.opticalBranches} ott.)`,
        color: counting.opticalBranches > 0 ? quantityColor('omegaOpt') : quantityColor('omega')
      },
      {
        math: `3p·N_c = ${counting.totalModesFcc.toLocaleString('it-IT')} modi`,
        color: quantityColor('k')
      }
    ]

    let fontSize = rightW < 275 ? 10.5 : 11.5
    let maxMeasured = 0
    for (const r of rows) {
      maxMeasured = Math.max(maxMeasured, measureMathText(ctx, r.math, fontSize))
    }
    if (maxMeasured > availW && maxMeasured > 1) {
      fontSize = Math.max(9.2, fontSize * (availW / maxMeasured))
    }

    let infoY = Math.max(40, h * 0.27)
    const lineStep = Math.min(20, Math.max(14, (h - 62) / 5.4))
    for (const row of rows) {
      drawMathText(ctx, row.math, infoX, infoY, {
        color: row.color,
        size: fontSize,
        align: 'left',
        italic: false
      })
      infoY += lineStep
    }

    ctx.font = sansFont(10.5)
    ctx.fillStyle = TOKENS.muted
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(s.scene.canvasCellNote, rightCx, h - 7)

    return false
  })

  return (
    <div className="phonon-3d-view">
      <div className="phonon-3d-stage">
        <canvas
          ref={canvasRef}
          className="phonon-3d-canvas"
          role="img"
          aria-label={s.scene.countingAria}
        />
      </div>
    </div>
  )
})
