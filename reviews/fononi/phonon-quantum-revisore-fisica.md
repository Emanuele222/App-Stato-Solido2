# Revisione di fisica — Sezione 5 `phonon-quantum` («Modi quantizzati e processi Umklapp»)

Revisore: `revisore-fisica`  
File esaminati:
- `src/renderer/src/physics/phononQuantum.ts`
- `src/renderer/src/physics/phononQuantum.test.ts`
- `src/renderer/src/sections/phonon-quantum/` (`manifest.ts`, `model.ts`, `formulas.ts`, `strings.ts`, `store.ts`, `QuantumOscillatorView.tsx`, `QuantumChainView.tsx`, `Umklapp1BZView.tsx`, `UmklappDispersionView.tsx`, `PhononQuantumSection.tsx`)
- Riferimenti: `materiale/parte6/riferimento-formule.md`, `src/renderer/src/physics/constants.ts`, `src/renderer/src/physics/phononDispersion.ts`, `src/renderer/src/ui/theme.ts`.

---

## Problemi trovati

### Bloccante
Nessuno.

### Importante
1. **Etichetta dimensionalmente errata sull’asse verticale delle densità di probabilità (`P(u)·a_{ho}`)**
   - **File e riga**: `src/renderer/src/sections/phonon-quantum/strings.ts:70` (usata in `src/renderer/src/sections/phonon-quantum/QuantumOscillatorView.tsx:306`).
   - **Cosa è sbagliato**: l’asse verticale del sotto-grafico inferiore di `QuantumOscillatorView.tsx` è etichettato `P(u)·a_{ho}` (`probLabel: 'P(u)·a_{ho}'`). Tuttavia, le curve tracciate (`model.curves.probQuantum`, `model.thermalProb`, `model.curves.probClassical`, `model.thermalClassicalProb`) sono le densità di probabilità adimensionali in funzione di $u = x / a_{\mathrm{ho}}$, ovvero $P_n(u) = |\psi_n(u)|^2 = a_{\mathrm{ho}}\,|\Psi_n(x)|^2 = P_n(x)\cdot a_{\mathrm{ho}}$ (con $\int_{-\infty}^{+\infty} P_n(u)\,\mathrm{d}u = 1$ e picco in $n=0, u=0$ pari a $1/\sqrt{\pi} \approx 0{,}564$). Poiché $P(u)$ è già adimensionale, scrivere `P(u)·a_{ho}` introduce impropriamente una dimensione di lunghezza ($\text{Å}$).
   - **Formula/notazione corretta e riferimento**: poiché la legenda usa $P_n(x)$, $P_{\mathrm{cl}}(x)$ (densità fisiche in $\text{Å}^{-1}$) e l’asse orizzontale è $x / a_{\mathrm{ho}}$, l’etichetta corretta dell’asse verticale adimensionale è `P(x)·a_{ho}` (oppure semplicemente `P(u)`), in coerenza con la trasformazione $\Psi_n(x) = a_{\mathrm{ho}}^{-1/2}\psi_n(x/a_{\mathrm{ho}})$ (`materiale/parte6/riferimento-formule.md`, eq. 49 e `phononQuantum.ts:313`).
   - **Come riprodurlo**: aprire la sezione «Modi quantizzati e processi Umklapp» in modalità «Quantizzazione del modo» e leggere l’etichetta in alto a sinistra sull’asse $y$ del grafico inferiore delle densità di probabilità.

### Minore
1. **Incongruenza di segno su $\mathbf{G}$ tra la formula principale e la citazione dell’eq. (40) nei «Dettagli formali»**
   - **File e riga**: `src/renderer/src/sections/phonon-quantum/formulas.ts:39`, `src/renderer/src/sections/phonon-quantum/strings.ts:150` rispetto a `src/renderer/src/sections/phonon-quantum/strings.ts:187`.
   - **Cosa è sbagliato**: nella formula principale (`formulas.ts:39`) e nel testo introduttivo (`strings.ts:150`), così come in `phononQuantum.ts:550` e nei diagrammi (`Umklapp1BZView.tsx`, `UmklappDispersionView.tsx`), il ripiegamento è scritto $k_1 + k_2 = k_3 - G$ (cioè $k_3 = k_1 + k_2 + G$, con $G = -2\pi/a$ quando $k_1 + k_2 > \pi/a$). Nei «Dettagli formali» (`strings.ts:187`), invece, viene riportata l’eq. (40) della dispensa nella forma $\sum \mathbf{p} = \sum \mathbf{p}' + \hbar\mathbf{G}$ (`riferimento-formule.md:58`), dove il segno di $\mathbf{G}$ è opposto rispetto a $k_1 + k_2 = k_3 - G$. Pur essendo fisicamente equivalenti (poiché $G \in \{0, \pm 2\pi/a\}$ è simmetrico), l’accostamento senza precisazione può creare confusione sul segno di $G$ mostrato a schermo.
   - **Come riprodurlo**: selezionare «Collisioni 1BZ (N / Umklapp)» e confrontare la «Formula viva» ($k_1 + k_2 = k_3 - G$) con il terzo blocco di «Dettagli formali».

2. **Simbolo della coordinata $Q$ vs $x$ nel titolo del pannello oscillatore e notazione $E$ vs $\langle E \rangle$**
   - **File e riga**: `src/renderer/src/sections/phonon-quantum/strings.ts:45` (`oscillatorTag: 'Oscillatore del modo: potenziale V(Q) e densità P(x)'`) vs `strings.ts:61, 69, 71` (`V(x)`, `x / a_{ho}`); e `src/renderer/src/sections/phonon-quantum/formulas.ts:51` (`E = (\bar{n} + \tfrac{1}{2})\hbar\omega`) vs `PhononQuantumSection.tsx:339` (`\langle E \rangle`).
   - **Cosa è sbagliato**: nel tag del riquadro compare $V(Q)$, mentre negli assi e nella legenda dello stesso grafico il potenziale è chiamato $V(x)$ e l’ascissa $x/a_{\mathrm{ho}}$; nella formula secondaria termica (`formulas.ts:51`) l’energia media è indicata con $E$ anziché $\langle E \rangle$ (e $x = \hbar\omega / k_B T$ in `formulas.ts:52` non è esplicitato nella formula stessa, pur essendolo in `strings.ts:180`).
   - **Come riprodurlo**: ispezionare il titolo del riquadro superiore e il pannello «Formula viva» in modalità «Bagno termico T».

3. **Rappresentazione delle code $|x| > x_{\mathrm{cl,eff}}$ e curva $P_{\mathrm{cl}}$ nella modalità «Bagno termico T»**
   - **File e riga**: `src/renderer/src/sections/phonon-quantum/QuantumOscillatorView.tsx:228, 316-353, 417-428` e `src/renderer/src/physics/phononQuantum.ts:517-518`.
   - **Cosa è sbagliato / ambiguo**: in bagno termico (`source === 'thermal'`), il grafico confronta la distribuzione canonica esatta $\langle P(u) \rangle_T$ (gaussiana di Mehler con $\sigma_u^2 = \bar{n} + 1/2$) con la densità *microcanonica* $P_{\mathrm{cl}}(u; u_{\mathrm{cl,eff}})$ di un oscillatore classico singolo avente energia pari alla media termica $\langle E \rangle = (\bar{n} + 1/2)\hbar\omega$ ($u_{\mathrm{cl,eff}} = \sqrt{2\bar{n} + 1}$), marcandone i punti $\pm x_{\mathrm{cl}}$ sull’asse e ombreggiando le code di $\langle P(u)\rangle_T$ per $|u| > u_{\mathrm{cl,eff}}$. Sebbene coerente con la linea tratteggiata $\langle E \rangle$ sulla parabola, le code oltre $\pm x_{\mathrm{cl,eff}}$ nel caso termico includono sia il tunneling quantistico sia il popolamento statistico dei livelli $n > \bar{n}$ (e la distribuzione canonica classica a temperatura $T$ sarebbe una gaussiana $\propto e^{-M\omega^2 x^2 / 2k_B T}$, non la curva a U). La guida (`strings.ts`) non chiarisce che $P_{\mathrm{cl}}$ in modalità termica rappresenta l’oscillatore equivalente all’energia media $\langle E \rangle$.
   - **Come riprodurlo**: attivare «Bagno termico T» nella modalità «Quantizzazione del modo».

4. **Casi limite minori in `phononQuantum.ts` e copertura dei test in `phononQuantum.test.ts`**
   - **File e riga**: `src/renderer/src/physics/phononQuantum.ts:449` (`boseEinsteinOccupation`), `phononQuantum.ts:564-569` (`analyze1BZCollision`), `src/renderer/src/physics/phononQuantum.test.ts`.
   - **Dettaglio**:
     - `boseEinsteinOccupation(omegaRadS, Infinity)` restituisce `0` invece di `Infinity` a causa del controllo `if (!Number.isFinite(temperatureK) || temperatureK <= 0) return 0` (non raggiungibile dall’UI dove $T \in [10, 1000]\text{ K}$).
     - Con la convenzione 1BZ semiaperta $(-\pi/a, \pi/a]$, la somma al bordo sinistro $k_1 + k_2 = -\pi/a$ (es. `k1Frac = -0.5, k2Frac = -0.5`) viene classificata come `'umklapp'` ($G = +2\pi/a$, $k_3 = +\pi/a$, $v_g(k_3) = 0$), mentre $+0{,}5 + 0{,}5 = +\pi/a$ è `'normal'` ($G = 0$, $k_3 = +\pi/a$), pur rappresentando il medesimo stato stazionario di bordo zona.
     - `phononQuantum.test.ts` non testa esplicitamente la continuità di `erfc(x)` attorno alla soglia $x = 3{,}5$ tra quadratura GL24 e frazione continua di Laplace, né `analyze1BZCollision` su $k_1 + k_2 = -\pi/a$ o su input esterni a $(-1, 1]$.

---

## Cosa ho verificato davvero

1. **Esecuzione della suite completa di test (`npm.cmd test`)**:
   - Comando eseguito: `$env:PATH = "$PWD\.tools\node;$env:PATH"; npm.cmd test`
   - Risultato: **23 file di test passati (23), 211 test passati (211)**; in particolare `src/renderer/src/physics/phononQuantum.test.ts` ha superato **9/9 test** in 27 ms.
2. **Verifica algebrica riga per riga**:
   - Confronto di tutte le equazioni, unità di misura e segni in `phononQuantum.ts`, `model.ts`, `formulas.ts`, `strings.ts`, `manifest.ts`, `store.ts` e nei quattro componenti canvas con `materiale/parte6/riferimento-formule.md`:
     - $a_{\mathrm{ho}} = \sqrt{\hbar / (M\omega)}$, $\Delta x_{\mathrm{zp}} = a_{\mathrm{ho}}/\sqrt{2}$, $E_n = (n + 1/2)\hbar\omega$, $x_{\mathrm{cl}} = a_{\mathrm{ho}}\sqrt{2n+1}$, $P_{\mathrm{cl}}(x) = (\pi\sqrt{x_{\mathrm{cl}}^2 - x^2})^{-1}$ per $|x| < x_{\mathrm{cl}}$, ricorrenza ortonormale a tre termini di $\psi_n(u)$ senza fattoriali;
     - statistica di Bose–Einstein con $\mu = 0$: $\bar{n}(T) = [\exp(\hbar\omega/k_B T) - 1]^{-1}$ (stabile via `Math.expm1`), pesi geometrici $p_n(T) = (1 - e^{-x})e^{-nx}$ e identità di Mehler/Bloch per la densità termica esatta;
     - cinematica 1BZ in `analyze1BZCollision` e verso fisico delle frecce tangenti di velocità di gruppo $v_g(k) = \mathrm{d}\omega/\mathrm{d}k$ in `UmklappDispersionView.tsx:411-427` (verificato che $\Delta x_{\mathrm{px}} \propto \operatorname{sgn}(v_g)$ e $\Delta y_{\mathrm{px}} \propto -\operatorname{sgn}(v_g)\,(\mathrm{d}\nu/\mathrm{d}k)$ puntano correttamente in su a destra per $k > 0$ e in su a sinistra per $k < 0$).
   - Verifica che tutti i `QuantityId` usati in `formulas.ts`, `strings.ts`, `manifest.ts` e `PhononQuantumSection.tsx` (`E`, `psi`, `T`, `omega`, `M`, `Ek`, `u`, `k`, `a`, `v`) siano definiti in `src/renderer/src/ui/theme.ts`.
3. **Calcoli numerici indipendenti (Python + esecuzione diretta di `phononQuantum.ts` tramite Vite SSR in Node)**:
   - Confronto con Python (`math.erfc` e integrazione di Simpson indipendente a 4000 passi sulla ricorrenza di Hermite):
     - `erfc(1) = 0.15729920705028522` (Python `0.157299207050285`), `erfc(3.5) = 7.430983726131046e-7` vs `erfc(3.5000001) = 7.430978323989254e-7` (Python `erfc(3.5) = 7.430983723414126e-7`), `erfc(10) = 2.0884875837625452e-45` (Python `2.088487583762545e-45`), `erfc(26.5) = 2.2109076642637346e-307` (Python `2.210907664263735e-307`);
     - `quantumTunnelingFraction(n)` per $n \in \{0, 1, 2, 5, 10, 15, 20, 25\}$: coincidenza fino a 11–12 cifre decimali con il calcolo Python indipendente (es. $n=0$: `0.157299207050`, $n=25$: `0.045067021746` vs Python `0.045067021745`);
     - stabilità di `oscillatorCurvesDimless(25, 9.5, 481)` senza `NaN` o `Infinity`;
     - riproduzione dei valori di riferimento §18.4 ($a_{\mathrm{ho}} = 0{,}059891\text{ Å}$ a $\omega = 2{,}8\cdot 10^{13}\text{ rad/s}$, e $0{,}06027\text{ Å}$, $\Delta x_{\mathrm{zp}} = 0{,}04262\text{ Å} = 1{,}705\%$ di $a = 2{,}5\text{ Å}$ a $\nu = 4{,}4\text{ THz}$), dei riepiloghi termici ($T = 10, 30, 300, 1000\text{ K}$) e dell’esempio Umklapp §16.2 ($0{,}7 + 0{,}6 \to -0{,}7\,\pi/a$, $v_{g1}, v_{g2} > 0$, $v_{g3} = -v_{g1} < 0$).

---

## Cosa non hai potuto verificare

- Lettura diretta del testo e delle figure originali in `materiale/parte6/dispensa.pdf` (l’eseguibile `pdftotext` presente sul sistema ha restituito errore di accesso al registro MiKTeX e non sono installate librerie PDF Python come `pymupdf` o `pypdf`): tutti i confronti con la dispensa si basano su `materiale/parte6/riferimento-formule.md`.
- Rendering visivo interattivo nel browser / Electron (`npm run dev:web`, `npm run typecheck`, `npm run build`).

---

## Verdetto finale

**Da correggere** — La fisica implementata in `phononQuantum.ts` e la suite `phononQuantum.test.ts` sono solide e numericamente accurate, ma è presente un errore dimensionale/notazionale nell’etichetta dell’asse verticale del grafico delle probabilità (`probLabel: 'P(u)·a_{ho}'` in `src/renderer/src/sections/phonon-quantum/strings.ts:70`, da sostituire con `P(x)·a_{ho}` o `P(u)`), oltre ai punti minori segnalati sopra.
