# Revisione fedeltà al corso — Sezione 1: Catena monatomica e prima zona di Brillouin

- **Revisore**: `fedelta-corso`
- **Sezione revisionata**: `src/renderer/src/sections/phonon-monatomic/` (`manifest.ts`, `formulas.ts`, `strings.ts`, `MonatomicChainView.tsx`, `PhononMonatomicSection.tsx`, più verifica di supporto su `model.ts` e `store.ts`) e `src/renderer/src/physics/phononDispersion.ts`
- **Fonti uniche di riferimento**: `materiale/parte6/dispensa.pdf` (Lezione 1 §§1–5, pp. 2–13; Lezione 2 §6.1–6.2 per $v_p, v_g$, pp. 14–16; Lezione 3 §13 e §19, pp. 31–34 e 47–48) e `materiale/parte6/riferimento-formule.md`
- **Verdetto**: **da correggere**

---

## 1. Sintesi della verifica

La sezione è nel complesso molto fedele alla dispensa Parte 6: la notazione principale ($C$, $M$, $a$, $k$, $G$, $\omega$, $\nu$, $v_s$, $v_p$, $v_g$, $u_n$, $x_n^0$), le equazioni chiave (eqq. 6, 8, 9, 31–33), il verso di propagazione, la convenzione della prima zona di Brillouin ($-\pi/a < k \le \pi/a$ con esattamente $N$ modi in Born–von Kármán per $N$ pari e dispari), i numeri dell'esempio del metallo tipico (§3, p. 9) e l'uso dell'italiano con virgola decimale sono corretti e coerenti con il corso.

Restano tuttavia **1 problema bloccante** (la lettura numerica di $v_p$ e $v_g$ a $k = 0$ riporta `0,00 km/s` in contrasto con la dispensa), **3 problemi importanti** (simboli resi con underscore/graffe LaTeX grezze nell'interfaccia, disallineamento notazionale tra asse $\nu$ ed etichette $\omega$ sul grafico, e tre punti mancanti dei riquadri arancioni «Errori tipici» di §5 e §19) e **2 problemi minori** (segno di $v_p$ nella nota a $k = -\pi/a$ e rifiniture su preset/riferimenti).

---

## 2. Controllo sistematico rispetto alla dispensa

### 2.1 Simboli, formule e convenzioni

| Grandezza / Formula | Dispensa Parte 6 | Sezione (file e righe) | Esito |
|---|---|---|---|
| Costante elastica $C$ (non $\gamma$/$K$) | §2.1 p. 5; nota 5 p. 16 | `manifest.ts:27`, `formulas.ts:15`, `strings.ts:23,72,110` | Conforme |
| Massa atomica $M$ e passo $a$ | §1.1 p. 3; §2.1 p. 5 | `manifest.ts:25-26`, `formulas.ts:16-17` | Conforme |
| Equazione del moto $M\ddot{u}_n = C(u_{n+1}+u_{n-1}-2u_n)$ | §2.2 eq. (6) p. 6; Form. p. 12 | `formulas.ts:32`, `strings.ts:111` | Conforme |
| Onda piana $u_n(t) = Ae^{i(kna-\omega t)}$ e $x_n^0 = na$ | §2.1 p. 5; §3.1 eq. (7) p. 7 | `strings.ts:110-111,124` | Conforme |
| Dispersione $\omega(k) = 2\sqrt{C/M}\,|\sin(ka/2)|$ | §3.1 eq. (8) p. 7 | `formulas.ts:28`, `strings.ts:117`, `phononDispersion.ts:147-150` | Conforme |
| Limiti $v_s = a\sqrt{C/M}$, $\omega_{\max} = 2\sqrt{C/M}$ | §3.2 eq. (9) p. 8; §3.3 p. 8 | `formulas.ts:33`, `strings.ts:117-118`, `phononDispersion.ts:114-125` | Conforme |
| $v_g(k) = v_s\cos(ka/2)\operatorname{sgn}(k)$, $v_p = \omega/k$ | §3.2–3.3 p. 8; §6.1 p. 14; §16 p. 40 | `formulas.ts:38`, `phononDispersion.ts:160-182` | **Errore a $k=0$ in UI** (v. B1) |
| Banda evanescente $\omega > \omega_{\max}$, $k = \pi/a + i\kappa$ | §3.4 p. 8 | `strings.ts:58,118`, `phononDispersion.ts:267-273` | Conforme |
| Equivalenza $k' = k + G$, $G = 2\pi m/a$, 1BZ $-\pi/a < k \le \pi/a$ | §4.1–4.2 pp. 9–10; Form. p. 12 | `formulas.ts:39`, `strings.ts:124-125`, `phononDispersion.ts:233-258` | Conforme |
| Born–von Kármán $u_{n+N}=u_n$, $k = \frac{2\pi}{Na}j$, $\Delta k = \frac{2\pi}{Na}$, $-N/2 < j \le N/2$, $N$ modi | §4.3 p. 11; §13.2–13.3 eqq. (31)–(32) pp. 32–33 | `formulas.ts:43`, `strings.ts:131-132`, `phononDispersion.ts:310-325` | Conforme |
| Passaggio al continuo $\sum_k \to \frac{L}{2\pi}\int dk$ | §13.4 eq. (33) p. 33 | `strings.ts:132` | Conforme |
| Asse grafico $\nu(k)$ vs etichette $\omega$ | Fig. 3 p. 7; Fig. 8 p. 15; Fig. 15 p. 33 | `strings.ts:52,56,58-59,64-70` | **Disallineamento** (v. I2) |
| Resa tipografica dei simboli in UI | Convenzioni dispensa | `strings.ts:15-17,96`, `PhononMonatomicSection.tsx:174,482` | **Underscore/graffe grezzi** (v. I1) |

### 2.2 Copertura idee chiave («Cosa devi saper fare») ed «Errori tipici» (§5 p. 12 e §19 p. 47)

- **Lezione 1, §5 — «Cosa devi saper fare» (p. 12)**: tutti e 6 i punti sono coperti (sviluppo al 2° ordine con annullamento del termine lineare, somma nulla $\sum_m\Phi(n,m)=0$, equazione del moto e dispersione, $v_s$/$\omega_{\max}$/$v_g$ e onda stazionaria/Bragg al bordo, equivalenza $k \sim k+G$ e cella di Wigner–Seitz, conteggio di $N$ modi con BvK).
- **Lezione 1, §5 — «Errori tipici» (p. 12)**:
  - Valore assoluto e parità $\omega(-k)=\omega(k)$: **coperto** (`formulas.ts:28`, `strings.ts:117`).
  - Atomi non fermi a $k=\pi/a$ ($v_g=0$, $v_p\ne 0$): **coperto** (`strings.ts:99,118`, animazione).
  - Non scambiare $v_p$ e $v_g$: **coperto** (sonda corda/tangente, `strings.ts:98-99,117-118`), ma compromesso in $k=0$ da B1.
  - $k$ fuori zona = stesso moto: **coperto** (strumento Aliasing, `strings.ts:124`).
  - **Anarmonicità trascurata, non assente** (approssimazione armonica valida solo per piccoli spostamenti): **non coperto** (v. I3).
  - **Modello 1D solo longitudinale** (un solo ramo; trasversali e polarizzazioni in 3D): **non coperto esplicitamente** (v. I3).
- **Lezione 3, §19 — «Cosa devi saper fare» e «Errori tipici» pertinenti a §13 (p. 47)**:
  - Origine di $k=2\pi j/L$, conteggio di $N$ punti (non $N+1$ né $2N$, perché $-\pi/a \equiv +\pi/a$), passaggio $\sum_k \to \frac{L}{2\pi}\int dk$: **coperti** (`strings.ts:131-132`, `bvkAllowedK1D`).
  - **Condizioni periodiche come artificio non fisico** (proprietà di volume e conteggio invariati rispetto agli estremi bloccati): **non coperto** (v. I3).

### 2.3 Numeri e preset

- **`Metallo tipico (§3)`** (`manifest.ts:33-37,53`, `fromDispensa: true`): $a = 2{,}50\,\text{Å}$, $M = 63{,}2\,\text{u}$ ($= 1{,}0495 \times 10^{-25}\,\text{kg}$ contro $1{,}05 \times 10^{-25}\,\text{kg} \approx 63\,\text{u}$ della dispensa §3, p. 9), $C = 20\,\text{N/m}$. Riproduce tutti i valori di riferimento della dispensa (§3, p. 9): $\sqrt{C/M} = 1{,}38\cdot 10^{13}\,\text{s}^{-1}$, $v_s = 3{,}45\,\text{km/s} \approx 3{,}5\cdot 10^3\,\text{m/s}$, $\omega_{\max} = 2{,}76\cdot 10^{13}\,\text{rad/s} \approx 2{,}8\cdot 10^{13}\,\text{rad/s}$, $\nu_{\max} = 4{,}39\,\text{THz} \approx 4{,}4\,\text{THz}$, $\hbar\omega_{\max} = 18{,}2\,\text{meV} \approx 18\,\text{meV}$.
- **`Piombo 1D (pesante, molle)` e `Carbonio 1D (leggero, rigido)`** (`manifest.ts:54-55`, `fromDispensa: false`): profili 1D illustrativi esterni alla dispensa (in linea con gli esempi qualitativi di Pb «molle e pesante» e C «leggero e rigido» citati in Tab. 3, p. 58). Sono segnalati come «profili illustrativi» sia sotto il menu (`strings.ts:35`) sia a piè di scheda (`strings.ts:136`); si propone un piccolo rafforzamento esplicito (v. M2).

---

## 3. Problemi riscontrati

### Bloccanti

#### B1. A $k = 0$ la sonda velocità stampa `v_p = 0,00 km/s · v_g = 0,00 km/s`
- **Dove**: `src/renderer/src/sections/phonon-monatomic/PhononMonatomicSection.tsx:487-498` (e valori restituiti da `src/renderer/src/physics/phononDispersion.ts:164,178`).
- **Cosa differisce**: selezionando `k = 0` (per esempio dal pulsante rapido `k = 0` sopra la catena) con lo strumento «Sonda $v_p, v_g$» attivo, il pannello dei valori visualizza:
  `v_p = 0,00 km/s · v_g = 0,00 km/s`
  seguito dalla nota *«In $k = 0$ il profilo trasla rigidamente; per $k \to 0^+$ vale $v_p = v_g = v_s$.»*
  In realtà in $k = 0$ la curva $\omega(k) = 2\sqrt{C/M}|\sin(ka/2)|$ presenta un punto angoloso: né $v_p = \omega/k$ (forma $0/0$) né $v_g = d\omega/dk$ valgono $0$; i limiti destro e sinistro sono $\pm v_s \neq 0$. Stampare `0,00 km/s` entra in diretto contrasto con la fisica del regime acustico (e con la nota stessa sottostante) e induce lo studente a confondere $k = 0$ con il bordo zona $k = \pm\pi/a$, dove invece $v_g = 0$.
- **Riferimento dispensa**: Lezione 1, §3.2 eq. (9) p. 8 ($v_p = \omega/k = v_s$, $v_g = d\omega/dk = v_s$ per $k \to 0$) e Lezione 2, §6.2 p. 16.
- **Correzione proposta**: nel blocco `Values` di `PhononMonatomicSection.tsx:490-498`, quando `sel.atOrigin` è vero, non mostrare `0,00 km/s` (come già fatto correttamente per $\lambda$ alle righe 463–464): mostrare ad esempio `— (limite k → 0±: ±v_s)` oppure il limite `|v_p| = |v_g| → v_s` con il valore numerico di $v_s$ e la spiegazione sul punto angoloso/traslazione rigida. (Se necessario, valutare anche se `monatomicGroupVelocity`/`monatomicPhaseVelocity` in `phononDispersion.ts` debbano restare a `0` per uso interno grafico o documentare che il valore in `k = 0` è convenzionale e non va esposto come `0,00 km/s`.)

---

### Importanti

#### I1. Simboli matematici resi con sintassi grezza (`_` e `{}`) in controlli e note visibili
- **Dove**:
  - `src/renderer/src/sections/phonon-monatomic/strings.ts:16` + `PhononMonatomicSection.tsx:174`: `probe: 'Sonda v_p, v_g'` è passato come testo semplice dentro `<ToolToggle>`, quindi il pulsante a schermo mostra letteralmente `Sonda v_p, v_g` con gli underscore.
  - `src/renderer/src/sections/phonon-monatomic/strings.ts:96` + `PhononMonatomicSection.tsx:482`: `aliasingSame: 'stessa ω e stessi u_n sugli atomi'` è reso come `{v.aliasingSame}` senza `<RichText>`, quindi a schermo appare letteralmente `u_n` (a differenza delle righe 496 e 501 che usano `<RichText>`).
  - `src/renderer/src/sections/phonon-monatomic/strings.ts:15,17`: i tooltip HTML `bvkTitle` (`u_{n+N} = u_n`) e `probeTitle` (`v_p`, `v_g`) espongono parentesi graffe e underscore LaTeX nel testo del tooltip nativo del browser.
- **Riferimento dispensa**: notazione uniforme con pedici ($v_p$, $v_g$, $u_n$, $u_{n+N} = u_n$) in Lezione 1 §§2–3 (pp. 5–8) e Lezione 3 §13.2 eq. (31) (p. 32).
- **Correzione proposta**:
  - Usare `<RichText text={s.tools.probe} />` con `'Sonda $v_p, v_g$'` nel `<ToolToggle>` di `PhononMonatomicSection.tsx:174`.
  - Usare `<RichText text={v.aliasingSame} />` con `'stessa $\\omega$ e stessi $u_n$ sugli atomi'` a `PhononMonatomicSection.tsx:482`.
  - Nei tooltip `title` (solo testo semplice), evitare le graffe LaTeX (es. `Chiude la catena ad anello (condizione periodica su N atomi) e discretizza i k permessi in 1BZ`; e `velocità di fase e di gruppo`).

#### I2. Disallineamento notazionale tra asse verticale $\nu$ (THz) ed etichette in $\omega$ sul diagramma di dispersione
- **Dove**: `src/renderer/src/sections/phonon-monatomic/strings.ts:52,56,58-59,64,66,69-70` e `PhononMonatomicSection.tsx:68,81-84,105`.
- **Cosa differisce**: il diagramma di dispersione riporta sull'asse delle ordinate la **frequenza** `ν (THz)` ($\nu = \omega/2\pi$), mentre gli elementi disegnati sullo stesso piano cartesiano e nella sua legenda sono etichettati in termini di **pulsazione** $\omega$:
  - retta acustica: `ω = v_{s}|k|` (`strings.ts:59`);
  - fascia superiore: `ω > ω_{max} (evanescente)` (`strings.ts:58`);
  - legenda: `dispersione ω(k) in 1BZ`, `corda v_p = ω/k`, `tangente v_g = dω/dk` (`strings.ts:64,69-70`).
  Se uno studente legge le coordinate dagli assi ($\nu$ in THz, $k$ in $\text{Å}^{-1}$) e calcola la pendenza della corda o della tangente $\nu/k$ o $d\nu/dk$, ottiene $v_p/2\pi$ e $v_g/2\pi$, che differiscono di un fattore $2\pi$ dai valori di $v_p$ e $v_g$ stampati nel pannello laterale.
- **Riferimento dispensa**: nella dispensa le figure della dispersione hanno tutte ordinata $\omega$ (Fig. 3 p. 7, Fig. 8 p. 15, Fig. 15 p. 33, Fig. 16 p. 34), dove la pendenza coincide esattamente con $v_s, v_p, v_g$; la frequenza $\nu = \omega/2\pi$ in THz è introdotta nell'esempio numerico (§3, p. 9) come conversione.
- **Correzione proposta**: rendere esplicita la coerenza tra ordinata e pendenze: ad esempio etichettare sul grafico `ν = v_{s}|k|/2π` (oppure `ω = v_{s}|k|`, con `ν > ν_{max} (evanescente)` nella fascia) e precisare nella legenda o nel sottotitolo del grafico che, in scala $\nu = \omega/2\pi$, le pendenze geometriche di corda e tangente sono proporzionali a $v_p/2\pi$ e $v_g/2\pi$ (in alternativa, valutare se riportare $\omega$ in $10^{13}\,\text{rad/s}$ sull'asse y in linea diretta con Fig. 3/8/15 della dispensa).

#### I3. Tre «Errori tipici» di §5 (p. 12) e §19 (p. 47) non coperti nella scheda teoria
- **Dove**: `src/renderer/src/sections/phonon-monatomic/strings.ts:106-135` (`theory.blocks`).
- **Cosa differisce**: nella scheda teoria mancano tre avvertenze esplicite presenti nei riquadri arancioni della dispensa per gli argomenti trattati in questa sezione:
  1. **Anarmonicità e piccoli spostamenti** (§5, «Errori tipici», punto 1, p. 12; §1.1 Intuizione, p. 3): non si precisa che l'approssimazione armonica vale solo per *piccoli spostamenti* attorno al minimo ($T$ ben inferiore alla fusione) e che i termini anarmonici $\mathcal{O}(u^3)$ sono *trascurati*, non assenti.
  2. **Solo ramo longitudinale in 1D** (§5, «Errori tipici», punto 6, p. 12; §4.2 avviso, p. 11): non si chiarisce esplicitamente che la catena monatomica 1D a primi vicini descrive *un solo ramo longitudinale*, mentre i modi trasversali e le tre polarizzazioni compaiono in 3D.
  3. **Condizioni di Born–von Kármán come artificio non fisico** (§19, «Errori tipici», punto 1, p. 47; §13.2 Intuizione p. 32 e §13.4 Approfondimento pp. 33–34): nel blocco su Born–von Kármán manca l'avvertenza che la chiusura ad anello è un *artificio matematico/topologico* di comodo (non una proprietà fisica del cristallo) e che non altera le proprietà di volume né il conteggio dei modi (con estremi bloccati i modi sono comunque $N$, ma stazionari). Poiché l'app anima visivamente un anello di atomi, questa precisazione è particolarmente importante per prevenire il misconcetto segnalato dalla dispensa.
- **Correzione proposta**: integrare brevemente i tre punti nei rispettivi blocchi di `strings.ts:108-134` (basta una frase concisa in ciascun blocco: «Approssimazione armonica e molle», «Regime acustico, bordo zona e taglio» e «Condizioni periodiche di Born–von Kármán»).

---

### Minori

#### M1. Segno di $v_p$ nella nota al bordo di zona per $k = -\pi/a$
- **Dove**: `src/renderer/src/sections/phonon-monatomic/strings.ts:99` e `PhononMonatomicSection.tsx:491,499-503`.
- **Cosa differisce**: in modalità continua è possibile selezionare $k = -\pi/a$ (`sel.atEdge === true`). In quel punto la lettura numerica a riga 491 mostra giustamente `v_p = −2,20 km/s` (negativa, poiché $v_p = \omega/k$ ha il segno di $k$), ma la nota subito sotto (`edgeVelNote`) recita `$v_p = \omega_{\max}a/\pi = \frac{2}{\pi}v_s \neq 0$` con segno positivo.
- **Riferimento dispensa**: Lezione 1, §5 p. 12 (scritta per $k = +\pi/a$) e §3.2 / §6.1 ($v_p = \omega/k$, dispari in $k$).
- **Correzione proposta**: scrivere `$|v_p| = \omega_{\max}a/\pi = \frac{2}{\pi}v_s \neq 0$` (oppure `$\pm\frac{2}{\pi}v_s$`).

#### M2. Trasparenza sui preset esterni, equivalenza kg ↔ u e riferimento `(Fig. 4)`
- **Dove**: `src/renderer/src/sections/phonon-monatomic/strings.ts:35,41,136`.
- **Cosa differisce**:
  - `strings.ts:35` e `136`: i profili «Piombo 1D» e «Carbonio 1D» sono già dichiarati «profili (1D) illustrativi», ma aggiungere esplicitamente «esterni alla dispensa» rende la distinzione inequivocabile.
  - `strings.ts:136`: nella nota del metallo tipico si cita `$M = 1{,}05\times 10^{-25}\,\text{kg}$`, mentre menu e cursore mostrano `M = 63,2 u`; aggiungere `(\approx 63{,}2\,\text{u})` (come nella dispensa §3 p. 9: `≈ 63 u`) collega subito la nota al valore dello slider.
  - `strings.ts:41`: `aria-label` `'Modi caratteristici (Fig. 4)'` cita una figura senza specificare la fonte; meglio `'Modi caratteristici della catena'`.
- **Riferimento dispensa**: Lezione 1, §3 p. 9 (`M = 1,05 · 10⁻²⁵ kg (≈ 63 u)`); criterio di trasparenza sui dati esterni della skill `fedelta-corso`.

---

## 4. Verdetto finale

**Da correggere.** Una volta risolti il problema bloccante **B1** ($v_p, v_g$ a $k = 0$) e i tre problemi importanti **I1–I3** (tipografia simboli in UI, coerenza $\nu$/$\omega$ sul diagramma di dispersione e integrazione dei tre errori tipici di §5 e §19 nella scheda teoria), la sezione raggiungerà piena fedeltà al corso.
