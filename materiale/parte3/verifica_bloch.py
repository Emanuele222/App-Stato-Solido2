"""Verifica dei numeri della Lecture 5b-1 (teorema di Bloch, schemi di zona) e degli esercizi E9-E13."""
import numpy as np
from scipy.constants import hbar, m_e, e, pi
from scipy.integrate import quad

eV = e
C = hbar**2 / (2 * m_e) / eV * 1e20  # eV*A^2
print("hbar^2/2m0 =", C, "eV A^2")

# --- E9: quali funzioni sono di Bloch (periodo a = 1)
a = 1.0
xs = np.linspace(0.013, 0.97, 7)
tests = {
    "cos(pi x/a)": lambda x: np.cos(pi * x / a),
    "sin(2pi x/a)": lambda x: np.sin(2 * pi * x / a),
    "exp(i3pi x/a)": lambda x: np.exp(1j * 3 * pi * x / a),
    "cos(pi x/2a)": lambda x: np.cos(pi * x / (2 * a)),
    "e^{ikx}(1+e^{i2pi x/a}), k=0.3pi/a": lambda x: np.exp(1j * 0.3 * pi * x) * (1 + np.exp(2j * pi * x / a)),
}
print("== E9: rapporto psi(x+a)/psi(x) nei punti di prova")
for nm, f in tests.items():
    r = f(xs + a) / f(xs)
    const = np.allclose(r, r[0])
    print(f"   {nm:38s} costante={const}  rapporto={np.round(r[0],4)}  ka/pi={np.angle(r[0])/pi if const else None}")

# --- E10: anello di N=8 atomi
N = 8
print("== E10: k = 2 pi s /(N a), s=0..N-1, in unita' pi/a, e ridotti nella 1a zona (-1,1]")
ks = [2 * s / N for s in range(N)]
red = [k if k <= 1 else k - 2 for k in ks]
print("   k/(pi/a) =", ks)
print("   ridotti  =", red, " distinti:", len(set(red)), " passo dk =", 2 / N, "pi/a = 2pi/(Na)")
aA = 3.0
print("   con a=3 A: dk =", 2 * pi / (N * aA), "1/A")

# --- E11: elettrone libero ripiegato, a = 3 A
print("== E11: a=3 A, energie nella zona ridotta E=(hbar^2/2m)(k+G)^2")
u = C * (pi / aA) ** 2
print("   unita' (hbar^2/2m)(pi/a)^2 =", u, "eV")
for kk, lab in [(0, "k=0"), (1, "k=pi/a")]:
    Es = sorted(set(round((kk + 2 * n) ** 2, 6) for n in range(-3, 4)))[:4]
    for E_ in Es:
        deg = sum(1 for n in range(-3, 4) if abs((kk + 2 * n) ** 2 - E_) < 1e-9)
        if kk == 1:
            # k=pi/a e k=-pi/a sono lo stesso punto: contano i G distinti
            pass
        print(f"   {lab}: E = {E_:5.1f} u = {E_*u:7.2f} eV   (valori di n: {[n for n in range(-3,4) if abs((kk+2*n)**2-E_)<1e-9]})")

# --- E12: <p> e varianza per u(x)=1+b cos(2 pi x/a)
print("== E12: psi=e^{ikx}u, u=1+b cos(2pi x/a), a=1 (unita' hbar=1)")
for b in [0.5]:
    uu = lambda x: 1 + b * np.cos(2 * pi * x)
    du = lambda x: -b * 2 * pi * np.sin(2 * pi * x)
    norm = quad(lambda x: uu(x) ** 2, 0, 1)[0]
    p_extra = quad(lambda x: uu(x) * du(x), 0, 1)[0] / norm  # (1/i) int u u' -> 0
    var = quad(lambda x: du(x) ** 2, 0, 1)[0] / norm
    form = b**2 * (2 * pi) ** 2 / 2 / (1 + b**2 / 2)
    print(f"   b={b}: norma={norm:.4f} (1+b^2/2={1+b*b/2}), <p>-hbar k = {p_extra:.2e}, varianza={var:.4f}, formula={form:.4f}")
    print(f"   sigma_p = {np.sqrt(var):.4f} hbar/a ; in unita' hbar*2pi/a: {np.sqrt(var)/(2*pi):.4f}")

# --- E13: velocita' nel modello a legami forti
print("== E13: E=E0-2t cos ka; v=(2ta/hbar) sin ka")
for t, aa in [(1.0, 3.0), (0.5, 3.0)]:
    vmax = 2 * t * eV * aa * 1e-10 / hbar
    print(f"   t={t} eV a={aa} A: v_max = {vmax:.3e} m/s a k=pi/(2a) = {pi/(2*aa):.4f} 1/A")
vF_Na = hbar * (3 * pi**2 * 2.65e28) ** (1 / 3) / m_e
print("   v_F(Na) =", vF_Na)
# velocita' dell'elettrone libero con lo stesso k=pi/2a
kq = pi / (2 * 3e-10)
print("   elettrone libero a k=pi/2a: v = hbar k/m =", hbar * kq / m_e, " m/s")

# --- Esempio nel testo (a = 3 A) ed E11 (Na, a = 4.29 A)
print("== Elettrone libero ripiegato: unita' u=(hbar^2/2m)(pi/a)^2")
for aa in [3.0, 4.29]:
    uu_ = C * (pi / aa) ** 2
    print(f"   a={aa} A: u={uu_:.3f} eV ; k=0: 4u={4*uu_:.2f}, 16u={16*uu_:.2f} ; k=pi/a: u={uu_:.2f}, 9u={9*uu_:.2f}"
          f" ; gap di energia libera tra k=0 (n=2) e k=pi/a (n=2): 4u-u={3*uu_:.2f}")
    print(f"      G=2pi/a = {2*pi/aa:.4f} 1/A ; pi/a = {pi/aa:.4f} 1/A")
