'use client'

import { useEffect, useRef, useState } from 'react'
import { diff } from '@/lib/diff'
import { BudgetExceededError, type AlgorithmId, type Token } from '@/lib/diff/types'
import type { SearchTrace } from '@/lib/diff/trace'
import type { EditScript, DiffStats } from '@/lib/diff/types'
import type { DiffRequest, DiffResponse } from '@/workers/diff.worker'

export type DiffState =
  | { readonly status: 'idle' }
  | { readonly status: 'running' }
  | {
      readonly status: 'done'
      readonly script: EditScript
      readonly trace: SearchTrace
      readonly stats: DiffStats
    }
  | { readonly status: 'error'; readonly message: string; readonly budget: boolean }

/**
 * Runs the search in a worker, falling back to the main thread if a worker
 * cannot be constructed (older browsers, file:// hosting). The fallback is
 * still budgeted, so the failure mode is an error message rather than a
 * frozen tab.
 */
export function useDiff(
  a: readonly Token[],
  b: readonly Token[],
  algorithm: AlgorithmId,
  stepBudget?: number,
): DiffState {
  const [state, setState] = useState<DiffState>({ status: 'idle' })
  const workerRef = useRef<Worker | null>(null)
  const requestId = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return
    try {
      workerRef.current = new Worker(new URL('../../workers/diff.worker.ts', import.meta.url))
    } catch {
      workerRef.current = null
    }
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  useEffect(() => {
    const id = ++requestId.current
    setState({ status: 'running' })

    const worker = workerRef.current
    if (worker === null) {
      // Synchronous fallback. Budgeted, so a pathological input still returns.
      try {
        const result = diff(a, b, algorithm, stepBudget === undefined ? {} : { stepBudget })
        setState({ status: 'done', ...result })
      } catch (error) {
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
          budget: error instanceof BudgetExceededError,
        })
      }
      return
    }

    const onMessage = (event: MessageEvent<DiffResponse>) => {
      const data = event.data
      if (data.id !== requestId.current) return // a newer request has superseded this one
      if (data.ok) {
        setState({ status: 'done', script: data.script, trace: data.trace, stats: data.stats })
      } else {
        setState({ status: 'error', message: data.error, budget: data.budget })
      }
    }
    const onError = (event: ErrorEvent) => {
      setState({ status: 'error', message: event.message, budget: false })
    }

    worker.addEventListener('message', onMessage)
    worker.addEventListener('error', onError)
    const request: DiffRequest = { id, a: [...a], b: [...b], algorithm, stepBudget }
    worker.postMessage(request)

    return () => {
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
    }
  }, [a, b, algorithm, stepBudget])

  return state
}
