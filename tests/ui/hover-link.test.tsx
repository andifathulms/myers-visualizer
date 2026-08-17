import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { GraphView } from '@/components/graf/GraphView'
import { getDict } from '@/lib/i18n/dictionary'

/**
 * DESIGN.md §4.2: a contested diff line and the lattice edge it corresponds
 * to are the same fact stated twice, so hovering or focusing either has to
 * highlight the other. The lattice side is drawn on canvas and unobservable
 * in jsdom (CLAUDE.md: `pnpm test:browser` is where painting is actually
 * verified) — the pure vertex-to-op mapping this depends on is unit tested
 * directly in tests/player/hoverLink.test.ts. What this checks is the half
 * that *is* observable here: hovering or focusing a contested line marks it,
 * and only a contested line — a forced one is not a choice, so there is
 * nothing to link.
 */
const dict = getDict('en')

function contestedLineButton(): HTMLElement {
  // The default preset is a one-line substitution: two minimal scripts, so
  // both changed lines carry a "1 of 2" badge (tests/ui/contested.test.tsx).
  const badge = screen.getAllByText(/^\d+ of \d+$/)[0]
  const button = badge.closest('button')
  if (button === null) throw new Error('badge is not inside a button')
  return button
}

function forcedLineButton(): HTMLElement {
  const kept = screen.getAllByRole('button', { name: /unchanged/ })[0]
  return kept
}

describe('hovering/focusing a contested diff line', () => {
  it('marks the line on hover and clears it on mouse leave', async () => {
    render(<GraphView locale="en" dict={dict} />)
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())

    const line = contestedLineButton()
    expect(line.className).not.toContain('ring-indigo/50')

    fireEvent.mouseEnter(line)
    expect(line.className).toContain('ring-indigo/50')

    fireEvent.mouseLeave(line)
    expect(line.className).not.toContain('ring-indigo/50')
  })

  it('marks the line on focus and clears it on blur', async () => {
    render(<GraphView locale="en" dict={dict} />)
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())

    const line = contestedLineButton()
    fireEvent.focus(line)
    expect(line.className).toContain('ring-indigo/50')

    fireEvent.blur(line)
    expect(line.className).not.toContain('ring-indigo/50')
  })

  it('does nothing for a forced line — it is not a choice, so there is nothing to link', async () => {
    render(<GraphView locale="en" dict={dict} />)
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())

    const line = forcedLineButton()
    fireEvent.mouseEnter(line)
    expect(line.className).not.toContain('ring-indigo/50')
  })

  it('selecting a line still wins over the hover ring', async () => {
    render(<GraphView locale="en" dict={dict} />)
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())

    const line = contestedLineButton()
    fireEvent.click(line)
    fireEvent.mouseEnter(line)
    expect(line.className).toContain('bg-turmeric/30')
    expect(line.className).not.toContain('ring-indigo/50')
  })
})
