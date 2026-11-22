# Regole operative — Capitolo Fononi (Antigravity)

Queste regole si affiancano a `progetto.md` e `CLAUDE.md` per lo sviluppo autonomo del **Capitolo Fononi** su Antigravity, senza modificare i file di regia del collega (`AGENTS.md`, `CLAUDE.md`, `progetto.md`, `.claude/`, `incarichi/`, sezioni del capitolo `bands`).

## Fonte fisica e notazione
- **Fonte unica per i Fononi**: `materiale/parte6/dispensa.pdf` e il suo estratto strutturato `materiale/parte6/riferimento-formule.md`.
- **Piano approvato del capitolo**: `piano-fononi.md` nella radice del progetto (scaletta delle 6 sezioni, tabella colori, costanti SI, infrastruttura multi-capitolo).
- Rispettare sempre i simboli e le convenzioni della Parte 6: $C$ per la costante elastica (non $\gamma$ o $K$), $M > m$ nella biatomica con passo reticolare $a$ e distanza primi vicini $a/2$, $\omega_-$ ramo acustico, $\omega_+$ ramo ottico, $g(\omega)$ per polarizzazione in 3D (totale $3g$ normalizzato a $3N$), $\mathcal{E}(x) = x^2 e^x / (e^x-1)^2$, $\mu = 0$ per i fononi.
- Nessun errore delle slide va reintrodotto: seguire le correzioni esplicite della dispensa (es. $p-1$ LO e $2(p-1)$ TO; stesso segno $\pm$ in energia e quasi-impulso nello scattering elettrone-fonone).

## Confini e convivenza col capitolo «Teoria delle bande»
- Le 6 sezioni esistenti di `Teoria delle bande` non vanno alterate né rotte.
- È consentito estendere in modo retrocompatibile i file condivisi necessari al multi-capitolo (`sections/registry.ts`, `strings.ts`, `home/`, `ui/theme.ts`, nuovi componenti riusabili in `viz/`), mantenendo **1 colore = 1 grandezza fisica** e verificando che tutti i test e le viste esistenti restino verdi.
- Tutta la fisica nuova va in `src/renderer/src/physics/` (TypeScript puro, zero React/DOM) con test unitari Vitest basati sui numeri e limiti della Parte 6.
- Le sezioni fononiche vanno in `src/renderer/src/sections/<sezione>/` seguendo la struttura uniforme del progetto (`manifest.ts`, `store.ts`, `model.ts`, `formulas.ts`, `strings.ts`, viste, `*Section.tsx`).
- Rapporti di revisione in `reviews/fononi/`, script di verifica indipendente in `crosscheck/fononi/`.

## Ambiente su Windows
- Node.js locale si trova in `.tools/node` (ignorata da git). Prima di eseguire comandi in PowerShell, anteporre `.tools\node` al `PATH` e usare `npm.cmd` / `npx.cmd` (per evitare blocchi di PowerShell ExecutionPolicy su `npm.ps1`):
  `$env:PATH = "$PWD\.tools\node;$env:PATH"`
- Verifiche obbligatorie dopo ogni modifica sostanziale: `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`.
- Niente commit o push senza richiesta esplicita dell'utente. Non lasciare server o processi in background aperti.
