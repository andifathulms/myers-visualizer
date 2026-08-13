import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/seo'

/**
 * There was no robots.txt. Nothing here is disallowed — the whole site is
 * public and static — so its one job is pointing at the sitemap, which is the
 * part that was actually missing.
 *
 * /bench is excluded: it is the render benchmark harness, not a page, and a
 * search result for it would be a dead end.
 */
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: '/bench' }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
