# Revisione B — Fedeltà al corso

**Incarico:** `incarichi/revisore-B-fedelta-corso.md`  
**Criteri:** `.claude/agents/fedelta-corso.md`, `AGENTS.md`, tabella «Notazione» di `progetto.md`  
**Fonti di riferimento:** `materiale/parte3/dispensa.tex`, `materiale/parte4/dispensa.tex`, script `verifica_*.py` in `materiale/`

---

## Sintesi esecutiva

| Sezione (`src/renderer/src/sections/…`) | Dispense di riferimento | Bloccanti | Importanti | Minori | Verdetto sezione |
|---|---|---:|---:|---:|---|
| `empty-lattice/` | P3 §9; P4 §5.1 | 0 | 1 | 2 | **da correggere** |
| `kronig-penney/` | P3 §10 | 0 | 1 | 2 | **approvata** |
| `nearly-free/` | P3 §11 | 0 | 1 | 4 | **da correggere** |
| `tight-binding/` | P3 §12; P4 §1.4, §2 | 0 | 0 | 3 | **approvata** |
| `k-dot-p/` | P4 §3 | 1 | 2 | 3 | **da correggere** |
| `pseudopotential/` | P4 §4, §5.4 | 0 | 1 | 4 | **approvata** |

**Verdetto complessivo:** **da correggere**.  
L'impianto notazionale e concettuale complessivo è molto fedele alle dispense (in particolare per l'adesione sistematica alle correzioni sulle slide e per le unità $\text{\AA}$, $\text{eV}$, $\hbar^2/2m_0 = 3{,}80998\ \text{eV}\cdot\text{\AA}^2$, $\text{Ry} = 13{,}6057\ \text{eV}$), ma restano un errore **bloccante** in `k-dot-p/` (tooltip del confronto a due bande con `E_g +` applicato a entrambe le parabole `±`, quindi anche alla valenza `lh`) e alcuni scarti **importanti** (ambiguità interna `k`/`k'` in `empty-lattice/`, assenza dell'equazione centrale e dei pesi `c_G` in `nearly-free/`, cambio di segno della massa `lh` tra le due varianti in `k-dot-p/`).

---

## Parte 1 — Analisi sezione per sezione

### 1. `empty-lattice/` — *Reticolo vuoto e schemi di zona*
**Riferimenti:** Parte 3 §9 (`dispensa.tex:769-896`), formulario P3 (`r. 2274-2275`), Parte 4 §5.1 (`dispensa.tex:1317-1344`), formulario P4 (`r. 2237`).

#### Problemi in ordine di gravità

1. **[Importante] Conflitto interno sul significato di $k$ e $k'$ tra `Formula viva`, `Valori` e `Scheda teoria`**
   - **Dove:** `src/renderer/src/sections/empty-lattice/formulas.ts:21,29,31` contro `strings.ts:103` e `EmptyLatticeSection.tsx:334,340`.
   - **Cosa differisce:** Nel pannello «Formula viva», la formula principale (`formulas.ts:21`) scrive `E = \hbar^2(k+G)^2/2m_0` e la seconda definizione (`formulas.ts:29`) scrive `-\pi/a < k \le \pi/a`: in entrambi i casi `k` indica il **vettore ridotto**. Subito sotto, la quarta definizione (`formulas.ts:31`) scrive `k = k' + G`, dove invece `k` è il **vettore esteso** e `k'` è il **vettore ridotto**. Nella `Scheda teoria` (`strings.ts:103`) e nel pannello `Valori` (`EmptyLatticeSection.tsx:334,340`) si usa sistematicamente `k` per l'esteso e `k'` per il ridotto (`E = \hbar^2(k'+G)^2/2m_0`). La sezione mescola così le due convenzioni della P3 (che usa `k` per entrambi, `r. 859, 2275`) e della P4 §5.1 (che introduce `k = k' + G` con `k'` in prima zona, `r. 1332, 2237`) dentro lo stesso riquadro.
   - **Riferimento nella dispensa:** P3 §9.3 (`r. 859`, formulario `r. 2275`) e P4 §5.1 (`r. 1332`, formulario `r. 2237`).
   - **Correzione proposta:** Adottare una sola convenzione in tutta la sezione (preferibilmente quella già usata in `Valori` e `Scheda teoria`: `k` esteso, `k'` ridotto): scrivere `E(k') = \hbar^2(k'+G)^2/2m_0` in `formulas.ts:21`, `-\pi/a < k' \le \pi/a` in `formulas.ts:29` e `k = k' + G` in `formulas.ts:31` (con `E_k = \hbar^2 k^2/2m_0` per la parabola estesa).

2. **[Minore] `E_k` definita solo in prosa e mancata indicazione esplicita dell'argomento di `E`**
   - **Dove:** `formulas.ts:21,28` e `strings.ts:103,120`.
   - **Cosa differisce:** La formula principale (`formulas.ts:21`) scrive `E = \dots` senza `(k)` o `(k')` e `E_k = \hbar^2 k^2/2m_0` non compare tra le `DEFINITIONS` (`formulas.ts:27-32`), pur essendo richiamata in `strings.ts:103,120`.
   - **Riferimento nella dispensa:** P3 §9.3 (`r. 854, 859`), `progetto.md:58-59`.
   - **Correzione proposta:** Aggiungere `E_k = \hbar^2 k^2/2m_0` in `DEFINITIONS` e scrivere `E(k')` (o `E(k)`) nella formula principale.

3. **[Minore] Mancano nella scheda teoria i richiami alle dimostrazioni alternative di periodicità**
   - **Dove:** `strings.ts:91-119`.
   - **Cosa differisce:** La scheda teoria tratta lo sfasamento $e^{i(k+G)a}=e^{ika}$ (P3 `r. 784`) e i tre schemi di zona, ma non menziona la proprietà $\psi_{n,\vk+\mathbf G}=\psi_{n\vk}$ (presente al formulario P3 `r. 2274` accanto a $E_{n,\vk+\mathbf G}=E_{n\vk}$, riportato solo per l'energia in `formulas.ts:28`).
   - **Riferimento nella dispensa:** P3 §9.1 (`r. 779`) e formulario (`r. 2274`).
   - **Correzione proposta:** Completare `formulas.ts:28` con `\psi_{n,k+G} = \psi_{n,k}` oppure citarlo in `strings.ts:96`.

**Verdetto `empty-lattice/`:** **da correggere** (per l'ambiguità `Importante` `k`/`k'` dentro `Formula viva` vs `Valori`).

---

### 2. `kronig-penney/` — *Kronig–Penney*
**Riferimenti:** Parte 3 §10 (`dispensa.tex:899-1223`), formulario P3 (`r. 2276-2286`).

#### Problemi in ordine di gravità

1. **[Importante] Simboli `L_\delta(E)` e `P_{\mathrm{eff}}` introdotti dall'app senza corrispettivo nelle dispense**
   - **Dove:** `src/renderer/src/sections/kronig-penney/formulas.ts:9`, `strings.ts:58` e `KronigPenneySection.tsx:380`.
   - **Cosa differisce:** Nella dispensa P3 §10.2 (`r. 1079`) e nel formulario (`r. 2282`), il membro destro del modello a delta è indicato con $f(\alpha a)$ (etichetta usata giustamente sull'asse del grafico in `strings.ts:58`), mentre in `formulas.ts:9` compare `L_\delta(E)`. Inoltre, nel pannello `Valori` della variante rettangolare (`KronigPenneySection.tsx:380`), compare il simbolo `P_{\mathrm{eff}}` (corrispondente al limite a delta con `aV_0 \to V_0 c`, P3 `r. 1137`, cioè $P_{\mathrm{eff}} = m_0 a V_0 c/\hbar^2$), ma questo simbolo e la sua definizione non figurano né nella dispensa né in `formulas.ts`.
   - **Riferimento nella dispensa:** P3 §10.2 (`r. 1079`, formulario `r. 2282`) e §10.3 (`r. 1129-1137`).
   - **Correzione proposta:** Usare `f(\alpha a)` in `formulas.ts:9` (allineandolo all'asse del grafico `strings.ts:58`) e spiegare esplicitamente `P_{\mathrm{eff}} = m_0 a V_0 c/\hbar^2` in `KronigPenneySection.tsx:380` o sostituirlo con la formula esplicita del limite a delta `aV_0 \to V_0 c`.

2. **[Minore] Assenza delle equazioni della buca finita isolata e della legge esponenziale `W` nelle formule**
   - **Dove:** `formulas.ts:14-21` e `strings.ts:115`.
   - **Cosa differisce:** Nel grafico compaiono i livelli «genitori» della buca isolata (`strings.ts:67-68`), ma in `formulas.ts` mancano le formule della buca finita del richiamo (P3 §10.1, formulario `r. 2278-2279`: $\xi^2+\eta^2=\rho^2$, $N=\lfloor 2\rho/\pi\rfloor+1$, $\eta=\xi\tan\xi$, $\eta=-\xi\cot\xi$). Manca inoltre in `formulas.ts:21` `v = \frac{2ta}{\hbar}\sin ka` (formulario `r. 2286`) e la legge di scala `W \propto e^{-\beta c}` (presente solo in prosa in `strings.ts:115`).
   - **Riferimento nella dispensa:** P3 §10.1 (`r. 958-960`, `2277-2279`), §10.3–10.5 (`r. 2284-2286`).
   - **Correzione proposta:** Aggiungere in `DEFINITIONS_RECT` o `COSINE_FORMULA` almeno `W \propto e^{-\beta c}` e il riferimento a $N=\lfloor 2\rho/\pi\rfloor+1$.

3. **[Minore] Segno `±`/`∓` in `COSINE_FORMULA`**
   - **Dove:** `formulas.ts:21`.
   - **Cosa differisce:** Scrive `E(k) \approx \bar E \mp 2t\cos ka` (estendendo la formula del formulario `r. 2285` che riporta solo `E_-(k) = \bar E - 2t\cos ka` e in `r. 1174` scrive `E_+(k) = \frac12(E_4+E_3) + \frac12(E_4-E_3)\cos ka`). È fisicamente corretto perché nella prima banda vale `-` e nella seconda `+`, ma andrebbe chiarito che `-` vale per le bande dispari e `+` per le pari.
   - **Riferimento nella dispensa:** P3 §10.4 (`r. 1170, 1174`, `2285`).
   - **Correzione proposta:** Specificare `(- \text{ bande dispari}, + \text{ bande pari})` accanto a `\mp` in `formulas.ts:21` e `strings.ts:18`.

**Verdetto `kronig-penney/`:** **approvata** (salvo pulizia minore su `L_\delta` / `P_{\mathrm{eff}}`; tutte le convenzioni fisiche e le correzioni alle slide sono rispettate fedelmente).

---

### 3. `nearly-free/` — *Elettroni quasi liberi*
**Riferimenti:** Parte 3 §11 (`dispensa.tex:1225-1713`), formulario P3 (`r. 2287-2303`).

#### Problemi in ordine di gravità

1. **[Importante] Assenti l'equazione centrale e i pesi `c_G` delle onde piane**
   - **Dove:** `src/renderer/src/sections/nearly-free/formulas.ts` e `NearlyFreeSection.tsx`.
   - **Cosa differisce:** La sezione presenta solo il troncamento a due onde (`E_\pm(k)` in `MAIN_FORMULA`, `formulas.ts:25-30`), mentre nella dispensa P3 §11 il calcolo parte dall'**equazione centrale** `(E_{k+G}-E)c_G + \sum_{G'} V_{G-G'}c_{G'} = 0` (`r. 1325, 2290`) e dai pesi perturbativi `c_{nG} \simeq \frac{V_{nG}}{E_k-E_{k+nG}} c_0` (`r. 1380, 2292`), peraltro previsti esplicitamente anche nella scheda di sezione di `progetto.md:36` («pesi c_G delle onde piane»). In tutta l'app l'equazione centrale compare così solo in `pseudopotential/formulas.ts:12`.
   - **Riferimento nella dispensa:** P3 §11.3 (`r. 1324-1326`) e §11.4 (`r. 1380`), formulario (`r. 2290-2292`).
   - **Correzione proposta:** Inserire in `nearly-free/formulas.ts` (o in un pannello espandibile della `Formula viva` / `Scheda teoria`) l'equazione centrale 1D `(E_{k+G}-E)c_G + \sum_{G'} V_{G-G'}c_{G'} = 0` e la stima `c_{nG} \simeq \frac{V_{nG}}{E_k-E_{k+nG}} c_0` (idealmente affiancata ai pesi $|c_G|^2$ dello stato selezionato).

2. **[Minore] Affermazione assente dalla dispensa sul gap al secondo ordine in $k = 0$**
   - **Dove:** `src/renderer/src/sections/nearly-free/strings.ts:125`.
   - **Cosa differisce:** Il piè di pagina della `Scheda teoria` afferma: «Con $V_G$ grande anche in $k=0$ compare un piccolo gap al secondo ordine, $\simeq V_G^2/2E_0$.» L'espressione è matematicamente esatta (accoppiamento di $|G=0\rangle$ con $(|+G\rangle+|-G\rangle)/\sqrt{2}$ a distanza $4E_0$), ma **non compare in P3 §11** né nel formulario, e non è segnalata come nota aggiuntiva rispetto alla dispensa.
   - **Riferimento nella dispensa:** Assente in P3 §11 (`r. 1225-1713`); P3 §11.4 `r. 1416` analizza solo lo spostamento al secondo ordine al bordo `V_G^2/8E_0`.
   - **Correzione proposta:** Segnalare che è una nota numerica oltre l'approssimazione a due onde della dispensa (o sostituirla con il risultato riportato in `r. 1416`: abbassamento dei bordi di $\simeq V_G^2/8E_0$).

3. **[Minore] Semplificazione su `\psi_c`, `\psi_s` e formule mancanti in `formulas.ts` (parabola al bordo, `\bar V`, impulso)**
   - **Dove:** `nearly-free/formulas.ts:33-45` e `strings.ts:107,115`.
   - **Cosa differisce:** `formulas.ts:43` scrive `\psi_c \propto \cos(\pi x/a)` e `\psi_s \propto \sin(\pi x/a)` omettendo il fattore $i$ in $\psi_s = 2i\sin(\pi x/a)$ (P3 `r. 1423, 2296`). Inoltre `formulas.ts` non riporta la parabola vicino al bordo `E_\pm(\tilde k) = E_0 \pm |V_G| + \frac{\hbar^2\tilde k^2}{2m_0}(1 \pm \frac{2E_0}{|V_G|})`, la relazione `m_0/m^*_\pm = 1 \pm 2E_0/|V_G|` (comunque citata nella `Scheda teoria` `strings.ts:115`), `E_\pm = E_0 + \bar V \pm |V_G|` né `p\psi_c = \frac{\hbar\pi}{a}\psi_s` con `v_g = 0` (solo `v = 0` in `strings.ts:115`).
   - **Riferimento nella dispensa:** P3 §11.5 (`r. 1423, 1521, 1527-1528`), §11.7 (`r. 1625`), formulario (`r. 2295-2301`).
   - **Correzione proposta:** Aggiungere la formula di `m_0/m^*_\pm = 1 \pm 2E_0/|V_G|` in `EDGE_FORMULAS` (`formulas.ts:41-45`).

4. **[Minore] Numeri dei preset `Germanio` e `Diamante` non identici alla dispensa**
   - **Dove:** `nearly-free/manifest.ts:46,48`.
   - **Cosa differisce:** Il preset `Germanio` usa `gap: 0.67` eV e `a: 5.66` Å (in P4 §3 `r. 809` la dispensa indica `circa 0,66 eV` a `300 K`; `5.658` Å è in `verifica_pseudo.py:54`, non in `dispensa.tex`), e `Diamante` usa `a: 3.57` Å, `gap: 5.47` eV (la dispensa in P3 `r. 221`, `verifica_bande.py:51` e P4 `r. 2527` usa `\simeq 5,5 eV`; `3.57 Å` non compare nei testi in `materiale/`). I preset sono però espressamente dichiarati «Indicativi» in `strings.ts:35,125`.
   - **Riferimento nella dispensa:** P3 `r. 221`, P4 `r. 809`, `r. 2527`, `verifica_bande.py:51`.
   - **Correzione proposta:** Opzionale: allineare `Diamante` a `5.5` eV e `Germanio` a `0.66` eV (come in `k-dot-p/manifest.ts:98`), mantenendo la nota «Indicativi».

5. **[Minore] Stima del potenziale non debole `|V_G| \ll E_0` nel pannello `Valori`**
   - **Dove:** `nearly-free/strings.ts:89-90` (usato in `NearlyFreeSection.tsx`).
   - **Cosa differisce:** Segnala giustamente quando `|V_G|/E_0` è grande, mentre P3 §11.4 (`r. 1391`) formula l'ipotesi come `|V_G| \ll E_k` (`E_0` al bordo) e la condizione della parabola (`r. 1544`) come `2E_0/|V_G| \gg 1`. È sostanzialmente equivalente, ma è utile ricordare che la condizione sulla parabola è più restrittiva (`\hbar^2 G |\tilde k| / 2m_0 \ll |V_G|`, `r. 1514`).
   - **Riferimento nella dispensa:** P3 `r. 1391, 1514, 1544`.
   - **Correzione proposta:** Nessuna urgente; eventuale nota sulla finestra `|\tilde k|` di validità della parabola vicino al bordo.

**Verdetto `nearly-free/`:** **da correggere** (mancano equazione centrale e pesi `c_G`, cardini di P3 §11.3–11.4 e previsti in `progetto.md:36`).

---

### 4. `tight-binding/` — *Legami forti*
**Riferimenti:** Parte 3 §12 (`dispensa.tex:1714-2013`), Parte 4 §§1.4 e 2 (`dispensa.tex:84-482`), formulari P3 (`r. 2304-2311`) e P4 (`r. 2196-2211`).

La sezione segue con grande precisione la notazione e tutte le correzioni della dispensa sulle slide (inclusi `t_p < 0`, combinazione legante $s$ con segno $+$, $E(k)$, $\bar E_n$, catena biatomica con vicini $B_{n-1}, B_n$ che producono $\cos^2(ka/2)$ anziché $\cos ka$, bande fuori da $[E_A, E_B]$ e $W \simeq 4t^2/(E_B-E_A)$). I contenuti 2D/3D (cubico semplice P4 §1.4 e grafene P4 §6) non sono presenti perché espressamente rinviati alla «vetrina 2D» (`progetto.md:38,131`).

#### Problemi in ordine di gravità

1. **[Minore] Parametro $\lambda$ della legge esponenziale indicativa non esplicitato nel badge**
   - **Dove:** `src/renderer/src/sections/tight-binding/strings.ts:38` e `manifest.ts:61-64`.
   - **Cosa differisce:** Il badge dell'interruttore «Avvicina gli atomi» mostra `$t(a) = t(a_0)\,e^{-(a-a_0)/\lambda}$ — modello indicativo` senza indicare i valori fissati in `manifest.ts:62-63` (`a₀ = 3,0 Å`, `λ = 0,8 Å`). In più, `λ` qui rappresenta una lunghezza di decadimento (mentre altrove nel corso `λ` è la costante spin–orbita in P4 §3).
   - **Riferimento nella dispensa:** P3 §12.1 (`r. 1768-1780`, dipendenza qualitativa da `a` senza legge analitica); P4 §3 (`r. 689`, `\lambda` spin–orbita).
   - **Correzione proposta:** Scrivere esplicitamente `a₀ = 3 Å, λ = 0,8 Å` nel tooltip (`strings.ts:37`) o usare `d_0` al posto di `\lambda` per evitare collisione simbolica con P4 §3.

2. **[Minore] Omissioni di formule secondarie in `formulas.ts` rispetto ai formulari 1D/biatomica**
   - **Dove:** `tight-binding/formulas.ts:27,44-55`.
   - **Cosa differisce:** (a) In `GENERAL_FORMULA` (`formulas.ts:27`) la somma è scritta su scalare `R \neq 0` (adatta al modello 1D mostrato), anziché su vettori `\mathbf R \neq 0` e con integrale `t(\mathbf R)` esplicito (`P3 r. 2307`); manca il sistema `(I)` per `M` orbitali (`P4 r. 2198`, `P3 r. 2310`). (b) Nella variante biatomica (`formulas.ts:44-55`), mancano le equazioni accoppiate `(1a)–(2a)` `(E_A-E)b_A - t(1+e^{-ika})b_B = 0` e `-t(1+e^{ika})b_A + (E_B-E)b_B = 0` (`P4 r. 2205-2206`), l'espressione esatta della distanza in `k=0` `E_+(0)-E_-(0) = 2\sqrt{\frac14(E_B-E_A)^2+4t^2}` (`P4 r. 2209`, pur calcolata numericamente in `TightBindingSection.tsx:481`) e lo sviluppo asintotico `E_\pm \simeq E_{B,A} \pm W\cos^2(ka/2)` (`P4 r. 2210`).
   - **Riferimento nella dispensa:** Formulari P3 (`r. 2307, 2310`) e P4 (`r. 2198-2199, 2205-2210`).
   - **Correzione proposta:** Aggiungere almeno lo sviluppo `E_\pm \simeq E_{B,A} \pm W\cos^2(ka/2)` accanto alla definizione di `W` in `DIATOMIC_DEFINITIONS` (`formulas.ts:53`) e la definizione dell'integrale di sovrapposizione `t(R) = -\int \varphi_n^* \Delta V \varphi_n(r-R)\,dr` nella scheda teoria (`strings.ts:111`).

3. **[Minore] Sviluppi 3D (cubico semplice) e grafene non presenti (rinviati)**
   - **Dove:** Assenza di `cubico semplice` (P4 §1.4) e `grafene` (P4 §6) nella sezione.
   - **Cosa differisce:** In `progetto.md:38,131` questi argomenti sono esplicitamente assegnati alla «vetrina 2D» da fare separatamente; tuttavia l'incarico cita `P4 §1.4` tra le fonti della sezione `tight-binding/` e il cubico semplice (`E(\mathbf k) = \bar E_s - 2t(\cos k_x a + \cos k_y a + \cos k_z a)`, `W = 12t`) compare anche in P3 §12.4 (`r. 1998-2001`).
   - **Riferimento nella dispensa:** P3 §12.4 (`r. 1991-2001`), P4 §1.4 (`r. 223-277`), `progetto.md:38,131`.
   - **Correzione proposta:** Confermare con la regia che il cubico semplice resti nella futura «vetrina 2D/3D», aggiungendo al più una riga di rimando (`W = 2zt`, 3D `W = 12t`) nella `Scheda teoria` (`strings.ts:111`).

**Verdetto `tight-binding/`:** **approvata**.

---

### 5. `k-dot-p/` — *Metodo k·p*
**Riferimenti:** Parte 4 §3 (`dispensa.tex:483-828`), formulario P4 (`r. 2212-2223`), `materiale/parte4/verifica_kp.py`.

#### Problemi in ordine di gravità

1. **[Bloccante] Formula errata nel tooltip del confronto a due bande (`E_g +` applicato a `±`)**
   - **Dove:** `src/renderer/src/sections/k-dot-p/strings.ts:44` (`tools.compareTwoBandTitle`).
   - **Cosa differisce:** Il tooltip recita:  
     `Sovrappone le parabole di massa efficace E_g + ħ²k²/2m₀ ± P²k²/E_g`.  
     Scrivere `E_g + ... ± ...` colloca **entrambe** le parabole (sia `E_c` sia `E_{lh}`) attorno a `E_g`! In realtà la banda di conduzione `E_c` parte da `E_g` (`E_c \simeq E_g + \hbar^2 k^2/2m_0 + P^2 k^2/E_g`), mentre la banda delle lacune leggere `E_{lh}` parte dalla cima della valenza (`0`), cioè `E_{lh} \simeq \hbar^2 k^2/2m_0 - P^2 k^2/E_g` (come il codice plotta correttamente nel grafico, ma in netto contrasto con la stringa letta dallo studente al passaggio del mouse).
   - **Riferimento nella dispensa:** P4 §3 (`r. 772`): `$E_c \simeq E_g + \frac{\hbar^2 k^2}{2m_0} + \frac{P^2 k^2}{E_g},\qquad E_{lh} \simeq \frac{\hbar^2 k^2}{2m_0} - \frac{P^2 k^2}{E_g}$`.
   - **Correzione proposta:** Sostituire `strings.ts:44` con:  
     `Sovrappone le parabole di massa efficace E_c ≃ E_g + ħ²k²/2m₀ + P²k²/E_g ed E_lh ≃ ħ²k²/2m₀ − P²k²/E_g`.

2. **[Importante] Convenzione di segno opposta tra `m_{lh}/m_0` (Kane, positiva) e `m^*_{lh}(0)/m_0` (Due bande, negativa) nel pannello `Valori`**
   - **Dove:** `src/renderer/src/sections/k-dot-p/KDotPSection.tsx:347-350` vs `KDotPSection.tsx:380-385`.
   - **Cosa differisce:** Nella variante «Quattro bande (Kane)» (`KDotPSection.tsx:340-364`), sotto il titolo «masse in unità di $m_0$» (`strings.ts:119`), le tre masse di valenza (`m_{lh}`, `m_{so}`, `m_{hh}`) sono stampate **positive** (masse delle lacune, P4 `r. 744`: «le masse (delle lacune, per le valenze)»). Passando invece alla variante «Due bande, esatto» (`KDotPSection.tsx:365-387`), nello stesso blocco tabellare compaiono `m^*_c(0)/m_0 = 1/(1 + E_P/E_g) > 0` e `$m^*_{lh}(0)/m_0$ = 1/(1 - E_P/E_g) < 0` (massa di curvatura dell'elettrone in valenza). Anche se il simbolo cambia da `m_{lh}` a `m^*_{lh}`, la coesistenza di massa della lacuna positiva in una variante e massa di curvatura negativa nello stesso slot dell'altra variante è spiazzante; la dispensa nel modello a due bande scrive `|m^*| \simeq m_0 E_g/E_P` (`r. 775`).
   - **Riferimento nella dispensa:** P4 §3 (`r. 744-748`, `775`) e P3 §13.3 (`r. 2119`: `m_h \equiv -m^* > 0`).
   - **Correzione proposta:** Mostrare anche in «Due bande, esatto» la massa di lacuna positiva `m_{lh}/m_0 = 1/(E_P/E_g - 1)` (oppure affiancare esplicitamente `m_{lh} = -m^*_{lh} > 0` spiegando il segno della curvatura nella riga).

3. **[Importante] Rimandi a numeri di slide / righe del sorgente e assenza del preset `Si` richiesto in `progetto.md`**
   - **Dove:** `strings.ts:17,68,106,126,144` («slide 41», «P4 §3» nel titolo visibile); `manifest.ts:71,73-100` (manca `Si`, previsto in `progetto.md:39`).
   - **Cosa differisce:** (a) L'interfaccia utente visibile allo studente contiene riferimenti interni alla numerazione delle slide del docente («slide 41» in `strings.ts:17,68,106,126`), che ha senso nella dispensa ma risulta opaca o fuorviante dentro l'app se lo studente non ha sottomano esattamente quella presentazione. (b) Manca il preset `Si` elencato in `progetto.md:39`, ma questa omissione è **ben motivata** in `strings.ts:33` e `manifest.ts:71`: la tabella della dispensa (P4 `r. 794`) dà per il Si solo `m_hh`, `m_lh`, `\Delta = 0,044 eV`, ma non il gap diretto `E_g(\Gamma)`.
   - **Riferimento nella dispensa:** P4 §3 (`r. 794, 810-811`).
   - **Correzione proposta:** Togliere i riferimenti nudi a `(slide 41)` dai testi dell'interfaccia (es. `strings.ts:68` `−1 libero (convenzione Kittel)` invece di `(slide 41)`, `strings.ts:126` `ordine di grandezza` invece di `(slide 41)`), lasciando eventualmente i riferimenti bibliografici in nota di piè pagina; confermare con la regia l'esclusione del `Si` per mancanza di `E_g(\Gamma)` nelle dispense.

4. **[Minore] `TWO_BAND_MATRIX_FORMULA` incompleta rispetto a P4 `r. 770-772`**
   - **Dove:** `src/renderer/src/sections/k-dot-p/formulas.ts:25-30`.
   - **Cosa differisce:** Riporta la matrice `2\times2` `H`, gli autovalori esatti `E_\pm(k)` e lo sviluppo della sola banda di conduzione `E_c`, omettendo lo sviluppo di `E_{lh} \simeq \frac{\hbar^2 k^2}{2m_0} - \frac{P^2 k^2}{E_g}` e la dispersione delle valenze non accoppiate `|X\rangle, |Y\rangle` (`E = \frac{\hbar^2 k^2}{2m_0}`, P4 `r. 770-772`), pur correttamente descritte in `strings.ts:173` e in `GammaLevelsCanvas.tsx:272-273`.
   - **Riferimento nella dispensa:** P4 §3 (`r. 770-772`).
   - **Correzione proposta:** Aggiungere la riga per `E_{lh}` (e l'indicazione `|X\rangle, |Y\rangle: \hbar^2 k^2/2m_0`) in `TWO_BAND_MATRIX_FORMULA`.

5. **[Minore] Omissioni rispetto a P4 §3 e formulario (`u_{n\mathbf{k}}` completa e stati $\Phi_{J,m_J}$)**
   - **Dove:** `formulas.ts` e `strings.ts`.
   - **Cosa differisce:** Manca nella `Formula viva` l'equazione effettiva di Schrödinger per `u_{n\mathbf k}` con `H_0` e `H'_{\mathbf k}` (P4 `r. 500`, `2213-2214`; in `strings.ts:159` compare solo `H'_{\mathbf k}`) e mancano le combinazioni di spin–orbita `\Phi_{3/2,\pm3/2}, \Phi_{3/2,\pm1/2}, \Phi_{1/2,\pm1/2}` (P4 `r. 714-724`, non richieste però nel formulario finale `r. 2212-2223`).
   - **Riferimento nella dispensa:** P4 §3 (`r. 500, 714-724, 2213-2214`).
   - **Correzione proposta:** Facoltativa: inserire `H_0 + H'_k` nel testo o nella `Formula viva` della vista generale.

6. **[Minore] Stringa inutilizzata `verification.minusLabel`**
   - **Dove:** `src/renderer/src/sections/k-dot-p/strings.ts:149` (non usata in `KDotPSection.tsx:437-468`).
   - **Cosa differisce:** Dichiara l'etichetta per la banda inferiore `E_-` nella scheda di verifica sui quasi liberi, ma il componente mostra giustamente solo `E_+` (`m_0/m^*_+ = 17,731`), come in P4 `r. 659-660`.
   - **Riferimento nella dispensa:** P4 §3 (`r. 659-660`).
   - **Correzione proposta:** Rimuovere la chiave inutilizzata o completare opzionalmente la riga anche per `E_-`.

**Verdetto `k-dot-p/`:** **da correggere** (errore **bloccante** nel tooltip `strings.ts:44` e discrepanza di segno **importante** su `m^*_{lh}` in `KDotPSection.tsx:381-385`).

---

### 6. `pseudopotential/` — *Pseudopotenziale*
**Riferimenti:** Parte 4 §4 (`dispensa.tex:829-1299`) e §5.4 (`r. 1465-1494`), formulario P4 (`r. 2224-2235`), `materiale/parte4/verifica_pseudo.py` e `verifica_bande_reali.py`.

#### Problemi in ordine di gravità

1. **[Importante] Scarto `−0,21` vs `−0,211` Ry per `V_3^s` del Silicio e omissione del preset `Ge` rispetto a `progetto.md`**
   - **Dove:** `src/renderer/src/sections/pseudopotential/manifest.ts:65` (`v3s: -0.21`), `model.ts:442` (`-0.21 * RYDBERG_EV`), `strings.ts:15` (esclusione del `Ge`).
   - **Cosa differisce:**
     - (a) La tabella dei fattori di forma nella dispensa P4 §4 (`r. 1109`) riporta per il silicio `V_3^s = -0{,}211\ \text{Ry}` (valore usato anche in `verifica_pseudo.py:27,31`, che produce `-0{,}211 \times 13{,}6057 = -2{,}87\ \text{eV}$, arrotondato a `-2{,}9\ \text{eV}` nell'esempio P4 `r. 907`). La sezione usa invece `-0,21 Ry`, ereditandolo da `verifica_bande_reali.py:140` (usato per generare `epm_bande.npz`), sia nel preset sia nella scheda di confronto con lo ione nudo (`model.ts:442`, che restituisce `-2,86 eV` anziché `-2,87 / -2,9 eV`).
     - (b) `progetto.md:40,47` prevede `Ge` tra i preset con dati completi («Si e Ge (solo fattori simmetrici)»), avendo il `Ge` struttura diamante (`V^a = 0`). `strings.ts:15` e `manifest.ts:58-59` lo escludono correttamente rispetto a `dispensa.tex` (dove il passo reticolare `a` del `Ge` effettivamente non è stampato) e a `verifica_bande_reali.py:140-141`, ma va notato che in `materiale/parte4/verifica_pseudo.py:54` compare `("Ge", 5.658)` e i fattori simmetrici del Ge sono nella tabella P4 `r. 1109-1111` (`-0,269; 0,038; 0,035`).
   - **Riferimento nella dispensa:** P4 §4 (`r. 907`, `1109-1111`), `verifica_bande_reali.py:140`, `verifica_pseudo.py:27,31,54`, `progetto.md:40,47`.
   - **Correzione proposta:** Segnalare la scelta `-0,21` vs `-0,211` Ry alla regia (lasciando `-0,21` per il confronto diretto con `epm_bande.npz`, ma eventualmente citando `-0,211` Ry = `-2,9 eV` nella scheda ione nudo di `model.ts:442`); chiedere alla regia se aggiungere il preset `Ge` (`a = 5,658 Å` da `verifica_pseudo.py:54`).

2. **[Minore] Pedice `\mathbf{k}` omesso in `PSEUDO_EQ_FORMULA` e indici `|G|^2` omessi in `CENTRAL_EPM_FORMULA`**
   - **Dove:** `src/renderer/src/sections/pseudopotential/formulas.ts:6-7,13`.
   - **Cosa differisce:** In `PSEUDO_EQ_FORMULA` (`r. 6-7`) scrive `\psi^{\mathrm f}` e `|\psi_c\rangle\langle\psi_c|` senza il pedice `\mathbf k` (che figura invece nel formulario P4 `r. 2227-2229`, ed è presente in `strings.ts:131`). In `CENTRAL_EPM_FORMULA` (`r. 13`) scrive `V_{\mathbf G} = V^s \cos(\mathbf G\cdot\boldsymbol\tau) + i V^a \sin(\mathbf G\cdot\boldsymbol\tau)` senza indicare il pedice `|\mathbf G|^2` sui fattori di forma (`V^s_{|\mathbf G|^2}`, `V^a_{|\mathbf G|^2}`), laddove la dispensa sottolinea che i fattori di forma dipendono dal modulo `|\mathbf G|^2 = 3, 4, 8, 11` (`r. 1100-1103`).
   - **Riferimento nella dispensa:** P4 §4 (`r. 1100-1103`, `2227-2229`).
   - **Correzione proposta:** Aggiungere il pedice `\mathbf k` in `formulas.ts:6-7` e scrivere `V^s(G)` / `V^a(G)` (o `V^s_{|\mathbf G|^2}`) in `formulas.ts:13`.

3. **[Minore] Parametri delle curve di modello nello spazio reale/reciproco non precisati a schermo**
   - **Dove:** `model.ts:437-438`, `strings.ts:44,52,55,58`.
   - **Cosa differisce:** Le curve grafiche sono esplicitamente marcate «curve di modello indicative» (`strings.ts:44`) e «curva tratteggiata indicativa (Ashcroft + Thomas–Fermi, tipo Si)» (`strings.ts:55,58`). I parametri numerici interni (`r_c = 0,72` nella figura reale, `R_c = 0,57 Å` nella curva `v(q)`) non provengono dalle dispense e non sono dichiarati nel testo; manca inoltre il richiamo qualitativo di P4 `r. 1121-1122` che `r_c` è «circa metà della lunghezza di legame».
   - **Riferimento nella dispensa:** P4 §4 fig. 4.1 (`r. 1121-1125`).
   - **Correzione proposta:** Aggiungere nel tooltip o nella didascalia della vista reale la nota della dispensa: «$r_c$ $\simeq$ metà della lunghezza di legame».

4. **[Minore] Omissioni secondarie nelle formule (OPW, formula `v_{\mathrm{ion}}/\varepsilon`, formula ione nudo)**
   - **Dove:** `formulas.ts` e `strings.ts`.
   - **Cosa differisce:** Mancano dalle formule KaTeX (a) le equazioni dell'OPW `\chi_{\mathbf k} = e^{i\mathbf k\cdot\mathbf r} + \sum_c \beta_c(\mathbf k)\psi_{c\mathbf k}`, `\beta_c(\mathbf k) = -\langle\psi_{c\mathbf k}|e^{i\mathbf k\cdot\mathbf r}\rangle` (`P4 r. 2225`, parzialmente resa come espansione di `\psi_{\mathbf k}` in `strings.ts:131`), (b) la formula di stima dello ione nudo `|V_{\mathbf G}| \simeq 13{,}6\ \text{eV} (a_0^3/\Omega) 8\pi Z/(a_0 G)^2` (`P4 r. 2230`, comunque calcolata numericamente nel pannello `BareIonCard`) e (c) i passaggi `v(q) = v_{\mathrm{ion}}(q)/\varepsilon(q)`, `k_{\mathrm{TF}}^2 = e^2 g(E_F)/\varepsilon_0` che portano a `v(0) = -\frac23 E_F` (`P4 r. 2233-2234`).
   - **Riferimento nella dispensa:** Formulario P4 (`r. 2225, 2230, 2233-2234`).
   - **Correzione proposta:** Aggiungere la formula della schermatura `v(q) = v_{\mathrm{ion}}(q)/\varepsilon(q)` accanto a `v(0) = -\frac23 E_F` in `LIMIT_V0_FORMULA` (`formulas.ts:16-17`).

5. **[Minore] `GaAs` in `BareIonCard` vs `v(q)` al variare del materiale**
   - **Dove:** `strings.ts:113` e `model.ts:440-451`.
   - **Cosa differisce:** La scheda «Ione nudo vs pseudopotenziale» rimane correttamente fissa su `Si (a = 5,431 Å, Z = 14)` (l'esempio svolto in P4 `r. 904-909`) indipendentemente dal preset scelto, ed è etichettata in modo trasparente (`strings.ts:113`). Per evitare che uno studente che ha selezionato `GaAs` pensi siano numeri del `GaAs`, è bene tenere ben evidente «(Si, a = 5,431 Å, Z = 14)», cosa già fatta. Analogamente, `formHint` (`strings.ts:55`) precisa opportunamente che la curva tratteggiata è «tipo Si».
   - **Riferimento nella dispensa:** P4 §4 (`r. 904-909, 1123`).
   - **Correzione proposta:** Nessuna necessaria (solo verificare visivamente che l'intestazione `(Si, a = 5,431 Å, Z = 14)` sia sempre ben leggibile).

**Verdetto `pseudopotential/`:** **approvata** (fatta salva la segnalazione alla regia sullo scarto `-0,21` vs `-0,211` Ry per `V_3^s` del Si e sull'eventuale inclusione del preset `Ge`).

---

## Parte 2 — Giudizio esplicito sui 7 punti dell'incarico

### 1. Simboli che cambiano significato tra sezioni (`P`, `\psi_c`, `E_0`, `E_g`, `t`, `W`, e `k`/`k'`)
- **`P` (Kronig–Penney vs Kane):** **Ben gestito.** In `kronig-penney/strings.ts:33,116` è chiaramente dichiarato sia nella descrizione dello slider sia nella `Scheda teoria`: «Opacità della barriera delta $P$ (non è il parametro $P$ di $k\cdot p$)» / «$P = m_0 a^2 V_0/\hbar^2$ è l'opacità della delta (non il parametro di Kane $k\cdot p$)». Specularmente in `k-dot-p/strings.ts:118,166`: «diverso dal $P$ di Kronig–Penney» / «parametro ottico di Kane (in eV·Å, legato a $|\langle S|\hat p_x|X\rangle|$), da non confondere con il parametro adimensionale $P$ del modello di Kronig–Penney».
- **`\psi_c` (onda stazionaria a coseno vs stati di core):** **Ben gestito.** In `nearly-free/formulas.ts:43` e `strings.ts:107` indica l'onda stazionaria `\propto \cos(\pi x/a)` con carica sugli ioni; in `pseudopotential/strings.ts:136` l'avviso esplicito è presente in grassetto: «Attenzione alla notazione: qui $\psi_c$ indica gli **stati di core** (con energia $E_c$), non l’onda stazionaria $\cos(\pi x/a)$ della sezione quasi liberi.» (Nota: in `k-dot-p/strings.ts:150` compare `|\langle\psi_c|\hat p|\psi_s\rangle|` nella scheda di verifica sui quasi liberi, coerente con il significato di onda stazionaria di P4 `r. 651`, e non collide con `V_{\mathrm{ps}}`.)
- **`E_0`:** **Chiaro nelle dispense e nell'app.** In `empty-lattice/` (`formulas.ts:30`, `strings.ts:120`) e `nearly-free/` (`formulas.ts:36`, `strings.ts:107`) è sempre l'energia libera al bordo `\hbar^2\pi^2/2m_0 a^2`. In `k-dot-p/` e `pseudopotential/` non è usato impropriamente al posto del gap diretto (il gap in `\Gamma` è sempre indicato con `E_g` o `E_g(\Gamma)` come vuole P4 `r. 1194` e `progetto.md:76`, evitando la notazione delle slide di Yu–Cardona).
- **`E_g`:** **Coerente.** Indica ovunque il gap di energia (in `nearly-free/` = `2|V_G|` al bordo o `2|V_{2G}|` al centro; in `tight-binding/` il gap in `\pm\pi/a`; in `k-dot-p/` il gap diretto in `\Gamma`; in `pseudopotential/` il gap assoluto). Nella `Formula viva` di `nearly-free/formulas.ts:37,44` compare `E_g` in due colori diversi (`q=VG` al bordo e `q=V2G` al centro), scelta semantica sensata ma che merita eventuale indice esplicito se tenuta nella stessa scheda.
- **`t` e `W`:** **Coerenti.** `t` è l'integrale di sovrapposizione (in `kronig-penney/formulas.ts:21` appare come parametro effettivo della banda a coseno `t = W/4` con ponte diretto a `tight-binding/`, dove `t_s > 0`, `t_p < 0` e `t` biatomico conservano esattamente il significato di P3 §12 e P4 §§1–2). `W` è sempre la larghezza di banda (`4|t|` o `W \simeq 4t^2/(E_B-E_A)` nella biatomica).
- **Altre collisioni rilevate:**
  1. **`k` e `k'` dentro `empty-lattice/`** (già segnalato come **Importante**): nella stessa sezione si scambiano ruolo tra `formulas.ts:21,29` e `formulas.ts:31` / `strings.ts:103` / `EmptyLatticeSection.tsx:334,340`.
  2. **`\lambda` tra `tight-binding/` e `k-dot-p/`:** in `tight-binding/strings.ts:38` è la lunghezza caratteristica del modello indicativo `t(a)` (`0,8 Å`); in `k-dot-p/strings.ts:172` è la costante spin–orbita di P4 `r. 689`. Rischio di confusione basso (sezioni distinte), ma facilmente eliminabile rinominando il parametro indicativo in `tight-binding` (es. `a_d` o `\ell`).
  3. **Riuso dei colori di `ui/theme.ts` (`\htmlData{q=...}`):** in `k-dot-p/strings.ts:159` e `formulas.ts`, `\Delta` usa `q=psi`, `P` ed `E_P` usano `q=v`, `m_0` usa `q=Ek`, `E_g` usa `q=VG`. All'interno della sezione la legenda/colore è coerente fra formula, slider e grafici; passando da una sezione all'altra il colore rappresenta ovviamente una grandezza diversa, come documentato nei commenti dei file (`tight-binding/formulas.ts:3-4`).

### 2. Ordine e nomi
- **Ordine e titoli delle sezioni (`src/renderer/src/sections/registry.ts:23-30`, `src/renderer/src/strings.ts:13-22`):**
  1. `Reticolo vuoto e schemi di zona` (`empty-lattice/`) ↔ P3 §9 (`Periodicità nello spazio reciproco e schemi di zona`), P4 §5.1 (`Tre modi di disegnare le bande`).
  2. `Kronig–Penney` (`kronig-penney/`) ↔ P3 §10 (`Il modello di Kronig–Penney`).
  3. `Elettroni quasi liberi` (`nearly-free/`) ↔ P3 §11 (`Il modello degli elettroni quasi liberi`).
  4. `Legami forti` (`tight-binding/`) ↔ P3 §12 (`Il modello a legami forti`), P4 §§1–2. *(La sottosezione «↳ vetrina 2D» di `progetto.md:38` è rimandata alla fase successiva per `progetto.md:131`.)*
  5. `Metodo k·p` (`k-dot-p/`) ↔ P4 §3 (`Il metodo k·p`).
  6. `Pseudopotenziale` (`pseudopotential/`) ↔ P4 §4 (`Il metodo dello pseudopotenziale`), P4 §5.4.
  L'ordine e i titoli coincidono esattamente con la tabella di `progetto.md:32-40` e con la sequenza italiana delle dispense. *(Nota collaterale fuori dalle 6 sezioni: `src/renderer/src/strings.ts:11` conserva ancora la nota di prima versione `'Prima versione: è attiva la sezione Elettroni quasi liberi.'`, ormai obsoleta.)*
- **Titoli dei pannelli e degli strumenti:** Coincidono con la terminologia italiana del corso e di `progetto.md:49-52`: `Spazio reale`, `Diagramma E(k)`, `Formula viva`, `Valori` (o `Valori vivi`), `Scheda teoria`; strumenti trasversali `Riempimento`, `Massa efficace` (con «lacune», «bordo di zona», «quasi-impulso» / «livello di Fermi» o «potenziale chimico $\mu$»), `Confronto: ...`. Varianti specifiche coerenti: `Zona estesa`, `Zona ridotta`, `Zona periodica` (P3 `r. 822-826`, P4 `r. 1327-1335`); `A delta` / `Barriere rettangolari`; `Monoatomica (s, p)` / `Biatomica A–B`; `Quattro bande (Kane)` / `Due bande, esatto`; `Ione nudo vs pseudopotenziale`, `Fattore di forma v(q)`, `Pesi in onde piane |c_G|² per guscio di |G|²`. Unica imperfezione terminologica minore: i riferimenti espliciti alle slide (`slide 41`) nei titoli/etichette visibili di `k-dot-p/strings.ts:17,68,106,126`.

### 3. Osservazioni sulle slide (l'app segue la dispensa e non i refusi delle slide?)
Verifica puntuale sulle correzioni annotate nelle dispense:
- **`empty-lattice/` (P3 §9.3):**
  - Refuso slide 22 («`\pm(\pi n/a)` Reciprocal Lattice Vector», P3 `r. 848-851`): **corretto** (`G = 2\pi n/a`, `formulas.ts:22`).
- **`kronig-penney/` (P3 §10):**
  - Refuso slide 9 (`\beta^2 = 2m_0(E-V_0)/\hbar^2` negativo per `E<V_0`, P3 `r. 964-966`): **corretto** (`\beta = \sqrt{2m_0(V_0-E)}/\hbar`, `formulas.ts:17`).
  - Convenzione slide 11–12 (fondo in `-V_0` vs `0`, P3 `r. 967-969`): **corretto** (`E` misurata dal fondo della buca).
  - Refuso slide 27 (`-1 > L > 1` al posto di `|L|>1`, P3 `r. 1149-1151`): **corretto** (`strings.ts:109`, `|L(E)| \le 1` bande e `|L(E)| > 1` gap).
  - Imprecisione slide 26 (`k` complessi non solo immaginari puri, `k = i\kappa` o `\pi/a + i\kappa`, P3 `r. 1145-1148`): correttamente descritto come «soluzioni evanescenti» (`strings.ts:109`).
- **`nearly-free/` (P3 §11):**
  - Notazione `E_k`, `m_0`, `E_+ = E_0 + |V_G|` sempre banda superiore, `V_G < 0` per ioni attrattivi (contro `\varepsilon_k`, `U`, `\varepsilon_+ = \lambda+U` inferiore, P3 `r. 1236-1250`): **tutto corretto** (`formulas.ts:25-44`, `manifest.ts:26`, `strings.ts:108`).
  - Refuso slide 17 (`\hbar^2[k^2-(\pi/a)^2]/2m_0` invece di `\tilde k^2`, P3 `r. 1549-1553`) e slide 22 (`n` pari, P3 `r. 1463-1465`): non riprodotti nell'app; la massa `m_h = -m^*` (P3 `r. 2119`) è corretta (`strings.ts:87`).
- **`tight-binding/` (P3 §12, P4 §§1–2):**
  - Notazione di Hofmann delle slide (`E_k`, `\gamma`, `E_n-\beta`, `N` orbitali, P3 `r. 1720-1726`): **tutto corretto** (`E(k)`, `t`, `\bar E_n`, `M` orbitali).
  - Scambio formule molecola `s` nella slide 27 (P3 `r. 1760-1764`): **corretto** (`s` legante in fase `k=0`, `t_s>0`).
  - Segno di `t_p` nelle slide 6 e 11 (`t_p < 0` vs `\gamma_p > 0`, P3 `r. 1908-1912`): **corretto** (`formulas.ts:33` `E_p = \bar E_p + 2|t_p|\cos(ka)`, `strings.ts:27` `t_p < 0`).
  - Catena biatomica — vicini di `A_n` nelle slide 20, 25–30 (`B_{n-1}, B_{n+1}` e `\cos ka` vs `B_{n-1}, B_n` a distanza `a/2` e `\cos(ka/2)`, P4 `r. 385-391`): **corretto** (`formulas.ts:47` `\cos^2(ka/2)`, `strings.ts:30` `distanza A–B = a/2`).
  - Catena biatomica — quadrati e segni nelle slide 30–31 (`\cos ka` senza quadrato, bande disegnate dentro `[E_A, E_B]`, `E_G` negativo, P4 `r. 447-452`): **corretto** (`W \simeq 4t^2/(E_B-E_A)` con `t^2`, bande fuori da `[E_A, E_B]` e `E_g = E_B - E_A > 0`).
- **`k-dot-p/` (P4 §3):**
  - Segno nella slide 41 per `E_{lh}` (mancanza del segno `-` davanti al secondo termine, P4 `r. 753-755`): **corretto** in `formulas.ts:14` (`E_{lh} = -\frac{\hbar^2 k^2}{2m_0} - \frac{2P^2 k^2}{3E_g}`), e il termine libero negativo delle formule del Kittel è commentato in `strings.ts:173` contro `+ \hbar^2 k^2/2m_0` del modello a due bande (con il **bloccante** però nel tooltip `strings.ts:44` sull'offset `E_g +` della parabola approssimata!).
  - Slide 44 (`L=0` al posto di `J=1/2` per `so`, P4 `r. 726-731`): **corretto** (`GammaLevelsCanvas.tsx:302` scrive `so (p, J = ½)`).
  - Baricentro `+\frac12\lambda\hbar^2` (`J=3/2`) e `-\lambda\hbar^2` (`J=1/2`) (P4 `r. 689-690, 2218`): **corretto** (`strings.ts:172`).
- **`pseudopotential/` (P4 §4):**
  - Slide 24 (`V_3, V_8, V_9` invece di `V_{11}`, `V_8, V_{11} \sim 0`, P4 `r. 1128-1131`): **corretto** (`V^s_3, V^s_8, V^{s}_{11}` con valori reali non nulli in `manifest.ts` e `formulas.ts`).
  - Notazione `E_0` delle slide per il gap diretto di Yu–Cardona (P4 `r. 1194`): **corretto**, usa `E_g(\Gamma)` / `E_g` (`strings.ts:107`, `model.ts:432`).

### 4. Ciò che non viene dalle dispense e avvisi «indicativi»
Elementi introdotti dall'app ma **non contenuti** nelle dispense, e stato dei relativi avvisi:
1. **`tight-binding/` — Legge esponenziale $t(a) = t(a_0)e^{-(a-a_0)/\lambda}$ (`manifest.ts:61-64`, `a_0 = 3,0 Å, \lambda = 0,8 Å`):** Dichiarata chiaramente **indicativa** (`strings.ts:37,38`: «legge esponenziale indicativa», «modello indicativo»; `strings.ts:61`: «bordi vs a (modello indicativo)»). Le cifre `3,0` e `0,8 Å` non appaiono a schermo (nota minore già segnalata).
2. **`tight-binding/` — Disegno della forma 1D degli orbitali `s` e `p` (`TightBindingRealSpace.tsx:6-7`):** Dichiarato chiaramente **indicativo** (`strings.ts:58,60`: `forma indicativa`).
3. **`nearly-free/` — Preset dei materiali (`Si, Ge, GaAs, Diamante` in un modello 1D):** Dichiarati chiaramente **indicativi** (`strings.ts:35,125`: «Indicativi: in 1D contano solo il passo e il gap reali»).
4. **`nearly-free/` — Nota sul gap al secondo ordine in $k = 0$ (`\simeq V_G^2/2E_0` in `strings.ts:125`):** **Non proviene dalle dispense** e **non è segnalata** come estensione extra-dispensa (classificata `Minore` nella Sezione 3).
5. **`kronig-penney/` — Parametro `P_{\mathrm{eff}}` (`KronigPenneySection.tsx:380`):** Simbolo coniato dall'app per esprimere `m_0 a V_0 c / \hbar^2` nel caso rettangolare; non presente in P3 §10 (classificato `Importante` nella Sezione 2).
6. **`k-dot-p/` — Soglia di validità parabolica `|P\cdot k| < E_g/2` (`strings.ts:82,87,132,140`):** La dispensa chiede qualitativamente `Pk \ll E_g` (P4 `r. 769`); la soglia quantitativa `< E_g/2` è dichiarata espressamente **(criterio indicativo)** / **(indicativo)** ovunque a schermo.
7. **`pseudopotential/` — Curve di modello dello spazio reale e `v(q)` (`model.ts:437-438`: `r_c = 0,72` nello spazio reale; `R_c = 0,57 Å` per Ashcroft+Thomas–Fermi):** Dichiarate chiaramente **indicative** (`strings.ts:44`: «curve di modello indicative (P4 §4, fig. 4.1a)»; `strings.ts:55,58`: «curva tratteggiata indicativa (Ashcroft + Thomas–Fermi, tipo Si)», «Ashcroft + TF (indicativo)»). Non dichiarati a schermo i valori interni `0,72` e `0,57 Å`.
8. **`pseudopotential/` — Indicatività dei gap locali:** Dichiarata fedelmente come nella dispensa (`strings.ts:96-97`, P4 `r. 1487`: «i gap sono indicativi»).

### 5. Origine di tutti i preset e numeri d'esempio
- **`empty-lattice/`:**
  - `a = 3 Å`, `E_0 = 4,18 eV`, incroci `0; 16,7; 66,9 eV` e `4,18; 37,6 eV`, stato iniziale `k = 1,5 \pi/a \to k' = -0,5 \pi/a, n = +1` (`manifest.ts:24,29,63`): risalgono direttamente a P3 §9.3 (`esempio r. 877-880` e `fig. 9.1b r. 868-869`).
  - Confronto con `V_G = -0,5 eV` (`manifest.ts:52`): risale a P3 §11 (`esempio E9, r. 2454`) e P4 §3 (`r. 659`).
- **`kronig-penney/`:**
  - Variante delta: `a = 3 Å, P = 2` (`manifest.ts:41`): da P3 §10.2 `fig. 10.2` (`r. 1085-1086`). Citato nei commenti anche `P = 3\pi/2` da `esempio §10.2` (`r. 1102`) ed `E8` (`r. 2453`).
  - Variante rettangolare: `b = 4,5 Å, c = 1 Å, V_0 = 10 eV` (`manifest.ts:42`): parametri scelti per rientrare nel campo della dispensa (danno `\sqrt{2m_0 V_0/\hbar^2}\,b = 7,29`, buca con 3 livelli, vicino ma distinto da `\sqrt{2m_0 V_0/\hbar^2}\,b = 10,4, c/b = 0,2` di P3 `fig. 10.3 r. 1150, 1156` e dall'esempio buca isolata `b = 10 Å, V_0 = 1 eV` di `r. 979`).
- **`nearly-free/`:**
  - Parametri iniziali `a = 3 Å, V_G = -0,5 eV, V_{2G} = 0` (`manifest.ts:32`): da P3 `E9` (`r. 2454, 2494`), P4 §3 (`r. 659`), `verifica_qf.py:56` e `verifica_kp.py:12`.
  - Preset `Silicio: a = 5,43 Å, gap = 1,12 eV` (`manifest.ts:45`): `5,43` da P3 `verifica_bande.py:45` e P4 `verifica_bande_reali.py:140`; `1,12 eV` da P4 §5.4 (`r. 1474, 1487`).
  - Preset `GaAs: a = 5,65 Å, gap = 1,42 eV` (`manifest.ts:47`): `5,65` da P4 `verifica_bande_reali.py:141`; `1,42 eV` da P4 §5.4 (`r. 1474, 1487`) — mentre in `k-dot-p` / P3 §13.3 (`r. 2165`) è `1,43 eV` a `300 K`.
  - Preset `Germanio: a = 5,66 Å, gap = 0,67 eV` (`manifest.ts:46`): `a = 5,658 Å` sta in `verifica_pseudo.py:54` (non in `dispensa.tex`); `gap = 0,67 eV` non compare nelle dispense (che in P4 `r. 809` riportano `0,66 eV` a `300 K`).
  - Preset `Diamante: a = 3,57 Å, gap = 5,47 eV` (`manifest.ts:48`): entrambi assenti da `materiale/` (P3 `r. 221`, `verifica_bande.py:51` e P4 `r. 2527` usano `5,5 eV`; `3,57 Å` viene da `progetto.md` / valore noto). Dichiarati «Indicativi».
- **`tight-binding/`:**
  - Monoatomica iniziale `a = 3,0 Å, \bar E_s = -8,0 eV, \bar E_p = -2,0 eV, t_s = 1,0 eV, |t_p| = 1,2 eV` (`manifest.ts:45-51`): risale **esattamente** a P3 esercizio `E13` (`r. 2458`) e a `materiale/parte3/verifica_tb_semicl.py:106` (con `a = 3,0 Å` di `E6/E12/E14` e `verifica_tb_semicl.py:110`).
  - Biatomica iniziale `a = 3,5 Å, E_A = -1,5 eV, E_B = 1,5 eV, t = 0,9 eV` (`manifest.ts:53-58`): verifica esattamente il rapporto `t = 0,3(E_B - E_A)` usato in P4 §2 `fig. 2.2` (`r. 443`: `0,3 \times 3,0 = 0,9`). (`a = 3,5 Å` è un valore rappresentativo scelto per comodità grafica; P4 E1 usa `E_A=0, E_B=2, t=0,5, a=4`).
  - Confronto quasi liberi `V_G = -0,5 eV` (`manifest.ts:78`): come sopra.
- **`k-dot-p/`:**
  - `GaAs`: `eg = 1,43, delta = 0,34, ep = 20,0, measured = { mc: 0,067, mhh: 0,5, mlh: 0,082, mso: 0,17 }` (`manifest.ts:75-81`): ogni cifra risale esattamente a P4 §3 esempio (`r. 784-785`), tabella (`r. 796`), P3 §13.3 (`r. 2165`) e `verifica_kp.py:49,53`.
  - `InSb`: `eg = 0,18, delta = 0,82, ep = 20,0, measured = { mc: 0,0145, mhh: 0,39, mlh: 0,021, mso: 0,11 }` (`manifest.ts:83-89`): risale esattamente a P4 §3 esempio (`r. 784-785`), tabella (`r. 797`), P3 §13.3 (`r. 2161`) e `verifica_kp.py:50,53`.
  - `Ge`: `eg = 1,1, delta = 0,29, ep = 20,0, measured = { mc: null, mhh: 0,34, mlh: 0,043, mso: null }`, nota `0,66 eV` (`manifest.ts:91-99`): risale esattamente a P4 §3 tabella (`r. 795`) e bande calcolate (`r. 808-809`).
  - Verifica sui quasi liberi `a = 3,0 Å, V_G = -0,50 eV, 41 onde` (`manifest.ts:111-115`): risale esattamente a P4 §3 (`r. 659-660`) e `materiale/parte4/verifica_kp.py:12`.
- **`pseudopotential/`:**
  - `Si`: `a = 5,43 Å, v3s = -0,21, v8s = 0,04, v11s = 0,08`, `measuredGapEv = 1,12` (`manifest.ts:62-71`): risale esattamente a `materiale/parte4/verifica_bande_reali.py:140` e P4 §5.4 (`r. 1474`). Si segnala lo scarto `0,001 Ry` rispetto alla tabella di P4 §4 (`r. 1109`: `-0,211`).
  - `GaAs`: `a = 5,65 Å, v3s = -0,252, v8s = 0,0, v11s = 0,08, v3a = 0,068, v4a = 0,066, v11a = 0,012`, `measuredGapEv = 1,42`, `measuredGammaMass = 0,067`, `kpEpEv = 20,0` (`manifest.ts:73-81`): risale esattamente a `verifica_bande_reali.py:141`, P4 §5.4 (`r. 1474, 1484-1485`) e P4 §4 (`r. 1201, 1206`).
  - Ione nudo Si: `siBareIonA = 5,431 Å, siBareIonZ = 14` (`manifest.ts:114-115`): risale esattamente a P4 §4 (`r. 905`) e `verifica_pseudo.py:19`.
  - Costanti fisiche (`physics/constants.ts`): `\hbar^2/2m_0 = 3,80998 eV·Å²`, `Ry = 13,6057 eV` coincidono con `CLAUDE.md`, `progetto.md:74`, `verifica_kp.py:3,7`, `verifica_bande_reali.py:10` (le dispense a stampa arrotondano a `3,81` e `13,6`).

### 6. Copertura di riquadri «chiave» e formulari
Giudizio per sezione su cosa manca rispetto ai riquadri `\begin{chiave}` e alle righe `\section{Riepilogo finale}`:

- **`empty-lattice/` (P3 §9, P4 §5.1):**
  - *Presente:* periodicità $E(k+G)=E(k)$, prima zona $(-\pi/a, \pi/a]$, parabola ripiegata $\hbar^2(k'+G)^2/2m_0$, $k = k'+G$, tre schemi di zona.
  - *Mancante:* scrittura esplicita di `\psi_{n,\vk+\mathbf G}=\psi_{n\vk}` (P3 `r. 2274`) e la tabella dei bordi in zona ridotta (gap pari in $k=0$, dispari in $\pm\pi/a$, P3 `r. 839-844` — in parte mostrata numericamente in `Valori`). *Mancanza non grave*, facile da integrare.
- **`kronig-penney/` (P3 §10):**
  - *Presente:* `chiave` KP a delta (`P3 r. 1059-1066`, `2281-2282`), caso rettangolare `L(E) = \cos ka` (`2283-2284`), banda a coseno `E \approx \bar E \mp 2t\cos ka`, `W=4t`, `m^* = \hbar^2/2ta^2` (`2285-2286`).
  - *Mancante:* equazioni della buca finita isolata (`r. 2277-2279`), formula esplicita del salto della derivata sulla delta (`r. 2280`), `W \propto e^{-\beta c}` nelle formule e `v = \frac{2ta}{\hbar}\sin ka` (`r. 2286`). *Mancanze non gravi* (la buca finita è comunque visibile nei livelli genitori; utile all'esame ricordare il salto della derivata e $N=\lfloor 2\rho/\pi\rfloor+1$).
- **`nearly-free/` (P3 §11):**
  - *Presente:* modello a due onde (`r. 2297`), gap `2|V_G|` al bordo (`chiave r. 1405-1412`, `r. 2293-2294`), onde stazionarie `\psi_c, \psi_s` (`r. 2296`), massa efficace `m_0/m^*_\pm = 1 \pm 2E_0/|V_G|` (in scheda teoria `strings.ts:115`, `chiave r. 1525-1531`, `r. 2300`), secondo gap `2|V_{2G}|`.
  - *Mancante (GRAVE per esame):* **equazione centrale `(E_{k+G}-E)c_G + \sum_{G'}V_{G-G'}c_{G'}=0`** (`r. 2290`) e **pesi delle onde piane `c_{nG} \simeq \frac{V_{nG}}{E_k-E_{k+nG}} c_0`** (`r. 2292`). Mancano anche sviluppo vicino al bordo `E_\pm(\tilde k)` (`r. 2299`), lontano dal bordo `E \simeq E_k + V_G^2/(E_k-E_{k'})` (`r. 2298`), `\langle V\rangle_{c,s} = \pm V_G` in forma di equazione (è in prosa `strings.ts:107`), media `\bar V` / caso delta (`r. 2295`), impulso `p\psi_c = \frac{\hbar\pi}{a}\psi_s` (`r. 2301`) e definizione dei `V_G` (`r. 2288-2289`). Per chi prepara l'esame, l'assenza dell'**equazione centrale** nella sezione dedicata ai quasi liberi è la lacuna più rilevante del capitolo.
- **`tight-binding/` (P3 §12, P4 §§1–2):**
  - *Presente:* `chiave` banda a legami forti (`P3 r. 1873-1878`, `2306-2307` in 1D), bande `s` e `p`, gap `(\bar E_p-\bar E_s) - 2(t_s+|t_p|)` (`2308-2309`), `chiave` bande della catena biatomica (`P4 r. 412-418`, `2207-2208`), `W \simeq 4t^2/(E_B-E_A)` (`2210`), `m^*_c = -m^*_v = \hbar^2(E_B-E_A)/(2t^2 a^2)` (`2211`).
  - *Mancante:* equazioni accoppiate `(1a)-(2a)` (`r. 2205-2206`), formula esatta di `t(\mathbf R)` (`r. 2307`) ed `H = H_{\mathrm{at}} + \Delta V` (`r. 2305`), sistema `(I)` per `M` orbitali (`P4 chiave r. 187-193`, `r. 2198, 2310`), cubico semplice 3D (`r. 2202-2203, 2311`) e grafene (`P4 §§6, r. 2251-2258`). L'assenza del **3D/grafene** è giustificata dal rinvio alla «vetrina 2D» (`progetto.md:131`); l'assenza della **definizione integrale di `t(R)`** e del **sistema `(I)`** è invece una mancanza moderata per chi studia la dimostrazione d'esame di P4 §1.2–1.3 (`Domande di verifica` P4 `r. 2305-2307`).
- **`k-dot-p/` (P4 §3):**
  - *Presente:* `chiave` massa efficace dal metodo `k\cdot p` (`P4 r. 631-638`, `2215`), due bande `m_0/m^*_c \simeq 1 + E_P/E_g` (`2216`), tutte le formule di Kane di conduzione, `hh`, `lh`, `so` e relative masse (`r. 2219-2223`), spin–orbita `H_{\mathrm{so}} = \lambda\mathbf L\cdot\mathbf S` e livelli `+\frac12\lambda\hbar^2`, `-\lambda\hbar^2`, `\Delta = \frac32\lambda\hbar^2` (`2218`, in `strings.ts:172`).
  - *Mancante:* equazione completa di Schrödinger per `u_{n\mathbf k}` (`r. 2213`) e scomposizione esplicita `H_0 + H'_{\mathbf k}` in `formulas.ts` (`r. 2214`), sviluppi espliciti `E_{lh}` e `|X\rangle,|Y\rangle` in `TWO_BAND_MATRIX_FORMULA`, e formula esplicita `\lambda\mathbf L\cdot\mathbf S = \frac\lambda2(J^2-L^2-S^2)` (`r. 2217`). *Mancanze non gravi* (la derivazione di $u_{n\vk}$ era già in P3 §8.3; comunque l'equazione di partenza di `k·p` meriterebbe una riga nella scheda teoria).
- **`pseudopotential/` (P4 §4, §5.4):**
  - *Presente:* `chiave` equazione di pseudo-Schrödinger e `V_{\mathrm{ps}} = V + V'` (`P4 r. 1046-1053`, `2227-2229`), equazione centrale e fattori di struttura `V^s`, `V^a` (`r. 2232`), `v(0) = -\frac23 E_F` (`r. 2234`), stima massa in `\Gamma` `m^*_c/m_0 \simeq E_g(\Gamma)/E_P` (`r. 2235`), confronto numerico ione nudo vs Si (`r. 904-909`), criterio di riempimento 8 elettroni/cella = 4 bande piene + `\mu` nel gap (`chiave r. 1601-1611`, `2248`).
  - *Mancante:* espressione esplicita delle OPW `\chi_{\mathbf k}` e `\beta_c(\mathbf k)` (`r. 2225`), proprietà `V_{\mathrm{ps}}` positivo repulsivo `\langle\phi|V'|\phi\rangle \ge 0` (detta in prosa `strings.ts:131`), formula analitica della stima dello ione nudo (`r. 2230`), formula integrale dei `V_{\mathbf G}` (`r. 2231`) e catena `v_{\mathrm{ion}}(q) / \varepsilon(q)` con `k_{\mathrm{TF}}^2` e `g(E_F)` (`r. 2233-2234`). *Mancanza moderata per l'esame:* la definizione esplicita della OPW (`\chi_{\mathbf k}`) e la catena di Thomas–Fermi per `v(0) = -\frac23 E_F` sono spesso oggetto di domanda orale (`P4 r. 2332`).

### 7. Collegamenti tra sezioni espliciti nelle dispense
Tutti e quattro i collegamenti indicati nell'incarico sono presenti e formulati in modo fedele alle dispense:
1. **Kronig–Penney → legami forti (P3 §10.4 `r. 1194-1197`, §12.3 `r. 1894-1895`, `progetto.md:44`):**
   - *Presente e fedele:* in `kronig-penney/strings.ts:18,116` («Sovrappone Ē ∓ 2t·cos ka sulla banda scelta (ponte verso Legami forti)» / «Linearizzando $L(E)$ in una banda si ottiene $E(k) \approx \bar E \mp 2t\cos ka$ con $W = 4t$, che coincide con i Legami forti») e specularmente in `tight-binding/strings.ts:125` («per buche profonde il modello di Kronig–Penney riproduce proprio la banda a coseno $E(k) \simeq \bar E \mp 2t\cos ka$»).
2. **Quasi liberi → pseudopotenziale (P3 §12.1 `r. 1732`, P4 §4 `r. 831-832, 1184-1185`, `progetto.md:43`):**
   - *Presente e fedele:* in `pseudopotential/strings.ts:136` («Si torna alla stessa equazione centrale dei quasi liberi (con $V_{\mathrm{ps}}$ al posto di $V$), ma diagonalizzata su 113 onde piane ($|G|^2 \le 21$) anziché trattata in perturbazione»), con l'equazione centrale riportata in `pseudopotential/formulas.ts:12` e lo strumento `Confronto: reticolo vuoto fcc` (`strings.ts:38-39,111`). Resta però monco il lato di partenza se in `nearly-free/` non si mostra la stessa equazione centrale.
3. **`k·p` → massa al bordo dei quasi liberi (P4 §3 `r. 646-660`, `progetto.md:45`):**
   - *Presente e fedelissimo:* implementato sia nel calcolo (`physics/kDotP.ts` + `manifest.ts:111-115`: `a = 3,0 Å`, `V_G = -0,5 eV`, `41 onde`) sia nell'apposita scheda `Verifica sui quasi liberi (P4 §3)` (`KDotPSection.tsx:437-468`, `strings.ts:143-151`), che confronta esattamente curvatura numerica, somma `k\cdot p` su `41` bande (`17,731`), formula a due bande `1 + 4E_0/E_g` (`17,72`) ed elemento di matrice `|\langle\psi_c|\hat p|\psi_s\rangle|/\hbar` vs `\pi/a`.
4. **Legami forti ↔ `\psi_c` e `\psi_s` dei quasi liberi (P3 §12.3 `r. 1947-1951`):**
   - *Presente e fedele:* in `tight-binding/strings.ts:125` («al bordo di zona la combinazione simmetrica $\psi_c$ corrisponde allo stato $s$ mentre l’antisimmetrica $\psi_s$ corrisponde allo stato $p$»). *(Nota: anche in `pseudopotential/` è presente un ottimo collegamento inverso verso `k·p` per `m^*_c/m_0 \simeq E_g(\Gamma)/E_P` del GaAs in `strings.ts:107` e `model.ts:432`, fedele a P4 `r. 1206`.)*

---

## Parte 3 — Verdetto complessivo e domande per la regia

**Verdetto complessivo:** **da correggere**.

Priorità di intervento consigliata prima dell'approvazione finale:
1. **(Bloccante)** Correggere `src/renderer/src/sections/k-dot-p/strings.ts:44` rimuovendo `E_g +` dal termine comune `±` nel tooltip di `Due bande, esatto` (`E_c ≃ E_g + ħ²k²/2m₀ + P²k²/E_g` ed `E_lh ≃ ħ²k²/2m₀ − P²k²/E_g`).
2. **(Importante)** Unificare la notazione `k` / `k'` all'interno di `src/renderer/src/sections/empty-lattice/formulas.ts:21,29,31` allineandola a `Valori` e `Scheda teoria` (`k` esteso, `k'` ridotto).
3. **(Importante)** Uniformare in `src/renderer/src/sections/k-dot-p/KDotPSection.tsx:380-385` la convenzione del segno di `m_{lh}` nella variante `Due bande, esatto` rispetto a `Quattro bande (Kane)` (mostrando la massa positiva della lacuna o esplicitando `m_{lh} = -m^*_{lh} > 0`), e ripulire i riferimenti interni a `(slide 41)` nelle stringhe visibili di `k-dot-p/strings.ts:17,68,106,126`.
4. **(Importante)** Integrare l'equazione centrale `(E_{k+G}-E)c_G + \sum_{G'} V_{G-G'}c_{G'}=0` e la stima dei pesi `c_{nG}` in `nearly-free/`.
5. **(Importante/coerenza)** Chiarire `L_\delta(E)` / `f(\alpha a)` e `P_{\mathrm{eff}}` in `kronig-penney/`.

### Domande per la regia
1. **`pseudopotential/` — Preset `Ge` e valore `V_3^s` del `Si`:** `progetto.md:40,47` elenca il `Ge` tra i preset, ma `dispensa.tex` (P4 §4) non ne riporta il passo reticolare `a` (presente invece in `verifica_pseudo.py:54`: `a = 5,658 Å`), e `verifica_bande_reali.py:140` usa `V_3^s = -0,21 Ry` per il Si contro `-0,211 Ry` della tabella in P4 `r. 1109`. La regia preferisce lasciare escluso il `Ge` (come fa `strings.ts:15` attenendosi al solo testo della dispensa e a `verifica_bande_reali.py`) o aggiungerlo usando `5,658 Å`? E per il Si preferisce mantenere `-0,21 Ry` (coerente con `epm_bande.npz`) o adottare `-0,211 Ry` nella scheda ione nudo?
2. **`tight-binding/` — Cubico semplice 3D:** Oltre al grafene (esplicitamente rinviato alla vetrina 2D, `progetto.md:131`), la regia conferma che anche il cubico semplice 3D (`P4 §1.4`) resta fuori da `tight-binding/` fino alla realizzazione della vetrina 2D/3D?
3. **`src/renderer/src/strings.ts:11`:** Aggiornare la nota obsoleta della barra laterale («Prima versione: è attiva la sezione Elettroni quasi liberi») nell'incarico 08 della schermata iniziale?
