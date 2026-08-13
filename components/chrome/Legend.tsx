import type { Dict } from '@/lib/i18n/dictionary'

/**
 * The colours carry meaning and the meaning is stated. madder is the answer —
 * the chosen path and the middle snake — and nothing else ever uses it.
 * PRD §9.
 *
 * Each entry now carries a plain-language gloss as well as its name:
 * "frontier" is a term of art, "how far the search has reached" is not, and
 * the legend is exactly where a reader looks when they do not know one.
 */
export function Legend({ dict }: { dict: Dict }) {
  const t = dict.legend
  const items = [
    { label: t.match, hint: t.matchHint, className: 'bg-indigo/60' },
    { label: t.explored, hint: t.exploredHint, className: 'bg-explored' },
    { label: t.frontier, hint: t.frontierHint, className: 'bg-turmeric' },
    { label: t.path, hint: t.pathHint, className: 'bg-madder' },
  ]
  return (
    <ul aria-label={t.title} className="flex flex-wrap gap-x-5 gap-y-2 font-sans text-fine">
      {items.map((item) => (
        <li key={item.label} className="flex items-baseline gap-2">
          <span
            aria-hidden
            className={`inline-block h-2.5 w-4 shrink-0 translate-y-px rounded-sm ${item.className}`}
          />
          <span className="text-deepIndigo">{item.label}</span>
          <span className="text-muted">— {item.hint}</span>
        </li>
      ))}
    </ul>
  )
}
