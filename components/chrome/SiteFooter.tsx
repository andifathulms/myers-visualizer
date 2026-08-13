import type { Locale } from '@/lib/i18n/locales'
import { getDict } from '@/lib/i18n/dictionary'
import { MakerSignature } from '@/components/chrome/MakerSignature'
import { BrandMark } from '@/components/chrome/BrandMark'

import { READING, REPOSITORY } from '@/lib/links'

/**
 * The reading and the not-git disclaimer are a stated requirement, not
 * decoration — they appear here as well as on the home page so they are
 * reachable from the tool without going back. PRD §14.
 *
 * The disclaimer moved down into the bottom bar so it sits opposite the
 * maker's mark: one is a claim about the software, the other is a person's
 * name, and they should read as two different kinds of thing. That bar is the
 * footer's only internal seam — a second rule would turn a quiet credit into
 * a section of its own.
 */
export function SiteFooter({ locale }: { locale: Locale }) {
  const dict = getDict(locale)

  return (
    <footer className="mt-20 border-t border-rule bg-paper/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 font-sans text-sm sm:grid-cols-[1fr_auto]">
        <p className="flex items-center gap-2.5 font-serif text-lg font-semibold">
          <BrandMark size={22} />
          {dict.nav.brand}
        </p>

        <nav
          aria-label={dict.home.creditsTitle}
          className="flex flex-col gap-2 text-fine sm:text-right"
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

      <div className="border-t border-rule">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
          <p className="measure font-sans text-fine text-muted">
            {locale === 'id'
              ? 'Git menerapkan heuristik tambahan di atas Myers. Situs ini tidak mengklaim keluaran identik dengan git diff.'
              : 'Git applies additional heuristics on top of Myers. This site makes no claim of output identical to git diff.'}
          </p>
          <MakerSignature />
        </div>
      </div>
    </footer>
  )
}
