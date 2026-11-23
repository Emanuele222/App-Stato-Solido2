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
import { PhononMonatomicSection } from './phonon-monatomic/PhononMonatomicSection'

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
  { id: 'pseudopotential', chapterId: 'bands', title: s.sections.pseudopotential, component: PseudopotentialSection },
  { id: 'phonon-monatomic', chapterId: 'phonons', title: s.sections.phononMonatomic, component: PhononMonatomicSection },
  { id: 'phonon-diatomic', chapterId: 'phonons', title: s.sections.phononDiatomic, component: null },
  { id: 'phonon-3d', chapterId: 'phonons', title: s.sections.phonon3d, component: null },
  { id: 'phonon-wavepacket', chapterId: 'phonons', title: s.sections.phononWavepacket, component: null },
  { id: 'phonon-quantum', chapterId: 'phonons', title: s.sections.phononQuantum, component: null },
  { id: 'phonon-specific-heat', chapterId: 'phonons', title: s.sections.phononSpecificHeat, component: null }
]

export const CHAPTERS: readonly NavChapter[] = [
  {
    id: 'bands',
    title: s.chapters.bands,
    accentQuantity: 'E',
    sections: SECTIONS.filter((x) => x.chapterId === 'bands').map((x) => ({
      id: x.id,
      title: x.title,
      available: x.component !== null
    }))
  },
  {
    id: 'phonons',
    title: s.chapters.phonons,
    accentQuantity: 'omega',
    sections: SECTIONS.filter((x) => x.chapterId === 'phonons').map((x) => ({
      id: x.id,
      title: x.title,
      available: x.component !== null
    }))
  }
]

export const UPCOMING_CHAPTERS: readonly string[] = s.upcoming

export type ChapterStatus = 'active' | 'upcoming'

export interface ChapterEntry {
  readonly id: string
  readonly title: string
  readonly status: ChapterStatus
  readonly sectionsCount?: number
  readonly defaultSectionId?: string
}

export const ALL_CHAPTERS: readonly ChapterEntry[] = [
  {
    id: 'bands',
    title: s.chapters.bands,
    status: 'active',
    sectionsCount: SECTIONS.filter((x) => x.chapterId === 'bands').length,
    defaultSectionId: 'empty-lattice'
  },
  {
    id: 'crystallography',
    title: s.upcoming[0],
    status: 'upcoming'
  },
  {
    id: 'reciprocal-diffraction',
    title: s.upcoming[1],
    status: 'upcoming'
  },
  {
    id: 'phonons',
    title: s.chapters.phonons,
    status: 'active',
    sectionsCount: SECTIONS.filter((x) => x.chapterId === 'phonons').length,
    defaultSectionId: 'phonon-monatomic'
  },
  {
    id: 'semiconductors',
    title: s.upcoming[2],
    status: 'upcoming'
  }
]

export const DEFAULT_SECTION_ID = 'empty-lattice'
