"""Verifica numerica dei conti del capitolo «Elettroni quasi liberi» (Lezione 5c)."""
import numpy as np
from scipy import integrate

hbar = 1.054571817e-34      # J s
m0 = 9.1093837015e-31       # kg
eV = 1.602176634e-19        # J
C = hbar**2 / (2 * m0) / eV * 1e20   # eV*Angstrom^2
print(f"hbar^2/2m0 = {C:.4f} eV A^2  (la slide usa 3,8)")

# ---------------- scatola 1D: atomo, molecola, metallo (slide 26-33)
def En(n, L):  # L in Angstrom
    return C * (np.pi / L) ** 2 * n ** 2

for nome, L in [("atomo", 3.0), ("molecola", 15.0), ("metallo", 3e-3 * 1e10)]:
    print(nome, [f"{En(n, L):.4g}" for n in (1, 2, 3)], "eV")
print("eccitazione atomo E2-E1 =", En(2, 3.0) - En(1, 3.0))
print("molecola: E2-E1 =", En(2, 15.) - En(1, 15.), " E3-E2 =", En(3, 15.) - En(2, 15.))
L = 3e7; a = 3.0; N = L / a
print("N atomi =", N)
EF = C * (N * np.pi / L) ** 2
print("EF =", EF, "eV; kF = pi/a =", np.pi / a, "1/A")
dE = En(N + 1, L) - En(N, L)
print("dE esatto =", dE, " approx 2N E1 =", 2 * N * En(1, L),
      " hbar^2 kF/m * pi/L =", 2 * C * (np.pi / a) * (np.pi / L))
print("rapporto energie atomo/metallo E1:", En(1, 3.0) / En(1, L))

# ---------------- Fourier del potenziale di Coulomb in n dimensioni (slide 4)
from scipy.special import gamma
def VG_slide(n, k):
    return gamma((n - 1) / 2) / np.sqrt(np.pi) * (2 / k) ** (n - 1)
def VG_corretta(n, k):  # con il prefattore (2 pi)^(-n/2) della slide
    return 2 ** (n / 2 - 1) * gamma((n - 1) / 2) / (np.sqrt(np.pi) * k ** (n - 1))
k = 1.7
# 3D: int d^3x e^{ikx}/x = 4 pi / k^2 (limite di Yukawa); verifica numerica con schermatura mu
mu = 1e-3
f = lambda r: 4 * np.pi * r * np.sin(k * r) / k * np.exp(-mu * r) / r * r / r  # placeholder non usato
# int_0^inf 4 pi r^2 (sin kr / kr) e^{-mu r}/r dr = 4 pi/k int sin(kr) e^{-mu r} dr = 4 pi /(k^2+mu^2)*...
val3 = 4 * np.pi / (k ** 2 + mu ** 2)
print("3D: int = 4pi/k^2 =", 4 * np.pi / k ** 2, " /(2pi)^{3/2} =", 4 * np.pi / k ** 2 / (2 * np.pi) ** 1.5,
      "| formula slide:", VG_slide(3, k), "| formula corretta:", VG_corretta(3, k))
# 2D: 2 pi int J0(kr) dr = 2 pi / k
print("2D: 2pi/k /(2pi) =", 1 / k, "| slide:", VG_slide(2, k), "| corretta:", VG_corretta(2, k))

# ---------------- due onde: 2x2 esatto vs approssimazione (unita' lambda=hbar^2 (pi/a)^2/2m)
def eps_esatta(Kt, u, segno):
    return 1 + Kt ** 2 + segno * np.sqrt(4 * Kt ** 2 + u ** 2)
def eps_appr(Kt, u, segno):
    return 1 + segno * u + Kt ** 2 * (1 + segno * 2 / u)
u = 0.3
for Kt in (0.0, 0.02, 0.05, 0.1, 0.3):
    print(f"Kt={Kt}: esatta {eps_esatta(Kt,u,+1):.5f} (+)  approx {eps_appr(Kt,u,+1):.5f}  | "
          f"{eps_esatta(Kt,u,-1):.5f} (-) approx {eps_appr(Kt,u,-1):.5f}")

# massa efficace ai bordi del gap: esempio a=3 A, |U|=0.5 eV
a = 3.0; U = 0.5
lam = C * (np.pi / a) ** 2
print("lambda =", lam, "eV;  2 lam/|U| =", 2 * lam / U, "; Eg =", 2 * U)
m_basso = 1 / (1 - 2 * lam / U)     # cima banda 1 (U<0): 1 + 2lam/U
m_alto = 1 / (1 + 2 * lam / U)      # fondo banda 2
print("m*/m0 cima banda 1 =", m_basso, " fondo banda 2 =", m_alto, " approx -+ |U|/2lam =", U / (2 * lam))
# curvatura esatta numerica (in K tilde fisico, 1/A)
def eps_fis(Kt, segno):
    return lam * (1 + (Kt * a / np.pi) ** 2 + segno * np.sqrt(4 * (Kt * a / np.pi) ** 2 + (U / lam) ** 2))
h = 1e-4
for sg in (-1, +1):
    d2 = (eps_fis(h, sg) - 2 * eps_fis(0, sg) + eps_fis(-h, sg)) / h ** 2
    print("segno", sg, " m*/m0 esatta =", C * 2 / d2 / (2 * C) * 1 if False else (hbar ** 2 / (d2 * eV * 1e-20)) / m0)

# ---------------- onde stazionarie: <V> = +-U, p psi(+) = (hbar pi/a) psi(-)
x = np.linspace(0, 1, 20001)[:-1]  # in unita' a
Ux = -0.5  # U<0
Vx = 2 * Ux * np.cos(2 * np.pi * x)
psip = np.sqrt(2) * np.cos(np.pi * x); psim = np.sqrt(2) * np.sin(np.pi * x)
print("<V>(+) =", np.mean(Vx * psip ** 2), " <V>(-) =", np.mean(Vx * psim ** 2), " (U =", Ux, ")")
# matrice 2x2 in base (e^{i pi x/a}, e^{-i pi x/a}): H = [[lam,V],[V,lam]]
Hm = np.array([[1.0, Ux], [Ux, 1.0]]); w, v = np.linalg.eigh(Hm)
print("autovalori 2x2 (unita' lam):", w, " autovettori:", v.T)

# ---------------- troncamento 5x5 vs 2x2 (modello a cos)  k vicino a g/2
g = 2 * np.pi  # a=1
def bande(k, Umat, nmax=2):
    Gs = np.arange(-nmax, nmax + 1) * g
    H = np.diag([0.5 * (k - G) ** 2 for G in Gs]).astype(float)   # hbar^2/m=1 -> lam_k = k^2/2
    for i in range(len(Gs)):
        for j in range(len(Gs)):
            if abs(i - j) == 1:
                H[i, j] = Umat
    return np.linalg.eigvalsh(H)
Ucos = -0.3
for k in (np.pi, np.pi * 0.95, np.pi * 0.8):
    e5 = bande(k, Ucos, 2)[:2]
    e15 = bande(k, Ucos, 7)[:2]
    lk, lkg = 0.5 * k ** 2, 0.5 * (k - g) ** 2
    e2 = 0.5 * (lk + lkg) + np.array([-1, 1]) * np.sqrt(0.25 * (lk - lkg) ** 2 + Ucos ** 2)
    print(f"k={k/np.pi:.2f} pi/a: 2x2 {e2}, 5x5 {e5}, 15x15 {e15}")
