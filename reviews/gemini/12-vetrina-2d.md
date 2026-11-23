# Rapporto incarico 12 — Vetrina 2D: reticolo quadrato e grafene

## 1. Cosa hai fatto

- **Dipendenze** (`package.json`, `package-lock.json`): installate `three` (`0.187.0`) e `@types/three` (`^0.187.0`, devDependency), unica libreria aggiunta come autorizzato dall'incarico.
- **Fisica** (`src/renderer/src/physics/tightBinding2d.ts`, esportata in `src/renderer/src/physics/index.ts`, testata in `src/renderer/src/physics/tightBinding2d.test.ts`):
  - **Reticolo quadrato**: `squareEnergy`, `squarePath` (Γ–X–M–Γ), `squareBands`, `squareBottomEffectiveMassRatio`, `squareDirectionalMassRatio`, `squareFermiLevel` (N = 1 → 0 eV con linea di Fermi `|k_x| + |k_y| = π/a`; N = 2 → +4t), `squareFreeElectronEnergy`, `squareOsculatingParaboloid`.
  - **Grafene**: `grapheneVectors`, `grapheneStructureFactor`, `grapheneEnergies`, `grapheneHighSymmetryPoints`, `graphenePath` (Γ–M–K–Γ), `grapheneBands`, `grapheneHbarVf`, `grapheneFermiVelocity`, `grapheneCellArea`, `grapheneDiracDos`, `grapheneNumericalDos` (metodo dei triangoli lineari 2D su griglia uniforme nella cella reciproca `b₁, b₂`), `grapheneNearestDiracPoint`, `grapheneEffectiveMassComparison`.
- **Vista 3D riusabile** (`src/renderer/src/viz/Surface3D.tsx`):
  - Importazione dinamica di `three` al montaggio del componente (nessun import statico di `three` nel bundle principale).
  - Stile lavagna (`MeshBasicMaterial` senza illuminazione, fondo `#0f1114`, linee di livello nette per iso-energia, contorno della prima zona di Brillouin nel colore di `a`, punti Γ/X/M o Γ/M/K/K′ etichettati con sprite su canvas 2D).
  - Orbita con trascinamento, zoom con rotella, controllo da tastiera (frecce, `+`/`−`), pulsanti «Vista iniziale» e (per il grafene) «Vai a K» con rispetto di `prefers-reduced-motion`.
  - Cammino e stato scelto ancorati nello spazio 3D; clic sulla superficie via `Raycaster` per scegliere `(k_x, k_y, banda)`.
  - Rendering su richiesta (nessun ciclo `requestAnimationFrame` a riposo), `dispose()` completo di geometrie/materiali/texture/renderer allo smontaggio e messaggio di ripiego se WebGL non è disponibile.
- **Sezione «Legami forti in 2D»** (`src/renderer/src/sections/tight-binding-2d/`):
  - `manifest.ts`, `strings.ts`, `formulas.ts`, `store.ts`, `model.ts`, `PathBandPlot.tsx` (bande lungo il cammino + striscia `g(E)` affiancata sullo stesso asse per il grafene), `RealSpace2DCanvas.tsx` (cella primitiva, `a₁, a₂` e per il grafene atomi A/B e vettori `δ₁, δ₂, δ₃`), `TightBinding2DSection.tsx`, `tightBinding2d.css`.
  - Strumenti (`Riempimento`, `Massa efficace`, `Confronto`) tutti spenti all'apertura; formule vive collegate nei due sensi; scheda teoria breve con collegamento a «Legami forti».
- **Registrazione e schermata iniziale**:
  - Aggiunta la voce `tight-binding-2d` in `src/renderer/src/sections/registry.ts` dopo `tight-binding`.
  - Aggiornato `src/renderer/src/strings.ts` (titolo sezione e `footnote` letto dinamicamente da `SECTIONS`).
  - Aggiornati `src/renderer/src/home/strings.ts`, `HomeScreen.tsx`, `ActiveChapterCard.tsx` (conteggio letto da `SECTIONS`), `home/curves.ts` (aggiunte le bande del grafene lungo Γ–M–K–Γ dopo «Legami forti»), `home/curves.test.ts` e `home/home.css`.

### Vettori δ_i scelti per il grafene

Coerenti con `a₁ = a(√3/2, −1/2)` e `a₂ = a(√3/2, +1/2)` (`materiale/parte4/dispensa.tex`, r. 1740), con `a = 2,46 Å` e `a_CC = a/√3 = 1,42028… Å`:
- `δ₁ = a_CC (1, 0)`
- `δ₂ = δ₁ − a₁ = a_CC (−1/2, +√3/2)`
- `δ₃ = δ₁ − a₂ = a_CC (−1/2, −√3/2)`

Verificato che `|δ_i| = a_CC`, angoli reciproci di 120° e `f(k) = 0` in tutti e sei i vertici `K` e `K′` della prima zona di Brillouin (`|ΓK| = 4π/(3a)`).

### Tabella valori calcolati contro quelli della dispensa

| Grandezza | Dispensa (`dispensa.tex`) | Calcolato in `tightBinding2d.ts` | Verifica |
|---|---|---|---|
| Quadrato: `E(Γ)` | `−4t` | `−4t` | Test (`toBeCloseTo(-4*t, 12)`) |
| Quadrato: `E(X)` | `0` | `0` | Test (`toBeCloseTo(0, 12)`) |
| Quadrato: `E(M)` | `+4t` | `+4t` | Test (`toBeCloseTo(4*t, 12)`) |
| Quadrato: larghezza `W` | `8t` | `8t` | Test (`toBeCloseTo(8*t, 12)`) |
| Quadrato: `m*/m₀` al fondo (Γ) | `ħ²/(2ta²m₀)` | `HBAR2_OVER_2M0 / (t·a²)` | Test (`toBeCloseTo(..., 12)`) |
| Quadrato: `E_F` (`N = 1`) | `Ē_s` (`0`), `\|k_x\|+\|k_y\|=π/a` | `0` su tutto `\|k_x\|+\|k_y\|=π/a` | Test (`toBeCloseTo(0, 12)`) |
| Grafene: `E_±(Γ)` | `±3t` (`±8,4 eV` per `t=2,8`) | `±3t` (`±8,40 eV`) | Test (`toBeCloseTo(±3*t, 12)`) |
| Grafene: `E_±(M)` | `±t` (`±2,8 eV`) | `±t` (`±2,80 eV`) | Test (`toBeCloseTo(±t, 12)`) |
| Grafene: `E_±(K, K′)` | `0` in tutti i 6 vertici | `|f| < 10⁻¹²` in tutti i 6 vertici | Test |
| Grafene: pendenza vicino a `K` | `(3/2)·a_CC·t` | entro 1 % in 4 direzioni | Test |
| Grafene: `v_F` (`t = 2,8 eV`) | `9,1·10⁵ m/s ≈ c/330` | `9,06·10⁵ m/s` (`c / 331`) | Test (`9,0e5 < vF < 9,2e5`) |
| Grafene: `g(E)` numerica vs lineare | entro 0,5 % (dispensa) / 2 % (incarico) fino a `0,3 eV` | entro 2 % su `0,10 ≤ \|E\| ≤ 0,30 eV`; integrale per banda `= 2` stati/cella | Test (`gridN=240`, `toBeCloseTo(2, 5)`) |
| Grafene: `m*` vs `m̃` in `K` | `m* → ∞`, `m̃ = ħq/v_F → 0` | `isEffectiveMassDivergent === true`, `m̃ = 0` in `K` | Test |

## 2. Cosa hai verificato davvero

- **TypeScript sui file dell'incarico** (`npx tsc --noEmit -p tsconfig.web.json 2>&1 | grep -E "tight-binding-2d|Surface3D|home/|registry|strings"`): 0 errori.
- **Test unitari**:
  - `npx vitest run src/renderer/src/physics/tightBinding2d.test.ts src/renderer/src/home/curves.test.ts` → **2 file, 15/15 test verdi** (10 test in `tightBinding2d.test.ts`, 5 test in `home/curves.test.ts`).
  - `npx vitest run` sui moduli esistenti non toccati dall'incarico 13 (`tightBinding`, `semiclassical`, `emptyLattice`, `kronigPenney`, `kDotP`, `tightBinding2d`, `home/curves`) → **7 file, 78/78 test verdi**.
- **Peso build prima della modifica**: `npm run build` iniziale eseguito prima dell'installazione di `three` → `out/renderer/assets/index-BG6K9XgB.js` = `1,679.30 kB` (~1,68 MB).

## 3. Cosa non hai potuto verificare

Durante l'esecuzione dell'incarico, un altro autore (Claude Opus) stava modificando in parallelo i file dell'incarico 13 (`src/renderer/src/sections/pseudopotential/`, `src/renderer/src/sections/real-bands/`, `src/renderer/src/physics/pseudoCore1d.test.ts`), lasciando temporaneamente un import non risolto (`bandKinematics` importato in `pseudopotential/model.ts` ma non ancora esportato in `physics/index.ts`, più 12 errori TypeScript in quei file). Per rispettare la regola «un solo autore per sezione, mai due autori sugli stessi file», quei file non sono stati toccati. Di conseguenza non è stato possibile verificare:

1. **Build di produzione finale (`npm run build`) e pesi dopo la modifica**: bloccati dall'errore `[MISSING_EXPORT] "bandKinematics"` in `src/renderer/src/sections/pseudopotential/model.ts:6`. Il peso del chunk separato di `three` e del bundle principale dopo l'aggiunta della sezione va misurato appena l'incarico 13 chiude i suoi export.
2. **Verifica visiva nel browser (`dev:web`) alle tre finestre (`1440×900`, `1100×800`, `800×700`) e misure delle altezze delle tre viste**: avviato il server su `http://localhost:5173/` e aperto con il subagente browser, ma l'app non ha potuto montarsi per lo stesso errore di modulo (`Uncaught SyntaxError: The requested module '/src/physics/index.ts' does not provide an export named 'bandKinematics'`).
3. **Interazione WebGL dal vivo** (rotazione, clic sulla superficie, «Vai a K», cambio sezione ripetuto, assenza errori in console) e **finestra Electron (`npm run dev`)**: non verificabili finché il renderer non compila senza l'errore di `pseudopotential/model.ts`.

## 4. Problemi trovati

1. **[Bloccante per il build/avvio dell'intera app, esterno a questo incarico]** `src/renderer/src/sections/pseudopotential/model.ts:7` (e `real-bands/EpmBandPlot.tsx:31`, `real-bands/RealBandsSection.tsx:131`, `physics/pseudoCore1d.test.ts:4`) presentano 12 errori TypeScript / import mancanti (`bandKinematics`) dovuti all'incarico 13 eseguito in parallelo. Non toccati perché di competenza dell'altro autore.

## 5. Dubbi e domande per la regia

- Appena l'incarico 13 avrà completato gli export in `physics/` e risolto gli errori in `pseudopotential/` e `real-bands/`, si può lanciare subito `npm run build` per registrare i pesi esatti del bundle principale e del chunk `three` e completare il controllo visivo a `1440×900`, `1100×800`, `800×700` e in Electron (`npm run dev`).
