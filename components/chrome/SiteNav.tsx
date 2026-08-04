import Link from 'next/link'
import type { Locale } from '@/lib/i18n/locales'
import type { Dict } from '@/lib/i18n/dictionary'

export function SiteNav({ locale, dict }: { locale: Locale; dict: Dict }) {
  const other: Locale = locale === 'id' ? 'en' : 'id'
  return (
    <header className="border-b border-indigo/20">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 font-sans text-sm">
        <Link href={`/${locale}`} className="font-serif text-lg font-semibold tracking-tight">
          {dict.nav.home}
        </Link>
        <Link href={`/${locale}/graf`} className="hover:text-madder">
          {dict.nav.graph}
        </Link>
        <Link href={`/${locale}/banding`} className="hover:text-madder">
          {dict.nav.compare}
        </Link>
        <Link href={`/${locale}/contoh`} className="hover:text-madder">
          {dict.nav.presets}
        </Link>
        <Link
          href={`/${other}`}
          className="ml-auto rounded border border-indigo/30 px-2 py-0.5 uppercase tracking-wide"
        >
          {other}
        </Link>
      </nav>
    </header>
  )
}
