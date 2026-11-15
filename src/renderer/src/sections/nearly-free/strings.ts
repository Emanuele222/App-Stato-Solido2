/**
 * Stringhe della sezione «Elettroni quasi liberi», pronte per la traduzione.
 * Le formule stanno fra $…$ (KaTeX); \htmlData{q=…} colora un simbolo con il
 * colore della sua grandezza e lo collega alla scena.
 * Contenuti dalla dispensa Parte 3, §11 (riferimenti accanto a ogni blocco).
 */
export const strings = {
  chapter: 'Teoria delle bande',
  title: 'Elettroni quasi liberi',
  toolsLabel: 'Strumenti',
  asideLabel: 'Formula viva e scheda teoria',

  tools: {
    fill: 'Riempimento',
    fillTitle: 'Riempimento: elettroni per cella, livello di Fermi, metallo o isolante',
    mass: 'Massa efficace',
    massTitle: 'Sonda di massa efficace: parabola osculatrice nello stato scelto',
    compare: 'Confronto: reticolo vuoto',
    compareTitle: 'Confronto con il reticolo vuoto (V = 0, parabole libere ripiegate)'
  },

  params: {
    a: 'Passo reticolare a',
    vG: 'Componente di Fourier V_G del potenziale (con segno)',
    v2G: 'Componente di Fourier V_2G del potenziale (con segno)'
  },
  electrons: {
    label: 'elettroni per cella',
    decrease: 'Meno elettroni per cella',
    increase: 'Più elettroni per cella'
  },
  presets: {
    label: 'Materiale',
    free: 'Parametri liberi',
    note: 'Indicativi: in 1D si usano solo il passo e il gap reali, con $V_G=-E_g/2$.',
    item: (name: string, a: string, gap: string) => `${name} · ${a} Å · ${gap} eV`
  },

  scene: {
    realTag: 'Spazio reale',
    bandsTag: 'Diagramma E(k)',
    bandsHint: 'clicca o trascina su una banda per scegliere lo stato',
    realAria: 'Potenziale periodico, ioni e densità di probabilità dello stato scelto',
    bandsAria:
      'Diagramma a bande E(k) nella prima zona. Clic o trascinamento per scegliere lo stato; frecce sinistra e destra per muoverlo in k, su e giù per cambiare banda.',
    ions: 'ioni (x = n·a)',
    density: '|ψ|²',
    potential: 'V(x)',
    energyAxis: 'E (eV)',
    kAxis: 'k (Å⁻¹)',
    bandsLegend: 'bande E(k)',
    compareLegend: 'reticolo vuoto (V = 0)',
    gapG: '2|V_{G}|',
    gap2G: '2|V_{2G}|',
    gapGeneric: 'E_{g}',
    e0: 'E_{0}',
    probe: 'm*',
    stateHint: (k: string, band: number) => `stato scelto: k = ${k} π/a · banda ${band}`,
    noteCos: '$\\htmlData{q=psi}{\\psi_c}$: carica sugli ioni',
    noteSin: '$\\htmlData{q=psi}{\\psi_s}$: carica fra gli ioni',
    noteDegenerate: '$V_G=0$: stati degeneri al bordo',
    insulator: 'isolante',
    metal: 'metallo'
  },

  formula: {
    title: 'Formula viva',
    aria: 'E più o meno di k uguale a un mezzo di E k più E k primo, più o meno la radice di un quarto di E k primo meno E k al quadrato più V G al quadrato'
  },

  values: {
    e0: 'energia al bordo',
    gapEdge: 'gap in ±π/a',
    gapCenter: 'gap in k = 0',
    twoWaveFormula: 'formula a due onde',
    computedExact: (pw: number) => `calcolo completo (${pw} onde piane):`,
    secondOrderNotVisible: 'secondo ordine, non visibile a questa scala',
    secondOrderInsulatorNote: 'il gap del secondo ordine in $k=0$ ($\\simeq V_G^2/2E_0$) è molto piccolo e non visibile a questa scala',
    state: 'stato scelto',
    planeWaveWeights: 'onde piane dominanti',
    band: 'banda',
    standing: 'al bordo',
    standingCos: '$\\htmlData{q=psi}{\\psi_c}$, carica sugli ioni',
    standingSin: '$\\htmlData{q=psi}{\\psi_s}$, carica fra gli ioni',
    standingDegenerate: 'degenere ($V_G=0$)',
    fermi: 'livello di Fermi',
    electrons: (n: number) => `${n} el./cella`,
    mass: 'massa efficace',
    massNegative: 'negativa: cima di banda (lacuna con $m_h=-m^*$)',
    velocity: 'velocità di gruppo',
    strong: (ratio: string) =>
      `potenziale non debole, $|V_G|/E_0$ = ${ratio}: il modello vale per $|V_G|\\ll E_0$ e il gap vero si scosta da $2|V_G|$`
  },

  theory: {
    title: 'Scheda teoria',
    blocks: [
      {
        heading: 'L’idea',
        // P3 §11.1 (modello) e §11.2–11.4 (equazione centrale e approssimazione perturbativa)
        paragraphs: [
          'Il potenziale periodico $V(x)=\\sum_G \\htmlData{q=VG}{V_G}\\,e^{iGx}$ accoppia le onde piane $e^{i(\\htmlData{q=k}{k}+G)x}$ tramite l’equazione centrale $\\bigl(\\htmlData{q=Ek}{E_{k+G}}-\\htmlData{q=E}{E}\\bigr)\\htmlData{q=psi}{c_{k+G}} + \\sum_{G\'} \\htmlData{q=VG}{V_{G-G\'}}\\,\\htmlData{q=psi}{c_{k+G\'}} = 0$.',
          'Lontano dai bordi di zona la correzione perturbativa $\\htmlData{q=psi}{c_{k-nG}} \\simeq \\htmlData{q=VG}{V_{nG}}/(\\htmlData{q=Ek}{E_k}-\\htmlData{q=Ek}{E_{k-nG}})$ è trascurabile e l’elettrone resta quasi libero, $\\htmlData{q=E}{E(k)}\\simeq \\htmlData{q=Ek}{E_k}=\\hbar^2k^2/2m_0$. Solo dove due onde piane hanno la stessa energia cinetica il denominatore si annulla e il potenziale le mescola davvero: al bordo di zona, $k=\\pm\\pi/\\htmlData{q=a}{a}$.'
        ]
      },
      {
        heading: 'Perché si apre il gap',
        // P3 §11.4 «Il gap dal calcolo» e §11.5 «Dove sta la carica»
        paragraphs: [
          'Al bordo le due onde si combinano in onde stazionarie: $\\htmlData{q=psi}{\\psi_c}\\propto\\cos(\\pi x/a)$ ha la carica sugli ioni, $\\htmlData{q=psi}{\\psi_s}\\propto\\sin(\\pi x/a)$ fra gli ioni. L’energia cinetica è $\\htmlData{q=Ek}{E_0}$ per entrambe, ma il potenziale medio vale $\\langle V\\rangle=\\pm \\htmlData{q=VG}{V_G}$: le energie si separano in $\\htmlData{q=E}{E_\\pm}=\\htmlData{q=Ek}{E_0}\\pm|\\htmlData{q=VG}{V_G}|$, con gap $E_g=2|\\htmlData{q=VG}{V_G}|$.',
          'Per ioni attrattivi ($\\htmlData{q=VG}{V_G}<0$) la banda inferiore è $\\htmlData{q=psi}{\\psi_c}$; cambiando segno a $\\htmlData{q=VG}{V_G}$ le due onde si scambiano. In $k=\\pm 2\\pi/a\\equiv 0$ si apre il secondo gap, $2|\\htmlData{q=V2G}{V_{2G}}|$.'
        ]
      },
      {
        heading: 'Vicino al bordo',
        // P3 §11.5, eq. parab e riquadro «Bande e massa efficace»
        paragraphs: [
          'Le bande arrivano al bordo con tangente orizzontale ($v=0$) e curvature opposte: $m_0/\\htmlData{q=mstar}{m^*_\\pm}=1\\pm 2\\htmlData{q=Ek}{E_0}/|\\htmlData{q=VG}{V_G}|$. Gap piccolo, massa efficace piccola; negativa in cima alla banda inferiore.'
        ]
      },
      {
        heading: 'Cosa osservare',
        paragraphs: [
          'Scegli lo stato in $k=\\pi/a$ sulla banda inferiore e poi su quella superiore: guarda dove si accumula $\\htmlData{q=psi}{|\\psi|^2}$ rispetto agli ioni. Porta $\\htmlData{q=VG}{V_G}$ da negativo a positivo: il gap si chiude in zero e si riapre con le onde scambiate. Allarga $\\htmlData{q=a}{a}$: i bordi $\\pm\\pi/a$ si avvicinano e $\\htmlData{q=Ek}{E_0}$ scende.'
        ]
      }
    ],
    foot: 'Fonte: dispensa Parte 3, §11. Nota oltre il modello a due onde: con $V_G$ grande anche in $k=0$ compare un piccolo gap al secondo ordine, $\\simeq V_G^2/2E_0$. I preset dei materiali sono indicativi: in un modello 1D si usano solo il passo reticolare e il gap reali.'
  }
} as const
