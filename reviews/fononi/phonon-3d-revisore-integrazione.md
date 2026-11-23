# Revisione di Integrazione Multi-Capitolo — Sezione 3 (Rami 3D, polarizzazioni e cristalli reali)

- **Ruolo**: Revisore di Integrazione Multi-Capitolo (`.agents/skills/revisore-integrazione/SKILL.md`)
- **Ambito**: Sezione 3 del capitolo *Fononi* (`phonon-3d`) — `src/renderer/src/physics/phonon3d.ts`, `src/renderer/src/physics/phonon3d.test.ts`, `src/renderer/src/sections/phonon-3d/` (9 nuovi file) e file condivisi `src/renderer/src/physics/index.ts`, `src/renderer/src/sections/registry.ts`, `src/renderer/src/home/curves.ts`
- **Verdetto**: **approvata** (0 problemi bloccanti, 0 problemi importanti, 3 rilievi minori; zero regressioni su *Teoria delle bande* e sulle Sezioni 1–2 di *Fononi*)

---

## 1. Cosa è stato verificato, comandi eseguiti ed esiti esatti

Tutti i comandi Node/npm sono stati eseguiti in PowerShell anteponendo `.tools\node` al `PATH` (`$env:PATH = "$PWD\.tools\node;$env:PATH"`):

| Verifica | Comando eseguito | Exit code | Esito esatto |
|---|---|---:|---|
| Typecheck | `npm.cmd run typecheck` (`tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json`) | `0` | Nessun errore di tipo su main, preload e renderer. |
| Test unitari | `npm.cmd test` (`vitest run`) | `0` | **20 file di test passati (20/20), 177 test passati (177/177)** in `3.80s`: tutti i **138 test preesistenti di *Teoria delle bande*** (133 in 14 file `physics/` + 5 in `home/curves.test.ts`), **10 test di Fase 0** (`constants` 2, `home/curves` Fononi 4, `ui/theme` 2, `viz/dispersionPlot` 2), **18 test di Sezioni 1–2** (`phononDispersion.test.ts`) e **11 nuovi test di Sezione 3** (`phonon3d.test.ts`). |
| Build di produzione | `npm.cmd run build` (`npm run typecheck && electron-vite build`) | `0` | Main (`out/main/index.js`, `1.21 kB`), preload (`out/preload/index.js`, `0.14 kB`) e renderer (`out/renderer/index.html` `0.60 kB`, `epmWorker-DA_q0geL.js` `25.10 kB`, `index-xEFO1Atl.css` `83.32 kB`, `index-CVbBcrCp.js` `1,970.88 kB`, 142 moduli) compilati senza errori né warning. |
| Integrità repository e diff esatto | `git status --short` (non disponibile: `git` assente) → script Node read-only su `.git/index` (versione 2, **267 voci tracciate**) e blob `.git/objects`, più verifica timestamp su `src/`, `.claude/`, `incarichi/`, `materiale/` | `0` | **0 file cancellati**. **6 file tracciati modificati** rispetto a `.git/index` (snapshot pre-Sezione 2): i 3 file condivisi di Sezione 3 (`src/renderer/src/physics/index.ts`, `src/renderer/src/sections/registry.ts`, `src/renderer/src/home/curves.ts`), i 2 file di Sezione 2 (`phononDispersion.ts`, `phononDispersion.test.ts`, intatti durante Sezione 3) e `piano-fononi.md`. **11 nuovi file per Sezione 3** (`physics/phonon3d.ts`, `physics/phonon3d.test.ts`, 9 file in `sections/phonon-3d/`). **0 file aggiunti o modificati** nei file proibiti e nelle 6 sezioni di *Teoria delle bande*. |
| Isolamento layer `physics/` | Scansione PowerShell + script Node read-only di tutti gli import e simboli DOM in `src/renderer/src/physics/*.ts` | `0` | **0 violazioni**: `phonon3d.ts` importa esclusivamente `./bandStructure`, `./constants` e `./linalg`; nessun modulo in `physics/` importa React, DOM, `ui/`, `viz/`, `sections/` o `home/`. |
| Politica colori (`ui/theme.ts`), CSS, API Electron, `QuantityId` | Scansione PowerShell + script Node read-only su `src/renderer/src/sections/`, `viz/`, `home/` e `sections/phonon-3d/` | `0` | **0 colori hex/rgb/rgba/hsl hardcoded** in `sections/`, `viz/` e `home/` (unica occorrenza `rgba(...)` resta l'helper `withAlpha` in `viz/canvas.ts:737`; unica occorrenza CSS `rgb(0 0 0 / 0.45)` in `ui/ui.css:708`, preesistente). **0 riferimenti ad API Electron o Node** nel renderer. **0 import di librerie 3D esterne** (`three`, ecc.). **0 import cross-sezione**, **0 `QuantityId`/`DerivedToneId`/`var(--...)` sconosciuti**, **0 apostrofi tipografici (`’`) in TeX**. Rilevato 1 escape singolo `\;` in `formulas.ts:35` (Minore 1). |
| Coerenza `home/curves.ts` ↔ `physics/phonon3d.ts` | Ispezione diretta di `ROLES_P2` (`phonon3d.ts:965`) e `bandColors` (`home/curves.ts:399-406`) | `0` | Corrispondenza esatta 1-a-1 dell'ordine dei 6 rami `['TA1', 'TA2', 'LA', 'TO1', 'TO2', 'LO']` con `[acousticTransverse, acousticTransverse, omega, opticalTransverse, opticalTransverse, omegaOpt]`. |

### Cosa non è stato possibile verificare
- **`git` CLI nativo**: l'eseguibile `git` non è installato nel sistema (né in `PATH`, né nei percorsi standard, né in `.tools/`); lo stato integrale dei 267 file tracciati e dei file aggiunti/modificati è stato verificato in modo deterministico via Node leggendo `.git/index` e `.git/objects`.
- **Rendering visivo e interazione live nel browser** (`npm run dev:web` a 1440 / 1100 / 800 px): fuori dall'ambito statico di questa revisione (di competenza di `critico-grafico` e `studente`).

---

## 2. Controlli di conformità architetturale e sicurezza

1. **Zero regressioni su *Teoria delle bande* e sulle Sezioni 1–2 di *Fononi***:
   - Tutte le 6 sezioni di *Teoria delle bande* (`empty-lattice`, `kronig-penney`, `nearly-free`, `tight-binding`, `k-dot-p`, `pseudopotential`) risultano intatte (SHA-1 identico a `.git/index`, `LastWriteTime` `22/11/2026 19:45:25`).
   - Le Sezioni 1 e 2 di *Fononi* (`phonon-monatomic`, `phonon-diatomic`, `phononDispersion.ts`) risultano intatte rispetto al loro stato pre-Sezione 3 (`18/18` test in `phononDispersion.test.ts` verdi).
   - `SECTIONS`, `CHAPTERS`, `ALL_CHAPTERS`, `UPCOMING_CHAPTERS` e `DEFAULT_SECTION_ID` in `src/renderer/src/sections/registry.ts` conservano inalterati ordine, id, titoli e componenti di tutte le 6 sezioni di Bande e delle Sezioni 1–2 di Fononi; `AppShell` abilita ora **3/6 sezioni attive** in *Fononi* (`phonon-monatomic`, `phonon-diatomic`, `phonon-3d`) e lascia disabilitate (`aria-disabled="true"`) le 3 restanti.
   - `HomeScreen` mantiene invariata la griglia regolare a 5 card (*Teoria delle bande*, *Cristallografia*, *Reticolo reciproco e diffrazione*, *Fononi*, *Semiconduttori*), l'accessibilità da tastiera (`tabIndex={0}`, `Enter`/`Space`) e l'anteprima ciclica (ora con dispersione 3D reale a 6 rami del PbTe per lo slot `phonon-3d`).

2. **Isolamento dei layer (`CLAUDE.md`)**:
   - `src/renderer/src/physics/phonon3d.ts` è TypeScript puro e importa solo `./bandStructure`, `./constants` e `./linalg`.
   - Zero dipendenze obbligatorie dalle API Electron nel renderer (`npm run dev:web` pienamente preservato).
   - Nessuna dipendenza nuova in `package.json` (rimangono `katex`, `react`, `react-dom`, `zustand`; SHA-1 intatto rispetto a `.git/index`).
   - La sezione `sections/phonon-3d/` riusa senza modificarli i componenti condivisi di `ui/` e `viz/` (`SectionLayout`, `SceneView`, `Panel`, `ParamSlider`, `PresetMenu`, `Stepper`, `ToolToggle`, `LiveFormula`, `DispersionPlot`, `PlaybackControls`, `ChartLegend`, `RichText`, `Tex`, `useTweened`, `formatNumber`).
   - Gli stili locali in `src/renderer/src/sections/phonon-3d/phonon-3d.css` usano solo variabili CSS di `ui/theme.ts`, rispettano `@media (prefers-reduced-motion: reduce)` e sono interamente confinati al prefisso `.phonon-3d-*` (zero interferenze con i CSS di Bande o delle altre sezioni).

3. **Sicurezza, prestazioni e file proibiti**:
   - **CSP (`src/renderer/index.html:6-9`)**: intatta (SHA-1 identico a `.git/index`): `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:`.
   - **Bundle e prestazioni**: la proiezione 3D isometrica è realizzata in Canvas 2D nativo senza Three.js o librerie pesanti (nessun import `lazy` necessario). Incremento rispetto al termine della Sezione 2: `+106.33 kB` JS (`1,864.55 kB` → `1,970.88 kB`), `+2.47 kB` CSS (`80.85 kB` → `83.32 kB`), `+10` moduli (`132` → `142`). Tutti i 9 test di `home/curves.test.ts` (inclusa la curva 3D PbTe a 25 punti/segmento) completano in `348 ms`.
   - **File proibiti**: SHA-1 confermato identico a `.git/index` su `progetto.md`, `CLAUDE.md`, `AGENTS.md`, `.claude/`, `incarichi/`, `materiale/`, `mockup-quasi-libero.html`, `package.json`, `package-lock.json`, `src/renderer/index.html`, `src/main/`, `src/preload/`, `ui/*`, `viz/*`, `strings.ts`, `App.tsx`, `home/HomeScreen.tsx` e tutte le 6 sezioni di *Teoria delle bande*.

---

## 3. File condivisi toccati e valutazione del rischio conflitto col collega

| File | Modifica effettuata per Sezione 3 | Retrocompatibilità | Rischio conflitto col collega |
|---|---|---|---|
| `src/renderer/src/physics/index.ts` | Aggiunta di 1 sola riga in coda: `export * from './phonon3d'` (riga 17). | **Totale** (tutte le 15 re-export preesistenti invariate). | **Basso** — append-only in coda al barrel file. |
| `src/renderer/src/sections/registry.ts` | Import di `Phonon3DSection` (riga 17) e sostituzione `component: null` → `component: Phonon3DSection` sulla sola voce `phonon-3d` (riga 35). | **Totale** (le 6 sezioni di Bande, `phonon-monatomic`, `phonon-diatomic` e tutti gli array esportati sono inalterati). | **Basso–Medio** — file condiviso di registrazione, intervento chirurgico di 2 righe sulla sola voce fononica. |
| `src/renderer/src/home/curves.ts` | Import di `computePhonon3DDispersion` e `defaultParamsForCrystal` da `../physics` (righe 17–18) e sostituzione della serie qualitativa inline `s3` (`phonon-3d`) con il calcolo fisico reale PbTe a 6 rami da `physics/phonon3d.ts` (righe 380–408). | **Totale** (0 righe toccate nelle curve di *Teoria delle bande*; `home/curves.test.ts` 9/9 verde). Elimina il debito tecnico transitorio di Fase 0 per la curva anteprima 3D. | **Basso** — modifica confinata agli import in testa e al solo blocco `s3` nella sezione Fononi in coda al file. |
| `src/renderer/src/physics/phonon3d.ts` + `.test.ts` | Creazione ex novo del motore fisico 3D e dei suoi 11 test. | N/A | **Nullo** — file dedicati alla Sezione 3. |
| `src/renderer/src/sections/phonon-3d/*` (9 file) | Creazione ex novo della Sezione 3. | N/A | **Nullo** — cartella dedicata, zero conflitti possibili. |

*(Nota di trasparenza: tra i file tracciati modificati rispetto a `.git/index` compaiono anche `phononDispersion.ts`/`.test.ts` della Sezione 2 e `piano-fononi.md`, nessuno dei quali appartiene ai file proibiti o al capitolo Bande.)*

---

## 4. Problemi trovati (ordinati per gravità)

### Bloccante
Nessuno.

### Importante
Nessuno.

### Minore

1. **Escape singolo `\;` invece di `\\;` in `branchCountFormulas` per `p = 1`**
   - **File e riga**: `src/renderer/src/sections/phonon-3d/formulas.ts:35`
   - **Cosa è sbagliato e perché**: nella riga `` `p = 1:\\; 3p = 3\\;\\text{rami}\;(${q('omega', '1\\,\\text{LA} + 2\\,\\text{TA}')},\\; 0\\;\\text{ott.})` `` l'escape `\text{rami}\;(` ha un solo backslash, quindi JavaScript lo interpreta come punto e virgola letterale `;` invece dello spazio medio TeX `\;`. In KaTeX viene quindi renderizzato un `;` spurio (`3 rami;(1 LA + 2 TA, 0 ott.)`).
   - **Come riprodurlo**: selezionare il preset **Alluminio (fcc, p = 1)** nella Sezione 3 e osservare la formula di conteggio rami nel pannello «Formula viva», oppure leggere la stringa restituita da `branchCountFormulas(1)[0]`.
   - **Correzione suggerita**: sostituire `\;(` con `\\;(`.

2. **Mutazione di `ref` durante la fase di render in `Polarization3DView.tsx`**
   - **File e riga**: `src/renderer/src/sections/phonon-3d/Polarization3DView.tsx:122-125`
   - **Cosa è sbagliato e perché**: il reset dell'angolo di fase viene gestito confrontando e mutando `lastResetRef.current` e `phaseAngleRef.current` direttamente nel corpo del render (`if (playback.resetTick !== lastResetRef.current) { ... }`). In React 19 (StrictMode / rendering concorrente) leggere e scrivere `.current` in fase di render è sconsigliato e può generare warning dei linter React; in Sezione 2 (`DiatomicChainView.tsx`) questo pattern era già stato ripulito passando un callback `handleReset` (`useCallback`) a `PlaybackControls.onReset`.
   - **Come riprodurlo**: ispezione diretta delle righe 120–125 e 598 di `Polarization3DView.tsx`.

3. **Tre chiavi di stringa non utilizzate in `strings.ts`**
   - **File e riga**: `src/renderer/src/sections/phonon-3d/strings.ts:67` (`legendPolVec`), `:111` (`phaseInPhase`), `:112` (`phaseAntiPhase`).
   - **Cosa è sbagliato e perché**: sono definite in `strings.ts` ma non referenziate in alcun componente o test della sezione. Nessun impatto a runtime, ma la rimozione mantiene il file stringhe privo di chiavi morte (come segnalato in modo analogo per `BRANCH_PAIR_TEX` in Sezione 2).
   - **Come riprodurlo**: ricerca dei simboli `legendPolVec`, `phaseInPhase`, `phaseAntiPhase` in `src/renderer/src/sections/phonon-3d/`.

---

## 5. Dubbi e domande per la regia

Nessun dubbio bloccante: l'integrazione multi-capitolo della Sezione 3 è pulita, retrocompatibile e mantiene l'app priva di librerie 3D pesanti grazie al rendering Canvas 2D nativo. Unico suggerimento facoltativo di pulizia prima della chiusura definitiva: correggere il piccolo typo TeX `\;` → `\\;` in `formulas.ts:35` (visibile quando si seleziona l'Alluminio).

---

## 6. Verdetto finale

**Approvata.** Tutti i controlli di regressione su *Teoria delle bande* e sulle Sezioni 1–2 di *Fononi*, l'integrità dei file proibiti, la pulizia dei 3 file condivisi toccati (`physics/index.ts`, `sections/registry.ts`, `home/curves.ts`), l'isolamento di `physics/`, la politica colori senza hex hardcoded, la CSP in `src/renderer/index.html`, l'assenza di nuove dipendenze in `package.json`, `typecheck`, tutti i **177/177 test unitari** (20/20 file) e la build di produzione (`electron-vite build`) sono superati senza problemi bloccanti né importanti (3 rilievi minori documentati).
