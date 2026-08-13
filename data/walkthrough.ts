/**
 * One search, written out with real numbers, for the shopping list the home
 * page already used to explain what a diff is.
 *
 * The home page could say what a diff was and what the idea behind the
 * algorithm was, but the first place a reader met an actual d, k or V was the
 * live tool — where they had to know what to press before anything would
 * happen. This is the missing middle: the same five lines, three levels of d,
 * every intermediate value, and no controls.
 *
 * The numbers are a claim about what this implementation does, so
 * tests/ui/walkthrough.test.ts holds them against what lib/diff actually
 * returns rather than trusting that they were copied correctly. Two preset
 * claims on this site were written before they were checked and both turned
 * out false; this is the same kind of claim.
 */

/** V after this level: the furthest x on each reachable diagonal. */
export type WalkLevel = {
  readonly d: number
  /** [k, x] pairs, in increasing k. */
  readonly v: readonly (readonly [number, number])[]
  /** The point the frontier stands on at the end of this level, if it moved. */
  readonly reached: readonly [number, number] | null
  /** True on the level that arrives at (N, M). */
  readonly done: boolean
}

export const WALKTHROUGH: readonly WalkLevel[] = [
  { d: 0, v: [[0, 2]], reached: [2, 2], done: false },
  {
    d: 1,
    v: [
      [-1, 2],
      [0, 2],
      [1, 3],
    ],
    reached: null,
    done: false,
  },
  {
    d: 2,
    v: [
      [-2, 2],
      [-1, 2],
      [0, 5],
      [1, 3],
    ],
    reached: [5, 5],
    done: true,
  },
]

/** The answer the walkthrough arrives at. */
export const WALKTHROUGH_D = 2
