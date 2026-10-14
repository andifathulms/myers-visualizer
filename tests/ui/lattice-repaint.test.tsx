import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

/**
 * A lattice whose frame never changes still has to be painted. The comparison
 * page draws a static lattice — no playback, the same frame for the life of
 * the page — and the graph page sits on one frame whenever it is paused. If
 * the canvas only paints when the frame changes, a newly built renderer (on
 * mount, on resize, on a new input) leaves the canvas blank until something
 * else moves. This found exactly that: the comparison lattice drew its routes
 * over an empty box.
 */
const draws = vi.hoisted(() => ({ count: 0 }))

vi.mock('@/components/lattice/render', () => ({
  LatticeRenderer: class {
    setScene(): void {}
    clearExplored(): void {}
    stampExplored(): void {}
    draw(): void {
      draws.count++
    }
  },
}))

import { LatticeCanvas } from '@/components/lattice/LatticeCanvas'

describe('LatticeCanvas painting', () => {
  it('paints once its renderer exists, even if the frame never changes', () => {
    draws.count = 0
    render(<LatticeCanvas n={3} m={4} matches={null} />)
    expect(draws.count).toBeGreaterThan(0)
  })
})
