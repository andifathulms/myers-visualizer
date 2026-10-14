import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LOCALES, isLocale } from '@/lib/i18n/locales'
import { format, getDict } from '@/lib/i18n/dictionary'
import { READING } from '@/lib/links'
import { EXAMPLE, type ExampleLine } from '@/data/example'
import { WALKTHROUGH, WALKTHROUGH_D } from '@/data/walkthrough'
import { Panel } from '@/components/ui/Panel'
import { Note } from '@/components/ui/controls'
import { FIGURE, HeroFigure } from '@/components/home/HeroFigure'
import { ChapterRail } from '@/components/home/ChapterRail'
import { GlossaryIcon } from '@/components/home/GlossaryIcon'
import { MiniLattice, type MiniState } from '@/components/home/MiniLattice'
import { linesOfRoute } from '@/layout/route'
import { metadataFor, structuredData } from '@/lib/seo'

/** Title, description, canonical and hreflang, from this page's own copy. */
export function generateMetadata({ params }: { params: { locale: string } }) {
  return isLocale(params.locale) ? metadataFor(params.locale, '') : {}
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

/**
 * The home page has one job before it has any other: convince a visitor who
 * has never run `git diff` that there is something here worth looking at.
 *
 * So the order is deliberate — a question, a worked example with no jargon in
 * it, the idea in three steps, the practical payoff (why diffs blame the
 * wrong line), and only then the notation, the glossary and the paper. A
 * reader who already knows all this can start at "if you want the detail";
 * a reader who does not is never dropped into (x, y) without warning.
 */
export default function Home({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const { locale } = params
  const dict = getDict(locale)
  const t = dict.home
  const example = EXAMPLE[locale]

  const ids = ['diff', 'steps', 'wrong-line', 'notation', 'numbers', 'glossary', 'reading'] as const
  const chapters = ids.map((id, index) => ({ id, name: t.chapterNames[index] ?? id }))

  return (
    <main>
      {/*
        Structured data for the site itself, from the same dictionary lede the
        page renders below. Inline JSON, not a script fetched from anywhere —
        nothing third-party is loaded here or anywhere else on the site.
      */}
      <script
        type="application/ld+json"
        // The content is built from our own strings, never from user input.
        dangerouslySetInnerHTML={{ __html: structuredData(locale) }}
      />
      {/*
        Hero, on graph paper — the subject's own material, and the only place
        on the page the ground is drawn on. Two columns from lg with the
        picture given more than half: it is the argument, and it states the
        site's claim (two equally short routes) before any prose does.
      */}
      <section className="graph-paper border-b border-rule">
        <div className="mx-auto max-w-6xl px-gutter pb-section pt-8 sm:pt-hero">
          {/*
            Three blocks, so that the narrow layout can put the picture between
            the promise and the buttons: on a phone the figure would otherwise
            sit under two screens of prose, which is the same as not having it.
          */}
          <div className="flex flex-col gap-7 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-x-14">
            <div className="lg:col-start-1 lg:row-start-1">
              <p className="font-sans text-fine font-semibold uppercase tracking-[0.14em] text-madder">
                {t.kicker}
              </p>
              <h1 className="mt-4 max-w-2xl font-serif text-hero font-medium tracking-[-0.025em]">
                {t.tagline}
              </h1>
              <p className="measure mt-5 font-sans text-lg text-indigo">{t.lede}</p>
            </div>

            <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <HeroFigure dict={dict} />
            </div>

            <div className="lg:col-start-1 lg:row-start-2">
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/graf`}
                  className="inline-flex h-11 items-center gap-2 rounded-ctl border border-ink bg-ink px-5 font-sans text-base font-medium text-surface transition-colors hover:border-indigo hover:bg-indigo"
                >
                  <span aria-hidden>▶</span>
                  {t.ctaGraph}
                </Link>
                <Link
                  href={`/${locale}/banding`}
                  className="inline-flex h-11 items-center rounded-ctl border border-rule bg-surface px-5 font-sans text-base font-medium text-ink transition-colors hover:border-indigo/60"
                >
                  {t.ctaCompare}
                </Link>
              </div>
              {/* Three plain facts, each a figure and what it is. */}
              <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 font-sans text-sm text-muted">
                {t.facts.map((fact) => (
                  <div key={fact.figure} className="flex items-baseline gap-2">
                    <dt className="font-mono text-base font-medium text-ink">{fact.figure}</dt>
                    <dd>{fact.label}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/*
        Everything after the hero reads beside a chapter rail on wide screens.
        The order is CLAUDE.md's and does not move: example, the idea, the
        wrong line, notation, the numbers, glossary, reading.
      */}
      <div className="mx-auto max-w-6xl px-gutter lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14">
        <div className="pt-section">
          <ChapterRail label={t.chaptersLabel} chapters={chapters} />
        </div>

        <div className="min-w-0">
          {/* What a diff is, before any word of algorithm. */}
          <section id="diff" className="scroll-mt-24 py-section">
            <h2 className="font-serif text-h2 font-semibold">{t.exampleTitle}</h2>
            <p className="measure mt-3 font-sans text-lg text-indigo">{t.exampleLede}</p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Panel title={t.exampleBefore}>
                <List items={example.a} />
              </Panel>
              <Panel title={t.exampleAfter}>
                <List items={example.b} />
              </Panel>
              <Panel title={t.exampleResult}>
                <ol className="font-mono text-fine leading-6">
                  {example.diff.map((line, index) => (
                    <ExampleDiffLine key={index} line={line} />
                  ))}
                </ol>
              </Panel>
            </div>

            <p className="measure mt-5 font-sans text-base text-muted">{t.exampleCaption}</p>
          </section>

          {/* The idea, with no notation in it at all — but with a picture of each step. */}
          <section id="steps" className="scroll-mt-24 border-t border-rule py-section">
            <h2 className="font-serif text-h2 font-semibold">{t.stepsTitle}</h2>
            <p className="measure mt-3 font-sans text-lg text-indigo">{t.stepsLede}</p>

            <ol className="mt-8 grid gap-5 md:grid-cols-3">
              {t.steps.map((step, index) => (
                <li key={step.title} className="card flex flex-col overflow-hidden">
                  <div className="graph-paper flex justify-center border-b border-rule bg-ground px-5 py-5">
                    <MiniLattice state={STEP_STATES[index] ?? 'grid'} className="h-24 w-24" />
                  </div>
                  <div className="p-5">
                    <h3 className="flex items-baseline gap-2.5 font-serif text-h3 font-semibold">
                      <span aria-hidden className="font-mono text-fine font-normal text-muted">
                        {index + 1}
                      </span>
                      {step.title}
                    </h3>
                    <p className="mt-2 font-sans text-base text-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-8">
              <Link
                href={`/${locale}/graf`}
                className="inline-flex h-11 items-center gap-2 rounded-ctl border border-ink bg-ink px-5 font-sans text-base font-medium text-surface transition-colors hover:border-indigo hover:bg-indigo"
              >
                <span aria-hidden>▶</span>
                {t.ctaGraph}
              </Link>
            </div>
          </section>

          {/*
            The practical payoff, and the one block on the page that breaks
            the sheet: it is the thesis, so it gets the page's single bold
            moment. Ink ground, the two equally short scripts side by side,
            each read back from the hero's own routes by layout/route.ts — the
            captions are derived from the pictures, not typed beside them. It
            sits in the reading column, so the chapter rail stays alongside.
          */}
          <section
            id="wrong-line"
            className="lift my-section scroll-mt-24 rounded-frame bg-ink px-5 py-10 sm:px-10"
          >
            <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:items-center">
              <div>
                <p className="font-sans text-micro font-semibold uppercase tracking-[0.12em] text-explored">
                  {t.bandKicker}
                </p>
                <h2 className="mt-3 font-serif text-h2 font-medium text-surface">{t.ambiguityTitle}</h2>
                <p className="measure mt-4 font-sans text-lg text-explored">{t.ambiguity}</p>
                <Link
                  href={`/${locale}/contoh`}
                  className="mt-6 inline-flex h-10 items-center rounded-ctl border border-surface bg-surface px-4 font-sans text-sm font-medium text-ink transition-colors hover:bg-sunken"
                >
                  {dict.presets.title} →
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {(['chosen', 'alt'] as const).map((state) => (
                  <figure key={state} className="card p-4">
                    <figcaption className="eyebrow">{state === 'chosen' ? t.twinChosen : t.twinAlt}</figcaption>
                    <MiniLattice state={state} className="mt-3 h-28 w-28" />
                    <ol className="mt-3 font-mono text-fine leading-6">
                      {linesOfRoute(state === 'chosen' ? FIGURE.path : FIGURE.altPath, example.a, example.b).map(
                        (line, index) => (
                          <ExampleDiffLine key={index} line={line} />
                        ),
                      )}
                    </ol>
                  </figure>
                ))}
              </div>
            </div>
          </section>

          {/* Only now the notation. */}
          <section id="notation" className="scroll-mt-24 py-section">
            <h2 className="font-serif text-h2 font-semibold">{t.whatTitle}</h2>
            <p className="measure mt-3 font-sans text-lg text-indigo">{t.what}</p>

            <div className="card mt-6 max-w-3xl overflow-hidden">
              <table className="w-full border-collapse font-sans text-base">
                <thead>
                  <tr className="border-b border-rule bg-sunken text-left">
                    <th className="px-4 py-2.5 text-micro font-semibold uppercase tracking-[0.07em] text-muted">
                      {t.moves.move}
                    </th>
                    <th className="px-4 py-2.5 text-micro font-semibold uppercase tracking-[0.07em] text-muted">
                      {t.moves.meaning}
                    </th>
                    <th className="px-4 py-2.5 text-right text-micro font-semibold uppercase tracking-[0.07em] text-muted">
                      {t.moves.cost}
                    </th>
                    {/* The column that carries the point, rather than a footnote
                        under the table saying the same thing later. */}
                    <th className="px-4 py-2.5 text-right text-micro font-semibold uppercase tracking-[0.07em] text-muted">
                      {t.moveK}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <MoveRow move="(x,y) → (x+1,y)" meaning={t.moveRight} cost="1" k="k+1" />
                  <MoveRow move="(x,y) → (x,y+1)" meaning={t.moveDown} cost="1" k="k−1" />
                  <MoveRow move="(x,y) → (x+1,y+1)" meaning={t.moveDiag} cost="0" k="k" free />
                </tbody>
              </table>
            </div>
            <h3 className="mt-8 font-serif text-h3 font-semibold">{t.kTitle}</h3>
            <p className="measure mt-2 font-sans text-base text-muted">{t.kBody}</p>
          </section>

          {/*
            The notation, immediately used. Until now the first place a reader
            met a real d, k or V was the live tool, where they had to know what
            to press before anything happened at all. This is the same five
            lines from the top of the page, searched to completion, with every
            intermediate value on screen and nothing to operate.
          */}
          <section id="numbers" className="scroll-mt-24 border-t border-rule py-section">
            <h2 className="font-serif text-h2 font-semibold">{t.walkTitle}</h2>
            <p className="measure mt-3 font-sans text-lg text-indigo">{t.walkLede}</p>

            <ol className="mt-6 grid gap-4">
              {WALKTHROUGH.map((level, index) => (
                <li key={level.d} className="card p-5">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                    <h3 className="font-mono text-h3 font-semibold tabular-nums text-ink">
                      {format(t.walkLevel, { d: level.d })}
                    </h3>
                    {level.reached === null ? null : (
                      <span className="font-mono text-fine text-madder">
                        ({level.reached[0]}, {level.reached[1]})
                      </span>
                    )}
                  </div>

                  <p className="measure mt-2 font-sans text-base text-muted">{t.walkSteps[index]}</p>

                  {/*
                    The stored state itself, in the same shape the tool shows
                    it: one cell per diagonal, a bar for how far x reached
                    against the length of A.
                  */}
                  <div className="mt-4 flex flex-wrap items-end gap-2">
                    <span className="self-center font-sans text-micro font-semibold uppercase tracking-[0.07em] text-muted">
                      {t.walkV}
                    </span>
                    {level.v.map(([k, x]) => (
                      <span
                        key={k}
                        className="flex w-16 flex-col items-center gap-1 rounded-ctl border border-rule bg-surface px-1.5 pb-1 pt-1.5 font-mono text-fine tabular-nums text-ink"
                      >
                        <span aria-hidden className="flex h-8 w-full items-end overflow-hidden rounded-[3px] bg-sunken">
                          <span
                            className="block w-full rounded-t-[2px] bg-indigo/45"
                            style={{ height: `${Math.round((x / Math.max(1, example.a.length)) * 100)}%` }}
                          />
                        </span>
                        <span>
                          k{k} x {x}
                        </span>
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ol>

            <p className="measure mt-5 font-sans text-base text-ink">
              {format(t.walkResult, { d: WALKTHROUGH_D })}
            </p>

            {/*
              The tie is the whole point of the site and it is present in the
              smallest example there is, so it is named here rather than saved
              for the tool. Madder rule down the side: this is the answer's own
              ambiguity, and it is the same claim the band above makes.
            */}
            <div className="card mt-5 border-l-[3px] border-l-madder p-5">
              <p className="measure font-sans text-base text-muted">{t.walkTie}</p>
              <Link
                href={`/${locale}/graf#p=minimal-edit`}
                className="mt-4 inline-flex h-10 items-center rounded-ctl border border-rule bg-surface px-4 font-sans text-sm font-medium text-ink transition-colors hover:border-indigo/60"
              >
                {t.walkCta} →
              </Link>
            </div>
          </section>

          {/* The English terms, translated into human — each with a picture in the lattice's vocabulary. */}
          <section id="glossary" className="scroll-mt-24 border-t border-rule py-section">
            <h2 className="font-serif text-h2 font-semibold">{t.glossaryTitle}</h2>
            <p className="measure mt-3 font-sans text-lg text-indigo">{t.glossaryLede}</p>

            <dl className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {dict.glossary.map((entry) => (
                <div key={entry.term} className="flex gap-4">
                  <GlossaryIcon icon={entry.icon} />
                  <div className="min-w-0">
                    <dt className="font-mono text-base font-medium text-ink">{entry.term}</dt>
                    <dd className="mt-1 font-sans text-base text-muted">{entry.plain}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </section>

          {/* Sources. */}
          <section id="reading" className="scroll-mt-24 border-t border-rule pb-16 pt-section">
            <h2 className="font-serif text-h2 font-semibold">{t.creditsTitle}</h2>
            <p className="measure mt-3 font-sans text-lg text-indigo">{t.creditsLede}</p>

            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {READING.map((entry) => (
                <li key={entry.href} className="card p-5">
                  <a
                    href={entry.href}
                    rel="noreferrer noopener"
                    className="font-sans text-base font-medium underline decoration-rule underline-offset-4 hover:decoration-ink"
                  >
                    {entry.title}
                  </a>
                  <p className="mt-2 font-sans text-base text-muted">{entry.note[locale]}</p>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Note>{t.notGit}</Note>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

/** One picture per step of "how it works", in the order the steps are told. */
const STEP_STATES: readonly MiniState[] = ['grid', 'search', 'read']

function List({ items }: { items: readonly string[] }) {
  return (
    <ol className="font-mono text-fine leading-6 text-ink">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2">
          {/* A hairline mark, so it uses the hairline token rather than
              thinning a text tone with opacity until it disappears. */}
          <span aria-hidden className="w-3 shrink-0 select-none text-rule">
            ·
          </span>
          {item}
        </li>
      ))}
    </ol>
  )
}

/** The same +/− vocabulary the tool uses, so the example teaches the reading. */
function ExampleDiffLine({ line }: { line: ExampleLine }) {
  const style =
    line.type === 'delete'
      ? 'bg-removed/10 text-removed'
      : line.type === 'insert'
        ? 'bg-added/10 text-added'
        : 'text-muted'
  const prefix = line.type === 'delete' ? '−' : line.type === 'insert' ? '+' : ' '
  return (
    <li className={`flex gap-2 rounded px-1 ${style}`}>
      <span aria-hidden className="w-3 shrink-0 select-none">
        {prefix}
      </span>
      {line.text}
    </li>
  )
}

function MoveRow({
  move,
  meaning,
  cost,
  k,
  free = false,
}: {
  move: string
  meaning: string
  cost: string
  /** What the move does to k — the column the whole trick lives in. */
  k: string
  free?: boolean
}) {
  return (
    <tr className="border-b border-rule/60 last:border-0">
      <td className="px-4 py-2.5 font-mono text-fine text-ink">{move}</td>
      <td className="px-4 py-2.5 text-muted">{meaning}</td>
      <td
        className={`px-4 py-2.5 text-right font-mono tabular-nums ${
          free ? 'font-semibold text-madder' : 'text-muted'
        }`}
      >
        {cost}
      </td>
      <td
        className={`px-4 py-2.5 text-right font-mono ${
          free ? 'font-semibold text-ink' : 'text-muted'
        }`}
      >
        {k}
      </td>
    </tr>
  )
}
