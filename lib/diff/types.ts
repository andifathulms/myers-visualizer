/**
 * Shared engine types. Integers only — indices, k, d and token ids are all
 * integers, and no float ever enters the search.
 */

/** A tokenized element. Equality in the search is integer comparison. */
export type Token = number

export type Point = { readonly x: number; readonly y: number }

/**
 * Edit operations, discriminated on `type`. Every op carries its token so
 * that apply() is self-contained: it needs A and the script, nothing else.
 */
export type EditOp =
  | { readonly type: 'keep'; readonly aIndex: number; readonly bIndex: number; readonly token: Token }
  | { readonly type: 'delete'; readonly aIndex: number; readonly token: Token }
  | { readonly type: 'insert'; readonly bIndex: number; readonly token: Token }

export type EditScript = readonly EditOp[]

export const ALGORITHMS = ['myers', 'myers-linear', 'patience', 'histogram'] as const

export type AlgorithmId = (typeof ALGORITHMS)[number]

/** Only Myers guarantees a minimal D. PRD §8. */
export function isMinimal(algorithm: AlgorithmId): boolean {
  return algorithm === 'myers' || algorithm === 'myers-linear'
}

export type SearchOptions = {
  /**
   * Cap on search work. Worst-case inputs are a shipped preset, so the
   * pathological path is deliberately reachable and must not hang the UI.
   */
  readonly stepBudget: number
  /** Record V snapshots and trace events. Off for the linear-space recursion's inner calls. */
  readonly record: boolean
}

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  stepBudget: 4_000_000,
  record: true,
}

/** D is the edit distance: the number of non-diagonal moves on the chosen path. */
export type DiffStats = {
  readonly d: number
  readonly n: number
  readonly m: number
  readonly snakes: number
  readonly events: number
  /** V cells retained — the number that makes the O(D²) vs O(N+M) claim concrete. §6.6 */
  readonly vCells: number
  readonly budgetExhausted: boolean
}

export class BudgetExceededError extends Error {
  constructor(readonly budget: number) {
    super(`search exceeded its step budget of ${budget}`)
    this.name = 'BudgetExceededError'
  }
}

/** Number of `delete`/`insert` ops — D for a minimal script. */
export function scriptLength(script: EditScript): number {
  let d = 0
  for (const op of script) {
    switch (op.type) {
      case 'keep':
        break
      case 'delete':
      case 'insert':
        d++
        break
      default: {
        const never: never = op
        throw new Error(`unreachable op ${JSON.stringify(never)}`)
      }
    }
  }
  return d
}

/** Contiguous runs of non-keep ops. Used by the comparison view. §6.5 */
export function hunkCount(script: EditScript): number {
  let hunks = 0
  let inside = false
  for (const op of script) {
    if (op.type === 'keep') {
      inside = false
    } else if (!inside) {
      hunks++
      inside = true
    }
  }
  return hunks
}
