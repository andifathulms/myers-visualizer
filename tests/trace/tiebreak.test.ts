import { describe, expect, it } from 'vitest'
import { diff } from '@/lib/diff'
import { snapshotGet, tiedAt } from '@/lib/diff/trace'
import { fullCorpus } from '../corpus'

/**
 * `tiedAt` reads a fact back out of the recorded V history instead of storing
 * it in the trace. That only holds if the reading agrees with what the search
 * actually did, so the corpus checks it against the recorded steps: when the
 * derivation says the step was tied, the engine must have taken the tie-break
 * branch, and both predecessors must genuinely have reached the same point.
 */
describe('the tie-break, read back from the snapshots', () => {
  const corpus = fullCorpus(120)

  it('agrees with what the search recorded, everywhere', () => {
    for (const testCase of corpus) {
      const { trace } = diff(testCase.a, testCase.b, 'myers')
      const snapshots = trace.snapshots
      expect(snapshots).not.toBeNull()
      if (snapshots === null) continue

      for (const event of trace.events) {
        if (event.type !== 'step' || event.d === 0) continue
        if (!tiedAt(snapshots, event.d, event.k, trace.n, trace.m)) continue

        // chooseFrom resolves a tie with `<`, which sends it down. If the
        // engine ever went right on a step this call reports as tied, one of
        // the two is wrong.
        expect(event.move, `${testCase.name} at d=${event.d} k=${event.k}`).toBe('down')

        // Both predecessors reach the same x on this diagonal — that is what
        // makes it a tie rather than a choice.
        const vLeft = snapshotGet(snapshots, event.d, event.k - 1)
        const vRight = snapshotGet(snapshots, event.d, event.k + 1)
        expect(vLeft + 1).toBe(vRight)
        expect(event.mid.x).toBe(vRight)
      }
    }
  })

  it('never reports a tie at d = 0, which has no predecessor', () => {
    for (const testCase of corpus.slice(0, 20)) {
      const { trace } = diff(testCase.a, testCase.b, 'myers')
      if (trace.snapshots === null) continue
      expect(tiedAt(trace.snapshots, 0, 0, trace.n, trace.m)).toBe(false)
    }
  })

  /*
   * The claim is worth nothing if it never fires. A substitution is the
   * smallest input that produces one: both ways round the two edits cost the
   * same, which is the whole subject of the ambiguity view.
   */
  it('fires on a substitution, the smallest input that has a tie', () => {
    const a = [...'abcde'].map((c) => c.charCodeAt(0))
    const b = [...'abXde'].map((c) => c.charCodeAt(0))
    const { trace } = diff(a, b, 'myers')
    expect(trace.snapshots).not.toBeNull()
    if (trace.snapshots === null) return

    const ties = trace.events.filter(
      (event) =>
        event.type === 'step' &&
        event.d > 0 &&
        trace.snapshots !== null &&
        tiedAt(trace.snapshots, event.d, event.k, trace.n, trace.m),
    )
    expect(ties.length).toBeGreaterThan(0)
  })

  it('finds no tie where the shortest script is unique', () => {
    const a = [...'ac'].map((c) => c.charCodeAt(0))
    const b = [...'abc'].map((c) => c.charCodeAt(0))
    const { trace } = diff(a, b, 'myers')
    if (trace.snapshots === null) return
    for (const event of trace.events) {
      if (event.type !== 'step') continue
      expect(tiedAt(trace.snapshots, event.d, event.k, trace.n, trace.m)).toBe(false)
    }
  })
})
