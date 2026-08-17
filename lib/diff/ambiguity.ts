/**
 * How many shortest edit scripts are there, and what are the alternatives?
 *
 * A shortest edit script is usually not unique. Which of several equally
 * minimal scripts you see is decided by the algorithm's tie-breaking, not by
 * any judgement about which reads better — that is what explains the
 * misattributed closing brace. §6.4
 *
 * This is a DP over the edit graph, not a search: it shares no code with
 * myers.ts, so the count cannot inherit a bug from the thing it describes.
 */
import type { EditOp, EditScript, Edge, Token } from './types'

/** Counting stops here; the true count can be astronomically large. */
export const COUNT_CAP = 1_000_000

export type Ambiguity = {
  /** Minimal edit distance, computed independently of any search. */
  readonly d: number
  /** Number of distinct minimal scripts, saturating at COUNT_CAP. */
  readonly count: number
  /** True when the real count exceeds COUNT_CAP. */
  readonly truncated: boolean
}

type Tables = {
  readonly width: number
  readonly best: Int32Array
  readonly counts: Float64Array
}

function tables(a: readonly Token[], b: readonly Token[]): Tables {
  const n = a.length
  const m = b.length
  const width = n + 1
  const best = new Int32Array(width * (m + 1))
  const counts = new Float64Array(width * (m + 1))

  // Backwards from (N,M): best is the minimal remaining cost, counts the
  // number of minimal completions.
  for (let y = m; y >= 0; y--) {
    for (let x = n; x >= 0; x--) {
      const here = y * width + x
      if (x === n && y === m) {
        best[here] = 0
        counts[here] = 1
        continue
      }
      const diagonal = x < n && y < m && a[x] === b[y] ? best[(y + 1) * width + (x + 1)] : -1
      const right = x < n ? 1 + best[y * width + (x + 1)] : -1
      const down = y < m ? 1 + best[(y + 1) * width + x] : -1

      let value = Number.MAX_SAFE_INTEGER
      if (diagonal >= 0) value = Math.min(value, diagonal)
      if (right >= 0) value = Math.min(value, right)
      if (down >= 0) value = Math.min(value, down)
      best[here] = value

      let total = 0
      if (diagonal === value) total += counts[(y + 1) * width + (x + 1)]
      if (right === value) total += counts[y * width + (x + 1)]
      if (down === value) total += counts[(y + 1) * width + x]
      counts[here] = Math.min(total, COUNT_CAP + 1)
    }
  }
  return { width, best, counts }
}

/**
 * Prefix tables: the mirror of `tables`, counting minimal paths *into* a node
 * rather than out of it. Predecessors all lie at a smaller x or a smaller y,
 * so a single forward sweep is enough.
 */
function prefixTables(a: readonly Token[], b: readonly Token[]): Tables {
  const n = a.length
  const m = b.length
  const width = n + 1
  const best = new Int32Array(width * (m + 1))
  const counts = new Float64Array(width * (m + 1))

  for (let y = 0; y <= m; y++) {
    for (let x = 0; x <= n; x++) {
      const here = y * width + x
      if (x === 0 && y === 0) {
        best[here] = 0
        counts[here] = 1
        continue
      }
      const diagonal = x > 0 && y > 0 && a[x - 1] === b[y - 1] ? best[(y - 1) * width + (x - 1)] : -1
      const right = x > 0 ? 1 + best[y * width + (x - 1)] : -1
      const down = y > 0 ? 1 + best[(y - 1) * width + x] : -1

      let value = Number.MAX_SAFE_INTEGER
      if (diagonal >= 0) value = Math.min(value, diagonal)
      if (right >= 0) value = Math.min(value, right)
      if (down >= 0) value = Math.min(value, down)
      best[here] = value

      let total = 0
      if (diagonal === value) total += counts[(y - 1) * width + (x - 1)]
      if (right === value) total += counts[y * width + (x - 1)]
      if (down === value) total += counts[(y - 1) * width + x]
      counts[here] = Math.min(total, COUNT_CAP + 1)
    }
  }
  return { width, best, counts }
}

/**
 * How contested one operation is: the number of minimal scripts that attribute
 * the change exactly this way.
 */
export type OpShare = {
  /** Minimal scripts taking this edge. Never zero for an op of a minimal script. */
  readonly scripts: number
  /** True when every minimal script takes it — this part of the diff is not a choice. */
  readonly forced: boolean
}

/**
 * Per-operation contestedness for a minimal script. §6.4
 *
 * The ambiguity view says "there are twelve minimal scripts" and lets you page
 * through them; what it cannot say is *which lines they disagree about*. That
 * is the practically useful half, because ambiguity is local: most of a diff
 * is forced — every minimal script contains it — and the disagreement
 * concentrates on a handful of edges. The misattributed brace is one of them.
 *
 * The count for an edge u → v is (minimal paths into u) × (minimal paths out
 * of v), which is why this needs the prefix tables as well as the suffix ones.
 * It is a count over a set, not a probability: nothing here says one
 * attribution is likelier than another, only how many of the equally-minimal
 * answers agree with this one.
 *
 * Returns null when the total saturates `COUNT_CAP`. A share we cannot state
 * exactly is one we do not state — below the cap every count is an integer
 * well inside Float64's exact range, and so is every product, since the paths
 * through one edge are a subset of all of them.
 */
export function sharesOfScript(
  a: readonly Token[],
  b: readonly Token[],
  script: EditScript,
): readonly OpShare[] | null {
  const suffix = tables(a, b)
  const total = suffix.counts[0]
  if (total > COUNT_CAP) return null

  const prefix = prefixTables(a, b)
  const width = suffix.width
  const shares: OpShare[] = []

  let x = 0
  let y = 0
  for (const op of script) {
    const from = prefix.counts[y * width + x]
    if (op.type === 'keep') {
      x++
      y++
    } else if (op.type === 'delete') {
      x++
    } else {
      y++
    }
    const to = suffix.counts[y * width + x]
    const scripts = from * to
    shares.push({ scripts, forced: scripts === total })
  }
  return shares
}

/**
 * Every edge of the edit graph that lies on some minimal path but not on
 * every minimal path — the region DESIGN.md §4.1 calls "the contested
 * region". An edge u -> v is on a global minimal path exactly when
 * prefix.best[u] + cost(u, v) + suffix.best[v] equals the global D; among
 * those, it is contested when the minimal paths through it are a proper
 * subset of all minimal paths (from > 0 and through < total).
 *
 * This is a DP over the whole graph, not an enumeration of scripts, so its
 * cost is the same O(N·M) as `analyseAmbiguity` regardless of how many
 * minimal scripts actually exist — unlike `minimalScripts`, it stays cheap
 * even when the count is astronomical. Returns null under the same
 * condition `sharesOfScript` does: a total past `COUNT_CAP` cannot be
 * stated exactly, so nothing here is stated.
 */
export function contestedEdges(a: readonly Token[], b: readonly Token[]): readonly Edge[] | null {
  const n = a.length
  const m = b.length
  const suffix = tables(a, b)
  const total = suffix.counts[0]
  if (total > COUNT_CAP) return null

  const prefix = prefixTables(a, b)
  const width = suffix.width
  const d = suffix.best[0]
  const edges: Edge[] = []

  for (let y = 0; y <= m; y++) {
    for (let x = 0; x <= n; x++) {
      const here = y * width + x
      const from = prefix.counts[here]
      if (from === 0) continue
      const reached = prefix.best[here]

      if (x < n && y < m && a[x] === b[y]) {
        const v = (y + 1) * width + (x + 1)
        if (reached + suffix.best[v] === d) {
          const through = from * suffix.counts[v]
          if (through < total) edges.push({ x0: x, y0: y, x1: x + 1, y1: y + 1 })
        }
      }
      if (x < n) {
        const v = y * width + (x + 1)
        if (reached + 1 + suffix.best[v] === d) {
          const through = from * suffix.counts[v]
          if (through < total) edges.push({ x0: x, y0: y, x1: x + 1, y1: y })
        }
      }
      if (y < m) {
        const v = (y + 1) * width + x
        if (reached + 1 + suffix.best[v] === d) {
          const through = from * suffix.counts[v]
          if (through < total) edges.push({ x0: x, y0: y, x1: x, y1: y + 1 })
        }
      }
    }
  }
  return edges
}

export function analyseAmbiguity(a: readonly Token[], b: readonly Token[]): Ambiguity {
  const { counts, best } = tables(a, b)
  const total = counts[0]
  return {
    d: best[0],
    count: Math.min(total, COUNT_CAP),
    truncated: total > COUNT_CAP,
  }
}

/**
 * The first `limit` minimal scripts, in a fixed order: keep, then delete, then
 * insert. Deterministic, so "alternative 3" means the same thing every time
 * the page is opened.
 */
export function minimalScripts(
  a: readonly Token[],
  b: readonly Token[],
  limit = 8,
): EditScript[] {
  const n = a.length
  const m = b.length
  const { width, best } = tables(a, b)
  const scripts: EditScript[] = []
  const stack: EditOp[] = []

  const walk = (x: number, y: number): void => {
    if (scripts.length >= limit) return
    if (x === n && y === m) {
      scripts.push([...stack])
      return
    }
    const here = best[y * width + x]
    if (x < n && y < m && a[x] === b[y] && best[(y + 1) * width + (x + 1)] === here) {
      stack.push({ type: 'keep', aIndex: x, bIndex: y, token: a[x] })
      walk(x + 1, y + 1)
      stack.pop()
    }
    if (x < n && 1 + best[y * width + (x + 1)] === here) {
      stack.push({ type: 'delete', aIndex: x, token: a[x] })
      walk(x + 1, y)
      stack.pop()
    }
    if (y < m && 1 + best[(y + 1) * width + x] === here) {
      stack.push({ type: 'insert', bIndex: y, token: b[y] })
      walk(x, y + 1)
      stack.pop()
    }
  }
  walk(0, 0)
  return scripts
}
