# Revisione di Integrazione Multi-Capitolo — Fase 0 (Capitolo Fononi)

- **Ruolo**: Revisore di Integrazione Multi-Capitolo (`.agents/skills/revisore-integrazione/SKILL.md`)
- **Ambito**: Fase 0 — Infrastruttura multi-capitolo del capitolo *Fononi* (`piano-fononi.md`)
- **Verdetto**: **da correggere** (0 problemi bloccanti, zero regressioni su *Teoria delle bande*; 1 difetto funzionale importante nell'hook condiviso `usePlaybackPhase` e 1 segnalazione cromatica su `QUANTITIES` da valutare prima della Sezione 2)

---

## 1. Comandi eseguiti ed esiti esatti

Tutti i comandi Node/npm sono stati eseguiti in PowerShell anteponendo `.tools\node` al `PATH` (`$env:PATH = "$PWD\.tools\node;$env:PATH"`):

| Verifica | Comando eseguito | Exit code | Esito esatto |
|---|---|---:|---|
| Typecheck | `npm.cmd run typecheck` (`tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json`) | `0` | Nessun errore di tipo su main, preload e renderer. |
| Test unitari | `npm.cmd test` (`vitest run`) | `0` | **18 file di test passati (18/18), 148 test passati (148/148)** in `3.61s`: tutti i 138 test preesistenti di *Teoria delle bande* + 10 nuovi test di Fase 0 (`constants.test.ts`: 2, `theme.test.ts`: 2, `dispersionPlot.test.ts`: 2, nuovi casi Fononi in `home/curves.test.ts`: 4). |
| Build di produzione | `npm.cmd run build` (`npm run typecheck && electron-vite build`) | `0` | Main (`out/main/index.js`, `1.21 kB`), preload (`out/preload/index.js`, `0.14 kB`) e renderer (`out/renderer/index.html`, `epmWorker-D5ov2p22.js` `24.17 kB`, `index-BiIwEtyk.css` `75.43 kB`, `index-DtIXLAtl.js` `1,693.74 kB`, 113 moduli) compilati senza errori né warning. |
| Stato repository | `git status -sb` / `git diff --stat` (non disponibile: `git` assente dal sistema) → verifica sostitutiva read-only via Node su `.git/index` (hashing SHA-1 blob-exact delle 231 voci tracciate + scansione file non tracciati) | `0` | **13 file tracciati modificati**, **0 file cancellati**, **5 nuovi file sorgente/test** sotto `src/` (più `.agents/`, `materiale/parte6/`, `piano-fononi.md` e `*.tsbuildinfo` ignorati da `.gitignore`). |
| Analisi statica layer, colori, Electron | Script Node read-only su `src/renderer/src/physics/`, sui 16 file modificati/nuovi fuori da `ui/theme.ts` e su tutto `src/renderer/src/` | `0` | **0 import vietati** in `physics/` (unici import esterni a `./` sono `vitest` nei `*.test.ts`), **0 colori hex/rgb/rgba/hsl hardcoded** fuori da `ui/theme.ts`, **0 riferimenti ad API Electron** nel renderer. |
| Coerenza `QUANTITIES`/`DERIVED_TONES` e distanze ΔE | Script Node read-only su `src/renderer/src/ui/theme.ts` vs `piano-fononi.md` | `0` | Tutte le 10 nuove grandezze (`24` totali) e i 5 nuovi toni derivati (`12` totali) coincidono esattamente con `piano-fononi.md`; rilevata vicinanza percettiva `omegaOpt`/`u` (ΔE = `7.2`, vedi §4). |

### Cosa non è stato possibile verificare
- **`git` CLI nativo**: l'eseguibile `git` non è presente sul sistema Windows; lo stato esatto del working tree è stato comunque verificato in modo deterministico confrontando gli SHA-1 dei file con `.git/index`, ma non è stato possibile stampare uno unified diff da packfile compressi senza decodificare `.git/objects/pack`.
- **Rendering interattivo nel browser** (`npm run dev:web` a 1440/1100/800 px): fuori dall'ambito statico di questa verifica (demandato a `critico-grafico` e `studente`).

---

## 2. File proibiti, sicurezza e isolamento dei layer

- **File proibiti intatti (SHA-1 identico a `.git/index`)**: `progetto.md`, `CLAUDE.md`, `AGENTS.md`, `.claude/`, `incarichi/`, `materiale/parte3/`, `materiale/parte4/`, tutte le 6 sezioni di *Teoria delle bande* (`empty-lattice`, `kronig-penney`, `nearly-free`, `tight-binding`, `k-dot-p`, `pseudopotential`), `package.json`, `package-lock.json`, `src/renderer/index.html`, `src/main/`, `src/preload/`.
- **Dipendenze (`package.json`)**: nessuna nuova dipendenza aggiunta.
- **CSP (`src/renderer/index.html:6-9`)**: invariata (`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:`).
- **Isolamento `physics/`**: `src/renderer/src/physics/constants.ts` e `constants.test.ts` sono TypeScript puro senza alcun import da React, DOM, `ui/`, `viz/`, `sections/` o `home/`. Tutte le 9 costanti richieste da `piano-fononi.md` sono presenti con i valori CODATA 2018 esatti e riesportate tramite `physics/index.ts`.
- **Indipendenza da Electron nel renderer**: confermata assenza di chiamate a `ipcRenderer`, `window.electron`, `window.api` o import da `'electron'`.

---

## 3. File condivisi toccati e valutazione del rischio conflitto con il collega

| File | Tipo modifica | Retrocompatibilità | Rischio conflitto col collega |
|---|---|---|---|
| `src/renderer/src/physics/constants.ts` | Aggiunta in coda di costanti SI/fononiche e helper di conversione | Totale (le 6 definizioni esistenti sono invariate) | **Basso** — aggiunte puramente append-only in fondo al file. |
| `src/renderer/src/ui/theme.ts` | Aggiunta di 10 voci in `QUANTITIES` e 5 in `DERIVED_TONES` | Totale (tutte le 14 grandezze e 7 toni esistenti intatti) | **Basso–Medio** — file centrale del design system; aggiunte solo in coda ai due oggetti. |
| `src/renderer/src/sections/registry.ts` | Aggiunta delle 6 voci `phonons` in `SECTIONS`, capitolo `phonons` in `CHAPTERS`, promozione in `ALL_CHAPTERS` | Totale (le 6 sezioni di `bands`, `DEFAULT_SECTION_ID` e i tipi esportati sono preservati) | **Medio** — punto di registrazione unico; se il collega aggiunge sezioni o campi a `SectionEntry`/`ALL_CHAPTERS` servirà un merge manuale semplice. |
| `src/renderer/src/strings.ts` | Aggiunta chiavi `chapters.phonons`, `sections.phonon*`, rimozione di `'Fononi'` da `upcoming`, aggiornamento `footnote` | Totale per `ShellLabels` e per le chiavi di `bands` | **Medio** — modifiche concentrate su `upcoming` e `footnote`. |
| `src/renderer/src/App.tsx` | Guard difensiva `if (!entry \|\| !entry.component)` con fallback a `<HomeScreen />` | Totale | **Basso** — intervento minimo e difensivo. |
| `src/renderer/src/home/HomeScreen.tsx` | Attivazione card #4 (*Fononi*) tramite `ActiveChapterCard`, mantenendo la griglia regolare a 5 card | Totale (layout a 5 card e card #1 *Teoria delle bande* invariati) | **Medio** — tocca la griglia principale; `UpcomingChapterCard.tsx` e `UpcomingSketchCanvas.tsx` sono stati lasciati intatti riducendo la superficie di conflitto. |
| `src/renderer/src/home/ActiveChapterCard.tsx` | Generalizzazione con prop opzionali (`getResting`, `getPreview`, `accentQuantity`, `ariaLabel`), gestione stato transitorio 0 sezioni disponibili | Totale (tutti i default coincidono col comportamento originale di *Teoria delle bande*) | **Medio** — rifattorizzazione pulita ma estesa su un file creato dal collega. |
| `src/renderer/src/home/BandPreviewCanvas.tsx` | Supporto ai campi opzionali `bandColors` e `defaultColor` su `MethodPreviewData` | Totale (fallback a `QUANTITIES.E.color`) | **Basso** — modifica di poche righe a valle di `drawMethodBands`. |
| `src/renderer/src/home/curves.ts` (+ `curves.test.ts`) | Aggiunta `bandColors?`/`defaultColor?` a `MethodPreviewData` e funzioni `compute/getPhononRestingCurves` e `compute/getPhononPreviewCurves` in coda | Totale (funzioni Bande intatte e test preesistenti verdi) | **Basso** — blocco Fononi isolato in fondo al file (righe 228–530). |
| `src/renderer/src/home/strings.ts` | Aggiunta helper `sectionsCountFor`, `activeAriaLabelFor`, hint per stato in preparazione e descrizione `phonons` | Totale (vecchie chiavi `sectionsCount`, `activeAriaLabel` conservate) | **Basso**. |
| `src/renderer/src/home/home.css` | Uso di `color: var(--q, var(--q-E))` su `.is-active-badge` | Totale | **Basso** — modifica minima e isolata. |
| `src/renderer/src/viz/viz.css` | Aggiunta selettore `.dispersion-canvas:focus-visible` e sezioni CSS nuove per `DispersionPlot` e `PlaybackControls` | Totale (regole di `LiveFormula`, `ChartLegend`, `BandPlot`, `RealSpaceView` intatte) | **Basso** — aggiunte quasi interamente in coda al file. |
| Nuovi file (`constants.test.ts`, `theme.test.ts`, `DispersionPlot.tsx`, `PlaybackControls.tsx`, `dispersionPlot.test.ts`) | Creazione ex novo | N/A | **Nullo** — nessun conflitto possibile. |

---

## 4. Problemi trovati (ordinati per gravità)

### Bloccante
Nessuno.

---

### Importante

1. **`usePlaybackPhase.resetPhase()` non ridisegna il canvas quando l'animazione è in pausa o con `prefers-reduced-motion`**
   - **File e riga**: `src/renderer/src/viz/PlaybackControls.tsx:188-190` (in combinazione con `src/renderer/src/viz/canvas.ts:55-80`).
   - **Cosa è sbagliato**: `resetPhase` esegue solo `phaseRef.current = 0` senza aggiornare alcuno stato React. `useCanvasDraw` pianifica un nuovo fotogramma esclusivamente quando: (a) il callback `draw` restituisce `true` (animazione attiva), (b) il canvas cambia dimensione, oppure (c) il componente si ri-renderizza. Quando la riproduzione è in pausa (`effectivePlaying === false`) — oppure con `prefers-reduced-motion` attivo — il loop RAF è fermo (`again === false`): premere il pulsante «Ripristina fase» azzera silenziosamente il `ref` ma **lascia il canvas congelato al fotogramma vecchio** finché l'utente non preme di nuovo Avvia o non tocca un altro controllo.
   - **Perché conta**: `usePlaybackPhase` è il componente infrastrutturale destinato a guidare tutte le animazioni delle Sezioni 1–5. Correggerlo ora (es. mantenendo uno stato `const [resetTick, setResetTick] = useState(0)` incrementato dentro `resetPhase` ed eventualmente esposto nel valore di ritorno) evita di propagare il difetto in 5 sezioni.

2. **Bassa distinguibilità cromatica tra `omegaOpt` (`#f59e56`) e `u` (`#ff9e64`) in `QUANTITIES`**
   - **File e riga**: `src/renderer/src/ui/theme.ts:66` (`omegaOpt: '#f59e56'`) e `src/renderer/src/ui/theme.ts:74` (`u: '#ff9e64'`).
   - **Cosa è sbagliato**: sebbene i codici hex rispettino esattamente la tabella approvata in `piano-fononi.md`, la distanza percettiva CIE Lab tra `omegaOpt` e `u` è appena **ΔE = 7,2** (due arancioni caldi quasi identici su fondo `#0f1114`). A differenza delle coppie inter-capitolo (`t`/`M` ΔE=3,4, `EF`/`omegaOpt` ΔE=4,0, `mstar`/`Theta` ΔE=4,4) che non coesistono nella stessa schermata, `omegaOpt` e `u` compaiono **insieme** nella Sezione 2 (*Catena biatomica*: ramo ottico $\omega_+$ vs spostamenti $u_n(t)$ / rapporto $\alpha$) e nella Sezione 4 (*Pacchetti d'onda*: ramo ottico vs pacchetto/spostamento). Si segnala inoltre la vicinanza tra `vp` (`#c49bff`) e `Theta` (`#b892ff`, ΔE = 6,2) e tra `a` (`#58c4dd`, riusata nei Fononi) e `CV` (`#5ccfe6`, ΔE = 4,3), meno critiche perché in sezioni diverse.
   - **Suggerimento**: prima di iniziare la Sezione 2, valutare con la regia se aggiornare il colore di `u` (es. verso un tono corallo-magenta o giallo-ambra ben separato da `omegaOpt` `#f59e56`, `C` `#e8795e` e `k` `#f4d345`) aggiornando di conseguenza `piano-fononi.md`, `ui/theme.ts` e `ui/theme.test.ts`.

---

### Minore

1. **Fade-out interrotto e frame a vuoto su `probe` e `lightLine` in `DispersionPlot`**
   - **File e riga**: `src/renderer/src/viz/DispersionPlot.tsx:237-243`, `545`, `619`.
   - **Dettaglio**: quando `props.probe` o `props.lightLine` passano da un oggetto a `null`, `anim.probe.set(0)` / `anim.light.set(0)` fa scendere il valore verso `0` mantenendo `moving = true` per ~0,5 s, ma le condizioni `if (p.lightLine && anim.light.value > 0.01)` e `if (p.probe && anim.probe.value > 0.01)` diventano subito `false` al primo frame: l'overlay sparisce di colpo (niente dissolvenza in uscita) mentre il canvas continua a eseguire fotogrammi a vuoto fino a convergenza dello `Smoothed`. Per un vero fade-out (o per evitare frame inutili) conviene memorizzare l'ultimo overlay non-null in un `ref` finché `anim.*.value > 0.01`, oppure azzerare `Smoothed` quando la prop è `null`.

2. **Fisica fononica calcolata inline in `home/curves.ts` (debito tecnico transitorio)**
   - **File e riga**: `src/renderer/src/home/curves.ts:238-304`, `341-518`.
   - **Dettaglio**: il commento in testa a `home/curves.ts:4` afferma che tutte le curve arrivano da `physics/`. In Fase 0 i moduli `physics/phononDispersion.ts`, `phonon3d.ts`, `phononQuantum.ts` e `specificHeat.ts` non esistono ancora, quindi il calcolo inline è accettabile come soluzione transitoria (usa comunque `AMU_KG` e `RAD_S_TO_THZ` da `../physics` e le formule verificate sono corrette). Da sostituire progressivamente con chiamate a `../physics` al completamento delle Sezioni 1–6.

3. **Accessibilità del pulsante Play/Pausa (`aria-pressed` + `aria-label` dinamica)**
   - **File e riga**: `src/renderer/src/viz/PlaybackControls.tsx:88-90`.
   - **Dettaglio**: il pulsante combina `aria-pressed={effectivePlaying}` con `aria-label={effectivePlaying ? text.pause : text.play}`. Con alcuni screen reader questo produce annunci ambigui (es. «Pausa, pulsante attivato»). Preferibile mantenere `aria-label` stabile (es. `'Riproduzione animazione'`) con `aria-pressed`, oppure omettere `aria-pressed` lasciando `aria-label` dinamica `'Avvia'` / `'Pausa'`.

4. **Stringa inutilizzata in `home/strings.ts`**
   - **File e riga**: `src/renderer/src/home/strings.ts:11`.
   - **Dettaglio**: `inPreparationNotice: 'Sezioni in preparazione: prima sezione in arrivo.'` non è referenziata in nessun componente.

5. **Precisione etichette asse y in `DispersionPlot` per passi molto piccoli**
   - **File e riga**: `src/renderer/src/viz/DispersionPlot.tsx:275`.
   - **Dettaglio**: `formatNumber(yv, yStep < 1 ? 1 : 0)` potrebbe mostrare etichette duplicate se una vista usasse `yStep < 0.1` (es. `0,05` arrotondato a `0,1`). Un gradino `yStep < 0.1 ? 2 : yStep < 1 ? 1 : 0` rende il componente più robusto.

6. **Commenti e tipo residui nei file `home/Upcoming*` (non toccati)**
   - **File e riga**: `src/renderer/src/home/UpcomingChapterCard.tsx:2` («4 capitoli bloccati»), `src/renderer/src/home/UpcomingSketchCanvas.tsx:2,17` (variante `'phonons'` non più usata).
   - **Dettaglio**: averli lasciati intatti in Fase 0 è una buona scelta per non creare conflitti inutili con il collega; da ripulire eventualmente solo in coordinamento.

---

## 5. Verdetto finale

**Da correggere** prima di procedere alla Sezione 1, limitatamente al fix (minimo, ~2 righe) di `usePlaybackPhase.resetPhase()` in `src/renderer/src/viz/PlaybackControls.tsx:188-190` affinché il pulsante «Ripristina fase» forzi sempre il ridisegno del canvas anche in pausa o con movimento ridotto (consigliato aggiungere anche il relativo test o verifica).  
Tutti i requisiti di integrazione multi-capitolo, retrocompatibilità su *Teoria delle bande*, isolamento dei layer, sicurezza CSP, typecheck, test (148/148) e build di produzione sono pienamente soddisfatti.
