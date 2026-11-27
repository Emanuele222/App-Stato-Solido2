# Revisione grafica e usabilità — Sezione 5 Fononi (`phonon-quantum`)

**Sezione esaminata**: `Fononi › Modi quantizzati e processi Umklapp` (`src/renderer/src/sections/phonon-quantum/`)  
**Risoluzioni verificate**: **1440×900**, **1100×800**, **800×700**  
**Ruolo**: `critico-grafico` (sola lettura su `src/`)

---

## 1. Sintesi delle verifiche eseguite

### 1.1 Ispezione nel browser e misure di layout
L'app in esecuzione su `http://localhost:5173/` è stata ispezionata alle tre risoluzioni di riferimento in entrambe le modalità e negli stati chiave:
- **Modalità A (`Quantizzazione del modo`)**: `Punto zero (n = 0)`, `Limite Bohr (n = 20)`, `Bagno termico 300 K` (inclusi `Pesi p_n(T)` e `PlaybackControls` in Play e in Pausa).
- **Modalità B (`Collisioni 1BZ (N / Umklapp)`)**: `Umklapp dispensa §16 (0,7 + 0,6 π/a)` e `Normale in 1BZ (0,3 + 0,4 π/a)`.
- **Interattività**: hover sui termini di *Formula viva* (`T`, `ω`, `k₁`/`k₂`), variazione parametri, controllo stabilità delle cifre tabulari e transizioni interpolate.

Misure rilevate dal browser:
- **Console e KaTeX**: **0 errori di runtime dell'app** e **0 errori o warning KaTeX** (80 nodi `.katex` in Modalità A) all'apertura, al cambio modalità/preset e durante gli hover. *(Nota tecnica di automazione: l'uso di `fill()` del driver browser sugli `<input type="range">` ha generato due `IndexSizeError` su `Range.setEnd`, dovuti al metodo di test sul widget range e non al codice dell'app.)*
- **1440×900** (`nav` `220×900`, `main` `820×900`, `aside` `400×900`):
  - **0 scorrimenti** di pagina e di `main`; `.aside` scorre verticalmente per la sola *Guida alla sezione* e ha **0 overflow orizzontale** (nessuna formula troncata).
  - Barra parametri: **2 righe** in Modalità A (`107,4 px`), **1 riga** in Modalità B (`88,9 px`).
  - Canvas Modalità A: oscillatore `820×417,6 px` (`623,2×417,6 px` + `Pesi p_n(T)` `196×417,6 px` in `Bagno termico`), catena `820×228 px`.
- **1100×800** (`nav` `200×800`, `main` `540×800`, `aside` `360×800`):
  - **0 scorrimenti** di pagina e di `main`; `.aside` senza scrollbar orizzontale.
  - Barra parametri: **3 righe** in Modalità A (`123,9 px`), **2 righe** in Modalità B (`111,4 px`).
  - Canvas Modalità A: oscillatore `540×328,3 px` (`392×328,3 px` + `Pesi p_n(T)` `147,2×328,3 px`), catena `540×134,0 px`.
  - Canvas Modalità B: schema 1BZ `540×155,7 px` (`176,5 px` in `Normale`), dispersione `540×304,5 px`.
- **800×700** (`nav` collassato nel menu `☰`, `main` `490×700`, `aside` `310×700`):
  - **0 scorrimenti** dell'intera pagina e di `main`; tutti i canvas e i controlli restano visibili senza tagli in `.aside`.
  - Barra parametri: **3 righe** in Modalità A (`123,9 px`), **2 righe** in Modalità B (`105,4 px`).
  - Canvas Modalità A: oscillatore `342×243,8 px` + `Pesi p_n(T)` `147,2×243,8 px`, catena `490×93,5 px`.
  - Canvas Modalità B: schema 1BZ `490×115,5 px`, dispersione `490×244,2 px`.

### 1.2 Verifiche su stile, colori, animazioni e codice (sola lettura)
- **Stile lavagna**: fondo piatto `#0f1114` (`TOKENS.bg`), linee nette, nessun bagliore, ombra o effetto 3D decorativo; `ChartLegend` sempre esterna all'area dei canvas.
- **Zero colori codificati fuori tema**: ricerca su `src/renderer/src/sections/phonon-quantum/*` — **0 occorrenze** di codici `#hex`, `rgb()` o `hsl()`. Tutti i colori provengono da `src/renderer/src/ui/theme.ts`.
- **Hover bidirezionale e cifre tabulari**: l'hover su `[data-q="T"]`, `[data-q="omega"]`, `[data-q="k"]` in *Formula viva* accende lo slider corrispondente (`param is-active`) ed evidenzia in scena gli oggetti associati attenuando il resto (`DIM = 0.26`). I valori numerici usano `className="num value-num"` con `minWidth` fisso in `ch` (`PhononQuantumSection.tsx:539`) e non provocano salti di impaginazione (in Modalità B `63,06 px` stabile tra segni `+` e `−`). I cambi di stato via preset interpolano con `GLIDE`, gli slider con `FOLLOW` (`PhononQuantumSection.tsx:44-45`).
- **Cicli `rAF` e `PlaybackControls`**: i canvas statici (`QuantumOscillatorView.tsx:451,563`, `Umklapp1BZView.tsx:379`, `UmklappDispersionView.tsx:472`) restituiscono `false` (nessun `rAF` attivo). `QuantumChainView.tsx:304` restituisce `playback.effectivePlaying`, fermando il `rAF` in pausa e quando `prefers-reduced-motion` è attivo (`PlaybackControls.tsx:76,176`), senza sovrapposizioni tra gli atomi (`maxSafeShift` in `QuantumChainView.tsx:121`).
- **Cosa non è stato possibile verificare live**: l'emulazione automatica via browser della media query `prefers-reduced-motion: reduce` (non supportata da `webview_browser`, verificata quindi per ispezione di `PlaybackControls.tsx:74-76,170-183` e `phonon-quantum.css:194-198`, oltre alla verifica visiva del fermo immagine col pulsante **Pausa**).

---

## 2. Problemi trovati (in ordine di gravità)

### [IMPORTANTE] 1. Picco della curva tratteggiata `P_n(x)` (`P_0`) troncato a tetto piatto in `Bagno termico T`
- **Tipo**: Difetto oggettivo di visualizzazione su canvas.
- **Elemento**: Sottografico inferiore di `QuantumOscillatorView` (`src/renderer/src/sections/phonon-quantum/QuantumOscillatorView.tsx:232-239`).
- **Risoluzione e stato**: **1440×900**, **1100×800** e **800×700**, in **Modalità A → `Bagno termico 300 K`** (e per ogni temperatura in cui il massimo di $\langle P(x)\rangle_T$ è più basso di $P_0(0) = 1/\sqrt{\pi} \approx 0{,}564$).
- **Cosa è sbagliato**: Quando `isThermal` è attivo, la scala verticale `pMax` è calcolata sul solo array `model.thermalProb` (`qArr`) e su `pClCenter` (`pMax ≈ 0,531` a `300 K`), ignorando il riferimento `model.curves.probQuantum` (`P_0(x)`). La funzione `toBotY` esegue `Math.min(1.03, pVal / pMax) * botH`, schiacciando la campana punteggiata magenta `P_0(x)` contro il bordo superiore del sottografico e mozzandone il picco in un tratto orizzontale piatto.
- **Come riprodurre**: Aprire Modalità A e selezionare il preset `Bagno termico 300 K` (o alzare $T$): la curva punteggiata viola `P_n(x)` mostra un pianerottolo orizzontale in alto a $x = 0$.
- **Indicazione di correzione**: Includere anche il massimo di `model.curves.probQuantum` nel calcolo di `maxQ` quando `isThermal` è vero, così `P_0(x)` rientra sempre interamente nel sottografico.

---

### [IMPORTANTE] 2. Etichetta `V(x) [ħω]` intersecata dal ramo sinistro della parabola verde
- **Tipo**: Difetto oggettivo di leggibilità su canvas.
- **Elemento**: Etichetta `V(x) [ħω]` nell'angolo superiore sinistro del grafico superiore (`QuantumOscillatorView.tsx:123-128`).
- **Risoluzione e stato**: **1440×900**, **1100×800** e **800×700**, in **tutti gli stati della Modalità A** (`n = 0`, `n = 20`, `Bagno termico 300 K`).
- **Cosa è sbagliato**: `V(x) [ħω]` è posizionata a `(padL + 6, topY0 + 11)`, esattamente sulla traiettoria di uscita della parabola $V(u) = \tfrac{1}{2}u^2$ (`QuantumOscillatorView.tsx:138-151`). La curva verde attraversa diagonalmente il testo `V(x) [ħω]` in tutte le schermate ispezionate.
- **Come riprodurre**: Aprire la sezione in qualsiasi stato della Modalità A e osservare l'angolo in alto a sinistra del grafico superiore.
- **Indicazione di correzione**: Spostare l'etichetta `V(x) [ħω]` lungo la parabola sul lato destro fuori dal ramo sinistro (oppure dentro l'asse sinistro / come titolo asse Y sopra la tacca massima) verificando che non intersechi la curva a nessun valore di `eMax`.

---

### [IMPORTANTE] 3. Scomparsa delle percentuali in `Pesi p_n(T)` a 1100×800 e 800×700, linea `n̄` sopra `25%` a 1440×900 e `k_BT` letterale
- **Tipo**: Difetto oggettivo di leggibilità e perdita di dati quantitativi sui viewport medi/piccoli.
- **Elemento**: Pannello laterale `ThermalBathStrip` (`QuantumOscillatorView.tsx:485,498,533-539,550-559`, `phonon-quantum.css:59-64`).
- **Risoluzione e stato**: Modalità A → `Bagno termico 300 K`:
  1. A **1100×800** e **800×700** (`.phonon-q-bath-wrap` largo `147,2 px`), la condizione `padR >= 26` (`w > 170 ? 30 : 12`, righe 485 e 533) nasconde le etichette `51%`, `25%`, `12%` sulle barre più alte; non essendo presente alcun asse numerico orizzontale, il pannello perde ogni lettura quantitativa dei pesi.
  2. A **1440×900**, la linea tratteggiata orizzontale della media `n̄` (`yMean`, righe 550–559) attraversa esattamente la scritta `25%` della barra $n = 1$.
  3. A **tutte le risoluzioni**, il sottotitolo `n̄=0,98 · k_BT/ħω=1,42` (riga 498) usa un underscore letterale `k_BT` e tocca quasi il margine inferiore del titolo `Pesi p_n(T)`.
- **Come riprodurre**: Attivare `Bagno termico 300 K` a `1440×900` e poi ridurre la finestra a `1100×800` o `800×700`.

---

### [IMPORTANTE] 4. Underscore letterali in canvas/UI e incoerenza di notazione (`V(Q)` / `P(u)·a_ho` vs `P_n(x)` / `x/a_ho`)
- **Tipo**: Difetto oggettivo di tipografia scientifica e coerenza notazionale.
- **Elemento e dove appare** (tutte le risoluzioni):
  1. **Canvas catena vibrante** (`QuantumChainView.tsx:292-301`): `ctx.fillText` stampa letteralmente `Δx_zp = 0,043 Å (1,7% di a)` (a `n = 0`) e `Δx_rms = 0,073 Å (2,9% di a)` (a `n = 20` e in `Bagno termico`) con underscore grezzo `_`; inoltre duplica la stessa dicitura già presente nell'hint della barra superiore (`strings.ts:54,56`, anche lì con `Δx_zp` / `Δx_rms` con underscore).
  2. **Asse Y inferiore dell'oscillatore e titolo vista** (`strings.ts:45,70`): il titolo della vista recita `potenziale V(Q) e densità P(x)`, la legenda e l'asse X usano `x` (`P_n(x)`, `P_cl(x)`, `⟨P(x)⟩_T`, `x / a_ho`), mentre l'etichetta verticale rossa/viola del sottografico stampa `P(u)·a_ho` introducendo la variabile `u` non mostrata sull'asse X.
  3. **Titolo vista e pannello `Valori`** (`strings.ts:78,107,115,116`): compaiono in testo semplice `v_g(k)` (titolo vista dispersione), `frazione nella regione |x| > x_cl`, `Velocità v_g` e `v_g(k₃) ha segno opposto a v_g(k₁), v_g(k₂)` con underscore letterali.
  4. **Box di riepilogo in `UmklappDispersionView.tsx:296`**: stampa `v_g: k₁ → , k₂ → ⇒ k₃ ←` con underscore letterale `v_g` e uno spazio prima della virgola (`→ ,`).
- **Come riprodurre**: Osservare i canvas della Modalità A, il titolo/box della vista inferiore in Modalità B e le righe della tabella `Valori` in `.aside`.

---

### [MINORE] 5. Separatore `·` ambiguo nella riga `Vettori 1BZ` di `Formula viva` (`G = −2 π/a · k₃ = −0,70 π/a`)
- **Tipo**: Difetto minore di leggibilità matematica.
- **Elemento**: `PhononQuantumSection.tsx:483-490` (Modalità B, pannello `Formula viva` → `Valori`).
- **Risoluzione e stato**: Tutte le risoluzioni, Modalità B (`Umklapp` e `Normale`).
- **Cosa è sbagliato**: Nella seconda riga di `Vettori 1BZ`, il separatore `' · '` separa due uguaglianze simboliche (`G = −2 π/a · k₃ = −0,70 π/a`, oppure `G = 0 · k₃ = 0,70 π/a`). Il punto centrato `·` tra `π/a` (o `0`) e `k₃` può essere letto a colpo d'occhio come simbolo di moltiplicazione. Un separatore verticale (`|`), punto e virgola (`;`) o l'andata a capo elimina ogni ambiguità.

---

### [MINORE] 6. Etichette `−x_cl` e `+x_cl` a cavallo della linea dell'asse X e della regione di tunneling
- **Tipo**: Difetto minore di rifinitura su canvas.
- **Elemento**: `QuantumOscillatorView.tsx:417-428` (`drawMathText` a `botY1 - 4`).
- **Risoluzione e stato**: Tutte le risoluzioni, Modalità A (`n = 0`, `n = 20`, `Bagno termico 300 K`).
- **Cosa è sbagliato**: Le etichette `−x_cl` e `+x_cl` hanno uno sfondo opaco (`TOKENS.bg`) centrato a `botY1 - 4`: il rettangolo di sfondo taglia visivamente la linea dell'asse orizzontale `botY1` in corrispondenza dei punti di inversione, e a `n = 20` si sovrappone alla coda tratteggiata/riempita di `P_20(x)`. Sollevarle leggermente sopra l'asse (`botY1 - 10` con sfondo semitrasparente o sopra l'area di riempimento) lascerebbe continuo l'asse X.

---

### [MINORE] 7. Condivisione di `data-q="k"` tra `k₁` e `k₂`, e legenda `E_n` vs colore effettivo del livello attivo
- **Tipo**: Piccole incoerenze residue legate alla mappatura `data-q`.
- **Elemento**: `formulas.ts:25-28,64-65`, `QuantumOscillatorView.tsx:58,180`.
- **Cosa si osserva**:
  1. In **Modalità B**, sia `k₁` sia `k₂` usano `data-q="k"`, quindi passando con il mouse su `k₁` nella formula si illuminano entrambi gli slider `k₁` e `k₂` (e entrambi i vettori gialli in scena); inoltre `C` nella formula di $\omega(k)$ e $v_g(k)$ non ha `data-q="C"` (resta neutro mentre `M` ha `q=M`), e passando su `M` in Modalità B l'intera scena si attenua perché `M` non ha un oggetto dedicato nei due grafici di dispersione.
  2. In **Modalità A**, la legenda di `QuantumOscillatorView` abbina `$V(x), E_n$` al colore verde `var(--q-omega)`, mentre nel grafico superiore il livello attivo `E_n` è tracciato in magenta `psi` (in livello puro) o rosso `T` (in bagno termico), mentre `E` nella formula ha colore `var(--q-E)`.

---

### [MINORE] 8. Catena vibrante compatta a 800×700 e dettaglio di micro-copia in `Guida alla sezione`
- **Tipo**: Osservazione di impaginazione / rifinitura editoriale.
- **Elemento**: `.phonon-q-bar` + `QuantumChainView` a `800×700`; `strings.ts:140`.
- **Cosa si osserva**:
  - A **800×700** in Modalità A, `PlaybackControls` va giustamente a capo sotto la legenda di `QuantumChainView` lasciando al canvas `93,5 px` di altezza: tutti gli elementi (profilo d'onda, molle, atomi, quota `a`) restano leggibili e senza tagli, ma l'etichetta `Δx_rms` in alto a destra e la quota `a` in basso sfiorano i margini verticale superiore e inferiore.
  - In `strings.ts:140` (`Guida alla sezione → Cosa provare`), `Punto zero (n = 0)` è in testo semplice mentre subito sotto `($n = 20$)` è formattato in LaTeX.

---

## 3. Le due cose riuscite meglio

1. **Impaginazione impeccabile della colonna destra (`Formula viva` + `Valori`) a tutte le risoluzioni**: a differenza di altre sezioni dense di formule, qui tutte le espressioni KaTeX e i valori numerici a larghezza tabulare stabile rientrano perfettamente nei `400 px` (1440), `360 px` (1100) e `310 px` (800) senza alcuna scrollbar orizzontale né troncamenti, e senza generare scorrimenti dell'intera pagina o della colonna centrale nemmeno a `800×700`.
2. **Chiarezza didattica e visiva della Modalità B (`Collisioni 1BZ`)**: la coppia sincronizzata tra striscia vettoriale testa-coda in alto ($k_1$, $k_2$, salto $G = \mp 2\pi/a$, risultante $k_3$) e curva $\nu(k)$ in basso con frecce tangenti della velocità di gruppo $v_g(k_i)$ e riquadro riassuntivo rende immediatamente leggibile il ribaltamento del flusso energetico negli urti Umklapp rispetto ai processi Normali, con etichette prive di collisioni a tutte e tre le risoluzioni.

---

## 4. Verdetto

**Da correggere**

L'impianto generale, la stabilità di impaginazione alle tre risoluzioni, lo stile lavagna, i controlli di riproduzione e la Modalità B sono molto solidi (zero errori di runtime e zero errori KaTeX); prima della chiusura occorre tuttavia risolvere i **4 problemi importanti** in Modalità A e nella tipografia (`P_0(x)` troncata a tetto piatto in bagno termico, parabola verde che taglia `V(x) [ħω]`, percentuali mancanti/sovrapposte in `Pesi p_n(T)`, underscore letterali e disallineamento `V(Q)`/`P(u)` vs `x`).
