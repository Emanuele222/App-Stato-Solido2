# Riferimento rapido — Parte 6: Vibrazioni reticolari e fononi

Estratto strutturato da `materiale/parte6/dispensa.pdf` (A.A. 2026/2027, 4 lezioni, 64 pagine).  
**Fonte unica per fisica, notazione, convenzioni e numeri di riferimento del capitolo Fononi.** In caso di dubbio fa fede il PDF originale.

---

## Notazione della dispensa (Parte 6)

| Grandezza | Simbolo | Note / Unità |
|---|---|---|
| Posizione di equilibrio / spostamento | $\mathbf{R}_n^0$ (o $x_n^0$), $\mathbf{u}_n$ (o $u_n$) | Å; per base: $\mathbf{r}_{n\alpha} = \mathbf{R}_n + \boldsymbol{\tau}_\alpha + \mathbf{u}_{n\alpha}$ |
| Passo del reticolo di Bravais | $a$ | Å (catena biatomica: primi vicini a distanza $a/2$, passo reticolare $a$) |
| Costante elastica a primi vicini | $C$ | N/m (la dispensa unifica $\gamma$ e $K$ delle slide in $C$) |
| Matrice delle costanti di forza | $\Phi_{\alpha\beta}(n,m)$ o $\Phi_{\alpha i,\beta j}(n,m)$ | $\left.\partial^2 V / \partial u_{n\alpha i}\partial u_{m\beta j}\right|_0$ |
| Masse atomiche | $M$ (monatomica), $M > m$ (biatomica), $M_\alpha$ (base) | kg o u.m.a. ($1\text{ u} = 1{,}660539\times 10^{-27}\text{ kg}$) |
| Vettore d'onda | $k$, $\mathbf{k}$ (o $\mathbf{q}$ nello scattering e–ph) | Å⁻¹ o unità di $\pi/a$; 1BZ: $-\pi/a < k \le \pi/a$ |
| Vettore del reticolo reciproco | $G = 2\pi m/a$, $\mathbf{G}$ | Å⁻¹ |
| Pulsazione / frequenza | $\omega(k)$, $\omega_s(\mathbf{k})$; $\nu = \omega/2\pi$ | $\text{rad s}^{-1}$, THz; energia $\hbar\omega$ in meV ($1\text{ THz} \leftrightarrow 4{,}13567\text{ meV}$) |
| Velocità del suono, di fase, di gruppo | $v_s$, $v_p = \omega/k$, $v_g = d\omega/dk$ (o $\nabla_{\mathbf{k}}\omega$) | m/s (o km/s) |
| Rapporto di ampiezza (biatomica) | $\alpha = u_{n-1}/u_n$ | reale nella scelta di fase $x_n^0 = na/2$ |
| Matrice dinamica | $\mathbf{D}(\mathbf{k})$ | $3p \times 3p$, hermitiana; $\det(\mathbf{D}(\mathbf{k}) - \omega^2\mathbf{1}) = 0$ |
| Numero di atomi per cella / celle | $p$, $N$ (1D) o $N_c$ (3D) | $3p$ rami ($3$ acustici + $3p-3$ ottici), $3pN_c$ modi totali |
| Occupazione media di Bose–Einstein | $\bar{n}_{\mathbf{k},s}(T)$ o $\langle n \rangle$ | $\mu = 0$: $[\exp(\hbar\omega / k_B T) - 1]^{-1}$ |
| Lunghezza caratteristica oscillatore | $a_{\text{ho}} = \sqrt{\hbar / m\omega}$ | Å |
| Densità degli stati fononica | $g(\omega)$ | in 3D la dispensa definisce $g(\omega)$ **per polarizzazione** (totale $3g$, integrale $3N$) |
| Temperature caratteristiche | $\Theta_E = \hbar\omega_E/k_B$, $\Theta_D = \hbar\omega_D/k_B$ | K |
| Funzione di Einstein (singolo modo) | $\mathcal{E}(x) = x^2 e^x / (e^x - 1)^2$ | adimensionale, $x = \hbar\omega/k_B T$ |
| Calore specifico molare | $C_V = (\partial U/\partial T)_V$ | $\text{J K}^{-1}\text{mol}^{-1}$, $R = N_A k_B \approx 8{,}31446\text{ J mol}^{-1}\text{K}^{-1}$, $3R \approx 24{,}943$ |

---

## Equazioni chiave per lezione

### Lezione 1 — Approssimazione armonica e catena monatomica (pp. 2–13)
- **Eq. (2)–(4)**: $V_{\text{arm}} = \frac{1}{2}\sum \Phi_{\alpha\beta}(n,m) u_{n,\alpha} u_{m,\beta}$; proprietà: simmetria, invarianza traslazionale, somma nulla $\sum_m \Phi_{\alpha\beta}(n,m) = 0$.
- **Eq. (6)**: $M\ddot{u}_n = C(u_{n+1} + u_{n-1} - 2u_n)$.
- **Eq. (8)**: $\omega(k) = 2\sqrt{\frac{C}{M}}\,\left|\sin\frac{ka}{2}\right|$.
- **Eq. (9)**: $v_s = a\sqrt{\frac{C}{M}}$; $\omega_{\max} = 2\sqrt{\frac{C}{M}}$ a $k = \pm\pi/a$; $v_g(k) = a\sqrt{\frac{C}{M}}\cos\left(\frac{ka}{2}\right)\operatorname{sgn}(k)$ con $v_g(\pm\pi/a) = 0$ (onda stazionaria $u_n(t) = A(-1)^n\cos\omega_{\max}t$).
- Sopra $\omega_{\max}$ (§3.4): nessun $k$ reale, onda evanescente ($k = \pi/a + i\kappa$), filtro passa-basso.
- **Aliasing (§4.1)**: $k$ e $k + G$ ($G = 2\pi m/a$) producono lo stesso spostamento sugli atomi $x_n^0 = na$ (limite di Nyquist $\lambda_{\min} = 2a$).

### Lezione 2 — Pacchetti d'onda, catena biatomica, dinamica 3D e fononi (pp. 14–30)
- **Eq. (10)–(12)**: pacchetto d'onda, $v_p = \omega/k$ (corda), $v_g = d\omega/dk$ (tangente); allargamento gaussiano $\sigma(t) = \sigma_0\sqrt{1 + (\omega'' t / 2\sigma_0^2)^2}$.
- **Eq. (13)–(20)** (catena biatomica, $M > m$, passo $a$, primi vicini $a/2$):
  $$\omega_{\mp}^2(k) = C\frac{m+M}{mM} \mp C\sqrt{\left(\frac{m+M}{mM}\right)^2 - \frac{4\sin^2(ka/2)}{mM}}$$
  ($-$ acustico, $+$ ottico). Rapporto $\alpha = \frac{2C - \omega^2 M}{2C\cos(ka/2)} = \frac{2C\cos(ka/2)}{2C - \omega^2 m}$.
- **Eq. (21)–(23)** (limiti e gap):
  - $k \to 0$ acustico: $v_s = a\sqrt{\frac{C}{2(m+M)}}$, $\alpha = 1$ (in fase).
  - $k = 0$ ottico: $\omega_+(0) = \sqrt{\frac{2C(m+M)}{mM}}$, $\alpha = -M/m$ (opposizione di fase, $R_{\text{cm}} = 0$).
  - $k = \pm\pi/a$: punto C (acustico) $\omega_{\max}^{\text{ac}} = \sqrt{2C/M}$, $\alpha = 0$ ($m$ ferma); punto B (ottico) $\omega_{\min}^{\text{ott}} = \sqrt{2C/m}$, $1/\alpha = 0$ ($M$ ferma).
  - Gap fononico: $\Delta\omega_{\text{gap}} = \sqrt{2C/m} - \sqrt{2C/M}$ (per $M = m$ si chiude: ripiegamento della zona).
- **§9–§10 (3D e matrice dinamica)**: $3p$ rami = $3$ acustici (1 LA + 2 TA) + $3p-3$ ottici ($p-1$ LO + $2(p-1)$ TO lungo direzioni di alta simmetria). Eq. (27)–(28): $D_{\alpha i,\beta j}(\mathbf{k}) = \frac{1}{\sqrt{M_\alpha M_\beta}}\sum_m \Phi_{\alpha i,\beta j}(0,m)e^{i\mathbf{k}\cdot\mathbf{R}_m}$, $\det(\mathbf{D}-\omega^2\mathbf{1})=0$.
- **Eq. (29)–(30)**: $E_s(\mathbf{k}) = (n_{\mathbf{k},s} + \tfrac{1}{2})\hbar\omega_s(\mathbf{k})$; $\bar{n}_{\mathbf{k},s}(T) = (e^{\hbar\omega_s(\mathbf{k})/k_B T} - 1)^{-1}$.

### Lezione 3 — Born–von Kármán, modi normali, Umklapp e oscillatore (pp. 31–48)
- **Eq. (31)–(36)**: $u_{n+N} = u_n \implies k = \frac{2\pi}{L}j$, $\Delta k = 2\pi/L$, $N$ punti in 1BZ; $\sum_k \to \frac{L}{2\pi}\int dk$ (1D), $\sum_{\mathbf{k}} \to \frac{V}{(2\pi)^3}\int d^3k$ (3D), $\mathcal{N}_k = V/v_c = N_c$.
- **Eq. (40)–(42)** (processi Normali e Umklapp): $\sum\mathbf{p} = \sum\mathbf{p}' + \hbar\mathbf{G}$ (N: $\mathbf{G}=\mathbf{0}$, U: $\mathbf{G}\ne\mathbf{0}$). Elettrone–fonone: $E(\mathbf{k}_f) = E(\mathbf{k}) \pm \hbar\omega(\mathbf{q})$, $\mathbf{k}_f = \mathbf{k} \pm \mathbf{q} + \mathbf{G}$ (**stesso segno**: $+$ assorbimento, $-$ emissione).
- **Eq. (46)–(51)** (oscillatore classico vs quantistico):
  - $P_{\text{cl}}(x) = \frac{1}{\pi\sqrt{a^2 - x^2}}$ ($|x| < a$), $a = a_{\text{ho}}\sqrt{2n+1}$, $a_{\text{ho}} = \sqrt{\hbar/m\omega}$.
  - $\Psi_n(x) = N_n H_n(x/a_{\text{ho}})e^{-x^2/2a_{\text{ho}}^2}$, $N_n = (2^n n!\sqrt{\pi}\,a_{\text{ho}})^{-1/2}$, $E_n = (n+\tfrac{1}{2})\hbar\omega$.
  - Tunneling in $n=0$: $\int_{|x|>a_{\text{ho}}} P_0(x)\,dx = \operatorname{erfc}(1) \approx 0{,}1573 \approx 0{,}16$.

### Lezione 4 — Calore specifico, Einstein, Debye, DOS e luce IR (pp. 49–64)
- **Eq. (52)**: Dulong–Petit $C_V = 3R \approx 24{,}9\text{ J mol}^{-1}\text{K}^{-1}$.
- **Eq. (54)–(55)**: Einstein $C_V = 3R\,\mathcal{E}(\Theta_E/T)$, $\mathcal{E}(x) = \frac{x^2 e^x}{(e^x - 1)^2}$; alta $T$: $3R[1 - \frac{1}{12}(\Theta_E/T)^2]$; bassa $T$: $3R(\Theta_E/T)^2 e^{-\Theta_E/T}$.
- **Eq. (56)–(59)**: Debye $g(\omega) = \frac{V\omega^2}{2\pi^2 v_s^3}$ (per polarizzazione), $3\int_0^{\omega_D} g\,d\omega = 3N$, $\omega_D = v_s(6\pi^2 N/V)^{1/3}$, $\Theta_D = \hbar\omega_D/k_B$:
  $$U_{\text{term}} = 9Nk_B T\left(\frac{T}{\Theta_D}\right)^3\int_0^{\Theta_D/T}\frac{x^3}{e^x - 1}\,dx, \qquad C_V = 9Nk_B\left(\frac{T}{\Theta_D}\right)^3\int_0^{\Theta_D/T}\frac{x^4 e^x}{(e^x - 1)^2}\,dx$$
  - Alta $T$: $C_V \simeq 3R[1 - \frac{1}{20}(\Theta_D/T)^2]$.
  - Bassa $T$ ($T \lesssim \Theta_D/50$): $C_V = \frac{12\pi^4}{5}R\left(\frac{T}{\Theta_D}\right)^3 \simeq 233{,}78\,R\left(\frac{T}{\Theta_D}\right)^3$.
- **§23.2 (DOS 1D / Van Hove)**: catena monatomica $g(\omega) = \frac{2N}{\pi\omega_{\max}}\frac{1}{\sqrt{1 - \omega^2/\omega_{\max}^2}}$, normalizzata a $N$.
- **Eq. (60) (Luce IR + fononi ottici)**: $\hbar\omega_{\text{luce}} = \hbar\omega_{\text{fonone}}$, $\mathbf{k}_{\text{luce}} = \mathbf{k}_{\text{fonone}} (+\mathbf{G})$; $k_{\text{luce}} \sim 10^{-5}\pi/a$ → incrocia solo il ramo ottico (TO in cristalli polari) a $k \approx 0$.
- **Eq. (61)–(62)**: $C_V = k_B \sum_j \mathcal{E}(\hbar\omega_j/k_B T)$; densità di energia a bassa $T$: $\tilde{u} = \frac{\pi^2 k_B^4}{10\hbar^3 c^3} T^4$ (3 polarizzazioni vs $\frac{\pi^2 k_B^4}{15\hbar^3 c^3}T^4$ fotoni).

---

## Numeri di riferimento e tabelle per test e crosscheck

1. **Catena monatomica tipo metallo (§3, p. 9)**: $M = 1{,}05\times 10^{-25}\text{ kg}$, $a = 2{,}5\text{ Å}$, $C = 20\text{ N/m}$ → $\sqrt{C/M} = 1{,}38\times 10^{13}\text{ s}^{-1}$, $v_s \approx 3{,}5\times 10^3\text{ m/s}$, $\omega_{\max} \approx 2{,}8\times 10^{13}\text{ rad/s}$ ($\nu_{\max} \approx 4{,}4\text{ THz}$, $\hbar\omega_{\max} \approx 18\text{ meV}$). Punto zero (§18, p. 47): $a_{\text{ho}} \approx 0{,}060\text{ Å}$, $\Delta x \approx 0{,}042\text{ Å}$ ($\approx 1{,}7\%$ di $a$).
2. **Catena biatomica tipo Na–Cl (§8, p. 23)**: $m = 23\text{ u} = 3{,}82\times 10^{-26}\text{ kg}$, $M = 35{,}5\text{ u} = 5{,}89\times 10^{-26}\text{ kg}$, $a = 5{,}64\text{ Å}$, $C = 10\text{ N/m}$ → $v_s \approx 4{,}1\times 10^3\text{ m/s}$, $\omega_{\max}^{\text{ac}} \approx 1{,}84\times 10^{13}\text{ rad/s}$ ($2{,}9\text{ THz}$), $\omega_{\min}^{\text{ott}} \approx 2{,}29\times 10^{13}\text{ rad/s}$ ($3{,}6\text{ THz}$), $\omega_+(0) \approx 2{,}94\times 10^{13}\text{ rad/s}$ ($4{,}7\text{ THz}$, $19\text{ meV}$), gap $\approx 0{,}7\text{ THz}$. Luce IR (§24, p. 60): $\lambda \approx 64\ \mu\text{m}$, $k_{\text{luce}}/(\pi/a) \approx 2\times 10^{-5}$.
3. **Cristalli reali 3D (Tab. 1, p. 36)**:
   - Al (fcc, $p=1$): a X, LA $\approx 40\text{ meV}$ ($9{,}7\text{ THz}$), TA $\approx 24\text{ meV}$ ($5{,}8\text{ THz}$).
   - Diamante (fcc, $p=2$): ottici a $\Gamma \approx 160\text{ meV}$ ($39\text{ THz}$).
   - PbTe (NaCl, $p=2$): a $\Gamma$, LO $\approx 3{,}3\text{ THz}$ ($14\text{ meV}$), TO $\approx 1{,}1\text{ THz}$ ($4{,}5\text{ meV}$).
4. **Umklapp 1D (§16, p. 40)**: $k_1 = 0{,}7\,\pi/a$, $k_2 = 0{,}6\,\pi/a \implies k_3 = -0{,}7\,\pi/a$.
5. **Calore specifico $C_V$ ($\text{J K}^{-1}\text{mol}^{-1}$, Tab. 2 e Tab. 3, pp. 51, 58)**:
   - Diamante ($\Theta_D = 2230\text{ K}$, $1880\text{ K}$ nel grafico): a $77\text{ K}$, $C_V \approx 0{,}08\text{ J K}^{-1}\text{mol}^{-1}$.
   - Al ($\Theta_D = 428\text{ K}$): Debye $7{,}7$ (77 K) / $22{,}1$ (273 K); slide $9{,}1$ / $23{,}8$.
   - Cu ($\Theta_D = 343\text{ K}$): Debye $10{,}9$ (77 K) / $23{,}1$ (273 K); slide $12{,}5$ / $24{,}3$; $\omega_D \approx 4{,}5\times 10^{13}\text{ s}^{-1}$.
   - Si ($\Theta_D = 645\text{ K}$): Debye $3{,}1$ (77 K) / $19{,}2$ (273 K); slide $5{,}8$ / $21{,}8$.
   - Pb ($\Theta_D = 105\text{ K}$): Debye $22{,}8$ (77 K) / $24{,}8$ (273 K); slide $23{,}6$ / $26{,}7$.
   - Altri $\Theta_D$: Be 1440 K, Fe 470 K, Ge 374 K, Au 165 K, Na 158 K, Ar 92 K, Hg 72 K, Cs 38 K.
   - Confronto Einstein vs Debye (§21.5, p. 53): per $\Theta_E = \Theta_D$ a $T = \Theta_D/10$, Einstein $C_V/3R \approx 4{,}5\times 10^{-3}$ vs Debye $\approx 7{,}6\times 10^{-2}$ (rapporto $\sim 17$). A $T = \Theta_D/10$ la legge asintotica $T^3$ sovrastima l'integrale di Debye di circa il $3\%$.
