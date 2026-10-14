'use client'

import { setPreference, useTheme, type ThemePreference } from '@/lib/client/useTheme'
import type { Dict } from '@/lib/i18n/dictionary'

const ORDER: readonly ThemePreference[] = ['system', 'light', 'dark']
const GLYPH: Record<ThemePreference, string> = { system: '◐', light: '☀', dark: '☾' }

/**
 * One button that cycles match-system → day → night. The current state is in
 * its accessible name ("Theme: Night"), so a screen reader hears what it is
 * now rather than guessing from a glyph; pressing it moves to the next.
 */
export function ThemeToggle({ dict }: { dict: Dict }) {
  const t = dict.a11y.theme
  const { preference } = useTheme()
  const next = ORDER[(ORDER.indexOf(preference) + 1) % ORDER.length]
  const name = `${t.label}: ${t[preference]}`

  return (
    <button
      type="button"
      onClick={() => setPreference(next)}
      aria-label={name}
      title={name}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ctl border border-rule bg-surface font-sans text-sm text-muted transition-colors hover:text-ink"
    >
      <span aria-hidden>{GLYPH[preference]}</span>
    </button>
  )
}
