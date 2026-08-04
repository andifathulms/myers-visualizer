'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { computeGeometry, pointAt, type Geometry, type Point } from '@/layout/lattice'
import { LatticeRenderer } from './render'
import { EMPTY_FRAME, type FrontierPoint, type LatticeFrame, type MatchGrid, type Snake } from './frame'

/** One d's worth of search, stamped onto the explored wash as the step passes. */
export type ExploredStamp = {
  readonly snakes: readonly Snake[]
  readonly frontier: readonly FrontierPoint[]
}

type Props = {
  n: number
  m: number
  matches: MatchGrid | null
  frame?: LatticeFrame
  /**
   * How many steps the current frame has passed, and how to get each one's
   * contribution to the explored wash. A prefix array would be allocated every
   * frame — at the input cap that is 135 000 elements, 60 times a second — and
   * storing the whole history would duplicate data the timeline already holds.
   */
  stampAt?: (index: number) => ExploredStamp
  stampCount?: number
  padding?: number
  onHoverPoint?: (p: Point | null) => void
  className?: string
  /**
   * Canvas is opaque to a screen reader, so the graph carries a description
   * and the same numbers appear as text in the stats panel and V strip.
   */
  label?: string
}

export function LatticeCanvas({
  n,
  m,
  matches,
  frame = EMPTY_FRAME,
  stampAt,
  stampCount = 0,
  padding = 24,
  onHoverPoint,
  className,
  label,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<LatticeRenderer | null>(null)
  const geometryRef = useRef<Geometry | null>(null)
  const stampedRef = useRef(0)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  useLayoutEffect(() => {
    const host = hostRef.current
    if (host === null) return
    const measure = () => {
      const rect = host.getBoundingClientRect()
      setSize({ w: Math.max(1, rect.width), h: Math.max(1, rect.height) })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(host)
    return () => ro.disconnect()
  }, [])

  // Renderer + static layer. Rebuilt only when geometry or matches change.
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null || size === null) return
    const geometry = computeGeometry(n, m, size.w, size.h, padding)
    const renderer = new LatticeRenderer(canvas, geometry, size.w, size.h)
    renderer.setScene(geometry, matches)
    rendererRef.current = renderer
    geometryRef.current = geometry
    stampedRef.current = 0
  }, [n, m, matches, size, padding])

  // Explored wash: stamp forward, rebuild only on a backward seek.
  useEffect(() => {
    const renderer = rendererRef.current
    if (renderer === null || stampAt === undefined) {
      rendererRef.current?.draw(frame)
      return
    }
    if (stampCount < stampedRef.current) {
      renderer.clearExplored()
      stampedRef.current = 0
    }
    for (let i = stampedRef.current; i < stampCount; i++) {
      const stamp = stampAt(i)
      renderer.stampExplored(stamp.snakes, stamp.frontier)
    }
    stampedRef.current = stampCount
    renderer.draw(frame)
  }, [stampAt, stampCount, frame])

  const handleMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (onHoverPoint === undefined) return
      const geometry = geometryRef.current
      const canvas = canvasRef.current
      if (geometry === null || canvas === null) return
      const rect = canvas.getBoundingClientRect()
      onHoverPoint(pointAt(geometry, event.clientX - rect.left, event.clientY - rect.top))
    },
    [onHoverPoint],
  )

  return (
    <div ref={hostRef} className={className ?? 'h-full w-full'}>
      <canvas
        ref={canvasRef}
        className="block"
        role="img"
        aria-label={label}
        onMouseMove={handleMove}
        onMouseLeave={() => onHoverPoint?.(null)}
      />
    </div>
  )
}
