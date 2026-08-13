'use client'

import { useMemo, useState } from 'react'
import { InputPanes } from '@/components/input/InputPanes'
import { Hunks } from '@/components/hunks/Hunks'
import { Panel, StepHeading } from '@/components/ui/Panel'
import { Note } from '@/components/ui/controls'
import { useDiffInputs } from '@/lib/client/useDiffInputs'
import { diff } from '@/lib/diff'
import { hunkCount, isMinimal, type AlgorithmId } from '@/lib/diff/types'
import { buildHunks } from '@/lib/hunks'
import { findPreset } from '@/data/presets'
import { format, type Dict } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/i18n/locales'

/**
 * All four algorithms on one input, side by side. §6.5
 *
 * Patience will often be longer, or the same length with different grouping,
 * and the point is that longer is sometimes better — stated plainly, with the
 * reasoning, rather than left for the reader to infer.
 *
 * The retained-V column sits beside them so the O(D²) of the greedy recording
 * and the O(N+M) of the linear-space variant are numbers on screen rather than
 * a claim in prose. §6.6
 */
const SHOWN: AlgorithmId[] = ['myers', 'myers-linear', 'patience', 'histogram']

const LABELS: Record<AlgorithmId, string> = {
  myers: 'Myers',
  'myers-linear': 'Myers — linear space',
  patience: 'Patience',
  histogram: 'Histogram',
}

export function CompareView({ locale, dict }: { locale: Locale; dict: Dict }) {
  const inputs = useDiffInputs()
  const { a, b } = inputs.tokenized
  const [selectedOp, setSelectedOp] = useState<number | null>(null)

  const results = useMemo(
    () =>
      SHOWN.map((algorithm) => {
        try {
          const result = diff(a.tokens, b.tokens, algorithm)
          return {
            algorithm,
            d: result.stats.d,
            vCells: result.stats.vCells,
            hunks: hunkCount(result.script),
            rendered: buildHunks(result.script, a.texts, b.texts),
            error: null as string | null,
          }
        } catch (error) {
          return {
            algorithm,
            d: 0,
            vCells: 0,
            hunks: 0,
            rendered: [],
            error: error instanceof Error ? error.message : String(error),
          }
        }
      }),
    [a, b],
  )

  const t = dict.compare
  const best = Math.min(...results.map((r) => r.d))
  /*
   * A "shortest" badge on all four rows says nothing. It is only information
   * when something is longer — which is exactly the case the page is about.
   */
  const contested = results.some((r) => r.error === null && r.d > best)

  /*
   * The page's lede says patience usually produces a longer script. On a small
   * edit it usually does not, and four identical rows under that sentence read
   * as a contradiction rather than as the common case it is. Say which one the
   * reader is looking at.
   *
   * Deliberately the weaker claim — same D and same hunk count, not identical
   * output — because that is what the table actually shows.
   */
  const allAgree =
    results.every((r) => r.error === null) &&
    results.every((r) => r.d === results[0].d && r.hunks === results[0].hunks)
  const showcase = findPreset('patience-wins')

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
      <header className="max-w-3xl">
        <h1 className="font-serif text-h1 font-semibold">{t.title}</h1>
        {/* The plain reading first; the precise one directly under it. */}
        <p className="measure mt-3 font-sans text-lg text-indigo">{t.plain}</p>
        <p className="measure mt-3 font-sans text-base text-muted">{t.lede}</p>
      </header>

      <section className="mt-10">
        <StepHeading step={1} title={dict.graph.stepInput} hint={dict.graph.stepInputHint} />
        <InputPanes
          locale={locale}
          dict={dict}
          aText={inputs.aText}
          bText={inputs.bText}
          granularity={inputs.granularity}
          ignoreWhitespace={inputs.ignoreWhitespace}
          onA={inputs.setA}
          onB={inputs.setB}
          onGranularity={inputs.setGranularity}
          onIgnoreWhitespace={inputs.setIgnoreWhitespace}
          onSwap={inputs.swap}
          onPreset={inputs.loadPreset}
          presetId={inputs.presetId}
          shareUrl={inputs.shareUrl}
        />
      </section>

      <section className="mt-12">
        <StepHeading step={2} title={t.tableTitle} />

        <div className="card max-w-4xl overflow-x-auto">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-rule bg-cotton/50 text-left">
                <Th>{dict.input.algorithm}</Th>
                <Th align="right">{t.scriptLength}</Th>
                <Th align="right">{t.hunks}</Th>
                <Th align="right">{dict.graph.memory}</Th>
                <Th align="right">{t.minimal}</Th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => {
                const shortest = result.error === null && result.d === best
                return (
                  <tr key={result.algorithm} className="border-b border-rule/60 last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-medium text-deepIndigo">
                        {LABELS[result.algorithm]}
                      </span>
                      {shortest && contested ? (
                        <span className="ml-2 rounded border border-rule bg-cotton px-1.5 py-0.5 font-sans text-micro uppercase tracking-wide text-muted">
                          {t.shortest}
                        </span>
                      ) : null}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono tabular-nums ${
                        shortest ? 'font-medium text-deepIndigo' : 'text-muted'
                      }`}
                    >
                      {result.error === null ? result.d : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-muted">
                      {result.error === null ? result.hunks : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-muted">
                      {result.vCells === 0 ? '—' : result.vCells}
                    </td>
                    <td className="px-4 py-3 text-right font-sans text-muted">
                      {isMinimal(result.algorithm) ? t.yes : t.no}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/*
          The column names are terms of art. Reading them off in plain language
          costs three lines and saves the reader guessing what "hunk" means.
        */}
        <dl className="mt-4 grid max-w-4xl gap-x-8 gap-y-2 font-sans text-fine sm:grid-cols-3">
          {[
            { label: t.scriptLength, hint: t.scriptLengthHint },
            { label: t.hunks, hint: t.hunksHint },
            { label: t.minimal, hint: t.minimalHint },
          ].map((entry) => (
            <div key={entry.label}>
              <dt className="font-medium text-deepIndigo">{entry.label}</dt>
              <dd className="text-muted">{entry.hint}</dd>
            </div>
          ))}
        </dl>

        {allAgree && showcase !== undefined ? (
          <p className="measure mt-5 font-sans text-base text-muted">
            {format(t.allAgree, { preset: showcase.title[locale] })}
          </p>
        ) : null}

        <div className="mt-5">
          <Note tone="accent">{t.note}</Note>
        </div>
      </section>

      <section className="mt-12">
        <StepHeading step={3} title={t.outputTitle} hint={t.outputHint} />
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {results.map((result) => (
            <Panel
              key={result.algorithm}
              title={LABELS[result.algorithm]}
              hint={
                result.error === null
                  ? `D = ${result.d} · ${result.hunks} hunk`
                  : undefined
              }
              padded={false}
            >
              <div className="px-1 pb-1">
                {result.error === null ? (
                  <Hunks
                    hunks={result.rendered}
                    selectedOp={selectedOp}
                    onSelectOp={setSelectedOp}
                    emptyLabel={locale === 'id' ? 'Tidak ada perbedaan.' : 'No differences.'}
                  />
                ) : (
                  <p className="px-3 py-4 font-sans text-fine text-madder">{result.error}</p>
                )}
              </div>
            </Panel>
          ))}
        </div>
      </section>
    </main>
  )
}

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <th
      className={`px-4 py-2.5 text-micro font-semibold uppercase tracking-[0.07em] text-muted ${
        align === 'right' ? 'text-right' : ''
      }`}
    >
      {children}
    </th>
  )
}
