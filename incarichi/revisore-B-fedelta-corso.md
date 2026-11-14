# Incarico revisore B — fedeltà al corso

**Ruolo: revisore.** Sola lettura sul progetto. Scrivi solo il rapporto `reviews/gemini/revisione-B-fedelta-corso.md`.

La tua descrizione di ruolo è `.claude/agents/fedelta-corso.md`: leggila e seguila per intero (criteri, gravità, forma del rapporto). La riga `tools:` in cima a quel file non ti riguarda: usa i tuoi strumenti equivalenti.

## Cosa rivedere
Le sei sezioni del capitolo «Teoria delle bande», ciascuna contro il suo capitolo delle dispense.

| Sezione (`src/renderer/src/sections/…`) | Dispense |
|---|---|
| `empty-lattice/` | Parte 3 §9; Parte 4 §5.1 |
| `kronig-penney/` | Parte 3 §10 |
| `nearly-free/` | Parte 3 §11 |
| `tight-binding/` | Parte 3 §12; Parte 4 §1.4 e §2 |
| `k-dot-p/` | Parte 4 §3 |
| `pseudopotential/` | Parte 4 §4 e §5.4 |

Per ogni sezione leggi `strings.ts`, `formulas.ts`, `manifest.ts` e le etichette scritte nei componenti; poi i formulari in fondo alle due dispense e la tabella «Notazione» di `progetto.md`.

## Punti su cui voglio un giudizio esplicito
1. **Simboli che cambiano significato tra sezioni**: P (Kronig–Penney e Kane), ψ_c (onda stazionaria a coseno e stato di core), E₀, E_g, t, W. In ogni sezione il significato è dichiarato? Lo studente che passa da una sezione all'altra può confondersi?
2. **Ordine e nomi**: titoli delle sezioni, dei pannelli e degli strumenti coincidono con i nomi italiani delle dispense?
3. **Osservazioni sulle slide**: le dispense correggono in più punti le slide (segni, quadrati, vicini della catena biatomica, formula delle lacune leggere). L'app segue la dispensa e non la slide?
4. **Ciò che non viene dalle dispense**: ogni affermazione, numero o modello presente nell'app ma assente dalle dispense. Alcuni sono voluti e dichiarati «indicativi» a schermo (legge t(a) esponenziale, forma degli orbitali, curve di modello dello pseudopotenziale, soglia P·k < E_g/2): controlla che l'avviso ci sia davvero e che non ce ne siano altri non dichiarati.
5. **Preset e numeri d'esempio**: ogni valore risale a una riga delle dispense o a uno script in `materiale/`? Cita la riga.
6. **Copertura**: per ogni sezione, i riquadri «chiave» del capitolo e le righe del formulario che non compaiono nell'app. Indica quali mancanze sono gravi per uno studente che prepara l'esame.
7. **Collegamenti tra sezioni** che le dispense rendono espliciti (Kronig–Penney → legami forti; quasi liberi → pseudopotenziale; k·p → massa al bordo dei quasi liberi; legami forti ↔ ψ_c e ψ_s): ci sono, e sono detti come nella dispensa?

## Come lavorare
- Non serve eseguire nulla. Non eseguire `npm run build` né `npm run dev`.
- Cita sempre la riga della dispensa.

## Consegna
`reviews/gemini/revisione-B-fedelta-corso.md`: una parte per sezione con i problemi in ordine di gravità (dove nell'app, cosa differisce, riga della dispensa, correzione proposta); le risposte ai sette punti; verdetto per sezione e verdetto complessivo.
