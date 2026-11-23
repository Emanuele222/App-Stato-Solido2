# Revisione fedeltà al corso — Sezione 3: Rami 3D, polarizzazioni e cristalli reali

- **Revisore**: `fedelta-corso`
- **Sezione revisionata**: `src/renderer/src/sections/phonon-3d/` (`strings.ts`, `formulas.ts`, `manifest.ts`, `Phonon3DSection.tsx`, `Polarization3DView.tsx`, `ModeCounting3DView.tsx`, più verifica di supporto su `model.ts` e `store.ts`) e `src/renderer/src/physics/phonon3d.ts`
- **Fonti uniche di riferimento**: `materiale/parte6/dispensa.pdf` (Lezione 2 §§9–10 pp. 23–27, Fig. 13 p. 24, §12 pp. 29–30; Lezione 3 §14 pp. 35–37, Tab. 1 p. 36, Figg. 17–18 pp. 36–37, §19 pp. 47–48) e `materiale/parte6/riferimento-formule.md`
- **Verdetto**: **da correggere**

---

## 1. Sintesi della verifica

La sezione è molto solida sul piano della fedeltà scientifica e didattica alla dispensa Parte 6:
- **Zero problemi bloccanti**: la notazione di Lezione 2 §10 ($\mathbf{u}_{n\alpha}$, $\mathbf{R}_n$, $M_\alpha$, $\Phi_{\alpha i,\beta j}(0,m)$, $\mathbf{D}(\mathbf{k})$, $\omega_s$, $\boldsymbol{\varepsilon}^s_\alpha(\mathbf{k})$) e di Lezione 3 §14 ($\mathbf{k} = \frac{2\pi}{L}(n_x,n_y,n_z)$, $\Delta V_k = (2\pi)^3/V$, $V_{\mathrm{1BZ}} = (2\pi)^3/v_c$, $\mathcal{N}_k = V/v_c = N_c$, $3pN_c$), le equazioni (26)–(28) e (34)–(36), i valori della Tab. 1 (§14.4 p. 36) e la stima macroscopica di $1\,\text{cm}^3$ di Al (§14.2 p. 35) coincidono con la dispensa.
- **Nessuna ripetizione delle imprecisioni delle slide**: il conteggio dei rami ottici usa correttamente $p - 1$ LO e $2(p - 1)$ TO (mai «1 LO e $3p - 4$ TO»); il volume della cella primitiva fcc è sempre $v_c = a^3/4$ con $N_c = 4N^3$ (mai $v_c = a^3$); nessuna ripetizione delle imprecisioni su fonone/spin/impulso.
- **Copertura didattica completa**: tutti i punti pertinenti di «Cosa devi saper fare» ed «Errori tipici» di §12 (p. 29) e §19 (p. 47), oltre ai riquadri di §9.1 (p. 24), §10.2 (pp. 26–27) e §14.1–14.4 (pp. 35–37), sono coperti nella scheda teoria e negli strumenti interattivi.
- **Pulizia `RichText` e nota `.foot`**: verificata l'assenza totale di sintassi Markdown (`**` o `*`) in `strings.ts` e di numeri di slide o nomi di file. La nota `.foot` (`strings.ts:149`) dichiara con la giusta discrezione che le curve complete derivano da modelli armonici 3D calibrati su Tab. 1 e non da dati sperimentali o calcoli DFT diretti.
- **Verifiche eseguite**:
  - Test di fisica: `.\.tools\node\node.exe node_modules/vitest/vitest.mjs run src/renderer/src/physics/phonon3d.test.ts` → **11/11 test superati**.
  - Controllo automatico di tutte le formule KaTeX di `formulas.ts`, `strings.ts` e `Phonon3DSection.tsx` (zero warning `strict`, ma rilevato un errore di escape in `formulas.ts:35`) e ispezione a runtime dei valori restituiti da `phonon3d.ts` su tutti e 3 i cristalli e i 4 tratti $\Gamma\text{–}X\text{–}K\text{–}\Gamma\text{–}L$.

Restano tuttavia **5 problemi importanti** (un punto e virgola spurio `;` nella formula viva per $p = 1$; underscore grezzi `v_c` e `N_c` resi letteralmente su canvas, intestazioni e pannello valori; etichetta «direzione generica $X\text{–}K$» mostrata erroneamente lungo $K\text{–}\Gamma$ nel diamante; simbolo di versore $\hat{\mathbf{u}}_1$ applicato a un vettore non unitario di norma $0{,}60$ in PbTe; note statiche su splitting LO–TO che contraddicono i valori numerici quando si sposta lo slider $\omega_{\mathrm{LO}}/\omega_{\mathrm{TO}}$) e **3 problemi minori** (etichette `TA1`/`TA2`/`TO1`/`TO2` senza pedice in tre punti dell'UI; piccole imprecisioni contestuali su $M_1$ per Al, `(e TO₁ = TO₂)` con $p = 1$, separatore migliaia in `countingHint` e titolo `Riferimento Tab. 1` a slider modificati; integrazione sulla provenienza esterna dei passi reticolari $a$ di Diamante e PbTe).

---

## 2. Controllo sistematico rispetto alla dispensa

### 2.1 Simboli, formule, convenzioni e correzioni delle slide

| Grandezza / Formula / Convenzione | Dispensa Parte 6 | Codice / UI (file e righe) | Esito |
|---|---|---|---|
| Notazione $\mathbf{u}_{n\alpha}, \mathbf{R}_n, M_\alpha, \Phi_{\alpha i,\beta j}(0,m)$ (non $s_{n\alpha i}, \mathbf{r}_n, \mathbf{q}$ delle slide) | §10.1–10.2 pp. 25–26, nota 10 p. 25 | `formulas.ts:11-23`, `strings.ts:130-131` | Conforme |
| Matrice dinamica $D_{\alpha i,\beta j}(\mathbf{k})$ (eq. 27), eq. secolare $\det(\mathbf{D}-\omega^2\mathbf{1})=0$ (eq. 28), onda di Bloch (eq. 26) | §10.2 pp. 26–27; Form. p. 30 | `formulas.ts:22-29`, `strings.ts:130-131` | Conforme |
| Proprietà di $\mathbf{D}(\mathbf{k})$: hermitiana ($\omega_s^2 \ge 0$), regola di somma $\sum_{m\beta}\Phi_{\alpha i,\beta j}(0,m)=0$ e $\varepsilon_{\beta j}=\sqrt{M_\beta}c_j$ | §10.1–10.2 Approf. pp. 25–27 | `strings.ts:131`, `phonon3d.test.ts:21-69` | Conforme |
| Conteggio $3p$ rami: $3$ acustici (1 LA + 2 TA) e $3p-3$ ottici con $p-1$ LO e $2(p-1)$ TO (correzione slide) | §9.1 p. 24; §12 pp. 29–30; §14.3 p. 35 | `formulas.ts:32-42`, `strings.ts:123-124`, `phonon3d.ts:1311-1314` | **Typo `\;\(` in `formulas.ts:35`** (v. I1) |
| Nomi LA/TA/LO/TO esatti solo lungo alta simmetria; modi misti fuori simmetria | §9.1 riquadro arancione p. 24 | `strings.ts:106,110,124`, `Phonon3DSection.tsx:519-524` | **Falsa etichetta `X–K` su `K–Γ` nel diamante** (v. I3) |
| Degenerazione TA/TO lungo $[100]$ ($C_4$) e $[111]$ ($C_3$); rimozione lungo $[110]$ ($C_2$, 6 rami distinti in PbTe) | §9.2 p. 25; §14.4 p. 36 | `strings.ts:107-109,137`, `phonon3d.test.ts:97-157` | Conforme (v. M2 per `p = 1`) |
| Splitting LO–TO a $\Gamma$ nei cristalli polari (PbTe) vs degenerazione e assenza dipolo IR nel diamante | §9.2 p. 25; §14.4 Intuizione pp. 36–37 | `strings.ts:113-114,138`, `Phonon3DSection.tsx:623-625,642-644` | **Note statiche in conflitto con lo slider** (v. I5) |
| Misure sperimentali: INS e IXS | §14.4 p. 37 | `strings.ts:138` | Conforme |
| Born–von Kármán 3D: $\mathbf{k}=\frac{2\pi}{L}(n_x,n_y,n_z)$, $\Delta V_k=(2\pi)^3/V$, $\mathcal{N}_k = V/v_c = N_c$, $\sum_{\mathbf{k}} \to \frac{V}{(2\pi)^3}\int \mathrm{d}^3k$ | §14.1 eqq. (34)–(36) p. 35; Form. p. 48 | `formulas.ts:45-49`, `strings.ts:144` | Conforme |
| Correzione $v_c = a^3/4$ e $N_c = 4N^3$ per fcc (mai $v_c = a^3$) | §14.1 riquadro arancione p. 35; §19 p. 47 | `formulas.ts:47`, `strings.ts:145`, `ModeCounting3DView.tsx`, `phonon3d.ts:1307-1310` | Conforme sul merito; **underscore grezzi in UI/canvas** (v. I2) |
| Griglia 2D Fig. 17 ($N = 8$, $N^2 = 64$ pieni contati, vuoti sul bordo $-\pi/a$ equivalenti per $\mathbf{G}$) | §14 Fig. 17 p. 36 | `phonon3d.ts:1393-1419`, `ModeCounting3DView.tsx:59-149` | Conforme |
| Vettore spostamento/polarizzazione nel pannello valori | §10.2 eq. (26) p. 26 | `Phonon3DSection.tsx:578-585`, `phonon3d.ts:501-506,666-671` | **Versore $\hat{\mathbf{u}}_1$ su vettore non unitario** (v. I4) |
| Virgola decimale, unità meV/THz ($1\,\text{THz}\leftrightarrow 4{,}136\,\text{meV}$), italiano, zero Markdown in `RichText`, zero numeri di slide/file | Tab. 1 p. 36; regole `fedelta-corso` | `strings.ts`, `manifest.ts`, `constants.ts:53`, `ui/format.ts` | Conforme (v. M1, M2) |

### 2.2 Copertura «Cosa devi saper fare» ed «Errori tipici» (§12 p. 29 e §19 p. 47)

- **Lezione 2, §12 (p. 29) — punti pertinenti alla Sezione 3**:
  - *Cosa devi saper fare* punto 5 (contare i $3p$ rami, distinguere LA/TA/LO/TO, degenerazione trasversali lungo assi di simmetria): **coperto integralmente** (`formulas.ts:32-42`, `strings.ts:123-124,137`, vista 3D e dispersione).
  - *Cosa devi saper fare* punto 6 (definire $\mathbf{D}(\mathbf{k})$, scrivere $\det(\mathbf{D}-\omega^2\mathbf{1})=0$, spiegare frequenze e polarizzazioni): **coperto integralmente** (`formulas.ts:22-29`, `strings.ts:130-131`).
  - *Errori tipici* punto 6 («Ottici = solo trasversali, o LO unico per ogni $p$: $p-1$ LO e $2(p-1)$ TO lungo assi di simmetria»): **coperto esplicitamente** (`strings.ts:124`, `formulas.ts:40`, `phonon3d.ts:1313-1314`).
- **Lezione 3, §19 (p. 47) — punti pertinenti a §14**:
  - *Cosa devi saper fare* punti 1–3 (condizioni BvK 3D, $\sum_{\mathbf{k}} \to \frac{V}{(2\pi)^3}\int \mathrm{d}^3k$, conteggio $3pN_c = N_c \times 3p$, valori numerici Al/C/PbTe e degenerazioni lungo $\Gamma\text{–}X$): **coperti integralmente**.
  - *Errori tipici* punto 1 (condizioni periodiche come artificio matematico, stesso conteggio con estremi bloccati): **coperto** (`strings.ts:145`).
  - *Errori tipici* punto 2 (contare $N$ e non $N+1$ o $2N$ valori in zona, poiché $-\pi/a \equiv +\pi/a$): **coperto** (`strings.ts:145`, Fig. 17 in `ModeCounting3DView.tsx`).
  - *Errori tipici* punto 3 (non usare $v_c = a^3$ per reticoli non cubici semplici: fcc ha $v_c = a^3/4$): **coperto** (`strings.ts:145`, `formulas.ts:47`, `ModeCounting3DView.tsx`, `Phonon3DSection.tsx:544`).

### 2.3 Numeri, Tab. 1 e trasparenza sui dati esterni

- **Alluminio (fcc, $p = 1$)**: $a = 4{,}05\,\text{Å}$ e massa molare $26{,}98\,\text{g mol}^{-1}$ dalla dispensa (§14.2 p. 35). Il modello riproduce esattamente Tab. 1 (§14.4 p. 36): a $X$, $\text{LA} = 40{,}0\,\text{meV}$ ($9{,}67\,\text{THz}$, dispensa $\approx 40\,\text{meV} \approx 9{,}7\,\text{THz}$) e $\text{TA}_{1,2} = 24{,}0\,\text{meV}$ ($5{,}80\,\text{THz}$, dispensa $\approx 24\,\text{meV} \approx 5{,}8\,\text{THz}$). La stima macroscopica di $1\,\text{cm}^3$ di Al (`macroscopicAluminumEstimate`) dà $N_c = 6{,}02\cdot 10^{22}$ ($\approx 6{,}0\cdot 10^{22}$), $3N_c = 1{,}81\cdot 10^{23}$ ($\approx 1{,}8\cdot 10^{23}$) e $\Delta k = 6{,}28\cdot 10^2\,\text{m}^{-1}$ ($\approx 6{,}3\cdot 10^2\,\text{m}^{-1}$), identici a §14.2 p. 35.
- **Diamante (fcc, base C–C, $p = 2$)**: il modello riproduce esattamente Tab. 1: a $\Gamma$, 3 rami ottici degeneri a $160{,}0\,\text{meV}$ ($38{,}69\,\text{THz}$, dispensa $\approx 160\,\text{meV} \approx 39\,\text{THz}$), con 2 TA e 2 TO degeneri lungo $\Gamma\text{–}X$ e $\Gamma\text{–}L$.
- **PbTe (NaCl polare, $p = 2$)**: il modello riproduce esattamente Tab. 1: a $\Gamma$, $\text{LO} = 3{,}30\,\text{THz}$ ($13{,}65\,\text{meV}$, dispensa $\approx 3{,}3\,\text{THz} \approx 14\,\text{meV}$) e $\text{TO}_{1,2} = 1{,}10\,\text{THz}$ ($4{,}55\,\text{meV}$, dispensa $\approx 1{,}1\,\text{THz} \approx 4{,}5\,\text{meV}$), con tutti e 6 i rami distinti lungo $[110]$.
- **Nota `.foot` (`strings.ts:149`)**: discreta e chiara nell'esplicitare che le curve complete lungo $\Gamma\text{–}X\text{–}K\text{–}\Gamma\text{–}L$ derivano da modelli armonici 3D calibrati su Tab. 1 (non da dati sperimentali o DFT diretti). Si suggerisce solo una breve aggiunta sui passi reticolari $a$ di Diamante ($3{,}57\,\text{Å}$) e PbTe ($6{,}46\,\text{Å}$) e sulle masse atomiche come dati standard esterni alla dispensa (v. M3).

---

## 3. Problemi riscontrati

### Bloccanti

Nessuno.

---

### Importanti

#### I1. Punto e virgola spurio nella formula viva del conteggio rami per $p = 1$ (Alluminio)
- **Dove**: `src/renderer/src/sections/phonon-3d/formulas.ts:35`.
- **Cosa differisce**: nella stringa template di `branchCountFormulas(1)` è scritto:
  ```ts
  `p = 1:\\; 3p = 3\\;\\text{rami}\;(${q('omega', '1\\,\\text{LA} + 2\\,\\text{TA}')},\\; 0\\;\\text{ott.})`
  ```
  Il token `\;\(` ha un solo backslash invece di due (`\\;`), per cui in JavaScript `\;` viene valutato come carattere letterale `;`. La formula passata a KaTeX diventa `p = 1:\; 3p = 3\;\text{rami};(1\,\text{LA} + 2\,\text{TA},\; 0\;\text{ott.})` e compare a schermo come `3 rami;(1 LA + 2 TA, 0 ott.)` con un punto e virgola attaccato davanti alla parentesi ogni volta che si seleziona Alluminio.
- **Riferimento dispensa**: Lezione 2, §9.2 p. 25 e Formule essenziali p. 30.
- **Correzione proposta**: raddoppiare il backslash (`\\;(`) in `formulas.ts:35`.

#### I2. Underscore grezzi (`v_c`, `N_c`) resi letteralmente su canvas, intestazioni e pannello valori
- **Dove**:
  - `src/renderer/src/sections/phonon-3d/ModeCounting3DView.tsx:241, 242, 249, 266` e `strings.ts:87`: il riquadro numerico e la nota in basso a destra del canvas di conteggio 3D sono disegnati con `ctx.fillText(...)` (non `drawMathText`), per cui appaiono letteralmente `v_c = a³/4 = ...`, `fcc: N_c = 4N³ = ...`, `3p·N_c = ... modi` e `4 celle primitive per cubo a³ ⇒ v_c = a³/4`.
  - `src/renderer/src/sections/phonon-3d/strings.ts:76` + `Phonon3DSection.tsx:323`: la barra superiore in modalità conteggio stampa letteralmente `fcc N_c = 4N³ = ...` come testo semplice.
  - `src/renderer/src/sections/phonon-3d/strings.ts:100` + `Phonon3DSection.tsx:651`: la voce `<dt>` del pannello valori stampa letteralmente `Bilancio 3p·N_c` senza `<RichText>`.
  - `src/renderer/src/sections/phonon-3d/strings.ts:142` + `Phonon3DSection.tsx:458`: il titolo del quarto blocco teoria (`<h3>{block.heading}</h3>`) stampa letteralmente `Conteggio 3D di Born–von Kármán e volume v_c = a³/4`.
  - `src/renderer/src/sections/phonon-3d/strings.ts:16`: il tooltip `countingTitle` espone `v_c` e `N_c` con underscore nel testo semplice del browser.
- **Riferimento dispensa**: notazione tipografica con pedici ($v_c$, $N_c$) in Lezione 3, §14.1–14.3 p. 35 e Formule essenziali p. 48.
- **Correzione proposta**:
  - In `ModeCounting3DView.tsx:240-266`, usare `drawMathText` (già importato e usato per `k_x`, `k_y` alle righe 95–96) oppure `drawRichMathText` se disponibile, per rendere `v_c` e `N_c` con veri pedici (e in `strings.ts:87` adattare la stringa di conseguenza).
  - In `Phonon3DSection.tsx:322, 458, 651`, rendere con `<RichText>` i testi che contengono simboli con pedice (`$N_c$`, `$3pN_c$`, `$v_c = a^3/4$`) — oppure scrivere in testo piano senza underscore nel titolo `<h3>` (es. `Conteggio 3D di Born–von Kármán e cella primitiva fcc`).
  - Nel tooltip `strings.ts:16`, evitare underscore grezzi (es. `il volume della cella primitiva a³/4 (fcc) e il bilancio dei modi`).

#### I3. Etichetta «direzione generica $X\text{–}K$» mostrata su $K\text{–}\Gamma$ ($[110]$) nel diamante
- **Dove**: `src/renderer/src/sections/phonon-3d/strings.ts:106` (`polarMixed: 'polarizzazione mista (direzione generica $X\\text{–}K$)'`) e `Phonon3DSection.tsx:519-524`.
- **Cosa differisce**: nel modello tetraedrico del diamante (`phonon3d.ts:343-397`), lungo la direzione $[110]$ ($K\text{–}\Gamma$) la polarizzazione trasversale $[001]$ si accoppia fisicamente a quella longitudinale $[110]$: al punto intermedio `idx = 100` (raggiunto direttamente dal pulsante rapido `K–Γ: TA₂`), i modi `TA₂`/`TO₁` hanno frazione longitudinale $4{,}5\%$ e `LA`/`LO` hanno $95{,}5\%$. Poiché `Phonon3DSection.tsx:520-524` seleziona `v.polarMixed` ogniqualvolta `0,02 <= longitudinalFraction <= 0,98`, nel pannello «Polarizzazione» appare la frase:
  `polarizzazione mista (direzione generica X–K)`
  mentre lo studente si trova su **`K–Γ`** e la riga immediatamente sotto recita `Asse binario [110] (C₂): degenerazione trasversale rimossa.` — una contraddizione diretta a schermo.
- **Riferimento dispensa**: Lezione 2, §9.1 riquadro arancione p. 24 (i nomi LA/TA/LO/TO sono esatti solo quando la simmetria disaccoppia longitudinale e trasversali; altrimenti i modi hanno carattere misto) e Lezione 3, §14.4 p. 36.
- **Correzione proposta**: rimuovere il riferimento fisso a `X–K` da `values.polarMixed` (oppure condizionarlo su `sel.symmetry === 'generic'`): per `sel.symmetry === 'generic'` mostrare `'polarizzazione mista (direzione generica $X\\text{–}K$)'`, altrimenti `'polarizzazione mista (accoppiamento L–T)'` (o semplicemente `'polarizzazione mista (né puramente L né puramente T)'`, valida su qualunque tratto).

#### I4. Simbolo di versore $\hat{\mathbf{u}}_1$ applicato a un vettore non unitario (norma $0{,}60$ in PbTe)
- **Dove**: `src/renderer/src/sections/phonon-3d/Phonon3DSection.tsx:508, 578-580` e `src/renderer/src/physics/phonon3d.ts:501-505, 666-668`.
- **Cosa differisce**: il pannello valori stampa `\hat{\mathbf{u}}_1 = (u_x; u_y; u_z)` (con il cappuccio `^` che indica un versore di norma $1$), leggendo `u0 = mode.displacementVectors[0]`. Tuttavia `displacementVectors` è normalizzato rispetto al massimo fra i *due* atomi della base ($\max_\alpha |\mathbf{u}_\alpha| = 1$) ed è la sola parte reale $\operatorname{Re}\mathbf{u}_1$:
  - già nello stato iniziale all'apertura della sezione (**PbTe**, modo `LO` su $\Gamma\text{–}X$), l'atomo leggero Te ha norma $1$ mentre l'atomo pesante Pb (`u0`) ha norma $0{,}60$, per cui a schermo si legge **`û₁ = (0,60; 0,00; 0,00)`** (non unitario!);
  - nel **diamante** su `X–K` (`TA₂`, `TO₁`), dove $\mathbf{u}_1$ ha una componente immaginaria rilevante (`|Im u1| = 0,635`), la norma della sola parte reale scende a `0,772`.
- **Riferimento dispensa**: Lezione 2, §10.2 eq. (26) p. 26 (gli spostamenti $\mathbf{u}_\alpha \propto \boldsymbol{\varepsilon}_\alpha / \sqrt{M_\alpha}$ hanno ampiezze diverse sui due atomi della base, inversamente legate alle masse, esattamente come nel caso biatomico §8.1 p. 21).
- **Correzione proposta**: normalizzare `u0` alla propria norma (`|u0| = 1`) prima di mostrarlo come versore di direzione $\hat{\mathbf{u}}_1$ (esattamente come fa già `Polarization3DView.tsx:498-500` per disegnare la freccia $\boldsymbol{\varepsilon}^s$), **oppure** togliere il cappuccio e scrivere $\mathbf{u}_1$ (o $\operatorname{Re}\mathbf{u}_1$) specificando che è normalizzato a $u_{\max} = 1$.

#### I5. Note statiche su «LO = TO» (Diamante) e «LO sopra TO» (PbTe) in conflitto con lo slider $\omega_{\mathrm{LO}}/\omega_{\mathrm{TO}}$
- **Dove**: `src/renderer/src/sections/phonon-3d/Phonon3DSection.tsx:623-625, 642-644` e `strings.ts:113-114`.
- **Cosa differisce**: per entrambi i cristalli con $p = 2$ (Diamante e PbTe) lo slider `ω_LO / ω_TO` è attivo (`manifest.ts:44`). Tuttavia:
  - selezionando **Diamante** e portando lo slider $\omega_{\mathrm{LO}}/\omega_{\mathrm{TO}} > 1$ (es. $2{,}00$), il pannello valori stampa `LO(Γ) = 320,0 meV` e `TO_{1,2}(Γ) = 160,0 meV`, e subito sotto continua a mostrare la nota fissa `Non polare (LO = TO a Γ, nessun dipolo IR).`;
  - selezionando **PbTe** e portando lo slider $\omega_{\mathrm{LO}}/\omega_{\mathrm{TO}} = 1{,}00$, il pannello valori stampa `LO(Γ) = 1,10 THz` e `TO_{1,2}(Γ) = 1,10 THz`, e subito sotto continua a mostrare `Cristallo polare: il campo elettrico longitudinale alza LO sopra TO.`.
- **Riferimento dispensa**: Lezione 3, §14.4 Intuizione pp. 36–37 (coerenza tra splitting LO–TO e natura polare/non polare del cristallo).
- **Correzione proposta**: condizionare la nota sul valore effettivo di `model.tab1.loToSplitThz` (o `st.params.polarRatio`): per il diamante con `polarRatio > 1,01` indicare ad es. `Diamante reale: non polare (LO = TO a Γ); splitting polare introdotto dallo slider.`; per PbTe con `polarRatio <= 1,01` indicare `Splitting polare azzerato dallo slider (nel PbTe reale LO ≈ 3,3 THz > TO ≈ 1,1 THz).`.

---

### Minori

#### M1. Etichette `TA1`, `TA2`, `TO1`, `TO2` senza pedice in tre punti dell'interfaccia
- **Dove**: `Phonon3DSection.tsx:329` (testata della vista 3D: `sel.mode.role`), `Phonon3DSection.tsx:562` (`\text{${mode.role}}` nel pannello «Modo selezionato») e `Polarization3DView.tsx:564` (`ctx.fillText(mode.role, ...)` sotto la triade vettoriale).
- **Cosa differisce**: in questi tre punti il ruolo del modo è stampato col codice identificatore grezzo (`TA1`, `TA2`, `TO1`, `TO2`), mentre nel resto della stessa schermata (`quickModes`, legenda, etichette su `DispersionPlot`, `tab1Ref` e scheda teoria) si usa la notazione corretta con pedice (`TA₁`, `TA₂`, `TO₁`, `TO₂`, $\text{TA}_{1,2}$, $\text{TO}_{1,2}$).
- **Riferimento dispensa**: Lezione 2 §9.1–9.2 pp. 24–25 e Lezione 3 §14.3–14.4 pp. 35–36 ($\text{TA}_1, \text{TA}_2, \text{TO}_1, \text{TO}_2$).
- **Correzione proposta**: introdurre una piccola funzione di formattazione del ruolo (testo con pedice Unicode `TA₁`/`TA₂`/`TO₁`/`TO₂` per testata e canvas, e TeX `\text{TA}_1` ecc. a riga 562 di `Phonon3DSection.tsx`).

#### M2. Rifiniture contestuali in legende, note di simmetria, separatore migliaia e titolo Tab. 1
- **Dove**: `strings.ts:63-65, 76, 107-108` e `Phonon3DSection.tsx:583, 591`.
- **Cosa differisce**:
  - `strings.ts:63` (`legendAtom1`): per Alluminio ($p = 1$, un solo atomo per cella) mostra `atomi Al (M₁)` anziché `atomi Al (M)`; e per il Diamante ($p = 2$, due atomi C identici) affianca `atomi C (M₁)` a `sottoreticolo 2 (C)` in modo asimmetrico (meglio `sottoreticolo 1 (C)` e `sottoreticolo 2 (C)`, o indicare `$M$` per Al).
  - `strings.ts:107-108` (`sym100Note`, `sym111Note`): mostrano `(e TO₁ = TO₂)` anche quando è selezionato Alluminio ($p = 1$, privo di rami ottici).
  - `strings.ts:76` (`countingHint`): `${3 * p * nc}` non è formattato con `.toLocaleString('it-IT')` mentre `nc` subito prima lo è (es. `2.048 → 12288 modi`).
  - `Phonon3DSection.tsx:591`: la voce `<dt>Riferimento Tab. 1</dt>` mantiene lo stesso titolo anche quando i parametri sono stati modificati con gli slider (`st.presetId === null`) e i valori visualizzati non sono più quelli della Tab. 1.
  - `Phonon3DSection.tsx:583`: per $p = 2$ la frazione longitudinale è $\sum_\alpha |\hat{\mathbf{k}}\cdot\boldsymbol{\varepsilon}_\alpha|^2$ (non solo $|\hat{\mathbf{k}}\cdot\boldsymbol{\varepsilon}|^2$).
- **Riferimento dispensa**: §9.2 p. 25, §10.2 p. 26, Tab. 1 p. 36.
- **Correzione proposta**: condizionare `legendAtom1`, `sym100Note`/`sym111Note` e `|\hat{\mathbf{k}}\cdot\boldsymbol{\varepsilon}|^2` su `p === 1` vs `p === 2`; aggiungere `.toLocaleString('it-IT')` a `3 * p * nc`; indicare `Modello (da Tab. 1)` o `Valori a X / Γ` quando `st.presetId === null`.

#### M3. Trasparenza sui passi reticolari $a$ esterni alla dispensa e piccole integrazioni opzionali
- **Dove**: `strings.ts:124, 149` e `phonon3d.ts:137, 151, 165`.
- **Cosa differisce**:
  - In `strings.ts:149` (`.foot`) si chiarisce opportunamente che le curve complete derivano da modelli armonici 3D calibrati su Tab. 1; mentre $a = 4{,}05\,\text{Å}$ e la massa dell'Al provengono da §14.2 p. 35, i passi reticolari di Diamante ($a = 3{,}57\,\text{Å}$) e PbTe ($a = 6{,}46\,\text{Å}$) e le rispettive masse atomiche non compaiono in Parte 6 (sono dati cristallografici standard). Una breve precisazione in `.foot` renderebbe completa la tracciabilità dei dati esterni.
  - A `strings.ts:124` compare l'inciso «(come riportato per imprecisione nelle slide con $1$ LO e $3p - 4$ TO)»: non cita numeri di slide né nomi di file e ricalca fedelmente il riquadro arancione di §9.1 p. 24; se si desidera evitare anche il riferimento generico alle «slide» nel testo dell'app, si può riformulare in modo neutro (es. «in formulazioni imprecise diffuse con $1$ LO e $3p - 4$ TO»).
  - Opzionale: si può accennare brevemente nella teoria che i rami ottici hanno tipicamente velocità di gruppo $v_g$ piccola (bande quasi piatte, §9.1 p. 24).
- **Riferimento dispensa**: Lezione 2 §9.1 p. 24; Lezione 3 §14.2 p. 35 e Tab. 1 p. 36; criterio 5 della skill `fedelta-corso`.
- **Correzione proposta**: aggiungere in `strings.ts:149` l'inciso `(con passi reticolari a e masse standard per Diamante e PbTe, esterni alla dispensa; Al da §14.2)`.

---

## 4. Verdetto finale

**Da correggere.** La sezione rispetta fedelmente la fisica, la notazione, i valori della Tab. 1 (§14.4), la stima macroscopica dell'alluminio (§14.2), la Fig. 17 e tutte le correzioni della dispensa Parte 6 rispetto alle slide (zero problemi bloccanti, zero Markdown grezzo in `RichText`, nota `.foot` discreta e chiara). Risolti i 5 punti importanti **I1–I5** (escape `\;\(` in `formulas.ts:35`, pedici di `v_c` e `N_c` su canvas/UI, etichetta `polarMixed` su `K–Γ` nel diamante, coerenza del simbolo $\hat{\mathbf{u}}_1$ e condizionamento delle note LO–TO sullo slider), la sezione raggiungerà piena fedeltà al corso.
