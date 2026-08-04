/**
 * Lattice geometry. Pure — no DOM, no canvas, no React.
 *
 * The edit graph is (N+1) × (M+1) *points*, not N × M cells: point (x, y)
 * means "consumed x elements of A and y of B". x runs left→right (A),
 * y runs top→bottom (B). PRD §3.
 */

export type Geometry = {
  readonly n: number
  readonly m: number
  /** Distance in CSS pixels between adjacent lattice points. */
  readonly cell: number
  readonly originX: number
  readonly originY: number
  readonly width: number
  readonly height: number
}

export type Point = { readonly x: number; readonly y: number }

export const VIEWABLE_CAP = 300

/** Below this the lattice is drawn with labels and fat knots; above it, threads only. */
export const DETAIL_THRESHOLD = 60

export function computeGeometry(
  n: number,
  m: number,
  viewportWidth: number,
  viewportHeight: number,
  padding: number,
): Geometry {
  const usableW = Math.max(1, viewportWidth - padding * 2)
  const usableH = Math.max(1, viewportHeight - padding * 2)
  // n and m are counts of *intervals*; there are n+1 and m+1 points.
  const cell = Math.max(1, Math.min(usableW / Math.max(1, n), usableH / Math.max(1, m)))
  const width = cell * n
  const height = cell * m
  return {
    n,
    m,
    cell,
    originX: padding + (usableW - width) / 2,
    originY: padding + (usableH - height) / 2,
    width,
    height,
  }
}

export function px(g: Geometry, x: number): number {
  return g.originX + x * g.cell
}

export function py(g: Geometry, y: number): number {
  return g.originY + y * g.cell
}

/** Nearest lattice point to a pixel position, clamped into the graph. */
export function pointAt(g: Geometry, clientX: number, clientY: number): Point {
  const x = Math.round((clientX - g.originX) / g.cell)
  const y = Math.round((clientY - g.originY) / g.cell)
  return { x: clamp(x, 0, g.n), y: clamp(y, 0, g.m) }
}

/**
 * Endpoints of diagonal k = x - y within the lattice. Used to highlight the
 * diagonal belonging to a hovered V cell. §6.2.
 */
export function diagonalEndpoints(g: Geometry, k: number): { from: Point; to: Point } | null {
  if (k > g.n || k < -g.m) return null
  const startX = k >= 0 ? k : 0
  const startY = k >= 0 ? 0 : -k
  const steps = Math.min(g.n - startX, g.m - startY)
  if (steps < 0) return null
  return {
    from: { x: startX, y: startY },
    to: { x: startX + steps, y: startY + steps },
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}
