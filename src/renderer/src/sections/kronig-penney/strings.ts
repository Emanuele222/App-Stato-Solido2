/**
 * Tutti i testi della sezione «Kronig–Penney» (dispensa Parte 3, §10).
 * La matematica sta in TeX ($…$) e i riferimenti alle grandezze usano
 * \htmlData{q=<id>}{…} per collegarsi ai colori del design system.
 */
export const strings = {
  chapter: 'Teoria delle bande',
  title: 'Kronig–Penney',
  toolsLabel: 'Strumenti sul grafico',
  asideLabel: 'Formula, valori e teoria',

  tools: {
    fill: 'Riempimento',
    fillTitle: 'Mostra il livello di Fermi e gli stati occupati (2 elettroni per cella)',
    mass: 'Massa efficace',
    massTitle: 'Parabola osculatrice nello stato scelto e confronto con la banda a coseno',
    cosine: 'Banda a coseno',
    cosineTitle: 'Sovrappone Ē ∓ 2t·cos ka sulla banda scelta (ponte verso Legami forti)',
    compare: 'Confronto: reticolo vuoto',
    compareTitle: 'Sovrappone le parabole libere ripiegate (V = 0)'
  },

  variants: {
    label: 'Modello',
    delta: 'A delta',
    deltaTitle: 'Barriere sottilissime e alte V(x) = aV₀ Σ δ(x − x_b), parametri a e P',
    rectangular: 'Barriere rettangolari',
    rectangularTitle: 'Buche larghe b e barriere larghe c e alte V₀ (a = b + c)'
  },

  params: {
    a: 'Passo reticolare a',
    P: 'Opacità della barriera delta P (non è il parametro P di k·p)',
    b: 'Larghezza della buca b',
    c: 'Spessore della barriera c',
    v0: 'Altezza della barriera V₀'
  },

  electrons: {
    label: 'elettroni per cella',
    decrease: 'Riduci il numero di elettroni per cella',
    increase: 'Aumenta il numero di elettroni per cella'
  },

  scene: {
    realTag: 'Spazio reale',
    realAria: 'Potenziale periodico di Kronig–Penney, ioni al centro delle buche e densità di probabilità esatta |ψ|²',
    realHint: (kFrac: string, band: number) => `stato scelto · k = ${kFrac} π/a · banda ${band}`,
    ions: 'ioni al centro delle buche',
    density: '|ψ|²',
    potentialDelta: 'V(x)',
    potentialRect: 'V(x)',
    bandsTag: 'Condizione di banda e diagramma E(k)',
    bandsHint: 'clicca o trascina su una banda (o sulla curva L) per scegliere lo stato · frecce da tastiera',
    bandsAria: 'Condizione cos ka = L(E) affiancata al diagramma E(k) con lo stesso asse dell’energia',
    energyAxis: 'E (eV)',
    kAxis: 'k (Å⁻¹)',
    lAxisDelta: 'f(αa)',
    lAxisRect: 'L(E)',
    bandsLegend: 'Kronig–Penney',
    cosineLegend: 'banda a coseno',
    compareLegend: 'reticolo vuoto',
    gapLabel: 'E_{g}',
    metal: 'metallo',
    insulator: 'isolante',
    probe: 'm*',
    parentTick: (n: number) => `E_${n}`,
    wellLevelsBadge: 'livelli buca isolata'
  },

  formula: {
    title: 'Formula viva',
    ariaDelta: 'cos ka uguale cos alfa a più P sin alfa a su alfa a',
    ariaRect: 'L uguale cos alfa b cosh beta c più rapporto su sin alfa b sinh beta c uguale cos ka'
  },

  values: {
    period: 'periodo',
    opacity: 'opacità delta',
    strength: 'barriera',
    bandRow: (n: number) => `banda ${n}`,
    gapRow: 'primo gap',
    parents: 'livelli genitori',
    parentsNone: 'nessun livello legato (V₀ = 0)',
    state: 'stato scelto',
    band: 'banda',
    cosine: 'banda a coseno',
    fermi: 'livello di Fermi',
    electrons: (n: number) => `${n} el./cella`,
    mass: 'massa efficace',
    cosineMass: 'da banda a coseno',
    cosineMassNote: 'al fondo banda: ħ²/(2ta²)',
    velocity: 'velocità di gruppo'
  },

  theory: {
    title: 'Scheda teoria',
    blocks: [
      {
        heading: 'Un potenziale periodico risolto esattamente',
        paragraphs: [
          'Il modello di Kronig–Penney risolve esattamente l’equazione di Schrödinger per un reticolo periodico di buche larghe $\\htmlData{q=a}{b}$ ($V=0$, centrate sugli ioni) separate da barriere larghe $\\htmlData{q=a}{c}$ e alte $\\htmlData{q=VG}{V_0}$, di periodo $\\htmlData{q=a}{a}=\\htmlData{q=a}{b}+\\htmlData{q=a}{c}$.',
          'Imponendo la condizione di Bloch $\\psi(x+a)=e^{i\\htmlData{q=k}{k}\\htmlData{q=a}{a}}\\psi(x)$ e la continuità di $\\psi$ e $\\psi’$ ai bordi si ottiene l’equazione trascendente $\\cos(\\htmlData{q=k}{k}\\htmlData{q=a}{a})=\\htmlData{q=E}{L(E)}$.'
        ]
      },
      {
        heading: 'Perché si formano bande e gap',
        paragraphs: [
          'Per un vettore di Bloch reale $-1\\le\\cos(\\htmlData{q=k}{k}\\htmlData{q=a}{a})\\le 1$: gli intervalli di $\\htmlData{q=E}{E}$ in cui $|\\htmlData{q=E}{L(E)}|\\le 1$ sono le bande permesse; dove $|\\htmlData{q=E}{L(E)}|>1$ non esiste $k$ reale e si apre un gap (soluzioni evanescenti).'
        ]
      },
      {
        heading: 'Livelli genitori, tunnel e bande a coseno',
        paragraphs: [
          'In ogni banda delle barriere rettangolari cade un livello discreto della buca finita isolata (livello «genitore»). All’aumentare dello spessore $\\htmlData{q=a}{c}$ o dell’altezza $\\htmlData{q=VG}{V_0}$, le code $e^{-\\beta c}$ si riducono e la larghezza $W$ decresce come $e^{-\\beta c}$.',
          'Linearizzando $\\htmlData{q=E}{L(E)}$ in una banda si ottiene $\\htmlData{q=E}{E}(k)\\approx\\bar E\\mp 2t\\cos \\htmlData{q=k}{k}\\htmlData{q=a}{a}$ con $W=4t$, che coincide con i Legami forti. Nota: qui $\\htmlData{q=VG}{P}=m_0 a^2 V_0/\\hbar^2$ è l’opacità della delta (non il parametro di Kane $k\\cdot p$).'
        ]
      },
      {
        heading: 'Limiti e cose da provare',
        paragraphs: [
          'Nel modello a delta, porta $\\htmlData{q=VG}{P}\\to 0$: i gap spariscono e ritrovi il reticolo vuoto. Porta $\\htmlData{q=VG}{P}\\to 30$: le bande si schiacciano su $\\alpha a=n\\pi$ (buca infinita). Passa alle barriere rettangolari e alza $\\htmlData{q=a}{c}$ per vedere le bande stringersi sui livelli della buca isolata, oppure attiva Banda a coseno.'
        ]
      }
    ],
    foot: 'Dispensa Parte 3, §10 («Il modello di Kronig–Penney»).'
  }
} as const
