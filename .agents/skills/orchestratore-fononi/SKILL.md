---
name: orchestratore-fononi
description: >-
  Guida operativa per l'agente coordinatore (regia) nello sviluppo di una sezione del
  capitolo Fononi su Antigravity: pianificazione, implementazione, lancio in parallelo
  dei revisori e chiusura della sezione. Usa questa skill quando l'utente avvia o coordina
  una nuova sezione sui fononi.
---

# Orchestratore — Sviluppo Capitolo Fononi

Quando coordini lo sviluppo di una sezione (o di una modifica architetturale) del capitolo Fononi, segui questa sequenza ordinata e mantieni la regola chiave del progetto: **un solo autore per sezione; revisori separati in sola lettura**.

## Fase 1 — Inquadramento e piano
1. Leggi `materiale/parte6/riferimento-formule.md` e le pagine pertinenti di `materiale/parte6/dispensa.pdf`.
2. Consulta una sezione di riferimento esistente (es. `src/renderer/src/sections/nearly-free/` o `tight-binding/`) per replicare convenzioni, stile e pattern (`manifest.ts`, `store.ts`, `model.ts`, `formulas.ts`, `strings.ts`, viste).
3. Condividi con l'utente un breve piano (fisica, viste, controlli, formule vive, test previsti, eventuali file condivisi da toccare) prima di scrivere molto codice.

## Fase 2 — Sviluppo (un solo autore)
1. **Prima la fisica**: scrivi le funzioni pure in `src/renderer/src/physics/` + i relativi test Vitest usando i numeri di riferimento della Parte 6. Verifica subito con `npm.cmd run typecheck` e `npm.cmd test`.
2. **Poi la sezione**: implementa `sections/<sezione>/` (e gli eventuali estensioni a `ui/theme.ts`, `viz/`, `registry.ts`, `home/`).
3. **Auto-controllo base**: verifica `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build` e che non ci siano colori hex hardcoded fuori da `ui/theme.ts`.

## Fase 3 — Revisione in parallelo (subagent)
Lancia in parallelo i revisori pertinenti usando `invoke_subagent` (o `define_subagent` + `invoke_subagent`), assegnando a ciascuno la propria skill in `.agents/skills/<ruolo>/SKILL.md`:
- Sempre obbligatori per ogni sezione:
  1. `revisore-fisica`
  2. `fedelta-corso`
  3. `crosscheck-numerico`
  4. `revisore-integrazione`
- Visivi/didattici (dopo aver avviato `npm run dev:web` o una build locale):
  5. `critico-grafico` (con subagent `browser` a 1440 / 1100 / 800 px)
  6. `studente` (con subagent `browser`)

Salva i rapporti in `reviews/fononi/<sezione>-<ruolo>.md`.

## Fase 4 — Chiusura
1. Raccogli tutti i problemi **Bloccanti** e **Importanti** dai rapporti.
2. Applica le correzioni in un unico passaggio pulito (un solo autore).
3. Riesegui `npm run typecheck`, `npm test`, `npm run build` e ricontrolla le viste corrette.
4. Una sezione è **chiusa** quando tutti i test passano, il crosscheck torna e nessun rapporto contiene problemi bloccanti o importanti aperti.
