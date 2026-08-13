/**
 * The single source of the palette. PRD §9.
 *
 * Tailwind imports these tokens, and canvas — which cannot use utility
 * classes — reads them by name here. A hex literal belongs in this file
 * and nowhere else.
 *
 *   madder is reserved for the chosen path and the middle snake: the two
 *   things that are *the answer*. Never use it for anything else.
 *
 * The lattice tokens below are normative and unchanged. The rest are surface
 * and text tones, added so the interface can group things — a card that lifts
 * off the ground, a hairline that is not a translucent hack, a secondary text
 * tone that is actually legible. They carry no algorithmic meaning.
 */
export const PALETTE = {
  /** Undyed cotton — the ground. */
  cotton: '#E8E2D4',
  /** Bleached cotton — a raised surface. Cards sit on this, above the ground. */
  paper: '#F4F1E8',
  /** A hairline between surfaces. Warm, so it reads as a fold rather than a border. */
  rule: '#D3CAB6',
  /** The lattice and structure. */
  indigo: '#2A3D5C',
  /** Text. */
  deepIndigo: '#1A2438',
  /**
   * Secondary text. 5.1:1 on cotton and 5.8:1 on paper — measured, not
   * estimated. It was a shade lighter and claimed 5.5:1; it was actually
   * 4.3:1 on the ground, which is where the glossary and the axis labels
   * live. `tests/ui/tokens.test.ts` holds the floor now.
   */
  muted: '#525E75',
  /** The advancing frontier — the live edge of the search. */
  turmeric: '#C9982E',
  /** The chosen path and the middle snake. Nothing else. */
  madder: '#A63D2F',
  /** Pale indigo wash for the explored region. */
  explored: '#C7CEDC',
  /**
   * The diff output's two directions. Deletion is deliberately *not* madder:
   * madder means "this is the answer" in the lattice, and a removed line is
   * not an answer. Both clear 4.5:1 on paper.
   */
  added: '#3E6B54',
  removed: '#8A4B3A',
} as const

export type PaletteToken = keyof typeof PALETTE

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
