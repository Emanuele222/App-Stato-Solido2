# Revisione di Integrazione Multi-Capitolo — Sezione 1 (Catena monatomica e prima zona di Brillouin)

- **Ruolo**: Revisore di Integrazione Multi-Capitolo (`.agents/skills/revisore-integrazione/SKILL.md`)
- **Ambito**: Sezione 1 del capitolo *Fononi* — `phonon-monatomic` (*Catena monatomica e prima zona di Brillouin*)
- **Verdetto**: **approvata** (0 problemi bloccanti, 0 problemi importanti, 2 note minori; zero regressioni su *Teoria delle bande*)

---

## 1. Cosa è stato verificato, comandi eseguiti ed esiti esatti

Tutti i comandi Node/npm sono stati eseguiti in PowerShell anteponendo `.tools\node` al `PATH` (`$env:PATH = "$PWD\.tools\node;$env:PATH"`):

| Verifica | Comando eseguito | Exit code | Esito esatto |
|---|---|---:|---|
| Typecheck | `npm.cmd run typecheck` (`tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json`) | `0` | Nessun errore di tipo su main, preload e renderer. |
| Test unitari | `npm.cmd test` (`vitest run`) | `0` | **19 file di test passati (19/19), 156 test passati (156/156)** in `3.68s`: tutti i 138 test preesistenti di *Teoria delle bande* + i 10 test di Fase 0 + gli **8 nuovi test** di `src/renderer/src/physics/phononDispersion.test.ts`. |
| Build di produzione | `npm.cmd run build` (`npm run typecheck && electron-vite build`) | `0` | Main (`out/main/index.js`, `1.21 kB`), preload (`out/preload/index.js`, `0.14 kB`) e renderer (`out/renderer/index.html`, `epmWorker-D5ov2p22.js` `24.17 kB`, `index-bUsRMOaD.css` `78.14 kB`, `index-CHBnok7L.js` `1,780.79 kB`, 124 moduli) compilati senza errori né warning. |
| Integrità repository | `git status --short; git diff --stat` (non disponibile: `git` assente) → verifica deterministica read-only via Node sugli SHA-1 blob di tutte le **249 voci tracciate** in `.git/index` + scansione `src/` | `0` | **3 file tracciati modificati** (`src/renderer/src/home/curves.ts`, `src/renderer/src/physics/index.ts`, `src/renderer/src/sections/registry.ts`), **0 file cancellati**, **10 nuovi file** in `src/` (2 in `physics/`, 8 in `sections/phonon-monatomic/`). |
| Isolamento layer, colori, API Electron, `QuantityId`, TeX | Script Node read-only su `src/renderer/src/physics/`, `sections/`, `viz/`, `home/` e `sections/phonon-monatomic/` | `0` | **0 violazioni** di import o globali DOM in `physics/`; **0 colori hex/rgb/rgba/hsl hardcoded** fuori da `ui/theme.ts` (unica occorrenza `rgba(...)` è l'helper `withAlpha` in `viz/canvas.ts:737`); **0 riferimenti ad API Electron** nel renderer; **0 `QuantityId` sconosciuti**; **0 apostrofi tipografici** dentro formule TeX; **0 import di librerie pesanti** (`three`). |
| Separazione percettiva colori (CIE Lab ΔE) | Script Node read-only sulle 9 grandezze usate nella Sezione 1 (`a`, `k`, `omega`, `omegaOpt`, `C`, `M`, `u`, `v`, `vp`) | `0` | Coppia più vicina `omegaOpt`/`C` con **ΔE = 23,6** (peraltro su canvas distinti); sullo stesso canvas tutte le coppie hanno **ΔE ≥ 27,5** (`k`/`u` 27,5; `a`/`v` 30,9; `omega`/`v` 32,1). |

### Cosa non è stato possibile verificare
- **`git` CLI nativo**: l'eseguibile `git` non è presente nel sistema; lo stato completo dei file modificati e intatti è stato comunque accertato confrontando gli SHA-1 di ogni file tracciato contro `.git/index`.
- **Rendering visivo e interazione live nel browser** (`npm run dev:web` a 1440/1100/800 px): fuori dall'ambito statico di questa revisione (demandato a `critico-grafico` e `studente`).

---

## 2. Controlli di conformità architetturale e sicurezza

1. **Zero regressioni su *Teoria delle bande***:
   - Tutte le 6 sezioni di Bande (`empty-lattice`, `kronig-penney`, `nearly-free`, `tight-binding`, `k-dot-p`, `pseudopotential`) risultano completamente intatte (SHA-1 identico a `.git/index`).
   - `SECTIONS`, `CHAPTERS`, `ALL_CHAPTERS` e `DEFAULT_SECTION_ID` in `src/renderer/src/sections/registry.ts` conservano inalterati ordine, id, titoli e componenti di tutte le 6 sezioni di Bande.
   - `HomeScreen` mantiene la griglia regolare a 5 riquadri (*Teoria delle bande*, *Cristallografia*, *Reticolo reciproco e diffrazione*, *Fononi*, *Semiconduttori*). Con il montaggio di `PhononMonatomicSection`, la card *Fononi* passa automaticamente da stato «in preparazione» a stato pienamente navigabile (`hasAvailable === true`, clic/Invio porta a `phonon-monatomic`, `aria-label` e hint aggiornati coerentemente).
   - `AppShell` espone entrambi i capitoli nella barra laterale con accento cromatico distinto (`E` per Bande, `omega` per Fononi): 6/6 sezioni attive in Bande, 1/6 attiva (`phonon-monatomic`) e 5/6 disabilitate con `aria-disabled="true"` in Fononi.
2. **Isolamento dei layer (`CLAUDE.md`)**:
   - `src/renderer/src/physics/phononDispersion.ts` importa solo simboli da `./constants`; `phononDispersion.test.ts` importa solo `vitest`, `./constants` e `./phononDispersion`. Nessun file di `physics/` importa React, DOM, `ui/`, `viz/`, `sections/` o `home/`.
   - Nessuna dipendenza da API Electron (`ipcRenderer`, `window.electron`, `window.api`, `from 'electron'`) nel renderer: compatibilità con `npm run dev:web` preservata.
   - Nessuna dipendenza aggiunta in `package.json` (rimangono esclusivamente `katex`, `react`, `react-dom`, `zustand`).
   - La sezione `sections/phonon-monatomic/` non importa nulla dalle sezioni di Bande e riusa integralmente i componenti condivisi (`SectionLayout`, `SceneView`, `Panel`, `ParamSlider`, `Stepper`, `PresetMenu`, `ToolToggle`, `LiveFormula`, `DispersionPlot`, `PlaybackControls`, `ChartLegend`, `RichText`, `Tex`, `useTweened`) senza modificare `ui/` né `viz/`.
   - Tutte le classi CSS condivise richiamate in `PhononMonatomicSection.tsx` (`.formula-main`, `.formula-defs`, `.formula-edge`, `.values`, `.value-num`, `.view-note`, `.nowrap`, `.theory`, `.foot`) e tutte le variabili CSS usate in `phonon-monatomic.css` (`--line`, `--bg`, `--muted`, `--text`, `--raised`) esistono in `ui/ui.css` e `ui/theme.ts`.
3. **Sicurezza, prestazioni e file proibiti**:
   - **CSP (`src/renderer/index.html:6-9`)**: intatta (SHA-1 identico a `.git/index`): `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:`.
   - **Bundle e prestazioni**: incremento del bundle renderer di ~87 kB rispetto a Fase 0 (`1,693.74 kB` → `1,780.79 kB`), coerente con l'inclusione effettiva nel grafo di `DispersionPlot`, `PlaybackControls`, `phononDispersion` e della Sezione 1 (prima tree-shaken). Nessuna libreria pesante (es. Three.js) introdotta.
   - **File proibiti**: verifica SHA-1 confermata intatta su `progetto.md`, `CLAUDE.md`, `AGENTS.md`, `.claude/`, `incarichi/`, `materiale/`, `package.json`, `package-lock.json`, `src/renderer/index.html`, `src/main/`, `src/preload/`, `ui/theme.ts` e tutte le sezioni di Bande.

---

## 3. File condivisi toccati e valutazione del rischio conflitto col collega

| File | Modifica effettuata | Retrocompatibilità | Rischio conflitto col collega |
|---|---|---|---|
| `src/renderer/src/physics/index.ts` | Aggiunta di 1 riga in coda: `export * from './phononDispersion'` (riga 16) | Totale | **Basso** — aggiunta puramente append-only di una sola riga. |
| `src/renderer/src/sections/registry.ts` | Import di `PhononMonatomicSection` (riga 15) e sostituzione `component: null` → `component: PhononMonatomicSection` sulla voce `phonon-monatomic` (riga 31) | Totale (le 6 sezioni di Bande e i tipi esportati restano invariati) | **Basso–Medio** — file condiviso di registrazione, ma intervento chirurgico di 2 righe sulla sola voce fononica. |
| `src/renderer/src/home/curves.ts` | Import di `monatomicDispersionCurve` e `monatomicZoneEdge` da `../physics` (righe 23–24) e sostituzione del calcolo inline della curva `s1` (`phonon-monatomic`, righe 343–347) con chiamate reali al modulo `physics/` (chiude il debito tecnico transitorio di Fase 0 per la Sezione 1) | Totale (curve di Bande intatte; `home/curves.test.ts` 9/9 verde) | **Basso** — tocca soltanto l'import e il blocco Fononi in coda al file (righe 343–347). |
| Nuovi file (`src/renderer/src/physics/phononDispersion.ts`, `phononDispersion.test.ts`, `src/renderer/src/sections/phonon-monatomic/*` — 8 file) | Creazione ex novo | N/A | **Nullo** — nessun conflitto possibile. |

---

## 4. Problemi trovati (ordinati per gravità)

### Bloccante
Nessuno.

### Importante
Nessuno.

### Minore

1. **Mutazione di `ref` durante la fase di render in `MonatomicChainView`**
   - **File e riga**: `src/renderer/src/sections/phonon-monatomic/MonatomicChainView.tsx:136-141` e `222`.
   - **Dettaglio**: per sincronizzare `phaseRadRef` con `playback.resetTick`, il componente aggiorna `lastResetTickRef.current` e `phaseRadRef.current = 0` direttamente nel corpo della funzione di render. Sebbene l'operazione sia idempotente e quindi non produca difetti visibili nemmeno in React StrictMode, la convenzione React 19 raccomanda di evitare mutazioni di `ref` durante il render. Sarebbe più pulito passare a `PlaybackControls` un callback `onReset` che azzera `phaseRadRef.current = 0` e poi invoca `playback.resetPhase()` (che forza il ridisegno tramite `resetTick`).

2. **Calcolo inline degli spostamenti sull'anello di Born–von Kármán in `MonatomicChainView`**
   - **File e riga**: `src/renderer/src/sections/phonon-monatomic/MonatomicChainView.tsx:485-488`.
   - **Dettaglio**: mentre `drawLinearChain` (riga 256) delega correttamente gli spostamenti a `monatomicDisplacements` di `physics/`, `drawBvkRing` calcola `Math.cos((2 * Math.PI * j * n) / N - phase)` inline. L'espressione è matematicamente identica a `monatomicDisplacements(p.a, p.k, phase, N, 0)` (con `k = 2πj/(Na)`), ma riusare la funzione del layer `physics/` manterrebbe l'isolamento ancora più uniforme.

---

## 5. Dubbi e domande per la regia

Nessun dubbio aperto per questa integrazione: il passaggio della Sezione 1 si innesta in modo pulito sull'infrastruttura di Fase 0 (inclusi i fix di `usePlaybackPhase.resetTick` e della palette `u`/`Theta`/`CV` già applicati prima della Sezione 1).

---

## 6. Verdetto finale

**Approvata.** Tutti i controlli di regressione su *Teoria delle bande*, isolamento dei layer, coerenza dei file condivisi, colori, sicurezza CSP, typecheck, test unitari (`156/156`) e build di produzione (`electron-vite build`) sono superati senza alcun problema bloccante o importante.
