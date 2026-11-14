"""Verifiche numeriche del §5 (Lezione 6a, prima parte: bande dei materiali veri).

Unità: Å, eV.  hbar^2/2m0 = 3.80998 eV Å^2.
Stampa i numeri usati nel testo e negli esercizi E11-E13.
"""
import numpy as np

H2M = 3.80998          # hbar^2/2m0 in eV Å^2
HBARC = 1973.27        # hbar c in eV Å
RY = 13.6057           # Ry in eV

def titolo(s):
    print("\n" + "=" * 70 + "\n" + s + "\n" + "=" * 70)

# ---------------------------------------------------------------------------
titolo("Alluminio: sfera di Fermi libera e prima zona (fcc, a = 4.05 Å)")
a = 4.05
b = 2 * np.pi / a                       # 2pi/a
n3 = 12 / a**3                          # 3 elettroni, 4 atomi per cella cubica
kF = (3 * np.pi**2 * n3) ** (1 / 3)
EF = H2M * kF**2
punti = {"X": (1, 0, 0), "L": (0.5, 0.5, 0.5), "K": (0.75, 0.75, 0), "W": (1, 0.5, 0)}
print(f"2pi/a = {b:.4f} Å^-1, n = {n3:.4f} Å^-3 = {n3*1e30:.3e} m^-3")
print(f"kF = {kF:.4f} Å^-1 = {kF/b:.4f} (2pi/a),  EF = {EF:.2f} eV")
for p, c in punti.items():
    d = np.linalg.norm(c) * b
    print(f"  |Gamma {p}| = {np.linalg.norm(c):.4f} (2pi/a) = {d:.4f} Å^-1 ; "
          f"E libero = {H2M*d**2:.2f} eV sopra il fondo ({H2M*d**2-EF:+.2f} eV da EF)")
VBZ = 4 * b**3
print(f"volume sfera / volume zona = {(4/3*np.pi*kF**3)/VBZ:.4f}")
print(f"kF / |Gamma W| = {kF/(np.linalg.norm(punti['W'])*b):.4f}")
# un elettrone per cella
n1 = n3 / 3
kF1 = (3 * np.pi**2 * n1) ** (1 / 3)
EF1 = H2M * kF1**2
print(f"1 elettrone: kF' = {kF1:.4f} Å^-1 = {kF1/b:.4f} (2pi/a); "
      f"kF'/|GammaL| = {kF1/(np.linalg.norm(punti['L'])*b):.3f}; EF' = {EF1:.2f} eV sopra il fondo, "
      f"cioè {EF1-EF:+.2f} eV sulla scala con EF(3e) = 0")
# linea tratteggiata a -8 eV nella figura (fondo a circa -11.2 eV)
for fondo in (-11.2, -EF):
    dE = -8 - fondo
    k = np.sqrt(dE / H2M)
    ncell = k**3 / (3 * np.pi**2) * (a**3 / 4)
    print(f"  linea a -8 eV con fondo {fondo:.2f}: {dE:.2f} eV sopra il fondo -> {ncell:.2f} elettroni per cella")
# fattore 3^(2/3)
print(f"EF/EF' = 3^(2/3) = {3**(2/3):.3f}")

# ---------------------------------------------------------------------------
titolo("Fotoemissione: impulso del fotone e K parallelo")
hnu = 21.2           # He I
phi = 4.28           # funzione lavoro dell'Al (eV)
kph = hnu / HBARC
print(f"k fotone (21.2 eV) = {kph:.4f} Å^-1 = {kph/b*100:.2f} % di 2pi/a (Al)")
Ekin = hnu - phi
Kfac = 1 / np.sqrt(H2M)       # sqrt(2m E)/hbar = sqrt(E/H2M)
print(f"sqrt(2m0/hbar^2) = {Kfac:.4f} Å^-1 eV^-1/2")
for th in (0, 15, 30, 45, 60):
    K = np.sqrt(Ekin / H2M) * np.sin(np.radians(th))
    print(f"  E_kin = {Ekin:.2f} eV, theta = {th:2d}°: K_par = {K:.3f} Å^-1 = {K/b:.3f} (2pi/a)")
th_X = np.degrees(np.arcsin(b / np.sqrt(Ekin / H2M)))
print(f"angolo per K_par = 2pi/a: {th_X:.1f}°")
# k perpendicolare con il potenziale interno
Vin = 12.0 + phi        # fondo della banda finale (circa EF + phi sotto il vuoto)
for th in (0, 30):
    kperp = np.sqrt((Ekin * np.cos(np.radians(th))**2 + Vin) / H2M)
    Kperp = np.sqrt(Ekin / H2M) * np.cos(np.radians(th))
    print(f"  theta = {th}°: K_perp (vuoto) = {Kperp:.3f}, k_f_perp (solido, V_in = {Vin:.1f} eV) = {kperp:.3f} Å^-1")
# energia di legame di uno stato 2 eV sotto EF
EB = 2.0
print(f"stato a E_B = 2 eV: E_kin = hnu - phi - E_B = {hnu-phi-EB:.2f} eV")

# ---------------------------------------------------------------------------
titolo("Conteggio degli stati in 1D (slide 19)")
N, a1 = 1000, 3.0
dk = 2 * np.pi / (N * a1)
print(f"N = {N}, a = {a1} Å: Delta k = {dk:.3e} Å^-1, stati per banda (con lo spin) = {2*N}")
print(f"1 e/cella: kF = pi/2a = {np.pi/(2*a1):.4f} Å^-1 -> occupati {int(round(2*(np.pi/(2*a1))/dk))+0} valori di k (x2 spin = N)")

# ---------------------------------------------------------------------------
titolo("Densità degli stati: formula della slide 13 sul gas libero")
# g per unità di volume: (2/(2pi)^3) * 4 pi k^2 / |dE/dk|, dE/dk = 2 H2M k
for E in (1.0, 5.0, 11.65):
    k = np.sqrt(E / H2M)
    g_sup = 2 / (2 * np.pi)**3 * 4 * np.pi * k**2 / (2 * H2M * k)
    g_an = 1 / (2 * np.pi**2) * (1 / H2M)**1.5 * np.sqrt(E)
    print(f"  E = {E:5.2f} eV: superficie {g_sup:.5f}, formula di Parte 2 {g_an:.5f} eV^-1 Å^-3")
print(f"Al: g(EF) = 3n/2EF = {3*n3/(2*EF):.4f} eV^-1 Å^-3")

# ---------------------------------------------------------------------------
titolo("Pseudopotenziale empirico (Cohen-Bergstresser): Si e GaAs")

def reciproci(gmax2):
    """vettori G dell'fcc (unità 2pi/a) con |G|^2 <= gmax2"""
    out = []
    r = int(np.ceil(np.sqrt(gmax2))) + 1
    for h in range(-r, r + 1):
        for k in range(-r, r + 1):
            for l in range(-r, r + 1):
                if (h % 2 == k % 2 == l % 2) and h*h + k*k + l*l <= gmax2:
                    out.append((h, k, l))
    return np.array(out, float)

def bande_epm(kpts, a, Vs, Va, gmax2=21, nb=8):
    G = reciproci(gmax2)
    tau = np.array([1, 1, 1]) / 8.0          # in unità di a
    dG = G[:, None, :] - G[None, :, :]
    q2 = np.rint((dG**2).sum(-1)).astype(int)
    fase = 2 * np.pi * (dG @ tau)            # G.tau con G in 2pi/a e tau in a
    V = np.zeros(q2.shape, complex)
    for q, v in Vs.items():
        V += np.where(q2 == q, v * np.cos(fase), 0)
    for q, v in Va.items():
        V += np.where(q2 == q, 1j * v * np.sin(fase), 0)
    V *= RY
    E = []
    for k in kpts:
        T = H2M * (2 * np.pi / a)**2 * ((k[None, :] + G)**2).sum(-1)
        H = np.diag(T) + V
        E.append(np.linalg.eigvalsh(H)[:nb])
    return np.array(E), len(G)

def percorso(nodi, n=40):
    pts, x, ticks = [], [], [0.0]
    s = 0.0
    for i in range(len(nodi) - 1):
        p0, p1 = np.array(nodi[i][1], float), np.array(nodi[i + 1][1], float)
        L = np.linalg.norm(p1 - p0)
        for j in range(n + (1 if i == len(nodi) - 2 else 0)):
            t = j / n
            pts.append(p0 + t * (p1 - p0))
            x.append(s + t * L)
        s += L
        ticks.append(s)
    return np.array(pts), np.array(x), ticks

nodi = [("L", (0.5, 0.5, 0.5)), ("G", (0, 0, 0)), ("X", (1, 0, 0)), ("W", (1, 0.5, 0)),
        ("K", (0.75, 0.75, 0)), ("G", (0, 0, 0))]
kp, xs, ticks = percorso(nodi, 40)
mat = {
    "Si":   dict(a=5.43, Vs={3: -0.21, 8: 0.04, 11: 0.08}, Va={}),
    "GaAs": dict(a=5.65, Vs={3: -0.252, 8: 0.0, 11: 0.08}, Va={3: 0.068, 4: 0.066, 11: 0.012}),
}
EPM = {}
for nome, p in mat.items():
    E, ng = bande_epm(kp, p["a"], p["Vs"], p["Va"])
    Ev = E[:, 3].max()
    E -= Ev
    EPM[nome] = E
    ic = np.argmin(E[:, 4])
    iv = np.argmax(E[:, 3])
    print(f"{nome}: {ng} onde piane; cima della valenza in x = {xs[iv]:.3f} (Γ = {ticks[1]:.3f}); "
          f"minimo della conduzione {E[ic,4]:.2f} eV in x = {xs[ic]:.3f}")
    iG = int(np.argmin(abs(xs - ticks[1])))
    iX = int(np.argmin(abs(xs - ticks[2])))
    iL = 0
    print(f"   E_c(Γ) = {E[iG,4]:.2f}, E_c(X) = {E[iX,4]:.2f}, E_c(L) = {E[iL,4]:.2f}; "
          f"fondo della valenza {E[:,0].min():.2f} eV; larghezza della valenza {-E[:,0].min():.2f} eV")
    # posizione del minimo lungo Gamma-X
    if nome == "Si":
        tratto = (xs >= ticks[1]) & (xs <= ticks[2])
        j = np.argmin(np.where(tratto, E[:, 4], 99))
        print(f"   minimo lungo ΓX a {(xs[j]-ticks[1])/(ticks[2]-ticks[1]):.2f} della distanza ΓX")
    # degenerazione in Γ
    print(f"   energie in Γ: {np.round(E[iG,:6],2)}")
# confronto con il gas libero di 8 elettroni per cella (fondo della valenza)
for nome, p in mat.items():
    n8 = 8 * 4 / (8 * p["a"]**3) * 2   # 8 elettroni per cella primitiva, a^3/4 volume
    n8 = 8 / (p["a"]**3 / 4)
    kf8 = (3 * np.pi**2 * n8)**(1/3)
    print(f"{nome}: gas libero con 8 e/cella: EF - fondo = {H2M*kf8**2:.1f} eV")

np.savez("epm_bande.npz", x=xs, ticks=ticks, Si=EPM["Si"], GaAs=EPM["GaAs"])
print("\nfatto")
