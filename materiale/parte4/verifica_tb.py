"""Verifiche numeriche della Parte 4, §§1-2 (legami forti, catena biatomica).

Unita': energie in eV, lunghezze in angstrom. hbar^2/m0 = 7.61996 eV A^2.
"""
import numpy as np

HB2M = 7.61996  # hbar^2/m0 in eV*A^2

print("=" * 70)
print("1. Catena monoatomica: E = Eb - 2t cos ka = Eb - 2t + 4t sin^2(ka/2)")
t, a, Eb = 0.8, 3.0, -5.0
k = np.linspace(-np.pi / a, np.pi / a, 7)
E1 = Eb - 2 * t * np.cos(k * a)
E2 = Eb - 2 * t + 4 * t * np.sin(k * a / 2) ** 2
assert np.allclose(E1, E2)
print("   identita' verificata; larghezza 4t =", 4 * t)
# massa al fondo: E ~ Eb - 2t + t a^2 k^2  -> m* = hbar^2/(2 t a^2)
print("   m*/m0 al fondo = hbar^2/(2 t a^2 m0) =", HB2M / (2 * t * a**2))

print("=" * 70)
print("2. Catena biatomica: diagonalizzazione di un anello di N celle")
EA, EB, t, a, N = 0.0, 2.0, 0.3, 4.0, 60   # E_B - E_A = 2 eV
# siti: A_n in x = n a, B_n in x = (n + 1/2) a ; hopping -t tra primi vicini
H = np.zeros((2 * N, 2 * N))
for n in range(N):
    iA, iB = 2 * n, 2 * n + 1
    H[iA, iA] = EA
    H[iB, iB] = EB
    H[iA, iB] = H[iB, iA] = -t                 # A_n - B_n
    jA = (2 * (n + 1)) % (2 * N)
    H[iB, jA] = H[jA, iB] = -t                 # B_n - A_{n+1}
ev = np.sort(np.linalg.eigvalsh(H))
ks = 2 * np.pi * np.arange(N) / (N * a)
ks = np.where(ks > np.pi / a, ks - 2 * np.pi / a, ks)
Dl = (EB - EA) / 2
def Epm(k, fac):  # fac = 1/2 -> cos(ka/2) (corretta); fac = 1 -> cos(ka) (slide)
    r = np.sqrt(Dl**2 + 4 * t**2 * np.cos(fac * k * a) ** 2)
    return (EA + EB) / 2 - r, (EA + EB) / 2 + r
lo, hi = Epm(ks, 0.5)
form = np.sort(np.concatenate([lo, hi]))
print("   max |autovalori - formula cos(ka/2)| =", np.abs(ev - form).max())
lo2, hi2 = Epm(ks, 1.0)
form2 = np.sort(np.concatenate([lo2, hi2]))
print("   max |autovalori - formula cos(ka) della slide| =", np.abs(ev - form2).max())
# con a_slide = distanza A-B = a/2 la formula della slide coincide
lo3, hi3 = (EA + EB) / 2 - np.sqrt(Dl**2 + 4 * t**2 * np.cos(ks * a / 2) ** 2), None
print("   (con a_slide = a/2, cos(k a_slide) = cos(ka/2): coincide)")
Eminus0, Eplus0 = Epm(0.0, 0.5)
EminusX, EplusX = Epm(np.pi / a, 0.5)
print(f"   k=0:    E- = {Eminus0:.4f}, E+ = {Eplus0:.4f}, separazione = {Eplus0 - Eminus0:.4f}")
print(f"   k=pi/a: E- = {EminusX:.4f}, E+ = {EplusX:.4f}, gap = {EplusX - EminusX:.4f} (= EB-EA = {EB - EA})")
Hpar = 4 * t**2 / abs(EA - EB)
W = np.sqrt(Dl**2 + 4 * t**2) - Dl
print(f"   larghezza esatta di ciascuna banda = {W:.4f}; stima H = 4t^2/|EA-EB| = {Hpar:.4f}")
print(f"   separazione in k=0: esatta {Eplus0 - Eminus0:.4f}, stima (EB-EA)+2H = {EB - EA + 2 * Hpar:.4f}")
# massa efficace al bordo della zona (k = pi/a + q):  m* = hbar^2 Delta /(2 t^2 a^2), Delta = EB-EA
q = 1e-4
for sgn, name in ((+1, "conduzione (E+)"), (-1, "valenza (E-)")):
    f = lambda kk: Epm(kk, 0.5)[1 if sgn > 0 else 0]
    curv = (f(np.pi / a + q) - 2 * f(np.pi / a) + f(np.pi / a - q)) / q**2
    print(f"   m*/m0 {name} numerica = {HB2M / curv:.4f};  formula +-hbar^2 D/(2 t^2 a^2) = {sgn * HB2M * (EB - EA) / (2 * t**2 * a**2):.4f}")
# esempio dell'esercizio E1: EA=0, EB=2, t=0.5, a=4
EA_, EB_, t_, a_ = 0.0, 2.0, 0.5, 4.0
D_ = (EB_ - EA_) / 2
r0 = np.sqrt(D_**2 + 4 * t_**2)
print(f"   [E1] EA=0, EB=2, t=0.5, a=4:  E+(0)={1 + r0:.4f}, E-(0)={1 - r0:.4f}, sep(0)={2 * r0:.4f}, gap={EB_ - EA_}, "
      f"larghezza={r0 - D_:.4f}, H={4 * t_**2 / 2:.4f}, m*/m0={HB2M * (EB_ - EA_) / (2 * t_**2 * a_**2):.4f}")
# autovettori: in k = pi/a  b_B/b_A = 0  (stati puramente A o B); in k = 0 mescolamento
for kk in (0.0, np.pi / a_):
    M = np.array([[EA_, -2 * t_ * np.cos(kk * a_ / 2)], [-2 * t_ * np.cos(kk * a_ / 2), EB_]])
    w, v = np.linalg.eigh(M)
    print(f"   k={kk:.3f}: E={w}, |b_A|^2 della banda bassa={v[0, 0]**2:.3f}, della alta={v[0, 1]**2:.3f}")
# caso EA = EB: le bande si toccano in pi/a (banda monoatomica di passo a/2 ripiegata)
lo, hi = (lambda kk: (EA - 2 * t * np.abs(np.cos(kk * a / 2)), EA + 2 * t * np.abs(np.cos(kk * a / 2))))(np.pi / a)
print("   EA=EB: E-(pi/a) = E+(pi/a) =", lo, hi)

print("=" * 70)
print("3. Cubico semplice a legami forti: E = Eb - 2t(cos kxa + cos kya + cos kza)")
t, a, Eb = 1.0, 1.0, 0.0
E = lambda kx, ky, kz: Eb - 2 * t * (np.cos(kx * a) + np.cos(ky * a) + np.cos(kz * a))
pi = np.pi
print("   Gamma:", E(0, 0, 0), " X:", E(pi, 0, 0), " M:", E(pi, pi, 0), " R(W):", E(pi, pi, pi))
kk = np.linspace(0, 1, 5)
assert np.allclose(E(kk, 0, 0), Eb - 4 * t - 2 * t * np.cos(kk * a))
kk = np.linspace(0, np.sqrt(2) * pi, 5)
assert np.allclose(E(kk / np.sqrt(2), kk / np.sqrt(2), 0), Eb - 2 * t - 4 * t * np.cos(kk * a / np.sqrt(2)))
kk = np.linspace(0, np.sqrt(3) * pi, 5)
assert np.allclose(E(kk / np.sqrt(3), kk / np.sqrt(3), kk / np.sqrt(3)), Eb - 6 * t * np.cos(kk * a / np.sqrt(3)))
print("   formule lungo [100], [110], [111] verificate; |GammaM| = sqrt2 pi/a, |GammaR| = sqrt3 pi/a")
# tratto X -> R: k = (pi/a, s, s)
s = np.linspace(0, pi, 5)
assert np.allclose(E(pi, s, s), Eb + 2 * t - 4 * t * np.cos(s * a))
print("   tratto X->R: E = Eb + 2t - 4t cos(s a), da Eb-2t a Eb+6t; lunghezza sqrt2 pi/a")
# esercizio E6: a = 3 A, t = 0.5 eV
a6, t6 = 3.0, 0.5
print(f"   [E6] a=3 A, t=0.5 eV: W=12t={12 * t6}, m*/m0 in Gamma = {HB2M / (2 * t6 * a6**2):.4f}")
