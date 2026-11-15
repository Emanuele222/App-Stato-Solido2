/**
 * Numeri in formato italiano (virgola decimale) con il segno meno tipografico.
 * Le cifre hanno larghezza fissa nel CSS (font-variant-numeric: tabular-nums),
 * così i valori non «ballano» mentre cambiano.
 */
import { isEffectiveMassDivergent } from '../physics/semiclassical'

const cache = new Map<string, Intl.NumberFormat>()

function formatter(digits: number, grouping: boolean): Intl.NumberFormat {
  const key = `${digits}:${grouping}`
  let f = cache.get(key)
  if (!f) {
    f = new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      useGrouping: grouping
    })
    cache.set(key, f)
  }
  return f
}

/** x con `digits` decimali; «−» tipografico; mai «−0,00». */
export function formatNumber(x: number, digits = 2, options: { signed?: boolean } = {}): string {
  if (!Number.isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : '—'
  const rounded = Number(x.toFixed(digits))
  const value = Object.is(rounded, -0) || rounded === 0 ? 0 : rounded
  const body = formatter(digits, false).format(Math.abs(value))
  if (value < 0) return '−' + body
  return options.signed && value > 0 ? '+' + body : body
}

/** Con unità, separata da uno spazio non separabile. */
export function formatQuantity(x: number, unit: string, digits = 2, options: { signed?: boolean } = {}): string {
  return `${formatNumber(x, digits, options)} ${unit}`
}

/** Cifre significative fisse (per grandezze che variano di ordini di grandezza, es. m* in unità di m₀). */
export function formatSignificant(x: number, significant = 3): string {
  if (!Number.isFinite(x)) return formatNumber(x)
  if (x === 0) return formatNumber(0, significant - 1)
  const magnitude = Math.floor(Math.log10(Math.abs(x)))
  const digits = Math.max(0, Math.min(6, significant - 1 - magnitude))
  return formatNumber(x, digits)
}

export const DIVERGENT_EFFECTIVE_MASS_TEXT = '→ ∞ (flesso)'

/**
 * Formato unico per il rapporto m* / m₀ in tutte le sezioni: usa la soglia
 * definita in `physics/semiclassical.ts` e restituisce «→ ∞ (flesso)» ai flessi.
 */
export function formatEffectiveMassRatio(
  massRatio: number,
  options: { readonly significant?: number; readonly digits?: number; readonly withEquals?: boolean } = {}
): string {
  if (isEffectiveMassDivergent(massRatio)) return DIVERGENT_EFFECTIVE_MASS_TEXT
  const formatted =
    options.digits !== undefined
      ? formatNumber(massRatio, options.digits)
      : formatSignificant(massRatio, options.significant ?? 3)
  return options.withEquals ? `= ${formatted}` : formatted
}
