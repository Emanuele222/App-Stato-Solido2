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
  footnote: 'Capitoli attivi: Teoria delle bande (6/6) e Fononi.',
  chapters: {
    bands: 'Teoria delle bande',
    phonons: 'Fononi'
  },
  sections: {
    emptyLattice: 'Reticolo vuoto e schemi di zona',
    kronigPenney: 'Kronig–Penney',
    nearlyFree: 'Elettroni quasi liberi',
    tightBinding: 'Legami forti',
    kp: 'Metodo k·p',
    pseudopotential: 'Pseudopotenziale',
    phononMonatomic: 'Catena monatomica e prima zona',
    phononDiatomic: 'Catena biatomica e luce IR',
    phonon3d: 'Rami 3D e cristalli reali',
    phononWavepacket: 'Pacchetti d’onda (fase e gruppo)',
    phononQuantum: 'Modi quantizzati e Umklapp',
    phononSpecificHeat: 'Calore specifico e Debye'
  },
  upcoming: ['Cristallografia', 'Reticolo reciproco e diffrazione', 'Semiconduttori']
} as const
