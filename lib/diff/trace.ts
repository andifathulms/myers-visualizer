/**
 * V storage and the recorded search.
 *
 * V is indexed by k = x - y, and k is negative for half its range, so the
 * array index is k + offset. That arithmetic lives here and nowhere else:
 * every read and write goes through vGet/vSet or snapshotGet. Inlining
 * `V[k + something]` at a call site is how every Myers implementation bleeds.
 * CLAUDE.md invariant 5, PRD §13.
 */
import type { AlgorithmId, DiffStats, Point, Region, Snake } from './types'

/** Sentinel for a diagonal not yet reached at this d. Real x values are ≥ 0. */
export const V_UNREACHED = -1

export type VArray = {
  /** index = k + offset. The one place this is written. */
  readonly offset: number
  readonly data: Int32Array
}

export function createV(maxD: number): VArray {
  const offset = maxD + 1
  return { offset, data: new Int32Array(2 * offset + 1).fill(V_UNREACHED) }
}

export function vGet(v: VArray, k: number): number {
  return v.data[k + v.offset]
}

export function vSet(v: VArray, k: number, x: number): void {
  v.data[k + v.offset] = x
}

/**
 * V for every d. Recording is not optional: the greedy forward pass alone
 * cannot recover the script, and the O(D²) cost is accepted and bounded by
 * the input cap. CLAUDE.md invariant 6.
 */
export type VSnapshots = {
  readonly offset: number
  /** Stride between rows: one row per recorded d. */
  readonly stride: number
  readonly rows: number
  readonly data: Int32Array
}

export function snapshotGet(s: VSnapshots, d: number, k: number): number {
  return s.data[d * s.stride + k + s.offset]
}

/**
 * The frontier *after* level d: the furthest-reaching point of every diagonal
 * reachable in exactly d edits, in increasing k.
 *
 * Two traps here. Row d holds V as it stood *before* level d ran, so the state
 * after level d is row d + 1 — which is why the recorder keeps one row past
 * the last level. And only diagonals with k ≡ d (mod 2) belong to level d; the
 * others still hold level d − 1 values. Reading row d, or reading every k,
 * yields a frontier that is quietly two levels stale.
 */
export function frontierAfterLevel(
  s: VSnapshots,
  d: number,
  n: number,
  m: number,
): { k: number; x: number; y: number }[] {
  const points: { k: number; x: number; y: number }[] = []
  const row = Math.min(d + 1, s.rows - 1)
  for (let kRaw = -d; kRaw <= d; kRaw += 2) {
    const k = kRaw === 0 ? 0 : kRaw
    if (k > n || k < -m) continue
    const x = snapshotGet(s, row, k)
    if (x === V_UNREACHED) continue
    const y = x - k
    if (x < 0 || y < 0 || x > n || y > m) continue
    points.push({ k, x, y })
  }
  return points
}

/**
 * Which neighbouring diagonal did this one come from?
 *
 * The paper's greedy tie-break — §2 — is "take the down move on the lower
 * boundary, or when the left neighbour has not reached as far". Expressed
 * against an explicitly-unreached sentinel, the boundary cases fall out of
 * reachability, and the lattice bounds get stated once: a right move needs a
 * real A[x] to delete, a down move a real B[y] to insert.
 *
 * The forward pass and the backtrack MUST agree here or the recovered script
 * describes a path the search never took — so they call this one function.
 * A mismatch survives symmetric inputs and fails on everything else.
 */
export type FromMove = 'down' | 'right' | 'none'

/** Which predecessors of (d, k) are in the lattice at all. */
export function optionsFrom(
  vLeft: number,
  vRight: number,
  k: number,
  n: number,
  m: number,
): { readonly rightOk: boolean; readonly downOk: boolean } {
  return {
    // Right = delete A[x]: needs x < n at the source, i.e. V[k-1] + 1 ≤ n.
    rightOk: vLeft !== V_UNREACHED && vLeft + 1 <= n,
    // Down = insert B[y]: keeps x, so the new y = V[k+1] − k must stay within m.
    downOk: vRight !== V_UNREACHED && vRight - k <= m,
  }
}

export function chooseFrom(
  vLeft: number,
  vRight: number,
  k: number,
  n: number,
  m: number,
): FromMove {
  const { rightOk, downOk } = optionsFrom(vLeft, vRight, k, n, m)
  if (!rightOk && !downOk) return 'none'
  if (!rightOk) return 'down'
  if (!downOk) return 'right'
  return vLeft < vRight ? 'down' : 'right'
}

/**
 * Was this step decided by a tie? §6.4
 *
 * Both predecessors of (d, k) land on the same diagonal: going down from
 * k + 1 arrives at x = V[k+1], going right from k − 1 arrives at
 * V[k-1] + 1. When those are equal the two are exactly as good, and
 * `chooseFrom` picks down — not because it reaches further, but because the
 * comparison is written `<` rather than `<=`. That single character is the
 * tie-break the whole site is about, and until now it was only ever described
 * in prose on the home page.
 *
 * Derived from the recorded snapshots rather than stored in the trace: the V
 * history is already kept for the backtrack, so the fact is there to be read
 * and the trace format owes it nothing.
 *
 * This describes *this* implementation. Another Myers, git's included, may
 * break the same tie the other way and return a different — equally minimal —
 * script. That is the point rather than a caveat.
 */
export function tiedAt(s: VSnapshots, d: number, k: number, n: number, m: number): boolean {
  if (d <= 0) return false
  // Row d holds V as it stood before level d ran — the predecessors' values.
  const vLeft = snapshotGet(s, d, k - 1)
  const vRight = snapshotGet(s, d, k + 1)
  const { rightOk, downOk } = optionsFrom(vLeft, vRight, k, n, m)
  return rightOk && downOk && vLeft + 1 === vRight
}

export class SnapshotRecorder {
  private readonly buffer: Int32Array
  private readonly stride: number
  private readonly offset: number
  private rows = 0
  /** Retained V cells — the number behind the O(D²) vs O(N+M) claim. §6.6 */
  private cells = 0

  constructor(maxD: number, offset: number) {
    this.offset = offset
    this.stride = 2 * offset + 1
    this.buffer = new Int32Array(this.stride * (maxD + 2)).fill(V_UNREACHED)
  }

  /**
   * Copy V as it stands *before* level d is processed. Backtrack reads exactly
   * this. One extra row is recorded after the last level, so that the state
   * *after* every level is also available to the views.
   */
  record(d: number, v: VArray): void {
    this.buffer.set(v.data, d * this.stride)
    this.rows = Math.max(this.rows, d + 1)
    this.cells += 2 * d + 1
  }

  get vCells(): number {
    return this.cells
  }

  finish(): VSnapshots {
    return {
      offset: this.offset,
      stride: this.stride,
      rows: this.rows,
      data: this.buffer.subarray(0, this.rows * this.stride),
    }
  }
}

/**
 * Trace events, discriminated on `type`. The views render these; they never
 * recompute anything.
 */
export type TraceEvent =
  | { readonly type: 'level'; readonly d: number; readonly direction: Direction }
  /**
   * One diagonal extended at this d: a single non-diagonal move from → mid,
   * then the free snake mid → to.
   */
  | {
      readonly type: 'step'
      readonly d: number
      readonly k: number
      readonly move: Move
      readonly from: Point
      readonly mid: Point
      readonly to: Point
      readonly direction: Direction
    }
  | { readonly type: 'reached'; readonly d: number; readonly at: Point }
  | {
      readonly type: 'middleSnake'
      readonly d: number
      readonly snake: Snake
      readonly region: Region
    }
  | { readonly type: 'recurse'; readonly region: Region; readonly depth: number }

export type Direction = 'forward' | 'backward'

/** 'start' is d = 0, where no non-diagonal move has happened yet. */
export type Move = 'right' | 'down' | 'start'

export type SearchTrace = {
  readonly algorithm: AlgorithmId
  readonly n: number
  readonly m: number
  readonly d: number
  /** Null for algorithms that do not maintain a V array — patience, histogram. */
  readonly snapshots: VSnapshots | null
  readonly events: readonly TraceEvent[]
  readonly stats: DiffStats
}

export function snakeOf(mid: Point, to: Point): Snake | null {
  if (to.x === mid.x && to.y === mid.y) return null
  return { x0: mid.x, y0: mid.y, x1: to.x, y1: to.y }
}
