import type { Locale } from '@/lib/i18n/locales'

const LINKS = [
  {
    label: 'Myers, An O(ND) Difference Algorithm and Its Variations (1986)',
    href: 'http://www.xmailserver.org/diff2.pdf',
  },
  {
    label: 'James Coglan — The Myers diff algorithm',
    href: 'https://blog.jcoglan.com/2017/02/12/the-myers-diff-algorithm-part-1/',
  },
]

export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="mt-16 border-t border-indigo/20 px-5 py-8 font-sans text-xs text-indigo">
      <div className="mx-auto flex max-w-7xl flex-col gap-2">
        <ul className="flex flex-col gap-1">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a className="underline hover:text-madder" href={l.href} rel="noreferrer noopener">
                {l.label}
              </a>
            </li>
          ))}
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
