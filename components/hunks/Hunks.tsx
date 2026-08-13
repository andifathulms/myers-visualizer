'use client'

import { formatHunkHeader, LINE_PREFIX, type Hunk, type HunkLine } from '@/lib/hunks'
import { format } from '@/lib/i18n/dictionary'
import type { OpShare } from '@/lib/diff/ambiguity'

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
  /**
   * Per-operation contestedness, parallel to the script. Null when the count
   * saturated and there is no exact share to state. §6.4
   */
  shares?: readonly OpShare[] | null
  /** Total minimal scripts, for the "3 of 12" reading. */
  totalScripts?: number
  /** Rendered into the badge with {used} and {total}. */
  shareLabel?: string
}

export function Hunks({
  hunks,
  selectedOp,
  onSelectOp,
  emptyLabel,
  shares = null,
  totalScripts = 1,
  shareLabel = '{used}/{total}',
}: Props) {
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
          <div className="border-b border-rule bg-cotton/50 px-3 py-1.5 font-mono text-micro text-muted">
            {formatHunkHeader(hunk)}
          </div>
          <ol className="py-1">
            {hunk.lines.map((line) => (
              <Line
                key={line.opIndex}
                line={line}
                selected={selectedOp === line.opIndex}
                onSelect={onSelectOp}
                share={shares === null ? null : (shares[line.opIndex] ?? null)}
                totalScripts={totalScripts}
                shareLabel={shareLabel}
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
  share,
  totalScripts,
  shareLabel,
}: {
  line: HunkLine
  selected: boolean
  onSelect: (opIndex: number | null) => void
  share: OpShare | null
  totalScripts: number
  shareLabel: string
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
          'flex w-full gap-2 whitespace-pre px-3 text-left font-mono text-fine leading-6',
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
        <span className="flex-1">{line.text === '' ? ' ' : line.text}</span>
        {/*
          Only contested lines are marked. Badging every line would be noise
          and would bury the finding: on a typical input almost the whole diff
          is forced, and the two or three lines that are not are the answer to
          "why did it blame that line".
        */}
        {share === null || share.forced ? null : (
          <span className="shrink-0 select-none pl-3 text-micro tabular-nums text-muted">
            {format(shareLabel, { used: share.scripts, total: totalScripts })}
          </span>
        )}
      </button>
    </li>
  )
}
