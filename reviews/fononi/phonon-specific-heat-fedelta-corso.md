# Revisione fedeltà al corso — Sezione 6: Calore specifico del reticolo e modello di Debye

- **Revisore**: `fedelta-corso`
- **Sezione revisionata**: `src/renderer/src/sections/phonon-specific-heat/` (`strings.ts`, `formulas.ts`, `manifest.ts`, `model.ts`, `store.ts`, `PhononSpecificHeatSection.tsx`, `SpecificHeatCurveView.tsx`, `SpectrumDebyeView.tsx`) e `src/renderer/src/physics/specificHeat.ts`
- **Fonti uniche di riferimento**: `materiale/parte6/dispensa.pdf` (Lezione 4: §§20–23 pp. 49–59, §25 pp. 60–62, §26 pp. 62–64, Figg. 22–27, Tabb. 2–4, eqq. 52–59 e 61–62) e `materiale/parte6/riferimento-formule.md`
- **Verdetto**: **da correggere**

---

## 1. Sintesi della verifica

La Sezione 6 è fisicamente e didatticamente molto solida, segue con grande precisione la progressione storica della Lezione 4 (Dulong–Petit → Einstein → Debye → Van Hove & analogia corpo nero → Confronto completo) e non presenta errori **bloccanti**:
- **Formule e limiti asintotici conformi**: Dulong–Petit $C_V = 3R \approx 24{,}943\text{ J mol}^{-1}\text{K}^{-1}$ (eq. 52), funzione di Einstein $\mathcal{E}(x) = x^2 e^x/(e^x - 1)^2$ con $\mu = 0$ e limiti alta/bassa $T$ (eqq. 53–55, correzione $-\frac{1}{12}(\Theta_E/T)^2$), densità degli stati di Debye per singola polarizzazione $g(\omega) = V\omega^2/(2\pi^2 v_s^3)$ con totale $3g(\omega)$ normalizzato a $3N$ (eqq. 56–57, nota reale $3/v_s^3 \to 1/v_L^3 + 2/v_T^3$), integrali $U_{\mathrm{term}}$ e $C_V^{\mathrm{D}}$ (eq. 58), asintoto alta $T$ $[1 - \frac{1}{20}(\Theta_D/T)^2]$, legge $T^3$ $\frac{12\pi^4}{5}R(T/\Theta_D)^3 \simeq 233{,}78\,R(T/\Theta_D)^3$ (eq. 59) con criterio di validità $T \lesssim \Theta_D/50$ e confronto quantitativo a $\Theta_D/10$ ($\approx 3\%$ di sovrastima di $T^3$ e fattore $\sim 17$ rispetto a Einstein con $\Theta_E = \Theta_D$), DOS 1D con singolarità di Van Hove (§23.2), eq. (61) e analogia corpo nero $\tilde{u}_{\mathrm{ph}}$ vs $\tilde{u}_\gamma$ con rapporto $3/2$ (eq. 62).
- **Struttura pedagogica a 4 parti e pulizia testuale**: tutte e cinque le tappe in `strings.ts:114-215` hanno i tre blocchi aperti (`L’idea`, `Come intervengono i parametri`, `Cosa provare`), seguiti da `<details className="panel-details">` (*Dettagli formali*, **chiuso di default** in `PhononSpecificHeatSection.tsx:179`) e dalla nota `.foot`. Assenza totale di sintassi Markdown (`**` o `*`) e di riferimenti a numeri di slide o nomi di file; uso corretto della virgola decimale e dei nomi italiani della dispensa.
- **Verifiche eseguite**:
  - `npx.cmd vitest run src/renderer/src/physics/specificHeat.test.ts --reporter=verbose` → **5/5 test superati**.
  - Validazione automatica con `katex` (`throwOnError: true`, `strict: 'warn'` tranne `htmlExtension`) su tutte le **187** espressioni `$…$` di `strings.ts` e le **28** formule di `formulas.ts` / `manifest.ts` / `PhononSpecificHeatSection.tsx` → **215/215 valide, 0 errori, 0 warning**.
  - Verifica che tutti gli 8 identificatori `q=...` usati in `\htmlData` (`T`, `CV`, `Ek`, `Theta`, `omegaOpt`, `v`, `k`, `omega`) esistano in `src/renderer/src/ui/theme.ts`.
  - Confronto puntuale di tutti i 9 preset e dei dati numerici di `MATERIAL_PRESETS` (`specificHeat.ts:424-570`) con Tab. 2 (p. 51), Tab. 3 (p. 58), §20.4 (p. 51), §22.7 (p. 57) e §23.2 (p. 58).

Restano però **3 problemi importanti** (simboli su canvas e trasparenza sulle fonti dei dati) e **3 rifiniture minori**.

---

## 2. Controllo sistematico rispetto alla dispensa

### 2.1 Simboli, formule, convenzioni e italiano

| Grandezza / Formula / Convenzione | Dispensa Parte 6 (Lez. 4) | Codice / UI / Canvas | Esito |
|---|---|---|---|
| Calore specifico molare $C_V$, $3R \approx 24{,}94\text{ J mol}^{-1}\text{K}^{-1}$ | §20.1–20.2 eq. (52) pp. 49–50 | `formulas.ts:27`, `strings.ts:119,222`, `SpecificHeatCurveView.tsx:284` | Conforme |
| Funzione di Einstein $\mathcal{E}(x) = x^2 e^x/(e^x - 1)^2$, $\mu = 0$ | §21.2–21.3 eqq. (53)–(54) pp. 52–53 | `formulas.ts:29,48`, `strings.ts:78-79,139,145,222-223`, `SpectrumDebyeView.tsx:218` | **Su canvas `SpectrumDebyeView.tsx:218` usa `E(...)` invece di `ℰ(...)`** (v. **I2**; anche `strings.ts:91`) |
| Limiti Einstein: alta $T$ $-\frac{1}{12}(\Theta_E/T)^2$, bassa $T$ eq. (55) | §21.4–21.5 eq. (55) p. 53 | `strings.ts:223`, `formulas.ts:49`, `specificHeat.ts:123-135` | Conforme |
| DOS di Debye per polarizzazione $g(\omega) = V\omega^2/2\pi^2 v_s^3$, totale $3g$, normalizzata a $3N$ | §22.3–22.4 eqq. (56)–(57) pp. 54–55 | `formulas.ts:53`, `strings.ts:159,229`, `specificHeat.ts:272-301` | Conforme |
| Energia e calore specifico di Debye $U_{\mathrm{term}}$, $C_V^{\mathrm{D}}$, alta $T$ $-\frac{1}{20}$, legge $T^3$ eq. (59) | §22.5–22.7 eqq. (58)–(59) pp. 55–57 | `formulas.ts:31,54,63`, `strings.ts:230`, `specificHeat.ts:164-231` | Conforme |
| Sfera di Debye ($k_D$, $k_T/k_D = T/\Theta_D$, volume $(T/\Theta_D)^3$) | §22.4 Fig. 24 p. 55; §22.7 p. 56 | `SpectrumDebyeView.tsx:578-740`, `strings.ts:159,205` | Conforme per Debye; in Einstein disegna anello in spazio $\mathbf{k}$ (v. **M2**) |
| DOS 1D e singolarità di Van Hove ($v_g = 0$ ai bordi di zona, $\nabla_{\mathbf{k}}\omega = \mathbf{0}$) | §23.2 Fig. 27 pp. 58–59 | `formulas.ts:58`, `strings.ts:179,185,236`, `SpectrumDebyeView.tsx:199,223,335` | Asse X riporta `ω / ω_D` anche con tacca `ω_{max}` (v. **M1**) |
| Eq. (61) e densità di energia $\tilde{u}_{\mathrm{ph}}$ vs $\tilde{u}_\gamma$ (3 vs 2 pol.) | §25.2–25.3 eqq. (61)–(62) pp. 61–62 | `formulas.ts:33,59`, `strings.ts:179,185,236`, `SpectrumDebyeView.tsx:562` | **Manca la tilde su `$u_{ph}$` in `SpectrumDebyeView.tsx:562`** (v. **I1**) |
| Virgola decimale, italiano, zero `**`/`*`, zero slide/file, zero underscore grezzi visibili | Convenzioni `fedelta-corso` | Tutti i file della sezione | Conforme in testi visibili e canvas; 3 underscore grezzi in `ariaByStage` (`strings.ts:90-92`, v. **M3**) |

### 2.2 Struttura pedagogica e copertura «Cosa devi saper fare» / «Errori tipici» (§26)

- **Struttura in 4 parti (`PhononSpecificHeatSection.tsx:167-196`, `strings.ts:114-242`)**:
  - Tutte le 5 tappe (`dulong-petit`, `einstein`, `debye`, `beyond-1953`, `comparison`) presentano i tre blocchi brevi sempre visibili (`L’idea`, `Come intervengono i parametri`, `Cosa provare`) collegati ai colori delle grandezze tramite `\htmlData{q=...}`.
  - Il riquadro `<details className="panel-details">` (*Dettagli formali*) è chiuso di default (`PhononSpecificHeatSection.tsx:179`) e raccoglie tutte le derivazioni formali, i limiti asintotici e gli errori tipici di §26.
  - Chiude la scheda la nota `<p className="foot">` (`strings.ts:242`).

- **Copertura §26 *Cosa devi saper fare* (p. 62) ed *Errori tipici* (pp. 62–63)**:
  - **Punti 1–4** (equiripartizione e dati 77 K / 273 K; Einstein eq. 54 e limiti/congelamento; DOS di Debye eq. 56 e $\omega_D, \Theta_D$; $U_{\mathrm{term}}$ eq. 58, limite $3R$ e legge $T^3$ eq. 59 con $\pi^4/15$): **coperti** (con lieve margine di integrazione su $\log C_V = \log A + p\log T$ e $N(k) = Vk^3/6\pi^2$ in *Dettagli formali*, v. **M3**).
  - **Punto 5** (limiti di Debye: DOS reale, picchi di Van Hove, rami ottici, anarmonicità, esattezza a $T \to 0$ e $T \to \infty$): **coperto** (utile citare esplicitamente anche i rami ottici e l’anisotropia in `strings.ts:236`, v. **M3**).
  - **Punto 6** (§24 luce IR e fononi ottici): escluso per architettura del capitolo (già trattato nella Sezione 2 *Catena biatomica*, coerente con il perimetro §§20–23, §25).
  - **Punto 7** (insieme canonico e corpo nero $\tilde{u} \propto T^4$ con 3 vs 2 polarizzazioni): analogia corpo nero ed eq. (61)–(62) **coperte**; il passaggio iniziale da $Z = e^{-\beta E_0}\prod_j (1-e^{-\beta\hbar\omega_j})^{-1}$ è solo accennabile in *Dettagli formali* (v. **M3**).
  - **Errori tipici (tutti quelli pertinenti ai §§20–23, §25)**: coperti tutti in `strings.ts:119,125,139,179,236,237`, inclusi: $\Theta_E \neq \Theta_D$ ($\Theta_E \sim 0{,}7\text{–}0{,}8\,\Theta_D$), Einstein è quantistico e non classico, fattore $3$ tra $g(\omega)$ e $3g(\omega)$ (normalizzata a $3N$), validità asintotica $T \lesssim \Theta_D/50$ ($\approx 3\%$ a $\Theta_D/10$), taglio $\omega_D$ nell’analogia coi fotoni, caduta anche nei dielettrici (Si, diamante) e valori sperimentali sopra $3R$ in Tab. 2 (Na $27{,}6$, Pb $26{,}7$ a $273\text{ K}$).

### 2.3 Numeri, preset e trasparenza sulle fonti

- **Tab. 2 (p. 51) e Tab. 3 (p. 58)**: tutti i valori di $\Theta_D$ e i punti a $77\text{ K}$ e $273\text{ K}$ dei 9 preset (`Cu`, `Al`, `Si`, `C`, `Fe`, `Au`, `Na`, `Pb`, `Cs`) in `specificHeat.ts:424-570` coincidono esattamente con le Tabb. 2 e 3 della dispensa, inclusi la nota su Na ($\Theta_D = 158\text{ K}$ da Kittel, non riportato nelle slide), i due valori di $\Theta_D$ per il diamante ($2230\text{ K}$ di Tab. 3 vs $1880\text{ K}$ nel grafico delle slide, §20.4 p. 51) e il punto del diamante a $77\text{ K}$ ($\approx 0{,}08\text{ J mol}^{-1}\text{K}^{-1}$, §22.7 p. 57).
- **Trasparenza sulle fonti in UI**: restano due punti da sistemare (**I3**): (a) il valore del diamante a $77\text{ K}$ viene etichettato come `Dati Tab. 2` nella legenda e nella tabella valori pur essendo un calcolo teorico del §22.7; (b) le velocità del suono `approxSoundSpeedMS` usate per $\tilde{u}_{\mathrm{ph}}$ nella tappa `1953 Oltre Debye` sono valori indicativi esterni alla dispensa, non dichiarati in UI o nella nota `.foot`.

---

## 3. Problemi riscontrati

### Bloccanti

Nessuno.

---

### Importanti

#### I1. Simbolo della densità di energia fononica privo di tilde su canvas (`$u_{ph}$` invece di `$\tilde{u}_{\mathrm{ph}}$` / `ũ_{ph}`)
- **Dove**: `src/renderer/src/sections/phonon-specific-heat/SpectrumDebyeView.tsx:562`.
- **Cosa differisce**: nella dispensa la densità di energia per unità di volume $(U - E_0)/V$ è indicata ovunque con la tilde **$\tilde{u}$** ($\tilde{u}_{\mathrm{ph}}$, $\tilde{u}_{\mathrm{fotoni}}$), così come in `formulas.ts:33,59`, `strings.ts:185,236` e `specificHeat.ts:11`. Nel riepilogo numerico del pannello `Corpo nero T⁴` (`SpectrumDebyeView.tsx:562`), il canvas stampa invece `` `$u_{ph} = ${formatSci(model.blackBody.phononEnergyDensityJm3)}$ J/m³` `` senza la tilde, generando ambiguità con l’energia interna $U$ o con lo spostamento atomico $u$.
- **Riferimento dispensa**: Lezione 4, §25.3 eq. (62) pp. 61–62 e `riferimento-formule.md` riga 73.
- **Correzione proposta**: sostituire `$u_{ph}` con `$ũ_{ph}` (`\u0169`, supportato come carattere base da `drawMathText` in `canvas.ts`) in `SpectrumDebyeView.tsx:562` (ed eventualmente mostrare nella stessa riga o sotto la velocità $v_s$ adottata, v. **I3**).

#### I2. Simbolo della funzione di Einstein su canvas scritto come $E$ (`$E(ħω/k_B T)$`) invece di $\mathcal{E}$
- **Dove**: `src/renderer/src/sections/phonon-specific-heat/SpectrumDebyeView.tsx:218` (e `strings.ts:91` in `ariaByStage.einstein`).
- **Cosa differisce**: nella dispensa $E$ denota l’energia ($E_{\mathrm{1D}}$, $E_n$, $E_0$), mentre il fattore di attivazione termica di un singolo modo è introdotto con la lettera calligrafica **$\mathcal{E}(x) = x^2 e^x/(e^x-1)^2$** (proprio per non confonderlo con l’energia). Tutta la sezione (`formulas.ts`, `strings.ts:78-79,145,222-223`, `specificHeat.ts:92`) rispetta questa distinzione usando `\mathcal{E}` / `ℰ`, ma sull’asse verticale del grafico in modalità `1907 Einstein` (`SpectrumDebyeView.tsx:218`) compare `'Peso $E(ħω/k_B T)$'` con `E` normale.
- **Riferimento dispensa**: Lezione 4, §21.3 eq. (54) p. 53 («La funzione $\mathcal{E}(x)$ (che si indica qui con $\mathcal{E}$, nostra notazione)») e §25.2 eq. (61) p. 61.
- **Correzione proposta**: in `SpectrumDebyeView.tsx:218` usare il simbolo Unicode calligrafico `'Peso $ℰ(ħω/k_B T)$'` (`\u2130`, verificando la resa del font nel browser) oppure `'Peso termico'` coerente con la legenda `$\\mathcal{E}(\\hbar\\omega/k_B T)$` di `strings.ts:79`. In `strings.ts:91` scrivere `'Calore specifico di Einstein con funzione di attivazione ℰ(Θ_E/T)'` (o senza underscore grezzi, v. **M3**).

#### I3. Trasparenza sulle fonti: diamante a $77\text{ K}$ etichettato «Dati Tab. 2» e velocità del suono `approxSoundSpeedMS` non dichiarate a schermo
- **Dove**:
  - `src/renderer/src/sections/phonon-specific-heat/strings.ts:62, 106`, `SpecificHeatCurveView.tsx:132, 446-473`, `PhononSpecificHeatSection.tsx:326` (`Dati Tab. 2`);
  - `src/renderer/src/physics/specificHeat.ts:408, 431-565` (`approxSoundSpeedMS`), `model.ts:168` (`3800` m/s fallback), `SpectrumDebyeView.tsx:550-575` e `strings.ts:242` (`.foot`).
- **Cosa differisce**:
  1. Nella dispensa la **Tab. 2** (p. 51) contiene Rame, Alluminio, Oro, Piombo, Ferro, Sodio e Silicio, **non il Diamante**. Il valore $C_V \approx 0{,}08\text{ J K}^{-1}\text{mol}^{-1}$ a $77\text{ K}$ per il diamante proviene invece dall’esempio teorico del **§22.7** (p. 57, legge $T^3$ eq. 59 con $\Theta_D = 2230\text{ K}$). Nella legenda del grafico e nella riga della scheda valori (`strings.ts:62,106`), quando è attivo *Diamante*, quel punto viene comunque presentato sotto l’etichetta `Dati Tab. 2`.
  2. Nella tappa `1953 Oltre Debye`, il valore numerico di $\tilde{u}_{\mathrm{ph}}$ (`SpectrumDebyeView.tsx:562`) è calcolato usando `approxSoundSpeedMS` (es. $3800\text{ m/s}$ per Rame e in modalità *Libero*, $12000\text{ m/s}$ per Diamante, ecc.). Tali velocità del suono sono stime indicative esterne alla dispensa (che in §25.3 usa una $c$ simbolica), ma né il riquadro `Corpo nero T⁴` (che non stampa nemmeno il $v_s$ usato) né la nota `.foot` (`strings.ts:242`) lo dichiarano esplicitamente.
- **Riferimento dispensa**: Lezione 4, Tab. 2 p. 51, §22.7 p. 57, §25.3 p. 62; regola 5 di `.agents/skills/fedelta-corso/SKILL.md` («Se un dato è esterno alla dispensa, è dichiarato esplicitamente a schermo?»).
- **Correzione proposta**:
  - Per i punti sperimentali/di riferimento: distinguere l’etichetta quando `source === 'dispensa-diamond-77k'` (ad esempio `Riferimenti dispensa` oppure, specificamente per Diamante, `Stima §22.7 (T³)` nella tabella valori e legenda `Dati Tab. 2 / §22.7`).
  - Per `approxSoundSpeedMS`: indicare nel pannello `Corpo nero T⁴` la velocità indicativa usata (es. `v_s ≈ 3800 m/s`) e aggiungere nella nota `.foot` (`strings.ts:242`) una breve precisazione che le velocità del suono medie $v_s$ usate per la stima dimensionale di $\tilde{u}_{\mathrm{ph}}$ sono valori indicativi di letteratura esterni alla dispensa.

---

### Minori

#### M1. Etichetta dell’asse orizzontale `ω / ω_D` mantenuta nella tappa `1953 Oltre Debye` quando la tacca a `1` diventa `ω_{max}`
- **Dove**: `src/renderer/src/sections/phonon-specific-heat/SpectrumDebyeView.tsx:199, 223` (e `model.ts:96, 179`).
- **Cosa differisce**: nella tappa `1953 Oltre Debye`, la tacca a `w = 1` passa da `ω_D` a `ω_{max}` (`SpectrumDebyeView.tsx:199`), mentre il titolo dell’asse orizzontale (`SpectrumDebyeView.tsx:223`) resta fisso su `'ω / ω_D'`. Inoltre la curva `Catena 1D` in `model.ts:96` usa implicitamente $\Theta_{\max} = \Theta_D$ (e in unità molari $3R$ come confronto su $3$ rami 1D indipendenti, `specificHeat.ts:315-317`).
- **Riferimento dispensa**: Lezione 4, §23.2 Fig. 27 pp. 58–59.
- **Correzione proposta**: in `SpectrumDebyeView.tsx:223`, quando `is1953` è vero, scrivere `'ω / ω_D, ω / ω_{max}'` (o `'ω / ω_{max}'` con nota $\Theta_{\max} = \Theta_D$), e accennare in `strings.ts:185` che per il confronto si adotta $\Theta_{\max} = \Theta_D$ (e $3$ copie 1D per il confronto a $3R$).

#### M2. Schema in spazio $\mathbf{k}$ nella tappa `1907 Einstein` (anello a raggio proporzionale a $\Theta_E/\Theta_D$)
- **Dove**: `src/renderer/src/sections/phonon-specific-heat/SpectrumDebyeView.tsx:579, 631-657`.
- **Cosa differisce**: in `1907 Einstein`, il pannello laterale destro conserva il titolo `'Sfera di Debye (spazio k)'` e disegna nella 1BZ un cerchio di raggio $r_E = r_{\mathrm{Debye}} \cdot (\Theta_E/\Theta_D)$ etichettato `ω_E`. Nella dispensa (§21.1 p. 52, Tab. 4 p. 63) gli oscillatori di Einstein hanno $\omega = \omega_E$ **su tutta la 1BZ** (nessuna relazione lineare $\omega = v_s k$), a differenza del modello di Debye in cui il raggio in $\mathbf{k}$ corrisponde a $\omega/v_s$ (Fig. 24 p. 55).
- **Riferimento dispensa**: Lezione 4, §21.1 p. 52, §22.4 Fig. 24 p. 55, Tab. 4 p. 63.
- **Correzione proposta**: per evitare il misconcetto che i modi di Einstein giacciano su una circonferenza di raggio $k_E = \omega_E/v_s$, cambiare in modalità Einstein il titolo/didascalia del pannello destro (o evidenziare uniformemente tutti i punti $\mathbf{k}$ della 1BZ alla stessa frequenza $\omega_E$, anziché un anello di raggio $\Theta_E/\Theta_D$).

#### M3. Rifiniture su `ariaByStage` e integrazioni opzionali per copertura integrale del §26
- **Dove**: `src/renderer/src/sections/phonon-specific-heat/strings.ts:90-92, 222, 229, 236`.
- **Dettagli**:
  - In `strings.ts:90-92` (`ariaByStage`, solo attributo `aria-label`, non visibile a schermo) compaiono underscore grezzi (`C_V`, `E(Θ_E/T)`), sostituibili con testo discorsivo o Unicode (`Cᵥ`, `ℰ(Θᴇ/T)`).
  - In *Dettagli formali* (`strings.ts:222-237`), già molto completi, si possono aggiungere tre brevi incisi per coprire al 100% i punti 1, 5 e 7 di *Cosa devi saper fare* (§26 p. 62): (a) la relazione $\log C_V = \log A + p\log T$ (§20.4 p. 51) sul perché pendenza $3$ in log-log equivale a $C_V \propto T^3$; (b) il conteggio $N(k) = Vk^3/6\pi^2$ nella sfera di Debye (§22.3 p. 54); (c) l’accenno esplicito all’assenza dei rami ottici e dell’anisotropia tra i limiti del modello di Debye (§23.3 p. 59) e alla funzione di partizione canonica $Z = e^{-\beta E_0}\prod_j(1 - e^{-\beta\hbar\omega_j})^{-1}$ (§25.1 p. 61).

---

## 4. Verdetto finale

**Da correggere.** La fisica del calore specifico del reticolo (Dulong–Petit, Einstein, Debye, Van Hove, analogia corpo nero) e i dati tabellari della Parte 6 sono implementati con grande rigore, la struttura didattica in 4 parti con *Dettagli formali* chiuso e senza Markdown è rispettata e tutte le 215 espressioni KaTeX risultano valide. Corretti i 3 punti importanti **I1–I3** (ripristino della tilde in `$ũ_{ph}$` su canvas, uso di `ℰ` al posto di `E` per la funzione di Einstein sull’asse in modalità Einstein, e distinzione esplicita tra `Dati Tab. 2`, stima §22.7 per il diamante a $77\text{ K}$ e velocità indicative $v_s$ esterne alla dispensa), la sezione raggiungerà piena fedeltà al corso.
