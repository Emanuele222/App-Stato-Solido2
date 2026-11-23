# Revisione Studente — Sezione 3: «Rami 3D, polarizzazioni e cristalli reali» (`phonon-3d`)

**Ruolo:** Studente del 3° anno di fisica (esperienza didattica dal browser su `http://127.0.0.1:5173/`, nessuna lettura del codice sorgente).  
**Ambito verificato:** schermata iniziale (PbTe), animazione 3D e schema vettoriale `k` / `εˢ`, cambio cristallo (Al `p = 1`, Diamante `p = 2` non polare, PbTe `p = 2` polare), slider `C_T/C_L` e `ω_LO/ω_TO`, pulsanti rapidi e navigazione su `DispersionPlot` (click e frecce `←`/`→`/`↑`/`↓`), toggle unità `meV` / `THz`, strumento «Conteggio modi 3D (1BZ)», formule vive (hover bidirezionale) e «Teoria in breve».

---

## 1. Spiegazione del concetto (in 5 righe)

In un cristallo 3D con $p$ atomi per cella primitiva ogni atomo ha 3 gradi di libertà, quindi per ogni vettore d'onda $\mathbf{k}$ nella 1BZ esistono $3p$ rami fononici: 3 acustici (1 LA, 2 TA) e $3p - 3$ ottici, che lungo direzioni di alta simmetria si dividono in $p - 1$ LO e $2(p - 1)$ TO (solo per $p = 2$ si ha 1 LO e 2 TO).
Lungo assi con rotazione almeno ternaria come $\Gamma\text{–X}$ ($[100]$, $C_4$) e $\Gamma\text{–L}$ ($[111]$, $C_3$) i due modi trasversali sono degeneri, mentre lungo $[110]$ ($\Gamma\text{–K}$, $C_2$) la degenerazione si rimuove e su direzioni generiche come $\text{X–K}$ le polarizzazioni sono miste.
Nei cristalli ionici polari come il PbTe il moto relativo di cariche opposte genera un campo elettrico macroscopico che alza $\omega_{\text{LO}}$ sopra $\omega_{\text{TO}}$ a $\Gamma$, a differenza dei cristalli covalenti non polari come il diamante ($\text{LO} = \text{TO}$ a $\Gamma$) e dei monoatomici come l'alluminio ($p = 1$, solo 3 rami acustici).
Con condizioni periodiche di Born–von Kármán, i bordi $+\pi/a$ e $-\pi/a$ differiscono per un vettore $\mathbf{G}$ e non vanno contati due volte: in 1BZ cadono esattamente tanti $\mathbf{k}$ quante sono le celle primitive $N_c = V / v_c$, per un totale di $3p N_c$ modi.
Poiché i reticoli fcc (Al, diamante, PbTe) hanno 4 celle primitive nel cubo convenzionale di lato $a$, il volume della cella primitiva è $v_c = a^3 / 4$ e un cubo di $N$ celle convenzionali per lato contiene $N_c = 4 N^3$ celle primitive.

---

## 2. Problemi riscontrati (ordinati per gravità)

### Bloccante
Nessun problema bloccante: la sezione si carica senza errori in console, i controlli rispondono e l'impianto concettuale di base (rami acustici vs ottici, polarizzazioni, splitting polare, conteggio in 1BZ) si riesce a esplorare completamente.

### Importante

1. **Discontinuità e scambio di rami attorno a `K` sul grafico di `PbTe`**
   - **Dove:** `DispersionPlot` lungo `X–K–Γ` selezionando `PbTe` (visibile già nella schermata iniziale), e navigazione con frecce `←`/`→` e `↑`/`↓` vicino a `K`.
   - **Cosa è successo:** Intorno a `K`, la curva continua color pesca (`TO₁`) compie due bruschi salti quasi verticali verso il basso formando una «vasca» fino a `~0,64 THz`, scendendo **sotto** il ramo verde acustico `LA` (che sale a `~0,96 THz` a `K`). Muovendosi con `→` su `TO₁` oltre `K`, tra `k = (0,62; 0,62; 0,00) 2π/a` (`0,71 THz`, `û₁ = (0,71; −0,71; 0,00)`) e il passo successivo `(0,58; 0,58; 0,00) 2π/a` la frequenza salta improvvisamente da `0,71 THz` a `0,91 THz`. Inoltre, premendo `↑`/`↓` vicino a `K` (es. a `(0,66; 0,66; 0,00)`), il selettore non sale in ordine di frequenza ma percorre `TO1 (0,66 THz) → TA2 (0,94 THz) → LA (0,92 THz) → TA1 (0,69 THz) → TO2 (1,05 THz) → LO (2,76 THz)`. (In Alluminio e Diamante le curve vicino a `K` sono invece continue.)
   - **Cosa avrebbe aiutato:** Tracciare i rami per continuità degli autovettori (evitando salti verticali dove le curve si incrociano vicino a `K`) e far seguire a `↑`/`↓` l'ordine effettivo di frequenza sul grafico. Da studente, vedere un ramo ottico crollare a gradino sotto il ramo acustico fa pensare a una discontinuità fisica reale anziché a un artefatto di ordinamento.

2. **Etichette `TA₁` e `TA₂` invertite lungo `K–Γ` su `PbTe`**
   - **Dove:** `DispersionPlot` su `PbTe` lungo `K–Γ`, in confronto ai pulsanti rapidi `K–Γ: TA₁` e `K–Γ: TA₂`.
   - **Cosa è successo:** Cliccando `K–Γ: TA₁`, il marker si posiziona sulla curva verde **tratteggiata inferiore** (`0,43 THz`, polarizzazione fuori piano lungo `z`), ma sul grafico l'etichetta scritta vicino a quella curva è **`TA₂`**. Viceversa, cliccando `K–Γ: TA₂`, il marker si posiziona sulla curva verde **continua superiore** (`0,56 THz`, polarizzazione nel piano `[1, −1, 0]`), ma sul grafico l'etichetta scritta accanto è **`TA₁`**. (Su Alluminio e Diamante invece `TA₁` è sulla curva inferiore e `TA₂` sulla superiore in accordo con i pulsanti.)
   - **Cosa avrebbe aiutato:** Etichettare le due curve lungo `K–Γ` in modo coerente con il nome del modo selezionato e mostrato in `FORMULA VIVA` (e nel badge della vista 3D).

3. **Ramo `LO` troncato fuori scala in alto quando si aumentano gli slider (e nota incoerente su Diamante modificato)**
   - **Dove:** `DispersionPlot` e pannello `FORMULA VIVA` (`Riferimento Tab. 1`) modificando gli slider `C_T/C_L` e `ω_LO/ω_TO` su `Diamante` e `PbTe`.
   - **Cosa è successo:**
     - Su `Diamante` (asse Y bloccato a `180 meV`), spostando lo slider `ω_LO/ω_TO` da `1,00` a `1,50`, il selettore passa a `Libero (parametri modificati)`, `LO(Γ)` sale a `240,0 meV`, ma la curva `LO` esce quasi tutta oltre il bordo superiore del grafico. Lo stesso accade su `PbTe` in `THz` (tetto `4,0 THz`) portando al massimo entrambi gli slider (`C_T/C_L = 0,85`, `ω_LO/ω_TO = 3,50` → `LO(Γ) = 5,07 THz`).
     - Inoltre, su `Diamante` con `ω_LO/ω_TO = 1,50` (dove `LO(Γ) = 240,0 meV ≠ TO₁,₂(Γ) = 160,0 meV`), `FORMULA VIVA` continua a stampare la nota `"Non polare (LO = TO a Γ, nessun dipolo IR)."` che contraddice il grafico appena modificato.
   - **Cosa avrebbe aiutato:** Adattare dinamicamente il massimo dell'asse Y quando `LO` supera il limite corrente, e aggiornare la nota di polarità quando il cristallo passa in modalità `Libero (parametri modificati)` con `ω_LO/ω_TO > 1` (oppure chiarire che si sta simulando uno splitting polare ipotetico).

4. **Incongruenza sul significato di `N` e sulla formula $L = N^{1/3} a_c$ nella «Teoria in breve»**
   - **Dove:** ultima sezione di `TEORIA IN BREVE` (*«Conteggio 3D di Born–von Kármán e volume v_c = a³/4»*) rispetto allo strumento `Conteggio modi 3D (1BZ)` e alla `FORMULA VIVA`.
   - **Cosa è successo:** In `TEORIA IN BREVE` si legge: *«su un cubo di lato $L = N^{1/3} a_c$ ... il numero di punti $k$ distinti in zona è $V/v_c = N$, uno per cella primitiva, e il bilancio dei modi è $3pN$»*. Ma se $L = N^{1/3} a_c$, allora $V = N a_c^3$, che per un reticolo fcc ($v_c = a_c^3/4$) darebbe $V/v_c = 4N \neq N$! Nello strumento interattivo invece `N` è il numero di celle convenzionali per lato ($L = Na$), e il numero di celle primitive è giustamente chiamato $N_c = 4N^3$.
   - **Cosa avrebbe aiutato:** Usare simboli distinti anche in `TEORIA IN BREVE` (es. $L = N a_c$ per lato e $N_c = V/v_c = 4N^3$ celle primitive per fcc, oppure $V = N_c v_c$ senza scrivere $L = N^{1/3} a_c$), così testo e simulatore parlano esattamente la stessa lingua.

### Minore

1. **Simbolo `û₁` poco trasparente per basi `p = 2` (modulo `< 1` e assenza di `û₂`)**
   - **Dove:** `FORMULA VIVA`, riga `Polarizzazione`, su `PbTe` e `Diamante`.
   - **Cosa è successo:** Nei modi ottici di `PbTe` compare `û₁ = (0,61; 0,00; 0,00)` per `LO` e `û₁ = (0,00; 0,59; 0,00)` per `TO`, mentre nei modi acustici compare `(1,00; 0,00; 0,00)`. Da studente ci si chiede subito perché un vettore con il cappello (`û₁`) non abbia norma 1, che relazione abbia con il fattore $M_1^{-1/2} \boldsymbol{\varepsilon}^s_1$ dell'equazione sopra, e dove sia `û₂` (il secondo atomo della base, che nei modi ottici oscilla in controfase rispetto al primo).
   - **Cosa avrebbe aiutato:** Mostrare entrambi i vettori `û₁` (Pb) e `û₂` (Te) — almeno nei modi ottici, dove il segno opposto rende visibile a colpo d'occhio la controfase — o chiarire con una riga/simbolo se `û₁` è la componente normalizzata sul singolo sottoreticolo dell'autovettore di polarizzazione $\boldsymbol{\varepsilon}^s$.

2. **Pulsante rapido `X–K: misto` disponibile solo su Alluminio (`p = 1`)**
   - **Dove:** barra dei pulsanti di salto rapido sopra la vista 3D.
   - **Cosa è successo:** Passando a `Alluminio` compaiono 5 pulsanti tra cui `X–K: misto`, utilissimo per capire che su una direzione generica il carattere longitudinale è parziale (`96%`). Su `PbTe` e `Diamante` (`p = 2`) ci sono 6 pulsanti tutti su `Γ–X` e `K–Γ` e nessuno su `X–K`, per cui si scopre la polarizzazione mista solo cliccando a mano sul tratto `X–K` del grafico.
   - **Cosa avrebbe aiutato:** Lasciare un pulsante rapido `X–K: misto` anche per `PbTe` e `Diamante`.

3. **Frecce di spostamento `u_{nα}(t)` piccole nel reticolo 3D a sinistra**
   - **Dove:** pannello sinistro di `Spazio reale 3D — piani atomici e polarizzazione εˢ(k)`.
   - **Cosa è successo:** La differenza tra longitudinale e trasversale si coglie immediatamente nello schema vettoriale a destra (`k` vs `εˢ`), mentre nel reticolo 3D a sinistra le frecce verdi sugli atomi sono sottili e corte rispetto alle sfere blu/rosa: a colpo d'occhio si fatica un po' a distinguere subito l'oscillazione in fase (`LA`/`TA`) da quella in controfase (`LO`/`TO`) tra Pb e Te senza fermarsi a osservare da vicino.
   - **Cosa avrebbe aiutato:** Rendere leggermente più ampie/visibili le frecce `u_{nα}(t)` o le oscillazioni degli atomi nel reticolo 3D (o aggiungere un piccolo testo tipo `in fase` / `in controfase` nella legenda/badge).

4. **Piccoli dettagli di impaginazione e testo**
   - **Dove:**
     - `FORMULA VIVA`: l'etichetta `Riferimento Tab. 1` va a capo lasciando `1` isolato su una seconda riga.
     - Controlli sotto `DispersionPlot`: i tre elementi (`Cristallo`, `C_T/C_L`, `ω_LO/ω_TO`) vanno su due righe con `ω_LO/ω_TO` isolato sotto.
     - Vista 3D: quando il badge di stato è lungo (es. `TO1 su K–Γ · carattere long. 0% · degenerazione rimossa su [110]`), va a capo su una nuova riga sotto il titolo.
     - `DispersionPlot` su `PbTe`: la scritta `LO 3,3 THz` sfiora la curva `LO` subito dopo `Γ`.
     - Sulla prima selezione di un pulsante rapido (es. `Γ–X: LA`), il contorno bianco del `:focus` sul pulsante precedentemente cliccato può trarre momentaneamente in inganno finché non si clicca altrove.

---

## 3. Le due cose che hanno aiutato di più a capire

1. **Lo schema vettoriale `k` / `εˢ(k)` affiancato al 3D e collegato alle formule vive:** vedere istantaneamente `εˢ` parallela a `k` (`LO`/`LA`, `100% L`), perpendicolare fuori piano (`TA₁` lungo `z`) o nel piano (`TA₂` lungo `[1, −1, 0]`) su `K–Γ`, oppure obliqua su `X–K` (`38% L` su PbTe, `96% L` su Al), rende concretissimo perché i nomi LA/TA/LO/TO siano esatti solo sugli assi di alta simmetria e perché la degenerazione trasversale si rompa lungo `[110]`. Anche l'hover bidirezionale tra `(3p − 3) ott.` / `ω_ott`, lo slider `ω_LO/ω_TO` e i soli rami ottici nel grafico lega subito formula, parametro fisico e curve.
2. **Lo strumento «Conteggio modi 3D (1BZ)» con Fig. 17 e cella primitiva fcc (`v_c = a³/4`):** vedere sulla griglia 2D i cerchi gialli pieni sui bordi `−π/a` e quelli vuoti sui bordi `+π/a` («copie per G») chiarisce subito perché in zona cadano esattamente `N` punti per asse e non `N + 1` o `N − 1`, mentre il confronto visivo tra cubo convenzionale `a³` e cella primitiva fcc fissa in modo intuitivo il fattore `4` in `N_c = 4N³` e `v_c = a³/4`.

---

## 4. Verdetto

**da correggere**
