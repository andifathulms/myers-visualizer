import { describe, expect, it } from 'vitest'
import { analyseAmbiguity, minimalScripts, sharesOfScript } from '@/lib/diff/ambiguity'
import { diff } from '@/lib/diff'
import type { EditScript, Token } from '@/lib/diff/types'

/**
 * The share of an operation is a claim about a set — "this attribution appears
 * in three of the twelve minimal scripts" — so it is checked against the set
 * itself, enumerated, rather than against the DP that produced it. Two tables
 * agreeing with each other would prove nothing.
 *
 * Inputs are kept small enough that every minimal script can be listed.
 */
const CASES: readonly { readonly name: string; readonly a: string; readonly b: string }[] = [
  { name: 'a minimal edit', a: 'abcde', b: 'abXde' },
  { name: 'repeated elements', a: 'aaa', b: 'aa' },
  { name: 'heavily repeated', a: 'abab', b: 'baba' },
  { name: 'pure insertion', a: 'ac', b: 'abc' },
  { name: 'pure deletion', a: 'abc', b: 'ac' },
  { name: 'disjoint', a: 'abc', b: 'xyz' },
  { name: 'identical', a: 'abc', b: 'abc' },
  { name: 'empty a', a: '', b: 'abc' },
  { name: 'empty b', a: 'abc', b: '' },
  { name: 'both empty', a: '', b: '' },
  { name: 'a brace between two blocks', a: 'f{x}g{y}', b: 'f{x}h{z}g{y}' },
]

const tokens = (text: string): Token[] => [...text].map((c) => c.charCodeAt(0))

/** How many of `all` contain this exact operation at this exact position. */
function countContaining(all: readonly EditScript[], script: EditScript, index: number): number {
  // An operation is identified by the edge it walks: the point it starts from
  // and the move it makes. Two scripts share it when both pass that way.
  const at = (s: EditScript, i: number) => {
    let x = 0
    let y = 0
    for (let j = 0; j < i; j++) {
      const op = s[j]
      if (op.type !== 'insert') x++
      if (op.type !== 'delete') y++
    }
    return `${x},${y},${s[i].type}`
  }
  const wanted = at(script, index)
  let found = 0
  for (const candidate of all) {
    for (let i = 0; i < candidate.length; i++) {
      if (at(candidate, i) === wanted) {
        found++
        break
      }
    }
  }
  return found
}

describe('per-operation contestedness', () => {
  for (const testCase of CASES) {
    const a = tokens(testCase.a)
    const b = tokens(testCase.b)

    it(`counts every minimal script that agrees — ${testCase.name}`, () => {
      const { count, truncated } = analyseAmbiguity(a, b)
      expect(truncated).toBe(false)

      const all = minimalScripts(a, b, count + 1)
      expect(all).toHaveLength(count)

      const { script } = diff(a, b, 'myers')
      const shares = sharesOfScript(a, b, script)
      expect(shares).not.toBeNull()
      if (shares === null) return

      expect(shares).toHaveLength(script.length)
      shares.forEach((share, index) => {
        expect(share.scripts, `op ${index} of ${testCase.name}`).toBe(
          countContaining(all, script, index),
        )
        expect(share.forced).toBe(share.scripts === count)
      })
    })

    it(`never claims more agreement than there are scripts — ${testCase.name}`, () => {
      const { count } = analyseAmbiguity(a, b)
      const { script } = diff(a, b, 'myers')
      for (const share of sharesOfScript(a, b, script) ?? []) {
        expect(share.scripts).toBeGreaterThan(0)
        expect(share.scripts).toBeLessThanOrEqual(count)
      }
    })
  }

  it('marks every operation forced when the shortest script is unique', () => {
    // A pure insertion has exactly one minimal script. A substitution does
    // not: 'abcde' → 'abXde' can delete then insert, or insert then delete,
    // which is the smallest example of the whole point of this module.
    const a = tokens('ac')
    const b = tokens('abc')
    expect(analyseAmbiguity(a, b).count).toBe(1)
    const { script } = diff(a, b, 'myers')
    for (const share of sharesOfScript(a, b, script) ?? []) expect(share.forced).toBe(true)
  })

  it('finds the contested operation in a substitution, and only that one', () => {
    const a = tokens('abcde')
    const b = tokens('abXde')
    expect(analyseAmbiguity(a, b).count).toBe(2)
    const { script } = diff(a, b, 'myers')
    const shares = sharesOfScript(a, b, script) ?? []

    // The four kept characters are in both scripts; the delete and the insert
    // sit either side of each other, so each is in one of the two.
    const contested = script.filter((_, index) => !shares[index].forced)
    expect(contested.map((op) => op.type).sort()).toEqual(['delete', 'insert'])
    expect(script.filter((op) => op.type === 'keep')).toHaveLength(4)
  })

  it('holds for an alternative script, not just the one Myers chose', () => {
    const a = tokens('abab')
    const b = tokens('baba')
    const { count } = analyseAmbiguity(a, b)
    const all = minimalScripts(a, b, count + 1)
    expect(all.length).toBeGreaterThan(1)

    for (const script of all) {
      const shares = sharesOfScript(a, b, script)
      expect(shares).not.toBeNull()
      shares?.forEach((share, index) => {
        expect(share.scripts).toBe(countContaining(all, script, index))
      })
    }
  })
})
