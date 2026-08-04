'use client'

import { useMemo, useState } from 'react'
import { InputPanes } from '@/components/input/InputPanes'
import { Hunks } from '@/components/hunks/Hunks'
import { useDiffInputs } from '@/lib/client/useDiffInputs'
import { diff } from '@/lib/diff'
import { hunkCount, isMinimal, type AlgorithmId } from '@/lib/diff/types'
import { buildHunks } from '@/lib/hunks'
import type { Dict } from '@/lib/i18n/dictionary'
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

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <h1 className="font-serif text-3xl font-semibold">{t.title}</h1>
      <p className="mt-2 max-w-3xl font-sans text-sm leading-relaxed text-indigo">{t.lede}</p>

      <div className="mt-6">
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
      </div>

      <table className="mt-8 w-full max-w-3xl border-collapse font-sans text-sm">
        <thead>
          <tr className="border-b border-indigo/30 text-left">
            <th className="py-2 pr-4 font-medium">{dict.input.algorithm}</th>
            <th className="py-2 pr-4 font-medium">{t.scriptLength}</th>
            <th className="py-2 pr-4 font-medium">{t.hunks}</th>
            <th className="py-2 pr-4 font-medium">{dict.graph.memory}</th>
            <th className="py-2 font-medium">{t.minimal}</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.algorithm} className="border-b border-indigo/10">
              <td className="py-2 pr-4">{LABELS[result.algorithm]}</td>
              <td
                className={`py-2 pr-4 font-mono tabular-nums ${
                  result.d === best ? 'text-deepIndigo' : 'text-indigo'
                }`}
              >
                {result.error === null ? result.d : '—'}
              </td>
              <td className="py-2 pr-4 font-mono tabular-nums text-indigo">
                {result.error === null ? result.hunks : '—'}
              </td>
              <td className="py-2 pr-4 font-mono tabular-nums text-indigo">
                {result.vCells === 0 ? '—' : result.vCells}
              </td>
              <td className="py-2 font-mono text-indigo">
                {isMinimal(result.algorithm) ? t.yes : t.no}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3 max-w-3xl font-sans text-xs leading-relaxed text-indigo">{t.note}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        {results.map((result) => (
          <section key={result.algorithm}>
            <h2 className="font-serif text-lg font-semibold">{LABELS[result.algorithm]}</h2>
            <p className="mt-1 font-mono text-xs text-indigo">
              D = {result.d} · {result.hunks} {t.hunks.toLowerCase()}
            </p>
            <div className="mt-2">
              {result.error === null ? (
                <Hunks
                  hunks={result.rendered}
                  selectedOp={selectedOp}
                  onSelectOp={setSelectedOp}
                  emptyLabel={locale === 'id' ? 'Tidak ada perbedaan.' : 'No differences.'}
                />
              ) : (
                <p className="font-sans text-xs text-madder">{result.error}</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
