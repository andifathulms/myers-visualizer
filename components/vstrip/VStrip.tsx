'use client'

import { useEffect, useRef, useState } from 'react'
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
 *
 * The strip is one tab stop, not one per cell. Every cell used to be
 * separately tabbable, which on the worst-case preset put 81 stops between
 * the player and everything below it — the ambiguity panel and the result
 * were the far side of eighty presses. Cells are peers in a list, so they get
 * the roving-tabindex treatment that applies to any such set: Tab reaches the
 * strip, arrows move within it, Home and End jump to the ends, Tab leaves.
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
  /** Named because a group of controls with no name is announced as nothing. */
  groupLabel: string
  /**
   * The length of A — the fixed reference each cell's bar is measured
   * against, so the strip's own profile advances forward as the search
   * does, the same way the frontier on the lattice does. Measuring against
   * the row's own max instead would keep every row looking equally full.
   * DESIGN.md §7.
   */
  maxX: number
}

export function VStrip({
  cells,
  currentD,
  highlightK,
  onHighlight,
  label,
  hint,
  idle,
  groupLabel,
  maxX,
}: Props) {
  /** Which cell carries the tab stop. Index, not k, so it survives a resize. */
  const [focused, setFocused] = useState(0)
  const listRef = useRef<HTMLOListElement>(null)

  // A new search rebuilds the strip; the old position may not exist any more.
  useEffect(() => {
    setFocused((index) => (index < cells.length ? index : 0))
  }, [cells.length])

  const move = (next: number) => {
    if (cells.length === 0) return
    const clamped = Math.max(0, Math.min(next, cells.length - 1))
    setFocused(clamped)
    // The tabindex has already moved with the state; focus follows it.
    const buttons = listRef.current?.querySelectorAll('button')
    buttons?.[clamped]?.focus()
  }

  /*
   * stopPropagation as well as preventDefault: the stepper listens for the
   * same arrows on the window to move the animation, and preventDefault does
   * not stop a bubbling event reaching it. Without this, one press moved the
   * cell *and* stepped the frame — which only looked fine in testing because
   * the timeline happened to be at its end and could not advance.
   */
  const handled = (event: React.KeyboardEvent<HTMLOListElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLOListElement>) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        handled(event)
        move(focused + 1)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        handled(event)
        move(focused - 1)
        break
      case 'Home':
        handled(event)
        move(0)
        break
      case 'End':
        handled(event)
        move(cells.length - 1)
        break
      default:
        break
    }
  }

  return (
    <Panel title={label} hint={hint}>
      <ol
        ref={listRef}
        // A set of related controls navigated as one. Native grouping elements
        // carry no keyboard semantics, and without a role the arrow keys would
        // be an undocumented behaviour on a plain list.
        role="toolbar"
        aria-label={groupLabel}
        aria-orientation="horizontal"
        className="flex flex-wrap gap-1.5"
        onKeyDown={onKeyDown}
        onMouseLeave={() => onHighlight(null)}
      >
        {cells.map((cell, index) => {
          const live = Math.abs(cell.k % 2) === Math.abs(currentD % 2)
          const active = highlightK === cell.k
          // x is a magnitude — how far the frontier has reached along this
          // diagonal — and it sat as a bare number beside a picture whose
          // whole subject is how far the frontier has reached. Measured
          // against maxX (the length of A), not this row's own max, so the
          // strip's profile visibly advances as d grows. DESIGN.md §7.
          const pct = Math.max(0, Math.min(100, Math.round((cell.x / Math.max(1, maxX)) * 100)))
          return (
            <li key={cell.k}>
              <button
                type="button"
                tabIndex={index === focused ? 0 : -1}
                onMouseEnter={() => onHighlight(cell.k)}
                onFocus={() => {
                  setFocused(index)
                  onHighlight(cell.k)
                }}
                onBlur={() => onHighlight(null)}
                aria-label={`k = ${cell.k}, x = ${cell.x}, y = ${cell.y}`}
                className={[
                  'flex w-[4rem] flex-col items-center rounded-lg border py-1 font-mono transition-colors',
                  active
                    ? 'border-madder bg-madder/10 text-madder'
                    : live
                      ? 'border-turmeric bg-turmeric/15 text-deepIndigo'
                      : 'border-rule bg-cotton/40 text-muted',
                ].join(' ')}
              >
                {/*
                  x is labelled because an unlabelled integer taught nothing:
                  the cell read "k0 / 5" and 5 could have been anything. y is
                  shown too, but as a plainly secondary value — the hint says
                  it is never stored and is recovered as x − k, which is the
                  reason V is one number per diagonal at all. Myers §2.

                  The subtraction itself is deliberately not printed in every
                  cell: at the input cap it would read "y=300−(-40)" eighty-one
                  times over, and the rule belongs stated once, not repeated.
                */}
                <span className="text-micro tracking-wide">k{cell.k}</span>
                {/*
                  Decorative: the bar restates x, which the text beneath
                  already gives a screen reader via the button's own label.
                */}
                <span
                  aria-hidden
                  className="mt-1 h-1 w-full overflow-hidden rounded-full bg-cotton"
                >
                  <span
                    className={[
                      'block h-full rounded-full',
                      active ? 'bg-madder' : live ? 'bg-turmeric' : 'bg-indigo/40',
                    ].join(' ')}
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="mt-1 text-fine tabular-nums">x {cell.x}</span>
                <span className="text-micro tabular-nums text-muted">y {cell.y}</span>
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
