import { describe, expect, it } from 'vitest'
import { myersGreedy } from '@/lib/diff/myers'
import { bruteMinimalD } from '@/lib/diff/brute'
import { fullCorpus } from '../corpus'

/**
 * Myers must match the brute-force minimal D exactly, on every input small
 * enough to enumerate. This is the assertion that says the search is correct
 * and not merely plausible. PRD §11.
 */
describe('minimal D agrees with the oracle', () => {
  it.each(fullCorpus(400).map((c) => [c.name, c] as const))('%s', (_name, c) => {
    expect(myersGreedy(c.a, c.b).stats.d).toBe(bruteMinimalD(c.a, c.b))
  })

  it('matches the paper: ABCABBA → CBABAC has D = 5', () => {
    const a = [1, 2, 3, 1, 2, 2, 1]
    const b = [3, 2, 1, 2, 1, 3]
    expect(myersGreedy(a, b).stats.d).toBe(5)
  })

  it('reaches D = N + M when nothing matches', () => {
    const a = [1, 2, 3, 4]
    const b = [5, 6, 7]
    expect(myersGreedy(a, b).stats.d).toBe(7)
  })

  it('reaches D = 0 when the inputs are identical', () => {
    const a = [1, 2, 3, 4, 5]
    expect(myersGreedy(a, a).stats.d).toBe(0)
    expect(myersGreedy(a, a).script.every((op) => op.type === 'keep')).toBe(true)
  })
})
