/**
 * Guscio dell'app: barra laterale con capitoli e sezioni, e impaginazione
 * della schermata di sezione (progetto.md «Struttura dell'app»): barra
 * superiore con percorso e strumenti, scena al centro, parametri sotto,
 * formula viva e scheda teoria a destra. Sotto 1024 px la barra laterale
 * diventa un pannello a scomparsa.
 */
import { createContext, useContext, useEffect, useRef, useState, type JSX, type ReactNode } from 'react'

export interface NavSection {
  readonly id: string
  readonly title: string
  readonly available: boolean
}

export interface NavChapter {
  readonly id: string
  readonly title: string
  readonly sections: readonly NavSection[]
}

export interface ShellLabels {
  readonly appName: string
  readonly appNote: string
  readonly navLabel: string
  readonly upcomingTitle: string
  readonly unavailableHint: string
  readonly openNav: string
  readonly closeNav: string
  readonly footnote: string
}

interface ShellNav {
  readonly toggle: () => void
  readonly open: boolean
  readonly labels: ShellLabels
}

const ShellNavContext = createContext<ShellNav | null>(null)

export function AppShell({
  labels,
  chapters,
  upcoming,
  activeSectionId,
  onSelectSection,
  children
}: {
  labels: ShellLabels
  chapters: readonly NavChapter[]
  upcoming: readonly string[]
  activeSectionId: string
  onSelectSection: (id: string) => void
  children: ReactNode
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    navRef.current?.querySelector<HTMLElement>('button, [href]')?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <ShellNavContext.Provider value={{ open, toggle: () => setOpen((o) => !o), labels }}>
      <div className="shell">
        <nav ref={navRef} className="nav" aria-label={labels.navLabel} data-open={open || undefined}>
          <div className="nav-brand">
            {labels.appName}
            <small>{labels.appNote}</small>
          </div>
          {chapters.map((chapter) => (
            <div key={chapter.id} className="nav-chapter">
              <div className="nav-chapter-title">{chapter.title}</div>
              <ul>
                {chapter.sections.map((s) => {
                  const active = s.id === activeSectionId
                  return (
                    <li key={s.id}>
                      {s.available ? (
                        <button
                          type="button"
                          className="nav-item"
                          aria-current={active ? 'page' : undefined}
                          onClick={() => {
                            onSelectSection(s.id)
                            setOpen(false)
                          }}
                        >
                          {s.title}
                        </button>
                      ) : (
                        <span className="nav-item is-disabled" aria-disabled="true" title={labels.unavailableHint}>
                          {s.title}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          <div className="nav-upcoming-title">{labels.upcomingTitle}</div>
          <ul className="nav-upcoming">
            {upcoming.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
          <div className="nav-foot">{labels.footnote}</div>
        </nav>
        {open && <div className="nav-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}
        <div className="shell-main">{children}</div>
      </div>
    </ShellNavContext.Provider>
  )
}

/** Pulsante che apre la barra laterale quando è nascosta (visibile solo sotto 1024 px). */
function NavToggle(): JSX.Element | null {
  const nav = useContext(ShellNavContext)
  if (!nav) return null
  return (
    <button
      type="button"
      className="nav-toggle"
      aria-expanded={nav.open}
      aria-label={nav.open ? nav.labels.closeNav : nav.labels.openNav}
      onClick={nav.toggle}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  )
}

/** Impaginazione di una sezione. */
export function SectionLayout({
  chapterTitle,
  sectionTitle,
  toolsLabel,
  tools,
  scene,
  params,
  aside,
  asideLabel
}: {
  chapterTitle: string
  sectionTitle: string
  toolsLabel: string
  tools: ReactNode
  scene: ReactNode
  params: ReactNode
  aside: ReactNode
  asideLabel: string
}): JSX.Element {
  return (
    <div className="section">
      <main className="stage">
        <header className="topbar">
          <NavToggle />
          <div className="crumb">
            <span>{chapterTitle}</span>
            <span className="crumb-sep" aria-hidden="true">
              ›
            </span>
            <h1>{sectionTitle}</h1>
          </div>
          <div className="tools" role="group" aria-label={toolsLabel}>
            {tools}
          </div>
        </header>
        <div className="scene">{scene}</div>
        <div className="params">{params}</div>
      </main>
      <aside className="aside" aria-label={asideLabel}>
        {aside}
      </aside>
    </div>
  )
}

/** Riquadro della scena con etichetta e suggerimento sopra il disegno. */
export function SceneView({
  tag,
  hint,
  children,
  className
}: {
  tag: string
  hint?: ReactNode
  children: ReactNode
  className?: string
}): JSX.Element {
  return (
    <div className={'view' + (className ? ' ' + className : '')}>
      <div className="view-head">
        <span className="view-tag">{tag}</span>
        {hint && <span className="view-hint">{hint}</span>}
      </div>
      <div className="view-body">{children}</div>
    </div>
  )
}
