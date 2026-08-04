import { describe, expect, it } from 'vitest'
import { apply, ApplyError, checkApply, checkWellFormed } from '@/lib/diff/apply'
import { bruteMinimalScripts } from '@/lib/diff/brute'
import { scriptLength, type EditScript } from '@/lib/diff/types'
import { fullCorpus } from '../corpus'

/**
 * apply.ts is the verifier the whole suite leans on, so it is itself tested
 * against hand-written scripts — including malformed ones. A verifier that
 * accepts a bad script is worse than no verifier.
 */
describe('apply', () => {
  it('replays a keep/delete/insert script', () => {
    const a = [1, 2, 3]
    const script: EditScript = [
      { type: 'keep', aIndex: 0, bIndex: 0, token: 1 },
      { type: 'delete', aIndex: 1, token: 2 },
      { type: 'insert', bIndex: 1, token: 9 },
      { type: 'keep', aIndex: 2, bIndex: 2, token: 3 },
    ]
    expect(apply(a, script)).toEqual([1, 9, 3])
  })

  it('turns an empty script on empty A into empty B', () => {
    expect(apply([], [])).toEqual([])
  })

  it('rejects a script that skips an element of A', () => {
    expect(() => apply([1, 2], [{ type: 'keep', aIndex: 0, bIndex: 0, token: 1 }])).toThrow(
      ApplyError,
    )
  })

  it('rejects an op addressing the wrong position in A', () => {
    expect(() =>
      apply(
        [1, 2],
        [
          { type: 'delete', aIndex: 1, token: 2 },
          { type: 'delete', aIndex: 0, token: 1 },
        ],
      ),
    ).toThrow(/addresses A\[1\]/)
  })

  it('rejects an op whose token disagrees with A', () => {
    expect(() => apply([1], [{ type: 'delete', aIndex: 0, token: 42 }])).toThrow(/carries token 42/)
  })

  it('rejects a script running past the end of A', () => {
    expect(() =>
      apply(
        [1],
        [
          { type: 'delete', aIndex: 0, token: 1 },
          { type: 'delete', aIndex: 1, token: 1 },
        ],
      ),
    ).toThrow(/past the end/)
  })

  it('reports a wrong result rather than throwing', () => {
    const check = checkApply([1], [2], [{ type: 'keep', aIndex: 0, bIndex: 0, token: 1 }])
    expect(check.ok).toBe(false)
  })
})

describe('checkWellFormed', () => {
  it('catches a keep of unequal elements that still applies', () => {
    // This script takes A to B, but claims A[0] and B[0] are the same element.
    const a = [1]
    const b = [1]
    expect(checkApply(a, b, [{ type: 'keep', aIndex: 0, bIndex: 0, token: 1 }]).ok).toBe(true)
    expect(checkWellFormed([1], [2], [{ type: 'keep', aIndex: 0, bIndex: 0, token: 1 }]).ok).toBe(
      false,
    )
  })

  it('catches out-of-order B indices', () => {
    const script: EditScript = [
      { type: 'insert', bIndex: 1, token: 5 },
      { type: 'insert', bIndex: 0, token: 6 },
    ]
    expect(checkWellFormed([], [5, 6], script).ok).toBe(false)
  })
})

/**
 * Every minimal script the oracle can produce must satisfy the apply property.
 * This runs before any search exists, so the property is proven on scripts of
 * known provenance first.
 */
describe('apply property over oracle scripts', () => {
  const corpus = fullCorpus(120)
  it.each(corpus.map((c) => [c.name, c] as const))('%s', (_name, c) => {
    const { scripts, count } = bruteMinimalScripts(c.a, c.b, 8)
    expect(count).toBeGreaterThan(0)
    for (const script of scripts) {
      const applied = checkApply(c.a, c.b, script)
      expect(applied.ok, applied.ok ? '' : applied.reason).toBe(true)
      const formed = checkWellFormed(c.a, c.b, script)
      expect(formed.ok, formed.ok ? '' : formed.reason).toBe(true)
      // Every enumerated script is minimal, so they all share one D.
      expect(scriptLength(script)).toBe(scriptLength(scripts[0]))
    }
  })
})
