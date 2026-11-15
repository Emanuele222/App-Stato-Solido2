/**
 * Stringhe della sezione «Reticolo vuoto e schemi di zona», pronte per la traduzione.
 * Fonti: dispensa Parte 3 §9 e §11.6; Parte 4 §5.1.
 */
export const strings = {
  chapter: 'Teoria delle bande',
  title: 'Reticolo vuoto e schemi di zona',
  toolsLabel: 'Strumenti',
  asideLabel: 'Formula viva e scheda teoria',

  tools: {
    fill: 'Riempimento',
    fillTitle: 'Riempimento: elettroni per cella, livello di Fermi (senza gap è sempre un metallo)',
    mass: 'Massa efficace',
    massTitle: 'Sonda di massa efficace: m* = m₀ ovunque sulla parabola libera',
    compare: 'Confronto: quasi liberi',
    compareTitle:
      'Confronto con i quasi liberi (V_G = −2,2 eV, V_{2G} = −1,4 eV — valori indicativi, scelti per rendere visibili i gap)'
  },

  params: {
    a: 'Passo reticolare a'
  },

  schemes: {
    label: 'Schema',
    extended: 'Zona estesa',
    reduced: 'Zona ridotta',
    periodic: 'Zona periodica',
    extendedTitle: 'Una sola parabola libera su tutto l’asse k',
    reducedTitle: 'Ogni tratto ripiegato di −G nella prima zona (−π/a, π/a]',
    periodicTitle: 'La prima zona ripetuta con periodo G = 2π/a'
  },

  electrons: {
    label: 'elettroni per cella',
    decrease: 'Meno elettroni per cella',
    increase: 'Più elettroni per cella'
  },

  scene: {
    realTag: 'Spazio reale',
    realAria: 'Ioni del reticolo, parte reale dell’onda piana e densità uniforme',
    realHint: (kExt: string, kRed: string, n: number) =>
      `onda piana · k = ${kExt} π/a · k′ = ${kRed} π/a · n = ${n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0'}`,
    realNote: '$|\\psi|^2 = 1$ uniforme · sugli ioni vale sempre $e^{ik\'na}$',
    waveLabel: 'Re ψ',
    densityLabel: '|ψ|² = 1',
    ions: 'ioni (x = n·a)',
    bandsTag: 'Diagramma E(k)',
    bandsHint: 'clicca o trascina su un ramo per scegliere lo stato',
    bandsAria:
      'Diagramma E(k) del reticolo vuoto nei tre schemi di zona. Clic o trascinamento per scegliere lo stato; frecce sinistra e destra per muovere k, su e giù per cambiare ramo.',
    energyAxis: 'E (eV)',
    kAxis: 'k (Å⁻¹)',
    bandsLegend: 'reticolo vuoto (V = 0)',
    compareLegend: 'quasi liberi (valori indicativi: V_{G} = −2,2 eV, V_{2G} = −1,4 eV)',
    gapG: '2|V_{G}|',
    e0: 'E_{0}',
    probe: 'm* = m_{0}',
    metal: 'metallo'
  },

  formula: {
    title: 'Formula viva',
    aria: 'E di k primo uguale a h tagliato al quadrato per k primo più G al quadrato su due m zero, con G uguale a due pi greco n su a'
  },

  values: {
    zoneEdge: 'bordo di zona',
    reciprocalG: 'vettore reciproco',
    e0: 'energia al bordo',
    state: 'stato scelto',
    kExtended: 'esteso',
    kReduced: 'ridotto',
    branch: 'ramo',
    band: 'banda',
    crossings: 'incroci',
    crossEdge: 'al bordo (±π/a)',
    crossCenter: 'in k = 0',
    fermi: 'livello di Fermi',
    electrons: (n: number) => `${n} el./cella`,
    fermiTwoNote: '$E_F = E_0$ (assenza di gap)',
    mass: 'massa efficace',
    massFreeNote: 'sempre uguale a $m_0$ (parabola libera)',
    velocity: 'velocità di gruppo'
  },

  theory: {
    title: 'Scheda teoria',
    blocks: [
      {
        heading: 'Due nomi per lo stesso stato',
        // P3 §9.1
        paragraphs: [
          'In un reticolo di passo $\\htmlData{q=a}{a}$, spostare il vettore d’onda di un vettore reciproco $\\htmlData{q=a}{G}=2\\pi n/\\htmlData{q=a}{a}$ non cambia lo sfasamento da una cella alla successiva: $e^{i(\\htmlData{q=k}{k}+\\htmlData{q=a}{G})a}=e^{i\\htmlData{q=k}{k}a}$. Per il cristallo $\\htmlData{q=k}{k}$ e $\\htmlData{q=k}{k}+\\htmlData{q=a}{G}$ etichettano lo stesso stato, con periodicità $\\htmlData{q=E}{E}(\\htmlData{q=k}{k}+\\htmlData{q=a}{G})=\\htmlData{q=E}{E}(\\htmlData{q=k}{k})$.'
        ]
      },
      {
        heading: 'I tre schemi di zona',
        // P3 §9.3, P4 §5.1
        paragraphs: [
          "La parabola libera $\\htmlData{q=Ek}{E_k}=\\hbar^2\\htmlData{q=k}{k}^2/2m_0$ si disegna in tre modi equivalenti. Nella zona estesa sta su tutto l’asse $\\htmlData{q=k}{k}$; nella zona ridotta ogni tratto fuori da $(-\\pi/\\htmlData{q=a}{a},\\pi/\\htmlData{q=a}{a}]$ si ripiega di $-\\htmlData{q=a}{G}$ nella prima zona, dando i rami $\\htmlData{q=E}{E}=\\hbar^2(\\htmlData{q=k}{k'}+\\htmlData{q=a}{G})^2/2m_0$; nella zona periodica la prima zona è ripetuta con periodo $2\\pi/\\htmlData{q=a}{a}$."
        ]
      },
      {
        heading: 'Dove si aprono i gap',
        // P3 §9.3 «nessuna banda vera, ma i punti giusti»
        paragraphs: [
          'Finché $V=0$ il ripiegamento è solo un cambio di etichetta: non ci sono gap, il sistema è sempre un metallo e $m^*=m_0$ ovunque. Ma i rami si incrociano al bordo $\\pm\\pi/\\htmlData{q=a}{a}$ ($\\htmlData{q=Ek}{E_0}$, $9\\htmlData{q=Ek}{E_0}$) e al centro $\\htmlData{q=k}{k}=0$ ($4\\htmlData{q=Ek}{E_0}$): lì un potenziale periodico accoppia le onde degeneri e apre i gap.'
        ]
      },
      {
        heading: 'Cosa osservare',
        paragraphs: [
          "Passa da Zona estesa a Zona ridotta: ogni tratto della parabola trasla di $-\\htmlData{q=a}{G}$ nella prima zona. Cambia ramo $n$ a parità di $k'$: nello spazio reale $\\htmlData{q=psi}{\\operatorname{Re}\\psi}$ oscilla più in fretta, ma sui punti degli ioni $x=n\\cdot\\htmlData{q=a}{a}$ passa per gli stessi valori. Attiva Confronto per vedere i gap aprirsi agli incroci."
        ]
      }
    ],
    foot: 'Fonte: dispensa Parte 3, §§9 e 11.6; Parte 4, §5.1. La parabola libera si indica con $E_k$, l’energia libera al bordo con $E_0=\\hbar^2\\pi^2/2m_0a^2$.'
  }
} as const
