import { useState, type JSX } from 'react'
import { HomeScreen } from './home/HomeScreen'
import { CHAPTERS, SECTIONS, UPCOMING_CHAPTERS } from './sections/registry'
import { shellStrings } from './strings'
import { AppShell } from './ui/shell'

export function App(): JSX.Element {
  // All'avvio dell'applicazione mostrare la schermata iniziale (nessuna sezione attiva)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)

  if (!activeSectionId) {
    return <HomeScreen onSelectSection={setActiveSectionId} />
  }

  const entry = SECTIONS.find((x) => x.id === activeSectionId && x.component)
  if (!entry || !entry.component) {
    return <HomeScreen onSelectSection={setActiveSectionId} />
  }
  const Section = entry.component

  return (
    <AppShell
      labels={shellStrings}
      chapters={CHAPTERS}
      upcoming={UPCOMING_CHAPTERS}
      activeSectionId={entry.id}
      onSelectSection={setActiveSectionId}
      onGoHome={() => setActiveSectionId(null)}
    >
      <Section />
    </AppShell>
  )
}
