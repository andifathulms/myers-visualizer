/**
 * Bidirectional linking between a contested diff line and the lattice edge
 * it corresponds to. DESIGN.md §4.2: the line badge and the lattice's
 * contested tint are the same fact stated twice, so hovering or focusing
 * either has to highlight the other.
 *
 * A hovered lattice point is a *vertex*, not an edge, so it is built once
 * per shown path into a map from vertex to the op(s) touching it — the op
 * arriving and the op leaving — since either neighbour may be the one
 * that's actually contested.
 */
import type { Edge, Point } from '@/lib/diff/types'

export function pointKey(p: Point): string {
  return `${p.x},${p.y}`
}

export function pathEdgeMap(path: readonly Point[]): Map<string, number[]> {
  const map = new Map<string, number[]>()
  const touch = (p: Point, opIndex: number) => {
    const key = pointKey(p)
    const existing = map.get(key)
    if (existing === undefined) map.set(key, [opIndex])
    else existing.push(opIndex)
  }
  for (let i = 0; i < path.length - 1; i++) {
    touch(path[i], i) // this vertex is where op i starts
    touch(path[i + 1], i) // this vertex is where op i ends
  }
  return map
}

/** The single grid edge a path op traverses, or null for an out-of-range index. */
export function edgeOfOp(path: readonly Point[], opIndex: number): Edge | null {
  if (opIndex < 0 || opIndex + 1 >= path.length) return null
  const from = path[opIndex]
  const to = path[opIndex + 1]
  return { x0: from.x, y0: from.y, x1: to.x, y1: to.y }
}
