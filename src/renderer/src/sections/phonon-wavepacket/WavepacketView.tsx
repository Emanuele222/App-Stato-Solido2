/**
 * Vista spazio reale del pacchetto d'onda Ψ(x, t) (dispensa Parte 6, §6 pp. 14–17, Figg. 7 e 9):
 * - Inviluppo ±F(x − v_g t, t) (--q-u) con marcatore del centro a velocità v_g (--q-v);
 * - Portante reale Re Ψ(x, t) (--q-psi) con cresta evidenziata che avanza a velocità v_p (--q-vp);
 * - Atomi discreti campionati ogni passo a (--q-a) che oscillano sotto l'onda nei 3 regimi reticolari;
 * - Toggle «Riferimento comovente (ξ = x − v_g t)» e «Profilo iniziale t = 0» (tratteggio Fig. 7);
 * - Pannello compatto laterale dell'allargamento σ(t)/σ₀ (Fig. 9);
 * - PlaybackControls con pulsante «Riavvia impulso (t = 0)».
 *
 * Nessun colore hex hardcoded: tutti i colori vengono da ui/theme.ts.
 */
import { memo, useCallback, useEffect, useMemo, useRef, type JSX } from 'react'
import {
  ANGSTROM_IN_M,
  wavepacketFieldAt,
  wavepacketSnapshot,
  wavepacketWidthAt,
  type WavepacketParams
} from '../../physics'
import { formatNumber } from '../../ui/format'
import { RichText } from '../../ui/tex'
import { quantityColor, TOKENS, type QuantityId } from '../../ui/theme'
import { ChartLegend, type LegendEntry } from '../../viz/ChartLegend'
import { drawMathText, sansFont, useCanvasDraw, withAlpha } from '../../viz/canvas'
import { PlaybackControls, usePlaybackPhase } from '../../viz/PlaybackControls'
import { NUMERICS } from './manifest'
import type { SpreadCurveData } from './model'
import { strings as s } from './strings'
import './phonon-wavepacket.css'

export interface WavepacketViewProps {
  readonly wpParams: WavepacketParams
  readonly spreadCurve: SpreadCurveData
  readonly hasDiscreteLattice: boolean
  readonly comoving: boolean
  readonly showInitialProfile: boolean
  readonly highlight: QuantityId | null
}

const DIM = 0.26

export const WavepacketView = memo(function WavepacketView(
  props: WavepacketViewProps
): JSX.Element {
  const playback = usePlaybackPhase({ initialPlaying: true, initialSpeed: 1 })
  const simProgressRef = useRef(0) // [0, 1) frazione di ciclo [0, tMaxS]

  // Quando cambiano regime o parametri principali si riparte puliti da t = 0
  useEffect(() => {
    simProgressRef.current = 0
  }, [props.wpParams.regime])

  const handleReset = useCallback(() => {
    simProgressRef.current = 0
    playback.resetPhase()
  }, [playback.resetPhase])

  const legend = useMemo<readonly LegendEntry[]>(() => {
    const entries: LegendEntry[] = [
      { id: 'env', keyKind: 'solid', color: 'var(--q-u)', label: <RichText text={s.scene.legendEnvelope} /> },
      { id: 'psi', keyKind: 'solid', color: 'var(--q-psi)', label: <RichText text={s.scene.legendCarrier} /> },
      { id: 'vp', keyKind: 'dot', color: 'var(--q-vp)', label: <RichText text={s.scene.legendCrest} /> }
    ]
    if (props.showInitialProfile) {
      entries.push({
        id: 'init',
        keyKind: 'dashed',
        color: 'var(--q-u)',
        label: <RichText text={s.scene.legendInitial} />
      })
    }
    if (props.hasDiscreteLattice) {
      entries.push({
        id: 'atoms',
        keyKind: 'dot',
        color: 'var(--q-a)',
        label: <RichText text={s.scene.legendAtoms} />
      })
    }
    return entries
  }, [props.showInitialProfile, props.hasDiscreteLattice])

  const waveCanvasRef = useCanvasDraw((ctx, { w, h }, dt) => {
    const p = props
    const shouldAnimate = playback.effectivePlaying
    if (shouldAnimate) {
      simProgressRef.current =
        (simProgressRef.current + (dt * playback.speed) / NUMERICS.loopWallSeconds) % 1
    }
    const timeS = simProgressRef.current * p.spreadCurve.tMaxS

    const em = (q: QuantityId): number => (p.highlight === null || p.highlight === q ? 1 : DIM)
    const lw = (q: QuantityId, base: number): number => (p.highlight === q ? base + 1.1 : base)

    drawWavepacketScene(ctx, w, h, p, timeS, em, lw)

    return shouldAnimate
  })

  const spreadCanvasRef = useCanvasDraw((ctx, { w, h }) => {
    const p = props
    const timeS = simProgressRef.current * p.spreadCurve.tMaxS
    const em = (q: QuantityId): number => (p.highlight === null || p.highlight === q ? 1 : DIM)
    const lw = (q: QuantityId, base: number): number => (p.highlight === q ? base + 1.1 : base)

    drawSpreadInset(ctx, w, h, p, timeS, em, lw)

    return playback.effectivePlaying
  })

  return (
    <div className="phonon-wp-view">
      <div className="phonon-wp-bar">
        <ChartLegend entries={legend} ariaLabel={s.scene.legendWaveAria} />
        <PlaybackControls
          playing={playback.playing}
          speed={playback.speed}
          onTogglePlay={playback.togglePlay}
          onSpeedChange={playback.setSpeed}
          onReset={handleReset}
          labels={{
            reset: s.playback.reset,
            group: s.playback.group
          }}
        />
      </div>
      <div className="phonon-wp-stage">
        <div className="phonon-wp-main-wrap">
          <canvas
            ref={waveCanvasRef}
            className="phonon-wp-canvas"
            role="img"
            aria-label={s.scene.waveAria}
          />
        </div>
        <div className="phonon-wp-spread-wrap">
          <canvas
            ref={spreadCanvasRef}
            className="phonon-wp-canvas"
            role="img"
            aria-label={s.scene.spreadAria}
          />
        </div>
      </div>
    </div>
  )
})

function drawWavepacketScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: WavepacketViewProps,
  timeS: number,
  em: (q: QuantityId) => number,
  lw: (q: QuantityId, base: number) => number
): void {
  const a = p.wpParams.regime === 'optical' ? p.wpParams.diatomic.a : p.wpParams.monatomic.a
  const halfSpanAng = NUMERICS.halfSpanInA * a
  const snap = wavepacketSnapshot(p.wpParams, timeS, {
    halfSpanAng,
    nProfilePoints: NUMERICS.profilePoints,
    comoving: p.comoving
  })
  const char = snap.characteristics

  const padL = 16
  const padR = 16
  const padT = Math.max(20, Math.min(26, h * 0.12))
  const padB = Math.max(18, Math.min(24, h * 0.12))
  const W = Math.max(40, w - padL - padR)
  const H = Math.max(30, h - padT - padB)
  const yMid = padT + H * 0.52
  const yAmp = H * 0.43

  const X = (xAng: number): number => padL + ((xAng + halfSpanAng) / (2 * halfSpanAng)) * W
  const Y = (val: number): number => yMid - val * yAmp

  // 1. Asse di riferimento orizzontale y = 0 e origine x = 0 / ξ = 0
  ctx.strokeStyle = TOKENS.lineStrong
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padL, Math.round(yMid) + 0.5)
  ctx.lineTo(padL + W, Math.round(yMid) + 0.5)
  ctx.stroke()

  ctx.strokeStyle = withAlpha(TOKENS.lineStrong, 0.7)
  ctx.setLineDash([3, 4])
  ctx.beginPath()
  ctx.moveTo(Math.round(X(0)) + 0.5, padT)
  ctx.lineTo(Math.round(X(0)) + 0.5, padT + H)
  ctx.stroke()
  ctx.setLineDash([])

  // 2. Profilo iniziale t = 0 tratteggiato (Fig. 7)
  if (p.showInitialProfile) {
    const colU = quantityColor('u')
    ctx.save()
    ctx.globalAlpha = em('u') * 0.45
    ctx.strokeStyle = colU
    ctx.lineWidth = lw('u', 1.35)
    ctx.setLineDash([5, 4])
    const invFourSig0Sq = 1 / (4 * char.sigma0Ang * char.sigma0Ang)

    for (const sgn of [1, -1] as const) {
      ctx.beginPath()
      for (let i = 0; i < snap.profile.length; i++) {
        const xVal = snap.profile[i].x
        const env0 = sgn * Math.exp(-xVal * xVal * invFourSig0Sq)
        const px = X(xVal)
        const py = Y(env0)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.restore()
  }

  // 3. Riempimento leggero e inviluppo ±F(x − v_g t, t)
  const colU = quantityColor('u')
  ctx.save()
  ctx.globalAlpha = em('u') * 0.08
  ctx.fillStyle = colU
  ctx.beginPath()
  for (let i = 0; i < snap.profile.length; i++) {
    const pt = snap.profile[i]
    const px = X(pt.x)
    const py = Y(pt.envelope)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  for (let i = snap.profile.length - 1; i >= 0; i--) {
    const pt = snap.profile[i]
    ctx.lineTo(X(pt.x), Y(-pt.envelope))
  }
  ctx.closePath()
  ctx.fill()

  ctx.globalAlpha = em('u') * 0.92
  ctx.strokeStyle = colU
  ctx.lineWidth = lw('u', 1.8)
  for (const sgn of [1, -1] as const) {
    ctx.beginPath()
    for (let i = 0; i < snap.profile.length; i++) {
      const pt = snap.profile[i]
      const px = X(pt.x)
      const py = Y(sgn * pt.envelope)
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
  }
  ctx.restore()

  // 4. Portante reale Re Ψ(x, t)
  const colPsi = quantityColor('psi')
  ctx.save()
  ctx.globalAlpha = em('psi')
  ctx.strokeStyle = colPsi
  ctx.lineWidth = lw('psi', 1.85)
  ctx.lineJoin = 'round'
  ctx.beginPath()
  for (let i = 0; i < snap.profile.length; i++) {
    const pt = snap.profile[i]
    const px = X(pt.x)
    const py = Y(pt.realPsi)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()
  ctx.restore()

  // 5. Atomi discreti campionati ogni passo a sotto l'onda (3 regimi reticolari)
  if (char.hasDiscreteLattice && snap.atoms.length > 0) {
    const colA = quantityColor('a')
    const rAtom = Math.max(2.3, Math.min(3.8, (W / snap.atoms.length) * 0.16))
    ctx.save()
    for (const atom of snap.atoms) {
      const px = X(atom.xEq)
      if (px < padL - 2 || px > padL + W + 2) continue
      const py = Y(atom.u)

      // Stelo verticale dall'equilibrio x_n⁰ = n·a allo spostamento u_n
      ctx.globalAlpha = em('a') * 0.34
      ctx.strokeStyle = colA
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(px, yMid)
      ctx.lineTo(px, py)
      ctx.stroke()

      // Tacca sull'asse di equilibrio
      ctx.globalAlpha = em('a') * 0.55
      ctx.beginPath()
      ctx.moveTo(px, yMid - 2.5)
      ctx.lineTo(px, yMid + 2.5)
      ctx.stroke()

      // Cerchietto dell'atomo campionato
      ctx.globalAlpha = em('a')
      ctx.fillStyle = TOKENS.bg
      ctx.strokeStyle = colA
      ctx.lineWidth = lw('a', 1.45)
      ctx.beginPath()
      ctx.arc(px, py, rAtom, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
    }
    ctx.restore()
  }

  // 6. Marcatore del centro dell'inviluppo (velocità di gruppo v_g)
  const groupDispX = p.comoving ? 0 : snap.groupCenterAng
  let vgLblX = 0
  let vgLblY = 0
  let hasVgMarker = false
  if (Math.abs(groupDispX) <= halfSpanAng) {
    hasVgMarker = true
    const colV = quantityColor('v')
    const gx = X(groupDispX)
    const peakEnv = Math.sqrt(char.sigma0Ang / snap.sigmaAng)
    const gy = Y(peakEnv)
    ctx.save()
    ctx.globalAlpha = em('v')
    ctx.strokeStyle = withAlpha(colV, 0.7)
    ctx.lineWidth = lw('v', 1.35)
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(gx, yMid)
    ctx.lineTo(gx, gy)
    ctx.stroke()
    ctx.setLineDash([])

    // Rombo al vertice dell'inviluppo
    const d = 4.5
    ctx.fillStyle = TOKENS.bg
    ctx.strokeStyle = colV
    ctx.lineWidth = 1.8
    ctx.beginPath()
    ctx.moveTo(gx, gy - d)
    ctx.lineTo(gx + d, gy)
    ctx.lineTo(gx, gy + d)
    ctx.lineTo(gx - d, gy)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    vgLblX = gx
    vgLblY = Math.max(padT + 4, gy - 7)
    drawMathText(ctx, 'v_g', vgLblX, vgLblY, {
      color: colV,
      size: 11.5,
      align: 'center',
      backdrop: TOKENS.bg
    })
    ctx.restore()
  }

  // 7. Cresta evidenziata della portante che avanza a velocità v_p dentro l'inviluppo
  if (Math.abs(char.k0) > 1e-4 && char.vpMs !== null) {
    const lambda0 = (2 * Math.PI) / Math.abs(char.k0)
    const vpAngPerS = char.vpMs / ANGSTROM_IN_M
    const vgAngPerS = char.vgMs / ANGSTROM_IN_M
    const vRel = vpAngPerS - vgAngPerS
    const wrapMult = Math.max(1, Math.round((3.2 * char.sigma0Ang) / lambda0))
    const lWrap = wrapMult * lambda0
    const xiRaw = vRel * timeS + 0.5 * lWrap
    const xiWrapped = ((xiRaw % lWrap) + lWrap) % lWrap - 0.5 * lWrap
    const gouyShift = (0.5 * Math.atan(snap.gamma)) / char.k0
    const xCrestLab = snap.groupCenterAng + xiWrapped + gouyShift
    const xCrestDisp = p.comoving ? xiWrapped + gouyShift : xCrestLab

    if (Math.abs(xCrestDisp) <= halfSpanAng * 0.96) {
      const crestSample = wavepacketFieldAt(xCrestLab, timeS, char)
      const cx = X(xCrestDisp)
      const cy = Y(crestSample.realPsi)
      const colVp = quantityColor('vp')
      ctx.save()
      ctx.globalAlpha = em('vp')
      ctx.fillStyle = colVp
      ctx.strokeStyle = TOKENS.bg
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.arc(cx, cy, 4.6, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()

      const nearVg = hasVgMarker && Math.abs(cx - vgLblX) < 32 && Math.abs(cy - 10 - vgLblY) < 22
      const vpLblX = nearVg ? (cx <= vgLblX ? cx - 8 : cx + 8) : cx
      const vpLblY = nearVg ? Math.min(padT + H - 6, cy + 13) : Math.max(padT + 4, cy - 10)
      const vpAlign = nearVg ? (cx <= vgLblX ? 'right' : 'left') : 'center'
      drawMathText(ctx, 'v_p', vpLblX, vpLblY, {
        color: colVp,
        size: 11.5,
        align: vpAlign,
        backdrop: TOKENS.bg
      })
      ctx.restore()
    }
  }

  // 8. Info compatte in testata/piede canvas (istante t, riferimento, quota passo a)
  ctx.font = sansFont(11, 500)
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillStyle = TOKENS.muted
  const tUnit = p.spreadCurve.unitLabel
  const tVal = timeS * p.spreadCurve.unitFactor
  ctx.fillText(`t = ${formatNumber(tVal, 2)} ${tUnit}`, padL, 4)

  ctx.textAlign = 'right'
  ctx.fillStyle = p.comoving ? quantityColor('v') : TOKENS.muted
  ctx.fillText(p.comoving ? s.scene.comovingBadge : s.scene.labBadge, padL + W, 4)

  // Quota passo reticolare a oppure nota mezzo continuo in basso a sinistra
  ctx.textBaseline = 'bottom'
  ctx.textAlign = 'left'
  if (char.hasDiscreteLattice) {
    const q0 = X(-halfSpanAng + 1.5 * a)
    const q1 = X(-halfSpanAng + 2.5 * a)
    const qy = h - 7
    const colA = quantityColor('a')
    ctx.save()
    ctx.globalAlpha = em('a')
    ctx.strokeStyle = colA
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(q0, qy - 3)
    ctx.lineTo(q0, qy + 3)
    ctx.moveTo(q1, qy - 3)
    ctx.lineTo(q1, qy + 3)
    ctx.moveTo(q0, qy)
    ctx.lineTo(q1, qy)
    ctx.stroke()
    drawMathText(ctx, `a = ${formatNumber(a, 2)} Å`, q1 + 6, qy + 3, {
      color: colA,
      size: 11,
      align: 'left',
      backdrop: TOKENS.bg
    })
    ctx.restore()
  } else {
    ctx.font = sansFont(10.5)
    ctx.fillStyle = TOKENS.dim
    ctx.fillText(s.scene.noteNoLattice, padL, h - 4)
  }
}

function drawSpreadInset(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: WavepacketViewProps,
  timeS: number,
  em: (q: QuantityId) => number,
  lw: (q: QuantityId, base: number) => number
): void {
  const sc = p.spreadCurve
  const char = wavepacketSnapshot(p.wpParams, timeS, {
    halfSpanAng: 10,
    nProfilePoints: 16
  }).characteristics
  const cur = wavepacketWidthAt(char.sigma0Ang, char.omegaSecondAng2S, timeS)

  const padL = 32
  const padR = 10
  const padT = 24
  const padB = 22
  const W = Math.max(24, w - padL - padR)
  const H = Math.max(24, h - padT - padB)

  const yMin = 0.9
  const yMax = Math.max(1.8, sc.maxRatio * 1.12)
  const X = (t: number): number => padL + (sc.tMaxS > 0 ? (t / sc.tMaxS) * W : 0)
  const Y = (r: number): number => padT + ((yMax - r) / (yMax - yMin)) * H

  // Titolo compatto
  ctx.font = sansFont(11, 600)
  ctx.fillStyle = TOKENS.muted
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('σ(t)/σ₀', 8, 5)

  ctx.font = sansFont(11, 600)
  ctx.fillStyle = quantityColor('u')
  ctx.textAlign = 'right'
  ctx.fillText(`${formatNumber(cur.spreadRatio, 2)}×`, w - 8, 5)

  // Assi
  ctx.strokeStyle = TOKENS.line
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padL, padT)
  ctx.lineTo(padL, padT + H)
  ctx.lineTo(padL + W, padT + H)
  ctx.stroke()

  // Linea di riferimento σ/σ₀ = 1
  const pyOne = Y(1)
  ctx.strokeStyle = withAlpha(TOKENS.lineStrong, 0.9)
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(padL, Math.round(pyOne) + 0.5)
  ctx.lineTo(padL + W, Math.round(pyOne) + 0.5)
  ctx.stroke()
  ctx.setLineDash([])

  // Tacche Y: 1 e ceil/half
  ctx.font = sansFont(10)
  ctx.fillStyle = TOKENS.dim
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.fillText('1', padL - 5, pyOne)
  const topTick = Math.floor(yMax * 2) / 2
  if (topTick > 1.2) {
    ctx.fillText(formatNumber(topTick, topTick % 1 === 0 ? 0 : 1), padL - 5, Y(topTick))
  }

  // Etichetta asse t
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillStyle = TOKENS.dim
  ctx.fillText(`t (${sc.unitLabel})`, padL + W, h - 4)
  ctx.textAlign = 'left'
  ctx.fillText('0', padL, h - 4)

  // Curva σ(t)/σ₀
  const colU = quantityColor('u')
  ctx.save()
  ctx.globalAlpha = em('u')
  ctx.strokeStyle = colU
  ctx.lineWidth = lw('u', 1.8)
  ctx.lineJoin = 'round'
  ctx.beginPath()
  for (let i = 0; i < sc.tS.length; i++) {
    const px = X(sc.tS[i])
    const py = Y(sc.ratio[i])
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()

  // Punto corrente
  const cx = X(timeS)
  const cy = Y(cur.spreadRatio)
  ctx.fillStyle = colU
  ctx.strokeStyle = TOKENS.bg
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(cx, cy, 4, 0, 2 * Math.PI)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}
