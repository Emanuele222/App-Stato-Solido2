# Crosscheck Numerico Indipendente — Sezione 6: Calore specifico del reticolo (`phonon-specific-heat`)

**Modulo verificato:** [`src/renderer/src/physics/specificHeat.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/specificHeat.ts) (e costanti condivise in [`src/renderer/src/physics/constants.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/constants.ts); intervalli slider e campionamento grafico da [`src/renderer/src/sections/phonon-specific-heat/manifest.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-specific-heat/manifest.ts))  
**Fonti di riferimento:** [`materiale/parte6/dispensa.pdf`](file:///c:/Users/filip/Documents/App-Stato-Solido/materiale/parte6/dispensa.pdf) (Lezione 4 §§20–23 e §25, eqq. 52–59 e 61–62, Figg. 22–27, Tabb. 2–4, pp. 49–63) e [`materiale/parte6/riferimento-formule.md`](file:///c:/Users/filip/Documents/App-Stato-Solido/materiale/parte6/riferimento-formule.md)  
**Script indipendente:** [`crosscheck/fononi/specific_heat.py`](file:///c:/Users/filip/Documents/App-Stato-Solido/crosscheck/fononi/specific_heat.py)  
**Output JSON grezzo:** [`crosscheck/fononi/specific_heat_crosscheck_results.json`](file:///c:/Users/filip/Documents/App-Stato-Solido/crosscheck/fononi/specific_heat_crosscheck_results.json)

---

## Verdetto: **da correggere**

Su **14 verifiche numeriche indipendenti** eseguite direttamente contro le funzioni reali esportate da [`specificHeat.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/specificHeat.ts), **13/14 sono PASS** (con accuratezza a livello di macchina o limitata al solo troncamento CODATA a 10 cifre delle costanti condivise), mentre **1/14 è FAIL** sopra la soglia di tolleranza ($> 10^{-4}$):

- **Dulong–Petit, Einstein e Debye 3D (13/13 PASS):**
  - `dulongPetitCv() = 3R = 24.94338785445972 J·mol⁻¹·K⁻¹` e costanti SI 2019 esatte entro **$6{,}13 \times 10^{-10}$** (dovuto esclusivamente a `HBAR_J_S` troncata a 10 cifre in `constants.ts`).
  - Funzione di Einstein $\mathcal{E}(x)$ su $x \in [0, 700]$ (incluso il raccordo di Taylor a $x = 10^{-4}$) ed asintoti alta/bassa $T$: scarto relativo massimo **$3{,}33 \times 10^{-16}$**.
  - Integrali di Debye $D_3(u)$ e $\Phi_D(u)$ su $u \in [0, 500]$ (inclusi $u = 10^{-3}$ e il taglio `uCap = 65`) e su tutta la **griglia estesa di 306 coppie** $T \in [5, 1500]\text{ K} \times \Theta_D \in [30, 2500]\text{ K}$: scarto relativo massimo **$6{,}25 \times 10^{-16}$** rispetto alla quadratura adattiva indipendente di Romberg in `Decimal` a 40 cifre (su variabile trasformata $x = s^2$), zero `NaN`/`Infinity`.
  - Identità per parti $D_3(u) = 4\Phi_D(u) - \frac{3u}{e^u - 1}$ verificata a **$5{,}59 \times 10^{-20}$** e coerenza termodinamica $C_V = (\partial U_{\text{term}}/\partial T)_V$ tramite FD4 sui dati dell'app entro **$5{,}28 \times 10^{-12}$**.
  - Confronto $T = \Theta_D/10$, $\Theta_D/20$, $\Theta_D/50$ (§21.5 e §22.7), Tab. 2 a $77\text{ K}$ e $273\text{ K}$ (Al, Cu, Si, Fe, Au, Na, Pb), Diamante a $77\text{ K}$ ($0{,}08002\text{ J·mol⁻¹·K⁻¹}$), DOS 3D $\tilde{g}(w) = 3w^2$ (con verifica spettrale $\int_0^1 3w^2 \mathcal{E}(w\Theta_D/T)\,\mathrm{d}w = D_3$), DOS 1D di Van Hove e analogia con il corpo nero (§25, eq. 62, fattore $3/2$ e scaling $T^4$): tutti **PASS**.
- **Catena 1D a bassa temperatura — problema Importante (1 FAIL):**
  - `monatomic1DCvRatio(temperatureK, thetaMaxK)` ([`specificHeat.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/specificHeat.ts#L319-L330)) usa due soli pannelli fissi Gauss–Legendre 16 su $[0, \pi/4]$ e $[\pi/4, \pi/2]$ dopo il cambio di variabile $w = \sin t$. Per $u = \Theta_{\max}/T \gg 1$ l'integrando $\mathcal{E}(u\sin t)$ si concentra in $[0, 10/u]$: nel dominio reale dei grafici (`tMinPlotK = 5 K`, `thetaDK` fino a `2500 K`, ossia $u$ fino a $500$), l'errore relativo raggiunge **$1{,}77\%$** a $(10\text{ K}, 2500\text{ K})$, **$11{,}22\%$** per il Diamante $(5\text{ K}, 2230\text{ K})$ e **$15{,}17\%$** a $(5\text{ K}, 2500\text{ K})$, distorcendo la pendenza log-log della curva `chain1D` nello stage `beyond-1953`.

---

## 1. Metodologia indipendente

1. **Costanti SI 2019 esatte + CODATA 2018 in `Decimal` a 40 cifre** (prima di ispezionare `src/`):
   - $h = 6{,}62607015\times 10^{-34}\text{ J}\cdot\text{s}$, $e = 1{,}602176634\times 10^{-19}\text{ C}$, $k_B = 1{,}380649\times 10^{-23}\text{ J}\cdot\text{K}^{-1}$, $N_A = 6{,}02214076\times 10^{23}\text{ mol}^{-1}$, $c = 299792458\text{ m/s}$ (esatte SI), $\pi$ calcolato via Machin a 40+ cifre, $\hbar = h/(2\pi)$, $R = N_A k_B = 8{,}31446261815324\text{ J mol}^{-1}\text{K}^{-1}$.
2. **Integrali di Debye $D_3(u)$ e $\Phi_D(u)$ con metodo indipendente:**
   - L'app usa Gauss–Legendre a 16 punti composita su breakpoint fissi `[0, 0.5, 1.5, 3.5, 7.5, 15, 32, 65]` (troncata a `uCap = 65`).
   - Il crosscheck reimplementa entrambi gli integrali tramite **quadratura adattiva di Romberg** (estrapolazione di Richardson sulla regola dei trapezi, tolleranza $10^{-21}$) in `Decimal` a 40 cifre dopo la trasformazione $x = s^2$ su $[0, \sqrt{\min(u, 120)}]$ (dove la coda $\int_{120}^{\infty} x^4 e^{-x}\,\mathrm{d}x < 10^{-44}$ è nulla a 40 cifre).
   - Viene inoltre verificata l'identità analitica per integrazione per parti $D_3(u) = 4\Phi_D(u) - 3u/(e^u - 1)$ e la derivata termodinamica $C_V^D(T) = (\partial U_{\text{term}}/\partial T)_V$ via differenze finite centrali al 4° ordine (FD4) sui valori restituiti dall'app.
3. **DOS 3D, DOS 1D Van Hove e $C_V$ 1D:**
   - Coerenza spettrale $\int_0^1 3w^2\mathcal{E}(w\Theta_D/T)\,\mathrm{d}w = D_3(\Theta_D/T)$ verificata con integrazione di Simpson composita su 201 campioni reali restituiti da `debyeSpectralContribution`.
   - Normalizzazione $\int_0^1 \tilde{g}_{1D}(w)\,\mathrm{d}w = 1$ e calore specifico 1D `monatomic1DCvRatio` calcolati indipendentemente con la **trasformazione algebrica** $w = 1 - t^2$, $\mathrm{d}w/\sqrt{1-w^2} = -2\,\mathrm{d}t/\sqrt{2-t^2}$ (diversa da $w = \sin\theta$ dell'app) e Romberg adattivo in `Decimal`, più limiti bassa $T$ ($\frac{2\pi}{3}\frac{T}{\Theta_{\max}}$) e alta $T$ ($1 - \frac{1}{24}(\Theta_{\max}/T)^2$).
4. **Runner Node sui moduli TS reali:**
   - Le funzioni esportate da [`specificHeat.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/specificHeat.ts) e [`constants.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/constants.ts) sono state importate ed eseguite direttamente tramite `.tools/node/node.exe` con `--input-type=module` e `registerHooks`.

---

## 2. Comandi eseguiti e risultati effettivi

| Comando | Esito | Risultato |
|---|---|---|
| `python crosscheck/fononi/specific_heat.py` | Exit code `1` | **13/14 PASS**, **1 FAIL** (`Calore specifico 1D` fino a `max_rel = 1.517e-01` a $T=5\text{ K}, \Theta_{\max}=2500\text{ K}$); JSON salvato in [`crosscheck/fononi/specific_heat_crosscheck_results.json`](file:///c:/Users/filip/Documents/App-Stato-Solido/crosscheck/fononi/specific_heat_crosscheck_results.json) |
| `.\.tools\node\node.exe .\node_modules\vitest\vitest.mjs run src/renderer/src/physics/specificHeat.test.ts` | Exit code `0` | `Test Files 1 passed (1)`, `Tests 5 passed (5)` in 181 ms |

---

## 3. Tabella riassuntiva dei confronti numerici

### 3.1 Dulong–Petit, Einstein, Debye 3D, DOS, $C_V$ 1D e corpo nero

| Grandezza / Verifica | Input / Ambito | Valore dispensa / formula | Valore `physics/` | Valore crosscheck | Errore max (ass. / rel.) | Esito |
|---|---|---|---|---|---|---|
| Costanti SI 2019 e Dulong–Petit ($3R$) | eq. (52), `THREE_R`, `DEBYE_T3_PREFACTOR` | $3R \approx 24{,}9\text{ J mol}^{-1}\text{K}^{-1}$; $12\pi^4/5 \approx 233{,}78$ | `THREE_R = 24.94338785445972`, `233.7818184816058` | `Decimal` 40 cifre | Ass. `0.00` (su `3R`); Rel. **$6{,}13 \times 10^{-10}$** (su `HBAR_J_S`) | **PASS** |
| Funzione di Einstein $\mathcal{E}(x)$ | 22 punti $x \in [0, 1000]$ (incl. $10^{-4}$, $700$, $>700$) | eq. (54): $x^2 e^x/(e^x-1)^2$ | `einsteinFunction(x)` ($0$ per $x > 700$) | `Decimal` 40 cifre | Su $x \le 700$: Rel. **$3{,}33 \times 10^{-16}$**; cutoff $x>700$ con residuo $< 10^{-298}$ | **PASS** |
| Calore specifico Einstein $C_V^E(T)$ + asintoti | 10 coppie $(T, \Theta_E)$, inclusi limiti alta/bassa $T$ | eqq. (54)–(55), §21.4 | `einsteinCv`, `einsteinHighTAsymptote`, `einsteinLowTAsymptote` | `Decimal` 40 cifre | Rel. **$2{,}45 \times 10^{-16}$** (asintoti: $6{,}67\times 10^{-10}$ a $15000\text{ K}$, $4{,}12\times 10^{-9}$ a $15\text{ K}$) | **PASS** |
| Integrale di Debye $D_3(u)$ + identità per parti | 33 punti $u \in [0, 500]$ (incl. $10^{-3}$, $64{,}9$, $65{,}1$) | eq. (58): $(3/u^3)\int_0^u x^4 e^x/(e^x-1)^2\,\mathrm{d}x$ | `debyeIntegralD3(u)` (GL16 composita) | Romberg `Decimal` su $x=s^2$ + IBP | Rel. **$3{,}84 \times 10^{-16}$** (IBP: $5{,}59\times 10^{-20}$) | **PASS** |
| Integrale energia interna $\Phi_D(u)$ | 33 punti $u \in [0, 500]$ | eq. (58): $(3/u^3)\int_0^u x^3/(e^x-1)\,\mathrm{d}x$ | `debyeEnergyIntegral(u)` (GL16 composita) | Romberg `Decimal` su $x=s^2$ | Rel. **$5{,}70 \times 10^{-16}$** | **PASS** |
| Griglia estesa Debye $C_V$ e $U_{\text{term}}$ | **306 coppie**: $T\in[5, 1500]\text{ K} \times \Theta_D\in[30, 2500]\text{ K}$ | eq. (58) | `debyeCv`, `debyeThermalEnergyMolarJ` | Romberg `Decimal` su $x=s^2$ | `C_V`: **$4{,}36 \times 10^{-16}$**; `U_term`: **$6{,}25 \times 10^{-16}$**; 0 `NaN` | **PASS** |
| Coerenza $C_V = (\partial U_{\text{term}}/\partial T)_V$ | 6 punti $(T, \Theta_D)$ da $10\text{ K}$ a $1200\text{ K}$ | eq. (58) | `debyeCv` vs `debyeThermalEnergyMolarJ` | FD4 centrata | Rel. **$5{,}28 \times 10^{-12}$** (a $T=180\text{ K}, \Theta_D=343\text{ K}$) | **PASS** |
| Confronto $T = \Theta_D/10$, $\Theta_D/20$, $\Theta_D/50$ | $\Theta_E = \Theta_D = 1000\text{ K}$; $T = 100, 50, 20\text{ K}$ | §21.5: $4{,}5\times 10^{-3}$ vs $7{,}6\times 10^{-2}$ ($\sim 17\times$, $\sim 10^4\times$ a $\Theta_D/20$); §22.7: $+3\%$ a $\Theta_D/10$ | `E=4.5404e-3`, `D=7.5821e-2` ($16{,}70\times$, $T^3$ $+2{,}78\%$); a $\Theta_D/20$: $1{,}18\times 10^4\times$ | `Decimal` 40 cifre | Rel. **$1{,}91 \times 10^{-16}$** (a $\Theta_D/50$ legge $T^3$ entro $1{,}74\times 10^{-16}$) | **PASS** |
| Tab. 2 ($77\text{ K}, 273\text{ K}$), Tab. 3 e Diamante $77\text{ K}$ | 7 elementi Tab. 2 + Diamante ($2230, 1880\text{ K}$) + 9 preset | Tabb. 2–3, §22.7 ($0{,}08\text{ J K}^{-1}\text{mol}^{-1}$) | `debyeCv` + `MATERIAL_PRESETS` | Romberg `Decimal` + valori dispensa | Rel. **$3{,}47 \times 10^{-16}$** (v. §3.2 per tutti i valori) | **PASS** |
| DOS 3D di Debye e integrale spettrale | $w \in [-0{,}01, 1{,}001]$; 201 punti su $w \in [0, 1]$ per 3 casi | eq. (56): $\tilde{g}(w)=3w^2$, $\int_0^1 3w^2\mathcal{E}\,dw = D_3$ | `debyeDosDimless`, `debyeSpectralContribution` | Analitico + Simpson 200 pannelli sui campioni app | `dos`: `0.00`; spettrale: **$6{,}51 \times 10^{-11}$** | **PASS** |
| DOS 1D Van Hove (norm. e singolarità) | $w \in [-0{,}1, 1{,}01]$ incl. $0{,}992; 0{,}99999; 1{,}0$ | §23.2: $\frac{2}{\pi\sqrt{1-w^2}}$, $\int_0^1 \tilde{g}_{1D}\,dw=1$, $\infty$ a $w=1$ | `monatomicDos1DDimless` (`Infinity` a $w=1$) | Romberg `Decimal` su $w=1-t^2$ | Norm. err: **$8{,}58\times 10^{-28}$**; $w\le 0{,}992$: $5{,}90\times 10^{-16}$; $w=0{,}99999$: **$2{,}48\times 10^{-12}$** *(Minore 1)* | **PASS** |
| **Calore specifico 1D $C_V^{1D}/R$** | 14 coppie $T \in [5, 5000]\text{ K}, \Theta_{\max} \in [100, 2500]\text{ K}$ | $\int_0^1 \frac{2}{\pi\sqrt{1-w^2}}\mathcal{E}(w u)\,\mathrm{d}w$ | `monatomic1DCvRatio` ($w=\sin\theta$, 2 GL16) | Romberg `Decimal` su $w=1-t^2$ | Rel. **$1{,}517 \times 10^{-1}$** ($+15{,}17\%$ a $T=5\text{ K}, \Theta=2500\text{ K}$) | **FAIL** |
| Analogia corpo nero | $T \in \{5, 20, 77, 300\}\text{ K}$, vari $v_s$ e $v_s = c$ | §25 eq. (62): $\tilde{u}_{\text{ph}}/\tilde{u}_\gamma|_{v_s=c} = 3/2$, $\propto T^4$ | `phononBlackBodyEnergyDensity`, `photonBlackBodyEnergyDensity` | `Decimal` SI 2019 | vs SI 2019: **$1{,}84 \times 10^{-9}$**; fattore $3/2$ e $T^4$: **$0{,}00$** | **PASS** |
| Scale $\omega_D, \nu_D, \hbar\omega_D$ e statistiche FD/MB/BE | 7 $\Theta_D$, 5 $T$, 11 $x \in [-10, 701]$ | eq. (57), Cu $\omega_D \approx 4{,}5\times 10^{13}\text{ s}^{-1}$, Fig. 22 | `debyeOmegaRadS = 4.4906e13` (Cu), `fermiDirac/maxwellBoltzmann/boseEinsteinOccupancy` | `Decimal` SI 2019 | Scale: **$6{,}13 \times 10^{-10}$**; statistiche ($x\le 700$): **$1{,}49 \times 10^{-16}$** | **PASS** |

### 3.2 Verifica dettagliata della Tabella 2 (p. 51) e del Diamante a $77\text{ K}$ (p. 57)

| Elemento | $\Theta_D$ (K) | Dispensa Tab. 2 Debye (77 K) | `debyeCv(77, Θ_D)` | Crosscheck `Decimal` (77 K) | Dispensa Tab. 2 Debye (273 K) | `debyeCv(273, Θ_D)` | Crosscheck `Decimal` (273 K) | Scarto rel. max |
|---|---|---|---|---|---|---|---|---|
| Rame (`Cu`) | 343 | 10,9 | `10.92903439739094` | `10.92903439739094` | 23,1 | `23.080466754886093` | `23.080466754886093` | $0{,}00$ |
| Alluminio (`Al`) | 428 | 7,7 | `7.664981252369355` | `7.664981252369355` | 22,1 | `22.128003227047675` | `22.12800322704768` | $3{,}21 \times 10^{-16}$ |
| Oro (`Au`) | 165 | 20,0 | `20.038186483629605` | `20.0381864836296` | 24,5 | `24.493681624003983` | `24.493681624003976` | $2{,}90 \times 10^{-16}$ |
| Piombo (`Pb`) | 105 | 22,8 | `22.7698943128933` | `22.769894312893303` | 24,8 | `24.759865616146346` | `24.759865616146346` | $1{,}56 \times 10^{-16}$ |
| Ferro (`Fe`) | 470 | 6,4 | `6.400751478754396` | `6.400751478754397` | 21,6 | `21.605155684537902` | `21.605155684537902` | $1{,}39 \times 10^{-16}$ |
| Sodio (`Na`) | 158 | 20,4 | `20.39030912464366` | `20.39030912464366` | 24,5 | `24.530586146871414` | `24.530586146871418` | $1{,}45 \times 10^{-16}$ |
| Silicio (`Si`) | 645 | 3,1 | `3.0625299225289635` | `3.0625299225289635` | 19,2 | `19.16352266813985` | `19.16352266813985` | $0{,}00$ |
| **Diamante (`C`)** | **2230** | **$\approx 0{,}08$** (§22.7) | **`0.08002072840894416`** | **`0.08002072840894418`** | — | — | — | $2{,}5\times 10^{-16}$ |

*(Nota: per il Diamante a $77\text{ K}$ e $\Theta_D = 2230\text{ K}$, la legge asintotica $T^3$ dà `0.08002072907004643`, indistinguibile dal valore integrale esatto entro $8{,}3\times 10^{-9}$ relativo; con il valore alternativo del grafico $\Theta_D = 1880\text{ K}$ l'app restituisce `0.13354983929904646`.)*

### 3.3 Dettaglio dell'errore su `monatomic1DCvRatio` a bassa temperatura

| $T$ (K) | $\Theta_{\max}$ (K) | $u = \Theta_{\max}/T$ | `monatomic1DCvRatio` (app) | Crosscheck `Decimal` ($w = 1 - t^2$) | Errore relativo |
|---:|---:|---:|---:|---:|---:|
| 77 | 343 | 4,45 | `0.5393011975421076` | `0.5393011975421075` | $2{,}06 \times 10^{-16}$ |
| 77 | 2230 | 28,96 | `0.07266717437023924` | `0.07266717426090759` | $1{,}50 \times 10^{-9}$ |
| 50 | 2500 | 50,0 | `0.04195467667100154` | `0.04195461899981548` | $1{,}37 \times 10^{-6}$ |
| 10 | 1000 | 100,0 | `0.020955166974140012` | `0.020952236932400267` | $1{,}40 \times 10^{-4}$ |
| 20 | 2500 | 125,0 | `0.0167767508461909` | `0.01675939995651865` | $1{,}04 \times 10^{-3}$ |
| 5 | 1000 | 200,0 | `0.010373908594553345` | `0.010473009601616177` | $9{,}46 \times 10^{-3}$ ($-0{,}95\%$) |
| 10 | 2230 | 223,0 | `0.009252268342734954` | `0.00939265220247537` | $1{,}49 \times 10^{-2}$ ($-1{,}49\%$) |
| 10 | 2500 | 250,0 | `0.008230130763350555` | `0.008378109762558816` | $1{,}77 \times 10^{-2}$ ($-1{,}77\%$) |
| 5 | 2230 | 446,0 | `0.005222976999253254` | `0.0046960463538319765` | **$1{,}12 \times 10^{-1}$ ($+11{,}22\%$)** |
| 5 | 2500 | 500,0 | `0.00482426160255026` | `0.004188856357106795` | **$1{,}52 \times 10^{-1}$ ($+15{,}17\%$)** |

---

## 4. Problemi trovati (in ordine di gravità)

### Importante 1 — Quadratura sottocampionata in `monatomic1DCvRatio` per $T \ll \Theta_{\max}$ (errore fino a $+15{,}17\%$ nel dominio UI)
- **File e righe:** [`src/renderer/src/physics/specificHeat.ts#L319-L330`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/specificHeat.ts#L319-L330).
- **Cosa è sbagliato:** La funzione integra $\frac{2}{\pi}\int_0^{\pi/2} \mathcal{E}(u\sin t)\,\mathrm{d}t$ (con $u = \Theta_{\max}/T$) usando **due soli pannelli fissi** `gaussLegendre16` su $[0, \pi/4]$ e $[\pi/4, \pi/2]$.
- **Perché:** Per $u \gg 1$, l'integrando $\mathcal{E}(u\sin t)$ vale $\approx 1$ in $t=0$ e decade esponenzialmente per $u \sin t \gtrsim 10$, cioè tutto il peso dell'integrale si concentra in $[0, 10/u]$. Sul primo pannello fisso $[0, \pi/4] \approx [0, 0{,}7854]$, i primi due nodi di GL16 cadono a $t_1 \approx 0{,}00416$ e $t_2 \approx 0{,}0217$: già per $u \ge 100$ la quadratura perde accuratezza ($1{,}40\times 10^{-4}$), e nel dominio reale dei grafici di [`SpecificHeatCurveView.tsx`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-specific-heat/SpecificHeatCurveView.tsx#L376-L382) (`tMinPlotK = 5 K`, `thetaDK` fino a `2500 K` nello stage `beyond-1953`) l'integrale oscilla passando da $-1{,}77\%$ a $(10\text{ K}, 2500\text{ K})$ a $+11{,}22\%$ per il Diamante $(5\text{ K}, 2230\text{ K})$ fino a **$+15{,}17\%$** a $(5\text{ K}, 2500\text{ K})$, alterando la pendenza apparente in scala log-log ($0{,}77$ invece di $1{,}00$ tra $5\text{ K}$ e $10\text{ K}$ a $\Theta_D = 2500\text{ K}$).
- **Come riprodurlo:** Eseguire `python crosscheck/fononi/specific_heat.py` (check `Calore specifico 1D`) oppure valutare `monatomic1DCvRatio(5, 2500)` (`0.00482426` vs esatto `0.00418886`) e `monatomic1DCvRatio(5, 2230)` (`0.00522298` vs esatto `0.00469605`).
- **Correzione suggerita (non applicata):** Suddividere $[0, \pi/4]$ in base alla scala $1/u$ quando $u > 8$, ad es. con i breakpoint `[0, min(π/4, 4/u), min(π/4, 16/u), min(π/4, 64/u), π/4, π/2]` su `gaussLegendre16` (al più 5 chiamate GL16, errore atteso $< 10^{-14}$ su tutto $u \in (0, \infty)$).

### Minore 1 — Cancellazione numerica in `monatomicDos1DDimless` vicino a $w \to 1^-$
- **File e riga:** [`src/renderer/src/physics/specificHeat.ts#L311`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/specificHeat.ts#L311).
- **Dettaglio:** `Math.sqrt(1 - w * w)` perde cifre significative quando $w \to 1^-$ (a $w = 0{,}99999$ l'errore relativo sale a $2{,}48 \times 10^{-12}$; dentro il dominio di plot $w \le 0{,}992$ resta $\le 5{,}90 \times 10^{-16}$). Scrivere `Math.sqrt((1 - w) * (1 + w))` elimina la cancellazione.

### Minore 2 — Troncamento a 10 cifre delle costanti CODATA condivise in `constants.ts`
- **File e righe:** [`src/renderer/src/physics/constants.ts#L32-L38`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/constants.ts#L32-L38) e [`#L53`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/constants.ts#L53).
- **Dettaglio:** `HBAR_J_S = 1.054571817e-34` (vs esatto $h/(2\pi) = 1{,}054571817646\dots\times 10^{-34}$) e `KB_EV_K = 8.617333262e-5` introducono uno scarto sistematico di $6{,}13\times 10^{-10}$ su $\omega_D, \nu_D, \hbar\omega_D$ e di $1{,}84\times 10^{-9}$ sulle densità di energia $\tilde{u}_{\text{ph}}, \tilde{u}_\gamma$ (trascurabile per scopi didattici).
