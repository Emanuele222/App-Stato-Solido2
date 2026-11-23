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
  computePhonon3DDispersion,
  defaultParamsForCrystal,
  diatomicDispersionCurve,
  emptyLatticeBands,
  kaneBands,
  kDotPPath1D,
  kronigPenneyBands,
  monatomicDispersionCurve,
  monatomicZoneEdge,
  nearlyFreeBands,
  pseudopotentialBands,
  tightBindingMonoatomicBands,
  zonePath1D,
  type BandStructure
} from '../physics'
import { DERIVED_TONES, QUANTITIES } from '../ui/theme'

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
  /** Colore per ciascuna curva (opzionale; default `defaultColor` o `QUANTITIES.E.color`). */
  readonly bandColors?: readonly string[]
  /** Colore predefinito delle curve del capitolo. */
  readonly defaultColor?: string
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
    { a, fourier: [-1.8, 0] },
    path,
    { planeWaves: 11, bands: 2 }
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

// ---------------------------------------------------------------------------
// Curve del capitolo «Fononi» (Parte 6: Vibrazioni reticolari e fononi)
// ---------------------------------------------------------------------------

function makeLinearAxis(n: number): Float64Array {
  const arr = new Float64Array(n)
  for (let i = 0; i < n; i++) arr[i] = n > 1 ? i / (n - 1) : 0
  return arr
}

function diatomicPreviewFromPhysics(
  n: number,
  a: number,
  mLightAmu: number,
  mHeavyAmu: number,
  springC: number,
  kMinFrac = -1,
  kMaxFrac = 1
): { acoustic: Float64Array; optical: Float64Array; kNorm: Float64Array } {
  const kb = monatomicZoneEdge(a)
  const curve = diatomicDispersionCurve(
    { a, massHeavyAmu: mHeavyAmu, massLightAmu: mLightAmu, springC },
    kMinFrac * kb,
    kMaxFrac * kb,
    n
  )
  return {
    acoustic: curve.acousticFreqThz,
    optical: curve.opticalFreqThz,
    kNorm: makeLinearAxis(n)
  }
}

/** Quadratura di Gauss–Legendre a 12 punti su [0, 1] per l'integrale di Debye dell'anteprima. */
const GL12_X = [
  0.009219682876640374, 0.04794137181476257, 0.11504866290284764, 0.20634102285669128,
  0.31608425050090984, 0.43738329574426554, 0.5626167042557345, 0.6839157494990902,
  0.7936589771433087, 0.8849513370971524, 0.9520586281852374, 0.9907803171233596
] as const
const GL12_W = [
  0.023587668193255913, 0.053469662997659215, 0.08003916427167311, 0.10158371336153296,
  0.1167462682691774, 0.12457352290670139, 0.12457352290670139, 0.1167462682691774,
  0.10158371336153296, 0.08003916427167311, 0.053469662997659215, 0.023587668193255913
] as const

function debyeCvOver3R(tOverTheta: number): number {
  if (tOverTheta <= 1e-4) return 0
  const xD = 1 / tOverTheta
  if (xD > 40) {
    // Limite asintotico T^3: (4π^4 / 5) · (T/Θ_D)^3
    return ((4 * Math.PI ** 4) / 5) * tOverTheta ** 3
  }
  let sum = 0
  for (let i = 0; i < GL12_X.length; i++) {
    const x = xD * GL12_X[i]
    const ex = Math.exp(x)
    const denom = ex - 1
    const integrand = denom > 0 ? (x * x * x * x * ex) / (denom * denom) : 0
    sum += GL12_W[i] * integrand
  }
  return 3 * tOverTheta ** 3 * xD * sum
}

function einsteinCvOver3R(tOverThetaE: number): number {
  if (tOverThetaE <= 1e-4) return 0
  const x = 1 / tOverThetaE
  if (x > 60) return 0
  const ex = Math.exp(x)
  const denom = ex - 1
  return (x * x * ex) / (denom * denom)
}

/** Curva a riposo del capitolo Fononi: catena biatomica tipo Na–Cl con gap ben visibile. */
export function computePhononRestingCurves(): MethodPreviewData {
  const { acoustic, optical, kNorm } = diatomicPreviewFromPhysics(101, 5.64, 23, 35.5, 10)
  const maxVal = optical[Math.floor(optical.length / 2)] || 5
  return {
    id: 'phonons-resting',
    title: 'Fononi',
    subtitle: 'Ramo acustico, ramo ottico e gap fononico',
    bands: [acoustic, optical],
    kNormalized: kNorm,
    eMin: -0.25,
    eMax: maxVal * 1.14,
    kLabels: [
      { frac: 0, label: '−π/a' },
      { frac: 0.5, label: '0' },
      { frac: 1, label: 'π/a' }
    ],
    bandColors: [QUANTITIES.omega.color, QUANTITIES.omegaOpt.color],
    defaultColor: QUANTITIES.omega.color
  }
}

let cachedPhononResting: MethodPreviewData | null = null

export function getPhononRestingCurves(): MethodPreviewData {
  if (!cachedPhononResting) {
    cachedPhononResting = computePhononRestingCurves()
  }
  return cachedPhononResting
}

/** Calcola le 6 serie di curve per l'anteprima ciclica del capitolo Fononi. */
export function computePhononPreviewCurves(): readonly MethodPreviewData[] {
  const N = 101

  // 1. Catena monatomica: metallo tipico (§3, a = 2,5 Å, M = 63,2 u, C = 20 N/m)
  const kNorm1 = makeLinearAxis(N)
  const kb1 = monatomicZoneEdge(2.5)
  const monoCurve = monatomicDispersionCurve({ a: 2.5, massAmu: 63.2, springC: 20 }, -kb1, kb1, N)
  const wMax1 = monoCurve.freqThz[N - 1] || 4.4
  const s1: MethodPreviewData = {
    id: 'phonon-monatomic',
    title: 'Catena monatomica',
    subtitle: 'Dispersione ω(k) = 2√(C/M)|sin(ka/2)| nella 1BZ',
    bands: [monoCurve.freqThz],
    kNormalized: kNorm1,
    eMin: -0.25,
    eMax: wMax1 * 1.16,
    kLabels: [
      { frac: 0, label: '−π/a' },
      { frac: 0.5, label: '0' },
      { frac: 1, label: 'π/a' }
    ],
    bandColors: [QUANTITIES.omega.color],
    defaultColor: QUANTITIES.omega.color
  }

  // 2. Catena biatomica tipo Na–Cl (§8: a = 5,64 Å, m = 23 u, M = 35,5 u, C = 10 N/m)
  const diat = diatomicPreviewFromPhysics(N, 5.64, 23, 35.5, 10)
  const max2 = diat.optical[Math.floor(N / 2)]
  const s2: MethodPreviewData = {
    id: 'phonon-diatomic',
    title: 'Catena biatomica',
    subtitle: 'Rami acustico e ottico con gap fononico',
    bands: [diat.acoustic, diat.optical],
    kNormalized: diat.kNorm,
    eMin: -0.25,
    eMax: max2 * 1.14,
    kLabels: [
      { frac: 0, label: '−π/a' },
      { frac: 0.5, label: '0' },
      { frac: 1, label: 'π/a' }
    ],
    bandColors: [QUANTITIES.omega.color, QUANTITIES.omegaOpt.color],
    defaultColor: QUANTITIES.omega.color
  }

  // 3. Rami 3D e cristalli reali (PbTe polare da physics/phonon3d.ts lungo Γ–X–K–Γ–L, Tab. 1)
  const disp3d = computePhonon3DDispersion(defaultParamsForCrystal('pbte'), 25)
  const n3 = disp3d.path.points.length
  const maxDist3 = disp3d.path.distance[n3 - 1] || 1
  const kNorm3 = new Float64Array(n3)
  for (let i = 0; i < n3; i++) kNorm3[i] = disp3d.path.distance[i] / maxDist3
  const kLabels3: CurveLabel[] = disp3d.path.labels.map((l) => ({
    frac: disp3d.path.distance[l.index] / maxDist3,
    label: l.label
  }))
  const s3: MethodPreviewData = {
    id: 'phonon-3d',
    title: 'Rami 3D e cristalli',
    subtitle: 'Rami LA, TA, LO e TO lungo Γ–X–K–Γ–L (PbTe)',
    bands: disp3d.branches.map((b) => b.freqThz),
    kNormalized: kNorm3,
    eMin: -0.2,
    eMax: disp3d.maxFreqThz * 1.15,
    kLabels: kLabels3,
    bandColors: [
      DERIVED_TONES.acousticTransverse.color,
      DERIVED_TONES.acousticTransverse.color,
      QUANTITIES.omega.color,
      DERIVED_TONES.opticalTransverse.color,
      DERIVED_TONES.opticalTransverse.color,
      QUANTITIES.omegaOpt.color
    ],
    defaultColor: QUANTITIES.omega.color
  }

  // 4. Pacchetti d'onda: metà zona [0, π/a] con v_g > 0 (acustico) e v_g < 0 (ottico)
  const wp = diatomicPreviewFromPhysics(N, 5.64, 23, 35.5, 10, 0, 1)
  const max4 = wp.optical[0]
  const s4: MethodPreviewData = {
    id: 'phonon-wavepacket',
    title: 'Pacchetti d’onda',
    subtitle: 'Velocità di fase v_p e di gruppo v_g su rami acustico e ottico',
    bands: [wp.acoustic, wp.optical],
    kNormalized: wp.kNorm,
    eMin: -0.25,
    eMax: max4 * 1.14,
    kLabels: [
      { frac: 0, label: '0' },
      { frac: 0.5, label: 'π/2a' },
      { frac: 1, label: 'π/a' }
    ],
    bandColors: [QUANTITIES.omega.color, QUANTITIES.omegaOpt.color],
    defaultColor: QUANTITIES.omega.color
  }

  // 5. Modi quantizzati (oscillatore armonico: parabola V(Q) e densità |Ψ_0|², |Ψ_2|²)
  const kNorm5 = makeLinearAxis(N)
  const pot = new Float64Array(N)
  const psi0 = new Float64Array(N)
  const psi2 = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const q = -2.8 + 5.6 * kNorm5[i]
    pot[i] = 0.5 * q * q
    const g = Math.exp(-q * q)
    psi0[i] = 0.5 + 0.9 * g
    const h2 = 2 * q * q - 1
    psi2[i] = 2.5 + 0.35 * h2 * h2 * g
  }
  const s5: MethodPreviewData = {
    id: 'phonon-quantum',
    title: 'Modi quantizzati',
    subtitle: 'Oscillatore armonico quantistico, punto zero e processi Umklapp',
    bands: [pot, psi0, psi2],
    kNormalized: kNorm5,
    eMin: -0.2,
    eMax: 4.3,
    kLabels: [
      { frac: 0.14, label: '−a' },
      { frac: 0.5, label: '0' },
      { frac: 0.86, label: '+a' }
    ],
    bandColors: [QUANTITIES.Ek.color, QUANTITIES.psi.color, QUANTITIES.omega.color],
    defaultColor: QUANTITIES.psi.color
  }

  // 6. Calore specifico: Dulong–Petit (3R), Einstein (Θ_E = 0,75 Θ_D) e Debye
  const kNorm6 = makeLinearAxis(N)
  const dulong = new Float64Array(N)
  const einstein = new Float64Array(N)
  const debye = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const tRatio = 1.5 * kNorm6[i] // T / Θ_D in [0, 1.5]
    dulong[i] = 1
    einstein[i] = einsteinCvOver3R(tRatio / 0.75)
    debye[i] = debyeCvOver3R(tRatio)
  }
  const s6: MethodPreviewData = {
    id: 'phonon-specific-heat',
    title: 'Calore specifico e Debye',
    subtitle: 'Confronto Dulong–Petit, Einstein e legge T³ di Debye',
    bands: [dulong, einstein, debye],
    kNormalized: kNorm6,
    eMin: -0.06,
    eMax: 1.14,
    kLabels: [
      { frac: 0, label: '0' },
      { frac: 1 / 3, label: '0,5' },
      { frac: 2 / 3, label: 'Θ_{D}' },
      { frac: 1, label: '1,5' }
    ],
    bandColors: [QUANTITIES.Ek.color, QUANTITIES.omegaOpt.color, QUANTITIES.CV.color],
    defaultColor: QUANTITIES.CV.color
  }

  return [s1, s2, s3, s4, s5, s6]
}

let cachedPhononPreview: readonly MethodPreviewData[] | null = null

export function getPhononPreviewCurves(): readonly MethodPreviewData[] {
  if (!cachedPhononPreview) {
    cachedPhononPreview = computePhononPreviewCurves()
  }
  return cachedPhononPreview
}
