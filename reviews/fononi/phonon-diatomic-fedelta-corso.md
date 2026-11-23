# Revisione fedeltà al corso — Sezione 2: Catena biatomica, gap fononico e luce infrarossa

- **Revisore**: `fedelta-corso`
- **Sezione revisionata**: `src/renderer/src/sections/phonon-diatomic/` (`manifest.ts`, `formulas.ts`, `strings.ts`, `model.ts`, `store.ts`, `DiatomicChainView.tsx`, `PhononDiatomicSection.tsx`) e funzioni biatomiche in `src/renderer/src/physics/phononDispersion.ts` (righe 347–918)
- **Fonti uniche di riferimento**: `materiale/parte6/dispensa.pdf` (Lezione 2 §§6.1–6.2 pp. 14–16, §§7–8 pp. 17–23, §9.2 p. 25, §10.3 p. 27, §12 pp. 29–30; Lezione 4 §24 pp. 59–60, §26 pp. 62–63) e `materiale/parte6/riferimento-formule.md`
- **Verdetto**: **da correggere**

---

## 1. Sintesi della verifica

La sezione è molto solida sul piano fisico-didattico e recepisce bene le lezioni della revisione della Sezione 1:
- **Zero problemi bloccanti**: tutte le formule fisiche in `phononDispersion.ts` e `formulas.ts` (eqq. 20–23, matrice dinamica $2\times 2$ di §10.3, incrocio IR di §24 eq. 60), i segni dei rami ($\omega_-$ acustico, $\omega_+$ ottico), la convenzione $a$ (passo di Bravais) vs $a/2$ (primi vicini), la gestione di $k = 0$ su entrambi i rami e del bordo zona con $M = m$ o $m > M$, la coerenza $\nu$ (THz) vs $\omega$ (rad/s) sul diagramma di dispersione e i numeri dell'esempio Na–Cl (§8 p. 23 e §24 p. 60) coincidono esattamente con la dispensa.
- **Test verificati**: `node node_modules/vitest/vitest.mjs run src/renderer/src/physics/phononDispersion.test.ts` — 17/17 test superati, più verifica indipendente in Python dei valori numerici della coppia Na–Cl.
- **Copertura didattica**: tutti i riquadri verdi («idee chiave») e arancioni («errori tipici») pertinenti di §12 (p. 29) e §26 (p. 63) sono coperti senza ripetere alcuna imprecisione delle slide.

Restano tuttavia **3 problemi importanti** (sintassi Markdown `**…**` / `*…*` non interpretata da `RichText` e quindi resa letteralmente con asterischi nella scheda teoria; etichetta `dipolo IR` mostrata sul modo ottico a $k = 0$ anche nel preset `M = m` in contraddizione con la dispensa e con il canvas stesso; simbolo ausiliario $\bar{m}$ introdotto nella legenda del ripiegamento senza definizione a schermo) e **4 problemi minori** (abbreviazione $\alpha = u_{n-1}/u_n$ a $k \neq 0$ e mancata scrittura esplicita delle equazioni del moto/ansatz; lettura adimensionale `R_cm = 0,61` senza modulo/normalizzazione; divergenza `v_p → ∞` invece di `±∞` sul ramo ottico a $k = 0$; piccole rifiniture su `(+G)` nella conservazione IR e sulla nota del preset `M = 2m`).

---

## 2. Controllo sistematico rispetto alla dispensa

### 2.1 Simboli, formule, convenzioni e gestione casi limite

| Grandezza / Formula / Comportamento | Dispensa Parte 6 | Codice / UI (file e righe) | Esito |
|---|---|---|---|
| Costante elastica $C$ (non $\gamma$/$K$), masse $M > m$ ($M$ pari, $m$ dispari) | §7.1 p. 18; nota 5 p. 16 | `manifest.ts:25-28`, `strings.ts:21-24`, `phononDispersion.ts:354-363` | Conforme |
| Passo di Bravais $a$ vs primi vicini $a/2$, 1BZ $-\pi/a < k \le \pi/a$ | §7.1 p. 18, Fig. 10; §12 p. 29 | `DiatomicChainView.tsx:472-516`, `strings.ts:125`, `phononDispersion.ts:355,584` | Conforme |
| Dispersione $\omega_\mp^2(k)$ (eq. 20), $-$ acustico, $+$ ottico | §7.4 eq. (20) p. 19; Form. p. 30 | `formulas.ts:30-35`, `phononDispersion.ts:512-539,596-603` | Conforme |
| Limite acustico $k \to 0$: $v_s = a\sqrt{C/2(m+M)}$, $\alpha = 1$ | §8.1 eq. (21) p. 21 | `formulas.ts:36,50`, `phononDispersion.ts:545-549`, `strings.ts:132` | Conforme |
| Limite ottico $k = 0$: $\omega_+(0) = \sqrt{2C(m+M)/(mM)}$, $\alpha = -M/m$, $R_{\mathrm{cm}} = 0$ | §8.1 eq. (22) e Esempio p. 21 | `formulas.ts:37,51`, `phononDispersion.ts:566,754-759`, `PhononDiatomicSection.tsx:622-625` | Conforme (v. M2 per $R_{\mathrm{cm}} \neq 0$) |
| Bordo zona $k = \pm\pi/a$: C ($\sqrt{2C/M}$, $\alpha=0$, $m$ ferma), B ($\sqrt{2C/m}$, $1/\alpha=0$, $M$ ferma), gap $\Delta\omega_{\mathrm{gap}}$ | §8.2–8.3 eq. (23) e Fig. 11–12 pp. 20, 22 | `formulas.ts:41-44`, `phononDispersion.ts:564-567,699-770`, `PhononDiatomicSection.tsx:159-193,298-309` | Conforme (inversione $m > M$ gestita con avviso) |
| Limite $M = m$ (chiusura gap, ripiegamento monatomica passo $a/2$ con $G = 2\pi/a$) | §8.3 Approf. p. 23 | `model.ts:101-125`, `strings.ts:83,97,140` | **Simbolo $\bar{m}$ non definito** (v. I3) |
| Gestione $k = 0$ in UI (acustico $\pm v_s$, ottico $v_g = 0$ e $v_p$ divergente) | §3.2 p. 8; §6.1–6.2 pp. 14–16; §8.1 p. 21 | `PhononDiatomicSection.tsx:637-664`, `strings.ts:106-108` | Conforme (v. M3 per $\pm\infty$) |
| Velocità di gruppo negativa sul ramo ottico ($v_g < 0$ per $k > 0$) | §6.2 p. 16; §8.1 p. 21 | `phononDispersion.ts:659-677`, `strings.ts:109,133` | Conforme |
| Matrice dinamica $2\times 2$ $\mathbf{D}(k)$ e $\det(\mathbf{D}-\omega^2\mathbf{1})=0$ | §10.2–10.3 eq. (28) pp. 26–27 | `formulas.ts:55-58`, `phononDispersion.ts:817-869`, `PhononDiatomicSection.tsx:734-763` | Conforme |
| Luce IR: $\hbar\omega_{\mathrm{luce}}=\hbar\omega_{\mathrm{ph}}$, $k_{\mathrm{luce}} \ll \pi/a$, incrocio ottico $k \approx 0$, TO polari vs diamante ($M=m$) | §8.1 p. 21; §9.2 p. 25; §24 eq. (60) e Fig. 28 pp. 59–60 | `formulas.ts:61-64`, `phononDispersion.ts:876-918`, `DiatomicChainView.tsx:368-373,442-469`, `strings.ts:112-114,147` | **Etichetta `dipolo IR` anche per $M = m$** (v. I2); v. M4 |
| Coerenza $\nu$ (THz) vs $\omega$ (rad/s) su grafico, legende e letture | Figg. 11, 28 pp. 20, 60; Esempio §8 p. 23 | `strings.ts:50,53,65-70,73,98`, `PhononDiatomicSection.tsx:520-605,715`, `formulas.ts` | Conforme |
| Resa tipografica simboli e testo in UI (pedici, apici, nessun markup grezzo) | Convenzioni dispensa | `strings.ts:126,133,139,140,147` + `ui/tex.tsx:26-44` | **Asterischi Markdown grezzi in `RichText`** (v. I1) |
| Italiano, virgola decimale, nessun riferimento a slide/file | Regole skill `fedelta-corso` | `strings.ts`, `ui/format.ts` | Conforme |

### 2.2 Copertura «Cosa devi saper fare» ed «Errori tipici» (§12 p. 29 e §26 pp. 62–63)

- **Lezione 2, §12 — «Cosa devi saper fare» (p. 29, punti pertinenti alla Sezione 2)**:
  - Punto 2 (equazioni del moto, ansatz con $\alpha$, equazione secolare 19, soluzioni $\omega_\mp^2$): eq. (20) e $\alpha$ presenti; equazioni accoppiate (13)–(14) e ansatz (15)–(16) solo richiamati a parole (v. M1).
  - Punto 3 (limiti $k \to 0$ acustico/ottico con $R_{\mathrm{cm}} = 0$ e $k = \pi/a$ punti B e C): **coperto integralmente** (formule, 4 pulsanti rapidi, animazione con rombo $R_{\mathrm{cm}}$ e valori).
  - Punto 4 (gap $\sqrt{2C/m} - \sqrt{2C/M}$, spiegazione fisica e chiusura per $M = m$): **coperto integralmente** (teoria, fascia gap, strumento Confronto $M = m$).
  - Punto 6 ($\mathbf{D}(k)$ e $\det(\mathbf{D} - \omega^2\mathbf{1}) = 0$ nel caso 1D biatomico di §10.3): **coperto** (strumento Matrice $\mathbf{D}(k)$, autovalori numerici e teoria).
- **Lezione 2, §12 — «Errori tipici» (p. 29, punti pertinenti alla Sezione 2)**:
  - Non identificare velocità del segnale con $\omega/k$ ($v_g$ nulla o negativa mentre $v_p \neq 0$): **coperto** (`strings.ts:108-109,111,133`).
  - $v_g = 0$ al bordo non significa tutti gli atomi fermi (solo *un* tipo nel biatomico): **coperto** (`strings.ts:111,139`, animazione).
  - Non confondere passo $a$ e primi vicini $a/2$ (zona $|k| \le \pi/a$, fase $ka/2$): **coperto** (`strings.ts:125`, quote `a/2` e `a` sul canvas).
  - Non invertire i segni ($\omega_-$ acustico, $\omega_+$ ottico): **coperto** (`strings.ts:126`, `formulas.ts:35`).
  - Gap solo per $M \neq m$, $\omega_{\max}^{\mathrm{ac}}$ con $M$ pesante e $\omega_{\min}^{\mathrm{ott}}$ con $m$ leggera: **coperto** (`strings.ts:98,139-140`, preset `M = m`).
  - Nessuna imprecisione delle slide (LO/TO, fonone, $\mu \neq 0$) viene ripetuta.
- **Lezione 4, §26 — «Cosa devi saper fare» (punto 6, p. 62) ed «Errori tipici» (punto 8, p. 63)**:
  - Perché la luce IR eccita solo fononi ottici a $k \approx 0$ e mai l'acustico a $k \neq 0$ (conservazione di energia e quasi-impulso, $c/n \gg v_s$, $k_{\mathrm{luce}} \ll \pi/a$): **coperto integralmente** (`strings.ts:113,147`, strumento Luce infrarossa).
  - Precisazioni di §24 (p. 60): accoppiamento ai modi TO nei cristalli ionici/polari vs assenza di assorbimento IR a un fotone nel diamante ($M = m$): **coperto** (`strings.ts:114,147`), ma contraddetto nella barra superiore della catena per $M = m$ (v. I2).

### 2.3 Numeri e preset

- **`Coppia Na–Cl (§8)`** (`manifest.ts:57-65`, `fromDispensa: true`): $a = 5{,}64\,\text{Å}$, $M = 35{,}5\,\text{u}$, $m = 23{,}0\,\text{u}$, $C = 10\,\text{N/m}$. Riproduce tutti i numeri di §8 (p. 23) e §24 (p. 60): $v_s = 4{,}05\,\text{km/s}$ (dispensa $\approx 4{,}1\cdot 10^3\,\text{m/s}$ per arrotondamento intermedio), $\omega_{\max}^{\mathrm{ac}} = 1{,}84\cdot 10^{13}\,\text{rad/s}$ ($2{,}93\,\text{THz}$, dispensa $2{,}9\,\text{THz}$), $\omega_{\min}^{\mathrm{ott}} = 2{,}29\cdot 10^{13}\,\text{rad/s}$ ($3{,}64\,\text{THz}$, dispensa $3{,}6\,\text{THz}$), $\omega_+(0) = 2{,}94\cdot 10^{13}\,\text{rad/s}$ ($4{,}68\,\text{THz}$, $19{,}3\,\text{meV}$, dispensa $4{,}7\,\text{THz}$, $19\,\text{meV}$), gap $0{,}71\,\text{THz}$ (dispensa $\approx 0{,}7\,\text{THz}$), $\lambda_{\mathrm{IR}} = 64{,}1\,\mu\text{m}$ (dispensa $\approx 64\,\mu\text{m}$), $k_{\mathrm{luce}}/(\pi/a) = 1{,}76\cdot 10^{-5}$ (dispensa $\approx 2\cdot 10^{-5}$). È dichiarato esplicitamente che si tratta di un modello 1D illustrativo e non di un calcolo 3D di NaCl (`strings.ts:30,151`).
- **`Masse M = 2m (Fig. 11)`** (`manifest.ts:66-74`, `fromDispensa: false`): riprende il rapporto $M/m = 2$ di Figg. 11–12 e Fig. 28 con valori fisici illustrativi ($a = 5{,}0\,\text{Å}$, $M = 40\,\text{u}$, $m = 20\,\text{u}$, $C = 10\,\text{N/m}$). Dichiarato a piè di scheda (`strings.ts:151`), rifinibile nella nota del menu (v. M4).
- **`Limite M = m (gap chiuso)`** e **`Contrasto forte (Li–I)`** (`manifest.ts:75-92`, `fromDispensa: false`): dichiarati esplicitamente come profili illustrativi esterni alla dispensa sia nel menu (`strings.ts:30`) sia a piè di scheda (`strings.ts:151`).

---

## 3. Problemi riscontrati

### Bloccanti

Nessuno.

---

### Importanti

#### I1. Sintassi Markdown (`**…**` e `*…*`) resa letteralmente come asterischi nella scheda teoria
- **Dove**: `src/renderer/src/sections/phonon-diatomic/strings.ts:126, 133, 139, 140, 147` (resa da `<RichText text={p} />` in `PhononDiatomicSection.tsx:463`).
- **Cosa differisce**: il componente `RichText` (`src/renderer/src/ui/tex.tsx:26-44`) separa soltanto le formule racchiuse tra `$…$` e **non** interpreta il Markdown. Di conseguenza tutti i grassetti e corsivi scritti con asterischi nei quattro blocchi della scheda teoria appaiono sullo schermo come caratteri grezzi:
  - riga 126: `**ramo acustico**`, `**ramo ottico**`;
  - riga 133: `**velocità di gruppo negativa**`;
  - riga 139: `*un*`, `**C**`, `**B**`;
  - riga 140: `**gap fononico**`, `**ripiegato**`;
  - riga 147: `**ramo ottico a $k \approx 0$**` (dove gli asterischi avvolgono persino una formula KaTeX, lasciando `**ramo ottico a ` prima della formula e `**` subito dopo).
  Nessun'altra sezione dell'app usa asterischi Markdown dentro `RichText`.
- **Riferimento dispensa**: leggibilità e resa tipografica pulita dei termini chiave del corso (§7–8, §12, §24).
- **Correzione proposta**: rimuovere tutti i marcatori `**` e `*` da `strings.ts:126,133,139,140,147` (usando testo piano + KaTeX come in `phonon-monatomic/strings.ts`, oppure virgolette «…» per termini come «ripiegato» come fa la dispensa a p. 23).

#### I2. L'etichetta del modo ottico a $k = 0$ dichiara «dipolo IR» anche quando $M = m$
- **Dove**: `src/renderer/src/sections/phonon-diatomic/strings.ts:74` (`noteOptOrigin: 'opposizione di fase ($R_{\\mathrm{cm}} = 0$, dipolo IR)'`) e `PhononDiatomicSection.tsx:299-302`.
- **Cosa differisce**: la nota nella testata della vista spazio reale mostra sempre `opposizione di fase (R_cm = 0, dipolo IR)` sul modo ottico a $k = 0$, indipendentemente dalle masse. Se lo studente seleziona il preset `Limite M = m (gap chiuso)` (o porta $M = m$ con gli slider) restando sul modo iniziale `Ott. 0`, legge `dipolo IR` nella testata mentre immediatamente sotto sul canvas (con «Luce infrarossa» attiva) compare `p = 0` (`DiatomicChainView.tsx:446,461`) e nella colonna destra `infraredEqualNote` (`strings.ts:114`) avverte che con $M = m$ il moto relativo **non** genera dipolo e non assorbe luce IR a un fotone.
- **Riferimento dispensa**: Lezione 2, §8.1 riquadro verde p. 21 («In un cristallo ionico (per esempio NaCl) i due atomi portano cariche opposte: il moto relativo è un dipolo elettrico oscillante»), §9.2 p. 25 e Lezione 4, §24 Approfondimento (ii) p. 60 («nel diamante i due atomi sono uguali e il modo ottico a $\Gamma$ non assorbe luce a un fotone»).
- **Correzione proposta**: condizionare `noteOptOrigin` su `model.summary.equalMasses` in `PhononDiatomicSection.tsx:300-302` (come già fatto per `noteEdgeC`/`noteEdgeB` alle righe 304–308): per `equalMasses === true` mostrare `'opposizione di fase ($R_{\\mathrm{cm}} = 0$, nessun dipolo IR)'`, e per $M \neq m$ `'opposizione di fase ($R_{\\mathrm{cm}} = 0$, dipolo IR se ionico)'` (o `'opposizione di fase ($R_{\\mathrm{cm}} = 0$, dipolo IR)'`).

#### I3. Simbolo ausiliario $\bar{m}$ nella legenda del ripiegamento mai definito a schermo
- **Dove**: `src/renderer/src/sections/phonon-diatomic/strings.ts:69` (`legendFolding: 'monatomica passo $a/2$ ($\\bar{m}$)'`), `strings.ts:15` (`foldingTitle`) e `model.ts:103` (`meanMassAmu = 0.5 * (massHeavyAmu + massLightAmu)`).
- **Cosa differisce**: attivando «Confronto $M = m$», la legenda del diagramma introduce il simbolo $\bar{m}$, che non compare nella dispensa (§8.3 Approfondimento, p. 23, usa direttamente $M = m$) e non è spiegato da nessuna parte nell'interfaccia. Usare la massa media $\bar{m} = (M+m)/2$ per confrontare una catena con $M \neq m$ è fisicamente azzeccato perché mantiene identica la velocità del suono $v_s = a\sqrt{C/[2(m+M)]} = \frac{a}{2}\sqrt{C/\bar{m}}$, ma senza la definizione esplicita lo studente non sa che cosa sia $\bar{m}$ (e potrebbe chiedersi se sia la massa ridotta o la media aritmetica).
- **Riferimento dispensa**: Lezione 2, §8.1 p. 21 e §8.3 Approfondimento p. 23.
- **Correzione proposta**: esplicitare la definizione nella legenda (`'monatomica passo $a/2$, $\\bar{m} = (M+m)/2$'`) e/o nel tooltip `foldingTitle` (`strings.ts:15`).

---

### Minori

#### M1. Abbreviazione $\alpha = u_{n-1}/u_n$ a $k \neq 0$ e mancata scrittura esplicita delle equazioni del moto/ansatz
- **Dove**: `src/renderer/src/sections/phonon-diatomic/formulas.ts:45` (`\alpha = \tfrac{u_{n-1}}{u_n} = \tfrac{2C - \omega^2 M}{2C\cos(ka/2)}`) e `strings.ts:125-126`.
- **Cosa differisce**: nelle equazioni (15)–(16) della dispensa (§7.2, p. 18), $u_n(t) = A e^{i(kna/2 - \omega t)}$ ($n$ pari) e $u_{n-1}(t) = \alpha A e^{i(k(n-1)a/2 - \omega t)}$ ($n-1$ dispari), quindi $\alpha$ è il rapporto tra le **ampiezze** che moltiplicano la fase dell'onda piana (mentre il rapporto istantaneo è $u_{n-1}/u_n = \alpha e^{-ika/2}$, che si riduce ad $\alpha$ in $k = 0$ e nei limiti nullo/infinito di bordo zona; `riferimento-formule.md` riga 21 e §8.2 p. 22 usano comunque l'abbreviazione $u_{n-1}/u_n$). Inoltre, a differenza della Sezione 1, nel blocco teoria non compaiono esplicitamente le due equazioni del moto (13)–(14) né l'ansatz (15)–(16) richiesti al punto 2 di «Cosa devi saper fare» (§12, p. 29). (Nota: in `phononDispersion.ts:754-757` il fattore di fase $e^{-ika/2}$ è già calcolato correttamente.)
- **Riferimento dispensa**: Lezione 2, §7.1–7.3 eqq. (13)–(19) pp. 18–19; §12 p. 29 punto 2; Form. p. 30.
- **Correzione proposta**: nella scheda teoria (`strings.ts:126`) aggiungere brevemente le equazioni accoppiate o la forma dell'ansatz $u_n = A e^{i(kna/2-\omega t)}$, $u_{n-1} = \alpha A e^{i(k(n-1)a/2-\omega t)}$ chiarendo che $\alpha$ è il rapporto delle ampiezze (che a $k = 0$ coincide con $u_{n-1}/u_n$).

#### M2. Lettura numerica `R_cm = 0,61` priva di modulo e indicazione di normalizzazione
- **Dove**: `src/renderer/src/sections/phonon-diatomic/PhononDiatomicSection.tsx:627-630`.
- **Cosa differisce**: quando il centro di massa non è fermo (tutti i modi tranne il modo ottico a $k = 0$), il pannello valori stampa `R_cm = 0,61` (o `1,00`) senza unità né simbolo di modulo. Nella dispensa (§8.1, p. 21), $R_{\mathrm{cm}} = (Mu_n + mu_{n-1})/(M+m)$ è lo spostamento istantaneo (oscillante nel tempo, con dimensioni di lunghezza), mentre `amp.cmAmp` è l'ampiezza normalizzata adimensionale $|R_{\mathrm{cm}}|/u_{\max} \in [0,1]$.
- **Riferimento dispensa**: Lezione 2, §8.1 Esempio p. 21.
- **Correzione proposta**: scrivere `|R_{\mathrm{cm}}|/u_{\max} = 0,61` (oppure `|R_{\mathrm{cm}}| = 0,61` con nota «norm.»), mantenendo `$R_{\mathrm{cm}} = 0$ (fermo)` sul modo ottico a $k = 0$.

#### M3. Segno della divergenza di $v_p$ sul ramo ottico a $k = 0$
- **Dove**: `src/renderer/src/sections/phonon-diatomic/PhononDiatomicSection.tsx:659` (`\htmlData{q=vp}{v_p} \to \infty`) e `strings.ts:108` (`v_p = \omega_+(0)/k \to \infty`).
- **Cosa differisce**: poiché $v_p(k) = \omega_+(k)/k$ è dispari in $k$ (come correttamente commentato in `phononDispersion.ts:681`: «divergenza $\pm\infty$ sul ramo ottico»), per $k \to 0^+$ diverge a $+\infty$ mentre per $k \to 0^-$ diverge a $-\infty$. Poche righe sopra (`PhononDiatomicSection.tsx:640`), per il ramo acustico, è correttamente indicato `±v_s (per k → 0±)`.
- **Riferimento dispensa**: Lezione 2, §6.1 p. 14 ($v_p = \omega/k$ con $\omega(k) = \omega(-k) \ge 0$).
- **Correzione proposta**: sostituire `\to \infty` con `\to \pm\infty` (o `|v_p| \to \infty`) sia a `PhononDiatomicSection.tsx:659` sia in `strings.ts:108`.

#### M4. Rifiniture su conservazione $k_{\mathrm{luce}} = k_{\mathrm{ph}} (+G)$ e nota del preset `M = 2m`
- **Dove**: `src/renderer/src/sections/phonon-diatomic/formulas.ts:62-63`, `strings.ts:30, 147`.
- **Cosa differisce**:
  - In `INFRARED_FORMULAS` (`formulas.ts:63`) compare `$k_{\mathrm{luce}} = \tfrac{n\omega}{c} \ll \tfrac{\pi}{a}$` senza l'uguaglianza `$k_{\mathrm{luce}} = k_{\mathrm{ph}}$` della legge di conservazione (eq. 60, p. 59); e in `strings.ts:147` si scrive `$k_{\mathrm{luce}} = k_{\mathrm{ph}}$` senza accennare a `(+G)` / «a meno di $G$» (sebbene in 1BZ sia forzatamente $G = 0$ perché $k_{\mathrm{luce}} \ll \pi/a$).
  - Nella nota compatta del menu preset (`strings.ts:30`), `M = 2m da Fig. 11–12` può suggerire che anche $a = 5{,}0\,\text{Å}$, $m = 20\,\text{u}$, $C = 10\,\text{N/m}$ siano nella dispensa, mentre Figg. 11–12 (pp. 20, 22) usano unità adimensionali $C = m = 1$ (cosa già chiarita correttamente a piè di scheda in `strings.ts:151`: «riprende il rapporto di Fig. 11–12»).
- **Riferimento dispensa**: Lezione 4, §24 eq. (60) p. 59, Form. p. 63; Lezione 2, Fig. 11 p. 20, Fig. 12 p. 22.
- **Correzione proposta**: scrivere `k_{\mathrm{luce}} = k_{\mathrm{ph}} = \tfrac{n\omega}{c} \ll \tfrac{\pi}{a}` in `formulas.ts:63` (e aggiungere `(+G)` o «a meno di $G$» in `strings.ts:147`), e precisare `rapporto M = 2m da Fig. 11–12` in `strings.ts:30`.

---

## 4. Verdetto finale

**Da correggere.** La fisica, la coerenza $\nu$/$\omega$, la gestione dei punti singolari ($k = 0$, bordi C/B, $M = m$, $m > M$) e la copertura della dispensa Parte 6 (§§7–8, §10.3, §12, §24, §26) non presentano alcun problema bloccante; risolti i 3 punti importanti **I1–I3** (rimozione degli asterischi Markdown grezzi nella scheda teoria, correzione della nota «dipolo IR» quando $M = m$, definizione esplicita di $\bar{m} = (M+m)/2$ nella legenda), la sezione raggiungerà piena fedeltà al corso.
