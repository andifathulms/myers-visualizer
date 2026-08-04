'use client'

import { formatHunkHeader, LINE_PREFIX, type Hunk, type HunkLine } from '@/lib/hunks'

/**
 * Unified diff of the recovered script. Each line links back to the graph
 * segment that produced it: click a `-` to see the horizontal move, a `+` for
 * the vertical one. §6.3
 */
type Props = {
  hunks: readonly Hunk[]
  selectedOp: number | null
  onSelectOp: (opIndex: number | null) => void
  emptyLabel: string
}

export function Hunks({ hunks, selectedOp, onSelectOp, emptyLabel }: Props) {
  if (hunks.length === 0) {
    return <p className="font-sans text-sm text-indigo">{emptyLabel}</p>
  }
  return (
    <div className="overflow-x-auto">
      {hunks.map((hunk, index) => (
        <div key={index} className="mb-4">
          <div className="font-mono text-xs text-indigo/70">{formatHunkHeader(hunk)}</div>
          <ol className="mt-1">
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
      ? 'text-madder'
      : line.type === 'insert'
        ? 'text-indigo'
        : 'text-deepIndigo/70'
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(selected ? null : line.opIndex)}
        className={[
          'flex w-full gap-2 whitespace-pre px-1 text-left font-mono text-xs leading-relaxed',
          selected ? 'bg-turmeric/25' : 'hover:bg-indigo/5',
          tone,
        ].join(' ')}
      >
        <span className="w-8 shrink-0 select-none text-right tabular-nums opacity-50">
          {line.aIndex === null ? '' : line.aIndex + 1}
        </span>
        <span className="w-8 shrink-0 select-none text-right tabular-nums opacity-50">
          {line.bIndex === null ? '' : line.bIndex + 1}
        </span>
        <span className="w-3 shrink-0 select-none">{LINE_PREFIX[line.type]}</span>
        <span>{line.text === '' ? ' ' : line.text}</span>
      </button>
    </li>
  )
}
