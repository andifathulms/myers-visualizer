'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Playback clock. The engine has no clock in it — this is the only place time
 * enters the product.
 *
 * prefers-reduced-motion disables autoplay entirely, so stepping stays
 * available and instantaneous. PRD §9.
 */
const BASE_STEPS_PER_SECOND = 12

export function usePlayback(total: number, onFrame: (updater: (frame: number) => number) => void) {
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [reducedMotion, setReducedMotion] = useState(false)
  const rafRef = useRef(0)
  const carryRef = useRef(0)
  const lastRef = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(query.matches)
    const listener = (event: MediaQueryListEvent) => setReducedMotion(event.matches)
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }, [])

  const stop = useCallback(() => setPlaying(false), [])

  useEffect(() => {
    if (!playing) return
    lastRef.current = performance.now()
    carryRef.current = 0

    const tick = (now: number) => {
      const elapsed = (now - lastRef.current) / 1000
      lastRef.current = now
      carryRef.current += elapsed * BASE_STEPS_PER_SECOND * speed
      const advance = Math.floor(carryRef.current)
      if (advance > 0) {
        carryRef.current -= advance
        onFrame((frame) => {
          const next = frame + advance
          if (next >= total) {
            setPlaying(false)
            return total
          }
          return next
        })
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, speed, total, onFrame])

  const toggle = useCallback(() => {
    if (reducedMotion) return // autoplay off; the step controls still work
    setPlaying((value) => !value)
  }, [reducedMotion])

  return { playing, speed, setSpeed, toggle, stop, reducedMotion }
}
