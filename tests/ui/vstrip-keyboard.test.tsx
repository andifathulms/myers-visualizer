import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { VStrip } from '@/components/vstrip/VStrip'

/**
 * The strip is one tab stop with arrow navigation inside it, because one stop
 * per cell put 81 of them between the player and everything below on the
 * worst-case preset. The properties that makes true are worth pinning: exactly
 * one cell is tabbable at a time, the arrows move it, Home and End reach the
 * ends, and the keys it handles do not also reach the window — the stepper
 * listens for the same arrows there and would step the animation as well.
 */
const CELLS = [
  { k: -2, x: 0, y: 2 },
  { k: -1, x: 1, y: 2 },
  { k: 0, x: 2, y: 2 },
  { k: 1, x: 3, y: 2 },
]

function renderStrip() {
  return render(
    <VStrip
      cells={CELLS}
      currentD={2}
      highlightK={null}
      onHighlight={() => {}}
      label="The V array"
      hint="hint"
      idle="idle"
      groupLabel="V cells by diagonal"
    />,
  )
}

const cells = () => screen.getAllByRole('button')

describe('the V strip as one navigable group', () => {
  it('exposes exactly one tab stop, whatever the strip is holding', () => {
    renderStrip()
    expect(cells().filter((c) => c.tabIndex === 0)).toHaveLength(1)
    expect(cells()[0].tabIndex).toBe(0)
  })

  it('moves the tab stop with the arrows, and reaches both ends', () => {
    renderStrip()
    const group = screen.getByRole('toolbar', { name: 'V cells by diagonal' })

    fireEvent.keyDown(group, { key: 'ArrowRight' })
    expect(cells()[1].tabIndex).toBe(0)
    expect(cells().filter((c) => c.tabIndex === 0)).toHaveLength(1)

    fireEvent.keyDown(group, { key: 'End' })
    expect(cells()[CELLS.length - 1].tabIndex).toBe(0)

    fireEvent.keyDown(group, { key: 'Home' })
    expect(cells()[0].tabIndex).toBe(0)
  })

  it('does not run off either end', () => {
    renderStrip()
    const group = screen.getByRole('toolbar', { name: 'V cells by diagonal' })
    fireEvent.keyDown(group, { key: 'ArrowLeft' })
    expect(cells()[0].tabIndex).toBe(0)
    fireEvent.keyDown(group, { key: 'End' })
    fireEvent.keyDown(group, { key: 'ArrowRight' })
    expect(cells()[CELLS.length - 1].tabIndex).toBe(0)
  })

  it('keeps the arrows to itself, so the stepper does not step as well', () => {
    renderStrip()
    const group = screen.getByRole('toolbar', { name: 'V cells by diagonal' })
    let reachedWindow = 0
    const listener = () => {
      reachedWindow++
    }
    window.addEventListener('keydown', listener)
    fireEvent.keyDown(group, { key: 'ArrowRight' })
    fireEvent.keyDown(group, { key: 'Home' })
    window.removeEventListener('keydown', listener)
    expect(reachedWindow).toBe(0)
  })

  it('lets a key it does not handle through', () => {
    renderStrip()
    const group = screen.getByRole('toolbar', { name: 'V cells by diagonal' })
    let reachedWindow = 0
    const listener = () => {
      reachedWindow++
    }
    window.addEventListener('keydown', listener)
    fireEvent.keyDown(group, { key: ' ' })
    window.removeEventListener('keydown', listener)
    expect(reachedWindow).toBe(1)
  })
})
