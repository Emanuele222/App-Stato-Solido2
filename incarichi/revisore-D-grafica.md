# Incarico revisore D — grafica e usabilità

**Ruolo: revisore.** Sola lettura sul progetto. Scrivi solo il rapporto `reviews/gemini/revisione-D-grafica.md`.

La tua descrizione di ruolo è `.claude/agents/critico-grafico.md`: leggila e seguila per intero. La riga `tools:` in cima a quel file non ti riguarda: usa il tuo browser. Riferimenti di stile: `progetto.md`, parti «Design visivo» e «Meccanismo delle formule vive».

## Come aprire l'app
La build è già pronta in `out/renderer`: **non** eseguire `npm run build` né `npm run dev`, perché altri revisori la stanno usando. Servila sulla tua porta e chiudi il server quando hai finito:

```
export PATH="$PWD/.tools/node/bin:$PATH"
npx vite preview --outDir out/renderer --port 5175 --host 127.0.0.1 --strictPort
```

Apri `http://127.0.0.1:5175/`. Se il browser chiede un permesso per quell'indirizzo, chiedilo all'utente in chat: non consegnare senza aver guardato l'app.

## Cosa guardare
Le sei sezioni del capitolo, ciascuna a 1440×900, 1100×800 e 800×700 px, in tre stati: appena aperta; con tutti gli strumenti attivi; con i parametri agli estremi dei cursori. Dove esistono, tutte le varianti e tutti i preset.

La sezione «Elettroni quasi liberi» è la pilota e fissa lo stile; le altre cinque sono state scritte dopo, da un altro autore. Il confronto tra la pilota e le altre è parte del lavoro.

## Punti su cui voglio un giudizio esplicito
1. **Coerenza tra le sei sezioni**: stessi pannelli, stessi titoli, stessa impaginazione dei valori, stessi comandi nella stessa posizione, stessa densità di testo. Elenca ogni differenza.
2. **Un colore = una grandezza**, su tutto il capitolo: la stessa grandezza ha lo stesso colore in tutte le sezioni? Un colore indica grandezze diverse in sezioni diverse? Le grandezze nuove (Δ, E_P, i fattori di forma, t, E_A ed E_B) usano colori presi in prestito: dove crea confusione?
3. **Etichette sui grafici**: sovrapposizioni, testi tagliati, etichette sbarrate da linee (per esempio l'etichetta del gap attraversata dal livello di Fermi), pedici o apici scritti come testo grezzo.
4. **Formule vive**: in ogni sezione, passando su ciascun termine colorato si accende qualcosa nella scena? Elenca i termini che non fanno nulla o che accendono la cosa sbagliata.
5. **800 px**: cosa resta leggibile e cosa no. Lo scorrimento della colonna centrale è accettabile o nasconde la parte importante?
6. **Movimento**: cambi di variante, di preset e di parametro. Nello pseudopotenziale, il passaggio dal calcolo ridotto a quello completo («in affinamento») si nota come uno scatto?
7. **Cornice dell'app**: barra laterale, percorso in alto, voci «in arrivo», nota in fondo alla barra laterale (dice ancora che è attiva una sola sezione), nome provvisorio.
8. **Stile lavagna**: qualcosa che contraddice «fondo scuro piatto, linee nette, niente bagliori né decorazioni»? Qualcosa che sullo schermo non serve a capire?

## Consegna
`reviews/gemini/revisione-D-grafica.md`: per ogni sezione i problemi in ordine di gravità (elemento, larghezza, stato dell'interfaccia, cosa si vede, cosa ci si aspetterebbe); le risposte agli otto punti; un elenco separato dei difetti che stanno nei componenti comuni (`ui/`, `viz/`) e non nelle singole sezioni; le due cose riuscite meglio; verdetto per sezione e complessivo. Distingui i difetti dalle preferenze personali.
