/**
 * Testi in italiano della sezione «Pacchetti d'onda: velocità di fase e di gruppo».
 * Fonte unica: dispensa Parte 6, Lezione 2 §6 (pp. 14–17, Figg. 7–9) e §12 (pp. 29–30).
 * Nota: RichText interpreta solo le formule tra $...$ (niente sintassi Markdown ** o *).
 */
import type { WavepacketRegime } from '../../physics'

export const strings = {
  chapter: 'Fononi',
  title: 'Pacchetti d’onda: fase e gruppo',
  toolsLabel: 'Strumenti sul pacchetto d’onda',
  asideLabel: 'Formule vive e guida alla sezione',

  tools: {
    comoving: 'Riferimento comovente ($\\xi = x - v_g t$)',
    comovingTitle: 'Mantiene il centro dell’inviluppo fisso al centro per osservare lo scorrimento delle creste e l’allargamento puro',
    initialProfile: 'Profilo iniziale $t = 0$',
    initialProfileTitle: 'Mostra tratteggiato il profilo iniziale dell’inviluppo a t = 0 (Fig. 7)'
  },

  regimeControl: {
    label: 'Regime di dispersione'
  },

  params: {
    kFrac: 'Vettore d’onda centrale k₀',
    sigma0InA: 'Larghezza iniziale σ₀'
  },

  presets: {
    label: 'Scenari (§6)',
    free: 'Libero',
    item: (name: string, kFracStr: string, sigStr: string): string =>
      `${name} (k₀ = ${kFracStr} π/a, σ₀ = ${sigStr} a)`
  },

  playback: {
    reset: 'Riavvia impulso (t = 0)',
    group: 'Controlli riproduzione pacchetto d’onda'
  },

  scene: {
    waveTag: 'Spazio reale — pacchetto Ψ(x, t) e atomi',
    waveAria: 'Animazione del pacchetto d’onda con inviluppo a velocità di gruppo, cresta evidenziata a velocità di fase, atomi discreti campionati e curva di allargamento σ(t)/σ₀',
    dispersionTag: 'Dispersione ν(k) = ω(k)/2π',
    dispersionAria: 'Diagramma di dispersione con corda v_p dall’origine, tangente v_g in k₀ e inviluppo spettrale |Φ(k)|² di semi-larghezza Δk',
    dispersionHint: 'Clicca/trascina k₀ sulla curva (←/→ per spostare)',
    yAxis: 'ν (THz)',
    xAxis: 'k (Å⁻¹)',
    spreadAria: 'Grafico compatto del rapporto di allargamento σ(t)/σ₀ nel tempo',
    comovingBadge: 'ξ = x − v_g t',
    labBadge: 'Rif. laboratorio',
    legendWaveAria: 'Legenda del pacchetto d’onda',
    legendDispersionAria: 'Legenda della curva di dispersione',
    legendEnvelope: 'inviluppo $\\pm F$ ($v_g$)',
    legendCarrier: 'portante $\\operatorname{Re}\\Psi$',
    legendCrest: 'cresta ($v_p$)',
    legendInitial: 'profilo $t = 0$',
    legendAtoms: 'atomi a passo $a$',
    legendCurve: (regime: WavepacketRegime): string => {
      switch (regime) {
        case 'linear':
          return 'lineare $\\nu = v_s|k|/2\\pi$'
        case 'acoustic':
          return 'acustico $\\nu(k)$'
        case 'optical':
          return 'ottico $\\nu_+(k)$'
        case 'quadratic':
          return 'particella libera $\\nu \\propto k^2$'
      }
    },
    legendVp: 'corda $v_p$ ($\\nu/k = v_p/2\\pi$)',
    legendVg: 'tangente $v_g$ ($\\mathrm{d}\\nu/\\mathrm{d}k = v_g/2\\pi$)',
    legendSpectrum: 'spettro $|\\Phi(k)|^2$ ($\\Delta k$)',
    legendLinearRef: 'retta suono $v_s|k|/2\\pi$',
    noteNoLattice: 'Mezzo continuo (particella libera: nessun reticolo discreto)',
    noteStandingEdge: 'Bordo zona: $v_g = 0$ (onda stazionaria), ma $\\omega\'\' \\neq 0$ (si allarga)',
    noteBackwardOpt: 'Ramo ottico: inviluppo all’indietro ($v_g < 0$) rispetto alle creste ($v_p > 0$)',
    noteBackwardOptNeg: 'Ramo ottico ($k_0 < 0$): inviluppo $v_g > 0$ opposto alle creste $v_p < 0$',
    noteLinearExact: 'Dispersione lineare: $v_p = v_g$, nessuna deformazione',
    noteQuadraticDouble: 'Particella libera: $v_g = 2v_p$, allargamento rapido',
    stateHint: (kFracStr: string, sigStr: string): string => `k₀ = ${kFracStr} π/a · σ₀ = ${sigStr} a`
  },

  formula: {
    title: 'Formula viva',
    aria: 'Pacchetto d’onda come integrale di Fourier, velocità di fase e di gruppo e legge di allargamento gaussiano'
  },

  values: {
    regimeLabel: 'Regime',
    regimeNames: {
      linear: 'Lineare non dispersivo',
      acoustic: 'Ramo acustico (monatomico)',
      optical: 'Ramo ottico (biatomico)',
      quadratic: 'Particella libera (ω ∝ k²)'
    } satisfies Record<WavepacketRegime, string>,
    centerState: 'Centro spettrale',
    velocities: 'Velocità',
    originCuspLimit: 'limiti $k_0 \\to 0^\\pm$: $v_p, v_g \\to \\pm v_s$',
    originCuspNote: 'In $k_0 = 0$ il modulo $|k|$ forma un punto angoloso: le onde a destra e a sinistra hanno velocità $\\pm v_s$.',
    opticalOriginNote: 'In $k_0 = 0$ il ramo ottico ha un massimo liscio ($v_g = 0$), mentre la velocità di fase $v_p = \\omega_+(0)/k_0$ diverge ($\\to \\pm\\infty$).',
    quadraticOriginNote: 'In $k_0 = 0$ la parabola è liscia ($v_p = v_g = 0$): il pacchetto è fermo ma si allarga per $\\omega\'\' = \\hbar/m_0 > 0$.',
    edgeNoteAcoustic: 'Al bordo di zona $k_0 = \\pm\\pi/a$ si forma un’onda stazionaria ($v_g = 0$, $v_p \\neq 0$), ma la curvatura $\\omega\'\' = -a^2\\omega_{\\max}/4 \\neq 0$: il pacchetto resta fermo e si allarga.',
    edgeNoteOptical: 'Al bordo di zona $k_0 = \\pm\\pi/a$ (punto B, minimo del ramo ottico) si forma un’onda stazionaria ($v_g = 0$, $v_p \\neq 0$) con curvatura positiva $\\omega_+\'\' > 0$: il pacchetto resta fermo e si allarga.',
    opticalOppositeNote: 'Segni opposti: $v_g$ e $v_p$ sono grandezze indipendenti; l’inviluppo viaggia in verso opposto alle creste.',
    quadraticRatioNote: 'Nella dispersione quadratica $\\omega \\propto k^2$ vale esattamente $v_g = 2v_p$ (al contrario dei fononi quasi lineari).',
    widths: 'Larghezze',
    curvature: 'Curvatura ω\'\'',
    noSpreading: 'ω\'\' = 0 → nessuno spreading (σ(t) = σ₀)',
    inflectionZeroSpread: 'Punto di flesso ($\\omega\'\' \\approx 0$): nessuno spreading al secondo ordine.',
    originCuspCurvatureNote: 'Punto angoloso in $k_0 = 0$: l’impulso si divide nelle due componenti $\\pm v_s$.'
  },

  theory: {
    title: 'Guida alla sezione',
    blocks: [
      {
        heading: 'L’idea',
        paragraphs: [
          'Un’onda piana isolata riempie tutto il cristallo e non trasporta un segnale localizzato. Sovrapponendo più onde attorno a $\\htmlData{q=k}{k_0}$ si forma un pacchetto $\\htmlData{q=psi}{\\Psi}(x,t)$: le creste interne (pallino viola) corrono alla velocità di fase $\\htmlData{q=vp}{v_p} = \\omega_0/k_0$ (pendenza della corda dall’origine), mentre l’inviluppo che trasporta energia (pallino verde acqua) avanza alla velocità di gruppo $\\htmlData{q=v}{v_g} = \\mathrm{d}\\omega/\\mathrm{d}k$ (pendenza della tangente).'
        ]
      },
      {
        heading: 'Come intervengono i parametri',
        paragraphs: [
          'I quattro pulsanti di regime cambiano la curva $\\nu(k)$: lineare non dispersivo, ramo acustico di catena monatomica, ramo ottico biatomico (dove per $k_0 > 0$ la pendenza si inverte) e parabola quadratica da particella libera (mezzo continuo, senza reticolo discreto).',
          'Lo slider $\\htmlData{q=k}{k_0}$ sposta il centro dello spettro lungo la curva (puoi anche trascinarlo sul grafico) cambiando subito corda ($\\htmlData{q=vp}{v_p}$) e tangente ($\\htmlData{q=v}{v_g}$). Lo slider $\\htmlData{q=u}{\\sigma_0}$ fissa la larghezza iniziale nello spazio: restringere $\\htmlData{q=u}{\\sigma_0}$ allarga lo spettro $\\htmlData{q=k}{\\Delta k}$ e accelera l’allargamento $\\sigma(t)/\\sigma_0$ dove la curva ha curvatura $\\omega\'\' \\neq 0$.',
          'I due strumenti in alto fissano l’osservatore sul centro dell’inviluppo (Riferimento comovente) e lasciano visibile il Profilo iniziale $t = 0$ tratteggiato.'
        ]
      },
      {
        heading: 'Cosa provare',
        paragraphs: [
          'Confronta lo scenario Regime lineare ($\\htmlData{q=vp}{v_p} = \\htmlData{q=v}{v_g}$, nessun allargamento) con Ramo ottico a pendenza negativa: per $k_0 > 0$ vedrai l’inviluppo arretrare $(\\htmlData{q=v}{v_g} < 0)$ mentre le creste scorrono in avanti $(\\htmlData{q=vp}{v_p} > 0)$. Attiva Riferimento comovente per vedere le creste attraversare l’inviluppo.',
          'Seleziona Bordo di zona $k_0 = \\pi/a$ con Profilo iniziale $t = 0$ attivo: il centro dell’inviluppo resta fermo ($\\htmlData{q=v}{v_g} = 0$), gli atomi campionati oscillano comunque in opposizione di fase ($\\lambda = 2a$) e il pacchetto si abbassa allargandosi perché la curvatura $\\omega\'\'$ non è nulla.',
          'Porta $\\htmlData{q=u}{\\sigma_0}$ al minimo ($1{,}5\\,a$) sul ramo acustico dispersivo o su Particella libera ($\\htmlData{q=v}{v_g} = 2\\htmlData{q=vp}{v_p}$): osserva la campana magenta $|\\Phi(k)|^2$ allargarsi in $k$ mentre $\\sigma(t)/\\sigma_0$ sale rapidamente.'
        ]
      }
    ],
    details: {
      title: 'Dettagli formali',
      blocks: [
        {
          heading: 'Integrale di Fourier, sviluppo lineare e principio di indeterminazione',
          paragraphs: [
            'Sovrapponendo onde piane con peso spettrale $\\htmlData{q=psi}{\\Phi}(k)$ centrato in $\\htmlData{q=k}{k_0}$ di semi-larghezza $\\htmlData{q=k}{\\Delta k}$, si scrive $\\htmlData{q=psi}{\\Psi}(x,t) = \\frac{1}{\\sqrt{2\\pi}}\\int_{-\\infty}^{+\\infty} \\Phi(k)\\,e^{i[kx - \\omega(k)t]}\\,\\mathrm{d}k$. Sviluppando $\\omega(k) \\simeq \\omega_0 + \\htmlData{q=v}{v_g}(k - k_0)$ al primo ordine emerge $\\Psi(x,t) \\simeq e^{i(k_0 x - \\omega_0 t)}\\htmlData{q=u}{F}(x - v_g t)$.',
            'La portante viaggia con velocità di fase $\\htmlData{q=vp}{v_p} = \\omega_0/k_0$ (corda dall’origine su $\\omega(k)$), mentre l’inviluppo $\\htmlData{q=u}{F}$ trasporta energia e informazione alla velocità di gruppo $\\htmlData{q=v}{v_g} = \\mathrm{d}\\omega/\\mathrm{d}k$ (tangente in $k_0$). Per una gaussiana $\\Phi(\\kappa) \\propto e^{-\\kappa^2/4s^2}$ con $\\kappa = k - k_0$ e $s = \\Delta k$, vale $\\htmlData{q=u}{\\sigma_0} = 1/(2s)$, cioè $\\htmlData{q=u}{\\sigma_0}\\,\\htmlData{q=k}{\\Delta k} = 1/2$ ($\\Delta x\\,\\Delta k \\ge 1/2$): un impulso stretto nello spazio richiede uno spettro largo in $k$.'
          ]
        },
        {
          heading: 'Curvatura $\\omega\'\'$, legge di allargamento $\\sigma(t)$ e quattro regimi',
          paragraphs: [
            'Includendo il termine quadratico $\\frac{1}{2}\\omega\'\'\\kappa^2$ nello sviluppo di $\\omega(k)$ attorno a $k_0$, l’inviluppo gaussiano conserva l’area $\\int|\\Psi|^2\\,\\mathrm{d}x$ e si allarga secondo $\\htmlData{q=u}{\\sigma(t)} = \\sigma_0\\sqrt{1 + (\\omega\'\' t / 2\\sigma_0^2)^2}$ (il picco scende mentre $\\sigma(t)$ cresce). Nei tre regimi reticolari l’onda fisica ha significato solo sui siti discreti $x_n^0 = n\\htmlData{q=a}{a}$ campionati sotto l’inviluppo.',
            'I quattro regimi: (a) lineare ($\\omega = v_s|k|$): $v_p = v_g = \\pm v_s$ e $\\omega\'\' = 0$, nessuna deformazione; (b) ramo acustico monatomico: per $k_0 a \\ll 1$ vale $\\omega \\simeq v_s|k|[1 - (ka)^2/24]$ (allargamento lento), mentre a $k_0 = \\pm\\pi/a$ si ha $v_g = 0$ e $v_p = \\pm(2/\\pi)v_s \\neq 0$ con $\\omega\'\'(\\pi/a) = -a^2\\omega_{\\max}/4 \\neq 0$; (c) ramo ottico biatomico $\\omega_+(k)$: scende da $k = 0$ verso $\\pi/a$, dando $v_g < 0$ e $v_p > 0$ per $k_0 > 0$; (d) particella libera ($\\hbar\\omega = \\hbar^2 k^2/2m_0$): confronto didattico con $\\omega\'\' = \\hbar/m_0 > 0$ e $v_g = 2v_p$.'
          ]
        },
        {
          heading: 'Tre errori tipici da evitare (§12)',
          paragraphs: [
            '1) Non identificare la velocità del segnale con $v_p = \\omega/k$: l’energia viaggia sempre a $v_g$, che può essere nulla o opposta a $v_p$. 2) $v_g = 0$ al bordo zona non implica atomi fermi (oscillano in opposizione di fase a $\\lambda = 2a$) né assenza di spreading ($\\omega\'\'(\\pi/a) \\neq 0$, quindi il pacchetto resta fermo ma si allarga). 3) La dispersione fononica a grande lunghezza d’onda è quasi lineare, non quadratica come quella degli elettroni liberi (e in $k_0 = 0$ sul ramo lineare $|k|$ ha un punto angoloso, dove lo sviluppo liscio di Taylor non si applica perché le componenti $k > 0$ e $k < 0$ viaggiano a $\\pm v_s$).'
          ]
        }
      ]
    },
    foot: 'Fonte: dispensa Parte 6, Lezione 2 §6 (pp. 14–17, Figg. 7–9) e §12 (pp. 29–30). Parametri di riferimento dalla dispensa: metallo tipico (§3: a = 2,50 Å, M = 1,05 × 10⁻²⁵ kg ≈ 63,2 u, C = 20 N/m) per i regimi lineare e acustico; coppia Na–Cl (§8: a = 5,64 Å, m = 23 u, M = 35,5 u, C = 10 N/m) per il ramo ottico; massa elettronica m₀ (con passo di scala a = 2,50 Å su k₀) per il confronto quadratico (§6.3).'
  }
} as const
