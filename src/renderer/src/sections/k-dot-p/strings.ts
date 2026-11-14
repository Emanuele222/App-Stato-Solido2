/**
 * Tutti i testi della sezione «Metodo k·p» (dispensa P4 §3).
 * Le formule inline nei testi usano $…$ con \htmlData{q=…} per il rendering KaTeX.
 */
import type { KpKaneBandRole, KpTwoBandRole, MassTermSource } from '../../physics'

export const strings = {
  chapter: 'Teoria delle bande',
  title: 'Metodo k·p',
  toolsLabel: 'Strumenti',
  asideLabel: 'Formula viva, valori vivi e scheda teoria',

  variants: {
    label: 'Modello',
    kane: 'Quattro bande (Kane)',
    twoBand: 'Due bande, esatto',
    kaneTitle: 'Modello di Kane a quattro bande con spin–orbita in Γ (P4 §3, slide 41)',
    twoBandTitle: 'Modello esatto 2×2 senza spin–orbita tra |S⟩ e |Z⟩ più valenze non accoppiate'
  },

  params: {
    group: 'Parametri',
    eg: 'Gap diretto in Γ, E_g',
    delta: 'Separazione spin–orbita in Γ, Δ',
    ep: 'Energia caratteristica di Kane, E_P'
  },

  presets: {
    label: 'Materiale',
    free: 'Parametri liberi',
    item: (name: string, eg: string, delta: string, ep: string) =>
      `${name} (${eg} · ${delta} · ${ep} eV)`,
    note: 'Dati da P4 §3 (E_P = 20 eV; il Si manca perché la dispensa non dà il suo gap in Γ)'
  },

  tools: {
    fill: 'Riempimento',
    fillTitle: 'Semiconduttore intrinseco a T = 0: bande di valenza piene, conduzione vuota, E_F nel gap',
    mass: 'Massa efficace',
    massTitle: 'Parabola osculatrice sullo stato scelto e confronto con le masse della formula k·p',
    compareKane: 'Confronto: elettrone libero',
    compareTwoBand: 'Confronto: parabole m*',
    compareKaneTitle: 'Sovrappone la parabola dell’elettrone libero dal fondo della conduzione E_g + ħ²k²/2m₀',
    compareTwoBandTitle: 'Sovrappone le parabole di massa efficace E_g + ħ²k²/2m₀ ± P²k²/E_g'
  },

  scene: {
    levelsTag: 'Livelli in Γ',
    levelsHint: (roleLabel: string, deltaVal: string) =>
      `senza H_so → con H_so (Δ = ${deltaVal} eV) · banda selezionata: ${roleLabel}`,
    levelsHintTwoBand: (roleLabel: string) =>
      `senza spin–orbita · |S⟩ accoppiato con |Z⟩, valenze |X⟩,|Y⟩ libere · selezionata: ${roleLabel}`,
    levelsAria:
      'Livelli energetici in Γ prima e dopo l’accoppiamento spin–orbita, con carattere s/p, momento angolare totale J, m_J e numero di stati.',
    withoutSoTitle: 'senza spin–orbita',
    withSoTitle: 'con spin–orbita',
    twoBandRightTitle: 'base |S⟩, |X⟩, |Y⟩, |Z⟩',

    contribTag: 'Contributi a m₀/m*',
    contribHint: 'somma 1 + contributi delle bande accoppiate (segno della curvatura d²E/dk²)',
    contribAria: 'Scomposizione grafica a barra di m₀/m* nel termine libero ±1 e nei contributi delle bande accoppiate.',
    contribNoCoupling: 'nessun contributo di accoppiamento (valenze pesanti non accoppiate a s)',
    contribAtK: (kStr: string, factorStr: string) =>
      `in $k = ${kStr}$ Å⁻¹: fattore non parabolico $(1 + 4P^2k^2/E_g^2)^{-3/2} = ${factorStr}$`,
    contribSource: (src: MassTermSource, kittelFlip: boolean): string => {
      switch (src) {
        case 'free':
          return kittelFlip ? '−1 libero (slide 41)' : '+1 elettrone libero'
        case 'c':
          return 'da conduzione c'
        case 'lh':
          return 'da lacune leggere lh'
        case 'so':
          return 'da split-off so'
        case 'hh':
          return 'da hh (0)'
      }
    },

    bandsTag: 'Diagramma E(k) vicino a Γ',
    bandsHint: 'modello valido solo vicino a Γ · clicca, trascina o usa le frecce',
    bandsHintTwoBand: 'modello valido solo vicino a Γ · fascia |P·k| < E_g/2 (criterio indicativo)',
    bandsAria:
      'Diagramma E(k) vicino a Γ. Clic o trascinamento per scegliere k e banda; frecce sinistra/destra per k, su/giù per cambiare banda.',
    energyAxis: 'E (eV)',
    kAxis: 'k (Å⁻¹)',
    validZoneBadge: '|P·k| < E_g/2 (indicativo)',
    nearGammaBadge: 'vicino a Γ',
    fillingLabel: 'semicond. intrinseco (T = 0)',
    probeLabel: 'm*',
    legendKaneBands: 'Kane (c, hh, lh, so)',
    legendTwoBandBands: 'Due bande esatto (E±, hh)',
    legendCompareKane: 'libero E_g + ħ²k²/2m₀',
    legendCompareTwoBand: 'parabole m* in Γ',
    bandShort: (r: KpKaneBandRole | KpTwoBandRole): string => {
      if (r === 'c') return 'conduzione c'
      if (r === 'hh') return 'lacune pesanti hh'
      if (r === 'lh') return 'lacune leggere lh'
      return 'split-off so'
    }
  },

  formula: {
    title: 'Formula viva',
    generalTitle: 'Perturbazione al 2° ordine',
    kaneTitle: 'Bande e masse di Kane (slide 41)',
    twoBandTitle: 'Matrice 2×2 ed esattezza locale',
    generalAria: 'Energia al secondo ordine E_n(k) e formula della massa efficace k·p',
    kaneAria: 'Bande c, hh, lh, so e formule di Kane per le masse efficaci',
    twoBandAria: 'Matrice 2 per 2 del modello a due bande, autovalori esatti e sviluppo parabolico'
  },

  values: {
    eg: 'gap in $\\Gamma$',
    delta: 'spin–orbita',
    ep: 'energia di Kane',
    pKane: '$P$ di Kane',
    pKaneNote: 'diverso dal $P$ di Kronig–Penney',
    massesTitle: 'masse in unità di $m_0$',
    calcPrefix: 'calc.',
    measPrefix: 'mis.',
    massC: 'conduzione $m_c/m_0$',
    massHH: 'lacune pesanti $m_{hh}/m_0$',
    massLH: 'lacune leggere $m_{lh}/m_0$',
    massSO: 'split-off $m_{so}/m_0$',
    hhOrderNote: 'ordine di grandezza (slide 41)',
    geNoGammaMassNote: 'non in tab. §3 ($m_c$ in $\\Gamma$ e $m_{so}$ assenti)',
    selectedState: 'stato scelto',
    energyAtSel: 'energia',
    localMass: 'massa locale',
    analyticMass: 'massa formula',
    validityRatio: 'criterio $|P\\cdot k|/(E_g/2)$',
    validityInside: 'entro zona parabolica ($< 1$)',
    validityOutside: 'oltre $E_g/2$: distacco visibile',
    fillingBox:
      'Semiconduttore intrinseco a $T = 0$: le bande di valenza ($hh, lh, so$) sono piene e la conduzione ($c$) è vuota; $\\htmlData{q=EF}{E_F}$ cade nel gap senza un conteggio di elettroni per cella.',
    compareNoteKane:
      'Confronto (grigio tratteggiato): parabola dell’elettrone libero $\\htmlData{q=Ek}{E_g + \\hbar^2 k^2 / 2m_0}$. La banda $c$ reale sale molto più in fretta perché $m_c \\ll m_0$.',
    compareNoteTwoBand:
      'Confronto (grigio tratteggiato): parabole di massa efficace in $\\Gamma$. Fuori dalla fascia indicativa $|P\\cdot k| < E_g/2$ le curve esatte si appiattiscono verso l’andamento lineare.'
  },

  verification: {
    title: 'Verifica sui quasi liberi (P4 §3)',
    subtitle: 'Bordo $\\pi/a$, $a = 3{,}00$ Å, $V_G = -0{,}50$ eV ($41$ onde piane)',
    exactLabel: 'curvatura numerica $m_0/m^*_+$',
    sumLabel: 'somma $\\mathbf{k}\\cdot\\mathbf{p}$ su $41$ bande',
    twoBandLabel: 'due bande $1 + 4E_0/E_g$',
    minusLabel: 'banda inferiore $E_-$ (somma / 2 bande)',
    momentumLabel: 'elemento $|\\langle \\psi_c | \\hat p | \\psi_s \\rangle|/\\hbar$ vs $\\pi/a$'
  },

  theory: {
    title: 'Scheda teoria',
    blocks: [
      {
        heading: 'A che cosa serve il metodo k·p',
        paragraphs: [
          'Inserendo la forma di Bloch $\\psi_{n\\mathbf{k}} = e^{i\\mathbf{k}\\cdot\\mathbf{r}} u_{n\\mathbf{k}}$ nell’equazione di Schrödinger si ottiene per $u_{n\\mathbf{k}}$ la perturbazione $\\htmlData{q=k}{H\'_{\\mathbf{k}}} = \\frac{\\hbar\\htmlData{q=k}{\\mathbf{k}}\\cdot\\hat{\\mathbf{p}}}{m_0} + \\frac{\\hbar^2\\htmlData{q=k}{k}^2}{2m_0}$ attorno a $\\Gamma$. Non serve conoscere tutto $V(\\mathbf{r})$: bastano pochi parametri in $\\Gamma$ ($\\htmlData{q=VG}{E_g}$, $\\htmlData{q=psi}{\\Delta}$, $\\htmlData{q=v}{P}$) per calcolare masse efficaci accurate e bande locali vicino ai punti di simmetria.'
        ]
      },
      {
        heading: 'Contributi a 1/m* e il parametro P di Kane',
        paragraphs: [
          'Al secondo ordine, una banda vicina sopra $n$ dà un contributo negativo a $1/\\htmlData{q=mstar}{m^*}$ (tende a curvare $n$ verso il basso) e una banda sotto un contributo positivo (la rende più leggera verso l’alto). Con $\\htmlData{q=v}{E_P} = 2m_0\\htmlData{q=v}{P}^2/\\hbar^2 \\approx 20\\text{ eV}$, quasi uguale nei semiconduttori III–V, si ottiene $m_c \\simeq m_0 \\htmlData{q=VG}{E_g}/\\htmlData{q=v}{E_P}$: gap piccolo, massa piccola (da GaAs a InSb).',
          'Nota di notazione: questo $\\htmlData{q=v}{P}$ è il parametro ottico di Kane (in $\\text{eV}\\cdot\\text{Å}$, legato a $|\\langle S|\\hat p_x|X\\rangle|$), da non confondere con il parametro adimensionale $P$ del modello di Kronig–Penney.'
        ]
      },
      {
        heading: 'Spin–orbita e avvertenze sui segni',
        paragraphs: [
          'Alla cima della valenza ($p$, $L=1$, $6$ stati) lo spin–orbita $H_{\\mathrm{so}} = \\lambda\\mathbf{L}\\cdot\\mathbf{S}$ separa il quadrupletto $J=\\frac{3}{2}$ ($hh$ con $m_J=\\pm\\frac{3}{2}$, $lh$ con $m_J=\\pm\\frac{1}{2}$, spostati di $+\\frac{1}{2}\\lambda\\hbar^2$) dal doppietto split-off $J=\\frac{1}{2}$ ($so$, più in basso di $\\htmlData{q=psi}{\\Delta} = \\frac{3}{2}\\lambda\\hbar^2$, spostato di $-\\lambda\\hbar^2$), lasciando invariato il baricentro; la conduzione $s$ ($L=0$) non si separa. Le lacune pesanti $hh$ non si accoppiano alla conduzione.',
          'Due note dalle dispense (slide 41 e approfondimento 2×2): nelle formule di Kane dal Kittel le tre bande di valenza portano il termine libero $-\\hbar^2 k^2/2m_0$ (con $m_{hh}=m_0$ solo come ordine di grandezza rispetto ai valori misurati $0{,}3$–$0{,}5\\,m_0$) e $E_{lh}$ ha il segno meno davanti a entrambi i termini; nel modello esatto a due bande le valenze non accoppiate hanno invece $+\\hbar^2 k^2/2m_0$ e la parabola vale solo finché $|\\htmlData{q=v}{P}\\cdot\\htmlData{q=k}{k}| \\ll \\htmlData{q=VG}{E_g}$.'
        ]
      }
    ],
    foot: 'Fonte: dispensa Parte 4, §3 («Il metodo k·p»); formulario «Metodo k·p» e P3 §13.3.'
  }
} as const
