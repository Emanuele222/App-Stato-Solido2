/**
 * Stringhe della schermata iniziale.
 */
export const homeStrings = {
  appSubtitle: 'Fisica dello stato solido: un percorso interattivo dai modelli ai materiali reali',
  sectionsCount: '6 sezioni',
  sectionsCountFor: (count: number): string => `${count} sezioni`,
  upcomingBadge: 'in arrivo',
  restingHint: 'Tieni premuto o passa con il cursore per 2 s per l’anteprima',
  inPreparationHint: 'Sezioni in preparazione · clicca o attendi 2 s per l’anteprima',
  reducedMotionNotice: 'Movimento ridotto attivo: anteprima statica delle sezioni',
  activeCardAction: 'Clicca o premi Invio per entrare nel capitolo',
  activeAriaLabel: 'Teoria delle bande, 6 sezioni. Clicca o premi Invio per accedere alla prima sezione.',
  activeAriaLabelFor: (title: string, sectionsCount: string, hasAvailable: boolean): string =>
    hasAvailable
      ? `${title}, ${sectionsCount}. Clicca o premi Invio per accedere alla prima sezione.`
      : `${title}, ${sectionsCount}. Clicca o premi Invio per aprire l’anteprima delle sezioni in preparazione.`,
  upcomingAriaLabel: (title: string): string => `${title}, capitolo in arrivo, non ancora disponibile.`,
  chapterDescriptions: {
    bands: 'Reticolo vuoto, Kronig–Penney, quasi liberi, legami forti, k·p e pseudopotenziale.',
    phonons: 'Catene 1D, rami 3D, pacchetti d’onda, modi quantizzati, Umklapp e modello di Debye.'
  },
  upcomingSummary: 'Contenuto in fase di progettazione per le versioni successive.',
  upcomingStatusNote: 'Non disponibile'
} as const

