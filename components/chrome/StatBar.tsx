import type { Dict } from '@/lib/i18n/dictionary'

/**
 * The numbers behind the picture — including the retained V cells, so the
 * O(D²) cost of recording is a figure on screen rather than a claim. §6.6
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
}: {
  dict: Dict
  d: number
  currentD: number
  n: number
  m: number
  snakes: number
  steps: number
  vCells: number
}) {
  const t = dict.graph
  const rows: { label: string; value: string }[] = [
    { label: t.d, value: `${currentD} / ${d}` },
    { label: t.tokens, value: `N=${n} M=${m}` },
    { label: t.snakes, value: String(snakes) },
    { label: t.steps, value: String(steps) },
    { label: t.memory, value: String(vCells) },
  ]
  return (
    <section aria-label={t.stats}>
      <h3 className="font-sans text-xs font-semibold uppercase tracking-wide text-indigo">
        {t.stats}
      </h3>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-indigo/80">{row.label}</dt>
            <dd className="tabular-nums text-deepIndigo">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
