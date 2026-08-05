import type { Locale } from '@/lib/i18n/locales'

import { READING, REPOSITORY } from '@/lib/links'

export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="mt-16 border-t border-indigo/20 px-5 py-8 font-sans text-xs text-indigo">
      <div className="mx-auto flex max-w-7xl flex-col gap-2">
        <ul className="flex flex-col gap-1">
          {READING.map((entry) => (
            <li key={entry.href}>
              <a className="underline hover:text-madder" href={entry.href} rel="noreferrer noopener">
                {entry.title}
              </a>
            </li>
          ))}
          <li>
            <a className="underline hover:text-madder" href={REPOSITORY} rel="noreferrer noopener">
              {locale === 'id' ? 'Kode sumber' : 'Source code'}
            </a>
          </li>
        </ul>
        <p className="max-w-3xl">
          {locale === 'id'
            ? 'Git menerapkan heuristik tambahan di atas Myers. Situs ini tidak mengklaim keluaran identik dengan git diff.'
            : 'Git applies additional heuristics on top of Myers. This site makes no claim of output identical to git diff.'}
        </p>
      </div>
    </footer>
  )
}
