# Rapporto Critico Grafico — Fononi › Catena monatomica e prima zona

- **Sezione verificata**: `Fononi › Catena monatomica e prima zona` (`src/renderer/src/sections/phonon-monatomic/`)
- **URL ispezionato**: `http://127.0.0.1:5173/` (build servita in locale, aperta dalla card «Fononi» nella schermata iniziale)
- **Risoluzioni verificate**: **1440×900**, **1100×800**, **800×700**
- **Screenshot ispezionati visivamente**:
  - Stato iniziale a ~1174×956 / 1440×900 (`final_step_59.png`)
  - Tutti e 3 i toggle attivi a 1440×900 (`final_step_96.png`)
  - Tutti e 3 i toggle attivi a 1100×800 (`final_step_106.png`)
  - Tutti e 3 i toggle attivi a 800×700 (`final_step_114.png`)
- **Verdetto**: **da correggere** *(impianto visivo e architettura molto solidi, ma presenti 3 difetti oggettivi Importanti su sovrapposizioni/tagli nei canvas e scrollbar orizzontali in Formula viva)*.

---

## 1. Sintesi delle verifiche eseguite

### Verifiche nel browser in esecuzione
- **Schermata iniziale → sezione**: card «Fononi» («6 sezioni») presente e cliccabile; apre «Catena monatomica e prima zona».
- **Console del browser**: **0 errori** e **0 warning** (nessun warning KaTeX o errore runtime in nessuno degli stati e a nessuna delle tre risoluzioni).
- **Stile lavagna e colori**:
  - Sfondo verificato `#0f1114` (`--bg`), linee sottili (`--line`), nessun bagliore, ombra o effetto 3D decorativo.
  - Scansione statica eseguita con PowerShell `Select-String` (`#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(`) su `src/renderer/src/sections/phonon-monatomic/*`, `src/renderer/src/viz/DispersionPlot.tsx`, `src/renderer/src/viz/PlaybackControls.tsx`, `src/renderer/src/viz/viz.css`: **0 colori hardcoded** fuori da `src/renderer/src/ui/theme.ts`.
- **Impaginazione e scorrimento alle 3 risoluzioni**:
  - **1440×900**: `#root` = `1440 × 900`, `main` = `820 × 900`, nessuno scorrimento di pagina né della colonna centrale (verificato con `mouse.wheel`); barra `.params` su **2 righe** (`134,88 px`) anche con tutti e 3 i toggle accesi; toolbar catena su **1 riga** (`26 px`). Scorre verticalmente solo `<aside>`.
  - **1100×800**: `#root` = `1100 × 800`, `main` = `540 × 800`, nessuno scorrimento di pagina né della colonna centrale sia nello stato pulito (`.params` = `151,38 px`, **2 righe**) sia con tutti e 3 i toggle accesi (`.params` = `173,85 px`, **3 righe**); `.topbar` su **2 righe** (breadcrumb + 3 toggle affiancati); toolbar catena su **1 riga**. Scorre verticalmente solo `<aside>`.
  - **800×700**: `#root` = `800 × 700` (nessuno scorrimento della pagina), `nav` collassata nel pulsante menu hamburger; `main` (`490 × 700`) scorre verticalmente di **~28 px** (27,2 px a toggle spenti, 28 px a toggle accesi) come consentito dal requisito per 800×700; `.params` resta su **2–3 righe** (`164,88–165,85 px`). Tuttavia `<aside>` (`310 × 700`) presenta uno **scorrimento orizzontale indesiderato** (vedi problema Importante #3).
- **Legende esterne**: entrambe le viste usano `<ul class="chart-legend">` fuori dall'area del canvas (`ChartLegend`), sopra i rispettivi canvas.
- **Cifre tabulari**: `.num` e `.values dd` applicano `font-variant-numeric: tabular-nums` a slider, valori vivi, pulsanti velocità e sonde; larghezza stabile con `<Num width={…} />`.
- **Stati interattivi verificati**:
  - Pulsanti rapidi `k = 0` (traslazione rigida, `ν = 0`, `λ = ∞`), `π/2a` (`0,50 π/a`, `ν = 3,11 THz`), `π/a` (onda stazionaria, `ν = 4,39 THz`, `λ = 2a`).
  - Toggle `Aliasing (k + G)`: onda equivalente tratteggiata gialla `k' = −1,50 π/a` e punto replicato `k − G` sul grafico.
  - Toggle `Born–von Kármán (N)`: vista ad anello chiuso con `N = 10`, stepper funzionante (`11, 12, 11, 10, 9`), aggancio ai modi discreti `k_j`.
  - Toggle `Sonda v_p, v_g`: verificato a `0,50 π/a` (`v_p = 3,11 km/s`, `v_g = 2,44 km/s`) e a `π/a` (`v_p = 2,20 km/s`, `v_g = 0,00 km/s`, tangente orizzontale e nota didattica).
  - Tutti e 3 i toggle accesi insieme (sia a `π/2a` → `j = 2`, `0,40 π/a`, sia a `π/a` → `j = 5`, `1,00 π/a`).
  - Preset `Piombo 1D` (`ν_max = 1,33 THz`, asse scalato a `~1,7 THz`), `Carbonio 1D` (`ν_max = 21,39 THz`, asse scalato a `~24 THz`) e ritorno a `Metallo tipico (§3)` con interpolazione fluida (`GLIDE`).
  - Controlli `Play/Pausa` (in pausa due frame a 300 ms di distanza risultano identici al pixel), `Velocità` (`0,25×`, `0,5×`, `1×`, `2×`), `Ripristina fase` (riporta a `t = 0` anche da pausa).
  - Hover bidirezionale: hover su `[data-q="C"]`, `[data-q="k"]`, `[data-q="M"]` in Formula viva accende i termini corrispondenti e lo slider `.param.is-active`; hover su slider `C` e `a` accende i termini in Formula viva.
- **Verifiche statiche su movimento e accessibilità (codice)**:
  - **Stop RAF in pausa / riposo**: verificato in `MonatomicChainView.tsx:169, 187` (`return shouldAnimate`, falso in pausa, a `k = 0` o con `prefers-reduced-motion`) e `viz/canvas.ts:55–57` (`if (again) requestAnimationFrame(run)`).
  - **`prefers-reduced-motion`**: verificato nel codice (`PlaybackControls.tsx:74–76, 170–188` congela l'animazione, disabilita Play/Velocità e mostra il badge «Istantanea»; `DispersionPlot.tsx:215, 246` azzera l'interpolazione; media query CSS in `ui.css:786–793`, `viz.css:263–271`, `phonon-monatomic.css:82–86`). *(Nota: non è stato emulato `prefers-reduced-motion: reduce` direttamente nel browser webview, solo verificato nel codice.)*
  - **Bidirezionalità scena**: verificato nel codice che `highlight` attenua gli elementi non corrispondenti (`DIM = 0.26`) e ispessisce il tratto attivo su entrambi i canvas (`MonatomicChainView.tsx:175–176`, `DispersionPlot.tsx:261–262`), e che `setParam`/`applyPreset` emettono `pulse` verso `LiveFormula` (`store.ts:81, 97`).

---

## 2. Problemi trovati (ordinati per gravità)

### Bloccanti
Nessun problema bloccante rilevato.

---

### Importanti

#### 1. Anello Born–von Kármán: etichetta `1` tagliata al bordo superiore e testo centrale sovrapposto agli atomi *(difetto oggettivo)*
- **Elemento**: Vista «Spazio reale — anello di Born–von Kármán» (`MonatomicChainView.tsx`, `drawBvkRing`, righe 462 e 575–607).
- **Risoluzioni e stati**:
  - **1440×900** (toggle `Born–von Kármán (N)` attivo, `final_step_96.png`): la cifra `1` sopra l'atomo a ore 12 è **tagliata a metà** dal bordo superiore del canvas (`R = 0,38·h ≈ 71 px`, `cy ≈ 93 px`, `rLbl = R + atomR + 16 ≈ 94 px` → `y ≈ −1 px`).
  - **1100×800** (toggle `Born–von Kármán (N)` attivo, `canvas` alto `122 px`, `final_step_106.png`): la cifra `1` esce fuori dal bordo superiore (`y ≈ −8 px`), e la riga interna `N = 10 modi · j = 2` **collide con l'atomo destro**, coprendo quasi completamente la cifra `2`.
  - **800×700** (toggle `Born–von Kármán (N)` attivo, `canvas` alto `104 px`, `final_step_114.png`): la riga `N = 10 modi · j = 2` **si sovrappone a entrambi gli atomi laterali** (sia `N` a ore 9 sia `2` a ore 3 risultano sovrapposti ai cerchi azzurri e alle frecce).
- **Causa e correzione suggerita**:
  - Calcolare `R` lasciando margine superiore/inferiore per `atomR + frecce + etichette` (es. `Math.min(w * 0.27, h / 2 - atomR - 22)`), oppure collocare le etichette `1` e `N` appena all'interno / con offset radiale più compatto.
  - Verificare con `ctx.measureText` se il testo centrale rientra in `2 * (R - atomR - 8)`: quando il canvas è basso (`1100×800` e `800×700`), omettere la riga inferiore `N = 10 modi · j = 2` (già mostrata nell'header `j = 2 (10 modi)`) oppure spostare la didascalia a destra dell'anello, dove c'è ampio spazio vuoto.

#### 2. Etichetta `ω = v_s |k|` sul grafico di dispersione attraversata dalla curva, dai punti BvK e dalla tangente `v_g` *(difetto oggettivo)*
- **Elemento**: Diagramma di dispersione `ν(k)` (`DispersionPlot.tsx:469–479`, alimentato da `PhononMonatomicSection.tsx:90–106`).
- **Risoluzioni e stati**:
  - **1440×900**, stato iniziale (`k = 0,50 π/a`, `final_step_59.png`): `ω = v_s |k|` tocca la retta tratteggiata acustica e sfiora il pallino del modo selezionato.
  - **1440×900**, **1100×800**, **800×700** con `Born–von Kármán (N)` e `Sonda v_p, v_g` attivi (`k = 0,40 π/a`, `final_step_96.png`, `final_step_106.png`, `final_step_114.png`): la curva verde $\omega(k)$, la tangente teal `v_g` e (a 800×700) il pallino BvK `j = 3` **attraversano direttamente `ω =`**, rendendo la parte sinistra dell'etichetta quasi illeggibile.
- **Causa e correzione suggerita**:
  - In `DispersionPlot.tsx`, le `referenceLines` vengono disegnate al passo 2 (*prima* dei rami, dei punti BvK e della sonda) e la loro etichetta è fissata a `t = 0,65` senza evitare le curve. Disegnarla dopo i rami usando `placeFreeLabel` (o posizionarla vicino all'estremità superiore del segmento acustico, eventualmente sul ramo `k < 0` quando la selezione è su `k > 0`).

#### 3. Scrollbar orizzontali non volute nei blocchi di `Formula viva` (tutte le risoluzioni) e overflow orizzontale di `<aside>` a 800×700 *(difetto oggettivo)*
- **Elemento**: Pannello destro `FORMULA VIVA` (`viz/viz.css:16–21`, `sections/phonon-monatomic/formulas.ts:33, 39`, `PhononMonatomicSection.tsx:431–434`).
- **Risoluzioni e stati**:
  - **1440×900**, stato iniziale (`final_step_59.png`) e tutti i toggle (`final_step_96.png`): compare una **scrollbar orizzontale di sistema** grigia direttamente sotto `v_s = a√(C/M), ω_max = 2√(C/M)`, e (con i 3 toggle accesi a 1440×900) una **seconda scrollbar orizzontale** sotto `k' = k + G, G = 2π/a m, −π/a < k ≤ π/a`.
  - **1100×800** (`final_step_106.png`): permane la scrollbar orizzontale sotto `v_s = a√(C/M), ω_max = 2√(C/M)`.
  - **800×700** (`final_step_114.png`): oltre alla scrollbar interna sotto `v_s, ω_max`, l'**intera colonna destra `<aside>`** mostra una scrollbar orizzontale in basso perché `<span className="sub nowrap">` in `PhononMonatomicSection.tsx:431` fa sforare `ω_max = 2,76 · 10¹³ rad/s` oltre i `310 px` (troncando `rad/s` in `rad/`).
- **Causa e correzione suggerita**:
  - Le formule composte in `DEFINITIONS[1]` e `VELOCITY_AND_BZ_FORMULAS[1]` combinano 2–3 relazioni in un singolo `<LiveFormula>` con `\quad` e `\dfrac`, che insieme a `.live-formula { overflow-x: auto; overflow-y: hidden; }` fa scattare lo scroll orizzontale su Windows anche per pochi pixel di margine KaTeX. Separare le singole relazioni in `<LiveFormula>` distinti dentro `.formula-defs` (che ha già `flex-wrap: wrap`) e/o ridurre `\dfrac` a `\frac` nelle definizioni secondarie elimina le scrollbar orizzontali.
  - A riga 431 di `PhononMonatomicSection.tsx`, evitare `.nowrap` sull'intera riga `ω_max = … · 10¹³ rad/s` (oppure applicarlo solo al blocco numerico+unità `10¹³ rad/s`) così che a 800×700 `<aside>` non produca alcuno scroll orizzontale.

---

### Minori

#### 4. Notazione ASCII con underscore (`v_p, v_g`, `u_n`) in etichette visibili *(difetto oggettivo)*
- **Elemento**:
  - Pulsante topbar `Sonda v_p, v_g` (`strings.ts:16`) — tutte le risoluzioni e gli stati.
  - Nota sotto `Vettore equivalente` in Formula viva: `stessa ω e stessi u_n sugli atomi` (`strings.ts:96`, `PhononMonatomicSection.tsx:482`) — tutte le risoluzioni quando `Aliasing (k + G)` è attivo.
- **Problema**: gli underscore letterali stonano in un'interfaccia che usa pedici tipografici/KaTeX ovunque. Passare `v.aliasingSame` in `<RichText text={v.aliasingSame} />` con `$u_n$` e `$\\omega$`, e usare pedici (o `RichText`/HTML `<sub>`) per «Sonda $v_p, v_g$».

#### 5. Unità di misura orfane a capo nei valori di `Formula viva` *(difetto oggettivo)*
- **Elemento**: Blocco `<dl className="values">` in `PhononMonatomicSection.tsx:423–520`.
- **Risoluzioni e stati**: 1440×900, 1100×800 e 800×700 (`final_step_59.png`, `final_step_96.png`, `final_step_106.png`, `final_step_114.png`).
- **Problema**: l'unità di misura va a capo separata dal proprio numero (`18,2` / `meV`, `1,26` / `Å⁻¹`, `10,7` / `meV`, `2,79` / `km/s`, e `indice j =` / `2`). Avvolgere ciascuna coppia numero + unità con spazio unificatore `\u00A0` (o `white-space: nowrap` sul solo blocco `valore unità`) mantiene le righe pulite senza creare overflow.
- **Nota di preferenza**: l'allineamento a destra in `<Num width={5} />` crea uno spazio un po' largo dopo la parentesi aperta `(  0,50 Å⁻¹)`; è un compromesso accettabile per la stabilità tabulare, ma ridurre `width` a `4` sulle parentesi renderebbe la lettura più compatta.

#### 6. Lieve ambiguità nominale nella voce di legenda `onda k e spostamenti u_n` *(rifinitura / preferenza)*
- **Elemento**: Legenda della catena 1D (`MonatomicChainView.tsx:147`, `strings.ts:73`).
- **Risoluzioni e stati**: tutte le risoluzioni, soprattutto con `Aliasing (k + G)` attivo.
- **Problema**: la voce `onda k e spostamenti u_n` è colorata con `var(--q-u)` (verde acido `#c9e663`), mentre la grandezza `k` in `ui/theme.ts` è giallo (`#f4d345`, usato subito a fianco per `onda equivalente k' = k ± G`). Rinominarla in `profilo u(x) e spostamenti u_n` mantiene una corrispondenza 1:1 ancora più rigorosa tra colore e grandezza nominata.

---

## 3. Le due cose riuscite meglio

1. **Fedeltà allo stile «lavagna animata» e chiarezza della doppia vista coordinata**: sfondo piatto `#0f1114`, zero colori hardcoded fuori da `ui/theme.ts`, gerarchia immediata (catena 1D + inviluppo continuo $u(x)$ campionato sui siti atomici + frecce longitudinali + molle $C$, collegata al diagramma $\nu(k)$ con 1BZ, repliche attenuate e fascia evanescente). Le visualizzazioni di Aliasing ($k' = k \pm G$) e della Sonda ($v_p$, $v_g$, con $v_g = 0$ al bordo zona) rendono il fenomeno fisico leggibile a colpo d'occhio.
2. **Fluidità, controllo del movimento e formule vive bidirezionali**: barra `PlaybackControls` sobria e a larghezza stabile, pausa reale senza spreco di frame/RAF, interpolazione morbida sui preset (`Piombo 1D`, `Carbonio 1D`, `Metallo tipico`), cifre tabulari senza salti, console perfettamente pulita (0 errori / 0 warning KaTeX) e collegamento bidirezionale effettivo fra formula viva, slider ed entrambi i canvas.

---

## 4. Verdetto finale

**da correggere**

Risolti i 3 problemi **Importanti** (geometria/etichette dell'anello BvK, posizionamento di `ω = v_s |k|` sul grafico di dispersione, eliminazione delle scrollbar orizzontali in `Formula viva` e su `<aside>` a 800×700) e le rifiniture **Minori** su pedici e unità orfane, la sezione sarà pienamente pronta per l'approvazione.
