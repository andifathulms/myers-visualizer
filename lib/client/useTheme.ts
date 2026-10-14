'use client'

import { useEffect, useState } from 'react'
import type { Theme } from '@/lib/palette'
import { THEME_STORAGE_KEY } from '@/lib/theme'

/**
 * The reader's theme. Three states, as the platform has them: an explicit
 * choice sets `data-theme` on <html>; "system" sets nothing and lets
 * `prefers-color-scheme` decide. CSS needs nothing from here — the custom
 * properties switch on their own. This exists for canvas, which is handed a
 * palette rather than reading CSS, and for the toggle.
 */
export type ThemePreference = 'system' | Theme

const DARK_QUERY = '(prefers-color-scheme: dark)'

function systemTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

export function readPreference(): ThemePreference {
  if (typeof document === 'undefined') return 'system'
  const attr = document.documentElement.dataset.theme
  return attr === 'light' || attr === 'dark' ? attr : 'system'
}

function resolve(preference: ThemePreference): Theme {
  return preference === 'system' ? systemTheme() : preference
}

/** Apply and remember a choice. Storage can be refused; the choice still applies. */
export function setPreference(preference: ThemePreference): void {
  const root = document.documentElement
  if (preference === 'system') delete root.dataset.theme
  else root.dataset.theme = preference
  try {
    if (preference === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Private windows and blocked storage: the theme holds for this page.
  }
}

/**
 * The preference and the theme it resolves to, kept current as either the
 * attribute or the system setting changes. Starts at light on the server and
 * in the first client render, then corrects in an effect — so hydration sees
 * the same markup the static export wrote.
 */
export function useTheme(): { preference: ThemePreference; theme: Theme } {
  const [preference, setPref] = useState<ThemePreference>('system')
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const update = () => {
      const next = readPreference()
      setPref(next)
      setTheme(resolve(next))
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const media = typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null
    media?.addEventListener('change', update)
    return () => {
      observer.disconnect()
      media?.removeEventListener('change', update)
    }
  }, [])

  return { preference, theme }
}
