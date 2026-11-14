/**
 * Componenti KaTeX: simboli in linea e testi con formule fra $…$.
 * Opzioni e rendering stanno in ./katex.
 */
import { memo, useMemo, type JSX } from 'react'
import { renderTex } from './katex'

/** Formula in linea. */
export const Tex = memo(function Tex({
  tex,
  display = false,
  className
}: {
  tex: string
  display?: boolean
  className?: string
}): JSX.Element {
  const html = useMemo(() => renderTex(tex, display), [tex, display])
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
})

/**
 * Testo con formule fra $…$ (per schede teoria e note). Il testo è dei file
 * di stringhe, quindi fidato; i simboli possono portare \htmlData{q=…}.
 */
export const RichText = memo(function RichText({ text }: { text: string }): JSX.Element {
  const parts = useMemo(() => splitMath(text), [text])
  return (
    <>
      {parts.map((part, i) =>
        part.math ? <Tex key={i} tex={part.value} /> : <span key={i}>{part.value}</span>
      )}
    </>
  )
})

function splitMath(text: string): { math: boolean; value: string }[] {
  const out: { math: boolean; value: string }[] = []
  const pieces = text.split('$')
  pieces.forEach((value, i) => {
    if (value.length > 0) out.push({ math: i % 2 === 1, value })
  })
  return out
}
