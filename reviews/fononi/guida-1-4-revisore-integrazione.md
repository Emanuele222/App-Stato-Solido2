# Revisione di Integrazione Multi-Capitolo — Riallineamento pedagogico Sezioni 1–4 (*Fononi*)

- **Ruolo**: Revisore di Integrazione Multi-Capitolo (`.agents/skills/revisore-integrazione/SKILL.md`)
- **Ambito**: Riallineamento pedagogico delle schede laterali («Guida alla sezione» + `<details className="panel-details">` «Dettagli formali») nelle Sezioni 1–4 di *Fononi* (`phonon-monatomic`, `phonon-diatomic`, `phonon-3d`, `phonon-wavepacket`).
- **Verdetto**: **approvata** (0 problemi bloccanti, 0 problemi importanti, 0 rilievi minori; zero regressioni su *Teoria delle bande* e sull’architettura multi-capitolo).

---

## 1. Cosa è stato verificato, comandi eseguiti ed esiti esatti

### 1.1 Typecheck, Test unitari e Build di produzione

Tutti i comandi sono stati eseguiti in PowerShell anteponendo `.tools\node` al `PATH` (`$env:PATH = "$PWD\.tools\node;$env:PATH"`):

| Verifica | Comando eseguito | Exit code | Esito esatto |
|---|---|---:|---|
| Typecheck | `npm.cmd run typecheck` (`tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json`) | `0` | 0 errori di tipo su `main`, `preload` e `renderer`. |
| Test unitari | `npm.cmd test` (`vitest run`) | `0` | **22 file di test passati (22/22), 202 test passati (202/202)** in `4.11s`: tutti i 16 file di *Teoria delle bande* in `physics/` (`tightBinding2d` 10, `linalg` 10, `kDotP` 10, `kronigPenney` 17, `convergence` 2, `semiclassical` 14, `filling` 7, `pseudoCore1d` 8, `density` 9, `centralEquation1d` 15, `gaps1d` 4, `tightBinding` 10, `freeElectron` 10, `emptyLattice` 12, `bandStructure` 3, `pseudopotential` 13 = 154 test), `home/curves.test.ts` (9), `ui/theme.test.ts` (2), `physics/constants.test.ts` (2), `viz/dispersionPlot.test.ts` (2), `physics/phonon3d.test.ts` (11), `physics/phononDispersion.test.ts` (22). |
| Build di produzione | `npm.cmd run build` (`npm run typecheck && electron-vite build`) | `0` | Compilazione completata senza errori: `out/main/index.js` (`1.21 kB`, 2 moduli), `out/preload/index.js` (`0.14 kB`, 2 moduli), `out/renderer/index.html` (`0.60 kB`), `epmWorker-BCY2_NWm.js` (`25.55 kB`), `index-DpZ6QhAQ.css` (`92.99 kB`), `three.module-X_VS2-6U.js` (`1,907.86 kB`), `index-BWWg4th4.js` (`2,200.40 kB`), **175 moduli trasformati** in `385ms`. |

### 1.2 Stato del repository (`git status`, `git diff --stat` e timestamp)

`git` è stato eseguito tramite il binario portatile di GitHub Desktop (`git status --short` e `git diff --stat` rispetto a `HEAD` = `c7e4db303211e42936ed0d24ade42d0c8d8ffe2d`), incrociato con i `LastWriteTime` su filesystem:

1. **Modifiche del riallineamento pedagogico (`24/11/2026 22:36–22:45`)** — esclusivamente `strings.ts` e `*Section.tsx` nelle 4 sezioni indicate:
   - `src/renderer/src/sections/phonon-monatomic/strings.ts` (`22:36:19`, `+55 / -...`, totale diff `55++/-` su 14 file: `55` righe toccate) e `PhononMonatomicSection.tsx` (`22:36:20`, `19` righe modificate)
   - `src/renderer/src/sections/phonon-diatomic/strings.ts` (`22:36:43`, `55` righe toccate) e `PhononDiatomicSection.tsx` (`22:36:44`, `19` righe modificate)
   - `src/renderer/src/sections/phonon-3d/strings.ts` (`22:37:09`, `62` righe toccate) e `Phonon3DSection.tsx` (`22:37:10`, `+15` righe)
   - `src/renderer/src/sections/phonon-wavepacket/PhononWavepacketSection.tsx` (`22:37:34`) e `strings.ts` (`22:45:56`) (in `git status --short`, la cartella `src/renderer/src/sections/phonon-wavepacket/` risulta ancora `??` perché l’intera Sezione 4 è nel working tree non ancora committato; tutti gli altri 6 file della Sezione 4 hanno timestamp `18:43–18:48`).

2. **Altre modifiche già presenti nel working tree rispetto a `HEAD` (non alterate dal riallineamento, timestamp `24/11/2026 18:33–18:48` o precedenti)**:
   - `M src/renderer/src/physics/phononDispersion.ts` (`+497`, `18:43:39`), `M src/renderer/src/physics/phononDispersion.test.ts` (`+241`, `18:45:37`), `M src/renderer/src/sections/registry.ts` (`3`, `18:33:54`), `M src/renderer/src/home/curves.ts` (`23`, `18:33:56`) — tutti relativi alla precedente integrazione di Sezione 4 già approvata in `reviews/fononi/phonon-wavepacket-revisore-integrazione.md`.
   - `M .agents/rules/fononi.md` (`+6`), `M .agents/skills/fedelta-corso/SKILL.md` (`4`), `M .agents/skills/studente/SKILL.md` (`3`), `M piano-fononi.md` (`12`), `?? crosscheck/fononi/*`, `?? reviews/fononi/phonon-wavepacket-*.md`.

3. **Integrità di file proibiti, `ui/`, `viz/` e *Teoria delle bande***:
   - Nessuna modifica in `src/renderer/src/ui/` (timestamp `22–23/11/2026`), `src/renderer/src/viz/` (`22–23/11/2026`), `src/renderer/src/strings.ts` (`23/11/2026`), `package.json` (`23/11/2026`), `src/renderer/index.html` (`22/11/2026`), `AGENTS.md` (`23/11/2026`), `CLAUDE.md` (`22/11/2026`), `progetto.md` (`23/11/2026`).
   - Nessuna modifica nelle 8 sezioni di *Teoria delle bande* (`empty-lattice`, `kronig-penney`, `nearly-free`, `tight-binding`, `tight-binding-2d`, `k-dot-p`, `pseudopotential`, `real-bands`: tutti i `LastWriteTime` fermi al `22–23/11/2026`).

### 1.3 Colori, CSP, layer, KaTeX / `RichText`

- **Colori hex / `rgba(...)` hardcoded**: scansione `Select-String` su `src/renderer/src/{sections,viz,home}/**/*.{ts,tsx,css}` (esclusi `.test.ts`) restituisce **0 nuove occorrenze**; le uniche due corrispondenze nell’intero codebase sono le preesistenti `src/renderer/src/sections/tight-binding-2d/tightBinding2d.css:84` e l’helper `withAlpha` in `src/renderer/src/viz/canvas.ts:737`.
- **Tabella `QUANTITIES` (`src/renderer/src/ui/theme.ts`)**: tutti i riferimenti `\htmlData{q=...}` nei `strings.ts` delle 4 sezioni fononiche (`a`, `C`, `k`, `m`, `omega`, `omegaOpt`, `psi`, `u`, `v`, `vp`) corrispondono a chiavi valide di `QUANTITIES`; `ui/theme.test.ts` passa `2/2`.
- **Isolamento layer `physics/` e dipendenze Electron**: `Select-String` su `src/renderer/src/physics/*.ts` conferma **0 import** da React, DOM, `ui/`, `viz/`, `sections/` o Electron; `Select-String` su `src/renderer/src/**/*.{ts,tsx}` conferma **0 occorrenze** di `ipcRenderer`, `electronAPI`, `window.api` o `from 'electron'`.
- **CSP e import dinamici**: `src/renderer/index.html:6-9` mantiene invariata la CSP (`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:`). Three.js resta caricato dinamicamente (`import('three')` in `src/renderer/src/viz/Surface3D.tsx:285`, chunk separato `three.module-X_VS2-6U.js`).
- **Stile `.panel-details` e sintassi `RichText`**: tutte e 4 le sezioni riutilizzano la classe `.panel-details` definita in `src/renderer/src/ui/ui.css:635-671` senza modificare `ui/`; `RichText` è applicato uniformemente ai titoli `<h3>` e ai paragrafi `<p>` sia in `theory.blocks` sia in `theory.details.blocks`. Controllo automatico su `phonon-*/strings.ts` conferma **0 sintassi Markdown (`**`)** e **delimitatori `$...$` bilanciati su tutte le righe**.

### 1.4 Cosa non è stato possibile verificare

- **Ispezione visiva live nel browser (`npm run dev:web`)**: non eseguita in questa verifica statica e di build (di competenza dei revisori `critico-grafico` e `studente`).

---

## 2. File condivisi toccati e valutazione del rischio conflitto

| File condiviso | Stato rispetto al riallineamento 1–4 | Rischio conflitto col collega |
|---|---|---|
| `src/renderer/src/ui/*` (`theme.ts`, `ui.css`, `shell.tsx`, ...) | **Non toccato** | **Nullo** |
| `src/renderer/src/viz/*` | **Non toccato** | **Nullo** |
| `src/renderer/src/sections/{empty-lattice,...real-bands}/*` | **Non toccato** | **Nullo** |
| `src/renderer/src/strings.ts`, `package.json`, `index.html`, `AGENTS.md`, `CLAUDE.md`, `progetto.md` | **Non toccato** | **Nullo** |
| `src/renderer/src/sections/registry.ts`, `src/renderer/src/home/curves.ts` | **Non toccati dal riallineamento** (modificati alle `18:33` per registrazione Sezione 4) | **Basso** (righe dedicate a `phonon-wavepacket`) |

---

## 3. Problemi trovati (ordinati per gravità)

### Bloccante
Nessuno.

### Importante
Nessuno.

### Minore
Nessuno.

---

## 4. Dubbi e domande per la regia

Nessuno: il riallineamento pedagogico delle Sezioni 1–4 è confinato ai soli file `strings.ts` e `*Section.tsx` di `phonon-monatomic`, `phonon-diatomic`, `phonon-3d` e `phonon-wavepacket`, non introduce regressioni né su *Teoria delle bande* né sull’infrastruttura condivisa.

---

## 5. Verdetto

**approvata**
