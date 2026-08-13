'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LOCALES, type Locale } from '@/lib/i18n/locales'
import type { Dict } from '@/lib/i18n/dictionary'
import { BrandMark } from '@/components/chrome/BrandMark'

/**
 * Sticky, because the tool pages are long and the way back to the
 * explanation should never be a scroll away. The current section is marked:
 * three unstyled links gave no sense of where you were.
 *
 * Two rows on a phone, one from `sm`. The links used to sit in a horizontal
 * scroller so the header could never wrap — but at 390px that rendered
 * "Compare" as "Cc", and a word cut in half in the first thing a visitor
 * sees reads as broken rather than as scrollable. A deliberate second row
 * costs about 36px and shows all three destinations.
 */
export function SiteNav({ locale, dict }: { locale: Locale; dict: Dict }) {
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
        className="mx-auto max-w-7xl px-4 py-2 font-sans text-sm sm:flex sm:items-center sm:gap-4 sm:px-gutter sm:py-2.5"
      >
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/${locale}`}
            className="flex shrink-0 items-center gap-2 font-serif text-lg font-semibold tracking-tight"
          >
            <BrandMark size={20} />
            {dict.nav.brand}
          </Link>

          <LocaleToggle locale={locale} dict={dict} className="flex sm:hidden" />
        </div>

        <div className="mt-1 flex min-w-0 flex-1 items-center gap-1 sm:mt-0">
          {links.map((link) => {
            // trailingSlash is on, so compare on a normalised path.
            const active = pathname.replace(/\/$/, '') === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 transition-colors sm:px-3 ${
                  active
                    ? 'bg-indigo/10 font-medium text-deepIndigo'
                    : // Not muted: these are the three places you can go, and
                      // secondary-text weight made them read as fine print.
                      'text-deepIndigo hover:bg-indigo/5'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        <LocaleToggle locale={locale} dict={dict} className="hidden sm:flex" />
      </nav>
    </header>
  )
}

/**
 * Both locales, with the current one held down. A lone "ID" chip looked like
 * a status badge rather than a control, and gave no clue which way it would
 * take you. Language codes are not interface copy and are not translated;
 * the accessible name is.
 */
function LocaleToggle({
  locale,
  dict,
  className,
}: {
  locale: Locale
  dict: Dict
  className: string
}) {
  return (
    <div
      className={`shrink-0 items-center gap-0.5 rounded-lg border border-rule bg-paper p-0.5 ${className}`}
    >
      {LOCALES.map((code) =>
        code === locale ? (
          <span
            key={code}
            aria-current="true"
            className="rounded-md bg-indigo/10 px-2 py-1 text-micro font-semibold uppercase tracking-wider text-deepIndigo"
          >
            {code}
          </span>
        ) : (
          <Link
            key={code}
            href={`/${code}`}
            title={dict.a11y.switchLocale}
            aria-label={`${dict.a11y.switchLocale}: ${code.toUpperCase()}`}
            className="rounded-md px-2 py-1 text-micro font-semibold uppercase tracking-wider text-muted transition-colors hover:text-deepIndigo"
          >
            {code}
          </Link>
        ),
      )}
    </div>
  )
}
