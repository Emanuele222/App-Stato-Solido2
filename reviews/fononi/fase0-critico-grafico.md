# Revisione Critico Grafico — Fase 0 (Infrastruttura multi-capitolo Fononi)

- **Ruolo**: Critico Grafico (Stile Lavagna Animata e Usabilità)
- **Oggetto**: Fase 0 del capitolo *Fononi* — `HomeScreen` multi-capitolo, `AppShell` (sidebar 2 capitoli attivi + 3 in arrivo), nuovi componenti condivisi `DispersionPlot.tsx` e `PlaybackControls.tsx`, CSS (`viz.css`, `home.css`, `ui.css`) e `theme.ts`.
- **Ambiente ispezionato**: build di produzione su `http://localhost:4173/` tramite 7 schermate catturate dal browser e misure DOM/console alle risoluzioni **1440×900**, **1100×800** e **800×700**, integrate da analisi statica del codice sorgente e dei CSS.

---

## 1. Cosa è stato verificato

### Ispezione visiva live (schermate + misure DOM/console)
- **1440×900 — HomeScreen a riposo**: sfondo `#0f1114`, griglia 3+2 dei 5 macro-capitoli (1. *Teoria delle bande* attivo, 2. *Cristallografia* in arrivo, 3. *Reticolo reciproco e diffrazione* in arrivo, 4. *Fononi* attivo, 5. *Semiconduttori* in arrivo), miniatura Na–Cl (ramo acustico `--q-omega` + ramo ottico `--q-omegaOpt`) nella card *Fononi*, badge `6 sezioni`, `scrollHeight = clientHeight = 900 px` (`docScrollMax = 0`, `homeRestScrollMax = 0`), 5/5 canvas renderizzati.
- **1440×900 — HomeScreen con clic sulla card Fononi**: rimane su `HomeScreen` (non entra per errore in *Teoria delle bande*), evidenzia il bordo con `--focus`, apre subito l'anteprima (`1/6 Catena monatomica`) e mostra l'elenco completo delle 6 sezioni pianificate senza sovrapposizioni né troncamenti, mantenendo l'altezza della card allineata a 356 px.
- **1440×900 — Sezione «Reticolo vuoto e schemi di zona»**: ingresso tramite clic su *Teoria delle bande*; barra laterale `.nav` (220×900, `navScrollMax = 0`) con 2 capitoli attivi (*Teoria delle bande* con 6 sezioni cliccabili, *Fononi* con 6 sezioni disabilitate/ordinate), 3 capitoli in «In arrivo» senza duplicazione di *Fononi*, piè di pagina aggiornato; `main` 820×900 (`mainScrollMax = 0`), `docScrollMax = 0`; ritorno pulito alla `HomeScreen` cliccando su «Stato Solido».
- **1100×800 — HomeScreen e Sezione**: griglia 3 colonne su `HomeScreen` (`scrollHeight ≈ 845 px`, overflow `+44,8 px`); in sezione `.nav` 200×800 (`scrollHeight ≈ 854 px`, overflow `+54,4 px`), `main` 540×800 (`mainScrollMax = 0`), `aside` 360×800, `docScrollMax = 0`.
- **800×700 — HomeScreen e Sezione**: griglia 2 colonne su `HomeScreen` (`scrollHeight ≈ 1217 px`); in sezione il drawer `.nav` (260×700) si apre correttamente tramite `.nav-toggle` con backdrop scuro e pulsante di chiusura.
- **Console del browser**: **0 errori** e 0 warning in tutti gli step e a tutte le risoluzioni.

### Verifica statica di codice e CSS
- **Ricerca colori hardcoded fuori da `theme.ts`** su tutto `src/renderer/src/**/*.{ts,tsx,css}` (esclusi `theme.ts` e `*.test.ts`):
  - **0 colori hex/rgba hardcoded** nei file di Fase 0 (`DispersionPlot.tsx`, `PlaybackControls.tsx`, `viz.css`, `home.css`, `HomeScreen.tsx`, `ActiveChapterCard.tsx`, `BandPreviewCanvas.tsx`, `curves.ts`).
  - Le uniche due occorrenze nell'intera base di codice sono preesistenti e lecite: `src/renderer/src/ui/ui.css:708` (`rgb(0 0 0 / 0.45)` per il backdrop del drawer) e `src/renderer/src/viz/canvas.ts:737` (helper `withAlpha` che applica alpha ai colori di `theme.ts`).
- **`DispersionPlot.tsx`**: legenda esterna `ChartLegend` sopra `.dispersion-plot-stage` (`DispersionPlot.tsx:915-921`), interpolazione con `Smoothed` e rispetto di `useReducedMotion()` (`:215-243`), arresto del ciclo `rAF` a riposo (`useCanvasDraw` riceve `moving = false` al termine della transizione).
- **`PlaybackControls.tsx` e `viz.css`**: classe `.num` (`tabular-nums`) sui pulsanti velocità (`PlaybackControls.tsx:112`), larghezza fissa minima `.playback-play-label { min-width: 36px }` (`viz.css:208`), congelamento completo con `prefers-reduced-motion` (pulsanti Play/Pausa e velocità disabilitati, etichetta «Istantanea», `effectivePlaying = false`, nessun `rAF` interno, transizioni azzerate in `viz.css:263-271`).

### Cosa non è stato verificato dal vivo
- **Rendering dal vivo con `prefers-reduced-motion: reduce`**: verificato in modo completo nel codice e nei CSS (`ActiveChapterCard.tsx`, `home.css:365-376`, `DispersionPlot.tsx`, `PlaybackControls.tsx`, `viz.css:263-271`), ma non è stata acquisita una schermata browser dedicata in modalità movimento ridotto.
- **Rendering dal vivo di `DispersionPlot` e `PlaybackControls`**: poiché in Fase 0 nessuna sezione di *Fononi* è ancora montata, i due componenti sono stati ispezionati solo staticamente nel codice e nei CSS (non ancora in esecuzione in una sezione reale).
- **Ciclo completo delle 6 curve fononiche oltre lo stato `1/6`**: nell'ispezione live è stato fotografato lo stato `1/6 Catena monatomica`; gli stati `2/6`…`6/6` sono stati verificati analiticamente da `curves.ts` e `BandPreviewCanvas.tsx`.

---

## 2. Problemi trovati (ordinati per gravità)

### Bloccanti
*Nessuno.*

---

### Importanti (difetti oggettivi)

1. **Overflow verticale della barra laterale `.nav` a 1100×800 introdotto dalle 6 sezioni di Fononi**
   - **Elemento / Risoluzione / Stato**: barra laterale `.nav` — **1100×800** — dentro la sezione *Reticolo vuoto e schemi di zona* (`step_10_shot_2.png`).
   - **File**: `src/renderer/src/ui/ui.css:68-76, 140-179, 675-680`, `src/renderer/src/strings.ts:24-29`.
   - **Cosa è sbagliato**: con l'aggiunta del secondo capitolo attivo (*Fononi*) nella barra laterale, tutti e 6 i titoli fononici (35–43 caratteri) vanno a capo su 2–3 righe dentro `--nav-w: 200px` (`Pacchetti d’onda: velocità di fase e gruppo` occupa 3 righe). L'altezza complessiva della sidebar sale a `scrollHeight ≈ 854 px` su `800 px` disponibili (`+54,4 px`), facendo comparire una barra di scorrimento nativa molto evidente proprio tra la navigazione e la scena e spingendo il piè di pagina `.nav-foot` fuori dallo schermo. Anche a 1440×900 la sidebar è ormai esattamente a filo (`900 / 900 px`), con margine zero.
   - **Perché conta**: compromette la pulizia visiva da «lavagna animata» a 1100×800 (risoluzione in cui non dovrebbe esserci overflow strutturale) e rende la sidebar satura già prima di attivare ulteriori sezioni.
   - **Direzione di correzione**: compattare leggermente il passo verticale della sidebar (`padding` di `.nav-header`, `.nav-item`, `.nav ul`, `.nav-upcoming-title` sotto 1280 px o globalmente) oppure usare etichette più concise nell'indice laterale, e applicare `scrollbar-width: thin` sulla `.nav` per quando scorre nel drawer a 800×700.

2. **Scorrimento verticale della `HomeScreen` a 1100×800 con taglio della parte inferiore della card «Fononi»**
   - **Elemento / Risoluzione / Stato**: contenitore `.home-screen` e seconda riga della griglia (`Fononi`, `Semiconduttori`) — **1100×800** — `HomeScreen` a riposo (`step_10_shot_1.png`).
   - **File**: `src/renderer/src/home/home.css:17, 27, 56, 80`.
   - **Cosa è sbagliato**: la `HomeScreen` raggiunge `scrollHeight ≈ 845 px` su `clientHeight = 800 px` (`+44,8 px` di scorrimento), tagliando sotto la piega gli ultimi ~45 px delle card *Fononi* e *Semiconduttori* (incluso il bordo inferiore e la riga di suggerimento «Sezioni in preparazione · clicca o attendi 2 s per l'anteprima» della card *Fononi*).
   - **Perché conta**: viola il criterio di `critico-grafico` («da 1100×800 in su nessuno scorrimento della pagina»); inoltre, aprendo l'anteprima della card *Fononi* a 1100×800 senza prima scorrere, le ultime 2–3 voci dell'elenco delle 6 sezioni risultano tagliate fuori dal viewport.
   - **Direzione di correzione**: ridurre leggermente l'altezza fissa di `.chapter-card` (`356px` → ~`330px`, eventualmente tramite media query `@media (max-height: 860px)`) e/o i margini verticali di `.home-screen` / `.home-header` così che le 2 righe stiano integralmente dentro `800 px`.

---

### Minori (difetti oggettivi)

3. **Targhetta `.preview-method-tag` a contatto/sovrapposizione con le curve nell'anteprima di «Fononi»**
   - **Elemento / Risoluzione / Stato**: badge `1/6 Catena monatomica` dentro `.card-canvas-wrap` della card *Fononi* — **1440×900** — stato di anteprima aperta (`step_19_shot_1.png`).
   - **File**: `src/renderer/src/home/home.css:222-236`, `src/renderer/src/home/BandPreviewCanvas.tsx:55`, `src/renderer/src/home/curves.ts:356, 509`.
   - **Cosa è sbagliato**: il bordo inferiore del badge `1/6 Catena monatomica` (`top: 6px; right: 6px`) scende fino a ~`28 px` dal bordo superiore del canvas, mentre la curva monatomica al bordo `+π/a` sale fino a ~`30 px` (aria residua ~2 px, visivamente a contatto). In `6/6 Calore specifico e Debye`, dove la retta Dulong–Petit è orizzontale a `y = 1` con `eMax = 1,14`, la curva attraversa geometricamente la zona occupata dal badge.
   - **Direzione di correzione**: aumentare `padTop` in `BandPreviewCanvas.tsx` (es. da `14` a `26–28 px` quando è presente il badge, oppure aumentare leggermente il margine superiore di `eMax`) per mantenere le curve nettamente staccate dal badge.

4. **Etichette `markers` e `selection.aliasLabel` in `DispersionPlot.tsx` prive di controllo bordi/collisioni**
   - **Elemento / Risoluzione / Stato**: overlay `markers` e `selection.aliasLabel` di `DispersionPlot` — tutte le risoluzioni — verifica statica.
   - **File**: `src/renderer/src/viz/DispersionPlot.tsx:710-727, 801-808`.
   - **Cosa è sbagliato**: a differenza di `probe` (`placeProbeLabel`) e `tag` (`placeFreeLabel`), le etichette di `markers` (`ly = my - 6`) e `aliasLabel` (`sy - 10`) sono posizionate a offset fisso senza verificare il bordo superiore `T` del rettangolo di ritaglio (`ctx.clip()`), né i margini laterali per `aliasLabel`, né eventuali collisioni con etichette già presenti in `occupied`. Per punti notevoli vicini al tetto del grafico (es. `ω_+(0)` al centro zona) il testo rischia il taglio superiore.
   - **Direzione di correzione**: aggiungere almeno il ribaltamento verticale (`my + 14` quando `my - 16 < T`) e il clamp orizzontale, o riusare `placeProbeLabel`.

5. **Voce attiva nella barra laterale sempre colorata con `--q-E` anziché col colore del capitolo**
   - **Elemento / Risoluzione / Stato**: `.nav-item[aria-current='page']` in `.nav` — tutte le risoluzioni — verifica statica + `step_8_shot_1.png`.
   - **File**: `src/renderer/src/ui/ui.css:172`, `src/renderer/src/ui/shell.tsx:109-139`.
   - **Cosa è sbagliato**: il filetto sinistro della sezione attiva usa hardcoded `border-left-color: var(--q-E)` (`#83c167`). In Fase 0 sono cliccabili solo le sezioni di *Teoria delle bande*, quindi oggi è coerente; appena si monterà la Sezione 1 di *Fononi*, una sezione fononica risulterà marcata con il colore dell'energia elettronica `E` anziché con `--q-omega`.
   - **Direzione di correzione**: esporre un attributo `data-q` opzionale sul capitolo in `NavChapter` (es. `'E'` / `'omega'`) e usare `border-left-color: var(--q, var(--q-E))`.

6. **Numero passo `.method-num` senza cifre tabulari e margine stretto su `.playback-play-label`**
   - **Elemento / Risoluzione / Stato**: `.preview-method-tag .method-num` (`1/6`) su `HomeScreen` in anteprima e `.playback-play-label` (`Avvia`/`Pausa`) in `PlaybackControls` — tutte le risoluzioni — verifica statica.
   - **File**: `src/renderer/src/home/ActiveChapterCard.tsx:263`, `src/renderer/src/home/home.css:238`, `src/renderer/src/viz/viz.css:207-210`.
   - **Cosa è sbagliato**: `.method-num` non ha la classe `.num` (`tabular-nums`), quindi al cambio `1/6 → 2/6 → 4/6` il titolo del metodo può spostarsi di 1–2 px. In `PlaybackControls`, `.playback-play-label { min-width: 36px }` copre «Avvia» (~30 px) e «Pausa» (~34 px) a `12px` in Inter/Segoe UI, ma lascia solo ~2 px di margine con font di sistema leggermente più larghi (es. Arial/Roboto su Linux/macOS): portare a `40px` garantisce stabilità su tutte le piattaforme.

7. **Lieve disallineamento verticale della miniatura nella 3ª card a 1100×800**
   - **Elemento / Risoluzione / Stato**: card *Reticolo reciproco e diffrazione* nella prima riga della `HomeScreen` — **1100×800** — stato a riposo (`step_10_shot_1.png`).
   - **File**: `src/renderer/src/home/home.css:125-131`.
   - **Cosa è sbagliato**: a 1100 px il titolo *Reticolo reciproco e diffrazione* va su due righe (~42 px), superando `.card-head { min-height: 36px }`; di conseguenza il riquadro canvas della terza card parte ~5–6 px più in basso rispetto alle due card adiacenti nella stessa riga. Impostare `min-height: 42px` su `.card-head` (o `margin-bottom` compensato) mantiene l'allineamento orizzontale di tutte le miniature.

8. **Variabile CSS scritta erroneamente `--lineStrong` su `.nav-brand-btn:hover` (residuo noto preesistente)**
   - **Elemento / Risoluzione / Stato**: pulsante «Stato Solido» in alto a sinistra nella sidebar — tutte le risoluzioni — stato hover (verifica statica).
   - **File**: `src/renderer/src/ui/ui.css:105`.
   - **Cosa è sbagliato**: `border-color: var(--lineStrong)` fa riferimento a una variabile inesistente (quella iniettata da `theme.ts` è `--line-strong`), quindi il bordo hover resta trasparente. Non è una regressione di Fase 0 (già annotato in `progetto.md`), ma resta facile da sanare in questa fase infrastrutturale.

---

### Preferenze / Osservazioni non vincolanti (distinte dai difetti oggettivi)

- **Vicinanza cromatica tra badge `--q-E` (`#83c167`) e `--q-omega` (`#72d67c`)**: nella `HomeScreen` (`step_2_shot_1.png`) i due badge `6 sezioni` sono entrambi verdi di luminosità simile (verde oliva vs verde menta). È coerente con `theme.ts` (dove sia `E(k)` sia `ω(k)` sono la grandezza principale in ordinata del rispettivo capitolo), ma a colpo d'occhio la distinzione cromatica tra i due capitoli è molto sottile; l'abbinamento nella miniatura Na–Cl con il ramo ottico arancione `--q-omegaOpt` (`#f59e56`) rende comunque la card *Fononi* subito riconoscibile.
- **Contrasto del token `--dim` (`#5f6670`) su `--bg`/`--panel`**: il rapporto di contrasto (~3,1–3,3:1) rende molto tenui sia le 6 voci disabilitate di *Fononi* nella sidebar sia il suggerimento d'interazione in fondo alle card attive a riposo (`11px`). La gerarchia rispetto agli elementi attivi funziona, ma un tono leggermente più chiaro su voci informative migliorerebbe la leggibilità su monitor poco luminosi.
- **Barre di scorrimento native chiare su Windows**: quando `.home-screen` (a 800×700) o `.nav` (nel drawer a 800×700) scorrono, la scrollbar nativa di Chromium su Windows appare molto chiara sul fondo `#0f1114`; applicare `scrollbar-width: thin; scrollbar-color: var(--line-strong) transparent;` la integrerebbe coerentemente nello stile lavagna.

---

## 3. Le due cose riuscite meglio

1. **Miniatura Na–Cl e stato transitorio della card «Fononi» sulla `HomeScreen`**: a riposo la coppia ramo acustico (`--q-omega`) + ramo ottico (`--q-omegaOpt`) con gap ben aperto ed etichette `−π/a, 0, π/a` comunica immediatamente il tema del capitolo in puro stile lavagna, senza decorazioni superflue; cliccando sulla card nello stato transitorio senza sezioni montate l'anteprima si apre all'istante senza errori di navigazione e mostra con grande chiarezza tutte e 6 le sezioni pianificate a 1440×900.
2. **Pulizia architetturale e rispetto dello stile lavagna in `DispersionPlot.tsx` e `PlaybackControls.tsx`**: zero colori hardcoded fuori da `theme.ts`, legenda esterna `ChartLegend` separata dall'area di disegno, cifre tabulari `.num` sui controlli di velocità, gestione completa di `prefers-reduced-motion` (istantanea ferma, controlli disabilitati, azzeramento transizioni) e assenza di cicli `requestAnimationFrame` superflui a riposo o in pausa.

---

## 4. Verdetto

**da correggere**

*(Nessun problema bloccante e zero errori in console, ma vanno risolti i due difetti importanti di overflow verticale a **1100×800** su `.nav` e `.home-screen`, in particolare la regressione della sidebar `.nav` introdotta dai 6 nuovi titoli multi-riga del capitolo Fononi.)*
