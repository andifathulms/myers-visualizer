import type { Point } from '@/layout/lattice'
import { thumbnail } from '@/layout/thumbnail'

/**
 * One route through the edit graph as a small picture — an alternative
 * minimal script in the ambiguity picker, an example in the preset gallery.
 * Decorative by default: whatever it sits in carries the accessible name.
 *
 * `tone` follows the lattice: `path` is madder, which is only ever the
 * answer on screen; `ghost` is the indigo the lattice uses for the other
 * minimal paths.
 */
export function RouteThumb({
  route,
  n,
  m,
  size = 56,
  tone = 'ghost',
}: {
  route: readonly Point[]
  n: number
  m: number
  size?: number
  tone?: 'path' | 'ghost'
}) {
  const t = thumbnail(route, n, m, size)
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${t.width} ${t.height}`}
      width={t.width}
      height={t.height}
      className="block"
    >
      <rect
        x={t.frame.x}
        y={t.frame.y}
        width={t.frame.w}
        height={t.frame.h}
        className="fill-surface stroke-rule"
        strokeWidth={1}
      />
      <polyline
        points={t.points}
        fill="none"
        strokeWidth={Math.max(1.6, Math.min(3, t.cell * 0.35))}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={tone === 'path' ? 'stroke-madder' : 'stroke-indigo/60'}
      />
    </svg>
  )
}
