import Link from 'next/link'
import { DEFAULT_LOCALE } from '@/lib/i18n/locales'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

// `redirect()` is unavailable under `output: 'export'`, so the root document is a
// static meta-refresh into the default locale.
export default function Index() {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${BASE}/${DEFAULT_LOCALE}/`} />
      <main className="grid min-h-screen place-items-center">
        <Link href={`/${DEFAULT_LOCALE}`} className="font-sans underline">
          Selisih
        </Link>
      </main>
    </>
  )
}
