# Piano del Capitolo «Fononi» (Parte 6: Vibrazioni reticolari e fononi)

Documento di riferimento condiviso per tutte le chat di sviluppo del capitolo **Fononi** su Antigravity.  
**Fonte unica**: `materiale/parte6/dispensa.pdf` e `materiale/parte6/riferimento-formule.md`.  
**Vincoli di convivenza**: non modificare `progetto.md`, `CLAUDE.md`, `AGENTS.md`, `.claude/`, `incarichi/`, né le 6 sezioni esistenti di *Teoria delle bande*.

---

## Principi di progettazione
1. **Stile «lavagna animata»**: fondo scuro piatto (`#0f1114`), linee nette, nessuna ombra/bagliore decorativo, legende esterne (`ChartLegend`), nessun colore hex hardcoded fuori da `src/renderer/src/ui/theme.ts`.
2. **1 colore = 1 grandezza fisica**: stessa mappa cromatica tra formula viva (`\htmlData{q=...}`), slider, legenda e canvas.
3. **Continuità visiva 1 → 2 → 3**: progressione ininterrotta sui reticoli vibranti (*1 atomo 1D → 2 atomi 1D → 3D cristalli reali*), seguita da *Pacchetti d'onda* (con atomi discreti sotto l'inviluppo e caso $v_g < 0$ sul ramo ottico già conosciuto), *Modi quantizzati e Umklapp* (100% visiva) e *Calore specifico* (tappe storiche interattive).
4. **Schermate ariose e snelle**: al massimo 2 viste principali collegate, 3–4 slider, nessuno scorrimento da `1100×800` in su (a `800×700` può scorrere solo la colonna centrale).
5. **Animazioni controllate**: ogni animazione temporale ha Play/Pausa, velocità e reset fase (`PlaybackControls`), si congela in un'istantanea chiara con `prefers-reduced-motion`, e non lascia loop continui a riposo.
6. **Fonti discrete**: eventuali modelli calibrati sui dati della Tab. 1 della dispensa (o integrati da letteratura) sono dichiarati con una semplice nota discreta a fondo della scheda teoria (`.foot`).
7. **Scheda guida a lato (4 parti)**: in ogni sezione il pannello teoria a lato usa una struttura pedagogica snella (`L’idea`, `Come intervengono i parametri`, `Cosa provare`, tutti brevi e collegati via `\htmlData{q=...}`) seguita dal riquadro richiudibile `<details className="panel-details">` (*Dettagli formali*, chiuso di default) per le definizioni formali e gli errori tipici. Non usare sintassi Markdown (`**`, `*`) dentro `strings.ts` (`RichText` interpreta solo LaTeX `$...$`).

---

## Fase 0 — Infrastruttura multi-capitolo (Chat 2 — completata)

Obiettivo: preparare una sola volta le fondamenta comuni senza toccare le 6 sezioni di *Teoria delle bande*.

### 1. Costanti fisiche (`src/renderer/src/physics/constants.ts`)
Aggiungere nello stesso unico file le costanti SI/fononiche (CODATA 2018, coerenti con `HBAR_EV_S`):
* `HBAR_J_S = 1.054571817e-34` ($\hbar$ in $\text{J}\cdot\text{s}$)
* `KB_J_K = 1.380649e-23`, `KB_EV_K = 8.617333262e-5` ($k_B$)
* `AMU_KG = 1.6605390666e-27` ($1\text{ u}$ in kg)
* `NA_MOL = 6.02214076e23`, `R_GAS = NA_MOL * KB_J_K` ($\approx 8{,}31446\text{ J mol}^{-1}\text{K}^{-1}$)
* `C_LIGHT_M_S = 2.99792458e8`
* `THZ_TO_MEV = 4.135667696` ($1\text{ THz} \leftrightarrow 4{,}136\text{ meV}$)
* `RAD_S_TO_THZ = 1 / (2 * Math.PI * 1e12)`

### 2. Tabella unica dei colori (`src/renderer/src/ui/theme.ts`)
**Grandezze già presenti riutilizzate**: `a` (`#58c4dd`), `k` (`#f4d345`), `v` (`#5cd0b3` per $v_g, v_s$), `psi` (`#dc75cd` per $\Psi_n, |\Psi_n|^2$), `Ek` (`#aab1bb` per curve classiche / di riferimento).

**Nuove grandezze in `QUANTITIES`**:
| ID | Hex | Grandezza |
|---|---|---|
| `omega` | `#72d67c` | pulsazione $\omega(k)$ e ramo acustico $\omega_-$ |
| `omegaOpt` | `#f59e56` | ramo ottico $\omega_+$, gap fononico, temperatura di Einstein $\Theta_E$ |
| `C` | `#e8795e` | costante elastica $C$ e costanti di forza $\Phi$ |
| `M` | `#7aa2f7` | massa atomica $M$ (monatomica / atomo pesante) |
| `m` | `#e68ab8` | massa atomica leggera $m$ (catena biatomica) |
| `u` | `#c9e663` | spostamento atomico $u_n(t)$, pacchetto $\Psi$, rapporto $\alpha$ |
| `vp` | `#c49bff` | velocità di fase $v_p = \omega/k$ |
| `T` | `#ff6b6b` | temperatura $T$ e scala termica $k_B T$ |
| `Theta` | `#a07ef5` | temperatura e frequenza di Debye $\Theta_D$, $\omega_D$ |
| `CV` | `#45b7f7` | calore specifico $C_V$ e densità degli stati fononica $g(\omega)$ |

**Nuovi toni derivati in `DERIVED_TONES`**:
* `acousticTransverse` (`#a8e6ae`, da `omega`)
* `opticalTransverse` (`#f7c597`, da `omegaOpt`)
* `lightLine` (`#f9e28b`, da `k`)
* `vanHoveDos` (`#8cd4fa`, da `CV`)
* `activatedModes` (`#ff9999`, da `T`)

### 3. Multi-capitolo (`sections/registry.ts`, `strings.ts`, `home/`)
* Aggiungere in `SECTIONS` le 6 voci del capitolo `phonons` (con `component: null` finché la relativa sezione non viene implementata, così in sidebar compaiono ordinate e non selezionabili).
* Aggiungere il capitolo `'phonons'` in `CHAPTERS` e promuoverlo `status: 'active'` in `ALL_CHAPTERS` (rimuovendolo da `UPCOMING_CHAPTERS`, che resta con 3 capitoli).
* Generalizzare `ActiveChapterCard` affinché accetti le curve/anteprime tramite prop (senza dipendere solo da *Teoria delle bande*), e aggiornare `HomeScreen.tsx` per rendere cliccabile anche *Fononi* (gestendo correttamente il caso transitorio in cui nessuna sezione fononica ha ancora un componente montato, oppure attivando l'ingresso sulla prima sezione disponibile).

### 4. Nuovi componenti grafici riusabili (`src/renderer/src/viz/`)
* `DispersionPlot.tsx`: diagramma $\omega(k)$ su Canvas 2D (supporto 1D e cammini 3D, rami acustici/ottici, fasce gap ed evanescente, corda $v_p$ + tangente $v_g$, punti discreti Born–von Kármán, retta luce IR, click/drag + frecce tastiera, legenda esterna `ChartLegend`).
* `PlaybackControls.tsx`: barra compatta Play/Pausa, selettore velocità (`0,25×`, `0,5×`, `1×`, `2×`) e reset fase; rispetta `prefers-reduced-motion`.

---

## Scaletta delle 6 sezioni

### Sezione 1 — Catena monatomica e prima zona di Brillouin (`sections/phonon-monatomic/`, Chat 3 — completata)
* **Fonte**: Lezione 1 (§§1–5) + Lezione 3 (§13 Born–von Kármán).
* **Fisica** (`physics/phononDispersion.ts`): $\omega(k) = 2\sqrt{C/M}|\sin(ka/2)|$, $v_s = a\sqrt{C/M}$, $\omega_{\max} = 2\sqrt{C/M}$, $v_g(k) = a\sqrt{C/M}\cos(ka/2)\operatorname{sgn}(k)$, $v_p = \omega/k$, aliasing $k + G$, quantizzazione Born–von Kármán $k = 2\pi j/(Na)$.
* **Viste (2 principali)**: (1) Catena 1D animata (atomi $M$, molle $C$, frecce $u_n(t)$, inviluppo continuo; toggle *Aliasing $k+G$* e *Anello Born–von Kármán $N$*); (2) `DispersionPlot` con 1BZ + repliche periodiche attenuate, tangente $v_s|k|$, banda evanescente $\omega > \omega_{\max}$.
* **Parametri**: $a \in [2{,}0;\, 6{,}0]\text{ Å}$, $M \in [6;\, 210]\text{ u}$, $C \in [2;\, 100]\text{ N/m}$ (+ $N \in [4;\, 24]$ con Born–von Kármán attivo).
* **Strumenti**: *Aliasing ($k+G$)*, *Born–von Kármán ($N$)*, *Sonda $v_p, v_g$*.
* **Preset**: *Metallo tipico* (dispensa §3: $M = 63{,}2\text{ u} \approx 1{,}05\times 10^{-25}\text{ kg}$, $a = 2{,}50\text{ Å}$, $C = 20\text{ N/m}$ → $v_s \approx 3{,}5\text{ km/s}$, $\nu_{\max} \approx 4{,}4\text{ THz}$, $18\text{ meV}$), *Piombo 1D*, *Carbonio 1D*.

### Sezione 2 — Catena biatomica, gap fononico e luce infrarossa (`sections/phonon-diatomic/`, Chat 4 — completata)
* **Fonte**: Lezione 2 (§§7–8, §10.3) + Lezione 4 (§24).
* **Fisica** (`physics/phononDispersion.ts`): $\omega_{\mp}^2(k)$ (eq. 20), rapporto $\alpha = u_{n-1}/u_n$, $v_s = a\sqrt{C/2(m+M)}$, $\omega_+(0) = \sqrt{2C(m+M)/mM}$, bordi C ($\sqrt{2C/M}$) e B ($\sqrt{2C/m}$), gap $\Delta\omega_{\text{gap}}$, chiusura a $M = m$, matrice dinamica $2\times 2$ (§10.3), incrocio luce IR $\omega = ck/n$.
* **Viste (2 principali)**: (1) Catena biatomica animata ($M$ grande, $m$ piccola, molle $C$, marcatore $R_{\text{cm}}$, dipolo ionico, 4 pulsanti rapidi per i modi canonici Fig. 12); (2) `DispersionPlot` con rami acustico/ottico, fascia del gap, punti B e C, retta luce IR opzionale.
* **Parametri**: $a \in [3{,}0;\, 7{,}0]\text{ Å}$, $M, m \in [6;\, 210]\text{ u}$, $C \in [2;\, 80]\text{ N/m}$.
* **Strumenti**: *Luce infrarossa*, *Confronto $M = m$ (ripiegamento)*, *Matrice dinamica $2\times 2$*.
* **Preset**: *Coppia Na–Cl* (dispensa §8: $m = 23\text{ u}$, $M = 35{,}5\text{ u}$, $a = 5{,}64\text{ Å}$, $C = 10\text{ N/m}$ → $v_s \approx 4{,}1\text{ km/s}$, $2{,}9 / 3{,}6 / 4{,}7\text{ THz}$, gap $0{,}7\text{ THz}$), *Masse $M = 2m$ (Fig. 11)*, *Limite $M = m$*, *Contrasto forte (Li–I)*.

### Sezione 3 — Rami 3D, polarizzazioni e cristalli reali (`sections/phonon-3d/`, Chat 5 — completata)
* **Fonte**: Lezione 2 (§§9–10) + Lezione 3 (§14, Tab. 1, Figg. 17–18).
* **Fisica** (`physics/phonon3d.ts`): matrice dinamica hermitiana $3p\times 3p$ (riusa `physics/linalg.ts`), cammino $\Gamma\text{–}X\text{–}K\text{–}\Gamma\text{–}L$, modelli calibrati su Tab. 1 (Al: LA $40\text{ meV}$, TA $24\text{ meV}$ a X; Diamante: ottici degeneri a $\Gamma$ $160\text{ meV}$; PbTe: LO $3{,}3\text{ THz}$, TO $1{,}1\text{ THz}$ a $\Gamma$), conteggio 3D Born–von Kármán ($3pN_c$, $v_c = a^3/4$ per fcc).
* **Viste (2 principali)**: (1) Proiezione isometrica animata Canvas 2D della polarizzazione reale $\boldsymbol{\varepsilon}^s(\mathbf{k})$ (LA, $\text{TA}_1$, $\text{TA}_2$, LO, $\text{TO}_1$, $\text{TO}_2$) rispetto a $\mathbf{k}$; (2) `DispersionPlot` 3D con degenerazioni etichettate e unità commutabili meV / THz.
* **Parametri**: cristallo (*Alluminio* | *Diamante* | *PbTe*), rapporto $C_T/C_L$, splitting polare LO–TO (modalità libera).
* **Strumenti**: *Conteggio modi 3D ($3pN_c$ e 1BZ)*, *Unità meV / THz*.
* **Nota fonte**: discreta a fondo della scheda teoria (`.foot`).

### Sezione 4 — Pacchetti d'onda: velocità di fase e di gruppo (`sections/phonon-wavepacket/`, Chat 6 — completata)
* **Fonte**: Lezione 2 (§6, pp. 14–17, Figg. 7–9).
* **Fisica** (`physics/phononDispersion.ts`): $v_p = \omega/k$, $v_g = d\omega/dk$, $\omega''$, allargamento gaussiano $\sigma(t) = \sigma_0\sqrt{1 + (\omega'' t / 2\sigma_0^2)^2}$ sui 4 regimi (lineare, ramo acustico, ramo ottico $v_g < 0$, quadratico libero $v_g = 2v_p$).
* **Viste (2 principali + mini-pannello $\sigma(t)$)**: (1) Pacchetto $\Psi(x,t)$ animato con **atomi discreti della catena campionati sotto l'inviluppo** (nei regimi reticolari), cresta marcata a $v_p$, centro inviluppo a $v_g$; (2) Dispersione $\omega(k)$ con corda ($v_p$) e tangente ($v_g$) + curva $\sigma(t)/\sigma_0$.
* **Parametri**: regime (*Lineare* | *Ramo acustico* | *Ramo ottico $v_g<0$* | *Quadratico*), $k_0$, $\sigma_0$.
* **Strumenti**: *Riferimento comovente ($\xi = x - v_g t$)*, *Profilo iniziale $t=0$*.

### Revisione pedagogica schede guida — Sezioni 1–4 (Chat 7)
* **Obiettivo**: riscrivere i pannelli teoria laterali (`strings.ts` + `*Section.tsx`) di `phonon-monatomic`, `phonon-diatomic`, `phonon-3d` e `phonon-wavepacket` nella struttura accogliente in 4 parti (*L’idea*, *Come intervengono i parametri*, *Cosa provare* + `<details className="panel-details">` per *Dettagli formali*), senza toccare `physics/` né le viste grafiche/canvas.

### Sezione 5 — Modi quantizzati (fononi) e processi Umklapp (`sections/phonon-quantum/`, Chat 8)
* **Fonte**: Lezione 2 (§11) + Lezione 3 (§§15–18, Figg. 19–21).
* **Fisica** (`physics/phononQuantum.ts`): oscillatore classico $P_{\text{cl}}(x) = 1/\pi\sqrt{a^2-x^2}$ e quantistico $\Psi_n$ (ricorrenza stabile Hermite), $a_{\text{ho}} = \sqrt{\hbar/m\omega}$, tunneling $\operatorname{erfc}(1) \approx 0{,}1573$, Bose–Einstein $\bar{n}(T) = (e^{\hbar\omega/k_B T}-1)^{-1}$ ($\mu = 0$), cinematica Normali ($G=0$) vs Umklapp ($G\ne 0$).
* **Due modalità 100% visive**:
  * **Modalità A — Quantizzazione di un modo**: parabola $V(Q)$ con $P_n$ vs $P_{\text{cl}}$ (tunneling + corrispondenza di Bohr fino a $n = 25$) **sincronizzata con la catena vibrante del modo** (mostra visivamente l'ampiezza non nulla di punto zero a $n = 0$: $\Delta x \approx 1{,}7\%\,a$), con slider $n$ o accoppiamento termico a $T$ tramite Bose–Einstein.
  * **Modalità B — Collisioni nella 1BZ (Normali vs Umklapp)**: vettori $k_1, k_2$ trascinabili in 1BZ + curva $\omega(k)$ con frecce di $v_g(k_1), v_g(k_2), v_g(k_3)$; appena $|k_1+k_2| > \pi/a$ scatta $-G$ e $v_g(k_3)$ si inverte (esempio dispensa $0{,}7 + 0{,}6 \to -0{,}7\,\pi/a$).

### Sezione 6 — Calore specifico del reticolo: evoluzione storica e modello di Debye (`sections/phonon-specific-heat/`, Chat 9)
* **Fonte**: Lezione 4 (§§20–23, §25, Figg. 22–27, Tabb. 2–4).
* **Fisica** (`physics/specificHeat.ts`): Dulong–Petit $3R$, Einstein $3R\,\mathcal{E}(\Theta_E/T)$, integrale di Debye con quadratura Gauss–Legendre composta ad alta precisione, asintoto $T^3$ ($\frac{12\pi^4}{5}R(T/\Theta_D)^3$), DOS 1D con singolarità di Van Hove e DOS 3D di Debye + schema TA/LA, analogia corpo nero ($T^4$: 3 vs 2 polarizzazioni), dataset sperimentale Tab. 2 e Tab. 3.
* **Barra «Tappe storiche»**: **1819 Dulong–Petit** → **1907 Einstein** → **1912 Debye** → **1953 Oltre Debye (Van Hove & corpo nero)** → **Confronto completo**.
* **Viste (2 principali sincronizzate su $T$)**: (1) Grafico $C_V(T)$ commutabile **Lineare / Log-Log** ($C_V/3R$ o $\text{J K}^{-1}\text{mol}^{-1}$) con cursore mobile $T$ e dati sperimentali Tab. 2; (2) Spettro $g(\omega)$ riempito dal fattore di attivazione $\mathcal{E}(\hbar\omega/k_B T)$ con soglia $k_B T/\hbar$ mobile (più mini-schema sfera $k_D$ / raggio termico $k_T$ e toggle opzionale statistiche BE/FD/MB).
* **Parametri**: $T \in [5;\, 1500]\text{ K}$, $\Theta_D \in [30;\, 2500]\text{ K}$, $\Theta_E/\Theta_D \in [0{,}5;\, 1{,}0]$ (default $0{,}75$).
* **Preset (Tab. 2 e Tab. 3)**: Diamante ($2230\text{ K}$), Silicio ($645\text{ K}$), Ferro ($470\text{ K}$), Alluminio ($428\text{ K}$), Rame ($343\text{ K}$), Oro ($165\text{ K}$), Sodio ($158\text{ K}$), Piombo ($105\text{ K}$), Cesio ($38\text{ K}$).

---

## Verifica standard a chiusura di ogni chat
```powershell
$env:PATH = "$PWD\.tools\node;$env:PATH"
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```
* Tutti i 138 test di *Teoria delle bande* + tutti i nuovi test fononici verdi.
* Revisori in parallelo via `.agents/skills/`: `revisore-fisica`, `fedelta-corso`, `crosscheck-numerico`, `revisore-integrazione`, `critico-grafico`, `studente` (rapporti in `reviews/fononi/`, script indipendenti in `crosscheck/fononi/`).
