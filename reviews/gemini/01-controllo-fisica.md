# Controllo indipendente del modulo di fisica (Elettroni quasi liberi)

**Incarico:** `incarichi/gemini-01-controllo-fisica.md`  
**Ruolo:** revisore  
**Verdetto finale:** **approvato**

---

## 1. Cosa ho fatto

1. **Parte A (indipendente, prima di leggere `src/renderer/src/physics/`)**: partendo esclusivamente da `materiale/parte3/dispensa.tex` (§11, righe 1225–1712, §13 e formulario righe 2287–2303) e dal riferimento in `materiale/parte4/dispensa.tex` (§3.2 riga 659 e §5.6), ho implementato da zero in `crosscheck/quasi-liberi/solve.mjs` (Node puro, zero dipendenze esterne) il risolutore dell'equazione centrale 1D con diagonalizzatore simmetrico di Jacobi, il calcolo della densità $|\psi(x)|^2$, la velocità tramite Hellmann–Feynman e differenze finite, il rapporto $m_0/m^*$ tramite somma perturbativa $k\cdot p$ e differenze finite a 3 e 5 punti, il livello di Fermi e gli esempi numerici svolti del §11. I risultati sono salvati in [risultati.json](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/crosscheck/quasi-liberi/risultati.json).
2. **Parte B (confronto numerico)**: ho scritto la suite [confronto.test.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/crosscheck/quasi-liberi/confronto.test.ts) con configurazione dedicata [vitest.config.mts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/crosscheck/quasi-liberi/vitest.config.mts) per confrontare tutte le grandezze della Parte A con le funzioni esportate da [index.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/index.ts), salvando la tabella completa e le diagnostiche in [confronto.json](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/crosscheck/quasi-liberi/confronto.json).
3. **Parte C (revisione del codice e dei test)**: ho letto sorgenti e test di [constants.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/constants.ts), [linalg.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/linalg.ts), [bandStructure.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/bandStructure.ts), [freeElectron.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/freeElectron.ts), [centralEquation1d.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/centralEquation1d.ts), [density.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/density.ts), [gaps1d.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/gaps1d.ts), [semiclassical.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/semiclassical.ts), [filling.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/filling.ts) e i rispettivi `*.test.ts`, più [convergence.test.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/convergence.test.ts), verificando formule, segni, unità di misura, casi limite agli estremi degli slider e onestà delle tolleranze.

---

## 2. Cosa ho verificato davvero

Comandi eseguiti nella cartella del progetto con `export PATH="$PWD/.tools/node/bin:$PATH"`:

- `node crosscheck/quasi-liberi/solve.mjs` → **eseguito, exit code 0**. Calcolati tutti gli 8 punti della Parte A e verificati i residui massimi $\|Hv - \lambda v\|_\infty$ del diagonalizzatore di Jacobi (residui $< 1{,}2\cdot 10^{-13}$ per 15 onde piane, $< 1{,}9\cdot 10^{-12}$ per 41 onde piane).
- `npx vitest run --config crosscheck/quasi-liberi/vitest.config.mts` → **eseguito, exit code 0, 1 test file passed, 8/8 tests passed** (`2.84 s`). Confronto diretto tra implementazione indipendente e funzioni di `src/renderer/src/physics/`, inclusi casi estremi degli slider ($a \in [2{,}5; 6]\text{ \AA}$, $V_G \in [-3; 3]\text{ eV}$, $V_{2G} \in [-1{,}5; 1{,}5]\text{ eV}$) e casi limite a gap piccolo.
- `npm test` → **eseguito, exit code 0, 13 test files passed, 101/101 tests passed** (`1.09 s`). Tutti i test di fisica dell'app passano senza modifiche al codice sorgente.

---

## 3. Cosa non ho potuto verificare

- **Caso hermitiano complesso in `linalg.ts`**: `eigh` lancia esplicitamente errore su `complex-hermitian` ([linalg.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/linalg.ts#L87-L90)), non essendo ancora necessario per il modello 1D con $V_G$ reale.
- **Altri metodi fisici presenti nella cartella**: durante la revisione erano presenti anche `emptyLattice.ts`, `kronigPenney.ts`, `tightBinding.ts` e `kDotP.test.ts` (relativi ad altri incarichi/sezioni); non li ho letti né sottoposti a controllo incrociato perché fuori dal perimetro di `gemini-01-controllo-fisica.md`.
- **Interfaccia e rendering (`ui/`, `viz/`, `sections/`, `App.tsx`)**: fuori ambito per questo incarico.

---

## 4. Tabella di confronto (Parte B)

Parametri di base per i punti 1–6: $a = 3\text{ \AA}$, $V_G = -0{,}5\text{ eV}$, $V_{2G} = 0$, $\hbar^2/2m_0 = 3{,}80998\text{ eV\cdot\AA}^2$ ($E_0 = 4{,}178110597\text{ eV}$).

### Punti 1–7

| Grandezza | Mio valore (Parte A) | Valore app | Valore dispensa | Diff. relativa |
|---|---|---|---|---|
| Banda 1 ($k=0$, 15 PW) [eV] | `-0.0298711204084` | `-0.0298711204082` | — | `8.1e-12` |
| Banda 2 ($k=0$, 15 PW) [eV] | `16.707456394358` | `16.707456394358` | — | `6.6e-15` |
| Banda 3 ($k=0$, 15 PW) [eV] | `16.737326770982` | `16.737326770982` | — | `7.0e-15` |
| Banda 4 ($k=0$, 15 PW) [eV] | `66.851763765046` | `66.851763765046` | — | `2.1e-16` |
| Banda 1 ($k=\pi/2a$, 15 PW) [eV] | `1.004775781850` | `1.004775781850` | — | `7.3e-14` |
| Banda 2 ($k=\pi/2a$, 15 PW) [eV] | `9.424541204516` | `9.424541204517` | — | `3.4e-14` |
| Banda 3 ($k=\pi/2a$, 15 PW) [eV] | `26.118893007791` | `26.118893007791` | — | `3.8e-15` |
| Banda 4 ($k=\pi/2a$, 15 PW) [eV] | `51.184514335703` | `51.184514335704` | — | `1.0e-14` |
| Banda 1 ($k=\pi/a$, 15 PW) [eV] | `3.670742437079` | `3.670742437079` | $\simeq E_0-|V_G| = 3{,}6781$ | `7.7e-15` |
| Banda 2 ($k=\pi/a$, 15 PW) [eV] | `4.670518729167` | `4.670518729167` | $\simeq E_0+|V_G| = 4{,}6781$ | `7.8e-15` |
| Banda 3 ($k=\pi/a$, 15 PW) [eV] | `37.606623794399` | `37.606623794398` | — | `1.7e-14` |
| Banda 4 ($k=\pi/a$, 15 PW) [eV] | `37.606847500920` | `37.606847500919` | — | `1.7e-14` |
| Banda 1 ($k=0$, 41 PW) [eV] | `-0.0298711204084` | `-0.0298711204137` | — | `1.8e-10` |
| Banda 2 ($k=0$, 41 PW) [eV] | `16.707456394358` | `16.707456394353` | — | `3.1e-13` |
| Banda 3 ($k=0$, 41 PW) [eV] | `16.737326770982` | `16.737326770977` | — | `3.1e-13` |
| Banda 4 ($k=0$, 41 PW) [eV] | `66.851763765046` | `66.851763765044` | — | `3.7e-14` |
| Banda 1 ($k=\pi/2a$, 41 PW) [eV] | `1.004775781850` | `1.004775781847` | — | `3.2e-12` |
| Banda 2 ($k=\pi/2a$, 41 PW) [eV] | `9.424541204516` | `9.424541204516` | — | `1.1e-15` |
| Banda 3 ($k=\pi/2a$, 41 PW) [eV] | `26.118893007791` | `26.118893007785` | — | `2.1e-13` |
| Banda 4 ($k=\pi/2a$, 41 PW) [eV] | `51.184514335703` | `51.184514335700` | — | `5.7e-14` |
| Banda 1 ($k=\pi/a$, 41 PW) [eV] | `3.670742437079` | `3.670742437077` | $\simeq 3{,}6781$ | `4.0e-13` |
| Banda 2 ($k=\pi/a$, 41 PW) [eV] | `4.670518729167` | `4.670518729165` | $\simeq 4{,}6781$ | `3.1e-13` |
| Banda 3 ($k=\pi/a$, 41 PW) [eV] | `37.606623794399` | `37.606623794393` | — | `1.6e-13` |
| Banda 4 ($k=\pi/a$, 41 PW) [eV] | `37.606847500920` | `37.606847500914` | — | `1.6e-13` |
| Gap in $\pi/a$ (15 PW) [eV] | `0.999776292088` | `0.999776292088` | $2\|V_G\| = 1$ | `8.0e-15` |
| Gap in $\pi/a$ (41 PW) [eV] | `0.999776292088` | `0.999776292088` | $2\|V_G\| = 1$ | `2.7e-15` |
| $m_0/m^*$ banda 1 inf (15 PW) | `-15.7315552` | `-15.7315414` | `−15.7124` (2 onde) | `8.8e-7` |
| $m_0/m^*$ banda 2 sup (15 PW) | `17.7306588` | `17.7306511` | `17,731` (P4 §3.2) | `4.3e-7` |
| $m_0/m^*$ banda 1 inf (41 PW) | `-15.7315552` | `-15.7315663` | `−15.7124` (2 onde) | `7.0e-7` |
| $m_0/m^*$ banda 2 sup (41 PW) | `17.7306588` | `17.7306262` | `17,731` (P4 §3.2) | **`1.84e-6`** (*) |
| $\|\psi\|^2(0)$ b.1, $V_G=-0{,}5$ | `2.059229911213` | `2.059229911213` | `2` (2 onde) | `5.8e-15` |
| $\|\psi\|^2(a/2)$ b.1, $V_G=-0{,}5$ | `8.8e-31` | `1.0e-24` | `0` (nodo) | `~1` (**) |
| $\|\psi\|^2(0)$ b.2, $V_G=-0{,}5$ | `1.8e-30` | `1.1e-24` | `0` (nodo) | `~1` (**) |
| $\|\psi\|^2(a/2)$ b.2, $V_G=-0{,}5$ | `1.939577957194` | `1.939577957194` | `2` (2 onde) | `1.8e-15` |
| $\|\psi\|^2(0)$ b.1, $V_G=+0{,}5$ | `8.8e-31` | `1.0e-24` | `0` (nodo) | `~1` (**) |
| $\|\psi\|^2(a/2)$ b.1, $V_G=+0{,}5$ | `2.059229911213` | `2.059229911213` | `2` (2 onde) | `5.8e-15` |
| $\|\psi\|^2(0)$ b.2, $V_G=+0{,}5$ | `1.939577957194` | `1.939577957194` | `2` (2 onde) | `1.8e-15` |
| $\|\psi\|^2(a/2)$ b.2, $V_G=+0{,}5$ | `1.8e-30` | `1.1e-24` | `0` (nodo) | `~1` (**) |
| $v$ bordo banda 1 [m/s] | `2.3e-10` | `7.1e-4` | `0` | `~1` (***) |
| $v$ bordo banda 2 [m/s] | `4.8e-11` | `7.1e-4` | `0` | `~1` (***) |
| $v$ libero ($k=1\text{ \AA}^{-1}$) [m/s] | `1157675.718923` | `1157675.718303` | — | `5.4e-10` |
| $E_F$ ($n=1$, 401/2001 pt) [eV] | `1.004775781850` | `1.004775781846` | — | `4.5e-12` |
| Classe $n=1$ | `metal` | `metal` | `metallo` | `0` |
| $E_F$ ($n=2$, 401/2001 pt) [eV] | `4.170630583123` | `4.170630583119` | — | `9.7e-13` |
| Classe $n=2$ | `insulator` | `insulator` | `isolante` | `0` |
| $E_F$ ($n=3$, 401/2001 pt) [eV] | `9.424541204516` | `9.424541204513` | — | `3.7e-13` |
| Classe $n=3$ | `metal` | `metal` | `metallo` | `0` |
| $E_F$ ($n=4$, 401/2001 pt) [eV] | `16.722391582670` | `16.722391582665` | — | `3.1e-13` |
| Classe $n=4$ | `insulator` | `insulator` | `isolante` | `0` |
| 2 arm.: gap $\pi/a$ (15 PW) [eV] | `3.466168318393` | `3.466168318394` | — | `2.0e-13` |
| 2 arm.: gap $k=0$ b.2–3 (15 PW) [eV] | `2.869213981658` | `2.869213981658` | — | `1.2e-14` |
| 2 arm.: gap $\pi/a$ (41 PW) [eV] | `3.466168318393` | `3.466168318395` | — | `6.5e-13` |
| 2 arm.: gap $k=0$ b.2–3 (41 PW) [eV] | `2.869213981658` | `2.869213981659` | — | `3.0e-13` |

### Esempi numerici del §11 (punto 8)

| Esempio (§11 dispensa P3) | Mio valore (Parte A) | Valore app / test | Valore dispensa | Note |
|---|---|---|---|---|
| §11.2 Troncamento ($2\times 2$): $E_-$, $E_+$, gap | `4.63480`, `5.23480`, `0.60000` | `4.63480`, `5.23480`, `0.60000` | `4,6348`, `5,2348`, `0,6000` | Verifica in `centralEquation1d.test.ts` e `gaps1d.test.ts` |
| §11.2 Troncamento (15 PW): $E_-$, $E_+$, gap | `4.63254`, `5.23251`, `0.599965` | `4.63254`, `5.23251`, `0.599965` | `4,6325`, `5,2325`, `0,59997` | Coincide a tutte le cifre pubblicate |
| §11.3 Lontano dal bordo ($\|V_G\|=0{,}1 E_0$, $k=\pi/2a$) | `-0.0049876 E₀` (2 onde), `-0.006650 E₀` (15 PW) | `-0.0049876 E₀` (`twoWaveEnergies`) | `-0,005 E₀` (2° ord.) | `freeElectron.test.ts` confronta a 4 cifre |
| §11.3 Fig. `qf_bordo` (Kittel fig. 9, $\|V_G\|=0{,}45$, $E_0=0{,}5$) | `0.004789`, `0.893577`, gap `0.888788` (15 PW) | Non in un test dedicato | gap `0,90` (2 onde) | — |
| §11.4 Scatola atomo ($L=3\text{ \AA}$, $\hbar^2/2m=3{,}8$) | $E_{1,2,3} = 4{,}167;\ 16{,}669;\ 37{,}504\text{ eV}$ | `zoneBoundaryEnergy(3) = 4.17811` (con `3.80998`) | `4,2; 16,7; 38 eV`; ecc. `12,5 eV` | Differenza dovuta a `3,8` vs `3,80998` |
| §11.4 Scatola molecola ($L=15\text{ \AA}$, $\hbar^2/2m=3{,}8$) | $E_{1,2,3} = 0{,}1667;\ 0{,}6667;\ 1{,}5002\text{ eV}$ | — | `0,167; 0,67; 1,5 eV`; ecc. `0,5 eV` | Butadiene ($E_3-E_2$): `0,833 eV` (disp. `0,84`) |
| §11.4 Metallo ($L=3\text{ mm}, a=3\text{ \AA}$, $\hbar^2/2m=3{,}8$) | $k_F=1{,}0472\text{ \AA}^{-1}$, $E_F=4{,}167\text{ eV}$, $\delta E=8{,}334\cdot 10^{-7}\text{ eV}$ | `filling.test.ts`: $E_F = 4{,}1781\text{ eV}$ (`3.80998`) | `4,2 eV`; $\delta E \simeq 8{,}4\cdot 10^{-7}\text{ eV}$ | Con `3.80998`: $E_F=4{,}1781\text{ eV}$, $\delta E=8{,}356\cdot 10^{-7}\text{ eV}$ |

### Spiegazione delle differenze oltre $10^{-6}$ relativo
- **(*) `m0/m* banda 2 sup (41 PW)` — diff. relativa `1.84e-6` (`17.730659` mio vs `17.730626` app)**: il mio calcolo usa la somma $k\cdot p$ esatta al secondo ordine sugli autostati (senza passo di derivazione); l'app usa `inverseEffectiveMassRatio` in [semiclassical.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/semiclassical.ts#L22-L43) con differenza finita centrata a 3 punti e passo `h = 1e-4` Å⁻¹. Con 41 onde piane gli elementi diagonali arrivano a $\sim 1670\text{ eV}$, quindi il rumore di arrotondamento di `eigh` ($\sim 10^{-15}\text{ eV}$) diviso per $h^2 = 10^{-8}$ produce un'oscillazione numerica dell'ordine di $10^{-5}$ su $m_0/m^*$. Non è un errore di formula.
- **(**) $|\psi|^2$ nei nodi (`~1e-30` vs `~1e-24`)**: il valore esatto è `0`; entrambi i numeri sono zero entro la precisione macchina di `Float64` ($|c_{\text{err}}|^2 \sim (10^{-12})^2$), e la differenza relativa $\sim 1$ deriva solo dal confronto fra due zeri numerici.
- **(***) Velocità al bordo di zona (`2.3e-10` vs `7.1e-4 m/s`)**: il valore esatto è `0 m/s`; il mio calcolo usa il teorema di Hellmann–Feynman (nessuna cancellazione di differenze finite), mentre l'app usa `(E(k+h) - E(k-h)) / (2h)` con `h = 1e-4`, dove il rumore macchina $\sim 10^{-15}\text{ eV}$ diviso per $2\cdot 10^{-4}\text{ \AA}^{-1}$ e moltiplicato per $e\cdot 10^{-10}/\hbar \approx 1{,}52\cdot 10^{15}$ produce $\sim 7\cdot 10^{-4}\text{ m/s}$ (trascurabile rispetto a $v \sim 10^6\text{ m/s}$ in zona).

---

## 5. Problemi trovati (in ordine di gravità)

Nessun problema **bloccante** e nessun problema **importante** nelle formule, nei segni, nelle unità o nelle conversioni. Segnalo tre aspetti **minori**:

1. **[Minore] Errore delle differenze finite (`DEFAULT_K_STEP = 1e-4`) per $m_0/m^*$ al bordo di zona quando $|V_G|$ è molto piccolo**
   - **Dove:** [semiclassical.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/semiclassical.ts#L13) e righe [22–25](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/semiclassical.ts#L22-L25), [37–43](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/semiclassical.ts#L37-L43).
   - **Cosa succede:** al bordo $k = \pi/a$ la banda del modello a due onde ha raggio di curvatura nello spazio $k$ proporzionale a $\kappa_{\text{bend}} \sim |V_G| / (2\sqrt{E_0 \cdot \hbar^2/2m_0})$. Per $|V_G| \ll 0{,}01\text{ eV}$ questa scala diventa confrontabile con il passo fisso `h = 1e-4` Å⁻¹ e la derivata seconda a 3 punti sottostima fortemente $|m_0/m^*|$ (e in $V_G = 0$ c'è una cuspide matematica). Per $|V_G| \ge 0{,}05\text{ eV}$ l'errore è invece $\le 6{,}4\cdot 10^{-5}$.
   - **Come riprodurlo:** in `confronto.test.ts` (diagnostica `smallGapEffectiveMass_a3` in [confronto.json](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/crosscheck/quasi-liberi/confronto.json#L471-L492)), per $a = 3\text{ \AA}$ e $k = \pi/a$:
     - $V_G = -0{,}05\text{ eV}$: esatto `168.126`, app (`h=1e-4`) `168.116` (err. rel. `6.4e-5`).
     - $V_G = -0{,}01\text{ eV}$: esatto `836.622`, app (`h=1e-4`) `835.296` (err. rel. `0.16%`).
     - $V_G = -0{,}001\text{ eV}$: esatto `8357.22`, app (`h=1e-4`) `7333.10` (**err. rel. `12.25%`**).

2. **[Minore] Mancanza di test su $N = 4$ elettroni per cella (e con due armoniche) in `filling.test.ts`**
   - **Dove:** [filling.test.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/filling.test.ts#L11-L46).
   - **Cosa succede:** la suite verifica $N = 1, 2, 3$ e $V_G = 0$, ma non $N = 4$ (secondo gap in $k = 0$ tra bande 2 e 3, sia per $V_{2G} = 0$ dove esiste comunque il gap del secondo ordine di $0{,}02987\text{ eV}$ per $a=3, V_G=-0{,}5$, sia per $V_{2G} \ne 0$). Il comportamento dell'implementazione in [filling.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/filling.ts#L58-L74) è risultato comunque corretto nei nostri test incrociati (`n=4` classificato `insulator`, $E_F = 16{,}7224\text{ eV}$ con $V_{2G}=0$ e $E_F = 16{,}8145\text{ eV}$ con $V_G=0{,}45 E_0, V_{2G}=0{,}3 E_0$).

3. **[Minore] `nearlyFreeBands` marca `method: 'empty-lattice'` anche con `mean !== 0`**
   - **Dove:** [centralEquation1d.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/centralEquation1d.ts#L183-L185).
   - **Cosa succede:** `const isEmpty = potential.fourier.every((v) => v === 0)` non controlla `potential.mean`. Con potenziale costante non nullo (`mean: 1, fourier: []`), le bande sono shiftate di `mean` ma vengono etichettate `'empty-lattice'`. In pratica nei preset standard `mean` è 0, quindi è innocuo.

### Valutazione sintetica della Parte C (formule, unità, test)
- **Formule e segni:** tutti conformi a `materiale/parte3/dispensa.tex` §11 e §13. `potentialAt` usa $V(x) = \bar{V} + 2\sum_n V_{nG}\cos(2\pi n x/a)$ (ioni attrattivi in $x=na$ per $V_G < 0$); al bordo $E_-$ è $\psi_c$ (massimo sugli ioni) per $V_G < 0$ ed E_+ è $\psi_s$ (massimo fra gli ioni), e i ruoli si scambiano per $V_G > 0$. `zoneEdgeStandingWave` gestisce correttamente entrambi i segni di $k = \pm\pi/a$ e restituisce `null` per stati degeneri ($V_G=0$).
- **Unità e costanti:** tutte in un solo file ([constants.ts](file:///Users/emanuelerinna/Desktop/App%20Stato%20Solido/src/renderer/src/physics/constants.ts#L7-L22)) coerenti con `progetto.md` ($\hbar^2/2m_0 = 3{,}80998\text{ eV\cdot\AA}^2$, $\text{Ry} = 13{,}6057\text{ eV}$, $\hbar = 6{,}582119569\cdot 10^{-16}\text{ eV\cdot s}$ coerente entro $10^{-6}$).
- **Test e tolleranze:** usano i numeri reali delle dispense (inclusi $4{,}6325 / 5{,}2325 / 0{,}59997$ del §11.2, $-0{,}005 E_0$ del §11.3 e $17{,}731$ di P4 §3.2) e limiti analitici esatti ($V=0$, $E_0 \pm |V_G|$, banda a coseno, Parseval). Le tolleranze sono oneste (da `1e-12` sui casi analitici a `1e-3`/`1e-4` dove il test confronta troncamenti a poche onde o cifre arrotondate della dispensa). Nota: `planeWaveBasis1D` con un numero dispari di onde al bordo ha una componente spaiata ad alta energia (es. $n=5$ per 11 PW), ma anche nel caso estremo degli slider ($a = 6\text{ \AA}, V_G = -3\text{ eV}$) l'errore sul nodo di $\psi_c$ in $a/2$ è appena $6{,}2\cdot 10^{-13}$ e $E_0\text{-band}$ converge a $< 10^{-10}\text{ eV}$ rispetto a 41 PW.

---

## 6. Dubbi e domande per la regia

1. Per la sonda di massa efficace nell'interfaccia dei quasi liberi: se l'utente porta $|V_G|$ molto vicino a $0$ (es. $\sim 10^{-3}\text{ eV}$) vicino al bordo di zona, si preferisce lasciare `inverseEffectiveMassRatio` a differenze finite con `h = 1e-4` (accettando l'arrotondamento per gap sub-meV) oppure introdurre un calcolo tramite somma perturbativa $k\cdot p$ sugli autostati di `CentralSolution1D` (che è esatta fino a $V_G \to 0$ ed è utile anche per mostrare i contributi delle singole bande a $1/m^*$, come previsto in `progetto.md` riga 45)?
2. Per i moduli aggiunti nel frattempo in `src/renderer/src/physics/` (`emptyLattice.ts`, `kronigPenney.ts`, `tightBinding.ts`, `kDotP.ts`), verranno aperti incarichi di controllo incrociato dedicati oppure alcuni sono già stati coperti dai rapporti `02`–`05`?
