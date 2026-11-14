# Incarico Gemini 07 — sezione «Pseudopotenziale»

**Ruolo: autore di sezione.** Scrivi in `src/renderer/src/sections/pseudopotential/`, in `src/renderer/src/physics/` con i relativi test e la riga di registrazione in `sections/registry.ts`. In via eccezionale, per questo incarico puoi completare in `physics/linalg.ts` il solo ramo `complex-hermitian` di `eigh`, oggi lasciato vuoto apposta: il ramo reale simmetrico non si tocca. Nient'altro. `ui/`, `viz/` e `sections/nearly-free/` restano di Opus.

## Esito degli incarichi 06 e 01
- **06 (metodo k·p): accettato.** 101 test su 101, build riuscita, visto dalla regia a 1200 e a 800 px nelle due varianti. Silicio fuori dai preset: confermato. I due segni del termine libero delle valenze, ciascuno nella sua variante: confermato. La proposta sul primo fotogramma di `useTweened` è registrata per chi lavora su `ui/`.
- **01 (controllo della fisica): approvato**, nessun problema bloccante.

## Fonti
- `materiale/parte4/dispensa.tex`, §4 «Il metodo dello pseudopotenziale» (righe 829–1300 circa): perché il potenziale vero non è quasi libero, onde piane ortogonalizzate, equazione di pseudo-Schrödinger, pseudopotenziale debole, fattori di forma (tabella), v(0) = −⅔E_F, bande calcolate. §5.4 «Si e GaAs: il gap assoluto» (righe 1465–1485) con la figura delle bande.
- `materiale/parte4/verifica_bande_reali.py` (funzioni `reciproci`, `bande_epm`, `percorso`): è il calcolo di riferimento delle bande. `materiale/parte4/verifica_pseudo.py` e lo script che genera la figura `pseudo`: curve di modello e numeri. Leggili, non eseguirli.
- `materiale/parte4/epm_bande.npz`: bande di riferimento di Si e GaAs (8 bande, 201 punti lungo L–Γ–X–W–K–Γ, zero alla cima della valenza).

## Notazione (dalla dispensa)
V potenziale vero; V′ potenziale repulsivo; V_ps = V + V′; ψᶠ parte liscia; ψ_c stati di core di energia E_c; OPW χ_k con coefficienti β_c; E(k) banda di valenza (E_k resta la parabola libera); fattori di forma simmetrici V₃ˢ, V₈ˢ, V₁₁ˢ e antisimmetrici V₃ᵃ, V₄ᵃ, V₁₁ᵃ, in Ry (1 Ry = 13,6057 eV); τ = (a/8)(1,1,1), atomi in ±τ; |G|² in unità (2π/a)². Qui ψ_c è lo stato di core, non l'onda stazionaria dei quasi liberi: scrivilo nella scheda teoria.

## Cosa deve capire lo studente
1. Il potenziale vero non è debole e la funzione di valenza oscilla nel core, perché deve essere ortogonale agli stati di core: con poche onde piane non si descrive.
2. Raccogliendo le oscillazioni di core in un termine repulsivo V′ resta un potenziale efficace piccolo e liscio, V_ps = V + V′, che agisce sulla sola parte liscia ψᶠ e dà le stesse energie.
3. Per questo bastano pochi coefficienti di Fourier: tre numeri (V₃ˢ, V₈ˢ, V₁₁ˢ) danno le bande del silicio.
4. È la stessa equazione centrale degli elettroni quasi liberi con V_ps al posto di V, ma diagonalizzata con molte onde piane invece che trattata come perturbazione.
5. Le bande vere hanno un gap assoluto: indiretto nel Si (minimo della conduzione lungo ΓX), diretto in Γ nel GaAs. In fondo alla valenza si riconosce la parabola libera.

## Cosa costruire
- **Parametri**: V₃ˢ, V₈ˢ, V₁₁ˢ in Ry e il passo `a`. Intervalli che contengano i valori di tutta la tabella della dispensa; motivali nel rapporto.
- **Preset**: Si (a = 5,43 Å; −0,21; 0,04; 0,08) e GaAs (a = 5,65 Å; −0,252; 0; 0,08; antisimmetrici 0,068; 0,066; 0,012), cioè i valori dello script di riferimento. Ge solo se trovi il suo passo reticolare nelle dispense; gli altri materiali della tabella restano fuori perché mancano gli antisimmetrici. Nessun numero preso da altre fonti.
- **Termine antisimmetrico**: per il GaAs i tre fattori antisimmetrici sono mostrati come valori fissi, con un interruttore che li accende e li spegne: spento, si vede il cristallo «tipo diamante» con gli stessi fattori simmetrici.
- **Scena, tre viste collegate**
  - *L'idea, nello spazio reale*: potenziale dello ione nudo (∝ −1/r) contro pseudopotenziale, nelle due forme soft core e hard core, con il raggio r_c; sotto, funzione di valenza vera che oscilla nel core contro parte liscia ψᶠ. Sono curve di **modello**, dichiarate a schermo come indicative; prendi forma e parametri dalla figura della dispensa e dal suo script.
  - *Fattore di forma v(q)*: la curva di modello della dispensa («empty core» di Ashcroft con schermatura di Thomas–Fermi, parametri di tipo Si), che parte da −⅔E_F, cambia segno e tende a zero; sopra, i tre punti V₃ˢ, V₈ˢ, V₁₁ˢ nei |G|² = 3, 8, 11, legati ai cursori e trascinabili in verticale. La curva è indicativa, i punti sono i parametri veri: va detto a schermo.
  - *Bande lungo L–Γ–X–W–K–Γ*: 8 bande, zero alla cima della valenza, le quattro di valenza distinte da quelle di conduzione, gap assoluto evidenziato, cima della valenza e minimo della conduzione marcati e uniti da una freccia con l'etichetta «gap diretto» o «gap indiretto».
- **Stato scelto**: clic o trascinamento su una banda lungo il percorso e frecce da tastiera. Per lo stato scelto, un piccolo istogramma dei pesi |c_G|² raggruppati per guscio di |G|²: mostra quante onde piane servono davvero.
- **Formula viva**: [p̂²/2m₀ + V_ps]ψᶠ = E(k)ψᶠ; V_ps = V + V′ con V′ = Σ_c (E − E_c)|ψ_c⟩⟨ψ_c|; equazione centrale con V_{G−G′}; V_G = Vˢ·cos(G·τ) + i·Vᵃ·sin(G·τ); v(0) = −⅔E_F. Passando su un fattore di forma si evidenziano il suo punto sulla curva e il cursore.
- **Valori vivi**: a; i fattori di forma in Ry e in eV; numero di onde piane; gap, tipo (diretto o indiretto) e posizione del minimo della conduzione (per esempio «a 0,85 di ΓX»); E_c in Γ, X, L; fondo e larghezza della valenza; accanto, i gap misurati della dispensa (Si 1,12 eV, GaAs 1,42 eV) con l'avviso che il modello locale dà gap indicativi. Stato scelto: k in unità 2π/a, banda, E.
- **Confronto ione nudo / pseudopotenziale** per il Si: |V_G| dello ione nudo (circa 31, 12 e 9 eV per |G|² = 3, 8, 11) contro i fattori di forma (−2,9 eV per |G|² = 3), calcolati da `physics/`.
- **Strumenti trasversali**
  - Riempimento: 8 elettroni per cella riempiono esattamente le quattro bande di valenza; μ nel gap. Nessun selettore.
  - Massa efficace: sonda lungo il percorso; la curvatura è quella lungo la direzione del tratto, e va detto. Per il GaAs in Γ confronto con la massa misurata 0,067 m₀ e con la stima E_g(Γ)/E_P della sezione k·p.
  - Confronto: reticolo vuoto fcc (V_ps = 0) lungo lo stesso percorso, allineato al fondo della valenza.
- **Scheda teoria** breve, dal §4, con l'aggancio agli elettroni quasi liberi. Testi in un file di stringhe, formule in KaTeX.
- **Registrazione**: in `sections/registry.ts` solo la voce `pseudopotential`.

## Calcolo e fluidità
- Il riferimento usa 113 onde piane (|G|² ≤ 21) e 201 punti in k. In JavaScript il calcolo completo non sta in un fotogramma: misura i tempi e scrivili nel rapporto.
- Mentre si trascina un cursore usa una versione ridotta (meno onde piane e meno punti), poi affina al calcolo completo al rilascio, con un indicatore discreto «in affinamento». Chiedi a `eigh` i soli autovalori per le bande e gli autovettori solo per lo stato scelto.
- Un Web Worker è ammesso solo se dalle misure risulta necessario; in quel caso deve funzionare anche nella build (`npm run build`), non solo in sviluppo, e lo verifichi.
- Si e Ge hanno matrice reale; il GaAs ha matrice hermitiana complessa: implementa il ramo `complex-hermitian` di `eigh` con i suoi test.

## Regole
- Tutta la fisica in `physics/`: vettori reciproci fcc entro un taglio, fattore di struttura e matrice del potenziale, bande lungo un percorso (`kPathFromVertices` esiste già), ricerca di cima della valenza e minimo della conduzione, pesi per guscio, curve di modello (ione nudo, soft core, hard core, v(q), funzione vera e liscia), v(0), coefficiente dello ione nudo. Le bande escono come `BandStructure`.
- Ogni funzione ha un test. Almeno questi:
  - 113 vettori reciproci con |G|² ≤ 21; gusci 0, 3, 4, 8, 11 con 1, 8, 6, 12, 24 vettori.
  - V_ps = 0: bande del reticolo vuoto fcc (in Γ lo stato a energia 0 e otto stati a 3·(ħ²/2m₀)(2π/a)²).
  - `eigh` complesso: caso 2×2 analitico; matrice hermitiana casuale con residuo ‖Hv − λv‖ < 10⁻¹⁰ e autovettori ortonormali; autovalori degeneri; una matrice reale risolta dai due rami dà gli stessi autovalori.
  - **Confronto con `epm_bande.npz`** per Si e GaAs su tutti i 201 punti e le 8 bande, entro 10⁻³ eV. Il file è uno zip non compresso di array `.npy` in float64: leggilo nel test con un piccolo lettore scritto da te (nessuna dipendenza).
  - Numeri della dispensa: gap del Si 0,8 eV indiretto con minimo a 0,85 di ΓX; gap del GaAs 1,9 eV diretto; fondo della valenza del Si a −12,6 eV.
  - Ione nudo nel Si (a = 5,431 Å, Z = 14): |V_G| ≈ 31, 12, 9 eV per |G|² = 3, 8, 11; fattore di forma −2,9 eV per |G|² = 3.
  - v(0) = −⅔E_F: Na (E_F = 3,24 eV) → −2,16 eV; Al (11,7 eV) → −7,8 eV.
- Riusa `ui/` e `viz/` così come sono. `BandPlot` è pensato per una dimensione con bordi ±π/a: per il percorso a più tratti serve una vista locale, e lo segnali nel rapporto.
- Stessa struttura di file, stessi pannelli, stessa impaginazione dei valori e stessi comportamenti delle altre sezioni. Etichette su canvas con i pedici `_{…}`. Interfaccia in italiano, numeri con la virgola. Nessuna fisica nell'interfaccia.
- Regge da 800 px in su con tutti gli strumenti attivi, con altezze minime e scorrimento. Nessun errore in console.
- Nessuna dipendenza nuova. Niente commit.

## Verifica prima di consegnare
`npm run typecheck`, `npm test`, `npm run build` dopo l'ultima modifica. Verifica visiva obbligatoria a 1440, 1100 e 800 px con ogni preset, con il termine antisimmetrico acceso e spento, trascinando i cursori e con tutti gli strumenti attivi; controlla che le altre cinque sezioni funzionino ancora. Se il browser chiede un permesso, chiedilo all'utente in chat.

## Consegna
`reviews/gemini/07-pseudopotenziale.md`, con la struttura di `AGENTS.md`, più: funzioni aggiunte a `physics/` e modifiche a `linalg.ts`, tempi misurati del calcolo ridotto e completo, intervalli dei parametri, preset e origine di ogni numero, proposte per `ui/` e `viz/`, difetti noti.
