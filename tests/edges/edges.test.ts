import { describe, expect, it } from 'vitest'
import { myersGreedy } from '@/lib/diff/myers'
import { checkApply } from '@/lib/diff/apply'
import { frontierAfterLevel, V_UNREACHED, snapshotGet } from '@/lib/diff/trace'

/**
 * Mandatory and permanent fixtures. These are where the V offset, the empty
 * script and the boundary conditions go wrong — and where a bug still looks
 * plausible on symmetric input.
 */
describe('edge fixtures', () => {
  it('both empty: D = 0 and the script is empty', () => {
    const { script, stats } = myersGreedy([], [])
    expect(stats.d).toBe(0)
    expect(script).toEqual([])
    expect(checkApply([], [], script).ok).toBe(true)
  })

  it('empty A: every op is an insert', () => {
    const b = [1, 2, 3]
    const { script, stats } = myersGreedy([], b)
    expect(stats.d).toBe(3)
    expect(script.map((op) => op.type)).toEqual(['insert', 'insert', 'insert'])
    expect(checkApply([], b, script).ok).toBe(true)
  })

  it('empty B: every op is a delete', () => {
    const a = [1, 2, 3]
    const { script, stats } = myersGreedy(a, [])
    expect(stats.d).toBe(3)
    expect(script.map((op) => op.type)).toEqual(['delete', 'delete', 'delete'])
    expect(checkApply(a, [], script).ok).toBe(true)
  })

  it('identical: D = 0, one snake, no edits', () => {
    const a = [4, 5, 6]
    const { script, stats } = myersGreedy(a, a)
    expect(stats.d).toBe(0)
    expect(stats.snakes).toBe(1)
    expect(script.map((op) => op.type)).toEqual(['keep', 'keep', 'keep'])
  })

  it('fully disjoint: D = N + M and no keeps', () => {
    const a = [1, 2, 3]
    const b = [4, 5, 6]
    const { script, stats } = myersGreedy(a, b)
    expect(stats.d).toBe(6)
    expect(script.some((op) => op.type === 'keep')).toBe(false)
    expect(checkApply(a, b, script).ok).toBe(true)
  })

  it('single elements, equal and unequal', () => {
    expect(myersGreedy([7], [7]).stats.d).toBe(0)
    expect(myersGreedy([7], [8]).stats.d).toBe(2)
  })

  it('heavily repeated elements', () => {
    const a = [1, 1, 1, 1, 1, 1]
    const b = [1, 1, 1]
    const { script, stats } = myersGreedy(a, b)
    expect(stats.d).toBe(3)
    expect(checkApply(a, b, script).ok).toBe(true)
  })
})

describe('negative k — the offset', () => {
  it('records diagonals on both sides of zero', () => {
    // B longer than A drives the search onto negative k, where an offset bug
    // reads the wrong cell and still produces a plausible script.
    const a = [1]
    const b = [2, 3, 4, 5]
    const { trace, stats } = myersGreedy(a, b)
    expect(stats.d).toBe(5)
    const snapshots = trace.snapshots
    expect(snapshots).not.toBeNull()
    if (snapshots === null) return

    const ks = frontierAfterLevel(snapshots, stats.d, 1, 4).map((p) => p.k)
    expect(ks.some((k) => k < 0)).toBe(true)
    expect(ks).toEqual([...ks].sort((p, q) => p - q))
  })

  it('is symmetric under swapping A and B', () => {
    const a = [1, 2, 3, 4, 5]
    const b = [3, 4]
    // D is symmetric; the scripts are mirror images, so only D is asserted.
    expect(myersGreedy(a, b).stats.d).toBe(myersGreedy(b, a).stats.d)
  })

  it('leaves unreached diagonals at the sentinel rather than at zero', () => {
    const { trace } = myersGreedy([1, 2, 3], [1, 2, 3])
    const snapshots = trace.snapshots
    expect(snapshots).not.toBeNull()
    if (snapshots === null) return
    // At d = 0 only k = 0 (seeded via V[1]) has been touched.
    expect(snapshotGet(snapshots, 0, 5)).toBe(V_UNREACHED)
  })
})
