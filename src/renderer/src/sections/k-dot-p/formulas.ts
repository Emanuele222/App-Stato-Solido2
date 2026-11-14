/**
 * Formule KaTeX vive per la sezione «Metodo k·p» (dispensa P4 §3 e formulario).
 */
export const GENERAL_KP_FORMULA =
  String.raw`\begin{aligned}` +
  String.raw`\htmlData{q=E}{E_n}(\htmlData{q=k}{k}) &\simeq \htmlData{q=E}{E_n}(0) + \frac{\hbar^2 \htmlData{q=k}{k}^2}{2\,\htmlData{q=mstar}{m^*}}, \\` +
  String.raw`\frac{1}{\htmlData{q=mstar}{m^*}} &= \frac{1}{\htmlData{q=Ek}{m_0}} + \frac{2}{m_0^2 \htmlData{q=k}{k}^2} \sum_{n' \neq n} \frac{|\langle u_{n0} | \htmlData{q=k}{\mathbf{k}}\cdot\hat{\mathbf{p}} | u_{n'0} \rangle|^2}{\htmlData{q=E}{E_n}(0) - \htmlData{q=E}{E_{n'}}(0)}` +
  String.raw`\end{aligned}`

export const KANE_BANDS_FORMULA =
  String.raw`\begin{aligned}` +
  String.raw`\htmlData{q=E}{E_c} &= \htmlData{q=VG}{E_g} + \frac{\hbar^2 \htmlData{q=k}{k}^2}{2\htmlData{q=Ek}{m_0}} \\` +
  String.raw`&\quad + \frac{\htmlData{q=v}{P}^2 \htmlData{q=k}{k}^2}{3}\!\left(\frac{2}{\htmlData{q=VG}{E_g}} + \frac{1}{\htmlData{q=VG}{E_g}+\htmlData{q=psi}{\Delta}}\right), \\` +
  String.raw`\htmlData{q=E}{E_{hh}} &= -\frac{\hbar^2 \htmlData{q=k}{k}^2}{2\htmlData{q=Ek}{m_0}}, \quad \htmlData{q=E}{E_{lh}} = -\frac{\hbar^2 \htmlData{q=k}{k}^2}{2\htmlData{q=Ek}{m_0}} - \frac{2\htmlData{q=v}{P}^2 \htmlData{q=k}{k}^2}{3\htmlData{q=VG}{E_g}}, \\` +
  String.raw`\htmlData{q=E}{E_{so}} &= -\htmlData{q=psi}{\Delta} - \frac{\hbar^2 \htmlData{q=k}{k}^2}{2\htmlData{q=Ek}{m_0}} - \frac{\htmlData{q=v}{P}^2 \htmlData{q=k}{k}^2}{3(\htmlData{q=VG}{E_g}+\htmlData{q=psi}{\Delta})}` +
  String.raw`\end{aligned}`

export const KANE_MASSES_FORMULA =
  String.raw`\begin{aligned}` +
  String.raw`\frac{\htmlData{q=Ek}{m_0}}{\htmlData{q=mstar}{m_c}} &= 1 + \frac{\htmlData{q=v}{E_P}}{3}\!\left(\frac{2}{\htmlData{q=VG}{E_g}} + \frac{1}{\htmlData{q=VG}{E_g}+\htmlData{q=psi}{\Delta}}\right), \\` +
  String.raw`\frac{\htmlData{q=Ek}{m_0}}{\htmlData{q=mstar}{m_{lh}}} &= 1 + \frac{2\htmlData{q=v}{E_P}}{3\htmlData{q=VG}{E_g}}, \quad \htmlData{q=v}{E_P} = \frac{2m_0 \htmlData{q=v}{P}^2}{\hbar^2}, \\` +
  String.raw`\frac{\htmlData{q=Ek}{m_0}}{\htmlData{q=mstar}{m_{so}}} &= 1 + \frac{\htmlData{q=v}{E_P}}{3(\htmlData{q=VG}{E_g}+\htmlData{q=psi}{\Delta})}, \quad \htmlData{q=mstar}{m_{hh}} = \htmlData{q=Ek}{m_0}` +
  String.raw`\end{aligned}`

export const TWO_BAND_MATRIX_FORMULA =
  String.raw`\begin{aligned}` +
  String.raw`H &= \begin{pmatrix}\htmlData{q=VG}{E_g} & \htmlData{q=v}{P}\htmlData{q=k}{k} \\ \htmlData{q=v}{P}\htmlData{q=k}{k} & 0\end{pmatrix} + \frac{\hbar^2 \htmlData{q=k}{k}^2}{2\htmlData{q=Ek}{m_0}}, \\` +
  String.raw`\htmlData{q=E}{E_\pm}(\htmlData{q=k}{k}) &= \frac{\hbar^2 \htmlData{q=k}{k}^2}{2\htmlData{q=Ek}{m_0}} + \frac{\htmlData{q=VG}{E_g}}{2} \pm \sqrt{\frac{\htmlData{q=VG}{E_g}^2}{4} + \htmlData{q=v}{P}^2 \htmlData{q=k}{k}^2}, \\` +
  String.raw`\htmlData{q=E}{E_c} &\simeq \htmlData{q=VG}{E_g} + \frac{\hbar^2 \htmlData{q=k}{k}^2}{2\htmlData{q=Ek}{m_0}} + \frac{\htmlData{q=v}{P}^2 \htmlData{q=k}{k}^2}{\htmlData{q=VG}{E_g}} \quad (\htmlData{q=v}{P}\htmlData{q=k}{k} \ll \htmlData{q=VG}{E_g})` +
  String.raw`\end{aligned}`
