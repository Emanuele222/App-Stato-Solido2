# Incarico 14 — «Pseudopotenziale»: far vedere ψ di core e perché il metodo funziona

**Ruolo: autore della correzione della sezione «Pseudopotenziale» (id `pseudopotential`).** Un solo autore, modalità normale, niente squadra. Leggi prima `AGENTS.md`, `progetto.md`, l'incarico 13 e il tuo rapporto 13.

Fonte: `materiale/parte4/dispensa.tex`, §4 — r. 864–886 (come sono fatte le funzioni di core e di valenza, perché la valenza oscilla nel core), r. 888–909 (perché poche onde piane non bastano), r. 913–933 (onde piane ortogonalizzate), r. 988–1064 (pseudo-Schrödinger), r. 1069–1072 (perché V_ps è piccolo). Non eseguire gli script Python di `materiale/`.

## Perché questo incarico

Giudizio dell'utente: «non si vede bene la ψ di core; la sezione deve dare l'intuizione del perché questo metodo funziona rispetto ad altri». La regia ha controllato sulla build attuale e conferma: la fisica dell'incarico 13 è corretta, ma la scena non la mostra.

| Difetto misurato | Dove |
|---|---|
| ψ_c è una linea punteggiata di 1,4 px, al 65 % di opacità, **dello stesso colore di V(x)** | `PseudoCoreRealSpaceCanvas.tsx:125` |
| All'apertura α = 0, quindi ψ^f ≡ ψ_k: le due curve coincidono e il confronto non esiste | `manifest.ts` (`alpha: 0`) |
| ψ^f è disegnata **normalizzata**, quindi non coincide con ψ_k nemmeno fuori dal core | `model.ts:184` (`cPseudoNorm`) |
| Lo spazio reale è la vista più piccola: 270×159 px a 1100×800; il core occupa il 16 % della larghezza | `pseudopotential.css` |
| Lo stato di apertura (k = 0,3π/a) è quello in cui l'effetto si vede meno | `manifest.ts` (`defaultKIndex: 52`) |
| L'indicatore «peso in \|n\| ≤ 3» vale 99,91 % contro 99,91 %: non distingue nulla | pannello dei valori |
| `smoothestAlpha` diverge: in Γ sulla banda 2 restituisce α = −7·10¹⁰ (stato dispari, la funzione di core «vince» il minimo normalizzato) | `physics/pseudoCore1d.ts:318` |
| Formule tagliate a destra (349 e 494 px in 319 px), a 1100 e a 1200 px | formula viva |
| Il riquadro «E − E_c = 31,2» copre il valore del cursore f; comandi su tre righe (138 px) a 1100×800 | barra dei comandi |
| Simboli scritti con il trattino basso («ψ_c», «E_c», «r_c») in legende, titoli e valori; «1.9e-16» con il punto | testi |

## Permessi, solo per questo incarico

| Percorso | Cosa puoi fare |
|---|---|
| `src/renderer/src/sections/pseudopotential/` | Tutto |
| `src/renderer/src/physics/pseudoCore1d.ts` e il suo test; `physics/index.ts` solo se serve un'esportazione | Fisica nuova e correzione di `smoothestAlpha` |
| `src/renderer/src/ui/theme.ts` | **Solo** aggiungere voci a `DERIVED_TONES` (vedi «Colori») |

Non toccare `real-bands/`, le altre sezioni, `home/`, `registry.ts`, `App.tsx`, `ui/` (oltre a quanto sopra), `viz/` (se ti serve una modifica, descrivila nel rapporto), `materiale/`. Nessuna dipendenza nuova. Niente commit.

## Che cosa deve capire lo studente, in quest'ordine

1. **Il problema.** ψ_c sta tutta nella buca, vicino allo ione. ψ_k è autostato della stessa H con energia diversa, quindi è ortogonale a ψ_c: nel core **deve cambiare segno**, e per descrivere quell'oscillazione servono molte onde piane. In più V non è piccolo.
2. **L'idea.** Quell'oscillazione non è nuova: è una copia di ψ_c. `ψ_k = ψ^f + β_c ψ_c`. La parte di core è già nota; resta da calcolare solo ψ^f, che è liscia.
3. **Il risultato.** Per ψ^f il potenziale è `V + V′`, con V′ repulsivo nel core, e bastano poche onde piane: è per questo che gli elettroni quasi liberi funzionano con V_ps e non con V.

Lo stato in cui tutto questo è esatto e si vede meglio è **Γ sulla prima banda di valenza** (stato pari, tutto reale). Numeri di riferimento ricalcolati dalla regia (a = 4,0 Å, V₀ = 60 eV, s = 0,25 Å, 81 onde piane; zero dell'energia come oggi):

| Grandezza in Γ, banda 1 | Valore |
|---|---|
| E_c; E; E − E_c | −19,079; 13,089; 32,17 eV |
| r_c; cambi di segno di ψ_k | 0,641 Å; due, in x = ±0,413 Å |
| ψ_k sullo ione e a metà tra gli ioni (segno: positiva tra gli ioni) | −0,232; +0,783 Å^(−1/2) |
| ψ_c sullo ione | 1,202 Å^(−1/2) |
| α della parte liscia (definizione sotto); β_c = −α | +0,586; −0,586 |
| ψ^f = ψ_k + αψ_c sullo ione; minimo nel core | +0,472; +0,383 (nessun cambio di segno) |
| scarto \|ψ^f − ψ_k\| per \|x\| > 2r_c | ≤ 0,04 |
| energia cinetica media: ψ_c; ψ_k; ψ^f normalizzata | 10,57; 4,83; 0,90 eV |
| peso dell'onda piana dominante: ψ_k; ψ^f | 54,1 %; 93,5 % |
| integrando di ortogonalità ψ_c·ψ_k: area positiva; negativa | +0,1275; −0,1275 |
| energia cinetica locale E − V: sullo ione; tra gli ioni | 63,7 eV; 3,69 eV (per il core, sullo ione: 31,5 eV) |
| errore su E con N onde piane, potenziale vero | N = 3: 0,529; 5: 0,174; 7: 0,061; 9: 0,019; 11: 0,005 eV |
| errore su E con N onde piane, H + (E − E_c)\|ψ_c⟩⟨ψ_c\| | N = 1: 0,829; 3: 0,003; 5: < 0,001 eV |
| onde piane per un errore < 0,01 eV | 11 contro 3 |

Se i tuoi numeri non coincidono entro l'ultima cifra, fermati e segnalalo.

## Fisica (`physics/pseudoCore1d.ts`, funzioni pure con test)

1. **Parte liscia: criterio nuovo, sempre finito.** Sostituisci `smoothestAlpha` con il minimo dell'energia cinetica della funzione **non normalizzata** ψ_k + αψ_c, cioè
   `α = −⟨ψ_c|T|ψ_k⟩ / ⟨ψ_c|T|ψ_c⟩`.
   È la funzione che fuori dal core coincide con ψ_k e ha ∫|dψ/dx|² minimo. Vale 0 per gli stati dispari attorno allo ione (ortogonali a ψ_c per simmetria: non serve nessuna oscillazione). Test: 0,586 in Γ banda 1 (con la convenzione di segno sotto); |α| < 10⁻⁸ in Γ banda 2 e in π/a banda 1; |α| < 2 su tutte le bande 1–3 e su tutta la zona, agli 8 estremi dei cursori.
2. **Convenzione di segno per il disegno**: ψ_c positiva sullo ione; ψ_k positiva tra gli ioni nello stato di apertura, senza salti di segno trascinando k lungo la banda 1.
3. **Cambi di segno di Re ψ_k nel core** (posizioni entro |x| < r_c). Test: due, in ±0,413 Å (±0,005) in Γ banda 1.
4. **Integrando di ortogonalità** `Re[ψ_c*(x) ψ_k(x)]` su una cella, con area positiva e area negativa. Test: ±0,1275 (±0,001), somma < 10⁻⁴.
5. **Energia cinetica media** di un vettore di coefficienti. Test: 10,57; 4,83; 0,90 eV.
6. **Convergenza con il numero di onde piane**: errore su E(k) della banda scelta diagonalizzando (a) H vera e (b) `H + (E − E_c)|ψ_c⟩⟨ψ_c|` ristrette alle N onde piane di energia cinetica ħ²(k+G)²/2m₀ più bassa (ψ_c è sempre quella esatta a 81 onde). In (a) l'autovalore è quello di indice uguale alla banda; in (b) quello di indice banda − 1. Test: i valori della tabella (±0,002 eV); errori mai negativi (entro 10⁻⁹) e non crescenti con N.

I test dell'incarico 13 restano; aggiorna solo quello sulla scelta «più liscia».

## Scena

### Vista principale: spazio reale (oggi è la più piccola, deve diventare la più grande)

Finestra x ∈ [−a/2, a/2], **una cella centrata sullo ione**: il core occupa così circa un terzo della larghezza. Tre fasce sovrapposte con lo stesso asse x, la zona |x| < r_c marcata su tutte e tre con una banda tenue e l'etichetta r_c sull'asse:

1. **Energie** (circa un quarto dell'altezza): V(x) con asse in eV, e le due righe orizzontali E_c ed E(k) dello stato scelto. Si deve leggere che sullo ione E − V è molto maggiore che tra gli ioni (argomento energetico della dispensa, r. 872–874).
2. **Funzioni d'onda** (circa metà): 
   - ψ_c come **area piena** con contorno continuo di almeno 2 px, nel colore del core: deve essere la cosa più evidente del grafico;
   - ψ_k vera, linea continua, con un **pallino su ogni cambio di segno** dentro il core;
   - ψ^f = ψ_k + αψ_c **non normalizzata**, tratteggiata: fuori dal core si sovrappone a ψ_k;
   - l'area tra ψ_k e ψ^f riempita in tinta tenue del core, con l'etichetta «β_c ψ_c»: è la copia di ψ_c.
   Scala comune, asse dello zero visibile.
3. **Ortogonalità** (circa un quarto): l'integrando Re[ψ_c* ψ_k], con i lobi positivi e negativi riempiti in due toni e la scritta con le due aree e «∫ = 0». È il disegno della frase «le oscillazioni si intrecciano con quelle di ψ_c e ne cancellano l'integrale».

Etichette con fondo opaco che non coprono le curve (`placeFreeLabel` di `viz/canvas.ts`); legenda fuori dal grafico (`viz/ChartLegend.tsx`).

**Lettura guidata.** Sopra la vista, un selettore a quattro voci: «Tutto» (iniziale) · «1 Il problema» · «2 L'idea» · «3 Il risultato». Le tre voci numerate non nascondono nulla: mettono in evidenza gli elementi del passo e attenuano gli altri al 25 % (stesso meccanismo dell'evidenziazione dalle formule), e mostrano una riga di testo sotto il titolo con la frase del passo e i numeri vivi (per esempio «ψ_k cambia segno 2 volte nel core: servono 11 onde piane»). Passo 1: ψ_c, ψ_k, pallini, fascia dell'ortogonalità. Passo 2: ψ^f e l'area β_c ψ_c. Passo 3: la fascia delle energie e, nella vista delle onde piane, la convergenza e la cancellazione.

### Vista delle onde piane (sostituisce «Spazio reciproco»)

Due contenuti, scelti con un selettore nell'intestazione della vista:
- **«Quante onde piane»** (iniziale): a sinistra i pesi |c_G|² di ψ_k e di ψ^f per n = −4…4 (oggi −12…12, quasi tutto vuoto); a destra l'**errore su E(k) in funzione di N** per le due Hamiltoniane, asse logaritmico, soglia tratteggiata a 0,01 eV e i due numeri scritti accanto («11» e «3»).
- **«Cancellazione»**: le barre di oggi, ⟨k+G|V|k⟩ contro ⟨k+G|V+V′|k⟩, con asse in eV e valori leggibili.

### Vista delle bande

Resta com'è nei contenuti (core, valenza, livello di core spostato da f), più piccola. Stato di apertura: **Γ, banda 1** (`defaultKIndex` al centro della zona).

### Comandi

- α parte dal valore della parte liscia, con l'interruttore «parte liscia» **acceso**: finché è acceso α segue lo stato scelto e i parametri; muovendo il cursore α a mano l'interruttore si spegne. α = 0 è marcato sul cursore come «ψ^f = ψ_k».
- f: la tacca «E − E_c» non deve coprire il valore.
- Al massimo due righe a 1100×800.

### Valori

Togli «peso in |n| ≤ 3». Aggiungi: cambi di segno di ψ_k nel core e loro posizione; β_c = −α; energia cinetica media di ψ_k e di ψ^f; peso dell'onda piana dominante di ψ_k e di ψ^f; onde piane per un errore < 0,01 eV nei due casi; energia cinetica locale E − V sullo ione e tra gli ioni. L'ortogonalità va scritta come «< 10⁻¹⁰», non «1.9e-16».

Per gli stati dispari (α = 0) una nota: «stato dispari attorno allo ione: è ortogonale a ψ_c per simmetria».

### Formula viva e scheda teoria

- Nessuna formula tagliata: spezzala su più righe.
- `ψ_k = ψ^f + β_c ψ_c`, `β_c = −⟨ψ_c|ψ^f⟩` collegata ai comandi nei due sensi: β_c ↔ cursore α.
- Scheda teoria: riscrivi il primo paragrafo sui tre passi sopra e aggiungi un paragrafo breve **«Rispetto agli altri metodi»**, con i numeri del modello: i legami forti descrivono bene solo la banda di core (larga meno di 0,1 eV); le onde piane con il potenziale vero devono descrivere anche l'oscillazione nel core (11 onde, e V non è piccolo); le onde piane ortogonalizzate e lo pseudopotenziale tolgono la parte di core, che è nota (3 onde). Fonte: dispensa r. 849–850 e 921–933. Nessun riferimento a slide o a nomi di file.

## Colori

Un colore = una grandezza. Aggiungi a `DERIVED_TONES` in `ui/theme.ts`, con nome e tinta dichiarati, e usali da lì:
- un tono per **lo stato di core** (ψ_c, banda E_c, area β_c ψ_c, lobi dell'ortogonalità), ben distinto da V (rosso), da ψ (magenta) e da ψ^f;
- un tono per **V + V′** (oggi le barre usano il verde di E).

V(x) resta nel colore di V; ψ_k nel colore di ψ; ψ^f nel tono già esistente. Nessun codice colore scritto nei componenti.

## Regole
- Stile lavagna: fondo scuro piatto, linee nette, nessuna ombra, nessun bagliore.
- Simboli composti con KaTeX come nelle altre sezioni: a schermo nessun trattino basso.
- Italiano, virgola decimale.
- Da 1100×800 in su nessuno scorrimento; a 800×700 scorre solo la colonna centrale. Altezze minime dei grafici a 1100×800: spazio reale 300 px, le altre due viste 150 px. A 1440×900: spazio reale almeno 360 px.
- Con «riduci movimento» attivo, nessuna transizione. Nessun errore in console.
- Il collegamento «Bande dei materiali veri →» e gli strumenti restano come sono.

## Verifica prima di consegnare
- `npm run typecheck`, `npm test`, `npm run build` dopo l'ultima modifica.
- Verifica visiva a 1440×900, 1100×800 e 800×700, **guardando le schermate una per una**: all'apertura si devono distinguere a colpo d'occhio ψ_c, i due cambi di segno di ψ_k e la parte liscia. Prova poi: Γ banda 2 (stato dispari, α = 0, nessun valore assurdo), π/a banda 1, k = 0,3π/a, gli estremi dei cursori a, V₀, s, i quattro passi della lettura guidata, i due contenuti della vista delle onde piane.
- Le altre sette sezioni e la schermata iniziale funzionano come prima.

## Consegna
`reviews/gemini/14-pseudopotenziale-intuizione.md`, con la struttura di `AGENTS.md`, più: tabella dei difetti di «Perché questo incarico» (fatto / non fatto, file, come verificato) con la stessa numerazione di riga; i tuoi numeri accanto a quelli di riferimento; altezze misurate delle tre viste e della barra dei comandi alle tre finestre; nomi e codici dei toni aggiunti al tema; cosa non hai potuto verificare.
