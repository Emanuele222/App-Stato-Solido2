# Revisione Studente — Pacchetti d’onda: fase e gruppo

Revisione condotta sulle 5 schermate a 1440 px (`step_12_shot_1`–`3`, `step_14_shot_1`, `step_19_shot_1`) e sui testi visibili in [`strings.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-wavepacket/strings.ts) e [`formulas.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-wavepacket/formulas.ts).

---

## 1. Spiegazione del concetto in 5 righe

Un pacchetto d’onda localizzato nasce dalla sovrapposizione di onde piane centrate attorno a $k_0$ con larghezza spettrale $\Delta k \sim 1/(2\sigma_0)$: più il pacchetto è stretto nello spazio, più lo spettro in $k$ è largo.
L’onda portante (le creste dentro il pacchetto) avanza alla velocità di fase $v_p = \omega_0/k_0$, pari alla pendenza della corda dall’origine sul diagramma $\nu(k)$, mentre l’inviluppo che trasporta l’energia si muove alla velocità di gruppo $v_g = \mathrm{d}\omega/\mathrm{d}k$, pari alla pendenza della tangente in $k_0$.
In un mezzo lineare ($\omega = v_s|k|$) tutte le componenti hanno la stessa velocità ($v_p = v_g$) e curvatura $\omega'' = 0$, quindi il pacchetto trasla senza allargarsi; nella dispersione quadratica ($\omega \propto k^2$) vale invece $v_g = 2v_p$ e l’allargamento è rapido.
Sul ramo acustico al bordo di zona ($k_0 = \pi/a$) si forma un’onda stazionaria ($\lambda = 2a$) con atomi che oscillano in opposizione di fase e $v_g = 0$, ma poiché la curvatura $\omega''(\pi/a) \neq 0$ l’inviluppo resta fermo sul posto continuando ad allargarsi secondo $\sigma(t) = \sigma_0\sqrt{1 + (\omega'' t / 2\sigma_0^2)^2}$.
Sul ramo ottico ($k_0 > 0$) la curva di dispersione è decrescente: si ottiene $v_g < 0$ con $v_p > 0$, cioè l’inviluppo arretra mentre le singole creste scorrono in avanti al suo interno.

---

## 2. Problemi trovati (ordinati per gravità)

### Bloccante

1. **Formula viva principale troncata sul lato destro (`(x - v_g t)` invisibile)**
   - **Dove:** Pannello *Formula viva* in alto a destra, prima riga, in tutte e 5 le schermate a 1440 px (`step_12_shot_1`–`3`, `step_14_shot_1`, `step_19_shot_1`; testo definito in [`formulas.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-wavepacket/formulas.ts#L29-L30)).
   - **Cosa è successo:** La formula viene tagliata dal margine destro subito dopo `F`: si legge `Ψ(x,t) = 1/√(2π) ∫ Φ(k) e^{i[kx - ω(k)t]} dk ≃ e^{i(k₀x - ω₀t)} F` e sparisce completamente l’argomento `(x - v_g t)`. È proprio il pezzo che fa vedere matematicamente che l’inviluppo `F` viaggia a velocità `v_g`.
   - **Cosa mi avrebbe aiutato:** Andare a capo prima del segno `≃` (oppure ridurre leggermente dimensione/spaziatura della riga) così da leggere tutta l’equazione senza tagli.

### Importante

2. **Codice LaTeX grezzo `\text{ Å}` nella barra di scala sotto gli atomi**
   - **Dove:** Canvas *Spazio reale — pacchetto Ψ(x, t) e atomi*, in basso a sinistra, in tutte le schermate con reticolo (`step_12_shot_1`, `step_12_shot_2`, `step_14_shot_1`, `step_19_shot_1`).
   - **Cosa è successo:** Accanto al segmento di scala compaiono letteralmente i caratteri `a = 2,50 \text{ Å}` (oppure `a = 5,64 \text{ Å}` sul ramo ottico) invece di `a = 2,50 Å`.
   - **Cosa mi avrebbe aiutato:** Renderizzare semplicemente il testo `a = 2,50 Å` senza il comando TeX non interpretato `\text{...}`.

3. **Riferimento opaco `da eq. (20)` e formula della curva mancante nel ramo ottico**
   - **Dove:** Pannello *Formula viva*, quarta riga nella schermata `step_12_shot_2_shot_1440_optical_vg_neg.png` ([`formulas.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-wavepacket/formulas.ts#L50-L51)).
   - **Cosa è successo:** Mentre negli altri tre regimi la riga mostra l’espressione esplicita di $\omega(k)$, per il ramo ottico compare solo `ω₊(k) da eq. (20): v_g < 0, v_p > 0 (k > 0)`. Da studente che apre la simulazione non so cosa sia l’«eq. (20)» della dispensa e non capisco dalla formula perché la pendenza sia negativa. Inoltre la clausola `(k > 0)` resta visibile anche se sposto $k_0 < 0$ (dove i segni si invertono).
   - **Cosa mi avrebbe aiutato:** Mostrare l’espressione di $\omega_+(k)$ (o almeno la relazione biatomica con $\cos(ka)$ sotto radice) invece del rimando esterno «da eq. (20)».

4. **Asse verticale schiacciato (`0–16 THz`) al bordo di zona**
   - **Dove:** Grafico *Dispersione ν(k) = ω(k)/2π* nella schermata `step_14_shot_1_shot_1440_zone_boundary.png`.
   - **Cosa è successo:** A $k_0 = 0,66\,\pi/a$ (`step_12_shot_1`) l’asse $\nu$ arriva a `5 THz` e la curva acustica ($\nu_{\max} = 4,39\text{ THz}$) riempie bene il grafico; appena si passa al bordo di zona ($k_0 = 1,00\,\pi/a$, `step_14_shot_1`), l’asse $\nu$ salta fino a `16 THz` schiacciando l’intero ramo acustico nel quarto inferiore del grafico. Risulta molto meno leggibile sia che la tangente in $\pi/a$ sia orizzontale ($v_g = 0$), sia che la curva abbia curvatura non nulla ($\omega'' \neq 0$).
   - **Cosa mi avrebbe aiutato:** Mantenere il fondo scala verticale attorno a `5–7 THz` (commisurato al ramo acustico e alla retta del suono) come negli altri scenari acustici.

5. **Simboli `s` e `κ` introdotti senza definizione immediata, e ambiguità a `k₀ = 0` sul ramo acustico**
   - **Dove:** Pannello *Formula viva* (`σ₀ = 1/(2s)` in tutte le schermate, [`formulas.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-wavepacket/formulas.ts#L41)), terzo blocco di *Teoria in breve* ([`strings.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-wavepacket/strings.ts#L137)), e tabella valori in `step_19_shot_1_shot_1440_drag_near_k0_0.png`.
   - **Cosa è successo:**
     - In *Formula viva* appare `σ₀ = 1/(2s)`, ma `s` non è definito da nessuna parte nelle formule vive; bisogna scorrere fino al terzo paragrafo della teoria per trovare `Φ ∝ e^{-κ²/4s²}`, dove però neppure `κ` è definito esplicitamente come `κ = k - k₀`.
     - A $k_0 = 0,00\,\pi/a$ sul ramo acustico (`step_19_shot_1`), la sezione *Velocità* spiega correttamente che il modulo $|k|$ ha un punto angoloso («le onde a destra e a sinistra hanno velocità $\pm v_s$»), ma subito sotto la riga *Curvatura $\omega''$* scrive `ω'' = 0 → nessuno spreading (σ(t) = σ₀)` e il grafico $\sigma(t)/\sigma_0$ è piatto a `1`. Da studente mi confonde: se le componenti $k > 0$ vanno a destra e quelle $k < 0$ vanno a sinistra, il pacchetto non dovrebbe sdoppiarsi invece di rimanere indeformato?
   - **Cosa mi avrebbe aiutato:** Definire $\kappa = k - k_0$ e $s = \Delta k$ (oppure omettere `s` dalla formula in alto se non serve allo slider `σ₀`), e aggiungere una breve precisazione per $k_0 = 0$ sul ramo acustico sul fatto che lo sviluppo quadratico di Taylor non si applica al punto angoloso.

### Minore

6. **Pedici con underscore grezzo `_` nei controlli e nelle etichette**
   - **Dove:** Pulsante regime `Ramo ottico v_g < 0`, nota sotto `Scenari (§6)` (`ottico v_g < 0`), e tabella valori (`Velocità (v_p, v_g)`, `τ_disp = 2σ₀²/|ω''|`) in tutte le schermate ([`strings.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-wavepacket/strings.ts#L33), [`strings.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-wavepacket/strings.ts#L102), [`strings.ts`](file:///c:/Users/filip/Documents/App-Stato-Solido/src/renderer/src/sections/phonon-wavepacket/strings.ts#L113)).
   - **Cosa è successo:** Compaiono `v_g`, `v_p`, `τ_disp` con underscore letterale invece dei pedici tipografici usati altrove (`k₀`, `σ₀`). Inoltre l’etichetta del pulsante `Ramo ottico v_g < 0` può trarre in inganno se lo studente porta $k_0$ a valori negativi, dove $v_g > 0$.
   - **Cosa mi avrebbe aiutato:** Usare pedici Unicode/formattati (`vₚ`, `v_g` -> `vᵍ` o `RichText` se supportato, `τdisp`) e chiamare il pulsante semplicemente `Ramo ottico` (lasciando al banner/valori l’indicazione del segno di $v_g$ in base a $k_0$).

7. **Parametro `a = 2,50 Å` esposto nel regime «Particella libera»**
   - **Dove:** Tabella *Regime* (`Particella libera (ω ∝ k²) · a = 2,50 Å`) e slider $k_0, \sigma_0$ in `step_12_shot_3_shot_1440_quadratic.png`.
   - **Cosa è successo:** Sotto il pacchetto si legge `Mezzo continuo (particella libera: nessun reticolo discreto)`, ma nella scheda valori di fianco compare comunque `a = 2,50 Å` e le unità $k_0 = 0,66\,\pi/a$, $\sigma_0 = 3,0\,a$.
   - **Cosa mi avrebbe aiutato:** Indicare brevemente «scala di riferimento $a = 2,50\text{ Å}$» per chiarire che `a` serve solo a confrontare lo stesso $k_0$ e $\sigma_0$ con i fononi, non perché l’elettrone libero abbia un reticolo.

8. **Spettro `|Φ(k)|²` troncato oltre `+π/a` al bordo di zona**
   - **Dove:** Grafico *Dispersione* nell’angolo in basso a destra di `step_14_shot_1_shot_1440_zone_boundary.png`.
   - **Cosa è successo:** Con $k_0 = \pi/a$ metà della campana magenta dello spettro `|Φ(k)|²` esce dal bordo destro del grafico senza spiegare come vengono trattate le componenti oltre $\pi/a$.
   - **Cosa mi avrebbe aiutato:** Una mezza riga di nota (o l’estensione leggera dell’asse oltre $\pi/a$ dove il ramo acustico continua periodicamente con pendenza opposta) per mostrare meglio che in $\pi/a$ c’è il massimo liscio della curva.

---

## 3. Le due cose che hanno aiutato di più a capire

1. **Collegamento grafico immediato tra corda/tangente in $\nu(k)$ e pallini $v_p$ / $v_g$ sul pacchetto (con profilo $t = 0$ tratteggiato):** poter confrontare nello stesso istante la pendenza della corda viola ($v_p$) e della tangente ciano ($v_g$) sul grafico di dispersione con il moto reale della cresta viola ($v_p$) rispetto al centro dell’inviluppo verde ($v_g$) e al profilo iniziale $t = 0$ rende chiarissimo cosa significano velocità di fase e di gruppo, specialmente sul ramo ottico ($v_g < 0, v_p > 0$).
2. **Lo scenario al bordo di zona ($k_0 = \pi/a$) con atomi discreti, curva $\sigma(t)/\sigma_0$ ed errori tipici:** vedere i pallini azzurri degli atomi campionati esattamente in opposizione di fase ($\lambda = 2a$) sotto un inviluppo il cui centro $v_g$ resta fermo sopra al profilo $t = 0$ mentre la campana si abbassa e si allarga ($\sigma(t)/\sigma_0$ crescente) smonta in un colpo solo i due misconcetti più comuni («$v_g = 0$ significa atomi fermi» e «$v_g = 0$ significa niente allargamento»).

---

## 4. Verdetto

**da correggere**

*(Motivo principale: la formula viva centrale è troncata proprio su `F(x - v_g t)` in tutte le schermate, compare `\text{ Å}` non renderizzato sul canvas, l’asse verticale del grafico di dispersione schiaccia la curva a `0–16 THz` al bordo di zona, e sul ramo ottico la formula rimanda a un’«eq. (20)» esterna non visibile nella sezione.)*
