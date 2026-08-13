import type { Config } from 'tailwindcss'
import { PALETTE } from './lib/palette'

/**
 * Palette is normative — PRD §9 — and lives in lib/palette.ts so that canvas,
 * which cannot use utility classes, reads the same values. Never raw hex in
 * components.
 *
 * Utilities resolve to the custom properties declared in app/globals.css
 * rather than to the hex directly, so that the token layer is one place and
 * not two. `<alpha-value>` keeps `bg-indigo/10` working — hence channels
 * rather than a colour string. PALETTE stays imported because it is still the
 * source of truth: tests/ui/tokens.test.ts asserts the CSS matches it.
 */
const channels = (token: keyof typeof PALETTE) => `rgb(var(--color-${kebab(token)}) / <alpha-value>)`

function kebab(token: string): string {
  return token.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

const colors = Object.fromEntries(
  (Object.keys(PALETTE) as (keyof typeof PALETTE)[]).map((token) => [token, channels(token)]),
)

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors,
      /*
       * One scale. Roles, not t-shirt sizes — a component picks the size that
       * matches what the text *is*, which is what keeps the page consistent
       * when a new panel is added. Line heights ride along so that body copy
       * cannot accidentally ship at leading-none.
       */
      fontSize: {
        micro: ['var(--text-micro)', { lineHeight: '1.45' }],
        fine: ['var(--text-fine)', { lineHeight: '1.5' }],
        sm: ['var(--text-sm)', { lineHeight: '1.55' }],
        base: ['var(--text-base)', { lineHeight: '1.65' }],
        lg: ['var(--text-lg)', { lineHeight: '1.6' }],
        h3: ['var(--text-h3)', { lineHeight: '1.3' }],
        h2: ['var(--text-h2)', { lineHeight: '1.2' }],
        h1: ['var(--text-h1)', { lineHeight: '1.15' }],
        hero: ['var(--text-hero)', { lineHeight: '1.08' }],
      },
      spacing: {
        gutter: 'var(--space-gutter)',
        stack: 'var(--space-stack)',
        section: 'var(--space-section)',
        hero: 'var(--space-hero)',
      },
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
