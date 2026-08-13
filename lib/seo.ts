import type { Metadata } from 'next'
import { APP_NAME, APP_TITLE, APP_DESCRIPTION } from '@/lib/brand'
import { getDict } from '@/lib/i18n/dictionary'
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales'

/**
 * Per-route metadata, read from the same dictionary the page renders.
 *
 * Every page used to emit the site's one title, the site's one description
 * and an og:url pointing at the root — so four distinct pages in two
 * languages looked like eight copies of the home page to a crawler, and a
 * link shared to the edit graph previewed as the front door.
 *
 * The rule that matters here is that nothing is retyped. A page's title is
 * its own <h1> string and its description is its own lede, taken from the
 * dictionary at build time. Copy edited on the page moves the metadata with
 * it; a description cannot drift from the page it describes because there is
 * only one of it.
 */
export const SITE = 'https://andifathulms.github.io/myers-visualizer'

/** The four real routes. Keys are the URL segment, or '' for the locale root. */
export type Route = '' | 'graf' | 'banding' | 'contoh'

export const ROUTES: readonly Route[] = ['', 'graf', 'banding', 'contoh']

/**
 * Title and description for a route, in a locale — the page's own heading and
 * its own opening paragraph. Where a page has both a plain-language lede and a
 * precise one, the plain one is used: it is what a stranger reads in a search
 * result, and it is the sentence written for exactly that job.
 */
function copyFor(locale: Locale, route: Route): { title: string; description: string } {
  const dict = getDict(locale)
  switch (route) {
    case '':
      // The home page's h1 is a question; on its own in a tab it says nothing
      // about what the site is, so the site title stands and the lede
      // describes it.
      return { title: APP_TITLE, description: dict.home.lede }
    case 'graf':
      return { title: `${dict.graph.title} — ${APP_NAME}`, description: dict.graph.lede }
    case 'banding':
      return { title: `${dict.compare.title} — ${APP_NAME}`, description: dict.compare.plain }
    case 'contoh':
      return { title: `${dict.presets.title} — ${APP_NAME}`, description: dict.presets.lede }
    default: {
      const never: never = route
      throw new Error(`unknown route ${JSON.stringify(never)}`)
    }
  }
}

export const urlFor = (locale: Locale, route: Route): string =>
  route === '' ? `${SITE}/${locale}/` : `${SITE}/${locale}/${route}/`

/**
 * Absolute URLs throughout. `metadataBase` already carries the basePath, so a
 * root-relative path here would pick it up a second time — the same trap the
 * social card comment in app/layout.tsx records.
 */
export function metadataFor(locale: Locale, route: Route): Metadata {
  const { title, description } = copyFor(locale, route)
  const url = urlFor(locale, route)

  // hreflang needs every locale plus a default for readers whose language
  // matches neither. English is the default, per lib/i18n/locales.ts.
  const languages: Record<string, string> = { 'x-default': urlFor(DEFAULT_LOCALE, route) }
  for (const other of LOCALES) languages[other] = urlFor(other, route)

  return {
    title,
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      type: 'website',
      siteName: APP_NAME,
      locale,
      title,
      description,
      url,
      images: [{ url: `${SITE}/brand/og.png`, width: 1200, height: 630, alt: APP_NAME }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [`${SITE}/brand/og.png`] },
  }
}

/**
 * Structured data for the site itself, emitted once on the home page.
 *
 * Same source as everything else, and deliberately minimal: what the thing is,
 * what it is called, who made it, and that it costs nothing. Claiming more —
 * ratings, counts, dates it did not have — is the kind of markup that gets a
 * site penalised rather than surfaced.
 */
export function structuredData(locale: Locale): string {
  const dict = getDict(locale)
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: APP_NAME,
    alternateName: APP_TITLE,
    url: urlFor(locale, ''),
    description: dict.home.lede,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any browser',
    inLanguage: locale,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@type': 'Person', name: 'Andi Fathul Mukminin Salahuddin' },
    about: {
      '@type': 'CreativeWork',
      name: 'An O(ND) Difference Algorithm and Its Variations',
      author: { '@type': 'Person', name: 'Eugene W. Myers' },
      datePublished: '1986',
    },
    keywords: APP_DESCRIPTION,
  })
}
