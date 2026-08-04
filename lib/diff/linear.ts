/**
 * Linear-space Myers — the paper's §4b refinement, and the version real tools
 * use.
 *
 * Storing V for every d costs O(D²). Instead, run the search forward from
 * (0,0) and backward from (N,M) at the same time; the moment the two frontiers
 * overlap, the snake where they meet is on *some* shortest path. Recurse on
 * the two halves either side of it. Only two V arrays are ever live, so the
 * space is O(N+M) — and the same D comes out.
 *
 * It reports the same D as the greedy version, but it may return a *different*
 * minimal script. Several minimal scripts routinely exist, so asserting script
 * identity between the two is a mistake that looks correct. Assert on D and on
 * the apply property. PRD §8, CLAUDE.md invariant 4.
 */
import { traceFromScript } from './from-script'
import { createV, vGet, vSet, type Direction, type SearchTrace, type TraceEvent } from './trace'
import {
  BudgetExceededError,
  DEFAULT_SEARCH_OPTIONS,
  type DiffStats,
  type EditOp,
  type EditScript,
  type Point,
  type Region,
  type SearchOptions,
  type Snake,
  type Token,
} from './types'

export type LinearResult = {
  readonly script: EditScript
  readonly trace: SearchTrace
  readonly stats: DiffStats
}

type Found = {
  readonly start: Point
  readonly finish: Point
  /**
   * D for this box, recovered from where the overlap was detected: an odd
   * delta is caught by the forward pass at D = 2d − 1, an even one by the
   * backward pass at D = 2d.
   */
  readonly d: number
}

export function myersLinear(
  a: readonly Token[],
  b: readonly Token[],
  options: Partial<SearchOptions> = {},
): LinearResult {
  const { stepBudget } = { ...DEFAULT_SEARCH_OPTIONS, ...options }
  const ops: EditOp[] = []
  const events: TraceEvent[] = []
  const counter = { work: 0, liveCells: 0 }

  walk(
    a,
    b,
    { left: 0, top: 0, right: a.length, bottom: b.length },
    ops,
    events,
    counter,
    stepBudget,
    0,
  )

  const script: EditScript = ops
  // Unlike patience and histogram, this one really does search, and the search
  // is the thing worth watching: two frontiers converging, the middle snake
  // flaring where they meet, then the recursion. So the trace carries the
  // search's own events rather than steps re-derived from the script. §6.6
  const derived = traceFromScript('myers-linear', a, b, script)
  const merged: TraceEvent[] = [
    ...events,
    { type: 'reached', d: derived.stats.d, at: { x: a.length, y: b.length } },
  ]

  const stats: DiffStats = {
    ...derived.stats,
    // The number that makes O(D²) versus O(N+M) concrete: at most two V arrays
    // are live at any moment, regardless of D.
    vCells: counter.liveCells,
  }
  return {
    script,
    stats,
    trace: { ...derived.trace, algorithm: 'myers-linear', events: merged, stats },
  }
}

function walk(
  a: readonly Token[],
  b: readonly Token[],
  box: Region,
  out: EditOp[],
  events: TraceEvent[],
  counter: { work: number; liveCells: number },
  budget: number,
  depth: number,
): void {
  const width = box.right - box.left
  const height = box.bottom - box.top
  if (width <= 0 && height <= 0) return

  // A box with no width or no height has only one path through it.
  if (width === 0) {
    for (let y = box.top; y < box.bottom; y++) out.push({ type: 'insert', bIndex: y, token: b[y] })
    return
  }
  if (height === 0) {
    for (let x = box.left; x < box.right; x++) out.push({ type: 'delete', aIndex: x, token: a[x] })
    return
  }

  events.push({ type: 'recurse', region: box, depth })

  const found = middleSnake(a, b, box, events, counter, budget)
  if (found === null || found.d <= 1) {
    // The paper's base case, §4b: below D = 2 the middle snake cannot split
    // the box — the forward pass consumes all of it — so the recursion would
    // never shrink. At D ≤ 1 the two sides differ by at most one element and
    // the script is written down directly.
    trivial(a, b, box, out)
    return
  }

  walk(
    a,
    b,
    { left: box.left, top: box.top, right: found.start.x, bottom: found.start.y },
    out,
    events,
    counter,
    budget,
    depth + 1,
  )
  for (let i = 0; i < found.finish.x - found.start.x; i++) {
    out.push({
      type: 'keep',
      aIndex: found.start.x + i,
      bIndex: found.start.y + i,
      token: a[found.start.x + i],
    })
  }
  walk(
    a,
    b,
    { left: found.finish.x, top: found.finish.y, right: box.right, bottom: box.bottom },
    out,
    events,
    counter,
    budget,
    depth + 1,
  )
}

/**
 * A box needing at most one edit. The two sides then agree except for a single
 * inserted or deleted element, so the script is the common prefix, that one
 * edit, and the rest — no search required.
 */
function trivial(a: readonly Token[], b: readonly Token[], box: Region, out: EditOp[]): void {
  const width = box.right - box.left
  const height = box.bottom - box.top
  const common = Math.min(width, height)

  let i = 0
  while (i < common && a[box.left + i] === b[box.top + i]) i++
  for (let j = 0; j < i; j++) {
    out.push({ type: 'keep', aIndex: box.left + j, bIndex: box.top + j, token: a[box.left + j] })
  }

  if (width === height + 1) {
    out.push({ type: 'delete', aIndex: box.left + i, token: a[box.left + i] })
    for (let j = i; j < height; j++) {
      out.push({
        type: 'keep',
        aIndex: box.left + j + 1,
        bIndex: box.top + j,
        token: a[box.left + j + 1],
      })
    }
    return
  }
  if (height === width + 1) {
    out.push({ type: 'insert', bIndex: box.top + i, token: b[box.top + i] })
    for (let j = i; j < width; j++) {
      out.push({
        type: 'keep',
        aIndex: box.left + j,
        bIndex: box.top + j + 1,
        token: a[box.left + j],
      })
    }
    return
  }
  if (width === height) {
    for (let j = i; j < width; j++) {
      out.push({ type: 'keep', aIndex: box.left + j, bIndex: box.top + j, token: a[box.left + j] })
    }
    return
  }

  /* c8 ignore next 3 -- D ≤ 1 forces |width − height| ≤ 1; this is a guard. */
  for (let x = box.left + i; x < box.right; x++) out.push({ type: 'delete', aIndex: x, token: a[x] })
  for (let y = box.top + i; y < box.bottom; y++) out.push({ type: 'insert', bIndex: y, token: b[y] })
}

/**
 * The middle snake: run both frontiers until they overlap. §4b.
 *
 * Forward diagonals are k = x − y measured from the box's top-left; backward
 * diagonals are c = k − delta, measured from the bottom-right. When delta is
 * odd the forward pass can detect the overlap; when it is even, the backward
 * pass can. That parity rule is the whole trick, and getting it inverted
 * yields an algorithm that works only on half its inputs.
 */
function middleSnake(
  a: readonly Token[],
  b: readonly Token[],
  box: Region,
  events: TraceEvent[],
  counter: { work: number; liveCells: number },
  budget: number,
): Found | null {
  const width = box.right - box.left
  const height = box.bottom - box.top
  const delta = width - height
  const max = Math.ceil((width + height) / 2)
  const odd = Math.abs(delta) % 2 === 1

  // Two V arrays, live at once. This is the entire memory cost. The index
  // range must cover both k and c = k − delta, hence the widened offset.
  const vf = createV(2 * max + Math.abs(delta) + 2)
  const vr = createV(2 * max + Math.abs(delta) + 2)
  // Two arrays of 2·max+1 diagonals, live at once — counted the same way as
  // the greedy version's snapshots so the two numbers can be compared. The
  // allocation is wider than this only so that k and c share one index space.
  counter.liveCells = Math.max(counter.liveCells, 2 * (2 * max + 1))
  // Seeds mirroring the paper's V[1] = 0: the forward search starts at the
  // box's top-left and tracks x, the backward search at its bottom-right and
  // tracks y.
  vSet(vf, 1, box.left)
  vSet(vr, 1, box.bottom)

  for (let d = 0; d <= max; d++) {
    events.push({ type: 'level', d, direction: 'forward' })
    const forward = forwards(a, b, box, vf, vr, d, delta, odd, events, counter, budget)
    if (forward !== null) return forward

    events.push({ type: 'level', d, direction: 'backward' })
    const backward = backwards(a, b, box, vf, vr, d, delta, odd, events, counter, budget)
    if (backward !== null) return backward
  }
  return null
}

function forwards(
  a: readonly Token[],
  b: readonly Token[],
  box: Region,
  vf: ReturnType<typeof createV>,
  vr: ReturnType<typeof createV>,
  d: number,
  delta: number,
  odd: boolean,
  events: TraceEvent[],
  counter: { work: number; liveCells: number },
  budget: number,
): Found | null {
  for (let k = d; k >= -d; k -= 2) {
    if (++counter.work > budget) throw new BudgetExceededError(budget)
    const c = k - delta

    let x: number
    if (k === -d || (k !== d && vGet(vf, k - 1) < vGet(vf, k + 1))) {
      x = vGet(vf, k + 1)
    } else {
      x = vGet(vf, k - 1) + 1
    }
    let y = box.top + (x - box.left) - k

    const startX = x
    const startY = y
    while (x < box.right && y < box.bottom && a[x] === b[y]) {
      x++
      y++
      if (++counter.work > budget) throw new BudgetExceededError(budget)
    }
    vSet(vf, k, x)
    // Reported on the absolute diagonal of the lattice, so the views can treat
    // every algorithm's steps alike: k = x − y, always.
    pushStep(events, d, { x: startX, y: startY }, { x, y }, 'forward')

    // Overlap: the backward frontier on this diagonal has already come back
    // at least this far. vr holds y, so the comparison is against y.
    if (odd && c >= -(d - 1) && c <= d - 1 && vGet(vr, c) <= y) {
      const snake: Snake = { x0: startX, y0: startY, x1: x, y1: y }
      events.push({ type: 'middleSnake', d, snake, region: box })
      return { start: { x: startX, y: startY }, finish: { x, y }, d: 2 * d - 1 }
    }
  }
  return null
}

function backwards(
  a: readonly Token[],
  b: readonly Token[],
  box: Region,
  vf: ReturnType<typeof createV>,
  vr: ReturnType<typeof createV>,
  d: number,
  delta: number,
  odd: boolean,
  events: TraceEvent[],
  counter: { work: number; liveCells: number },
  budget: number,
): Found | null {
  for (let c = d; c >= -d; c -= 2) {
    if (++counter.work > budget) throw new BudgetExceededError(budget)
    const k = c + delta

    // vr is indexed by c and holds y — the mirror of vf, which is indexed by k
    // and holds x. Storing x in both is the natural-looking mistake, and it
    // yields boxes that never shrink and a recursion that never ends.
    // Mirror of the forward tie-break. Forward wants the largest x; backward
    // wants the smallest y, so the comparison flips. Coming from c+1 keeps y
    // and steps x back; coming from c−1 steps y back and keeps x.
    let y: number
    if (c === -d || (c !== d && vGet(vr, c + 1) < vGet(vr, c - 1))) {
      y = vGet(vr, c + 1)
    } else {
      y = vGet(vr, c - 1) - 1
    }
    // k = (x − left) − (y − top), so recovering x from y adds k. Subtracting
    // it puts the backward frontier on the wrong diagonal entirely, which
    // shows up as boxes that never shrink.
    let x = box.left + (y - box.top) + k

    const startX = x
    const startY = y
    while (x > box.left && y > box.top && a[x - 1] === b[y - 1]) {
      x--
      y--
      if (++counter.work > budget) throw new BudgetExceededError(budget)
    }
    vSet(vr, c, y)
    // Oriented top-left → bottom-right like every other snake, even though the
    // search walked it the other way.
    pushStep(events, d, { x, y }, { x: startX, y: startY }, 'backward')

    if (!odd && k >= -d && k <= d && vGet(vf, k) >= x) {
      const snake: Snake = { x0: x, y0: y, x1: startX, y1: startY }
      events.push({ type: 'middleSnake', d, snake, region: box })
      return { start: { x, y }, finish: { x: startX, y: startY }, d: 2 * d }
    }
  }
  return null
}

function pushStep(
  events: TraceEvent[],
  d: number,
  mid: Point,
  to: Point,
  direction: Direction,
): void {
  const k = mid.x - mid.y
  events.push({
    type: 'step',
    d,
    k: k === 0 ? 0 : k,
    // These algorithms report the snake, not the single move that preceded it.
    move: 'start',
    from: mid,
    mid,
    to,
    direction,
  })
}
