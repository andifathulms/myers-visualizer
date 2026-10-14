import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PRESETS } from '@/data/presets'
import { format, getDict } from '@/lib/i18n/dictionary'
import { summarise } from '@/lib/presets/summary'
import { RouteThumb } from '@/components/ui/RouteThumb'
import { LOCALES, isLocale } from '@/lib/i18n/locales'
import { metadataFor } from '@/lib/seo'

/** Title, description, canonical and hreflang, from this page's own copy. */
export function generateMetadata({ params }: { params: { locale: string } }) {
  return isLocale(params.locale) ? metadataFor(params.locale, 'contoh') : {}
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

/**
 * Every preset carries the phenomenon it exists to show, so the phenomenon is
 * the body of the card rather than a footnote to it: the reason to open one
 * is the thing it demonstrates, not its name.
 *
 * Each card leads with its own lattice — the route Myers takes, drawn at
 * build time from `summarise` — so the phenomenon is visible before the
 * paragraph: a pure insertion is a straight drop, the worst case has no
 * diagonal at all.
 */
export default function ContohPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const { locale } = params
  const dict = getDict(locale)

  return (
    <main className="mx-auto max-w-6xl px-gutter py-10 sm:py-14">
      <header className="max-w-3xl">
        <h1 className="font-serif text-h1 font-medium">{dict.presets.title}</h1>
        <p className="measure mt-3 font-sans text-lg text-indigo">{dict.presets.lede}</p>
      </header>

      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PRESETS.map((preset) => {
          const summary = summarise(preset)
          return (
            <li key={preset.id} className="card flex flex-col overflow-hidden">
              <div className="graph-paper flex h-44 items-center justify-center border-b border-rule bg-ground p-4">
                <RouteThumb route={summary.route} n={summary.n} m={summary.m} size={140} tone="path" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="font-serif text-h3 font-semibold">{preset.title[locale]}</h2>
                {/* The figures the picture is about, as text. */}
                <p className="mt-2 flex flex-wrap gap-1.5 font-mono text-micro text-ink">
                  <span className="rounded-[4px] bg-sunken px-1.5 py-0.5">D = {summary.d}</span>
                  <span className="rounded-[4px] bg-sunken px-1.5 py-0.5">
                    N {summary.n} · M {summary.m}
                  </span>
                  <span className="rounded-[4px] bg-sunken px-1.5 py-0.5">
                    {format(summary.truncated ? dict.presets.minimalAtLeast : dict.presets.minimalCount, {
                      count: summary.minimal.toLocaleString(locale === 'id' ? 'id-ID' : 'en-GB'),
                    })}
                  </span>
                </p>
                {/* The phenomenon is the content of this page, so it is prose. */}
                <p className="mt-3 flex-1 font-sans text-base text-muted">{preset.phenomenon[locale]}</p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  {/* The preset id is the shared URL — stable and readable. */}
                  <Link
                    href={`/${locale}/graf#p=${preset.id}`}
                    className="inline-flex h-9 items-center rounded-ctl border border-ink bg-ink px-3.5 font-sans text-fine font-medium text-surface transition-colors hover:border-indigo hover:bg-indigo"
                  >
                    {dict.presets.open} →
                  </Link>
                  {/*
                    Shown as the fragment it actually is. A bare slug beside a
                    button reads as leaked metadata; `#p=worst-case` reads as the
                    link the button is about to follow, which is what it is.
                  */}
                  <code
                    aria-label={dict.presets.linkFragment}
                    title={dict.presets.linkFragment}
                    className="font-mono text-micro text-muted"
                  >
                    #p={preset.id}
                  </code>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
