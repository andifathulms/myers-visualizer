/// <reference lib="webworker" />

/**
 * The search runs off the main thread with a step budget, so the worst-case
 * preset — which is deliberately reachable — cannot hang the UI.
 * PRD §7, CLAUDE.md invariant 9.
 */
import { diff } from '@/lib/diff'
import { BudgetExceededError, type AlgorithmId, type Token } from '@/lib/diff/types'

export type DiffRequest = {
  readonly id: number
  readonly a: Token[]
  readonly b: Token[]
  readonly algorithm: AlgorithmId
  readonly stepBudget?: number
}

export type DiffResponse =
  | {
      readonly id: number
      readonly ok: true
      readonly script: ReturnType<typeof diff>['script']
      readonly trace: ReturnType<typeof diff>['trace']
      readonly stats: ReturnType<typeof diff>['stats']
    }
  | { readonly id: number; readonly ok: false; readonly error: string; readonly budget: boolean }

const ctx = self as unknown as DedicatedWorkerGlobalScope

ctx.addEventListener('message', (event: MessageEvent<DiffRequest>) => {
  const { id, a, b, algorithm, stepBudget } = event.data
  try {
    const result = diff(a, b, algorithm, stepBudget === undefined ? {} : { stepBudget })
    const response: DiffResponse = {
      id,
      ok: true,
      script: result.script,
      trace: result.trace,
      stats: result.stats,
    }
    ctx.postMessage(response)
  } catch (error) {
    const response: DiffResponse = {
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      budget: error instanceof BudgetExceededError,
    }
    ctx.postMessage(response)
  }
})
