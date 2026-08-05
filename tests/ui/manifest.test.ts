import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { APP_DESCRIPTION, APP_NAME, APP_TITLE } from '@/lib/brand'
import { BRAND } from '@/lib/palette'
import { DEFAULT_LOCALE } from '@/lib/i18n/locales'

/**
 * The manifest is a static file rather than an `app/manifest.ts` route,
 * because the file-based route ignores `metadata.manifest` and emits a link
 * without the basePath — which 404s on Pages and fails silently: the install
 * prompt simply never appears.
 *
 * The cost of a static file is drift, so this pins it. It is the same bargain
 * the presets make: a claim written down is a claim asserted.
 */
const ROOT = process.cwd()
const BASE_PATH = '/myers-visualizer'

const manifest = JSON.parse(
  readFileSync(join(ROOT, 'public', 'manifest.webmanifest'), 'utf8'),
) as {
  name: string
  short_name: string
  description: string
  start_url: string
  scope: string
  background_color: string
  theme_color: string
  icons: { src: string; sizes: string; type: string; purpose?: string }[]
}

describe('web app manifest', () => {
  it('names the app exactly as the rest of the site does', () => {
    expect(manifest.name).toBe(APP_TITLE)
    expect(manifest.short_name).toBe(APP_NAME)
    expect(manifest.description).toBe(APP_DESCRIPTION)
  })

  it('uses the brand colours, not the interface ones', () => {
    expect(manifest.background_color).toBe(BRAND.paper)
    expect(manifest.theme_color).toBe(BRAND.ink)
  })

  /**
   * basePath is the thing that breaks when the repository is renamed, and it
   * breaks quietly here — an installed app that opens on a 404.
   */
  it('carries the basePath on every URL, and opens on the default locale', () => {
    expect(manifest.scope).toBe(`${BASE_PATH}/`)
    expect(manifest.start_url).toBe(`${BASE_PATH}/${DEFAULT_LOCALE}/graf/`)
    for (const icon of manifest.icons) {
      expect(icon.src.startsWith(`${BASE_PATH}/`)).toBe(true)
    }
  })

  it('ships every icon it declares, including a maskable one', () => {
    for (const icon of manifest.icons) {
      const file = join(ROOT, 'public', icon.src.slice(BASE_PATH.length + 1))
      expect(existsSync(file), `missing ${icon.src}`).toBe(true)
    }
    // Android crops to its own shape; without this the mark loses its corners.
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true)
    expect(manifest.icons.some((icon) => icon.sizes === '192x192')).toBe(true)
    expect(manifest.icons.some((icon) => icon.sizes === '512x512')).toBe(true)
  })
})
