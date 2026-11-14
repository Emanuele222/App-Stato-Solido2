# Stato Solido (nome provvisorio) — regole di progetto

App desktop con simulazioni interattive di fisica dello stato solido per studenti universitari. Stack: Electron + TypeScript + React + Vite. Prima di lavorare leggi `progetto.md`: è il documento di progetto e prevale su queste note in caso di conflitto.

## Ruoli
- **Regia**: la sessione principale (Fable). Scrive le istruzioni, controlla il risultato, coordina i revisori. Non scrive codice.
- **Autori**: Opus (avviato dalla regia) e, dalla sezione successiva alla pilota, un modello Google in Antigravity (avviato dall'utente, deciso il 2026-11-14). Un solo autore per sezione; mai due autori sugli stessi file nello stesso momento.
- **Livello di ragionamento di Opus** (deciso dall'utente il 2026-11-14; la regia lo imposta a ogni lancio):
  - `high` per il modulo di fisica e per il codice delle sezioni;
  - `medium` per scheletro, configurazione, installazioni e altri lavori meccanici;
  - `xhigh` e `max` solo per un problema specifico che Opus non riesce a risolvere, dopo averlo chiesto all'utente.
- **Revisori**: leggono e giudicano. Non modificano codice; scrivono solo il proprio rapporto.
- Chi scrive codice non modifica `progetto.md`, `materiale/`, `.claude/agents/`, `mockup-quasi-libero.html`.

## Fonti
- **Fisica, notazione, numeri**: le dispense `materiale/parte3/dispensa.tex` e `materiale/parte4/dispensa.tex`. In caso di dubbio vale la dispensa, non la memoria. Cita la sezione da cui prendi una formula.
- `materiale/` è in sola lettura. Gli script Python lì dentro sono riferimento: non eseguirli e non modificarli.
- **Stile visivo**: `mockup-quasi-libero.html`. Vale per aspetto e interazione; la sua notazione è superata (vedi «Notazione» in `progetto.md`).

## Struttura del codice
```
src/main/        processo principale Electron
src/preload/     ponte minimo, nessuna logica
src/renderer/src/
  physics/       TypeScript puro: niente React, niente DOM
  viz/           componenti grafici riusabili (BandPlot, RealSpaceView, LiveFormula)
  ui/            design system: token, colori delle grandezze, slider, pannelli
  sections/      una cartella per sezione: manifest, scena, formule, scheda teoria, stringhe
```
- `physics/` non importa nulla da `viz/`, `ui/`, `sections/`. Ogni funzione pubblica ha un test con un numero di riferimento preso dalle dispense o da un limite analitico.
- Unità: Å ed eV. Costanti fisiche in un solo file (`ħ²/2m₀ = 3,80998 eV·Å²`, `Ry = 13,6057 eV`).
- Il renderer deve funzionare anche aperto in un browser dal server di sviluppo: nessuna dipendenza obbligatoria dalle API di Electron.

## Convenzioni
- Interfaccia in italiano; le stringhe stanno in un file per sezione, pronte per la traduzione. Identificatori in inglese.
- Simboli nelle formule: tabella «Notazione» di `progetto.md` (m₀, E_k, E₀, E_g, V_G, ψ_c, ψ_s…).
- Un colore = una grandezza fisica: una sola tabella in `ui/`, usata da formule, scene, slider e grafici.
- Ogni cambio di parametro è una transizione interpolata; rispetta `prefers-reduced-motion`.
- Nessuna dipendenza nuova senza motivarla nel rapporto finale.
- Non fare commit né push.

## Comandi
Se esiste `.tools/node/bin`, mettilo nel PATH prima di ogni comando: `export PATH="$PWD/.tools/node/bin:$PATH"`.
- `npm run dev` — avvia l'app in sviluppo
- `npm test` — test di fisica (Vitest)
- `npm run typecheck` — controllo dei tipi
- `npm run build` — build di produzione
