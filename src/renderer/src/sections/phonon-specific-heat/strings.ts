/**
 * Testi in italiano della sezione «Calore specifico del reticolo: evoluzione storica e modello di Debye».
 * Fonte: dispensa Parte 6, Lezione 4 (§§20–23, §25, Figg. 22–27, Tabb. 2–4, eqq. 52–59 e 61–62).
 *
 * Nota tecnica: RichText interpreta solo testo semplice e LaTeX $...$; non usare Markdown (** o *)
 * né underscore grezzi fuori dai delimitatori $.
 */
export const strings = {
  chapter: 'Fononi',
  title: 'Calore specifico e Debye',
  toolsLabel: 'Tappe storiche dell’evoluzione del calore specifico del reticolo',
  asideLabel: 'Formule vive e guida alla sezione',

  stages: {
    'dulong-petit': '1819 Dulong–Petit',
    einstein: '1907 Einstein',
    debye: '1912 Debye',
    'beyond-1953': '1953 Oltre Debye',
    comparison: 'Confronto completo'
  },

  stageTitles: {
    'dulong-petit': 'Legge classica di Dulong–Petit (1819): equipartizione costante 3R',
    einstein: 'Modello di Einstein (1907): oscillatori quantistici a frequenza unica ωᴇ',
    debye: 'Modello di Debye (1912): modi acustici collettivi e legge T³',
    'beyond-1953': 'Oltre Debye (1953): singolarità di Van Hove nella DOS e analogia corpo nero',
    comparison: 'Confronto completo delle curve storiche con i dati sperimentali (Tab. 2)'
  },

  params: {
    temperatureK: 'Temperatura T',
    thetaDK: 'Temperatura di Debye Θᴅ',
    einsteinRatio: 'Rapporto Θᴇ / Θᴅ'
  },

  presets: {
    label: 'Materiale',
    free: 'Libero'
  },

  controls: {
    scaleLabel: 'Scala del grafico Cᵥ(T)',
    linear: 'Lineare',
    loglog: 'Log–Log',
    unitLabel: 'Unità del calore specifico',
    unitRatio: 'Cᵥ/3R',
    unitMolar: 'J/(mol·K)',
    t3Toggle: 'Asintoto T³',
    t3Title: 'Mostra o nascondi la legge asintotica T³ di Debye a bassa temperatura'
  },

  curveScene: {
    tag: 'Calore specifico molare Cᵥ(T)',
    aria: 'Grafico interattivo del calore specifico molare in funzione della temperatura T con cursore mobile e punti sperimentali',
    hint: 'Clicca o trascina su $T$ (oppure usa ←/→)',
    legendAria: 'Legenda delle curve del calore specifico',
    legendDulongPetit: 'Dulong–Petit ($3R$)',
    legendEinstein: 'Einstein $C_V^{\\mathrm{E}}$',
    legendDebye: 'Debye $C_V^{\\mathrm{D}}$',
    legendDebyeT3: 'Asintoto $T^3$',
    legendChain1D: 'Catena 1D ($\\propto T$)',
    legendExp: 'Dati Tab. 2',
    legendDiamondEst: 'Stima §22.7 ($T^3$)',
    legendCursor: 'Stato $T$'
  },

  spectrumScene: {
    tagStandard: 'Spettro dei modi g(ω), pesi termici e sfera di Debye',
    tagEinstein: 'Peso termico ℰ(ħω/kᵦT) e scala dei livelli ωᴇ',
    tag1953: 'Densità degli stati (Van Hove) e analogia corpo nero',
    ariaStandard: 'Spettro g(ω) riempito dal fattore di attivazione termica e schema della sfera di Debye',
    ariaEinstein: 'Funzione peso termico di Einstein ℰ(ħω/kᵦT) con picco a ωᴇ e scala dei livelli equi-spaziati',
    aria1953: 'Confronto tra densità degli stati di Debye e 1D con singolarità di Van Hove e confronto corpo nero 3 contro 2 polarizzazioni',
    hintStandard: (thetaD: number, freqDThz: string, ratioPct: string): string =>
      `$\\Theta_D = ${thetaD}\\text{ K}$ ($\\nu_D = ${freqDThz}\\text{ THz}$) · sfera attiva $(T/\\Theta_D)^3 = ${ratioPct}\\%$`,
    hintEinstein: (thetaE: number, weightPct: string): string =>
      `$\\Theta_E = ${thetaE}\\text{ K}$ · attivazione singolo modo $\\mathcal{E}(\\Theta_E/T) = ${weightPct}\\%$`,
    hint1953: 'Picco di Van Hove a $\\omega = \\omega_{\\max}$ ($v_g \\to 0$) e confronto $T^4$ ($3$ vs $2$ polarizzazioni)',
    legendAria: 'Legenda dello spettro dei modi e dei pesi termici',
    legendClassicalAll: 'Equipartizione: peso $1$ su tutti i modi',
    legendEinsteinSpike: 'Modo unico $\\delta(\\omega - \\omega_E)$',
    legendDebyeDos: 'DOS Debye $g(\\omega) \\propto \\omega^2$',
    legendActiveArea: 'Modi accesi $g(\\omega)\\,\\mathcal{E}(\\hbar\\omega/k_B T)$',
    legendWeightCurve: 'Peso $\\mathcal{E}(\\hbar\\omega/k_B T)$',
    legendThermalThreshold: 'Soglia $\\hbar\\omega = k_B T$',
    legendVanHove: 'DOS 1D Van Hove',
    sphereTitle: 'Sfera di Debye (spazio k)',
    einsteinModesTitle: 'Livelli Einstein (ωᴇ)',
    blackBodyTitle: 'Corpo nero T⁴ (3 vs 2 pol.)'
  },

  formula: {
    title: 'Formula viva',
    ariaByStage: {
      'dulong-petit': 'Legge di Dulong e Petit Cᵥ = 3R',
      einstein: 'Calore specifico di Einstein con funzione di attivazione ℰ(Θᴇ/T)',
      debye: 'Integrale di Debye per il calore specifico molare Cᵥ',
      'beyond-1953': 'Confronto densità di energia fononica e fotonica e singolarità di Van Hove',
      comparison: 'Confronto completo tra modello di Debye, Einstein e asintoto T cubo'
    }
  },

  values: {
    cursorT: 'Temperatura T',
    dulongPetit: 'Dulong–Petit',
    einstein: 'Einstein',
    debye: 'Debye',
    t3Asymptote: 'Legge T³',
    cutoff: 'Taglio di Debye',
    sphereRatio: 'Sfera termica',
    expTab2: 'Dati Tab. 2',
    diamondEstLabel: 'Stima §22.7 (T³)',
    noExpNote: 'Nessun dato Tab. 2 in dispensa per questo elemento'
  },

  theory: {
    title: 'Guida alla sezione',
    blocksByStage: {
      'dulong-petit': [
        {
          heading: 'L’idea',
          paragraphs: [
            'Per l’equipartizione classica ciascuno dei $3N$ oscillatori del cristallo porta in media $k_B\\htmlData{q=T}{T}$ (metà cinetica, metà potenziale), dando $\\htmlData{q=CV}{C_V} = \\htmlData{q=Ek}{3R} \\approx 24{,}94\\text{ J mol}^{-1}\\text{K}^{-1}$ per ogni solido e ogni $\\htmlData{q=T}{T}$. A $273\\text{ K}$ la legge regge bene, ma raffreddando a $77\\text{ K}$ tutti i solidi crollano verso zero, più in fretta se hanno legami rigidi e atomi leggeri.'
          ]
        },
        {
          heading: 'Come intervengono i parametri',
          paragraphs: [
            'Scegli un materiale dal menu o sposta $\\htmlData{q=T}{T}$ lungo la retta $\\htmlData{q=Ek}{3R}$: i rombi mostrano i dati di Tab. 2 a $77\\text{ K}$ e $273\\text{ K}$ (valori leggermente sopra $\\htmlData{q=Ek}{3R}$, come Pb $26{,}7$ e Na $27{,}6$ a $273\\text{ K}$, sono dovuti ad anarmonicità e a $C_P - C_V$). Anche il silicio (semiconduttore) crolla a $77\\text{ K}$: il calo è una proprietà quantistica delle vibrazioni, non degli elettroni.'
          ]
        },
        {
          heading: 'Cosa provare',
          paragraphs: [
            'Confronta Piombo ($\\htmlData{q=Theta}{\\Theta_D} = 105\\text{ K}$, vicino a $\\htmlData{q=Ek}{3R}$ già a $77\\text{ K}$) con Silicio ($645\\text{ K}$) e Diamante ($2230\\text{ K}$): attiva la scala Log–Log e porta $\\htmlData{q=T}{T} = 77\\text{ K}$ sul Diamante per vedere la stima a $0{,}08\\text{ J mol}^{-1}\\text{K}^{-1}$, circa $300$ volte sotto $\\htmlData{q=Ek}{3R}$.'
          ]
        }
      ],
      einstein: [
        {
          heading: 'L’idea',
          paragraphs: [
            'Einstein (1907) quantizza i $3N$ oscillatori con statistica di Bose–Einstein a $\\mu = 0$ e ottiene la caduta verso zero, ma fallisce a basse $\\htmlData{q=T}{T}$ non perché sia «classico», bensì perché assegna a tutti i modi una sola frequenza $\\htmlData{q=omegaOpt}{\\omega_E}$: quando $k_B\\htmlData{q=T}{T} \\ll \\hbar\\htmlData{q=omegaOpt}{\\omega_E}$ tutti gli oscillatori si congelano insieme e $\\htmlData{q=omegaOpt}{C_V^{\\mathrm{E}}}$ crolla esponenzialmente invece che come $T^3$.'
          ]
        },
        {
          heading: 'Come intervengono i parametri',
          paragraphs: [
            'Trascina $\\htmlData{q=T}{T}$ e varia $\\htmlData{q=omegaOpt}{\\Theta_E/\\Theta_D}$: nello spettro in basso l’unico picco $\\delta(\\omega - \\htmlData{q=omegaOpt}{\\omega_E})$ viene pesato dalla curva $\\mathcal{E}(\\hbar\\omega/k_B\\htmlData{q=T}{T}) \\in [0, 1]$, mentre a destra la scala dei livelli di spaziatura $\\hbar\\htmlData{q=omegaOpt}{\\omega_E}$ mostra il confronto diretto con $k_B\\htmlData{q=T}{T}$. Appena $k_B\\htmlData{q=T}{T} < \\hbar\\htmlData{q=omegaOpt}{\\omega_E}$, il picco si svuota di colpo.'
          ]
        },
        {
          heading: 'Cosa provare',
          paragraphs: [
            'Passa in scala Log–Log con $\\htmlData{q=omegaOpt}{\\Theta_E/\\Theta_D} = 1{,}00$ su Rame e porta $\\htmlData{q=T}{T} \\approx 34\\text{ K}$ ($\\Theta_D/10$): la curva di Einstein precipita quasi verticalmente, lontanissima dai dati reali.'
          ]
        }
      ],
      debye: [
        {
          heading: 'L’idea',
          paragraphs: [
            'Debye (1912) restituisce ai modi la dispersione acustica $\\omega = \\htmlData{q=v}{v_s}k$ fino al taglio $\\htmlData{q=Theta}{\\omega_D}$ che fissa a $3N$ i modi totali. Nello spazio $\\mathbf{k}$ la sfera di Debye di raggio $\\htmlData{q=Theta}{k_D}$ contiene la «sfera termica» dei modi eccitati ($\\hbar\\omega \\lesssim k_B\\htmlData{q=T}{T}$), di raggio $\\htmlData{q=k}{k_T} \\propto \\htmlData{q=T}{T}$: il rapporto dei volumi è $(\\htmlData{q=T}{T}/\\htmlData{q=Theta}{\\Theta_D})^3$ e, poiché ciascun modo acceso contribuisce $\\sim k_B$ al calore specifico ($U_{\\mathrm{term}} \\propto T^4$), si ottiene la legge $\\htmlData{q=omega}{T^3}$!'
          ]
        },
        {
          heading: 'Come intervengono i parametri',
          paragraphs: [
            'Con $\\htmlData{q=T}{T}$ sposti la soglia $\\hbar\\omega = k_B\\htmlData{q=T}{T}$ sulla parabola $g(\\omega) \\propto \\omega^2$ e vedi espandersi la sfera attiva $\\htmlData{q=k}{k_T}$ dentro $\\htmlData{q=Theta}{k_D}$; cambiando materiale o $\\htmlData{q=Theta}{\\Theta_D}$ sposti la soglia tra regime quantistico ($T \\ll \\Theta_D$) e classico ($T \\gg \\Theta_D$).'
          ]
        },
        {
          heading: 'Cosa provare',
          paragraphs: [
            'Attiva Log–Log su Diamante o Silicio e confronta la curva blu di Debye con la retta verde punteggiata $\\htmlData{q=omega}{T^3}$ (pendenza $3$): a $\\htmlData{q=T}{T} = \\htmlData{q=Theta}{\\Theta_D}/10$ l’asintoto $T^3$ sovrastima ancora Debye di circa il $3\\%$, mentre Einstein ($\\Theta_E = \\Theta_D$) è già $\\sim 17$ volte più piccolo.'
          ]
        }
      ],
      'beyond-1953': [
        {
          heading: 'L’idea',
          paragraphs: [
            'La parabola di Debye è esatta solo per $\\omega \\to 0$ (legge $\\htmlData{q=omega}{T^3}$) e per $\\htmlData{q=T}{T} \\to \\infty$ (conteggio totale $3N$): in un reticolo vero $\\nabla_{\\mathbf{k}}\\omega = \\mathbf{0}$ ai bordi di zona genera i picchi di Van Hove (1953). Inoltre a bassa $\\htmlData{q=T}{T}$ il gas di fononi obbedisce a una legge di Stefan–Boltzmann $T^4$ analoga al corpo nero, ma con $3$ polarizzazioni acustiche ($1\\text{ LA} + 2\\text{ TA}$) contro le $2$ trasversali dei fotoni e con il taglio $\\htmlData{q=Theta}{\\omega_D}$.'
          ]
        },
        {
          heading: 'Come intervengono i parametri',
          paragraphs: [
            'Nel pannello in basso a sinistra confronti la DOS parabolica di Debye con la DOS discreta 1D $g_{\\mathrm{1D}}(\\omega)$ (posta $\\hbar\\omega_{\\max}/k_B = \\htmlData{q=Theta}{\\Theta_D}$ e confrontata su $3$ rami per la scala $\\htmlData{q=Ek}{3R}$), costante per $\\omega \\to 0$ ($C_V^{\\mathrm{1D}} \\propto T$) e divergente a $\\omega_{\\max}$ dove $\\htmlData{q=v}{v_g} \\to 0$. A destra confronti le densità di energia $\\tilde{u}_{\\mathrm{ph}}$ e $\\tilde{u}_\\gamma$ alla temperatura $\\htmlData{q=T}{T}$ scelta.'
          ]
        },
        {
          heading: 'Cosa provare',
          paragraphs: [
            'Passa in scala Log–Log sul grafico in alto: a bassa $\\htmlData{q=T}{T}$ vedi la differenza di pendenza tra catena 1D ($\\propto T^1$) e modello di Debye 3D ($\\propto T^3$). Poi porta $\\htmlData{q=T}{T} < \\htmlData{q=Theta}{\\Theta_D}/10$ per verificare dove vale l’analogia $T^4$ del corpo nero.'
          ]
        }
      ],
      comparison: [
        {
          heading: 'L’idea',
          paragraphs: [
            'Questa vista sovrappone in un unico quadro tutta l’evoluzione storica: la retta classica di Dulong–Petit ($\\htmlData{q=Ek}{3R}$), la caduta esponenziale di Einstein ($\\htmlData{q=omegaOpt}{\\omega_E}$ unica), la curva universale di Debye con $w = \\omega/\\htmlData{q=Theta}{\\omega_D}$ (modi acustici collettivi e sfera $\\htmlData{q=k}{k_T}/\\htmlData{q=Theta}{k_D}$) e i dati di riferimento.'
          ]
        },
        {
          heading: 'Come intervengono i parametri',
          paragraphs: [
            'Varia $\\htmlData{q=T}{T}$, $\\htmlData{q=Theta}{\\Theta_D}$ e $\\htmlData{q=omegaOpt}{\\Theta_E/\\Theta_D}$ oppure cambia materiale per vedere insieme la posizione sul grafico $C_V(T)$, i modi riempiti nello spettro $g(\\omega)$ e la frazione di volume attivata $(\\htmlData{q=T}{T}/\\htmlData{q=Theta}{\\Theta_D})^3$ nella sfera di Debye (valori sperimentali sopra $\\htmlData{q=Ek}{3R}$ a $273\\text{ K}$ indicano anarmonicità e $C_P - C_V$).'
          ]
        },
        {
          heading: 'Cosa provare',
          paragraphs: [
            'Seleziona Rame ($343\\text{ K}$) e osserva i punti $77\\text{ K}$ e $273\\text{ K}$ in Lineare; poi passa a Log–Log con $\\htmlData{q=omegaOpt}{\\Theta_E/\\Theta_D} = 1{,}00$ per toccare con mano il divario di ordini di grandezza tra Einstein e Debye sotto $\\Theta_D/10$.'
          ]
        }
      ]
    },
    details: {
      title: 'Dettagli formali',
      blocks: [
        {
          heading: 'Dulong–Petit, Einstein (eqq. 52–55) e limiti asintotici',
          paragraphs: [
            'In meccanica classica una mole di solido ha $3N_A$ oscillatori con energia quadratica $\\langle E_{\\mathrm{1D}}\\rangle = k_B T$, quindi $U = 3RT$ e $C_V = 3R \\approx 24{,}943\\text{ J mol}^{-1}\\text{K}^{-1}$ (eq. 52). Nell’insieme canonico $Z = e^{-\\beta E_0}\\prod_j (1 - e^{-\\beta\\hbar\\omega_j})^{-1}$ si ottiene la statistica di Bose–Einstein a $\\mu = 0$ (numero di fononi non conservato), e ogni modo di frequenza $\\omega_j$ contribuisce $k_B\\mathcal{E}(\\hbar\\omega_j/k_B T)$ con $\\mathcal{E}(x) = x^2 e^x/(e^x - 1)^2$ (eq. 61).',
            'Einstein pone $\\omega_j = \\omega_E$ per tutti i $3N$ modi ($\\Theta_E = \\hbar\\omega_E/k_B$): $C_V^{\\mathrm{E}} = 3R\\,\\mathcal{E}(\\Theta_E/T)$ (eq. 54). Per $T \\gg \\Theta_E$ vale $C_V^{\\mathrm{E}} \\simeq 3R[1 - \\frac{1}{12}(\\Theta_E/T)^2]$; per $T \\ll \\Theta_E$ vale $C_V^{\\mathrm{E}} \\simeq 3R(\\Theta_E/T)^2 e^{-\\Theta_E/T}$ (eq. 55).'
          ]
        },
        {
          heading: 'Modello di Debye, normalizzazione e asintoti (eqq. 56–59)',
          paragraphs: [
            'Con $\\omega = v_s k$ su tre rami acustici isotropi ($1\\text{ LA} + 2\\text{ TA}$), gli stati entro il raggio $k$ per polarizzazione sono $N(k) = V k^3/(6\\pi^2)$ e la densità degli stati per singola polarizzazione è $g(\\omega) = V\\omega^2/(2\\pi^2 v_s^3)$ (eq. 56); la densità totale è $3g(\\omega)$, normalizzata a $3\\int_0^{\\omega_D} g(\\omega)\\,\\mathrm{d}\\omega = 3N$, da cui $\\omega_D = v_s(6\\pi^2 N/V)^{1/3}$, $k_D = (6\\pi^2 N/V)^{1/3}$ e $\\Theta_D = \\hbar\\omega_D/k_B$ (eq. 57). In un cristallo reale con velocità diverse $3/v_s^3 \\to 1/v_L^3 + 2/v_T^3$.',
            'L’energia termica è $U_{\\mathrm{term}} = 9Nk_B T(T/\\Theta_D)^3\\int_0^{\\Theta_D/T} \\frac{x^3}{e^x - 1}\\,\\mathrm{d}x$ (eq. 58) e derivando rispetto a $T$ segue $C_V^{\\mathrm{D}} = 3R\\,D_3(\\Theta_D/T)$ con $D_3(u) = \\frac{3}{u^3}\\int_0^u \\frac{x^4 e^x}{(e^x - 1)^2}\\,\\mathrm{d}x$. Per $T \\gg \\Theta_D$: $C_V^{\\mathrm{D}} \\simeq 3R[1 - \\frac{1}{20}(\\Theta_D/T)^2]$. Per $T \\ll \\Theta_D$ (usando $\\int_0^\\infty \\frac{x^3}{e^x - 1}\\,\\mathrm{d}x = \\pi^4/15$): $C_V^{\\mathrm{D}} \\simeq \\frac{12\\pi^4}{5}R(T/\\Theta_D)^3 \\simeq 233{,}78\\,R(T/\\Theta_D)^3$ (eq. 59); in scala log–log $C_V = A T^p$ diventa $\\log C_V = \\log A + p\\log T$, cioè una retta di pendenza $p = 3$.'
          ]
        },
        {
          heading: 'Van Hove, analogia corpo nero (eq. 62) ed errori tipici',
          paragraphs: [
            'In 1D $g_{\\mathrm{1D}}(\\omega) = \\frac{2N}{\\pi\\omega_{\\max}}(1 - \\omega^2/\\omega_{\\max}^2)^{-1/2}$ diverge a $\\omega_{\\max}$ dove $v_g = 0$; in 3D i punti $\\nabla_{\\mathbf{k}}\\omega = \\mathbf{0}$ producono cuspidi finite (picchi TA e LA ai bordi di zona). Il modello di Debye trascura tali picchi, i rami ottici dei cristalli con base, l’anisotropia, l’anarmonicità e il contributo elettronico nei metalli. A bassa $T$ l’energia per unità di volume del gas di fononi è $\\tilde{u}_{\\mathrm{ph}}(T) = \\frac{\\pi^2 k_B^4}{10\\hbar^3 v_s^3}T^4$ (eq. 62), ovvero $3/2$ della formula di Stefan–Boltzmann $\\tilde{u}_\\gamma(T) = \\frac{\\pi^2 k_B^4}{15\\hbar^3 c^3}T^4$ a parità di velocità ($3$ polarizzazioni contro $2$), ma valida solo per $T \\ll \\Theta_D$ per via del taglio $\\omega_D$.',
            'Errori tipici da evitare (§26): (1) confondere $\\Theta_E$ (singolo modo) con $\\Theta_D$ (taglio superiore, tipicamente $\\Theta_E \\sim 0{,}7\\text{–}0{,}8\\,\\Theta_D$); (2) credere che Einstein sbagli perché «classico»: è quantistico e sbaglia per la sola frequenza; (3) dimenticare il fattore $3$ tra $g(\\omega)$ per polarizzazione e $3g(\\omega)$ totale (normalizzata a $3N$, non a $N$); (4) applicare la legge $T^3$ a qualsiasi $T < \\Theta_D$: è asintotica per $T \\lesssim \\Theta_D/50$ (a $T = \\Theta_D/10$ sovrastima ancora del $\\approx 3\\%$, mentre Einstein a $\\Theta_E = \\Theta_D$ è $\\sim 17$ volte più piccolo); (5) ricordare che valori sopra $3R$ in Tab. 2 (Na $27{,}6$ e Pb $26{,}7$ a $273\\text{ K}$) superano il limite armonico per anarmonicità, contributo elettronico o differenza $C_P - C_V$.'
          ]
        }
      ]
    },
    foot: 'Fonte: dispensa Parte 6, Lezione 4 (§§20–23, §25, Figg. 23–27, Tabb. 2–4, eqq. 52–59 e 61–62). I valori sperimentali e le temperature Θᴅ provengono dalle Tabb. 2 e 3 della dispensa (per il diamante si adotta Θᴅ = 2230 K di Tab. 3 da Kittel, segnalando 1880 K nel grafico delle slide, e la stima 77 K ≈ 0,08 J mol⁻¹K⁻¹ del §22.7). Le velocità del suono medie vₛ usate nella stima dimensionale di ũₚₕ (tappa 1953) sono valori indicativi esterni alla dispensa.'
  }
} as const
