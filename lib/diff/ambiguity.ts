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
import type { EditOp, EditScript, Token } from './types'

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
