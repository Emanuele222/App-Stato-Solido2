# Rapporto incarico 04 — Correzioni (Parte A) e sezione «Legami forti» (Parte B)

Ruolo: **autore di sezione** (`empty-lattice` e `kronig-penney` per la Parte A, `tight-binding` + `physics/` per la Parte B). Nessuna modifica a `ui/`, `viz/`, `nearly-free/`, `progetto.md`, `CLAUDE.md`, `AGENTS.md`, `incarichi/`, `materiale/`. Nessuna dipendenza nuova, nessun commit, nessun processo lasciato in esecuzione.

---

## 1. Cosa ho fatto

### Parte A — Correzioni dall'incarico 03
1. **`kronig-penney` a 800 px** ([KronigBandsAndConditionPlot.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/kronig-penney/KronigBandsAndConditionPlot.tsx), [KronigPenneySection.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/kronig-penney/KronigPenneySection.tsx)):
   - Quando la larghezza del riquadro `E(k)` scende sotto `640 px`, la legenda compatta viene spostata fuori dalle curve aumentando `topPad` animato.
   - Le etichette di sonda `m*`, livello di Fermi `E_F` e gap `E_{g1}` usano l'elenco `occupiedBoxes` (con pre-registrazione del punto selezionato) per evitare sovrapposizioni.
   - Nei valori vivi, bande con ampiezza `< 10⁻⁴ eV` vengono mostrate come `W < 10⁻⁴ eV`.
2. **Onda su ioni in `empty-lattice`** ([emptyLattice.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/emptyLattice.ts), [emptyLattice.test.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/emptyLattice.test.ts), [EmptyLatticeRealSpace.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/EmptyLatticeRealSpace.tsx#L123)):
   - Spostato il calcolo dell'ampiezza reale sui siti `i·a` nella funzione pura `planeWaveRealPartAtIon(kReduced, a, ionIndex)` in `physics/emptyLattice.ts`, con test unitario sull'invarianza di `Re e^{i(k + nG)·ia} = cos(k·i·a)`, sostituendo `Math.cos(p.kReduced * i * a)` alla riga 123 di `EmptyLatticeRealSpace.tsx`.
3. **Pedice nella legenda confronto di `empty-lattice`** ([strings.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/strings.ts), [ZoneSchemesPlot.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/empty-lattice/ZoneSchemesPlot.tsx)):
   - Aggiornata `compareLegend` a `'quasi liberi (V_{G} = −0,5 eV)'` e aggiunto rendering ricco (`measureRichLegend` / `drawRichLegend`) con `V_{G}` a pedice al posto di `V_G` letterale.

### Parte B — Nuova sezione «Legami forti» (`tight-binding`)

#### Funzioni aggiunte a `physics/`
Esportate da [physics/tightBinding.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/tightBinding.ts) e dal barrel [physics/index.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/index.ts):
- Catena monoatomica (`s`, `p` indipendenti, `t_s > 0`, `t_p = −|t_p| < 0`):
  - `tightBindingBandwidth(t)` (`4|t|`)
  - `monoatomicEnergiesAt(params, k)` (`E_s = Ē_s − 2t_s cos ka`, `E_p = Ē_p + 2|t_p| cos ka`)
  - `monoatomicBandSummary(center, tSigned)`
  - `monoatomicGapAtZoneEdge(params)` (`(Ē_p − Ē_s) − 2(t_s + |t_p|)`)
  - `monoatomicCenterSeparation(params)` (`E_p(0) − E_s(0)`)
  - `cosineBandExtremumMassRatio(tSigned, a, at)` (`±ħ²/(2m₀|t|a²)`)
  - `monoatomicBondingCharacter(band, k, a)`
  - `tightBindingMonoatomicBands(params, path)` (restituisce `BandStructure`)
- Legge indicativa dipendente dalla distanza («Avvicina gli atomi»):
  - `indicativeHoppingAtDistance(a, a0, tAtA0, lambda)` (`t(a) = t(a₀)·e^{−(a−a₀)/λ}`)
  - `monoatomicEdgesVsDistance(aValues, config)`
- Catena biatomica `A–B` (`a`, `A` in `n·a`, `B` in `(n + ½)·a`, `E_A ≤ E_B`, `t > 0`):
  - `diatomicStateAt(params, k)` (`E±` e componenti normalizzate `b_A`, `b̃_B = e^{−ika/2}b_B`, `|b_A|²`, `|b_B|²`)
  - `diatomicGapAtZoneEdge(params)` (`E_B − E_A`)
  - `diatomicCenterSeparation(params)` (`2·√[¼(E_B − E_A)² + 4t²]`)
  - `diatomicExactBandwidth(params)` e `diatomicApproxBandwidth(params)` (`4t²/(E_B − E_A)`)
  - `diatomicGapEffectiveMassRatio(params, band)` (`m*_c/m₀ = −m*_v/m₀ = ħ²(E_B − E_A)/(2m₀t²a²)`)
  - `diatomicBondingCharacter(band, k, params)`
  - `tightBindingDiatomicBands(params, path)` (restituisce `BandStructure`)
- Funzioni d'onda, densità modello e allineamento confronto:
  - `modelOrbitalS(u, sigma)` (gaussiana normalizzata `L²(ℝ)`) e `modelOrbitalP(u, sigma)` (`u·gaussiana` normalizzata `L²(ℝ)`)
  - `monoatomicWaveSamples(a, k, band, xs)` e `diatomicWaveSamples(params, k, band, xs)` (media su cella unitaria normalizzata a `1`)
  - `alignBandStructureBottom(bands, targetBottom)` (traslazione rigida dell'origine per il confronto quasi liberi)

#### Intervalli dei parametri, valori `a₀` e `λ`, e motivazioni
Definiti in [manifest.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/tight-binding/manifest.ts):
- **Catena monoatomica**:
  - `a ∈ [2,00; 6,00] Å` (iniziale `3,00 Å`): copre da passi molto compatti tipici di forte sovrapposizione fino a `6,00 Å`, dove `t(a)` esponenziale scende a ~`2,4%` del valore in `a₀` producendo livelli quasi piatti. Con `kWindow = 1,65 Å⁻¹`, `±π/a` resta dentro la finestra anche a `a = 2,00 Å` (`π/2 = 1,571 Å⁻¹`).
  - `Ē_s ∈ [−12,0; −2,0] eV` (iniziale `−8,0 eV`), `Ē_p ∈ [−6,0; 4,0] eV` (iniziale `−2,0 eV`): riprendono la scala energetica dell'esempio di `verifica_tb_semicl.py` (`Ē_s = −8, Ē_p = −2`), consentendo sia separazione ampia sia incrocio dei centri.
  - `t_s ∈ [0,02; 2,50] eV` (iniziale `1,00 eV`), `|t_p| ∈ [0,02; 2,50] eV` (iniziale `1,20 eV`, con `t_p = −|t_p|`): vanno da bande quasi atomiche (`W = 0,08 eV`) a bande larghe (`W = 10 eV`); già dai centri iniziali (`Ē_p − Ē_s = 6 eV`) al crescere di `t_s, |t_p|` si raggiunge facilmente la sovrapposizione (`E_g(π/a) < 0`). I valori iniziali danno gap positivo `E_g(π/a) = +1,60 eV` come in `verifica_tb_semicl.py`.
- **Legge esponenziale indicativa («Avvicina gli atomi»)**:
  - `a₀ = 3,0 Å` (coerente col passo iniziale della monoatomica) e `λ = 0,8 Å` (lunghezza di decadimento orbitale sub-angstrom tipica dei solidi reali): tra `a = 6,0 Å` (`e^{−3/0,8} ≈ 0,024`) e `a = 2,0 Å` (`e^{+1/0,8} ≈ 3,49`) i parametri `t` variano di oltre due ordini di grandezza mostrando visivamente il passaggio continuo da livelli atomici isolati a bande larghe sovrapposte nel mini-diagramma [EdgesVsDistancePlot.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/tight-binding/EdgesVsDistancePlot.tsx). Alla pressione dell'interruttore `t(a₀)` viene calibrato dal valore corrente di `t_s, |t_p|` per evitare discontinuità.
- **Catena biatomica `A–B`**:
  - `a ∈ [2,50; 7,00] Å` (iniziale `3,50 Å`; distanza `A–B = a/2` fra `1,25` e `3,50 Å`).
  - `E_A ∈ [−6,00; 4,00] eV` (iniziale `−1,50 eV`), `E_B ∈ [−4,00; 6,00] eV` (iniziale `1,50 eV`): gli intervalli si sovrappongono su `[−4; +4] eV` e lo store [store.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/tight-binding/store.ts) garantisce `E_A ≤ E_B` permettendo di raggiungere esattamente `E_A = E_B` da entrambi i cursori.
  - `t ∈ [0,02; 2,50] eV` (iniziale `0,90 eV`): copre il limite atomico (`t ≪ E_B − E_A`, dove si attiva la stima `W ≃ 4t²/(E_B − E_A)`) fino a bande larghe a forte dispersione.

#### Sezione UI, viste e strumenti
Creati in `src/renderer/src/sections/tight-binding/`:
- [TightBindingSection.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/tight-binding/TightBindingSection.tsx), [model.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/tight-binding/model.ts), [formulas.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/tight-binding/formulas.ts), [strings.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/tight-binding/strings.ts), [tightBinding.css](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/tight-binding/tightBinding.css), registrata in [registry.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/registry.ts#L25).
- **Passaggio animato tra varianti**: `useTweened(..., GLIDE)` interpola `variantMix ∈ [0, 1]` fondendo passo `a`, bordi `±π/a`, bande e finestra energetica.
- **Spazio reale locale** ([TightBindingRealSpace.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/tight-binding/TightBindingRealSpace.tsx)): mostra `Re ψ_k(x)`, `|ψ_k(x)|²` (con etichetta esplicita *forma indicativa (orbitali modello)*) e la catena con orbitali `s` (1 lobo), `p` (2 lobi opposti) oppure `A`/`B` (colori distinti ciano/ambra e raggio proporzionale a `|b_A|, |b_B|`); polarità chiaro (`+`) / scuro (`−`) dopo `e^{ikna}`; legami evidenziati in colore `v` (`#5cd0b3`, uguale a `t` in Kronig–Penney) al passaggio su `t`; passo `a` evidenziato al passaggio su `a`.
- **Diagramma `E(k)`**: riusa direttamente `BandPlot` di `viz/BandPlot.tsx` senza modificarlo, affiancato all'overlay trasparente locale [BandExtremumOverlay.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/tight-binding/BandExtremumOverlay.tsx) per le etichette «legante» / «antilegante» (o «solo A» / «solo B») agli estremi `k = 0` e `k = −π/a`.
- **Strumenti trasversali**: `Riempimento` (`1..3` elettroni/atomo in monoatomica, `1..2` in biatomica), `Massa efficace` (confronto sonda vs valori analitici al fondo/cima di `s` o al gap `m*_c, m*_v`), `Confronto: quasi liberi` (`V_G = −0,5 eV`, stesso `a`, con fondo allineato alla banda più bassa e dichiarazione esplicita a schermo e nei valori vivi).

---

## 2. Cosa ho verificato davvero

Eseguito dopo l'ultima modifica su tutti i file finali:
```sh
export PATH="$PWD/.tools/node/bin:$PATH" && npm run typecheck && npm test && npm run build
```
Risultati osservati (exit code `0`):
- `npm run typecheck`: `tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json` completato senza errori.
- `npm test` (Vitest 5.1.0): **12/12 file di test passati, 94/94 test passati** (`1.12s`):
  - inclusi `tightBinding.test.ts` (10/10 test: `W = 4|t|`, `E_s(0)`, `E_p(0)`, `E_g(π/a)` e bande sovrapposte metalliche a 2 elettroni, `m*/m₀ = 0,4233` al fondo `s`, legge indicativa `t(a)`, carattere legante/antilegante opposto fra `s` e `p`, biatomica `E_g = E_B − E_A`, distanza in `k = 0`, `|b_A|² = 0,85` con `E_B − E_A = 4t`, `m*_c = 0,8467 m₀`, limite `E_A = E_B` ripiegato e metallico a 2 elettroni, diagonalizzazione diretta con `eigh` di anello di `N = 12` celle / `24` siti, normalizzazione `L²` di `φ_s, φ_p`, accumulo vs svuotamento al punto medio tra atomi e allineamento fondo banda quasi liberi);
  - inclusi `emptyLattice.test.ts` (12/12 test, incluso `planeWaveRealPartAtIon`), `kronigPenney.test.ts` (14/14 test), `convergence.test.ts` (2/2 test) e tutti gli altri moduli di fisica.
- `npm run build` (`electron-vite build`): generati senza errori `out/main/index.js`, `out/preload/index.js`, `out/renderer/index.html` e bundle JS/CSS (81 moduli client trasformati).

Verifica statica CSS condotta in codice durante il lavoro: individuato e risolto prima della build finale il comportamento di `.view-body canvas` in `src/renderer/src/ui/ui.css` (`position: absolute; inset: 0`), racchiudendo `TightBindingRealSpace` e `EdgesVsDistancePlot` dentro una griglia `.tb-real-split` con contenitori `position: relative` separati ed eliminando elementi HTML extra sopra `.band-canvas`.

---

## 3. Cosa non ho potuto verificare

- **Ispezione visuale e runtime in browser** (1440×900, 1100×800 e 800×700, assenza errori in console, interattività drag/frecce e resa grafica reale di Parte A e Parte B): il subagente browser inviato su `http://127.0.0.1:5173/` è andato in blocco `BLOCKED / ORIGIN_PERMISSION_REQUIRED` dopo 60 s di attesa senza conferma utente nel pannello UI. Non posso quindi garantire l'assenza di piccole sovrapposizioni grafiche (in particolare delle pillole di `BandExtremumOverlay` quando `t` è molto piccolo e le bande sono quasi piatte o sovrapposte, né la resa visiva a 800 px di `Kronig–Penney` dopo i fix della Parte A). Il server di preview è stato spento subito dopo (`manage_task list` vuoto).

---

## 4. Problemi e proposte (per gravità)

### Importanti / da verificare visivamente
- **Posizione pillole `legante` / `antilegante` per bande quasi piatte o `E_A = E_B`**: [BandExtremumOverlay.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/tight-binding/BandExtremumOverlay.tsx) posiziona le etichette a offset fisso `±15 px` sopra/sotto gli estremi in `k = 0` e `k = −π/a`. Se in monoatomica `t_s, |t_p|` sono molto piccoli con centri vicini, oppure in biatomica `E_A = E_B` con chiusura del gap in `−π/a`, le pillole a `−π/a` o i livelli `Ē_s/Ē_p` possono risultare ravvicinati. Andrà verificato dal vivo e rifinito se necessario con un piccolo rilevamento di collisione locale.
- **Larghezza di `.tb-edges-card` a 800 px**: [tightBinding.css](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/tight-binding/tightBinding.css) usa `grid-template-columns: minmax(0, 1fr) 215px` quando «Avvicina gli atomi» è attivo; se su viewport strette (`800 px`) `215 px` lascia la catena un po' compressa, conviene aggiungere un `@media (max-width: 960px)` che riduca la colonna destra a `175 px`.

### Proposte per `ui/` e `viz/` (non modificate in questo incarico)
1. **`viz/BandPlot.tsx`**: aggiungere una prop opzionale `annotations?: readonly { k: number; energy: number; text: string; side?: 'above' | 'below'; tone?: ... }[]` (con partecipazione alle `occupiedBoxes` interne o controllo collisioni con `levels`/`probe`/`fermi`) eliminerebbe la necessità del canvas overlay locale `BandExtremumOverlay` mantenendo il tracking di `anim.eMin`/`anim.eMax` in un solo punto.
2. **`ui/controls.tsx` (`ParamSlider`)**: supportare una prop opzionale `disabled?: boolean` / `linkedHint?: string` consentirebbe di mantenere visibili ma bloccati i cursori `t_s` e `|t_p|` quando «Avvicina gli atomi» li guida da `a`, anziché sostituirli con chip testuali.

---

## 5. Dubbi e domande per la regia

1. **Sovrimpressione `Re ψ_k` e `|ψ_k|²` nello spazio reale**: ho scelto due fasce verticali distinte (`Re ψ_k` in alto attorno allo zero, `|ψ_k|²` al centro ancorata a zero, catena con orbitali sotto) invece di disegnare `Re ψ_k` e `|ψ_k|²` sullo stesso asse, per evitare interferenze visive tra segno oscillante e densità positiva mantenendo l'allineamento verticale atomo per atomo. Preferite mantenerle separate così o sovrapporle sullo stesso asse?
2. **Stato iniziale dei cursori in `Legami forti`**: in monoatomica lo stato selezionato parte da `k = 0`, banda `s` (`legante`, dove si vede subito il massimo costruttivo tra gli atomi); va bene partire da `k = 0` o preferite `k = π/a` come in `nearly-free`?
3. **Verifica visuale in sospeso**: appena l'utente o la regia apre `npm run dev:web`, conviene ispezionare `Kronig–Penney` a 800 px, `Reticolo vuoto` (legenda `V_G`), e `Legami forti` (incluso «Avvicina gli atomi» a 800 px) per validare le spaziature senza timeout di permesso browser.
