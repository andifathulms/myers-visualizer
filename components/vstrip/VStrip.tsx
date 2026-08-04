'use client'

/**
 * The V array as an indexed strip, one cell per diagonal k. §6.2
 *
 * This is the data structure the algorithm actually manipulates; seeing it
 * move beside the geometry is what makes the code legible afterwards. Hovering
 * a k cell highlights that diagonal in the lattice.
 *
 * k is negative for half the strip, and it is labelled as such — the offset is
 * an implementation detail of the array, not of the idea.
 */
export type VCell = { readonly k: number; readonly x: number; readonly y: number }

type Props = {
  cells: readonly VCell[]
  /** Diagonals belonging to the current d, drawn as the live edge. */
  currentD: number
  highlightK: number | null
  onHighlight: (k: number | null) => void
  label: string
  hint: string
}

export function VStrip({ cells, currentD, highlightK, onHighlight, label, hint }: Props) {
  return (
    <section aria-label={label}>
      <h3 className="font-sans text-xs font-semibold uppercase tracking-wide text-indigo">
        {label}
      </h3>
      <p className="mt-1 font-sans text-xs text-indigo/80">{hint}</p>
      <ol
        className="mt-3 flex flex-wrap gap-1"
        onMouseLeave={() => onHighlight(null)}
      >
        {cells.map((cell) => {
          const live = Math.abs(cell.k % 2) === Math.abs(currentD % 2)
          const active = highlightK === cell.k
          return (
            <li key={cell.k}>
              <button
                type="button"
                onMouseEnter={() => onHighlight(cell.k)}
                onFocus={() => onHighlight(cell.k)}
                onBlur={() => onHighlight(null)}
                aria-label={`k = ${cell.k}, x = ${cell.x}, y = ${cell.y}`}
                aria-pressed={active}
                className={[
                  'flex w-12 flex-col items-center rounded border px-1 py-0.5 font-mono text-[11px] leading-tight transition-colors',
                  active
                    ? 'border-madder bg-madder/10 text-madder'
                    : live
                      ? 'border-turmeric bg-turmeric/10 text-deepIndigo'
                      : 'border-indigo/25 text-indigo',
                ].join(' ')}
              >
                <span className="text-[9px] uppercase tracking-wide opacity-70">k{cell.k}</span>
                <span className="tabular-nums">{cell.x}</span>
              </button>
            </li>
          )
        })}
        {cells.length === 0 ? (
          <li className="font-mono text-xs text-indigo/60">—</li>
        ) : null}
      </ol>
    </section>
  )
}
