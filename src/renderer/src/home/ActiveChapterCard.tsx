/**
 * Riquadro attivo «Teoria delle bande».
 *
 * Requisiti (R2):
 * - A riposo: titolo «Teoria delle bande», «6 sezioni», miniatura ferma con diagramma a bande calcolato da physics/.
 * - Mantenendo cursore o fuoco da tastiera per 2 secondi senza interruzioni:
 *   avvia anteprima ciclica animata (circa 2,5 s per metodo, transizione morbida) tra i 6 metodi:
 *   1. Reticolo vuoto
 *   2. Kronig–Penney
 *   3. Elettroni quasi liberi
 *   4. Legami forti
 *   5. Metodo k·p
 *   6. Pseudopotenziale (51 onde piane, calcolato una volta sola)
 * - Accanto o sotto la miniatura compare l'elenco delle 6 sezioni con evidenziata quella mostrata.
 * - All'uscita del cursore o perdita di fuoco, l'anteprima si ferma e torna a riposo.
 * - Clic o Invio naviga alla prima sezione («Reticolo vuoto e schemi di zona»).
 * - Con «riduci movimento»: nessuna animazione, dopo 2 s mostra l'elenco sezioni con miniatura statica.
 */
import { useEffect, useRef, useState, type JSX, type KeyboardEvent } from 'react'
import { easeInOutCubic, useReducedMotion } from '../ui/motion'
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

interface ActiveChapterCardProps {
  readonly title: string
  readonly sectionsCount: string
  readonly sections: readonly { readonly id: string; readonly title: string }[]
  readonly onSelect: (sectionId: string) => void
}

export function ActiveChapterCard({
  title,
  sectionsCount,
  sections,
  onSelect
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

    // Carica le curve in memoria se non ancora pronte (richiede ~50 ms una sola volta)
    const previewCurves = getPreviewCurves()
    const numMethods = previewCurves.length
    if (numMethods === 0) return

    let startTime = performance.now()

    const step = (now: number): void => {
      const elapsed = now - startTime
      const cycleIndex = Math.floor(elapsed / METHOD_DURATION_MS) % numMethods
      const timeInMethod = elapsed % METHOD_DURATION_MS
      const steadyTime = METHOD_DURATION_MS - FADE_DURATION_MS

      if (timeInMethod < steadyTime) {
        setActiveMethodIndex(cycleIndex)
        setNextMethodIndex(null)
        setFadeProgress(0)
      } else {
        const fadeElapsed = timeInMethod - steadyTime
        const progress = easeInOutCubic(Math.min(1, fadeElapsed / FADE_DURATION_MS))
        setActiveMethodIndex(cycleIndex)
        setNextMethodIndex((cycleIndex + 1) % numMethods)
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
  }, [previewActive, reducedMotion])

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
  const restingCurves = getRestingCurves()
  const previewCurves = previewActive && !reducedMotion ? getPreviewCurves() : null

  const currentData: MethodPreviewData = previewCurves
    ? previewCurves[activeMethodIndex]
    : restingCurves

  const nextData: MethodPreviewData | null =
    previewCurves && nextMethodIndex !== null ? previewCurves[nextMethodIndex] : null

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      // Naviga alla prima sezione nell'ordine del corso («Reticolo vuoto e schemi di zona»)
      onSelect(sections[0]?.id ?? 'empty-lattice')
    }
  }

  const handleClick = (): void => {
    onSelect(sections[0]?.id ?? 'empty-lattice')
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`chapter-card is-active ${isEngaged ? 'is-engaged' : ''} ${previewActive ? 'is-previewing' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-label={homeStrings.activeAriaLabel}
      aria-expanded={previewActive}
    >
      <div className="card-head">
        <div className="card-title-group">
          <h2 className="card-title">{title}</h2>
          <span className="card-badge is-active-badge">{sectionsCount}</span>
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
            <span className="method-num">{activeMethodIndex + 1}/6</span>
            <span className="method-name">{currentData.title}</span>
          </div>
        )}
      </div>

      <div className="card-body">
        {previewActive ? (
          <div className="card-preview-sections" aria-label="Elenco sezioni capitolo">
            <ol className="preview-sections-list">
              {sections.map((s, idx) => {
                const isCurrent = !reducedMotion && idx === activeMethodIndex
                return (
                  <li
                    key={s.id}
                    className={`preview-section-item ${isCurrent ? 'is-current' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(s.id)
                    }}
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
            <p className="card-summary">{homeStrings.chapterDescriptions.bands}</p>
            <div className="card-hover-prompt">
              <span className="prompt-dot" aria-hidden="true" />
              <small>{homeStrings.restingHint}</small>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
