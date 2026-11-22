/**
 * Riquadro attivo di un capitolo del corso (es. «Teoria delle bande», «Fononi»).
 *
 * - A riposo: titolo, badge con numero di sezioni, miniatura ferma calcolata da `getResting`.
 * - Mantenendo cursore o fuoco da tastiera per 2 secondi senza interruzioni:
 *   avvia l'anteprima ciclica animata (~2,5 s per sezione, transizione morbida) tra le curve
 *   fornite da `getPreview`, mostrando l'elenco delle sezioni con quella attiva evidenziata.
 * - All'uscita del cursore o perdita di fuoco, l'anteprima si ferma e torna a riposo.
 * - Clic o Invio naviga alla prima sezione disponibile; se nessuna sezione ha ancora un
 *   componente montato (stato transitorio), apre subito l'anteprima del capitolo.
 * - Con «riduci movimento»: nessuna animazione, dopo 2 s mostra l'elenco statico.
 */
import { useEffect, useRef, useState, type JSX, type KeyboardEvent } from 'react'
import { easeInOutCubic, useReducedMotion } from '../ui/motion'
import type { QuantityId } from '../ui/theme'
import { BandPreviewCanvas } from './BandPreviewCanvas'
import {
  getPreviewCurves,
  getRestingCurves,
  type MethodPreviewData
} from './curves'
import { homeStrings } from './strings'

const HOVER_DELAY_MS = 2000
const METHOD_DURATION_MS = 2500
const FADE_DURATION_MS = 500

export interface ActiveChapterSectionSummary {
  readonly id: string
  readonly title: string
  readonly available?: boolean
}

export interface ActiveChapterCardProps {
  readonly title: string
  readonly sectionsCount: string
  readonly sections: readonly ActiveChapterSectionSummary[]
  readonly onSelect: (sectionId: string) => void
  readonly getResting?: () => MethodPreviewData
  readonly getPreview?: () => readonly MethodPreviewData[]
  readonly accentQuantity?: QuantityId
  readonly ariaLabel?: string
}

export function ActiveChapterCard({
  title,
  sectionsCount,
  sections,
  onSelect,
  getResting = getRestingCurves,
  getPreview = getPreviewCurves,
  accentQuantity = 'E',
  ariaLabel
}: ActiveChapterCardProps): JSX.Element {
  const reducedMotion = useReducedMotion()

  const [isEngaged, setIsEngaged] = useState(false)
  const [previewActive, setPreviewActive] = useState(false)
  const [activeMethodIndex, setActiveMethodIndex] = useState(0)
  const [nextMethodIndex, setNextMethodIndex] = useState<number | null>(null)
  const [fadeProgress, setFadeProgress] = useState(0)

  const isHoveredRef = useRef(false)
  const isFocusedRef = useRef(false)
  const previewActiveRef = useRef(false)
  const hoverTimerRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  const firstAvailable = sections.find((s) => s.available !== false)
  const hasAvailable = firstAvailable !== undefined

  useEffect(() => {
    previewActiveRef.current = previewActive
  }, [previewActive])

  // Timer di 2 secondi di permanenza ininterrotta
  const startEngagement = (): void => {
    setIsEngaged(true)
    if (hoverTimerRef.current !== null || previewActiveRef.current) {
      return
    }
    hoverTimerRef.current = window.setTimeout(() => {
      hoverTimerRef.current = null
      previewActiveRef.current = true
      setPreviewActive(true)
    }, HOVER_DELAY_MS)
  }

  const endEngagement = (): void => {
    setIsEngaged(false)
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    previewActiveRef.current = false
    setPreviewActive(false)
    setActiveMethodIndex(0)
    setNextMethodIndex(null)
    setFadeProgress(0)
  }

  const handleMouseEnter = (): void => {
    isHoveredRef.current = true
    startEngagement()
  }

  const handleMouseLeave = (): void => {
    isHoveredRef.current = false
    if (!isFocusedRef.current) {
      endEngagement()
    }
  }

  const handleFocus = (): void => {
    isFocusedRef.current = true
    startEngagement()
  }

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>): void => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return
    }
    isFocusedRef.current = false
    if (!isHoveredRef.current) {
      endEngagement()
    }
  }

  // Ciclo animato dell'anteprima (solo quando previewActive è true e riduci movimento non è attivo)
  useEffect(() => {
    if (!previewActive || reducedMotion) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    // Carica le curve in memoria se non ancora pronte
    const previewCurves = getPreview()
    const numMethods = previewCurves.length
    if (numMethods === 0) return

    let startTime: number | null = null

    const step = (now: number): void => {
      if (startTime === null) {
        startTime = now
      }
      const elapsed = Math.max(0, now - startTime)
      const cycleIndex = Math.floor(elapsed / METHOD_DURATION_MS) % numMethods
      const safeIndex = ((cycleIndex % numMethods) + numMethods) % numMethods
      const timeInMethod = elapsed % METHOD_DURATION_MS
      const steadyTime = METHOD_DURATION_MS - FADE_DURATION_MS

      if (timeInMethod < steadyTime) {
        setActiveMethodIndex(safeIndex)
        setNextMethodIndex(null)
        setFadeProgress(0)
      } else {
        const fadeElapsed = timeInMethod - steadyTime
        const progress = easeInOutCubic(Math.min(1, fadeElapsed / FADE_DURATION_MS))
        setActiveMethodIndex(safeIndex)
        setNextMethodIndex((safeIndex + 1) % numMethods)
        setFadeProgress(progress)
      }

      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [previewActive, reducedMotion, getPreview])

  // Pulizia generale all'unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current !== null) {
        window.clearTimeout(hoverTimerRef.current)
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  // Curve da mostrare nel canvas: caricate solo se l'anteprima è attiva e il movimento non è ridotto
  const restingCurves = getResting()
  const previewCurves = previewActive && !reducedMotion ? getPreview() : null

  const currentData: MethodPreviewData =
    (previewCurves && previewCurves[activeMethodIndex]) || restingCurves

  const nextData: MethodPreviewData | null =
    previewCurves && nextMethodIndex !== null && previewCurves[nextMethodIndex]
      ? previewCurves[nextMethodIndex]
      : null

  const activateCard = (): void => {
    if (firstAvailable) {
      onSelect(firstAvailable.id)
      return
    }
    // Caso transitorio: capitolo attivo senza sezioni montate → mostra subito l'anteprima
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    const nextState = !previewActiveRef.current
    previewActiveRef.current = nextState
    setPreviewActive(nextState)
    setIsEngaged(nextState || isHoveredRef.current || isFocusedRef.current)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      activateCard()
    }
  }

  const computedAriaLabel =
    ariaLabel ?? homeStrings.activeAriaLabelFor(title, sectionsCount, hasAvailable)
  const totalCount = Math.max(1, previewCurves?.length ?? sections.length)

  return (
    <div
      role="button"
      tabIndex={0}
      className={`chapter-card is-active ${isEngaged ? 'is-engaged' : ''} ${previewActive ? 'is-previewing' : ''}`}
      onClick={activateCard}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-label={computedAriaLabel}
      aria-expanded={previewActive}
    >
      <div className="card-head">
        <div className="card-title-group">
          <h2 className="card-title">{title}</h2>
          <span className="card-badge is-active-badge" data-q={accentQuantity}>
            {sectionsCount}
          </span>
        </div>
      </div>

      <div className="card-canvas-wrap">
        <BandPreviewCanvas
          current={currentData}
          next={nextData}
          fadeProgress={fadeProgress}
        />
        {previewActive && !reducedMotion && (
          <div className="preview-method-tag">
            <span className="method-num num">
              {activeMethodIndex + 1}/{totalCount}
            </span>
            <span className="method-name">{currentData.title}</span>
          </div>
        )}
      </div>

      <div className="card-body">
        {previewActive ? (
          <div className="card-preview-sections" aria-label={`Elenco sezioni: ${title}`}>
            <ol className="preview-sections-list">
              {sections.map((s, idx) => {
                const isCurrent = !reducedMotion && idx === activeMethodIndex
                return (
                  <li
                    key={s.id}
                    className={`preview-section-item ${isCurrent ? 'is-current' : ''}`}
                  >
                    <span className="section-index">{idx + 1}.</span>
                    <span className="section-title">{s.title}</span>
                  </li>
                )
              })}
            </ol>
            {reducedMotion && (
              <div className="reduced-motion-hint">
                <small>{homeStrings.reducedMotionNotice}</small>
              </div>
            )}
          </div>
        ) : (
          <div className="card-resting-info">
            <div className="card-hover-prompt">
              <span className="prompt-dot" aria-hidden="true" />
              <small>{hasAvailable ? homeStrings.restingHint : homeStrings.inPreparationHint}</small>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
