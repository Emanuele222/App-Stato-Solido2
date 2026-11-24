# Revisione grafica e usabilità — Sezione 4 Fononi (`phonon-wavepacket`)

**Sezione esaminata**: `Fononi › Pacchetti d’onda: fase e gruppo` (`src/renderer/src/sections/phonon-wavepacket/`)  
**Risoluzioni verificate**: **1440×900**, **1100×800**, **800×700**  
**Ruolo**: `critico-grafico` (sola lettura su `src/`)

---

## 1. Sintesi delle verifiche eseguite

### 1.1 Ispezione delle schermate e dati DOM
Sono state ispezionate le 7 schermate acquisite dal browser alle tre risoluzioni di riferimento:
- **1440×900**:
  - stato iniziale (`Ramo acustico dispersivo`, `k₀ = 0,66 π/a`, `σ₀ = 3,0 a`);
  - `Ramo ottico v_g < 0` (`k₀ = 0,66 π/a`, `σ₀ = 3,0 a`);
  - `Quadratico` (`k₀ = 0,66 π/a`, `σ₀ = 3,0 a`);
  - `Bordo di zona k₀ = π/a` (`k₀ = 1,00 π/a`, `σ₀ = 3,0 a`);
  - trascinamento vicino a `k₀ = 0,00 π/a` sul ramo acustico (`σ₀ = 3,0 a`).
- **1100×800**: stato iniziale (`Ramo acustico dispersivo`).
- **800×700**: stato iniziale (`Ramo acustico dispersivo`).

Dati verificati dal DOM inspector del browser:
- **Console e KaTeX**: `ConsoleErrors = 0`, **0 errori KaTeX** su 78 nodi `.katex`.
- **Overflow pagina (`html`/`body`)**: **nessun overflow orizzontale** a nessuna delle tre risoluzioni.
- **Overflow `.aside`**: scrollbar orizzontale presente a tutte e tre le risoluzioni (`scrollWidth > clientWidth`: **+67 px** a 1440×900, **+26 px** a 1100×800, **+72 px** a 800×700).
- **Barra parametri (`.params`)**: 2 righe di controlli + riga nota a 1440×900; va su **3 righe** (+ nota) a 1100×800 e 800×700.

### 1.2 Verifiche sul codice e sullo stile
- **Stile lavagna**: sfondo piatto `#0f1114` (`--bg`), linee nette, nessun bagliore, ombra o effetto 3D decorativo; due viste ben separate (`Spazio reale — pacchetto Ψ(x, t) e atomi` + mini-grafico `σ(t)/σ₀`, e `Dispersione ν(k) = ω(k)/2π`) con legende `ChartLegend` esterne ai canvas.
- **Assenza di colori hardcoded**: ricerca su tutti i file di `src/renderer/src/sections/phonon-wavepacket/` — **0 codici hex / rgb / hsl** fuori da `src/renderer/src/ui/theme.ts`.
- **Coerenza «1 colore = 1 grandezza»**: `a` (`#58c4dd`), `k` (`#f4d345`), `psi` (`#dc75cd`), `u` (`#c9e663`), `v` (`#5cd0b3`), `vp` (`#c49bff`), `omega` (`#72d67c`), `omegaOpt` (`#f59e56`), `Ek` (`#aab1bb`) sono rispettati in canvas, legenda, slider e tabella valori (salvo la nota minore su `\omega` in `MAIN_FORMULA`, §2.7).
- **Controlli di riproduzione e `rAF`**: `WavepacketView.tsx` usa `PlaybackControls` + `usePlaybackPhase` (Play/Pausa, `0,25×`–`2×`, Reset `t = 0`). Nei canvas `WavepacketView.tsx:97,108` restituisce `playback.effectivePlaying`, arrestando il ciclo `requestAnimationFrame` quando in pausa o quando `prefers-reduced-motion` è attivo (`PlaybackControls.tsx:76,176`).

### 1.3 Cosa non è stato possibile verificare dalle sole schermate
- Interazione live in **hover** sui termini della formula e sugli slider, e verifica visiva in movimento del **pulse** su `LiveFormula` e della fluidità di `useTweened` (`FOLLOW` / `GLIDE`).
- Stato visivo live del pulsante **Play/Pausa** con `prefers-reduced-motion: reduce` emulato e arresto effettivo dei frame nel profiler.
- Eventuali `console.warn` di KaTeX strict-mode (non inclusi nel conteggio `ConsoleErrors = 0`, ma il controllo statico su `formulas.ts` e `strings.ts` non rileva apostrofi tipografici né caratteri accentati in TeX).

---

## 2. Problemi trovati (in ordine di gravità)

### [BLOCCANTE] 1. Formula principale troncata a destra e scrollbar orizzontale in `.aside` a tutte le risoluzioni
- **Tipo**: Difetto oggettivo di impaginazione e leggibilità.
- **Elemento**: Colonna destra `.aside` → pannello `Formula viva` → `.formula-main` (`formulas.ts:29-30`, `phonon-wavepacket.css:103-112`).
- **Risoluzione e stato**: **1440×900**, **1100×800** e **800×700**, in **tutti gli stati** (confermato dal DOM inspector: `+67 px` a 1440×900, `+26 px` a 1100×800, `+72 px` a 800×700).
- **Cosa è sbagliato**: La formula principale $\Psi(x,t) = \frac{1}{\sqrt{2\pi}}\int_{-\infty}^{+\infty}\Phi(k)e^{i[kx-\omega(k)t]}\,\mathrm{d}k \simeq e^{i(k_0 x-\omega_0 t)} F(x-v_g t)$ è troppo larga per la colonna destra anche con `clamp(0.70rem, 0.96vw, 0.88rem)`. Avendo `overflow-x: visible` su `.formula-main` (`phonon-wavepacket.css:105`), la formula forza l'overflow orizzontale sull'intera `.aside` (`overflow: auto`), facendo comparire una scrollbar orizzontale persistente in fondo al pannello destro e tagliando via proprio la parte concettualmente decisiva `≃ e^{i(k₀x−ω₀t)} F(x − v_g t)`:
  - a **1440×900** si legge solo fino a `F` (manca `(x − v_g t)`);
  - a **1100×800** si taglia su `F(x -`;
  - a **800×700** si taglia dentro l'esponente `e^{i(k_0 x - ω_0 t`.
  Inoltre, a **800×700**, la formula del regime acustico in `.formula-edge` va a capo spezzando l'equazione subito dopo il segno `=` (`ω''(π/a) =` su una riga e `− a²ω_max/4` sotto).
- **Come riprodurre**: Aprire la sezione a qualsiasi risoluzione (1440×900, 1100×800 o 800×700) e osservare la prima riga di `Formula viva` e la barra di scorrimento orizzontale in basso in `.aside`.
- **Indicazione di correzione**: Spezzare `MAIN_FORMULA` su due righe KaTeX (`\begin{aligned} ... \\ &\simeq e^{i(k_0 x - \omega_0 t)}\,F(x - v_g t)\end{aligned}`) oppure separare definizione integrale e fattorizzazione asintotica in due blocchi distinti, mantenendo un `font-size` leggibile e zero `overflow-x` in `.aside`.

---

### [IMPORTANTE] 2. Macro LaTeX `\text{ Å}` stampata letteralmente come `a = 2,50 |text{Å}` nel canvas della scena reale
- **Tipo**: Difetto oggettivo di rendering su canvas.
- **Elemento**: Quota del passo reticolare `a` in basso a sinistra del canvas principale (`src/renderer/src/sections/phonon-wavepacket/WavepacketView.tsx:427`).
- **Risoluzione e stato**: **1440×900**, **1100×800** e **800×700**, in tutti e 3 i regimi con reticolo discreto (`Lineare`, `Ramo acustico`, `Ramo ottico v_g < 0`).
- **Cosa è sbagliato**: La chiamata `drawMathText(ctx, `a = ${formatNumber(a, 2)}\\text{ Å}`, ...)` passa una stringa con `\text{ Å}` a `drawMathText` (`src/renderer/src/viz/canvas.ts:159`), che non interpreta macro LaTeX ma solo pedici/apici `_{...}` e `^{...}`. Sullo schermo viene quindi disegnato letteralmente `a = 2,50 |text{Å}` (oppure `a = 5,64 |text{Å}` nel ramo ottico), come visibile in 6 schermate su 7.
- **Come riprodurre**: Aprire la sezione nello stato iniziale (o in `Lineare` / `Ramo ottico`) e guardare l'angolo in basso a sinistra del canvas superiore.
- **Indicazione di correzione**: Passare semplicemente `` `a = ${formatNumber(a, 2)} Å` `` (con spazio semplice, senza `\text{...}`), oppure usare `drawRichText`.

---

### [IMPORTANTE] 3. Underscore letterali (`v_p`, `v_g`) in controlli e tabella valori HTML
- **Tipo**: Difetto oggettivo di tipografia dell'interfaccia.
- **Elemento**:
  1. Terzo pulsante del selettore di regime nella barra parametri (`manifest.ts:76`, `PhononWavepacketSection.tsx:206`): mostra il testo grezzo `Ramo ottico v_g < 0`.
  2. Etichetta `<dt>` della tabella valori (`strings.ts:102`, `PhononWavepacketSection.tsx:461-463`): `strings.values.velocities` vale `'Velocità (v_p, v_g)'` senza delimitatori `$...$`, quindi `<RichText>` lo rende letteralmente `Velocità (v_p, v_g)` (e va su due righe nella colonna stretta).
  3. Nota sotto il menu scenari (`strings.ts:33`): riporta `ottico v_g < 0` in testo semplice con underscore letterale.
- **Risoluzione e stato**: Tutte le risoluzioni (1440×900, 1100×800, 800×700), sempre visibile.
- **Come riprodurre**: Osservare il terzo pulsante dei regimi in basso e la riga `Velocità (v_p, v_g)` nel pannello destro in qualsiasi schermata.
- **Indicazione di correzione**: Usare `<RichText>` con `$v_g < 0$` (o pedice Unicode `v_g` → `v\u209A` / `<sub>` HTML; nota che in Unicode non esiste `g` pedice standard in tutti i font, quindi `$v_g$` con `RichText` o `<sub>g</sub>` / `<sub>p</sub>` è la scelta pulita e uniforme).

---

### [IMPORTANTE] 4. Sovrapposizione tra le etichette mobili `v_p` e `v_g` sul canvas dello spazio reale
- **Tipo**: Difetto oggettivo di leggibilità su canvas.
- **Elemento**: Etichette `v_g` (al rombo dell'inviluppo) e `v_p` (al pallino della cresta) in `WavepacketView.tsx:346,384`.
- **Risoluzione e stato**: Visibile nelle schermate **1440×900 `Quadratico`** (`t = 0,10 fs`) e **1100×800 `Ramo acustico`** (`t = 0,16 ps`), e più in generale ogni volta che la cresta evidenziata transita vicino al massimo dell'inviluppo (`t` piccolo o regimi con `v_p` vicino a `v_g`).
- **Cosa è sbagliato**: Entrambe le etichette sono disegnate con `drawMathText` a offset fissi (`gx + 7, gy - 4` per `v_g`; `cx, cy - 10` per `v_p`) senza alcun controllo di collisione (`boxesOverlap` / `placeProbeLabel`). Quando i due marcatori sono vicini, le due etichette si sovrappongono coprendo parzialmente i caratteri e/o il pallino.
- **Come riprodurre**: Osservare il picco del pacchetto d'onda nei primi decimi di ciclo dopo `t = 0` (es. in `Quadratico` a `t = 0,10 fs` o in `Ramo acustico` a `t = 0,16 ps`).
- **Indicazione di correzione**: Calcolare il rettangolo occupato da `v_g` e posizionare `v_p` scegliendo tra candidati sopra/sotto/a sinistra/a destra (o usando `placeProbeLabel`) in modo da evitare collisioni col rombo, col pallino e con l'etichetta `v_g`.

---

### [MINORE] 5. Assestamento lento della scala Y di `DispersionPlot` al passaggio da `Quadratico` ai regimi fononici
- **Tipo**: Difetto oggettivo di transizione grafica.
- **Elemento**: `DispersionPlot.tsx:218` (`anim.yMax = new Smoothed(props.yRange[1], 0.16)`).
- **Risoluzione e stato**: Visibile nella schermata **1440×900 `Bordo di zona`** (`step_14_shot_1`, subito dopo il passaggio dal regime `Quadratico`), dove l'asse verticale è ancora a `0–16 THz` schiacciando la curva acustica (`4,39 THz`) nel quarto inferiore.
- **Cosa è sbagliato**: Quando il regime passa da `Quadratico` (`yMax ≈ 1200 THz`) a un regime fononico (`yMax ≈ 5,2 THz`), il salto di ~240× con decadimento esponenziale `τ = 0,16 s` richiede oltre 2 secondi per rientrare nella tolleranza (`1e-4 * scale`), restando molto più lento del `GLIDE` (`0,7 s`) dei parametri.
- **Come riprodurre**: Selezionare `Quadratico`, poi passare a `Bordo di zona k₀ = π/a` o `Ramo acustico`: durante i primi 1–2 secondi la curva fononica resta schiacciata in basso mentre le tacche Y continuano a cambiare.

---

### [MINORE] 6. Linee guida `±v_s` sovrapposte alla retta del suono a `k₀ = 0`
- **Tipo**: Difetto minore di chiarezza su canvas.
- **Elemento**: `PhononWavepacketSection.tsx:119-126` (`referenceLines` per `isOriginCusp`).
- **Risoluzione e stato**: **1440×900** su `Ramo acustico` con `k₀ = 0,00 π/a` (`step_19_shot_1`).
- **Cosa è sbagliato**: A `k₀ = 0` compaiono due segmenti tratteggiati verdi (`±v_s` fino a `0,25 π/a`) esattamente sovrapposti alla retta tratteggiata grigia `retta suono v_s|k|/2π`, privi di etichetta propria: risultano poco distinguibili e possono sembrare un artefatto di tratteggio doppio della retta suono.

---

### [MINORE] 7. Colore di `ω` / `ω₀` nella formula principale non allineato al regime attivo
- **Tipo**: Incoerenza minore sulla regola «1 colore = 1 grandezza».
- **Elemento**: `formulas.ts:30,34-35` (`MAIN_FORMULA` e `VELOCITY_AND_UNCERTAINTY_FORMULAS`).
- **Risoluzione e stato**: Tutte le risoluzioni nei regimi `Ramo ottico v_g < 0` e `Quadratico`.
- **Cosa è sbagliato**: Nella tabella `Valori` (`PhononWavepacketSection.tsx:399-400`), `\nu_0` e `\omega_0` cambiano correttamente colore in base al regime (`omegaOpt` arancio per il ramo ottico, `Ek` grigio per la particella libera, `omega` verde per lineare/acustico). Invece `MAIN_FORMULA` e `v_p = ω/k`, `v_g = dω/dk` lasciano `\omega` e `\omega_0` sempre in verde `omega`, creando una leggera discrepanza rispetto alla curva arancio/grigia e alla formula del regime sottostante.

---

### [MINORE] 8. Click/trascinamento sul grafico `DispersionPlot` e frecce tastiera non fanno pulsare `k₀` nella Formula viva
- **Tipo**: Difetto minore di feedback bidirezionale.
- **Elemento**: `store.ts:95-117` (`selectKFrac`, `nudge`).
- **Risoluzione e stato**: Verifica su codice (tutte le risoluzioni).
- **Cosa è sbagliato**: Trascinando lo slider `k₀` (`setParam`), `store.ts` emette `pulse: { quantities: ['k'], seq }` facendo pulsare `k_0` nelle formule; invece cliccando/trascinando direttamente `k₀` su `DispersionPlot` (`selectKFrac`) o usando le frecce `←/→` (`nudge`), `pulse` non viene emesso.

---

### [MINORE] 9. Barra parametri su 3 righe a 1100×800 e 800×700, e compattamento della vista reale a 800×700
- **Tipo**: Osservazione di impaginazione (entro i limiti della griglia, ma migliorabile).
- **Elemento**: `.params` a 1100×800 e 800×700; `.phonon-wp-bar` a 800×700.
- **Risoluzione e stato**: **1100×800** e **800×700**.
- **Cosa si osserva**:
  - La barra `.params` va su 3 righe di controlli (bottoni regime / i 2 slider / menu `Scenari (§6)`), più la riga della nota `.preset-note` sotto. È entro il massimo di 3 righe comandi, ma a 1100×800 si avvicina al limite compatto.
  - A **800×700**, la barra superiore `.phonon-wp-bar` (legenda `ChartLegend` su 2 righe + `PlaybackControls` su una 3ª riga) riduce lo spazio verticale del canvas reale, e la nota `.preset-note` sotto `Scenari (§6)` richiede lo scroll verticale della colonna centrale `.stage` per essere letta per intero.

---

### [MINORE] 10. Piccole imprecisioni di micro-copia (`4 scenari` vs 5 voci; simbolo `s` non introdotto in `SPREADING_FORMULA`)
- **Tipo**: Preferenza / rifinitura editoriale.
- **Elemento**: `strings.ts:33` e `formulas.ts:41`.
- **Cosa si osserva**:
  - La nota sotto il menu `Scenari (§6)` cita `"I 4 scenari della dispensa..."`, mentre il menu `<select>` contiene **5** preset (avendo sdoppiato l'acustico in dispersivo e bordo zona).
  - In `SPREADING_FORMULA`, compare `\sigma_0 = 1/(2s)` dove `s` è spiegato solo più sotto in `Teoria in breve`.
- **Nota minore aggiuntiva**: In `WavepacketView.tsx:49-51`, il commento dice «Quando cambiano regime o parametri principali si riparte puliti da t = 0», ma l'effetto dipende solo da `props.wpParams.regime`: scegliendo un preset diverso dentro lo stesso regime (es. da `Ramo acustico dispersivo` a `Bordo di zona`), il tempo `t` prosegue dall'istante precedente invece di ripartire da `0`.

---

## 3. Le due cose riuscite meglio

1. **Leggibilità fisica e sincronia tra spazio reale, dispersione e allargamento `σ(t)/σ₀`**: accoppiare nella stessa scena l'onda portante con la cresta marcata (`v_p`), il rombo dell'inviluppo (`v_g`), gli atomi discreti campionati ogni passo `a` e il pannello dedicato `σ(t)/σ₀` rende immediatamente visibili tutti i fenomeni chiave (moto opposto `v_g < 0` vs `v_p > 0` nel ramo ottico, onda stazionaria con allargamento al bordo di zona, rapporto esatto `v_g = 2v_p` nella particella libera), restando fedeli allo stile lavagna piatto e pulito.
2. **Coerenza cromatica tra grafici, controlli e testo teorico**: la mappatura da `ui/theme.ts` lega senza ambiguità ogni elemento visivo (corda `v_p` lilla, tangente `v_g` verde acqua, inviluppo `±F` e `σ₀` verde-giallo, portante e spettro `|Φ(k)|²` magenta, passo `a` e bordi `±π/a` azzurri, `k₀` giallo, rami `ω`/`ω₊`/`E_k` distinti), rendendo immediato il collegamento tra il grafico `ν(k)` in basso e l'evoluzione del pacchetto in alto.

---

## 4. Verdetto

**Da correggere**

La sezione ha un impianto grafico e didattico molto solido, zero errori in console/KaTeX, nessun overflow della pagina e un ottimo uso dello stile lavagna; tuttavia vanno risolti il **bloccante** troncamento della formula principale con scrollbar orizzontale in `.aside` a tutte le risoluzioni e i **3 difetti importanti** (`a = 2,50 |text{Å}` nel canvas, underscore letterali `v_g`/`v_p` in UI, collisione tra le etichette `v_p` e `v_g` nello spazio reale) prima della chiusura.
