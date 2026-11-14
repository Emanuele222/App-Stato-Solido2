// Stringhe del guscio dell'app (barra laterale, capitoli). Ogni sezione ha il
// proprio file di stringhe in sections/<sezione>/strings.ts.
export const shellStrings = {
  appName: 'Stato Solido',
  appNote: 'nome provvisorio',
  navLabel: 'Capitoli e sezioni',
  upcomingTitle: 'In arrivo',
  unavailableHint: 'Sezione non ancora disponibile',
  openNav: 'Apri l’indice delle sezioni',
  closeNav: 'Chiudi l’indice delle sezioni',
  goHome: 'Torna alla schermata iniziale',
  footnote: 'Capitolo 1: Teoria delle bande completo (6 sezioni disponibili).',
  chapters: {
    bands: 'Teoria delle bande'
  },
  sections: {
    emptyLattice: 'Reticolo vuoto e schemi di zona',
    kronigPenney: 'Kronig–Penney',
    nearlyFree: 'Elettroni quasi liberi',
    tightBinding: 'Legami forti',
    kp: 'Metodo k·p',
    pseudopotential: 'Pseudopotenziale'
  },
  upcoming: ['Cristallografia', 'Reticolo reciproco e diffrazione', 'Fononi', 'Semiconduttori']
} as const
