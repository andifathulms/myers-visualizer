import { describe, expect, it } from 'vitest'
import { bruteMinimalD, bruteMinimalScripts } from '@/lib/diff/brute'
import { scriptLength } from '@/lib/diff/types'
import { EDGE_CASES, fullCorpus } from '../corpus'

/**
 * The oracle is the thing Myers will be judged against, so it is judged first:
 * its two independent computations — 0-1 BFS forward, and a backward DP — must
 * agree on every case.
 */
describe('brute-force oracle', () => {
  it('gives D = 0 for identical inputs', () => {
    expect(bruteMinimalD([1, 2, 3], [1, 2, 3])).toBe(0)
    expect(bruteMinimalD([], [])).toBe(0)
  })

  it('gives D = N + M for fully disjoint inputs', () => {
    expect(bruteMinimalD([1, 2, 3], [4, 5])).toBe(5)
  })

  it('gives D = M when A is empty, D = N when B is empty', () => {
    expect(bruteMinimalD([], [1, 2, 3])).toBe(3)
    expect(bruteMinimalD([1, 2, 3], [])).toBe(3)
  })

  it('matches the paper, figure 1: ABCABBA → CBABAC has D = 5', () => {
    const a = [1, 2, 3, 1, 2, 2, 1]
    const b = [3, 2, 1, 2, 1, 3]
    expect(bruteMinimalD(a, b)).toBe(5)
  })

  it.each(fullCorpus(150).map((c) => [c.name, c] as const))(
    'BFS and DP agree on %s',
    (_name, c) => {
      const viaBfs = bruteMinimalD(c.a, c.b)
      const { scripts } = bruteMinimalScripts(c.a, c.b, 1)
      expect(scriptLength(scripts[0])).toBe(viaBfs)
    },
  )

  it.each(EDGE_CASES.map((c) => [c.name, c] as const))(
    'D never exceeds N + M on %s',
    (_name, c) => {
      const d = bruteMinimalD(c.a, c.b)
      expect(d).toBeLessThanOrEqual(c.a.length + c.b.length)
      // Parity: every path from (0,0) to (N,M) has D ≡ N + M (mod 2).
      expect(Math.abs(d - (c.a.length + c.b.length)) % 2).toBe(0)
    },
  )

  it('enumerates several minimal scripts when the input is ambiguous', () => {
    // Deleting either of the two 1s costs the same. The scripts differ; D does not.
    const { count, scripts } = bruteMinimalScripts([1, 1], [1], 10)
    expect(count).toBe(2)
    expect(new Set(scripts.map((s) => scriptLength(s))).size).toBe(1)
  })

  it('reports truncation rather than silently capping', () => {
    const a = [1, 1, 1, 1, 1, 1]
    const b = [1, 1, 1]
    const result = bruteMinimalScripts(a, b, 3)
    expect(result.truncated).toBe(true)
    expect(result.count).toBe(3)
  })
})
