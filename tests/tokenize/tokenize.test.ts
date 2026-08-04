import { describe, expect, it } from 'vitest'
import { DEFAULT_TOKENIZE_OPTIONS, split, tokenizePair } from '@/lib/tokenize'

describe('split', () => {
  it('splits lines and does not invent one for a trailing newline', () => {
    expect(split('a\nb\n', 'line')).toEqual(['a', 'b'])
    expect(split('a\nb', 'line')).toEqual(['a', 'b'])
    expect(split('', 'line')).toEqual([])
    expect(split('\n', 'line')).toEqual([''])
  })

  it('keeps a blank line in the middle', () => {
    expect(split('a\n\nb', 'line')).toEqual(['a', '', 'b'])
  })

  it('splits words so that rejoining reproduces the input', () => {
    const text = 'satu  dua\ntiga '
    expect(split(text, 'word').join('')).toBe(text)
  })

  it('splits characters by code point, not UTF-16 unit', () => {
    expect(split('a😀b', 'char')).toEqual(['a', '😀', 'b'])
  })
})

describe('tokenizePair', () => {
  it('shares one id space across both sides', () => {
    const { a, b } = tokenizePair('x\ny', 'y\nz', DEFAULT_TOKENIZE_OPTIONS)
    expect(a.tokens[1]).toBe(b.tokens[0]) // 'y' is the same element on both sides
    expect(a.tokens[0]).not.toBe(b.tokens[1])
  })

  it('assigns ids in first-seen order, deterministically', () => {
    const once = tokenizePair('a\nb\na', 'b\nc', DEFAULT_TOKENIZE_OPTIONS)
    const twice = tokenizePair('a\nb\na', 'b\nc', DEFAULT_TOKENIZE_OPTIONS)
    expect(once.a.tokens).toEqual(twice.a.tokens)
    expect(once.b.tokens).toEqual(twice.b.tokens)
    expect(once.a.tokens).toEqual([0, 1, 0])
    expect(once.vocabularySize).toBe(3)
  })

  it('keeps the original text for display while comparing on the key', () => {
    const { a, b } = tokenizePair('  hello  ', 'hello', {
      ...DEFAULT_TOKENIZE_OPTIONS,
      ignoreWhitespace: true,
    })
    expect(a.tokens[0]).toBe(b.tokens[0])
    expect(a.texts[0]).toBe('  hello  ') // display is untouched
  })

  it('treats whitespace as significant unless asked not to', () => {
    const strict = tokenizePair('a b', 'a  b', DEFAULT_TOKENIZE_OPTIONS)
    expect(strict.a.tokens[0]).not.toBe(strict.b.tokens[0])
    const loose = tokenizePair('a b', 'a  b', { ...DEFAULT_TOKENIZE_OPTIONS, ignoreWhitespace: true })
    expect(loose.a.tokens[0]).toBe(loose.b.tokens[0])
  })

  it('folds case only when asked', () => {
    const strict = tokenizePair('Halo', 'halo', DEFAULT_TOKENIZE_OPTIONS)
    expect(strict.a.tokens[0]).not.toBe(strict.b.tokens[0])
    const folded = tokenizePair('Halo', 'halo', { ...DEFAULT_TOKENIZE_OPTIONS, ignoreCase: true })
    expect(folded.a.tokens[0]).toBe(folded.b.tokens[0])
  })

  it('produces one token per element and keeps texts aligned', () => {
    const { a } = tokenizePair('satu\ndua\ntiga', '', DEFAULT_TOKENIZE_OPTIONS)
    expect(a.tokens).toHaveLength(3)
    expect(a.texts).toEqual(['satu', 'dua', 'tiga'])
  })
})
