'use client'

import { GRANULARITIES, type Granularity } from '@/lib/tokenize'
import { ALGORITHMS, type AlgorithmId } from '@/lib/diff/types'
import { PRESETS } from '@/data/presets'
import { ShareLink } from '@/components/chrome/ShareLink'
import { Field, Select, Toggle } from '@/components/ui/controls'
import type { Dict } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/i18n/locales'

type Props = {
  locale: Locale
  dict: Dict
  aText: string
  bText: string
  granularity: Granularity
  ignoreWhitespace: boolean
  onA: (value: string) => void
  onB: (value: string) => void
  onGranularity: (value: Granularity) => void
  onIgnoreWhitespace: (value: boolean) => void
  onSwap: () => void
  onPreset: (id: string) => void
  presetId: string | null
  shareUrl: string
  /** Omitted on the comparison page, which runs every algorithm at once. */
  algorithm?: AlgorithmId
  onAlgorithm?: (value: AlgorithmId) => void
}

/** Algorithm names stay in English, as all algorithm terms do. */
const ALGORITHM_LABELS: Record<AlgorithmId, string> = {
  myers: 'Myers',
  'myers-linear': 'Myers — linear space',
  patience: 'Patience',
  histogram: 'Histogram',
}

/**
 * Two panes and a settings bar. The presets sit first in the bar and in the
 * tab order: for a visitor with no text of their own to hand, picking one is
 * the shortest path to seeing anything happen at all.
 *
 * Every control is labelled above rather than beside it. The old single
 * wrapping row of `label: [select]` pairs re-flowed at narrow widths into
 * labels sitting next to the wrong control.
 */
export function InputPanes({
  locale,
  dict,
  aText,
  bText,
  granularity,
  ignoreWhitespace,
  onA,
  onB,
  onGranularity,
  onIgnoreWhitespace,
  onSwap,
  onPreset,
  presetId,
  shareUrl,
  algorithm,
  onAlgorithm,
}: Props) {
  const t = dict.input
  const label: Record<Granularity, string> = { line: t.line, word: t.word, char: t.char }

  return (
    <section className="font-sans">
      <div className="relative grid gap-4 sm:grid-cols-2">
        <Pane id="pane-a" label={t.sideA} value={aText} onChange={onA} />
        <Pane id="pane-b" label={t.sideB} value={bText} onChange={onB} />

        {/*
          The swap sits on the seam between the two panes, where the gesture
          it performs is: it is the one control whose meaning is spatial.
        */}
        <button
          type="button"
          onClick={onSwap}
          title={t.swap}
          aria-label={t.swap}
          className="absolute left-1/2 top-1/2 hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-rule bg-paper font-mono text-sm text-indigo shadow-sm transition-colors hover:border-indigo hover:text-deepIndigo sm:flex"
        >
          ⇄
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-rule bg-paper/70 p-3">
        <Field label={t.presets} htmlFor="preset">
          <Select
            id="preset"
            value={presetId ?? ''}
            onChange={(event) => onPreset(event.target.value)}
            className="max-w-[16rem]"
          >
            <option value="">—</option>
            {PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.title[locale]}
              </option>
            ))}
          </Select>
        </Field>

        {algorithm !== undefined && onAlgorithm !== undefined ? (
          <Field label={t.algorithm} htmlFor="algorithm">
            <Select
              id="algorithm"
              value={algorithm}
              onChange={(event) => onAlgorithm(event.target.value as AlgorithmId)}
            >
              {ALGORITHMS.map((id) => (
                <option key={id} value={id}>
                  {ALGORITHM_LABELS[id]}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        <Field label={t.granularity} htmlFor="granularity">
          <Select
            id="granularity"
            value={granularity}
            onChange={(event) => onGranularity(event.target.value as Granularity)}
          >
            {GRANULARITIES.map((g) => (
              <option key={g} value={g}>
                {label[g]}
              </option>
            ))}
          </Select>
        </Field>

        <Toggle checked={ignoreWhitespace} onChange={onIgnoreWhitespace}>
          {t.ignoreWhitespace}
        </Toggle>

        {/* Swap again, for the narrow layout where the seam button is hidden. */}
        <button
          type="button"
          onClick={onSwap}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-rule bg-paper px-3 text-fine text-deepIndigo hover:border-indigo/60 sm:hidden"
        >
          <span aria-hidden>⇄</span>
          {t.swap}
        </button>

        <div className="ml-auto">
          <ShareLink url={shareUrl} dict={dict} />
        </div>
      </div>

      {/*
        Granularity looks like a display preference and is not one: it decides
        what the search compares at all, and so what "the same" means. Said
        beside the control rather than left to one preset's description, which
        was the only place on the site that mentioned it.
      */}
      <p className="measure mt-2 font-sans text-fine text-muted">{t.granularityWhy}</p>
    </section>
  )
}

function Pane({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const lines = value === '' ? 0 : value.split('\n').length
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className="font-sans text-micro font-semibold uppercase tracking-[0.07em] text-muted"
        >
          {label}
        </label>
        <span aria-hidden className="font-mono text-micro tabular-nums text-muted">
          {lines}
        </span>
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        rows={8}
        className="w-full resize-y rounded-xl border border-rule bg-paper p-3 font-mono text-fine text-deepIndigo focus:border-indigo focus:outline-none"
      />
    </div>
  )
}
