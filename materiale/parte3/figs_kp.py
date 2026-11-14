"""Genera le figure del modello di Kronig-Penney (§10 della Parte 3):
   figs/kp_buca.tex  : buca finita, soluzione grafica e funzioni d'onda
   figs/kp_bande.tex : delta periodici, cos(ka) = f(alpha a) e bande E(k) in zona ridotta
   figs/kp_ev.tex    : barriere rettangolari, L(eps/V0) e bande al variare dello spessore della barriera
Unita': u = pi^2 hbar^2/(2 m a^2) per le energie dei delta; k in unita' pi/a."""
import numpy as np
from scipy.optimize import brentq

pi = np.pi


def coords(x, y, nd=4):
    return " ".join(f"({a:.{nd}f},{b:.{nd}f})" for a, b in zip(x, y))


# ------------------------------------------------------------------ figura 1: buca finita
b, V0, C = 10.0, 1.0, 3.81  # A, eV, hbar^2/2m0 in eV A^2
rho = (b / 2) * np.sqrt(V0 / C)
f_even = lambda x: np.sqrt(rho**2 - x**2) - x * np.tan(x)
f_odd = lambda x: np.sqrt(rho**2 - x**2) + x / np.tan(x)
xi_e = brentq(f_even, 0.5, pi / 2 - 1e-6)
xi_o = brentq(f_odd, pi / 2 + 1e-6, rho - 1e-9)
eta_e, eta_o = np.sqrt(rho**2 - xi_e**2), np.sqrt(rho**2 - xi_o**2)
eps_e, eps_o = V0 * (xi_e / rho) ** 2, V0 * (xi_o / rho) ** 2
print("buca: rho=%.4f xi_e=%.4f eta_e=%.4f xi_o=%.4f eta_o=%.4f eps=%.4f %.4f" % (rho, xi_e, eta_e, xi_o, eta_o, eps_e, eps_o))

ymax = 3.1
xs = np.linspace(0, rho, 200)
circ = coords(xs, np.sqrt(np.maximum(rho**2 - xs**2, 0)))
xe = np.linspace(0, pi / 2 - 1e-4, 4000)
ye = xe * np.tan(xe)
m = ye <= ymax
even = coords(xe[m], ye[m])
xo = np.linspace(pi / 2 + 1e-4, pi - 1e-4, 4000)
yo = -xo / np.tan(xo)
m = (yo <= ymax) & (yo >= 0)
odd = coords(xo[m], yo[m])

# funzioni d'onda (b = 1)
def psi(kind, xi, eta, x):
    al, be = 2 * xi, 2 * eta  # in unita' 1/b
    out = np.empty_like(x)
    inside = np.abs(x) <= 0.5
    if kind == "e":
        out[inside] = np.cos(al * x[inside])
        out[~inside] = np.cos(al * 0.5) * np.exp(-be * (np.abs(x[~inside]) - 0.5))
    else:
        out[inside] = np.sin(al * x[inside])
        out[~inside] = np.sign(x[~inside]) * np.sin(al * 0.5) * np.exp(-be * (np.abs(x[~inside]) - 0.5))
    return out

xx = np.linspace(-1.15, 1.15, 400)
A = 0.16
w1 = coords(xx, eps_e + A * psi("e", xi_e, eta_e, xx))
w2 = coords(xx, eps_o + A * psi("o", xi_o, eta_o, xx))

fig1 = r"""\begin{tikzpicture}
\begin{axis}[name=g, width=6.1cm, height=6.0cm, axis lines=left, xmin=0, xmax=3.3, ymin=0, ymax=3.2,
  xtick={0,1.5708,3.1416}, xticklabels={$0$,$\frac\pi2$,$\pi$}, ytick={1,2,3}, tick label style={font=\scriptsize},
  label style={font=\small}, xlabel={$\xi=\alpha b/2$}, ylabel={$\eta=\beta b/2$}, title={\small (a) soluzione grafica ($\rho=@RHO@$)}, clip=false]
\draw[black!30, densely dashed] (axis cs:1.5708,0) -- (axis cs:1.5708,3.2);
\addplot[black, thick] coordinates {@CIRC@};
\addplot[occ!85!black, very thick] coordinates {@EVEN@};
\addplot[hole!85!black, very thick] coordinates {@ODD@};
\fill[occ!85!black] (axis cs:@XE@,@YE@) circle (2pt);
\fill[hole!85!black] (axis cs:@XO@,@YO@) circle (2pt);
\node[font=\scriptsize, occ!85!black, anchor=south west, inner sep=2pt] at (axis cs:@XE@,@YE@) {$\eta=\xi\tan\xi$};
\node[font=\scriptsize, hole!85!black, anchor=west, inner sep=3pt] at (axis cs:@XO@,@YO@) {$\eta=-\xi\cot\xi$};
\node[font=\scriptsize, black!70, anchor=west] at (axis cs:0.05,0.35) {$\xi^2+\eta^2=\rho^2$};
\end{axis}
\begin{axis}[at={(g.east)}, anchor=west, xshift=1.7cm, width=6.4cm, height=6.0cm, axis lines=left, xmin=-1.15, xmax=1.15, ymin=-0.04, ymax=1.2,
  xtick={-0.5,0,0.5}, xticklabels={$-\frac b2$,$0$,$\frac b2$}, ytick={0,0.5,1}, tick label style={font=\scriptsize}, label style={font=\small},
  xlabel={$x$}, ylabel={$E$ (eV)}, title={\small (b) livelli e funzioni d'onda}, clip=false]
\draw[black, very thick] (axis cs:-1.15,1) -- (axis cs:-0.5,1) -- (axis cs:-0.5,0) -- (axis cs:0.5,0) -- (axis cs:0.5,1) -- (axis cs:1.15,1);
\draw[occ!85!black, densely dashed] (axis cs:-1.15,@EE@) -- (axis cs:1.15,@EE@);
\draw[hole!85!black, densely dashed] (axis cs:-1.15,@EO@) -- (axis cs:1.15,@EO@);
\addplot[occ!85!black, thick] coordinates {@W1@};
\addplot[hole!85!black, thick] coordinates {@W2@};
\node[font=\scriptsize, anchor=west] at (axis cs:0.6,1.09) {$V_0$};
\node[font=\scriptsize, occ!85!black, anchor=west] at (axis cs:1.17,@EE@) {$E_1$};
\node[font=\scriptsize, hole!85!black, anchor=west] at (axis cs:1.17,@EO@) {$E_2$};
\end{axis}
\end{tikzpicture}
"""
for k, v in {"@RHO@": f"{rho:.2f}".replace(".", "{,}"), "@CIRC@": circ, "@EVEN@": even, "@ODD@": odd,
             "@XE@": f"{xi_e:.4f}", "@YE@": f"{eta_e:.4f}", "@XO@": f"{xi_o:.4f}", "@YO@": f"{eta_o:.4f}",
             "@EE@": f"{eps_e:.4f}", "@EO@": f"{eps_o:.4f}", "@W1@": w1, "@W2@": w2}.items():
    fig1 = fig1.replace(k, v)
open("figs/kp_buca.tex", "w").write(fig1)

# ------------------------------------------------------------------ figura 2: delta periodici
P = 2.0
fd = lambda x: np.cos(x) + P * np.sin(x) / x
g = lambda t: abs(fd(t)) - 1


def bands_delta(P, xmax, N=400000):
    xs = np.linspace(1e-6, xmax, N)
    ok = np.abs(fd(xs)) <= 1
    ed, i = [], 0
    while i < N:
        if ok[i]:
            j = i
            while j < N and ok[j]:
                j += 1
            lo = brentq(g, xs[i - 1], xs[i]) if i > 0 else xs[i]
            hi = brentq(g, xs[j - 1], xs[j]) if j < N else xs[j - 1]
            ed.append((lo, hi))
            i = j
        else:
            i += 1
    return ed


ed = bands_delta(P, 4.4 * pi)
# (a) f(alpha a)
xa = np.linspace(0.02, 16.0, 1600)
curve_f = coords(xa, np.clip(fd(xa), -2.6, 3.2), 3)
gaps = [(0, ed[0][0])] + [(ed[n][1], ed[n + 1][0]) for n in range(4)]
gap_rects = "\n".join(
    f"\\fill[black!14] (axis cs:{lo:.4f},-2.6) rectangle (axis cs:{hi:.4f},3.2);" for lo, hi in gaps
)
band_labels = "\n".join(
    f"\\node[font=\\scriptsize, occ!85!black] at (axis cs:{(lo+hi)/2:.3f},-2.2) {{$E_{n+1}$}};" for n, (lo, hi) in enumerate(ed[:5])
)

# (b) E(K) in zona ridotta, unita' pi/a e u
band_curves = []
colors = ["occ", "hole", "exc", "boxdeep"]
for n, (lo, hi) in enumerate(ed[:4]):
    xs_ = np.linspace(lo, hi, 400)
    Kr = np.arccos(np.clip(fd(xs_), -1, 1)) / pi
    E = (xs_ / pi) ** 2
    o = np.argsort(Kr)          # ramo destro ordinato per K crescente; il sinistro e' il suo specchio
    Kfull = np.concatenate([-Kr[o][::-1], Kr[o]])
    Efull = np.concatenate([E[o][::-1], E[o]])
    band_curves.append(f"\\addplot[{colors[n]}!85!black, very thick] coordinates {{{coords(Kfull, Efull)}}};")
free_curves = []
for G in (-6, -4, -2, 0, 2, 4, 6):
    kk = np.linspace(-1, 1, 101)
    free_curves.append(f"\\addplot[black!40, thin, densely dashed] coordinates {{{coords(kk, (kk+G)**2, 3)}}};")

fig2 = r"""\begin{tikzpicture}
\begin{axis}[name=f, width=7.6cm, height=5.6cm, axis lines=left, xmin=0, xmax=16, ymin=-2.6, ymax=3.2,
  xtick={0,3.1416,6.2832,9.4248,12.5664,15.708}, xticklabels={$0$,$\pi$,$2\pi$,$3\pi$,$4\pi$,$5\pi$}, ytick={-1,1}, tick label style={font=\scriptsize},
  label style={font=\small}, xlabel={$\alpha a$}, ylabel={$f(\alpha a)$}, title={\small (a) $P=2$: $\cos ka=f(\alpha a)$}, clip=true]
@GAPS@
\draw[black!55, thin] (axis cs:0,1) -- (axis cs:16,1);
\draw[black!55, thin] (axis cs:0,-1) -- (axis cs:16,-1);
\addplot[black, thick] coordinates {@F@};
@LABELS@
\end{axis}
\begin{axis}[at={(f.east)}, anchor=west, xshift=1.4cm, width=5.6cm, height=5.6cm, axis lines=left, xmin=-1.15, xmax=1.15, ymin=0, ymax=17.5,
  xtick={-1,0,1}, xticklabels={$-\frac\pi a$,$0$,$\frac\pi a$}, ytick={1,4,9,16}, tick label style={font=\scriptsize}, label style={font=\small},
  xlabel={$k$}, ylabel={$E$}, title={\small (b) bande in zona ridotta}, clip=true]
\draw[black!35, densely dashed] (axis cs:-1,0) -- (axis cs:-1,17.5);
\draw[black!35, densely dashed] (axis cs:1,0) -- (axis cs:1,17.5);
@FREE@
@BANDS@
\end{axis}
\end{tikzpicture}
"""
for k, v in {"@GAPS@": gap_rects, "@F@": curve_f, "@LABELS@": band_labels, "@FREE@": "\n".join(free_curves),
             "@BANDS@": "\n".join(band_curves)}.items():
    fig2 = fig2.replace(k, v)
open("figs/kp_bande.tex", "w").write(fig2)
print("delta P=2: bordi (alpha a/pi):", [(round(l / pi, 3), round(h / pi, 3)) for l, h in ed[:5]])

# ------------------------------------------------------------------ figura 3: barriere rettangolari
def L_ab(t, gb, gc):
    al, be = np.sqrt(t), np.sqrt(1 - t)
    return np.cos(al * gb) * np.cosh(be * gc) + (be**2 - al**2) / (2 * al * be) * np.sin(al * gb) * np.sinh(be * gc)


def rect_bands(gb, gc, tmax=0.999, N=200000):
    ts = np.linspace(1e-6, tmax, N)
    ok = np.abs(L_ab(ts, gb, gc)) <= 1
    idx = np.where(np.diff(ok.astype(int)) != 0)[0]
    ed = [brentq(lambda t: abs(L_ab(t, gb, gc)) - 1, ts[i], ts[i + 1]) for i in idx]
    if ok[0]:
        ed = [0.0] + ed
    if ok[-1]:
        ed = ed + [tmax]
    return [(ed[2 * j], ed[2 * j + 1]) for j in range(len(ed) // 2)]


gb, gc = 10.4, 2.08
rw = gb / 2
levels = []
for f in (lambda x: np.sqrt(rw**2 - x**2) - x * np.tan(x), lambda x: np.sqrt(rw**2 - x**2) + x / np.tan(x)):
    xs = np.linspace(1e-4, rw - 1e-9, 20000)
    v = np.array([f(x) for x in xs])
    for i in range(len(xs) - 1):
        if v[i] * v[i + 1] < 0 and abs(v[i]) < 20 and abs(v[i + 1]) < 20:
            levels.append((brentq(f, xs[i], xs[i + 1]) / rw) ** 2)
levels.sort()
print("buca isolata: livelli eps/V0 =", np.round(levels, 4), " N =", len(levels))
bd = rect_bands(gb, gc)
print("bande (eps/V0):", [(round(l, 4), round(h, 4)) for l, h in bd])

tt = np.linspace(0.002, 0.998, 3000)
Lv = L_ab(tt, gb, gc)
curve_L = coords(tt, np.clip(Lv, -3.2, 3.2), 4)
gap_edges = [(0, bd[0][0])] + [(bd[n][1], bd[n + 1][0]) for n in range(len(bd) - 1)]
gap_rects_L = "\n".join(f"\\fill[black!14] (axis cs:{lo:.4f},-3.2) rectangle (axis cs:{hi:.4f},3.2);" for lo, hi in gap_edges if hi > lo)
level_marks = "\n".join(f"\\fill[hole!85!black] (axis cs:{l:.4f},-3.2) circle (2.2pt);" for l in levels)

# evoluzione con c/b
cs_ = np.linspace(0.03, 1.5, 120)
dc = cs_[1] - cs_[0]
rects = []
for r in cs_:
    for lo, hi in rect_bands(gb, gb * r):
        rects.append(f"\\fill[occ!45] (axis cs:{r-dc/2:.4f},{lo:.4f}) rectangle (axis cs:{r+dc/2:.4f},{hi:.4f});")
level_lines = "\n".join(
    f"\\draw[hole!85!black, densely dashed] (axis cs:0,{l:.4f}) -- (axis cs:1.5,{l:.4f}); "
    f"\\node[font=\\scriptsize, hole!85!black, anchor=west] at (axis cs:1.52,{l:.4f}) {{{n+1}}};" for n, l in enumerate(levels)
)

fig3 = r"""\begin{tikzpicture}
\begin{axis}[name=L, width=7.0cm, height=5.8cm, axis lines=left, xmin=0, xmax=1, ymin=-3.2, ymax=3.2,
  xtick={0,0.25,0.5,0.75,1}, ytick={-1,1}, tick label style={font=\scriptsize}, label style={font=\small},
  xlabel={$E/V_0$}, ylabel={$L$}, title={\small (a) $L(E/V_0)$, $c/b=0{,}2$}, clip=true]
@GAPL@
\draw[black!55, thin] (axis cs:0,1) -- (axis cs:1,1);
\draw[black!55, thin] (axis cs:0,-1) -- (axis cs:1,-1);
\addplot[black, thick] coordinates {@CURVEL@};
@LEVELS@
\end{axis}
\begin{axis}[at={(L.east)}, anchor=west, xshift=1.5cm, width=5.8cm, height=5.8cm, axis lines=left, xmin=0, xmax=1.5, ymin=0, ymax=1,
  xtick={0,0.5,1,1.5}, ytick={0,0.5,1}, tick label style={font=\scriptsize}, label style={font=\small},
  xlabel={$c/b$}, ylabel={$E/V_0$}, title={\small (b) bande al variare di $c$}, clip=false]
@RECTS@
@LEVELLINES@
\end{axis}
\end{tikzpicture}
"""
for k, v in {"@GAPL@": gap_rects_L, "@CURVEL@": curve_L, "@LEVELS@": level_marks, "@RECTS@": "\n".join(rects),
             "@LEVELLINES@": level_lines}.items():
    fig3 = fig3.replace(k, v)
open("figs/kp_ev.tex", "w").write(fig3)
print("ok")
