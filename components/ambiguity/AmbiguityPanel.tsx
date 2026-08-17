'use client'

import { Panel } from '@/components/ui/Panel'
import { Toggle } from '@/components/ui/controls'
import { COUNT_CAP, type Ambiguity } from '@/lib/diff/ambiguity'
import { format, type Dict } from '@/lib/i18n/dictionary'
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
 *
 * The picker below selects which script is drawn *solid* on the lattice and
 * shown in the diff output — every other minimal script is already drawn
 * ghosted, regardless of the picker, since the claim is the product and not
 * something a click should have to unlock. DESIGN.md §4.3.
 */
type Props = {
  locale: Locale
  dict: Dict
  ambiguity: Ambiguity
  alternatives: number
  selected: number
  onSelect: (index: number) => void
  /** Whether the lattice draws the ghosted alternatives and contested tint. Default true. */
  showAlternatives: boolean
  onToggleShow: (show: boolean) => void
  /** True when more minimal paths exist than the lattice draws individually. */
  ghostPathsCapped: boolean
  /** The cap itself, for the capped-state copy. */
  ghostCap: number
}

export function AmbiguityPanel({
  locale,
  dict,
  ambiguity,
  alternatives,
  selected,
  onSelect,
  showAlternatives,
  onToggleShow,
  ghostPathsCapped,
  ghostCap,
}: Props) {
  const t = dict.graph
  const unique = ambiguity.count <= 1
  const tag = locale === 'id' ? 'id-ID' : 'en-GB'
  const countLabel = ambiguity.truncated
    ? `≥ ${COUNT_CAP.toLocaleString(tag)}`
    : ambiguity.count.toLocaleString(tag)

  return (
    <Panel title={t.ambiguityTitle} hint={t.ambiguityHint}>
      {unique ? (
        <p className="font-sans text-fine text-muted">{t.ambiguityUnique}</p>
      ) : (
        <>
          <p className="font-mono text-h2 leading-none tabular-nums text-deepIndigo">{countLabel}</p>
          <p className="mt-1.5 font-sans text-fine text-deepIndigo">
            {t.ambiguityCount}
          </p>
          <p className="mt-2 font-sans text-fine text-muted">{t.ambiguityMany}</p>
          {/*
            Where the number came from. The search never produces it — it finds
            one script and stops — so a count sitting beside the search invites
            the reading that the search counted them.
          */}
          <p className="mt-2 font-sans text-fine text-muted">{t.ambiguityWhy}</p>

          {/*
            Default is show — the claim is the product, not something a click
            should have to unlock. This is a control, not a disclosure.
            DESIGN.md §4.3.
          */}
          <div className="mt-3">
            <Toggle checked={showAlternatives} onChange={onToggleShow}>
              {t.ambiguityShowToggle}
            </Toggle>
          </div>

          {showAlternatives && ghostPathsCapped ? (
            <p className="mt-2 font-sans text-fine text-muted">
              {format(t.ambiguityCapped, { count: countLabel, cap: ghostCap })}
            </p>
          ) : null}
        </>
      )}

      {alternatives > 1 ? (
        <div className="mt-4 border-t border-rule pt-3">
          <p className="font-sans text-micro font-semibold uppercase tracking-[0.07em] text-muted">
            {t.altScript}
          </p>
          <p className="mt-1 font-sans text-fine text-muted">{t.altScriptHint}</p>
          <ol className="mt-2 flex flex-wrap gap-1.5">
            {Array.from({ length: alternatives }, (_, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  aria-pressed={selected === index}
                  className={[
                    'h-8 w-8 rounded-lg border font-mono text-fine tabular-nums transition-colors',
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
