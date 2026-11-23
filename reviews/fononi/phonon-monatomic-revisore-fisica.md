# Revisione Fisica — Sezione 1: Catena monatomica e prima zona di Brillouin

- **Ruolo**: `revisore-fisica` (sola lettura su `src/`)
- **File esaminati**:
  - `src/renderer/src/physics/constants.ts`, `src/renderer/src/physics/constants.test.ts`
  - `src/renderer/src/physics/phononDispersion.ts`, `src/renderer/src/physics/phononDispersion.test.ts`
  - `src/renderer/src/sections/phonon-monatomic/` (`manifest.ts`, `store.ts`, `model.ts`, `formulas.ts`, `strings.ts`, `MonatomicChainView.tsx`, `PhononMonatomicSection.tsx`)
  - `src/renderer/src/viz/DispersionPlot.tsx` (in sola lettura per verificare la resa di sonda $v_p, v_g$, bande e linee di riferimento)
- **Fonti di riferimento**: `materiale/parte6/dispensa.pdf` (Lezione 1 §§1–5 pp. 2–13, Lezione 2 §6 pp. 14–16, Lezione 3 §13 pp. 31–34) e `materiale/parte6/riferimento-formule.md`.

---

## Problemi trovati (per gravità)

### Bloccanti
Nessuno. Tutte le equazioni fisiche, le conversioni di unità, i segni, il conteggio dei modi di Born–von Kármán e la stabilità numerica in `physics/phononDispersion.ts` e `physics/constants.ts` sono corretti e coerenti con la dispensa.

### Importanti

1. **In $k = 0$ il pannello valori stampa `v_p = 0,00 km/s · v_g = 0,00 km/s` (contraddizione con il limite acustico $\pm v_s$)**
   - **File e riga**: `src/renderer/src/sections/phonon-monatomic/PhononMonatomicSection.tsx:487-506` (con origine in `src/renderer/src/physics/phononDispersion.ts:164, 178`).
   - **Cosa è sbagliato**: Quando è attivo lo strumento «Sonda $v_p, v_g$» e lo stato selezionato è $k = 0$ (`sel.atOrigin === true`, raggiungibile direttamente con il pulsante rapido `k = 0`), il pannello «Valori» mostra in primo piano `v_p = 0,00 km/s · v_g = 0,00 km/s`, subito sopra la nota in piccolo «In $k = 0$ il profilo trasla rigidamente; per $k \to 0^+$ vale $v_p = v_g = v_s$.».
   - **Formula / fisica corretta e riferimento nella dispensa**: Nella dispensa Parte 6, Lezione 1 §3.2 (p. 8) e Lezione 2 §6.2 (p. 16), per $k \to 0$ si ha $v_p = \omega/k \to \pm v_s$ e $v_g = d\omega/dk \to \pm v_s$ (con $v_s = a\sqrt{C/M} \neq 0$). In $k = 0$ esatto $v_p = 0/0$ è una forma indeterminata (discontinuità di salto da $-v_s$ a $+v_s$) e $v_g = d\omega/dk$ non è definita perché $|\sin(ka/2)|$ ha un punto angoloso a V, **non** una tangente orizzontale. Stampare `v_g = 0,00 km/s` in $k = 0$ contraddice la nota sottostante e rischia di far confondere $k = 0$ con il bordo di zona $k = \pm\pi/a$ (dove $v_g = 0$ è davvero un massimo piatto / onda stazionaria).
   - **Nota sul fix suggerito**: Il grafico (`PhononMonatomicSection.tsx:290-291`, `showVp: !sel.atOrigin, showVg: !sel.atOrigin`) e la lunghezza d'onda (`PhononMonatomicSection.tsx:463-464`, `∞ (traslazione rigida)`) gestiscono già correttamente `sel.atOrigin`. Allo stesso modo, in `Values` per `sel.atOrigin` conviene non stampare `0,00 km/s`, ma mostrare solo la nota del limite $v_p, v_g \to \pm v_s$ (oppure un segnaposto `—` / `±v_s`). In `phononDispersion.ts`, il ritorno convenzionale `0` in $k = 0$ per disparità/assenza di `NaN` è documentato nei JSDoc, purché la UI non lo presenti come valore fisico «0,00 km/s».
   - **Come riprodurlo**: Attivare il pulsante «Sonda $v_p, v_g$» e cliccare il modo rapido `k = 0` (oppure trascinare fino a $k = 0$): nella sezione «Velocità (fase / gruppo)» del pannello laterale compaiono `v_p = 0,00 km/s · v_g = 0,00 km/s`.

### Minori

1. **Segno mancante nella nota di bordo zona `edgeVelNote` quando $k = -\pi/a$**
   - **File e riga**: `src/renderer/src/sections/phonon-monatomic/strings.ts:99` e `PhononMonatomicSection.tsx:491-503`.
   - **Cosa è sbagliato**: A $k = -\pi/a$ (`kFrac = -1`), il valore numerico sopra la nota mostra correttamente `v_p = -2,20 km/s` (segno negativo, coerente con $v_p = \omega/k$ per $k < 0$), ma la nota subito sotto recita `v_p = \omega_{\max}a/\pi = \frac{2}{\pi}v_s \neq 0` senza segno $\pm$ né valore assoluto $|v_p|$.
   - **Riferimento nella dispensa**: Lezione 1 §3.3 (p. 8) e Riepilogo p. 12 trattano il bordo positivo $k = +\pi/a$; poiché la UI permette di selezionare anche $k = -\pi/a$, scrivere $|v_p| = \omega_{\max}a/\pi = \frac{2}{\pi}v_s \neq 0$ (o adattare il segno a `sel.kFrac < 0`) rende la nota coerente su entrambi i bordi.
   - **Come riprodurlo**: Attivare «Sonda $v_p, v_g$» e selezionare $k = -\pi/a$ (`kFrac = -1`).

2. **Profilo continuo $u(x, t)$ scorrevole al bordo di zona $k = \pm\pi/a$ nella vista catena**
   - **File e riga**: `src/renderer/src/sections/phonon-monatomic/MonatomicChainView.tsx:256, 316` e `strings.ts:76`.
   - **Cosa si osserva**: Al bordo di zona $k = \pi/a$, gli spostamenti sugli atomi `samples` e i pallini campionati eseguono correttamente l'onda stazionaria esatta $u_n(t) = (-1)^n \cos\varphi$ (atomi in opposizione di fase che oscillano sul posto, non fermi). La curva continua superiore $u(x, t) = \cos(\frac{\pi}{a}x - \varphi)$ trasla invece verso destra a velocità di fase $v_p = (2/\pi)v_s \neq 0$ (e con Aliasing attivo la curva tratteggiata $k' = -\pi/a$ trasla verso sinistra, intersecando la prima esattamente sugli atomi). Matematicamente è la parte reale esatta dell'onda piana $e^{i(kx-\omega t)}$ e mostra bene la distinzione tra portante continua ($v_p \neq 0$) e campionamento discreto stazionario; tuttavia, accanto all'etichetta «onda stazionaria» (`strings.ts:76`), vedere scorrere la sinusoide superiore può spiazzare momentaneamente uno studente che si aspetta un profilo fisso («il profilo spaziale non si muove», dispensa §3.3 p. 8). Non è un errore fisico: segnalato solo per consapevolezza didattica.
   - **Come riprodurlo**: Selezionare il modo rapido `π/a` con l'animazione attiva.

3. **Copertura test unitari in `phononDispersion.test.ts` per casi ausiliari**
   - **File e riga**: `src/renderer/src/physics/phononDispersion.test.ts:1-207`.
   - **Cosa manca**: I test esistenti verificano bene i numeri di riferimento della dispensa e i limiti principali, ma non testano direttamente:
     - la periodicità di `monatomicGroupVelocity(k + mG, p) === monatomicGroupVelocity(k, p)` fuori dalla 1BZ e i punti angolosi $k = 0, \pm G$;
     - `velocityMsToMevAngstrom` (`phononDispersion.ts:195-197`);
     - il rifiuto di parametri non validi (`a <= 0`, `M <= 0`, `C <= 0`, `NaN`) in `assertMonatomicParams` (che peraltro non rigetta `Infinity`, pur non raggiungibile dagli slider).

---

## Cosa ho verificato davvero

1. **Suite di test Vitest** (`$env:PATH = "$PWD\.tools\node;$env:PATH"; npm.cmd test`):
   - **19/19 file passati, 156/156 test passati** (inclusi `constants.test.ts` 2/2 e `phononDispersion.test.ts` 8/8).
2. **Costanti fisiche e conversioni (`constants.ts`)**:
   - Verificate tutte le costanti CODATA 2018 (`HBAR_J_S`, `KB_J_K`, `KB_EV_K`, `AMU_KG`, `NA_MOL`, `R_GAS`, `C_LIGHT_M_S`, `THZ_TO_MEV = 4.135667696`, `RAD_S_TO_THZ = 1/(2π·10¹²)`) e le funzioni `radSToThz`, `radSToMev`, `thzToMev`, `mevToThz`, `amuToKg`. Nessun fattore $2$, $2\pi$ o $\hbar$ mancante.
3. **Equazioni fisiche e formule vive (`phononDispersion.ts`, `formulas.ts`, `strings.ts`)**:
   - Confronto riga per riga con `materiale/parte6/dispensa.pdf`:
     - Equazione del moto (eq. 6, p. 6): $M\ddot{u}_n = C(u_{n+1}+u_{n-1}-2u_n)$ — esatta.
     - Relazione di dispersione (eq. 8, p. 7): $\omega(k) = 2\sqrt{C/M}|\sin(ka/2)|$ — esatta, pari e periodica di periodo $G = 2\pi/a$.
     - Velocità del suono (eq. 9, p. 8): $v_s = a\sqrt{C/M}$ e $\omega_{\max} = 2\sqrt{C/M}$ — esatte.
     - Velocità di gruppo $v_g(k) = v_s\cos(ka/2)\operatorname{sgn}(\sin(ka/2))$ (coincidente con $v_s\cos(ka/2)\operatorname{sgn}(k)$ in 1BZ, §3.3 p. 8 e §16 p. 40) — verificata numericamente in Python contro la derivata centrale $d\omega/dk$ su $[-2\pi/a, 2\pi/a]$ (errore relativo massimo $1{,}39\times 10^{-10}$) e verificata la periodicità $v_g(k + G) = v_g(k)$ e l'annullamento esatto a $k = \pm\pi/a$.
     - Velocità di fase $v_p(k) = \omega(k)/k$ — esatta per $k \neq 0$, con $v_p(\pm\pi/a) = \pm\frac{2}{\pi}v_s \neq 0$.
     - Pendenza sul grafico $\nu(k)$ (`velocityMsToThzAngstrom` e `soundSlopeThzA` / `slopeVgThzA` in `model.ts` e `PhononMonatomicSection.tsx`): verificata l'identità $d\nu[\text{THz}]/dk[\text{Å}^{-1}] = (v_g[\text{m/s}]/10^{-10}) / (2\pi\cdot 10^{12})$. La retta acustica tratteggiata $\omega = v_s|k|$ e la tangente $v_g$ hanno la pendenza esatta sul grafico $\nu(k)$.
     - Decadimento evanescente per $\omega > \omega_{\max}$ (§3.4, p. 8): $\cosh(\kappa a) = 2(\omega/\omega_{\max})^2 - 1$, verificato in Python che $M\omega^2 = 2C[1 + \cosh(\kappa a)]$ con errore relativo $< 10^{-13}$ per $\omega/\omega_{\max} \in \{1{,}0001,\, 1{,}1,\, 1{,}5,\, 5{,}0\}$.
     - Aliasing (§4.1, pp. 9–10): verificato che $k' = k + mG$ dà identica $\omega$ e identici spostamenti $u_n(t) = \cos(kna - \varphi)$ per ogni fase $\varphi$ (compresi i casi $k = 0$ con $k' = +G$, $k = +\pi/a$ con $k' = -\pi/a$, e $k = 0{,}5\pi/a$ con $k' = -1{,}5\pi/a$).
     - Condizioni periodiche di Born–von Kármán (Lezione 3 §13, eqq. 31–32, pp. 32–33): verificato in Python per tutti gli $N \in [4, 24]$ che `bvkAllowedK1D` produce esattamente $N$ modi strettamente in $(-\pi/a, \pi/a]$ ($j \in [-N/2+1, N/2]$ per $N$ pari; $j \in [-(N-1)/2, (N-1)/2]$ per $N$ dispari) e soddisfa l'ortogonalità $\sum_{n=0}^{N-1} e^{i(k_j - k_{j'})na} = N\delta_{j,j'}$.
4. **Calcoli numerici indipendenti in Python**:
   - Metallo tipico §3 ($M = 1{,}05\times 10^{-25}\text{ kg}$, $a = 2{,}5\text{ Å}$, $C = 20\text{ N/m}$): $\sqrt{C/M} = 1{,}3801\times 10^{13}\text{ s}^{-1}$, $v_s = 3450{,}3\text{ m/s}$, $\omega_{\max} = 2{,}7603\times 10^{13}\text{ rad/s}$, $\nu_{\max} = 4{,}393\text{ THz}$, $\hbar\omega_{\max} = 18{,}17\text{ meV}$, $v_p(\pi/a) = 2196{,}6\text{ m/s}$. Con il preset arrotondato allo step dello slider ($M = 63{,}2\text{ u} = 1{,}0495\times 10^{-25}\text{ kg}$), la differenza relativa sulle frequenze è $0{,}025\%$ (identico su tutte le cifre mostrate in UI).
   - Preset illustrativi («Piombo 1D» $v_s = 1{,}46\text{ km/s}, \nu_{\max} = 1{,}33\text{ THz}$; «Carbonio 1D» $v_s = 13{,}44\text{ km/s}, \nu_{\max} = 21{,}39\text{ THz}$) ed estremi degli slider ($a \in [2, 6]\text{ Å}$, $M \in [6, 210]\text{ u}$, $C \in [2, 100]\text{ N/m}$): tutti i valori sono finiti, privi di `NaN`/`Infinity`, e la velocità angolare visiva `visOmega` in `MonatomicChainView.tsx` resta ben scalata e non blocca mai gli atomi al bordo di zona.
5. **Rappresentazione sull'anello di Born–von Kármán (`MonatomicChainView.tsx:449-608`)**:
   - Verificato che gli $N$ atomi numerati $1 \dots N$ in senso orario oscillano con $u_n(t) = \cos(2\pi jn/N - \varphi)$ (propagazione concorde col segno di $j$, onda stazionaria per $j = N/2$ con $N$ pari, traslazione rigida tangenziale per $j = 0$, raccordo continuo tra atomo $N$ e atomo $1$).

## Cosa non ho potuto verificare

- Non ho avviato il server `dev:web` né ispezionato visivamente la sezione in un browser/Electron in esecuzione: la verifica di `MonatomicChainView.tsx`, `PhononMonatomicSection.tsx` e `DispersionPlot.tsx` è stata svolta per analisi statica del codice e calcoli numerici indipendenti (la verifica visiva nel browser spetta a `critico-grafico` e `studente`).

---

## Verdetto

**da correggere** — Il nucleo fisico (`constants.ts`, `phononDispersion.ts`, test e formule) è solido e fedele alla dispensa; prima della chiusura della sezione va corretto il problema **Importante** in `PhononMonatomicSection.tsx:487-506` affinché in $k = 0$ con la sonda $v_p, v_g$ attiva non venga stampato `v_p = 0,00 km/s · v_g = 0,00 km/s` (consigliabile correggere contestualmente anche il segno della nota `edgeVelNote` a $k = -\pi/a$).
