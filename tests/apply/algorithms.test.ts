import { describe, expect, it } from 'vitest'
import { diff } from '@/lib/diff'
import { checkApply, checkWellFormed } from '@/lib/diff/apply'
import { ALGORITHMS, isMinimal, scriptLength, type AlgorithmId } from '@/lib/diff/types'
import { fullCorpus, worstCase } from '../corpus'

const IMPLEMENTED: AlgorithmId[] = ['myers', 'patience', 'histogram']

/**
 * Every algorithm, every input, every option → the apply property must hold.
 * No exceptions and no skips. This is the assertion that a new algorithm has
 * to pass before it is allowed to exist.
 */
describe('apply property — every algorithm', () => {
  const corpus = [...fullCorpus(250), worstCase(20), worstCase(40)]

  for (const algorithm of IMPLEMENTED) {
    describe(algorithm, () => {
      it.each(corpus.map((c) => [c.name, c] as const))('%s', (_name, c) => {
        const { script, stats } = diff(c.a, c.b, algorithm)
        const applied = checkApply(c.a, c.b, script)
        expect(applied.ok, applied.ok ? '' : applied.reason).toBe(true)
        const formed = checkWellFormed(c.a, c.b, script)
        expect(formed.ok, formed.ok ? '' : formed.reason).toBe(true)
        expect(scriptLength(script)).toBe(stats.d)
      })
    })
  }
})

/**
 * Patience and histogram are NOT minimal-edit algorithms, and the suite must
 * never assume they are. The correct assertion is an ordering: Myers is
 * minimal, so nothing can beat it. A violation means the Myers implementation
 * is wrong. PRD §8, CLAUDE.md invariant 8.
 */
describe('minimality ordering', () => {
  it.each(fullCorpus(300).map((c) => [c.name, c] as const))('%s', (_name, c) => {
    const myers = diff(c.a, c.b, 'myers').stats.d
    expect(diff(c.a, c.b, 'patience').stats.d).toBeGreaterThanOrEqual(myers)
    expect(diff(c.a, c.b, 'histogram').stats.d).toBeGreaterThanOrEqual(myers)
  })

  it('is genuinely longer sometimes — a strict inequality really does occur', () => {
    // If the ordering were always an equality, the assertion above would be
    // vacuous and a broken patience would still pass it. From the corpus:
    const a = [1, 2, 2, 0]
    const b = [2, 2, 0, 1, 0]
    expect(diff(a, b, 'myers').stats.d).toBe(3)
    expect(diff(a, b, 'patience').stats.d).toBe(5)

    const c = [1, 2, 3, 1, 2, 2, 1] // the paper's ABCABBA → CBABAC
    const d = [3, 2, 1, 2, 1, 3]
    expect(diff(c, d, 'myers').stats.d).toBe(5)
    expect(diff(c, d, 'histogram').stats.d).toBe(7)
  })

  it('marks only the Myers family as minimal', () => {
    expect(ALGORITHMS.filter(isMinimal)).toEqual(['myers', 'myers-linear'])
  })
})

describe('determinism — every algorithm', () => {
  it.each(IMPLEMENTED.map((a) => [a] as const))('%s is byte-identical', (algorithm) => {
    for (const c of fullCorpus(60)) {
      const once = JSON.stringify(diff(c.a, c.b, algorithm).script)
      const twice = JSON.stringify(diff(c.a, c.b, algorithm).script)
      expect(twice, c.name).toBe(once)
    }
  })
})

describe('trace shape — every algorithm', () => {
  it.each(IMPLEMENTED.map((a) => [a] as const))('%s emits a well-formed trace', (algorithm) => {
    for (const c of fullCorpus(60)) {
      const { trace, stats } = diff(c.a, c.b, algorithm)
      expect(trace.algorithm).toBe(algorithm)
      expect(trace.d).toBe(stats.d)
      for (const event of trace.events) {
        if (event.type !== 'step') continue
        // Same invariants as Myers: k = x − y, a move costs one, a snake is a
        // genuine run of matches.
        expect(event.mid.x - event.mid.y).toBe(event.k)
        const cost = Math.abs(event.mid.x - event.from.x) + Math.abs(event.mid.y - event.from.y)
        expect(cost).toBe(event.move === 'start' ? 0 : 1)
        const run = event.to.x - event.mid.x
        expect(run).toBe(event.to.y - event.mid.y)
        for (let i = 0; i < run; i++) {
          expect(c.a[event.mid.x + i]).toBe(c.b[event.mid.y + i])
        }
      }
      const reached = trace.events.filter((e) => e.type === 'reached')
      expect(reached).toHaveLength(1)
    }
  })

  it('reports no retained V cells for the non-Myers algorithms', () => {
    // They keep no V array, and claiming otherwise would make the memory
    // counter meaningless.
    expect(diff([1, 2], [2, 3], 'patience').stats.vCells).toBe(0)
    expect(diff([1, 2], [2, 3], 'histogram').stats.vCells).toBe(0)
    expect(diff([1, 2], [2, 3], 'myers').stats.vCells).toBeGreaterThan(0)
  })
})
