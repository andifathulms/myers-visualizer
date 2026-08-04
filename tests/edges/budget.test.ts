import { describe, expect, it } from 'vitest'
import { myersGreedy } from '@/lib/diff/myers'
import { checkApply } from '@/lib/diff/apply'
import { BudgetExceededError } from '@/lib/diff/types'
import { worstCase } from '../corpus'

/**
 * The pathological path is deliberately reachable — the worst case is a
 * shipped preset — so it must fail loudly against a budget rather than hang.
 * PRD §7, CLAUDE.md invariant 9.
 */
describe('step budget', () => {
  it('throws BudgetExceededError rather than running forever', () => {
    const { a, b } = worstCase(200)
    expect(() => myersGreedy(a, b, { stepBudget: 500 })).toThrow(BudgetExceededError)
  })

  it('reports the budget it was given', () => {
    const { a, b } = worstCase(100)
    try {
      myersGreedy(a, b, { stepBudget: 42 })
      expect.unreachable('should have exceeded the budget')
    } catch (error) {
      expect(error).toBeInstanceOf(BudgetExceededError)
      expect((error as BudgetExceededError).budget).toBe(42)
    }
  })

  it('completes the worst case at the input cap within the default budget', () => {
    // D = N + M = 600 with no free diagonals anywhere: the O(D²) corner.
    const { a, b } = worstCase(300)
    const { script, stats } = myersGreedy(a, b)
    expect(stats.d).toBe(600)
    expect(checkApply(a, b, script).ok).toBe(true)
    expect(stats.budgetExhausted).toBe(false)
  })

  it('records O(D²) V cells on the worst case — the number the UI shows', () => {
    const { a, b } = worstCase(60)
    const { stats } = myersGreedy(a, b)
    expect(stats.vCells).toBe((stats.d + 2) ** 2)
  })
})
