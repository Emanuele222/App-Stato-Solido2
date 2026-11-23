# Incarico 15 — riparazione di «Legami forti in 2D» e «Bande dei materiali veri»

**Ruolo: autore delle correzioni alle due sezioni.** Un solo autore, modalità normale, niente squadra. **Mai insieme a un altro incarico**: gli incarichi 12 e 13 sono stati eseguiti in parallelo, la build era rotta a metà e l'autore del 12 ha consegnato senza aver mai potuto aprire la sua sezione. Leggi prima `AGENTS.md`, `progetto.md`, gli incarichi 12 e 13 e i due rapporti.

## Esito della verifica della regia (build del 15/11, 159 test verdi)

**Accettato, non riaprire**: tutta la fisica di `physics/tightBinding2d.ts` (quadrato −4t / 0 / +4t, m* = ħ²/2ta²; grafene ±3t, ±t, 0 nei sei vertici, v_F = 9,06·10⁵ m/s = c/331, g(E) lineare) e dell'alluminio (E_F = 11,65 e 5,60 eV, k_F = 1,127 e 0,782·2π/a, 3 e 1 bande che tagliano E_F), ricalcolate a parte; Si 0,82, Ge 0,95 in L, GaAs 1,93 eV invariati; `three` caricata solo all'apertura della sezione; regola `script-src 'self'` intatta; clic sulla superficie che sceglie lo stato; rotazione; nessun errore in console entrando e uscendo tre volte; cursori dell'Al bloccati; schermata iniziale con 8 sezioni nel riquadro da 356 px.

**Da riparare**: tutto ciò che segue. Altezze misurate dei grafici (px, larghezza × altezza):

| Vista | 1440×900 | 1200×900 | 1100×800 | 800×700 |
|---|---|---|---|---|
| 2D · superficie E(k_x, k_y) | 820×38 | 640×23 | 540×5 | 490×0 |
| 2D · bande lungo il cammino | 481×192 | 374×192 | 315×168 | 490×156 |
| 2D · spazio reale | 331×191 | 258×191 | 217×167 | 490×155 |
| Bande vere · fattore di forma | 410×157 | 320×151 | 270×95 | 490×125 |
| Bande vere · pesi per guscio | 409×0 | 319×0 | 269×0 | 490×0 |
| Bande vere · bande | 820×448 | 640×433 | 540×320 | 490×16 |
| Bande vere · barra dei comandi (altezza) | 99 | 120 | 141 | 257 |

## Permessi, solo per questo incarico

`src/renderer/src/sections/tight-binding-2d/`, `src/renderer/src/viz/Surface3D.tsx`, `src/renderer/src/sections/real-bands/`. Nient'altro: non `ui/`, non `physics/`, non `pseudopotential/` (è dell'incarico 14), non `home/`, `registry.ts`, `App.tsx`. Nessuna dipendenza nuova. Niente commit.

## A. Legami forti in 2D

1. **La superficie 3D non si vede.** `.scene` ha due righe (`ui/ui.css:322`, 36fr e 64fr) e `.tb2d-scene` è il suo unico figlio: finisce nella prima riga e il resto dello spazio resta vuoto; il `min-height: 300px` del pannello non ha effetto. Correggi dal foglio di stile della sezione (come fa `pseudopotential.css` con `.scene:has(…)`), senza toccare `ui/`. Minimi: superficie 300 px a 1100×800 e 360 px a 1440×900, le altre due viste 150 px; a 800×700 scorre solo la colonna centrale, con gli stessi minimi di 1100×800.
2. **Scheda «In breve» illeggibile.** I paragrafi sono passati a `<Tex>` (`TightBinding2DSection.tsx:392` e `397`), quindi tutto il testo è composto come formula, senza spazi, e KaTeX riempie la console di avvisi. Usa `RichText` di `ui/tex`, come le altre sezioni, con le formule tra `$…$`.
3. **Formula di m̃ in rosso**: `\dd` non è un comando di KaTeX (`formulas.ts:41`).
4. **Inquadratura iniziale.** Con l'altezza corretta, nel quadrato la cima della superficie esce dal riquadro e l'etichetta X è tagliata; nel grafene la superficie esce da tutti i lati. All'apertura, e dopo «Vista iniziale», devono stare dentro il riquadro tutta la zona di Brillouin, tutta la superficie e tutte le etichette, alle tre finestre.
5. **Grafene: non si vede che le bande si toccano.** La banda π* è una cupola semitrasparente che copre tutto. Nella vista iniziale si devono riconoscere le due bande e almeno due punti di contatto K e K′: scegli angolo della camera, opacità e linee di livello di conseguenza (resta lo stile senza illuminazione).
6. **«Vai a K»** porta la camera così vicino che il riquadro è tutto verde e il punto dello stato è un disco enorme. Deve mostrare il cono: le due bande attorno a K entro circa un quarto di |ΓK|.
7. **Strumenti.**
   - *Riempimento*: il piano di E_F è un rettangolo opaco molto più grande della zona. Limitalo alla zona di Brillouin e rendilo davvero semitrasparente; la linea di Fermi deve restare la cosa più visibile.
   - *Confronto*: il cono di Dirac a fil di ferro si estende ben oltre il riquadro. Disegnalo solo fin dove ha senso confrontarlo (per esempio |E| ≤ t); stesso criterio per la parabola dell'elettrone libero e per il paraboloide osculatore del quadrato.
8. **Punto dello stato scelto**: dimensione costante sullo schermo, a qualunque distanza della camera.
9. **Spazio reale**: la legenda è disegnata dentro il grafico, sopra gli atomi, e l'ultima riga del reticolo è tagliata. Legenda fuori (`viz/ChartLegend.tsx`), reticolo intero.
10. **Testi**: nessun trattino basso a schermo («E(k_x, k_y)», «v_F», «E_F», «g(E_F)», «δ_i»: composti con KaTeX); «9,06·10^5 m/s» → 10⁵; la massa dell'elettrone è m₀ come nel resto dell'app, non mₑ.
11. **Tutta la «Verifica prima di consegnare» dell'incarico 12**, che non è mai stata fatta: le tre finestre, entrambi i reticoli, tutti gli strumenti, clic sulla superficie, uscita e rientro ripetuti, «riduci movimento», e la **finestra Electron** (`npm run dev`). Riporta i pesi della build: oggi file principale 1 815 kB (era 1 679), pezzo di `three` 1 908 kB.

## B. Bande dei materiali veri

1. **«Pesi in onde piane per guscio» è vuota**: il canvas è alto 0 px a tutte le finestre (`.pseudo-shells-box`, `realBands.css:85–98`). Minimo 64 px di barre, come prima della divisione.
2. **Fattore di forma**: 95 px a 1100×800; minimo 150 px.
3. **800×700**: il grafico delle bande è alto 16 px e i comandi 257 px. La colonna centrale deve scorrere con gli stessi minimi di 1100×800 (bande 300 px).
4. **Comandi**: al massimo due righe e 130 px a 1100×800, anche con GaAs (interruttore V^a) e con Al (selettore degli elettroni); oggi i valori toccano l'etichetta successiva («−0,252 RyV₈ˢ»).
5. **Formule tagliate a destra**: 354 e 376 px in 319 px a 1100×800; 376 in 359 px a 1440×900. Spezzale su più righe.
6. **Alluminio**: la legenda dice «4 bande di valenza» e «conduzione», che per un metallo nel reticolo vuoto non hanno senso; usa una voce sola, «bande del reticolo vuoto».
7. Prova i due collegamenti tra le sezioni, «Bande dei materiali veri →» e «← Da dove viene V_ps»: la regia non li ha provati.

## Regole
- Stile lavagna: fondo scuro piatto, linee nette, nessuna ombra, nessun bagliore. Colori solo da `ui/theme.ts`.
- Da 1100×800 in su nessuno scorrimento; nessuno scorrimento orizzontale. Italiano, virgola decimale.
- Nessun errore **né avviso** in console.
- **Prima di consegnare la build deve passare e devi aver guardato le schermate una per una.** Se la build è rotta per colpa di file non tuoi, fermati e avvisa l'utente: non consegnare.

## Verifica prima di consegnare
`npm run typecheck`, `npm test`, `npm run build` dopo l'ultima modifica. Verifica visiva delle due sezioni a 1440×900, 1100×800 e 800×700: quadrato e grafene con strumenti spenti e accesi; Al (3 e 1 elettrone), Si, Ge, GaAs con strumenti spenti e accesi. Le altre sei sezioni e la schermata iniziale come prima.

## Consegna
`reviews/gemini/15-riparazione-2d-e-bande-vere.md`, con la struttura di `AGENTS.md`, più: tabella dei punti A1–A11 e B1–B7 (fatto / non fatto / in parte, file, come verificato) con questa numerazione; la tabella delle altezze rifatta alle quattro finestre; pesi della build; cosa non hai potuto verificare.
