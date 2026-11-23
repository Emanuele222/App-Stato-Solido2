#!/usr/bin/env python3
"""
Crosscheck numerico indipendente — Sezione 2 Fononi:
Catena biatomica 1D, gap fononico, matrice dinamica 2×2 e luce infrarossa.

Fonti di riferimento (sola lettura):
  - materiale/parte6/dispensa.pdf: Lezione 2 §§7–8 (pp. 17–23), §10.3 (p. 27),
    Lezione 4 §24 (pp. 59–60).
  - materiale/parte6/riferimento-formule.md.

Metodologia:
  1. Reimplementazione DA ZERO in Python 3 (float64 + Decimal a 50 cifre)
     completamente indipendente da src/renderer/src/physics/:
     - Eq. (20) esatta a 50 cifre decimali (senza cancellazione).
     - Diagonalizzazione indipendente (rotazione di Jacobi) della matrice
       dinamica 2×2 D(k) (§10.3) e verifica degli autovettori e di α.
     - Diagonalizzazione di Jacobi della matrice dinamica reale 2N×2N
       dell'anello finito di N celle (2N atomi) con condizioni BvK.
     - Verifica diretta delle equazioni di Newton discrete (13)–(14) sugli
       spostamenti u_n(t) e verifica nel dominio del tempo di R_cm.
     - Velocità di gruppo con differenze finite centrate al 2° e 4° ordine
       su 1BZ e zona estesa [−2π/a, +2π/a], più curvatura ottica a k = 0.
     - Risolutore indipendente (bisezione + Newton–Raphson a 50 cifre) per
       l'incrocio luce IR ω₊(k) = (c/n)k (§24, eq. 60).
  2. Esecuzione diretta delle funzioni reali esportate da
     src/renderer/src/physics/phononDispersion.ts tramite Node locale
     (.tools/node/node.exe) su tutti gli stessi input, e confronto punto per punto.

Esecuzione (dalla root del repository):
  python crosscheck/fononi/phonon_diatomic_crosscheck.py
"""

from __future__ import annotations

import decimal
import json
import math
import subprocess
import sys
from decimal import Decimal, getcontext
from pathlib import Path
from typing import Any

# Precisione arbitraria (50 cifre decimali) per riferimenti privi di cancellazione
getcontext().prec = 50

ROOT = Path(__file__).resolve().parents[2]
NODE_EXE = ROOT / ".tools" / "node" / "node.exe"
OUT_JSON = Path(__file__).resolve().parent / "phonon_diatomic_crosscheck_results.json"

# =============================================================================
# 1. COSTANTI FISICHE INDIPENDENTI (SI 2019 esatte + CODATA 2018)
# =============================================================================
H_SI_D = Decimal("6.62607015e-34")            # J·s (esatta SI 2019)
E_SI_D = Decimal("1.602176634e-19")           # C   (esatta SI 2019)
C_LIGHT_D = Decimal("299792458")              # m/s (esatta SI)
AMU_KG_D = Decimal("1.6605390666e-27")        # kg  (CODATA 2018; dispensa: 1.660539e-27)
ANGSTROM_M_D = Decimal("1e-10")               # m/Å


def dec_pi() -> Decimal:
    """Calcola π a 50 cifre con formula di Machin: π/4 = 4 arctan(1/5) - arctan(1/239)."""
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


def dec_sin(x: Decimal) -> Decimal:
    """Seno a 50 cifre con riduzione d'argomento modulo 2π."""
    two_pi = Decimal(2) * PI_D
    r = x % two_pi
    if r > PI_D:
        r -= two_pi
    term = r
    total = term
    r2 = r * r
    n = 1
    while True:
        term = -term * r2 / Decimal((2 * n) * (2 * n + 1))
        if abs(term) < Decimal("1e-52"):
            break
        total += term
        n += 1
    return total


def dec_cos(x: Decimal) -> Decimal:
    """Coseno a 50 cifre con riduzione d'argomento modulo 2π."""
    two_pi = Decimal(2) * PI_D
    r = x % two_pi
    if r > PI_D:
        r -= two_pi
    term = Decimal(1)
    total = term
    r2 = r * r
    n = 1
    while True:
        term = -term * r2 / Decimal((2 * n - 1) * (2 * n))
        if abs(term) < Decimal("1e-52"):
            break
        total += term
        n += 1
    return total


PI_D = dec_pi()
HBAR_SI_D = H_SI_D / (Decimal(2) * PI_D)
THZ_TO_MEV_EXACT_D = (H_SI_D * Decimal("1e12")) / (E_SI_D * Decimal("1e-3"))

H_SI = float(H_SI_D)
E_SI = float(E_SI_D)
C_LIGHT = float(C_LIGHT_D)
AMU_KG = float(AMU_KG_D)
ANGSTROM_M = 1e-10
HBAR_SI = float(HBAR_SI_D)


def ref_rad_s_to_thz(w: float) -> float:
    return w / (2.0 * math.pi * 1e12)


def ref_rad_s_to_mev_exact(w: float) -> float:
    return float((HBAR_SI_D * Decimal(str(w))) / (E_SI_D * Decimal("1e-3")))


# =============================================================================
# 2. IMPLEMENTAZIONE INDIPENDENTE DA ZERO (dalla dispensa Parte 6)
# =============================================================================

def ref_diatomic_exact_dec(
    k_ang_inv: Decimal, a_ang: Decimal, M_amu: Decimal, m_amu: Decimal, C: Decimal
) -> dict[str, Decimal]:
    """
    Soluzione esatta a 50 cifre decimali dell'eq. (20) della dispensa (§7.4 p. 19):
      ω_∓²(k) = C·(m+M)/(mM) ∓ C·√[((m+M)/(mM))² − 4·sin²(ka/2)/(mM)]
    """
    M_kg = M_amu * AMU_KG_D
    m_kg = m_amu * AMU_KG_D
    S = (m_kg + M_kg) / (m_kg * M_kg)
    half_ka = Decimal("0.5") * k_ang_inv * a_ang
    s = dec_sin(half_ka)
    c = dec_cos(half_ka)
    disc = S * S - (Decimal(4) * s * s) / (m_kg * M_kg)
    if disc < 0 and abs(disc) < Decimal("1e-45"):
        disc = Decimal(0)
    sqrt_d = disc.sqrt()
    w_minus_sq = C * (S - sqrt_d)
    if w_minus_sq < 0 and abs(w_minus_sq) < Decimal("1e-40"):
        w_minus_sq = Decimal(0)
    w_plus_sq = C * (S + sqrt_d)
    w_minus = w_minus_sq.sqrt()
    w_plus = w_plus_sq.sqrt()
    return {
        "S": S,
        "sqrtD": sqrt_d,
        "wMinusSq": w_minus_sq,
        "wPlusSq": w_plus_sq,
        "wMinus": w_minus,
        "wPlus": w_plus,
        "sinHalf": s,
        "cosHalf": c,
    }


def ref_diatomic_summary_dec(a_ang: Decimal, M_amu: Decimal, m_amu: Decimal, C: Decimal) -> dict[str, Decimal]:
    """Scale caratteristiche da eqq. (21)–(23) a 50 cifre."""
    M_kg = M_amu * AMU_KG_D
    m_kg = m_amu * AMU_KG_D
    m_max = max(M_kg, m_kg)
    m_min = min(M_kg, m_kg)
    vs = a_ang * ANGSTROM_M_D * (C / (Decimal(2) * (M_kg + m_kg))).sqrt()
    w_ac_max = (Decimal(2) * C / m_max).sqrt()
    w_opt_min = (Decimal(2) * C / m_min).sqrt()
    w_opt_0 = (Decimal(2) * C * (M_kg + m_kg) / (M_kg * m_kg)).sqrt()
    w_gap = w_opt_min - w_ac_max
    return {
        "vs": vs,
        "wAcMax": w_ac_max,
        "nuAcMax": w_ac_max / (Decimal(2) * PI_D * Decimal("1e12")),
        "eAcMax": (HBAR_SI_D * w_ac_max) / (E_SI_D * Decimal("1e-3")),
        "wOptMin": w_opt_min,
        "nuOptMin": w_opt_min / (Decimal(2) * PI_D * Decimal("1e12")),
        "eOptMin": (HBAR_SI_D * w_opt_min) / (E_SI_D * Decimal("1e-3")),
        "wOpt0": w_opt_0,
        "nuOpt0": w_opt_0 / (Decimal(2) * PI_D * Decimal("1e12")),
        "eOpt0": (HBAR_SI_D * w_opt_0) / (E_SI_D * Decimal("1e-3")),
        "wGap": w_gap,
        "nuGap": w_gap / (Decimal(2) * PI_D * Decimal("1e12")),
        "eGap": (HBAR_SI_D * w_gap) / (E_SI_D * Decimal("1e-3")),
        "zoneEdge": PI_D / a_ang,
        "reciprocalG": Decimal(2) * PI_D / a_ang,
    }


def ref_dynamical_matrix_2x2_jacobi(
    k_ang_inv: float, a_ang: float, M_amu: float, m_amu: float, C: float
) -> dict[str, Any]:
    """
    Costruzione e diagonalizzazione diretta di Jacobi della matrice dinamica 2×2
    (dispensa Parte 6 §10.3, p. 27):
      D(k) = [[2C/M, -(2C/√(Mm)) cos(ka/2)], [-(2C/√(Mm)) cos(ka/2), 2C/m]]
    Calcolata con formula di rotazione di Jacobi indipendente.
    """
    M_kg = M_amu * AMU_KG
    m_kg = m_amu * AMU_KG
    cos_h = math.cos(0.5 * k_ang_inv * a_ang)
    sin_h = math.sin(0.5 * k_ang_inv * a_ang)

    d11 = 2.0 * C / M_kg
    d22 = 2.0 * C / m_kg
    d12 = -2.0 * C * cos_h / math.sqrt(M_kg * m_kg)

    # Rotazione di Jacobi: tau = (d22 - d11) / (2 d12), t = sgn(tau) / (|tau| + sqrt(1 + tau^2))
    if abs(d12) == 0.0:
        c_rot, s_rot = 1.0, 0.0
    else:
        tau = (d22 - d11) / (2.0 * d12)
        t = (1.0 / (tau + math.sqrt(1.0 + tau * tau))) if tau >= 0.0 else (-1.0 / (-tau + math.sqrt(1.0 + tau * tau)))
        c_rot = 1.0 / math.sqrt(1.0 + t * t)
        s_rot = t * c_rot

    # Autovalori ruotati: J^T D J = diag(lam1, lam2)
    # Con J = [[c, -s], [s, c]] (colonna 1 = [c, s], colonna 2 = [-s, c])
    v1 = (c_rot, s_rot)
    v2 = (-s_rot, c_rot)
    lam1 = d11 * v1[0] ** 2 + 2.0 * d12 * v1[0] * v1[1] + d22 * v1[1] ** 2
    lam2 = d11 * v2[0] ** 2 + 2.0 * d12 * v2[0] * v2[1] + d22 * v2[1] ** 2

    if lam1 <= lam2:
        e_ac, e_op = v1, v2
        l_ac, l_op = lam1, lam2
    else:
        e_ac, e_op = v2, v1
        l_ac, l_op = lam2, lam1

    # Nota: per accuratezza su l_ac vicino a k=0, il determinante esatto è 4C²/(Mm) sin²(ka/2)
    det_exact = (4.0 * C * C / (M_kg * m_kg)) * (sin_h * sin_h)
    l_ac_exact = det_exact / l_op if l_op > 0.0 else 0.0

    # Rapporti α = u_{n-1}/u_n = √(M/m) * (ε_m / ε_M) dagli autovettori
    ratio_scale = math.sqrt(M_kg / m_kg)
    alpha_ac = None if abs(e_ac[0]) < 1e-12 else ratio_scale * (e_ac[1] / e_ac[0])
    alpha_op = None if abs(e_op[0]) < 1e-12 else ratio_scale * (e_op[1] / e_op[0])

    return {
        "d11": d11,
        "d12": d12,
        "d22": d22,
        "trace": d11 + d22,
        "detExact": det_exact,
        "eigJacobi": (max(0.0, l_ac), max(0.0, l_op)),
        "eigExact": (l_ac_exact, l_op),
        "omegasExact": (math.sqrt(l_ac_exact), math.sqrt(l_op)),
        "eigenvectors": (e_ac, e_op),
        "alphaFromEig": (alpha_ac, alpha_op),
    }


def ref_ring_jacobi_2N(N_cells: int, M_amu: float, m_amu: float, C: float) -> dict[str, Any]:
    """
    Costruisce da zero la matrice delle costanti di forza Φ (2N×2N) per una catena
    biatomica chiusa ad anello (condizioni BvK) di N celle (2N atomi: indici pari M,
    indici dispari m), verifica la regola di somma nulla ∑_j Φ_ij = 0, costruisce la
    matrice dinamica simmetrica D_ij = Φ_ij / √(m_i m_j) e la diagonalizza con
    algoritmo di Jacobi ciclico classico.
    """
    n = 2 * N_cells
    M_kg = M_amu * AMU_KG
    m_kg = m_amu * AMU_KG
    masses = [M_kg if i % 2 == 0 else m_kg for i in range(n)]

    # Matrice delle costanti di forza Φ (eq. 13-14)
    Phi = [[0.0] * n for _ in range(n)]
    for i in range(n):
        Phi[i][i] = 2.0 * C
        Phi[i][(i + 1) % n] -= C
        Phi[i][(i - 1) % n] -= C

    max_row_sum = max(abs(sum(row)) for row in Phi)

    # Matrice dinamica reale simmetrica D_ij = Φ_ij / √(m_i m_j)
    A = [[Phi[i][j] / math.sqrt(masses[i] * masses[j]) for j in range(n)] for i in range(n)]

    # Diagonalizzazione di Jacobi ciclica classica (tolleranza 1e-15 rispetto alla norma)
    scale = max(abs(A[i][i]) for i in range(n))
    for _sweep in range(50):
        max_off = 0.0
        for p in range(n):
            for q in range(p + 1, n):
                apq = A[p][q]
                if abs(apq) > max_off:
                    max_off = abs(apq)
                if abs(apq) <= 1e-16 * scale:
                    continue
                tau = (A[q][q] - A[p][p]) / (2.0 * apq)
                t = (1.0 / (tau + math.sqrt(1.0 + tau * tau))) if tau >= 0.0 else (-1.0 / (-tau + math.sqrt(1.0 + tau * tau)))
                c = 1.0 / math.sqrt(1.0 + t * t)
                s = t * c
                app, aqq = A[p][p], A[q][q]
                A[p][p] = app - t * apq
                A[q][q] = aqq + t * apq
                A[p][q] = 0.0
                A[q][p] = 0.0
                for r in range(n):
                    if r != p and r != q:
                        arp, arq = A[r][p], A[r][q]
                        A[r][p] = A[p][r] = c * arp - s * arq
                        A[r][q] = A[q][r] = s * arp + c * arq
        if max_off <= 1e-15 * scale:
            break

    eigs_raw = sorted(A[i][i] for i in range(n))
    eigs = [0.0 if abs(ev) < 1e-14 * scale else max(0.0, ev) for ev in eigs_raw]
    omegas = [math.sqrt(ev) for ev in eigs]
    return {
        "N": N_cells,
        "dim": n,
        "maxRowSum": max_row_sum,
        "eigsRaw": eigs_raw,
        "omegas": omegas,
    }


def ref_omega_float(k: float, branch: str, a: float, M: float, m: float, C: float) -> float:
    """Eq. (20) in float64 per differenze finite indipendenti."""
    M_kg = M * AMU_KG
    m_kg = m * AMU_KG
    S = (m_kg + M_kg) / (m_kg * M_kg)
    diff = (1.0 / m_kg) - (1.0 / M_kg)
    c = math.cos(0.5 * k * a)
    s = math.sin(0.5 * k * a)
    sqrt_d = math.sqrt(diff * diff + 4.0 * c * c / (m_kg * M_kg))
    if branch == "optical":
        return math.sqrt(C * (S + sqrt_d))
    return math.sqrt((4.0 * C * s * s) / (m_kg * M_kg * (S + sqrt_d)))


def ref_vg_fd4(k: float, branch: str, a: float, M: float, m: float, C: float, h: float = 1e-4) -> float:
    """Velocità di gruppo dω/dk (m/s) con differenze finite centrate al 4° ordine."""
    f_p2 = ref_omega_float(k + 2 * h, branch, a, M, m, C)
    f_p1 = ref_omega_float(k + h, branch, a, M, m, C)
    f_m1 = ref_omega_float(k - h, branch, a, M, m, C)
    f_m2 = ref_omega_float(k - 2 * h, branch, a, M, m, C)
    domega_dk_ang = (-f_p2 + 8.0 * f_p1 - 8.0 * f_m1 + f_m2) / (12.0 * h)
    return domega_dk_ang * ANGSTROM_M


def ref_vg_fd2(k: float, branch: str, a: float, M: float, m: float, C: float, h: float = 1e-5) -> float:
    """Velocità di gruppo dω/dk (m/s) con differenze finite centrate al 2° ordine."""
    f_p1 = ref_omega_float(k + h, branch, a, M, m, C)
    f_m1 = ref_omega_float(k - h, branch, a, M, m, C)
    return ((f_p1 - f_m1) / (2.0 * h)) * ANGSTROM_M


def ref_ir_crossing_dec(
    a_ang: Decimal, M_amu: Decimal, m_amu: Decimal, C: Decimal, n_ref: Decimal
) -> dict[str, Decimal]:
    """
    Risolve ω₊(k) = (c/n)k a 50 cifre decimali mediante bisezione + Newton–Raphson
    su F(k) = ω₊(k) − (c/n)·k_m = 0 (dispensa Parte 6, Lezione 4 §24 eq. 60).
    """
    c_med = C_LIGHT_D / n_ref
    w0 = ref_diatomic_exact_dec(Decimal(0), a_ang, M_amu, m_amu, C)["wPlus"]
    # Intervallo garantito [0, k_hi] con k_hi = 1.05 * w0 / c_med in Å⁻¹
    k_lo = Decimal(0)
    k_hi = Decimal("1.05") * (w0 / c_med) * ANGSTROM_M_D

    def f(k_ang: Decimal) -> Decimal:
        w = ref_diatomic_exact_dec(k_ang, a_ang, M_amu, m_amu, C)["wPlus"]
        return w - c_med * (k_ang / ANGSTROM_M_D)

    # 160 passi di bisezione → precisione < 2^-160 ≈ 10^-48
    for _ in range(170):
        k_mid = Decimal("0.5") * (k_lo + k_hi)
        if f(k_mid) > 0:
            k_lo = k_mid
        else:
            k_hi = k_mid
    k_sol = Decimal("0.5") * (k_lo + k_hi)
    w_sol = ref_diatomic_exact_dec(k_sol, a_ang, M_amu, m_amu, C)["wPlus"]
    k_m = k_sol / ANGSTROM_M_D
    zone_edge = PI_D / a_ang
    vs = ref_diatomic_summary_dec(a_ang, M_amu, m_amu, C)["vs"]
    lam_um = (Decimal(2) * PI_D * C_LIGHT_D / w_sol) * Decimal("1e6")
    return {
        "omegaRadS": w_sol,
        "freqThz": w_sol / (Decimal(2) * PI_D * Decimal("1e12")),
        "energyMevExact": (HBAR_SI_D * w_sol) / (E_SI_D * Decimal("1e-3")),
        "wavelengthUm": lam_um,
        "kLightMInv": k_m,
        "kLightAngInv": k_sol,
        "kOverZoneEdge": k_sol / zone_edge,
        "speedRatio": c_med / vs,
        "shiftRelFromZero": (w0 - w_sol) / w0,
    }


# =============================================================================
# 3. PONTE DI SOLA LETTURA VERSO src/renderer/src/physics/phononDispersion.ts
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

const app = await import('./src/renderer/src/physics/phononDispersion.ts')
const appConst = await import('./src/renderer/src/physics/constants.ts')

const payload = JSON.parse(readFileSync(0, 'utf8'))
const out = { constants: { AMU_KG: appConst.AMU_KG, C_LIGHT_M_S: appConst.C_LIGHT_M_S, THZ_TO_MEV: appConst.THZ_TO_MEV } }

out.summaries = {}
for (const [name, p] of Object.entries(payload.presets)) {
  out.summaries[name] = {
    summary: app.diatomicSummary(p),
    soundSpeed: app.diatomicSoundSpeed(p)
  }
}

out.gridChecks = {}
for (const [name, cfg] of Object.entries(payload.grids)) {
  const p = cfg.params
  const rows = []
  for (const k of cfg.ks) {
    const wAc = app.diatomicOmega(k, 'acoustic', p)
    const wOp = app.diatomicOmega(k, 'optical', p)
    const vgAc = app.diatomicGroupVelocity(k, 'acoustic', p)
    const vgOp = app.diatomicGroupVelocity(k, 'optical', p)
    const vpAc = app.diatomicPhaseVelocity(k, 'acoustic', p)
    const vpOp = app.diatomicPhaseVelocity(k, 'optical', p)
    const ampAc = app.diatomicModeAmplitude(k, 'acoustic', p)
    const ampOp = app.diatomicModeAmplitude(k, 'optical', p)
    const dm = app.diatomicDynamicalMatrix(k, p)
    rows.push({ k, wAc, wOp, vgAc, vgOp, vpAc, vpOp, ampAc, ampOp, dm })
  }
  out.gridChecks[name] = rows
}

out.curves = {}
for (const [name, cfg] of Object.entries(payload.curves)) {
  const c = app.diatomicDispersionCurve(cfg.params, cfg.kMin, cfg.kMax, cfg.nPoints)
  out.curves[name] = {
    k: Array.from(c.k),
    acousticOmegaRadS: Array.from(c.acousticOmegaRadS),
    opticalOmegaRadS: Array.from(c.opticalOmegaRadS),
    acousticFreqThz: Array.from(c.acousticFreqThz),
    opticalFreqThz: Array.from(c.opticalFreqThz),
    acousticEnergyMev: Array.from(c.acousticEnergyMev),
    opticalEnergyMev: Array.from(c.opticalEnergyMev),
  }
}

out.equalMassFolding = []
for (const cfg of payload.equalMassFolding) {
  const pDia = cfg.diatomic
  const pMono = cfg.monatomic
  const kb = Math.PI / pDia.a
  const G = (2 * Math.PI) / pDia.a
  const samples = cfg.kFracs.map((f) => {
    const k = f * kb
    return {
      kFrac: f,
      k,
      diaAc: app.diatomicOmega(k, 'acoustic', pDia),
      diaOp: app.diatomicOmega(k, 'optical', pDia),
      monoK: app.monatomicOmega(k, pMono),
      monoFolded: app.monatomicOmega(k - G, pMono),
      vgAc: app.diatomicGroupVelocity(k, 'acoustic', pDia),
      vgOp: app.diatomicGroupVelocity(k, 'optical', pDia),
      monoVg: app.monatomicGroupVelocity(k, pMono),
    }
  })
  out.equalMassFolding.push({
    name: cfg.name,
    diaSummary: app.diatomicSummary(pDia),
    monoSummary: app.monatomicSummary(pMono),
    samples
  })
}

out.gapClosure = payload.gapClosure.map((item) => {
  const p = item.params
  const kb = Math.PI / p.a
  return {
    delta: item.delta,
    summary: app.diatomicSummary(p),
    wAcEdge: app.diatomicOmega(kb, 'acoustic', p),
    wOpEdge: app.diatomicOmega(kb, 'optical', p),
    ampAcEdge: app.diatomicModeAmplitude(kb, 'acoustic', p),
    ampOpEdge: app.diatomicModeAmplitude(kb, 'optical', p),
    dmEdge: app.diatomicDynamicalMatrix(kb, p),
    vgAcEdge: app.diatomicGroupVelocity(kb, 'acoustic', p),
    vgOpEdge: app.diatomicGroupVelocity(kb, 'optical', p),
  }
})

out.smallKDm = payload.smallKDm.map((item) => {
  const p = item.params
  const k = item.k
  return {
    k,
    wAc: app.diatomicOmega(k, 'acoustic', p),
    wOp: app.diatomicOmega(k, 'optical', p),
    dm: app.diatomicDynamicalMatrix(k, p),
    vgAc: app.diatomicGroupVelocity(k, 'acoustic', p),
    vpAc: app.diatomicPhaseVelocity(k, 'acoustic', p),
    ampAc: app.diatomicModeAmplitude(k, 'acoustic', p),
    ampOp: app.diatomicModeAmplitude(k, 'optical', p),
  }
})

out.displacements = payload.displacements.map((item) => {
  const disp = app.diatomicDisplacements(item.params, item.k, item.branch, item.phaseRad, item.nCells)
  const w = app.diatomicOmega(item.k, item.branch, item.params)
  const amp = app.diatomicModeAmplitude(item.k, item.branch, item.params)
  return { id: item.id, w, amp, disp }
})

out.infrared = payload.infrared.map((item) => ({
  id: item.id,
  params: item.params,
  n: item.n,
  ir: app.diatomicInfraredCrossing(item.params, item.n),
  wAtK: app.diatomicOmega(app.diatomicInfraredCrossing(item.params, item.n).kLightAngInv, 'optical', item.params),
}))

out.ringCompare = payload.ringCompare.map((item) => {
  const p = item.params
  const grid = app.bvkAllowedK1D(p.a, item.N)
  const omegas = []
  for (const mode of grid.modes) {
    omegas.push(app.diatomicOmega(mode.k, 'acoustic', p))
    omegas.push(app.diatomicOmega(mode.k, 'optical', p))
  }
  omegas.sort((x, y) => x - y)
  return { id: item.id, N: item.N, omegas }
})

out.sliderCorners = payload.sliderCorners.map((p) => {
  const kb = Math.PI / p.a
  const sum = app.diatomicSummary(p)
  const ir = app.diatomicInfraredCrossing(p, 1)
  const ks = [-kb, -0.5 * kb, 0, 0.37 * kb, kb]
  const samples = ks.map((k) => ({
    k,
    wAc: app.diatomicOmega(k, 'acoustic', p),
    wOp: app.diatomicOmega(k, 'optical', p),
    vgAc: app.diatomicGroupVelocity(k, 'acoustic', p),
    vgOp: app.diatomicGroupVelocity(k, 'optical', p),
    ampAc: app.diatomicModeAmplitude(k, 'acoustic', p),
    ampOp: app.diatomicModeAmplitude(k, 'optical', p),
    dm: app.diatomicDynamicalMatrix(k, p),
  }))
  return { params: p, summary: sum, ir, samples }
})

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
        raise RuntimeError(f"Errore esecuzione Node bridge:\nSTDOUT: {proc.stdout}\nSTDERR: {proc.stderr}")
    return json.loads(proc.stdout)


# =============================================================================
# 4. MOTORE DI VERIFICA E RACCOLTA RISULTATI
# =============================================================================

class Recorder:
    def __init__(self) -> None:
        self.checks: list[dict[str, Any]] = []

    def add(
        self,
        group: str,
        name: str,
        passed: bool,
        max_rel_err: float | None = None,
        max_abs_err: float | None = None,
        tolerance: float | None = None,
        detail: str = "",
        extra: dict[str, Any] | None = None,
    ) -> None:
        rec = {
            "group": group,
            "name": name,
            "status": "PASS" if passed else "FAIL",
            "maxRelErr": max_rel_err,
            "maxAbsErr": max_abs_err,
            "tolerance": tolerance,
            "detail": detail,
        }
        if extra:
            rec["extra"] = extra
        self.checks.append(rec)


def rel_err(a: float, b: float) -> float:
    denom = max(abs(b), 1e-300)
    return abs(a - b) / denom


def main() -> int:
    # Preset definiti nella dispensa e nel manifest
    presets = {
        "nacl-pair": {"a": 5.64, "massHeavyAmu": 35.5, "massLightAmu": 23.0, "springC": 10.0},
        "nacl-swapped": {"a": 5.64, "massHeavyAmu": 23.0, "massLightAmu": 35.5, "springC": 10.0},
        "mass-ratio-2": {"a": 5.0, "massHeavyAmu": 40.0, "massLightAmu": 20.0, "springC": 10.0},
        "equal-masses": {"a": 5.64, "massHeavyAmu": 29.0, "massLightAmu": 29.0, "springC": 10.0},
        "lii-contrast": {"a": 6.0, "massHeavyAmu": 126.9, "massLightAmu": 6.9, "springC": 10.0},
    }

    # Griglia 1BZ di 241 punti (come NUMERICS.kPoints1BZ) per Na-Cl, M=2m, M=m, Na-Cl invertito, Li-I
    grids: dict[str, Any] = {}
    for pname in ("nacl-pair", "nacl-swapped", "mass-ratio-2", "equal-masses", "lii-contrast"):
        p = presets[pname]
        kb = math.pi / p["a"]
        ks = [-kb + i * (2.0 * kb / 240.0) for i in range(241)]
        grids[pname] = {"params": p, "ks": ks}

    # Griglia estesa [-2π/a, 2π/a] (401 punti, come NUMERICS.kPointsExtended) per Na-Cl e M=m
    for pname in ("nacl-pair", "equal-masses"):
        p = presets[pname]
        kb = math.pi / p["a"]
        ks_ext = [-2.0 * kb + i * (4.0 * kb / 400.0) for i in range(401)]
        grids[f"{pname}-ext"] = {"params": p, "ks": ks_ext}

    curves = {
        "nacl-1bz": {
            "params": presets["nacl-pair"],
            "kMin": -math.pi / 5.64,
            "kMax": math.pi / 5.64,
            "nPoints": 241,
        },
        "nacl-ext": {
            "params": presets["nacl-pair"],
            "kMin": -2.0 * math.pi / 5.64,
            "kMax": 2.0 * math.pi / 5.64,
            "nPoints": 401,
        },
    }

    # Test ripiegamento M = m vs monatomica a/2
    equal_mass_folding = [
        {
            "name": "equal-29u",
            "diatomic": {"a": 5.64, "massHeavyAmu": 29.0, "massLightAmu": 29.0, "springC": 10.0},
            "monatomic": {"a": 2.82, "massAmu": 29.0, "springC": 10.0},
            "kFracs": [-1.0 + i * (2.0 / 80.0) for i in range(81)],
        },
        {
            "name": "equal-28u-a5",
            "diatomic": {"a": 5.0, "massHeavyAmu": 28.0, "massLightAmu": 28.0, "springC": 10.0},
            "monatomic": {"a": 2.5, "massAmu": 28.0, "springC": 10.0},
            "kFracs": [-1.0 + i * (2.0 / 80.0) for i in range(81)],
        },
    ]

    # Continuità chiusura gap M/m = 1 + delta
    gap_deltas = [1e-1, 1e-2, 1e-4, 1e-6, 1e-8, 1e-10, 1e-11, 1e-12, 1e-13, 1e-14, 1e-15, 0.0]
    gap_closure = [
        {
            "delta": d,
            "params": {"a": 5.64, "massHeavyAmu": 29.0 * (1.0 + d), "massLightAmu": 29.0, "springC": 10.0},
        }
        for d in gap_deltas
    ]

    # Sonda piccoli k per verificare cancellazione numerica in diatomicDynamicalMatrix
    small_k_vals = [1e-1, 1e-2, 1e-3, 1e-4, 1e-5, 1e-6, 1e-7, 1e-8, 1e-9, 1e-10]
    small_k_dm = [{"k": kv, "params": presets["nacl-pair"]} for kv in small_k_vals]

    # Verifica equazioni di Newton discrete (13)-(14) e R_cm nel dominio del tempo
    displacements_req = []
    for pname in ("nacl-pair", "mass-ratio-2", "equal-masses", "nacl-swapped"):
        p = presets[pname]
        kb = math.pi / p["a"]
        for k_frac in (0.0, 0.25, 0.65, 1.0, -0.4):
            for branch in ("acoustic", "optical"):
                for phase in (0.0, 0.73, 1.5707963267948966):
                    displacements_req.append({
                        "id": f"{pname}|k={k_frac}|{branch}|phi={phase:.2f}",
                        "params": p,
                        "k": k_frac * kb,
                        "branch": branch,
                        "phaseRad": phase,
                        "nCells": 8,
                    })

    # Verifica incrocio luce IR
    infrared_req = []
    for pname in ("nacl-pair", "nacl-swapped", "mass-ratio-2", "equal-masses", "lii-contrast"):
        for n_ref in (1.0, 1.5, 2.4, 3.4, 5.7):
            infrared_req.append({"id": f"{pname}|n={n_ref}", "params": presets[pname], "n": n_ref})

    # Confronto anello BvK 2N×2N
    ring_req = [
        {"id": "nacl-N4", "params": presets["nacl-pair"], "N": 4},
        {"id": "nacl-N5", "params": presets["nacl-pair"], "N": 5},
        {"id": "nacl-N8", "params": presets["nacl-pair"], "N": 8},
        {"id": "nacl-N12", "params": presets["nacl-pair"], "N": 12},
        {"id": "m2m-N6", "params": presets["mass-ratio-2"], "N": 6},
        {"id": "eq-N6", "params": presets["equal-masses"], "N": 6},
        {"id": "swap-N7", "params": presets["nacl-swapped"], "N": 7},
    ]

    # Tutti i 16 vertici della scatola degli slider (manifest.ts: a∈[3,7], M∈[6,210], m∈[6,210], C∈[2,80])
    slider_corners = [
        {"a": a_v, "massHeavyAmu": M_v, "massLightAmu": m_v, "springC": C_v}
        for a_v in (3.0, 7.0)
        for M_v in (6.0, 210.0)
        for m_v in (6.0, 210.0)
        for C_v in (2.0, 80.0)
    ]

    payload = {
        "presets": presets,
        "grids": grids,
        "curves": curves,
        "equalMassFolding": equal_mass_folding,
        "gapClosure": gap_closure,
        "smallKDm": small_k_dm,
        "displacements": displacements_req,
        "infrared": infrared_req,
        "ringCompare": ring_req,
        "sliderCorners": slider_corners,
    }

    app_out = run_node_bridge(payload)
    rec = Recorder()

    # =========================================================================
    # TEST 1: Numeri di riferimento Na–Cl (§8 p. 23), M = 2m, Li–I, M = m
    # =========================================================================
    summary_table: dict[str, Any] = {}
    for pname, p in presets.items():
        ref_s = ref_diatomic_summary_dec(
            Decimal(str(p["a"])),
            Decimal(str(p["massHeavyAmu"])),
            Decimal(str(p["massLightAmu"])),
            Decimal(str(p["springC"])),
        )
        app_s = app_out["summaries"][pname]["summary"]
        app_vs_fn = app_out["summaries"][pname]["soundSpeed"]

        errs_no_mev = {
            "soundSpeedMs": rel_err(app_s["soundSpeedMs"], float(ref_s["vs"])),
            "soundSpeedFn": rel_err(app_vs_fn, float(ref_s["vs"])),
            "omegaAcousticMaxRadS": rel_err(app_s["omegaAcousticMaxRadS"], float(ref_s["wAcMax"])),
            "freqAcousticMaxThz": rel_err(app_s["freqAcousticMaxThz"], float(ref_s["nuAcMax"])),
            "omegaOpticalMinRadS": rel_err(app_s["omegaOpticalMinRadS"], float(ref_s["wOptMin"])),
            "freqOpticalMinThz": rel_err(app_s["freqOpticalMinThz"], float(ref_s["nuOptMin"])),
            "omegaOpticalZeroRadS": rel_err(app_s["omegaOpticalZeroRadS"], float(ref_s["wOpt0"])),
            "freqOpticalZeroThz": rel_err(app_s["freqOpticalZeroThz"], float(ref_s["nuOpt0"])),
            "zoneEdge": rel_err(app_s["zoneEdge"], float(ref_s["zoneEdge"])),
            "reciprocalG": rel_err(app_s["reciprocalG"], float(ref_s["reciprocalG"])),
        }
        if float(ref_s["wGap"]) > 0:
            errs_no_mev["omegaGapRadS"] = rel_err(app_s["omegaGapRadS"], float(ref_s["wGap"]))
            errs_no_mev["freqGapThz"] = rel_err(app_s["freqGapThz"], float(ref_s["nuGap"]))
        else:
            errs_no_mev["omegaGapAbs"] = abs(app_s["omegaGapRadS"])

        errs_mev = {
            "energyAcousticMaxMev": rel_err(app_s["energyAcousticMaxMev"], float(ref_s["eAcMax"])),
            "energyOpticalMinMev": rel_err(app_s["energyOpticalMinMev"], float(ref_s["eOptMin"])),
            "energyOpticalZeroMev": rel_err(app_s["energyOpticalZeroMev"], float(ref_s["eOpt0"])),
        }
        if float(ref_s["eGap"]) > 0:
            errs_mev["energyGapMev"] = rel_err(app_s["energyGapMev"], float(ref_s["eGap"]))

        max_e = max(errs_no_mev.values())
        max_e_mev = max(errs_mev.values())

        rec.add(
            "1. Scale e preset",
            f"Summary {pname} (ω, ν, v_s, gap)",
            max_e < 1e-13,
            max_rel_err=max_e,
            tolerance=1e-13,
            detail=f"max rel err su ω/ν/v_s/gap = {max_e:.3e}",
            extra={"app": app_s, "ref": {k: float(v) for k, v in ref_s.items()}, "errs": errs_no_mev},
        )
        rec.add(
            "1. Scale e preset",
            f"Summary {pname} (energie meV vs SI 2019 esatto)",
            max_e_mev < 1e-9,
            max_rel_err=max_e_mev,
            tolerance=1e-9,
            detail=f"max rel err meV = {max_e_mev:.3e} (scarto noto 2.23e-10 da THZ_TO_MEV troncato)",
            extra={"errsMev": errs_mev},
        )
        summary_table[pname] = {
            "app": app_s,
            "ref": {k: float(v) for k, v in ref_s.items()},
        }

    # Verifica rapporti esatti M = 2m (Fig. 11)
    s2 = app_out["summaries"]["mass-ratio-2"]["summary"]
    r_optmin_acmax = s2["omegaOpticalMinRadS"] / s2["omegaAcousticMaxRadS"]
    r_opt0_acmax = s2["omegaOpticalZeroRadS"] / s2["omegaAcousticMaxRadS"]
    r_vs_expected = 5.0 * 1e-10 * math.sqrt(10.0 / (2.0 * 60.0 * AMU_KG))
    err_m2m = max(
        rel_err(r_optmin_acmax, math.sqrt(2.0)),
        rel_err(r_opt0_acmax, math.sqrt(3.0)),
        rel_err(s2["soundSpeedMs"], r_vs_expected),
    )
    rec.add(
        "1. Scale e preset",
        "Rapporti canonici M = 2m (√2, √3, v_s)",
        err_m2m < 1e-14,
        max_rel_err=err_m2m,
        tolerance=1e-14,
        detail=f"ω_min^ott/ω_max^ac={r_optmin_acmax:.15f} (√2), ω_+(0)/ω_max^ac={r_opt0_acmax:.15f} (√3)",
    )

    # Verifica con le masse arrotondate della dispensa Na-Cl §8 p. 23 (m=3.82e-26 kg, M=5.89e-26 kg)
    m_disp_kg = 3.82e-26
    M_disp_kg = 5.89e-26
    vs_disp_kg = 5.64e-10 * math.sqrt(10.0 / (2.0 * (m_disp_kg + M_disp_kg)))
    w_ac_disp_kg = math.sqrt(20.0 / M_disp_kg)
    w_op_disp_kg = math.sqrt(20.0 / m_disp_kg)
    w_0_disp_kg = math.sqrt(20.0 * (1.0 / m_disp_kg + 1.0 / M_disp_kg))
    summary_table["nacl-dispensa-rounded-kg"] = {
        "vs": vs_disp_kg,
        "wAcMax": w_ac_disp_kg,
        "wOptMin": w_op_disp_kg,
        "wOpt0": w_0_disp_kg,
    }

    # =========================================================================
    # TEST 2: Confronto punto per punto 1BZ (241 pt) ed estesa (401 pt):
    #         eq. (20) 50-digit vs diatomicOmega vs D(k) 2×2 Jacobi
    # =========================================================================
    for gname, rows in app_out["gridChecks"].items():
        p = grids[gname]["params"]
        a_d = Decimal(str(p["a"]))
        M_d = Decimal(str(p["massHeavyAmu"]))
        m_d = Decimal(str(p["massLightAmu"]))
        C_d = Decimal(str(p["springC"]))
        M_kg = p["massHeavyAmu"] * AMU_KG
        m_kg = p["massLightAmu"] * AMU_KG
        is_eq = abs(p["massHeavyAmu"] - p["massLightAmu"]) < 1e-12

        max_err_w_ac = 0.0
        max_err_w_op = 0.0
        max_err_dm_d = 0.0
        max_err_dm_eig_ac = 0.0
        max_err_dm_eig_op = 0.0
        max_err_dm_w_ac = 0.0
        max_err_dm_w_op = 0.0
        max_err_dm_res = 0.0
        max_err_dm_ortho = 0.0
        max_err_alpha_eig = 0.0
        max_err_alpha_prod = 0.0
        max_err_eq17_18 = 0.0
        max_err_vg_fd4 = 0.0
        max_err_vg_fd2 = 0.0
        max_err_vp = 0.0
        worst_dm_w_ac_k = 0.0
        any_bad_num = False

        kb = math.pi / p["a"]
        w0_ref = float(ref_diatomic_exact_dec(Decimal(0), a_d, M_d, m_d, C_d)["wPlus"])

        for row in rows:
            k = row["k"]
            for v in (row["wAc"], row["wOp"], row["vgAc"], row["vgOp"]):
                if not math.isfinite(v):
                    any_bad_num = True

            # Riferimento esatto eq. (20) a 50 cifre
            ref_e = ref_diatomic_exact_dec(Decimal(repr(k)), a_d, M_d, m_d, C_d)
            w_ac_ref = float(ref_e["wMinus"])
            w_op_ref = float(ref_e["wPlus"])
            w_ac_sq_ref = float(ref_e["wMinusSq"])
            w_op_sq_ref = float(ref_e["wPlusSq"])

            # Confronto diatomicOmega vs eq. (20) a 50 cifre
            if w_ac_ref > 1e-10 * w0_ref:
                max_err_w_ac = max(max_err_w_ac, rel_err(row["wAc"], w_ac_ref))
            else:
                max_err_w_ac = max(max_err_w_ac, abs(row["wAc"] - w_ac_ref) / w0_ref)
            max_err_w_op = max(max_err_w_op, rel_err(row["wOp"], w_op_ref))

            # Confronto matrice dinamica D(k) 2×2
            dm = row["dm"]
            ref_dm = ref_dynamical_matrix_2x2_jacobi(k, p["a"], p["massHeavyAmu"], p["massLightAmu"], p["springC"])
            d_scale = max(ref_dm["d11"], ref_dm["d22"])
            max_err_dm_d = max(
                max_err_dm_d,
                abs(dm["d11"] - ref_dm["d11"]) / d_scale,
                abs(dm["d22"] - ref_dm["d22"]) / d_scale,
                abs(dm["d12"] - ref_dm["d12"]) / d_scale,
            )

            # Autovalori e pulsazioni da D(k) vs eq. (20) a 50 cifre
            if w_ac_sq_ref > 1e-10 * w_op_sq_ref:
                e_eig_ac = rel_err(dm["eigenvalues"][0], w_ac_sq_ref)
                e_w_ac = rel_err(dm["omegasRadS"][0], w_ac_ref)
                if e_w_ac > max_err_dm_w_ac:
                    worst_dm_w_ac_k = k
                max_err_dm_eig_ac = max(max_err_dm_eig_ac, e_eig_ac)
                max_err_dm_w_ac = max(max_err_dm_w_ac, e_w_ac)
            else:
                max_err_dm_eig_ac = max(max_err_dm_eig_ac, abs(dm["eigenvalues"][0] - w_ac_sq_ref) / w_op_sq_ref)
                max_err_dm_w_ac = max(max_err_dm_w_ac, abs(dm["omegasRadS"][0] - w_ac_ref) / w0_ref)
            max_err_dm_eig_op = max(max_err_dm_eig_op, rel_err(dm["eigenvalues"][1], w_op_sq_ref))
            max_err_dm_w_op = max(max_err_dm_w_op, rel_err(dm["omegasRadS"][1], w_op_ref))

            # Residuo agli autovalori D·ε = ω²·ε e ortonormalità
            e_ac, e_op = dm["eigenvectors"]
            max_err_dm_ortho = max(
                max_err_dm_ortho,
                abs(e_ac[0] ** 2 + e_ac[1] ** 2 - 1.0),
                abs(e_op[0] ** 2 + e_op[1] ** 2 - 1.0),
                abs(e_ac[0] * e_op[0] + e_ac[1] * e_op[1]),
            )
            for idx in (0, 1):
                ev = dm["eigenvalues"][idx]
                vec = dm["eigenvectors"][idx]
                r0 = dm["d11"] * vec[0] + dm["d12"] * vec[1] - ev * vec[0]
                r1 = dm["d12"] * vec[0] + dm["d22"] * vec[1] - ev * vec[1]
                max_err_dm_res = max(max_err_dm_res, math.hypot(r0, r1) / dm["trace"])

            # Confronto α da autovettori D(k) vs diatomicModeAmplitude vs eqq. (17)-(18)
            cos_h = math.cos(0.5 * k * p["a"])
            two_c = 2.0 * p["springC"]
            for bname, idx, w_sq_r, amp_obj in (
                ("acoustic", 0, w_ac_sq_ref, row["ampAc"]),
                ("optical", 1, w_op_sq_ref, row["ampOp"]),
            ):
                # Equazioni (17) e (18) dirette sugli spostamenti normalizzati (ampM, ampm)
                uM_a = amp_obj["ampM"]
                um_a = amp_obj["ampm"]
                res17 = (two_c - w_sq_r * M_kg) * uM_a - two_c * cos_h * um_a
                res18 = -two_c * cos_h * uM_a + (two_c - w_sq_r * m_kg) * um_a
                max_err_eq17_18 = max(max_err_eq17_18, math.hypot(res17, res18) / two_c)

                # Confronto α dagli autovettori di D(k) (escluso il punto degenere esatto M=m, cos=0)
                if not (is_eq and abs(cos_h) < 1e-10):
                    vec_app = dm["eigenvectors"][idx]
                    if amp_obj["alpha"] is not None and abs(vec_app[0]) > 1e-9:
                        alpha_from_dm = math.sqrt(M_kg / m_kg) * (vec_app[1] / vec_app[0])
                        denom_a = max(1.0, abs(amp_obj["alpha"]))
                        max_err_alpha_eig = max(max_err_alpha_eig, abs(alpha_from_dm - amp_obj["alpha"]) / denom_a)

            # Identità esatta di ortogonalità α_-(k) · α_+(k) = −M/m (quando entrambi finiti e non nulli)
            a_ac = row["ampAc"]["alpha"]
            a_op = row["ampOp"]["alpha"]
            if a_ac is not None and a_op is not None and abs(a_ac) > 1e-8 and abs(a_op) > 1e-8:
                max_err_alpha_prod = max(
                    max_err_alpha_prod,
                    rel_err(a_ac * a_op, -p["massHeavyAmu"] / p["massLightAmu"]),
                )

            # Confronto v_g analitica vs FD4 e FD2 lontano dai punti angolosi (k = 0, ±2π/a acustico; k = ±π/a se M = m)
            near_origin_mod = abs(math.sin(0.5 * k * p["a"])) < 1e-2
            near_edge_mod = abs(math.cos(0.5 * k * p["a"])) < 1e-2
            for bname, vg_app in (("acoustic", row["vgAc"]), ("optical", row["vgOp"])):
                skip_cusp = (bname == "acoustic" and near_origin_mod) or (is_eq and near_edge_mod)
                if not skip_cusp:
                    vg4 = ref_vg_fd4(k, bname, p["a"], p["massHeavyAmu"], p["massLightAmu"], p["springC"], h=1e-4)
                    vg2 = ref_vg_fd2(k, bname, p["a"], p["massHeavyAmu"], p["massLightAmu"], p["springC"], h=1e-5)
                    scale_v = max(abs(vg4), float(ref_diatomic_summary_dec(a_d, M_d, m_d, C_d)["vs"]))
                    max_err_vg_fd4 = max(max_err_vg_fd4, abs(vg_app - vg4) / scale_v)
                    max_err_vg_fd2 = max(max_err_vg_fd2, abs(vg_app - vg2) / scale_v)

            # Confronto v_p = ω/k
            if abs(k) >= 1e-12:
                vp_ac_ref = w_ac_ref / (k / ANGSTROM_M)
                vp_op_ref = w_op_ref / (k / ANGSTROM_M)
                if abs(vp_ac_ref) > 1e-10:
                    max_err_vp = max(max_err_vp, rel_err(row["vpAc"], vp_ac_ref))
                max_err_vp = max(max_err_vp, rel_err(row["vpOp"], vp_op_ref))

        rec.add(
            "2. Griglia 1BZ e D(k)",
            f"Griglia {gname}: eq. (20) vs diatomicOmega (nessun NaN/Inf)",
            (not any_bad_num) and max(max_err_w_ac, max_err_w_op) < 1e-13,
            max_rel_err=max(max_err_w_ac, max_err_w_op),
            tolerance=1e-13,
            detail=f"max rel err ω_-={max_err_w_ac:.3e}, ω_+={max_err_w_op:.3e}",
        )
        rec.add(
            "2. Griglia 1BZ e D(k)",
            f"Griglia {gname}: D(k) 2×2 elementi, autovalori ω², residuo, ortonormalità",
            max(max_err_dm_d, max_err_dm_eig_ac, max_err_dm_eig_op, max_err_dm_w_ac, max_err_dm_w_op, max_err_dm_res, max_err_dm_ortho) < 1e-10,
            max_rel_err=max(max_err_dm_eig_ac, max_err_dm_eig_op, max_err_dm_w_ac, max_err_dm_w_op),
            max_abs_err=max(max_err_dm_res, max_err_dm_ortho),
            tolerance=1e-10,
            detail=(
                f"d_ij={max_err_dm_d:.2e}, ω_-²={max_err_dm_eig_ac:.2e}, ω_+²={max_err_dm_eig_op:.2e}, "
                f"ω_-={max_err_dm_w_ac:.2e} (worst k={worst_dm_w_ac_k:.4f}), res={max_err_dm_res:.2e}, ortho={max_err_dm_ortho:.2e}"
            ),
        )
        rec.add(
            "2. Griglia 1BZ e D(k)",
            f"Griglia {gname}: α da autovettori D(k), eqq. (17)–(18) e identità α_-α_+ = −M/m",
            max(max_err_alpha_eig, max_err_eq17_18, max_err_alpha_prod) < 1e-11,
            max_rel_err=max(max_err_alpha_eig, max_err_alpha_prod),
            max_abs_err=max_err_eq17_18,
            tolerance=1e-11,
            detail=f"α_eig vs app={max_err_alpha_eig:.2e}, eq17-18={max_err_eq17_18:.2e}, α_-α_+={max_err_alpha_prod:.2e}",
        )
        rec.add(
            "2. Griglia 1BZ e D(k)",
            f"Griglia {gname}: v_g analitica vs FD4/FD2 e v_p = ω/k",
            max_err_vg_fd4 < 1e-10 and max_err_vg_fd2 < 1e-8 and max_err_vp < 1e-13,
            max_rel_err=max_err_vg_fd4,
            tolerance=1e-10,
            detail=f"v_g FD4={max_err_vg_fd4:.2e}, FD2={max_err_vg_fd2:.2e}, v_p={max_err_vp:.2e}",
        )

    # =========================================================================
    # TEST 2b: Verifica diatomicDispersionCurve (campionamento completo)
    # =========================================================================
    for cname, cdata in app_out["curves"].items():
        cfg = curves[cname]
        p = cfg["params"]
        a_d, M_d, m_d, C_d = Decimal(str(p["a"])), Decimal(str(p["massHeavyAmu"])), Decimal(str(p["massLightAmu"])), Decimal(str(p["springC"]))
        max_w_err = 0.0
        max_nu_err = 0.0
        max_mev_err = 0.0
        w0_ref = float(ref_diatomic_exact_dec(Decimal(0), a_d, M_d, m_d, C_d)["wPlus"])
        for i, kv in enumerate(cdata["k"]):
            re = ref_diatomic_exact_dec(Decimal(repr(kv)), a_d, M_d, m_d, C_d)
            w_ac_r, w_op_r = float(re["wMinus"]), float(re["wPlus"])
            max_w_err = max(max_w_err, abs(cdata["acousticOmegaRadS"][i] - w_ac_r) / w0_ref, rel_err(cdata["opticalOmegaRadS"][i], w_op_r))
            nu_ac_r, nu_op_r = ref_rad_s_to_thz(w_ac_r), ref_rad_s_to_thz(w_op_r)
            nu0_r = ref_rad_s_to_thz(w0_ref)
            max_nu_err = max(max_nu_err, abs(cdata["acousticFreqThz"][i] - nu_ac_r) / nu0_r, rel_err(cdata["opticalFreqThz"][i], nu_op_r))
            e_ac_r, e_op_r = ref_rad_s_to_mev_exact(w_ac_r), ref_rad_s_to_mev_exact(w_op_r)
            e0_r = ref_rad_s_to_mev_exact(w0_ref)
            max_mev_err = max(max_mev_err, abs(cdata["acousticEnergyMev"][i] - e_ac_r) / e0_r, rel_err(cdata["opticalEnergyMev"][i], e_op_r))
        rec.add(
            "2. Griglia 1BZ e D(k)",
            f"Curva campionata {cname} ({len(cdata['k'])} pt)",
            max_w_err < 1e-13 and max_nu_err < 1e-13 and max_mev_err < 1e-9,
            max_rel_err=max(max_w_err, max_nu_err),
            tolerance=1e-13,
            detail=f"ω={max_w_err:.2e}, ν={max_nu_err:.2e}, ħω={max_mev_err:.2e}",
        )

    # =========================================================================
    # TEST 2c: Sonda piccoli k su diatomicDynamicalMatrix (verifica cancellazione!)
    # =========================================================================
    small_k_report = []
    worst_small_k_dm_err = 0.0
    worst_small_k_omega_err = 0.0
    p_nacl = presets["nacl-pair"]
    a_n, M_n, m_n, C_n = Decimal("5.64"), Decimal("35.5"), Decimal("23.0"), Decimal("10")
    for item in app_out["smallKDm"]:
        k = item["k"]
        re = ref_diatomic_exact_dec(Decimal(repr(k)), a_n, M_n, m_n, C_n)
        w_ac_ref = float(re["wMinus"])
        w_ac_sq_ref = float(re["wMinusSq"])
        e_omega = rel_err(item["wAc"], w_ac_ref)
        e_dm_w = rel_err(item["dm"]["omegasRadS"][0], w_ac_ref)
        e_dm_eig = rel_err(item["dm"]["eigenvalues"][0], w_ac_sq_ref)
        worst_small_k_omega_err = max(worst_small_k_omega_err, e_omega)
        worst_small_k_dm_err = max(worst_small_k_dm_err, e_dm_w)
        small_k_report.append({
            "k": k,
            "wAcRef": w_ac_ref,
            "wAcEq20App": item["wAc"],
            "wAcDmApp": item["dm"]["omegasRadS"][0],
            "relErrEq20": e_omega,
            "relErrDmOmega": e_dm_w,
            "relErrDmEig": e_dm_eig,
            "dmDet": item["dm"]["det"],
        })

    rec.add(
        "2. Griglia 1BZ e D(k)",
        "Sonda piccoli k (10⁻¹…10⁻¹⁰ Å⁻¹): stabilità diatomicOmega (eq. 20 coniugata)",
        worst_small_k_omega_err < 1e-13,
        max_rel_err=worst_small_k_omega_err,
        tolerance=1e-13,
        detail=f"max rel err diatomicOmega su [1e-10, 1e-1] Å⁻¹ = {worst_small_k_omega_err:.3e}",
        extra={"table": small_k_report},
    )
    rec.add(
        "2. Griglia 1BZ e D(k)",
        "Sonda piccoli k (10⁻¹…10⁻¹⁰ Å⁻¹): cancellazione in diatomicDynamicalMatrix (det = d11·d22 − d12²)",
        worst_small_k_dm_err < 1e-10,
        max_rel_err=worst_small_k_dm_err,
        tolerance=1e-10,
        detail=(
            f"max rel err dm.omegasRadS[0] = {worst_small_k_dm_err:.3e} "
            f"(a k=1e-5: {small_k_report[4]['relErrDmOmega']:.2e}; a k=1e-7: {small_k_report[6]['relErrDmOmega']:.2e}; "
            f"a k=1e-8: {small_k_report[7]['relErrDmOmega']:.2e}, azzerato dal clamp 1e-14!)"
        ),
        extra={"table": small_k_report},
    )

    # =========================================================================
    # TEST 3: Chiusura continua a M = m e confronto con monatomica di passo a/2
    # =========================================================================
    for fold_item in app_out["equalMassFolding"]:
        max_ac_diff = 0.0
        max_op_diff = 0.0
        max_vg_ac_diff = 0.0
        max_analytic_diff = 0.0
        p_dia = next(c["diatomic"] for c in equal_mass_folding if c["name"] == fold_item["name"])
        w_scale = fold_item["diaSummary"]["omegaOpticalZeroRadS"]
        vs_scale = fold_item["diaSummary"]["soundSpeedMs"]
        a_val = p_dia["a"]
        m_kg = p_dia["massLightAmu"] * AMU_KG
        w_mono_max = 2.0 * math.sqrt(p_dia["springC"] / m_kg)

        for s in fold_item["samples"]:
            k = s["k"]
            max_ac_diff = max(max_ac_diff, abs(s["diaAc"] - s["monoK"]) / w_scale)
            max_op_diff = max(max_op_diff, abs(s["diaOp"] - s["monoFolded"]) / w_scale)
            # Formule chiuse §8.3 p. 23: ω_- = 2√(C/m)|sin(ka/4)|, ω_+ = 2√(C/m)|cos(ka/4)| in 1BZ
            w_ac_closed = w_mono_max * abs(math.sin(0.25 * k * a_val))
            w_op_closed = w_mono_max * abs(math.cos(0.25 * k * a_val))
            max_analytic_diff = max(
                max_analytic_diff,
                abs(s["diaAc"] - w_ac_closed) / w_scale,
                abs(s["diaOp"] - w_op_closed) / w_scale,
            )
            # Confronto v_g acustica con monatomica a/2 (tranne k = 0 e k = ±π/a)
            if abs(s["kFrac"]) > 1e-6 and abs(abs(s["kFrac"]) - 1.0) > 1e-6:
                max_vg_ac_diff = max(max_vg_ac_diff, abs(s["vgAc"] - s["monoVg"]) / vs_scale)

        vs_err = rel_err(fold_item["diaSummary"]["soundSpeedMs"], fold_item["monoSummary"]["soundSpeedMs"])
        w0_err = rel_err(fold_item["diaSummary"]["omegaOpticalZeroRadS"], fold_item["monoSummary"]["omegaMaxRadS"])
        rec.add(
            "3. Limite M = m e ripiegamento",
            f"Ripiegamento {fold_item['name']} vs monatomica di passo a/2 (§8.3 p. 23)",
            max(max_ac_diff, max_op_diff, max_analytic_diff, max_vg_ac_diff, vs_err, w0_err) < 1e-13
            and fold_item["diaSummary"]["omegaGapRadS"] == 0.0
            and fold_item["diaSummary"]["equalMasses"] is True,
            max_rel_err=max(max_ac_diff, max_op_diff, max_analytic_diff, max_vg_ac_diff, vs_err, w0_err),
            tolerance=1e-13,
            detail=(
                f"ω_- vs mono={max_ac_diff:.2e}, ω_+ vs mono(k-G)={max_op_diff:.2e}, "
                f"formule sin/cos(ka/4)={max_analytic_diff:.2e}, v_g={max_vg_ac_diff:.2e}, v_s={vs_err:.2e}, ω_+(0)={w0_err:.2e}"
            ),
        )

    # Continuità della chiusura del gap per M/m = 1 + δ → 1
    gap_rows = []
    max_gap_err = 0.0
    gap_monotonic = True
    prev_gap = float("inf")
    alpha_transition_notes = []
    for item in app_out["gapClosure"]:
        d = item["delta"]
        M_d = Decimal("29") * (Decimal(1) + Decimal(repr(d)))
        ref_s = ref_diatomic_summary_dec(Decimal("5.64"), M_d, Decimal("29"), Decimal("10"))
        ref_gap = float(ref_s["wGap"])
        app_gap = item["summary"]["omegaGapRadS"]
        if app_gap > prev_gap + 1e-30:
            gap_monotonic = False
        prev_gap = app_gap
        err_g = abs(app_gap - ref_gap) / float(ref_s["wOpt0"])
        max_gap_err = max(max_gap_err, err_g)
        gap_rows.append({
            "delta": d,
            "refGap": ref_gap,
            "appGap": app_gap,
            "equalMasses": item["summary"]["equalMasses"],
            "ampAcAlpha": item["ampAcEdge"]["alpha"],
            "ampOpAlpha": item["ampOpEdge"]["alpha"],
            "dmEigVecAc": item["dmEdge"]["eigenvectors"][0],
        })
        if d > 0 and d <= 1e-11:
            alpha_transition_notes.append(
                f"δ={d:.0e}: eqFlag={item['summary']['equalMasses']}, ampAc.α={item['ampAcEdge']['alpha']}, dm.eAc={item['dmEdge']['eigenvectors'][0]}"
            )

    rec.add(
        "3. Limite M = m e ripiegamento",
        "Chiusura continua e monotona del gap per M/m = 1 + δ (δ ∈ [0, 10⁻¹])",
        gap_monotonic and max_gap_err < 1e-14,
        max_rel_err=max_gap_err,
        tolerance=1e-14,
        detail=f"monotona={gap_monotonic}, max err/ω_+(0)={max_gap_err:.2e}; transizione δ≤1e-11: {'; '.join(alpha_transition_notes)}",
        extra={"rows": gap_rows},
    )

    # =========================================================================
    # TEST 4: Simmetria esatta per m > M (scambio masse Na–Cl vs Cl–Na)
    # =========================================================================
    s_orig = app_out["summaries"]["nacl-pair"]["summary"]
    s_swap = app_out["summaries"]["nacl-swapped"]["summary"]
    sym_sum_err = max(
        rel_err(s_swap["soundSpeedMs"], s_orig["soundSpeedMs"]),
        rel_err(s_swap["omegaAcousticMaxRadS"], s_orig["omegaAcousticMaxRadS"]),
        rel_err(s_swap["omegaOpticalMinRadS"], s_orig["omegaOpticalMinRadS"]),
        rel_err(s_swap["omegaOpticalZeroRadS"], s_orig["omegaOpticalZeroRadS"]),
        rel_err(s_swap["omegaGapRadS"], s_orig["omegaGapRadS"]),
        rel_err(s_swap["massRatio"], 1.0 / s_orig["massRatio"]),
    )
    rows_orig = app_out["gridChecks"]["nacl-pair"]
    rows_swap = app_out["gridChecks"]["nacl-swapped"]
    sym_w_err = 0.0
    sym_vg_err = 0.0
    sym_alpha_err = 0.0
    sym_cm_err = 0.0
    sym_flags_ok = True
    w0_nacl = s_orig["omegaOpticalZeroRadS"]
    vs_nacl = s_orig["soundSpeedMs"]
    for r1, r2 in zip(rows_orig, rows_swap):
        sym_w_err = max(
            sym_w_err,
            abs(r1["wAc"] - r2["wAc"]) / w0_nacl,
            abs(r1["wOp"] - r2["wOp"]) / w0_nacl,
        )
        sym_vg_err = max(
            sym_vg_err,
            abs(r1["vgAc"] - r2["vgAc"]) / vs_nacl,
            abs(r1["vgOp"] - r2["vgOp"]) / vs_nacl,
        )
        for key in ("ampAc", "ampOp"):
            a1, a2 = r1[key], r2[key]
            if a1["heavyStationary"] != a2["lightStationary"] or a1["lightStationary"] != a2["heavyStationary"]:
                sym_flags_ok = False
            if a1["alpha"] is not None and a2["invAlpha"] is not None:
                sym_alpha_err = max(sym_alpha_err, abs(a1["alpha"] - a2["invAlpha"]) / max(1.0, abs(a1["alpha"])))
            sym_cm_err = max(sym_cm_err, abs(a1["cmAmp"] - a2["cmAmp"]))

    rec.add(
        "4. Simmetria m > M",
        "Invarianza completa sotto scambio M ↔ m (241 pt 1BZ + summary + α ↔ 1/α + R_cm)",
        (
            s_orig["invertedMasses"] is False
            and s_swap["invertedMasses"] is True
            and sym_flags_ok
            and max(sym_sum_err, sym_w_err, sym_vg_err, sym_alpha_err, sym_cm_err) < 1e-13
        ),
        max_rel_err=max(sym_sum_err, sym_w_err, sym_vg_err, sym_alpha_err, sym_cm_err),
        tolerance=1e-13,
        detail=(
            f"summary={sym_sum_err:.2e}, ω={sym_w_err:.2e}, v_g={sym_vg_err:.2e}, "
            f"α↔1/α={sym_alpha_err:.2e}, R_cm={sym_cm_err:.2e}, flags={sym_flags_ok}"
        ),
    )

    # =========================================================================
    # TEST 5: Anello finito BvK 2N×2N (Jacobi indipendente su Φ_ij / √(m_i m_j))
    # =========================================================================
    for r_item in app_out["ringCompare"]:
        cfg = next(x for x in ring_req if x["id"] == r_item["id"])
        p = cfg["params"]
        jac = ref_ring_jacobi_2N(cfg["N"], p["massHeavyAmu"], p["massLightAmu"], p["springC"])
        app_omegas = r_item["omegas"]
        ref_omegas = jac["omegas"]
        ref_eigs_raw = jac["eigsRaw"]
        w_scale = ref_omegas[-1]
        eig_scale = ref_eigs_raw[-1]
        max_spec_err = max(abs(a - b) / w_scale for a, b in zip(app_omegas, ref_omegas))
        max_eig_err = max(abs(a * a - ev) / eig_scale for a, ev in zip(app_omegas, ref_eigs_raw))
        rec.add(
            "5. Spettro 2N×2N anello BvK",
            f"Anello {r_item['id']} (N={cfg['N']}, 2N={2*cfg['N']} modi, somma nulla Φ)",
            jac["maxRowSum"] == 0.0 and len(app_omegas) == 2 * cfg["N"] and max_spec_err < 1e-13 and max_eig_err < 1e-13,
            max_rel_err=max(max_spec_err, max_eig_err),
            max_abs_err=jac["maxRowSum"],
            tolerance=1e-13,
            detail=f"max|∑Φ|={jac['maxRowSum']:.1e}, max|ω_app−ω_J2N|/ω_max={max_spec_err:.2e}, max|ω²_app−λ_J2N|/λ_max={max_eig_err:.2e}",
        )

    # =========================================================================
    # TEST 6: Equazioni di Newton discrete (13)–(14) e R_cm nel dominio del tempo
    # =========================================================================
    max_newton_res = 0.0
    max_rcm_err = 0.0
    rcm_opt0_max = 0.0
    rcm_ac0_err = 0.0
    for d_item in app_out["displacements"]:
        req = next(x for x in displacements_req if x["id"] == d_item["id"])
        p = req["params"]
        M_kg = p["massHeavyAmu"] * AMU_KG
        m_kg = p["massLightAmu"] * AMU_KG
        C_val = p["springC"]
        w = d_item["w"]
        disp = d_item["disp"]
        # Controlla tutti gli atomi interni (esclusi i due estremi della finestra)
        force_scale = 2.0 * C_val
        for i in range(1, len(disp) - 1):
            u_prev = disp[i - 1]["u"]
            u_curr = disp[i]["u"]
            u_next = disp[i + 1]["u"]
            mass_i = M_kg if disp[i]["species"] == "M" else m_kg
            # M ü_n = -ω² M u_n vs C(u_{n+1} - 2 u_n + u_{n-1})
            lhs = -w * w * mass_i * u_curr
            rhs = C_val * (u_next - 2.0 * u_curr + u_prev)
            max_newton_res = max(max_newton_res, abs(lhs - rhs) / force_scale)

        # Verifica analitica R_cm = |M·ampM + m·ampm·e^{-ika/2}| / (M + m)
        amp = d_item["amp"]
        k = req["k"]
        M_u, m_u = p["massHeavyAmu"], p["massLightAmu"]
        rcm_ref = abs(complex(M_u * amp["ampM"], 0.0) + complex(m_u * amp["ampm"], 0.0) * complex(math.cos(-0.5 * k * p["a"]), math.sin(-0.5 * k * p["a"]))) / (M_u + m_u)
        max_rcm_err = max(max_rcm_err, abs(amp["cmAmp"] - rcm_ref))
        if abs(k) == 0.0 and req["branch"] == "optical":
            rcm_opt0_max = max(rcm_opt0_max, amp["cmAmp"])
        if abs(k) == 0.0 and req["branch"] == "acoustic":
            rcm_ac0_err = max(rcm_ac0_err, abs(amp["cmAmp"] - 1.0))

    # Verifica R_cm nel dominio del tempo direttamente su diatomicDisplacements per k = 0 e k = 0.5 π/a
    # (max su una griglia fine di 64 fasi φ ∈ [0, 2π) su una cella (M_n, m_{n-1}))
    rcm_td_err = 0.0
    for pname in ("nacl-pair", "mass-ratio-2"):
        p = presets[pname]
        kb = math.pi / p["a"]
        M_u, m_u = p["massHeavyAmu"], p["massLightAmu"]
        # Riusiamo i tre campioni di fase (0, 0.73, π/2) per verificare che |R_cm(φ)| ≤ cmAmp
        for d_item in app_out["displacements"]:
            if not d_item["id"].startswith(pname + "|"):
                continue
            disp = d_item["disp"]
            cm_amp = d_item["amp"]["cmAmp"]
            # Coppie (m_{2j-1}, M_{2j}) adiacenti
            for i in range(1, len(disp)):
                if disp[i]["species"] == "M" and disp[i - 1]["species"] == "m":
                    rcm_inst = abs(M_u * disp[i]["u"] + m_u * disp[i - 1]["u"]) / (M_u + m_u)
                    if rcm_inst > cm_amp + 1e-12:
                        rcm_td_err = max(rcm_td_err, rcm_inst - cm_amp)
                    if "|k=0.0|optical|" in d_item["id"]:
                        rcm_td_err = max(rcm_td_err, rcm_inst)

    rec.add(
        "6. Equazioni di Newton e R_cm",
        f"Equazioni di Newton discrete (13)–(14) su {len(displacements_req)} configurazioni u_n(t)",
        max_newton_res < 1e-13,
        max_abs_err=max_newton_res,
        tolerance=1e-13,
        detail=f"residuo normalizzato max |−ω² m_i u_i − C(u_{{i+1}}−2u_i+u_{{i−1}})|/(2C) = {max_newton_res:.2e}",
    )
    rec.add(
        "6. Equazioni di Newton e R_cm",
        "Centro di massa della cella R_cm (analitico, k=0 ottico = 0, k=0 acustico = 1, dominio del tempo)",
        max_rcm_err < 1e-13 and rcm_opt0_max == 0.0 and rcm_ac0_err < 1e-13 and rcm_td_err < 1e-13,
        max_abs_err=max(max_rcm_err, rcm_ac0_err, rcm_td_err),
        tolerance=1e-13,
        detail=f"err R_cm={max_rcm_err:.2e}, R_cm(ott,0)={rcm_opt0_max:.1e}, |R_cm(ac,0)−1|={rcm_ac0_err:.2e}, TD={rcm_td_err:.2e}",
    )

    # =========================================================================
    # TEST 7: Curvatura ramo ottico a k = 0 (§8.1 p. 21) e segni di v_g
    # =========================================================================
    # §8.1 p. 21: ω_+²(k) ≃ ω_+²(0) − C a² k² / (2(m+M)) ⇒ ω_+''(0) = −C a² / (2(m+M) ω_+(0))
    # Verifica via FD2 su diatomicOmega: usiamo i punti adiacenti a k=0 nella griglia smallKDm (k=1e-3 Å⁻¹)
    k_curv = 1e-3
    w0_app = app_out["summaries"]["nacl-pair"]["summary"]["omegaOpticalZeroRadS"]
    wk_app = next(x["wOp"] for x in app_out["smallKDm"] if abs(x["k"] - k_curv) < 1e-15)
    # Poiché ω_+ è pari: ω_+''(0) ≈ 2 (ω_+(k) - ω_+(0)) / k²
    curv_num_m = 2.0 * (wk_app - w0_app) / ((k_curv / ANGSTROM_M) ** 2)
    M_n_kg = 35.5 * AMU_KG
    m_n_kg = 23.0 * AMU_KG
    curv_analytic_m = -(10.0 * (5.64e-10) ** 2) / (2.0 * (M_n_kg + m_n_kg) * w0_app)
    err_curv = rel_err(curv_num_m, curv_analytic_m)
    # Verifica segno negativo di v_g sul ramo ottico per tutto 0 < k < π/a su Na-Cl
    opt_neg_ok = all(
        r["vgOp"] < 0.0
        for r in app_out["gridChecks"]["nacl-pair"]
        if 1e-9 < r["k"] < (math.pi / 5.64 - 1e-9)
    )
    ac_pos_ok = all(
        r["vgAc"] > 0.0
        for r in app_out["gridChecks"]["nacl-pair"]
        if 1e-9 < r["k"] < (math.pi / 5.64 - 1e-9)
    )
    rec.add(
        "7. Curvatura ottica e segni v_g",
        "Curvatura ramo ottico ω_+''(0) = −Ca²/(2(m+M)ω_+(0)) (§8.1 p. 21) e segni v_g in (0, π/a)",
        err_curv < 1e-5 and opt_neg_ok and ac_pos_ok,
        max_rel_err=err_curv,
        tolerance=1e-5,
        detail=f"ω_+''(0) num={curv_num_m:.6e}, analitica={curv_analytic_m:.6e} (err={err_curv:.2e}), v_g(ott)<0={opt_neg_ok}, v_g(ac)>0={ac_pos_ok}",
    )

    # =========================================================================
    # TEST 8: Incrocio luce IR ω₊(k) = (c/n)k (§24, pp. 59–60, eq. 60)
    # =========================================================================
    max_ir_omega_err = 0.0
    max_ir_k_err = 0.0
    max_ir_lam_err = 0.0
    max_ir_res = 0.0
    max_ir_mev_err = 0.0
    ir_nacl_n1: dict[str, Any] = {}

    for item in app_out["infrared"]:
        p = item["params"]
        n_d = Decimal(str(item["n"]))
        ref_ir = ref_ir_crossing_dec(
            Decimal(str(p["a"])),
            Decimal(str(p["massHeavyAmu"])),
            Decimal(str(p["massLightAmu"])),
            Decimal(str(p["springC"])),
            n_d,
        )
        ir = item["ir"]
        e_w = rel_err(ir["omegaRadS"], float(ref_ir["omegaRadS"]))
        e_k = rel_err(ir["kLightAngInv"], float(ref_ir["kLightAngInv"]))
        e_km = rel_err(ir["kLightMInv"], float(ref_ir["kLightMInv"]))
        e_kz = rel_err(ir["kOverZoneEdge"], float(ref_ir["kOverZoneEdge"]))
        e_lam = rel_err(ir["wavelengthUm"], float(ref_ir["wavelengthUm"]))
        e_sr = rel_err(ir["speedRatio"], float(ref_ir["speedRatio"]))
        e_mev = rel_err(ir["energyMev"], float(ref_ir["energyMevExact"]))
        # Residuo diretto equazione d'incrocio ω₊(k_IR) − (c/n) k_IR
        c_med = C_LIGHT / item["n"]
        res_eq = abs(item["wAtK"] - c_med * ir["kLightMInv"]) / item["wAtK"]

        max_ir_omega_err = max(max_ir_omega_err, e_w)
        max_ir_k_err = max(max_ir_k_err, e_k, e_km, e_kz)
        max_ir_lam_err = max(max_ir_lam_err, e_lam, e_sr)
        max_ir_res = max(max_ir_res, res_eq)
        max_ir_mev_err = max(max_ir_mev_err, e_mev)

        if item["id"] == "nacl-pair|n=1.0":
            ir_nacl_n1 = {
                "app": ir,
                "ref": {k: float(v) for k, v in ref_ir.items()},
                "resEq": res_eq,
            }

    rec.add(
        "8. Incrocio luce IR (§24)",
        f"Incrocio ω₊(k) = (c/n)k su {len(infrared_req)} combinazioni (5 preset × 5 indici n)",
        max(max_ir_omega_err, max_ir_k_err, max_ir_lam_err, max_ir_res) < 1e-13 and max_ir_mev_err < 1e-9,
        max_rel_err=max(max_ir_omega_err, max_ir_k_err, max_ir_lam_err, max_ir_res),
        tolerance=1e-13,
        detail=(
            f"ω={max_ir_omega_err:.2e}, k={max_ir_k_err:.2e}, λ/ratio={max_ir_lam_err:.2e}, "
            f"residuo={max_ir_res:.2e}, meV={max_ir_mev_err:.2e}"
        ),
        extra={"nacl_n1": ir_nacl_n1},
    )

    # =========================================================================
    # TEST 9: Tutti i 16 vertici degli slider (nessun NaN/Inf, ordinamento rami)
    # =========================================================================
    max_corner_w_err = 0.0
    max_corner_dm_err = 0.0
    corner_bad = False
    for c_item in app_out["sliderCorners"]:
        p = c_item["params"]
        a_d, M_d, m_d, C_d = Decimal(str(p["a"])), Decimal(str(p["massHeavyAmu"])), Decimal(str(p["massLightAmu"])), Decimal(str(p["springC"]))
        w0_r = float(ref_diatomic_exact_dec(Decimal(0), a_d, M_d, m_d, C_d)["wPlus"])
        for val in (
            c_item["summary"]["soundSpeedMs"],
            c_item["summary"]["omegaOpticalZeroRadS"],
            c_item["summary"]["omegaGapRadS"],
            c_item["ir"]["wavelengthUm"],
            c_item["ir"]["kOverZoneEdge"],
        ):
            if not math.isfinite(val):
                corner_bad = True
        for s in c_item["samples"]:
            if not (math.isfinite(s["wAc"]) and math.isfinite(s["wOp"]) and math.isfinite(s["vgAc"]) and math.isfinite(s["vgOp"])):
                corner_bad = True
            if s["wAc"] > s["wOp"] + 1e-12 * w0_r:
                corner_bad = True
            re = ref_diatomic_exact_dec(Decimal(repr(s["k"])), a_d, M_d, m_d, C_d)
            w_ac_r, w_op_r = float(re["wMinus"]), float(re["wPlus"])
            max_corner_w_err = max(max_corner_w_err, abs(s["wAc"] - w_ac_r) / w0_r, rel_err(s["wOp"], w_op_r))
            max_corner_dm_err = max(
                max_corner_dm_err,
                abs(s["dm"]["omegasRadS"][0] - w_ac_r) / w0_r,
                rel_err(s["dm"]["omegasRadS"][1], w_op_r),
            )

    rec.add(
        "9. Estremi slider (16 vertici)",
        "Stabilità su tutti i 16 vertici (a∈{3,7}, M∈{6,210}, m∈{6,210}, C∈{2,80})",
        (not corner_bad) and max(max_corner_w_err, max_corner_dm_err) < 1e-13,
        max_rel_err=max(max_corner_w_err, max_corner_dm_err),
        tolerance=1e-13,
        detail=f"badNum/swap={corner_bad}, max err eq20={max_corner_w_err:.2e}, D(k)={max_corner_dm_err:.2e}",
    )

    # =========================================================================
    # Riepilogo e salvataggio JSON
    # =========================================================================
    n_total = len(rec.checks)
    n_pass = sum(1 for c in rec.checks if c["status"] == "PASS")
    n_fail = n_total - n_pass

    report_obj = {
        "totals": {"total": n_total, "pass": n_pass, "fail": n_fail},
        "constantsApp": app_out["constants"],
        "constantsExactSI": {
            "AMU_KG": AMU_KG,
            "C_LIGHT_M_S": C_LIGHT,
            "THZ_TO_MEV_EXACT": float(THZ_TO_MEV_EXACT_D),
            "THZ_TO_MEV_REL_DIFF": rel_err(app_out["constants"]["THZ_TO_MEV"], float(THZ_TO_MEV_EXACT_D)),
        },
        "summaryTable": summary_table,
        "smallKDmTable": small_k_report,
        "irNaClN1": ir_nacl_n1,
        "checks": rec.checks,
    }
    OUT_JSON.write_text(json.dumps(report_obj, indent=2), encoding="utf-8")

    print(f"=== CROSSCHECK NUMERICO SEZIONE 2 (CATENA BIATOMICA) ===")
    print(f"Totale verifiche: {n_total} | PASS: {n_pass} | FAIL: {n_fail}")
    print("-" * 78)
    for c in rec.checks:
        tag = "[PASS]" if c["status"] == "PASS" else "[FAIL]"
        print(f"{tag} {c['group']} :: {c['name']}")
        if c["detail"]:
            print(f"       {c['detail']}")
    print("-" * 78)
    print(f"Risultati completi salvati in: {OUT_JSON}")
    return 0 if n_fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
