/**
 * Formule KaTeX vive per la sezione «Pseudopotenziale» (dispensa P4 §4).
 */
export const OPW_EXPANSION_FORMULA =
  String.raw`\htmlData{q=psi}{\psi_{\htmlData{q=k}{\mathbf{k}}}} = \htmlData{q=psi}{\psi^{\mathrm f}_{\htmlData{q=k}{\mathbf{k}}}} + \sum_c \beta_c\,\psi_{c\htmlData{q=k}{\mathbf{k}}}, \qquad \beta_c = -\langle \psi_{c\htmlData{q=k}{\mathbf{k}}} | \htmlData{q=psi}{\psi^{\mathrm f}_{\htmlData{q=k}{\mathbf{k}}}} \rangle`

export const PSEUDO_SCHRODINGER_FORMULA =
  String.raw`\begin{aligned}` +
  String.raw`\left[\frac{\hat p^2}{2m_0} + \htmlData{q=VG}{V_{\mathrm{ps}}}\right]\htmlData{q=psi}{\psi^{\mathrm f}_{\htmlData{q=k}{\mathbf{k}}}} &= \htmlData{q=E}{E}(\htmlData{q=k}{\mathbf{k}})\,\htmlData{q=psi}{\psi^{\mathrm f}_{\htmlData{q=k}{\mathbf{k}}}}, \\` +
  String.raw`\htmlData{q=VG}{V_{\mathrm{ps}}} &= V + \sum_c (\htmlData{q=E}{E} - E_c)\,|\psi_{c\htmlData{q=k}{\mathbf{k}}}\rangle\langle\psi_{c\htmlData{q=k}{\mathbf{k}}}|` +
  String.raw`\end{aligned}`

export const NON_UNIQUENESS_FORMULA =
  String.raw`\htmlData{q=V2G}{\tilde V_{\mathrm{ps}}} = V + \sum_c \htmlData{q=V2G}{f}(E, E_c)\,|\psi_{c\htmlData{q=k}{\mathbf{k}}}\rangle\langle\psi_{c\htmlData{q=k}{\mathbf{k}}}|, \qquad \psi_{\htmlData{q=k}{\mathbf{k}}} = (1 - \hat\Pi_c)\bigl(\htmlData{q=psi}{\psi^{\mathrm f}_{\htmlData{q=k}{\mathbf{k}}}} + \htmlData{q=psi}{\alpha}\,\psi_{c\htmlData{q=k}{\mathbf{k}}}\bigr)`
