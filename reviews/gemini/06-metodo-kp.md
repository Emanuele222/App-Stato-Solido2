# Rapporto — Incarico 06: «Metodo k·p» e ritocco a «Legami forti»

## 1. Cosa hai fatto

### Ritocco a «Legami forti»
- [src/renderer/src/sections/tight-binding/strings.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/tight-binding/strings.ts#L68): rimosse le graffe LaTeX in `compareLegend` (`'quasi liberi (V_{G} = −0,5 eV)'` → `'quasi liberi (V_G = −0,5 eV)'`). La legenda usa testo disegnato su canvas senza parser LaTeX.

### Modulo fisico `physics/kDotP.ts` e test
Creato [src/renderer/src/physics/kDotP.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/kDotP.ts) (esportato da [src/renderer/src/physics/index.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/index.ts#L14)) e la suite [src/renderer/src/physics/kDotP.test.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/kDotP.test.ts):
- **Conversione `P ↔ E_P`**: `kanePFromEp`, `kaneEpFromP` (`E_P = 2m₀P²/ħ²`).
- **Percorso in k centrato su Γ**: `kDotPPath1D(kMax, nPoints = 241)` genera `[-kMax, +kMax]` passando per `Γ = (0, 0, 0)`.
- **Livelli in Γ con/senza spin–orbita**: `spinOrbitGammaLevels(eg, delta)` con Hamiltoniana `H_so` sul tripletto `p` (`J = 3/2` a `0` per `hh`/`lh`, `J = 1/2` a `-Δ` per `so`, baricentro `-Δ/3` conservato) e livello `s` (`J = 1/2`) a `E_g`.
- **Modello di Kane a quattro bande (P4 §3, slide 41)**:
  - `kaneEffectiveMasses`: masse `m_c`, `m_lh`, `m_so`, `m_hh = m₀` positive in unità di `m₀`.
  - `kaneEnergiesAt`, `kaneBands`: energie `so, lh, hh, c` nell’intorno di `Γ` (con `E_hh = -ħ²k²/2m₀` della slide 41) e `kaneConductionFreeParabola` (`E_g + ħ²k²/2m₀`).
  - `kaneMassBreakdown`: scomposizione algebrica di `m₀/m*` col segno di `d²E/dk²` nel termine libero (`±1`, segnalando con `kittelSignFlip` il segno della slide 41 per `hh, lh, so`) più i contributi delle bande accoppiate (`0` per `hh`).
- **Modello esatto 2×2**:
  - `twoBandStateAt`, `twoBandExactBands`, `twoBandParabolicBands`: autovalori `E_±(k) = ħ²k²/2m₀ + E_g/2 ± √(E_g²/4 + P²k²)`, banda `hh` non accoppiata (`|X⟩, |Y⟩` degeneri, `-ħ²k²/2m₀`), criterio parabolico `|P·k| < E_g/2` (`twoBandValidityLimitK`).
  - `twoBandMassBreakdown`: somma di `±1` libero + contributo di accoppiamento locale `±(E_P/E_g)·(1 + 4P²k²/E_g²)^{-3/2}` che mostra `m*` crescere allontanandosi da `Γ`.
- **Verifica sui quasi liberi (P4 §3)**: `planeWaveMomentumElementSq` e `nearlyFreeKpVerification` calcolano `m₀/m*_+ = 17,731` al bordo `k = π/a` per `a = 3,00 Å`, `V_G = -0,50 eV` con 41 onde piane tramite `solveCentralEquation1D`, `inverseEffectiveMassRatio` e `bandCurvature`, confrontandolo con la formula a due bande e con `p = π/a`.

### Sezione interattiva `src/renderer/src/sections/k-dot-p/`
Registrata come `'k-dot-p'` in [src/renderer/src/sections/registry.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/registry.ts#L27):
- [manifest.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/k-dot-p/manifest.ts):
  - **Intervalli dei parametri** (`PARAMS`):
    - `E_g` ∈ `[0,10; 2,50] eV` (passo `0,01`, default `1,43 eV`): copre da gap molto stretti (`InSb = 0,18 eV`) fino a semiconduttori a gap medio-largo senza far divergere il raggio di parabolizzazione `E_g/(2P)`.
    - `Δ` ∈ `[0,00; 1,20] eV` (passo `0,01`, default `0,34 eV`, solo in «Quattro bande (Kane)»): raggiunge `0,00 eV` (limite senza spin–orbita) e copre fino oltre `InSb` (`0,82 eV`).
    - `E_P` ∈ `[0,0; 30,0] eV` (passo `0,5`, default `20,0 eV`): include il limite `E_P = 0` (bande paraboliche libere disaccoppiate), il valore didattico `20 eV` della dispensa P4 §3 e valori reali `20–29 eV`.
  - **Finestra di `k` (`[-0,12; +0,12] Å⁻¹`, `241` punti, passo tastiera `0,005 Å⁻¹`, stato iniziale `0,04 Å⁻¹`)**: in GaAs (`a ≈ 5,65 Å`) il bordo zona in `[100]` è `2π/a ≈ 1,11 Å⁻¹`, quindi `0,12 Å⁻¹` è ~11% della prima BZ — abbastanza stretto da restare «vicino a Γ» dove il metodo `k·p` e la fascia `|P·k| < E_g/2 ≈ 0,082 Å⁻¹` sono significativi, ma abbastanza ampio per vedere il passaggio parabolico → lineare in «Due bande, esatto».
  - **Preset e citazioni esatte in `materiale/parte4/dispensa.tex`**:
    - **GaAs** (default): `E_g = 1,43 eV`, `Δ = 0,34 eV`, `E_P = 20 eV` (r. 784); masse misurate `m_c = 0,067` (r. 785), `m_hh = 0,5`, `m_lh = 0,082`, `m_so = 0,17` (tabella r. 796).
    - **InSb**: `E_g = 0,18 eV`, `Δ = 0,82 eV`, `E_P = 20 eV` (r. 784–785); masse misurate `m_c = 0,0145` (r. 785), `m_hh = 0,39`, `m_lh = 0,021`, `m_so = 0,11` (tabella r. 797).
    - **Ge**: `E_g = 1,10 eV`, `Δ = 0,29 eV`, `E_P = 20 eV` — la dispensa indica `≈ 1,1 eV` per la conduzione in `Γ` (r. 808–809) e `Δ = 0,29 eV`, `m_hh = 0,34`, `m_lh = 0,043` (tabella r. 795), con `m_c(Γ)` e `m_so` assenti; UI e valori mostrano un avviso esplicito che in `Ge` il minimo assoluto della banda di conduzione è in `L` (`0,66 eV`) e questo modello descrive solo l’intorno di `Γ`.
    - **Si escluso intenzionalmente**: in entrambe le dispense (`parte3/dispensa.tex` e `parte4/dispensa.tex`) il Silicio compare con gap indiretto e `Δ = 0,044 eV`, senza un valore numerico per il gap diretto `E_g(Γ)`; per evitare di inventare un numero fuori fonte non compare nei preset (esplicitato nella nota sotto il selettore).
- **Scena collegata a tre viste**: [GammaLevelsCanvas.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/k-dot-p/GammaLevelsCanvas.tsx) (livelli senza/con `H_so`, `J`, `m_J`, conteggi stati e click per cambiare banda), [MassContributionsBar.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/k-dot-p/MassContributionsBar.tsx) (sbarra con segno di `m₀/m*`), [KpBandPlot.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/k-dot-p/KpBandPlot.tsx) (diagramma `E(k)` locale centrato in `Γ`, fascia `|P·k| < E_g/2`, sonda `m*`, `E_F` intrinseco a `T = 0`, confronto sovrapposto).
- **Pannello laterale e strumenti**: [formulas.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/k-dot-p/formulas.ts), [store.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/k-dot-p/store.ts), [model.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/k-dot-p/model.ts), [KDotPSection.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/k-dot-p/KDotPSection.tsx), [strings.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/k-dot-p/strings.ts), [kDotP.css](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/k-dot-p/kDotP.css).

## 2. Cosa hai verificato davvero

### Typecheck, unit test e build (eseguiti dopo l’ultima modifica)
- `export PATH="$PWD/.tools/node/bin:$PATH" && npm run typecheck && npm test && npm run build`: **exit code 0**.
  - `npm run typecheck`: `tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json` — **0 errori**.
  - `npm test` (Vitest v5.1.0): **`13` test file su `13` passati, `101` test su `101` passati** in `1.13 s` (nessun test saltato). Include i **7 test di [kDotP.test.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/kDotP.test.ts)** su:
    - GaAs (`m_c = 0,0710`, `m_lh = 0,0969`, `m_so = 0,2098`, `m_hh = 1,00`, `P = 8,729 eV·Å`);
    - InSb (`m_c = 0,0122`, `m_lh = 0,0135`, `m_so = 0,1306`);
    - limite `Δ → 0` (pesi `2/3` su `lh`, `1/3` su `so`, massa di conduzione `1 + E_P/E_g`, curvatura numerica allineata alla formula);
    - livelli `H_so` (`0` per `J=3/2`, `-Δ` per `J=1/2`, baricentro `-Δ/3`);
    - modello due bande esatto (`E±`, `m*(0)` vs `1 ± E_P/E_g`, crescita di `m*` per `|P·k| > E_g/2`, curvatura numerica);
    - **Verifica sui quasi liberi** (`a = 3,00 Å`, `V_G = -0,50 eV`, 41 onde piane): `m₀/m*₊ = 17,731` allineato tra somma su bande (`n' ≠ n`), derivata seconda numerica e modello a due bande (`p ≈ π/a`).
  - `npm run build` (`electron-vite build`): build completa (`out/main`, `out/preload`, `out/renderer`) senza errori.
  - `grep -rn "Math\." src/renderer/src/sections/k-dot-p/`: nessun calcolo fisico in UI; `Math.` è usato solo per geometria canvas, clamp degli intervalli, approssimazione visiva della parabola osculatrice (`Math.sqrt` dello span su canvas) e arrotondamenti UI.

### Verifiche nel browser su build di anteprima (`vite preview --outDir out/renderer --port 5173`)
Sessione verificata tramite browser reale (`BROWSER_HOST_FACTS`: unica origine `http://127.0.0.1:5173`, `blocked_origins: none`, `console error === 0`, `pageerror === 0`) e ispezione diretta delle schermate finali PNG dopo gli ultimi ritocchi:
- **Regressioni sulle altre sezioni** (`1440×900`):
  - `Reticolo vuoto e schemi di zona`, `Kronig–Penney`, `Elettroni quasi liberi`: apertura e rendering dei canvas senza errori.
  - `Legami forti`: con «Confronto» attivo, la legenda mostra `quasi liberi (V_G = −0,5 eV)` senza parentesi graffe `{G}`.
- **«Metodo k·p» a `1440×900`** (ispezionate visivamente `final_step_32.png`, `final_step_59.png`, `final_step_81.png`):
  - Preset di partenza `GaAs` (`1,43 / 0,34 / 20,0 eV`), `Si` assente dal menu; `Valori vivi` con masse calcolate vs misurate e scheda compatta `Verifica sui quasi liberi` (`17,731`, `p = 1,0477 vs π/a = 1,0472 Å⁻¹`).
  - Variante «Quattro bande (Kane)» con tutti e 3 gli strumenti attivi («Riempimento», «Massa efficace», «Confronto: elettrone libero»): click su `hh` aggiorna `Contributi a m₀/m*` su `-1,00 · nessun contributo di accoppiamento` (`m_hh/m₀ = 1,00`); regressione `Δ = 0,00` seguita da cambio preset (`InSb` → `GaAs`) superata con zero errori console dopo l’aggiunta del clamp in [model.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/k-dot-p/model.ts#L87-L98).
  - Preset `InSb` (strumenti attivi): quota di `E_g` e `E_F` non collidono più; etichette `lh` e `so` al bordo destro ben separate. Preset `Ge`: presente l’avviso su gap indiretto e minimo in `L`.
  - Variante «Due bande, esatto» con tutti e 3 gli strumenti attivi («Confronto: parabole m*»), Δ nascosto dal DOM, `m*/m₀` crescente con `|k|` (`0,0667` in `Γ`, `0,0897` a `0,040`, `0,1704` a `0,083`, `0,2513` a `0,110 Å⁻¹`).
- **«Metodo k·p» a `1100×800`** (Kane, `GaAs`, tutti e 3 gli strumenti attivi, ispezionata visivamente `final_step_92.png`):
  - Tre viste, tre cursori (`E_g`, `Δ`, `E_P`), selettore preset su una riga, formule KaTeX e `E_g` centrata nel gap visibili senza tagli né sovrapposizioni.
- **«Metodo k·p» a `800×600`** («Due bande, esatto», `GaAs`, tutti e 3 gli strumenti attivi, ispezionata visivamente `final_step_102.png`):
  - Nessuna collisione tra `|P·k| < E_g/2 (indicativo)` e la legenda in alto a destra; formule KaTeX integralmente leggibili nell’`aside` da `310 px`; zero scroll orizzontali anomali.
- `manage_task` `list` al termine: nessun processo in background rimasto attivo.

## 3. Cosa non hai potuto verificare
- Non ho avviato il guscio nativo Electron (`npm run dev` / finestra desktop macOS), verificando solo il renderer compilato (`electron-vite build` + `vite preview`).
- Non ho ri-testato manualmente a schermo il drag del cursore lungo `E(k)` in «Due bande, esatto» a `InSb` dopo l’ultima modifica alla soglia di `E_g` (testato prima in Kane/GaAs/InSb e verificato il click/selezione `k` in Due bande).

## 4. Problemi trovati e proposte per componenti condivisi (`ui/`, `viz/`, `theme.ts`)

1. **Importante — `ui/motion.ts` (`useTweened`) può generare valori leggermente fuori intervallo al primo frame**:
   - File e riga: [src/renderer/src/ui/motion.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/ui/motion.ts#L66-L71).
   - Cosa succede: `t0 = performance.now()` precede la chiamata di `requestAnimationFrame((now) => ...)`, dove `now` (timestamp vsync di Chromium) può risultare inferiore a `t0` di fraction di millisecondo, rendendo `u = (now - t0) / duration` negativo (`~ -0,000015`). Partendo da `Δ = 0,00` verso un preset con `Δ > 0`, `easeInOutCubic(u)` produceva `Δ < 0` causando `RangeError` in `physics/kDotP.ts`.
   - Azione adottata: applicato un clamp difensivo `safeParams` ai limiti di `PARAMS` dentro [src/renderer/src/sections/k-dot-p/model.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/k-dot-p/model.ts#L87-L98).
   - Proposta per `ui/motion.ts`: fare `const u = Math.min(1, Math.max(0, (now - t0) / transition.duration))` a monte in `useTweened`.

2. **Minore — Grandezze mancanti in `src/renderer/src/ui/theme.ts`**:
   - Per il metodo `k·p` (`Δ` spin–orbita ed `E_P` / `P` di Kane) ho mappato rispettivamente `psi` (viola) e `v` (ciano) e `VG` (rosso) per `E_g`, invece di aggiungere chiavi in `theme.ts` (bloccato alle regole d’autore).
   - Proposta: valutare l’aggiunta di `Delta` e `EP` (o `PKane`, distinto da `P` di Kronig–Penney) in `QuantityId` per evitare ambiguità cromatiche nella mappa colori globale.

3. **Minore — `viz/BandPlot.tsx` vincolato a `[−π/a, +π/a]`**:
   - File: [src/renderer/src/viz/BandPlot.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/viz/BandPlot.tsx). Disegna sempre i bordi zona `−π/a` / `+π/a`, non supporta una finestra zoomata intorno a `Γ`, la fascia `|P·k| < E_g/2`, né l’indicatore verticale di `Δ`. Per questo «Metodo k·p» usa la vista locale [KpBandPlot.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/k-dot-p/KpBandPlot.tsx); in futuro `BandPlot` potrebbe accettare `kLabels` / `shadedWindow` opzionali.

4. **Minore — `Contributi a m₀/m*` a `800×600` (`final_step_102.png`)**:
   - File: [src/renderer/src/sections/k-dot-p/MassContributionsBar.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/k-dot-p/MassContributionsBar.tsx). Alla minima altezza verticale (`~94 px`), la cifra `0` sotto la tacca dello zero sfiora il bordo inferiore del pannello: resta leggibile, ma alzare di ~4 px il margine inferiore della barra darebbe più respiro su schermi `800×600`.

## 5. Dubbi e domande per la regia
1. Nella formula delle bande di valenza di Kane ([materiale/parte4/dispensa.tex](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/materiale/parte4/dispensa.tex#L779)), la dispensa segnala che la slide 41 (dal Kittel) scrive `-ħ²k²/2m₀` per le valenze (dando `m_hh = m₀ > 0` per le lacune), mentre il modello esatto 2×2 usa `+ħ²k²/2m₀` nell’equazione caratteristica (donde `E_±` di [formulas.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/k-dot-p/formulas.ts#L25-L30) e il segno inverso sulla massa delle bande di valenza in assenza del segno meno Kittel). Ho reso esplicito questo dettaglio sia nella barra dei contributi sia nella scheda teoria: confermate che va mantenuto fedele così alle rispettive fonti della dispensa?
2. Confermate l’esclusione del Silicio dai preset (poiché `dispensa.tex` non riporta `E_g(Γ)` per Si), o preferite aggiungerlo con un valore esplicito approvato dalla regia (e relativa citazione)?
