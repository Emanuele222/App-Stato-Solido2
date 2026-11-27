# Incarico 16 — riparazione di «Pseudopotenziale» dopo l'incarico 14

**Ruolo: autore delle correzioni alla sezione «Pseudopotenziale».** Un solo autore, modalità normale, niente squadra. **Mai insieme a un altro incarico** (in particolare non insieme al 15). Leggi prima `AGENTS.md`, `progetto.md`, l'incarico 14 (`incarichi/gemini-14-pseudopotenziale-intuizione.md`) e il suo rapporto (`reviews/gemini/14-pseudopotenziale-intuizione.md`).

## Esito della verifica della regia (27/11, build con 206 test verdi)

**Accettato, non riaprire**: tutta la fisica in Γ sulla banda 1, ricalcolata da zero con un'Hamiltoniana indipendente (E_c = −19,079, E = 13,089 eV; r_c = 0,641 Å; due cambi di segno in ±0,413 Å; α = +0,586; ⟨T⟩ 10,57 / 4,83 / 0,90 eV; onda dominante 54,1 % contro 93,5 %; aree di ortogonalità ±0,1275; E − V 63,7 / 3,69 eV; 11 onde contro 3); α finito ovunque (max |α| = 1,23 su bande 1–3, 41 punti k, 8 estremi dei cursori); schermata di apertura, che fa vedere ψ_c, i due cambi di segno, ψ^f che si stacca solo nel core e «11 contro 3»; layout alle tre finestre; formule; interruttore «parte liscia»; collegamenti con «Bande dei materiali veri»; console pulita.

**Non toccare** il test di tempo in `pseudoCore1d.test.ts` («migliore di tre», limite 500 ms): l'ha cambiato la regia. Non toccare `physics/pseudopotential.test.ts`.

## Permessi, solo per questo incarico

`src/renderer/src/sections/pseudopotential/`, `src/renderer/src/physics/pseudoCore1d.ts` e `pseudoCore1d.test.ts`, e in `src/renderer/src/ui/theme.ts` **solo** le due voci `coreState` e `screenedPotential` di `DERIVED_TONES`. Nient'altro: non `viz/`, non `ui/` (a parte quelle due righe), non `real-bands/`, non `tight-binding-2d/`, non i file del capitolo Fononi (elenco in `AGENTS.md`). Nessuna dipendenza nuova. Niente commit.

## A. Importante: la parte dispari di ψ_k (il cuore di questo incarico)

### Che cosa succede oggi
Nella base delle onde piane e^{i(k+G)x} i coefficienti c_G dell'autosolutore sono reali (V è pari). Quindi ψ(−x) = ψ(x)*, cioè **Re ψ è la parte pari attorno allo ione e Im ψ è la parte dispari**. La sezione disegna solo Re ψ_k, e negli stati esattamente dispari (Γ banda 2, ±π/a banda 1) ruota di −i (`model.ts:228-239`, `oddByParity`).
Effetto: un passo accanto a quegli stati la ψ_k disegnata è una linea piatta e il conteggio dei cambi di segno è un artefatto (Γ banda 2, poi un passo a destra: «2 (x = ±0,405 Å)» invece di 1; banda 1 a k = 0,975π/a: «2 (x = ±0,425 Å)» con la linea piatta).

### Che cosa c'è sotto (fisica, ricalcolata dalla regia)
Il modello ha **un solo stato di core, pari**. V′ = (E − E_c)|ψ_c⟩⟨ψ_c| (dispensa r. 1056–1061: «non locale, agisce proiettando sul core») addolcisce quindi la parte pari di ψ_k; la parte dispari non ha uno stato di core con cui essere ortogonale, sente tutto V (E − V = 63,7 eV sullo ione) e resta oscillante. Appena ci si allontana da Γ la parte dispari nel core cresce in fretta e il vantaggio delle onde piane sparisce:

| Stato (a = 4, V₀ = 60, s = 0,25) | parte dispari nel core (\|x\| < r_c) | parte dispari nella cella | onde per errore < 0,01 eV: V / V + V′ |
|---|---|---|---|
| Γ, banda 1 | 0 % | 0 % | 11 / 3 |
| 0,025π/a, banda 1 | — | — | 11 / 3 |
| 0,05π/a, banda 1 | 28,3 % | 4,2 % | 11 / 7 |
| 0,1π/a, banda 1 | 58,6 % | 13,7 % | 11 / 9 |
| 0,2π/a, banda 1 | 81,4 % | 33,8 % | 11 / 11 |
| 0,3π/a, banda 1 | 89,1 % | 49,9 % | 13 / 11 |
| 0,6π/a, banda 1 | 97,2 % | 82,9 % | 13 / 11 |
| π/a, banda 1 | 100 % | 100 % | 13 / 11 |
| Γ, banda 2 (dispari) | 100 % | 100 % | 13 / 13 |
| Γ, banda 3 (pari) | 0 % | 0 % | 15 / 5 |

(Pesi = ∫|parte|² / ∫|ψ_k|² su 2001 punti; le «onde» sono quelle di `planeWaveConvergence1D`, che coincidono con il ricalcolo indipendente.) Non è un errore dell'app: è il limite di un modello con un solo stato di core. Va **mostrato e spiegato**, non nascosto.

### Che cosa fare
1. **Togli la rotazione di −i** e il caso speciale `oddByParity`. Disegna ψ_k con le sue due parti, con la convenzione dei c_G reali:
   - **parte pari** (Re ψ_k): la linea piena di oggi, nel tono di ψ;
   - **parte dispari** (Im ψ_k): una seconda linea più sottile e distinguibile (tratto diverso o tinta chiara di ψ, mai lo stesso aspetto di ψ^f), con etichetta «parte dispari» e voce in legenda. Si disegna sempre; quando il suo peso nella cella è sotto l'1 % si può attenuare, ma non deve sparire di colpo.
   - ψ^f = ψ_k + αψ_c e ψ_c si disegnano con la stessa regola (parte pari piena; parte dispari solo se pesa almeno l'1 %).
   - Nessuna linea deve diventare piatta o ricomparire di colpo spostando k di un passo: prova tutti gli 81 punti del cammino sulle bande 1, 2 e 3.
2. **Cambi di segno nel core**: contali separatamente per le due parti e scrivili così: «parte pari: 2 (x = ±0,413 Å) · parte dispari: 1 (x = 0)», omettendo la parte che pesa meno dell'1 % nel core.
3. **Nuovo valore a schermo**: «parte dispari nel core: 89 %» (con r_c della sezione). In Γ banda 1 deve dire 0 %.
4. **Testi condizionati** (`strings.ts`, passo 3 della lettura guidata e riquadro «Quante onde piane»):
   - se le onde con V + V′ sono meno di quelle con V: «con V + V′ bastano 3 onde piane invece di 11»;
   - se sono uguali o quasi (differenza ≤ 2): niente confronto numerico ripetuto («17 invece di 17» non deve mai comparire) e una frase sul perché, per esempio: «Qui ψ_k è per l'89 % dispari nel core: l'unico stato di core è pari, quindi V′ non ha niente da cancellare in quella parte e il vantaggio sparisce.»
   - Nel grafico dell'errore, se i due numeri coincidono, una sola etichetta («13 = 13»), non due sovrapposte.
5. **Scheda teoria**: aggiungi al paragrafo «Rispetto agli altri metodi», o subito dopo, tre o quattro righe: V′ = Σ_c (E − E_c)|ψ_c⟩⟨ψ_c| cancella V solo nella parte di ψ che «vede» uno stato di core; in questo modello 1D c'è un solo stato di core, pari, e il vantaggio vale per la parte pari (Γ banda 1: 11 → 3; Γ banda 3: 15 → 5; Γ banda 2, dispari: 13 → 13). Negli atomi veri la somma su c comprende stati di core di diverse simmetrie (per il Si 1s, 2s e 2p). Nessun numero o affermazione che non sia nella dispensa o in questa tabella.
6. **Fisica e test** (`pseudoCore1d.ts`, `pseudoCore1d.test.ts`): una funzione pura per i pesi pari/dispari (nella cella e nel core) e per i cambi di segno delle due parti; test sui numeri della tabella (tolleranza 0,5 punti percentuali sui pesi, valori esatti sulle onde), compreso Γ banda 2 → 100 % dispari e Γ banda 3 → 0 %.

### Segno continuo lungo le bande (minore, collegato)
`fixEigenvectorSign` (`pseudoCore1d.ts:126-165`) fissa il segno con «Re ψ(a/2) > 0», che fallisce dove Re ψ(a/2) passa per zero: oggi il segno salta tra gli indici 0 e 1 (k = −π/a) e, negli estremi a = 3,5 / V₀ = 75 / s = 0,28 e a = 4,8 / V₀ = 75 / s = 0,28 (banda 1 dispari in Γ), anche all'indice 40. Sostituiscila con la **continuità**: in Γ fissa il segno con una regola chiara (parte pari: ψ(a/2) > 0; se la parte pari è nulla, derivata della parte dispari in 0 > 0), poi lungo il cammino scegli il segno che rende positivo il prodotto scalare Σ c_G(k)c_G(k′) con il punto precedente. ψ_c resta con ψ_c(0) > 0. Test: nessun prodotto scalare negativo tra punti consecutivi sugli 81 punti (indici 0–80) delle bande 1–3, al default e agli 8 estremi dei cursori.

## B. Minori

1. **Pulsante «E − E_c = 32,2 eV»** (`PseudopotentialSection.tsx:267`): oggi porta f a 32,0 per il passo 0,5 del cursore (`manifest.ts:29`), e il livello di core spostato finisce a 12,921 eV invece che a E = 13,089 eV. Il pulsante deve impostare **esattamente** f = E − E_c (il cursore può mostrare il valore arrotondato, lo stato no); verifica che dopo il clic il livello di core spostato coincida con E entro 10⁻⁶ eV. Spostando k con f agganciato, decidi se f segue E − E_c e dichiaralo nel rapporto.
2. **Passo 3 della lettura guidata**: oggi la vista delle onde piane è identica a «Tutto» (`PseudoCoreReciprocalCanvas.tsx:49-52`, manca `guidedStep === 3`). Al passo 3 mettila in evidenza: le due curve dell'errore e i numeri «11» e «3», e nella scheda «Cancellazione» la coppia di barre n = 1; attenua il resto come fanno i passi 1 e 2.
3. **Nesso causale all'apertura**: oggi ⟨T⟩, peso dominante e onde sono un elenco senza frase. Nella vista «Tutto» aggiungi una riga sola che li colleghi, per esempio «ψ^f è liscia: ⟨T⟩ 0,90 eV invece di 4,83, un'onda piana pesa il 93,5 %, bastano 3 onde invece di 11». Con i testi condizionati del punto A4 quando il vantaggio non c'è.
4. **Toni** (`ui/theme.ts`, solo queste due voci):
   - `screenedPotential` (V + V′) è dichiarato «tinta di v», ma `v` è la velocità di gruppo (`#5cd0b3`) e `#56d4c0` le è quasi identico. Deriva il tono da `VG` (V + V′ è un potenziale): una tinta che nella scheda «Cancellazione» si distingua bene dalle barre di V (`#fc6255`) e che non si confonda con E (`#83c167`) né con `coreState`. Correggi `from` e `name`.
   - `coreState` è quasi identico a `t` (`#75a4ff`): va bene solo se `t` non compare in nessuna vista di questa sezione; controlla e scrivilo nel rapporto.
5. **Curva dell'errore**: il pavimento a 10⁻⁴ eV (`PseudoCoreReciprocalCanvas.tsx:113`) fa diventare piatta la curva di V + V′ da N = 7 e sembra che l'errore smetta di scendere. Scendi a 10⁻⁶ eV, oppure segna il pavimento con «< 10⁻⁴ eV».
6. **Testi e forma**:
   - `aria-label` con trattino basso (`strings.ts:92`, «|c_G|²»): scrivi «c con G» o il simbolo Unicode.
   - Etichette dell'asse dei pesi con «-4», «-2» ASCII (`PseudoCoreReciprocalCanvas.tsx:96`): usa il segno meno «−».
   - Primo paragrafo della scheda teoria in un solo blocco «1. … 2. … 3. …» (`strings.ts:155`): fanne un elenco; nel secondo paragrafo «3 onde» diventa «3 onde in Γ».
   - `DEFAULT_PARAMS.alpha = 0.59` (`manifest.ts:40`) contro `default: 0` in `PARAMS` (`manifest.ts:30`): rendili coerenti con lo stato di apertura (α = parte liscia).

## Verifica prima di consegnare

- `npm run typecheck`, i test (`perl -e 'alarm 240; exec @ARGV' ./node_modules/.bin/vitest run`) e `npm run build` verdi.
- Nel browser, a 1440×900, 1100×800 e 800×700: stessi minimi dell'incarico 14 (spazio reale ≥ 360 px a 1440×900 e ≥ 300 px a 1100×800, viste inferiori ≥ 150 px, nessuno scorrimento della pagina da 1100×800, comandi su due righe a 1100×800, nessuna formula tagliata, nessun «_» a schermo). La riga del punto B3 e la legenda della parte dispari non devono rubare spazio sotto questi minimi.
- Guarda e descrivi nel rapporto questi stati, con le scritte che compaiono: Γ banda 1 (apertura, **deve restare com'è oggi**: parte dispari 0 %, nessuna linea in più visibile); 0,05π/a e 0,3π/a banda 1; π/a banda 1; Γ banda 2; Γ banda 3; un passo accanto a Γ sulla banda 2.
- Console senza errori; collegamenti «Bande dei materiali veri →» e ritorno.

## Rapporto

`reviews/gemini/16-riparazione-pseudopotenziale.md`, con la struttura di `AGENTS.md`. In più: tabella con i punti A1–A6, segno continuo e B1–B6 (fatto / non fatto, file, come verificato); la tabella della parità ricalcolata con le tue funzioni accanto a quella della regia; i due toni scelti con il motivo.
