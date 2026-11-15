/**
 * Formule KaTeX vive per la sezione «Pseudopotenziale» (dispensa P4 §4).
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
  String.raw`v(q) = \frac{v_{\mathrm{ion}}(q)}{\varepsilon(q)}, \qquad v(0) = -\frac{2}{3}\htmlData{q=EF}{E_F}`
