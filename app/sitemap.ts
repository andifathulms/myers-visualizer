import type { MetadataRoute } from 'next'
import { LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/locales'
import { ROUTES, urlFor } from '@/lib/seo'

/**
 * Generated from the route list rather than written out, so a new locale or a
 * new page cannot be forgotten here. There was no sitemap at all: on Pages
 * there is no default, so eight URLs in two languages were discoverable only
 * by following links.
 *
 * `output: 'export'` renders this to a static out/sitemap.xml at build time.
 */
export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((locale) =>
    ROUTES.map((route) => ({
      url: urlFor(locale, route),
      // The home page and the tool are the two entry points worth ranking;
      // the rest are supporting. No lastModified: a date this file cannot
      // actually know is worse than none, and a build timestamp would claim
      // every page changed on every deploy.
      priority: route === '' ? 1 : route === 'graf' ? 0.9 : 0.7,
      alternates: {
        languages: Object.fromEntries([
          ...LOCALES.map((other) => [other, urlFor(other, route)]),
          ['x-default', urlFor(DEFAULT_LOCALE, route)],
        ]),
      },
    })),
  )
}
