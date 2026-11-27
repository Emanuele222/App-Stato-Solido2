# Revisione fedeltà al corso — Sezione 5: Modi quantizzati e processi Umklapp

- **Revisore**: `fedelta-corso`
- **Sezione revisionata**: `src/renderer/src/sections/phonon-quantum/` (`strings.ts`, `formulas.ts`, `manifest.ts`, `PhononQuantumSection.tsx`, `QuantumOscillatorView.tsx`, `QuantumChainView.tsx`, `Umklapp1BZView.tsx`, `UmklappDispersionView.tsx`, più verifica di supporto su `model.ts` e `store.ts`) e `src/renderer/src/physics/phononQuantum.ts`
- **Fonti uniche di riferimento**: `materiale/parte6/dispensa.pdf` (Lezione 2 §11 eqq. 29–30 p. 28, §12 pp. 29–30; Lezione 3 §§15–18 pp. 37–47, Figg. 19–21 pp. 41, 45–46, eqq. 40–42 e 45–51, §19 pp. 47–48; richiami a Lezione 1 §3 p. 9 e §4.1 pp. 9–10) e `materiale/parte6/riferimento-formule.md`
- **Verdetto**: **da correggere**

---

## 1. Sintesi della verifica

L’impianto fisico e didattico della sezione è molto solido e aderente alla dispensa Parte 6:
- **Zero problemi bloccanti**: la quantizzazione dei modi normali $E_n = (n + \frac{1}{2})\hbar\omega$ (eq. 29), la statistica di Bose–Einstein con potenziale chimico $\mu = 0$ (eq. 30, eq. 45), l’oscillatore armonico classico vs quantistico con autofunzioni normalizzate di Hermite $\Psi_n(x)$, la lunghezza caratteristica $a_{\mathrm{ho}} = \sqrt{\hbar/M\omega}$, l’ampiezza di punto zero $\Delta x_{\mathrm{zp}} = a_{\mathrm{ho}}/\sqrt{2} \approx 0{,}042\,\text{Å}$ ($\approx 1{,}7\%$ di $a = 2{,}50\,\text{Å}$, §18.4 p. 47), la probabilità di tunneling nello stato fondamentale $\operatorname{erfc}(1) \approx 0{,}1573$ (§18.3 p. 46), il principio di corrispondenza di Bohr ($n \gg 1$), la regola di selezione reticolare (eq. 41) e i processi Normali / Umklapp nella prima zona di Brillouin $(-\pi/a, \pi/a]$ con l’esempio numerico $0{,}7 + 0{,}6\,\pi/a \to -0{,}7\,\pi/a$ (§16.2 p. 40, Fig. 19 p. 41) coincidono fedelmente con la dispensa.
- **Assenza delle imprecisioni delle slide**: sono riportate esplicitamente tutte e tre le precisazioni di §11 (p. 28) e §15.3 (p. 39) ($\hbar\omega$ è l’energia del quanto, il fonone non ha spin in senso proprio, $\hbar\mathbf{k}$ è un quasi-impulso) e la correzione dei segni nello scattering elettrone–fonone di §16.2 eq. (42) p. 40 (stesso segno $+$ per assorbimento e $-$ per emissione in entrambe le equazioni).
- **Struttura a 4 parti e pulizia testuale**: entrambe le modalità (`quantBlocks` e `umklappBlocks`) seguono la struttura snella in 3 blocchi aperti (`L’idea`, `Come intervengono i parametri`, `Cosa provare`) più il riquadro `<details className="panel-details">` «Dettagli formali» chiuso di default e la nota `.foot` (`strings.ts:124-193`); verificata l’assenza totale di sintassi Markdown (`**` o `*`) in `strings.ts`, l’uso della virgola decimale (`ui/format.ts` e stringhe LaTeX) e l’assenza di numeri di slide o nomi di file nei testi.
- **Verifiche eseguite**:
  - Test di fisica: `.\.tools\node\node.exe node_modules/vitest/vitest.mjs run src/renderer/src/physics/phononQuantum.test.ts` → **9/9 test superati**.
  - Controllo automatico KaTeX (`throwOnError: true`, `strict: 'warn'` tranne `htmlExtension`) su tutte le **114** espressioni tra `$…$` di `strings.ts` e le formule di `formulas.ts`: **0 errori** e **0 occorrenze** di `**` / `*`.
  - Verifica numerica indipendente in Python dei valori di riferimento di §3, §18.4 e §16.2 per tutti i preset della sezione.

Restano però **5 problemi importanti**:
1. **I1**: etichetta matematica dimensionalmente errata `P(u)·a_{ho}` sull’asse verticale dell’oscillatore (`strings.ts:70`) invece di `P(x)·a_{ho}` (o `P(u)`).
2. **I2**: convenzione di segno di $G$ nei processi Umklapp (`k₁ + k₂ = k₃ − G` con `G = −2π/a` in `formulas.ts:39`, `strings.ts:150`, canvas e valori) opposta a §16.2 eq. (40) e Fig. 19(b) (`k₁ + k₂ = k₃ + G` con freccia `-G`), e non raccordata con eq. (40) citata in *Dettagli formali* (`strings.ts:187`).
3. **I3**: incoerenza `V(Q)` vs `V(x)` in `oscillatorTag` (`strings.ts:45`) e simbolo `x` non definito in `p_n(T) = (1 - e^{-x})e^{-n x}` (`formulas.ts:52`).
4. **I4**: in modalità `Bagno termico T`, la curva punteggiata di riferimento è etichettata `$P_n(x)$` in legenda (`strings.ts:57`) ma usa lo stato residuo `nInt` dello store (`model.ts:89`), per cui provenendo da `n = 20` disegna $P_{20}(x)$ invece di $P_0(x)$.
5. **I5**: simboli con underscore grezzo (`v_g`, `Δx_zp`, `Δx_rms`, `k_BT`, `x_cl`) resi letteralmente su canvas, testate e pannello valori.

Si segnalano inoltre **3 rifiniture minori** (**M1–M3**).

---

## 2. Controllo sistematico rispetto alla dispensa

### 2.1 Simboli, formule, convenzioni e correzioni delle slide

| Grandezza / Formula / Convenzione | Dispensa Parte 6 | Codice / UI (file e righe) | Esito |
|---|---|---|---|
| Costante elastica $C$ (non $\gamma$/$K$), passo $a$, massa $M$ | §3 p. 9; Nota 5 p. 16 | `manifest.ts:140-144`, `formulas.ts:45,64-65`, `strings.ts:62-63` | Conforme |
| Livelli $E_n = (n + \frac{1}{2})\hbar\omega$ e occupazione $\bar{n}(T) = [\exp(\hbar\omega/k_B T) - 1]^{-1}$ ($\mu = 0$) | §11 eqq. (29)–(30) p. 28; §17.3 eq. (45) p. 43 | `formulas.ts:34-37`, `strings.ts:128,180`, `phononQuantum.ts:253,447` | Conforme (`x` non definito in `formulas.ts:52`, v. **I3**) |
| Lunghezza $a_{\mathrm{ho}} = \sqrt{\hbar/M\omega}$, punto zero $\Delta x_{\mathrm{zp}} = a_{\mathrm{ho}}/\sqrt{2}$ | §18.2 p. 44; §18.4 p. 47 | `formulas.ts:45-46`, `strings.ts:173-174`, `phononQuantum.ts:235,246` | Conforme (con $M$ da §18.4) |
| Autofunzioni $\Psi_n(x) = (2^n n!\sqrt{\pi}\,a_{\mathrm{ho}})^{-1/2} H_n(x/a_{\mathrm{ho}})e^{-x^2/2a_{\mathrm{ho}}^2}$ | §18.2 eq. (49) p. 45 | `strings.ts:173`, `phononQuantum.ts:291,316` | Conforme |
| Densità classica $P_{\mathrm{cl}}(x)$ e ampiezza $x_{\mathrm{cl}} = a_{\mathrm{ho}}\sqrt{2n+1}$ (nella dispensa $a$) | §18.1 eq. (46) p. 44; §18.3 p. 46 | `formulas.ts:57-58`, `strings.ts:174`, `QuantumOscillatorView.tsx:417,423` | Conforme con disambiguazione $a \to x_{\mathrm{cl}}$ (v. **M1**) |
| Tunneling in $n=0$: $\int_{\|x\|>a_{\mathrm{ho}}} P_0\,\mathrm{d}x = \operatorname{erfc}(1) \approx 0{,}1573$ e $\Delta x\,\Delta p = \hbar/2$ | §18.2–18.3 eqq. (50)–(51) pp. 45–46 | `strings.ts:106-107,140,174`, `phononQuantum.ts:357` | Conforme |
| Ordinata e titolo della vista oscillatore: $V(x)$, $P(x)\cdot a_{\mathrm{ho}}$ | §18.2–18.3 Figg. 20–21 pp. 45–46 | `strings.ts:45,69,70`, `QuantumOscillatorView.tsx:123,306` | **`P(u)·a_{ho}` errato** (v. **I1**); **`V(Q)` vs `V(x)`** (v. **I3**) |
| Riferimento stato fondamentale in bagno termico | §18.3 pp. 45–46 | `QuantumOscillatorView.tsx:42-47,379-396`, `model.ts:89` | **`$P_n(x)$` usa `nInt` residuo** (v. **I4**) |
| Prima zona $(-\pi/a, \pi/a]$ e ripiegamento $G = \pm 2\pi/a$ | §4.1 p. 10; §13.3 p. 33; §16.2 p. 40 | `formulas.ts:39,63`, `manifest.ts:47-48`, `Umklapp1BZView.tsx:75,345` | **Segno di $G$ opposto a Fig. 19 / eq. (40)** (v. **I2**) |
| Dispersione $\omega(k) = 2\sqrt{C/M}|\sin(ka/2)|$ e $v_g = a\sqrt{C/M}\cos(ka/2)\operatorname{sgn}(k)$ | §3.1 eq. (8) p. 7; §16.2 p. 40 | `formulas.ts:64-65`, `phononQuantum.ts:583-597` | Conforme |
| Precisazioni su fonone ($\hbar\omega$, nessuno spin proprio, quasi-impulso) e segni e–ph eq. (42) | §11 p. 28; §15.3 p. 39; §16.2 eq. (42) p. 40 | `strings.ts:181,187` | Conforme (zero errori delle slide) |
| Virgola decimale, italiano, zero Markdown `**`/`*`, zero riferimenti a slide/file, underscore | Convenzioni `fedelta-corso` | `strings.ts`, `PhononQuantumSection.tsx`, viste canvas | **Underscore grezzi in UI/canvas** (v. **I5**) |

### 2.2 Struttura della scheda guida e copertura «Cosa devi saper fare» ed «Errori tipici»

- **Struttura a 4 parti (`PhononQuantumSection.tsx:251-287`, `strings.ts:122-194`)**:
  - Sia `quantBlocks` sia `umklappBlocks` presentano esattamente i tre blocchi sempre visibili `L’idea`, `Come intervengono i parametri` e `Cosa provare`.
  - Il blocco `<details className="panel-details">` («Dettagli formali») è privo dell’attributo `open` (quindi **chiuso di default**) e raccoglie i passaggi formali (ricorrenza ortonormale di Hermite, limite classico, eq. (45)–(51), eq. (40)–(42)) e le precisazioni sugli errori tipici.
  - Chiude la scheda la nota `<p className="foot">` (`strings.ts:193`), con richiamo puntuale ai paragrafi della dispensa.
  - Nessun `*` o `**` di sintassi Markdown in `strings.ts`; tutte le formule inline usano `$…$` interpretato da `RichText`.

- **Copertura didattica (§12 pp. 29–30 e §19 pp. 47–48)**:
  - *Lezione 2, §12 (p. 29)*: punto 7 di «Cosa devi saper fare» (spettro $(n+\frac{1}{2})\hbar\omega$, definizione di fonone, $\bar{n}$ di Bose–Einstein) e i relativi «Errori tipici» (non dire «$\hbar\omega$ è il fonone» né «spin 0 in senso stretto», non usare $\mu \neq 0$) sono **coperti integralmente**.
  - *Lezione 3, §19 (pp. 47–48)*: punti 5, 6, 7 (parte termodinamica/statistica $\mu=0$ e Bose–Einstein) e 8 (confronto oscillatore classico/quantistico, Hermite, stato fondamentale, tunneling, principio di corrispondenza) sono **coperti integralmente**, così come tutti i sei «Errori tipici» di p. 48 (quasi-impulso $\hbar\mathbf{k}$, segni concordi nello scattering e–ph, distinzione N vs U e resistenza termica, $\mu = 0$, energia di punto zero $\hbar\omega/2 \neq 0$ e $\Delta x\Delta p = \hbar/2$, corrispondenza $P_n \to P_{\mathrm{cl}}$ solo in media e per $n \gg 1$).

### 2.3 Numeri, preset e trasparenza sui dati

- **Scala atomica di riferimento (`manifest.ts:140-144`, `phononQuantum.ts:644`)**: $M = 1{,}05\cdot 10^{-25}\,\text{kg}$ ($\approx 63{,}23\,\text{u}$), $a = 2{,}50\,\text{Å}$, $C = 20\,\text{N/m}$, da §3 (p. 9) e §18.4 (p. 47). Il valore di apertura $\nu = 4{,}4\,\text{THz}$ corrisponde a $\nu_{\max} = 4{,}393\,\text{THz}$ (§3 p. 9: $\nu_{\max} \approx 4{,}4\,\text{THz}$).
- **Preset Modalità A (`manifest.ts:69-100`)**:
  - `Punto zero (n = 0)` ($\nu = 4{,}4\,\text{THz}$): $a_{\mathrm{ho}} = 0{,}0603\,\text{Å}$ (dispensa §18.4: $\approx 0{,}060\,\text{Å}$), $\Delta x_{\mathrm{zp}} = 0{,}0426\,\text{Å}$ (dispensa: $\approx 0{,}042\,\text{Å}$), $\Delta x_{\mathrm{zp}}/a = 1{,}70\%$ (dispensa: $\approx 1{,}7\%$), tunneling $\operatorname{erfc}(1) = 15{,}73\%$ (dispensa §18.3: $\approx 0{,}16$).
  - `Eccitato (n = 2)` e `Limite Bohr (n = 20)`: mostrano rispettivamente $3$ e $21$ massimi di $P_n(x)$ (coerente con Fig. 21 p. 46 e la regola $n + 1$ massimi di §18.2 p. 45).
  - `Bagno termico 300 K` ($\hbar\omega = 18{,}2\,\text{meV}$ vs $k_B T = 25{,}9\,\text{meV}$, $\bar{n} = 0{,}98$, $\Delta x_{\mathrm{rms}} = 2{,}9\%$ di $a$) e `Modo congelato 30 K` ($k_B T = 2{,}6\,\text{meV} \ll \hbar\omega$, $\bar{n} = 0{,}00$, $\Delta x_{\mathrm{rms}} = 1{,}7\%$ di $a$): illustrano direttamente il criterio $\hbar\omega_{\max} \sim k_B T$ di §3 (p. 9) e §11 (p. 28).
- **Preset Modalità B (`manifest.ts:108-134`)**:
  - `Umklapp dispensa §16 (0,7 + 0,6 π/a)`: riproduce esattamente l’esempio di §16.2 (p. 40): $k_1 + k_2 = 1{,}3\,\pi/a$, $k_3 = -0{,}7\,\pi/a$, $v_g(k_1) = +1{,}57\,\text{km/s}$, $v_g(k_2) = +2{,}03\,\text{km/s}$, $v_g(k_3) = -1{,}57\,\text{km/s}$ (flusso invertito).
  - I restanti preset (`0,3 + 0,4`, `−0,7 − 0,6`, `0,6 − 0,4`, `0,5 + 0,5 π/a`) coprono il processo Normale, l’Umklapp simmetrico con $G = +2\pi/a$, lo scontro opposto e il bordo zona superiore $+\pi/a \in (-\pi/a, \pi/a]$.
- **Nota `.foot` (`strings.ts:193`)**: dichiara esplicitamente le fonti della dispensa Parte 6 per formule ed esempi numerici (v. **M3** per il richiamo esplicito a $C = 20\,\text{N/m}$).

---

## 3. Problemi riscontrati

### Bloccanti

Nessuno.

---

### Importanti

#### I1. Etichetta matematica errata sull’asse delle ordinate `P(u)·a_{ho}` (anziché `P(x)·a_{ho}` o `P(u)`)
- **Dove**: `src/renderer/src/sections/phonon-quantum/strings.ts:70` (`probLabel: 'P(u)·a_{ho}'`) e `src/renderer/src/sections/phonon-quantum/QuantumOscillatorView.tsx:306`.
- **Cosa differisce**: il grafico inferiore disegna le densità di probabilità adimensionali in funzione di $u = x/a_{\mathrm{ho}}$, cioè $P_n(u) = |\psi_n(u)|^2 = P_n(x)\cdot a_{\mathrm{ho}}$ (`model.ts:89-96`, `phononQuantum.ts:84-87, 327-331`). Scrivere sull’asse verticale `P(u)·a_{ho}` moltiplica una seconda volta per $a_{\mathrm{ho}}$ la densità già adimensionale $P(u)$, risultando dimensionalmente errato ($a_{\mathrm{ho}}^2 P(x)$).
- **Riferimento dispensa**: Lezione 3, §18.2–18.3 eqq. (46), (49)–(50) pp. 44–46 ($P_n(x) = a_{\mathrm{ho}}^{-1} P_n(u)$, per cui la densità adimensionale plottata è $P(x)\cdot a_{\mathrm{ho}} = P(u)$).
- **Correzione proposta**: sostituire `'P(u)·a_{ho}'` con `'P(x)·a_{ho}'` in `strings.ts:70` (coerente con `'x / a_{ho}'` e la legenda `'$P_n(x)$'`), oppure con `'P(u)'`.

#### I2. Convenzione di segno di $G$ nei processi Umklapp opposta a §16.2 / Fig. 19 e disallineata con *Dettagli formali*
- **Dove**: `src/renderer/src/sections/phonon-quantum/formulas.ts:39` (`k_1 + k_2 = k_3 - G`), `strings.ts:87, 150, 162, 187`, `Umklapp1BZView.tsx:345`, `UmklappDispersionView.tsx:329`, `PhononQuantumSection.tsx:484`.
- **Cosa differisce**: nella dispensa (§16.1–16.2 eq. (40) p. 40 e Fig. 19(b) p. 41) la conservazione è scritta $\sum\mathbf{p} = \sum\mathbf{p}' + \hbar\mathbf{G}$ ovvero $\mathbf{k}_1 + \mathbf{k}_2 = \mathbf{k}_3 + \mathbf{G}$; nell’esempio $k_1 = 0{,}7\,\pi/a$, $k_2 = 0{,}6\,\pi/a$, la freccia di rientro in Fig. 19(b) è etichettata `-G` («sottraendo $G = 2\pi/a$ si ritorna in zona con $k_3 = k_1 + k_2 - G < 0$»). La sezione invece usa `k₁ + k₂ = k₃ − G` con `G = −2π/a` ($k_3 = k_1 + k_2 + G$), ma poi nei *Dettagli formali* (`strings.ts:187`) cita l’eq. (40) della dispensa con il segno `+` (`∑ p = ∑ p' + ħG`) senza spiegare il cambio di segno di $G$ rispetto alla formula viva sopra.
- **Riferimento dispensa**: Lezione 3, §16.1–16.2 eq. (40) p. 40 e Fig. 19(b) p. 41.
- **Correzione proposta**:
  - **Opzione consigliata (allineamento 1:1 con Fig. 19)**: scrivere `k_1 + k_2 = k_3 + G` in `formulas.ts:39` e `strings.ts:150`, mostrando sulla freccia di rientro `-G = -2π/a` (per $k_1 + k_2 > \pi/a$) e `+G` / `-G = +2π/a` (o adeguare `Umklapp1BZView`, `UmklappDispersionView` e `UmklappValues` al vettore sottratto $G$ come in Fig. 19b);
  - **Opzione alternativa**: mantenere `k_1 + k_2 = k_3 - G` ($G$ come vettore aggiunto $k_3 = k_1 + k_2 + G$), ma chiarire esplicitamente in `strings.ts:187` che rispetto alla convenzione della dispensa $\mathbf{k}_1 + \mathbf{k}_2 = \mathbf{k}_3 + \mathbf{G}$ qui $\mathbf{G}$ rappresenta il vettore opposto aggiunto per rientrare nella 1BZ.

#### I3. Incoerenza `V(Q)` vs `V(x)` nell’intestazione della vista oscillatore e simbolo $x$ non definito in `p_n(T)`
- **Dove**: `src/renderer/src/sections/phonon-quantum/strings.ts:45` (`oscillatorTag`) e `src/renderer/src/sections/phonon-quantum/formulas.ts:52` (`p_n(T) = (1 - e^{-x})e^{-n x}`).
- **Cosa differisce**:
  - `strings.ts:45` intitola la vista `Oscillatore del modo: potenziale V(Q) e densità P(x)`, usando `Q` (la coordinata normale di §15.1 a «massa unitaria»), mentre subito sotto la legenda (`strings.ts:61`), l’asse verticale (`strings.ts:69`: `V(x) [ħω]`), l’asse orizzontale (`x / a_{ho}`) e $a_{\mathrm{ho}} = \sqrt{\hbar/M\omega}$ usano ovunque la coordinata fisica $x$.
  - In `formulas.ts:52` compare `p_n(T) = (1 - e^{-x})e^{-n x}` senza definire $x = \hbar\omega/k_B T$, nello stesso pannello in cui $x$ denota la coordinata spaziale dell’oscillatore (e mentre in §11 p. 28 della dispensa $x$ indicava $e^{-\hbar\omega/k_B T}$).
- **Riferimento dispensa**: Lezione 2 §11 eq. (30) p. 28; Lezione 3 §15.1 p. 37, §18.2–18.4 Fig. 20 pp. 44–47.
- **Correzione proposta**: scrivere `potenziale V(x)` in `strings.ts:45`, e in `formulas.ts:52` esplicitare `p_n(T) = (1 - e^{-\hbar\omega/k_B T})e^{-n\hbar\omega/k_B T}` (come già in `strings.ts:180`) oppure aggiungere `,\; x = \tfrac{\hbar\omega}{k_B T}`.

#### I4. Riferimento punteggiato in modalità termica etichettato `$P_n(x)$` ma dipendente dallo stato `n` residuo
- **Dove**: `src/renderer/src/sections/phonon-quantum/QuantumOscillatorView.tsx:42-47, 379-396`, `model.ts:89`, `strings.ts:57`.
- **Cosa differisce**: in modalità `Bagno termico T`, il cursore `n` è nascosto (`PhononQuantumSection.tsx:106-107`) e il commento in `QuantumOscillatorView.tsx:379` indica come riferimento punteggiato `P_0(u)`. Tuttavia la legenda stampa sempre `$P_n(x)$` (generico con $n$ non più controllabile né visibile) e `model.ts:89` calcola `curves` con `nInt` dello store: se lo studente passa da `Limite Bohr (n = 20)` a `Bagno termico T`, sul grafico compare la curva a 21 picchi $P_{20}(x)$ anziché lo stato fondamentale $P_0(x)$.
- **Riferimento dispensa**: Lezione 3 §18.2–18.3 pp. 45–46 (confronto tra distribuzione termica / congelamento e stato fondamentale $P_0(x)$).
- **Correzione proposta**: in modalità `thermal`, calcolare `curves` (o la curva di riferimento punteggiata) fissando `n = 0` e mostrare in legenda `'$P_0(x)$'` (o `'stato fondamentale $P_0(x)$'`).

#### I5. Simboli con underscore grezzo (`v_g`, `Δx_zp`, `Δx_rms`, `k_BT`, `x_cl`) resi letteralmente in UI, testate e canvas
- **Dove**:
  - `QuantumChainView.tsx:294-295, 301`: `Δx_zp = ...` e `Δx_rms = ...` disegnati con `ctx.fillText(...)`.
  - `QuantumOscillatorView.tsx:498, 506`: `k_BT/ħω=...` disegnato con `ctx.fillText(...)` nella colonna `ThermalBathStrip`.
  - `UmklappDispersionView.tsx:296, 469`: `v_g: k₁ → , k₂ →  ⇒  k₃ ←` disegnato con `ctx.fillText(...)`.
  - `strings.ts:54` + `PhononQuantumSection.tsx:190`: `chainHintZp` (`punto zero Δx_zp = ...`) mostrato come testo semplice.
  - `strings.ts:78` + `PhononQuantumSection.tsx:204`: `dispersionTag` (`Effetto sulla velocità di gruppo v_g(k) lungo ω(k)`) mostrato come testo semplice in testata.
  - `strings.ts:107, 115, 116` + `PhononQuantumSection.tsx:429, 473, 493`: nel pannello valori compaiono letteralmente `|x| > x_cl`, `Velocità v_g` e `v_g(k₃) ha segno opposto a v_g(k₁), v_g(k₂)` senza `<RichText>`.
- **Riferimento dispensa**: notazione con pedici ($v_g$, $\Delta x_{\mathrm{zp}}$, $\Delta x_{\mathrm{rms}}$, $k_B T$, $x_{\mathrm{cl}}$) nella dispensa Parte 6.
- **Correzione proposta**:
  - Nei tre canvas usare `drawRichText` (già importato in `QuantumOscillatorView.tsx:14`) al posto di `ctx.fillText` per i testi misti con pedici.
  - In `PhononQuantumSection.tsx:190, 429, 473, 493` racchiudere i rispettivi testi in `<RichText>` convertendo i simboli in `$…$` (es. `Velocità $v_g$`, `$|x| > x_{\mathrm{cl}}$`, `$\Delta x_{\mathrm{zp}}$`), e in `strings.ts:78` scrivere `'Effetto sulla velocità di gruppo lungo ν(k)'` senza underscore grezzi (e coerente con l’asse `ν`, v. **M2**).

---

### Minori

#### M1. Disambiguazione $a \to x_{\mathrm{cl}}$ e definizione di $x_{\mathrm{cl,eff}}$ non esplicitate nei *Dettagli formali*
- **Dove**: `strings.ts:174`, `formulas.ts:57-58`, `model.ts:79, 95`.
- **Cosa differisce**: nella dispensa (§18.1 eq. (46) p. 44 e §18.3 p. 46) l’ampiezza classica è chiamata $a$ ($a = a_{\mathrm{ho}}\sqrt{2n+1}$). Nella sezione viene opportunamente rinominata $x_{\mathrm{cl}}$ per non confonderla con il passo reticolare $a$, ma conviene segnalare «(indicata con $a$ nella dispensa)» in `strings.ts:174`. Inoltre, in bagno termico la curva tratteggiata $P_{\mathrm{cl}}(x)$ usa l’ampiezza efficace $x_{\mathrm{cl,eff}} = a_{\mathrm{ho}}\sqrt{2\bar{n}+1}$ all’energia media $\langle E\rangle$, dettaglio utile da menzionare nei *Dettagli formali*.
- **Riferimento dispensa**: Lezione 3 §18.1 eq. (46) p. 44 e §18.3 p. 46.
- **Correzione proposta**: integrare due brevi incisi in `strings.ts:174` e `180`.

#### M2. Coerenza di scrittura tra `\langle E\rangle` e `E` in `formulas.ts:51` e tra `ω(k)` e `ν(k)` in `dispersionTag`
- **Dove**: `formulas.ts:51` (`${E} = (${nBar} + \\tfrac{1}{2})\\hbar${omega}`) e `strings.ts:78` (`... lungo ω(k)`).
- **Cosa differisce**: in `PhononQuantumSection.tsx:339` la media termica del modo è indicata correttamente come `\langle E\rangle`, mentre in `formulas.ts:51` manca la media (`E` anziché `\langle E\rangle`). Inoltre `dispersionTag` (`strings.ts:78`) cita `lungo ω(k)` mentre il grafico sottostante ha ordinata `ν (THz)` e legenda `dispersione ν(k)`.
- **Riferimento dispensa**: Lezione 2 §11 p. 28; Lezione 4 §20.2 p. 50.
- **Correzione proposta**: scrivere `\\langle ${E} \\rangle = (${nBar} + \\tfrac{1}{2})\\hbar${omega}` in `formulas.ts:51` e `lungo ν(k)` in `strings.ts:78`.

#### M3. Indicazione completa dei parametri di §3 ($C = 20\,\text{N/m}$, $\nu_{\max} \approx 4{,}4\,\text{THz}$) e precisazione sull’inversione di $v_g(k_3)$
- **Dove**: `strings.ts:40, 156, 193`.
- **Cosa differisce**:
  - `strings.ts:40` e `strings.ts:193` citano $M$ e $a$ del metallo tipico di §3 / §18.4 ma omettono $C = 20\,\text{N/m}$ (e $\nu_{\max} \approx 4{,}4\,\text{THz}$), che pure entra direttamente nella dispersione usata in Modalità B (`REFERENCE_CRYSTAL.springC`) e giustifica la frequenza iniziale `4,4 THz` in Modalità A.
  - `strings.ts:156` afferma che superato $\pi/a$ «vedi cambiare il segno della velocità di gruppo $v_g(k_3)$»: ciò avviene quando i due fononi entranti avevano lo stesso verso (come nell’esempio di §16.2), ma non necessariamente se $k_1$ e $k_2$ avevano già segni opposti (es. $k_1 = 0{,}9\,\pi/a$, $k_2 = 0{,}2\,\pi/a \to k_3 = -0{,}9\,\pi/a$ cambia rispetto a entrambi, mentre per due vettori già discorrenti il verso «di uno dei due» non cambia). Precisarlo rende la frase rigorosa per ogni coppia $(k_1, k_2)$.
- **Riferimento dispensa**: Lezione 1 §3 p. 9; Lezione 3 §16.2 p. 40.
- **Correzione proposta**: aggiungere `, C = 20 N/m` ($\nu_{\max} \approx 4{,}4\,\text{THz}$) in `strings.ts:193` (e opzionalmente in `strings.ts:40`) e precisare «e, per fononi entranti concordi, vedi invertirsi il segno della velocità di gruppo $v_g(k_3)$» in `strings.ts:156`.

---

## 4. Verdetto finale

**Da correggere.** La fisica della quantizzazione dei modi, la statistica di Bose–Einstein con $\mu = 0$, l’oscillatore armonico classico vs quantistico, la cinematica dei processi Normali e Umklapp, le precisazioni delle dispense sulle slide e la struttura didattica in 4 parti sono pienamente fedeli al corso e prive di errori bloccanti. Risolti i 5 punti importanti **I1–I5** (correzione dell’etichetta `P(u)·a_{ho}` in `P(x)·a_{ho}`, allineamento/chiarimento della convenzione di segno di $G$ rispetto a §16.2/Fig. 19, `V(x)` in `oscillatorTag` e definizione esplicita dell’esponente in `p_n(T)`, stato fondamentale $P_0(x)$ fisso come riferimento in modalità termica, e rimozione degli underscore grezzi da UI e canvas), la sezione raggiungerà piena fedeltà al corso.
