/**
 * Vista superiore della scena: «Livelli in Γ» prima e dopo lo spin–orbita (H₀ vs H₀ + H_so).
 * Rimpiazza lo spazio reale delle altre sezioni, seguendo lo schema della fig. 3.1a in P4 §3.
 */
import { useRef, type JSX, type PointerEvent } from 'react'
import { useReducedMotion, Smoothed } from '../../ui/motion'
import { quantityColor, TOKENS, type QuantityId } from '../../ui/theme'
import { drawMathText, sansFont, useCanvasDraw, withAlpha } from '../../viz/canvas'
import type { KpModel } from './model'
import type { KpBandRole } from './store'
import { strings as s } from './strings'

interface HitBox {
  readonly role: KpBandRole
  readonly x0: number
  readonly y0: number
  readonly x1: number
  readonly y1: number
}

/** Accorcia un testo con i puntini finché sta nella larghezza data (il carattere va già impostato sul contesto). */
function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (maxW <= 12) return ''
  if (ctx.measureText(text).width <= maxW) return text
  let out = text
  while (out.length > 1 && ctx.measureText(out + '…').width > maxW) out = out.slice(0, -1)
  return out.length > 1 ? out.trimEnd() + '…' : ''
}

export function GammaLevelsCanvas({
  model,
  highlight,
  onSelectRole
}: {
  readonly model: KpModel
  readonly highlight: QuantityId | null
  readonly onSelectRole: (role: KpBandRole) => void
}): JSX.Element {
  const reduced = useReducedMotion()
  const hitBoxes = useRef<HitBox[]>([])
  const anim = useRef({
    eg: new Smoothed(model.gammaLevels.eg, 0.16),
    delta: new Smoothed(model.gammaLevels.delta, 0.16),
    mix: new Smoothed(model.variantMix, 0.16)
  }).current

  const canvasRef = useCanvasDraw((ctx, { w, h }, dt) => {
    anim.eg.set(model.gammaLevels.eg)
    anim.delta.set(model.gammaLevels.delta)
    anim.mix.set(model.variantMix)
    let moving = false
    for (const sm of [anim.eg, anim.delta, anim.mix]) {
      moving = sm.step(dt, reduced) || moving
    }

    const eg = anim.eg.value
    const delta = anim.delta.value
    const mix = anim.mix.value
    const selectedRole = model.selection.role
    const compact = w < 620

    const em = (q: QuantityId): number => (highlight === null || highlight === q ? 1 : 0.25)

    // Scala verticale condivisa attorno alla cima di valenza (E = 0)
    const eTop = eg + Math.max(0.28, 0.22 * eg)
    const eBot = -Math.max(delta + Math.max(0.26, 0.2 * eg), 0.55)
    const topPad = 24
    const botPad = 14
    const innerH = Math.max(40, h - topPad - botPad)
    const Y = (E: number): number => topPad + ((eTop - E) / (eTop - eBot)) * innerH

    const leftPad = compact ? 14 : 26
    const rightPad = compact ? 14 : 26
    const availW = Math.max(200, w - leftPad - rightPad)

    // Colonna sinistra (senza H_so) | raccordi | colonna destra (con H_so)
    const leftBarW = Math.min(compact ? 115 : 155, availW * 0.24)
    const leftX0 = leftPad
    const leftX1 = leftX0 + leftBarW

    const rightX0 = leftX0 + availW * (compact ? 0.37 : 0.39)
    const rightW = Math.max(120, leftPad + availW - rightX0 - (compact ? 38 : 48))
    const gapBetween = compact ? 10 : 14
    const slotW = (rightW - gapBetween) / 2
    const hhX0 = rightX0
    const hhX1 = hhX0 + slotW
    const lhX0 = hhX1 + gapBetween
    const lhX1 = lhX0 + slotW
    const cRightX0 = rightX0
    const cRightX1 = rightX0 + rightW

    // Intestazioni delle due colonne
    ctx.font = sansFont(compact ? 10.5 : 11.5)
    ctx.fillStyle = TOKENS.muted
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(s.scene.withoutSoTitle, leftX0, 15)
    ctx.fillText(mix > 0.5 ? s.scene.twoBandRightTitle : s.scene.withSoTitle, rightX0, 15)

    const yC = Y(eg)
    const yVbm = Y(0)
    // E_g piccolo (es. InSb, 0,18 eV): c e hh/lh sono a pochi pixel; i testi si spostano, le linee restano in scala
    const closeLevels = yVbm - yC < 42
    const yBary = Y(-delta / 3)
    const ySo = Y(-delta)

    // Raccordo sottile del baricentro p senza spin–orbita
    if (delta > 0.015) {
      ctx.save()
      ctx.globalAlpha = 0.3 * em('Delta')
      ctx.strokeStyle = quantityColor('Delta')
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(leftX1, yBary)
      ctx.lineTo(rightX0 + rightW + 6, yBary)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()
    }

    // Linee di collegamento sinistra → destra
    ctx.save()
    ctx.lineWidth = 1.25
    // c: da s a c
    ctx.globalAlpha = 0.45 * em('E')
    ctx.strokeStyle = TOKENS.lineStrong
    ctx.beginPath()
    ctx.moveTo(leftX1 + 2, yC)
    ctx.lineTo(cRightX0 - 4, yC)
    ctx.stroke()

    // p → J=3/2 (hh, lh) e J=1/2 (so)
    ctx.globalAlpha = 0.6 * em('Delta')
    ctx.strokeStyle = quantityColor('Delta')
    ctx.beginPath()
    ctx.moveTo(leftX1 + 2, yBary)
    ctx.lineTo(hhX0 - 4, yVbm)
    ctx.stroke()
    if (1 - mix > 0.02) {
      ctx.globalAlpha = (1 - mix) * 0.6 * em('Delta')
      ctx.beginPath()
      ctx.moveTo(leftX1 + 2, yBary)
      ctx.lineTo(hhX0 - 4, ySo)
      ctx.stroke()
    }
    ctx.restore()

    // Frecce di accoppiamento k·p̂ evidenziate su hover di E_P ('EP') o di default tenui
    const kpHighlight = highlight === 'EP'
    ctx.save()
    ctx.globalAlpha = kpHighlight ? 0.95 : 0.28 * em('EP')
    ctx.strokeStyle = quantityColor('EP')
    ctx.lineWidth = kpHighlight ? 1.8 : 1.1
    ctx.setLineDash([4, 3])
    const midLhX = 0.5 * (lhX0 + lhX1)
    ctx.beginPath()
    ctx.moveTo(midLhX, yC + 8)
    ctx.lineTo(midLhX, yVbm - 8)
    ctx.stroke()
    if (1 - mix > 0.1 && delta > 0.08) {
      const soCenterX = compact ? lhX0 + slotW * 0.72 : lhX1 + 4
      ctx.beginPath()
      ctx.moveTo(midLhX + 18, yC + 8)
      ctx.lineTo(soCenterX, ySo - 8)
      ctx.stroke()
    }
    ctx.setLineDash([])
    if (kpHighlight) {
      drawMathText(ctx, 'k·p', midLhX + 8, 0.5 * (yC + yVbm) + 4, {
        color: quantityColor('EP'),
        size: 12,
        backdrop: TOKENS.bg
      })
    }
    ctx.restore()

    // Helper per barra di livello energetico + etichetta.
    // layout 'normal': nome sopra la barra, nota sotto; 'meta-below': nota sotto come testo in alto (hh, lh);
    // con i livelli vicini (E_g piccolo, es. InSb) le linee restano in scala e si spostano solo i testi:
    // 'above' = nome e nota su una riga sopra la barra, 'below' = nome e nota sotto la barra, con un trattino di richiamo.
    const boxes: HitBox[] = []
    type LevelLayout = 'normal' | 'meta-below' | 'above' | 'below'
    const drawLevelBar = (
      x0: number,
      x1: number,
      y: number,
      mainLabel: string,
      metaLabel: string,
      color: string,
      isSelected: boolean,
      role?: KpBandRole,
      alphaMul: number = 1,
      layout: LevelLayout = 'normal'
    ): void => {
      ctx.save()
      ctx.globalAlpha = alphaMul
      if (isSelected) {
        ctx.fillStyle = color
        ctx.globalAlpha = alphaMul * 0.14
        if (layout === 'above') ctx.fillRect(x0 - 4, y - 16, x1 - x0 + 8, 20)
        else if (layout === 'below') ctx.fillRect(x0 - 4, y - 4, x1 - x0 + 8, 32)
        else ctx.fillRect(x0 - 4, y - 16, x1 - x0 + 8, 32)
        ctx.globalAlpha = alphaMul
      }
      ctx.strokeStyle = isSelected ? TOKENS.text : color
      ctx.lineWidth = isSelected ? 3.2 : 2.2
      ctx.beginPath()
      ctx.moveTo(x0, y)
      ctx.lineTo(x1, y)
      ctx.stroke()

      if (isSelected) {
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x0 + 6, y, 3.5, 0, 2 * Math.PI)
        ctx.fill()
      }

      const textX = isSelected ? x0 + 13 : x0 + 2
      const mainSize = compact ? 11.5 : 12.5
      const mainColor = isSelected ? TOKENS.text : color
      const metaSize = compact ? 9.5 : 10.5
      ctx.font = sansFont(metaSize)
      ctx.fillStyle = isSelected ? TOKENS.textSoft : TOKENS.muted
      ctx.textAlign = 'left'

      if (layout === 'above') {
        // una riga sola sopra la barra: nome, poi la nota in carattere più piccolo
        const wMain = drawMathText(ctx, mainLabel, textX, y - 6, { color: mainColor, size: mainSize, backdrop: TOKENS.bg })
        ctx.textBaseline = 'alphabetic'
        ctx.font = sansFont(metaSize)
        const room = x1 - (textX + wMain + 10)
        const metaText = ellipsize(ctx, metaLabel, room)
        if (metaText) {
          ctx.fillStyle = isSelected ? TOKENS.textSoft : TOKENS.muted
          ctx.fillText(metaText, textX + wMain + 8, y - 6)
        }
      } else if (layout === 'below') {
        // trattino di richiamo dalla barra al testo spostato sotto
        ctx.strokeStyle = withAlpha(color, 0.7)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x0 + 1.5, y + 2)
        ctx.lineTo(x0 + 1.5, y + 9)
        ctx.stroke()
        drawMathText(ctx, mainLabel, textX, y + 17, { color: mainColor, size: mainSize, backdrop: TOKENS.bg })
        ctx.font = sansFont(metaSize)
        ctx.fillStyle = isSelected ? TOKENS.textSoft : TOKENS.muted
        ctx.textBaseline = 'alphabetic'
        ctx.fillText(metaLabel, x0 + 2, y + 29)
      } else {
        drawMathText(ctx, mainLabel, textX, y - 6, { color: mainColor, size: mainSize, backdrop: TOKENS.bg })
        ctx.font = sansFont(metaSize)
        ctx.fillStyle = isSelected ? TOKENS.textSoft : TOKENS.muted
        ctx.textBaseline = layout === 'meta-below' ? 'top' : 'alphabetic'
        ctx.fillText(metaLabel, x0 + 2, layout === 'meta-below' ? y + 4 : y + 13)
      }
      ctx.restore()

      if (role) {
        const y0 = layout === 'above' ? y - 18 : layout === 'below' ? y - 4 : y - 18
        const y1 = layout === 'above' ? y + 4 : layout === 'below' ? y + 32 : y + 18
        boxes.push({ role, x0: x0 - 4, y0, x1: x1 + 4, y1 })
      }
    }

    // Colonna sinistra: s (L=0, 2 stati) e p (L=1, 6 stati)
    drawLevelBar(
      leftX0,
      leftX1,
      yC,
      's  (L = 0)',
      '2 stati',
      quantityColor('E'),
      false,
      undefined,
      em('E')
    )
    drawLevelBar(
      leftX0,
      leftX1,
      yBary,
      'p  (L = 1)',
      compact ? 'm_l = 0,±1 · 6 stati' : 'm_l = 0, ±1 · 6 stati',
      quantityColor('E'),
      false,
      undefined,
      em('E')
    )

    // Colonna destra: conduzione c
    drawLevelBar(
      cRightX0,
      cRightX1,
      yC,
      mix > 0.5 ? 'c  (|S⟩)' : 'c  (s, J = ½)',
      mix > 0.5 ? '2 stati · accoppiato a |Z⟩' : 'm_J = ±½ · 2 stati · non separata',
      quantityColor('E'),
      selectedRole === 'c',
      'c',
      em(highlight === 'EP' ? 'EP' : 'E'),
      closeLevels ? 'above' : 'normal'
    )

    // Colonna destra: J = 3/2 (hh e lh affiancate allo stesso E = 0)
    // Se Δ è piccolo (es. GaAs, Ge) riserviamo tre slot orizzontali netti così lh e so non collidono mai
    const soClose = Math.abs(ySo - yVbm) < 30 && 1 - mix > 0.05
    const gap3 = compact ? 8 : 12
    const slotW3 = (rightW - 2 * gap3) / 3
    const activeHhX1 = soClose ? hhX0 + slotW3 : hhX1
    const activeLhX0 = soClose ? activeHhX1 + gap3 : lhX0
    const activeLhX1 = soClose ? activeLhX0 + slotW3 : lhX1

    drawLevelBar(
      hhX0,
      activeHhX1,
      yVbm,
      mix > 0.5 ? 'hh  (|X⟩, |Y⟩)' : 'hh  (p, J = 3/2)',
      mix > 0.5 ? 'non accoppiate · 4 stati' : soClose || compact ? 'm_J = ±3/2 (2 st.)' : 'm_J = ±3/2 · 2 stati',
      quantityColor('E'),
      selectedRole === 'hh',
      'hh',
      em('E') * (highlight === 'EP' ? 0.35 : 1),
      closeLevels ? 'below' : 'meta-below'
    )

    drawLevelBar(
      activeLhX0,
      activeLhX1,
      yVbm,
      mix > 0.5 ? 'lh  (|Z⟩)' : 'lh  (p, J = 3/2)',
      mix > 0.5 ? 'accoppiato · 2 stati' : soClose || compact ? 'm_J = ±½ (2 st.)' : 'm_J = ±½ · 2 stati',
      quantityColor('E'),
      selectedRole === 'lh',
      'lh',
      em(highlight === 'EP' ? 'EP' : 'E'),
      closeLevels ? 'below' : 'meta-below'
    )

    // Colonna destra: J = 1/2 split-off (in E = -Δ)
    if (1 - mix > 0.03) {
      const soX0 = soClose ? activeLhX1 + gap3 : rightX0
      const soX1 = soClose ? rightX0 + rightW : rightX0 + rightW * 0.72
      drawLevelBar(
        soX0,
        soX1,
        ySo,
        'so  (p, J = ½)',
        soClose || compact ? 'm_J = ±½ (2 st.)' : 'm_J = ±½ · 2 stati (split-off)',
        quantityColor('Delta'),
        selectedRole === 'so',
        'so',
        (1 - mix) * em(highlight === 'EP' ? 'EP' : 'Delta'),
        'normal'
      )
    }

    // Parentesi / quota verticale di E_g (tra sinistra e destra)
    const xEg = leftX1 + (rightX0 - leftX1) * 0.42
    ctx.save()
    ctx.globalAlpha = em('VG')
    ctx.strokeStyle = quantityColor('VG')
    ctx.lineWidth = highlight === 'VG' ? 2.4 : 1.5
    ctx.beginPath()
    ctx.moveTo(xEg, yVbm)
    ctx.lineTo(xEg, yC)
    ctx.moveTo(xEg - 4, yVbm)
    ctx.lineTo(xEg + 4, yVbm)
    ctx.moveTo(xEg - 4, yC)
    ctx.lineTo(xEg + 4, yC)
    ctx.stroke()
    drawMathText(ctx, 'E_{g}', xEg + 6, 0.5 * (yC + yVbm) + 4, {
      color: quantityColor('VG'),
      size: 13,
      backdrop: TOKENS.bg
    })
    ctx.restore()

    // Parentesi verticale di Δ a destra (quando Δ > 0 e in Kane)
    if (delta > 0.02 && 1 - mix > 0.05) {
      const xDel = rightX0 + rightW + 10
      ctx.save()
      ctx.globalAlpha = (1 - mix) * em('Delta')
      ctx.strokeStyle = quantityColor('Delta')
      ctx.lineWidth = highlight === 'Delta' ? 2.4 : 1.5
      ctx.beginPath()
      ctx.moveTo(xDel, yVbm)
      ctx.lineTo(xDel, ySo)
      ctx.moveTo(xDel - 4, yVbm)
      ctx.lineTo(xDel + 4, yVbm)
      ctx.moveTo(xDel - 4, ySo)
      ctx.lineTo(xDel + 4, ySo)
      ctx.stroke()
      drawMathText(ctx, 'Δ', xDel + 6, 0.5 * (yVbm + ySo) + 4, {
        color: quantityColor('Delta'),
        size: 13,
        backdrop: TOKENS.bg
      })
      ctx.restore()
    }

    hitBoxes.current = boxes
    return moving
  })

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>): void => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - r.left
    const py = e.clientY - r.top
    for (const box of hitBoxes.current) {
      if (px >= box.x0 && px <= box.x1 && py >= box.y0 && py <= box.y1) {
        onSelectRole(box.role)
        return
      }
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className="kp-levels-canvas"
      role="img"
      aria-label={s.scene.levelsAria}
      onPointerDown={onPointerDown}
    />
  )
}
