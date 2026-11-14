"""Verifiche numeriche della Parte 4, §5 (esercizi delle slide 55-68) e degli esercizi d'esame."""
import itertools
import numpy as np

HB2M = 7.61996  # hbar^2/m0 (eV A^2)

print("=" * 70)
print("1. Elettrone in una scatola cubica (pareti infinite): livelli e degenerazioni")
lev = {}
for n in itertools.product(range(1, 6), repeat=3):
    s = sum(x * x for x in n)
    lev.setdefault(s, []).append(n)
for s in sorted(lev)[:6]:
    print(f"   n^2 = {s:2d}: degenerazione {len(lev[s])}: {lev[s]}")
L = 10.0
print(f"   L = 10 A: E(111) = 3 hbar^2 pi^2/(2 m L^2) = {3 * HB2M / 2 * np.pi**2 / L**2:.4f} eV")
# normalizzazione (8/abc)^(1/2): integrale di sin^2 su [0,a] = a/2
a_, b_, c_ = 2.0, 3.0, 5.0
x = np.linspace(0, a_, 20001); y = np.linspace(0, b_, 20001); z = np.linspace(0, c_, 20001)
Ix = np.trapezoid(np.sin(np.pi * x / a_) ** 2, x); Iy = np.trapezoid(np.sin(2 * np.pi * y / b_) ** 2, y)
Iz = np.trapezoid(np.sin(3 * np.pi * z / c_) ** 2, z)
print("   (8/abc) * integrali = ", 8 / (a_ * b_ * c_) * Ix * Iy * Iz)

print("=" * 70)
print("2. Quasi liberi su reticolo quadrato 2D, V = -2 V0 [cos(2pi x/a) + cos(2pi y/a)]")
a = 1.0
EX = HB2M / 2 * (np.pi / a) ** 2
EM = HB2M / 2 * 2 * (np.pi / a) ** 2
print(f"   b = EM/EX = {EM / EX:.4f}")
nmax = 5
Gl = [(i, j) for i in range(-nmax, nmax + 1) for j in range(-nmax, nmax + 1)]
NG = len(Gl)
idx = {g: n for n, g in enumerate(Gl)}
def H(kx, ky, V0):
    Hm = np.zeros((NG, NG))
    for n, (i, j) in enumerate(Gl):
        gx, gy = 2 * np.pi * i / a, 2 * np.pi * j / a
        Hm[n, n] = HB2M / 2 * ((kx + gx) ** 2 + (ky + gy) ** 2)
        for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            m = idx.get((i + di, j + dj))
            if m is not None:
                Hm[n, m] = -V0          # V_G = -V0 per i quattro G piu' corti
    return Hm
def ev(kx, ky, V0, nb=3):
    return np.linalg.eigvalsh(H(kx, ky, V0))[:nb]
for V0 in (0.05 * EX, 0.2 * EX):
    eX = ev(np.pi / a, 0, V0); eM = ev(np.pi / a, np.pi / a, V0, 4)
    print(f"   V0={V0 / EX:.2f} EX: in X {np.round((eX - EX) / V0, 3)} (unita' V0, rispetto a EX); "
          f"in M {np.round((eM - EM) / V0, 3)} (rispetto a EM)")
# griglia sulla zona: massimo della banda 1, minimo della banda 2
ng = 41
kgrid = np.linspace(0, np.pi / a, ng)     # simmetria: basta il quadrante
def overlap(V0):
    b1max, b2min = -1e9, 1e9
    for kx in kgrid:
        for ky in kgrid:
            if ky > kx:
                continue
            e = ev(kx, ky, V0, 2)
            b1max = max(b1max, e[0]); b2min = min(b2min, e[1])
    return b1max - b2min
lo, hi = 0.05 * EX, 0.6 * EX
for _ in range(30):
    mid = (lo + hi) / 2
    if overlap(mid) > 0:
        lo = mid
    else:
        hi = mid
print(f"   V0 critico (calcolo con {NG} onde piane) = {lo / EX:.4f} EX")
print(f"   stime: slide (EX + 2|V0| <= EM) -> V0 <= EX/2 = 0.5 EX ;  E_X+|V0| <= E_M-2|V0| -> V0 <= EX/3 = {1 / 3:.4f} EX")
print(f"   EX = hbar^2 pi^2/(2 m a^2): con a = 3 A, EX = {HB2M / 2 * (np.pi / 3) ** 2:.4f} eV")

print("=" * 70)
print("3. Esercizi d'esame")
# E2: InSb con E_P = 20 eV (Kane senza resto)
for Eg, D in ((0.18, 0.82),):
    mc = 1 / (1 + 20 / 3 * (2 / Eg + 1 / (Eg + D)))
    print(f"   [E2] InSb: m_c = {mc:.4f} m0; due bande: {1 / (1 + 20 / Eg):.4f} m0")
# E3: spin-orbita Ge
D = 0.29
print(f"   [E3] Ge: lambda hbar^2 = {2 * D / 3:.4f} eV; J=3/2: +{D / 3:.4f} eV; J=1/2: -{2 * D / 3:.4f} eV")
# E4: pacchetto: banda a coseno con a = 3 A, t = 1 eV, k0 = pi/2a, b = 0.02 (2pi/a)
a, t = 3.0, 1.0
hbar_eVs = 6.582119569e-16
k0 = np.pi / (2 * a); b = 0.02 * 2 * np.pi / a
vg = 2 * t * a * np.sin(k0 * a) / hbar_eVs * 1e-10   # m/s
print(f"   [E4] v_g = {vg:.4e} m/s ; larghezza 1/b = {1 / b:.3f} A = {1 / b / a:.2f} celle")
k0b = np.pi / (4 * a)
mstar = HB2M / (2 * t * a**2 * np.cos(k0b * a))          # m0 units
ts = 2 * mstar / (HB2M * b**2) * hbar_eVs           # 2 m*/(hbar b^2): (m*/m0)/(hbar^2/m0 b^2) * hbar
print(f"   [E4] in k0 = pi/4a: m*/m0 = {mstar:.4f}; tempo di allargamento 2m*/(hbar b^2) = {ts:.3e} s")
# E5: umklapp
print("   [E5] k=0.8pi/a, q=0.6pi/a -> k_f = -0.6 pi/a (umklapp, G = 2pi/a)")
# E1 della catena biatomica gia' in verifica_tb.py
