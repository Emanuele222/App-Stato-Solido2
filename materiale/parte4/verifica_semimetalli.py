"""Verifiche per il §6 della Parte 4 (Lezione 6a, seconda parte): bismuto, grafene, ibridazione."""
import numpy as np
hbar=1.054571817e-34; eV=1.602176634e-19; e=eV; m0=9.1093837e-31
print("== reticolo del grafene (slide 20)")
a=2.46; a1=a*np.array([np.sqrt(3)/2,-0.5]); a2=a*np.array([np.sqrt(3)/2,0.5])
b1=2*np.pi/a*np.array([1/np.sqrt(3),-1]); b2=2*np.pi/a*np.array([1/np.sqrt(3),1])
print("a_i.b_j/2pi:",np.round(np.array([[a1@b1,a1@b2],[a2@b1,a2@b2]])/2/np.pi,12))
print("|b| =",np.linalg.norm(b1),"= 4pi/(sqrt3 a) =",4*np.pi/np.sqrt(3)/a)
print("a_CC = a/sqrt3 =",a/np.sqrt(3))
G=np.zeros(2); M=(b1+b2)/2; K=(2*b2+b1)/3  # vertex
print("|GM| =",np.linalg.norm(M),"2pi/(sqrt3 a)=",2*np.pi/np.sqrt(3)/a,"  |GK|=",np.linalg.norm(K),"4pi/3a=",4*np.pi/3/a)
# neighbours of A: B at delta_i. B = A + (a1+a2)/3 ...
d1=(a1+a2)/3; d2=d1-a1; d3=d1-a2
print("|delta|:",[round(np.linalg.norm(x),4) for x in (d1,d2,d3)])
f=lambda k: sum(np.exp(1j*(k@d)) for d in (d1,d2,d3))
print("|f(Gamma)|=",abs(f(G)),"|f(M)|=",abs(f(M)),"|f(K)|=",abs(f(K)),"|f(K')|",abs(f((2*b1+b2)/3)))
# near K
t=2.8
for q in (1e-3,1e-2):
    for ang in (0,1.0,2.0):
        dk=q*np.array([np.cos(ang),np.sin(ang)])
        print(f" q={q}: |f|/q = {abs(f(K+dk))/q:.5f}  (3 a_CC/2 = {1.5*a/np.sqrt(3):.5f})")
vF=1.5*t*eV*(a/np.sqrt(3))*1e-10/hbar
print(f"v_F = 3 t a_CC/(2 hbar) = {vF:.3e} m/s  (c/v_F={2.998e8/vF:.0f})")
print("E(Gamma) = -3t =",-3*t,"  E(M) = -t =",-t)
# DOS numerica e confronto
Nk=4000
u=(np.arange(Nk)+0.5)/Nk
U,V=np.meshgrid(u,u)
kx=U*b1[0]+V*b2[0]; ky=U*b1[1]+V*b2[1]
ff=sum(np.exp(1j*(kx*d[0]+ky*d[1])) for d in (d1,d2,d3))
E=t*np.abs(ff).ravel()
Acell=abs(a1[0]*a2[1]-a1[1]*a2[0])  # A^2
E0=0.3; dE=0.02
cnt=np.sum((E>E0-dE/2)&(E<E0+dE/2))
g_num=2*cnt/(Nk*Nk)/dE/Acell   # per eV per A^2, spin 2, upper band only (E>0)
vF_A=1.5*t*a/np.sqrt(3)  # hbar v_F in eV*A
g_an=2*E0/(np.pi*vF_A**2)
print(f"g(0.3 eV): numerica {g_num:.5f}, 2E/(pi (hbar vF)^2) = {g_an:.5f}  eV^-1 A^-2")
print("n per E_F=0.1 eV (drogato):", (0.1/vF_A)**2/np.pi*1e20, "m^-2",(0.1/vF_A)**2/np.pi*1e16,"cm^-2")
print("== ibridi sp2 e sp3")
s3=1/np.sqrt(3)
H=np.array([[s3,0,np.sqrt(2/3)],[s3,1/np.sqrt(2),-1/np.sqrt(6)],[s3,-1/np.sqrt(2),-1/np.sqrt(6)]])
print("sp2 H H^T =\n",np.round(H@H.T,12))
for r in H: print("direzione p:",np.degrees(np.arctan2(r[2],r[1])))
S=0.5*np.array([[1,1,1,1],[1,1,-1,-1],[1,-1,-1,1],[1,-1,1,-1]])
print("sp3 S S^T=\n",S@S.T); print("angolo sp3:",np.degrees(np.arccos(-1/3)))
print("== bismuto")
nat=2.82e28; nfeg=5*nat; RHfeg=-1/(nfeg*e)
n=3e23
print(f"R_H libero (5 e/atomo) = {RHfeg:.2e} m^3/C; atomi per portatore = {nat/n:.1e}")
for r in (1,2,3):
    bh=1; be=r*bh
    RH=(bh-be)/(e*n*(bh+be))
    print(f"b_e/b_h={r}: R_H = {RH:.2e} m^3/C, rapporto con libero {RH/RHfeg:.2e}")
print("== massa relativistica e definizione alternativa")
for kk in (0.0,1.0):
    mr=1; c=1; Ek=np.sqrt((kk*c)**2+(mr*c**2)**2)
    print(kk, Ek/c**2)
