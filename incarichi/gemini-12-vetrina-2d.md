# Incarico 12 — vetrina 2D: reticolo quadrato e grafene

**Ruolo: autore della sezione «Legami forti in 2D».** È la settima sezione del capitolo «Teoria delle bande», subito dopo «Legami forti». Un solo autore, modalità normale, niente squadra. Leggi prima `AGENTS.md`, `progetto.md` e, come riferimento di qualità, le sezioni `tight-binding/` e `pseudopotential/`.

Fonte, da seguire per notazione e numeri: `materiale/parte4/dispensa.tex`
- reticolo quadrato: §1.4, r. 223–283 (banda s, `E = Ē_s − 2t(cos k_x a + cos k_y a)`);
- grafene: §6, r. 1733–1775 (reticolo e zona), r. 1834–1900 (bande π e π*, cono di Dirac, densità degli stati), r. 1901–1950 (massa efficace).

Non eseguire gli script Python di `materiale/`.

## Permessi, solo per questo incarico

| Percorso | Cosa puoi fare |
|---|---|
| `package.json`, `package-lock.json` | **Installare `three` e `@types/three`** (ultima versione stabile; la seconda come dipendenza di sviluppo). L'utente ha dato il permesso per questa libreria e solo per questa: niente `react-three-fiber`, niente altre. |
| `src/renderer/src/physics/tightBinding2d.ts` e il suo test; una riga in `physics/index.ts` | Tutta la fisica nuova |
| `src/renderer/src/sections/tight-binding-2d/` (nuova) | Tutto |
| `src/renderer/src/viz/` | Un componente nuovo per la superficie 3D, se lo scrivi riusabile; non modificare i file esistenti |
| `sections/registry.ts` | Una voce e la sua importazione, dopo `tight-binding` |
| `src/renderer/src/strings.ts` | Titolo della sezione; «6 sezioni» → 7 nella nota in fondo alla barra |
| `home/` (`curves.ts`, il suo test, `strings.ts`, e i componenti solo se serve) | Settima voce dell'anteprima e conteggio «7 sezioni» |

Non toccare le altre sezioni, `ui/` (se ti serve una modifica, descrivila nel rapporto), `App.tsx`, `ui/shell.tsx`, `materiale/`. Niente commit.

## Cosa deve capire lo studente
1. In due dimensioni E(k) è una **superficie**, non una curva: i diagrammi lungo Γ–X–M–Γ sono tagli di quella superficie.
2. Reticolo quadrato: una sola banda larga 8t; a metà riempimento la linea di Fermi è un quadrato.
3. Grafene: due bande che si toccano nei vertici K e K′ della zona; lì la dispersione è un **cono**, la densità degli stati è nulla in E_F, e la massa definita dalla curvatura non ha senso.

## Fisica (`physics/tightBinding2d.ts`, funzioni pure con test)

**Reticolo quadrato**, passo a, un orbitale s per atomo:
- `E(k) = Ē_s − 2t (cos k_x a + cos k_y a)`, con lo zero in Ē_s.
- Γ = (0,0): −4t; X = (π/a, 0): 0; M = (π/a, π/a): +4t; larghezza 8t.
- Fondo della banda: m* = ħ²/(2ta²), isotropa.
- Riempimento con N = 1 elettrone per cella: E_F = Ē_s e linea di Fermi |k_x| + |k_y| = π/a. Con N = 2 la banda è piena.

**Grafene**, a = 2,46 Å, a_CC = a/√3 = 1,42 Å, vettori a₁, a₂, b₁, b₂ come nella dispensa (r. 1737–1742):
- `f(k) = Σ_i e^{i k·δ_i}` sui tre primi vicini, `E_± = ± t |f(k)|` (π*: +, π: −), zero in Ē_p. Scegli i δ_i coerenti con a₁, a₂ della dispensa e scrivili nel rapporto.
- Γ: ±3t; M: ±t; K e K′ (tutti e sei i vertici): 0. |ΓM| = 2π/(√3a), |ΓK| = 4π/(3a).
- Vicino a K: `E_± = ± ħ v_F |q|`, `v_F = 3 t a_CC / (2ħ)`; con t = 2,8 eV, v_F = 9,1·10⁵ m/s ≈ c/330.
- Densità degli stati per unità di area vicino a E_F: `g(E) = 2|E| / (π ħ² v_F²)` (spin e valle inclusi); picchi in ±t dai punti M. Calcolo numerico di g(E) su tutta la banda.
- Massa alternativa (r. 1911–1930): `m̃ = ħ² k (dE/dk)⁻¹ = ħ q / v_F`, che va a zero in K; la massa dalla curvatura lì diverge. Usa la soglia e il formato unici già esistenti (`isEffectiveMassDivergent`, `formatEffectiveMassRatio`).

**Test obbligatori**: i valori in Γ, X, M (quadrato) e in Γ, M, K (grafene); f = 0 in tutti e sei i vertici; pendenza vicino a K uguale a (3/2)·a_CC·t entro l'1 %; v_F = 9,1·10⁵ m/s per t = 2,8 eV; E(k + G) = E(k) per i vettori reciproci; g(E) numerica uguale alla formula lineare entro il 2 % fino a 0,3 eV e con integrale su una banda pari a 2 stati per cella; linea di Fermi del quadrato a metà riempimento; m* al fondo del quadrato.

## Scena

Tre viste collegate, come nelle altre sezioni:

1. **Superficie E(k_x, k_y)** — vista principale, in 3D con `three`.
   - Sopra la prima zona di Brillouin (quadrato; esagono per il grafene), con il contorno della zona nel colore del passo reticolare e i punti Γ, X, M oppure Γ, M, K, K′ etichettati.
   - Stile lavagna: materiale senza illuminazione (niente riflessi, ombre o bagliori), superficie nel colore dell'energia con linee di livello nette; per il grafene π e π* distinguibili. Colori solo da `ui/theme.ts`.
   - Si ruota trascinando, si ingrandisce con la rotella, si muove anche da tastiera (frecce, + e −); pulsante «Vista iniziale». Per il grafene un pulsante «Vai a K» porta la camera sul cono.
   - Il cammino Γ–X–M–Γ (o Γ–M–K–Γ) è disegnato sulla superficie; lo stato scelto è un punto sulla superficie. Un clic sulla superficie sceglie lo stato.
   - Disegno **solo quando cambia qualcosa** (nessun ciclo continuo a riposo); risorse grafiche liberate all'uscita dalla sezione; se WebGL non è disponibile compare un messaggio e le altre due viste funzionano lo stesso.
2. **Bande lungo il cammino** — canvas 2D nello stile di `BandPlot`: Γ–X–M–Γ per il quadrato, Γ–M–K–Γ per il grafene. Per il grafene, di fianco, la striscia della densità degli stati g(E) sullo stesso asse dell'energia. Clic o trascinamento scelgono lo stato, che si muove anche sulla superficie.
3. **Spazio reale** — canvas 2D: il reticolo con la cella primitiva e i vettori a₁, a₂; per il grafene atomi A e B distinti e i tre vettori δ_i.

**Comandi** (al massimo due righe): reticolo (Quadrato | Grafene); t (quadrato: 0,2–3 eV, iniziale 1,0; grafene: iniziale 2,8); a (solo quadrato, 2–5 Å, iniziale 3,0; nel grafene a = 2,46 Å è fisso e mostrato); elettroni per cella (solo quadrato: 1 o 2).

**Strumenti** (tutti spenti all'apertura, come nelle altre sezioni):
- *Riempimento*: piano E_F semitrasparente nel colore di E_F e linea di Fermi dove taglia la superficie. Grafene: E_F in K, il suggerimento spiega che la banda π è piena (2 elettroni π per cella) e che il grafene è un semimetallo.
- *Massa efficace*: quadrato, paraboloide osculatore al fondo con m* = ħ²/(2ta²); grafene, i due valori a confronto nello stato scelto: massa dalla curvatura («→ ∞ (flesso)» sul cono) e m̃ = ħq/v_F.
- *Confronto*: grafene, cono di Dirac ±ħv_F|q| sovrapposto attorno a K, per vedere fin dove vale; quadrato, la parabola dell'elettrone libero con m₀ dal fondo della banda.

**Formula viva**, con i colori del tema (t → `t`, a → `a`, k e q → `k`, E → `E`, v_F → `v`, E_F → `EF`) e collegata ai comandi nei due sensi come nella pilota:
- quadrato: `E(k) = Ē_s − 2t (cos k_x a + cos k_y a)`;
- grafene: `E_± = ± t |f(k)|`, `f(k) = Σ e^{i k·δ_i}`; `E_± = ± ħ v_F |q|`, `v_F = 3 t a_CC / 2ħ`.

**Valori**: energie in Γ, X, M (o Γ, M, K) e larghezza; stato scelto (k, E); per il grafene v_F in m/s e come frazione di c, g(E_F) = 0; con gli strumenti accesi E_F e le masse.

**Scheda teoria**: breve, sul modello delle altre, con i tre messaggi di «Cosa deve capire lo studente» e il rimando a «Legami forti» (stessa equazione, catena biatomica con E_A = E_B → nessun gap) come fa la dispensa (r. 1852–1860). Nessun riferimento a slide o a nomi di file.

## Regole
- Tutta la fisica in `physics/`; i componenti disegnano soltanto.
- `three` va caricato **solo quando si apre questa sezione** (importazione dinamica dentro la sezione, pezzo di codice separato nella build): l'avvio dell'app e la schermata iniziale non devono rallentare. Riporta il peso del file principale prima e dopo (oggi circa 1,67 MB) e quello del pezzo nuovo.
- La regola di sicurezza in `src/renderer/index.html` (`script-src 'self'`) non va allentata.
- Italiano, virgola decimale, nomi e simboli della dispensa.
- Da 1100×800 in su nessuno scorrimento; a 800×700 può scorrere solo la colonna centrale. Altezze minime a 1100×800: superficie 300 px, le altre due viste 150 px.
- Legende fuori dai grafici (`viz/ChartLegend.tsx`); etichette che non coprono curve.
- Con «riduci movimento» attivo, nessuna animazione della camera.
- Nessun errore in console.

## Schermata iniziale
- «6 sezioni» diventa «7 sezioni» (testo, etichetta accessibile, nota in fondo alla barra laterale).
- L'anteprima scorre sette metodi: aggiungi, dopo «Legami forti», le bande del grafene lungo Γ–M–K–Γ calcolate da `physics/tightBinding2d.ts`. Aggiorna il test di `home/curves.ts`. L'elenco deve restare dentro il riquadro (oggi 356 px).

## Verifica prima di consegnare
- `npm run typecheck`, `npm test`, `npm run build` dopo l'ultima modifica.
- Verifica visiva a 1440×900, 1100×800 e 800×700, in entrambi i reticoli, con tutti gli strumenti accesi; guarda le schermate una per una.
- Controlla che ruotando la superficie il punto dello stato scelto e il cammino restino al loro posto, che il clic sulla superficie scelga lo stato giusto, e che uscendo e rientrando nella sezione più volte non restino risorse aperte né compaiano avvisi in console.
- Prova la sezione nella **finestra Electron** (`npm run dev`): è la prima parte dell'app che usa WebGL. Se non riesci ad avviarla, scrivilo tra le cose non verificate.
- Le altre sei sezioni e la schermata iniziale funzionano come prima.

## Consegna
`reviews/gemini/12-vetrina-2d.md`, con la struttura di `AGENTS.md`, più: versione esatta di `three` installata; pesi della build prima e dopo; i vettori δ_i scelti; tabella dei valori calcolati contro quelli della dispensa; altezze misurate delle viste alle tre finestre; cosa non hai potuto verificare.
