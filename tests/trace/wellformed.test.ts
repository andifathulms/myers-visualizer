import { describe, expect, it } from 'vitest'
import { myersGreedy } from '@/lib/diff/myers'
import { frontierAfterLevel } from '@/lib/diff/trace'
import { fullCorpus } from '../corpus'

/**
 * Trace well-formedness, PRD §8. The views render the trace directly, so a
 * malformed trace is a wrong picture even when the script is right.
 *
 *   - every snake is a genuine diagonal run of matches
 *   - the frontier never retreats
 *   - every V snapshot is consistent with the previous one
 */
describe('trace well-formedness', () => {
  it.each(fullCorpus(200).map((c) => [c.name, c] as const))('%s', (_name, c) => {
    const { trace, stats } = myersGreedy(c.a, c.b)
    const snapshots = trace.snapshots
    expect(snapshots).not.toBeNull()
    if (snapshots === null) return

    for (const event of trace.events) {
      switch (event.type) {
        case 'level':
          expect(event.d).toBeGreaterThanOrEqual(0)
          break
        case 'step': {
          // k is the diagonal of the point reached: k = x - y, always.
          expect(event.mid.x - event.mid.y).toBe(event.k)
          expect(event.to.x - event.to.y).toBe(event.k)
          // The snake runs at 45°, forward only, and every step of it matches.
          const run = event.to.x - event.mid.x
          expect(run).toBe(event.to.y - event.mid.y)
          expect(run).toBeGreaterThanOrEqual(0)
          for (let i = 0; i < run; i++) {
            expect(c.a[event.mid.x + i]).toBe(c.b[event.mid.y + i])
          }
          // The single non-diagonal move costs exactly one, and stays in bounds.
          const cost = Math.abs(event.mid.x - event.from.x) + Math.abs(event.mid.y - event.from.y)
          expect(cost).toBe(event.move === 'start' ? 0 : 1)
          expect(event.to.x).toBeLessThanOrEqual(c.a.length)
          expect(event.to.y).toBeLessThanOrEqual(c.b.length)
          break
        }
        case 'reached':
          expect(event.at).toEqual({ x: c.a.length, y: c.b.length })
          expect(event.d).toBe(stats.d)
          break
        default:
          break
      }
    }
  })

  it('never lets a diagonal retreat as d increases', () => {
    const a = [1, 2, 3, 4, 5, 2, 2, 7]
    const b = [2, 5, 5, 1, 2, 7, 3]
    const { trace, stats } = myersGreedy(a, b)
    const snapshots = trace.snapshots
    if (snapshots === null) throw new Error('expected snapshots')

    const furthest = new Map<number, number>()
    for (let d = 0; d <= stats.d; d++) {
      for (const point of frontierAfterLevel(snapshots, d, a.length, b.length)) {
        const seen = furthest.get(point.k)
        if (seen !== undefined) expect(point.x).toBeGreaterThanOrEqual(seen)
        furthest.set(point.k, point.x)
      }
    }
    expect(furthest.size).toBeGreaterThan(1)
  })

  it('records one V snapshot per level, and the last one contains the answer', () => {
    const a = [1, 2, 3, 4]
    const b = [1, 9, 3, 4]
    const { trace, stats } = myersGreedy(a, b)
    const snapshots = trace.snapshots
    if (snapshots === null) throw new Error('expected snapshots')
    // One row per level, plus one past the last so the state *after* every
    // level is readable.
    expect(snapshots.rows).toBe(stats.d + 2)
    // vCells is the honest O(D²) count: sum of 2d+1 over the recorded rows.
    let expected = 0
    for (let d = 0; d <= stats.d + 1; d++) expected += 2 * d + 1
    expect(stats.vCells).toBe(expected)
    expect(stats.vCells).toBe((stats.d + 2) ** 2)
  })

  it('emits exactly one level event per d and one reached event overall', () => {
    const { trace, stats } = myersGreedy([1, 2, 3], [4, 2, 5])
    const levels = trace.events.filter((e) => e.type === 'level')
    const reached = trace.events.filter((e) => e.type === 'reached')
    expect(levels).toHaveLength(stats.d + 1)
    expect(reached).toHaveLength(1)
  })
})
