# Incarico 13 — dividere «Pseudopotenziale» in due sezioni

**Ruolo: autore delle sezioni «Pseudopotenziale» (P4 §4) e «Bande dei materiali veri» (P4 §5).** Un solo autore, modalità normale, niente squadra. **Mai insieme all'incarico 12** (vetrina 2D): toccano gli stessi file comuni.

Leggi prima `AGENTS.md`, `progetto.md`, la sezione attuale `src/renderer/src/sections/pseudopotential/` e la dispensa `materiale/parte4/dispensa.tex`: §4 (r. 829–1298, in particolare r. 988–1064 e r. 1211–1284) e §5 (r. 1300–1494). Gli script Python di `materiale/` si leggono ma **non si eseguono**: `verifica_pseudo.py` r. 58–92 è il modello 1D di riferimento.

## Perché
Oggi una sola sezione fonde il §4 e il §5.4. Il riquadro «L'idea, nello spazio reale» è fermo: non reagisce ai comandi né allo stato scelto, non mostra gli stati di core né perché alla parte liscia bastano poche onde piane. Tutta l'interazione sta sulle bande 3D, che nella dispensa appartengono al §5 insieme all'alluminio. L'utente vuole due sezioni collegate.

## Correzioni della regia alla proposta iniziale (vincolanti)
1. **Niente cursore λ.** È falso che con `V′ = λ(E − E_c)|ψ_c⟩⟨ψ_c|` la funzione d'onda perda le oscillazioni al crescere di λ: ψ_k è ortogonale al core, quindi resta autofunzione di `H + f|ψ_ck⟩⟨ψ_ck|`, identica, per ogni f; si sposta solo il livello di core, a `E_c + f`. La funzione liscia esiste perché, quando `f = E − E_c`, core e valenza sono degeneri e ogni `ψ^f = ψ_k + α ψ_ck` risolve la pseudo-equazione. Le libertà sono due e distinte, come nella dispensa (r. 1259–1284):
   - **f**: non unicità dello pseudopotenziale — il livello di core si muove, le bande di valenza restano ferme;
   - **α**: non unicità della pseudo-funzione — quanta parte di core si aggiunge; lo stato vero è sempre `(1 − Π_c) ψ^f`.
2. **r_c non è un parametro del modello.** Le buche sono gaussiane di larghezza s: il cursore è s. r_c compare come raggio indicativo del core ricavato da |ψ_c|² (scrivi nel rapporto la definizione usata).
3. **Alluminio solo nel reticolo vuoto**: la dispensa non dà i suoi fattori di forma (fig. «al_libero», V = 0; i gap di circa 1,5 eV sono citati a parole).
4. **Fuori da questo incarico**: la densità degli stati g(E) in 3D.

## Permessi, solo per questo incarico (sotto `src/renderer/src/`)

| Percorso | Cosa puoi fare |
|---|---|
| `physics/pseudoCore1d.ts` e il suo test; una riga in `physics/index.ts` | Il modello 1D |
| `physics/pseudopotential.ts`, `physics/freeElectron.ts` e i loro test | Solo aggiunte per l'alluminio (sfera di Fermi del gas libero, bande che tagliano E_F); le funzioni e i test esistenti non cambiano |
| `sections/pseudopotential/` | Contenuto nuovo (sezione A) |
| `sections/real-bands/` (nuova) | Sezione B |
| `sections/registry.ts` | Una voce `real-bands` subito dopo `pseudopotential` |
| `strings.ts` di radice | Titolo «Bande dei materiali veri»; conteggio delle sezioni |
| `ui/navigation.ts` (nuovo) e `App.tsx` | Solo il meccanismo per passare da una sezione a un'altra (vedi sotto) |
| `home/` | Conteggio e anteprima |
| `viz/` | Solo componenti nuovi, se riusabili |

Non toccare le altre sezioni, il resto di `ui/`, `materiale/`. Nessuna dipendenza nuova. Niente commit.

## Sezione A — «Pseudopotenziale» (id `pseudopotential`)

### Fisica (`physics/pseudoCore1d.ts`)
- Cristallo 1D di buche gaussiane: `V(x) = −V₀ Σ_n exp(−(x − na)²/2s²)`, coefficienti `V_G = −V₀ √(2π) (s/a) exp(−G²s²/2)`; base di onde piane `G = 2πn/a`, n = −40…40 (81 onde); sulla diagonale `ħ²(k + G)²/2m₀` (la componente G = 0 del potenziale è uno spostamento costante: omessa come nello script, e detto a schermo).
- La banda più bassa è il **core** (E_c, ψ_ck), le successive la **valenza** (E_v(k), ψ_k).
- `H + f |ψ_ck⟩⟨ψ_ck|` per f qualunque; pseudo-funzione `ψ^f = ψ_k + α ψ_ck`; stato vero `(1 − Π_c) ψ^f`.
- **Scelta «più liscia»**: l'α che rende minima l'energia cinetica media di ψ^f normalizzata. Va dichiarata a schermo come scelta, non come proprietà unica.
- Cancellazione: `⟨k+G|V|k⟩ = V_G` contro `⟨k+G|V + V′|k⟩` con `V′ = (E − E_c)|ψ_ck⟩⟨ψ_ck|`.
- Fissa in modo deterministico il segno degli autovettori (per esempio ψ_ck positiva sullo ione), altrimenti α cambia significato da un k all'altro.
- Valori di partenza, quelli dello script: a = 4,0 Å, V₀ = 60 eV, s = 0,25 Å, k = 0,3 π/a.

**Test** (sono i controlli che lo script stampa):
- `|⟨ψ_ck|ψ_k⟩| < 10⁻¹⁰`;
- residuo `|(H + V′ − E) ψ^f| < 10⁻⁸` per α = 0; 0,7; −2, e `(1 − Π_c) ψ^f` parallelo a ψ_k;
- autovalore di valenza invariato entro 10⁻⁸ per f = 0; 5; 50; −3, e livello di core a `E_c + f`;
- banda di core molto più stretta della prima banda di valenza;
- limite V₀ → 0: reticolo vuoto 1D (`emptyLatticeBands`);
- convergenza: i primi tre livelli cambiano meno di 10⁻³ eV passando da 81 a 121 onde;
- con l'α «più liscia» il peso |c_G|² oltre |n| = 3 è molto minore che in ψ_k (riporta i due numeri).

**Intervalli dei cursori**: scegli a, V₀, s in modo che in tutto l'intervallo ci sia **una sola** banda di tipo core (larghezza < 0,2 eV) e che la seconda banda sia larga almeno 1 eV; riporta nel rapporto gli intervalli e le larghezze agli estremi.

### Scena
1. **Bande 1D**: banda di core in basso, bande di valenza sopra, in zona ridotta. Muovendo f il livello di core sale e le bande di valenza restano dove sono; una tacca sul cursore e sul grafico segna `f = E − E_c` per lo stato scelto. Clic, trascinamento o frecce scelgono lo stato (banda, k).
2. **Spazio reale**: in alto V(x) con gli ioni; sotto, per lo stato scelto, ψ_ck (localizzata sullo ione), ψ_k vera (oscilla nel core) e ψ^f (con α), con il raggio di core r_c segnato. Deve vedersi che cambiando α cambia ψ^f ma non lo stato vero.
3. **Spazio reciproco**: pesi |c_G|² di ψ_k contro ψ^f (coda lunga contro poche onde); elementi di matrice di V contro V + V′ (la cancellazione).

**Comandi** (due righe): a, V₀, s, f, α con il pulsante «più liscia».
**Strumenti**: «Riempimento» (banda di core piena, il suggerimento spiega perché gli elettroni di core non partecipano), «Massa efficace» e «Confronto» (reticolo vuoto 1D) come nelle altre sezioni, tutti spenti all'apertura.
**Formula viva**, collegata ai comandi nei due sensi: `ψ_k = ψ^f_k + Σ_c β_c ψ_ck`, `β_c = −⟨ψ_ck|ψ^f_k⟩`; `[p̂²/2m₀ + V_ps] ψ^f_k = E(k) ψ^f_k`, `V_ps = V + Σ_c (E − E_c)|ψ_ck⟩⟨ψ_ck|`; `Ṽ_ps = V + Σ_c f(E, E_c)|ψ_ck⟩⟨ψ_ck|`. Notazione della dispensa.
**Valori**: E_c, E_v dello stato scelto, `E − E_c`, ⟨ψ_c|ψ_k⟩, livello di core con f, α attuale e α «più liscia», peso nelle prime onde piane per ψ_k e ψ^f.
**Scheda teoria**: ortogonalità al core → oscillazioni → molte onde piane; V′ repulsivo e non locale compensa V; le due non unicità; il limite metallico `v(0) = −⅔E_F` a parole. In fondo resta il riquadro richiudibile «Confronto di scala sul silicio» (ione nudo 31, 12, 9 eV contro −2,87 eV), già esistente.
**Collegamento**: pulsante «Bande dei materiali veri →».

## Sezione B — «Bande dei materiali veri» (id `real-bands`)
Sposta qui, **senza riscriverli**, `EpmBandPlot.tsx`, `FormFactorCanvas.tsx`, `ShellWeightsBar.tsx`, `epmWorker.ts` e le parti di `model.ts`, `store.ts`, `manifest.ts`, `strings.ts`, `formulas.ts`, CSS che li servono. `RealSpacePseudoCanvas.tsx` e `realSpacePseudopotentialModel` non servono più alla scena (la funzione in `physics/` resta, con il suo test).

- **Viste**: fattore di forma v(q) con i tre punti trascinabili e i riferimenti V^a; bande lungo L–Γ–X–W–K–Γ; pesi per guscio |c_G|². Senza il riquadro dello spazio reale la riga in alto va ridisegnata: a 1100×800 bande almeno 300 px, le altre due viste almeno 150 px.
- **Materiali**: Al, Si, Ge, GaAs. Per Si, Ge, GaAs tutto resta com'è (gap 0,82 / 0,95 / 1,93 eV, note, stato provvisorio, formule vive).
- **Alluminio** (r. 1346–1400): fcc con un atomo per cella, a = 4,05 Å, fattori di forma a zero e cursori bloccati, con una riga che dice perché (reticolo vuoto; le bande vere hanno piccoli gap, circa 1,5 eV in X, dove qui le curve si incrociano). Zero dell'energia al fondo della banda. Niente gap, minimo di conduzione, μ: al loro posto «metallo: nessun gap assoluto».
- **«Riempimento» con l'Al**: selettore 3 oppure 1 elettrone per cella, dal gas libero con n = N·4/a³:
  - 3: k_F = 1,75 Å⁻¹ = 1,127·(2π/a), E_F = 11,65 eV; k_F > |ΓW| = 1,118: la sfera di Fermi contiene tutta la prima zona, più bande tagliano E_F;
  - 1: k_F′ = 0,78·(2π/a), E_F′ = 5,6 eV; k_F′ < |ΓL| = 0,866: la sfera resta dentro la prima zona.
  Mostra la linea di E_F e, nei valori, quante bande la tagliano lungo il cammino. Test su questi quattro numeri e sulle due distanze.
- **Rimando**: «← Da dove viene V_ps» verso la sezione A.
- I test esistenti di `physics/pseudopotential.test.ts` (confronto con `epm_bande.npz` compreso) devono passare senza modifiche.

## Passare da una sezione all'altra
Oggi le sezioni non ricevono proprietà (`App.tsx:27`). Aggiungi `ui/navigation.ts`, un piccolo stato condiviso con «vai alla sezione X», e fallo leggere ad `App.tsx`. Solo questo: nessun'altra modifica ad `App.tsx`.

## Schermata iniziale e barra laterale
- Il numero di sezioni non va scritto a mano: leggilo dal registro (oggi 6; sarà 7 o 8 a seconda che l'incarico 12 sia già stato eseguito).
- Anteprima: il passo «Pseudopotenziale» mostra le bande 1D con il core; un passo nuovo «Bande dei materiali veri» mostra il Si (quello di oggi). L'elenco deve restare dentro il riquadro di 356 px: se non ci sta, riduci l'interlinea dell'elenco, non l'altezza del riquadro.

## Regole
- Tutta la fisica in `physics/` con test; i componenti disegnano soltanto.
- Italiano, virgola decimale, simboli della dispensa; nessun riferimento a slide o a nomi di file nei testi visibili.
- Colori solo da `ui/theme.ts`; legende fuori dai grafici (`viz/ChartLegend.tsx`); etichette che non coprono curve.
- Da 1100×800 in su nessuno scorrimento; a 800×700 scorre solo la colonna centrale. Comandi su due righe.
- I cursori rispondono senza ritardo percepibile: riporta i tempi di calcolo del modello 1D.
- Nessun errore in console.

## Verifica prima di consegnare
`npm run typecheck`, `npm test`, `npm run build` dopo l'ultima modifica. Verifica visiva delle due sezioni a 1440×900, 1100×800 e 800×700, con tutti gli strumenti accesi e ogni materiale; guarda le schermate una per una. Controlla i due collegamenti, la schermata iniziale e che le altre sezioni funzionino come prima.

## Consegna
`reviews/gemini/13-pseudopotenziale-e-bande-vere.md`, con la struttura di `AGENTS.md`, più: elenco dei file spostati; intervalli dei cursori con le larghezze di banda agli estremi; definizione di r_c usata; tabella dei numeri dell'alluminio calcolati contro quelli della dispensa; tempi di calcolo; altezze misurate delle viste alle tre finestre; cosa non hai potuto verificare.
