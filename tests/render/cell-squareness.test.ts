import { describe, expect, it } from 'vitest'
import { computeGeometry } from '@/layout/lattice'
import { LatticeRenderer, type Layer } from '@/components/lattice/render'

/**
 * Records moveTo/lineTo calls issued on a mock 2D context, so the test reads
 * what drawGrid actually draws rather than re-deriving it from the geometry
 * module in isolation.
 */
type Call = { method: string; args: readonly number[] }
type Recording = { calls: Call[]; ctx: CanvasRenderingContext2D }

function recordingLayer(): Recording {
  const state: Recording = { calls: [], ctx: null as unknown as CanvasRenderingContext2D }
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (prop === 'canvas') return {}
      return (...args: unknown[]) => {
        if (prop === 'moveTo' || prop === 'lineTo') {
          state.calls.push({ method: String(prop), args: args as number[] })
        }
        return undefined
      }
    },
    set() {
      return true
    },
  }
  state.ctx = new Proxy({}, handler) as unknown as CanvasRenderingContext2D
  return state
}

/**
 * DESIGN.md §2.10: the lattice container is `aspect-square` while the edit
 * graph is (N+1) x (M+1) with N and M almost never equal. If a square
 * container stretched the grid to fill it, cells would come out non-square
 * and every diagonal edge would be drawn off 45deg — a picture that is wrong
 * about the one thing Myers is about, since k = x - y is a diagonal, snakes
 * run along diagonals, and V is diagonal-addressed.
 *
 * This drives the real renderer (render.ts, not just layout/lattice.ts) with
 * N != M inside a square viewport — the exact shape GraphView's
 * `aspect-square` host produces — and reads the pixel coordinates drawGrid
 * actually issues for the grid threads, so a regression in the renderer
 * itself, not only in the geometry module, would be caught here.
 */
describe('lattice cell squareness', () => {
  it('draws square cells for an N != M edit graph inside a square viewport', () => {
    const n = 12
    const m = 5

    let created = 0
    let staticRecording: Recording | null = null
    const createLayer = (): Layer => {
      created += 1
      const rec = recordingLayer()
      if (created === 1) staticRecording = rec // constructor makes staticLayer first, then exploredLayer
      return { canvas: { style: {} } as HTMLCanvasElement, ctx: rec.ctx }
    }

    const target = recordingLayer()
    const canvas = {
      getContext: () => target.ctx,
      style: {},
    } as unknown as HTMLCanvasElement

    const geometry = computeGeometry(n, m, 900, 900, 24)
    const renderer = new LatticeRenderer(canvas, geometry, 900, 900, { createLayer, dpr: 1 })
    renderer.setScene(geometry, null)

    const calls = staticRecording!.calls
    expect(calls.length).toBe(2 * (n + 1) + 2 * (m + 1))

    // Vertical grid lines: moveTo(sx, top) / lineTo(sx, bottom) pairs, x = 0..n.
    const verticalX: number[] = []
    // Horizontal grid lines: moveTo(left, sy) / lineTo(right, sy) pairs, y = 0..m.
    const horizontalY: number[] = []
    for (let i = 0; i + 1 < calls.length; i += 2) {
      const move = calls[i]
      const line = calls[i + 1]
      expect(move.method).toBe('moveTo')
      expect(line.method).toBe('lineTo')
      if (move.args[0] === line.args[0]) verticalX.push(move.args[0])
      else if (move.args[1] === line.args[1]) horizontalY.push(move.args[1])
      else throw new Error('grid line pair is neither vertical nor horizontal')
    }

    expect(verticalX.length).toBe(n + 1)
    expect(horizontalY.length).toBe(m + 1)

    const widths = verticalX.slice(1).map((x, i) => x - verticalX[i])
    const heights = horizontalY.slice(1).map((y, i) => y - horizontalY[i])

    const drawnCellWidth = widths[0]
    const drawnCellHeight = heights[0]

    for (const w of widths) expect(w).toBeCloseTo(drawnCellWidth, 5)
    for (const h of heights) expect(h).toBeCloseTo(drawnCellHeight, 5)

    // The actual geometry assertion: a lattice cell is square. If this ever
    // fails, the diagonal is skewed and the picture misrepresents the
    // algorithm — report it before touching layout or overlay work.
    expect(drawnCellWidth).toBeCloseTo(drawnCellHeight, 5)
  })
})
