'use client'

import { GRANULARITIES, type Granularity } from '@/lib/tokenize'
import { PRESETS } from '@/data/presets'
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
}

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
}: Props) {
  const t = dict.input
  const label: Record<Granularity, string> = { line: t.line, word: t.word, char: t.char }

  return (
    <section className="font-sans text-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <Pane label={t.sideA} value={aText} onChange={onA} />
        <Pane label={t.sideB} value={bText} onChange={onB} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <label className="flex items-center gap-1">
          <span className="text-indigo">{t.granularity}</span>
          <select
            value={granularity}
            onChange={(event) => onGranularity(event.target.value as Granularity)}
            className="rounded border border-indigo/30 bg-cotton px-2 py-1"
          >
            {GRANULARITIES.map((g) => (
              <option key={g} value={g}>
                {label[g]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={ignoreWhitespace}
            onChange={(event) => onIgnoreWhitespace(event.target.checked)}
            className="accent-indigo"
          />
          <span className="text-indigo">{t.ignoreWhitespace}</span>
        </label>

        <button
          type="button"
          onClick={onSwap}
          className="rounded border border-indigo/30 px-2 py-1 hover:border-indigo"
        >
          {t.swap}
        </button>

        <label className="flex items-center gap-1">
          <span className="text-indigo">{t.presets}</span>
          <select
            value={presetId ?? ''}
            onChange={(event) => onPreset(event.target.value)}
            className="rounded border border-indigo/30 bg-cotton px-2 py-1"
          >
            <option value="">—</option>
            {PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.title[locale]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}

function Pane({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-indigo">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        rows={8}
        className="w-full resize-y rounded border border-indigo/30 bg-cotton/60 p-2 font-mono text-xs leading-relaxed focus:border-indigo focus:outline-none"
      />
    </label>
  )
}
