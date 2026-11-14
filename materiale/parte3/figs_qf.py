"""Genera le figure del capitolo «Elettroni quasi liberi» (Lezione 5c):
   figs/qf_bordo.tex  - bande vicino al bordo di zona (due onde, formula esatta e approssimata)
   figs/qf_onde.tex   - potenziale periodico e densita' delle due onde stazionarie psi_c, psi_s
   figs/qf_scatola.tex- scatola 1D: funzioni d'onda e livelli (atomo, molecola, metallo) in scala
"""
import numpy as np

cs = lambda x, y: " ".join(f"({a:.3f},{b:.4f})" for a, b in zip(x, y))

# =============================================================== qf_bordo
# unita': E0 = hbar^2 (pi/a)^2 / 2 m0 ; x = k a / pi ; Kt = x - 1 ;  u = |V_G|/E0
u = 0.30
X0, X1 = 0.4, 1.6
xs = np.linspace(X0, X1, 121)
Kt = xs - 1
low = 1 + Kt ** 2 - np.sqrt(4 * Kt ** 2 + u ** 2)
up = 1 + Kt ** 2 + np.sqrt(4 * Kt ** 2 + u ** 2)
xa = np.linspace(0.88, 1.12, 25)
Ka = xa - 1
low_a = 1 - u + Ka ** 2 * (1 - 2 / u)
up_a = 1 + u + Ka ** 2 * (1 + 2 / u)
xf = np.linspace(X0, X1, 61)
tex = r"""\begin{tikzpicture}
\begin{axis}[width=10.2cm, height=7.2cm, axis lines=left, xmin=0.4, xmax=1.6, ymin=0, ymax=3.1,
  xtick={0.5,1,1.5}, xticklabels={$\frac{\pi}{2a}$,$\frac{\pi}{a}$,$\frac{3\pi}{2a}$}, ytick=\empty,
  xlabel={$k$}, ylabel={$E(k)$}, label style={font=\small}, tick label style={font=\scriptsize},
  every axis x label/.style={at={(ticklabel* cs:1)}, anchor=west},
  every axis y label/.style={at={(ticklabel* cs:1)}, anchor=south}, clip=false]
\draw[boxkey, thin] (axis cs:1,0) -- (axis cs:1,3.1);
\addplot[black!45, thick, densely dashed] coordinates {@PL@};
\addplot[black!45, thick, densely dashed] coordinates {@PR@};
\addplot[occ!85!black, very thick] coordinates {@LOW@};
\addplot[hole!85!black, very thick] coordinates {@UP@};
\addplot[boxwarn, line width=1.6pt, densely dotted] coordinates {@LOWA@};
\addplot[boxwarn, line width=1.6pt, densely dotted] coordinates {@UPA@};
\draw[<->, thick, black!70] (axis cs:1.04,@LO@) -- (axis cs:1.04,@HI@);
\node[font=\small, anchor=west, fill=white, fill opacity=0.85, text opacity=1, inner sep=1pt] at (axis cs:1.06,1.0) {$2|V_G|$};
\node[font=\scriptsize, black!60, anchor=west] at (axis cs:0.42,2.85) {$E_{k'}=\frac{\hbar^2(k-G)^2}{2m_0}$};
\node[font=\scriptsize, black!60, anchor=east] at (axis cs:1.58,2.85) {$E_{k}=\frac{\hbar^2k^2}{2m_0}$};
\node[font=\scriptsize, occ!85!black, anchor=west] at (axis cs:1.62,0.13) {banda 1 ($E_-$)};
\node[font=\scriptsize, hole!85!black, anchor=west] at (axis cs:1.62,2.60) {banda 2 ($E_+$)};
\node[font=\scriptsize, boxwarn, anchor=east] at (axis cs:1.06,0.10) {parabola approssimata};
\draw[boxwarn, thin] (axis cs:1.0,0.17) -- (axis cs:0.99,0.68);
\end{axis}
\end{tikzpicture}
"""
rep = {"@PL@": cs(xf, (xf - 2) ** 2), "@PR@": cs(xf, xf ** 2), "@LOW@": cs(xs, low), "@UP@": cs(xs, up),
       "@LOWA@": cs(xa, low_a), "@UPA@": cs(xa, up_a), "@LO@": f"{1 - u:.3f}", "@HI@": f"{1 + u:.3f}"}
for k, v in rep.items():
    tex = tex.replace(k, v)
open("figs/qf_bordo.tex", "w").write(tex)

# =============================================================== qf_onde
x = np.linspace(-0.5, 2.5, 301)
V = -2 * np.cos(2 * np.pi * x)            # V(x)/|V_G| con V_G<0 (minimi sugli ioni x = n a)
pp = 2 * np.cos(np.pi * x) ** 2           # |psi(+)|^2 normalizzata (media 1)
pm = 2 * np.sin(np.pi * x) ** 2           # |psi(-)|^2
tex = r"""\begin{tikzpicture}
\begin{axis}[name=top, width=12.2cm, height=3.3cm, axis lines=left, xmin=-0.5, xmax=2.5, ymin=-2.6, ymax=2.6,
  xtick={0,1,2}, xticklabels={\empty,\empty,\empty}, ytick={0}, yticklabels={$0$}, tick label style={font=\scriptsize},
  ylabel={$V(x)$}, label style={font=\small}, every axis y label/.style={at={(ticklabel* cs:1)}, anchor=south}, clip=false]
\addplot[black, thick] coordinates {@V@};
\fill[black] (axis cs:0,-2) circle (2.2pt); \fill[black] (axis cs:1,-2) circle (2.2pt); \fill[black] (axis cs:2,-2) circle (2.2pt);
\node[font=\scriptsize, anchor=west] at (axis cs:2.55,-2) {ioni ($V_G<0$)};
\end{axis}
\begin{axis}[at={(top.south west)}, yshift=-0.9cm, anchor=north west, width=12.2cm, height=4.2cm, axis lines=left,
  xmin=-0.5, xmax=2.5, ymin=0, ymax=2.5, xtick={0,1,2}, xticklabels={$0$,$a$,$2a$}, ytick=\empty,
  tick label style={font=\scriptsize}, xlabel={$x$}, ylabel={$|\psi|^2$}, label style={font=\small},
  every axis x label/.style={at={(ticklabel* cs:1)}, anchor=west},
  every axis y label/.style={at={(ticklabel* cs:1)}, anchor=south}, clip=false]
\addplot[occ!85!black, very thick] coordinates {@PP@};
\addplot[hole!85!black, very thick] coordinates {@PM@};
\draw[black!35, densely dotted] (axis cs:0,0) -- (axis cs:0,2.5);
\draw[black!35, densely dotted] (axis cs:1,0) -- (axis cs:1,2.5);
\draw[black!35, densely dotted] (axis cs:2,0) -- (axis cs:2,2.5);
\node[font=\scriptsize, occ!85!black, anchor=west] at (axis cs:2.55,2.0) {$|\psi_c|^2=2\cos^2\frac{\pi x}{a}$};
\node[font=\scriptsize, occ!85!black, anchor=west] at (axis cs:2.55,1.5) {sugli ioni: $E_-$ (più bassa)};
\node[font=\scriptsize, hole!85!black, anchor=west] at (axis cs:2.55,0.8) {$|\psi_s|^2=2\sin^2\frac{\pi x}{a}$};
\node[font=\scriptsize, hole!85!black, anchor=west] at (axis cs:2.55,0.3) {tra gli ioni: $E_+$ (più alta)};
\end{axis}
\end{tikzpicture}
"""
tex = tex.replace("@V@", cs(x, V)).replace("@PP@", cs(x, pp)).replace("@PM@", cs(x, pm))
open("figs/qf_onde.tex", "w").write(tex)

# =============================================================== qf_scatola
# pannello sinistro: psi_n = sin(n pi x/L) attorno al livello E_n = n^2 E_1 (scala 0.42 cm per E_1)
sc = 0.42
parts = []
parts.append(r"\draw[black!70, line width=0.8pt] (0,0) -- (0,%.2f); \draw[black!70, line width=0.8pt] (3,0) -- (3,%.2f);" % (10 * sc, 10 * sc))
parts.append(r"\draw[black!70, line width=0.8pt] (0,0) -- (3,0);")
xl = np.linspace(0, 1, 61)
cols = {1: "occ!85!black", 2: "exc!80!black", 3: "hole!85!black"}
for n in (1, 2, 3):
    E = n * n
    y = E * sc + 0.75 * np.sin(n * np.pi * xl) * (0.55 if n == 1 else 0.7)
    pts = " ".join(f"({3 * a:.3f},{b:.3f})" for a, b in zip(xl, y))
    parts.append(r"\draw[black!30, densely dashed] (0,%.3f) -- (3,%.3f);" % (E * sc, E * sc))
    parts.append(r"\draw[%s, very thick] plot[smooth] coordinates {%s};" % (cols[n], pts))
lab = {1: r"$E_1$", 2: r"$E_2=4E_1$", 3: r"$E_3=9E_1$"}
for n in (1, 2, 3):
    parts.append(r"\node[font=\scriptsize, anchor=west] at (3.12,%.3f) {%s};" % (n * n * sc, lab[n]))
parts.append(r"\node[font=\scriptsize, anchor=north] at (0,-0.05) {$0$}; \node[font=\scriptsize, anchor=north] at (3,-0.05) {$L$};")
parts.append(r"\node[font=\small, anchor=south] at (1.5,%.2f) {$\psi_n=A\sin\frac{n\pi x}{L}$};" % (10 * sc + 0.1))
left = "\n".join(parts)

sy = 0.125  # cm per eV
AX, X0, X1, X2 = 5.6, 7.0, 9.1, 11.2
w = 0.62
R = []
R.append(r"\draw[->, thick] (%.2f,0) -- (%.2f,%.2f) node[above, font=\small] {$E$ (eV)};" % (AX, AX, 41 * sy))
for t in (0, 10, 20, 30, 40):
    R.append(r"\draw (%.2f,%.3f) -- (%.2f,%.3f) node[left=5pt, font=\scriptsize] {$%d$};" % (AX - 0.07, t * sy, AX + 0.07, t * sy, t))
for X, nome, L in ((X0, "atomo", r"\SI{3}{\angstrom}"), (X1, "molecola", r"\SI{15}{\angstrom}"), (X2, "metallo", r"\SI{3}{mm}")):
    R.append(r"\node[font=\small\bfseries, anchor=north] at (%.2f,-0.12) {%s};" % (X, nome))
    R.append(r"\node[font=\scriptsize, anchor=north] at (%.2f,-0.52) {$L=%s$};" % (X, L))
# atomo
for E in (4.178, 16.71, 37.60):
    R.append(r"\draw[very thick, black!80] (%.2f,%.3f) -- (%.2f,%.3f);" % (X0 - w / 2, E * sy, X0 + w / 2, E * sy))
R.append(r"\node[font=\scriptsize, anchor=west] at (%.2f,%.3f) {\SI{4,18}{eV}};" % (X0 + w / 2 + 0.05, 4.178 * sy + 0.14))
R.append(r"\node[font=\scriptsize, anchor=west] at (%.2f,%.3f) {\SI{16,7}{eV}};" % (X0 + w / 2 + 0.05, 16.71 * sy))
R.append(r"\node[font=\scriptsize, anchor=west] at (%.2f,%.3f) {\SI{37,6}{eV}};" % (X0 + w / 2 + 0.05, 37.60 * sy))
R.append(r"\node[font=\scriptsize, occ!85!black] at (%.2f,%.3f) {$\uparrow\downarrow$};" % (X0, 4.178 * sy + 0.17))
# molecola
for E in (0.1671, 0.6685, 1.504):
    R.append(r"\draw[very thick, black!80] (%.2f,%.3f) -- (%.2f,%.3f);" % (X1 - w / 2, E * sy, X1 + w / 2, E * sy))
R.append(r"\node[font=\scriptsize, occ!85!black, anchor=east] at (%.2f,%.3f) {$\uparrow\downarrow$};" % (X1 - w / 2 - 0.02, 0.1671 * sy + 0.02))
R.append(r"\node[font=\scriptsize, anchor=south, align=center] at (%.2f,%.3f) {\SI{0,17}{eV}; \SI{0,67}{eV};\\ \SI{1,5}{eV}};" % (X1, 1.5 * sy + 0.55))
R.append(r"\draw[black!50, thin] (%.2f,%.3f) -- (%.2f,%.3f);" % (X1, 1.5 * sy + 0.55, X1, 1.5 * sy + 0.07))
# metallo: banda 0..EF piena, EF = 4.178
R.append(r"\fill[occ!35] (%.2f,0) rectangle (%.2f,%.3f);" % (X2 - w / 2, X2 + w / 2, 4.178 * sy))
R.append(r"\draw[occ!85!black, thick] (%.2f,0) rectangle (%.2f,%.3f);" % (X2 - w / 2, X2 + w / 2, 4.178 * sy))
R.append(r"\draw[black!45, densely dashed] (%.2f,%.3f) rectangle (%.2f,%.3f);" % (X2 - w / 2, 4.178 * sy, X2 + w / 2, 14 * sy))
R.append(r"\node[font=\scriptsize, anchor=west, align=left] at (%.2f,%.3f) {$\EF=\SI{4,18}{eV}$\\$10^7$ livelli occupati\\spaziati di \SI{8,4e-7}{eV}};" % (X2 + w / 2 + 0.06, 8.6 * sy))
# collegamento E_1 atomo = E_F metallo
R.append(r"\draw[boxkey, densely dotted, thick] (%.2f,%.3f) -- (%.2f,%.3f);" % (X0 + w / 2 + 1.0, 4.178 * sy, X2 - w / 2, 4.178 * sy))
right = "\n".join(R)

tex = "\\begin{tikzpicture}[x=1cm,y=1cm]\n" + left + "\n" + right + "\n\\end{tikzpicture}\n"
open("figs/qf_scatola.tex", "w").write(tex)
print("figure scritte")
