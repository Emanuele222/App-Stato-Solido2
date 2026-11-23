/**
 * Tutti i testi della sezione «Pseudopotenziale» (modello 1D con stato di core, P4 §4).
 */
export const strings = {
  chapter: 'Teoria delle bande',
  title: 'Pseudopotenziale',
  toolsLabel: 'Strumenti',
  asideLabel: 'Formula viva, valori vivi e scheda teoria',
  goToRealBands: 'Bande dei materiali veri →',

  params: {
    group: 'Parametri',
    a: 'Passo reticolare a',
    v0: 'Profondità buca V₀',
    s: 'Larghezza gaussiana s',
    f: 'Spostamento proiettore f (non unicità di V_ps)',
    alpha: 'Peso di core α nella pseudo-funzione ψᶠ',
    smoothestBtn: 'più liscia',
    smoothestTitle: 'Imposta α al valore che minimizza l’energia cinetica media di ψᶠ (scelta di comodità, non unica)',
    smoothestNote: 'scelta «più liscia» = minimo di ⟨ψᶠ|T|ψᶠ⟩',
    fMarkerNote: (val: string) => `tacca f = E − E_c = ${val} eV`,
    gaugeNote: 'Zero di energia: componente G = 0 del potenziale omessa (spostamento costante).'
  },

  tools: {
    fill: 'Riempimento',
    fillTitle: 'Mostra la banda di core occupata: gli elettroni di core restano inerti e non partecipano alla conduzione',
    mass: 'Massa efficace',
    massTitle: 'Parabola osculatrice e rapporto m*/m₀ nello stato scelto',
    compare: 'Confronto: reticolo vuoto 1D',
    compareTitle: 'Sovrappone le bande del reticolo vuoto 1D (V₀ = 0)'
  },

  scene: {
    bandsTag: 'Bande 1D (core + valenza)',
    bandsHint: 'clicca o trascina su una banda · frecce per spostarti · la tacca su f segna E − E_c',
    bandsAria: 'Bande 1D nella prima zona di Brillouin con banda di core e bande di valenza.',
    coreBandLegend: 'core E_c',
    shiftedCoreLegend: 'core spostato E_c + f',
    valenceBandLegend: 'valenza E_v',
    emptyLegend: 'reticolo vuoto 1D',
    probeSuffix: 'm* nello stato',

    realTag: 'Spazio reale: V(x), ψ_c, ψ_k vera e parte liscia ψᶠ',
    realHint: 'cambiando α cambia ψᶠ ma non lo stato vero (1 − Π_c)ψᶠ · r_c ricavato da |ψ_c|²',
    realAria: 'Potenziale periodico a buche gaussiane e confronto tra ψ_c, ψ_k e ψ^f nello spazio reale.',
    potentialLegend: 'V(x)',
    psiCoreLegend: 'core ψ_c',
    psiTrueLegend: 'valenza vera ψ_k',
    psiSmoothLegend: 'pseudo-funzione ψᶠ',

    recipTag: 'Spazio reciproco: pesi |c_G|² e cancellazione V + V′',
    recipHint: 'sinistra: pesi |c_G|² (coda di ψ_k vs ψᶠ) · destra: elementi ⟨k+G|V|k⟩ contro ⟨k+G|V+V′|k⟩',
    recipAria: 'Confronto nello spazio reciproco dei pesi in onde piane e della cancellazione tra V e V primo.',
    weightsTrueLegend: '|c_G|² di ψ_k',
    weightsSmoothLegend: '|c_G|² di ψᶠ',
    matVLegend: '⟨k+G|V|k⟩',
    matVpsLegend: '⟨k+G|V+V′|k⟩'
  },

  formula: {
    title: 'Formula viva',
    opwTitle: 'Separazione in parte liscia e parte di core',
    pseudoTitle: 'Equazione di pseudo-Schrödinger e potenziale repulsivo V′',
    nonUniqTitle: 'Le due non unicità: f sul proiettore e α su ψᶠ'
  },

  values: {
    ecLabel: 'energia di core E_c',
    evLabel: 'energia di valenza E_v',
    diffLabel: 'separazione E_v − E_c',
    orthoLabel: 'ortogonalità |⟨ψ_c|ψ_k⟩|',
    shiftedCoreLabel: 'livello di core con f',
    alphaLabel: 'α attuale / «più liscia»',
    lowWavesLabel: 'peso in |n| ≤ 3 (ψ_k vs ψᶠ)',
    rcLabel: 'raggio indicativo r_c (95% |ψ_c|²)',
    massLabel: 'massa efficace',
    fillNote:
      'La banda di core è completamente piena ma separata dalla valenza da decine di eV e quasi piatta (m* molto grande): gli elettroni di core sono inerti.',
    compareNote:
      'Confronto con il reticolo vuoto 1D (V₀ = 0): le bande di valenza seguono da vicino le parabole libere ripiegate.',

    bareIonTitle: 'Confronto di scala sul silicio (P4 §4: a = 5,431 Å, Z = 14)',
    bareIonSub: 'stima ione nudo (−0,211 Ry = −2,87 eV in $|G|^2 = 3$) contro fattori locali $\\htmlData{q=VG}{V^s}$',
    bareIonRow: (g2: number) => `$|G|^2 = ${g2}$`,
    bareIonValue: (bare: string, pseudo?: string) =>
      pseudo ? `ione nudo ${bare} eV vs $\\htmlData{q=VG}{V^s} = ${pseudo}$ eV` : `ione nudo ${bare} eV`
  },

  theory: {
    title: 'Scheda teoria (P4 §4)',
    sections: [
      {
        heading: 'Perché ψ_k oscilla nel core e servono molte onde piane',
        body:
          'Gli stati di valenza $\\htmlData{q=psi}{\\psi_k}$ e di core $\\psi_{ck}$ sono autostati della stessa Hamiltoniana con energie diverse, quindi sono ortogonali: $\\langle\\psi_{ck}|\\psi_k\\rangle = 0$. Per annullare l’integrale nella regione del core (entro $r_c$), $\\psi_k$ deve oscillare rapidamente vicino allo ione, richiedendo molte componenti di Fourier $\\psi_k = \\sum_G c_G e^{i(k+G)x}$.'
      },
      {
        heading: 'Il potenziale repulsivo V′ e la cancellazione',
        body:
          'Scrivendo $\\psi_k = (1 - \\hat\\Pi_c)\\htmlData{q=psi}{\\psi^{\\mathrm f}_k}$, l’equazione per la sola parte liscia diventa $[\\hat p^2/2m_0 + \\htmlData{q=VG}{V_{\\mathrm{ps}}}]\\psi^{\\mathrm f}_k = \\htmlData{q=E}{E}\\psi^{\\mathrm f}_k$ con $V_{\\mathrm{ps}} = V + V\'$ e $V\' = (E - E_c)|\\psi_{ck}\\rangle\\langle\\psi_{ck}| > 0$. Poiché $E > E_c$, $V\'$ è repulsivo e non locale e cancella in buona parte il potenziale attrattivo $V$.'
      },
      {
        heading: 'Le due non unicità e il limite metallico',
        body:
          'Primo: sostituire $E - E_c$ con qualsiasi $\\htmlData{q=V2G}{f}$ lascia invariati gli autovalori di valenza e sposta solo il livello di core a $E_c + f$. Secondo: aggiungere $\\htmlData{q=psi}{\\alpha}\\,\\psi_{ck}$ a $\\psi^{\\mathrm f}_k$ non cambia lo stato vero $\\psi_k = (1 - \\hat\\Pi_c)\\psi^{\\mathrm f}_k$; il pulsante «più liscia» sceglie l’$\\alpha$ che minimizza l’energia cinetica media (scelta comoda, non unica). Nei metalli semplici la schermatura di Thomas–Fermi fissa il limite $v(0) = -\\frac{2}{3}E_F$.'
      }
    ]
  }
} as const
