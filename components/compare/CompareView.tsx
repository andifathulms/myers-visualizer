'use client'

import { useMemo, useState } from 'react'
import { InputPanes } from '@/components/input/InputPanes'
import { Hunks } from '@/components/hunks/Hunks'
import { Panel } from '@/components/ui/Panel'
import { Note, Segmented } from '@/components/ui/controls'
import { LatticeCanvas } from '@/components/lattice/LatticeCanvas'
import { buildMatchGrid } from '@/components/lattice/frame'
import { RouteOverlay } from '@/components/compare/RouteOverlay'
import { pathOf } from '@/lib/diff/backtrack'
import { VIEWABLE_CAP, type Point } from '@/layout/lattice'
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

/** The same names, short enough for a segmented control and the route key. */
const SHORT: Record<AlgorithmId, string> = {
  myers: 'Myers',
  'myers-linear': 'Linear Myers',
  patience: 'Patience',
  histogram: 'Histogram',
}

/**
 * Each route's dash on the shared lattice, so routes are told apart by shape
 * as well as colour. Myers is solid: it is the baseline the others differ from.
 */
const DASH: Record<AlgorithmId, string> = {
  myers: '',
  'myers-linear': '7 5',
  patience: '2 5',
  histogram: '10 4 2 4',
}

export function CompareView({ locale, dict }: { locale: Locale; dict: Dict }) {
  const inputs = useDiffInputs()
  const { a, b } = inputs.tokenized
  const [selectedOp, setSelectedOp] = useState<number | null>(null)
  /** Which algorithm's route the shared lattice draws as the answer. */
  const [highlight, setHighlight] = useState<AlgorithmId>('myers')
  const n = a.tokens.length
  const m = b.tokens.length
  const tooLarge = n > VIEWABLE_CAP || m > VIEWABLE_CAP
  const matches = useMemo(
    () => (tooLarge ? null : buildMatchGrid(a.tokens, b.tokens)),
    [a.tokens, b.tokens, tooLarge],
  )

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
            path: pathOf(result.script),
            error: null as string | null,
          }
        } catch (error) {
          return {
            algorithm,
            d: 0,
            vCells: 0,
            hunks: 0,
            rendered: [],
            path: [] as Point[],
            error: error instanceof Error ? error.message : String(error),
          }
        }
      }),
    [a, b],
  )

  const t = dict.compare
  const best = Math.min(...results.map((r) => r.d))

  /*
   * A table of four numbers makes the reader do the comparing — this page's
   * whole point is that the algorithms differ, so relative magnitude should
   * be visible at a glance. Same treatment §7 gives the V strip: a bar
   * alongside the number, never instead of it. Measured against the column's
   * own max, unlike the V strip's fixed reference — there is no shared axis
   * across rows here the way there is across diagonals, only a comparison
   * within each column. DESIGN.md §8.
   */
  const okResults = results.filter((r) => r.error === null)
  const maxD = Math.max(1, ...okResults.map((r) => r.d))
  const maxHunks = Math.max(1, ...okResults.map((r) => r.hunks))
  const maxVCells = Math.max(1, ...okResults.map((r) => r.vCells))
  const barPct = (value: number, max: number) => Math.max(0, Math.min(100, Math.round((value / max) * 100)))
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

  /* Four copies of the diff on this page; all four name their lines in the
     reader's language rather than falling back to the English default. */
  const lineLabels = {
    label: dict.graph.lineLabel,
    kept: dict.graph.lineKept,
    deleted: dict.graph.lineDeleted,
    inserted: dict.graph.lineInserted,
    share: dict.graph.lineShare,
  }

  /*
   * §6.6 sells the linear-space variant on memory, and on a five-line input it
   * stores *more* than greedy — true, and read bare it looks like the page
   * contradicting itself. The crossover is a fact about input size, so say it
   * where the number is, and only when the number needs it.
   */
  const greedyCells = results.find((r) => r.algorithm === 'myers')?.vCells ?? 0
  const linearCells = results.find((r) => r.algorithm === 'myers-linear')?.vCells ?? 0
  const memoryInverted = greedyCells > 0 && linearCells > greedyCells

  return (
    <main className="mx-auto max-w-[100rem] px-4 py-6 sm:px-gutter sm:py-8">
      <header className="max-w-4xl">
        <h1 className="font-serif text-h2 font-medium">{t.title}</h1>
        {/* The plain reading first; the precise one directly under it. */}
        <p className="measure mt-2 font-sans text-base text-indigo">{t.plain}</p>
        <p className="measure mt-1.5 font-sans text-sm text-muted">{t.lede}</p>
      </header>

      <section className="mt-5">
        <h2 className="sr-only">{dict.graph.stepInput}</h2>
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

      {/*
        The routes and the numbers side by side. The page argues that these
        algorithms differ; a table of four numbers made the reader do the
        comparing, so every route is drawn on the same edit graph — same data,
        same axes (DESIGN.md §2.3) — and the table stays beside it as the
        precise, copyable view.
      */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
        <section className="card graph-paper overflow-hidden">
          <div className="border-b border-rule bg-surface px-4 py-3">
            <h2 className="eyebrow">{t.routesTitle}</h2>
            <p className="mt-1 font-sans text-fine text-muted">{t.routesHint}</p>
          </div>
          {tooLarge ? (
            <p className="m-4 rounded-card border border-dashed border-indigo/40 bg-surface p-5 font-sans text-sm text-indigo">
              {format(dict.input.tooLarge, { n, m, cap: VIEWABLE_CAP })}
            </p>
          ) : (
            <div className="mx-auto w-full max-w-[max(18rem,min(40rem,calc(100svh-18rem)))] p-3">
              <div className="relative aspect-square w-full">
                <LatticeCanvas n={n} m={m} matches={matches} label={t.routesTitle} />
                <RouteOverlay
                  n={n}
                  m={m}
                  routes={results
                    .filter((r) => r.error === null)
                    .map((r) => ({
                      key: r.algorithm,
                      points: r.path,
                      dash: DASH[r.algorithm],
                      selected: r.algorithm === highlight,
                    }))}
                />
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-rule bg-surface px-4 py-3">
            <Segmented
              name="highlight"
              label={t.highlight}
              value={highlight}
              onChange={setHighlight}
              options={SHOWN.map((id) => ({ value: id, label: SHORT[id] }))}
            />
            {/* The key: each route's dash, drawn the way the lattice draws it. */}
            <ul className="flex flex-wrap gap-x-4 gap-y-1 font-sans text-fine text-muted">
              {SHOWN.map((id) => (
                <li key={id} className="flex items-center gap-1.5">
                  <svg aria-hidden width="22" height="6" className="block">
                    <line
                      x1="1"
                      y1="3"
                      x2="21"
                      y2="3"
                      strokeWidth={id === highlight ? 3 : 2}
                      strokeLinecap="round"
                      strokeDasharray={DASH[id] === '' ? undefined : DASH[id]}
                      className={id === highlight ? 'stroke-madder' : 'stroke-ink/70'}
                    />
                  </svg>
                  {SHORT[id]}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="min-w-0">
      <section>
        <h2 className="eyebrow mb-3">{t.tableTitle}</h2>

        {/* Same reasoning as the diff pane: keyboard-scrollable, and named so
            that landing on it says something. WCAG 2.1.1. */}
        <div
          tabIndex={0}
          role="region"
          aria-label={t.tableScroll}
          className="card overflow-x-auto"
        >
          <table className="w-full border-collapse font-sans text-sm">
            {/*
              The table had no name of its own: the visible heading above it is
              the step heading, not a caption, so a reader landing on the table
              directly was told nothing about what it holds.
            */}
            <caption className="sr-only">{t.tableCaption}</caption>
            <thead>
              <tr className="border-b border-rule bg-sunken text-left">
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
                    {/*
                      The algorithm names the row, so it is a header for it.
                      As a <td> every other cell in the row read as a bare
                      number with nothing to attach it to. WCAG 1.3.1.
                    */}
                    <th scope="row" className="px-4 py-3 text-left font-normal">
                      <span className="font-medium text-ink">
                        {LABELS[result.algorithm]}
                      </span>
                      {shortest && contested ? (
                        <span className="ml-2 rounded border border-rule bg-ground px-1.5 py-0.5 font-sans text-micro uppercase tracking-wide text-muted">
                          {t.shortest}
                        </span>
                      ) : null}
                    </th>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-mono tabular-nums ${
                          shortest ? 'font-medium text-ink' : 'text-muted'
                        }`}
                      >
                        {result.error === null ? result.d : '—'}
                      </span>
                      {result.error === null ? <Bar pct={barPct(result.d, maxD)} /> : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono tabular-nums text-muted">
                        {result.error === null ? result.hunks : '—'}
                      </span>
                      {result.error === null ? <Bar pct={barPct(result.hunks, maxHunks)} /> : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono tabular-nums text-muted">
                        {result.vCells === 0 ? '—' : result.vCells}
                      </span>
                      {result.error === null ? <Bar pct={barPct(result.vCells, maxVCells)} /> : null}
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
        <dl className="mt-4 grid gap-x-8 gap-y-2 font-sans text-fine sm:grid-cols-3">
          {[
            { label: t.scriptLength, hint: t.scriptLengthHint },
            { label: t.hunks, hint: t.hunksHint },
            { label: t.minimal, hint: t.minimalHint },
          ].map((entry) => (
            <div key={entry.label}>
              <dt className="font-medium text-ink">{entry.label}</dt>
              <dd className="text-muted">{entry.hint}</dd>
            </div>
          ))}
        </dl>

        {memoryInverted ? (
          <p className="measure mt-5 font-sans text-base text-muted">{t.memoryCrossover}</p>
        ) : null}

        {allAgree && showcase !== undefined ? (
          <p className="measure mt-5 font-sans text-base text-muted">
            {format(t.allAgree, { preset: showcase.title[locale] })}
          </p>
        ) : null}

        <div className="mt-5">
          <Note tone="accent">{t.note}</Note>
        </div>
      </section>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-h3 font-semibold">{t.outputTitle}</h2>
        <p className="mt-1 font-sans text-sm text-muted">{t.outputHint}</p>
        {/* Two across, not four: a diff line squeezed into a quarter of the
            page was mostly horizontal scrolling. */}
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
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
                    labels={lineLabels}
                    scrollLabel={`${LABELS[result.algorithm]} — ${dict.graph.outputScroll}`}
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

/**
 * Restates the number beside it as a length, never instead of it — the
 * number is exact and copyable, the bar is relative and immediate. §7, §8.
 */
function Bar({ pct }: { pct: number }) {
  return (
    <span
      aria-hidden
      className="ml-auto mt-1 block h-1 w-16 overflow-hidden rounded-full bg-sunken"
    >
      <span className="block h-full rounded-full bg-indigo/40" style={{ width: `${pct}%` }} />
    </span>
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
    // Explicit, rather than relying on every screen reader inferring column
    // scope from <thead>. WCAG 1.3.1.
    <th
      scope="col"
      className={`px-4 py-2.5 text-micro font-semibold uppercase tracking-[0.07em] text-muted ${
        align === 'right' ? 'text-right' : ''
      }`}
    >
      {children}
    </th>
  )
}
