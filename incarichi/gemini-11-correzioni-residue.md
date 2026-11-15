# Incarico Gemini 11 — correzioni residue dopo gli incarichi 09 e 10

**Ruolo: autore delle correzioni grafiche residue.** Gli incarichi 09 e 10 sono stati verificati dalla regia: la fisica e i contenuti del 09 sono accettati; del 10 restano i punti sotto, tutti misurati sulla build attuale. Un solo autore, modalità normale, niente squadra.

Per questo incarico puoi scrivere in (sotto `src/renderer/src/`):

| Percorso | Cosa puoi fare |
|---|---|
| `sections/pseudopotential/`, `sections/k-dot-p/`, `sections/tight-binding/`, `sections/kronig-penney/`, `sections/empty-lattice/` | Componenti e fogli di stile; in `strings.ts` solo i testi nominati sotto |
| `ui/ui.css`, `ui/theme.ts` | Solo i punti 9 e 10 |
| `viz/` | Solo se serve ai punti sulle etichette |
| `home/` | Solo il punto 11 |
| `physics/pseudopotential.test.ts`, `sections/pseudopotential/manifest.ts` e `strings.ts` | Solo il punto 12 (preset Ge) |

Non toccare il resto di `physics/`, `App.tsx`, `registry.ts`, `ui/shell.tsx`, le formule. Nessuna dipendenza nuova. Niente commit.

## Misure di partenza (build attuale, tutti gli strumenti accesi)

| Sezione | Finestra | Altezza dei grafici (px) | Barra dei comandi (px) |
|---|---|---|---|
| Pseudopotenziale (GaAs) | 1200×900 | 144 · 125 · 229 · 89 | circa 300 |
| Pseudopotenziale (GaAs) | 1100×800 | 74 · 73 · 165 · 64 | 303 |
| Pseudopotenziale (GaAs) | 800×700 | 108 · 89 · 193 · 75 (scorre) | 336 |
| Metodo k·p | 1100×800 | 84 · 56 · 272 | 156 |
| Metodo k·p | 800×700 | 61 · 44 · 220 | 148 |
| Legami forti | 1200×900 | 222 · 397 | 130 (quattro righe con «Riempimento») |

## A. Pseudopotenziale — la sezione oggi non è leggibile sotto 1440 px

1. **Barra dei comandi.** Occupa più di un terzo della finestra perché contiene tre note di testo («Solo Si e GaAs…», «Base fcc a 2 atomi…», «Gusci in unità…») e la riga con i valori di V^a. Sposta le note nella «Scheda teoria» o nei suggerimenti dei comandi a cui si riferiscono, e i valori di V^a nel pannello dei valori (dove già compaiono). La barra resta su due righe: al massimo 130 px a 1100×800, anche con il GaAs e l'interruttore di V^a visibile.
2. **Altezze minime dei grafici** a 1100×800 senza scorrimento: bande almeno 250 px, le due viste in alto almeno 150 px ciascuna, pesi per guscio almeno 64 px. A 1200×900 le bande almeno 300 px. A 800×700 la colonna centrale scorre e valgono gli stessi minimi di 1100×800.
3. **Legende fuori dai grafici.** In «Fattore di forma v(q)» con il GaAs la legenda copre punti, rombi e le etichette V₃ˢ, V₈ˢ, V₁₁ˢ; in «L'idea, nello spazio reale» copre le curve; in «Bande lungo L–Γ–X–W–K–Γ» la riga «4 bande di valenza — conduzione — reticolo vuoto fcc» sta sopra le bande alte. Porta le legende fuori dall'area del grafico (riga sotto il titolo della vista, in HTML o in una fascia riservata del canvas).
4. **Etichette sopra le curve** nel grafico delle bande: «gap diretto 1,93 eV» (GaAs) e «gap indiretto 0,82 eV» (Si) attraversate dalle bande di conduzione; «m*/m₀ = …» sopra una banda; percentuale che tocca la barra più alta nei pesi per guscio. Usa `placeGapLabelBox` e `placeProbeLabel` di `viz/canvas.ts` con fondo opaco e cerca una posizione libera.
5. **Formule vive, verso formula → comandi.** Oggi il cursore si accende solo se è quello attivo (`PseudopotentialSection.tsx:203`, `active` dipende da `activeFactor` e non da `highlight`). Passando su V_ps, V_G o V^s nella formula si devono accendere i tre cursori V₃ˢ, V₈ˢ, V₁₁ˢ; passando su V^a l'interruttore del termine antisimmetrico; passando su a il cursore del passo. Come nella sezione pilota, dove `.param` riceve `is-active`.

## B. Metodo k·p

6. **Altezze minime** a 1100×800 senza scorrimento: «Livelli in Γ» almeno 120 px, «Contributi a m₀/m*» almeno 70 px, diagramma E(k) almeno 240 px. Se non ci stanno, compatta la barra dei comandi (oggi 156 px: il selettore del materiale e la sua nota possono stare sulla riga del modello).
7. **InSb** (E_g = 0,18 eV): in «Livelli in Γ» le etichette di c e di hh si sovrappongono. Tieni le linee in scala e sposta solo i testi, con un trattino di richiamo.
8. **Variante a due bande**: la legenda copre le curve in alto a destra e l'etichetta «|P·k| < E_g/2»; l'etichetta «lh» esce dal bordo destro. Inoltre l'intestazione di «Contributi a m₀/m*» mostra la somma nello stato scelto (11,15 a k = 0,040 Å⁻¹) senza dirlo, mentre in Γ vale 1 + E_P/E_g = 14,99: aggiungi «nello stato scelto» al testo dell'intestazione (`k-dot-p/strings.ts`) e sostituisci l'etichetta «massa formula» con «dalla formula».

## C. Legami forti, Kronig–Penney, Reticolo vuoto

- **Legami forti** (punto 11 dell'incarico 10, non fatto): comandi su due righe anche con «Riempimento» acceso, in entrambe le catene.
- **Kronig–Penney**: con tutti gli strumenti accesi la legenda in alto a destra finisce sotto la barra e l'etichetta del terzo gap («banda a coseno» non si legge). Legenda fuori dal grafico, come al punto 3.
- **Reticolo vuoto**: togli la stringa inutilizzata `valuesTitle` (`empty-lattice/strings.ts:67`).

## D. Componenti comuni

9. **Colori solo dal tema.** Restano codici scritti nei componenti: `pseudopotential/EpmBandPlot.tsx:32` (`#b4de9e`), `pseudopotential/RealSpacePseudoCanvas.tsx:195` (`#f0b3e7`), `tight-binding/TightBindingRealSpace.tsx:62-316`, `tight-binding/BandExtremumOverlay.tsx:201`. Portali in `ui/theme.ts` con un nome che dica a cosa servono (toni derivati da una grandezza esistente vanno dichiarati come tali) e usali da lì. Controllo finale: `grep -rnE "#[0-9a-fA-F]{6}" src/renderer/src/sections src/renderer/src/viz src/renderer/src/home` non deve dare righe fuori dai fogli di stile.
10. **`.view-body canvas`** (`ui/ui.css:366`): la regola in posizione assoluta colpisce ancora ogni canvas annidato; restringila al figlio diretto (punto 6 dell'incarico 10, non fatto).

## E. Schermata iniziale

11. **Riquadri bloccati.** Togliendo l'attenuazione dall'intero riquadro, i capitoli «in arrivo» ora sembrano attivi quanto il primo. L'utente li vuole ombreggiati: attenua immagine, titolo e testo (non il bordo né la scritta «in arrivo», che resta a piena opacità). Nel riquadro attivo usa lo spazio vuoto sotto la miniatura per ingrandirla, senza cambiare l'altezza del riquadro né far uscire l'elenco dell'anteprima.

## F. Preset del germanio (decisione dell'utente)

12. **Aggiungi il Ge ai materiali dello pseudopotenziale**, con fattori diversi da quelli della tabella della dispensa (che, come hai mostrato nel 09, danno gap diretto in Γ).
    - Parametri: a = 5,658 Å; V₃ˢ = −0,23 Ry, V₈ˢ = 0,01 Ry, V₁₁ˢ = 0,06 Ry; V^a = 0 (diamante). Sono i fattori locali attribuiti a Cohen e Bergstresser (Phys. Rev. 141, 789, 1966); la regia li ha indicati a memoria e **non li ha potuti controllare sulla tabella originale**: scrivilo nel rapporto tra le cose non verificate.
    - Risultato atteso, ricalcolato dalla regia con `pseudopotentialBands` a 113 onde piane e 40 punti per tratto: gap **indiretto con minimo in L**, 0,95 eV; conduzione in Γ a 1,22 eV e in X a 1,17 eV. Coincide con la dispensa (P4 r. 807–809: minimo in L, 0,9 eV nel calcolo, Γ a circa 1,1 eV; misurato 0,66 eV).
    - Test in `physics/pseudopotential.test.ts`: con questi parametri `isDirect` è falso, il minimo è in L, gap entro 0,01 eV da 0,953. Il test diagnostico del 09 sui fattori della tabella resta com'è.
    - A schermo deve essere dichiarato che questi fattori **non sono quelli della tabella della dispensa**: nota accanto al materiale, sul modello di quella già presente per Si e GaAs, per esempio «Ge: fattori locali di Cohen–Bergstresser (1966); con quelli della tabella P4 il modello locale dà il minimo in Γ». Valore misurato da mostrare: 0,66 eV (indiretto).
    - Aggiorna la nota «Solo Si e GaAs…» (che il punto 1 sposta) perché ora i materiali sono tre.
    - Se il risultato non è quello atteso, fermati e segnalalo senza aggiungere il preset.

## Regole
- Stile lavagna: fondo scuro piatto, linee nette, nessuna ombra, nessun bagliore.
- Da 1100×800 in su nessuna sezione scorre; a 800×700 può scorrere solo la colonna centrale. Nessuno scorrimento orizzontale.
- Con «riduci movimento» attivo, nessuna transizione. Nessun errore in console.
- Non riaprire i punti già accettati di 08, 09 e 10.

## Verifica prima di consegnare
`npm run typecheck`, `npm test`, `npm run build` dopo l'ultima modifica. Verifica visiva di **tutte e sei le sezioni** a 1440×900, 1100×800 e 800×700 con tutti gli strumenti accesi, in tutte le varianti e con ogni materiale (Si, Ge, GaAs nello pseudopotenziale; GaAs, InSb e gli altri nel k·p). Guarda le schermate una per una: le misure del DOM non bastano a dire che un'etichetta non copre una curva.

## Consegna
`reviews/gemini/11-correzioni-residue.md`, con la struttura di `AGENTS.md`, più: tabella dei 12 punti e dei tre della parte C (fatto / non fatto / in parte, file, come verificato) con la **stessa numerazione di questo incarico**; la tabella delle misure rifatta alle tre finestre; i nomi e i codici aggiunti al tema.
