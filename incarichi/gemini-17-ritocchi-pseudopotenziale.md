# Incarico 17 — ritocchi a «Pseudopotenziale» dopo l'incarico 16

**Ruolo: autore delle correzioni alla sezione «Pseudopotenziale».** Un solo autore, modalità normale, niente squadra, **mai insieme a un altro incarico**. Leggi prima `AGENTS.md`, l'incarico 16 (`incarichi/gemini-16-riparazione-pseudopotenziale.md`) e il suo rapporto (`reviews/gemini/16-riparazione-pseudopotenziale.md`). È un incarico piccolo: solo testi e CSS, nessuna fisica nuova.

## Esito della verifica della regia (27/11, 222 test verdi)

**Accettato, non riaprire**: tutta la fisica e i test dell'incarico 16 (`parityDecomposition1D`, tabella della parità ricalcolata in modo indipendente entro 0,03 punti percentuali, segno continuo su 2160 passaggi, α finito con max 1,23, f esatto con il pulsante), il disegno delle parti pari e dispari, il passo 3 sulle onde piane, il tono `#f5b378` di V + V′, la scheda teoria, la schermata di apertura in Γ banda 1.

## Permessi, solo per questo incarico

`src/renderer/src/sections/pseudopotential/` (in pratica `strings.ts`, `pseudopotential.css`, `PseudoCoreRealSpaceCanvas.tsx`, `PseudoCoreReciprocalCanvas.tsx`, `PseudopotentialSection.tsx`). **Non** `physics/`, non `ui/`, non `viz/`, nessun altro file. Nessuna dipendenza nuova. Niente commit. Il test di tempo in `pseudoCore1d.test.ts` non si tocca.

## Importanti

1. **Passo 1 della lettura guidata sbagliato negli stati quasi dispari** (`strings.ts`, circa riga 91, ramo finale del testo del passo 1). Quando la parte dispari pesa almeno l'1 % e la pari meno dell'1 % nel core, ma lo stato non è esattamente dispari (`isOdd` vuole 10⁻⁸), il testo cade nel ramo generico e usa i cambi di segno della parte pari («ψ_k cambia segno 2 volte nel core…»), mentre la riga dei valori dice giustamente «parte dispari: 1 (x = 0)».
   - Riproduzione: banda 2, un passo a destra di Γ, «1 Il problema». Colpiti ai valori di apertura: banda 1 indici 1–9 e 71–79; banda 2 indici 37–39 e 41–43.
   - Correzione: il passo 1 usa la stessa regola di `formatParityCrossingsText` (si omette la parte che pesa meno dell'1 % nel core). Se resta solo la parte dispari, il testo è quello degli stati dispari (cambia segno solo in x = 0, ortogonale a ψ_c per simmetria); se restano entrambe, nomina entrambe.
2. **Riga della vista «Tutto» che va a capo a 1100×800** (`.pseudo1d-guided-banner` in `pseudopotential.css`, circa riga 125, e i testi del passo 0 in `strings.ts`). Lontano da Γ la frase occupa due righe (38,6 px invece di 23,7) in 74–78 punti k su 81 di ogni banda: lo spazio reale scende a 294,5 px (minimo 300) e l'altezza delle viste cambia di 15 px a ogni passo di k. Anche i passi 2 e 3 portano lo spazio reale a 291,8–294,5 px.
   - Correzione: **l'altezza della riga non deve mai dipendere da k**. Accorcia le frasi in modo che stiano su una riga a 1100×800 in tutti gli stati (circa 80 caratteri; per esempio «ψ^f liscia; V′ agisce solo sulla parte pari: 89 % dispari, 13 onde contro 11»), e se una frase non ci sta tronca con «…» e metti il testo intero nel `title`. Vale per «Tutto» e per i passi 1, 2, 3.
   - Verifica: a 1100×800 spazio reale ≥ 300 px in **tutti** gli 81 punti k delle bande 1, 2 e 3, in «Tutto» e in ciascun passo; nessuna variazione di altezza scorrendo k con le frecce. Riporta il minimo misurato.

## Minori

3. **Testo incoerente negli stati esattamente dispari con vantaggio parziale** (`strings.ts`, circa righe 76–78, ramo `isOdd` di «Tutto»): scrive «V′ non agisce (11 onde)» usando le onde di V + V′, mentre i valori e il grafico dicono V: 13, V + V′: 11 (banda 1 indici 0 e 80; banda 3 indici 0 e 80, 15 contro 13). Scrivi i due numeri giusti («13 onde con V, 11 con V + V′») e non dire «non agisce» quando i numeri sono diversi.
4. **Articolo davanti ai numeri** (`strings.ts`, righe 82 e 104 e ovunque compaia «per il N %», «al N %», «il N %»): in italiano davanti a un numero che si legge con vocale iniziale (8, 11, 18, 80–89, 800…) si scrive «l'», «all'», «per l'» (es. «per l'89 %», «all'11 %»). Una piccola funzione nei testi della sezione che scelga l'articolo dal numero.
5. **Fondo del grafico dell'errore** (`PseudoCoreReciprocalCanvas.tsx`, circa riga 116): quando la curva arriva a 10⁻⁶ eV resta piatta sul bordo senza spiegazione (Γ banda 1 da N = 11, Γ banda 3 da N = 13). Aggiungi l'etichetta «< 10⁻⁶ eV» sulla riga più bassa quando almeno un punto è sul fondo.
6. **Parte pari piatta negli stati esattamente dispari** (`PseudoCoreRealSpaceCanvas.tsx`): disegnata piena sull'asse con l'etichetta nascosta, si legge come una linea morta. Attenuala sotto l'1 % di peso nella cella, con la stessa regola già usata per la parte dispari.

## Verifica prima di consegnare

- `npm run typecheck`, test (`perl -e 'alarm 240; exec @ARGV' ./node_modules/.bin/vitest run`), `npm run build` verdi.
- Nel browser, a 1440×900, 1100×800 e 800×700: i minimi dell'incarico 14 (spazio reale ≥ 360 px a 1440×900 e ≥ 300 px a 1100×800 in ogni stato, viste inferiori ≥ 150 px, nessuno scorrimento della pagina da 1100×800, comandi su due righe a 1100×800, nessuna formula tagliata, nessun «_» a schermo).
- Leggi e riporta nel rapporto i testi di «Tutto» e dei passi 1–3 in: Γ banda 1 (apertura, deve restare com'è), 0,05π/a e 0,3π/a banda 1, π/a banda 1, Γ banda 2, un passo accanto a Γ sulla banda 2, Γ banda 3.
- Console senza errori.

## Rapporto

`reviews/gemini/17-ritocchi-pseudopotenziale.md`, con la struttura di `AGENTS.md` e una tabella dei punti 1–6 (fatto / non fatto, file, come verificato), più il minimo dello spazio reale misurato a 1100×800 su tutti gli stati.
