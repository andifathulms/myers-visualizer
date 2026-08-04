import type { Dict } from '@/lib/i18n/dictionary'

/**
 * The colours carry meaning and the meaning is stated. madder is the answer —
 * the chosen path and the middle snake — and nothing else ever uses it.
 * PRD §9.
 */
export function Legend({ dict }: { dict: Dict }) {
  const t = dict.legend
  const items = [
    { label: t.match, className: 'bg-indigo/50' },
    { label: t.explored, className: 'bg-explored' },
    { label: t.frontier, className: 'bg-turmeric' },
    { label: t.path, className: 'bg-madder' },
  ]
  return (
    <div className="flex flex-wrap items-center gap-4 font-sans text-xs text-indigo">
      <span className="font-medium uppercase tracking-wide">{t.title}</span>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className={`inline-block h-2.5 w-4 rounded-sm ${item.className}`} />
          {item.label}
        </span>
      ))}
    </div>
  )
}
