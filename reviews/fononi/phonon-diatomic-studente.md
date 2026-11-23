# Revisione didattica (`studente`) — Fononi › Catena biatomica, gap e luce IR

- **Modalità di esplorazione**: solo browser (`http://127.0.0.1:5173/`, viewport `1440×900`), senza leggere il codice sorgente.
- **Cosa ho provato**: stato iniziale (`Coppia Na–Cl`, `Ott. 0`), hover su tutti i termini di «Formula viva», lettura integrale di «Teoria in breve», i 4 modi rapidi (`Ac. 0`, `Ott. 0`, `C (π/a)`, `B (π/a)`), controlli Play/Pausa/velocità/ripristina fase, click/trascinamento e tasti freccia su entrambi i rami (inclusi $k > 0$ e $k < 0$ sul ramo ottico), i 3 strumenti (`Luce infrarossa`, `Confronto M = m`, `Matrice D(k)` singolarmente e insieme), tutti i preset (`Coppia Na–Cl`, `Masse M = 2m`, `Limite M = m`, `Contrasto forte Li–I`) e inversione manuale delle masse ($M = 20{,}0\text{ u} < m = 60{,}0\text{ u}$).

---

## 1. Spiegazione del concetto in 5 righe (con parole mie)

Quando una catena 1D ha una base di due atomi con masse diverse ($M$ e $m$) separati da $a/2$ (passo reticolare $a$), i modi vibrazionali nella prima zona di Brillouin ($-\pi/a < k \le \pi/a$) si dividono in due rami: quello **acustico** $\omega_-(k)$ (dove per $k \to 0$ i due atomi si muovono in fase trascinando rigidamente la cella come un'onda sonora) e quello **ottico** $\omega_+(k)$ (dove a $k = 0$ oscillano in controfase lasciando fermo il centro di massa $R_{\text{cm}} = 0$).
Al bordo zona ($k = \pm\pi/a$) non si fermano tutti gli atomi, ma si formano due onde stazionarie ($v_g = 0$) in cui oscilla una sola specie alla volta: nel punto $C$ (bordo acustico) oscilla solo la massa più pesante mentre la leggera sta ferma, e nel punto $B$ (bordo ottico) accade l'opposto.
La differenza di massa apre quindi un **gap fononico** tra $\sqrt{2C/M_{\max}}$ e $\sqrt{2C/m_{\min}}$ in cui non esistono onde propaganti; quando invece $M = m$ il gap si chiude e il ramo ottico diventa semplicemente il ramo acustico di una catena monatomica di passo $a/2$ ripiegato nella prima zona.
Sul ramo ottico la curva scende allontanandosi da $k = 0$, quindi velocità di gruppo $v_g$ e velocità di fase $v_p$ hanno segno opposto (per $k > 0$ l'inviluppo viaggia indietro con $v_g < 0$).
Infine, poiché la luce viaggia enormemente più veloce del suono ($c/n \gg v_s$), la retta della luce è quasi verticale e per conservare energia e quasi-impulso un fotone infrarosso può eccitare solo il ramo ottico a $k \approx 0$, dove il moto in controfase di ioni diversi genera un dipolo oscillante $p(t)$.

---

## 2. Problemi trovati (in ordine di gravità)

### Bloccante
Nessun problema bloccante: il cuore fisico della sezione (catena animata, centro di massa fermo in `Ott. 0`, quale atomo sta fermo in `C` e `B`, apertura/chiusura del gap, $v_g < 0$ sul ramo ottico e incrocio IR) si riesce comunque a capire.

### Importante

1. **Pannello destro («Formula viva») troncato orizzontalmente quando si attiva `Matrice D(k)`**
   - **Dove**: Colonna destra «Formula viva», a risoluzione `1440×900`, con lo strumento `Matrice D(k)` attivo (sia da solo sia insieme agli altri due strumenti).
   - **Cosa è successo**: La formula simbolica $D(k)$ è più larga della colonna destra e forza un overflow orizzontale sull'intero pannello. Di conseguenza compare una barra di scorrimento orizzontale e la colonna dei valori numerici di *tutti* i readout sottostanti viene tagliata sul lato destro (es. `2,25 TH`, `1,65 T`, `4,51 T`, `9,3 me`, `2,54 km/`). Nel box `Matrice dinamica 2 × 2` in basso, l'autovalore $\omega_+^2$ risulta completamente fuori vista senza scorrere a destra. Inoltre, «Teoria in breve» dice che «gli autovettori pesati danno il rapporto $\alpha$», ma il box della matrice stampa solo gli autovalori $\omega_-^2, \omega_+^2$ e non gli autovettori.
   - **Cosa mi avrebbe aiutato**: Contenere la larghezza della formula simbolica di $D(k)$ (es. andando a capo prima di $\det(D(k)-\omega^2\mathbf{1})=0$ o confinando lo scroll orizzontale alla sola riga della matrice) così da non troncare mai i readout sottostanti, e mostrare un cenno all'autovettore del modo selezionato per chiudere il cerchio con $\alpha$.

2. **Marcatori Markdown grezzi (`**...**`, `*un*`) visibili in «Teoria in breve»**
   - **Dove**: Colonna destra, riquadro «Teoria in breve», in tutti e quattro i sotto-paragrafi.
   - **Cosa è successo**: Molti termini chiave compaiono letteralmente con gli asterischi non convertiti in grassetto/corsivo (`**ramo acustico**`, `**ramo ottico**`, `**velocità di gruppo negativa**`, `*un*`, `**C**`, `**B**`, `**gap fononico**`, `**ripiegato**`, `**ramo ottico a k ≈ 0**`). Visivamente sembra un testo rotto e distrae proprio nei passaggi da memorizzare.
   - **Cosa mi avrebbe aiutato**: Renderizzare correttamente grassetti e corsivi nel testo teorico.

3. **Inversione delle masse ($m > M$): formule simboliche in «Formula viva» incoerenti con i numeri sottostanti**
   - **Dove**: Colonna destra «Formula viva» (righe $\omega_{\max}^{\text{ac}} = \sqrt{2C/M}$ e $\omega_{\min}^{\text{ott}} = \sqrt{2C/m}$) quando si impostano gli slider con $m > M$ (es. $M = 20{,}0\text{ u}$, $m = 60{,}0\text{ u}$).
   - **Cosa è successo**: La catena animata (sfere $m$ più grandi di $M$, in `C` oscilla $m$ e $M$ sta ferma, in `B` viceversa), il grafico, `Matrice D(k)` e i readout numerici si adattano perfettamente e nei readout compare anche una nota esplicita che avvisa dello scambio di ruoli. Tuttavia, appena sopra, le formule simboliche in «Formula viva» restano fisse su $\omega_{\max}^{\text{ac}} = \sqrt{2C/M}$ e $\omega_{\min}^{\text{ott}} = \sqrt{2C/m}$: sostituendo $M = 20$ e $m = 60$ si otterrebbe $\omega_{\max}^{\text{ac}} > \omega_{\min}^{\text{ott}}$ e un gap negativo, in contraddizione con i numeri mostrati due righe sotto. Anche «Teoria in breve» tratta solo il caso $M > m$.
   - **Cosa mi avrebbe aiutato**: Aggiornare dinamicamente i simboli in «Formula viva» quando $m > M$ (scambiando $M$ e $m$ nelle due radici, oppure scrivendo $\max(M,m)$ e $\min(M,m)$) in modo che formula simbolica e numeri non si contraddicano mai.

4. **Grandezza $R_{\text{cm}}$ nei readout mostrata senza formula né spiegazione dei valori intermedi (`0,61`, `0,39`, `0,71`, `0,29`)**
   - **Dove**: Colonna destra «Formula viva» (`Rapporto α e R_cm`) e legenda della catena animata.
   - **Cosa è successo**: In `Ott. 0` (`R_cm = 0 (fermo)`) e `Ac. 0` (`R_cm = 1,00`) il significato si intuisce, ma negli altri modi i numeri lasciano perplessi: ad esempio in Na–Cl leggo `R_cm = 0,61` in `C (π/a)` e `0,39` in `B (π/a)`, a $k = 0{,}50\,\pi/a$ sul ramo ottico leggo `α = −1,68` con `R_cm = 0,29`, e nel preset `Limite M = m` al bordo zona leggo `α = 1,00 · R_cm = 0,71` in `C` e `α = −1,00 · R_cm = 0,71` in `B`! Non c'è nessuna formula che definisca $R_{\text{cm}}$, non si capisce perché sia adimensionale, e soprattutto uno studente si chiede come possano $\alpha = +1$ e $\alpha = -1$ con masse uguali dare entrambi `0,71` ($\approx 1/\sqrt{2}$) invece di `1` e `0` (il motivo è lo sfasamento di $ka/2 = \pi/2$ tra i due atomi della cella, che però non è spiegato vicino al numero).
   - **Cosa mi avrebbe aiutato**: Aggiungere la definizione di $R_{\text{cm}}$ (e del suo modulo normalizzato) in «Formula viva» o in una breve nota sotto il readout, chiarendo che tra $M$ e $m$ nella cella c'è anche la fase $ka/2$ (così si capisce sia perché a $k = 0$ con $\alpha = -M/m$ si ha $R_{\text{cm}} = 0$, sia perché a $k = \pi/a$ con $M = m$ vale $1/\sqrt{2} \approx 0{,}71$).

### Minore

5. **Trascinamento sul grafico seleziona involontariamente il testo della pagina**
   - **Dove**: Grafico di dispersione `ν(k) = ω(k)/2π` quando si clicca e trascina il cursore lungo i rami.
   - **Cosa è successo**: Trascinando con il mouse sul grafico si attiva facilmente la selezione testuale blu del browser su quasi tutta la pagina (sidebar, intestazioni, formula viva), sporcando la schermata.
   - **Cosa mi avrebbe aiutato**: Impedire la selezione del testo (`user-select: none`) durante il trascinamento sul grafico.

6. **Strumento `Confronto M = m` privo di guida visiva sul «ripiegamento» e simbolo $\bar{m}$ non definito**
   - **Dove**: Toggle `Confronto M = m` e legenda del grafico di dispersione (`monatomica passo a/2 (m̄)`).
   - **Cosa è successo**: Attivando il confronto compare la curva grigia tratteggiata fino a $\pm 2\pi/a$, ma sul grafico non viene spiegato cos'è $\bar{m}$ (media aritmetica $(M+m)/2$?) né c'è una didascalia/freccia che evidenzi come il tratto in $[\pi/a, 2\pi/a]$ traslato di $-2\pi/a$ si sovrapponga al ramo ottico quando $M = m$.
   - **Cosa mi avrebbe aiutato**: Una breve nota contestuale (o una freccia/tratto di traslazione di $G = 2\pi/a$ sul grafico) che definisca $\bar{m} = (M+m)/2$ e colleghi lo strumento al preset `Limite M = m`.

7. **Nota su $v_g < 0$ fissa al caso $k > 0$ anche quando si esplora $k < 0$ sul ramo ottico**
   - **Dove**: Colonna destra «Formula viva», nota sotto `Velocità (v_p / v_g)` sul ramo ottico con $k < 0$.
   - **Cosa è successo**: A $k = -0{,}50\,\pi/a$ i readout mostrano correttamente $v_p = -9{,}79\text{ km/s}$ e $v_g = +1{,}47\text{ km/s}$, ma la nota sottostante resta fissa su *«per $k > 0$ la pendenza è negativa ($v_g < 0$, inviluppo contro la fase)»*, suonando leggermente disallineata rispetto al punto selezionato.
   - **Cosa mi avrebbe aiutato**: Adattare la nota al segno di $k$ corrente (per $k < 0$: *«per $k < 0$ la pendenza è positiva ($v_g > 0$), opposta a $v_p < 0$»*).

8. **Modo `Ac. 0` immobile con il pulsante `Pausa` attivo**
   - **Dove**: Pannello superiore «Spazio reale — catena biatomica 1D», cliccando `Ac. 0`.
   - **Cosa è successo**: Poiché $\nu_- = 0{,}00\text{ THz}$, la catena non si muove (mostra le frecce gialle tutte uguali verso destra), ma il pulsante di riproduzione resta su `Pausa` come se l'animazione stesse scorrendo: per un attimo può sembrare che l'animazione si sia bloccata.
   - **Cosa mi avrebbe aiutato**: Aggiungere una breve etichetta esplicita nell'intestazione o nella legenda (es. «$\nu = 0$: traslazione rigida statica, nessuna oscillazione»).

9. **Piccoli attriti di notazione ($\omega$ vs $\nu$, simboli $n$ e $p$)**
   - **Dove**: «Formula viva» (confronto tra formule in $\omega$ e readout/grafico in $\nu$), box `Luce infrarossa` (`n = 1`), e «Teoria in breve» (`p = 2`).
   - **Cosa è successo**: Le formule simboliche usano $\omega$, i readout e il grafico usano $\nu = \omega/2\pi$ (e poi `Matrice D(k)` torna a $\omega^2$), il che richiede un continuo salto mentale del fattore $2\pi$. Inoltre, in `Luce infrarossa` appare `n = 1` (e $c/n$ in teoria) senza mai scrivere esplicitamente «indice di rifrazione $n$», e in teoria compare `p = 2` senza dire esplicitamente «numero di atomi nella base».
   - **Cosa mi avrebbe aiutato**: Esplicitare «indice di rifrazione $n$» e «$p = 2$ atomi per cella» al primo uso.

---

## 3. Le due cose che hanno aiutato di più a capire

1. **La catena animata con il rombo $R_{\text{cm}}$ e i 4 modi rapidi (`Ac. 0`, `Ott. 0`, `C (π/a)`, `B (π/a)`)**: vedere dal vivo che in `Ott. 0` gli atomi $M$ e $m$ oscillano in controfase con ampiezze diverse lasciando inchiodato il centro di massa $R_{\text{cm}}$, e che nei punti `C` e `B` un'intera specie atomica **sta completamente ferma** mentre l'altra oscilla (scambiandosi addirittura ruolo quando si inverte $m > M$ o diventando entrambe mobili quando $M = m$), risolve immediatamente i misconcetti più difficili della catena biatomica.
2. **Il collegamento vivo (codice colore + hover sincronizzato) di «Formula viva» abbinato allo strumento `Luce infrarossa`**: passare il mouse su $M$, $m$, $C$, $a$, $\omega_-$, $\omega_+$, $u_n$ e vedere accendersi contemporaneamente il simbolo nella formula, lo slider corrispondente e gli elementi fisici nella catena o sul grafico rende la matematica immediatamente leggibile; l'aggiunta della retta della luce quasi verticale insieme al vettore di dipolo ionico $p(t)$ sopra la cella chiarisce a colpo d'occhio *perché* la luce IR eccita solo il ramo ottico vicino a $k = 0$.

---

## 4. Verdetto

**da correggere** — La struttura didattica è molto efficace e chiarisce davvero i concetti fisici chiave (ramo acustico/ottico, $R_{\text{cm}} = 0$, atomo fermo a $C$ e $B$, gap, $v_g < 0$, accoppiamento IR), ma vanno sistemati prima dell'approvazione i 4 problemi importanti emersi: il troncamento orizzontale della colonna destra con `Matrice D(k)` attiva, gli asterischi Markdown grezzi in «Teoria in breve», l'incoerenza delle formule simboliche ai bordi quando $m > M$, e la mancata definizione/spiegazione dei valori numerici di $R_{\text{cm}}$.
