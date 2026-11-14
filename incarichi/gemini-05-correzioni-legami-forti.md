# Incarico Gemini 05 — correzioni a «Legami forti»

**Ruolo: autore di sezione.** Scrivi in `src/renderer/src/sections/tight-binding/` e, per il punto 6, in `src/renderer/src/physics/` con i relativi test. Nient'altro. `ui/`, `viz/` e le altre sezioni non si toccano.

## Esito dell'incarico 04
Controllato dalla regia nel browser a 1200, 800×700 e 800×600 px.

- **Parte A: accettata.** A 800 px la legenda di Kronig–Penney è fuori dalle curve e «V_G» ha il pedice.
- **Parte B: la fisica è giusta, la resa grafica no.** 94 test su 94 e build riuscita; i numeri a schermo tornano con un ricalcolo indipendente (biatomica a = 3,5 Å, E_A = −1,5, E_B = 1,5, t = 0,9 eV: gap 3,00 eV, distanza in k = 0 pari a 4,69 eV, m*_c = 1,152 m₀, pesi 0,12 / 0,88 in k = 0,5 π/a). Però la sezione non è stata guardata in esecuzione e si vede: sotto ci sono i difetti trovati.

Risposte alle tue domande:
1. Re ψ_k e |ψ_k|² su due fasce separate: va bene così.
2. Stato iniziale k = 0, banda s: va bene.

## Correzioni, in ordine di gravità

### 1. Valori vivi senza impaginazione (importante)
Il pannello usa le classi `readout` e `readout-row`, che non esistono nel CSS comune: etichetta e valore escono attaccati («Passo a3,00 Å», «Gap in π/a1,60 eV»). Usa la stessa struttura delle altre tre sezioni (blocco `values` come in `NearlyFreeSection.tsx` e `KronigPenneySection.tsx`): etichetta a sinistra, valore a destra, simboli resi con KaTeX e colorati per grandezza, evidenziazione al passaggio. Niente testo grezzo come «t_s», «m*_c», «|b_A|²».

### 2. LaTeX grezzo sulle etichette del diagramma (importante)
Sul canvas compaiono «\bar{E}_p», «\bar{E}_s», «E_g», «E_B - E_A». `drawMathText` di `viz/canvas.ts` capisce solo i pedici scritti `_{…}`: scrivi `Ē_{s}`, `Ē_{p}`, `E_{g}`, `E_{A}`, `E_{B}`, `E_{B} − E_{A}` (con Ē come carattere Unicode), come fa la pilota con `E_{0}` e `2|V_{G}|`.

### 3. Etichette sovrapposte con gli strumenti attivi (importante)
Con Riempimento, Massa efficace e Confronto attivi, a 1200 px:
- la pillola «antilegante» copre «parabola m*»;
- il testo «isolante / semicond.» accanto a E_F copre le pillole in −π/a;
- nella biatomica l'etichetta del gap è sbarrata dalla linea di E_F e i livelli E_A, E_B toccano le pillole.

Le pillole di `BandExtremumOverlay` devono tenere conto di ciò che `BandPlot` disegna (livello di Fermi, sonda, etichette dei livelli e del gap, legenda) e spostarsi o nascondersi quando non c'è posto. Le due pillole in −π/a (cima della banda s, fondo della banda p) oggi sono impilate e non si capisce a quale banda appartengano: ognuna va dal lato esterno della propria banda.

### 4. Coerenza con le altre sezioni (importante)
- Titoli dei pannelli: «Formula viva», «Scheda teoria» come nelle altre sezioni, non «Dispersione e larghezza di banda» e «Da atomi isolati a bande cristalline» (quest'ultimo può restare come titolo interno della scheda). I valori vivi stanno sotto la formula nello stesso pannello, come nelle altre.
- Percorso in alto: «Teoria delle bande › Legami forti», senza «Capitolo 1 —».
- Scheda teoria: le formule vanno rese con KaTeX come nelle altre sezioni. Oggi sono testo grezzo: «e^{ikR}», «t_s > 0», «Ē_n», «φ_n».
- Titolo del diagramma: l'asse k va oltre ±π/a, quindi «Diagramma E(k)» e basta, oppure limita la finestra alla prima zona come dice il titolo attuale.

### 5. Spazio reale (importante)
- La scritta «forma indicativa (orbitali modello)» è disegnata sopra la curva di Re ψ_k ed è già ripetuta nell'intestazione: tienine una sola, fuori dalle curve.
- A 800×600 px la catena con gli orbitali sparisce del tutto (la vista è alta 82 px): è la parte più importante della sezione e deve restare visibile. Dai alla vista un'altezza minima e fai scorrere la colonna, come fanno le altre sezioni, invece di schiacciarla.
- A 800 px il diagramma E(k) è alto 160 px e con gli strumenti attivi è illeggibile: stessa cura.

### 6. Fisica nell'interfaccia (importante, è la terza volta)
In `model.ts` c'è `Math.PI / a` in una decina di punti (righe 127, 231, 232, 273, 283, 296–303, 331) e la fase sui siti con `Math.cos(k·x)` (righe 339, 348); in `TightBindingRealSpace.tsx` righe 161 e 196 lo stesso; in `store.ts` riga 129 la legge esponenziale è riscritta a mano con `Math.exp`. Esistono già `zoneEdge1D` e `indicativeHoppingAtDistance`: usale, e aggiungi a `physics/` ciò che manca (fase di Bloch sul sito, taratura di t(a₀) dal valore corrente) con il suo test. Alla fine, cercando `Math.` nella cartella della sezione devono restare solo operazioni di disegno.

### 7. Minori
- Massa efficace: con la sonda sulla banda p i valori analitici mostrati sono quelli della banda s. Mostra quelli della banda su cui sta la sonda.
- Mini-diagramma «bordi vs a»: le etichette «a = 3,00 Å» e l'unità sull'asse sono tagliate a destra.
- Le tue due proposte per `ui/` e `viz/` (annotazioni in `BandPlot`, cursore bloccato in `ParamSlider`) sono registrate.

## Verifica prima di consegnare
`npm run typecheck`, `npm test`, `npm run build` dopo l'ultima modifica. Questa volta la verifica visiva è obbligatoria: guarda «Legami forti» in esecuzione a 1440, 1100 e 800 px, nelle due varianti, con tutti gli strumenti attivi e con «Avvicina gli atomi». Se il browser chiede un permesso, fermati e chiedilo all'utente in chat invece di consegnare senza aver guardato.

## Consegna
`reviews/gemini/05-correzioni-legami-forti.md`, con la struttura di `AGENTS.md`: per ogni punto cosa hai cambiato e come l'hai verificato.
