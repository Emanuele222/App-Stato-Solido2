# Incarico revisore A — fisica

**Ruolo: revisore.** Sola lettura sul progetto. Scrivi solo il rapporto `reviews/gemini/revisione-A-fisica.md` e, se ti servono calcoli indipendenti, file in `crosscheck/`.

La tua descrizione di ruolo è `.claude/agents/revisore-fisica.md`: leggila e seguila per intero (criteri, gravità, forma del rapporto). La riga `tools:` in cima a quel file non ti riguarda: usa i tuoi strumenti equivalenti. Giudica come se non avessi mai visto questo codice.

## Cosa rivedere
Il capitolo «Teoria delle bande» è completo: sei sezioni. Gli elettroni quasi liberi hanno già un controllo indipendente (`reviews/gemini/01-controllo-fisica.md`): non rifarlo. Concentrati su:

| Modulo | Sezione | Riferimento nelle dispense |
|---|---|---|
| `physics/emptyLattice.ts` | `sections/empty-lattice/` | Parte 3 §9; Parte 4 §5.1 |
| `physics/kronigPenney.ts` | `sections/kronig-penney/` | Parte 3 §10 |
| `physics/tightBinding.ts` | `sections/tight-binding/` | Parte 3 §12; Parte 4 §1.4 e §2 |
| `physics/kDotP.ts` | `sections/k-dot-p/` | Parte 4 §3 |
| `physics/pseudopotential.ts` | `sections/pseudopotential/` | Parte 4 §4 e §5.4 |
| `physics/linalg.ts`, ramo hermitiano complesso | — | — |

Più gli strumenti comuni usati da tutte: `filling.ts`, `semiclassical.ts`, `gaps1d.ts`.

## Punti su cui voglio un giudizio esplicito
1. **Kronig–Penney**: continuità di L(E) attraverso E = V₀; ricerca dei bordi di banda quando le bande sono strettissime; funzione d'onda esatta e sua normalizzazione; limite a delta delle barriere rettangolari.
2. **Legami forti**: segno di t_p e curvatura della banda p; fattore cos(ka/2) nella catena biatomica; coefficienti b_A, b_B e loro fase; le curve dello spazio reale sono dichiarate «indicative»: sono almeno coerenti con i coefficienti calcolati?
3. **k·p**: le due convenzioni di segno del termine libero delle valenze (−ħ²k²/2m₀ nella variante di Kane, + nel modello a due bande) sono quelle della dispensa e sono spiegate senza ambiguità? Scomposizione dei contributi a 1/m*.
4. **Pseudopotenziale**: fattore di struttura (cos e sin di G·τ, quali |G|² sopravvivono), unità Ry → eV, scelta dello zero dell'energia, ricerca di cima della valenza e minimo della conduzione, massa «lungo il tratto». Il calcolo ridotto mostrato durante il trascinamento (51 onde piane) può far vedere allo studente una fisica diversa da quella finale (per esempio un gap che cambia tipo)?
5. **Massa efficace e velocità** calcolate per differenze finite: passo, rumore numerico, comportamento agli estremi di banda e nei punti di flesso (dove 1/m* = 0 e m* diverge: cosa vede lo studente?).
6. **Riempimento**: conteggio degli elettroni, livello di Fermi e classificazione metallo/isolante in ogni sezione, compresi i casi di bande che si toccano o si sovrappongono.
7. **Test**: tolleranze oneste? Ci sono funzioni di `physics/` senza un test che le fissi a un numero della dispensa o a un limite analitico?
8. **Fisica rimasta nell'interfaccia**: cerca nelle sei cartelle di `sections/` formule fisiche calcolate fuori da `physics/`.

## Come lavorare
- `export PATH="$PWD/.tools/node/bin:$PATH"`, poi `npm test`. Puoi fare piccoli calcoli indipendenti in `crosscheck/` (Node puro, nessuna dipendenza).
- Non eseguire `npm run build` né `npm run dev`: altri revisori stanno usando la build in questo momento.
- Non eseguire gli script Python in `materiale/`.

## Consegna
`reviews/gemini/revisione-A-fisica.md`: problemi in ordine di gravità con file e riga, formula o numero corretto, riferimento alla dispensa e modo di riprodurli; una risposta per ciascuno degli otto punti sopra; cosa hai verificato davvero e cosa no; verdetto per ciascun modulo e verdetto complessivo.
