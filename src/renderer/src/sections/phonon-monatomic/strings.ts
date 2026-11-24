/**
 * Testi in italiano della sezione «Catena monatomica e prima zona di Brillouin».
 * Fonte: dispensa Parte 6, Lezione 1 §§1–5 e Lezione 3 §13.
 */
export const strings = {
  chapter: 'Fononi',
  title: 'Catena monatomica e prima zona',
  toolsLabel: 'Strumenti sulla dispersione e sulla catena',
  asideLabel: 'Formule vive e guida alla sezione',

  tools: {
    aliasing: 'Aliasing ($k + G$)',
    aliasingTitle: 'Mostra un vettore equivalente k′ = k ± G: stessa ω e stessi spostamenti sugli atomi',
    bvk: 'Born–von Kármán ($N$)',
    bvkTitle: 'Chiude la catena ad anello (u(n+N) = u(n)) e discretizza i k permessi in 1BZ',
    probe: 'Sonda $v_p, v_g$',
    probeTitle: 'Traccia la corda (velocità di fase v_p = ω/k) e la tangente locale (velocità di gruppo v_g = dω/dk)'
  },

  params: {
    a: 'Passo reticolare a',
    massAmu: 'Massa atomica M',
    springC: 'Costante elastica C'
  },

  bvkStepper: {
    label: 'Atomi nell’anello N',
    decrease: 'Diminuisci il numero di atomi nell’anello',
    increase: 'Aumenta il numero di atomi nell’anello'
  },

  presets: {
    label: 'Preset',
    free: 'Libero',
    note: 'Metallo tipico da dispensa §3; Piombo 1D e Carbonio 1D esterni alla dispensa (illustrativi)',
    item: (name: string, aStr: string, mStr: string, cStr: string): string =>
      `${name} (a = ${aStr} Å, M = ${mStr} u, C = ${cStr} N/m)`
  },

  quickModes: {
    group: 'Modi caratteristici',
    origin: 'k = 0',
    half: 'π/2a',
    edge: 'π/a'
  },

  scene: {
    chainTag: 'Spazio reale — catena 1D',
    ringTag: 'Spazio reale — anello di Born–von Kármán',
    chainAria: 'Animazione della catena monatomica unidimensionale con atomi di massa M, molle C e spostamenti u_n',
    ringAria: 'Animazione della catena chiusa ad anello con condizioni periodiche di Born–von Kármán',
    dispersionTag: 'Relazione di dispersione ν(k) = ω(k)/2π',
    dispersionAria: 'Diagramma di dispersione fononica della catena monatomica nella prima zona di Brillouin e repliche',
    dispersionHint: 'Clicca o trascina nella 1BZ (frecce ←/→ per spostarti)',
    dispersionBvkHint: 'Clicca o usa ←/→ per scorrere gli N modi permessi',
    yAxis: 'ν (THz)',
    xAxis: 'k (Å⁻¹)',
    evanescentBand: 'ν > ν_{max} (evanescente)',
    vpLabel: 'v_{p}',
    vgLabel: 'v_{g}',
    legendDispersionAria: 'Legenda del diagramma di dispersione',
    legendChainAria: 'Legenda della catena atomica',
    legendBranch: 'dispersione $\\nu(k) = \\omega(k)/2\\pi$ in 1BZ',
    legendReplicas: 'repliche $k + G$',
    legendSound: 'limite acustico $\\nu = v_s|k|/2\\pi$',
    legendEvanescent: 'banda evanescente ($\\omega > \\omega_{\\max}$)',
    legendBvk: 'modi Born–von Kármán',
    legendVp: 'corda $v_p = \\omega/k$ (pendenza $v_p/2\\pi$)',
    legendVg: 'tangente $v_g = d\\omega/dk$ (pendenza $v_g/2\\pi$)',
    legendAtoms: 'atomi $M$',
    legendSprings: 'molle $C$',
    legendWaveK: 'profilo $u(x)$ e spostamenti $u_n$',
    legendWaveAlias: 'onda equivalente $k\' = k \\pm G$',
    noteOrigin: 'traslazione rigida ($\\omega = 0$, $\\lambda \\to \\infty$)',
    noteStanding: 'onda stazionaria ($\\lambda = 2a$, $v_g = 0$, opposizione di fase)',
    stateHint: (kFracStr: string): string => `k = ${kFracStr} π/a`,
    stateHintBvk: (j: number, n: number, kFracStr: string): string =>
      `j = ${j} (${n} modi) · k = ${kFracStr} π/a`,
    ringCenterTop: 'u_{n+N} = u_{n}',
    ringCenterBottom: (n: number, j: number): string => `N = ${n} modi · j = ${j}`
  },

  formula: {
    title: 'Formula viva',
    aria: 'Relazione di dispersione della catena monatomica: omega di k uguale a 2 per radice di C su M per valore assoluto del seno di k a mezzi'
  },

  values: {
    scales: 'Scale caratteristiche',
    soundSpeed: 'Velocità del suono',
    state: 'Modo selezionato',
    wavelength: 'Lunghezza d’onda',
    wavelengthInf: '∞ (traslazione rigida)',
    aliasing: 'Vettore equivalente',
    aliasingSame: 'stessa $\\omega$ e stessi $u_n$ sugli atomi',
    velocities: 'Velocità (fase / gruppo)',
    originVelLimit: 'per $k \\to 0^\\pm$',
    originVelNote: 'In $k = 0$ il profilo trasla rigidamente (punto angoloso di $|\\sin(ka/2)|$): i limiti destro e sinistro valgono $\\pm v_s$.',
    edgeVelNote: 'Al bordo zona $v_g = 0$ (onda stazionaria), ma $|v_p| = \\omega_{\\max}a/\\pi = \\frac{2}{\\pi}v_s \\neq 0$: gli atomi oscillano!',
    bvk: 'Born–von Kármán',
    bvkSummary: (n: number, j: number): string => `${n} modi in 1BZ · j = ${j}`
  },

  theory: {
    title: 'Guida alla sezione',
    blocks: [
      {
        heading: 'L’idea',
        paragraphs: [
          'In un cristallo gli atomi non stanno fermi: oscillano attorno alle posizioni di equilibrio legati da forze elastiche che, per piccoli spostamenti, si comportano come molle di costante $\\htmlData{q=C}{C}$. In alto vedi una fila unidimensionale di atomi di massa $\\htmlData{q=M}{M}$ a distanza $\\htmlData{q=a}{a}$, mentre in basso la curva $\\htmlData{q=omega}{\\nu}(\\htmlData{q=k}{k})$ mostra la frequenza di oscillazione per ciascun vettore d’onda $\\htmlData{q=k}{k}$ scelto.'
        ]
      },
      {
        heading: 'Come intervengono i parametri',
        paragraphs: [
          'Molle più rigide ($\\htmlData{q=C}{C}$ grande) richiamano gli atomi più in fretta e alzano tutta la curva e la velocità del suono $\\htmlData{q=v}{v_s}$; atomi più pesanti ($\\htmlData{q=M}{M}$ grande) oppongono più inerzia e abbassano le frequenze. Allargando il passo reticolare $\\htmlData{q=a}{a}$ si restringe la prima zona di Brillouin $(\\pm\\pi/\\htmlData{q=a}{a})$, perché la lunghezza d’onda minima compatibile con il reticolo diventa più grande.',
          'I tre strumenti in alto attivano tre aspetti chiave: Aliasing ($k + G$) sovrappone un’onda equivalente più corta che passa per gli stessi atomi, Born–von Kármán ($N$) chiude la catena ad anello lasciando esattamente $N$ modi discreti, e Sonda $v_p, v_g$ disegna corda $(\\htmlData{q=vp}{v_p})$ e tangente $(\\htmlData{q=v}{v_g})$ nel punto scelto.'
        ]
      },
      {
        heading: 'Cosa provare',
        paragraphs: [
          'Seleziona il modo rapido $\\pi/a$ (oppure clicca il bordo di zona sul grafico) e attiva Sonda $v_p, v_g$: la tangente diventa piatta $(\\htmlData{q=v}{v_g} = 0)$, ma nella catena in alto vedi gli atomi oscillare vigorosamente in opposizione di fase come onda stazionaria.',
          'Attiva Aliasing ($k + G$) a $k = \\pi/2a$: l’onda gialla tratteggiata $k\' = k - G$ oscilla più in fretta nello spazio vuoto fra i siti, eppure tocca esattamente gli stessi spostamenti $\\htmlData{q=u}{u_n}$ sugli atomi. Poi passa a Born–von Kármán ($N$) e conta gli $N$ pallini verdi nella prima zona.',
          'Confronta i preset Piombo 1D (pesante e molle, banda bassa) e Carbonio 1D (leggero e rigido, banda altissima) per vedere come massa e molla spostano il tetto $\\htmlData{q=omega}{\\nu_{\\max}}$.'
        ]
      }
    ],
    details: {
      title: 'Dettagli formali',
      blocks: [
        {
          heading: 'Approssimazione armonica e legge di dispersione',
          paragraphs: [
            'Attorno ai siti di equilibrio $x_n^0 = n\\htmlData{q=a}{a}$, lo sviluppo del potenziale al secondo ordine definisce le costanti di forza $\\Phi(n,m) = \\left.\\partial^2 V/\\partial u_n\\partial u_m\\right|_0$, con simmetria $\\Phi(n,m) = \\Phi(m,n)$ e regola di somma nulla $\\sum_m \\Phi(n,m) = 0$ (una traslazione rigida non produce forze). L’approssimazione vale solo per piccoli spostamenti: i termini anarmonici sono trascurati, non assenti.',
            'A primi vicini con costante $\\htmlData{q=C}{C}$ e massa $\\htmlData{q=M}{M}$, l’equazione del moto $\\htmlData{q=M}{M}\\,\\htmlData{q=u}{\\ddot{u}_n} = \\htmlData{q=C}{C}(\\htmlData{q=u}{u_{n+1}} + \\htmlData{q=u}{u_{n-1}} - 2\\htmlData{q=u}{u_n})$ ammette soluzioni a onda piana $\\htmlData{q=u}{u_n}(t) = A e^{i(\\htmlData{q=k}{k}n\\htmlData{q=a}{a} - \\htmlData{q=omega}{\\omega}t)}$ con dispersione $\\htmlData{q=omega}{\\omega}(\\htmlData{q=k}{k}) = 2\\sqrt{\\htmlData{q=C}{C}/\\htmlData{q=M}{M}}\\,|\\sin(\\htmlData{q=k}{k}\\htmlData{q=a}{a}/2)|$. La catena 1D modella un solo ramo longitudinale; in 3D compaiono anche polarizzazioni trasversali.'
          ]
        },
        {
          heading: 'Limite acustico, bordo di zona e banda evanescente',
          paragraphs: [
            'Per $ka \\ll 1$ ($\\lambda \\gg a$), $\\sin(ka/2) \\simeq ka/2$ e il reticolo si comporta come un continuo elastico: $\\htmlData{q=omega}{\\omega} \\simeq \\htmlData{q=v}{v_s}|\\htmlData{q=k}{k}|$ con $\\htmlData{q=v}{v_s} = \\htmlData{q=a}{a}\\sqrt{\\htmlData{q=C}{C}/\\htmlData{q=M}{M}}$ e $\\htmlData{q=vp}{v_p} = \\htmlData{q=v}{v_g} = \\pm\\htmlData{q=v}{v_s}$.',
            'Al bordo $\\htmlData{q=k}{k} = \\pm\\pi/\\htmlData{q=a}{a}$ ($\\lambda = 2a$) si raggiunge la pulsazione di taglio $\\htmlData{q=omega}{\\omega_{\\max}} = 2\\sqrt{\\htmlData{q=C}{C}/\\htmlData{q=M}{M}}$ e $\\htmlData{q=v}{v_g} = 0$: l’onda è stazionaria ($u_n(t) = A(-1)^n\\cos\\omega_{\\max}t$, riflessione di Bragg), ma gli atomi non sono fermi e $|\\htmlData{q=vp}{v_p}| = \\frac{2}{\\pi}v_s \\neq 0$. Per $\\omega > \\omega_{\\max}$ non esiste $k$ reale: ponendo $k = \\pi/a + i\\kappa$ l’ampiezza decade esponenzialmente nello spazio come $e^{-\\kappa x}$ (onda evanescente, filtro passa-basso).'
          ]
        },
        {
          heading: 'Aliasing, prima zona di Brillouin e Born–von Kármán',
          paragraphs: [
            'Poiché l’onda è campionata solo nei siti discreti $x_n^0 = n\\htmlData{q=a}{a}$, sostituire $\\htmlData{q=k}{k}$ con $k\' = k + G$ ($G = 2\\pi m/a$, $m \\in \\mathbb{Z}$) moltiplica lo spostamento per $e^{i2\\pi mn} = 1$: i due vettori descrivono lo stesso moto fisico e la stessa $\\omega$. Tutte le onde distinte cadono nella prima zona di Brillouin $-\\pi/a < k \\le \\pi/a$ (i punti più vicini a $k = 0$ che a ogni altro $G$, ossia la cella di Wigner–Seitz del reticolo reciproco), con limite di Nyquist $\\lambda_{\\min} = 2a$.',
            'Chiudendo una catena di $N$ atomi ($L = Na$) ad anello con condizioni periodiche di Born–von Kármán ($u_{n+N} = u_n$), da $e^{ikNa} = 1$ seguono $k_j = \\frac{2\\pi}{Na}j$ con $-N/2 < j \\le N/2$. In zona cadono esattamente $N$ punti (poiché $-\\pi/a$ e $+\\pi/a$ coincidono per $G$), tanti quanti i gradi di libertà longitudinali; l’anello è un artificio matematico per eliminare gli effetti di bordo e per $N \\gg 1$ porta a $\\sum_k \\to \\frac{L}{2\\pi}\\int\\mathrm{d}k$.'
          ]
        }
      ]
    },
    foot: 'Fonte: dispensa Parte 6, Lezione 1 (§§1–5) e Lezione 3 (§13). Il preset «Metallo tipico» riproduce l’esempio del §3 ($M = 1{,}05\\times 10^{-25}\\,\\text{kg} \\approx 63\\,\\text{u}$, $a = 2{,}5\\,\\text{Å}$, $C = 20\\,\\text{N/m}$); «Piombo 1D» e «Carbonio 1D» sono esterni alla dispensa (profili 1D illustrativi).'
  }
} as const
