# Incarico Gemini 08 — schermata iniziale

**Ruolo: autore della schermata iniziale.** Non è una sezione: tocca la cornice dell'app. Per questo incarico, e solo per questo, puoi scrivere in:

| Percorso (sotto `src/renderer/src/`) | Cosa puoi fare |
|---|---|
| `home/` (cartella nuova) | Tutto: è tua |
| `App.tsx` | Aggiungere lo stato «schermata iniziale oppure sezione» |
| `sections/registry.ts` | Aggiungere l'elenco dei capitoli con il loro stato; non cambiare le voci delle sezioni |
| `ui/shell.tsx`, `ui/ui.css` | Solo ciò che serve a rendere il nome dell'app un pulsante di ritorno e a correggere la barra a scomparsa (vedi sotto) |
| `strings.ts` | Testi nuovi e correzione della nota in fondo alla barra laterale |

Nient'altro: niente `viz/`, niente `physics/` (si usa così com'è), nessuna cartella di sezione. **Non lanciare questo incarico mentre i revisori A–D stanno lavorando.**

## Cosa vuole l'utente
Una schermata iniziale moderna, ordinata e facile da usare, da cui si sceglie il capitolo. Parole sue: devono apparire **solo i macro capitoli**; quelli non ancora svolti devono essere bloccati o ombreggiati con la scritta «in arrivo»; niente di disordinato. Ogni riquadro ha un'immagine che richiama il contenuto e, tenendo il cursore sopra per più di 2 secondi, mostra un'anteprima di ciò che verrà trattato.

## Cosa costruire

### Impaginazione
- All'avvio l'app mostra la schermata iniziale, non più una sezione. Nella schermata iniziale non c'è la barra laterale.
- In alto il nome dell'app (da `shellStrings.appName`, oggi provvisorio: non inventarne un altro) e una riga di presentazione.
- Sotto, una griglia regolare di **cinque riquadri uguali**, uno per capitolo, nell'ordine: Teoria delle bande, Cristallografia, Reticolo reciproco e diffrazione, Fononi, Semiconduttori. Tre colonne da 1100 px in su, due colonne a 800 px. La griglia è centrata e non si allarga oltre una misura leggibile su schermi grandi.
- Nella schermata non compaiono le singole sezioni, se non dentro l'anteprima descritta sotto.

### Riquadro attivo: «Teoria delle bande»
- **A riposo**: titolo del capitolo, «6 sezioni», e una miniatura ferma: un diagramma a bande con un gap, disegnato dal codice.
- **Anteprima**: quando il cursore resta sul riquadro per 2 secondi senza uscire (oppure quando il riquadro ha il fuoco da tastiera per 2 secondi), la miniatura si anima e scorre i sei metodi, circa 2,5 secondi ciascuno, in ciclo:
  1. Reticolo vuoto: parabola ripiegata nella prima zona.
  2. Kronig–Penney: bande e gap.
  3. Elettroni quasi liberi: gap al bordo di zona.
  4. Legami forti: bande a coseno s e p.
  5. Metodo k·p: bande c, hh, lh, so vicino a Γ.
  6. Pseudopotenziale: bande del Si lungo L–Γ–X–W–K–Γ.
  Accanto o sotto la miniatura compare l'elenco delle sei sezioni, con evidenziata quella mostrata in quel momento. Il passaggio da un metodo al successivo è una transizione morbida, non un cambio secco di immagine.
- Le curve sono **bande vere**, calcolate con le funzioni di `physics/` e i parametri iniziali di ciascuna sezione: `emptyLatticeBands`, `kronigPenneyBands`, `nearlyFreeBands`, `tightBindingMonoatomicBands`, `kaneBands`, `pseudopotentialBands` (versione ridotta: 51 onde piane, calcolata una volta sola e tenuta in memoria; niente Web Worker qui). Nessuna curva disegnata a mano.
- Uscendo dal riquadro, o togliendo il fuoco, l'animazione si ferma e si torna allo stato di riposo. Prima dei 2 secondi non succede nulla, a parte il bordo che segnala il passaggio.
- **Clic o Invio**: si entra nel capitolo alla sua prima sezione nell'ordine del corso («Reticolo vuoto e schemi di zona»).

### Riquadri bloccati: i quattro capitoli «in arrivo»
- Stessa forma e stessa misura del riquadro attivo, ma attenuati, con l'etichetta «in arrivo» ben leggibile.
- Come immagine uno schizzo fermo disegnato dal codice: punti di un reticolo (Cristallografia), macchie di diffrazione (Reticolo reciproco e diffrazione), catena di atomi che oscilla (Fononi), due bande con livelli di drogaggio nel gap (Semiconduttori).
- Non cliccabili, nessuna anteprima, nessun elenco di argomenti: i loro contenuti non sono ancora progettati e non vanno inventati. Cursore e stato di fuoco devono far capire che non sono attivi.

### Ritorno alla schermata iniziale
- Dentro una sezione, il nome dell'app in cima alla barra laterale diventa un pulsante che riporta alla schermata iniziale (nuova proprietà `onGoHome` di `AppShell`), con un'etichetta accessibile. Deve funzionare anche sotto 1024 px, dove la barra è a scomparsa.
- La nota in fondo alla barra laterale oggi dice che è attiva solo la sezione pilota: correggila o toglila.

### Barra a scomparsa sotto 1024 px (difetto trovato dalla revisione D, verificato)
- Oggi, a 800 px, la barra aperta copre il pulsante che l'ha aperta: `.nav-brand` sta sopra `.nav-toggle` e dentro la barra non c'è un comando di chiusura. Restano solo Esc e il clic sullo sfondo.
- Correzione: un pulsante di chiusura visibile in cima alla barra aperta (con etichetta accessibile), che non si confonda con il nome dell'app diventato pulsante di ritorno. Il nome dell'app e il pulsante di chiusura devono essere due bersagli distinti e ben separati.
- Scegliendo una sezione o tornando alla schermata iniziale la barra si richiude.

### Stile
- Lavagna animata, come il resto dell'app: fondo scuro piatto, linee nette, nessuna ombra, nessun bagliore, nessuna sfumatura decorativa. Il riquadro attivo si distingue per il bordo, che al passaggio prende il colore di fuoco (`TOKENS.focus`).
- Colori solo da `ui/theme.ts`: le bande nel colore dell'energia, come nelle sezioni.
- Movimento con gli strumenti di `ui/motion.ts`. Con «riduci movimento» attivo: nessuna animazione, e dopo i 2 secondi compare l'elenco delle sezioni con la miniatura ferma.
- Disegno su canvas con `useCanvasDraw`, `drawMathText`, `withAlpha` di `viz/canvas.ts`.

### Accessibilità
- Riquadri raggiungibili con Tab nell'ordine della griglia; il riquadro attivo è un pulsante vero, i bloccati hanno `aria-disabled`.
- L'anteprima non deve essere l'unico modo per sapere cosa contiene il capitolo: «6 sezioni» è sempre visibile.

## Regole
- Struttura dei file in `home/`: componenti, un file di stringhe, un file che prepara le curve dell'anteprima a partire da `physics/`, un foglio di stile. Nessuna fisica calcolata nei componenti.
- Un test (`home/*.test.ts`) sul file che prepara le curve: sei serie, valori finiti, energie ordinate.
- La schermata si apre senza ritardo percepibile: le curve dell'anteprima si calcolano solo quando servono (alla prima anteprima), non all'avvio.
- Regge da 800 px in su. Nessun errore in console. Nessuna dipendenza nuova. Niente commit.

## Verifica prima di consegnare
`npm run typecheck`, `npm test`, `npm run build` dopo l'ultima modifica. Verifica visiva obbligatoria a 1440, 1100 e 800 px:
- avvio sulla schermata iniziale; griglia regolare di cinque riquadri;
- cursore sul riquadro attivo: nulla prima di 2 s, poi anteprima con i sei metodi; uscendo si ferma;
- clic → prima sezione; nome dell'app nella barra laterale → ritorno, anche a 800 px;
- a 800 px: la barra si apre e si chiude con il suo pulsante di chiusura, con Esc e con il clic sullo sfondo;
- riquadri bloccati senza reazione;
- Tab e Invio; «riduci movimento»;
- le sei sezioni funzionano ancora.

Se il browser chiede un permesso, chiedilo all'utente in chat.

## Consegna
`reviews/gemini/08-schermata-iniziale.md`, con la struttura di `AGENTS.md`, più: elenco esatto delle modifiche ai file comuni (`App.tsx`, `registry.ts`, `shell.tsx`, `ui.css`, `strings.ts`), tempo di calcolo delle curve dell'anteprima, difetti noti.
