# Revisione di Integrazione Multi-Capitolo — Sezione 4 (Pacchetti d’onda: velocità di fase e di gruppo)

- **Ruolo**: Revisore di Integrazione Multi-Capitolo (`.agents/skills/revisore-integrazione/SKILL.md`)
- **Ambito**: Sezione 4 del capitolo *Fononi* (`phonon-wavepacket`) — `src/renderer/src/sections/phonon-wavepacket/` (8 file), estensione di `src/renderer/src/physics/phononDispersion.ts` e `src/renderer/src/physics/phononDispersion.test.ts`, e file condivisi `src/renderer/src/sections/registry.ts`, `src/renderer/src/home/curves.ts`
- **Verdetto**: **approvata** (0 problemi bloccanti, 0 problemi importanti, 2 rilievi minori; zero regressioni su *Teoria delle bande* e sulle Sezioni 1–3 di *Fononi*)

---

## 1. Cosa è stato verificato, comandi eseguiti ed esiti esatti

Tutti i comandi Node/npm sono stati eseguiti in PowerShell anteponendo `.tools\node` al `PATH` (`$env:PATH = "$PWD\.tools\node;$env:PATH"`):

| Verifica | Comando eseguito | Exit code | Esito esatto |
|---|---|---:|---|
| Typecheck | `npm.cmd run typecheck` (`tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json`) | `0` | Nessun errore di tipo su main, preload e renderer. |
| Test unitari | `npm.cmd test` (`vitest run`) | `0` | **22 file di test passati (22/22), 202 test passati (202/202)** in `4.04s`: tutti i test preesistenti di *Teoria delle bande* (16 file in `physics/` per 154 test + 5 in `home/curves.test.ts`), test condivisi/Fase 0 (`constants` 2, `ui/theme` 2, `viz/dispersionPlot` 2, `home/curves` Fononi 4), `phonon3d.test.ts` (11), e `phononDispersion.test.ts` (**22/22**, inclusi i 18 di Sezioni 1–2 e i 4 nuovi test sui pacchetti d'onda alle righe 555–765). |
| Build di produzione | `npm.cmd run build` (`npm run typecheck && electron-vite build`) | `0` | Main (`out/main/index.js`, `1.21 kB`), preload (`out/preload/index.js`, `0.14 kB`) e renderer (`out/renderer/index.html` `0.60 kB`, `epmWorker-BCY2_NWm.js` `25.55 kB`, `index-CKC8SViJ.css` `92.56 kB`, `three.module-X_VS2-6U.js` `1,907.86 kB`, `index-Ca_TsI08.js` `2,186.28 kB`, 175 moduli) compilati senza errori. |
| Timestamp e integrità file proibiti / Bande | `Get-Item` / `Get-ChildItem` su `progetto.md`, `CLAUDE.md`, `AGENTS.md`, `package.json`, `src/renderer/index.html`, `.claude/`, `incarichi/`, `src/renderer/src/sections/`, `src/renderer/src/strings.ts`, `src/renderer/src/ui/theme.ts` | `0` | Nessuna modifica recente sui file proibiti (`LastWriteTime` del `22/11` o `23/11/2026`), né sulle 8 sezioni di *Teoria delle bande*, né su `phonon-monatomic`, `phonon-diatomic`, `phonon-3d`. Modificati in data `24/11/2026` solo `phononDispersion.ts`, `phononDispersion.test.ts`, `sections/phonon-wavepacket/*`, `sections/registry.ts` e `home/curves.ts`. |
| Isolamento layer `physics/` e assenza API Electron | `Select-String` su `src/renderer/src/physics/*.ts` e `src/renderer/src/**/*.{ts,tsx}` | `0` | **0 violazioni**: nessun modulo in `physics/` importa React, DOM (`window.`, `document.`), `ui/`, `viz/`, `sections/` o `home/`. **0 occorrenze** di `ipcRenderer`, `window.api`, `electronAPI`, `from 'electron'` o `require(` nel renderer. |
| Politica colori, CSS e `RichText` | `Select-String` su `sections/`, `viz/`, `home/` (`.ts`, `.tsx`, `.css`) | `0` | **0 colori hex/rgba hardcoded** in `sections/phonon-wavepacket/` e `home/` (le uniche occorrenze nel repo sono le preesistenti `viz/canvas.ts:737` helper `withAlpha` e `sections/tight-binding-2d/tightBinding2d.css:84`). **0 sintassi Markdown (`**` o `*`)** in `RichText` o `strings.ts` di `phonon-wavepacket`. |

### Cosa non è stato possibile verificare
- **`git status` / `git diff`**: il comando `git` non è presente nel `PATH` dell'ambiente di esecuzione (`CommandNotFoundException`); la verifica dell'ambito modificato è stata quindi svolta tramite ispezione diretta dei contenuti e delle date di modifica (`LastWriteTime`) dei file.
- **Rendering live nel browser (`npm run dev:web`)**: non eseguito in questa verifica statica e di build (di competenza dei revisori `critico-grafico` e `studente`).

---

## 2. Controlli di conformità architetturale e sicurezza

1. **Zero regressioni su *Teoria delle bande* e sulle Sezioni 1–3 di *Fononi***:
   - Tutte le 8 sezioni di *Teoria delle bande* (`empty-lattice`, `kronig-penney`, `nearly-free`, `tight-binding`, `tight-binding-2d`, `k-dot-p`, `pseudopotential`, `real-bands`) in `src/renderer/src/sections/registry.ts:30-37` risultano intatte e con `component !== null`.
   - Tutte le Sezioni 1–3 di *Fononi* (`phonon-monatomic`, `phonon-diatomic`, `phonon-3d`) restano invariate e funzionanti (`registry.ts:38-40`).
   - La navigazione `HomeScreen` (`src/renderer/src/home/HomeScreen.tsx`) mantiene la griglia regolare a 5 card (2 attive: *Teoria delle bande* `8 sezioni`, *Fononi* `6 sezioni`; 3 *in arrivo*), le anteprime e l'accessibilità da tastiera (`ActiveChapterCard.tsx` con `tabIndex={0}`, `Enter`/`Space`, `aria-label`, `aria-expanded`).
   - `AppShell` (`src/renderer/src/ui/shell.tsx`) mostra ora **4/6 sezioni attive** per *Fononi* e lascia `aria-disabled="true"` sulle 2 sezioni non ancora implementate (`phonon-quantum`, `phonon-specific-heat`).

2. **Isolamento dei layer (`CLAUDE.md`)**:
   - Le nuove funzioni in `src/renderer/src/physics/phononDispersion.ts:925-1417` (`WavepacketRegime`, `wavepacketOmega`, `wavepacketGroupVelocity`, `wavepacketPhaseVelocity`, `wavepacketCurvatureAng2S`, `wavepacketCharacteristics`, `wavepacketDispersionCurve`, `wavepacketWidthAt`, `wavepacketFieldAt`, `wavepacketSnapshot`) sono TypeScript puro senza dipendenze da React, DOM o componenti UI/viz.
   - `src/renderer/src/sections/phonon-wavepacket/` riusa senza modifiche i componenti di `ui/` e `viz/` (`SectionLayout`, `SceneView`, `ParamSlider`, `Panel`, `PresetMenu`, `ToolToggle`, `DispersionPlot`, `LiveFormula`, `PlaybackControls`, `ChartLegend`, `RichText`, `Tex`, `useTweened`, `formatNumber`).
   - Gli stili locali in `src/renderer/src/sections/phonon-wavepacket/phonon-wavepacket.css` utilizzano esclusivamente token CSS di `ui/theme.ts` (`--bg`, `--raised`, `--line`, `--text`, `--muted`), rispettano `prefers-reduced-motion: reduce` e limitano le regole a `.phonon-wp-*` e `.scene:has(.phonon-wp-view)`.
   - Zero dipendenze obbligatorie da Electron nel renderer (`electron.vite.config.ts` conferma la compatibilità browser con `dev:web`).

3. **Tabella `QUANTITIES`, `RichText`, CSP, bundle e dipendenze**:
   - `src/renderer/src/ui/theme.ts` contiene già tutte le grandezze necessarie (`omega`, `omegaOpt`, `u`, `v`, `vp`, `k`, `a`, `psi`, `Ek`), tutte con colori unici verificati da `ui/theme.test.ts` (`2/2` passati). Nessun colore hex o `rgba(...)` hardcoded è stato introdotto in `phonon-wavepacket/`, `home/` o `viz/`.
   - Nessuna sintassi Markdown (`**` o `*`) è presente nei testi passati a `RichText` in `sections/phonon-wavepacket/strings.ts` e nei componenti di `phonon-wavepacket/`.
   - La CSP in `src/renderer/index.html:6-9` (`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:`) è invariata.
   - `package.json` è invariato: nessuna nuova dipendenza aggiunta.
   - Three.js rimane isolato e caricato dinamicamente (`import('three')`) solo in `src/renderer/src/viz/Surface3D.tsx:285` (chunk separato `three.module-X_VS2-6U.js` nella build); `phonon-wavepacket` usa Canvas 2D nativo.

---

## 3. File condivisi toccati e valutazione del rischio conflitto

| File | Modifica effettuata per Sezione 4 | Retrocompatibilità | Rischio conflitto col collega |
|---|---|---|---|
| `src/renderer/src/sections/registry.ts` | Aggiunto `import { PhononWavepacketSection } from './phonon-wavepacket/PhononWavepacketSection'` (riga 20) e collegato `component: PhononWavepacketSection` alla voce `'phonon-wavepacket'` (riga 41). | **Totale** (tutte le 8 sezioni di *Teoria delle bande*, le Sezioni 1–3 di *Fononi* e i gruppi `CHAPTERS`/`ALL_CHAPTERS` sono inalterati). | **Basso** — modifica di sole 2 righe sulla voce dedicata a `phonon-wavepacket`. |
| `src/renderer/src/home/curves.ts` | Importato `wavepacketDispersionCurve` da `../physics` (riga 32) e aggiornato lo slot `s4` (`phonon-wavepacket`, righe 434–464) in `computePhononPreviewCurves()` per calcolare il ramo ottico con `wavepacketDispersionCurve` sullo stesso dominio `[0, π/a]` di `diatomicPreviewFromPhysics`. | **Totale** (`computeRestingCurves` e `computeAllPreviewCurves` di *Teoria delle bande* sono intatti; `home/curves.test.ts` passa `9/9`). | **Basso** — modifica confinata al solo blocco `s4` del capitolo *Fononi*. |
| `src/renderer/src/physics/phononDispersion.ts` | Aggiunta della sezione finale «Pacchetti d'onda» (righe 925–1417), già riesportata automaticamente dal barrel `export * from './phononDispersion'` in `physics/index.ts:18`. | **Totale** (nessuna alterazione alle firme o al comportamento delle funzioni monatomiche/biatomiche esistenti). | **Nullo** — file appartenente al capitolo *Fononi*. |
| `src/renderer/src/physics/phononDispersion.test.ts` | Aggiunto blocco `describe('phononDispersion — pacchetti d’onda: ...')` con 4 test (righe 555–765). | **Totale** (tutti i 18 test preesistenti restano intatti e verdi). | **Nullo** — file di test del capitolo *Fononi*. |
| `src/renderer/src/sections/phonon-wavepacket/*` | 8 nuovi file dedicati alla Sezione 4 (`PhononWavepacketSection.tsx`, `WavepacketView.tsx`, `formulas.ts`, `manifest.ts`, `model.ts`, `store.ts`, `strings.ts`, `phonon-wavepacket.css`). | N/A | **Nullo** — cartella dedicata, nessun file condiviso toccato. |

---

## 4. Problemi trovati (ordinati per gravità)

### Bloccante
Nessuno.

### Importante
Nessuno.

### Minore

1. **Etichetta `values.velocities` passata a `RichText` senza delimitatori `$...$`**
   - **File e riga**: `src/renderer/src/sections/phonon-wavepacket/strings.ts:102` e `src/renderer/src/sections/phonon-wavepacket/PhononWavepacketSection.tsx:462`
   - **Cosa non va e perché**: `velocities: 'Velocità (v_p, v_g)'` viene renderizzato con `<RichText text={v.velocities} />`, ma senza i delimitatori `$...$` attorno a `v_p` e `v_g`, quindi KaTeX non viene invocato e la UI stampa letteralmente gli underscore (`Velocità (v_p, v_g)`).
   - **Come riprodurlo**: aprire la Sezione 4 e osservare l'etichetta `<dt>` nella tabella «Formula viva / valori».
   - **Correzione suggerita**: cambiare in `velocities: 'Velocità ($v_p$, $v_g$)'` (o usare pedici Unicode se preferito come per `σ₀`).

2. **Chiavi inutilizzate in `strings.ts` e `manifest.ts`**
   - **File e riga**: `src/renderer/src/sections/phonon-wavepacket/strings.ts:51` (`spreadTitle`), `:52` (`spreadConst`), `:113` (`characteristicTau`), `:114` (`instantTitle`) e `src/renderer/src/sections/phonon-wavepacket/manifest.ts:56,64,70,76,82` (`shortLabel`).
   - **Cosa non va e perché**: queste proprietà sono definite ma non referenziate in alcun componente o test della sezione. Nessun impatto funzionale o sulla build, ma rimuoverle (o usarle dove previsto) mantiene il codice privo di simboli morti.
   - **Come riprodurlo**: ricerca dei rispettivi identificatori dentro `src/renderer/src/sections/phonon-wavepacket/`.

---

## 5. Dubbi e domande per la regia

Nessuno: l'integrazione di `phonon-wavepacket` rispetta l'architettura multi-capitolo, i confini di `physics/`, la politica colori/tipografia e non introduce regressioni su *Teoria delle bande* né sulle altre sezioni di *Fononi*.

---

## 6. Verdetto finale

**Approvata.** `typecheck` (exit `0`), `test` (**22/22 file, 202/202 test verdi**) e `build` (`electron-vite build`, exit `0`) superati; isolamento di `physics/`, assenza di dipendenze Electron nel renderer, assenza di hex hardcoded e Markdown in `RichText`, CSP invariata, `package.json` invariato e integrità dei file condivisi/proibiti e di *Teoria delle bande* verificati senza problemi bloccanti né importanti (2 rilievi minori documentati).
