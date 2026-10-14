'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { computeGeometry, px, py, type Point } from '@/layout/lattice'

export type OverlayRoute = {
  readonly key: string
  readonly points: readonly Point[]
  /** SVG dash pattern; the empty string is solid. */
  readonly dash: string
  /** The route under inspection is drawn as the answer, in madder. */
  readonly selected: boolean
}

/**
 * Every algorithm's route over one shared lattice. The grid and the diagonal
 * threads stay on the canvas beneath (invariant 11 — no element per cell);
 * this layer adds one polyline per algorithm, which is O(algorithms), not
 * O(N·M).
 *
 * It measures its own box and runs the same `computeGeometry` with the same
 * padding as `LatticeCanvas`, so the two layers agree to the pixel without
 * either knowing about the other. Cells stay square (DESIGN.md §2.10).
 *
 * Routes are told apart by dash pattern as well as colour, so the overlay
 * never relies on colour alone; the selected one is madder because on the
 * comparison page "the answer" is whichever route the reader is inspecting.
 */
export function RouteOverlay({
  n,
  m,
  routes,
  padding = 24,
}: {
  n: number
  m: number
  routes: readonly OverlayRoute[]
  padding?: number
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  useLayoutEffect(() => {
    const host = hostRef.current
    if (host === null) return
    const measure = () => {
      const rect = host.getBoundingClientRect()
      setSize({ w: Math.max(1, rect.width), h: Math.max(1, rect.height) })
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(host)
    return () => ro.disconnect()
  }, [])

  const geometry = size === null ? null : computeGeometry(n, m, size.w, size.h, padding)
  // Unselected first, so the selected route is drawn on top of any it shares.
  const ordered = [...routes].sort((p, q) => Number(p.selected) - Number(q.selected))

  return (
    <div ref={hostRef} aria-hidden className="pointer-events-none absolute inset-0">
      {geometry === null || size === null ? null : (
        <svg width={size.w} height={size.h} className="block">
          {ordered.map((route) => (
            <polyline
              key={route.key}
              points={route.points.map((p) => `${px(geometry, p.x)},${py(geometry, p.y)}`).join(' ')}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={route.dash === '' ? undefined : route.dash}
              strokeWidth={route.selected ? 3.5 : 2}
              className={route.selected ? 'stroke-madder' : 'stroke-ink/70'}
            />
          ))}
        </svg>
      )}
    </div>
  )
}
