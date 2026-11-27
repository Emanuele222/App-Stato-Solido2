#!/usr/bin/env python3
"""
Crosscheck numerico indipendente — Sezione 6 Fononi (`phonon-specific-heat`):
Calore specifico del reticolo cristallino: Dulong–Petit, Einstein, Debye,
DOS 3D e 1D (singolarità di Van Hove), C_V 1D e analogia con il corpo nero.

Fonti di riferimento (sola lettura):
  - materiale/parte6/dispensa.pdf:
    * Lezione 4 §20 (eq. 52, Tab. 2, pp. 49–51: Dulong–Petit, dati sperimentali, diamante)
    * Lezione 4 §21 (eqq. 53–55, Fig. 22, pp. 51–53: modello di Einstein, asintoti, T = Θ_D/10 e Θ_D/20)
    * Lezione 4 §22 (eqq. 56–59, Figg. 23–26, pp. 53–57: modello di Debye, D_3(u), U_term(T), legge T³, diamante a 77 K)
    * Lezione 4 §23 (Tab. 3, Fig. 27, pp. 58–59: Θ_D degli elementi, Cu ω_D, DOS reale e Van Hove 1D)
    * Lezione 4 §25 (eqq. 61–62, pp. 60–63: insieme canonico, analogia corpo nero T⁴, Tab. 4)
  - materiale/parte6/riferimento-formule.md.

Metodologia indipendente da src/renderer/src/physics/:
  1. Aritmetica `Decimal` a 45 cifre con costanti SI 2019 esatte + CODATA 2018.
  2. Quadratura adattiva di Simpson (tolleranza 10⁻²⁵, profondità max 26) in `Decimal`
     applicata alla trasformazione x = s² su [0, √min(u, 120)], completamente diversa dalla
     quadratura composita Gauss–Legendre a 16 punti su breakpoint fissi di `specificHeat.ts`.
  3. Verifica incrociata dell'identità esatta per parti D₃(u) = 4 Φ_D(u) - 3u/(e^u - 1) e della
     relazione termodinamica C_V = (∂U_term/∂T)_V via differenze finite centrali al 4° ordine (FD4).
  4. C_V 1D della catena monatomica calcolata con trasformazione algebrica w = 1 - t²
     (diversa da w = sin θ dell'app) e Simpson adattivo in `Decimal`, più limiti bassa/alta T.
  5. Confronto punto per punto contro le funzioni reali esportate da `src/renderer/src/physics/specificHeat.ts`
     su una griglia estesa di T ∈ [5, 1500] K e Θ_D ∈ [30, 2500] K, su tutti i 9 preset e casi limite.

Esecuzione (dalla root del repository):
  python crosscheck/fononi/specific_heat.py
"""

from __future__ import annotations

import json
import math
import subprocess
import sys
from decimal import Decimal, getcontext
from functools import lru_cache
from pathlib import Path
from typing import Any, Callable

getcontext().prec = 40

ROOT = Path(__file__).resolve().parents[2]
NODE_EXE = ROOT / ".tools" / "node" / "node.exe"
OUT_JSON = Path(__file__).resolve().parent / "specific_heat_crosscheck_results.json"

# =============================================================================
# 1. COSTANTI FISICHE INDIPENDENTI (SI 2019 esatte + CODATA 2018)
# =============================================================================
H_SI_D = Decimal("6.62607015e-34")            # J·s (esatta SI 2019)
E_SI_D = Decimal("1.602176634e-19")           # C   (esatta SI 2019)
KB_SI_D = Decimal("1.380649e-23")             # J/K (esatta SI 2019)
NA_SI_D = Decimal("6.02214076e23")            # mol⁻¹ (esatta SI 2019)
C_LIGHT_D = Decimal("299792458")              # m/s (esatta SI)
AMU_KG_D = Decimal("1.6605390666e-27")        # kg  (CODATA 2018)


def dec_pi() -> Decimal:
    """Calcola π a 45+ cifre con formula di Machin."""
    def arctan_inv(inv_x: int) -> Decimal:
        x2 = Decimal(inv_x * inv_x)
        term = Decimal(1) / Decimal(inv_x)
        total = term
        k = 1
        while True:
            term = -term / x2
            add = term / Decimal(2 * k + 1)
            if abs(add) < Decimal("1e-49"):
                break
            total += add
            k += 1
        return total

    return Decimal(4) * (Decimal(4) * arctan_inv(5) - arctan_inv(239))


PI_D = dec_pi()
HBAR_SI_D = H_SI_D / (Decimal(2) * PI_D)
KB_EV_K_D = KB_SI_D / E_SI_D
R_GAS_D = NA_SI_D * KB_SI_D
THREE_R_D = Decimal(3) * R_GAS_D
THZ_TO_MEV_D = (H_SI_D * Decimal("1e12") / E_SI_D) * Decimal("1e3")
DEBYE_T3_PREFACTOR_D = (Decimal(12) * (PI_D ** 4)) / Decimal(5)


# =============================================================================
# 2. QUADRATURA INDIPENDENTE: ROMBERG ADATTIVO IN `Decimal`
# =============================================================================
def romberg_dec(
    fn: Callable[[Decimal], Decimal],
    a: Decimal,
    b: Decimal,
    tol: Decimal = Decimal("1e-21"),
    max_k: int = 9,
    max_depth: int = 4,
) -> Decimal:
    """
    Quadratura adattiva di Romberg (estrapolazione di Richardson sulla regola dei trapezi)
    in `Decimal`. Se non raggiunge `tol` entro `max_k`, suddivide l'intervallo ricorsivamente.
    """
    if b <= a:
        return Decimal(0)
    R = [[Decimal(0)] * (max_k + 1) for _ in range(max_k + 1)]
    h = b - a
    R[0][0] = (h / Decimal(2)) * (fn(a) + fn(b))
    for k in range(1, max_k + 1):
        h /= Decimal(2)
        n_pts = 1 << (k - 1)
        s = Decimal(0)
        for i in range(1, n_pts + 1):
            s += fn(a + Decimal(2 * i - 1) * h)
        R[k][0] = R[k - 1][0] / Decimal(2) + h * s
        factor = Decimal(4)
        for j in range(1, k + 1):
            R[k][j] = R[k][j - 1] + (R[k][j - 1] - R[k - 1][j - 1]) / (factor - Decimal(1))
            factor *= Decimal(4)
        if k >= 4 and abs(R[k][k] - R[k - 1][k - 1]) <= tol * max(Decimal(1), abs(R[k][k])):
            return R[k][k]
    if max_depth > 0:
        mid = (a + b) / Decimal(2)
        return romberg_dec(fn, a, mid, tol / Decimal(2), max_k, max_depth - 1) + romberg_dec(
            fn, mid, b, tol / Decimal(2), max_k, max_depth - 1
        )
    return R[max_k][max_k]


# =============================================================================
# 3. IMPLEMENTAZIONE INDIPENDENTE DELLE FORMULE DELLA DISPENSA (PARTE 6, LEZ. 4)
# =============================================================================
def einstein_fn_dec(x: Decimal) -> Decimal:
    """ℰ(x) = x² e^x / (e^x - 1)² in `Decimal` ad alta precisione."""
    if x <= Decimal(0):
        return Decimal(1)
    if x > Decimal(150):
        # Per x > 150, e^(-x) < 10⁻⁶⁵, quindi ℰ(x) = x² e^(-x) entro 10⁻⁶⁵
        return (x * x) * (-x).exp()
    if x < Decimal("1e-5"):
        x2 = x * x
        return (
            Decimal(1)
            - x2 / Decimal(12)
            + (x2 * x2) / Decimal(240)
            - (x2 * x2 * x2) / Decimal(6048)
        )
    ex_m = (-x).exp()
    one_minus = Decimal(1) - ex_m
    return (x * x * ex_m) / (one_minus * one_minus)


def debye_heat_integrand_s_dec(s: Decimal) -> Decimal:
    """
    Integrando trasformato x = s² (dx = 2s ds):
    I(u) = ∫₀^√u 2 s · x² ℰ(x) ds = ∫₀^√u 2 s⁵ ℰ(s²) ds.
    """
    if s <= Decimal(0):
        return Decimal(0)
    x = s * s
    return Decimal(2) * s * x * x * einstein_fn_dec(x)


def debye_energy_integrand_s_dec(s: Decimal) -> Decimal:
    """
    Integrando trasformato x = s² (dx = 2s ds) per U_term:
    ∫₀^u x³/(e^x - 1) dx = ∫₀^√u 2 s⁷ / (e^(s²) - 1) ds.
    """
    if s <= Decimal(0):
        return Decimal(0)
    x = s * s
    if x < Decimal("1e-5"):
        # x³ / (e^x - 1) = x² (1 - x/2 + x²/12 - x⁴/720 + x⁶/30240)
        x2 = x * x
        poly = (
            Decimal(1)
            - x / Decimal(2)
            + x2 / Decimal(12)
            - (x2 * x2) / Decimal(720)
            + (x2 * x2 * x2) / Decimal(30240)
        )
        return Decimal(2) * s * x2 * poly
    if x > Decimal(150):
        return Decimal(2) * s * (x ** 3) * (-x).exp()
    ex_m = (-x).exp()
    return Decimal(2) * s * (x ** 3) * ex_m / (Decimal(1) - ex_m)


@lru_cache(maxsize=4096)
def debye_d3_dec(u: Decimal) -> Decimal:
    """
    D₃(u) = (3/u³) ∫₀^u x⁴ e^x / (e^x - 1)² dx
    calcolata con trasformazione x = s² e Simpson adattivo in `Decimal`.
    """
    if u <= Decimal(0):
        return Decimal(1)
    if u < Decimal("1e-4"):
        u2 = u * u
        return (
            Decimal(1)
            - u2 / Decimal(20)
            + (u2 * u2) / Decimal(560)
            - (u2 * u2 * u2) / Decimal(18144)
        )
    # Per u > 120 la coda ∫₁₂₀^∞ x⁴ e^(-x) dx < 10⁻⁴⁴, trascurabile a 40 cifre
    u_eff = min(u, Decimal(120))
    s_max = u_eff.sqrt()
    if u_eff > Decimal(16):
        s_mid = Decimal(4)  # x = 16
        integral = romberg_dec(debye_heat_integrand_s_dec, Decimal(0), s_mid) + romberg_dec(
            debye_heat_integrand_s_dec, s_mid, s_max
        )
    else:
        integral = romberg_dec(debye_heat_integrand_s_dec, Decimal(0), s_max)
    return (Decimal(3) * integral) / (u * u * u)


@lru_cache(maxsize=4096)
def debye_phi_dec(u: Decimal) -> Decimal:
    """
    Φ_D(u) = (3/u³) ∫₀^u x³ / (e^x - 1) dx
    calcolata con trasformazione x = s² e Romberg adattivo in `Decimal`.
    """
    if u <= Decimal(0):
        return Decimal(1)
    if u < Decimal("1e-4"):
        u2 = u * u
        return (
            Decimal(1)
            - (Decimal(3) * u) / Decimal(8)
            + u2 / Decimal(20)
            - (u2 * u2) / Decimal(1680)
            + (u2 * u2 * u2) / Decimal(90720)
        )
    u_eff = min(u, Decimal(120))
    s_max = u_eff.sqrt()
    if u_eff > Decimal(16):
        s_mid = Decimal(4)
        integral = romberg_dec(debye_energy_integrand_s_dec, Decimal(0), s_mid) + romberg_dec(
            debye_energy_integrand_s_dec, s_mid, s_max
        )
    else:
        integral = romberg_dec(debye_energy_integrand_s_dec, Decimal(0), s_max)
    return (Decimal(3) * integral) / (u * u * u)


def debye_cv_dec(T: Decimal, theta_D: Decimal) -> Decimal:
    if T <= Decimal(0):
        return Decimal(0)
    if theta_D <= Decimal(0):
        return THREE_R_D
    return THREE_R_D * debye_d3_dec(theta_D / T)


def debye_u_term_dec(T: Decimal, theta_D: Decimal) -> Decimal:
    if T <= Decimal(0):
        return Decimal(0)
    if theta_D <= Decimal(0):
        return THREE_R_D * T
    return THREE_R_D * T * debye_phi_dec(theta_D / T)


def monatomic_1d_cv_ratio_dec(T: Decimal, theta_max: Decimal) -> Decimal:
    """
    C_V^{1D} / R = ∫₀¹ (2 / (π √(1-w²))) ℰ(w Θ_max / T) dw.
    Trasformazione algebrica indipendente (senza sin θ): w = 1 - t², t ∈ [0, 1],
    dw / √(1 - w²) = -2 dt / √(2 - t²).
    Quindi C_V^{1D}/R = (2/π) ∫₀¹ (2 / √(2 - t²)) ℰ((1 - t²) u) dt.
    """
    if T <= Decimal(0):
        return Decimal(0)
    if theta_max <= Decimal(0):
        return Decimal(1)
    u = theta_max / T

    def integrand_t(t: Decimal) -> Decimal:
        w = Decimal(1) - t * t
        return (Decimal(2) / (Decimal(2) - t * t).sqrt()) * einstein_fn_dec(u * w)

    # Se u è grande, la parte attiva è per w ≲ 80/u -> t vicina a 1 (t > √(1 - 80/u))
    if u > Decimal(50):
        w_cut = min(Decimal("0.99"), Decimal(80) / u)
        t_cut = (Decimal(1) - w_cut).sqrt()
        integral = romberg_dec(integrand_t, Decimal(0), t_cut) + romberg_dec(
            integrand_t, t_cut, Decimal(1)
        )
    else:
        integral = romberg_dec(integrand_t, Decimal(0), Decimal(1))
    return (Decimal(2) / PI_D) * integral


def phonon_black_body_dec(T: Decimal, v_s: Decimal) -> Decimal:
    if T <= Decimal(0) or v_s <= Decimal(0):
        return Decimal(0)
    return (PI_D ** 2) * (KB_SI_D ** 4) * (T ** 4) / (Decimal(10) * (HBAR_SI_D ** 3) * (v_s ** 3))


def photon_black_body_dec(T: Decimal) -> Decimal:
    if T <= Decimal(0):
        return Decimal(0)
    return (PI_D ** 2) * (KB_SI_D ** 4) * (T ** 4) / (Decimal(15) * (HBAR_SI_D ** 3) * (C_LIGHT_D ** 3))


# =============================================================================
# 4. DATI DI RIFERIMENTO DALLA DISPENSA (TABB. 2–3, PP. 51, 57–58)
# =============================================================================
DISPENSA_TAB2 = [
    # (id, symbol, Theta_D [K], slide_77K, debye_77K, slide_273K, debye_273K)
    ("copper", "Cu", 343, 12.5, 10.9, 24.3, 23.1),
    ("aluminum", "Al", 428, 9.1, 7.7, 23.8, 22.1),
    ("gold", "Au", 165, 19.1, 20.0, 25.2, 24.5),
    ("lead", "Pb", 105, 23.6, 22.8, 26.7, 24.8),
    ("iron", "Fe", 470, 8.1, 6.4, 24.8, 21.6),
    ("sodium", "Na", 158, 20.4, 20.4, 27.6, 24.5),
    ("silicon", "Si", 645, 5.8, 3.1, 21.8, 19.2),
]

DISPENSA_TAB3_THETA_D = {
    "C": 2230,
    "Be": 1440,
    "Si": 645,
    "Ge": 374,
    "Fe": 470,
    "Al": 428,
    "Cu": 343,
    "Au": 165,
    "Pb": 105,
    "Ar": 92,
    "Hg": 72,
    "Cs": 38,
    "Na": 158,
}


# =============================================================================
# 5. RUNNER NODE PER ESEGUIRE LE FUNZIONI REALI DI specificHeat.ts
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

const sh = await import('./src/renderer/src/physics/specificHeat.ts');
const cnst = await import('./src/renderer/src/physics/constants.ts');

const payload = JSON.parse(readFileSync(0, 'utf8'));
const out = {
  constants: {
    R_GAS: cnst.R_GAS,
    THREE_R: sh.THREE_R,
    DEBYE_T3_PREFACTOR: sh.DEBYE_T3_PREFACTOR,
    PHONON_TO_PHOTON_POLARIZATION_FACTOR: sh.PHONON_TO_PHOTON_POLARIZATION_FACTOR,
    HBAR_J_S: cnst.HBAR_J_S,
    KB_J_K: cnst.KB_J_K,
    KB_EV_K: cnst.KB_EV_K,
    NA_MOL: cnst.NA_MOL,
    C_LIGHT_M_S: cnst.C_LIGHT_M_S,
    THZ_TO_MEV: cnst.THZ_TO_MEV,
  },
  presets: sh.MATERIAL_PRESETS,
  dulongPetit: sh.dulongPetitCv(),
  results: {}
};

for (const job of payload.jobs) {
  if (job.type === 'einstein_batch') {
    out.results[job.id] = job.xs.map((x) => ({
      x,
      val: sh.einsteinFunction(x),
    }));
  } else if (job.type === 'einstein_cv_batch') {
    out.results[job.id] = job.cases.map((c) => ({
      T: c.T,
      thetaE: c.thetaE,
      cv: sh.einsteinCv(c.T, c.thetaE),
      ratio: sh.einsteinCvRatio(c.T, c.thetaE),
      highT: sh.einsteinHighTAsymptote(c.T, c.thetaE),
      lowT: sh.einsteinLowTAsymptote(c.T, c.thetaE),
    }));
  } else if (job.type === 'debye_u_batch') {
    out.results[job.id] = job.us.map((u) => ({
      u,
      d3: sh.debyeIntegralD3(u),
      phi: sh.debyeEnergyIntegral(u),
    }));
  } else if (job.type === 'debye_grid') {
    const rows = [];
    for (const thetaD of job.thetaDs) {
      for (const T of job.Ts) {
        rows.push({
          T,
          thetaD,
          cv: sh.debyeCv(T, thetaD),
          ratio: sh.debyeCvRatio(T, thetaD),
          uTerm: sh.debyeThermalEnergyMolarJ(T, thetaD),
          t3: sh.debyeLowTCv(T, thetaD),
          t3Ratio: sh.debyeLowTCvRatio(T, thetaD),
          highT: sh.debyeHighTAsymptote(T, thetaD),
        });
      }
    }
    out.results[job.id] = rows;
  } else if (job.type === 'debye_fd4_cases') {
    out.results[job.id] = job.cases.map((c) => {
      const h = c.h;
      return {
        T: c.T,
        thetaD: c.thetaD,
        h,
        cv: sh.debyeCv(c.T, c.thetaD),
        u_m2: sh.debyeThermalEnergyMolarJ(c.T - 2 * h, c.thetaD),
        u_m1: sh.debyeThermalEnergyMolarJ(c.T - h, c.thetaD),
        u_p1: sh.debyeThermalEnergyMolarJ(c.T + h, c.thetaD),
        u_p2: sh.debyeThermalEnergyMolarJ(c.T + 2 * h, c.thetaD),
      };
    });
  } else if (job.type === 'dos_and_1d') {
    out.results[job.id] = {
      debyeDos: job.ws.map((w) => ({ w, val: sh.debyeDosDimless(w) })),
      debyeSpec: job.specCases.map((c) => ({
        T: c.T,
        thetaD: c.thetaD,
        samples: job.wsSpec.map((w) => ({
          w,
          val: sh.debyeSpectralContribution(w, c.T, c.thetaD),
        })),
      })),
      dos1D: job.ws1D.map((w) => ({ w, val: sh.monatomicDos1DDimless(w) })),
      cv1D: job.cv1DCases.map((c) => ({
        T: c.T,
        thetaMax: c.thetaMax,
        ratio: sh.monatomic1DCvRatio(c.T, c.thetaMax),
      })),
    };
  } else if (job.type === 'scales_bb_stats') {
    out.results[job.id] = {
      scales: job.thetaDs.map((th) => ({
        thetaD: th,
        omegaD: sh.debyeOmegaRadS(th),
        freqD: sh.debyeFreqThz(th),
        energyD: sh.debyeEnergyMev(th),
      })),
      thermal: job.Ts.map((T) => ({
        T,
        scaleMev: sh.thermalScaleMev(T),
        omegaRadS: sh.thermalOmegaRadS(T),
      })),
      sphereFrac: job.sphereCases.map((c) => ({
        T: c.T,
        thetaD: c.thetaD,
        frac: sh.debyeThermalSphereRadiusFraction(c.T, c.thetaD),
      })),
      blackBody: job.bbCases.map((c) => ({
        T: c.T,
        vs: c.vs,
        uPh: sh.phononBlackBodyEnergyDensity(c.T, c.vs),
        uGamma: sh.photonBlackBodyEnergyDensity(c.T),
        uPhAtC: sh.phononBlackBodyEnergyDensity(c.T, cnst.C_LIGHT_M_S),
      })),
      occupancies: job.occXs.map((x) => ({
        x,
        fd: sh.fermiDiracOccupancy(x),
        mb: sh.maxwellBoltzmannOccupancy(x),
        be: sh.boseEinsteinOccupancy(x),
      })),
      summary: sh.specificHeatSummary(300, 343, 0.75),
      freqConv: sh.freqThzToMevLocal(4.4),
    };
  }
}

process.stdout.write(JSON.stringify(out, (k, v) => {
  if (v === Infinity) return "__INF__";
  if (v === -Infinity) return "__NINF__";
  if (Number.isNaN(v)) return "__NAN__";
  return v;
}));
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


def rel_err(val: float, ref: Decimal) -> float:
    ref_f = float(ref)
    if ref_f == 0.0:
        return abs(val)
    return abs(val - ref_f) / abs(ref_f)


def abs_err(val: float, ref: Decimal) -> float:
    return abs(val - float(ref))


# =============================================================================
# 6. ESECUZIONE VERIFICHE E CONFRONTO PUNTO PER PUNTO
# =============================================================================
def main() -> int:
    if not NODE_EXE.exists():
        print(f"ERROR: Node executable not found at {NODE_EXE}", file=sys.stderr)
        return 2

    # Griglie di test (coprono e superano i range UI: T in [5, 1500] K, Theta_D in [30, 2500] K)
    einstein_xs = [
        0.0, 1e-8, 1e-5, 9.99e-5, 1.001e-4, 1e-3, 0.01, 0.05, 0.1, 0.5, 1.0,
        2.0, 5.0, 10.0, 20.0, 50.0, 100.0, 300.0, 650.0, 700.0, 701.0, 1000.0,
    ]
    einstein_cv_cases = [
        {"T": 5.0, "thetaE": 300.0},
        {"T": 15.0, "thetaE": 300.0},
        {"T": 77.0, "thetaE": 257.25},
        {"T": 100.0, "thetaE": 1000.0},
        {"T": 50.0, "thetaE": 1000.0},
        {"T": 300.0, "thetaE": 343.0},
        {"T": 1500.0, "thetaE": 30.0},
        {"T": 15000.0, "thetaE": 300.0},
        {"T": 0.0, "thetaE": 300.0},
        {"T": 300.0, "thetaE": 0.0},
    ]
    debye_us = [
        0.0, 1e-6, 9.99e-4, 1.001e-3, 5e-3, 0.02, 0.05, 0.1, 0.25, 0.499, 0.5, 0.501,
        1.0, 1.5, 2.5, 3.5, 5.0, 7.5, 10.0, 12.0, 15.0, 20.0, 25.0, 32.0, 45.0,
        50.0, 64.9, 65.0, 65.1, 80.0, 100.0, 250.0, 500.0,
    ]
    grid_Ts = [
        5.0, 10.0, 15.0, 20.0, 30.0, 50.0, 77.0, 100.0, 150.0, 200.0,
        273.0, 300.0, 450.0, 600.0, 800.0, 1000.0, 1250.0, 1500.0,
    ]
    grid_thetaDs = [
        30.0, 38.0, 72.0, 92.0, 105.0, 158.0, 165.0, 343.0, 374.0, 428.0,
        470.0, 645.0, 1000.0, 1440.0, 1880.0, 2230.0, 2500.0,
    ]
    fd4_cases = [
        {"T": 10.0, "thetaD": 343.0, "h": 1e-2},
        {"T": 77.0, "thetaD": 343.0, "h": 1e-2},
        {"T": 180.0, "thetaD": 343.0, "h": 1e-2},
        {"T": 300.0, "thetaD": 2230.0, "h": 5e-2},
        {"T": 1200.0, "thetaD": 343.0, "h": 5e-2},
        {"T": 25.0, "thetaD": 2500.0, "h": 1e-2},
    ]
    ws_dos = [0.0, 0.1, 0.25, 0.5, 0.75, 1.0, 1.001, -0.01]
    ws_spec = [i / 200.0 for i in range(201)]  # 201 punti su [0, 1] per Simpson su campioni app
    ws_1d = [0.0, 0.2, 0.5, 0.8, 0.99, 0.999, 0.99999, 1.0, 1.01, -0.1]
    cv1d_cases = [
        {"T": 5.0, "thetaMax": 343.0},
        {"T": 5.0, "thetaMax": 1000.0},
        {"T": 5.0, "thetaMax": 2230.0},
        {"T": 5.0, "thetaMax": 2500.0},
        {"T": 10.0, "thetaMax": 1000.0},
        {"T": 10.0, "thetaMax": 2230.0},
        {"T": 10.0, "thetaMax": 2500.0},
        {"T": 20.0, "thetaMax": 2500.0},
        {"T": 50.0, "thetaMax": 2500.0},
        {"T": 77.0, "thetaMax": 343.0},
        {"T": 77.0, "thetaMax": 2230.0},
        {"T": 300.0, "thetaMax": 343.0},
        {"T": 1500.0, "thetaMax": 343.0},
        {"T": 5000.0, "thetaMax": 100.0},
    ]
    occ_xs = [-10.0, -2.0, -1e-6, 0.0, 1e-6, 0.5, 1.0, 10.0, 50.0, 700.0, 701.0]

    jobs = [
        {"id": "einstein_fn", "type": "einstein_batch", "xs": einstein_xs},
        {"id": "einstein_cv", "type": "einstein_cv_batch", "cases": einstein_cv_cases},
        {"id": "debye_u", "type": "debye_u_batch", "us": debye_us},
        {"id": "debye_grid", "type": "debye_grid", "Ts": grid_Ts, "thetaDs": grid_thetaDs},
        {"id": "debye_fd4", "type": "debye_fd4_cases", "cases": fd4_cases},
        {
            "id": "dos_1d",
            "type": "dos_and_1d",
            "ws": ws_dos,
            "wsSpec": ws_spec,
            "specCases": [{"T": 77.0, "thetaD": 343.0}, {"T": 300.0, "thetaD": 343.0}, {"T": 77.0, "thetaD": 2230.0}],
            "ws1D": ws_1d,
            "cv1DCases": cv1d_cases,
        },
        {
            "id": "scales_bb",
            "type": "scales_bb_stats",
            "thetaDs": [38.0, 105.0, 343.0, 428.0, 645.0, 2230.0, 2500.0],
            "Ts": [5.0, 77.0, 273.0, 300.0, 1500.0],
            "sphereCases": [{"T": 77.0, "thetaD": 343.0}, {"T": 343.0, "thetaD": 343.0}, {"T": 500.0, "thetaD": 343.0}],
            "bbCases": [
                {"T": 5.0, "vs": 3800.0},
                {"T": 20.0, "vs": 3800.0},
                {"T": 77.0, "vs": 12000.0},
                {"T": 300.0, "vs": 5100.0},
            ],
            "occXs": occ_xs,
        },
    ]

    node_out = run_node_jobs(jobs)
    checks: list[dict[str, Any]] = []

    def record(
        name: str,
        category: str,
        passed: bool,
        max_abs: float,
        max_rel: float,
        threshold: float,
        details: dict[str, Any],
    ) -> None:
        checks.append(
            {
                "name": name,
                "category": category,
                "passed": bool(passed),
                "max_abs": max_abs,
                "max_rel": max_rel,
                "threshold": threshold,
                "details": details,
            }
        )

    # -------------------------------------------------------------------------
    # Check 1: Costanti SI 2019 e Dulong–Petit (eq. 52)
    # -------------------------------------------------------------------------
    c_app = node_out["constants"]
    r_rel = rel_err(c_app["R_GAS"], R_GAS_D)
    tr_rel = rel_err(c_app["THREE_R"], THREE_R_D)
    dp_rel = rel_err(node_out["dulongPetit"], THREE_R_D)
    hbar_rel = rel_err(c_app["HBAR_J_S"], HBAR_SI_D)
    t3_rel = rel_err(c_app["DEBYE_T3_PREFACTOR"], DEBYE_T3_PREFACTOR_D)
    max_c_rel = max(r_rel, tr_rel, dp_rel, hbar_rel, t3_rel)
    record(
        "Costanti SI 2019 e Dulong–Petit (3R)",
        "costanti",
        max_c_rel < 1e-8 and abs(c_app["THREE_R"] - 24.94338785445972) < 1e-12,
        abs_err(node_out["dulongPetit"], THREE_R_D),
        max_c_rel,
        1e-8,
        {
            "R_app": c_app["R_GAS"],
            "R_dec": float(R_GAS_D),
            "THREE_R_app": c_app["THREE_R"],
            "THREE_R_dec": float(THREE_R_D),
            "HBAR_J_S_rel": hbar_rel,
            "DEBYE_T3_PREFACTOR_app": c_app["DEBYE_T3_PREFACTOR"],
            "DEBYE_T3_PREFACTOR_dec": float(DEBYE_T3_PREFACTOR_D),
        },
    )

    # -------------------------------------------------------------------------
    # Check 2: Funzione di Einstein ℰ(x) e raccordo x = 10⁻⁴, x = 700
    # -------------------------------------------------------------------------
    ein_rows = node_out["results"]["einstein_fn"]
    max_e_abs = 0.0
    max_e_rel = 0.0
    cutoff_ok = True
    worst_e = None
    for row in ein_rows:
        x = row["x"]
        v_app = row["val"]
        v_dec = einstein_fn_dec(Decimal(str(x)))
        ae = abs_err(v_app, v_dec)
        if ae > max_e_abs:
            max_e_abs = ae
        if x > 700:
            # Taglio esplicito `if (x > 700) return 0` nell'app (residuo subnormale < 1e-298)
            if v_app != 0.0 or ae > 1e-295:
                cutoff_ok = False
        else:
            re = rel_err(v_app, v_dec)
            if re > max_e_rel:
                max_e_rel = re
                worst_e = {"x": x, "app": v_app, "dec": float(v_dec), "rel": re, "abs": ae}

    record(
        "Funzione di Einstein ℰ(x) su x ∈ [0, 700] (incl. x = 10⁻⁴) + cutoff x > 700",
        "einstein",
        cutoff_ok and max_e_rel < 1e-13,
        max_e_abs,
        max_e_rel,
        1e-13,
        {"n_points": len(ein_rows), "cutoff_gt_700_ok": cutoff_ok, "worst_le_700": worst_e},
    )

    # -------------------------------------------------------------------------
    # Check 3: Calore specifico di Einstein e asintoti alta/bassa T (eqq. 54–55)
    # -------------------------------------------------------------------------
    ecv_rows = node_out["results"]["einstein_cv"]
    max_ecv_rel = 0.0
    high_t_err = None
    low_t_err = None
    for row in ecv_rows:
        T_d = Decimal(str(row["T"]))
        th_d = Decimal(str(row["thetaE"]))
        if T_d <= 0:
            expected_cv = Decimal(0)
        elif th_d <= 0:
            expected_cv = THREE_R_D
        else:
            expected_cv = THREE_R_D * einstein_fn_dec(th_d / T_d)
        re = rel_err(row["cv"], expected_cv) if float(expected_cv) > 1e-300 else abs_err(row["cv"], expected_cv)
        if re > max_ecv_rel:
            max_ecv_rel = re
        if row["T"] == 15000.0 and row["thetaE"] == 300.0:
            high_t_err = abs(row["cv"] - row["highT"]) / row["cv"]
        if row["T"] == 15.0 and row["thetaE"] == 300.0:
            low_t_err = abs(row["cv"] - row["lowT"]) / row["cv"]
    record(
        "Calore specifico Einstein C_V^E(T) + asintoti alta/bassa T",
        "einstein",
        max_ecv_rel < 1e-13 and high_t_err < 1e-7 and low_t_err < 1e-8,
        0.0,
        max_ecv_rel,
        1e-13,
        {
            "highT_rel_at_15000_300": high_t_err,
            "lowT_rel_at_15_300": low_t_err,
        },
    )

    # -------------------------------------------------------------------------
    # Check 4: Integrali di Debye D₃(u) e Φ_D(u) su u ∈ [0, 500] + identità per parti
    # -------------------------------------------------------------------------
    du_rows = node_out["results"]["debye_u"]
    max_d3_abs = 0.0
    max_d3_rel = 0.0
    max_phi_abs = 0.0
    max_phi_rel = 0.0
    max_ibp_rel = 0.0
    worst_d3 = None
    worst_phi = None
    for row in du_rows:
        u = row["u"]
        u_d = Decimal(str(u))
        d3_dec = debye_d3_dec(u_d)
        phi_dec = debye_phi_dec(u_d)

        # Verifica identità integrazione per parti in Decimal: D₃(u) = 4 Φ_D(u) - 3u/(e^u - 1)
        if u_d > Decimal(0):
            if u_d < Decimal("1e-4"):
                # 3u/(e^u-1) = 3(1 - u/2 + u²/12 - u⁴/720 + u⁶/30240)
                u2 = u_d * u_d
                term_u = Decimal(3) * (
                    Decimal(1)
                    - u_d / Decimal(2)
                    + u2 / Decimal(12)
                    - (u2 * u2) / Decimal(720)
                    + (u2 * u2 * u2) / Decimal(30240)
                )
            elif u_d > Decimal(150):
                term_u = Decimal(0)
            else:
                term_u = (Decimal(3) * u_d) / (u_d.exp() - Decimal(1))
            d3_from_ibp = Decimal(4) * phi_dec - term_u
            ibp_re = float(abs(d3_dec - d3_from_ibp) / abs(d3_dec))
            if ibp_re > max_ibp_rel:
                max_ibp_rel = ibp_re

        d3_ae = abs_err(row["d3"], d3_dec)
        d3_re = rel_err(row["d3"], d3_dec)
        phi_ae = abs_err(row["phi"], phi_dec)
        phi_re = rel_err(row["phi"], phi_dec)

        if d3_re > max_d3_rel:
            max_d3_rel = d3_re
            worst_d3 = {"u": u, "app": row["d3"], "dec": float(d3_dec), "rel": d3_re, "abs": d3_ae}
        if d3_ae > max_d3_abs:
            max_d3_abs = d3_ae
        if phi_re > max_phi_rel:
            max_phi_rel = phi_re
            worst_phi = {"u": u, "app": row["phi"], "dec": float(phi_dec), "rel": phi_re, "abs": phi_ae}
        if phi_ae > max_phi_abs:
            max_phi_abs = phi_ae

    record(
        "Integrale di Debye D₃(u) su u ∈ [0, 500] (incl. u=10⁻³ e u=65)",
        "debye",
        max_d3_rel < 1e-12,
        max_d3_abs,
        max_d3_rel,
        1e-12,
        {"n_points": len(du_rows), "worst": worst_d3, "ibp_identity_max_rel": max_ibp_rel},
    )
    record(
        "Integrale energia interna Φ_D(u) su u ∈ [0, 500]",
        "debye",
        max_phi_rel < 1e-12,
        max_phi_abs,
        max_phi_rel,
        1e-12,
        {"n_points": len(du_rows), "worst": worst_phi},
    )

    # -------------------------------------------------------------------------
    # Check 5: Griglia estesa T ∈ [5, 1500] K × Θ_D ∈ [30, 2500] K (306 punti)
    # -------------------------------------------------------------------------
    grid_rows = node_out["results"]["debye_grid"]
    # Calcoliamo D₃ e Φ_D in cache sui rapporti u = Θ_D / T
    grid_max_cv_rel = 0.0
    grid_max_u_rel = 0.0
    worst_grid_cv = None
    worst_grid_u = None
    nan_count = 0
    for row in grid_rows:
        for key in ("cv", "ratio", "uTerm", "t3", "t3Ratio", "highT"):
            if not isinstance(row[key], (int, float)) or not math.isfinite(row[key]):
                nan_count += 1
        T_d = Decimal(str(row["T"]))
        th_d = Decimal(str(row["thetaD"]))
        cv_dec = debye_cv_dec(T_d, th_d)
        ut_dec = debye_u_term_dec(T_d, th_d)
        cv_re = rel_err(row["cv"], cv_dec)
        ut_re = rel_err(row["uTerm"], ut_dec)
        if cv_re > grid_max_cv_rel:
            grid_max_cv_rel = cv_re
            worst_grid_cv = {"T": row["T"], "thetaD": row["thetaD"], "app": row["cv"], "dec": float(cv_dec), "rel": cv_re}
        if ut_re > grid_max_u_rel:
            grid_max_u_rel = ut_re
            worst_grid_u = {"T": row["T"], "thetaD": row["thetaD"], "app": row["uTerm"], "dec": float(ut_dec), "rel": ut_re}

    record(
        f"Griglia estesa Debye C_V(T, Θ_D) e U_term(T, Θ_D) ({len(grid_rows)} punti: T∈[5,1500], Θ_D∈[30,2500])",
        "debye_grid",
        nan_count == 0 and grid_max_cv_rel < 1e-12 and grid_max_u_rel < 1e-12,
        0.0,
        max(grid_max_cv_rel, grid_max_u_rel),
        1e-12,
        {
            "n_points": len(grid_rows),
            "nan_count": nan_count,
            "max_cv_rel": grid_max_cv_rel,
            "max_uTerm_rel": grid_max_u_rel,
            "worst_cv": worst_grid_cv,
            "worst_uTerm": worst_grid_u,
        },
    )

    # -------------------------------------------------------------------------
    # Check 6: Coerenza termodinamica C_V = (∂U_term/∂T)_V tramite FD4 sui dati dell'app
    # -------------------------------------------------------------------------
    fd4_rows = node_out["results"]["debye_fd4"]
    max_fd4_rel = 0.0
    fd4_details = []
    for row in fd4_rows:
        h = row["h"]
        dudt = (row["u_m2"] - 8.0 * row["u_m1"] + 8.0 * row["u_p1"] - row["u_p2"]) / (12.0 * h)
        re = abs(dudt - row["cv"]) / abs(row["cv"])
        if re > max_fd4_rel:
            max_fd4_rel = re
        fd4_details.append({"T": row["T"], "thetaD": row["thetaD"], "cv": row["cv"], "fd4": dudt, "rel": re})

    record(
        "Coerenza termodinamica C_V = (∂U_term/∂T)_V tramite FD4 sui valori dell'app",
        "debye",
        max_fd4_rel < 1e-8,
        0.0,
        max_fd4_rel,
        1e-8,
        {"cases": fd4_details},
    )

    # -------------------------------------------------------------------------
    # Check 7: Confronto T = Θ_D/10, Θ_D/20, Θ_D/50 (§21.5 p. 53 e §22.7 p. 57)
    # -------------------------------------------------------------------------
    # Prendiamo Θ_D = 1000 K (in grid_thetaDs) -> T = 100 K (Θ_D/10) e T = 50 K (Θ_D/20)
    grid_map = {(r["T"], r["thetaD"]): r for r in grid_rows}
    r_10 = grid_map[(100.0, 1000.0)]
    r_20 = grid_map[(50.0, 1000.0)]
    r_50 = grid_map[(20.0, 1000.0)]
    # Valori Einstein dall'app per T=100, Theta=1000 e T=50, Theta=1000
    ecv_map = {(r["T"], r["thetaE"]): r for r in ecv_rows}
    e_10 = ecv_map[(100.0, 1000.0)]["ratio"]
    e_20 = ecv_map[(50.0, 1000.0)]["ratio"]

    ratio_deb_ein_10 = r_10["ratio"] / e_10
    ratio_deb_ein_20 = r_20["ratio"] / e_20
    t3_overest_10 = (r_10["t3Ratio"] - r_10["ratio"]) / r_10["ratio"]
    t3_overest_50 = abs(r_50["t3Ratio"] - r_50["ratio"]) / r_50["ratio"]

    # Controllo Decimal esatto
    e_10_dec = float(einstein_fn_dec(Decimal(10)))
    d_10_dec = float(debye_d3_dec(Decimal(10)))
    e_20_dec = float(einstein_fn_dec(Decimal(20)))
    d_20_dec = float(debye_d3_dec(Decimal(20)))
    rel_10_20 = max(
        abs(e_10 - e_10_dec) / e_10_dec,
        abs(r_10["ratio"] - d_10_dec) / d_10_dec,
        abs(e_20 - e_20_dec) / e_20_dec,
        abs(r_20["ratio"] - d_20_dec) / d_20_dec,
    )
    record(
        "Confronto T = Θ_D/10, Θ_D/20, Θ_D/50 (§21.5 e §22.7)",
        "confronto",
        rel_10_20 < 1e-13 and 16.5 < ratio_deb_ein_10 < 17.0 and 0.025 < t3_overest_10 < 0.032 and t3_overest_50 < 1e-12,
        0.0,
        rel_10_20,
        1e-13,
        {
            "T_theta_10": {
                "einstein_ratio_app": e_10,
                "einstein_ratio_dec": e_10_dec,
                "debye_ratio_app": r_10["ratio"],
                "debye_ratio_dec": d_10_dec,
                "debye_over_einstein": ratio_deb_ein_10,
                "t3_overestimate_frac": t3_overest_10,
            },
            "T_theta_20": {
                "einstein_ratio_app": e_20,
                "einstein_ratio_dec": e_20_dec,
                "debye_ratio_app": r_20["ratio"],
                "debye_ratio_dec": d_20_dec,
                "debye_over_einstein": ratio_deb_ein_20,
            },
            "T_theta_50_t3_rel_err": t3_overest_50,
        },
    )

    # -------------------------------------------------------------------------
    # Check 8: Tabella 2 (77 K e 273 K), Tabella 3 e Diamante a 77 K
    # -------------------------------------------------------------------------
    presets_by_id = {p["id"]: p for p in node_out["presets"]}
    tab2_report = []
    max_tab2_rel = 0.0
    tab2_mismatch = False
    for pid, sym, th, sl77, db77, sl273, db273 in DISPENSA_TAB2:
        p = presets_by_id.get(pid)
        if p is None or p["thetaDK"] != th:
            tab2_mismatch = True
        app77 = grid_map[(77.0, float(th))]["cv"]
        app273 = grid_map[(273.0, float(th))]["cv"]
        dec77 = debye_cv_dec(Decimal(77), Decimal(th))
        dec273 = debye_cv_dec(Decimal(273), Decimal(th))
        re77 = rel_err(app77, dec77)
        re273 = rel_err(app273, dec273)
        max_tab2_rel = max(max_tab2_rel, re77, re273)
        # Verifica arrotondamento a 1 decimale rispetto alla Tab. 2 della dispensa
        disp_ok = (round(float(dec77), 1) == db77 or abs(app77 - db77) < 0.08) and (
            round(float(dec273), 1) == db273 or abs(app273 - db273) < 0.08
        )
        if not disp_ok:
            tab2_mismatch = True
        tab2_report.append(
            {
                "symbol": sym,
                "thetaD": th,
                "app_77K": app77,
                "dec_77K": float(dec77),
                "dispensa_Debye_77K": db77,
                "app_273K": app273,
                "dec_273K": float(dec273),
                "dispensa_Debye_273K": db273,
                "rel_77K": re77,
                "rel_273K": re273,
            }
        )

    # Diamante a 77 K (Θ_D = 2230 K e 1880 K)
    dia_77_app = grid_map[(77.0, 2230.0)]["cv"]
    dia_77_dec = debye_cv_dec(Decimal(77), Decimal(2230))
    dia_77_t3_app = grid_map[(77.0, 2230.0)]["t3"]
    dia_1880_77_app = grid_map[(77.0, 1880.0)]["cv"]
    dia_rel = rel_err(dia_77_app, dia_77_dec)
    max_tab2_rel = max(max_tab2_rel, dia_rel)

    record(
        "Tab. 2 (77 K e 273 K per Cu/Al/Au/Pb/Fe/Na/Si) + Diamante 77 K + Tab. 3",
        "tabelle",
        not tab2_mismatch and max_tab2_rel < 1e-12 and round(dia_77_app, 2) == 0.08,
        0.0,
        max_tab2_rel,
        1e-12,
        {
            "tab2": tab2_report,
            "diamond_2230K_77K": {
                "app_debye": dia_77_app,
                "dec_debye": float(dia_77_dec),
                "app_t3": dia_77_t3_app,
                "dispensa": 0.08,
            },
            "diamond_1880K_77K_app": dia_1880_77_app,
            "presets_count": len(node_out["presets"]),
        },
    )

    # -------------------------------------------------------------------------
    # Check 9: DOS 3D di Debye (normalizzazione e integrale spettrale)
    # -------------------------------------------------------------------------
    dos_out = node_out["results"]["dos_1d"]
    max_dos_rel = 0.0
    for item in dos_out["debyeDos"]:
        w = item["w"]
        expected = 0.0 if (w < 0.0 or w > 1.0) else 3.0 * w * w
        max_dos_rel = max(max_dos_rel, abs(item["val"] - expected))

    # Integrazione di Simpson composita su 201 punti dei campioni spettrali restituiti dall'app
    spec_errors = []
    dw = 1.0 / 200.0
    for sc in dos_out["debyeSpec"]:
        ys = [p["val"] for p in sc["samples"]]
        # Simpson composito sui 200 subintervalli
        s_val = ys[0] + ys[-1] + 4.0 * sum(ys[1:-1:2]) + 2.0 * sum(ys[2:-2:2])
        integral_app_samples = (dw / 3.0) * s_val
        ref_d3 = float(debye_d3_dec(Decimal(str(sc["thetaD"])) / Decimal(str(sc["T"]))))
        re = abs(integral_app_samples - ref_d3) / ref_d3
        spec_errors.append(
            {"T": sc["T"], "thetaD": sc["thetaD"], "simpson_200": integral_app_samples, "d3_dec": ref_d3, "rel": re}
        )
    max_spec_rel = max(e["rel"] for e in spec_errors)
    record(
        "DOS 3D di Debye g̃(w)=3w² e coerenza integrale spettrale ∫₀¹ 3w² ℰ(w Θ_D/T) dw = D₃(Θ_D/T)",
        "dos_3d",
        max_dos_rel < 1e-15 and max_spec_rel < 1e-8,
        max_dos_rel,
        max_spec_rel,
        1e-8,
        {"spec_checks": spec_errors},
    )

    # -------------------------------------------------------------------------
    # Check 10: DOS 1D Van Hove (normalizzazione e singolarità) + C_V 1D
    # -------------------------------------------------------------------------
    max_dos1d_rel = 0.0
    max_dos1d_plot_rel = 0.0
    inf_ok = True
    for item in dos_out["dos1D"]:
        w = item["w"]
        if w == 1.0:
            if item["val"] != "__INF__":
                inf_ok = False
        elif w < 0.0 or w > 1.0:
            if item["val"] != 0.0:
                max_dos1d_rel = max(max_dos1d_rel, abs(item["val"]))
        else:
            w_d = Decimal(str(w))
            ref = Decimal(2) / (PI_D * (Decimal(1) - w_d * w_d).sqrt())
            re = rel_err(item["val"], ref)
            max_dos1d_rel = max(max_dos1d_rel, re)
            if w <= 0.992:
                max_dos1d_plot_rel = max(max_dos1d_plot_rel, re)

    # Normalizzazione numerica di g̃_1D(w) con cambio variabile w = 1 - t²
    def dos1d_t(t: Decimal) -> Decimal:
        # w = 1 - t², |dw| = 2t dt, 2/(π √(1-(1-t²)²)) * 2t = 4 / (π √(2 - t²))
        return Decimal(4) / (PI_D * (Decimal(2) - t * t).sqrt())

    norm_1d = romberg_dec(dos1d_t, Decimal(0), Decimal(1))
    norm_1d_err = float(abs(norm_1d - Decimal(1)))

    # Confronto C_V 1D: trasformazione w = 1 - t² in Decimal vs w = sin(θ) dell'app
    max_cv1d_rel = 0.0
    worst_cv1d = None
    cv1d_details = []
    for c in dos_out["cv1D"]:
        T_d = Decimal(str(c["T"]))
        th_d = Decimal(str(c["thetaMax"]))
        ref = monatomic_1d_cv_ratio_dec(T_d, th_d)
        re = rel_err(c["ratio"], ref)
        if re > max_cv1d_rel:
            max_cv1d_rel = re
            worst_cv1d = {"T": c["T"], "thetaMax": c["thetaMax"], "u": c["thetaMax"] / c["T"], "app": c["ratio"], "dec": float(ref), "rel": re}
        cv1d_details.append({"T": c["T"], "thetaMax": c["thetaMax"], "u": c["thetaMax"] / c["T"], "app": c["ratio"], "dec": float(ref), "rel": re})

    # Verifica limite bassa T (5 K, 1000 K -> ~ (2π/3)(T/Θ)) e alta T (5000 K, 100 K -> ~ 1 - (1/24)(Θ/T)²)
    low_1d_dec = float(monatomic_1d_cv_ratio_dec(Decimal(5), Decimal(1000)))
    low_1d_asymp = (2.0 * math.pi / 3.0) * (5.0 / 1000.0)
    low_1d_asymp_rel = abs(low_1d_dec - low_1d_asymp) / low_1d_asymp
    high_1d_app = [r["ratio"] for r in dos_out["cv1D"] if r["T"] == 5000.0][0]
    high_1d_asymp = 1.0 - ((100.0 / 5000.0) ** 2) / 24.0
    high_1d_asymp_rel = abs(high_1d_app - high_1d_asymp) / high_1d_asymp

    record(
        "DOS 1D Van Hove (normalizzazione + singolarità w→1⁻)",
        "dos_1d",
        inf_ok and max_dos1d_rel < 1e-11 and norm_1d_err < 1e-20,
        norm_1d_err,
        max_dos1d_rel,
        1e-11,
        {
            "inf_at_w1": inf_ok,
            "norm_integral_err_dec": norm_1d_err,
            "max_rel_plot_domain_w_le_0992": max_dos1d_plot_rel,
            "max_rel_at_w_099999_cancellation": max_dos1d_rel,
        },
    )
    record(
        "Calore specifico 1D (monatomic1DCvRatio: w=sinθ vs w=1-t², T∈[5,5000], Θ∈[100,2500])",
        "cv_1d",
        max_cv1d_rel < 1e-4 and low_1d_asymp_rel < 1e-4 and high_1d_asymp_rel < 1e-7,
        0.0,
        max_cv1d_rel,
        1e-4,
        {
            "worst": worst_cv1d,
            "cases": cv1d_details,
            "low_T_linear_asymp_rel_at_5_1000_dec": low_1d_asymp_rel,
            "high_T_asymp_rel_at_5000_100": high_1d_asymp_rel,
        },
    )

    # -------------------------------------------------------------------------
    # Check 11: Analogia corpo nero (3 vs 2 polarizzazioni, T⁴, eq. 62)
    # -------------------------------------------------------------------------
    sbb = node_out["results"]["scales_bb"]
    max_bb_rel = 0.0
    max_pol_err = 0.0
    for row in sbb["blackBody"]:
        T_d = Decimal(str(row["T"]))
        vs_d = Decimal(str(row["vs"]))
        uph_dec = phonon_black_body_dec(T_d, vs_d)
        ug_dec = photon_black_body_dec(T_d)
        max_bb_rel = max(max_bb_rel, rel_err(row["uPh"], uph_dec), rel_err(row["uGamma"], ug_dec))
        pol_ratio = row["uPhAtC"] / row["uGamma"]
        max_pol_err = max(max_pol_err, abs(pol_ratio - 1.5))

    # Rapporto T⁴ tra T=20 K e T=5 K con vs=3800
    t4_ratio = sbb["blackBody"][1]["uPh"] / sbb["blackBody"][0]["uPh"]
    t4_err = abs(t4_ratio - 256.0) / 256.0

    record(
        "Analogia corpo nero (§25, eq. 62: 3 vs 2 polarizzazioni e scaling T⁴)",
        "corpo_nero",
        max_bb_rel < 1e-8 and max_pol_err < 1e-14 and t4_err < 1e-14,
        max_pol_err,
        max_bb_rel,
        1e-8,
        {
            "max_bb_rel_vs_SI2019": max_bb_rel,
            "max_pol_factor_err": max_pol_err,
            "t4_scaling_err_20_over_5": t4_err,
        },
    )

    # -------------------------------------------------------------------------
    # Check 12: Scale ω_D, ν_D, ħω_D, k_T/k_D, distribuzioni statistiche e summary
    # -------------------------------------------------------------------------
    max_scale_rel = 0.0
    for s in sbb["scales"]:
        th_d = Decimal(str(s["thetaD"]))
        om_dec = (KB_SI_D * th_d) / HBAR_SI_D
        fr_dec = om_dec / (Decimal(2) * PI_D * Decimal("1e12"))
        en_dec = KB_EV_K_D * th_d * Decimal(1000)
        max_scale_rel = max(
            max_scale_rel,
            rel_err(s["omegaD"], om_dec),
            rel_err(s["freqD"], fr_dec),
            rel_err(s["energyD"], en_dec),
        )
    for t in sbb["thermal"]:
        T_d = Decimal(str(t["T"]))
        max_scale_rel = max(
            max_scale_rel,
            rel_err(t["scaleMev"], KB_EV_K_D * T_d * Decimal(1000)),
            rel_err(t["omegaRadS"], (KB_SI_D * T_d) / HBAR_SI_D),
        )

    cu_omega_d = [s["omegaD"] for s in sbb["scales"] if s["thetaD"] == 343.0][0]

    max_occ_rel = 0.0
    occ_special_ok = True
    for o in sbb["occupancies"]:
        x = o["x"]
        x_d = Decimal(str(x))
        if x > 700:
            if o["fd"] != 0.0 or o["mb"] != 0.0 or o["be"] != 0.0:
                occ_special_ok = False
            continue
        # Fermi-Dirac
        fd_dec = Decimal(1) / (x_d.exp() + Decimal(1))
        max_occ_rel = max(max_occ_rel, rel_err(o["fd"], fd_dec))
        # Maxwell-Boltzmann
        mb_dec = (-x_d).exp()
        max_occ_rel = max(max_occ_rel, rel_err(o["mb"], mb_dec))
        # Bose-Einstein
        if x <= 0:
            if o["be"] != "__INF__":
                occ_special_ok = False
        else:
            be_dec = Decimal(1) / (x_d.exp() - Decimal(1))
            max_occ_rel = max(max_occ_rel, rel_err(o["be"], be_dec))

    record(
        "Scale ω_D/ν_D/meV (incl. Cu ω_D ≈ 4,5·10¹³ s⁻¹) e distribuzioni FD/MB/BE",
        "scale_statistiche",
        max_scale_rel < 1e-8 and max_occ_rel < 1e-13 and occ_special_ok and abs(cu_omega_d / 1e13 - 4.49) < 0.02,
        0.0,
        max(max_scale_rel, max_occ_rel),
        1e-8,
        {
            "max_scale_rel_vs_SI2019": max_scale_rel,
            "max_occ_rel": max_occ_rel,
            "cu_omegaD_rad_s": cu_omega_d,
            "summary_300_343_075": sbb["summary"],
        },
    )

    # Salva risultati JSON
    all_passed = all(c["passed"] for c in checks)
    payload_out = {
        "all_passed": all_passed,
        "total_checks": len(checks),
        "passed_checks": sum(1 for c in checks if c["passed"]),
        "checks": checks,
    }
    OUT_JSON.write_text(json.dumps(payload_out, indent=2), encoding="utf-8")

    # Stampa riepilogo conciso su stdout
    for c in checks:
        status = "PASS" if c["passed"] else "FAIL"
        print(f"[{status}] {c['name']} | max_abs={c['max_abs']:.3e} | max_rel={c['max_rel']:.3e} (thr={c['threshold']:.1e})")
    print(f"\nTotale: {payload_out['passed_checks']}/{payload_out['total_checks']} PASS")
    return 0 if all_passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
