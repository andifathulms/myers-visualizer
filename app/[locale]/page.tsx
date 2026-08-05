import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LOCALES, isLocale } from '@/lib/i18n/locales'
import { getDict } from '@/lib/i18n/dictionary'
import { READING } from '@/lib/links'
import { EXAMPLE, type ExampleLine } from '@/data/example'
import { Panel } from '@/components/ui/Panel'
import { Note } from '@/components/ui/controls'

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
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-5 pb-10 pt-14 sm:pt-20">
        <p className="font-sans text-[13px] font-semibold uppercase tracking-[0.14em] text-madder">
          {t.kicker}
        </p>
        <h1 className="mt-4 max-w-3xl font-serif text-[2.5rem] font-semibold leading-[1.08] sm:text-6xl">
          {t.tagline}
        </h1>
        <p className="measure mt-6 font-sans text-lg leading-relaxed text-indigo">{t.lede}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/graf`}
            className="inline-flex h-11 items-center rounded-lg border border-indigo bg-indigo px-5 font-sans text-[15px] font-medium text-paper transition-colors hover:bg-deepIndigo"
          >
            {t.ctaGraph}
          </Link>
          <Link
            href={`/${locale}/banding`}
            className="inline-flex h-11 items-center rounded-lg border border-rule bg-paper px-5 font-sans text-[15px] font-medium text-deepIndigo transition-colors hover:border-indigo/60"
          >
            {t.ctaCompare}
          </Link>
        </div>
      </section>

      {/* What a diff is, before any word of algorithm. */}
      <section className="mx-auto max-w-5xl px-5 py-12">
        <h2 className="font-serif text-3xl font-semibold">{t.exampleTitle}</h2>
        <p className="measure mt-3 font-sans leading-relaxed text-indigo">{t.exampleLede}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Panel title={t.exampleBefore}>
            <List items={example.a} />
          </Panel>
          <Panel title={t.exampleAfter}>
            <List items={example.b} />
          </Panel>
          <Panel title={t.exampleResult}>
            <ol className="font-mono text-[13px] leading-6">
              {example.diff.map((line, index) => (
                <ExampleDiffLine key={index} line={line} />
              ))}
            </ol>
          </Panel>
        </div>

        <p className="measure mt-5 font-sans text-sm leading-relaxed text-muted">
          {t.exampleCaption}
        </p>
      </section>

      {/* The idea, with no notation in it at all. */}
      <section className="mx-auto max-w-5xl px-5 py-12">
        <h2 className="font-serif text-3xl font-semibold">{t.stepsTitle}</h2>
        <p className="measure mt-3 font-sans leading-relaxed text-indigo">{t.stepsLede}</p>

        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {t.steps.map((step, index) => (
            <li key={step.title} className="card p-5">
              <span
                aria-hidden
                className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo font-mono text-sm text-paper"
              >
                {index + 1}
              </span>
              <h3 className="mt-4 font-serif text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 font-sans text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8">
          <Link
            href={`/${locale}/graf`}
            className="inline-flex h-11 items-center rounded-lg border border-indigo bg-indigo px-5 font-sans text-[15px] font-medium text-paper transition-colors hover:bg-deepIndigo"
          >
            {t.ctaGraph}
          </Link>
        </div>
      </section>

      {/* The practical payoff. */}
      <section className="mx-auto max-w-5xl px-5 py-12">
        <div className="card border-l-[3px] border-l-madder p-6 sm:p-8">
          <h2 className="font-serif text-3xl font-semibold">{t.ambiguityTitle}</h2>
          <p className="measure mt-4 font-sans leading-relaxed text-indigo">{t.ambiguity}</p>
          <Link
            href={`/${locale}/contoh`}
            className="mt-5 inline-flex h-10 items-center rounded-lg border border-rule bg-cotton px-4 font-sans text-sm font-medium text-deepIndigo transition-colors hover:border-madder hover:text-madder"
          >
            {dict.presets.title} →
          </Link>
        </div>
      </section>

      {/* Only now the notation. */}
      <section className="mx-auto max-w-5xl px-5 py-12">
        <h2 className="font-serif text-3xl font-semibold">{t.whatTitle}</h2>
        <p className="measure mt-3 font-sans leading-relaxed text-indigo">{t.what}</p>

        <div className="card mt-6 max-w-2xl overflow-hidden">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-rule bg-cotton/50 text-left">
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
                  {t.moves.move}
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
                  {t.moves.meaning}
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
                  {t.moves.cost}
                </th>
              </tr>
            </thead>
            <tbody>
              <MoveRow move="(x,y) → (x+1,y)" meaning={t.moveRight} cost="1" />
              <MoveRow move="(x,y) → (x,y+1)" meaning={t.moveDown} cost="1" />
              <MoveRow move="(x,y) → (x+1,y+1)" meaning={t.moveDiag} cost="0" free />
            </tbody>
          </table>
        </div>
      </section>

      {/* The English terms, translated into human. */}
      <section className="mx-auto max-w-5xl px-5 py-12">
        <h2 className="font-serif text-3xl font-semibold">{t.glossaryTitle}</h2>
        <p className="measure mt-3 font-sans leading-relaxed text-indigo">{t.glossaryLede}</p>

        <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {dict.glossary.map((entry) => (
            <div key={entry.term}>
              <dt className="font-mono text-sm font-medium text-deepIndigo">{entry.term}</dt>
              <dd className="mt-1 font-sans text-sm leading-relaxed text-muted">{entry.plain}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Sources. */}
      <section className="mx-auto max-w-5xl px-5 pb-16 pt-12">
        <h2 className="font-serif text-3xl font-semibold">{t.creditsTitle}</h2>
        <p className="measure mt-3 font-sans leading-relaxed text-indigo">{t.creditsLede}</p>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {READING.map((entry) => (
            <li key={entry.href} className="card p-5">
              <a
                href={entry.href}
                rel="noreferrer noopener"
                className="font-sans text-[15px] font-medium underline decoration-rule underline-offset-4 hover:text-madder"
              >
                {entry.title}
              </a>
              <p className="mt-2 font-sans text-sm leading-relaxed text-muted">
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
    <ol className="font-mono text-[13px] leading-6 text-deepIndigo">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2">
          <span aria-hidden className="w-3 shrink-0 select-none text-muted/60">
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
  free = false,
}: {
  move: string
  meaning: string
  cost: string
  free?: boolean
}) {
  return (
    <tr className="border-b border-rule/60 last:border-0">
      <td className="px-4 py-2.5 font-mono text-[13px] text-deepIndigo">{move}</td>
      <td className="px-4 py-2.5 text-muted">{meaning}</td>
      <td
        className={`px-4 py-2.5 text-right font-mono tabular-nums ${
          free ? 'font-semibold text-madder' : 'text-muted'
        }`}
      >
        {cost}
      </td>
    </tr>
  )
}
