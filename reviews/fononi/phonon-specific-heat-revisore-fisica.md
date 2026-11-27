# Revisione di fisica — Sezione 6 `phonon-specific-heat` («Calore specifico e Debye»)

Revisore: `revisore-fisica`  
File esaminati:
- `src/renderer/src/physics/specificHeat.ts`
- `src/renderer/src/physics/specificHeat.test.ts`
- `src/renderer/src/physics/constants.ts`
- `src/renderer/src/sections/phonon-specific-heat/` (`manifest.ts`, `model.ts`, `formulas.ts`, `strings.ts`, `store.ts`, `PhononSpecificHeatSection.tsx`, `SpecificHeatCurveView.tsx`, `SpectrumDebyeView.tsx`, `phonon-specific-heat.css`)
- Riferimenti: `materiale/parte6/dispensa.pdf` (Lezione 4, §§20–23, §25, pp. 49–64, Figg. 22–27, Tabb. 2–4, eqq. 52–59 e 61–62), `materiale/parte6/riferimento-formule.md` (righe 64–93), `src/renderer/src/ui/theme.ts`.

---

## Problemi trovati

### Bloccante
Nessuno.

### Importante

1. **Errore numerico fino al 15,2% in `monatomic1DCvRatio` per $T \ll \Theta_{\max}$ agli estremi degli slider**
   - **File e riga**: `src/renderer/src/physics/specificHeat.ts:319-330` (usata in `src/renderer/src/sections/phonon-specific-heat/model.ts:96, 179` e testata solo fino a $u = 100$ in `src/renderer/src/physics/specificHeat.test.ts:187-189`).
   - **Cosa è sbagliato**: `monatomic1DCvRatio(temperatureK, thetaMaxK)` calcola
     $$\frac{C_V^{\mathrm{1D}}}{N k_B} = \frac{2}{\pi}\int_0^{\pi/2} \mathcal{E}(u\sin\theta)\,\mathrm{d}\theta, \qquad u = \frac{\Theta_{\max}}{T},$$
     con due soli pannelli di quadratura di Gauss–Legendre a 16 punti su $[0, \pi/4]$ e $[\pi/4, \pi/2]$. Quando $u$ è grande (bassa temperatura e/o alta $\Theta_D$, condizioni ammesse dagli slider $T \in [5, 1500]\text{ K}$ e $\Theta_D \in [30, 2500]\text{ K}$), l’integrando $\mathcal{E}(u\sin\theta)$ è significativamente non nullo soltanto nella regione $\theta \lesssim 10/u$, quindi quasi tutti i nodi cadono nella coda esponenzialmente nulla.
   - **Verifica numerica indipendente** (confronto con integrazione di Simpson adattiva ad alta risoluzione sulla regione attiva $[0, \min(\pi/2, 40/u)]$):
     - $T = 5\text{ K},\;\Theta_{\max} = 2500\text{ K}$ ($u = 500$): la funzione restituisce $4{,}8243\times 10^{-3}$ contro il valore esatto $4{,}1889\times 10^{-3}$ (errore relativo **$+15{,}17\%$**; anche il limite lineare asintotico $(2\pi/3)(T/\Theta_{\max})$ vale $4{,}1888\times 10^{-3}$).
     - Diamante a $T = 5\text{ K}$ ($\Theta_D = 2230\text{ K},\;u = 446$): la funzione restituisce $5{,}2230\times 10^{-3}$ contro $4{,}6960\times 10^{-3}$ (errore relativo **$+11{,}22\%$**).
     - Silicio a $T = 5\text{ K}$ ($\Theta_D = 645\text{ K},\;u = 129$): errore relativo $0{,}11\%$.
   - **Soluzione corretta e riferimento**: spezzare l’intervallo $[0, \pi/2]$ con punti di suddivisione adattivi attorno a $\theta \sim 1/u$ (o usare la sostituzione/breakpoint in $x = u\sin\theta$ in modo analogo a `DEBYE_BREAKPOINTS`), e aggiungere un test per $u = 500$ in `specificHeat.test.ts`.
   - **Come riprodurlo**: nella tappa «1953 Oltre Debye», selezionare il preset Diamante ($\Theta_D = 2230\text{ K}$) oppure portare $\Theta_D = 2500\text{ K}$, passare in scala Log–Log e leggere la curva «Catena 1D ($\propto T$)» vicino a $T = 5\text{ K}$ (o chiamare `monatomic1DCvRatio(5, 2500)`).

2. **Scala dell’asse Y incoerente con la curva del peso termico $\mathcal{E}(\hbar\omega/k_B T)$ in modalità Einstein (`SpectrumDebyeView.tsx`)**
   - **File e riga**: `src/renderer/src/sections/phonon-specific-heat/SpectrumDebyeView.tsx:156, 171, 211-222, 441-452` (e analogamente `260-273` per Dulong–Petit).
   - **Cosa è sbagliato**: nel grafico in basso a sinistra, quando è attiva la tappa «1907 Einstein» (`isEinstein === true`), l’asse verticale ha titolo `'Peso $E(ħω/k_B T)$'` (`SpectrumDebyeView.tsx:218`) e riporta i tick numerici `1`, `2`, `3` (`yMaxAxis = 3.25`, `yTicks = [1, 2, 3]`, righe 156, 171, 211–214). Tuttavia, la curva tratteggiata del peso termico $\mathcal{E}(\hbar\omega/k_B T)$ — il cui valore massimo a $\omega = 0$ è esattamente $1$ (dispensa §21.4, eq. 54) — viene disegnata con il fattore arbitrario `weightTop = 2.7` (`toPxY(sPt.einsteinWeight * weightTop)`, righe 441 e 451). Di conseguenza, lo studente legge sull’asse `'Peso E(ħω/k_B T)'` un’intercetta a $\omega = 0$ pari a **$2{,}7$** anziché **$1$**.
   - **Nota analoga per «1819 Dulong–Petit»**: in `isDP` (`SpectrumDebyeView.tsx:261-273`), la linea orizzontale etichettata `'peso classico = 1 (tutti i modi attivi)'` è tracciata a quota $y = 2{,}7$ davanti ai tick `1, 2, 3` dell’asse sinistro.
   - **Formula/rappresentazione corretta**: in modalità Einstein l’asse verticale dovrebbe coprire $[0, 1{,}1]$ con tick $0{,}5$ e $1$ (e `weightTop = 1`), oppure avere un asse secondario dedicato a destra per la scala $[0, 1]$ del peso $\mathcal{E}$ (utile anche in Dulong–Petit, Debye e Confronto completo).
   - **Come riprodurlo**: selezionare «1907 Einstein» e osservare il punto di partenza a $\omega = 0$ della curva tratteggiata rispetto ai tick `1, 2, 3` dell’asse verticale sinistro.

### Minore

1. **Rappresentazione della sfera di Debye (`k` space) nella tappa Einstein e assenza di asse secondario per $\mathcal{E}$**
   - **File e riga**: `src/renderer/src/sections/phonon-specific-heat/SpectrumDebyeView.tsx:631-657` (`isEinstein`) e `440-456` (`debye` / `comparison`).
   - **Dettaglio**: in `isEinstein`, il riquadro destro intitolato `'Sfera di Debye (spazio k)'` disegna una circonferenza di raggio $r_E = r_D\,(\Theta_E/\Theta_D)$ nello spazio $\mathbf{k}$ etichettata $\omega_E$. Nel modello di Einstein i $3N$ oscillatori sono locali e indipendenti, tutti a frequenza $\omega_E$, senza relazione di dispersione $\omega = v_s k$ né selezione di un guscio $|k| = k_E$ nello spazio reciproco (dispensa §21.1, Tab. 4 p. 63). Anche se il sottotitolo chiarisce `'Singola frequenza ω_E'`, è opportuno tenere presente questa semplificazione metaforica rispetto allo schema a scale di livelli di Fig. 23 della dispensa. In `debye` e `comparison`, la curva peso $\mathcal{E} \in [0, 1]$ è scalata a $[0, 2{,}7]$ sullo stesso asse $g(\omega) \in [0, 3]$ senza una tacca `1` a destra.

2. **Dettagli notazionali e grafici in «1953 Oltre Debye» (`beyond-1953`)**
   - **File e riga**: `src/renderer/src/sections/phonon-specific-heat/SpectrumDebyeView.tsx:199, 223, 538, 562-574`, `src/renderer/src/sections/phonon-specific-heat/manifest.ts:111-113`, `src/renderer/src/sections/phonon-specific-heat/model.ts:114-116`.
   - **Dettaglio**:
     - L’asse orizzontale della DOS (`SpectrumDebyeView.tsx:223`) mostra `'ω / ω_D'` anche in `beyond-1953`, dove il bordo $w = 1$ è etichettato `'ω_{max}'` (riga 199) e la catena 1D è confrontata assumendo implicitamente $\omega_{\max} = \omega_D$ ($\Theta_{\max} = \Theta_D$ in `model.ts:96, 179`).
     - Con `vanHoveMaxW = 0.992` (`manifest.ts:111`), `monatomicDos1DDimless(0.992)` vale $\approx 5{,}043$, inferiore a `dos1DClipMax = 6.2` e a `yMaxAxis = 6.4`: negli ultimi punti ($w \in [0{,}992, 1]$) la curva si appiattisce a $\approx 5{,}04$ prima del bordo superiore del grafico, riducendo l’effetto visivo della divergenza a $\omega_{\max}$.
     - Nel pannello corpo nero (`SpectrumDebyeView.tsx:562`), la densità di energia fononica usa il simbolo `$u_{ph}$` anziché `\tilde{u}_{\mathrm{ph}}` presente in `formulas.ts:33, 59` e `strings.ts:236` (dispensa eq. 62, p. 62), e la barra `'Fotoni: 2 pol. trasv.'` non esplicita accanto alle barre la condizione `'a parità di velocità'` ($v_s = c$), pur corretta nella formula viva e nella riga `'Rapporto pol.: 3/2 = 1,5'`. Inoltre, per $T > \Theta_D/10$, `$u_{ph}$` resta il valore asintotico $T^4$ accompagnato però dall’avviso `'Taglio ω_D attivo (T > Θ_D/10)'`.

3. **Coerenza minore tra testo, valori laterali e commenti nei test**
   - **File e riga**: `src/renderer/src/sections/phonon-specific-heat/strings.ts:107-108, 242`, `src/renderer/src/physics/specificHeat.test.ts:185`.
   - **Dettaglio**:
     - `strings.ts:242` cita `Figg. 22–27`: le tre funzioni di occupazione di Fig. 22 (`fermiDiracOccupancy`, `maxwellBoltzmannOccupancy`, `boseEinsteinOccupancy`) sono implementate e testate in `specificHeat.ts` / `specificHeat.test.ts`, ma il grafico delle tre statistiche non compare nella sezione.
     - `strings.ts:107-108` definisce `chain1D` e `blackBody` in `s.values`, non visualizzati in `SpecificHeatValues` (`PhononSpecificHeatSection.tsx`).
     - In `specificHeat.test.ts:185` resta un `?` nel commento (`= (2π/3)(T/Θ)?`), ma il calcolo alla riga 188 è esatto ($\int_0^\infty \mathcal{E}(x)\,\mathrm{d}x = \pi^2/3 \implies \frac{2}{\pi}\cdot\frac{\pi^2}{3} = \frac{2\pi}{3}$).

---

## Cosa ho verificato davvero

1. **Esecuzione della suite completa di test e typecheck**:
   - `$env:PATH = "$PWD\.tools\node;$env:PATH"; npm.cmd test` → **24 file di test passati (24), 216 test passati (216)**; in particolare `src/renderer/src/physics/specificHeat.test.ts` ha superato **5/5 test** in 11 ms.
   - `$env:PATH = "$PWD\.tools\node;$env:PATH"; npm.cmd run typecheck` → **exit code 0** (`tsconfig.node.json` e `tsconfig.web.json`).
2. **Verifica algebrica riga per riga contro `materiale/parte6/dispensa.pdf` (pp. 49–64) e `riferimento-formule.md`**:
   - **Costanti (`constants.ts`)**: $N_A = 6{,}02214076\times 10^{23}\text{ mol}^{-1}$, $k_B = 1{,}380649\times 10^{-23}\text{ J K}^{-1}$, $R = N_A k_B = 8{,}31446262\text{ J mol}^{-1}\text{K}^{-1}$, $3R = 24{,}94338785\text{ J mol}^{-1}\text{K}^{-1}$ (eq. 52: $\approx 24{,}9$).
   - **Modello di Einstein (`specificHeat.ts:96-135`)**: $\mathcal{E}(x) = x^2 e^x / (e^x - 1)^2$ riscritta senza overflow con `e^(-x)` ed `expm1(-x)`; sviluppo di Taylor per $x < 10^{-4}$ verificato ($1 - x^2/12 + x^4/240$); asintoti alta $T$ ($3R[1 - \tfrac{1}{12}(\Theta_E/T)^2]$) e bassa $T$ (eq. 55, $3R(\Theta_E/T)^2 e^{-\Theta_E/T}$) corretti.
   - **Modello di Debye (`specificHeat.ts:142-231`)**: sviluppi di Taylor per $u < 10^{-3}$ verificati ($D_3(u) = 1 - u^2/20 + u^4/560 - u^6/18144$ e $\Phi_D(u) = 1 - \tfrac{3}{8}u + u^2/20 - u^4/1680$); asintoti alta $T$ ($3R[1 - \tfrac{1}{20}(\Theta_D/T)^2]$) e bassa $T$ (eq. 59, $\frac{12\pi^4}{5}R(T/\Theta_D)^3$, prefattore $233{,}7798$) corretti; inclusione corretta del fattore $3$ in $3\int_0^{\omega_D} g(\omega)\,\mathrm{d}\omega = 3N$ (eq. 56–57) e $\mu = 0$ in Bose–Einstein (`boseEinsteinOccupancy`).
   - **Formule vive e testi (`formulas.ts`, `strings.ts`, `theme.ts`)**: verificate tutte le equazioni (52–59, 61–62), gli sviluppi, la coerenza di `QuantityId` con `src/renderer/src/ui/theme.ts` (`CV`, `T`, `Theta`, `omegaOpt`, `Ek`, `omega`, `v`, `k`), e la copertura di tutti gli «errori tipici» di §26 (p. 63).
   - **Dataset sperimentale e tabellare (`MATERIAL_PRESETS`)**: verificata la coincidenza esatta di tutti i 9 preset (Cu, Al, Si, C, Fe, Au, Na, Pb, Cs) con le Tabb. 2–3 (pp. 51, 58) e §22.7 (diamante a 77 K, p. 57).
3. **Calcoli numerici indipendenti in Python**:
   - **Nodi e pesi GL16 (`specificHeat.ts:25-45`)**: confrontati con le radici esatte di $P_{16}(x)$ tramite metodo di Newton; errore massimo sui nodi $5{,}55\times 10^{-17}$, sui pesi $1{,}18\times 10^{-16}$, somma dei semi-pesi $= 1{,}0000000000000000$.
   - **Quadratura di Debye (`debyeIntegralD3`, `debyeEnergyIntegral`)**: confrontate su $u \in [10^{-4}, 500]$ con integrazione di Simpson indipendente a 8000 passi; errore relativo $\le 1{,}8\times 10^{-14}$ per $D_3(u)$ e $\le 2{,}6\times 10^{-11}$ per $\Phi_D(u)$.
   - **Tabella 2 e §22.7**: riprodotti esattamente Cu ($10{,}929$ / $23{,}080$), Al ($7{,}665$ / $22{,}128$), Au ($20{,}038$ / $24{,}494$), Pb ($22{,}770$ / $24{,}760$), Fe ($6{,}401$ / $21{,}605$), Na ($20{,}390$ / $24{,}531$), Si ($3{,}063$ / $19{,}164$) e Diamante a 77 K ($0{,}08002\text{ J mol}^{-1}\text{K}^{-1}$), nonché $\omega_D(\text{Cu}) = 4{,}4906\times 10^{13}\text{ rad s}^{-1}$.
   - **Confronto Einstein vs Debye (§21.5 e §22.7)**: a $T = \Theta_D/10$ con $\Theta_E = \Theta_D$, Einstein $= 4{,}5404\times 10^{-3}$, Debye $= 7{,}5821\times 10^{-2}$, rapporto $= 16{,}699$, sovrastima $T^3 = +2{,}78\%$ ($\approx 3\%$); a $T = \Theta_D/20$, rapporto $= 11\,814{,}7$ ($\sim 10^4$).
   - **Analogia corpo nero (eq. 62)**: verificato il rapporto strutturale $\tilde{u}_{\mathrm{ph}}(T, c) / \tilde{u}_\gamma(T) = 1{,}500000000000000$.
   - **Quadratura 1D (`monatomic1DCvRatio`)**: individuata la discrepanza del $+15{,}17\%$ a $(5\text{ K}, 2500\text{ K})$ e $+11{,}22\%$ a $(5\text{ K}, 2230\text{ K})$.

---

## Cosa non ho potuto verificare

- Rendering visivo interattivo nel browser / Electron (`npm run dev:web`, `npm run build`).

---

## Verdetto finale

**Da correggere** — Il nucleo di Einstein e Debye (`debyeIntegralD3`, `debyeEnergyIntegral`, `einsteinFunction`, dati di Tab. 2–3, formule vive e corpo nero) è fisicamente rigoroso e numericamente accurato, ma vanno corretti:
1. la quadratura di `monatomic1DCvRatio` (`src/renderer/src/physics/specificHeat.ts:319-330`) che commette un errore fino al $+15{,}2\%$ a bassa $T$ / alta $\Theta_D$;
2. la scala dell’asse verticale del grafico in modalità `1907 Einstein` (`src/renderer/src/sections/phonon-specific-heat/SpectrumDebyeView.tsx:156, 171, 218, 441-452`), dove la curva di $\mathcal{E}(\hbar\omega/k_B T) \le 1$ è disegnata a quota $2{,}7$ su un asse etichettato `'Peso E(ħω/k_B T)'` con tick `1, 2, 3`.
