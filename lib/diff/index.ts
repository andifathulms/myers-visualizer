/**
 * The engine's public surface. `(a, b, options) → { script, trace, stats }`.
 * Pure and deterministic; nothing here touches React, the DOM or the clock.
 */
import { myersGreedy } from './myers'
import { patienceDiff } from './patience'
import { histogramDiff } from './histogram'
import type { AlgorithmId, DiffStats, EditScript, SearchOptions, Token } from './types'
import type { SearchTrace } from './trace'

export type DiffResult = {
  readonly script: EditScript
  readonly trace: SearchTrace
  readonly stats: DiffStats
}

export function diff(
  a: readonly Token[],
  b: readonly Token[],
  algorithm: AlgorithmId = 'myers',
  options: Partial<SearchOptions> = {},
): DiffResult {
  switch (algorithm) {
    case 'myers':
      return myersGreedy(a, b, options)
    case 'patience':
      return patienceDiff(a, b)
    case 'histogram':
      return histogramDiff(a, b)
    case 'myers-linear':
      throw new Error(`algorithm ${algorithm} is not implemented yet`)
    default: {
      const never: never = algorithm
      throw new Error(`unknown algorithm ${JSON.stringify(never)}`)
    }
  }
}

export { myersGreedy } from './myers'
export { patienceDiff } from './patience'
export { histogramDiff } from './histogram'
export { backtrack, pathOf } from './backtrack'
export { apply, checkApply, checkWellFormed, ApplyError } from './apply'
export * from './types'
export * from './trace'
