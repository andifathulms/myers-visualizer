'use client'

import { Panel } from '@/components/ui/Panel'

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
  /** Shown before the first step, in place of a bare em dash. */
  idle: string
}

export function VStrip({ cells, currentD, highlightK, onHighlight, label, hint, idle }: Props) {
  return (
    <Panel title={label} hint={hint} ariaLabel={label}>
      <ol
        className="flex flex-wrap gap-1.5"
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
                  'flex w-[3.25rem] flex-col items-center rounded-lg border py-1 font-mono transition-colors',
                  active
                    ? 'border-madder bg-madder/10 text-madder'
                    : live
                      ? 'border-turmeric bg-turmeric/15 text-deepIndigo'
                      : 'border-rule bg-cotton/40 text-muted',
                ].join(' ')}
              >
                <span className="text-micro tracking-wide">k{cell.k}</span>
                <span className="text-fine tabular-nums">{cell.x}</span>
              </button>
            </li>
          )
        })}
        {cells.length === 0 ? (
          // An em dash says "no data" and leaves the reader to guess whether
          // that is a state or a fault. This says which.
          <li className="font-sans text-fine text-muted">{idle}</li>
        ) : null}
      </ol>
    </Panel>
  )
}
