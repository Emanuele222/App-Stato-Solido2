# Incarico Gemini 06 — sezione «Metodo k·p»

**Ruolo: autore di sezione.** Scrivi in `src/renderer/src/sections/k-dot-p/`, in `src/renderer/src/physics/` con i relativi test, la riga di registrazione in `sections/registry.ts` e, per il ritocco qui sotto, in `sections/tight-binding/`. Nient'altro. `ui/`, `viz/` e `sections/nearly-free/` restano di Opus.

## Esito dell'incarico 05
Accettato. Controllato dalla regia a 1200 e a 800×600 px: valori vivi impaginati, etichette con pedici, pillole fuori dal gap, titoli coerenti, catena visibile a 800 px, nessun `Math.` di fisica nella sezione; 94 test su 94.

Un solo ritocco, da fare prima di cominciare: nella legenda del confronto di «Legami forti» compare «V_{G}» con le graffe, perché la legenda di `BandPlot` disegna testo semplice. Scrivi l'etichetta senza sintassi LaTeX. I due difetti che hai segnalato in `BandPlot` (etichetta del gap sbarrata da E_F, etichetta m* sulla curva) sono registrati per chi lavora su `viz/`.

## Fonti
- `materiale/parte4/dispensa.tex`, §3 «Il metodo k·p» (righe 483–826 circa): enunciato, equazione per u_{nk}, massa efficace al secondo ordine, verifica sui quasi liberi, spin–orbita, bande vicino a Γ (formule della slide 41), modello a due bande, esempio di GaAs e InSb, tabella delle masse misurate.
- Formulario della Parte 4, gruppo «k·p».
- `materiale/parte4/verifica_kp.py` mostra come sono calcolati i numeri: leggilo, non eseguirlo.

## Notazione (dalla dispensa)
- u_{n0}, E_n(0), H′_k = ħk·p̂/m₀ + ħ²k²/2m₀.
- E_g gap in Γ; Δ separazione spin–orbita; **P parametro di Kane** (energia × lunghezza, eV·Å); E_P = 2m₀P²/ħ².
- Bande: c (conduzione), hh (lacune pesanti), lh (lacune leggere), so (split-off). Zero delle energie: cima della valenza.
- Questo P non è il P di Kronig–Penney: scrivilo nella scheda teoria, e nei valori vivi chiamalo sempre «P di Kane».

## Cosa deve capire lo studente
1. Vicino a Γ le bande sono quasi parabole e la loro curvatura, cioè la massa efficace, viene dall'accoppiamento k·p̂ con le altre bande: conta di più la banda più vicina.
2. Una banda sopra dà un contributo negativo a 1/m*, una banda sotto un contributo positivo.
3. Gap piccolo, massa piccola: m_c ≃ m₀·E_g/E_P. Un solo parametro, E_P ≈ 20 eV, spiega le masse da InSb a GaAs.
4. Lo spin–orbita separa la cima della valenza p (sei stati) in J = 3/2 (lacune pesanti e leggere, quattro stati) e J = 1/2 (split-off, due stati, più in basso di Δ). La conduzione s non si separa.
5. Le lacune pesanti non si accoppiano alla conduzione e restano pesanti; leggere e split-off si accoppiano e sono leggere.
6. La massa efficace vale solo per k piccolo: il modello a due bande esatto si stacca dalla parabola quando P·k non è più piccolo rispetto a E_g.

## Cosa costruire
- **Due varianti** selezionabili, con passaggio animato:
  - «Quattro bande (Kane)»: c, hh, lh, so con lo spin–orbita, formule della slide 41 come le riporta la dispensa.
  - «Due bande, esatto»: senza spin–orbita, E = ħ²k²/2m₀ + E_g/2 ± √(E_g²/4 + P²k²), più le valenze non accoppiate.
- **Parametri**: E_g, Δ (solo nella prima variante; deve arrivare a zero), E_P. Scegli gli intervalli in modo che contengano tutti i preset e motivali nel rapporto. Valori iniziali: GaAs.
- **Preset** con i dati della dispensa:
  - GaAs: E_g = 1,43 eV, Δ = 0,34 eV. InSb: E_g = 0,18 eV, Δ = 0,82 eV. E_P = 20 eV per tutti.
  - Ge: Δ = 0,29 eV e il gap in Γ che la dispensa riporta (circa 1,1 eV dal calcolo); a schermo va detto che il minimo della conduzione del Ge è in L e che qui si descrive solo l'intorno di Γ.
  - Si: Δ = 0,044 eV. Mettilo solo se trovi nelle dispense il suo gap in Γ; se non c'è, lascialo fuori e scrivilo nel rapporto. Nessun numero preso da altre fonti.
- **Scena, due viste collegate**
  - *Livelli in Γ* (al posto dello spazio reale delle altre sezioni): a sinistra i livelli senza spin–orbita (conduzione s, valenza p sei volte degenere), a destra con lo spin–orbita (J = 3/2 con hh e lh, J = 1/2 split-off più in basso di Δ), collegati da linee come nella figura della dispensa. Ogni livello porta carattere (s o p), J, m_J e numero di stati. Muovendo Δ la separazione si apre in modo continuo da zero. Lo stato scelto sul diagramma evidenzia il livello da cui nasce la sua banda.
  - *Diagramma E(k)* vicino a Γ, k in Å⁻¹ ed E in eV, con E_g e Δ indicati. Scegli la finestra in k in modo che il distacco dalla parabola si veda, e dichiara a schermo che il modello vale solo vicino a Γ.
- **Stato scelto**: clic o trascinamento su una banda e frecce da tastiera, come nelle altre sezioni.
- **Contributi a 1/m\***: per la banda scelta, una barra che scompone m₀/m* nei suoi termini: 1 (elettrone libero) più il contributo di ciascuna banda accoppiata, con segno e colore. Per la conduzione: (2E_P/3)/E_g dalle lacune leggere e (E_P/3)/(E_g + Δ) dalla split-off. Per le lacune pesanti: nessun contributo. È il cuore della sezione.
- **Validità della parabola** (variante a due bande): la parabola di massa efficace sovrapposta alla curva esatta, con evidenziata la zona in cui P·k < E_g/2; la soglia va dichiarata a schermo come criterio indicativo.
- **Formula viva**
  - Generale: E_n(k) ≃ E_n(0) + ħ²k²/2m*, con 1/m* = 1/m₀ + (2/m₀²k²)·Σ_{n′≠n} |⟨u_{n0}|k·p̂|u_{n′0}⟩|² / (E_n(0) − E_{n′}(0)).
  - Kane: E_c, E_hh, E_lh, E_so e le quattro masse come nella dispensa; E_P = 2m₀P²/ħ².
  - Due bande: la matrice 2×2 e i suoi autovalori; lo sviluppo E_c ≃ E_g + ħ²k²/2m₀ + P²k²/E_g.
  - Passando su E_g si evidenzia il gap nelle due viste; su Δ la separazione; su E_P le bande accoppiate alla conduzione.
- **Valori vivi**: E_g, Δ, E_P, P di Kane in eV·Å; m_c, m_hh, m_lh, m_so in unità di m₀; per i preset, accanto a ciascuna massa quella **misurata** dalla tabella della dispensa (per esempio GaAs: calcolata 0,071, misurata 0,067). Stato scelto: k, banda, E, m* locale.
- **Segni e avvertenze da rispettare**
  - Nella variante Kane le valenze hanno il termine libero −ħ²k²/2m₀ (slide 41, Kittel) e m_hh = m₀ è solo un ordine di grandezza; nel modello a due bande le valenze non accoppiate hanno +ħ²k²/2m₀. La dispensa lo dice esplicitamente: riportalo nella scheda teoria, senza «correggere» nessuna delle due.
  - Il segno meno nella formula delle lacune leggere (osservazione sulla slide 41).
- **Strumenti trasversali**
  - Riempimento: qui non c'è un conteggio di elettroni per cella. Lo strumento mostra la situazione di un semiconduttore intrinseco a T = 0 (valenze piene, conduzione vuota, E_F nel gap) con una riga che lo spiega; nessun selettore.
  - Massa efficace: sonda sulla banda; confronto tra la curvatura numerica e la massa della formula. Nella variante a due bande si vede m* crescere allontanandosi da Γ.
  - Confronto: nella variante Kane sovrappone la parabola dell'elettrone libero dal fondo della conduzione; nella variante a due bande sovrappone le parabole di massa efficace.
- **Verifica sui quasi liberi** (aggancio alla sezione pilota): una scheda compatta che applica la formula generale alle bande degli elettroni quasi liberi al bordo di zona, con a = 3 Å e V_G = −0,5 eV: somma su tutte le bande contro curvatura numerica, e valore con le sole due bande m₀/m*± = 1 ± 4E₀/E_g. I numeri si calcolano da `physics/`, non si scrivono a mano.
- **Scheda teoria** breve, dal §3, con «a che cosa serve il metodo». Testi in un file di stringhe della sezione, formule in KaTeX.
- **Registrazione**: in `sections/registry.ts` solo la voce `k-dot-p`.

## Regole
- Tutta la fisica in `physics/` (file `kDotP.ts`, per non confonderlo con Kronig–Penney): bande e masse di Kane, modello a due bande esatto, P da E_P, livelli spin–orbita in Γ, scomposizione dei contributi a 1/m*, formula generale della somma sulle bande con gli elementi di matrice di p̂ tra autostati a onde piane. Le bande escono come `BandStructure`.
- Ogni funzione ha un test. Almeno questi:
  - GaAs (E_g = 1,43, Δ = 0,34, E_P = 20 eV): m_c = 0,0710 m₀, m_lh = 0,0969 m₀, m_so = 0,2098 m₀. InSb (0,18; 0,82; 20): m_c = 0,0122 m₀.
  - P di Kane = 8,729 eV·Å per E_P = 20 eV (ħ²/2m₀ = 3,80998 eV·Å²).
  - Δ → 0: E_c → E_g + ħ²k²/2m₀ + P²k²/E_g (i pesi 2/3 e 1/3 sommano a 1).
  - Due bande: in k = 0 gli autovalori sono E_g e 0; la curvatura numerica in k = 0 dà m₀/m* = 1 ± E_P/E_g; per P·k ≪ E_g la curva esatta coincide con la parabola.
  - Spin–orbita: λL·S vale +½λħ² per J = 3/2 (4 stati) e −λħ² per J = 1/2 (2 stati); Δ = (3/2)λħ²; il baricentro dei sei stati non si sposta.
  - Quasi liberi, a = 3 Å, V_G = −0,5 eV, bordo di zona: la somma su tutte le bande dà m₀/m*₊ = 17,731, uguale alla curvatura numerica di `effectiveMassRatio`; con le sole due bande 1 + 4E₀/E_g.
- Riusa `ui/` e `viz/` così come sono; ciò che manca diventa una vista locale nella cartella della sezione e lo segnali nel rapporto. Per Δ ed E_P usa i colori di grandezza esistenti più adatti e indica nel rapporto quali voci nuove servirebbero in `theme.ts`.
- Stessa struttura di file, stessi pannelli («Formula viva» con i valori sotto, «Scheda teoria»), stessa impaginazione dei valori (`values`) e stessi comportamenti delle altre sezioni. Etichette su canvas con i pedici `_{…}`. Interfaccia in italiano, numeri con la virgola.
- Regge da 800 px in su con tutti gli strumenti attivi, con altezze minime e scorrimento come in «Legami forti». Nessun errore in console.
- Nessuna dipendenza nuova. Niente commit.

## Verifica prima di consegnare
`npm run typecheck`, `npm test`, `npm run build` dopo l'ultima modifica. Verifica visiva obbligatoria a 1440, 1100 e 800 px, nelle due varianti, con tutti gli strumenti attivi e con ogni preset; controlla che le altre sezioni funzionino ancora. Se il browser chiede un permesso, chiedilo all'utente in chat.

## Consegna
`reviews/gemini/06-metodo-kp.md`, con la struttura di `AGENTS.md`, più: funzioni aggiunte a `physics/`, intervalli dei parametri e finestra in k con le motivazioni, preset inseriti e da dove viene ogni numero (riga della dispensa), proposte per `ui/` e `viz/`, difetti noti.
