/**
 * Barra compatta di controllo per le animazioni temporali dei modi vibrazionali:
 * - Play / Pausa (con larghezza stabile per evitare scatti del layout);
 * - Selettore velocità (0,25×, 0,5×, 1×, 2×);
 * - Ripristino fase (t = 0).
 *
 * Rispetta `prefers-reduced-motion`: quando attivo congela la riproduzione in
 * un'istantanea ferma e disabilita il ciclo animato continuo.
 */
import { useCallback, useEffect, useRef, useState, type JSX } from 'react'
import { useReducedMotion } from '../ui/motion'
import './viz.css'

export type PlaybackSpeed = 0.25 | 0.5 | 1 | 2

export const PLAYBACK_SPEEDS: readonly PlaybackSpeed[] = [0.25, 0.5, 1, 2]

/** Formatta la velocità in italiano (virgola decimale + segno ×). */
export function formatPlaybackSpeed(speed: PlaybackSpeed): string {
  switch (speed) {
    case 0.25:
      return '0,25×'
    case 0.5:
      return '0,5×'
    case 1:
      return '1×'
    case 2:
      return '2×'
  }
}

export interface PlaybackControlsLabels {
  readonly group?: string
  readonly play?: string
  readonly pause?: string
  readonly speedGroup?: string
  readonly reset?: string
  readonly reducedMotionBadge?: string
  readonly reducedMotionTitle?: string
}

export interface PlaybackControlsProps {
  readonly playing: boolean
  readonly speed: PlaybackSpeed
  readonly onTogglePlay: () => void
  readonly onSpeedChange: (speed: PlaybackSpeed) => void
  readonly onReset: () => void
  /** Override opzionale per test o stato esterno di prefers-reduced-motion. */
  readonly reducedMotionOverride?: boolean
  readonly labels?: PlaybackControlsLabels
  readonly className?: string
}

const DEFAULT_LABELS: Required<PlaybackControlsLabels> = {
  group: 'Controlli riproduzione animazione',
  play: 'Avvia',
  pause: 'Pausa',
  speedGroup: 'Velocità di riproduzione',
  reset: 'Ripristina fase',
  reducedMotionBadge: 'Istantanea',
  reducedMotionTitle: 'Animazione in pausa perché «riduci movimento» è attivo'
}

export function PlaybackControls({
  playing,
  speed,
  onTogglePlay,
  onSpeedChange,
  onReset,
  reducedMotionOverride,
  labels,
  className
}: PlaybackControlsProps): JSX.Element {
  const systemReduced = useReducedMotion()
  const reduced = reducedMotionOverride ?? systemReduced
  const effectivePlaying = playing && !reduced
  const text = { ...DEFAULT_LABELS, ...labels }

  return (
    <div
      className={'playback-controls' + (className ? ' ' + className : '')}
      role="group"
      aria-label={text.group}
    >
      <button
        type="button"
        className="playback-btn playback-play"
        data-playing={effectivePlaying || undefined}
        aria-label={effectivePlaying ? text.pause : text.play}
        title={reduced ? text.reducedMotionTitle : effectivePlaying ? text.pause : text.play}
        disabled={reduced}
        onClick={onTogglePlay}
      >
        {effectivePlaying ? (
          <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
            <rect x="2" y="1.5" width="3" height="9" rx="0.6" fill="currentColor" />
            <rect x="7" y="1.5" width="3" height="9" rx="0.6" fill="currentColor" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2.5 1.5L10.5 6L2.5 10.5Z" fill="currentColor" />
          </svg>
        )}
        <span className="playback-play-label">{effectivePlaying ? text.pause : text.play}</span>
      </button>

      <div className="playback-speeds" role="group" aria-label={text.speedGroup}>
        {PLAYBACK_SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            className="playback-speed-btn num"
            aria-pressed={speed === s}
            disabled={reduced}
            onClick={() => onSpeedChange(s)}
          >
            {formatPlaybackSpeed(s)}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="playback-btn playback-reset"
        aria-label={text.reset}
        title={text.reset}
        onClick={onReset}
      >
        <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
          <path
            d="M2.5 7a4.5 4.5 0 1 0 1.2-3.1L2.2 5.4M2.2 2.4v3h3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {reduced && (
        <span className="playback-reduced-note" title={text.reducedMotionTitle}>
          {text.reducedMotionBadge}
        </span>
      )}
    </div>
  )
}

/**
 * Hook leggero per governare una fase animata (t in secondi scalati da `speed`)
 * senza lasciare cicli `requestAnimationFrame` attivi quando è in pausa o quando
 * `prefers-reduced-motion` è attivo.
 */
export function usePlaybackPhase(options?: {
  readonly initialPlaying?: boolean
  readonly initialSpeed?: PlaybackSpeed
}): {
  readonly playing: boolean
  readonly effectivePlaying: boolean
  readonly speed: PlaybackSpeed
  readonly phaseRef: React.RefObject<number>
  readonly resetTick: number
  readonly reducedMotion: boolean
  readonly togglePlay: () => void
  readonly setSpeed: (speed: PlaybackSpeed) => void
  readonly resetPhase: () => void
  readonly advance: (dt: number) => number
} {
  const reducedMotion = useReducedMotion()
  const [playing, setPlaying] = useState(options?.initialPlaying ?? true)
  const [speed, setSpeed] = useState<PlaybackSpeed>(options?.initialSpeed ?? 1)
  const [resetTick, setResetTick] = useState(0)
  const phaseRef = useRef(0)

  const effectivePlaying = playing && !reducedMotion

  // Se l'utente attiva "riduci movimento" durante la riproduzione, congela subito la fase
  useEffect(() => {
    if (reducedMotion) {
      setPlaying(false)
    }
  }, [reducedMotion])

  const togglePlay = useCallback(() => {
    if (reducedMotion) return
    setPlaying((p) => !p)
  }, [reducedMotion])

  const resetPhase = useCallback(() => {
    phaseRef.current = 0
    // Forza un re-render così i canvas in pausa (o con riduci movimento) si ridisegnano a t = 0
    setResetTick((n) => n + 1)
  }, [])

  const advance = useCallback(
    (dt: number): number => {
      if (effectivePlaying) {
        phaseRef.current += dt * speed
      }
      return phaseRef.current
    },
    [effectivePlaying, speed]
  )

  return {
    playing,
    effectivePlaying,
    speed,
    phaseRef,
    resetTick,
    reducedMotion,
    togglePlay,
    setSpeed,
    resetPhase,
    advance
  }
}
