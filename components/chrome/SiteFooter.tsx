import type { Locale } from '@/lib/i18n/locales'
import { getDict } from '@/lib/i18n/dictionary'

import { READING, REPOSITORY } from '@/lib/links'

/**
 * The reading and the not-git disclaimer are a stated requirement, not
 * decoration — they appear here as well as on the home page so they are
 * reachable from the tool without going back. PRD §14.
 */
export function SiteFooter({ locale }: { locale: Locale }) {
  const dict = getDict(locale)

  return (
    <footer className="mt-20 border-t border-rule bg-paper/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 font-sans text-sm sm:grid-cols-[1fr_auto]">
        <div>
          <p className="font-serif text-lg font-semibold">{dict.nav.brand}</p>
          <p className="measure mt-2 text-[13px] leading-relaxed text-muted">
            {locale === 'id'
              ? 'Git menerapkan heuristik tambahan di atas Myers. Situs ini tidak mengklaim keluaran identik dengan git diff.'
              : 'Git applies additional heuristics on top of Myers. This site makes no claim of output identical to git diff.'}
          </p>
        </div>

        <nav
          aria-label={dict.home.creditsTitle}
          className="flex flex-col gap-2 text-[13px] sm:text-right"
        >
          {READING.map((entry) => (
            <a
              key={entry.href}
              className="text-muted underline decoration-rule underline-offset-4 hover:text-madder"
              href={entry.href}
              rel="noreferrer noopener"
            >
              {entry.title}
            </a>
          ))}
          <a
            className="text-muted underline decoration-rule underline-offset-4 hover:text-madder"
            href={REPOSITORY}
            rel="noreferrer noopener"
          >
            {locale === 'id' ? 'Kode sumber' : 'Source code'}
          </a>
        </nav>
      </div>
    </footer>
  )
}
