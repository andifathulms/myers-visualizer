import { describe, expect, it } from 'vitest'
import { WALKTHROUGH, WALKTHROUGH_D } from '@/data/walkthrough'
import { EXAMPLE } from '@/data/example'
import { tokenizePair } from '@/lib/tokenize'
import { diff } from '@/lib/diff'
import { snapshotGet } from '@/lib/diff/trace'
import { getDict } from '@/lib/i18n/dictionary'
import { LOCALES } from '@/lib/i18n/locales'

/**
 * The home page now writes a whole search out by hand — three levels of d,
 * every V value, the point reached at each. Hand-written numbers are a claim
 * about what this implementation does, and two preset claims on this site
 * were written before they were checked and were both false.
 *
 * So every value is held against what lib/diff actually returns for the same
 * input. Change the tokenizer, the tie-break or the example, and this fails
 * rather than the page quietly lying.
 */
const { a, b } = tokenizePair(EXAMPLE.en.a.join('\n'), EXAMPLE.en.b.join('\n'), {
  granularity: 'line',
  ignoreWhitespace: false,
  ignoreCase: false,
})
const result = diff(a.tokens, b.tokens, 'myers')

describe('the home page walkthrough', () => {
  it('arrives at the D the search actually finds', () => {
    expect(WALKTHROUGH_D).toBe(result.stats.d)
  })

  it('covers every level of the search and no more', () => {
    expect(WALKTHROUGH.map((level) => level.d)).toEqual(
      Array.from({ length: result.stats.d + 1 }, (_, d) => d),
    )
  })

  it('states the V that the search really recorded at each level', () => {
    const snapshots = result.trace.snapshots
    expect(snapshots).not.toBeNull()
    if (snapshots === null) return

    for (const level of WALKTHROUGH) {
      // Row d holds V before level d ran, so the state *after* it is row d + 1.
      const recorded: [number, number][] = []
      for (let k = -result.stats.d - 1; k <= result.stats.d + 1; k++) {
        const x = snapshotGet(snapshots, level.d + 1, k)
        if (x >= 0) recorded.push([k, x])
      }
      expect(level.v.map(([k, x]) => [k, x]), `V after d = ${level.d}`).toEqual(recorded)
    }
  })

  it('marks the level that reaches (N, M), and only that one', () => {
    const done = WALKTHROUGH.filter((level) => level.done)
    expect(done).toHaveLength(1)
    expect(done[0].d).toBe(result.stats.d)
    expect(done[0].reached).toEqual([a.tokens.length, b.tokens.length])
  })

  it('has one sentence per level, in both locales', () => {
    for (const locale of LOCALES) {
      expect(getDict(locale).home.walkSteps).toHaveLength(WALKTHROUGH.length)
    }
  })

  /*
   * The closing claim: at the last level, k = 0 could have been reached from
   * either side for the same cost. That is the tie the whole site is about,
   * and the page asserts it in prose — so it is asserted here too.
   */
  it('is right that the last level turns on a tie', () => {
    const snapshots = result.trace.snapshots
    if (snapshots === null) return
    const d = result.stats.d
    // Predecessors of (d, k = 0) are read from the row as it stood before d.
    const fromRight = snapshotGet(snapshots, d, -1) + 1
    const fromDown = snapshotGet(snapshots, d, 1)
    expect(fromRight).toBe(3)
    expect(fromDown).toBe(3)
    expect(fromRight).toBe(fromDown)
  })
})
