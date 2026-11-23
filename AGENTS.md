# Regole per gli agenti in Antigravity

App desktop didattica di fisica dello stato solido (Electron + TypeScript + React + Vite). Prima di lavorare leggi `progetto.md` (documento di progetto) e `CLAUDE.md` (struttura del codice, fonti, convenzioni): valgono anche per te.

## Come ricevi il lavoro
- La regia è Claude Fable, nella sessione dell'utente. Gli incarichi sono file in `incarichi/`. L'utente ti dice quale eseguire.
- Esegui solo quell'incarico. Se è ambiguo o in conflitto con queste regole, fermati e chiedi: non improvvisare.
- **Un solo incarico in esecuzione alla volta**, anche con autori diversi e su file diversi. Se mentre lavori la build non passa per file non tuoi, fermati e avvisa l'utente: un incarico non si consegna senza build verde e senza aver guardato le schermate.

## Cosa puoi scrivere
Dipende dal ruolo indicato nell'incarico.
- **Revisore**: solo `reviews/gemini/` e `crosscheck/`. Nient'altro.
- **Autore di una sezione**: solo `src/renderer/src/sections/<sezione>/`, più eventuali funzioni nuove in `src/renderer/src/physics/` con i loro test, più le righe di registrazione della sezione indicate nell'incarico. I componenti di `ui/` e `viz/` si riusano così come sono: se ti serve una modifica, descrivila nel rapporto invece di farla.

## Cosa non tocchi mai
`progetto.md`, `CLAUDE.md`, `AGENTS.md`, `incarichi/`, `materiale/`, `.claude/`, `.tools/`, `mockup-quasi-libero.html`, e i file di un altro autore. Nel progetto lavora anche Claude Opus: se vedi file che cambiano mentre lavori, sono suoi. Un solo autore per sezione, mai due autori sugli stessi file.

**Capitolo Fononi**: è di un altro studente, con i suoi agenti e le sue regole (`.agents/`, `piano-fononi.md`). Non toccare `sections/phonon-*/`, `physics/phononDispersion*`, `physics/constants*`, `viz/DispersionPlot.tsx`, `viz/PlaybackControls.tsx`, `viz/dispersionPlot.test.ts`, `reviews/fononi/`, `crosscheck/fononi/`, `materiale/parte6/`. I file comuni (`registry.ts`, `strings.ts`, `physics/index.ts`, `home/`, `ui/`) li modificano entrambi: tocca solo le righe che l'incarico ti indica e non riscrivere quelle sui Fononi.

## Ambiente
- Node non è nel sistema: `export PATH="$PWD/.tools/node/bin:$PATH"` prima di ogni comando.
- `npm test` (Vitest, solo `src/**/*.test.ts`), `npm run typecheck`, `npm run build`, `npm run dev:web` (interfaccia nel browser).
- Nessuna dipendenza nuova senza motivarla nel rapporto. Niente commit, niente push. Non lasciare processi in esecuzione.

## Fisica
- Fonte unica: le dispense `materiale/parte3/dispensa.tex` e `materiale/parte4/dispensa.tex`. Notazione: tabella «Notazione» di `progetto.md`. Unità: Å ed eV, ħ²/2m₀ = 3,80998 eV·Å².
- `materiale/` è in sola lettura. Se una formula o un numero della dispensa ti sembra sbagliato, segnalalo: non correggerlo in silenzio.

## Rapporto
Ogni incarico si chiude con un file in `reviews/gemini/` con il nome indicato nell'incarico, in italiano:
1. Cosa hai fatto.
2. Cosa hai verificato davvero, con i comandi eseguiti e i risultati.
3. Cosa non hai potuto verificare.
4. Problemi trovati in ordine di gravità (bloccante, importante, minore), ciascuno con file e riga, cosa è sbagliato, perché e come riprodurlo.
5. Dubbi e domande per la regia.

Non scrivere «sembra corretto»: o l'hai verificato, o dici che non l'hai fatto.
