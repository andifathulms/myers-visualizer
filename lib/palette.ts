/**
 * The single source of the palette. PRD §9, DESIGN.md §3.
 *
 * Tailwind imports these tokens, and canvas — which cannot use utility
 * classes — reads them by name here. A hex literal belongs in this file
 * and nowhere else.
 *
 *   madder is reserved for the chosen path and the middle snake: the two
 *   things that are *the answer*. Never use it for anything else.
 *
 * The values were re-tuned in the 2026 redesign (DESIGN.md §3, recorded
 * there). The old warm cotton/paper ground sat 1.1:1 from its own cards and
 * put the frontier at 2.03:1 on the ground, under the 3:1 WCAG asks of a
 * graphic. `tests/ui/tokens.test.ts` now holds lattice marks to 3:1 as well
 * as text to 4.5:1, on every surface.
 */
export const PALETTE = {
  /** The sheet — the page ground. Cool, so the lattice colours carry. */
  ground: '#F3F5F8',
  /** A raised surface. Instruments and cards sit on this, above the ground. */
  surface: '#FFFFFF',
  /** Recessed: inputs, code, table heads, empty tracks. */
  sunken: '#EAEEF4',
  /** A hairline between surfaces. */
  rule: '#D8DEE8',
  /** The lattice and structure; lede paragraphs. */
  indigo: '#2C3D6E',
  /** Primary text. */
  ink: '#111A2E',
  /** Secondary text. Measured on all three surfaces by the token test. */
  muted: '#55607A',
  /** The advancing frontier — the live edge of the search. */
  turmeric: '#B97A06',
  /** The chosen path and the middle snake. Nothing else. */
  madder: '#C0392B',
  /** Pale indigo wash for the explored region. */
  explored: '#D6DDEF',
  /**
   * The diff output's two directions. Deletion is deliberately *not* madder:
   * madder means "this is the answer" in the lattice, and a removed line is
   * not an answer. A wine rather than a red, so the two never read as one.
   */
  added: '#1F7A4E',
  removed: '#A3364F',
} as const

export type PaletteToken = keyof typeof PALETTE
export type Palette = { readonly [K in PaletteToken]: string }

/**
 * The brand mark's own colours — the "snake" staircase from the brand kit,
 * whose masters live in `exports/` (untracked; the shipped subset is under
 * `public/brand/` and `app/`).
 *
 * These are deliberately *not* UI tokens and must not be used as ones. The
 * kit's rules: green belongs to the path itself and is never a plain accent,
 * the cream dot is the file's starting point and the red dot is the
 * wrong-attribution moment — never swapped. They live here rather than inline
 * in a component only because this file is where hex literals are allowed.
 */
export const BRAND = {
  paper: '#E4E1D6',
  ink: '#1B1D1C',
  /** The path. */
  insert: '#3F7D5C',
  /** Where the attribution goes wrong. */
  delete: '#B14A3E',
} as const
