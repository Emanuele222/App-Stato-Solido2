"""Verifica dei conti della Lecture 5b-1 (seconda parte): buca finita, modello di Kronig-Penney a delta
e a barriere rettangolari, approssimazione a coseno, massa efficace, esercizi E14-E18."""
import numpy as np
from scipy.optimize import brentq
from scipy.constants import hbar, m_e, e, pi

C = hbar**2 / (2 * m_e) / e * 1e20  # hbar^2/2m0 in eV*A^2
print(f"hbar^2/2m0 = {C:.4f} eV A^2")


# ============================================================ 1. buca finita (slide 7-12)
def well_levels(b, V0, mstar=1.0):
    """Livelli legati (energia dal fondo) della buca finita di larghezza b (A), profondita' V0 (eV)."""
    Cm = C / mstar
    rho = (b / 2) * np.sqrt(V0 / Cm)
    f_even = lambda x: np.sqrt(rho**2 - x**2) - x * np.tan(x)
    f_odd = lambda x: np.sqrt(rho**2 - x**2) + x / np.tan(x)
    out = []
    for kind, f in (("pari", f_even), ("dispari", f_odd)):
        xs = np.linspace(1e-4, rho - 1e-9, 20000)
        v = np.array([f(x) for x in xs])
        for i in range(len(xs) - 1):
            if v[i] * v[i + 1] < 0 and abs(v[i]) < 20 and abs(v[i + 1]) < 20:
                r = brentq(f, xs[i], xs[i + 1])
                out.append((V0 * (r / rho) ** 2, kind, r))
    return rho, sorted(out)


print("\n== 1. Buca finita (slide 7-12)")
rho, lv = well_levels(10.0, 1.0)
print(f"   b=10 A, V0=1 eV, m*=m0: rho={rho:.4f}, N=floor(2rho/pi)+1={int(np.floor(2*rho/pi))+1}")
for eps, kind, r in lv:
    al, be = 2 * r / 10.0, 2 * np.sqrt(rho**2 - r**2) / 10.0
    print(f"   {kind:8s} xi={r:.4f} eta={np.sqrt(rho**2-r**2):.4f}  eps={eps:.4f} eV dal fondo, |E|={1-eps:.4f} eV dalla cima;"
          f"  tan(alpha b)={np.tan(al*10):.4f}  2ab/(a^2-b^2)={2*al*be/(al**2-be**2):.4f}")
print("   buca infinita larga b: E_n =", [round(n**2 * pi**2 * C / 100, 4) for n in (1, 2, 3)], "eV")
print("   un solo livello se rho<pi/2 =", round(pi / 2, 4))
# eterostruttura GaAs/AlGaAs (illustrativa): m*=0.067, V0=0.3 eV, b=5 nm
rho, lv = well_levels(50.0, 0.3, 0.067)
print(f"   pozzo 5 nm, m*=0.067, V0=0.3 eV: rho={rho:.4f}, N={len(lv)}, livelli dal fondo:",
      [round(l[0], 4) for l in lv], "eV")
bmax = pi * np.sqrt(C / 0.067 / 0.3)
print(f"   larghezza massima per un solo livello (m*=0.067, V0=0.3): {bmax/10:.2f} nm")

# ============================================================ 2. modello a delta (slide 14-22)
print("\n== 2. Kronig-Penney a delta (slide 14-22), P = m a^2 V0/hbar^2")
f_delta = lambda x, P: np.cos(x) + P * np.sin(x) / x  # x = alpha a


def mat_cell(x, P):
    """Matrice (A_n,B_n)->(A_{n+1},B_{n+1}) dalle due condizioni di raccordo (slide 15-18), con a=1."""
    c, s = np.cos(x), np.sin(x)
    K = 2 * P / x  # 2 m a V0/(hbar^2 alpha) con a=1
    return np.array([[c, K * c - s], [s, K * s + c]])


x0, P0 = 2.7, 2.0
M = mat_cell(x0, P0)
print(f"   x=alpha a={x0}, P={P0}: det M={np.linalg.det(M):.6f}, tr M/2={np.trace(M)/2:.6f}, f(x)={f_delta(x0,P0):.6f}")
# verifica indipendente con le matrici di trasferimento su (psi, psi')
x = x0
free = np.array([[np.cos(x), np.sin(x) / x], [-x * np.sin(x), np.cos(x)]])  # a=1, alpha=x
kick = np.array([[1, 0], [2 * P0, 1]])  # salto di psi' = (2 m a V0/hbar^2) psi = 2 P psi
print(f"   trasferimento (psi,psi'): tr/2={np.trace(kick@free)/2:.6f}  det={np.linalg.det(kick@free):.6f}")


def delta_bands(P, xmax, N=600000):
    xs = np.linspace(1e-6, xmax, N)
    f = f_delta(xs, P)
    ok = np.abs(f) <= 1
    ed = []
    i = 0
    g = lambda t: abs(f_delta(t, P)) - 1
    while i < N:
        if ok[i]:
            j = i
            while j < N and ok[j]:
                j += 1
            lo = brentq(g, xs[i - 1], xs[i]) if i > 0 else xs[i]
            hi = brentq(g, xs[j - 1], xs[j]) if j < N else xs[j - 1]
            ed.append((lo, hi))
            i = j
        else:
            i += 1
    return ed


for P in (2.0, 1.5 * pi, 10.0):
    ed = delta_bands(P, 6 * pi)
    print(f"   P={P:.4f}: bande in alpha a/pi:", [(round(l / pi, 4), round(h / pi, 4)) for l, h in ed[:5]])
    print("      E in unita' u=pi^2 hbar^2/2ma^2:", [(round((l / pi) ** 2, 4), round((h / pi) ** 2, 4)) for l, h in ed[:5]])
    gaps = [(ed[n + 1][0] / pi) ** 2 - (ed[n][1] / pi) ** 2 for n in range(len(ed) - 1)]
    print("      gap:", [round(g, 4) for g in gaps[:5]], "  limite 2|V_G| = 2V0 = 4P/pi^2 =", round(4 * P / pi**2, 4))
    print("      larghezze bande:", [round((h / pi) ** 2 - (l / pi) ** 2, 4) for l, h in ed[:5]])
    # estremi di banda: uno dei due vale sempre alpha a = n pi
    print("      bordi a n*pi (k=0 o pi/a):", all(abs(h / pi - round(h / pi)) < 1e-5 for l, h in ed[:5]))
ed = delta_bands(2.0, 16.0)
print("   P=2 (slide 22, V0=2, ma^2/hbar^2=1): numero di bande con alpha a<15:", len([1 for l, h in ed if l < 15]))

a_ = 3.0
ed = delta_bands(1.5 * pi, 3 * pi)
u = C * (pi / a_) ** 2
print(f"\n   Esempio a={a_} A, P=3pi/2: u={u:.3f} eV; V0 = 2P u/pi^2... V0 = P hbar^2/(m a^2) = {1.5*pi*C*2/a_**2:.3f} eV")
for n, (l, h) in enumerate(ed[:3]):
    print(f"      banda {n+1}: {C*(l/a_)**2:.3f} - {C*(h/a_)**2:.3f} eV (larghezza {C*(h**2-l**2)/a_**2:.3f} eV)")
for n in range(2):
    print(f"      gap {n+1}: {C*(ed[n][1]/a_)**2:.3f} - {C*(ed[n+1][0]/a_)**2:.3f} eV")

# ============================================================ 3. barriere rettangolari (slide 23-28)
print("\n== 3. Barriere rettangolari (slide 23-28)")


def L_slide(t, gb, gc):
    A = (1 - 2 * t) / (2 * np.sqrt(t - t**2))
    return A * np.sinh(gc * np.sqrt(1 - t)) * np.sin(gb * np.sqrt(t)) + np.cosh(gc * np.sqrt(1 - t)) * np.cos(gb * np.sqrt(t))


def L_ab(t, gb, gc):
    al, be = np.sqrt(t), np.sqrt(1 - t)
    return np.cos(al * gb) * np.cosh(be * gc) + (be**2 - al**2) / (2 * al * be) * np.sin(al * gb) * np.sinh(be * gc)


def L_up(t, gb, gc):
    al, bp = np.sqrt(t), np.sqrt(t - 1)
    return np.cos(al * gb) * np.cos(bp * gc) - (al**2 + bp**2) / (2 * al * bp) * np.sin(al * gb) * np.sin(bp * gc)


tt = np.array([0.05, 0.3, 0.7, 0.95])
print("   formula di slide 25 = forma (alpha,beta): differenza max", np.max(np.abs(L_slide(tt, 7.0, 2.0) - L_ab(tt, 7.0, 2.0))))
print("   continuita' in eps=V0:", L_ab(1 - 1e-7, 7.0, 2.0), L_up(1 + 1e-7, 7.0, 2.0))
print("   limite a delta (c->0, V0 c = P fissato, unita' hbar=m=a=1):")
P = 2.0
for c in (1e-2, 1e-3, 1e-4):
    V0_ = P / c
    eps = 0.185
    alpha = np.sqrt(2 * eps)
    Lx = L_ab(eps / V0_, np.sqrt(2 * V0_) * (1 - c), np.sqrt(2 * V0_) * c)
    print(f"      c={c:g}: L esatta={Lx:.5f}  cos(alpha a)+(P/alpha a) sin(alpha a) = {np.cos(alpha)+P*np.sin(alpha)/alpha:.5f}")


def rect_bands(gb, gc, tmax=0.999, N=400000):
    ts = np.linspace(1e-6, tmax, N)
    ok = np.abs(L_ab(ts, gb, gc)) <= 1
    idx = np.where(np.diff(ok.astype(int)) != 0)[0]
    ed = [brentq(lambda t: abs(L_ab(t, gb, gc)) - 1, ts[i], ts[i + 1]) for i in idx]
    if ok[0]:
        ed = [0.0] + ed
    if ok[-1]:
        ed = ed + [tmax]
    return ed


# parametri scelti per la figura: gamma_b = sqrt(2 m V0/hbar^2) b = 10.4 (4 livelli), c/b = 0.2
gb, gc = 10.4, 2.08
ed = rect_bands(gb, gc)
print(f"\n   Figura: gamma_b={gb}, gamma_c={gc} (c/b={gc/gb:.2f}); bordi |L|=1 in eps/V0:", np.round(ed, 4))
rho_w = gb / 2
# livelli della buca isolata: (xi/rho)^2
roots = []
for kind, f in (("p", lambda x: np.sqrt(rho_w**2 - x**2) - x * np.tan(x)), ("d", lambda x: np.sqrt(rho_w**2 - x**2) + x / np.tan(x))):
    xs = np.linspace(1e-4, rho_w - 1e-9, 20000)
    v = np.array([f(x) for x in xs])
    for i in range(len(xs) - 1):
        if v[i] * v[i + 1] < 0 and abs(v[i]) < 20 and abs(v[i + 1]) < 20:
            roots.append((brentq(f, xs[i], xs[i + 1]) / rho_w) ** 2)
roots.sort()
print("   livelli della buca isolata (eps/V0):", np.round(roots, 4))
for n, r in enumerate(roots):
    inside = [(ed[2 * j], ed[2 * j + 1]) for j in range(len(ed) // 2) if ed[2 * j] <= r <= ed[2 * j + 1]]
    print(f"      livello {n+1}: {r:.4f}  banda corrispondente: {inside}")

# ============================================================ 4. approssimazione a coseno (slide 28-30)
print("\n== 4. Bande a coseno (slide 28-30)")


def cos_test(P, band=0):
    ed = delta_bands(P, 4 * pi)
    (l1, h1), (l2, h2) = ed[0], ed[1]
    e1, e2, e3, e4 = (l1 / pi) ** 2, (h1 / pi) ** 2, (l2 / pi) ** 2, (h2 / pi) ** 2
    ks = np.linspace(1e-4, 1 - 1e-4, 101)
    ex1, ap1 = [], []
    for k in ks:
        fx = lambda x: f_delta(x, P) - np.cos(k * pi)
        ex1.append((brentq(fx, l1 - 1e-9, h1 + 1e-9) / pi) ** 2)
        ap1.append(0.5 * (e1 + e2) - 0.5 * (e2 - e1) * np.cos(k * pi))
    err = np.max(np.abs(np.array(ex1) - np.array(ap1)))
    # curvatura in k=0: eps = e1 + c k^2 (k in pi/a, eps in u)
    kk = 0.01
    curv_ex = ((brentq(lambda x: f_delta(x, P) - np.cos(kk * pi), l1 - 1e-9, h1 + 1e-9) / pi) ** 2 - e1) / kk**2
    curv_ap = (e2 - e1) * pi**2 / 4
    return e1, e2, e3, e4, err / (e2 - e1), curv_ex, curv_ap


print("   banda 1: P, e1, e2, errore max/W, curvatura esatta, curvatura a coseno, rapporto m*_coseno/m*_esatto")
for P in (1.0, 2.0, 1.5 * pi, 10.0, 30.0):
    e1, e2, e3, e4, err, cx, ca = cos_test(P)
    print(f"   P={P:6.3f}  e1={e1:.4f} e2={e2:.4f} W={e2-e1:.4f}  err={100*err:5.2f}% W   curv_es={cx:.4f}  curv_cos={ca:.4f}  m*_cos/m*_es={cx/ca:.3f}")
e1, e2, e3, e4, err, cx, ca = cos_test(2.0)
print(f"   P=2: e1..e4 = {e1:.4f}, {e2:.4f}, {e3:.4f}, {e4:.4f}; primo gap e3-e2 = {e3-e2:.4f}")
# esempio numerico a coseno su P=3pi/2, a=3 A
e1, e2, e3, e4, err, cx, ca = cos_test(1.5 * pi)
W = (e2 - e1) * u
t = W / 4
print(f"   P=3pi/2, a=3 A: W={W:.3f} eV, t=W/4={t:.3f} eV; m*/m0 (coseno)= hbar^2/(2 t a^2) = {2*C/(2*t*a_**2):.3f};"
      f" m*/m0 (esatto) = {1/cx:.3f}; vmax = 2 t a/hbar = {2*t*a_*1e-10*e/hbar:.3e} m/s")

# ============================================================ 5. numeri per V/F ed esercizi
print("\n== 5. Controlli per gli esercizi")
# E14: pozzo GaAs 5 nm
rho5, lv5 = well_levels(50.0, 0.3, 0.067)
print(f"   E14: rho={rho5:.4f}, N={len(lv5)}, livelli {[round(l[0],4) for l in lv5]} eV; |E| dalla cima: {[round(0.3-l[0],4) for l in lv5]}")
# pozzo infinito stesso b, stesso m*: E1 = pi^2 C/(m* b^2)
print(f"        buca infinita: E1={pi**2*C/0.067/2500:.4f} eV, E2={4*pi**2*C/0.067/2500:.4f} eV")


# ============================================================ 6. larghezza di banda e spessore della barriera
print("\n== 6. Larghezza della banda 1 al variare di c (barriere rettangolari, gamma_b=10.4)")
gb = 10.4
lev1 = levels[0] if 'levels' in globals() else roots[0]
be1 = gb * np.sqrt(1 - roots[0])
print(f"   beta_1 b = gamma_b sqrt(1-eps_1/V0) = {be1:.3f}")
prev = None
for r in (0.2, 0.4, 0.6, 0.8, 1.0):
    bd = rect_bands(gb, gb * r)
    W = bd[1] - bd[0]
    if prev:
        print(f"   c/b={r:.1f}: W1/V0={W:.3e}   d ln W/d(c/b) = {(np.log(W)-np.log(prev[1]))/(r-prev[0]):.2f}  (atteso -beta_1 b)")
    else:
        print(f"   c/b={r:.1f}: W1/V0={W:.3e}")
    prev = (r, W)
