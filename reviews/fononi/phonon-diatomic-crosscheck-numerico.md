# Crosscheck Numerico Indipendente — Sezione 2: Catena biatomica, gap fononico e luce infrarossa

**Modulo verificato:** [`src/renderer/src/physics/phononDispersion.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts) (sezione biatomica, righe 348–918, e costanti condivise in [`src/renderer/src/physics/constants.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/constants.ts); preset e intervalli slider da [`src/renderer/src/sections/phonon-diatomic/manifest.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-diatomic/manifest.ts))  
**Fonti di riferimento:** [`materiale/parte6/dispensa.pdf`](file:///c:/Users/filip/Documents/App-Stato-Solido/materiale/parte6/dispensa.pdf) (Lezione 2 §§7–8 pp. 17–23, §10.3 p. 27; Lezione 4 §24 pp. 59–60) e [`materiale/parte6/riferimento-formule.md`](file:///c:/Users/filip/Documents/App-Stato-Solido/materiale/parte6/riferimento-formule.md)  
**Script indipendente:** [`crosscheck/fononi/phonon_diatomic_crosscheck.py`](file:///c:/Users/filip/Documents/App-Stato-Solido/crosscheck/fononi/phonon_diatomic_crosscheck.py)  
**Output JSON grezzo:** [`crosscheck/fononi/phonon_diatomic_crosscheck_results.json`](file:///c:/Users/filip/Documents/App-Stato-Solido/crosscheck/fononi/phonon_diatomic_crosscheck_results.json)

---

## Verdetto: **APPROVATA** *(con 1 anomalia numerica Minore ma degna di fix rapido su `diatomicDynamicalMatrix` per $k \to 0$)*

Su **59 verifiche numeriche indipendenti** eseguite sul codice reale di [`phononDispersion.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts), **58/59 sono PASS** (tutte le verifiche su dispersione eq. 20, preset e numeri della dispensa, limite $M = m$ e ripiegamento, simmetria $m > M$, anello finito $2N \times 2N$, equazioni di Newton discrete, $R_{\mathrm{cm}}$, $v_g$, $v_p$, curvatura ottica, incrocio luce IR e tutti i 16 vertici degli slider risultano accurate a livello di precisione macchina $\le 10^{-15}$–$10^{-12}$, senza alcun `NaN`, `Infinity` o scambio di rami).

L'unico **FAIL** (**1/59**) riguarda una **cancellazione numerica a piccolissimi $k$** (`k ≤ 10⁻⁵ Å⁻¹`, incluso $k_{\mathrm{luce}} \approx 9{,}8 \times 10^{-6}\text{ Å}^{-1}$) nel calcolo di `det = d11 * d22 - d12 * d12` dentro `diatomicDynamicalMatrix` ([`phononDispersion.ts#L833-L837`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts#L833-L837)), dove lo scarto su `omegasRadS[0]` raggiunge $3{,}03 \times 10^{-8}$ a $k = 10^{-5}\text{ Å}^{-1}$, $1{,}00 \times 10^{-3}$ a $k = 10^{-7}\text{ Å}^{-1}$ e **$100\%$** (azzeramento forzato dal clamp `1e-14`) per $k \le 10^{-8}\text{ Å}^{-1}$. Poiché nella UI lo snap a $k = 0$ (`kSnap = 0.025`) esclude i valori $|k| \in (0, 0{,}014)\text{ Å}^{-1}$ e sull'intera griglia 1BZ di 241 punti lo scarto resta $\le 2{,}18 \times 10^{-12}$ (sotto la soglia $10^{-10}$), il problema è classificato **Minore** (risolvibile in 1 riga sostituendo `d11 * d22 - d12 * d12` con `d11 * d22 * sinHalf * sinHalf`). Non risultano problemi **Bloccanti** né **Importanti**.

---

## 1. Cosa è stato fatto e metodologia

1. **Derivazione indipendente dalla dispensa (prima di leggere `src/`):** tutte le equazioni (eqq. 13–23, §7–§8, §10.3 p. 27, §24 pp. 59–60) e i numeri di riferimento (Na–Cl §8 p. 23, $M = 2m$ Figg. 11–12 e 28, limite $M = m$ §8.3 p. 23, luce IR §24 p. 60) sono stati estratti direttamente da [`materiale/parte6/dispensa.pdf`](file:///c:/Users/filip/Documents/App-Stato-Solido/materiale/parte6/dispensa.pdf) e [`materiale/parte6/riferimento-formule.md`](file:///c:/Users/filip/Documents/App-Stato-Solido/materiale/parte6/riferimento-formule.md).
2. **Reimplementazione da zero in Python 3** ([`crosscheck/fononi/phonon_diatomic_crosscheck.py`](file:///c:/Users/filip/Documents/App-Stato-Solido/crosscheck/fononi/phonon_diatomic_crosscheck.py)), con linguaggio, librerie e algoritmi indipendenti dal codice TypeScript dell'app:
   - **Aritmetica `decimal` a 50 cifre** con costanti SI 2019 esatte ($h = 6{,}62607015 \times 10^{-34}\text{ J}\cdot\text{s}$, $e = 1{,}602176634 \times 10^{-19}\text{ C}$, $c = 299\,792\,458\text{ m/s}$, $1\text{ u} = 1{,}6605390666 \times 10^{-27}\text{ kg}$, $\pi$, $\sin$, $\cos$ calcolati a 50 cifre) per eq. (20) priva di qualsiasi cancellazione e per tutte le scale caratteristiche.
   - **Diagonalizzazione indipendente di Jacobi della matrice dinamica $2 \times 2$ $\mathbf{D}(k)$** (§10.3 p. 27) su 5 griglie 1BZ da 241 punti (`nacl-pair`, `nacl-swapped`, `mass-ratio-2`, `equal-masses`, `lii-contrast`) e 2 griglie estese $[-2\pi/a, +2\pi/a]$ da 401 punti, verificando elementi $D_{ij}$, autovalori $\omega_\mp^2$, ortonormalità degli autovettori $\boldsymbol{\varepsilon}^\mp$, residuo $\|\mathbf{D}\boldsymbol{\varepsilon} - \omega^2\boldsymbol{\varepsilon}\|/\operatorname{tr}\mathbf{D}$, coerenza di $\alpha = \sqrt{M/m}\,(\varepsilon_m/\varepsilon_M)$ con `diatomicModeAmplitude`, sostituzione diretta nelle eqq. (17)–(18) e identità esatta $\alpha_-(k)\,\alpha_+(k) = -M/m$.
   - **Diagonalizzazione ciclica di Jacobi dell'anello finito BvK $2N \times 2N$** ($\mathcal{D}_{ij} = \Phi_{ij}/\sqrt{m_i m_j}$ per $N \in \{4, 5, 6, 7, 8, 12\}$ celle, $2N$ atomi alternati $M, m$), verificando la regola di somma nulla $\sum_j \Phi_{ij} = 0$ e la coincidenza 1-a-1 dei $2N$ autovalori con i $2N$ modi `diatomicOmega` su `bvkAllowedK1D(a, N)`.
   - **Verifica diretta delle equazioni di Newton discrete (13)–(14)** su 120 configurazioni generate da `diatomicDisplacements` e verifica di $R_{\mathrm{cm}}$ sia analitica sia nel dominio del tempo.
   - **Differenze finite centrate al 4° e 2° ordine** per $v_g(k) = d\omega_\mp/dk$ su 1BZ e zona estesa, più verifica della curvatura ottica $\omega_+''(0) = -Ca^2/(2(m+M)\omega_+(0))$ (§8.1 p. 21).
   - **Risolutore indipendente a 50 cifre (170 passi di bisezione)** per l'incrocio con la luce IR $\omega_+(k) = (c/n)k$ (§24 eq. 60) su 25 combinazioni (5 preset × 5 indici $n \in \{1, 1{,}5, 2{,}4, 3{,}4, 5{,}7\}$).
   - **Stress-test su tutti i 16 vertici della scatola degli slider** ($a \in \{3, 7\}$, $M \in \{6, 210\}$, $m \in \{6, 210\}$, $C \in \{2, 80\}$), sonde logaritmiche $k \in [10^{-10}, 10^{-1}]\text{ Å}^{-1}$ e sonda di chiusura del gap $M/m = 1 + \delta$ per $\delta \in [0, 10^{-1}]$.
3. **Esecuzione diretta del codice reale dell'app:** lo script Python invoca `.tools/node/node.exe` (Node v26.13.1) con `module.registerHooks` per importare ed eseguire direttamente [`src/renderer/src/physics/phononDispersion.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts) senza modificare alcun file in `src/`.

---

## 2. Comandi eseguiti e risultati effettivi

| Comando | Esito | Risultato |
|---|---|---|
| `python crosscheck/fononi/phonon_diatomic_crosscheck.py` | Exit code `1` (1 fail atteso su sonda piccoli $k$ in `D(k)`) | **58/59 PASS, 1 FAIL**; JSON salvato in [`crosscheck/fononi/phonon_diatomic_crosscheck_results.json`](file:///c:/Users/filip/Documents/App-Stato-Solido/crosscheck/fononi/phonon_diatomic_crosscheck_results.json) |
| `.\.tools\node\node.exe .\node_modules\vitest\vitest.mjs run src/renderer/src/physics/phononDispersion.test.ts` | Exit code `0` | `1 passed (1)`, `17 passed (17)` in 214 ms |
| Sonda passo minimo slider UI ($M=210\text{ u}, m=209{,}9\text{ u}$ a $k=\pi/a$, `node --input-type=module -e ...`) | Exit code `0` | `ampAc.alpha = 0` (`lightStationary: true`), `ampOp.invAlpha = 0` (`heavyStationary: true`), `dm.eigenvectors = [[1, 5.95e-13], [5.95e-13, -1]]` |

---

## 3. Tabella riassuntiva dei confronti numerici

### 3.1 Numeri di riferimento Na–Cl (§8 p. 23, §24 p. 60) e preset della sezione

| Grandezza | Input | Valore dispensa | Valore `physics/` | Valore crosscheck (50 cifre) | Errore rel. | Esito |
|---|---|---|---|---|---|---|
| $v_s$ | Na–Cl ($a=5{,}64\text{ Å}, M=35{,}5\text{ u}, m=23\text{ u}, C=10\text{ N/m}$) | $\approx 4{,}1 \cdot 10^3\text{ m/s}$ *(v. nota)* | $4046{,}3330\text{ m/s}$ | $4046{,}3330\text{ m/s}$ | $0{,}00$ | PASS |
| $\omega_{\max}^{\mathrm{ac}}$ / $\nu_{\max}^{\mathrm{ac}}$ (punto C) | Na–Cl (§8 p. 23) | $\approx 1{,}84 \cdot 10^{13}\text{ rad/s}$ ($\approx 2{,}9\text{ THz}$) | $1{,}841943 \cdot 10^{13}\text{ rad/s}$ / $2{,}931544\text{ THz}$ | identico | $\le 6{,}56 \times 10^{-16}$ | PASS |
| $\omega_{\min}^{\mathrm{ott}}$ / $\nu_{\min}^{\mathrm{ott}}$ (punto B) | Na–Cl (§8 p. 23) | $\approx 2{,}29 \cdot 10^{13}\text{ rad/s}$ ($\approx 3{,}6\text{ THz}$) | $2{,}288372 \cdot 10^{13}\text{ rad/s}$ / $3{,}642056\text{ THz}$ | identico | $\le 6{,}56 \times 10^{-16}$ | PASS |
| $\omega_+(0)$ / $\nu_+(0)$ | Na–Cl (§8 p. 23) | $\approx 2{,}94 \cdot 10^{13}\text{ rad/s}$ ($\approx 4{,}7\text{ THz}$) | $2{,}937584 \cdot 10^{13}\text{ rad/s}$ / $4{,}675310\text{ THz}$ | identico | $\le 6{,}56 \times 10^{-16}$ | PASS |
| $\hbar\omega_+(0)$ | Na–Cl (§8 p. 23) | $\approx 19\text{ meV}$ | $19{,}335528841\text{ meV}$ | $19{,}335528845\text{ meV}$ | $2{,}23 \times 10^{-10}$ | PASS |
| Gap $\Delta\nu_{\mathrm{gap}}$ | Na–Cl (§8 p. 23) | $\approx 0{,}7\text{ THz}$ | $0{,}710512\text{ THz}$ ($2{,}938\text{ meV}$) | $0{,}710512\text{ THz}$ | $6{,}56 \times 10^{-16}$ | PASS |
| Luce IR: $\lambda_0$ | Na–Cl, $n=1$ (§24 p. 60) | $\approx 64\ \mu\text{m}$ | $64{,}122476\ \mu\text{m}$ | $64{,}122476\ \mu\text{m}$ | $0{,}00$ | PASS |
| Luce IR: $k_{\mathrm{luce}}$ | Na–Cl, $n=1$ (§24 p. 60) | $\approx 1 \cdot 10^5\text{ m}^{-1}$ | $9{,}798725 \cdot 10^4\text{ m}^{-1}$ | $9{,}798725 \cdot 10^4\text{ m}^{-1}$ | $1{,}49 \times 10^{-16}$ | PASS |
| Luce IR: $k_{\mathrm{luce}}/(\pi/a)$ | Na–Cl, $n=1$ (§24 p. 60) | $\approx 2 \cdot 10^{-5}$ ($\pi/a \approx 5{,}6 \cdot 10^9\text{ m}^{-1}$) | $1{,}759134 \cdot 10^{-5}$ | $1{,}759134 \cdot 10^{-5}$ | $1{,}92 \times 10^{-16}$ | PASS |
| Luce IR: $(c/n)/v_s$ | Na–Cl, $n=1$ (§24 p. 59) | $\sim 10^5$ | $7{,}408991 \cdot 10^4$ | $7{,}408991 \cdot 10^4$ | $0{,}00$ | PASS |
| Rapporti canonici $M = 2m$ | Preset `mass-ratio-2` ($a=5\text{ Å}, M=40\text{ u}, m=20\text{ u}, C=10$) | $\omega_{\min}^{\mathrm{ott}}/\omega_{\max}^{\mathrm{ac}}=\sqrt{2}$, $\omega_+(0)/\omega_{\max}^{\mathrm{ac}}=\sqrt{3}$, $\alpha_+(0)=-2$ | $1{,}414213562373095$ / $1{,}732050807568877$ / $-2$ | $\sqrt{2}$ / $\sqrt{3}$ / $-2$ | $\le 1{,}86 \times 10^{-16}$ | PASS |
| Preset `equal-masses` ($M=m=29\text{ u}$) | $a=5{,}64\text{ Å}, C=10\text{ N/m}$ | gap $= 0$, $v_s = \frac{a}{2}\sqrt{C/m}$, $\omega_+(0) = 2\sqrt{C/m}$ | $v_s = 4063{,}737\text{ m/s}$, $\nu_+(0) = 4{,}586977\text{ THz}$, gap $= 0$ | identico | $\le 1{,}94 \times 10^{-16}$ | PASS |
| Preset `lii-contrast` ($M=126{,}9, m=6{,}9$) | $a=6{,}0\text{ Å}, C=10\text{ N/m}$ | profilo illustrativo forte contrasto | $v_s = 2846{,}319\text{ m/s}$, gap $= 5{,}098926\text{ THz}$ | identico | $\le 2{,}12 \times 10^{-16}$ | PASS |

*(Nota sulla dispensa §8 p. 23: per Na–Cl la dispensa stampa $v_s \approx 4{,}1 \cdot 10^3\text{ m/s}$, mentre il valore esatto di $a\sqrt{C/[2(m+M)]}$ è $4046{,}3\text{ m/s}$ con $1\text{ u} = 1{,}660539 \times 10^{-27}\text{ kg}$ e $4047{,}2\text{ m/s}$ con le masse arrotondate $3{,}82$ e $5{,}89 \times 10^{-26}\text{ kg}$ della dispensa. Si tratta di un arrotondamento per eccesso di $4{,}05 \to 4{,}1$ nella dispensa, non di un errore di `physics/`.)*

### 3.2 Verifiche su griglie 1BZ, matrice dinamica $\mathbf{D}(k)$, anello $2N\times 2N$, $v_g$, $R_{\mathrm{cm}}$, $M=m$, $m>M$ e IR

| Area / Grandezza | Input | Valore dispensa | Valore `physics/` | Valore crosscheck | Scarto max | Esito |
|---|---|---|---|---|---|---|
| Eq. (20) su griglia 1BZ (241 pt × 5 preset) ed estesa (401 pt × 2) | `nacl`, `nacl-swap`, `M=2m`, `M=m`, `Li-I` | eq. (20) | `diatomicOmega` | eq. (20) a 50 cifre | rel $\le 3{,}70 \times 10^{-16}$ | PASS |
| Curve campionate (`nacl-1bz` 241 pt, `nacl-ext` 401 pt) | $\omega, \nu, \hbar\omega$ su entrambi i rami | eq. (20) | `diatomicDispersionCurve` | eq. (20) 50 cifre + SI 2019 | $\omega,\nu \le 4{,}41 \times 10^{-16}$; meV $2{,}23 \times 10^{-10}$ | PASS |
| Matrice dinamica $2\times 2$ $\mathbf{D}(k)$ su griglie 1BZ (241 pt) | 5 preset + 2 estese | §10.3 p. 27, eq. (28) | `diatomicDynamicalMatrix` | Jacobi 2×2 + 50 cifre | $D_{ij} \le 3{,}31 \times 10^{-16}$; $\omega_+^2 \le 3{,}22 \times 10^{-16}$; $\omega_-^2 \le 2{,}18 \times 10^{-12}$ (a $k=-0{,}0046$); res/orto $\le 2{,}28 \times 10^{-16}$ | PASS |
| **Sonda piccoli $k$ su `diatomicOmega`** | Na–Cl, $k \in \{10^{-1} \dots 10^{-10}\}\text{ Å}^{-1}$ | $\omega_- \simeq v_s |k|$ (eq. 21) | `diatomicOmega` (coniugata) | eq. (20) a 50 cifre | rel $2{,}30 \times 10^{-16}$ | PASS |
| **Sonda piccoli $k$ su `diatomicDynamicalMatrix`** | Na–Cl, $k \in \{10^{-1} \dots 10^{-10}\}\text{ Å}^{-1}$ | $\det\mathbf{D} = \frac{4C^2}{Mm}\sin^2\frac{ka}{2}$ | `det = d11*d22 - d12*d12` | eq. (20) a 50 cifre | $3{,}03 \times 10^{-8}$ ($10^{-5}$), $1{,}00 \times 10^{-3}$ ($10^{-7}$), **$1{,}00$ ($k \le 10^{-8}$, clamp a 0)** | **FAIL** *(Minore)* |
| Rapporto $\alpha$ da autovettori $\mathbf{D}(k)$, eqq. (17)–(18) e $\alpha_-\alpha_+ = -M/m$ | 5 griglie 1BZ + 2 estese | §7.3, §8.1–8.2, §10.3 | `diatomicModeAmplitude` + `diatomicDynamicalMatrix` | $\sqrt{M/m}(\varepsilon_m/\varepsilon_M)$ e sostituzione eqq. (17)–(18) | $\alpha_{\text{eig}} \le 8{,}88 \times 10^{-15}$; eqq. (17)–(18) $\le 7{,}94 \times 10^{-16}$; $\alpha_-\alpha_+ \le 1{,}73 \times 10^{-14}$ | PASS |
| Velocità di gruppo $v_g$ analitica vs FD4/FD2 e $v_p = \omega/k$ | 5 griglie 1BZ + 2 estese | §6.2, §8.1 ($v_{g,+} < 0$ per $0<k<\pi/a$) | `diatomicGroupVelocity` / `PhaseVelocity` | FD4 ($h=10^{-4}$), FD2 ($h=10^{-5}$) | FD4 $\le 1{,}47 \times 10^{-12}$; FD2 $\le 1{,}75 \times 10^{-9}$; $v_p \le 2{,}54 \times 10^{-14}$ | PASS |
| Curvatura ramo ottico a $k=0$ e segni $v_g$ in $(0, \pi/a)$ | Na–Cl, $k=10^{-3}\text{ Å}^{-1}$ | $\omega_+''(0) = -\frac{Ca^2}{2(m+M)\omega_+(0)}$ (§8.1 p. 21) | FD2 su `diatomicOmega` | $-5{,}573564 \times 10^{-7}\text{ m}^2/\text{s}$ | rel $2{,}79 \times 10^{-7}$ (atteso $O(k^2)$); $v_{g,+}<0$, $v_{g,-}>0$ ovunque | PASS |
| Ripiegamento $M = m$ vs monatomica di passo $a/2$ | $m=29\text{ u}, a=5{,}64$; $m=28\text{ u}, a=5{,}0$ (81 pt) | $\omega_\mp = 2\sqrt{C/m}|\sin,\cos(ka/4)|$ (§8.3 p. 23) | `diatomicOmega` vs `monatomicOmega(a/2)` | formule chiuse sin/cos + `monatomicGroupVelocity` | $\omega_\mp \le 2{,}71 \times 10^{-16}$; $v_g \le 3{,}72 \times 10^{-16}$; gap $= 0$ | PASS |
| Chiusura continua e monotona del gap ($M/m = 1+\delta$) | $\delta \in \{10^{-1} \dots 10^{-15}, 0\}$ | $\Delta\omega_{\mathrm{gap}} \to 0^+$ | `diatomicSummary` | 50 cifre | monotona, $\Delta\omega/\omega_+(0) \le 1{,}16 \times 10^{-16}$ | PASS |
| Simmetria esatta per $m > M$ | Na–Cl vs Cl–Na (241 pt 1BZ) | invarianza $\omega, v_s, v_g, R_{\mathrm{cm}}$; $\alpha \leftrightarrow 1/\alpha$ | `diatomic*` | confronto diretto $(M,m)$ vs $(m,M)$ | $\omega, v_g, \alpha = 0{,}00$; $R_{\mathrm{cm}} = 3{,}33 \times 10^{-16}$; flag scambiati esatti | PASS |
| Spettro anello finito BvK $2N \times 2N$ (Jacobi indipendente) | 7 anelli ($N \in \{4,5,6,7,8,12\}$, anche $M=m$ e $m>M$) | $2N$ modi, $\sum_j \Phi_{ij} = 0$ (§13.5 Fig. 16) | `diatomicOmega` su `bvkAllowedK1D` | Jacobi ciclico su $\Phi_{ij}/\sqrt{m_i m_j}$ | $\sum\Phi = 0$; $|\omega-\omega_{J}|/\omega_{\max} \le 4{,}07 \times 10^{-16}$; $|\omega^2-\lambda_J|/\lambda_{\max} \le 7{,}96 \times 10^{-16}$ | PASS |
| Equazioni di Newton discrete (13)–(14) | 120 configurazioni $u_n(t)$ (4 preset × 5 $k$ × 2 rami × 3 fasi) | $m_i\ddot{u}_i = C(u_{i+1}-2u_i+u_{i-1})$ | `diatomicDisplacements` | residuo normalizzato a $2C$ | abs $7{,}11 \times 10^{-16}$ | PASS |
| Centro di massa della cella $R_{\mathrm{cm}}$ | 120 configurazioni (incl. ottico $k=0$ e acustico $k=0$) | $R_{\mathrm{cm}} = 0$ (ottico $k=0$, slide 43); $1$ (acustico $k=0$) | `diatomicModeAmplitude.cmAmp` + `Displacements` | $|M\cdot\text{amp}_M + m\cdot\text{amp}_m e^{-ika/2}|/(M+m)$ + dominio tempo | err $\le 2{,}22 \times 10^{-16}$; $R_{\mathrm{cm}}(\text{ott},0)=0$ esatto | PASS |
| Incrocio luce IR $\omega_+(k) = (c/n)k$ | 25 combinazioni (5 preset × $n \in \{1, 1{,}5, 2{,}4, 3{,}4, 5{,}7\}$) | eq. (60), §24 pp. 59–60 | `diatomicInfraredCrossing` | bisezione 50 cifre (170 passi) | $\omega \le 1{,}82 \times 10^{-16}$; $k \le 4{,}25 \times 10^{-16}$; residuo $1{,}82 \times 10^{-16}$; meV $2{,}23 \times 10^{-10}$ | PASS |
| Estremi degli slider (tutti i 16 vertici) | $a\in\{3,7\}$, $M,m\in\{6,210\}$, $C\in\{2,80\}$ | nessun `NaN`/`Inf`, $\omega_- \le \omega_+$ | `diatomic*` | eq. (20) a 50 cifre | $\le 2{,}21 \times 10^{-16}$ | PASS |

---

## 4. Problemi trovati (in ordine di gravità)

### Bloccanti
Nessuno.

### Importanti
Nessuno.

### Minori

1. **Cancellazione catastrofica e clamp a zero in `diatomicDynamicalMatrix` per piccoli $k$ ($k \lesssim 10^{-5}\text{ Å}^{-1}$)**
   - **Dove:** [`src/renderer/src/physics/phononDispersion.ts#L833-L837`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts#L833-L837):
     ```ts
     const detRaw = d11 * d22 - d12 * d12
     const det = Math.abs(detRaw) < 1e-14 * d11 * d22 ? 0 : Math.max(0, detRaw)
     const eigHigh = 0.5 * trace + rad
     const eigLow = eigHigh > 0 ? Math.max(0, det / eigHigh) : 0
     ```
   - **Cosa è sbagliato e perché:** vicino a $k = 0$ (e $k = \pm 2\pi/a$), $d_{12}^2 = d_{11}d_{22}\cos^2(ka/2) \approx d_{11}d_{22}\bigl(1 - (ka/2)^2\bigr)$, per cui la sottrazione `d11 * d22 - d12 * d12` cancella circa $-2\log_{10}(ka/2)$ cifre significative e la soglia `< 1e-14 * d11 * d22` azzera bruscamente `det`, `eigenvalues[0]` e `omegasRadS[0]` non appena $\sin^2(ka/2) < 10^{-14}$ (cioè $k \lesssim 3{,}5 \times 10^{-8}\text{ Å}^{-1}$ per Na–Cl). Al contrario, `diatomicOmega` (che usa la forma coniugata con $\sin^2(ka/2)$ alle righe 534–537) mantiene precisione $\le 2{,}30 \times 10^{-16}$ su tutto $[10^{-10}, 10^{-1}]\text{ Å}^{-1}$.
   - **Come riprodurlo (su Na–Cl, $a=5{,}64\text{ Å}, M=35{,}5\text{ u}, m=23\text{ u}, C=10\text{ N/m}$):**
     - $k = 10^{-4}\text{ Å}^{-1}$: `dm.omegasRadS[0]` errore rel. $9{,}51 \times 10^{-10}$ (vs $1{,}18 \times 10^{-16}$ in `diatomicOmega`);
     - $k = 10^{-5}\text{ Å}^{-1}$ ($\approx k_{\mathrm{luce}}$): errore rel. $3{,}03 \times 10^{-8}$ (supera la soglia $10^{-10}$);
     - $k = 10^{-7}\text{ Å}^{-1}$: errore rel. $1{,}00 \times 10^{-3}$ ($0{,}1\%$);
     - $k = 10^{-8}\text{ Å}^{-1}$: `dm.det = 0`, `dm.omegasRadS[0] = 0` invece di $4{,}046333 \times 10^5\text{ rad/s}$ (errore **$100\%$**).
   - **Impatto e rimedio suggerito:** nella UI interattiva non è raggiungibile perché `snapKFrac` ([`store.ts#L37-L43`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-diatomic/store.ts#L37-L43)) aggancia a $k = 0$ per $|k_{\text{frac}}| < 0{,}025$ ($|k| < 0{,}014\text{ Å}^{-1}$), e sulla griglia 1BZ da 241 punti lo scarto massimo è $1{,}09 \times 10^{-12}$. Tuttavia, a livello di modulo `physics/`, si elimina completamente in una riga usando l'identità algebrica esatta del determinante: `const sinHalf = Math.sin(0.5 * k * params.a); const det = d11 * d22 * sinHalf * sinHalf`, rimuovendo anche il clamp `1e-14`.

2. **Soglie non allineate per masse quasi uguali ($\delta = |M-m|/M \in [10^{-15}, 10^{-11}]$) sul bordo di zona $k = \pi/a$**
   - **Dove:** [`phononDispersion.ts#L568`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts#L568) (`equalMasses < 1e-12`), [`#L716`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts#L716) (`scaleTol = (1e-12 * twoC)**2`), [`#L841`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts#L841) (`< 1e-15`).
   - **Cosa succede:** per $k = \pi/a$, `Math.cos(0.5 * (Math.PI / a) * a)` in IEEE-754 vale $\sim 2{,}8 \times 10^{-16}$ (non esattamente $0$). Di conseguenza, per chiamate programmatiche con $\delta = 10^{-13}$ (non raggiungibili dagli slider UI, dove il passo minimo è $0{,}1\text{ u} \implies \delta_{\min} \ge 4{,}76 \times 10^{-4}$), `diatomicSummary.equalMasses` è `true` e `diatomicModeAmplitude` restituisce già il limite degenere $\alpha = 1$, mentre `diatomicDynamicalMatrix` (soglia $10^{-15}$) ruota ancora continuamente gli autovettori (`eAc = [0.999996, 0.00283]`). A $\delta = 10^{-11}$ `ampAc.alpha` vale $2{,}83 \times 10^{-5}$ invece di $0$. Al passo minimo raggiungibile dagli slider UI ($M = 210\text{ u}, m = 209{,}9\text{ u}$) il comportamento è invece del tutto pulito (`ampAc.alpha = 0`, `ampOp.invAlpha = 0`, `dm` allineata a $5{,}95 \times 10^{-13}$).

3. **Troncamento a 10 cifre di `THZ_TO_MEV = 4.135667696` in `constants.ts` (già segnalato in Sezione 1)**
   - **Dove:** [`src/renderer/src/physics/constants.ts#L53`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/constants.ts#L53).
   - **Dettaglio:** rispetto a $(h/e) \cdot 10^{15} = 4{,}135667696923859\text{ meV/THz}$ (esatto SI 2019), introduce uno scarto relativo sistematico di $2{,}234 \times 10^{-10}$ su tutte le uscite in `meV` (`energyAcousticMaxMev`, `energyOpticalMinMev`, `energyOpticalZeroMev`, `energyGapMev`, `infrared.energyMev`, `curve.*EnergyMev`), del tutto ininfluente ai fini didattici.

---

## 5. Cosa non è stato verificato

- Rendering grafico Canvas/SVG, animazione della catena biatomica, formule KaTeX nella UI, layout responsive a 1440/1100/800 px e qualità didattica dei testi in `src/renderer/src/sections/phonon-diatomic/` (di competenza di `critico-grafico`, `studente` e `fedelta-corso`).
- Typecheck globale, build Electron e assenza di regressioni su altre sezioni (di competenza di `revisore-integrazione`).
- Comportamento della dispersione evanescente nel gap fononico ($\omega_{\max}^{\mathrm{ac}} < \omega < \omega_{\min}^{\mathrm{ott}}$, $k = \pi/a + i\kappa$), poiché nessuna funzione di decadimento evanescente nel gap è esportata da `phononDispersion.ts` per la catena biatomica.
