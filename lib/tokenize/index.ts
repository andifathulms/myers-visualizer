/**
 * Text → integer ids.
 *
 * Tokenization happens first and the search then operates on integers, never
 * strings. This is what real implementations do, it is far faster, and it
 * makes the equality relation an explicit, inspectable choice — including
 * whitespace handling. PRD §7.
 */
import type { Token } from '@/lib/diff/types'

export const GRANULARITIES = ['line', 'word', 'char'] as const

export type Granularity = (typeof GRANULARITIES)[number]

export type TokenizeOptions = {
  readonly granularity: Granularity
  /** Compare with surrounding whitespace trimmed and inner runs collapsed. */
  readonly ignoreWhitespace: boolean
  readonly ignoreCase: boolean
}

export const DEFAULT_TOKENIZE_OPTIONS: TokenizeOptions = {
  granularity: 'line',
  ignoreWhitespace: false,
  ignoreCase: false,
}

/** One side: ids for the search, original texts for display. */
export type Tokenized = {
  readonly tokens: readonly Token[]
  readonly texts: readonly string[]
}

export type TokenizedPair = {
  readonly a: Tokenized
  readonly b: Tokenized
  /** Distinct equality classes across both sides. */
  readonly vocabularySize: number
}

export function split(text: string, granularity: Granularity): string[] {
  if (text === '') return []
  switch (granularity) {
    case 'line': {
      const lines = text.split('\n')
      // A trailing newline terminates the last line rather than starting an
      // empty one; treating it as an element produces a phantom edit.
      if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop()
      return lines
    }
    case 'word':
      // Keep whitespace attached to the preceding word so that reassembling
      // the tokens reproduces the input exactly.
      return text.match(/\S+\s*|\s+/g) ?? []
    case 'char':
      return Array.from(text)
    default: {
      const never: never = granularity
      throw new Error(`unknown granularity ${JSON.stringify(never)}`)
    }
  }
}

/** The equality relation, made explicit. Two texts are the same element iff their keys match. */
export function equalityKey(text: string, options: TokenizeOptions): string {
  let key = text
  if (options.ignoreWhitespace) key = key.trim().replace(/\s+/g, ' ')
  if (options.ignoreCase) key = key.toLowerCase()
  return key
}

export function tokenizePair(
  aText: string,
  bText: string,
  options: TokenizeOptions = DEFAULT_TOKENIZE_OPTIONS,
): TokenizedPair {
  const table = new Map<string, Token>()

  const side = (text: string): Tokenized => {
    const texts = split(text, options.granularity)
    const tokens: Token[] = []
    for (const piece of texts) {
      const key = equalityKey(piece, options)
      let id = table.get(key)
      if (id === undefined) {
        id = table.size
        table.set(key, id)
      }
      tokens.push(id)
    }
    return { tokens, texts }
  }

  const a = side(aText)
  const b = side(bText)
  return { a, b, vocabularySize: table.size }
}
