#!/usr/bin/env python3
"""
Crosscheck numerico indipendente — Sezione 5 Fononi (`phonon-quantum`):
Modi quantizzati (oscillatore armonico quantistico vs classico), statistica di
Bose–Einstein (μ = 0, formula di Mehler) e processi Normali / Umklapp nella 1BZ.

Fonti di riferimento (sola lettura):
  - materiale/parte6/dispensa.pdf:
    * Lezione 1 §3 (eqq. 8–9, p. 9: metallo tipico M = 1,05·10⁻²⁵ kg, a = 2,5 Å, C = 20 N/m)
    * Lezione 2 §11 (eqq. 29–30, pp. 27–28: E_n = (n+1/2)ħω, Bose–Einstein μ = 0)
    * Lezione 3 §16 (eqq. 40–42, pp. 39–41, Fig. 19: processi Normali vs Umklapp in 1BZ)
    * Lezione 3 §18 (eqq. 46–51, pp. 43–47, Figg. 20–21: oscillatore classico vs quantistico,
      ortonormalità, Δx Δp = ħ/2, tunneling erfc(1), principio di corrispondenza di Bohr,
      stima Δx_zp / a ≈ 1,7%)
  - materiale/parte6/riferimento-formule.md.

Metodologia completamente indipendente da src/renderer/src/physics/:
  1. Aritmetica `Decimal` a 50 cifre con costanti SI 2019 esatte + CODATA 2018.
  2. Autofunzioni ψ_n(u) valutate tramite sviluppo esplicito dei polinomi di Hermite
     (formula di Rodrigues, eq. 49) in `Decimal` a 50 cifre — metodo indipendente dalla
     ricorrenza normalizzata a tre termini di `phononQuantum.ts` — e verifica dell'ODE
     di Schrödinger ψ_n'' + (2n + 1 − u²)ψ_n = 0 tramite differenze finite centrali FD4.
  3. Quadratura composita di Gauss–Legendre ad alta precisione (64 pannelli × 16 nodi =
     1024 nodi su [−16, +16]) applicata direttamente ai campioni reali restituiti da
     `phononQuantum.ts` per verificare:
     - tutte le 351 coppie di ortonormalità ∫ Ψ_m Ψ_n dx = δ_mn per 0 ≤ m ≤ n ≤ 25;
     - ⟨x⟩ = 0 e ⟨x²⟩ = (n + 1/2) a_ho² per tutti gli n = 0 … 25;
     - ⟨p²⟩ = −ħ² ∫ Ψ₀ Ψ₀'' dx e principio di indeterminazione Δx Δp = ħ/2 per n = 0.
  4. Funzione `erfc(x)` indipendente (`math.erfc` + serie/frazione continua in `Decimal`)
     su tutta la semiretta inclusa la giunzione a x = 3,5 e la coda a x = 26,6;
     probabilità di tunneling per n = 0 … 25 integrata indipendentemente SULLE CODE
     2 ∫_{u_cl}^{u_cl+10} |ψ_n(u)|² du (opposta al 1 − 2∫₀^{u_cl} dell'app) e decadimento
     monotono con n.
  5. Convergenza di ⟨P_n(x)⟩ verso P_cl(x) per n = 0, 2, 6, 20, 25 (principio di
     corrispondenza di Bohr): distanza di Kolmogorov–Smirnov sulle CDF F_n(u) vs F_cl(u)
     e media spaziale locale nel bulk |u| ≤ 0,75 u_cl.
  6. Statistica di Bose–Einstein (μ = 0) e identità di Mehler verificata per somma diretta
     ∑_{n=0}^{N_cut} p_n(T) |ψ_n(u)|² su più temperature e frequenze + momenti ∫ u^k P_th(u) du.
  7. Processi N/U in 1BZ (−π/a, π/a]: esempio dispensa 0,7 + 0,6 π/a → −0,7 π/a,
     inversione di v_g(k₃) con FD4 in `Decimal`, tutti i 5 preset, casi limite (±0,5, ±0,95,
     1,0, fuori zona) e scansione su griglia della 1BZ.

Esecuzione (dalla root del repository):
  python crosscheck/fononi/phonon_quantum_crosscheck.py
"""

from __future__ import annotations

import json
import math
import subprocess
import sys
from decimal import Decimal, getcontext
from pathlib import Path
from typing import Any, Callable

getcontext().prec = 50

ROOT = Path(__file__).resolve().parents[2]
NODE_EXE = ROOT / ".tools" / "node" / "node.exe"
OUT_JSON = Path(__file__).resolve().parent / "phonon_quantum_crosscheck_results.json"

# =============================================================================
# 1. COSTANTI FISICHE INDIPENDENTI (SI 2019 esatte + CODATA 2018)
# =============================================================================
H_SI_D = Decimal("6.62607015e-34")            # J·s (esatta SI 2019)
E_SI_D = Decimal("1.602176634e-19")           # C   (esatta SI 2019)
KB_SI_D = Decimal("1.380649e-23")             # J/K (esatta SI 2019)
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
            if abs(add) < Decimal("1e-54"):
                break
            total += add
            k += 1
        return total

    return Decimal(4) * (Decimal(4) * arctan_inv(5) - arctan_inv(239))


PI_D = dec_pi()
TWO_PI_D = Decimal(2) * PI_D
SQRT_PI_D = PI_D.sqrt()
HBAR_SI_D = H_SI_D / TWO_PI_D
KB_EV_K_D = KB_SI_D / E_SI_D
J_TO_EV_D = Decimal(1) / E_SI_D
RAD_S_TO_THZ_D = Decimal(1) / (TWO_PI_D * Decimal("1e12"))
THZ_TO_MEV_D = (H_SI_D * Decimal("1e12")) / (E_SI_D * Decimal("1e-3"))

# Parametri cristallo di riferimento dalla dispensa §3 (p. 9) & §18.4 (p. 47)
METAL_MASS_KG_D = Decimal("1.05e-25")
METAL_MASS_AMU_D = METAL_MASS_KG_D / AMU_KG_D
METAL_A_ANG_D = Decimal("2.5")
METAL_C_NM_D = Decimal("20")
METAL_REF = {
    "a": float(METAL_A_ANG_D),
    "massAmu": float(METAL_MASS_AMU_D),
    "springC": float(METAL_C_NM_D),
}


def dec_exp(x: Decimal) -> Decimal:
    """Esponenziale exp(x) a 50 cifre tramite Decimal.exp."""
    return x.exp()


def dec_sin(x: Decimal) -> Decimal:
    """Seno a 50 cifre."""
    r = x % TWO_PI_D
    if r > PI_D:
        r -= TWO_PI_D
    term = r
    total = term
    r2 = r * r
    n = 1
    while True:
        term = -term * r2 / Decimal((2 * n) * (2 * n + 1))
        if abs(term) < Decimal("1e-54"):
            break
        total += term
        n += 1
    return total


def dec_cos(x: Decimal) -> Decimal:
    """Coseno a 50 cifre."""
    r = x % TWO_PI_D
    if r > PI_D:
        r -= TWO_PI_D
    term = Decimal(1)
    total = term
    r2 = r * r
    n = 1
    while True:
        term = -term * r2 / Decimal((2 * n - 1) * (2 * n))
        if abs(term) < Decimal("1e-54"):
            break
        total += term
        n += 1
    return total


# =============================================================================
# 2. QUADRATURA GAUSS–LEGENDRE A 16 NODI (INDIPENDENTE DA GL24 DELL'APP)
# =============================================================================
# Nodi e pesi GL16 su [-1, 1] calcolati via metodo di Newton sulle radici di P_16(x)
def _compute_gl_nodes_weights(order: int) -> tuple[list[float], list[float]]:
    nodes: list[float] = []
    weights: list[float] = []
    m = (order + 1) // 2
    for i in range(1, m + 1):
        # Stima asintotica iniziale
        z = math.cos(math.pi * (i - 0.25) / (order + 0.5))
        zd = Decimal(repr(z))
        for _ in range(12):
            p1 = Decimal(1)
            p2 = Decimal(0)
            for j in range(1, order + 1):
                p3 = p2
                p2 = p1
                p1 = ((Decimal(2 * j - 1) * zd * p2) - Decimal(j - 1) * p3) / Decimal(j)
            pp = Decimal(order) * (zd * p1 - p2) / (zd * zd - Decimal(1))
            dz = p1 / pp
            zd -= dz
            if abs(dz) < Decimal("1e-45"):
                break
        w = Decimal(2) / ((Decimal(1) - zd * zd) * pp * pp)
        nodes.append(float(-zd))
        weights.append(float(w))
    # Simmetria
    if order % 2 == 1:
        full_x = nodes[:-1] + [0.0] + [-x for x in reversed(nodes[:-1])]
        full_w = weights[:-1] + [weights[-1]] + list(reversed(weights[:-1]))
    else:
        full_x = nodes + [-x for x in reversed(nodes)]
        full_w = weights + list(reversed(weights))
    return full_x, full_w


GL16_X, GL16_W = _compute_gl_nodes_weights(16)


def quad_composite_gl16(fn: Callable[[float], float], a: float, b: float, n_panels: int = 64) -> float:
    """Quadratura composita di Gauss–Legendre (n_panels × 16 nodi) su [a, b]."""
    if b == a:
        return 0.0
    h = (b - a) / n_panels
    total = 0.0
    for p in range(n_panels):
        mid = a + (p + 0.5) * h
        half = 0.5 * h
        sub = 0.0
        for xi, wi in zip(GL16_X, GL16_W):
            sub += wi * fn(mid + half * xi)
        total += half * sub
    return total


def build_composite_gl16_grid(a: float, b: float, n_panels: int = 64) -> tuple[list[float], list[float]]:
    """Restituisce nodi e pesi di quadratura composita GL16 su [a, b]."""
    h = (b - a) / n_panels
    xs: list[float] = []
    ws: list[float] = []
    for p in range(n_panels):
        mid = a + (p + 0.5) * h
        half = 0.5 * h
        for xi, wi in zip(GL16_X, GL16_W):
            xs.append(mid + half * xi)
            ws.append(half * wi)
    return xs, ws


# =============================================================================
# 3. REIMPLEMENTAZIONI INDIPENDENTI DA DISPENSA PARTE 6
# =============================================================================
def ref_hermite_rodrigues_decimal(n: int, u_d: Decimal) -> Decimal:
    """
    Polinomio di Hermite H_n(u) dalla formula esplicita di Rodrigues (eq. 49):
      H_n(u) = n! ∑_{m=0}^{⌊n/2⌋} [(-1)^m / (m!(n-2m)!)] (2u)^{n-2m}
    Valutato con aritmetica `Decimal` a 50 cifre (nessuna ricorrenza a 3 termini).
    """
    n_fact = Decimal(math.factorial(n))
    two_u = Decimal(2) * u_d
    total = Decimal(0)
    for m in range(n // 2 + 1):
        denom = Decimal(math.factorial(m) * math.factorial(n - 2 * m))
        sign = Decimal(-1) if (m % 2 == 1) else Decimal(1)
        exp = n - 2 * m
        pow_term = Decimal(1) if exp == 0 else (two_u ** exp)
        term = sign * (n_fact / denom) * pow_term
        total += term
    return total


def ref_psi_dimless_decimal(n: int, u: float) -> float:
    """Autofunzione adimensionale ψ_n(u) = (2^n n! √π)^{-1/2} H_n(u) e^{-u²/2} (eq. 49)."""
    u_d = Decimal(repr(u))
    half_u2 = Decimal("0.5") * u_d * u_d
    if half_u2 > Decimal("800"):
        return 0.0
    norm = Decimal(1) / ((Decimal(2) ** n) * Decimal(math.factorial(n)) * SQRT_PI_D).sqrt()
    hn = ref_hermite_rodrigues_decimal(n, u_d)
    return float(norm * hn * dec_exp(-half_u2))


def ref_erfc_decimal(x: float) -> float:
    """erfc(x) indipendente a 50 cifre via Taylor per |x| ≤ 4 e frazione continua per x > 4."""
    if math.isnan(x):
        return float("nan")
    if math.isinf(x):
        return 0.0 if x > 0 else 2.0
    if x < 0:
        return 2.0 - ref_erfc_decimal(-x)
    if x == 0.0:
        return 1.0
    if x > 28.0:
        return 0.0
    xd = Decimal(repr(x))
    if x <= 4.5:
        # erf(x) = (2/√π) ∑_{k=0}^∞ (-1)^k x^{2k+1} / (k! (2k+1))
        x2 = xd * xd
        term = xd
        total = term
        k = 1
        while True:
            term = -term * x2 / Decimal(k)
            add = term / Decimal(2 * k + 1)
            total += add
            if abs(add) < Decimal("1e-52"):
                break
            k += 1
        erf_d = (Decimal(2) / SQRT_PI_D) * total
        return float(max(Decimal(0), Decimal(1) - erf_d))
    # Frazione continua di Laplace a 60 termini
    cf = xd
    for k in range(60, 0, -1):
        cf = xd + (Decimal(k) * Decimal("0.5")) / cf
    val = dec_exp(-xd * xd) / (SQRT_PI_D * cf)
    return float(val)


def ref_harmonic_length_ang_d(mass_amu_d: Decimal, omega_d: Decimal) -> Decimal:
    """a_ho = √(ħ / (Mω)) in Å (dispensa §18.2, p. 44)."""
    m_kg = mass_amu_d * AMU_KG_D
    return (HBAR_SI_D / (m_kg * omega_d)).sqrt() / ANGSTROM_M_D


def ref_bose_einstein_d(omega_d: Decimal, temp_k_d: Decimal) -> Decimal:
    """n̄(T) = [exp(ħω / k_B T) - 1]^{-1} (dispensa eq. 30)."""
    if temp_k_d <= 0:
        return Decimal(0)
    x = (HBAR_SI_D * omega_d) / (KB_SI_D * temp_k_d)
    if x > Decimal("5000"):
        return Decimal(0)
    return Decimal(1) / (dec_exp(x) - Decimal(1))


def ref_monatomic_omega_d(k_d: Decimal, params: dict[str, float]) -> Decimal:
    """ω(k) = 2√(C/M)|sin(ka/2)| (dispensa eq. 8), con k in Å⁻¹ e a in Å."""
    a_ang = Decimal(repr(params["a"]))
    m_kg = Decimal(repr(params["massAmu"])) * AMU_KG_D
    c_nm = Decimal(repr(params["springC"]))
    w0 = (c_nm / m_kg).sqrt()
    return Decimal(2) * w0 * abs(dec_sin(Decimal("0.5") * k_d * a_ang))


def ref_monatomic_vg_fd4(k_val: float, params: dict[str, float]) -> float:
    """v_g = dω/dk calcolata con differenze finite centrate al 4° ordine in `Decimal`."""
    edge = math.pi / params["a"]
    if abs(k_val) < 1e-13:
        return 0.0
    # Se siamo molto vicini a k = 0 o ai punti di piega 2mπ/a, riduciamo il passo h
    h = Decimal("1e-7")
    k_d = Decimal(repr(k_val))
    # Evita attraversamento di 2mπ/a
    period = TWO_PI_D / Decimal(repr(params["a"]))
    rem = abs(k_d % period)
    dist_cusp = min(rem, period - rem)
    if dist_cusp < Decimal("1e-5"):
        h = dist_cusp / Decimal(10)
    f_m2 = ref_monatomic_omega_d(k_d - Decimal(2) * h, params)
    f_m1 = ref_monatomic_omega_d(k_d - h, params)
    f_p1 = ref_monatomic_omega_d(k_d + h, params)
    f_p2 = ref_monatomic_omega_d(k_d + Decimal(2) * h, params)
    domega_dk_ang = (f_m2 - Decimal(8) * f_m1 + Decimal(8) * f_p1 - f_p2) / (Decimal(12) * h)
    # 1 Å/s = 1e-10 m/s
    return float(domega_dk_ang * ANGSTROM_M_D)


def ref_fold_1bz_d(k_frac_d: Decimal) -> Decimal:
    """Riporta k/(π/a) nella 1BZ (−1, +1] in aritmetica Decimal esatta."""
    two = Decimal(2)
    r = k_frac_d
    while r > Decimal(1):
        r -= two
    while r <= Decimal(-1):
        r += two
    return r


def ref_analyze_1bz_collision(k1_frac: float, k2_frac: float, params: dict[str, float]) -> dict[str, Any]:
    """Analisi indipendente di k₁ + k₂ = k₃ − G in (−π/a, π/a] (dispensa §16.2, eq. 40)."""
    f1 = ref_fold_1bz_d(Decimal(repr(k1_frac)))
    f2 = ref_fold_1bz_d(Decimal(repr(k2_frac)))
    f_sum = f1 + f2
    if f_sum > Decimal(1):
        m_g = -1
    elif f_sum <= Decimal(-1):
        m_g = 1
    else:
        m_g = 0
    f3 = f_sum + Decimal(2 * m_g)

    a_d = Decimal(repr(params["a"]))
    edge_d = PI_D / a_d
    rec_g_d = TWO_PI_D / a_d

    k1_d = f1 * edge_d
    k2_d = f2 * edge_d
    k3_d = f3 * edge_d

    w1_d = ref_monatomic_omega_d(k1_d, params)
    w2_d = ref_monatomic_omega_d(k2_d, params)
    w3_d = ref_monatomic_omega_d(k3_d, params)

    vg1 = ref_monatomic_vg_fd4(float(k1_d), params)
    vg2 = ref_monatomic_vg_fd4(float(k2_d), params)
    vg3 = ref_monatomic_vg_fd4(float(k3_d), params)

    return {
        "k1Frac": float(f1),
        "k2Frac": float(f2),
        "kSumFrac": float(f_sum),
        "mG": m_g,
        "gFrac": 2 * m_g,
        "k3Frac": float(f3),
        "k1": float(k1_d),
        "k2": float(k2_d),
        "k3": float(k3_d),
        "g": float(Decimal(m_g) * rec_g_d),
        "kind": "normal" if m_g == 0 else "umklapp",
        "omega1RadS": float(w1_d),
        "omega2RadS": float(w2_d),
        "omega3RadS": float(w3_d),
        "freq1Thz": float(w1_d * RAD_S_TO_THZ_D),
        "freq2Thz": float(w2_d * RAD_S_TO_THZ_D),
        "freq3Thz": float(w3_d * RAD_S_TO_THZ_D),
        "energy1Mev": float(w1_d * RAD_S_TO_THZ_D * THZ_TO_MEV_D),
        "energy2Mev": float(w2_d * RAD_S_TO_THZ_D * THZ_TO_MEV_D),
        "energy3Mev": float(w3_d * RAD_S_TO_THZ_D * THZ_TO_MEV_D),
        "vg1Ms": vg1,
        "vg2Ms": vg2,
        "vg3Ms": vg3,
        "sameInputDirection": (vg1 * vg2) > 1e-6,
        "flowReversed": (m_g != 0) and ((vg1 * vg2) > 1e-6) and ((vg1 * vg3) < -1e-6),
    }


# =============================================================================
# 4. RUNNER NODE PER ESEGUIRE LE FUNZIONI REALI DI phononQuantum.ts
# =============================================================================
NODE_RUNNER_SCRIPT = r"""
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (err) {
      if (specifier.startsWith('.') && !specifier.endsWith('.ts') && context.parentURL) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw err;
    }
  }
});

const qm = await import('./src/renderer/src/physics/phononQuantum.ts');
const disp = await import('./src/renderer/src/physics/phononDispersion.ts');
const cnst = await import('./src/renderer/src/physics/constants.ts');

const payload = JSON.parse(readFileSync(0, 'utf8'));
const out = {
  constants: { ...cnst, TYPICAL_METAL_MASS_AMU: qm.TYPICAL_METAL_MASS_AMU },
  results: {}
};

for (const job of payload.jobs) {
  if (job.type === 'erfc_batch') {
    out.results[job.id] = job.xs.map((x) => ({ x, val: qm.erfc(x) }));
  } else if (job.type === 'psi_dimless_matrix') {
    // valuta ψ_n(u) su tutti gli n ∈ ns e tutti gli u ∈ us
    out.results[job.id] = job.ns.map((n) =>
      job.us.map((u) => qm.harmonicEigenfunctionDimless(n, u))
    );
  } else if (job.type === 'psi_phys_grid') {
    const aHo = qm.harmonicLengthAng(job.massAmu, job.omegaRadS);
    out.results[job.id] = {
      aHoAng: aHo,
      zpRmsAng: qm.zeroPointRmsAng(job.massAmu, job.omegaRadS),
      psi0: job.xs.map((x) => qm.harmonicEigenfunction(0, x, aHo)),
      prob0: job.xs.map((x) => qm.quantumProbabilityDensity(0, x, aHo)),
      psiN: job.nExtra != null ? job.xs.map((x) => qm.harmonicEigenfunction(job.nExtra, x, aHo)) : null,
      probN: job.nExtra != null ? job.xs.map((x) => qm.quantumProbabilityDensity(job.nExtra, x, aHo)) : null,
    };
  } else if (job.type === 'tunneling_all') {
    out.results[job.id] = job.ns.map((n) => ({
      n,
      uCl: qm.classicalTurningPointDimless(n),
      tunneling: qm.quantumTunnelingFraction(n),
    }));
  } else if (job.type === 'mode_summaries') {
    out.results[job.id] = job.cases.map((c) => {
      const omega = c.omegaRadS ?? qm.freqThzToOmegaRadS(c.freqThz);
      const params = { massAmu: c.massAmu, omegaRadS: omega, latticeA: c.latticeA };
      const sum = qm.quantumModeSummary(params, c.n);
      const lvl = qm.quantumEnergyLevel(c.n, omega);
      const xCl = qm.classicalTurningPointAng(c.n, sum.aHoAng);
      return { omegaRadS: omega, summary: sum, level: lvl, xClAngDirect: xCl };
    });
  } else if (job.type === 'oscillator_curves') {
    out.results[job.id] = job.cases.map((c) => {
      const res = qm.oscillatorCurvesDimless(c.n, c.uMax, c.nPoints);
      return {
        n: c.n,
        uMax: c.uMax,
        u: Array.from(res.u),
        psiN: Array.from(res.psiN),
        probQuantum: Array.from(res.probQuantum),
        probClassical: Array.from(res.probClassical),
      };
    });
  } else if (job.type === 'classical_density_grid') {
    out.results[job.id] = {
      dimless: job.us.map((u) => qm.classicalProbabilityDensityDimless(job.uCl, u)),
      phys: job.xs.map((x) => qm.classicalProbabilityDensity(job.xCl, x)),
    };
  } else if (job.type === 'bose_einstein_batch') {
    out.results[job.id] = job.cases.map((c) => {
      const omega = c.omegaRadS ?? qm.freqThzToOmegaRadS(c.freqThz);
      const nBar = qm.boseEinsteinOccupation(omega, c.temperatureK);
      const probs = Array.from(qm.boseEinsteinLevelProbabilities(omega, c.temperatureK, c.maxN));
      const summary = qm.thermalOscillatorSummary(
        { massAmu: c.massAmu, omegaRadS: omega, latticeA: c.latticeA },
        c.temperatureK
      );
      const thermalDensity = c.us
        ? c.us.map((u) => qm.thermalProbabilityDensityDimless(omega, c.temperatureK, u))
        : null;
      return { omegaRadS: omega, nBar, probs, summary, thermalDensity };
    });
  } else if (job.type === 'umklapp_batch') {
    out.results[job.id] = job.cases.map((c) =>
      qm.analyze1BZCollision(c.k1Frac, c.k2Frac, c.params)
    );
  } else if (job.type === 'monatomic_ref') {
    out.results[job.id] = disp.monatomicSummary(job.params);
  }
}

process.stdout.write(JSON.stringify(out));
"""


def run_node_jobs(jobs: list[dict[str, Any]]) -> dict[str, Any]:
    proc = subprocess.run(
        [str(NODE_EXE), "--input-type=module", "-e", NODE_RUNNER_SCRIPT],
        cwd=str(ROOT),
        input=json.dumps({"jobs": jobs}),
        text=True,
        capture_output=True,
        encoding="utf-8",
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(
            f"Node runner failed ({proc.returncode}):\nSTDOUT:{proc.stdout}\nSTDERR:{proc.stderr}"
        )
    return json.loads(proc.stdout)


def rel_err(a: float, b: float, scale: float = 0.0) -> float:
    denom = max(abs(b), scale, 1e-300)
    return abs(a - b) / denom


# =============================================================================
# 5. ESECUZIONE VERIFICHE E CONFRONTO PUNTO PER PUNTO
# =============================================================================
def main() -> int:
    if not NODE_EXE.exists():
        print(f"ERROR: Node executable not found at {NODE_EXE}", file=sys.stderr)
        return 2

    checks: list[dict[str, Any]] = []

    def record(
        name: str,
        category: str,
        passed: bool,
        max_err: float,
        threshold: float,
        details: dict[str, Any],
    ) -> None:
        checks.append({
            "name": name,
            "category": category,
            "passed": bool(passed),
            "max_err": float(max_err) if math.isfinite(max_err) else str(max_err),
            "threshold": float(threshold),
            "details": details,
        })

    # -------------------------------------------------------------------------
    # Preparazione griglie di quadratura e parametri
    # -------------------------------------------------------------------------
    # Griglia composita GL16 su [-16, +16] (64 pannelli = 1024 nodi) per ψ_n(u)
    gl_u_nodes, gl_u_weights = build_composite_gl16_grid(-16.0, 16.0, n_panels=64)
    ns_0_25 = list(range(26))

    # Griglia fisica x in Å per n = 0 e n = 20 con metallo tipico a ν = 4.4 THz
    omega_44_d = TWO_PI_D * Decimal("4.4e12")
    a_ho_44_d = ref_harmonic_length_ang_d(METAL_MASS_AMU_D, omega_44_d)
    a_ho_44 = float(a_ho_44_d)
    x_span = 16.0 * a_ho_44
    gl_x_nodes, gl_x_weights = build_composite_gl16_grid(-x_span, x_span, n_panels=64)

    # Griglia per Mehler: [-12, +12] (48 pannelli = 768 nodi) + punti puntuali [-8, +8]
    u_mehler_pts = [-8.0 + 0.5 * i for i in range(33)]
    gl_th_nodes, gl_th_weights = build_composite_gl16_grid(-20.0, 20.0, n_panels=64)

    # Griglia per CDF / corrispondenza di Bohr su [-u_max, +u_max] con passi fittissimi
    # Useremo oscillatorCurvesDimless su n = 0, 2, 6, 20, 25 con nPoints = 2001

    # Griglia erfc(x)
    erfc_xs = [
        -10.0, -3.5, -1.0, -0.25, 0.0, 0.25, 0.5, 1.0, 1.5, 2.0,
        3.49, 3.5, 3.51, 5.0, 10.0, 15.0, 20.0, 26.5, 26.6, 26.7, 30.0,
    ]

    # Casi quantumModeSummary: dispensa + preset + estremi slider (ν ∈ [1.0, 12.0], n ∈ [0, 25])
    omega_disp_exact_max = float(Decimal(2) * (METAL_C_NM_D / METAL_MASS_KG_D).sqrt())
    mode_cases = [
        {"id": "dispensa_exact_omega_max", "massAmu": float(METAL_MASS_AMU_D), "omegaRadS": omega_disp_exact_max, "latticeA": 2.5, "n": 0},
        {"id": "dispensa_rounded_28e13", "massAmu": float(METAL_MASS_AMU_D), "omegaRadS": 2.8e13, "latticeA": 2.5, "n": 0},
        {"id": "preset_ground_44thz", "massAmu": float(METAL_MASS_AMU_D), "freqThz": 4.4, "latticeA": 2.5, "n": 0},
        {"id": "preset_excited_2", "massAmu": float(METAL_MASS_AMU_D), "freqThz": 4.4, "latticeA": 2.5, "n": 2},
        {"id": "preset_bohr_20", "massAmu": float(METAL_MASS_AMU_D), "freqThz": 4.4, "latticeA": 2.5, "n": 20},
        {"id": "slider_min_nu_n0", "massAmu": float(METAL_MASS_AMU_D), "freqThz": 1.0, "latticeA": 2.5, "n": 0},
        {"id": "slider_max_nu_n25", "massAmu": float(METAL_MASS_AMU_D), "freqThz": 12.0, "latticeA": 2.5, "n": 25},
        {"id": "slider_min_nu_n25", "massAmu": float(METAL_MASS_AMU_D), "freqThz": 1.0, "latticeA": 2.5, "n": 25},
        {"id": "no_latticeA", "massAmu": float(METAL_MASS_AMU_D), "freqThz": 4.4, "n": 1},
    ]

    # Casi Bose–Einstein + Mehler
    bose_cases = [
        {"id": "preset_thermal_300", "massAmu": float(METAL_MASS_AMU_D), "freqThz": 4.4, "latticeA": 2.5, "temperatureK": 300.0, "maxN": 400, "us": u_mehler_pts},
        {"id": "preset_thermal_30", "massAmu": float(METAL_MASS_AMU_D), "freqThz": 4.4, "latticeA": 2.5, "temperatureK": 30.0, "maxN": 400, "us": u_mehler_pts},
        {"id": "slider_T10_nu44", "massAmu": float(METAL_MASS_AMU_D), "freqThz": 4.4, "latticeA": 2.5, "temperatureK": 10.0, "maxN": 400, "us": u_mehler_pts},
        {"id": "slider_T1000_nu44", "massAmu": float(METAL_MASS_AMU_D), "freqThz": 4.4, "latticeA": 2.5, "temperatureK": 1000.0, "maxN": 400, "us": u_mehler_pts},
        {"id": "slider_T1000_nu10", "massAmu": float(METAL_MASS_AMU_D), "freqThz": 1.0, "latticeA": 2.5, "temperatureK": 1000.0, "maxN": 1200, "us": u_mehler_pts},
        {"id": "slider_T10_nu120", "massAmu": float(METAL_MASS_AMU_D), "freqThz": 12.0, "latticeA": 2.5, "temperatureK": 10.0, "maxN": 200, "us": u_mehler_pts},
        {"id": "ui_maxBars18_T300_nu44", "massAmu": float(METAL_MASS_AMU_D), "freqThz": 4.4, "latticeA": 2.5, "temperatureK": 300.0, "maxN": 18, "us": None},
        {"id": "ui_maxBars18_T1000_nu10", "massAmu": float(METAL_MASS_AMU_D), "freqThz": 1.0, "latticeA": 2.5, "temperatureK": 1000.0, "maxN": 18, "us": None},
        {"id": "zero_T", "massAmu": float(METAL_MASS_AMU_D), "freqThz": 4.4, "latticeA": 2.5, "temperatureK": 0.0, "maxN": 20, "us": u_mehler_pts},
        {"id": "extreme_cold_overflow_guard", "massAmu": float(METAL_MASS_AMU_D), "freqThz": 12.0, "latticeA": 2.5, "temperatureK": 0.5, "maxN": 20, "us": None},
    ]

    # Casi Umklapp / Normali
    umklapp_pairs: list[tuple[str, float, float]] = [
        ("dispensa_umklapp", 0.7, 0.6),
        ("preset_normal", 0.3, 0.4),
        ("preset_umklapp_neg", -0.7, -0.6),
        ("preset_opposite", 0.6, -0.4),
        ("preset_zone_edge_pos", 0.5, 0.5),
        ("edge_zone_edge_neg", -0.5, -0.5),
        ("edge_min_sliders", -0.95, -0.95),
        ("edge_max_sliders", 1.0, 1.0),
        ("edge_mixed_bounds", -0.95, 1.0),
        ("edge_one_zero_pos", 1.0, 0.0),
        ("edge_cancel_half", -0.5, 0.5),
        ("edge_zero_zero", 0.0, 0.0),
        ("threshold_pos_above", 0.5, 0.5001),
        ("threshold_neg_inside", -0.5, -0.4999),
        ("threshold_neg_below", -0.5, -0.5001),
        ("large_umklapp_pos", 0.9, 0.9),
        ("large_umklapp_neg", -0.9, -0.9),
        ("outside_1bz_pos", 1.3, 0.2),
        ("outside_1bz_neg", -1.3, -0.2),
        ("asymmetric_normal", 0.8, -0.2),
    ]
    # Aggiungi griglia completa 11×11 di valori nella 1BZ per test di proprietà
    grid_vals = [-0.95, -0.75, -0.5, -0.25, -0.05, 0.0, 0.05, 0.25, 0.5, 0.75, 1.0]
    umklapp_grid_cases = [
        {"k1Frac": k1, "k2Frac": k2, "params": METAL_REF}
        for k1 in grid_vals
        for k2 in grid_vals
    ]

    # Punti per verifica PDE/ODE ψ_n'' + (2n + 1 − u²)ψ_n = 0 tramite FD4
    h_ode = 1e-4
    ode_u_centers = [-3.2, -1.5, -0.4, 0.0, 0.7, 2.1, 4.5]
    ode_u_all: list[float] = []
    for uc in ode_u_centers:
        ode_u_all.extend([uc - 2 * h_ode, uc - h_ode, uc, uc + h_ode, uc + 2 * h_ode])

    # Punti per Δp a n = 0 tramite FD4 su Ψ₀(x) fisica
    h_x_fd = 1e-5 * a_ho_44
    # Per ogni nodo di quadratura gl_x_nodes, valutiamo anche i vicini ±h, ±2h
    # Più snello: costruiamo 1 solo array piatto con (x-2h, x-h, x, x+h, x+2h) su 24 pannelli × 16 nodi
    gl_x_dp_nodes, gl_x_dp_weights = build_composite_gl16_grid(-10.0 * a_ho_44, 10.0 * a_ho_44, n_panels=24)
    dp_xs_all: list[float] = []
    for xv in gl_x_dp_nodes:
        dp_xs_all.extend([xv - 2 * h_x_fd, xv - h_x_fd, xv, xv + h_x_fd, xv + 2 * h_x_fd])

    # Griglia per Mehler: per ciascun u in u_mehler_pts calcoliamo ψ_n(u) per n=0..400 (o 1200)
    # Riusiamo psi_dimless_matrix per n=0..400 su u_mehler_pts!
    ns_0_400 = list(range(401))

    # Classical density test grid
    u_cl_test = math.sqrt(2 * 6 + 1)
    cl_us = [-5.0, -u_cl_test, -u_cl_test + 1e-3, -2.0, -0.5, 0.0, 1.2, u_cl_test - 1e-3, u_cl_test, 5.0]
    x_cl_test = a_ho_44 * u_cl_test
    cl_xs = [u * a_ho_44 for u in cl_us]

    # Curve Bohr correspondence
    bohr_ns = [0, 2, 6, 20, 25]
    bohr_cases = [
        {"n": n, "uMax": math.sqrt(2 * n + 1) + 4.0, "nPoints": 2401}
        for n in bohr_ns
    ]

    jobs: list[dict[str, Any]] = [
        {"type": "monatomic_ref", "id": "metal_mono", "params": METAL_REF},
        {"type": "erfc_batch", "id": "erfc", "xs": erfc_xs},
        {"type": "psi_dimless_matrix", "id": "psi_gl_0_25", "ns": ns_0_25, "us": gl_u_nodes},
        {"type": "psi_dimless_matrix", "id": "psi_ode_0_25", "ns": ns_0_25, "us": ode_u_all},
        {"type": "psi_dimless_matrix", "id": "psi_mehler_0_400", "ns": ns_0_400, "us": u_mehler_pts},
        {"type": "psi_phys_grid", "id": "psi_phys_gl", "massAmu": float(METAL_MASS_AMU_D), "omegaRadS": float(omega_44_d), "xs": gl_x_nodes, "nExtra": 20},
        {"type": "psi_phys_grid", "id": "psi_phys_dp", "massAmu": float(METAL_MASS_AMU_D), "omegaRadS": float(omega_44_d), "xs": dp_xs_all, "nExtra": None},
        {"type": "tunneling_all", "id": "tunneling", "ns": ns_0_25},
        {"type": "mode_summaries", "id": "mode_summaries", "cases": mode_cases},
        {"type": "oscillator_curves", "id": "bohr_curves", "cases": bohr_cases},
        {"type": "classical_density_grid", "id": "cl_density", "uCl": u_cl_test, "xCl": x_cl_test, "us": cl_us, "xs": cl_xs},
        {"type": "bose_einstein_batch", "id": "bose", "cases": bose_cases},
        {"type": "bose_einstein_batch", "id": "thermal_gl_moments", "cases": [
            {"id": "T300_nu44", "massAmu": float(METAL_MASS_AMU_D), "freqThz": 4.4, "latticeA": 2.5, "temperatureK": 300.0, "maxN": 1, "us": gl_th_nodes},
            {"id": "T30_nu44", "massAmu": float(METAL_MASS_AMU_D), "freqThz": 4.4, "latticeA": 2.5, "temperatureK": 30.0, "maxN": 1, "us": gl_th_nodes},
            {"id": "T1000_nu44", "massAmu": float(METAL_MASS_AMU_D), "freqThz": 4.4, "latticeA": 2.5, "temperatureK": 1000.0, "maxN": 1, "us": gl_th_nodes},
        ]},
        {"type": "umklapp_batch", "id": "umklapp_cases", "cases": [
            {"k1Frac": k1, "k2Frac": k2, "params": METAL_REF} for _, k1, k2 in umklapp_pairs
        ]},
        {"type": "umklapp_batch", "id": "umklapp_grid", "cases": umklapp_grid_cases},
    ]

    node_out = run_node_jobs(jobs)
    app_const = node_out["constants"]
    res = node_out["results"]

    # =========================================================================
    # VERIFICA A: Costanti fisiche e metallo tipico della dispensa (§3 e §18.4)
    # =========================================================================
    const_pairs = [
        ("HBAR_J_S", app_const["HBAR_J_S"], float(HBAR_SI_D)),
        ("KB_J_K", app_const["KB_J_K"], float(KB_SI_D)),
        ("KB_EV_K", app_const["KB_EV_K"], float(KB_EV_K_D)),
        ("AMU_KG", app_const["AMU_KG"], float(AMU_KG_D)),
        ("THZ_TO_MEV", app_const["THZ_TO_MEV"], float(THZ_TO_MEV_D)),
        ("RAD_S_TO_THZ", app_const["RAD_S_TO_THZ"], float(RAD_S_TO_THZ_D)),
        ("TYPICAL_METAL_MASS_AMU", app_const["TYPICAL_METAL_MASS_AMU"], float(METAL_MASS_AMU_D)),
    ]
    max_const_err = max(rel_err(a, b) for _, a, b in const_pairs)
    record(
        "Costanti fisiche SI 2019 / CODATA 2018 e TYPICAL_METAL_MASS_AMU",
        "costanti",
        max_const_err < 1e-9,
        max_const_err,
        1e-9,
        {k: {"app": a, "ref": b, "rel_err": rel_err(a, b)} for k, a, b in const_pairs},
    )

    # Verifica numeri dispensa §3 (p. 9) & §18.4 (p. 47)
    metal_mono = res["metal_mono"]
    # Calcolo esatto Decimal per dispensa §18.4 (con ω = ω_max esatto e con ω = 2.8e13)
    w_max_exact_d = Decimal(2) * (METAL_C_NM_D / METAL_MASS_KG_D).sqrt()
    a_ho_exact_d = ref_harmonic_length_ang_d(METAL_MASS_AMU_D, w_max_exact_d)
    dx_zp_exact_d = a_ho_exact_d / Decimal(2).sqrt()
    ratio_exact_d = dx_zp_exact_d / METAL_A_ANG_D

    w_disp_28_d = Decimal("2.8e13")
    a_ho_28_d = ref_harmonic_length_ang_d(METAL_MASS_AMU_D, w_disp_28_d)
    dx_zp_28_d = a_ho_28_d / Decimal(2).sqrt()
    ratio_28_d = dx_zp_28_d / METAL_A_ANG_D

    # Confronta tutti i mode_summaries contro Decimal 50 cifre
    max_mode_err = 0.0
    mode_details: dict[str, Any] = {}
    for c, app_m in zip(mode_cases, res["mode_summaries"]):
        cid = c["id"]
        n = c["n"]
        m_amu_d = Decimal(repr(c["massAmu"]))
        if "omegaRadS" in c:
            w_d = Decimal(repr(c["omegaRadS"]))
        else:
            w_d = TWO_PI_D * Decimal(repr(c["freqThz"])) * Decimal("1e12")

        a_ho_d = ref_harmonic_length_ang_d(m_amu_d, w_d)
        dx_zp_d = a_ho_d / Decimal(2).sqrt()
        dx_rms_d = a_ho_d * (Decimal(n) + Decimal("0.5")).sqrt()
        u_cl_d = Decimal(2 * n + 1).sqrt()
        x_cl_d = a_ho_d * u_cl_d
        e_j_d = (Decimal(n) + Decimal("0.5")) * HBAR_SI_D * w_d
        e_ev_d = e_j_d * J_TO_EV_D
        e_mev_d = e_ev_d * Decimal(1000)
        hbar_w_mev_d = HBAR_SI_D * w_d * J_TO_EV_D * Decimal(1000)
        freq_thz_d = w_d * RAD_S_TO_THZ_D

        s = app_m["summary"]
        lv = app_m["level"]
        errs = [
            rel_err(s["aHoAng"], float(a_ho_d)),
            rel_err(s["deltaXzpAng"], float(dx_zp_d)),
            rel_err(s["deltaXRmsAng"], float(dx_rms_d)),
            rel_err(s["uCl"], float(u_cl_d)),
            rel_err(s["xClAng"], float(x_cl_d)),
            rel_err(app_m["xClAngDirect"], float(x_cl_d)),
            rel_err(s["freqThz"], float(freq_thz_d)),
            rel_err(s["hbarOmegaMev"], float(hbar_w_mev_d)),
            rel_err(s["energyMev"], float(e_mev_d)),
            rel_err(lv["energyJ"], float(e_j_d)),
            rel_err(lv["energyEv"], float(e_ev_d)),
            rel_err(lv["energyMev"], float(e_mev_d)),
            rel_err(s["unitsHbarOmega"], n + 0.5),
        ]
        if "latticeA" in c:
            lat_d = Decimal(repr(c["latticeA"]))
            errs.append(rel_err(s["zpOverLattice"], float(dx_zp_d / lat_d)))
            errs.append(rel_err(s["rmsOverLattice"], float(dx_rms_d / lat_d)))
        else:
            assert s["zpOverLattice"] is None and s["rmsOverLattice"] is None
        ce = max(errs)
        max_mode_err = max(max_mode_err, ce)
        mode_details[cid] = {
            "aHoAng": s["aHoAng"],
            "deltaXzpAng": s["deltaXzpAng"],
            "zpOverLattice_pct": None if s["zpOverLattice"] is None else 100.0 * s["zpOverLattice"],
            "max_rel_err": ce,
        }

    # Verifica esplicita arrotondamenti dispensa §18.4: a_ho ≈ 0.060 Å, Δx_zp ≈ 0.042 Å, Δx_zp/a ≈ 1.7%
    dispensa_28_s = res["mode_summaries"][1]["summary"]
    dispensa_184_ok = (
        abs(dispensa_28_s["aHoAng"] - 0.060) < 5e-4
        and abs(dispensa_28_s["deltaXzpAng"] - 0.0425) < 6e-4
        and abs(dispensa_28_s["zpOverLattice"] * 100.0 - 1.7) < 0.05
    )
    record(
        "Scale oscillatore, livelli E_n e esempio dispensa §18.4 (a_ho ≈ 0,060 Å, Δx_zp/a ≈ 1,7%)",
        "scale_oscillatore",
        (max_mode_err < 1e-9) and dispensa_184_ok,
        max_mode_err,
        1e-9,
        {
            "dispensa_omega_max_exact": {
                "omega_max": float(w_max_exact_d),
                "freq_max_thz": metal_mono["freqMaxThz"],
                "aHoAng": float(a_ho_exact_d),
                "deltaXzpAng": float(dx_zp_exact_d),
                "zpOverLattice_pct": float(ratio_exact_d * 100),
            },
            "dispensa_omega_28e13": {
                "aHoAng_ref": float(a_ho_28_d),
                "deltaXzpAng_ref": float(dx_zp_28_d),
                "zpOverLattice_pct_ref": float(ratio_28_d * 100),
            },
            "cases": mode_details,
        },
    )

    # =========================================================================
    # VERIFICA B: Autofunzioni ψ_n(u) vs formula di Rodrigues + ODE di Schrödinger
    # =========================================================================
    psi_gl_matrix = res["psi_gl_0_25"]  # [n][u_idx]
    # Confronto puntuale su campione di nodi (tutti i 26 livelli × 64 nodi spaziati)
    sample_indices = list(range(0, len(gl_u_nodes), 16))  # 64 punti distribuiti su [-16, 16]
    max_psi_pt_err = 0.0
    worst_psi_pt: dict[str, Any] = {}
    for n in ns_0_25:
        for idx in sample_indices:
            u = gl_u_nodes[idx]
            app_val = psi_gl_matrix[n][idx]
            ref_val = ref_psi_dimless_decimal(n, u)
            err = abs(app_val - ref_val)
            if err > max_psi_pt_err:
                max_psi_pt_err = err
                worst_psi_pt = {"n": n, "u": u, "app": app_val, "ref": ref_val}

    record(
        "Autofunzioni ψ_n(u) (n=0..25): ricorrenza app vs Rodrigues esplicita `Decimal`",
        "autofunzioni",
        max_psi_pt_err < 1e-13,
        max_psi_pt_err,
        1e-13,
        {"n_levels": 26, "u_points_per_level": len(sample_indices), "worst": worst_psi_pt},
    )

    # Verifica equazione di Schrödinger adimensionale ψ_n''(u) + (2n + 1 - u²)ψ_n(u) = 0 con FD4
    psi_ode_matrix = res["psi_ode_0_25"]
    max_ode_res = 0.0
    worst_ode: dict[str, Any] = {}
    for n in ns_0_25:
        row = psi_ode_matrix[n]
        for j, uc in enumerate(ode_u_centers):
            base = 5 * j
            f_m2, f_m1, f_0, f_p1, f_p2 = row[base : base + 5]
            d2 = (-f_m2 + 16.0 * f_m1 - 30.0 * f_0 + 16.0 * f_p1 - f_p2) / (12.0 * h_ode * h_ode)
            res_ode = abs(d2 + (2 * n + 1 - uc * uc) * f_0)
            # Normalizza rispetto a (2n+1)
            rel_ode = res_ode / (2 * n + 1)
            if rel_ode > max_ode_res:
                max_ode_res = rel_ode
                worst_ode = {"n": n, "u": uc, "abs_residual": res_ode, "rel_residual": rel_ode}

    record(
        "Equazione di Schrödinger ψ_n'' + (2n + 1 − u²)ψ_n = 0 tramite FD4 (n=0..25)",
        "autofunzioni",
        max_ode_res < 1e-7,
        max_ode_res,
        1e-7,
        {"n_levels": 26, "u_centers": ode_u_centers, "worst": worst_ode},
    )

    # =========================================================================
    # VERIFICA C: Ortonormalità ∫ Ψ_m Ψ_n dx = δ_mn (tutte le 351 coppie n ≤ 25)
    #             e valori di aspettazione ⟨x⟩ = 0, ⟨x²⟩ = (n + 1/2) a_ho²
    # =========================================================================
    max_norm_err = 0.0
    max_ortho_err = 0.0
    max_mean_u_err = 0.0
    max_u2_err = 0.0
    worst_ortho: dict[str, Any] = {}
    worst_u2: dict[str, Any] = {}

    for m in ns_0_25:
        row_m = psi_gl_matrix[m]
        # ⟨u⟩ e ⟨u²⟩
        mean_u = sum(w * u * vm * vm for u, w, vm in zip(gl_u_nodes, gl_u_weights, row_m))
        mean_u2 = sum(w * u * u * vm * vm for u, w, vm in zip(gl_u_nodes, gl_u_weights, row_m))
        err_mu = abs(mean_u)
        err_u2 = rel_err(mean_u2, m + 0.5)
        max_mean_u_err = max(max_mean_u_err, err_mu)
        if err_u2 > max_u2_err:
            max_u2_err = err_u2
            worst_u2 = {"n": m, "num_u2": mean_u2, "expected": m + 0.5, "rel_err": err_u2}

        for n in range(m, 26):
            row_n = psi_gl_matrix[n]
            integral = sum(w * vm * vn for w, vm, vn in zip(gl_u_weights, row_m, row_n))
            if m == n:
                err = abs(integral - 1.0)
                max_norm_err = max(max_norm_err, err)
            else:
                err = abs(integral)
                if err > max_ortho_err:
                    max_ortho_err = err
                    worst_ortho = {"m": m, "n": n, "integral": integral}

    max_all_ortho = max(max_norm_err, max_ortho_err)
    record(
        "Ortonormalità ∫ ψ_m(u) ψ_n(u) du = δ_mn su tutte le 351 coppie (0 ≤ m ≤ n ≤ 25)",
        "ortonormalita",
        max_all_ortho < 1e-12,
        max_all_ortho,
        1e-12,
        {
            "pairs_tested": 351,
            "max_norm_err_diagonal": max_norm_err,
            "max_ortho_err_offdiag": max_ortho_err,
            "worst_offdiag": worst_ortho,
        },
    )

    record(
        "Valori di aspettazione ⟨x⟩ = 0 e ⟨x²⟩ = (n + 1/2) a_ho² (n=0..25)",
        "aspettazione",
        max(max_mean_u_err, max_u2_err) < 1e-12,
        max(max_mean_u_err, max_u2_err),
        1e-12,
        {
            "max_abs_mean_u": max_mean_u_err,
            "max_rel_err_u2": max_u2_err,
            "worst_u2": worst_u2,
        },
    )

    # Verifica fisica in coordinate x (Å) per n = 0 e n = 20 con `harmonicEigenfunction`
    phys_gl = res["psi_phys_gl"]
    a_ho_app = phys_gl["aHoAng"]
    norm_phys_0 = sum(w * p for w, p in zip(gl_x_weights, phys_gl["prob0"]))
    norm_phys_20 = sum(w * p for w, p in zip(gl_x_weights, phys_gl["probN"]))
    ortho_phys_0_20 = sum(w * a * b for w, a, b in zip(gl_x_weights, phys_gl["psi0"], phys_gl["psiN"]))
    x2_phys_0 = sum(w * x * x * p for x, w, p in zip(gl_x_nodes, gl_x_weights, phys_gl["prob0"]))
    x2_phys_20 = sum(w * x * x * p for x, w, p in zip(gl_x_nodes, gl_x_weights, phys_gl["probN"]))
    phys_err = max(
        abs(norm_phys_0 - 1.0),
        abs(norm_phys_20 - 1.0),
        abs(ortho_phys_0_20),
        rel_err(x2_phys_0, 0.5 * a_ho_app * a_ho_app),
        rel_err(x2_phys_20, 20.5 * a_ho_app * a_ho_app),
    )
    record(
        "Autofunzioni fisiche Ψ_n(x) in Å⁻¹/² (n=0 e n=20): norma, ortogonalità e ⟨x²⟩",
        "ortonormalita",
        phys_err < 1e-12,
        phys_err,
        1e-12,
        {
            "aHoAng": a_ho_app,
            "norm_0": norm_phys_0,
            "norm_20": norm_phys_20,
            "ortho_0_20": ortho_phys_0_20,
            "x2_0_ang2": x2_phys_0,
            "x2_0_expected": 0.5 * a_ho_app * a_ho_app,
            "x2_20_ang2": x2_phys_20,
            "x2_20_expected": 20.5 * a_ho_app * a_ho_app,
        },
    )

    # =========================================================================
    # VERIFICA D: Principio di indeterminazione Δx Δp = ħ/2 per n = 0 (eq. 51)
    # =========================================================================
    psi_dp_vals = res["psi_phys_dp"]["psi0"]
    # Calcola ⟨p²⟩ = -ħ² ∫ Ψ₀(x) Ψ₀''(x) dx
    # In unità SI: x in m = x_ang * 1e-10, Ψ in m^{-1/2} = Ψ_ang * 1e5, ma il fattore (1e5)^2 * 1e-10 = 1!
    # E d²/dx_m² = 1e20 d²/dx_ang²
    int_psi_d2psi_ang = 0.0
    for j, (xv, wv) in enumerate(zip(gl_x_dp_nodes, gl_x_dp_weights)):
        base = 5 * j
        fm2, fm1, f0, fp1, fp2 = psi_dp_vals[base : base + 5]
        d2_ang = (-fm2 + 16.0 * fm1 - 30.0 * f0 + 16.0 * fp1 - fp2) / (12.0 * h_x_fd * h_x_fd)
        int_psi_d2psi_ang += wv * f0 * d2_ang

    hbar_si = float(HBAR_SI_D)
    p2_mean_si = -(hbar_si ** 2) * int_psi_d2psi_ang * 1e20
    dp_si = math.sqrt(p2_mean_si)
    dx_si = math.sqrt(x2_phys_0) * 1e-10
    uncertainty_prod = dx_si * dp_si
    expected_hbar_half = 0.5 * hbar_si
    unc_rel_err = rel_err(uncertainty_prod, expected_hbar_half)

    record(
        "Principio di indeterminazione Δx Δp = ħ/2 per n = 0 (quadratura + FD4 su Ψ₀(x))",
        "indeterminazione",
        unc_rel_err < 1e-8,
        unc_rel_err,
        1e-8,
        {
            "delta_x_m": dx_si,
            "delta_p_kg_m_s": dp_si,
            "dx_dp_J_s": uncertainty_prod,
            "hbar_half_J_s": expected_hbar_half,
            "ratio_to_hbar_half": uncertainty_prod / expected_hbar_half,
        },
    )

    # =========================================================================
    # VERIFICA E: erfc(x) e frazione di tunneling |x| > x_cl per n = 0 … 25
    # =========================================================================
    max_erfc_rel_err = 0.0
    max_erfc_abs_err = 0.0
    max_erfc_rel_no_cancel = 0.0
    erfc_table: list[dict[str, Any]] = []
    for item in res["erfc"]:
        x = item["x"]
        app_v = item["val"]
        ref_v = ref_erfc_decimal(x)
        py_v = math.erfc(x)
        abs_e = abs(app_v - ref_v)
        max_erfc_abs_err = max(max_erfc_abs_err, abs_e)
        # Per x = 26.6 app restituisce 0 perché > 26.6 (erfc(26.6) ~ 5.7e-310 è subnormale float64)
        if x >= 26.6:
            err = abs(app_v - py_v)  # ~5.7e-310
        else:
            err = rel_err(app_v, ref_v)
            max_erfc_rel_err = max(max_erfc_rel_err, err)
            if not (2.5 <= x <= 3.5):
                max_erfc_rel_no_cancel = max(max_erfc_rel_no_cancel, err)
        erfc_table.append({"x": x, "app": app_v, "ref_dec": ref_v, "py_math": py_v, "abs_err": abs_e, "rel_err": err})

    record(
        "Funzione erfc(x) su [-10, 30] (err. abs < 1e-15; cancellazione 1−erf vicino x=3,5)",
        "erfc_tunneling",
        (max_erfc_abs_err < 1e-15) and (max_erfc_rel_no_cancel < 1e-14),
        max_erfc_abs_err,
        1e-15,
        {
            "max_abs_err": max_erfc_abs_err,
            "max_rel_err_all": max_erfc_rel_err,
            "max_rel_err_outside_2p5_3p5": max_erfc_rel_no_cancel,
            "samples": erfc_table,
        },
    )

    # Tunneling: quadratura INDIPENDENTE sulle code [u_cl, u_cl + 10]
    # vs `quantumTunnelingFraction(n)` (che integra sul centro [0, u_cl])
    tunneling_rows: list[dict[str, Any]] = []
    max_tun_err = 0.0
    prev_tun = 1.0
    strictly_decreasing = True
    for item in res["tunneling"]:
        n = item["n"]
        app_t = item["tunneling"]
        u_cl_ref = math.sqrt(2 * n + 1)
        if n == 0:
            ref_t = ref_erfc_decimal(1.0)
        else:
            ref_t = 2.0 * quad_composite_gl16(
                lambda u: ref_psi_dimless_decimal(n, u) ** 2,
                u_cl_ref,
                u_cl_ref + 10.0,
                n_panels=32,
            )
        err_t = rel_err(app_t, ref_t)
        max_tun_err = max(max_tun_err, err_t)
        if app_t >= prev_tun:
            strictly_decreasing = False
        prev_tun = app_t
        tunneling_rows.append({
            "n": n,
            "uCl_app": item["uCl"],
            "uCl_ref": u_cl_ref,
            "tunneling_app": app_t,
            "tunneling_tail_quad": ref_t,
            "rel_err": err_t,
        })

    record(
        "Tunneling |x| > x_cl (n=0..25): erfc(1) ≈ 0,1573, quadratura code vs app e decadimento monotono",
        "erfc_tunneling",
        (max_tun_err < 1e-12) and strictly_decreasing,
        max_tun_err,
        1e-12,
        {
            "strictly_decreasing_with_n": strictly_decreasing,
            "n0_tunneling": tunneling_rows[0]["tunneling_app"],
            "n0_erfc1_ref": ref_erfc_decimal(1.0),
            "n25_tunneling": tunneling_rows[-1]["tunneling_app"],
            "rows": tunneling_rows,
        },
    )

    # =========================================================================
    # VERIFICA F: P_cl(x) e convergenza di ⟨P_n(x)⟩ → P_cl(x) (Bohr, n = 20, 25)
    # =========================================================================
    cl_grid = res["cl_density"]
    max_cl_err = 0.0
    for u, app_d, x, app_p in zip(cl_us, cl_grid["dimless"], cl_xs, cl_grid["phys"]):
        ref_d = 0.0 if abs(u) >= u_cl_test else 1.0 / (math.pi * math.sqrt(u_cl_test**2 - u**2))
        ref_p = 0.0 if abs(x) >= x_cl_test else 1.0 / (math.pi * math.sqrt(x_cl_test**2 - x**2))
        max_cl_err = max(max_cl_err, rel_err(app_d, ref_d), rel_err(app_p, ref_p))

    record(
        "Densità classica P_cl(u) e P_cl(x) (dentro e fuori zona proibita)",
        "corrispondenza_bohr",
        max_cl_err < 1e-14,
        max_cl_err,
        1e-14,
        {"uCl": u_cl_test, "xCl": x_cl_test, "max_rel_err": max_cl_err},
    )

    # Verifica normalizzazione P_cl via sostituzione trigonometrica u = u_cl sin θ
    # e verifica di convergenza Kolmogorov-Smirnov F_n(u) -> F_cl(u) + media locale su n = 0, 2, 6, 20, 25
    bohr_stats: list[dict[str, Any]] = []
    ks_by_n: dict[int, float] = {}
    local_avg_by_n: dict[int, float] = {}
    max_curve_err = 0.0
    for curve in res["bohr_curves"]:
        n = curve["n"]
        us = curve["u"]
        p_q = curve["probQuantum"]
        p_cl = curve["probClassical"]
        psi_arr = curve["psiN"]
        u_cl = math.sqrt(2 * n + 1)
        du = us[1] - us[0]

        # Controllo puntuale su 40 punti di oscillatorCurvesDimless
        for k_idx in range(0, len(us), 60):
            uv = us[k_idx]
            ref_psi = ref_psi_dimless_decimal(n, uv)
            max_curve_err = max(max_curve_err, abs(psi_arr[k_idx] - ref_psi))

        # CDF quantistica F_n(u) con regola trapezoidale sulla curva dell'app
        cdf_q = [0.0] * len(us)
        acc = 0.0
        for i in range(1, len(us)):
            acc += 0.5 * du * (p_q[i - 1] + p_q[i])
            cdf_q[i] = acc

        # CDF classica F_cl(u) = 0 per u <= -u_cl, 1/2 + (1/π) arcsin(u/u_cl), 1 per u >= u_cl
        ks_dist = 0.0
        for uv, fq in zip(us, cdf_q):
            if uv <= -u_cl:
                fcl = 0.0
            elif uv >= u_cl:
                fcl = 1.0
            else:
                fcl = 0.5 + math.asin(uv / u_cl) / math.pi
            ks_dist = max(ks_dist, abs(fq - fcl))

        # Media spaziale locale (finestra gaussiana con σ_avg = π / √(2n+1), cioè ~ metà periodo
        # o 1 periodo locale di oscillazione di |ψ_n|²) nel bulk |u| ≤ 0,75 u_cl
        sigma_avg = max(0.35, 1.5 * math.pi / u_cl) if n > 0 else 0.5
        bulk_errs: list[float] = []
        for i, uv in enumerate(us):
            if abs(uv) <= 0.75 * u_cl:
                # Media ponderata gaussiana centrata in uv
                num = 0.0
                den = 0.0
                for j, uvp in enumerate(us):
                    if abs(uvp - uv) <= 5.0 * sigma_avg:
                        wt = math.exp(-0.5 * ((uvp - uv) / sigma_avg) ** 2)
                        num += wt * p_q[j]
                        den += wt
                p_avg = num / den
                bulk_errs.append(abs(p_avg - p_cl[i]) / p_cl[i])
        mean_bulk_rel = sum(bulk_errs) / len(bulk_errs)

        ks_by_n[n] = ks_dist
        local_avg_by_n[n] = mean_bulk_rel
        bohr_stats.append({
            "n": n,
            "uCl": u_cl,
            "total_norm_trap": cdf_q[-1],
            "ks_distance_Fn_vs_Fcl": ks_dist,
            "bulk_smoothed_rel_err": mean_bulk_rel,
        })

    # Per n = 20 e n = 25 la distanza KS deve essere decrescente e vicina al pavimento T(25)/2 ≈ 0,0225
    bohr_converges = (
        ks_by_n[0] > ks_by_n[2] > ks_by_n[6] > ks_by_n[20] > ks_by_n[25]
        and ks_by_n[20] < 0.030
        and ks_by_n[25] < 0.026
        and local_avg_by_n[25] < 0.020
        and max_curve_err < 1e-13
    )
    record(
        "Principio di corrispondenza di Bohr ⟨P_n⟩ → P_cl (n=0,2,6,20,25): KS CDF & media locale",
        "corrispondenza_bohr",
        bohr_converges,
        ks_by_n[25],
        0.026,
        {
            "max_curve_psi_err": max_curve_err,
            "stats_by_n": bohr_stats,
        },
    )

    # =========================================================================
    # VERIFICA G: Bose–Einstein (μ = 0), distribuzione p_n(T) e identità di Mehler
    # =========================================================================
    max_be_err = 0.0
    max_probs_err = 0.0
    max_sum_p_err = 0.0
    max_sum_np_err = 0.0
    max_mehler_direct_err = 0.0
    max_mehler_si_err = 0.0
    bose_details: dict[str, Any] = {}

    # Pre-estrai matrice ψ_n(u_mehler_pts) per n = 0..400
    psi_mehler_mat = res["psi_mehler_0_400"]

    for c, app_b in zip(bose_cases, res["bose"]):
        cid = c["id"]
        w_d = TWO_PI_D * Decimal(repr(c["freqThz"])) * Decimal("1e12")
        t_d = Decimal(repr(c["temperatureK"]))
        n_bar_ref = ref_bose_einstein_d(w_d, t_d)
        app_n_bar = app_b["nBar"]

        if t_d <= 0 or (HBAR_SI_D * w_d) / (KB_SI_D * t_d) > Decimal("709"):
            err_nbar = abs(app_n_bar - float(n_bar_ref))
        else:
            err_nbar = rel_err(app_n_bar, float(n_bar_ref))
        max_be_err = max(max_be_err, err_nbar)

        # Confronto p_n(T) = (1 - e^{-x}) e^{-nx}
        probs = app_b["probs"]
        if t_d <= 0 or (HBAR_SI_D * w_d) / (KB_SI_D * t_d) > Decimal("709"):
            expected_p0 = 1.0
            err_p_case = max(abs(probs[0] - expected_p0), max((abs(p) for p in probs[1:]), default=0.0))
            sum_p = sum(probs)
            sum_np = sum(n * p for n, p in enumerate(probs))
            err_sum_p = abs(sum_p - 1.0)
            err_sum_np = abs(sum_np)
        else:
            x_d = (HBAR_SI_D * w_d) / (KB_SI_D * t_d)
            z_d = dec_exp(-x_d)
            norm_d = Decimal(1) - z_d
            err_p_case = 0.0
            p_cur = norm_d
            for n, p_app in enumerate(probs):
                err_p_case = max(err_p_case, rel_err(p_app, float(p_cur), scale=1e-16))
                p_cur *= z_d
            # Verifica ∑ p_n = 1 e ∑ n p_n = n̄(T) usando anche la coda troncata analitica
            # Nota: qui confrontiamo ∑ p_n e ∑ n p_n contro i valori esatti dell'app (nBar_app) per testare la consistenza della somma interna, e contro SI 2019 separatamente
            m_cut = c["maxN"]
            x_app = (app_const["HBAR_J_S"] * app_b["omegaRadS"]) / (app_const["KB_J_K"] * c["temperatureK"])
            z_app = math.exp(-x_app)
            tail_prob_app = z_app ** (m_cut + 1)
            expected_sum_p = 1.0 - tail_prob_app
            expected_sum_np = app_n_bar - (m_cut + 1 + app_n_bar) * tail_prob_app
            sum_p = sum(probs)
            sum_np = sum(n * p for n, p in enumerate(probs))
            if tail_prob_app < 1e-13 and (m_cut + 1 + app_n_bar) * tail_prob_app < 1e-13:
                err_sum_p = abs(sum_p - 1.0)
                err_sum_np = rel_err(sum_np, app_n_bar)
            else:
                err_sum_p = abs(sum_p - expected_sum_p)
                err_sum_np = rel_err(sum_np, expected_sum_np)

        max_probs_err = max(max_probs_err, err_p_case)
        max_sum_p_err = max(max_sum_p_err, err_sum_p)
        max_sum_np_err = max(max_sum_np_err, err_sum_np)

        # Verifica riepilogo thermalOscillatorSummary
        s = app_b["summary"]
        a_ho_d = ref_harmonic_length_ang_d(Decimal(repr(c["massAmu"])), w_d)
        mean_u_d = n_bar_ref + Decimal("0.5")
        hbar_w_mev_d = HBAR_SI_D * w_d * J_TO_EV_D * Decimal(1000)
        kbt_mev_d = KB_EV_K_D * t_d * Decimal(1000)
        rms_amp_d = a_ho_d * mean_u_d.sqrt()
        u_cl_eff_d = (Decimal(2) * n_bar_ref + Decimal(1)).sqrt()
        x_cl_eff_d = a_ho_d * u_cl_eff_d
        lat_d = Decimal(repr(c["latticeA"]))
        sum_err = max(
            rel_err(s["nBar"], float(n_bar_ref), scale=1e-30),
            rel_err(s["meanUnitsHbarOmega"], float(mean_u_d)),
            rel_err(s["meanEnergyMev"], float(mean_u_d * hbar_w_mev_d)),
            rel_err(s["kBTmev"], float(kbt_mev_d), scale=1e-30),
            rel_err(s["rmsAmpAng"], float(rms_amp_d)),
            rel_err(s["uClEff"], float(u_cl_eff_d)),
            rel_err(s["xClEffAng"], float(x_cl_eff_d)),
            rel_err(s["rmsOverLattice"], float(rms_amp_d / lat_d)),
        )

        # Identità di Mehler: somma diretta ∑_{n=0}^{400} p_n(T) |ψ_n(u)|²
        # vs `thermalProbabilityDensityDimless` (e confronto separato vs SI 2019)
        mehler_direct_case = None
        mehler_si_case = None
        if app_b["thermalDensity"] is not None and c["maxN"] >= 400 or cid == "zero_T":
            n_sum = min(len(probs), len(psi_mehler_mat))
            if cid != "slider_T1000_nu10":
                sigma_sq_d = n_bar_ref + Decimal("0.5")
                norm_g_d = (TWO_PI_D * sigma_sq_d).sqrt()
                case_direct = 0.0
                case_si = 0.0
                for ui, (uv, app_th) in enumerate(zip(u_mehler_pts, app_b["thermalDensity"])):
                    uv_d = Decimal(repr(uv))
                    ref_gauss = float(dec_exp(-(uv_d * uv_d) / (Decimal(2) * sigma_sq_d)) / norm_g_d)
                    direct_sum = sum(probs[n] * (psi_mehler_mat[n][ui] ** 2) for n in range(n_sum))
                    case_direct = max(case_direct, abs(app_th - direct_sum))
                    case_si = max(case_si, abs(app_th - ref_gauss))
                mehler_direct_case = case_direct
                mehler_si_case = case_si
                max_mehler_direct_err = max(max_mehler_direct_err, case_direct)
                max_mehler_si_err = max(max_mehler_si_err, case_si)

        bose_details[cid] = {
            "nBar_app": app_n_bar,
            "nBar_ref": float(n_bar_ref),
            "sum_p": sum_p,
            "sum_np": sum_np,
            "summary_rel_err": sum_err,
            "mehler_direct_sum_abs_err": mehler_direct_case,
            "mehler_si2019_abs_err": mehler_si_case,
        }

    # Verifica integrali di normalizzazione e varianza su `thermalProbabilityDensityDimless`
    max_th_mom_err = 0.0
    th_mom_details: dict[str, Any] = {}
    for c, app_tm in zip(
        [
            {"id": "T300_nu44", "freqThz": 4.4, "temperatureK": 300.0},
            {"id": "T30_nu44", "freqThz": 4.4, "temperatureK": 30.0},
            {"id": "T1000_nu44", "freqThz": 4.4, "temperatureK": 1000.0},
        ],
        res["thermal_gl_moments"],
    ):
        dens = app_tm["thermalDensity"]
        norm_th = sum(w * d for w, d in zip(gl_th_weights, dens))
        var_th = sum(w * u * u * d for u, w, d in zip(gl_th_nodes, gl_th_weights, dens))
        expected_var = app_tm["nBar"] + 0.5
        err_m = max(abs(norm_th - 1.0), rel_err(var_th, expected_var))
        max_th_mom_err = max(max_th_mom_err, err_m)
        th_mom_details[c["id"]] = {
            "norm": norm_th,
            "var_u2_quad": var_th,
            "expected_nBar_plus_half": expected_var,
            "err": err_m,
        }

    record(
        "Bose–Einstein μ = 0: ∑p_n = 1, ∑np_n = n̄ (interna < 1e-13) e vs SI 2019 (< 5e-8 per HBAR_J_S 10 cifre)",
        "bose_einstein",
        (max(max_sum_p_err, max_sum_np_err) < 1e-13) and (max(max_be_err, max_probs_err) < 5e-8),
        max(max_sum_p_err, max_sum_np_err),
        1e-13,
        {
            "max_sum_p_err": max_sum_p_err,
            "max_sum_np_err": max_sum_np_err,
            "max_nBar_rel_err_vs_SI2019": max_be_err,
            "max_pn_rel_err_vs_SI2019": max_probs_err,
            "cases": bose_details,
        },
    )

    record(
        "Identità di Mehler ∑ p_n(T)|ψ_n(u)|² = N(0, n̄+1/2) e momenti ∫ P_th du = 1, ∫ u² P_th du = n̄+1/2",
        "mehler",
        max(max_mehler_direct_err, max_th_mom_err) < 1e-13 and (max_mehler_si_err < 1e-9),
        max(max_mehler_direct_err, max_th_mom_err),
        1e-13,
        {
            "max_mehler_direct_sum_abs_err": max_mehler_direct_err,
            "max_mehler_si2019_abs_err": max_mehler_si_err,
            "max_thermal_moments_err": max_th_mom_err,
            "moments": th_mom_details,
        },
    )

    # =========================================================================
    # VERIFICA H: Processi Normali vs Umklapp in 1BZ (dispensa §16 e FD4 v_g)
    # =========================================================================
    max_umk_kin_err = 0.0
    max_umk_energy_err = 0.0
    umk_rows: list[dict[str, Any]] = []
    for (cid, k1_f, k2_f), app_u in zip(umklapp_pairs, res["umklapp_cases"]):
        ref_u = ref_analyze_1bz_collision(k1_f, k2_f, METAL_REF)
        err_kin = max(
            abs(app_u["k1Frac"] - ref_u["k1Frac"]),
            abs(app_u["k2Frac"] - ref_u["k2Frac"]),
            abs(app_u["kSumFrac"] - ref_u["kSumFrac"]),
            abs(app_u["mG"] - ref_u["mG"]),
            abs(app_u["k3Frac"] - ref_u["k3Frac"]),
            rel_err(app_u["omega1RadS"], ref_u["omega1RadS"], scale=1e12),
            rel_err(app_u["omega2RadS"], ref_u["omega2RadS"], scale=1e12),
            rel_err(app_u["omega3RadS"], ref_u["omega3RadS"], scale=1e12),
            rel_err(app_u["vg1Ms"], ref_u["vg1Ms"], scale=100.0),
            rel_err(app_u["vg2Ms"], ref_u["vg2Ms"], scale=100.0),
            rel_err(app_u["vg3Ms"], ref_u["vg3Ms"], scale=100.0),
        )
        err_en = max(
            rel_err(app_u["energy1Mev"], ref_u["energy1Mev"], scale=1.0),
            rel_err(app_u["energy2Mev"], ref_u["energy2Mev"], scale=1.0),
            rel_err(app_u["energy3Mev"], ref_u["energy3Mev"], scale=1.0),
        )
        assert app_u["kind"] == ref_u["kind"], f"Mismatch kind on {cid}"
        assert app_u["sameInputDirection"] == ref_u["sameInputDirection"], f"Mismatch sameInputDirection on {cid}"
        assert app_u["flowReversed"] == ref_u["flowReversed"], f"Mismatch flowReversed on {cid}"
        slope_expected_3 = ref_u["vg3Ms"] / (200.0 * math.pi)
        err_kin = max(err_kin, rel_err(app_u["slopeVg3ThzA"], slope_expected_3, scale=1.0))
        max_umk_kin_err = max(max_umk_kin_err, err_kin)
        max_umk_energy_err = max(max_umk_energy_err, err_en)
        umk_rows.append({
            "id": cid,
            "k1Frac": k1_f,
            "k2Frac": k2_f,
            "kSumFrac": app_u["kSumFrac"],
            "mG": app_u["mG"],
            "k3Frac": app_u["k3Frac"],
            "kind": app_u["kind"],
            "vg1Ms": app_u["vg1Ms"],
            "vg2Ms": app_u["vg2Ms"],
            "vg3Ms": app_u["vg3Ms"],
            "flowReversed": app_u["flowReversed"],
            "energyMismatchMev": app_u["energyMismatchMev"],
            "max_kin_err": err_kin,
            "max_energy_err": err_en,
        })

    # Controllo specifico dell'esempio dispensa §16 (p. 40)
    disp_u = umk_rows[0]
    disp_umk_ok = (
        abs(disp_u["k3Frac"] - (-0.7)) < 1e-14
        and disp_u["mG"] == -1
        and disp_u["kind"] == "umklapp"
        and disp_u["vg1Ms"] > 0
        and disp_u["vg2Ms"] > 0
        and disp_u["vg3Ms"] < 0
        and disp_u["flowReversed"] is True
    )

    record(
        "Processi Normali vs Umklapp in 1BZ: esempio dispensa (0,7+0,6→−0,7), FD4 v_g e 20 casi limite",
        "umklapp_1bz",
        (max_umk_kin_err < 1e-12) and (max_umk_energy_err < 1e-9) and disp_umk_ok,
        max_umk_kin_err,
        1e-12,
        {"dispensa_example_ok": disp_umk_ok, "max_energy_err_vs_SI2019": max_umk_energy_err, "cases": umk_rows},
    )

    # Griglia 11 × 11 (121 collisioni) su tutta la 1BZ
    max_grid_err = 0.0
    n_normal = 0
    n_umklapp = 0
    n_reversed = 0
    for inp, app_u in zip(umklapp_grid_cases, res["umklapp_grid"]):
        ref_u = ref_analyze_1bz_collision(inp["k1Frac"], inp["k2Frac"], METAL_REF)
        # Controllo 1BZ (-1, +1]
        assert -1.0 < app_u["k3Frac"] <= 1.0, f"k3Frac out of 1BZ: {app_u}"
        assert app_u["kind"] == ref_u["kind"]
        assert app_u["mG"] == ref_u["mG"]
        assert app_u["flowReversed"] == ref_u["flowReversed"]
        for key in ("omega1RadS", "omega2RadS", "omega3RadS", "vg1Ms", "vg2Ms", "vg3Ms"):
            assert math.isfinite(app_u[key])
        err_g = max(
            abs(app_u["k3Frac"] - ref_u["k3Frac"]),
            rel_err(app_u["vg3Ms"], ref_u["vg3Ms"], scale=100.0),
        )
        max_grid_err = max(max_grid_err, err_g)
        if app_u["kind"] == "normal":
            n_normal += 1
        else:
            n_umklapp += 1
        if app_u["flowReversed"]:
            n_reversed += 1

    record(
        "Scansione griglia 11×11 (121 collisioni) nella 1BZ (−1, +1]: invarianti, FD4 v_g e assenza NaN",
        "umklapp_1bz",
        max_grid_err < 1e-11,
        max_grid_err,
        1e-11,
        {
            "total_collisions": len(umklapp_grid_cases),
            "normal_count": n_normal,
            "umklapp_count": n_umklapp,
            "flow_reversed_count": n_reversed,
        },
    )

    # =========================================================================
    # Salvataggio JSON & Riepilogo
    # =========================================================================
    n_passed = sum(1 for c in checks if c["passed"])
    summary_json = {
        "section": "phonon-quantum",
        "total_checks": len(checks),
        "passed_checks": n_passed,
        "failed_checks": len(checks) - n_passed,
        "all_passed": n_passed == len(checks),
        "checks": checks,
    }
    OUT_JSON.write_text(json.dumps(summary_json, indent=2), encoding="utf-8")

    print(f"Crosscheck phonon-quantum: {n_passed}/{len(checks)} PASS")
    for c in checks:
        status = "PASS" if c["passed"] else "FAIL"
        print(f"  [{status}] {c['name']} (max_err={c['max_err']:.3e}, thr={c['threshold']:.1e})")

    return 0 if n_passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
