/**
 * Greedy forward Myers with V recording.
 *
 * Myers, *An O(ND) Difference Algorithm and Its Variations*, §2, figure 2 —
 * "the greedy LCS/SES algorithm". Identifiers follow the paper: x, y, k, d, V,
 * snake, N, M. A reader should be able to hold the paper beside this file.
 *
 * Pure and deterministic: no clock, no randomness, no DOM, no module-level
 * mutable state. Same inputs, byte-identical output.
 */
import { backtrack } from './backtrack'
import {
  chooseFrom,
  createV,
  frontierAfterLevel,
  snakeOf,
  SnapshotRecorder,
  vGet,
  vSet,
  type SearchTrace,
  type TraceEvent,
} from './trace'
import {
  BudgetExceededError,
  DEFAULT_SEARCH_OPTIONS,
  type DiffStats,
  type EditScript,
  type Point,
  type SearchOptions,
  type Token,
} from './types'

export type MyersResult = {
  readonly script: EditScript
  readonly trace: SearchTrace
  readonly stats: DiffStats
}

export function myersGreedy(
  a: readonly Token[],
  b: readonly Token[],
  options: Partial<SearchOptions> = {},
): MyersResult {
  const { stepBudget, record } = { ...DEFAULT_SEARCH_OPTIONS, ...options }
  const n = a.length
  const m = b.length
  const max = n + m

  const v = createV(max)
  // The paper seeds V[1] = 0 so that d = 0, k = 0 reads it and starts at
  // (0,0) — §2. Here d = 0 is handled explicitly instead, which keeps every
  // *stored* V value a genuine in-lattice point and leaves untouched
  // diagonals at V_UNREACHED rather than at a value that reads as reachable.

  const recorder = new SnapshotRecorder(max, v.offset)
  const events: TraceEvent[] = []
  let work = 0
  let snakes = 0

  for (let d = 0; d <= max; d++) {
    recorder.record(d, v)
    if (record) events.push({ type: 'level', d, direction: 'forward' })

    for (let kRaw = -d; kRaw <= d; kRaw += 2) {
      // −0 at d = 0 is a real value in JS and leaks into the trace, where it
      // compares unequal to 0 under Object.is. Normalise once, here.
      const k = kRaw === 0 ? 0 : kRaw
      if (++work > stepBudget) throw new BudgetExceededError(stepBudget)

      // Diagonals that never meet the lattice carry no path.
      if (k > n || k < -m) continue

      let x: number
      let from: Point
      let move: 'right' | 'down' | 'start'

      if (d === 0) {
        x = 0
        from = { x: 0, y: 0 }
        move = 'start'
      } else {
        // Moving down (an insert) keeps x; moving right (a delete) advances it.
        const came = chooseFrom(vGet(v, k - 1), vGet(v, k + 1), k, n, m)
        if (came === 'none') continue // unreachable at this d; leave V[k] unset
        if (came === 'down') {
          x = vGet(v, k + 1)
          from = { x, y: x - (k + 1) }
          move = 'down'
        } else {
          x = vGet(v, k - 1) + 1
          from = { x: x - 1, y: x - 1 - (k - 1) }
          move = 'right'
        }
      }

      let y = x - k
      const mid: Point = { x, y }

      // The snake: extend greedily along the free diagonal. Matching runs
      // cost nothing, which is the whole reason the algorithm is fast.
      while (x < n && y < m && a[x] === b[y]) {
        x++
        y++
        if (++work > stepBudget) throw new BudgetExceededError(stepBudget)
      }

      vSet(v, k, x)
      const to: Point = { x, y }
      if (snakeOf(mid, to) !== null) snakes++
      if (record) events.push({ type: 'step', d, k, move, from, mid, to, direction: 'forward' })

      if (x >= n && y >= m) {
        if (record) events.push({ type: 'reached', d, at: { x: n, y: m } })
        // One row past the last level, so the views can read the state *after*
        // level d for every d — including this one.
        recorder.record(d + 1, v)
        const snapshots = recorder.finish()
        const script = backtrack(a, b, snapshots, d, n, m)
        const stats: DiffStats = {
          d,
          n,
          m,
          snakes,
          events: events.length,
          vCells: recorder.vCells,
          budgetExhausted: false,
        }
        return {
          script,
          stats,
          trace: { algorithm: 'myers', n, m, d, snapshots, events, stats },
        }
      }
    }
  }

  /* c8 ignore next 2 -- d = N + M always reaches (N,M): right and down alone suffice. */
  throw new Error('myers: search exhausted d = N + M without reaching (N,M)')
}

/** The V frontier after level d, for the strip and the lattice. §6.2 */
export function frontierOfTrace(trace: SearchTrace, d: number) {
  if (trace.snapshots === null) return []
  return frontierAfterLevel(trace.snapshots, Math.max(0, Math.min(d, trace.d)), trace.n, trace.m)
}
