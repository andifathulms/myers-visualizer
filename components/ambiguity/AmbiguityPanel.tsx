'use client'

import { COUNT_CAP, type Ambiguity } from '@/lib/diff/ambiguity'
import { format, type Dict } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/i18n/locales'

/**
 * States the fact plainly: several shortest scripts exist, and the algorithm
 * picks one by tie-breaking rather than by judgement. Then lets the user see
 * the alternatives — which is the whole point, because the alternative is
 * often the attribution a human would have chosen. §6.4
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

  return (
    <section aria-label={t.ambiguityUnique}>
      <h3 className="font-sans text-xs font-semibold uppercase tracking-wide text-indigo">
        {locale === 'id' ? 'Ambiguitas' : 'Ambiguity'}
      </h3>

      <p className="mt-2 font-sans text-xs leading-relaxed text-indigo">
        {unique ? (
          t.ambiguityUnique
        ) : (
          <>
            <span className="font-mono text-deepIndigo">
              {ambiguity.truncated
                ? `≥ ${COUNT_CAP.toLocaleString(locale === 'id' ? 'id-ID' : 'en-GB')}`
                : format(t.ambiguityCount, {
                    n: ambiguity.count.toLocaleString(locale === 'id' ? 'id-ID' : 'en-GB'),
                  })}
            </span>{' '}
            {t.ambiguityMany}
          </>
        )}
      </p>

      {alternatives > 1 ? (
        <div className="mt-3">
          <span className="font-sans text-xs text-indigo">{t.altScript}</span>
          <ol className="mt-1 flex flex-wrap gap-1">
            {Array.from({ length: alternatives }, (_, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  aria-pressed={selected === index}
                  className={[
                    'rounded border px-2 py-0.5 font-mono text-xs',
                    selected === index
                      ? 'border-madder bg-madder/10 text-madder'
                      : 'border-indigo/30 text-indigo hover:border-indigo',
                  ].join(' ')}
                >
                  {index + 1}
                </button>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  )
}
