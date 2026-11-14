# Rapporto incarico `gemini-08-schermata-iniziale`

## 1. Cosa ho fatto

### Creazione del modulo schermata iniziale (`src/renderer/src/home/`)
- Creato `src/renderer/src/home/HomeScreen.tsx`:
  - Visualizzato all'avvio dell'applicazione quando nessuna sezione è attiva (`activeSectionId === null`), senza barra laterale né controlli di navigazione laterale.
  - Testata con titolo dell'applicazione (`shellStrings.appName`) e riga descrittiva (`homeStrings.appSubtitle`).
  - Griglia centrata dei 5 macro-capitoli del corso nell'ordine esatto: *Teoria delle bande* (attivo), *Cristallografia* (in arrivo), *Reticolo reciproco e diffrazione* (in arrivo), *Fononi* (in arrivo), *Semiconduttori* (in arrivo).
- Creato `src/renderer/src/home/ActiveChapterCard.tsx`:
  - Riquadro interattivo «Teoria delle bande» con stessa dimensione e proporzione dei riquadri futuri (altezza fissa 384 px).
  - A riposo: titolo, etichetta «6 sezioni» e miniatura statica delle bande calcolate da `physics/` (elettroni quasi liberi con gap ben visibile).
  - Permanenza di 2 secondi ininterrotta del cursore o del fuoco da tastiera: avvio dell'anteprima ciclica animata tra i 6 metodi (circa 2,5 secondi per metodo, con transizione morbida di dissolvenza incrociata di 500 ms interpolata con `easeInOutCubic`).
  - Durante l'anteprima compare l'elenco delle 6 sezioni con evidenziata quella mostrata in quel momento; ciascuna voce dell'elenco è cliccabile per navigare direttamente a quella specifica sezione.
  - Al disimpegno (uscita del puntatore o perdita del fuoco) l'anteprima si arresta immediatamente e il riquadro torna allo stato di riposo; prima dei 2 secondi compare solo il bordo di fuoco (`TOKENS.focus`).
  - Clic o pressione di Invio/Spazio naviga alla prima sezione nell'ordine del corso (*Reticolo vuoto e schemi di zona*).
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
  - Riquadri uniformi da 384 px con linee nette, assenza di ombre e sfumature, e token cromatici da `ui/theme.ts`.

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
   - `git diff --stat` conferma modifiche unicamente ai file previsti: `App.tsx`, `sections/registry.ts`, `strings.ts`, `ui/shell.tsx`, `ui/ui.css` e nuovi file sotto `src/renderer/src/home/`.
   - Nessuna modifica a `physics/`, `viz/`, `CLAUDE.md` o `AGENTS.md`.

---

## 3. Cosa non ho potuto verificare

- L'esecuzione visiva interattiva nel browser reale o finestra Electron (`npm run dev:web` / `npm run dev`) non è stata avviata in modalità headless con screenshot, poiché l'ambiente CLI della sessione non dispone di un server X11/browser grafico attivo o di strumenti come Playwright/Puppeteer installati.
- Il comportamento dinamico del timing di 2 secondi con il mouse e l'animazione RAF a 60 fps nel browser sono stati verificati tramite logica di componente, test unitari e revisione statica del codice, ma non con un puntatore mouse fisico in un display grafico.

---

## 4. Problemi trovati in ordine di gravità

Nessun problema bloccante o importante.

- `Minore` — *Visualizzazione senza argomenti per i capitoli futuri*: la bozza preliminare conteneva brevi descrizioni testuali con potenziali argomenti per Cristallografia, Reticolo reciproco, Fononi e Semiconduttori; sono state rimosse e sostituite con una nota generica «Contenuto in fase di progettazione per le versioni successive» per rispettare rigorosamente il vincolo di non inventare argomenti non ancora progettati.
- `Minore` — *Ripristino fuoco/hover*: se l'utente manteneva contemporaneamente il puntatore del mouse e il fuoco da tastiera sul riquadro attivo, una sfocatura da tastiera poteva interrompere prematuramente il timer di hover; la gestione è stata rifinita separando i flag `isHoveredRef` e `isFocusedRef` in modo che l'anteprima rimanga attiva finché almeno una delle due condizioni persiste.

---

## 5. Dubbi e domande per la regia

1. **Nome dell'app provvisorio**: `shellStrings.appName` oggi è `'Stato Solido'`. Quando verrà scelto il nome definitivo dell'applicazione, basterà aggiornare quella singola stringa in `src/renderer/src/strings.ts` e si propagherà automaticamente alla schermata iniziale, al pulsante home e alla barra laterale.
2. **Prossimi capitoli**: i 4 riquadri in arrivo sono predisposti per accogliere le relative sezioni quando verranno create le cartelle dei capitoli successivi.
