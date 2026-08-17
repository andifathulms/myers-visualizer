import { describe, expect, it } from 'vitest'
import { computeGeometry } from '@/layout/lattice'
import { LatticeRenderer, type Layer } from '@/components/lattice/render'
import { buildMatchGrid, type FrontierPoint } from '@/components/lattice/frame'

/**
 * M0's budget guard. The browser harness (`pnpm bench:render`) reports real
 * milliseconds; this test protects the property that produces them — per-frame
 * work is O(frontier), never O(N · M). Grid threads and match knots belong to
 * the static layer and must not be re-issued on a frame.
 *
 * If someone moves knot drawing into draw(), this fails long before anyone
 * opens a browser.
 */

type Counting = { ops: number; drawImage: number; ctx: CanvasRenderingContext2D }

function countingLayer(): Counting {
  const state: Counting = { ops: 0, drawImage: 0, ctx: null as unknown as CanvasRenderingContext2D }
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (prop === 'canvas') return {}
      return (...args: unknown[]) => {
        if (prop === 'drawImage') state.drawImage++
        // moveTo/lineTo/arc/rect are the per-element primitives; everything
        // else is per-frame setup and not interesting.
        if (prop === 'moveTo' || prop === 'lineTo' || prop === 'arc' || prop === 'rect') state.ops++
        void args
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

function harness(n: number, m: number) {
  const target = countingLayer()
  const layers: Counting[] = []
  const canvas = {
    getContext: () => target.ctx,
    style: {},
  } as unknown as HTMLCanvasElement
  const createLayer = (): Layer => {
    const layer = countingLayer()
    layers.push(layer)
    return { canvas: { style: {} } as HTMLCanvasElement, ctx: layer.ctx }
  }
  const geometry = computeGeometry(n, m, 900, 900, 20)
  const renderer = new LatticeRenderer(canvas, geometry, 900, 900, { createLayer, dpr: 1 })
  return { renderer, geometry, target, layers }
}

function frontierOf(d: number, n: number, m: number): FrontierPoint[] {
  const points: FrontierPoint[] = []
  for (let k = -d; k <= d; k += 2) {
    const x = Math.min(n, Math.max(0, Math.round((d + k) / 2)))
    points.push({ k, x, y: Math.min(m, Math.max(0, x - k)) })
  }
  return points
}

describe('lattice frame cost', () => {
  const N = 300
  const M = 300

  it('draws the 90 000 match knots once, on the static layer', () => {
    const { renderer, layers } = harness(N, M)
    const a = Array.from({ length: N }, (_, i) => i % 24)
    const b = Array.from({ length: M }, (_, i) => (i * 7) % 24)
    const matches = buildMatchGrid(a, b)
    const before = layers[0].ops
    renderer.setScene(computeGeometry(N, M, 900, 900, 20), matches)
    // Grid threads plus one op per match; the point is that it happens here.
    expect(layers[0].ops - before).toBeGreaterThan(1000)
  })

  it('issues per-frame work proportional to the frontier, not to N × M', () => {
    const { renderer, target } = harness(N, M)
    const frontier = frontierOf(N, N, M)
    const budget = frontier.length * 6

    const before = target.ops
    renderer.draw({
      frontier,
      snakes: [{ x0: 10, y0: 10, x1: 20, y1: 20 }],
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
    })
    const cost = target.ops - before

    expect(cost).toBeLessThan(budget)
    expect(cost).toBeLessThan(N * M) // the regression that would kill 60fps
  })

  it('composites both cached layers rather than redrawing them', () => {
    const { renderer, target } = harness(N, M)
    renderer.draw({
      frontier: frontierOf(4, N, M),
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
    })
    expect(target.drawImage).toBe(2)
  })

  it('stamps the explored wash incrementally, one d at a time', () => {
    const { renderer, layers } = harness(N, M)
    const explored = layers[1]
    const before = explored.ops
    renderer.stampExplored([{ x0: 0, y0: 0, x1: 5, y1: 5 }], frontierOf(6, N, M))
    const cost = explored.ops - before
    expect(cost).toBeGreaterThan(0)
    expect(cost).toBeLessThan(100)
  })
})
