# Revisione fedeltà al corso — Guide laterali delle sezioni 1–4 (Fononi)

- **Revisore**: `fedelta-corso`
- **Oggetto della revisione**: le 4 sezioni aggiornate del capitolo «Fononi» (`phonon-monatomic`, `phonon-diatomic`, `phonon-3d`, `phonon-wavepacket`), con particolare attenzione alle nuove schede guida laterali (`Guida alla sezione` in 3 blocchi + `<details className="panel-details">` `Dettagli formali` + `.foot`) in `strings.ts` e `*Section.tsx` (più verifica di coerenza con `formulas.ts`, `manifest.ts`, `model.ts` e `physics/`).
- **Fonti uniche di riferimento**: `materiale/parte6/riferimento-formule.md` e `materiale/parte6/dispensa.pdf` (Parte 6, A.A. 2026/2027, 4 lezioni, 64 pagine).
- **Verdetto**: **approvata** (aggiornato dopo verifica post-correzione di **I1** e **M1**)

---

## 1. Sintesi della verifica

Le nuove schede guida delle 4 sezioni seguono fedelmente l'impostazione didattica richiesta (3 blocchi snelli sempre aperti — *L’idea*, *Come intervengono i parametri*, *Cosa provare* — più il riquadro richiudibile `<details className="panel-details">` *Dettagli formali*, chiuso di default, e la nota `.foot` sulle fonti e sui dati esterni).

- **Sezione 1 (`phonon-monatomic`)**: **conforme** su simboli, formule, limiti, aliasing, anello di Born–von Kármán, errori tipici e trasparenza sui preset.
- **Sezione 2 (`phonon-diatomic`)**: **conforme** su notazione ($a$ passo di Bravais, $a/2$ primi vicini, $M > m$, $\omega_-$ acustico / $\omega_+$ ottico, $\alpha$, $R_{\mathrm{cm}}$, bordi C e B, matrice $\mathbf{D}(k)$ $2\times 2$ e luce IR) e sulle note sui preset.
- **Sezione 3 (`phonon-3d`)**: **conforme** (risolto **I1** in `strings.ts:154`, dove ora i cerchi vuoti delle copie per $\mathbf{G}$ nella griglia 2D di Fig. 17 sono correttamente indicati «sui bordi $-\pi/a$ (per $N$ pari, come a $N = 8$)»); aderente alle correzioni della dispensa (conteggio $p - 1$ LO e $2(p - 1)$ TO, cella primitiva fcc $v_c = a^3/4$ e $N_c = 4N^3$, degenerazioni su $[100]$ e $[111]$ e rimozione su $[110]$, trasparenza in `.foot` su Tab. 1 e passi/masse esterni).
- **Sezione 4 (`phonon-wavepacket`)**: **conforme** su integrale di Fourier, separazione portante/inviluppo ($v_p$, $v_g$), allargamento gaussiano $\sigma(t)$ (eq. 12), relazione $\sigma_0\Delta k = 1/2$, curvatura al bordo zona $\omega''(\pi/a) = -a^2\omega_{\max}/4$, confronto quadratico ($\hbar\omega = \hbar^2 k^2/2m_0$) ed errori tipici di §12; risolto anche il richiamo **M1** in `.foot` (`M = 1,05 × 10⁻²⁵ kg ≈ 63,2 u`).

### Verifiche eseguite (sola lettura su `src/`)
- Confronto sistematico riga per riga di `strings.ts` e `*Section.tsx` (e riscontro con `formulas.ts`, `manifest.ts`, `model.ts`, `ModeCounting3DView.tsx` e `physics/`) delle 4 sezioni con `materiale/parte6/riferimento-formule.md` e `materiale/parte6/dispensa.pdf`, inclusa rilettura post-correzione di `phonon-3d/strings.ts:140-193` e `phonon-wavepacket/strings.ts:140-168`.
- Verifica automatica post-correzione via `katex.renderToString` (`trust` limitato a `\htmlData`, `strict: 'error'` salvo `htmlExtension`) su tutte le **400 formule `$...$`** contenute nei blocchi `theory` dei 4 file `strings.ts`: **0 errori di parsing KaTeX**.
- Assenza verificata di sintassi Markdown grezza (`**`, `*`) nei testi `RichText`, di numeri di slide o nomi di file, e uso coerente della virgola decimale e delle etichette dell'interfaccia.

---

## 2. Controllo per sezione rispetto alla dispensa

### 2.1 Sezione 1 — `phonon-monatomic`
- **File verificati**: `src/renderer/src/sections/phonon-monatomic/strings.ts`, `PhononMonatomicSection.tsx`, `formulas.ts`, `manifest.ts`, `model.ts`.
- **Riferimenti dispensa**: Lezione 1 §§1–5 (pp. 2–13) e Lezione 3 §13 (pp. 31–34).
- **Esito**:
  - **Simboli e formule**: $C$ (non $\gamma$/$K$), $M$, $a$, $x_n^0 = na$, $\Phi(n,m)$ simmetrica e a somma nulla $\sum_m \Phi(n,m) = 0$ (eq. 2–3, pp. 3–4), $M\ddot{u}_n = C(u_{n+1} + u_{n-1} - 2u_n)$ (eq. 6, p. 6), $\omega(k) = 2\sqrt{C/M}\,|\sin(ka/2)|$ (eq. 8, p. 7), $v_s = a\sqrt{C/M}$ (eq. 9, p. 8), $\omega_{\max} = 2\sqrt{C/M}$, $|v_p| = \frac{2}{\pi}v_s \neq 0$ al bordo zona con $v_g = 0$ e $u_n(t) = A(-1)^n\cos\omega_{\max}t$ (§3.3 e §5 p. 12), decadimento evanescente $k = \pi/a + i\kappa$ e filtro passa-basso (§3.4, p. 8).
  - **1BZ e Born–von Kármán**: $-\pi/a < k \le \pi/a$ come cella di Wigner–Seitz del reticolo reciproco $\{G = 2\pi m/a\}$, limite di Nyquist $\lambda_{\min} = 2a$ (§4.1–4.2, pp. 9–10), $u_{n+N} = u_n$, $k_j = \frac{2\pi}{Na}j$ con $-N/2 < j \le N/2$ ($N$ punti in zona poiché $-\pi/a$ e $+\pi/a$ coincidono per $G$) e passaggio al continuo $\sum_k \to \frac{L}{2\pi}\int\mathrm{d}k$ (§13.2–13.4, pp. 32–33).
  - **Copertura didattica ed errori tipici (§5, p. 12)**: coperti tutti i punti chiave nei *Dettagli formali* (anarmonicità trascurata ma non assente; atomi che oscillano al bordo zona anche con $v_g = 0$; differenza $v_p \neq v_g$; equivalenza $k + G$; singolo ramo longitudinale in 1D vs polarizzazioni trasversali in 3D).
  - **Preset e `.foot` (`strings.ts:35, 155`, `manifest.ts:52-56`)**: «Metallo tipico (§3)» riproduce i parametri di §3 p. 9 ($M = 1{,}05\times 10^{-25}\,\text{kg} \approx 63\,\text{u}$, espresso come $63{,}2\,\text{u}$ nel modello, $a = 2{,}5\,\text{Å}$, $C = 20\,\text{N/m}$); «Piombo 1D» e «Carbonio 1D» sono dichiarati esplicitamente esterni e illustrativi sia in `presets.note` sia in `.foot`.

### 2.2 Sezione 2 — `phonon-diatomic`
- **File verificati**: `src/renderer/src/sections/phonon-diatomic/strings.ts`, `PhononDiatomicSection.tsx`, `formulas.ts`, `manifest.ts`, `model.ts`.
- **Riferimenti dispensa**: Lezione 2 §§7–8 (pp. 17–23), §10.3 (p. 27), §12 (pp. 29–30) e Lezione 4 §24 (pp. 59–60), §26 (pp. 62–63).
- **Esito**:
  - **Simboli e convenzioni**: $a$ passo reticolare di Bravais e $a/2$ distanza tra primi vicini (§7.1, p. 18 e §12 p. 29); $M$ sui siti pari $n$ e $m$ sui siti dispari $n - 1$; ansatz $u_n = Ae^{i(kna/2 - \omega t)}$ e $u_{n-1} = \alpha Ae^{i(k(n-1)a/2 - \omega t)}$ (eq. 15–16, p. 18); corretta precisazione in `strings.ts:155` che $\alpha$ è il rapporto d'ampiezza (uguale a $u_{n-1}/u_n$ a $k = 0$); segni $\omega_-$ acustico e $\omega_+$ ottico con esplicito avviso a non invertire i segni (§7.4 p. 19, §12 p. 29).
  - **Limiti, gap e matrice dinamica**: $v_s = a\sqrt{C/[2(m+M)]}$ e $\alpha = 1$ per $k \to 0$ acustico (eq. 21, p. 21); $\omega_+(0) = \sqrt{2C(m+M)/(mM)}$ e $\alpha = -M/m$, $R_{\mathrm{cm}} = 0$ per $k = 0$ ottico (eq. 22, p. 21), con spiegazione fedele dello sfasamento $ka/2$ per $k \neq 0$; bordi C ($\sqrt{2C/M}$, $\alpha = 0$, $m$ ferma) e B ($\sqrt{2C/m}$, $1/\alpha = 0$, $M$ ferma) per $M > m$ e scambio dei ruoli per $m > M$ (§8.2, p. 22); gap $\Delta\omega_{\mathrm{gap}}$ e chiusura a $M = m$ per ripiegamento della monatomica di passo $a/2$ (§8.3 e Approfondimento p. 23); matrice dinamica $2\times 2$ con $D_{12} = -\frac{2C}{\sqrt{Mm}}\cos\frac{ka}{2}$ (§10.3, p. 27) e $\alpha = (\varepsilon_m/\sqrt{m})/(\varepsilon_M/\sqrt{M})$.
  - **Luce IR (§24, pp. 59–60)**: conservazione $\hbar\omega_{\mathrm{luce}} = \hbar\omega_{\mathrm{ph}}$, $k_{\mathrm{luce}} = k_{\mathrm{ph}}\,(+G)$, $k_{\mathrm{luce}} \sim 10^{-5}\pi/a$, incrocio esclusivo col ramo ottico a $k \approx 0$ (TO nei cristalli ionici/polari; nessun dipolo né assorbimento IR a un fotone se $M = m$, come nel diamante).
  - **Preset e `.foot` (`strings.ts:31, 175`, `manifest.ts:56-93`)**: «Coppia Na–Cl (§8)» ($m = 23\,\text{u}$, $M = 35{,}5\,\text{u}$, $a = 5{,}64\,\text{Å}$, $C = 10\,\text{N/m}$) dichiarata esempio illustrativo 1D di §8 e §24 e non un calcolo 3D di NaCl reale (p. 23); «Masse $M = 2m$» ricondotto al rapporto di Fig. 11–12; «Limite $M = m$» e «Li–I» dichiarati esterni.

### 2.3 Sezione 3 — `phonon-3d`
- **File verificati**: `src/renderer/src/sections/phonon-3d/strings.ts`, `Phonon3DSection.tsx`, `formulas.ts`, `manifest.ts`, `model.ts`, `ModeCounting3DView.tsx` e `src/renderer/src/physics/phonon3d.ts`.
- **Riferimenti dispensa**: Lezione 2 §§9–10 (pp. 23–27, Fig. 13 p. 24), §12 (pp. 29–30) e Lezione 3 §14 (pp. 35–37, Tab. 1 p. 36, Figg. 17–18 pp. 36–37), §19 (pp. 47–48).
- **Esito**:
  - **Correzioni della dispensa rispettate**: conteggio dei $3p$ rami = $3$ acustici ($1$ LA + $2$ TA) + $3p-3$ ottici con **$p - 1$ LO e $2(p - 1)$ TO** lungo direzioni di alta simmetria (e rifiuto esplicito dell'imprecisione «$1$ LO e $3p - 4$ TO» senza citare numeri di slide, §9.1 p. 24); validità esatta delle etichette LA/TA/LO/TO solo lungo alta simmetria (§9.1 p. 24); cella primitiva fcc $v_c = a^3/4$ e $N_c = 4N^3$ invece di $v_c = a^3$ (§14.1 p. 35).
  - **Matrice dinamica, simmetrie e Tab. 1**: onda di Bloch (eq. 26), matrice $3p\times 3p$ (eq. 27–28), hermitianità e regola di somma $\varepsilon_{\beta j} = \sqrt{M_\beta}\,c_j$ (§10.2 pp. 26–27); degenerazioni per assi $C_4$ ($[100]$, $\Gamma\text{–}X$) e $C_3$ ($[111]$, $\Gamma\text{–}L$) e rimozione su asse $C_2$ ($[110]$, $K\text{–}\Gamma$); valori di Tab. 1 per Al, Diamante e PbTe; tecniche sperimentali INS e IXS (§14.4 pp. 36–37).
  - **Trasparenza in `.foot` (`strings.ts:191`)**: dichiara con precisione che le curve complete lungo $\Gamma\text{–}X\text{–}K\text{–}\Gamma\text{–}L$ derivano da modelli armonici 3D calibrati sui valori della Tab. 1 (non da dati sperimentali o DFT diretti come Zhang et al. 2009), distinguendo $a = 4{,}05\,\text{Å}$ e massa dell'Al da §14.2 rispetto a $a = 3{,}57\,\text{Å}$ (Diamante), $a = 6{,}46\,\text{Å}$ (PbTe) e masse standard esterni alla dispensa.
  - **Griglia 2D di Fig. 17 (`strings.ts:154`)**: corretto in verifica post-correzione (ora indica correttamente `sui bordi $-\pi/a$ (per $N$ pari, come a $N = 8$)`, coerente con $-\pi/a < k \le \pi/a$ di §13.3 p. 33, Fig. 17 p. 36 e `bvkGrid2D`).

### 2.4 Sezione 4 — `phonon-wavepacket`
- **File verificati**: `src/renderer/src/sections/phonon-wavepacket/strings.ts`, `PhononWavepacketSection.tsx`, `formulas.ts`, `manifest.ts`, `model.ts`.
- **Riferimenti dispensa**: Lezione 2 §6 (pp. 14–17, Figg. 7–9) e §12 (pp. 29–30); Lezione 1 §3.2 (p. 8) e §3 (p. 9) per i parametri del metallo tipico.
- **Esito**:
  - **Simboli, definizioni e leggi**: integrale di Fourier (eq. 10, p. 14), sviluppo al primo ordine $\Psi(x,t) \simeq e^{i(k_0 x - \omega_0 t)}F(x - v_g t)$ (eq. 11, p. 15), $v_p = \omega_0/k_0$ (corda) e $v_g = \mathrm{d}\omega/\mathrm{d}k$ (tangente), indeterminazione $\sigma_0\Delta k = 1/2$ ($\Delta x\,\Delta k \ge 1/2$) con $\Phi(\kappa) \propto e^{-\kappa^2/4s^2}$ e $s = \Delta k$, $\sigma_0 = 1/(2s)$ e allargamento gaussiano $\sigma(t) = \sigma_0\sqrt{1 + (\omega'' t / 2\sigma_0^2)^2}$ (eq. 12, p. 17).
  - **Quattro regimi ed errori tipici (§6.2–6.3, §12)**: lineare ($\omega = v_s|k|$, $v_p = v_g = \pm v_s$, $\omega'' = 0$, punto angoloso in $k_0 = 0$); acustico ($\omega \simeq v_s|k|[1 - (ka)^2/24]$ per $k_0 a \ll 1$, $\omega''(\pi/a) = -a^2\omega_{\max}/4 \neq 0$ al bordo zona con $v_g = 0$, $v_p = \pm(2/\pi)v_s \neq 0$, atomi in opposizione di fase a $\lambda = 2a$ e allargamento del pacchetto fermo); ottico biatomico ($\omega_+(k)$ con $v_g < 0$ e $v_p > 0$ per $k_0 > 0$); particella libera ($\hbar\omega = \hbar^2 k^2/2m_0$, $\omega'' = \hbar/m_0 > 0$, $v_g = 2v_p$, usata come contrasto didattico perché per i fononi la dispersione è quasi lineare e non quadratica, §6.3 riquadro arancione p. 17).
  - **Preset e `.foot` (`strings.ts:166`)**: riusa «metallo tipico» (§3, ora con richiamo esplicito `M = 1,05 × 10⁻²⁵ kg ≈ 63,2 u`) e «coppia Na–Cl» (§8) e dichiara l'uso della massa elettronica $m_0$ (con passo di scala $a = 2{,}50\,\text{Å}$ su $k_0$) per il confronto quadratico di §6.3.

---

## 3. Problemi riscontrati e stato post-correzione

### Bloccanti

Nessuno.

---

### Importanti

#### I1. [RISOLTO] Bordo dei cerchi vuoti nella griglia 2D di Fig. 17 indicato come `$+\pi/a$` anziché `$-\pi/a$`
- **Dove**: `src/renderer/src/sections/phonon-3d/strings.ts:154` (blocco *Cosa provare* di `Guida alla sezione`).
- **Cosa differiva**: il testo indicava «i cerchi vuoti sui bordi $+\pi/a$», in contrasto con la convenzione della dispensa ($-\pi/a < k \le +\pi/a$, §4.1 p. 10, §13.3 p. 33, Fig. 17 p. 36) e con `bvkGrid2D` / `ModeCounting3DView.tsx` (dove $+\pi/a$ è incluso e i cerchi vuoti stanno sui bordi $-\pi/a$ per $N$ pari).
- **Verifica post-correzione**: riletta la riga `src/renderer/src/sections/phonon-3d/strings.ts:154`, ora recita `sui bordi $-\pi/a$ (per $N$ pari, come a $N = 8$)`, pienamente conforme a dispensa e codice; ricontrollato il parsing KaTeX senza errori.

---

### Minori

#### M1. [RISOLTO] Richiamo al valore in kg di §3 accanto a `M = 63,2 u` nella nota `.foot` di `phonon-wavepacket`
- **Dove**: `src/renderer/src/sections/phonon-wavepacket/strings.ts:166`.
- **Cosa differiva**: `.foot` riportava solo `M = 63,2 u` senza richiamare `1,05 × 10⁻²⁵ kg` di §3 p. 9.
- **Verifica post-correzione**: riletta la riga `src/renderer/src/sections/phonon-wavepacket/strings.ts:166`, ora recita `M = 1,05 × 10⁻²⁵ kg ≈ 63,2 u`, pienamente allineata a §3 p. 9 e alla Sezione 1.

---

## 4. Verdetto finale

**Approvata.** Dopo la verifica post-correzione dei due rilievi (**I1** in `phonon-3d/strings.ts:154` e **M1** in `phonon-wavepacket/strings.ts:166`), tutte e quattro le nuove schede guida laterali (*Guida alla sezione*, *Dettagli formali* e *.foot*) e i relativi file di sezione risultano pienamente fedeli alla dispensa Parte 6 per simboli, definizioni, limiti, correzioni delle slide, trasparenza su preset/modelli e sintassi KaTeX (`400/400` formule `$...$` nei blocchi `theory` verificate con 0 errori).
