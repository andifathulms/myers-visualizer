import type { Metadata } from 'next'
import Link from 'next/link'
import { DEFAULT_LOCALE } from '@/lib/i18n/locales'
import { urlFor } from '@/lib/seo'

/**
 * The root is a redirect, not a page. Pointing its canonical at the default
 * locale keeps it from competing with /en/ for the same content — without it,
 * the site's front door and its English home page are two URLs with one body.
 */
export const metadata: Metadata = {
  alternates: { canonical: urlFor(DEFAULT_LOCALE, '') },
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

// `redirect()` is unavailable under `output: 'export'`, so the root document is a
// static meta-refresh into the default locale.
export default function Index() {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${BASE}/${DEFAULT_LOCALE}/`} />
      <main className="grid min-h-screen place-items-center">
        <Link href={`/${DEFAULT_LOCALE}`} className="font-sans underline">
          Myers Visualizer
        </Link>
      </main>
    </>
  )
}
