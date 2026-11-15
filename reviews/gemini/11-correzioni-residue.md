# Rapporto incarico `gemini-11-correzioni-residue.md`

Autore: Claude (sessione dell'utente, su sua richiesta «leggi AGENTS.md ed esegui l'incarico 11»). Un solo autore, nessuna squadra. Niente commit, niente push, nessuna dipendenza nuova.

## 1. Cosa ho fatto

**Pseudopotenziale** (`sections/pseudopotential/`)
- Barra dei comandi rifatta in una griglia 2 colonne × 3 righe: materiale | termine Vᵃ (o nota del Ge); `a` | V₃ˢ; V₈ˢ | V₁₁ˢ. Le tre note («Si, Ge e GaAs…», «Base fcc a 2 atomi…», «Gusci in unità…») sono nella Scheda teoria (nuova sezione «Comandi e materiali»); il testo di Vᵃ attivo/spento è nel `title` del pulsante e i valori di Vᵃ restano nel pannello dei valori.
- Legende in HTML sotto il titolo di ogni vista, fuori dall'area del grafico (componente nuovo `viz/ChartLegend.tsx`, stili in `viz/viz.css`). Via le legende disegnate dentro i tre canvas.
- Titoli delle viste su una riga, troncata con «…» e testo intero nel `title`: serve a rendere certa l'altezza delle viste.
- Etichette «gap diretto/indiretto» e «m*/m₀»: nuove funzioni in `viz/canvas.ts` (`buildObstacleMap`, `obstacleCost`, `placeFreeLabel`) cercano il posto più libero e vicino su tutta l'area, fondo opaco, trattino di richiamo se l'etichetta finisce lontana. Pesi per guscio: titolo in alto, fascia riservata alle percentuali, la barra più alta non tocca più il testo.
- Formule vive verso i comandi: `active` dei cursori ora dipende anche da `highlight` (V_ps, V_G, V^s → i tre cursori; V^a → pulsante Vᵃ con `is-active`; `a` → cursore del passo). Se un solo fattore è attivo da chip o grafico, si accende solo quello.
- **Ge** (punto 12): preset aggiunto (`manifest.ts`, `store.ts`, `strings.ts`), test in `physics/pseudopotential.test.ts`, nota a schermo accanto al materiale (breve, nel posto del pulsante Vᵃ) e nel pannello dei valori (frase intera dell'incarico), più nella Scheda teoria.

**k·p** (`sections/k-dot-p/`)
- Barra dei comandi in 3 righe (modello su tutta la riga; i cursori; il materiale). La nota sui dati è nella Scheda teoria e nel `title` del selettore.
- Titoli su una riga; righe della scena `minmax` con minimi espliciti (148/98/290 px di vista).
- InSb: con E_g piccolo (c a meno di 42 px da hh/lh) le linee restano in scala, il testo di c va su una riga sopra la sua linea e quelli di hh/lh sotto le loro, con trattino di richiamo; i riquadri cliccabili si adattano.
- Due bande: legenda del diagramma in HTML (sempre presente la prima voce, così il grafico non cambia misura accendendo «Confronto»); etichetta «|P·k| < E_g/2 (indicativo)» disegnata dopo le curve con `placeFreeLabel` (posto libero + trattino verso la fascia); «vicino a Γ» con lo stesso metodo.
- Testi: `contribHint` → «nello stato scelto: somma 1 + …»; `analyticMass` → «dalla formula».

**Legami forti, Kronig–Penney, Reticolo vuoto**
- Legami forti: comandi in una griglia (`.tb-params-grid`, colonne ≥ 148 px, interruttore di catena e contatore su due colonne).
- Kronig–Penney: la legenda sta sempre nella fascia riservata sopra il grafico (tolto il ramo che la metteva sulle curve); nessuna collisione con le etichette dei gap.
- Reticolo vuoto: tolta la stringa `valuesTitle`.

**Comuni**
- Punto 9: tutti i colori fuori dai fogli di stile passano da `ui/theme.ts` (vedi §6). Controllo finale: il `grep` dell'incarico non dà righe. Ho tolto anche gli ultimi `rgba(...)` nei componenti (`KpBandPlot`, `KronigBandsAndConditionPlot`, `ZoneSchemesPlot`, `viz/BandPlot.tsx`).
- Punto 10: `.view-body > canvas` (`ui/ui.css`). I canvas annidati hanno ora la regola del proprio contenitore: `.pseudo-canvas-box`, `.pseudo-shells-box`, `.kdotp-canvas-box`, `.tb-bands-wrap`, `.tb-real-main`, `.tb-edges-canvas-box`.

**Schermata iniziale** (`home/home.css`, punto 11): nei riquadri «in arrivo» sono attenuati immagine (0,4), titolo e corpo (0,5); bordo e scritta «IN ARRIVO» a piena opacità. Nel riquadro attivo la miniatura prende lo spazio libero (124 → 150 px), il corpo ha altezza fissa di 120 px (140 con «riduci movimento», per l'avviso): il riquadro resta di 356 px e l'elenco dell'anteprima ci sta (altezza 120, `scrollHeight` 120).

## 2. Cosa ho verificato davvero

Comandi (dopo l'ultima modifica al codice):
- `tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json` → exit 0.
- `vitest run` → **15 file, 138 test passati su 138** (137 + il nuovo del Ge).
- `electron-vite build` → il renderer compila (`✓ built in 316ms`); ho visto solo la coda dell'output, non le righe di main/preload.
- `grep -rnE "#[0-9a-fA-F]{6}" src/renderer/src/sections src/renderer/src/viz src/renderer/src/home` → nessuna riga (nemmeno nei `.css`).

Ge (calcolato dal codice, 113 onde piane, 40 punti per tratto, e riletto nell'app): gap **0,953 eV indiretto, minimo in L**; conduzione Γ/X/L = 1,22 / 1,17 / 0,95 eV. Coincide con l'atteso, quindi il preset è stato aggiunto. L'app mostra «mis. 0,66 eV (indiretto)».

Verifica nel browser (server di sviluppo, poi build servita con `vite preview`), tutti gli strumenti accesi, in ogni variante e con ogni materiale: misure del DOM a 1440×900, 1100×800 e 800×700 per tutte e sei le sezioni (nessuno scorrimento da 1100×800 in su, nessuno scorrimento orizzontale, nessun canvas senza posizione); nessun errore in console dopo un caricamento pulito (prima c'erano errori transitori dell'aggiornamento a caldo mentre scrivevo i file); formule vive verificate con eventi sintetici (V_G → tre cursori accesi; V^a → pulsante acceso; `a` → cursore del passo).

Schermate che ho guardato (le misure del DOM non bastano): Pseudopotenziale GaAs e Ge a 1100×800 (con ingrandimento di tutti e tre i canvas), Si a 800×700 (ingrandito), GaAs a 1440×900; k·p InSb Kane e due bande, GaAs Kane, Ge Kane a 1100×800 (Livelli in Γ ingrandito per InSb e Ge); Legami forti monoatomica a 1100×800 e biatomica a 1440×900; Kronig–Penney a delta (1100×800 e 1440×900) e rettangolare (1100×800); Home a 1440×900.

### Tabella delle misure (altezza dei canvas in px · altezza della barra dei comandi)

| Sezione | 1440×900 | 1200×900 | 1100×800 | 800×700 |
|---|---|---|---|---|
| Pseudopotenziale (GaAs) | 191 · 190 · 350 · 78 · 115 | 166 · 165 · 332 · 78 · 115 | 151 · 150 · 262 · 64 · 115 | 151 · 150 · 258 · 64 · 115 (scorre) |
| Pseudopotenziale (Si, Ge) | — | 167 · 182 · 334 · 78 · 113 | 151 · 166 · 264 · 64 · 113 | 151 · 166 · 258 · 64 · 113 (scorre) |
| k·p, Kane (GaAs/InSb/Ge) | — | — | 133 · 84 · 296 · 121 | 124 · 73 · 248 · 121 (scorre) |
| k·p, due bande | 167 · 108 · 370 · 115 | — | 134 · 85 · 299 · 115 | 124 · 73 · 248 · 115 (scorre) |
| Legami forti, monoatomica | 250 · 465 · 83 | 217 · 388 · 147 | 181 · 306 · 147 | non misurata |
| Legami forti, biatomica | 250 · 465 · 83 | 229 · 408 · 115 | 193 · 326 · 115 | 136 · 258 · 115 |
| Kronig–Penney | 236 · 439 · 95 | — | 187 · 316 · 97 | 154 · 237 · 127 (scorre) |
| Reticolo vuoto | 244 · 454 · 99 | — | 147 · 347 · 139 | 116 · 279 · 131 |
| Elettroni quasi liberi | 238 · 444 · 116 | — | 178 · 337 · 156 | 154 · 273 · 148 (scorre) |

Ordine delle altezze: Pseudopotenziale = spazio reale · v(q) · bande · pesi; k·p = livelli · contributi · E(k); le altre = spazio reale · bande. Il secondo canvas di Legami forti coincide con la sovrapposizione degli estremi (stessa misura), qui riportato una volta. 1200×900 per Pseudopotenziale e Legami forti è misurato sulla build (`vite preview`); per k·p, Kronig–Penney, Reticolo vuoto e Quasi liberi non l'ho rifatto (l'incarico chiede le tre finestre 1440/1100/800).

Minimi richiesti (Pseudopotenziale): 1100×800 bande 262 ≥ 250, viste in alto 150 ≥ 150, pesi 64 ≥ 64; 1200×900 bande 332 ≥ 300; 800×700 stessi minimi, la colonna scorre (818/700). k·p a 1100×800: 133 ≥ 120, 84 ≥ 70, 296 ≥ 240; a 800×700 124, 73, 248.

## 3. Cosa non ho potuto verificare

- **I fattori del Ge** (V₃ˢ = −0,23, V₈ˢ = 0,01, V₁₁ˢ = 0,06 Ry) **non sono stati controllati sull'articolo di Cohen e Bergstresser** (Phys. Rev. 141, 789, 1966): li ha indicati la regia a memoria e io non ho accesso alla fonte. Il risultato numerico coincide con la dispensa (minimo in L, ≈ 0,9 eV), ma questo non prova che siano i valori dell'articolo. A schermo c'è scritto «Cohen–Bergstresser (1966)» come da incarico.
- La finestra Electron nativa: ho usato solo il renderer nel browser (il comando di sviluppo ha aperto anche una finestra Electron che non ho ispezionato; i processi sono stati chiusi).
- «Riduci movimento»: non ho emulato la preferenza. Non ho aggiunto transizioni nuove; vale la regola globale di `ui.css` (`transition: none !important`).
- Schermate non guardate: Reticolo vuoto e Quasi liberi (solo misure del DOM: ho toccato solo la regola `.view-body > canvas` e un `rgba`), k·p due bande con GaAs e Ge, tutte le sezioni a 800×700 tranne il Si dello pseudopotenziale, Legami forti monoatomica a 800×700 (non misurata).
- Il controllo «nessuna etichetta copre una curva» è visivo su 1100×800 e 800×700; sui valori intermedi o con `a`, V^s fuori preset non ho provato tutte le combinazioni.

## 4. Problemi trovati e limiti

**Importante**
1. **Legami forti: «due righe» solo da circa 1440 px.** Con «Riempimento» acceso la catena monoatomica ha otto comandi (interruttore, cinque cursori, «Avvicina gli atomi», contatore): su 612 px di barra (1200×900) non c'è larghezza per due righe senza tracce di cursore di pochi pixel. Risultato: 83 px (due righe) a 1440×900 in entrambe le catene; a 1200×900 e 1100×800 147 px (quattro righe) per la monoatomica e 115 px per la biatomica. Se serve di più, bisogna spostare un comando fuori dalla barra (es. il contatore nella barra superiore: `ui/shell.tsx`, fuori dal mio perimetro).
2. **Titoli delle viste troncati** (Pseudopotenziale e k·p) con «…»: è il prezzo per avere altezze certe. Esempio: in v(q) la frase «i 3 punti sono parametri veri (trascinabili)» è leggibile solo nel suggerimento. Il cursore diventa verticale sui punti e la legenda dice «parametri Vˢ»; se la regia preferisce due righe, i minimi saltano di circa 16 px per vista.

**Minore**
3. `home/home.css:227` e `ui/ui.css:105` usano `var(--lineStrong)`, ma la variabile definita da `theme.ts` è `--line-strong`: il bordo non viene applicato. Non l'ho corretto (fuori dal perimetro: del punto 11 solo l'attenuazione).
4. In console compare un avviso di KaTeX («carattere Unicode ’ non riconosciuto») da testi con `’` dentro `$…$` in `empty-lattice/strings.ts` e `nearly-free/strings.ts` (es. `empty-lattice/strings.ts:96`). Preesistente, non toccato.
5. Il «lh» che esce dal bordo destro (punto 8) **non l'ho riprodotto** nella build attuale (InSb e GaAs, due bande, 1100×800): l'etichetta resta dentro. Se la regia l'ha visto in una combinazione precisa, mi serve quale.
6. In `PresetMenu` (`ui/controls.tsx`) non c'è un `title`: i suggerimenti sui selettori stanno su un `div` che lo avvolge. Non ho toccato `controls.tsx`.

## 5. Dubbi e domande per la regia

1. Titoli di vista su una riga con «…»: va bene, o preferite due righe e minimi più bassi?
2. Legami forti: due righe solo da 1440 px va bene, o sposto il contatore degli elettroni nella barra superiore (serve un via libera su `ui/shell.tsx`)?
3. `ChartLegend` è un componente nuovo in `viz/` (usato da Pseudopotenziale e k·p): è nel perimetro dei «punti sulle etichette», ma lo segnalo perché non era nominato.

## 6. Tabella dei punti

| # | Punto | Stato | File principali | Come verificato |
|---|---|---|---|---|
| 1 | Barra comandi Pseudopotenziale ≤ 130 px | fatto (115 con GaAs e Vᵃ visibile) | `PseudopotentialSection.tsx`, `pseudopotential.css`, `strings.ts` | misura DOM a tre finestre; schermate |
| 2 | Altezze minime Pseudopotenziale | fatto | `pseudopotential.css` | misure (tabella) |
| 3 | Legende fuori dai grafici | fatto (Pseudopotenziale: HTML; k·p: HTML; Kronig–Penney: fascia riservata) | `viz/ChartLegend.tsx`, `viz/viz.css`, `EpmBandPlot.tsx`, `KDotPSection.tsx`, `KronigBandsAndConditionPlot.tsx` | schermate ingrandite |
| 4 | Etichette sopra le curve (gap, m*, percentuale) | fatto, con funzioni nuove (`placeFreeLabel`) invece di `placeGapLabelBox`/`placeProbeLabel`, che non cercano su tutta l'area | `viz/canvas.ts`, `EpmBandPlot.tsx`, `ShellWeightsBar.tsx` | schermate ingrandite di GaAs, Si, Ge |
| 5 | Formule vive → comandi | fatto | `PseudopotentialSection.tsx`, `pseudopotential.css` | eventi sintetici sul DOM (cursori accesi) |
| 6 | k·p: altezze minime | fatto | `kDotP.css`, `KDotPSection.tsx` | misure (tabella) |
| 7 | InSb: etichette c e hh | fatto | `GammaLevelsCanvas.tsx` | schermata ingrandita |
| 8 | k·p due bande: legenda, etichetta zona, testi | fatto, tranne «lh» fuori bordo non riprodotto | `KpBandPlot.tsx`, `KDotPSection.tsx`, `strings.ts` | schermata ingrandita |
| C-LF | Legami forti: comandi su due righe con «Riempimento» | in parte (due righe da 1440 px) | `TightBindingSection.tsx`, `tightBinding.css` | misure a 1440/1200/1100 |
| C-KP | Kronig–Penney: legenda fuori dal grafico | fatto | `KronigBandsAndConditionPlot.tsx` | schermate a 1440 e 1100 (delta e rettangolare) |
| C-RV | `valuesTitle` | fatto | `empty-lattice/strings.ts` | `grep` + typecheck |
| 9 | Colori solo dal tema | fatto | `ui/theme.ts`, `RealSpacePseudoCanvas.tsx`, `EpmBandPlot.tsx`, `TightBindingRealSpace.tsx`, `BandExtremumOverlay.tsx` (+ `rgba` in altri 4 file) | `grep` dell'incarico: nessuna riga |
| 10 | `.view-body canvas` → figlio diretto | fatto, con regole per i sei contenitori annidati | `ui/ui.css`, tre fogli di sezione | misure DOM di ogni canvas (tutti posizionati) |
| 11 | Riquadri bloccati e miniatura | fatto | `home/home.css` | misura DOM + schermata a 1440×900 |
| 12 | Preset Ge | fatto (fattori non controllati sulla fonte) | `manifest.ts`, `store.ts`, `strings.ts`, `physics/pseudopotential.test.ts` | test + app: 0,95 eV, minimo in L, 1,22/1,17/0,95 |

## 7. Nomi e codici aggiunti al tema (`ui/theme.ts`)

Toni derivati (`DERIVED_TONES`, funzione `toneColor`, variabili CSS `--tone-<nome>`):

| Nome | Codice | Derivato da | Uso |
|---|---|---|---|
| `conductionBands` | `#b4de9e` | E | bande di conduzione dello pseudopotenziale |
| `smoothWavefunction` | `#f0b3e7` | ψ | parte liscia ψᶠ |
| `realPartWave` | `#cad8ea` | neutro | Re ψ_k nella catena |
| `faintOrbitalA` | `#4f899c` | a | orbitale debole, famiglia A |
| `faintOrbitalB` | `#9c6647` | E_F | orbitale debole, famiglia B |
| `bondingText` | `#96e8d4` | v | etichetta dell'estremo legante |
| `antibondingText` | `#f7b6ad` | V_2G | etichetta dell'estremo antilegante |

Strutture: `LOBE_PALETTES` (lobi A, B, monoatomica; colore pieno con trasparenza `#rrggbbaa`, stessi valori di prima) e `EXTREMUM_PILLS` (legante e antilegante).

## 8. Altre cose da sapere

- Stringhe nuove o cambiate (Pseudopotenziale): `presets.note` (ora «Si, Ge e GaAs…»), `presets.geNote`, `presets.geShortNote`, `presets.controlsHeading`, `antisymmetric.shortLabel` (il pulsante Vᵃ con l'etichetta intera non entra in una colonna di 250 px; l'intera sta nel `title`), `scene.formVaLegend`, `scene.realLegendAria`, `scene.formLegendAria`, `scene.bandsLegendAria`, `scene.formPointsLegend` (ora con KaTeX). k·p: `scene.bandsLegendAria`, `scene.contribHint`, `values.analyticMass`. Reticolo vuoto: tolta `formula.valuesTitle`.
- Fuori dall'elenco dell'incarico ho toccato, per necessità: `viz/BandPlot.tsx` (una riga: `rgba` → `withAlpha(TOKENS.text, …)` e l'import), `viz/viz.css` (stili della legenda), `kDotP.css` (le regole del cursore puntavano a classi inesistenti: ora `.kp-levels-canvas` e `.kp-contrib-canvas`).
- Ho avviato `electron-vite dev --rendererOnly` e `vite preview` solo per verificare, e li ho chiusi: nessun processo rimasto.
