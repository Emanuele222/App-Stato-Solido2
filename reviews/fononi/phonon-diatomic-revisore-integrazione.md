# Revisione di Integrazione Multi-Capitolo — Sezione 2 (Catena biatomica, gap fononico e luce infrarossa)

- **Ruolo**: Revisore di Integrazione Multi-Capitolo (`.agents/skills/revisore-integrazione/SKILL.md`)
- **Ambito**: Sezione 2 del capitolo *Fononi* — `src/renderer/src/sections/phonon-diatomic/` (8 nuovi file) e file condivisi `src/renderer/src/physics/phononDispersion.ts`, `src/renderer/src/physics/phononDispersion.test.ts`, `src/renderer/src/sections/registry.ts`, `src/renderer/src/home/curves.ts`
- **Verdetto**: **approvata** (0 problemi bloccanti, 0 problemi importanti, 1 nota minore; zero regressioni su *Teoria delle bande* e sulla Sezione 1 *Catena monatomica*)

---

## 1. Cosa è stato verificato, comandi eseguiti ed esiti esatti

Tutti i comandi Node/npm sono stati eseguiti in PowerShell anteponendo `.tools\node` al `PATH` (`$env:PATH = "$PWD\.tools\node;$env:PATH"`):

| Verifica | Comando eseguito | Exit code | Esito esatto |
|---|---|---:|---|
| Typecheck | `npm.cmd run typecheck` (`tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json`) | `0` | Nessun errore di tipo su main, preload e renderer. |
| Test unitari | `npm.cmd test` (`vitest run`) | `0` | **19 file di test passati (19/19), 165 test passati (165/165)** in `3.64s`: tutti i **138 test preesistenti di *Teoria delle bande*** (133 in 14 file `physics/` + 5 in `home/curves.test.ts`) + **10 test di Fase 0** (`constants` 2, `home/curves` Fononi 4, `ui/theme` 2, `viz/dispersionPlot` 2) + **17 test in `phononDispersion.test.ts`** (9 monatomica/BvK + 8 nuovi biatomica/matrice 2×2/luce IR). |
| Build di produzione | `npm.cmd run build` (`npm run typecheck && electron-vite build`) | `0` | Main (`out/main/index.js`, `1.21 kB`), preload (`out/preload/index.js`, `0.14 kB`) e renderer (`out/renderer/index.html` `0.60 kB`, `epmWorker-D5ov2p22.js` `24.17 kB`, `index-g0a8t1PQ.css` `80.85 kB`, `index-o0mpExhS.js` `1,864.55 kB`, 132 moduli) compilati senza errori né warning. |
| Integrità repository e diff esatto | `git status --short; git diff --stat` (non disponibile: `git` assente) → verifica deterministica read-only via Node sugli SHA-1 blob (normalizzati LF) di tutte le **267 voci tracciate** in `.git/index`, estrazione blob da `.git/objects` e scansione di `src/`, `incarichi/`, `.claude/`, `materiale/` | `0` | **5 file tracciati modificati**: `src/renderer/src/physics/phononDispersion.ts`, `src/renderer/src/physics/phononDispersion.test.ts`, `src/renderer/src/sections/registry.ts`, `src/renderer/src/home/curves.ts` e `piano-fononi.md` (documento di piano del capitolo Fononi). **0 file cancellati**. **8 nuovi file** in `src/` (tutti dentro `src/renderer/src/sections/phonon-diatomic/`). **0 file aggiunti o modificati** in `incarichi/`, `.claude/`, `materiale/` o nei file proibiti. |
| Isolamento layer, colori, API Electron, `QuantityId`, CSS, TeX | Script Node read-only (`audit.mjs`, `audit2.mjs`) su `src/renderer/src/physics/`, `sections/`, `viz/`, `home/` e `sections/phonon-diatomic/` | `0` | **0 violazioni** di import o globali DOM in `physics/`; **0 colori hex/rgb/rgba/hsl hardcoded** fuori da `ui/theme.ts` (unica occorrenza `rgba(...)` resta l'helper `withAlpha` in `viz/canvas.ts:737`); **0 riferimenti ad API Electron** nel renderer; **0 import di librerie pesanti** (`three`, `d3`, ecc.); **0 import cross-sezione** in `phonon-diatomic/`; **0 `QuantityId` / `DerivedToneId` / CSS `var(--...)` sconosciuti**; **0 apostrofi tipografici (`’`)** dentro segmenti matematici TeX (`formulas.ts`, `$...$`, `<Tex>`). |
| Retrocompatibilità `phononDispersion.ts` | Confronto blob `.git/objects` vs file corrente su tutte le esportazioni e sull'intero corpo monatomico/BvK | `0` | **26/26 esportazioni preesistenti** conservate con firme identiche; l'intero corpo monatomico e Born–von Kármán (da `export interface MonatomicParams` fino a `bvkSnapToAllowedK`, righe 23–345) è **byte-per-byte identico** alla versione pre-Sezione 2. Aggiunte 18 nuove esportazioni (8 tipi/interfacce + 10 funzioni `diatomic*`), re-esportate automaticamente da `physics/index.ts` (invariato: `export * from './phononDispersion'`). |
| Separazione percettiva colori (CIE Lab ΔE) | Script Node read-only sulle 12 tinte usate nella Sezione 2 (`a`, `k`, `omega`, `omegaOpt`, `C`, `M`, `m`, `u`, `v`, `vp`, `Ek`, `lightLine`) | `0` | Coppie più vicine: `omegaOpt`/`C` **ΔE = 23,6** (su canvas distinti), `M`/`vp` **ΔE = 25,6** (canvas distinti), `k`/`lightLine` **ΔE = 25,9** (crosshair vs retta IR tratteggiata), `k`/`u` **ΔE = 27,5**. Tutte le coppie compresenti sullo stesso grafico risultano percettivamente ben distinguibili. |

### Cosa non è stato possibile verificare
- **`git` CLI nativo**: l'eseguibile `git` non è installato nel sistema; lo stato completo dei file modificati, intatti e nuovi è stato comunque verificato in modo deterministico leggendo `.git/index` e `.git/objects` via Node.
- **Rendering visivo e interazione live nel browser** (`npm run dev:web` a 1440/1100/800 px): fuori dall'ambito statico di questa revisione (demandato a `critico-grafico` e `studente`).

---

## 2. Controlli di conformità architetturale e sicurezza

1. **Zero regressioni su *Teoria delle bande* e Sezione 1 (*Catena monatomica*)**:
   - Tutte le 6 sezioni di *Teoria delle bande* (`empty-lattice`, `kronig-penney`, `nearly-free`, `tight-binding`, `k-dot-p`, `pseudopotential`) e la Sezione 1 di *Fononi* (`phonon-monatomic`) risultano completamente intatte (SHA-1 identico a `.git/index`).
   - `SECTIONS`, `CHAPTERS`, `ALL_CHAPTERS`, `UPCOMING_CHAPTERS` e `DEFAULT_SECTION_ID` in `src/renderer/src/sections/registry.ts` conservano inalterati ordine, id, titoli e componenti di tutte le 6 sezioni di Bande e di `phonon-monatomic`.
   - `HomeScreen` mantiene invariata la griglia a 5 riquadri (*Teoria delle bande*, *Cristallografia*, *Reticolo reciproco e diffrazione*, *Fononi*, *Semiconduttori*), la navigazione da tastiera (`tabIndex={0}`, Invio/Spazio apre `phonon-monatomic` come prima sezione disponibile) e l'anteprima ciclica delle 6 curve fononiche.
   - `AppShell` (via `CHAPTERS` in `registry.ts`) espone ora 6/6 sezioni attive in *Teoria delle bande* e **2/6 sezioni attive** in *Fononi* (`phonon-monatomic`, `phonon-diatomic`) con le restanti 4 disabilitate (`aria-disabled="true"`).

2. **Isolamento dei layer (`CLAUDE.md`)**:
   - `src/renderer/src/physics/phononDispersion.ts` importa esclusivamente costanti e helper da `./constants` (`ANGSTROM_IN_M`, `C_LIGHT_M_S`, `RAD_S_TO_THZ`, `amuToKg`, `radSToMev`, `radSToThz`). Nessun file in `physics/` importa React, DOM, `ui/`, `viz/`, `sections/` o `home/`.
   - Nessuna dipendenza obbligatoria dalle API Electron nel renderer (`npm run dev:web` pienamente preservato).
   - Nessuna dipendenza nuova in `package.json` (rimangono `katex`, `react`, `react-dom`, `zustand`; SHA-1 intatto).
   - La sezione `sections/phonon-diatomic/` riusa senza modifiche i componenti condivisi (`SectionLayout`, `SceneView`, `Panel`, `ParamSlider`, `PresetMenu`, `ToolToggle`, `LiveFormula`, `DispersionPlot`, `PlaybackControls`, `ChartLegend`, `RichText`, `Tex`, `useTweened`, `formatNumber`), senza toccare `ui/` né `viz/`.
   - Gli stili locali in `phonon-diatomic.css` usano esclusivamente token CSS di `ui/theme.ts` (`--line`, `--line-strong`, `--bg`, `--muted`, `--text`, `--raised`), rispettano `@media (prefers-reduced-motion: reduce)` e sono tutti namespaced sotto prefisso `.phonon-diat-*` (nessuna interferenza sui CSS di Bande o di Sezione 1).
   - In `DiatomicChainView.tsx`, il reset di fase passa correttamente attraverso il callback `handleReset` (`useCallback`) senza mutazioni di `ref` in fase di render (miglioramento rispetto alla nota minore della Sezione 1), e il calcolo degli spostamenti atomici delega interamente a `diatomicDisplacements` di `physics/`.

3. **Sicurezza, prestazioni e file proibiti**:
   - **CSP (`src/renderer/index.html:6-9`)**: intatta (SHA-1 identico a `.git/index`): `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:`.
   - **Bundle e prestazioni**: incremento del bundle renderer di `+83.76 kB` JS (`1,780.79 kB` → `1,864.55 kB`) e `+2.71 kB` CSS (`78.14 kB` → `80.85 kB`), +8 moduli (`124` → `132`), del tutto proporzionale all'aggiunta della Sezione 2 e privo di librerie pesanti.
   - **File proibiti**: verifica SHA-1 confermata intatta su `progetto.md`, `CLAUDE.md`, `AGENTS.md`, `.claude/`, `incarichi/`, `materiale/`, `mockup-quasi-libero.html`, `package.json`, `package-lock.json`, `src/renderer/index.html`, `src/main/`, `src/preload/`, `ui/theme.ts`, `ui/ui.css`, `ui/shell.tsx`, `viz/*` e tutte le 6 sezioni di *Teoria delle bande*.

---

## 3. File condivisi toccati e valutazione del rischio conflitto col collega

| File | Modifica effettuata | Retrocompatibilità | Rischio conflitto col collega |
|---|---|---|---|
| `src/renderer/src/physics/phononDispersion.ts` | Aggiornamento intestazione + import `C_LIGHT_M_S` da `./constants`; aggiunta append-only (righe 347–918) del blocco biatomico (`diatomic*` + 8 tipi/interfacce). Corpo monatomico/BvK (righe 23–345) byte-per-byte invariato. | **Totale** (26/26 export preesistenti intatti; `physics/index.ts` già espone `export * from './phononDispersion'`). | **Nullo** — file esclusivo del capitolo Fononi. |
| `src/renderer/src/physics/phononDispersion.test.ts` | Aggiunta append-only di 8 test unitari per la catena biatomica, gap, limite `M = m`, caso invertito `m > M`, matrice dinamica 2×2, velocità di gruppo e incrocio luce IR (righe 241–495) + relativi import. I 9 test monatomici/BvK restano invariati. | **Totale** (17/17 verdi). | **Nullo** — file esclusivo del capitolo Fononi. |
| `src/renderer/src/sections/registry.ts` | Import di `PhononDiatomicSection` (riga 16) e sostituzione `component: null` → `component: PhononDiatomicSection` sulla sola voce `phonon-diatomic` (riga 33). | **Totale** (le 6 sezioni di Bande, `phonon-monatomic` e tutti i simboli esportati sono inalterati). | **Basso–Medio** — file condiviso di registrazione, ma intervento chirurgico di 2 righe sulla sola voce fononica. |
| `src/renderer/src/home/curves.ts` | Rimozione degli import non più necessari `AMU_KG` e `RAD_S_TO_THZ`, aggiunta import `diatomicDispersionCurve` da `../physics` (riga 17) e sostituzione pulita del calcolo inline `diatomicBranchesThz` con `diatomicPreviewFromPhysics` delegata a `diatomicDispersionCurve` (righe 239–260), usata in `phonons-resting`, `phonon-diatomic` e `phonon-wavepacket` (righe 303, 359, 434). | **Totale** (0 righe modificate nelle curve di Bande; `home/curves.test.ts` 9/9 verde). Chiude completamente il debito tecnico transitorio di Fase 0 per le curve biatomiche. | **Basso** — modifica confinata agli import in testa e al solo blocco Fononi in coda al file. |
| `src/renderer/src/sections/phonon-diatomic/*` (8 file) | Creazione ex novo della Sezione 2. | N/A | **Nullo** — cartella dedicata, zero conflitti possibili. |

*(Nota di trasparenza: tra i file tracciati risulta aggiornato anche `piano-fononi.md`, documento di avanzamento interno al capitolo Fononi, esterno ai file proibiti e a `src/`.)*

---

## 4. Problemi trovati (ordinati per gravità)

### Bloccante
Nessuno.

### Importante
Nessuno.

### Minore

1. **Esportazione inutilizzata `BRANCH_PAIR_TEX` (e costante `wPm`) in `formulas.ts`**
   - **File e riga**: `src/renderer/src/sections/phonon-diatomic/formulas.ts:13` e `66`.
   - **Dettaglio**: `const wPm = ...` (riga 13) e `export const BRANCH_PAIR_TEX = wPm` (riga 66) non sono importati né usati in alcun file del progetto (`grep` sull'intero `src/renderer/src/` restituisce la sola definizione). Non causa errori di compilazione né impatti a runtime (eliminata dal tree-shaking in build), ma rimuoverla manterrebbe `formulas.ts` completamente privo di codice morto.

---

## 5. Dubbi e domande per la regia

Nessun dubbio aperto: l'integrazione della Sezione 2 è pulita, rispetta l'architettura multi-capitolo e chiude ordinatamente la sostituzione della curva biatomica inline in `home/curves.ts`.

---

## 6. Verdetto finale

**Approvata.** Tutti i controlli di regressione su *Teoria delle bande* e sulla Sezione 1, l'integrità dei file proibiti, la retrocompatibilità di `phononDispersion.ts`, la registrazione pulita in `sections/registry.ts`, la sostituzione del calcolo inline in `home/curves.ts`, l'isolamento dei layer, la politica colori senza hex hardcoded, la CSP, il typecheck, tutti i **165/165 test unitari** e la build di produzione (`electron-vite build`) sono superati senza problemi bloccanti né importanti (1 sola nota minore su una costante esportata non usata).
