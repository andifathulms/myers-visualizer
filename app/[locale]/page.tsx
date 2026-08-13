import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LOCALES, isLocale } from '@/lib/i18n/locales'
import { format, getDict } from '@/lib/i18n/dictionary'
import { READING } from '@/lib/links'
import { EXAMPLE, type ExampleLine } from '@/data/example'
import { WALKTHROUGH, WALKTHROUGH_D } from '@/data/walkthrough'
import { Panel } from '@/components/ui/Panel'
import { Note } from '@/components/ui/controls'
import { HeroFigure } from '@/components/home/HeroFigure'

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

  return (
    <main>
      {/*
        Hero. Two columns from lg, because the picture is the argument and
        putting it under a full-width headline pushes it below the fold —
        which is where it was doing no work at all.
      */}
      <section className="mx-auto max-w-5xl px-gutter pb-stack pt-8 sm:pt-hero">
        {/*
          Three blocks, so that the narrow layout can put the picture between
          the promise and the buttons: on a phone the figure would otherwise
          sit under two screens of prose, which is the same as not having it.
        */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center lg:gap-10">
          <div className="lg:col-start-1 lg:row-start-1">
            <p className="font-sans text-fine font-semibold uppercase tracking-[0.14em] text-madder">
              {t.kicker}
            </p>
            <h1 className="mt-3 max-w-2xl font-serif text-hero font-semibold">{t.tagline}</h1>
            <p className="measure mt-4 font-sans text-lg text-indigo">{t.lede}</p>
          </div>

          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <HeroFigure dict={dict} />
          </div>

          <div className="flex flex-wrap gap-3 lg:col-start-1 lg:row-start-2">
            <Link
              href={`/${locale}/graf`}
              className="inline-flex h-11 items-center rounded-lg border border-indigo bg-indigo px-5 font-sans text-base font-medium text-paper transition-colors hover:bg-deepIndigo"
            >
              {t.ctaGraph}
            </Link>
            <Link
              href={`/${locale}/banding`}
              className="inline-flex h-11 items-center rounded-lg border border-rule bg-paper px-5 font-sans text-base font-medium text-deepIndigo transition-colors hover:border-indigo/60"
            >
              {t.ctaCompare}
            </Link>
          </div>
        </div>
      </section>

      {/* What a diff is, before any word of algorithm. */}
      <section className="mx-auto max-w-5xl px-gutter py-section">
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

        <p className="measure mt-5 font-sans text-base text-muted">
          {t.exampleCaption}
        </p>
      </section>

      {/* The idea, with no notation in it at all. */}
      <section className="mx-auto max-w-5xl px-gutter py-section">
        <h2 className="font-serif text-h2 font-semibold">{t.stepsTitle}</h2>
        <p className="measure mt-3 font-sans text-lg text-indigo">{t.stepsLede}</p>

        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {t.steps.map((step, index) => (
            <li key={step.title} className="card p-5">
              <span
                aria-hidden
                className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo font-mono text-sm text-paper"
              >
                {index + 1}
              </span>
              <h3 className="mt-4 font-serif text-h3 font-semibold">{step.title}</h3>
              <p className="mt-2 font-sans text-base text-muted">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8">
          <Link
            href={`/${locale}/graf`}
            className="inline-flex h-11 items-center rounded-lg border border-indigo bg-indigo px-5 font-sans text-base font-medium text-paper transition-colors hover:bg-deepIndigo"
          >
            {t.ctaGraph}
          </Link>
        </div>
      </section>

      {/* The practical payoff. */}
      <section className="mx-auto max-w-5xl px-gutter py-section">
        <div className="card border-l-[3px] border-l-madder p-6 sm:p-8">
          <h2 className="font-serif text-h2 font-semibold">{t.ambiguityTitle}</h2>
          <p className="measure mt-4 font-sans text-lg text-indigo">{t.ambiguity}</p>
          <Link
            href={`/${locale}/contoh`}
            className="mt-5 inline-flex h-10 items-center rounded-lg border border-rule bg-cotton px-4 font-sans text-sm font-medium text-deepIndigo transition-colors hover:border-madder hover:text-madder"
          >
            {dict.presets.title} →
          </Link>
        </div>
      </section>

      {/* Only now the notation. */}
      <section className="mx-auto max-w-5xl px-gutter py-section">
        <h2 className="font-serif text-h2 font-semibold">{t.whatTitle}</h2>
        <p className="measure mt-3 font-sans text-lg text-indigo">{t.what}</p>

        <div className="card mt-6 max-w-3xl overflow-hidden">
          <table className="w-full border-collapse font-sans text-base">
            <thead>
              <tr className="border-b border-rule bg-cotton/50 text-left">
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
        The notation, immediately used. Until now the first place a reader met
        a real d, k or V was the live tool, where they had to know what to
        press before anything happened at all. This is the same five lines
        from the top of the page, searched to completion, with every
        intermediate value on screen and nothing to operate.
      */}
      <section className="mx-auto max-w-5xl px-gutter py-section">
        <h2 className="font-serif text-h2 font-semibold">{t.walkTitle}</h2>
        <p className="measure mt-3 font-sans text-lg text-indigo">{t.walkLede}</p>

        <ol className="mt-6 grid gap-4">
          {WALKTHROUGH.map((level, index) => (
            <li key={level.d} className="card p-5">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <h3 className="font-mono text-h3 font-semibold tabular-nums text-deepIndigo">
                  {format(t.walkLevel, { d: level.d })}
                </h3>
                {level.reached === null ? null : (
                  <span className="font-mono text-fine text-madder">
                    ({level.reached[0]}, {level.reached[1]})
                  </span>
                )}
              </div>

              <p className="measure mt-2 font-sans text-base text-muted">{t.walkSteps[index]}</p>

              {/* The stored state itself, in the same shape the tool shows it. */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="font-sans text-micro font-semibold uppercase tracking-[0.07em] text-muted">
                  {t.walkV}
                </span>
                {level.v.map(([k, x]) => (
                  <span
                    key={k}
                    className="rounded-lg border border-rule bg-cotton/40 px-2 py-1 font-mono text-fine tabular-nums text-deepIndigo"
                  >
                    k{k} x {x}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>

        <p className="measure mt-5 font-sans text-base text-deepIndigo">
          {format(t.walkResult, { d: WALKTHROUGH_D })}
        </p>

        {/*
          The tie is the whole point of the site and it is present in the
          smallest example there is, so it is named here rather than saved for
          the tool. Madder rule down the side: this is the answer's own
          ambiguity, and it is the same claim the ambiguity card makes above.
        */}
        <div className="card mt-5 border-l-[3px] border-l-madder p-5">
          <p className="measure font-sans text-base text-muted">{t.walkTie}</p>
          <Link
            href={`/${locale}/graf#p=minimal-edit`}
            className="mt-4 inline-flex h-10 items-center rounded-lg border border-rule bg-cotton px-4 font-sans text-sm font-medium text-deepIndigo transition-colors hover:border-madder hover:text-madder"
          >
            {t.walkCta} →
          </Link>
        </div>
      </section>

      {/* The English terms, translated into human. */}
      <section className="mx-auto max-w-5xl px-gutter py-section">
        <h2 className="font-serif text-h2 font-semibold">{t.glossaryTitle}</h2>
        <p className="measure mt-3 font-sans text-lg text-indigo">{t.glossaryLede}</p>

        <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {dict.glossary.map((entry) => (
            <div key={entry.term}>
              <dt className="font-mono text-base font-medium text-deepIndigo">{entry.term}</dt>
              <dd className="mt-1 font-sans text-base text-muted">{entry.plain}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Sources. */}
      <section className="mx-auto max-w-5xl px-gutter pb-16 pt-section">
        <h2 className="font-serif text-h2 font-semibold">{t.creditsTitle}</h2>
        <p className="measure mt-3 font-sans text-lg text-indigo">{t.creditsLede}</p>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {READING.map((entry) => (
            <li key={entry.href} className="card p-5">
              <a
                href={entry.href}
                rel="noreferrer noopener"
                className="font-sans text-base font-medium underline decoration-rule underline-offset-4 hover:text-madder"
              >
                {entry.title}
              </a>
              <p className="mt-2 font-sans text-base text-muted">
                {entry.note[locale]}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <Note>{t.notGit}</Note>
        </div>
      </section>
    </main>
  )
}

function List({ items }: { items: readonly string[] }) {
  return (
    <ol className="font-mono text-fine leading-6 text-deepIndigo">
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
      <td className="px-4 py-2.5 font-mono text-fine text-deepIndigo">{move}</td>
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
          free ? 'font-semibold text-deepIndigo' : 'text-muted'
        }`}
      >
        {k}
      </td>
    </tr>
  )
}
