import { describe, expect, it } from 'vitest'
import { myersGreedy } from '@/lib/diff/myers'
import { checkApply, checkWellFormed } from '@/lib/diff/apply'
import { pathOf } from '@/lib/diff/backtrack'
import { scriptLength } from '@/lib/diff/types'
import { fullCorpus, worstCase } from '../corpus'

/**
 * The backbone. Every algorithm, every input, every option → the script must
 * apply. No exceptions and no skips.
 */
describe('apply property — myers greedy', () => {
  const corpus = [...fullCorpus(400), worstCase(30), worstCase(60)]

  it.each(corpus.map((c) => [c.name, c] as const))('%s', (_name, c) => {
    const { script, stats } = myersGreedy(c.a, c.b)

    const applied = checkApply(c.a, c.b, script)
    expect(applied.ok, applied.ok ? '' : `apply failed: ${applied.reason}`).toBe(true)

    const formed = checkWellFormed(c.a, c.b, script)
    expect(formed.ok, formed.ok ? '' : `malformed: ${formed.reason}`).toBe(true)

    // D is the count of non-diagonal moves, and the script must agree with it.
    expect(scriptLength(script)).toBe(stats.d)

    // The path is a real walk of the lattice from corner to corner.
    const path = pathOf(script)
    expect(path[0]).toEqual({ x: 0, y: 0 })
    expect(path[path.length - 1]).toEqual({ x: c.a.length, y: c.b.length })
  })
})
