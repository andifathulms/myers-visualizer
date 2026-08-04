/**
 * The view-model the lattice renders. Components render this; they never
 * compute it. The engine's SearchTrace hydrates into exactly this shape.
 */
import type { Point } from '@/layout/lattice'

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
  /** Highlighted middle snake, linear-space mode only. Madder. */
  readonly middleSnake: Snake | null
  /** Diagonal k to emphasise, from a hovered V cell. §6.2 */
  readonly highlightK: number | null
}

export const EMPTY_FRAME: LatticeFrame = {
  frontier: [],
  snakes: [],
  backwardFrontier: null,
  path: null,
  middleSnake: null,
  highlightK: null,
}
