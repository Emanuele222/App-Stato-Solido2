/**
 * Legenda in HTML, sotto il titolo di una vista: sta fuori dall'area del grafico,
 * quindi non copre curve né etichette. Il campione (tratto continuo, tratteggiato,
 * puntinato, pallino o rombo) e il colore corrispondono a ciò che il grafico disegna.
 * Stili in viz.css (.chart-legend).
 */
import type { CSSProperties, JSX, ReactNode } from 'react'
import './viz.css'

export type LegendKey = 'solid' | 'dashed' | 'dotted' | 'dot' | 'diamond'

export interface LegendEntry {
  readonly id: string
  readonly keyKind: LegendKey
  /** Valore CSS del colore, preso dal tema: `var(--q-VG)`, `var(--tone-…)`, `var(--text-soft)`. */
  readonly color: string
  readonly label: ReactNode
}

export function ChartLegend({ entries, ariaLabel }: { readonly entries: readonly LegendEntry[]; readonly ariaLabel: string }): JSX.Element {
  return (
    <ul className="chart-legend" aria-label={ariaLabel}>
      {entries.map((e) => (
        <li key={e.id} style={{ '--lg': e.color } as CSSProperties}>
          <span className={'chart-legend-key is-' + e.keyKind} aria-hidden="true" />
          <span className="chart-legend-text">{e.label}</span>
        </li>
      ))}
    </ul>
  )
}
