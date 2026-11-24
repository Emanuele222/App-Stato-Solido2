# Rapporto Critico Grafico — Scheda «Guida alla sezione» (sezioni 1–4 Fononi)

- **Sezioni verificate**:
  1. `phonon-monatomic` — *Catena monatomica e prima zona*
  2. `phonon-diatomic` — *Catena biatomica, gap e luce IR*
  3. `phonon-3d` — *Rami 3D, polarizzazioni e cristalli reali*
  4. `phonon-wavepacket` — *Pacchetti d’onda: fase e gruppo*
- **URL ispezionato**: `http://127.0.0.1:5173/` (tramite subagent `browser`, `Model: "flash"`)
- **Risoluzioni verificate**: **1440×900**, **1100×800**, **800×700**
- **Focus specifico**: nuova scheda guida laterale (`Guida alla sezione` con i 3 blocchi aperti + `<details className="panel-details">` `Dettagli formali` chiuso di default e poi aperto + `.foot`), impaginazione/overflow, KaTeX, testo e hover bidirezionale su `\htmlData{q=...}`.
- **Verdetto**: **da correggere** *(la nuova scheda `Guida alla sezione` e `Dettagli formali` superano tutti i criteri principali su tutte e 4 le sezioni e a tutte e 3 le risoluzioni; restano però **2 difetti oggettivi Importanti** nella barra parametri di `phonon-wavepacket` e nella vista `Conteggio modi 3D` / menu di `phonon-3d`, oltre a **2 rifiniture Minori**).*

---

## 1. Sintesi delle verifiche sulla scheda «Guida alla sezione»

### Struttura e stato iniziale
In tutte e 4 le sezioni la colonna destra (`<aside className="aside">`) presenta nell'ordine:
1. `Formula viva` + blocco `.values`
2. Scheda `.theory` con titolo `Guida alla sezione`, **3 blocchi aperti** (`L’idea`, `Come intervengono i parametri`, `Cosa provare`), `<details className="panel-details">` (`Dettagli formali`, **`open === false` di default**) e nota finale `.foot`.

### Impaginazione, scorrimento e overflow orizzontale
| Sezione | 1440×900 (chiuso) | 1100×800 (chiuso) | 800×700 (chiuso) | Overflow orizzontale `<aside>` (chiuso e aperto, 1440/1100/800) |
|---|---|---|---|---|
| `phonon-monatomic` | Pagina `0`, `main` `0`, `.theory` visibile per `480,6 px` | Pagina `0`, `main` `0`, `.theory` visibile per `339,9 px` | Pagina `0`, `main` `+44,8 px`, `.theory` visibile per `204,9 px` | **0** (max `1404,8 ≤ 1440`, `1064,8 ≤ 1100`, `768,8 ≤ 800`) |
| `phonon-diatomic` | Pagina `0`, `main` `0`, `.theory` visibile per `339,0 px` | Pagina `0`, `main` `0`, `.theory` visibile per `203,4 px` | Pagina `0`, `main` `+45,6 px`, `.theory` a `y = 744,2 px` (sotto piega) | **0** (max `1404,8 ≤ 1440`, `1064,8 ≤ 1100`, `768,8 ≤ 800`) |
| `phonon-3d` | Pagina `0`, `main` `0`, `.theory` visibile per `368,2 px` | Pagina `0`, `main` `0` | Pagina `0`, `main` `+29,3 px`, `.theory` visibile per `27,0 px` (solo header) | **0** (`overflows: []` a tutte e 3 le risoluzioni) |
| `phonon-wavepacket` | Pagina `0`, `main` `0`, `.theory` visibile per `481,7 px` | Pagina `0`, `main` `0` | Pagina `0`, `main` `+40,4 px` | **0** (max `1404,8 ≤ 1440`, `1064,8 ≤ 1100`, `768,8 ≤ 800`) |

- **Da `1100×800` in su**: **nessuno scorrimento della pagina** e **nessuno scorrimento della colonna centrale (`main`)** in tutte e 4 le sezioni, anche dopo l'attivazione dei tool della topbar.
- **A `800×700`**: nessuno scorrimento di pagina; scorre verticalmente soltanto `main` (di `29–46 px` secondo la sezione, comportamento previsto a `800×700`) e `<aside>`.
- **Impatto iniziale e apertura di `<details>`**: a `1440×900` l'impatto iniziale con `Dettagli formali` chiuso è arioso (`L’idea` e gran parte di `Come intervengono i parametri` immediatamente leggibili senza scrollare). Il clic su `Dettagli formali` apre e chiude il blocco in modo fluido con rotazione della freccia `▾` (`ui.css:658–671`) e nessuna rottura di impaginazione o scrollbar orizzontale.
- **Nota positiva rispetto alle revisioni precedenti**: le scrollbar orizzontali interne a `Formula viva` e lo sforamento di `<aside>` a `800×700` precedentemente presenti in `phonon-monatomic` risultano completamente risolti.

### Console, KaTeX e igiene del testo
- **Console errori del browser**: `0` errori rilevati durante tutta la navigazione, i cambi di risoluzione, le aperture di `<details>` e l'attivazione dei tool. *(Nota metodologica: il subagent browser sandboxato segnala i `ConsoleErrors` dell'HUD e ispeziona il DOM, ma non espone un listener diretto su `console.warn` non bloccanti.)*
- **KaTeX e Markdown**: `0` elementi `.katex-error` nel DOM in tutte e 4 le sezioni (sia nei 3 blocchi aperti sia dentro `Dettagli formali` aperto e `.foot`), `0` delimitatori `$` non renderizzati, `0` `\htmlData` letterali, `0` asterischi Markdown grezzi (`*` o `**`).

### Hover su `\htmlData{q=...}` (`[data-q]`)
- **Da blocchi aperti di `Guida alla sezione` → `Formula viva`, slider e scene**: verificato attivamente (`q="C"` in monatomica e biatomica; `q="k"`, `q="C"`, `q="omegaOpt"` in 3D; `q="k"`, `q="v"` in wavepacket). L'hover accende le occorrenze corrispondenti in `Formula viva` (`.is-on`), evidenzia lo slider (`.param.is-active`) e le parti corrispondenti nella scena.
- **Da `Dettagli formali` aperto → `Formula viva`, slider e scene**: verificato attivamente (`q="C"` in monatomica e biatomica, `q="k"` in 3D e wavepacket). L'evidenziazione si propaga in modo identico ai blocchi aperti.
- **Da `Formula viva` e slider**: evidenziano in modo bidirezionale `Formula viva`, slider e scene. *(Nota architetturale, non difetto della guida: passando il cursore su `Formula viva` o sugli slider, non vengono evidenziati i simboli dentro `.theory`; il comportamento è identico a quello della sezione pilota `nearly-free/NearlyFreeSection.tsx:212–213`, dove `.theory` funge da sorgente di `onPointerOver` → `setHighlight`.)*

---

## 2. Problemi trovati (ordinati per gravità)

### Bloccanti
Nessun problema bloccante rilevato.

---

### Importanti

#### 1. Menu `<select>` di `Scenari (§6)` (`phonon-wavepacket`) e `Cristallo (Tab. 1)` (`phonon-3d`) su 3–6 righe, con compressione della scena e barra parametri espansa *(difetto oggettivo)*
- **Elemento**: Barra inferiore `.params` — menu `<select>` in `phonon-wavepacket` (`Scenari (§6)`) e in `phonon-3d` (`Cristallo (Tab. 1)`).
- **Risoluzioni e stati**:
  - **`phonon-wavepacket` — `1440×900` e `1100×800`, stato iniziale** (scenario di default `Ramo acustico dispersivo (Fig. 7) (k₀ = 0,66 π/a, σ₀ = 3,0 a)`): il `<select>` risulta stretto (`114,1 px` di larghezza) e manda a capo la voce selezionata su **6 righe** (`126,6 px` di altezza). A `1440×900` questo porta `.params` a **`183,4 px`** (contro `85,9 px` quando è selezionato `Libero`), spingendo lo slider `σ₀` su una seconda riga e comprimendo l'altezza di `.scene` di circa `98 px`.
  - **`phonon-3d` — `1440×900`, `1100×800`, `800×700`, stato iniziale (`PbTe`)**: il `<select>` `Cristallo (Tab. 1)` (`PbTe (NaCl polare, p = 2) — LO 3,3 THz · TO 1,1 THz a Γ`) va a capo su **3 righe** a `1440×900` e **4 righe** a `1100×800`, facendo scendere lo slider `ω_LO/ω_TO` su una seconda riga (`.params` = `190,4 px` a `1100×800`).
- **Suggerimento**: accorciare la stringa visualizzata nella `<option>` selezionata (spostando i dettagli numerici nella nota sottostante) oppure impedire il multi-riga sul `<select>` (larghezza minima coerente / `text-overflow: ellipsis` su riga singola) in modo che `.params` resti compatta (`1–2` righe) a `1440×900` e `1100×800`.

#### 2. Collisione tra l'etichetta `k_y` e il sottotitolo nella vista `Conteggio modi 3D (1BZ)` *(difetto oggettivo)*
- **Elemento**: Vista superiore `Conteggio modi 3D — Born–von Kármán e 1BZ (Fig. 17)` in `phonon-3d`, quadrante sinistro `Griglia 2D in 1BZ (N = 8, N² = 64 punti)`.
- **Risoluzione e stato**: **1440×900**, con il toggle `Conteggio modi 3D (1BZ)` attivo.
- **Problema**: l'etichetta gialla `k_y` in cima all'asse verticale della griglia `1BZ` tocca e si sovrappone direttamente alle lettere centrali del sottotitolo `Griglia 2D in 1BZ (N = 8, N² = 64 punti)`.
- **Suggerimento**: aumentare leggermente il margine superiore interno della griglia 2D o spostare `k_y` di qualche pixel a lato dell'asse verticale (analogamente a `k_x` a destra).

---

### Minori

#### 3. Punteggiatura o parentesi di chiusura/apertura orfane a capo attorno a formule inline in `.theory` *(difetto oggettivo)*
- **Elemento**: Paragrafi di `Guida alla sezione` e `Dettagli formali` (`src/renderer/src/ui/tex.tsx:26–35`, `RichText` spezza il testo in `<span>` separati ai confini `$`).
- **Risoluzioni e stati osservati**:
  - `phonon-monatomic` (`1100×800`, blocco `L’idea`): il punto finale `.` va a capo isolato sotto `...vettore d’onda k`.
  - `phonon-diatomic` (`1440×900`, `Come intervengono i parametri` e `Dettagli formali`): parentesi `(` isolata a fine riga prima di `±π/a)`, `v_g < 0)`, `|R_cm|/u_max = 1)`.
  - `phonon-3d` (`1440×900`, `Come intervengono i parametri`): `(` isolata prima di `p = 2` con la `)` a inizio riga successiva.
- **Suggerimento**: includere le eventuali parentesi tonde attorno a una sola formula corta dentro il blocco `$...$` oppure avvolgere il gruppo punteggiatura+formula con `<span className="nowrap">` in `RichText` per i segni di interpunzione attaccati a un token matematico.

#### 4. A `800×700`, `Formula viva` spinge `Guida alla sezione` al margine inferiore o sotto la piega iniziale in `phonon-3d` e `phonon-diatomic` *(osservazione oggettiva legata al formato stretto)*
- **Elemento**: Colonna destra `<aside>` (`310 px` di larghezza a `800×700`).
- **Risoluzione e stato**: `800×700` iniziale (`Dettagli formali` chiuso).
- **Dettaglio**: in `phonon-3d` il blocco `Formula viva` + `.values` occupa `673 px` su `700 px`, lasciando visibile all'apertura solo la testata `GUIDA ALLA SEZIONE` (`27 px`); in `phonon-diatomic` raggiunge `744 px`, rendendo visibile `Guida alla sezione` solo dopo aver scorso `<aside>`. Non compromette l'uso né crea overflow orizzontale, ma è bene tenerne conto se si volessero compattare ulteriormente le righe di `.values` alle larghezze strette.

---

## 3. Le due cose riuscite meglio

1. **Impatto della nuova scheda `Guida alla sezione` con `<details>` `Dettagli formali`**: la gerarchia a due livelli (3 blocchi essenziali subito visibili: *L’idea*, *Come intervengono i parametri*, *Cosa provare*, con le derivazioni formali raccolte dentro `Dettagli formali` chiuso di default e la nota `.foot` separata) rende la colonna destra molto più ariosa a `1440×900` e `1100×800`, eliminando completamente ogni overflow orizzontale in tutte e 4 le sezioni anche a `800×700`.
2. **Collegamento vivo e pulizia tipografica KaTeX**: zero errori KaTeX e zero sintassi grezza in tutte e 4 le sezioni; i tag `\htmlData{q=...}` funzionano sia nei 3 blocchi aperti sia dentro `Dettagli formali`, mantenendo la coerenza cromatica `un colore = una grandezza` tra testo teorico, formule vive, slider e scene 1D/3D.

---

## 4. Verdetto finale

**da correggere**

La nuova **scheda guida laterale** (`Guida alla sezione` + `<details>` `Dettagli formali` + `.foot`) è **positiva sotto tutti gli aspetti richiesti** (layout, zero scroll da `1100×800` in su, zero overflow orizzontale, KaTeX pulito, hover su `\htmlData{q=...}` attivo ovunque). Per chiudere il verdetto complessivo sulle 4 sezioni in esecuzione restano da sistemare i **2 problemi Importanti** fuori dalla scheda guida: il `<select>` multi-riga in `.params` (`phonon-wavepacket` su 6 righe e `phonon-3d` su 3–4 righe) e la sovrapposizione di `k_y` sul sottotitolo in `Conteggio modi 3D` (`phonon-3d`).
