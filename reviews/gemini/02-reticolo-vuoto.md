# Rapporto Incarico Gemini 02 — Sezione «Reticolo vuoto e schemi di zona»

## 1. Cosa hai fatto

Ho implementato la sezione **«Reticolo vuoto e schemi di zona»** (dispensa Parte 3, §§9 e 11.6; Parte 4, §5.1) e l'ho collegata nell'app senza modificare `ui/`, `viz/` o `sections/nearly-free/`.

### File aggiunti o modificati

- **Modulo di fisica** ([physics/](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/emptyLattice.ts)):
  - [emptyLattice.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/emptyLattice.ts): nuove funzioni pure:
    - `foldToFirstZone1D(kExtended, a)` — ripiega $k$ nella prima zona $(-\pi/a, \pi/a]$ tramite $k = k' + G$ con $G = 2\pi n/a$ e determina zona ed indice di banda.
    - `emptyLatticeBranchIndex(kReduced, band, a)` — restituisce l'indice intero $n$ del ramo $G = 2\pi n/a$ corrispondente alla banda `band` in $k'$.
    - `emptyLatticeBranchState1D(kReduced, branchN, a)` — calcola stato esteso, zona, banda ed energia dato $(k', n)$.
    - `emptyLatticeBranchFunction(branchN, a)` — parabola liscia del singolo ramo $n$, usabile con le derivate numeriche di `semiclassical.ts` anche agli incroci.
    - `emptyLatticeCrossings1D(a, count)` — posizioni ed energie degli incroci ($E_0, 4E_0, 9E_0, \dots$).
    - `zoneFoldingSegments1D(a, maxZone)` — tratti della parabola della zona estesa da traslare di $-G$ nella prima zona per zone $1\dots\text{maxZone}$.
    - `planeWaveRealPart1D(kExtended, xs)` e `planeWaveIonPhaseAngle(kReduced, a)` — campionamento di $\operatorname{Re}(e^{i(k'+G)x}) = \cos(k_{\mathrm{est}}x)$ e fase $k'a$ tra ioni adiacenti.
  - [emptyLattice.test.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/emptyLattice.test.ts): 9 test su tutti i casi limite e sui numeri della dispensa (esempio fig. 9.1b $k=1{,}5\pi/a \to k'=-0{,}5\pi/a, n=+1$; esempio P3 §9.3 $a=3\,\text{Å}$: $E_0=4{,}18\,\text{eV}$, $4E_0=16{,}71\,\text{eV}$, $9E_0=37{,}60\,\text{eV}$, $16E_0=66{,}85\,\text{eV}$; invarianza sugli ioni; $m^* = m_0$; metallo e $E_F = E_0$ per 2 elettroni/cella).
  - [index.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/index.ts): esportazione `export * from './emptyLattice'`.

- **Sezione `empty-lattice`** ([sections/empty-lattice/](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/EmptyLatticeSection.tsx)):
  - [manifest.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/manifest.ts): parametro $a \in [2{,}5, 6]\,\text{Å}$ (iniziale $3\,\text{Å}$), finestra fissa $k \in [-3{,}85, 3{,}85]\,\text{Å}^{-1}$ ed $E \in [-1{,}5, 42]\,\text{eV}$, stato iniziale $k = 1{,}5\pi/a$ ($k' = -0{,}5\pi/a, n = +1$).
  - [strings.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/strings.ts): tutte le etichette, valori, e scheda teoria in italiano.
  - [formulas.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/formulas.ts): formule vive $E = \hbar^2(k+G)^2/2m_0$, $G = 2\pi n/a$, periodicità $E(k+G) = E(k)$, zona ridotta $-\pi/a < k \le \pi/a$, $E_0 = \hbar^2\pi^2/2m_0a^2$, $k = k' + G$.
  - [store.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/store.ts): store Zustand con schema (`extended` / `reduced` / `periodic`), stato scelto, strumenti (`fill`, `mass`, `compare`), evidenziazione distinta tra `a` (bordi di zona + passo) e `G` (ramo scelto + vettore di traslazione).
  - [model.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/model.ts): collegamento puro a `physics/` tramite `useMemo`.
  - [EmptyLatticeRealSpace.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/EmptyLatticeRealSpace.tsx): vista locale su `viz/canvas.ts` con gli ioni in $x = n\cdot a$, il passo $a$, il riferimento $|\psi|^2 = 1$, la parte reale $\operatorname{Re}\psi(x) = \cos((k'+G)x)$ e i punti evidenziati sugli ioni per mostrare l'invarianza di $\psi(na)$ al variare di $n$.
  - [ZoneSchemesPlot.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/ZoneSchemesPlot.tsx): diagramma $E(k)$ locale su `viz/canvas.ts` ad assi assoluti con bordi $\pm\pi/a, \pm 2\pi/a, \pm 3\pi/a$, transizione animata continua (cubic ease-in-out) tra zona estesa, ridotta e periodica in cui i singoli tratti della parabola traslano di $-G$ o si replicano di $\pm pG$, badge degli indici $n$ sui rami, collegamento tra $k$ esteso e $k'$ ridotto con freccia $\pm G$, e tutti e tre gli strumenti trasversali (Riempimento, Massa efficace, Confronto con quasi liberi $V_G = -0{,}5\,\text{eV}$).
  - [EmptyLatticeSection.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/EmptyLatticeSection.tsx) e [emptyLattice.css](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/emptyLattice.css).

- **Registrazione**:
  - [registry.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/registry.ts): import di `EmptyLatticeSection` e sostituzione di `component: null` nella voce `empty-lattice`.

---

## 2. Cosa hai verificato davvero

### Controlli automatici (eseguiti dopo l'ultima modifica)
```sh
export PATH="$PWD/.tools/node/bin:$PATH" && npm run typecheck && npm test && npm run build
```
- `npm run typecheck` (`tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json`): **exit code 0**, zero errori.
- `npm test` (`vitest run`): **10 file su 10, 67 test su 67 passati** (durata 883 ms), inclusi i 9 test di `src/renderer/src/physics/emptyLattice.test.ts`.
- `npm run build` (`electron-vite build`): **exit code 0**, bundle generato in `out/main/index.js`, `out/preload/index.js`, `out/renderer/`.

### Verifica visiva e interattiva nel browser (`vite preview` su `out/renderer` a `http://127.0.0.1:5173/`)
1. **Prima dei tre ritocchi finali alle etichette** (stessa logica fisica e layout):
   - Verificato caricamento iniziale, navigazione verso «Reticolo vuoto e schemi di zona», cambio schema `Zona ridotta` → `Zona estesa` → `Zona periodica` → `Zona ridotta`, movimento cursore `a` (`3,00 → 4,50 → 3,00 Å` con aggiornamento di $E_0$, $\pi/a$, spaziatura ioni e bordi di zona), selezione di uno stato sul diagramma $E(k)$, hover sui termini `data-q` delle formule vive, attivazione simultanea dei 3 strumenti e stepper elettroni (`2 → 3 → 2`), alle risoluzioni **1440×900**, **1100×800** e **800×700** (zero overflow orizzontale, drawer hamburger funzionante sotto 1024 px), più ritorno a «Elettroni quasi liberi» con preset Silicio: **0 errori console, 0 errori pagina, 0 richieste fallite**.
2. **Dopo l'ultima modifica** (`strings.ts`, `EmptyLatticeRealSpace.tsx`, `ZoneSchemesPlot.tsx`):
   - Rigenerato il build (`npm run build`) e ispezionato direttamente lo screenshot a **1440×900** con `Zona ridotta` e tutti e 3 gli strumenti attivi: verificata assenza di errori console e risoluzione della troncatura di `Re ψ` e della sovrapposizione tra badge `n=+1` e punto selezionato.

---

## 3. Cosa non hai potuto verificare

- **`npm run dev:web` completo con finestra Electron**: all'interno della sandbox del terminale, il processo Electron di `electron-vite dev --rendererOnly` fallisce all'avvio per permessi negati su `~/Library/Application Support/stato-solido` e sul sandbox GPU di Chromium; la verifica nel browser è quindi stata eseguita servendo il build del renderer (`out/renderer`) con `vite preview`.
- **Nuova passata visiva a 1100×800 e 800×700 dopo gli ultimi 3 ritocchi alle etichette**: i 3 ritocchi riguardano solo dimensioni/posizione delle etichette canvas (`Re ψ`, ancore `n = ±1` e lato dell'etichetta `m* = m₀`), non il layout HTML/CSS; la passata completa multi-risoluzione era stata eseguita subito prima di quei 3 ritocchi.

---

## 4. Problemi trovati e difetti noti lasciati aperti

Nessun problema bloccante o importante rilevato nella sezione consegnata.

### Minori / difetti noti lasciati aperti
1. **Posizione dell'etichetta `m* = m₀` vicino al bordo $-\pi/a$** ([ZoneSchemesPlot.tsx:669-676](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/ZoneSchemesPlot.tsx#L669-L676)): nello stato iniziale ($k' = -0{,}5\,\pi/a$, $n = +1$, strumento Massa efficace attivo), l'etichetta `m* = m₀` all'estremo sinistro della parabola osculatrice sfiora la linea tratteggiata del bordo $-\pi/a$ a $E = E_0$. Resta leggibile grazie al `backdrop`, ma un ancoraggio adattivo lungo l'arco migliorerebbe la pulizia.
2. **Nota a piè della barra laterale** ([strings.ts:11](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/strings.ts#L11)): `shellStrings.footnote` riporta ancora «Prima versione: è attiva la sezione Elettroni quasi liberi.» (file fuori perimetro di questo incarico, non modificato).
3. **Etichette `±2π/a` e `±3π/a` con `a` grande su finestre strette**: per evitare sovrapposizioni sull'asse $k$, quando la spaziatura in pixel tra bordi scende sotto `36 px` (`2π/a`) o `42 px` (`3π/a`) restano visibili le linee tratteggiate verticali ma le etichette testuali secondarie vengono nascoste; solo `±π/a` rimane sempre visibile.

---

## 5. Modifiche proposte a `ui/` e `viz/`

1. **`ui/theme.ts` e `viz/LiveFormula.tsx` — sotto-bersaglio o grandezza dedicata per `G`**:
   Oggi `QUANTITIES` in [theme.ts:34-55](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/ui/theme.ts#L34-L55) associa `G` e `a` allo stesso id `'a'`. Per distinguere l'hover su `G` (ramo scelto) dall'hover su `a` (bordi di zona e passo), nella sezione ho dovuto intercettare `textContent === 'G'` su `[data-q="a"]`. Aggiungere un meccanismo opzionale `subTarget` (o una voce dedicata in `QUANTITIES`) renderebbe questa distinzione dichiarativa in `LiveFormula`.
2. **`viz/BandPlot.tsx` — generalizzazione di `BandPlot`**:
   `BandPlot` supporta oggi solo un array di bande ordinate nella prima zona (`kRange` e `zoneEdge` fissi con un'unica fascia esterna). Per supportare in modo nativo anche gli schemi esteso/periodico (segmenti animati per tratti, più bordi $\pm m\pi/a$, e cambio colore della curva di confronto in `VG`), sarebbe utile estrarre da `ZoneSchemesPlot` le primitive dei tratti multi-zona o aggiungere a `BandPlot` una modalità multi-zona opzionale.
3. **`viz/RealSpaceView.tsx` — supporto opzionale per parte reale/immaginaria di $\psi$**:
   `RealSpaceView` disegna `|ψ|² ≥ 0` e `V(x)`. Nelle sezioni in cui $V = 0$ (reticolo vuoto) o dove serve mostrare il segno/la fase di $\psi$ (anche legami forti per orbitali $s$ e $p$), potrebbe accettare una prop opzionale `waveReal` al posto (o in aggiunta) di `potential`/`density`.

---

## 6. Dubbi e domande per la regia

1. Nell'app, lo schema iniziale di «Reticolo vuoto e schemi di zona» è impostato su **`Zona ridotta`** (così lo studente vede subito il collegamento con «Elettroni quasi liberi» e può aprire `Zona estesa` / `Zona periodica` per animare il dispiegamento/ripetizione, partendo comunque dallo stato $k = 1{,}5\,\pi/a \to k' = -0{,}5\,\pi/a$ di fig. 9.1b). Preferite invece partire da **`Zona estesa`**?
2. Ho scelto assi fissi $k \in [-3{,}85, 3{,}85]\,\text{Å}^{-1}$ ed $E \in [-1{,}5, 42]\,\text{eV}$ in modo che a $a = 3\,\text{Å}$ siano visibili subito tutti e tre gli incroci ($E_0 = 4{,}18\,\text{eV}$, $4E_0 = 16{,}71\,\text{eV}$, $9E_0 = 37{,}60\,\text{eV}$) e tutti i bordi fino a $\pm 3\pi/a$ anche a $a = 2{,}5\,\text{Å}$. Va bene questa scala o preferite una scala in energia più bassa (es. $25\,\text{eV}$)?
