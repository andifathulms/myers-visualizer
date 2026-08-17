import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { VStrip } from '@/components/vstrip/VStrip'
import { CompareView } from '@/components/compare/CompareView'
import { getDict } from '@/lib/i18n/dictionary'

/**
 * DESIGN.md §7-§8: a bar is added beside the number it restates, never
 * instead of it, and its length has to actually track the value — a bar
 * that doesn't move with the number it sits beside is decoration, not data.
 */
function barWidth(container: HTMLElement, index: number): number {
  // The bar's fill is the inner span with the inline width style; the outer
  // span is just the track.
  const fills = container.querySelectorAll('span[style*="width"]')
  const style = (fills[index] as HTMLElement).style.width
  return Number(style.replace('%', ''))
}

describe('the V strip bar', () => {
  it('scales with x against the fixed reference, not the row', () => {
    const cells = [
      { k: -1, x: 1, y: 2 },
      { k: 0, x: 2, y: 2 },
      { k: 1, x: 4, y: 0 },
    ]
    const { container } = render(
      <VStrip
        cells={cells}
        currentD={2}
        highlightK={null}
        onHighlight={() => {}}
        label="The V array"
        hint="hint"
        idle="idle"
        groupLabel="V cells by diagonal"
        maxX={4}
      />,
    )
    // Against maxX = 4: x=1 -> 25%, x=2 -> 50%, x=4 -> 100%.
    expect(barWidth(container, 0)).toBe(25)
    expect(barWidth(container, 1)).toBe(50)
    expect(barWidth(container, 2)).toBe(100)
  })

  it('never divides by zero when the strip is empty', () => {
    const { container } = render(
      <VStrip
        cells={[]}
        currentD={0}
        highlightK={null}
        onHighlight={() => {}}
        label="The V array"
        hint="hint"
        idle="idle"
        groupLabel="V cells by diagonal"
        maxX={0}
      />,
    )
    expect(container.querySelectorAll('span[style*="width"]')).toHaveLength(0)
  })
})

describe('the CompareView bars', () => {
  const dict = getDict('en')

  it('gives patience a shorter hunks bar than Myers at equal D', async () => {
    render(<CompareView locale="en" dict={dict} />)
    fireEvent.change(screen.getByLabelText(dict.input.presets, { exact: false }), {
      target: { value: 'patience-wins' },
    })

    await waitFor(() => {
      const rows = screen.getAllByRole('row').slice(1, 5)
      const hunksBar = (row: HTMLElement) => {
        const cell = within(row).getAllByRole('cell')[1]
        const fill = cell.querySelector('span[style*="width"]') as HTMLElement
        return Number(fill.style.width.replace('%', ''))
      }
      // rows: myers, myers-linear, patience, histogram — same D, fewer hunks.
      expect(hunksBar(rows[2])).toBeLessThan(hunksBar(rows[0]))
    })
  })

  it('gives the two Myers variants the same D bar, since D agrees', () => {
    render(<CompareView locale="en" dict={dict} />)
    const rows = screen.getAllByRole('row').slice(1, 5)
    const dBar = (row: HTMLElement) => {
      const cell = within(row).getAllByRole('cell')[0]
      const fill = cell.querySelector('span[style*="width"]') as HTMLElement
      return Number(fill.style.width.replace('%', ''))
    }
    expect(dBar(rows[0])).toBe(dBar(rows[1]))
  })
})
