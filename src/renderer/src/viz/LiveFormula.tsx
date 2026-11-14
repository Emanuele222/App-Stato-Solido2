/**
 * Formula viva (progetto.md «Meccanismo delle formule vive»): una formula
 * KaTeX i cui termini portano l'id di una grandezza con \htmlData{q=<id>}{…}.
 * - passando con il mouse su un termine chiede di evidenziare la grandezza
 *   (onHighlight), che si accende anche in scena e sul cursore;
 * - quando arriva un'evidenziazione da fuori (cursore, scena) i termini di
 *   quella grandezza si accendono e gli altri si attenuano;
 * - quando un parametro cambia (`pulse`), i suoi termini pulsano.
 */
import { memo, useEffect, useMemo, useRef, type JSX } from 'react'
import { renderTex } from '../ui/katex'
import { isQuantityId, type QuantityId } from '../ui/theme'
import './viz.css'

export interface QuantityPulse {
  readonly quantities: readonly QuantityId[]
  /** Cresce a ogni cambio: ogni valore nuovo fa ripartire l'impulso. */
  readonly seq: number
}

export interface LiveFormulaProps {
  readonly tex: string
  readonly display?: boolean
  readonly highlight: QuantityId | null
  readonly onHighlight?: (quantity: QuantityId | null) => void
  readonly pulse?: QuantityPulse | null
  readonly className?: string
  /** Lettura per i lettori di schermo (la formula KaTeX ha già il suo MathML). */
  readonly ariaLabel?: string
}

export const LiveFormula = memo(function LiveFormula({
  tex,
  display = true,
  highlight,
  onHighlight,
  pulse,
  className,
  ariaLabel
}: LiveFormulaProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const html = useMemo(() => renderTex(tex, display), [tex, display])
  const hovered = useRef<QuantityId | null>(null)

  // evidenziazione in arrivo da fuori
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const terms = root.querySelectorAll<HTMLElement>('[data-q]')
    let any = false
    terms.forEach((el) => {
      const on = el.dataset.q === highlight
      el.classList.toggle('is-on', on)
      any ||= on
    })
    root.classList.toggle('has-hl', any)
  }, [highlight, html])

  // impulso quando cambia un parametro
  useEffect(() => {
    const root = ref.current
    if (!root || !pulse) return
    root.querySelectorAll<HTMLElement>('[data-q]').forEach((el) => {
      if (!pulse.quantities.includes(el.dataset.q as QuantityId)) return
      el.classList.remove('is-pulse')
      void el.offsetWidth // riavvia l'animazione CSS
      el.classList.add('is-pulse')
    })
  }, [pulse, html])

  const report = (q: QuantityId | null): void => {
    if (hovered.current === q) return
    hovered.current = q
    onHighlight?.(q)
  }

  return (
    <div
      ref={ref}
      className={'live-formula' + (className ? ' ' + className : '')}
      aria-label={ariaLabel}
      onPointerOver={(e) => {
        const term = (e.target as Element).closest?.('[data-q]')
        const q = term && ref.current?.contains(term) ? term.getAttribute('data-q') : null
        report(isQuantityId(q) ? q : null)
      }}
      onPointerLeave={() => report(null)}
      onAnimationEnd={(e) => (e.target as Element).classList?.remove('is-pulse')}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})
