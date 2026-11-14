# Revisione C — Lo studente

**Ruolo**: revisore (`studente`)  
**App verificata**: build di produzione in `out/renderer`, servita localmente su `http://127.0.0.1:5174/` a risoluzione desktop `1440×900`.

---

## 1. Cosa ho fatto

Ho aperto l'app nel browser a finestra `1440×900` senza leggere né il codice sorgente né le dispense prima o durante la prova, mettendo alla prova l'interfaccia esclusivamente dal punto di vista di uno studente del terzo anno di fisica/ingegneria.

Ho esplorato tutte e sei le sezioni del capitolo **Teoria delle bande** nell'ordine esatto della barra laterale:
1. **Reticolo vuoto e schemi di zona**
2. **Kronig–Penney**
3. **Elettroni quasi liberi**
4. **Legami forti**
5. **Metodo k·p**
6. **Pseudopotenziale**

Per ciascuna sezione ho osservato prima la schermata iniziale senza toccare i comandi né leggere la scheda teoria, poi ho provato ogni slider, variante, menu preset, pulsante di azione, hover sui termini della `Formula viva`, clic e trascinamento sui grafici, frecce direzionali da tastiera e tutti gli strumenti superiori (`Riempimento`, `Massa efficace`, `Confronto` e `Banda a coseno`), ispezionando le schermate risultanti.

---

## 2. Cosa ho verificato davvero

- **Avvio del server di anteprima**:
  - Comando eseguito: `export PATH="$PWD/.tools/node/bin:$PATH" && npx vite preview --outDir out/renderer --port 5174 --host 127.0.0.1 --strictPort`
  - Risultato: server avviato su `http://127.0.0.1:5174/`, pagina `Stato Solido` caricata con status HTTP 200 e zero errori di runtime/console segnalati; processo terminato a fine verifica.
- **Verifica interattiva e visiva su tutte le 6 sezioni** (`1440×900`):
  - Catturati e ispezionati visivamente 12 screenshot nelle diverse modalità e stati delle 6 sezioni, verificando valori numerici, curve, legende, etichette e reattività di controlli, hover e tastiera.

---

## 3. Cosa non ho potuto verificare

- **Codice sorgente e dispense (`src/`, `materiale/`)**: non letti per vincolo esplicito dell'incarico («Non leggere il codice né le dispense prima di aver usato l'app: devi sapere solo ciò che sa lo studente»). Per questo motivo i riferimenti nei problemi indicano sezione, pannello, comando e valori osservati nell'interfaccia anziché file e riga di codice.
- **Finestra Electron nativa**, schermi di larghezza diversa da `1440×900` (es. portatili piccoli o schermi stretti) e velocità/fluidità su hardware diverso dalla sessione corrente.
- **Comportamento con `prefers-reduced-motion` attivo**.

---

## 4. Osservazione preliminare all'apertura dell'app

Aprendo `http://127.0.0.1:5174/`, l'app non mostra una schermata iniziale né la prima sezione del corso (*Reticolo vuoto e schemi di zona*), ma si apre direttamente su **Elettroni quasi liberi**, e in basso nella barra laterale sinistra è ancora presente la nota:
> *«Prima versione: è attiva la sezione Elettroni quasi liberi.»*

In realtà tutte e sei le sezioni nella barra laterale sono già attive e funzionanti. Questa nota e la sezione di avvio fanno credere allo studente al primo accesso che le altre cinque sezioni non siano ancora utilizzabili o siano incomplete.

---

## 5. Analisi sezione per sezione

### Sezione 1 — Reticolo vuoto e schemi di zona

#### Primo minuto e lessico
Dalla prima schermata (`Zona estesa`, `a = 3,00 Å`) capisco subito che sto guardando una parabola libera e un'onda nello spazio reale sopra gli ioni. Tuttavia, senza leggere la scheda teoria:
- non capisco perché in `SPAZIO REALE` la scritta in alto dica `|ψ|² = 1 uniforme` (mostrando una retta tratteggiata piatta) mentre sotto è disegnata un'onda oscillante viola `Re ψ` con pallini gialli sugli ioni;
- non capisco che cosa rappresenti il cerchietto vuoto ciano in `k = -0,50 π/a` collegato da `+G` al punto scelto in `k = 1,50 π/a`;
- in `FORMULA VIVA`, il simbolo **`k`** cambia significato tra una riga e l'altra: nella prima equazione $E = \hbar^2(k+G)^2/2m_0$ indica il vettore ridotto, nella terza $E(k+G)=E(k)$ con $-\pi/a < k \le \pi/a$ ancora il ridotto, ma nella quarta riga $k = k' + G$ indica quello esteso (`k (esteso) = 1,50 π/a`, `k' (ridotto) = −0,50 π/a`).

#### Spiegazione in cinque righe
In un cristallo periodico di passo $a$, due vettori d'onda che differiscono di un vettore del reticolo reciproco $G = 2\pi n/a$ producono esattamente gli stessi valori dell'onda sui siti degli ioni, quindi rappresentano lo stesso stato fisico. Per questo motivo possiamo disegnare la parabola dell'elettrone libero $E = \hbar^2 k^2/2m_0$ su tutto l'asse $k$ (zona estesa), oppure ripiegarla tutta dentro la prima zona $(-\pi/a, \pi/a]$ traslando ciascun tratto di $-G$ (zona ridotta), o ancora ripetere la prima zona ogni $2\pi/a$ (zona periodica). Cambiando ramo $n$ a parità di $k'$, l'onda nello spazio reale oscilla più rapidamente ma passa per gli stessi identici valori sui punti degli ioni. Finché il potenziale è nullo ($V = 0$) non ci sono gap, la massa efficace vale sempre $m_0$ e il sistema è sempre un metallo. I punti in cui i rami ripiegati si incrociano al bordo ($\pm\pi/a$) e al centro ($k = 0$) sono però i punti in cui un potenziale periodico aprirà i gap energetici.

#### Problemi (in ordine di gravità)
1. **Bloccante — Profilo dell'onda `Re ψ` fisicamente incoerente tra il 2° e il 3° ione in `SPAZIO REALE`**:
   - **Dove**: `Reticolo vuoto e schemi di zona` → pannello `SPAZIO REALE` (verificato allo stato iniziale `k = 1,50 π/a`, `n = +1`, `a = 3,00 Å`, e anche a `k = -3,50 π/a`, `n = -2`).
   - **Cosa succede**: Con `k = 1,50 π/a` (`λ = 4a/3`) e `a = 3,00 Å`, partendo dal 3° ione al centro (`x = 0`, pallino giallo a `+1`) verso destra la curva e i campionamenti gialli sugli ioni seguono correttamente `cos(1,5 π x/a)`: `0` al 4° ione (`x = a`), `-1` al 5° (`x = 2a`), `0` al 6° (`x = 3a`). A sinistra del centro, invece, tra il 2° e il 3° ione l'onda compie un solo mezzo periodo largo un intero passo `a` arrivando a `-1` sul 2° ione (`x = -a`, dove `cos(-1,5 π)` dovrebbe valere `0`!) e `0` sul 1° ione. Lo stesso difetto si ripete a `k = -3,50 π/a`: tra 2° e 3° ione compaiono `1,50` periodi invece di `1,75` come in tutti gli altri intervalli `a`.
   - **Cosa mi avrebbe aiutato**: Una curva `Re ψ(x)` rigorosamente periodica con passo d'onda costante su tutto l'asse `x`, con i campionamenti gialli coerenti con `Re(e^{ikx})` sia per `x < 0` che per `x ≥ 0`.
2. **Importante — Ambiguità fra `k` e `k'` in `FORMULA VIVA`**:
   - **Dove**: `Reticolo vuoto e schemi di zona` → pannello `FORMULA VIVA`.
   - **Cosa succede**: La formula in alto usa `k` dove in realtà si somma `k' + G` (vettore ridotto + `G`), e due righe più sotto definisce `k = k' + G` invertendo il ruolo di `k` (esteso) e `k'` (ridotto).
   - **Cosa mi avrebbe aiutato**: Usare sistematicamente `k'` per il vettore ridotto in `E = ħ²(k' + G)²/2m₀` e `-\pi/a < k' ≤ \pi/a`, oppure spiegare esplicitamente la convenzione nella prima riga.
3. **Importante — `Confronto: quasi liberi` rende quasi invisibili i gap annunciati dalla teoria**:
   - **Dove**: `Reticolo vuoto e schemi di zona` → strumento `Confronto: quasi liberi` su `DIAGRAMMA E(K)`.
   - **Cosa succede**: La scheda teoria invita ad attivare `Confronto` per «vedere i gap aprirsi agli incroci» a `±π/a` (`E₀`, `9E₀`) e in `k = 0` (`4E₀`). Con `V_G = -0,5 eV` su una scala verticale da `0` a `45 eV`, il primo gap (`1 eV`) è alto pochi pixel e l'incrocio in `k = 0` (dove `V_2G = 0`) appare visivamente chiuso.
   - **Cosa mi avrebbe aiutato**: Mostrare il confronto con un potenziale `V_G` più marcato (o regolabile) e includere un piccolo `V_2G ≠ 0`, così da rendere ben visibile l'apertura del gap anche in `k = 0` e a `9E₀`.
4. **Minore — Stato fuori scala verticale senza indicazione**:
   - **Dove**: `Reticolo vuoto e schemi di zona` → `DIAGRAMMA E(K)` premendo `↑` fino al ramo `n = -2` (`E = 51,18 eV`).
   - **Cosa succede**: Il marcatore dello stato scelto supera il tetto dell'asse `E` (`45 eV`) e sparisce dalla vista senza alcun indicatore.
   - **Cosa mi avrebbe aiutato**: Adattare il massimo dell'asse `E` o mostrare una freccia di fuori scala.
5. **Minore — Attriti grafici e testuali minori**:
   - **Dove**: `DIAGRAMMA E(K)` in `Zona ridotta` e `FORMULA VIVA` con `Riempimento`.
   - **Cosa succede**: Il titolo del grafico diventa `DIAGRAMMA E(K)` (maiuscola forzata su `k`); in `Zona ridotta` i badge `n=+1` e `n=-1` quasi si toccano vicino all'incrocio centrale; con `Riempimento` attivo compare testo duplicato (`livello di Fermi = 4,18 eV · metallo (2 el./cella) per 2 elettroni/cella (metallo senza gap)`); il bottone `Confronto: quasi liberi` usa il pallino corallo qui mentre altrove il confronto usa il grigio/bianco.
   - **Cosa mi avrebbe aiutato**: Rispettare `E(k)` minuscolo nei titoli, distanziare leggermente le etichette dei rami e snellire la riga di `Riempimento`.

#### Le due cose più utili
1. **Le frecce `↑ / ↓` sul grafico**: permettono di saltare tra i rami `n` mantenendo fisso `k'` e fanno vedere subito che `Re ψ` oscilla molto più rapidamente restando però identica sugli ioni.
2. **Il passaggio diretto tra `Zona estesa`, `Zona ridotta` e `Zona periodica`** con il cerchio fantasma collegato dalla freccia `±G`.

#### Verdetto
**da correggere**

---

### Sezione 2 — Kronig–Penney

#### Primo minuto e lessico
Al primo sguardo capisco benissimo cosa sto osservando: a sinistra c'è la curva oscillante e una fascia verticale ombreggiata fra `-1` e `+1`, a destra le bande di energia allineate alle stesse fasce orizzontali; sopra ci sono il potenziale `V(x)` e la probabilità `|ψ|²`.
Tuttavia noto subito simboli non uniformati o non definiti:
- nella modalità iniziale **`A delta`**, l'asse orizzontale sinistro è etichettato **`f(αa)`**, il sottotitolo lo chiama **`curva L`**, e la Formula Viva scrive **`L_δ(E)`** e **`L = 0,156`**;
- sempre in `A delta`, compare `P = m₀ a² V₀ / ħ²` e nei readout `aV₀ = 5,08 eV·Å · V₀ = 1,69 eV`, senza spiegare come una barriera a delta di Dirac (di larghezza zero) possieda un'altezza `V₀` in eV;
- in **`Barriere rettangolari`**, nei readout compare **`P_eff = 7,22`** (a `c = 1,00 Å`) o **`22,97`** (a `c = 2,50 Å`), mai definito nelle formule;
- con **`Banda a coseno`** attivo, compare il doppio segno `E(k) ≈ Ē ∓ 2t cos ka` senza indicare quando vale `-` e quando `+`.

#### Spiegazione in cinque righe
Nel modello di Kronig–Penney l'elettrone si muove in un reticolo periodico di buche separate da barriere (a delta oppure rettangolari di larghezza $c$ e altezza $V_0$). Imponendo le condizioni di continuità e di Bloch si ottiene l'equazione trascendente $\cos(ka) = L(E)$: poiché per stati reali vale $|\cos(ka)| \le 1$, sono permesse solo le fasce di energia in cui $|L(E)| \le 1$, mentre dove $|L(E)| > 1$ si aprono i gap proibiti. Quando $P \to 0$ i gap si chiudono e si ritrova la parabola del reticolo vuoto; quando le barriere diventano alte o spesse l'effetto tunnel si riduce, ogni banda si stringe attorno a un livello discreto «genitore» della singola buca finita e assume la forma a coseno $\bar{E} \mp 2t\cos ka$ tipica dei legami forti.

#### Problemi (in ordine di gravità)
1. **Importante — Tre nomi diversi per la stessa funzione nella variante `A delta` (`f(αa)`, `L_δ(E)`, `curva L`)**:
   - **Dove**: `Kronig–Penney` (modalità `A delta`) → asse X del grafico sinistro (`f(αa)`), intestazione (`o sulla curva L`), `FORMULA VIVA` (`L_δ(E)` e `L = ...`).
   - **Cosa succede**: In `A delta` l'asse usa `f(αa)` mentre il resto usa `L`; passando a `Barriere rettangolari` l'asse cambia in `L(E)`. Uno studente al primo approccio può pensare che `f(αa)` e `L(E)` siano funzioni diverse.
   - **Cosa mi avrebbe aiutato**: Usare `L_δ(E)` o `L(E)` in modo coerente su asse, istruzione e Formula Viva.
2. **Importante — Simboli `V₀` (nella delta) e `P_eff` (nelle barriere rettangolari) non definiti nelle formule**:
   - **Dove**: `Kronig–Penney` → `FORMULA VIVA` (readout `aV₀ = 5,08 eV·Å · V₀ = 1,69 eV` in `A delta`; `P_eff = 7,22` in `Barriere rettangolari`) e `SPAZIO REALE` (`aV₀ = 5,1 eV·Å`).
   - **Cosa succede**: Nella delta di Dirac l'area del potenziale è `aV₀` (`V₀` è un potenziale medio equivalente su una cella `a`), e in `Barriere rettangolari` `P_eff` è l'opacità equivalente `m₀ a V₀ c / ħ²`, ma nessuna delle due definizioni è scritta nell'interfaccia. Inoltre il doppio segno `∓` in `E(k) ≈ Ē ∓ 2t cos ka` non esplicita quale segno corrisponda alla banda selezionata.
   - **Cosa mi avrebbe aiutato**: Aggiungere nella Formula Viva la definizione esplicita di `V₀` (potenziale medio equivalente), di `P_eff` e il segno effettivo della banda attiva nella lettura di `Banda a coseno`.
3. **Minore — Gap superiore `E_g3` parzialmente fuori scala e basso contrasto in `Banda a coseno`**:
   - **Dove**: `Kronig–Penney` → modalità `Barriere rettangolari`, `DIAGRAMMA E(K)`.
   - **Cosa succede**: La barra rossa superiore di `E_g3` esce leggermente oltre il tetto `14 eV` dell'asse verticale; inoltre, quando si attiva `Banda a coseno` con `c = 2,50 Å`, la curva tratteggiata azzurra della banda a coseno ha un colore molto vicino al verde della banda esatta. Infine, la barra dei controlli inferiori va su due righe.
   - **Cosa mi avrebbe aiutato**: Adattare il margine superiore dell'asse `E` per contenere `E_g3` e usare un colore più contrastante (es. bianco o arancione) per la curva `banda a coseno`.

#### Le due cose più utili
1. **Il grafico sincronizzato `L(E)` ↔ `E(k)`**: poter cliccare e trascinare direttamente sulla curva `L(E)` vedendo la fascia `[-1, +1]` proiettarsi nelle bande verdi rende immediatamente evidente l'origine matematica di bande e gap.
2. **La variante `Barriere rettangolari` con i livelli genitori `E₁, E₂, E₃` e lo strumento `Banda a coseno`**: allargando `c` da `1,00 Å` a `2,50 Å` si osserva la banda stringersi sul livello della buca isolata fino a sovrapporsi alla curva a coseno (`W = 4t`).

#### Verdetto
**da correggere**

---

### Sezione 3 — Elettroni quasi liberi

#### Primo minuto e lessico
Anche senza leggere la scheda teoria, la sezione è subito leggibile: `|ψ|²` in viola sopra `V(x)` in rosso-arancio con gli ioni grigi chiarisce immediatamente il significato fisico della distribuzione di carica, e la quota `2|V_G|` al bordo `π/a` lega subito l'ampiezza del potenziale all'ampiezza del gap.
Due termini/numeri però risultano poco chiari senza spiegazione:
- nella `FORMULA VIVA` leggo `gap in ±π/a: 2|V_G| = 1,00 eV · calcolato 1,00 eV` e `gap in k = 0: 2|V_2G| = 0,00 eV · calcolato 0,03 eV` (e mettendo `V_2G = -0,80 eV` leggo `2|V_G| = 1,00 eV · calcolato 1,05 eV`): non viene spiegato cosa sia quel numero **`calcolato`** rispetto a `2|V_G|` (cioè la differenza tra la formula analitica a 2 onde piane e il calcolo completo su molte onde piane);
- con `Riempimento` attivo a `4 elettroni/cella` e `V_2G = 0,00 eV`, il readout segnala **`isolante (4 el./cella)`** a `E_F = 16,72 eV`, pur non vedendosi alcun gap aperto in `k = 0` sul grafico.

#### Spiegazione in cinque righe
Quando il potenziale periodico $V(x)$ è debole, lontano dai bordi della zona di Brillouin l'elettrone segue quasi esattamente la parabola libera $E_k = \hbar^2 k^2 / 2m_0$. In prossimità del bordo $k = \pm\pi/a$, però, l'onda incidente $e^{ikx}$ e l'onda riflessa $e^{i(k-G)x}$ hanno la stessa energia cinetica $E_0 = \hbar^2\pi^2 / 2m_0 a^2$, quindi il potenziale le mescola formando due onde stazionarie: $\psi_c \propto \cos(\pi x/a)$ (carica sugli ioni) e $\psi_s \propto \sin(\pi x/a)$ (carica fra gli ioni). A causa della diversa energia potenziale media, in $\pm\pi/a$ si apre un gap $E_g \simeq 2|V_G|$ con bande a tangente orizzontale e massa efficace piccola (positiva sopra, negativa sotto); cambiando il segno di $V_G$ (da ioni attrattivi a repulsivi), le due onde stazionarie si scambiano fra banda inferiore e superiore. La seconda componente $V_{2G}$ apre analogamente il secondo gap $2|V_{2G}|$ a centro zona $k = 0$.

#### Problemi (in ordine di gravità)
1. **Importante — Dicitura `calcolato` e stato `isolante (4 el./cella)` a `V_2G = 0` non giustificati all'utente**:
   - **Dove**: `Elettroni quasi liberi` → `FORMULA VIVA` (righe `gap in ±π/a` e `gap in k = 0`) e strumento `Riempimento` a `4 el./cella` con `V_2G = 0,00 eV`.
   - **Cosa succede**: Lo studente vede due numeri diversi nella stessa riga (`2|V_G| = 1,00 eV · calcolato 1,05 eV` quando `V_2G = -0,80 eV`; `2|V_2G| = 0,00 eV · calcolato 0,03 eV` quando `V_2G = 0,00 eV`) senza che l'app spieghi che le bande disegnate usano molte onde piane (producendo anche un mini-gap del 2° ordine di `0,03 eV` a `k = 0` che fa scattare l'etichetta `isolante` a `4 el./cella` anche a `V_2G = 0`).
   - **Cosa mi avrebbe aiutato**: Etichettare chiaramente `formula 2 onde` vs `esatto (N onde)` in Formula Viva e segnalare in `Riempimento` quando il gap è un effetto del 2° ordine invisibile alla scala del grafico (`~0,03 eV`).
2. **Importante — Assenza dei pesi `c_G` delle onde piane**:
   - **Dove**: `Elettroni quasi liberi` → schermata principale / `FORMULA VIVA`.
   - **Cosa succede**: Lontano dal bordo di zona non c'è alcun indicatore o grafico che mostri come cambiano i pesi `|c_G|²` delle onde piane componenti mano a mano che ci si avvicina a `±π/a` (dove le due onde diventano 50% e 50%).
   - **Cosa mi avrebbe aiutato**: Un piccolo istogramma o barra dei pesi `|c_0|², |c_{-G}|², |c_{+G}|²` per lo stato scelto, come quello presente in `Pseudopotenziale`.
3. **Minore — Il menu `Materiale` non azzera `V_2G` e la nota nella sidebar è obsoleta**:
   - **Dove**: `Elettroni quasi liberi` → menu `Materiale` dopo aver modificato `V_2G`, e piede della sidebar sinistra.
   - **Cosa succede**: Se imposto `V_2G = -0,80 eV` e poi seleziono un preset come `Silicio`, `V_2G` conserva il valore precedente `-0,80 eV` invece di tornare a `0,00 eV`; inoltre nella sidebar permane la scritta `Prima versione: è attiva la sezione Elettroni quasi liberi.`.
   - **Cosa mi avrebbe aiutato**: Far sì che i preset 1D impostino esplicitamente anche `V_2G = 0,00 eV`, e aggiornare la nota nella sidebar.

#### Le due cose più utili
1. **L'accoppiamento immediato tra `DIAGRAMMA E(K)` e `SPAZIO REALE` al bordo `π/a` insieme allo slider `V_G` con segno**: cliccare tra banda 1 e banda 2 e trascinare `V_G` da `-0,50` attraverso `0` fino a `+0,50 eV` mostra dal vivo il passaggio di carica da sugli ioni (`ψ_c`) a fra gli ioni (`ψ_s`) e il loro scambio di energia.
2. **Lo strumento `Massa efficace` al bordo di zona** (`m*/m₀ = 0,0564` vs `-0,0636`), che rende tangibile l'opposizione di curvatura e il fatto che `m*` diventa molto piccola quando il gap è stretto.

#### Verdetto
**da correggere**

---

### Sezione 4 — Legami forti

#### Primo minuto e lessico
Al primo sguardo i lobi degli orbitali sugli atomi e le due bande a coseno opposte (`s` con minimo al centro, `p` con minimo al bordo) comunicano subito l'idea chimica di stato `legante` e `antilegante`.
Alcuni elementi però non vengono introdotti prima di apparire nei readout:
- passando a **`Biatomica A–B`**, nello `SPAZIO REALE` e in `FORMULA VIVA` compaiono `|b_A|² = 0,18 · |b_B|² = 0,82`, ma in nessuna formula compaiono i coefficienti `b_A, b_B` né la combinazione lineare $\psi_k = \sum (b_A \varphi_A + b_B \varphi_B)e^{ikna}$;
- in `Monoatomica (s, p)`, nella formula generale $E(k) = \bar{E}_n - \sum_{R \neq 0} t(R)e^{ikR}$, il vettore $R$ dei vicini non è definito esplicitamente.

#### Spiegazione in cinque righe
Nel modello a legami forti gli elettroni restano quasi localizzati attorno ai singoli atomi della catena, descritti da orbitali atomici $\varphi_n$, e la sovrapposizione $t(R)$ tra primi vicini allarga ciascun livello atomico $\bar{E}_n$ in una banda a coseno di larghezza $W = 4|t|$. Il segno di $t$ determina quale estremità della banda sia legante (energia minima) e quale antilegante (energia massima): per gli orbitali $s$ ($t_s > 0$) gli stati in fase in $k = 0$ sono leganti, mentre per gli orbitali $p_x$ lungo la catena ($t_p < 0$) è in $k = \pm\pi/a$ che i lobi affacciati hanno lo stesso segno e risultano leganti. Avvicinando gli atomi, la sovrapposizione cresce esponenzialmente e le bande possono persino sovrapporsi ($E_g < 0$), trasformando in metallo un sistema con due elettroni per atomo. In una catena biatomica alternata A–B con due livelli atomici diversi ($E_A < E_B$), l'asimmetria apre in $\pm\pi/a$ un gap pari a $E_B - E_A$, producendo un semiconduttore 1D con carica concentrata su $A$ in valenza e su $B$ in conduzione.

#### Problemi (in ordine di gravità)
1. **Bloccante — In `Biatomica A–B` sulla banda antilegante `E_+` a `k = 0`, la curva `Re ψ_k` non cambia segno tra atomi `A` e `B`**:
   - **Dove**: `Legami forti` → variante `Biatomica A–B`, pannello `SPAZIO REALE`, stato iniziale `k = 0,00 π/a · conduzione E_+ · antilegante`.
   - **Cosa succede**: La curva bianca `Re ψ_k` oscilla restando interamente positiva sopra la linea di zero (`Re ψ_k > 0` sia sui siti `B` sia sui siti `A`), senza alcun nodo né inversione di segno fra i due atomi della cella. Uno stato *antilegante* (autofunzione superiore `E_+`) deve avere segni opposti su `A` e `B` (interferenza distruttiva fra i due atomi). Mostrare `Re ψ_k` tutta dello stesso segno induce uno studente a credere che la banda `E_+` in `k = 0` sia priva di nodi fra `A` e `B`.
   - **Cosa mi avrebbe aiutato**: Disegnare `Re ψ_k` con segno opposto tra i siti `B` (`+`) e i siti `A` (`−`) sullo stato antilegante `E_+`, in coerenza con i lobi `+ / −` visti per la banda `p` nella monoatomica.
2. **Importante — Discrepanza numerica della sonda `Massa efficace` in `Biatomica A–B`**:
   - **Dove**: `Legami forti` → variante `Biatomica A–B`, strumento `Massa efficace` al bordo `k = π/a` su `E_+` e `E_-` (con `a = 3,50 Å`, `E_A = -1,50 eV`, `E_B = 1,50 eV`, `t = 0,90 eV`).
   - **Cosa succede**: `FORMULA VIVA` riporta il valore analitico esatto al gap $m^*_c/m_0 = -m^*_v/m_0 = 1,152$, mentre la sonda `Massa efficace` sullo stesso punto `k = π/a` stampa `m*/m₀ = +1,35` su `E_+` e `-1,35` su `E_-`. I due numeri sul medesimo schermo si contraddicono vistosamente (+17%).
   - **Cosa mi avrebbe aiutato**: Usare un passo più fine o la derivata analitica al bordo per la sonda di massa efficace in modo che in `k = π/a` coincida con `1,152`.
3. **Importante — `|b_A|²` e `|b_B|²` non definiti in `FORMULA VIVA` nella variante `Biatomica A–B`**:
   - **Dove**: `Legami forti` → variante `Biatomica A–B`, `SPAZIO REALE` e `FORMULA VIVA`.
   - **Cosa succede**: L'interfaccia mostra i pesi `|b_A|² = 0,18 · |b_B|² = 0,82` senza aver mai scritto lo stato $\psi_k$ in funzione di $b_A$ e $b_B$ né la loro formula.
   - **Cosa mi avrebbe aiutato**: Aggiungere nella Formula Viva la riga con lo stato di Bloch della base biatomica $\psi_k \propto \sum_n (b_A \varphi_A(x-na) + b_B \varphi_B(x-na-a/2)) e^{ikna}$.
4. **Minore — Pulsante `Avvicina gli atomi` poco intuitivo e barra comandi su 3 righe**:
   - **Dove**: `Legami forti` → barra inferiore dei controlli e `DIAGRAMMA E(K)`.
   - **Cosa succede**: Il pulsante `Avvicina gli atomi` fa pensare a un'animazione automatica, invece commuta solo il regime di calcolo (`t(a)` esponenziale) lasciando all'utente il compito di muovere lo slider `a`; inoltre i comandi occupano tre righe comprimendo i grafici, e i badge `legante`/`antilegante` al bordo sinistro coprono la linea azzurra `-π/a`.
   - **Cosa mi avrebbe aiutato**: Chiamare il toggle *«Accoppia t(a) (avvicina gli atomi)»* (o animare davvero `a` con play/pausa), compattare i controlli su due righe e spostare i badge `legante`/`antilegante` leggermente all'interno della zona.

#### Le due cose più utili
1. **I lobi `+` e `−` degli orbitali `p` in `SPAZIO REALE`**: vedere i lobi `p` allineati `+ − | + −` in `k = 0` (antilegante) e invertiti `+ − | − +` in `k = π/a` (legante) spiega la curvatura invertita della banda `p` meglio di qualsiasi pagina di testo.
2. **Il passaggio a gap negativo (`E_g < 0`) con `Riempimento` a 2 elettroni/atomo**: vedere il verdetto cambiare istantaneamente da `isolante / semicond.` a `metallo` quando le bande `s` e `p` si sovrappongono chiarisce un concetto spesso solo enunciato a lezione.

#### Verdetto
**da correggere**

---

### Sezione 5 — Metodo k·p

#### Primo minuto e lessico
Nel primo minuto vedo tre pannelli al centro (schemi dei livelli atomici `s, p` con spin–orbita, una barra colorata dei contributi a `1/m*`, e le bande vicino a `Γ`), e noto che `Massa efficace` è già attiva di default. L'idea dei livelli `hh, lh, so` si intuisce visivamente, ma il pannello destro è subito molto denso.
Espressioni e simboli critici non introdotti per uno studente del 3° anno:
- in `FORMULA VIVA` compaiono `⟨u_{n0}| k·p̂ |u_{n'0}⟩`, il parametro di Kane $P$ (in $\text{eV}\cdot\text{\AA}$) e la nota `(slide 41)`, che è un riferimento interno alle slide del docente;
- in fondo a `FORMULA VIVA` è presente un intero riquadro fisso intitolato **`Verifica sui quasi liberi (P4 §3)`** (`somma k·p su 41 bande: 17,731 ... elemento |⟨ψ₁|p̂|ψ₂⟩|/ħ vs π/a: 1,0477 vs 1,0472 Å⁻¹`), completamente scollegato dai parametri e dai grafici della sezione `Metodo k·p`.

#### Spiegazione in cinque righe
Il metodo $\mathbf{k}\cdot\mathbf{p}$ ricava la forma delle bande $E_n(\mathbf{k})$ e le masse efficaci nell'intorno di un punto di alta simmetria (qui $\Gamma$, $\mathbf{k} = 0$) trattando $\frac{\hbar}{m_0}\mathbf{k}\cdot\hat{\mathbf{p}}$ come perturbazione al secondo ordine senza dover conoscere tutto il potenziale $V(\mathbf{r})$. Ogni banda vicina contribuisce a $m_0/m^*$ in ragione inversa della distanza energetica e con segno opposto a seconda che si trovi sopra o sotto, per cui le bande più vicine si «respingono» e un gap $E_g$ piccolo genera una massa efficace $m_c$ piccolissima. Alla cima della valenza ($p$, $L=1$), l'interazione spin–orbita separa di $\Delta$ il quadrupletto $J = 3/2$ (lacune pesanti $hh$ e leggere $lh$) dal doppietto split-off $J = 1/2$ ($so$); in questo modello le lacune leggere e la banda $so$ si accoppiano alla conduzione $s$ tramite il parametro di Kane $E_P \approx 20\text{ eV}$, mentre le lacune pesanti restano disaccoppiate. Oltre il limite $|Pk| \lesssim E_g/2$, la dispersione iperbolica esatta a due bande si discosta dalla parabola e la massa efficace costante smette di valere.

#### Problemi (in ordine di gravità)
1. **Importante — Riquadro fisso `Verifica sui quasi liberi (P4 §3)` fuori contesto in `FORMULA VIVA`**:
   - **Dove**: `Metodo k·p` → colonna `FORMULA VIVA`, in basso (presente sia in `Quattro bande (Kane)` sia in `Due bande, esatto`).
   - **Cosa succede**: Lo studente trova una tabella statica con `a = 3,00 Å, V_G = -0,50 eV`, `41 onde piane`, `17,731` e `elemento |⟨ψ₁|p̂|ψ₂⟩|/ħ vs π/a: 1,0477 vs 1,0472 Å⁻¹` che non corrisponde ad alcun grafico o parametro di `Metodo k·p` (lì i parametri sono `E_g, Δ, E_P` di GaAs/InSb/Ge!). Sembra un test automatico di verifica lasciato esposto nell'interfaccia.
   - **Cosa mi avrebbe aiutato**: Spostare quel confronto nella sezione `Elettroni quasi liberi` (dove esistono davvero `a = 3,00 Å` e `V_G = -0,50 eV`), oppure accompagnarlo con un diagramma esplicito se proprio deve stare qui.
2. **Importante — Etichetta `m_J = ±1/2` presente in `Due bande, esatto` ("senza spin–orbita") e salto di segno della banda `hh`**:
   - **Dove**: `Metodo k·p` → modalità `Due bande, esatto` → pannello `LIVELLI IN Γ` e `DIAGRAMMA E(K) VICINO A Γ`.
   - **Cosa succede**: Il sottotitolo dichiara esplicitamente `senza spin–orbita`, eppure sotto il livello `c (|S⟩)` compare ancora **`m_J = ±1/2`** (il numero quantico `J` non esiste senza accoppiamento spin–orbita!). Inoltre, passando da `Quattro bande (Kane)` a `Due bande, esatto`, la banda `hh (|X⟩, |Y⟩)` smette di curvare verso il basso (`-ħ²k²/2m₀`) e inizia a curvare verso l'alto *dentro il gap* (`+ħ²k²/2m₀`), perché nella matrice 2×2 è stato aggiunto `+ħ²k²/2m₀ I` invece di `-`; per uno studente vedere la banda di valenza `hh` salire nel gap è molto confuso.
   - **Cosa mi avrebbe aiutato**: Rimuovere `m_J` dalla modalità senza spin–orbita e spiegare visivamente (o mantenere coerente) la convenzione del termine libero sulle bande di valenza fra le due modalità.
3. **Minore — Titolo in maiuscolo `CONTRIBUTI A M₀/M*`, gergo `(slide 41)` e sovrapposizioni sui grafici**:
   - **Dove**: `Metodo k·p` → titolo pannello intermedio, `FORMULA VIVA`, `SCHEDA TEORIA`, `DIAGRAMMA E(K)`.
   - **Cosa succede**: La trasformazione maiuscola cambia `m₀/m*` in `M₀/M*`; nei testi compare più volte il riferimento interno `(slide 41)`; in `Quattro bande` la parabola viola copre parzialmente una scritta grigia `vicino a Γ` in alto a sinistra e le etichette `lh` e `so` a destra quasi si toccano; in `Due bande, esatto` l'etichetta `m*` si sovrappone alle curve di valenza.
   - **Cosa mi avrebbe aiutato**: Non applicare il maiuscolo automatico ai simboli matematici nei titoli, eliminare `(slide 41)` dai testi rivolti allo studente e riposizionare le etichette sulle curve.

#### Le due cose più utili
1. **La barra `CONTRIBUTI A m₀/m*` collegata ai `LIVELLI IN Γ` cliccabili**: cliccando direttamente su `c`, `hh`, `lh` o `so` in alto si vede istantaneamente quali bande spingono `1/m*` verso valori positivi o negativi (es. `+9,32 (lh) +3,77 (so)` per la conduzione in GaAs).
2. **La modalità `Due bande, esatto` con la fascia `|P·k| < E_g/2` (soprattutto con `InSb`)**: mostra in modo visivamente inequivocabile l'allontanamento dalla parabola e il crollo della validità dell'approssimazione a massa efficace costante.

#### Verdetto
**da correggere**

---

### Sezione 6 — Pseudopotenziale

#### Primo minuto e lessico
Al primo sguardo la quantità di informazioni è schiacciante: tre grafici in alto e al centro, un istogramma dei pesi `|c_G|²` sotto, i controlli e una colonna destra così alta che la **`SCHEDA TEORIA` finisce completamente fuori schermo** (invisibile a `1440×900` senza scrollare). Senza poter leggere subito la scheda teoria, uno studente non sa ancora che cosa siano:
- `OPW`, `τ = a/8 (1,1,1)`, `V₃ˢ, V₈ˢ, V₁₁ˢ`, `V₃ᵃ, V₄ᵃ, V₁₁ᵃ` (e perché gli indici sono `3, 4, 8, 11`), `v(0) = -2/3 E_F`;
- perché lo stesso oggetto liscio sia chiamato **`ψ^f`** nell'intestazione di `L'IDEA, NELLO SPAZIO REALE` e in `FORMULA VIVA`, ma **`φ^f`** nella legenda dello stesso grafico (`-- parte liscia φ^f`) e nella `SCHEDA TEORIA`;
- che cosa siano i tre rombi arancioni nel grafico `FATTORE DI FORMA V(Q)` quando si seleziona `GaAs` (non hanno legenda né etichette sul grafico).

#### Spiegazione in cinque righe
Il potenziale vero attorno a uno ione è troppo profondo per essere trattato con poche onde piane, e la funzione di valenza $\psi$ oscilla rapidamente nel core per restare ortogonale agli stati interni $\psi_c$. Scorporando le oscillazioni di core in un potenziale efficace repulsivo $V'$ (metodo OPW), si ottiene per la parte liscia $\psi^f$ la stessa equazione centrale degli elettroni quasi liberi ma con uno pseudopotenziale debole $V_{ps} = V + V'$, che si cancella quasi nel core. Diagonalizzando su 113 onde piane ($|G|^2 \le 11$ in unità di $(2\pi/a)^2$), bastano appena 3 fattori di forma simmetrici $V_3^s, V_8^s, V_{11}^s$ per ottenere le bande del Silicio lungo $L\text{--}\Gamma\text{--}X\text{--}W\text{--}K\text{--}\Gamma$ con gap indiretto, e l'aggiunta di 3 fattori antisimmetrici $V_3^a, V_4^a, V_{11}^a$ (struttura zincoblenda) per ottenere il GaAs con gap diretto in $\Gamma$.

#### Problemi (in ordine di gravità)
1. **Importante — `SCHEDA TEORIA` spinta completamente sotto la piega a `1440×900` e simboli non introdotti (`τ`, `|G|²`, `V^s`/`V^a`)**:
   - **Dove**: `Pseudopotenziale` → colonna destra (`1440×900`).
   - **Cosa succede**: `FORMULA VIVA` è così lunga (3 gruppi di equazioni + 10 righe di readout + il riquadro `Ione nudo vs pseudopotenziale`) che `SCHEDA TEORIA` non è minimamente visibile all'apertura; uno studente che inizia da questa sezione non vede la spiegazione di `OPW`, `τ`, `V_3^s, V_8^s, V_11^s` e si trova davanti solo equazioni avanzate.
   - **Cosa mi avrebbe aiutato**: Rendere comprimibile/compatta la `FORMULA VIVA` (o mettere `SCHEDA TEORIA` in un tab affiancato / sezione iniziale visibile) e aggiungere brevi etichette parlanti per `τ` (vettore di base dei due atomi) e per i gusci `|G|² = 3, 4, 8, 11`.
2. **Importante — Doppio simbolo `ψ^f` vs `φ^f` e tabella `Ione nudo vs pseudopotenziale (Si)` fissa anche quando è selezionato `GaAs`**:
   - **Dove**: `Pseudopotenziale` → `L'IDEA, NELLO SPAZIO REALE` (sottotitolo vs legenda), `FORMULA VIVA` vs `SCHEDA TEORIA`, e riquadro in fondo a `FORMULA VIVA`.
   - **Cosa succede**: La parte liscia è chiamata `ψ^f` nel sottotitolo e nelle equazioni di `FORMULA VIVA`, ma diventa `φ^f` nella legenda del grafico e nella `SCHEDA TEORIA`. Inoltre, selezionando `GaAs`, la tabella in fondo a `FORMULA VIVA` rimane intestata `Ione nudo vs pseudopotenziale (Si, a = 5,431 Å, Z = 14)` con i valori del Silicio (`-2,86 / 0,54 / 1,09 eV`) e il sottotitolo di `v(q)` continua a dire `(Ashcroft + Thomas–Fermi, tipo Si)`.
   - **Cosa mi avrebbe aiutato**: Unificare la notazione in `ψ^f` (o `φ^f`) ovunque e aggiornare o nascondere i dati specifici del Silicio quando è attivo `GaAs`.
3. **Minore — Riferimento a uno script interno del codice (`verifica_bande_reali.py`) nei controlli**:
   - **Dove**: `Pseudopotenziale` → nota sotto il menu `Materiale`.
   - **Cosa succede**: È visibile la frase: *«Solo Si e GaAs (da verifica_bande_reali.py e P4 §5.4): Ge e altri materiali restano fuori perché nelle dispense manca il passo reticolare o i fattori antisimmetrici.»*
   - **Cosa mi avrebbe aiutato**: Rimuovere il nome del file Python interno lasciando il solo riferimento alle dispense (`P4 §5.4`).
4. **Minore — Sovrapposizioni grafiche e titolo `V(Q)` in maiuscolo**:
   - **Dove**: `Pseudopotenziale` → `FATTORE DI FORMA V(Q)`, `BANDE LUNGO L–Γ–X–W–K–Γ` e istogramma `|c_G|²`.
   - **Cosa succede**: Il titolo forza `v(q)` in `V(Q)`; sull'istogramma le etichette `97%` (Si) e `66%` (GaAs) toccano/tagliano il bordo superiore della prima barra; in `GaAs` i tre rombi di `V^a` non hanno legenda né etichetta sul grafico; in `L'IDEA, NELLO SPAZIO REALE` il sottotitolo sfiora `ψ^f(r)`; nel grafico bande l'etichetta `gap diretto 1,93 eV` copre leggermente la conduzione in `Γ`.
   - **Cosa mi avrebbe aiutato**: Rispettare `v(q)` minuscolo, dare un piccolo margine superiore sopra la barra più alta dell'istogramma e aggiungere i rombi `V^a` alla legenda del grafico `v(q)`.

#### Le due cose più utili
1. **Il trascinamento diretto dei tre punti `V₃ˢ, V₈ˢ, V₁₁ˢ` sul grafico `v(q)`**: vedere il potenziale nel reciproco muoversi sotto il cursore mentre le bande 3D si ricalcolano e il gap si sposta tra `Γ` (diretto) e `Γ–X` (indiretto) è didatticamente straordinario.
2. **Il toggle `Termine antisimmetrico Vᵃ (zincoblenda)` su GaAs insieme all'istogramma `|c_G|²` e al confronto `reticolo vuoto fcc`**: togliere e mettere `Vᵃ` mostra in un clic la differenza fra un semiconduttore omopolare (tipo diamante) e uno polare (zincoblenda).

#### Verdetto
**da correggere**

---

## 6. Risposte alle domande trasversali (punti 5–7)

### 5. Il passaggio da una sezione alla successiva ha senso? Capisci perché esistono sei metodi e cosa aggiunge ciascuno?
Sì, la sequenza delle sei sezioni racconta una storia coerente e progressiva:
1. **Reticolo vuoto**: è il punto di partenza geometrico (`V = 0`), che introduce i tre schemi di zona e mostra dove si incrociano i rami.
2. **Kronig–Penney**: mette un potenziale periodico 1D esatto per far nascere bande e gap dalla condizione `|L(E)| ≤ 1`, mostrando che con barriere spesse le bande diventano strette e a coseno attorno ai livelli della buca isolata.
3. **Elettroni quasi liberi**: riprende gli incroci del reticolo vuoto con un potenziale debole per spiegare il meccanismo fisico di apertura del gap (`ψ_c` vs `ψ_s`) e il ruolo delle componenti di Fourier `V_G, V_2G`.
4. **Legami forti**: parte dall'estremo opposto (atomi quasi isolati), spiegando con gli orbitali `s, p` e la base biatomica A–B la curvatura delle bande, il carattere legante/antilegante e il passaggio da isolante a metallo per sovrapposizione delle bande.
5. **Metodo k·p**: affronta il problema pratico dei semiconduttori reali vicino a `Γ`, mostrando come pochi parametri sperimentali (`E_g, Δ, E_P`) bastino per ottenere masse efficaci e limiti di parabolicità senza conoscere tutto `V(r)`.
6. **Pseudopotenziale**: chiude il cerchio tornando all'equazione centrale degli elettroni quasi liberi, spiegando come il potenziale ionico vero venga sostituito da uno pseudopotenziale debole così che poche onde piane e 3–6 numeri (`V^s, V^a`) riproducano le bande 3D reali di `Si` e `GaAs`.

Ciò che indebolisce un po' questo filo conduttore è che:
- l'app si apre sulla 3ª sezione anziché sulla 1ª;
- in `Elettroni quasi liberi` non si vedono i pesi `|c_G|²` lontano dal bordo, quindi il collegamento con l'istogramma `|c_G|²` di `Pseudopotenziale` arriva all'improvviso solo alla fine.

### 6. Gli stessi comandi si comportano allo stesso modo in tutte le sezioni, o devi reimparare ogni volta?
L'impianto generale (barra laterale, layout a 3 colonne, hover su `Formula viva`, clic/drag su `E(k)` + frecce `←/→` e `↑/↓`) si impara subito nella prima sezione e resta familiare ovunque. Ci sono però diverse **incoerenze di comportamento**:
- **`Riempimento`**: nelle prime 4 sezioni offre uno stepper `elettroni per cella` (`1..4`, oppure `1..2` nella biatomica); in `Metodo k·p` e `Pseudopotenziale` lo stepper sparisce e il pulsante mostra solo una linea/nota statica.
- **`Massa efficace`**: è spenta all'avvio nelle prime 4 sezioni, ma **già attiva** di default in `Metodo k·p` e `Pseudopotenziale`.
- **Colore di `Confronto`**: il pallino sul pulsante in alto è corallo in `Reticolo vuoto`, mentre è grigio/bianco nelle altre cinque sezioni.
- **Sottopagine / layout della colonna destra**: nelle prime tre sezioni `FORMULA VIVA` e `SCHEDA TEORIA` convivono comodamente sullo schermo; in `Metodo k·p` e soprattutto in `Pseudopotenziale` `FORMULA VIVA` si allunga molto e spinge la `SCHEDA TEORIA` fuori dall'area visibile, introducendo inoltre riquadri statici di verifica (`Verifica sui quasi liberi`, `Ione nudo vs pseudopotenziale`).

### 7. Quale sezione ti ha fatto capire di più e quale di meno, e perché?
- **Quella che mi ha fatto capire di più**: **Elettroni quasi liberi** (subito seguita da **Kronig–Penney**). È essenziale, pulita e visivamente parlante: in meno di un minuto colleghi `V(x)`, `|ψ|²` rispetto agli ioni, il segno di `V_G` e l'apertura del gap `2|V_G|` al bordo di zona.
- **Quella che mi ha fatto capire di meno**: **Pseudopotenziale** (e in parte **Metodo k·p**). Non per mancanza di contenuti — i grafici interattivi di `v(q)` e `Vᵃ` sono eccellenti — ma perché a `1440×900` la `SCHEDA TEORIA` scompare interamente sotto la piega, i termini più ostici (`τ`, `|G|²`, `V^s`/`V^a`) non sono spiegati vicino ai controlli, e compaiono simboli incoerenti (`ψ^f`/`φ^f`) e tabelle fisse del Silicio anche selezionando GaAs.

---

## 7. I dieci interventi che aiuterebbero di più (dal più importante)

1. **Correggere l'onda `Re ψ` nello `SPAZIO REALE` di `Reticolo vuoto e schemi di zona`**: rendere uniforme e fisicamente corretta la frequenza/fase dell'onda su tutto l'asse `x` (oggi tra il 2° e il 3° ione ha periodo e campionamento sbagliati).
2. **Correggere `Re ψ_k` sullo stato antilegante `E_+` in `Legami forti (Biatomica A–B)`**: la parte reale della funzione d'onda deve cambiare segno tra atomo `A` e atomo `B` invece di restare tutta positiva sopra lo zero.
3. **Rendere visibile la `SCHEDA TEORIA` in `Pseudopotenziale` (e `Metodo k·p`) a `1440×900`**: compattare `FORMULA VIVA` o separare `Formula viva` e `Scheda teoria` in schede/tab così che la spiegazione concettuale non finisca sotto il bordo dello schermo proprio nei due argomenti più complessi.
4. **Rimuovere/spostare il riquadro `Verifica sui quasi liberi (P4 §3)` da `Metodo k·p` e i riferimenti interni (`verifica_bande_reali.py`, `(slide 41)`)**: togliere dall'app per lo studente i controlli di test/sviluppo e le citazioni a script o slide del corso.
5. **Allineare la sonda `Massa efficace` di `Legami forti (Biatomica A–B)` alla formula analitica al bordo**: eliminare lo scarto fra `m*/m₀ = +1,35` della sonda e `1,152` della formula esatta in `k = π/a`, aggiungendo inoltre in `FORMULA VIVA` la definizione di `b_A, b_B`.
6. **Aprire l'app sulla schermata iniziale / prima sezione (`Reticolo vuoto`) e aggiornare la nota nella sidebar**: sostituire *«Prima versione: è attiva la sezione Elettroni quasi liberi.»* così lo studente segua il percorso nell'ordine naturale del corso.
7. **Unificare i simboli nelle formule e nei grafici**: `k'` vs `k` in `Reticolo vuoto`; `L(E)` / `L_δ(E)` invece di `f(αa)` in `Kronig–Penney`; `ψ^f` vs `φ^f` in `Pseudopotenziale`; spiegare `V₀` (nella delta), `P_eff` e `∓` in `Kronig–Penney`, e togliere `m_J` dalla modalità senza spin–orbita in `Metodo k·p`.
8. **Chiarire in `Elettroni quasi liberi` la differenza fra `2|V_G|` / `2|V_2G|` (2 onde) e valore `calcolato` (N onde) + azzerare `V_2G` nei preset**: spiegare anche perché `4 el./cella` risulta isolante a `V_2G = 0`, e aggiungere idealmente un piccolo indicatore dei pesi `|c_G|²` per fare da ponte verso `Pseudopotenziale`.
9. **Aggiornare `Pseudopotenziale` quando è selezionato `GaAs`**: adattare o nascondere la tabella `Ione nudo vs pseudopotenziale (Si)` e il sottotitolo `tipo Si` su `v(q)`, e aggiungere alla legenda i rombi `V^a`.
10. **Rifiniture tipografiche e visive trasversali**: togliere la trasformazione maiuscola CSS dai titoli con simboli matematici (`E(K)` → `E(k)`, `M₀/M*` → `m₀/m*`, `V(Q)` → `v(q)`), correggere le sovrapposizioni di etichette (`97%`/`66%` sull'istogramma, `E_g3` fuori scala, `vicino a Γ`/`m*` in `k·p`, `legante`/`antilegante` in `Legami forti`) e rendere più visibile il gap in `k = 0` in `Confronto: quasi liberi`.

---

## 8. Dubbi e domande per la regia

1. **Stato iniziale dell'app**: l'app deve aprirsi sulla schermata iniziale a riquadri prevista da `progetto.md` o sulla prima sezione (*Reticolo vuoto e schemi di zona*)? Oggi apre direttamente *Elettroni quasi liberi* con la nota vecchia nella sidebar.
2. **Riquadri di verifica numerica in `FORMULA VIVA`**: i blocchi `Verifica sui quasi liberi (P4 §3)` (in `Metodo k·p`) e `Ione nudo vs pseudopotenziale (Si)` (in `Pseudopotenziale`) sono pensati per restare visibili agli studenti o sono residui della fase di verifica delle dispense?
3. **Convenzione di segno della banda `hh` in `Metodo k·p` (`Due bande, esatto`)**: in `Quattro bande (Kane)` la banda `hh` scende (`-ħ²k²/2m₀`), mentre in `Due bande, esatto` sale leggermente verso l'alto dentro il gap (`+ħ²k²/2m₀`). È intenzionale dalla dispensa così com'è presentata o va uniformato/spiegato meglio nello schermo?
