# Rapporto Incarico 16 — Riparazione di «Pseudopotenziale» dopo l'incarico 14

## 1. Cosa hai fatto

Ho riparato la sezione «Pseudopotenziale» (`src/renderer/src/sections/pseudopotential/`), la fisica 1D (`src/renderer/src/physics/pseudoCore1d.ts` e `pseudoCore1d.test.ts`) e i due toni derivati in `src/renderer/src/ui/theme.ts` secondo i punti A1–A6, segno continuo lungo le bande e B1–B6 dell'incarico 16.

### Modifiche per file
- **Fisica (`src/renderer/src/physics/pseudoCore1d.ts` e `pseudoCore1d.test.ts`)**:
  - Aggiunta `pseudoCore1DBandsWithStates` per risolvere le bande 1D e gli autovettori lungo tutto il cammino con **segno continuo**: in Γ banda 0 mantiene $\psi_c(0) > 0$, bande $\ge 1$ usano $\operatorname{Re}\psi(a/2) > 0$ per la parte pari (oppure $\psi(0) > 0$) e, quando la parte pari è nulla, la derivata della parte dispari in $x = 0$ positiva ($\sum (k+G)c_G > 0$); lungo il cammino da Γ verso $\pm\pi/a$ il segno viene allineato imponendo $\sum c_G(k_i) c_G(k_{i\pm 1}) > 0$. `pseudoCore1DBands` (usata dal test di tempo e dalla Home) non è stata toccata.
  - Aggiunta `parityDecomposition1D` che valuta $\psi$ su 2001 punti in $[-a/2, a/2]$ e calcola i pesi della parte pari ($\operatorname{Re}\psi$) e dispari ($\operatorname{Im}\psi$) nella cella e nel core ($|x| < r_c$), insieme ai rispettivi cambi di segno nel core (`evenSignChanges`, `oddSignChanges`, con guardia contro il rumore numerico $\le 10^{-7}$ relativo sugli stati puri).
  - Aggiunti 2 nuovi test in `pseudoCore1d.test.ts` (tabella completa della parità su banda 1 e Γ bande 2–3 + continuità del segno su tutti gli 81 punti delle bande 1–3 al default e agli 8 estremi dei cursori). Non toccato il test di tempo né `physics/pseudopotential.test.ts`.
- **Tema (`src/renderer/src/ui/theme.ts`, sole due voci `coreState` e `screenedPotential` di `DERIVED_TONES`)**:
  - `screenedPotential`: cambiato in `{ from: 'VG', color: '#f5b378', name: 'pseudopotenziale V + V′ (tinta chiara di V_G)' }` (albicocca/ambra caldo derivato da `VG`, nettamente distinto dalle barre di $V$ in `#fc6255`, da $E$ in `#83c167` e da `coreState` in `#6fb6ff`).
  - `coreState`: `{ from: 't', color: '#6fb6ff', name: 'stato di core ψ_c ed E_c (tinta di t)' }` mantenuto invariato dopo aver verificato che la grandezza `t` (`#75a4ff`) non compare in nessuna vista, formula, controllo o valore della sezione `pseudopotential` (`grep -rn "quantity=['\"]t['\"]|quantityColor(['\"]t['\"])|--q-t" src/renderer/src/sections/pseudopotential/` = 0 risultati).
- **Modello, store, manifest, testi e stile (`model.ts`, `store.ts`, `manifest.ts`, `strings.ts`, `pseudopotential.css`)**:
  - `model.ts`: rimossa completamente la rotazione di $-i$ e `oddByParity`; il modello usa `pseudoCore1DBandsWithStates` e `parityDecomposition1D`, esponendo `psiCoreIm`, `psiTrueIm`, `psiSmoothIm` e i pesi pari/dispari di cella e core.
  - `store.ts`: aggiunto `{ exact?: boolean }` a `setParam` così il pulsante `E − E_c` imposta esattamente `f = E − E_c` senza arrotondare allo step `0,5` del cursore. **Scelta su `k` dopo il clic**: `f` resta fisso al valore impostato e non segue i successivi spostamenti di `k`, perché `f` è il parametro di proiettore costante di $\tilde V_{\mathrm{ps}} = V + f|\psi_c\rangle\langle\psi_c|$ e mantenerlo fisso mostra la banda $E_c(k) + f$ che interseca $E(k)$ nello stato selezionato.
  - `manifest.ts`: allineato `PARAMS[4].default` a `0.59` (coerente con `DEFAULT_PARAMS.alpha = 0.59` e lo stato di apertura `parte liscia`).
  - `strings.ts`: aggiunti i testi condizionati per la vista «Tutto» (B3) e il passo 3 (A4), la voce legenda compatta `parte dispari`, il valore `parte dispari nel core`, `aria-label` senza `_` (`pesi c con G al quadrato`), l'elenco puntato ordinato per i tre passi nella scheda teoria e l'aggiunta in «Rispetto agli altri metodi» (A5, più `3 onde in Γ`).
- **Canvas e vista (`PseudoCoreRealSpaceCanvas.tsx`, `PseudoCoreReciprocalCanvas.tsx`, `PseudopotentialSection.tsx`)**:
  - `PseudoCoreRealSpaceCanvas.tsx`: disegna sempre `Re ψ_k` (linea piena `#dc75cd`) e `Im ψ_k` (`parte dispari`, linea puntinata `[2, 3]` da `1,5 px` in `#dc75cd`, attenuata linearmente sotto l'1 % nella cella fino a `0` a `0 %`, così in Γ banda 1 non compare alcuna linea extra); disegna `Im ψ_c` (puntinata) e `Im ψ^f` (tratto-punto sotto `Im ψ_k`, quando $\alpha \ne 0$) solo se pesano $\ge 1\%$ nella cella; marca i cambi di segno nel core per entrambe le parti ($\ge 1\%$ nel core): pallino pieno per `Re ψ_k` e cerchietto vuoto per `Im ψ_k`.
  - `PseudoCoreReciprocalCanvas.tsx`: gestito `guidedStep === 3` sia in «Quante onde piane» (attenuati i pesi $|c_G|^2$, evidenziate le due curve di errore e i numeri) sia in «Cancellazione» (evidenziata solo la coppia di barre `n = 1` e la relativa lettura); abbassato il pavimento logaritmico dell'asse errori a $10^{-6}\text{ eV}$ (`logMin = -6`); etichetta unica `13 = 13` quando i due numeri coincidono; segno meno tipografico `−` su tutti i numeri negativi dell'asse `n` in entrambe le schede.
  - `PseudopotentialSection.tsx`: aggiunto lo stato `parte dispari nel core`, i cambi di segno separati per parte pari e parte dispari (omettendo la parte $< 1\%$ nel core), il nesso causale a 1 riga nella vista «Tutto», la scritta compatta `V = V + V': 13` quando coincidono e l'elenco `<ol>` nella scheda teoria.

---

### Tabella di controllo dei punti A1–A6, segno continuo e B1–B6

| Punto | Stato | File | Come verificato |
|---|---|---|---|
| **A1** Rimozione rotazione $-i$, parte pari/dispari di $\psi_k$, $\psi^{\mathrm f}$, $\psi_c$, legenda e continuità su 81 punti | **Fatto** | `model.ts`, `PseudoCoreRealSpaceCanvas.tsx`, `PseudopotentialSection.tsx`, `strings.ts` | Ispezione screenshot in Γ b1, $0{,}3\pi/a$ b1, $\pi/a$ b1, Γ b2, $k_{41}$ b2; leggenda su 1 riga |
| **A2** Cambi di segno nel core separati (`parte pari: … · parte dispari: …`, omettendo $< 1\%$) | **Fatto** | `PseudopotentialSection.tsx`, `pseudoCore1d.ts` | Verificato in DOM in Γ b1, $0{,}05\pi/a$, $0{,}3\pi/a$, $\pi/a$, Γ b2, $k_{41}$ b2, Γ b3 |
| **A3** Valore a schermo `parte dispari nel core` (`0 %` in Γ b1, `89 %` a $0{,}3\pi/a$) | **Fatto** | `PseudopotentialSection.tsx`, `strings.ts` | Letto dal DOM: `0 %` (Γ b1), `28 %` ($0{,}05\pi/a$), `89 %` ($0{,}3\pi/a$), `100 %` (π/a e Γ b2) |
| **A4** Testi condizionati (passo 3, «Tutto», «Quante onde piane» ed etichetta `13 = 13`) | **Fatto** | `strings.ts`, `PseudopotentialSection.tsx`, `PseudoCoreReciprocalCanvas.tsx` | Verificato a $0{,}3\pi/a$ b1 e Γ b2 (nessun «13 invece di 13»; etichetta `13 = 13` visibile in screenshot) |
| **A5** Scheda teoria («Rispetto agli altri metodi» con modello 1D e Si $1s, 2s, 2p$) | **Fatto** | `strings.ts` | Verificato nel sorgente e nella build servita |
| **A6** Funzione pura parità/cambi di segno + test sulla tabella della regia | **Fatto** | `pseudoCore1d.ts`, `pseudoCore1d.test.ts` | Test Vitest `decomposizione pari/dispari…` verde contro tutti i 10 stati della tabella |
| **Segno continuo** In Γ regola pari/dispari, poi continuità lungo 81 punti (bande 1–3, default + 8 estremi) | **Fatto** | `pseudoCore1d.ts`, `pseudoCore1d.test.ts`, `model.ts` | Test Vitest `segno continuo lungo le bande 1–3…` verde su 9 configurazioni $\times$ 80 passi $\times$ 3 bande |
| **B1** Pulsante `E − E_c` imposta $f = E - E_c$ esatto ($E_c + f = E$ entro $10^{-6}$ eV) | **Fatto** | `store.ts`, `PseudopotentialSection.tsx` | Cliccato nel browser in Γ b1: cursore mostra `32,2 eV`, valore mostra `E_c + f = 13,089 eV` (= `E`) |
| **B2** Passo 3 della lettura guidata nella vista «Onde piane» (curve errore + coppia `n = 1` in Cancellazione) | **Fatto** | `PseudoCoreReciprocalCanvas.tsx` | Screenshot in Γ b1 al passo 3 su entrambe le schede: pesi/altre barre attenuati al 25 % |
| **B3** Nesso causale a 1 riga nella vista «Tutto» con testi condizionati | **Fatto** | `PseudopotentialSection.tsx`, `strings.ts`, `pseudopotential.css` | Banner alto `23,70 px` (1 riga) a `1440×900` e `1100×800`; verificato in Γ b1, $0{,}3\pi/a$, Γ b2 |
| **B4** Toni `screenedPotential` (da `VG`) e verifica assenza di `t` per `coreState` | **Fatto** | `ui/theme.ts` | `screenedPotential` = `#f5b378` (`from: 'VG'`); 0 usi di `t` verificati con `grep`; verificati su screenshot |
| **B5** Pavimento curva errore abbassato a $10^{-6}\text{ eV}$ | **Fatto** | `PseudoCoreReciprocalCanvas.tsx` | Asse logaritmico fino a `10⁻⁶` visibile in tutti gli screenshot; `H + V'` scende fino a $N = 11$ |
| **B6** `aria-label` senza `_`, `−` tipografico su asse `n`, elenco in scheda teoria, `3 onde in Γ`, `alpha default: 0.59` | **Fatto** | `strings.ts`, `PseudoCoreReciprocalCanvas.tsx`, `PseudopotentialSection.tsx`, `manifest.ts` | `0` `_` nel DOM visibile; `−4`, `−2` tipografici in entrambe le schede; elenco `<ol>` visibile in screenshot |

---

### Tabella della parità ricalcolata (`parityDecomposition1D` su 2001 punti, $a = 4{,}0$, $V_0 = 60$, $s = 0{,}25$)

| Stato | Dispari core (regia) | Dispari core (`parityDecomposition1D`) | Dispari cella (regia) | Dispari cella (`parityDecomposition1D`) | Onde $V / V+V'$ (regia) | Onde $V / V+V'$ (`planeWaveConvergence1D`) |
|---|---|---|---|---|---|---|
| $\Gamma$, banda 1 | 0 % | **0,00 %** | 0 % | **0,00 %** | 11 / 3 | **11 / 3** |
| $0{,}025\pi/a$, banda 1 | — | **9,27 %** | — | **1,12 %** | 11 / 3 | **11 / 3** |
| $0{,}05\pi/a$, banda 1 | 28,3 % | **28,34 %** | 4,2 % | **4,20 %** | 11 / 7 | **11 / 7** |
| $0{,}1\pi/a$, banda 1 | 58,6 % | **58,65 %** | 13,7 % | **13,74 %** | 11 / 9 | **11 / 9** |
| $0{,}2\pi/a$, banda 1 | 81,4 % | **81,42 %** | 33,8 % | **33,87 %** | 11 / 11 | **11 / 11** |
| $0{,}3\pi/a$, banda 1 | 89,1 % | **89,06 %** | 49,9 % | **49,93 %** | 13 / 11 | **13 / 11** |
| $0{,}6\pi/a$, banda 1 | 97,2 % | **97,22 %** | 82,9 % | **82,93 %** | 13 / 11 | **13 / 11** |
| $\pi/a$, banda 1 | 100 % | **100,00 %** | 100 % | **100,00 %** | 13 / 11 | **13 / 11** |
| $\Gamma$, banda 2 | 100 % | **100,00 %** | 100 % | **100,00 %** | 13 / 13 | **13 / 13** |
| $\Gamma$, banda 3 | 0 % | **0,00 %** | 0 % | **0,00 %** | 15 / 5 | **15 / 5** |

---

## 2. Cosa hai verificato davvero

1. **Typecheck, suite completa e build di produzione** (dopo l'ultima modifica):
   - Comando: `export PATH="$PWD/.tools/node/bin:$PATH" && npm run typecheck && perl -e 'alarm 240; exec @ARGV' ./node_modules/.bin/vitest run && npm run build`
   - Risultato: uscito con codice `0`; `tsc --noEmit` (node + web) senza errori; `vitest run` **24/24 file, 222/222 test passati** (inclusi i 14 test di `pseudoCore1d.test.ts`); `electron-vite build` completata (`✓ built in 524ms`).
2. **Misure DOM e verifica visiva nel browser** (build di produzione servita su `http://localhost:5173` via `vite preview`, verificata tramite subagente browser con ispezione diretta degli screenshot; **0 errori di console** su tutta la sessione; server chiuso a fine verifica):
   - **Layout alle tre finestre** (Γ banda 1, vista «Tutto»):
     - `1440×900`: canvas Spazio reale **`390,20 px`** ($\ge 360\text{ px}$), Onde piane **`235,54 px`**, Bande 1D **`237,81 px`**, banner **`23,70 px`** (1 riga), legenda **`17,09 px`** (1 riga), barra comandi **`81,24 px`** (**2 righe**), scroll pagina `0 px`, overflow `.live-formula` `0 px`, `_` visibili in `.section` `0`.
     - `1100×800`: canvas Spazio reale **`309,45 px`** ($\ge 300\text{ px}$), Onde piane **`166,54 px`**, Bande 1D **`168,81 px`** ($\ge 150\text{ px}$), banner **`23,70 px`** (1 riga), legenda **`17,09 px`** (1 riga), barra comandi **`81,24 px`** (**2 righe**), scroll pagina `0 px`, overflow `.live-formula` `0 px`, `_` visibili `0`.
     - `800×700`: scorre solo `.stage` (`pageScrolledBy = 0`, `stageScrolledBy = 300`), viste impilate (Spazio reale `312,02 px`, Onde piane `194,71 px`, Bande 1D `197,98 px`), barra comandi `198,76 px` (5 righe), overflow `.live-formula` `0 px`, `_` visibili `0`.
   - **Stati verificati con valori e scritte lette a schermo**:
     - **Γ banda 1 (apertura)**: banner `ψᶠ è liscia: ⟨T⟩ 0,90 invece di 4,83 eV, un’onda pesa 93,5 %, 3 onde invece di 11.`; `parte dispari nel core: 0 %`; `cambi di segno nel core: parte pari: 2 (x = ±0,413 Å)`; `onde per errore < 0,01 eV: V: 11 · V + V′: 3`; nessuna linea dispari visibile nello spazio reale.
     - **Pulsante `E − E_c = 32,2 eV`**: cliccato → cursore mostra `32,2 eV`, `livello di core con f` mostra `E_c + f = 13,089 eV` (= `E = 13,089 eV`). Spostando `k` di un passo (`E = 13,075 eV`), `f` resta fisso a `32,2 eV`.
     - **Passo 3 in Γ banda 1**: banner `Sullo ione E − V = 63,7 eV contro 3,69 eV tra gli ioni; con V + V′ bastano 3 onde piane invece di 11.`; in «Quante onde piane» i pesi $|c_G|^2$ sono attenuati e le curve `H vera` (`11`) e `H + V′` (`3`) sono evidenziate; in «Cancellazione» solo la coppia `n = 1` (`V = −8,70 eV, V+V′ = 1,20 eV`) resta accesa.
     - **`0,05π/a` banda 1 (`kIndex = 42`)**: banner `ψᶠ è liscia: ⟨T⟩ 1,08 invece di 4,90 eV, un’onda pesa 91,6 %, 7 onde invece di 11.`; `parte dispari nel core: 28 %`; `cambi di segno nel core: parte pari: 2 (x = ±0,413 Å) · parte dispari: 1 (x = 0)`; `V: 11 · V + V′: 7`.
     - **`0,3π/a` banda 1 (`kIndex = 52`)**: banner («Tutto») `Parte dispari al 89 % nel core: V′ agisce solo sulla parte pari e il vantaggio sparisce (11 onde contro 13).`; banner («3 Il risultato») `Qui ψ_k è per il 89 % dispari nel core: l’unico stato di core è pari, quindi V′ non ha niente da cancellare in quella parte e il vantaggio sparisce.`; `parte dispari nel core: 89 %`; `cambi di segno: parte pari: 2 (x = ±0,418 Å) · parte dispari: 1 (x = 0)`; `V: 13 · V + V′: 11`; nello spazio reale curva puntinata `parte dispari` chiaramente distinguibile sopra `ψ^f` e `Re ψ_k`.
     - **`π/a` banda 1 (`kIndex = 80`)**: banner `Stato dispari: ψᶠ = ψ_k, parte dispari 100 % nel core, V′ non agisce (11 onde).`; `parte dispari nel core: 100 %`; `cambi di segno: parte dispari: 1 (x = 0)`; `V: 13 · V + V′: 11`; riquadro `Stato dispari attorno allo ione: è ortogonale a ψ_c per simmetria.`.
     - **Γ banda 2 (`kIndex = 40`, `bandIndex = 2`)**: banner `Stato dispari: ψᶠ = ψ_k, parte dispari 100 % nel core, V′ non agisce (13 onde).`; `parte dispari nel core: 100 %`; `cambi di segno: parte dispari: 1 (x = 0)`; `onde per errore < 0,01 eV: V = V + V′: 13`; etichetta unica `13 = 13` sul grafico errore; curva puntinata `parte dispari` netta con pallino cavo in $x = 0$; riquadro nota stato dispari.
     - **Un passo a destra di Γ sulla banda 2 (`kIndex = 41`, `bandIndex = 2`)**: nessuna linea piatta improvvisa né artefatto `2 (x = ±0,405 Å)`; `parte dispari nel core: 100 %`; `cambi di segno: parte dispari: 1 (x = 0)`; `α = −0,066 · β_c = +0,066`; banner `Parte dispari al 100 % nel core: V′ agisce solo sulla parte pari e il vantaggio sparisce (13 onde per entrambi).`.
     - **Γ banda 3 (`kIndex = 40`, `bandIndex = 3`)**: banner `ψᶠ è liscia: ⟨T⟩ 10,53 invece di 34,90 eV, un’onda pesa 34,4 %, 5 onde invece di 15.`; `parte dispari nel core: 0 %`; `cambi di segno: parte pari: 2 (x = ±0,335 Å)`; `V: 15 · V + V′: 5`.
     - **Collegamento incrociato**: passaggio a «Bande dei materiali veri →» e rientro con `← Da dove viene Vₚₛ` con 0 errori di console.

---

## 3. Cosa non hai potuto verificare

- L'esecuzione dentro la finestra nativa di Electron (`npm run dev` non avviato; verifica eseguita sul build di produzione servito con `vite preview`, verificando comunque l'avvio di `electron-vite build` senza errori).
- La verifica interattiva della scheda teoria estesa nello scroll della colonna destra dopo l'ultima modifica al testo (verificato visivamente l'inizio dell'elenco ordinato `<ol>` nello screenshot a `1440×900` e il contenuto completo in `strings.ts`).
- L'ispezione visiva diretta nel browser degli 8 estremi dei cursori `(a, V₀, s)` dopo le ultime modifiche UI (la fisica completa e la continuità di segno agli 8 estremi sono però coperte dal test automatico in `pseudoCore1d.test.ts`).

---

## 4. Problemi trovati

- **Minore (esterno ai file permessi)** — `src/renderer/src/sections/pseudopotential/PseudoCoreBandPlot.tsx:299-313` (tasti `ArrowLeft`/`ArrowRight`): la navigazione da tastiera gestisce le frecce, mentre il tasto `End` sul canvas delle bande non è mappato (osservato durante il test browser quando `End` ha spostato solo lo slider o si è fermato prima di `80`). Comportamento preesistente delle viste a canvas.
- **Minore (esterno ai file modificabili, già segnalato nel rapporto 14)** — `src/renderer/src/viz/canvas.ts:681-718`: `placeFreeLabel` non legge `opts.occupied` nella funzione `cost`, quindi `PseudoCoreRealSpaceCanvas.tsx` continua a ricostruire `buildObstacleMap` dopo ogni etichetta.

---

## 5. Dubbi e domande per la regia

- Nessun dubbio bloccante. Segnalo la scelta adottata per il punto **B1**: dopo il clic su `E − E_c`, spostando `k` il parametro `f` resta fisso al valore impostato (non insegue $E(k) - E_c$), così la banda spostata $E_c(k) + f$ rimane una banda fissa che interseca $E(k)$ nello stato scelto. Se si preferisse invece un aggancio dinamico stile `parte liscia`, si può aggiungere facilmente un interruttore dedicato.
