/**
 * Riquadro per i 4 capitoli bloccati «in arrivo».
 *
 * Requisiti (R3):
 * - Stessa misura e forma del riquadro attivo, ma stile attenuato.
 * - Etichetta «in arrivo» ben leggibile.
 * - Illustrazione statica generata da codice su canvas (UpcomingSketchCanvas).
 * - Non cliccabili, privi di anteprima interattiva.
 * - Provvisti di aria-disabled="true" e raggiungibili via Tab nell'ordine della griglia.
 * - Nessun elenco di argomenti inventati.
 */
import type { JSX } from 'react'
import { homeStrings } from './strings'
import { UpcomingSketchCanvas, type UpcomingSketchKind } from './UpcomingSketchCanvas'

interface UpcomingChapterCardProps {
  readonly id: string
  readonly title: string
  readonly sketchKind: UpcomingSketchKind
}

export function UpcomingChapterCard({
  title,
  sketchKind
}: UpcomingChapterCardProps): JSX.Element {
  return (
    <div
      role="region"
      tabIndex={0}
      className="chapter-card is-upcoming"
      aria-disabled="true"
      aria-label={homeStrings.upcomingAriaLabel(title)}
    >
      <div className="card-head">
        <div className="card-title-group">
          <h2 className="card-title">{title}</h2>
          <span className="card-badge is-upcoming-badge">{homeStrings.upcomingBadge}</span>
        </div>
      </div>

      <div className="card-canvas-wrap">
        <UpcomingSketchCanvas kind={sketchKind} />
      </div>

      <div className="card-body">
        <div className="card-resting-info">
          <p className="card-summary">{homeStrings.upcomingSummary}</p>
          <div className="card-status-note">
            <small>{homeStrings.upcomingStatusNote}</small>
          </div>
        </div>
      </div>
    </div>
  )
}

