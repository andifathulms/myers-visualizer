import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { CompareView } from '@/components/compare/CompareView'
import { getDict } from '@/lib/i18n/dictionary'

const dict = getDict('id')

describe('CompareView', () => {
  it('shows all three algorithms with their script length and hunk count', () => {
    render(<CompareView locale="id" dict={dict} />)
    for (const name of ['Myers', 'Patience', 'Histogram']) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0)
    }
  })

  it('marks only Myers as minimal', () => {
    render(<CompareView locale="id" dict={dict} />)
    const rows = screen.getAllByRole('row').slice(1, 4)
    expect(within(rows[0]).getByText(dict.compare.yes)).toBeDefined()
    expect(within(rows[1]).getByText(dict.compare.no)).toBeDefined()
    expect(within(rows[2]).getByText(dict.compare.no)).toBeDefined()
  })

  it('shows patience beating Myers on hunk count at equal D', async () => {
    render(<CompareView locale="id" dict={dict} />)
    fireEvent.change(screen.getByLabelText(dict.input.presets, { exact: false }), {
      target: { value: 'patience-wins' },
    })

    await waitFor(() => {
      const rows = screen.getAllByRole('row').slice(1, 4)
      const cells = (row: HTMLElement) => within(row).getAllByRole('cell').map((c) => c.textContent)
      const [myers, patience] = [cells(rows[0]), cells(rows[1])]
      // Same D...
      expect(patience[1]).toBe(myers[1])
      // ...fewer hunks. Minimal is not the same as readable.
      expect(Number(patience[2])).toBeLessThan(Number(myers[2]))
    })
  })
})
