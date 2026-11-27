/**
 * Manifest della sezione «Pacchetti d'onda: velocità di fase e di gruppo»
 * (dispensa Parte 6: Lezione 2 §6 pp. 14–17, Figg. 7–9, §12 pp. 29–30).
 * Registro dei regimi di dispersione, parametri (k₀, σ₀), preset e scelte numeriche.
 */
import type { DiatomicParams, MonatomicParams, WavepacketRegime } from '../../physics'
import type { QuantityId } from '../../ui/theme'

export type ParamId = 'kFrac' | 'sigma0InA'

export interface ParamSpec {
  readonly id: ParamId
  /** Simbolo in TeX. */
  readonly symbol: string
  readonly quantity: QuantityId
  readonly unit: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly initial: number
  readonly digits: number
}

export const PARAMS: readonly ParamSpec[] = [
  { id: 'kFrac', symbol: 'k_0', quantity: 'k', unit: 'π/a', min: -1.0, max: 1.0, step: 0.02, initial: 0.66, digits: 2 },
  { id: 'sigma0InA', symbol: '\\sigma_0', quantity: 'u', unit: 'a', min: 1.5, max: 6.0, step: 0.1, initial: 3.0, digits: 1 }
]

export type Params = Readonly<Record<ParamId, number>>

export const INITIAL_REGIME: WavepacketRegime = 'acoustic'

export const INITIAL_PARAMS: Params = {
  kFrac: 0.66,
  sigma0InA: 3.0
}

/** Metallo tipico (dispensa Parte 6, Lezione 1 §3, p. 9): M ≈ 63,2 u, a = 2,50 Å, C = 20 N/m. */
export const MONATOMIC_REF: MonatomicParams = {
  a: 2.5,
  massAmu: 63.2,
  springC: 20
}

/** Coppia Na–Cl (dispensa Parte 6, Lezione 2 §8, p. 23): m = 23 u, M = 35,5 u, a = 5,64 Å, C = 10 N/m. */
export const DIATOMIC_REF: DiatomicParams = {
  a: 5.64,
  massHeavyAmu: 35.5,
  massLightAmu: 23.0,
  springC: 10
}

export interface RegimeSpec {
  readonly id: WavepacketRegime
  readonly label: string
  readonly title: string
}

export const REGIMES: readonly RegimeSpec[] = [
  {
    id: 'linear',
    label: 'Lineare',
    title: 'Dispersione lineare ω = vₛ|k|: velocità di fase e di gruppo uguali, nessun allargamento'
  },
  {
    id: 'acoustic',
    label: 'Ramo acustico',
    title: 'Catena monatomica ω = ωₘₐₓ|sin(ka/2)|: al bordo k₀ = ±π/a la velocità di gruppo si annulla ma la curvatura resta non nulla'
  },
  {
    id: 'optical',
    label: 'Ramo ottico ($v_g < 0$)',
    title: 'Ramo ottico biatomico ω₊(k): per k₀ > 0 l’inviluppo arretra (velocità di gruppo negativa) mentre le creste avanzano'
  },
  {
    id: 'quadratic',
    label: 'Quadratico',
    title: 'Particella libera ħω = ħ²k²/(2m₀) (confronto §6.3): velocità di gruppo doppia di quella di fase, allargamento rapido'
  }
]

export interface WavepacketPreset {
  readonly id: string
  readonly name: string
  readonly regime: WavepacketRegime
  readonly kFrac: number
  readonly sigma0InA: number
}

export const PRESETS: readonly WavepacketPreset[] = [
  {
    id: 'linear-sound',
    name: 'Lineare ω = vₛ|k| (§6.2)',
    regime: 'linear',
    kFrac: 0.35,
    sigma0InA: 3.0
  },
  {
    id: 'acoustic-dispersive',
    name: 'Ramo acustico (Fig. 7)',
    regime: 'acoustic',
    kFrac: 0.66,
    sigma0InA: 3.0
  },
  {
    id: 'acoustic-edge',
    name: 'Bordo di zona k₀ = π/a',
    regime: 'acoustic',
    kFrac: 1.0,
    sigma0InA: 3.0
  },
  {
    id: 'optical-negative-vg',
    name: 'Ramo ottico (pendenza < 0)',
    regime: 'optical',
    kFrac: 0.5,
    sigma0InA: 3.0
  },
  {
    id: 'free-quadratic',
    name: 'Particella libera ω ∝ k²',
    regime: 'quadratic',
    kFrac: 0.5,
    sigma0InA: 3.0
  }
]

/**
 * Scelte numeriche della sezione:
 * - 241 punti su [−π/a, +π/a] (dispari → k = 0 e k = ±π/a cadono esatti);
 * - finestra spaziale ±18·a centrata sull'origine (o su ξ = 0 nel riferimento comovente);
 * - durata visiva di ciclo 6,5 s a velocità 1× corrispondente a [0, t_max] fisico.
 */
export const NUMERICS = {
  kPoints1BZ: 241,
  profilePoints: 261,
  spreadPoints: 96,
  halfSpanInA: 18,
  /** Spostamento massimo dell'inviluppo nella finestra di laboratorio (in unità di a). */
  maxTravelInA: 11.5,
  /** Durata in secondi wall-clock di un ciclo completo [0, t_max] a velocità 1×. */
  loopWallSeconds: 6.5,
  /** Passo tastiera su k₀ (in unità di π/a). */
  kNudge: 1 / 40,
  /** Aggancio morbido a k₀ = 0, ±0,5 e ±1 (in unità di π/a). */
  kSnap: 0.025
} as const
