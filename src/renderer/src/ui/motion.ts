/**
 * Movimento: ogni cambio di parametro è una transizione interpolata
 * (progetto.md «Design visivo»), azzerata se l'utente chiede meno movimento
 * (prefers-reduced-motion).
 */
import { useEffect, useRef, useState } from 'react'

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(REDUCED_QUERY).matches
    : false
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(REDUCED_QUERY)
    const onChange = (): void => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export type Easing = (u: number) => number

export const easeOutCubic: Easing = (u) => 1 - Math.pow(1 - u, 3)
export const easeInOutCubic: Easing = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2)

/** Come si arriva a un nuovo valore: durata (ms) e curva. */
export interface Transition {
  readonly duration: number
  readonly easing: Easing
}

/** Cursori e tastiera: breve, insegue il valore senza scatti. */
export const FOLLOW: Transition = { duration: 160, easing: easeOutCubic }
/** Preset e salti grandi: visibile, con partenza e arrivo dolci. */
export const GLIDE: Transition = { duration: 700, easing: easeInOutCubic }

type NumberRecord = Readonly<Record<string, number>>

/**
 * Valori numerici interpolati verso `target`. Ogni volta che il bersaglio
 * cambia parte una nuova transizione dal valore mostrato in quel momento,
 * quindi trascinare un cursore produce un inseguimento continuo.
 * `transition` va passata come costante stabile (FOLLOW, GLIDE…).
 */
export function useTweened<T extends NumberRecord>(target: T, transition: Transition): T {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState<T>(target)
  const shownRef = useRef<T>(target)
  const raf = useRef(0)

  useEffect(() => {
    cancelAnimationFrame(raf.current)
    const from = shownRef.current
    if (reduced || transition.duration <= 0 || sameValues(from, target)) {
      shownRef.current = target
      setShown(target)
      return
    }
    const t0 = performance.now()
    const step = (now: number): void => {
      const u = Math.min(1, (now - t0) / transition.duration)
      const e = transition.easing(u)
      const next = {} as Record<string, number>
      for (const key of Object.keys(target)) next[key] = from[key] + (target[key] - from[key]) * e
      const value = (u >= 1 ? target : next) as T
      shownRef.current = value
      setShown(value)
      if (u < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
    // il bersaglio si confronta per valore, non per identità
  }, [...Object.values(target), transition, reduced])

  return shown
}

function sameValues(a: NumberRecord, b: NumberRecord): boolean {
  for (const key of Object.keys(b)) if (a[key] !== b[key]) return false
  return true
}

/**
 * Inseguimento esponenziale per i disegni su canvas (fasce di assi, opacità
 * delle sovrapposizioni): `step` avvicina il valore al bersaglio e dice se
 * serve un altro fotogramma.
 */
export class Smoothed {
  value: number
  target: number
  constructor(
    initial: number,
    private readonly tau = 0.12
  ) {
    this.value = initial
    this.target = initial
  }

  set(target: number, snap = false): void {
    this.target = target
    if (snap) this.value = target
  }

  /** Avanza di dt secondi; true se non è ancora arrivato. */
  step(dt: number, reduced: boolean): boolean {
    if (reduced) {
      this.value = this.target
      return false
    }
    const diff = this.target - this.value
    const scale = Math.max(1e-9, Math.abs(this.target), Math.abs(this.value))
    if (Math.abs(diff) <= 1e-4 * scale + 1e-6) {
      this.value = this.target
      return false
    }
    this.value += diff * (1 - Math.exp(-dt / this.tau))
    return true
  }
}
