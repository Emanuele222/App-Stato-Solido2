/**
 * Schermata iniziale dell'applicazione didattica di Fisica dello Stato Solido.
 *
 * Mostra in alto il nome dell'app e una riga di presentazione, e sotto
 * la griglia regolare e centrata dei 5 macro-capitoli del corso nell'ordine:
 * 1. Teoria delle bande (attivo)
 * 2. Cristallografia (in arrivo)
 * 3. Reticolo reciproco e diffrazione (in arrivo)
 * 4. Fononi (in arrivo)
 * 5. Semiconduttori (in arrivo)
 */
import type { JSX } from 'react'
import { SECTIONS } from '../sections/registry'
import { shellStrings } from '../strings'
import { ActiveChapterCard } from './ActiveChapterCard'
import { homeStrings } from './strings'
import { UpcomingChapterCard } from './UpcomingChapterCard'
import './home.css'

interface HomeScreenProps {
  readonly onSelectSection: (sectionId: string) => void
}

export function HomeScreen({ onSelectSection }: HomeScreenProps): JSX.Element {
  const bandsSections = SECTIONS.filter((s) => s.chapterId === 'bands')

  return (
    <div className="home-screen">
      <header className="home-header">
        <h1 className="home-title">{shellStrings.appName}</h1>
        <p className="home-subtitle">{homeStrings.appSubtitle}</p>
      </header>

      <main className="home-content">
        <div className="home-grid" role="list" aria-label="Macro-capitoli del corso">
          {/* 1. Teoria delle bande (attivo) */}
          <div role="listitem" className="home-grid-item">
            <ActiveChapterCard
              title={shellStrings.chapters.bands}
              sectionsCount={homeStrings.sectionsCount}
              sections={bandsSections}
              onSelect={onSelectSection}
            />
          </div>

          {/* 2. Cristallografia (in arrivo) */}
          <div role="listitem" className="home-grid-item">
            <UpcomingChapterCard
              id="crystallography"
              title={shellStrings.upcoming[0]}
              sketchKind="crystallography"
            />
          </div>

          {/* 3. Reticolo reciproco e diffrazione (in arrivo) */}
          <div role="listitem" className="home-grid-item">
            <UpcomingChapterCard
              id="reciprocal-diffraction"
              title={shellStrings.upcoming[1]}
              sketchKind="reciprocal-diffraction"
            />
          </div>

          {/* 4. Fononi (in arrivo) */}
          <div role="listitem" className="home-grid-item">
            <UpcomingChapterCard
              id="phonons"
              title={shellStrings.upcoming[2]}
              sketchKind="phonons"
            />
          </div>

          {/* 5. Semiconduttori (in arrivo) */}
          <div role="listitem" className="home-grid-item">
            <UpcomingChapterCard
              id="semiconductors"
              title={shellStrings.upcoming[3]}
              sketchKind="semiconductors"
            />
          </div>
        </div>
      </main>
    </div>
  )
}
