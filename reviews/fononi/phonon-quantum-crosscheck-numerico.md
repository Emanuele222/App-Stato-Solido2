# Crosscheck Numerico Indipendente — Sezione 5: Modi quantizzati (fononi), statistica di Bose–Einstein e processi Umklapp

**Modulo verificato:** [`src/renderer/src/physics/phononQuantum.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononQuantum.ts) (e costanti condivise in [`src/renderer/src/physics/constants.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/constants.ts); preset e intervalli slider da [`src/renderer/src/sections/phonon-quantum/manifest.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-quantum/manifest.ts))  
**Fonti di riferimento:** [`materiale/parte6/dispensa.pdf`](file:///c:/Users/filip/Documents/App-Stato-Solido/materiale/parte6/dispensa.pdf) (Lezione 1 §3 eqq. 8–9 p. 9; Lezione 2 §11 eqq. 29–30 pp. 27–28; Lezione 3 §16 eqq. 40–42 pp. 39–41, Fig. 19; Lezione 3 §18 eqq. 46–51 pp. 43–47, Figg. 20–21) e [`materiale/parte6/riferimento-formule.md`](file:///c:/Users/filip/Documents/App-Stato-Solido/materiale/parte6/riferimento-formule.md)  
**Script indipendente:** [`crosscheck/fononi/phonon_quantum_crosscheck.py`](file:///c:/Users/filip/Documents/App-Stato-Solido/crosscheck/fononi/phonon_quantum_crosscheck.py)  
**Output JSON grezzo:** [`crosscheck/fononi/phonon_quantum_crosscheck_results.json`](file:///c:/Users/filip/Documents/App-Stato-Solido/crosscheck/fononi/phonon_quantum_crosscheck_results.json)

---

## Verdetto: **approvata**

Su **16 verifiche numeriche indipendenti** eseguite direttamente contro le funzioni reali esportate da [`phononQuantum.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononQuantum.ts), **16/16 sono PASS**:
- **Oscillatore armonico quantistico ($n = 0 \dots 25$):** le autofunzioni $\psi_n(u)$ calcolate dalla ricorrenza normalizzata dell'app coincidono con lo sviluppo esplicito di Rodrigues in `Decimal` a 50 cifre entro **$6{,}66 \times 10^{-16}$**, soddisfano l'equazione di Schrödinger stazionaria (FD4) entro **$2{,}61 \times 10^{-8}$**, e per quadratura composita di Gauss–Legendre a 1024 nodi soddisfano l'ortonormalità $\int \psi_m(u)\psi_n(u)\,\mathrm{d}u = \delta_{mn}$ su tutte le **351 coppie** ($0 \le m \le n \le 25$) entro **$6{,}66 \times 10^{-16}$** e $\langle x^2 \rangle = (n + 1/2)a_{\text{ho}}^2$ entro **$8{,}36 \times 10^{-16}$**.
- **Indeterminazione e scale dispensa:** per $n = 0$ la quadratura con FD4 su $\Psi_0(x)$ dà $\Delta x\,\Delta p / (\hbar/2) = 0{,}99999999973$ (scarto rel. **$2{,}69 \times 10^{-10}$**); per il metallo tipico della dispensa §18.4 ($M = 1{,}05\times 10^{-25}\text{ kg}$, $a = 2{,}5\text{ Å}$, $\omega_{\max} \approx 2{,}76\times 10^{13}\text{ rad/s}$) si ottiene $a_{\text{ho}} = 0{,}06032\text{ Å}$, $\Delta x_{\text{zp}} = 0{,}04265\text{ Å}$, $\Delta x_{\text{zp}}/a = 1{,}706\%$ (e $1{,}694\%$ a $\omega = 2{,}8\times 10^{13}\text{ rad/s}$, coerente con $\approx 0{,}060\text{ Å}$, $\approx 0{,}042\text{ Å}$, $\approx 1{,}7\%$ della dispensa).
- **Tunneling e principio di corrispondenza di Bohr:** per $n = 0$, $\operatorname{erfc}(1) = 0{,}15729920705028522$ (scarto rel. $5{,}29 \times 10^{-16}$); su tutti gli $n = 0 \dots 25$ la quadratura indipendente sulle **sole code** $2\int_{u_{\text{cl}}}^{u_{\text{cl}}+10} |\psi_n(u)|^2\,\mathrm{d}u$ coincide con `quantumTunnelingFraction(n)` entro **$1{,}59 \times 10^{-14}$** e decresce strettamente fino a $0{,}04507$ a $n = 25$. La convergenza di $\langle P_n(u) \rangle \to P_{\text{cl}}(u)$ è confermata sia dalla distanza di Kolmogorov–Smirnov sulle CDF ($0{,}0971 \to 0{,}0544 \to 0{,}0388 \to 0{,}0261 \to 0{,}0242$ per $n = 0, 2, 6, 20, 25$, limitata dal pavimento fisico di tunneling $T(25)/2 \approx 0{,}0225$) sia dalla media spaziale locale nel bulk ($|u| \le 0{,}75\,u_{\text{cl}}$), il cui scarto medio scende dal $25{,}7\%$ ($n=0$) al **$2{,}29\%$ ($n=20$)** e **$1{,}36\%$ ($n=25$)**.
- **Bose–Einstein ($\mu = 0$) e identità di Mehler:** $\sum p_n = 1$ entro **$9{,}99 \times 10^{-16}$** e $\sum n p_n = \bar{n}(T)$ entro **$3{,}72 \times 10^{-15}$**; la somma diretta $\sum_{n=0}^{400} p_n(T)|\psi_n(u)|^2$ riproduce `thermalProbabilityDensityDimless` entro **$1{,}67 \times 10^{-16}$**, con integrali $\int P_{\text{th}}\,\mathrm{d}u = 1$ e $\int u^2 P_{\text{th}}\,\mathrm{d}u = \bar{n} + 1/2$ esatti alla precisione float64.
- **Processi Normali vs Umklapp in 1BZ:** l'esempio della dispensa §16 ($0{,}7 + 0{,}6\,\pi/a \to -0{,}7\,\pi/a$) dà esattamente $m_G = -1$, `kind = 'umklapp'`, $v_g(k_1) = 1566{,}42\text{ m/s}$, $v_g(k_2) = 2028{,}05\text{ m/s}$, $v_g(k_3) = -1566{,}42\text{ m/s}$ (`flowReversed = true`); su tutti i 20 casi limite e sulla griglia $11 \times 11$ (121 collisioni) lo scarto rispetto a FD4 in `Decimal` è $\le \mathbf{1{,}22 \times 10^{-14}}$.

Non risultano problemi **Bloccanti** né **Importanti**; si segnalano **3 osservazioni Minori** (cancellazione in `1 - erf(x)` attorno a $x \in [2{,}5, 3{,}5]$, asimmetria convenzionale sul bordo di zona $-\pi/a$ vs $+\pi/a$ per $(-0{,}5, -0{,}5)$, e troncamento visivo dell'istogramma a `maxThermalBars = 18` per alte $T$ / basse $\nu$).

---

## 1. Metodologia indipendente

1. **Costanti SI 2019 esatte + CODATA 2018 in `Decimal` a 50 cifre** (prima di ispezionare `src/`):
   - $h = 6{,}62607015\times 10^{-34}\text{ J}\cdot\text{s}$, $e = 1{,}602176634\times 10^{-19}\text{ C}$, $k_B = 1{,}380649\times 10^{-23}\text{ J}\cdot\text{K}^{-1}$ (esatte SI 2019), $1\text{ u} = 1{,}6605390666\times 10^{-27}\text{ kg}$ (CODATA 2018), $\pi$ calcolato a 50 cifre con formula di Machin, $\hbar = h/(2\pi)$.
2. **Oscillatore armonico quantistico indipendente (eqq. 47–51, §18):**
   - Polinomi di Hermite valutati dallo sviluppo esplicito di **Rodrigues** (eq. 49) in `Decimal` a 50 cifre:
     $$H_n(u) = n! \sum_{m=0}^{\lfloor n/2 \rfloor} \frac{(-1)^m}{m!\,(n-2m)!}(2u)^{n-2m}, \qquad \psi_n(u) = \frac{1}{\sqrt{2^n n! \sqrt{\pi}}} H_n(u)\,e^{-u^2/2},$$
     senza ricorrere alla ricorrenza normalizzata a tre termini di `phononQuantum.ts`.
   - Verifica dell'ODE di Schrödinger $\psi_n''(u) + (2n + 1 - u^2)\psi_n(u) = 0$ tramite differenze finite centrate al 4° ordine (FD4, passo $h = 10^{-4}$).
   - **Quadratura composita di Gauss–Legendre a 16 nodi** su 64 pannelli (**1024 nodi** su $[-16, +16]$, nodi/pesi calcolati indipendentemente via Newton sulle radici di $P_{16}$, diverso dal GL24 dell'app) applicata alle valutazioni reali dell'app per tutte le **351 coppie** $(m, n)$ con $0 \le m \le n \le 25$, per i momenti $\langle u \rangle, \langle u^2 \rangle$ e per $\Delta x\,\Delta p = \hbar/2$ a $n=0$ (con $\langle p^2 \rangle = -\hbar^2 \int \Psi_0 \Psi_0''\,\mathrm{d}x$ via FD4).
   - **`erfc(x)` indipendente** in `Decimal` (serie di Taylor per $x \le 4{,}5$, frazione continua di Laplace a 60 termini per $x > 4{,}5$) confrontata anche con `math.erfc` di Python.
   - **Probabilità di tunneling** integrata sulle **sole code esterne** $2\int_{u_{\text{cl}}}^{u_{\text{cl}}+10} |\psi_n(u)|^2\,\mathrm{d}u$ (metodo opposto a $1 - 2\int_0^{u_{\text{cl}}}$ dell'app).
   - **Corrispondenza di Bohr ($n = 0, 2, 6, 20, 25$):** distanza di Kolmogorov–Smirnov $D_{\text{KS}}(n) = \sup_u |F_n(u) - F_{\text{cl}}(u)|$ con $F_{\text{cl}}(u) = \tfrac{1}{2} + \tfrac{1}{\pi}\arcsin(u/u_{\text{cl}})$ e media spaziale locale gaussiana di $P_n(u)$ nel bulk $|u| \le 0{,}75\,u_{\text{cl}}$.
3. **Statistica di Bose–Einstein e identità di Mehler (eq. 30, §11):**
   - Confronto diretto della somma finita ad alta convergenza $\sum_{n=0}^{400} p_n(T)|\psi_n(u)|^2$ (con $z^{401} < 10^{-36}$ per $\nu = 4{,}4\text{ THz}, T \le 1000\text{ K}$) contro la gaussiana analitica di `thermalProbabilityDensityDimless` e verifica dei momenti per quadratura GL16 su $[-20, +20]$.
4. **Processi N/U in 1BZ (eqq. 8–9, 40, §16):**
   - Riduzione esatta nella 1BZ $(-\pi/a, +\pi/a]$ in `Decimal` e velocità di gruppo $v_g(k_i) = d\omega/dk$ calcolata per **FD4** in `Decimal` ($h = 10^{-7}\text{ Å}^{-1}$) contro `analyze1BZCollision` su 20 casi mirati e una griglia $11 \times 11$ (121 collisioni).

---

## 2. Comandi eseguiti e risultati effettivi

| Comando | Esito | Risultato |
|---|---|---|
| `python crosscheck/fononi/phonon_quantum_crosscheck.py` | Exit code `0` | **16/16 PASS**; risultati salvati in [`crosscheck/fononi/phonon_quantum_crosscheck_results.json`](file:///c:/Users/filip/Documents/App-Stato-Solido/crosscheck/fononi/phonon_quantum_crosscheck_results.json) |
| `.\.tools\node\node.exe .\node_modules\vitest\vitest.mjs run src/renderer/src/physics/phononQuantum.test.ts` | Exit code `0` | `Test Files 1 passed (1)`, `Tests 9 passed (9)` in 202 ms |

---

## 3. Tabella riassuntiva dei confronti numerici

### 3.1 Oscillatore armonico, ortonormalità, indeterminazione, tunneling e Bohr

| Grandezza / Verifica | Input / Ambito | Valore dispensa / formula | Valore `physics/` | Valore crosscheck | Errore max (ass. / rel.) | Esito |
|---|---|---|---|---|---|---|
| Costanti fisiche + `TYPICAL_METAL_MASS_AMU` | SI 2019 / CODATA 2018 | $\hbar$, $k_B$, $1\text{ u}$, $1\text{ THz}\leftrightarrow 4{,}13567\text{ meV}$, $M=1{,}05\cdot 10^{-25}\text{ kg}$ | `HBAR_J_S=1.054571817e-34`, `63.232478 u` | `Decimal` 50 cifre | Rel. **$6{,}13 \times 10^{-10}$** (troncamento 10 cifre CODATA di `HBAR_J_S`) | **PASS** |
| Scale oscillatore dispensa §18.4 e slider $\nu \in [1, 12]\text{ THz}, n \in [0, 25]$ | $\omega_{\max} = 2{,}760\cdot 10^{13}$ e $\omega = 2{,}8\cdot 10^{13}\text{ rad/s}$, 9 casi | $a_{\text{ho}} \approx 0{,}060\text{ Å}$, $\Delta x_{\text{zp}} \approx 0{,}042\text{ Å}$, $\Delta x_{\text{zp}}/a \approx 1{,}7\%$ | $0{,}06032\text{ Å}$ ($0{,}05989$ a $2{,}8\cdot 10^{13}$), $1{,}706\%$ ($1{,}694\%$) | `Decimal` 50 cifre | Rel. **$6{,}30 \times 10^{-10}$** (propagazione da `HBAR_J_S`, `KB_EV_K`) | **PASS** |
| Autofunzioni $\psi_n(u)$ ($n = 0 \dots 25$) | 26 livelli × 64 nodi su $[-16, +16]$ | eq. (49), polinomi di Hermite | `harmonicEigenfunctionDimless` (ricorrenza) | Rodrigues esplicito `Decimal` 50 cifre | Ass. **$6{,}66 \times 10^{-16}$** | **PASS** |
| Equazione di Schrödinger $\psi_n'' + (2n+1-u^2)\psi_n = 0$ | 26 livelli × 7 centri $u \in [-3{,}2, 4{,}5]$ | eq. (47)–(48) | `harmonicEigenfunctionDimless` | FD4 ($h = 10^{-4}$) | Rel. **$2{,}61 \times 10^{-8}$** | **PASS** |
| Ortonormalità $\int \psi_m(u)\psi_n(u)\,\mathrm{d}u = \delta_{mn}$ | Tutte le **351 coppie** $0 \le m \le n \le 25$ | $\delta_{mn}$ | `harmonicEigenfunctionDimless` | Quadratura GL16 (1024 nodi su $[-16,16]$) | Diagonale **$6{,}66 \times 10^{-16}$**, off-diag. **$3{,}65 \times 10^{-16}$** | **PASS** |
| Momenti $\langle x \rangle = 0$ e $\langle x^2 \rangle = (n+1/2)a_{\text{ho}}^2$ | $n = 0 \dots 25$ (e $\Psi_0, \Psi_{20}$ fisiche) | $\langle u \rangle = 0$, $\langle u^2 \rangle = n + 1/2$ | `harmonicEigenfunctionDimless` & `harmonicEigenfunction` | Quadratura GL16 (1024 nodi) | $\langle u \rangle$: **$1{,}23 \times 10^{-31}$**; $\langle u^2 \rangle$: **$8{,}36 \times 10^{-16}$** | **PASS** |
| Principio di indeterminazione $\Delta x\,\Delta p = \hbar/2$ ($n = 0$) | $\Psi_0(x)$ a $\nu = 4{,}4\text{ THz}$ | eq. (51): $\Delta x\,\Delta p = \hbar/2$ | $\Delta x = 4{,}2620\cdot 10^{-12}\text{ m}$, $\Delta p = 1{,}2372\cdot 10^{-23}\text{ kg m/s}$ | Quadratura GL16 + FD4 su $\Psi_0''(x)$ | Rel. **$2{,}69 \times 10^{-10}$** (rapporto $0{,}99999999973$) | **PASS** |
| Funzione `erfc(x)` | 21 punti su $x \in [-10, 30]$ | $\operatorname{erfc}(1) \approx 0{,}1573$ | `erfc(1) = 0.15729920705028522` | `Decimal` 50 cifre + `math.erfc` | Ass. **$2{,}72 \times 10^{-16}$**; rel. $5{,}29 \times 10^{-16}$ a $x=1$ *(v. Minore 1 a $x=3{,}5$)* | **PASS** |
| Tunneling $\|x\| > x_{\text{cl}}$ ($n = 0 \dots 25$) | Tutti i 26 livelli | $n=0$: $\operatorname{erfc}(1) \approx 0{,}1573$; decresce con $n$ | `quantumTunnelingFraction` ($1 - 2\int_0^{u_{\text{cl}}}$): $0{,}15730 \to 0{,}04507$ | Quadratura code $2\int_{u_{\text{cl}}}^{u_{\text{cl}}+10}$ (512 nodi) | Rel. **$1{,}59 \times 10^{-14}$** (decadimento strettamente monotono) | **PASS** |
| Densità classica $P_{\text{cl}}(u)$, $P_{\text{cl}}(x)$ | Dentro e fuori $\|u\| < u_{\text{cl}}$ ($n=6$) | eq. (46): $1/(\pi\sqrt{a^2 - x^2})$, $0$ fuori | `classicalProbabilityDensityDimless` / `Density` | Formula analitica esatta | Rel. **$0{,}00$** | **PASS** |
| Corrispondenza di Bohr $\langle P_n \rangle \to P_{\text{cl}}$ | $n = 0, 2, 6, 20, 25$ (2401 punti) | $\langle P_n \rangle \to P_{\text{cl}}$ per $n \gg 1$ (§18.3) | `oscillatorCurvesDimless` | $D_{\text{KS}}$ (CDF) + media locale $\|u\|\le 0{,}75 u_{\text{cl}}$ | $D_{\text{KS}}$: $0{,}0971 \to 0{,}0261$ ($n=20$) $\to \mathbf{0{,}0242}$ ($n=25$); bulk: **$2{,}29\%$ ($n=20$)**, **$1{,}36\%$ ($n=25$)** | **PASS** |

### 3.2 Bose–Einstein ($\mu = 0$), identità di Mehler e processi Normali / Umklapp in 1BZ

| Grandezza / Verifica | Input / Ambito | Valore dispensa / formula | Valore `physics/` | Valore crosscheck | Errore max | Esito |
|---|---|---|---|---|---|---|
| Bose–Einstein $\bar{n}(T)$ e $p_n(T)$ ($\mu = 0$) | $T \in \{0; 0{,}5; 10; 30; 300; 1000\}\text{ K}$, $\nu \in \{1{,}0; 4{,}4; 12{,}0\}\text{ THz}$ | eq. (30): $\bar{n} = (e^{\hbar\omega/k_B T}-1)^{-1}$ | $\bar{n}(300\text{ K}, 4{,}4\text{ THz}) = 0{,}978857$; $\sum p_n = 1$, $\sum n p_n = \bar{n}$ | `Decimal` 50 cifre + somme analitiche | $\sum p_n$: **$9{,}99 \times 10^{-16}$**; $\sum n p_n$: **$3{,}72 \times 10^{-15}$**; vs SI 2019: $3{,}53 \times 10^{-8}$ (a $x=57{,}6$ per `HBAR_J_S`) | **PASS** |
| Identità di Mehler $\sum p_n(T)|\psi_n(u)|^2$ | $T \in \{0, 10, 30, 300, 1000\}\text{ K}$, $\nu = 4{,}4\text{ THz}$, $u \in [-8, +8]$ | Gaussiana di varianza $\sigma_u^2 = \bar{n} + 1/2$ | `thermalProbabilityDensityDimless` | Somma diretta $n = 0 \dots 400$ + momenti GL16 su $[-20, 20]$ | Somma diretta: **$1{,}67 \times 10^{-16}$**; momenti $\int P_{\text{th}}du=1, \int u^2 P_{\text{th}}du=\bar{n}+1/2$: **$0{,}00$** (vs SI 2019: $9{,}27\times 10^{-11}$) | **PASS** |
| Umklapp dispensa §16 (p. 40) | $k_1 = 0{,}7\,\pi/a$, $k_2 = 0{,}6\,\pi/a$ ($a=2{,}5\text{ Å}$) | $k_3 = -0{,}7\,\pi/a$, $m_G = -1$, $v_g(k_3) < 0$ (inversione) | $k_3 = -0{,}7\,\pi/a$, $v_g = (1566{,}4; 2028{,}1; -1566{,}4)\text{ m/s}$, `flowReversed=true` | Riduzione 1BZ + FD4 `Decimal` | Cinematica / $v_g$: **$1{,}22 \times 10^{-14}$** (energia meV vs SI 2019: $2{,}23 \times 10^{-10}$) | **PASS** |
| Casi limite & negativi N/U (20 sonde) | $(0{,}3; 0{,}4)$, $(-0{,}7; -0{,}6)$, $(\pm 0{,}5; \pm 0{,}5)$, $(-0{,}95; -0{,}95)$, $(1{,}0; 1{,}0)$, $(\pm 1{,}3; \pm 0{,}2)$, soglie $\pm 0{,}5001$ | $k_3 \in (-\pi/a, \pi/a]$, eqq. (8)–(9) e (40) | `analyze1BZCollision` | Riduzione 1BZ + FD4 `Decimal` | Cinematica / $v_g$: **$1{,}22 \times 10^{-14}$** *(v. Minore 2 su $(-0{,}5; -0{,}5)$)* | **PASS** |
| Scansione griglia $11 \times 11$ in 1BZ | 121 coppie $(k_1, k_2) \in [-0{,}95; 1{,}0]^2$ | 94 Normali, 27 Umklapp (13 `flowReversed`) | `analyze1BZCollision` | Riduzione 1BZ + FD4 `Decimal` | **$4{,}11 \times 10^{-15}$**, zero `NaN`/`Infinity` | **PASS** |

---

## 4. Problemi trovati (in ordine di gravità)

Nessun problema **Bloccante** né **Importante**. Si segnalano **3 osservazioni Minori**:

1. **[Minore] Cancellazione numerica in `erfc(x)` tramite `1 - erf(x)` nella banda $x \in [2{,}5, 3{,}5]$**  
   - **Dove:** [`src/renderer/src/physics/phononQuantum.ts#L199-L220`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononQuantum.ts#L199-L220).  
   - **Cosa succede:** Per $x \le 3{,}5$ la funzione calcola $\operatorname{erf}(x)$ con GL24 e restituisce `1 - erf`. Vicino a $x = 3{,}5$, $\operatorname{erf}(3{,}5) = 1 - 7{,}43\times 10^{-7}$, per cui la sottrazione da `1` in float64 perde ~7 cifre significative: l'errore assoluto resta $\le 2{,}72 \times 10^{-16}$, ma l'errore **relativo** sale a **$1{,}76 \times 10^{-10}$** a $x = 3{,}49$ e **$3{,}66 \times 10^{-10}$** a $x = 3{,}50$ (mentre il commento a riga 199 dichiara «precisione $< 10^{-15}$ su tutto $\mathbb{R}$»). Appena sopra il cambio ramo ($x = 3{,}51$, frazione continua di Laplace) l'errore relativo torna a $1{,}99 \times 10^{-15}$.  
   - **Impatto / riproduzione:** Non impatta la fisica dell'app (`erfc` è usata direttamente a $x = 1$ dove l'errore relativo è $5{,}29 \times 10^{-16}$). Riproducibile chiamando `erfc(3.5)` e confrontando con `math.erfc(3.5)`.  
   - **Suggerimento:** Abbassare la soglia di passaggio alla frazione continua di Laplace da `3.5` a `1.5`–`2.0` (con ~35–40 iterazioni per mantenere convergenza $< 10^{-16}$).

2. **[Minore] Asimmetria convenzionale di bordo zona su $k_1 + k_2 = -\pi/a$ vs $+\pi/a$**  
   - **Dove:** [`src/renderer/src/physics/phononQuantum.ts#L564-L569`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononQuantum.ts#L564-L569) (`else if (fSum <= -1 + 1e-12) { mG = 1 }`).  
   - **Cosa succede:** Nella convenzione della 1BZ semiaperta $(-\pi/a, +\pi/a]$, $(+0{,}5, +0{,}5)$ ha $k_1 + k_2 = +\pi/a \in (-\pi/a, \pi/a]$ ed è classificato `normal` ($m_G = 0$, $k_3 = +\pi/a$), mentre $(-0{,}5, -0{,}5)$ ha $k_1 + k_2 = -\pi/a \notin (-\pi/a, \pi/a]$ e viene riportato in $+1$ con $G = +2\pi/a$ ($m_G = +1$), risultando classificato `umklapp` pur essendo fisicamente lo stesso modo di bordo zona a onda stazionaria ($v_g = 0$, `flowReversed = false`).  
   - **Impatto:** Coerente dal punto di vista strettamente algebrico con la convenzione $(-\pi/a, +\pi/a]$ e l'avviso della dispensa §16.2 (p. 41: «La distinzione N/U dipende dalla scelta della zona»); segnalato solo perché gli studenti che provano $(-0{,}5, -0{,}5)$ rispetto al preset $(0{,}5, 0{,}5)$ potrebbero notare il cambio di etichetta N/U al bordo esatto.

3. **[Minore — UI/Manifest] Troncamento dell'istogramma `maxThermalBars = 18` ad alta $T$ / bassa $\nu$**  
   - **Dove:** [`src/renderer/src/sections/phonon-quantum/manifest.ts#L152`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-quantum/manifest.ts#L152) e [`src/renderer/src/sections/phonon-quantum/model.ts#L98-L102`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-quantum/model.ts#L98-L102).  
   - **Nota:** La funzione `boseEinsteinLevelProbabilities` in `phononQuantum.ts` è numericamente esatta per qualsiasi `maxN`. Si segnala però per completezza che all'estremo superiore degli slider ($T = 1000\text{ K}$, $\nu = 1{,}0\text{ THz}$, dove $\bar{n} \approx 20{,}34$) le prime $19$ barre ($n = 0 \dots 18$) dell'istogramma mostrano il $59{,}82\%$ della probabilità totale ($\sum_{n=0}^{18} p_n = 0{,}5982$, $\sum_{n=0}^{18} n p_n = 4{,}534$ contro $\bar{n} = 20{,}34$), mentre al preset `thermal-300` ($\nu = 4{,}4\text{ THz}$) coprono il $99{,}99984\%$. Non è un errore di calcolo della fisica.
