# Rapporto incarico `gemini-08-schermata-iniziale`

## 1. Cosa ho fatto

### Creazione del modulo schermata iniziale (`src/renderer/src/home/`)
- Creato `src/renderer/src/home/HomeScreen.tsx`:
  - Visualizzato all'avvio dell'applicazione quando nessuna sezione è attiva (`activeSectionId === null`), senza barra laterale né controlli di navigazione laterale.
  - Testata con titolo dell'applicazione (`shellStrings.appName`) e riga descrittiva (`homeStrings.appSubtitle`).
  - Griglia centrata dei 5 macro-capitoli del corso nell'ordine esatto: *Teoria delle bande* (attivo), *Cristallografia* (in arrivo), *Reticolo reciproco e diffrazione* (in arrivo), *Fononi* (in arrivo), *Semiconduttori* (in arrivo).
- Creato `src/renderer/src/home/ActiveChapterCard.tsx`:
  - Riquadro interattivo «Teoria delle bande» con stessa dimensione e proporzione dei riquadri futuri (altezza uniforme 400 px).
  - A riposo: titolo, etichetta «6 sezioni» e miniatura statica delle bande calcolate da `physics/` (elettroni quasi liberi con gap ben visibile).
  - Permanenza di 2 secondi ininterrotta del cursore o del fuoco da tastiera: avvio dell'anteprima ciclica animata tra i 6 metodi (circa 2,5 secondi per metodo, con transizione morbida di dissolvenza incrociata di 500 ms interpolata con `easeInOutCubic`).
  - Durante l'anteprima compare l'elenco delle 6 sezioni con evidenziata quella mostrata in quel momento; il passaggio iniziale è protetto da clock monotonicamente crescente (`startTime = now` sul primo frame RAF) e clamping contro indici negativi.
  - Al disimpegno (uscita del puntatore o perdita del fuoco) l'anteprima si arresta immediatamente e il riquadro torna allo stato di riposo; prima dei 2 secondi compare solo il bordo di fuoco (`TOKENS.focus`).
  - Clic (su qualsiasi punto del riquadro) o pressione di Invio/Spazio naviga alla prima sezione nell'ordine del corso (*Reticolo vuoto e schemi di zona*).
  - Modalità «riduci movimento» (`useReducedMotion`): nessuna animazione; trascorsi 2 secondi compare l'elenco delle sezioni con miniatura ferma e avviso esplicito di movimento ridotto.
- Creato `src/renderer/src/home/UpcomingChapterCard.tsx`:
  - Stile attenuato (`opacity: 0.65`, fondo `--bg`), badge «in arrivo», `cursor: not-allowed` e `aria-disabled="true"`.
  - Illustrazione statica su Canvas 2D per ciascun capitolo.
  - Non cliccabile, privo di anteprima interattiva o elenchi di argomenti inventati. Raggiungibile via Tab per l'accessibilità della griglia con anello di fuoco attenuato (`TOKENS.dim`).
- Creato `src/renderer/src/home/UpcomingSketchCanvas.tsx`:
  - Illustrazioni statiche tracciate su Canvas 2D tramite `useCanvasDraw`, `drawMathText` e `withAlpha`:
    1. *Cristallografia*: reticolo 2D, cella elementare primitiva evidenziata con vettori $\mathbf{a}_1, \mathbf{a}_2$ e nodi reticolari atomici.
    2. *Reticolo reciproco e diffrazione*: pattern di diffrazione di Laue con anelli concentrici, punti $(h, k)$ simmetrici e fascio trasmesso centrale.
    3. *Fononi*: catena monoatomica 1D con linea di equilibrio, profilo sinusoidale di spostamento, molle a zig-zag tra atomi e sfere atomiche deviate.
    4. *Semiconduttori*: bande di conduzione $E_c$ e valenza $E_v$ con gap, livelli donatore $E_d$ tratteggiato con elettroni e accettore $E_a$ con buche, etichette KaTeX.
- Creato `src/renderer/src/home/BandPreviewCanvas.tsx`:
  - Canvas 2D per la miniatura e l'anteprima ciclica con crossfade continuo `(1 - fadeProgress) * current + fadeProgress * next`.
  - Linee di simmetria verticali tratteggiate con etichette KaTeX di alta simmetria ($k$) e bande tracciate con il colore canonico dell'energia (`QUANTITIES.E.color`).
- Creato `src/renderer/src/home/curves.ts`:
  - Calcolo e memorizzazione delle 6 serie di curve dell'anteprima e della miniatura a riposo:
    1. *Reticolo vuoto*: `emptyLatticeBands` ($a = 3{,}0\text{ \AA}$, 4 bande).
    2. *Kronig–Penney*: `kronigPenneyBands` (delta, $P = 2{,}0$, 4 bande).
    3. *Elettroni quasi liberi*: `nearlyFreeBands` ($a = 3{,}0\text{ \AA}$, $V_G = -0{,}5\text{ eV}$, 11 onde piane, 4 bande).
    4. *Legami forti*: `tightBindingMonoatomicBands` (catena monoatomica, bande $s$ e $p$).
    5. *Metodo k·p*: `kaneBands` (modello di Kane con bande $c, hh, lh, so$ vicino a $\Gamma$).
    6. *Pseudopotenziale*: `pseudopotentialBands` per silicio lungo $L\text{–}\Gamma\text{–}X\text{–}W\text{–}K\text{–}\Gamma$ con $gMaxSq = 11$ (esattamente 51 onde piane, calcolato una volta sola).
  - Miniatura a riposo: `computeRestingCurves` calcola rapidamente le bande degli elettroni quasi liberi con gap ben visibile.
  - Le curve dell'anteprima si calcolano solo alla prima attivazione dell'anteprima (`getPreviewCurves()`), lasciando l'avvio dell'app completamente privo di ritardo.
- Creato `src/renderer/src/home/curves.test.ts`:
  - 5 test unitari con Vitest che verificano: 6 serie con id corrispondenti ai 6 metodi, valori numerici finiti, ascisse $k \in [0, 1]$ monotone, ordinamento delle bande $E_b(k) \le E_{b+1}(k)$, miniatura a riposo, persistenza della cache e tempo di calcolo.
- Creato `src/renderer/src/home/home.css` e `strings.ts`:
  - Layout responsive lavagna scura: 3 colonne a larghezze $\ge 1100\text{ px}$, 2 colonne a $800\text{ px}$, 1 colonna sotto i $640\text{ px}$.
  - Riquadri uniformi da 400 px con testata a `min-height: 44px` per allineamento orizzontale perfetto di tutti i 5 canvas a `top: 73px` sia con titoli su una riga che su due righe, linee nette, assenza di ombre e sfumature, e token cromatici da `ui/theme.ts`.

### Modifiche ai file comuni autorizzati
1. `src/renderer/src/App.tsx`:
   - Stato `activeSectionId: string | null` (inizializzato a `null`).
   - Se `!activeSectionId`, renderizza `HomeScreen` con callback `onSelectSection={setActiveSectionId}`.
   - All'interno di una sezione, passa ad `AppShell` la prop `onGoHome={() => setActiveSectionId(null)}`.
2. `src/renderer/src/sections/registry.ts`:
   - Aggiunto il tipo `ChapterStatus` e `ChapterEntry`.
   - Aggiunta la costante `ALL_CHAPTERS` con i 5 macro-capitoli e il conteggio sezioni (nessuna modifica alle sezioni esistenti in `SECTIONS`).
   - `DEFAULT_SECTION_ID` impostato a `'empty-lattice'`.
3. `src/renderer/src/strings.ts`:
   - Aggiunta stringa `goHome: 'Torna alla schermata iniziale'`.
   - Aggiornata la nota a piè di pagina `footnote` in `'Capitolo 1: Teoria delle bande completo (6 sezioni disponibili).'`.
4. `src/renderer/src/ui/shell.tsx`:
   - Aggiunta la prop opzionale `onGoHome?: () => void` a `AppShell` e `goHome?: string` a `ShellLabels`.
   - Testata `.nav-header`: se `onGoHome` è presente, `.nav-brand` diventa un pulsante accessibile (`<button type="button" className="nav-brand nav-brand-btn">`) che torna alla schermata iniziale e chiude il cassetto laterale.
   - Aggiunto il pulsante dedicato `.nav-close` in cima alla barra laterale aperta, visibile solo sui layout a scomparsa (sotto 1024 px), chiaramente separato dal nome dell'app.
   - La barra si richiude su click del pulsante di chiusura, click sul nome dell'app, selezione di una sezione, pressione del tasto Esc o click sullo sfondo `.nav-backdrop`.
5. `src/renderer/src/ui/ui.css`:
   - Stili per `.nav-header`, `.nav-brand-btn` e `.nav-close`.
   - Regola `@media (max-width: 1023px)` che abilita `.nav-close` come `inline-flex`.

---

## 2. Cosa ho verificato davvero

1. **Compilazione TypeScript senza errori:**
   ```sh
   export PATH="$PWD/.tools/node/bin:$PATH" && npm run typecheck
   ```
   *Esito:* codice 0, nessun errore sia su `tsconfig.node.json` che su `tsconfig.web.json`.

2. **Suite di test unitari con Vitest:**
   ```sh
   export PATH="$PWD/.tools/node/bin:$PATH" && npm test
   ```
   *Esito:* codice 0. Tutti i 15 file di test (116 test complessivi) sono passati con successo, inclusi i 5 test della suite `src/renderer/src/home/curves.test.ts`.

3. **Verifica dettagliata delle curve dell'anteprima (`curves.test.ts`):**
   - 6 serie di curve con ID corretti: `'empty-lattice'`, `'kronig-penney'`, `'nearly-free'`, `'tight-binding'`, `'k-dot-p'`, `'pseudopotential'`.
   - Tutti i valori numerici di energia sono finiti (`Number.isFinite`).
   - Ascisse normalizzate in $[0, 1]$ monotone crescenti per tutti i punti.
   - Tutte le bande ordinate in energia per ogni $k$: $E_b(k) \le E_{b+1}(k) + 10^{-9}$.
   - Curva a riposo con 4 bande finite e ordinate.
   - Verifica della memorizzazione in cache (seconda chiamata restituisce l'istanza identica con costo nullo).

4. **Tempo di calcolo delle curve dell'anteprima:**
   - Misurato tramite `getPreviewCalculationTimeMs()` e timer ad alta risoluzione:
     - Calcolo completo delle 6 serie (incluso lo pseudopotenziale empirico del Si con 51 onde piane e 101 punti lungo $L\text{–}\Gamma\text{–}X\text{–}W\text{–}K\text{–}\Gamma$): **~45 ms**.
     - Calcolo della miniatura a riposo: **~2 ms**.
     - Chiamate successive: **0 ms** (cache in memoria).
   - L'avvio dell'applicazione non calcola l'anteprima dei 6 metodi; la schermata iniziale si apre istantaneamente.

5. **Build di produzione finale:**
   ```sh
   export PATH="$PWD/.tools/node/bin:$PATH" && npm run build
   ```
   *Esito:* codice 0, bundle Electron e renderer generati correttamente.

6. **Isolamento dei file:**
   - `git diff --stat` conferma modifiche unicamente ai file autorizzati: `ActiveChapterCard.tsx`, `home.css`, `shell.tsx`, `ui.css`, `strings.ts`, `App.tsx`, `sections/registry.ts`, e nuovi file sotto `src/renderer/src/home/`.
   - Nessuna modifica a `physics/`, `viz/`, `CLAUDE.md` o `AGENTS.md`.

7. **Verifica empirica nel browser reale tramite Chrome DevTools Protocol (CDP):**
   - Eseguito server di sviluppo `npm run dev:web` e connesso a Google Chrome headless via porta di debugging remoto CDP.
   - Verificato l'intero set di 31 controlli interattivi e responsivi:
     - Titolo e sottotitolo corretti; presenza esatta dei 5 riquadri macro-capitoli.
     - Griglia a 3 colonne a 1440 px e 1100 px; griglia a 2 colonne a 800 px.
     - Allineamento geometrico perfetto di tutti i 5 riquadri (altezza uniforme 400 px, `card-head` 44 px, `canvasTop` 73 px su tutti i riquadri inclusa la scheda con titolo lungo su due righe).
     - Riquadro attivo «Teoria delle bande»: mostra «6 sezioni» a riposo.
     - Cursore mantenuto per 1,0 s: nessun avvio dell'anteprima, solo evidenziazione del bordo di fuoco (`is-engaged`). Uscita del cursore: disimpegno immediato.
     - Cursore mantenuto per 2,2 s ininterrotti: avvio regolare dell'anteprima (`is-previewing`), comparsa dell'elenco delle 6 sezioni, tag metodo attivo `1/6 Reticolo vuoto`.
     - Ciclo animato: avanzamento a `2/6 Kronig–Penney` dopo 2,5 s; ritorno a riposo all'uscita del cursore.
     - Clic o Invio sul riquadro attivo: navigazione confermata alla prima sezione (*Reticolo vuoto e schemi di zona*).
     - Ritorno alla home: clic su `.nav-brand-btn` nella barra laterale riporta alla schermata iniziale.
     - Layout a 800 px: barra laterale a scomparsa chiusa all'avvio, apertura via `.nav-toggle`, pulsante dedicato `.nav-close` visibile in cima con etichetta accessibile; chiusura verificata via `.nav-close`, tasto Esc, clic sullo sfondo `.nav-backdrop`, e ritorno alla home via pulsante del nome app.
     - 4 riquadri in arrivo: confermati `aria-disabled="true"`, `cursor: not-allowed`, assenza di navigazione o animazione.
     - Modalità `prefers-reduced-motion: reduce`: comparsa dell'elenco sezioni e avviso esplicito dopo 2 s con miniatura ferma senza animazioni.

---

## 3. Cosa non ho potuto verificare

- L'esecuzione del pacchetto completo Electron (`npm run dev` nativo desktop) richiede una sessione grafica con Window Manager nativo (macOS GUI) e non può essere automatizzata in sola riga di comando; tuttavia l'applicazione renderer è stata testata con successo nel motore Chrome reale (Chromium 157) corrispondente alla versione di Electron.

---

## 4. Problemi trovati in ordine di gravità

1. `Bloccante` (risolto) — *Eccezione a runtime su inizio anteprima ciclica (`cycleIndex = -1`)*:
   - *File e riga:* `src/renderer/src/home/ActiveChapterCard.tsx`.
   - *Sintomo:* al decorso dei 2 secondi di hover, `performance.now()` catturato prima del callback RAF risultava talvolta leggermente superiore al timestamp `now` del primo frame vsync (`now - startTime < 0`). In JavaScript `-0.001 % 6` restituisce `-1`, causando l'accesso a `previewCurves[-1]` (`undefined`) e scatenando `TypeError: Cannot read properties of undefined (reading 'title')` che smontava l'albero React lasciando lo schermo bianco.
   - *Risoluzione:* inizializzato `startTime = null` con assegnazione di `startTime = now` sul primo frame effettivo, clamping `Math.max(0, now - startTime)` e normalizzazione matematica modulo positivo `((cycleIndex % n) + n) % n`, più fallback difensivo in `currentData`.

2. `Importante` (risolto) — *Disallineamento verticale dei canvas nella prima riga*:
   - *File e riga:* `src/renderer/src/home/home.css`.
   - *Sintomo:* il titolo «Reticolo reciproco e diffrazione» andava a capo su due righe portando l'altezza della testata a ~42 px rispetto ai 28 px delle schede adiacenti, provocando un disallineamento verticale di ~14 px tra i canvas della prima riga.
   - *Risoluzione:* impostato `min-height: 44px` su `.card-head` e `align-items: flex-start` su `.card-title-group`. Tutti i 5 canvas ora hanno coordinate `canvasTop = 73px` perfettamente uniformi.

3. `Minore` (risolto) — *Altezza scheda e rischio overflow con movimento ridotto*:
   - *File e riga:* `src/renderer/src/home/home.css`.
   - *Sintomo:* con altezza fissa a 384 px, l'inserimento dell'avviso di movimento ridotto sotto l'elenco delle 6 sezioni rischiava di sfondare il bordo inferiore della scheda.
   - *Risoluzione:* portata l'altezza uniforme a 400 px, garantendo margini ariosi e corretta leggibilità.

4. `Minore` (risolto) — *Navigazione sezioni dall'anteprima*:
   - *File e riga:* `src/renderer/src/home/ActiveChapterCard.tsx`.
   - *Sintomo:* le voci dell'elenco sezioni avevano gestori `onClick` con `stopPropagation` che conducevano a sezioni specifiche, in contrasto con il requisito tassativo che impone di accedere sempre e solo alla prima sezione del capitolo.
   - *Risoluzione:* rimossi i gestori di stop-propagation dalle voci di elenco; qualsiasi clic sul riquadro naviga alla prima sezione (*Reticolo vuoto e schemi di zona*).

---

## 5. Dubbi e domande per la regia

1. **Nome dell'app provvisorio**: `shellStrings.appName` oggi è `'Stato Solido'`. Quando verrà scelto il nome definitivo dell'applicazione, basterà aggiornare quella singola stringa in `src/renderer/src/strings.ts` e si propagherà automaticamente alla schermata iniziale, al pulsante home e alla barra laterale.
2. **Prossimi capitoli**: i 4 riquadri in arrivo sono predisposti per accogliere le relative sezioni quando verranno create le cartelle dei capitoli successivi.
