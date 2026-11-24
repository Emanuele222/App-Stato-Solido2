# Crosscheck Numerico Indipendente — Sezione 3: Pacchetti d'onda, velocità di fase/gruppo e allargamento

**Modulo verificato:** [`src/renderer/src/physics/phononDispersion.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts#L925-L1417) (sezione pacchetti d'onda, righe 925–1417, e costanti condivise in [`src/renderer/src/physics/constants.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/constants.ts); preset e intervalli slider da [`src/renderer/src/sections/phonon-wavepacket/manifest.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-wavepacket/manifest.ts))  
**Fonti di riferimento:** [`materiale/parte6/dispensa.pdf`](file:///c:/Users/filip/Documents/App-Stato-Solido/materiale/parte6/dispensa.pdf) (Lezione 2 §6 pp. 14–17, eqq. 10–12, Figg. 7–9; Lezione 1 §3 eqq. 8–9, p. 9; Lezione 2 §§7–8 eqq. 20–23, pp. 19–23) e [`materiale/parte6/riferimento-formule.md`](file:///c:/Users/filip/Documents/App-Stato-Solido/materiale/parte6/riferimento-formule.md)  
**Script indipendente:** [`crosscheck/fononi/phonon_wavepacket_crosscheck.py`](file:///c:/Users/filip/Documents/App-Stato-Solido/crosscheck/fononi/phonon_wavepacket_crosscheck.py)  
**Output JSON grezzo:** [`crosscheck/fononi/phonon_wavepacket_crosscheck_results.json`](file:///c:/Users/filip/Documents/App-Stato-Solido/crosscheck/fononi/phonon_wavepacket_crosscheck_results.json)

---

## Verdetto: **approvata**

Su **34 verifiche numeriche indipendenti** eseguite direttamente contro le funzioni reali esportate da [`phononDispersion.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts), **34/34 sono PASS**:
- L'integrale esatto del pacchetto gaussiano eq. (10) al secondo ordine (quadratura composita Gauss–Legendre a 1024 nodi su $\pm 12\,\Delta k$) coincide con `wavepacketFieldAt` / `wavepacketWidthAt` (eq. 12) su tutti e 4 i regimi, più tempi $t$ e più posizioni $x$ (incluso inviluppo, fase di Gouy $-\tfrac{1}{2}\arctan\gamma$, chirp spaziale e densità $|\Psi|^2$) entro **$5{,}49 \times 10^{-14}$** (errore su $|\Psi|$ e $|\Psi|^2$ $\le 1{,}55 \times 10^{-15}$).
- La norma $L^2$ ($\int |\Psi|^2\,\mathrm{d}x = \sqrt{2\pi}\,\sigma_0$), il centro del pacchetto $\langle x \rangle = v_g t$, la larghezza $\sigma(t)$ e il numero d'onda locale (chirp $\partial_x \arg\Psi = k_0 + \gamma\xi / 2\sigma(t)^2$) sono verificati per quadratura spaziale entro **$6{,}96 \times 10^{-11}$** (norma $L^2$ e $\sigma(t)$ entro $7{,}04 \times 10^{-15}$).
- Le derivate numeriche centrali al 4° ordine in aritmetica `Decimal` a 50 cifre per $v_g = d\omega/dk$ e $\omega'' = d^2\omega/dk^2$ coincidono con `wavepacketGroupVelocity` e `wavepacketCurvatureAng2S` su tutta la griglia estesa $[-2\pi/a, +2\pi/a]$ entro **$8{,}79 \times 10^{-15}$** su tutti e 4 i regimi (`linear`, `acoustic`, `optical`, `quadratic`).
- Tutti i casi limite ($k_0 = 0$ su tutti i regimi, $k_0 = \pm\pi/a$ con $\omega'' = -a^2\omega_{\max}/4$, $k_0 \to 0$ sul ramo ottico con $\omega_+''(0) = -Ca^2/[2(m+M)\omega_+(0)]$, ramo ottico con $M = m$ al bordo zona, 60 combinazioni estreme degli slider, sonde logaritmiche $k \in [10^{-15}, 10^{-1}]\text{ Å}^{-1}$) sono privi di `NaN`/`Infinity` e coerenti alla precisione macchina.

Non risultano problemi **Bloccanti** né **Importanti**; si segnalano **2 osservazioni Minori** su soglie numeriche di contorno in casi degeneri (`spreadingTimeScaleS` esattamente al punto di flesso ottico e finestra $k \in [10^{-14}, 10^{-12})\text{ Å}^{-1}$ tra `vg` e `vp`).

---

## 1. Metodologia indipendente

1. **Derivazione autonoma da dispensa Parte 6 (prima di ispezionare `src/`):**
   - Equazione (10) (§6.1, p. 14):
     $$\Psi(x, t) = \frac{1}{\sqrt{2\pi}} \int_{-\infty}^{+\infty} \Phi(k)\, e^{i[kx - \omega(k)t]}\,\mathrm{d}k$$
     con peso gaussiano centrato in $k_0$, $\Phi(k_0 + \kappa) = \sqrt{2}\,\sigma_0\, e^{-\sigma_0^2 \kappa^2}$ ($\sigma_0 = 1/(2s) = 1/(2\Delta k)$, picco unitario a $t = 0, x = 0$, norma $L^2$ conservata $\int |\Psi|^2\,\mathrm{d}x = \sqrt{2\pi}\,\sigma_0$).
   - Sviluppo al 2° ordine $\omega(k_0 + \kappa) \simeq \omega_0 + v_g \kappa + \tfrac{1}{2}\omega''\kappa^2$ e legge di allargamento eq. (12) (§6.3, p. 17):
     $$\sigma(t) = \sigma_0 \sqrt{1 + \gamma^2}, \qquad \gamma = \frac{\omega'' t}{2\sigma_0^2} = 2s^2\omega'' t.$$
   - Regimi §6.2–§6.3: lineare ($\omega = v_s|k|$, $v_p = v_g = \pm v_s$, $\omega'' = 0$), acustico monatomico (eq. 8, $\omega'' = -(a^2/4)\omega(k)$, a $k_0 = \pm\pi/a$: $v_g = 0$ e $\omega'' = -a^2\omega_{\max}/4$), ottico biatomico (eq. 20, $v_g < 0$ per $0 < k < \pi/a$, $\omega_+''(0) = -Ca^2/[2(m+M)\omega_+(0)]$) e quadratico ($\hbar\omega = \hbar^2 k^2/2m_{\text{eff}}$, $v_g = 2v_p$, $\omega'' = \hbar/m_{\text{eff}}$).
2. **Implementazione indipendente da zero** in [`crosscheck/fononi/phonon_wavepacket_crosscheck.py`](file:///c:/Users/filip/Documents/App-Stato-Solido/crosscheck/fononi/phonon_wavepacket_crosscheck.py):
   - Aritmetica `Decimal` a **50 cifre** con costanti SI 2019 esatte ($h = 6{,}62607015 \times 10^{-34}\text{ J}\cdot\text{s}$, $e = 1{,}602176634 \times 10^{-19}\text{ C}$, $1\text{ u} = 1{,}6605390666 \times 10^{-27}\text{ kg}$, $m_e = 9{,}1093837015 \times 10^{-31}\text{ kg}$).
   - **Quadratura composita Gauss–Legendre** a 16 nodi su 64 pannelli (1024 nodi su $[-12\Delta k, +12\Delta k]$) per integrare direttamente l'eq. (10), sia con dispersione troncata al 2° ordine sia con la $\omega(k)$ **esatta non troncata**.
   - **Quadratura spaziale in $x$** (241 punti su $[x_g - 10\sigma(t), x_g + 10\sigma(t)]$) su `wavepacketFieldAt` per verificare norma $L^2$, $\langle x \rangle$, $\sigma(t)$, picco e chirp $\partial_x\arg\Psi$.
   - **Differenze finite centrate al 4° ordine** in `Decimal` ($h = 10^{-7}\text{ Å}^{-1}$ per $d\omega/dk$, $h = 10^{-6}\text{ Å}^{-1}$ per $d^2\omega/dk^2$).
3. **Esecuzione diretta di `physics/`:** tramite `.tools/node/node.exe` con `module.registerHooks` sugli stessi input.

---

## 2. Comandi eseguiti e risultati effettivi

| Comando | Esito | Risultato |
|---|---|---|
| `python crosscheck/fononi/phonon_wavepacket_crosscheck.py` | Exit code `0` | **34/34 PASS**; JSON salvato in [`crosscheck/fononi/phonon_wavepacket_crosscheck_results.json`](file:///c:/Users/filip/Documents/App-Stato-Solido/crosscheck/fononi/phonon_wavepacket_crosscheck_results.json) |
| `.\.tools\node\node.exe .\node_modules\vitest\vitest.mjs run src/renderer/src/physics/phononDispersion.test.ts` | Exit code `0` | `Test Files 1 passed (1)`, `Tests 22 passed (22)` in 184 ms |

---

## 3. Tabella riassuntiva dei confronti numerici

### 3.1 Quadratura integrale eq. (10), norma $L^2$, larghezza eq. (12) e chirp spaziale

| Grandezza / Verifica | Input (regime, $k_0$, $\sigma_0$, tempi $t$) | Valore dispensa / formula | Valore `physics/` | Valore crosscheck (GL16 / quad. $x$) | Errore max | Esito |
|---|---|---|---|---|---|---|
| Eq. (10) vs `wavepacketFieldAt` (`linear`) | $k_0 = 0{,}35\pi/a$, $\sigma_0 = 3a$, $t \in [0; 0{,}8]\text{ ps}$ (21 pt) | eqq. (10)–(12), $\gamma = 0$ | `realPsi`, `imagPsi`, `envelope`, $\sigma(t)$ | GL16 1024 nodi | $|\Delta\Psi| \le 1{,}16 \times 10^{-15}$, fase $\le 1{,}61 \times 10^{-15}\text{ rad}$ | **PASS** |
| Eq. (10) vs `wavepacketFieldAt` (`acoustic`) | $k_0 = 0{,}66\pi/a$, $\sigma_0 = 3a$, $t \in [0; 3]\text{ ps}$ (28 pt) | eqq. (10)–(12) | `wavepacketFieldAt`, `WidthAt` | GL16 1024 nodi | $|\Delta\Psi| \le 2{,}49 \times 10^{-15}$, fase $\le 7{,}86 \times 10^{-15}\text{ rad}$ | **PASS** |
| Eq. (10) vs `wavepacketFieldAt` (`acoustic` bordo) | $k_0 = \pi/a$, $\sigma_0 = 1{,}5a$, $t \in [0; 1]\text{ ps}$ (21 pt) | $\omega'' = -a^2\omega_{\max}/4$, $v_g = 0$ | `wavepacketFieldAt`, `WidthAt` | GL16 1024 nodi | $|\Delta\Psi| \le 2{,}28 \times 10^{-15}$, fase $\le 9{,}70 \times 10^{-15}\text{ rad}$ | **PASS** |
| Eq. (10) vs `wavepacketFieldAt` (`optical`) | $k_0 = 0{,}5\pi/a$, $\sigma_0 = 3a$, $t \in [0; 6]\text{ ps}$ (28 pt) | eqq. (10)–(12), $v_g < 0$ | `wavepacketFieldAt`, `WidthAt` | GL16 1024 nodi | $|\Delta\Psi| \le 2{,}04 \times 10^{-14}$, fase $\le 5{,}48 \times 10^{-14}\text{ rad}$ | **PASS** |
| Eq. (10) vs `wavepacketFieldAt` (`optical` centro) | $k_0 = 0$, $\sigma_0 = 4a$, $t \in [0; 5]\text{ ps}$ (21 pt) | $\omega_+''(0) < 0$, $v_g = 0$ | `wavepacketFieldAt`, `WidthAt` | GL16 1024 nodi | $|\Delta\Psi| \le 3{,}01 \times 10^{-14}$, fase $\le 3{,}95 \times 10^{-14}\text{ rad}$ | **PASS** |
| Eq. (10) vs `wavepacketFieldAt` (`quadratic`) | $k_0 = 0{,}5\pi/a$ ($\sigma_0=3a$) e $-0{,}4\pi/a$ ($\sigma_0=6a$) | $\omega'' = \hbar/m_0$, $v_g = 2v_p$ | `wavepacketFieldAt`, `WidthAt` | GL16 1024 nodi | $|\Delta\Psi| \le 8{,}64 \times 10^{-15}$, fase $\le 1{,}20 \times 10^{-14}\text{ rad}$ | **PASS** |
| Eq. (10) con $\omega(k)$ **ESATTA** (`quadratic`) | $k_0 = 0{,}5\pi/a$ e $-0{,}4\pi/a$ | $\omega^{(3)} \equiv 0$ (esatta) | `wavepacketFieldAt` | GL16 su $\omega(k)$ esatta | $|\Delta\Psi| \le 8{,}50 \times 10^{-15}$ | **PASS** |
| Eq. (10) con $\omega(k)$ **ESATTA** (`linear`, `acoustic`, `optical`) | Come sopra | Scarto fisico di ordine $\ge 3$ ($\omega''' \ne 0$) | `wavepacketFieldAt` (2° ord.) | GL16 su $\omega(k)$ esatta | $1{,}27 \times 10^{-6}$ (`lin`), $9{,}93 \times 10^{-3}$ (`ac`), $8{,}73 \times 10^{-3}$ (`opt`) | **PASS** |
| Norma $L^2$, $\langle x \rangle$, $\sigma(t)$, picco e chirp $\partial_x\arg\Psi$ | Tutti e 4 i regimi (5 casi, 241 pt/tempo) | $\int|\Psi|^2 dx = \sqrt{2\pi}\sigma_0$, $\sigma(t)$ eq. (12) | `wavepacketFieldAt` | Quadratura su $x$ + FD phase | $L^2 \le 7{,}04 \times 10^{-15}$, $\sigma(t) \le 2{,}92 \times 10^{-16}$, chirp $\le 6{,}96 \times 10^{-11}$ | **PASS** |

### 3.2 Derivate numeriche centrali FD4, tutti i 4 regimi e casi limite

| Grandezza / Caso | Input | Valore dispensa | Valore `physics/` | Valore crosscheck | Scarto rel. max | Esito |
|---|---|---|---|---|---|---|
| Griglia $[-2\pi/a, +2\pi/a]$ `linear` (201 pt) | $a=2{,}5\text{ Å}, M=63{,}2\text{ u}, C=20\text{ N/m}$ | $\omega=v_s|k|$, $v_g=v_p=\pm v_s$, $\omega''=0$ | `wavepacketOmega/Vg/Vp/Curv` | FD4 `Decimal` 50 cifre | $\omega, v_p, v_g, \omega'' \le 2{,}27 \times 10^{-16}$ | **PASS** |
| Griglia $[-2\pi/a, +2\pi/a]$ `acoustic` (201 pt) | $a=2{,}5\text{ Å}, M=63{,}2\text{ u}, C=20\text{ N/m}$ | eq. (8), $\omega'' = -(a^2/4)\omega(k)$ | `wavepacketOmega/Vg/Vp/Curv` | FD4 `Decimal` 50 cifre | $\omega, v_p, v_g \le 9{,}28 \times 10^{-16}$; $\omega'' \le 1{,}46 \times 10^{-15}$ | **PASS** |
| Griglia $[-2\pi/a, +2\pi/a]$ `optical` (201 pt) | Na–Cl ($a=5{,}64\text{ Å}, M=35{,}5\text{ u}, m=23\text{ u}, C=10$) | eq. (20), $v_g<0$ su $(0,\pi/a)$ | `wavepacketOmega/Vg/Vp/Curv` | FD4 `Decimal` 50 cifre | $\omega, v_p, v_g \le 6{,}86 \times 10^{-16}$; $\omega'' \le 8{,}79 \times 10^{-15}$ | **PASS** |
| Griglia $[-2\pi/a, +2\pi/a]$ `quadratic` (201 pt) | $m_{\text{eff}} = m_0$ | $\omega=\tfrac{\hbar k^2}{2m_0}$, $v_g=2v_p$, $\omega''=\frac{\hbar}{m_0}$ | `wavepacketOmega/Vg/Vp/Curv` | FD4 + $\hbar^2/2m_0 = 3{,}80998$ | $\le 4{,}27 \times 10^{-16}$ ($5{,}55 \times 10^{-7}$ vs CODATA 2018) | **PASS** |
| Bordo zona `acoustic` $k_0 = \pm\pi/a$ | `MONATOMIC_REF` | $v_g = 0$, $\omega'' = -a^2\omega_{\max}/4$, $v_p = \pm\frac{2}{\pi}v_s$ | $v_g=0$, $\omega''=-4{,}314018 \cdot 10^{13}\text{ Å}^2/\text{s}$, $v_p=\pm 2197{,}11\text{ m/s}$ | Identico (formula + FD4) | $0{,}00$ | **PASS** |
| Centro zona `optical` $k_0 = 0$ e $k_0 \to 0^+$ | `DIATOMIC_REF`, $k_0=0$ e $10^{-4}\pi/a$ | $v_g(0)=0$, $v_p\to\pm\infty$, $\omega_+''(0) = -\frac{Ca^2}{2(m+M)\omega_+(0)}$ | $v_g=0$, `vpMs=null`, $\omega_+''(0)=-5{,}573564 \cdot 10^{13}\text{ Å}^2/\text{s}$ | Identico (formula + FD4) | $\le 5{,}20 \times 10^{-15}$ | **PASS** |
| Ramo `optical` $v_g<0$, bordo $\pm\pi/a$, flesso | $k_0 = \pm 0{,}5\pi/a$, $\pm\pi/a$, $k_{\text{flesso}} \approx 0{,}4241\text{ Å}^{-1}$ | $v_g(\pm 0{,}5\pi/a) = \mp 1472{,}44\text{ m/s}$, $\omega''(\pi/a) > 0$ | $\omega''(\pi/a) = +3{,}348440 \cdot 10^{14}\text{ Å}^2/\text{s}$ | Identico | $\le 7{,}50 \times 10^{-15}$ *(v. nota Minore 1)* | **PASS** |
| Ramo `optical` degenere $M = m$ a $k_0 = \pm\pi/a$ | $M = m = 29\text{ u}$ | Punto angoloso da ripiegamento | `vgMs=0`, `omegaSecond=0`, `isZoneEdgeStanding=false` | Coerente | $0{,}00$ | **PASS** |
| Origine $k_0 = 0$ (`linear` e `acoustic`) | $k_0 = 0$ e $k_0 = 10^{-4}\pi/a$ | Cuspide $\pm v_s$; $\omega \simeq v_s k[1-(ka)^2/24]$ | `vpMs=null`, `vgMs=0`, `isOriginCusp=true` | $v_s = 3451{,}214\text{ m/s}$ | $0{,}00$ ($4{,}11 \times 10^{-9}$ su asintotica $O(k^5)$) | **PASS** |
| Sonde logaritmiche $k \in [10^{-15}, 10^{-1}]\text{ Å}^{-1}$ | 16 sonde × 4 regimi | Nessun `NaN`/`Inf` | Tutti finiti | $\omega$ vs `Decimal` 50 cifre | $\le 2{,}21 \times 10^{-16}$ *(v. nota Minore 2)* | **PASS** |
| `wavepacketSnapshot`, `DispersionCurve`, 60 estremi slider | 4 snapshot + 4 curve (241 pt) + $4\times 5\times 3$ vertici | $\sigma_0\Delta k = 1/2$, $1\text{ THz} \leftrightarrow 4{,}13567\text{ meV}$ | `profile`, `atoms`, `freqThz`, `energyMev` | `Decimal` + SI 2019 | $\le 5{,}11 \times 10^{-16}$ ($\text{meV}$: $2{,}23 \times 10^{-10}$) | **PASS** |

---

## 4. Problemi trovati (in ordine di gravità)

Nessun problema **Bloccante** né **Importante**. Si segnalano due osservazioni **Minori** di contorno numerico:

1. **[Minore] Soglia non scalata `absCurv > 1e-6` per `spreadingTimeScaleS` al punto di flesso del ramo ottico**  
   - **Dove:** [`src/renderer/src/physics/phononDispersion.ts#L1221-L1223`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts#L1221-L1223).  
   - **Cosa succede:** Nel ramo ottico Na–Cl esiste un punto di flesso in $k_{\text{flesso}} \approx 0{,}4241210568566\text{ Å}^{-1}$ dove $\omega_+''(k_{\text{flesso}}) = 0$ esatto. In float64 il residuo numerico di cancellazione vale $\omega_+'' \approx 0{,}075\text{ Å}^2/\text{s}$ (cioè $7{,}5 \times 10^{-15}$ rispetto alla scala tipica $\sim 10^{13}\text{ Å}^2/\text{s}$). Poiché la guardia `absCurv > 1e-6` è assoluta (non scalata alla dispersione caratteristica), `spreadingTimeScaleS` vale `7629.28` s anziché `null`.  
   - **Impatto / riproduzione:** Inavvertibile nella UI (lo slider $k_0$ ha passo $0{,}02\,\pi/a$), visibile solo invocando `wavepacketCharacteristics` esattamente sul punto di flesso con precisione $\sim 10^{-14}$.  
   - **Suggerimento:** Usare una soglia relativa o fisica su $\tau_{\text{disp}}$ (o `absCurv > 1e-12 * characteristicScale`).

2. **[Minore] Finestra di soglia asimmetrica $10^{-14} \le |k_0| < 10^{-12}\text{ Å}^{-1}$ tra `wavepacketGroupVelocity` e `wavepacketPhaseVelocity`**  
   - **Dove:** [`src/renderer/src/physics/phononDispersion.ts#L168`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts#L168), [`#L1111`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts#L1111) (`< 1e-14`), [`#L1145`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts#L1145) (`< 1e-12`), e [`#L1225`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phononDispersion.ts#L1225) (`Math.abs(k0Frac) < 1e-6`).  
   - **Cosa succede:** Per $|k_0| \in [10^{-14}, 10^{-12})\text{ Å}^{-1}$ nei regimi `linear` e `acoustic`, `vpMs` restituisce `null` mentre `vgMs` restituisce $\pm v_s \approx \pm 3451{,}21\text{ m/s}$ (e `isOriginCusp` è `true` già per $|k_0/(\pi/a)| < 10^{-6}$).  
   - **Impatto:** Trascurabile nella UI per via dello snap su $k_0 = 0$ (`kSnap = 0.025`); resta coerente per chiamate normali.
