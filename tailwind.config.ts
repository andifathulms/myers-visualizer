import type { Config } from 'tailwindcss'

/**
 * Palette is normative — PRD §9. Semantic tokens only; never raw hex in components.
 *
 *   madder  — the chosen path and the middle snake. "This is the answer."
 *   turmeric — the advancing frontier, the live edge of the search.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cotton: '#E8E2D4',
        indigo: '#2A3D5C',
        deepIndigo: '#1A2438',
        turmeric: '#C9982E',
        madder: '#A63D2F',
        explored: '#C7CEDC',
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
