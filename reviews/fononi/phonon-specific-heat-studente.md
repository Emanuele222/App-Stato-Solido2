# Revisione Studente — Fononi: «Calore specifico e Debye» (`phonon-specific-heat`)

**Profilo:** Studente del 3° anno di fisica / ingegneria (meccanica quantistica e termodinamica/statistica di base; nessuna conoscenza pregressa di stato solido oltre a quanto mostrato nella sezione).

> **Nota metodologica (verifica browser non disponibile):** Il subagent `browser` non è risultato invocabile in questo ambiente (`subagent "browser" not found or not allowed to be invoked`) e l'indirizzo locale `http://127.0.0.1:5173/` non è risultato raggiungibile dalla sandbox. Come previsto dalla procedura di ripiego in `.agents/skills/studente/SKILL.md`, la revisione è stata svolta esaminando esclusivamente i testi, le formule vive, i parametri e la logica visibile dei pannelli (`strings.ts`, `formulas.ts`, `manifest.ts`, `store.ts`, `model.ts`, `PhononSpecificHeatSection.tsx`, `SpecificHeatCurveView.tsx`, `SpectrumDebyeView.tsx`, `theme.ts`). La resa visiva effettiva nel browser (1440 / 1100 / 800 px), eventuali sovrapposizioni dinamiche, la fluidità di hover/drag e la console JS **non** sono state verificate dal vivo.

---

## 1. Spiegazione del concetto in 5 righe (con parole mie)

1. Nel modello classico di Dulong–Petit (1819), ciascuno dei $3N$ oscillatori reticolari di una mole ha energia media $k_B T$, quindi $C_V = 3R \approx 24{,}94\text{ J/(mol·K)}$ costante: funziona vicino a $273\text{ K}$, ma raffreddando a $77\text{ K}$ tutti i solidi (inclusi i semiconduttori come il silicio, quindi non è colpa degli elettroni) scendono verso zero.
2. Einstein (1907) applica la quantizzazione di Bose–Einstein ($\mu = 0$) e ottiene la caduta verso zero, ma sbaglia a bassa $T$ **non** perché sia classico, bensì perché assegna a tutti i $3N$ modi la stessa frequenza $\omega_E$: per $k_B T \ll \hbar\omega_E$ i modi si congelano tutti insieme e $C_V^{\mathrm{E}}$ crolla esponenzialmente.
3. Debye (1912) restituisce ai fononi la dispersione acustica $\omega = v_s k$ (3 rami: $1\text{ LA} + 2\text{ TA}$) con densità degli stati $g(\omega) \propto \omega^2$ fino al taglio $\omega_D$ che fissa a $3N$ i modi totali; così a bassa $T$ restano accesi i modi con $\hbar\omega \lesssim k_B T$, dentro una «sfera termica» di raggio $k_T \propto T$ dentro la sfera di Debye $k_D$.
4. Il rapporto dei volumi nello spazio $\mathbf{k}$ è $(k_T/k_D)^3 = (T/\Theta_D)^3$ e, poiché ogni modo eccitato contribuisce $\sim k_B$ al calore specifico ($U_{\mathrm{term}} \propto T^4$), $C_V^{\mathrm{D}}$ segue la legge $T^3$ per $T \ll \Theta_D$, distinguendo solidi rigidi/leggeri (Diamante, $\Theta_D = 2230\text{ K}$, già congelato a $77\text{ K}$ a $\sim 0{,}08$) da solidi pesanti/molli (Piombo, $\Theta_D = 105\text{ K}$, quasi classico a $77\text{ K}$).
5. Oltre Debye (1953), un reticolo reale mostra singolarità di Van Hove dove $v_g \to 0$ ai bordi di zona (e una catena 1D ha $g_{\mathrm{1D}}$ costante a $\omega \to 0$, dando $C_V \propto T$ anziché $T^3$), mentre a bassissime $T$ il gas di fononi segue una legge $T^4$ analoga al corpo nero dei fotoni ma con fattore $3/2$ ($3$ polarizzazioni contro $2$).

---

## 2. Problemi riscontrati (in ordine di gravità)

### Bloccante
Nessun problema bloccante emerso dall'analisi di testi, formule e logica dei pannelli *(resta da confermare l'esecuzione live nel browser, non verificata qui)*.

### Importante

1. **Scala verticale contraddittoria in `1907 Einstein`: asse chiamato `Peso E(ħω/k_B T)` con tick `1, 2, 3` ma curva disegnata a `2,7`**
   - **Dove:** Pannello inferiore sinistro dello spettro nella tappa `1907 Einstein` (`SpectrumDebyeView.tsx:171, 218, 441`).
   - **Cosa succede:** Quando si sceglie la tappa `1907 Einstein`, il titolo dell'asse verticale diventa `Peso $E(ħω/k_B T)$` (usando `E` invece di `\mathcal{E}` presente in legenda e in `Formula viva`) e i tick restano `1, 2, 3` (`yMaxAxis = 3.25`). Tuttavia la curva tratteggiata del peso termico $\mathcal{E}(\hbar\omega/k_B T) \in [0, 1]$ viene moltiplicata per `weightTop = 2.7` (e il picco $\delta(\omega - \omega_E)$ arriva a `2.75`): quindi a $\omega = 0$, dove $\mathcal{E}(0) = 1$, la curva passa a quota `2,7` su un asse che mostra `1, 2, 3`! Anche nelle tappe `1912 Debye` e `Confronto completo` (dove l'asse è `$g(\omega)$ norm.`), la curva tratteggiata del peso $\mathcal{E}$ è scalata su `0..2.7` senza alcuna scala `0..1` visibile.
   - **Cosa mi avrebbe aiutato:** In `1907 Einstein`, portare l'asse Y a `[0, 1]` con etichetta coerente `Peso ℰ(ħω/k_B T)` (o mostrare solo `0` e `1`), e nelle viste con `$g(\omega)$ norm.` aggiungere una piccola scala `0..1` sul bordo destro (o una nota chiara) per il peso termico sovrapposto.

2. **Simbolo $w$ nella formula principale di `Confronto completo` mai definito sullo schermo**
   - **Dove:** `Formula viva` nella tappa `Confronto completo` (`formulas.ts:35`: `${CV}(${T}) = ${threeR}\int_0^1 3w^2\,\mathcal{E}(w\Theta_D/T)\,\mathrm{d}w`), rispetto all'asse X dello spettro (`SpectrumDebyeView.tsx:223`: `ω / ω_D`) e a `Guida alla sezione` + `Dettagli formali` (`strings.ts:195-240`).
   - **Cosa succede:** Uno studente che passa a `Confronto completo` legge l'integrale in $\mathrm{d}w$ con $3w^2$, ma la variabile adimensionale $w = \omega / \omega_D$ non è definita in nessuno dei testi visibili della sezione (né in `Formula viva`, né nei blocchi aperti, né in `Dettagli formali`, né sull'asse dello spettro).
   - **Cosa mi avrebbe aiutato:** Aggiungere esplicitamente `$w = \omega/\omega_D$` nelle formule secondarie di `Confronto completo` o in una frase di `L'idea` (e magari indicare `w = \omega/\omega_D` sull'asse orizzontale dello spettro).

3. **Passaggio implicito tra frazione dei modi $(T/\Theta_D)^3$ e legge $C_V \propto T^3$ in `1912 Debye`**
   - **Dove:** `Guida alla sezione` → `L'idea` della tappa `1912 Debye` (`strings.ts:159`).
   - **Cosa succede:** Il testo dice: *«la sfera di Debye di raggio $k_D$ contiene la «sfera termica» dei modi accesi ($\hbar\omega \lesssim k_B T$), di raggio $k_T \propto T$: il rapporto dei volumi vale $(T/\Theta_D)^3$ e spiega la legge $T^3$!»*. Uno studente del 3° anno può chiedersi al volo: «Ma se il numero di modi accesi va come $T^3$, l'energia $U \sim N_{\mathrm{att}} k_B T$ non dovrebbe andare come $T^4$? E allora perché $C_V$ va come $T^3$ e non $T^2$?» La risposta c'è (ciascun modo acceso contribuisce $\sim k_B$ a $C_V$, cioè $U \propto T^4 \Rightarrow C_V = \partial U/\partial T \propto T^3$), ma va detta esplicitamente.
   - **Cosa mi avrebbe aiutato:** Esplicitare in mezza frase che ogni modo termicamente eccitato porta $\sim k_B$ al calore specifico (ovvero $U_{\mathrm{term}} \propto (T/\Theta_D)^3 \cdot T \propto T^4$), cosicché la legge $T^3$ di $C_V$ discende direttamente dal rapporto di volume $(T/\Theta_D)^3$.

4. **Valori sperimentali di Na ($27{,}6$) e Pb ($26{,}7$) sopra il limite classico $3R$ non motivati nei blocchi aperti**
   - **Dove:** Grafico $C_V(T)$ e tabella `Dati Tab. 2` con preset `Piombo (Pb, 105 K)` o `Sodio (Na, 158 K)`, rispetto ai blocchi aperti (`strings.ts:115-214`).
   - **Cosa succede:** A $273\text{ K}$ i rombi gialli stanno chiaramente *sopra* la linea di Dulong–Petit `3R = 24,94 J/(mol·K)`. Nei tre blocchi aperti della guida non si accenna mai al motivo per cui un dato reale possa superare $3R$: la spiegazione (anarmonicità, contributo elettronico, differenza $C_P - C_V$) compare solo al punto (5) dentro il riquadro collassato `Dettagli formali` (`strings.ts:237`). Chi non lo apre rischia di pensare a un errore del grafico o del limite classico.
   - **Cosa mi avrebbe aiutato:** Una frase breve in `Come intervengono i parametri` di `1819 Dulong–Petit` (o `Confronto completo`) che anticipi che valori poco sopra $3R$ (come Pb o Na a $273\text{ K}$) derivano da effetti anarmonici e da $C_P - C_V$.

5. **Collisione semantica di `q=k` sull'hover e mancata evidenziazione su $C_V(T)$ quando si punta `Θ_D`**
   - **Dove:** Collegamenti `\htmlData{q=...}` e reazione dei due grafici (`formulas.ts`, `PhononSpecificHeatSection.tsx:335`, `SpecificHeatCurveView.tsx:456`, `SpectrumDebyeView.tsx:463, 704`).
   - **Cosa succede:**
     - L'id `k` colora e illumina contemporaneamente tre oggetti concettualmente distinti: il raggio termico $k_T$, la soglia energetica $\hbar\omega = k_B T$, e i **dati sperimentali `Dati Tab. 2`**! Passando il mouse su `k_T` nella formula di `Confronto completo`, si accendono i rombi gialli dei dati sperimentali sul grafico in alto, mentre l'area rossa della sfera termica (legata a `q=T`) si attenua.
     - Passando il mouse su `\Theta_D` in `Formula viva` o sullo slider `Θ_D`, nel pannello superiore $C_V(T)$ si attenuano *tutte* le curve (anche quella di Debye), dando visivamente l'idea che $\Theta_D$ non influisca su $C_V^{\mathrm{D}}(T)$.
   - **Cosa mi avrebbe aiutato:** Evitare che i dati sperimentali Tab. 2 condividano lo stesso id di $k_T$, e mantenere accesa la curva $C_V^{\mathrm{D}}$ (o evidenziare la variazione rispetto a $\Theta_D$) quando è evidenziato `Theta`.

6. **Incoerenze nella tappa `1953 Oltre Debye`: titolo asse `ω / ω_D` con tick `ω_max` e velocità del suono nascosta**
   - **Dove:** Pannello inferiore in `1953 Oltre Debye` (`SpectrumDebyeView.tsx:199, 223, 562`; `model.ts:96, 168`).
   - **Cosa succede:**
     - Nel grafico della DOS a sinistra il tick `1` è correttamente etichettato `\omega_{\max}`, ma il titolo dell'asse orizzontale sotto resta `ω / ω_D` (`SpectrumDebyeView.tsx:223`), mescolando i due simboli.
     - Nel riquadro destro (`Corpo nero T⁴`) viene stampato `$u_{ph} = ... J/m³$` (senza tilde, mentre `Formula viva` usa `\tilde{u}_{\mathrm{ph}}`), calcolato con una velocità del suono `approxSoundSpeedMS` (o `3800 m/s` in modalità `Libero`) mai mostrata a schermo, e senza mostrare $\tilde{u}_\gamma$ alla stessa $T$. Inoltre nella vista `1953 Oltre Debye` manca nei testi aperti la precisazione che per la curva `Catena 1D` si è posto $\hbar\omega_{\max}/k_B = \Theta_D$.
   - **Cosa mi avrebbe aiutato:** Etichettare l'asse `ω / ω_max` nella tappa 1953, uniformare `\tilde{u}_{ph}`, esplicitare nel riquadro destro il valore di $v_s$ usato e ricordare in una riga la convenzione usata per confrontare la catena 1D sullo stesso asse.

### Minore

1. **Controlli e grafici non attivi in alcune tappe**
   - **Dove:** Barra parametri e spettro in `1819 Dulong–Petit` e `1953 Oltre Debye` (`PhononSpecificHeatSection.tsx:79-95`, `SpectrumDebyeView.tsx:233-275, 619-630`).
   - **Cosa succede:** Nella prima tappa storica (`1819 Dulong–Petit`), sullo schermo compaiono già gli slider `Θ_D` e `Θ_E/Θ_D`, `Taglio di Debye ν_D` nella tabella valori, la parabola tratteggiata $g(\omega)$ di Debye e la `Sfera di Debye (spazio k)` prima che Debye sia stato introdotto e senza che la guida 1819 spieghi cosa siano $g(\omega)$ o la sfera di Debye. Analogamente, in `1953 Oltre Debye` lo slider `Θ_E/Θ_D` rimane modificabile anche se Einstein non compare in nessuno dei due grafici.
   - **Cosa mi avrebbe aiutato:** Una breve nota in `1819 Dulong–Petit` (o disabilitare/attenuare gli slider non rilevanti per la tappa corrente).

2. **Selezione del preset `Diamante` e ricerca del punto sperimentale a `77 K`**
   - **Dove:** Menu `Materiale` (`store.ts:119-140`, `SpecificHeatCurveView.tsx`).
   - **Cosa succede:** Cambiando materiale (es. da `Rame` o `Piombo` dopo aver alzato $T$ a $300\text{ K}$) e scegliendo `Diamante (C, 2230 K)`, `T` resta al valore precedente (scelta utile per confrontare materiali alla stessa $T$); tuttavia in scala `Lineare` il punto sperimentale del diamante (`77 K: 0,08 J/(mol·K)`) è così vicino a zero ($0{,}3\%$ di $3R$) che si distingue bene solo passando a `Log–Log` e riportando $T$ vicino a $77\text{ K}$.
   - **Cosa mi avrebbe aiutato:** Va bene mantenere $T$ tra materiali diversi, ma in `Cosa provare` di `1819 Dulong–Petit` o `1912 Debye` può essere utile ricordare allo studente di passare in `Log–Log` (e impostare $T = 77\text{ K}$) per vedere davvero il punto `0,08` del diamante separarsi dall'asse.

3. **Piccoli dettagli di testo e simbolo**
   - **Dove:** `strings.ts:171, 185`; `SpectrumDebyeView.tsx:631-657`.
   - **Cosa succede:**
     - In `1912 Debye → Cosa provare` l'asintoto $T^3$ è chiamato «retta verde **tratteggiata**», mentre su grafico e legenda è **punteggiata** (`[2, 4]`, `dotted`).
     - In `1907 Einstein` il pannello destro resta intitolato `Sfera di Debye (spazio k)` e disegna un guscio circolare con etichetta `ω_E`: per uno studente pignolo, gli oscillatori di Einstein sono locali/indipendenti (senza relazione $\omega(k)$ in spazio $\mathbf{k}$).
     - In `1953 Oltre Debye → Come intervengono i parametri` i simboli `\tilde{u}_{ph}` e `\tilde{u}_\gamma` sono usati prima di dire a parole che indicano le densità di energia (il nome compare in `Dettagli formali`).
   - **Cosa mi avrebbe aiutato:** Allineare «punteggiata» nel testo, titolare il pannello destro in Einstein `Spazio dei modi (singola ω_E)` e scrivere «le densità di energia $\tilde{u}_{\mathrm{ph}}$ e $\tilde{u}_\gamma$».

---

## 3. Le due cose che hanno aiutato di più a capire

1. **L'accoppiamento simultaneo tra spettro $g(\omega)$ pesato da $\mathcal{E}(\hbar\omega/k_B T)$, soglia mobile $\hbar\omega = k_B T$ e sfera di Debye ($k_T$ dentro $k_D$):** vedere il singolo picco $\delta(\omega - \omega_E)$ svuotarsi di colpo sotto la soglia termica in `1907 Einstein`, e subito dopo vedere in `1912 Debye` la parabola $g(\omega) \propto \omega^2$ continuare a popolare i modi acustici a bassa frequenza mentre la sfera termica $k_T$ si restringe gradualmente al centro, chiarisce in modo immediato sia perché Einstein fallisce (frequenza unica, non «classico») sia l'origine geometrica della legge $T^3$.
2. **Il confronto tra scala `Lineare` e `Log–Log` con i dati sperimentali reali di Tab. 2 e preset estremi (`Piombo`, `Rame`, `Diamante`):** in `Lineare` si coglie la saturazione a $3R$ e il crollo a $77\text{ K}$ (con il silicio che smentisce un effetto puramente elettronico), mentre in `Log–Log` la retta asintotica di pendenza $3$ di Debye rispetto al precipizio esponenziale di Einstein e alla pendenza $1$ della catena 1D rende evidente anche la differenza qualitativa tra i modelli.

---

## 4. Verdetto finale

**da correggere**

*(La sezione è didatticamente ben strutturata, con un'ottima progressione storica in 5 tappe, testi chiari nei tre blocchi aperti e risposte dirette ai due misconcetti principali su Einstein e sulla legge $T^3$ di Debye; servono però alcuni ritocchi mirati — soprattutto la scala coerente `0..1` per `Peso ℰ` in Einstein, la definizione visibile di $w = \omega/\omega_D$ in `Confronto completo`, il ponte esplicito tra frazione di volume $(T/\Theta_D)^3$ e $C_V \propto T^3$, la nota nei blocchi aperti sui punti sperimentali sopra $3R$, e la pulizia di `ω / ω_max` e $\tilde{u}_{\mathrm{ph}}$ in `1953 Oltre Debye` — oltre a una verifica live nel browser che non è stato possibile eseguire in questa sessione.)*
