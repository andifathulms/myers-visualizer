'use client'

import { useEffect } from 'react'
import type { Locale } from '@/lib/i18n/locales'

/**
 * The root layout is shared by both locales, so `<html lang>` cannot be set
 * per-route there. A screen reader reading Indonesian copy with an English
 * voice is the kind of thing nobody notices until they rely on it.
 */
export function LocaleLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  return null
}
