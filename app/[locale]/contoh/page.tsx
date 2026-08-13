import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PRESETS } from '@/data/presets'
import { getDict } from '@/lib/i18n/dictionary'
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
 */
export default function ContohPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const { locale } = params
  const dict = getDict(locale)

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <header className="max-w-3xl">
        <h1 className="font-serif text-h1 font-semibold">{dict.presets.title}</h1>
        <p className="measure mt-3 font-sans text-lg text-indigo">
          {dict.presets.lede}
        </p>
      </header>

      <ul className="mt-10 grid gap-5 sm:grid-cols-2">
        {PRESETS.map((preset) => (
          <li key={preset.id} className="card flex flex-col p-5">
            <h2 className="font-serif text-h3 font-semibold">{preset.title[locale]}</h2>
            {/* The phenomenon is the content of this page, so it is prose. */}
            <p className="mt-2 flex-1 font-sans text-base text-muted">
              {preset.phenomenon[locale]}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              {/* The preset id is the shared URL — stable and readable. */}
              <Link
                href={`/${locale}/graf#p=${preset.id}`}
                className="inline-flex h-9 items-center rounded-lg border border-rule bg-cotton px-3.5 font-sans text-fine font-medium text-deepIndigo transition-colors hover:border-madder hover:text-madder"
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
          </li>
        ))}
      </ul>
    </main>
  )
}
