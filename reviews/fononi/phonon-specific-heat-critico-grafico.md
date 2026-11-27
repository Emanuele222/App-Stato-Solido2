# Revisione grafica e usabilità — Sezione 6 Fononi (`phonon-specific-heat`)

**Sezione esaminata**: `Fononi › Calore specifico e Debye` (`src/renderer/src/sections/phonon-specific-heat/`)  
**Risoluzioni verificate**: **1440×900**, **1100×800**, **800×700**  
**Ruolo**: `critico-grafico` (sola lettura su `src/`)

---

## 1. Sintesi delle verifiche eseguite

### 1.1 Ispezione su app live, schermate e misure DOM/console
L'app live (`http://127.0.0.1:5173/`) è stata ispezionata alle tre risoluzioni di riferimento tramite schermate catturate e misure DOM/console/hover:
- **Tutte e 5 le tappe storiche** (a 1440×900): `1819 Dulong–Petit`, `1907 Einstein`, `1912 Debye`, `1953 Oltre Debye`, `Confronto completo`.
- **Controlli grafici e preset**: commutazione `Lineare` / `Log–Log`, `Cᵥ/3R` / `J/(mol·K)`, `Asintoto T³`, preset materiali (incluso `Rame (Cu, 343 K)` e `Diamante (C, 2230 K)` a `77 K`), pannello `Dettagli formali` aperto.
- **Risoluzioni medie e compatte**: `1912 Debye` e `1953 Oltre Debye` a **1100×800** e **800×700**.
- **Console e KaTeX**: **0 errori console** e **0 errori KaTeX** (`.katex-error`) su tutte le tappe, preset, hover e resize.

Misure di layout e interattività rilevate:
- **1440×900** (`html 1440×900`, `.stage 820×900`, `.aside 400×900`):
  - **0 overflow/scroll** su pagina (`ΔX/ΔY = 0/0`) e colonna centrale `.stage` (`ΔX/ΔY = 0/0`); `.aside` scorre solo verticalmente per guida e dettagli con `maxRightOverflow = 0`.
  - Tappe storiche su **1 riga**; barra parametri compatta su **2 righe**, con `<select>` `Materiale` sempre su una sola riga (`150 × 29,1 px`).
- **1100×800** (`html 1100×800`, `.stage 540×800`, `.aside 360×800`):
  - **0 overflow/scroll** su pagina e `.stage` (`ΔX/ΔY = 0/0`); `.aside` scorre solo verticalmente (`scrollH = 1073,6` in `1912 Debye`, `1091,2` in `1953 Oltre Debye`, `maxRightOverflow = 0`).
  - Tappe storiche su **2 righe**; barra parametri su **2 righe**, `<select>` su una sola riga (`150 × 29,1 px`).
- **800×700** (`html 800×700`, `.stage 490×700`, `.aside 310×700`, menu laterale collassato in `☰`):
  - **0 overflow/scroll** su pagina e `.stage` (`ΔX/ΔY = 0/0`); `.aside` scorre solo verticalmente (`scrollH = 1222,4` in `1912 Debye`, `1244,0` in `1953 Oltre Debye`, `maxRightOverflow = 0`).
  - Tappe storiche su **2 righe**; barra parametri su **2 righe**, `<select>` su una sola riga (`150 × 29,1 px`).
- **Hover bidirezionale** (verificato su schermate e DOM a 1440×900):
  - Hover su `T` (`[data-q="T"]`) in *Formula viva* accende lo slider `T` (`param is-active`), attenua gli altri termini nella formula e lascia evidenziati cursore `T`, area attiva/curva peso e sfera termica `k_T`.
  - Hover su `Θ_D` (`[data-q="Theta"]`) accende lo slider `Θ_D` (`param is-active`) ed evidenzia parabola `g(ω)`, taglio `ω_D` e sfera `k_D`.
- **Stabilità cifre tabulari** (`T = 77 K` vs `T = 1200/1230 K`):
  - `<output>` degli slider stabile a `42,04 px` (`.param` `295,0 px`).
  - `.value-num` di `C_V^E`, `C_V^D`, `3R`, `T/Θ_D`, `ν_D`, `ħω_D` stabili (`35,04 px` / `28,03 px`), grazie a `tabular-nums` e `minWidth` in `ch` (`PhononSpecificHeatSection.tsx:351-365`).

### 1.2 Verifiche statiche su stile, colori e cicli grafici (sola lettura)
- **Stile lavagna**: fondo scuro piatto `#0f1114` (`TOKENS.bg`), linee nette, nessun bagliore o effetto 3D decorativo; `ChartLegend` sempre esterna all'area dei canvas (`SpecificHeatCurveView.tsx:595`, `SpectrumDebyeView.tsx:758`).
- **Zero colori hardcoded**: ricerca su `src/renderer/src/sections/phonon-specific-heat/*` — **0 occorrenze** di `#hex`, `rgb()`, `rgba()`, `hsl()`, `hsla()`. Tutti i colori provengono da `src/renderer/src/ui/theme.ts`.
- **Cicli `rAF` e animazioni**: i canvas della sezione sono statici rispetto al tempo e restituiscono tutti `false` (`SpecificHeatCurveView.tsx:540`, `SpectrumDebyeView.tsx:275, 341, 493, 575, 752`), quindi nessun `rAF` superfluo resta attivo a riposo. I cambi di preset interpolano con `GLIDE` e gli slider con `FOLLOW` (`PhononSpecificHeatSection.tsx:33`), rispettando `prefers-reduced-motion` (`phonon-specific-heat.css:183-188`, `ui/motion.ts:61`).

---

## 2. Problemi trovati (in ordine di gravità)

### [IMPORTANTE] 1. Scala dell'asse Y fuorviante per il peso $\mathcal{E}(\hbar\omega/k_B T)$ in `1907 Einstein` (e assenza di scala `[0, 1]` dedicata negli altri stadi)
- **Tipo**: Difetto oggettivo di leggibilità e rappresentazione quantitativa su canvas.
- **Elemento**: Canvas inferiore sinistro `SpectrumDebyeView` (`src/renderer/src/sections/phonon-specific-heat/SpectrumDebyeView.tsx:156, 171, 211-222, 440-456`).
- **Risoluzione e stato**: **1440×900**, **1100×800** e **800×700**; difetto critico nella tappa **`1907 Einstein`** (verificato in schermata `1907 Einstein` Log–Log) e presente come ambiguità implicita in **`1912 Debye`** e **`Confronto completo`**.
- **Cosa è sbagliato**: In `1907 Einstein` la parabola $g(\omega)$ di Debye non è disegnata e l'asse Y viene intitolato `Peso E(ħω/k_B T)`, ma mantiene le tacche `1`, `2`, `3` della scala $g(\omega)$ normalizzata mentre la funzione $\mathcal{E}(\hbar\omega/k_B T) \in [0, 1]$ è disegnata con fattore `weightTop = 2.7` (`SpectrumDebyeView.tsx:441`). Sullo schermo si legge quindi $\mathcal{E}(0) \approx 2{,}7$ sull'asse `1–3` invece di `1`. Anche negli stadi `Debye` e `Confronto completo` la curva di peso usa la mappatura `0..1 → 0..2,7` senza tacche dedicate a destra (`0` e `1`).
- **Come riprodurre**: Aprire la tappa `1907 Einstein` e leggere il valore iniziale a $\omega = 0$ della curva tratteggiata rossa `Peso ℰ(ħω/k_B T)` rispetto alle tacche `1, 2, 3` dell'asse Y sinistro.
- **Indicazione di correzione**: In `1907 Einstein` impostare l'asse Y su `[0, 1]` (con tacche `0`, `0,5`, `1`) e disegnare $\mathcal{E}$ senza il fattore `2.7`; negli stadi con $g(\omega)$ aggiungere una seconda scala discreta a destra (`0` e `1` al livello `y = 2.7`) oppure un'etichetta `1` sul punto iniziale della curva tratteggiata.

---

### [IMPORTANTE] 2. Contraddizione cromatica su `C_V^E` in `1907 Einstein` (`CV` azzurro in Formula viva vs `omegaOpt` arancione in grafico e Valori) e cambio colore di `DOS Debye` in `1953 Oltre Debye`
- **Tipo**: Difetto oggettivo di coerenza cromatica (`Un colore = una grandezza`, `progetto.md` e `ui/theme.ts`).
- **Elemento**: `src/renderer/src/sections/phonon-specific-heat/formulas.ts:29, 49` (e `strings.ts:139`) rispetto a `SpecificHeatCurveView.tsx:99, 391` e `PhononSpecificHeatSection.tsx:267`; inoltre `SpectrumDebyeView.tsx:86, 297` rispetto alle righe `54, 108, 388`.
- **Risoluzione e stato**: **1440×900**, **1100×800** e **800×700**; stati **`1907 Einstein`** e **`1953 Oltre Debye`**.
- **Cosa è sbagliato**:
  1. Nella schermata **`1907 Einstein`**, `C_V^E` compare nella *Formula viva* in **azzurro** (`q=CV`, `#45b7f7`), mentre nella stessa schermata la curva `Einstein C_V^E` sul grafico, la sua legenda e il valore `C_V^E` nel pannello `Valori` sono **arancioni** (`q=omegaOpt`, `#f59e56`) — a differenza di `Confronto completo` (`formulas.ts:63`), dove `C_V^E` è correttamente arancione (`q=omegaOpt`).
  2. Nella schermata **`1953 Oltre Debye`**, la curva `DOS Debye g(ω) ∝ ω²` nello spettro inferiore sinistro cambia colore da **viola** (`Theta`, `#a07ef5`, usato in tutte le altre quattro tappe) ad **azzurro** (`CV`, `#45b7f7`), attenuando il legame visivo con la stessa parabola vista nelle tappe precedenti.
- **Come riprodurre**: Confrontare i colori di `C_V^E` tra *Formula viva*, grafico e `Valori` in `1907 Einstein`; poi confrontare il colore della parabola `DOS Debye` tra `1912 Debye` e `1953 Oltre Debye`.

---

### [MINORE] 3. Sovraccarico dell'id colore `k` (giallo `#f4d345`) su tre concetti distinti (`k_T`, soglia `ħω = k_B T` e `Dati Tab. 2`)
- **Tipo**: Difetto oggettivo di ambiguità colore ↔ grandezza tra concetti diversi (`critico-grafico` punto 2).
- **Elemento**: `SpecificHeatCurveView.tsx:131, 457, 497`, `PhononSpecificHeatSection.tsx:335`, `SpectrumDebyeView.tsx:464, 478, 704, 719, 743`.
- **Risoluzione e stato**: Tutte le risoluzioni, tappe `1912 Debye` e `Confronto completo` (con preset dotato di `Dati Tab. 2`, es. Rame o Diamante).
- **Cosa è sbagliato**: L'identificativo `k` (`#f4d345`, «vettore d'onda») è usato contemporaneamente per: (a) il raggio della sfera termica $k_T$, (b) la soglia energetica $\hbar\omega = k_B T$ nello spettro, e (c) i dati sperimentali di calore specifico `Dati Tab. 2` (rombi ed etichette `77 K: 12,5`, `273 K: 24,3`). Condividere lo stesso `q=k` implica che in hover su $k_T$ nella formula di `Confronto completo` restino accesi i punti sperimentali di $C_V$ pur essendo una grandezza diversa dal vettore d'onda. *(Preferenza separabile: mantenere il giallo visivo per i rombi sperimentali se serve contrasto, ma non associarli a `q=k` né attenuarli/accenderli insieme a `k_T`.)*

---

### [MINORE] 4. Dettagli tipografici minori in `SpectrumDebyeView` (`Peso E(...)`, titolo asse `ω / ω_D` in 1953, tacche Y `1, 2, 4, 6`)
- **Tipo**: Difetto oggettivo minore di tipografia su canvas.
- **Elemento**: `src/renderer/src/sections/phonon-specific-heat/SpectrumDebyeView.tsx:211-227`.
- **Risoluzione e stato**: Tutte le risoluzioni (**1440×900**, **1100×800**, **800×700**), stati **`1907 Einstein`** e **`1953 Oltre Debye`**.
- **Cosa è sbagliato**:
  1. In `1907 Einstein`, il titolo asse Y stampa `Peso E(ħω/k_B T)` con `E` standard anziché la `ℰ` calligrafica usata in legenda e formula.
  2. In `1953 Oltre Debye`, la tacca di taglio sull'asse X mostra `ω_max`, ma il titolo dell'asse in basso a destra resta `ω / ω_D`.
  3. In `1953 Oltre Debye`, la griglia orizzontale disegna tutte le linee `1..6` ma le etichette stampate sono `1, 2, 4, 6` (omettendo `3` e `5`, con passo visivo non uniforme).

---

### [MINORE] 5. Allargamento di `Legge T³` nella tabella `Valori` ad alte temperature
- **Tipo**: Difetto oggettivo minore di stabilità di impaginazione numerica ai valori estremi.
- **Elemento**: `SpecificHeatValues` (`src/renderer/src/sections/phonon-specific-heat/PhononSpecificHeatSection.tsx:298`).
- **Risoluzione e stato**: Tutte le risoluzioni, con `T = 1200 K` su Rame (`Θ_D = 343 K`).
- **Cosa è sbagliato**: Mentre tutti gli altri valori numerici restano a larghezza rigorosamente fissa (`35,04 px` / `28,03 px`, slider `<output>` `42,04 px`), il solo campo `Legge T³` ha `minWidth: 5ch` e a `T = 1200 K` raggiunge `83235,06` allargandosi da `35,04 px` a `51,88 px`. (Nota: per $T \gg \Theta_D$ l'asintoto $T^3$ è fisicamente fuori regime; è comunque opportuno allargare leggermente `width` o passare a notazione compatta oltre `9999`.)

---

## 3. Due cose riuscite meglio

1. **Impaginazione impeccabile alle tre risoluzioni (1440×900, 1100×800, 800×700)**: zero scorrimenti della pagina o della colonna centrale, zero overflow orizzontali in `.aside`, menu `<select>` `Materiale` sempre su una sola riga (`150 × 29,1 px`), barra parametri sempre su due righe compatte e tutti i pannelli (incluso `Corpo nero T⁴` e `Sfera di Debye` in appena `162 px` di larghezza a `800×700`) perfettamente leggibili senza tagli né sovrapposizioni.
2. **Chiarezza visiva dei grafici e posizionamento automatico delle etichette**: la scelta di collocare i dati sperimentali di Tab. 2 (`77 K: 12,5`, `273 K: 24,3`), la retta `3R = 24,94` e l'etichetta di pendenza `∝ T³` con `placeFreeLabel` evita ogni collisione tra curve, assi e cursore `T` sia in `Lineare` sia in `Log–Log` (esemplare il caso criogenico `Diamante 77 K` a `0,08 J/(mol·K)`), mantenendo stile lavagna pulito e zero errori KaTeX/console.

---

## 4. Verdetto

**Da correggere** — la sezione è già molto solida su impaginazione, reattività, hover bidirezionale e stile lavagna, ma presenta **2 problemi importanti** risolvibili con interventi mirati: l'asse Y `1–3` con `weightTop = 2.7` sotto il titolo `Peso E(ħω/k_B T)` in `1907 Einstein`, e l'incoerenza cromatica di `C_V^E` in `Formula viva` di `1907 Einstein` (`CV` azzurro anziché `omegaOpt` arancione).
