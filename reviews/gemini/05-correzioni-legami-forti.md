# Rapporto 05 — Correzioni a «Legami forti»

## 1. Cosa hai fatto

Completati tutti e 7 i punti di `incarichi/gemini-05-correzioni-legami-forti.md` entro i soli percorsi consentiti (`src/renderer/src/sections/tight-binding/`, `src/renderer/src/physics/` e `reviews/gemini/`):

1. **Impaginazione `Valori vivi`**: in `src/renderer/src/sections/tight-binding/TightBindingSection.tsx` la tabella dei valori vivi è stata uniformata al pattern `<dl className="values">` (`dt`/`dd`) di `NearlyFreeSection.tsx` e `KronigPenneySection.tsx`, con simboli KaTeX interattivi (`<Tex tex="\htmlData{q=...}{...}" />`) per `t_s`, `W_s`, `Ē_s`, `t_p`, `W_p`, `Ē_p`, `E_A`, `E_B`, `E_-, E_+`, `E_g`, `\Delta E(0)`, `|b_A|^2`, `|b_B|^2`, `m^*/m_0`, `m^*_c/m_0`, `m^*_v/m_0`, `m^*_{p,\text{fondo}}/m_0`, `m^*_{p,\text{cima}}/m_0`, `E_F`, eliminando il testo piano.
2. **Notazione matematica sui canvas**: in `src/renderer/src/sections/tight-binding/model.ts` le etichette dei livelli e del gap utilizzano la sintassi a pedici supportata da `drawMathText` (`Ē_{s}`, `Ē_{p}`, `E_{A}`, `E_{B}`, `E_{g}`, `E_{B} − E_{A}`) al posto di `\bar{E}_s` e `E_B - E_A`.
3. **Collisioni tra pillole su `E(k)`**: in `src/renderer/src/sections/tight-binding/model.ts` e `src/renderer/src/sections/tight-binding/BandExtremumOverlay.tsx`:
   - nella variante monoatomica a `−π/a` le due pillole (`legante` per `p` e `antilegante` per `s`) sono ora ancorate sul lato esterno delle rispettive bande (sopra `p` e sotto `s`) invece che dentro il gap;
   - `BandExtremumOverlay` esegue il controllo di collisione contro legenda confronto, etichette livelli atomici, etichetta gap, linea ed etichetta `E_F`, punto selezionato e curva/etichetta `m*`, spostando la pillola su posizioni candidate o nascondendola se non c'è spazio libero.
4. **Uniformità con le altre sezioni**: in `src/renderer/src/sections/tight-binding/strings.ts` e `TightBindingSection.tsx`:
   - breadcrumb superiore impostato a `Teoria delle bande › Legami forti` (rimosso `Capitolo 1 —`);
   - titolo del diagramma `Diagramma E(k)`;
   - pannello superiore `Formula viva` (che contiene le formule e i `<dl className="values">`) e pannello inferiore `Scheda teoria` con titolo interno `<h3>Da atomi isolati a bande cristalline</h3>`;
   - formule nelle schede teoria e nei suggerimenti rese in KaTeX (`$...$`).
5. **Spazio reale e viewport stretti (`800 px`)**:
   - in `src/renderer/src/sections/tight-binding/TightBindingRealSpace.tsx` rimossa la scritta duplicata dentro il canvas (`forma indicativa (orbitali modello)`), lasciando la didascalia solo nell'header del riquadro;
   - in `src/renderer/src/sections/tight-binding/tightBinding.css` aggiunti minimi strutturali e scroll verticale su `.stage:has(.tb-bands-wrap)` (`overflow-y: auto; grid-template-rows: auto minmax(445px, 1fr) auto`) e `.scene:has(.tb-bands-wrap)` (`grid-template-rows: minmax(185px, 38fr) minmax(260px, 62fr); min-height: 445px`), più `@media (max-width: 960px)` che riduce `.tb-edges-card` a `175px`.
6. **Separazione fisica / UI**:
   - in `src/renderer/src/physics/tightBinding.ts` (e `src/renderer/src/physics/index.ts`) aggiunti `calibrateIndicativeHoppingAtA0`, `kFromZoneFraction` e `blochSiteRealAmplitude` (con `zoneEdge1D` importata da `emptyLattice.ts`);
   - rimossi da `store.ts`, `model.ts` e `TightBindingRealSpace.tsx` tutti i `Math.PI / a`, `Math.cos(k * x)`, `Math.exp((a - a0) / lambda)` e le differenze finite manuali, sostituendoli con gli helper di `physics/`.
7. **Correzioni minori**:
   - in `TightBindingSection.tsx` quando lo stato selezionato in monoatomica è sulla banda `p`, `Valori vivi` mostra la coppia analitica `m^*_{p,\text{fondo}}/m_0` (positivo in `±π/a`) e `m^*_{p,\text{cima}}/m_0` (negativo in `0`) invece di quelli della banda `s`; verificato anche nei test in `src/renderer/src/physics/tightBinding.test.ts` rispetto a `effectiveMassRatio`;
   - in `src/renderer/src/sections/tight-binding/EdgesVsDistancePlot.tsx` ampliato il margine destro (`R = 16`), applicato il clamp al tick `6` (`Math.min(w - 18, X(6))`), allineata l'etichetta `a (Å)` a `w - 4` e reso wrappabile `.tb-edges-caption` in `tightBinding.css`.

## 2. Cosa hai verificato davvero, con i comandi eseguiti e i risultati

1. **Typecheck, test unitari e build dopo l'ultima modifica** (`src/renderer/src/physics/tightBinding.test.ts`):
   - Comando:
     `export PATH="$PWD/.tools/node/bin:$PATH" && npm run typecheck && npm test && npm run build`
   - Risultato osservato: uscita con codice `0`.
     - `tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json`: nessun errore.
     - `vitest run`: `Test Files  12 passed (12)`, `Tests  94 passed (94)` in `1.29s` (inclusi `10/10` test in `src/renderer/src/physics/tightBinding.test.ts`, con verifica numerica di `cosineBandExtremumMassRatio` su banda `s` `±0,4233` e banda `p` `±0,3528` contro `effectiveMassRatio`).
     - `electron-vite build`: completato (`out/main/index.js` `1.21 kB` in `30ms`, `out/preload/index.js` `0.14 kB` in `14ms`, `out/renderer/index.html` e asset in `289ms`).
2. **Audit `Math.*` nella UI della sezione**:
   - Comando: `grep -rn "Math\." src/renderer/src/sections/tight-binding/`
   - Risultato osservato: presenti solo operazioni geometriche/grafiche (`Math.min`, `Math.max`, `Math.abs`, `Math.ceil`, `Math.round`, `Math.sign`, `Math.sqrt`, `2 * Math.PI` per archi ed ellissi canvas); nessuna funzione fisica o trigonometrica di modello nella UI.
3. **Verifica visuale in browser live su `http://127.0.0.1:5173/`** (`npx vite preview --outDir out/renderer --port 5173 --host 127.0.0.1 --strictPort`, `BROWSER_HOST_FACTS: visited_origins: http://127.0.0.1:5173, blocked_origins: none`):
   - **Monoatomica `(s, p)` a `1440×900` con i 3 strumenti attivi** (`step_24_shot_1_monoatomica_1440x900_tools_active.png`): breadcrumb `Teoria delle bande › Legami forti`, `Diagramma E(k)`, pannelli `Formula viva` (`dl.values` KaTeX) e `Scheda teoria`, etichette `Ē_s`, `Ē_p`, `E_g`, 4 pillole esterne senza sovrapposizioni.
   - **Monoatomica `(s, p)` a `1100×800` con i 3 strumenti attivi a `k = 0,54 π/a`** (`step_36_shot_1_monoatomica_1100x800_tools_active.png`): layout ordinato, pillola `legante` in `k = 0` nascosta automaticamente per evitare la sonda `m*`.
   - **Monoatomica `(s, p)` a `800×600` con i 3 strumenti attivi a `k = 0,54 π/a`** (`step_41_shot_1_legami_forti_800x600.png` e `final_step_43.png`): sidebar collassata in menu, Spazio reale con catena, orbitali, `Re ψ_k` e `|ψ_k|²` completamente leggibili, `E(k)` non compresso e colonna `.stage` scorrevole.
   - **Monoatomica banda `p` + «Avvicina gli atomi» a `1440×900` (`k = 0,49 π/a`)** (`final_step_53.png`): in `Valori vivi` la sezione `analitica banda p` mostra `m*_{p,fondo}/m_0 = 0,3528` e `m*_{p,cima}/m_0 = -0,3528`; nel grafico `bordi vs a (modello indicativo)` la scritta `a = 3,00 Å`, i tick `2 3 4 5 6` e l'etichetta `a (Å)` rientrano completamente nella card senza tagli a destra; `antilegante` in `k = 0` viene nascosta in presenza di `m*`.
   - **Biatomica `A–B` a `1440×900` con i 3 strumenti attivi (`k = 0,51 π/a` su `E_+`)** (`final_step_59.png`): valori KaTeX allineati in `dl.values` (`|b_A|^2 = 0,12 · |b_B|^2 = 0,88`, `m*_c/m_0 = 1,152 · m*_v/m_0 = -1,152`, `E_F = 0,00 eV · isolante / semicond.`), pillole `solo B`, `solo A`, `antilegante`, `legante` senza collisioni tra loro, catena biatomica `B`/`A` e onde `Re ψ_k`, `|ψ_k|²` nitide.
4. **Pulizia processi**: il server temporaneo `vite preview` è stato terminato e `manage_task list` ha confermato `No background tasks are currently running`.

## 3. Cosa non hai potuto verificare

- Avvio interattivo dentro il wrapper desktop Electron (verificati il build completo `electron-vite build` e la web app prodotta `out/renderer/` via `vite preview`).
- Screenshot separato con «Avvicina gli atomi» attivo alla larghezza minima `800×600` (la larghezza `800×600` è stata verificata direttamente sugli screenshot nella configurazione standard monoatomica con i 3 strumenti attivi).

## 4. Problemi trovati in ordine di gravità

- **Minore (in `src/renderer/src/viz/BandPlot.tsx`, file condiviso fuori dal perimetro modificabile dall'autore di sezione)**:
  - Nella variante **Biatomica A–B** a `1440×900` con 2 elettroni (`final_step_59.png`), la linea tratteggiata di `E_F = 0,00 eV` attraversa il centro del segmento rosso in `+π/a` sovrapponendosi al testo `E_B − E_A`, perché `BandPlot` disegna l'etichetta del gap sempre al punto medio verticale `(a + b) / 2`.
  - Sempre su `final_step_59.png`, posizionando lo stato a `k = 0,51 π/a` sulla banda `E_+`, l'etichetta `m*` (posizionata da `BandPlot` all'estremo sinistro di `probe.curve`) tocca la curva superiore vicino a `k = 0`. Entrambe le rese dipendono da `viz/BandPlot.tsx`, che per regola di ruolo non è stato modificato.

## 5. Dubbi e domande per la regia

- Nessun dubbio sui 7 punti richiesti dall'incarico. Si segnala soltanto alla regia se in un futuro intervento su `src/renderer/src/viz/BandPlot.tsx` voglia evitare la sovrapposizione tra la linea `E_F` e l'etichetta `gap.label` quando il livello di Fermi coincide con la mezzeria del gap.
