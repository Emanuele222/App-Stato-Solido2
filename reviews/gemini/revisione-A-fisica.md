# Revisione A — Fisica (`physics/` e `sections/`)

- **Ruolo**: Revisore A (fisica), sola lettura su `src/` e `materiale/`
- **Ambito**: `emptyLattice.ts`, `kronigPenney.ts`, `tightBinding.ts`, `kDotP.ts`, `pseudopotential.ts`, `linalg.ts` (ramo hermitiano complesso), strumenti comuni (`filling.ts`, `semiclassical.ts`, `gaps1d.ts`), e formule/valori nelle sei cartelle di `src/renderer/src/sections/`. (Escluso il controllo indipendente su `nearlyFree.ts`, salvo il punto 8 sulle formule in `sections/nearly-free/` e i punti comuni 5–6.)
- **Fonti**: `materiale/parte3/dispensa.tex`, `materiale/parte4/dispensa.tex`, `progetto.md` («Notazione» e «Verifica»).

---

## Verdetto complessivo e per modulo

| Modulo / Sezione | Verdetto | Note sintetiche |
|---|---|---|
| `physics/emptyLattice.ts` + `sections/empty-lattice/` | **approvata** | Formule, segni, energie di incrocio ($E_0, 4E_0, 9E_0$) e test conformi; nessuna formula fisica residua nell'UI. |
| `physics/kronigPenney.ts` + `sections/kronig-penney/` | **da correggere** (solo UI ai flessi / copertura test) | Nucleo fisico $L(E)$, continuità in $E = V_0$, bande strette, normalizzazione $|\psi|^2$ e limite a $\delta$ corretti; la UI (`KronigPenneySection.tsx:495,505,512`) non filtra $m^*$ enormi da rumore FD nei flessi. |
| `physics/tightBinding.ts` + `sections/tight-binding/` | **approvata** | Segno $t_p < 0$, $\cos(ka/2)$, autovettori $b_A, \tilde b_B$, curve reali e derivazioni corrette. Il malfunzionamento sulle bande $s,p$ invertite dipende da `filling.ts`. |
| `physics/kDotP.ts` + `sections/k-dot-p/` | **da correggere** | Doppia convenzione sul termine libero delle valenze fedele alla dispensa; ma formule inline rimaste in `KDotPSection.tsx:371,384` e `k-dot-p/model.ts:238`, mancata guardia ai flessi e lacune nei test di `kaneMassBreakdown` / `twoBandMassBreakdown`. |
| `physics/pseudopotential.ts` + `sections/pseudopotential/` | **da correggere** | Accordo $< 10^{-3}\text{ eV}$ con `epm_bande.npz`, fattore di struttura e $113$ onde piane esatti; problemi su $\mu$ a gap $\le 0$ e formule inline in `pseudopotential/model.ts:432,442-444,453-457` e `PseudopotentialSection.tsx:351-352`, più divergenza qualitativa dell'anteprima a `51` onde piane. |
| `physics/linalg.ts` (hermitiano complesso) | **approvata** | Accuratezza $\sim 10^{-14}$ anche su blocchi degeneri; commento d'intestazione obsoleto alle righe `7-10`. |
| Strumenti comuni (`filling.ts`, `semiclassical.ts`, `gaps1d.ts`) | **da correggere** | `gaps1d.ts` **approvata**; `filling.ts` fallisce su bande invertite separate; `semiclassical.ts` espone rumore numerico ai flessi senza soglia condivisa con l'UI. |

**Verdetto complessivo**: **da correggere**. Non emergono errori bloccanti sulle equazioni fondamentali implementate in `physics/`, ma risultano **5 problemi importanti** e **3 problemi minori** che possono mostrare allo studente una classificazione metallo/isolante errata, un potenziale chimico sbagliato in regime metallico, valori spuri di $m^*/m_0 \sim 10^8\text{–}10^{10}$ ai punti di flesso, un'anteprima EPM con gap qualitativamente diverso durante il trascinamento, oltre a formule fisiche lasciate dentro `sections/`.

---

## Problemi riscontrati (in ordine di gravità)

### 1. [Importante] `filling.ts`: bande separate ma invertite classificate come «metallo»
- **Dove**: `src/renderer/src/physics/filling.ts:57-65`
- **Cosa è sbagliato**: Per $N$ pari, `fillBands` confronta direttamente il massimo della banda d'indice `N / 2 - 1` con il minimo della banda `N / 2`:
  ```ts
  if (N % 2 === 0) {
    const top = max(bands.energies[N / 2 - 1])
    const bottom = min(bands.energies[N / 2])
    if (bottom - top > tol) { ... }
  ```
  Questo presuppone che la banda di indice `k` stia sempre interamente sotto la banda `k + 1`. Non ordina né verifica se esista comunque un intervallo di energia vuoto con $N/2$ bande interamente sotto e le restanti sopra.
- **Perché è sbagliato**: Nella sezione «Legami forti» (variante monoatomica), gli slider consentono $\bar{E}_s \in [-12, -2]\text{ eV}$ e $\bar{E}_p \in [-6, +4]\text{ eV}$ (`src/renderer/src/sections/tight-binding/manifest.ts:29-30`). Quando la banda $s$ (`energies[0]`) viene portata sopra la banda $p$ (`energies[1]`) mantenendo un gap assoluto positivo, la banda inferiore in energia è `energies[1]` (piena al 100%) e quella superiore è `energies[0]` (vuota), perciò il cristallo a $N=2$ è un **isolante** con gap finito; `fillBands` invece restituisce `kind: 'metal'` e `gap: null`.
- **Come riprodurlo**: Con `tightBindingMonoatomicBands({ a: 3.5, centerS: -2, centerP: -6, tS: 0.4, absTP: 0.4 }, zonePath1D(3.5, 201))` e `fillBands(bands, 2)`:
  - Banda $p$ (`energies[1]`): intervallo $[-6{,}8;\,-5{,}2]\text{ eV}$; banda $s$ (`energies[0]`): $[-2{,}8;\,-1{,}2]\text{ eV}$; gap reale $= 2{,}4\text{ eV}$.
  - Risultato osservato via `crosscheck/revisione-A-verifica.mjs`: `kind=metal, gap=null, Ef=-4.000000, ho=-5.200000, lu=-2.800000, occ=0.000,1.000`.

### 2. [Importante] `pseudopotential/model.ts`: potenziale chimico errato quando il gap EPM si chiude ($\text{gap} \le 0$) + calcolo inline fuori da `physics/`
- **Dove**: `src/renderer/src/sections/pseudopotential/model.ts:453-457`
- **Cosa è sbagliato**:
  ```ts
  const chemicalPotential = tools.fill
    ? activeSummary.gap > 0
      ? 0.5 * (activeSummary.vbmEnergy + activeSummary.cbmEnergy)
      : activeSummary.vbmEnergy
    : null
  ```
- **Perché è sbagliato**:
  1. Quando il gap indiretto/diretto diventa negativo (sovrapposizione metallica tra la banda 3 di valenza e la banda 4 di conduzione, per esempio riducendo $|V_3^s|$ fino al limite di reticolo vuoto $V_{\text{ps}}=0$ o impostando `v3s = -0.10, v8s = 0, v11s = 0.02` dove `gap = -3.689 eV`), la banda 4 scende ben al di sotto di `vbmEnergy = 0 eV`. Fissare $\mu = \text{vbmEnergy} = 0\text{ eV}$ non conserva il numero di elettroni (8 per cella primitiva = 4 bande piene in media): per $V_{\text{ps}}=0$ il livello di Fermi reale della densità di stati sta più in basso del massimo della banda 3 in $\Gamma$, non a $0\text{ eV}$ fisso. In queste condizioni occorrerebbe usare `fillBands(activeBands, 8)` (con pesi/campionamento appropriati o almeno segnalando che è una stima approssimata sul cammino $L\text{–}\Gamma\text{–}X\text{–}U,K\text{–}\Gamma$), anziché incollare `0 eV`.
  2. La formula di $\mu$ sta dentro `sections/pseudopotential/model.ts` invece che in `physics/`.
- **Come riprodurlo**: Attivare il tool «Riempimento» in EPM e portare $V_3^s$ verso $0$ (es. `a=5.43, v3s=-0.10, v8s=0, v11s=0.02`: `ecX = -3.656 eV`, `ecL = -1.684 eV`, `vbmEnergy = 0`, ma la linea mostrata resta a `0.00 eV`).

### 3. [Importante] Massa efficace ai punti di flesso: rumore delle differenze finite e visualizzazione di $m^*/m_0 \sim \pm 10^7\text{–}10^{10}$ al posto di $\infty$
- **Dove**:
  - `src/renderer/src/physics/semiclassical.ts:22-25,49-51` (`bandCurvature`, `effectiveMassRatio`, `h = 1e-4` Å⁻¹ di default)
  - `src/renderer/src/ui/format.ts:39-45` (`formatSignificant` con `useGrouping: false`)
  - Mancata soglia di divergenza in: `src/renderer/src/sections/kronig-penney/KronigPenneySection.tsx:495,505,512`, `src/renderer/src/sections/pseudopotential/PseudopotentialSection.tsx:407`, `src/renderer/src/sections/pseudopotential/EpmBandPlot.tsx:291`, `src/renderer/src/sections/k-dot-p/KDotPSection.tsx:402,405`, `src/renderer/src/sections/k-dot-p/MassContributionsBar.tsx:77`, `src/renderer/src/sections/nearly-free/NearlyFreeSection.tsx:363-369`. (Solo `TightBindingSection.tsx:506` controlla `Math.abs(model.probe.massRatio) < 1e4`.)
- **Cosa è sbagliato**: Nei punti di flesso di una banda ($d^2E/dk^2 = 0$, $m^* \to \pm\infty$), la differenza seconda centrata $(E(k+h) - 2E(k) + E(k-h))/h^2$ risente della cancellazione catastrofica in doppia precisione e/o della griglia discreta del cursore, producendo curvature residue $\sim \pm 10^{-10}\text{–}10^{-6}\text{ eV}\cdot\text{\AA}^2$ invece di `0` esatto. Le UI che controllano solo `Number.isFinite(...)` stampano numeri privi di significato fisico come `34317249017` invece di `∞`.
- **Confronto quantitativo verificato** (`crosscheck/revisione-A-extra.mjs`, bisezione sul flesso):
  - **Kronig–Penney** (`delta`, $a=4, P=4$, banda 0, $h \approx 2\times 10^{-3}$): `curv = 2.220e-10`, `m*/m0 = 34317249016.58` $\to$ `formatSignificant` restituisce una stringa di 11 cifre.
  - **Quasi liberi** ($a=3, V_G=-0{,}5$, banda 0): `curv = -6.350e-6`, `m*/m0 = -1199903.81`.
  - **k·p 2 bande** ($E_g=0{,}4, E_P=15$, banda `lh`, flesso a $k \approx 0{,}084508\text{ \AA}^{-1}$): `effectiveMassRatio` numerico dà `curv = -2.220e-8`, `m*/m0 = -343172490.17` (**segno opposto**), mentre l'espressione analitica `twoBandMassBreakdown` dà `+882595.13`.
  - Inoltre `NearlyFreeSection.tsx:363` ha un controllo anomalo `Math.abs(model.probe.massRatio) < 1e-3 ? v.massZero` (zero invece di infinito; nessuna banda liscia ha $m^*=0$ salvo cuspidi/incroci) e nessun taglio superiore.

### 4. [Importante] Formule fisiche lasciate in `src/renderer/src/sections/` fuori da `physics/`
- **Dove**:
  1. `src/renderer/src/sections/k-dot-p/KDotPSection.tsx:371,384`:
     - L371: `1 / (1 + model.params.ep / model.params.eg)`
     - L384: `1 / (1 - model.params.ep / model.params.eg)`
     Ricalcolano $m^*_c(0)/m_0$ e $m^*_{lh}(0)/m_0$ inline nel JSX anziché riusare `twoBandMassBreakdown(model.params, 'c' | 'lh', 0).effectiveMassRatio` di `physics/kDotP.ts`.
  2. `src/renderer/src/sections/k-dot-p/model.ts:238`: `fermiLevel: tools.fill ? 0.5 * params.eg : null` (e fallback di animazione `0.5 * model.params.eg` in `KpBandPlot.tsx:41`).
  3. `src/renderer/src/sections/pseudopotential/model.ts:432,442-444,453-457`: rapporto stimato k·p $E_g(\Gamma)/E_P$ (L432), conversione `RYDBERG_EV` su valori hardcoded del Si (L442–444), potenziale chimico a metà gap / `vbmEnergy` (L453–457).
  4. `src/renderer/src/sections/pseudopotential/PseudopotentialSection.tsx:351-352`: conversione `formFactors.v* * RYDBERG_EV` inline nel JSX.
  5. `src/renderer/src/sections/nearly-free/model.ts:91`: `const zoneEdge = Math.PI / a` anziché `zoneEdge1D(a)`.
  6. `src/renderer/src/sections/nearly-free/NearlyFreeSection.tsx:261,301,308,310,317`: formule perturbative di gap $2|V_G|$, $2|V_{2G}|$ e rapporto $|V_G|/E_0$ calcolate inline nel componente React invece di helper in `physics/`.
  *(Nota separata: la legge indicativa $t(a) = t(a_0)e^{-(a-a_0)/\lambda}$ in `tight-binding/manifest.ts:61-64` passa già a `monoatomicEdgesVsDistance` di `physics/tightBinding.ts`, e le espressioni `E + slope*dk + 0.5*curvature*dk*dk` nei canvas plot rappresentano solo il disegno geometrico della parabola osculatrice dai valori già restituiti da `semiclassical.ts`.)*

### 5. [Importante] `pseudopotential.ts` / `sections/pseudopotential/`: anteprima ridotta durante il trascinamento (`51` onde piane, `10 pt/seg`) può cambiare la posizione del CBM e persino ribaltare il tipo di gap (`diretto` $\leftrightarrow$ `indiretto`)
- **Dove**: `src/renderer/src/sections/pseudopotential/manifest.ts` / `model.ts` (parametri `FAST` con `gMaxSq: 11` $\to 51$ onde piane, `pointsPerSegment: 10` rispetto ai definitivi `113` onde piane, `40 pt/seg`).
- **Cosa succede**:
  - Nel preset **Si** ($a=5{,}43$, $V_3^s=-0{,}21$, $V_8^s=+0{,}04$, $V_{11}^s=+0{,}08\text{ Ry}$): con `113` PW e `40 pt/seg` il gap è `0.824 eV` con minimo di conduzione lungo **$\Gamma X$ alla frazione `0.85`** (e `ecX = 0.950 eV`), mentre con `51` PW e `10 pt/seg` l'errore sul gap è $+0{,}104\text{ eV}$ (`gap = 0.927 eV`) e il minimo viene mostrato esattamente in **$X$ (`1.00`)** anziché all'85% di $\Gamma X$.
  - Esistono parametri **interni agli intervalli degli slider** dove il calcolo ridotto mostra allo studente un gap **diretto in $\Gamma$**, mentre al rilascio dello slider (`113` PW) la banda convergente è a gap **indiretto in $L$**.
- **Come riprodurlo**: Impostare negli slider $a = 5{,}65\text{ \AA}$, $V_3^s = -0{,}270\text{ Ry}$, $V_8^s = +0{,}042\text{ Ry}$, $V_{11}^s = +0{,}035\text{ Ry}$ (tutti dentro `PARAMS` di `pseudopotential/manifest.ts:30-33`):
  - `51 PW, 10 pt/seg` (durante drag): `isDirect: true`, `cbmDescription: 'Γ'`, `gap: 1.105 eV` ($E_c(\Gamma)=1{,}105$, $E_c(L)=1{,}170\text{ eV}$).
  - `113 PW, 40 pt/seg` (al rilascio): `isDirect: false`, `cbmDescription: 'L'`, `gap: 1.076 eV` ($E_c(L)=1{,}076$, $E_c(\Gamma)=1{,}112\text{ eV}$).

### 6. [Minore] Copertura test incompleta o tolleranze larghe su alcune funzioni di `physics/`
- **Dove**:
  - `src/renderer/src/physics/kDotP.test.ts:54-65,124-144`: `kaneMassBreakdown` è testata direttamente solo su `'c'` e `'hh'` (mancano test diretti sui rami `'lh'` e `'so'`); `twoBandMassBreakdown` è testata direttamente solo su `'c'` (mancano `'lh'` e `'hh'`).
  - `src/renderer/src/physics/kronigPenney.test.ts`: mancano test dedicati per `kronigEffectiveP`, `kronigBarrierStrength` e `kronigPenneyDeltaL` / `kronigPenneyRectangularL` esattamente al punto $E = V_0 \pm \varepsilon$ (la continuità attraverso $V_0$ viene esercitata solo indirettamente); il test di normalizzazione di `kronigPenneyDensity1D` usa `toBeCloseTo(1, 2)` (tolleranza $\pm 0{,}005$, larga rispetto all'accuratezza reale $\sim 10^{-5}$ con 240 sottointervalli).
  - `src/renderer/src/physics/pseudopotential.test.ts:242-245`: la massa del GaAs in $\Gamma$ viene controllata solo con `0.05 < m* < 0.2` invece di un valore stretto rispetto al calcolo convergente (`0.09884` con $h=1{,}5\times 10^{-3}\text{ \AA}^{-1}$) o al confronto con `analyzeEpmBands`.
  - `src/renderer/src/physics/filling.test.ts` e `semiclassical.test.ts`: assenza di test per bande invertite separate e per punti di flesso / quasi-incroci.

### 7. [Minore] `linalg.ts`: docstring introduttiva obsoleta
- **Dove**: `src/renderer/src/physics/linalg.ts:7-10`
- **Cosa è sbagliato**: Il commento d'intestazione dichiara ancora: *«Oggi è implementato solo il caso reale simmetrico [...] il caso hermitiano complesso (servirà per il GaAs con fattori antisimmetrici) si aggiunge dentro `eigh` senza toccare i chiamanti.»* In realtà il ramo `complex-hermitian` (riduzione unitaria di Householder + QL implicito) è già completamente implementato ed esportato da `eigh`.

### 8. [Minore] `epmSegmentDirection` ai vertici adiacenti (es. $\Gamma$ a indice 40 vs 200) e punto di sella del Si in $\Gamma$
- **Dove**: `src/renderer/src/physics/pseudopotential.ts:408-421`
- **Cosa succede**: A un vertice del cammino, `epmSegmentDirection` sceglie la direzione del segmento uscente se `i < N - 1`, altrimenti quella entrante. Così in $\Gamma$ al termine di $L\text{–}\Gamma$ (`idx = 40`, inizio di $\Gamma\text{–}X$) si deriva lungo $[1,0,0]$, mentre in $\Gamma$ al termine di $K\text{–}\Gamma$ (`idx = 200`) si deriva lungo $[-1,-1,0]/\sqrt{2}$. Poiché in $\Gamma$ le bande di valenza $1,2,3$ sono triplamente degeneri (e il sorting per energia ai lati $\pm h$ separa i rami pesanti/leggeri lungo la direzione scelta), le masse direzionali cambiano drasticamente tra i due vertici $\Gamma$: nel GaAs `idx = 40` dà $[-0{,}1044, -0{,}6227, -0{,}6227]$ mentre `idx = 200` dà $[-0{,}0915, -0{,}6227, -3{,}8906]$; e nel Si la banda 4 (`ecGamma`) ha massa direzionale $-0{,}282\,m_0$ lungo $[1,0,0]$ e $+2{,}702\,m_0$ lungo $[1,1,0]$ (punto di sella in $\Gamma$). Fisicamente è coerente con il nome «massa direzionale lungo il tratto», ma l'UI può sorprendere lo studente passando da un vertice $\Gamma$ all'altro sullo stesso diagramma.

---

## Risposte esplicite agli 8 punti dell'incarico

### 1. Kronig–Penney (`physics/kronigPenney.ts` e `sections/kronig-penney/`)
- **Continuità di $L(E)$ attraverso $E = V_0$**: Corretta e liscia ($C^\infty$). Per $E < V_0$ `kronigPenneyRectangularL` usa $\kappa = \sqrt{(V_0 - E)/(\hbar^2/2m_0)}$ con $\cosh(\kappa c)$ e $\sinh(\kappa c)/\kappa$; per $E > V_0$ usa $\beta = \sqrt{(E - V_0)/(\hbar^2/2m_0)}$ con $\cos(\beta c)$ e $\sin(\beta c)/\beta$; per $|\kappa^2| c^2 < 10^{-10}$ espande il limite esatto in serie ($1 + \frac{1}{6}(\beta^2 \text{ o } \dots)$). Verificato numericamente a cavallo di $E = V_0 = 4\text{ eV}$ da $V_0 - 10^{-5}$ a $V_0 + 10^{-5}$: $L(E)$ varia con continuità attorno a `0.82194392308...` senza discontinuità né `NaN`.
- **Ricerca dei bordi con bande strettissime**: Sweep sistematico su una griglia di 125 combinazioni estreme di `RECT_PARAMS` ($b \in [1{,}5; 6]$, $c \in [0{,}15; 2{,}5]$, $v_0 \in [0{,}1; 20]\text{ eV}$): `0` fallimenti nel rilevamento di $n_{\text{bands}} = 3$, inclusa rilevazione di bande profonde fino a larghezza $W = 2{,}91 \times 10^{-7}\text{ eV}$.
- **Funzione d'onda esatta e normalizzazione**: `kronigPenneyDensity1D` implementa la matrice di trasferimento $2\times 2$ della cella unitaria, ricava il vettore di Bloch dall'autovalore $\lambda = e^{ika}$ e normalizza su 240 punti medi di cella. Verificato che la media su una cella $\langle |\psi|^2 \rangle$ vale `0.999994`–`1.000000` sia sotto che sopra $V_0$, ed è periodica con periodo $a$ a precisione macchina.
- **Limite a $\delta$ delle barriere rettangolari**: Fissato $\Omega = V_0 c$ ($P_{\text{eff}} = \frac{1}{2} \frac{V_0 c b}{\hbar^2/2m_0} = \text{costante}$ con $a = b + c$ fisso), al tendere di $c \to 0$ (`c = 0.5 -> 0.001 Å`) i bordi della barriera rettangolare convergono ai bordi del modello a $\delta$ con errore $O(c)$ (`3.83e-1 eV` a $c=0{,}5\text{ \AA}$, `8.74e-4 eV` a $c=10^{-3}\text{ \AA}$).

### 2. Legami forti (`physics/tightBinding.ts` e `sections/tight-binding/`)
- **Segno di $t_p$ e curvatura della banda $p$**: Verificato conforme a P3 §12. In `tightBinding.ts:118` la dispersione è $E_s(k) = \bar{E}_s - 2 t_s \cos(ka)$ e $E_p(k) = \bar{E}_p - 2 t_p \cos(ka) = \bar{E}_p + 2|t_p|\cos(ka)$ (con `tS >= 0`, `absTP >= 0` e $t_p = -|t_p| \le 0$); di conseguenza il massimo di $E_p(k)$ sta in $k = 0$ ($E_p(0) = \bar{E}_p + 2|t_p|$, curvatura negativa e $m^*(0) < 0$) e i minimi ai bordi $k = \pm\pi/a$ ($E_p(\pm\pi/a) = \bar{E}_p - 2|t_p|$), all'opposto della banda $s$.
- **Fattore $\cos(ka/2)$ nella catena biatomica**: L'elemento fuori diagonale simmetrizzato è $-2 t \cos(ka/2)$, riprodotto fedelmente in `diatomicStateAt` (verificato residuo $\|H_{\text{sym}} v - E v\|_\infty \sim 10^{-16}$ su $k \in [0, \pi/a]$).
- **Coefficienti $b_A, b_B$ e loro fase**: La matrice `diatomicStateAt` lavora nella rappresentazione simmetrizzata in cui il fattore di fase $e^{ika/2}$ è assorbito in $\tilde b_B$, per cui i coefficienti $(b_A, \tilde b_B)$ risultano reali e ortogonali. Nei campionamenti spaziali `diatomicWaveSamples`, per il sito $B$ a $x_B = (n + 1/2)a$, l'onda di Bloch applica la fase completa $e^{ik x_B} = e^{ikna} e^{ika/2}$, compensando correttamente la trasformazione di gauge e rendendo $\operatorname{Re}\psi_k(x)$ continua e coerente con il carattere legante/antilegante.
- **Coerenza delle curve dello spazio reale**: Anche se etichettate come indicative (`sigma = 0.16 * a` / `0.31 * a` / `0.27 * a`), le curve `diatomicWaveSamples` in `k=0` mostrano somma costruttiva tra A e B sulla banda inferiore (`wave0M > 0` al punto medio $a/4$), nodo tra A e B sulla banda superiore (`wave0P` cambia segno), e annullamento sul sito B ($x=a/2$) per lo stato al bordo zona $k = \pi/a$ sulla banda $E_A < E_B$. Coerenti quantitativamente e qualitativamente coi pesi $(b_A, b_B)$.

### 3. Metodo $k \cdot p$ (`physics/kDotP.ts` e `sections/k-dot-p/`)
- **Due convenzioni di segno sul termine libero delle valenze**: Verificato in `materiale/parte4/dispensa.tex:737-740, 753-755, 763, 779`. La dispensa riporta esplicitamente sia la forma con segno negativo $-\frac{\hbar^2 k^2}{2m_0}$ sulle diagonali di valenza (usata nell'estensione di Kane 4×4 e nella slide/tabella riassuntiva, riga 779, per avere $m_{hh}^* < 0$ e riprodurre la convenzione di Kittel su $m_0/m^*_{lh} = 1 - E_P/E_g$, riga 763), sia il modello giocattolo $2\times 2$ con $+\frac{\hbar^2 k^2}{2m_0}$ (righe 753–755). `kDotP.ts`, `strings.ts:173` e `formulas.ts` implementano ed espongono esplicitamente entrambe (`freeTermConvention: 'kittel-valence-flip' | 'standard'`) senza ambiguità.
- **Scomposizione dei contributi a $1/m^*$**: `kaneMassBreakdown` e `twoBandMassBreakdown` restituiscono esattamente i termini `free`, `c`, `lh`, `so` la cui somma coincide con `totalInvMass = 1 / m*`. Nel test con `twoBandMassBreakdown` lontano da $k=0$ ($k \in [0, 0{,}2]\text{ \AA}^{-1}$), lo scarto rispetto alla derivata seconda numerica a 4° ordine è $< 5 \times 10^{-11}$, salvo al punto di flesso dove la FD numerica (passo $10^{-4}$) perde precisione (Problema 3) e nel limite non fisico `ep === eg` a $k=0$ (`Infinity`).

### 4. Pseudopotenziale empirico (`physics/pseudopotential.ts` e `sections/pseudopotential/`)
- **Fattore di struttura e gusci di $|G|^2$**: In `buildPotentialTemplate` (`pseudopotential.ts:180-226`), con $\tau = \frac{a}{8}(1,1,1)$ e $\Delta \mathbf{G} = \frac{2\pi}{a}(dx, dy, dz)$, la fase è $\Delta \mathbf{G} \cdot \tau = \frac{\pi}{4}(dx+dy+dz)$, quindi $v_{\text{Re}} = V_s(|\Delta G|^2)\cos(\Delta\mathbf{G}\cdot\tau)\cdot \text{Ry}$ e $v_{\text{Im}} = V_a(|\Delta G|^2)\sin(\Delta\mathbf{G}\cdot\tau)\cdot \text{Ry}$. Coerentemente con P4 §4: per $|\Delta G|^2 = 4$ il coseno si annulla (sopravvive solo $V_4^a$); per $|\Delta G|^2 = 8$ si annulla il seno (sopravvive solo $V_8^s$); per $|\Delta G|^2 = 3$ e $11$ sopravvivono entrambi.
- **Unità Ry $\to$ eV**: `RYDBERG_EV = 13.6057` (`constants.ts:13`), più preciso del valore arrotondato `13.6` citato discorsivamente in `dispensa.tex:1103`, ed è coerente con `epm_bande.npz` entro $< 10^{-3}\text{ eV}$ su tutte le $8 \times 201$ energie di Si e GaAs.
- **Zero dell'energia**: `pseudopotential.ts:309-319` sposta tutte le bande in modo che il massimo sui punti campionati della quarta banda (`energies[3]`) sia `0 eV`. Questa scelta è fisicamente ottima per i semiconduttori con gap positivo (`VBM = 0 eV`), ma è fragile in regime metallico quando la banda 4 scende sotto la 3 (Problema 2).
- **Cima della valenza, minimo della conduzione e massa «lungo il tratto»**: `analyzeEpmBands` cerca `vbmIndex` su `energies[3]` e `cbmIndex` su `energies[4]` lungo il cammino $L\text{–}\Gamma\text{–}X\text{–}U,K\text{–}\Gamma$, con tolleranza `1e-4 eV` per `isDirect` (`vbmPoint` vs `cbmPoint`). `epmDirectionalKinematics` usa differenze centrali con `h = 1.5e-3 Å⁻¹` lungo `dirUnit`: ben convergente all'interno dei tratti (salvo vicino ai punti di incrocio tra bande adiacenti dove l'ordinamento per autovalore scambia ramo e in $\Gamma$ dove le bande di valenza $1,2,3$ sono triplamente degeneri, Problema 8).
- **Calcolo ridotto durante il trascinamento (`51` onde piane, `10 pt/seg`)**: Sì, **può mostrare una fisica diversa da quella finale** (Problema 5): sul Si sposta il minimo da $\Gamma X(0{,}85)$ a $X(1{,}00)$, e su parametri dentro gli slider (`a=5.65, v3s=-0.27, v8s=0.042, v11s=0.035`) ribalta il tipo di gap da **diretto ($\Gamma$, `51` PW)** a **indiretto ($L$, `113` PW)**.

### 5. Massa efficace e velocità per differenze finite (`physics/semiclassical.ts`)
- **Passo e rumore numerico**: `DEFAULT_K_STEP = 1e-4 Å⁻¹` (`kronig-penney/model.ts` usa `Math.min(2e-3, 0.01 * zoneEdge)`). Lontano da flessi e incroci è accurato a 5–6 cifre significative ($\sim 10^{-5}$ rispetto alle formule analitiche).
- **Estremi di banda e punti di flesso**: Agli estremi lisci ($\Gamma$, $\pm\pi/a$, minimi interni) $v = (1/\hbar)\,dE/dk \approx 0$ e $m^*$ è ben condizionata. Nei punti di flesso, $1/m^* \approx \pm 10^{-10}\text{–}10^{-6}$, e per assenza di una soglia unica (presente solo in `TightBindingSection.tsx:506` con `|m*/m0| < 1e4`) lo studente può vedere numeri giganteschi fino a `34317249017` invece di `∞` (Problema 3).

### 6. Riempimento (`physics/filling.ts` e strumenti nelle 6 sezioni)
- **Conteggio elettroni e $E_F$ in ogni sezione**:
  - *Reticolo vuoto*: `electrons` $1\dots 4$, bande si toccano sempre agli incroci $\to$ sempre classificato metallo (`EmptyLatticeSection.tsx:370` lo etichetta fisso «Metallo»; a $N=2$ il livello di Fermi cade correttamente a $E_0$).
  - *Quasi liberi*: `fillBands` con $N \in [1, 4]$, $E_F$ a metà gap per $N=2$ con gap $>0$, altrimenti stato metallico.
  - *Kronig–Penney*: `fillBands` con $N$ pari $\to$ isolante in ogni gap non chiuso (`delta` ha sempre gap aperti se $P>0$; per barriera nulla ridiventa metallo).
  - *Legami forti*: `tight-binding/model.ts:331-334` limita `maxElectrons` a `2` nella variante biatomica (con $E_A = E_B$ il gap al bordo zona $|E_B - E_A|$ si chiude a `0` e dà metallo; con $E_A < E_B$ a $N=2$ è isolante) e a `3` nella monoatomica. Qui **fallisce nel caso delle bande $s,p$ invertite ma separate** (Problema 1).
  - *k·p*: non chiama `fillBands`, ma fissa `fermiLevel = 0.5 * params.eg` in `k-dot-p/model.ts:238`.
  - *Pseudopotenziale*: non chiama `fillBands`, ma assegna inline `0.5*(vbm+cbm)` se `gap > 0`, e **erroneamente** `vbmEnergy` (`0 eV`) se `gap <= 0` (Problema 2).
- **Casi di bande che si toccano o si sovrappongono**: Con `tol = 1e-9` e `bottom - top > tol`, due bande che si toccano (es. $E_A = E_B$ in TB biatomica o $V_{\text{ps}} = 0$ in reticolo vuoto) vengono correttamente trattate come **metallo** (`gap = null`, `occupation` frazionaria o parziale lungo $k$). Il solo baco strutturale in `filling.ts` riguarda il caso inverso: bande separate ma ordinate al contrario negli indici di array.

### 7. Test (`*.test.ts`)
- Tutti i `14` file e `111` test esistenti passano senza eccezioni (`npm test`).
- Punti di forza notevoli: `pseudopotential.test.ts` confronta tutte le $8\times 201$ energie di Si e GaAs contro `epm_bande.npz` con tolleranza stringente `< 1e-3 eV`; `emptyLattice.test.ts` copre tutte le `12` funzioni esportate; `kDotP.test.ts` aggancia i valori numerici delle dispense (GaAs, Ge) e verifica $k\cdot p$ sui quasi liberi a 4 cifre (`17.731`).
- Lacune specifiche rilevate: mancano test unitari diretti su `kaneMassBreakdown('lh'|'so')`, `twoBandMassBreakdown('lh'|'hh')`, `kronigEffectiveP`, `kronigBarrierStrength`, continuità di `kronigPenneyRectangularL` a $E = V_0$, riempimento con bande invertite separate e comportamento di `semiclassical.ts` ai punti di flesso. Tolleranze migliorabili su `kronigPenneyDensity1D` (`toBeCloseTo(1, 2)`) e sulla massa in $\Gamma$ del GaAs (`0.05 < m* < 0.2`).

### 8. Fisica rimasta nell'interfaccia (`sections/`)
Elenco completo di ciò che è emerso dalla ricerca sull'intera cartella `src/renderer/src/sections/`:
- `sections/k-dot-p/KDotPSection.tsx:371,384`: `1 / (1 ± ep / eg)` calcolato inline nel JSX (Problema 4).
- `sections/k-dot-p/model.ts:238` (e `KpBandPlot.tsx:41`): `0.5 * params.eg` per `fermiLevel`.
- `sections/pseudopotential/model.ts:432,442-444,453-457`: rapporto stima $k\cdot p$, conversioni `RYDBERG_EV`, e calcolo di `chemicalPotential` (Problema 2 e 4).
- `sections/pseudopotential/PseudopotentialSection.tsx:351-352`: conversione `RYDBERG_EV` nel JSX.
- `sections/nearly-free/model.ts:91`: `Math.PI / a` invece di `zoneEdge1D(a)`.
- `sections/nearly-free/NearlyFreeSection.tsx:261,301,308,310,317`: `2 * Math.abs(vG)`, `2 * Math.abs(v2G)` e rapporto `|V_G|/E_0` nel componente React.
- `sections/empty-lattice/`, `sections/kronig-penney/`, `sections/tight-binding/`: nessuna formula fisica autonoma rilevata (solo geometria di plot della parabola osculatrice da `slope`/`curvature` già calcolati da `physics/semiclassical.ts` e parametrizzazione di `INDICATIVE_DISTANCE_LAW` passata a `physics/tightBinding.ts`).

---

## Cosa ho verificato davvero e cosa no

### Comandi eseguiti e risultati osservati
1. **Suite di test**:
   ```zsh
   export PATH="$PWD/.tools/node/bin:$PATH" && npm test
   ```
   Risultato: `Test Files  14 passed (14)`, `Tests  111 passed (111)`, durata `6.05s`.
   - `pseudopotential.test.ts`: `[EPM timing] Si full (113×201): 1533.1 ms | GaAs full (113×201): 1214.8 ms | GaAs ridotto: 60.9 ms`.
2. **Typecheck**:
   ```zsh
   export PATH="$PWD/.tools/node/bin:$PATH" && npm run typecheck
   ```
   Risultato: codice d'uscita `0` (`tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json`).
3. **Verifiche numeriche indipendenti (`crosscheck/`)**:
   - Compilazione ESM di `src/renderer/src/physics/index.ts` in `crosscheck/physics_bundle.mjs` via `rolldown` (`106.87 kB`, uscita `0`).
   - Esecuzione di `crosscheck/revisione-A-verifica.mjs` (sezioni 1–5):
     - `eigh` hermitiana complessa (`n = 1, 2, 5, 15, 25` + blocchi degeneri): residui autovalori/autovettori $\le 1{,}903 \times 10^{-14}$, ortonormalità $\le 5{,}329 \times 10^{-15}$.
     - `kronigPenney`: continuità attraverso $E = V_0$, sweep su 125 combinazioni estreme (`failCount = 0`), convergenza $\text{rettangolare} \to \delta$ da `3.83e-1` a `8.74e-4 eV`, normalizzazione $|\psi|^2$ compresa tra `0.999994` e `1.000000`.
     - `tightBinding`: residuo autovettori $H_{\text{sym}}$ a $\sim 10^{-16}$; riproduzione di `fillBands` su bande $s,p$ invertite (`kind=metal, gap=null`).
     - `kDotP`: confronto di `twoBandMassBreakdown` con derivata a 4° ordine; singolarità `ep === eg`.
     - `pseudopotential`: confronto Si/GaAs tra `113 PW` e `51 PW`, comportamento in $\Gamma$ (`idx=40` vs `idx=200`), chiusura di gap con `V_ps = 0`.
   - Esecuzione di `crosscheck/revisione-A-extra.mjs` (uscita `0`):
     - Rumore di curvatura ai punti di flesso (TB, NF, KP, k·p 2 bande) con stampa di $m^*/m_0$ fino a `34317249016.578`.
     - Caso Si/GaAs e variazione di parametri `51 PW` vs `113 PW`.
     - `epmDirectionalKinematics` vicino ai quasi-incroci interni del Si (`gap ~ 0.0345–0.0348 eV`).
   - Verifica diretta Node sull'inversione di tipo di gap (`a=5.65, v3s=-0.27, v8s=0.042, v11s=0.035`): `FAST` (`51 PW, 10 pt`) $\to$ `isDirect: true, cbm: 'Γ', gap: 1.105 eV`; `FULL` (`113 PW, 40 pt`) $\to$ `isDirect: false, cbm: 'L', gap: 1.076 eV`.
4. **Ricerca statica su `src/renderer/src/sections/`**:
   ```zsh
   grep -rnE "HBAR|RYDBERG|Math\.PI|0\.5 \*|1 / \(|2 \* Math\.abs" src/renderer/src/sections/
   ```
   Risultato: uscita `0`, ispezionate tutte le occorrenze.

### Cosa non ho potuto verificare
- **Rendering effettivo a schermo nell'app Electron / browser**: per vincolo d'incarico non sono stati avviati `npm run dev` né `npm run build`, quindi non ho verificato visivamente la resa tipografica KaTeX, la posizione delle etichette sui canvas né l'interazione col mouse durante il trascinamento degli slider (tutto quanto riportato sui valori mostrati deriva dalla lettura diretta del codice JSX/TS e dalle chiamate dirette ai moduli compilati da `physics/`).
- **Esecuzione diretta degli script Python in `materiale/`**: vietata dall'incarico (l'allineamento con `epm_bande.npz` è verificato tramite i test esistenti in `pseudopotential.test.ts` e il confronto diretto sui numeri riportati in `materiale/parte3/dispensa.tex` e `materiale/parte4/dispensa.tex`).
