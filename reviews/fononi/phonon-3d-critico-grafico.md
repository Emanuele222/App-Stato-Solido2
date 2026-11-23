# Revisione grafica e usabilità — Sezione 3 Fononi (`phonon-3d`)

**Sezione esaminata**: `Fononi › Rami 3D, polarizzazioni e cristalli reali` (`src/renderer/src/sections/phonon-3d/`)  
**URL testato**: `http://127.0.0.1:5173/` (app compilata servita in locale)  
**Risoluzioni verificate**: **1440×900**, **1100×800**, **800×700**  
**Ruolo**: `critico-grafico` (sola lettura su `src/`)

---

## 1. Sintesi delle verifiche eseguite

### 1.1 Ispezione live nel browser e screenshot
L'app in esecuzione è stata ispezionata nel browser alle tre risoluzioni **1440×900**, **1100×800** e **800×700**, analizzando misure DOM e schermate nei seguenti stati:
- **HomeScreen (`1440×900`)**: stato a riposo della card **Fononi** (`6 sezioni`, grafico `-π/a` ÷ `π/a`) e anteprima espansa all'hover (`2/6 Catena biatomica` nello scatto salvato, con l'elenco delle 6 sezioni in cui `3. Rami 3D e cristalli reali` è attiva tra le prime 3 e `4..6` attenuate; configurazione della slide `3/6` verificata in `src/renderer/src/home/curves.ts:380-408`).
- **Stato iniziale (`PbTe`, `THz`, `Γ–X: LO`)** alle tre risoluzioni `1440×900`, `1100×800` e `800×700`.
- **Cambio cristallo (`1440×900`)**: **Alluminio** (`fcc, p = 1`, `meV`, solo 3 rami acustici e 5 salti rapidi, slider `ω_LO/ω_TO` nascosto) e **Diamante** (`fcc C–C, p = 2`, `meV`, 6 rami con ottici degeneri a `160 meV`).
- **Toggle `Unità: THz / meV`** su `PbTe` (verificato sia subito dopo la commutazione sia dopo assestamento completo su `0–14 meV`).
- **Toggle `Conteggio modi 3D (1BZ)`** con Fig. 17 + cella convenzionale/primitiva fcc e **Stepper `N`** (`8 → 10 → 9`) a `1440×900`, `1100×800` e `800×700`.
- **Pulsanti rapidi dei rami**: tutti e 6 su `PbTe` (`Γ–X: LA`, `Γ–X: TA (2×)`, `K–Γ: TA₁`, `K–Γ: TA₂`, `Γ–X: LO`, `Γ–X: TO (2×)`) e i 5 su `Alluminio` (incluso `X–K: misto`).
- **Controlli di riproduzione (`PlaybackControls`)**: `Pausa` / `Avvia`, velocità `0,5×` e `1×`, ripristino fase.
- **Formule vive bidirezionali (`[data-q]`) e slider**: hover su `M`, `k`, `C` ($\Phi_{\alpha i,\beta j}$) in Formula viva; hover e trascinamento su `C_T/C_L` e `ω_LO/ω_TO`; spostamento di `k` via tastiera (`ArrowRight`).

### 1.2 Misure DOM alle tre risoluzioni (`PbTe`)

| Risoluzione | Stato toggle | Scroll pagina (`document`) | `<main>` (`w×h`, scroll) | `<aside>` (`w×h`, overflow X) | `.values` (`w×h`) | Topbar (`h`, righe) | Barra parametri (`h`) |
|---|---|---|---|---|---|---|---|
| **1440×900** | Iniziale (`THz`, Conteggio OFF) | `0, 0` (assente) | `820×900` (0 scroll) | `400×900`, **`0` overflow X** | `344×245,23` (`0` overflow) | `49 px` (1 riga) | `132,5 px` (1 riga slider) |
| **1440×900** | Conteggio modi 3D ON (`N = 8/9`) | `0, 0` (assente) | `820×900` (0 scroll) | `400×900`, **`0` overflow X** | `344×334,7` (`0` overflow) | `53 px` (1 riga) | `132,5 px` (1 riga slider) |
| **1100×800** | Iniziale (`THz`, Conteggio OFF) | `0, 0` (assente) | `540×800` (0 scroll) | `360×800`, **`0` overflow X** | `304×285,11` (`0` overflow) | `76,5 px` (2 righe) | `191,8 px` (2 righe slider) |
| **1100×800** | Conteggio modi 3D ON (`N = 9`) | `0, 0` (assente) | `540×800` (0 scroll) | `360×800`, **`0` overflow X** | `304×412,95` (`0` overflow) | `80,5 px` (2 righe) | `191,8 px` (2 righe slider) |
| **800×700** | Iniziale (drawer chiuso) | `0, 0` (scroll interno a `<main>`) | `490×700` (contenuto `731,3 px`, scroll Y previsto) | `310×700`, **overflow X (`+18,0 px`)** | `262×378,11` (2 righe sforano) | `83 px` (2–3 righe) | `168,3 px` (2 righe slider) |
| **800×700** | Conteggio modi 3D ON (`N = 9`) | `0, 0` (scroll interno a `<main>`) | `490×700` (contenuto `769,3 px`, scroll Y previsto) | `310×700`, **overflow X attiva** | overflow su `Riferimento Tab. 1` | `121 px` (3 righe) | `168,3 px` (2 righe slider) |

### 1.3 Altri controlli superati
- **Console e KaTeX**: **0 errori** runtime (`ConsoleErrors = 0`) lungo tutta la sessione e **0 elementi `.katex-error`** nel DOM in ogni stato e cristallo. Verifica statica su `formulas.ts`, `strings.ts` e `Phonon3DSection.tsx`: nessun apostrofo tipografico in TeX, nessun Markdown crudo `**...**` o `*...*` nei testi di `RichText`.
- **Stile lavagna e tabella colori `ui/theme.ts`**: fondo piatto `#0f1114` (`TOKENS.bg`), linee sottili e nette, nessun bagliore o effetto 3D decorativo; **0 codici colore hex/rgb/hsl hardcoded** nei file di `src/renderer/src/sections/phonon-3d/`. Mappatura coerente tra formula, scena 3D, grafico e controlli (`omega`, `omegaOpt`, `acousticTransverse`, `opticalTransverse`, `k`, `a`, `C`, `M`, `m`, `u`, `realPartWave` per il secondo sottoreticolo del diamante).
- **Legende e cifre tabulari**: legende esterne tramite `ChartLegend` sia nella scena 3D sia in `DispersionPlot`; `font-variant-numeric: tabular-nums` e `<Num>` mantengono la larghezza di `.values` identica al sub-pixel (`344 × 245,23 px`) durante cambi di unità (`THz ↔ meV`), slider e movimento di `k`.
- **Formule vive bidirezionali**: hover su `[data-q="M"]`, `[data-q="k"]` e `[data-q="C"]` attiva `.has-hl` nelle formule, evidenzia i vettori/atomi corrispondenti nei canvas e accende `.param.is-active` sullo slider `C_T/C_L`.

### 1.4 Cosa non è stato possibile verificare direttamente a runtime
- **Stream `console.warn`**: il bridge `webview_browser` espone il contatore degli errori runtime (`ConsoleErrors = 0`) ma non cattura separatamente eventuali `console.warn` non fatali di React o KaTeX; l'assenza di sorgenti di warning KaTeX è stata verificata staticamente in `formulas.ts` e `strings.ts`.
- **`prefers-reduced-motion: reduce` live**: `page.emulateMedia` non è supportata dal runtime `webview_browser`. Il comportamento è stato verificato nel codice di `PlaybackControls.tsx:74-93, 170-188` (`effectivePlaying = playing && !reducedMotion`), `Polarization3DView.tsx:214, 570` (`phaseT = 0.35`, ritorno `false` da `useCanvasDraw` per fermare `requestAnimationFrame`), `ModeCounting3DView.tsx:268` (sempre `false`, zero cicli RAF attivi) e `phonon-3d.css:105-109`.
- **Scatto esatto `3/6` su `HomeScreen`**: il subagent ha riferito la verifica visiva su `3/6 Rami 3D e cristalli` (`Γ X K Γ L` integri), ma l'immagine salvata prima della transizione mostra il fotogramma `2/6 Catena biatomica` (con la voce `3. Rami 3D e cristalli reali` correttamente visibile e allineata nella lista sottostante).

---

## 2. Problemi trovati (in ordine di gravità)

### [IMPORTANTE] 1. Overflow orizzontale in `<aside>` a `800×700` nella riga «Riferimento Tab. 1»
- **Tipo**: Difetto oggettivo di impaginazione.
- **Elemento**: Colonna destra `<aside>` → `<dl className="values">` → riga `Riferimento Tab. 1` (`src/renderer/src/sections/phonon-3d/Phonon3DSection.tsx:629-641`, `phonon-3d.css:95-97`).
- **Risoluzione e stato**: **800×700**, stato iniziale **PbTe** (sia con `Conteggio modi 3D` spento sia acceso). A `1440×900` e `1100×800` l'overflow orizzontale è `0 px`.
- **Cosa è sbagliato**: A `800×700`, `<aside>` è largo `310 px` (area interna utile `294 px`, bordo destro `785 px`). La colonna `<dt>` occupa fino a `102 px` + `14 px` di gap, lasciando `~160–170 px` a `<dd>`. I due `<span className="nowrap">` che racchiudono per intero `LO(Γ) = 3,30 THz (13,6 meV)` (`width = 172,8 px`, `right = 795,8 px`) e `TO₁,₂(Γ) = 1,10 THz (4,5 meV)` (`width = 180,0 px`, `right = 803,0 px`) sforano rispettivamente di `+10,8 px` e `+18,0 px`, facendo comparire la scrollbar orizzontale in `<aside>` e troncando `meV)` sul bordo destro.
- **Come riprodurre**: Aprire `phonon-3d` a `800×700` nello stato predefinito (`PbTe`, chiudere il drawer sinistro) e osservare `<aside>` in corrispondenza di `Riferimento Tab. 1` e del fondo del pannello.
- **Indicazione di correzione**: Spezzare `<span className="nowrap">` tra il valore principale e l'unità convertita tra parentesi (es. `<span className="nowrap">... = 3,30 THz</span> <span className="nowrap">(13,6 meV)</span>` in `Phonon3DSection.tsx:629-641`).

---

### [IMPORTANTE] 2. Testi del bilancio fcc troncati sul bordo destro del canvas in `ModeCounting3DView` a `1100×800` e `800×700`
- **Tipo**: Difetto oggettivo di leggibilità su canvas.
- **Elemento**: Pannello destro «Cella convenzionale vs primitiva (fcc)» (`src/renderer/src/sections/phonon-3d/ModeCounting3DView.tsx:159-160, 234-260`).
- **Risoluzione e stato**: **1100×800** e **800×700**, con toggle **Conteggio modi 3D (1BZ)** attivo (`N = 9`, `PbTe`). A `1440×900` tutti i testi sono integri.
- **Cosa è sbagliato**: Con `splitX = w * 0.52` e `infoX = splitX + rightW * 0.62`, a `1100×800` (`w = 540 px`, `rightW ≈ 259 px`) restano meno di `99 px` tra `infoX` e il margine destro del canvas. Le righe disegnate a sinistra di `infoX` vengono tagliate sul bordo destro: `fcc: N_c = 4N³ = 291` (manca `6`), `3p = 6 (3 ac. + 3 ott.` (manca `)`), `3p·N_c = 17.496 mo` (manca `di`). A `800×700` il taglio è ancora più marcato (`v_c = a³/4 = 67,4`, `fcc: N_c = 4N³ = 2`, `3p = 6 (3 ac. + 3 c`, `3p·N_c = 17.496 m`).
- **Come riprodurre**: Attivare `Conteggio modi 3D (1BZ)` (e portare eventualmente `N = 9`) alle risoluzioni `1100×800` o `800×700`.
- **Indicazione di correzione**: Spostare leggermente a sinistra il cubo fcc (`cubeCx = splitX + rightW * 0.28`, `cubeSize` scalato) e iniziare il blocco testuale più a sinistra (es. `infoX = splitX + rightW * 0.50` o calcolato in base alla larghezza misurata delle righe con `ctx.measureText` e riducendo il font da `11 px` a `10 px` quando `rightW < 270`).

---

### [IMPORTANTE] 3. Sovrapposizione tra l'etichetta del modo (`TA1` / `LO`) e la triade vettoriale (`k` / `εˢ`) in `Polarization3DView` a `800×700`
- **Tipo**: Difetto oggettivo di leggibilità su canvas.
- **Elemento**: Pannello destro (triade vettoriale `k` e `εˢ`) di `src/renderer/src/sections/phonon-3d/Polarization3DView.tsx:454-457, 483-568`.
- **Risoluzione e stato**: **800×700**, con `Conteggio modi 3D` spento (verificato su `Γ–X: LO` e `K–Γ: TA₁` in `THz` e `meV`).
- **Cosa è sbagliato**: A `800×700`, la barra sopra il canvas (legenda + 6 pulsanti rapidi + `PlaybackControls`) va su più righe, lasciando al canvas un'altezza `h` ridotta (~`95–110 px`). Poiché `triadCy = h * 0.44` non sottrae la fascia inferiore occupata dalle due righe riassuntive (`mode.role` a `h - 26` e `relStr` a `h - 10`), la sigla `LO` / `TA1` a `h - 26` si sovrappone direttamente alla punta del vettore `k` e alle etichette `k` / `εˢ`.
- **Come riprodurre**: Aprire `phonon-3d` a `800×700` (anche con drawer chiuso) e osservare il mini riquadro della triade vettoriale a destra della vista 3D.
- **Indicazione di correzione**: Riservare un'area footer dedicata (`footerH = 38`) nel calcolo di `triadCy` e `triadScale`: es. `const usableH = Math.max(40, h - 38); const triadCy = usableH * 0.48; const triadScale = Math.min(rightW * 0.32, usableH * 0.34, 56)`.

---

### [MINORE] 4. L'etichetta `k_y` sfiora il sottotitolo della griglia in `ModeCounting3DView`
- **Tipo**: Difetto oggettivo di leggibilità su canvas.
- **Elemento**: Pannello sinistro «Griglia 2D in 1BZ» in `src/renderer/src/sections/phonon-3d/ModeCounting3DView.tsx:60-73, 95-96`.
- **Risoluzione e stato**: **1440×900**, **1100×800** e **800×700** con `Conteggio modi 3D (1BZ)` attivo.
- **Cosa è sbagliato**: Il titolo `Griglia 2D in 1BZ (N = ..., N² = ... punti)` ha baseline a `y = 16`, mentre `padTop = 26` posiziona `k_y` a `gy0 - 8 = 18` e l'estremità superiore dell'asse a `gy0 - 12 = 14`: a tutte le risoluzioni `k_y` tocca il margine inferiore del titolo (a `1440×900` sfiora `N = 9,`).
- **Come riprodurre**: Attivare `Conteggio modi 3D (1BZ)` a qualsiasi risoluzione e osservare la cima dell'asse verticale della griglia 2D a sinistra.
- **Indicazione di correzione**: Aumentare `padTop` da `26` a `34–36` oppure collocare l'etichetta `k_y` leggermente più in basso (`gy0 + 2`).

---

### [MINORE] 5. Leggero contatto tra le etichette `TA₁` e `TA₂` lungo `K–Γ` a `1100×800`
- **Tipo**: Difetto minore di leggibilità su canvas.
- **Elemento**: `DispersionPlot`, tag su `K–Γ` (`src/renderer/src/sections/phonon-3d/Phonon3DSection.tsx:145-149`).
- **Risoluzione e stato**: **1100×800**, `PbTe` (`THz` e `meV`). A `1440×900` le etichette restano ben distinte.
- **Cosa è sbagliato**: Sul tratto stretto `K–Γ` a `1100×800`, `TA₁` (`pos = 0.36`) e `TA₂` (`pos = 0.58`) arrivano quasi a toccarsi verticalmente.
- **Come riprodurre**: Visualizzare `PbTe` a `1100×800` e osservare i rami verdi lungo il terzo segmento `K–Γ`.
- **Indicazione di correzione**: Separare maggiormente le posizioni lungo il segmento (`0.30` per `TA₁` e `0.66` per `TA₂`).

---

### [MINORE] 6. Sfasamento transitorio tra curve e scala verticale al cambio di unità (`THz ↔ meV`) o cristallo
- **Tipo**: Imperfezione visiva transitoria (comportamento ereditato dal componente condiviso `DispersionPlot`).
- **Elemento**: `src/renderer/src/viz/DispersionPlot.tsx:218, 240` + `src/renderer/src/sections/phonon-3d/model.ts:160-161`.
- **Risoluzione e stato**: Tutte le risoluzioni al clic su `Unità: THz ↔ meV` o al cambio tra cristalli su scale molto diverse (es. `Diamante 160 meV` → `PbTe 13,6 meV`).
- **Cosa è sbagliato**: Al cambio di unità o di cristallo, `plotBranches` assume subito i nuovi valori numerici mentre `anim.yMax` in `DispersionPlot` insegue `yRange[1]` con `Smoothed(..., 0.16)` senza snap: passando da `THz` (`3,77`) a `meV` (`15,6`) le curve oltrepassano temporaneamente il bordo superiore per ~200 ms; passando da `Diamante` (`182 meV`) a `PbTe` (`15,6 meV`) i rami restano schiacciati in basso sotto un asse ancora a `~44 meV` per ~0,8–1 s prima di assestarsi su `0–14 meV`.

---

### [MINORE] 7. Comportamenti della shell condivisa a `1100×800` e `800×700`
- **Tipo**: Osservazione di usabilità/preferenza su shell condivisa (fuori dai file di `phonon-3d`).
- **Elemento**: Drawer `<nav>` (`ui.css:682-702`) e barra parametri inferiore (`Phonon3DSection.tsx:280-307`).
- **Risoluzione e stato**:
  - A **`800×700`**, ridimensionando da viewport larga a stretta, il drawer `<nav>` resta aperto sopra la metà sinistra di `<main>` coprendo i pulsanti rapidi finché non viene chiuso manualmente; il comportamento di scroll verticale di `<main>` (`731–769 px` in `700 px`) è invece conforme a `@media (max-height: 740px)` e alla regola della skill.
  - A **`1100×800`**, la fascia parametri inferiore va su 2 righe (`191,8 px`) complici il menu `Cristallo (Tab. 1)` con etichetta su 3 righe e i due slider. L'impaginazione resta comunque priva di scrollbar di pagina.

---

## 3. Le due cose riuscite meglio

1. **Collegamento immediato tra blocchi atomici 3D, triade vettoriale (`k`, `εˢ`) e cammino `Γ–X–K–Γ–L`**: la proiezione isometrica piatta e pulita della cella e dei vettori `k` / `εˢ`, unita ai pulsanti rapidi (`Γ–X`, `K–Γ: TA₁/TA₂`, `X–K: misto`), rende visivamente evidente la natura longitudinale, trasversale, degenere o mista di ciascun modo nello stile rigoroso da «lavagna animata», senza shader né dipendenze 3D pesanti.
2. **Coerenza cromatica, cifre tabulari e formule vive sotto vincoli di spazio stretti**: zero codici colore fuori da `ui/theme.ts`, scala adattiva della formula principale (`.phonon-3d-formula-panel .formula-main`) che mantiene `0` overflow orizzontali in `<aside>` a `1440×900` e `1100×800` anche con le 3 formule aggiuntive di Born–von Kármán accese, e stabilità sub-pixel della tabella `.values` al cambio di unità (`THz ↔ meV`), `k` e slider.

---

## 4. Verdetto

**da correggere**

La sezione è molto solida a `1440×900` e nella resa fisica e didattica, ma richiede tre interventi mirati prima dell'approvazione finale:
1. evitare l'overflow orizzontale su `<aside>` in `Riferimento Tab. 1` a `800×700`;
2. impedire il troncamento a destra del bilancio numerico fcc in `ModeCounting3DView` a `1100×800` e `800×700`;
3. separare verticalmente la triade vettoriale dal testo riassuntivo `mode.role` in `Polarization3DView` a `800×700` (più i ritocchi minori su `k_y` in `ModeCounting3DView` e `TA₁/TA₂` a `1100×800`).
