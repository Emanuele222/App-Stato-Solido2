"""Verifica dei numeri della Lecture 5a e calcoli per esempi/esercizi (Parte 3)."""
import numpy as np
from scipy.constants import hbar, h, m_e, k as kB, e, N_A, pi, u, m_p

eV = e
print("== rapporti di massa m_e/M")
for nm, A in [("p", None), ("Na", 22.990), ("Si", 28.086), ("C", 12.011)]:
    M = m_p if A is None else A * u
    print(f"   {nm:2s}: m_e/M = {m_e/M:.3e}   sqrt(M/m_e) = {np.sqrt(M/m_e):.1f}   M/m_e = {M/m_e:.3e}")
print("== scale temporali")
wi = 2 * pi * 1e13  # ??? la slide usa nu_i ~ 1e13 s^-1
print("   t_i = 1/nu_i =", 1 / 1e13, "s ;  periodo 2pi/omega se omega=1e13:", 2 * pi / 1e13)
Eg = 1 * eV
we = Eg / hbar
print("   omega_e = Eg/hbar =", we, "rad/s ; t_e = 1/omega_e =", 1 / we, "s ; h/Eg =", h / Eg)
print("   t_i/t_e (nu_i=1e13: t=1e-13, t_e=1/omega_e):", 1e-13 / (1 / we), "  (t_i=1e-12):", 1e-12 / (1 / we))
print("== spaziatura media dei livelli nella banda 3s del Na")
n_cm3 = 2.65e22
EFNa = hbar**2 / (2 * m_e) * (3 * pi**2 * 2.65e28) ** (2 / 3) / eV
print("   EF(Na) =", EFNa, "eV (larghezza della banda occupata, elettroni liberi)")
N = n_cm3 * 1.0
print("   N per 1 cm^3 =", N, "  W/N =", EFNa / N, "eV ; kT(300K)=", kB * 300 / eV, " eV")
Ncl = 1000
print("   cluster di 1000 atomi: W/N =", EFNa / Ncl, "eV")
print("== catena a=3 A: primo gap a k=pi/a, energia libera")
for a in [3.0, 4.29]:
    kk = pi / (a * 1e-10)
    print(f"   a={a} A: k=pi/a={kk*1e-10:.4f} 1/A ; E=hbar^2k^2/2m = {hbar**2*kk**2/(2*m_e)/eV:.3f} eV")
print("   hbar^2/2m_e =", hbar**2 / (2 * m_e) / eV * 1e20, "eV A^2 ; hbar^2/m_e =", hbar**2 / m_e / eV * 1e20)
print("== tight binding 1D: E = E0 - 2 t cos(ka): m*/m0 = hbar^2/(2 t a^2 m0)")
for t, a in [(1.0, 3.0), (0.5, 3.0), (1.0, 2.0)]:
    ms = hbar**2 / (2 * t * eV * (a * 1e-10) ** 2) / m_e
    print(f"   t={t} eV a={a} A: width 4t={4*t} eV ; m*/m0 = {ms:.3f}")
print("== elettroni per cella")
print("   Si: 2 atomi x 4 =", 8, " stati legante sp3 = 4 x2 spin =", 8)
print("   core Si: 1s2 2s2 2p6 =", 2 + 2 + 6, " valenza 3s2 3p2 =", 4, " totale Z =", 14)
print("== energia del primo gap di Bragg con U (modello due onde) non necessaria")

print("== Esercizi Parte 3")
# E1: cluster Na 1000 atomi
print("   E1: W/N =", EFNa / 1000 * 1e3, "meV ; kT =", kB * 300 / eV * 1e3, "meV ; rapporto", kB * 300 / eV / (EFNa / 1000))
# E2: Si
nSi = 2.33e3 / 28.086e-3 * N_A  # m^-3
print("   E2: nSi =", nSi, "m^-3 =", nSi * 1e-6, "cm^-3 ; elettroni valenza/cm3 =", 4 * nSi * 1e-6,
      " ; atomi nella cella convenzionale 8 -> elettroni", 8 * 4, " ; a_Si=5.43 A: atomi/cm3=", 8 / (5.431e-8) ** 3)
# E5 catena
for a, V in [(3.0, 0.5)]:
    E0 = hbar**2 * (pi / (a * 1e-10)) ** 2 / (2 * m_e) / eV
    print(f"   E5: a={a} A: k=pi/a={pi/a:.4f} 1/A ; E0={E0:.3f} eV ; |V|={V} -> E-={E0-V:.3f}, E+={E0+V:.3f}")
# E7: fattori di Boltzmann
for nm, Eg_ in [("Si", 1.12), ("diamante", 5.5)]:
    x = Eg_ * eV / (2 * kB * 300)
    print(f"   E7: {nm}: Eg/2kT = {x:.2f} ; exp(-x) = {np.exp(-x):.3e}")
x1 = 1.12 * eV / (2 * kB * 300); x2 = 5.5 * eV / (2 * kB * 300)
print("   E7: rapporto Si/diamante =", np.exp(-x1 + x2))
# E3/E4
print("   E3: Na  v_e/v_ion (stessa energia) =", np.sqrt(22.990 * u / m_e), "; stesso campo E dt:", 22.990 * u / m_e)
print("   E3: Si  v_e/v_ion =", np.sqrt(28.086 * u / m_e), "; stesso campo:", 28.086 * u / m_e)
print("   E4: Eg=1eV t_e=hbar/Eg =", hbar / eV, "s ; t_i/t_e (1e-13, 1e-12) =", 1e-13 / (hbar / eV), 1e-12 / (hbar / eV))
print("   E4: Eg=2eV :", 1e-13 / (hbar / (2 * eV)))
# E6 tight-binding
for t_, a in [(1.0, 3.0), (0.5, 3.0), (2.0, 3.0)]:
    print(f"   E6: t={t_} a={a}: m*/m0 = {hbar**2/(2*t_*eV*(a*1e-10)**2)/m_e:.3f}, W=4t={4*t_}")
# conteggio coordinate
print("   coordinate di 1e23 elettroni + 1e23 nuclei: 6e23")
# Na: distanza tra livelli, densita atomi per cm3 Na
print("   Na: N/cm3 =", 2.65e22, " W/N=", EFNa / 2.65e22, "eV")
