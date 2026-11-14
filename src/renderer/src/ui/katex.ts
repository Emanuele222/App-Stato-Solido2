/**
 * KaTeX nell'app: opzioni comuni e rendering memorizzato. Le formule possono marcare i termini con \htmlData{q=<id>}{…}:
 * è l'unico comando «html» consentito (trust limitato a quello, con il solo
 * attributo q), e l'avviso di strict per le estensioni html è silenziato.
 * CSS e font di KaTeX sono inclusi nel pacchetto (funziona offline).
 */
import katex, { type KatexOptions } from 'katex'
import 'katex/dist/katex.min.css'

export const KATEX_OPTIONS: KatexOptions = {
  throwOnError: false,
  output: 'html',
  trust: (context) =>
    context.command === '\\htmlData' && Object.keys(context.attributes).every((key) => key === 'data-q'),
  strict: (errorCode: string) => (errorCode === 'htmlExtension' ? 'ignore' : 'warn')
}

const cache = new Map<string, string>()

/** HTML di KaTeX per `tex` (memorizzato: le formule sono poche e fisse). */
export function renderTex(tex: string, displayMode = false): string {
  const key = (displayMode ? 'D:' : 'I:') + tex
  let html = cache.get(key)
  if (html === undefined) {
    html = katex.renderToString(tex, { ...KATEX_OPTIONS, displayMode })
    cache.set(key, html)
  }
  return html
}

