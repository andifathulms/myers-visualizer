'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { computeGeometry } from '@/layout/lattice'
import { LatticeRenderer } from './render'
import { buildMatchGrid, type FrontierPoint, type Snake } from './frame'

/**
 * M0 render spike, CLAUDE.md working style: prove the render before the
 * algorithm. Drives the real renderer at 300 × 300 with a *synthetic*
 * frontier — no search runs here — and reports the frame budget.
 *
 * Two numbers, because they answer different questions:
 *   draw — CPU time inside stampExplored + draw, which is what the renderer
 *          controls and what a regression would show up in
 *   frame — the actual interval between animation frames, which is what the
 *           user experiences
 *
 * The result is also written to window.__myersBench so the headless runner
 * can read it. See scripts/bench-render.mjs.
 */
const SIZE = 300
const FRAMES = 240
const BUDGET_MS = 16.7
/**
 * The first frames include layer allocation, font work and JIT warm-up. They
 * are real, but they are not what "animates at 60fps" is asking about, so
 * they are discarded rather than left to skew the mean.
 */
const WARMUP = 20

export type BenchResult = {
  size: number
  frames: number
  /** Actual canvas pixels. A zero-size canvas would otherwise "pass" trivially. */
  canvasWidth: number
  canvasHeight: number
  drawMean: number
  drawP95: number
  frameMedian: number
  frameP95: number
  fps: number
  budgetMs: number
  pass: boolean
}

declare global {
  interface Window {
    __myersBench?: BenchResult
  }
}

// Deterministic pseudo-random sequences; a real search is not needed to
// measure draw cost, only a realistic match density.
function sequences(size: number): { a: number[]; b: number[] } {
  let seed = 0x2a3d5c
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed
  }
  const a: number[] = []
  const b: number[] = []
  for (let i = 0; i < size; i++) a.push(next() % 24)
  for (let i = 0; i < size; i++) b.push(next() % 24)
  return { a, b }
}

function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]
}

export function RenderBench() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [report, setReport] = useState<string>('running…')
  const { a, b } = useMemo(() => sequences(SIZE), [])
  const matches = useMemo(() => buildMatchGrid(a, b), [a, b])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const side = Math.min(900, window.innerWidth - 60)
    const geometry = computeGeometry(SIZE, SIZE, side, side, 20)
    const renderer = new LatticeRenderer(canvas, geometry, side, side)
    renderer.setScene(geometry, matches)

    let d = 0
    let frames = 0
    let raf = 0
    const draws: number[] = []
    const intervals: number[] = []
    let previous = 0

    const tick = (now: number) => {
      if (previous !== 0) intervals.push(now - previous)
      previous = now

      const started = performance.now()
      // Synthetic advancing frontier: one point per diagonal in −d…d.
      const frontier: FrontierPoint[] = []
      const snakes: Snake[] = []
      for (let k = -d; k <= d; k += 2) {
        const x = Math.min(SIZE, Math.max(0, Math.round((d + k) / 2) + (d % 7)))
        const y = Math.min(SIZE, Math.max(0, x - k))
        frontier.push({ k, x, y })
        if (k % 6 === 0) {
          const run = Math.min(6, SIZE - x, SIZE - y)
          if (run > 0) snakes.push({ x0: x, y0: y, x1: x + run, y1: y + run })
        }
      }
      renderer.stampExplored(snakes, frontier)
      renderer.draw({
        frontier,
        snakes,
        backwardFrontier: null,
        path: null,
        middleSnake: null,
        settledSnakes: [],
        region: null,
        highlightK: null,
        ghostPaths: [],
        ghostPathsCapped: false,
        contestedEdges: null,
      })

      draws.push(performance.now() - started)
      d += 2
      if (d > SIZE) d = 0
      frames++

      if (frames < FRAMES) {
        raf = requestAnimationFrame(tick)
        return
      }

      const measuredDraws = draws.slice(WARMUP)
      const measuredFrames = intervals.slice(WARMUP)
      const sortedDraws = [...measuredDraws].sort((p, q) => p - q)
      const sortedFrames = [...measuredFrames].sort((p, q) => p - q)
      const mean = (xs: readonly number[]) =>
        xs.length === 0 ? 0 : xs.reduce((s, v) => s + v, 0) / xs.length
      const median = percentile(sortedFrames, 0.5)

      const result: BenchResult = {
        size: SIZE,
        frames: measuredDraws.length,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        drawMean: mean(measuredDraws),
        drawP95: percentile(sortedDraws, 0.95),
        // Median, not mean: a single stalled frame should not describe the
        // other 200.
        frameMedian: median,
        frameP95: percentile(sortedFrames, 0.95),
        fps: median === 0 ? 0 : 1000 / median,
        budgetMs: BUDGET_MS,
        // The renderer passes if its own work fits the budget. Frame interval
        // depends on the host's refresh rate and compositor, so it is
        // reported but not the gate.
        pass: percentile(sortedDraws, 0.95) < BUDGET_MS,
      }
      window.__myersBench = result
      setReport(
        `${SIZE}×${SIZE} · ${frames} frames · draw mean ${result.drawMean.toFixed(2)} ms · ` +
          `p95 ${result.drawP95.toFixed(2)} ms · frame median ${result.frameMedian.toFixed(2)} ms ` +
          `(${result.fps.toFixed(1)} fps) · budget ${BUDGET_MS} ms · ${result.pass ? 'PASS' : 'FAIL'}`,
      )
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [matches])

  return (
    <main className="p-6">
      <h1 className="font-serif text-h2 font-semibold">Render spike</h1>
      <p className="mt-1 font-mono text-sm text-indigo" data-testid="bench-report">
        {report}
      </p>
      <canvas ref={canvasRef} className="mt-4 block" />
    </main>
  )
}
