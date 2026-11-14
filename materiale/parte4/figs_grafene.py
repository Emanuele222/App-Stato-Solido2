"""Figura del §6 (Lezione 6a, seconda parte): bande pi e pi* del grafene a legami forti
(E = +- t|f(k)|, t = 2,8 eV) lungo M-Gamma-K-M e densita' degli stati. Scrive figs/grafene_bande.tex."""
import numpy as np
a=2.46; t=2.8
a1=a*np.array([np.sqrt(3)/2,-0.5]); a2=a*np.array([np.sqrt(3)/2,0.5])
b1=2*np.pi/a*np.array([1/np.sqrt(3),-1]); b2=2*np.pi/a*np.array([1/np.sqrt(3),1])
d=[(a1+a2)/3]; d+= [d[0]-a1, d[0]-a2]
f=lambda k: abs(sum(np.exp(1j*(k@x)) for x in d))
G=np.zeros(2); M=(b1+b2)/2; K=(2*b2+b1)/3
pts=[M,G,K,M]; s=[0.0]; ks=[]
for P,Q in zip(pts[:-1],pts[1:]):
    L=np.linalg.norm(Q-P); n=int(200*L)
    for i in range(n):
        ks.append(P+(Q-P)*i/n); s.append(s[-1]+L/n)
ks.append(M); s=np.array(s[:len(ks)])
E=np.array([t*f(k) for k in ks])
tick=[0,np.linalg.norm(M),np.linalg.norm(M)+np.linalg.norm(K),s[-1]]
# DOS (per cella, entrambi gli spin), istogramma
Nk=1500; u=(np.arange(Nk)+0.5)/Nk; U,V=np.meshgrid(u,u)
kx=U*b1[0]+V*b2[0]; ky=U*b1[1]+V*b2[1]
Ek=t*np.abs(sum(np.exp(1j*(kx*x[0]+ky*x[1])) for x in d)).ravel()
bins=np.linspace(-9,9,181); h,_=np.histogram(np.concatenate([Ek,-Ek]),bins=bins)
g=2*h/(Nk*Nk)/(bins[1]-bins[0]); ec=(bins[1:]+bins[:-1])/2
c=lambda x,y:" ".join(f"({p:.4f},{q:.4f})" for p,q in zip(x,y))
tex=r"""%% generata da figs_grafene.py
\begin{tikzpicture}
\begin{axis}[name=bande, width=8.4cm, height=6.6cm, xmin=0, xmax=%(L).4f, ymin=-9, ymax=9,
  xtick={%(t1).4f,%(t2).4f,%(t3).4f,%(L).4f}, xticklabels={$M$,$\Gamma$,$K$,$M$}, ylabel={$E$ (eV)},
  ytick={-8.4,-2.8,0,2.8,8.4}, yticklabels={$-3t$,$-t$,$0=\EF$,$t$,$3t$}, xmajorgrids, grid style={black!20}]
  \fill[vB!10] (axis cs:0,-9) rectangle (axis cs:%(L).4f,0);
  \addplot[very thick, color=vB] coordinates {%(lo)s};
  \addplot[very thick, color=vA] coordinates {%(hi)s};
  \addplot[black!60, dashed] coordinates {(0,0) (%(L).4f,0)};
  \node[font=\footnotesize, color=vA] at (axis cs:%(xl).4f,6.4) {$\pi^*$ (vuota)};
  \node[font=\footnotesize, color=vB] at (axis cs:%(xl).4f,-6.6) {$\pi$ (piena)};
  \node[font=\footnotesize, anchor=south] at (axis cs:%(t3).4f,0.4) {punto di Dirac};
\end{axis}
\begin{axis}[at={(bande.east)}, anchor=west, xshift=0.5cm, width=4.6cm, height=6.6cm, ymin=-9, ymax=9, xmin=0,
  yticklabels={}, xlabel={$g(E)$ (eV$^{-1}$ per cella)}, xtick={0,0.5}, xmax=0.75]
  \addplot[thick, color=accent] coordinates {%(dos)s};
  \addplot[black!60, dashed] coordinates {(0,0) (0.75,0)};
\end{axis}
\end{tikzpicture}
"""%dict(L=s[-1],t1=tick[1],t2=tick[1],t3=tick[2],lo=c(s,-E),hi=c(s,E),xl=tick[1],dos=c(g,ec))
tex=tex.replace("xtick={%.4f,%.4f,"%(tick[1],tick[1]),"xtick={0,%.4f,"%tick[1])
open("figs/grafene_bande.tex","w").write(tex)
print("max DOS",g.max(), "L",s[-1], tick)
