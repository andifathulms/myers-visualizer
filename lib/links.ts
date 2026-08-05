import type { Locale } from './i18n/locales'

/**
 * The paper and Coglan's series are linked prominently — his is the best
 * written explanation available and pointing to it costs nothing. Defined once
 * so the home page and the footer cannot drift apart.
 */
export type Reading = {
  readonly href: string
  readonly title: string
  readonly note: Record<Locale, string>
}

export const READING: readonly Reading[] = [
  {
    href: 'http://www.xmailserver.org/diff2.pdf',
    title: 'Myers, An O(ND) Difference Algorithm and Its Variations (1986)',
    note: {
      id: 'Sumber normatif. Tidak biasa untuk sebuah paper: enak dibaca, dan notasinya dipakai apa adanya di kode ini.',
      en: 'The normative source. Unusually readable for a paper, and its notation is used as-is throughout this code.',
    },
  },
  {
    href: 'https://blog.jcoglan.com/2017/02/12/the-myers-diff-algorithm-part-1/',
    title: 'James Coglan — The Myers diff algorithm',
    note: {
      id: 'Penjelasan tertulis terbaik yang ada, dalam empat bagian.',
      en: 'The best written explanation available, in four parts.',
    },
  },
]

export const REPOSITORY = 'https://github.com/andifathulms/myers-visualizer'
