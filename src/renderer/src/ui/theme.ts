/**
 * Design system: token di colore e tipografia e la tabella unica
 * colore ↔ grandezza fisica (progetto.md «Design visivo»). Formule, scene,
 * cursori e grafici leggono i colori solo da qui: il CSS li riceve come
 * variabili (--q-<id>) iniettate all'avvio da `installTheme`.
 */

export const TOKENS = {
  bg: '#0f1114',
  panel: '#13161a',
  raised: '#181c21',
  line: '#242930',
  lineStrong: '#353b45',
  text: '#e8e6e1',
  textSoft: '#c5c7cb',
  muted: '#8b9099',
  dim: '#5f6670',
  focus: '#58c4dd'
} as const

export const FONTS = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  /** Font della matematica nei canvas: quelli di KaTeX (inclusi nell'app), poi ripieghi di sistema. */
  math: 'KaTeX_Math, KaTeX_Main, "Latin Modern Math", "STIX Two Math", "Cambria Math", serif',
  mathUpright: 'KaTeX_Main, "Latin Modern Math", "STIX Two Math", "Cambria Math", serif'
} as const

/**
 * Grandezze fisiche con colore proprio. Un colore = una grandezza: lo stesso
 * id marca il termine della formula (\htmlData{q=id}), il cursore e
 * l'oggetto disegnato. Due tonalità della stessa famiglia (V_G e V_2G) restano
 * la stessa grandezza, il potenziale, con due componenti di Fourier.
 */
export const QUANTITIES = {
  /** passo reticolare; anche G = 2π/a e i bordi di zona ±π/a, che ne dipendono */
  a: { color: '#58c4dd', name: 'passo reticolare' },
  /** vettore d'onda di Bloch */
  k: { color: '#f4d345', name: 'vettore d’onda' },
  /** energia vera, bande E(k), E± */
  E: { color: '#83c167', name: 'energia delle bande' },
  /** energia libera: parabola E_k = ħ²k²/2m₀ ed E₀ */
  Ek: { color: '#aab1bb', name: 'energia dell’elettrone libero' },
  /** potenziale V(x) e la sua prima componente di Fourier V_G */
  VG: { color: '#fc6255', name: 'componente V_G del potenziale' },
  /** seconda componente di Fourier del potenziale */
  V2G: { color: '#f79a8e', name: 'componente V_2G del potenziale' },
  /** funzione d'onda e densità |ψ|² */
  psi: { color: '#dc75cd', name: 'funzione d’onda' },
  /** massa efficace m* */
  mstar: { color: '#b189f0', name: 'massa efficace' },
  /** velocità di gruppo v */
  v: { color: '#5cd0b3', name: 'velocità di gruppo' },
  /** livello di Fermi E_F */
  EF: { color: '#ff9f5a', name: 'livello di Fermi' }
} as const

export type QuantityId = keyof typeof QUANTITIES

export function quantityColor(id: QuantityId): string {
  return QUANTITIES[id].color
}

export function isQuantityId(value: string | null | undefined): value is QuantityId {
  return value != null && Object.prototype.hasOwnProperty.call(QUANTITIES, value)
}

/** CSS generato dalla tabella: variabili dei token e delle grandezze, colore dei termini [data-q]. */
export function themeCss(): string {
  const vars: string[] = []
  for (const [name, value] of Object.entries(TOKENS)) vars.push(`--${kebab(name)}:${value};`)
  vars.push(`--font-sans:${FONTS.sans};`)
  vars.push(`--font-math:${FONTS.math};`)
  const rules: string[] = []
  for (const [id, q] of Object.entries(QUANTITIES)) {
    vars.push(`--q-${id}:${q.color};`)
    rules.push(`[data-q="${id}"]{--q:var(--q-${id})}`)
  }
  return `:root{${vars.join('')}}\n${rules.join('\n')}`
}

/** Inietta il tema nel documento (una volta, all'avvio). */
export function installTheme(doc: Document = document): void {
  if (doc.getElementById('theme-vars')) return
  const style = doc.createElement('style')
  style.id = 'theme-vars'
  style.textContent = themeCss()
  doc.head.prepend(style)
}

function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())
}
