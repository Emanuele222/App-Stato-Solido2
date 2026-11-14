# Incarico Gemini 10 — correzioni di grafica e componenti comuni

**Ruolo: autore delle correzioni grafiche.** Nasce dalla revisione D (grafica) e, per l'usabilità, dalla C (studente): leggi `reviews/gemini/revisione-D-grafica.md` e `revisione-C-studente.md` per i dettagli (file, righe, come riprodurre). **Da lanciare dopo gli incarichi 08 e 09, mai insieme a un altro autore.**

Per questo incarico, e solo per questo, puoi scrivere in:

| Percorso (sotto `src/renderer/src/`) | Cosa puoi fare |
|---|---|
| `ui/` (tutto, tranne ciò che l'incarico 08 ha fatto per la schermata iniziale e la barra laterale: non rifarlo) | Correzioni ai punti sotto |
| `viz/` | Correzioni ai punti sotto |
| `sections/*/` (tutte e sei) | Componenti, fogli di stile, e in `formulas.ts`/`manifest.ts` solo gli identificatori di colore e di evidenziazione |

Non toccare `physics/`, i testi e le formule (sono dell'incarico 09), `home/`, `App.tsx`, `registry.ts`. Se una correzione chiede una modifica alla fisica, descrivila nel rapporto.

## Decisioni della regia (rispondono alle domande della revisione D)
- **Colori**: si aggiungono grandezze nuove a `ui/theme.ts`; niente più colori presi in prestito.
- **Finestre piccole**: da 1100×800 in su nessuna sezione deve scorrere. A 800×700 la colonna centrale può scorrere in verticale, e in cambio ogni grafico tiene un'altezza minima leggibile.
- **Pannelli laterali**: «Formula viva» e «Scheda teoria» devono essere entrambe raggiungibili senza scorrere a 1440×900 in tutte le sezioni.

## A. Componenti comuni

1. **Grandezze nuove nel tema** (`ui/theme.ts`, con le variabili CSS corrispondenti). Aggiungi: integrale di salto t (con W), funzione di Kronig–Penney f/L, spin–orbita Δ, energia di Kane E_P (con P). Colori piatti, leggibili sul fondo scuro, ben distinti dai dieci esistenti e tra loro; riportali nel rapporto. Poi applica:
   - Kronig–Penney: t e W non più nel colore della velocità; f(αa)/L(E), α, β non più nel colore dell'energia; a, b, c restano nel colore del passo ma con bersagli distinti, e passando su a si accendono anche b e c;
   - Legami forti: t_s e |t_p| con bersagli distinti (oggi passando su uno si accendono entrambi i cursori), lo stesso per Ē_s/Ē_p ed E_A/E_B; «banda p» non nel colore della velocità;
   - k·p: Δ e la banda so non nel colore di ψ; E_P e P non nel colore della velocità;
   - Pseudopotenziale: V^a nel colore `V2G` ovunque (formula, interruttore, rombi, vista reale), V^s in `VG`; le bande di conduzione e la fascia del gap non nel colore del passo reticolare.
   Regola: uno stesso colore non indica due grandezze diverse in nessuna schermata, e una grandezza ha lo stesso colore in tutte le sezioni.
2. **Livello di Fermi che taglia le etichette dei gap** (`viz/BandPlot.tsx:291-344`, `empty-lattice/ZoneSchemesPlot.tsx:528-551`, `kronig-penney/KronigBandsAndConditionPlot.tsx:507-596`, `k-dot-p/KpBandPlot.tsx:357,392-418`). La linea tratteggiata non deve attraversare né le etichette né le barre dei gap: etichetta su fondo opaco spostata dalla linea, linea interrotta attorno al riquadro. Lo stesso per l'etichetta m* della sonda, che non deve stare sopra una curva. Una sola soluzione, riusata nei quattro grafici.
3. **Testo matematico sui canvas** (`viz/canvas.ts`, `drawMathText`): aggiungi gli apici `^{…}` e le forme brevi `_x`, `^x`. Passa da lì la legenda del confronto di `BandPlot` (righe 248-260, 432), il titolo di `ShellWeightsBar` (oggi stampa `|c_G|²` grezzo) e ogni altra stringa con pedici o apici disegnata con `fillText`. I valori testuali con simboli (`V^s`, `E_g/E_P` in `pseudopotential`) passano da `RichText`/`Tex`.
4. **Maiuscole forzate** (`ui/ui.css:299-305`, `.view-tag`): oggi «E(k)» diventa «E(K)», «v(q)» diventa «V(Q)», «m₀/m*» diventa «M₀/M*». Togli la trasformazione dove il testo contiene simboli; controlla anche le altre due regole `text-transform` del file.
5. **Altezze sotto i 900 px**: una regola sola in `ui/ui.css` al posto degli `min-height` locali (`tightBinding.css:139-147`, `kDotP.css:45-53`, `pseudopotential.css:3-11`). Ogni grafico almeno 240 px circa; a 1100×800 nessuno scorrimento in nessuna sezione (oggi lo pseudopotenziale sfora di 7 px e ha grafici alti 89–138 px: ridistribuisci le righe).
6. **Difetti noti dei componenti comuni**:
   - `useTweened` (`ui/motion.ts`) può dare un avanzamento leggermente negativo al primo fotogramma: correggilo alla fonte e togli il rimedio locale in `k-dot-p/model.ts`;
   - `.view-body canvas` in posizione assoluta colpisce anche i canvas annidati: restringi la regola;
   - larghezza fissa delle cifre (`Num`) anche nei valori di Reticolo vuoto e Kronig–Penney, come nella pilota;
   - stringa inutilizzata `valuesTitle` nella pilota: toglila;
   - etichette affollate vicino a ±π/a nella pilota.

## B. Formule vive
7. **Pseudopotenziale** (`PseudopotentialSection.tsx:187,253-285`): passando su V_ps, V_G, V^s in formula devono accendersi i cursori dei fattori di forma; il pannello dei valori e la scheda teoria oggi non sono collegati affatto. Porta la sezione al comportamento della pilota, nei due sensi.
8. **k·p** (`KDotPSection.tsx:167-236,437-469`): la scheda teoria e il riquadro di verifica hanno i simboli colorati ma inerti. Collegali.
9. Al termine, in ogni sezione, ogni termine colorato accende qualcosa e solo la cosa giusta. Riporta nel rapporto la tabella termine → cosa si accende.

## C. Impaginazione dei pannelli laterali
10. **Scheda teoria sotto la piega** in Pseudopotenziale e k·p a 1440×900: i riquadri «Ione nudo vs pseudopotenziale» e «Verifica sui quasi liberi» diventano riquadri richiudibili, chiusi all'apertura, in fondo alla scheda teoria. Il primo resta intestato all'esempio del Si anche con un altro materiale scelto: deve essere evidente che è un esempio fisso.
11. **Barre dei comandi su tre righe** in Legami forti: compatta su due.

## D. Etichette e grafici, sezione per sezione
12. Pseudopotenziale: titolo d'asse «E (eV)» sopra la tacca 15 (`EpmBandPlot.tsx:92-97`); percentuale sopra la barra più alta (`ShellWeightsBar.tsx:73`); rombi di V^a senza legenda; etichetta «v(0) = −⅔E_F» che tocca la curva; etichetta del gap sopra la banda di conduzione in Γ.
13. Kronig–Penney: barra del gap E_g3 oltre il tetto dell'asse; la banda a coseno tratteggiata si confonde con la banda esatta.
14. k·p: scritta «vicino a Γ» coperta dalla parabola; etichette lh e so che si toccano; etichetta m* sopra le curve di valenza nella variante a due bande.
15. Legami forti: etichette «legante»/«antilegante» sopra la linea −π/a; riquadro «bordi vs a» con tacche troppo fitte.
16. Reticolo vuoto: etichette n = +1 e n = −1 che si toccano vicino all'incrocio centrale in zona ridotta.

## E. Coerenza dei comandi tra sezioni
17. Pallino del pulsante «Confronto»: stesso colore in tutte le sezioni.
18. «Massa efficace» spenta all'apertura in tutte e sei le sezioni.
19. «Riempimento» in k·p e Pseudopotenziale non ha il selettore degli elettroni per cella: il suggerimento del pulsante spiega perché (numero di elettroni fissato dal materiale).
20. **Passaggio dal calcolo ridotto a quello completo nello pseudopotenziale**: oggi è uno scatto dopo circa un secondo. Finché il risultato è provvisorio (indicatore fornito dall'incarico 09) curve e valore del gap sono attenuati; all'arrivo del calcolo completo una transizione breve con gli strumenti di `ui/motion.ts`, non un salto.

## Regole
- Stile lavagna: fondo scuro piatto, linee nette, nessuna ombra, nessun bagliore. Colori solo dal tema.
- Con «riduci movimento» attivo, nessuna transizione.
- Regge da 800 px in su. Nessun errore in console. Nessuna dipendenza nuova. Niente commit.

## Verifica prima di consegnare
`npm run typecheck`, `npm test`, `npm run build` dopo l'ultima modifica. Verifica visiva obbligatoria di tutte e sei le sezioni a 1440×900, 1100×800 e 800×700, con tutti gli strumenti accesi e in tutte le varianti; se il browser chiede un permesso, chiedilo all'utente in chat. Controlla che la schermata iniziale e la barra laterale dell'incarico 08 funzionino come prima.

## Consegna
`reviews/gemini/10-correzioni-grafica.md`, con la struttura di `AGENTS.md`, più: tabella dei 20 punti (fatto / non fatto / fatto in parte, file toccato, come verificato); i colori nuovi con il loro codice; la tabella delle formule vive del punto 9; le altezze misurate dei grafici alle tre larghezze.
