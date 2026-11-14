"""Verifiche numeriche della Parte 4, §3 (metodo k.p, spin-orbita, modello di Kane).

Unita': energie in eV, lunghezze in angstrom. hbar^2/m0 = 7.61996 eV A^2.
"""
import numpy as np

HB2M = 7.61996  # hbar^2/m0 (eV A^2)

print("=" * 70)
print("1. Formula della massa al secondo ordine: confronto con la curvatura esatta")
# 1D: V(x) = 2 VG cos(2 pi x / a)  (VG reale) ; base di onde piane e^{i(k+G)x}
a, VG, NG = 3.0, -0.5, 41
Gs = 2 * np.pi / a * np.arange(-(NG // 2), NG // 2 + 1)
def Hk(k):
    H = np.diag(HB2M / 2 * (k + Gs) ** 2)
    for i in range(NG - 1):
        H[i, i + 1] = H[i + 1, i] = VG
    return H
def bands(k):
    return np.linalg.eigh(Hk(k))
k0 = np.pi / a
E0, U0 = bands(k0)
# matrice dell'operatore (p + hbar k0) nella base: elementi diagonali hbar (k0+G)
# <n|p_tot|n'> = sum_G c_n(G)^* hbar (k0+G) c_n'(G); qui lavoriamo con hbar=1 e
# HB2M = hbar^2/m0, quindi (2/m0^2)|<p>|^2 -> 2 (hbar^2/m0)^2 |<k0+G>|^2 / hbar^2
P = U0.T @ np.diag(k0 + Gs) @ U0           # in unita' di hbar (1/A)
for n in (0, 1):
    # curvatura esatta d2E/dk2 in k0
    q = 1e-4
    Ep, Em = bands(k0 + q)[0][n], bands(k0 - q)[0][n]
    curv = (Ep - 2 * E0[n] + Em) / q**2      # eV A^2
    inv_m_exact = curv / HB2M               # m0/m*
    s = sum(2 * HB2M * P[n, j] ** 2 / (E0[n] - E0[j]) for j in range(NG) if j != n)
    inv_m_kp = 1 + s
    print(f"   banda {n + 1}: m0/m* esatto = {inv_m_exact:.6f}, formula k.p (somma su tutte le bande) = {inv_m_kp:.6f}")
Eg = E0[1] - E0[0]
E0kin = HB2M / 2 * (np.pi / a) ** 2
print(f"   gap al bordo = {Eg:.4f} (2|VG| = {2 * abs(VG)}); E0 = hbar^2 pi^2/2m0a^2 = {E0kin:.4f}")
print(f"   due bande: m0/m*_+ = 1 + 4E0/Eg = {1 + 4 * E0kin / Eg:.4f};  m0/m*_- = 1 - 4E0/Eg = {1 - 4 * E0kin / Eg:.4f}")
print(f"   |<psi_c|p|psi_s>| = hbar pi/a ?  numerico {abs(P[0, 1]):.5f} vs pi/a = {np.pi / a:.5f}")

print("=" * 70)
print("2. Modello di Kane (slide 41): masse con E_P = 2 m0 P^2/hbar^2")
def kane(Eg, D, EP):
    mc = 1 / (1 + EP / 3 * (2 / Eg + 1 / (Eg + D)))
    mlh = 1 / (1 + 2 * EP / (3 * Eg))
    mso = 1 / (1 + EP / (3 * (Eg + D)))
    return mc, mlh, mso
for name, Eg_, D_, EP_, mexp in (("GaAs", 1.43, 0.34, 20.0, 0.067), ("GaAs", 1.52, 0.34, 20.0, 0.067),
                                 ("InSb", 0.180, 0.82, 20.0, 0.0145), ("InSb", 0.235, 0.82, 20.0, 0.0145),
                                 ("GaAs", 1.519, 0.341, 28.8, 0.067)):
    mc, mlh, mso = kane(Eg_, D_, EP_)
    print(f"   {name} Eg={Eg_}, D={D_}, EP={EP_}: m_c={mc:.4f} (mis. {mexp}), m_lh={mlh:.4f}, m_so={mso:.4f}")
# due bande senza spin-orbita: m0/m_c = 1 + EP/Eg
for name, Eg_ in (("GaAs", 1.43), ("InSb", 0.18)):
    print(f"   due bande {name}: m_c/m0 = 1/(1+20/Eg) = {1 / (1 + 20 / Eg_):.4f}")
# limite D -> 0: la somma dei coefficienti delle lacune leggere e split-off e' 1 (2/3 + 1/3)
Eg_, EP_ = 1.5, 20.0
c_lh, c_so = 2 * EP_ / (3 * Eg_), EP_ / (3 * Eg_)
print("   D->0: (m0/m_lh - 1) + (m0/m_so - 1) =", c_lh + c_so, "= EP/Eg =", EP_ / Eg_)

print("=" * 70)
print("3. Spin-orbita: L.S per L=1, S=1/2 (hbar=1)")
# base |m_l, m_s>, m_l = 1,0,-1 ; m_s = +1/2, -1/2
Lz = np.diag([1, 0, -1]).astype(complex)
Lp = np.zeros((3, 3), complex); Lp[0, 1] = Lp[1, 2] = np.sqrt(2)
Lm = Lp.conj().T
Lx, Ly = (Lp + Lm) / 2, (Lp - Lm) / (2j)
Sz = np.diag([0.5, -0.5]).astype(complex)
Sp = np.array([[0, 1], [0, 0]], complex); Sm = Sp.T
Sx, Sy = (Sp + Sm) / 2, (Sp - Sm) / (2j)
LS = sum(np.kron(L, S) for L, S in ((Lx, Sx), (Ly, Sy), (Lz, Sz)))
w = np.linalg.eigvalsh(LS)
print("   autovalori di L.S:", np.round(w, 6), " -> J=3/2: +1/2 (x4), J=1/2: -1 (x2); Delta = 3 lambda hbar^2/2")
J2 = sum((np.kron(L, np.eye(2)) + np.kron(np.eye(3), S)) @ (np.kron(L, np.eye(2)) + np.kron(np.eye(3), S))
         for L, S in ((Lx, Sx), (Ly, Sy), (Lz, Sz)))
assert np.allclose(LS, (J2 - 2 * np.eye(6) - 0.75 * np.eye(6)) / 2)
print("   L.S = (J^2 - L^2 - S^2)/2 verificato")
# stati con orbitali cartesiani: |1,1> = -(px + i py)/sqrt2, |1,0> = pz, |1,-1> = (px - i py)/sqrt2
up, dn = np.array([1, 0]), np.array([0, 1])
Y = {1: np.array([1, 0, 0]), 0: np.array([0, 1, 0]), -1: np.array([0, 0, 1])}   # base m_l
px = (-Y[1] + Y[-1]) / np.sqrt(2)          # inverso delle relazioni sopra
py = 1j * (Y[1] + Y[-1]) / np.sqrt(2)
pz = Y[0]
def st(orb, spin):
    return np.kron(orb, spin)
Phi = {
    "3/2,3/2": -1 / np.sqrt(2) * st(px + 1j * py, up),
    "3/2,-3/2": 1 / np.sqrt(2) * st(px - 1j * py, dn),
    "3/2,1/2": -1 / np.sqrt(6) * (st(px + 1j * py, dn) - 2 * st(pz, up)),
    "3/2,-1/2": 1 / np.sqrt(6) * (st(px - 1j * py, up) + 2 * st(pz, dn)),
    "1/2,1/2": -1 / np.sqrt(3) * (st(px + 1j * py, dn) + st(pz, up)),
    "1/2,-1/2": -1 / np.sqrt(3) * (st(px - 1j * py, up) - st(pz, dn)),
}
Jz = np.kron(Lz, np.eye(2)) + np.kron(np.eye(3), Sz)
for kname, v in Phi.items():
    nrm = np.vdot(v, v).real
    ls = np.vdot(v, LS @ v).real / nrm
    j2 = np.vdot(v, J2 @ v).real / nrm
    jz = np.vdot(v, Jz @ v).real / nrm
    eig = np.allclose(LS @ v, ls * v) and np.allclose(Jz @ v, jz * v)
    print(f"   Phi_{kname}: norma={nrm:.3f}, <L.S>={ls:+.3f}, J(J+1)={j2:.3f}, Jz={jz:+.2f}, autostato={eig}")
lam_Ge = 2 * 0.29 / 3
print(f"   Ge: Delta=0.29 eV -> lambda hbar^2 = 2Delta/3 = {lam_Ge:.4f} eV; J=3/2 a +{lam_Ge / 2:.4f}, J=1/2 a -{lam_Ge:.4f} eV")

print("=" * 70)
print("4. Pacchetto d'onde gaussiano in una banda a coseno")
# Phi(k) = exp(-(k-k0)^2/b^2), omega(k) da E = -2t cos ka (hbar=1, energia in unita' di t)
a, t = 1.0, 1.0
k0, b = np.pi / (2 * a), 0.05 * (2 * np.pi / a)
kk = np.linspace(k0 - 8 * b, k0 + 8 * b, 4001)
dk = kk[1] - kk[0]
x = np.linspace(-150, 450, 6001)
om = -2 * t * np.cos(kk * a)
vg = 2 * t * a * np.sin(k0 * a)
for T in (0.0, 50.0, 100.0):
    Psi = (np.exp(-(kk - k0) ** 2 / b**2)[None, :] * np.exp(1j * (kk[None, :] * x[:, None] - om[None, :] * T))).sum(1) * dk
    P2 = np.abs(Psi) ** 2
    xc = (x * P2).sum() / P2.sum()
    sig = np.sqrt(((x - xc) ** 2 * P2).sum() / P2.sum())
    print(f"   t={T:5.1f}: centro={xc:8.3f} (v_g t = {vg * T:8.3f}), larghezza rms={sig:.3f} (1/b = {1 / b:.3f})")
# analitico (termine lineare): |Psi|^2 = pi b^2 exp(-b^2 (x - v_g t)^2 / 2) -> rms = 1/b
print("   termine lineare: |Psi|^2 = pi b^2 exp[-b^2 (x - v_g t)^2/2], rms = 1/b")
# k0 = pi/2a e' un flesso: omega'' = 0, il pacchetto non si allarga; altrove si allarga
k0 = 0.2 * np.pi / a
vg = 2 * t * a * np.sin(k0 * a)
for T in (0.0, 100.0):
    kk = np.linspace(k0 - 8 * b, k0 + 8 * b, 4001)
    om = -2 * t * np.cos(kk * a)
    Psi = (np.exp(-(kk - k0) ** 2 / b**2)[None, :] * np.exp(1j * (kk[None, :] * x[:, None] - om[None, :] * T))).sum(1) * dk
    P2 = np.abs(Psi) ** 2
    xc = (x * P2).sum() / P2.sum()
    sig = np.sqrt(((x - xc) ** 2 * P2).sum() / P2.sum())
    ompp = 2 * t * a**2 * np.cos(k0 * a)
    pred = (1 / b) * np.sqrt(1 + (ompp * T * b**2 / 2) ** 2)   # gaussiana con termine quadratico
    print(f"   k0=0.2pi/a, t={T:5.1f}: centro={xc:8.3f} (v_g t={vg * T:8.3f}), rms={sig:.3f}, previsione con omega''={pred:.3f}")

print("=" * 70)
print("5. Urto elettrone-fonone in 1D con umklapp")
a = 3.0
k, qph = 0.8 * np.pi / a, 0.6 * np.pi / a
kf = k + qph
G = 2 * np.pi / a
kf_red = kf - G if kf > np.pi / a else kf
print(f"   assorbimento: k + q = {kf / (np.pi / a):.2f} pi/a -> fuori zona -> k_f = k + q - G = {kf_red / (np.pi / a):.2f} pi/a")
