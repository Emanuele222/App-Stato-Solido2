# Rapporto Incarico 17 — Ritocchi a «Pseudopotenziale» dopo l'incarico 16

## 1. Cosa hai fatto

Ho eseguito tutti i ritocchi 1–6 richiesti sull'unica cartella permessa (`src/renderer/src/sections/pseudopotential/`), senza toccare `physics/`, `ui/`, `viz/` né altri file del progetto.

### Modifiche per file
- **`src/renderer/src/sections/pseudopotential/strings.ts`**:
  - **Punto 1**: nel passo 1 della lettura guidata (`step === 1`), applicata la stessa soglia dell'1 % di `formatParityCrossingsText` (`hasEven = evenWeightCore >= 0.01`, `hasOdd = oddWeightCore >= 0.01`): se resta solo la parte dispari (`!hasEven`), usa il testo degli stati dispari nel core («Stato dispari nel core: cambia segno in $x = 0$, ortogonale a $\psi_c$ per simmetria.»); se restano entrambe, nomina entrambe («Pari: …; dispari (N %): …»).
  - **Punto 2**: accorciati tutti i testi di `stepText` per i passi 0–3 intorno a ~65–78 caratteri così da stare sempre su una sola riga a `1100×800` senza troncamenti.
  - **Punto 3**: nel ramo `isOdd` del passo 0 («Tutto»), separato il caso con uguali onde (`V′ non agisce`) da quello con vantaggio parziale (`100 % dispari, 13 onde con V, 11 con V + V′` a $\pm\pi/a$ banda 1 o `15 onde con V, 13 con V + V′` su banda 3).
  - **Punto 4**: aggiunte `numberStartsWithVowel` e `pctArticle` per scegliere automaticamente l'articolo eliso in italiano davanti ai numeri che iniziano per vocale (`1, 8, 11, 80–89, 800–899`: es. `all’89 %`, `per l’89 %`).
- **`src/renderer/src/sections/pseudopotential/pseudopotential.css` e `PseudopotentialSection.tsx`** (**Punto 2**):
  - `.pseudo1d-guided-banner` fissato a `height: 24px; line-height: 19px; padding: 2px 14px; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` in modo che l'altezza non dipenda mai né da `k` né dalla presenza di glifi KaTeX.
  - Aggiunto `plainGuidedBannerTitle` in `PseudopotentialSection.tsx` per esporre l'intero testo leggibile nell'attributo `title` del banner in caso di troncamento su finestre strette (`800×700`).
- **`src/renderer/src/sections/pseudopotential/PseudoCoreReciprocalCanvas.tsx`** (**Punto 5**):
  - Quando almeno un punto mostrato raggiunge o scende sotto il pavimento `1e-6` eV, viene disegnata l'etichetta `< 10⁻⁶ eV` sulla riga più bassa (`rightL + 4, yErr(1e-6) - 6`, con sfondo `TOKENS.bg`).
- **`src/renderer/src/sections/pseudopotential/PseudoCoreRealSpaceCanvas.tsx`** (**Punto 6**):
  - Applicata alla parte pari (`evenCellFactor = evenWeightCell >= 0.01 ? 1 : Math.max(0, evenWeightCell / 0.01)`) e alla parte pari di $\psi^{\mathrm f}$ (`smoothEvenFactor`) la stessa attenuazione graduale sotto l'1 % nella cella già usata per la parte dispari: negli stati esattamente dispari ($\Gamma$ banda 2, $\pm\pi/a$ banda 1) non compare più alcuna linea piatta lungo l'asse zero.

---

### Tabella dei punti 1–6

| Punto | Stato | File | Come verificato |
|---|---|---|---|
| **1** Passo 1 negli stati quasi dispari (omissione $< 1\%$ nel core) | **Fatto** | `strings.ts` | Browser in $k_{41}$ banda 2 (passo 1): «Stato dispari nel core: cambia segno in x = 0, ortogonale a ψc per simmetria.»; $0{,}05\pi/a$ e $0{,}3\pi/a$ banda 1 nominano entrambe le parti |
| **2** Banner su 1 riga ad altezza costante in tutti i $k$ e passi ($\ge 300\text{ px}$ a `1100×800`) | **Fatto** | `strings.ts`, `pseudopotential.css`, `PseudopotentialSection.tsx` | Sweep browser a `1100×800`: **0** overflow su $972$ stati ($81\times 3\times 4$); dopo `height: 24px` su banda 1 (81 punti in «Tutto» e «1 Il problema»): variazione **`0,00 px`**, spazio reale fisso a **`309,27 px`** |
| **3** Stati dispari con vantaggio parziale (`π/a` banda 1: `13` vs `11`) | **Fatto** | `strings.ts` | Browser in $\pi/a$ banda 1 («Tutto»): «Stato dispari: ψᶠ = ψk, 100 % dispari, 13 onde con V, 11 con V + V'.» |
| **4** Articolo davanti ai numeri (`all’89 %`, `per l’89 %`) | **Fatto** | `strings.ts` | Browser in $0{,}3\pi/a$ banda 1: `all’89 %` in «Tutto» e `per l’89 %` al passo 3 |
| **5** Etichetta `< 10⁻⁶ eV` sul fondo del grafico dell'errore | **Fatto** | `PseudoCoreReciprocalCanvas.tsx` | Ispezione visiva screenshot Γ banda 1 e Γ banda 3 a `1440×900` e `800×700` |
| **6** Attenuazione sotto l'1 % della parte pari piatta negli stati dispari | **Fatto** | `PseudoCoreRealSpaceCanvas.tsx` | Ispezione visiva screenshot Γ banda 2 e $\pi/a$ banda 1 a `1440×900`: asse zero completamente pulito |

---

## 2. Cosa hai verificato davvero

1. **Typecheck, suite completa e build di produzione** (dopo l'ultima modifica a `pseudopotential.css`):
   - Comando: `export PATH="$PWD/.tools/node/bin:$PATH" && npm run typecheck && perl -e 'alarm 240; exec @ARGV' ./node_modules/.bin/vitest run && npm run build`
   - Risultato: codice `0`; `tsc --noEmit` (node + web) senza errori; `vitest run` **24/24 file, 222/222 test passati**; `electron-vite build` completata (`✓ built in 493ms`).
2. **Minimo dello spazio reale a `1100×800` e invarianza con $k$ (build servita con `vite preview` su `http://localhost:5173`, 0 errori di console)**:
   - Sweep pre-fix `height: 24px` su tutti i **972 stati** ($81\text{ punti }k \times 3\text{ bande} \times 4\text{ passi}$): **0 troncamenti** (`maxContentW = 450,03 px <= 540 px`), minimo spazio reale **`309,56 px`** ($\ge 300\text{ px}$), ma con variazione di `2,77 px` del banner tra testi con e senza KaTeX nel passo 1.
   - Dopo il fix `height: 24px; line-height: 19px;` in `pseudopotential.css` (build finale): verificato su tutti gli 81 punti $k$ di banda 1 in «Tutto» e «1 Il problema» a `1100×800`: banner costante a **`24 px`** (variazione **`0,00 px`**) e spazio reale costante a **`309,27 px`** (minimo **`309,27 px` $\ge 300\text{ px}$**, variazione **`0,00 px`**); verificato visivamente lo screenshot in `0,05π/a` banda 1 passo 1 (`1100×800`) con testo centrato verticalmente.
3. **Layout alle tre finestre (Γ banda 1, «Tutto»)**:
   - `1440×900`: spazio reale **`390,31 px`** ($\ge 360\text{ px}$), viste inferiori `235,81 px` e `238,59 px`, scroll pagina `0`, overflow `.live-formula` `0`, `_` in `.section` `0`.
   - `1100×800`: spazio reale **`309,27 px`** ($\ge 300\text{ px}$), viste inferiori `166,80 px` e `169,58 px` ($\ge 150\text{ px}$), comandi su **2 righe** (`81,86 px`), scroll pagina `0`, overflow `.live-formula` `0`, `_` `0`.
   - `800×700`: scroll `document`/`body` = `0` (scorre solo `.stage`), `title` presente sul banner, overflow `.live-formula` `0`, `_` `0`.
4. **Testi completi letti nel browser (`1440×900`, `title` / testo visibile del banner) nei 7 stati richiesti**:
   - **Γ banda 1**:
     - Tutto: `ψᶠ liscia: ⟨T⟩ 0,90 vs 4,83 eV, onda 93,5 %, 3 onde invece di 11.`
     - 1 Il problema: `ψk cambia segno 2 volte nel core per ortogonalità a ψc: 11 onde.`
     - 2 L’idea: `Tolta βcψc (βc = −0,586, α = +0,586), resta ψᶠ liscia nel core.`
     - 3 Il risultato: `E - V: 63,7 vs 3,69 eV; con V + V' bastano 3 onde invece di 11.`
   - **`0,05π/a` banda 1**:
     - Tutto: `ψᶠ liscia: ⟨T⟩ 1,08 vs 4,90 eV, onda 91,6 %, 7 onde invece di 11.`
     - 1 Il problema: `Pari: 2 cambi; dispari (28 %): 1 cambio. Servono 11 onde.`
     - 2 L’idea: `Tolta βcψc (βc = −0,572, α = +0,572), resta ψᶠ liscia nel core.`
     - 3 Il risultato: `E - V: 63,6 vs 3,64 eV; con V + V' bastano 7 onde invece di 11.`
   - **`0,3π/a` banda 1**:
     - Tutto: `Parte dispari all’89 %: V' agisce sulla parte pari (13 contro 11 onde).`
     - 1 Il problema: `Pari: 2 cambi; dispari (89 %): 1 cambio. Servono 13 onde.`
     - 2 L’idea: `Tolta βcψc (βc = −0,396, α = +0,396), resta ψᶠ liscia nel core.`
     - 3 Il risultato: `ψk è per l’89 % dispari nel core: ψc è pari, il vantaggio sparisce.`
   - **`π/a` banda 1**:
     - Tutto: `Stato dispari: ψᶠ = ψk, 100 % dispari, 13 onde con V, 11 con V + V'.`
     - 1 Il problema: `Stato dispari nel core: cambia segno in x = 0, ortogonale a ψc per simmetria.`
     - 2 L’idea: `Stato dispari: nessuna copia di ψc da togliere (α = 0, ψᶠ = ψk).`
     - 3 Il risultato: `ψk è per il 100 % dispari nel core: ψc è pari, il vantaggio sparisce.`
   - **Γ banda 2**:
     - Tutto: `Stato dispari: ψᶠ = ψk, 100 % dispari nel core, V' non agisce (13 onde).`
     - 1 Il problema: `Stato dispari nel core: cambia segno in x = 0, ortogonale a ψc per simmetria.`
     - 2 L’idea: `Stato dispari: nessuna copia di ψc da togliere (α = 0, ψᶠ = ψk).`
     - 3 Il risultato: `ψk è per il 100 % dispari nel core: ψc è pari, il vantaggio sparisce.`
   - **Un passo a destra di Γ sulla banda 2 (`kIndex = 41`)**:
     - Tutto: `Parte dispari al 100 %: V' agisce sulla parte pari (13 onde).`
     - 1 Il problema: `Stato dispari nel core: cambia segno in x = 0, ortogonale a ψc per simmetria.`
     - 2 L’idea: `Tolta βcψc (βc = +0,066, α = −0,066), resta ψᶠ liscia nel core.`
     - 3 Il risultato: `ψk è per il 100 % dispari nel core: ψc è pari, il vantaggio sparisce.`
   - **Γ banda 3**:
     - Tutto: `ψᶠ liscia: ⟨T⟩ 10,53 vs 34,90 eV, onda 34,4 %, 5 onde invece di 15.`
     - 1 Il problema: `ψk cambia segno 2 volte nel core per ortogonalità a ψc: 15 onde.`
     - 2 L’idea: `Tolta βcψc (βc = +1,075, α = −1,075), resta ψᶠ liscia nel core.`
     - 3 Il risultato: `E - V: 89,9 vs 29,89 eV; con V + V' bastano 5 onde invece di 15.`

---

## 3. Cosa non hai potuto verificare

- L'esecuzione dentro la finestra nativa di Electron (`npm run dev` non avviato; verifica eseguita sul build di produzione servito con `vite preview`, spento a fine verifica).
- La ripetizione dello sweep su bande 2 e 3 e passi 2–3 dopo la sola aggiunta di `height: 24px` al CSS del banner (lo sweep completo su tutti i 972 stati aveva già verificato 0 overflow su bande 1–3 e passi 0–3, mentre sulla build finale sono stati verificati tutti gli 81 punti di banda 1 in «Tutto» e «1 Il problema» confermando `24 px` esatti e `309,27 px` fissi).

---

## 4. Problemi trovati

- Nessun problema bloccante né importante residuo nei file dell'incarico.

---

## 5. Dubbi e domande per la regia

- Segnalo soltanto un piccolo dettaglio di forma sui testi: nell'esempio del punto 4 dell'incarico era citato `18` tra i numeri con articolo eliso (`8, 11, 18, 80–89, 800…`), ma in italiano `18` («diciotto») inizia per consonante, quindi `numberStartsWithVowel` elide davanti a `1, 8, 11, 80–89, 800–899` e mantiene `al 18 %` / `per il 18 %` per `18`. Se si preferisse altro, si cambia in una riga di `strings.ts`.
