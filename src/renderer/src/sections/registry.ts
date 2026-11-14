/**
 * Indice di capitoli e sezioni, nell'ordine e con i nomi di progetto.md
 * («Capitolo 1 — Teoria delle bande»). Una sezione senza componente è
 * visibile ma non selezionabile.
 */
import type { ComponentType } from 'react'
import type { NavChapter } from '../ui/shell'
import { shellStrings as s } from '../strings'
import { NearlyFreeSection } from './nearly-free/NearlyFreeSection'
import { EmptyLatticeSection } from './empty-lattice/EmptyLatticeSection'
import { KronigPenneySection } from './kronig-penney/KronigPenneySection'
import { TightBindingSection } from './tight-binding/TightBindingSection'
import { KDotPSection } from './k-dot-p/KDotPSection'
import { PseudopotentialSection } from './pseudopotential/PseudopotentialSection'

export interface SectionEntry {
  readonly id: string
  readonly chapterId: string
  readonly title: string
  readonly component: ComponentType | null
}

export const SECTIONS: readonly SectionEntry[] = [
  { id: 'empty-lattice', chapterId: 'bands', title: s.sections.emptyLattice, component: EmptyLatticeSection },
  { id: 'kronig-penney', chapterId: 'bands', title: s.sections.kronigPenney, component: KronigPenneySection },
  { id: 'nearly-free', chapterId: 'bands', title: s.sections.nearlyFree, component: NearlyFreeSection },
  { id: 'tight-binding', chapterId: 'bands', title: s.sections.tightBinding, component: TightBindingSection },
  { id: 'k-dot-p', chapterId: 'bands', title: s.sections.kp, component: KDotPSection },
  { id: 'pseudopotential', chapterId: 'bands', title: s.sections.pseudopotential, component: PseudopotentialSection }
]

export const CHAPTERS: readonly NavChapter[] = [
  {
    id: 'bands',
    title: s.chapters.bands,
    sections: SECTIONS.filter((x) => x.chapterId === 'bands').map((x) => ({
      id: x.id,
      title: x.title,
      available: x.component !== null
    }))
  }
]

export const UPCOMING_CHAPTERS: readonly string[] = s.upcoming

export const DEFAULT_SECTION_ID = 'nearly-free'
