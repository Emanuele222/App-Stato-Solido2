# Rapporto incarico 03 — Correzioni a «Reticolo vuoto» e sezione «Kronig–Penney»

Ruolo svolto: **autore di sezione** su [empty-lattice](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice), [kronig-penney](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/kronig-penney), [physics](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics) e riga 22 di [registry.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/registry.ts#L22). Nessun file di `ui/`, `viz/`, `sections/nearly-free/` o dell’area protetta è stato modificato; nessuna dipendenza aggiunta; nessun commit.

---

## 1. Cosa hai fatto

### Parte A — Correzioni a «Reticolo vuoto e schemi di zona»

1. **Schema iniziale a zona estesa (`k = 1,5 π/a`)**: in [store.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/store.ts#L49) `scheme` parte da `'extended'` (stato iniziale `kFracReduced = -0,5`, `branchN = +1` ⇒ `k = 1,5 π/a`, documentato in [manifest.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/manifest.ts#L44-L45)).
2. **Finestra in energia e $k$ adattiva su `a`**: in [manifest.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/manifest.ts#L54-L57) e [model.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/model.ts#L107) la finestra energia scala come `[−0,035·E_max, 11·E₀(a)]` e `kRange` come `±3,85·√(2,5/a)` sui parametri tweened, così gli incroci `E₀`, `4E₀`, `9E₀` restano ben leggibili da `a = 2,5 Å` (`E_max = 66,2 eV`) ad `a = 6 Å` (`E_max = 11,5 eV`) seguendo l’animazione del cursore.
3. **Fisica spostata in `physics/`**:
   - In [emptyLattice.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/emptyLattice.ts#L211-L246) aggiunte `zoneEdge1D(a)`, `freeElectronWaveNumber(energy)` e `branchCoordinates1D(kExtended, a, maxBranchN)` (esportate da [index.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/index.ts#L11)), coperte da test unitari in [emptyLattice.test.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/emptyLattice.test.ts).
   - Sostituiti `Math.PI / a`, il ripiegamento manuale in [store.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/store.ts#L9-L97), [model.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/model.ts#L23-L82) e `Math.sqrt(e1 / HBAR2_OVER_2M0)` in [ZoneSchemesPlot.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/ZoneSchemesPlot.tsx#L15-L820).
4. **Anti-collisione etichette a 800 px**: in [ZoneSchemesPlot.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/ZoneSchemesPlot.tsx#L289-L760) raccolta una lista di ingombri (`occupied`) per punto selezionato, pallini fantasma, legenda, etichetta `m* = m₀`, livello `E_F` ed etichette già disegnate; i contrassegni di ramo (`n = +1`, …) vengono posizionati per ultimi scegliendo un punto libero lungo il ramo.

### Parte B — Sezione «Kronig–Penney»

- **Modulo fisico puro** in [kronigPenney.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/kronigPenney.ts) e test in [kronigPenney.test.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/kronigPenney.test.ts) (esportato da [index.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/index.ts#L12)):
  - *Tipi e helper*: `KronigPenneySpec`, `FiniteWellLevel`, `KronigBandEdge`, `KronigGap`, `CosineBandApprox`, `LCurveSample`, `kronigPenneyPeriod`, `deltaPotentialScaleV0`, `kronigBarrierStrength`, `kronigEffectiveP`.
  - *Condizione trascendente esatta*: `kronigPenneyDeltaL`, `kronigPenneyRectangularL`, `kronigPenneyL` (continua attraverso `E = V₀` mediante funzioni `sinc`/`sinhc` e prolungamento analitico `β → iβ'` per `E > V₀`).
  - *Livelli della buca finita isolata*: `finiteWellLevels1D(b, v0)` (forma senza poli `g_even`/`g_odd` che riproduce `ρ = 2,56`, `0,191 eV` pari, `0,703 eV` dispari e soglia `6,13 Å` dell’esercizio E7).
  - *Bande, gap e inversione*: `kronigPenneyDeltaBandEdges`, `kronigPenneyRectangularBandEdges` (campionamento multi-scala diadico attorno ai livelli della buca isolata per non mancare bande strettissime con tunnel $W \sim 10^{-11}\,\text{eV}$), `kronigPenneyBandEdges`, `kronigPenneyGaps`, `kronigPenneyEnergyAt`, `kronigPenneyBandFunction`, `kronigPenneyBands` (produce direttamente `BandStructure`), `sampleKronigConditionCurve`, `kronigPenneyStateFromEnergy`.
  - *Bande a coseno ed elettrostatica/densità esatta*: `kronigPenneyCosineApproximation` (`Ē ∓ 2t·cos ka`, `W = 4t`, `m*_min = ħ²/(2ta²)`), `kronigPenneyDensity1D` (matrice di trasferimento `2×2` con ioni centrati in `x = n·a` e barriere in `(n + ½)a`).
- **Intervalli dei parametri** in [manifest.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/kronig-penney/manifest.ts#L26-L42):
  - *Variante a delta*: `a ∈ [2,5; 6,0] Å` (iniziale `3,00 Å`, coerente con E8 `a = 3 Å` e con l’intervallo cristallino delle altre due sezioni), `P ∈ [0; 30]` (iniziale `2,00` da fig. 10.2; `0` riproduce il reticolo vuoto; copre l’esempio E8 `P = 3π/2 ≈ 4,71`; fino a `30` per schiacciare le bande verso la buca infinita `αa = nπ`).
  - *Variante a barriere rettangolari*: `b ∈ [1,5; 8,0] Å` (iniziale `4,50 Å`), `c ∈ [0,05; 5,0] Å` (iniziale `1,00 Å`, `0,05` raggiunge visivamente il limite a delta per `c → 0`), `V₀ ∈ [0; 30] eV` (iniziale `10,0 eV`; `0` restituisce il reticolo vuoto; con `b = 4,5 Å, V₀ = 10 eV` entrano 3 livelli genitori sotto `V₀` lasciando vedere bene sia i livelli legati sia le bande sopra `V₀`). Periodo risultante `a = b + c` mostrato in pillola dedicata.
- **Gestione del ricalcolo ai cursori**: in [model.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/kronig-penney/model.ts#L105-L250) le due varianti hanno memoizzazioni indipendenti (`useVariantModel` su `deltaSpec` e `rectSpec`). Trascinando un cursore si ricalcola solo la variante attiva (~`< 1 ms`, 5 bande su 201 punti in `k`); al cambio variante entrambi i modelli sono già pronti e la transizione è un morfismo puramente su Canvas (`Smoothed` in [KronigRealSpace.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/kronig-penney/KronigRealSpace.tsx) e [KronigBandsAndConditionPlot.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/kronig-penney/KronigBandsAndConditionPlot.tsx)) senza ricalcoli per fotogramma.
- **Scena, formula, strumenti e teoria**:
  - [KronigRealSpace.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/kronig-penney/KronigRealSpace.tsx): buche centrate sugli ioni in `x = n·a`, picchi a delta o barriere `c × V₀` con quote `a, b, c`, densità esatta `|ψ|²` (media 1) e morfismo continuo fra le due varianti.
  - [KronigBandsAndConditionPlot.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/kronig-penney/KronigBandsAndConditionPlot.tsx): `L(E)` (`[-1, +1]` evidenziato) ed `E(k)` affiancati con identico asse dell’energia, tacche dei livelli genitori `E_1, E_2, …` collegate alle bande, proiezione orizzontale sullo stato scelto, picking su entrambi i grafici (clic/trascinamento su `E(k)` o su `L(E)` tramite `kronigPenneyStateFromEnergy`) e frecce da tastiera.
  - [formulas.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/kronig-penney/formulas.ts), [strings.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/kronig-penney/strings.ts), [store.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/kronig-penney/store.ts), [KronigPenneySection.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/kronig-penney/KronigPenneySection.tsx), [kronigPenney.css](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/kronig-penney/kronigPenney.css): formula viva, strumenti `Riempimento` (`1…4` el./cella), `Massa efficace` (confronto fra `m*` esatta, `m*_cos` locale e `ħ²/(2ta²)` al fondo banda), `Banda a coseno` (`t, W = 4t`) e `Confronto: reticolo vuoto`, scheda teoria in italiano dal §10 (con distinzione esplicita tra `P` opacità della delta e parametro `P` del metodo `k·p`).
  - Registrazione della voce `'kronig-penney'` in [registry.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/registry.ts#L11-L22).

---

## 2. Cosa hai verificato davvero, con comandi e risultati

Tutti i controlli statici e i test Vitest sono stati eseguiti **dopo l’ultima modifica** (`export PATH="$PWD/.tools/node/bin:$PATH"`):

1. **Typecheck + Test + Build** (`npm run typecheck && npm test && npm run build`):
   - `tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json`: **exit 0**, 0 errori.
   - `vitest run`: **11/11 file di test passati, 84/84 test passati** (`bandStructure`: 3, `centralEquation1d`: 14, `convergence`: 2, `density`: 9, `emptyLattice`: 12, `filling`: 6, `freeElectron`: 8, `gaps1d`: 4, `kronigPenney`: 14, `linalg`: 6, `semiclassical`: 6).
   - `electron-vite build`: **exit 0** (`out/main/index.js`, `out/preload/index.js`, `out/renderer/` generati senza errori).
2. **Verifica nel browser (build servita con `vite preview` su `http://127.0.0.1:5173/`)**:
   - *Parte A («Reticolo vuoto e schemi di zona»)*: verificata via subagent browser + ispezione diretta screenshot a `1440×900`, `1100×800` e `800×700` (schema iniziale `'extended'`, cursori `a = 2,50…6,00 Å` con scala adattiva di `E₀, 4E₀, 9E₀`, `'reduced'` e `'periodic'` con `Riempimento`, `Massa efficace` e `Confronto` attivi; 0 errori console, 0 sovrapposizioni delle etichette).
   - *Parte B («Kronig–Penney») ed «Elettroni quasi liberi»*: verificata al penultimo build (immediatamente prima del solo accorciamento su due righe di `MAIN_FORMULA_RECT` in [formulas.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/kronig-penney/formulas.ts#L14)) via subagent browser e lettura diretta delle immagini catturate (`step_245_shot_1_kp_rect_fixed_1440.png` a `1440×900` e `step_278_shot_1_kp_rect_fixed_800.png` a `800×700`):
     - Entrambe le varianti (`A delta` e `Barriere rettangolari`), picking bidirezionale su `E(k)` e su `L(E)`, cursore `c`/`V₀`, pill `a = b + c`, tutti e 4 gli strumenti attivi, stepper, livelli genitori `E₁, E₂, E₃`, griglia `.values` a due colonne, pedici su canvas (`V₀`, `E₁…E₃`), zero overflow orizzontale (`scrollWidth === innerWidth` a `1440`, `1100` e `800 px`), funzionamento di «Elettroni quasi liberi» e «Reticolo vuoto», **0 errori console / pagina / rete**.

---

## 3. Cosa non hai potuto verificare

- **Avvio della finestra Electron (`npm run dev:web` / Electron desktop)**: la sandbox blocca la scrittura in `~/Library/Application Support/stato-solido`, quindi l’UI è stata ispezionata su Chromium via `vite preview` di `out/renderer`.
- **Verifica visiva nel browser dopo l’ultimo edit di `formulas.ts`**: al terzo ricaricamento di verifica (dopo aver spezzato su due righe `MAIN_FORMULA_RECT` con `\begin{aligned}` in [formulas.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/kronig-penney/formulas.ts#L14)), il prompt di autorizzazione sull’origine `127.0.0.1:5173` è scaduto dopo 60 s (`ORIGIN_PERMISSION_REQUIRED`); per attenermi alle regole non ho ritentato. `typecheck`, `npm test` (84/84) e `npm run build` sono comunque stati rieseguiti **dopo** quella modifica e hanno avuto esito positivo.

---

## 4. Problemi trovati / difetti noti

1. **Minore (non verificato visivamente dopo la correzione)**: [formulas.ts#L14](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/kronig-penney/formulas.ts#L14) — prima dell’ultimo edit, `MAIN_FORMULA_RECT` su una sola riga veniva tagliata a destra (`= \cos` / `= \cos k`) nella colonna `.aside` (sia a `1440` sia a `800 px`). È stata spezzata con `\begin{aligned}...\end{aligned}` su due righe per rientrare nella larghezza della colonna, ma lo screenshot finale dopo questo edit non è stato scattato per il timeout dell’origine.
2. **Minore (presente solo in casi combinati estremi)**: a `800 px`, se lo stato scelto cade in alto a destra sulla banda 3 (`E ≈ 10 eV`) con `Banda a coseno` e `Confronto: reticolo vuoto` entrambi attivi, il cerchietto di selezione può trovarsi sotto l’etichetta della legenda in alto a destra (ridotta usando etichette brevi `"Kronig–Penney"` e `"reticolo vuoto"` in [strings.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/kronig-penney/strings.ts#L60-L62)).

---

## 5. Proposte per `ui/` e `viz/` e domande per la regia

### Proposte per `ui/` e `viz/` (viste locali attualmente tenute in `sections/kronig-penney/`)
- **Segmento/pillole di variante (`kp-variant-switch`)**: in [emptyLattice.css](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/emptyLattice.css) (`scheme-switch`) e [kronigPenney.css](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/kronig-penney/kronigPenney.css) (`kp-variant-switch`) lo switch a pillola è ora duplicato localmente. Promuoverlo a controllo riusabile `SegmentedSwitch` in `ui/controls.tsx` eliminerebbe il CSS ripetuto.
- **Sottopannelli collegati in `viz/`**: `KronigBandsAndConditionPlot` nasce come vista locale perché `BandPlot.tsx` gestisce un solo riquadro `E(k)`. Condividere un supporto comune per gli assi condivisi (o un’estensione opzionale di `BandPlot` per un pannello ausiliario sull’asse `E`) faciliterebbe eventuali future sezioni con grafici affiancati.
- **Highlight granulare su grandezze omonime (`b`/`c` vs `a`, `L(E)` vs `E`)**: si ribadisce la proposta già segnalata in Parte A di estendere `ui/katex.ts` e `theme.ts` (o aggiungere un attributo ausiliario oltre a `data-q`) così che le parti non debbano distinguersi leggendo `textContent`.

### Domande per la regia
1. Per le bande con barriere rettangolari molto spesse e alte (`c → 5 Å`, `V₀ = 30 eV`), quando la larghezza di banda `W` scende sotto `10⁻⁴ eV`, la sezione mostra `W` con `formatSignificant(..., 3)` e continua a disegnare correttamente la banda appiattita sul livello genitore: va bene mostrare anche bande ultra-strette in eV con notazione compatta, o preferite un limite inferiore visivo (`W < …`)?
2. Confermate se la traduzione grafica a due righe di `MAIN_FORMULA_RECT` (`\begin{aligned}`) è visivamente soddisfacente su Desktop Electron al prossimo giro di verifica.
