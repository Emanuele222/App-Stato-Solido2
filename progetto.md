# App interattiva di Fisica dello Stato Solido — documento di progetto

## Contesto
Applicazione desktop locale per studenti universitari di fisica dello stato solido, ispirata a PhET ma con grafica moderna. Progetto universitario con scadenza inferiore a un mese. Lo studente deve *capire* i concetti: l'app collega in modo esplicito formule, parametri e visualizzazioni. Questa fase è di sola progettazione; lo sviluppo parte solo su via libera dell'utente.

## Decisioni di prodotto
| Tema | Decisione |
|---|---|
| Piattaforme | macOS, Windows, Linux (desktop, offline) |
| Struttura | Capitoli → sezioni; ogni sezione ha un'esperienza su misura |
| Didattica | **Formule vive**: la formula accanto alla scena, legata a parametri e oggetti grafici |
| Teoria | Schede contestuali brevi (testo + formule); niente manuale completo |
| Stile | "Lavagna animata" alla 3Blue1Brown: fondo scuro piatto, linee nette, animazioni fluide |
| Materiali | Parametri liberi + preset di materiali reali |
| Passo-passo, sfide, quiz | Esclusi dalla prima versione |
| Lingua | Italiano, predisposta per l'inglese |
| Notazione e contenuti | Quelli delle dispense dell'utente (Parte 3 e Parte 4, in `materiale/`), che già uniformano le slide del corso |
| Prima versione | Capitolo **Teoria delle bande** completo: 6 metodi + 3 strumenti trasversali |

## Struttura dell'app
- **Schermata iniziale**: griglia regolare di cinque riquadri uguali, uno per capitolo; nessuna sezione elencata. «Teoria delle bande» è attivo: miniatura a bande disegnata dal codice che, con il cursore fermo sopra per 2 secondi, scorre i sei metodi con le bande vere ed elenca le sezioni; il clic porta alla prima sezione. Cristallografia, Reticolo reciproco e diffrazione, Fononi e Semiconduttori sono attenuati, con uno schizzo fermo e l'etichetta «in arrivo», non cliccabili. Dentro una sezione, il nome dell'app nella barra laterale riporta alla schermata iniziale. Incarico: `incarichi/gemini-08-schermata-iniziale.md`.
- **Schermata di sezione** (layout base, adattabile):
  - sinistra: barra capitoli/sezioni
  - centro: scena 2D/3D; sotto, i parametri (slider + menu preset materiali)
  - destra: formula viva in alto, scheda teoria sotto

## Capitolo 1 — Teoria delle bande
Fonte: dispense Parte 3 (§§9–13) e Parte 4 (§§1–6). Scena tipo: **spazio reale** (potenziale, atomi, |ψ|²) collegato al **diagramma E(k)**; click su un punto della banda → stato di Bloch corrispondente. Unità: Å ed eV, con ħ²/2m₀ = 3,81 eV·Å².

Le sezioni seguono l'ordine e i nomi del corso.

| Sezione (dispense) | Cosa si vede | Parametri | Formula viva |
|---|---|---|---|
| **Reticolo vuoto e schemi di zona** (P3 §9, P4 §5.1) | Parabola libera ripiegata nella prima zona; i tre schemi: zona estesa, ridotta, periodica | a | E = ħ²(k+G)²/2m₀, G = 2πn/a |
| **Kronig–Penney** (P3 §10) | Due varianti: a delta e a barriere rettangolari. Curva f(αa) o L(E) con la fascia ±1 che separa bande e gap. Ogni banda con il suo livello «genitore» della buca finita | delta: P; rettangolare: buca b, barriera c, altezza V₀ | cos ka = cos αa + P·sin αa/αa; L(E) = cos ka |
| **Elettroni quasi liberi** (P3 §11) | Gap 2\|V_G\| in ±π/a e 2\|V_2G\| in k = 0; onde stazionarie ψ_c e ψ_s rispetto agli ioni; pesi c_G delle onde piane | a, V_G, V_2G | E± = ½(E_k+E_k′) ± [¼(E_k′−E_k)² + V_G²]^½; al bordo E± = E₀ ± \|V_G\| |
| **Legami forti** (P3 §12, P4 §§1–2) | Catena di atomi: bande s e p con curvature opposte, larghezza W = 4\|t\|; i livelli atomici si allargano in bande avvicinando gli atomi. Catena biatomica A–B: un semiconduttore in 1D | Ē_s, Ē_p, t_s, t_p; biatomica: E_A, E_B, t | E = Ē − 2t·cos ka; E± della biatomica, E_g = E_B − E_A |
| ↳ vetrina 2D (P4 §1.4, §6) | Superficie E(k) navigabile in 3D: reticolo quadrato e grafene (bande π e π*, coni di Dirac in K, t = 2,8 eV) | t, riempimento | E = ±t\|f(k)\|; E = ±ħv_F\|q\| |
| **Metodo k·p** (P4 §3) | (a) Livelli in Γ: la valenza p separata dallo spin–orbita in J = 3/2 (lacune pesanti e leggere) e J = 1/2 (split-off). (b) Bande c, hh, lh, so vicino a Γ. (c) Modello a due bande esatto contro le parabole: dove smette di valere la massa efficace | E_g, Δ, E_P; preset GaAs, InSb, Ge, Si | m₀/m_c = 1 + (E_P/3)(2/E_g + 1/(E_g+Δ)); a due bande m₀/m_c ≃ 1 + E_P/E_g |
| **Pseudopotenziale** (P4 §4, §5.4) | (a) Ione nudo −1/r contro pseudopotenziale soft core / hard core con raggio r_c; funzione vera che oscilla nel core contro parte liscia ψᶠ. (b) Fattore di forma v(q) con i punti V₃, V₈, V₁₁. (c) Bande vere lungo L–Γ–X–W–K–Γ, con gap diretto o indiretto evidenziato | V₃ˢ, V₈ˢ, V₁₁ˢ in Ry, a; preset Si, Ge, GaAs | [p̂²/2m₀ + V_ps]ψᶠ = E(k)ψᶠ; V_ps = V + V′ |

**Divisione decisa dall'utente (incarico 13)**: la riga «Pseudopotenziale» diventa due sezioni. «Pseudopotenziale» (P4 §4) su un modello 1D esatto con stato di core: bande di core e di valenza, ψ_c, ψ_k vera e parte liscia ψᶠ, pesi |c_G|², con le due non unicità come comandi (f sul proiettore di core, α sulla pseudo-funzione). «Bande dei materiali veri» (P4 §5) con il motore 3D esistente e i preset Al (reticolo vuoto, 3 o 1 elettrone per cella), Si, Ge, GaAs. La densità degli stati 3D resta fuori.

Collegamenti tra sezioni che le dispense rendono espliciti e che l'app deve mostrare:
- **Quasi liberi → pseudopotenziale**: stessa equazione centrale, cambia solo il potenziale («quasi liberi con V_ps al posto di V»). Un unico motore di calcolo.
- **Kronig–Penney → legami forti**: con barriere spesse le bande diventano a coseno, E = Ē − 2t·cos ka.
- **k·p → massa efficace**: la sonda di massa efficace può mostrare i contributi delle bande vicine a 1/m* (verifica delle dispense: a = 3 Å, V_G = −0,5 eV → m₀/m*₊ = 17,73).

Preset con dati completi nelle dispense: Si e Ge (solo fattori simmetrici), GaAs (anche antisimmetrici V₃ᵃ = 0,068, V₄ᵃ = 0,066, V₁₁ᵃ = 0,012 Ry). Per GaP, InAs, InSb, ZnSe e CdTe la tabella dà solo i simmetrici: restano fuori finché non si recuperano gli antisimmetrici. Nei modelli 1D i preset sono indicativi (passo reticolare e gap reali).

**Strumenti trasversali** (attivabili sul diagramma E(k) di ogni metodo):
- **Riempimento** (P4 §5.6): elettroni per cella → livello di Fermi, stati occupati; n_val dispari → metallo, pari con gap assoluto → isolante.
- **Sonda di massa efficace** (P3 §13): punto trascinabile sulla banda → parabola osculatrice, m* = ħ²/(d²E/dk²), v = (1/ħ)·dE/dk, lacune con m_h = −m*.
- **Confronto**: sovrappone le bande di un secondo metodo sullo stesso grafico.

## Notazione (dalle dispense)
| Grandezza | Simbolo |
|---|---|
| Massa dell'elettrone libero | m₀ |
| Energia vera in funzione di k | E(k), E_n(k) |
| Parabola libera ħ²k²/2m₀ | E_k (mai ε_k) |
| Energia libera al bordo, ħ²π²/2m₀a² | E₀ |
| Vettori del reticolo reciproco | G (1D: G = 2πn/a) |
| Coefficienti di Fourier del potenziale | V_G, V_2G; media V̄ |
| Peso dell'onda e^{i(k+G)x} | c_G |
| Bande al bordo di zona | E± = E₀ ± \|V_G\|, con E₊ sempre la superiore |
| Onde stazionarie al bordo | ψ_c (coseno), ψ_s (seno) |
| Gap | E_g |
| Kronig–Penney | k vettore di Bloch; α = √(2mE)/ħ; β = √(2m(V₀−E))/ħ; buca b, barriera c, a = b + c; P = m·a²·V₀/ħ² |
| Legami forti | φ_n orbitale atomico; t(R) integrale di sovrapposizione (t > 0 per orbitali s); Ē_n centro della banda; W larghezza; M orbitali, N celle |
| Catena biatomica | E_A < E_B; coefficienti b_A, b_B |
| Semiclassico | m*, m_h = −m*, velocità v, campo elettrico 𝓔 (non E) |
| k·p | u_{n0}; H′_k; P parametro di Kane; E_P = 2m₀P²/ħ²; Δ separazione spin–orbita; zero delle energie = cima della valenza |
| Pseudopotenziale | V potenziale vero; V′ repulsivo; V_ps = V + V′; ψᶠ parte liscia; stati di core ψ_c; OPW χ_k con coefficienti β_c; fattori di forma V₃ˢ, V₈ˢ, V₁₁ˢ in Ry |
| Grafene | a₁, a₂ (diretto), b₁, b₂ (reciproco), δ_i primi vicini, a_CC, v_F |
| Unità | SI; Å ed eV nei numeri; ħ²/2m₀ = 3,80998 eV·Å²; Ry = 13,6057 eV |

Simboli che si ripetono con significati diversi, da tenere separati per sezione: P (Kronig–Penney e Kane), ψ_c (onda stazionaria a coseno e stato di core), E₀ (energia al bordo; nelle slide anche gap diretto, che qui è E_g(Γ)).

Correzioni da portare dal mockup all'app: ε_k → E_k; m → m₀; E_gap → E_g; mostrare E₀; lo slider V_G oggi è il modulo, mentre nelle dispense V_G ha il suo segno (negativo per ioni attrattivi); titoli «Elettroni quasi liberi» e «Legami forti».

## Design visivo
- Fondo scuro piatto, nessun bagliore o effetto 3D decorativo; linee sottili e nette, griglie appena accennate.
- **Un colore = una grandezza fisica**, uguale in formula, scena, slider e grafici (es. a azzurro, k giallo, E verde, V corallo, t viola). Tabella colori unica per tutta l'app.
- Tipografia: sans pulita per l'interfaccia, matematica in stile LaTeX.
- Ogni cambio di parametro è una transizione interpolata, mai uno scatto.

## Meccanismo delle formule vive
- **Registro dei parametri** per sezione: id, simbolo, colore, unità, intervallo, valore.
- I termini della formula (KaTeX, estensioni `\htmlData`/`\htmlClass`) portano l'id del parametro.
- Hover su un termine → si evidenziano l'oggetto in scena e lo slider corrispondenti.
- Trascinando uno slider → il termine pulsa e sotto la formula scorre il valore numerico aggiornato.

## Architettura (Electron + TypeScript)
- **Shell**: Electron (finestra, menu, preferenze salvate); interfaccia React + Vite.
- **`physics/`** — TypeScript puro, senza UI, con test:
  - solver a onde piane (equazione centrale) in 1D e 3D: serve reticolo vuoto, quasi liberi e pseudopotenziale. Per il GaAs la matrice è hermitiana complessa (fattori antisimmetrici), quindi serve un diagonalizzatore hermitiano
  - Kronig–Penney analitico (delta e rettangolare), legami forti 1D/2D e catena biatomica, formule k·p
  - tipo comune `BandStructure` (cammino in k + energie + autostati) → rende possibili confronto e strumenti trasversali
- **`viz/`** — componenti grafici riusabili: `BandPlot` (Canvas 2D), `RealSpaceView`, `Surface3D` (Three.js), `LiveFormula` (KaTeX).
- **`sections/`** — ogni sezione è un modulo: manifest (titolo, parametri, preset), scena, formule, scheda teoria in Markdown + LaTeX.
- **`ui/`** — design system: slider, pannelli, tabella colori, temi.
- Stato per sezione in uno store (Zustand); calcoli pesanti (pseudopotenziale, superfici 2D) in Web Worker.
- Distribuzione: electron-builder → dmg, exe, AppImage.
- Versioni delle librerie da fissare e verificare all'avvio dello sviluppo.

## Qualità: agenti revisori e Gemini
**Ruoli**: Fable fa la regia e non scrive codice: tiene il progetto, scrive le istruzioni di lavoro per ogni compito, coordina i revisori e controlla il risultato. Il codice lo scrivono **Opus** (avviato da Fable) e, dalla sezione successiva alla pilota, un modello Google in **Antigravity** (avviato dall'utente, con l'incarico scritto da Fable). Regola fissa: **un solo autore per sezione**, mai due autori sugli stessi file nello stesso momento. I revisori leggono e giudicano, non modificano. Ogni revisore consegna un rapporto con i problemi ordinati per gravità; l'autore della sezione corregge; sui disaccordi decide l'utente.

Eccezione già avvenuta: `mockup-quasi-libero.html` è stato scritto da Fable prima di questa regola. È un riferimento di stile, non codice dell'app.

| Revisore | Cosa guarda | Cosa giudica |
|---|---|---|
| `revisore-fisica` | `physics/`, formule delle sezioni, test | Correttezza, unità, casi limite, confronto con risultati analitici |
| `fedelta-corso` | Dispense in `materiale/` + schede teoria e formule | Notazione, definizioni e contenuti coincidono con le dispense |
| `studente` | Schede teoria + app in esecuzione | Chiarezza; la sezione fa capire il concetto? Cosa resta oscuro? |
| `critico-grafico` | App in esecuzione (schermate) | Leggibilità, coerenza colore = grandezza, stile lavagna, fluidità |
| Revisione codice | Modifiche al codice | `/code-review` già integrato |

- Gli agenti sono file di testo in `.claude/agents/*.md` (ruolo, criteri, strumenti in sola lettura): leggibili e modificabili dall'utente.
- **Cadenza**: a fine di ogni sezione. Una sezione è "fatta" quando i test di fisica passano e nessun rapporto contiene problemi gravi. I quattro revisori girano in parallelo (consumano quota: si possono ridurre per modifiche piccole).
- **Gemini (Antigravity)**: revisore indipendente sulla stessa cartella di progetto. Dà un secondo parere su fisica e codice e reimplementa da zero i calcoli chiave in `crosscheck/` per il confronto numerico. Come revisore scrive solo in `reviews/gemini/` e `crosscheck/`. Come autore di una sezione scrive solo nella cartella di quella sezione, più eventuali aggiunte a `physics/` con i loro test, riusando i componenti di `ui/` e `viz/` senza riscriverli. Legge le regole da `AGENTS.md`. Codice e dispense passano così per i servizi Google.
- **Apprendimento**: "imparo facendo". Alla creazione di ogni agente spiego cosa contiene il file, perché quel ruolo e come leggere il rapporto. Il primo agente si costruisce insieme sulla sezione pilota.

## Roadmap
0. **Consolidamento (senza codice)**:
   - fatto: mockup della schermata tipo (`mockup-quasi-libero.html`), da validare con l'utente;
   - fatto: Antigravity legge le istruzioni di progetto da `AGENTS.md`, `GEMINI.md` o `.agents/rules/*.md` nella cartella di lavoro (documentazione ufficiale); useremo `AGENTS.md` nella radice;
   - fatto: dispense ricevute ed estratte in `materiale/parte3` e `materiale/parte4`; notazione e contenuti di tutte le sezioni fissati su quelle;
   - da fare: scegliere cartella di progetto e nome dell'app.
1. **Scheletro + sezione pilota** — fatto (Opus): shell, design system, formula viva, `BandPlot`; sezione *Elettroni quasi liberi* come riferimento di qualità.
2. **Metodi classici** — fatto (Gemini, incarichi 02–05): reticolo vuoto e schemi di zona, Kronig–Penney, legami forti 1D con catena biatomica, i tre strumenti trasversali.
3. **Vetrina 2D** — incarico 12 eseguito e verificato: **fisica accettata, grafica da riparare** (incarico 15 scritto, da lanciare). Il 12 e il 13 sono stati eseguiti in parallelo e l'autore del 12 non ha mai potuto aprire la sezione: superficie 3D alta 5–38 px, scheda «In breve» composta come formula, inquadratura che non mostra il cono di Dirac. Settima sezione «Legami forti in 2D» (reticolo quadrato e grafene) con superficie E(k) in 3D; l'utente ha dato il permesso di installare `three` (e `@types/three`), caricata solo all'apertura della sezione.
4. **k·p e pseudopotenziale** — fatto (Gemini, incarichi 06–07).
5. **Revisione** — fatta: quattro rapporti in `reviews/gemini/revisione-A…D`. Nessun errore nelle equazioni di fondo; correzioni raccolte in due incarichi: 09 (fisica e contenuti) e 10 (grafica e componenti comuni), entrambi eseguiti e verificati. Il 09 è accettato (137 test verdi); il preset Ge dello pseudopotenziale è rimasto fuori perché i fattori della dispensa danno gap diretto in Γ (0,91 eV) invece che indiretto in L; per scelta dell'utente entra con l'incarico 11, con i fattori locali di Cohen–Bergstresser (−0,23; 0,01; 0,06 Ry: minimo in L a 0,95 eV), dichiarati a schermo come esterni alla dispensa. Del 10 restano difetti di impaginazione, soprattutto in Pseudopotenziale e k·p sotto 1440 px: raccolti nell'incarico 11 (correzioni residue), eseguito e verificato: 138 test verdi, nessuno scorrimento da 1100×800 in su, Ge a 0,95 eV indiretto in L. Residui minori per la rifinitura: comandi dei Legami forti su quattro righe sotto 1440 px; variabile `--lineStrong` scritta male in `home/home.css:227` e `ui/ui.css:105` (quella giusta è `--line-strong`); avviso di KaTeX per l'apostrofo tipografico dentro le formule in `empty-lattice/strings.ts` e `nearly-free/strings.ts`; fattori del Ge non controllati sull'articolo originale.
6. **Schermata iniziale** — fatta (Gemini, incarico 08) e verificata; i quattro ritocchi dell'incarico 10 sono fatti, riquadri bloccati di nuovo attenuati con l'incarico 11.
6 bis. **Divisione di «Pseudopotenziale»** — incarico 13 eseguito: le sezioni sono otto; fisica corretta (typecheck, 159 test e build verdi), «Bande dei materiali veri» verificata: numeri giusti (Al 11,65 e 5,60 eV; Si 0,82, Ge 0,95, GaAs 1,93 eV), ma la vista dei pesi per guscio è vuota (canvas alto 0 px), il fattore di forma è alto 95 px a 1100×800 e a 800×700 le bande sono alte 16 px: riparazioni nell'incarico 15. Giudizio dell'utente su «Pseudopotenziale»: ψ di core poco visibile, manca l'intuizione del perché il metodo funziona. La regia conferma (ψ_c punteggiata nel colore di V, α = 0 all'apertura, ψᶠ normalizzata, spazio reale 270×159 px, `smoothestAlpha` che diverge sugli stati dispari). **Incarico 14 eseguito (27/11) e accettato con riserve** (verifica indipendente con un subagente Sonnet): spazio reale come vista principale in tre fasce, apertura in Γ sulla banda 1, parte liscia con criterio sempre finito, 11 onde contro 3, lettura guidata in tre passi; fisica ricalcolata da zero, 206 test verdi. Riserva principale: il modello ha un solo stato di core, pari, e la sezione disegna solo la parte pari di ψ_k; lontano da Γ la parte dispari domina nel core e il vantaggio delle onde piane sparisce (0,2π/a: 11 contro 11). **Incarico 16 eseguito (27/11) e accettato con riserve**: parte pari e dispari di ψ_k, testi condizionati, segno continuo lungo le bande, f esatto, passo 3 sulle onde piane, toni; 222 test verdi. **Incarico 17 scritto, da lanciare prima del 15**: solo testi e CSS (passo 1 negli stati quasi dispari, riga della vista «Tutto» che a 1100×800 va a capo e porta lo spazio reale a 294 px, articoli davanti ai numeri, fondo del grafico dell'errore).
6 ter. **Capitolo Fononi** — di un compagno di corso (commit del 22–23/11): registro a più capitoli, sezione «Catena monatomica e prima zona» fatta, altre cinque annunciate. Il 23/11 il lavoro non salvato degli incarichi 12–15 è stato messo da parte da GitHub Desktop al pull e ripristinato sopra il suo (6 conflitti risolti tenendo entrambe le parti; 178 test e build verdi). Regola: commit prima di ogni pull.
7. **Rifinitura e pacchetti** per i tre sistemi — da fare; la finestra Electron con le sezioni non è ancora stata provata.

Capitoli successivi (fuori dalla prima versione): Cristallografia, Reticolo reciproco e diffrazione, Fononi, Semiconduttori.

## Verifica
- **Fisica** (test automatici su `physics/`): V→0 riproduce il reticolo vuoto; gap quasi liberi = 2|V_G|; Kronig–Penney con P→0 dà l'elettrone libero e con P→∞ dà αa = nπ; larghezza di banda dei legami forti 4t (1D) e 8t (quadrato); m* al fondo banda = ħ²/(2ta²); grafene ±3t in Γ, ±t in M, 0 in K.
- **Numeri di riferimento dalle dispense** (gli script `verifica_*.py` in `materiale/` li ricalcolano):
  - quasi liberi, a = 3 Å e V_G = −0,5 eV: m₀/m*₊ = 17,731;
  - schemi di zona: V_G = 0,45 E₀ e V_2G = 0,3 E₀ con 15 onde piane;
  - k·p con E_P = 20 eV: GaAs (E_g = 1,43 eV, Δ = 0,34 eV) → m_c = 0,071 m₀ e m_lh = 0,097 m₀; InSb (0,18 eV; 0,82 eV) → m_c = 0,012 m₀;
  - pseudopotenziale empirico: `materiale/parte4/epm_bande.npz` contiene le bande di Si e GaAs lungo L–Γ–X–W–K–Γ (8 bande, 40 punti per tratto, onde piane con |G|² ≤ 21, zero alla cima della valenza), da confrontare punto per punto;
  - v(0) = −⅔·E_F (Na: −2,16 eV; Al: −7,8 eV).
- **App**: avvio in locale, controllo visivo di ogni sezione, hover/slider delle formule vive, fluidità delle animazioni, build e avvio su macOS, Windows e Linux.
- **Revisori**: rapporti dei quattro agenti e di Gemini a fine sezione; confronto numerico tra `physics/` e le reimplementazioni in `crosscheck/`.

## Punti aperti
- Cartella di progetto e nome dell'app.
- Validazione dello stile del mockup.
- Rischio tempi: 6 metodi in meno di un mese è ambizioso. La catena biatomica e la variante rettangolare di Kronig–Penney sono le prime cose da rimandare se serve.
