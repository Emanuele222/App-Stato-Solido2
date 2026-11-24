# Revisione didattica (studente 3° anno) — Guide e interazione delle sezioni Fononi 1–4

**Data**: 2026-11-24  
**Revisore**: Studente 3° anno (skill `.agents/skills/studente/SKILL.md`)  
**Ambiente verificato**: app in esecuzione su `http://127.0.0.1:5173/` tramite browser a risoluzione desktop `1440×900` (esplorazione interattiva di Home, `phonon-monatomic`, `phonon-diatomic`, `phonon-3d`, `phonon-wavepacket` + lettura in sola lettura dei testi in `src/renderer/src/sections/phonon-*/`).  
**Verdetto complessivo**: **approvata**

---

## Sintesi trasversale sulle 4 sezioni

1. **Scheda «Guida alla sezione»**: in tutte e 4 le sezioni la struttura a 3 blocchi aperti (*L’idea*, *Come intervengono i parametri*, *Cosa provare*) più il riquadro apribile *Dettagli formali* funziona molto bene come guida operativa: in poche righe orienta subito verso controlli, preset, strumenti superiori e grafici, lasciando derivate, matrici dinamiche, errori tipici e dimostrazioni dentro *Dettagli formali* (tutto reso con KaTeX senza errori di compilazione).
2. **Collegamenti vivi `\htmlData{q=...}`**: il collegamento tra testo della guida, *Formula viva*, slider e scena è immediato e bidirezionale in tutte e 4 le sezioni (verificato anche su `phonon-3d`, dove gli slider `C_T/C_L` e `ω_LO/ω_TO`, i termini in guida e quelli in *Formula viva* attivano subito evidenziazione e attenuazione). Zero attributi `data-q=""` vuoti su tutto il capitolo.
3. **Misconcetti chiave**: tutti i nodi concettuali indicati sono chiariti sia nei testi sia visivamente nelle animazioni e letture numeriche. Non emergono problemi **Bloccanti** né **Importanti**, ma solo alcuni dettagli **Minori** di impaginazione/UX.

---

## 1. Catena monatomica e prima zona (`phonon-monatomic`)

### Spiegazione del concetto (5 righe)
In un cristallo 1D gli atomi di massa $M$ a distanza $a$ sono legati da molle di costante $C$ e vibrano attorno ai siti di equilibrio con frequenze $\omega(k) = 2\sqrt{C/M}|\sin(ka/2)|$. Per lunghezze d’onda grandi ($ka \ll 1$) l’onda viaggia come suono continuo alla velocità $v_s = a\sqrt{C/M}$, ma vicino al bordo della prima zona di Brillouin ($k = \pm\pi/a$) la curva si appiattisce. Al bordo di zona la velocità di gruppo $v_g = \mathrm{d}\omega/\mathrm{d}k$ si annulla formando un’onda stazionaria ($\lambda = 2a$), ma gli atomi non sono fermi: oscillano vigorosamente in opposizione di fase e $|v_p| = \frac{2}{\pi}v_s \neq 0$. Poiché l’onda esiste fisicamente solo sui siti atomici discreti, vettori $k' = k + 2\pi m/a$ producono esattamente gli stessi spostamenti (*aliasing*) e tutte le onde distinte stanno nella prima zona $(-\pi/a, \pi/a]$. Chiudendo la catena ad anello con $N$ atomi (Born–von Kármán) restano esattamente $N$ modi discreti in zona, tanti quanti i gradi di libertà longitudinali.

### Verifica guidata, controlli e misconcetti
- **Guida alla sezione**: *L’idea* introduce subito catena in alto, curva $\nu(k)$ in basso e i simboli $C, M, a, k$; *Come intervengono i parametri* spiega chiaramente l’effetto di $C$, $M$, $a$ e i tre strumenti superiori (`Aliasing (k+G)`, `Born–von Kármán (N)`, `Sonda v_p, v_g`); *Cosa provare* propone tre esperimenti concreti e immediati; *Dettagli formali* raccoglie sviluppo armonico, limite continuo, banda evanescente ($k$ complesso per $\omega > \omega_{\max}$), aliasing/Nyquist e Born–von Kármán.
- **Collegamenti vivi**: 99 nodi `data-q` su 8 chiavi (`omega`, `k`, `M`, `C`, `a`, `u`, `v`, `vp`); hover bidirezionale immediato tra guida, *Formula viva*, slider (`a`, `M`, `C`) e scena.
- **Misconcetto $k=\pi/a$ (atomi oscillano, $v_g=0$)**: cliccando il modo rapido `π/a` gli atomi oscillano visibilmente in controfase con frecce alternate e dicitura `onda stazionaria (λ = 2a, vg = 0, opposizione di fase)`; con `Sonda` attiva la tangente è orizzontale ($v_g = 0$) mentre la corda viola resta inclinata ($v_p = 2,20\text{ km/s}$ su *Metallo tipico*) e *Formula viva* ribadisce che gli atomi oscillano.
- **Misconcetto aliasing $k \sim k+G$**: attivando `Aliasing (k+G)` a $\pi/2a$, l’onda gialla tratteggiata $k' = k - G$ (`-1,50 π/a`) oscilla più rapidamente nello spazio vuoto tra i siti ma interseca esattamente tutti gli spostamenti $u_n$ degli atomi ed è collegata orizzontalmente alla stessa frequenza $\nu = 3,11\text{ THz}$ sul grafico.
- **Controlli**: verificati preset (`Metallo tipico`, `Piombo 1D`, `Carbonio 1D`), slider liberi (`a, M, C`), `Born–von Kármán` con stepper `N` ($N=10 \to 11$ pallini verdi in $(-\pi/a, \pi/a]$), click sul grafico con clamping al bordo zona, `Pausa`/`Avvia`, velocità `0,25×–2×` e `Ripristina fase`.

### Le due cose che hanno aiutato di più a capire
1. Il toggle **Aliasing ($k+G$)** sovrapposto in tempo reale sulla catena discreta: vedere due curve continue diversissime passare esattamente per gli stessi atomi rende ovvio perché la prima zona basti a descrivere tutto.
2. Il modo rapido **$\pi/a$** abbinato alla **Sonda $v_p, v_g$**: vedere simultaneamente la tangente piatta ($v_g = 0$), la corda viola inclinata ($v_p \neq 0$) e le frecce di oscillazione massima in controfase sugli atomi elimina subito l’equivoco «onda stazionaria = atomi immobili».

---

## 2. Catena biatomica, gap e luce IR (`phonon-diatomic`)

### Spiegazione del concetto (5 righe)
Quando ogni cella di passo $a$ contiene due atomi di masse diverse $M$ e $m$ legati da molle $C$, lo spettro delle vibrazioni si separa in due rami: il ramo acustico $\omega_-$ a basse frequenze (atomi vicini in fase) e il ramo ottico $\omega_+$ ad alte frequenze (atomi in controfase), separati da un gap proibito $\Delta\omega_{\mathrm{gap}}$ tanto più ampio quanto maggiore è il contrasto tra $M$ e $m$ (e che si chiude per $M=m$ per ripiegamento della zona). Nel modo ottico a $k=0$ i due atomi oscillano in opposizione mantenendo immobile il centro di massa ($R_{\mathrm{cm}}=0$, $Mu_1 + mu_2 = 0$), creando un dipolo oscillante che può accoppiarsi con la luce infrarossa solo vicino a $k \approx 0$. Ai bordi di zona ($k = \pm\pi/a$) le due onde stazionarie ($v_g=0$) immobilizzano una specie atomica alla volta: nel bordo acustico $C$ si ferma l’atomo leggero e oscilla il pesante, nel bordo ottico $B$ accade l’opposto (scambiandosi se $m > M$). Sul ramo ottico per $k > 0$ la curva decresce: la velocità di gruppo $v_g < 0$ punta quindi in verso opposto alla velocità di fase $v_p > 0$.

### Verifica guidata, controlli e misconcetti
- **Guida alla sezione**: tutti e tre i blocchi aperti spiegano chiaramente ruoli fisici di $M, m, C, a$, modi rapidi e i tre strumenti (`Luce infrarossa`, `Confronto M = m`, `Matrice D(k)`); *Dettagli formali* chiarisce passo di Bravais $a$ vs distanza primi vicini $a/2$, segni $\omega_\pm$, normalizzazione di $R_{\mathrm{cm}}$, scambio dei ruoli $M \leftrightarrow m$ e perché il diamante ($M=m$) non assorbe IR a un fotone.
- **Collegamenti vivi**: 105 nodi `data-q` su 10 chiavi (`k`, `C`, `m`, `M`, `a`, `omega`, `omegaOpt`, `v`, `u`, `vp`); hover bidirezionale immediato con atomi blu ($M$), atomi rosa ($m$), molle ($C$), slider e formule.
- **Misconcetto $R_{\mathrm{cm}}=0$ a $k=0$ ottico (`Ott. 0`)**: il rombo bianco $R_{\mathrm{cm}}$ resta immobile al centro della cella mentre blu e rosa oscillano in opposizione ($\alpha = -1,54 = -M/m$ su `Coppia Na–Cl`), con lettura esplicita `R_cm = 0 (fermo)`.
- **Misconcetto bordi $C$ e $B$**: su `C (π/a)` ($\nu_{\max}^{\mathrm{ac}} = 2,93\text{ THz}$) le frecce compaiono solo sull’atomo pesante $M$ (`α = 0 (m ferma), oscilla solo M`); su `B (π/a)` ($\nu_{\min}^{\mathrm{ott}} = 3,64\text{ THz}$) oscilla solo $m$ (`M ferma, oscilla solo m`). Portando manualmente `M = 20 u < m = 40 u`, il pannello aggiorna correttamente lo scambio di ruolo con nota esplicita.
- **Misconcetto $v_g < 0$**: cliccando a metà ramo ottico ($k = 0,43\,\pi/a$) si legge $v_p = +11,68\text{ km/s}$ e $v_g = -1,28\text{ km/s}$ con spiegazione chiara sull’inviluppo che arretra rispetto alla fase.
- **Strumenti e preset**: `Luce infrarossa` mostra le rette gialle a $k \approx 0$ e il dipolo $\mathbf{p}(t)$ nella cella; `Confronto M = m` su `Limite M = m (gap chiuso)` fa convergere $C=B$ a $3,24\text{ THz}$ sovrapponendosi alla curva monatomica di passo $a/2$ ripiegata; `Matrice D(k)` mostra matrice $2\times 2$, autovalori e autovettori.

### Le due cose che hanno aiutato di più a capire
1. Il marcatore visivo del **centro di massa $R_{\mathrm{cm}}$** nella cella insieme ai pulsanti rapidi **Ott. 0 / C ($\pi/a$) / B ($\pi/a$)**: vedere $R_{\mathrm{cm}}$ immobile in `Ott. 0` e poi vedere fermarsi alternativamente $m$ in $C$ e $M$ in $B$ rende trasparente la differenza fisica tra i due rami.
2. Il **Confronto $M = m$** combinato col preset **Limite M = m**: mostra a colpo d’occhio che il ramo ottico non è qualcosa di estraneo alla catena monatomica, ma il secondo ramo generato dal raddoppio della cella primitiva e dal ripiegamento di zona.

---

## 3. Rami 3D, polarizzazioni e cristalli reali (`phonon-3d`)

### Spiegazione del concetto (5 righe)
In tre dimensioni ogni atomo ha 3 gradi di libertà, quindi una base di $p$ atomi per cella primitiva genera $3p$ rami fononici: sempre 3 rami acustici (1 LA + 2 TA, traslazione rigida a $\Gamma$) e $3p-3$ rami ottici ($(p-1)$ LO + $2(p-1)$ TO lungo direzioni ad alta simmetria), con polarizzazione $\boldsymbol{\varepsilon}^s(\mathbf{k})$ longitudinale ($\parallel \mathbf{k}$) o trasversale ($\perp \mathbf{k}$), e mista lungo direzioni generiche come $X\text{–}K$. La simmetria cubica rende degeneri i due modi trasversali lungo $[100]$ ($\Gamma\text{–}X$, asse $C_4$) e $[111]$ ($\Gamma\text{–}L$, asse $C_3$), mentre lungo $[110]$ ($K\text{–}\Gamma$, asse binario $C_2$) la degenerazione si rimuove separando $\mathrm{TA}_1$ e $\mathrm{TA}_2$. Nei cristalli reali con base polare (come PbTe, $p=2$) le cariche oscillanti generano un campo elettrico longitudinale che alza $\mathrm{LO}(\Gamma)$ sopra $\mathrm{TO}_{1,2}(\Gamma)$, diversamente dal diamante non polare ($p=2$, $\mathrm{LO}=\mathrm{TO}$ a $\Gamma$) e dall’alluminio ($p=1$, solo acustici). Con condizioni periodiche di Born–von Kármán su un cubo di lato $L=Na$, ciascuno degli $N_c = V/v_c$ punti $\mathbf{k}$ distinti nella prima zona porta $3p$ modi, per un totale di $3pN_c$ modi. Poiché il reticolo fcc contiene $4$ celle primitive nella cella convenzionale cubica $a^3$, il volume della cella primitiva è $v_c = a^3/4$ e in $L=Na$ cadono $N_c = 4N^3$ celle primitive.

### Verifica guidata, controlli e misconcetti
- **Guida alla sezione**: ottima sintesi operativa per orientarsi subito tra i tre cristalli di Tab. 1 (`Alluminio`, `Diamante`, `PbTe`), i due slider (`C_T/C_L`, `ω_LO/ω_TO`), i 7 pulsanti rapidi di polarizzazione e lo strumento `Conteggio modi 3D (1BZ)`; *Dettagli formali* corregge in modo molto chiaro anche il falso mito «1 LO + (3p−4) TO» e i 3 errori sul conteggio di Born–von Kármán.
- **Collegamenti vivi**: 43 nodi `data-q` su 7 chiavi (`k`, `M`, `C`, `omega`, `u`, `omegaOpt`, `a`); verificato direttamente che passando il mouse su `C_T/C_L` e `ω_LO/ω_TO` (sia sugli slider sia nella guida e in *Formula viva*) l’evidenziazione si attiva correttamente.
- **Misconcetto polarizzazioni**: testati tutti e 7 i tasti rapidi su PbTe: `Γ–X: LA` e `Γ–X: LO` mostrano carattere longitudinale `100%` (in fase vs controfase tra i due atomi); `Γ–X: TA (2×)` e `Γ–X: TO (2×)` mostrano `0%` con $\boldsymbol{\varepsilon}^s \perp \mathbf{k}$; `X–K: misto` mostra `44%` con nota che le etichette LA/TA/LO/TO sono solo approssimate.
- **Misconcetto degenerazioni**: lungo $\Gamma\text{–}X$ e $\Gamma\text{–}L$ le curve trasversali coincidono e il pannello spiega l’asse $C_4$ / $C_3$; cliccando `K–Γ: TA₁` (fuori piano, $0,43\text{ THz}$) e `K–Γ: TA₂` (nel piano, $0,56\text{ THz}$) la separazione su $[110]$ ($C_2$) è visibile sia nei vettori 3D sia nelle curve distinte del grafico.
- **Misconcetto $3pN_c$ e $v_c = a^3/4$**: attivando `Conteggio modi 3D (1BZ)` appaiono affiancati la griglia 2D di Fig. 17 (pallini gialli pieni vs cerchi vuoti `vuoti: copie per G` su $+\pi/a$) e il confronto geometrico tra cubo $a^3$ e romboedro primitivo fcc (`4 celle primitive nel cubo a³`, $v_c = a^3/4$, `fcc: Nc = 4N³ = 2048` vs `sc: N³ = 512`, `3p·Nc = 12.288 modi` per $N=8$, aggiornati istantaneamente variando lo stepper `N`).

### Le due cose che hanno aiutato di più a capire
1. La coppia di pulsanti **`K–Γ: TA₁` e `K–Γ: TA₂`** confrontata con **`Γ–X: TA (2×)`**: vedere la polarizzazione prima ruotare equivalentemente su $[100]$ e poi distinguersi tra vibrazione *fuori piano* e *nel piano* su $[110]$ rende subito fisica (e non solo algebrica) la rimozione della degenerazione.
2. Lo strumento **`Conteggio modi 3D (1BZ)`**: i cerchi vuoti sui bordi $+\pi/a$ insieme al disegno del romboedro primitivo inscritto nel cubo $a^3$ chiariscono in pochi secondi perché si conta $N$ (non $N+1$) per asse e perché in fcc $N_c = 4N^3$.

---

## 4. Pacchetti d’onda: fase e gruppo (`phonon-wavepacket`)

### Spiegazione del concetto (5 righe)
Un pacchetto d’onda $\Psi(x,t)$ nasce dalla sovrapposizione di onde piane centrate attorno a $k_0$ con spettro $\Phi(k)$ di larghezza $\Delta k = 1/(2\sigma_0)$: più il pacchetto è stretto nello spazio ($\sigma_0$ piccolo), più lo spettro in $k$ è largo ($\sigma_0\,\Delta k = 1/2$). Le creste interne della portante corrono alla velocità di fase $v_p = \omega_0/k_0$ (pendenza della corda dall’origine sul grafico $\nu(k)$), mentre l’inviluppo che trasporta l’energia viaggia alla velocità di gruppo $v_g = \mathrm{d}\omega/\mathrm{d}k$ (pendenza della tangente). Nei mezzi dispersivi $v_p$ e $v_g$ differiscono e possono perfino avere segni opposti: sul ramo ottico per $k_0 > 0$ le creste avanzano ($v_p > 0$) mentre l’inviluppo arretra ($v_g < 0$). Quando la curva ha curvatura $\omega''(k_0) \neq 0$, componenti spettrali vicine viaggiano a velocità diverse e il pacchetto si allarga nel tempo ($\sigma(t)$ cresce mentre il picco scende). Al bordo di zona $k_0 = \pi/a$ il centro resta fermo ($v_g = 0$), ma gli atomi campionati oscillano in controfase ($\lambda = 2a$) e il pacchetto si allarga comunque perché $\omega''(\pi/a) \neq 0$.

### Verifica guidata, controlli e misconcetti
- **Guida alla sezione**: *L’idea* associa immediatamente colori dei pallini nella scena e significato geometrico (corda vs tangente); *Come intervengono i parametri* spiega i 4 regimi, gli slider $k_0, \sigma_0$ e i due strumenti superiori (`Riferimento comovente`, `Profilo iniziale t = 0`); *Cosa provare* guida i tre esperimenti essenziali.
- **Collegamenti vivi**: 68 nodi `data-q` su 7 chiavi (`psi`, `k`, `Ek`, `u`, `v`, `vp`, `a`); verificato che l’hover su `k` accende tutte le formule e lo slider `k₀` (`σ₀` è collegato alla chiave `u` dell’inviluppo).
- **Misconcetto $v_p$ vs $v_g$**: chiarissimo grazie al doppio tracciamento in scena (pallino viola `v_p` su una cresta vs pallino verde acqua `v_g` sul massimo dell’inviluppo) e a corda viola + tangente ciano sul grafico $\nu(k)$, oltre al confronto con `Particella libera ω ∝ k²` dove spariscono i pallini atomici (`Mezzo continuo`) e risulta $v_g = 2v_p$.
- **Misconcetto $v_g < 0$**: nello scenario `Ramo ottico a pendenza negativa` ($k_0 = 0,50\,\pi/a$), $v_p = +9,79\text{ km/s}$ e $v_g = -1,47\text{ km/s}$; attivando `Riferimento comovente (ξ = x - v_g t)` l’inviluppo rimane fermo al centro e si vedono chiaramente le creste attraversarlo nel verso opposto.
- **Misconcetto bordo zona $k_0=\pi/a$ con $\omega'' \neq 0$**: su `Bordo di zona k₀ = π/a` con `Profilo iniziale t = 0` attivo ($v_g = 0,00\text{ km/s}$, $v_p = 2,20\text{ km/s}$, $\omega'' = -0,43\cdot 10^{-6}\text{ m}^2/\text{s}$), portando il tempo a $t = 1,20\text{ ps}$ l’inviluppo verde resta centrato in $x=0$, si abbassa sotto il profilo tratteggiato $t=0$ e il grafico a destra mostra `σ(t)/σ₀` salire a `1,10×`, mentre gli atomi campionati oscillano in controfase. Al contrario, in `Regime lineare` compare esplicitamente `ω'' = 0 → nessuno spreading (σ(t) = σ₀)`.

### Le due cose che hanno aiutato di più a capire
1. Il **Riferimento comovente ($\xi = x - v_g t$)** combinato con **`Profilo iniziale t = 0`**: sul ramo ottico mostra le creste attraversare un inviluppo fermo, mentre al bordo di zona mostra l’allargamento puro senza traslazione del baricentro.
2. Il mini-grafico **`σ(t)/σ₀`** affiancato allo spettro $|\Phi(k)|^2$: ridurre $\sigma_0$ al minimo (`1,5 a`) e vedere in diretta allargarsi la campana in $k$ e impennarsi la curva di spreading collega subito indeterminazione di Fourier e dispersione temporale.

---

## Problemi trovati (in ordine di gravità)

### Bloccante
Nessuno.

### Importante
Nessuno.

### Minore
1. **Punteggiatura orfana a capo dopo formule KaTeX inline (`phonon-monatomic`, `phonon-diatomic`)**
   - **Dove**:
     - `phonon-monatomic`: *Guida alla sezione → L’idea* (`src/renderer/src/sections/phonon-monatomic/strings.ts`, riga 110, punto finale dopo `$\htmlData{q=k}{k}$.`).
     - `phonon-diatomic`: *Guida alla sezione → Cosa provare* (`src/renderer/src/sections/phonon-diatomic/strings.ts`, riga 144, virgola dopo `$\mathbf{p}(t)$,`).
   - **Cosa è successo**: a risoluzione `1440×900`, il segno di interpunzione immediatamente successivo al blocco KaTeX inline va a capo da solo all’inizio della riga seguente.
   - **Cosa avrebbe aiutato**: mantenere il segno di punteggiatura solidale al simbolo precedente (o evitarne lo spezzamento in `<RichText>`).

2. **Evidenziazione visiva parziale della frazione `C_T/C_L` in KaTeX (`phonon-3d`)**
   - **Dove**: `phonon-3d`, *Guida alla sezione → Come intervengono i parametri* (`src/renderer/src/sections/phonon-3d/strings.ts`, riga 146, `$\htmlData{q=C}{C_T/C_L}$`).
   - **Cosa è successo**: l’hover sull’intero termine accende correttamente lo slider `C_T / C_L` e `\Phi_{\alpha i,\beta j}` in *Formula viva*, ma nel DOM KaTeX `<span class="enclosing" data-q="C">` evidenzia visivamente solo `C_T` lasciando fuori `/C_L`.
   - **Cosa avrebbe aiutato**: che l’intero rapporto `C_T/C_L` si illuminasse uniformemente al passaggio del cursore.

3. **Proiezione 3D fissa non ruotabile col mouse (`phonon-3d`)**
   - **Dove**: `phonon-3d`, riquadro superiore *Spazio reale 3D — piani atomici e polarizzazione $\varepsilon^s(\mathbf{k})$* (`src/renderer/src/sections/phonon-3d/Polarization3DView.tsx`).
   - **Cosa è successo**: trascinando il cursore sopra la vista 3D l’angolo di osservazione non cambia (è una proiezione isometrica fissa), e non c’è un breve cenno visivo che lo segnali; lungo direzioni oblique o per distinguere modi nel piano vs fuori piano viene naturale provare a ruotare la vista.
   - **Cosa avrebbe aiutato**: o una rotazione orbitale leggera al trascinamento, oppure una breve nota/orientamento degli assi che chiarisca che la vista isometrica è fissa.

4. **Controlli da tastiera sui grafici attivi solo dopo click di focus (tutte e 4 le sezioni)**
   - **Dove**: `DispersionPlot` in tutte e 4 le sezioni (suggerimento `←/→ muove k`, `↑/↓ cambia ramo`).
   - **Cosa è successo**: premendo `←`/`→` subito dopo aver aperto la sezione o dopo aver interagito con la sidebar/controlli, $k$ non si sposta finché non si clicca prima sul grafico per dargli focus.
   - **Cosa avrebbe aiutato**: una formulazione leggermente più esplicita nell’hint (o il mantenimento del focus dopo il click sui pulsanti rapidi del grafico).

5. **Nota informativa su stato capitolo in Home vs Sidebar**
   - **Dove**: Home card *Fononi* (`6 sezioni`) rispetto alla sidebar delle sezioni interne (`Capitoli attivi: ... Fononi (4/6)`).
   - **Cosa è successo**: in questa fase le ultime 2 sezioni (*Modi quantizzati e Umklapp*, *Calore specifico e Debye*) sono visibili ma giustamente non ancora cliccabili (`4/6` attive). Nessun malfunzionamento: solo segnalazione di contesto per la coerenza della prova.

---

## Verdetto

**approvata** — Tutte e 4 le sezioni aggiornate (`phonon-monatomic`, `phonon-diatomic`, `phonon-3d`, `phonon-wavepacket`) risultano didatticamente chiare, coerenti con la nuova *Guida alla sezione*, dotate di collegamenti vivi funzionanti e molto efficaci nello smontare i misconcetti tipici di uno studente del 3° anno. I rilievi riscontrati sono esclusivamente rifiniture minori.
