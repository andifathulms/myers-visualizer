/**
 * The view-model the lattice renders. Components render this; they never
 * compute it. The engine's SearchTrace hydrates into exactly this shape.
 */
import type { Point } from '@/layout/lattice'
import type { Edge, Region } from '@/lib/diff/types'

/** A maximal diagonal run of matches — the conceptual unit of the search. §6.1 */
export type Snake = {
  readonly x0: number
  readonly y0: number
  readonly x1: number
  readonly y1: number
}

export type FrontierPoint = {
  readonly k: number
  readonly x: number
  readonly y: number
}

/**
 * Match positions as a flat n × m flag grid. One byte per cell is affordable
 * at the input cap (300 × 300 = 90 kB) and lets the static layer be drawn in
 * one pass.
 */
export type MatchGrid = {
  readonly n: number
  readonly m: number
  readonly flags: Uint8Array
}

/**
 * Cap on ghosted alternative paths actually drawn on the lattice. Above it,
 * the polylines would overlap into an unreadable mesh, so only the
 * contested region is drawn and the total is stated in the canvas label —
 * never truncated silently. DESIGN.md §4.4.
 */
export const GHOST_PATH_CAP = 10

export function matchAt(grid: MatchGrid, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= grid.n || y >= grid.m) return false
  return grid.flags[y * grid.n + x] === 1
}

export function buildMatchGrid(a: readonly number[], b: readonly number[]): MatchGrid {
  const n = a.length
  const m = b.length
  const flags = new Uint8Array(n * m)
  for (let y = 0; y < m; y++) {
    const by = b[y]
    const row = y * n
    for (let x = 0; x < n; x++) {
      if (a[x] === by) flags[row + x] = 1
    }
  }
  return { n, m, flags }
}

export type LatticeFrame = {
  /** Frontier for the current d — drawn in turmeric, the live edge. */
  readonly frontier: readonly FrontierPoint[]
  /** Snakes belonging to the current d. */
  readonly snakes: readonly Snake[]
  /** Backward frontier, linear-space mode only. §6.6 */
  readonly backwardFrontier: readonly FrontierPoint[] | null
  /** The recovered path, drawn in madder during backtrack. Null until then. */
  readonly path: readonly Point[] | null
  /** The middle snake just found, flared. Linear-space mode only. Madder. */
  readonly middleSnake: Snake | null
  /**
   * Middle snakes already settled. Watching them accumulate is the recursion
   * view: the answer is assembled from them rather than searched in one pass.
   */
  readonly settledSnakes: readonly Snake[]
  /** The sub-rectangle currently being searched. §6.6 */
  readonly region: Region | null
  /** Diagonal k to emphasise, from a hovered V cell. §6.2 */
  readonly highlightK: number | null
  /**
   * Every other minimal path, ghosted in indigo beneath the chosen one.
   * Where a ghost coincides with the chosen path or another ghost, they
   * overdraw — a shared segment is a segment every minimal script agrees
   * on, and it is correct for it to read as more solid. Empty whenever
   * there is only one minimal script, or when there are more than
   * `GHOST_PATH_CAP`. DESIGN.md §4.1, §4.4.
   */
  readonly ghostPaths: readonly (readonly Point[])[]
  /** True when more minimal paths exist than `GHOST_PATH_CAP` allows drawing. */
  readonly ghostPathsCapped: boolean
  /**
   * Edges some minimal paths take and others do not, as a madder tint
   * beneath every other layer. Null before it has been computed, or when
   * the true count is past `COUNT_CAP` and cannot be stated exactly.
   * DESIGN.md §4.1.
   */
  readonly contestedEdges: readonly Edge[] | null
  /**
   * The single contested edge under the pointer or focus, from hovering or
   * focusing its line in `Hunks` — or, symmetrically, from hovering the
   * lattice itself over a vertex that touches a contested edge. The line
   * badge and this edge are the same fact stated twice, and this is the
   * link between them. DESIGN.md §4.2.
   */
  readonly hoverEdge: Edge | null
}

export const EMPTY_FRAME: LatticeFrame = {
  frontier: [],
  snakes: [],
  backwardFrontier: null,
  path: null,
  middleSnake: null,
  settledSnakes: [],
  region: null,
  highlightK: null,
  ghostPaths: [],
  ghostPathsCapped: false,
  contestedEdges: null,
  hoverEdge: null,
}
