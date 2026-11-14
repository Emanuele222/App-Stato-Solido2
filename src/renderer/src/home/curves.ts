/**
 * Preparazione delle curve per l'anteprima e la miniatura della schermata iniziale.
 *
 * Tutte le curve sono calcolate tramite le funzioni fisiche di physics/
 * con i parametri iniziali di ciascuna sezione:
 * 1. Reticolo vuoto: parabola ripiegata nella prima zona (emptyLatticeBands)
 * 2. Kronig–Penney: bande e gap (kronigPenneyBands)
 * 3. Elettroni quasi liberi: gap al bordo di zona (nearlyFreeBands)
 * 4. Legami forti: bande a coseno s e p (tightBindingMonoatomicBands)
 * 5. Metodo k·p: bande c, hh, lh, so vicino a Γ (kaneBands)
 * 6. Pseudopotenziale: bande del Si lungo L–Γ–X–W–K–Γ (pseudopotentialBands, 51 onde piane)
 *
 * Le curve dell'anteprima si calcolano solo quando servono (alla prima anteprima)
 * e rimangono memorizzate per i passaggi successivi.
 */
import {
  emptyLatticeBands,
  kaneBands,
  kDotPPath1D,
  kronigPenneyBands,
  nearlyFreeBands,
  pseudopotentialBands,
  tightBindingMonoatomicBands,
  zonePath1D,
  type BandStructure
} from '../physics'

export interface CurveLabel {
  readonly frac: number
  readonly label: string
}

export interface MethodPreviewData {
  readonly id: string
  readonly title: string
  readonly subtitle: string
  readonly bands: readonly Float64Array[]
  readonly kNormalized: Float64Array
  readonly eMin: number
  readonly eMax: number
  readonly kLabels: readonly CurveLabel[]
}

/** Struttura normalizzata a partire da una BandStructure */
function normalizeBandStructure(
  id: string,
  title: string,
  subtitle: string,
  bs: BandStructure
): MethodPreviewData {
  const nPoints = bs.path.points.length
  const maxDist = bs.path.distance[nPoints - 1] || 1
  const kNormalized = new Float64Array(nPoints)
  for (let i = 0; i < nPoints; i++) {
    kNormalized[i] = bs.path.distance[i] / maxDist
  }

  const kLabels: CurveLabel[] = bs.path.labels.map((l) => ({
    frac: bs.path.distance[l.index] / maxDist,
    label: l.label
  }))

  let minE = Infinity
  let maxE = -Infinity
  for (const band of bs.energies) {
    for (let i = 0; i < band.length; i++) {
      const v = band[i]
      if (v < minE) minE = v
      if (v > maxE) maxE = v
    }
  }

  const span = maxE - minE
  const pad = span > 0 ? span * 0.08 : 1
  const eMin = minE - pad
  const eMax = maxE + pad

  return {
    id,
    title,
    subtitle,
    bands: bs.energies,
    kNormalized,
    eMin,
    eMax,
    kLabels
  }
}

/** Calcola la curva a riposo: bande degli elettroni quasi liberi con gap ben visibile. */
export function computeRestingCurves(): MethodPreviewData {
  const a = 3.0
  const path = zonePath1D(a, 101)
  const bs = nearlyFreeBands(
    { a, fourier: [-0.75, 0] },
    path,
    { planeWaves: 11, bands: 4 }
  )
  return normalizeBandStructure(
    'resting',
    'Teoria delle bande',
    'Bande di energia con gap proibiti',
    bs
  )
}

let cachedResting: MethodPreviewData | null = null

export function getRestingCurves(): MethodPreviewData {
  if (!cachedResting) {
    cachedResting = computeRestingCurves()
  }
  return cachedResting
}

/** Calcola le 6 serie di curve per l'anteprima ciclica. */
export function computeAllPreviewCurves(): readonly MethodPreviewData[] {
  // 1. Reticolo vuoto: a = 3.0 Å, 4 bande
  const a1 = 3.0
  const path1 = zonePath1D(a1, 101)
  const bs1 = emptyLatticeBands(a1, path1, 4)

  // 2. Kronig–Penney: a = 3.0 Å, P = 2.0, 4 bande
  const path2 = zonePath1D(3.0, 101)
  const bs2 = kronigPenneyBands({ variant: 'delta', a: 3.0, P: 2.0 }, path2, 4)

  // 3. Elettroni quasi liberi: a = 3.0 Å, V_G = -0.5 eV, 11 onde piane, 4 bande
  const path3 = zonePath1D(3.0, 101)
  const bs3 = nearlyFreeBands(
    { a: 3.0, fourier: [-0.5, 0] },
    path3,
    { planeWaves: 11, bands: 4 }
  )

  // 4. Legami forti: catena monoatomica a = 3.0 Å, bande s e p
  const path4 = zonePath1D(3.0, 101)
  const bs4 = tightBindingMonoatomicBands(
    { a: 3.0, centerS: -8.0, centerP: -2.0, tS: 1.0, absTP: 1.2 },
    path4
  )

  // 5. Metodo k·p: modello di Kane (so, lh, hh, c) vicino a Gamma
  const path5 = kDotPPath1D(0.12, 101)
  const bs5 = kaneBands({ eg: 1.43, delta: 0.34, ep: 20.0 }, path5)

  // 6. Pseudopotenziale: Si lungo L–Γ–X–W–K–Γ (51 onde piane = gMaxSq 11)
  const bs6 = pseudopotentialBands(
    {
      a: 5.43,
      formFactors: { v3s: -0.21, v8s: 0.04, v11s: 0.08, v3a: 0, v4a: 0, v11a: 0 }
    },
    {
      gMaxSq: 11,
      pointsPerSegment: 20,
      numBands: 8,
      zeroAtValenceTop: true
    }
  )

  return [
    normalizeBandStructure(
      'empty-lattice',
      'Reticolo vuoto',
      'Parabola ripiegata nella prima zona di Brillouin',
      bs1
    ),
    normalizeBandStructure(
      'kronig-penney',
      'Kronig–Penney',
      'Bande permesse e gap dal potenziale periodico a delta',
      bs2
    ),
    normalizeBandStructure(
      'nearly-free',
      'Elettroni quasi liberi',
      'Apertura dei gap ai bordi di zona per debole perturbazione',
      bs3
    ),
    normalizeBandStructure(
      'tight-binding',
      'Legami forti',
      'Bande di legame a coseno da orbitali atomici s e p',
      bs4
    ),
    normalizeBandStructure(
      'k-dot-p',
      'Metodo k·p',
      'Dispersione c, hh, lh, so attorno al punto Γ',
      bs5
    ),
    normalizeBandStructure(
      'pseudopotential',
      'Pseudopotenziale',
      'Bande realistiche del silicio lungo i cammini di alta simmetria',
      bs6
    )
  ]
}

let cachedPreview: readonly MethodPreviewData[] | null = null
let previewCalculationTimeMs = 0

/**
 * Restituisce le 6 serie di curve calcolate da physics/.
 * Il calcolo viene eseguito solo alla prima chiamata e memorizzato in cache.
 */
export function getPreviewCurves(): readonly MethodPreviewData[] {
  if (!cachedPreview) {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now()
    cachedPreview = computeAllPreviewCurves()
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now()
    previewCalculationTimeMs = t1 - t0
  }
  return cachedPreview
}

export function getPreviewCalculationTimeMs(): number {
  return previewCalculationTimeMs
}
