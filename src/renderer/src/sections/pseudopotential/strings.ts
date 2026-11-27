/**
 * Tutti i testi della sezione «Pseudopotenziale» (modello 1D esatto con stato di core, P4 §4).
 * Nessun trattino basso letterale nei testi visibili: le formule usano KaTeX ($…$).
 */
function numberStartsWithVowel(n: number): boolean {
  const k = Math.abs(Math.round(n))
  if (k === 1 || k === 8 || k === 11) return true
  if (k >= 80 && k <= 89) return true
  if (k >= 800 && k <= 899) return true
  return false
}

function pctArticle(prep: 'il' | 'al' | 'per il', n: number): string {
  if (!numberStartsWithVowel(n)) return `${prep} ${n} %`
  if (prep === 'il') return `l’${n} %`
  if (prep === 'al') return `all’${n} %`
  return `per l’${n} %`
}

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
        readonly evenWeightCore: number
        readonly oddWeightCore: number
        readonly evenCrossings: number
        readonly oddCrossings: number
        readonly nTrueVal: number | null
        readonly nPseudoVal: number | null
        readonly nTrue: string
        readonly nPseudo: string
        readonly alphaStr: string
        readonly betaStr: string
        readonly kineticTrue: string
        readonly kineticSmooth: string
        readonly domSmoothPct: string
        readonly eKinIon: string
        readonly eKinMid: string
        readonly isOdd: boolean
      }
    ): string => {
      const hasClearAdvantage =
        data.nPseudoVal !== null &&
        (data.nTrueVal === null || data.nTrueVal - data.nPseudoVal > 2)
      const oddCorePct = Math.round(data.oddWeightCore * 100)
      const sameWaves = data.nTrue === data.nPseudo
      const hasEven = data.evenWeightCore >= 0.01
      const hasOdd = data.oddWeightCore >= 0.01

      if (step === 0) {
        if (hasClearAdvantage) {
          return `$\\psi^{\\mathrm f}$ liscia: $\\langle T\\rangle$ ${data.kineticSmooth} vs ${data.kineticTrue} eV, onda ${data.domSmoothPct} %, ${data.nPseudo} onde invece di ${data.nTrue}.`
        }
        if (data.isOdd) {
          if (sameWaves) {
            return `Stato dispari: $\\psi^{\\mathrm f} = \\psi_{\\mathbf{k}}$, $100$ % dispari nel core, $V'$ non agisce (${data.nPseudo} onde).`
          }
          return `Stato dispari: $\\psi^{\\mathrm f} = \\psi_{\\mathbf{k}}$, $100$ % dispari, ${data.nTrue} onde con $V$, ${data.nPseudo} con $V + V'$.`
        }
        const wavePart = sameWaves ? `${data.nPseudo} onde` : `${data.nTrue} contro ${data.nPseudo} onde`
        return `Parte dispari ${pctArticle('al', oddCorePct)}: $V'$ agisce sulla parte pari (${wavePart}).`
      }
      if (step === 1) {
        if (data.isOdd || (hasOdd && !hasEven) || !hasEven) {
          if (data.oddCrossings === 1) {
            return 'Stato dispari nel core: cambia segno in $x = 0$, ortogonale a $\\psi_c$ per simmetria.'
          }
          return `Parte dispari nel core: ${data.oddCrossings} cambi di segno, ortogonale a $\\psi_c$ per simmetria.`
        }
        if (hasEven && hasOdd) {
          return `Pari: ${data.evenCrossings} ${data.evenCrossings === 1 ? 'cambio' : 'cambi'}; dispari (${oddCorePct} %): ${data.oddCrossings} ${data.oddCrossings === 1 ? 'cambio' : 'cambi'}. Servono ${data.nTrue} onde.`
        }
        return `$\\psi_{\\mathbf{k}}$ cambia segno ${data.evenCrossings} ${data.evenCrossings === 1 ? 'volta' : 'volte'} nel core per ortogonalità a $\\psi_c$: ${data.nTrue} onde.`
      }
      if (step === 2) {
        if (data.isOdd) {
          return 'Stato dispari: nessuna copia di $\\psi_c$ da togliere ($\\alpha = 0$, $\\psi^{\\mathrm f} = \\psi_{\\mathbf{k}}$).'
        }
        return `Tolta $\\beta_c\\psi_c$ ($\\beta_c = ${data.betaStr}$, $\\alpha = ${data.alphaStr}$), resta $\\psi^{\\mathrm f}$ liscia nel core.`
      }
      if (step === 3) {
        if (hasClearAdvantage) {
          return `$E - V$: ${data.eKinIon} vs ${data.eKinMid} eV; con $V + V'$ bastano ${data.nPseudo} onde invece di ${data.nTrue}.`
        }
        if (oddCorePct >= 10) {
          return `$\\psi_{\\mathbf{k}}$ è ${pctArticle('per il', oddCorePct)} dispari nel core: $\\psi_c$ è pari, il vantaggio sparisce.`
        }
        return `$E - V$: ${data.eKinIon} vs ${data.eKinMid} eV; ${sameWaves ? `servono ${data.nPseudo} onde per entrambi` : `con $V + V'$ servono ${data.nPseudo} onde vs ${data.nTrue}`}.`
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
    psiOddLegend: 'parte dispari',
    psiSmoothLegend: 'liscia $\\psi^{\\mathrm f}$',

    recipTag: 'Onde piane',
    recipAria:
      'Vista delle onde piane: pesi c con G al quadrato, convergenza in funzione di N e cancellazione V + V′.',
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
    oddCoreLabel: 'parte dispari nel core',
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
        items: [
          'Il problema: $\\psi_{c\\mathbf{k}}$ è confinata nella buca vicino allo ione; $\\htmlData{q=psi}{\\psi_{\\mathbf{k}}}$ è autostato della stessa $H$ con energia diversa, quindi è ortogonale a $\\psi_{c\\mathbf{k}}$. Nel core deve cambiare segno e oscillare rapidamente, richiedendo molte onde piane; inoltre $V$ non è piccolo.',
          'L’idea: quell’oscillazione è una copia di $\\psi_{c\\mathbf{k}}$, cioè $\\htmlData{q=psi}{\\psi_{\\mathbf{k}}} = \\htmlData{q=psi}{\\psi^{\\mathrm f}_{\\mathbf{k}}} + \\beta_c\\psi_{c\\mathbf{k}}$; la parte di core è nota e resta da calcolare solo $\\psi^{\\mathrm f}_{\\mathbf{k}}$, che è liscia.',
          'Il risultato: per $\\psi^{\\mathrm f}_{\\mathbf{k}}$ il potenziale efficace è $V_{\\mathrm{ps}} = \\htmlData{q=VG}{V} + V\'$, con $V\' = (\\htmlData{q=E}{E} - E_c)|\\psi_{c\\mathbf{k}}\\rangle\\langle\\psi_{c\\mathbf{k}}| > 0$ repulsivo nel core che compensa in buona parte $V$; per questo bastano poche onde piane e il metodo dei quasi liberi funziona con $V_{\\mathrm{ps}}$ e non con $V$.'
        ]
      },
      {
        heading: 'Rispetto agli altri metodi',
        body:
          'I legami forti descrivono bene solo la banda di core (larga meno di $0{,}1$ eV). Le onde piane con il potenziale vero devono descrivere anche l’oscillazione nel core ($11$ onde in $\\Gamma$, e $V$ non è piccolo). Le onde piane ortogonalizzate e lo pseudopotenziale tolgono la parte di core, che è nota ($3$ onde in $\\Gamma$). Il proiettore $V\' = \\sum_c (E - E_c)|\\psi_{c\\mathbf{k}}\\rangle\\langle\\psi_{c\\mathbf{k}}|$ cancella $V$ solo nella parte di $\\psi_{\\mathbf{k}}$ che «vede» uno stato di core: in questo modello 1D c’è un solo stato di core, pari, e il vantaggio vale per la parte pari ($\\Gamma$ banda 1: $11 \\to 3$; $\\Gamma$ banda 3: $15 \\to 5$; $\\Gamma$ banda 2, dispari: $13 \\to 13$). Negli atomi veri la somma su $c$ comprende stati di core di diverse simmetrie (per il Si $1s$, $2s$ e $2p$).'
      },
      {
        heading: 'Le due non unicità e il limite metallico',
        body:
          'Primo: sostituire $E - E_c$ con qualsiasi $\\htmlData{q=V2G}{f}$ lascia invariati gli autovalori di valenza e sposta solo il livello di core a $E_c + f$. Secondo: aggiungere $\\htmlData{q=psi}{\\alpha}\\,\\psi_{c\\mathbf{k}}$ a $\\psi^{\\mathrm f}_{\\mathbf{k}}$ non cambia lo stato vero $\\psi_{\\mathbf{k}} = (1 - \\hat\\Pi_c)\\psi^{\\mathrm f}_{\\mathbf{k}}$; «parte liscia» sceglie $\\alpha = -\\langle\\psi_c|T|\\psi_{\\mathbf{k}}\\rangle/\\langle\\psi_c|T|\\psi_c\\rangle$ (minimo cinetico di $\\psi^{\\mathrm f}$ non normalizzata). Nei metalli semplici la schermatura di Thomas–Fermi fissa $v(0) = -\\frac{2}{3}E_F$.'
      }
    ]
  }
} as const
