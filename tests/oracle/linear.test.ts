import { describe, expect, it } from 'vitest'
import { myersLinear } from '@/lib/diff/linear'
import { myersGreedy } from '@/lib/diff/myers'
import { bruteMinimalD } from '@/lib/diff/brute'
import { checkApply, checkWellFormed } from '@/lib/diff/apply'
import { scriptLength } from '@/lib/diff/types'
import { fullCorpus, worstCase } from '../corpus'

/**
 * Greedy and linear-space must report the SAME D. They may return different
 * scripts — several minimal scripts routinely exist — so the assertion is on D
 * and on apply-correctness, never on script identity. Getting this assertion
 * wrong is itself a classic mistake: it fails on correct code.
 * PRD §8, CLAUDE.md invariant 4.
 */
describe('linear-space Myers', () => {
  const corpus = [...fullCorpus(400), worstCase(20), worstCase(50)]

  it.each(corpus.map((c) => [c.name, c] as const))('%s: same D, and it applies', (_name, c) => {
    const linear = myersLinear(c.a, c.b)
    const greedy = myersGreedy(c.a, c.b)

    expect(linear.stats.d).toBe(greedy.stats.d)
    expect(linear.stats.d).toBe(bruteMinimalD(c.a, c.b))
    expect(scriptLength(linear.script)).toBe(linear.stats.d)

    const applied = checkApply(c.a, c.b, linear.script)
    expect(applied.ok, applied.ok ? '' : applied.reason).toBe(true)
    const formed = checkWellFormed(c.a, c.b, linear.script)
    expect(formed.ok, formed.ok ? '' : formed.reason).toBe(true)
  })

  it('is allowed to disagree with greedy about which minimal script to return', () => {
    // Not a requirement that they differ — only that differing is not a bug.
    // This records that the suite tolerates it, on an input where it happens.
    let differs = 0
    for (const c of fullCorpus(200)) {
      const linear = JSON.stringify(myersLinear(c.a, c.b).script)
      const greedy = JSON.stringify(myersGreedy(c.a, c.b).script)
      if (linear !== greedy) differs++
      expect(myersLinear(c.a, c.b).stats.d).toBe(myersGreedy(c.a, c.b).stats.d)
    }
    expect(differs).toBeGreaterThan(0)
  })

  it('uses O(N+M) space, not O(D²) — the number on screen', () => {
    const { a, b } = worstCase(60)
    const linear = myersLinear(a, b)
    const greedy = myersGreedy(a, b)

    // D = 120 here, so greedy retains (D+2)² cells and linear a small multiple
    // of N+M. The gap is the entire point of the variant.
    expect(greedy.stats.vCells).toBe((greedy.stats.d + 2) ** 2)
    expect(linear.stats.vCells).toBeLessThan(greedy.stats.vCells / 4)
    expect(linear.stats.vCells).toBeLessThanOrEqual(6 * (a.length + b.length + 2))
  })

  it('records middle snakes and the recursion', () => {
    const a = [1, 2, 3, 4, 5, 2, 2, 7]
    const b = [2, 5, 5, 1, 2, 7, 3]
    const { trace } = myersLinear(a, b)
    const middles = trace.events.filter((e) => e.type === 'middleSnake')
    const recursions = trace.events.filter((e) => e.type === 'recurse')
    expect(middles.length).toBeGreaterThan(0)
    expect(recursions.length).toBeGreaterThan(0)

    for (const event of middles) {
      if (event.type !== 'middleSnake') continue
      // A middle snake is a genuine diagonal run of matches.
      const run = event.snake.x1 - event.snake.x0
      expect(run).toBe(event.snake.y1 - event.snake.y0)
      expect(run).toBeGreaterThanOrEqual(0)
      for (let i = 0; i < run; i++) {
        expect(a[event.snake.x0 + i]).toBe(b[event.snake.y0 + i])
      }
    }
  })

  it('runs both frontiers', () => {
    const { trace } = myersLinear([1, 2, 3, 4, 5, 6], [6, 5, 4, 3, 2, 1])
    const directions = new Set(
      trace.events.flatMap((e) => (e.type === 'step' ? [e.direction] : [])),
    )
    expect(directions.has('forward')).toBe(true)
    expect(directions.has('backward')).toBe(true)
  })

  it('is deterministic', () => {
    for (const c of fullCorpus(60)) {
      const once = JSON.stringify(myersLinear(c.a, c.b).script)
      expect(JSON.stringify(myersLinear(c.a, c.b).script), c.name).toBe(once)
    }
  })

  it('handles the edge shapes', () => {
    expect(myersLinear([], []).script).toEqual([])
    expect(myersLinear([], [1, 2]).stats.d).toBe(2)
    expect(myersLinear([1, 2], []).stats.d).toBe(2)
    expect(myersLinear([1, 2, 3], [1, 2, 3]).stats.d).toBe(0)
  })
})
