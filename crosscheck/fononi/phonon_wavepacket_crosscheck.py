#!/usr/bin/env python3
"""
Crosscheck numerico indipendente — Sezione 3 Fononi:
Pacchetti d'onda, velocità di fase, velocità di gruppo e allargamento gaussiano.

Fonti di riferimento (sola lettura):
  - materiale/parte6/dispensa.pdf: Lezione 2 §6 (pp. 14–17, eqq. 10–12, Figg. 7–9),
    Lezione 1 §3 (eqq. 8–9, p. 9), Lezione 2 §§7–8 (eqq. 20–23, pp. 19–23).
  - materiale/parte6/riferimento-formule.md.

Metodologia completamente indipendente da src/renderer/src/physics/:
  1. Aritmetica `Decimal` a 50 cifre con costanti SI 2019 esatte + CODATA 2018
     per verificare tutte le grandezze chiuse e le derivate numeriche centrali
     al 4° ordine (v_g = dω/dk, ω'' = d²ω/dk²) senza cancellazione.
  2. Quadratura numerica di Gauss–Legendre composita ad alta precisione (64 sotto-intervalli × 16 nodi = 1024 nodi)
     dell'integrale esatto del pacchetto d'onda eq. (10):
       Ψ(x, t) = (1/√2π) ∫ Φ(k) exp(i[kx - ω(k)t]) dk
     con Φ(k₀ + κ) = √2 σ₀ exp(-σ₀² κ²), sia sullo sviluppo al 2° ordine (confronto a precisione
     macchina contro `wavepacketFieldAt`, inclusi inviluppo, fase, chirp spaziale e fase di Gouy)
     sia sulla dispersione esatta non troncata ω(k) (verifica conservazione norma L² per Parseval
     e stima dei termini dispersivi di ordine ≥ 3).
  3. Quadratura spaziale in x su `wavepacketFieldAt` per verificare indipendentemente:
     - norma L² conservata ∫ |Ψ(x,t)|² dx = √(2π) σ₀,
     - posizione media ⟨x⟩(t) = v_g t,
     - varianza σ(t) rispetto a `wavepacketWidthAt` (eq. 12),
     - chirp locale ∂_x arg Ψ(x,t) = k₀ + γ(x - v_g t)/(2σ(t)²).
  4. Esecuzione diretta delle funzioni reali di `src/renderer/src/physics/phononDispersion.ts`
     tramite Node (.tools/node/node.exe) con `module.registerHooks` su tutti i 4 regimi,
     i 5 preset della sezione, i casi limite k₀ = 0, k₀ = ±π/a, punto di flesso ottico,
     M = m al bordo zona, e sonde logaritmiche vicino all'origine.

Esecuzione (dalla root del repository):
  python crosscheck/fononi/phonon_wavepacket_crosscheck.py
"""

from __future__ import annotations

import cmath
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
OUT_JSON = Path(__file__).resolve().parent / "phonon_wavepacket_crosscheck_results.json"

# =============================================================================
# 1. COSTANTI FISICHE INDIPENDENTI (SI 2019 esatte + CODATA 2018)
# =============================================================================
H_SI_D = Decimal("6.62607015e-34")            # J·s (esatta SI 2019)
E_SI_D = Decimal("1.602176634e-19")           # C   (esatta SI 2019)
AMU_KG_D = Decimal("1.6605390666e-27")        # kg  (CODATA 2018)
ME_KG_D = Decimal("9.1093837015e-31")         # kg  (CODATA 2018)
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
HBAR_SI_D = H_SI_D / TWO_PI_D
RAD_S_TO_THZ_D = Decimal(1) / (TWO_PI_D * Decimal("1e12"))
THZ_TO_MEV_D = (H_SI_D * Decimal("1e12")) / (E_SI_D * Decimal("1e-3"))
# Costante α_q = ħ/m_0 da CODATA 2018 in Å²/s
ALPHA_Q_CODATA_ANG2_S_D = (HBAR_SI_D / ME_KG_D) / (ANGSTROM_M_D * ANGSTROM_M_D)
# Costante coerente con progetto.md: ħ²/2m₀ = 3.80998 eV·Å², ħ = 6.582119569e-16 eV·s
HBAR2_2M0_PROJ_D = Decimal("3.80998")
HBAR_EV_S_PROJ_D = Decimal("6.582119569e-16")
ALPHA_Q_PROJ_ANG2_S_D = (Decimal(2) * HBAR2_2M0_PROJ_D) / HBAR_EV_S_PROJ_D


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
        if abs(term) < Decimal("1e-52"):
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
        if abs(term) < Decimal("1e-52"):
            break
        total += term
        n += 1
    return total


# =============================================================================
# 2. FORMULE INDIPENDENTI IN DECIMAL A 50 CIFRE (DA DISPENSA PARTE 6)
# =============================================================================
MONATOMIC_REF = {"a": 2.5, "massAmu": 63.2, "springC": 20.0}
DIATOMIC_REF = {"a": 5.64, "massHeavyAmu": 35.5, "massLightAmu": 23.0, "springC": 10.0}


def ref_omega_d(regime: str, k_d: Decimal, mono: dict[str, float], dia: dict[str, float], free_mass_ratio: float = 1.0, use_codata_alpha: bool = False) -> Decimal:
    """Relazione di dispersione ω(k) [rad/s] indipendente in Decimal a 50 cifre."""
    if regime == "linear":
        a_d = Decimal(str(mono["a"]))
        M_d = Decimal(str(mono["massAmu"])) * AMU_KG_D
        C_d = Decimal(str(mono["springC"]))
        vs_ang_s = a_d * (C_d / M_d).sqrt()
        return vs_ang_s * abs(k_d)
    elif regime == "acoustic":
        a_d = Decimal(str(mono["a"]))
        M_d = Decimal(str(mono["massAmu"])) * AMU_KG_D
        C_d = Decimal(str(mono["springC"]))
        w_max = Decimal(2) * (C_d / M_d).sqrt()
        return w_max * abs(dec_sin(Decimal("0.5") * k_d * a_d))
    elif regime == "optical":
        a_d = Decimal(str(dia["a"]))
        M_d = Decimal(str(dia["massHeavyAmu"])) * AMU_KG_D
        m_d = Decimal(str(dia["massLightAmu"])) * AMU_KG_D
        C_d = Decimal(str(dia["springC"]))
        invM = Decimal(1) / M_d
        invm = Decimal(1) / m_d
        S = invM + invm
        s_half = dec_sin(Decimal("0.5") * k_d * a_d)
        disc = S * S - (Decimal(4) * s_half * s_half) / (M_d * m_d)
        if disc < 0:
            disc = Decimal(0)
        return (C_d * (S + disc.sqrt())).sqrt()
    elif regime == "quadratic":
        alpha_q = (ALPHA_Q_CODATA_ANG2_S_D if use_codata_alpha else ALPHA_Q_PROJ_ANG2_S_D) / Decimal(str(free_mass_ratio))
        return Decimal("0.5") * alpha_q * k_d * k_d
    else:
        raise ValueError(f"Unknown regime: {regime}")


def ref_fd4_first_deriv_ms(regime: str, k_d: Decimal, mono: dict[str, float], dia: dict[str, float], free_mass_ratio: float = 1.0, h_str: str = "1e-7") -> Decimal:
    """Derivata prima centrale al 4° ordine dω/dk in m/s (h in Å⁻¹)."""
    h = Decimal(h_str)
    fp2 = ref_omega_d(regime, k_d + 2 * h, mono, dia, free_mass_ratio)
    fp1 = ref_omega_d(regime, k_d + h, mono, dia, free_mass_ratio)
    fm1 = ref_omega_d(regime, k_d - h, mono, dia, free_mass_ratio)
    fm2 = ref_omega_d(regime, k_d - 2 * h, mono, dia, free_mass_ratio)
    d_ang = (-fp2 + 8 * fp1 - 8 * fm1 + fm2) / (12 * h)
    return d_ang * ANGSTROM_M_D


def ref_fd4_second_deriv_ang2s(regime: str, k_d: Decimal, mono: dict[str, float], dia: dict[str, float], free_mass_ratio: float = 1.0, h_str: str = "1e-6") -> Decimal:
    """Derivata seconda centrale al 4° ordine d²ω/dk² in Å²/s (h in Å⁻¹)."""
    h = Decimal(h_str)
    fp2 = ref_omega_d(regime, k_d + 2 * h, mono, dia, free_mass_ratio)
    fp1 = ref_omega_d(regime, k_d + h, mono, dia, free_mass_ratio)
    f0 = ref_omega_d(regime, k_d, mono, dia, free_mass_ratio)
    fm1 = ref_omega_d(regime, k_d - h, mono, dia, free_mass_ratio)
    fm2 = ref_omega_d(regime, k_d - 2 * h, mono, dia, free_mass_ratio)
    return (-fp2 + 16 * fp1 - 30 * f0 + 16 * fm1 - fm2) / (12 * h * h)


def ref_analytic_vg_ms(regime: str, k: float, mono: dict[str, float], dia: dict[str, float], free_mass_ratio: float = 1.0) -> float:
    """Velocità di gruppo analitica in Decimal -> float."""
    k_d = Decimal(repr(k))
    if regime == "linear":
        if abs(k) < 1e-14:
            return 0.0
        a_d = Decimal(str(mono["a"]))
        M_d = Decimal(str(mono["massAmu"])) * AMU_KG_D
        C_d = Decimal(str(mono["springC"]))
        vs_ms = float(a_d * ANGSTROM_M_D * (C_d / M_d).sqrt())
        return vs_ms if k > 0 else -vs_ms
    elif regime == "acoustic":
        a_d = Decimal(str(mono["a"]))
        M_d = Decimal(str(mono["massAmu"])) * AMU_KG_D
        C_d = Decimal(str(mono["springC"]))
        half_ka = Decimal("0.5") * k_d * a_d
        s = dec_sin(half_ka)
        c = dec_cos(half_ka)
        if abs(s) < Decimal("1e-14") or abs(c) < Decimal("1e-14"):
            return 0.0
        vs_ms = a_d * ANGSTROM_M_D * (C_d / M_d).sqrt()
        sgn = Decimal(1) if s > 0 else Decimal(-1)
        return float(vs_ms * c * sgn)
    elif regime == "optical":
        a_d = Decimal(str(dia["a"]))
        M_d = Decimal(str(dia["massHeavyAmu"])) * AMU_KG_D
        m_d = Decimal(str(dia["massLightAmu"])) * AMU_KG_D
        C_d = Decimal(str(dia["springC"]))
        S = Decimal(1) / M_d + Decimal(1) / m_d
        s_half = dec_sin(Decimal("0.5") * k_d * a_d)
        sqrtD = (S * S - Decimal(4) * s_half * s_half / (M_d * m_d)).sqrt()
        if sqrtD < Decimal("1e-14") * S:
            return 0.0
        sin_ka = dec_sin(k_d * a_d)
        if abs(sin_ka) < Decimal("1e-14"):
            return 0.0
        w_plus = (C_d * (S + sqrtD)).sqrt()
        vg_d = -(C_d * a_d * ANGSTROM_M_D * sin_ka) / (Decimal(2) * M_d * m_d * w_plus * sqrtD)
        return float(vg_d)
    elif regime == "quadratic":
        alpha_q = ALPHA_Q_PROJ_ANG2_S_D / Decimal(str(free_mass_ratio))
        return float(alpha_q * k_d * ANGSTROM_M_D)
    raise ValueError(regime)


def ref_analytic_curv_ang2s(regime: str, k: float, mono: dict[str, float], dia: dict[str, float], free_mass_ratio: float = 1.0) -> float:
    """Curvatura analitica ω''(k) in Å²/s in Decimal -> float."""
    k_d = Decimal(repr(k))
    if regime == "linear":
        return 0.0
    elif regime == "acoustic":
        a_d = Decimal(str(mono["a"]))
        w = ref_omega_d("acoustic", k_d, mono, dia)
        return float(-Decimal("0.25") * a_d * a_d * w)
    elif regime == "optical":
        a_d = Decimal(str(dia["a"]))
        M_d = Decimal(str(dia["massHeavyAmu"])) * AMU_KG_D
        m_d = Decimal(str(dia["massLightAmu"])) * AMU_KG_D
        C_d = Decimal(str(dia["springC"]))
        invMm = Decimal(1) / (M_d * m_d)
        S = Decimal(1) / M_d + Decimal(1) / m_d
        s_half = dec_sin(Decimal("0.5") * k_d * a_d)
        sqrtD = (S * S - Decimal(4) * s_half * s_half * invMm).sqrt()
        if sqrtD < Decimal("1e-14") * S:
            return 0.0
        w_plus = (C_d * (S + sqrtD)).sqrt()
        sin_ka = dec_sin(k_d * a_d)
        cos_ka = dec_cos(k_d * a_d)
        f_prime = -(C_d * a_d * sin_ka * invMm) / sqrtD
        w_prime = f_prime / (Decimal(2) * w_plus)
        f_second = -(C_d * a_d * a_d * invMm / sqrtD) * (cos_ka + (sin_ka * sin_ka * invMm) / (sqrtD * sqrtD))
        return float((f_second - Decimal(2) * w_prime * w_prime) / (Decimal(2) * w_plus))
    elif regime == "quadratic":
        return float(ALPHA_Q_PROJ_ANG2_S_D / Decimal(str(free_mass_ratio)))
    raise ValueError(regime)


# =============================================================================
# 3. QUADRATURA GAUSS-LEGENDRE COMPOSITA AD ALTA PRECISIONE (16 NODI PER PANNELLO)
# =============================================================================
def gauss_legendre_nodes_weights(n: int) -> tuple[list[float], list[float]]:
    """Calcola nodi e pesi di Gauss-Legendre su [-1, 1] con metodo di Newton su P_n(x)."""
    nodes = [0.0] * n
    weights = [0.0] * n
    m = (n + 1) // 2
    for i in range(m):
        z = math.cos(math.pi * (i + 0.75) / (n + 0.5))
        while True:
            p1 = 1.0
            p2 = 0.0
            for j in range(1, n + 1):
                p3 = p2
                p2 = p1
                p1 = ((2.0 * j - 1.0) * z * p2 - (j - 1.0) * p3) / j
            pp = n * (z * p1 - p2) / (z * z - 1.0)
            z1 = z
            z = z1 - p1 / pp
            if abs(z - z1) < 1e-16:
                break
        nodes[i] = -z
        nodes[n - 1 - i] = z
        w = 2.0 / ((1.0 - z * z) * pp * pp)
        weights[i] = w
        weights[n - 1 - i] = w
    return nodes, weights


GL16_X, GL16_W = gauss_legendre_nodes_weights(16)


def quad_composite_gl16_complex(f: Callable[[float], complex], a: float, b: float, n_panels: int = 64) -> complex:
    """Quadratura composita Gauss-Legendre a 16 nodi su [a, b] per funzioni complesse."""
    h = (b - a) / n_panels
    total = 0j
    for p in range(n_panels):
        x0 = a + p * h
        mid = x0 + 0.5 * h
        half = 0.5 * h
        sub = 0j
        for xi, wi in zip(GL16_X, GL16_W):
            sub += wi * f(mid + half * xi)
        total += half * sub
    return total


def quad_composite_gl16_real(f: Callable[[float], float], a: float, b: float, n_panels: int = 64) -> float:
    """Quadratura composita Gauss-Legendre a 16 nodi su [a, b] per funzioni reali."""
    h = (b - a) / n_panels
    total = 0.0
    for p in range(n_panels):
        x0 = a + p * h
        mid = x0 + 0.5 * h
        half = 0.5 * h
        sub = 0.0
        for xi, wi in zip(GL16_X, GL16_W):
            sub += wi * f(mid + half * xi)
        total += half * sub
    return total


def ref_exact_eq10_integral(
    x_ang: float,
    t_s: float,
    k0: float,
    sigma0_ang: float,
    omega_fn: Callable[[float], float],
    n_sigma_k: float = 12.0,
    n_panels: int = 64,
) -> complex:
    """
    Integra direttamente l'eq. (10) della dispensa (§6.1 p. 14):
      Ψ(x, t) = (1/√2π) ∫ Φ(k₀ + κ) exp(i[(k₀ + κ)x - ω(k₀ + κ)t]) dκ
    con peso gaussiano Φ(k₀ + κ) = √2 σ₀ exp(-σ₀² κ²) (picco unitario a t=0, x=0).
    """
    delta_k = 0.5 / sigma0_ang  # Δk = s = 1/(2σ₀)
    kappa_max = n_sigma_k * delta_k
    pref = (math.sqrt(2.0) * sigma0_ang) / math.sqrt(2.0 * math.pi)  # = σ₀ / √π

    def integrand(kappa: float) -> complex:
        k = k0 + kappa
        w = omega_fn(k)
        weight = math.exp(-(sigma0_ang * kappa) ** 2)
        phase = k * x_ang - w * t_s
        return weight * cmath.exp(1j * phase)

    return pref * quad_composite_gl16_complex(integrand, -kappa_max, kappa_max, n_panels=n_panels)


# =============================================================================
# 4. RUNNER NODE PER ESEGUIRE LE FUNZIONI REALI DI phononDispersion.ts
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

const app = await import('./src/renderer/src/physics/phononDispersion.ts');
const cnst = await import('./src/renderer/src/physics/constants.ts');

const payload = JSON.parse(readFileSync(0, 'utf8'));
const out = { constants: { ...cnst }, results: {} };

for (const job of payload.jobs) {
  if (job.type === 'characteristics_batch') {
    out.results[job.id] = job.items.map((p) => app.wavepacketCharacteristics(p));
  } else if (job.type === 'eval_grid') {
    const p = job.params;
    out.results[job.id] = job.ks.map((k) => ({
      k,
      omega: app.wavepacketOmega(k, p),
      vg: app.wavepacketGroupVelocity(k, p),
      vp: app.wavepacketPhaseVelocity(k, p),
      curv: app.wavepacketCurvatureAng2S(k, p),
    }));
  } else if (job.type === 'field_samples') {
    const char = app.wavepacketCharacteristics(job.params);
    out.results[job.id] = {
      char,
      samples: job.points.map(([x, t]) => ({
        x,
        t,
        width: app.wavepacketWidthAt(char.sigma0Ang, char.omegaSecondAng2S, t),
        field: app.wavepacketFieldAt(x, t, char),
      })),
    };
  } else if (job.type === 'snapshots') {
    out.results[job.id] = job.cases.map((c) => app.wavepacketSnapshot(c.params, c.timeS, c.options));
  } else if (job.type === 'dispersion_curves') {
    out.results[job.id] = job.cases.map((c) => {
      const curve = app.wavepacketDispersionCurve(c.params, c.kMin, c.kMax, c.nPoints);
      return {
        k: Array.from(curve.k),
        omegaRadS: Array.from(curve.omegaRadS),
        freqThz: Array.from(curve.freqThz),
        energyMev: Array.from(curve.energyMev),
      };
    });
  }
}

process.stdout.write(JSON.stringify(out));
"""


def run_node_jobs(jobs: list[dict[str, Any]]) -> dict[str, Any]:
    """Esegue un batch di query contro phononDispersion.ts tramite Node."""
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
        raise RuntimeError(f"Node runner failed ({proc.returncode}):\nSTDOUT:{proc.stdout}\nSTDERR:{proc.stderr}")
    return json.loads(proc.stdout)


# =============================================================================
# 5. COSTRUZIONE CASI DI TEST & VERIFICHE
# =============================================================================
def rel_err(a: float, b: float, scale: float = 0.0) -> float:
    denom = max(abs(b), scale, 1e-300)
    return abs(a - b) / denom


def main() -> int:
    if not NODE_EXE.exists():
        print(f"ERROR: Node executable not found at {NODE_EXE}", file=sys.stderr)
        return 2

    checks: list[dict[str, Any]] = []

    def record(name: str, category: str, passed: bool, max_err: float, threshold: float, details: dict[str, Any]) -> None:
        checks.append({
            "name": name,
            "category": category,
            "passed": bool(passed),
            "max_err": float(max_err) if math.isfinite(max_err) else str(max_err),
            "threshold": float(threshold),
            "details": details,
        })

    # --- Preparazione parametri e griglie ---
    a_mono = MONATOMIC_REF["a"]
    k_edge_mono = math.pi / a_mono
    a_dia = DIATOMIC_REF["a"]
    k_edge_dia = math.pi / a_dia

    # Punto di flesso del ramo ottico in (0, π/a) dove ω₊''(k) = 0 (bisezione indipendente)
    lo, hi = 0.05 * k_edge_dia, 0.95 * k_edge_dia
    for _ in range(80):
        mid = 0.5 * (lo + hi)
        if ref_analytic_curv_ang2s("optical", mid, MONATOMIC_REF, DIATOMIC_REF) < 0:
            lo = mid
        else:
            hi = mid
    k_opt_infl = 0.5 * (lo + hi)

    def make_params(regime: str, k0: float, sigma0_ang: float, free_mass_ratio: float = 1.0, dia: dict[str, float] | None = None) -> dict[str, Any]:
        return {
            "regime": regime,
            "k0": k0,
            "sigma0Ang": sigma0_ang,
            "monatomic": MONATOMIC_REF,
            "diatomic": dia if dia is not None else DIATOMIC_REF,
            "freeMassRatio": free_mass_ratio,
        }

    # --- Preparazione batch Node ---
    jobs: list[dict[str, Any]] = []

    # Job 1: Griglie fitte su [-2π/a, +2π/a] per derivate centrali e dispersione su tutti i 4 regimi
    regimes_grid_specs = [
        ("linear", k_edge_mono, 201),
        ("acoustic", k_edge_mono, 201),
        ("optical", k_edge_dia, 201),
        ("quadratic", k_edge_mono, 201),
    ]
    for reg, edge, npts in regimes_grid_specs:
        # Griglia estesa [-2π/a, +2π/a] con passo dispari + aggiunta di punti vicini ai punti angolosi
        ks = [(-2.0 + 4.0 * i / (npts - 1)) * edge for i in range(npts)]
        jobs.append({
            "type": "eval_grid",
            "id": f"grid_{reg}",
            "params": make_params(reg, 0.5 * edge, 3.0 * (a_dia if reg == "optical" else a_mono)),
            "ks": ks,
        })

    # Job 2: Sonde critiche e limiti (k=0, k=±π/a, k→0±, flesso ottico, M=m al bordo, quadratico con m_eff != 1)
    special_probes: list[tuple[str, dict[str, Any]]] = [
        ("linear_pos", make_params("linear", 0.35 * k_edge_mono, 3.0 * a_mono)),
        ("linear_neg", make_params("linear", -0.35 * k_edge_mono, 3.0 * a_mono)),
        ("linear_origin", make_params("linear", 0.0, 3.0 * a_mono)),
        ("linear_tiny_pos", make_params("linear", 1e-9, 3.0 * a_mono)),
        ("linear_tiny_neg", make_params("linear", -1e-9, 3.0 * a_mono)),
        ("acoustic_disp", make_params("acoustic", 0.66 * k_edge_mono, 3.0 * a_mono)),
        ("acoustic_neg", make_params("acoustic", -0.66 * k_edge_mono, 3.0 * a_mono)),
        ("acoustic_edge_pos", make_params("acoustic", k_edge_mono, 3.0 * a_mono)),
        ("acoustic_edge_neg", make_params("acoustic", -k_edge_mono, 3.0 * a_mono)),
        ("acoustic_origin", make_params("acoustic", 0.0, 3.0 * a_mono)),
        ("acoustic_small_pos", make_params("acoustic", 1e-4 * k_edge_mono, 3.0 * a_mono)),
        ("optical_mid_pos", make_params("optical", 0.5 * k_edge_dia, 3.0 * a_dia)),
        ("optical_mid_neg", make_params("optical", -0.5 * k_edge_dia, 3.0 * a_dia)),
        ("optical_origin", make_params("optical", 0.0, 3.0 * a_dia)),
        ("optical_small_pos", make_params("optical", 1e-4 * k_edge_dia, 3.0 * a_dia)),
        ("optical_edge_pos", make_params("optical", k_edge_dia, 3.0 * a_dia)),
        ("optical_edge_neg", make_params("optical", -k_edge_dia, 3.0 * a_dia)),
        ("optical_inflection", make_params("optical", k_opt_infl, 3.0 * a_dia)),
        ("optical_equal_mass_edge", make_params("optical", k_edge_dia, 3.0 * a_dia, dia={"a": a_dia, "massHeavyAmu": 29.0, "massLightAmu": 29.0, "springC": 10.0})),
        ("quadratic_pos", make_params("quadratic", 0.5 * k_edge_mono, 3.0 * a_mono, free_mass_ratio=1.0)),
        ("quadratic_neg", make_params("quadratic", -0.5 * k_edge_mono, 3.0 * a_mono, free_mass_ratio=1.0)),
        ("quadratic_origin", make_params("quadratic", 0.0, 3.0 * a_mono, free_mass_ratio=1.0)),
        ("quadratic_eff025", make_params("quadratic", 0.4 * k_edge_mono, 2.0 * a_mono, free_mass_ratio=0.25)),
    ]
    jobs.append({
        "type": "characteristics_batch",
        "id": "special_chars",
        "items": [p for _, p in special_probes],
    })

    # Job 3: Sonde logaritmiche intorno a k=0 (1e-1 .. 1e-15) per verificare soglie
    log_ks = [10.0 ** (-p) for p in range(1, 16)] + [0.0]
    for reg in ("linear", "acoustic", "optical", "quadratic"):
        jobs.append({
            "type": "eval_grid",
            "id": f"logk_{reg}",
            "params": make_params(reg, 0.5 * k_edge_mono, 3.0 * a_mono),
            "ks": log_ks,
        })

    # Job 4: Campioni di campo Ψ(x, t) su tutti i 4 regimi, più tempi t, più posizioni x e più σ₀
    field_test_configs = [
        ("linear_035_s3", make_params("linear", 0.35 * k_edge_mono, 3.0 * a_mono), [0.0, 0.3e-12, 0.8e-12]),
        ("acoustic_066_s3", make_params("acoustic", 0.66 * k_edge_mono, 3.0 * a_mono), [0.0, 0.5e-12, 1.5e-12, 3.0e-12]),
        ("acoustic_edge_s15", make_params("acoustic", k_edge_mono, 1.5 * a_mono), [0.0, 0.4e-12, 1.0e-12]),
        ("optical_050_s3", make_params("optical", 0.5 * k_edge_dia, 3.0 * a_dia), [0.0, 1.0e-12, 3.0e-12, 6.0e-12]),
        ("optical_000_s4", make_params("optical", 0.0, 4.0 * a_dia), [0.0, 2.0e-12, 5.0e-12]),
        ("quadratic_050_s3", make_params("quadratic", 0.5 * k_edge_mono, 3.0 * a_mono), [0.0, 2.0e-15, 6.0e-15, 1.5e-14]),
        ("quadratic_neg_s6", make_params("quadratic", -0.4 * k_edge_mono, 6.0 * a_mono), [0.0, 1.0e-14, 3.0e-14]),
    ]
    xi_multipliers = [-3.0, -1.5, -0.5, 0.0, 0.5, 1.5, 3.0]
    for cfg_id, params, times in field_test_configs:
        vg_ang_s = ref_analytic_vg_ms(params["regime"], params["k0"], params["monatomic"], params["diatomic"], params["freeMassRatio"]) / 1e-10
        curv = ref_analytic_curv_ang2s(params["regime"], params["k0"], params["monatomic"], params["diatomic"], params["freeMassRatio"])
        pts: list[list[float]] = []
        for t in times:
            gamma = (curv * t) / (2.0 * params["sigma0Ang"] ** 2)
            sigma_t = params["sigma0Ang"] * math.hypot(1.0, gamma)
            xg = vg_ang_s * t
            for m in xi_multipliers:
                pts.append([xg + m * sigma_t, t])
        jobs.append({
            "type": "field_samples",
            "id": f"field_{cfg_id}",
            "params": params,
            "points": pts,
        })

    # Job 5: Griglia spaziale fine per verifica L², ⟨x⟩, σ(t) e chirp locale ∂_x arg Ψ su `wavepacketFieldAt`
    norm_cases = [
        ("acoustic_066", make_params("acoustic", 0.66 * k_edge_mono, 3.0 * a_mono), [0.0, 1.2e-12, 2.8e-12]),
        ("acoustic_edge", make_params("acoustic", k_edge_mono, 2.0 * a_mono), [0.0, 0.8e-12, 2.0e-12]),
        ("optical_050", make_params("optical", 0.5 * k_edge_dia, 3.0 * a_dia), [0.0, 2.5e-12, 6.0e-12]),
        ("quadratic_050", make_params("quadratic", 0.5 * k_edge_mono, 3.0 * a_mono), [0.0, 4.0e-15, 1.2e-14]),
        ("linear_035", make_params("linear", 0.35 * k_edge_mono, 3.0 * a_mono), [0.0, 0.6e-12]),
    ]
    for cid, params, times in norm_cases:
        vg_ang_s = ref_analytic_vg_ms(params["regime"], params["k0"], params["monatomic"], params["diatomic"], params["freeMassRatio"]) / 1e-10
        curv = ref_analytic_curv_ang2s(params["regime"], params["k0"], params["monatomic"], params["diatomic"], params["freeMassRatio"])
        pts = []
        h_phase = 1e-4  # Å per derivata centrale della fase (chirp)
        for t in times:
            gamma = (curv * t) / (2.0 * params["sigma0Ang"] ** 2)
            sigma_t = params["sigma0Ang"] * math.hypot(1.0, gamma)
            xg = vg_ang_s * t
            # Punti di quadratura composita Simpson/trapezoidale uniforme su [xg - 10σ(t), xg + 10σ(t)]
            # (per una gaussiana su [-10σ, 10σ], la regola trapezoidale uniforme converge esponenzialmente!)
            n_x = 241
            x_min = xg - 10.0 * sigma_t
            x_max = xg + 10.0 * sigma_t
            for i in range(n_x):
                x_val = x_min + (x_max - x_min) * i / (n_x - 1)
                pts.append([x_val, t])
            # Punti per derivata fase a ξ = +1.0 σ(t) e -1.5 σ(t)
            for m_chirp in (1.0, -1.5):
                x_c = xg + m_chirp * sigma_t
                pts.append([x_c - h_phase, t])
                pts.append([x_c + h_phase, t])
        jobs.append({
            "type": "field_samples",
            "id": f"norm_{cid}",
            "params": params,
            "points": pts,
        })

    # Job 6: Snapshots (comoving false/true) e curve di dispersione
    jobs.append({
        "type": "snapshots",
        "id": "snapshots",
        "cases": [
            {"params": make_params("acoustic", 0.66 * k_edge_mono, 3.0 * a_mono), "timeS": 1.0e-12, "options": {"halfSpanAng": 18 * a_mono, "nProfilePoints": 121, "comoving": False}},
            {"params": make_params("acoustic", 0.66 * k_edge_mono, 3.0 * a_mono), "timeS": 1.0e-12, "options": {"halfSpanAng": 18 * a_mono, "nProfilePoints": 121, "comoving": True}},
            {"params": make_params("optical", 0.5 * k_edge_dia, 3.0 * a_dia), "timeS": 2.0e-12, "options": {"halfSpanAng": 18 * a_dia, "nProfilePoints": 121, "comoving": False}},
            {"params": make_params("quadratic", 0.5 * k_edge_mono, 3.0 * a_mono), "timeS": 5.0e-15, "options": {"halfSpanAng": 18 * a_mono, "nProfilePoints": 121, "comoving": False}},
        ],
    })
    jobs.append({
        "type": "dispersion_curves",
        "id": "curves",
        "cases": [
            {"params": make_params("linear", 0.35 * k_edge_mono, 3.0 * a_mono), "kMin": -k_edge_mono, "kMax": k_edge_mono, "nPoints": 241},
            {"params": make_params("acoustic", 0.66 * k_edge_mono, 3.0 * a_mono), "kMin": -k_edge_mono, "kMax": k_edge_mono, "nPoints": 241},
            {"params": make_params("optical", 0.5 * k_edge_dia, 3.0 * a_dia), "kMin": -k_edge_dia, "kMax": k_edge_dia, "nPoints": 241},
            {"params": make_params("quadratic", 0.5 * k_edge_mono, 3.0 * a_mono), "kMin": -k_edge_mono, "kMax": k_edge_mono, "nPoints": 241},
        ],
    })

    # Job 7: 5 preset della sezione + 60 estremi della scatola degli slider (4 regimi × 5 kFrac × 3 sigma0InA)
    slider_items: list[dict[str, Any]] = []
    for reg in ("linear", "acoustic", "optical", "quadratic"):
        a_ref = a_dia if reg == "optical" else a_mono
        edge = math.pi / a_ref
        for kf in (-1.0, -0.5, 0.0, 0.5, 1.0):
            for s0 in (1.5, 3.0, 6.0):
                slider_items.append(make_params(reg, kf * edge, s0 * a_ref))
    jobs.append({
        "type": "characteristics_batch",
        "id": "slider_box_60",
        "items": slider_items,
    })

    node_out = run_node_jobs(jobs)
    res = node_out["results"]
    app_const = node_out["constants"]

    # =========================================================================
    # VERIFICA 0: Costanti fisiche e fattore quadratico ħ/m₀
    # =========================================================================
    hbar_ev_s_si = float(H_SI_D / (TWO_PI_D * E_SI_D))
    alpha_proj = float(ALPHA_Q_PROJ_ANG2_S_D)
    alpha_codata = float(ALPHA_Q_CODATA_ANG2_S_D)
    rel_alpha_codata = rel_err(alpha_proj, alpha_codata)
    record(
        "Costanti e scala quadratica ħ/m₀",
        "costanti",
        rel_alpha_codata < 1e-5 and rel_err(app_const["AMU_KG"], float(AMU_KG_D)) < 1e-12,
        rel_alpha_codata,
        1e-5,
        {
            "app_HBAR2_OVER_2M0": app_const["HBAR2_OVER_2M0"],
            "app_HBAR_EV_S": app_const["HBAR_EV_S"],
            "hbar_eV_s_SI2019": hbar_ev_s_si,
            "alpha_q_app_ang2_s": alpha_proj,
            "alpha_q_codata2018_ang2_s": alpha_codata,
            "rel_diff_codata_vs_progetto": rel_alpha_codata,
        },
    )

    # =========================================================================
    # VERIFICA 1: Quadratura numerica ad alta precisione eq. (10) (2° ordine)
    #             vs wavepacketFieldAt / wavepacketWidthAt (eq. 12)
    # =========================================================================
    for cfg_id, params, _ in field_test_configs:
        data = res[f"field_{cfg_id}"]
        char = data["char"]
        reg = params["regime"]
        k0 = params["k0"]
        sigma0 = params["sigma0Ang"]
        w0_ref = float(ref_omega_d(reg, Decimal(repr(k0)), MONATOMIC_REF, DIATOMIC_REF, params["freeMassRatio"]))
        vg_ang_s_ref = ref_analytic_vg_ms(reg, k0, MONATOMIC_REF, DIATOMIC_REF, params["freeMassRatio"]) / 1e-10
        curv_ref = ref_analytic_curv_ang2s(reg, k0, MONATOMIC_REF, DIATOMIC_REF, params["freeMassRatio"])

        def omega_2nd_order(k_val: float) -> float:
            dk = k_val - k0
            return w0_ref + vg_ang_s_ref * dk + 0.5 * curv_ref * dk * dk

        max_psi_abs_err = 0.0
        max_env_err = 0.0
        max_prob_err = 0.0
        max_width_rel_err = 0.0
        max_phase_err = 0.0
        worst_pt = None

        for item in data["samples"]:
            x = item["x"]
            t = item["t"]
            f_app = item["field"]
            w_app = item["width"]

            # Larghezza indipendente eq. (12)
            gamma_ref = (curv_ref * t) / (2.0 * sigma0 * sigma0)
            sigma_ref = sigma0 * math.hypot(1.0, gamma_ref)
            w_err = max(
                rel_err(w_app["sigmaAng"], sigma_ref),
                rel_err(w_app["spreadRatio"], math.hypot(1.0, gamma_ref)),
                rel_err(w_app["gamma"], gamma_ref, scale=1.0),
            )
            if w_err > max_width_rel_err:
                max_width_rel_err = w_err

            # Integrale GL16 composito (1024 nodi su ±12 Δk)
            psi_gl = ref_exact_eq10_integral(x, t, k0, sigma0, omega_2nd_order, n_sigma_k=12.0, n_panels=64)
            psi_app = complex(f_app["realPsi"], f_app["imagPsi"])
            err_psi = abs(psi_app - psi_gl)
            err_env = abs(f_app["envelope"] - abs(psi_gl))
            err_prob = abs(f_app["probDensity"] - (abs(psi_gl) ** 2))
            # Errore di fase complessa pesata sull'inviluppo (evita rumore dove |Ψ| ~ 1e-2)
            err_phase = abs(cmath.phase(psi_app / psi_gl)) if abs(psi_gl) > 1e-4 else 0.0

            if err_psi > max_psi_abs_err:
                max_psi_abs_err = err_psi
                worst_pt = {"x": x, "t": t, "psi_app": [psi_app.real, psi_app.imag], "psi_gl": [psi_gl.real, psi_gl.imag]}
            max_env_err = max(max_env_err, err_env)
            max_prob_err = max(max_prob_err, err_prob)
            max_phase_err = max(max_phase_err, err_phase)

        overall_err = max(max_psi_abs_err, max_env_err, max_prob_err, max_width_rel_err, max_phase_err)
        record(
            f"Quadratura eq. (10) [2° ord.] vs wavepacketFieldAt ({cfg_id})",
            "eq10_quadratura_2nd",
            overall_err < 1e-11,
            overall_err,
            1e-11,
            {
                "max_psi_abs_err": max_psi_abs_err,
                "max_env_err": max_env_err,
                "max_prob_err": max_prob_err,
                "max_width_rel_err": max_width_rel_err,
                "max_phase_rad_err": max_phase_err,
                "n_samples": len(data["samples"]),
                "worst_pt": worst_pt,
            },
        )

    # =========================================================================
    # VERIFICA 2: Dispersione ESATTA non troncata in eq. (10) vs wavepacketFieldAt
    #   - Per 'quadratic' (tutti k0) e 'linear' (lontano da k0=0) deve coincidere
    #     a precisione macchina (ω''' = 0)!
    #   - Per 'acoustic' e 'optical' misura il residuo fisico dei termini >= 3° ordine.
    # =========================================================================
    for cfg_id, params, _ in field_test_configs:
        data = res[f"field_{cfg_id}"]
        reg = params["regime"]
        k0 = params["k0"]
        sigma0 = params["sigma0Ang"]

        def omega_full_exact(k_val: float) -> float:
            return float(ref_omega_d(reg, Decimal(repr(k_val)), MONATOMIC_REF, DIATOMIC_REF, params["freeMassRatio"]))

        max_diff_exact = 0.0
        for item in data["samples"]:
            psi_exact = ref_exact_eq10_integral(item["x"], item["t"], k0, sigma0, omega_full_exact, n_sigma_k=12.0, n_panels=64)
            psi_app = complex(item["field"]["realPsi"], item["field"]["imagPsi"])
            max_diff_exact = max(max_diff_exact, abs(psi_app - psi_exact))

        is_exact_2nd = reg == "quadratic" or (reg == "linear" and abs(k0) > 6.0 / sigma0)
        thr = 1e-11 if is_exact_2nd else 0.15  # soglia informativa fisica per termini anarmonici/cubici
        record(
            f"Integrale eq. (10) con ω(k) ESATTA vs Gaussian 2° ord. ({cfg_id})",
            "eq10_full_dispersion",
            max_diff_exact < thr,
            max_diff_exact,
            thr,
            {
                "exact_2nd_order_regime": is_exact_2nd,
                "max_abs_diff_vs_full_eq10": max_diff_exact,
                "note": "Coincidenza esatta attesa per quadratic e linear lontano da k=0; per acoustic/optical quantifica il contributo fisico di ω''' e ω''''",
            },
        )

    # =========================================================================
    # VERIFICA 3: Norma L², ⟨x⟩ = v_g t, σ(t) spaziale e chirp locale ∂_x arg Ψ
    # =========================================================================
    for cid, params, times in norm_cases:
        data = res[f"norm_{cid}"]
        samples = data["samples"]
        sigma0 = params["sigma0Ang"]
        expected_l2 = math.sqrt(2.0 * math.pi) * sigma0
        vg_ang_s_ref = ref_analytic_vg_ms(params["regime"], params["k0"], MONATOMIC_REF, DIATOMIC_REF, params["freeMassRatio"]) / 1e-10
        curv_ref = ref_analytic_curv_ang2s(params["regime"], params["k0"], MONATOMIC_REF, DIATOMIC_REF, params["freeMassRatio"])
        k0 = params["k0"]

        idx = 0
        n_x = 241
        h_phase = 1e-4
        max_l2_rel_err = 0.0
        max_mean_x_err_ang = 0.0
        max_sigma_rel_err = 0.0
        max_chirp_rel_err = 0.0
        max_peak_rel_err = 0.0

        for t in times:
            gamma_ref = (curv_ref * t) / (2.0 * sigma0 * sigma0)
            sigma_ref = sigma0 * math.hypot(1.0, gamma_ref)
            xg_ref = vg_ang_s_ref * t

            slice_x = samples[idx : idx + n_x]
            idx += n_x
            xs = [s["x"] for s in slice_x]
            probs = [s["field"]["probDensity"] for s in slice_x]
            dx = xs[1] - xs[0]

            # Regola trapezoidale (precisione spettrale per gaussiana su [-10σ, 10σ])
            l2_num = dx * (0.5 * probs[0] + sum(probs[1:-1]) + 0.5 * probs[-1])
            mean_x_num = dx * (0.5 * xs[0] * probs[0] + sum(x * p for x, p in zip(xs[1:-1], probs[1:-1])) + 0.5 * xs[-1] * probs[-1]) / l2_num
            var_x_num = dx * (
                0.5 * ((xs[0] - mean_x_num) ** 2) * probs[0]
                + sum(((x - mean_x_num) ** 2) * p for x, p in zip(xs[1:-1], probs[1:-1]))
                + 0.5 * ((xs[-1] - mean_x_num) ** 2) * probs[-1]
            ) / l2_num
            sigma_num = math.sqrt(var_x_num)
            peak_num = max(probs)
            peak_ref = sigma0 / sigma_ref

            max_l2_rel_err = max(max_l2_rel_err, rel_err(l2_num, expected_l2))
            max_mean_x_err_ang = max(max_mean_x_err_ang, abs(mean_x_num - xg_ref))
            max_sigma_rel_err = max(max_sigma_rel_err, rel_err(sigma_num, sigma_ref))
            max_peak_rel_err = max(max_peak_rel_err, rel_err(peak_num, peak_ref))

            # Chirp locale: k_loc(x, t) = ∂_x arg Ψ(x, t) = k0 + γ(x - v_g t)/(2σ(t)²)
            for m_chirp in (1.0, -1.5):
                s_minus = samples[idx]["field"]
                s_plus = samples[idx + 1]["field"]
                idx += 2
                psi_m = complex(s_minus["realPsi"], s_minus["imagPsi"])
                psi_p = complex(s_plus["realPsi"], s_plus["imagPsi"])
                # Differenza di fase invariante a branch cut: arg(Ψ(x+h)/Ψ(x-h)) / (2h)
                k_loc_num = cmath.phase(psi_p / psi_m) / (2.0 * h_phase)
                k_loc_ref = k0 + (gamma_ref * m_chirp * sigma_ref) / (2.0 * sigma_ref * sigma_ref)
                max_chirp_rel_err = max(max_chirp_rel_err, rel_err(k_loc_num, k_loc_ref, scale=1.0))

        err_norm_all = max(max_l2_rel_err, max_mean_x_err_ang, max_sigma_rel_err, max_peak_rel_err, max_chirp_rel_err)
        record(
            f"Norma L², ⟨x⟩, σ(t), picco e chirp spaziale ({cid})",
            "conservazione_e_chirp",
            err_norm_all < 1e-9,
            err_norm_all,
            1e-9,
            {
                "expected_L2": expected_l2,
                "max_L2_rel_err": max_l2_rel_err,
                "max_mean_x_abs_err_Ang": max_mean_x_err_ang,
                "max_sigma_rel_err": max_sigma_rel_err,
                "max_peak_rel_err": max_peak_rel_err,
                "max_chirp_k_loc_err": max_chirp_rel_err,
            },
        )

    # =========================================================================
    # VERIFICA 4: Derivate numeriche centrali FD4 (v_g e ω'') su tutti e 4 i regimi
    #             su griglia estesa [-2π/a, +2π/a]
    # =========================================================================
    for reg, edge, _ in regimes_grid_specs:
        grid = res[f"grid_{reg}"]
        max_w_err = 0.0
        max_vg_fd_err = 0.0
        max_vg_an_err = 0.0
        max_curv_fd_err = 0.0
        max_curv_an_err = 0.0
        max_vp_err = 0.0
        n_tested_deriv = 0

        for pt in grid:
            k = pt["k"]
            k_d = Decimal(repr(k))
            w_ref = float(ref_omega_d(reg, k_d, MONATOMIC_REF, DIATOMIC_REF))
            max_w_err = max(max_w_err, rel_err(pt["omega"], w_ref, scale=1e13))

            # Velocità di fase
            if abs(k) < 1e-12:
                expected_vp = 0.0 if reg == "quadratic" else None
                if pt["vp"] != expected_vp:
                    max_vp_err = max(max_vp_err, 1.0)
            else:
                vp_ref = w_ref / (k / 1e-10)
                vp_scale = 4000.0 if reg in ("linear", "acoustic", "optical") else 1.0
                max_vp_err = max(max_vp_err, rel_err(pt["vp"], vp_ref, scale=vp_scale))

            # Analitica v_g e ω'' su tutti i punti
            vg_an = ref_analytic_vg_ms(reg, k, MONATOMIC_REF, DIATOMIC_REF)
            curv_an = ref_analytic_curv_ang2s(reg, k, MONATOMIC_REF, DIATOMIC_REF)
            vg_scale = 4000.0
            curv_scale = 1e13
            max_vg_an_err = max(max_vg_an_err, rel_err(pt["vg"], vg_an, scale=vg_scale))
            max_curv_an_err = max(max_curv_an_err, rel_err(pt["curv"], curv_an, scale=curv_scale))

            # Escludi i punti angolosi dove sin(ka/2)=0 per acoustic o k=0 per linear
            is_cusp = (reg == "linear" and abs(k) < 1e-6) or (reg == "acoustic" and abs(math.sin(0.5 * k * a_mono)) < 1e-6)
            if not is_cusp:
                n_tested_deriv += 1
                vg_fd4 = float(ref_fd4_first_deriv_ms(reg, k_d, MONATOMIC_REF, DIATOMIC_REF))
                curv_fd4 = float(ref_fd4_second_deriv_ang2s(reg, k_d, MONATOMIC_REF, DIATOMIC_REF))
                max_vg_fd_err = max(max_vg_fd_err, rel_err(pt["vg"], vg_fd4, scale=vg_scale))
                max_curv_fd_err = max(max_curv_fd_err, rel_err(pt["curv"], curv_fd4, scale=curv_scale))

        max_err_reg = max(max_w_err, max_vg_fd_err, max_vg_an_err, max_curv_fd_err, max_curv_an_err, max_vp_err)
        record(
            f"Griglia [-2π/a, +2π/a]: ω, v_p, v_g (FD4) e ω'' (FD4) — {reg}",
            "derivate_e_dispersione",
            max_err_reg < 1e-11,
            max_err_reg,
            1e-11,
            {
                "n_points": len(grid),
                "n_points_smooth_fd4": n_tested_deriv,
                "max_omega_rel_err": max_w_err,
                "max_vp_rel_err": max_vp_err,
                "max_vg_vs_FD4_rel_err": max_vg_fd_err,
                "max_vg_vs_analytic_rel_err": max_vg_an_err,
                "max_curv_vs_FD4_rel_err": max_curv_fd_err,
                "max_curv_vs_analytic_rel_err": max_curv_an_err,
            },
        )

    # =========================================================================
    # VERIFICA 5: Casi limite e proprietà fisiche specifiche della dispensa
    # =========================================================================
    chars_by_id = {name: c for (name, _), c in zip(special_probes, res["special_chars"])}

    # 5a. Acoustic al bordo zona k₀ = ±π/a: v_g = 0, ω'' = -a² ω_max / 4, v_p = ±(2/π)v_s
    M_kg = Decimal(str(MONATOMIC_REF["massAmu"])) * AMU_KG_D
    C_mono = Decimal(str(MONATOMIC_REF["springC"]))
    a_m_d = Decimal(str(a_mono))
    wmax_mono_ref = float(Decimal(2) * (C_mono / M_kg).sqrt())
    vs_mono_ref = float(a_m_d * ANGSTROM_M_D * (C_mono / M_kg).sqrt())
    curv_edge_formula = -0.25 * (a_mono ** 2) * wmax_mono_ref
    edge_pos = chars_by_id["acoustic_edge_pos"]
    edge_neg = chars_by_id["acoustic_edge_neg"]
    # Confronto anche con FD4 indipendente al bordo zona
    curv_edge_fd4 = float(ref_fd4_second_deriv_ang2s("acoustic", PI_D / a_m_d, MONATOMIC_REF, DIATOMIC_REF))
    err_edge = max(
        abs(edge_pos["vgMs"]),
        abs(edge_neg["vgMs"]),
        rel_err(edge_pos["omega0RadS"], wmax_mono_ref),
        rel_err(edge_neg["omega0RadS"], wmax_mono_ref),
        rel_err(edge_pos["omegaSecondAng2S"], curv_edge_formula),
        rel_err(edge_neg["omegaSecondAng2S"], curv_edge_formula),
        rel_err(edge_pos["omegaSecondAng2S"], curv_edge_fd4),
        rel_err(edge_pos["vpMs"], (2.0 / math.pi) * vs_mono_ref),
        rel_err(edge_neg["vpMs"], -(2.0 / math.pi) * vs_mono_ref),
    )
    ok_edge = (
        err_edge < 1e-13
        and edge_pos["isZoneEdgeStanding"] is True
        and edge_neg["isZoneEdgeStanding"] is True
        and edge_pos["spreadingTimeScaleS"] is not None
    )
    record(
        "Caso limite acoustic k₀ = ±π/a (v_g=0, ω''=-a²ω_max/4)",
        "casi_limite",
        ok_edge,
        err_edge,
        1e-13,
        {
            "omega_max_ref": wmax_mono_ref,
            "curv_formula_ref": curv_edge_formula,
            "curv_FD4_ref": curv_edge_fd4,
            "app_curv_pos": edge_pos["omegaSecondAng2S"],
            "app_curv_neg": edge_neg["omegaSecondAng2S"],
            "app_vg_pos": edge_pos["vgMs"],
            "app_vp_pos": edge_pos["vpMs"],
            "tau_disp_s": edge_pos["spreadingTimeScaleS"],
            "isZoneEdgeStanding": edge_pos["isZoneEdgeStanding"],
        },
    )

    # 5b. Optical a k₀ = 0 e k₀ → 0: v_g(0)=0, v_p=null, ω₊''(0) = -C a² / (2(m+M) ω₊(0))
    M_dia_kg = Decimal(str(DIATOMIC_REF["massHeavyAmu"])) * AMU_KG_D
    m_dia_kg = Decimal(str(DIATOMIC_REF["massLightAmu"])) * AMU_KG_D
    C_dia = Decimal(str(DIATOMIC_REF["springC"]))
    a_dia_d = Decimal(str(a_dia))
    w_opt_0_ref = float((Decimal(2) * C_dia * (M_dia_kg + m_dia_kg) / (M_dia_kg * m_dia_kg)).sqrt())
    curv_opt_0_formula = float(-(C_dia * a_dia_d * a_dia_d) / (Decimal(2) * (M_dia_kg + m_dia_kg) * Decimal(repr(w_opt_0_ref))))
    curv_opt_0_fd4 = float(ref_fd4_second_deriv_ang2s("optical", Decimal("0"), MONATOMIC_REF, DIATOMIC_REF))
    opt0 = chars_by_id["optical_origin"]
    opt_small = chars_by_id["optical_small_pos"]
    err_opt0 = max(
        abs(opt0["vgMs"]),
        rel_err(opt0["omega0RadS"], w_opt_0_ref),
        rel_err(opt0["omegaSecondAng2S"], curv_opt_0_formula),
        rel_err(opt0["omegaSecondAng2S"], curv_opt_0_fd4),
        rel_err(opt_small["vgMs"], float(ref_fd4_first_deriv_ms("optical", Decimal(repr(opt_small["k0"])), MONATOMIC_REF, DIATOMIC_REF))),
        rel_err(opt_small["omegaSecondAng2S"], curv_opt_0_formula, scale=1e13) * 1e-6,  # O(k²) per k=1e-4 π/a
    )
    # Verifica separata dell'ordine O(k²) di deviazione per optical_small_pos rispetto a k=0:
    rel_small_vs_fd4 = rel_err(opt_small["omegaSecondAng2S"], float(ref_fd4_second_deriv_ang2s("optical", Decimal(repr(opt_small["k0"])), MONATOMIC_REF, DIATOMIC_REF)))
    ok_opt0 = (
        opt0["vpMs"] is None
        and opt0["isVpDivergent"] is True
        and opt0["isOriginCusp"] is False
        and opt_small["vgMs"] < 0
        and opt_small["vpMs"] > 0
        and err_opt0 < 1e-13
        and rel_small_vs_fd4 < 1e-13
    )
    record(
        "Caso limite optical k₀ = 0 e k₀ → 0⁺ (v_g=0, v_p=null, ω''(0)=-Ca²/[2(m+M)ω₊(0)])",
        "casi_limite",
        ok_opt0,
        max(err_opt0, rel_small_vs_fd4),
        1e-13,
        {
            "w_opt_0_ref": w_opt_0_ref,
            "curv_opt_0_formula": curv_opt_0_formula,
            "curv_opt_0_FD4": curv_opt_0_fd4,
            "app_curv_opt_0": opt0["omegaSecondAng2S"],
            "app_vg_opt_0": opt0["vgMs"],
            "app_vp_opt_0": opt0["vpMs"],
            "isVpDivergent": opt0["isVpDivergent"],
            "small_k0_vg_neg": opt_small["vgMs"],
            "small_k0_curv_vs_FD4_rel_err": rel_small_vs_fd4,
        },
    )

    # 5c. Optical v_g < 0 per k > 0 (e v_g > 0 per k < 0), punto di flesso e bordo zona ±π/a
    opt_pos = chars_by_id["optical_mid_pos"]
    opt_neg = chars_by_id["optical_mid_neg"]
    opt_edge_p = chars_by_id["optical_edge_pos"]
    opt_edge_m = chars_by_id["optical_edge_neg"]
    opt_infl = chars_by_id["optical_inflection"]
    w_opt_min_ref = float((Decimal(2) * C_dia / m_dia_kg).sqrt())
    curv_opt_edge_formula = float((C_dia * a_dia_d * a_dia_d) / (Decimal(2) * (M_dia_kg - m_dia_kg) * Decimal(repr(w_opt_min_ref))))
    err_opt_edge = max(
        abs(opt_edge_p["vgMs"]),
        abs(opt_edge_m["vgMs"]),
        rel_err(opt_edge_p["omega0RadS"], w_opt_min_ref),
        rel_err(opt_edge_p["omegaSecondAng2S"], curv_opt_edge_formula),
        rel_err(opt_edge_m["omegaSecondAng2S"], curv_opt_edge_formula),
        abs(opt_infl["omegaSecondAng2S"]) / 1e13,
    )
    ok_opt_regime = (
        opt_pos["vgMs"] < 0 and opt_pos["vpMs"] > 0
        and opt_neg["vgMs"] > 0 and opt_neg["vpMs"] < 0
        and opt_edge_p["isZoneEdgeStanding"] is True
        and err_opt_edge < 1e-13
    )
    record(
        "Regime optical: v_g < 0 (k>0), v_g > 0 (k<0), bordo ±π/a (ω''>0) e punto di flesso (ω''=0)",
        "regimi",
        ok_opt_regime,
        err_opt_edge,
        1e-13,
        {
            "opt_pos_vg_vp": [opt_pos["vgMs"], opt_pos["vpMs"]],
            "opt_neg_vg_vp": [opt_neg["vgMs"], opt_neg["vpMs"]],
            "opt_edge_curv_formula": curv_opt_edge_formula,
            "opt_edge_curv_app": opt_edge_p["omegaSecondAng2S"],
            "opt_inflection_k_AngInv": k_opt_infl,
            "opt_inflection_curv_app": opt_infl["omegaSecondAng2S"],
            "opt_inflection_tau_disp": opt_infl["spreadingTimeScaleS"],
        },
    )

    # 5d. Optical con M = m al bordo zona k₀ = ±π/a (punto angoloso da ripiegamento)
    opt_eq = chars_by_id["optical_equal_mass_edge"]
    ok_opt_eq = (
        opt_eq["vgMs"] == 0.0
        and opt_eq["omegaSecondAng2S"] == 0.0
        and opt_eq["isZoneEdgeStanding"] is False
        and opt_eq["spreadingTimeScaleS"] is None
    )
    record(
        "Caso limite optical M = m al bordo zona k₀ = π/a (punto angoloso ripiegato)",
        "casi_limite",
        ok_opt_eq,
        0.0 if ok_opt_eq else 1.0,
        1e-12,
        {
            "vgMs": opt_eq["vgMs"],
            "omegaSecondAng2S": opt_eq["omegaSecondAng2S"],
            "isZoneEdgeStanding": opt_eq["isZoneEdgeStanding"],
        },
    )

    # 5e. Regime lineare: v_p = v_g = ±v_s, ω'' = 0, e cuspide a k₀ = 0
    lin_pos = chars_by_id["linear_pos"]
    lin_neg = chars_by_id["linear_neg"]
    lin_0 = chars_by_id["linear_origin"]
    lin_tp = chars_by_id["linear_tiny_pos"]
    lin_tn = chars_by_id["linear_tiny_neg"]
    err_lin = max(
        rel_err(lin_pos["vgMs"], vs_mono_ref),
        rel_err(lin_pos["vpMs"], vs_mono_ref),
        rel_err(lin_neg["vgMs"], -vs_mono_ref),
        rel_err(lin_neg["vpMs"], -vs_mono_ref),
        abs(lin_pos["omegaSecondAng2S"]),
        abs(lin_0["vgMs"]),
        rel_err(lin_tp["vgMs"], vs_mono_ref),
        rel_err(lin_tn["vgMs"], -vs_mono_ref),
    )
    ok_lin = (
        err_lin < 1e-13
        and lin_0["vpMs"] is None
        and lin_0["isOriginCusp"] is True
        and lin_pos["spreadingTimeScaleS"] is None
        and lin_pos["hasDiscreteLattice"] is True
    )
    record(
        "Regime lineare: v_p = v_g = ±v_s, ω'' = 0, cuspide in k₀ = 0",
        "regimi",
        ok_lin,
        err_lin,
        1e-13,
        {
            "vs_ref": vs_mono_ref,
            "lin_pos_vg_vp": [lin_pos["vgMs"], lin_pos["vpMs"]],
            "lin_0_vp_vg_cusp": [lin_0["vpMs"], lin_0["vgMs"], lin_0["isOriginCusp"]],
        },
    )

    # 5f. Regime quadratico: v_g = 2 v_p, ω'' = ħ/m_eff, k₀ = 0, freeMassRatio = 0.25
    q_pos = chars_by_id["quadratic_pos"]
    q_neg = chars_by_id["quadratic_neg"]
    q_0 = chars_by_id["quadratic_origin"]
    q_eff = chars_by_id["quadratic_eff025"]
    alpha_q1 = float(ALPHA_Q_PROJ_ANG2_S_D)
    alpha_q025 = float(ALPHA_Q_PROJ_ANG2_S_D / Decimal("0.25"))
    err_quad = max(
        rel_err(q_pos["vgMs"], 2.0 * q_pos["vpMs"]),
        rel_err(q_neg["vgMs"], 2.0 * q_neg["vpMs"]),
        rel_err(q_pos["omegaSecondAng2S"], alpha_q1),
        rel_err(q_eff["omegaSecondAng2S"], alpha_q025),
        rel_err(q_eff["vgMs"], 2.0 * q_eff["vpMs"]),
        abs(q_0["vgMs"]),
        abs(q_0["vpMs"]),
        rel_err(q_0["omegaSecondAng2S"], alpha_q1),
    )
    ok_quad = (
        err_quad < 1e-13
        and q_0["isOriginCusp"] is False
        and q_0["isVpDivergent"] is False
        and q_pos["hasDiscreteLattice"] is False
    )
    record(
        "Regime quadratico: v_g = 2 v_p, ω'' = ħ/m_eff, k₀ = 0 e m_eff = 0.25 m₀",
        "regimi",
        ok_quad,
        err_quad,
        1e-13,
        {
            "q_pos_vg_vp": [q_pos["vgMs"], q_pos["vpMs"]],
            "q_0_vg_vp_curv": [q_0["vgMs"], q_0["vpMs"], q_0["omegaSecondAng2S"]],
            "q_eff025_curv": q_eff["omegaSecondAng2S"],
            "hasDiscreteLattice": q_pos["hasDiscreteLattice"],
        },
    )

    # 5g. Cuspide k₀ = 0 e piccolo k su acoustic
    ac_0 = chars_by_id["acoustic_origin"]
    ac_small = chars_by_id["acoustic_small_pos"]
    err_ac0 = max(
        abs(ac_0["omega0RadS"]),
        abs(ac_0["vgMs"]),
        abs(ac_0["omegaSecondAng2S"]),
        rel_err(ac_small["vgMs"], vs_mono_ref * math.cos(0.5 * ac_small["k0"] * a_mono)),
    )
    ok_ac0 = ac_0["vpMs"] is None and ac_0["isOriginCusp"] is True and err_ac0 < 1e-13
    record(
        "Caso limite acoustic k₀ = 0 e k₀ → 0⁺ (cuspide ±v_s)",
        "casi_limite",
        ok_ac0,
        err_ac0,
        1e-13,
        {
            "ac_0": {"omega0": ac_0["omega0RadS"], "vg": ac_0["vgMs"], "vp": ac_0["vpMs"], "curv": ac_0["omegaSecondAng2S"], "isOriginCusp": ac_0["isOriginCusp"]},
            "ac_small_vg": ac_small["vgMs"],
            "ac_small_vp": ac_small["vpMs"],
        },
    )

    # =========================================================================
    # VERIFICA 6: Sonde logaritmiche intorno a k = 0 (coerenza soglie 1e-14 vs 1e-12)
    # =========================================================================
    log_summary: dict[str, Any] = {}
    anomalies_near_zero: list[dict[str, Any]] = []
    for reg in ("linear", "acoustic", "optical", "quadratic"):
        rows = res[f"logk_{reg}"]
        max_w_err = 0.0
        for row in rows:
            k = row["k"]
            w_ref = float(ref_omega_d(reg, Decimal(repr(k)), MONATOMIC_REF, DIATOMIC_REF))
            max_w_err = max(max_w_err, rel_err(row["omega"], w_ref, scale=1e-20))
            if reg in ("linear", "acoustic") and 1e-14 <= k < 1e-12:
                # Qui v_g != 0 ma v_p == null! Segnaliamo la finestra [1e-14, 1e-12)
                if row["vp"] is None and row["vg"] != 0.0:
                    anomalies_near_zero.append({"regime": reg, "k": k, "vg": row["vg"], "vp": row["vp"]})
        log_summary[reg] = {"max_omega_rel_err": max_w_err, "n_probes": len(rows)}

    record(
        "Sonde logaritmiche k ∈ [10⁻¹⁵, 10⁻¹] Å⁻¹ (assenza NaN/Inf e stabilità)",
        "stabilita_numerica",
        all(not any(math.isnan(r["omega"]) or math.isinf(r["omega"]) or math.isnan(r["vg"]) or math.isnan(r["curv"]) for r in res[f"logk_{reg}"]) for reg in ("linear", "acoustic", "optical", "quadratic")),
        max(v["max_omega_rel_err"] for v in log_summary.values()),
        1e-12,
        {"log_summary": log_summary, "vp_null_while_vg_nonzero_window": anomalies_near_zero},
    )

    # =========================================================================
    # VERIFICA 7: Snapshot (comoving, atomi discreti) & wavepacketDispersionCurve
    # =========================================================================
    max_snap_err = 0.0
    for snap in res["snapshots"]:
        char = snap["characteristics"]
        t = snap["timeS"]
        for pt in snap["profile"]:
            if not all(math.isfinite(pt[k]) for k in ("x", "envelope", "realPsi", "imagPsi", "probDensity")):
                max_snap_err = float("inf")
            max_snap_err = max(max_snap_err, abs(pt["probDensity"] - (pt["realPsi"] ** 2 + pt["imagPsi"] ** 2)))
            max_snap_err = max(max_snap_err, abs(pt["envelope"] - math.hypot(pt["realPsi"], pt["imagPsi"])))
        if char["hasDiscreteLattice"]:
            if len(snap["atoms"]) == 0:
                max_snap_err = float("inf")
            for atom in snap["atoms"]:
                max_snap_err = max(max_snap_err, abs(atom["u"]) - 1.0000000001 if abs(atom["u"]) > 1.0000000001 else 0.0)
        else:
            if len(snap["atoms"]) != 0:
                max_snap_err = float("inf")

    max_curve_err_rad_thz = 0.0
    max_curve_err_mev = 0.0
    curve_regimes = ("linear", "acoustic", "optical", "quadratic")
    for reg, curve in zip(curve_regimes, res["curves"]):
        for kv, w_app, nu_app, me_app in zip(curve["k"], curve["omegaRadS"], curve["freqThz"], curve["energyMev"]):
            w_ref_d = ref_omega_d(reg, Decimal(repr(kv)), MONATOMIC_REF, DIATOMIC_REF)
            nu_ref_d = w_ref_d * RAD_S_TO_THZ_D
            me_ref_d = nu_ref_d * THZ_TO_MEV_D
            max_curve_err_rad_thz = max(
                max_curve_err_rad_thz,
                rel_err(w_app, float(w_ref_d), scale=1e12),
                rel_err(nu_app, float(nu_ref_d), scale=1.0),
            )
            max_curve_err_mev = max(max_curve_err_mev, rel_err(me_app, float(me_ref_d), scale=1.0))

    record(
        "Snapshot (profile, atoms, comoving) e DispersionCurve (rad/s, THz)",
        "snapshot_e_curve",
        max(max_snap_err, max_curve_err_rad_thz) < 1e-12 and max_curve_err_mev < 1e-9,
        max(max_snap_err, max_curve_err_rad_thz),
        1e-12,
        {
            "max_snap_consistency_err": max_snap_err,
            "max_curve_rad_thz_rel_err": max_curve_err_rad_thz,
            "max_curve_mev_rel_err_vs_SI2019": max_curve_err_mev,
        },
    )

    # =========================================================================
    # VERIFICA 8: Scatola degli slider (60 vertici/estremi) & sviluppo piccolo k
    # =========================================================================
    max_heisenberg_err = 0.0
    max_slider_err = 0.0
    all_finite = True
    for c in res["slider_box_60"]:
        # σ₀ · Δk = 1/2
        max_heisenberg_err = max(max_heisenberg_err, abs(c["sigma0Ang"] * c["deltaKAngInv"] - 0.5))
        for fld in ("omega0RadS", "freq0Thz", "energy0Mev", "vgMs", "omegaSecondAng2S", "omegaSecondM2S", "deltaKAngInv"):
            if not math.isfinite(c[fld]):
                all_finite = False
        if c["vpMs"] is not None and not math.isfinite(c["vpMs"]):
            all_finite = False
        if c["spreadingTimeScaleS"] is not None and (not math.isfinite(c["spreadingTimeScaleS"]) or c["spreadingTimeScaleS"] <= 0):
            all_finite = False
        vg_ref = ref_analytic_vg_ms(c["regime"], c["k0"], MONATOMIC_REF, DIATOMIC_REF)
        curv_ref = ref_analytic_curv_ang2s(c["regime"], c["k0"], MONATOMIC_REF, DIATOMIC_REF)
        max_slider_err = max(
            max_slider_err,
            rel_err(c["vgMs"], vg_ref, scale=4000.0),
            rel_err(c["omegaSecondAng2S"], curv_ref, scale=1e13),
        )

    # Sviluppo piccolo k (§6.3 p. 17): ω(k) ≃ v_s k [1 - (ka)²/24], ω''(k) ≃ -(a² v_s / 4) k per ka = 1e-4 π
    ka_small = ac_small["k0"] * a_mono
    w_asymp = (vs_mono_ref / 1e-10) * ac_small["k0"] * (1.0 - (ka_small ** 2) / 24.0)
    curv_asymp = -0.25 * (a_mono ** 2) * (vs_mono_ref / 1e-10) * ac_small["k0"]
    err_asymp = max(
        rel_err(ac_small["omega0RadS"], w_asymp),
        rel_err(ac_small["omegaSecondAng2S"], curv_asymp),
    )

    record(
        "Stress-test 60 estremi slider (σ₀·Δk = 1/2, 0 NaN/Inf) e sviluppo §6.3 piccolo k",
        "slider_e_asintotica",
        all_finite and max(max_heisenberg_err, max_slider_err) < 1e-13 and err_asymp < 1e-8,
        max(max_heisenberg_err, max_slider_err),
        1e-13,
        {
            "n_combinations": len(res["slider_box_60"]),
            "max_sigma0_deltaK_err": max_heisenberg_err,
            "max_slider_vg_curv_rel_err": max_slider_err,
            "acoustic_small_k_asymptotic_rel_err": err_asymp,
        },
    )

    # =========================================================================
    # SALVATAGGIO JSON E RIEPILOGO A STDOUT
    # =========================================================================
    passed_count = sum(1 for c in checks if c["passed"])
    total_count = len(checks)
    summary = {
        "total_checks": total_count,
        "passed": passed_count,
        "failed": total_count - passed_count,
        "all_passed": passed_count == total_count,
        "checks": checks,
    }
    OUT_JSON.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(f"Crosscheck phonon-wavepacket: {passed_count}/{total_count} PASS")
    for c in checks:
        status = "PASS" if c["passed"] else "FAIL"
        print(f"  [{status}] {c['name']} -> max_err={c['max_err']:.3e} (thr={c['threshold']:.1e})")
    return 0 if passed_count == total_count else 1


if __name__ == "__main__":
    raise SystemExit(main())
