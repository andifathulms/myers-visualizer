import { describe, expect, it } from 'vitest'
import { analyseAmbiguity, minimalScripts, COUNT_CAP } from '@/lib/diff/ambiguity'
import { bruteMinimalD, bruteMinimalScripts } from '@/lib/diff/brute'
import { myersGreedy } from '@/lib/diff/myers'
import { checkApply } from '@/lib/diff/apply'
import { scriptLength } from '@/lib/diff/types'
import { fullCorpus } from '../corpus'

const key = (script: readonly { type: string; aIndex?: number; bIndex?: number }[]) =>
  script.map((op) => `${op.type}:${op.aIndex ?? ''}:${op.bIndex ?? ''}`).join('|')

describe('ambiguity', () => {
  it('agrees with the oracle on D across the corpus', () => {
    for (const c of fullCorpus(200)) {
      expect(analyseAmbiguity(c.a, c.b).d, c.name).toBe(bruteMinimalD(c.a, c.b))
    }
  })

  it('counts exactly what the oracle enumerates, on small inputs', () => {
    for (const c of fullCorpus(120)) {
      const enumerated = bruteMinimalScripts(c.a, c.b, 5000)
      if (enumerated.truncated) continue
      expect(analyseAmbiguity(c.a, c.b).count, c.name).toBe(enumerated.count)
    }
  })

  it('reports a unique script when there is only one', () => {
    // Nothing in common and only one ordering of the moves is minimal? No —
    // an insert/delete pair can interleave, so use an input with a forced path.
    expect(analyseAmbiguity([1, 2, 3], [1, 2, 3]).count).toBe(1)
    expect(analyseAmbiguity([], [1, 2]).count).toBe(1)
    expect(analyseAmbiguity([1, 2], []).count).toBe(1)
  })

  it('finds the two ways to delete one of a repeated pair', () => {
    const result = analyseAmbiguity([1, 1], [1])
    expect(result.d).toBe(1)
    expect(result.count).toBe(2)
  })

  it('returns scripts that all apply and all share one D', () => {
    for (const c of fullCorpus(80)) {
      const scripts = minimalScripts(c.a, c.b, 6)
      expect(scripts.length, c.name).toBeGreaterThan(0)
      const d = analyseAmbiguity(c.a, c.b).d
      for (const script of scripts) {
        expect(checkApply(c.a, c.b, script).ok, c.name).toBe(true)
        expect(scriptLength(script), c.name).toBe(d)
      }
    }
  })

  it('returns distinct scripts, never the same one twice', () => {
    const scripts = minimalScripts([1, 1, 1], [1], 10)
    expect(new Set(scripts.map(key)).size).toBe(scripts.length)
  })

  /**
   * The script Myers returns must be one of the minimal scripts — a different
   * one is allowed, a non-minimal or non-existent one is not. This is the
   * assertion that ties the ambiguity view to the thing it is describing.
   */
  it('contains the script Myers actually chose', () => {
    for (const c of fullCorpus(120)) {
      const all = bruteMinimalScripts(c.a, c.b, 4000)
      if (all.truncated) continue
      const chosen = key(myersGreedy(c.a, c.b).script)
      expect(all.scripts.map(key), c.name).toContain(chosen)
    }
  })

  it('saturates rather than overflowing on a pathologically ambiguous input', () => {
    // Twenty identical elements against ten: the number of minimal scripts is
    // C(20,10) = 184 756 — countable. Push further and it must saturate.
    const many = analyseAmbiguity(new Array(20).fill(1), new Array(10).fill(1))
    expect(many.count).toBe(184_756)
    expect(many.truncated).toBe(false)

    const huge = analyseAmbiguity(new Array(80).fill(1), new Array(40).fill(1))
    expect(huge.count).toBe(COUNT_CAP)
    expect(huge.truncated).toBe(true)
    expect(Number.isFinite(huge.count)).toBe(true)
  })
})
