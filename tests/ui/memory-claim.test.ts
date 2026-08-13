import { describe, expect, it } from 'vitest'
import { diff } from '@/lib/diff'
import { fullCorpus, EDGE_CASES } from '../corpus'

/**
 * The stats panel now states the arithmetic behind "V cells stored": one row
 * per level, row d being 2d+1 wide, summing to (D+2)² — the O(D²) the paper
 * quotes, shown as a square rather than asserted.
 *
 * That is a claim about the recorder, not a description of the panel, so it is
 * checked against the engine. If the recording strategy ever changes, this
 * fails and the sentence comes down with it.
 *
 * Greedy Myers only. The linear-space variant exists precisely to avoid
 * recording this way, which is why the panel does not print the identity for
 * it — and why the ordering below is asserted rather than assumed.
 */
describe('the O(D²) recording claim', () => {
  it('holds for greedy Myers across the corpus', () => {
    for (const testCase of [...EDGE_CASES, ...fullCorpus(200)]) {
      const { stats } = diff(testCase.a, testCase.b, 'myers')
      expect(stats.vCells, `${testCase.name} at D = ${stats.d}`).toBe((stats.d + 2) ** 2)
    }
  })

  it('is a claim the linear-space variant does not make', () => {
    // Somewhere with a D large enough for the asymptotics to have taken hold.
    const a = Array.from({ length: 60 }, (_, i) => i)
    const b = Array.from({ length: 60 }, (_, i) => i + 1000)
    const greedy = diff(a, b, 'myers')
    const linear = diff(a, b, 'myers-linear')

    expect(greedy.stats.d).toBe(linear.stats.d)
    expect(greedy.stats.vCells).toBe((greedy.stats.d + 2) ** 2)
    // Not the same shape at all — hence no identity printed beside its number.
    expect(linear.stats.vCells).not.toBe((linear.stats.d + 2) ** 2)
    expect(linear.stats.vCells).toBeLessThan(greedy.stats.vCells)
  })
})
