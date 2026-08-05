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
