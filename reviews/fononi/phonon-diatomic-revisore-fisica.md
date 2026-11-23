# Revisione Fisica — Sezione 2: Catena biatomica, gap fononico e luce infrarossa

- **Ruolo**: `revisore-fisica` (sola lettura su `src/`)
- **File esaminati**:
  - `src/renderer/src/physics/constants.ts`, `src/renderer/src/physics/index.ts`
  - `src/renderer/src/physics/phononDispersion.ts` (righe 347–918)
  - `src/renderer/src/physics/phononDispersion.test.ts` (righe 241–495)
  - `src/renderer/src/sections/phonon-diatomic/` (`manifest.ts`, `store.ts`, `model.ts`, `formulas.ts`, `strings.ts`, `DiatomicChainView.tsx`, `PhononDiatomicSection.tsx`, `phonon-diatomic.css`)
  - `src/renderer/src/viz/DispersionPlot.tsx` (in sola lettura per verificare la resa della retta luce IR, fasce di gap e rami)
- **Fonti di riferimento**: `materiale/parte6/dispensa.pdf` (Lezione 2 §§6–8 pp. 14–23, §9.2 p. 25, §10.3 p. 27, §12 pp. 29–30; Lezione 3 §13.5 p. 34; Lezione 4 §24 pp. 59–60, §26 pp. 62–63) e `materiale/parte6/riferimento-formule.md`.

---

## Problemi trovati (per gravità)

### Bloccanti
Nessuno. Tutte le equazioni fisiche (relazione di dispersione $\omega_\mp(k)$, limiti $k \to 0$ e $k = \pm\pi/a$, gap fononico, limite $M = m$, simmetria $m > M$, velocità di gruppo $v_g < 0$ sul ramo ottico, velocità di fase $v_p$, ampiezza del centro di massa $R_{\mathrm{cm}}$, matrice dinamica $2\times 2$ e incrocio con la luce infrarossa), i segni, le unità di misura e la rappresentazione animata in spazio reale sono corretti e coerenti con la dispensa.

### Importanti
Nessuno. Anche tutti i casi delicati di interfaccia (punti angolosi a $k = 0$ acustico e a $k = \pm\pi/a$ con $M = m$, divergenza $v_p \to \infty$ a $k = 0$ ottico, scambio dei ruoli di $M$ e $m$ quando $m > M$, assenza di dipolo IR per $M = m$, e coerenza di segno tra cariche ioniche e dipolo oscillante) sono gestiti senza contraddizioni fisiche.

### Minori

1. **Cancellazione numerica di `det` in `diatomicDynamicalMatrix` per $|k| \lesssim 10^{-5}\,\pi/a$**
   - **File e riga**: `src/renderer/src/physics/phononDispersion.ts:833-837`.
   - **Cosa è sbagliato**: Il determinante della matrice dinamica $2\times 2$ è calcolato per sottrazione diretta `detRaw = d11 * d22 - d12 * d12` e azzerato sotto la soglia `1e-14 * d11 * d22`. Poiché $D_{11}D_{22} - D_{12}^2 = \frac{4C^2}{Mm}(1 - \cos^2\frac{ka}{2}) = \frac{4C^2}{Mm}\sin^2\frac{ka}{2}$, per $k$ molto piccolo si ha cancellazione catastrofica: su Na–Cl, l'errore relativo su $\omega_-$ dalla matrice dinamica è $3{,}3\times 10^{-7}$ a $k = 10^{-5}\pi/a$ (ordine di $k_{\mathrm{luce}}$), $2{,}7\times 10^{-3}$ a $k = 10^{-7}\pi/a$, e $\omega_-$ viene troncata esattamente a `0` per $|k| \lesssim 6{,}4\times 10^{-8}\pi/a$.
   - **Formula corretta e riferimento**: Dispensa Lezione 2 §10.3 (p. 27): $\det\mathbf{D}(k) = \frac{4C^2}{Mm}\sin^2\frac{ka}{2} = D_{11}D_{22}\sin^2\frac{ka}{2}$. Calcolare `det = d11 * d22 * sinHalf * sinHalf` evita ogni cancellazione mantenendo la diagonalizzazione indipendente dall'eq. (20). Non ha alcun effetto in UI (dove $k$ ha passo macroscopico e in $k = 0$ esatto vale $\det = 0$).
   - **Come riprodurlo**: Chiamare `diatomicDynamicalMatrix(1e-8 * Math.PI / 5.64, NACL_PAIR)`: `omegasRadS[0]` restituisce `0` anziché $2{,}254\times 10^5\text{ rad s}^{-1}$.

2. **Commento JSDoc di `cmAmp` non aggiornato e notazione compatta in UI per $R_{\mathrm{cm}}$**
   - **File e riga**: `src/renderer/src/physics/phononDispersion.ts:437-441` (vs implementazione a righe `754-759`) e `src/renderer/src/sections/phonon-diatomic/PhononDiatomicSection.tsx:627-629`.
   - **Cosa è sbagliato**: Il JSDoc dell'interfaccia `DiatomicModeAmplitude.cmAmp` cita ancora la formula valida solo a $k = 0$, `(M·ampM + m·ampm)/(M + m) per il profilo a k = 0`, mentre l'implementazione calcola correttamente per ogni $k$ il modulo esatto $|M\cdot\mathrm{amp}_M + m\cdot\mathrm{amp}_m e^{-ika/2}|/(M+m)$. Nel pannello «Valori» (`PhononDiatomicSection.tsx:628`), per $R_{\mathrm{cm}} \neq 0$ compare `R_cm = 0,61` senza indicazione esplicita che si tratta dell'ampiezza normalizzata adimensionale $|R_{\mathrm{cm}}|/u_{\max} \in [0, 1]$ (l'assenza di unità in Å potrebbe sorprendere un lettore attento).
   - **Riferimento nella dispensa**: Lezione 2 §8.1 (p. 21, Esempio slide 43): $R_{\mathrm{cm}} = (Mu_n + mu_{n-1})/(M+m)$.
   - **Come riprodurlo**: Selezionare un modo con $k \neq 0$ (es. `C (π/a)` su Na–Cl): il pannello mostra `R_cm = 0,61`.

3. **Stenografia $\alpha = u_{n-1}/u_n$ applicata a $k$ generico nella formula viva**
   - **File e riga**: `src/renderer/src/sections/phonon-diatomic/formulas.ts:45` e `src/renderer/src/sections/phonon-diatomic/strings.ts:126`.
   - **Cosa si osserva**: La formula viva scrive $\alpha = \frac{u_{n-1}}{u_n} = \frac{2C - \omega^2 M}{2C\cos(ka/2)}$. Nell'ansatz con fase sulla posizione reale (eqq. 15–16, dispensa p. 18), $u_n(t) = A e^{i(kna/2 - \omega t)}$ e $u_{n-1}(t) = \alpha A e^{i(k(n-1)a/2 - \omega t)}$, per cui il rapporto degli spostamenti complessi è $u_{n-1}(t)/u_n(t) = \alpha e^{-ika/2}$ (e il rapporto degli spostamenti reali dipende dal tempo), mentre $\alpha$ è propriamente il rapporto delle *ampiezze* $A_m/A_M$ (che coincide con $u_{n-1}/u_n$ a $k = 0$ e ha modulo uguale per ogni $k$). La scrittura riprende la tabella di `riferimento-formule.md:21` e la notazione $1/\alpha = u_n/u_{n-1} = 0$ della dispensa p. 22: è quindi coerente con i riferimenti del progetto, ma conviene tenerne conto in eventuali affinamenti didattici.
   - **Come riprodurlo**: Osservare il blocco «Formula viva» nella colonna destra (`formulas.ts:45`).

4. **Ordinata del marcatore d'incrocio IR esagerato valutata a $\nu_+(0)$ anziché $\nu_+(k_{\mathrm{vis}})$**
   - **File e riga**: `src/renderer/src/sections/phonon-diatomic/PhononDiatomicSection.tsx:197-210`.
   - **Cosa è sbagliato**: Con «Luce infrarossa» attiva, il punto d'incrocio visivo sulla retta esagerata a $k_{\mathrm{vis}} = 0{,}09\,\pi/a$ usa `yCross = model.summary.freqOpticalZeroThz` ($\nu_+(0)$) anziché $\nu_+(k_{\mathrm{vis}})$. Poiché il ramo ottico scende leggermente allontanandosi da $k = 0$, il pallino giace appena sopra la curva ($\Delta\nu/\nu_+(0) = 0{,}24\%$ per Na–Cl e $0{,}25\%$ per $M = m$, ovvero $< 1\text{ px}$ sul grafico). Usare `radSToThz(diatomicOmega(kVis, 'optical', model.params))` lo collocherebbe esattamente sulla curva (come in Fig. 28, p. 60).
   - **Come riprodurlo**: Attivare «Luce infrarossa» con il preset `M = m` o `Na–Cl`.

5. **Flag `equalMasses` e `invertedMasses` non mutuamente esclusivi entro $|M - m|/M < 10^{-12}$**
   - **File e riga**: `src/renderer/src/physics/phononDispersion.ts:568, 588` (e `PhononDiatomicSection.tsx:531, 551`).
   - **Cosa è sbagliato**: `equalMasses` è `true` per $|M - m|/\max(M,m) < 10^{-12}$, mentre `invertedMasses` è `params.massLightAmu > params.massHeavyAmu`: per $0 < (m - M)/m < 10^{-12}$ risultano entrambi `true` (con gli slider a passo $0{,}1\text{ u}$ non accade a regime, ma è un'incoerenza di contratto facilmente eliminabile con `invertedMasses: !equalMasses && params.massLightAmu > params.massHeavyAmu`).
   - **Come riprodurlo**: Chiamare `diatomicSummary({ a: 5.64, massHeavyAmu: 29, massLightAmu: 29 + 1e-13, springC: 10 })`.

6. **Piccole lacune di copertura e un refuso nei commenti di `phononDispersion.test.ts`**
   - **File e riga**: `src/renderer/src/physics/phononDispersion.test.ts:261` e righe `285-457`.
   - **Cosa manca / refuso**:
     - Commento a riga 261: riporta `(valore esatto 4046,9 m/s)`, mentre con `AMU_KG = 1.6605390666e-27` il valore esatto per $M = 35{,}5\text{ u}, m = 23{,}0\text{ u}, a = 5{,}64\text{ Å}, C = 10\text{ N/m}$ è `4046,33 m/s` (l'asserzione `expect(sum.soundSpeedMs / 1e3).toBeCloseTo(4.05, 2)` è comunque esatta).
     - Mancano test unitari espliciti su: (a) `cmAmp` a $k \neq 0$ (es. al bordo zona $k = \pm\pi/a$, dove vale esattamente $M/(M+m)$ nel punto C e $m/(M+m)$ nel punto B) e coerenza con il massimo nel tempo di `diatomicDisplacements`; (b) `diatomicModeAmplitude` e `diatomicDynamicalMatrix` nel punto degenere $M = m, k = \pm\pi/a$ e nel caso invertito $m > M$; (c) `diatomicInfraredCrossing` con $n > 1$ (es. $n = 2$: $k_{\mathrm{luce}}$ raddoppia, `speedRatio` si dimezza, `wavelengthUm` resta la lunghezza d'onda nel vuoto $\lambda_0 = 2\pi c/\omega_{\mathrm{IR}}$).

---

## Cosa ho verificato davvero

1. **Test automatici e typecheck**:
   - `$env:PATH = "$PWD\.tools\node;$env:PATH"; npm.cmd test`: **19/19 file passati, 165/165 test passati** (incluso `phononDispersion.test.ts`: **17/17 test passati**, di cui 9 nuovi dedicati alla catena biatomica).
   - `$env:PATH = "$PWD\.tools\node;$env:PATH"; npm.cmd run typecheck`: passato con codice `0` (`tsconfig.node.json` e `tsconfig.web.json`).
2. **Confronto riga per riga di equazioni, segni e unità con `materiale/parte6/dispensa.pdf`**:
   - **Dispersione eq. (20) (p. 19)**: $\omega_\mp^2(k) = C\frac{m+M}{mM} \mp C\sqrt{(\frac{m+M}{mM})^2 - \frac{4\sin^2(ka/2)}{mM}}$ con $-$ acustico e $+$ ottico. Verificata l'identità algebrica anti-cancellazione in `diatomicOmegaSquaredPair` (`phononDispersion.ts:534-537`): $S^2 - 4\sin^2(ka/2)/(mM) = (1/m - 1/M)^2 + 4\cos^2(ka/2)/(mM) \ge 0$ e la forma coniugata per $\omega_-^2$.
   - **Passo $a$ vs primi vicini $a/2$ (§7.1 p. 18, Fig. 10)**: siti pari $n$ con massa $M$, siti dispari $n-1$ con massa $m$, $x_n^0 = na/2$, prima zona $-\pi/a < k \le \pi/a$, quote `a/2` (tra $n = 0$ e $n = 1$) e `a` (tra $n = 0$ e $n = 2$) in `DiatomicChainView.tsx:473-515`.
   - **Limiti $k \to 0$ (§8.1, eqq. 21–22, p. 21)**: $v_s = a\sqrt{C/[2(m+M)]}$, $\alpha = 1$ e $R_{\mathrm{cm}} = 1$ (acustico); $\omega_+(0) = \sqrt{2C(m+M)/(mM)}$, $\alpha = -M/m$ e $R_{\mathrm{cm}} = 0$ (ottico); in UI `PhononDiatomicSection.tsx:637-664` gestisce correttamente $v_p, v_g \to \pm v_s$ (acustico) e $v_g = 0, v_p \to \infty$ (ottico).
   - **Bordo di zona $k = \pm\pi/a$, punti C e B, gap (§8.2–8.3, eq. 23, p. 22)**: per $M > m$, C ha $\omega_{\max}^{\mathrm{ac}} = \sqrt{2C/M}$, $\alpha = 0$ ($m$ ferma), B ha $\omega_{\min}^{\mathrm{ott}} = \sqrt{2C/m}$, $1/\alpha = 0$ ($M$ ferma), $\Delta\omega_{\mathrm{gap}} = \sqrt{2C/m} - \sqrt{2C/M}$. Verificato che in `diatomicDisplacements` gli spostamenti a $k = \pm\pi/a$ formano vere onde stazionarie ($u_n(t) = (-1)^{n/2}\cos\varphi$ su C e $(-1)^{(n-1)/2}\cos\varphi$ su B con `phiOffset = pi/2`) e non bloccano la specie mobile.
   - **Limite $M = m$ e ripiegamento (§8.3, Approfondimento p. 23)**: gap nullo, coincidenza esatta con la catena monatomica di passo $a/2$ ripiegata in $[-\pi/a, \pi/a]$ ($\omega_- = 2\sqrt{C/m}|\sin(ka/4)|$, $\omega_+ = 2\sqrt{C/m}|\cos(ka/4)|$). Verificato che il riferimento di ripiegamento in `model.ts:103-124` usa la massa media $\bar{m} = (M+m)/2$, che conserva esattamente la stessa velocità del suono $v_s = \frac{a}{2}\sqrt{C/\bar{m}} = a\sqrt{C/[2(m+M)]}$ e ha frequenza di bordo $\sqrt{2C/\bar{m}}$ sempre interna al gap.
   - **Caso invertito $m > M$**: `diatomicSummary`, `diatomicModeAmplitude`, `diatomicDisplacements` e la UI (`invertedWarning`, `noteEdgeC`, `noteEdgeB`) scambiano coerentemente la specie ferma ai punti C e B e mantengono $\Delta\omega_{\mathrm{gap}} > 0$.
   - **Velocità di gruppo $v_g(k)$ (§6.2 p. 16, §8.1 p. 21)**: formula analitica $\pm\frac{Ca\sin(ka)}{2\omega_\mp mM\sqrt{D}}$ verificata sia contro la derivata numerica sia contro la curvatura di §8.1 ($\omega_+^2 \simeq \omega_+^2(0) - \frac{Ck^2a^2}{2(m+M)} \implies v_g \simeq -\frac{v_s^2}{\omega_+(0)}k < 0$ per $k \to 0^+$, errore relativo $2{,}3\times 10^{-5}$ a $k = 10^{-4}\text{ Å}^{-1}$). Verificato anche il limite $k \to (\pi/a)^-$ con $M = m$: $v_g^\mp \to \pm v_s/\sqrt{2} = \pm 2592{,}5\text{ m/s}$ fino a $1 - k/(\pi/a) = 10^{-14}$ senza instabilità.
   - **Centro di massa $R_{\mathrm{cm}}$ per $k$ generico e $k = 0$**: verificato in Python su Na–Cl, massa invertita e $M = m$ (per 6 valori di $k \in [-\pi/a, \pi/a]$ e entrambi i rami) che `cmAmp` coincide entro $< 10^{-5}$ con $\max_\varphi |Mu_0(\varphi) + mu_{-1}(\varphi)|/(M+m)$ calcolato da `diatomicDisplacements`, e che `DiatomicChainView.tsx:400-406` disegna la posizione istantanea esatta del centro di massa della cella $(-1, 0)$.
   - **Matrice dinamica $2\times 2$ (§10.3 p. 27)**: verificati $D_{11} = 2C/M$, $D_{22} = 2C/m$, $D_{12} = -(2C/\sqrt{Mm})\cos(ka/2)$ e controllata in Python la diagonalizzazione di Jacobi (residui $< 10^{-13}$, ortonormalità, coerenza di $\alpha$ con `diatomicModeAmplitude` entro $10^{-10}$) su 5 coppie di masse ($M>m$, $m>M$, $M=m$, Li–I e Li–I invertito) e 9 punti $k \in [-1{,}5\pi/a, +1{,}5\pi/a]$.
   - **Incrocio luce IR (§24 pp. 59–60, eq. 60) e dipolo ionico**: verificato il punto fisso $\omega_+(k_{\mathrm{luce}}) = (c/n)k_{\mathrm{luce}}$ (scarto da $\omega_+(0)$ pari a $9{,}1\times 10^{-11}$ su Na–Cl) e verificata la coerenza di segno in `DiatomicChainView.tsx:368-373, 445`: carica `−` su $M$, `+` su $m$, dipolo $\Delta p(t) \propto u_m - u_M$ (concorde con $\mathbf{p} = \sum q_i \mathbf{r}_i$); per $M = m$ cariche nascoste, `p = 0` e nota esplicita sull'assenza di assorbimento IR a un fotone.
3. **Verifica indipendente in Python dei numeri di riferimento Na–Cl (§8 p. 23 e §24 p. 60) e degli estremi degli slider**:
   - Na–Cl ($a = 5{,}64\text{ Å}$, $M = 35{,}5\text{ u} = 5{,}8949\times 10^{-26}\text{ kg}$, $m = 23{,}0\text{ u} = 3{,}8192\times 10^{-26}\text{ kg}$, $C = 10\text{ N/m}$):
     - $v_s = 4046{,}3\text{ m/s}$ ($4{,}05\text{ km/s}$; dispensa $\approx 4{,}1\times 10^3\text{ m/s}$);
     - $\omega_{\max}^{\mathrm{ac}} = 1{,}8419\times 10^{13}\text{ rad/s}$, $\nu_{\max}^{\mathrm{ac}} = 2{,}9315\text{ THz}$ (dispensa $1{,}84\times 10^{13}$, $2{,}9\text{ THz}$);
     - $\omega_{\min}^{\mathrm{ott}} = 2{,}2884\times 10^{13}\text{ rad/s}$, $\nu_{\min}^{\mathrm{ott}} = 3{,}6421\text{ THz}$ (dispensa $2{,}29\times 10^{13}$, $3{,}6\text{ THz}$);
     - $\omega_+(0) = 2{,}9376\times 10^{13}\text{ rad/s}$, $\nu_+(0) = 4{,}6753\text{ THz}$, $\hbar\omega_+(0) = 19{,}34\text{ meV}$ (dispensa $2{,}94\times 10^{13}$, $4{,}7\text{ THz}$, $19\text{ meV}$);
     - $\Delta\nu_{\mathrm{gap}} = 0{,}7105\text{ THz}$ ($2{,}94\text{ meV}$; dispensa $\approx 0{,}7\text{ THz}$);
     - Luce IR ($n = 1$): $\lambda_{\mathrm{IR}} = 64{,}12\ \mu\text{m}$ (dispensa $\approx 64\ \mu\text{m}$), $k_{\mathrm{luce}} = 0{,}980\times 10^5\text{ m}^{-1}$ (dispensa $\approx 1\times 10^5\text{ m}^{-1}$), $\pi/a = 5{,}570\times 10^9\text{ m}^{-1}$ (dispensa $\approx 5{,}6\times 10^9\text{ m}^{-1}$), $k_{\mathrm{luce}}/(\pi/a) = 1{,}759\times 10^{-5}$ (dispensa $\approx 2\times 10^{-5}$), $c/v_s = 7{,}41\times 10^4$.
   - Estremi degli slider ($a \in [3{,}0,\, 7{,}0]\text{ Å}$, $M, m \in [6,\, 210]\text{ u}$, $C \in [2,\, 80]\text{ N/m}$): tutti i valori ($\nu_+(0) \in [0{,}76,\, 28{,}52]\text{ THz}$, $k_{\mathrm{IR}}/(\pi/a) \in [0{,}36,\, 5{,}71]\times 10^{-5}$, $D_{ii} \in [0{,}11,\, 160{,}6]\times 10^{26}\text{ s}^{-2}$) restano finiti, ben scalati e privi di `NaN`/`Infinity`; la retta IR esagerata a $k_{\mathrm{vis}} = 0{,}09\,\pi/a$ resta sempre ben al di sopra del ramo acustico.

## Cosa non ho potuto verificare

- Non ho avviato `npm run dev:web` né aperto la sezione in un browser/Electron in esecuzione: la verifica di `DiatomicChainView.tsx`, `PhononDiatomicSection.tsx` e `DispersionPlot.tsx` è stata svolta tramite analisi statica del codice e calcoli numerici indipendenti (la verifica visiva a schermo spetta a `critico-grafico` e `studente`).

---

## Verdetto

**approvata** — La fisica della Sezione 2 (`phononDispersion.ts`, `phononDispersion.test.ts` e `sections/phonon-diatomic/`) è rigorosa, numericamente solida e pienamente fedele alla dispensa Parte 6, con 165/165 test e `typecheck` verdi e zero problemi bloccanti o importanti. I 6 rilievi **Minori** elencati sopra (in particolare la formula priva di cancellazione per `det` in `diatomicDynamicalMatrix`, il riallineamento del JSDoc di `cmAmp`, l'ordinata del marcatore IR esagerato e qualche test integrativo su `cmAmp`, degenerazione $M = m$ e $n > 1$) sono miglioramenti facoltativi di igiene numerica e copertura test.
