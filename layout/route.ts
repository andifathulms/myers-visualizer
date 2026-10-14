import type { ExampleLine } from '@/data/example'

/** A lattice point as the hand-drawn figures store it: [x, y]. */
export type Corner = readonly [number, number]

/**
 * A polyline's corners expanded to every node it passes through. The figures
 * store routes as corners because that is what an SVG polyline wants; the
 * moves — and so the diff lines — are between consecutive nodes.
 */
export function walk(corners: readonly Corner[]): Corner[] {
  const nodes: Corner[] = []
  for (let i = 0; i < corners.length - 1; i++) {
    const [x0, y0] = corners[i]
    const [x1, y1] = corners[i + 1]
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))
    const dx = Math.sign(x1 - x0)
    const dy = Math.sign(y1 - y0)
    for (let s = 0; s < steps; s++) nodes.push([x0 + dx * s, y0 + dy * s])
  }
  if (corners.length > 0) nodes.push(corners[corners.length - 1])
  return nodes
}

/**
 * A route read back as diff lines: diagonal keeps, right deletes A[x], down
 * inserts B[y]. The same reading the backtrack does (Myers §2), for a route
 * that is already drawn — so a figure's caption is derived from its picture
 * rather than written out separately and left to agree by hand.
 */
export function linesOfRoute(
  corners: readonly Corner[],
  a: readonly string[],
  b: readonly string[],
): ExampleLine[] {
  const nodes = walk(corners)
  const lines: ExampleLine[] = []
  for (let i = 1; i < nodes.length; i++) {
    const [x0, y0] = nodes[i - 1]
    const [x1, y1] = nodes[i]
    if (x1 > x0 && y1 > y0) lines.push({ type: 'keep', text: a[x0] })
    else if (x1 > x0) lines.push({ type: 'delete', text: a[x0] })
    else lines.push({ type: 'insert', text: b[y0] })
  }
  return lines
}
