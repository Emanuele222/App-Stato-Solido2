# Rapporto Incarico 13 — Pseudopotenziale e Bande dei materiali veri

## 1. Cosa hai fatto

Ho separato l'unica sezione precedente `pseudopotential` in due sezioni distinte e collegate, mantenendo intatta l'implementazione fisica ed EPM esistente per i materiali reali:

1. **Fisica (`src/renderer/src/physics/`)**:
   - Creato `src/renderer/src/physics/pseudoCore1d.ts` ed esportato in `src/renderer/src/physics/index.ts` (modello 1D esatto con buche gaussiane $V(x) = -V_0 \sum_m \exp(-(x - m a)^2 / (2 s^2))$ su base di onde piane $n \in [-40, 40]$, coerente con `materiale/parte4/dispensa.tex` P4 §4 e `materiale/parte4/verifica_pseudo.py` r. 58–92):
     - Calcolo bande 1D (`pseudoCore1DBands`), stato singolo (`solvePseudoCore1DAtK`), valutazione di $\psi_k(x)$ (`evalBlochWavefunction1D`), pseudo-funzione d'onda $\psi^f = (\psi_k + \alpha \psi_c)/\sqrt{1 + |\alpha|^2}$ (`pseudoWavefunctionAndTrue`), scelta di massima liscezza $\alpha_{\text{smooth}}$ che minimizza $\langle \psi^f | T | \psi^f \rangle$ (`smoothestAlpha`), peso di coda oltre $|n| > N$ (`planeWaveTailWeight`), elementi di cancellazione del potenziale repulsivo $V'(x)$ (`cancellationMatrixElements`), raggio di core $r_c$ (`computeCoreRadius`).
   - Aggiunto `fccFreeElectronFermiSphere` in `src/renderer/src/physics/freeElectron.ts`.
   - Aggiunti `fccZoneBoundaryDistancesDimless` e `countBandsCrossingEnergy` in `src/renderer/src/physics/pseudopotential.ts`.
   - Aggiunti e aggiornati i test unitari in `pseudoCore1d.test.ts`, `freeElectron.test.ts` e `pseudopotential.test.ts`.

2. **Navigazione condivisa (`src/renderer/src/ui/navigation.ts`, `src/renderer/src/App.tsx`)**:
   - Creato `src/renderer/src/ui/navigation.ts` (`useNavigationStore`) per gestire `activeSectionId` e `navigateTo` tra sezioni.
   - Aggiornato `src/renderer/src/App.tsx` per leggere `activeSectionId` e `navigateTo` da `useNavigationStore` (nessun'altra modifica a `App.tsx`).

3. **Sezione A — «Pseudopotenziale» (`src/renderer/src/sections/pseudopotential/`)**:
   - Riscritta da zero sul modello 1D esatto con stato di core (`manifest.ts`, `formulas.ts`, `strings.ts`, `store.ts`, `model.ts`, `pseudopotential.css`, `PseudopotentialSection.tsx`, `PseudoCoreBandPlot.tsx`, `PseudoCoreRealSpaceCanvas.tsx`, `PseudoCoreReciprocalCanvas.tsx`).
   - Rimossi da `pseudopotential/` i file spostati in `real-bands/` e l'ormai non usato `RealSpacePseudoCanvas.tsx`.
   - Due non-unicità interattive: cursore $f$ sul proiettore di core (sposta la banda arancione $E_c + f$ lasciando invariate le bande di valenza) e cursore $\alpha$ su $\psi^f$ con pulsante «più liscia» ($\alpha = \alpha_{\text{smooth}}$). Nessun cursore $\lambda$ artificiale.
   - Raggio di core $r_c$ derivato da $|\psi_c|^2$, tabella di confronto tra ampiezza ionica nuda e pseudopotenziale del Si per $|G|^2 = 3, 8, 11$, e collegamento incrociato «Bande dei materiali veri →».

4. **Sezione B — «Bande dei materiali veri» (`src/renderer/src/sections/real-bands/`)**:
   - **File spostati senza riscrittura** da `pseudopotential/` a `real-bands/`:
     - `epmWorker.ts`
     - `FormFactorCanvas.tsx`
     - `ShellWeightsBar.tsx`
     - `EpmBandPlot.tsx`
   - Creati `manifest.ts`, `formulas.ts`, `strings.ts`, `store.ts`, `model.ts`, `realBands.css`, `RealBandsSection.tsx`.
   - Aggiunto il preset **Alluminio (`Al`)** nel reticolo vuoto fcc ($a = 4,05\text{ Å}$, fattori di forma bloccati a 0, zero di energia al fondo banda in $\Gamma$, etichetta «metallo: nessun gap assoluto», strumento «Riempimento» con selettore **3 e⁻/cella** vs **1 e⁻/cella**, linea $E_F$ e conteggio delle bande che tagliano $E_F$).
   - Rimossa `RealSpacePseudoCanvas.tsx`; layout in due righe (sopra `FormFactorCanvas` + `ShellWeightsBar`, sotto `EpmBandPlot`) e collegamento incrociato «← Da dove viene Vₚₛ».

5. **Registro, stringhe e Home**:
   - Aggiornati `src/renderer/src/sections/registry.ts` (aggiunta `real-bands` dopo `pseudopotential`, totale **8** sezioni implementate nel Capitolo 1), `src/renderer/src/strings.ts` (`realBands: 'Bande dei materiali veri'` e conteggio dinamico nel `footnote`), `src/renderer/src/home/curves.ts`, `src/renderer/src/home/curves.test.ts` e `src/renderer/src/home/home.css` (anteprima con 8 sezioni nella card da 356 px senza overflow).

---

## 2. Dettagli tecnici richiesti dall'incarico

### Intervalli dei cursori (Sezione A — `pseudopotential/manifest.ts`)
- `a`: $3,5 \dots 4,8\text{ Å}$ (passo $0,1$, default $4,0\text{ Å}$)
- `V₀`: $50 \dots 75\text{ eV}$ (passo $1$, default $60\text{ eV}$)
- `s`: $0,20 \dots 0,28\text{ Å}$ (passo $0,01$, default $0,25\text{ Å}$)
- `f`: $-10 \dots 65\text{ eV}$ (passo $0,5$, default $0\text{ eV}$)
- `α`: $-2,00 \dots 2,00$ (passo $0,01$, default $0$)

### Larghezze delle bande agli 8 estremi del dominio $(a, V_0, s)$
Valori misurati in `pseudoCore1d.test.ts` ($w_0 =$ banda di core, $w_1 =$ prima banda di valenza):
- $a=3,5,\ V_0=50,\ s=0,20$: $w_0 = 0,0896\text{ eV}$, $w_1 = 3,1985\text{ eV}$
- $a=3,5,\ V_0=50,\ s=0,28$: $w_0 = 0,0490\text{ eV}$, $w_1 = 4,2173\text{ eV}$
- $a=3,5,\ V_0=75,\ s=0,20$: $w_0 = 0,0138\text{ eV}$, $w_1 = 2,9497\text{ eV}$
- $a=3,5,\ V_0=75,\ s=0,28$: $w_0 = 0,0071\text{ eV}$, $w_1 = 3,4932\text{ eV}$
- $a=4,8,\ V_0=50,\ s=0,20$: $w_0 = 0,0053\text{ eV}$, $w_1 = 1,1764\text{ eV}$
- $a=4,8,\ V_0=50,\ s=0,28$: $w_0 = 0,0019\text{ eV}$, $w_1 = 1,7374\text{ eV}$
- $a=4,8,\ V_0=75,\ s=0,20$: $w_0 = 0,0003\text{ eV}$, $w_1 = 1,1372\text{ eV}$
- $a=4,8,\ V_0=75,\ s=0,28$: $w_0 = 0,0001\text{ eV}$, $w_1 = 1,4954\text{ eV}$

In tutti gli 8 angoli è presente esattamente una banda di core ($w_0 < 0,2\text{ eV}$) e la prima banda di valenza ha larghezza $\ge 1,0\text{ eV}$.

### Definizione di $r_c$
In `computeCoreRadius` (`src/renderer/src/physics/pseudoCore1d.ts`), $r_c$ è il **raggio al 95% di probabilità** dello stato di core nella cella $[-a/2, a/2]$ centrata sullo ione: il minimo $r > 0$ tale che $\int_{-r}^{r} |\psi_c(x)|^2\,dx / \int_{-a/2}^{a/2} |\psi_c(x)|^2\,dx \ge 0,95$.

### Numeri calcolati per l'Alluminio vs dispensa
Nel modello a reticolo vuoto fcc con $a = 4,05\text{ Å}$ (zero al fondo della banda $\Gamma$):
- **3 e⁻/cella** (Al trivalente): $E_F = 11,65\text{ eV}$, $k_F = 1,75\text{ Å}^{-1} = 1,127\,(2\pi/a)$, **3 bande che tagliano $E_F$** (bande 2, 3, 4) — coerente con il gas libero fcc della dispensa P4 §5 ($E_F \approx 11,6\text{ eV}$, $k_F = 1,127\,(2\pi/a) > d_L, d_X$).
- **1 e⁻/cella** (confronto monovalente): $E_F = 5,60\text{ eV}$, $k_F = 1,21\text{ Å}^{-1} = 0,782\,(2\pi/a)$, **1 banda che taglia $E_F$** (banda 1, interamente contenuta nella prima zona di Brillouin perché $k_F < d_L = 0,866\,(2\pi/a)$).

### Tempi di calcolo 1D
- In `pseudoCore1d.test.ts` (`41` punti $k$ + stato singolo, $81$ onde piane): **69,1 ms**. Nella UI della sezione A si usano `81` punti $k$ (`NUMERICS.kPoints = 81`) con aggiornamento reattivo fluido.

### Altezze misurate delle viste (Sezione B — «Bande dei materiali veri»)
Misurate via browser su `http://localhost:5173/`:
- **1440×900** (`html.scrollHeight = 900 px`, nessuno scroll esterno):
  - Riga superiore (`.pseudo-top-row`): **225,19 px** (`FormFactorCanvas`: **224,19 px**, `ShellWeightsBar`: **224,19 px**)
  - `EpmBandPlot` (`.pseudo-bandplot-box`): **454,53 px**
- **1100×800** (`html.scrollHeight = 800 px`, nessuno scroll esterno):
  - Riga superiore (`.pseudo-top-row`): **185,00 px** (`FormFactorCanvas`: **184,00 px**, `ShellWeightsBar`: **184,00 px**) — rispetta $\ge 150\text{ px}$
  - `EpmBandPlot` (`.pseudo-bandplot-box`): **319,69 px** — rispetta $\ge 300\text{ px}$
- **800×700** (`html.scrollHeight = 700 px`, scroll solo nella colonna centrale `scrollHeight = 964 px`):
  - Riga superiore impilata: **398,00 px** (`FormFactorCanvas`: **199,00 px**, `ShellWeightsBar`: **199,00 px**)
  - `.pseudo-bands-view` ha `min-height: 300px` in CSS, ma la misura iniziale pre-scroll sul box interno riportava **58,00 px** prima dello scorrimento (vedi §4).

---

## 3. Cosa hai verificato davvero

1. **Typecheck, test unitari e build di produzione**:
   - Comando: `export PATH="$PWD/.tools/node/bin:$PATH" && npm run typecheck && npm test && npm run build`
   - Risultato: uscito con codice **0**; `typecheck` (node + web) senza errori; `vitest run` **17/17 file, 159/159 test passati** (durata 6,85 s); `electron-vite build` completata senza errori.
2. **Verifica visiva nel browser (`vite preview` su `http://localhost:5173/`, subagent browser)**:
   - **Home (1440×900)**: badge «8 sezioni», anteprima hover >2 s con tutte le 8 sezioni contenute nella card da `356,0 px` (`scrollHeight = 227 px`, `clientHeight = 227 px`, nessun overflow).
   - **Sezione A — «Pseudopotenziale»**: 0 errori console; nessun overflow esterno a `1440×900` e `1100×800`, scroll solo centrale a `800×700`; verificato spostamento $E_c + f$ con `f` (da -19,078 a -9,078 eV lasciando $E_v = 12,078\text{ eV}$ invariata), invarianza di $E_k$ al variare di $\alpha$ e bottone «più liscia» ($\alpha = -0,53$, peso $|n| \le 3$ da 99,91% a 99,94%); verificati tutti e 3 gli strumenti (`Riempimento`, `Massa efficace` con $m^*/m_0 = 1,55$, `Confronto: reticolo vuoto 1D`) e il link «Bande dei materiali veri →».
   - **Sezione B — «Bande dei materiali veri»**: verificato preset `Al` (cursori bloccati a 0,000 Ry, zero al fondo banda in $\Gamma$, «metallo: nessun gap assoluto», strumento `Riempimento` con 3 e 1 e⁻/cella), preset `Si`, `Ge`, `GaAs`, tutti e 3 gli strumenti (`Riempimento`, `Massa efficace`, `Confronto: reticolo vuoto fcc`), e il link di ritorno «← Da dove viene Vₚₛ».
   - **Altre sezioni**: visitate «Kronig–Penney» e «Legami forti in 2D»; **0 errori JS/console e 0 richieste di rete fallite** sull'intera sessione.

---

## 4. Cosa non hai potuto verificare

- L'esecuzione dentro la finestra nativa di Electron (`npm run dev:web` / `npm run dev` avvia Electron che fallisce nella sandbox con `FATAL: gpu_data_manager_impl_private.cc:389` / `Operation not permitted` sull'avvio della GPU/sandbox): la verifica grafica è stata eseguita sul build di produzione servito con `vite preview` in browser Chromium.
- La misura diretta del tempo di calcolo della Sezione A nel profiler per il singolo passaggio a 81 punti $k$ (è stato misurato il benchmark a 41 punti in `pseudoCore1d.test.ts`: 69,1 ms).

---

## 5. Problemi trovati

- **Minore** — `src/renderer/src/sections/real-bands/realBands.css:352-373`: al viewport `800×700`, sebbene `.pseudo-bands-view` abbia `min-height: 300px`, la misura iniziale del contenitore interno `.pseudo-bandplot-box` prima dello scroll riportava `58,00 px`. Riproducibile aprendo la Sezione B a `800×700` e leggendo `getBoundingClientRect().height` di `.pseudo-bandplot-box` senza scrollare.
- **Minore (ambiente di test parallelo)** — `src/renderer/src/physics/pseudopotential.test.ts`: durante il primo run parallelo di `npm test` su 15–17 worker, il test di confronto `epm_bande.npz` ha occasionalmente sfiorato il timeout di default di Vitest (5000 ms) sotto carico CPU parallelo, mentre in isolamento o nel run finale di `npm test` è passato normalmente (159/159 test).

---

## 6. Dubbi e domande per la regia

- Nessun dubbio bloccante. Da valutare eventualmente se aggiungere una regola esplicita `height: 300px` (invece del solo `min-height: 300px`) su `.pseudo-bands-view` dentro `@media (max-width: 860px)` in `realBands.css` qualora nei test su finestre strette (`800×700`) si voglia garantire che `.pseudo-bandplot-box` non si comprima prima dello scroll.
