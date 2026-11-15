/**
 * Tutti i testi della sezione «Legami forti» (dispense P3 §12, P4 §§1.4–2).
 * Le formule nel testo usano $…$ con \htmlData{q=…} per il rendering KaTeX coerente
 * con le altre sezioni.
 */
import type { BondingCharacter } from '../../physics'

export const strings = {
  chapter: 'Teoria delle bande',
  title: 'Legami forti',
  toolsLabel: 'Strumenti',
  asideLabel: 'Formula viva e scheda teoria',
  variants: {
    label: 'Catena',
    monoatomic: 'Monoatomica (s, p)',
    diatomic: 'Biatomica A–B',
    monoatomicTitle: 'Catena monoatomica con bande indipendenti s e p (P3 §12.3, P4 §1.4)',
    diatomicTitle: 'Catena biatomica A–B con due bande e gap in ±π/a (P4 §2)'
  },
  params: {
    group: 'Parametri',
    monoatomic: {
      a: 'Passo reticolare a',
      centerS: 'Centro della banda s, E_s bar',
      centerP: 'Centro della banda p, E_p bar',
      tS: 'Integrale di sovrapposizione s, t_s',
      absTP: 'Modulo di sovrapposizione p, |t_p| (con t_p < 0)'
    },
    diatomic: {
      a: 'Passo della cella A–B, a (distanza A–B = a/2)',
      eA: 'Livello atomico A, E_A',
      eB: 'Livello atomico B, E_B (≥ E_A)',
      t: 'Integrale di sovrapposizione A–B, t'
    },
    linkDistance: {
      toggle: 'Avvicina gli atomi',
      title: 'Lega t_s e |t_p| al passo reticolare a con una legge esponenziale indicativa',
      badge: '$t(a) = t(a_0)\\,e^{-(a-a_0)/\\ell}$ ($a_0 = 3\\text{ Å}$, $\\ell = 0{,}8\\text{ Å}$) — modello indicativo',
      linkedNote: (tSStr: string, tPStr: string) => `$\\htmlData{q=t}{t_s}(a) = ${tSStr}$ eV · $\\htmlData{q=t}{t_p}(a) = -${tPStr}$ eV`
    }
  },
  tools: {
    fill: 'Riempimento',
    fillTitle: 'Riempie le bande con elettroni per atomo (monoatomica) o per cella (biatomica)',
    mass: 'Massa efficace',
    massTitle: 'Parabola osculatrice e massa efficace sullo stato scelto; confronto con le formule analitiche ai bordi',
    compare: 'Confronto: quasi liberi',
    compareTitle: 'Sovrappone le bande degli elettroni quasi liberi (V_G = −0,5 eV, stesso a), con il fondo della banda più bassa allineato',
    electronsMono: 'elettroni per atomo',
    electronsDiatomic: 'elettroni per cella A–B',
    electronsDecrease: 'Diminuisci elettroni',
    electronsIncrease: 'Aumenta elettroni'
  },
  scene: {
    realTag: 'Spazio reale',
    realAria: 'Catena unidimensionale di atomi con i lobi degli orbitali, parte reale di psi_k e densità |psi_k|^2',
    realHintMono: (bandTex: string, charLabel: string) =>
      `banda ${bandTex} · ${charLabel} · lobi: chiaro $+$, scuro $-$ · forma indicativa`,
    realHintDiatomic: (bandTex: string, charLabel: string, bA2: string, bB2: string) =>
      `banda ${bandTex} · ${charLabel} · $|\\htmlData{q=psi}{b_A}|^2=${bA2}$ · $|\\htmlData{q=psi}{b_B}|^2=${bB2}$ · forma indicativa`,
    indicativeModelDiagram: 'bordi vs a (modello indicativo)',
    bandsTag: 'Diagramma E(k)',
    bandsHint: 'clicca o trascina su una banda per scegliere lo stato',
    bandsAria: 'Diagramma E(k) del modello a legami forti. Clic o trascinamento per scegliere lo stato, frecce per spostarlo.',
    energyAxis: 'E (eV)',
    kAxis: 'k (Å⁻¹)',
    bandsLegend: 'legami forti',
    compareLegend: 'quasi liberi (V_G = −0,5 eV)',
    compareHint: 'confronto quasi liberi allineato al fondo',
    compareNote:
      'Confronto quasi liberi ($\\htmlData{q=VG}{V_G} = -0{,}5$ eV): il fondo della prima banda è allineato al minimo di $\\htmlData{q=E}{E_s}$ o $\\htmlData{q=E}{E_-}$ perché nei legami forti lo zero di energia è arbitrario.',
    insulator: 'isolante / semicond.',
    metal: 'metallo',
    probe: 'm*',
    character: (c: BondingCharacter): string =>
      c === 'bonding' ? 'legante' : c === 'antibonding' ? 'antilegante' : 'misto (tra i nodi)'
  },
  formula: {
    title: 'Formula viva',
    generalAria: 'Formula generale E di k uguale E_n bar meno somma su R di t di R per e^{ikR}',
    monoAria: 'Bande monoatomiche s e p a coseno',
    diatomicAria: 'Bande della catena biatomica A–B'
  },
  values: {
    a: 'passo reticolare',
    bandS: 'banda $s$',
    bandP: 'banda $p$',
    levelsAB: 'livelli atomici',
    bandsDiat: 'bande $E_-, E_+$',
    approxNote: 'stima $t \\ll E_B - E_A$',
    gapPi: 'gap in $\\pm\\pi/a$',
    overlapNotice: 'bande sovrapposte',
    closedGapNotice: 'gap chiuso ($E_A = E_B$)',
    centerSep: 'distanza in $k = 0$',
    selection: 'stato scelto',
    stateBandMono: (b: 0 | 1) => (b === 0 ? 'banda $s$' : 'banda $p$'),
    stateBandDiat: (b: 0 | 1) => (b === 0 ? 'valenza $E_-$' : 'conduzione $E_+$'),
    massProbe: 'massa efficace',
    massCompareMonoS: 'analitica banda $s$',
    massCompareMonoP: 'analitica banda $p$',
    massCompareDiat: 'analitica al gap',
    fermi: 'livello di Fermi',
    solidKind: 'carattere a $T = 0$'
  },
  theory: {
    title: 'Scheda teoria',
    blocks: [
      {
        heading: 'Da atomi isolati a bande cristalline',
        paragraphs: [
          'Nel modello a legami forti gli elettroni restano quasi localizzati intorno ai nuclei (orbitali atomici $\\varphi_n$); l’integrale di sovrapposizione $\\htmlData{q=t}{t}(R)$ fra primi vicini mescola gli orbitali con la fase di Bloch $e^{i\\htmlData{q=k}{k}R}$, allargando ogni livello $\\htmlData{q=Ek}{\\bar{E}_n}$ in una banda di larghezza $\\htmlData{q=t}{W} = 4|\\htmlData{q=t}{t}|$.',
          'Quando si avvicinano gli atomi riducendo il passo $\\htmlData{q=a}{a}$, la sovrapposizione cresce esponenzialmente e le bande si allargano fino a poter sovrapporsi in $\\htmlData{q=a}{\\pi/a}$ (gap negativo, metallo anche con 2 elettroni per atomo).'
        ]
      },
      {
        heading: 'Legante, antilegante e catena biatomica',
        paragraphs: [
          'Il segno di $\\htmlData{q=t}{t}$ fissa la curvatura: per l’orbitale $s$ (simmetrico, $\\htmlData{q=t}{t_s} > 0$) la combinazione in fase in $\\htmlData{q=k}{k} = 0$ è legante (minimo), mentre quella a segni alterni in $\\pm\\pi/\\htmlData{q=a}{a}$ è antilegante (massimo). Per l’orbitale $p$ lungo la catena ($\\htmlData{q=t}{t_p} < 0$) i ruoli si invertono: legante al bordo $\\pm\\pi/\\htmlData{q=a}{a}$ e antilegante in $k = 0$.',
          'Con due atomi diversi nella cella ($\\htmlData{q=Ek}{E_A} < \\htmlData{q=Ek}{E_B}$, distanti $\\htmlData{q=a}{a}/2$) l’accoppiamento contiene $\\cos(\\htmlData{q=k}{k}\\htmlData{q=a}{a}/2)$ e apre un gap $\\htmlData{q=VG}{E_g} = \\htmlData{q=Ek}{E_B} - \\htmlData{q=Ek}{E_A}$ in $\\pm\\pi/\\htmlData{q=a}{a}$: con 2 elettroni per cella si ha un semiconduttore 1D, mentre per $E_A = E_B$ il gap si chiude e si ritrova la catena monoatomica di passo $a/2$ ripiegata in $[-\\pi/a, \\pi/a]$.'
        ]
      },
      {
        heading: 'Legame con Kronig–Penney e quasi liberi',
        paragraphs: [
          'È il limite opposto a quello degli elettroni quasi liberi, ma il quadro coincide: per buche profonde il modello di Kronig–Penney riproduce proprio la banda a coseno $E(k) \\simeq \\bar{E} \\mp 2\\htmlData{q=t}{t}\\cos ka$, e al bordo di zona la combinazione simmetrica $\\htmlData{q=psi}{\\psi_c}$ corrisponde allo stato $s$ mentre l’antisimmetrica $\\htmlData{q=psi}{\\psi_s}$ corrisponde allo stato $p$.'
        ]
      }
    ],
    foot: 'Fonti: dispensa Parte 3 §12 e Parte 4 §§1.4–2.'
  }
} as const
