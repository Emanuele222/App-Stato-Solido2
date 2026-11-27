# Revisione Studente — Fononi: «Modi quantizzati e processi Umklapp» (`phonon-quantum`)

**Profilo:** Studente del 3° anno di fisica / ingegneria (conoscenze di meccanica quantistica e statistica di base; sola osservazione dell’app in esecuzione su `http://localhost:5173/` tramite browser, più verifica dei testi visibili).

---

## 1. Spiegazione del concetto in 5 righe (con parole mie)

Nell’approssimazione armonica, ogni modo normale del reticolo si comporta come un oscillatore quantistico indipendente con livelli $E_n = (n + \tfrac{1}{2})\hbar\omega$: i fononi sono i quanti $\hbar\omega$ di eccitazione del modo e anche nello stato fondamentale ($n = 0$) gli atomi mantengono l’oscillazione di punto zero, mentre per $n$ grande la densità di probabilità $P_n(x)$ ricalca quella classica a U (corrispondenza di Bohr). In equilibrio termico, siccome il numero di fononi non si conserva, l’occupazione media segue la distribuzione di Bose–Einstein con $\mu = 0$ e il modo si congela quando $k_B T \ll \hbar\omega$. Negli urti tra fononi in un reticolo discreto il quasi-impulso si conserva solo a meno di un vettore del reticolo reciproco $G$ ($k_1 + k_2 = k_3 - G$). Se $k_1 + k_2$ resta nella prima zona di Brillouin ($G = 0$, processo Normale) il verso della velocità di gruppo e del flusso di calore non viene invertito; se invece esce di zona, $G = \mp 2\pi/a$ lo ripiega sul ramo opposto (processo Umklapp) invertendo $v_g(k_3)$ e frenando la corrente termica.

---

## 2. Problemi riscontrati (in ordine di gravità)

### Bloccante
Nessun problema bloccante: la sezione si apre correttamente, entrambe le modalità (`Quantizzazione del modo` e `Collisioni 1BZ (N / Umklapp)`) rispondono ai preset, agli slider, ai controlli play/pausa e al trascinamento sui grafici, e tutte le formule KaTeX sono renderizzate senza blocchi dell’interfaccia.

### Importante

1. **Simbolo $x$ non definito e in conflitto con la posizione in `Formula viva` (Modalità A — `Bagno termico T`)**
   - **Dove:** Pannello destro `FORMULA VIVA` quando si seleziona `Bagno termico T` (es. preset `Bagno termico 300 K`).
   - **Cosa è successo:** Compare la formula $p_n(T) = (1 - e^{-x})e^{-nx}$, ma in tutta la schermata aperta il simbolo $x$ non viene definito come $x = \hbar\omega / (k_B T)$ e subito a sinistra, nei grafici, $x$ indica invece la coordinata spaziale di spostamento ($P(x)$, $x/a_{\mathrm{ho}}$). Solo aprendo il riquadro collassato `Dettagli formali` si legge la forma esplicita $(1 - e^{-\hbar\omega/k_B T})e^{-n\hbar\omega/k_B T}$.
   - **Cosa mi avrebbe aiutato:** Scrivere direttamente $p_n(T) = (1 - e^{-\hbar\omega/k_B T})e^{-n\hbar\omega/k_B T}$ (oppure usare $\beta\hbar\omega$ / esplicitare $x = \hbar\omega/k_B T$) per evitare che uno studente confonda l’esponente adimensionale con la posizione $x$.

2. **Ruolo di $\mu = 0$ visibile nella tabella ma non motivato nei blocchi aperti della guida (Modalità A — `Bagno termico T`)**
   - **Dove:** Tabella dei valori in Modalità A (`Bose–Einstein (μ = 0)`) rispetto ai tre blocchi aperti di `GUIDA ALLA SEZIONE` (`L’idea`, `Come intervengono i parametri`, `Cosa provare`).
   - **Cosa è successo:** Dalla meccanica statistica di base mi aspetto la formula generale di Bose–Einstein con potenziale chimico $\mu$. Qui la tabella live cita esplicitamente `Bose–Einstein (μ = 0)` e `Formula viva` mostra $\bar{n}(T) = [\exp(\hbar\omega/k_B T) - 1]^{-1}$, ma nei tre blocchi aperti non viene mai detto *perché* $\mu = 0$ (questa spiegazione — cioè che il numero totale di fononi non si conserva — compare solo dentro `Dettagli formali`, collassato di default).
   - **Cosa mi avrebbe aiutato:** Aggiungere una frase sintetica in `L’idea` o in `Come intervengono i parametri` (es. «poiché i fononi si creano e si distruggono negli urti, il potenziale chimico è $\mu = 0$»), così il misconcetto sul potenziale chimico viene chiarito subito anche a chi non apre `Dettagli formali`.

3. **Spiegazione fisica del perché solo gli Umklapp frenano il calore e nota sul bilancio $\hbar\omega$ (Modalità B — `Collisioni 1BZ`)**
   - **Dove:** `GUIDA ALLA SEZIONE` (`L’idea` / `Cosa provare`) e riga `Bilancio ħω` nel riepilogo live in Modalità B.
   - **Cosa è successo:** Dai grafici vedo subito che nel preset `Umklapp dispensa §16 (0,7 + 0,6 π/a)` entrambi i fononi entranti vanno a destra ($v_g > 0$) e quello risultante $k_3 = -0{,}70\,\pi/a$ va a sinistra ($v_g < 0$), mentre in `Normale (0,3 + 0,4 π/a)` tutti vanno a destra. Tuttavia:
     - nei blocchi aperti non si esplicita che il vettore $-\hbar G$ corrisponde a un trasferimento di impulso al reticolo nel suo insieme (mentre nei processi Normali il quasi-impulso totale del gas di fononi si conserva e quindi una corrente di calore non può decadere da sola);
     - nella tabella `Bilancio ħω` leggo $\hbar(\omega_1 + \omega_2) = 30{,}9\text{ meV}$ contro $\hbar\omega_3 = 16{,}2\text{ meV}$, accompagnato dalla nota «Nell’urto reale si conserva anche $\omega_1 + \omega_2 = \omega_3$ (§16.2)»: uno studente attento può restare interdetto chiedendosi perché i due numeri mostrati siano quasi uno il doppio dell’altro e se l’app stia violando la conservazione dell’energia.
   - **Cosa mi avrebbe aiutato:** Una frase breve in `L’idea` sul rinculo del reticolo ($-\hbar G$) come origine della resistenza termica, e precisare nella nota di `Bilancio ħω` che sul singolo ramo acustico 1D la figura mostra solo la cinematica in $k$ (mentre in 3D/con più rami si soddisfa anche $\omega_1 + \omega_2 = \omega_3$).

4. **Taglio verticale della curva di riferimento $P_0(x)$ in bagno termico caldo a bassa frequenza (Modalità A)**
   - **Dove:** Grafico `P(u)·a_ho` in Modalità A (`Bagno termico T`) con parametri `T = 600 K`, `ν = 2,0 THz`.
   - **Cosa è successo:** Quando la distribuzione termica $\langle P(x)\rangle_T$ si allarga e si abbassa molto, l’asse verticale sembra scalarsi sulla curva termica rossa e la gaussiana tratteggiata $P_n(x)$ (che rappresenta il riferimento $n=0$) supera il bordo superiore del pannello venendo tagliata in cima sotto l’etichetta `P(u)·a_ho`.
   - **Cosa mi avrebbe aiutato:** Includere anche il picco della curva tratteggiata di riferimento nel calcolo della scala verticale di $P(u)\cdot a_{\mathrm{ho}}$.

5. **Errore JavaScript in console durante l’interazione**
   - **Dove:** Console del browser durante l’uso della Modalità A (rilevato dopo interazioni con controlli/testo nella pagina).
   - **Cosa è successo:** È comparso l’errore `Uncaught IndexSizeError: Failed to execute 'setEnd' on 'Range': The offset 4 is larger than the node's length (3).` (`http://localhost:5173/:21`). Non ha bloccato i grafici ma sporca la console (e in una delle schermate con `Dettagli formali` aperto si è notata una selezione di testo anomala sull’intera pagina).
   - **Cosa mi avrebbe aiutato:** Verificare da dove origina la manipolazione di `Range` / selezione durante l’interazione su KaTeX o controlli.

### Minore

1. **Leggera sovrapposizione di etichette nei grafici**
   - **Dove:**
     - Modalità A, pannello superiore del potenziale: la scritta verde `V(x) [ħω]` in alto a sinistra interseca il ramo sinistro della parabola verde.
     - Modalità B, grafico inferiore della dispersione $\nu(k)$: trascinando un vettore vicino al bordo zona (es. `k₂ = 0,93 π/a` e `k₁ + k₂ = 1,07 π/a`), le etichette `k₂ (→)` e `k₁+k₂` si sovrappongono attorno a $+\pi/a$.
   - **Cosa mi avrebbe aiutato:** Spostare `V(x) [ħω]` leggermente più a destra o fuori dal tratto della parabola e sfalsare verticalmente l’etichetta `k₁+k₂` rispetto a `k₂ (→)` vicino a $\pm\pi/a$.

2. **Piccola incoerenza di simbolo $Q$ vs $x$ e legenda $P_n(x)$ in modalità termica**
   - **Dove:** Modalità A: titolo del pannello `Oscillatore del modo: potenziale V(Q) e densità P(x)` rispetto all’asse `V(x) [ħω]` e all’asse orizzontale `x / a_ho`; inoltre in `Bagno termico T` la legenda indica `P_n(x)` per la curva tratteggiata $n = 0$.
   - **Cosa mi avrebbe aiutato:** Usare uniformemente $x$ (o spiegare nel titolo $Q \equiv x$) e chiamare esplicitamente `P_0(x)` la curva tratteggiata di riferimento nel bagno termico.

3. **Accoppiamento semantico `k_3` ↔ `ω` nell’hover di `Formula viva` (Modalità B)**
   - **Dove:** `FORMULA VIVA` in Modalità B.
   - **Cosa è successo:** Passando il mouse su `k_3` si illuminano in verde anche `ω(k)` e `ν` (e viceversa passando su `ω` si illumina `k_3`), perché condividono lo stesso colore/gruppo semantico. I collegamenti per `k₁, k₂` (che evidenziano anche gli slider in basso) sono invece molto intuitivi.
   - **Cosa mi avrebbe aiutato:** Separare il gruppo semantico di $k_3$ da quello di $\omega,\nu$ (se possibile nella palette condivisa) oppure limitare l’evidenziazione agli elementi strettamente corrispondenti.

---

## 3. Le due cose che hanno aiutato di più a capire

1. **Il confronto simultaneo tra densità $P_n(x)$ / $P_{\mathrm{cl}}(x)$ e catena atomica animata anche a $n = 0$ (Modalità A):** vedere subito la regione di tunneling rosa al $15{,}7\%$ oltre $\pm x_{\mathrm{cl}}$ e contemporaneamente osservare gli atomi oscillare davvero attorno alle posizioni di equilibrio a $n=0$ (con $\Delta x_{\mathrm{zp}} = 0{,}043\text{ \AA}$) distrugge sul nascere l’idea che lo stato fondamentale significhi «cristallo fermo»; e passare a `Limite Bohr (n = 20)` rende immediata la transizione verso i picchi classici ai punti di inversione.
2. **La coppia 1BZ vettoriale + curva di dispersione $\nu(k)$ con frecce di velocità di gruppo $v_g$ e drag diretto (Modalità B):** trascinando la punta di $k_2$ oltre $+\pi/a$ si vede *nello stesso istante* scattare la freccia azzurra $G = -2\pi/a$ nella striscia superiore e saltare $k_3$ sul ramo sinistro della dispersione con la freccia $v_g$ che si gira da `→` a `←` (`flusso invertito`), rendendo fisicamente tangibile il significato di «Umklapp» («trasporto a ritroso»).

---

## 4. Verdetto finale

**da correggere**

*(La sezione è didatticamente già molto efficace e visivamente ben riuscita su tutti i misconcetti principali, ma richiede alcuni ritocchi mirati prima della chiusura: rimuovere la collisione del simbolo $x$ in $p_n(T)$, esplicitare nei blocchi aperti della guida il perché di $\mu = 0$ e del rinculo reticolare $-\hbar G$, chiarire la nota sul bilancio $\hbar\omega$ sul ramo 1D, correggere il taglio verticale di $P_0(x)$ a basse $\nu$/alte $T$ e verificare l’`IndexSizeError` in console.)*
