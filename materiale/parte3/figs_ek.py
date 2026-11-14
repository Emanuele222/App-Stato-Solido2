"""Genera figs/ek.tex: bande del modello a elettroni quasi liberi (1D), unita' (hbar^2/2m)(pi/a)^2."""
import numpy as np
V = 0.42


def bands(x, nmax=6):
    Gs = np.arange(-nmax, nmax + 1) * 2
    H = np.diag((x + Gs) ** 2).astype(float)
    for i in range(len(Gs)):
        for j in range(len(Gs)):
            if abs(i - j) == 1:
                H[i, j] = V
    return np.linalg.eigvalsh(H)[:3]


xs = np.linspace(-1, 1, 81)
B = np.array([bands(x) for x in xs])
coords = lambda col: " ".join(f"({x:.3f},{b[col]:.4f})" for x, b in zip(xs, B))
lo, hi = bands(1)[0], bands(1)[1]
tex = r"""\begin{tikzpicture}
\begin{axis}[width=7.4cm, height=6.4cm, axis lines=left, xmin=-2.2, xmax=2.2, ymin=-0.9, ymax=5.0,
  xtick={-2,-1,0,1,2}, xticklabels={$-2\pi/a$,$-\pi/a$,$0$,$\pi/a$,$2\pi/a$}, ytick=\empty, xlabel={$k$}, ylabel={$E(k)$}, label style={font=\small}, tick label style={font=\scriptsize},
  every axis x label/.style={at={(ticklabel* cs:1)}, anchor=west}, every axis y label/.style={at={(ticklabel* cs:1)}, anchor=south}, clip=false]
\addplot[black!45, thick, densely dashed, domain=-2.15:2.15, samples=100] {x^2};
\addplot[occ!85!black, very thick] coordinates {@C0@};
\addplot[hole!85!black, very thick] coordinates {@C1@};
\draw[boxkey, thin] (axis cs:-1,-0.9) -- (axis cs:-1,5.0);
\draw[boxkey, thin] (axis cs:1,-0.9) -- (axis cs:1,5.0);
\fill[bandempty!70] (axis cs:-1,@LO@) rectangle (axis cs:1,@HI@);
\node[font=\scriptsize, anchor=west] at (axis cs:1.08,@MID@) {gap $\Eg$};
\node[font=\scriptsize, occ!85!black, anchor=north] at (axis cs:0,-0.2) {banda 1};
\node[font=\scriptsize, hole!85!black, anchor=south] at (axis cs:0,@TOP@) {banda 2};
\node[font=\scriptsize, black!55, anchor=north west] at (axis cs:1.6,2.5) {$\hbar^2k^2/2m_0$};
\end{axis}
\end{tikzpicture}
"""
for k, v in {"@C0@": coords(0), "@C1@": coords(1), "@LO@": f"{lo:.4f}", "@HI@": f"{hi:.4f}",
             "@MID@": f"{(lo+hi)/2:.3f}", "@TOP@": f"{B[40][1]+0.12:.3f}"}.items():
    tex = tex.replace(k, v)
open("figs/ek.tex", "w").write(tex)
print("gap =", hi - lo, "; m*/m0 =", 1 / ((bands(1e-3)[0] - bands(0)[0]) / 1e-6))
