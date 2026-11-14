# Incarico Gemini 02 — sezione «Reticolo vuoto e schemi di zona»

**Ruolo: autore di sezione.** Scrivi in `src/renderer/src/sections/empty-lattice/`, aggiungi se serve funzioni a `src/renderer/src/physics/` con i loro test, e registri la sezione in `sections/registry.ts`. Nient'altro.

## Contesto
La sezione pilota «Elettroni quasi liberi» è finita e fissa stile, componenti e struttura dei file: è il tuo modello. Leggila tutta prima di scrivere: `src/renderer/src/sections/nearly-free/` (manifest, strings, formulas, store, model, componente), poi `ui/` e `viz/` per sapere cosa puoi riusare. Guardala anche in esecuzione (`npm run dev:web`; si apre anche una finestra Electron, è normale).

Claude Opus può stare correggendo `ui/`, `viz/` e `sections/nearly-free/` mentre lavori: quei file non sono tuoi.

## Fonti
- `materiale/parte3/dispensa.tex`, §9 «Periodicità nello spazio reciproco e schemi di zona» (righe 769–899 circa), in particolare «Conseguenze: schemi di zona e reticolo vuoto».
- `materiale/parte4/dispensa.tex`, §5.1 «Tre modi di disegnare le bande» (righe 1317–1345 circa).
- Formulario della Parte 3, righe «Periodicità in k» e «Zona ridotta».
- Notazione: tabella «Notazione» di `progetto.md` (m₀, E_k, E₀, G, mai ε_k).

## Cosa deve capire lo studente
1. Senza potenziale l'energia è la parabola libera, ma la periodicità del reticolo permette di descrivere ogni stato con un k nella prima zona: la parabola si **ripiega**.
2. Zona estesa, ridotta e periodica sono tre disegni dello **stesso** spettro.
3. Ogni ramo della zona ridotta è la parabola traslata di un vettore G del reticolo reciproco.
4. I rami si incrociano in k = 0 e in k = ±π/a: è lì che un potenziale aprirà i gap (aggancio alla sezione «Elettroni quasi liberi»).

## Cosa costruire
- **Parametro**: passo reticolare `a` (2,5–6 Å, iniziale 3), con lo stesso colore di grandezza usato nella pilota.
- **Scelta dello schema**: zona estesa, ridotta, periodica. Il passaggio da uno schema all'altro deve essere una transizione animata in cui si vede ogni tratto di parabola traslare di G nella prima zona, non un cambio di immagine: è il cuore della sezione.
- **Diagramma E(k)** ad assi assoluti (k in Å⁻¹, E in eV), con i bordi di zona ±π/a, ±2π/a, ±3π/a che si muovono cambiando `a`. Ogni ramo ha un indice n di G = 2πn/a riconoscibile.
- **Stato scelto**: clic o trascinamento su un ramo, come nella pilota. Mostra lo stesso stato nei tre schemi: k nella zona estesa, k′ ridotto, e il G che li lega (k = k′ + G).
- **Spazio reale**: lo stato è un'onda piana e^{i(k+G)x}, quindi |ψ|² è uniforme. Mostra la parte reale dell'onda sopra gli ioni in x = n·a, così cambiando ramo si vede cambiare la lunghezza d'onda mentre la fase da uno ione al successivo resta e^{ik′a}.
- **Formula viva**: E = ħ²(k+G)²/2m₀ con G = 2πn/a; periodicità E(k+G) = E(k); zona ridotta −π/a < k ≤ π/a; E₀ = ħ²π²/2m₀a². Passando su G si evidenzia il ramo dello stato scelto; passando su `a` i bordi di zona.
- **Valori vivi**: π/a, G, E₀, stato scelto (k esteso, k′ ridotto, n, energia), energie degli incroci (E₀ e 9E₀ al bordo, 4E₀ in k = 0).
- **Strumenti trasversali**, come nella pilota:
  - Riempimento: 1–4 elettroni per cella; senza gap è sempre un metallo (per 2 elettroni E_F = E₀, dispensa P3 §11.6).
  - Massa efficace: m* = m₀ ovunque, è il termine di paragone per le altre sezioni.
  - Confronto: sovrapponi le bande degli elettroni quasi liberi con V_G = −0,5 eV, per mostrare dove si aprono i gap.
- **Scheda teoria** breve, tratta dalle fonti sopra. Testi in un file di stringhe della sezione.
- **Registrazione**: in `sections/registry.ts` sostituisci `component: null` della voce `empty-lattice` con il tuo componente (più l'import). Non cambiare altro in quel file.

## Regole
- Riusa `ui/` e `viz/` così come sono. Se `BandPlot` o `RealSpaceView` non bastano (schemi esteso e periodico, onda reale), costruisci una vista locale dentro la cartella della sezione appoggiandoti a `viz/canvas.ts`, e nel rapporto descrivi cosa converrebbe spostare in `viz/`. Non modificare `ui/` né `viz/`.
- Nessuna fisica nell'interfaccia: ripiegamento nella prima zona, corrispondenza tra schemi, incroci dei rami vanno in `physics/`, ciascuno con un test su un numero di riferimento della dispensa o su un limite analitico. `emptyLatticeBands` esiste già.
- Stessi colori di grandezza, stessa struttura di file, stesso comportamento di evidenziazione e impulso della pilota. Interfaccia in italiano, numeri con la virgola.
- Deve reggere da 800 px di larghezza in su, anche con i tre strumenti attivi. Nessun errore in console.
- Nessuna dipendenza nuova. Niente commit.

## Verifica prima di consegnare
`npm run typecheck`, `npm test`, `npm run build` eseguiti davvero. Guarda la sezione in esecuzione a 1440, 1100 e 800 px: cambio di schema, cursore, scelta dello stato, formula viva, strumenti. Controlla che la sezione «Elettroni quasi liberi» funzioni ancora.

## Consegna
`reviews/gemini/02-reticolo-vuoto.md`, con la struttura indicata in `AGENTS.md`, più: funzioni aggiunte a `physics/`, modifiche che proporresti a `ui/` e `viz/`, difetti noti lasciati aperti.
