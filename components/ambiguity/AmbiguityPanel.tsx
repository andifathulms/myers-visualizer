'use client'

import { Panel } from '@/components/ui/Panel'
import { COUNT_CAP, type Ambiguity } from '@/lib/diff/ambiguity'
import type { Dict } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/i18n/locales'

/**
 * States the fact plainly: several shortest scripts exist, and the algorithm
 * picks one by tie-breaking rather than by judgement. Then lets the user see
 * the alternatives — which is the whole point, because the alternative is
 * often the attribution a human would have chosen. §6.4
 *
 * The count is set large and first. It is the surprising number on the page —
 * "there were 3 equally correct answers and you were shown one of them" — and
 * it earns the size.
 */
type Props = {
  locale: Locale
  dict: Dict
  ambiguity: Ambiguity
  alternatives: number
  selected: number
  onSelect: (index: number) => void
}

export function AmbiguityPanel({
  locale,
  dict,
  ambiguity,
  alternatives,
  selected,
  onSelect,
}: Props) {
  const t = dict.graph
  const unique = ambiguity.count <= 1
  const tag = locale === 'id' ? 'id-ID' : 'en-GB'

  return (
    <Panel title={t.ambiguityTitle} hint={t.ambiguityHint} ariaLabel={t.ambiguityTitle}>
      {unique ? (
        <p className="font-sans text-[13px] leading-relaxed text-muted">{t.ambiguityUnique}</p>
      ) : (
        <>
          <p className="font-mono text-2xl leading-none tabular-nums text-deepIndigo">
            {ambiguity.truncated
              ? `≥ ${COUNT_CAP.toLocaleString(tag)}`
              : ambiguity.count.toLocaleString(tag)}
          </p>
          <p className="mt-1.5 font-sans text-[13px] leading-snug text-deepIndigo">
            {t.ambiguityCount}
          </p>
          <p className="mt-2 font-sans text-[13px] leading-relaxed text-muted">{t.ambiguityMany}</p>
        </>
      )}

      {alternatives > 1 ? (
        <div className="mt-4 border-t border-rule pt-3">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
            {t.altScript}
          </p>
          <p className="mt-1 font-sans text-[13px] leading-relaxed text-muted">{t.altScriptHint}</p>
          <ol className="mt-2 flex flex-wrap gap-1.5">
            {Array.from({ length: alternatives }, (_, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  aria-pressed={selected === index}
                  className={[
                    'h-8 w-8 rounded-lg border font-mono text-[13px] tabular-nums transition-colors',
                    selected === index
                      ? 'border-madder bg-madder/10 text-madder'
                      : 'border-rule bg-cotton/40 text-muted hover:border-indigo/60 hover:text-deepIndigo',
                  ].join(' ')}
                >
                  {index + 1}
                </button>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </Panel>
  )
}
