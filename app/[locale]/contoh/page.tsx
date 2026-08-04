import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PRESETS } from '@/data/presets'
import { getDict } from '@/lib/i18n/dictionary'
import { LOCALES, isLocale } from '@/lib/i18n/locales'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function ContohPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const { locale } = params
  const dict = getDict(locale)

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="font-serif text-3xl font-semibold">{dict.presets.title}</h1>
      <p className="mt-2 max-w-2xl font-sans text-sm text-indigo">{dict.presets.lede}</p>

      <ul className="mt-8 flex flex-col gap-8">
        {PRESETS.map((preset) => (
          <li key={preset.id} className="border-l-2 border-indigo/30 pl-5">
            <h2 className="font-serif text-xl font-semibold">{preset.title[locale]}</h2>
            <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-indigo">
              {preset.phenomenon[locale]}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 font-sans text-xs">
              {/* The preset id is the shared URL — stable and readable. */}
              <Link
                href={`/${locale}/graf#p=${preset.id}`}
                className="rounded border border-indigo px-3 py-1 hover:border-madder hover:text-madder"
              >
                {dict.presets.open}
              </Link>
              <code className="font-mono text-indigo/70">{preset.id}</code>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
