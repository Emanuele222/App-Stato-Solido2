# Revisione di Integrazione Multi-Capitolo — Sezione 5 (Modi quantizzati e processi Umklapp)

- **Ruolo**: Revisore di Integrazione Multi-Capitolo (`.agents/skills/revisore-integrazione/SKILL.md`)
- **Ambito**: Sezione 5 del capitolo *Fononi* (`phonon-quantum`) — `src/renderer/src/physics/phononQuantum.ts`, `src/renderer/src/physics/phononQuantum.test.ts`, `src/renderer/src/sections/phonon-quantum/` (11 file), e file condivisi `src/renderer/src/physics/index.ts`, `src/renderer/src/sections/registry.ts`
- **Verdetto**: **approvata** (0 problemi bloccanti, 0 problemi importanti, 2 rilievi minori; zero regressioni su *Teoria delle bande* e sulle Sezioni 1–4 di *Fononi*)

---

## 1. Cosa è stato verificato, comandi eseguiti ed esiti esatti

Tutti i comandi Node/npm sono stati eseguiti in PowerShell anteponendo `.tools\node` al `PATH` (`$env:PATH = "$PWD\.tools\node;$env:PATH"`):

| Verifica | Comando eseguito | Exit code | Esito esatto |
|---|---|---:|---|
| Typecheck | `npm.cmd run typecheck` (`tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json`) | `0` | Nessun errore di tipo su main, preload e renderer. |
| Test unitari | `npm.cmd test` (`vitest run`) | `0` | **23 file di test passati (23/23), 211 test passati (211/211)** in `4.92s`: tutti i test preesistenti di *Teoria delle bande* (16 file in `physics/` per 154 test + `home/curves.test.ts` 9 test), test condivisi (`constants` 2, `ui/theme` 2, `viz/dispersionPlot` 2), Fononi Sezioni 1–4 (`phononDispersion` 22, `phonon3d` 11) e il nuovo `phononQuantum.test.ts` (**9/9 test passati**). |
| Build di produzione | `npm.cmd run build` (`npm run typecheck && electron-vite build`) | `0` | Main (`out/main/index.js`, `1.21 kB`), preload (`out/preload/index.js`, `0.14 kB`) e renderer (`out/renderer/index.html` `0.60 kB`, `epmWorker-BCY2_NWm.js` `25.55 kB`, `index-Ceo17J4x.css` `96.83 kB`, `three.module-X_VS2-6U.js` `1,907.86 kB`, `index-B75E5hv8.js` `2,310.98 kB`, 187 moduli) compilati senza errori. |
| Timestamp e integrità file proibiti / Bande | `Get-ChildItem` su root, `src/main/`, `src/preload/`, `src/renderer/index.html`, `src/renderer/src/physics/`, `src/renderer/src/ui/`, `src/renderer/src/viz/`, `src/renderer/src/home/`, `src/renderer/src/sections/` | `0` | Nessuna modifica su `progetto.md`, `CLAUDE.md`, `AGENTS.md`, `package.json`, `src/renderer/index.html` (`LastWriteTime` del `22/11`–`23/11/2026`), né su `ui/`, `viz/`, `home/` (`22/11`–`24/11/2026`), né sulle 8 sezioni di *Teoria delle bande* (`22/11`–`23/11/2026`), né sulle Sezioni 1–4 di *Fononi* (`24/11/2026`). Modificati in data `27/11/2026` solo `physics/phononQuantum.ts`, `physics/phononQuantum.test.ts`, `physics/index.ts`, `sections/registry.ts` e `sections/phonon-quantum/*`. |
| Isolamento layer `physics/` e assenza API Electron | `Select-String` su `src/renderer/src/physics/*.ts` e `src/renderer/src/**/*.{ts,tsx}` | `0` | **0 violazioni**: nessun modulo in `physics/` importa React, DOM (`window.`, `document.`), `ui/`, `viz/`, `sections/` o `home/`. **0 occorrenze** di `ipcRenderer`, `window.api`, `electronAPI`, `from 'electron'` o `require(` nel renderer. |
| Politica colori, `htmlData` e `RichText` | `Select-String` su `sections/`, `viz/`, `home/` (`.ts`, `.tsx`, `.css`) | `0` | **0 colori hex/rgba hardcoded** in `sections/phonon-quantum/` (nel repo restano solo le preesistenti `viz/canvas.ts:737` helper `withAlpha` e `sections/tight-binding-2d/tightBinding2d.css:84`). Tutti gli id in `\htmlData{q=...}` (`a`, `E`, `Ek`, `k`, `M`, `omega`, `psi`, `T`, `u`, `v`) appartengono a `QUANTITIES` in `ui/theme.ts`. **0 sintassi Markdown (`**`)** nei testi di `phonon-quantum/strings.ts`. |

### Cosa non è stato possibile verificare
- **`git status` / `git diff`**: il comando `git` non è presente nel `PATH` della sandbox (`CommandNotFoundException`, e l'accesso a `GitHubDesktop` in `LocalAppData` è negato); l'ambito delle modifiche è stato quindi verificato ispezionando direttamente i contenuti dei file e i rispettivi `LastWriteTime`.
- **Rendering live nel browser (`npm run dev:web`)**: non eseguito in questa revisione statica e di build (di competenza dei revisori `critico-grafico` e `studente`).

---

## 2. Controlli di conformità architetturale e sicurezza

1. **Zero regressioni su *Teoria delle bande* e sulle Sezioni 1–4 di *Fononi***:
   - Tutte le 8 sezioni di *Teoria delle bande* (`empty-lattice`, `kronig-penney`, `nearly-free`, `tight-binding`, `tight-binding-2d`, `k-dot-p`, `pseudopotential`, `real-bands`) in `src/renderer/src/sections/registry.ts:31-38` sono intatte e attive (`component !== null`).
   - Tutte le Sezioni 1–4 di *Fononi* (`phonon-monatomic`, `phonon-diatomic`, `phonon-3d`, `phonon-wavepacket`) restano inalterate e attive (`registry.ts:39-42`).
   - La `HomeScreen` (`src/renderer/src/home/HomeScreen.tsx`) mantiene intatta la griglia a 5 card (2 attive: *Teoria delle bande* `8 sezioni`, *Fononi* `6 sezioni`; 3 *in arrivo*), le anteprime (inclusa `s5` per `phonon-quantum` in `src/renderer/src/home/curves.ts:466-494`) e l'accessibilità da tastiera.
   - `AppShell` (`src/renderer/src/ui/shell.tsx`) e `shellStrings.footnote` (`src/renderer/src/strings.ts:15-22`) riflettono dinamicamente **5/6 sezioni attive** per *Fononi*, lasciando disabilitata (`aria-disabled="true"`) la sola Sezione 6 (`phonon-specific-heat`).

2. **Isolamento dei layer (`CLAUDE.md`)**:
   - `src/renderer/src/physics/phononQuantum.ts` importa esclusivamente da `./constants` e `./phononDispersion` (righe 14–31), senza alcuna dipendenza da React, DOM o componenti `ui/`/`viz/`/`sections/`.
   - `src/renderer/src/sections/phonon-quantum/` riusa senza modifiche i componenti condivisi (`SectionLayout`, `SceneView`, `ParamSlider`, `Panel`, `PresetMenu`, `ToolToggle`, `LiveFormula`, `ChartLegend`, `PlaybackControls`, `usePlaybackPhase`, `RichText`, `Tex`, `useTweened`, `formatNumber`, `drawMathText`, `drawRichText`, `niceStep`, `placeProbeLabel`, `sansFont`, `useCanvasDraw`, `withAlpha`).
   - Gli stili in `src/renderer/src/sections/phonon-quantum/phonon-quantum.css` usano esclusivamente token CSS di `ui/theme.ts` (`--bg`, `--raised`, `--line`, `--text`, `--text-soft`, `--muted`, `--focus`, `--q-omega`, `--q-a`), rispettano `@media (prefers-reduced-motion: reduce)` (righe 194–198) e isolano le regole tramite classi `.phonon-q-*` e selettori `:has(.phonon-q-*)`.
   - Zero dipendenze da API Electron nel renderer (`App.tsx` e tutti i moduli di `phonon-quantum` sono compatibili con `dev:web`).

3. **Tabella `QUANTITIES`, CSP, prestazioni e dipendenze**:
   - Nessuna modifica a `src/renderer/src/ui/theme.ts`: tutte le grandezze usate (`psi`, `T`, `omega`, `M`, `C`, `u`, `E`, `Ek`, `k`, `a`, `v`) e il tono derivato `lightLine` (`toneColor('lightLine')` / `var(--tone-light-line)`) erano già presenti e testati (`ui/theme.test.ts` `2/2`).
   - La CSP in `src/renderer/index.html:6-9` (`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:`) è invariata.
   - `package.json` è invariato: nessuna nuova dipendenza aggiunta.
   - Three.js rimane confinato e caricato dinamicamente solo in `src/renderer/src/viz/Surface3D.tsx` (chunk separato `three.module-X_VS2-6U.js` nella build); `phonon-quantum` utilizza Canvas 2D nativo.

---

## 3. File condivisi toccati e valutazione del rischio conflitto

| File | Modifica effettuata per Sezione 5 | Retrocompatibilità | Rischio conflitto col collega |
|---|---|---|---|
| `src/renderer/src/physics/index.ts` | Aggiunta la riga 20: `export * from './phononQuantum'`. | **Totale** (tutti gli export precedenti alle righe 2–19 sono invariati; nessun conflitto di nomi). | **Basso** — sola aggiunta in coda al barrel file. |
| `src/renderer/src/sections/registry.ts` | Aggiunto `import { PhononQuantumSection } from './phonon-quantum/PhononQuantumSection'` (riga 21) e collegato `component: PhononQuantumSection` alla voce `'phonon-quantum'` (riga 43). | **Totale** (tutte le 8 sezioni di *Teoria delle bande*, le Sezioni 1–4 di *Fononi*, `CHAPTERS` e `ALL_CHAPTERS` sono inalterati). | **Basso** — modifica di 2 righe dedicate esclusivamente alla voce `phonon-quantum`. |
| `src/renderer/src/physics/phononQuantum.ts` | Nuovo modulo TypeScript puro (644 righe) dedicato alla fisica di Sezione 5. | N/A | **Nullo** — file nuovo del capitolo *Fononi*. |
| `src/renderer/src/physics/phononQuantum.test.ts` | Nuova suite Vitest dedicata (9 test, 315 righe). | N/A | **Nullo** — file nuovo del capitolo *Fononi*. |
| `src/renderer/src/sections/phonon-quantum/*` | 11 nuovi file dedicati alla Sezione 5 (`PhononQuantumSection.tsx`, `QuantumOscillatorView.tsx`, `QuantumChainView.tsx`, `Umklapp1BZView.tsx`, `UmklappDispersionView.tsx`, `formulas.ts`, `manifest.ts`, `model.ts`, `store.ts`, `strings.ts`, `phonon-quantum.css`). | N/A | **Nullo** — cartella dedicata, nessun file condiviso toccato. |

Nessun file proibito (`progetto.md`, `CLAUDE.md`, `AGENTS.md`, `incarichi/`, `materiale/`, `.claude/`, `ui/`, `viz/`, `home/`, sezioni 1–4 di *Fononi*, sezioni di *Teoria delle bande*) risulta modificato per Sezione 5.

---

## 4. Problemi trovati (ordinati per gravità)

### Bloccante
Nessuno.

### Importante
Nessuno.

### Minore

1. **Chiave inutilizzata `umklappScene.xAxis` in `strings.ts`**
   - **File e riga**: `src/renderer/src/sections/phonon-quantum/strings.ts:92` (`xAxis: 'k (π/a)'`).
   - **Cosa non va e perché**: `strings.umklappScene.xAxis` è definita ma non referenziata in `Umklapp1BZView.tsx` né in `UmklappDispersionView.tsx` (dove le tacche sull'asse delle ascisse riportano già esplicitamente `-2π/a`, `-π/a`, `0`, `+π/a`, `+2π/a`). Non ha impatto funzionale o di build, ma rimuoverla evita simboli morti.
   - **Come riprodurlo**: ricerca di `xAxis` dentro `src/renderer/src/sections/phonon-quantum/`.

2. **Underscore letterale in etichetta testuale `tunnelingNote` (`x_cl`)**
   - **File e riga**: `src/renderer/src/sections/phonon-quantum/strings.ts:107` e `src/renderer/src/sections/phonon-quantum/PhononQuantumSection.tsx:429`.
   - **Cosa non va e perché**: per `nVal > 0`, `tunnelingNote(nVal)` restituisce `'frazione nella regione |x| > x_cl'`, che viene renderizzata come testo piano (`<span className="sub note">{v.tunnelingNote(model.nInt)}</span>`) anziché con `<RichText>` o notazione Unicode/KaTeX; l'utente legge quindi letteralmente `x_cl` nel pannello valori (lo stesso avviene per `k_BT/ħω` in `QuantumOscillatorView.tsx:498` e `Δx_zp` / `Δx_rms` in `QuantumChainView.tsx:294-295`). Impatto puramente tipografico, nessun effetto sulla funzionalità o sull'integrazione.
   - **Come riprodurlo**: aprire la Sezione 5, selezionare il preset `Eccitato (n = 2)` e leggere la nota sotto `Effetto tunnel` nel pannello «Formula viva».

---

## 5. Dubbi e domande per la regia

Nessuno: l'integrazione di `phonon-quantum` rispetta l'architettura multi-capitolo, la separazione dei layer, la politica colori/tipografia e non introduce regressioni su *Teoria delle bande* né sulle altre sezioni di *Fononi*.

---

## 6. Verdetto finale

**Approvata.** `typecheck` (exit `0`), `test` (**23/23 file, 211/211 test verdi**) e `build` (`electron-vite build`, exit `0`) superati; isolamento di `physics/phononQuantum.ts`, assenza di dipendenze Electron nel renderer, assenza di colori hex/rgba hardcoded in `sections/phonon-quantum/`, CSP invariata, `package.json` invariato e integrità dei file condivisi/proibiti e di *Teoria delle bande* verificati senza problemi bloccanti né importanti (2 rilievi minori documentati).
