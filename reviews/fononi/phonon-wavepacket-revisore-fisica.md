# Revisione fisica — Sezione 4: Pacchetti d’onda (`phonon-wavepacket`)

**Revisore:** `revisore-fisica`  
**Ambito:** `src/renderer/src/sections/phonon-wavepacket/` e estensione di `src/renderer/src/physics/phononDispersion.ts` e `src/renderer/src/physics/phononDispersion.test.ts`  
**Fonti di riferimento:** `materiale/parte6/dispensa.pdf` (§3.2–§3.3 pp. 8–9, §6 pp. 14–17 e Figg. 7–9, §8.1 p. 21, §12 pp. 29–30) e `materiale/parte6/riferimento-formule.md`.

---

## Problemi trovati (in ordine di gravità)

### Importante

1. **Formula errata di $\omega''$ nella nota al bordo di zona quando è attivo il ramo ottico (`regime === 'optical'`)**
   - **File e righe:** `src/renderer/src/sections/phonon-wavepacket/PhononWavepacketSection.tsx` righe 508–512; `src/renderer/src/sections/phonon-wavepacket/strings.ts` riga 107; `src/renderer/src/physics/phononDispersion.ts` righe 1251–1253.
   - **Cosa è sbagliato:** `wavepacketCharacteristics` imposta `isZoneEdgeStanding = true` a $k_0 = \pm\pi/a$ sia per `'acoustic'` sia per `'optical'` (quando $M \neq m$). Nel pannello `Values` (`PhononWavepacketSection.tsx` righe 508–512), la condizione `{char.isZoneEdgeStanding && <RichText text={v.edgeNote} />}` stampa la stringa `v.edgeNote` (`strings.ts` riga 107):
     > *«Al bordo di zona $k_0 = \pm\pi/a$ si forma un’onda stazionaria ($v_g = 0$, $v_p \neq 0$), ma la curvatura $\omega'' = -a^2\omega_{\max}/4 \neq 0$: il pacchetto resta fermo e si allarga.»*
   - **Formula corretta e riferimento in dispensa:** La relazione $\omega''(\pi/a) = -a^2\omega_{\max}/4 < 0$ vale esclusivamente per il ramo acustico della catena monatomica (§6.3 p. 17: $\omega(k) = \omega_{\max}|\sin(ka/2)| \implies \omega''(\pi/a) = -\frac{a^2\omega_{\max}}{4}$). Sul ramo ottico della catena biatomica (§8.2 p. 22, punto B), al bordo di zona $k_0 = \pm\pi/a$ la dispersione ha invece un **minimo** liscio $\omega_+(\pi/a) = \sqrt{2C/m}$ con curvatura **positiva**:
     $$\omega_+''(\pm\pi/a) = \frac{C a^2}{2 m M \left(\frac{1}{m} - \frac{1}{M}\right)\omega_+(\pi/a)} = +\frac{a^2}{4}\frac{\sqrt{2C/m}}{M/m - 1} > 0.$$
     Per la coppia Na–Cl di riferimento (`DIATOMIC_REF`: $a = 5{,}64\text{ Å}$, $m = 23\text{ u}$, $M = 35{,}5\text{ u}$, $C = 10\text{ N/m}$) il calcolo fisico restituisce $\omega_+''(\pi/a) = +3{,}3484 \cdot 10^{14}\text{ Å}^2/\text{s} = +3{,}35 \cdot 10^{-6}\text{ m}^2/\text{s}$, in contraddizione diretta con la formula negativa stampata nella nota subito sopra il valore numerico.
   - **Come riprodurlo:** Selezionare il regime «Ramo ottico $v_g < 0$» e impostare $k_0 = 1{,}00\,\pi/a$ (o $-1{,}00\,\pi/a$): la voce «Velocità» mostra la nota con $\omega'' = -a^2\omega_{\max}/4$, mentre la riga «Curvatura $\omega''$» immediatamente sotto stampa $+3{,}35 \cdot 10^{-6}\text{ m}^2/\text{s}$.

---

### Minore

1. **Soglie asimmetriche tra `isOriginCusp`/`isVpDivergent` (`k0Frac < 1e-6`) e `wavepacketPhaseVelocity` (`|k| < 1e-12`)**
   - **File e righe:** `src/renderer/src/physics/phononDispersion.ts` righe 1145 e 1225–1226.
   - **Cosa è sbagliato:** `wavepacketCharacteristics` classifica il punto come origine (`atOrigin`) per $|k_0/(\pi/a)| < 10^{-6}$, attivando `isOriginCusp` o `isVpDivergent`, mentre `wavepacketPhaseVelocity` restituisce `null` solo per $|k| < 10^{-12}\text{ Å}^{-1}$. Per $k_0$ molto piccoli ma compresi tra $10^{-12}\text{ Å}^{-1}$ e $10^{-6}\,\pi/a$ (es. $k_0 = 10^{-8}\,\pi/a$), `characteristics` dichiara `isVpDivergent = true` (o `isOriginCusp = true`) ma `vpMs` risulta finito e non `null`.
   - **Impatto / riproduzione:** In UI lo slider ha passo `0.02` e `PhononWavepacketSection.tsx` (righe 465–489) controlla `isOriginCusp`/`isVpDivergent` prima di `vpMs`, quindi il problema non affiora all’utente ma riguarda la coerenza dell’API pura di `phononDispersion.ts`.

2. **Arrotondamento a `0,00 · 10⁻⁶ m²/s` della curvatura vicino al flesso del ramo ottico**
   - **File e righe:** `src/renderer/src/sections/phonon-wavepacket/PhononWavepacketSection.tsx` righe 546–560.
   - **Cosa è sbagliato:** Il controllo che sostituisce il valore con `noSpreading` è `Math.abs(char.omegaSecondAng2S) < 1e-3`, mentre la visualizzazione divide `omegaSecondM2S` per `1e-6` a 2 cifre decimali (`digits={2}`). Sul ramo ottico di `DIATOMIC_REF` esiste un punto di flesso a $k_0 \approx 0{,}7614\,\pi/a$ dove $\omega_+''$ cambia segno; per $k_0 = 0{,}76\,\pi/a$ (valore raggiungibile dallo slider), $\omega_+'' \approx -3{,}6\cdot 10^{-3} \cdot 10^{-6}\text{ m}^2/\text{s}$, per cui viene stampato $\omega'' = -0{,}00 \cdot 10^{-6}\text{ m}^2/\text{s}$ affiancato da un $\tau_{\text{disp}}$ finito.

3. **Finestra temporale nel regime quadratico ridondante (`tMaxS === tTravel`)**
   - **File e righe:** `src/renderer/src/sections/phonon-wavepacket/model.ts` righe 123–124.
   - **Cosa è sbagliato:** L’espressione `Math.min(tTravel, Math.max(1.6 * tauDisp, tTravel))` equivale identicamente a `tTravel` (poiché $\max(a,b) \ge b$). Di conseguenza, nel preset `free-quadratic` ($k_0 = 0{,}50\,\pi/a$, $\sigma_0 = 3{,}0\,a$) si ha $\tau_{\text{disp}} = 9{,}72\text{ fs}$ ma $t_{\max} = t_{\text{travel}} = 3{,}95\text{ fs}$, sicché la curva $\sigma(t)/\sigma_0$ mostra appena un fattore $1{,}08\times$ a fine ciclo. (La scelta appartiene al compromesso tra finestra spaziale di laboratorio e scala di spreading, ma la logica `Math.min/Math.max` suggerisce un intento diverso.)

4. **Comportamento in spazio reale al punto angoloso $k_0 = 0$ nei regimi `linear` e `acoustic`**
   - **File e righe:** `src/renderer/src/physics/phononDispersion.ts` righe 1314–1342; `src/renderer/src/sections/phonon-wavepacket/PhononWavepacketSection.tsx` righe 465–475.
   - **Osservazione:** `wavepacketFieldAt` usa sempre l’espansione gaussiana al secondo ordine attorno a $k_0$ (eqq. 11–12). Per `linear`/`acoustic` a $k_0 = 0$, dove $\omega(k) = v_s |k|$ ha un punto angoloso, $v_g(0) = 0$ e $\omega''(0) = 0$ mantengono il pacchetto animato fermo all’origine senza allargarsi, mentre l’integrale esatto (10) su una gaussiana centrata in $k_0 = 0$ si scinderebbe in due lobi a velocità $\pm v_s$. La nota `originCuspNote` e le due tangenti tratteggiate $\pm v_s$ su `DispersionPlot` chiariscono correttamente i due limiti $k_0 \to 0^\pm$, rendendo l’imprecisione solo didattico-visiva.

5. **Espressione ridondante `isQuad ? 1e3 : 1e3`**
   - **File e riga:** `src/renderer/src/sections/phonon-wavepacket/PhononWavepacketSection.tsx` riga 402.
   - **Nota:** Semplice refuso innocuo (`velScale` vale sempre `1e3` per mostrare tutto in `km/s`).

---

## Cosa ho verificato davvero

1. **Equazioni in `src/renderer/src/physics/phononDispersion.ts` (righe 925–1417) e `formulas.ts`:**
   - Confrontate riga per riga con `materiale/parte6/dispensa.pdf` (§3.2–§3.3, §6 pp. 14–17, §8.1 p. 21, §12 pp. 29–30) e `materiale/parte6/riferimento-formule.md`:
     - Eq. (10)–(12): $\sigma_0 \Delta k = 1/2$ ($\Delta k = s = 1/(2\sigma_0)$), $\gamma = \omega'' t / (2\sigma_0^2) = 2s^2\omega'' t$, $\sigma(t) = \sigma_0\sqrt{1+\gamma^2}$, conservazione della norma $\int |\Psi|^2\,\mathrm{d}x = \sqrt{2\pi}\sigma_0$, termine di chirp $\gamma \xi^2/(4\sigma^2)$ e fase di Gouy $-\frac{1}{2}\arctan\gamma$ in `wavepacketFieldAt` (righe 1314–1342) verificati analiticamente e contro l’integrale di Fourier diretto nel test.
     - Tutte le formule nei 4 regimi (`linear`, `acoustic`, `optical`, `quadratic`), inclusa la derivata seconda analitica $\omega_+''(k)$ del ramo ottico (righe 1175–1192) verificata algebricamente e numericamente via Python su tutta la 1BZ.
2. **Unità e conversioni:**
   - Verificate `Å`, `m/s`, `km/s` (`velScale = 1e3`), `THz`, `meV`, `eV` (`energy0Mev / 1e3` per `quadratic`), `ps`/`fs` (`tMaxS < 5e-13`), `m²/s` (`omegaSecondM2S = omegaSecondAng2S * 1e-20`, diviso `1e-6`), `Å²/s`, costante quadratica $\alpha_q = \hbar/m_0 = 2(\hbar^2/2m_0)/\hbar \approx 1{,}1577\cdot 10^{16}\text{ Å}^2/\text{s} = 1{,}1577\cdot 10^{-4}\text{ m}^2/\text{s}$, e pendenza su `DispersionPlot` tramite `velocityMsToThzAngstrom` ($\text{m/s} \to \text{THz}\cdot\text{Å}$).
   - Verificato l’allineamento dei valori numerici dei riferimenti in `manifest.ts` (`MONATOMIC_REF`: $a = 2{,}50\text{ Å}$, $M = 63{,}2\text{ u}$, $C = 20\text{ N/m}$, $v_s = 3{,}45\text{ km/s}$, $\nu_{\max} = 4{,}39\text{ THz}$; `DIATOMIC_REF` Na–Cl: $a = 5{,}64\text{ Å}$, $m = 23\text{ u}$, $M = 35{,}5\text{ u}$, $C = 10\text{ N/m}$, $\nu_+(0) = 4{,}68\text{ THz}$, $\nu_+(\pi/a) = 3{,}64\text{ THz}$).
3. **Casi limite e tracciamento della cresta:**
   - Verificati $k_0 = 0$ nei 4 regimi, $k_0 = \pm\pi/a$ sul ramo acustico ($v_g = 0$, $v_p = \pm(2/\pi)v_s$, $\omega'' = -a^2\omega_{\max}/4$) e sul ramo ottico ($v_g = 0$, $v_p \neq 0$, $\omega_+''(\pi/a) > 0$, dove è emerso il bug in `v.edgeNote`), nonché la formula della cresta evidenziata in `WavepacketView.tsx` (righe 355–392) incluso il segno positivo del recupero della fase di Gouy `(0.5 * Math.atan(snap.gamma)) / char.k0`.
4. **Test unitari e typecheck:**
   - Eseguito `$env:PATH = "$PWD\.tools\node;$env:PATH"; npm.cmd test`: **22 file di test passati, 202 test passati** (di cui 22 in `src/renderer/src/physics/phononDispersion.test.ts`, inclusi i 4 test `describe('phononDispersion — pacchetti d’onda…')` alle righe 555–765).
   - Eseguito `$env:PATH = "$PWD\.tools\node;$env:PATH"; npm.cmd run typecheck`: terminato con codice 0 senza errori (`tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json`).
   - Eseguito script Python indipendente per il controllo di frequenze, velocità, curvature (incluso il punto di flesso ottico a $k_0 \approx 0{,}7614\,\pi/a$) e scale temporali su tutti e 4 i regimi.

---

## Cosa non ho potuto verificare

- Rendering visivo dal vivo nel browser (`npm run dev:web`) della sezione `PhononWavepacketSection` e delle interazioni su canvas/DPI/ridimensionamento a diverse risoluzioni (di competenza di `critico-grafico`).
- Build completa Electron (`npm run build`).

---

## Verdetto

**da correggere** — la fisica di base in `src/renderer/src/physics/phononDispersion.ts` e i test unitari in `phononDispersion.test.ts` sono corretti, coerenti con la dispensa e numericamente solidi; tuttavia nella UI della sezione (`PhononWavepacketSection.tsx` righe 508–512 e `strings.ts` riga 107) la nota al bordo di zona stampa la formula acustica $\omega'' = -a^2\omega_{\max}/4$ anche quando l’utente seleziona il ramo ottico a $k_0 = \pm\pi/a$ (dove $\omega_+''(\pi/a) > 0$). È sufficiente differenziare la nota al bordo di zona tra ramo acustico e ramo ottico (o scrivere in `edgeNote` una frase valida per entrambi i rami, specificando $\omega'' = -a^2\omega_{\max}/4 < 0$ solo per il ramo acustico e $\omega_+''(\pi/a) > 0$ per il ramo ottico).
