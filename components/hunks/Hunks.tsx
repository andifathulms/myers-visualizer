'use client'

import { formatHunkHeader, LINE_PREFIX, type Hunk, type HunkLine } from '@/lib/hunks'

/**
 * Unified diff of the recovered script. Each line links back to the graph
 * segment that produced it: click a `-` to see the horizontal move, a `+` for
 * the vertical one. §6.3
 *
 * Added and removed lines are tinted, not merely coloured: colour alone is a
 * weak signal at 13px, and the sign in the gutter stays there for anyone who
 * cannot see the tint at all. Neither uses madder — in this project madder
 * means "this is the answer", and a deleted line is not an answer.
 */
type Props = {
  hunks: readonly Hunk[]
  selectedOp: number | null
  onSelectOp: (opIndex: number | null) => void
  emptyLabel: string
}

export function Hunks({ hunks, selectedOp, onSelectOp, emptyLabel }: Props) {
  if (hunks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-rule px-4 py-6 text-center font-sans text-sm text-muted">
        {emptyLabel}
      </p>
    )
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-rule bg-paper">
      {hunks.map((hunk, index) => (
        <div key={index} className="border-b border-rule last:border-0">
          <div className="border-b border-rule bg-cotton/50 px-3 py-1.5 font-mono text-[11px] text-muted">
            {formatHunkHeader(hunk)}
          </div>
          <ol className="py-1">
            {hunk.lines.map((line) => (
              <Line
                key={line.opIndex}
                line={line}
                selected={selectedOp === line.opIndex}
                onSelect={onSelectOp}
              />
            ))}
          </ol>
        </div>
      ))}
    </div>
  )
}

function Line({
  line,
  selected,
  onSelect,
}: {
  line: HunkLine
  selected: boolean
  onSelect: (opIndex: number | null) => void
}) {
  const tone =
    line.type === 'delete'
      ? 'bg-removed/8 text-removed'
      : line.type === 'insert'
        ? 'bg-added/8 text-added'
        : 'text-deepIndigo/75'
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(selected ? null : line.opIndex)}
        className={[
          'flex w-full gap-2 whitespace-pre px-3 text-left font-mono text-[13px] leading-6',
          selected ? 'bg-turmeric/30 text-deepIndigo' : `${tone} hover:brightness-[0.97]`,
        ].join(' ')}
      >
        <span className="w-7 shrink-0 select-none text-right tabular-nums text-muted/60">
          {line.aIndex === null ? '' : line.aIndex + 1}
        </span>
        <span className="w-7 shrink-0 select-none text-right tabular-nums text-muted/60">
          {line.bIndex === null ? '' : line.bIndex + 1}
        </span>
        <span className="w-3 shrink-0 select-none font-medium">{LINE_PREFIX[line.type]}</span>
        <span>{line.text === '' ? ' ' : line.text}</span>
      </button>
    </li>
  )
}
