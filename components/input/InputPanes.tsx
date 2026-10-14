'use client'

import { GRANULARITIES, type Granularity } from '@/lib/tokenize'
import { ALGORITHMS, type AlgorithmId } from '@/lib/diff/types'
import { PRESETS } from '@/data/presets'
import { ShareLink } from '@/components/chrome/ShareLink'
import { useState } from 'react'
import { Field, Segmented, Select, Toggle } from '@/components/ui/controls'
import { format, type Dict } from '@/lib/i18n/dictionary'
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
  'myers-linear': 'Linear Myers',
  patience: 'Patience',
  histogram: 'Histogram',
}

/**
 * A toolbar first, the texts second. Most visitors arrive from a shared link
 * or pick an example, so the two panes used to push the lattice below the
 * fold for a control almost nobody touched first. The toolbar holds every
 * setting in one row, with each option visible — four algorithms and three
 * granularities were hidden behind selects — and the texts open as a drawer
 * from the summary that says how big each side is.
 *
 * The example picker stays first in the bar and in the tab order: for a
 * visitor with no text of their own to hand, picking one is the shortest
 * path to seeing anything happen at all.
 *
 * The panes are always in the DOM, hidden rather than unmounted, so the
 * labels, the shared-link round trip and anything holding a reference to
 * them keep working when the drawer is closed.
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
  const [open, setOpen] = useState(false)
  /** Phone only: the settings row folds away so the lattice is on the first screen. */
  const [settings, setSettings] = useState(false)

  return (
    <section className="font-sans">
      <div className="card flex flex-wrap items-end gap-x-4 gap-y-3 p-3">
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

        {/*
          On a phone every setting stacked into a full screen of controls
          before the lattice appeared. The example picker stays; the rest
          folds behind one button there and is always open from `sm`.
        */}
        <button
          type="button"
          onClick={() => setSettings((value) => !value)}
          aria-expanded={settings}
          aria-controls="toolbar-settings"
          className="flex h-9 items-center gap-1.5 rounded-ctl border border-rule bg-surface px-3 text-fine text-ink sm:hidden"
        >
          {t.options}
          <span aria-hidden>{settings ? '▴' : '▾'}</span>
        </button>

        <div
          id="toolbar-settings"
          className={`${settings ? 'flex' : 'hidden'} w-full flex-wrap items-end gap-x-4 gap-y-3 sm:flex sm:w-auto sm:flex-1`}
        >
          {algorithm !== undefined && onAlgorithm !== undefined ? (
            <Segmented
              name="algorithm"
              label={t.algorithm}
              value={algorithm}
              onChange={onAlgorithm}
              options={ALGORITHMS.map((id) => ({ value: id, label: ALGORITHM_LABELS[id] }))}
            />
          ) : null}

          <Segmented
            name="granularity"
            label={t.granularity}
            value={granularity}
            onChange={onGranularity}
            options={GRANULARITIES.map((g) => ({ value: g, label: label[g] }))}
          />

          <Toggle checked={ignoreWhitespace} onChange={onIgnoreWhitespace}>
            {t.ignoreWhitespace}
          </Toggle>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="texts-drawer"
            className="flex h-9 items-center gap-2 rounded-ctl border border-dashed border-rule bg-surface px-3 text-fine text-ink transition-colors hover:border-indigo/60"
          >
            <span className="font-mono tabular-nums text-muted">
              {format(t.textsSummary, {
                a: count(aText, granularity),
                b: count(bText, granularity),
                unit: t.unit[granularity],
              })}
            </span>
            <span className="font-medium underline decoration-rule underline-offset-4">
              {open ? t.hideTexts : t.editTexts}
            </span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onSwap}
              className="flex h-9 items-center gap-1.5 rounded-ctl border border-rule bg-surface px-3 text-fine text-ink transition-colors hover:border-indigo/60"
            >
              <span aria-hidden>⇄</span>
              {t.swap}
            </button>
            <ShareLink url={shareUrl} dict={dict} />
          </div>
        </div>
      </div>

      <div id="texts-drawer" hidden={!open} className="card mt-3 p-3">
        <div className="relative grid gap-4 sm:grid-cols-2">
          <Pane id="pane-a" label={t.sideA} value={aText} onChange={onA} />
          <Pane id="pane-b" label={t.sideB} value={bText} onChange={onB} />
        </div>
        {/*
          Granularity looks like a display preference and is not one: it
          decides what the search compares at all, and so what "the same"
          means. Said here, beside the text it carves up, rather than left to
          one preset's description, which was the only place on the site that
          mentioned it — and kept out of the toolbar row, where three lines of
          it pushed the lattice below the fold for everyone.
        */}
        <p className="measure mt-3 text-fine text-muted">{t.granularityWhy}</p>
      </div>
    </section>
  )
}

/**
 * How many elements a side has at this granularity, for the drawer's summary.
 * A display count, not the tokenizer: it only has to agree with what a reader
 * would count, and it never feeds the search.
 */
function count(text: string, granularity: Granularity): number {
  if (text === '') return 0
  switch (granularity) {
    case 'line':
      return text.split('\n').length
    case 'word':
      return text.split(/\s+/).filter((word) => word !== '').length
    case 'char':
      return [...text].length
    default: {
      const never: never = granularity
      return never
    }
  }
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
        className="w-full resize-y rounded-card border border-rule bg-sunken p-3 font-mono text-fine text-ink focus:border-indigo focus:outline-none"
      />
    </div>
  )
}
