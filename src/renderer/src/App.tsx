import { useState, type JSX } from 'react'
import { CHAPTERS, DEFAULT_SECTION_ID, SECTIONS, UPCOMING_CHAPTERS } from './sections/registry'
import { shellStrings } from './strings'
import { AppShell } from './ui/shell'

export function App(): JSX.Element {
  const [sectionId, setSectionId] = useState(DEFAULT_SECTION_ID)
  const entry = SECTIONS.find((x) => x.id === sectionId && x.component) ?? SECTIONS.find((x) => x.id === DEFAULT_SECTION_ID)
  const Section = entry?.component
  return (
    <AppShell
      labels={shellStrings}
      chapters={CHAPTERS}
      upcoming={UPCOMING_CHAPTERS}
      activeSectionId={entry?.id ?? ''}
      onSelectSection={setSectionId}
    >
      {Section ? <Section /> : null}
    </AppShell>
  )
}
