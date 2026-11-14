# Rapporto incarico `gemini-07-pseudopotenziale`

## 1. Cosa ho fatto

### Algebra lineare complessa hermitiana (`src/renderer/src/physics/linalg.ts` e `linalg.test.ts`)
- Implementato il ramo `'complex-hermitian'` in `eigh` (`eighComplexHermitian`) lasciando intatti `checkSymmetric`, `tred2`, `tql2` e `eighRealSymmetric`:
  - tridiagonalizzazione complessa di Householder con accumulo delle trasformazioni unitarie e normalizzazione diagonale tramite fasi unitarie $|\tau_k| = 1$ per ricondurre la matrice tridiagonale hermitiana a forma reale simmetrica;
  - chiamata al risolutore esistente `tql2` per autovalori e autovettori reali della tridiagonale;
  - retro-trasformazione complessa su $Q$ quando `vectors: true`, evitando di costruire $Q$ quando `vectors: false`.
- Sostituito lo stub in `src/renderer/src/physics/linalg.test.ts` con 5 suite di test sul ramo complesso hermitiano (caso analitico $2\times 2$ con $\sigma_y$, matrici aleatorie $28\times 28$ con verifica residuo $H v_n - \lambda_n v_n$ e ortonormalità $V^\dagger V = I$, autovalori degeneri $6\times 6$, coincidenza col ramo reale simmetrico su matrice reale $8\times 8$, errori su matrici $0\times 0$/$1\times 1$/non hermitiane), portando `linalg.test.ts` a 10 test complessivi.

### Motore fisico EPM (`src/renderer/src/physics/pseudopotential.ts`, `index.ts`, `pseudopotential.test.ts`)
- Aggiunte e riesportate da `src/renderer/src/physics/index.ts` le funzioni:
  - `fccReciprocalVectors`, `fccShellCounts`: generazione dei vettori reciproci fcc con $h \equiv k \equiv l \pmod{2}$ (113 vettori per $|G|^2 \le 21$; gusci `0→1, 3→8, 4→6, 8→12, 11→24`).
  - `epmBrillouinPath`: percorso standard $L\text{–}\Gamma\text{–}X\text{–}W\text{–}K\text{–}\Gamma$ (default `40` punti/tratto → 201 punti).
  - `pseudopotentialHamiltonian`: costruzione dell’hamiltoniana locale EPM reale simmetrica (diamante, $V^a = 0$) o complessa hermitiana (zincoblenda, $\tau = \frac{a}{8}(1,1,1)$).
  - `pseudopotentialBands`: calcolo delle prime `numBands` bande (default 8) con traslazione opzionale dello zero sulla cima della banda di valenza.
  - `emptyLatticeFccBands`: confronto con il reticolo vuoto fcc ($V_{\mathrm{ps}} = 0$).
  - `pseudopotentialStateAt`: calcolo dei pesi in onde piane $\sum_{|G|^2 = s} |c_{\mathbf{G}}|^2$ raggruppati per guscio sullo stato $(\mathbf{k}, n)$ selezionato.
  - `epmSegmentDirection`, `epmDirectionalKinematics`: derivata prima e seconda direzionale centrata lungo il tratto corrente per $m^*/m_0$.
  - `analyzeEpmBands`: estrazione di VBM, CBM, gap assoluto (diretto/indiretto), posizione su $\Gamma X$, $E_c(\Gamma/X/L)$, fondo e larghezza della banda di valenza.
  - `bareIonFourierAmplitudeEv`, `thomasFermiZeroLimitEv`, `screenedAshcroftFormFactorCurve`, `realSpacePseudopotentialModel`: stime e curve di modello indicative da P4 §4.
- Creato `src/renderer/src/physics/pseudopotential.test.ts` con parser ZIP+NPY float64 puro TS (`parseUncompressedNpzFloat64`) che confronta direttamente tutte le 8 bande $\times$ 201 punti di `Si` e `GaAs` contro `materiale/parte4/epm_bande.npz`.

### Sezione «Pseudopotenziale» (`src/renderer/src/sections/pseudopotential/` e `registry.ts`)
- `manifest.ts`:
  - Intervalli dei 4 parametri scelti per contenere l’intera tabella di P4 §4 (r. 1105–1113) e gli estremi fisici fino al limite $0$: $a \in [5{,}0;\, 6{,}6]\text{ \AA}$, $V_3^s \in [-0{,}35;\, 0]\text{ Ry}$, $V_8^s \in [-0{,}08;\, 0{,}12]\text{ Ry}$, $V_{11}^s \in [-0{,}05;\, 0{,}15]\text{ Ry}$.
  - Preset: esclusivamente `Si` ($a = 5{,}43\text{ \AA}$, $V^s = -0{,}21, +0{,}04, +0{,}08\text{ Ry}$, gap misurato $1{,}12\text{ eV}$ indiretto) e `GaAs` ($a = 5{,}65\text{ \AA}$, $V^s = -0{,}252, 0, +0{,}08\text{ Ry}$, $V^a = 0{,}068, 0{,}066, 0{,}012\text{ Ry}$, gap misurato $1{,}42\text{ eV}$ diretto, $m^*(\Gamma)$ mis. $0{,}067\,m_0$, $E_P = 20\text{ eV}$) da `materiale/parte4/verifica_bande_reali.py` e P4 §4/§5.4. `Ge` e gli altri composti della tabella restano esclusi perché in `materiale/parte3/dispensa.tex` e `materiale/parte4/dispensa.tex` manca il passo reticolare $a$ del `Ge` e mancano i fattori $V^a$ degli altri composti.
  - Griglie numeriche: calcolo ridotto interattivo `fastGMaxSq = 11` (51 onde piane, così tutti e tre i gusci `3, 8, 11` agiscono subito durante il trascinamento) $\times$ `fastPointsPerSegment = 10` (51 punti ricampionati linearmente sui 201 punti canonici); calcolo completo in Web Worker (`epmWorker.ts`) su `fullGMaxSq = 21` (113 onde piane) $\times$ `fullPointsPerSegment = 40` (201 punti) con cache LRU a 24 voci.
- `store.ts`, `model.ts`, `formulas.ts`, `strings.ts`, `epmWorker.ts`:
  - Toggle `Termine antisimmetrico Vᵃ (zincoblenda)` visibile quando `GaAs` è selezionato (spento: cristallo simmetrico «tipo diamante» con gli stessi fattori $V^s$; mantiene in memoria `Vᵃ` se si riaccende).
  - Tre viste collegate in scena:
    1. *L’idea, nello spazio reale* (`RealSpacePseudoCanvas.tsx`): curve di modello indicative ione nudo vs `Vₚₛ soft core` / `hard core` ($\pm r_c$) e `ψ` oscillante vs `ψᶠ` liscia.
    2. *Fattore di forma v(q)* (`FormFactorCanvas.tsx`): curva indicativa di Ashcroft + Thomas–Fermi da $v(0) = -\frac{2}{3} E_F$ verso $0$, con i 3 parametri reali $V_3^s, V_8^s, V_{11}^s$ trascinabili in verticale e sincronizzati con gli slider e i termini in *Formula viva*; indicatori a rombo per i termini $V^a$ su `GaAs`.
    3. *Bande lungo L–Γ–X–W–K–Γ* (`EpmBandPlot.tsx` + `ShellWeightsBar.tsx`): 4 bande di valenza (verde) e 4 di conduzione (ciano) con zero al VBM, fascia di gap ombreggiata + freccia VBM→CBM (`gap diretto`/`gap indiretto`), selezione interattiva via click/trascinamento/frecce, istogramma dei pesi $|c_{\mathbf{G}}|^2$ per guscio di $|G|^2$, badge «in affinamento…» → «113 onde piane».
  - Strumenti trasversali: *Riempimento* (8 elettroni per cella primitiva, $\mu$ nel gap, nessun contatore degli elettroni), *Massa efficace* (parabola osculatrice direzionale lungo il tratto corrente + confronto per `GaAs` in $\Gamma$ con misurato $0{,}067\,m_0$ e stima $k\cdot p$ $E_g(\Gamma)/E_P$), *Confronto: reticolo vuoto fcc* ($V_{\mathrm{ps}} = 0$ allineato al fondo della valenza).
  - Pannello destro: *Formula viva*, chip interattivi $V_3^s, V_8^s, V_{11}^s$, *Valori vivi*, riquadro *Ione nudo vs pseudopotenziale (Si)* e *Scheda teoria* con avviso esplicito sulla notazione $\psi_c$ (stati di core, non onda stazionaria di «Elettroni quasi liberi»).
- Registrata la sezione in `src/renderer/src/sections/registry.ts`.

## 2. Verifica eseguita

- **Controllo statico, test unitari e build finale** (dopo l’ultima modifica):
  ```sh
  export PATH="$PWD/.tools/node/bin:$PATH" && npm run typecheck && npm test && npm run build
  ```
  - `npm run typecheck` (`tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json`): 0 errori.
  - `npm test`: `Test Files 14 passed (14)`, `Tests 111 passed (111)` (inclusi 10 test in `linalg.test.ts` e 6 test in `pseudopotential.test.ts` con confronto entro $< 10^{-3}\text{ eV}$ su tutte le $8 \times 201$ energie di `Si` e `GaAs` rispetto a `materiale/parte4/epm_bande.npz`).
  - Tempi misurati in `pseudopotential.test.ts` durante l’ultima esecuzione:
    - `Si` completo (`113 × 201`): **1338,4 ms** (in precedenza 958,3 ms a caldo)
    - `GaAs` completo (`113 × 201`): **800,7 ms** (in precedenza 756,6–1089,5 ms)
    - `GaAs` ridotto (`51 × 51`): **34,1 ms** (in precedenza 28,9–37,2 ms)
  - `npm run build` (`electron-vite build`): riuscito; bundle Web Worker emesso come `out/renderer/assets/epmWorker-D5ov2p22.js` (`24.17 kB`).
- **Verifica assenza fisica nei componenti UI**:
  - `grep -rn "Math\." src/renderer/src/sections/pseudopotential/` verifica che `Math.*` è usato solo per coordinate pixel/canvas, clamping dei widget e indici.
- **Verifica su build di produzione nel browser (`npx vite preview --outDir out/renderer --port 5173 --host 127.0.0.1 --strictPort`)**:
  - Confermato caricamento ed esecuzione del Web Worker nella build (non solo dev): transizione da anteprima ridotta a `113 onde piane` in `981–1113 ms` su `Si` e `689–1030 ms` su `GaAs`.
  - Valori osservati a schermo:
    - `Si`: gap indiretto `0,82 eV` a `0,85 ΓX`, fondo valenza `-12,64 eV`, scheda ione nudo `31,51 / 11,82 / 8,59 eV` vs `V^s` `-2,86 / 0,54 / 1,09 eV`.
    - `GaAs`: gap diretto `1,93 eV`, sonda `m*/m₀ = 0,099` in `Γ` con confronto `calc. 0,099 m₀ · mis. 0,067 m₀ · stima k·p E_g/E_P = 0,097 m₀`; toggle `Vᵃ` spento → cristallo «tipo diamante» con gap `1,65 eV`.
    - Strumenti trasversali tutti accesi insieme su `GaAs`, trascinamento verticale di `V₈ˢ` direttamente su `v(q)` (`0,000 → 0,120 Ry`), highlight incrociato chip/curva/slider, navigazione con click e frecce su bande e aggiornamento istogramma pesi per guscio $|G|^2$.
  - Layout e assenza di errori ispezionati su screenshot a `1440×900`, `1100×800` e `800×600`: 0 errori console, 0 errori di rete/worker, 0 `.katex-error`. (Al termine il server `vite preview` è stato terminato e verificato assente con `manage_task list`).
  - Regressione visiva sulle altre 5 sezioni verificata a `1440×900` nella prima passata browser (prima dell’ultimo ritocco locale alla sola `sections/pseudopotential/`, che non tocca file condivisi).

## 3. Cosa non ho potuto verificare

- L’esecuzione dentro il guscio nativo Electron (`electron-vite dev` / app macOS pacchettizzata) non è stata avviata; la verifica runtime UI e Web Worker è stata condotta nel browser sulla build `out/renderer/` servita via `vite preview`.
- Dopo l’ultimo ritocco locale a `ShellWeightsBar.tsx`, `FormFactorCanvas.tsx`, `strings.ts` e `pseudopotential.css`, è stata eseguita una nuova verifica browser mirata su `Pseudopotenziale` (`1440×900` e `800×600`, con 0 errori), mentre la passata di smoke check sulle altre 5 sezioni risale al run browser immediatamente precedente.

## 4. Problemi trovati

Nessun problema residuo noto nella sezione o nei test.

Note fisiche/didattiche rispetto alle dispense:
- **Minore (`bareIonFourierAmplitudeEv` in P4 §4)**: la stima di Ashcroft–Mermin per il Si ($a = 5{,}431\text{ \AA}, Z = 14$) dà esattamente $|V_G| = 31{,}51;\, 11{,}82;\, 8{,}59\text{ eV}$ per $|G|^2 = 3, 8, 11$, valori arrotondati nel testo di P4 §4 a `~31, 12, 9 eV`; la scheda in app mostra i valori esatti a 2 decimali.
- **Minore (`GaAs` in $\Gamma$ e massa `k·p` in P4 §4 vs §3)**: in P4 §4 (r. 1201) il gap diretto del modello locale EPM del GaAs è $\sim 1{,}9\text{ eV}$ ($1{,}93\text{ eV}$ esatto con $V^s, V^a$ di `verifica_bande_reali.py`) e la stima $E_g(\Gamma)/E_P \approx 1{,}93/20 \approx 0{,}097\,m_0$ (a fronte della curvatura locale EPM $0{,}099\,m_0$ e del valore sperimentale $0{,}067\,m_0$), diversa dal gap sperimentale `1,42–1,43 eV` usato nella sezione *Metodo k·p*.

## 5. Dubbi, proposte per `ui/` e `viz/` e domande per la regia

- **Proposta per `ui/ui.css` (`.view-body canvas`)**: attualmente `.view-body canvas` imposta `position: absolute; inset: 0;` senza limitazione ai figli diretti (`.view-body > canvas`). Quando una vista ospita più canvas sovrapposti o impilati in griglia (es. diagramma + istogramma pesi in `pseudopotential`), ogni `<canvas>` richiede un contenitore con `position: relative` esplicito; passare a `.view-body > canvas` eviterebbe sovrapposizioni inattese.
- **Proposta per `viz/canvas.ts` (`drawMathText`)**: `parseRuns` supporta i pedici `_{...}` ma non gli apici `^{...}` (es. $V_3^s$, $V_{\mathrm{ps}}$); al momento i grafici su canvas aggirano il limite con caratteri Unicode in apice/pedice (`ˢ`, `ₚₛ`, `ᶠ`). Aggiungere un piccolo supporto a `^{...}` in `drawMathText` uniformerebbe tutti i canvas.
- **Domanda per la regia**: il modello di spazio reale ($V(r)$ vs $V_{\mathrm{ps}}$, $\psi$ vs $\psi^{\mathrm f}$) è volutamente statico/indicativo con avviso esplicito; si desidera in una futura revisione legarne visivamente l’ampiezza o l’offset a $V_3^s$, oppure è preferibile mantenerlo del tutto indipendente come figura concettuale da P4 fig. 4.1a?
