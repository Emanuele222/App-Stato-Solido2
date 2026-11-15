/**
 * Tutti i testi della sezione «Pseudopotenziale» (dispensa P4 §4 e §5.4).
 * Le formule inline nei testi usano $…$ con \htmlData{q=…} per il rendering KaTeX.
 */
export const strings = {
  chapter: 'Teoria delle bande',
  title: 'Pseudopotenziale',
  toolsLabel: 'Strumenti',
  asideLabel: 'Formula viva, valori vivi e scheda teoria',

  presets: {
    label: 'Materiale',
    free: 'Parametri liberi',
    item: (name: string, a: string, extra?: string) => `${name} (a = ${a} Å${extra ? `, ${extra}` : ''})`,
    note: 'Si, Ge e GaAs (P4 §4, §5.4): gli altri materiali non presenti in elenco non sono ancora calibrati con fattori completi coerenti.',
    geNote:
      'Ge: fattori locali di Cohen–Bergstresser (1966); con quelli della tabella P4 il modello locale dà il minimo in Γ.',
    geShortNote: 'Ge: fattori di Cohen–Bergstresser (1966), non della tabella P4',
    controlsHeading: 'Comandi e materiali'
  },

  antisymmetric: {
    label: 'Termine antisimmetrico Vᵃ (zincoblenda)',
    shortLabel: 'Termine Vᵃ (zincoblenda)',
    diamondHint: 'spento: cristallo simmetrico «tipo diamante» con gli stessi fattori Vˢ',
    basisNote:
      'Base fcc a 2 atomi: $\\boldsymbol{\\tau} = \\frac{a}{8}(1,1,1)$ (atomi diversi attivano $\\htmlData{q=V2G}{V^a}$).',
    activeValues: (v3a: string, v4a: string, v11a: string) =>
      `V₃ᵃ = ${v3a} · V₄ᵃ = ${v4a} · V₁₁ᵃ = ${v11a} Ry`
  },

  params: {
    group: 'Parametri',
    a: 'Passo reticolare cubico a',
    v3s: 'Fattore di forma simmetrico V₃ˢ',
    v8s: 'Fattore di forma simmetrico V₈ˢ',
    v11s: 'Fattore di forma simmetrico V₁₁ˢ',
    shellsNote:
      'Gusci in unità $(2\\pi/\\htmlData{q=a}{a})^2$: $|G|^2 = 3, 8, 11$ per $\\htmlData{q=VG}{V^s}$ ($V^s_4 = 0$ per struttura); $3, 4, 11$ per $\\htmlData{q=V2G}{V^a}$.'
  },

  tools: {
    fill: 'Riempimento',
    fillTitle:
      'Cristallo diamante/zincoblenda a 2 atomi per cella primitiva (8 elettroni di valenza fissi): riempiono le 4 bande di valenza, perciò non serve un selettore elettroni/cella e μ cade nel gap',
    mass: 'Massa efficace',
    massTitle: 'Parabola osculatrice direzionale lungo il tratto corrente e confronto per GaAs in Γ',
    compare: 'Confronto: reticolo vuoto fcc',
    compareTitle: 'Sovrappone le bande del reticolo vuoto fcc (V_ps = 0) allineate al fondo della valenza'
  },

  scene: {
    realTag: 'L’idea, nello spazio reale',
    realHint: 'curve indicative (P4 §4): r_c ≃ metà della lunghezza di legame · V(r) vs Vₚₛ(r) e ψ(r) vs ψᶠ(r)',
    realAria:
      'Confronto indicativo nello spazio reale tra potenziale coulombiano nudo e pseudopotenziale soft/hard core, e tra funzione d’onda vera oscillante e parte liscia.',
    realLegendAria: 'Legenda delle curve nello spazio reale',
    formLegendAria: 'Legenda del fattore di forma',
    bareIonLegend: 'ione nudo (∝ −1/r)',
    softCoreLegend: 'Vₚₛ soft core',
    hardCoreLegend: 'Vₚₛ hard core',
    truePsiLegend: 'valenza vera ψ',
    smoothPsiLegend: 'parte liscia ψᶠ',
    rcLabel: 'r_{c}',

    formTag: 'Fattore di forma v(q)',
    formHint: 'curva tratteggiata indicativa (Ashcroft + Thomas–Fermi, tipo Si) · i 3 punti sono parametri veri (trascinabili)',
    formAria:
      'Fattore di forma locale v(q): curva di modello da −2/3 E_F verso 0 e punti interattivi V_3^s, V_8^s, V_{11}^s trascinabili verticalmente.',
    formCurveLegend: 'Ashcroft + TF (indicativo)',
    formPointsLegend: 'parametri $V^s$ ($|G|^2 = 3, 8, 11$)',
    formVaLegend: 'riferimenti $V^a$ (zincoblenda)',
    v0Badge: 'v(0) = −⅔ E_{F}',

    bandsTag: 'Bande lungo L–Γ–X–W–K–Γ',
    bandsHint: 'clicca o trascina lungo una banda · frecce per spostarti',
    bandsAria:
      'Struttura a bande lungo L–Γ–X–W–K–Γ (zero alla cima della valenza). Frecce sinistra/destra per k, su/giù per cambiare banda.',
    refining: 'in affinamento…',
    bandsLegendAria: 'Legenda delle bande',
    valenceLegend: '4 bande di valenza',
    conductionLegend: 'conduzione',
    emptyLegend: 'reticolo vuoto fcc (Vₚₛ = 0)',
    directGap: 'gap diretto',
    indirectGap: 'gap indiretto',
    probeSuffix: 'm* lungo il tratto',
    chemicalPotential: 'μ',

    shellsTitle: 'Pesi in onde piane $|c_G|^2$ per guscio di $|G|^2$ nello stato scelto',
    shellsAria: 'Istogramma dei pesi |c_G|² raggruppati per guscio di |G|² nello stato scelto.'
  },

  formula: {
    title: 'Formula viva',
    pseudoTitle: 'Equazione di pseudo-Schrödinger e potenziale repulsivo V′',
    pseudoAria: 'Equazione di pseudo-Schrödinger con pseudopotenziale V_ps = V + V primo.',
    centralTitle: 'Equazione centrale sullo pseudopotenziale (G in 2π/a, τ = a/8 (1,1,1))',
    centralAria: 'Equazione centrale e fattore di struttura simmetrico e antisimmetrico.',
    factorsTitle: 'Fattori di forma e limite metallico q → 0 (passa sopra un termine)'
  },

  values: {
    aLabel: 'passo reticolare',
    planeWavesLabel: 'onde piane',
    refiningNote: 'calcolo ridotto (51 onde) → in affinamento a 113 onde…',
    formFactorsLabel: 'fattori Vˢ (Ry / eV)',
    antisymLabel: 'fattori Vᵃ (zincoblenda)',
    gapLabel: 'gap assoluto',
    gapIndicative: (measured: string, kind: string) =>
      `mis. ${measured} eV (${kind}); il modello locale dà gap indicativi`,
    gapGenericNote: 'modello locale empirico: la forma delle bande è fedele, il gap è indicativo',
    cbmPosLabel: 'minimo conduzione',
    ecPointsLabel: 'conduzione in Γ / X / L',
    valenceSpanLabel: 'fondo e larghezza valenza',
    selectedLabel: 'stato scelto',
    selectedBandValence: (n: number) => `valenza ${n}`,
    selectedBandConduction: (n: number) => `conduzione ${n}`,
    massToolLabel: 'massa efficace lungo il tratto',
    massDirection: (segment: string) => `derivata direzionale lungo ${segment}`,
    massGaAsCompare: (mCalc: string, mMeas: string, mKp: string) =>
      `GaAs in $\\Gamma$: calc. ${mCalc} m₀ · mis. ${mMeas} m₀ · stima $k\\cdot p$ $E_g/E_P = ${mKp}$ m₀`,
    fillNote:
      '8 elettroni per cella primitiva (cristallo a 2 atomi, valore fisso) riempiono esattamente le 4 bande di valenza ($E \\le 0$); il potenziale chimico $\\htmlData{q=EF}{\\mu}$ cade nel gap.',
    metalNoMuNote:
      'Gap chiuso (sistema metallico): il potenziale chimico $\\htmlData{q=EF}{\\mu}$ non cade in un gap e non è determinato con questa stima.',
    compareNote:
      'Confronto con il reticolo vuoto fcc ($V_{\\mathrm{ps}} = 0$) allineato al fondo della banda di valenza: in basso le bande seguono la parabola libera $\\htmlData{q=Ek}{E_k}$.',

    bareIonTitle: 'Confronto di scala sul silicio (esempio fisso: Si, a = 5,431 Å, Z = 14)',
    bareIonSub: 'stima P4 §4 (−0,211 Ry = −2,87 eV in $|G|^2 = 3$) contro fattori di forma locali $\\htmlData{q=VG}{V^s}$',
    bareIonRow: (g2: number) => `$|G|^2 = ${g2}$`,
    bareIonValue: (bare: string, pseudo?: string) =>
      pseudo ? `ione nudo ${bare} eV vs $\\htmlData{q=VG}{V^s} = ${pseudo}$ eV` : `ione nudo ${bare} eV`
  },

  theory: {
    title: 'Scheda teoria (P4 §4, §5.4)',
    sections: [
      {
        heading: 'Perché servono pseudopotenziali (e non poche onde piane sul potenziale vero)',
        body:
          'Vicino allo ione il potenziale vero $V(\\mathbf{r}) \\propto -Ze^2/r$ è profondo (nel Si $|V_G| \\approx 31\\text{ eV}$ per $|G|^2 = 3$, contro energie cinetiche di $\\sim 3{,}8\\text{ eV}$) e la funzione di valenza $\\htmlData{q=psi}{\\psi_{\\mathbf{k}}}$ deve essere ortogonale a tutti gli stati di core $\\psi_c$: per questo oscilla rapidamente dentro il core e richiederebbe migliaia di onde piane.'
      },
      {
        heading: 'Dalle OPW all’equazione di pseudo-Schrödinger',
        body:
          'Separando $\\htmlData{q=psi}{\\psi_{\\mathbf{k}}} = \\htmlData{q=psi}{\\psi^{\\mathrm f}_{\\mathbf{k}}} - \\sum_c \\langle \\psi_c|\\htmlData{q=psi}{\\psi^{\\mathrm f}_{\\mathbf{k}}}\\rangle \\psi_c$ e portando le oscillazioni di core nel potenziale efficace repulsivo $V\' = \\sum_c (\\htmlData{q=E}{E} - E_c)|\\psi_c\\rangle\\langle\\psi_c| > 0$, la parte liscia $\\htmlData{q=psi}{\\psi^{\\mathrm f}_{\\mathbf{k}}}$ obbedisce a $[\\hat p^2/2m_0 + \\htmlData{q=VG}{V_{\\mathrm{ps}}}]\\htmlData{q=psi}{\\psi^{\\mathrm f}_{\\mathbf{k}}} = \\htmlData{q=E}{E}(\\mathbf{k})\\htmlData{q=psi}{\\psi^{\\mathrm f}_{\\mathbf{k}}}$ con le stesse energie e uno pseudopotenziale debole $\\htmlData{q=VG}{V_{\\mathrm{ps}}} = V + V\'$.'
      },
      {
        heading: 'Aggancio ai quasi liberi e notazione (ψ_c vs quasi liberi)',
        body:
          'Si torna alla stessa equazione centrale dei quasi liberi (con $\\htmlData{q=VG}{V_{\\mathrm{ps}}}$ al posto di $V$), ma diagonalizzata su 113 onde piane ($|G|^2 \\le 21$) anziché trattata in perturbazione: appena 3 numeri ($\\htmlData{q=VG}{V_3^s}, \\htmlData{q=VG}{V_8^s}, \\htmlData{q=VG}{V_{11}^s}$) danno le bande del Si e 6 (inclusi $\\htmlData{q=V2G}{V^a}$) danno il GaAs. Attenzione alla notazione: qui $\\psi_c$ indica gli «stati di core» (con energia $E_c$), non l’onda stazionaria $\\cos(\\pi x/a)$ della sezione quasi liberi.'
      }
    ]
  }
} as const
