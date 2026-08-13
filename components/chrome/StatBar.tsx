import { Panel } from '@/components/ui/Panel'
import { format, type Dict } from '@/lib/i18n/dictionary'

/**
 * The numbers behind the picture — including the retained V cells, so the
 * O(D²) cost of recording is a figure on screen rather than a claim. §6.6
 *
 * D leads, at a size the rest of the panel does not compete with: it is the
 * one number that answers "how big was this change", and it is the number the
 * comparison page is arguing about.
 */
export function StatBar({
  dict,
  d,
  currentD,
  n,
  m,
  snakes,
  steps,
  vCells,
  naiveVCells,
}: {
  dict: Dict
  d: number
  currentD: number
  n: number
  m: number
  snakes: number
  steps: number
  vCells: number
  /** What the greedy recording would have retained, for linear-space mode. */
  naiveVCells: number | null
}) {
  const t = dict.graph
  const rows: { label: string; value: string }[] = [
    { label: t.tokens, value: `N=${n} M=${m}` },
    { label: t.snakes, value: String(snakes) },
    { label: t.steps, value: String(steps) },
    { label: t.memory, value: vCells === 0 ? '—' : String(vCells) },
  ]
  // §6.6: the O(D²) versus O(N+M) difference as a number on screen, not a claim.
  if (naiveVCells !== null) rows.push({ label: t.memoryNaive, value: String(naiveVCells) })

  return (
    <Panel title={t.stats} hint={t.statsHint}>
      {/*
        The figure is D itself — the answer — and progress toward it is said in
        words underneath. It used to read `0/2`, which put a third unrelated
        ratio on a page that already shows the stepper's frame count and the
        diff's contested-line counts in the same shape. Three "x of y" numbers
        meaning three different things is two too many.
      */}
      <div className="border-b border-rule pb-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-h2 tabular-nums leading-none text-deepIndigo">{d}</span>
          <span className="font-sans text-fine text-muted">{t.d}</span>
        </div>
        <p className="mt-1.5 font-sans text-fine tabular-nums text-muted">
          {format(t.dReached, { current: currentD })}
        </p>
      </div>

      <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 font-sans text-fine">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-muted">{row.label}</dt>
            <dd className="text-right font-mono tabular-nums text-deepIndigo">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  )
}
