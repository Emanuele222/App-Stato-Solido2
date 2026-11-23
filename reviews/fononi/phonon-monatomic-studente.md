# Revisione didattica (Studente 3° anno) — Catena monatomica e prima zona

- **Sezione provata**: `Fononi › Catena monatomica e prima zona` (`http://127.0.0.1:5173/`, viewport `1440×900`)
- **Ruolo**: Studente del terzo anno di fisica/ingegneria (solo interazione dal browser, senza lettura del codice sorgente)
- **Percorso svolto**: osservazione iniziale prima di toccare i controlli; modi caratteristici (`k = 0`, `π/2a`, `π/a`); `Pausa`/`Avvia`, velocità (`0,25×`–`2×`) e `Ripristina fase`; hover su tutti i simboli di «FORMULA VIVA»; strumento «Aliasing (k + G)»; strumento «Born–von Kármán (N)» con `N = 4, 5, 7, 8, 9, 10, 24`; strumento «Sonda v_p, v_g» con click/trascinamento anche per `k < 0`; preset («Metallo tipico», «Piombo 1D», «Carbonio 1D») e slider manuali (`a`, `M`, `C`); lettura integrale di «TEORIA IN BREVE».

---

## 1. Spiegazione del concetto in 5 righe (con parole mie)

In una catena 1D di atomi di massa $M$ a distanza $a$ collegati da molle $C$, le vibrazioni si propagano come onde piane con dispersione $\omega(k) = 2\sqrt{C/M}\,|\sin(ka/2)|$, che a grandi lunghezze d'onda ($ka \ll 1$) è lineare con velocità del suono $v_s = a\sqrt{C/M}$.
Poiché lo spostamento esiste solo sui siti discreti $x_n^0 = na$, sostituire $k$ con $k' = k + G$ ($G = 2\pi m/a$) produce esattamente gli stessi spostamenti sugli atomi (aliasing): per questo tutti i modi fisicamente distinti vivono nella prima zona di Brillouin $-\pi/a < k \le \pi/a$.
Al bordo zona $k = \pm\pi/a$ ($\lambda = 2a$) si raggiunge la frequenza di taglio $\omega_{\max} = 2\sqrt{C/M}$ e la pendenza si azzera ($v_g = 0$): gli atomi non sono fermi, ma oscillano in opposizione di fase come onda stazionaria mentre la velocità di fase resta $v_p = \omega/k \neq 0$.
Oltre $\omega_{\max}$ non esistono onde propaganti con $k$ reale e la catena si comporta da filtro passa-basso (banda evanescente).
Chiudendo una catena di $N$ atomi ad anello senza estremi (condizioni periodiche di Born–von Kármán, $u_{n+N} = u_n$), i vettori d'onda diventano discreti con passo $\Delta k = 2\pi/(Na)$ e nella prima zona cadono esattamente $N$ modi, tanti quanti i gradi di libertà longitudinali.

---

## 2. Aspettative iniziali e diario breve delle verifiche

- **Prima di toccare i controlli**: dal titolo e dalla schermata iniziale ho capito subito che avrei visto il legame tra una catena reale di atomi e molle in alto e il grafico della sua curva di dispersione $\nu(k)$ in basso, con codifica colore coerente (`a` ciano, `M` blu, `C` rosso/arancio, `k` giallo, `ω/ν` verde). Le frecce orizzontali sopra gli atomi e le linee tratteggiate verticali mi hanno fatto capire quasi subito che la curva $u(x)$ in alto rappresenta gli spostamenti *longitudinali* degli atomi.
- **Modi caratteristici (`k = 0`, `π/2a`, `π/a`)**: a `k = 0` tutti gli atomi restano traslati rigidamente verso destra senza oscillare ($\nu = 0$, $\lambda = \infty$). A `k = π/a` si vede benissimo che gli atomi si avvicinano e allontanano a coppie in opposizione di fase comprimendo e stirando molle alternate, con onda stazionaria di $\lambda = 2a$ e `ν = 4,39 THz`. `Pausa`/`Avvia`, le velocità (`0,25×` è comodissima per seguire `π/a`) e `Ripristina fase` rispondono subito.
- **Aliasing (`k + G`)**: a `k = π/2a` compare la seconda onda gialla tratteggiata `k' = k − G = −1,50 π/a` che, pur avendo lunghezza d'onda tre volte più corta e viaggiando nel verso opposto durante l'animazione, passa istante per istante per gli stessi pallini $u_n$ sugli atomi; nel grafico una linea orizzontale gialla collega `k` a `k − G` alla stessa frequenza. A `k = π/a` collega direttamente `+π/a` e `−π/a`, rendendo immediato perché i due bordi coincidano.
- **Born–von Kármán (`N`)**: la catena diventa un anello chiuso senza estremi con `u_{n+N} = u_n` al centro, controllato dallo stepper `Atomi nell'anello N` (`4`–`24`, passo `1`, default `10`). Sulla curva in 1BZ compaiono e si contano esattamente `N` pallini discreti (per `N` pari c'è il punto su `+π/a` e non su `−π/a`; per `N = 7, 9` dispari nessun punto cade sui bordi) e il cursore si aggancia ai modi permessi `k_j`. Resta leggibile anche a `N = 24`.
- **Sonda `v_p, v_g`, trascinamento, preset e slider**: il trascinamento sul grafico è fluido anche per `k < 0` (dove `v_p` e `v_g` diventano giustamente negativi: a `k = −0,50 π/a`, `v_p = −3,11 km/s`, `v_g = −2,44 km/s`). A `k = π/a` la tangente verde acqua `v_g = 0,00 km/s` è orizzontale mentre la corda viola `v_p = 2,20 km/s` è ben inclinata. «Piombo 1D» (`ν_max = 1,33 THz`, `v_s = 1,46 km/s`) e «Carbonio 1D» (`ν_max = 21,39 THz`, `v_s = 13,44 km/s`) riscalano assi e animazione senza tagli né sfarfallii; toccando uno slider il preset passa subito a «Libero».

---

## 3. Problemi trovati (in ordine di gravità)

### Bloccante
Nessuno.

### Importante

1. **Simboli e termini introdotti nella teoria senza spiegazione**
   - **Dove**: Pannello destro → «TEORIA IN BREVE» → «Approssimazione armonica e molle», «Regime acustico, bordo zona e taglio» e «Aliasing e prima zona di Brillouin».
   - **Cosa è successo**:
     - Nel primo paragrafo compare la formula `∑_m Φ(n,m) = 0` («regola di somma nulla»), ma il simbolo `Φ(n,m)` non è mai definito né lì né in «FORMULA VIVA»: da studente del 3° anno mi sono chiesto subito cosa rappresenti `Φ`.
     - Nel secondo paragrafo si scrive `k = π/a + iκ: la catena agisce da filtro passa-basso`, senza spiegare che la parte immaginaria `iκ` trasforma l'onda piana $e^{ikna}$ in un decadimento esponenziale nello spazio ($e^{-\kappa na}$), cioè proprio la «banda evanescente» citata sul grafico.
     - Nel terzo paragrafo compare «cella di Wigner–Seitz del reticolo reciproco», concetto di cristallografia che uno studente che apre «Fononi» non ha ancora visto nell'app (in sidebar «Cristallografia» e «Reticolo reciproco» sono ancora «IN ARRIVO»).
   - **Cosa mi avrebbe aiutato**: Una breve glossa tra parentesi per ciascun termine: definire `Φ(n,m)` come costanti di forza tra i siti `n` e `m`, esplicitare che `iκ` dà un'onda che decade esponenzialmente ($e^{-\kappa x}$, evanescente), e spiegare in mezza riga che la cella di Wigner–Seitz raccoglie i `k` più vicini a `0` che a qualunque altro `G`.

2. **Hover su `v_g(k)` confuso con la velocità del suono `v_s`**
   - **Dove**: «FORMULA VIVA» (righe 3–4) collegata al grafico di dispersione.
   - **Cosa è successo**: Passando il mouse su `v_g(k)` nella formula viva si illumina contemporaneamente anche `v_s`, e sul grafico si accendono le due rette tratteggiate del limite acustico `ω = v_s |k|` (oltre alla tangente `v_g` quando la Sonda è attiva). Proprio a `k = π/a` — dove il punto didattico cruciale è distinguere la pendenza locale `v_g = 0` dalla velocità del suono `v_s = 3,45 km/s` — vedere accendersi la retta ripida `ω = v_s|k|` quando indico `v_g(k)` confonde i due concetti.
   - **Cosa mi avrebbe aiutato**: Separare l'evidenziazione (e possibilmente una leggera distinzione visiva) tra `v_s` (rette del limite acustico) e `v_g(k)` (tangente locale al punto selezionato).

3. **A `k = 0` con «Sonda v_p, v_g» attiva vengono stampati `v_p = 0,00 km/s · v_g = 0,00 km/s`**
   - **Dove**: «FORMULA VIVA» → riga numerica `Velocità (fase / gruppo)` a `k = 0` con «Sonda v_p, v_g» attiva.
   - **Cosa è successo**: In evidenza compaiono `v_p = 0,00 km/s · v_g = 0,00 km/s`, mentre solo nella nota grigia sotto si chiarisce *«In k = 0 il profilo trasla rigidamente; per k → 0⁺ vale v_p = v_g = v_s»*. Vedere `0,00 km/s` in cima al valore numerico può indurre l'errore di pensare che a grandi lunghezze d'onda le velocità tendano a zero invece che a `v_s = 3,45 km/s` (in `k = 0` esatto `ω/k` è `0/0` e `dω/dk` ha un punto angoloso `±v_s`).
   - **Cosa mi avrebbe aiutato**: Scrivere `— (lim → ±v_s)` oppure `±3,45 km/s (k → 0±)` al posto di `0,00 km/s`, tenendo la nota sulla traslazione rigida in `k = 0` esatto.

4. **Possibile confusione sul fattore `2π` tra asse `ν (THz)` e annotazioni in `ω` sul grafico**
   - **Dove**: Grafico di dispersione (asse verticale `ν (THz)`, legenda `dispersione ω(k)`, annotazioni interne `ω = v_s|k|`, `ω > ω_max (evanescente)`, `corda v_p = ω/k`, `tangente v_g = dω/dk`).
   - **Cosa è successo**: L'asse verticale è in frequenza `ν` (THz), mentre le formule scritte direttamente sopra la curva e nella legenda della Sonda usano la pulsazione `ω`. Anche se il titolo riporta `ν(k) = ω(k)/2π`, uno studente che prova a stimare la pendenza dal grafico (`4,39 THz / 1,26 Å⁻¹ ≈ 3,48`) rischia di non ritrovarsi subito con `v_p = 2,20 km/s` finché non realizza che manca il fattore `2π` (oltre alla conversione di unità `THz·Å = 0,1 km/s`).
   - **Cosa mi avrebbe aiutato**: Mantenere coerenza sulle etichette dentro al grafico (es. `ν = v_s|k|/2π` e `ν > ν_max`) oppure aggiungere un breve promemoria vicino alla Sonda sul fattore `2π` tra pendenza in `ν(k)` e velocità `v = dω/dk`.

### Minore

1. **Due barre di scorrimento orizzontali superflue dentro «FORMULA VIVA»**
   - **Dove**: Pannello destro → «FORMULA VIVA», sotto la riga 3 (`v_s = a√(C/M), ω_max = 2√(C/M)`) e sotto la riga 5 (`k' = k + G, G = (2π/a)m, −π/a < k ≤ π/a`).
   - **Cosa è successo**: A `1440×900` compaiono due scrollbar orizzontali grigie fisse proprio in mezzo al blocco formule, pur non essendoci testo davvero tagliato; distraggono e sprecano spazio verticale.
   - **Cosa mi avrebbe aiutato**: Rimuovere l'overflow orizzontale spurio delle formule KaTeX.

2. **Raggruppamento di `π/a` sotto «Velocità del suono», a-capo spezzati e pedici ASCII**
   - **Dove**: «FORMULA VIVA» (tabella numerica) e barra strumenti superiore.
   - **Cosa è successo**: `π/a = 1,26 Å⁻¹` è elencato nella riga `Velocità del suono` insieme a `v_s` (può far pensare che `π/a` sia una grandezza acustica invece del bordo della 1BZ); varie unità vanno a capo da sole (`1,26` / `Å⁻¹`, `12,9` / `meV`); il pulsante in alto scrive `Sonda v_p, v_g` e la riga Aliasing scrive `stessi u_n sugli atomi` con underscore ASCII invece di pedici tipografici.
   - **Cosa mi avrebbe aiutato**: Spostare `π/a` in una riga tipo `Bordo 1BZ` o in `Scale caratteristiche`, tenere insieme numero e unità sulla stessa riga e usare pedici tipografici coerenti ovunque.

3. **Etichetta `ω = v_s|k|` leggermente sovrapposta alla curva/punto selezionato**
   - **Dove**: Grafico di dispersione, ramo destro attorno a `k = 0,50 π/a` e con Sonda attiva a `k = π/a`.
   - **Cosa è successo**: Il testo `ω = v_s|k|` si appoggia sopra la retta tratteggiata e a `k = π/2a` sfiora il cerchio bianco del modo selezionato; a `k = π/a` con Sonda attiva attraversa la corda viola `v_p`.
   - **Cosa mi avrebbe aiutato**: Spostare l'etichetta in una zona più libera (es. vicino alla parte alta della retta o sul ramo sinistro) o darle un piccolo sfondo scuro come quello dell'etichetta `v_g`.

4. **Simbolo `G` non interattivo all'hover e assenza di brevi tooltip sui simboli**
   - **Dove**: «FORMULA VIVA» (riga 5 per `G`, e tutti i simboli per i tooltip).
   - **Cosa è successo**: Passando il mouse su `G` non succede nulla (nemmeno con «Aliasing» attivo), e nessun simbolo della formula viva mostra un piccolo tooltip con il nome della grandezza (es. «costante elastica», «vettore del reticolo reciproco»).
   - **Cosa mi avrebbe aiutato**: Collegare `G` all'hover con lo scarto tra `k` e `k − G` quando Aliasing è attivo, e aggiungere brevi tooltip sui simboli.

5. **Piccoli dettagli di chiarezza su etichette e legende**
   - **Dove**: Controlli (`Modi caratteristici (Fig. 4)`, `Metallo tipico (§3)`), scena 1D (`u(x)`), anello BvK (etichetta `N` e legenda), pulsante `Aliasing (k + G)`.
   - **Cosa è successo**:
     - I rimandi `(Fig. 4)` e `(§3)` puntano alla dispensa che chi usa l'app da sola non ha necessariamente aperta accanto.
     - Nella scena catena, dire esplicitamente *«spostamento longitudinale u(x)»* eviterebbe a chi apre la pagina per la prima volta di pensare per un istante a un'onda trasversale.
     - Nell'anello BvK è etichettato solo l'atomo `N` (non il vicino `1` attraverso la molla di chiusura), e la legenda continua a citare `onda k e spostamenti u_n` anche se attorno all'anello non c'è l'onda sinusoidale continua.
     - Il pulsante si chiama `Aliasing (k + G)`, ma per `k > 0` lo strumento mostra `k' = k − G` (scelta sensata per restare nell'asse X visibile, ma allineare il nome a `Aliasing (k ± G)` eviterebbe il piccolo scarto di segno).
   - **Cosa mi avrebbe aiutato**: Rifinire queste micro-etichette per rendere la sezione completamente autonoma anche senza dispensa aperta a fianco.

---

## 4. Le due cose che hanno aiutato di più a capire

1. **La sovrapposizione animata di «Aliasing (k + G)» abbinata alla linea orizzontale sul grafico di dispersione**: vedere l'onda gialla tratteggiata `k' = k − G` con lunghezza d'onda tripla in frequenza spaziale (e addirittura in viaggio nel verso opposto!) passare *esattamente* per gli stessi pallini $u_n$ su tutti gli atomi, mentre oscilla liberamente nello spazio vuoto tra un atomo e l'altro, fa scattare l'intuizione dell'aliasing in tre secondi netti — e a `k = π/a` mostra visivamente perché `+π/a` e `−π/a` siano lo stesso stato.
2. **La combinazione a `k = π/a` tra catena animata (con molle compresse/stirate a coppie e frecce in opposizione) e «Sonda v_p, v_g» sul grafico**: osservare gli atomi che oscillano vigorosamente in controfase mentre sulla dispersione la tangente `v_g` diventa piatta (`0,00 km/s`) e la corda viola `v_p` dall'origine resta chiaramente inclinata (`2,20 km/s`) smonta alla radice il classico misconcetto secondo cui `v_g = 0` significherebbe «atomi fermi» o «`v_p = 0`».

*(Menzione d'onore anche per l'anello di Born–von Kármán: poter contare a occhio esattamente `N` pallini nella 1BZ e vedere il bordo `−π/a` vuoto quando `+π/a` è occupato rende chiarissimo il conteggio dei modi.)*

---

## 5. Verdetto

**Approvata** *(nessun problema bloccante; i concetti fisici chiave e i misconcetti della catena monatomica si comprendono davvero bene. Si raccomanda comunque un rapido giro di rifinitura sui 4 punti «Importante» — in particolare la definizione di `Φ(n,m)` e `iκ` nella teoria, la separazione tra `v_g` e `v_s` all'hover e la resa di `v_p, v_g` in `k = 0` — e sulle due scrollbar orizzontali in «FORMULA VIVA»).*
