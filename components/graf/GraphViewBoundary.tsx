'use client'

import Link from 'next/link'
import { GraphView } from '@/components/graf/GraphView'
import { ErrorBoundary } from '@/components/chrome/ErrorBoundary'
import { ShareLink } from '@/components/chrome/ShareLink'
import type { Dict } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/i18n/locales'

/**
 * A client component of its own, separate from `page.tsx`: a Server
 * Component cannot pass a closure like `fallback` across to a Client
 * Component as a prop (Next.js App Router — props between the two must be
 * serialisable), so the `ErrorBoundary` and its fallback have to be built on
 * the client side entirely. DESIGN.md §8.
 */
export function GraphViewBoundary({ locale, dict }: { locale: Locale; dict: Dict }) {
  return (
    <ErrorBoundary fallback={(reset) => <GraphCrash locale={locale} dict={dict} reset={reset} />}>
      <GraphView locale={locale} dict={dict} />
    </ErrorBoundary>
  )
}

/**
 * DESIGN.md §8: recovery that offers the presets and keeps the share link.
 * `GraphView` owns the input state, so this cannot reach back into it —
 * but the URL hash it writes on every change is already in the address bar
 * by the time any render can throw, so `ShareLink` with no `url` copies it
 * directly rather than needing GraphView's state at all.
 */
function GraphCrash({ locale, dict, reset }: { locale: Locale; dict: Dict; reset: () => void }) {
  const t = dict.error
  return (
    <main className="mx-auto max-w-2xl px-5 py-8 sm:py-10">
      <div role="alert" className="card border-l-[3px] border-l-madder p-6 sm:p-8">
        <h1 className="font-serif text-h2 font-semibold">{t.title}</h1>
        <p className="measure mt-3 font-sans text-base text-muted">{t.graphBody}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center rounded-lg border border-indigo bg-indigo px-4 font-sans text-sm font-medium text-paper transition-colors hover:bg-deepIndigo"
          >
            {t.retry}
          </button>
          <Link
            href={`/${locale}/contoh`}
            className="inline-flex h-10 items-center rounded-lg border border-rule bg-paper px-4 font-sans text-sm font-medium text-deepIndigo transition-colors hover:border-indigo/60"
          >
            {dict.presets.title}
          </Link>
          <ShareLink url="" dict={dict} />
        </div>
      </div>
    </main>
  )
}
