/**
 * Tutti i testi della sezione «Bande dei materiali veri» (dispensa P4 §5).
 */
export const strings = {
  chapter: 'Teoria delle bande',
  title: 'Bande dei materiali veri',
  toolsLabel: 'Strumenti',
  asideLabel: 'Formula viva, valori vivi e scheda teoria',
  backToPseudo: '← Da dove viene Vₚₛ',

  presets: {
    label: 'Materiale',
    free: 'Parametri liberi',
    item: (name: string, a: string, extra?: string) => `${name} (a = ${a} Å${extra ? `, ${extra}` : ''})`,
    note: 'Al (reticolo vuoto fcc), Si, Ge e GaAs (P4 §5): gli altri composti non sono ancora calibrati con fattori completi.',
    geNote:
      'Ge: fattori locali di Cohen–Bergstresser (1966); con quelli della tabella P4 il modello locale dà il minimo in Γ.',
    geShortNote: 'Ge: fattori di Cohen–Bergstresser (1966), non della tabella P4',
    alLockedNote:
      'Alluminio: reticolo vuoto fcc (V_ps = 0); la dispensa non dà i fattori di forma (le bande vere hanno piccoli gap, ~1,5 eV in X, dove qui le curve si incrociano).',
    alShortNote: 'Al: reticolo vuoto (Vₚₛ = 0, cursori bloccati)',
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
    alElectronsLabel: 'Elettroni/cella (Al)',
    alElectronsOption: (n: number) => `${n} e⁻/cella`,
    shellsNote:
      'Gusci in unità $(2\\pi/\\htmlData{q=a}{a})^2$: $|G|^2 = 3, 8, 11$ per $\\htmlData{q=VG}{V^s}$ ($V^s_4 = 0$ per struttura); $3, 4, 11$ per $\\htmlData{q=V2G}{V^a}$.'
  },

  tools: {
    fill: 'Riempimento',
    fillTitle:
      'Mostra il livello di Fermi E_F (Al: 3 o 1 elettrone/cella) o il potenziale chimico μ nel gap (Si, Ge, GaAs: 8 e⁻/cella)',
    mass: 'Massa efficace',
    massTitle: 'Parabola osculatrice direzionale lungo il tratto corrente e confronto per GaAs in Γ',
    compare: 'Confronto: reticolo vuoto fcc',
    compareTitle: 'Sovrappone le bande del reticolo vuoto fcc (V_ps = 0) allineate al fondo della banda'
  },

  scene: {
    formTag: 'Fattore di forma v(q)',
    formHint: 'curva tratteggiata indicativa (Ashcroft + TF) · i 3 punti sono parametri veri (trascinabili per Si/Ge/GaAs)',
    formAria:
      'Fattore di forma locale v(q): curva di modello da −2/3 E_F verso 0 e punti interattivi V_3^s, V_8^s, V_{11}^s.',
    formCurveLegend: 'Ashcroft + TF (indicativo)',
    formPointsLegend: 'parametri $V^s$ ($|G|^2 = 3, 8, 11$)',
    formVaLegend: 'riferimenti $V^a$ (zincoblenda)',
    v0Badge: 'v(0) = −⅔ E_{F}',
    formLegendAria: 'Legenda del fattore di forma',

    shellsTag: 'Pesi in onde piane per guscio',
    shellsHint: 'contributi ∑|c_G|² raggruppati per |G|² nello stato selezionato',
    shellsTitle: 'Pesi $|c_G|^2$ per guscio di $|G|^2$ nello stato scelto',
    shellsAria: 'Istogramma dei pesi |c_G|² raggruppati per guscio di |G|² nello stato scelto.',

    bandsTag: 'Bande lungo L–Γ–X–W–K–Γ',
    bandsHint: 'clicca o trascina lungo una banda · frecce per spostarti',
    bandsAria:
      'Struttura a bande lungo L–Γ–X–W–K–Γ. Frecce sinistra/destra per k, su/giù per cambiare banda.',
    refining: 'in affinamento…',
    bandsLegendAria: 'Legenda delle bande',
    valenceLegend: '4 bande di valenza',
    conductionLegend: 'conduzione',
    emptyLegend: 'reticolo vuoto fcc (Vₚₛ = 0)',
    directGap: 'gap diretto',
    indirectGap: 'gap indiretto',
    probeSuffix: 'm* lungo il tratto',
    chemicalPotential: 'μ / E_F'
  },

  formula: {
    title: 'Formula viva',
    pseudoTitle: 'Equazione di pseudo-Schrödinger e potenziale repulsivo V′',
    pseudoAria: 'Equazione di pseudo-Schrödinger con pseudopotenziale V_ps = V + V primo.',
    centralTitle: 'Equazione centrale sullo pseudopotenziale (G in 2π/a, τ = a/8 (1,1,1))',
    centralAria: 'Equazione centrale e fattore di struttura simmetrico e antisimmetrico.',
    factorsTitle: 'Fattori di forma e sfera di Fermi del gas libero'
  },

  values: {
    aLabel: 'passo reticolare',
    planeWavesLabel: 'onde piane',
    refiningNote: 'calcolo ridotto (51 onde) → in affinamento a 113 onde…',
    formFactorsLabel: 'fattori Vˢ (Ry / eV)',
    antisymLabel: 'fattori Vᵃ (zincoblenda)',
    gapLabel: 'gap assoluto',
    alMetalValue: 'metallo: nessun gap assoluto',
    alZeroNote: 'zero dell’energia posto al fondo della banda (Γ)',
    alFermiLabel: 'sfera di Fermi (gas libero)',
    alCrossingsLabel: 'bande che tagliano E_F',
    alCrossingsValue: (n: number, indices: string) =>
      n === 1 ? `1 banda (banda ${indices})` : `${n} bande (bande ${indices})`,
    alFermiNote3:
      'Con 3 e⁻/cella: $k_F > |\\Gamma W| = 1{,}118\\,(2\\pi/a)$, la sfera contiene tutta la prima zona e più bande tagliano $\\htmlData{q=EF}{E_F}$.',
    alFermiNote1:
      'Con 1 e⁻/cella: $k_F\' < |\\Gamma L| = 0{,}866\\,(2\\pi/a)$, la sfera resta tutta dentro la prima zona (solo la 1ª banda taglia $\\htmlData{q=EF}{E_F\'}$).',
    gapIndicative: (measured: string, kind: string) =>
      `mis. ${measured} eV (${kind}); il modello locale dà gap indicativi`,
    gapGenericNote: 'modello locale empirico: la forma delle bande è fedele, il gap è indicativo',
    cbmPosLabel: 'minimo conduzione',
    ecPointsLabel: 'conduzione in Γ / X / L',
    valenceSpanLabel: 'fondo e larghezza valenza',
    selectedLabel: 'stato scelto',
    selectedBandValence: (n: number) => `valenza ${n}`,
    selectedBandConduction: (n: number) => `conduzione ${n}`,
    selectedBandGeneric: (n: number) => `banda ${n}`,
    massToolLabel: 'massa efficace lungo il tratto',
    massDirection: (segment: string) => `derivata direzionale lungo ${segment}`,
    massGaAsCompare: (mCalc: string, mMeas: string, mKp: string) =>
      `GaAs in $\\Gamma$: calc. ${mCalc} m₀ · mis. ${mMeas} m₀ · stima $k\\cdot p$ $E_g/E_P = ${mKp}$ m₀`,
    fillNote:
      '8 elettroni per cella primitiva (cristallo a 2 atomi) riempiono esattamente le 4 bande di valenza ($E \\le 0$); il potenziale chimico $\\htmlData{q=EF}{\\mu}$ cade nel gap.',
    metalNoMuNote:
      'Gap chiuso (sistema metallico): il potenziale chimico $\\htmlData{q=EF}{\\mu}$ non cade in un gap.',
    compareNote:
      'Confronto con il reticolo vuoto fcc ($V_{\\mathrm{ps}} = 0$) allineato al fondo della banda: in basso le bande seguono la parabola libera $\\htmlData{q=Ek}{E_k}$.',

    bareIonTitle: 'Confronto di scala sul silicio (esempio fisso: Si, a = 5,431 Å, Z = 14)',
    bareIonSub: 'stima P4 §4 (−0,211 Ry = −2,87 eV in $|G|^2 = 3$) contro fattori di forma locali $\\htmlData{q=VG}{V^s}$',
    bareIonRow: (g2: number) => `$|G|^2 = ${g2}$`,
    bareIonValue: (bare: string, pseudo?: string) =>
      pseudo ? `ione nudo ${bare} eV vs $\\htmlData{q=VG}{V^s} = ${pseudo}$ eV` : `ione nudo ${bare} eV`
  },

  theory: {
    title: 'Scheda teoria (P4 §5)',
    sections: [
      {
        heading: 'Alluminio: un metallo quasi libero',
        body:
          'L’alluminio ($a = 4{,}05\\text{ Å}$, fcc con 1 atomo per cella, $3$ elettroni di valenza) è descritto molto bene dal reticolo vuoto: $k_F = 1{,}75\\text{ Å}^{-1} = 1{,}127\\,(2\\pi/a) > |\\Gamma W| = 1{,}118\\,(2\\pi/a)$, perciò la sfera di Fermi contiene tutta la prima zona e più bande attraversano $\\htmlData{q=EF}{E_F}$ ($11{,}65\\text{ eV}$ sopra il fondo). Con $1$ elettrone/cella ($k_F\' = 0{,}78\\,(2\\pi/a) < |\\Gamma L| = 0{,}866$) la sfera resterebbe dentro la prima zona.'
      },
      {
        heading: 'Si, Ge e GaAs: gap assoluto e potenziale chimico',
        body:
          'Diamante e zincoblenda hanno 2 atomi e 8 elettroni per cella primitiva: le 4 bande di valenza si riempiono esattamente e $\\htmlData{q=EF}{\\mu}$ cade nel gap assoluto. Nel Si il gap è indiretto (massimo in $\\Gamma$, minimo lungo $\\Gamma X$ vicino a $X$); nel Ge è indiretto in $L$; nel GaAs è diretto in $\\Gamma$ grazie anche al termine antisimmetrico $\\htmlData{q=V2G}{V^a}$.'
      },
      {
        heading: 'Dalla teoria alle misure (ARPES)',
        body:
          'In fotoemissione risolta in angolo (ARPES) la transizione è verticale e si conserva la componente parallela $k_\\parallel = \\sqrt{2m_0 E_{\\mathrm{kin}}}\\sin\\theta/\\hbar$, permettendo di ricostruire direttamente le bande occupate $E(\\mathbf{k})$.'
      }
    ]
  }
} as const
