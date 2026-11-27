/**
 * Tutti i testi della sezione «Pseudopotenziale» (modello 1D esatto con stato di core, P4 §4).
 * Nessun trattino basso letterale nei testi visibili: le formule usano KaTeX ($…$).
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
    f: 'Spostamento proiettore f (non unicità di Vps)',
    alpha: 'Peso di core α nella pseudo-funzione ψᶠ',
    smoothToggle: 'parte liscia',
    smoothToggleTitle:
      'Quando è acceso, α segue automaticamente lo stato e i parametri (minimo di ⟨ψᶠ|T|ψᶠ⟩ per ψᶠ non normalizzata); muovendo il cursore α a mano si spegne',
    alphaZeroMarker: '$\\psi^{\\mathrm f} = \\psi_{\\mathbf{k}}$',
    fMarkerBtn: (val: string) => `$E - E_c = ${val}$ eV`,
    fMarkerTitle: 'Porta f al valore E − E_c dello stato scelto (risonanza di degenerazione)',
    gaugeNote: 'Zero di energia: componente $G = 0$ del potenziale omessa (spostamento costante $V - \\bar V$).'
  },

  tools: {
    fill: 'Riempimento',
    fillTitle: 'Mostra la banda di core occupata: gli elettroni di core restano inerti e non partecipano alla conduzione',
    mass: 'Massa efficace',
    massTitle: 'Parabola osculatrice e rapporto m*/m₀ nello stato scelto',
    compare: 'Confronto: reticolo vuoto 1D',
    compareTitle: 'Sovrappone le bande del reticolo vuoto 1D (V₀ = 0)'
  },

  guided: {
    groupLabel: 'Lettura guidata',
    steps: [
      { id: 0 as const, label: 'Tutto' },
      { id: 1 as const, label: '1 Il problema' },
      { id: 2 as const, label: '2 L’idea' },
      { id: 3 as const, label: '3 Il risultato' }
    ],
    stepText: (
      step: 0 | 1 | 2 | 3,
      data: {
        readonly signChanges: number
        readonly nTrue: string
        readonly nPseudo: string
        readonly alphaStr: string
        readonly betaStr: string
        readonly maxOutDiff: string
        readonly eKinIon: string
        readonly eKinMid: string
        readonly isOdd: boolean
      }
    ): string => {
      if (step === 1) {
        if (data.isOdd) {
          return 'Stato dispari attorno allo ione: cambia segno in $x = 0$ ed è ortogonale a $\\psi_c$ per simmetria ($\\int \\psi_c^* \\psi_{\\mathbf{k}}\\,dx = 0$).'
        }
        return `$\\psi_{\\mathbf{k}}$ cambia segno ${data.signChanges} ${data.signChanges === 1 ? 'volta' : 'volte'} nel core per restare ortogonale a $\\psi_c$: servono ${data.nTrue} onde piane.`
      }
      if (step === 2) {
        if (data.isOdd) {
          return 'Stato dispari: non serve sottrarre alcuna copia di $\\psi_c$ ($\\alpha = 0$, $\\psi^{\\mathrm f} = \\psi_{\\mathbf{k}}$).'
        }
        return `Tolta la copia $\\beta_c\\psi_c$ ($\\beta_c = ${data.betaStr}$, $\\alpha = ${data.alphaStr}$), resta la parte liscia $\\psi^{\\mathrm f}$ che fuori dal core coincide con $\\psi_{\\mathbf{k}}$.`
      }
      if (step === 3) {
        return `Sullo ione $E - V = ${data.eKinIon}$ eV contro ${data.eKinMid} eV tra gli ioni; con $V + V'$ bastano ${data.nPseudo} onde piane invece di ${data.nTrue}.`
      }
      return ''
    }
  },

  scene: {
    realTag: 'Spazio reale',
    realHint:
      'energie ($V$, $E_c$, $E$), funzioni d’onda ($\\psi_c$, $\\psi_{\\mathbf{k}}$, $\\psi^{\\mathrm f}$) e integrando di ortogonalità',
    realAria:
      'Tre fasce nello spazio reale su una cella centrata sullo ione: energie, funzioni d’onda con cambi di segno nel core e integrando di ortogonalità.',
    potentialLegend: '$V(x)$',
    coreEnergyLegend: '$E_c$',
    valEnergyLegend: '$E(\\mathbf{k})$',
    psiCoreLegend: 'core $\\psi_c$',
    psiTrueLegend: 'valenza $\\psi_{\\mathbf{k}}$',
    psiSmoothLegend: 'liscia $\\psi^{\\mathrm f}$',

    recipTag: 'Onde piane',
    recipAria: 'Vista delle onde piane: pesi |c_G|², convergenza in funzione di N e cancellazione V + V′.',
    recipTabConvergence: 'Quante onde piane',
    recipTabCancellation: 'Cancellazione',
    recipHintConv: 'pesi $|c_G|^2$ ($n = -4\\ldots 4$) ed errore su $E(\\mathbf{k})$ per $N$ onde piane',
    recipHintCancel: 'elementi di matrice $\\langle \\mathbf{k}+G|V|\\mathbf{k}\\rangle$ contro $\\langle \\mathbf{k}+G|V+V\'|\\mathbf{k}\\rangle$',
    weightsTrueLegend: '$|c_G|^2\\,\\psi_{\\mathbf{k}}$',
    weightsSmoothLegend: '$|c_G|^2\\,\\psi^{\\mathrm f}$',
    convTrueLegend: '$H$ vera',
    convPseudoLegend: '$H + V\'$',
    matVLegend: '$\\langle\\mathbf{k}+G|V|\\mathbf{k}\\rangle$',
    matVpsLegend: '$\\langle\\mathbf{k}+G|V+V\'|\\mathbf{k}\\rangle$',

    bandsTag: 'Bande 1D',
    bandsHint: 'clic o frecce · tacca $f = E - E_c$',
    bandsAria: 'Bande 1D nella prima zona di Brillouin con banda di core e bande di valenza.',
    coreBandLegend: 'core $E_c$',
    shiftedCoreLegend: 'core $E_c + f$',
    valenceBandLegend: 'valenza $E$',
    emptyLegend: 'reticolo vuoto 1D',
    probeSuffix: 'm* nello stato'
  },

  formula: {
    title: 'Formula viva',
    opwTitle: 'Separazione in parte liscia e parte di core',
    pseudoTitle: 'Equazione di pseudo-Schrödinger e potenziale repulsivo V′',
    nonUniqTitle: 'Le due non unicità: f sul proiettore e α su ψᶠ'
  },

  values: {
    ecLabel: 'energia di core',
    evLabel: 'energia di valenza',
    diffLabel: 'separazione',
    orthoLabel: 'ortogonalità',
    shiftedCoreLabel: 'livello di core con f',
    signChangesLabel: 'cambi di segno nel core',
    alphaBetaLabel: 'non unicità su ψᶠ',
    kineticMeanLabel: 'energia cinetica media',
    domWaveLabel: 'onda piana dominante',
    wavesNeededLabel: 'onde per errore < 0,01 eV',
    localKinLabel: 'cinetica locale $E - V$',
    rcLabel: 'raggio del core (95 % $|\\psi_c|^2$)',
    massLabel: 'massa efficace',
    oddStateNote: 'Stato dispari attorno allo ione: è ortogonale a $\\psi_c$ per simmetria.',
    fillNote:
      'La banda di core è completamente piena ma separata dalla valenza da decine di eV e quasi piatta ($m^*$ molto grande): gli elettroni di core sono inerti.',
    compareNote:
      'Confronto con il reticolo vuoto 1D ($V_0 = 0$): le bande di valenza seguono da vicino le parabole libere ripiegate.',

    bareIonTitle: 'Confronto di scala sul silicio (a = 5,431 Å, Z = 14)',
    bareIonSub:
      'stima ione nudo ($-0{,}211$ Ry $= -2{,}87$ eV in $|G|^2 = 3$) contro fattori locali $\\htmlData{q=VG}{V^s}$',
    bareIonRow: (g2: number) => `$|G|^2 = ${g2}$`,
    bareIonValue: (bare: string, pseudo?: string) =>
      pseudo ? `ione nudo ${bare} eV vs $\\htmlData{q=VG}{V^s} = ${pseudo}$ eV` : `ione nudo ${bare} eV`
  },

  theory: {
    title: 'Scheda teoria',
    sections: [
      {
        heading: 'Perché lo pseudopotenziale funziona',
        body:
          '1. Il problema: $\\psi_{c\\mathbf{k}}$ è confinata nella buca vicino allo ione; $\\htmlData{q=psi}{\\psi_{\\mathbf{k}}}$ è autostato della stessa $H$ con energia diversa, quindi è ortogonale a $\\psi_{c\\mathbf{k}}$. Nel core deve cambiare segno e oscillare rapidamente, richiedendo molte onde piane; inoltre $V$ non è piccolo. 2. L’idea: quell’oscillazione è una copia di $\\psi_{c\\mathbf{k}}$, cioè $\\htmlData{q=psi}{\\psi_{\\mathbf{k}}} = \\htmlData{q=psi}{\\psi^{\\mathrm f}_{\\mathbf{k}}} + \\beta_c\\psi_{c\\mathbf{k}}$; la parte di core è nota e resta da calcolare solo $\\psi^{\\mathrm f}_{\\mathbf{k}}$, che è liscia. 3. Il risultato: per $\\psi^{\\mathrm f}_{\\mathbf{k}}$ il potenziale efficace è $V_{\\mathrm{ps}} = \\htmlData{q=VG}{V} + V\'$, con $V\' = (\\htmlData{q=E}{E} - E_c)|\\psi_{c\\mathbf{k}}\\rangle\\langle\\psi_{c\\mathbf{k}}| > 0$ repulsivo nel core che compensa in buona parte $V$; per questo bastano poche onde piane e il metodo dei quasi liberi funziona con $V_{\\mathrm{ps}}$ e non con $V$.'
      },
      {
        heading: 'Rispetto agli altri metodi',
        body:
          'I legami forti descrivono bene solo la banda di core (larga meno di $0{,}1$ eV). Le onde piane con il potenziale vero devono descrivere anche l’oscillazione nel core ($11$ onde in $\\Gamma$, e $V$ non è piccolo). Le onde piane ortogonalizzate e lo pseudopotenziale tolgono la parte di core, che è nota ($3$ onde).'
      },
      {
        heading: 'Le due non unicità e il limite metallico',
        body:
          'Primo: sostituire $E - E_c$ con qualsiasi $\\htmlData{q=V2G}{f}$ lascia invariati gli autovalori di valenza e sposta solo il livello di core a $E_c + f$. Secondo: aggiungere $\\htmlData{q=psi}{\\alpha}\\,\\psi_{c\\mathbf{k}}$ a $\\psi^{\\mathrm f}_{\\mathbf{k}}$ non cambia lo stato vero $\\psi_{\\mathbf{k}} = (1 - \\hat\\Pi_c)\\psi^{\\mathrm f}_{\\mathbf{k}}$; «parte liscia» sceglie $\\alpha = -\\langle\\psi_c|T|\\psi_{\\mathbf{k}}\\rangle/\\langle\\psi_c|T|\\psi_c\\rangle$ (minimo cinetico di $\\psi^{\\mathrm f}$ non normalizzata). Nei metalli semplici la schermatura di Thomas–Fermi fissa $v(0) = -\\frac{2}{3}E_F$.'
      }
    ]
  }
} as const
