'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getDict } from '@/lib/i18n/dictionary'
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/locales'

/**
 * Next's own route-level error boundary, DESIGN.md §8: it wraps this
 * segment's page (and anything nested under it) while leaving the layout —
 * nav, footer — in place, since a render-time throw in one page's content is
 * not a reason to take navigation down with it.
 *
 * Next does not pass route params to this file, so the locale is read back
 * out of the URL instead. `usePathname` only resolves client-side, which is
 * exactly when this file ever renders.
 */
export default function LocaleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname()
  const segment = pathname?.split('/').filter(Boolean)[0] ?? ''
  const locale = isLocale(segment) ? segment : DEFAULT_LOCALE
  const dict = getDict(locale)
  const t = dict.error

  return (
    <div className="mx-auto max-w-2xl px-gutter py-section">
      <div role="alert" className="card border-l-[3px] border-l-madder p-6 sm:p-8">
        <h1 className="font-serif text-h2 font-semibold">{t.title}</h1>
        <p className="measure mt-3 font-sans text-base text-muted">{t.body}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center rounded-lg border border-indigo bg-indigo px-4 font-sans text-sm font-medium text-paper transition-colors hover:bg-deepIndigo"
          >
            {t.retry}
          </button>
          <Link
            href={`/${locale}/`}
            className="inline-flex h-10 items-center rounded-lg border border-rule bg-paper px-4 font-sans text-sm font-medium text-deepIndigo transition-colors hover:border-indigo/60"
          >
            {dict.nav.home}
          </Link>
        </div>
      </div>
    </div>
  )
}
