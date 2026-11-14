# Incarico Gemini 03 — correzioni al reticolo vuoto e sezione «Kronig–Penney»

**Ruolo: autore di sezione.** Scrivi in `src/renderer/src/sections/empty-lattice/` (Parte A), in `src/renderer/src/sections/kronig-penney/` (Parte B), in `src/renderer/src/physics/` con i relativi test, e la riga di registrazione in `sections/registry.ts`. Nient'altro. `ui/`, `viz/` e `sections/nearly-free/` restano di Opus.

Esegui prima la Parte A, verifica, poi la Parte B.

## Parte A — correzioni a «Reticolo vuoto e schemi di zona»
La sezione è stata controllata dalla regia: funziona e rispetta il perimetro. Restano quattro punti.

1. **Schema iniziale: zona estesa.** Lo studente deve vedere prima la parabola che conosce e poi, scegliendo «Zona ridotta», il ripiegamento. Lo stato iniziale resta k = 1,5 π/a.
2. **Finestra in energia adattiva.** Oggi è fissa a 42 eV: con `a` grande le bande si schiacciano in basso. Fai come la pilota: la finestra segue `a` con una transizione interpolata, in modo che gli incroci E₀, 4E₀ e 9E₀ restino leggibili su tutto l'intervallo del cursore.
3. **Niente fisica nell'interfaccia.** In `store.ts` e `model.ts` il bordo di zona è calcolato come `Math.PI / a`, e in `ZoneSchemesPlot.tsx` (riga 763 circa) c'è la dispersione libera invertita a mano. Sposta tutto in funzioni di `physics/` con il loro test e usale da lì.
4. **Etichette a 800 px.** L'etichetta del ramo scelto (n = +1) si sovrappone al punto dello stato; sistemala anche nello schema periodico con i tre strumenti attivi.

Le tue tre proposte per `ui/` e `viz/` sono registrate e le valuterà la regia con Opus: fino ad allora il riconoscimento di G tramite testo resta com'è.

## Parte B — sezione «Kronig–Penney»

### Fonti
- `materiale/parte3/dispensa.tex`, §10 «Il modello di Kronig–Penney» (righe 899–1225 circa): enunciato, richiamo della buca finita, caso a delta, bande e limiti, barriere rettangolari, bande a coseno, livello «genitore».
- Formulario della Parte 3, gruppo «Kronig–Penney».
- Gli script `materiale/parte3/verifica_*.py` mostrano come sono calcolati i numeri della dispensa: leggili, non eseguirli.

### Notazione (dalla dispensa, attenzione)
- `k` è sempre il vettore di Bloch; α = √(2mE)/ħ; β = √(2m(V₀−E))/ħ.
- Buca larga `b` (V = 0, attorno allo ione), barriera larga `c` e alta `V₀` (tra due ioni), a = b + c.
- Caso a delta: V = aV₀ Σ δ(x − na), P = m·a²·V₀/ħ².
- Questo P non è il parametro di Kane del metodo k·p: nella sezione non deve nascere ambiguità.

### Cosa deve capire lo studente
1. È un calcolo **esatto**: la condizione di Bloch più la continuità di ψ e ψ′ danno cos ka = L(E).
2. Le bande sono le energie in cui |L(E)| ≤ 1; dove |L| > 1 non esiste un k reale: è il gap.
3. Barriere più alte o più spesse → tunnel più debole → bande più strette, fino ai livelli della buca isolata. Ogni banda ha un livello «genitore».
4. Con barriere spesse la banda diventa un coseno, E = Ē − 2t·cos ka: è il ponte verso la sezione «Legami forti».
5. I limiti: P → 0 dà l'elettrone libero, P → ∞ dà αa = nπ.

### Cosa costruire
- **Due varianti** selezionabili: «a delta» e «barriere rettangolari», con passaggio animato.
- **Parametri**: delta: `a` e `P`. Rettangolare: `b`, `c`, `V₀`, con `a = b + c` mostrato. Scegli intervalli che coprano dal quasi libero alle bande strette e motivali nel rapporto.
- **Scena, tre viste collegate**:
  - *Spazio reale*: il potenziale (delta o barriere), gli ioni al centro delle buche, |ψ|² dello stato scelto calcolata con la funzione d'onda esatta del modello.
  - *Condizione di banda*: la curva L(E) con la fascia −1…+1 evidenziata. Mettila con l'energia sull'asse verticale, accanto al diagramma E(k) e **con lo stesso asse dell'energia**: lo studente deve vedere a colpo d'occhio che i tratti dentro la fascia sono le bande e quelli fuori sono i gap.
  - *Diagramma E(k)* nella prima zona, con i gap indicati.
- **Livelli genitori**: i livelli della buca finita isolata come tacche sull'asse dell'energia, ciascuno collegato alla propria banda.
- **Bande a coseno**: sovrapposizione attivabile della curva Ē − 2t·cos ka sulla banda scelta, con t e W = 4t nei valori vivi.
- **Stato scelto**: clic o trascinamento sulla banda, come nelle altre sezioni; si evidenzia anche il punto corrispondente sulla curva L(E).
- **Formula viva**: cos ka = cos αa + P·(sin αa)/(αa) per il delta; L = cos αb·cosh βc + [(β² − α²)/2αβ]·sin αb·sinh βc = cos ka per il rettangolare (con il caso E > V₀); definizioni di α, β, P. Passando su un termine si evidenzia la parte corrispondente della scena.
- **Valori vivi**: a, P oppure V₀·c, bordi e larghezza W delle prime bande, gap, livelli genitori, stato scelto (k, banda, E).
- **Strumenti trasversali**: Riempimento, Massa efficace (confronta con m* = ħ²/2ta² della banda a coseno), Confronto con il reticolo vuoto.
- **Scheda teoria** breve, dal §10. Testi in un file di stringhe della sezione.
- **Registrazione**: in `sections/registry.ts` solo la voce `kronig-penney`.

### Regole
- Tutta la fisica in `physics/`: L(E) nei due casi (anche per E > V₀), ricerca dei bordi di banda, E(k) per inversione, funzione d'onda, livelli della buca finita, parametri della banda a coseno. Ogni funzione con un test su un numero della dispensa o su un limite analitico: P → 0, P → ∞, limite a delta delle barriere rettangolari (c → 0 con V₀·c fisso), larghezza che decresce come e^{−βc}.
- La struttura comune `BandStructure` va usata per le bande, così Riempimento, Massa efficace e Confronto funzionano come nelle altre sezioni.
- Riusa `ui/` e `viz/` così come sono; ciò che manca diventa una vista locale nella cartella della sezione, e lo segnali nel rapporto.
- Stessi colori di grandezza, stessa struttura di file e stessi comportamenti delle altre due sezioni. Interfaccia in italiano, numeri con la virgola.
- Regge da 800 px in su con tutti gli strumenti attivi. Nessun errore in console. Trascinando un cursore la scena resta fluida: dimmi come hai gestito il ricalcolo.
- Nessuna dipendenza nuova. Niente commit.

## Verifica prima di consegnare
`npm run typecheck`, `npm test`, `npm run build` eseguiti davvero dopo l'ultima modifica. Guarda entrambe le sezioni in esecuzione a 1440, 1100 e 800 px, e controlla che «Elettroni quasi liberi» funzioni ancora.

## Consegna
`reviews/gemini/03-correzioni-e-kronig-penney.md`, con la struttura di `AGENTS.md`, distinguendo Parte A e Parte B, più: funzioni aggiunte a `physics/`, intervalli scelti per i parametri, proposte per `ui/` e `viz/`, difetti noti.
