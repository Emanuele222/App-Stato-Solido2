/**
 * Testi in italiano della sezione «Catena biatomica, gap fononico e luce infrarossa».
 * Fonte unica: dispensa Parte 6, Lezione 2 §§7–8, §10.3, §12 e Lezione 4 §24, §26.
 * Nota: RichText interpreta solo le formule tra $...$ (niente sintassi Markdown ** o *).
 */
export const strings = {
  chapter: 'Fononi',
  title: 'Catena biatomica, gap e luce IR',
  toolsLabel: 'Strumenti sulla catena biatomica',
  asideLabel: 'Formule vive e guida alla sezione',

  tools: {
    infrared: 'Luce infrarossa',
    infraredTitle: 'Mostra la retta della luce infrarossa (pendenza esagerata) e l’accoppiamento al dipolo ionico del ramo ottico',
    folding: 'Confronto $M = m$',
    foldingTitle: 'Estende il grafico a ±2π/a e sovrappone la catena monatomica di passo a/2 con massa media (M + m)/2 ripiegata in zona',
    matrix: 'Matrice $\\mathbf{D}(k)$',
    matrixTitle: 'Mostra la matrice dinamica 2×2 e confronta autovalori e autovettori diretti con l’equazione di dispersione'
  },

  params: {
    a: 'Passo reticolare a',
    massHeavyAmu: 'Massa M (siti pari)',
    massLightAmu: 'Massa m (siti dispari)',
    springC: 'Costante elastica C'
  },

  presets: {
    label: 'Preset',
    free: 'Libero',
    note: 'Coppia Na–Cl da dispensa §8 (illustrativa 1D); rapporto M = 2m da Fig. 11–12; M = m e Li–I illustrativi esterni',
    item: (name: string, aStr: string, mHStr: string, mLStr: string, cStr: string): string =>
      `${name} (a = ${aStr} Å, M = ${mHStr} u, m = ${mLStr} u, C = ${cStr} N/m)`
  },

  quickModes: {
    group: 'Quattro modi caratteristici della catena biatomica',
    acZero: 'Ac. 0',
    acZeroTitle: 'Ramo acustico a k = 0: α = 1, traslazione rigida della cella',
    optZero: 'Ott. 0',
    optZeroTitle: 'Ramo ottico a k = 0: α = −M/m, centro di massa fermo, dipolo oscillante',
    edgeC: 'C (π/a)',
    edgeCTitle: 'Punto C al bordo zona (ramo acustico): oscilla solo la massa più pesante',
    edgeB: 'B (π/a)',
    edgeBTitle: 'Punto B al bordo zona (ramo ottico): oscilla solo la massa più leggera'
  },

  scene: {
    chainTag: 'Spazio reale — catena biatomica 1D',
    chainAria: 'Animazione della catena biatomica con masse M e m collegate da molle C, centro di massa di cella e spostamenti longitudinali',
    dispersionTag: 'Dispersione ν(k) = ω(k)/2π',
    dispersionAria: 'Diagramma di dispersione della catena biatomica con ramo acustico, ramo ottico, gap fononico e punti B e C',
    dispersionHint: 'Clicca/trascina su un ramo (←/→ cambia k, ↑/↓ cambia ramo)',
    yAxis: 'ν (THz)',
    xAxis: 'k (Å⁻¹)',
    gapBand: 'gap fononico',
    lightCrossingLabel: 'incrocio IR (k ≈ 0)',
    legendChainAria: 'Legenda della catena biatomica',
    legendDispersionAria: 'Legenda del diagramma di dispersione',
    legendHeavy: 'atomi $M$',
    legendLight: 'atomi $m$',
    legendSprings: 'molle $C$',
    legendArrows: 'spostamenti $u_n$',
    legendCm: 'centro di massa $R_{\\mathrm{cm}}$',
    legendDipole: 'dipolo ionico $\\mathbf{p}(t)$',
    legendAcoustic: 'acustico $\\nu_-(k)$',
    legendOptical: 'ottico $\\nu_+(k)$',
    legendGap: 'gap $\\Delta\\nu_{\\mathrm{gap}}$',
    legendSound: 'limite acustico $\\nu = v_s|k|/2\\pi$',
    legendFolding: 'monatomica passo $a/2$, $\\bar{m} = (M+m)/2$',
    legendLightLine: 'luce IR $\\nu = ck/(2\\pi n)$ (pendenza esagerata)',
    branchAcoustic: 'ramo acustico',
    branchOptical: 'ramo ottico',
    noteAcOrigin: 'traslazione rigida ($\\alpha = 1$, $\\nu = 0$)',
    noteOptOrigin: (equalMasses: boolean): string =>
      equalMasses
        ? 'opposizione di fase ($R_{\\mathrm{cm}} = 0$, nessun dipolo per $M = m$)'
        : 'opposizione di fase ($R_{\\mathrm{cm}} = 0$, dipolo IR)',
    noteEdgeC: (heavyIsM: boolean): string =>
      heavyIsM
        ? 'punto C: $m$ ferma ($\\alpha = 0$), oscilla solo $M$'
        : 'punto C: $M$ ferma ($1/\\alpha = 0$), oscilla solo $m$',
    noteEdgeB: (heavyIsM: boolean): string =>
      heavyIsM
        ? 'punto B: $M$ ferma ($1/\\alpha = 0$), oscilla solo $m$'
        : 'punto B: $m$ ferma ($\\alpha = 0$), oscilla solo $M$',
    noteGapClosed: 'gap chiuso ($M = m$): rami degeneri al bordo',
    stateHint: (branchLabel: string, kFracStr: string): string => `${branchLabel} · k = ${kFracStr} π/a`,
    cmLabel: 'R_{cm}',
    dipoleLabel: 'p(t)',
    dipoleZeroLabel: 'p = 0'
  },

  formula: {
    title: 'Formula viva',
    aria: 'Relazione di dispersione della catena biatomica: omega meno e omega più al quadrato in funzione di k, C, M, m e a'
  },

  values: {
    gapAndEdges: 'Bordi C / B e gap',
    gapClosed: 'gap chiuso ($M = m$)',
    invertedWarning: 'Con $m > M$ i ruoli ai bordi si scambiano: $\\nu_{\\max}^{\\mathrm{ac}}$ usa la massa maggiore ($m$) e $\\nu_{\\min}^{\\mathrm{ott}}$ la minore ($M$).',
    soundAndCenter: 'Suono e ottico',
    state: 'Modo selezionato',
    ratioAndCm: '$\\alpha$ e $R_{\\mathrm{cm}}$',
    alphaInf: '$1/\\alpha = 0$ ($M$ ferma)',
    alphaZero: '$\\alpha = 0$ ($m$ ferma)',
    cmStationary: '$R_{\\mathrm{cm}} = 0$ (fermo)',
    velocities: 'Velocità ($v_p, v_g$)',
    acOriginVelLimit: 'per $k \\to 0^\\pm$',
    acOriginVelNote: 'In $k = 0$ sul ramo acustico c’è un punto angoloso (traslazione rigida): i limiti destro e sinistro valgono $\\pm v_s$.',
    optOriginVelNote: 'In $k = 0$ sul ramo ottico $\\nu_+$ ha un massimo liscio ($v_g = 0$), mentre $v_p = \\omega_+(0)/k \\to \\pm\\infty$.',
    optNegVgNotePos: 'Sul ramo ottico per $k > 0$ la pendenza è negativa ($v_g < 0$, inviluppo contro la fase $v_p > 0$).',
    optNegVgNoteNeg: 'Sul ramo ottico per $k < 0$ la pendenza è positiva ($v_g > 0$, sempre opposta alla fase $v_p < 0$).',
    edgeClosedVelNote: 'Con $M = m$ il bordo $k = \\pm\\pi/a$ è un incrocio da ripiegamento (punto angoloso, nessuna onda stazionaria di gap).',
    edgeStandingNote: 'Onda stazionaria al bordo zona ($v_g = 0$, $v_p \\neq 0$): oscilla una sola specie atomica.',
    infrared: 'Luce IR ($n = 1$)',
    infraredNote: 'Nel vuoto ($n = 1$) $c/v_s \\sim 10^5$ e $k_{\\mathrm{luce}} \\ll \\pi/a$: la luce incrocia solo il ramo ottico a $k \\approx 0$ (mai l’acustico a $k \\neq 0$).',
    infraredEqualNote: 'Nota: se i due atomi sono identici ($M = m$, come nel diamante) il moto relativo non genera dipolo e non assorbe luce IR a un fotone.',
    matrix: 'Matrice $\\mathbf{D}(k)$',
    matrixUnit: '$10^{26}\\,\\text{s}^{-2}$'
  },

  theory: {
    title: 'Guida alla sezione',
    blocks: [
      {
        heading: 'L’idea',
        paragraphs: [
          'Quando ogni cella di passo $\\htmlData{q=a}{a}$ contiene due atomi di masse diverse $\\htmlData{q=M}{M}$ e $\\htmlData{q=m}{m}$ collegati da molle $\\htmlData{q=C}{C}$, le vibrazioni si sdoppiano in due rami: il ramo acustico $\\htmlData{q=omega}{\\omega_-}$ (atomi vicini in fase a basse frequenze) e il ramo ottico $\\htmlData{q=omegaOpt}{\\omega_+}$ (atomi in controfase a frequenze più alte, separati da un gap proibito).'
        ]
      },
      {
        heading: 'Come intervengono i parametri',
        paragraphs: [
          'Allargare la differenza tra $\\htmlData{q=M}{M}$ e $\\htmlData{q=m}{m}$ amplia il gap fononico $\\htmlData{q=omegaOpt}{\\Delta\\omega_{\\mathrm{gap}}}$ fra i bordi C e B; portando $\\htmlData{q=M}{M} = \\htmlData{q=m}{m}$ il gap si chiude. Aumentare la molla $\\htmlData{q=C}{C}$ alza in blocco entrambi i rami, mentre aumentare il passo $\\htmlData{q=a}{a}$ restringe la prima zona $(\\pm\\pi/\\htmlData{q=a}{a})$ e accelera il suono $\\htmlData{q=v}{v_s}$.',
          'Gli strumenti in alto mostrano la retta della luce infrarossa (che intercetta solo il ramo ottico vicino a $k = 0$ grazie al dipolo oscillante), il Confronto $M = m$ con la catena monatomica di passo $a/2$ ripiegata in zona, e la Matrice $\\mathbf{D}(k)$ $2\\times 2$ con i suoi autovalori.'
        ]
      },
      {
        heading: 'Cosa provare',
        paragraphs: [
          'Usa i quattro modi rapidi sopra la catena: in Ac. 0 la cella trasla rigidamente; in Ott. 0 i due atomi oscillano in opposizione tenendo fermo il centro di massa $R_{\\mathrm{cm}}$; nei bordi C (π/a) e B (π/a) si ferma prima l’atomo leggero e poi quello pesante (se imposti $m > M$ con gli slider, i ruoli si scambiano).',
          'Clicca a metà del ramo ottico per $k > 0$ e confronta il verso delle creste con la pendenza negativa della curva $(\\htmlData{q=v}{v_g} < 0)$: l’inviluppo arretra rispetto alla fase. Attiva Luce infrarossa su Coppia Na–Cl per vedere l’incrocio a $k \\approx 0$ e il dipolo oscillante $\\mathbf{p}(t)$ della cella, poi seleziona Limite M = m con Confronto M = m attivo per vedere il ripiegamento chiudere il gap.'
        ]
      }
    ],
    details: {
      title: 'Dettagli formali',
      blocks: [
        {
          heading: 'Base biatomica, passo reticolare $a$ e rami $\\omega_-$ / $\\omega_+$',
          paragraphs: [
            'La catena biatomica ha una base di $p = 2$ atomi per cella di masse $\\htmlData{q=M}{M}$ (siti pari $n$) e $\\htmlData{q=m}{m}$ (siti dispari $n - 1$), collegati da molle identiche $\\htmlData{q=C}{C}$. Attenzione a non confondere il passo del reticolo di Bravais $\\htmlData{q=a}{a}$ (distanza fra atomi uguali) con la distanza fra primi vicini $a/2$: la prima zona di Brillouin è $-\\pi/a < \\htmlData{q=k}{k} \\le \\pi/a$ e la fase tra vicini vale $ka/2$.',
            'Dalle due equazioni accoppiate $M\\ddot{u}_n = C(u_{n+1} - 2u_n + u_{n-1})$ e $m\\ddot{u}_{n-1} = C(u_n - 2u_{n-1} + u_{n-2})$ con ansatz $u_n = Ae^{i(kna/2 - \\omega t)}$ e $u_{n-1} = \\htmlData{q=u}{\\alpha} A e^{i(k(n-1)a/2 - \\omega t)}$ (dove $\\htmlData{q=u}{\\alpha}$ è il rapporto d’ampiezza, uguale a $u_{n-1}/u_n$ in $k = 0$) si ottiene l’equazione secolare quadratica in $\\omega^2$. Il segno meno dà il ramo acustico $\\htmlData{q=omega}{\\omega_-}(k)$, il segno più dà il ramo ottico $\\htmlData{q=omegaOpt}{\\omega_+}(k)$ (non invertire i segni). Con $N$ celle si hanno $N$ valori di $k$ su due rami, ossia $2N$ modi per $2N$ gradi di libertà.'
          ]
        },
        {
          heading: 'Limiti $k \\to 0$, centro di massa e bordi C / B',
          paragraphs: [
            'Per $k \\to 0$ sul ramo acustico si ha $\\htmlData{q=omega}{\\omega_-} \\simeq \\htmlData{q=v}{v_s}|k|$ con $\\htmlData{q=v}{v_s} = \\htmlData{q=a}{a}\\sqrt{\\htmlData{q=C}{C}/[2(\\htmlData{q=m}{m}+\\htmlData{q=M}{M})]}$ (massa di cella $m+M$ e due molle $C$ in serie equivalenti a $C/2$) e $\\htmlData{q=u}{\\alpha} = 1$: i due atomi si muovono in fase trascinando rigidamente la cella $(|R_{\\mathrm{cm}}|/u_{\\max} = 1)$.',
            'Sul ramo ottico a $k = 0$ resta la pulsazione finita $\\htmlData{q=omegaOpt}{\\omega_+}(0) = \\sqrt{2C(m+M)/(mM)}$ con $\\htmlData{q=u}{\\alpha} = -M/m$: gli atomi oscillano in opposizione mantenendo fermo il centro di massa $R_{\\mathrm{cm}} = (Mu_n + mu_{n-1})/(M+m) = 0$. (Nei valori numerici $|R_{\\mathrm{cm}}|/u_{\\max}$ è normalizzato allo spostamento massimo: per $k \\neq 0$ lo sfasamento $ka/2$ tra i due atomi rende $|R_{\\mathrm{cm}}| > 0$.) Allontanandosi da $k = 0$ il ramo ottico scende, quindi per $k > 0$ ha $\\htmlData{q=v}{v_g} < 0$ opposta a $\\htmlData{q=vp}{v_p} > 0$.',
            'Al bordo $k = \\pm\\pi/a$ ($\\lambda = 2a$) esistono due onde stazionarie con $v_g = 0$ (non si fermano tutti gli atomi, ma una sola specie): per $M > m$, nel punto C (acustico) $\\htmlData{q=omega}{\\omega_{\\max}^{\\mathrm{ac}}} = \\sqrt{2C/M}$ oscilla solo $M$ ($\\alpha = 0$, $m$ ferma), mentre nel punto B (ottico) $\\htmlData{q=omegaOpt}{\\omega_{\\min}^{\\mathrm{ott}}} = \\sqrt{2C/m}$ oscilla solo $m$ ($1/\\alpha = 0$, $M$ ferma); se $m > M$ i ruoli si scambiano ($\\max(M,m)$ in C, $\\min(M,m)$ in B). Il gap $\\htmlData{q=omegaOpt}{\\Delta\\omega_{\\mathrm{gap}}} = \\sqrt{2C/\\min(M,m)} - \\sqrt{2C/\\max(M,m)}$ ospita solo onde evanescenti e si chiude per $M = m$, dove il ramo ottico coincide con la catena monatomica di passo $a/2$ ripiegata di $G = 2\\pi/a$.'
          ]
        },
        {
          heading: 'Matrice dinamica $2\\times 2$ e luce infrarossa',
          paragraphs: [
            'Nel formalismo generale per $p = 2$ atomi per cella in 1D, il sistema è governato dalla matrice dinamica hermitiana $2\\times 2$ $\\mathbf{D}(k)$ (con $D_{11} = 2C/M$, $D_{22} = 2C/m$, $D_{12} = -\\frac{2C}{\\sqrt{Mm}}\\cos\\frac{ka}{2}$): l’equazione secolare $\\det(\\mathbf{D} - \\omega^2\\mathbf{1}) = 0$ riproduce i due rami $\\omega_\\mp^2$ e gli autovettori ortonormali $\\boldsymbol{\\varepsilon}^\\mp$ danno $\\alpha = (\\varepsilon_m/\\sqrt{m})/(\\varepsilon_M/\\sqrt{M})$.',
            'Un fotone infrarosso (dispersione $\\omega = ck/n$ in un dielettrico di indice di rifrazione $n$) che crea un fonone conserva energia ($\\hbar\\omega_{\\mathrm{luce}} = \\hbar\\omega_{\\mathrm{ph}}$) e quasi-impulso ($k_{\\mathrm{luce}} = k_{\\mathrm{ph}} (+G)$). Poiché $c/n \\sim 10^8\\,\\text{m/s} \\gg v_s \\sim 10^3\\,\\text{m/s}$, la retta della luce è quasi verticale ($k_{\\mathrm{luce}} \\sim 10^{-5}\\,\\pi/a$): non può mai incrociare il ramo acustico a $k \\neq 0$ e interseca solo il ramo ottico a $k \\approx 0$ (in 3D i modi trasversali TO dei cristalli ionici/polari con dipolo oscillante; se $M = m$ come nel diamante non c’è dipolo né assorbimento IR a un fotone).'
          ]
        }
      ]
    },
    foot: 'Fonte: dispensa Parte 6, Lezione 2 (§§7–8, §10.3, §12) e Lezione 4 (§24, §26). La coppia Na–Cl ($m = 23\\,\\text{u}$, $M = 35{,}5\\,\\text{u}$, $a = 5{,}64\\,\\text{Å}$, $C = 10\\,\\text{N/m}$) riproduce l’esempio illustrativo 1D di §8 e §24 (non un calcolo 3D di NaCl reale); il preset «Masse M = 2m» riprende il rapporto di Fig. 11–12; «Limite M = m» e «Li–I» sono esterni alla dispensa.'
  }
} as const
