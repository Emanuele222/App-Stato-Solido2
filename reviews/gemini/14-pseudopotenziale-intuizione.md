# Rapporto Incarico 14 — «Pseudopotenziale»: far vedere ψ di core e perché il metodo funziona

## 1. Cosa hai fatto

Ho riprogettato la fisica di supporto e l'intera interfaccia della sezione `pseudopotential` (`src/renderer/src/sections/pseudopotential/`) per mettere al centro lo spazio reale, rendere immediatamente distinguibile lo stato di core $\psi_c$, spiegare in tre passi perché il metodo funziona e mostrare la convergenza in onde piane rispetto al potenziale vero.

### Modifiche principali per file
- **Fisica (`src/renderer/src/physics/pseudoCore1d.ts` e `pseudoCore1d.test.ts`)**:
  - Sostituita `smoothestAlpha` con il criterio sempre finito per la funzione **non normalizzata** $\psi^{\mathrm f} = \psi_k + \alpha\psi_c$: $\alpha = -\langle\psi_c|T|\psi_k\rangle / \langle\psi_c|T|\psi_c\rangle$ (vale $0$ per gli stati dispari attorno allo ione).
  - Aggiornata `fixEigenvectorSign`: $\psi_c(0) > 0$ sullo ione; per le bande di valenza ($b \ge 1$) $\operatorname{Re}\psi_k(a/2) > 0$ tra gli ioni quando non nulla (nessun salto di segno lungo tutta la banda 1 in $(-\pi/a, \pi/a)$).
  - Aggiunte le funzioni pure `gaussianCrystalPotentialZeroMean`, `findSignChangesInCore`, `orthogonalityIntegrand1D`, `meanKineticEnergy1D`, `dominantPlaneWaveWeight` e `planeWaveConvergence1D`.
  - Aggiunti 3 nuovi test in `pseudoCore1d.test.ts` (tutti i numeri di riferimento in $\Gamma$ banda 1, $\alpha = 0$ su stati dispari e $|\alpha| < 2$ agli 8 estremi dei cursori su bande 1–3 senza salti lungo la banda 1, convergenza monotona non negativa con $N$ onde piane).
- **Tema (`src/renderer/src/ui/theme.ts`)**: aggiunte due sole voci a `DERIVED_TONES`:
  - `coreState`: `{ from: 't', color: '#6fb6ff', name: 'stato di core ψ_c ed E_c (tinta di t)' }` (usato per $\psi_c$, banda $E_c$, fascia $|x| < r_c$, area $\beta_c\psi_c$ e lobi positivi dell'ortogonalità);
  - `screenedPotential`: `{ from: 'v', color: '#56d4c0', name: 'pseudopotenziale V + V′ (tinta di v)' }` (usato per le barre $V + V'$ e la curva $H + V'$ di convergenza).
- **Modello, store, formule e testi (`manifest.ts`, `store.ts`, `model.ts`, `formulas.ts`, `strings.ts`)**:
  - Stato di apertura impostato in $\Gamma$ banda 1 (`defaultKIndex: 40`, `defaultBandIndex: 1`), con interruttore `smoothLock` («parte liscia») acceso all'avvio ($\alpha = +0{,}586$); il trascinamento manuale del cursore $\alpha$ spegne `smoothLock`.
  - In `model.ts`: $\psi^{\mathrm f}$ nello spazio reale è calcolata dai coefficienti **non normalizzati** `cPseudoRaw` (coincide con $\psi_k$ fuori dal core), mentre pesi $|c_G|^2$, energia cinetica media e peso dell'onda piana dominante usano `cPseudoNorm`. Per gli stati esattamente dispari per parità in $\Gamma$ banda 2 e $\pm\pi/a$ banda 1 ($\operatorname{Re}\psi_k \equiv 0$, $\alpha = 0$), la visualizzazione ruota di $-i$ per mostrare la funzione d'onda dispari reale e i lobi di ortogonalità senza alterare nessuna grandezza fisica.
  - Formule vive in `formulas.ts` spezzate su più righe con `\begin{array}{l}` e collegamento bidirezionale $\beta_c \leftrightarrow \alpha$ (`\htmlData{q=psi}`).
  - Scheda teoria riscritta sui tre passi («Perché lo pseudopotenziale funziona») con il nuovo paragrafo «Rispetto agli altri metodi».
- **Viste e layout (`PseudoCoreRealSpaceCanvas.tsx`, `PseudoCoreReciprocalCanvas.tsx`, `PseudoCoreBandPlot.tsx`, `PseudopotentialSection.tsx`, `pseudopotential.css`)**:
  - **Spazio reale** promosso a vista principale su **una cella** $x \in [-a/2, a/2]$ centrata sullo ione in tre fasce (25 % energie, 50 % funzioni d'onda, 25 % ortogonalità), banda $|x| < r_c$ comune, $\psi_c$ piena con contorno continuo da $2{,}4\text{ px}$, pallini sui cambi di segno di $\psi_k$, area $\beta_c\psi_c$ fra $\psi_k$ e $\psi^{\mathrm f}$, lobi di ortogonalità e **lettura guidata** («Tutto» · «1 Il problema» · «2 L’idea» · «3 Il risultato»).
  - **Onde piane** (sotto a sinistra): schede «Quante onde piane» (pesi $n = -4\ldots 4$ + errore logaritmico vs $N$ con soglia $0{,}01\text{ eV}$ e numeri $11$ e $3$) e «Cancellazione» (asse in eV e lettura per $n = 1$).
  - **Bande 1D** (sotto a destra): banda di core nel tono `coreState`, nessuna modifica funzionale.
  - **Comandi**: 2 righe fisse fino a $1100\times 800$, badge `E − E_c` come bottone sotto `f` (nessuna sovrapposizione), marcatore $\psi^{\mathrm f} = \psi_{\mathbf k}$ in $\alpha = 0$, interruttore «parte liscia».

---

### Tabella dei difetti («Perché questo incarico», stessa numerazione di riga)

| Riga | Difetto | Stato | File | Come verificato |
|---|---|---|---|---|
| 13 | $\psi_c$ linea punteggiata 1,4 px al 65 % stesso colore di $V(x)$ | **Fatto** | `PseudoCoreRealSpaceCanvas.tsx`, `ui/theme.ts` | Area piena + contorno continuo $2{,}4\text{ px}$ in `#6fb6ff` (`coreState`), verificato visivamente su screenshot |
| 14 | All'apertura $\alpha = 0$, quindi $\psi^{\mathrm f} \equiv \psi_k$ | **Fatto** | `store.ts`, `model.ts` | `smoothLock: true` all'apertura ($\alpha = +0{,}586$), verificato in valori e grafico |
| 15 | $\psi^{\mathrm f}$ disegnata normalizzata | **Fatto** | `model.ts` | `psiSmoothRe` usa `cPseudoRaw`; scarto fuori $2r_c \le 0{,}04$ verificato da test e sovrapposizione visiva |
| 16 | Spazio reale vista più piccola ($270\times 159$), core 16 % | **Fatto** | `pseudopotential.css`, `model.ts`, `PseudoCoreRealSpaceCanvas.tsx` | Spazio reale in alto su 1 cella $[-a/2, a/2]$; canvas $414\text{ px}$ ($1440\times 900$) e $333\text{ px}$ ($1100\times 800$), core $\approx 32\%$ |
| 17 | Stato di apertura $k = 0{,}3\pi/a$ | **Fatto** | `manifest.ts` | `defaultKIndex: 40` ($\Gamma$, banda 1), verificato al caricamento |
| 18 | Indicatore «peso in $\|n\| \le 3$» non distingue nulla | **Fatto** | `PseudopotentialSection.tsx`, `strings.ts` | Rimosso; aggiunti cambi di segno, $\beta_c$, cinetiche medie, onda dominante, onde $< 0{,}01\text{ eV}$, $E - V$ locale |
| 19 | `smoothestAlpha` diverge ($-7\cdot 10^{10}$ in $\Gamma$ banda 2) | **Fatto** | `physics/pseudoCore1d.ts` | Nuovo criterio finito; in $\Gamma$ banda 2 e $\pi/a$ banda 1 restituisce $0{,}000$, testato $< 10^{-8}$ |
| 20 | Formule tagliate a destra ($349$ e $494$ in $319\text{ px}$) | **Fatto** | `formulas.ts` | Spezzate su più righe; misurato `scrollWidth === clientWidth` (`rightOverflowPx = 0`) a 1440, 1100 e 800 px |
| 21 | Riquadro `E − E_c` copre valore di `f`; comandi su 3 righe ($138\text{ px}$) a $1100\times 800$ | **Fatto** | `PseudopotentialSection.tsx`, `pseudopotential.css` | Bottone `E − E_c` spostato sotto `f` (`overlap = 0`); griglia comandi su 2 righe alta $81{,}86\text{ px}$ a $1100\times 800$ |
| 22 | Simboli con `_` nei testi; `1.9e-16` con il punto | **Fatto** | `strings.ts`, `PseudopotentialSection.tsx`, canvas | 0 `_` trovati nel DOM visibile di `.section`; ortogonalità scritta come `< 10⁻¹⁰` |

---

### Toni aggiunti a `DERIVED_TONES` (`src/renderer/src/ui/theme.ts`)
- `coreState`: `#6fb6ff` (`from: 't'`, stato di core $\psi_c$, banda $E_c$, area $\beta_c\psi_c$, lobi positivi ortogonalità e fascia $|x| < r_c$)
- `screenedPotential`: `#56d4c0` (`from: 'v'`, barre $V + V'$ e curva di convergenza $H + V'$)

---

### Confronto numerico in $\Gamma$, banda 1 ($a = 4{,}0\text{ Å}$, $V_0 = 60\text{ eV}$, $s = 0{,}25\text{ Å}$, 81 onde piane)

| Grandezza in $\Gamma$, banda 1 | Riferimento | Calcolato (`pseudoCore1d.ts` / UI) |
|---|---|---|
| $E_c$; $E$; $E - E_c$ | $-19{,}079$; $13{,}089$; $32{,}17\text{ eV}$ | $-19{,}079$; $13{,}089$; $32{,}17\text{ eV}$ |
| $r_c$; cambi di segno di $\psi_k$ | $0{,}641\text{ Å}$; due, in $x = \pm 0{,}413\text{ Å}$ | $0{,}641\text{ Å}$; 2 in $x = \pm 0{,}413\text{ Å}$ |
| $\psi_k$ sullo ione e a metà tra gli ioni | $-0{,}232$; $+0{,}783\text{ Å}^{-1/2}$ | $-0{,}232$; $+0{,}783\text{ Å}^{-1/2}$ |
| $\psi_c$ sullo ione | $1{,}202\text{ Å}^{-1/2}$ | $1{,}202\text{ Å}^{-1/2}$ |
| $\alpha$ parte liscia; $\beta_c = -\alpha$ | $+0{,}586$; $-0{,}586$ | $+0{,}586$; $-0{,}586$ |
| $\psi^{\mathrm f} = \psi_k + \alpha\psi_c$ sullo ione; minimo nel core | $+0{,}472$; $+0{,}383$ | $+0{,}472$; $+0{,}383$ |
| scarto $|\psi^{\mathrm f} - \psi_k|$ per $|x| > 2r_c$ | $\le 0{,}04$ | $0{,}0374 \le 0{,}04$ |
| energia cinetica media: $\psi_c$; $\psi_k$; $\psi^{\mathrm f}$ norm. | $10{,}57$; $4{,}83$; $0{,}90\text{ eV}$ | $10{,}57$; $4{,}83$; $0{,}90\text{ eV}$ |
| peso onda piana dominante: $\psi_k$; $\psi^{\mathrm f}$ | $54{,}1\text{ \%}$; $93{,}5\text{ \%}$ | $54{,}1\text{ \%}$; $93{,}5\text{ \%}$ |
| integrando ortogonalità $\psi_c\cdot\psi_k$: area $+$; $-$ | $+0{,}1275$; $-0{,}1275$ | $+0{,}1275$; $-0{,}1275$ |
| cinetica locale $E - V$: ione; tra gli ioni (core su ione) | $63{,}7\text{ eV}$; $3{,}69\text{ eV}$ ($31{,}5\text{ eV}$) | $63{,}7\text{ eV}$; $3{,}69\text{ eV}$ ($31{,}5\text{ eV}$)* |
| errore su $E$ con $N$ onde, potenziale vero | $N=3$: $0{,}529$; $5$: $0{,}174$; $7$: $0{,}061$; $9$: $0{,}019$; $11$: $0{,}005\text{ eV}$ | $0{,}5292$; $0{,}1739$; $0{,}0607$; $0{,}0191$; $0{,}0051\text{ eV}$ |
| errore su $E$ con $N$ onde, $H + (E - E_c)|\psi_c\rangle\langle\psi_c|$ | $N=1$: $0{,}829$; $3$: $0{,}003$; $5$: $< 0{,}001\text{ eV}$ | $0{,}8290$; $0{,}0033$; $0{,}0002\text{ eV}$ |
| onde piane per errore $< 0{,}01\text{ eV}$ | $11$ contro $3$ | $11$ contro $3$ |

\* Nota sullo zero di energia: poiché l'Hamiltoniana omette la componente media $V_{G=0} = -9{,}400\text{ eV}$, la cinetica locale coerente usa `gaussianCrystalPotentialZeroMean(x, params)` $= V(x) - V_{G=0}$, così da condividere esattamente lo stesso zero di energia di $E$ ed $E_c$.

---

## 2. Cosa hai verificato davvero

1. **Typecheck, test automatici e build di produzione** (dopo l'ultima modifica):
   - Comando: `export PATH="$PWD/.tools/node/bin:$PATH" && npm run typecheck && npm test && npm run build`
   - Risultato: uscito con codice `0`; `tsc --noEmit` (node + web) senza errori; `vitest run` **22/22 file, 206/206 test passati** (durata `7,22 s`; i 12 test di `pseudoCore1d.test.ts` tutti verdi); `electron-vite build` completata (`✓ built in 516ms`).
2. **Verifica visiva e misurazioni nel browser** (`npx vite preview --outDir out/renderer --port 5173 --strictPort`, subagente browser con ispezione diretta di tutti gli screenshot):
   - **0 errori in console** su tutta la sessione.
   - **Altezze misurate (`.view` / `.pseudo1d-canvas-box` / `.pseudo1d-params-grid`)**:
     - `1440×900` («Tutto»): Spazio reale **`457,80 px`** (canvas **`414,02 px`** $\ge 360\text{ px}$); Onde piane **`279,59 px`** (canvas **`235,81 px`**); Bande 1D **`279,59 px`** (canvas **`238,59 px`**); barra comandi `.pseudo1d-params-grid` **`81,86 px`** (**2 righe**); nessuna sovrapposizione, nessuno scorrimento esterno (`html`/`body` `1440×900`).
     - `1100×800` («Tutto»): Spazio reale **`377,05 px`** (canvas **`333,27 px`** $\ge 300\text{ px}$); Onde piane **`230,08 px`** (canvas **`166,80 px`** $\ge 150\text{ px}$); Bande 1D **`230,08 px`** (canvas **`169,58 px`** $\ge 150\text{ px}$); barra comandi **`81,86 px`** (**2 righe**); nessuna sovrapposizione, nessuno scorrimento esterno.
     - `1100×800` («1 Il problema» con fascia di testo attiva): canvas Spazio reale **`307,86 px`** ($\ge 300\text{ px}$); viste inferiori **`166,80 px`** e **`169,58 px`** ($\ge 150\text{ px}$).
     - `800×700`: scorre solo la colonna centrale `.stage` (`490×700`, scroll di `481 px`), sovrapposizione `.scene` vs `.params` = `0 px`; altezze vista/canvas: Spazio reale `380 / 336,22 px`, Onde piane `240 / 195,22 px`, Bande 1D `240 / 199 px`, barra comandi `200,30 px` (5 righe).
   - **Stati e controlli provati**:
     - $\Gamma$ banda 1 (apertura): $E_c = -19{,}079\text{ eV}$, $E = 13{,}089\text{ eV}$, 2 cambi di segno ($x = \pm 0{,}413\text{ Å}$), $\alpha = +0{,}586$, $\beta_c = -0{,}586$, onde $11$ vs $3$.
     - $\Gamma$ banda 2 (stato dispari): $\alpha = 0{,}000$, $\beta_c = 0{,}000$, 1 cambio di segno ($x = 0{,}000\text{ Å}$), nota «Stato dispari attorno allo ione: è ortogonale a $\psi_c$ per simmetria», onde $13$ vs $13$.
     - $\pi/a$ banda 1: $E = 10{,}499\text{ eV}$, $\alpha = 0{,}000$, $\beta_c = 0{,}000$.
     - $k \approx 0{,}25\pi/a$ su banda 1, estremi di $a$ ($3{,}5 \dots 4{,}8$), $V_0$ ($50 \dots 75$), $s$ ($0{,}20 \dots 0{,}28$), interruttore «parte liscia» spento trascinando $\alpha$ e riacceso al clic, lettura guidata («Tutto», «1 Il problema», «2 L’idea», «3 Il risultato»), schede «Quante onde piane» e «Cancellazione».
     - Collegamenti incrociati («Bande dei materiali veri →» e ritorno «← Da dove viene $V_{\mathrm{ps}}$»), schermata iniziale e sezione «Elettroni quasi liberi».
   - **Controlli su DOM**: `0` overflow orizzontali nelle tre `.live-formula` (a 1440, 1100 e 800 px), `0` trattini bassi `_` nel testo visibile di `.section`, nessuna sovrapposizione tra `E − E_c` e il valore di `f`.

---

## 3. Cosa non hai potuto verificare

- L'esecuzione dentro la finestra nativa di Electron (`npm run dev` / `npm run dev:web` falliscono nella sandbox su macOS per `persistent_cache_sandboxed_file_factory` / permessi GPU); la verifica visiva è stata eseguita sul build di produzione servito con `vite preview`.
- La verifica interattiva di tutte le altre sei sezioni oltre a «Bande dei materiali veri» ed «Elettroni quasi liberi» dopo l'ultima modifica (verificato comunque l'intero `typecheck`, tutti i 206 test e il caricamento della Home e di due sezioni di controllo, mentre la modifica ha toccato solo `sections/pseudopotential/`, `physics/pseudoCore1d*` e due aggiunte a `DERIVED_TONES` in `ui/theme.ts`).
- Il comportamento a runtime con `prefers-reduced-motion: reduce` abilitato nelle impostazioni di sistema (nel codice `PseudoCoreBandPlot` usa `useReducedMotion()` e `ui.css:786` disattiva transizioni e animazioni CSS).

---

## 4. Problemi trovati

- **Minore (esterno ai file modificabili, aggirato nella sezione)** — `src/renderer/src/viz/canvas.ts:681-718` (`placeFreeLabel`): il parametro `opts.occupied` viene aggiornato a fine funzione (`opts.occupied?.push(box)` alla riga 717), ma non viene letto nel calcolo di `cost` (riga 684), che controlla soltanto la `ObstacleMap` statica `opts.obstacles`. Di conseguenza, due etichette libere con ancore vicine possono sovrapporsi. Per non modificare `viz/`, in `PseudoCoreRealSpaceCanvas.tsx` ho ricostruito `buildObstacleMap(..., occ)` dopo ogni etichetta piazzata.
- **Nota sul repository preesistente** — `src/renderer/src/physics/pseudopotential.test.ts` risultava già modificato localmente prima dell'inizio di questo incarico (timeout `30_000` alla riga 230, non toccato).

---

## 5. Dubbi e domande per la regia

- Nessun dubbio bloccante. Segnalo soltanto alla regia se convenga, in un futuro intervento su `viz/canvas.ts`, far sì che `placeFreeLabel` consideri anche `opts.occupied` (oppure aggiorni una mappa incrementale), così che le sezioni non debbano ricostruire `buildObstacleMap` tra un'etichetta e l'altra.
