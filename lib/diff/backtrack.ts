/**
 * Trace → EditScript.
 *
 * Myers §2: the forward pass alone cannot say *which* path it took, only how
 * long it was. Recovering the script means walking the recorded V backwards
 * from (N,M): at each d, the previous diagonal is the one the tie-break would
 * have come from, and everything between is a free snake.
 */
import { chooseFrom, snapshotGet, type VSnapshots } from './trace'
import type { EditOp, EditScript, Point, Token } from './types'

export function backtrack(
  a: readonly Token[],
  b: readonly Token[],
  snapshots: VSnapshots,
  d: number,
  n: number,
  m: number,
): EditScript {
  const reversed: EditOp[] = []
  let x = n
  let y = m

  for (let level = d; level > 0; level--) {
    const k = x - y
    // The same tie-break the forward pass used, applied to the V recorded
    // *before* this level ran. Re-deriving it here instead of calling
    // chooseFrom would be the classic way to end up with a plausible script
    // that fails apply on asymmetric inputs.
    const came = chooseFrom(
      snapshotGet(snapshots, level, k - 1),
      snapshotGet(snapshots, level, k + 1),
      k,
      n,
      m,
    )
    /* c8 ignore next -- (x,y) was reached at this level, so a source exists. */
    if (came === 'none') throw new Error(`backtrack: no source for k=${k} at d=${level}`)
    const prevK = came === 'down' ? k + 1 : k - 1
    const prevX = snapshotGet(snapshots, level, prevK)
    const prevY = prevX - prevK

    while (x > prevX && y > prevY) {
      x--
      y--
      reversed.push({ type: 'keep', aIndex: x, bIndex: y, token: a[x] })
    }

    if (x === prevX) {
      reversed.push({ type: 'insert', bIndex: prevY, token: b[prevY] })
    } else {
      reversed.push({ type: 'delete', aIndex: prevX, token: a[prevX] })
    }
    x = prevX
    y = prevY
  }

  // d = 0 leaves the leading snake from (0,0).
  while (x > 0 && y > 0) {
    x--
    y--
    reversed.push({ type: 'keep', aIndex: x, bIndex: y, token: a[x] })
  }

  reversed.reverse()
  return reversed
}

/** Lattice points the script traces, (0,0) → (N,M). Drawn in madder. */
export function pathOf(script: EditScript): Point[] {
  const path: Point[] = [{ x: 0, y: 0 }]
  let x = 0
  let y = 0
  for (const op of script) {
    switch (op.type) {
      case 'keep':
        x++
        y++
        break
      case 'delete':
        x++
        break
      case 'insert':
        y++
        break
      default: {
        const never: never = op
        throw new Error(`unknown op ${JSON.stringify(never)}`)
      }
    }
    path.push({ x, y })
  }
  return path
}
