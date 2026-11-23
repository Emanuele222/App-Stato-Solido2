/**
 * Stato condiviso minimo per la navigazione tra sezioni (es. rimandi tra
 * «Pseudopotenziale» e «Bande dei materiali veri»).
 */
import { create } from 'zustand'

interface NavigationState {
  readonly activeSectionId: string | null
  readonly navigateTo: (sectionId: string | null) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeSectionId: null,
  navigateTo: (activeSectionId) => set({ activeSectionId })
}))
