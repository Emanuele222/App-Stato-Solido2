"""Controlli delle formule del §11 nella notazione E_k, E, c_G, V_G, E_0, psi_c, psi_s."""
import numpy as np
hb2m = 1.0          # hbar^2/m0 = 1, a = 1
a = 1.0; G = 2*np.pi/a
Ek = lambda k: hb2m*k**2/2
E0 = Ek(np.pi/a)

# 1) matrice a molte onde (equazione centrale) con V = 2 V_G cos(Gx), V_G = -0.3
VG = -0.3
def bande(k, n=7):
    ns = np.arange(-n, n+1)
    H = np.diag(Ek(k+ns*G)) + VG*(np.eye(2*n+1, k=1)+np.eye(2*n+1, k=-1))
    return np.linalg.eigvalsh(H)
e15 = bande(np.pi/a)[:2]
H2 = np.array([[E0, VG], [VG, E0]]); e2 = np.linalg.eigvalsh(H2)
print("2x2:", e2.round(4), "gap", round(e2[1]-e2[0], 5), "| 15 onde:", e15.round(4), "gap", round(e15[1]-e15[0], 5))
print("spostamento comune ~ V_G^2/8E0 =", round(VG**2/(8*E0), 4), " misurato", round(e2[0]-e15[0], 4))

# 2) autovettori al bordo: c_{-G}/c_0 = (E-E0)/V_G
w, v = np.linalg.eigh(H2)
for Ei, vi in zip(w, v.T):
    print(f"E={Ei:.4f}  c_-G/c0={vi[1]/vi[0]:+.3f}  (E-E0)/V_G={(Ei-E0)/VG:+.3f}")
# per V_G<0 lo stato piu' basso ha rapporto +1 -> psi_c (cos)

# 3) due onde vicino al bordo e parabole
for Kt in (0.01, 0.03):
    k = np.pi/a + Kt; kp = k - G
    s = 0.5*(Ek(k)+Ek(kp)); d = np.sqrt(0.25*(Ek(kp)-Ek(k))**2 + VG**2)
    ex = (s-d, s+d)
    ap = tuple(E0 + sg*abs(VG) + hb2m*Kt**2/2*(1 + sg*2*E0/abs(VG)) for sg in (-1, +1))
    print(f"Kt={Kt}: esatte {np.round(ex,5)}  parabole {np.round(ap,5)}")
# massa efficace numerica dalla curvatura delle radici esatte
h = 1e-4
def Epm(Kt, sg):
    k = np.pi/a + Kt; kp = k - G
    return 0.5*(Ek(k)+Ek(kp)) + sg*np.sqrt(0.25*(Ek(kp)-Ek(k))**2 + VG**2)
for sg in (-1, +1):
    curv = (Epm(h, sg) - 2*Epm(0, sg) + Epm(-h, sg))/h**2      # = hbar^2/m*
    print(f"banda {'inf' if sg<0 else 'sup'}: m0/m* numerico {curv/hb2m:.3f}  formula {1+sg*2*E0/abs(VG):.3f}")

# 4) <V> sulle onde stazionarie normalizzate
x = np.linspace(0, a, 200001)
V = 2*VG*np.cos(G*x)
for nome, dens in (("psi_c", 1+np.cos(G*x)), ("psi_s", 1-np.cos(G*x))):
    print(nome, "<V> =", round(np.trapezoid(V*dens, x)/a, 5), " (atteso", "+V_G" if nome=="psi_c" else "-V_G", ")")

# 5) lontano dal bordo, k = pi/2a, |V_G| = 0.1 E0
VGs = 0.1*E0; k = np.pi/(2*a); kp = k - G
print("lontano: Ek/E0 =", Ek(k)/E0, " Ek'/E0 =", Ek(kp)/E0, " spostamento/E0 =", round(VGs**2/(Ek(k)-Ek(kp))/E0, 4))

# 6) esercizi E9-E10 (a = 3 A, V_G = -0.5 eV, hbar^2/2m0 = 3.81 eV A^2)
E0e = 3.81*(np.pi/3)**2; VGe = -0.5
print("E9: E0 =", round(E0e, 3), " E- =", round(E0e-abs(VGe), 3), " E+ =", round(E0e+abs(VGe), 3))
r = 2*E0e/abs(VGe)
print("E10: 2E0/|V_G| =", round(r, 2), " m*/m0 banda1 =", round(1/(1-r), 4), " banda2 =", round(1/(1+r), 4))
