import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LOCALES, isLocale } from '@/lib/i18n/locales'
import { getDict } from '@/lib/i18n/dictionary'
import { READING } from '@/lib/links'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function Home({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const { locale } = params
  const dict = getDict(locale)
  const t = dict.home

  return (
    <main className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="font-serif text-4xl font-semibold leading-tight sm:text-5xl">{t.tagline}</h1>
      <p className="mt-5 max-w-2xl font-sans text-lg leading-relaxed text-indigo">{t.lede}</p>

      <div className="mt-8 flex flex-wrap gap-3 font-sans text-sm">
        <Link
          href={`/${locale}/graf`}
          className="rounded bg-indigo px-4 py-2 text-cotton hover:bg-deepIndigo"
        >
          {t.ctaGraph}
        </Link>
        <Link
          href={`/${locale}/banding`}
          className="rounded border border-indigo px-4 py-2 hover:border-madder hover:text-madder"
        >
          {t.ctaCompare}
        </Link>
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold">{t.whatTitle}</h2>
        <p className="mt-3 max-w-2xl font-sans leading-relaxed text-indigo">{t.what}</p>

        <table className="mt-6 w-full max-w-2xl border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-indigo/30 text-left">
              <th className="py-2 pr-4 font-medium">{t.moves.move}</th>
              <th className="py-2 pr-4 font-medium">{t.moves.meaning}</th>
              <th className="py-2 font-medium">{t.moves.cost}</th>
            </tr>
          </thead>
          <tbody className="text-indigo">
            <tr className="border-b border-indigo/10">
              <td className="py-2 pr-4 font-mono">(x,y) → (x+1,y)</td>
              <td className="py-2 pr-4">{t.moveRight}</td>
              <td className="py-2 font-mono">1</td>
            </tr>
            <tr className="border-b border-indigo/10">
              <td className="py-2 pr-4 font-mono">(x,y) → (x,y+1)</td>
              <td className="py-2 pr-4">{t.moveDown}</td>
              <td className="py-2 font-mono">1</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono">(x,y) → (x+1,y+1)</td>
              <td className="py-2 pr-4">{t.moveDiag}</td>
              <td className="py-2 font-mono font-semibold text-madder">0</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-14 border-l-2 border-madder pl-5">
        <h2 className="text-2xl font-semibold">{t.ambiguityTitle}</h2>
        <p className="mt-3 max-w-2xl font-sans leading-relaxed text-indigo">{t.ambiguity}</p>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold">{t.creditsTitle}</h2>
        <ul className="mt-4 flex max-w-2xl flex-col gap-4">
          {READING.map((entry) => (
            <li key={entry.href}>
              <a
                href={entry.href}
                rel="noreferrer noopener"
                className="font-sans text-sm font-medium underline decoration-indigo/40 underline-offset-4 hover:text-madder"
              >
                {entry.title}
              </a>
              <p className="mt-1 font-sans text-sm leading-relaxed text-indigo">
                {entry.note[locale]}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-2xl border-l-2 border-indigo/30 pl-4 font-sans text-sm leading-relaxed text-indigo">
          {t.notGit}
        </p>
      </section>
    </main>
  )
}
