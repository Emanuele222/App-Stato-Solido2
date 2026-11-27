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
  EF: { color: '#ff9f5a', name: 'livello di Fermi' },
  /** integrale di salto t / t_s / |t_p| e larghezza di banda W */
  t: { color: '#75a4ff', name: 'integrale di salto e larghezza di banda' },
  /** funzione trascendente di Kronig–Penney f(αa), L(E) e numeri d'onda α, β */
  kp: { color: '#badc58', name: 'funzione di Kronig–Penney' },
  /** separazione spin–orbita Δ e banda split-off (so) */
  Delta: { color: '#eb82a6', name: 'separazione spin–orbita' },
  /** energia caratteristica di Kane E_P e accoppiamento k·p P */
  EP: { color: '#64b5f6', name: 'energia caratteristica di Kane' },
  /** pulsazione fononica ω(k) e ramo acustico ω₋ (Parte 6) */
  omega: { color: '#72d67c', name: 'pulsazione ω(k) e ramo acustico' },
  /** ramo ottico ω₊, gap fononico e temperatura di Einstein Θ_E (Parte 6) */
  omegaOpt: { color: '#f59e56', name: 'ramo ottico ω₊, gap fononico e Θ_E' },
  /** costante elastica C e matrice delle costanti di forza Φ (Parte 6) */
  C: { color: '#e8795e', name: 'costante elastica C' },
  /** massa atomica M (catena monatomica o atomo pesante nella biatomica) */
  M: { color: '#7aa2f7', name: 'massa atomica M' },
  /** massa atomica leggera m nella catena biatomica (M > m) */
  m: { color: '#e68ab8', name: 'massa atomica leggera m' },
  /** spostamento atomico u_n(t), pacchetto d’onda Ψ e rapporto d’ampiezza α */
  u: { color: '#c9e663', name: 'spostamento atomico u_n(t)' },
  /** velocità di fase v_p = ω/k */
  vp: { color: '#c49bff', name: 'velocità di fase v_p' },
  /** temperatura T e scala termica k_B T */
  T: { color: '#ff6b6b', name: 'temperatura T' },
  /** temperatura e pulsazione di Debye Θ_D, ω_D */
  Theta: { color: '#a07ef5', name: 'temperatura e frequenza di Debye' },
  /** calore specifico molare C_V e densità degli stati fononica g(ω) */
  CV: { color: '#45b7f7', name: 'calore specifico C_V e densità degli stati' }
} as const

export type QuantityId = keyof typeof QUANTITIES

export function quantityColor(id: QuantityId): string {
  return QUANTITIES[id].color
}

/**
 * Toni derivati: sfumature (più chiare o più scure) di una grandezza già presente
 * in QUANTITIES o di un neutro del tema. Non sono grandezze nuove: `from` dice da
 * quale derivano, e i componenti li leggono solo da qui (mai come codici nel codice).
 * Il CSS li riceve come --tone-<nome>.
 */
export const DERIVED_TONES = {
  /** bande di conduzione dello pseudopotenziale: tinta chiara di E, per staccarle dalle bande di valenza */
  conductionBands: { from: 'E', color: '#b4de9e', name: 'bande di conduzione (tinta chiara di E)' },
  /** parte liscia ψᶠ, tratteggiata accanto alla ψ vera: tinta chiara di ψ */
  smoothWavefunction: { from: 'psi', color: '#f0b3e7', name: 'parte liscia ψᶠ (tinta chiara di ψ)' },
  /** Re ψ_k lungo la catena: neutro chiaro, per non confonderla con |ψ_k|² (colore ψ) */
  realPartWave: { from: 'neutral', color: '#cad8ea', name: 'parte reale Re ψ_k (neutro chiaro)' },
  /** orbitali atomici troppo piccoli per un lobo, famiglia A: tinta scura di a */
  faintOrbitalA: { from: 'a', color: '#4f899c', name: 'orbitale debole, famiglia A (tinta scura di a)' },
  /** orbitali atomici troppo piccoli per un lobo, famiglia B: tinta scura di E_F */
  faintOrbitalB: { from: 'EF', color: '#9c6647', name: 'orbitale debole, famiglia B (tinta scura di E_F)' },
  /** etichetta dell'estremo legante (tinta chiara di v) */
  bondingText: { from: 'v', color: '#96e8d4', name: 'estremo legante (tinta chiara di v)' },
  /** etichetta dell'estremo antilegante (tinta chiara di V_2G) */
  antibondingText: { from: 'V2G', color: '#f7b6ad', name: 'estremo antilegante (tinta chiara di V_2G)' },
  /** rami acustici trasversali TA in 3D: tinta chiara di ω */
  acousticTransverse: { from: 'omega', color: '#a8e6ae', name: 'rami acustici trasversali TA (tinta chiara di ω)' },
  /** rami ottici trasversali TO in 3D: tinta chiara di ω₊ */
  opticalTransverse: { from: 'omegaOpt', color: '#f7c597', name: 'rami ottici trasversali TO (tinta chiara di ω₊)' },
  /** retta della luce infrarossa ω = ck/n: tinta chiara di k */
  lightLine: { from: 'k', color: '#f9e28b', name: 'retta della luce IR (tinta chiara di k)' },
  /** densità degli stati 1D con singolarità di Van Hove: tinta chiara di C_V */
  vanHoveDos: { from: 'CV', color: '#8cd4fa', name: 'densità degli stati Van Hove (tinta chiara di C_V)' },
  /** modi termicamente attivati nello spettro g(ω): tinta chiara di T */
  activatedModes: { from: 'T', color: '#ff9999', name: 'modi attivati termicamente (tinta chiara di T)' },
  /** stato di core ψ_c, banda E_c, area β_c ψ_c e lobi dell'ortogonalità */
  coreState: { from: 't', color: '#6fb6ff', name: 'stato di core ψ_c ed E_c (tinta di t)' },
  /** potenziale schermato V + V′ e convergenza della pseudo-Hamiltoniana */
  screenedPotential: { from: 'VG', color: '#f5b378', name: 'pseudopotenziale V + V′ (tinta chiara di V_G)' }
} as const

export type DerivedToneId = keyof typeof DERIVED_TONES

export function toneColor(id: DerivedToneId): string {
  return DERIVED_TONES[id].color
}

/** Lobi degli orbitali nella catena (segno + e −, zero): colore pieno con trasparenza (#rrggbbaa). */
export interface LobePalette {
  readonly posFill: string
  readonly posStroke: string
  readonly posText: string
  readonly negFill: string
  readonly negStroke: string
  readonly negText: string
  readonly zeroFill: string
  readonly zeroStroke: string
}

/**
 * Famiglia A: derivata da a (azzurro); famiglia B: derivata da E_F (arancio);
 * monoatomica: neutri del tema (grigio chiaro). Riempimenti con trasparenza in coda (#rrggbbaa).
 */
export const LOBE_PALETTES: Record<'A' | 'B' | 'mono', LobePalette> = {
  A: {
    posFill: '#88e0f4e0',
    posStroke: '#b9f0fc',
    posText: '#0a1f28',
    negFill: '#14303ce6',
    negStroke: '#4c8ca2',
    negText: '#9cd2e3',
    zeroFill: '#48768659',
    zeroStroke: '#66a1b5'
  },
  B: {
    posFill: '#ffba8ae6',
    posStroke: '#ffd7ba',
    posText: '#2c1408',
    negFill: '#422114eb',
    negStroke: '#a86545',
    negText: '#f0b896',
    zeroFill: '#8a5c4259',
    zeroStroke: '#b57b5c'
  },
  mono: {
    posFill: '#eaeef4e0',
    posStroke: '#ffffff',
    posText: '#11151b',
    negFill: '#1e242eeb',
    negStroke: '#738096',
    negText: '#c5ccd8',
    zeroFill: '#626a7857',
    zeroStroke: '#808a9a'
  }
}

/** Pillole degli estremi di banda (legante: tinta di v; antilegante: tinta di V_2G). */
export const EXTREMUM_PILLS = {
  bonding: { fill: '#1c342ee6', stroke: '#5cd0b38c', text: DERIVED_TONES.bondingText.color },
  antibonding: { fill: '#36222ae6', stroke: '#f79a8e8c', text: DERIVED_TONES.antibondingText.color }
} as const

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
  for (const [id, tone] of Object.entries(DERIVED_TONES)) {
    vars.push(`--tone-${kebab(id)}:${tone.color};`)
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
