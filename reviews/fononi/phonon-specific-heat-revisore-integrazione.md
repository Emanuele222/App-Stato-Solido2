# Revisione di Integrazione Multi-Capitolo — Sezione 6 (Calore specifico e Debye)

- **Ruolo**: Revisore di Integrazione Multi-Capitolo (`.agents/skills/revisore-integrazione/SKILL.md`)
- **Ambito**: Sezione 6 del capitolo *Fononi* (`phonon-specific-heat`) — `src/renderer/src/physics/specificHeat.ts`, `src/renderer/src/physics/specificHeat.test.ts`, `src/renderer/src/physics/index.ts`, `src/renderer/src/sections/phonon-specific-heat/` (9 file) e `src/renderer/src/sections/registry.ts`
- **Verdetto**: **approvata** (0 problemi bloccanti, 0 problemi importanti, 0 rilievi minori di integrazione; zero regressioni su *Teoria delle bande* e sulle Sezioni 1–5 di *Fononi*)

---

## 1. Cosa è stato verificato, comandi eseguiti ed esiti esatti

Tutti i comandi Node/npm sono stati eseguiti in PowerShell anteponendo `.tools\node` al `PATH` (`$env:PATH = "$PWD\.tools\node;$env:PATH"`):

| Verifica | Comando eseguito | Exit code | Esito esatto |
|---|---|---:|---|
| Typecheck | `npm.cmd run typecheck` (`tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json`) | `0` | Nessun errore di tipo su main, preload e renderer; nessun conflitto di export in `src/renderer/src/physics/index.ts`. |
| Test unitari | `npm.cmd test` (`vitest run`) | `0` | **24 file di test passati (24/24), 216 test passati (216/216)** in `3.80s`: tutti i test preesistenti di *Teoria delle bande* (16 file in `physics/` per 154 test + `home/curves.test.ts` 9 test), test condivisi (`constants` 2, `ui/theme` 2, `viz/dispersionPlot` 2), Fononi Sezioni 1–5 (`phononDispersion` 22, `phonon3d` 11, `phononQuantum` 9) e il nuovo `specificHeat.test.ts` (**5/5 test passati**). |
| Build di produzione | `npm.cmd run build` (`npm run typecheck && electron-vite build`) | `0` | Main (`out/main/index.js`, `1.21 kB`), preload (`out/preload/index.js`, `0.14 kB`) e renderer (`out/renderer/index.html` `0.60 kB`, `epmWorker-BCY2_NWm.js` `25.55 kB`, `index-sn1mP_RG.css` `100.43 kB`, `three.module-X_VS2-6U.js` `1,907.86 kB`, `index-BKyJVUOA.js` `2,405.76 kB`, 197 moduli) compilati senza errori. |
| Timestamp e integrità file protetti / Bande / Sezioni 1–5 | `Get-ChildItem` / `Get-Item` su `package.json`, `AGENTS.md`, `CLAUDE.md`, `progetto.md`, `src/renderer/index.html`, `src/renderer/src/strings.ts`, `src/renderer/src/ui/`, `src/renderer/src/viz/`, `src/renderer/src/home/`, `src/renderer/src/sections/` | `0` | Nessuna modifica su `package.json`, `AGENTS.md`, `progetto.md`, `src/renderer/src/strings.ts` (`LastWriteTime` `23/11/2026`), `CLAUDE.md`, `src/renderer/index.html` (`22/11/2026`), `ui/` (`theme.ts` `22/11/2026`, ultimo file `navigation.ts` `23/11/2026`), `viz/` (`23/11/2026`), `home/` (`24/11/2026`), sulle 8 sezioni di *Teoria delle bande* (`22/11`–`23/11/2026`), né sulle Sezioni 1–5 di *Fononi* (`24/11/2026`–`27/11/2026 00:59`). Gli unici file con modifica nella tornata corrente (`27/11/2026 10:31`–`11:03`) sono `physics/specificHeat.ts`, `physics/specificHeat.test.ts`, `physics/index.ts`, `sections/registry.ts` e i 9 file in `sections/phonon-specific-heat/`. |
| Isolamento layer `physics/` e assenza API Electron | `Select-String` su `src/renderer/src/physics/*.ts` e `src/renderer/src/**/*.{ts,tsx}` | `0` | **0 violazioni**: nessun modulo in `physics/` importa React, DOM (`document`, `window`), `ui/`, `viz/`, `sections/` o `home/`. **0 occorrenze** di `window.electron`, `ipcRenderer` o `require('electron')` nel renderer. |
| Politica colori, chiavi `QUANTITIES`/`DERIVED_TONES` e sintassi `RichText` | `Select-String` e regex PowerShell su `src/renderer/src/sections/phonon-specific-heat/*` e su `sections/`, `viz/`, `home/` | `0` | **0 colori hex/rgb/hsl hardcoded** in `sections/phonon-specific-heat/` (nel repo restano solo le preesistenti `viz/canvas.ts:737` helper `withAlpha` e `sections/tight-binding-2d/tightBinding2d.css:84`). Tutte le chiavi `QUANTITIES` (`CV`, `Ek`, `k`, `omega`, `omegaOpt`, `T`, `Theta`, `v`) e `DERIVED_TONES` (`activatedModes`, `vanHoveDos` / `--tone-activated-modes`, `--tone-van-hove-dos`) esistono in `src/renderer/src/ui/theme.ts`. **0 sintassi Markdown** nei testi di `phonon-specific-heat/strings.ts`. |

### Cosa non è stato possibile verificare
- **`git status` / `git diff`**: l'eseguibile `git` non è presente nel `PATH` dell'ambiente (`CommandNotFoundException`); l'ambito esatto delle modifiche è stato verificato tramite ispezione diretta dei file interessati e confronto dei `LastWriteTime` su tutto l'albero sorgente e sui file protetti.
- **Rendering live nel browser (`npm run dev:web`)**: non avviato in questa verifica statica e di build (di competenza dei revisori `critico-grafico` e `studente`).

---

## 2. Controlli di conformità architetturale e sicurezza

1. **Zero regressioni su *Teoria delle bande* e sulle Sezioni 1–5 di *Fononi***:
   - Tutte le 8 sezioni di *Teoria delle bande* (`empty-lattice`, `kronig-penney`, `nearly-free`, `tight-binding`, `tight-binding-2d`, `k-dot-p`, `pseudopotential`, `real-bands`) in `src/renderer/src/sections/registry.ts:32-39` restano inalterate e attive (`component !== null`).
   - Tutte le Sezioni 1–5 di *Fononi* (`phonon-monatomic`, `phonon-diatomic`, `phonon-3d`, `phonon-wavepacket`, `phonon-quantum`) restano inalterate e attive (`registry.ts:40-44`).
   - Con la registrazione di `PhononSpecificHeatSection` alla voce `'phonon-specific-heat'` (`registry.ts:45`), **tutte le 6 sezioni del capitolo *Fononi* sono ora attive (6/6)**, allineate al contatore dinamico `shellStrings.footnote` (`src/renderer/src/strings.ts:15-22`: `Teoria delle bande (8/8) e Fononi (6/6)`).
   - `HomeScreen` (`src/renderer/src/home/HomeScreen.tsx`) mantiene intatta la griglia regolare a 5 card (2 attive: *Teoria delle bande*, *Fononi*; 3 *in arrivo*), l'accessibilità da tastiera (`ActiveChapterCard.tsx:221-245`) e l'anteprima ciclica completa su 6 sezioni (voce `s6` con `id: 'phonon-specific-heat'` già presente in `src/renderer/src/home/curves.ts:496-524`).
   - `AppShell` (`src/renderer/src/ui/shell.tsx`) e `App.tsx` navigano senza variazioni su tutte le 14 sezioni attive.

2. **Isolamento dei layer (`CLAUDE.md`)**:
   - `src/renderer/src/physics/specificHeat.ts` (639 righe) importa esclusivamente costanti fisiche da `./constants` (`specificHeat.ts:13`), senza alcuna dipendenza da React, DOM o layer UI/viz/sections.
   - `src/renderer/src/sections/phonon-specific-heat/` riusa senza modifiche i componenti condivisi (`SectionLayout`, `SceneView`, `Panel`, `ParamSlider`, `PresetMenu`, `ToolToggle`, `LiveFormula`, `ChartLegend`, `RichText`, `Tex`, `useTweened`, `formatNumber`, `drawMathText`, `drawRichText`, `niceStep`, `placeFreeLabel`, `buildObstacleMap`, `sansFont`, `useCanvasDraw`, `withAlpha`).
   - Gli stili in `src/renderer/src/sections/phonon-specific-heat/phonon-specific-heat.css` utilizzano esclusivamente token CSS di `ui/theme.ts` (`--bg`, `--raised`, `--line`, `--dim`, `--text`, `--muted`, `--focus`, `--q-omega`), rispettano `@media (prefers-reduced-motion: reduce)` (`phonon-specific-heat.css:183-188`) e confinano le regole ai prefissi `.phonon-sh-*` e `:has(.phonon-sh-*)`.
   - Zero dipendenze da API Electron nel renderer: compatibilità preservata per `npm run dev:web`.

3. **Tabella colori `QUANTITIES` / `DERIVED_TONES`, CSP, prestazioni e dipendenze**:
   - `src/renderer/src/ui/theme.ts` non è stato modificato: tutte le grandezze utilizzate in `formulas.ts`, `manifest.ts`, `PhononSpecificHeatSection.tsx`, `SpecificHeatCurveView.tsx`, `SpectrumDebyeView.tsx`, `strings.ts` e `phonon-specific-heat.css` (`CV`, `Ek`, `k`, `omega`, `omegaOpt`, `T`, `Theta`, `v`) e i due toni derivati (`vanHoveDos` / `--tone-van-hove-dos` e `activatedModes` / `--tone-activated-modes`) appartengono a `QUANTITIES` e `DERIVED_TONES` (`ui/theme.test.ts` `2/2` verde).
   - La CSP in `src/renderer/index.html:6-9` (`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:`) è invariata.
   - `package.json` è invariato: nessuna nuova dipendenza introdotta.
   - Three.js rimane confinato e caricato dinamicamente tramite `import('three')` solo in `src/renderer/src/viz/Surface3D.tsx:285` (chunk separato `three.module-X_VS2-6U.js`); `phonon-specific-heat` usa esclusivamente Canvas 2D nativo.

---

## 3. File condivisi toccati e valutazione del rischio conflitto

| File | Modifica effettuata per Sezione 6 | Retrocompatibilità | Rischio conflitto col collega |
|---|---|---|---|
| `src/renderer/src/physics/index.ts` | Aggiunta la riga 21: `export * from './specificHeat'`. | **Totale** (tutti gli export precedenti alle righe 2–20 sono invariati; nessun conflitto di simboli). | **Basso** — sola aggiunta in coda al barrel file. |
| `src/renderer/src/sections/registry.ts` | Aggiunto `import { PhononSpecificHeatSection } from './phonon-specific-heat/PhononSpecificHeatSection'` (riga 22) e collegato `component: PhononSpecificHeatSection` alla voce `'phonon-specific-heat'` (riga 45). | **Totale** (tutte le 8 sezioni di *Teoria delle bande*, le Sezioni 1–5 di *Fononi*, `CHAPTERS` e `ALL_CHAPTERS` sono inalterati). | **Basso** — modifica di 2 righe dedicate esclusivamente alla voce `phonon-specific-heat`. |
| `src/renderer/src/physics/specificHeat.ts` | Nuovo modulo TypeScript puro (639 righe) per la fisica di Sezione 6. | N/A | **Nullo** — file nuovo del capitolo *Fononi*. |
| `src/renderer/src/physics/specificHeat.test.ts` | Nuova suite Vitest dedicata (5 test, 212 righe). | N/A | **Nullo** — file nuovo del capitolo *Fononi*. |
| `src/renderer/src/sections/phonon-specific-heat/*` | 9 nuovi file dedicati alla Sezione 6 (`PhononSpecificHeatSection.tsx`, `SpecificHeatCurveView.tsx`, `SpectrumDebyeView.tsx`, `formulas.ts`, `manifest.ts`, `model.ts`, `store.ts`, `strings.ts`, `phonon-specific-heat.css`). | N/A | **Nullo** — cartella dedicata, nessun file condiviso toccato. |

Nessun file proibito o condiviso esterno all'ambito (`ui/`, `viz/`, `home/`, Sezioni 1–5 di *Fononi*, sezioni di *Teoria delle bande*, `AGENTS.md`, `CLAUDE.md`, `progetto.md`, `package.json`, `src/renderer/index.html`, `src/renderer/src/strings.ts`, `src/renderer/src/ui/theme.ts`) risulta modificato.

---

## 4. Problemi trovati (ordinati per gravità)

### Bloccante
Nessuno.

### Importante
Nessuno.

### Minore
Nessuno rilevato sul piano dell'integrazione multi-capitolo e dell'architettura.

---

## 5. Dubbi e domande per la regia

Nessuno: l'integrazione della Sezione 6 (`phonon-specific-heat`) completa il capitolo *Fononi* (6/6 sezioni attive) mantenendo l'isolamento dei layer, la retrocompatibilità con *Teoria delle bande* (8/8 sezioni) e le Sezioni 1–5 dei *Fononi*, senza regressioni su typecheck, test o build.

---

## 6. Verdetto finale

**Approvata.** `npm.cmd run typecheck` (exit `0`), `npm.cmd test` (**24/24 file, 216/216 test verdi**) e `npm.cmd run build` (`electron-vite build`, exit `0`) superati; isolamento di `physics/specificHeat.ts`, assenza di API Electron nel renderer, zero colori hex/rgb/hsl hardcoded in `sections/phonon-specific-heat/`, validità di tutte le chiavi `QUANTITIES`/`DERIVED_TONES`, CSP invariata, `package.json` invariato e integrità di `ui/`, `viz/`, `home/`, *Teoria delle bande*, Sezioni 1–5 di *Fononi* e file di progetto verificati con esito positivo.
