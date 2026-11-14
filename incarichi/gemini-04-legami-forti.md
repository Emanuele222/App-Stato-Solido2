# Incarico Gemini 04 — ritocchi e sezione «Legami forti»

**Ruolo: autore di sezione.** Scrivi in `src/renderer/src/sections/tight-binding/` (Parte B), in `sections/empty-lattice/` e `sections/kronig-penney/` (Parte A), in `src/renderer/src/physics/` con i relativi test, e la riga di registrazione in `sections/registry.ts`. Nient'altro. `ui/`, `viz/` e `sections/nearly-free/` restano di Opus.

Esegui prima la Parte A, verifica, poi la Parte B.

## Esito dell'incarico 03
Controllato dalla regia: 84 test su 84, build riuscita, perimetro rispettato. I bordi di banda e i livelli genitori coincidono con un ricalcolo indipendente (delta, a = 3 Å, P = 2: banda 1 [1,25; 4,18] eV; rettangolare b = 4,5 Å, c = 1 Å, V₀ = 10 eV: banda 1 [0,93; 1,32] eV, livelli 1,13 / 4,40 / 9,01 eV).

Risposte alle tue domande:
1. Bande strettissime: continua a disegnarle; sotto 10⁻⁴ eV nei valori vivi scrivi «W < 10⁻⁴ eV».
2. La formula rettangolare su due righe è stata vista a 1440 e a 800 px: va bene così.

## Parte A — tre ritocchi
1. **Kronig–Penney a 800 px.** Con i quattro strumenti attivi la legenda copre le bande alte e le etichette m*, E_F ed E_g1 si toccano. Usa la stessa lista di ingombri che hai introdotto in `ZoneSchemesPlot.tsx` e porta la legenda fuori dall'area delle curve quando lo spazio è poco.
2. **Fisica nell'interfaccia.** In `EmptyLatticeRealSpace.tsx` (riga 123 circa) il valore dell'onda sugli ioni è calcolato con `Math.cos(kReduced·i·a)`: usa le funzioni di `physics/` (`planeWaveIonPhaseAngle` o una nuova, con il suo test).
3. **Legenda del confronto nel reticolo vuoto.** Compare il testo grezzo «V_G»: scrivilo con il pedice, come le altre etichette su canvas.

## Parte B — sezione «Legami forti»

### Fonti
- `materiale/parte3/dispensa.tex`, §12 «Il modello a legami forti» (righe 1714–2013 circa): quadro qualitativo, enunciato, dimostrazione, catena di atomi con bande s e p, larghezza, funzioni di Bloch al centro e al bordo, legame con i quasi liberi.
- `materiale/parte4/dispensa.tex`, §1.4 «La banda s: catena di atomi» (righe 223–256) e §2 «La catena biatomica» (righe 285–480): modello, equazioni (1a)–(2a), le due bande, gap, larghezze, carattere degli stati, masse efficaci al gap.
- Formulari delle due parti, gruppi «Legami forti» e «Catena biatomica».
- `materiale/parte3/verifica_tb_semicl.py` e `materiale/parte4/verifica_tb.py` mostrano come sono calcolati i numeri: leggili, non eseguirli.

Fuori da questo incarico: reticolo quadrato, cubico semplice e grafene. Saranno la vetrina 2D, con un incarico a parte.

### Notazione (dalle dispense)
- φ_n orbitale atomico; Ē_n centro della banda (livello atomico spostato); t(R) integrale di sovrapposizione; W larghezza.
- Catena monoatomica: E_s(k) = Ē_s − 2t_s·cos ka con t_s > 0; E_p(k) = Ē_p − 2t_p·cos ka = Ē_p + 2|t_p|·cos ka con **t_p < 0**. Il cursore agisce su |t_p|; nei valori vivi t_p compare con il suo segno.
- Catena biatomica: passo della cella `a`, atomi A in x = n·a e B in x = (n + ½)·a, E_A < E_B, coefficienti b_A, b_B, un solo t > 0 tra primi vicini. Il fattore è cos(ka/2), non cos ka (osservazione sui vicini nel §2 della Parte 4).
- Mai ε, γ, β delle slide: valgono i simboli delle dispense.

### Cosa deve capire lo studente
1. Ogni livello atomico diventa una banda centrata in Ē_n e larga 4|t|: più gli orbitali si sovrappongono, più la banda è larga.
2. Il segno di t decide la curvatura: la banda s ha il minimo in k = 0, la banda p il massimo.
3. Le funzioni di Bloch sono orbitali atomici sommati con la fase e^{ikna}: in k = 0 tutti in fase, in k = π/a a segni alterni. Per la banda s il primo è legante e il secondo antilegante; per la banda p è il contrario.
4. Due atomi diversi per cella danno due bande e un gap E_g = E_B − E_A al bordo di zona: un semiconduttore in una dimensione. Con E_A = E_B il gap si chiude e si ritrova la catena monoatomica di passo a/2 ripiegata.
5. È il punto di vista opposto ai quasi liberi, ma il quadro coincide: al bordo ψ_c corrisponde allo stato s, ψ_s allo stato p.

### Cosa costruire
- **Due varianti** selezionabili, con passaggio animato: «Catena monoatomica» (bande s e p) e «Catena biatomica A–B».
- **Parametri**
  - Monoatomica: `a`, Ē_s, Ē_p, t_s, |t_p|.
  - Biatomica: `a`, E_A, E_B, t. Deve essere raggiungibile E_A = E_B.
  - Scegli intervalli che coprano dalle bande strette (t piccolo, livelli quasi atomici) alle bande larghe che si sovrappongono, e motivali nel rapporto. Valori iniziali con gap positivo in k = π/a.
- **«Avvicina gli atomi»** (monoatomica): un interruttore che lega t_s e |t_p| al passo `a` con una legge esponenziale, t(a) = t(a₀)·e^{−(a−a₀)/λ}. Le dispense danno solo l'andamento qualitativo (Parte 3 §12.1; W ∝ e^{−βc} nel §10.7): la legge va dichiarata a schermo come **modello indicativo**, con a₀ e λ nel manifest. Con l'interruttore attivo mostra un piccolo diagramma «bordi delle bande in funzione di a»: per a grande due livelli atomici, avvicinando gli atomi due bande che si allargano; il valore corrente di `a` è marcato.
- **Scena, due viste collegate**
  - *Spazio reale*: la catena con un orbitale per atomo. Orbitale s: un lobo; orbitale p lungo la catena: due lobi di segno opposto. Il segno di ogni lobo, dopo la fase e^{ikna}, si legge dal colore (chiaro +, scuro −, come nella figura 6.11 ridisegnata della dispensa). Sopra, Re ψ_k e |ψ_k|² ottenute sommando orbitali modello (una gaussiana per s, x·gaussiana per p: forma **indicativa**, dichiarata a schermo). Si deve vedere la densità crescere tra gli atomi negli stati leganti e svuotarsi negli antileganti. Nella biatomica gli atomi A e B hanno due colori distinti e il peso |b_A|², |b_B|² dello stato scelto si legge dalla grandezza degli orbitali.
  - *Diagramma E(k)* nella prima zona: bande s e p con i centri Ē_s, Ē_p come livelli e il gap in π/a; oppure E₋ ed E₊ con i livelli E_A, E_B e il gap. Usa `BandPlot` di `viz/` così com'è; se non basta, vista locale e lo segnali.
- **Stato scelto**: clic o trascinamento sulla banda e frecce da tastiera, come nelle altre sezioni. Etichetta a schermo «legante» o «antilegante» ai quattro estremi (k = 0 e k = π/a, bande s e p).
- **Bande indipendenti**: come nella dispensa, s e p non si mescolano (nessun t_sp). Se il gap in π/a diventa negativo le bande si sovrappongono: dillo nei valori vivi.
- **Formula viva**
  - Generale: E(k) = Ē_n − Σ_{R≠0} t(R)·e^{ikR}.
  - Monoatomica: E_s = Ē_s − 2t_s·cos ka; E_p = Ē_p + 2|t_p|·cos ka; W = 4|t|; E_g(π/a) = (Ē_p − Ē_s) − 2(t_s + |t_p|).
  - Biatomica: E± = (E_A + E_B)/2 ± √[((E_B − E_A)/2)² + 4t²·cos²(ka/2)]; E_g = E_B − E_A; W ≃ 4t²/(E_B − E_A), con l'avviso che vale per t ≪ E_B − E_A.
  - Passando su t si evidenziano i legami tra atomi vicini nella scena; su Ē_n i livelli nel diagramma; su `a` il passo.
- **Valori vivi**: a, π/a; per ogni banda centro, bordi e W; gap in π/a (o «bande sovrapposte»); distanza tra le bande in k = 0; stato scelto (k, banda, E, carattere legante/antilegante; nella biatomica |b_A|² e |b_B|²).
- **Strumenti trasversali**
  - Riempimento: elettroni per atomo nella monoatomica (1 → banda s piena a metà, metallo; 2 → banda s piena), per cella nella biatomica (2 → valenza piena, semiconduttore; con E_A = E_B metallo).
  - Massa efficace: sonda sulla banda; confronto con m* = ħ²/(2t·a²) al fondo della banda s, massa negativa in cima, e nella biatomica m*_c = −m*_v = ħ²(E_B − E_A)/(2t²a²) al gap.
  - Confronto con gli elettroni quasi liberi (V_G = −0,5 eV, stesso `a`), allineando il fondo della banda più bassa a quello della banda s: l'allineamento va dichiarato a schermo, perché nei legami forti l'origine dell'energia è arbitraria.
- **Scheda teoria** breve, dalle fonti sopra, con l'aggancio a Kronig–Penney (banda a coseno) e ai quasi liberi (ψ_c ↔ s, ψ_s ↔ p). Testi in un file di stringhe della sezione.
- **Registrazione**: in `sections/registry.ts` solo la voce `tight-binding`.

### Regole
- Tutta la fisica in `physics/`: bande s e p, catena biatomica (energie e coefficienti b_A, b_B), legge indicativa t(a), funzione di Bloch come somma di orbitali modello, densità. Le bande escono come `BandStructure`, così i tre strumenti funzionano come nelle altre sezioni.
- Ogni funzione ha un test su un numero della dispensa o su un limite analitico. Almeno questi:
  - W = 4|t|; E_s(0) = Ē_s − 2t_s; E_p(0) = Ē_p + 2|t_p|; gap in π/a dalla formula.
  - m*/m₀ = 0,4233 al fondo della banda s con t_s = 1 eV, a = 3 Å (ħ²/2m₀ = 3,80998 eV·Å²).
  - Biatomica: E_g = E_B − E_A in π/a; distanza in k = 0 pari a 2·√[¼(E_B − E_A)² + 4t²]; |b_A|² = 0,85 nella valenza in k = 0 con E_B − E_A = 4t; m*_c = 0,8467 m₀ con E_B − E_A = 2 eV, t = 1 eV, a = 3 Å.
  - E_A = E_B: E± = E_A ± 2t·|cos(ka/2)|, cioè la monoatomica di passo a/2 ripiegata.
  - Confronto con la diagonalizzazione diretta di un anello di N celle (matrice reale simmetrica, `eigh` esiste già): gli autovalori coincidono con E±(k) nei k = 2πm/(N·a).
- Riusa `ui/` e `viz/` così come sono; ciò che manca diventa una vista locale nella cartella della sezione e lo segnali nel rapporto.
- Stessi colori di grandezza, stessa struttura di file e stessi comportamenti delle altre sezioni. Scegli per t un colore di grandezza coerente con quello usato per t nella sezione Kronig–Penney. Interfaccia in italiano, numeri con la virgola.
- Regge da 800 px in su con tutti gli strumenti attivi. Nessun errore in console. Trascinando un cursore la scena resta fluida.
- Nessuna dipendenza nuova. Niente commit.

## Verifica prima di consegnare
`npm run typecheck`, `npm test`, `npm run build` eseguiti davvero dopo l'ultima modifica. Guarda le sezioni toccate in esecuzione a 1440, 1100 e 800 px e controlla che le altre funzionino ancora. Se una verifica visiva salta, dillo nel rapporto come hai fatto nell'incarico 03.

## Consegna
`reviews/gemini/04-legami-forti.md`, con la struttura di `AGENTS.md`, distinguendo Parte A e Parte B, più: funzioni aggiunte a `physics/`, intervalli scelti per i parametri, valori di a₀ e λ della legge indicativa e perché, proposte per `ui/` e `viz/`, difetti noti.
