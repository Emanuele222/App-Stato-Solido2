# Rapporto incarico Gemini 09 — correzioni di fisica e di contenuto

## 1. Cosa ho fatto

Ho eseguito i punti `1`–`28` e `30`–`31` di `incarichi/gemini-09-correzioni-fisica-e-contenuti.md` rispettando i falsi allarmi elencati nell'incarico e i vincoli di `AGENTS.md` (nessuna modifica a `ui/` eccetto `src/renderer/src/ui/format.ts`, nessuna modifica a `viz/`, CSS, `App.tsx`, `registry.ts`, `home/` o `materiale/`). Sul punto `29` (preset **Ge**) mi sono fermato come richiesto dall'incarico perché il calcolo completo EPM con i parametri delle dispense contraddice il carattere indiretto in `L` dichiarato da `P4 r. 807–809`.

### Interventi principali in `src/renderer/src/physics/` e `src/renderer/src/ui/format.ts`
- `src/renderer/src/physics/filling.ts`: `fillBands` (quando `N % 2 === 0`) ordina le bande per massimo crescente anziché assumere che la banda `N/2 - 1` stia sotto `N/2`, identificando un isolante ogni volta che `min(upperBand) - max(lowerBand) > tol`; nuovo test in `src/renderer/src/physics/filling.test.ts` (catena monoatomica invertita `Ē_s = -2`, `Ē_p = -6`, `t_s = |t_p| = 0,4`, `a = 3,5`, `N = 2` → isolante, gap `2,4 eV`, `E_F = -4,0 eV`, occupazioni `[0, 1]`).
- `src/renderer/src/physics/semiclassical.ts` e `src/renderer/src/ui/format.ts`: aggiunti `EFFECTIVE_MASS_DIVERGENCE_THRESHOLD = 1e4`, `isEffectiveMassDivergent(massRatio)`, `curvatureFromInverseMassRatio(invMassRatio)` e il formattatore unico `formatEffectiveMassRatio(massRatio, options)` con `DIVERGENT_EFFECTIVE_MASS_TEXT = '→ ∞ (flesso)'`.
- `src/renderer/src/physics/constants.ts`: aggiunto `rydbergToEv(energyRy)`.
- `src/renderer/src/physics/centralEquation1d.ts`: aggiunti `twoWaveGap`, `weakPotentialRatio`, `twoWaveEdgeMassRatio` e `dominantPlaneWaves1D`.
- `src/renderer/src/physics/kDotP.ts`: aggiunto `intrinsicFermiLevel(eg)`.
- `src/renderer/src/physics/pseudopotential.ts`: aggiunti `pseudopotentialChemicalPotential(summary)`, `kpGammaMassEstimate(egGammaEv, epEv)` ed `epmSegmentLabel(path, pointIndex)`.
- `src/renderer/src/physics/tightBinding.ts` (e `tightBinding.test.ts`): rinominato il parametro/campo `lambda` in `ell` nella legge indicativa `t(a)`.
- `src/renderer/src/physics/linalg.ts`: aggiornato il commento di intestazione per includere il ramo hermitiano complesso `eighComplexHermitian`.
- Test aggiunti in `filling.test.ts`, `semiclassical.test.ts`, `kDotP.test.ts`, `kronigPenney.test.ts`, `centralEquation1d.test.ts` e `pseudopotential.test.ts`.

### Interventi nelle sei sezioni (`src/renderer/src/sections/*/`)
- `empty-lattice/` (`formulas.ts`, `manifest.ts`, `model.ts`, `strings.ts`, `EmptyLatticeSection.tsx`): convenzione unica `k` esteso / `k'` ridotto con `ψ_{n,k+G} = ψ_{n,k}` e `E_k = ħ²k²/2m₀`; parametri indicativi di confronto resi leggibili (`compareVG: -2.2`, `compareV2G: -1.4`) e dichiarati a schermo; `eMax` adattato allo stato selezionato (`n = -2` resta in scala); rimosso testo duplicato in `fermiTwoNote`; `EmptyLatticeSection.tsx` allineato a `formatEffectiveMassRatio`.
- `kronig-penney/` (`formulas.ts`, `strings.ts`, `KronigPenneySection.tsx`): unificato `f(αa)` nel caso a delta dichiarando `L(E) = f(αa)` e il significato di `aV₀` / `V₀`; aggiunto `P_eff = m₀ a V₀ c / ħ²` e `W ∝ e^{-βc}`; introdotto `cosineFormulaForBand` per il segno effettivo `−` (bande dispari) / `+` (bande pari); adottato `formatEffectiveMassRatio` nei tre campi di massa efficace.
- `nearly-free/` (`manifest.ts`, `store.ts`, `formulas.ts`, `model.ts`, `strings.ts`, `NearlyFreeSection.tsx`): preset Ge `0.66 eV` e Diamante `5.5 eV` con azzeramento di `v2G: 0` alla selezione; `zoneEdge1D(a)`, `twoWaveGap`, `weakPotentialRatio` e `dominantPlaneWaves1D` da `physics/`; formula `m₀/m*_± = 1 ± 2E₀/|V_G|`; equazione centrale e stima perturbativa in teoria + top-3 pesi `|c_G|²` nei valori (`50,0 %` e `50,0 %` a `±π/a`); distinzione esplicita tra «formula a due onde» e «calcolo completo (11 onde piane)»; nota per il gap di secondo ordine in `k = 0` («secondo ordine, non visibile a questa scala») e marcatura della nota `≃ V_G²/2E₀` come oltre l'approssimazione a due onde; rimozione del ramo `massZero` e passaggio a `formatEffectiveMassRatio`.
- `tight-binding/` (`manifest.ts`, `formulas.ts`, `model.ts`, `store.ts`, `strings.ts`, `TightBindingSection.tsx`): legge indicativa `t(a)` rinominata da `lambda` a `ell` con badge a schermo `$a_0 = 3 Å$, $\ell = 0,8 Å$`; aggiunti stato di Bloch biatomico con `b_A, b_B` e sviluppo `E_± ≃ E_{B,A} ± W cos²(ka/2)` in `DIATOMIC_DEFINITIONS`; sostituito il controllo locale `1e4` in `TightBindingSection.tsx` con `formatEffectiveMassRatio`.
- `k-dot-p/` (`formulas.ts`, `model.ts`, `strings.ts`, `GammaLevelsCanvas.tsx`, `MassContributionsBar.tsx`, `KDotPSection.tsx`): corrette le dispersioni paraboliche di `E_c`/`E_lh` e aggiunte `E_lh` e `E_{|X⟩,|Y⟩} = ħ²k²/2m₀`; rimossi i rimandi `(slide 41)` dai testi visibili; aggiunta introduzione a «Verifica sui quasi liberi» e rimossa la stringa inutilizzata `verification.minusLabel`; rimossa l'etichetta `m_J = ±½` in variante Due bande su `GammaLevelsCanvas.tsx`; mostrata la massa di lacuna positiva `m_{lh}/m₀ = -m*_{lh}/m₀` e la riga sugli stati `|X⟩, |Y⟩` in `KDotPSection.tsx`; usati `intrinsicFermiLevel`, `twoBandMassBreakdown` e `curvatureFromInverseMassRatio` al posto delle formule inline e dei controlli `Number.isFinite` locali.
- `pseudopotential/` (`manifest.ts`, `formulas.ts`, `model.ts`, `strings.ts`, `EpmBandPlot.tsx`, `PseudopotentialSection.tsx`): `fastPointsPerSegment` portato a `20` (101 punti ricampionati 2:1 sul cammino a 201 punti); aggiunti `isProvisional`, `segmentLabel`, `formFactorsEv`, `kpGammaMassEstimate`, `rydbergToEv(-0.211)` per `BareIonCard`, e `pseudopotentialChemicalPotential` (omette `μ` sul grafico e mostra messaggio metallico se `gap ≤ 0`); corretto il test di appartenenza al segmento in `EpmBandPlot.tsx` (`<` sui tratti non finali, così `Γ` cade su `Γ–X`); oscurati tipo gap e CBM finché `isProvisional` è `true` mostrando `≈ gap`; rimosso `verifica_bande_reali.py` da `strings.ts:15`; aggiornata la notazione (`ψ^f_k`, `V^s_{|G|²}`, `V^a_{|G|²}`, `v(q) = v_ion(q)/ε(q)`, `r_c ≃ metà della lunghezza di legame`) e aggiunte le righe su `τ = a/8 (1,1,1)` e sui gusci `|G|² = 3, 4, 8, 11`. **Preset Ge non aggiunto** (vedi §4 e §5).

---

## 2. Cosa hai verificato davvero

Tutti i controlli sotto elencati sono stati eseguiti **dopo l'ultima modifica** al codice sorgente:

1. **Typecheck, suite Vitest completa e build di produzione**:
   - Comando: `export PATH="$PWD/.tools/node/bin:$PATH" && npm run typecheck && npm test && npm run build`
   - Esito: `exit code 0`.
   - `tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json`: `0` errori.
   - `vitest run`: `Test Files 15 passed (15)`, `Tests 137 passed (137)` (`8.02s`). Include tutti i nuovi test per i punti `1`, `2`, `3` (flessi di tutti i modelli), `4`, `5` (benchmark EPM ridotto), `6`, `7` (`kaneMassBreakdown`, `twoBandMassBreakdown`, `kronigEffectiveP`, `kronigBarrierStrength`, continuità a `V₀ ± 1e-6`, normalizzazione `kronigPenneyDensity1D` `< 1e-4`, massa GaAs in `Γ` ≈ `0.0988`) e `29` (verifica Ge).
   - `electron-vite build`: `out/main/index.js` (`1.21 kB`), `out/preload/index.js` (`0.14 kB`), `out/renderer/` (`112 modules transformed`, `✓ built in 482ms`).

2. **Benchmark calcolo ridotto EPM (`pointsPerSegment` = `10, 14, 18, 20, 24`, 51 onde piane)** dentro `pseudopotential.test.ts` (run finale):
   - Output registrato: `[EPM fast benchmark] {"10":{"si":45.5,"gaas":26.6},"14":{"si":43.5,"gaas":31.4},"18":{"si":50.8,"gaas":42.6},"20":{"si":48.7,"gaas":42.7},"24":{"si":58.2,"gaas":53.6}}` ms (in un run precedente prima della fine delle modifiche: `{"10":{"si":22.7,"gaas":23.7},"14":{"si":31.5,"gaas":33.1},"18":{"si":42.2,"gaas":44},"20":{"si":41.9,"gaas":44.8},"24":{"si":49.9,"gaas":56}}` ms).
   - Scelto `fastPointsPerSegment: 20`: è il valore più alto che resta sotto `50 ms` (~`42–49 ms`), divide esattamente `fullPointsPerSegment: 40` (`2:1`) e campiona esattamente il minimo di conduzione del Si a `0,85 ΓX` (`17/20 = 0,85`).

3. **Audit formule e costanti residue in `src/renderer/src/sections/`**:
   - Comando: `grep -rnE "Math\.(PI|cos|sin|exp|sqrt)|RYDBERG|HBAR" src/renderer/src/sections/`
   - Risultato (`exit code 0`, `33` righe residue, **nessuna formula di fisica nei componenti**):
     - `KronigBandsAndConditionPlot.tsx` (`185, 607, 769, 779`), `KronigRealSpace.tsx` (`331`), `GammaLevelsCanvas.tsx` (`199`), `KpBandPlot.tsx` (`90, 429, 481`), `TightBindingRealSpace.tsx` (`187, 214, 224, 230, 322`), `BandExtremumOverlay.tsx` (`125`), `ZoneSchemesPlot.tsx` (`188, 475, 609, 627, 644, 694`), `EmptyLatticeRealSpace.tsx` (`137, 153`), `EpmBandPlot.tsx` (`220, 221, 228, 233, 337, 344`), `FormFactorCanvas.tsx` (`152, 212, 220`): sola geometria grafica Canvas 2D (`ctx.arc` con `2 * Math.PI`, `ctx.rotate(-Math.PI / 2)`, ampiezza grafica parabola osculatrice `Math.sqrt((0.25 * (e1 - e0)) / bend)`, raggio orbitale indicativo `Math.sqrt(site.amp)`, orientazione punta freccia con `Math.cos`/`Math.sin`, fade alfa `Math.sin(Math.PI * fold)`).
     - `empty-lattice/model.ts:124`: `const kMax = NUMERICS.kWindowRef * Math.sqrt(NUMERICS.aWindowRef / a)` (sola finestra di visualizzazione dell'asse `k`, per mantenere un numero simile di zone visibili al variare di `a`).
     - Zero occorrenze di `RYDBERG` o `HBAR` in tutta `src/renderer/src/sections/`.

4. **Verifica visiva nel browser dell'app compilata**:
   - Avviato server locale `./node_modules/.bin/vite preview --outDir out/renderer --port 4173 --strictPort` (poi terminato; `manage_task list` conferma `0` task attivi).
   - Tramite subagent `browser` su `http://localhost:4173/` (origine confermata da `BROWSER_HOST_FACTS`) ispezionate tutte le 6 sezioni, verificati: formule KaTeX (`0` elementi `.katex-error`), aggiornamento interattivo delle viste e dei valori, layout responsivo fino a `800 px` senza overflow orizzontale, e `0` errori runtime generati dall'applicazione (il subagent ha segnalato solo un `IndexSizeError` prodotto dal metodo di test `.fill()` su `<input type="range">`, non da codice dell'app).

5. **Verifica stato albero git**:
   - `git status --short`: tutte le modifiche introdotte da questo incarico ricadono esclusivamente in `physics/`, `sections/*/` e `ui/format.ts` (erano già presenti nel working tree prima dell'avvio modifiche precedenti su `incarichi/gemini-10-correzioni-grafica.md`, `progetto.md`, `reviews/gemini/08-schermata-iniziale.md` e `src/renderer/src/home/*`).

---

## 3. Cosa non hai potuto verificare

- L'app desktop completa dentro la shell **Electron** (in sandbox macOS `npm run dev:web` avvia comunque Electron e il processo GPU fallisce con `Operation not permitted` sull'inizializzazione sandbox); è stato quindi verificato il bundle renderer tramite `vite preview` nel browser.
- Non ho aggiunto il preset **Ge** in `sections/pseudopotential/manifest.ts` né testato a schermo un comportamento «indiretto in `L`» per Ge, perché la verifica numerica in `physics/` contraddice direttamente la dispensa (§4).

---

## 4. Problemi trovati (in ordine di gravità)

### Bloccante (fermato secondo le istruzioni dell'incarico)
1. **Punto 29 — Preset Ge con fattori `P4 r. 1109–1111` e `a = 5,658 Å` contraddice `P4 r. 807–809` (`src/renderer/src/physics/pseudopotential.test.ts:303-319`, `materiale/parte4/dispensa.tex:1109-1111`, `materiale/parte4/dispensa.tex:807-809`, `materiale/parte4/verifica_pseudo.py:54`)**:
   - **Cosa succede**: eseguendo `pseudopotentialBands` + `analyzeEpmBands` a `113` onde piane (`gMaxSq: 21`, `pointsPerSegment: 40`) con i fattori simmetrici della tabella `P4 r. 1109–1111` (`v3s = -0.269`, `v8s = 0.038`, `v11s = 0.035` Ry) e `a = 5.658 Å` (`verifica_pseudo.py:54`), si ottiene `gap = 0.9112 eV`, `ecGamma = 0.9112 eV`, `ecL = 0.9852 eV`, `ecX = 1.4837 eV`, `isDirect: true`, `cbmDescription: 'Γ'`.
   - **Perché è sbagliato rispetto alla dispensa**: `P4 r. 807–809` (e `1191`) afferma che il germanio ha gap indiretto con minimo di conduzione in `L`. Con questi tre fattori locali (`-0.269; 0.038; 0.035` Ry) `E_c(Γ)` scende `74 meV` sotto `E_c(L)`, rendendo il gap diretto in `Γ`.
   - **Come riprodurlo**: `npm test` esegue il test `punto 29 (verifica blocco Ge)` in `src/renderer/src/physics/pseudopotential.test.ts:303-319`. Come istruito nell'incarico («Se il risultato contraddice la dispensa, fermati e segnalalo»), il preset Ge non è stato inserito in `src/renderer/src/sections/pseudopotential/manifest.ts`.

### Minore / Residuo di verifica
2. **Commenti di sviluppo residui in `src/renderer/src/sections/pseudopotential/manifest.ts:3,57`**: contengono ancora il riferimento a `verifica_bande_reali.py` in commenti JSDoc interni (non visibili a schermo; `strings.ts:15` è invece stato ripulito).

---

## 5. Dubbi e domande per la regia

1. **Preset Ge (punto 29)**: come procedere per la sezione «Pseudopotenziale»? Possibili alternative: (a) mantenere il Ge fuori dai preset finché non si adotta una fonte di fattori EPM locale coerente con `CBM` in `L` (es. Cohen–Bergstresser `1966` dove `V_3^s = -0.23 Ry`, `V_8^s = 0.01 Ry`, `V_{11}^s = 0.06 Ry` o verifica del valore `V_8^s = 0.038` vs `0.019` / `0.01` nella tabella `P4 r. 1109–1111`), oppure (b) segnalare apertamente nella UI/dispensa che la terna locale semplificata della tabella `P4 r. 1109–1111` sposta `Γ` sotto `L`.
2. **Verifica Electron reale**: confermate che l'esecuzione desktop Electron fuori sandbox resta a carico dell'utente / regia?

---

## Tabella riepilogativa dei 31 punti

| # | Punto | Stato | File toccati | Verifica |
|---|---|---|---|---|
| 1 | `fillBands` con bande separate in ordine inverso | **fatto** | `physics/filling.ts`, `physics/filling.test.ts` | `vitest` (`filling.test.ts`, 7/7 pass) |
| 2 | Pseudopotenziale `μ` assente quando `gap ≤ 0` | **fatto** | `physics/pseudopotential.ts`, `physics/pseudopotential.test.ts`, `sections/pseudopotential/model.ts`, `sections/pseudopotential/strings.ts`, `sections/pseudopotential/EpmBandPlot.tsx`, `sections/pseudopotential/PseudopotentialSection.tsx` | `vitest` + browser preview (`gap = 0`) |
| 3 | Soglia unica divergente ai flessi + `formatEffectiveMassRatio` + `twoBandMassBreakdown` | **fatto** | `physics/semiclassical.ts`, `physics/semiclassical.test.ts`, `ui/format.ts`, tutte le 6 sezioni (`EmptyLatticeSection.tsx`, `KronigPenneySection.tsx`, `NearlyFreeSection.tsx`, `TightBindingSection.tsx`, `k-dot-p/{model.ts,KDotPSection.tsx,MassContributionsBar.tsx}`, `pseudopotential/{EpmBandPlot.tsx,PseudopotentialSection.tsx}`) | `vitest` (`semiclassical.test.ts`, 14/14 pass) + browser preview |
| 4 | Fisica rimasta nell'interfaccia spostata in `physics/` | **fatto** | `physics/{constants.ts,centralEquation1d.ts,kDotP.ts,pseudopotential.ts,semiclassical.ts}`, `sections/k-dot-p/{model.ts,KDotPSection.tsx}`, `sections/nearly-free/{model.ts,NearlyFreeSection.tsx}`, `sections/pseudopotential/{model.ts,PseudopotentialSection.tsx}` | `grep` audit (`0` formule di fisica) + `typecheck` + `vitest` |
| 5 | Calcolo ridotto EPM a 20 punti/tratto + indicatore `isProvisional` (`≈ gap`, senza tipo/CBM) | **fatto** | `sections/pseudopotential/{manifest.ts,model.ts,EpmBandPlot.tsx,PseudopotentialSection.tsx}`, `physics/pseudopotential.test.ts` | Benchmark Vitest (`20`: Si `48,7 ms`, GaAs `42,7 ms`) + `typecheck` |
| 6 | Massa direzionale EPM con indicazione tratto (`lungo Γ–X`) | **fatto** | `physics/pseudopotential.ts`, `physics/pseudopotential.test.ts`, `sections/pseudopotential/{model.ts,strings.ts,EpmBandPlot.tsx,PseudopotentialSection.tsx}` | `vitest` (`[1,0,0]` / `Γ–X`) + browser preview |
| 7 | Test mancanti (`kaneMassBreakdown`, `twoBandMassBreakdown`, `kronigEffectiveP`, `kronigBarrierStrength`, continuità a `V₀`, normalizzazione `1e-4`, GaAs `0,0988`) | **fatto** | `physics/{kDotP.test.ts,kronigPenney.test.ts,pseudopotential.test.ts}` | `vitest` (tutti passati) |
| 8 | Commento superato in `physics/linalg.ts` | **fatto** | `physics/linalg.ts` | Ispezione file + `typecheck` |
| 9 | k·p: formula sbagliata in `strings.ts:44` + righe `E_lh` e `\|X⟩,\|Y⟩` in `TWO_BAND_MATRIX_FORMULA` | **fatto** | `sections/k-dot-p/{strings.ts,formulas.ts}` | Browser preview (KaTeX `0` errori) |
| 10 | k·p: massa di lacuna positiva `m_{lh} = −m*_{lh}` anche in variante Due bande | **fatto** | `sections/k-dot-p/KDotPSection.tsx` | Browser preview (`m*_{lh}(0)/m₀` e `m_{lh}/m₀`) |
| 11 | k·p Due bande: rimosso `m_J = ±½` da `GammaLevelsCanvas` + riga valori sugli stati `\|X⟩, \|Y⟩` | **fatto** | `sections/k-dot-p/{GammaLevelsCanvas.tsx,strings.ts,KDotPSection.tsx}` | Browser preview |
| 12 | Rimossi rimandi interni (`slide 41`, `verifica_bande_reali.py`) dai testi visibili | **fatto** | `sections/k-dot-p/strings.ts`, `sections/pseudopotential/strings.ts` | `grep` + browser preview (`0` occorrenze visibili) |
| 13 | Introduzione nel riquadro «Verifica sui quasi liberi» | **fatto** | `sections/k-dot-p/{strings.ts,KDotPSection.tsx}` | Browser preview |
| 14 | Rimossa stringa inutilizzata `verification.minusLabel` | **fatto** | `sections/k-dot-p/strings.ts` | `typecheck` |
| 15 | Reticolo vuoto: convenzione unica `k` esteso / `k'` ridotto + `E_k` + `ψ_{n,k+G}=ψ_{n,k}` | **fatto** | `sections/empty-lattice/{formulas.ts,strings.ts}` | Browser preview |
| 16 | Reticolo vuoto: confronto quasi liberi leggibile (`V_G=-2,2`, `V_{2G}=-1,4` indicativi dichiarati) | **fatto** | `sections/empty-lattice/{manifest.ts,strings.ts}` | Browser preview |
| 17 | Reticolo vuoto: asse `E` segue lo stato scelto (ramo `n = -2` in scala) | **fatto** | `sections/empty-lattice/model.ts` | Browser preview |
| 18 | Reticolo vuoto: eliminata ripetizione nella riga riempimento a `2 el./cella` | **fatto** | `sections/empty-lattice/strings.ts` | Browser preview |
| 19 | Kronig–Penney: nome uniforme `f(αa)` nel caso a delta + nota `L(E) = f(αa)` | **fatto** | `sections/kronig-penney/{formulas.ts,strings.ts,KronigPenneySection.tsx}` | Browser preview |
| 20 | Kronig–Penney: definiti `P_eff = m₀ a V₀ c / ħ²`, area `aV₀` e media `V₀` | **fatto** | `sections/kronig-penney/{formulas.ts,strings.ts,KronigPenneySection.tsx}` | Browser preview |
| 21 | Kronig–Penney: segno effettivo `−`/`+` della banda a coseno + `W ∝ e^{-βc}` | **fatto** | `sections/kronig-penney/{formulas.ts,KronigPenneySection.tsx}` | Browser preview |
| 22 | Quasi liberi: equazione centrale e `c_{nG}` in teoria + top-3 `\|c_G\|²` nei valori (`50%`/`50%` al bordo) | **fatto** | `physics/centralEquation1d.ts`, `physics/centralEquation1d.test.ts`, `sections/nearly-free/{model.ts,strings.ts,NearlyFreeSection.tsx}` | `vitest` + browser preview |
| 23 | Quasi liberi: etichette esplicite «formula a due onde» vs «calcolo completo (11 onde piane)» | **fatto** | `sections/nearly-free/{strings.ts,NearlyFreeSection.tsx}` | Browser preview |
| 24 | Quasi liberi: nota isolante `4 el./cella` (`V_{2G}=0`, «secondo ordine, non visibile a questa scala») e nota `≃ V_G²/2E₀` | **fatto** | `sections/nearly-free/{strings.ts,NearlyFreeSection.tsx}` | Browser preview |
| 25 | Quasi liberi: preset (`v2G → 0`, Ge `0,66 eV`, Diamante `5,5 eV`) e `m₀/m*_± = 1 ± 2E₀/\|V_G\|` | **fatto** | `sections/nearly-free/{manifest.ts,store.ts,formulas.ts}` | Browser preview |
| 26 | Legami forti: stato di Bloch con `b_A, b_B` e sviluppo `E_± ≃ E_{B,A} ± W cos²(ka/2)` | **fatto** | `sections/tight-binding/formulas.ts` | Browser preview |
| 27 | Legami forti: `lambda` rinominato in `ell` con `a₀ = 3 Å`, `ℓ = 0,8 Å` a schermo | **fatto** | `physics/tightBinding.ts`, `physics/tightBinding.test.ts`, `sections/tight-binding/{manifest.ts,model.ts,store.ts,strings.ts}` | `vitest` + browser preview |
| 28 | Pseudopotenziale: riquadro ione nudo usa `-0,211 Ry = -2,87 eV` lasciando bande Si a `-0,21 Ry` | **fatto** | `sections/pseudopotential/{model.ts,strings.ts}` | `vitest` + browser preview |
| 29 | Pseudopotenziale: preset Ge (`-0,269; 0,038; 0,035` Ry, `a = 5,658 Å`) | **non fatto** | Solo test diagnostico in `physics/pseudopotential.test.ts:303-319` (`manifest.ts` non modificato) | `vitest`: gap diretto `0,9112 eV` in `Γ` (`E_c(L) = 0,9852 eV`), contraddice `P4 r. 807–809` |
| 30 | Pseudopotenziale: notazione (`ψ^f_k`, `V^s_{\|\mathbf{G}\|²}`, `r_c ≃ metà della lunghezza di legame`, `v(q)=v_ion(q)/ε(q)`) | **fatto** | `sections/pseudopotential/{formulas.ts,strings.ts}` | `grep` + browser preview (`0` `φ^f`) |
| 31 | Pseudopotenziale: spiegazioni vicino ai comandi per `τ = a/8 (1,1,1)` e gusci `\|G\|² = 3, 4, 8, 11` | **fatto** | `sections/pseudopotential/{strings.ts,PseudopotentialSection.tsx}` | Browser preview |

*Nota sui 4 falsi allarmi dell'incarico*: lasciati invariati come richiesto (`empty-lattice` `Re ψ` a `1,5 π/a`, `tight-binding` `Re ψ_k` iniziale `E₋` legante, `tight-binding` sonda a `π/a`, layout off-screen `pseudopotential`).

---

## Elementi rimandati all'incarico 10 (`incarichi/gemini-10-correzioni-grafica.md`)

- Stile, collocazione e resa grafica visiva dello stato **provvisorio** (calcolo ridotto a `51` onde mentre il worker completa a `113` onde) oltre ai dati `isProvisional` / `≈ gap` qui forniti (punto 5).
- Collocazione visiva e impaginazione del riquadro «Verifica sui quasi liberi» nella sezione «Metodo k·p» (punto 13).
- Tutto ciò che riguarda impaginazione, dimensioni/scroll off-screen a `1100×800`, stili CSS, colori, componente condivisi `ui/` / `viz/` e sovrapposizioni di etichette.
