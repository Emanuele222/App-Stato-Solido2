"""Figure del §5 (Lezione 6a): scrive figs/schemi.tex, figs/al_libero.tex, figs/epm.tex,
figs/dos_metsc.tex, figs/riempimento1d.tex.  Richiede epm_bande.npz (da verifica_bande_reali.py)."""
import numpy as np

H2M = 3.80998


def coords(x, y):
    return " ".join(f"({a:.4f},{b:.4f})" for a, b in zip(x, y))


# ---------------------------------------------------------------- 1. schemi di zona (1D quasi liberi)
def bande_1d(x, V1=0.45, V2=0.3, nG=7):
    """x = ka/pi; energie in unità E0 = hbar^2 pi^2 / 2 m a^2; V_G in unità E0"""
    Gs = np.arange(-nG, nG + 1) * 2.0          # G in unità pi/a
    out = []
    for xx in x:
        H = np.diag((xx + Gs) ** 2)
        for i in range(len(Gs)):
            for j in range(len(Gs)):
                d = abs(i - j)
                if d == 1:
                    H[i, j] = V1
                elif d == 2:
                    H[i, j] = V2
        out.append(np.linalg.eigvalsh(H)[:3])
    return np.array(out)

xr = np.linspace(-1, 1, 201)
Er = bande_1d(xr)
off = Er[:, 0].min()
Er -= off
# schema esteso: banda n nella zona n
ext = []
for n in range(3):
    seg = []
    for s in (-1, 1):
        lo, hi = n, n + 1
        xx = np.linspace(lo, hi, 81) * s
        # punto ridotto (E è pari in k: il segno al bordo non conta)
        xred = xx - 2 * np.round(xx / 2)
        E = bande_1d(xred)[:, n] - off
        seg.append((xx, E))
    ext.append(seg)
col = ["vA", "vB", "vC"]
L = []
L.append("% Tre modi di disegnare le bande (slide 3): elettroni quasi liberi in 1D, V_G = 0.45 E0, V_2G = 0.3 E0")
L.append("% generata da figs_bande_reali.py; x = ka/pi, energie in unità E0 = hbar^2 pi^2/2 m0 a^2")
L.append(r"\begin{tikzpicture}")
L.append(r"\pgfplotsset{sch/.style={height=5.6cm, ymin=0, ymax=10.2, ytick=\empty, axis lines=left, clip=false,"
         r" enlargelimits=false, xlabel={$k$}, every axis x label/.style={at={(axis description cs:1,0)}, anchor=west, xshift=1pt},"
         r" ylabel={$E$}, every axis y label/.style={at={(ticklabel* cs:1.0)}, anchor=south}, tick label style={font=\scriptsize}}}")
# (a) esteso
L.append(r"\begin{axis}[sch, name=pa, width=6.3cm, xmin=-3, xmax=3, xtick={-3,-2,-1,0,1,2,3},"
         r" xticklabels={$-\frac{3\pi}a$,,$-\frac\pi a$,$0$,$\frac\pi a$,,$\frac{3\pi}a$}]")
for x0 in ():
    L.append(rf"\fill[black!5] (axis cs:{x0 if x0>0 else -1},0) rectangle (axis cs:{0},10.2);")
L.append(r"\fill[black!5] (axis cs:-1,0) rectangle (axis cs:1,10.2);")
for xv in (-2, -1, 1, 2):
    L.append(rf"\draw[black!25, densely dotted] (axis cs:{xv},0) -- (axis cs:{xv},10.2);")
for n in range(3):
    for xx, E in ext[n]:
        L.append(rf"\addplot[very thick, color={col[n]}] coordinates {{{coords(xx, E)}}};")
L.append(r"\node[font=\small, anchor=south] at (axis description cs:0.5,1.02) {(a) zona estesa};")
L.append(r"\end{axis}")
# (b) ridotto
L.append(r"\begin{axis}[sch, ylabel={}, name=pb, at={(pa.east)}, anchor=west, xshift=0.9cm, width=3.2cm, xmin=-1, xmax=1,"
         r" xtick={-1,0,1}, xticklabels={$-\frac\pi a$,$0$,$\frac\pi a$}]")
L.append(r"\fill[black!5] (axis cs:-1,0) rectangle (axis cs:1,10.2);")
for n in range(3):
    L.append(rf"\addplot[very thick, color={col[n]}] coordinates {{{coords(xr, Er[:, n])}}};")
L.append(r"\node[font=\small, anchor=south] at (axis description cs:0.5,1.02) {(b) ridotta};")
L.append(r"\end{axis}")
# (c) periodico
L.append(r"\begin{axis}[sch, ylabel={}, name=pc, at={(pb.east)}, anchor=west, xshift=0.9cm, width=6.3cm, xmin=-3, xmax=3,"
         r" xtick={-3,-2,-1,0,1,2,3}, xticklabels={$-\frac{3\pi}a$,,$-\frac\pi a$,$0$,$\frac\pi a$,,$\frac{3\pi}a$}]")
L.append(r"\fill[black!5] (axis cs:-1,0) rectangle (axis cs:1,10.2);")
for sh in (-2, 0, 2):
    msk = (xr + sh >= -3) & (xr + sh <= 3)
    for n in range(3):
        L.append(rf"\addplot[very thick, color={col[n]}] coordinates {{{coords(xr[msk] + sh, Er[msk, n])}}};")
# gap 2|V_G| in pi/a e 2|V_2G| in 0
i1 = np.argmin(abs(xr - 1))
i0 = np.argmin(abs(xr - 0))
g1lo, g1hi = Er[i1, 0], Er[i1, 1]
g2lo, g2hi = Er[i0, 1], Er[i0, 2]
L.append(rf"\draw[<->, black!75] (axis cs:1,{g1lo:.3f}) -- (axis cs:1,{g1hi:.3f});")
L.append(rf"\node[font=\scriptsize, anchor=west, fill=white, inner sep=1pt] at (axis cs:1.08,{(g1lo+g1hi)/2:.3f}) {{$2|V_{{G}}|$}};")
L.append(rf"\draw[<->, black!75] (axis cs:2,{g2lo:.3f}) -- (axis cs:2,{g2hi:.3f});")
L.append(rf"\node[font=\scriptsize, anchor=west, fill=white, inner sep=1pt] at (axis cs:2.08,{(g2lo+g2hi)/2:.3f}) {{$2|V_{{2G}}|$}};")
L.append(r"\node[font=\small, anchor=south] at (axis description cs:0.5,1.02) {(c) zona periodica};")
L.append(r"\node[font=\scriptsize, color=vA, anchor=west] at (axis cs:3.05,0.5) {1};")
L.append(rf"\node[font=\scriptsize, color=vB, anchor=west] at (axis cs:3.05,{Er[-1,1]:.2f}) {{2}};")
L.append(rf"\node[font=\scriptsize, color=vC, anchor=west] at (axis cs:3.05,{Er[-1,2]:.2f}) {{3}};")
L.append(r"\end{axis}")
L.append(r"\end{tikzpicture}")
open("figs/schemi.tex", "w").write("\n".join(L) + "\n")
print("gap 1:", g1hi - g1lo, " gap 2:", g2hi - g2lo)

# ---------------------------------------------------------------- 2. Al nel reticolo vuoto
a = 4.05
EF = 11.65
EF1 = 5.60 - EF
nodi = [("\\Gamma", (0, 0, 0)), ("X", (1, 0, 0)), ("W", (1, 0.5, 0)), ("K", (0.75, 0.75, 0)),
        ("L", (0.5, 0.5, 0.5)), ("\\Gamma", (0, 0, 0))]
G = []
for h in range(-3, 4):
    for k in range(-3, 4):
        for l in range(-3, 4):
            if h % 2 == k % 2 == l % 2 and h*h + k*k + l*l <= 12:
                G.append((h, k, l))
G = np.array(G, float)
pts, xs, ticks = [], [], [0.0]
s = 0.0
for i in range(len(nodi) - 1):
    p0, p1 = np.array(nodi[i][1], float), np.array(nodi[i + 1][1], float)
    Lseg = np.linalg.norm(p1 - p0)
    nn = max(int(Lseg * 80), 20)
    for j in range(nn + (1 if i == len(nodi) - 2 else 0)):
        t = j / nn
        pts.append(p0 + t * (p1 - p0))
        xs.append(s + t * Lseg)
    s += Lseg
    ticks.append(s)
pts, xs = np.array(pts), np.array(xs)
E = H2M * (2 * np.pi / a) ** 2 * ((pts[:, None, :] + G[None, :, :]) ** 2).sum(-1) - EF
L = []
L.append("% Bande dell'alluminio nel modello a elettroni liberi (reticolo vuoto fcc, a = 4.05 Å), zona ridotta")
L.append("% generata da figs_bande_reali.py; zero in EF = 11.65 eV sopra il fondo; EF' (1 elettrone) = -6.05 eV")
L.append(r"\begin{tikzpicture}")
L.append(rf"\begin{{axis}}[width=10.5cm, height=6.6cm, xmin=0, xmax={xs[-1]:.4f}, ymin=-12.5, ymax=3, axis lines=left, clip=true,"
         r" enlargelimits=false, xtick={" + ",".join(f"{t:.4f}" for t in ticks) + r"}, xticklabels={"
         + ",".join(f"${n}$" for n, _ in nodi) + r"}, ytick={-12,-10,-8,-6,-4,-2,0,2},"
         r" ylabel={$E-\EF$ (eV)}, tick label style={font=\scriptsize}, label style={font=\small},"
         r" xmajorgrids, major grid style={black!30}]")
L.append(r"\draw[black!70] (axis cs:0,0) -- (axis cs:" + f"{xs[-1]:.4f}" + r",0);")
L.append(rf"\draw[densely dashed, black!60] (axis cs:0,{EF1:.3f}) -- (axis cs:{xs[-1]:.4f},{EF1:.3f});")
done = set()
for j in range(len(G)):
    y = E[:, j]
    if y.min() > 3.2:
        continue
    key = tuple(np.round(y[::7], 3))
    if key in done:
        continue
    done.add(key)
    yy = np.clip(y, -13, 3.6)
    L.append(r"\addplot[thick, color=vB] coordinates {" + coords(xs, yy) + "};")
L.append(rf"\node[font=\scriptsize, anchor=south east, fill=white, inner sep=1pt] at (axis cs:{xs[-1]-0.02:.4f},0.05) {{$\EF$ (3 elettroni per cella)}};")
L.append(rf"\node[font=\scriptsize, anchor=south east, fill=white, inner sep=1pt, text=black!75] at (axis cs:{xs[-1]-0.02:.4f},{EF1+0.05:.3f}) {{$\EF'$ (1 elettrone per cella)}};")
L.append(r"\end{axis}")
L.append(r"\end{tikzpicture}")
open("figs/al_libero.tex", "w").write("\n".join(L) + "\n")
print("Al: curve distinte disegnate:", len(done), " ticks:", np.round(ticks, 3))

# ---------------------------------------------------------------- 3. Si e GaAs con lo pseudopotenziale empirico
d = np.load("epm_bande.npz")
x, tk = d["x"], d["ticks"]
lab = ["L", "\\Gamma", "X", "W", "K", "\\Gamma"]
L = []
L.append("% Bande di Si e GaAs con lo pseudopotenziale empirico locale (Cohen-Bergstresser, §4.4), senza spin-orbita")
L.append("% generata da figs_bande_reali.py da epm_bande.npz; zero alla cima della valenza")
L.append(r"\begin{tikzpicture}")
L.append(r"\pgfplotsset{epm/.style={width=7.6cm, height=7.2cm, xmin=0, xmax=" + f"{x[-1]:.4f}" + r", ymin=-13.5, ymax=6.5,"
         r" axis lines=left, clip=true, enlargelimits=false, xtick={" + ",".join(f"{t:.4f}" for t in tk) + r"},"
         r" xticklabels={" + ",".join(f"${n}$" for n in lab) + r"}, ytick={-12,-10,-8,-6,-4,-2,0,2,4,6},"
         r" tick label style={font=\scriptsize}, label style={font=\small}, xmajorgrids, major grid style={black!30}}}")
for i, nome in enumerate(("Si", "GaAs")):
    Eb = d[nome]
    vmax, cmin = Eb[:, 3].max(), Eb[:, 4].min()
    opt = ("epm, name=p0, ylabel={$E$ (eV)}" if i == 0 else "epm, at={(p0.east)}, anchor=west, xshift=1.2cm") + ", title={" + nome + "}, title style={font=\\small\\bfseries, yshift=-4pt}"
    L.append(rf"\begin{{axis}}[{opt}]")
    L.append(rf"\fill[vA!16] (axis cs:0,{vmax:.3f}) rectangle (axis cs:{x[-1]:.4f},{cmin:.3f});")
    L.append(rf"\draw[densely dashed, vA] (axis cs:0,{(vmax+cmin)/2:.3f}) -- (axis cs:{x[-1]:.4f},{(vmax+cmin)/2:.3f});")
    for nb in range(8):
        c = "vB" if nb < 4 else "black!80"
        L.append(rf"\addplot[thick, color={c}] coordinates {{{coords(x, Eb[:, nb])}}};")
    
    L.append(rf"\node[font=\scriptsize, color=vA, fill=vA!16, inner sep=1pt, anchor=west] at (axis cs:{tk[3]+0.03:.3f},{(vmax+cmin)/2:.3f}) {{$\mu$}};")
    L.append(r"\end{axis}")
L.append(r"\end{tikzpicture}")
open("figs/epm.tex", "w").write("\n".join(L) + "\n")

# ---------------------------------------------------------------- 4. densità degli stati: metallo e semiconduttore
E1p, E1t, E2b, E2p = 2.4, 2.95, 3.75, 4.45
def g(E):
    E = np.asarray(E, float)
    out = np.zeros_like(E)
    m1 = (E >= 0) & (E < E1p)
    out[m1] = np.sqrt(E[m1])
    m2 = (E >= E1p) & (E <= E1t)
    out[m2] = np.sqrt(E1p) * np.sqrt((E1t - E[m2]) / (E1t - E1p)) * (1 + 0.15 * np.sin(np.pi * (E[m2] - E1p) / (E1t - E1p)))
    m3 = (E >= E2b) & (E < E2p)
    out[m3] = 1.55 * np.sqrt((E[m3] - E2b) / (E2p - E2b))
    m4 = E >= E2p
    out[m4] = 1.55 * np.sqrt(np.clip(1 - (E[m4] - E2p) / 0.9, 0, None))
    return out
Ex = np.concatenate([np.linspace(0, E1p, 120), np.linspace(E1p, E1t, 60), np.linspace(E2b, E2p, 80), np.linspace(E2p, 5.0, 40)])
L = []
L.append("% Densità degli stati (schematica) e stati occupati: metallo e semiconduttore (slide 13-14)")
L.append("% generata da figs_bande_reali.py; unità arbitrarie, T = 0")
L.append(r"\begin{tikzpicture}")
L.append(r"\pgfplotsset{dosf/.style={width=6.4cm, height=4.6cm, xmin=0, xmax=5.1, ymin=0, ymax=2.0, axis lines=left, clip=false,"
         r" enlargelimits=false, xtick=\empty, ytick=\empty, xlabel={$E$}, ylabel={$g(E)$},"
         r" every axis x label/.style={at={(axis description cs:1,0)}, anchor=west},"
         r" every axis y label/.style={at={(ticklabel* cs:1.0)}, anchor=south}, label style={font=\small}}}")
for i, (mu, tit) in enumerate(((1.7, "(a) metallo"), (3.35, "(b) semiconduttore o isolante"))):
    opt = "dosf, name=q0" if i == 0 else "dosf, ylabel={}, at={(q0.east)}, anchor=west, xshift=1.4cm"
    L.append(rf"\begin{{axis}}[{opt}]")
    Eocc = Ex[Ex <= min(mu, E1t)]
    L.append(r"\fill[occ!55] (axis cs:0,0) -- plot coordinates {" + coords(Eocc, g(Eocc)) + rf"}} -- (axis cs:{Eocc[-1]:.4f},0) -- cycle;")
    for seg in (Ex[Ex <= E1t], Ex[Ex >= E2b]):
        L.append(r"\addplot[thick, black] coordinates {" + coords(seg, g(seg)) + "};")
    if i == 0:
        ee = np.linspace(0, 4.0, 60)
        L.append(r"\addplot[densely dotted, black!55] coordinates {" + coords(ee, np.sqrt(ee)) + "};")
        L.append(r"\node[font=\scriptsize, black!60, anchor=west] at (axis cs:3.55,1.98) {$\propto\sqrt E$};")
    L.append(rf"\draw[densely dashed, vA] (axis cs:{mu},0) -- (axis cs:{mu},1.85);")
    lab = r"$\mu=\EF$" if i == 0 else r"$\mu$"
    L.append(rf"\node[font=\scriptsize, color=vA, anchor=north] at (axis cs:{mu},0) {{{lab}}};")
    if i == 1:
        L.append(rf"\draw[<->, black!70] (axis cs:{E1t},1.2) -- (axis cs:{E2b},1.2) node[midway, above=1pt, font=\scriptsize, fill=white, inner sep=1pt] {{$\Eg$}};")
    L.append(rf"\node[font=\small, anchor=south] at (axis description cs:0.5,1.04) {{{tit}}};")
    L.append(r"\end{axis}")
L.append(r"\end{tikzpicture}")
open("figs/dos_metsc.tex", "w").write("\n".join(L) + "\n")

# ---------------------------------------------------------------- 5. riempimento in 1D (slide 19)
N = 18
n = np.arange(-8, 10)
k = 2 * n / N                   # in unità pi/a
Ek = 1 - np.cos(np.pi * k)      # unità 2t
kk = np.linspace(-1, 1, 161)
L = []
L.append("% Riempimento di una banda in 1D con N = 18 celle (slide 19): (a) 2 elettroni per cella, (b) 1 elettrone per cella")
L.append("% generata da figs_bande_reali.py; banda E = 2t(1 - cos ka), punti k = 2 pi n / N a")
L.append(r"\begin{tikzpicture}")
L.append(r"\pgfplotsset{r1d/.style={width=6.4cm, height=4.6cm, xmin=-1.08, xmax=1.08, ymin=-0.15, ymax=2.75, axis lines=left,"
         r" clip=false, enlargelimits=false, xtick={-1,0,1}, xticklabels={$-\frac\pi a$,$0$,$\frac\pi a$}, ytick=\empty,"
         r" xlabel={$k$}, ylabel={$E$}, every axis x label/.style={at={(axis description cs:1,0)}, anchor=west},"
         r" every axis y label/.style={at={(ticklabel* cs:1.0)}, anchor=south}, label style={font=\small}, tick label style={font=\scriptsize}}}")
for i, (kf, tit, EFv) in enumerate(((1.01, "(a) 2 elettroni per cella", 2.45), (0.5, "(b) 1 elettrone per cella", 1.0))):
    opt = "r1d, name=s0" if i == 0 else "r1d, at={(s0.east)}, anchor=west, xshift=1.4cm"
    L.append(rf"\begin{{axis}}[{opt}]")
    L.append(r"\addplot[black!45, thin] coordinates {" + coords(kk, 1 - np.cos(np.pi * kk)) + "};")
    L.append(rf"\draw[densely dashed, vA] (axis cs:-1.08,{EFv}) -- (axis cs:1.08,{EFv});")
    L.append(rf"\node[font=\scriptsize, color=vA, anchor=west] at (axis cs:1.08,{EFv}) {{$\EF$}};")
    for kv, ev in zip(k, Ek):
        if abs(kv) <= kf + 1e-9:
            L.append(rf"\fill[occ] (axis cs:{kv:.4f},{ev:.4f}) circle (1.9pt);")
        else:
            L.append(rf"\draw[occ, fill=white] (axis cs:{kv:.4f},{ev:.4f}) circle (1.9pt);")
    if i == 1:
        L.append(r"\draw[black!50] (axis cs:-0.5,-0.15) -- (axis cs:-0.5,0.0) node[below=3pt, font=\scriptsize, black] {$-\kF$};")
        L.append(r"\draw[black!50] (axis cs:0.5,-0.15) -- (axis cs:0.5,0.0) node[below=3pt, font=\scriptsize, black] {$\kF$};")
    L.append(rf"\node[font=\small, anchor=south] at (axis description cs:0.5,1.04) {{{tit}}};")
    L.append(r"\end{axis}")
L.append(r"\end{tikzpicture}")
open("figs/riempimento1d.tex", "w").write("\n".join(L) + "\n")
print("figure scritte")
