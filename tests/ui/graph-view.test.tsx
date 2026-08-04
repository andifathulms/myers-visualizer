import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { GraphView } from '@/components/graf/GraphView'
import { getDict } from '@/lib/i18n/dictionary'

/**
 * Smoke tests for the wiring. The engine's correctness is proven elsewhere;
 * what this checks is that the views actually render a real trace, that
 * stepping moves, and that the cap message replaces the lattice instead of
 * drawing something illegible.
 *
 * There is no Worker in jsdom, so this also exercises the synchronous
 * fallback path in useDiff.
 */
const dict = getDict('id')

function renderGraph() {
  return render(<GraphView locale="id" dict={dict} />)
}

describe('GraphView', () => {
  it('runs a search and renders the diff output', async () => {
    renderGraph()
    // The default preset changes one line, so a hunk header must appear.
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())
    expect(screen.getByText('TIGA')).toBeDefined()
  })

  it('shows the V array with a cell per diagonal, including negative k', async () => {
    renderGraph()
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())
    fireEvent.click(screen.getByTitle(dict.stepper.end))
    await waitFor(() => {
      const cells = screen.getAllByRole('button', { name: /^k = /i })
      expect(cells.length).toBeGreaterThan(1)
      expect(cells.some((cell) => /k = -\d/.test(cell.getAttribute('aria-label') ?? ''))).toBe(true)
    })
  })

  it('steps forward and back, and step-back returns the same state', async () => {
    renderGraph()
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())
    const step = screen.getByTitle(dict.stepper.step)
    const back = screen.getByTitle(dict.stepper.stepBack)

    const readFrame = () => screen.getByText(/^\d+\/\d+$/).textContent
    const start = readFrame()
    act(() => {
      fireEvent.click(step)
      fireEvent.click(step)
    })
    expect(readFrame()).not.toBe(start)
    act(() => {
      fireEvent.click(back)
      fireEvent.click(back)
    })
    expect(readFrame()).toBe(start)
  })

  it('reports D and the retained V cells', async () => {
    renderGraph()
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())
    expect(screen.getByText(dict.graph.d)).toBeDefined()
    expect(screen.getByText(dict.graph.memory)).toBeDefined()
  })

  it('replaces the lattice with an honest message above the cap', async () => {
    renderGraph()
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())

    const paneA = screen.getByLabelText(dict.input.sideA)
    const huge = Array.from({ length: 320 }, (_, i) => `baris ${i}`).join('\n')
    fireEvent.change(paneA, { target: { value: huge } })

    await waitFor(() => {
      expect(screen.getByText(/melampaui batas tampilan/)).toBeDefined()
    })
    // The result is still shown — capped means "no graph", not "no answer".
    expect(screen.getByText(/^@@ /)).toBeDefined()
  })

  it('reports the alternatives and switching one changes the diff output', async () => {
    renderGraph()
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())
    fireEvent.change(screen.getByLabelText(dict.input.presets, { exact: false }), {
      target: { value: 'brace-misattribution' },
    })

    // Three equally minimal scripts, so the alternative buttons appear.
    await waitFor(() => expect(screen.getByText(dict.graph.altScript)).toBeDefined())
    const before = screen.getByText(/^@@ /).textContent

    const alternative = screen.getByRole('button', { name: '3' })
    fireEvent.click(alternative)

    // A different, equally minimal attribution of the very same change.
    await waitFor(() => expect(screen.getByText(/^@@ /).textContent).not.toBe(before))
  })

  it('says plainly when the minimal script is unique', async () => {
    renderGraph()
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())
    fireEvent.change(screen.getByLabelText(dict.input.presets, { exact: false }), {
      target: { value: 'pure-insert' },
    })
    await waitFor(() => expect(screen.getByText(dict.graph.ambiguityUnique)).toBeDefined())
  })

  it('loads a preset and re-runs the search', async () => {
    renderGraph()
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())
    fireEvent.change(screen.getByLabelText(dict.input.presets, { exact: false }), {
      target: { value: 'pure-insert' },
    })
    await waitFor(() => expect(screen.getByText('baru A')).toBeDefined())
  })
})
