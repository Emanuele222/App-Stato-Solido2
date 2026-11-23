#!/usr/bin/env python3
"""
Crosscheck numerico indipendente — Sezione 3 Fononi:
Rami 3D, polarizzazioni, matrice dinamica hermitiana 3p×3p, cristalli reali
(Al, Diamante, PbTe) e conteggio 3D di Born–von Kármán.

Fonti di riferimento (sola lettura):
  - materiale/parte6/dispensa.pdf: Lezione 2 §§9–10 (pp. 23–27, Fig. 13),
    Lezione 3 §14 (pp. 35–37, Tab. 1, Figg. 17–18).
  - materiale/parte6/riferimento-formule.md.

Metodologia:
  1. Reimplementazione DA ZERO in Python 3 (float64 + Decimal a 50 cifre,
     zero dipendenze esterne, nessuna condivisione con src/renderer/src/physics/):
     - Costruzione esplicita legame-per-legame nello spazio reale delle matrici
       delle costanti di forza Φ_{αi,βj}(0, m) per Al (12 primi vicini fcc),
       Diamante (4 legami tetraedrici di Born) e PbTe (6 primi vicini ottaedrici
       + 12 secondi vicini fcc centrali + termine dipolare macroscopico neutro),
       con verifica della simmetria e della regola di somma nulla ∑_{mβ} Φ = 0.
     - Trasformata di Fourier esplicita eq. (27) per D(k) (3×3 reale simmetrica
       per Al; 6×6 hermitiana complessa per Diamante; 6×6 reale con dipolo per PbTe).
     - Diagonalizzatore hermitiano complesso INDIPENDENTE (Jacobi ciclico con
       rotazioni unitarie 2×2 — algoritmo completamente diverso da Householder + QL
       di src/renderer/src/physics/linalg.ts).
     - Formule analitiche chiuse lungo [100] (Γ–X), [111] (Γ–L) e [110] (K–Γ),
       più velocità del suono dal tensore elastico di Christoffel (k → 0).
     - Verifica dei residui ‖D ε − ω² ε‖, ortonormalità, sostituzione diretta
       nelle equazioni di Newton 3D (eq. 25), degenerazioni di simmetria cubica,
       polarizzazione mista su X–K e punti 3D generici, simmetria O_h e inversione
       temporale, periodicità in G, continuità e tracciamento dei rami su tutti
       i 161 punti e agli estremi degli slider.
     - Conteggio 3D Born–von Kármán a 50 cifre (v_c = a³/4, N_c = 4N³, p−1 LO,
       2(p−1) TO), stima 1 cm³ di Al (sia da a³/4 sia da ρ·N_A/M_mol) e griglia
       2D di Fig. 17 (N = 2…15).
  2. Esecuzione diretta delle funzioni reali esportate da
     src/renderer/src/physics/phonon3d.ts tramite Node locale
     (.tools/node/node.exe) sugli stessi input, con misura dell'errore assoluto
     e relativo massimo punto per punto.

Esecuzione (dalla root del repository):
  python crosscheck/fononi/phonon_3d_crosscheck.py
"""

from __future__ import annotations

import cmath
import json
import math
import subprocess
import sys
from decimal import Decimal, getcontext
from pathlib import Path
from typing import Any

# Precisione arbitraria (50 cifre decimali) per calibrazioni, Tab. 1 e BvK
getcontext().prec = 50

ROOT = Path(__file__).resolve().parents[2]
NODE_EXE = ROOT / ".tools" / "node" / "node.exe"
OUT_JSON = Path(__file__).resolve().parent / "phonon_3d_crosscheck_results.json"

# =============================================================================
# 1. COSTANTI FISICHE INDIPENDENTI (SI 2019 esatte + CODATA 2018)
# =============================================================================
H_SI_D = Decimal("6.62607015e-34")            # J·s (esatta SI 2019)
E_SI_D = Decimal("1.602176634e-19")           # C   (esatta SI 2019)
NA_SI_D = Decimal("6.02214076e23")            # mol⁻¹ (esatta SI 2019)
AMU_KG_D = Decimal("1.6605390666e-27")        # kg  (CODATA 2018)
ANGSTROM_M_D = Decimal("1e-10")               # m/Å


def dec_pi() -> Decimal:
    """Calcola π a 50 cifre con formula di Machin."""
    def arctan_inv(inv_x: int) -> Decimal:
        x2 = Decimal(inv_x * inv_x)
        term = Decimal(1) / Decimal(inv_x)
        total = term
        k = 1
        while True:
            term = -term / x2
            add = term / Decimal(2 * k + 1)
            if abs(add) < Decimal("1e-52"):
                break
            total += add
            k += 1
        return total

    return Decimal(4) * (Decimal(4) * arctan_inv(5) - arctan_inv(239))


PI_D = dec_pi()
TWO_PI_D = Decimal(2) * PI_D
THZ_TO_MEV_EXACT_D = (H_SI_D * Decimal("1e12")) / (E_SI_D * Decimal("1e-3"))
# Valore troncato a 10 cifre usato dall'app in constants.ts (per distinguere errori
# algoritmici dallo scarto noto 2.234e-10 della costante THZ_TO_MEV)
THZ_TO_MEV_APP_D = Decimal("4.135667696")

AMU_KG = float(AMU_KG_D)
THZ_TO_MEV_EXACT = float(THZ_TO_MEV_EXACT_D)
THZ_TO_MEV_APP = float(THZ_TO_MEV_APP_D)


def rad_s_to_thz(w: float) -> float:
    return w / (2.0 * math.pi * 1e12)


def rad_s_to_mev_exact(w: float) -> float:
    return rad_s_to_thz(w) * THZ_TO_MEV_EXACT


def mev_to_rad_s_d(mev: Decimal, thz_to_mev: Decimal = THZ_TO_MEV_EXACT_D) -> Decimal:
    return (mev / thz_to_mev) * TWO_PI_D * Decimal("1e12")


def thz_to_rad_s_d(thz: Decimal) -> Decimal:
    return thz * TWO_PI_D * Decimal("1e12")


# =============================================================================
# 2. DIAGONALIZZATORE HERMITIANO COMPLESSO INDIPENDENTE (JACOBI CICLICO)
# =============================================================================

def hermitian_frobenius_norm(H: list[list[complex]]) -> float:
    n = len(H)
    s = 0.0
    for i in range(n):
        for j in range(n):
            v = H[i][j]
            s += v.real * v.real + v.imag * v.imag
    return math.sqrt(s)


def hermitian_asymmetry(H: list[list[complex]]) -> float:
    """Restituisce ‖H − H†‖_F / max(1, ‖H‖_F)."""
    n = len(H)
    diff2 = 0.0
    for i in range(n):
        for j in range(n):
            d = H[i][j] - H[j][i].conjugate()
            diff2 += d.real * d.real + d.imag * d.imag
    return math.sqrt(diff2) / max(1.0, hermitian_frobenius_norm(H))


def jacobi_hermitian(H_in: list[list[complex]], max_sweeps: int = 80) -> tuple[list[float], list[list[complex]]]:
    """
    Diagonalizza una matrice hermitiana complessa n×n tramite rotazioni unitarie
    di Jacobi (completamente indipendente da Householder+QL di linalg.ts).
    Restituisce (autovalori crescenti, lista di autovettori colonna normalizzati).
    """
    n = len(H_in)
    A = [[complex(H_in[i][j]) for j in range(n)] for i in range(n)]
    # Simmetrizzazione esatta in ingresso (dopo che il chiamante ha già misurato l'hermiticità)
    for i in range(n):
        A[i][i] = complex(A[i][i].real, 0.0)
        for j in range(i + 1, n):
            avg = 0.5 * (A[i][j] + A[j][i].conjugate())
            A[i][j] = avg
            A[j][i] = avg.conjugate()

    V = [[complex(1.0 if i == j else 0.0, 0.0) for j in range(n)] for i in range(n)]
    scale = max(1e-30, hermitian_frobenius_norm(A))
    tol = 1e-15 * scale

    for _sweep in range(max_sweeps):
        off_norm = 0.0
        for p in range(n):
            for q in range(p + 1, n):
                off_norm += abs(A[p][q]) ** 2
        if math.sqrt(2.0 * off_norm) <= tol:
            break

        for p in range(n):
            for q in range(p + 1, n):
                apq = A[p][q]
                mag = abs(apq)
                if mag <= tol * 1e-2:
                    continue
                app = A[p][p].real
                aqq = A[q][q].real
                # Fase e^{iφ} = apq / |apq| ⇒ trasformiamo il blocco 2×2 in reale simmetrico
                phase = apq / mag  # |phase| = 1, conj(phase) * apq = mag (reale > 0)
                tau = (aqq - app) / (2.0 * mag)
                t = (1.0 / (tau + math.hypot(1.0, tau))) if tau >= 0.0 else (-1.0 / (-tau + math.hypot(1.0, tau)))
                c = 1.0 / math.hypot(1.0, t)
                s = t * c  # reale

                # Rotazione unitaria U sui soli indici (p, q):
                #   col_p' = c * col_p - s * conj(phase) * col_q
                #   col_q' = s * phase * col_p + c * col_q
                # Verifica su blocco 2×2:
                #   (U† A U)_{pq} = c s (phase) (aqq - app) + mag (c² - s²) = 0
                sp = s * phase
                spc = s * phase.conjugate()

                # Aggiorna colonne p, q di A (A ← A U)
                for i in range(n):
                    aip = A[i][p]
                    aiq = A[i][q]
                    A[i][p] = c * aip - spc * aiq
                    A[i][q] = sp * aip + c * aiq
                # Aggiorna righe p, q di A (A ← U† A)
                for j in range(n):
                    apj = A[p][j]
                    aqj = A[q][j]
                    A[p][j] = c * apj - sp * aqj
                    A[q][j] = spc * apj + c * aqj

                A[p][p] = complex(A[p][p].real, 0.0)
                A[q][q] = complex(A[q][q].real, 0.0)
                A[p][q] = 0j
                A[q][p] = 0j

                # Accumula autovettori (V ← V U)
                for i in range(n):
                    vip = V[i][p]
                    viq = V[i][q]
                    V[i][p] = c * vip - spc * viq
                    V[i][q] = sp * vip + c * viq

    vals = [A[i][i].real for i in range(n)]
    order = sorted(range(n), key=lambda idx: vals[idx])
    sorted_vals = [vals[idx] for idx in order]
    vecs = [[V[row][idx] for row in range(n)] for idx in order]
    return sorted_vals, vecs


def mat_vec(H: list[list[complex]], v: list[complex]) -> list[complex]:
    n = len(H)
    return [sum(H[i][j] * v[j] for j in range(n)) for i in range(n)]


def eigen_residual(H: list[list[complex]], val: float, vec: list[complex], ref_scale: float | None = None) -> float:
    hv = mat_vec(H, vec)
    r2 = sum(abs(hv[i] - val * vec[i]) ** 2 for i in range(len(vec)))
    denom = ref_scale if ref_scale is not None else max(1e-30, hermitian_frobenius_norm(H))
    return math.sqrt(r2) / max(1e-30, denom)


def orthonormality_error(vecs: list[list[complex]]) -> float:
    m = len(vecs)
    n = len(vecs[0])
    err2 = 0.0
    for a in range(m):
        for b in range(m):
            ip = sum(vecs[a][i].conjugate() * vecs[b][i] for i in range(n))
            target = 1.0 if a == b else 0.0
            err2 += abs(ip - target) ** 2
    return math.sqrt(err2)


# =============================================================================
# 3. MODELLI FISICI COSTRUITI DA ZERO IN SPAZIO REALE (EQQ. 24–28 DISPENSA)
# =============================================================================

# Parametri dei 3 cristalli di Tab. 1 (dispensa Parte 6, §14.4 p. 36)
AL_A_D = Decimal("4.05")
AL_M_AMU_D = Decimal("26.9815")
AL_R0_D = Decimal("0.36")  # (24/40)^2
AL_CL_EXACT_D = (AL_M_AMU_D * AMU_KG_D * mev_to_rad_s_d(Decimal("40"), THZ_TO_MEV_EXACT_D) ** 2) / Decimal(16)
AL_CL_APP_D = (AL_M_AMU_D * AMU_KG_D * mev_to_rad_s_d(Decimal("40"), THZ_TO_MEV_APP_D) ** 2) / Decimal(16)

DIA_A_D = Decimal("3.57")
DIA_M_AMU_D = Decimal("12.011")
DIA_R0_D = Decimal("0.3")
DIA_CL_EXACT_D = (
    Decimal(3) * DIA_M_AMU_D * AMU_KG_D * mev_to_rad_s_d(Decimal("160"), THZ_TO_MEV_EXACT_D) ** 2
) / (Decimal(8) * (Decimal(1) + Decimal(2) * DIA_R0_D))
DIA_CL_APP_D = (
    Decimal(3) * DIA_M_AMU_D * AMU_KG_D * mev_to_rad_s_d(Decimal("160"), THZ_TO_MEV_APP_D) ** 2
) / (Decimal(8) * (Decimal(1) + Decimal(2) * DIA_R0_D))

PBTE_A_D = Decimal("6.46")
PB_M_AMU_D = Decimal("207.2")
TE_M_AMU_D = Decimal("127.6")
PBTE_R0_D = Decimal("0.28")
PBTE_POLAR0_D = Decimal("3.0")
PBTE_C2_RATIO_D = Decimal("0.14")
PBTE_INV_MU_D = Decimal(1) / (PB_M_AMU_D * AMU_KG_D) + Decimal(1) / (TE_M_AMU_D * AMU_KG_D)
PBTE_CL_EXACT_D = thz_to_rad_s_d(Decimal("1.1")) ** 2 / (
    Decimal(2) * (Decimal(1) + Decimal(2) * PBTE_R0_D) * PBTE_INV_MU_D
)


def real_space_bonds_aluminum(a: float, c_l: float, r: float) -> list[tuple[int, int, tuple[float, float, float], list[list[float]]]]:
    """
    Restituisce i 12 legami 1NN fcc come lista di (alpha, beta, delta_vec, Phi_offsite_3x3),
    dove Φ(0, δ) = −K(δ). L'on-site è fissato dalla regola di somma nulla Φ(0,0) = −∑_δ Φ(0,δ).
    """
    alpha1 = c_l
    gamma1 = c_l
    beta1 = (2.0 * r - 1.0) * c_l
    bonds = []
    half = 0.5 * a
    # 4 vicini nel piano xy: (±a/2, ±a/2, 0)
    for sx in (-1.0, 1.0):
        for sy in (-1.0, 1.0):
            K = [
                [alpha1, gamma1 * sx * sy, 0.0],
                [gamma1 * sx * sy, alpha1, 0.0],
                [0.0, 0.0, beta1],
            ]
            bonds.append((0, 0, (sx * half, sy * half, 0.0), [[-x for x in row] for row in K]))
    # 4 vicini nel piano xz: (±a/2, 0, ±a/2)
    for sx in (-1.0, 1.0):
        for sz in (-1.0, 1.0):
            K = [
                [alpha1, 0.0, gamma1 * sx * sz],
                [0.0, beta1, 0.0],
                [gamma1 * sx * sz, 0.0, alpha1],
            ]
            bonds.append((0, 0, (sx * half, 0.0, sz * half), [[-x for x in row] for row in K]))
    # 4 vicini nel piano yz: (0, ±a/2, ±a/2)
    for sy in (-1.0, 1.0):
        for sz in (-1.0, 1.0):
            K = [
                [beta1, 0.0, 0.0],
                [0.0, alpha1, gamma1 * sy * sz],
                [0.0, gamma1 * sy * sz, alpha1],
            ]
            bonds.append((0, 0, (0.0, sy * half, sz * half), [[-x for x in row] for row in K]))
    return bonds


def real_space_bonds_diamond(a: float, c_l: float, r: float) -> list[tuple[int, int, tuple[float, float, float], list[list[float]]]]:
    """
    4 legami tetraedrici C(1)–C(2) a δ_m = (a/4) s_m (e loro reciproci C(2)–C(1) a −δ_m).
    K_m = C_T I + (C_L − C_T) ê_m ê_m^T con ê_m = s_m / √3.
    """
    c_t = r * c_l
    q = 0.25 * a
    tetra = [(1, 1, 1), (1, -1, -1), (-1, 1, -1), (-1, -1, 1)]
    bonds = []
    for sx, sy, sz in tetra:
        e = (sx / math.sqrt(3.0), sy / math.sqrt(3.0), sz / math.sqrt(3.0))
        K = [[(c_t if i == j else 0.0) + (c_l - c_t) * e[i] * e[j] for j in range(3)] for i in range(3)]
        phi = [[-x for x in row] for row in K]
        delta = (sx * q, sy * q, sz * q)
        neg_delta = (-sx * q, -sy * q, -sz * q)
        # legame 0 -> 1 a +delta, e simmetrico 1 -> 0 a -delta
        bonds.append((0, 1, delta, phi))
        bonds.append((1, 0, neg_delta, phi))
    return bonds


def real_space_bonds_rocksalt(a: float, c_l: float, r: float, c2_ratio: float) -> list[tuple[int, int, tuple[float, float, float], list[list[float]]]]:
    """
    Struttura salgemma (PbTe):
      - 6 legami 1NN ottaedrici Pb–Te a ±(a/2) ê_l con K_1 = diag(C_L lungo legame, C_T trasversale)
      - 12 legami 2NN fcc centrali Pb–Pb e Te–Te a (a/2)(±1,±1,0) ecc. con K_2 = C_2 ê ê^T
    """
    c_t = r * c_l
    c2 = c2_ratio * c_l
    half = 0.5 * a
    bonds = []

    # 1NN ottaedrici (6 per atomo)
    axes = [(1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1)]
    for ax in axes:
        K = [
            [(c_l if ax[i] != 0 else c_t) if i == j else 0.0 for j in range(3)]
            for i in range(3)
        ]
        phi = [[-x for x in row] for row in K]
        delta = (ax[0] * half, ax[1] * half, ax[2] * half)
        bonds.append((0, 1, delta, phi))
        bonds.append((1, 0, delta, phi))

    # 2NN fcc centrali (12 per sottoreticolo)
    fcc_dirs = []
    for sx in (-1.0, 1.0):
        for sy in (-1.0, 1.0):
            fcc_dirs.append((sx, sy, 0.0))
            fcc_dirs.append((sx, 0.0, sy))
            fcc_dirs.append((0.0, sx, sy))
    for d in fcc_dirs:
        e = (d[0] / math.sqrt(2.0), d[1] / math.sqrt(2.0), d[2] / math.sqrt(2.0))
        K = [[c2 * e[i] * e[j] for j in range(3)] for i in range(3)]
        phi = [[-x for x in row] for row in K]
        delta = (d[0] * half, d[1] * half, d[2] * half)
        bonds.append((0, 0, delta, phi))
        bonds.append((1, 1, delta, phi))
    return bonds


def assemble_dynamical_from_bonds(
    k: tuple[float, float, float],
    masses_kg: list[float],
    bonds: list[tuple[int, int, tuple[float, float, float], list[list[float]]]],
) -> tuple[list[list[complex]], float, float]:
    """
    Costruisce D(k) (eq. 27 della dispensa) direttamente dalla somma sui legami
    dello spazio reale, verificando al contempo:
      - regola di somma nulla ∑_{mβ} Φ_{αi,βj}(0, m) = 0 (costruzione on-site)
      - simmetria reale Φ_{αi,βj}(0, δ) = Φ_{βj,αi}(0, −δ).
    Restituisce (D, max_sum_rule_err, max_phi_sym_err).
    """
    p = len(masses_kg)
    dim = 3 * p

    # 1. Calcola blocchi on-site Φ_{αi,αj}(0,0) = −∑_{mβ ≠ (0,α)} Φ_{αi,βj}(0, m)
    phi_onsite = [[[0.0 for _ in range(3)] for _ in range(3)] for _ in range(p)]
    for alpha, _beta, _delta, phi in bonds:
        for i in range(3):
            for j in range(3):
                phi_onsite[alpha][i][j] -= phi[i][j]

    # 2. Verifica regola di somma nulla (somma di on-site + tutti gli off-site su α)
    max_sum_rule = 0.0
    for alpha in range(p):
        tot = [[phi_onsite[alpha][i][j] for j in range(3)] for i in range(3)]
        for a, _b, _d, phi in bonds:
            if a == alpha:
                for i in range(3):
                    for j in range(3):
                        tot[i][j] += phi[i][j]
        for i in range(3):
            for j in range(3):
                max_sum_rule = max(max_sum_rule, abs(tot[i][j]))

    # 3. Verifica simmetria Φ_{αi,βj}(δ) = Φ_{βj,αi}(−δ)
    max_sym_err = 0.0
    for alpha, beta, delta, phi in bonds:
        found = False
        for a2, b2, d2, phi2 in bonds:
            if a2 == beta and b2 == alpha and all(abs(d2[c] + delta[c]) < 1e-12 for c in range(3)):
                found = True
                for i in range(3):
                    for j in range(3):
                        max_sym_err = max(max_sym_err, abs(phi[i][j] - phi2[j][i]))
                break
        if not found:
            max_sym_err = float("inf")

    # 4. Trasformata di Fourier eq. (27): D_{αi,βj}(k) = (1/√(M_α M_β)) ∑_m Φ_{αi,βj}(0, m) e^{i k·δ}
    D = [[0j for _ in range(dim)] for _ in range(dim)]
    for alpha in range(p):
        inv_m = 1.0 / masses_kg[alpha]
        for i in range(3):
            for j in range(3):
                D[alpha * 3 + i][alpha * 3 + j] += phi_onsite[alpha][i][j] * inv_m

    for alpha, beta, delta, phi in bonds:
        inv_sqrt = 1.0 / math.sqrt(masses_kg[alpha] * masses_kg[beta])
        phase = cmath.exp(1j * (k[0] * delta[0] + k[1] * delta[1] + k[2] * delta[2]))
        for i in range(3):
            for j in range(3):
                D[alpha * 3 + i][beta * 3 + j] += phi[i][j] * inv_sqrt * phase

    return D, max_sum_rule, max_sym_err


def normalize3(v: tuple[float, float, float], fallback: tuple[float, float, float] = (1.0, 0.0, 0.0)) -> tuple[float, float, float]:
    n = math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
    if n < 1e-12:
        return fallback
    return (v[0] / n, v[1] / n, v[2] / n)


def add_dipole_term_indep(
    D: list[list[complex]],
    k: tuple[float, float, float],
    k_hat: tuple[float, float, float],
    a: float,
    masses_kg: list[float],
    omega_to0_sq: float,
    polar_ratio: float,
    screening_dimless: float = 1.6,
) -> None:
    if polar_ratio <= 1.0 + 1e-12:
        return
    m1, m2 = masses_kg
    inv_mu = 1.0 / m1 + 1.0 / m2
    delta_pol = (polar_ratio * polar_ratio - 1.0) * omega_to0_sq / inv_mu
    k_norm = math.sqrt(k[0] * k[0] + k[1] * k[1] + k[2] * k[2])
    k_scale = (2.0 * math.pi * screening_dimless) / a
    env = math.exp(-((k_norm / k_scale) ** 2))
    coeff = delta_pol * env
    w = [
        k_hat[0] / math.sqrt(m1), k_hat[1] / math.sqrt(m1), k_hat[2] / math.sqrt(m1),
        -k_hat[0] / math.sqrt(m2), -k_hat[1] / math.sqrt(m2), -k_hat[2] / math.sqrt(m2),
    ]
    for r in range(6):
        for c in range(6):
            D[r][c] += coeff * w[r] * w[c]


def build_indep_dynamical_matrix(
    crystal_id: str,
    k: tuple[float, float, float],
    r: float,
    polar_ratio: float,
    k_hat_hint: tuple[float, float, float] = (1.0, 0.0, 0.0),
    use_app_cl: bool = True,
) -> tuple[list[list[complex]], float, float, list[tuple[int, int, tuple[float, float, float], list[list[float]]]], list[float]]:
    k_hat = normalize3(k, normalize3(k_hat_hint))
    if crystal_id == "aluminum":
        a = float(AL_A_D)
        cl = float(AL_CL_APP_D if use_app_cl else AL_CL_EXACT_D)
        masses = [float(AL_M_AMU_D * AMU_KG_D)]
        bonds = real_space_bonds_aluminum(a, cl, r)
        D, sr, sym = assemble_dynamical_from_bonds(k, masses, bonds)
        return D, sr, sym, bonds, masses
    elif crystal_id == "diamond":
        a = float(DIA_A_D)
        cl = float(DIA_CL_APP_D if use_app_cl else DIA_CL_EXACT_D)
        m = float(DIA_M_AMU_D * AMU_KG_D)
        masses = [m, m]
        bonds = real_space_bonds_diamond(a, cl, r)
        D, sr, sym = assemble_dynamical_from_bonds(k, masses, bonds)
        w_opt0_sq = 8.0 * (cl + 2.0 * r * cl) / (3.0 * m)
        add_dipole_term_indep(D, k, k_hat, a, masses, w_opt0_sq, polar_ratio, 1.6)
        return D, sr, sym, bonds, masses
    elif crystal_id == "pbte":
        a = float(PBTE_A_D)
        cl = float(PBTE_CL_EXACT_D)
        masses = [float(PB_M_AMU_D * AMU_KG_D), float(TE_M_AMU_D * AMU_KG_D)]
        bonds = real_space_bonds_rocksalt(a, cl, r, float(PBTE_C2_RATIO_D))
        D, sr, sym = assemble_dynamical_from_bonds(k, masses, bonds)
        w_to0_sq = 2.0 * (cl + 2.0 * r * cl) * (1.0 / masses[0] + 1.0 / masses[1])
        add_dipole_term_indep(D, k, k_hat, a, masses, w_to0_sq, polar_ratio, 1.6)
        return D, sr, sym, bonds, masses
    else:
        raise ValueError(crystal_id)


# =============================================================================
# 4. FORMULE ANALITICHE CHIUSE LUNGO [100], [111], [110] E VELOCITÀ DEL SUONO
# =============================================================================

def analytical_eigenvalues_100(crystal_id: str, kx: float, r: float, polar_ratio: float) -> list[float]:
    """Formule chiuse esatte di ω² lungo [100] (Γ–X), ordinate crescenti."""
    if crystal_id == "aluminum":
        a = float(AL_A_D)
        cl = float(AL_CL_APP_D)
        M = float(AL_M_AMU_D * AMU_KG_D)
        q = 0.5 * kx * a
        s2 = math.sin(0.5 * q) ** 2
        w2_la = (16.0 * cl / M) * s2
        w2_ta = (16.0 * r * cl / M) * s2
        return sorted([w2_ta, w2_ta, w2_la])
    elif crystal_id == "diamond":
        a = float(DIA_A_D)
        cl = float(DIA_CL_APP_D)
        M = float(DIA_M_AMU_D * AMU_KG_D)
        A = (cl + 2.0 * r * cl) / (3.0 * M)
        B = (cl - r * cl) / (3.0 * M)
        q = 0.25 * kx * a
        # Blocco trasversale (y, z) indipendente dal dipolo lungo x
        rad_t = math.hypot(A * math.cos(q), B * math.sin(q))
        w2_ta = 4.0 * (A - rad_t)
        w2_to = 4.0 * (A + rad_t)
        # Blocco longitudinale (x) 2×2
        c_dip = 0.0
        if polar_ratio > 1.0 + 1e-12:
            inv_mu = 2.0 / M
            delta_pol = (polar_ratio ** 2 - 1.0) * (8.0 * A) / inv_mu
            k_scale = (2.0 * math.pi * 1.6) / a
            c_dip = delta_pol * math.exp(-((abs(kx) / k_scale) ** 2)) / M
        d11 = 4.0 * A + c_dip
        d12 = -4.0 * A * math.cos(q) - c_dip
        w2_la = d11 - abs(d12)
        w2_lo = d11 + abs(d12)
        return sorted([w2_ta, w2_ta, w2_la, w2_lo, w2_to, w2_to])
    elif crystal_id == "pbte":
        a = float(PBTE_A_D)
        cl = float(PBTE_CL_EXACT_D)
        ct = r * cl
        c2 = float(PBTE_C2_RATIO_D) * cl
        m1 = float(PB_M_AMU_D * AMU_KG_D)
        m2 = float(TE_M_AMU_D * AMU_KG_D)
        q = 0.5 * kx * a
        cq = math.cos(q)
        on1 = 2.0 * (cl + 2.0 * ct)
        # Termine 2NN su [100]: d2_x = 4 c2 (1 - cos q), d2_y = d2_z = 2 c2 (1 - cos q)
        d2_l = 4.0 * c2 * (1.0 - cq)
        d2_t = 2.0 * c2 * (1.0 - cq)
        # Termine dipolare lungo x
        env = math.exp(-((abs(kx) / ((2.0 * math.pi * 1.6) / a)) ** 2))
        inv_mu = 1.0 / m1 + 1.0 / m2
        delta_pol = ((polar_ratio ** 2 - 1.0) * on1 * inv_mu / inv_mu) * env if polar_ratio > 1.0 + 1e-12 else 0.0

        # Blocco 2×2 longitudinale
        a11 = (on1 + d2_l + delta_pol) / m1
        a22 = (on1 + d2_l + delta_pol) / m2
        a12 = (-2.0 * (cl * cq + 2.0 * ct) - delta_pol) / math.sqrt(m1 * m2)
        tr_l = a11 + a22
        disc_l = math.hypot(a11 - a22, 2.0 * a12)
        w2_la = 0.5 * (tr_l - disc_l)
        w2_lo = 0.5 * (tr_l + disc_l)

        # Blocco 2×2 trasversale (doppio)
        b11 = (on1 + d2_t) / m1
        b22 = (on1 + d2_t) / m2
        b12 = (-2.0 * (cl + ct * (cq + 1.0))) / math.sqrt(m1 * m2)
        tr_t = b11 + b22
        disc_t = math.hypot(b11 - b22, 2.0 * b12)
        w2_ta = 0.5 * (tr_t - disc_t)
        w2_to = 0.5 * (tr_t + disc_t)
        return sorted([w2_ta, w2_ta, w2_la, w2_to, w2_to, w2_lo])
    raise ValueError(crystal_id)


def analytical_eigenvalues_111(crystal_id: str, k_comp: float, r: float, polar_ratio: float) -> list[float]:
    """Formule chiuse esatte di ω² lungo [111] (Γ–L) con k = (k_comp, k_comp, k_comp)."""
    k_norm = math.sqrt(3.0) * abs(k_comp)
    if crystal_id == "aluminum":
        a = float(AL_A_D)
        cl = float(AL_CL_APP_D)
        M = float(AL_M_AMU_D * AMU_KG_D)
        beta1 = (2.0 * r - 1.0) * cl
        q = 0.5 * k_comp * a
        s2 = math.sin(q) ** 2
        d_diag = (4.0 / M) * (2.0 * cl + beta1) * s2
        d_off = (4.0 / M) * cl * s2
        w2_la = d_diag + 2.0 * d_off
        w2_ta = d_diag - d_off
        return sorted([w2_ta, w2_ta, w2_la])
    elif crystal_id == "diamond":
        a = float(DIA_A_D)
        cl = float(DIA_CL_APP_D)
        M = float(DIA_M_AMU_D * AMU_KG_D)
        A = (cl + 2.0 * r * cl) / (3.0 * M)
        B = (cl - r * cl) / (3.0 * M)
        q = 0.25 * k_comp * a
        f0 = cmath.exp(3j * q) + 3.0 * cmath.exp(-1j * q)
        f1 = cmath.exp(3j * q) - cmath.exp(-1j * q)
        lam_t = abs(A * f0 - B * f1)
        w2_ta = 4.0 * A - lam_t
        w2_to = 4.0 * A + lam_t
        # Longitudinale (con eventuale dipolo)
        c_dip = 0.0
        if polar_ratio > 1.0 + 1e-12:
            delta_pol = (polar_ratio ** 2 - 1.0) * (8.0 * A) / (2.0 / M)
            k_scale = (2.0 * math.pi * 1.6) / a
            c_dip = delta_pol * math.exp(-((k_norm / k_scale) ** 2)) / M
        d12_l = -(A * f0 + 2.0 * B * f1) - c_dip
        w2_la = (4.0 * A + c_dip) - abs(d12_l)
        w2_lo = (4.0 * A + c_dip) + abs(d12_l)
        return sorted([w2_ta, w2_ta, w2_la, w2_lo, w2_to, w2_to])
    elif crystal_id == "pbte":
        a = float(PBTE_A_D)
        cl = float(PBTE_CL_EXACT_D)
        ct = r * cl
        c2 = float(PBTE_C2_RATIO_D) * cl
        m1 = float(PB_M_AMU_D * AMU_KG_D)
        m2 = float(TE_M_AMU_D * AMU_KG_D)
        q = 0.5 * k_comp * a
        cq = math.cos(q)
        s2 = math.sin(q) ** 2
        on1 = 2.0 * (cl + 2.0 * ct)
        # Su [111] il blocco 2NN ha diagonale 4 c2 sin²q e fuori-diagonale 2 c2 sin²q:
        # autovalore L = 8 c2 sin²q, autovalore T (doppio) = 2 c2 sin²q
        d2_l = 8.0 * c2 * s2
        d2_t = 2.0 * c2 * s2
        env = math.exp(-((k_norm / ((2.0 * math.pi * 1.6) / a)) ** 2))
        delta_pol = ((polar_ratio ** 2 - 1.0) * on1) * env if polar_ratio > 1.0 + 1e-12 else 0.0
        d12_sr = -2.0 * (cl + 2.0 * ct) * cq
        a11 = (on1 + d2_l + delta_pol) / m1
        a22 = (on1 + d2_l + delta_pol) / m2
        a12 = (d12_sr - delta_pol) / math.sqrt(m1 * m2)
        disc_l = math.hypot(a11 - a22, 2.0 * a12)
        w2_la = 0.5 * (a11 + a22 - disc_l)
        w2_lo = 0.5 * (a11 + a22 + disc_l)

        b11 = (on1 + d2_t) / m1
        b22 = (on1 + d2_t) / m2
        b12 = d12_sr / math.sqrt(m1 * m2)
        disc_t = math.hypot(b11 - b22, 2.0 * b12)
        w2_ta = 0.5 * (b11 + b22 - disc_t)
        w2_to = 0.5 * (b11 + b22 + disc_t)
        return sorted([w2_ta, w2_ta, w2_la, w2_to, w2_to, w2_lo])
    raise ValueError(crystal_id)


def analytical_sound_speeds_al_100_110_111(r: float) -> dict[str, list[float]]:
    """
    Velocità del suono elastiche (m/s) da sviluppo k → 0 del tensore di Christoffel
    per Al (C11 = 4α1/a, C44 = 4rα1/a, C12 = 4(1−r)α1/a, ρ = 4M/a³):
      - [100]: v_LA = a√(α1/M), v_TA1 = v_TA2 = a√(rα1/M)
      - [111]: v_LA = a√(((3+2r)/3)·α1/M)? Verifichiamo da ω²_LA(q) = (4/M)(2r+3)α1 sin²(ka/2√3):
               q = k a / (2√3) ⇒ sin²q ≈ k² a² / 12 ⇒ ω²_LA ≈ ((2r+3)/3)(a² α1/M) k²!
               ω²_TA = (8r/M)α1 sin²q ≈ (2r/3)(a² α1/M) k²!
      - [110]: q = k a / (2√2):
               D_xx − D_xy = (8r α1/M)(1 − cos q) ≈ (4r α1/M) q² = (r/2)(a² α1/M) k² (T_{1-10})
               D_zz = (4/M)(1−cos q)[2α1 + (2r−1)α1(1+cos q)] ≈ (8r α1/M) q² = r(a² α1/M) k² (T_z)
               D_xx + D_xy ≈ (4/M)[(3/2 + r/2)α1] q²? Verifichiamo:
                 C_L[110] = (C11 + C12 + 2 C44)/2 = (4α1/a)(1 + (1−r) + 2r)/2 = (4α1/a)(2 + r)/2!
                 Quindi ω²_LA = ((2 + r)/2)(a² α1/M) k²!
    """
    a_m = float(AL_A_D * ANGSTROM_M_D)
    cl = float(AL_CL_APP_D)
    M = float(AL_M_AMU_D * AMU_KG_D)
    v0 = a_m * math.sqrt(cl / M)
    return {
        "100": sorted([v0 * math.sqrt(r), v0 * math.sqrt(r), v0]),
        "110": sorted([v0 * math.sqrt(0.5 * r), v0 * math.sqrt(r), v0 * math.sqrt(0.5 * (2.0 + r))]),
        "111": sorted([v0 * math.sqrt(2.0 * r / 3.0), v0 * math.sqrt(2.0 * r / 3.0), v0 * math.sqrt((3.0 + 2.0 * r) / 3.0)]),
    }


# =============================================================================
# 5. PONTE DI SOLA LETTURA VERSO src/renderer/src/physics/phonon3d.ts
# =============================================================================

NODE_BRIDGE = r"""
import { registerHooks } from 'node:module'
import { readFileSync } from 'node:fs'

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context)
    } catch (err) {
      if (specifier.startsWith('.') && !specifier.endsWith('.ts') && context.parentURL) {
        return nextResolve(`${specifier}.ts`, context)
      }
      throw err
    }
  }
})

const app = await import('./src/renderer/src/physics/phonon3d.ts')
const appConst = await import('./src/renderer/src/physics/constants.ts')
const { eigh } = await import('./src/renderer/src/physics/linalg.ts')

const payload = JSON.parse(readFileSync(0, 'utf8'))
const out = {
  constants: {
    AMU_KG: appConst.AMU_KG,
    NA_MOL: appConst.NA_MOL,
    THZ_TO_MEV: appConst.THZ_TO_MEV,
    RAD_S_TO_THZ: appConst.RAD_S_TO_THZ
  },
  crystals: app.CRYSTALS_3D,
  tab1: {},
  dispersions: {},
  singlePoints: [],
  sliderMatrix: [],
  modeCounting: [],
  macroAl: app.macroscopicAluminumEstimate(),
  bvkGrids: {},
  soundSpeedProbes: [],
  symmetryOps: [],
  boundarySlopes: {}
}

function serializeDynMatrix(m) {
  if (m.kind === 'real-symmetric') {
    return { kind: m.kind, n: m.n, re: Array.from(m.data), im: null }
  }
  return { kind: m.kind, n: m.n, re: Array.from(m.re), im: Array.from(m.im) }
}

function serializeMode(m) {
  return {
    sortedIndex: m.sortedIndex,
    role: m.role,
    isOptical: m.isOptical,
    omegaRadS: m.omegaRadS,
    freqThz: m.freqThz,
    energyMev: m.energyMev,
    longitudinalFraction: m.longitudinalFraction,
    polarizationVectors: m.polarizationVectors,
    polarizationVectorsIm: m.polarizationVectorsIm,
    displacementVectors: m.displacementVectors,
    displacementVectorsIm: m.displacementVectorsIm,
    basisPhaseRad: m.basisPhaseRad
  }
}

for (const id of payload.crystalIds) {
  const params = app.defaultParamsForCrystal(id)
  out.tab1[id] = app.phonon3DTab1Summary(params)

  const disp = app.computePhonon3DDispersion(params, payload.pointsPerSegment)
  const dynMatrices = []
  for (let i = 0; i < disp.path.points.length; i++) {
    const k = disp.path.points[i]
    const prev = disp.path.points[Math.max(0, i - 1)]
    const next = disp.path.points[Math.min(disp.path.points.length - 1, i + 1)]
    let hint = [next[0] - prev[0], next[1] - prev[1], next[2] - prev[2]]
    if (Math.hypot(k[0], k[1], k[2]) < 1e-12) {
      if (i + 1 < disp.path.points.length) {
        hint = [disp.path.points[i + 1][0] - k[0], disp.path.points[i + 1][1] - k[1], disp.path.points[i + 1][2] - k[2]]
      } else if (i > 0) {
        hint = [k[0] - disp.path.points[i - 1][0], k[1] - disp.path.points[i - 1][1], k[2] - disp.path.points[i - 1][2]]
      }
    }
    const dm = app.buildDynamicalMatrix3D(k, params, hint)
    dynMatrices.push({ hint, matrix: serializeDynMatrix(dm) })
  }

  out.dispersions[id] = {
    params: disp.params,
    path: {
      points: disp.path.points,
      distance: Array.from(disp.path.distance),
      labels: disp.path.labels
    },
    branches: disp.branches.map((b) => ({
      role: b.role,
      isOptical: b.isOptical,
      omegaRadS: Array.from(b.omegaRadS),
      freqThz: Array.from(b.freqThz),
      energyMev: Array.from(b.energyMev)
    })),
    segments: disp.segments.map((s) => ({
      index: s.index,
      label: s.label,
      symmetry: s.symmetry,
      startIndex: s.startIndex,
      endIndex: s.endIndex,
      branches: s.branches.map((b) => ({
        id: b.id,
        role: b.role,
        isOptical: b.isOptical,
        mixedPolarization: b.mixedPolarization,
        distance: Array.from(b.distance),
        omegaRadS: Array.from(b.omegaRadS),
        freqThz: Array.from(b.freqThz),
        energyMev: Array.from(b.energyMev)
      }))
    })),
    modesAtPoint: disp.modesAtPoint.map((arr) => arr.map(serializeMode)),
    dynMatrices,
    maxFreqThz: disp.maxFreqThz,
    maxEnergyMev: disp.maxEnergyMev
  }
}

for (const item of payload.singlePoints) {
  const dm = app.buildDynamicalMatrix3D(item.k, item.params, item.kHatHint)
  const eig = eigh(dm, { vectors: false })
  const modes = app.solvePhonon3DAtK(item.k, item.params, item.kHatHint)
  out.singlePoints.push({
    tag: item.tag,
    k: item.k,
    params: item.params,
    kHatHint: item.kHatHint,
    symClass: app.classifySymmetryDirection(item.k, item.kHatHint),
    matrix: serializeDynMatrix(dm),
    rawEigenvalues: Array.from(eig.values),
    modes: modes.map(serializeMode)
  })
}

for (const cfg of payload.sliderConfigs) {
  const disp = app.computePhonon3DDispersion(cfg.params, 20)
  const tab = app.phonon3DTab1Summary(cfg.params)
  out.sliderMatrix.push({
    tag: cfg.tag,
    params: cfg.params,
    tab1: tab,
    maxFreqThz: disp.maxFreqThz,
    branches: disp.branches.map((b) => ({ role: b.role, freqThz: Array.from(b.freqThz) })),
    segments: disp.segments.map((s) => ({
      label: s.label,
      symmetry: s.symmetry,
      branches: s.branches.map((b) => ({ role: b.role, mixed: b.mixedPolarization, freqThz: Array.from(b.freqThz) }))
    })),
    modesAtPoint: disp.modesAtPoint.map((arr) =>
      arr.map((m) => ({ role: m.role, isOptical: m.isOptical, omegaRadS: m.omegaRadS, freqThz: m.freqThz, L: m.longitudinalFraction }))
    )
  })
}

for (const mc of payload.modeCountingCases) {
  out.modeCounting.push({
    input: mc,
    result: app.computeModeCounting3D(mc.N, mc.p, mc.a)
  })
}

for (const N of payload.bvkGridNs) {
  out.bvkGrids[String(N)] = app.bvkGrid2D(N)
}

for (const sp of payload.soundSpeedProbes) {
  const modes = app.solvePhonon3DAtK(sp.k, sp.params, sp.kHatHint)
  out.soundSpeedProbes.push({
    tag: sp.tag,
    k: sp.k,
    omegas: modes.map((m) => m.omegaRadS),
    roles: modes.map((m) => m.role),
    Ls: modes.map((m) => m.longitudinalFraction)
  })
}

for (const item of payload.symmetryOps) {
  const modes = app.solvePhonon3DAtK(item.k, item.params, item.kHatHint)
  out.symmetryOps.push({
    tag: item.tag,
    group: item.group,
    omegas: modes.map((m) => m.omegaRadS)
  })
}

// Sonde pendenza al bordo di zona X e L (dω/dk per verificare effetto inviluppo gaussiano PbTe)
for (const id of payload.crystalIds) {
  const params = app.defaultParamsForCrystal(id)
  const a = app.CRYSTALS_3D[id].a
  const scale = (2 * Math.PI) / a
  const h = 1e-4
  const atXm = app.solvePhonon3DAtK([scale - h, 0, 0], params, [1, 0, 0]).map((m) => m.omegaRadS)
  const atXp = app.solvePhonon3DAtK([scale + h, 0, 0], params, [1, 0, 0]).map((m) => m.omegaRadS)
  const h3 = h / Math.sqrt(3)
  const kL = 0.5 * scale
  const atLm = app.solvePhonon3DAtK([kL - h3, kL - h3, kL - h3], params, [1, 1, 1]).map((m) => m.omegaRadS)
  const atLp = app.solvePhonon3DAtK([kL + h3, kL + h3, kL + h3], params, [1, 1, 1]).map((m) => m.omegaRadS)
  out.boundarySlopes[id] = {
    h,
    dOmegaDkAtX: atXp.map((wp, idx) => (wp - atXm[idx]) / (2 * h)),
    dOmegaDkAtL: atLp.map((wp, idx) => (wp - atLm[idx]) / (2 * h))
  }
}

process.stdout.write(JSON.stringify(out))
"""


def run_node_bridge(payload: dict[str, Any]) -> dict[str, Any]:
    if not NODE_EXE.exists():
        raise FileNotFoundError(f"Node locale non trovato in {NODE_EXE}")
    proc = subprocess.run(
        [str(NODE_EXE), "--input-type=module", "-e", NODE_BRIDGE],
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        cwd=str(ROOT),
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"Errore Node bridge:\nSTDOUT: {proc.stdout}\nSTDERR: {proc.stderr}")
    return json.loads(proc.stdout)


# =============================================================================
# 6. RECORDER DEI TEST E HELPER NUMERICI
# =============================================================================

class Recorder:
    def __init__(self) -> None:
        self.tests: list[dict[str, Any]] = []

    def add(
        self,
        group: str,
        name: str,
        passed: bool,
        max_abs_err: float | None = None,
        max_rel_err: float | None = None,
        tolerance: float | None = None,
        detail: str = "",
        extra: dict[str, Any] | None = None,
    ) -> None:
        self.tests.append({
            "group": group,
            "name": name,
            "status": "PASS" if passed else "FAIL",
            "maxAbsErr": max_abs_err,
            "maxRelErr": max_rel_err,
            "tolerance": tolerance,
            "detail": detail,
            "extra": extra or {},
        })


def rel_err(a: float, b: float) -> float:
    denom = max(abs(b), 1e-30)
    return abs(a - b) / denom


def matrix_from_app(m_dict: dict[str, Any]) -> list[list[complex]]:
    n = m_dict["n"]
    re = m_dict["re"]
    im = m_dict["im"]
    if im is None:
        return [[complex(re[i * n + j], 0.0) for j in range(n)] for i in range(n)]
    return [[complex(re[i * n + j], im[i * n + j]) for j in range(n)] for i in range(n)]


def matrix_diff_max(
    A: list[list[complex]],
    B: list[list[complex]],
    ref_scale: float | None = None,
) -> tuple[float, float]:
    n = len(A)
    max_abs = 0.0
    for i in range(n):
        for j in range(n):
            d = abs(A[i][j] - B[i][j])
            if d > max_abs:
                max_abs = d
    norm_b = ref_scale if ref_scale is not None else max(1e-30, hermitian_frobenius_norm(B))
    return max_abs, max_abs / max(1e-30, norm_b)


def mode_to_complex_vec(mode: dict[str, Any]) -> list[complex]:
    vec: list[complex] = []
    p = len(mode["polarizationVectors"])
    for a in range(p):
        vr = mode["polarizationVectors"][a]
        vi = mode["polarizationVectorsIm"][a]
        for c in range(3):
            vec.append(complex(vr[c], vi[c]))
    return vec


# =============================================================================
# 7. SUITE DI VERIFICA COMPLETA
# =============================================================================

def main() -> int:
    rec = Recorder()
    crystal_ids = ["aluminum", "diamond", "pbte"]

    # Costruisci payload per Node bridge
    single_points: list[dict[str, Any]] = []
    # Punti speciali, punti 3D generici e controlli su 1BZ
    scales = {
        "aluminum": 2.0 * math.pi / float(AL_A_D),
        "diamond": 2.0 * math.pi / float(DIA_A_D),
        "pbte": 2.0 * math.pi / float(PBTE_A_D),
    }
    defaults = {
        "aluminum": {"crystalId": "aluminum", "transverseRatio": 0.36, "polarRatio": 1.0},
        "diamond": {"crystalId": "diamond", "transverseRatio": 0.30, "polarRatio": 1.0},
        "pbte": {"crystalId": "pbte", "transverseRatio": 0.28, "polarRatio": 3.0},
    }
    # Punti chiave: Γ con 3 direzioni di avvicinamento, X, K, L, metà X-K, punto 3D generico, W
    probe_qs = [
        ("Gamma_100", (0.0, 0.0, 0.0), (1.0, 0.0, 0.0)),
        ("Gamma_111", (0.0, 0.0, 0.0), (1.0, 1.0, 1.0)),
        ("Gamma_110", (0.0, 0.0, 0.0), (1.0, 1.0, 0.0)),
        ("X", (1.0, 0.0, 0.0), (1.0, 0.0, 0.0)),
        ("K", (0.75, 0.75, 0.0), (1.0, 1.0, 0.0)),
        ("L", (0.5, 0.5, 0.5), (1.0, 1.0, 1.0)),
        ("W", (1.0, 0.5, 0.0), (1.0, 0.5, 0.0)),
        ("XK_mid", (0.875, 0.375, 0.0), (0.875, 0.375, 0.0)),
        ("generic_3d", (0.37, 0.21, 0.63), (0.37, 0.21, 0.63)),
        ("110_mid", (0.4, 0.4, 0.0), (1.0, 1.0, 0.0)),
        ("100_mid", (0.45, 0.0, 0.0), (1.0, 0.0, 0.0)),
        ("111_mid", (0.25, 0.25, 0.25), (1.0, 1.0, 1.0)),
    ]
    for cid in crystal_ids:
        sc = scales[cid]
        for qname, q, hint in probe_qs:
            single_points.append({
                "tag": f"{cid}:{qname}",
                "k": [q[0] * sc, q[1] * sc, q[2] * sc],
                "params": defaults[cid],
                "kHatHint": list(hint),
            })

    # Aggiungi verifica con polarRatio > 1 anche su Diamante (estremo slider UI!) e polarRatio = 1 su PbTe
    for r_val in (0.15, 0.85):
        for cid in crystal_ids:
            sc = scales[cid]
            for qname, q in [("X", (1.0, 0.0, 0.0)), ("L", (0.5, 0.5, 0.5)), ("generic_3d", (0.37, 0.21, 0.63))]:
                single_points.append({
                    "tag": f"{cid}:r={r_val}:{qname}",
                    "k": [q[0] * sc, q[1] * sc, q[2] * sc],
                    "params": {**defaults[cid], "transverseRatio": r_val},
                    "kHatHint": [1.0, 0.0, 0.0],
                })

    # Estremi degli slider UI (manifest.ts: r ∈ [0.15, 0.85], polarRatio ∈ [1.0, 3.5])
    slider_configs: list[dict[str, Any]] = []
    for cid in crystal_ids:
        pols = [1.0] if cid == "aluminum" else [1.0, 2.0, 3.5]
        for r_val in (0.15, defaults[cid]["transverseRatio"], 0.85):
            for pol_val in pols:
                slider_configs.append({
                    "tag": f"{cid}_r{r_val:.2f}_pol{pol_val:.2f}",
                    "params": {"crystalId": cid, "transverseRatio": r_val, "polarRatio": pol_val},
                })

    # Sonde velocità del suono k → 0 per Al
    sound_probes: list[dict[str, Any]] = []
    k_small = 1e-4  # Å⁻¹
    for dname, dvec in [("100", (1.0, 0.0, 0.0)), ("110", (1.0, 1.0, 0.0)), ("111", (1.0, 1.0, 1.0))]:
        u = normalize3(dvec)
        sound_probes.append({
            "tag": f"al_vs_{dname}",
            "k": [u[0] * k_small, u[1] * k_small, u[2] * k_small],
            "params": defaults["aluminum"],
            "kHatHint": list(u),
        })

    # Sonde simmetria O_h, inversione temporale (−k), periodicità k + G
    symmetry_ops: list[dict[str, Any]] = []
    for cid in crystal_ids:
        sc = scales[cid]
        k0 = (0.37 * sc, 0.21 * sc, 0.63 * sc)
        # Gruppo 1: simmetria cubica O_h e inversione temporale
        oh_variants = [
            ("orig", k0),
            ("neg", (-k0[0], -k0[1], -k0[2])),
            ("perm_yzx", (k0[1], k0[2], k0[0])),
            ("perm_xzy_neg", (k0[0], -k0[2], k0[1])),
            ("mirror_x", (-k0[0], k0[1], k0[2])),
        ]
        for vname, kv in oh_variants:
            symmetry_ops.append({
                "tag": f"{cid}:Oh:{vname}",
                "group": f"{cid}:Oh",
                "k": list(kv),
                "params": defaults[cid],
                "kHatHint": [1.0, 0.0, 0.0],
            })
        # Gruppo 2: periodicità k + G (con G_bcc = (2π/a)(1,1,1) e (2π/a)(2,0,0)) su modello SR (polarRatio = 1)
        p_sr = {**defaults[cid], "polarRatio": 1.0}
        g_variants = [
            ("k0", k0),
            ("k0+G111", (k0[0] + sc, k0[1] + sc, k0[2] + sc)),
            ("k0+G200", (k0[0] + 2.0 * sc, k0[1], k0[2])),
            ("k0+G1m11", (k0[0] + sc, k0[1] - sc, k0[2] + sc)),
        ]
        for vname, kv in g_variants:
            symmetry_ops.append({
                "tag": f"{cid}:G:{vname}",
                "group": f"{cid}:G_SR",
                "k": list(kv),
                "params": p_sr,
                "kHatHint": [1.0, 0.0, 0.0],
            })

    mode_counting_cases = [
        {"N": 1, "p": 1, "a": 4.05},
        {"N": 4, "p": 1, "a": 4.05},
        {"N": 8, "p": 1, "a": 4.05},
        {"N": 8, "p": 2, "a": 3.57},
        {"N": 8, "p": 2, "a": 6.46},
        {"N": 7, "p": 3, "a": 5.0},
        {"N": 12, "p": 4, "a": 5.43},
        {"N": 100, "p": 2, "a": 6.46},
    ]

    payload = {
        "crystalIds": crystal_ids,
        "pointsPerSegment": 40,
        "singlePoints": single_points,
        "sliderConfigs": slider_configs,
        "modeCountingCases": mode_counting_cases,
        "bvkGridNs": list(range(2, 16)),
        "soundSpeedProbes": sound_probes,
        "symmetryOps": symmetry_ops,
    }

    app_out = run_node_bridge(payload)

    # =========================================================================
    # TEST 1: CALIBRAZIONI E VALORI TAB. 1 (50 CIFRE DECIMAL vs SI 2019)
    # =========================================================================
    al_la_thz_exact = Decimal("40") / THZ_TO_MEV_EXACT_D
    al_ta_thz_exact = Decimal("24") / THZ_TO_MEV_EXACT_D
    dia_opt_thz_exact = Decimal("160") / THZ_TO_MEV_EXACT_D
    pbte_lo_mev_exact = Decimal("3.3") * THZ_TO_MEV_EXACT_D
    pbte_to_mev_exact = Decimal("1.1") * THZ_TO_MEV_EXACT_D

    # Verifica calibratedCL
    cl_errs = {
        "al_vs_app_const": rel_err(app_out["crystals"]["aluminum"]["calibratedCL"], float(AL_CL_APP_D)),
        "al_vs_si2019": rel_err(app_out["crystals"]["aluminum"]["calibratedCL"], float(AL_CL_EXACT_D)),
        "dia_vs_app_const": rel_err(app_out["crystals"]["diamond"]["calibratedCL"], float(DIA_CL_APP_D)),
        "dia_vs_si2019": rel_err(app_out["crystals"]["diamond"]["calibratedCL"], float(DIA_CL_EXACT_D)),
        "pbte_vs_si2019": rel_err(app_out["crystals"]["pbte"]["calibratedCL"], float(PBTE_CL_EXACT_D)),
    }
    rec.add(
        "1. Tab. 1 e calibrazioni",
        "Costanti di forza calibrate C_L (Al, Diamante, PbTe)",
        max(cl_errs["al_vs_app_const"], cl_errs["dia_vs_app_const"], cl_errs["pbte_vs_si2019"]) < 1e-14
        and max(cl_errs["al_vs_si2019"], cl_errs["dia_vs_si2019"]) < 1e-9,
        max_rel_err=max(cl_errs.values()),
        tolerance=1e-9,
        detail=(
            f"Al C_L={float(AL_CL_APP_D):.6f} N/m (err vs app_const={cl_errs['al_vs_app_const']:.2e}, vs SI2019={cl_errs['al_vs_si2019']:.2e}); "
            f"Dia C_L={float(DIA_CL_APP_D):.6f} N/m (err vs app_const={cl_errs['dia_vs_app_const']:.2e}, vs SI2019={cl_errs['dia_vs_si2019']:.2e}); "
            f"PbTe C_L={float(PBTE_CL_EXACT_D):.6f} N/m (err={cl_errs['pbte_vs_si2019']:.2e})"
        ),
        extra=cl_errs,
    )

    # Verifica Tab. 1 — Alluminio
    t_al = app_out["tab1"]["aluminum"]
    al_mev_err = max(rel_err(t_al["laAtXMev"], 40.0), rel_err(t_al["taAtXMev"], 24.0))
    al_thz_err_exact = max(rel_err(t_al["laAtXThz"], float(al_la_thz_exact)), rel_err(t_al["taAtXThz"], float(al_ta_thz_exact)))
    al_nulls_ok = all(t_al[k] is None for k in ("loAtGammaMev", "loAtGammaThz", "toAtGammaMev", "toAtGammaThz", "loToSplitThz", "loToSplitMev"))
    rec.add(
        "1. Tab. 1 e calibrazioni",
        "Alluminio Tab. 1 a X: LA = 40 meV (9,67 THz), TA = 24 meV (5,80 THz)",
        al_mev_err < 1e-14 and al_thz_err_exact < 1e-9 and al_nulls_ok,
        max_rel_err=max(al_mev_err, al_thz_err_exact),
        tolerance=1e-9,
        detail=f"LA={t_al['laAtXMev']:.12f} meV ({t_al['laAtXThz']:.9f} THz), TA={t_al['taAtXMev']:.12f} meV ({t_al['taAtXThz']:.9f} THz)",
        extra={"app": t_al, "refThzExact": [float(al_la_thz_exact), float(al_ta_thz_exact)], "mevErr": al_mev_err, "thzErrExact": al_thz_err_exact},
    )

    # Verifica Tab. 1 — Diamante
    t_dia = app_out["tab1"]["diamond"]
    dia_mev_err = max(rel_err(t_dia["loAtGammaMev"], 160.0), rel_err(t_dia["toAtGammaMev"], 160.0))
    dia_thz_err_exact = max(rel_err(t_dia["loAtGammaThz"], float(dia_opt_thz_exact)), rel_err(t_dia["toAtGammaThz"], float(dia_opt_thz_exact)))
    dia_split_err = max(abs(t_dia["loToSplitThz"]), abs(t_dia["loToSplitMev"]))
    dia_la_x_ref = 160.0 / math.sqrt(2.0)
    dia_la_x_err = rel_err(t_dia["laAtXMev"], dia_la_x_ref)
    rec.add(
        "1. Tab. 1 e calibrazioni",
        "Diamante Tab. 1 a Γ: 3 ottici degeneri = 160 meV (38,69 THz), split = 0, LA(X) = 160/√2",
        dia_mev_err < 1e-14 and dia_thz_err_exact < 1e-9 and dia_split_err < 1e-13 and dia_la_x_err < 1e-14,
        max_rel_err=max(dia_mev_err, dia_thz_err_exact, dia_la_x_err),
        max_abs_err=dia_split_err,
        tolerance=1e-9,
        detail=f"LO=TO={t_dia['loAtGammaMev']:.12f} meV ({t_dia['loAtGammaThz']:.9f} THz), split={dia_split_err:.2e}, LA(X)={t_dia['laAtXMev']:.9f} meV",
        extra={"app": t_dia, "refThzExact": float(dia_opt_thz_exact), "diaLaXRef": dia_la_x_ref},
    )

    # Verifica Tab. 1 — PbTe
    t_pb = app_out["tab1"]["pbte"]
    pb_thz_err = max(rel_err(t_pb["loAtGammaThz"], 3.3), rel_err(t_pb["toAtGammaThz"], 1.1), rel_err(t_pb["loToSplitThz"], 2.2))
    pb_mev_err_exact = max(rel_err(t_pb["loAtGammaMev"], float(pbte_lo_mev_exact)), rel_err(t_pb["toAtGammaMev"], float(pbte_to_mev_exact)))
    rec.add(
        "1. Tab. 1 e calibrazioni",
        "PbTe Tab. 1 a Γ: LO = 3,30 THz (13,65 meV), TO = 1,10 THz (4,55 meV), split = 2,20 THz",
        pb_thz_err < 1e-14 and pb_mev_err_exact < 1e-9,
        max_rel_err=max(pb_thz_err, pb_mev_err_exact),
        tolerance=1e-9,
        detail=f"LO={t_pb['loAtGammaThz']:.12f} THz ({t_pb['loAtGammaMev']:.9f} meV), TO={t_pb['toAtGammaThz']:.12f} THz ({t_pb['toAtGammaMev']:.9f} meV)",
        extra={"app": t_pb, "refMevExact": [float(pbte_lo_mev_exact), float(pbte_to_mev_exact)], "thzErr": pb_thz_err, "mevErrExact": pb_mev_err_exact},
    )

    # =========================================================================
    # TEST 2: MATRICI DINAMICHE DA SPAZIO REALE, SOMMA NULLA, HERMITICITÀ,
    #         DIAGONALIZZAZIONE JACOBI SU TUTTI I 161 PUNTI E RESIDUI/NEWTON
    # =========================================================================
    disp_summary: dict[str, Any] = {}
    for cid in crystal_ids:
        d_app = app_out["dispersions"][cid]
        params = d_app["params"]
        r = params["transverseRatio"]
        pol = params["polarRatio"]
        pts = d_app["path"]["points"]
        n_pts = len(pts)

        max_mat_rel = 0.0
        max_mat_abs = 0.0
        max_herm = 0.0
        max_sr = 0.0
        max_phi_sym = 0.0
        max_w2_rel = 0.0
        max_w_rel = 0.0
        max_thz_rel = 0.0
        max_mev_rel_exact = 0.0
        max_eig_res = 0.0
        max_ortho_err = 0.0
        max_lfrac_err = 0.0
        max_disp_err = 0.0
        max_newton_res = 0.0
        max_trace_err = 0.0
        max_frob_err = 0.0
        min_eig_ratio = float("inf")
        any_bad = False

        crystal_w2_scale = max(1.0, max(m["omegaRadS"] ** 2 for ms in d_app["modesAtPoint"] for m in ms))

        for i in range(n_pts):
            k = tuple(pts[i])
            hint = tuple(d_app["dynMatrices"][i]["hint"])
            D_indep, sr_err, sym_err, bonds, masses = build_indep_dynamical_matrix(cid, k, r, pol, hint, use_app_cl=True)
            D_app = matrix_from_app(d_app["dynMatrices"][i]["matrix"])

            max_sr = max(max_sr, sr_err)
            max_phi_sym = max(max_phi_sym, sym_err)
            max_herm = max(max_herm, hermitian_asymmetry(D_app))
            m_abs, m_rel = matrix_diff_max(D_app, D_indep, ref_scale=crystal_w2_scale)
            max_mat_abs = max(max_mat_abs, m_abs)
            max_mat_rel = max(max_mat_rel, m_rel)

            # Diagonalizzazione indipendente di Jacobi su D_indep
            vals_j, vecs_j = jacobi_hermitian(D_indep)
            scale_w2 = crystal_w2_scale
            min_eig_ratio = min(min_eig_ratio, vals_j[0] / scale_w2)

            # Invarianti spettrali di Jacobi (traccia e norma di Frobenius)
            tr_D = sum(D_indep[m][m].real for m in range(len(D_indep)))
            frob2_D = hermitian_frobenius_norm(D_indep) ** 2
            max_trace_err = max(max_trace_err, abs(sum(vals_j) - tr_D) / max(crystal_w2_scale, abs(tr_D)))
            max_frob_err = max(max_frob_err, abs(sum(v * v for v in vals_j) - frob2_D) / max(crystal_w2_scale ** 2, frob2_D))

            # Modi restituiti dall'app in questo punto (ordinati per ω crescente per confronto spettrale)
            modes_app = d_app["modesAtPoint"][i]
            modes_by_w = sorted(modes_app, key=lambda m: m["omegaRadS"])
            app_vecs = []
            k_hat = normalize3(k, normalize3(hint))

            for s, m_app in enumerate(modes_by_w):
                w_app = m_app["omegaRadS"]
                if not math.isfinite(w_app):
                    any_bad = True
                w2_j = 0.0 if vals_j[s] <= 1e-11 * scale_w2 else vals_j[s]
                w_j = math.sqrt(w2_j)
                if w2_j > 0:
                    max_w2_rel = max(max_w2_rel, abs(w_app * w_app - vals_j[s]) / scale_w2)
                    max_w_rel = max(max_w_rel, rel_err(w_app, w_j))
                    max_thz_rel = max(max_thz_rel, rel_err(m_app["freqThz"], rad_s_to_thz(w_j)))
                    max_mev_rel_exact = max(max_mev_rel_exact, rel_err(m_app["energyMev"], rad_s_to_mev_exact(w_j)))
                else:
                    max_w_rel = max(max_w_rel, abs(w_app) / math.sqrt(scale_w2))

                v_app = mode_to_complex_vec(m_app)
                app_vecs.append(v_app)
                # Residuo agli autovalori su D_indep!
                max_eig_res = max(max_eig_res, eigen_residual(D_indep, w_app * w_app, v_app, ref_scale=crystal_w2_scale))

                # Verifica frazione longitudinale ∑_α |k̂ · ε_α|²
                p = len(masses)
                l_calc = 0.0
                for a_idx in range(p):
                    dot = (
                        v_app[a_idx * 3] * k_hat[0]
                        + v_app[a_idx * 3 + 1] * k_hat[1]
                        + v_app[a_idx * 3 + 2] * k_hat[2]
                    )
                    l_calc += abs(dot) ** 2
                max_lfrac_err = max(max_lfrac_err, abs(m_app["longitudinalFraction"] - l_calc))

                # Verifica displacementVectors ∝ ε_α / √M_α normalizzati
                u_raw = []
                max_u = 0.0
                for a_idx in range(p):
                    inv_sm = 1.0 / math.sqrt(masses[a_idx])
                    ua = [v_app[a_idx * 3 + c] * inv_sm for c in range(3)]
                    u_raw.append(ua)
                    mag_u = math.sqrt(sum(abs(x) ** 2 for x in ua))
                    if mag_u > max_u:
                        max_u = mag_u
                for a_idx in range(p):
                    for c in range(3):
                        u_exp = u_raw[a_idx][c] / max_u if max_u > 1e-30 else 0j
                        u_got = complex(m_app["displacementVectors"][a_idx][c], m_app["displacementVectorsIm"][a_idx][c])
                        max_disp_err = max(max_disp_err, abs(u_got - u_exp))

                # Verifica diretta equazioni di Newton 3D (eq. 25):
                # −M_α ω² u_{0αi} = −∑_{mβj} Φ_{αi,βj}(0, m) u_{0βj} e^{i k·δ}  (per parte SR; su polarRatio=1)
                if pol <= 1.0 + 1e-12:
                    # calcola forza F_{0αi} = −∑_{mβj} Φ_{αi,βj}(0,m) u_{mβj}
                    # normalizza u per avere max|u|=1
                    u_norm = [[u_raw[a_idx][c] / max_u for c in range(3)] for a_idx in range(p)]
                    # on-site force
                    phi_onsite = [[[0.0 for _ in range(3)] for _ in range(3)] for _ in range(p)]
                    for al, _be, _de, ph in bonds:
                        for ii in range(3):
                            for jj in range(3):
                                phi_onsite[al][ii][jj] -= ph[ii][jj]
                    f_vec = [[0j, 0j, 0j] for _ in range(p)]
                    for al in range(p):
                        for ii in range(3):
                            for jj in range(3):
                                f_vec[al][ii] -= phi_onsite[al][ii][jj] * u_norm[al][jj]
                    for al, be, de, ph in bonds:
                        ph_exp = cmath.exp(1j * (k[0] * de[0] + k[1] * de[1] + k[2] * de[2]))
                        for ii in range(3):
                            for jj in range(3):
                                f_vec[al][ii] -= ph[ii][jj] * u_norm[be][jj] * ph_exp
                    # Confronta F_{0αi} con −M_α ω² u_{0αi}
                    num_n = 0.0
                    den_n = 0.0
                    for al in range(p):
                        for ii in range(3):
                            lhs = -masses[al] * (w_app * w_app) * u_norm[al][ii]
                            num_n += abs(lhs - f_vec[al][ii]) ** 2
                            den_n += (masses[al] * scale_w2) ** 2
                    max_newton_res = max(max_newton_res, math.sqrt(num_n) / max(1e-30, math.sqrt(den_n)))

            max_ortho_err = max(max_ortho_err, orthonormality_error(app_vecs))

        disp_summary[cid] = {
            "maxMatRel": max_mat_rel,
            "maxMatAbs": max_mat_abs,
            "maxHerm": max_herm,
            "maxSumRule": max_sr,
            "maxPhiSym": max_phi_sym,
            "maxW2Rel": max_w2_rel,
            "maxWRel": max_w_rel,
            "maxThzRel": max_thz_rel,
            "maxMevRelExact": max_mev_rel_exact,
            "maxEigRes": max_eig_res,
            "maxOrthoErr": max_ortho_err,
            "maxLFracErr": max_lfrac_err,
            "maxDispErr": max_disp_err,
            "maxNewtonRes": max_newton_res if pol <= 1.0 + 1e-12 else None,
            "maxTraceErr": max_trace_err,
            "maxFrobErr": max_frob_err,
            "minEigRatio": min_eig_ratio,
        }

        rec.add(
            "2. Matrice dinamica & Jacobi",
            f"{cid}: D(k) da spazio reale vs buildDynamicalMatrix3D (161 pt)",
            max_mat_rel < 1e-14 and max_herm < 1e-14 and max_sr < 1e-13 and max_phi_sym < 1e-13 and min_eig_ratio >= -1e-13,
            max_abs_err=max_mat_abs,
            max_rel_err=max_mat_rel,
            tolerance=1e-14,
            detail=f"rel={max_mat_rel:.2e}, herm={max_herm:.2e}, sumRule={max_sr:.2e}, minEig/max={min_eig_ratio:.2e}",
            extra=disp_summary[cid],
        )
        rec.add(
            "2. Matrice dinamica & Jacobi",
            f"{cid}: autovalori ω, ν (Jacobi indipendente vs eigh/solvePhonon3DAtK, 161 pt)",
            (not any_bad) and max_w_rel < 1e-12 and max_thz_rel < 1e-12 and max_mev_rel_exact < 1e-9,
            max_rel_err=max(max_w_rel, max_thz_rel),
            tolerance=1e-12,
            detail=f"ω rel={max_w_rel:.2e}, ν rel={max_thz_rel:.2e}, meV vs SI2019={max_mev_rel_exact:.2e}, trace={max_trace_err:.2e}",
        )
        rec.add(
            "2. Matrice dinamica & Jacobi",
            f"{cid}: residui autovettori ‖Dε−ω²ε‖, ortonormalità, L_s, u_α e Newton eq.(25)",
            max_eig_res < 1e-12 and max_ortho_err < 1e-12 and max_lfrac_err < 1e-13 and max_disp_err < 1e-13 and (pol > 1.0 + 1e-12 or max_newton_res < 1e-12),
            max_rel_err=max(max_eig_res, max_ortho_err, max_lfrac_err, max_disp_err, max_newton_res),
            tolerance=1e-12,
            detail=f"res={max_eig_res:.2e}, ortho={max_ortho_err:.2e}, L_err={max_lfrac_err:.2e}, u_err={max_disp_err:.2e}, newton={max_newton_res:.2e}",
        )

    # =========================================================================
    # TEST 3: FORMULE ANALITICHE CHIUSE LUNGO [100] (Γ–X) E [111] (Γ–L)
    # =========================================================================
    for cid in crystal_ids:
        d_app = app_out["dispersions"][cid]
        params = d_app["params"]
        r = params["transverseRatio"]
        pol = params["polarRatio"]
        pts = d_app["path"]["points"]

        # Segmento 0: Γ–X (indici 0..40)
        max_err_100 = 0.0
        for idx in range(0, 41):
            kx = pts[idx][0]
            ref_w2 = analytical_eigenvalues_100(cid, kx, r, pol)
            app_w2 = sorted(m["omegaRadS"] ** 2 for m in d_app["modesAtPoint"][idx])
            scale = max(1.0, ref_w2[-1])
            for a, b in zip(app_w2, ref_w2):
                max_err_100 = max(max_err_100, abs(a - b) / scale)

        # Segmento 3: Γ–L (indici 120..160)
        max_err_111 = 0.0
        for idx in range(120, 161):
            kc = pts[idx][0]
            ref_w2 = analytical_eigenvalues_111(cid, kc, r, pol)
            app_w2 = sorted(m["omegaRadS"] ** 2 for m in d_app["modesAtPoint"][idx])
            scale = max(1.0, ref_w2[-1])
            for a, b in zip(app_w2, ref_w2):
                max_err_111 = max(max_err_111, abs(a - b) / scale)

        rec.add(
            "3. Formule analitiche chiuse",
            f"{cid}: formula chiusa ω² lungo Γ–X ([100]) e Γ–L ([111])",
            max_err_100 < 1e-13 and max_err_111 < 1e-13,
            max_rel_err=max(max_err_100, max_err_111),
            tolerance=1e-13,
            detail=f"max err ω²/ω²_max: Γ–X={max_err_100:.2e}, Γ–L={max_err_111:.2e}",
        )

    # =========================================================================
    # TEST 4: SIMMETRIE, DEGENERAZIONI, RIMOZIONE SU [110], POLARIZZAZIONE MISTA,
    #         REGOLA SOMMA ACUSTICA A Γ E SEMIDEFINITEZZA SU GRIGLIA 3D DENSA
    # =========================================================================
    # 4a. Degenerazione TA1=TA2 (e TO1=TO2) e purezza L/T su tutti i punti interni di Γ–X e Γ–L
    for cid in crystal_ids:
        d_app = app_out["dispersions"][cid]
        p = 1 if cid == "aluminum" else 2
        max_deg_100 = 0.0
        max_deg_111 = 0.0
        max_pol_impure = 0.0

        for idx in list(range(1, 41)) + list(range(121, 161)):
            modes = d_app["modesAtPoint"][idx]
            by_role = {m["role"]: m for m in modes}
            d_ta = abs(by_role["TA1"]["freqThz"] - by_role["TA2"]["freqThz"])
            d_to = abs(by_role["TO1"]["freqThz"] - by_role["TO2"]["freqThz"]) if p == 2 else 0.0
            if idx <= 40:
                max_deg_100 = max(max_deg_100, d_ta, d_to)
            else:
                max_deg_111 = max(max_deg_111, d_ta, d_to)
            max_pol_impure = max(
                max_pol_impure,
                abs(by_role["LA"]["longitudinalFraction"] - 1.0),
                by_role["TA1"]["longitudinalFraction"],
                by_role["TA2"]["longitudinalFraction"],
            )
            if p == 2:
                max_pol_impure = max(
                    max_pol_impure,
                    abs(by_role["LO"]["longitudinalFraction"] - 1.0),
                    by_role["TO1"]["longitudinalFraction"],
                    by_role["TO2"]["longitudinalFraction"],
                )

        rec.add(
            "4. Simmetrie & polarizzazioni",
            f"{cid}: degenerazione TA/TO e purezza L/T su Γ–X (C₄) e Γ–L (C₃)",
            max_deg_100 < 1e-11 and max_deg_111 < 1e-11 and max_pol_impure < 1e-11,
            max_abs_err=max(max_deg_100, max_deg_111, max_pol_impure),
            tolerance=1e-11,
            detail=f"Δν_deg Γ–X={max_deg_100:.2e} THz, Γ–L={max_deg_111:.2e} THz, impurezza L/T={max_pol_impure:.2e}",
        )

    # 4b. Rimozione degenerazione lungo [110] (K–Γ, punti interni 81..119)
    for cid in crystal_ids:
        d_app = app_out["dispersions"][cid]
        p = 1 if cid == "aluminum" else 2
        # Verifica al punto centrale del tratto K–Γ (indice 100 = 0.375*(2π/a)*(1,1,0)) e su tutto il tratto interno
        mid_modes = d_app["modesAtPoint"][100]
        by_role = {m["role"]: m for m in mid_modes}
        split_ta_mid = abs(by_role["TA2"]["freqThz"] - by_role["TA1"]["freqThz"])
        split_to_mid = abs(by_role["TO2"]["freqThz"] - by_role["TO1"]["freqThz"]) if p == 2 else None
        freqs_sorted = sorted(m["freqThz"] for m in mid_modes)
        min_gap_all = min(freqs_sorted[i + 1] - freqs_sorted[i] for i in range(len(freqs_sorted) - 1))

        # Su [110] in Al (fcc) e PbTe (NaCl) tutti i modi sono esattamente puri L o T (L ∈ {0, 1}).
        # Nel Diamante (T_d) il piano speculare (1,-1,0) disaccoppia solo i 2 modi [1,-1,0] (L=0),
        # mentre i 4 modi nel piano ([110],[001]) appartengono alla stessa irrep Σ₁ e si mescolano.
        max_impure_110 = 0.0
        for idx in range(80, 120):
            modes_idx = d_app["modesAtPoint"][idx]
            if cid == "diamond":
                ls_sorted = sorted(m["longitudinalFraction"] for m in modes_idx)
                # I 2 modi [1,-1,0] devono avere L = 0; i 4 modi Σ₁ hanno ∑L = 2 e somma totale ∑L = 2
                max_impure_110 = max(max_impure_110, ls_sorted[0], ls_sorted[1], abs(sum(ls_sorted) - 2.0))
            else:
                br = {m["role"]: m for m in modes_idx}
                max_impure_110 = max(
                    max_impure_110,
                    abs(br["LA"]["longitudinalFraction"] - 1.0),
                    br["TA1"]["longitudinalFraction"],
                    br["TA2"]["longitudinalFraction"],
                )
                if p == 2:
                    max_impure_110 = max(
                        max_impure_110,
                        abs(br["LO"]["longitudinalFraction"] - 1.0),
                        br["TO1"]["longitudinalFraction"],
                        br["TO2"]["longitudinalFraction"],
                    )

        ok_split = split_ta_mid > 0.05 and (p == 1 or (split_to_mid is not None and split_to_mid > 0.01)) and min_gap_all > 0.01
        pol_desc = "2 modi [1,-1,0] puri T + 4 modi Σ₁ misti" if cid == "diamond" else "purezza L/T"
        rec.add(
            "4. Simmetrie & polarizzazioni",
            f"{cid}: rimozione degenerazione su K–Γ ([110], tutti i {3*p} rami distinti + {pol_desc})",
            ok_split and max_impure_110 < 1e-11,
            max_abs_err=max_impure_110,
            tolerance=1e-11,
            detail=(
                f"a metà K–Γ: ΔTA={split_ta_mid:.4f} THz"
                + (f", ΔTO={split_to_mid:.4f} THz" if split_to_mid is not None else "")
                + f", min_gap={min_gap_all:.4f} THz, err_sym={max_impure_110:.2e}"
            ),
            extra={"midFreqsThz": freqs_sorted, "splitTA": split_ta_mid, "splitTO": split_to_mid},
        )

    # 4c. Polarizzazione mista su X–K e in punto 3D generico (0.37, 0.21, 0.63)
    sp_by_tag = {item["tag"]: item for item in app_out["singlePoints"]}
    for cid in crystal_ids:
        p = 1 if cid == "aluminum" else 2
        xk = sp_by_tag[f"{cid}:XK_mid"]
        g3 = sp_by_tag[f"{cid}:generic_3d"]
        xk_ls = [m["longitudinalFraction"] for m in xk["modes"]]
        g3_ls = [m["longitudinalFraction"] for m in g3["modes"]]
        # Su X-K (piano xy, k_z=0):
        # - Al e PbTe hanno piano speculare z ↔ -z: p modi z-polarizzati con L = 0, 2p modi misti nel piano xy
        # - Diamante: legami tetraedrici fuori dal piano accoppiano z con (x,y), tutti e 6 i modi sono misti
        mixed_xk = [x for x in xk_ls if 1e-5 < x < 1.0 - 1e-5]
        pure_t_xk = [x for x in xk_ls if x < 1e-10]
        expected_mixed_xk = 6 if cid == "diamond" else 2 * p
        expected_pure_xk = 0 if cid == "diamond" else p
        # In punto 3D generico: tutti e 3p i modi hanno 0 < L < 1 e ∑_{s=1}^{3p} L_s = tr(P_L) = p
        sum_l_xk = sum(xk_ls)
        sum_l_g3 = sum(g3_ls)
        mixed_g3 = [x for x in g3_ls if 1e-5 < x < 1.0 - 1e-5]
        sum_err = max(abs(sum_l_xk - p), abs(sum_l_g3 - p))
        rec.add(
            "4. Simmetrie & polarizzazioni",
            f"{cid}: polarizzazione mista su X–K ({len(mixed_xk)}/{3*p} misti) e 3D generico + regola somma ∑L_s = p",
            xk["symClass"] == "generic"
            and g3["symClass"] == "generic"
            and len(mixed_xk) == expected_mixed_xk
            and len(pure_t_xk) == expected_pure_xk
            and len(mixed_g3) == 3 * p
            and sum_err < 1e-12,
            max_abs_err=sum_err,
            tolerance=1e-12,
            detail=f"X–K L={[round(x, 4) for x in xk_ls]}; 3D gen L={[round(x, 4) for x in g3_ls]}; |∑L−p|={sum_err:.2e}",
            extra={"xkLs": xk_ls, "g3Ls": g3_ls},
        )

    # 4d. Regola di somma acustica a Γ (tutte e 3 le direzioni di avvicinamento) + isotropia LO/TO a Γ in PbTe
    for cid in crystal_ids:
        p = 1 if cid == "aluminum" else 2
        g_specs = []
        max_ac_g = 0.0
        for d in ("Gamma_100", "Gamma_111", "Gamma_110"):
            item = sp_by_tag[f"{cid}:{d}"]
            ac = [m for m in item["modes"] if not m["isOptical"]]
            opt = [m for m in item["modes"] if m["isOptical"]]
            assert len(ac) == 3 and len(opt) == 3 * (p - 1)
            for m in ac:
                max_ac_g = max(max_ac_g, m["omegaRadS"])
            g_specs.append(sorted(m["freqThz"] for m in item["modes"]))
        iso_err = max(
            abs(g_specs[a][s] - g_specs[0][s])
            for a in (1, 2)
            for s in range(3 * p)
        )
        rec.add(
            "4. Simmetrie & polarizzazioni",
            f"{cid}: 3 modi acustici nulli a Γ e isotropia spettrale lungo [100], [111], [110]",
            max_ac_g < 1e-6 and iso_err < 1e-12,
            max_abs_err=max(max_ac_g, iso_err),
            tolerance=1e-12,
            detail=f"max ω_ac(Γ)={max_ac_g:.2e} rad/s, max Δν tra direzioni={iso_err:.2e} THz",
        )

    # 4e. Simmetria O_h, inversione temporale (−k) e periodicità k + G (su parte SR)
    sym_groups: dict[str, list[dict[str, Any]]] = {}
    for item in app_out["symmetryOps"]:
        sym_groups.setdefault(item["group"], []).append(item)

    for gname, items in sym_groups.items():
        ref_w = sorted(items[0]["omegas"])
        w_scale = max(1.0, ref_w[-1])
        max_diff = 0.0
        for it in items[1:]:
            ws = sorted(it["omegas"])
            for a, b in zip(ws, ref_w):
                max_diff = max(max_diff, abs(a - b) / w_scale)
        rec.add(
            "4. Simmetrie & polarizzazioni",
            f"Invarianza spettrale {gname}",
            max_diff < 1e-13,
            max_rel_err=max_diff,
            tolerance=1e-13,
            detail=f"max |ω_rot − ω_0|/ω_max = {max_diff:.2e} su {len(items)} vettori equivalenti",
        )

    # 4f. Semidefinitezza positiva su griglia 3D densa (7×7×7 = 343 punti in 1BZ) per Al, Dia, PbTe con r ∈ {0.15, r0, 0.85}
    for cid in crystal_ids:
        sc = scales[cid]
        pol = defaults[cid]["polarRatio"]
        crystal_w2_scale = max(1.0, max(m["omegaRadS"] ** 2 for ms in app_out["dispersions"][cid]["modesAtPoint"] for m in ms))
        worst_neg = 0.0
        tested = 0
        for r_val in (0.15, defaults[cid]["transverseRatio"], 0.85):
            for ix in range(-3, 4):
                for iy in range(-3, 4):
                    for iz in range(-3, 4):
                        k = ((ix / 3.0) * sc, (iy / 3.0) * sc, (iz / 3.0) * sc)
                        D_i, _, _, _, _ = build_indep_dynamical_matrix(cid, k, r_val, pol)
                        vals_j, _ = jacobi_hermitian(D_i)
                        ratio = vals_j[0] / crystal_w2_scale
                        if ratio < worst_neg:
                            worst_neg = ratio
                        tested += 1
        rec.add(
            "4. Simmetrie & polarizzazioni",
            f"{cid}: stabilità dinamica (ω² ≥ 0) su griglia 3D densa ({tested} punti × 3 valori di r)",
            worst_neg >= -1e-13,
            max_rel_err=abs(min(0.0, worst_neg)),
            tolerance=1e-13,
            detail=f"min(λ_min / ω²_max) = {worst_neg:.3e} su {tested} configurazioni 3D",
        )

    # 4g. Velocità del suono k → 0 per Al vs tensore di Christoffel
    vs_ref = analytical_sound_speeds_al_100_110_111(0.36)
    vs_errs = {}
    for sp in app_out["soundSpeedProbes"]:
        dname = sp["tag"].split("_")[-1]
        # ω in rad/s, k in Å⁻¹ ⇒ v = ω / (k * 1e10) in m/s
        vs_app = sorted(w / (k_small * 1e10) for w in sp["omegas"])
        err_d = max(rel_err(a, b) for a, b in zip(vs_app, vs_ref[dname]))
        vs_errs[dname] = {"app": vs_app, "ref": vs_ref[dname], "relErr": err_d}
    max_vs_err = max(v["relErr"] for v in vs_errs.values())
    rec.add(
        "4. Simmetrie & polarizzazioni",
        "Alluminio: velocità del suono k → 0 ([100], [110], [111]) vs tensore di Christoffel",
        max_vs_err < 1e-8,
        max_rel_err=max_vs_err,
        tolerance=1e-8,
        detail=f"max rel err a k=10⁻⁴ Å⁻¹ = {max_vs_err:.2e} (atteso O((ka)²) ~ 10⁻⁸)",
        extra=vs_errs,
    )

    # =========================================================================
    # TEST 5: CAMMINO Γ–X–K–Γ–L, CONTINUITÀ, TRACCIAMENTO RAMI (branches vs
    #         segments), ESTREMI SLIDER E PENDENZA AL BORDO ZONA (X, L)
    # =========================================================================
    # 5a. Geometria cammino fcc Γ–X–K–Γ–L
    for cid in crystal_ids:
        d_app = app_out["dispersions"][cid]
        sc = scales[cid]
        labels = d_app["path"]["labels"]
        dist = d_app["path"]["distance"]
        expected_seg_lens = [
            1.0 * sc,                               # Γ–X
            math.hypot(0.25, 0.75) * sc,            # X–K
            math.hypot(0.75, 0.75) * sc,            # K–Γ
            math.sqrt(0.75) * sc,                   # Γ–L
        ]
        got_seg_lens = [dist[labels[i + 1]["index"]] - dist[labels[i]["index"]] for i in range(4)]
        path_err = max(rel_err(a, b) for a, b in zip(got_seg_lens, expected_seg_lens))
        rec.add(
            "5. Cammino, rami & slider",
            f"{cid}: lunghezze geometriche cammino Γ–X–K–Γ–L",
            path_err < 1e-14 and [l["label"] for l in labels] == ["Γ", "X", "K", "Γ", "L"],
            max_rel_err=path_err,
            tolerance=1e-14,
            detail=f"max rel err lunghezze = {path_err:.2e}, totale = {dist[-1]:.6f} Å⁻¹",
        )

    # 5b. Confronto critico tra disp.branches (etichettati per ruolo) e disp.segments / modesAtPoint!
    # Verifica se disp.branches[b].role corrisponde davvero al ruolo fisico di quel ramo in ogni punto!
    branch_role_audit: dict[str, Any] = {}
    for cid in crystal_ids:
        d_app = app_out["dispersions"][cid]
        mismatches = []
        for i, modes_at_i in enumerate(d_app["modesAtPoint"]):
            for b_idx, br in enumerate(d_app["branches"]):
                # branches[b_idx] viene popolato da modesAtPoint[i][b_idx] (ordinato per omega crescente)
                actual_role = modes_at_i[b_idx]["role"]
                if actual_role != br["role"]:
                    mismatches.append({
                        "pointIndex": i,
                        "branchIndex": b_idx,
                        "branchLabelRole": br["role"],
                        "actualModeRole": actual_role,
                        "freqThz": modes_at_i[b_idx]["freqThz"],
                    })
        # Verifica anche coincidenza dei 4 segmenti ai vertici (X, K, Γ) e continuità interna
        seg_max_jump = 0.0
        for seg in d_app["segments"]:
            for sbr in seg["branches"]:
                fs = sbr["freqThz"]
                for j in range(1, len(fs)):
                    seg_max_jump = max(seg_max_jump, abs(fs[j] - fs[j - 1]) / max(1e-9, d_app["maxFreqThz"]))
        # Verifica che i segmenti matchino esattamente gli autovalori a ogni punto
        seg_spec_err = 0.0
        for seg in d_app["segments"]:
            s0 = seg["startIndex"]
            n_loc = seg["endIndex"] - s0 + 1
            for j in range(n_loc):
                gi = s0 + j
                seg_fs = sorted(sbr["freqThz"][j] for sbr in seg["branches"])
                pt_fs = sorted(m["freqThz"] for m in d_app["modesAtPoint"][gi])
                for a, b in zip(seg_fs, pt_fs):
                    seg_spec_err = max(seg_spec_err, abs(a - b) / max(1e-9, d_app["maxFreqThz"]))

        branch_role_audit[cid] = {
            "mismatchCount": len(mismatches),
            "sampleMismatches": mismatches[:6],
            "segMaxJumpFrac": seg_max_jump,
            "segSpecErr": seg_spec_err,
        }
        rec.add(
            "5. Cammino, rami & slider",
            f"{cid}: coerenza spettrale e continuità dei 4 segmenti Γ–X, X–K, K–Γ, Γ–L",
            seg_spec_err < 1e-12 and seg_max_jump < 0.06,
            max_rel_err=seg_spec_err,
            tolerance=1e-12,
            detail=f"segSpecErr={seg_spec_err:.2e}, maxJump/maxFreq={seg_max_jump:.4f}; mismatch branches.role vs modesAtPoint={len(mismatches)}",
            extra=branch_role_audit[cid],
        )

    # 5c. Controllo specifico su tutti gli estremi degli slider (21 configurazioni)
    slider_bad = []
    max_slider_jump = 0.0
    diamond_polar_audit = []
    for cfg in app_out["sliderMatrix"]:
        tag = cfg["tag"]
        has_nan = False
        for seg in cfg["segments"]:
            for sbr in seg["branches"]:
                fs = sbr["freqThz"]
                for j, val in enumerate(fs):
                    if not math.isfinite(val) or val < -1e-12:
                        has_nan = True
                    if j > 0:
                        jump = abs(val - fs[j - 1]) / max(1e-9, cfg["maxFreqThz"])
                        if jump > max_slider_jump:
                            max_slider_jump = jump
                        if jump > 0.12:
                            slider_bad.append({"tag": tag, "seg": seg["label"], "role": sbr["role"], "j": j, "jumpFrac": jump})
        if has_nan:
            slider_bad.append({"tag": tag, "error": "NaN/Inf/neg"})
        # Controllo extra per Diamante con polarRatio > 1 (dove opticalScore non viene usato, ma acGroup=[0,1,2], optGroup=[3,4,5])
        if cfg["params"]["crystalId"] == "diamond" and cfg["params"]["polarRatio"] > 1.0:
            # Verifica se a X (idx 20 su 20 pt/seg) LO > LA come atteso
            m_x = cfg["modesAtPoint"][20]
            by_r = {m["role"]: m["freqThz"] for m in m_x}
            diamond_polar_audit.append({"tag": tag, "atX": by_r, "tab1": cfg["tab1"]})

    rec.add(
        "5. Cammino, rami & slider",
        f"Stress-test estremi slider UI ({len(app_out['sliderMatrix'])} configurazioni, r ∈ [0.15, 0.85], polar ∈ [1, 3.5])",
        len(slider_bad) == 0,
        max_rel_err=max_slider_jump,
        tolerance=0.12,
        detail=f"anomalie={len(slider_bad)}, maxJump/maxFreq su 20 pt/seg = {max_slider_jump:.4f}",
        extra={"anomalies": slider_bad[:10], "diamondPolarAudit": diamond_polar_audit},
    )

    # 5d. Pendenza dω/dk al bordo di zona X e L (simmetria v_g = 0 per modelli periodici vs effetto inviluppo gaussiano PbTe)
    slopes = app_out["boundarySlopes"]
    al_slope_max = max(max(abs(x) for x in slopes["aluminum"]["dOmegaDkAtX"]), max(abs(x) for x in slopes["aluminum"]["dOmegaDkAtL"]))
    # Nota: nel diamante a X c'è un punto angoloso (LA = LO sticking lineare!) quindi dω/dk ≠ 0 per LA/LO ma = 0 per TA/TO!
    dia_ta_to_x = [slopes["diamond"]["dOmegaDkAtX"][i] for i in (0, 1, 4, 5)]
    dia_l_all = slopes["diamond"]["dOmegaDkAtL"]
    dia_nonstick_max = max(max(abs(x) for x in dia_ta_to_x), max(abs(x) for x in dia_l_all))
    pbte_sr_t_x = [slopes["pbte"]["dOmegaDkAtX"][i] for i in (0, 1, 3, 4)]  # modi trasversali a X
    pbte_lo_x = slopes["pbte"]["dOmegaDkAtX"][5]
    pbte_lo_l = slopes["pbte"]["dOmegaDkAtL"][5]
    # Normalizza pendenza rispetto a a * ω_max (scala caratteristica di v_g)
    al_vg_scale = float(AL_A_D) * (app_out["dispersions"]["aluminum"]["maxFreqThz"] * 2 * math.pi * 1e12)
    dia_vg_scale = float(DIA_A_D) * (app_out["dispersions"]["diamond"]["maxFreqThz"] * 2 * math.pi * 1e12)
    pbte_vg_scale = float(PBTE_A_D) * (app_out["dispersions"]["pbte"]["maxFreqThz"] * 2 * math.pi * 1e12)
    rec.add(
        "5. Cammino, rami & slider",
        "Velocità di gruppo al bordo zona X e L (Al, Diamante non-sticking, PbTe trasversali vs LO dipolare)",
        (al_slope_max / al_vg_scale) < 1e-4 and (dia_nonstick_max / dia_vg_scale) < 1e-4,
        max_rel_err=max(al_slope_max / al_vg_scale, dia_nonstick_max / dia_vg_scale),
        tolerance=1e-4,
        detail=(
            f"Al |v_g(X,L)|/scale={al_slope_max/al_vg_scale:.2e}; Dia TA/TO(X)&L={dia_nonstick_max/dia_vg_scale:.2e}; "
            f"PbTe |dω_LO/dk|/(a·ω_max): a X={abs(pbte_lo_x)/pbte_vg_scale:.3e}, a L={abs(pbte_lo_l)/pbte_vg_scale:.3e} (effetto inviluppo gaussiano)"
        ),
        extra={"slopes": slopes, "pbteLoSlopeNormX": abs(pbte_lo_x) / pbte_vg_scale, "pbteLoSlopeNormL": abs(pbte_lo_l) / pbte_vg_scale},
    )

    # =========================================================================
    # TEST 6: CONTEGGIO 3D BORN–VON KÁRMÁN (§14), STIMA 1 cm³ Al E GRIGLIA FIG. 17
    # =========================================================================
    max_mc_err = 0.0
    mc_details = []
    for item in app_out["modeCounting"]:
        N_d = Decimal(item["input"]["N"])
        p_d = Decimal(item["input"]["p"])
        a_d = Decimal(str(item["input"]["a"]))
        res = item["result"]

        L_d = N_d * a_d
        conv_v = a_d ** 3
        vc_fcc = conv_v / Decimal(4)
        V_d = L_d ** 3
        nc_sc = N_d ** 3
        nc_fcc = Decimal(4) * nc_sc
        tot_br = Decimal(3) * p_d
        opt_br = Decimal(3) * (p_d - Decimal(1))
        lo_br = p_d - Decimal(1)
        to_br = Decimal(2) * (p_d - Decimal(1))
        tot_modes = tot_br * nc_fcc
        dk_d = TWO_PI_D / L_d
        dvk_d = (TWO_PI_D ** 3) / V_d
        vbz_d = (TWO_PI_D ** 3) / vc_fcc

        checks = {
            "conventionalCellVolumeAng3": rel_err(res["conventionalCellVolumeAng3"], float(conv_v)),
            "primitiveCellVolumeFccAng3": rel_err(res["primitiveCellVolumeFccAng3"], float(vc_fcc)),
            "crystalVolumeAng3": rel_err(res["crystalVolumeAng3"], float(V_d)),
            "primitiveCellsFcc": rel_err(res["primitiveCellsFcc"], float(nc_fcc)),
            "primitiveCellsSimpleCubic": rel_err(res["primitiveCellsSimpleCubic"], float(nc_sc)),
            "grid2DPoints": rel_err(res["grid2DPoints"], float(N_d * N_d)),
            "totalBranches": rel_err(res["totalBranches"], float(tot_br)),
            "acousticBranches": abs(res["acousticBranches"] - 3),
            "opticalBranches": abs(res["opticalBranches"] - int(opt_br)),
            "loBranches": abs(res["loBranches"] - int(lo_br)),
            "toBranches": abs(res["toBranches"] - int(to_br)),
            "totalModesFcc": rel_err(res["totalModesFcc"], float(tot_modes)),
            "deltaKAngInv": rel_err(res["deltaKAngInv"], float(dk_d)),
            "deltaVkAngInv3": rel_err(res["deltaVkAngInv3"], float(dvk_d)),
            "bzVolumeFccAngInv3": rel_err(res["bzVolumeFccAngInv3"], float(vbz_d)),
            "bzOverDvkEqualsNc": rel_err(res["bzVolumeFccAngInv3"] / res["deltaVkAngInv3"], float(nc_fcc)),
            "branchSumCheck": abs((res["acousticBranches"] + res["loBranches"] + res["toBranches"]) - res["totalBranches"]),
        }
        e_case = max(checks.values())
        max_mc_err = max(max_mc_err, e_case)
        mc_details.append({"input": item["input"], "maxErr": e_case})

    rec.add(
        "6. Conteggio 3D BvK",
        f"computeModeCounting3D: v_c=a³/4, N_c=4N³, p−1 LO, 2(p−1) TO ({len(mc_details)} casi, 50 cifre)",
        max_mc_err < 1e-14,
        max_rel_err=max_mc_err,
        tolerance=1e-14,
        detail=f"max err relativo su tutte le 17 identità × {len(mc_details)} casi = {max_mc_err:.2e}",
        extra={"cases": mc_details},
    )

    # 6b. Stima macroscopica 1 cm³ di Alluminio (§14.2 p. 35)
    a_m_d = AL_A_D * ANGSTROM_M_D
    L_m_d = Decimal("1e-2")
    vol_d = L_m_d ** 3
    vc_m3_d = (a_m_d ** 3) / Decimal(4)
    nc_geom_d = vol_d / vc_m3_d
    modes_geom_d = Decimal(3) * nc_geom_d
    dk_m_d = TWO_PI_D / L_m_d
    bzw_m_d = TWO_PI_D / a_m_d
    ratio_d = dk_m_d / bzw_m_d
    # Controllo incrociato dalla densità ρ = 2,70 g/cm³ e M_mol = 26,98 g/mol della dispensa §14.2
    nc_dens_d = (Decimal("2.70") / Decimal("26.98")) * NA_SI_D
    dens_vs_geom_rel = abs(float(nc_dens_d - nc_geom_d)) / float(nc_geom_d)

    mac = app_out["macroAl"]
    mac_errs = {
        "primitiveCells": rel_err(mac["primitiveCells"], float(nc_geom_d)),
        "totalModes": rel_err(mac["totalModes"], float(modes_geom_d)),
        "deltaKMInv": rel_err(mac["deltaKMInv"], float(dk_m_d)),
        "bzWidthMInv": rel_err(mac["bzWidthMInv"], float(bzw_m_d)),
        "spacingRatio": rel_err(mac["spacingRatio"], float(ratio_d)),
    }
    max_mac_err = max(mac_errs.values())
    rec.add(
        "6. Conteggio 3D BvK",
        "Stima macroscopica 1 cm³ di Al (§14.2 p. 35: N_c ≈ 6,0·10²², 3N_c ≈ 1,8·10²³, Δk ≈ 6,3·10² m⁻¹)",
        max_mac_err < 1e-14 and dens_vs_geom_rel < 2e-3,
        max_rel_err=max_mac_err,
        tolerance=1e-14,
        detail=(
            f"N_c(a³/4)={float(nc_geom_d):.6e} vs N_c(ρ·N_A/M)={float(nc_dens_d):.6e} (scarto {dens_vs_geom_rel*100:.3f}%); "
            f"3N_c={float(modes_geom_d):.6e}; Δk={float(dk_m_d):.4f} m⁻¹; Δk/(2π/a)={float(ratio_d):.4e}; err app={max_mac_err:.2e}"
        ),
        extra={"app": mac, "refGeom": float(nc_geom_d), "refDens": float(nc_dens_d), "errs": mac_errs},
    )

    # 6c. Griglia 2D di Fig. 17 (N = 2..15)
    grid_ok = True
    grid_max_coord_err = 0.0
    grid_details = []
    for N_str, pts_2d in app_out["bvkGrids"].items():
        N = int(N_str)
        counted = [pt for pt in pts_2d if pt["counted"]]
        ghosts = [pt for pt in pts_2d if not pt["counted"]]
        expected_ghosts = (2 * N + 1) if (N % 2 == 0) else 0
        # Verifica coordinate esatte k_i / (π/a) = 2 n_i / N e appartenenza a (−1, +1] per tutti i contati
        counted_set = set()
        for pt in counted:
            kx_ref = 2.0 * pt["nx"] / N
            ky_ref = 2.0 * pt["ny"] / N
            grid_max_coord_err = max(grid_max_coord_err, abs(pt["kxOverPiA"] - kx_ref), abs(pt["kyOverPiA"] - ky_ref))
            if not (-1.0 < pt["kxOverPiA"] <= 1.0 + 1e-15 and -1.0 < pt["kyOverPiA"] <= 1.0 + 1e-15):
                grid_ok = False
            counted_set.add((pt["nx"], pt["ny"]))
        # Verifica che ogni ghost differisca da un punto contato per un multiplo intero di N (cioè G = 2π/a)
        for pt in ghosts:
            mapped = (pt["nx"] + (N if pt["nx"] == -N // 2 else 0), pt["ny"] + (N if pt["ny"] == -N // 2 else 0))
            if mapped not in counted_set:
                grid_ok = False
        if len(counted) != N * N or len(ghosts) != expected_ghosts or len(counted_set) != N * N:
            grid_ok = False
        grid_details.append({"N": N, "counted": len(counted), "ghosts": len(ghosts)})

    rec.add(
        "6. Conteggio 3D BvK",
        "Griglia 2D Born–von Kármán Fig. 17 (N = 2…15: N² contati, 2N+1/0 ghost equivalenti per G)",
        grid_ok and grid_max_coord_err < 1e-15,
        max_abs_err=grid_max_coord_err,
        tolerance=1e-15,
        detail=f"Tutti i 14 valori N=2..15 verificati (N=8: 64 contati + 17 ghost; N=7: 49 + 0), coord err={grid_max_coord_err:.2e}",
        extra={"grids": grid_details},
    )

    # =========================================================================
    # REPORT FINALE E SALVATAGGIO JSON
    # =========================================================================
    n_pass = sum(1 for t in rec.tests if t["status"] == "PASS")
    n_fail = sum(1 for t in rec.tests if t["status"] == "FAIL")

    results_doc = {
        "summary": {
            "total": len(rec.tests),
            "passed": n_pass,
            "failed": n_fail,
            "verdict": "PASS" if n_fail == 0 else "FAIL",
        },
        "constantsCheck": {
            "THZ_TO_MEV_EXACT": THZ_TO_MEV_EXACT,
            "THZ_TO_MEV_APP": app_out["constants"]["THZ_TO_MEV"],
            "thzToMevRelDiff": rel_err(app_out["constants"]["THZ_TO_MEV"], THZ_TO_MEV_EXACT),
        },
        "dispSummary": disp_summary,
        "branchRoleAudit": branch_role_audit,
        "tests": rec.tests,
    }

    OUT_JSON.write_text(json.dumps(results_doc, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"=== CROSSCHECK NUMERICO PHONON-3D: {n_pass}/{len(rec.tests)} PASS ({n_fail} FAIL) ===")
    for t in rec.tests:
        mark = "PASS" if t["status"] == "PASS" else "FAIL"
        print(f"[{mark}] {t['group']} | {t['name']}")
        print(f"       {t['detail']}")
    print(f"\nRisultati salvati in: {OUT_JSON}")
    return 0 if n_fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
