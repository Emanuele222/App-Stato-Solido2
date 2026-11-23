# Revisione grafica e usabilità — Sezione 2 Fononi (`phonon-diatomic`)

**Sezione esaminata**: `Fononi › Catena biatomica, gap e luce IR` (`src/renderer/src/sections/phonon-diatomic/`)  
**URL testato**: `http://127.0.0.1:5173/` (build di produzione servito in locale)  
**Risoluzioni verificate**: **1440×900**, **1100×800**, **800×700**  
**Ruolo**: `critico-grafico` (sola lettura su `src/`)

---

## 1. Sintesi delle verifiche eseguite

### 1.1 Ispezione live nel browser e screenshot
L'app in esecuzione è stata aperta nel browser alle tre risoluzioni **1440×900**, **1100×800** e **800×700**, ispezionando sia le misure DOM sia 16 schermate acquisite nei seguenti stati:
- stato iniziale (`Ott. 0`, preset `Coppia Na–Cl (§8)`, tutti i toggle spenti) a 1440×900, 1100×800 e 800×700;
- i 4 pulsanti rapidi (`Ac. 0`, `Ott. 0`, `C (π/a)`, `B (π/a)`) a 1440×900;
- i 3 toggle (`Luce infrarossa`, `Confronto M = m`, `Matrice D(k)`) singolarmente a 1440×900 e **tutti e 3 accesi insieme** a 1440×900, 1100×800 e 800×700 (incluso lo scorrimento della colonna destra);
- i 4 preset (`Coppia Na–Cl`, `Masse M = 2m`, `Limite M = m` con `Luce infrarossa` attiva, `Contrasto forte Li–I`);
- hover bidirezionale su Formula viva (termini `C`, `ω_-`, `ω_+`) e trascinamento/cambio su slider (`Massa M`);
- controlli di riproduzione (`Pausa` / `Avvia`, velocità `0,25×`–`2×`, `Ripristina fase`).

### 1.2 Misure DOM e impaginazione alle tre risoluzioni

| Risoluzione | Stato toggle | `document` scroll (`dx`, `dy`) | `main` scroll (`dx`, `dy`) | `aside` scroll (`dx`, `dy`) | `.live-formula` oltre `<aside>` | Barra comandi |
|---|---|---|---|---|---|---|
| **1440×900** | Tutti OFF | `0`, `0` | `0`, `0` | `0`, `1072,8 px` | `0 / 10` (`right ≤ 1404,8 / 1440`) | 1 riga (`h = 49,4 px`) |
| **1440×900** | Tutti ON | `0`, `0` | `0`, `0` | `0`, `1668,0 px` | `0 / 14` (`right ≤ 1404,8 / 1440`) | 1 riga (`h = 49,4 px`) |
| **1100×800** | Tutti OFF | `0`, `0` | `0`, `0` | `0`, `1416,0 px` | `0 / 10` (`right ≤ 1064,8 / 1100`) | 2 righe (`h = 76,9 px`) |
| **1100×800** | **Tutti ON** | `0`, `0` | `0`, `0` | **`13,6 px` (OVERFLOW!)**, `2217,6 px` | `0 / 14` (`right ≤ 1064,8 / 1100`) | 2 righe (`h = 76,9 px`) |
| **800×700** | Tutti OFF | `0`, `0` | `0`, `45,6 px` | `0`, `1923,2 px` | `0 / 10` (`right ≤ 768,8 / 800`) | 2 righe (`h = 83,4 px`) |
| **800×700** | **Tutti ON** | `0`, `0` | `0`, `45,6 px` | **`59,2 px` (OVERFLOW!)**, `3089,6 px` | `0 / 14` (`right ≤ 768,8 / 800`) | 2 righe (`h = 83,4 px`) |

### 1.3 Altri controlli superati
- **Console browser**: **0 errori** JS/DOM/KaTeX durante l'intera sessione. Verifica statica aggiuntiva su `formulas.ts`, `strings.ts` e `PhononDiatomicSection.tsx`: nessun apostrofo tipografico (`’`) o carattere accentato dentro gli span TeX (`$...$` / `tex="..."`), quindi nessun sorgente di warning KaTeX strict-mode nella sezione.
- **Stile lavagna e colori**: fondo piatto `#0f1114` (`--bg`), linee sottili nette, nessun bagliore/ombra/3D decorativo; ricerca su tutta `src/renderer/src/sections/phonon-diatomic/*`: **0 codici colore hex/rgb/hsl hardcoded** fuori da `ui/theme.ts`. Mappa colore ↔ grandezza coerente tra formula, scena, slider e grafico (`M`, `m`, `C`, `a`, `k`, `u`/`α`, `ω_-`, `ω_+`, `v_s`/`v_g`, `v_p`, `lightLine`).
- **Legende**: esterne ai canvas tramite `ChartLegend` sia per la catena reale sia per il diagramma di dispersione.
- **Formule vive bidirezionali**: verificate live — hover su `[data-q="C"]` accende le molle nella catena, attenua il resto e porta lo slider `C` a `.param.is-active`; hover su `ω_-`/`ω_+` evidenzia il ramo corrispondente nel grafico attenuando l'altro; muovere lo slider `M` attiva `.has-hl` / pulse sui termini `M` nelle formule.
- **Animazioni, interpolazione e RAF a riposo**: i cambi di preset sono interpolati fluidamente (`useTweened` con `GLIDE`/`FOLLOW`); le ampiezze degli atomi sono limitate (`maxShift` in `DiatomicChainView.tsx:258`) così da non sovrapporsi nemmeno con forte contrasto `Li–I` né a 800×700; in pausa, su `Ac. 0` (`ω = 0`) o con `prefers-reduced-motion`, `DiatomicChainView` restituisce `false` da `useCanvasDraw` interrompendo il ciclo `requestAnimationFrame` (`DiatomicChainView.tsx:162-173`, `viz/canvas.ts:55-57`).

### 1.4 Cosa non è stato possibile verificare direttamente a runtime
- **`console.warn` via API browser**: il bridge `webview_browser` segnala gli errori console (`ConsoleErrors = 0`) ma non espone `page.on('console')` per i soli `console.warn`; la verifica di assenza di warning KaTeX è stata quindi completata tramite controllo statico di tutte le stringhe TeX della sezione.
- **`prefers-reduced-motion: reduce` live**: il browser subagent non ha emulato la media query OS a runtime; il comportamento è stato verificato sul codice di `PlaybackControls.tsx:74-93,176-183`, `DiatomicChainView.tsx:162` e `phonon-diatomic.css:122-126`.

---

## 2. Problemi trovati (in ordine di gravità)

### [BLOCCANTE] 1. Overflow orizzontale in `<aside>` con `Matrice D(k)` / `Luce infrarossa` attive a 1100×800 e 800×700 (valori numerici troncati)
- **Tipo**: Difetto oggettivo di impaginazione.
- **Elemento**: Pannello destro `<aside>` → tabella valori `<dl className="values">` (`PhononDiatomicSection.tsx:512-764`, `strings.ts:112, 115-116`, `phonon-diatomic.css`).
- **Risoluzione e stato**:
  - **1100×800**, con `Matrice D(k)` / tutti e 3 i toggle ON: compare la scrollbar orizzontale in `<aside>` (`dx = 13,6 px`) e i valori nella colonna destra vengono tagliati sul bordo (`ν_max^ac = 2,93 TH`, `ν_min^ott = 3,64 TH`, `Δν_gap = 0,71 T`, `ν_+(0) = 4,68 T`, `ħω_+ = 19,3 me`).
  - **800×700**, con `Matrice D(k)` / tutti e 3 i toggle ON: overflow orizzontale severo (`dx = 59,2 px`), scrollbar orizzontale marcata e l'intera colonna numerica risulta quasi completamente fuori schermo (`ν_max^ac =`, `v_s = 4,0`, `k = 0,`, `α = −1`).
  - **1440×900**, accendendo `Luce infrarossa` o `Matrice D(k)`: pur senza scrollbar orizzontale, l'intera colonna `<dd>` si restringe bruscamente provocando un salto visivo di tutte le righe superiori (`Bordi C / B e gap` passa da 2 a 3–4 righe).
- **Causa**: `.values` (`ui.css:588`) usa `grid-template-columns: minmax(0, auto) minmax(0, 1fr)`. Quando si accendono i toggle, vengono aggiunti due `<dt>` molto larghi su riga unica: `Matrice dinamica 2×2 (unità 10^{26} s^{-2})` (`PhononDiatomicSection.tsx:736-741`, `strings.ts:115-116`) e `Incrocio luce infrarossa (n = 1)` (`strings.ts:112`). La colonna `auto` si allarga fino alla loro larghezza `max-content` (~200 px), lasciando a `<dd>` troppo poco spazio per contenere gli `<span className="nowrap">` dei valori numerici (`ν_max^ac = 2,93 THz`), che quindi forzano l'overflow orizzontale di `<aside>`. *(Da notare che tutte le 14 `.live-formula` — incluse `.formula-main` e `.phonon-diat-matrix-formula` — restano invece ben contenute dentro `<aside>` a tutte le risoluzioni.)*
- **Come riprodurre**: Aprire la sezione a 1100×800 o 800×700 e attivare `Matrice D(k)` (o tutti e 3 i toggle).
- **Indicazione di correzione (locale alla sezione)**: Accorciare/andare a capo nei due `<dt>` (es. `Luce IR ($n = 1$)` e `Matrice $\mathbf{D}(k)$` con `<br /><span className="sub">($10^{26}\,\text{s}^{-2}$)</span>`) e fissare un limite massimo alla prima colonna in `phonon-diatomic.css` (es. `.phonon-diat-formula-panel .values { grid-template-columns: minmax(88px, 118px) minmax(0, 1fr); }`).

---

### [IMPORTANTE] 2. Sintassi Markdown cruda (`**...**` e `*...*`) renderizzata letteralmente in «Teoria in breve»
- **Tipo**: Difetto oggettivo di tipografia/rendering.
- **Elemento**: Pannello destro «Teoria in breve» (`src/renderer/src/sections/phonon-diatomic/strings.ts:126, 133, 139, 140, 147`, renderizzato via `<RichText text={p} />` in `PhononDiatomicSection.tsx:463`).
- **Risoluzione e stato**: Tutte le risoluzioni (1440×900, 1100×800, 800×700), tutti gli stati (visibile subito all'apertura).
- **Cosa è sbagliato**: Il componente condiviso `RichText` (`src/renderer/src/ui/tex.tsx:26-44`) interpreta esclusivamente le formule tra `$...$` e **non** il Markdown. Nel pannello «Teoria in breve» compaiono quindi asterischi letterali nel testo:
  - `**ramo acustico**`, `**ramo ottico**` (`strings.ts:126`)
  - `**velocità di gruppo negativa**` (`strings.ts:133`)
  - `*un*`, `**C**`, `**B**` (`strings.ts:139`)
  - `**gap fononico**`, `**ripiegato**` (`strings.ts:140`)
  - `**ramo ottico a $k \approx 0$**` (`strings.ts:147`)
- **Come riprodurre**: Aprire la sezione a 1440×900 e guardare il secondo paragrafo di «Teoria in breve» nella colonna destra.
- **Indicazione di correzione**: Rimuovere gli asterischi Markdown da `strings.ts` (oppure renderizzare i testi con testo semplice / enfasi semantica supportata dal progetto).

---

### [IMPORTANTE] 3. La retta acustica tratteggiata $\nu = v_s |k|/2\pi$ attraversa l'etichetta «gap fononico» nel grafico di dispersione
- **Tipo**: Difetto oggettivo di leggibilità su canvas.
- **Elemento**: Diagramma di dispersione (`DispersionPlot`, configurato da `PhononDiatomicSection.tsx:127-157`).
- **Risoluzione e stato**: 1440×900, 1100×800 e 800×700 nello stato predefinito (`Confronto M = m` spento, preset `Coppia Na–Cl` e `Masse M = 2m`).
- **Cosa è sbagliato**: In `DispersionPlot.tsx:402` le fasce orizzontali (inclusa l'etichetta `gap fononico` sul lato sinistro) vengono disegnate prima delle `referenceLines`. Poiché in `PhononDiatomicSection.tsx:147` la retta acustica `ν = v_s |k| / 2π` è prolungata fino a `0,96 · ν_+(0)` (ben dentro il gap), la linea tratteggiata verde acqua passa letteralmente sopra le lettere di `gap fononico`. *(Con `Confronto M = m` acceso il problema sparisce perché l'asse si estende a `±2π/a` e l'etichetta resta fuori dalla retta.)*
- **Come riprodurre**: Stato iniziale della sezione a qualsiasi risoluzione.
- **Indicazione di correzione**: In `PhononDiatomicSection.tsx:147`, limitare `yCap` della retta acustica vicino al bordo inferiore del gap (es. `model.summary.freqAcousticMaxThz * 0.96` o `0.98`, dove l'approssimazione lineare acustica cessa comunque di valere), così la retta non invade la fascia del gap e non taglia l'etichetta `gap fononico`.

---

### [MINORE] 4. Matrice numerica 2×2 non allineata a destra e autovalore $\omega_+^2$ spezzato su due righe
- **Tipo**: Difetto oggettivo di allineamento tabulare / a-capo.
- **Elemento**: Blocco valori `Matrice dinamica 2×2` in `<aside>` (`PhononDiatomicSection.tsx:743-760`, `phonon-diatomic.css:109-120`).
- **Risoluzione e stato**: 1440×900 (e inferiori) con toggle `Matrice D(k)` attivo.
- **Cosa è sbagliato**:
  1. In `.phonon-diat-matrix-grid` le 4 celle (`3,39`, `-4,22`, `-4,22`, `5,24`) non hanno `text-align: right` né `minmax(...)` sulle colonne: il segno meno sposta l'allineamento verticale delle virgole tra riga 1 e riga 2 e fa oscillare leggermente la larghezza della matrice durante il trascinamento di `k` o degli slider.
  2. Sotto la matrice, in `PhononDiatomicSection.tsx:750-760`, lo `<span className="nowrap">` avvolge solo `<Num>` invece dell'intera coppia `ω_+^2 = <Num>`: a 1440×900 si legge `ω_-^2 = 0,00 · ω_+^2 =` su una riga e `8,63` da solo a capo.
- **Come riprodurre**: Attivare `Matrice D(k)` a 1440×900 e osservare l'ultima voce in basso di `Formula viva`.

---

### [MINORE] 5. Contraddizione nella testatina della catena nel preset `Limite M = m` con `Luce infrarossa` attiva
- **Tipo**: Difetto oggettivo di coerenza visiva/testuale.
- **Elemento**: Hint in alto a destra della vista «Spazio reale — catena biatomica 1D» (`PhononDiatomicSection.tsx:299-302`, `strings.ts:74`).
- **Risoluzione e stato**: Tutte le risoluzioni, preset `Limite M = m (gap chiuso)` su modo `Ott. 0` con `Luce infrarossa` attiva.
- **Cosa è sbagliato**: Nel canvas della catena compaiono correttamente gli atomi senza cariche e la scritta `p = 0`, e nei valori a destra la nota spiega che con `M = m` non si genera dipolo IR; tuttavia nella testatina in alto sopra la catena resta scritto in arancione `opposizione di fase (R_cm = 0, dipolo IR)`.
- **Come riprodurre**: Attivare `Luce infrarossa`, selezionare `Limite M = m` mantenendo `Ott. 0`.

---

### [MINORE] 6. Spazio vuoto eccessivo dopo parentesi aperta e separatori `·` orfani nei `<dd>` di `.values`
- **Tipo**: Difetto minore / rifinitura tipografica.
- **Elemento**: Tabella valori `.values` (`PhononDiatomicSection.tsx:524, 545, 564, 573, 588, 768-774`).
- **Risoluzione e stato**: Tutte le risoluzioni (più evidente a 1100×800 e 800×700).
- **Cosa è sbagliato**:
  1. `<Num>` applica `minWidth: 4ch` / `5ch` con allineamento a destra anche subito dopo una parentesi aperta, generando vuoti visivi come `(   2,9 meV)` e `(  0,00 Å⁻¹)`.
  2. Quando due `<span className="nowrap">` separati da `{' · '}` vanno a capo, il punto medio `·` resta appeso a fine riga (`2,93 THz ·` / `4,05 km/s ·`) o, su colonne strette, finisce isolato su una propria riga.

---

### [MINORE] 7. Compressione verticale del canvas della catena a 800×700 con `Luce infrarossa` attiva
- **Tipo**: Preferenza / rifinitura su viewport minima.
- **Elemento**: Vista «Spazio reale — catena biatomica 1D» (`DiatomicChainView.tsx:260-267`, `phonon-diatomic.css:12-30`).
- **Risoluzione e stato**: 800×700 con `Luce infrarossa` attiva.
- **Cosa si osserva**: Aggiungendo la voce `dipolo ionico p(t)` la legenda della catena va su 2 righe, portando la fascia di controlli a 3 righe totali e riducendo il canvas della catena a `68,9 px` di altezza. Gli atomi restano puliti e non si toccano, ma le frecce `u_n` sfiorano il dipolo `p(t)` in alto e le quote `a/2` e `a` in basso risultano molto compresse. A 800×700 anche il marcatore `incrocio IR (k ≈ 0)` su `DispersionPlot` con `Confronto M = m` acceso si trova molto vicino al cursore `Ott. 0` (`k = 0`), pur rimanendo leggibile.

---

## 3. Le due cose riuscite meglio

1. **Gerarchia visiva e leggibilità della catena reale 1D collegata al grafico**: lo stile lavagna `#0f1114` è impeccabile — i due atomi $M$ (blu) e $m$ (rosa), le molle $C$ (corallo), le frecce $u_n(t)$ (verde acido), il rombo del centro di massa $R_{\mathrm{cm}}$ (immobile nel modo ottico a $k = 0$) e il passaggio istantaneo ai segni ionici `+`/`−` con dipolo $\mathbf{p}(t)$ quando si attiva «Luce infrarossa» rendono i quattro modi di Fig. 12 immediatamente comprensibili a colpo d'occhio, con i 4 pulsanti rapidi `Ac. 0`, `Ott. 0`, `C (π/a)`, `B (π/a)` e `PlaybackControls` integrati in modo compatto ed elegante.
2. **Formule vive bidirezionali e impaginazione delle 14 formule KaTeX**: l'hover su un qualsiasi simbolo nella colonna destra (es. $C$, $\omega_-$, $\omega_+$) accende simultaneamente la curva/molla in scena e lo slider corrispondente attenuando tutto il resto, e la suddivisione scalata delle formule (incluse l'eq. (20) principale e la matrice dinamica $\mathbf{D}(k)$) mantiene **zero overflow su tutte le `.live-formula`** persino a 800×700.

---

## 4. Verdetto

**DA CORREGGERE**

Prima dell'approvazione occorre risolvere:
1. l'overflow orizzontale di `<aside>` a 1100×800 e 800×700 causato dai `<dt>` troppo larghi in `.values` con `Matrice D(k)` / `Luce infrarossa` attive (**Bloccante**);
2. gli asterischi Markdown letterali (`**...**`, `*...*`) in «Teoria in breve» (**Importante**);
3. la retta acustica tratteggiata che taglia l'etichetta `gap fononico` nel grafico di dispersione (**Importante**).
Si raccomanda di cogliere l'occasione per sistemare anche l'allineamento della matrice numerica 2×2, il `nowrap` su $\omega_+^2$ e la testatina `dipolo IR` per $M = m$.
