/**
 * Formule KaTeX vive per la sezione «Pseudopotenziale» (dispensa P4 §4).
 * Spezzate su più righe così entrano nella colonna destra senza tagli orizzontali.
 */
export const OPW_EXPANSION_FORMULA = [
  String.raw`\begin{array}{l}`,
  String.raw`\htmlData{q=psi}{\psi_{\htmlData{q=k}{\mathbf{k}}}} = \htmlData{q=psi}{\psi^{\mathrm f}_{\htmlData{q=k}{\mathbf{k}}}} + \htmlData{q=psi}{\beta_c}\,\psi_{c\htmlData{q=k}{\mathbf{k}}}, \\[4pt]`,
  String.raw`\htmlData{q=psi}{\beta_c} = -\langle \psi_{c\htmlData{q=k}{\mathbf{k}}} \mid \htmlData{q=psi}{\psi^{\mathrm f}_{\htmlData{q=k}{\mathbf{k}}}} \rangle`,
  String.raw`\end{array}`
].join('\n')

export const PSEUDO_SCHRODINGER_FORMULA = [
  String.raw`\begin{array}{l}`,
  String.raw`\Bigl[\dfrac{\hat p^2}{2m_0} + \htmlData{q=VG}{V_{\mathrm{ps}}}\Bigr]\htmlData{q=psi}{\psi^{\mathrm f}_{\htmlData{q=k}{\mathbf{k}}}} = \htmlData{q=E}{E}(\htmlData{q=k}{\mathbf{k}})\,\htmlData{q=psi}{\psi^{\mathrm f}_{\htmlData{q=k}{\mathbf{k}}}}, \\[6pt]`,
  String.raw`\htmlData{q=VG}{V_{\mathrm{ps}}} = \htmlData{q=VG}{V} + V', \\[4pt]`,
  String.raw`V' = \sum_c (\htmlData{q=E}{E} - E_c)\,|\psi_{c\htmlData{q=k}{\mathbf{k}}}\rangle\langle\psi_{c\htmlData{q=k}{\mathbf{k}}}|`,
  String.raw`\end{array}`
].join('\n')

export const NON_UNIQUENESS_FORMULA = [
  String.raw`\begin{array}{l}`,
  String.raw`\htmlData{q=V2G}{\tilde V_{\mathrm{ps}}} = \htmlData{q=VG}{V} + \sum_c \htmlData{q=V2G}{f}\,|\psi_{c\htmlData{q=k}{\mathbf{k}}}\rangle\langle\psi_{c\htmlData{q=k}{\mathbf{k}}}|, \\[4pt]`,
  String.raw`\htmlData{q=psi}{\psi_{\htmlData{q=k}{\mathbf{k}}}} = (1 - \hat\Pi_c)\bigl(\htmlData{q=psi}{\psi^{\mathrm f}_{\htmlData{q=k}{\mathbf{k}}}} + \htmlData{q=psi}{\alpha}\,\psi_{c\htmlData{q=k}{\mathbf{k}}}\bigr)`,
  String.raw`\end{array}`
].join('\n')
