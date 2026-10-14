import { describe, expect, it } from 'vitest'
import { thumbnail } from '@/layout/thumbnail'

/**
 * DESIGN.md §2.10: geometry that carries meaning gets a layout test. A route
 * thumbnail is a small edit graph, and its diagonals have to stay at 45° —
 * a snake drawn at another angle is a different picture.
 */
describe('route thumbnail geometry', () => {
  it('keeps cells square when N and M differ', () => {
    const t = thumbnail([{ x: 0, y: 0 }, { x: 7, y: 11 }], 7, 11, 60)
    // Coordinates are rounded to 0.01px by design, so compare at that precision.
    expect(t.frame.w / 7).toBeCloseTo(t.frame.h / 11, 2)
  })

  it('gives the longer side the whole size', () => {
    const wide = thumbnail([], 10, 4, 50, 3)
    expect(wide.width).toBeCloseTo(50, 6)
    expect(wide.height).toBeLessThan(50)
    const tall = thumbnail([], 4, 10, 50, 3)
    expect(tall.height).toBeCloseTo(50, 6)
  })

  it('draws a diagonal step at exactly 45 degrees', () => {
    const t = thumbnail([{ x: 2, y: 3 }, { x: 3, y: 4 }], 7, 11, 60)
    const [[x0, y0], [x1, y1]] = t.points.split(' ').map((pair) => pair.split(',').map(Number))
    expect(x1 - x0).toBeCloseTo(y1 - y0, 2)
  })

  it('does not divide by zero on an empty lattice', () => {
    const t = thumbnail([{ x: 0, y: 0 }], 0, 0, 40)
    expect(Number.isFinite(t.cell)).toBe(true)
  })
})
