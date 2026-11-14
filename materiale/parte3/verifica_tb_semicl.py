"""Verifiche numeriche per i §§11 (aggiunte), 12 (legami forti) e 13 (modello semiclassico)
della Parte 3. Lancia: python3 verifica_tb_semicl.py
"""
import numpy as np
from scipy.optimize import brentq

hbar_eVs = 6.582119569e-16      # eV s
h2m = 3.80998                   # hbar^2/2m0 in eV A^2
e = 1.0                         # cariche in unita' di e (energie in eV, campi in V/m)

print("=== 1. Problema 2x2 con media del potenziale e V_G complesso (slide 15-19)")
E0, Vbar, VG = 4.18, -0.7, 0.3 * np.exp(0.9j)
H = np.array([[E0 + Vbar, VG], [np.conj(VG), E0 + Vbar]])
ev = np.linalg.eigvalsh(H)
print("autovalori", ev, " attesi", E0 + Vbar - abs(VG), E0 + Vbar + abs(VG))
assert np.allclose(ev, [E0 + Vbar - abs(VG), E0 + Vbar + abs(VG)])

print("\n=== 2. Pettine di delta: V_G = V0 per ogni G (anche G=0)")
# unita': hbar = 1, m = 1/2  ->  E = alpha^2, a = 1, E0 = pi^2, P = m a^2 V0/hbar^2 = V0/2
def f(alpha, P):
    return np.cos(alpha) + P * np.sin(alpha) / alpha
for P in [0.2, 0.5, 2.0]:
    V0 = 2 * P
    E0 = np.pi**2
    # bordo inferiore del gap 1: alpha = pi esatto (f = -1 per ogni P)
    a_low = np.pi
    # bordo superiore: f = -1 con alpha > pi
    a_up = brentq(lambda x: f(x, P) + 1, np.pi + 1e-9, 2 * np.pi - 1e-6)
    Eg = a_up**2 - a_low**2
    print(f"P={P}: E_- = {a_low**2:.4f} (E0={E0:.4f}), E_+ = {a_up**2:.4f}, "
          f"quasi liberi con Vbar=V0: E0+2V0 = {E0 + 2*V0:.4f}; Eg esatto/2V0 = {Eg/(2*V0):.3f}")

print("\n=== 3. Massa efficace al bordo per Kronig-Penney a delta (slide 8)")
# m*/m0 = 2/E''(k) con m0 = 1/2; confronto con m0 Eg/(Eg +/- 4E0)
def E_of_k(k, P, branch):
    # banda 1 (alpha in (0,pi]) o banda 2 (alpha in [pi, 2pi))
    c = np.cos(k)
    if branch == 1:
        lo, hi = 1e-6, np.pi
    else:
        lo = brentq(lambda x: f(x, P) + 1, np.pi + 1e-9, 2 * np.pi - 1e-6)
        hi = 2 * np.pi - 1e-9
    al = brentq(lambda x: f(x, P) - c, lo, hi)
    return al**2
for P in [0.05, 0.1, 0.3]:
    d = 1e-3
    k0 = np.pi
    res = []
    for br in (1, 2):
        Em = E_of_k(k0 - d, P, br)
        # E(k) pari attorno a pi: E'' = 2 (E(pi-d) - E(pi)) / d^2
        if br == 1:
            Eedge = np.pi**2
        else:
            Eedge = brentq(lambda x: f(x, P) + 1, np.pi + 1e-9, 2 * np.pi - 1e-6)**2
        Epp = 2 * (Em - Eedge) / d**2
        res.append(2 / Epp)
    Eg = brentq(lambda x: f(x, P) + 1, np.pi + 1e-9, 2*np.pi - 1e-6)**2 - np.pi**2
    E0 = np.pi**2
    print(f"P={P}: m*/m0 banda1 = {res[0]:+.4f}, formula -Eg/(4E0-Eg) = {-Eg/(4*E0-Eg):+.4f};"
          f"  banda2 = {res[1]:+.4f}, formula Eg/(4E0+Eg) = {Eg/(4*E0+Eg):+.4f}")

print("\n=== 4. Formula della slide 8 con i dati dell'E9-E10 (a=3 A, Eg=1 eV)")
a = 3.0
E0 = h2m * (np.pi / a)**2
Eg = 1.0
print(f"E0 = {E0:.3f} eV, 4E0 = {4*E0:.3f} eV = 2 hbar^2 pi^2/(m0 a^2)")
print(f"m*_c = {Eg/(4*E0+Eg):.4f} m0, m_h = {Eg/(4*E0-Eg):.4f} m0")

print("\n=== 5. Tabella della slide 9: m/m0 diviso Eg")
tab = {"InSb": (0.180, 0.0145), "InAs": (0.358, 0.027), "InP": (1.54, 0.077),
       "GaSb": (0.70, 0.047), "GaAs": (1.43, 0.067)}
for k_, (g, m) in tab.items():
    print(f"{k_}: m/(m0 Eg) = {m/g:.3f} 1/eV")

print("\n=== 6. Banda a coseno: E, v, m* (figura del §13)")
t, a = 1.0, 3.0
hb2m0 = 2 * h2m  # hbar^2/m0 = 7.62 eV A^2
mstar0 = hb2m0 / (2 * t * a**2)
print(f"m*(k=0) = hbar^2/(2 t a^2) = {mstar0:.3f} m0; m*(pi/a) = {-mstar0:.3f} m0; diverge in pi/2a")
vmax = 2 * t * a * 1e-10 / hbar_eVs
print(f"v_max = 2ta/hbar = {vmax:.3e} m/s")

print("\n=== 7. Oscillazioni di Bloch")
for (a_m, W, Ef) in [(3e-10, 4.0, 1e6), (10e-9, 0.020, 1e6)]:
    wB = Ef * a_m / hbar_eVs            # e*E*a/hbar con E in V/m, a in m -> eV/(eV s)
    TB = 2 * np.pi / wB
    LB = W / Ef                         # ampiezza W/(eE) in m
    print(f"a = {a_m*1e9:.2f} nm, W = {W} eV, campo = {Ef:.0e} V/m: omega_B = {wB:.3e} rad/s, "
          f"T_B = {TB:.3e} s, escursione W/(eE) = {LB*1e9:.3g} nm, T_B/tau(1e-14 s) = {TB/1e-14:.0f}")
# conservazione dell'energia: x(t) - x0 = (2t/eE)[cos k(t)a - cos k0 a]
t_hop, a_m, Ef = 1.0, 3e-10, 1e6
k0 = 0.3 / a_m
ts = np.linspace(0, 3e-11, 2001)
k_t = k0 - Ef * ts / hbar_eVs           # e E t / hbar  (E in V/m -> eV/m)
v = 2 * t_hop * a_m / hbar_eVs * np.sin(k_t * a_m)
x_num = np.concatenate([[0], np.cumsum(0.5 * (v[1:] + v[:-1]) * np.diff(ts))])
x_an = 2 * t_hop / Ef * (np.cos(k_t * a_m) - np.cos(k0 * a_m))
print("x(t) numerico vs analitico, errore massimo relativo:",
      np.max(np.abs(x_num - x_an)) / np.max(np.abs(x_an)))
# condizione di Zener
Eg, EF, a_m = 1.0, 5.0, 3e-10
print(f"Zener: e E a << Eg^2/EF  ->  E << {Eg**2/EF/a_m:.2e} V/m")

print("\n=== 8. Legami forti: catena s-p (E14) e cubico semplice (E13)")
Es_, ts_, Ep_, tp_ = -8.0, 1.0, -2.0, -1.2
Es0, Espi = Es_ - 2*ts_, Es_ + 2*ts_
Ep0, Eppi = Ep_ - 2*tp_, Ep_ + 2*tp_
print(f"s: E(0)={Es0}, E(pi/a)={Espi}; p: E(0)={Ep0:.2f}, E(pi/a)={Eppi:.2f}; gap in pi/a = {Eppi-Espi:.2f} eV")
t3, a3 = 0.5, 3.0
print(f"SC: W = 12t = {12*t3} eV; m*(Gamma) = hbar^2/(2ta^2) = {hb2m0/(2*t3*a3**2):.3f} m0; "
      f"E(Gamma)-Ebar = {-6*t3:+.1f}, E(X)-Ebar = {-2*t3:+.1f}, E(M)-Ebar = {2*t3:+.1f}, E(R)-Ebar = {6*t3:+.1f}")
# controllo numerico generale: E(k) = Ebar - 2t sum cos k_i a
def Esc(kx, ky, kz):
    return -2*t3*(np.cos(kx*a3)+np.cos(ky*a3)+np.cos(kz*a3))
print("SC: E(X), E(M), E(R) =", Esc(np.pi/a3, 0, 0), Esc(np.pi/a3, np.pi/a3, 0), Esc(np.pi/a3, np.pi/a3, np.pi/a3))

print("\n=== 9. Verifica numerica LCAO: catena di buche gaussiane")
# H = -hbar^2/2m d2/dx2 + sum_n V_at(x - n a); confronto della banda piu' bassa con Ebar - 2 t cos ka
# unita': hbar^2/2m = 1, a = 1
L_cells, npts = 40, 40 * 60
x = np.linspace(0, L_cells, npts, endpoint=False)
dx = x[1] - x[0]
V0g, sg = 60.0, 0.12
V = np.zeros_like(x)
for n in range(-2, L_cells + 2):
    d = x - (n + 0.5)
    V += -V0g * np.exp(-d**2 / (2 * sg**2))
# operatore cinetico periodico (differenze finite)
N = npts
main = 2.0 / dx**2 + V
off = -1.0 / dx**2 * np.ones(N - 1)
Hm = np.diag(main) + np.diag(off, 1) + np.diag(off, -1)
Hm[0, -1] = Hm[-1, 0] = -1.0 / dx**2
evals = np.linalg.eigvalsh(Hm)[:L_cells]
Emin, Emax = evals.min(), evals.max()
tt = (Emax - Emin) / 4
Ebar = (Emax + Emin) / 2
ks = 2 * np.pi * np.arange(L_cells) / L_cells
cosband = np.sort(Ebar - 2 * tt * np.cos(ks))
print(f"banda piu' bassa: W = {Emax-Emin:.4f}, t = {tt:.4f}; scarto max dal coseno = "
      f"{np.max(np.abs(np.sort(evals) - cosband)):.2e} ({np.max(np.abs(np.sort(evals) - cosband))/(Emax-Emin)*100:.2f}% di W)")
