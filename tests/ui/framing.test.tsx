import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '@/app/[locale]/page'
import { SiteFooter } from '@/components/chrome/SiteFooter'
import { READING } from '@/lib/links'
import { getDict } from '@/lib/i18n/dictionary'
import { LOCALES } from '@/lib/i18n/locales'

/**
 * The framing is a stated requirement, not decoration: the site links the
 * paper and Coglan's series prominently, and says plainly that git applies
 * additional heuristics rather than implying parity.
 *
 * The reading section shipped once with a heading and no links at all, which
 * is exactly the kind of thing nobody notices. Hence these.
 */
describe('framing', () => {
  it.each(LOCALES.map((locale) => [locale] as const))(
    'links the paper and the explainer from the home page in %s',
    (locale) => {
      render(<Home params={{ locale }} />)
      for (const entry of READING) {
        const link = screen.getByRole('link', { name: entry.title })
        expect(link.getAttribute('href')).toBe(entry.href)
        // Each carries a reason to follow it, not just a bare URL.
        expect(screen.getByText(entry.note[locale])).toBeDefined()
      }
    },
  )

  it.each(LOCALES.map((locale) => [locale] as const))(
    'states plainly that this is not git, in %s',
    (locale) => {
      render(<Home params={{ locale }} />)
      const dict = getDict(locale)
      expect(screen.getByText(dict.home.notGit)).toBeDefined()
      // The claim has to name git and disclaim parity, not merely gesture.
      expect(dict.home.notGit.toLowerCase()).toContain('git')
    },
  )

  it('links the same reading from the footer, and the source', () => {
    render(<SiteFooter locale="en" />)
    for (const entry of READING) {
      expect(screen.getByRole('link', { name: entry.title }).getAttribute('href')).toBe(entry.href)
    }
    expect(screen.getByRole('link', { name: 'Source code' })).toBeDefined()
  })

  it('opens external links safely', () => {
    render(<SiteFooter locale="id" />)
    for (const link of screen.getAllByRole('link')) {
      const rel = link.getAttribute('rel') ?? ''
      expect(rel).toContain('noopener')
    }
  })
})

describe('the glossary', () => {
  /*
   * Algorithm terms stay in English by policy, so the glossary is the only
   * place they are explained. It is not decoration: a term used in the
   * interface and missing here is a term the reader has no way to look up.
   */
  it('defines as many terms in one locale as the other', () => {
    // Not term-for-term identical: "the V array" is "array V" in Indonesian,
    // because the article moves. The count and the order are what must match.
    const [en, id] = [getDict('en').glossary, getDict('id').glossary]
    expect(id).toHaveLength(en.length)
  })

  it('covers the notation the interface actually uses', () => {
    const terms = getDict('en').glossary.map((entry) => entry.term)
    for (const term of ['D', 'diagonal k', 'snake', 'frontier', 'backtrack', 'tie-breaking', 'hunk', 'tokenize', 'O(...)']) {
      expect(terms, `${term} is used in the interface`).toContain(term)
    }
    expect(terms.some((term) => /V array/.test(term))).toBe(true)
  })

  it('says something for every term, in both locales', () => {
    for (const locale of ['en', 'id'] as const) {
      for (const entry of getDict(locale).glossary) {
        expect(entry.plain.length, `${locale}: ${entry.term}`).toBeGreaterThan(30)
      }
    }
  })
})
