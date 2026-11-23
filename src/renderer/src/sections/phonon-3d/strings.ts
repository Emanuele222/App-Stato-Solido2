/**
 * Testi in italiano della sezione «Rami 3D, polarizzazioni e cristalli reali».
 * Fonte unica: dispensa Parte 6, Lezione 2 (§§9–10, Fig. 13, §12) e Lezione 3 (§14, Tab. 1, Figg. 17–18, §19).
 * Nota: RichText interpreta solo le formule tra $...$ (zero sintassi Markdown ** o *).
 */
import type { SymmetryLineKind } from '../../physics'

export const strings = {
  chapter: 'Fononi',
  title: 'Rami 3D, polarizzazioni e cristalli reali',
  toolsLabel: 'Strumenti sui fononi 3D',
  asideLabel: 'Formule vive e teoria',

  tools: {
    unitLabel: (unit: 'meV' | 'THz'): string => `Unità: ${unit}`,
    unitTitle: 'Commuta l’asse verticale e le letture tra energia fononica ħω (meV) e frequenza ν (THz), con 1 THz ↔ 4,136 meV',
    counting: 'Conteggio modi 3D (1BZ)',
    countingTitle: 'Mostra la griglia 2D di Born–von Kármán (Fig. 17), il volume della cella primitiva a³/4 (fcc) e il bilancio dei modi',
    bvkNLabel: 'Celle per lato N',
    bvkNDecrease: 'Diminuisci N celle per lato',
    bvkNIncrease: 'Aumenta N celle per lato'
  },

  params: {
    crystalLabel: 'Cristallo (Tab.\u00A01)',
    crystalFree: 'Libero (parametri modificati)',
    crystalNote: 'Calibrazione su Tab. 1 (§14.4): Al (p = 1), Diamante (p = 2), PbTe polare (p = 2)',
    transverseRatio: 'Rapporto di rigidezza trasversale C_T / C_L',
    polarRatio: 'Splitting polare LO–TO a Γ (ω_LO / ω_TO)'
  },

  quickModes: {
    group: 'Salti rapidi sui modi notevoli del cristallo',
    gxLA: 'Γ–X: LA',
    gxLATitle: 'Onda acustica longitudinale lungo [100]: spostamenti paralleli a k',
    gxTA: 'Γ–X: TA (2×)',
    gxTATitle: 'Onda acustica trasversale lungo [100]: doppiamente degenere per simmetria C₄',
    kgTA1: 'K–Γ: TA₁',
    kgTA1Title: 'Primo modo trasversale lungo [110]: degenerazione rimossa (asse C₂)',
    kgTA2: 'K–Γ: TA₂',
    kgTA2Title: 'Secondo modo trasversale lungo [110]: frequenza distinta da TA₁',
    gLO: 'Γ–X: LO',
    gLOTitle: 'Modo ottico longitudinale lungo [100]: base in opposizione di fase lungo k',
    gTO: 'Γ–X: TO (2×)',
    gTOTitle: 'Modo ottico trasversale lungo [100]: doppiamente degenere, spostamenti ortogonali a k',
    xkMix: 'X–K: misto',
    xkMixTitle: 'Direzione generica nel piano xy: il modo non è né puramente longitudinale né puramente trasversale'
  },

  scene: {
    view3dTag: 'Spazio reale 3D — piani atomici e polarizzazione εˢ(k)',
    view3dAria: 'Proiezione isometrica animata dei piani atomici 3D con vettore d’onda k, autovettore di polarizzazione e spostamenti atomici istantanei',
    countingTag: 'Conteggio modi 3D — Born–von Kármán e 1BZ (Fig. 17)',
    countingAria: 'Griglia 2D di Born–von Kármán nella prima zona di Brillouin con N² punti contati e confronto tra cella convenzionale cubica e cella primitiva fcc di volume a³/4',
    dispersionTag: (unit: 'meV' | 'THz'): string =>
      unit === 'meV'
        ? 'Dispersione 3D ħω(k) lungo Γ–X–K–Γ–L'
        : 'Dispersione 3D ν(k) = ω(k)/2π lungo Γ–X–K–Γ–L',
    dispersionAria: 'Diagramma di dispersione fononica 3D lungo il cammino di alta simmetria Γ–X–K–Γ–L con rami acustici e ottici',
    dispersionHint: 'Clicca/trascina sui rami (←/→ muove k, ↑/↓ cambia ramo)',
    yAxisMev: 'ħω (meV)',
    yAxisThz: 'ν (THz)',
    legend3dAria: 'Legenda della proiezione 3D',
    legendDispersionAria: 'Legenda della dispersione 3D',
    legendAtom1: (p: 1 | 2, isDiamond: boolean, sym: string): string =>
      p === 1
        ? `atomi ${sym} ($M$)`
        : isDiamond
          ? `sottoreticolo 1 (${sym})`
          : `atomi ${sym} ($M_1$)`,
    legendAtom2: (sym: string): string => `atomi ${sym} ($M_2$)`,
    legendDiamondSub2: 'sottoreticolo 2 (C)',
    legendKVec: 'vettore d’onda $\\mathbf{k}$',
    legendDispArrows: 'spostamenti $\\mathbf{u}_{n\\alpha}(t)$',
    legendLA: 'LA (acustico long.)',
    legendTA: 'TA₁, TA₂ (acustici trasv.)',
    legendLO: 'LO (ottico long.)',
    legendTO: 'TO₁, TO₂ (ottici trasv.)',
    stateHint: (role: string, seg: string, longPct: string): string =>
      `${role} su ${seg} · carattere long. ${longPct}%`,
    countingHint: (n: number, nc: number, p: number): string =>
      `$N = ${n}$ · $N^2 = ${n * n}$ (2D) · fcc $N_c = 4N^3 = ${nc.toLocaleString('it-IT')}$ → ${(3 * p * nc).toLocaleString('it-IT')} modi`,
    noteDegenerate2: '2× degenere (simmetria cubica)',
    noteDegenerate3: '3× degenere a Γ',
    noteSplit110: 'degenerazione rimossa su [110]',
    noteMixed: 'modo misto (direzione generica)',
    canvasKLabel: 'k',
    canvasPolLabel: 'εˢ',
    canvasGridTitle: (n: number): string => `Griglia 2D in 1BZ (N = ${n}, N² = ${n * n} punti)`,
    canvasGridLegendCounted: 'pieni: contati',
    canvasGridLegendGhost: 'vuoti: copie per G',
    canvasCellTitle: 'Cella convenzionale vs primitiva (fcc)',
    canvasCellNote: '4 celle primitive nel cubo a³'
  },

  formula: {
    title: 'Formula viva',
    aria: 'Matrice dinamica hermitiana 3p per 3p ed equazione secolare per i fononi in tre dimensioni'
  },

  values: {
    crystal: 'Cristallo e cella',
    state: 'Modo selezionato',
    polarization: 'Polarizzazione',
    tab1Ref: 'Riferimento Tab.\u00A01',
    tab1Model: 'Modello (da Tab.\u00A01)',
    counting: 'Bilancio $3pN_c$',
    alMacro: 'Al 1 cm³ (§14.2)',
    branchesP1: '3 acustici (1 LA + 2 TA), 0 ottici',
    branchesP2: '3 acustici + 3 ottici (1 LO + 2 TO)',
    polarPureL: 'puramente longitudinale ($\\boldsymbol{\\varepsilon} \\parallel \\mathbf{k}$)',
    polarPureT: 'puramente trasversale ($\\boldsymbol{\\varepsilon} \\perp \\mathbf{k}$)',
    polarMixed: (symmetry: SymmetryLineKind): string =>
      symmetry === 'generic'
        ? 'polarizzazione mista (direzione generica $X\\text{–}K$)'
        : 'polarizzazione mista (accoppiamento $L\\text{–}T$ su $[110]$)',
    sym100Note: (hasOptical: boolean): string =>
      hasOptical
        ? 'Asse quaternario $[100]$ ($C_4$): $\\text{TA}_1 = \\text{TA}_2$ e $\\text{TO}_1 = \\text{TO}_2$ degeneri.'
        : 'Asse quaternario $[100]$ ($C_4$): $\\text{TA}_1 = \\text{TA}_2$ degeneri.',
    sym111Note: (hasOptical: boolean): string =>
      hasOptical
        ? 'Asse ternario $[111]$ ($C_3$): $\\text{TA}_1 = \\text{TA}_2$ e $\\text{TO}_1 = \\text{TO}_2$ degeneri.'
        : 'Asse ternario $[111]$ ($C_3$): $\\text{TA}_1 = \\text{TA}_2$ degeneri.',
    sym110Note: 'Asse binario $[110]$ ($C_2$): degenerazione trasversale rimossa.',
    symGenericNote: 'Direzione generica: i nomi LA/TA/LO/TO sono solo approssimati.',
    diamondNoSplit: 'Non polare ($\\text{LO} = \\text{TO}$ a $\\Gamma$, nessun dipolo IR).',
    diamondSliderSplit: 'Diamante reale: non polare ($\\text{LO} = \\text{TO}$ a $\\Gamma$); splitting polare introdotto dallo slider.',
    pbteSplitNote: 'Cristallo polare: il campo elettrico longitudinale alza LO sopra TO.',
    pbteZeroSplitNote: 'Splitting polare azzerato dallo slider (nel PbTe reale $\\text{LO} \\approx 3{,}3\\,\\text{THz} > \\text{TO} \\approx 1{,}1\\,\\text{THz}$).'
  },

  theory: {
    title: 'Teoria in breve',
    blocks: [
      {
        heading: 'Dai rami 1D ai $3p$ rami in 3D (e conteggio LO / TO)',
        paragraphs: [
          'In tre dimensioni ciascun atomo ha $3$ gradi di libertà: con una base di $p$ atomi per cella primitiva si hanno $3p$ rami fononici per ogni $\\htmlData{q=k}{\\mathbf{k}}$ nella prima zona di Brillouin. Tre rami sono sempre acustici ($\\htmlData{q=omega}{\\omega}(\\mathbf{k}\\to\\mathbf{0}) = 0$: $1$ longitudinale LA e $2$ trasversali $\\text{TA}_1$, $\\text{TA}_2$, nei quali la cella trasla rigidamente) e i restanti $3p - 3$ sono ottici ($\\htmlData{q=omegaOpt}{\\omega}(\\mathbf{0}) > 0$, moti interni della base, con bande tipicamente quasi piatte e piccola velocità di gruppo $v_g$).',
          'Attenzione a due errori frequenti (§9.1 e §12): i rami ottici non sono «solo trasversali» né contengono «un unico LO per ogni $p$» (come in formulazioni imprecise diffuse con $1$ LO e $3p - 4$ TO). Il conto corretto lungo le direzioni di alta simmetria è $p - 1$ rami LO e $2(p - 1)$ rami TO: un longitudinale e due trasversali per ciascun atomo aggiunto alla base (coincidono solo per $p = 2$). Inoltre le etichette LA, TA, LO, TO sono esatte soltanto lungo direzioni di alta simmetria: lungo una direzione generica come $X\\text{–}K$ gli spostamenti sono in generale misti.'
        ]
      },
      {
        heading: 'Matrice dinamica $3p \\times 3p$ e regola di somma acustica',
        paragraphs: [
          'Scrivendo lo spostamento dell’atomo $\\alpha$ nella cella $n$ come onda di Bloch $\\htmlData{q=u}{\\mathbf{u}_{n\\alpha}}(t) = M_\\alpha^{-1/2}\\htmlData{q=u}{\\boldsymbol{\\varepsilon}^s_\\alpha}(\\mathbf{k})e^{i(\\mathbf{k}\\cdot\\mathbf{R}_n - \\omega t)}$, le $3pN_c$ equazioni armoniche si riducono per ogni $\\mathbf{k}$ al problema agli autovalori della matrice dinamica $3p\\times 3p$ $\\mathbf{D}(\\mathbf{k})$, trasformata di Fourier delle costanti di forza $\\htmlData{q=C}{\\Phi_{\\alpha i,\\beta j}}(0, m)$ pesate con $1/\\sqrt{\\htmlData{q=M}{M_\\alpha M_\\beta}}$.',
          'La simmetria di Schwarz e l’invarianza traslazionale garantiscono che $\\mathbf{D}(\\mathbf{k})$ sia hermitiana (autovalori $\\omega_s^2 \\ge 0$ reali e autovettori ortonormali $\\boldsymbol{\\varepsilon}^s$). La regola di somma nulla $\\sum_{m\\beta}\\Phi_{\\alpha i,\\beta j}(0, m) = 0$ (invarianza per traslazione rigida) annulla $\\mathbf{D}(\\mathbf{0})$ su tre vettori indipendenti $\\varepsilon_{\\beta j} = \\sqrt{M_\\beta}\\,c_j$, garantendo esattamente $3$ rami acustici a $\\omega(\\mathbf{0}) = 0$.'
        ]
      },
      {
        heading: 'Simmetria cubica, degenerazioni e cristalli reali (Tab.\u00A01)',
        paragraphs: [
          'Lungo $[100]$ ($\\Gamma\\text{–}X$, asse rotazionale quaternario $C_4$) e $[111]$ ($\\Gamma\\text{–}L$, asse ternario $C_3$) nessuna direzione del piano trasversale resta invariante per rotazione di $2\\pi/n$ ($n \\ge 3$): le due polarizzazioni trasversali hanno quindi esattamente la stessa frequenza ($\\text{TA}_1 = \\text{TA}_2$, e per $p = 2$ anche $\\text{TO}_1 = \\text{TO}_2$). Lungo $[110]$ ($K\\text{–}\\Gamma$) resta solo un asse binario $C_2$: la degenerazione si rimuove e compaiono tutti i rami distinti (tutti e $6$ in PbTe).',
          'Nell’alluminio (fcc, $p = 1$) esistono solo i $3$ rami acustici (a $X$: LA $\\approx 40\\,\\text{meV}$, TA $\\approx 24\\,\\text{meV}$). Nel diamante (base C–C, $p = 2$) gli atomi sono identici e non generano dipolo: a $\\Gamma$ i $3$ rami ottici sono degeneri a $\\approx 160\\,\\text{meV}$ ($39\\,\\text{THz}$) e non assorbono luce IR a un fotone. Nel PbTe (struttura NaCl ionica, $p = 2$) l’oscillazione di cariche opposte crea un campo elettrico macroscopico che irrigidisce il modo longitudinale, aprendo lo splitting LO–TO a $\\Gamma$ (LO $\\approx 3{,}3\\,\\text{THz} \\approx 14\\,\\text{meV}$ sopra TO $\\approx 1{,}1\\,\\text{THz} \\approx 4{,}5\\,\\text{meV}$). Sperimentalmente le curve $\\omega_s(\\mathbf{k})$ si misurano con scattering anelastico di neutroni (INS) e raggi X (IXS).'
        ]
      },
      {
        heading: 'Conteggio 3D di Born–von Kármán e cella primitiva fcc ($v_c = a^3/4$)',
        paragraphs: [
          'Con condizioni periodiche su un cubo di lato $L = Na$ ($N$ celle convenzionali per lato, volume $V = L^3$) i vettori permessi sono $\\mathbf{k} = \\frac{2\\pi}{L}(n_x, n_y, n_z)$, ciascuno con volume $\\Delta V_k = (2\\pi)^3/V$. Poiché la 1BZ ha volume $V_{\\mathrm{1BZ}} = (2\\pi)^3/v_c$, il numero di punti $\\mathbf{k}$ distinti in zona è $\\mathcal{N}_k = V/v_c = N_c$, uno per cella primitiva, e il bilancio dei modi è $3pN_c = N_c \\times 3p$ (tanti quanti i gradi di libertà meccanici).',
          'Tre errori tipici da evitare (§14.1 e §19): le condizioni periodiche sono un artificio matematico per eliminare le superfici (non una proprietà fisica: gli estremi bloccati danno lo stesso conteggio di bulk); in zona cadono $N$ valori per asse e non $N + 1$ o $2N$, perché i bordi $-\\pi/a$ e $+\\pi/a$ coincidono per un vettore $\\mathbf{G}$ (cerchi vuoti in Fig. 17); infine, il volume della cella primitiva non è $\\htmlData{q=a}{a}^3$ per tutti i reticoli cubici: per i reticoli fcc (Al, diamante, PbTe) la cella convenzionale $a^3$ contiene $4$ celle primitive, quindi $v_c = a^3/4$ e $N_c = 4N^3$.'
        ]
      }
    ],
    foot: 'Fonte: dispensa Parte 6, Lezione 2 (§§9–10, Fig. 13, §12) e Lezione 3 (§14, Tab. 1, Figg. 17–18, §19). Le curve complete lungo Γ–X–K–Γ–L derivano da modelli armonici 3D (matrice dinamica Born–von Kármán a primi/secondi vicini e termine dipolare macroscopico per PbTe) calibrati sui valori numerici della Tab. 1 della dispensa (passo a = 4,05 Å e massa dell’Al da §14.2; passi reticolari a = 3,57 Å per Diamante, a = 6,46 Å per PbTe e masse standard esterni alla dispensa), non da dati sperimentali o calcoli DFT diretti (es. Zhang et al. 2009).'
  }
} as const
