/**
 * Metodo k·p vicino a Γ (dispensa P4 §3, «Il metodo k·p»; P4 formulario «Metodo k·p»):
 *  - parametro ottico di Kane P e energia caratteristica E_P = 2m₀P²/ħ²;
 *  - accoppiamento spin–orbita alla cima della valenza p (L = 1, S = 1/2):
 *    separazione Δ = (3/2)λħ² tra J = 3/2 (hh, lh) e J = 1/2 (so);
 *  - modello di Kane a quattro bande (slide 41: c, hh, lh, so);
 *  - modello esatto a due bande (matrice 2×2 in k, autovalori E±, sviluppo per Pk ≪ E_g);
 *  - scomposizione dei contributi a m₀/m* e verifica della formula generale
 *    sugli elettroni quasi liberi al bordo di zona.
 *
 * Unità: k in Å⁻¹, energie (E, E_g, Δ, E_P) in eV, P in eV·Å.
 * Zero delle energie nei diagrammi di Kane / due bande: cima della banda di valenza in Γ.
 */
import { kPathFromVertices, type BandStructure, type KPath } from './bandStructure'
import {
  centralEquationBand,
  solveCentralEquation1D,
  type CentralSolution1D,
  type PeriodicPotential1D
} from './centralEquation1d'
import { HBAR2_OVER_2M0, HBAR2_OVER_M0 } from './constants'
import { zoneEdge1D } from './emptyLattice'
import { eigenvector } from './linalg'
import { inverseEffectiveMassRatio } from './semiclassical'

export type KpVariant = 'kane' | 'two-band'
export type KpKaneBandRole = 'so' | 'lh' | 'hh' | 'c'
export type KpTwoBandRole = 'lh' | 'hh' | 'c'

export interface KaneParams {
  /** Gap diretto in Γ, E_g > 0 (eV). */
  readonly eg: number
  /** Separazione spin–orbita in Γ, Δ ≥ 0 (eV). */
  readonly delta: number
  /** Energia di Kane E_P = 2m₀P²/ħ² ≥ 0 (eV). */
  readonly ep: number
}

export interface TwoBandParams {
  /** Gap diretto in Γ, E_g > 0 (eV). */
  readonly eg: number
  /** Energia di Kane E_P = 2m₀P²/ħ² ≥ 0 (eV). */
  readonly ep: number
}

export interface KaneMasses {
  /** Rapporto m_c / m₀ (conduzione). */
  readonly mc: number
  /** Rapporto m_hh / m₀ (= 1 nella formula di Kane/Kittel della slide 41). */
  readonly mhh: number
  /** Rapporto m_lh / m₀ (massa della lacuna leggera, > 0). */
  readonly mlh: number
  /** Rapporto m_so / m₀ (massa della lacuna split-off, > 0). */
  readonly mso: number
  /** Inverso m₀ / m_c. */
  readonly invMc: number
  /** Inverso m₀ / m_hh (= 1). */
  readonly invMhh: number
  /** Inverso m₀ / m_lh (> 0). */
  readonly invMlh: number
  /** Inverso m₀ / m_so (> 0). */
  readonly invMso: number
  /** Parametro ottico di Kane P = √((ħ²/2m₀)E_P) in eV·Å. */
  readonly pKane: number
}

export interface SpinOrbitLevel {
  readonly id: string
  readonly label: string
  readonly orbital: 's' | 'p'
  readonly jLabel: string
  readonly mjLabel: string
  readonly states: number
  /** Spostamento rispetto al baricentro p non perturbato (eV; s resta non accoppiato). */
  readonly shiftFromBarycenter: number
  /** Energia in Γ nello zero della banda di valenza (VBM = 0, conduction = E_g). */
  readonly energyRelativeToVbm: number
  readonly bandRole: KpKaneBandRole
}

export interface SpinOrbitGammaSummary {
  readonly eg: number
  readonly delta: number
  /** λħ² = (2/3)Δ in eV. */
  readonly lambdaHbar2: number
  /** Spostamento di J = 3/2 rispetto al livello p non perturbato (+½λħ² = +Δ/3). */
  readonly j32Shift: number
  /** Spostamento di J = 1/2 rispetto al livello p non perturbato (−λħ² = −2Δ/3). */
  readonly j12Shift: number
  /** Quota del baricentro p (senza H_so) rispetto alla cima di valenza (−Δ/3). */
  readonly pBarycenterRelativeToVbm: number
  /** Somma pesata sugli stati 4·(+Δ/3) + 2·(−2Δ/3) (deve valere 0). */
  readonly barycenterCheck: number
  readonly withoutSo: readonly SpinOrbitLevel[]
  readonly withSo: readonly SpinOrbitLevel[]
}

export type MassTermSource = 'free' | 'c' | 'hh' | 'lh' | 'so'

export interface MassContributionTerm {
  readonly source: MassTermSource
  /** Contributo adimensionale a m₀/m* (con segno dalla curvatura d²E/dk²). */
  readonly value: number
}

export interface MassBreakdown {
  /** m₀ / m* totale della banda scelta (con il segno di d²E/dk²). */
  readonly totalInvMass: number
  /** m* / m₀ = 1 / totalInvMass (con segno). */
  readonly effectiveMassRatio: number
  /** Modulo |m* / m₀|. */
  readonly massMagnitude: number
  /** Convenzione del termine libero (slide 41 scrive −ħ²k²/2m₀ nelle valenze). */
  readonly freeTermConvention: 'standard' | 'kittel-valence-flip'
  readonly terms: readonly MassContributionTerm[]
}

export interface TwoBandState {
  /** Energie [E_-(lh), E_hh_uncoupled, E_+(c)] in eV. */
  readonly energies: readonly [number, number, number]
  /** Sviluppo parabolico in Γ (valido per P·k ≪ E_g). */
  readonly parabolic: { readonly c: number; readonly lh: number }
  /** Rapporto |P·k| / (E_g/2): < 1 entro il criterio indicativo di validità parabolica. */
  readonly pkOverHalfEg: number
  readonly withinValidity: boolean
}

export interface PlaneWaveKpTerm {
  readonly bandIndex: number
  readonly energy: number
  /** |⟨ψ_n|p̂|ψ_j⟩|² / ħ² in Å⁻². */
  readonly momentumSq: number
  readonly energyDiff: number
  readonly invMassContribution: number
}

export interface NearlyFreeKpSummary {
  readonly k0: number
  readonly band: number
  readonly energy: number
  readonly gapAtZoneEdge: number
  readonly e0: number
  /** m₀/m* dalla somma su tutte le bande incluse nel calcolo. */
  readonly invMassSum: number
  /** m₀/m* dalla curvatura numerica esatta `inverseEffectiveMassRatio`. */
  readonly invMassExact: number
  /** Stima analitica a due bande 1 ± 4E₀/E_g. */
  readonly invMassTwoBand: number
  /** |⟨ψ_0|p̂|ψ_1⟩| / ħ in Å⁻¹ (nel modello a due bande vale π/a). */
  readonly p01Abs: number
  readonly terms: readonly PlaneWaveKpTerm[]
}

/** Parametro ottico di Kane P = √((ħ²/2m₀)E_P) in eV·Å (P4 §3, eq. di Kane). */
export function kanePFromEp(ep: number): number {
  if (!(ep >= 0) || !Number.isFinite(ep)) throw new RangeError(`E_P non valido: ${ep}`)
  return Math.sqrt(HBAR2_OVER_2M0 * ep)
}

/** Energia caratteristica di Kane E_P = 2m₀P²/ħ² in eV. */
export function kaneEpFromP(p: number): number {
  if (!(p >= 0) || !Number.isFinite(p)) throw new RangeError(`P di Kane non valido: ${p}`)
  return (p * p) / HBAR2_OVER_2M0
}

/** Cammino simmetrico in 1D attorno a Γ, −kMax ≤ k ≤ kMax in Å⁻¹ (con k = 0 incluso). */
export function kDotPPath1D(kMax: number, nPoints: number = 241): KPath {
  if (!(kMax > 0) || !Number.isFinite(kMax)) throw new RangeError(`kMax non valido: ${kMax}`)
  if (!Number.isInteger(nPoints) || nPoints < 5 || nPoints % 2 === 0) {
    throw new RangeError(`nPoints deve essere un intero dispari ≥ 5: ${nPoints}`)
  }
  const halfSegments = (nPoints - 1) / 2
  return kPathFromVertices(
    [
      { label: '−k_max', k: [-kMax, 0, 0] },
      { label: 'Γ', k: [0, 0, 0] },
      { label: '+k_max', k: [kMax, 0, 0] }
    ],
    halfSegments,
    1
  )
}

/**
 * Schema dei livelli in Γ senza e con spin–orbita H_so = λ L·S (P4 §3, fig. 3.1a / slide 42):
 *  - Δ = (3/2)λħ² ⇒ λħ² = (2/3)Δ;
 *  - L = 1, S = 1/2: J = 3/2 (4 stati, +½λħ² = +Δ/3) e J = 1/2 (2 stati, −λħ² = −2Δ/3);
 *  - stati s (L = 0): L·S = 0, nessuna separazione.
 */
export function spinOrbitGammaLevels(eg: number, delta: number): SpinOrbitGammaSummary {
  validateKane({ eg, delta, ep: 0 })
  const lambdaHbar2 = (2 * delta) / 3
  const j32Shift = 0.5 * lambdaHbar2
  const j12Shift = delta === 0 ? 0 : -lambdaHbar2
  const barycenterCheck = 4 * j32Shift + 2 * j12Shift
  const pBarycenter = delta === 0 ? 0 : -delta / 3

  return {
    eg,
    delta,
    lambdaHbar2,
    j32Shift,
    j12Shift,
    pBarycenterRelativeToVbm: pBarycenter,
    barycenterCheck,
    withoutSo: [
      {
        id: 'c-unsplit',
        label: 'c (L=0)',
        orbital: 's',
        jLabel: 'S = ½',
        mjLabel: '±½',
        states: 2,
        shiftFromBarycenter: 0,
        energyRelativeToVbm: eg,
        bandRole: 'c'
      },
      {
        id: 'v-unsplit',
        label: 'p (L=1)',
        orbital: 'p',
        jLabel: 'L = 1',
        mjLabel: '0, ±1 (×2)',
        states: 6,
        shiftFromBarycenter: 0,
        energyRelativeToVbm: pBarycenter,
        bandRole: 'hh'
      }
    ],
    withSo: [
      {
        id: 'c',
        label: 'c',
        orbital: 's',
        jLabel: 'J = ½',
        mjLabel: '±½',
        states: 2,
        shiftFromBarycenter: 0,
        energyRelativeToVbm: eg,
        bandRole: 'c'
      },
      {
        id: 'hh',
        label: 'hh',
        orbital: 'p',
        jLabel: 'J = 3/2',
        mjLabel: '±3/2',
        states: 2,
        shiftFromBarycenter: j32Shift,
        energyRelativeToVbm: 0,
        bandRole: 'hh'
      },
      {
        id: 'lh',
        label: 'lh',
        orbital: 'p',
        jLabel: 'J = 3/2',
        mjLabel: '±1/2',
        states: 2,
        shiftFromBarycenter: j32Shift,
        energyRelativeToVbm: 0,
        bandRole: 'lh'
      },
      {
        id: 'so',
        label: 'so',
        orbital: 'p',
        jLabel: 'J = 1/2',
        mjLabel: '±1/2',
        states: 2,
        shiftFromBarycenter: j12Shift,
        energyRelativeToVbm: -delta,
        bandRole: 'so'
      }
    ]
  }
}

/** Masse efficaci del modello a 4 bande di Kane (P4 §3, slide 41). */
export function kaneEffectiveMasses(params: KaneParams): KaneMasses {
  validateKane(params)
  const { eg, delta, ep } = params
  const invMc = 1 + (ep / 3) * (2 / eg + 1 / (eg + delta))
  const invMhh = 1
  const invMlh = 1 + (2 * ep) / (3 * eg)
  const invMso = 1 + ep / (3 * (eg + delta))
  return {
    mc: 1 / invMc,
    mhh: 1,
    mlh: 1 / invMlh,
    mso: 1 / invMso,
    invMc,
    invMhh,
    invMlh,
    invMso,
    pKane: kanePFromEp(ep)
  }
}

/**
 * Energie delle 4 bande di Kane in k (Å⁻¹), nell'ordine [so, lh, hh, c] (slide 41):
 *  - E_so = −Δ − ħ²k²/2m₀ − P²k² / [3(E_g + Δ)]
 *  - E_lh = −ħ²k²/2m₀ − 2P²k² / (3E_g)
 *  - E_hh = −ħ²k²/2m₀
 *  - E_c  = E_g + ħ²k²/2m₀ + (P²k²/3)(2/E_g + 1/(E_g + Δ))
 */
export function kaneEnergiesAt(params: KaneParams, k: number): readonly [number, number, number, number] {
  validateKane(params)
  if (!Number.isFinite(k)) throw new RangeError(`k non valido: ${k}`)
  const { eg, delta, ep } = params
  const free = HBAR2_OVER_2M0 * k * k
  const pk2 = free * ep // poiché P² = (ħ²/2m₀)E_P ⇒ P²k² = (ħ²k²/2m₀)E_P
  const eSo = -delta - free - pk2 / (3 * (eg + delta))
  const eLh = -free - (2 * pk2) / (3 * eg)
  const eHh = -free
  const eC = eg + free + (pk2 / 3) * (2 / eg + 1 / (eg + delta))
  return [eSo, eLh, eHh, eC]
}

/** Struttura a bande del modello di Kane [so, lh, hh, c] lungo `path`. */
export function kaneBands(params: KaneParams, path: KPath): BandStructure<KpKaneBandRole> {
  if (path.dimension !== 1) throw new RangeError('kaneBands: serve un cammino 1D')
  validateKane(params)
  const nPts = path.points.length
  const eSo = new Float64Array(nPts)
  const eLh = new Float64Array(nPts)
  const eHh = new Float64Array(nPts)
  const eC = new Float64Array(nPts)
  for (let i = 0; i < nPts; i++) {
    const [so, lh, hh, c] = kaneEnergiesAt(params, path.points[i][0])
    eSo[i] = so
    eLh[i] = lh
    eHh[i] = hh
    eC[i] = c
  }
  return { method: 'k-dot-p', path, energies: [eSo, eLh, eHh, eC] }
}

/** Parabola dell'elettrone libero dal fondo della conduzione E_g + ħ²k²/2m₀ (confronto per Kane). */
export function kaneConductionFreeParabola(eg: number, path: KPath): BandStructure {
  if (path.dimension !== 1) throw new RangeError('kaneConductionFreeParabola: serve un cammino 1D')
  if (!(eg > 0) || !Number.isFinite(eg)) throw new RangeError(`E_g non valido: ${eg}`)
  const eFree = new Float64Array(path.points.length)
  for (let i = 0; i < path.points.length; i++) {
    const k = path.points[i][0]
    eFree[i] = eg + HBAR2_OVER_2M0 * k * k
  }
  return { method: 'empty-lattice', path, energies: [eFree] }
}

/** Soglia indicativa in k (Å⁻¹) oltre cui |P·k| = E_g/2 e il modello a due bande si stacca dalla parabola. */
export function twoBandValidityLimitK(eg: number, ep: number): number {
  validateTwoBand({ eg, ep })
  if (ep === 0) return Infinity
  return eg / (2 * kanePFromEp(ep))
}

/**
 * Modello esatto a due bande senza spin–orbita (P4 §3, approfondimento «modello a due bande»):
 * autovalori della matrice H = [[E_g, Pk], [Pk, 0]] + ħ²k²/2m₀, più le due valenze |X⟩, |Y⟩ non accoppiate (+ħ²k²/2m₀).
 */
export function twoBandStateAt(params: TwoBandParams, k: number): TwoBandState {
  validateTwoBand(params)
  if (!Number.isFinite(k)) throw new RangeError(`k non valido: ${k}`)
  const { eg, ep } = params
  const free = HBAR2_OVER_2M0 * k * k
  const pk2 = free * ep
  const halfEg = 0.5 * eg
  const root = Math.sqrt(halfEg * halfEg + pk2)
  const eMinus = free + halfEg - root
  const ePlus = free + halfEg + root
  const eHhUncoupled = free
  const cPar = eg + free + pk2 / eg
  const lhPar = free - pk2 / eg
  const pk = Math.sqrt(pk2)
  const pkOverHalfEg = pk / halfEg
  return {
    energies: [eMinus, eHhUncoupled, ePlus],
    parabolic: { c: cPar, lh: lhPar },
    pkOverHalfEg,
    withinValidity: pkOverHalfEg < 1
  }
}

/** Struttura a bande del modello esatto a due bande: [lh (E_-), valenza non accoppiata (|X⟩,|Y⟩), c (E_+)]. */
export function twoBandExactBands(params: TwoBandParams, path: KPath): BandStructure<KpTwoBandRole> {
  if (path.dimension !== 1) throw new RangeError('twoBandExactBands: serve un cammino 1D')
  validateTwoBand(params)
  const nPts = path.points.length
  const eLh = new Float64Array(nPts)
  const eHh = new Float64Array(nPts)
  const eC = new Float64Array(nPts)
  for (let i = 0; i < nPts; i++) {
    const s = twoBandStateAt(params, path.points[i][0])
    eLh[i] = s.energies[0]
    eHh[i] = s.energies[1]
    eC[i] = s.energies[2]
  }
  return { method: 'k-dot-p', path, energies: [eLh, eHh, eC] }
}

/** Parabole di massa efficace in Γ del modello a due bande: [E_lh^par, E_hh^free, E_c^par]. */
export function twoBandParabolicBands(params: TwoBandParams, path: KPath): BandStructure {
  if (path.dimension !== 1) throw new RangeError('twoBandParabolicBands: serve un cammino 1D')
  validateTwoBand(params)
  const nPts = path.points.length
  const eLh = new Float64Array(nPts)
  const eHh = new Float64Array(nPts)
  const eC = new Float64Array(nPts)
  for (let i = 0; i < nPts; i++) {
    const s = twoBandStateAt(params, path.points[i][0])
    eLh[i] = s.parabolic.lh
    eHh[i] = s.energies[1]
    eC[i] = s.parabolic.c
  }
  return { method: 'k-dot-p', path, energies: [eLh, eHh, eC] }
}

/**
 * Scomposizione di m₀/m* nei suoi addendi per la variante di Kane (slide 41):
 *  - conduzione c: +1 (libero) + (2E_P/3)/E_g (da lh) + (E_P/3)/(E_g+Δ) (da so);
 *  - lacune pesanti hh: −1 (termine libero slide 41) + 0 (nessuna banda accoppiata);
 *  - lacune leggere lh: −1 (termine libero slide 41) − (2E_P/3)/E_g (da c sopra);
 *  - split-off so: −1 (termine libero slide 41) − (E_P/3)/(E_g+Δ) (da c sopra).
 */
export function kaneMassBreakdown(params: KaneParams, role: KpKaneBandRole): MassBreakdown {
  validateKane(params)
  const { eg, delta, ep } = params
  const cFromLh = (2 * ep) / (3 * eg)
  const cFromSo = ep / (3 * (eg + delta))
  let terms: MassContributionTerm[]
  let convention: MassBreakdown['freeTermConvention'] = 'standard'
  if (role === 'c') {
    terms = [
      { source: 'free', value: 1 },
      { source: 'lh', value: cFromLh },
      { source: 'so', value: cFromSo }
    ]
  } else if (role === 'hh') {
    convention = 'kittel-valence-flip'
    terms = [{ source: 'free', value: -1 }]
  } else if (role === 'lh') {
    convention = 'kittel-valence-flip'
    terms = [
      { source: 'free', value: -1 },
      { source: 'c', value: -cFromLh }
    ]
  } else {
    convention = 'kittel-valence-flip'
    terms = [
      { source: 'free', value: -1 },
      { source: 'c', value: -cFromSo }
    ]
  }
  const totalInvMass = terms.reduce((acc, t) => acc + t.value, 0)
  const eff = 1 / totalInvMass
  return {
    totalInvMass,
    effectiveMassRatio: eff,
    massMagnitude: Math.abs(eff),
    freeTermConvention: convention,
    terms
  }
}

/**
 * Scomposizione esatta di m₀/m*(k) = (d²E/dk²)/(ħ²/m₀) nel modello a due bande:
 *  - c (E_+): +1 (libero) + (E_P/E_g)·[1 + 4P²k²/E_g²]^(−3/2) (da lh sotto);
 *  - lh (E_-): +1 (libero) − (E_P/E_g)·[1 + 4P²k²/E_g²]^(−3/2) (da c sopra);
 *  - valenze non accoppiate (|X⟩,|Y⟩): +1 (libero) + 0.
 */
export function twoBandMassBreakdown(params: TwoBandParams, role: KpTwoBandRole, k: number = 0): MassBreakdown {
  validateTwoBand(params)
  if (!Number.isFinite(k)) throw new RangeError(`k non valido: ${k}`)
  const { eg, ep } = params
  const pk2 = HBAR2_OVER_2M0 * ep * k * k
  const factor = Math.pow(1 + (4 * pk2) / (eg * eg), -1.5)
  const coupling = (ep / eg) * factor
  const terms: MassContributionTerm[] =
    role === 'c'
      ? [
          { source: 'free', value: 1 },
          { source: 'lh', value: coupling }
        ]
      : role === 'lh'
        ? [
            { source: 'free', value: 1 },
            { source: 'c', value: -coupling }
          ]
        : [{ source: 'free', value: 1 }]
  const totalInvMass = terms.reduce((acc, t) => acc + t.value, 0)
  const eff = totalInvMass === 0 ? Infinity : 1 / totalInvMass
  return {
    totalInvMass,
    effectiveMassRatio: eff,
    massMagnitude: Math.abs(eff),
    freeTermConvention: 'standard',
    terms
  }
}

/** Modulo quadro |⟨ψ_A|p̂_x|ψ_B⟩|² / ħ² in Å⁻² fra due bande di una soluzione a onde piane in 1D. */
export function planeWaveMomentumElementSq(solution: CentralSolution1D, bandA: number, bandB: number): number {
  if (!solution.coefficients) throw new Error('Servono gli autostati (coefficients: true)')
  const vA = eigenvector(solution.coefficients, bandA)
  const vB = eigenvector(solution.coefficients, bandB)
  const G = (2 * Math.PI) / solution.a
  let re = 0
  let im = 0
  for (let i = 0; i < solution.g.length; i++) {
    const q = solution.k + solution.g[i] * G
    const ar = vA.re[i]
    const ai = vA.im ? vA.im[i] : 0
    const br = vB.re[i]
    const bi = vB.im ? vB.im[i] : 0
    // conj(cA) * cB * (k + G)
    re += (ar * br + ai * bi) * q
    im += (ar * bi - ai * br) * q
  }
  return re * re + im * im
}

/**
 * Applicazione della formula generale m₀/m*_n = 1 + (2/m₀) Σ_{j≠n} |⟨ψ_n|p̂|ψ_j⟩|² / (E_n − E_j)
 * alle bande degli elettroni quasi liberi in k₀ (default: bordo di zona π/a; dispensa P4 §3, verifica_kp.py).
 */
export function nearlyFreeKpVerification(
  potential: PeriodicPotential1D,
  k0: number = zoneEdge1D(potential.a),
  band: 0 | 1 = 1,
  planeWaves: number = 41
): NearlyFreeKpSummary {
  const sol = solveCentralEquation1D(potential, k0, { planeWaves, coefficients: true })
  const kb = zoneEdge1D(potential.a)
  const e0 = HBAR2_OVER_2M0 * kb * kb
  const gapAtZoneEdge = sol.energies[1] - sol.energies[0]
  const invMassTwoBand = band === 1 ? 1 + (4 * e0) / gapAtZoneEdge : 1 - (4 * e0) / gapAtZoneEdge

  const terms: PlaneWaveKpTerm[] = []
  let sum = 0
  for (let j = 0; j < planeWaves; j++) {
    if (j === band) continue
    const momentumSq = planeWaveMomentumElementSq(sol, band, j)
    const energyDiff = sol.energies[band] - sol.energies[j]
    const invMassContribution = (2 * HBAR2_OVER_M0 * momentumSq) / energyDiff
    sum += invMassContribution
    terms.push({
      bandIndex: j,
      energy: sol.energies[j],
      momentumSq,
      energyDiff,
      invMassContribution
    })
  }
  // Ordina i termini dal contributo di modulo più grande al più piccolo (per la scheda di verifica)
  terms.sort((a, b) => Math.abs(b.invMassContribution) - Math.abs(a.invMassContribution))

  const fn = centralEquationBand(potential, band, { planeWaves, basisK: k0 })
  const invMassExact = inverseEffectiveMassRatio(fn, k0)
  const p01Abs = Math.sqrt(planeWaveMomentumElementSq(sol, 0, 1))

  return {
    k0,
    band,
    energy: sol.energies[band],
    gapAtZoneEdge,
    e0,
    invMassSum: 1 + sum,
    invMassExact,
    invMassTwoBand,
    p01Abs,
    terms
  }
}

function validateKane(p: KaneParams): void {
  if (!(p.eg > 0) || !Number.isFinite(p.eg)) throw new RangeError(`E_g non valido: ${p.eg}`)
  if (!(p.delta >= 0) || !Number.isFinite(p.delta)) throw new RangeError(`Δ non valido: ${p.delta}`)
  if (!(p.ep >= 0) || !Number.isFinite(p.ep)) throw new RangeError(`E_P non valido: ${p.ep}`)
}

function validateTwoBand(p: TwoBandParams): void {
  if (!(p.eg > 0) || !Number.isFinite(p.eg)) throw new RangeError(`E_g non valido: ${p.eg}`)
  if (!(p.ep >= 0) || !Number.isFinite(p.ep)) throw new RangeError(`E_P non valido: ${p.ep}`)
}

/** Livello intrinseco a metà gap nel modello k·p (zero alla cima della valenza in Γ). */
export function intrinsicFermiLevel(eg: number): number {
  return 0.5 * eg
}
