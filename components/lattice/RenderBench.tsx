'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { computeGeometry } from '@/layout/lattice'
import { LatticeRenderer } from './render'
import { buildMatchGrid, type FrontierPoint, type Snake } from './frame'

/**
 * M0 render spike, CLAUDE.md working style: prove the render before the
 * algorithm. Drives the real renderer at 300 × 300 with a *synthetic*
 * frontier — no search runs here — and reports the frame budget.
 */
const SIZE = 300
const FRAMES = 240

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
    const durations: number[] = []

    const tick = () => {
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
        highlightK: null,
      })

      durations.push(performance.now() - started)
      d += 2
      if (d > SIZE) d = 0
      frames++
      if (frames < FRAMES) {
        raf = requestAnimationFrame(tick)
      } else {
        const sorted = [...durations].sort((p, q) => p - q)
        const mean = durations.reduce((s, v) => s + v, 0) / durations.length
        const p95 = sorted[Math.floor(sorted.length * 0.95)]
        setReport(
          `${SIZE}×${SIZE} · ${frames} frames · draw mean ${mean.toFixed(2)} ms · p95 ${p95.toFixed(
            2,
          )} ms · budget 16.7 ms · ${p95 < 16.7 ? 'PASS' : 'FAIL'}`,
        )
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [matches])

  return (
    <main className="p-6">
      <h1 className="font-serif text-2xl font-semibold">Render spike</h1>
      <p className="mt-1 font-mono text-sm text-indigo" data-testid="bench-report">
        {report}
      </p>
      <canvas ref={canvasRef} className="mt-4 block" />
    </main>
  )
}
