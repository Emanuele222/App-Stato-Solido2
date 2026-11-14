# Revisione D — Critica grafica, coerenza visiva e usabilità

- **Incarico**: `incarichi/revisore-D-grafica.md`
- **Profilo**: `.claude/agents/critico-grafico.md`
- **Target verificato**: build statica preesistente in `out/renderer` servita su `http://127.0.0.1:5175/` tramite `vite preview` (nessuna ricompilazione eseguita)
- **Giudizio complessivo**: **da correggere**

---

## 1. Cosa hai fatto

1. Letti i riferimenti di progetto e incarico: `AGENTS.md`, `progetto.md` (in particolare «Notazione», «Design visivo» e «Meccanismo delle formule vive»), `CLAUDE.md`, `.claude/agents/critico-grafico.md`, `incarichi/revisore-D-grafica.md` e `mockup-quasi-libero.html`.
2. Avviato un server locale statico sulla build già compilata in `out/renderer` senza lanciare né `npm run build` né `npm run dev`.
3. Fatta eseguire un'ispezione sistematica in browser reale tramite subagent `browser` su tutte e 6 le sezioni (`Elettroni quasi liberi`, `Reticolo vuoto e schemi di zona`, `Kronig–Penney`, `Legami forti`, `Metodo k·p`, `Pseudopotenziale`) nelle tre larghezze richieste (`1440×900`, `1100×800`, `800×700`), nei tre stati principali (appena aperta, tutti gli strumenti accesi, parametri agli estremi) e al cambio di varianti e preset.
4. Verificati direttamente due screenshot acquisiti durante l'ispezione browser (`Elettroni quasi liberi` a ~1100 px di larghezza con strumenti accesi e parametri portati a valori estremi/custom; `Pseudopotenziale` a `1440×900` con 113 onde piane e `Massa efficace` attiva) e incrociata ogni segnalazione con il codice sorgente reale di `src/renderer/src/ui/`, `src/renderer/src/viz/` e delle sei cartelle in `src/renderer/src/sections/`. (Questo controllo incrociato ha permesso di scartare due falsi positivi del report automatico del browser — in particolare sulla reattività dei `<canvas>` in `Reticolo vuoto` e `Kronig–Penney` all'hover delle formule e sul rendering di `drawMathText` con `_{…}` — e di individuare difetti reali non emersi dal solo DOM.)
5. Chiuso il server `vite preview` al termine delle verifiche e controllato che non restassero processi in esecuzione.

---

## 2. Cosa hai verificato davvero

- **Server locale statico**:
  - Comando eseguito: `export PATH="$PWD/.tools/node/bin:$PATH" && npx vite preview --outDir out/renderer --port 5175 --host 127.0.0.1 --strictPort`
  - Esito: server avviato in ascolto su `http://127.0.0.1:5175/` sull'output precompilato `out/renderer`; chiuso tramite `manage_task` (`kill`) a fine verifica con controllo finale `manage_task` (`list`: `No background tasks are currently running`).
- **Navigazione e stato DOM/layout in browser reale** (verificato tramite `BROWSER_HOST_FACTS`: `visited_origins: http://127.0.0.1:5175`, `blocked_origins: none`):
  - Verificate tutte e 6 le sezioni a `1440×900`, `1100×800` e `800×700`.
  - Misurate altezze effettive di `.stage`, `.scene`, canvas e presenza di overflow/occlusione elementi (in particolare occlusione di `.nav-toggle` all'apertura del drawer a `800×700`, riduzione verticale dei canvas a `204.3px` nelle sezioni senza `min-height` e overflow verticale di `.stage` in `Metodo k·p` e `Pseudopotenziale`).
  - Misurate tempistiche del worker in `Pseudopotenziale`: anteprima a 51 onde piane seguita da raffinamento asincrono a 113 onde piane dopo ~900–1150 ms, con salto visivo del gap (es. `0,747 → 0,794 eV` su GaAs con $V_3^s = -0{,}35\text{ Ry}$).
- **Ispezione visiva diretta su screenshot PNG**:
  - `final_step_98.png` (`Elettroni quasi liberi` ~1100 px, `Riempimento` + `Massa efficace` + `Confronto` attivi): verificati visivamente `DIAGRAMMA E(K)` maiuscolo, intersezione diretta della linea tratteggiata arancione `E_F` con la barra e l'etichetta `2|V_G|` a `π/a`, vicinanza di `E_0` a `E_F` ed etichetta sonda `m*` parzialmente sovrapposta alla banda verde.
  - `final_step_151.png` (`Pseudopotenziale`, `1440×900`, `Massa efficace` attiva): verificati visivamente `FATTORE DI FORMA V(Q)` maiuscolo, collisione tra `E (eV)` e la tacca `15` dell'asse verticale di `EpmBandPlot`, stringa ASCII letterale `Pesi in onde piane |c_G|² per guscio di |G|² nello stato scelto` in `ShellWeightsBar`, valore `62%` a contatto con il bordo superiore della barra `3` e leggero tocco tra l'etichetta `v(0) = -2/3 E_F` e la curva tratteggiata.
- **Lettura e verifica diretta del codice sorgente**:
  - `src/renderer/src/strings.ts`, `src/renderer/src/ui/theme.ts`, `shell.tsx`, `ui.css`, `controls.tsx`, `tex.tsx`, `motion.ts`
  - `src/renderer/src/viz/viz.css`, `LiveFormula.tsx`, `canvas.ts`, `BandPlot.tsx`, `RealSpaceView.tsx`
  - Tutte le sezioni in `src/renderer/src/sections/{nearly-free,empty-lattice,kronig-penney,tight-binding,k-dot-p,pseudopotential}/` (componenti principali `.tsx`, `.css`, `formulas.ts`, `strings.ts`, `manifest.ts` e tutti i componenti canvas di sezione).

---

## 3. Cosa non hai potuto verificare

- **Esecuzione dentro la finestra nativa Electron**: per vincolo dell'incarico la verifica è stata svolta servendo `out/renderer` con `vite preview` nel browser; eventuali specificità della chrome nativa Electron (barra titolo macOS, resizing rapido della finestra Electron, scorciatoie di sistema) non sono state testate.
- **Framerate reale (FPS) con profiler**: l'assenza di frame drop nei glide dei preset (700 ms) e nel trascinamento fluido su canvas è stata dedotta dall'implementazione (`requestAnimationFrame` + `useTweened` in `ui/motion.ts` e `SmoothNumber`) e dall'osservazione funzionale dei controlli, ma non è stata profilata con tracce Chrome DevTools Performance.
- **Ispezione PNG diretta su tutte le combinazioni delle altre 4 sezioni**: solo `Elettroni quasi liberi` e `Pseudopotenziale` avevano screenshot PNG salvati direttamente nel turno finale dell'agente browser; per `Reticolo vuoto`, `Kronig–Penney`, `Legami forti` e `Metodo k·p` le sovrapposizioni sui grafici sono state verificate incrociando le misure DOM/stato riportate dal subagent browser con la lettura riga per riga delle coordinate di disegno nei rispettivi file canvas.

---

## 4. Problemi trovati

### 4.1 Difetti nei componenti comuni (`src/renderer/src/strings.ts`, `ui/`, `viz/`)

Questi difetti si propagano automaticamente a più sezioni o all'intera cornice applicativa e vanno corretti una volta sola alla radice.

#### Bloccanti
Nessun difetto bloccante nei componenti comuni (`Elettroni quasi liberi` a `1440×900` resta fruibile e senza perdita di funzionalità primaria).

#### Importanti
1. **Pulsante di apertura/chiusura menu (`.nav-toggle`) coperto dal drawer stesso sotto i 1024 px**
   - **Elemento / Larghezza / Stato**: `.nav-toggle` in topbar (`src/renderer/src/ui/shell.tsx` L124–140) e `.nav` / `.nav-brand` (`shell.tsx` L73–76, `src/renderer/src/ui/ui.css` L595–627) — `800×700` — drawer aperto (qualsiasi sezione).
   - **Cosa si vede**: aprendo la sidebar con l'hamburger a `800×700`, `.nav` (`position: fixed; z-index: 20; width: 260px`) scorre sopra `.topbar` e `.nav-brand` copre esattamente `.nav-toggle` alle coordinate `(12, 8)` (`ELEMENT_OCCLUDED` rilevato in browser); all'interno di `.nav` non esiste un pulsante esplicito di chiusura (`×`).
   - **Cosa ci si aspetta**: un controllo di chiusura visibile dentro l'header della `.nav` (o uno spostamento della `.topbar`/pulsante toggle non coperto dal pannello) oltre a `Escape` e al click sullo sfondo `.nav-backdrop`.
   - **Riproduzione**: aprire l'app a `800×700`, cliccare l'icona menu in alto a sinistra e provare a ricliccare lo stesso punto per richiudere il pannello.

2. **Collisione tra linea tratteggiata del livello di Fermi (`E_F`) ed etichette/barre di gap in `BandPlot`**
   - **Elemento / Larghezza / Stato**: `src/renderer/src/viz/BandPlot.tsx` L291–344 — tutte le larghezze (osservato direttamente in `final_step_98.png` a ~1100 px) — strumento `Riempimento` attivo insieme a gap aperto.
   - **Cosa si vede**: `BandPlot` disegna prima `p.gaps` (L291–318) e poi `p.filling` (L321–344). La linea orizzontale tratteggiata arancione di $E_F$ attraversa l'intera larghezza `[L, L + W]` passando proprio sopra la barra verticale rossa del gap e sopra l'etichetta testuale `2|V_G|` / `E_g` al bordo zona `π/a` (visibile chiaramente in `final_step_98.png`), e l'etichetta `E_F` sul lato destro o le note a sinistra (`E_0`) non hanno maschera o controllo collisione reciproco.
   - **Cosa ci si aspetta**: o la linea di $E_F$ si interrompe/attenua attorno al box dell'etichetta del gap, oppure l'etichetta del gap ha uno sfondo opaco con margine (`TOKENS.bg`) e uno spostamento automatico rispetto a `fermiY`.
   - **Riproduzione**: aprire `Elettroni quasi liberi`, accendere `Riempimento` (default `2 el/cella`) con $V_G \ne 0$.

3. **Legenda di confronto in `BandPlot` disegnata con `fillText` grezzo senza supporto matematico**
   - **Elemento / Larghezza / Stato**: `src/renderer/src/viz/BandPlot.tsx` L248–260 e L432 — tutte le larghezze — strumento `Confronto` attivo quando `compare.label` contiene pedici/apici.
   - **Cosa si vede**: la legenda del confronto usa `ctx.fillText(p.compare.label, ...)` invece di `drawMathText`. Se `nearly-free` evita il problema scrivendo `'reticolo vuoto (V = 0)'`, `tight-binding` passa `'quasi liberi (V_G = −0,5 eV)'` (`tight-binding/strings.ts` L68), producendo un letterale `V_G` con underscore visibile sul canvas.
   - **Cosa ci si aspetta**: `BandPlot` deve renderizzare eventuali simboli matematici nella legenda tramite un helper ricco (analogo a `drawRichLegend` usato da `ZoneSchemesPlot.tsx` L928–942).
   - **Riproduzione**: aprire `Legami forti`, accendere `Confronto quasi liberi` e leggere la legenda in basso a sinistra del grafico `E(k)`.

4. **Trasformazione forzata in MAIUSCOLO sui tag dei pannelli grafico (`.view-tag`) altera i simboli fisici**
   - **Elemento / Larghezza / Stato**: `.view-tag` in `src/renderer/src/ui/ui.css` L299–305 — tutte le larghezze e tutte le sezioni (osservato in `final_step_98.png` e `final_step_151.png`).
   - **Cosa si vede**: `text-transform: uppercase` trasforma `Diagramma E(k)` in `DIAGRAMMA E(K)`, `Fattore di forma v(q)` in `FATTORE DI FORMA V(Q)`, `Contributi a m₀/m*` in `CONTRIBUTI A M₀/M*`, falsando la notazione canonica di $k$ (vettore d'onda vs Kelvin), $v(q)$ (fattore di forma vs potenziale $V$) e $m_0/m^*$.
   - **Cosa ci si aspetta**: mantenere il testo nel case originale (o applicare `uppercase` solo alle parole italiane e mai ai simboli matematici), così che $k$, $v(q)$, $m_0/m^*$ restino minuscoli.
   - **Riproduzione**: aprire qualsiasi sezione e leggere il tag in alto a destra sopra ogni grafico.

5. **Strategia responsiva incoerente in `.scene` a `800×700`: compressione estrema dei grafici nelle prime 3 sezioni vs scroll verticale in `Metodo k·p` e `Pseudopotenziale`**
   - **Elemento / Larghezza / Stato**: `.scene` in `src/renderer/src/ui/ui.css` L275 e override `:has(...)` nei CSS locali — `800×700` (e `1100×800` per `Pseudopotenziale`).
   - **Cosa si vede**: `ui.css` fissa `grid-template-rows: minmax(0, 36fr) minmax(0, 64fr)` senza `min-height`. Nelle sezioni senza override (`nearly-free`, `empty-lattice`, `kronig-penney`), a `800×700` il pannello inferiore `BandPlot` / `ZoneSchemesPlot` scende fino a **`204.3px`** di altezza netta (misurato in browser), rendendo fitti assi e tacche. Al contrario, `tight-binding.css` L139–147 imposta `445px` (esattamente a filo dei `700px`), `kDotP.css` L45–53 imposta `474px` causando overflow verticale (`744px > 700px`), e `pseudopotential.css` L3–11 imposta `560px` causando overflow sia a `1100×800` (`875px > 800px`) sia a `800×700` (`875px > 700px`).
   - **Cosa ci si aspetta**: una regola unitaria a livello di layout comune (con `min-height` calibrato o breakpoint dedicato `<= 900px`) che preservi una leggibilità minima dei grafici (~240–260 px) senza mandare fuori schermo i parametri della bottom bar a `1100×800`.

#### Minori
6. **Testi residui della prima versione ancora presenti nell'interfaccia globale**
   - **Elemento / Larghezza / Stato**: `src/renderer/src/strings.ts` L5 (`appNote: 'nome provvisorio'`) e L11 (`footnote: 'Prima versione: è attiva la sezione Elettroni quasi liberi.'`) — tutte le larghezze — sidebar sempre visibile.
   - **Cosa si vede**: il piede della sidebar continua a dichiarare che è attiva solo la sezione `Elettroni quasi liberi`, mentre tutte e 6 le sezioni sono ormai attive nel menu sopra di essa.
   - **Cosa ci si aspetta**: rimuovere o aggiornare `footnote` allo stato reale dell'app (e decidere in regia il destino di `nome provvisorio`).

7. **I pulsanti strumento (`ToolToggle`) non partecipano al sistema di evidenziazione delle formule vive**
   - **Elemento / Larghezza / Stato**: `ToolToggle` in `src/renderer/src/ui/controls.tsx` (a differenza di `ParamSlider` L56–65 che ha `onMouseEnter`/`onMouseLeave` e stato `active`) — tutte le larghezze.
   - **Cosa si vede**: passando col cursore su `Riempimento` (`EF`), `Massa efficace` (`mstar`), ecc. nella topbar non si attiva alcuna evidenziazione corrispondente in formula/valori/canvas, mentre su `ParamSlider` succede.
   - **Cosa ci si aspetta**: coerenza opzionale (se prevista dalla regia): estendere `hoverQuantity` anche ai toggle associati a una grandezza fisica (`EF`, `mstar`, `V2G`, `psi`).

8. **`drawMathText` in `src/renderer/src/viz/canvas.ts` supporta solo pedici `_{…}` e ignora apici `^{…}` e forme brevi `_x`**
   - **Elemento / Larghezza / Stato**: `drawMathText` in `src/renderer/src/viz/canvas.ts` L100–159 — tutte le sezioni che passano stringhe a canvas.
   - **Cosa si vede**: ogni stringa che usa `_G` senza graffe o `^s` al posto di Unicode viene stampata letteralmente con `_` o `^`.
   - **Cosa ci si aspetta**: supportare sia `_{…}` che `^{…}` (e opzionalmente il token singolo `_x`/`^x`) in un unico parser tipografico su canvas.

---

### 4.2 Problemi per sezione (in ordine di gravità)

#### 1) Elettroni quasi liberi (sezione pilota)
*(Stato `nearly-free`: riferimento di stile per le altre sezioni)*

- **Bloccanti**: nessuno.
- **Importanti**:
  1. **Sovrapposizione linea `E_F` su barra ed etichetta `2|V_G|`, e vicinanza etichetta sonda `m*` alla banda**
     - **Elemento / Larghezza / Stato**: `BandPlot` (`src/renderer/src/viz/BandPlot.tsx` L321–344, chiamato da `NearlyFreeSection.tsx` L258–272) — tutte le larghezze, osservato direttamente in `final_step_98.png` (~1100 px) — `Riempimento` + `Massa efficace` attivi con $V_G \ne 0$.
     - **Cosa si vede**: la linea tratteggiata di `E_F` taglia in due la barra rossa verticale del gap e il testo `2|V_G|` a `π/a`; a destra di `π/a` l'etichetta della sonda `m*` si sovrappone parzialmente alla curva verde della seconda banda.
     - **Cosa ci si aspetta**: `2|V_G|` e la sonda `m*` leggibili senza linee o curve che li attraversino.
  2. **Altezza ridotta di `BandPlot` a `800×700`**
     - **Elemento / Larghezza / Stato**: `.scene` in `ui.css` L275 senza override locale — `800×700` — stato default.
     - **Cosa si vede**: `BandPlot` scende a `204.3px` totali; con 3 bande, `Confronto`, `Riempimento` e `Massa efficace` attivi lo spazio verticale tra $E_0$, $E_F$ e le legende risulta compresso.
     - **Cosa ci si aspetta**: almeno ~240–260 px o un leggero scroll del corpo a `800×700`.
- **Minori**:
  1. **Chiave `s.formula.valuesTitle` definita ma non resa come intestazione**
     - **Elemento / Larghezza / Stato**: `NearlyFreeSection.tsx` L210–255 vs `nearly-free/strings.ts` L69 (`valuesTitle: 'Valori'`) — tutte le larghezze.
     - **Cosa si vede**: nel pannello formula, dopo le tre righe di equazione, la lista `<dl className="values">` parte direttamente sotto un divisore senza titolo di sottosezione (a differenza della sezione `Metodo k·p` che poi ha introdotto intestazioni `.kdotp-formula-subhead`). Qui è pulito visivamente, ma la stringa `valuesTitle` resta inutilizzata nel codice.
  2. **Uso integrale di `<dd data-q="psi">` sulla riga «Onda stazionaria al bordo»**
     - **Elemento / Larghezza / Stato**: `NearlyFreeSection.tsx` L336 — stato con stato selezionato al bordo `±π/a`.
     - **Cosa si vede**: l'intera descrizione testuale `ψ₊ ∝ cos(πx/a) sul minimo di U(x)` diventa magenta (`--q-psi`), mentre nelle altre righe il colore appartiene solo al simbolo/numero. Non crea vera ambiguità ma rende quella riga più squillante delle adiacenti.
- **Giudizio sezione (`Elettroni quasi liberi`)**: **approvata con riserva** (unico difetto reale rilevante in sezione è l'attraversamento di `E_F` su `2|V_G|` e la compressione a `800×700`, entrambi provenienti dai componenti comuni `BandPlot`/`ui.css`).

---

#### 2) Reticolo vuoto e schemi di zona

- **Bloccanti**: nessuno.
- **Importanti**:
  1. **Compressione verticale di `ZoneSchemesPlot` a `800×700`**
     - **Elemento / Larghezza / Stato**: `.scene` in `ui.css` L275 (non sovrascritto da `emptyLattice.css`) — `800×700` — con preset `Schema periodico` / `Confronto`.
     - **Cosa si vede**: `ZoneSchemesPlot` scende a `~204px` d'altezza; in `Schema ridotto` o `Periodico` con più rami parabolici e legenda `Confronto` accesa, il margine tra curva, etichetta `E_F` e legende diventa molto stretto.
     - **Cosa ci si aspetta**: altezza minima protetta del grafico inferiore anche a `800×700`.
  2. **Possibile collisione tra linea `E_F` e indicatore gap del `Confronto` (`2|V_G|`)**
     - **Elemento / Larghezza / Stato**: `ZoneSchemesPlot.tsx` L528–551 (e sezione confronto gap) — qualsiasi larghezza — `Riempimento` (2 el/cella) + `Confronto` attivi insieme.
     - **Cosa si vede**: con 2 elettroni per cella $E_F = E_0$ cade esattamente al centro della fascia del gap di confronto `2|V_G|` a `±π/a`, e la linea orizzontale tratteggiata `E_F` attraversa `[L, L+W]` senza evitare l'indicatore di gap.
     - **Cosa ci si aspetta**: evitare l'intersezione diretta della linea `E_F` con la label `2|V_G|`.
- **Minori**:
  1. **Gestione duplicata dell'hover tra `handleFormulaHover` (con `<div onPointerOver>` su `DEFINITIONS`) e `onHighlight` su `MAIN_FORMULA` / `EmptyLatticeValues`**
     - **Elemento / Larghezza / Stato**: `EmptyLatticeSection.tsx` L208–244 e L276–310 — tutte le larghezze.
     - **Cosa si vede**: funzionalmente l'hover verso `ZoneSchemesPlot` (`L163–164, L503` distingue persino `G` da `a`) e verso gli slider **funziona** correttamente (nota: l'ispezione DOM del browser aveva segnalato un falso negativo perché cercava attributi DOM sul `<canvas>` invece del ridisegno interno), ma la logica di lettura `data-q` è duplicata tra `handleFormulaHover` e `hoverQuantity` anziché unificata in un unico wrapper come nel pilota.
  2. **Testo `ParamSlider` / `EmptyLatticeValues`**: le cifre numeriche in `EmptyLatticeValues` non usano `<Num width={...}>` a larghezza fissa come nel pilota, potendo creare lievi micro-spostamenti orizzontali al trascinamento dello stato `k`.
- **Giudizio sezione (`Reticolo vuoto e schemi di zona`)**: **approvata con riserva** (struttura coerente al pilota, hover su formule e su `G` vs `a` funzionante; resta da risolvere il problema comune di altezza minima a `800×700` e l'eventuale incrocio `E_F` / `2|V_G|`).

---

#### 3) Kronig–Penney

- **Bloccanti**: nessuno.
- **Importanti**:
  1. **Riuso e scambio di colori di altre grandezze su parametri e curve della sezione**
     - **Elemento / Larghezza / Stato**: `KronigPenneySection.tsx` L113–145, `kronig-penney/formulas.ts` L7–21 — tutte le larghezze e varianti.
     - **Cosa si vede**:
       - `a`, `b` e `c` condividono tutti lo stesso colore `QUANTITIES.a` (`#58c4dd`, ciano): in `kronig-penney`, `b` (larghezza buca) e `c` (barriera) nella variante rettangolare devono usare `sub` specifici per non illuminarsi insieme, e passando su `a` nella formula di definizione (`a = b + c`) non si evidenziano i due slider `b` e `c`.
       - `V_0` e `P` usano `VG` (`#fc6255`), mentre `E_1, E_2` della buca isolata usano `V2G` (`#f79a8e`, stesso tono corallo chiaro).
       - `t` e `W` nella variante coseno usano `v` (`#5cd0b3`, verde-acqua destinato in `theme.ts` alla velocità di gruppo $v$), mentre in `COSINE_FORMULA` (`formulas.ts` L21) `W = 4t` e `\bar E` restano bianchi non colorati e `t` nella formula di banda non ha il medesimo trattamento uniforme.
       - `L(E)` / `f(\alpha a)` e i parametri ausiliari `\alpha`, `\beta` usano tutti `E` (`#83c167`), rendendo verde sia le energie $E$ che la funzione ausiliaria oscillante a sinistra.
     - **Cosa ci si aspetta**: o estendere la palette semantica in `theme.ts` con ruoli dedicati (oppure dichiarare esplicitamente una mappatura coerente condivisa con `Legami forti`), evitando di avere `L(E)` ed `E` identici sullo stesso grafico `L(E)` vs `E` quando non rappresentano la stessa grandezza fisica.
  2. **Sovrapposizione tra linea `E_F` e barra/etichetta di gap ai valori medi/alti di potenziale**
     - **Elemento / Larghezza / Stato**: `KronigBandsAndConditionPlot.tsx` L507–596 — tutte le larghezze — `Riempimento` attivo con gap aperti (es. `b=8, c=5, V_0=30 eV` o `b=3, c=2, V_0=15 eV` con `2 el/cella`).
     - **Cosa si vede**: in `KronigBandsAndConditionPlot`, le etichette dei gap controllano `occupiedBoxes` per non toccare altre etichette testuali, ma la linea tratteggiata `E_F` viene disegnata prima sull'intera larghezza senza proteggere le barre verticali dei gap né evitare del tutto l'incrocio con `E_{g2}` / `gap`.
     - **Cosa ci si aspetta**: evitare che la linea `E_F` intersechi le barre ed etichette dei gap.
  3. **Compressione verticale di `KronigBandsAndConditionPlot` a `800×700`**
     - **Elemento / Larghezza / Stato**: `.scene` in `ui.css` L275 (nessun `min-height` in `kronigPenney.css`) — `800×700` — stato default.
     - **Cosa si vede**: il grafico inferiore combinato (pannello di sinistra `L(E)` + pannello di destra `E(k)`) si schiaccia a `~204px` d'altezza, comprimendo verticalmente sia i rami di $\cos(ka)$ sia la scala verticale delle bande.
     - **Cosa ci si aspetta**: almeno `240–260 px` minimi o scroll fluido dell'area `.stage`.
- **Minori**:
  1. **Mancanza di larghezza fissa sui valori numerici**
     - **Elemento / Larghezza / Stato**: `KronigPenneySection.tsx` L396–402, L424–443 (`<span className="num">`) — tutte le larghezze.
     - **Cosa si vede**: a differenza di `NearlyFreeSection.tsx` (`<Num width={...} />`), il testo descrittivo adiacente o i separatori possono micro-oscillare durante il trascinamento continuo.
  2. **Doppio segno nel pannello sinistro `L(E)` vs `E`**: la legenda/tag in `KronigBandsAndConditionPlot` rende bene la condizione $|L(E)| \le 1$, ma passando col mouse su `\cos(ka)` o `L(E)` in formula l'intero blocco grafico si illumina come `E` invece di distinguere la finestra $[-1, +1]$ dalla curva di dispersione $E(k)$.
- **Giudizio sezione (`Kronig–Penney`)**: **da correggere** (riuso ambiguo di colori tra $t/W/v$, $E/L(E)$, $b/c/a$; attraversamento barre di gap da parte di `E_F`; grafico compresso a `800×700`).

---

#### 4) Legami forti

- **Bloccanti**: nessuno.
- **Importanti**:
  1. **Legenda `Confronto quasi liberi` disegnata con underscore letterale `V_G`**
     - **Elemento / Larghezza / Stato**: `tight-binding/strings.ts` L68 (`compareLegend: 'quasi liberi (V_G = −0,5 eV)'`) passato a `BandPlot.tsx` L432 — tutte le larghezze — `Confronto quasi liberi` attivo.
     - **Cosa si vede**: nella legenda in basso a sinistra del diagramma `E(k)` appare `quasi liberi (V_G = −0,5 eV)` con underscore ASCII letterale anziché pedice tipografico $V_G$.
     - **Cosa ci si aspetta**: rendere `V_G` con pedice grafico tramite `drawMathText` / helper ricco in `BandPlot`.
  2. **Collisioni colore e associazione ambigua nell'hover tra `banda s` / `banda p` e parametri `t_s`, `|t_p|`, `\bar{E}_s`, `\bar{E}_p`**
     - **Elemento / Larghezza / Stato**: `TightBindingSection.tsx` L402–466 e `tight-binding/manifest.ts` L27–40 — tutte le larghezze — variante `Monoatomica`.
     - **Cosa si vede**:
       - Nella lista valori, `<dt data-q="E">banda s</dt>` usa `E` (`#83c167`), mentre `<dt data-q="v">banda p</dt>` usa `v` (`#5cd0b3`): passando il mouse sopra la voce testuale `banda p` si illumina lo slider `t` / `|t_p|` invece di evidenziare la banda nel grafico senza confondere `t` con la velocità di gruppo `v`.
       - Entrambi gli slider `t_s` e `|t_p|` (e in Biatomica `t`) usano `quantity: 'v'` (`#5cd0b3`) senza distinzione `sub`: passando su `t_s` nella formula si illuminano contemporaneamente **entrambi** gli slider `t_s` e `|t_p|`!
       - Lo stesso accade per `\bar{E}_s` e `\bar{E}_p` (e in Biatomica `E_A`, `E_B`), che condividono `quantity: 'Ek'` (`#aab1bb`) senza `sub`: l'hover su `\bar{E}_s` attiva entrambi gli slider `\bar{E}_s` e `\bar{E}_p`.
     - **Cosa ci si aspetta**: usare identificatori/sotto-target distinti (`sub`) in modo che `t_s` illumini solo `t_s` e `\bar{E}_s` illumini solo `\bar{E}_s`, e riservare alla seconda banda un canale che non confonda `t` (integrale di salto) con `v` (velocità di gruppo).
  3. **Incrocio `E_F` con barra/etichetta `E_g` nel grafico `BandPlot`**
     - **Elemento / Larghezza / Stato**: `BandPlot.tsx` L291–344 chiamato da `TightBindingSection.tsx` — tutte le larghezze — variante `Biatomica` (es. valori di default $E_A = -1{,}5, E_B = 1{,}5\text{ eV}$) o `Monoatomica` con bande separate e `Riempimento` attivo a `2 el/cella`.
     - **Cosa si vede**: $E_F$ passa esattamente a metà gap ($0\text{ eV}$), tagliando la barra ed etichetta `E_g`.
     - **Cosa ci si aspetta**: gestire la collisione in `BandPlot`.
- **Minori**:
  1. **Sovraccarico di informazioni con tutti gli strumenti attivi nel pannello `BandPlot` (soprattutto in `Monoatomica`)**
     - **Elemento / Larghezza / Stato**: `TightBindingSection.tsx` + `BandExtremumOverlay.tsx` + `EdgesVsDistancePlot.tsx` — `800×700` e `1100×800` — `Avvicina gli atomi` + `Riempimento` + `Confronto quasi liberi` + `Bordi ed estremi` tutti accesi insieme.
     - **Cosa si vede**: nel pannello inferiore convivono le 2 bande `s/p` (o `±`), le curve grigie di confronto a 9 onde piane con tratteggi e legenda, le etichette dei bordi di zona, la linea arancione `E_F` e la card flottante `bordi vs a` (`EdgesVsDistancePlot`, `175px` di larghezza, `tightBinding.css` L86–90) nell'angolo destro, dove in basso l'asse `a (Å)` e i tick `2..6` sono molto fitti a `T + H + 4` / `T + H + 13` (`EdgesVsDistancePlot.tsx` L93–96). La leggibilità resta accettabile solo grazie allo sfondo della mini-card, ma è al limite di densità visiva.
- **Giudizio sezione (`Legami forti`)**: **da correggere** (`V_G` letterale nella legenda `Confronto`, hover multi-slider indebito tra `s/p` e `A/B`, incrocio `E_F` / `E_g`).

---

#### 5) Metodo k·p

- **Bloccanti**: nessuno.
- **Importanti**:
  1. **Hover sulle formule nella scheda «Teoria» e nella card «Verifica quasi liberi» completamente inattivo**
     - **Elemento / Larghezza / Stato**: `KDotPSection.tsx` L167–236 (pannello `theory`) e L437–469 (`NearlyFreeVerifyCard`) — tutte le larghezze.
     - **Cosa si vede**: in `k-dot-p/strings.ts` (L159, L165–166, L172–173) i simboli nella scheda `Teoria` hanno gli attributi KaTeX `\htmlData{q=…}` e risultano quindi **colorati** esattamente come nel pilota, facendo legittimamente credere all'utente che siano interattivi; tuttavia sul pannello `theory` manca il gestore `onPointerOver`/`onPointerLeave` (`hoverQuantity`), quindi passando il cursore sui simboli della teoria o della card di verifica **non accade nulla** né sui grafici né sugli slider.
     - **Cosa ci si aspetta**: collegare `hoverQuantity` sia a `theory` sia a `NearlyFreeVerifyCard` come avviene nel pannello `Formula` e nel pilota `Elettroni quasi liberi`.
  2. **Scambio sistematico di colori canonici su parametri fondamentali (`E_g`, `\Delta`, `E_P`)**
     - **Elemento / Larghezza / Stato**: `k-dot-p/manifest.ts` L22–37, `KDotPSection.tsx` L103, `GammaLevelsCanvas.tsx`, `MassContributionsBar.tsx` — tutte le larghezze.
     - **Cosa si vede**:
       - `E_g` prende il rosso corallo di `VG` (`#fc6255`);
       - `\Delta` e la banda `so` (spin-orbit split-off) prendono il magenta di `psi` (`#dc75cd`, normalmente riservato alla funzione d'onda $\psi_k$);
       - `E_P` e `P` prendono il verde-acqua di `v` (`#5cd0b3`, normalmente velocità di gruppo $v$).
       - Nel contesto di `k·p` non compaiono né $V_G$, né $\psi$, né $v$, quindi non c'è collisione interna alla singola schermata, ma si rompe la promessa di `progetto.md` («un colore = una grandezza») tra una sezione e l'altra (chi arriva da *Elettroni quasi liberi* associa il magenta alla funzione d'onda e il verde-acqua alla velocità).
     - **Cosa ci si aspetta**: o aggiungere ruoli colore dedicati in `theme.ts` o definire chiaramente in specifica l'eventuale riutilizzo di canali secondari per sezioni senza $\psi$/$v$.
  3. **Collisione tra linea `E_F` ed etichetta `E_g` in `KpBandPlot`**
     - **Elemento / Larghezza / Stato**: `KpBandPlot.tsx` L357 e L392–418 — tutte le larghezze — `Livello di riferimento E_F` attivo (con gap $\ge 34\text{ px}$ in schermo, es. GaAs `1,43 eV` o `max` `2,5 eV`).
     - **Cosa si vede**: a L357 `egLabelY` sposta l'etichetta `E_g` sopra il gap *solo* se `Math.abs(yVbm - yCbm) < 34`; quando il gap è ampio (caso normale per GaAs e Ge!), `egLabelY` sta al centro esatto `0.5 * (yVbm + yCbm) + 4`, che coincide con `fermiY = Y(0.5 * eg)` dove passa la linea tratteggiata orizzontale `E_F` su tutta la larghezza `[L, L + W]`.
     - **Cosa ci si aspetta**: evitare che la linea di `E_F` tagli l'etichetta `E_g` e la relativa parentesi.
  4. **Overflow verticale a `800×700` spinge il selettore «Materiale» e le note sotto la piega**
     - **Elemento / Larghezza / Stato**: `.scene` in `src/renderer/src/sections/k-dot-p/kDotP.css` L45–53 (`min-height: 474px`) — `800×700`.
     - **Cosa si vede**: `83 px` (topbar) + `474 px` (scene) + `187 px` (bottom params) = `744 px > 700 px`. La `.stage` scorre verticalmente e il menu `Materiale (GaAs / InSb / Ge)` con l'eventuale nota sul Ge finisce tagliato fuori nella parte bassa finché non si fa scroll.
     - **Cosa ci si aspetta**: mantenere visibile la barra parametri a `800×700` o compattare leggermente il blocco superiore (`GammaLevelsCanvas` + `MassContributionsBar`).
- **Minori**:
  1. **Deviazioni di stile e gerarchia rispetto al pilota**
     - **Elemento / Larghezza / Stato**: `KDotPSection.tsx` (layout a **3** `.view` impilati anziché 2, sotto-intestazioni `.kdotp-formula-subhead`, divisori tratteggiati, callout `.kdotp-callout`, pie' pagina teoria `<p className="foot">{s.theory.foot}</p>` non avvolto in `<RichText>`) — tutte le larghezze.
     - **Cosa si vede**: l'aspetto è curato e molto leggibile, ma introduce sottovarianti visive assenti nel pilota; inoltre in `theory.foot` eventuali espressioni LaTeX non verrebbero interpretate perché non usa `<RichText>`.
- **Giudizio sezione (`Metodo k·p`)**: **da correggere** (hover mancante sulla scheda `Teoria` pur avendo termini colorati e sulla card verifica; collisione `E_F`/`E_g`; taglio dei parametri a `800×700`; scelta colori `psi`/`v` da allineare).

---

#### 6) Pseudopotenziale

Questa è la sezione con il maggior numero di difetti visivi, di collegamento e responsivi.

- **Bloccanti**:
  1. **Nessun collegamento tra hover in formula e slider dei fattori di forma (`v3s`, `v8s`, `v11s`), e valori/teoria completamente scollegati dal sistema «formule vive»**
     - **Elemento / Larghezza / Stato**: `PseudopotentialSection.tsx` L187 e L253–285 — tutte le larghezze — tutti gli stati.
     - **Cosa si vede**:
       - A L187, gli slider `V_3^s`, `V_8^s`, `V_{11}^s` impostano `active={factorId !== null && st.activeFactor === factorId}`: quando l'utente passa col mouse su `V_ps`, `V_G`, `V^s` nella `MAIN_FORMULA`, `st.highlight` diventa `'VG'` ma `st.activeFactor` resta `null`, quindi **nessuno slider di potenziale si illumina**.
       - In `PseudopotentialValues` (L253–285) e nel pannello `theory` manca completamente `onPointerOver`/`onPointerLeave` (`hoverQuantity`): passando su `a`, `k`, `E`, `m*/m₀`, `\mu` nella scheda `Valori` **non si illumina nulla** (né sui 4 grafici né sugli slider), e il pannello `Teoria` non colora né collega i simboli.
     - **Cosa ci si aspetta**: comportamento completo e bidirezionale del meccanismo «formule vive» come nel pilota.
     - **Riproduzione**: aprire `Pseudopotenziale`, passare il mouse su `V^s` in formula o su `a` / `m*/m₀` nella scheda `Valori` e osservare gli slider e i grafici.
  2. **Overflow verticale di `min-height: 560px` taglia e nasconde i controlli sia a `1100×800` sia a `800×700`**
     - **Elemento / Larghezza / Stato**: `pseudopotential.css` L3–11 (`.stage:has(.epm-scene-top) .scene { min-height: 560px }`) — `1100×800` e `800×700`.
     - **Cosa si vede**: `77/83 px` (topbar) + `560 px` (scene) + `232–238 px` (params) = **`875 px`**, che supera l'altezza della finestra sia a `1100×800` (+75 px) sia a `800×700` (+175 px). A `800×700` gli ultimi slider (`V_8^s`, `V_{11}^s`) e i pulsanti preset finiscono fuori schermo sotto la piega.
     - **Cosa ci si aspetta**: a `1100×800` l'intera applicazione deve stare comodamente nello schermo senza scroll di pagina (proprio come il pilota); a `800×700` nessun controllo deve risultare inaccessibile.
- **Importanti**:
  3. **Testo grezzo con underscore letterale `|c_G|²` e `|G|²` in `ShellWeightsBar`, e notazione ASCII `V^s`, `E_g/E_P` nella scheda Valori**
     - **Elemento / Larghezza / Stato**: `ShellWeightsBar.tsx` L36 (`pseudopotential/strings.ts` L75), `PseudopotentialSection.tsx` L436 (`strings.ts` L117 `bareIonValue`), `strings.ts` L107 (`massGaAsCompare`) — tutte le larghezze, osservato direttamente in `final_step_151.png`.
     - **Cosa si vede**:
       - Sotto l'intestazione del pannello in basso a sinistra (`final_step_151.png`) è stampato letteralmente `Pesi in onde piane |c_G|² per guscio di |G|² nello stato scelto`.
       - Nei valori laterali (`bareIonValue` e `massGaAsCompare`), compaiono stringhe ASCII grezze come `V^s = ... eV` e `E_g/E_P` dentro `<span>` comuni anziché `<RichText>` / `<Tex>`.
     - **Cosa ci si aspetta**: pedici e apici tipografici corretti (`drawMathText` su canvas per `|c_G|²` e `|G|²`, `<RichText>` / `<Tex>` nei valori testuali).
  4. **Collisione tra titolo asse `E (eV)` e tacca numerica `15`, e collisione di `62%` sulla barra in `ShellWeightsBar`**
     - **Elemento / Larghezza / Stato**: `EpmBandPlot.tsx` L92–97 (`E (eV)` a `(L - 8, T - 5)`) e `ShellWeightsBar.tsx` L73 (`Math.max(T + 10, by - 1)`) — osservato direttamente in `final_step_151.png` (`1440×900`).
     - **Cosa si vede**:
       - In `EpmBandPlot` (destra in `final_step_151.png`), `E (eV)` si sovrappone visibilmente al numero `15` dell'asse delle ordinate.
       - In `ShellWeightsBar` (in basso a sinistra in `final_step_151.png`), quando una barra è alta (`62%` su guscio `3`), `by - 1 = T + 5 < T + 10` viene forzato a `T + 10`, sovrapponendo la cifra `62%` al bordo superiore della barra stessa.
     - **Cosa ci si aspetta**: spostare leggermente verso l'alto l'etichetta `E (eV)` (o ridurre l'ultima tacca sopra `yMax`) e riservare `14–16 px` di margine superiore sopra le barre di `ShellWeightsBar`.
  5. **Incoerenze cromatiche interne alla sezione (`V^a`, bande di conduzione, riempimento gap)**
     - **Elemento / Larghezza / Stato**: `pseudopotential/formulas.ts` L6–14, `pseudopotential.css` L133, `FormFactorCanvas.tsx` L169, `RealSpacePseudoCanvas.tsx` L115, `EpmBandPlot.tsx` L126 e L153 — tutte le larghezze — GaAs con `Parte antisimmetrica V^a` accesa.
     - **Cosa si vede**:
       - Nella formula (`formulas.ts` L6–14), `V_ps`, `V_G`, `V^s` e `V^a` hanno tutti `q=VG` (rosso corallo `#fc6255`), mentre il pallino del toggle `V^a` (`pseudopotential.css` L133), i rombi in `FormFactorCanvas` (L169) e i core asimmetrici in `RealSpacePseudoCanvas` (L115) usano `V2G` (`#f79a8e`, salmone)! Cioè nella stessa schermata `V^a` ha un colore in formula e un colore diverso nei grafici/pulsante.
       - In `EpmBandPlot.tsx` L153 le bande di conduzione e a L126 lo shading del gap usano `TOKENS.focus` (`#58c4dd`), che è esattamente il colore semantico di `QUANTITIES.a` (passo reticolare $a$)!
       - Nella seconda formula (`formulas.ts` L7), `E_c` e `V` restano bianchi senza colore semantico.
     - **Cosa ci si aspetta**: dare `q=V2G` a `V^a` in formula (coerente con grafico e toggle) e non usare `#58c4dd` (`a`) per bande di conduzione e gap.
  6. **Salto visivo tardivo (~0,9–1,15 s) del gap al termine del worker asincrono**
     - **Elemento / Larghezza / Stato**: anteprima 51 onde → raffinamento 113 onde (`in affinamento…`) in `PseudopotentialSection.tsx` — tutte le larghezze — trascinamento rapido slider o cambio preset/estremo.
     - **Cosa si vede**: rilasciando uno slider su un valore estremo (es. GaAs con $V_3^s = -0{,}35\text{ Ry}$), per circa 1 secondo viene mostrato il valore a 51 onde (`0,747 eV`) seguito da uno scatto netto a 113 onde (`0,794 eV`, differenza ~0,047 eV), senza transizione interpolata ma con un salto secco delle curve e delle cifre.
     - **Cosa ci si aspetta**: o ridurre il dislivello percepito interpolando brevemente al rientro dal worker oppure rendere più evidente la fase provvisoria sull'etichetta numerica del gap/curve finché il worker è in corso.
- **Minori**:
  1. **Piccolo contatto visivo in `FormFactorCanvas` / `RealSpacePseudoCanvas` sull'etichetta `v(0) = −⅔ E_F`**
     - **Elemento / Larghezza / Stato**: `FormFactorCanvas.tsx` L154, osservato in `final_step_151.png` (`1440×900`).
     - **Cosa si vede**: l'etichetta `v(0) = −⅔ E_F` sfiora leggermente la curva tratteggiata in salita verso `q = 0`.
  2. **Raffronto `EpmBandPlot` linea `μ` dietro al box `gap diretto`**: in `EpmBandPlot.tsx` L188–193 e L244–249, la presenza di uno sfondo opaco (`TOKENS.bg` alpha `0.88`) salva la leggibilità del testo del gap quando $\mu$ è al centro del gap (molto meglio di `BandPlot`), anche se la linea tratteggiata entra direttamente contro il bordo del testo.
- **Giudizio sezione (`Pseudopotenziale`)**: **da correggere** (bloccanti su «formule vive» incompleto/scollegato e su overflow a `1100×800` e `800×700`, oltre a `|c_G|²` grezzo, collisione `E (eV)`/`15`, `62%` sulla barra e incoerenza colore `V^a` / bande di conduzione).

---

### 4.3 Risposte esplicite agli 8 punti dell'incarico

*(Nota di metodo: dove segnalato, distinguo esplicitamente tra **difetti oggettivi** rispetto alle specifiche di `progetto.md` / pilota e **preferenze personali** di chi scrive.)*

#### 1. Coerenza con il pilota (`Elettroni quasi liberi`)
- **Cornice comune**: topbar, sidebar, controlli inferiori (`ParamSlider`, `PresetMenu`), card laterale (`Panel`) e token scuri (`#0e1116` / `#141923`) sono coerenti tra tutte e 6 le sezioni grazie alla condivisione di `shell.tsx` e `ui.css`.
- **Deviazioni oggettive dal pilota**:
  - `Metodo k·p` introduce 3 pannelli impilati a sinistra (anziché 2) e un layout interno del pannello formula proprio (`.kdotp-formula-subhead`, divisori tratteggiati, callout) più una card separata `NearlyFreeVerifyCard`.
  - `Pseudopotenziale` introduce una griglia mista 2×2 (spazio reale + fattore di forma + bande `E(k)` + barre gusci `|c_G|²`). In sé le griglie sono ben motivate dalla fisica diversa della sezione, ma i `min-height` locali (`474px` in `k·p`, `560px` in `Pseudopotenziale`) rompono la regola responsiva senza scroll a `1100×800` / `800×700` che il pilota (e `Legami forti`) rispettano fino a `800×700` (sia pur comprimendo i canvas nel pilota).
  - La nota `footnote` in `src/renderer/src/strings.ts` L11 parla ancora della «Prima versione: è attiva la sezione Elettroni quasi liberi» — refuso oggettivo.

#### 2. Sistema di colori (`progetto.md` § «Design visivo»)
- **Regola di riferimento**: `un colore = una grandezza` (`a=#58c4dd`, `k=#f4d345`, `E=#83c167`, `Ek=#aab1bb`, `VG=#fc6255`, `V2G=#f79a8e`, `psi=#dc75cd`, `mstar=#b189f0`, `v=#5cd0b3`, `EF=#ff9f5a`).
- **Difetti oggettivi**:
  - **`Pseudopotenziale` — conflitto diretto**: `V^a` è `VG` (`#fc6255`) in `formulas.ts` ma `V2G` (`#f79a8e`) in CSS/canvas (`pseudopotential.css` L133, `FormFactorCanvas.tsx` L169, `RealSpacePseudoCanvas.tsx` L115). Inoltre le bande di conduzione e la fascia di gap in `EpmBandPlot.tsx` (L126, L153) usano `TOKENS.focus` (`#58c4dd`, che è il ciano di `a`!), introducendo ambiguità diretta sullo schermo dove $a$ è il parametro principale dello slider 1.
  - **`Kronig–Penney` — collisione visiva sul grafico e sugli slider**: `L(E)` / `\alpha` / `\beta` usano il verde di `E` (rendendo verde sia la funzione oscillante che le energie delle bande); `a`, `b`, `c` usano tutti il ciano di `a`; `t` e `W` usano il verde-acqua di `v` (velocità); `E_1, E_2` usano `V2G`.
  - **`Legami forti` — collisione slider**: `t_s`, `|t_p|`, `t`, `W` e perfino `<dt>banda p</dt>` usano `v` (`#5cd0b3`), e `\bar{E}_s`/`\bar{E}_p` (o `E_A`/`E_B`) usano `Ek` (`#aab1bb`), illuminando coppie di slider distinte sullo stesso hover.
  - **`Metodo k·p` — prestiti tra sezioni**: `\Delta` / banda `so` usano `psi` (magenta di $\psi_k$), `E_P` / `P` usano `v` (velocità di gruppo), `E_g` usa `VG`. Qui non c'è collisione *dentro* la singola sezione, ma si perde l'invarianza semantica tra sezioni.

#### 3. Formule vive (`progetto.md` § «Meccanismo delle formule vive»)
- **Cosa funziona davvero** (verificato su codice e browser):
  - `Elettroni quasi liberi`: completo su formula, valori, teoria, slider e entrambi i canvas.
  - `Reticolo vuoto e schemi di zona`: completo su formula, valori, teoria, slider e grafici (con distinzione fine tra `G` e `a` in `ZoneSchemesPlot.tsx` L163–164, L503).
  - `Kronig–Penney`: attivo sui pannelli formula, valori, teoria, canvas (con `sub` per `b`/`c`), ma passando su `a` in formula non si evidenziano `b`/`c`.
  - `Legami forti`: attivo su formula, valori, teoria, canvas e slider, ma `t_s`/`|t_p|` e `\bar{E}_s`/`\bar{E}_p` (e `E_A`/`E_B`) mancano di `sub` e quindi si accendono a coppie.
- **Dove manca (difetti oggettivi)**:
  - **`Pseudopotenziale` (grave)**: `ParamSlider` di `v3s/v8s/v11s` ignora `highlight === 'VG'` (`PseudopotentialSection.tsx` L187), quindi la formula non illumina mai gli slider di potenziale; inoltre `PseudopotentialValues` e `theory` non hanno proprio `onPointerOver` / `hoverQuantity` (`L253–285`).
  - **`Metodo k·p`**: il pannello `theory` (`KDotPSection.tsx` L167–236) colora i simboli con `\htmlData{q=…}` ma non monta `hoverQuantity`, lasciando l'utente con simboli colorati non interattivi; idem `NearlyFreeVerifyCard` (`L437–469`).
  - **Comune (`controls.tsx`)**: i `ToolToggle` nella topbar non partecipano all'hover verso formula/grafici.

#### 4. Leggibilità a tutte le larghezze (`1440×900`, `1100×800`, `800×700`)
- **`1440×900`**: nessun overflow orizzontale o verticale su nessuna sezione; layout arioso, proporzioni bilanciate. Restano i problemi interni ai canvas (`E (eV)` su `15` e `62%` su barra in `Pseudopotenziale`, `E_F` su `2|V_G|` in `BandPlot`).
- **`1100×800`**: le prime 5 sezioni stanno nella viewport senza scroll globale; **`Pseudopotenziale` va invece in overflow verticale (+75 px)** a causa di `min-height: 560px` (`875 px > 800 px`).
- **`800×700`**:
  - **Difetto comune menu**: aprendo il drawer laterale, `.nav-brand` copre `.nav-toggle` a `(12, 8)` senza bottone di chiusura esplicito.
  - **Difetto comune grafici nelle prime 3 sezioni**: senza `min-height`, il pannello grafico inferiore scende a `204.3 px` (basso per diagrammi complessi).
  - **Overflow verticale in `Metodo k·p` (+44 px)** e soprattutto **`Pseudopotenziale` (+175 px)**, che taglia controlli/preset/slider inferiori sotto la piega.
  - Nessun overflow orizzontale indesiderato rilevato sulle griglie principali.

#### 5. Coerenza dei grafici e degli assi
- **Stile generale**: griglie sottili, assi puliti, sfondo opaco uniforme, curva morbida e uso coerente dei colori delle bande nella maggior parte dei plot.
- **Difetti oggettivi**:
  - `.view-tag { text-transform: uppercase }` (`ui.css` L299–305) trasforma ovunque `k → K`, `v(q) → V(Q)`, `m₀/m* → M₀/M*`.
  - `ShellWeightsBar.tsx` L36 stampa literal ASCII `|c_G|²` e `|G|²` nel titolo sopra le barre.
  - `BandPlot.tsx` L432 + `tight-binding/strings.ts` L68 stampa literal ASCII `V_G` nella legenda `Confronto` di `Legami forti`.
  - `pseudopotential/strings.ts` L107, L117 stampa `V^s` ed `E_g/E_P` come testo ASCII grezzo nei valori laterali.
  - `EpmBandPlot.tsx` L92–97 sovrappone `E (eV)` alla tacca `15`.
  - `ShellWeightsBar.tsx` L73 sovrappone `62%` al bordo alto della barra quando la barra è molto alta.
  - `BandPlot.tsx`, `ZoneSchemesPlot.tsx`, `KronigBandsAndConditionPlot.tsx`, `KpBandPlot.tsx`: linea `E_F` attraversa barre e/o etichette di gap (`2|V_G|`, `E_g`, `E_{g2}`).

#### 6. Stati vuoti, estremi e transizioni
- **Parametri agli estremi**: i modelli numerici non mostrano NaN o crash nei limiti degli slider; al gap chiuso ($V_G = 0$, $V_0 = 0$, $E_A = E_B$) i grafici collassano correttamente verso le bande libere / degeneri. In `Kronig–Penney` a $V_0 = 30\text{ eV}$ le bande diventano quasi piatte e le etichette di gap si impilano con rischio di contatto su `E_F`.
- **Cambio rapido di preset**: le animazioni `GLIDE` (700 ms) nel pilota e in `k·p` sono morbide e ordinate via `useTweened`; in **`Pseudopotenziale`** invece la doppia computazione 51 → 113 onde introduce un'attesa di ~1 secondo seguita da uno scatto secco di gap e bande (es. ~0,047 eV su GaAs estremo) senza rampa né indicatore sufficientemente localizzato vicino al valore che cambia.
- **Tutti gli strumenti accesi**:
  - Difetto oggettivo di collisione tra `Riempimento` (`E_F`) e indicatori/etichette di gap in `BandPlot`, `KronigBandsAndConditionPlot`, `KpBandPlot`, più vicinanza della sonda `m*` alle curve in `BandPlot`.
  - In `Legami forti` (`Monoatomica`) con tutti e 4 gli strumenti attivi, il diagramma `E(k)` ha alta densità informativa ma resta interpretabile grazie ai livelli di opacità.

#### 7. Micro-testi e controlli
- **Unità e nomi**: coerenti (`Å`, `eV`, `eV·Å²`, `Ry` dove introdotto in pseudopotenziale con conversione esplicita `1 Ry = 13,606 eV`, `m₀`, `el/cella`), nomi di varianti e preset chiari e in italiano corretto.
- **Refusi residui prima versione**:
  - `src/renderer/src/strings.ts` L5: `appNote: 'nome provvisorio'`
  - `src/renderer/src/strings.ts` L11: `footnote: 'Prima versione: è attiva la sezione Elettroni quasi liberi.'` (oggettivamente obsoleto).
- **Preferenza personale (non difetto)**: in `NearlyFreeSection.tsx`, rendere visibile la stringa già presente `Valori` sopra il `<dl className="values">` separerebbe ancora meglio le equazioni simboliche dai numeri calcolati al volo, allineandola alla struttura esplicita usata in `Metodo k·p`.

#### 8. Impressioni d'uso e gerarchia visiva
- **Gerarchia primaria**: l'occhio cade subito sulla scena centrale scura e sul confronto tra potenziale reale (in alto) e diagramma `E(k)` (in basso). La guida interattiva («trascina il punto giallo sul grafico» o freccia/click su $k$) si intuisce bene grazie al punto luminoso giallo su curva e asse $x$ e alla sincronizzazione con l'onda in spazio reale.
- **Distinzione difetti vs preferenze**:
  - *Difetti oggettivi*: l'assenza dell'hover in `Pseudopotenziale` (slider/valori/teoria) e nella teoria di `k·p` disorienta chi ha già imparato il gesto sulle prime sezioni; a `800×700` il taglio di `Pseudopotenziale` nasconde i controlli principali sotto lo schermo; `.view-tag` in maiuscolo altera i simboli della fisica.
  - *Preferenze personali (non bloccanti)*: l'ordine di 3 pannelli in `k·p` (`GammaLevelsCanvas` + `MassContributionsBar` + `KpBandPlot`) aiuta molto a capire i contributi a $m_c$, quindi personalmente lo preferirei conservato rispetto a forzarlo in 2 soli pannelli pur lavorando sull'altezza a `800×700`; in `Legami forti` la mini-card `bordi vs a` nell'angolo destro potrebbe essere spostabile o lievemente più alta per dare respiro ai tick `2..6`.

---

### 4.4 Le 2 cose riuscite meglio

1. **Identità visiva matematica coerente sul modello «lavagna 3Blue1Brown» (`ui/theme.ts`, `LiveFormula`, `BandPlot`, `RealSpaceView`)**: sfondo scuro piatto senza ornamenti superflui, tratti nitidi, legenda cromatica pulita nel pilota e sincronizzazione continua tra punto $k$ sul diagramma `E(k)`, fase dell'onda stazionaria/di Bloch nello spazio reale e valori numerici istantanei (con interpolazione morbida `GLIDE` ai preset).
2. **Efficacia didattica dei grafici specializzati di sezione (`ZoneSchemesPlot`, `KronigBandsAndConditionPlot`, `GammaLevelsCanvas` + `MassContributionsBar`)**: ogni modello fisico ha la rappresentazione visiva esattamente giusta per farlo comprendere a colpo d'occhio — le repliche reciproche e lo stesso punto ripiegato nei tre schemi in `Reticolo vuoto`, l'allineamento diretto tra la condizione $|L(E)| \le 1$ a sinistra e le bande permesse a destra in `Kronig–Penney`, e la scomposizione visiva dei contributi positivi e negativi a $m_0/m^*$ in `Metodo k·p`.

---

### 4.5 Riepilogo giudizi

| Ambito / Sezione | Giudizio | Motivi sintetici |
| :--- | :--- | :--- |
| **Componenti comuni** (`strings.ts`, `ui/`, `viz/`) | **da correggere** | `.nav-toggle` coperto a `800×700`, `.view-tag` uppercase su `k`/`v(q)`/`m*`, `E_F` taglia barre/etichette gap in `BandPlot`, legenda `Confronto` senza rendering matematico, `footnote` obsoleta, strategie `min-height` incoerenti sotto i 900 px. |
| **Elettroni quasi liberi** *(pilota)* | **approvata con riserva** | Riferimento più riuscito; resta la collisione comune `E_F` / `2|V_G|` e la compressione del grafico a `800×700` (`204.3 px`). |
| **Reticolo vuoto e schemi di zona** | **approvata con riserva** | Molto fedele al pilota, hover su `G` vs `a` funzionante; resta la compressione comune a `800×700` e la possibile collisione `E_F` / `2|V_G|`. |
| **Kronig–Penney** | **da correggere** | Colori ambigui (`E`/`L(E)`, `v`/`t`/`W`, `a`/`b`/`c`), `E_F` interseca barre gap, grafico compresso a `800×700`. |
| **Legami forti** | **da correggere** | `V_G` ASCII grezzo in legenda `Confronto`, hover condiviso a coppie tra `t_s`/`|t_p|` e `\bar{E}_s`/`\bar{E}_p` (e `E_A`/`E_B`), `banda p` usa `q="v"`, collisione `E_F` / `E_g`. |
| **Metodo k·p** | **da correggere** | Hover inattivo in `Teoria` (pur con simboli colorati) e nella card verifica, collisione `E_F` / `E_g` in `KpBandPlot`, overflow verticale a `800×700` taglia `Materiale`, colori `psi`/`v` prestati. |
| **Pseudopotenziale** | **da correggere** | **Bloccanti**: hover formule→slider potenziale rotto, `Valori` e `Teoria` scollegati da `hoverQuantity`, overflow verticale (`560 px`) taglia i controlli sia a `1100×800` sia a `800×700`. Inoltre `|c_G|²` grezzo, collisioni `E (eV)`/`15` e `62%`/barra, colore incoerente `V^a` (`VG` vs `V2G`) e bande di conduzione in colore `a`, salto secco dopo worker. |
| **GIUDIZIO COMPLESSIVO** | **da correggere** | Priorità alta: correggere i componenti comuni (`BandPlot`, `.view-tag`, drawer mobile, altezza responsiva) e sistemare `Pseudopotenziale`, hover mancante in `k·p` e legende/colori in `Legami forti` e `Kronig–Penney`. |

---

## 5. Dubbi e domande per la regia

1. **Politica sui colori per grandezze non previste nei 10 token originali (`theme.ts`)**: per parametri tipici delle sezioni avanzate — `b`, `c`, `L(E)`, `t_s`, `t_p`, `W`, `\Delta`, `E_P`, `V^s`, `V^a` — la regia preferisce aggiungere 2–3 token dedicati in `theme.ts` (evitando di riusare `psi` su `\Delta`, `v` su `t`/`E_P` e `E` su `L(E)`), oppure ammettere esplicitamente un riuso documentato per sezione quando le grandezze originali (`\psi`, `v`) non compaiono nella vista? Nel frattempo per `V^a` in `Pseudopotenziale` l'uso interno deve comunque essere unificato su `V2G` tra formula, toggle e canvas.
2. **Comportamento responsive sotto i 900 px (`800×700` e `1100×800`)**: la regia preferisce che a `800×700` tutta l'app resti senza scroll di pagina (riducendo l'altezza di `Pseudopotenziale` e `k·p`) oppure accetta lo scroll verticale della sola `.stage` sotto i `900 px` pur di garantire almeno ~240–260 px a tutti i grafici (compreso il pilota)? A `1100×800`, invece, è bene confermare il vincolo di zero scroll anche per `Pseudopotenziale`.
3. **Titolo della app e footer della sidebar (`src/renderer/src/strings.ts`)**: `appNote: 'nome provvisorio'` e `footnote: 'Prima versione: è attiva la sezione Elettroni quasi liberi.'` vanno aggiornati adesso in vista della consegna o dipendono da una decisione successiva sul nome definitivo dell'applicazione?
4. **Sotto-intestazione `Valori` nel pilota**: in `nearly-free/strings.ts` esiste `valuesTitle: 'Valori'` non mostrato a schermo, mentre `k·p` mostra intestazioni di sottosezione nel pannello laterale: conviene allineare tutte le sezioni su un unico stile di intestazione nel pannello `Formula e valori`?
