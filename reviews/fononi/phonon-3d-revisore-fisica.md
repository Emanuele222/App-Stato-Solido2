# Revisione Fisica — Sezione 3 «Rami 3D, polarizzazioni e cristalli reali» (`phonon-3d`)

**Revisore:** `revisore-fisica`  
**File esaminati (sola lettura):**
- [phonon3d.ts](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phonon3d.ts)
- [phonon3d.test.ts](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phonon3d.test.ts)
- [constants.ts](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/constants.ts)
- [formulas.ts](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-3d/formulas.ts)
- [manifest.ts](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-3d/manifest.ts)
- [model.ts](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-3d/model.ts)
- [store.ts](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-3d/store.ts)
- [strings.ts](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-3d/strings.ts)
- [Phonon3DSection.tsx](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-3d/Phonon3DSection.tsx)
- [Polarization3DView.tsx](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-3d/Polarization3DView.tsx)
- [ModeCounting3DView.tsx](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-3d/ModeCounting3DView.tsx)

**Fonti di riferimento:**
- `materiale/parte6/dispensa.pdf` — Lezione 2 (§§9–10 pp. 23–27, §12 pp. 29–30), Lezione 3 (§14 pp. 35–37, Tab. 1, Figg. 17–18, §19 pp. 47–48).
- `materiale/parte6/riferimento-formule.md`.

---

## Problemi trovati (in ordine di gravità)

### Bloccante

1. **Salti discontinui e scambi di ramo (`TA ↔ TO` e `LA ↔ LO`) in PbTe già ai parametri di default (e lungo `Γ–X` a basso `polarRatio`)**
   - **File e righe:** [phonon3d.ts#L673-L710](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phonon3d.ts#L673-L710), [phonon3d.ts#L749-L758](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phonon3d.ts#L749-L758) (`solvePhonon3DAtK`); [phonon3d.ts#L1128-L1140](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phonon3d.ts#L1128-L1140) (`computePhonon3DDispersion`).
   - **Cosa è sbagliato:**
     1. Ai parametri di default del cristallo iniziale (`pbte`: `transverseRatio = 0,28`, `polarRatio = 3,0`, `pointsPerSegment = 40`), i rami di dispersione generati da `computePhonon3DDispersion` presentano **discontinuità nette** attorno al punto $K$:
        - Sul tratto `X–K` (`segments[1]`), tra `j = 26` e `j = 27`, `TA2` salta bruscamente da `0,721 THz` a `0,886 THz` (`Δ = 0,164 THz`) e `TO1` salta in senso opposto da `0,884 THz` a `0,719 THz` (`Δ = 0,164 THz`).
        - Sul tratto `K–Γ` (`segments[2]`), tra `j = 7` e `j = 8`, `TA1` salta da `0,925 THz` a `0,714 THz` (`Δ = 0,211 THz`) e `TO1` salta da `0,709 THz` a `0,918 THz` (`Δ = 0,209 THz`).
        - Al vertice `K` (`pointIndex = 80`), il modo più basso (`0,640 THz`, che appartiene alla curva acustica continua proveniente da $\Gamma$ a $0\text{ THz}$) viene etichettato `TO1` (ottico), mentre il ramo a `0,993 THz` (che proviene da $\Gamma$ a $1{,}10\text{ THz}$) viene etichettato `TA2`.
        - Anche le curve globali `branches` soffrono lo stesso salto (`0,209 THz` su `TO1`, `0,176 THz` su `TA2`).
     2. Portando lo slider `polarRatio` verso `1,0` (estremo inferiore valido `[1,0; 3,5]`), compaiono salti discontinui ancora più grandi lungo `Γ–X` (`LA` e `LO` saltano di `0,222 THz` e `0,216 THz` a `j = 30`, oltre il `20%` della frequenza massima), oltre che su `X–K` e `K–Γ`.
   - **Causa fisica e algoritmica (dispensa §10.2–§10.3, eqq. 26–27 e nota 11 p. 27):**
     - `buildRocksaltMatrix` (righe 460–467) costruisce la matrice dinamica nella convenzione di fase sulla **posizione reale dell'atomo** $\mathbf{r}_{n\alpha} = \mathbf{R}_n + \boldsymbol{\tau}_\alpha$ (così anche `buildDiamondMatrix`, riga 341). Nella convenzione della dispensa eq. (26)–(27) ($\mathbf{R}_n$ della cella), l'autovettore del sottoreticolo 2 è legato a quello della convenzione posizione reale dal fattore geometrico $e^{i\mathbf{k}\cdot\boldsymbol{\tau}_2}$ (con $\boldsymbol{\tau}_2 = \frac{a}{2}(1,0,0)$ in NaCl). Vicino a $X$ e $K$, $\mathbf{k}\cdot\boldsymbol{\tau}_2 > \pi/2$ ($\cos(\mathbf{k}\cdot\boldsymbol{\tau}_2) < 0$) e $D_{12}$ cambia segno: calcolare `opticalScore` (righe 692–706) con `cm = (m1 u1 + m2 u2)/(m1+m2)` e `rel = u1 - u2` **senza** tenere conto di $e^{i\mathbf{k}\cdot\boldsymbol{\tau}_2}$ (e in una regione di BZ dove le masse diverse $M_{\text{Pb}} \neq M_{\text{Te}}$ già ibridano i modi) inverte la classificazione tra rami acustici e ottici.
     - In `computePhonon3DDispersion` (righe 1131–1139), invece di tracciare tutti e 6 i modi in modo continuo partendo da $\Gamma$ (dove i 3 acustici a $\omega=0$ e i 3 ottici a $\omega>0$ sono separati senza ambiguità), si filtra prima per `!m.isOptical` / `m.isOptical` locali: non appena `opticalScore` attraversa la soglia lungo il segmento, `matchTripleContinuous` è costretto a scambiare i due rami.
   - **Come riprodurlo:** eseguire `computePhonon3DDispersion(defaultParamsForCrystal('pbte'), 40)` e ispezionare `segments[1].branches` agli indici `26→27` (`TA2`/`TO1`) e `segments[2].branches` agli indici `7→8` (`TA1`/`TO1`), oppure aprire la sezione (PbTe è il cristallo iniziale) e osservare lo scalino verticale sui rami attorno a `K`. Con `{ crystalId: 'pbte', transverseRatio: 0.28, polarRatio: 1.0 }` il salto di `0,222 THz` è visibile anche lungo `Γ–X`.

---

### Importante

2. **Fase spaziale $\mathbf{k}\cdot\boldsymbol{\tau}_2$ omessa nell'animazione 3D e in `basisPhaseRad` per cristalli con base ($p = 2$)**
   - **File e righe:** [Polarization3DView.tsx#L319-L340](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-3d/Polarization3DView.tsx#L319-L340); [phonon3d.ts#L673-L710](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phonon3d.ts#L673-L710).
   - **Cosa è sbagliato:**
     In `buildDiamondMatrix` (riga 341) e `buildRocksaltMatrix` la fase scelta nella matrice dinamica corrisponde alla posizione reale $\mathbf{r}_{n\alpha} = \mathbf{R}_n + \boldsymbol{\tau}_\alpha$, per cui lo spostamento fisico dell'atomo 2 nella cella $n$ è $\mathbf{u}_{n,2}(t) = \operatorname{Re}\!\left[\mathbf{u}_2\,e^{i(\mathbf{k}\cdot(\mathbf{R}_n + \boldsymbol{\tau}_2) - \omega t)}\right]$.
     Tuttavia, in `Polarization3DView.tsx` (righe 319–340) entrambi gli atomi 1 e 2 della cella vengono animati con la stessa fase spaziale `phi = k · R_n` (senza $\mathbf{k}\cdot\boldsymbol{\tau}_2$), e in `phonon3d.ts` (righe 707–709) `basisPhaseRad` confronta $\mathbf{u}_1$ e $\mathbf{u}_2$ senza $e^{i\mathbf{k}\cdot\boldsymbol{\tau}_2}$ (restituendo per PbTe sempre `0` o `π` indipendentemente da $\mathbf{k}\cdot\boldsymbol{\tau}_2$).
   - **Formula/riferimento corretto:** dispensa §10.2 eq. (26)–(27) p. 26 e §10.3 nota 11 p. 27. Se $\mathbf{D}(\mathbf{k})$ usa i vettori interatomici reali $\boldsymbol{\delta}_m = \mathbf{R}_m + \boldsymbol{\tau}_2 - \boldsymbol{\tau}_1$, allora la fase dell'atomo 2 nella cella $n$ include $\mathbf{k}\cdot\boldsymbol{\tau}_2$ (oppure occorre applicare la trasformazione unitaria diagonale $e^{i\mathbf{k}\cdot\boldsymbol{\tau}_2}$ prima di animare/valutare `basisPhaseRad` nella convenzione di cella).
   - **Come riprodurlo:** selezionare `PbTe` con $\mathbf{k}$ vicino a $X$ (dove $\mathbf{k}\cdot\boldsymbol{\tau}_2 = \pi$) o `Diamante` vicino a $X$ ($\mathbf{k}\cdot\boldsymbol{\tau}_2 = \pi/2$): nella vista 3D l'atomo 2 della cella non riceve lo sfasamento geometrico $\mathbf{k}\cdot\boldsymbol{\tau}_2$ coerente con la convenzione della matrice dinamica.

3. **Triade di polarizzazione errata (fallback `[1, 0, 0]`) e $\hat{\mathbf{u}}_1 = (0,0,0)$ in `Values` quando l'atomo 1 è fermo; solo parte reale nei modi complessi**
   - **File e righe:** [Polarization3DView.tsx#L498-L549](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-3d/Polarization3DView.tsx#L498-L549); [Phonon3DSection.tsx#L508](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-3d/Phonon3DSection.tsx#L508) e [Phonon3DSection.tsx#L577-L580](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-3d/Phonon3DSection.tsx#L577-L580).
   - **Cosa è sbagliato:**
     1. La triade vettoriale a destra di `Polarization3DView` estrae la direzione di polarizzazione esclusivamente da `eVec = mode.displacementVectors[0]` (parte reale del solo atomo 1) e, quando `eNorm <= 1e-6`, usa il fallback hardcoded `[1, 0, 0]` (riga 500). Questo caso si verifica **realmente** ai parametri di default:
        - in **PbTe al punto $L$ (`pointIndex = 160`) per `TO1` e `TO2`**, dove i due sottoreticoli si disaccoppiano ($D_{12}^{\text{1NN}}(L) = 0$) e oscilla solo Te (`u0 = [0, 0, 0]`, `u1 = [0,707; -0,707; 0]`): la freccia $\boldsymbol{\varepsilon}^s$ viene disegnata lungo `[1, 0, 0]`, formando un angolo di $\approx 54{,}7^\circ$ con $\mathbf{k}_L \parallel [1, 1, 1]$, in contraddizione diretta con la didascalia sottostante `ε ⊥ k (0% L)`;
        - nel **Diamante al punto $X$ (`pointIndex = 40`) per `LO`**, dove `u0 = [0, 0, 0]`, `im0 = [0, 0, 0]`, `u1 = [0, 0, 0]`, `im1 = [1, 0, 0]` (qui `[1, 0, 0]` coincide per caso con $\mathbf{k}_X$, ma non per merito del calcolo e l'indicatore animato su $\boldsymbol{\varepsilon}^s$ non attinge al sottoreticolo che oscilla).
     2. In `Values` (`Phonon3DSection.tsx` righe 508 e 578) viene mostrato soltanto $\hat{\mathbf{u}}_1 = (0{,}00;\ 0{,}00;\ 0{,}00)$ senza indicare $\hat{\mathbf{u}}_2$, suggerendo allo studente che nessun atomo oscilli (laddove al bordo zona è proprio uno dei due tipi di atomo a oscillare, come nella catena biatomica §8.2 p. 22).
     3. Nei modi complessi circolarmente polarizzati (es. `TA1`/`TA2`/`TO1`/`TO2` al punto $X$ del Diamante, dove `u0` e `im0` sono ortogonali e di modulo uguale nel piano $yz$), la triade disegna solo `Re u0` (segmento 1D) invece di rappresentare la rotazione nel piano $yz$ mostrata dal cristallo a sinistra.
   - **Come riprodurlo:** selezionare `PbTe` (default), cliccare su `L` (`pointIndex = 160`) e selezionare `TO1` (o `TO2`): la freccia $\boldsymbol{\varepsilon}^s$ nella triade punta lungo $+x$ anziché ortogonale a $\mathbf{k} \parallel [1, 1, 1]$, e `Values` mostra $\hat{\mathbf{u}}_1 = (0{,}00;\ 0{,}00;\ 0{,}00)$.

---

### Minore

4. **Test di continuità con soglia troppo permissiva e mancata copertura dei parametri non di default**
   - **File e righe:** [phonon3d.test.ts#L189-L205](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/physics/phonon3d.test.ts#L189-L205).
   - **Cosa è sbagliato:** la soglia `maxJumpAllowed = d.maxFreqThz * 0.08` vale `0,264 THz` per PbTe (`maxFreqThz = 3,30 THz`), risultando maggiore dei salti discontinui reali di `0,164 THz` (`X–K`) e `0,211 THz` (`K–Γ`) descritti al punto 1; inoltre il test verifica la continuità solo ai parametri di default e non a `polarRatio = 1,0` né agli estremi di `transverseRatio` (`0,15` e `0,85`).

5. **Nota fissa «Non polare» nel Diamante anche quando `polarRatio > 1` e fase residua a $\Gamma$ acustico**
   - **File e righe:** [Phonon3DSection.tsx#L623-L625](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-3d/Phonon3DSection.tsx#L623-L625); [Polarization3DView.tsx#L208-L214](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-3d/Polarization3DView.tsx#L208-L214).
   - **Cosa è sbagliato:**
     1. Se si sceglie `Diamante` e si aumenta `polarRatio` sopra `1,0` (lo slider è attivo perché $p = 2$), `LO(Γ)` si separa da `TO_{1,2}(Γ)` anche in `Values`, ma la nota `v.diamondNoSplit` continua a mostrare «Non polare (LO = TO a Γ, nessun dipolo IR)» invece di comparire solo per `loToSplitThz ≈ 0`.
     2. Selezionando un modo acustico a $\Gamma$ ($\omega = 0$), `visualRate = 0` blocca `phaseAngleRef.current` al valore dell'istante precedente: se questo era vicino a $\pi/2$ o $3\pi/2$, $\cos(\text{phaseT}) \approx 0$ nasconde quasi completamente le frecce della traslazione rigida statica.

---

## Cosa ho verificato davvero

1. **Test automatici (`$env:PATH = "$PWD\.tools\node;$env:PATH"; npm.cmd test`):**
   - Tutti i **20 file di test / 177 test** sono passati (`phonon3d.test.ts`: 11/11 passati in 124 ms). Il test di continuità esistente non ha intercettato il problema Bloccante #1 per la soglia permissiva `0.08 * maxFreqThz`.
2. **Calcoli indipendenti in Node e verifica analitica delle matrici dinamiche rispetto alla dispensa:**
   - **Alluminio (fcc, $p=1$, $a=4{,}05\text{ Å}$, $M=26{,}9815\text{ u}$):** verificata analiticamente la matrice $3\times 3$ 1NN (`buildFccMonatomicMatrix`) e la calibrazione $C_L = 10{,}34\text{ N/m}$, $r = 0{,}36$: a $X$ dà $\text{LA} = 40{,}00\text{ meV}$ ($9{,}67\text{ THz}$) e $\text{TA}_{1,2} = 24{,}00\text{ meV}$ ($5{,}80\text{ THz}$), in accordo con Tab. 1 p. 36; velocità del suono lungo $[100]$: $v_L = 6{,}15\text{ km/s}$, $v_T = 3{,}69\text{ km/s}$.
   - **Diamante (fcc base C–C, $p=2$, $a=3{,}57\text{ Å}$, $M=12{,}011\text{ u}$):** verificato il modello tetraedrico di Born $6\times 6$ hermitiana complessa (`buildDiamondMatrix`, $C_L = 276{,}22\text{ N/m}$, $r_0 = 0{,}30$): a $\Gamma$ 3 modi acustici a $0$ e 3 modi ottici degeneri a $160{,}00\text{ meV}$ ($38{,}69\text{ THz}$, $R_{\text{cm}} = 0$); a $X$ sticking nonsimmetrico $\text{LA} = \text{LO} = 160/\sqrt{2} = 113{,}14\text{ meV}$ ($27{,}36\text{ THz}$); TA e TO doppiamente degeneri lungo $\Gamma\text{–}X$ (`[100]`) e $\Gamma\text{–}L$ (`[111]`), rimozione della degenerazione su $K\text{–}\Gamma$ (`[110]`).
   - **PbTe (NaCl polare, $p=2$, $a=6{,}46\text{ Å}$, $M_{\text{Pb}}=207{,}2\text{ u}$, $M_{\text{Te}}=127{,}6\text{ u}$):** verificati i valori a $\Gamma$ ($C_L = 2{,}01\text{ N/m}$, $\text{TO}_{1,2} = 1{,}10\text{ THz} = 4{,}55\text{ meV}$, $\text{LO} = 3{,}30\text{ THz} = 13{,}65\text{ meV}$, $R_{\text{cm}} = 0$, regola di somma acustica esatta anche con il termine dipolare rank-1 neutro) e la rimozione della degenerazione lungo `[110]`; individuati numericamente i salti di `0,164 THz` su `X–K`, `0,211 THz` su `K–Γ` (default) e `0,222 THz` su `Γ–X` (`polarRatio = 1,0`).
   - **Stabilità e positività su griglia 3D della 1BZ:** verificati gli autovalori di `buildDynamicalMatrix3D` su griglia $9\times 9\times 9$ di $q \in [-1, 1]^3$ per $r \in \{0{,}15; 0{,}28; 0{,}36; 0{,}50; 0{,}85\}$ e $\text{polarRatio} \in \{1{,}0; 3{,}0; 3{,}5\}$: nessun autovalore negativo oltre l'arrotondamento di macchina ($\ge -10^{-15}\,\omega_{\max}^2$).
   - **Formule vive e testi (`formulas.ts`, `strings.ts`):** verificate riga per riga contro eqq. (26)–(28) pp. 26–27, §9.1 p. 24 (correzione $p-1$ LO e $2(p-1)$ TO), §14.1–§14.4 pp. 35–37 (eqq. 34–36, $v_c = a^3/4$ per fcc, Tab. 1, Fig. 17) e §19 pp. 47–48.
   - **Conteggio 3D Born–von Kármán (`computeModeCounting3D`, `macroscopicAluminumEstimate`, `bvkGrid2D`):** verificati $v_c = a^3/4$, $N_c = 4N^3$, $3pN_c$, i punti della griglia 2D ($N^2$ contati in $(-\pi/a, +\pi/a]$ più $2N+1$ copie vuote sul bordo $-\pi/a$ per $N$ pari, 0 per $N$ dispari) e la stima per $1\text{ cm}^3$ di Al ($N_c = 6{,}02\times 10^{22}$, $3N_c = 1{,}81\times 10^{23}$, $\Delta k = 628{,}3\text{ m}^{-1}$, $\Delta k/(2\pi/a) = 4{,}05\times 10^{-8}$).

## Cosa non ho potuto verificare

- Non ho avviato il browser (`npm run dev:web`) né ispezionato visivamente la resa grafica a schermo dei canvas (`Polarization3DView`, `ModeCounting3DView`, `DispersionPlot`) alle diverse risoluzioni: tutte le verifiche sulle viste React sono state condotte mediante lettura diretta del codice sorgente e controllo numerico degli input passati ai canvas.
- Non ho eseguito `npm run typecheck` né `npm run build` (fuori dallo scope test unitari di `revisore-fisica`, verificati di competenza di `revisore-integrazione`).

---

## Verdetto

**da correggere**
