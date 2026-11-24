# Revisione fedeltà al corso — Sezione 4: Pacchetti d’onda (velocità di fase e di gruppo)

- **Revisore**: `fedelta-corso`
- **Sezione revisionata**: `src/renderer/src/sections/phonon-wavepacket/` (`manifest.ts`, `formulas.ts`, `strings.ts`, `model.ts`, `store.ts`, `WavepacketView.tsx`, `PhononWavepacketSection.tsx`) e funzioni wavepacket in `src/renderer/src/physics/phononDispersion.ts` (righe 925–1415)
- **Fonti uniche di riferimento**: `materiale/parte6/dispensa.pdf` (Lezione 2 §6 pp. 14–17, Figg. 7–9, §12 pp. 29–30; richiami a Lezione 1 §3 p. 9 e Lezione 2 §8 pp. 20–23) e `materiale/parte6/riferimento-formule.md`
- **Verdetto**: **da correggere**

---

## 1. Sintesi della verifica

L’impianto fisico e matematico della sezione è molto solido e aderente alla dispensa Parte 6:
- **Formule ed equazioni chiave**: le equazioni (10)–(12) della dispensa (§6.1–§6.3, pp. 14–17), le definizioni $v_p = \omega/k$ e $v_g = \mathrm{d}\omega/\mathrm{d}k$, la relazione $\sigma_0 = 1/(2s)$ con $\sigma_0\,\Delta k = 1/2$ ($\Delta x\,\Delta k \ge 1/2$), l’allargamento gaussiano $\sigma(t) = \sigma_0\sqrt{1 + (\omega'' t / 2\sigma_0^2)^2}$ nel riferimento comovente $\xi = x - v_g t$ con conservazione della norma $\int|\Psi|^2\,\mathrm{d}x$, e il campionamento discreto degli atomi sui siti $x_n^0 = na$ nei tre regimi reticolari sono implementati correttamente in `phononDispersion.ts` e riportati fedelmente in `formulas.ts` e `strings.ts`.
- **Notazione di corso**: la costante elastica usa ovunque $C$ (mai $\gamma$ o $K$, in accordo con la nota 5 di p. 16), $a$ è il passo reticolare, $\omega_+$ indica il ramo ottico, e sono presenti tutti i 4 regimi di §6.2–§6.3 (lineare, acustico e bordo zona, ottico con $v_g < 0$, quadratico $\hbar\omega = \hbar^2 k^2 / 2m_0$ con $v_g = 2v_p$).
- **Lingua e pulizia `RichText`**: italiano corretto, virgola decimale nelle letture numeriche (`ui/format.ts`, `0{,}50` in `PhononWavepacketSection.tsx:540`), assenza totale di sintassi Markdown (`**` o `*`) in `strings.ts` e assenza di riferimenti a numeri di slide o nomi di file.
- **Verifiche eseguite**:
  - Test di fisica: `.\.tools\node\node.exe node_modules/vitest/vitest.mjs run src/renderer/src/physics/phononDispersion.test.ts` → **22/22 test superati** (inclusi i test dedicati ai pacchetti d’onda alle righe 555–765: integrale eq. (10), eq. (12), derivate numeriche di $v_g$ e $\omega''$, casi limite $k_0 = 0$ e $k_0 = \pm\pi/a$).
  - Controllo automatico KaTeX (`throwOnError: true`, `strict: 'error'` eccetto `htmlExtension`) su tutte le **100** espressioni matematiche di `formulas.ts` e `strings.ts`: **0 errori**.
  - Verifica numerica indipendente in Python dei valori dei preset e dei casi limite ($k_0 = 0$, $k_0 = \pi/a$ sul ramo acustico e sul ramo ottico).

Sono però presenti **1 problema bloccante** (la nota al bordo di zona nel pannello `Values` stampa la formula monoatomica acustica $\omega'' = -a^2\omega_{\max}/4$ anche sul ramo ottico biatomico, dove in realtà $k = \pm\pi/a$ è un minimo con $\omega'' > 0$), **3 problemi importanti** (stringa LaTeX `\text{ Å}` passata a `drawMathText` che non la interpreta; simboli `v_p`, `v_g`, `v_s` con underscore grezzo in controlli/note/canvas; disallineamento tra ordinata $\nu$ in THz e legende $v_p = \omega/k$, $v_g = \mathrm{d}\omega/\mathrm{d}k$ prive del fattore $1/2\pi$) e **4 problemi minori** (etichetta `a = 2,50 Å` mostrata in `Values` anche per la particella libera; due sfumature di precisione su regime lineare/quasi lineare nella scheda teoria; rinvio isolato `da eq. (20)` in `formulas.ts:51`; piccole rifiniture sulla nota `.foot` e sui tooltip).

---

## 2. Controllo sistematico rispetto alla dispensa

### 2.1 Simboli, formule, convenzioni e casi limite

| Grandezza / Formula / Comportamento | Dispensa Parte 6 | Codice / UI (file e righe) | Esito |
|---|---|---|---|
| Costante elastica $C$ (non $\gamma$/$K$), passo reticolare $a$ | Nota 5 p. 16; §3 p. 9; §8 p. 23 | `manifest.ts:38-51`, `strings.ts:62,142` | Conforme |
| Integrale di Fourier $\Psi(x,t)$, separazione portante $\times$ inviluppo $F(x-v_g t)$ | §6.1 eqq. (10)–(11) pp. 14–15 | `formulas.ts:30`, `strings.ts:123-124` | Conforme |
| Definizioni $v_p = \omega/k$, $v_g = \mathrm{d}\omega/\mathrm{d}k$, $\sigma_0 = 1/(2s)$, $\Delta x\,\Delta k \ge 1/2$ | §6.1 pp. 14–15; §6.3 eq. (12) p. 17 | `formulas.ts:33-41`, `PhononWavepacketSection.tsx:530-541` | Conforme |
| Allargamento $\sigma(t) = \sigma_0\sqrt{1+(\omega'' t/2\sigma_0^2)^2}$, $\gamma = 2s^2\omega''t$, area $\int|\Psi|^2\mathrm{d}x$ | §6.3 eq. (12) e Fig. 9 p. 17 | `formulas.ts:41`, `phononDispersion.ts:1292-1342`, `WavepacketView.tsx` | Conforme |
| Regime lineare $\omega = v_s|k|$ ($v_p = v_g = \pm v_s$, $\omega'' = 0$) | §6.2 p. 16 | `formulas.ts:47`, `strings.ts:130` | Conforme (v. M2 per $k < 0$ e $ka \ll 1$) |
| Bordo zona $k_0 = \pm\pi/a$ (acustico: $v_g = 0$, $v_p \neq 0$, $\omega'' = -a^2\omega_{\max}/4$) | §6.2 p. 16; §6.3 riquadro arancione p. 17 | `formulas.ts:49`, `strings.ts:107,131,138` | **Errore sul ramo ottico** (v. B1) |
| Ramo ottico $\omega_+(k)$ ($v_g < 0$, $v_p > 0$ per $k > 0$; $k_0 = 0$: $v_g = 0$, $v_p \to \pm\infty$) | §6.2 p. 16; §8.1 p. 21 | `formulas.ts:51`, `PhononWavepacketSection.tsx:476-489`, `strings.ts:105,108,131` | Conforme (v. B1 a $k_0 = \pm\pi/a$, v. M3) |
| Dispersione quadratica $\hbar\omega = \hbar^2 k^2/2m_0$ ($v_g = 2v_p$, $\omega'' = \hbar/m_0$) | §6.3 pp. 16–17 | `formulas.ts:53`, `PhononWavepacketSection.tsx:503-522`, `strings.ts:106,109` | Conforme (v. M1 per `a = 2,50 Å`) |
| Punti angolosi $k_0 = 0$ (lineare/acustico: limiti $\pm v_s$) | §3.2 p. 8; §6.2 p. 16 | `PhononWavepacketSection.tsx:465-475`, `strings.ts:103-104` | Conforme |
| Asse grafico $\nu(k) = \omega/2\pi$ (THz) vs legende corda/tangente | Fig. 8 p. 15; §3 p. 9 | `strings.ts:46,49,66,75-78` | **Manca `(pendenza v/2π)`** (v. I3) |
| Resa tipografica simboli su canvas e UI | Convenzioni dispensa | `WavepacketView.tsx:405,427`, `strings.ts:33,102`, `manifest.ts:75,98,119` | **Sintassi grezza `\text{}` e `_`** (v. I1, I2) |
| Italiano, virgola decimale, zero Markdown in `RichText`, zero slide/nomi file | Regole `fedelta-corso` | `strings.ts`, `ui/format.ts` | Conforme |

### 2.2 Copertura «Cosa devi saper fare» ed «Errori tipici» (§6 e §12, pp. 14–17 e 29–30)

- **Lezione 2, §12 — «Cosa devi saper fare», punto 1 (p. 29)**:
  - Definire $v_p$ e $v_g$, mostrare che l’inviluppo viaggia a $\mathrm{d}\omega/\mathrm{d}k$, interpretazione geometrica (corda e tangente, Fig. 8): **coperto** (`formulas.ts:30-37`, `strings.ts:123-124`, sonda su `DispersionPlot`).
  - Discutere i 4 regimi (lineare, bordo zona, pendenza negativa, quadratico): **coperto** (pulsanti dei 4 regimi, scenari in `PRESETS`, `strings.ts:128-132`).
- **Lezione 2, §12 — «Errori tipici» (p. 29) e riquadro arancione §6.3 (p. 17)**:
  - *Non identificare la velocità del segnale con $v_p = \omega/k$* ($v_g$ può essere nulla o opposta a $v_p$): **coperto esplicitamente** (`strings.ts:138` punto 1, `strings.ts:108`, animazione sul ramo ottico e al bordo zona).
  - *$v_g = 0$ al bordo di zona non significa atomi fermi né $\omega'' = 0$* ($\omega''(\pi/a) = -a^2\omega_{\max}/4 \neq 0$, il pacchetto è fermo ma si allarga): **coperto esplicitamente** (`strings.ts:80, 138` punto 2, curva $\sigma(t)/\sigma_0$ e atomi campionati in `WavepacketView.tsx`), fatta salva la sovrapposizione errata sul ramo ottico segnalata in **B1**.
  - *La dispersione dei fononi a grande lunghezza d’onda è «quasi» lineare, non quadratica come quella degli elettroni liberi*: **coperto esplicitamente** (`strings.ts:109, 138` punto 3, confronto diretto col regime quadratico e curva tratteggiata lineare di riferimento).

### 2.3 Numeri, preset e nota `.foot`

- **`MONATOMIC_REF` (`manifest.ts:39-43`)**: $a = 2{,}50\,\text{Å}$, $M = 63{,}2\,\text{u}$, $C = 20\,\text{N/m}$ (da §3 p. 9: $M = 1{,}05\cdot 10^{-25}\,\text{kg} \approx 63\,\text{u}$, $a = 2{,}5\,\text{Å}$, $C = 20\,\text{N/m}$). Riproduce $v_s = 3{,}45\,\text{km/s}$ (dispensa $\approx 3{,}5\cdot 10^3\,\text{m/s}$), $\nu_{\max} = 4{,}39\,\text{THz}$ (dispensa $\approx 4{,}4\,\text{THz}$), $\omega''(\pi/a) = -0{,}431\cdot 10^{-6}\,\text{m}^2/\text{s}$.
- **`DIATOMIC_REF` (`manifest.ts:46-51`)**: $a = 5{,}64\,\text{Å}$, $M = 35{,}5\,\text{u}$, $m = 23{,}0\,\text{u}$, $C = 10\,\text{N/m}$ (coppia Na–Cl da §8 p. 23). Al preset `optical-negative-vg` ($k_0 = 0{,}5\,\pi/a$) dà $\nu_0 = 4{,}34\,\text{THz}$, $v_p = +9{,}79\,\text{km/s} > 0$, $v_g = -1{,}47\,\text{km/s} < 0$.
- **5 preset (`manifest.ts:95-131`)**: coprono fedelmente i 4 scenari di §6.2–§6.3 più l’illustrazione qualitativa di Fig. 7 (`acoustic-dispersive`, $k_0 = 0{,}66\,\pi/a$ dove $v_p > v_g > 0$, con le creste che scorrono attraverso l’inviluppo come in Fig. 7 p. 15).
- **Nota `.foot` (`strings.ts:142`)**: cita esattamente dispensa Parte 6, Lezione 2 §6 (pp. 14–17, Figg. 7–9) e §12 (pp. 29–30), metallo tipico (§3), coppia Na–Cl (§8) e massa elettronica $m_0$ (§6.3), senza riferimenti a slide o file (v. M4 per due piccole rifiniture).

---

## 3. Problemi riscontrati

### Bloccanti

#### B1. La nota di bordo zona mostra la formula acustica monoatomica $\omega'' = -a^2\omega_{\max}/4$ anche sul ramo ottico biatomico
- **Dove**: `src/renderer/src/sections/phonon-wavepacket/PhononWavepacketSection.tsx:508-512` e `src/renderer/src/sections/phonon-wavepacket/strings.ts:107`.
- **Cosa differisce**: selezionando il regime **`Ramo ottico`** e portando il vettore d’onda a bordo zona ($k_0 = \pm\pi/a$), il flag `char.isZoneEdgeStanding` (`phononDispersion.ts:1251-1253`) vale `true`. Il pannello `Values` stampa quindi `v.edgeNote` (`strings.ts:107`):
  > «Al bordo di zona $k_0 = \pm\pi/a$ si forma un’onda stazionaria ($v_g = 0$, $v_p \neq 0$), ma la curvatura $\omega'' = -a^2\omega_{\max}/4 \neq 0$: il pacchetto resta fermo e si allarga.»
  
  Questa formula vale **esclusivamente** per il ramo acustico della catena monatomica (dove $k = \pm\pi/a$ è un massimo, $\omega'' < 0$). Sul ramo ottico della catena biatomica (punto B, §8.2 p. 22), invece, $k = \pm\pi/a$ è un **minimo** di frequenza ($\omega_{\min}^{\mathrm{ott}} = \sqrt{2C/m}$) con curvatura **positiva** $\omega_+''(\pi/a) = +3{,}35\cdot 10^{-6}\,\text{m}^2/\text{s} > 0$, che compare immediatamente sotto nella voce `Curvatura ω''` in aperta contraddizione con `ω'' = -a²ω_max/4`.
- **Riferimento dispensa**: Lezione 2, §6.3 riquadro arancione p. 17 ($\omega'' = -a^2\omega_{\max}/4$ per la catena monatomica al bordo zona) e §8.2 p. 22 (punto B, minimo del ramo ottico $\omega_{\min}^{\mathrm{ott}} = \sqrt{2C/m}$).
- **Correzione proposta**: in `PhononWavepacketSection.tsx:508-512`, distinguere `st.regime === 'acoustic'` da `st.regime === 'optical'`: mantenere `v.edgeNote` con $\omega'' = -a^2\omega_{\max}/4$ solo per `acoustic`, e per `optical` mostrare una nota dedicata (es. `'Al bordo di zona $k_0 = \\pm\\pi/a$ il ramo ottico ha un minimo ($v_g = 0$, $v_p \\neq 0$), con curvatura positiva $\\omega\'\' > 0$: il pacchetto resta fermo e si allarga.'`).

---

### Importanti

#### I1. Comando LaTeX `\text{ Å}` non interpretato da `drawMathText` sul canvas
- **Dove**: `src/renderer/src/sections/phonon-wavepacket/WavepacketView.tsx:427`.
- **Cosa differisce**: la quota del passo reticolare in basso a sinistra del canvas è disegnata con:
  `drawMathText(ctx, \`a = ${formatNumber(a, 2)}\\text{ Å}\`, ...)`
  La funzione `drawMathText` (`src/renderer/src/viz/canvas.ts:159-168, 295-320`) analizza soltanto `_` e `^` e non supporta comandi LaTeX `\text{...}`. Sul canvas viene quindi disegnato letteralmente `a = 2,50\text{ Å}` (o `5,64\text{ Å}`).
- **Riferimento dispensa**: resa pulita di simbolo e unità ($a = 2{,}5\,\text{Å}$ in §3 p. 9; $a = 5{,}64\,\text{Å}$ in §8 p. 23).
- **Correzione proposta**: sostituire `\\text{ Å}` con ` Å` in `WavepacketView.tsx:427` (come già fatto in `ModeCounting3DView.tsx:239`), oppure usare `drawRichMathText` se si desidera l’unità in tondo.

#### I2. Simboli con underscore grezzo (`v_p`, `v_g`, `v_s`) resi letteralmente in UI e sul canvas
- **Dove**:
  - `src/renderer/src/sections/phonon-wavepacket/strings.ts:102` + `PhononWavepacketSection.tsx:462`: `velocities: 'Velocità (v_p, v_g)'` è passato a `<RichText text={v.velocities} />` senza `$…$`, quindi nella colonna destra compare letteralmente `Velocità (v_p, v_g)`.
  - `src/renderer/src/sections/phonon-wavepacket/strings.ts:33` + `PresetMenu` (`src/renderer/src/ui/controls.tsx:164`): `presets.note` contiene `ottico v_g < 0` senza `$…$` dentro `<RichText>`, quindi sotto il menu scenari si legge letteralmente `ottico v_g < 0`.
  - `src/renderer/src/sections/phonon-wavepacket/WavepacketView.tsx:405` + `strings.ts:54`: quando è attivo il riferimento comovente, `comovingBadge: 'ξ = x − v_g t'` viene disegnato con `ctx.fillText(...)` invece di `drawMathText(...)`, stampando `ξ = x − v_g t` con underscore sul canvas.
  - `src/renderer/src/sections/phonon-wavepacket/manifest.ts:75, 98, 119` + `PhononWavepacketSection.tsx:206`: il pulsante del regime mostra `{r.label}` (`Ramo ottico v_g < 0`) e due voci del menu `<select>` mostrano `v_s` e `v_g` con underscore (`Regime lineare ω = v_s|k| (§6.2)`, `Ramo ottico v_g < 0 (§6.2)`).
- **Riferimento dispensa**: notazione con pedici ($v_p$, $v_g$, $v_s$) in §6.1–§6.2 pp. 14–16.
- **Correzione proposta**:
  - In `strings.ts:102` scrivere `'Velocità ($v_p, v_g$)'`; in `strings.ts:33` scrivere `ottico $v_g < 0$`.
  - In `WavepacketView.tsx:405`, quando `p.comoving` è vero, disegnare `s.scene.comovingBadge` con `drawMathText` (come già fatto alle righe 346 e 384 per `v_g` e `v_p`).
  - In `PhononWavepacketSection.tsx:206` usare `<RichText text={r.label} />` (con `'Ramo ottico $v_g < 0$'` in `manifest.ts:75`), e nelle `<option>` di `manifest.ts:98, 119` evitare underscore grezzi (es. `'Regime lineare (§6.2)'` e `'Ramo ottico, pendenza negativa (§6.2)'`).

#### I3. Legende di corda $v_p$ e tangente $v_g$ non allineate all’asse verticale $\nu$ (THz)
- **Dove**: `src/renderer/src/sections/phonon-wavepacket/strings.ts:75-76` (e `strings.ts:124`).
- **Cosa differisce**: sul diagramma `DispersionPlot` l’ordinata è la frequenza `ν (THz)` ($\nu = \omega/2\pi$, `strings.ts:49`), e coerentemente `legendCurve` e `legendLinearRef` (`strings.ts:66, 78`) scrivono $\nu = v_s|k|/2\pi$. Tuttavia `legendVp` e `legendVg` (`strings.ts:75-76`) recitano `'corda $v_p = \\omega/k$'` e `'tangente $v_g = \\mathrm{d}\\omega/\\mathrm{d}k$'` senza ricordare che sul grafico $\nu(k)$ le pendenze geometriche valgono $v_p/2\pi$ e $v_g/2\pi$.
- **Riferimento dispensa**: Fig. 8 p. 15 (dove l’asse verticale è $\omega$, quindi la pendenza è direttamente $v_p$ o $v_g$); coerenza con la Sezione 1 (`phonon-monatomic/strings.ts:68-69`).
- **Correzione proposta**: aggiornare `strings.ts:75-76` in `'corda $v_p = \\omega/k$ (pendenza $v_p/2\\pi$)'` e `'tangente $v_g = \\mathrm{d}\\omega/\\mathrm{d}k$ (pendenza $v_g/2\\pi$)'` (e precisare in `strings.ts:124` «sul grafico $\omega(k)$, qui scalato in $\nu = \omega/2\pi$»).

---

### Minori

#### M1. Etichetta `a = 2,50 Å` mostrata in `Values` anche per la particella libera
- **Dove**: `src/renderer/src/sections/phonon-wavepacket/PhononWavepacketSection.tsx:416-418` (e `282`).
- **Cosa differisce**: nel regime `quadratic` («Particella libera ($\omega \propto k^2$)»), il canvas dichiara giustamente *«Mezzo continuo (particella libera: nessun reticolo discreto)»* (`WavepacketView.tsx:437`), mentre nel pannello `Values` subito accanto si legge `Particella libera (ω ∝ k²) · a = 2,50 Å` senza specificare che `a` è soltanto la lunghezza di riferimento per la scala dei cursori $k_0$ (in $\pi/a$) e $\sigma_0$ (in $a$).
- **Riferimento dispensa**: §6.3 p. 16 (particella libera quantistica priva di reticolo).
- **Correzione proposta**: per `st.regime === 'quadratic'`, mostrare `scala rif. a = 2,50 Å` invece di `a = 2,50 Å`.

#### M2. Sfumature nella scheda teoria su segno di $v_p, v_g$ e dispersione quasi lineare ($k_0 a \ll 1$)
- **Dove**: `src/renderer/src/sections/phonon-wavepacket/strings.ts:130`.
- **Cosa differisce**: il secondo blocco della teoria afferma: *«Regime lineare ($\omega = v_s|k|$): tutte le componenti viaggiano alla stessa velocità $v_p = v_g = v_s$ e $\omega'' = 0$, quindi il pacchetto trasla rigidamente senza deformarsi. Lo stesso vale sul ramo acustico per $k_0 a \ll 1$, dove $\omega \simeq v_s|k|[1 - (ka)^2/24]$ è quasi lineare.»*
  - Poiché la sezione consente $k_0 < 0$, per $\omega = v_s|k|$ vale più esattamente $v_p = v_g = \pm v_s$ (come già riportato in `formulas.ts:47`).
  - Sul ramo acustico per $k_0 a \ll 1$, la curvatura $\omega'' \propto k$ è piccola ma non identicamente nulla: come precisa la dispensa (§6.3 riquadro arancione, p. 17), i pacchetti acustici a grande lunghezza d’onda *«si allargano molto lentamente»*, anziché non deformarsi affatto.
- **Riferimento dispensa**: Lezione 2, §6.2 p. 16 e §6.3 riquadro arancione p. 17.
- **Correzione proposta**: precisare `$v_p = v_g = \pm v_s$` (oppure «$v_s$ per $k_0 > 0$») e sostituire «Lo stesso vale sul ramo acustico per $k_0 a \ll 1$...» con «Sul ramo acustico per $k_0 a \ll 1$, $\omega \simeq v_s|k|[1 - (ka)^2/24]$ è quasi lineare: $\omega''$ è piccola e il pacchetto si allarga molto lentamente.».

#### M3. Riferimento `da eq. (20)` non esplicitato nella formula del ramo ottico
- **Dove**: `src/renderer/src/sections/phonon-wavepacket/formulas.ts:51`.
- **Cosa differisce**: `regimeFormulaTex('optical')` visualizza `\omega_+(k)\;\text{da eq. (20)}:\; v_g < 0,\; v_p > 0\;(k > 0)`. L’equazione (20) appartiene alla dispensa (§7.4 p. 19) e alla Sezione 2, ma non compare nella Sezione 4.
- **Riferimento dispensa**: §6.2 p. 16 e §7.4 eq. (20) p. 19.
- **Correzione proposta**: sostituire `\text{da eq. (20)}` con `\text{(catena biatomica)}` (o `\text{da §8}`), rendendo la formula autonoma nella sezione.

#### M4. Rifiniture sulla nota `.foot` e sui tooltip dei pulsanti regime
- **Dove**: `src/renderer/src/sections/phonon-wavepacket/strings.ts:142` e `manifest.ts:65, 71, 77, 83`.
- **Cosa differisce**:
  - In `strings.ts:142` (`.foot`) il metallo tipico è indicato con `M = 63,2 u`, mentre la dispensa (§3 p. 9) dà `M = 1,05 · 10⁻²⁵ kg (≈ 63 u)` e la coppia Na–Cl (§8 p. 23) è esplicitamente un modello 1D illustrativo. Aggiungere `M = 1,05×10⁻²⁵ kg ≈ 63,2 u` e `(illustrativa 1D)` per Na–Cl completa l’allineamento con `phonon-monatomic` e `phonon-diatomic`.
  - I tooltip `title` in `manifest.ts:65, 71, 77, 83` contengono `v_s`, `v_p`, `v_g`, `ω_max` con underscore in testo semplice HTML.
- **Riferimento dispensa**: §3 p. 9 e §8 p. 23.
- **Correzione proposta**: integrare `1,05×10⁻²⁵ kg ≈ 63,2 u` e `illustrativa 1D` in `.foot` (`strings.ts:142`) e riscrivere i tooltip `title` in `manifest.ts` senza underscore grezzi.

---

## 4. Verdetto finale

**Da correggere.** La fisica dei pacchetti d’onda, le equazioni (10)–(12), i 4 regimi, la copertura degli errori tipici di §12/§6.3, i preset e i test numerici sono pienamente fedeli al corso. Risolto il problema bloccante **B1** (condizionare la nota di bordo zona sul regime ottico anziché mostrare la formula acustica $\omega'' = -a^2\omega_{\max}/4$) e i tre punti importanti **I1–I3** (`\text{ Å}` in `drawMathText`, underscore grezzi in UI/canvas e `(pendenza v/2π)` nelle legende), la sezione sarà pronta per l’approvazione.
