import type { Config } from 'tailwindcss'
import { PALETTE } from './lib/palette'

/**
 * Palette is normative — PRD §9 — and lives in lib/palette.ts so that canvas,
 * which cannot use utility classes, reads the same values. Never raw hex in
 * components.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ...PALETTE },
      fontFamily: {
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
