import type { Point } from './lattice'

/**
 * A route through an edit graph, reduced to a thumbnail: the frame of the
 * (N+1)×(M+1) lattice and one polyline. Pure geometry — the component that
 * draws it only renders the result.
 *
 * Cells stay square, as on the full lattice (DESIGN.md §2.10): the diagonal is
 * the geometric content of the picture, and a stretched thumbnail would draw
 * every snake at the wrong angle. The longer side gets `size`; the shorter is
 * whatever square cells leave it.
 */
export type Thumbnail = {
  readonly width: number
  readonly height: number
  /** The lattice frame, inset by `pad`. */
  readonly frame: {
    readonly x: number
    readonly y: number
    readonly w: number
    readonly h: number
  }
  /** The route as an SVG `points` string, in the same coordinates. */
  readonly points: string
  /** Cell size, so a caller can scale stroke widths with it. */
  readonly cell: number
}

export function thumbnail(route: readonly Point[], n: number, m: number, size: number, pad = 3): Thumbnail {
  const span = Math.max(1, n, m)
  const cell = (size - pad * 2) / span
  const w = n * cell
  const h = m * cell
  const x = (p: Point) => round(pad + p.x * cell)
  const y = (p: Point) => round(pad + p.y * cell)
  return {
    width: round(w + pad * 2),
    height: round(h + pad * 2),
    frame: { x: pad, y: pad, w: round(w), h: round(h) },
    points: route.map((p) => `${x(p)},${y(p)}`).join(' '),
    cell,
  }
}

/** Two decimals: enough for a crisp line, short enough to keep the markup small. */
function round(value: number): number {
  return Math.round(value * 100) / 100
}
