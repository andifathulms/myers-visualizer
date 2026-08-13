import { describe, expect, it } from 'vitest'
import { metadataFor, structuredData, urlFor, ROUTES, SITE, type Route } from '@/lib/seo'
import { getDict } from '@/lib/i18n/dictionary'
import { LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/locales'
import { APP_NAME } from '@/lib/brand'

/**
 * Metadata is generated from the dictionary the pages render from, and the
 * point of that is that it cannot drift. So this asserts the link rather than
 * the strings: each route's description *is* the lede the page shows, read
 * from the dictionary at test time. Reword a lede and both move together;
 * retype one into a metadata file and this fails.
 */
const ledeFor = (locale: (typeof LOCALES)[number], route: Route): string => {
  const dict = getDict(locale)
  switch (route) {
    case '':
      return dict.home.lede
    case 'graf':
      return dict.graph.lede
    case 'banding':
      return dict.compare.plain
    case 'contoh':
      return dict.presets.lede
  }
}

describe('per-route metadata', () => {
  it('describes each page with that page own opening paragraph', () => {
    for (const locale of LOCALES) {
      for (const route of ROUTES) {
        expect(metadataFor(locale, route).description, `${locale}/${route}`).toBe(
          ledeFor(locale, route),
        )
      }
    }
  })

  it('gives every route a distinct title within a locale', () => {
    for (const locale of LOCALES) {
      const titles = ROUTES.map((route) => metadataFor(locale, route).title)
      expect(new Set(titles).size, `${locale} titles`).toBe(ROUTES.length)
      for (const title of titles) expect(String(title)).toContain(APP_NAME)
    }
  })

  /*
   * Titles may legitimately coincide across locales: algorithm terms stay in
   * English in both by policy, so /en/graf and /id/graf are both "Edit graph".
   * What must differ is the description, which is translated prose — and the
   * canonical and hreflang above are what tell a crawler these are two
   * language versions of one page rather than duplicates.
   */
  it('describes the two locales differently, even where the title is shared', () => {
    for (const route of ROUTES) {
      const [en, id] = LOCALES.map((locale) => metadataFor(locale, route).description)
      expect(en, `${route} description`).not.toBe(id)
    }
  })

  it('canonicalises each page to itself, absolutely', () => {
    for (const locale of LOCALES) {
      for (const route of ROUTES) {
        const canonical = metadataFor(locale, route).alternates?.canonical
        expect(canonical).toBe(urlFor(locale, route))
        expect(String(canonical).startsWith(`${SITE}/`)).toBe(true)
      }
    }
  })

  it('offers every locale plus a default as hreflang alternates', () => {
    for (const route of ROUTES) {
      const languages = metadataFor(DEFAULT_LOCALE, route).alternates?.languages ?? {}
      for (const locale of LOCALES) expect(languages[locale]).toBe(urlFor(locale, route))
      expect(languages['x-default']).toBe(urlFor(DEFAULT_LOCALE, route))
    }
  })

  it('points og:url at the page, not at the site root', () => {
    for (const locale of LOCALES) {
      for (const route of ROUTES) {
        expect(metadataFor(locale, route).openGraph?.url).toBe(urlFor(locale, route))
      }
    }
  })

  it('carries a social card on every route', () => {
    for (const locale of LOCALES) {
      for (const route of ROUTES) {
        expect(JSON.stringify(metadataFor(locale, route).openGraph?.images)).toContain(
          `${SITE}/brand/og.png`,
        )
      }
    }
  })
})

describe('structured data', () => {
  it('is valid JSON describing this application', () => {
    for (const locale of LOCALES) {
      const data = JSON.parse(structuredData(locale))
      expect(data['@type']).toBe('WebApplication')
      expect(data.name).toBe(APP_NAME)
      expect(data.url).toBe(urlFor(locale, ''))
      expect(data.inLanguage).toBe(locale)
      // Same source as the page, again.
      expect(data.description).toBe(getDict(locale).home.lede)
    }
  })

  it('claims nothing it cannot support', () => {
    const data = JSON.parse(structuredData('en'))
    // Ratings, review counts and interaction counts are the fields that get a
    // site penalised when invented. None of them are here.
    for (const field of ['aggregateRating', 'review', 'interactionStatistic', 'datePublished']) {
      expect(data[field]).toBeUndefined()
    }
  })
})
