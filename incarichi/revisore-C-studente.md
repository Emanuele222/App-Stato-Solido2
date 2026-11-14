# Incarico revisore C — lo studente

**Ruolo: revisore.** Sola lettura sul progetto. Scrivi solo il rapporto `reviews/gemini/revisione-C-studente.md`.

La tua descrizione di ruolo è `.claude/agents/studente.md`: leggila e seguila per intero. La riga `tools:` in cima a quel file non ti riguarda: usa il tuo browser. Non leggere il codice né le dispense prima di aver usato l'app: devi sapere solo ciò che sa lo studente.

## Come aprire l'app
La build è già pronta in `out/renderer`: **non** eseguire `npm run build` né `npm run dev`, perché altri revisori la stanno usando. Servila sulla tua porta e chiudi il server quando hai finito:

```
export PATH="$PWD/.tools/node/bin:$PATH"
npx vite preview --outDir out/renderer --port 5174 --host 127.0.0.1 --strictPort
```

Apri `http://127.0.0.1:5174/`. Se il browser chiede un permesso per quell'indirizzo, chiedilo all'utente in chat: non consegnare senza aver usato l'app.

## Cosa fare
Usa le sei sezioni nell'ordine della barra laterale, che è l'ordine del corso: Reticolo vuoto e schemi di zona, Kronig–Penney, Elettroni quasi liberi, Legami forti, Metodo k·p, Pseudopotenziale. Finestra larga circa 1440 px.

Per ogni sezione segui i passi del tuo ruolo (attese, uso, annotazioni, spiegazione in cinque righe). In più:
1. Prova **ogni** comando: cursori, varianti, preset, i tre strumenti, il passaggio del mouse sui termini della formula, il clic e il trascinamento sui grafici, le frecce da tastiera.
2. Annota il primo minuto: senza leggere la scheda teoria, capisci cosa stai guardando e cosa puoi fare?
3. Annota ogni parola o simbolo usato senza essere introdotto.
4. Annota dove un numero o un'etichetta cambia e non capisci perché.

Alla fine, guardando il capitolo intero:
5. Il passaggio da una sezione alla successiva ha senso? Capisci perché esistono sei metodi e cosa aggiunge ciascuno?
6. Gli stessi comandi si comportano allo stesso modo in tutte le sezioni, o devi reimparare ogni volta?
7. Quale sezione ti ha fatto capire di più e quale di meno, e perché.

## Consegna
`reviews/gemini/revisione-C-studente.md`: per ogni sezione la tua spiegazione in cinque righe, i problemi in ordine di gravità (dove, cosa è successo, cosa ti avrebbe aiutato), le due cose più utili e il verdetto; poi le risposte ai punti 5–7 e un elenco finale dei dieci interventi che aiuterebbero di più, dal più importante.
