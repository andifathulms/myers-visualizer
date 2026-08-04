import { describe, expect, it } from 'vitest'
import {
  computeGeometry,
  diagonalEndpoints,
  pointAt,
  px,
  py,
  VIEWABLE_CAP,
} from '@/layout/lattice'

describe('lattice geometry', () => {
  it('fits the graph inside the viewport and centres it', () => {
    const g = computeGeometry(10, 20, 400, 400, 20)
    expect(g.width).toBeLessThanOrEqual(360)
    expect(g.height).toBeLessThanOrEqual(360)
    expect(px(g, 0)).toBeGreaterThanOrEqual(20)
    expect(py(g, g.m)).toBeLessThanOrEqual(380)
  })

  it('maps point 0 to the origin and point n to the far edge', () => {
    const g = computeGeometry(8, 8, 200, 200, 10)
    expect(px(g, 0)).toBeCloseTo(g.originX)
    expect(px(g, g.n)).toBeCloseTo(g.originX + g.width)
    expect(py(g, g.m)).toBeCloseTo(g.originY + g.height)
  })

  it('round-trips a lattice point through pixel space', () => {
    const g = computeGeometry(12, 9, 500, 400, 16)
    for (const [x, y] of [
      [0, 0],
      [5, 3],
      [12, 9],
    ] as const) {
      expect(pointAt(g, px(g, x), py(g, y))).toEqual({ x, y })
    }
  })

  it('clamps hover positions into the graph', () => {
    const g = computeGeometry(4, 4, 200, 200, 10)
    expect(pointAt(g, -1000, -1000)).toEqual({ x: 0, y: 0 })
    expect(pointAt(g, 1000, 1000)).toEqual({ x: 4, y: 4 })
  })

  it('handles degenerate inputs without dividing by zero', () => {
    const g = computeGeometry(0, 0, 300, 300, 10)
    expect(Number.isFinite(g.cell)).toBe(true)
    expect(g.width).toBe(0)
    expect(g.height).toBe(0)
  })

  describe('diagonal endpoints — k = x - y, and k is routinely negative', () => {
    const g = computeGeometry(6, 4, 300, 300, 10)

    it('starts a positive k on the top edge', () => {
      expect(diagonalEndpoints(g, 2)).toEqual({ from: { x: 2, y: 0 }, to: { x: 6, y: 4 } })
    })

    it('starts a negative k on the left edge', () => {
      // Only m − 2 = 2 steps remain below (0,2), so it stops at (2,4).
      expect(diagonalEndpoints(g, -2)).toEqual({ from: { x: 0, y: 2 }, to: { x: 2, y: 4 } })
    })

    it('runs k = 0 corner to corner as far as the graph allows', () => {
      expect(diagonalEndpoints(g, 0)).toEqual({ from: { x: 0, y: 0 }, to: { x: 4, y: 4 } })
    })

    it('returns null for diagonals outside the graph', () => {
      expect(diagonalEndpoints(g, 7)).toBeNull()
      expect(diagonalEndpoints(g, -5)).toBeNull()
    })
  })

  it('caps the viewable size honestly', () => {
    expect(VIEWABLE_CAP).toBe(300)
  })
})
