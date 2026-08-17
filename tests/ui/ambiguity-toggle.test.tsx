import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { GraphView } from '@/components/graf/GraphView'
import { getDict, format } from '@/lib/i18n/dictionary'
import { GHOST_PATH_CAP } from '@/components/lattice/frame'

/**
 * DESIGN.md §4.3: the picker selects which script is solid; every other
 * minimal script is drawn ghosted regardless, and that default is show, not
 * opt-in — a toggle can hide it, but never gates it behind a click. §4.4:
 * above GHOST_PATH_CAP the panel states the true total rather than silently
 * drawing fewer.
 *
 * The lattice's own paint is unobservable in jsdom (verified by hand against
 * the built export for steps 2-3), so this checks the one thing that is
 * observable here: the canvas's accessible label — which states the same
 * fact the paint would show — changes correctly with the toggle, and the
 * panel's capped copy appears when the cap is actually hit. The overlay
 * fields only populate once backtrack has produced a path, same as the
 * lattice paint itself, so the stepper is run to the end first.
 */
const dict = getDict('en')

async function runToEnd() {
  await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())
  fireEvent.click(screen.getByTitle(dict.stepper.end))
  // The overlay fields only populate once backtrack has produced a path —
  // wait for the label to say something about paths, not just the base text.
  await waitFor(() => expect(screen.getByRole('img', { name: /paths? exist/ })).toBeDefined())
}

describe('the alternatives toggle', () => {
  it('defaults to shown, and the canvas label says so', async () => {
    render(<GraphView locale="en" dict={dict} />)
    await runToEnd()

    const toggle = screen.getByRole('checkbox', {
      name: dict.graph.ambiguityShowToggle,
    }) as HTMLInputElement
    expect(toggle.checked).toBe(true)

    await waitFor(() =>
      expect(screen.getByRole('img', { name: /drawn as ghosted alternatives/ })).toBeDefined(),
    )
  })

  it('hiding it updates the canvas label to say so, and showing it again restores the count', async () => {
    render(<GraphView locale="en" dict={dict} />)
    await runToEnd()

    const toggle = screen.getByRole('checkbox', {
      name: dict.graph.ambiguityShowToggle,
    }) as HTMLInputElement
    fireEvent.click(toggle)
    expect(toggle.checked).toBe(false)
    await waitFor(() =>
      expect(screen.getByRole('img', { name: /alternatives are currently hidden/ })).toBeDefined(),
    )

    fireEvent.click(toggle)
    expect(toggle.checked).toBe(true)
    await waitFor(() =>
      expect(screen.getByRole('img', { name: /drawn as ghosted alternatives/ })).toBeDefined(),
    )
  })

  it('states the true total when more minimal paths exist than the cap draws', async () => {
    render(<GraphView locale="en" dict={dict} />)
    await runToEnd()

    fireEvent.change(screen.getByLabelText(dict.input.presets, { exact: false }), {
      target: { value: 'patience-wins' },
    })
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())

    // patience-wins has 13 equally minimal scripts (tests/render/overlay.test.ts
    // establishes the ambiguity DP is exact here) — above GHOST_PATH_CAP.
    const capped = format(dict.graph.ambiguityCapped, { count: 13, cap: GHOST_PATH_CAP })
    await waitFor(() => expect(screen.getByText(capped)).toBeDefined())

    fireEvent.click(screen.getByTitle(dict.stepper.end))
    await waitFor(() => {
      const canvas = screen.getByRole('img', { name: /paths exist/ })
      expect(canvas.getAttribute('aria-label')).toContain('13')
    })
  })
})
