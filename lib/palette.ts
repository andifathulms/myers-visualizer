/**
 * The single source of the palette. PRD §9.
 *
 * Tailwind imports these tokens, and canvas — which cannot use utility
 * classes — reads them by name here. A hex literal belongs in this file
 * and nowhere else.
 *
 *   madder is reserved for the chosen path and the middle snake: the two
 *   things that are *the answer*. Never use it for anything else.
 */
export const PALETTE = {
  /** Undyed cotton — the ground. */
  cotton: '#E8E2D4',
  /** The lattice and structure. */
  indigo: '#2A3D5C',
  /** Text. */
  deepIndigo: '#1A2438',
  /** The advancing frontier — the live edge of the search. */
  turmeric: '#C9982E',
  /** The chosen path and the middle snake. Nothing else. */
  madder: '#A63D2F',
  /** Pale indigo wash for the explored region. */
  explored: '#C7CEDC',
} as const

export type PaletteToken = keyof typeof PALETTE
