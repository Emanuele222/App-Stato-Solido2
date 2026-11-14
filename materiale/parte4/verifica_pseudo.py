"""Verifiche numeriche per il paragrafo sullo pseudopotenziale (Lezione 5e).

1. Stima di Ashcroft-Mermin (11.2)-(11.4) del coefficiente di Fourier del potenziale
   coulombiano nudo per il Si, confrontata con il fattore di forma V3^s della slide 30.
2. Limite q -> 0 dello pseudopotenziale schermato: -(2/3) E_F (Thomas-Fermi, unita SI).
3. Tabella delle masse in Gamma (slide 31): riga "(2.44)" contro E0/E_P con E_P = 20 eV.
4. Stima E_P = 2 P^2/m0 con P ~ hbar 2pi/a.
5. Modello 1D: equivalenza tra equazione vera e pseudo-equazione (H + V')psi_f = E psi_f,
   V' = sum_c (E - E_c)|c><c|, e non unicita (W' con f arbitraria da lo stesso E).
"""
import numpy as np

hb2m = 3.80998   # hbar^2/2m0 in eV*A^2
Ry = 13.6057     # eV
a0 = 0.529177    # A
e2_4pie0 = 14.39964  # e^2/(4 pi eps0) in eV*A

print("=== 1. Stima di Ashcroft-Mermin per il Si ===")
a = 5.431
Omega = a**3 / 8          # volume per atomo (diamante: 8 atomi nella cella cubica)
K = 2*np.pi/a*np.sqrt(3)  # G_111
Za = 14
UK_SI = Za*4*np.pi*e2_4pie0/(Omega*K**2)          # Z e^2/(eps0 Omega K^2)
UK_AM = Ry*(a0**3/Omega)*8*np.pi*Za/(a0*K)**2      # forma (11.4)
print(f"Omega = {Omega:.3f} A^3, K = {K:.3f} 1/A, (a0 K)^2 = {(a0*K)**2:.3f}, a0^3/Omega = {a0**3/Omega:.4f}")
print(f"|U_K| (SI) = {UK_SI:.1f} eV, |U_K| (11.4) = {UK_AM:.1f} eV")
print(f"E_libero(G111/2) = {hb2m*(K/2)**2:.2f} eV ; V3s = -0.211 Ry = {-0.211*Ry:.2f} eV")
for G2 in (3, 8, 11):
    KK = 2*np.pi/a*np.sqrt(G2)
    print(f"  |G|^2={G2:2d}: |G|={KK:.3f} 1/A, |U| nudo = {Za*4*np.pi*e2_4pie0/(Omega*KK**2):.1f} eV")
print("fattori di forma Si (Ry->eV):", [round(v*Ry, 2) for v in (-0.211, 0.04, 0.08)])

print("\n=== 2. Limite q->0: -(2/3)E_F ===")
# v_ion(q) = -Z e^2/(eps0 Omega q^2);  k_TF^2 = e^2 g(EF)/eps0;  g = 3n/(2EF), n = Z/Omega
# v(0) = -Z e^2/(eps0 Omega k_TF^2) = -Z/(Omega g) = -(2/3) EF  (Z, Omega, e^2 si semplificano)
for nome, n_cm3, Z in (("Na", 2.65e22, 1), ("Al", 18.1e22, 3)):
    n = n_cm3*1e-24  # 1/A^3
    kF = (3*np.pi**2*n)**(1/3)
    EF = hb2m*kF**2
    g = 3*n/(2*EF)
    kTF2 = 4*np.pi*e2_4pie0*g
    Omega_i = Z/n
    v0 = -Z*4*np.pi*e2_4pie0/(Omega_i*kTF2)
    print(f"{nome}: kF={kF:.3f} 1/A, EF={EF:.2f} eV, kTF={np.sqrt(kTF2):.3f} 1/A, v(0)={v0:.3f} eV, -(2/3)EF={-2/3*EF:.3f} eV")

print("\n=== 3. Masse in Gamma (slide 31) ===")
dati = {"Ge": (0.89, 0.041, 0.04), "GaAs": (1.55, 0.067, 0.078), "InP": (1.34, 0.073, 0.067),
        "InAs": (0.45, 0.026, 0.023), "GaSb": (0.81, 0.047, 0.04), "InSb": (0.24, 0.015, 0.012),
        "CdTe": (1.59, 0.11, 0.08)}
for k, (E0, mexp, m244) in dati.items():
    print(f"{k:5s} E0={E0:4.2f}  E0/20={E0/20:.4f}  1/(1+20/E0)={1/(1+20/E0):.4f}  (2.44)={m244}  exp={mexp}")

print("\n=== 4. Stima E_P con P ~ hbar 2pi/a ===")
for nome, aa in (("Si", 5.431), ("Ge", 5.658), ("GaAs", 5.653), ("InSb", 6.479)):
    EP = 4*hb2m*(2*np.pi/aa)**2
    print(f"{nome}: a={aa} A, E_P ~ {EP:.1f} eV")

print("\n=== 5. Modello 1D: pseudo-equazione e non unicita ===")
# cristallo 1D: catena di buche profonde (gaussiane) di passo a; base di onde piane, k = 0.
a1 = 4.0
Gs = 2*np.pi/a1*np.arange(-40, 41)
# potenziale V(x) = -V0 sum exp(-x^2/(2 s^2)) : coefficienti di Fourier
V0, s = 60.0, 0.25
def VG(G):
    return -V0*np.sqrt(2*np.pi)*s/a1*np.exp(-(G*s)**2/2)
kpt = 0.3*np.pi/a1
H = np.diag(hb2m*(kpt+Gs)**2).astype(complex)
for i, Gi in enumerate(Gs):
    for j, Gj in enumerate(Gs):
        if i != j:
            H[i, j] = VG(Gi-Gj)
E, C = np.linalg.eigh(H)
print("prime energie vere (eV):", np.round(E[:4], 3))
# banda piu bassa = "core" (molto stretta), le altre = valenza
Ec = E[0]; c = C[:, 0]
Ev = E[1]; v = C[:, 1]
print(f"E_core = {Ec:.3f}, E_valenza = {Ev:.3f}, <c|v> = {abs(np.vdot(c, v)):.1e}")
# pseudo-Hamiltoniana con V' = (E - Ec)|c><c| valutata all'energia vera di valenza
P = np.outer(c, c.conj())
wps, Cps = np.linalg.eigh(H + (Ev-Ec)*P)
print("autovalori di H + (Ev-Ec)|c><c| :", np.round(wps[:3], 4))
print("  -> contiene Ev; anche lo stato di core finisce a Ev (Ec + (Ev-Ec)): psi_f e' definita a meno di alfa*psi_c")
# lo stato vero e' (1-P) psi_f, per qualunque combinazione degenere scelta
for alfa in (0.0, 0.7, -2.0):
    psif = v + alfa*c          # una pseudo-funzione: v piu una parte di core
    r = (H + (Ev-Ec)*P)@psif - Ev*psif
    psi = psif - P@psif
    print(f"alfa={alfa:5.1f}: |(H+V'-E)psi_f| = {np.linalg.norm(r):.1e}, |<v|(1-P)psi_f>|/norma = {abs(np.vdot(v, psi))/np.linalg.norm(psi):.6f}")
# non unicita: W' = V + f |c><c| con f arbitraria: l'autovalore di valenza non cambia
for f in (0.0, 5.0, 50.0, -3.0):
    w = np.linalg.eigvalsh(H + f*P)
    print(f"f = {f:5.1f}: autovalore piu vicino a Ev = {w[np.argmin(abs(w-Ev))]:.6f}")
