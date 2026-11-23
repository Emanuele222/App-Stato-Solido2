/**
 * Formule KaTeX vive per la sezione «Bande dei materiali veri» (dispensa P4 §5).
 */
export const PSEUDO_EQ_FORMULA =
  String.raw`\begin{aligned}` +
  String.raw`\left[\frac{\hat p^2}{2m_0} + \htmlData{q=VG}{V_{\mathrm{ps}}}\right]\htmlData{q=psi}{\psi^{\mathrm f}_{\htmlData{q=k}{\mathbf{k}}}} &= \htmlData{q=E}{E}(\htmlData{q=k}{\mathbf{k}})\,\htmlData{q=psi}{\psi^{\mathrm f}_{\htmlData{q=k}{\mathbf{k}}}}, \\` +
  String.raw`\htmlData{q=VG}{V_{\mathrm{ps}}} = V + V', \qquad V' &= \sum_c (\htmlData{q=E}{E} - E_c)\,|\psi_c\rangle\langle\psi_c|` +
  String.raw`\end{aligned}`

export const CENTRAL_EPM_FORMULA =
  String.raw`\begin{aligned}` +
  String.raw`\bigl(E_{\htmlData{q=k}{\mathbf{k}}+\mathbf{G}} - \htmlData{q=E}{E}\bigr) c_{\mathbf{G}} + \sum_{\mathbf{G}'} \htmlData{q=VG}{V_{\mathbf{G}-\mathbf{G}'}}\, c_{\mathbf{G}'} &= 0, \\` +
  String.raw`\htmlData{q=VG}{V_{\mathbf{G}}} = \htmlData{q=VG}{V^s_{|\mathbf{G}|^2}}\cos(\mathbf{G}\cdot\boldsymbol\tau) + i\,\htmlData{q=V2G}{V^a_{|\mathbf{G}|^2}}\sin(\mathbf{G}\cdot\boldsymbol\tau)` +
  String.raw`\end{aligned}`

export const LIMIT_V0_FORMULA =
  String.raw`\htmlData{q=EF}{E_F} = \frac{\hbar^2 \htmlData{q=k}{k_F}^2}{2m_0}, \qquad \htmlData{q=k}{k_F} = (3\pi^2 n)^{1/3}, \qquad n = \frac{4 N_{\mathrm{el}}}{\htmlData{q=a}{a}^3}`
