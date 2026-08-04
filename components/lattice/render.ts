/**
 * Canvas lattice renderer. The lattice is drawn as *thread* — thin continuous
 * lines, matches as small knots — never as cell borders, and never as DOM
 * elements at any size. PRD §9, CLAUDE.md invariant 11.
 *
 * Three layers, because redrawing everything every frame does not hold 60fps
 * at 300 × 300:
 *
 *   static   — grid threads and match knots. Drawn once per geometry change.
 *   explored — the pale wash, stamped incrementally as d advances. Only a
 *              backward seek forces a rebuild.
 *   dynamic  — frontier, current snakes, path. Cleared and drawn every frame.
 */
import { PALETTE } from '@/lib/palette'
import {
  DETAIL_THRESHOLD,
  px,
  py,
  diagonalEndpoints,
  type Geometry,
  type Point,
} from '@/layout/lattice'
import { matchAt, type FrontierPoint, type LatticeFrame, type MatchGrid, type Snake } from './frame'

export type Layer = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }

/** Injectable so the frame-cost test can drive the renderer without a DOM. */
export type LayerFactory = (width: number, height: number, dpr: number) => Layer

export type RendererDeps = { createLayer?: LayerFactory; dpr?: number }

function makeLayer(width: number, height: number, dpr: number): Layer {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.ceil(width * dpr))
  canvas.height = Math.max(1, Math.ceil(height * dpr))
  const ctx = canvas.getContext('2d')
  if (ctx === null) throw new Error('2d context unavailable')
  ctx.scale(dpr, dpr)
  return { canvas, ctx }
}

export class LatticeRenderer {
  private readonly target: CanvasRenderingContext2D
  private geometry: Geometry
  private cssWidth: number
  private cssHeight: number
  private dpr: number
  private staticLayer: Layer
  private exploredLayer: Layer

  constructor(
    canvas: HTMLCanvasElement,
    geometry: Geometry,
    cssWidth: number,
    cssHeight: number,
    deps: RendererDeps = {},
  ) {
    const ctx = canvas.getContext('2d')
    if (ctx === null) throw new Error('2d context unavailable')
    const create = deps.createLayer ?? makeLayer
    this.dpr =
      deps.dpr ?? (typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2))
    canvas.width = Math.ceil(cssWidth * this.dpr)
    canvas.height = Math.ceil(cssHeight * this.dpr)
    canvas.style.width = `${cssWidth}px`
    canvas.style.height = `${cssHeight}px`
    ctx.scale(this.dpr, this.dpr)
    this.target = ctx
    this.geometry = geometry
    this.cssWidth = cssWidth
    this.cssHeight = cssHeight
    this.staticLayer = create(cssWidth, cssHeight, this.dpr)
    this.exploredLayer = create(cssWidth, cssHeight, this.dpr)
  }

  /** Rebuild the grid and knots. Call on geometry or input change only. */
  setScene(geometry: Geometry, matches: MatchGrid | null): void {
    this.geometry = geometry
    this.staticLayer.ctx.clearRect(0, 0, this.cssWidth, this.cssHeight)
    drawGrid(this.staticLayer.ctx, geometry)
    if (matches !== null) drawKnots(this.staticLayer.ctx, geometry, matches)
    this.clearExplored()
  }

  clearExplored(): void {
    this.exploredLayer.ctx.clearRect(0, 0, this.cssWidth, this.cssHeight)
  }

  /** Stamp one d's worth of search onto the wash. Cheap; never re-walks history. */
  stampExplored(snakes: readonly Snake[], frontier: readonly FrontierPoint[]): void {
    const ctx = this.exploredLayer.ctx
    const g = this.geometry
    ctx.strokeStyle = PALETTE.explored
    ctx.lineWidth = Math.max(1, Math.min(3, g.cell * 0.35))
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (const s of snakes) {
      ctx.moveTo(px(g, s.x0), py(g, s.y0))
      ctx.lineTo(px(g, s.x1), py(g, s.y1))
    }
    ctx.stroke()

    const r = Math.max(0.6, Math.min(2.5, g.cell * 0.16))
    ctx.fillStyle = PALETTE.explored
    ctx.beginPath()
    for (const p of frontier) {
      ctx.moveTo(px(g, p.x) + r, py(g, p.y))
      ctx.arc(px(g, p.x), py(g, p.y), r, 0, Math.PI * 2)
    }
    ctx.fill()
  }

  /** Composite the layers and draw the live frame. Called every animation frame. */
  draw(frame: LatticeFrame): void {
    const ctx = this.target
    const g = this.geometry
    ctx.clearRect(0, 0, this.cssWidth, this.cssHeight)
    ctx.drawImage(this.staticLayer.canvas, 0, 0, this.cssWidth, this.cssHeight)
    ctx.drawImage(this.exploredLayer.canvas, 0, 0, this.cssWidth, this.cssHeight)

    if (frame.highlightK !== null) drawDiagonalHighlight(ctx, g, frame.highlightK)
    drawFrontier(ctx, g, frame.frontier, frame.snakes, PALETTE.turmeric)
    if (frame.backwardFrontier !== null) {
      drawFrontier(ctx, g, frame.backwardFrontier, [], PALETTE.turmeric, true)
    }
    // madder last: it must sit above everything, because it is the answer.
    if (frame.middleSnake !== null) drawSnakeThread(ctx, g, frame.middleSnake, PALETTE.madder, 3.2)
    if (frame.path !== null) drawPath(ctx, g, frame.path)
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, g: Geometry): void {
  ctx.strokeStyle = PALETTE.indigo
  ctx.globalAlpha = g.cell < 6 ? 0.14 : 0.24
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 0; x <= g.n; x++) {
    const sx = Math.round(px(g, x)) + 0.5
    ctx.moveTo(sx, py(g, 0))
    ctx.lineTo(sx, py(g, g.m))
  }
  for (let y = 0; y <= g.m; y++) {
    const sy = Math.round(py(g, y)) + 0.5
    ctx.moveTo(px(g, 0), sy)
    ctx.lineTo(px(g, g.n), sy)
  }
  ctx.stroke()
  ctx.globalAlpha = 1
}

/**
 * Match positions as knots. A match at (x, y) makes the diagonal from (x, y)
 * to (x+1, y+1) free, so the knot is drawn on that segment's midpoint.
 */
function drawKnots(ctx: CanvasRenderingContext2D, g: Geometry, matches: MatchGrid): void {
  const detailed = g.n <= DETAIL_THRESHOLD && g.m <= DETAIL_THRESHOLD
  ctx.strokeStyle = PALETTE.indigo
  ctx.fillStyle = PALETTE.indigo
  ctx.globalAlpha = 0.5
  ctx.lineWidth = Math.max(1, Math.min(2.5, g.cell * 0.2))
  ctx.lineCap = 'round'
  ctx.beginPath()
  const r = Math.max(0.5, Math.min(2.2, g.cell * 0.14))
  for (let y = 0; y < matches.m; y++) {
    for (let x = 0; x < matches.n; x++) {
      if (!matchAt(matches, x, y)) continue
      if (detailed) {
        // Draw the free diagonal itself: the structure the search will exploit.
        ctx.moveTo(px(g, x), py(g, y))
        ctx.lineTo(px(g, x + 1), py(g, y + 1))
      } else {
        const cx = px(g, x + 0.5)
        const cy = py(g, y + 0.5)
        ctx.moveTo(cx + r, cy)
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
      }
    }
  }
  if (detailed) ctx.stroke()
  else ctx.fill()
  ctx.globalAlpha = 1
}

function drawDiagonalHighlight(ctx: CanvasRenderingContext2D, g: Geometry, k: number): void {
  const ends = diagonalEndpoints(g, k)
  if (ends === null) return
  ctx.save()
  ctx.strokeStyle = PALETTE.indigo
  ctx.globalAlpha = 0.35
  ctx.lineWidth = Math.max(2, g.cell * 0.5)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(px(g, ends.from.x), py(g, ends.from.y))
  ctx.lineTo(px(g, ends.to.x), py(g, ends.to.y))
  ctx.stroke()
  ctx.restore()
}

function drawFrontier(
  ctx: CanvasRenderingContext2D,
  g: Geometry,
  frontier: readonly FrontierPoint[],
  snakes: readonly Snake[],
  colour: string,
  dashed = false,
): void {
  if (frontier.length === 0 && snakes.length === 0) return
  ctx.save()
  ctx.strokeStyle = colour
  ctx.lineWidth = Math.max(1.2, Math.min(3, g.cell * 0.28))
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Snakes as unbroken diagonal threads — they read as single units, which is
  // what they are.
  ctx.beginPath()
  for (const s of snakes) {
    ctx.moveTo(px(g, s.x0), py(g, s.y0))
    ctx.lineTo(px(g, s.x1), py(g, s.y1))
  }
  ctx.stroke()

  // The frontier itself: a contour through the furthest-reaching point of each
  // diagonal, ordered by k so the line reads as one advancing edge.
  const ordered = [...frontier].sort((p, q) => p.k - q.k)
  if (dashed) ctx.setLineDash([Math.max(2, g.cell), Math.max(2, g.cell)])
  ctx.globalAlpha = 0.85
  ctx.beginPath()
  ordered.forEach((p, i) => {
    const sx = px(g, p.x)
    const sy = py(g, p.y)
    if (i === 0) ctx.moveTo(sx, sy)
    else ctx.lineTo(sx, sy)
  })
  ctx.stroke()
  ctx.setLineDash([])

  ctx.globalAlpha = 1
  ctx.fillStyle = colour
  const r = Math.max(1, Math.min(3, g.cell * 0.2))
  ctx.beginPath()
  for (const p of ordered) {
    ctx.moveTo(px(g, p.x) + r, py(g, p.y))
    ctx.arc(px(g, p.x), py(g, p.y), r, 0, Math.PI * 2)
  }
  ctx.fill()
  ctx.restore()
}

function drawSnakeThread(
  ctx: CanvasRenderingContext2D,
  g: Geometry,
  s: Snake,
  colour: string,
  weight: number,
): void {
  ctx.save()
  ctx.strokeStyle = colour
  ctx.lineWidth = Math.max(2, Math.min(weight * 2, g.cell * 0.45))
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(px(g, s.x0), py(g, s.y0))
  ctx.lineTo(px(g, s.x1), py(g, s.y1))
  ctx.stroke()
  ctx.restore()
}

function drawPath(ctx: CanvasRenderingContext2D, g: Geometry, path: readonly Point[]): void {
  if (path.length === 0) return
  ctx.save()
  ctx.strokeStyle = PALETTE.madder
  ctx.lineWidth = Math.max(1.6, Math.min(4, g.cell * 0.34))
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  path.forEach((p, i) => {
    const sx = px(g, p.x)
    const sy = py(g, p.y)
    if (i === 0) ctx.moveTo(sx, sy)
    else ctx.lineTo(sx, sy)
  })
  ctx.stroke()
  ctx.restore()
}
