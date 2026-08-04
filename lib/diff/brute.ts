/**
 * Brute-force oracle. Tests only — never imported by the app.
 *
 * Shortest path over the edit graph by 0-1 BFS: diagonals cost 0, right and
 * down cost 1. It shares no idea with Myers — no k, no V, no furthest-reaching
 * trick — which is the point. If Myers and this disagree, Myers is wrong.
 *
 * PRD §8.
 */
import type { EditScript, Token } from './types'

type Index = number

/** True minimal D for A → B. O(N·M); small inputs only. */
export function bruteMinimalD(a: readonly Token[], b: readonly Token[]): number {
  const n = a.length
  const m = b.length
  const width = n + 1
  const dist = new Int32Array(width * (m + 1)).fill(-1)
  const at = (x: number, y: number): Index => y * width + x

  // Deque for 0-1 BFS: zero-cost diagonals go to the front, unit edges to the back.
  const deque: Index[] = [at(0, 0)]
  dist[at(0, 0)] = 0
  let head = 0

  while (head < deque.length) {
    const idx = deque[head++]
    const x = idx % width
    const y = (idx - x) / width
    const d = dist[idx]

    if (x === n && y === m) return d

    if (x < n && y < m && a[x] === b[y]) {
      const next = at(x + 1, y + 1)
      if (dist[next] === -1 || dist[next] > d) {
        dist[next] = d
        deque.splice(head, 0, next) // front of the remaining queue: cost 0
      }
    }
    if (x < n) {
      const next = at(x + 1, y)
      if (dist[next] === -1 || dist[next] > d + 1) {
        dist[next] = d + 1
        deque.push(next)
      }
    }
    if (y < m) {
      const next = at(x, y + 1)
      if (dist[next] === -1 || dist[next] > d + 1) {
        dist[next] = d + 1
        deque.push(next)
      }
    }
  }
  /* c8 ignore next -- (n,m) is always reachable: right and down alone suffice. */
  throw new Error('edit graph target unreachable')
}

/**
 * Every distinct minimal edit script, for inputs small enough to enumerate.
 * Backs the ambiguity view's count (§6.4) with a source that cannot inherit a
 * bug from the search. Returns at most `limit` scripts.
 */
export function bruteMinimalScripts(
  a: readonly Token[],
  b: readonly Token[],
  limit = 1000,
): { count: number; truncated: boolean; scripts: EditScript[] } {
  const n = a.length
  const m = b.length
  const width = n + 1

  // best[x][y] = minimal cost from (x,y) to (n,m). Computed backwards; the
  // recursion is then "take every move that stays on a minimal path".
  const best = new Int32Array(width * (m + 1))
  for (let y = m; y >= 0; y--) {
    for (let x = n; x >= 0; x--) {
      if (x === n && y === m) {
        best[y * width + x] = 0
        continue
      }
      let v = Number.MAX_SAFE_INTEGER
      if (x < n && y < m && a[x] === b[y]) v = Math.min(v, best[(y + 1) * width + (x + 1)])
      if (x < n) v = Math.min(v, 1 + best[y * width + (x + 1)])
      if (y < m) v = Math.min(v, 1 + best[(y + 1) * width + x])
      best[y * width + x] = v
    }
  }

  const scripts: EditScript[] = []
  let count = 0
  let truncated = false
  const stack: EditScript[number][] = []

  const walk = (x: number, y: number): void => {
    if (count >= limit) {
      truncated = true
      return
    }
    if (x === n && y === m) {
      count++
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

  return { count, truncated, scripts }
}
