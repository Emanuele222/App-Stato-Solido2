/**
 * Reticolo vuoto e schemi di zona in 1D (dispensa P3 §9.3, §11.6 e P4 §5.1):
 * ripiegamento nella prima zona, corrispondenza tra zona estesa, ridotta e
 * periodica, incroci dei rami e parte reale dell'onda piana sugli ioni.
 * Unità: Å, Å⁻¹, eV.
 */
import { HBAR2_OVER_2M0 } from './constants'
import { freeElectronEnergy, reciprocalVector1D, zoneBoundaryEnergy } from './freeElectron'

export interface FoldedState1D {
  /** Vettore d'onda nella zona estesa k = k′ + G (Å⁻¹). */
  readonly kExtended: number
  /** Vettore d'onda nella prima zona (−π/a, π/a] (Å⁻¹). */
  readonly kReduced: number
  /** Indice intero n del vettore reciproco G = 2πn/a. */
  readonly n: number
  /** Vettore del reticolo reciproco G = 2πn/a (Å⁻¹). */
  readonly G: number
  /** Indice della zona di Brillouin nella zona estesa (1 = prima, 2 = seconda, …). */
  readonly zone: number
  /** Indice di banda nello schema ridotto (0 = la più bassa). */
  readonly band: number
  /** Energia libera E = ħ²k²/2m₀ (eV). */
  readonly energy: number
}

export interface EmptyLatticeCrossing {
  /** Ordine dell'incrocio (1 = bande 1–2, 2 = bande 2–3, …). */
  readonly order: number
  /** Indice 0-based della banda inferiore coinvolta. */
  readonly lowerBand: number
  /** Posizione nella zona estesa (k > 0, Å⁻¹). */
  readonly kExtended: number
  /** Posizione ripiegata nella prima zona (0 o π/a, Å⁻¹). */
  readonly kReduced: number
  /** 'edge' (±π/a, ordine dispari) o 'center' (k = 0, ordine pari). */
  readonly location: 'edge' | 'center'
  /** Energia dell'incrocio, order² · E₀ (eV). */
  readonly energy: number
}

export interface ZoneFoldingSegment {
  /** Indice della zona di Brillouin (1, 2, …). */
  readonly zone: number
  /** Semiasse nella zona estesa (−1 o +1). */
  readonly side: -1 | 1
  /** Indice intero n di G = 2πn/a tale che k_ext = k′ + G. */
  readonly n: number
  /** G = 2πn/a (Å⁻¹): per passare dall'estesa alla ridotta si trasla di −G. */
  readonly G: number
  /** Estremo vicino all'origine nella zona estesa (Å⁻¹). */
  readonly kExtStart: number
  /** Estremo lontano dall'origine nella zona estesa (Å⁻¹). */
  readonly kExtEnd: number
  /** Estremo corrispondente nella zona ridotta (Å⁻¹). */
  readonly kRedStart: number
  /** Estremo corrispondente nella zona ridotta (Å⁻¹). */
  readonly kRedEnd: number
  /** Indice di banda nella zona ridotta (0-based, = zone − 1). */
  readonly band: number
}

/**
 * Ripiega un vettore d'onda esteso `kExtended` (Å⁻¹) nella prima zona
 * −π/a < k′ ≤ π/a tramite k = k′ + G con G = 2πn/a (P3 §9.3, P4 §5.1).
 */
export function foldToFirstZone1D(kExtended: number, a: number): FoldedState1D {
  if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`)
  if (!Number.isFinite(kExtended)) throw new RangeError(`k non valido: ${kExtended}`)
  const G1 = reciprocalVector1D(a)
  const edge = Math.PI / a
  let n = Math.round(kExtended / G1)
  let kReduced = kExtended - n * G1
  if (kReduced <= -edge * (1 - 1e-12)) {
    n -= 1
    kReduced += G1
  } else if (kReduced > edge * (1 + 1e-12)) {
    n += 1
    kReduced -= G1
  }
  if (Math.abs(kReduced - edge) <= 1e-12 * edge) kReduced = edge
  if (Math.abs(kReduced) <= 1e-13 * edge) kReduced = 0
  n = n === 0 ? 0 : n
  const G = n * G1
  const zone = Math.max(1, Math.ceil(Math.abs(kExtended) / edge - 1e-12))
  return {
    kExtended,
    kReduced,
    n,
    G,
    zone,
    band: zone - 1,
    energy: freeElectronEnergy(kExtended)
  }
}

/**
 * Indice intero n del ramo G = 2πn/a che realizza la banda `band` (0-based)
 * nel punto `kReduced` della prima zona [−π/a, π/a].
 */
export function emptyLatticeBranchIndex(kReduced: number, band: number, a: number): number {
  if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`)
  if (!Number.isInteger(band) || band < 0) throw new RangeError(`indice di banda non valido: ${band}`)
  const edge = Math.PI / a
  if (!Number.isFinite(kReduced) || Math.abs(kReduced) > edge * (1 + 1e-9)) {
    throw new RangeError(`kReduced fuori prima zona: ${kReduced}`)
  }
  if (band === 0) return 0
  const m = band + 1
  const mag = Math.floor(m / 2)
  const neg = kReduced < -1e-12 * edge
  if (m % 2 === 0) return neg ? mag : -mag
  return neg ? -mag : mag
}

/**
 * Stato del reticolo vuoto sul ramo `branchN` (G = 2π·branchN/a) nel punto
 * `kReduced` ∈ [−π/a, π/a].
 */
export function emptyLatticeBranchState1D(kReduced: number, branchN: number, a: number): FoldedState1D {
  if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`)
  if (!Number.isInteger(branchN)) throw new RangeError(`indice di ramo non valido: ${branchN}`)
  const edge = Math.PI / a
  if (!Number.isFinite(kReduced) || Math.abs(kReduced) > edge * (1 + 1e-9)) {
    throw new RangeError(`kReduced fuori prima zona: ${kReduced}`)
  }
  const G1 = reciprocalVector1D(a)
  const n = branchN === 0 ? 0 : branchN
  const G = n * G1
  const kExtended = kReduced + G
  const zone = Math.max(1, Math.ceil(Math.abs(kExtended) / edge - 1e-12))
  return {
    kExtended,
    kReduced: Math.abs(kReduced) <= 1e-13 * edge ? 0 : kReduced,
    n,
    G,
    zone,
    band: zone - 1,
    energy: freeElectronEnergy(kExtended)
  }
}

/**
 * Energia E(k) lungo il singolo ramo `branchN` (parabola liscia centrata in
 * −2π·branchN/a), adatta alle derivate numeriche di `semiclassical.ts` anche
 * in corrispondenza degli incroci.
 */
export function emptyLatticeBranchFunction(branchN: number, a: number): (k: number) => number {
  if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`)
  if (!Number.isInteger(branchN)) throw new RangeError(`indice di ramo non valido: ${branchN}`)
  const G = branchN * reciprocalVector1D(a)
  return (k: number) => freeElectronEnergy(k + G)
}

/**
 * Incroci fra bande successive nello schema ridotto (P3 §9.3, tabella gap ed
 * esempio): dispari al bordo ±π/a (E₀, 9E₀, …), pari al centro k = 0 (4E₀, 16E₀, …).
 */
export function emptyLatticeCrossings1D(a: number, count = 3): readonly EmptyLatticeCrossing[] {
  if (!Number.isInteger(count) || count < 1) throw new RangeError(`count non valido: ${count}`)
  const edge = Math.PI / a
  const E0 = zoneBoundaryEnergy(a)
  const out: EmptyLatticeCrossing[] = []
  for (let m = 1; m <= count; m++) {
    const odd = m % 2 === 1
    out.push({
      order: m,
      lowerBand: m - 1,
      kExtended: m * edge,
      kReduced: odd ? edge : 0,
      location: odd ? 'edge' : 'center',
      energy: m * m * E0
    })
  }
  return out
}

/**
 * Tratti della parabola della zona estesa da traslare di −G per ottenere lo
 * schema a zona ridotta, per zone 1…`maxZone` su entrambi i semiassi.
 */
export function zoneFoldingSegments1D(a: number, maxZone: number): readonly ZoneFoldingSegment[] {
  if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`)
  if (!Number.isInteger(maxZone) || maxZone < 1) throw new RangeError(`maxZone non valido: ${maxZone}`)
  const edge = Math.PI / a
  const G1 = reciprocalVector1D(a)
  const out: ZoneFoldingSegment[] = []
  for (let zone = 1; zone <= maxZone; zone++) {
    for (const side of [-1, 1] as const) {
      const n = side * Math.floor(zone / 2)
      const G = n * G1
      const kExtStart = side * (zone - 1) * edge
      const kExtEnd = side * zone * edge
      out.push({
        zone,
        side,
        n: n === 0 ? 0 : n,
        G,
        kExtStart,
        kExtEnd,
        kRedStart: kExtStart - G,
        kRedEnd: kExtEnd - G,
        band: zone - 1
      })
    }
  }
  return out
}

/** Bordo della prima zona di Brillouin in 1D, π/a (Å⁻¹), a in Å (P3 §9.3). */
export function zoneEdge1D(a: number): number {
  if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`)
  return Math.PI / a
}

/**
 * Inversione della parabola libera E = ħ²k²/2m₀: |k| = √(2m₀E)/ħ (Å⁻¹) per
 * E ≥ 0 (eV); per E < 0 non c'è onda piana libera e si restituisce 0.
 */
export function freeElectronWaveNumber(energy: number): number {
  if (!Number.isFinite(energy)) throw new RangeError(`energia non valida: ${energy}`)
  return energy > 0 ? Math.sqrt(energy / HBAR2_OVER_2M0) : 0
}

export interface BranchCoordinates1D {
  /** k′ in unità di π/a, in [−1, 1]. */
  readonly kFracReduced: number
  /** Indice n del ramo G = 2πn/a, limitato a |n| ≤ maxBranchN. */
  readonly branchN: number
  /** k esteso in unità di π/a (k = k′ + G ⇒ k/(π/a) = k′/(π/a) + 2n). */
  readonly kFracExtended: number
}

/**
 * Coordinate di ramo (k′, n) di un vettore d'onda esteso (Å⁻¹): ripiegamento
 * k = k′ + G con G = 2πn/a. Se il ramo richiesto supera `maxBranchN` si usa il
 * ramo estremo e k′ si ferma al bordo ±π/a (la parabola mostrata finisce lì).
 */
export function branchCoordinates1D(kExtended: number, a: number, maxBranchN: number): BranchCoordinates1D {
  if (!Number.isInteger(maxBranchN) || maxBranchN < 0) throw new RangeError(`maxBranchN non valido: ${maxBranchN}`)
  const folded = foldToFirstZone1D(kExtended, a)
  const n = Math.max(-maxBranchN, Math.min(maxBranchN, folded.n))
  const edge = zoneEdge1D(a)
  const kFracReduced = Math.max(-1, Math.min(1, (kExtended - n * reciprocalVector1D(a)) / edge))
  return { kFracReduced, branchN: n === 0 ? 0 : n, kFracExtended: kFracReduced + 2 * n }
}

/** Parte reale dell'onda piana Re(e^{i(k′+G)x}) = cos(k_ext · x) nei punti `xs` (Å). */
export function planeWaveRealPart1D(kExtended: number, xs: ArrayLike<number>): Float64Array {
  const out = new Float64Array(xs.length)
  for (let i = 0; i < xs.length; i++) out[i] = Math.cos(kExtended * xs[i])
  return out
}

/** Fase k′·a (rad) accumulata da uno ione al successivo: e^{i(k′+G)a} = e^{ik′a}. */
export function planeWaveIonPhaseAngle(kReduced: number, a: number): number {
  if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`)
  return kReduced * a
}

/**
 * Parte reale dell'onda piana sullo ione m-esimo in x = m·a:
 * Re(e^{i(k′+G)·m·a}) = cos(k′·m·a), identica per tutti i rami G = 2πn/a.
 */
export function planeWaveRealPartAtIon(kReduced: number, a: number, ionIndex: number): number {
  return Math.cos(ionIndex * planeWaveIonPhaseAngle(kReduced, a))
}
