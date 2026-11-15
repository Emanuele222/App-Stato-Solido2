# Rapporto incarico `gemini-10-correzioni-grafica.md`

## 1. Cosa hai fatto

Sono stati eseguiti tutti i 24 punti dell'incarico [gemini-10-correzioni-grafica.md](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/incarichi/gemini-10-correzioni-grafica.md) sui file consentiti (`ui/`, `viz/`, `home/` e tutte e sei le sezioni in `sections/*/`), rispettando i vincoli di `AGENTS.md` (nessuna modifica a `physics/`, `App.tsx`, `registry.ts`, `progetto.md`, `CLAUDE.md`, `AGENTS.md`, `incarichi/`, `materiale/`, nessuna nuova dipendenza, nessun commit/push).

### Riepilogo interventi per area

- **Design system, animazioni, CSS condiviso (`ui/`)**:
  - [theme.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/ui/theme.ts): aggiunte le 4 nuove grandezze in `QUANTITIES`: `t`, `kp`, `Delta`, `EP`; aggiunto `FONTS.mathUpright`.
  - [motion.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/ui/motion.ts): applicato il clamp `Math.max(0, Math.min(1, u))` in `useTweened`.
  - [ui.css](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/ui/ui.css): rimosso `text-transform: uppercase` da `.view-tag`, aggiunta la media query `@media (max-height: 740px)` per lo scroll pulito di `.stage`, aggiunta la classe `.panel-details` (fisarmonica `<details>/<summary>` per le schede di approfondimento).
- **Helper grafici condivisi (`viz/canvas.ts`)**:
  - Inseriti `placeGapLabelBox`, `placeProbeLabel`, `drawSegmentedHorizontalLine`, `drawRichText`.
  - Aggiornati `buildMathChunks`, `measureMathText` e `drawMathText` in modo che cifre e simboli dritti (`|`, `(`, `)`, `=`, `+`, `−`, `*`, `/`, `,`, `.`, `·`, `²`, `³`) usino `FONTS.mathUpright` (`KaTeX_Main`) anziché `KaTeX_Math` italico, eliminando le collisioni sui pedici/apici (es. `|c_G|^2`, `|G|^2`).
- **Home (`home/`)**:
  - [curves.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/home/curves.ts) e [curves.test.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/home/curves.test.ts): anteprima a riposo della card `Teoria delle bande` ridotta a 2 bande con `fourier: [-1.8, 0]`.
  - [ActiveChapterCard.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/home/ActiveChapterCard.tsx) e [home.css](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/home/home.css): rimosso `.card-summary` dalla card attiva, compattata l'altezza della griglia (`356px`) così che la griglia `3×2` stia senza scroll a `1440×900`, rimosso `opacity: 0.65` su `.is-upcoming` e aumentato il contrasto di `.is-upcoming-badge`.
- **Sezioni (`sections/*/`)**:
  - **1. Reticolo vuoto** (`empty-lattice/`): stato `highlightTarget` in `store.ts` per separare slider `a` vs bordo `G`, colori/tracciati e etichette non sovrapposte in `ZoneSchemesPlot.tsx`, etichette/testi aggiornati in `EmptyLatticeSection.tsx`.
  - **2. Kronig–Penney** (`kronig-penney/`): colori `kp` per `f(αa)`/`L(E)`/`α`/`β` e `t` per larghezza/ampiezza in `formulas.ts`, `KronigBandsAndConditionPlot.tsx` e `KronigPenneySection.tsx`, oltre ai miglioramenti di `strings.ts`.
  - **3. Elettroni quasi liberi** (`nearly-free/`): aggiornati gli allineamenti testuali e le leggende in `strings.ts`, `formulas.ts`, `manifest.ts`, `model.ts`, `store.ts`, `NearlyFreeSection.tsx`.
  - **4. Legami forti** (`tight-binding/`): colori distinti `t` per salti/larghezze di banda, `BandExtremumOverlay.tsx` e `EdgesVsDistancePlot.tsx` ripuliti contro collisioni, fisarmonica/controlli aggiornati in `TightBindingSection.tsx`, `formulas.ts`, `strings.ts`, `tightBinding.css`.
  - **5. Metodo k·p** (`k-dot-p/`): `tools.mass: false` di default in `store.ts`; nuovi colori `Delta` ed `EP` in `formulas.ts`, `GammaLevelsCanvas.tsx`, `KpBandPlot.tsx`, `MassContributionsBar.tsx`, `KDotPSection.tsx`; scheda verifica su quasi liberi spostata in `<details className="panel-details">` dentro `Scheda teoria`; proporzioni verticali in `kDotP.css` (`grid-template-rows: minmax(116px, 26fr) minmax(90px, 18fr) minmax(210px, 56fr)`) per evitare schiacciamento di `MassContributionsBar`; rimosso import ridondante `PARAMS` da `model.ts`.
  - **6. Pseudopotenziale** (`pseudopotential/`): `tools.mass: false` di default in `store.ts`; `V^a` migrato a `V2G` in `formulas.ts`, `FormFactorCanvas.tsx`, `PseudopotentialSection.tsx`; bande di conduzione in `#b4de9e` in `EpmBandPlot.tsx`, funzione liscia `ψ^f` in `#f0b3e7` in `RealSpacePseudoCanvas.tsx`; hard core e gap shading associati a `VG`; asse `E (eV)`, nota `provisional` attenuata e sezione core chiusa in `<details className="panel-details">` dentro `Scheda teoria`; legende `RealSpacePseudoCanvas` e `FormFactorCanvas` ridisposte (`V_{11}^a` a sinistra del rombo, `● parametri V^s (|G|^2=3,8,11)`); corretti i delimitatori KaTeX di `massGaAsCompare` e rimossi `**` letterali in `strings.ts`; aggiornato `pseudopotential.css` (`grid-template-rows: minmax(146px, 37fr) minmax(250px, 63fr)`) per evitare il collasso della riga superiore a `1100×800`.

---

## 2. Cosa hai verificato davvero, con i comandi eseguiti e i risultati

Tutte le verifiche finali sono state eseguite **dopo l'ultima modifica al codice**:

1. **Typecheck, suite Vitest e build di produzione**:
   - Comando: `export PATH="$PWD/.tools/node/bin:$PATH" && npm run typecheck && npm test && npm run build`
   - Risultato:
     - `tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json`: **exit code 0**, 0 errori.
     - `vitest run`: **15 file di test passati su 15, 137 test passati su 137** (nessun test saltato o fallito).
     - `electron-vite build`: **exit code 0**, bundle client `out/renderer/` generato in 322 ms.
2. **Verifica DOM e visiva in Chromium headless (Playwright su `vite preview --outDir out/renderer --port 4176 --host 127.0.0.1 --strictPort`)**:
   - **Errori console / eccezioni di pagina**: **0** su tutte le viste, interazioni e ridimensionamenti (`1440×900`, `1100×800`, `800×700`).
   - **Home a `1440×900`** (ispezionata anche visivamente via screenshot diretto): griglia `3×2`, `main` 1080×728 px, `hasScroll: false`, 2 bande a riposo su `Teoria delle bande`, `0` elementi `.card-summary` sulla card attiva, `.is-upcoming` con `opacity: 1` e badge `IN ARRIVO` ad alto contrasto leggibili.
   - **Home a `1100×800` e `800×700`**: 3 colonne a `1100×800`, 2 colonne a `800×700` con scroll verticale regolare.
   - **Sezione 6 `Pseudopotenziale` (`1440×900`, preset `GaAs`, tutti gli strumenti attivi, `<details>` in `Scheda teoria` aperto)** (ispezionata visivamente via screenshot diretto): KaTeX renderizzato senza `$` o `**` letterali (0 occorrenze nel DOM), `|c_G|^2` e `|G|^2` nei canvas senza sovrapposizioni, legende `RealSpacePseudoCanvas` e `FormFactorCanvas` staccate dalle curve, `V_{11}^a` e `V_3^a` leggibili.
   - **Sezione 5 `Metodo k·p` (`1440×900` e `1100×800`, preset `InSb` Kane + `H_so`, `Massa efficace` attiva)** (ispezionata visivamente a `1100×800` via screenshot diretto): `MassContributionsBar` ben leggibile anche a `1100×800` (`49,7 px`), `KpBandPlot` senza collisioni fra `E_F`, `E_g`, `Δ`, `m*` e `vicino a Γ`, 0 `$` o `**` letterali nel DOM.
3. **Pulizia processi**:
   - Server temporaneo `vite preview` terminato con `manage_task (kill)`; verifica finale con `manage_task (list)`: `No background tasks are currently running.`

---

## 3. Cosa non hai potuto verificare

- **Finestra nativa Electron desktop**: non è stato avviato il binario desktop `electron` (preload/IPC e rendering nativo macOS di Electron); la verifica grafica e DOM è stata eseguita sul bundle reale `out/renderer/` servito via `vite preview` dentro Chromium headless.
- **Ispezione visiva diretta per ogni combinazione di sezioni 1–4 alle risoluzioni piccole**: per le sezioni `Reticolo vuoto`, `Kronig–Penney`, `Elettroni quasi liberi` e `Legami forti` sull'ultima build sono state verificate le dimensioni DOM esatte di `.stage` e di tutti i `<canvas>` alle tre risoluzioni (`1440×900`, `1100×800`, `800×700`) e l'assenza di errori console, mentre gli screenshot ispezionati direttamente dopo le ultime 6 correzioni riguardano la Home (`1440×900`), `Pseudopotenziale` (`1440×900` GaAs) e `Metodo k·p` (`1100×800` InSb).

---

## 4. Problemi trovati in ordine di gravità

Nessun problema **bloccante** residuo (build, test, typecheck e rendering senza errori console). Restano tre aspetti minori osservati direttamente sugli screenshot dell'ultima build:

1. **Importante (visivo a gap molto stretto)** — [GammaLevelsCanvas.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/k-dot-p/GammaLevelsCanvas.tsx): a `1100×800` su `Metodo k·p` con preset `InSb` (`E_g = 0,18 eV`, riga canvas alta `111,5 px`), la linea di conduzione `c (s, J = 1/2)` dista pochissimi pixel dal livello di valenza `hh (p, J = 3/2)` e la relativa etichetta `c (s, J = 1/2)` si sovrappone parzialmente alle etichette `hh (p, J = 3/2)` / `m_J = ±3/2 (2 st.)`. *Riproduzione*: aprire `Metodo k·p` a `1100×800` e selezionare `InSb`.
2. **Minore** — [EpmBandPlot.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/pseudopotential/EpmBandPlot.tsx): in `Pseudopotenziale` con preset `GaAs` a `1440×900`, l'etichetta `gap diretto 1,93 eV` posizionata a metà del segmento verticale in `Γ` è attraversata da una delle curve della banda di conduzione; inoltre in [ShellWeightsBar.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/sections/pseudopotential/ShellWeightsBar.tsx) l'etichetta `58%` sulla barra più alta (`|G|^2 = 3`) sfiora il bordo superiore della barra. *Riproduzione*: aprire `Pseudopotenziale` a `1440×900` con `GaAs`.
3. **Minore** — [ActiveChapterCard.tsx](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/home/ActiveChapterCard.tsx) e [home.css](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/home/home.css): rimuovendo `.card-summary` dalla card attiva e mantenendo l'altezza fissa uniforme (`356px`) allineata alle card `IN ARRIVO`, resta spazio vuoto tra il riquadro canvas e la riga di suggerimento in basso nella prima card. È voluto dall'uniformità della griglia `3×2`, ma segnalabile se la regia preferisse allargare il canvas anteprima nella sola card attiva.

---

## 5. Dubbi e domande per la regia

1. In `GammaLevelsCanvas`, quando `E_g` scende sotto ~`0,3 eV` (come `InSb = 0,18 eV` o cursori manuali piccoli), conviene introdurre uno spostamento/offset verticale minimo di layout per i soli testi dei livelli `c` e `hh/lh` (mantenendo le linee in scala) oppure mostrare un diagramma qualitativo compresso in alto?
2. Sulla Home (`1440×900`), l'altezza extra lasciata dall'eliminazione di `.card-summary` nella card attiva va lasciata vuota per mantenere identico il rettangolo del grafico alle altre card, oppure è preferibile far espandere il `<canvas>` d'anteprima della card attiva?

---

## Tabella riepilogativa dei 24 punti (`incarichi/gemini-10-correzioni-grafica.md`)

| # | Punto | Stato | File toccati principali | Verifica |
|---:|---|---|---|---|
| 1 | Colori nuovi (`t`, `kp`, `Delta`, `EP`) in `theme.ts` | fatto | `ui/theme.ts`, `kronig-penney/formulas.ts`, `tight-binding/formulas.ts`, `k-dot-p/formulas.ts` | typecheck + build + screenshot `k·p` |
| 2 | Clamp `[0, 1]` in `useTweened` | fatto | `ui/motion.ts` | typecheck + test + navigazione browser |
| 3 | Rimuovere `uppercase` da `.view-tag` | fatto | `ui/ui.css` | ispezione screenshot `k·p` e `Pseudopotenziale` |
| 4 | Scroll `.stage` sotto `740px` di altezza | fatto | `ui/ui.css`, `k-dot-p/kDotP.css`, `pseudopotential/pseudopotential.css` | misura DOM `800×700` (scroll attivo dove serve) |
| 5 | Fisarmonica `.panel-details` in CSS condiviso | fatto | `ui/ui.css`, `k-dot-p/KDotPSection.tsx`, `pseudopotential/PseudopotentialSection.tsx` | verifica DOM e rendering KaTeX aperto |
| 6 | Helper anti-collisione e testo ricco su canvas | fatto | `viz/canvas.ts` | build + screenshot `Pseudopotenziale` (`\|c_G\|^2`) |
| 7 | Reticolo vuoto: separazione highlight `a` vs `G` | fatto | `empty-lattice/{store.ts,EmptyLatticeSection.tsx,ZoneSchemesPlot.tsx}` | typecheck + DOM `1440/1100/800` |
| 8 | Kronig–Penney: colori `kp` / `t` e leggibilità grafico | fatto | `kronig-penney/{formulas.ts,KronigBandsAndConditionPlot.tsx,KronigPenneySection.tsx,strings.ts}` | typecheck + DOM `1440/1100/800` |
| 9 | Quasi liberi: allineamenti e testi | fatto | `nearly-free/{formulas.ts,strings.ts,manifest.ts,model.ts,store.ts,NearlyFreeSection.tsx}` | typecheck + DOM `1440/1100/800` |
| 10 | Legami forti: colori `t`, overlay estremi e bordi vs distanza | fatto | `tight-binding/{formulas.ts,BandExtremumOverlay.tsx,EdgesVsDistancePlot.tsx,TightBindingRealSpace.tsx,TightBindingSection.tsx,tightBinding.css,strings.ts}` | typecheck + DOM `1440/1100/800` |
| 11 | Metodo k·p: default `tools.mass: false` | fatto | `k-dot-p/store.ts` | typecheck + DOM/UI |
| 12 | Metodo k·p: colori `Delta` ed `EP`, formule e canvas | fatto | `k-dot-p/{formulas.ts,GammaLevelsCanvas.tsx,KpBandPlot.tsx,MassContributionsBar.tsx,KDotPSection.tsx}` | screenshot `InSb` `1100×800` + DOM |
| 13 | Metodo k·p: card verifica quasi liberi chiusa in `Scheda teoria` | fatto | `k-dot-p/KDotPSection.tsx` | verifica apertura `<details>` in browser |
| 14 | Metodo k·p: anti-collisione etichette `KpBandPlot` e proporzioni `MassContributionsBar` | fatto | `k-dot-p/{KpBandPlot.tsx,kDotP.css}`, `viz/canvas.ts` | screenshot `1100×800` (`49,7 px`) + tabella altezze |
| 15 | Metodo k·p: pulizia import inutilizzato in `model.ts` | fatto | `k-dot-p/model.ts` | `tsc --noEmit` 0 errori |
| 16 | Pseudopotenziale: default `tools.mass: false` | fatto | `pseudopotential/store.ts` | typecheck + UI |
| 17 | Pseudopotenziale: `V^a -> V2G`, conduzione `#b4de9e`, `ψ^f -> #f0b3e7`, `VG` su core/gap | fatto | `pseudopotential/{formulas.ts,FormFactorCanvas.tsx,EpmBandPlot.tsx,RealSpacePseudoCanvas.tsx,PseudopotentialSection.tsx}` | screenshot `GaAs` `1440×900` |
| 18 | Pseudopotenziale: asse `E (eV)`, nota `provisional`, card core in `Scheda teoria` | fatto | `pseudopotential/{EpmBandPlot.tsx,PseudopotentialSection.tsx,strings.ts}` | screenshot `GaAs` + verifica KaTeX `<details>` |
| 19 | Pseudopotenziale: fix rendering `|c_G|^2`, `|G|^2`, legende top canvas e proporzioni riga alta | fatto | `viz/canvas.ts`, `pseudopotential/{RealSpacePseudoCanvas.tsx,FormFactorCanvas.tsx,pseudopotential.css,strings.ts}` | screenshot `1440×900` + misure `1100×800`/`800×700` |
| 20 | Controllo generale KaTeX / assenza `**` e `$` letterali | fatto | `pseudopotential/strings.ts` + tutte le sezioni | scansione DOM su `Pseudopotenziale` e `Metodo k·p` (0 match) |
| 21 | Home: anteprima card attiva a 2 bande (`fourier: [-1.8, 0]`) + test aggiornato | fatto | `home/{curves.ts,curves.test.ts}` | `vitest` (`curves.test.ts`) + screenshot Home `1440×900` |
| 22 | Home: rimozione `.card-summary` dalla card attiva | fatto | `home/ActiveChapterCard.tsx` | DOM check (`.card-summary` = 0) + screenshot |
| 23 | Home: compattamento griglia `3×2` senza scroll a `1440×900` | fatto | `home/home.css` | DOM (`hasScroll: false`, max bottom 825 px) + screenshot |
| 24 | Home: rimozione `opacity: 0.65` da `.is-upcoming` e contrasto badge `IN ARRIVO` | fatto | `home/home.css` | DOM (`opacity: 1`) + screenshot Home `1440×900` |

---

## Colori esatti aggiunti in `src/renderer/src/ui/theme.ts`

| `QuantityId` | Colore HEX | Nome / significato in `QUANTITIES` |
|---|---|---|
| `t` | `#75a4ff` | `integrale di salto e larghezza di banda` |
| `kp` | `#badc58` | `funzione di Kronig–Penney` |
| `Delta` | `#eb82a6` | `separazione spin–orbita` |
| `EP` | `#64b5f6` | `energia caratteristica di Kane` |

---

## Mappa delle formule vive per sezione (`termine -> QuantityId -> elementi evidenziati`)

| Sezione | Termine nelle formule (`formulas.ts`) | `QuantityId` | Elementi evidenziati (slider / grafico / scena) |
|---|---|---|---|
| **1. Reticolo vuoto** | `E` | `E` | Curve di banda nel diagramma `E(k)` |
| | `k`, `k'` | `k` | Cursore vettore d'onda, stato selezionato su `E(k)` e onda in spazio reale |
| | `a` | `a` | Slider `a`, passi del reticolo reale (con `highlightTarget !== 'G'`) |
| | `G` | `a` (`target: 'G'`) | Bordi della 1ª zona di Brillouin e vettori reciproci (`highlightTarget === 'G'`) |
| | `E_0`, `E_k` | `Ek` | Parabola libera di confronto in `ZoneSchemesPlot` |
| **2. Kronig–Penney** | `k` | `k` | Cursore stato e punto selezionato su `E(k)` |
| | `a`, `b`, `c` | `a` | Slider geometrici `a`/`b`/`c`, celle e barriere in spazio reale, bordi `±π/a` |
| | `f(αa)`, `L(E)`, `α`, `β` | `kp` | Curva oscillante `L(E)` / `f(αa)` e proiezione sul pannello della condizione |
| | `P`, `P_eff`, `V_0`, `aV_0` | `VG` | Slider barriera/potenziale, barriere `V(x)` in spazio reale, indicatori di gap |
| | `E` | `E` | Bande permesse `E(k)` |
| | `W`, `t` | `t` | Approssimazione a coseno e larghezza di banda `W` |
| | `m^*` | `mstar` | Overlay parabola/massa efficace |
| **3. Elettroni quasi liberi** | `k`, `k'` | `k` | Cursore `k`, ramo `k'` e stato attivo |
| | `E_k`, `E_k'`, `E_0` | `Ek` | Parabole libere imperturbate |
| | `V_G`, `E_g` (1° gap) | `VG` | Slider `V_G`, componente 1 del potenziale reale e bande di gap a `±π/a` |
| | `V_{2G}`, `E_g` (2° gap) | `V2G` | Slider `V_{2G}`, componente 2 e gap a `±2π/a` |
| | `a`, `G` | `a` | Slider `a`, reticolo e bordi di zona `±π/a` |
| | `E_±` | `E` | Curve perturbate a due onde / modello completo |
| | `ψ_c`, `ψ_s` | `psi` | Onde stazionarie e densità `|ψ|²` in spazio reale |
| | `m^*_±` | `mstar` | Curvatura/massa efficace al bordo di zona |
| **4. Legami forti** | `k` | `k` | Cursore `k` e fase dell'onda di Bloch sugli atomi |
| | `a` | `a` | Slider distanza interatomica e posizione ioni nella catena |
| | `E`, `E_s`, `E_p`, `E_±` | `E` | Curve delle bande `E(k)` |
| | `Ē_n`, `Ē_s`, `Ē_p`, `E_A`, `E_B` | `Ek` | Livelli atomici di riferimento / asse `E_A, E_B` |
| | `t`, `t(R)`, `t_s`, `|t_p|`, `t²`, `W` | `t` | Slider/ampiezze di salto `t`, larghezze di banda `W` e grafico estremi |
| | `E_g` | `VG` | Gap in `π/a` tra le bande |
| | `ψ_k`, `b_A`, `b_B` | `psi` | Orbitali atomici, coefficienti e `|ψ|²` in spazio reale |
| | `m^*_{s,fondo}`, `m^*_c`, `m^*_v` | `mstar` | Overlay curvatura di massa efficace ai minimi/massimi |
| **5. Metodo k·p** | `E_n`, `E_c`, `E_{hh}`, `E_{lh}`, `E_{so}`, `E_±`, `E_{|X⟩,|Y⟩}` | `E` | Bande nel `KpBandPlot` e livelli in `GammaLevelsCanvas` |
| | `k`, `\mathbf{k}` | `k` | Cursore vicino a `Γ` e asse `k (Å⁻¹)` |
| | `m^*`, `m_c`, `m_{lh}`, `m_{so}`, `m_{hh}` | `mstar` | Contributi e indicatore massa efficace in `MassContributionsBar` e `KpBandPlot` |
| | `m_0` | `Ek` | Termine libero `+1` in `MassContributionsBar` e parabola libera |
| | `E_g` | `VG` | Slider `E_g`, freccia/quota del gap diretto in `Γ` |
| | `Δ` | `Delta` | Slider `Δ`, banda split-off `so`, quota `Δ` e contributo `so` in barra |
| | `E_P`, `P` | `EP` | Slider `E_P`, frecce di accoppiamento in `GammaLevelsCanvas` e rami accoppiati |
| **6. Pseudopotenziale** | `V_{ps}`, `V_G`, `V^s_{|G|^2}` | `VG` | Slider `V_3^s, V_8^s, V_{11}^s`, pseudopotenziale in spazio reale e marcatori `V^s` in `FormFactorCanvas` |
| | `V^a_{|G|^2}` | `V2G` | Controllo `V^a` (zincoblenda) e marcatori romboidali `V^a` in `FormFactorCanvas` |
| | `ψ^f_k` | `psi` | Parte liscia `ψ^f(r)` in `RealSpacePseudoCanvas` e barre `|c_G|^2` in `ShellWeightsBar` |
| | `k` | `k` | Stato scelto lungo `L–Γ–X–W–K–Γ` |
| | `E`, `E(k)` | `E` | Bande `EpmBandPlot` (valenza + conduzione) e punto selezionato |
| | `E_F` | `EF` | Livello di riferimento `v(0) = -2/3 E_F` e potenziale chimico `μ` |

---

## Altezze CSS/DOM misurate dei `<canvas>` nelle 6 sezioni (build finale)

Valori rilevati con `getBoundingClientRect()` (in pixel CSS) e stato `.stage` (`scrollHeight / clientHeight`) alle tre risoluzioni richieste:

| Sezione | Canvas (indice e vista) | `1440×900` (`L × H`) | `1100×800` (`L × H`) | `800×700` (`L × H`) |
|---|---|---|---|---|
| **1. Reticolo vuoto** | `canvas[0]` Spazio reale | `820,0 × 257,3` | `540,0 × 159,7` | `490,0 × 123,5` |
| | `canvas[1]` Diagramma `E(k)` (3 schemi) | `820,0 × 478,6` | `540,0 × 371,5` | `490,0 × 307,2` |
| | *Stage `.stage` (`maxChildBottom / height`)* | `900,0 / 900,0` (no scroll) | `800,0 / 800,0` (no scroll) | `700,0 / 700,0` (no scroll) |
| **2. Kronig–Penney** | `canvas[0]` Spazio reale (`V(x)`, `\|ψ\|²`) | `820,0 × 249,9` | `540,0 × 187,4` | `490,0 × 154,0` |
| | `canvas[1]` Condizione `L(E)` ed `E(k)` | `820,0 × 463,6` | `540,0 × 315,9` | `490,0 × 248,7` |
| | *Stage `.stage` (`maxChildBottom / height`)* | `900,0 / 900,0` (no scroll) | `800,0 / 800,0` (no scroll) | `700,0 / 700,0` (no scroll) |
| **3. Elettroni quasi liberi** | `canvas[0]` Spazio reale (`V(x)`, `\|ψ\|²`) | `820,0 × 237,2` | `540,0 × 185,4` | `490,0 × 153,1` |
| | `canvas[1]` Diagramma a bande `E(k)` | `820,0 × 442,6` | `540,0 × 350,4` | `490,0 × 282,3` |
| | *Stage `.stage` (`maxChildBottom / height`)* | `900,0 / 900,0` (no scroll) | `800,0 / 800,0` (no scroll) | `700,0 / 700,0` (no scroll) |
| **4. Legami forti** | `canvas[0]` Spazio reale (catena, orbitali) | `820,0 × 234,5` | `540,0 × 175,1` | `490,0 × 153,1` |
| | `canvas[1]` Diagramma `E(k)` | `820,0 × 437,8` | `540,0 × 332,2` | `490,0 × 273,0` |
| | *Stage `.stage` (`maxChildBottom / height`)* | `900,0 / 900,0` (no scroll) | `800,0 / 800,0` (no scroll) | `732,3 / 700,0` (scroll attivo) |
| **5. Metodo k·p** | `canvas[0]` `GammaLevelsCanvas` | `820,0 × 160,0` | `540,0 × 111,5` | `490,0 × 79,2` |
| | `canvas[1]` `MassContributionsBar` | `820,0 × 101,8` | `540,0 × 49,7` | `490,0 × 44,5` |
| | `canvas[2]` `KpBandPlot` | `820,0 × 373,7` | `540,0 × 250,6` | `490,0 × 220,8` |
| | *Stage `.stage` (`maxChildBottom / height`)* | `900,0 / 900,0` (no scroll) | `800,0 / 800,0` (no scroll) | `749,8 / 700,0` (scroll attivo) |
| **6. Pseudopotenziale** | `canvas[0]` `RealSpacePseudoCanvas` | `405,0 × 159,9` | `265,0 × 88,6` | `240,0 × 108,2` |
| | `canvas[1]` `FormFactorCanvas` | `405,0 × 158,9` | `265,0 × 87,6` | `240,0 × 89,2` |
| | `canvas[2]` `EpmBandPlot` | `820,0 × 248,2` | `540,0 × 182,8` | `490,0 × 193,5` |
| | `canvas[3]` `ShellWeightsBar` | `820,0 × 96,5` | `540,0 × 71,1` | `490,0 × 75,3` |
| | *Stage `.stage` (`maxChildBottom / height`)* | `900,0 / 900,0` (no scroll) | `800,0 / 800,0` (no scroll) | `836,7 / 700,0` (scroll attivo) |
