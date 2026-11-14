# Incarico Gemini 01 — controllo indipendente del modulo di fisica

**Ruolo: revisore.** Scrivi solo in `crosscheck/` e `reviews/gemini/`.

## Contesto
Il modulo `src/renderer/src/physics/` (equazione centrale in 1D, densità |ψ|², velocità, massa efficace, riempimento) è stato scritto da Claude Opus e ha i suoi test. In questo momento Opus sta scrivendo l'interfaccia in `src/renderer/src/{ui,viz,sections}` e `App.tsx`, e può aggiungere file in `physics/`: tutto questo per te è in sola lettura.

Lo scopo è un controllo incrociato: un secondo modello rifà i conti da zero, partendo solo dalle dispense, e poi confronta. Modelli diversi sbagliano in punti diversi.

## Parte A — rifai i conti da zero (prima di leggere `physics/`)
Per restare indipendente, **non aprire i file di `physics/` finché la Parte A non è finita**. Parti da `materiale/parte3/dispensa.tex`, §11 «Il modello degli elettroni quasi liberi» (righe 1225–1714 circa) e dal formulario (righe 2287–2303).

In `crosscheck/quasi-liberi/` scrivi un programma autonomo, eseguibile con il Node del progetto e senza dipendenze, che implementa a modo tuo l'equazione centrale in 1D con V(x) = Σ_G V_G e^{iGx} (V_G reale e con segno, ioni in x = n·a) e calcola:
1. Le prime quattro bande in k = 0, π/2a e π/a per a = 3 Å, V_G = −0,5 eV, V_2G = 0, con 15 e con 41 onde piane.
2. Il gap in π/a, confrontato con 2|V_G|.
3. m₀/m* al bordo di zona per la banda superiore e per quella inferiore (riferimento della dispensa, Parte 4 §3.2: 17,731 per la superiore).
4. |ψ|² in x = 0 e in x = a/2 per le due bande al bordo, normalizzata a media 1 sulla cella, con V_G < 0 e con V_G > 0.
5. La velocità v = (1/ħ)·dE/dk in m/s al bordo di zona e, per l'elettrone libero, in k = 1 Å⁻¹.
6. Il livello di Fermi e la classificazione metallo/isolante per 1, 2, 3 e 4 elettroni per cella.
7. Il caso con due armoniche V_G = 0,45·E₀ e V_2G = 0,3·E₀ (E₀ = ħ²π²/2m₀a²): gap in π/a e gap in k = 0 tra le bande 2 e 3.
8. Gli esempi numerici svolti nel §11 della dispensa, in particolare quelli del §11.4.

Salva i risultati in `crosscheck/quasi-liberi/risultati.json`, con un nome chiaro per ogni numero.

## Parte B — confronto con il modulo dell'app
Ora leggi `physics/` e calcola le stesse grandezze con le sue funzioni, senza modificare `physics/` né la configurazione del progetto. `npm test` guarda solo `src/**/*.test.ts`: per eseguire un confronto in `crosscheck/` puoi usare una configurazione Vitest tua dentro `crosscheck/`.

Produci una tabella: grandezza, tuo valore, valore dell'app, valore della dispensa se esiste, differenza. Per ogni differenza oltre 1e-6 relativo (o oltre la precisione dichiarata dalla dispensa) spiega da dove nasce: numero di onde piane, passo delle differenze finite, convenzione, oppure errore.

## Parte C — revisione del codice di fisica
Leggi sorgenti e test di `physics/` e controlla:
- ogni formula contro la dispensa, segni compresi (V_G < 0 per ioni attrattivi; E₊ è sempre la banda superiore; ψ_c e ψ_s);
- unità e conversioni (Å, eV, m/s, fattori 2, 2π, ħ);
- casi limite: V = 0, bordo di zona, k = 0, degenerazioni, estremi degli slider (a da 2,5 a 6 Å; V_G da −3 a +3 eV; V_2G da −1,5 a +1,5 eV);
- test: usano numeri di riferimento veri? Le tolleranze sono oneste o larghe apposta?

## Consegna
`reviews/gemini/01-controllo-fisica.md`, con la struttura indicata in `AGENTS.md`, la tabella della Parte B e il verdetto finale: «approvato» oppure «da correggere».

## Vincoli
Quelli di `AGENTS.md`. In particolare: non modificare nulla fuori da `crosscheck/` e `reviews/gemini/`, niente commit, nessun processo lasciato in esecuzione.
