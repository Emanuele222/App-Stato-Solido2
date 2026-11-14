/**
 * Controlli del design system: cursore di parametro, interruttore di
 * strumento, contatore, menu dei preset. Ogni controllo legato a una
 * grandezza ne usa il colore (data-q → --q) e, al passaggio del mouse o col
 * focus, chiede di evidenziarla (onHighlight).
 */
import { useId, type JSX, type ReactNode } from 'react'
import { formatNumber } from './format'
import { RichText, Tex } from './tex'
import type { QuantityId } from './theme'

export interface ParamSliderProps {
  readonly quantity: QuantityId
  /** Simbolo in TeX, es. 'V_{G}'. */
  readonly symbol: string
  /** Nome accessibile, es. «Componente di Fourier V_G del potenziale». */
  readonly label: string
  readonly value: number
  readonly min: number
  readonly max: number
  readonly step: number
  readonly unit: string
  readonly digits: number
  readonly active?: boolean
  readonly onChange: (value: number) => void
  readonly onHighlight?: (quantity: QuantityId | null) => void
}

export function ParamSlider(props: ParamSliderProps): JSX.Element {
  const { quantity, symbol, label, value, min, max, step, unit, digits, active, onChange, onHighlight } = props
  const id = useId()
  const text = `${formatNumber(value, digits)} ${unit}`
  const zero = min < 0 && max > 0 ? ((0 - min) / (max - min)) * 100 : null
  // larghezza stabile: quella del valore più lungo possibile
  const widest = Math.max(formatNumber(min, digits).length, formatNumber(max, digits).length) + unit.length + 1
  return (
    <div
      className={'param' + (active ? ' is-active' : '')}
      data-q={quantity}
      onMouseEnter={() => onHighlight?.(quantity)}
      onMouseLeave={() => onHighlight?.(null)}
    >
      <label className="param-symbol" htmlFor={id}>
        <Tex tex={symbol} />
      </label>
      <div className="param-track">
        {zero !== null && <span className="param-zero" style={{ left: `calc(var(--thumb) / 2 + (100% - var(--thumb)) * ${zero / 100})` }} aria-hidden="true" />}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          aria-valuetext={text}
          onChange={(e) => onChange(Number(e.currentTarget.value))}
          onFocus={() => onHighlight?.(quantity)}
          onBlur={() => onHighlight?.(null)}
        />
      </div>
      <output className="param-value num" htmlFor={id} style={{ minWidth: `${widest}ch` }}>
        {text}
      </output>
    </div>
  )
}

export function ToolToggle({
  pressed,
  onToggle,
  quantity,
  children,
  title
}: {
  pressed: boolean
  onToggle: () => void
  quantity?: QuantityId
  children: ReactNode
  title?: string
}): JSX.Element {
  return (
    <button
      type="button"
      className="tool-toggle"
      aria-pressed={pressed}
      data-q={quantity}
      title={title}
      onClick={onToggle}
    >
      {quantity && <span className="tool-swatch" aria-hidden="true" />}
      {children}
    </button>
  )
}

export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  decreaseLabel,
  increaseLabel
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  decreaseLabel: string
  increaseLabel: string
}): JSX.Element {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <span className="stepper-label">{label}</span>
      <button type="button" aria-label={decreaseLabel} disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <output className="num" aria-live="polite">
        {value}
      </output>
      <button type="button" aria-label={increaseLabel} disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  )
}

export interface PresetOption {
  readonly id: string
  readonly label: string
}

export function PresetMenu({
  label,
  freeLabel,
  options,
  value,
  onSelect,
  note
}: {
  label: string
  freeLabel: string
  options: readonly PresetOption[]
  value: string | null
  onSelect: (id: string | null) => void
  note?: string
}): JSX.Element {
  const id = useId()
  return (
    <div className="preset">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value ?? ''} onChange={(e) => onSelect(e.currentTarget.value || null)}>
        <option value="">{freeLabel}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      {note && (
        <span className="preset-note">
          <RichText text={note} />
        </span>
      )}
    </div>
  )
}

/** Pannello con titolo (colonna destra: formula viva, scheda teoria). */
export function Panel({ title, children, className }: { title: string; children: ReactNode; className?: string }): JSX.Element {
  const id = useId()
  return (
    <section className={'panel' + (className ? ' ' + className : '')} aria-labelledby={id}>
      <h2 id={id} className="panel-title">
        {title}
      </h2>
      {children}
    </section>
  )
}
