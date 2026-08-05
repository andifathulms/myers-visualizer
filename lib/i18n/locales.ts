export const LOCALES = ['en', 'id'] as const

export type Locale = (typeof LOCALES)[number]

/**
 * English is the default: it is the language of the paper, of the algorithm
 * terms the UI keeps in English anyway, and of most of this project's likely
 * readers. Indonesian remains a full second locale at /id.
 */
export const DEFAULT_LOCALE: Locale = 'en'

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}
