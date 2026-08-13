'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@/lib/i18n/locales'
import type { Dict } from '@/lib/i18n/dictionary'
import { BrandMark } from '@/components/chrome/BrandMark'

/**
 * Sticky, because the tool pages are long and the way back to the
 * explanation should never be a scroll away. The current section is marked:
 * three unstyled links gave no sense of where you were.
 */
export function SiteNav({ locale, dict }: { locale: Locale; dict: Dict }) {
  const other: Locale = locale === 'id' ? 'en' : 'id'
  const pathname = usePathname() ?? ''

  const links = [
    { href: `/${locale}/graf`, label: dict.nav.graph },
    { href: `/${locale}/banding`, label: dict.nav.compare },
    { href: `/${locale}/contoh`, label: dict.nav.presets },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-cotton/85 backdrop-blur-sm">
      <nav
        aria-label={dict.nav.brand}
        className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2.5 font-sans text-sm sm:px-5"
      >
        <Link
          href={`/${locale}`}
          className="mr-2 flex shrink-0 items-center gap-2 font-serif text-lg font-semibold tracking-tight sm:mr-4"
        >
          <BrandMark size={20} />
          {dict.nav.brand}
        </Link>

        {/* Scrolls rather than wraps: a two-line sticky header eats the view. */}
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {links.map((link) => {
            // trailingSlash is on, so compare on a normalised path.
            const active = pathname.replace(/\/$/, '') === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 transition-colors ${
                  active
                    ? 'bg-indigo/10 font-medium text-deepIndigo'
                    : 'text-muted hover:bg-indigo/5 hover:text-deepIndigo'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        <Link
          href={`/${other}`}
          title={dict.a11y.switchLocale}
          aria-label={`${dict.a11y.switchLocale}: ${other.toUpperCase()}`}
          className="ml-2 shrink-0 rounded-lg border border-rule bg-paper px-2.5 py-1 text-fine font-medium uppercase tracking-wider text-muted transition-colors hover:border-indigo/60 hover:text-deepIndigo"
        >
          {other}
        </Link>
      </nav>
    </header>
  )
}
