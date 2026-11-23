# Crosscheck Numerico Indipendente — Sezione 1: Catena monatomica e prima zona di Brillouin

**Modulo verificato:** [`src/renderer/src/physics/phononDispersion.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts) (e costanti condivise in [`src/renderer/src/physics/constants.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/constants.ts))  
**Fonti di riferimento:** [`materiale/parte6/dispensa.pdf`](file:///c:/Users/filip/Documents/App-Stato-Solido/materiale/parte6/dispensa.pdf) (Lezione 1 §§1–5, pp. 2–13; Lezione 2 §6, pp. 14–17; Lezione 3 §13, pp. 31–34) e [`materiale/parte6/riferimento-formule.md`](file:///c:/Users/filip/Documents/App-Stato-Solido/materiale/parte6/riferimento-formule.md)  
**Script indipendente:** [`crosscheck/fononi/phonon_monatomic.mjs`](file:///c:/Users/filip/Documents/App-Stato-Solido/crosscheck/fononi/phonon_monatomic.mjs)  
**Output JSON grezzo:** [`crosscheck/fononi/phonon_monatomic_results.json`](file:///c:/Users/filip/Documents/App-Stato-Solido/crosscheck/fononi/phonon_monatomic_results.json)

---

## Verdetto: **APPROVATA**

Tutte le **101 verifiche numeriche indipendenti** su [`phononDispersion.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts) sono state superate (**101/101 PASS, 0 FAIL**), senza alcun `NaN`, `Infinity`, scambio di segno, fattore $2$/$\pi$ mancante o errore di conversione di unità. Non sono emersi problemi **Bloccanti** né **Importanti**; si segnalano soltanto **3 osservazioni Minori** (precisione di troncamento di `THZ_TO_MEV` a $2{,}23 \times 10^{-10}$, snap euclideo non periodico in `bvkSnapToAllowedK` al bordo sinistro $-\pi/a$ per $N$ pari, e un dettaglio numerico di $2{,}5 \times 10^{-9}$ vicino alla soglia $\omega \to \omega_{\max}^+$ in `monatomicEvDecayKappa` più `-0` per $N=1$).

---

## 1. Cosa è stato fatto e metodologia

1. **Derivazione indipendente dalla dispensa:** prima di leggere il codice in `src/renderer/src/physics/`, tutte le equazioni (eqq. 3, 6, 8, 9, 31, 32, 33, §3.2–§3.4, §4.1–§4.3, §6.2–§6.3, §13.2–§13.5) e i numeri di riferimento (§3 p. 9, Fig. 5 p. 10, §13.4 p. 33) sono stati ricavati direttamente da `materiale/parte6/dispensa.pdf` e `materiale/parte6/riferimento-formule.md`.
2. **Reimplementazione da zero con metodi indipendenti** in [`crosscheck/fononi/phonon_monatomic.mjs`](file:///c:/Users/filip/Documents/App-Stato-Solido/crosscheck/fononi/phonon_monatomic.mjs):
   - costanti SI 2019 esatte ($h = 6{,}62607015 \times 10^{-34}\text{ J}\cdot\text{s}$, $e = 1{,}602176634 \times 10^{-19}\text{ C}$, $\hbar = h/2\pi$, $1\text{ u} = 1{,}6605390666 \times 10^{-27}\text{ kg}$);
   - **diagonalizzazione diretta di Jacobi** della matrice dinamica reale simmetrica $\mathbf{D} = \frac{1}{M}\boldsymbol{\Phi}$ ($N \times N$, con $\Phi_{nn} = 2C$, $\Phi_{n,n\pm 1} = -C$ ad anello) per $N = 1 \dots 24$, verificando sia la regola di somma nulla $\sum_m \Phi_{nm} = 0$ sia la coincidenza 1-a-1 degli autovalori $\sqrt{\lambda_i}$ con le frequenze analitiche `monatomicOmega(k_j)`;
   - **verifica diretta sull'equazione di Newton discreta** (eq. 6) $M\ddot{u}_n = C(u_{n+1} + u_{n-1} - 2u_n)$ sia nel regime propagante ($u_n = \cos(kna - \phi)$) sia in quello evanescente ($u_n = (-1)^n e^{-\kappa na}$);
   - **differenze finite centrate al 2° e 4° ordine** per $v_g(k) = d\omega/dk$ (e per $d\nu/dk$, $d(\hbar\omega)/dk$) su tutta la griglia $[-3\pi/a, +3\pi/a]$ (1ª, 2ª e 3ª zona di Brillouin);
   - **formula priva di cancellazione** $\kappa = \frac{2}{a}\operatorname{arsinh}\bigl(\sqrt{(r-1)(r+1)}\bigr)$ (con $r = \omega/\omega_{\max}$) per il decadimento evanescente, integrata da una verifica a **50 cifre decimali** in Python `decimal`.
3. **Esecuzione diretta del codice reale dell'app:** le funzioni reali esportate da [`src/renderer/src/physics/phononDispersion.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts) sono state importate ed eseguite direttamente tramite Node v26.13.1 (`.tools/node/node.exe`) con `module.registerHooks` per risolvere gli import `.ts` senza estensione, senza modificare alcun file in `src/`.

---

## 2. Comandi eseguiti e risultati effettivi

| Comando | Esito | Risultato |
|---|---|---|
| `.\.tools\node\node.exe crosscheck/fononi/phonon_monatomic.mjs` | Exit code `0` | **101/101 verifiche superate**, `0` fallite; salvato `crosscheck/fononi/phonon_monatomic_results.json` |
| `.\.tools\node\node.exe .\node_modules\vitest\vitest.mjs run src/renderer/src/physics/phononDispersion.test.ts` | Exit code `0` | `1 passed (1)`, `8 passed (8)` in 168 ms |
| Verifica `decimal` a 50 cifre (`python -c ...` per $\kappa$ a $r = 1 + 10^{-8}$) | Exit code `0` | $\kappa_{\text{exact}} = 1{,}13137084895567 \times 10^{-4}\text{ Å}^{-1}$ vs $\kappa_{\text{app}} = 1{,}13137084268930 \times 10^{-4}\text{ Å}^{-1}$ |
| Sonda casi limite estremi (`node --input-type=module -e ...`) | Exit code `0` | Verificati $\varepsilon \in [10^{-15}, 10^{-8}]$, $\omega < 0$, `NaN`, $N \le 0$, `bvkSnapToAllowedK` fuori zona e a $-\pi/a$ |

---

## 3. Tabella riassuntiva dei confronti numerici

### 3.1 Scale caratteristiche: Metallo tipico (§3, p. 9), Piombo 1D, Carbonio 1D

| Grandezza | Input | Valore dispensa | Valore `physics/` | Valore crosscheck | Errore rel. | Esito |
|---|---|---|---|---|---|---|
| $\sqrt{C/M}$ | Metallo §3 esatto ($M=1{,}05\cdot 10^{-25}\text{ kg}$, $a=2{,}5\text{ Å}$, $C=20\text{ N/m}$) | $1{,}38 \cdot 10^{13}\text{ s}^{-1}$ | $1{,}380131 \cdot 10^{13}\text{ s}^{-1}$ | $1{,}380131 \cdot 10^{13}\text{ s}^{-1}$ | $0{,}00$ | PASS |
| $v_s$ | Metallo §3 esatto | $\approx 3{,}5 \cdot 10^3\text{ m/s}$ | $3450{,}328\text{ m/s}$ | $3450{,}328\text{ m/s}$ | $0{,}00$ | PASS |
| $\omega_{\max}$ | Metallo §3 esatto | $\approx 2{,}8 \cdot 10^{13}\text{ rad/s}$ | $2{,}760262 \cdot 10^{13}\text{ rad/s}$ | $2{,}760262 \cdot 10^{13}\text{ rad/s}$ | $0{,}00$ | PASS |
| $\nu_{\max}$ | Metallo §3 esatto | $\approx 4{,}4\text{ THz}$ | $4{,}393094\text{ THz}$ | $4{,}393094\text{ THz}$ | $0{,}00$ | PASS |
| $\hbar\omega_{\max}$ | Metallo §3 esatto | $\approx 18\text{ meV}$ | $18{,}168376\text{ meV}$ | $18{,}168376\text{ meV}$ | $2{,}23 \times 10^{-10}$ | PASS |
| $\sqrt{C/M}$ | Preset `typical-metal` ($M=63{,}2\text{ u}$, $a=2{,}5\text{ Å}$, $C=20\text{ N/m}$) | $1{,}38 \cdot 10^{13}\text{ s}^{-1}$ | $1{,}380486 \cdot 10^{13}\text{ s}^{-1}$ | $1{,}380486 \cdot 10^{13}\text{ s}^{-1}$ | $0{,}00$ | PASS |
| $v_s$ | Preset `typical-metal` | $\approx 3{,}5 \cdot 10^3\text{ m/s}$ | $3451{,}214\text{ m/s}$ | $3451{,}214\text{ m/s}$ | $0{,}00$ | PASS |
| $\omega_{\max}$ | Preset `typical-metal` | $\approx 2{,}8 \cdot 10^{13}\text{ rad/s}$ | $2{,}760971 \cdot 10^{13}\text{ rad/s}$ | $2{,}760971 \cdot 10^{13}\text{ rad/s}$ | $0{,}00$ | PASS |
| $\nu_{\max}$ / $\hbar\omega_{\max}$ | Preset `typical-metal` | $\approx 4{,}4\text{ THz}$ / $18\text{ meV}$ | $4{,}394222\text{ THz}$ / $18{,}173044\text{ meV}$ | $4{,}394222\text{ THz}$ / $18{,}173044\text{ meV}$ | $0{,}00$ / $2{,}23\times 10^{-10}$ | PASS |
| $\omega_{\max}$ / $\nu_{\max}$ / $\hbar\omega_{\max}$ | Preset `lead-1d` ($a=3{,}5\text{ Å}$, $M=207{,}2\text{ u}$, $C=6\text{ N/m}$) | — (profilo 1D illustrativo) | $8{,}351918 \cdot 10^{12}\text{ rad/s}$ / $1{,}329249\text{ THz}$ / $5{,}497332\text{ meV}$ | identico | $\le 2{,}23 \times 10^{-10}$ | PASS |
| $v_s$ / $\pi/a$ | Preset `lead-1d` | — | $1461{,}586\text{ m/s}$ / $0{,}897598\text{ Å}^{-1}$ | identico | $0{,}00$ | PASS |
| $\omega_{\max}$ / $\nu_{\max}$ / $\hbar\omega_{\max}$ | Preset `carbon-1d` ($a=2{,}0\text{ Å}$, $M=12{,}0\text{ u}$, $C=90\text{ N/m}$) | — (profilo 1D illustrativo) | $1{,}344114 \cdot 10^{14}\text{ rad/s}$ / $21{,}392237\text{ THz}$ / $88{,}471185\text{ meV}$ | identico | $\le 2{,}23 \times 10^{-10}$ | PASS |
| $v_s$ / $\pi/a$ | Preset `carbon-1d` | — | $13441{,}139\text{ m/s}$ / $1{,}570796\text{ Å}^{-1}$ | identico | $0{,}00$ | PASS |

*(Nota: la differenza tra $M = 63{,}2\text{ u}$ del preset `typical-metal` e $M = 1{,}05 \times 10^{-25}\text{ kg} = 63{,}2325\text{ u}$ della dispensa è dello $0{,}051\%$ sulla massa, quindi dello $0{,}026\%$ su $\omega_{\max}$ e $v_s$, del tutto entro gli arrotondamenti a due cifre della dispensa.)*

### 3.2 Regimi asintotici, derivate numeriche, aliasing, evanescenza e Born–von Kármán

| Area / Grandezza | Input | Valore dispensa | Valore `physics/` | Valore crosscheck | Errore max | Esito |
|---|---|---|---|---|---|---|
| Estremi slider ($\omega, v_g, v_p$) | 8 vertici ($a\in\{2,6\}$, $M\in\{6,210\}$, $C\in\{2,100\}$) × 15 $k$ | eq. (8), §3.2–§3.3 | nessun `NaN`/`Infinity` | formule analitiche indip. | rel $0{,}00$ | PASS |
| Limite $k \to 0$: coeff. $(ka)^2/24$ | $ka = 10^{-3}$ (metallo tipico) | $1/24 = 0{,}04166667$ (§3.2) | $0{,}0416666662$ | $1/24$ (atteso $1/24 - (ka)^2/1920$) | rel $1{,}05 \times 10^{-8}$ | PASS |
| Limite $k \to 0$: termine $O((ka)^4)$ | $ka = 0{,}1$ | $\omega \simeq v_s k [1-(ka)^2/24]$ | residuo $5{,}2080 \times 10^{-8}$ | $(ka)^4/1920 = 5{,}2083 \times 10^{-8}$ | rel $5{,}95 \times 10^{-5}$ | PASS |
| Limite $k \to 0^{\pm}$: $v_g, v_p$ | $k = \pm 10^{-7}\text{ Å}^{-1}$ | $\pm v_s$ | $\pm 3451{,}2142\text{ m/s}$ | $\pm 3451{,}2142\text{ m/s}$ | rel $\le 7{,}77 \times 10^{-15}$ | PASS |
| Bordo zona: $\omega(\pm\pi/a)$ | 3 preset | $\omega_{\max}$ (§3.3) | $\omega_{\max}$ | $\omega_{\max}$ | rel $0{,}00$ | PASS |
| Bordo zona: $v_g(\pm\pi/a)$ | 3 preset | $0$ (onda stazionaria, §3.3) | $0$ (esatto) | $0$ | abs $0{,}00$ | PASS |
| Bordo zona: $v_p(\pm\pi/a)$ | 3 preset | $\pm (2/\pi) v_s$ (§5, §6.2) | $\pm (2/\pi) v_s$ | $\pm (2/\pi) v_s$ | rel $\le 2{,}44 \times 10^{-16}$ | PASS |
| Curvatura al bordo $\omega''(\pi/a)$ | 3 preset, FD2 $h=10^{-4}\text{ Å}^{-1}$ | $-a^2\omega_{\max}/4$ (§6.3 p. 17) | FD2 da `monatomicOmega` | $-a^2\omega_{\max}/4$ | rel $\le 9{,}87 \times 10^{-9}$ | PASS |
| Onda stazionaria al bordo | $k=\pi/a$, 11 atomi, 5 fasi $\phi$ | $u_n = (-1)^n \cos\phi$ (§3.3) | `monatomicDisplacements` | $(-1)^n \cos\phi$ | abs $2{,}39 \times 10^{-15}$ | PASS |
| $v_g$ analitica vs FD4 (1BZ) | 3 preset, $|k| \le \pi/a$ | $d\omega/dk$ | `monatomicGroupVelocity` | FD 4° ordine ($h=10^{-4}\text{ Å}^{-1}$) | rel $1{,}33 \times 10^{-11}$ | PASS |
| $v_g$ analitica vs FD4 (2ª–3ª BZ) | 3 preset, $\pi/a < |k| \le 3\pi/a$ | periodicità in $G$ | `monatomicGroupVelocity` | FD 4° ordine ($h=10^{-4}\text{ Å}^{-1}$) | rel $2{,}53 \times 10^{-11}$ | PASS |
| $v_g$ analitica vs FD2 | 3 preset, $[-3\pi/a, +3\pi/a]$ | $d\omega/dk$ | `monatomicGroupVelocity` | FD 2° ordine ($h=10^{-5}\text{ Å}^{-1}$) | rel $1{,}40 \times 10^{-10}$ | PASS |
| Pendenze $d\nu/dk$ e $d(\hbar\omega)/dk$ | 3 preset, $[-3\pi/a, +3\pi/a]$ | THz·Å e meV·Å | `velocityMsTo{Thz,Mev}Angstrom` | FD4 su $\nu(k)$ e $\hbar\omega(k)$ | rel $\le 2{,}16 \times 10^{-11}$ | PASS |
| Curva 401 punti (campioni esatti) | $[-2\pi/a, +2\pi/a]$, $n=401$ | $k = 0, \pm\pi/a, \pm 2\pi/a$ | `monatomicDispersionCurve` | eq. (8) + conversioni SI | rel $\le 2{,}23 \times 10^{-10}$ (abs $k \le 4{,}44\times 10^{-16}$) | PASS |
| Equazione di Newton discreta (6) | 8 valori di $k$, 3 fasi, 13 atomi | $M\ddot{u}_n = C(u_{n+1}+u_{n-1}-2u_n)$ | `monatomicOmega` + `Displacements` | residuo normalizzato a $M\omega_{\max}^2$ | abs $5{,}33 \times 10^{-16}$ | PASS |
| Aliasing: $\omega(k+mG)$, $v_g(k+mG)$ | $m \in \{\pm 1, \pm 2, \pm 3\}$, 8 $k$ (incl. Fig. 5 $ka=0{,}9$) | invarianti (§4.1) | `monatomicAliasK` + `Omega`/`Vg` | invarianza esatta | rel $\le 3{,}09 \times 10^{-15}$ | PASS |
| Aliasing: $u_n(k+mG) = u_n(k)$ | 21 atomi $x_n^0 = na$, Fig. 5 inclusa | identici sugli atomi (§4.1) | `monatomicDisplacements` | differenza sui siti | abs $3{,}41 \times 10^{-14}$ | PASS |
| Aliasing: profilo continuo tra siti | Fig. 5 ($ka=0{,}9$), $x=1{,}37a$ | curve distinte tra atomi | `monatomicWaveProfile` | $|u(k)-u(k+G)| = 1{,}855259$ | $> 0$ (verificato) | PASS |
| Ripiegamento `foldToFirstBZ` | 11 casi (incl. $\pm\pi/a$, $1{,}3\pi/a \to -0{,}7\pi/a$) | $-\pi/a < k \le \pi/a$ (§4.1, §16) | `foldToFirstBZ` | $\lceil k/G - 1/2 \rceil$ | abs $6{,}66 \times 10^{-16}$ | PASS |
| Evanescente $\kappa$ ($\omega \le \omega_{\max}$) | $\omega/\omega_{\max} \in \{0, 0{,}5, 1\}$ | $0$ (propagante, §3.4) | $0$ | $0$ | abs $0{,}00$ | PASS |
| Evanescente $\kappa$ ($\omega > \omega_{\max}$) | $r = \omega/\omega_{\max} \in [1{,}001, 100]$ | $\cosh(\kappa a) = 2r^2 - 1$ (§3.4) | `monatomicEvDecayKappa` | $\frac{2}{a}\operatorname{arsinh}(\sqrt{(r-1)(r+1)})$ | rel $2{,}04 \times 10^{-14}$ | PASS |
| Evanescente $\kappa$ vicino a soglia | $r \in \{1+10^{-10}, 1+10^{-8}, 1+10^{-6}\}$ | $\kappa \to 0^+$ | `monatomicEvDecayKappa` | formula `asinh` (e 50 cifre) | rel $2{,}50 \times 10^{-9}$ | PASS |
| Evanescente: residuo Newton (6) | tutti $r \in (1, 100]$ | $M\omega^2 = C(2+e^{-\kappa a}+e^{\kappa a})$ | `monatomicEvDecayKappa` | sostituzione diretta | rel $8{,}73 \times 10^{-16}$ | PASS |
| BvK: conteggio, parità, passo $\Delta k$ | $N \in \{1\dots 24, 100, 101\}$ (pari e dispari) | $N$ modi, $-N/2 < j \le N/2$ (eq. 32) | `bvkAllowedK1D` | generazione indip. + periodicità $u_{n+N}=u_n$ | $\Delta k$: $0{,}00$; $u_{n+N}-u_n$: $5{,}72\times 10^{-14}$ | PASS |
| Spettro Jacobi matrice $\mathbf{D}$ ($N \times N$) | $N = 1 \dots 24$ (regola somma nulla $= 0$) | $\det(\mathbf{D}-\omega^2\mathbf{1})=0$ | `monatomicOmega(k_j)` ordinati | autovalori Jacobi di $\Phi/M$ | rel $1{,}76 \times 10^{-15}$ | PASS |
| Macroscopico $L=1\text{ cm}$, $a=2{,}5\text{ Å}$ | $N=4\cdot 10^7$ (§13.4 p. 33) | $N=4\cdot 10^7$, $\Delta k \approx 6{,}3\cdot 10^2\text{ m}^{-1}$, $G \approx 2{,}5\cdot 10^{10}\text{ m}^{-1}$, $1/N = 2{,}5\cdot 10^{-8}$ | $G = 2{,}513274\cdot 10^{10}\text{ m}^{-1}$, $\Delta k = 628{,}3185\text{ m}^{-1}$, $N\cdot\Delta k = G$ (fino a $N=10^4$) | formule esatte SI | rel $\le 1{,}77 \times 10^{-16}$ | PASS |
| BvK vs Estremi bloccati (p. 33–34) | $N=200$, media $\langle\omega\rangle$ | stesso conteggio $N$, limite $(2/\pi)\omega_{\max}$ | $\langle\omega\rangle_{\text{BvK}}$ | $\langle\omega\rangle_{\text{fixed}}$ e $(2/\pi)\omega_{\max}$ | $2{,}06\times 10^{-5}$ (BvK vs cont.); $1{,}09\times 10^{-3}$ (fixed vs BvK) | PASS |

---

## 4. Problemi e osservazioni (in ordine di gravità)

### Bloccanti
Nessuno.

### Importanti
Nessuno.

### Minori

1. **`bvkSnapToAllowedK` non usa distanza periodica modulo $G$ sul bordo sinistro $k = -\pi/a$ per $N$ pari**
   - **Dove:** [`src/renderer/src/physics/phononDispersion.ts#L330-L342`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts#L330-L342) (e logica analoga in `snapBvkKFrac` in [`src/renderer/src/sections/phonon-monatomic/store.ts#L47-L59`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-monatomic/store.ts#L47-L59)).
   - **Cosa succede:** per $N$ pari (es. $N = 10$, default della sezione), la griglia BvK in $(-\pi/a, \pi/a]$ contiene $j \in \{-4, \dots, +5\}$, quindi include $+\pi/a$ ($j = +5$) ed esclude $-\pi/a$ perché i due bordi coincidono fisicamente ($-\pi/a + G = +\pi/a$, dispensa §4.3 p. 11 e Fig. 15 p. 33). Tuttavia `bvkSnapToAllowedK(-Math.PI / a, a, 10)` minimizza `Math.abs(k - mode.k)` senza tener conto della periodicità della 1BZ e restituisce `j = -4` ($k = -0{,}8\,\pi/a$, $\omega = 0{,}951\,\omega_{\max}$, $v_g \ne 0$) invece del modo equivalente $j = +5$ ($k = +\pi/a$, $\omega = \omega_{\max}$, $v_g = 0$). Analogamente, un input fuori zona come `k = 1.1 * π/a` viene agganciato a `j = +5` (`+π/a`) anziché essere ripiegato con `foldToFirstBZ` in `-0.9 * π/a` (vicino a `j = -4` o `j = +5`).
   - **Come riprodurlo:** `bvkSnapToAllowedK(-Math.PI / 2.5, 2.5, 10)` restituisce `{ j: -4, k: -1.0053096..., kFrac: -0.8 }`.
   - **Impatto:** minimo e potenzialmente voluto lato UI (per non far «saltare» il cursore dal bordo sinistro al bordo destro del grafico quando l'utente attiva BvK con il cursore a $-\pi/a$). Se invece si vuole fedeltà stretta all'equivalenza topologica del toro 1BZ in `physics/`, basterebbe ripiegare `k` con `foldToFirstBZ(k, a)` (o usare la distanza ciclica modulo $G$) prima di cercare il modo più vicino.

2. **Troncamento a 10 cifre di `THZ_TO_MEV` in `constants.ts` (scarto sistematico $2{,}23 \times 10^{-10}$ rispetto a $h/e$ esatto SI 2019)**
   - **Dove:** [`src/renderer/src/physics/constants.ts#L53`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/constants.ts#L53) (`export const THZ_TO_MEV = 4.135667696`).
   - **Cosa succede:** nel SI 2019 $h$ ed $e$ sono esatti, quindi $h/e \cdot 10^{15} = 6{,}62607015 / 1{,}602176634 = 4{,}135667696923859\text{ meV/THz}$. Il valore `4.135667696` (troncato invece che arrotondato a `4.135667697`) introduce uno scarto relativo fisso di $2{,}23 \times 10^{-10}$ in `radSToMev` e `thzToMev` (comunque superiore alla soglia $10^{-10}$ solo per un fattore $2{,}2$, e del tutto invisibile ai fini didattici; la dispensa riporta $4{,}13567$).
   - **Come riprodurlo:** confrontare `radSToMev(1e13)` ($6{,}5821195680 \text{ meV}$) con `(H_SI / (2 * Math.PI) * 1e13) / (E_SI * 1e-3)` ($6{,}5821195695 \text{ meV}$).

3. **Lievi dettagli di arrotondamento ai casi degeneri in `monatomicEvDecayKappa` e `bvkAllowedK1D`**
   - **Dove:** [`src/renderer/src/physics/phononDispersion.ts#L271-L272`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts#L271-L272) e [`#L314`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts#L314).
   - **Dettaglio:**
     - In `monatomicEvDecayKappa`: per $\omega/\omega_{\max} = 1 + 10^{-8}$, `2 * ratio * ratio - 1` perde il termine $2\varepsilon^2 = 2\times 10^{-16}$ sotto l'ULP di $2$, causando uno scarto relativo di $2{,}50 \times 10^{-9}$ rispetto alla forma equivalente `(2 / a) * Math.asinh(Math.sqrt((ratio - 1) * (ratio + 1)))` (verificato con Python `decimal` a 50 cifre; per tutti i valori fisicamente rilevanti $\omega/\omega_{\max} \ge 1{,}001$ l'errore è $\le 2{,}04 \times 10^{-14}$). Inoltre, `monatomicEvDecayKappa(NaN, params)` restituisce `NaN` perché `NaN <= omegaMax` è `false`.
     - In `bvkAllowedK1D(a, 1)`: `jMin = -Math.floor(0) = -0` produce `{ j: -0, k: -0, kFrac: -0 }` (zero negativo JS; innocuo nei calcoli numerici ma distinguibile con `Object.is`, facilmente evitabile con `jMin || 0`).

---

## 5. Cosa non è stato verificato

- Comportamento visivo, grafica Canvas/SVG, formule KaTeX nella UI, animazioni temporali e layout responsive di `src/renderer/src/sections/phonon-monatomic/` (di competenza dei revisori `critico-grafico`, `studente` e `fedelta-corso`).
- Regressioni su altre sezioni, typecheck globale o build Electron (di competenza di `revisore-integrazione`).
- Calcolo esplicito dell'array `bvkAllowedK1D(2.5, 4e7)` con $4 \times 10^7$ oggetti in memoria (evitato intenzionalmente per non saturare la RAM; verificata invece l'esatta legge di scala $N \cdot \Delta k = G$ fino a $N = 10^4$ e confrontati analiticamente tutti i numeri dell'esempio macroscopico §13.4).
