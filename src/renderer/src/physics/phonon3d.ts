/**
 * Dinamica reticolare 3D, matrice dinamica hermitiana 3p×3p, polarizzazioni
 * LA/TA/LO/TO e conteggio dei modi di Born–von Kármán in 3D.
 *
 * Fonte unica: dispensa Parte 6, Lezione 2 (§§9–10, Fig. 13) e Lezione 3
 * (§14, Tab. 1, Figg. 17–18).
 *
 * Modelli armonici calibrati sui valori della Tab. 1 della dispensa:
 * - Alluminio (fcc, p = 1, a = 4,05 Å): modello Born–von Kármán 1NN (3×3 reale
 *   simmetrica), a X: LA = 40,0 meV (9,67 THz), TA₁,₂ degeneri = 24,0 meV (5,80 THz).
 * - Diamante (fcc base C–C, p = 2, a = 3,57 Å): modello tetraedrico di Born
 *   (6×6 hermitiana complessa), a Γ: 3 ottici degeneri = 160,0 meV (38,7 THz),
 *   TA e TO doppiamente degeneri lungo Γ–X e Γ–L.
 * - PbTe (NaCl polare, p = 2, a = 6,46 Å): modello ottaedrico 1NN + fcc 2NN +
 *   termine dipolare macroscopico a lungo raggio (rank-1 neutro, Z_Pb = −Z_Te),
 *   a Γ: LO = 3,30 THz (13,65 meV), TO₁,₂ = 1,10 THz (4,55 meV), con rimozione
 *   della degenerazione trasversale lungo K–Γ ([110], tutti e 6 i rami distinti).
 *
 * TypeScript puro: zero dipendenze da React o DOM.
 * Unità: lunghezze in Å, vettori d'onda in Å⁻¹, masse in u (convertite in kg),
 * costanti di forza in N/m, pulsazioni in rad·s⁻¹, frequenze in THz, energie in meV.
 */
import {
  kPathFromVertices,
  type KPath,
  type KPathVertex,
  type KVector
} from './bandStructure'
import {
  amuToKg,
  NA_MOL,
  radSToMev,
  radSToThz,
  THZ_TO_MEV
} from './constants'
import {
  complexHermitianMatrix,
  eigh,
  eigenvector,
  realSymmetricMatrix,
  type HermitianMatrix
} from './linalg'

export type Crystal3DId = 'aluminum' | 'diamond' | 'pbte'

export type CrystalStructureKind = 'fcc' | 'diamond' | 'rocksalt'

export type BranchRole3D = 'LA' | 'TA1' | 'TA2' | 'LO' | 'TO1' | 'TO2'

export type SymmetryLineKind = '100' | '111' | '110' | 'generic'

export interface Crystal3DMaterial {
  readonly id: Crystal3DId
  readonly structure: CrystalStructureKind
  /** Numero di atomi per cella primitiva p (1 per Al; 2 per Diamante e PbTe). */
  readonly basisCount: 1 | 2
  /** Passo della cella convenzionale cubica a (Å). */
  readonly a: number
  /** Masse atomiche della base [M₁] o [M₁, M₂] in u.m.a. */
  readonly massesAmu: readonly number[]
  /** Simboli chimici della base (es. ['Al'], ['C', 'C'], ['Pb', 'Te']). */
  readonly species: readonly string[]
  /** Rapporto predefinito C_T / C_L di calibrazione (Tab. 1). */
  readonly defaultTransverseRatio: number
  /** Rapporto polare predefinito ω_LO(Γ) / ω_TO(Γ) (1,0 per cristalli non polari). */
  readonly defaultPolarRatio: number
  /** Costante di forza longitudinale calibrata C_L (N/m) al profilo di Tab. 1. */
  readonly calibratedCL: number
  /** Rapporto 2NN / C_L per la struttura NaCl (0 per Al e Diamante). */
  readonly secondNeighborRatio: number
  /** Fattore di scala del decadimento gaussiano del termine dipolare (in unità di 2π/a). */
  readonly polarScreeningDimless: number
  /** Se true il cristallo è ionico/polare nel profilo Tab. 1 (splitting LO–TO a Γ). */
  readonly isPolar: boolean
}

export interface Phonon3DParams {
  readonly crystalId: Crystal3DId
  /** Rapporto rigidezza trasversale/longitudinale C_T / C_L (intervallo [0,15; 0,85]). */
  readonly transverseRatio: number
  /** Rapporto polare ω_LO(Γ) / ω_TO(Γ) (≥ 1; ignorato per p = 1). */
  readonly polarRatio: number
}

/**
 * Vertici del cammino di alta simmetria fcc Γ–X–K–Γ–L in unità di 2π/a
 * (coerenti con pseudopotential.ts e con la prima zona di Brillouin fcc).
 */
export const FCC_PHONON_PATH_VERTICES_DIMLESS: readonly KPathVertex[] = [
  { label: 'Γ', k: [0, 0, 0] },
  { label: 'X', k: [1, 0, 0] },
  { label: 'K', k: [0.75, 0.75, 0] },
  { label: 'Γ', k: [0, 0, 0] },
  { label: 'L', k: [0.5, 0.5, 0.5] }
]

/** Costante di conversione da ħω (meV) a ω (rad·s⁻¹). */
function mevToOmegaRadS(energyMev: number): number {
  return (energyMev / THZ_TO_MEV) * 2 * Math.PI * 1e12
}

/** Costante di conversione da ν (THz) a ω (rad·s⁻¹). */
function thzToOmegaRadS(freqThz: number): number {
  return freqThz * 2 * Math.PI * 1e12
}

// Calibrazioni analitiche esatte sui valori di Tab. 1 (dispensa Parte 6, §14.4 p. 36):
// 1. Alluminio (fcc, p = 1, a = 4,05 Å, M = 26,9815 u):
//    ω_LA(X) = 4√(α₁/M) = 40,0 meV ⇒ α₁ = M ω_LA² / 16
//    ω_TA(X) = 4√(r·α₁/M) = 24,0 meV ⇒ r = (24/40)² = 0,36
const AL_MASS_AMU = 26.9815
const AL_CL_CALIBRATED = (amuToKg(AL_MASS_AMU) * mevToOmegaRadS(40.0) ** 2) / 16

// 2. Diamante (fcc base C–C, p = 2, a = 3,57 Å, M = 12,011 u):
//    ω_opt(Γ) = √(8(1 + 2r)·C_L / (3M)) = 160,0 meV con r₀ = 0,30
const DIAMOND_MASS_AMU = 12.011
const DIAMOND_DEFAULT_R = 0.3
const DIAMOND_CL_CALIBRATED =
  (3 * amuToKg(DIAMOND_MASS_AMU) * mevToOmegaRadS(160.0) ** 2) / (8 * (1 + 2 * DIAMOND_DEFAULT_R))

// 3. PbTe (NaCl polare, p = 2, a = 6,46 Å, M_Pb = 207,2 u, M_Te = 127,6 u):
//    ω_TO(Γ) = √(2(1 + 2r)·C_L·(1/M₁ + 1/M₂)) = 1,10 THz con r₀ = 0,28;
//    ω_LO(Γ) = 3,30 THz ⇒ polarRatio = 3,00
const PB_MASS_AMU = 207.2
const TE_MASS_AMU = 127.6
const PBTE_DEFAULT_R = 0.28
const PBTE_INV_REDUCED_MASS = 1 / amuToKg(PB_MASS_AMU) + 1 / amuToKg(TE_MASS_AMU)
const PBTE_CL_CALIBRATED =
  thzToOmegaRadS(1.1) ** 2 / (2 * (1 + 2 * PBTE_DEFAULT_R) * PBTE_INV_REDUCED_MASS)

/** Catalogo dei tre cristalli reali della Tab. 1 (dispensa §14.4, p. 36). */
export const CRYSTALS_3D: Readonly<Record<Crystal3DId, Crystal3DMaterial>> = {
  aluminum: {
    id: 'aluminum',
    structure: 'fcc',
    basisCount: 1,
    a: 4.05,
    massesAmu: [AL_MASS_AMU],
    species: ['Al'],
    defaultTransverseRatio: 0.36,
    defaultPolarRatio: 1.0,
    calibratedCL: AL_CL_CALIBRATED,
    secondNeighborRatio: 0,
    polarScreeningDimless: 1.6,
    isPolar: false
  },
  diamond: {
    id: 'diamond',
    structure: 'diamond',
    basisCount: 2,
    a: 3.57,
    massesAmu: [DIAMOND_MASS_AMU, DIAMOND_MASS_AMU],
    species: ['C', 'C'],
    defaultTransverseRatio: DIAMOND_DEFAULT_R,
    defaultPolarRatio: 1.0,
    calibratedCL: DIAMOND_CL_CALIBRATED,
    secondNeighborRatio: 0,
    polarScreeningDimless: 1.6,
    isPolar: false
  },
  pbte: {
    id: 'pbte',
    structure: 'rocksalt',
    basisCount: 2,
    a: 6.46,
    massesAmu: [PB_MASS_AMU, TE_MASS_AMU],
    species: ['Pb', 'Te'],
    defaultTransverseRatio: PBTE_DEFAULT_R,
    defaultPolarRatio: 3.0,
    calibratedCL: PBTE_CL_CALIBRATED,
    secondNeighborRatio: 0.14,
    polarScreeningDimless: 1.6,
    isPolar: true
  }
}

export function defaultParamsForCrystal(id: Crystal3DId): Phonon3DParams {
  const mat = CRYSTALS_3D[id]
  return {
    crystalId: id,
    transverseRatio: mat.defaultTransverseRatio,
    polarRatio: mat.defaultPolarRatio
  }
}

/**
 * Posizione relativa τ₂ del secondo atomo della base nella cella primitiva (Å),
 * coerente con la convenzione «posizione reale» usata nelle matrici dinamiche
 * del diamante (a/4)(1, 1, 1) e di PbTe/NaCl (a/2)(1, 0, 0). Restituisce null per p = 1.
 */
export function crystalBasisTau2(id: Crystal3DId): KVector | null {
  const mat = CRYSTALS_3D[id]
  if (mat.basisCount === 1) return null
  if (mat.structure === 'diamond') {
    const q = 0.25 * mat.a
    return [q, q, q]
  }
  return [0.5 * mat.a, 0, 0]
}

/**
 * Costruisce il cammino di alta simmetria fcc Γ–X–K–Γ–L in Å⁻¹ per passo cubico `a`.
 */
export function fccHighSymmetryPath(a: number, pointsPerSegment = 40): KPath {
  if (!(a > 0)) throw new RangeError(`passo reticolare non valido: ${a}`)
  const scale = (2 * Math.PI) / a
  const vertices: KPathVertex[] = FCC_PHONON_PATH_VERTICES_DIMLESS.map((v) => ({
    label: v.label,
    k: [v.k[0] * scale, v.k[1] * scale, v.k[2] * scale]
  }))
  return kPathFromVertices(vertices, pointsPerSegment, 3)
}

/** Normalizza un vettore 3D; restituisce `fallback` se la norma è nulla. */
function normalize3(v: KVector, fallback: KVector = [1, 0, 0]): KVector {
  const n = Math.hypot(v[0], v[1], v[2])
  if (n < 1e-12) return fallback
  return [v[0] / n, v[1] / n, v[2] / n]
}

/** Classifica la direzione di simmetria cubica del vettore d'onda k (o di una direzione unitaria). */
export function classifySymmetryDirection(k: KVector, kHatHint?: KVector): SymmetryLineKind {
  const u = normalize3(k, kHatHint ? normalize3(kHatHint, [1, 0, 0]) : [1, 0, 0])
  const a0 = Math.abs(u[0])
  const a1 = Math.abs(u[1])
  const a2 = Math.abs(u[2])
  const sorted = [a0, a1, a2].sort((x, y) => x - y) // sorted[0] <= sorted[1] <= sorted[2]
  if (sorted[0] < 1e-5 && sorted[1] < 1e-5) return '100'
  if (Math.abs(sorted[0] - sorted[1]) < 1e-5 && Math.abs(sorted[1] - sorted[2]) < 1e-5) return '111'
  if (sorted[0] < 1e-5 && Math.abs(sorted[1] - sorted[2]) < 1e-5) return '110'
  return 'generic'
}

/**
 * Costruisce la matrice dinamica hermitiana 3p×3p D(k) in s⁻² per il cristallo scelto
 * (dispensa Parte 6, Lezione 2 §10.2, eq. 27).
 *
 * `kHatHint` specifica la direzione di avvicinamento a Γ (usata per il termine
 * dipolare macroscopico non analitico k̂_i k̂_j nei cristalli polari a k → 0).
 */
export function buildDynamicalMatrix3D(
  k: KVector,
  params: Phonon3DParams,
  kHatHint: KVector = [1, 0, 0]
): HermitianMatrix {
  const mat = CRYSTALS_3D[params.crystalId]
  const r = Math.max(0.05, Math.min(1.0, params.transverseRatio))
  const polarRatio = Math.max(1.0, params.polarRatio)
  const kHat = normalize3(k, normalize3(kHatHint, [1, 0, 0]))

  if (mat.structure === 'fcc') {
    return buildFccMonatomicMatrix(k, mat, r)
  }
  if (mat.structure === 'diamond') {
    return buildDiamondMatrix(k, mat, r, polarRatio, kHat)
  }
  return buildRocksaltMatrix(k, mat, r, polarRatio, kHat)
}

/**
 * Alluminio fcc (p = 1): matrice reale simmetrica 3×3 da costanti di forza
 * cubiche Born–von Kármán a 12 primi vicini con α₁ = γ₁ = C_L e β₁ = (2r − 1)C_L.
 */
function buildFccMonatomicMatrix(
  k: KVector,
  mat: Crystal3DMaterial,
  r: number
): HermitianMatrix {
  const M = amuToKg(mat.massesAmu[0])
  const alpha1 = mat.calibratedCL
  const gamma1 = alpha1
  const beta1 = (2 * r - 1) * alpha1

  const qx = 0.5 * k[0] * mat.a
  const qy = 0.5 * k[1] * mat.a
  const qz = 0.5 * k[2] * mat.a
  const cx = Math.cos(qx)
  const cy = Math.cos(qy)
  const cz = Math.cos(qz)
  const sx = Math.sin(qx)
  const sy = Math.sin(qy)
  const sz = Math.sin(qz)

  const pre = 4 / M
  const dxx = pre * (alpha1 * (2 - cx * (cy + cz)) + beta1 * (1 - cy * cz))
  const dyy = pre * (alpha1 * (2 - cy * (cz + cx)) + beta1 * (1 - cz * cx))
  const dzz = pre * (alpha1 * (2 - cz * (cx + cy)) + beta1 * (1 - cx * cy))
  const dxy = pre * gamma1 * sx * sy
  const dyz = pre * gamma1 * sy * sz
  const dzx = pre * gamma1 * sz * sx

  const m = realSymmetricMatrix(3)
  m.data[0] = dxx
  m.data[1] = dxy
  m.data[2] = dzx
  m.data[3] = dxy
  m.data[4] = dyy
  m.data[5] = dyz
  m.data[6] = dzx
  m.data[7] = dyz
  m.data[8] = dzz
  return m
}

/**
 * Aggiunge il contributo dipolare macroscopico a lungo raggio (rank-1 neutro,
 * Z₁ = +1, Z₂ = −1, che preserva esattamente la regola di somma acustica a Γ)
 * a una matrice 6×6 complessa o reale simmetrica.
 */
function addPolarDipoleTerm(
  re: Float64Array,
  n: number,
  k: KVector,
  kHat: KVector,
  a: number,
  m1Kg: number,
  m2Kg: number,
  omegaToZeroSq: number,
  polarRatio: number,
  screeningDimless: number
): void {
  if (polarRatio <= 1 + 1e-12) return
  const invMu = 1 / m1Kg + 1 / m2Kg
  const deltaPol = ((polarRatio * polarRatio - 1) * omegaToZeroSq) / invMu
  const kNorm = Math.hypot(k[0], k[1], k[2])
  const kScale = (2 * Math.PI * screeningDimless) / a
  const envelope = Math.exp(-((kNorm / kScale) ** 2))
  const coeff = deltaPol * envelope

  const zOverSqrtM = [1 / Math.sqrt(m1Kg), -1 / Math.sqrt(m2Kg)]
  for (let aIdx = 0; aIdx < 2; aIdx++) {
    for (let bIdx = 0; bIdx < 2; bIdx++) {
      const pre = coeff * zOverSqrtM[aIdx] * zOverSqrtM[bIdx]
      for (let i = 0; i < 3; i++) {
        const row = aIdx * 3 + i
        for (let j = 0; j < 3; j++) {
          const col = bIdx * 3 + j
          re[row * n + col] += pre * kHat[i] * kHat[j]
        }
      }
    }
  }
}

/** I 4 segni tetraedrici dei primi vicini nella struttura diamante (unità a/4). */
const TETRA_BONDS: readonly (readonly [number, number, number])[] = [
  [1, 1, 1],
  [1, -1, -1],
  [-1, 1, -1],
  [-1, -1, 1]
]

/**
 * Diamante (fcc base C–C, p = 2): matrice hermitiana complessa 6×6 nel modello
 * tetraedrico di Born (costante di stiramento C_L e di piegamento C_T = r·C_L).
 * Conviene usare la fase e^{i k·δ_m} (convenzione posizione reale dell'atomo, §10.3).
 */
function buildDiamondMatrix(
  k: KVector,
  mat: Crystal3DMaterial,
  r: number,
  polarRatio: number,
  kHat: KVector
): HermitianMatrix {
  const M = amuToKg(mat.massesAmu[0])
  const cL = mat.calibratedCL
  const cT = r * cL
  const A = (cL + 2 * cT) / (3 * M)
  const B = (cL - cT) / (3 * M)

  const matH = complexHermitianMatrix(6)
  const re = matH.re
  const im = matH.im

  // Blocchi diagonali D₁₁ = D₂₂ = 4A·I (somma sui 4 legami tetraedrici)
  const diagVal = 4 * A
  for (let i = 0; i < 3; i++) {
    re[i * 6 + i] = diagVal
    re[(i + 3) * 6 + (i + 3)] = diagVal
  }

  // Blocco fuori diagonale D₁₂(k) = −(1/M) ∑_m K_m e^{i k·δ_m}, D₂₁ = D₁₂†
  const qx = 0.25 * k[0] * mat.a
  const qy = 0.25 * k[1] * mat.a
  const qz = 0.25 * k[2] * mat.a

  for (const [sx, sy, sz] of TETRA_BONDS) {
    const phase = sx * qx + sy * qy + sz * qz
    const c = Math.cos(phase)
    const s = Math.sin(phase)
    const signs = [sx, sy, sz]
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const kij = i === j ? A : B * signs[i] * signs[j]
        const dRe = -kij * c
        const dIm = -kij * s
        // D₁₂[i, j]
        re[i * 6 + (j + 3)] += dRe
        im[i * 6 + (j + 3)] += dIm
        // D₂₁[j, i] = conj(D₁₂[i, j])
        re[(j + 3) * 6 + i] += dRe
        im[(j + 3) * 6 + i] -= dIm
      }
    }
  }

  // Termine polare opzionale (nullo nel diamante reale: polarRatio = 1)
  const omegaOptZeroSq = 8 * A
  addPolarDipoleTerm(re, 6, k, kHat, mat.a, M, M, omegaOptZeroSq, polarRatio, mat.polarScreeningDimless)

  return matH
}

/**
 * PbTe (struttura salgemma NaCl, p = 2): matrice reale simmetrica 6×6
 * (ottaedrica 1NN C_L, C_T = r·C_L + 12 secondi vicini fcc centrali C₂ +
 * termine dipolare macroscopico LO–TO).
 */
function buildRocksaltMatrix(
  k: KVector,
  mat: Crystal3DMaterial,
  r: number,
  polarRatio: number,
  kHat: KVector
): HermitianMatrix {
  const m1 = amuToKg(mat.massesAmu[0])
  const m2 = amuToKg(mat.massesAmu[1])
  const sqrtM1M2 = Math.sqrt(m1 * m2)
  const cL = mat.calibratedCL
  const cT = r * cL
  const c2 = mat.secondNeighborRatio * cL

  const qx = 0.5 * k[0] * mat.a
  const qy = 0.5 * k[1] * mat.a
  const qz = 0.5 * k[2] * mat.a
  const cx = Math.cos(qx)
  const cy = Math.cos(qy)
  const cz = Math.cos(qz)
  const sx = Math.sin(qx)
  const sy = Math.sin(qy)
  const sz = Math.sin(qz)

  const m = realSymmetricMatrix(6)
  const d = m.data

  // Termine on-site 1NN: 2(C_L + 2C_T) / M_α
  const onSite1NN = 2 * (cL + 2 * cT)
  // Termine 2NN fcc centrale (12 vicini a (a/2)(±1, ±1, 0)):
  // d2_ii = 2 C₂ [2 − cos(q_i)(cos(q_j) + cos(q_l))], d2_ij = 2 C₂ sin(q_i) sin(q_j)
  const d2Diag = [
    2 * c2 * (2 - cx * (cy + cz)),
    2 * c2 * (2 - cy * (cz + cx)),
    2 * c2 * (2 - cz * (cx + cy))
  ]
  const d2Off = [
    [0, 2 * c2 * sx * sy, 2 * c2 * sx * sz],
    [2 * c2 * sx * sy, 0, 2 * c2 * sy * sz],
    [2 * c2 * sx * sz, 2 * c2 * sy * sz, 0]
  ]

  const masses = [m1, m2]
  for (let alpha = 0; alpha < 2; alpha++) {
    const off = alpha * 3
    const invM = 1 / masses[alpha]
    for (let i = 0; i < 3; i++) {
      d[(off + i) * 6 + (off + i)] = (onSite1NN + d2Diag[i]) * invM
      for (let j = i + 1; j < 3; j++) {
        const val = d2Off[i][j] * invM
        d[(off + i) * 6 + (off + j)] = val
        d[(off + j) * 6 + (off + i)] = val
      }
    }
  }

  // Blocco 1NN fuori diagonale D₁₂ (diagonale negli indici cartesiani)
  const cosArr = [cx, cy, cz]
  for (let i = 0; i < 3; i++) {
    const sumOther = cosArr[(i + 1) % 3] + cosArr[(i + 2) % 3]
    const val = (-2 * (cL * cosArr[i] + cT * sumOther)) / sqrtM1M2
    d[i * 6 + (3 + i)] = val
    d[(3 + i) * 6 + i] = val
  }

  // Termine dipolare macroscopico LO–TO (nullo se polarRatio = 1)
  const omegaToZeroSq = onSite1NN * (1 / m1 + 1 / m2)
  addPolarDipoleTerm(d, 6, k, kHat, mat.a, m1, m2, omegaToZeroSq, polarRatio, mat.polarScreeningDimless)

  return m
}

/** Stato di un singolo modo fononico (k, s) estratto dalla diagonalizzazione di D(k). */
export interface Phonon3DMode {
  /** Indice del ramo in ordine di energia crescente (0…3p−1). */
  readonly sortedIndex: number
  /** Ruolo fisico assegnato (LA, TA1, TA2, LO, TO1, TO2). */
  readonly role: BranchRole3D
  /** Vero se è un ramo ottico, falso se acustico. */
  readonly isOptical: boolean
  /** Pulsazione ω_s(k) in rad·s⁻¹. */
  readonly omegaRadS: number
  /** Frequenza ν_s(k) in THz. */
  readonly freqThz: number
  /** Energia fononica ħω_s(k) in meV. */
  readonly energyMev: number
  /** Frazione longitudinale L_s(k) = ∑_α |k̂ · ε_α|² ∈ [0, 1]. */
  readonly longitudinalFraction: number
  /**
   * Versore di polarizzazione reale efficace per ciascun atomo della base
   * (allineato a fase reale dominante, normalizzato: ∑_α |ε_α|² = 1).
   * Per la visualizzazione degli spostamenti u_α ∝ ε_α / √M_α.
   */
  readonly polarizationVectors: readonly KVector[]
  /** Parte immaginaria del versore di polarizzazione ε_α (nulla se matrice reale). */
  readonly polarizationVectorsIm: readonly KVector[]
  /**
   * Parte reale dei vettori di spostamento u_α ∝ ε_α / √M_α normalizzati in modo
   * che max_α √(|Re u_α|² + |Im u_α|²) = 1 (per la proiezione isometrica 3D).
   */
  readonly displacementVectors: readonly KVector[]
  /** Parte immaginaria dei vettori di spostamento u_α (non nulla per modi complessi, es. diamante a X). */
  readonly displacementVectorsIm: readonly KVector[]
  /**
   * Sfasamento efficace φ (rad) tra sottoreticolo 2 e sottoreticolo 1
   * (0 = in fase / acustico, π = opposizione di fase / ottico).
   */
  readonly basisPhaseRad: number
}

interface ComplexVec {
  re: Float64Array
  im: Float64Array
}

/**
 * Ruota l'autovettore complesso `re + i·im` di una fase globale unitaria e^{-iφ₀}
 * per rendere massima la parte reale del primo sottoreticolo e fissarne il segno.
 */
function alignComplexEigenvector(
  re: Float64Array,
  im: Float64Array | null,
  kHat: KVector
): ComplexVec {
  const n = re.length
  const outRe = new Float64Array(n)
  const outIm = new Float64Array(n)
  if (!im) {
    outRe.set(re)
  } else {
    // Scegli φ₀ che massimizza ∑_{j=0..2} Re(e^{-iφ₀} v_j)² sul primo atomo della base
    let sumRe2 = 0
    let sumIm2 = 0
    const m = Math.min(3, n)
    for (let j = 0; j < m; j++) {
      sumRe2 += re[j] * re[j] - im[j] * im[j]
      sumIm2 += 2 * re[j] * im[j]
    }
    const phi = 0.5 * Math.atan2(sumIm2, sumRe2)
    const c = Math.cos(phi)
    const s = Math.sin(phi)
    for (let j = 0; j < n; j++) {
      // e^{-iφ} (re + i im) = (re c + im s) + i (im c - re s)
      outRe[j] = re[j] * c + im[j] * s
      outIm[j] = im[j] * c - re[j] * s
    }
  }

  // Fissa il segno globale in modo coerente rispetto a k̂ o alla componente dominante
  const dotK = outRe[0] * kHat[0] + outRe[1] * kHat[1] + outRe[2] * kHat[2]
  let flip = false
  if (Math.abs(dotK) > 0.15) {
    flip = dotK < 0
  } else {
    let maxAbs = -1
    let maxVal = 1
    for (let j = 0; j < Math.min(3, n); j++) {
      if (Math.abs(outRe[j]) > maxAbs + 1e-9) {
        maxAbs = Math.abs(outRe[j])
        maxVal = outRe[j]
      }
    }
    flip = maxVal < 0
  }
  if (flip) {
    for (let j = 0; j < n; j++) {
      outRe[j] = -outRe[j]
      outIm[j] = -outIm[j]
    }
  }
  return { re: outRe, im: outIm }
}

/**
 * Diagonalizza D(k) in un singolo punto k e restituisce i 3p modi ordinati
 * per frequenza crescente, completi di polarizzazioni e classificazione
 * LA / TA₁ / TA₂ / LO / TO₁ / TO₂.
 */
export function solvePhonon3DAtK(
  k: KVector,
  params: Phonon3DParams,
  kHatHint: KVector = [1, 0, 0]
): readonly Phonon3DMode[] {
  const mat = CRYSTALS_3D[params.crystalId]
  const p = mat.basisCount
  const dim = 3 * p
  const kHat = normalize3(k, normalize3(kHatHint, [1, 0, 0]))
  const dyn = buildDynamicalMatrix3D(k, params, kHat)
  const { values, vectors } = eigh(dyn, { vectors: true })
  if (!vectors) throw new Error('solvePhonon3DAtK: autovettori mancanti')

  interface RawMode {
    sortedIndex: number
    omegaRadS: number
    freqThz: number
    energyMev: number
    longitudinalFraction: number
    opticalScore: number
    polarizationVectors: KVector[]
    polarizationVectorsIm: KVector[]
    displacementVectors: KVector[]
    displacementVectorsIm: KVector[]
    basisPhaseRad: number
  }

  const raw: RawMode[] = []
  const sqrtMasses = mat.massesAmu.map((mAmu) => Math.sqrt(amuToKg(mAmu)))

  const alignedVecs: ComplexVec[] = []
  const omegas: number[] = []
  const maxW2 = Math.max(1, values[dim - 1] ?? 1)
  const zeroTolW2 = 1e-11 * maxW2
  for (let s = 0; s < dim; s++) {
    const w2 = values[s] <= zeroTolW2 ? 0 : values[s]
    omegas.push(Math.sqrt(w2))
    const ev = eigenvector(vectors, s)
    alignedVecs.push(alignComplexEigenvector(ev.re, ev.im, kHat))
  }

  // Ruota le basi dei sottospazi degeneri (es. 3 acustici a Γ, 3 ottici a Γ nel diamante,
  // coppie TA₁=TA₂ e TO₁=TO₂ lungo Γ–X e Γ–L) lungo i versori canonici (eL, eT1, eT2)
  const [eL, eT1, eT2] = orthonormalFrameFromK(kHat)
  canonicalizeDegenerateSubspaces(omegas, alignedVecs, p, mat.massesAmu, eL, eT1, eT2)

  for (let s = 0; s < dim; s++) {
    const vec = alignedVecs[s]
    const omegaRadS = omegas[s]

    // Frazione longitudinale complessa esatta: ∑_α |k̂ · ε_α|²
    let longFrac = 0
    const polVecs: KVector[] = []
    const polVecsIm: KVector[] = []
    const dispReRaw: [number, number, number][] = []
    const dispImRaw: [number, number, number][] = []
    let maxDisp = 0

    for (let alpha = 0; alpha < p; alpha++) {
      const rx = vec.re[alpha * 3]
      const ry = vec.re[alpha * 3 + 1]
      const rz = vec.re[alpha * 3 + 2]
      const ix = vec.im[alpha * 3]
      const iy = vec.im[alpha * 3 + 1]
      const iz = vec.im[alpha * 3 + 2]
      polVecs.push([rx, ry, rz])
      polVecsIm.push([ix, iy, iz])
      const dotRe = rx * kHat[0] + ry * kHat[1] + rz * kHat[2]
      const dotIm = ix * kHat[0] + iy * kHat[1] + iz * kHat[2]
      longFrac += dotRe * dotRe + dotIm * dotIm

      const invSqrtM = 1 / sqrtMasses[alpha]
      const urx = rx * invSqrtM
      const ury = ry * invSqrtM
      const urz = rz * invSqrtM
      const uix = ix * invSqrtM
      const uiy = iy * invSqrtM
      const uiz = iz * invSqrtM
      dispReRaw.push([urx, ury, urz])
      dispImRaw.push([uix, uiy, uiz])
      const mag = Math.sqrt(urx * urx + ury * ury + urz * urz + uix * uix + uiy * uiy + uiz * uiz)
      if (mag > maxDisp) maxDisp = mag
    }

    const dispVecs: KVector[] = dispReRaw.map(([ux, uy, uz]) =>
      maxDisp > 1e-30 ? [ux / maxDisp, uy / maxDisp, uz / maxDisp] : [0, 0, 0]
    )
    const dispVecsIm: KVector[] = dispImRaw.map(([ux, uy, uz]) =>
      maxDisp > 1e-30 ? [ux / maxDisp, uy / maxDisp, uz / maxDisp] : [0, 0, 0]
    )

    // Carattere ottico vs acustico per p = 2 (calcolato sui vettori complessi esatti,
    // includendo il fattore geometrico e^{i k·τ₂} della convenzione posizione reale)
    let opticalScore = 0
    let basisPhaseRad = 0
    if (p === 2) {
      const m1 = amuToKg(mat.massesAmu[0])
      const m2 = amuToKg(mat.massesAmu[1])
      const mTot = m1 + m2
      const mu = (m1 * m2) / mTot
      const u1r = dispReRaw[0]
      const u1i = dispImRaw[0]
      const u2rRaw = dispReRaw[1]
      const u2iRaw = dispImRaw[1]
      const tau2 = crystalBasisTau2(params.crystalId)
      const kDotTau2 = tau2 ? k[0] * tau2[0] + k[1] * tau2[1] + k[2] * tau2[2] : 0
      const c2 = Math.cos(kDotTau2)
      const s2 = Math.sin(kDotTau2)
      let cmNormSq = 0
      let relNormSq = 0
      let dotRe12 = 0
      let dotIm12 = 0
      let n1Sq = 0
      let n2Sq = 0
      for (let c = 0; c < 3; c++) {
        const u2r = u2rRaw[c] * c2 - u2iRaw[c] * s2
        const u2i = u2rRaw[c] * s2 + u2iRaw[c] * c2
        const cmr = (m1 * u1r[c] + m2 * u2r) / mTot
        const cmi = (m1 * u1i[c] + m2 * u2i) / mTot
        const relr = u1r[c] - u2r
        const reli = u1i[c] - u2i
        cmNormSq += cmr * cmr + cmi * cmi
        relNormSq += relr * relr + reli * reli
        // u1* · (e^{i k·τ₂} u2)
        dotRe12 += u1r[c] * u2r + u1i[c] * u2i
        dotIm12 += u1r[c] * u2i - u1i[c] * u2r
        n1Sq += u1r[c] * u1r[c] + u1i[c] * u1i[c]
        n2Sq += u2r * u2r + u2i * u2i
      }
      const eCm = mTot * cmNormSq
      const eRel = mu * relNormSq
      opticalScore = eCm + eRel > 1e-30 ? eRel / (eCm + eRel) : s >= 3 ? 1 : 0
      if (n1Sq > 1e-24 && n2Sq > 1e-24) {
        basisPhaseRad = Math.abs(Math.atan2(dotIm12, dotRe12))
      }
    }

    raw.push({
      sortedIndex: s,
      omegaRadS,
      freqThz: radSToThz(omegaRadS),
      energyMev: radSToMev(omegaRadS),
      longitudinalFraction: Math.max(0, Math.min(1, longFrac)),
      opticalScore,
      polarizationVectors: polVecs,
      polarizationVectorsIm: polVecsIm,
      displacementVectors: dispVecs,
      displacementVectorsIm: dispVecsIm,
      basisPhaseRad
    })
  }

  // Assegna i ruoli LA / TA1 / TA2 (e LO / TO1 / TO2 per p = 2)
  const roles: BranchRole3D[] = new Array(dim)
  const isOptFlags: boolean[] = new Array(dim).fill(false)

  if (p === 1) {
    let bestL = 0
    for (let s = 1; s < 3; s++) {
      if (raw[s].longitudinalFraction > raw[bestL].longitudinalFraction + 1e-6) bestL = s
    }
    roles[bestL] = 'LA'
    const trans = [0, 1, 2].filter((s) => s !== bestL)
    roles[trans[0]] = 'TA1'
    roles[trans[1]] = 'TA2'
  } else {
    // Nel diamante (M₁ = M₂, nessuna inversione ottico/acustico) i 3 modi più bassi sono
    // sempre acustici e i 3 più alti ottici (a X si toccano LA = LO).
    // Nel PbTe (M₁ ≠ M₂, LA può superare TO vicino a X) si separa con opticalScore esatto.
    let acGroup: number[]
    let optGroup: number[]
    if (mat.structure === 'diamond') {
      acGroup = [0, 1, 2]
      optGroup = [3, 4, 5]
    } else {
      const indices = [0, 1, 2, 3, 4, 5]
      const byOpt = [...indices].sort((a, b) => {
        const diff = raw[b].opticalScore - raw[a].opticalScore
        if (Math.abs(diff) > 0.04) return diff
        return raw[b].omegaRadS - raw[a].omegaRadS
      })
      optGroup = byOpt.slice(0, 3).sort((a, b) => a - b)
      acGroup = byOpt.slice(3, 6).sort((a, b) => a - b)
    }

    let bestAcL = acGroup[0]
    for (const idx of acGroup) {
      if (raw[idx].longitudinalFraction > raw[bestAcL].longitudinalFraction + 1e-6) bestAcL = idx
    }
    roles[bestAcL] = 'LA'
    const acTrans = acGroup.filter((idx) => idx !== bestAcL)
    roles[acTrans[0]] = 'TA1'
    roles[acTrans[1]] = 'TA2'

    let bestOptL = optGroup[0]
    for (const idx of optGroup) {
      if (raw[idx].longitudinalFraction > raw[bestOptL].longitudinalFraction + 1e-6) bestOptL = idx
    }
    roles[bestOptL] = 'LO'
    isOptFlags[bestOptL] = true
    const optTrans = optGroup.filter((idx) => idx !== bestOptL)
    roles[optTrans[0]] = 'TO1'
    roles[optTrans[1]] = 'TO2'
    isOptFlags[optTrans[0]] = true
    isOptFlags[optTrans[1]] = true
  }

  return raw.map((m, s) => ({
    sortedIndex: m.sortedIndex,
    role: roles[s],
    isOptical: isOptFlags[s],
    omegaRadS: m.omegaRadS,
    freqThz: m.freqThz,
    energyMev: m.energyMev,
    longitudinalFraction: m.longitudinalFraction,
    polarizationVectors: m.polarizationVectors,
    polarizationVectorsIm: m.polarizationVectorsIm,
    displacementVectors: m.displacementVectors,
    displacementVectorsIm: m.displacementVectorsIm,
    basisPhaseRad: m.basisPhaseRad
  }))
}

/** Terna ortonormale destrorsa (eL = k̂, eT1, eT2) con eT2 preferibilmente lungo z se k̂ ⊥ z. */
export function orthonormalFrameFromK(kHat: KVector): readonly [KVector, KVector, KVector] {
  const eL = normalize3(kHat, [1, 0, 0])
  // Scegli un asse di riferimento non parallelo a eL (preferisci z così nel piano xy eT2 = ẑ)
  const ref: KVector = Math.abs(eL[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0]
  // eT1 = normalize(ref × eL)
  const t1Raw: KVector = [
    ref[1] * eL[2] - ref[2] * eL[1],
    ref[2] * eL[0] - ref[0] * eL[2],
    ref[0] * eL[1] - ref[1] * eL[0]
  ]
  const eT1 = normalize3(t1Raw, [0, 1, 0])
  // eT2 = eL × eT1
  const eT2: KVector = [
    eL[1] * eT1[2] - eL[2] * eT1[1],
    eL[2] * eT1[0] - eL[0] * eT1[2],
    eL[0] * eT1[1] - eL[1] * eT1[0]
  ]
  return [eL, eT1, normalize3(eT2, [0, 0, 1])]
}

/**
 * Dentro sottospazi degeneri (es. 3 modi acustici a ω = 0 in Γ, 3 modi ottici
 * degeneri a Γ nel diamante, oppure TA₁ = TA₂ e TO₁ = TO₂ lungo Γ–X e Γ–L),
 * l'autovettore restituito da `eigh` ha un'arbitrarietà di rotazione nel sottospazio.
 * Questa funzione ruota la base del sottospazio degenere lungo i versori canonici
 * (eL, eT1, eT2) così LA/LO è sempre 100% lungo k̂ e TA₁/TA₂ sono ortogonali puliti.
 */
function canonicalizeDegenerateSubspaces(
  omegas: readonly number[],
  vecs: ComplexVec[],
  p: 1 | 2,
  massesAmu: readonly number[],
  eL: KVector,
  eT1: KVector,
  eT2: KVector
): void {
  const dim = omegas.length
  const wScale = Math.max(1e10, omegas[dim - 1] || 1e10)
  // Autovalori realmente degeneri coincidono a precisione macchina (≤ 1e-12·wScale);
  // 1e-9·wScale evita di mescolare modi ottici con splitting O(k²) vicino a Γ nel diamante.
  const degTol = 1e-9 * wScale

  let start = 0
  while (start < dim) {
    let end = start + 1
    while (end < dim && Math.abs(omegas[end] - omegas[start]) <= degTol) end++
    const mult = end - start
    if (mult === 2 || mult === 3) {
      const targets: ComplexVec[] = []
      const dirs: readonly KVector[] = [eT1, eT2, eL]
      const isAcousticZero = omegas[start] <= degTol
      const m1 = massesAmu[0]
      const m2 = p === 2 ? massesAmu[1] : m1
      const w1 = isAcousticZero ? Math.sqrt(m1) : Math.sqrt(m2)
      const w2 = isAcousticZero ? Math.sqrt(m2) : -Math.sqrt(m1)
      const wNorm = Math.hypot(w1, p === 2 ? w2 : 0)

      for (const dir of dirs) {
        const probeRe = new Float64Array(dim)
        if (p === 1) {
          probeRe[0] = dir[0]
          probeRe[1] = dir[1]
          probeRe[2] = dir[2]
        } else {
          probeRe[0] = (w1 / wNorm) * dir[0]
          probeRe[1] = (w1 / wNorm) * dir[1]
          probeRe[2] = (w1 / wNorm) * dir[2]
          probeRe[3] = (w2 / wNorm) * dir[0]
          probeRe[4] = (w2 / wNorm) * dir[1]
          probeRe[5] = (w2 / wNorm) * dir[2]
        }
        // Proiezione complessa sul sottospazio span{vecs[start..end-1]}: ∑_b <v_b | probe> v_b
        const projRe = new Float64Array(dim)
        const projIm = new Float64Array(dim)
        for (let b = start; b < end; b++) {
          const vb = vecs[b]
          let cRe = 0
          let cIm = 0
          for (let j = 0; j < dim; j++) {
            // conj(vb) * probe (probe reale)
            cRe += vb.re[j] * probeRe[j]
            cIm += -vb.im[j] * probeRe[j]
          }
          for (let j = 0; j < dim; j++) {
            projRe[j] += cRe * vb.re[j] - cIm * vb.im[j]
            projIm[j] += cRe * vb.im[j] + cIm * vb.re[j]
          }
        }
        // Ortogonalizzazione Gram–Schmidt complessa rispetto ai target già accettati
        for (const prev of targets) {
          let cRe = 0
          let cIm = 0
          for (let j = 0; j < dim; j++) {
            cRe += prev.re[j] * projRe[j] + prev.im[j] * projIm[j]
            cIm += prev.re[j] * projIm[j] - prev.im[j] * projRe[j]
          }
          for (let j = 0; j < dim; j++) {
            projRe[j] -= cRe * prev.re[j] - cIm * prev.im[j]
            projIm[j] -= cRe * prev.im[j] + cIm * prev.re[j]
          }
        }
        let normSq = 0
        for (let j = 0; j < dim; j++) normSq += projRe[j] * projRe[j] + projIm[j] * projIm[j]
        const norm = Math.sqrt(normSq)
        if (norm > 0.15) {
          for (let j = 0; j < dim; j++) {
            projRe[j] /= norm
            projIm[j] /= norm
          }
          targets.push(alignComplexEigenvector(projRe, projIm, eL))
          if (targets.length === mult) break
        }
      }
      if (targets.length === mult) {
        for (let kIdx = 0; kIdx < mult; kIdx++) {
          vecs[start + kIdx] = targets[kIdx]
        }
      }
    }
    start = end
  }
}

export interface Phonon3DBranchCurve {
  readonly role: BranchRole3D
  readonly isOptical: boolean
  readonly omegaRadS: Float64Array
  readonly freqThz: Float64Array
  readonly energyMev: Float64Array
}

export interface Phonon3DSegmentBranch {
  readonly id: string
  readonly role: BranchRole3D
  readonly isOptical: boolean
  /** Vero se su questo segmento il ramo ha carattere misto (direzione generica X–K). */
  readonly mixedPolarization: boolean
  readonly distance: Float64Array
  readonly omegaRadS: Float64Array
  readonly freqThz: Float64Array
  readonly energyMev: Float64Array
}

export interface Phonon3DSegment {
  readonly index: number
  readonly label: string
  readonly symmetry: SymmetryLineKind
  readonly startIndex: number
  readonly endIndex: number
  readonly branches: readonly Phonon3DSegmentBranch[]
}

export interface Phonon3DDispersion {
  readonly params: Phonon3DParams
  readonly material: Crystal3DMaterial
  readonly path: KPath
  /** I 3p rami continui sull'intero cammino (3 acustici ordinati + 3 ottici ordinati). */
  readonly branches: readonly Phonon3DBranchCurve[]
  /** I 4 tratti Γ–X, X–K, K–Γ, Γ–L con rami continui colorabili per ruolo esatto LA/TA/LO/TO. */
  readonly segments: readonly Phonon3DSegment[]
  /** Modi completi a ogni punto del cammino (indicizzati per [pointIdx][branchIdx] coerente con `branches`). */
  readonly modesAtPoint: readonly (readonly Phonon3DMode[])[]
  /** Frequenza massima sul cammino (THz) e energia massima (meV). */
  readonly maxFreqThz: number
  readonly maxEnergyMev: number
}

const ROLES_P1: readonly BranchRole3D[] = ['TA1', 'TA2', 'LA']
const ROLES_P2: readonly BranchRole3D[] = ['TA1', 'TA2', 'LA', 'TO1', 'TO2', 'LO']

/**
 * Parte reale e immaginaria dell'autovettore complesso (normalizzato) esposta per il tracking
 * continuo dei rami lungo i segmenti del cammino Γ–X–K–Γ–L.
 */
function complexModeOverlapSq(a: Phonon3DMode, b: Phonon3DMode): number {
  let re = 0
  let im = 0
  const p = a.polarizationVectors.length
  for (let alpha = 0; alpha < p; alpha++) {
    const ar = a.polarizationVectors[alpha]
    const ai = a.polarizationVectorsIm[alpha]
    const br = b.polarizationVectors[alpha]
    const bi = b.polarizationVectorsIm[alpha]
    for (let c = 0; c < 3; c++) {
      re += ar[c] * br[c] + ai[c] * bi[c]
      im += ar[c] * bi[c] - ai[c] * br[c]
    }
  }
  return re * re + im * im
}

function buildPermutations(n: number): readonly (readonly number[])[] {
  const res: number[][] = []
  const used = new Array<boolean>(n).fill(false)
  const cur = new Array<number>(n)
  const bt = (depth: number): void => {
    if (depth === n) {
      res.push([...cur])
      return
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue
      used[i] = true
      cur[depth] = i
      bt(depth + 1)
      used[i] = false
    }
  }
  bt(0)
  return res
}

const PERMS_3 = buildPermutations(3)
const PERMS_6 = buildPermutations(6)

/** Trova la permutazione su tutti i 3p modi che massimizza la sovrapposizione complessa + continuità di ν. */
function matchAllModesContinuous(
  prevModes: readonly Phonon3DMode[],
  currModes: readonly Phonon3DMode[],
  omegaScale: number
): readonly Phonon3DMode[] {
  const n = prevModes.length
  const perms = n === 3 ? PERMS_3 : PERMS_6
  let bestPerm = perms[0]
  let bestScore = -Infinity
  const invScale = omegaScale > 1e-9 ? 1 / omegaScale : 1
  for (const perm of perms) {
    let score = 0
    for (let k = 0; k < n; k++) {
      const ov = complexModeOverlapSq(prevModes[k], currModes[perm[k]])
      const dFreq = Math.abs(prevModes[k].freqThz - currModes[perm[k]].freqThz) * invScale
      score += ov - 0.12 * dFreq
    }
    if (score > bestScore) {
      bestScore = score
      bestPerm = perm
    }
  }
  return bestPerm.map((idx) => currModes[idx])
}

/** Assegna al vettore ordinato [TA1, TA2, LA (, TO1, TO2, LO)] il ruolo fisico coerente con il ramo tracciato. */
function stampBranchRoles(
  modes: readonly Phonon3DMode[],
  roleOrder: readonly BranchRole3D[]
): readonly Phonon3DMode[] {
  return modes.map((m, b) => {
    const role = roleOrder[b]
    return {
      ...m,
      role,
      isOptical: role === 'LO' || role === 'TO1' || role === 'TO2'
    }
  })
}

/**
 * Calcola l'intera dispersione 3D lungo il cammino fcc Γ–X–K–Γ–L,
 * tracciando ciascun ramo in modo continuo a partire dai modi esattamente
 * separati a Γ (senza tagli artificiali sull'opticalScore agli avoided crossings).
 */
export function computePhonon3DDispersion(
  params: Phonon3DParams,
  pointsPerSegment = 40
): Phonon3DDispersion {
  const material = CRYSTALS_3D[params.crystalId]
  const path = fccHighSymmetryPath(material.a, pointsPerSegment)
  const nPts = path.points.length
  const roleOrder = material.basisCount === 1 ? ROLES_P1 : ROLES_P2
  const nBranches = roleOrder.length

  // 1. Risolve D(k) in tutti i punti interni e ai vertici con la direzione locale
  const rawSolvedAtPoint: (readonly Phonon3DMode[])[] = new Array(nPts)
  let maxFreqThz = 0
  let maxEnergyMev = 0

  for (let i = 0; i < nPts; i++) {
    const k = path.points[i]
    const prev = path.points[Math.max(0, i - 1)]
    const next = path.points[Math.min(nPts - 1, i + 1)]
    let hint: KVector = [next[0] - prev[0], next[1] - prev[1], next[2] - prev[2]]
    if (Math.hypot(k[0], k[1], k[2]) < 1e-12) {
      if (i + 1 < nPts) {
        hint = [path.points[i + 1][0] - k[0], path.points[i + 1][1] - k[1], path.points[i + 1][2] - k[2]]
      } else if (i > 0) {
        hint = [k[0] - path.points[i - 1][0], k[1] - path.points[i - 1][1], k[2] - path.points[i - 1][2]]
      }
    }
    const solved = solvePhonon3DAtK(k, params, hint)
    rawSolvedAtPoint[i] = solved
    for (const m of solved) {
      if (m.freqThz > maxFreqThz) maxFreqThz = m.freqThz
      if (m.energyMev > maxEnergyMev) maxEnergyMev = m.energyMev
    }
  }

  // 2. Costruisce i 4 segmenti (Γ–X, X–K, K–Γ, Γ–L) per continuità degli autovettori 3p×3p
  const segments: Phonon3DSegment[] = []
  const modesAtPoint: (readonly Phonon3DMode[])[] = new Array(nPts)
  const omegaScale = Math.max(1, maxFreqThz)
  const nSegs = path.labels.length - 1
  const segModeTables: (readonly Phonon3DMode[])[][] = new Array(nSegs)

  const orderByRoles = (modes: readonly Phonon3DMode[]): readonly Phonon3DMode[] =>
    roleOrder.map((role, b) => modes.find((m) => m.role === role) ?? modes[b])

  // Ordine canonico iniziale di una fetta vicina a Γ lungo [110]: acustici [0..2] (TA1 < TA2), ottici [3..5] (TO1 < TO2)
  const orderNearGammaByFreq = (modes: readonly Phonon3DMode[]): readonly Phonon3DMode[] => {
    const byFreq = [...modes].sort((a, b) => a.omegaRadS - b.omegaRadS)
    const ac = byFreq.slice(0, 3)
    const opt = material.basisCount === 2 ? byFreq.slice(3, 6) : []
    const pickLong = (grp: Phonon3DMode[]): [Phonon3DMode, Phonon3DMode, Phonon3DMode] => {
      let lIdx = 0
      for (let i = 1; i < grp.length; i++) {
        if (grp[i].longitudinalFraction > grp[lIdx].longitudinalFraction + 1e-6) lIdx = i
      }
      const lMode = grp[lIdx]
      const tModes = grp.filter((_, i) => i !== lIdx).sort((a, b) => a.omegaRadS - b.omegaRadS)
      return [tModes[0], tModes[1], lMode]
    }
    const [ta1, ta2, la] = pickLong(ac)
    if (material.basisCount === 1) return [ta1, ta2, la]
    const [to1, to2, lo] = pickLong(opt)
    return [ta1, ta2, la, to1, to2, lo]
  }

  // Ordine di calcolo dei segmenti: prima i tre tratti ancorati a Γ (0: Γ–X, 2: K–Γ, 3: Γ–L),
  // poi 1: X–K così può partire da X (o da K nel diamante, dove LA=LO a X è degenere).
  const segOrder = [0, 2, 3, 1].filter((idx) => idx < nSegs)

  for (const segIdx of segOrder) {
    const startIdx = path.labels[segIdx].index
    const endIdx = path.labels[segIdx + 1].index
    const segLen = endIdx - startIdx + 1
    const kStart = path.points[startIdx]
    const kEnd = path.points[endIdx]
    const segDir: KVector = [kEnd[0] - kStart[0], kEnd[1] - kStart[1], kEnd[2] - kStart[2]]

    const solveAtSegStep = (j: number): readonly Phonon3DMode[] => {
      const gi = startIdx + j
      const k = path.points[gi]
      const atVertex = j === 0 || j === segLen - 1
      return atVertex ? solvePhonon3DAtK(k, params, segDir) : rawSolvedAtPoint[gi]
    }

    const segModes: (readonly Phonon3DMode[])[] = new Array(segLen)
    const endsAtGamma = path.labels[segIdx + 1].label === 'Γ' && path.labels[segIdx].label !== 'Γ'
    const startsAtGamma = path.labels[segIdx].label === 'Γ'

    if (endsAtGamma) {
      // K → Γ: parte dal punto vicino a Γ (j = segLen - 2) dove TA1 < TA2 è già risolta e ω_ac << ω_opt,
      // poi propaga fino a Γ (j = segLen - 1) e all'indietro fino a K (j = 0).
      const anchorJ = Math.max(0, segLen - 2)
      const anchorOrdered = orderNearGammaByFreq(solveAtSegStep(anchorJ))
      segModes[anchorJ] = stampBranchRoles(anchorOrdered, roleOrder)
      if (anchorJ + 1 < segLen) {
        const atGamma = matchAllModesContinuous(anchorOrdered, solveAtSegStep(anchorJ + 1), omegaScale)
        segModes[anchorJ + 1] = stampBranchRoles(atGamma, roleOrder)
      }
      let prev = anchorOrdered
      for (let j = anchorJ - 1; j >= 0; j--) {
        const matched = matchAllModesContinuous(prev, solveAtSegStep(j), omegaScale)
        segModes[j] = stampBranchRoles(matched, roleOrder)
        prev = matched
      }
    } else if (startsAtGamma) {
      // Γ → X oppure Γ → L: a Γ (j = 0) i 3 acustici (ω = 0) e 3 ottici (ω > 0) sono separati senza ambiguità
      const atG = orderByRoles(solveAtSegStep(0))
      segModes[0] = stampBranchRoles(atG, roleOrder)
      let prev = atG
      for (let j = 1; j < segLen; j++) {
        const matched = matchAllModesContinuous(prev, solveAtSegStep(j), omegaScale)
        segModes[j] = stampBranchRoles(matched, roleOrder)
        prev = matched
      }
    } else {
      // X → K: nel diamante LA(X)=LO(X) è degenere a X, quindi è più robusto partire da K (seg 2);
      // negli altri cristalli si parte da X (seg 0).
      const startFromK = material.structure === 'diamond' && segModeTables[2] !== undefined
      if (startFromK) {
        const kRef = segModeTables[2][0]
        const initAtK = matchAllModesContinuous(kRef, solveAtSegStep(segLen - 1), omegaScale)
        segModes[segLen - 1] = stampBranchRoles(initAtK, roleOrder)
        let prev = initAtK
        for (let j = segLen - 2; j >= 0; j--) {
          const matched = matchAllModesContinuous(prev, solveAtSegStep(j), omegaScale)
          segModes[j] = stampBranchRoles(matched, roleOrder)
          prev = matched
        }
      } else {
        const prevSeg = segModeTables[segIdx - 1]
        const initAtX = prevSeg
          ? matchAllModesContinuous(prevSeg[prevSeg.length - 1], solveAtSegStep(0), omegaScale)
          : orderByRoles(solveAtSegStep(0))
        segModes[0] = stampBranchRoles(initAtX, roleOrder)
        let prev = initAtX
        for (let j = 1; j < segLen; j++) {
          const matched = matchAllModesContinuous(prev, solveAtSegStep(j), omegaScale)
          segModes[j] = stampBranchRoles(matched, roleOrder)
          prev = matched
        }
      }
    }

    segModeTables[segIdx] = segModes
  }

  for (let segIdx = 0; segIdx < nSegs; segIdx++) {
    const startIdx = path.labels[segIdx].index
    const endIdx = path.labels[segIdx + 1].index
    const segLen = endIdx - startIdx + 1
    const midIdx = Math.floor((startIdx + endIdx) / 2)
    const kStart = path.points[startIdx]
    const kEnd = path.points[endIdx]
    const segDir: KVector = [kEnd[0] - kStart[0], kEnd[1] - kStart[1], kEnd[2] - kStart[2]]
    const symmetry = classifySymmetryDirection(path.points[midIdx], segDir)
    const segModes = segModeTables[segIdx]

    const distArr = new Float64Array(segLen)
    const segOmega = roleOrder.map(() => new Float64Array(segLen))
    const segFreq = roleOrder.map(() => new Float64Array(segLen))
    const segMev = roleOrder.map(() => new Float64Array(segLen))
    const isGeneric = symmetry === 'generic'

    for (let j = 0; j < segLen; j++) {
      const gi = startIdx + j
      distArr[j] = path.distance[gi]
      // Ai vertici condivisi Γ (idx = 120), X (idx = 40), K (idx = 80) usa il segmento uscente (j = 0)
      // così modesAtPoint[120] coincide con l'orientazione uscente Γ–L ([111]).
      if (j === 0 || !modesAtPoint[gi]) {
        modesAtPoint[gi] = segModes[j]
      }
      for (let b = 0; b < nBranches; b++) {
        segOmega[b][j] = segModes[j][b].omegaRadS
        segFreq[b][j] = segModes[j][b].freqThz
        segMev[b][j] = segModes[j][b].energyMev
      }
    }

    const segBranches: Phonon3DSegmentBranch[] = roleOrder.map((role, b) => ({
      id: `seg${segIdx}-${role}`,
      role,
      isOptical: role === 'LO' || role === 'TO1' || role === 'TO2',
      mixedPolarization: isGeneric,
      distance: distArr,
      omegaRadS: segOmega[b],
      freqThz: segFreq[b],
      energyMev: segMev[b]
    }))

    segments.push({
      index: segIdx,
      label: `${path.labels[segIdx].label}–${path.labels[segIdx + 1].label}`,
      symmetry,
      startIndex: startIdx,
      endIndex: endIdx,
      branches: segBranches
    })
  }

  // 3. Costruisce `branches` direttamente dai modi continui `modesAtPoint`, così `branches[b]`
  //    e `modesAtPoint[i][b]` hanno esattamente lo stesso ruolo fisico su tutto il cammino.
  const omegaArrs = roleOrder.map(() => new Float64Array(nPts))
  const freqArrs = roleOrder.map(() => new Float64Array(nPts))
  const mevArrs = roleOrder.map(() => new Float64Array(nPts))
  for (let i = 0; i < nPts; i++) {
    for (let b = 0; b < nBranches; b++) {
      omegaArrs[b][i] = modesAtPoint[i][b].omegaRadS
      freqArrs[b][i] = modesAtPoint[i][b].freqThz
      mevArrs[b][i] = modesAtPoint[i][b].energyMev
    }
  }

  const branches: Phonon3DBranchCurve[] = roleOrder.map((role, b) => ({
    role,
    isOptical: role === 'LO' || role === 'TO1' || role === 'TO2',
    omegaRadS: omegaArrs[b],
    freqThz: freqArrs[b],
    energyMev: mevArrs[b]
  }))

  return {
    params,
    material,
    path,
    branches,
    segments,
    modesAtPoint,
    maxFreqThz,
    maxEnergyMev
  }
}

/**
 * Riassunto dei valori chiave di Tab. 1 per i parametri correnti.
 */
export interface Phonon3DTab1Summary {
  /** Alluminio / generico: LA e TA₁,₂ al punto X (meV e THz). */
  readonly laAtXMev: number
  readonly laAtXThz: number
  readonly taAtXMev: number
  readonly taAtXThz: number
  /** Cristalli p = 2: LO e TO₁,₂ a Γ (meV e THz); null per p = 1. */
  readonly loAtGammaMev: number | null
  readonly loAtGammaThz: number | null
  readonly toAtGammaMev: number | null
  readonly toAtGammaThz: number | null
  /** Splitting Δν_LO-TO = ν_LO(Γ) − ν_TO(Γ) in THz (null per p = 1). */
  readonly loToSplitThz: number | null
  /** Splitting Δ(ħω)_LO-TO in meV (null per p = 1). */
  readonly loToSplitMev: number | null
}

export function phonon3DTab1Summary(params: Phonon3DParams): Phonon3DTab1Summary {
  const mat = CRYSTALS_3D[params.crystalId]
  const scale = (2 * Math.PI) / mat.a
  const atX = solvePhonon3DAtK([scale, 0, 0], params, [1, 0, 0])
  const laX = atX.find((m) => m.role === 'LA') ?? atX[2]
  const taX = atX.find((m) => m.role === 'TA1') ?? atX[0]

  if (mat.basisCount === 1) {
    return {
      laAtXMev: laX.energyMev,
      laAtXThz: laX.freqThz,
      taAtXMev: taX.energyMev,
      taAtXThz: taX.freqThz,
      loAtGammaMev: null,
      loAtGammaThz: null,
      toAtGammaMev: null,
      toAtGammaThz: null,
      loToSplitThz: null,
      loToSplitMev: null
    }
  }

  const atGamma = solvePhonon3DAtK([0, 0, 0], params, [1, 0, 0])
  const loG = atGamma.find((m) => m.role === 'LO') ?? atGamma[5]
  const toG = atGamma.find((m) => m.role === 'TO1') ?? atGamma[3]
  return {
    laAtXMev: laX.energyMev,
    laAtXThz: laX.freqThz,
    taAtXMev: taX.energyMev,
    taAtXThz: taX.freqThz,
    loAtGammaMev: loG.energyMev,
    loAtGammaThz: loG.freqThz,
    toAtGammaMev: toG.energyMev,
    toAtGammaThz: toG.freqThz,
    loToSplitThz: loG.freqThz - toG.freqThz,
    loToSplitMev: loG.energyMev - toG.energyMev
  }
}

// ---------------------------------------------------------------------------
// Conteggio dei modi 3D (Born–von Kármán, Lezione 3 §14, eqq. 34–36, Fig. 17)
// ---------------------------------------------------------------------------

export interface ModeCounting3D {
  /** Numero di celle convenzionali cubiche per lato N (cubo di lato L = N·a). */
  readonly cellsPerSideN: number
  /** Atomi per cella primitiva p. */
  readonly basisCountP: number
  /** Passo cella convenzionale cubica a (Å). */
  readonly aAng: number
  /** Volume cella convenzionale cubica a³ (Å³). */
  readonly conventionalCellVolumeAng3: number
  /** Volume cella primitiva fcc v_c = a³/4 (Å³) — mai a³ per fcc! (§14.1 p. 35). */
  readonly primitiveCellVolumeFccAng3: number
  /** Volume del cubo L³ = (Na)³ (Å³). */
  readonly crystalVolumeAng3: number
  /** Numero di celle primitive fcc nel cubo: N_c = V / v_c = 4·N³. */
  readonly primitiveCellsFcc: number
  /** Per confronto: numero di celle di un cubico semplice con stesso N: N³. */
  readonly primitiveCellsSimpleCubic: number
  /** Punti k distinti nella 1BZ 2D della Fig. 17 (griglia quadrata N×N): N². */
  readonly grid2DPoints: number
  /** Rami totali per ogni k: 3p. */
  readonly totalBranches: number
  /** Rami acustici: sempre 3 (1 LA + 2 TA). */
  readonly acousticBranches: 3
  /** Rami ottici: 3p − 3. */
  readonly opticalBranches: number
  /** Rami LO lungo assi di alta simmetria: p − 1 (correzione dispensa §9.1). */
  readonly loBranches: number
  /** Rami TO lungo assi di alta simmetria: 2(p − 1) (correzione dispensa §9.1). */
  readonly toBranches: number
  /** Modi normali totali = gradi di libertà = 3p·N_c (per fcc). */
  readonly totalModesFcc: number
  /** Spaziatura Δk = 2π / (Na) in Å⁻¹. */
  readonly deltaKAngInv: number
  /** Volume elementare nello spazio reciproco ΔV_k = (2π)³ / V in Å⁻³. */
  readonly deltaVkAngInv3: number
  /** Volume della prima zona di Brillouin fcc V_1BZ = (2π)³ / v_c in Å⁻³. */
  readonly bzVolumeFccAngInv3: number
}

/**
 * Calcola il bilancio di Born–von Kármán in 3D per un cubo fcc di N celle
 * convenzionali per lato (L = Na) con base di p atomi (dispensa §14.1–§14.3).
 */
export function computeModeCounting3D(
  cellsPerSideN: number,
  basisCountP: number,
  aAng: number
): ModeCounting3D {
  if (!Number.isInteger(cellsPerSideN) || cellsPerSideN < 1) {
    throw new RangeError(`N non valido: ${cellsPerSideN}`)
  }
  if (!Number.isInteger(basisCountP) || basisCountP < 1) {
    throw new RangeError(`p non valido: ${basisCountP}`)
  }
  if (!(aAng > 0)) throw new RangeError(`a non valido: ${aAng}`)

  const L = cellsPerSideN * aAng
  const convVol = aAng ** 3
  const primVolFcc = convVol / 4
  const crystalVol = L ** 3
  const ncSc = cellsPerSideN ** 3
  const ncFcc = 4 * ncSc
  const totalBranches = 3 * basisCountP
  const opticalBranches = 3 * (basisCountP - 1)
  const loBranches = basisCountP - 1
  const toBranches = 2 * (basisCountP - 1)
  const deltaK = (2 * Math.PI) / L
  const deltaVk = (2 * Math.PI) ** 3 / crystalVol
  const bzVolFcc = (2 * Math.PI) ** 3 / primVolFcc

  return {
    cellsPerSideN,
    basisCountP,
    aAng,
    conventionalCellVolumeAng3: convVol,
    primitiveCellVolumeFccAng3: primVolFcc,
    crystalVolumeAng3: crystalVol,
    primitiveCellsFcc: ncFcc,
    primitiveCellsSimpleCubic: ncSc,
    grid2DPoints: cellsPerSideN * cellsPerSideN,
    totalBranches,
    acousticBranches: 3,
    opticalBranches,
    loBranches,
    toBranches,
    totalModesFcc: totalBranches * ncFcc,
    deltaKAngInv: deltaK,
    deltaVkAngInv3: deltaVk,
    bzVolumeFccAngInv3: bzVolFcc
  }
}

export interface MacroscopicAlEstimate {
  /** Celle primitive (= atomi, p = 1) in 1 cm³ di Al (≈ 6,0·10²²). */
  readonly primitiveCells: number
  /** Modi vibrazionali totali 3N_c in 1 cm³ di Al (≈ 1,8·10²³). */
  readonly totalModes: number
  /** Passo Δk = 2π/L per L = 1 cm (≈ 6,28·10² m⁻¹). */
  readonly deltaKMInv: number
  /** Ampiezza caratteristica della 1BZ 2π/a (≈ 1,55·10¹⁰ m⁻¹). */
  readonly bzWidthMInv: number
  /** Rapporto Δk / (2π/a) (~ 4·10⁻⁸). */
  readonly spacingRatio: number
}

/**
 * Esempio macroscopico dell'alluminio (dispensa Parte 6, Lezione 3 §14.2 p. 35):
 * cubo di 1 cm³ di Al (a = 4,05 Å, ρ = 2,70 g·cm⁻³, massa molare 26,98 g·mol⁻¹).
 */
export function macroscopicAluminumEstimate(): MacroscopicAlEstimate {
  const aM = CRYSTALS_3D.aluminum.a * 1e-10
  const lM = 1e-2 // 1 cm
  const volM3 = lM ** 3
  const vcM3 = (aM ** 3) / 4
  const primitiveCells = volM3 / vcM3 // ≈ 6,02·10²² (coerente con ρ·N_A/M_mol ≈ 6,03·10²²)
  const totalModes = 3 * primitiveCells
  const deltaKMInv = (2 * Math.PI) / lM
  const bzWidthMInv = (2 * Math.PI) / aM
  // Verifica di coerenza con densità 2,70 g/cm³ e massa molare 26,98 g/mol usata come commento
  void NA_MOL
  return {
    primitiveCells,
    totalModes,
    deltaKMInv,
    bzWidthMInv,
    spacingRatio: deltaKMInv / bzWidthMInv
  }
}

export interface BvkGrid2DPoint {
  readonly nx: number
  readonly ny: number
  /** Coordinate in unità di π/a: in [−1, +1]. */
  readonly kxOverPiA: number
  readonly kyOverPiA: number
  /** Vero se è uno degli N² punti contati (−π/a < k_x, k_y ≤ +π/a); falso se è copia sul bordo −π/a per G. */
  readonly counted: boolean
}

/**
 * Genera i punti della griglia 2D di Born–von Kármán della Fig. 17 (dispensa p. 36)
 * per N celle per lato: N² punti pieni contati nella 1BZ quadrata (−π/a < k_i ≤ +π/a)
 * più i punti vuoti sul bordo −π/a equivalenti per un vettore G del reticolo reciproco.
 */
export function bvkGrid2D(cellsPerSideN: number): readonly BvkGrid2DPoint[] {
  if (!Number.isInteger(cellsPerSideN) || cellsPerSideN < 2) {
    throw new RangeError(`N non valido per la griglia 2D: ${cellsPerSideN}`)
  }
  const jMin = -Math.floor((cellsPerSideN - 1) / 2)
  const jMax = Math.floor(cellsPerSideN / 2)
  // Per N pari (es. N = 8): j = −3, −2, −1, 0, 1, 2, 3, 4 (8 valori), e copia vuota a j = −4 (−π/a).
  // Per N dispari (es. N = 7): j = −3, −2, −1, 0, 1, 2, 3 (7 valori, tutti interni a (−π/a, +π/a)).
  const hasBoundaryGhost = cellsPerSideN % 2 === 0
  const startJ = hasBoundaryGhost ? -cellsPerSideN / 2 : jMin
  const pts: BvkGrid2DPoint[] = []

  for (let nx = startJ; nx <= jMax; nx++) {
    const ghostX = hasBoundaryGhost && nx === -cellsPerSideN / 2
    for (let ny = startJ; ny <= jMax; ny++) {
      const ghostY = hasBoundaryGhost && ny === -cellsPerSideN / 2
      pts.push({
        nx,
        ny,
        kxOverPiA: (2 * nx) / cellsPerSideN,
        kyOverPiA: (2 * ny) / cellsPerSideN,
        counted: !ghostX && !ghostY
      })
    }
  }
  return pts
}
