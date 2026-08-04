import { describe, expect, it } from 'vitest'
import { myersGreedy } from '@/lib/diff/myers'
import { tokenizePair, DEFAULT_TOKENIZE_OPTIONS } from '@/lib/tokenize'
import { fullCorpus } from '../corpus'

/** Same inputs and options → byte-identical trace. PRD §8. */
function fingerprint(a: readonly number[], b: readonly number[]): string {
  const { script, trace, stats } = myersGreedy(a, b)
  return JSON.stringify({
    script,
    stats,
    d: trace.d,
    events: trace.events,
    snapshots: trace.snapshots === null ? null : Array.from(trace.snapshots.data),
  })
}

describe('determinism', () => {
  it.each(fullCorpus(200).map((c) => [c.name, c] as const))('%s is byte-identical', (_name, c) => {
    expect(fingerprint(c.a, c.b)).toBe(fingerprint(c.a, c.b))
  })

  it('does not depend on call order or on previous runs', () => {
    const first = fingerprint([1, 2, 3], [2, 3, 4])
    myersGreedy([9, 9, 9], [8, 8])
    myersGreedy([], [1])
    expect(fingerprint([1, 2, 3], [2, 3, 4])).toBe(first)
  })

  it('is stable through tokenization', () => {
    const source = 'satu\ndua\ntiga\n'
    const target = 'satu\ndua besar\ntiga\nempat\n'
    const once = tokenizePair(source, target, DEFAULT_TOKENIZE_OPTIONS)
    const twice = tokenizePair(source, target, DEFAULT_TOKENIZE_OPTIONS)
    expect(fingerprint(once.a.tokens, once.b.tokens)).toBe(
      fingerprint(twice.a.tokens, twice.b.tokens),
    )
  })

  it('keeps no module-level state between differently shaped runs', () => {
    const big = fingerprint([1, 2, 3, 4, 5, 6, 7, 8], [8, 7, 6, 5, 4, 3, 2, 1])
    myersGreedy(Array.from({ length: 60 }, (_, i) => i), Array.from({ length: 60 }, (_, i) => 59 - i))
    expect(fingerprint([1, 2, 3, 4, 5, 6, 7, 8], [8, 7, 6, 5, 4, 3, 2, 1])).toBe(big)
  })
})
