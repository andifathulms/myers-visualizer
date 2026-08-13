import { BRAND } from '@/lib/palette'

/**
 * The mark: the shortest-path staircase through an edit graph, starting at
 * the cream dot and ending at the red one — the moment the attribution is
 * decided. It is the product's whole thesis at 20px.
 *
 * This is the one-bend form. The brand kit is explicit that the full
 * three-bend path must never be rendered below 40px, where it silts up into a
 * smudge; every use in the interface is smaller than that, so the simplified
 * geometry is the only one here. The three-bend master is in `exports/` and
 * ships as the PNG icon set, where the sizes are large enough to earn it.
 */
export function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="shrink-0"
    >
      <rect width="100" height="100" rx="22" fill={BRAND.ink} />
      <polyline
        points="22,78 22,50 50,50 50,22 78,22"
        fill="none"
        stroke={BRAND.insert}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="78" r="8" fill={BRAND.paper} />
      <circle cx="78" cy="22" r="8" fill={BRAND.delete} />
    </svg>
  )
}
