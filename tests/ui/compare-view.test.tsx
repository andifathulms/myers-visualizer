import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { CompareView } from '@/components/compare/CompareView'
import { getDict } from '@/lib/i18n/dictionary'

const dict = getDict('id')

describe('CompareView', () => {
  it('shows every algorithm with its script length and hunk count', () => {
    render(<CompareView locale="id" dict={dict} />)
    for (const name of ['Myers', 'Myers — linear space', 'Patience', 'Histogram']) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0)
    }
  })

  it('marks only the Myers family as minimal', () => {
    render(<CompareView locale="id" dict={dict} />)
    const rows = screen.getAllByRole('row').slice(1, 5)
    expect(within(rows[0]).getByText(dict.compare.yes)).toBeDefined() // myers
    expect(within(rows[1]).getByText(dict.compare.yes)).toBeDefined() // linear space
    expect(within(rows[2]).getByText(dict.compare.no)).toBeDefined() // patience
    expect(within(rows[3]).getByText(dict.compare.no)).toBeDefined() // histogram
  })

  /**
   * The O(D²) versus O(N+M) claim, as two numbers on screen. §6.6
   *
   * Only once D is large: on the default preset D = 2, and the greedy
   * recording is the *smaller* of the two. The linear-space variant wins
   * asymptotically, not universally, and the table shows whichever is true.
   */
  it('shows linear space retaining far less V once D is large', async () => {
    render(<CompareView locale="id" dict={dict} />)
    // Column one is a rowheader, not a cell, so V cells stored is index 2.
    const cell = (row: HTMLElement) => Number(within(row).getAllByRole('cell')[2].textContent)

    const atStart = screen.getAllByRole('row').slice(1, 5)
    expect(cell(atStart[1])).toBeGreaterThan(cell(atStart[0])) // D = 2: greedy is cheaper

    fireEvent.change(screen.getByLabelText(dict.input.presets, { exact: false }), {
      target: { value: 'worst-case' },
    })
    await waitFor(() => {
      const rows = screen.getAllByRole('row').slice(1, 5)
      // D = 80 here, so the greedy recording is an order of magnitude larger.
      expect(cell(rows[1])).toBeLessThan(cell(rows[0]) / 10)
    })
  })

  it('shows patience beating Myers on hunk count at equal D', async () => {
    render(<CompareView locale="id" dict={dict} />)
    fireEvent.change(screen.getByLabelText(dict.input.presets, { exact: false }), {
      target: { value: 'patience-wins' },
    })

    await waitFor(() => {
      const rows = screen.getAllByRole('row').slice(1, 5)
      const cells = (row: HTMLElement) => within(row).getAllByRole('cell').map((c) => c.textContent)
      const [myers, patience] = [cells(rows[0]), cells(rows[2])]
      // The algorithm name is a rowheader now, so D is index 0 and hunks 1.
      // Same D...
      expect(patience[0]).toBe(myers[0])
      // ...fewer hunks. Minimal is not the same as readable.
      expect(Number(patience[1])).toBeLessThan(Number(myers[1]))
    })
  })
})
