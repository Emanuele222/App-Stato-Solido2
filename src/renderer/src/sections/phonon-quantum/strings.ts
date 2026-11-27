/**
 * Testi in italiano della sezione «Modi quantizzati (fononi) e processi Umklapp».
 * Fonte: dispensa Parte 6, Lezione 2 §11 (eqq. 29–30) e Lezione 3 §§15–18 (Figg. 19–21, eqq. 40–42 e 46–51).
 *
 * Nota: RichText non supporta Markdown (** o *); usare solo testo semplice e LaTeX $...$.
 */
export const strings = {
  chapter: 'Fononi',
  title: 'Modi quantizzati e processi Umklapp',
  toolsLabel: 'Modalità della sezione: quantizzazione del modo o collisioni nella prima zona',
  asideLabel: 'Formule vive e guida alla sezione',

  modes: {
    quantization: 'Quantizzazione del modo',
    quantizationTitle: 'Confronto oscillatore quantistico/classico, punto zero e statistica di Bose–Einstein',
    umklapp: 'Collisioni 1BZ (N / Umklapp)',
    umklappTitle: 'Somma dei quasi-impulsi in 1BZ: processi Normali (G = 0) e Umklapp (G ≠ 0)'
  },

  quantSource: {
    label: 'Stato del modo',
    level: 'Livello puro n',
    thermal: 'Bagno termico T'
  },

  quantParams: {
    n: 'Numero di fononi n nel modo',
    temperatureK: 'Temperatura T del bagno termico',
    freqThz: 'Frequenza ν del modo normale'
  },

  umklappParams: {
    k1Frac: 'Vettore d’onda entrante k₁',
    k2Frac: 'Vettore d’onda entrante k₂'
  },

  presets: {
    label: 'Preset',
    free: 'Libero',
    quantNote: 'Parametri del metallo tipico da dispensa §§3, 18.4 (M = 63,2 u, a = 2,50 Å)',
    umklappNote: 'Dispersione della catena monatomica (§3) con esempio §16.2'
  },

  quantScene: {
    oscillatorTag: 'Oscillatore del modo: potenziale V(x) e densità P(x)',
    oscillatorAria: 'Confronto tra distribuzione quantistica Pn(x), classica Pcl(x) e livelli energetici En nella parabola armonica',
    oscillatorHintLevel: (nVal: number, tunnelPct: string): string =>
      `n = ${nVal} · penetrazione proibita ${tunnelPct}%`,
    oscillatorHintThermal: (nBarStr: string, tVal: number): string =>
      `T = ${tVal} K · occupazione media $\\bar{n}$ = ${nBarStr}`,
    chainTag: 'Catena vibrante sincronizzata nel modo quantizzato',
    chainAria: 'Catena atomica animata con ampiezza proporzionale a √(2n+1) che mostra il moto di punto zero',
    chainHintZp: (dxStr: string, pctStr: string): string =>
      `punto zero $\\Delta x_{\\mathrm{zp}}$ = ${dxStr} Å (${pctStr}% di $a$, amplificato per visibilità)`,
    chainHintRms: (dxStr: string, pctStr: string): string =>
      `ampiezza RMS $\\Delta x_{\\mathrm{rms}}$ = ${dxStr} Å (${pctStr}% di $a$, amplificata)`,
    legendPn: '$P_n(x)$',
    legendP0: '$P_0(x)$ ($n = 0$)',
    legendThermal: '$\\langle P(x)\\rangle_T$',
    legendPcl: '$P_{\\mathrm{cl}}(x)$',
    legendPclThermal: '$P_{\\mathrm{cl}}(x)$ a $\\langle E\\rangle$',
    legendTunnel: 'tunnel $|x| > x_{\\mathrm{cl}}$',
    legendPotential: '$V(x), E_n$',
    legendAtoms: 'atomi $M$',
    legendSprings: 'molle $C$',
    legendWave: 'profilo $\\Delta x_{\\mathrm{rms}}$',
    legendEnvLevel: 'inviluppo $\\sqrt{2n+1}$',
    legendEnvThermal: 'inviluppo $\\sqrt{2\\bar{n}+1}$',
    bathTitle: 'Pesi $p_n(T)$',
    bathAria: 'Distribuzione dei pesi termici p_n(T)',
    potentialLabel: 'V(x) [ħω]',
    probLabel: 'P(x)·a_{ho}',
    xAxisLabel: 'x / a_{ho}'
  },

  umklappScene: {
    zoneTag: 'Conservazione del quasi-impulso nella 1BZ (−π/a, π/a]',
    zoneAria: 'Diagramma vettoriale nella prima zona di Brillouin con k1, k2, somma k1+k2, vettore reciproco G e risultante k3',
    zoneHint: 'Trascina le punte di $k_1$ o $k_2$ sul grafico (oppure usa ←/→)',
    dispersionTag: 'Effetto sulla velocità di gruppo lungo ν(k)',
    dispersionAria: 'Curva di dispersione fononica con marcatori k1, k2, k3 e frecce di velocità di gruppo',
    dispersionHint: 'Clicca o trascina nella 1BZ per spostare il vettore più vicino',
    badgeNormal: 'Processo Normale (G = 0)',
    badgeUmklappReversed: 'Processo Umklapp (G ≠ 0) · flusso invertito',
    badgeUmklapp: 'Processo Umklapp (G ≠ 0)',
    legendK1: '$k_1$ entrante',
    legendK2: '$k_2$ entrante',
    legendKSum: '$k_1 + k_2$',
    legendG: 'ripiegamento $-G$',
    legendK3: '$k_3$ risultante',
    legendCurve: 'dispersione $\\nu(k)$',
    legendVg: 'velocità $v_g(k_i)$',
    yAxis: '$ν$ (THz)'
  },

  formula: {
    title: 'Formula viva',
    ariaQuantLevel: 'Livelli energetici dell’oscillatore armonico quantistico E_n = (n + 1/2) ħω',
    ariaQuantThermal: 'Occupazione media di Bose–Einstein con potenziale chimico nullo',
    ariaUmklapp: 'Conservazione del quasi-impulso modulo un vettore del reticolo reciproco G'
  },

  values: {
    levelEnergy: 'Energia del modo',
    scales: 'Scale oscillatore',
    tunneling: 'Effetto tunnel',
    tunnelingNote: (nVal: number): string =>
      nVal === 0 ? 'valore esatto $\\operatorname{erfc}(1) \\approx 0{,}1573$ (§18.3)' : 'frazione nella regione $|x| > x_{\\mathrm{cl}}$',
    zeroPointRatio: 'Punto zero / passo',
    thermalOccupation: 'Bose–Einstein (μ = 0)',
    thermalScale: 'Scale termiche',
    processKind: 'Processo',
    normalLabel: 'Normale (N, G = 0)',
    umklappLabel: 'Umklapp (U, G ≠ 0)',
    vectors: 'Vettori 1BZ',
    groupVelocities: 'Velocità di gruppo',
    flowReversedNote: 'flusso invertito: $v_g(k_3)$ ha segno opposto a $v_g(k_1), v_g(k_2)$',
    flowNormalNote: 'quasi-impulso totale conservato esattamente',
    energyCheck: 'Bilancio ħω',
    energyNote: 'Nell’urto reale a tre fononi occorre anche $\\omega_1 + \\omega_2 = \\omega_3$ (in 1D a ramo singolo queste tre frequenze sono solo cinematiche, §16.2).'
  },

  theory: {
    title: 'Guida alla sezione',
    quantBlocks: [
      {
        heading: 'L’idea',
        paragraphs: [
          'Nell’approssimazione armonica ciascun modo normale del cristallo si comporta come un oscillatore armonico quantistico indipendente di energia $\\htmlData{q=E}{E}_{\\htmlData{q=psi}{n}} = (\\htmlData{q=psi}{n} + \\tfrac{1}{2})\\hbar\\htmlData{q=omega}{\\omega}$: aggiungere un fonone significa salire di un gradino $\\hbar\\htmlData{q=omega}{\\omega}$. In alto confronti la densità quantistica $\\htmlData{q=psi}{P_n}(x)$ con quella classica $\\htmlData{q=Ek}{P_{\\mathrm{cl}}}(x)$; in basso vedi la catena oscillare già nello stato fondamentale $\\htmlData{q=psi}{n} = 0$.'
        ]
      },
      {
        heading: 'Come intervengono i parametri',
        paragraphs: [
          'Scegli tra stato puro $\\htmlData{q=psi}{n}$ e bagno termico a temperatura $\\htmlData{q=T}{T}$: aumentando $\\htmlData{q=psi}{n}$ crescono i nodi di $\\htmlData{q=psi}{\\Psi_n}$ e i picchi esterni si addossano all’inviluppo a U di $\\htmlData{q=Ek}{P_{\\mathrm{cl}}}$. Nel bagno termico, poiché i fononi si creano e si distruggono negli urti, il potenziale chimico è nullo ($\\mu = 0$); alzare $\\htmlData{q=omega}{\\nu}$ stringe $\\htmlData{q=psi}{a_{\\mathrm{ho}}}$ e congela $\\htmlData{q=T}{\\bar{n}}$.'
        ]
      },
      {
        heading: 'Cosa provare',
        paragraphs: [
          'Parti dal preset Punto zero (n = 0): al centro $\\htmlData{q=psi}{P_0}(x)$ è massima mentre $\\htmlData{q=Ek}{P_{\\mathrm{cl}}}(x)$ è minima, il $15{,}7\\%$ della probabilità penetra oltre i punti di inversione $\\pm\\htmlData{q=Ek}{x_{\\mathrm{cl}}}$ e la catena mostra l’oscillazione di punto zero $\\htmlData{q=u}{\\Delta x_{\\mathrm{zp}}} \\approx 1{,}7\\%$ di $a$.',
          'Passa a Limite Bohr ($\\htmlData{q=psi}{n} = 20$): i $21$ massimi di $\\htmlData{q=psi}{P_{20}}$ seguono fedelmente l’inviluppo classico a U.',
          'Attiva Bagno termico $300\\text{ K}$ e poi Modo congelato $30\\text{ K}$ per vedere i pesi geometrici $\\htmlData{q=T}{p_n(T)}$ lungo la scala dei livelli e il congelamento quando $k_B\\htmlData{q=T}{T} \\ll \\hbar\\htmlData{q=omega}{\\omega}$.'
        ]
      }
    ],
    umklappBlocks: [
      {
        heading: 'L’idea',
        paragraphs: [
          'In un reticolo discreto l’invarianza traslazionale vale solo per multipli di $\\htmlData{q=a}{a}$, quindi il quasi-impulso si conserva modulo un vettore reciproco $\\htmlData{q=a}{G}$: $\\htmlData{q=k}{k_1} + \\htmlData{q=k}{k_2} = \\htmlData{q=omega}{k_3} + \\htmlData{q=a}{G}$ (eq. 40). Se la somma resta nella prima zona di Brillouin il processo è Normale ($\\htmlData{q=a}{G} = 0$); se esce, il reticolo assorbe un rinculo $\\hbar\\htmlData{q=a}{G}$ ripiegando il vettore in zona di $-\\htmlData{q=a}{G}$ (processo Umklapp, «trasporto a ritroso»), l’unico meccanismo che frena una corrente di calore in un cristallo perfetto.'
        ]
      },
      {
        heading: 'Come intervengono i parametri',
        paragraphs: [
          'Trascinando $\\htmlData{q=k}{k_1}$ e $\\htmlData{q=k}{k_2}$ (o con gli slider) sposti in testa-coda i due vettori nella striscia in alto e i corrispondenti punti sulla curva $\\htmlData{q=omega}{\\nu}(k)$ in basso. Appena $|\\htmlData{q=k}{k_1} + \\htmlData{q=k}{k_2}|$ supera $\\pi/\\htmlData{q=a}{a}$, scatta la freccia $-\\htmlData{q=a}{G}$ e vedi cambiare il segno della velocità di gruppo $\\htmlData{q=v}{v_g}(\\htmlData{q=omega}{k_3})$ quando i fononi entranti sono concordi.'
        ]
      },
      {
        heading: 'Cosa provare',
        paragraphs: [
          'Con il preset Umklapp dispensa ($0{,}7 + 0{,}6\\,\\pi/a$), entrambi i fononi entranti hanno $\\htmlData{q=v}{v_g} > 0$, ma la somma $1{,}3\\,\\pi/a$ esce di zona e sottraendo $\\htmlData{q=a}{G} = 2\\pi/a$ si torna a $\\htmlData{q=omega}{k_3} = -0{,}7\\,\\pi/a$ con $\\htmlData{q=v}{v_g} < 0$: il flusso di energia si inverte.',
          'Confrontalo con Normale ($0{,}3 + 0{,}4\\,\\pi/a$): la somma resta dentro la 1BZ, $\\htmlData{q=a}{G} = 0$ e il flusso continua nello stesso verso, quindi i processi Normali non frenano la corrente di calore.'
        ]
      }
    ],
    details: {
      title: 'Dettagli formali',
      blocks: [
        {
          heading: 'Oscillatore quantistico, ricorrenza di Hermite e limite classico',
          paragraphs: [
            'Con coordinata adimensionale $u = x/\\htmlData{q=psi}{a_{\\mathrm{ho}}}$ e $\\htmlData{q=psi}{a_{\\mathrm{ho}}} = \\sqrt{\\hbar / \\htmlData{q=M}{M}\\htmlData{q=omega}{\\omega}}$, le autofunzioni normalizzate sono $\\htmlData{q=psi}{\\Psi_n}(x) = (2^n n!\\sqrt{\\pi}\\,\\htmlData{q=psi}{a_{\\mathrm{ho}}})^{-1/2} H_n(u)e^{-u^2/2}$ con livelli $\\htmlData{q=E}{E}_n = (n + \\tfrac{1}{2})\\hbar\\htmlData{q=omega}{\\omega}$ (eq. 29 e eq. 49). Nel codice la famiglia ortonormale $\\psi_n(u) = \\sqrt{a_{\\mathrm{ho}}}\\Psi_n(x)$ usa la ricorrenza stabile $\\psi_k(u) = \\sqrt{2/k}\\,u\\,\\psi_{k-1}(u) - \\sqrt{(k-1)/k}\\,\\psi_{k-2}(u)$ senza fattoriali.',
            'Classicamente alla stessa energia $\\tfrac{1}{2}M\\omega^2 x_{\\mathrm{cl}}^2 = (n+\\tfrac{1}{2})\\hbar\\omega$ corrisponde l’ampiezza $\\htmlData{q=Ek}{x_{\\mathrm{cl}}} = \\htmlData{q=psi}{a_{\\mathrm{ho}}}\\sqrt{2n+1}$ (indicata con $a$ nell’eq. (46) della dispensa, qui scritta $x_{\\mathrm{cl}}$ per distinguerla dal passo reticolare $a$) e la densità $\\htmlData{q=Ek}{P_{\\mathrm{cl}}}(x) = (\\pi\\sqrt{x_{\\mathrm{cl}}^2 - x^2})^{-1}$ per $|x| < x_{\\mathrm{cl}}$. In modalità termica il riferimento tratteggiato $\\htmlData{q=Ek}{P_{\\mathrm{cl}}}$ e $\\pm x_{\\mathrm{cl,eff}} = a_{\\mathrm{ho}}\\sqrt{2\\bar{n}+1}$ corrispondono a un oscillatore classico alla stessa energia media $\\langle E\\rangle$. Per $n = 0$ lo stato fondamentale ha minima indeterminazione $\\Delta x\\Delta p = \\hbar/2$ (con $\\Delta x_{\\mathrm{zp}} = a_{\\mathrm{ho}}/\\sqrt{2}$) e probabilità nella regione proibita $\\int_{|x|>a_{\\mathrm{ho}}} P_0\\,\\mathrm{d}x = \\operatorname{erfc}(1) \\approx 0{,}1573$ (eq. 50–51).'
          ]
        },
        {
          heading: 'Statistica di Bose–Einstein (μ = 0) e chiarimenti sul fonone',
          paragraphs: [
            'Il numero totale di fononi non si conserva (si creano e si distruggono negli urti anarmonici), quindi il potenziale chimico è $\\mu = 0$ (eq. 45). In equilibrio a temperatura $\\htmlData{q=T}{T}$ la probabilità del livello $n$ è $p_n(T) = (1 - e^{-\\hbar\\omega/k_B T})e^{-n\\hbar\\omega/k_B T}$ e il numero medio di occupazione è $\\htmlData{q=T}{\\bar{n}}(T) = [\\exp(\\hbar\\omega/k_B T) - 1]^{-1}$ (eq. 30).',
            'Attenzione a tre precisazioni della dispensa (§11, §15.3): (1) $\\hbar\\omega$ è l’energia del quanto del modo, non «il fonone» come onda separata; (2) il fonone è un’eccitazione collettiva dell’intero cristallo e non possiede spin in senso proprio: la statistica bosonica nasce dalla scala dei livelli dell’oscillatore, non dal teorema spin–statistica; (3) $\\hbar\\mathbf{k}$ è un quasi-impulso definito a meno di $\\hbar\\mathbf{G}$, non quantità di moto fisica del reticolo.'
          ]
        },
        {
          heading: 'Conservazione del quasi-impulso, urti e–ph ed energia',
          paragraphs: [
            'Dall’invarianza per traslazioni reticolari discrete segue la regola di selezione $\\sum_n e^{i\\Delta k\\,na} = N\\sum_G \\delta_{\\Delta k, G}$ (eq. 41), cioè $\\sum \\mathbf{p} = \\sum \\mathbf{p}\' + \\hbar\\mathbf{G}$ (eq. 40, ossia $\\mathbf{k}_1 + \\mathbf{k}_2 = \\mathbf{k}_3 + \\mathbf{G}$ con freccia di ripiegamento $-\\mathbf{G}$ in Fig. 19). Per uno scattering elettrone–fonone con assorbimento ($+$) o emissione ($-$) vale lo stesso segno in entrambe le equazioni: $E(\\mathbf{k}_f) = E(\\mathbf{k}) \\pm \\hbar\\omega(\\mathbf{q})$ e $\\mathbf{k}_f = \\mathbf{k} \\pm \\mathbf{q} + \\mathbf{G}$ (eq. 42).',
            'Solo i processi Umklapp ($\\mathbf{G} \\neq \\mathbf{0}$) rilassano il flusso netto di quasi-impulso e generano resistenza termica intrinseca in un cristallo perfetto (§16.2). In un urto reale a tre fononi occorre inoltre verificare la conservazione dell’energia $\\omega_1 + \\omega_2 = \\omega_3$, che seleziona le terne risonanti ammesse dalla dispersione.'
          ]
        }
      ]
    },
    foot: 'Fonte: dispensa Parte 6, Lezione 2 (§11 eqq. 29–30) e Lezione 3 (§§15–18, Figg. 19–21, eqq. 40–42 e 46–51). Scala atomica di riferimento dal §3 e §18.4 ($M = 1{,}05\\times 10^{-25}\\,\\text{kg} \\approx 63{,}2\\,\\text{u}$, $a = 2{,}50\\,\\text{Å}$, $C = 20\\,\\text{N/m}$).'
  }
} as const
