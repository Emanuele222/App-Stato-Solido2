# Incarico Gemini 09 — correzioni di fisica e di contenuto

**Ruolo: autore delle correzioni.** Nasce dalle revisioni A (fisica), B (fedeltà al corso) e C (studente): leggi `reviews/gemini/revisione-A-fisica.md`, `revisione-B-fedelta-corso.md`, `revisione-C-studente.md` per i dettagli di ogni punto (file, righe, come riprodurre). Qui trovi cosa correggere e cosa **non** toccare.

Per questo incarico, e solo per questo, puoi scrivere in:

| Percorso (sotto `src/renderer/src/`) | Cosa puoi fare |
|---|---|
| `physics/` | Correzioni e funzioni nuove, sempre con test |
| `sections/*/` (tutte e sei, compresa la pilota `nearly-free/`) | `model.ts`, `strings.ts`, `formulas.ts`, `manifest.ts`, e nei componenti solo ciò che serve ai punti sotto |
| `ui/format.ts` | Il formato unico della massa efficace (punto 3) |

Non toccare: `ui/` (tranne `format.ts`), `viz/`, i fogli di stile, `App.tsx`, `registry.ts`, `strings.ts` della radice, `home/`. Aspetto, colori, impaginazione ed etichette sovrapposte sono dell'incarico 10: non anticiparli. **Non lanciare questo incarico mentre un altro autore sta lavorando.**

## Falsi allarmi: non «correggere» queste cose
La regia li ha verificati sull'app e con un calcolo indipendente; sono corretti così.
- Revisione C, «Reticolo vuoto», onda `Re ψ` incoerente tra il 2° e il 3° ione: falso. A k = 1,5 π/a i valori sugli ioni sono 0, −1, 0, +1, 0, −1, 0 e il periodo è 4a/3 ovunque.
- Revisione C, «Legami forti», `Re ψ_k` antilegante che non cambia segno: falso. A k = 0 sulla banda E₊ vale +0,83 su A e −1,81 su B. Lo stato iniziale della variante biatomica è E₋ legante, non E₊.
- Revisione C, sonda di massa 1,35 contro 1,152 al bordo della catena biatomica: falso. A k = π/a la sonda dà 1,15.
- Revisione D, pseudopotenziale fuori schermo di 75 px a 1100×800: lo scarto misurato è 7 px. Resta un difetto di impaginazione, ma è dell'incarico 10.

## A. Fisica (`physics/` e modelli)

1. **`fillBands` con bande separate ma in ordine inverso** (`physics/filling.ts:57-65`). Oggi confronta la banda di indice N/2−1 con la N/2 e dichiara «metallo» se la prima sta sopra la seconda, anche quando tra le due c'è un gap. Deve riconoscere un isolante ogni volta che esiste un intervallo vuoto con esattamente N/2 bande interamente sotto. Test: catena monoatomica con Ē_s = −2, Ē_p = −6, t_s = |t_p| = 0,4, a = 3,5, N = 2 → isolante, gap 2,4 eV, E_F = −4,0 eV. Controlla che occupazioni, banda più alta piena e più bassa vuota siano coerenti.
2. **Potenziale chimico nello pseudopotenziale quando il gap si chiude** (`sections/pseudopotential/model.ts:453-457`). Oggi μ resta incollato a 0 eV. Il cammino L–Γ–X–U,K–Γ non campiona la zona, quindi μ non si può calcolare lì: quando gap ≤ 0 non disegnare la linea, e scrivi che le bande si sovrappongono (metallo) e che μ non è determinabile dal solo cammino. La regola «μ a metà gap se gap > 0» va in una funzione di `physics/pseudopotential.ts`, con test.
3. **Massa efficace ai flessi** (revisione A, problema 3). Vicino a un flesso la differenza seconda dà rumore e l'app stampa numeri come 34317249017. Una sola soglia, in `physics/semiclassical.ts`, oltre la quale la massa si considera divergente, e un solo formato in `ui/format.ts` che in quel caso scrive «→ ∞ (flesso)». Usalo in tutte e sei le sezioni al posto dei controlli locali (compreso `TightBindingSection.tsx:506`). Togli da `NearlyFreeSection.tsx:363` il ramo «massa zero». Dove esiste la massa analitica (k·p a due bande, `twoBandMassBreakdown`) usa quella, non la differenza finita: oggi al flesso hanno segno opposto. Test su un flesso per ciascun modello.
4. **Fisica rimasta nell'interfaccia** (revisione A, problema 4): sposta in `physics/` e richiama da lì
   - `k-dot-p/KDotPSection.tsx:371,384` → `twoBandMassBreakdown`;
   - `k-dot-p/model.ts:238` e `KpBandPlot.tsx:41` (livello a metà gap);
   - `pseudopotential/model.ts:432,442-444` e `PseudopotentialSection.tsx:351-352` (conversioni Ry → eV, stima E_g(Γ)/E_P);
   - `nearly-free/model.ts:91` → `zoneEdge1D(a)`;
   - `nearly-free/NearlyFreeSection.tsx:261,301,308,310,317` (2|V_G|, 2|V_2G|, |V_G|/E₀).
5. **Calcolo ridotto dello pseudopotenziale durante il trascinamento** (revisione A, problema 5). Con 51 onde piane e 10 punti per tratto il minimo della conduzione del Si finisce in X invece che a 0,85 di ΓX, e per alcuni valori dei cursori il gap risulta diretto mentre il calcolo completo lo dà indiretto. Due interventi:
   - porta i punti per tratto del calcolo ridotto al valore più alto che resta sotto circa 50 ms (misuralo e riportalo);
   - finché il calcolo completo non è arrivato, il modello espone un indicatore «provvisorio» e **non** dichiara il tipo di gap né la posizione del minimo. Come mostrarlo a schermo è dell'incarico 10: tu fornisci il dato e, nel pannello dei valori, il segno «≈» davanti al gap provvisorio.
6. **Massa direzionale in Γ** (revisione A, problema 8). In Γ la massa dipende dal tratto scelto. Nel pannello dei valori scrivi sempre lungo quale tratto è calcolata («lungo Γ–X»).
7. **Test mancanti** (revisione A, problema 6): `kaneMassBreakdown` su `lh` e `so`; `twoBandMassBreakdown` su `lh` e `hh`; `kronigEffectiveP`, `kronigBarrierStrength`; continuità di `kronigPenneyRectangularL` a E = V₀ ± ε; normalizzazione di `kronigPenneyDensity1D` con tolleranza 1e-4; massa del GaAs in Γ stretta attorno a 0,0988.
8. **Commento superato** in testa a `physics/linalg.ts:7-10`: il ramo hermitiano complesso esiste.

## B. Fedeltà alle dispense e chiarezza per lo studente

### Metodo k·p
9. **Formula sbagliata nel suggerimento** (`k-dot-p/strings.ts:44`): «E_g + ħ²k²/2m₀ ± P²k²/E_g» mette entrambe le parabole a E_g. Corretto (P4 r. 772): E_c ≃ E_g + ħ²k²/2m₀ + P²k²/E_g ed E_lh ≃ ħ²k²/2m₀ − P²k²/E_g. Aggiungi la riga di E_lh e la dispersione di |X⟩, |Y⟩ anche in `TWO_BAND_MATRIX_FORMULA`.
10. **Segno della massa lh tra le due varianti** (`KDotPSection.tsx:347-350` contro `380-385`). In «Quattro bande» le masse di valenza sono masse di lacuna, positive; in «Due bande» la lh compare negativa nello stesso posto. Mostra anche lì la massa di lacuna positiva, con accanto la relazione m_lh = −m*_lh (P3 r. 2119).
11. **Variante «Due bande, esatto»**: togli l'etichetta m_J = ±1/2 (senza spin–orbita J non c'è). La banda |X⟩, |Y⟩ che sale nel gap è fedele alla dispensa (P4 r. 753-755) ma disorienta: aggiungi nel pannello dei valori di quella variante una riga che lo dice in chiaro, con il rimando alla scheda teoria.
12. **Rimandi interni**: togli «(slide 41)» dai testi visibili (`k-dot-p/strings.ts:17,68,106,126,173`) e il nome dello script da `pseudopotential/strings.ts:15`. Restano i rimandi alle dispense («P4 §3»).
13. **Riquadro «Verifica sui quasi liberi»**: è il collegamento k·p → quasi liberi voluto dalla dispensa (P4 r. 646-660) e resta. Aggiungi in testa una frase che dica cos'è: lo stesso metodo applicato al modello della sezione «Elettroni quasi liberi», con i suoi parametri, per controllare la formula su un caso che si sa risolvere. Dove collocarlo è dell'incarico 10.
14. Togli la stringa inutilizzata `verification.minusLabel` o usala.

### Reticolo vuoto
15. **k e k′** (`empty-lattice/formulas.ts:21,29,31`): una sola convenzione in tutta la sezione, quella già usata in «Valori» e nella scheda teoria — k esteso, k′ ridotto. Quindi E(k′) = ħ²(k′+G)²/2m₀, −π/a < k′ ≤ π/a, k = k′ + G. Aggiungi E_k = ħ²k²/2m₀ tra le definizioni e ψ_{n,k+G} = ψ_{n,k} accanto alla periodicità dell'energia.
16. **Confronto con i quasi liberi poco leggibile**: con V_G = −0,5 eV su una scala di 45 eV il gap è alto pochi pixel e in k = 0 non si apre nulla. Per il solo confronto usa valori più grandi e un V_2G non nullo, scelti perché i tre gap si vedano, e dichiaralo a schermo come «valori indicativi, scelti per rendere visibili i gap».
17. **Stato fuori scala** sul ramo n = −2 (E = 51 eV oltre il tetto di 45): l'asse deve seguire lo stato scelto.
18. Riga del riempimento con testo ripetuto («metallo (2 el./cella) per 2 elettroni/cella (metallo senza gap)»): una sola formulazione.

### Kronig–Penney
19. **Un solo nome per la funzione del caso a delta**: la dispensa usa f(αa) (P3 r. 1079, formulario r. 2282). Usalo in formula, asse, suggerimento e valori; di' una volta che è la L(E) del caso a delta.
20. **Simboli non definiti**: definisci P_eff = m₀ a V₀ c/ħ² tra le definizioni del caso rettangolare (limite a delta, P3 r. 1129-1137); nel caso a delta spiega che aV₀ è l'area della barriera e V₀ il potenziale medio equivalente su una cella.
21. **Segno ∓ della banda a coseno**: scrivi il segno effettivo della banda scelta (− per le dispari, + per le pari). Aggiungi W ∝ e^{−βc} tra le formule.

### Elettroni quasi liberi (pilota)
22. **Equazione centrale e pesi delle onde piane**: mancano, e sono il cuore di P3 §11.3–11.4 (r. 1325, 1380; formulario r. 2290-2292) oltre che previsti da `progetto.md`. Aggiungi nella scheda teoria l'equazione centrale e la stima c_{nG} ≃ V_{nG}/(E_k − E_{k+nG})·c₀; nel pannello dei valori una riga con i pesi |c_G|² delle tre onde piane più importanti per lo stato scelto, presi dagli autovettori già calcolati in `physics/`. Al bordo devono dare 50 % e 50 %.
23. **«calcolato»**: accanto a 2|V_G| e 2|V_2G| compare un secondo numero senza spiegazione. Etichette esplicite: «formula a due onde» e «calcolo completo (N onde piane)».
24. **Isolante a 4 elettroni per cella con V_2G = 0**: il gap di secondo ordine in k = 0 (0,03 eV) non si vede sul grafico. Quando il gap è così piccolo, la riga del riempimento lo dice: valore del gap e «secondo ordine, non visibile a questa scala». La nota V_G²/2E₀ in `strings.ts:125` non è nella dispensa: presentala come nota oltre l'approssimazione a due onde.
25. **Preset**: scegliendo un materiale V_2G torna a 0. Allinea Germanio a 0,66 eV e Diamante a 5,5 eV (P4 r. 809, P3 r. 221). Aggiungi m₀/m*_± = 1 ± 2E₀/|V_G| tra le formule del bordo.

### Legami forti
26. **b_A e b_B** compaiono nei valori senza essere definiti: aggiungi nella formula viva della variante biatomica lo stato di Bloch con i due coefficienti e lo sviluppo E_± ≃ E_{B,A} ± W cos²(ka/2) (P4 r. 2210).
27. **Legge indicativa t(a)**: scrivi a schermo i valori fissati (a₀ = 3 Å, lunghezza 0,8 Å) e rinomina la lunghezza da λ a ℓ, perché in P4 §3 λ è la costante spin–orbita.

### Pseudopotenziale
28. **V₃ˢ del Si**: le bande restano con −0,21 Ry (coincidono con `epm_bande.npz`). Il riquadro dello ione nudo usa invece il valore della tabella della dispensa, −0,211 Ry = −2,87 eV (P4 r. 907, 1109).
29. **Preset Ge**: aggiungilo. Fattori simmetrici dalla tabella P4 r. 1109-1111 (−0,269; 0,038; 0,035 Ry), passo 5,658 Å da `materiale/parte4/verifica_pseudo.py:54` (leggilo, non eseguirlo). Dichiara a schermo da dove viene il passo. Test: gap indiretto con minimo della conduzione in L. Se il risultato contraddice la dispensa, fermati e segnalalo. Aggiorna la nota sotto il menu dei materiali.
30. **Notazione**: pedice **k** in `PSEUDO_EQ_FORMULA`; fattori di forma scritti con il loro guscio (V^s_{|G|²}); la nota della dispensa «r_c ≃ metà della lunghezza di legame» nella didascalia della vista reale (P4 r. 1121-1122); la catena v(q) = v_ion(q)/ε(q) accanto a v(0) = −⅔E_F. Controlla che la parte liscia si chiami allo stesso modo ovunque (la revisione C segnala ψ^f e φ^f: uniforma al simbolo della dispensa).
31. **Simboli senza spiegazione vicino ai comandi**: una riga ciascuno per τ (vettore tra i due atomi della base) e per i gusci |G|² = 3, 4, 8, 11.

## Regole
- Nessuna fisica nei componenti. Ogni correzione in `physics/` ha il suo test.
- Dispense in sola lettura; cita la riga quando cambi un numero o una formula.
- Regge da 800 px in su. Nessun errore in console. Nessuna dipendenza nuova. Niente commit.

## Verifica prima di consegnare
`npm run typecheck`, `npm test`, `npm run build` dopo l'ultima modifica. Verifica visiva nel browser di ogni punto che cambia qualcosa a schermo; se il browser chiede un permesso, chiedilo all'utente in chat. `grep -rnE "Math\.(PI|cos|sin|exp|sqrt)|RYDBERG|HBAR" src/renderer/src/sections/` e spiega nel rapporto ogni riga rimasta.

## Consegna
`reviews/gemini/09-correzioni-fisica-e-contenuti.md`, con la struttura di `AGENTS.md`, più una tabella dei 31 punti: fatto / non fatto / fatto in parte, con il file toccato e come l'hai verificato. Elenca a parte ciò che lasci all'incarico 10.
