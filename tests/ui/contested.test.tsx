import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { GraphView } from '@/components/graf/GraphView'
import { getDict } from '@/lib/i18n/dictionary'
import { analyseAmbiguity, sharesOfScript } from '@/lib/diff/ambiguity'
import { diff } from '@/lib/diff'
import { tokenizePair } from '@/lib/tokenize'
import { findPreset } from '@/data/presets'

/**
 * Two claims the interface now makes, and neither is decorative: that the
 * contested lines of a diff are marked and the forced ones are not, and that
 * the step readout says when a tie-break decided the step.
 *
 * Both branches are exercised through the interface, because a component that
 * rendered nothing at all would pass either one alone. The default preset is
 * a substitution — which has two minimal scripts, the smallest instance of
 * the whole subject — and the pure insertion has exactly one.
 */
const dict = getDict('en')

describe('per-line contestedness in the diff output', () => {
  it('marks the contested lines of a substitution — the default input', async () => {
    render(<GraphView locale="en" dict={dict} />)
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())
    expect(screen.getByText(dict.graph.contested)).toBeDefined()

    // Two minimal scripts: the delete and the insert each appear in one.
    const badges = screen.getAllByText(/^\d+ of \d+$/)
    expect(badges).toHaveLength(2)
    for (const badge of badges) expect(badge.textContent).toBe('1 of 2')
  })

  it('says nothing is contested when the shortest script is unique', async () => {
    render(<GraphView locale="en" dict={dict} />)
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())

    fireEvent.change(screen.getByLabelText(dict.input.presets), {
      target: { value: 'pure-insert' },
    })

    await waitFor(() => expect(screen.getByText(dict.graph.contestedNone)).toBeDefined())
    expect(screen.queryByText(/^\d+ of \d+$/)).toBeNull()
  })

  it('marks exactly the contested lines on a preset that has them', () => {
    // Asserted against the engine rather than a hand-copied number: the
    // preset's phenomenon is that several minimal scripts disagree about
    // which closing brace belongs to which function.
    const preset = findPreset('brace-misattribution')
    expect(preset).toBeDefined()
    if (preset === undefined) return

    const { a, b } = tokenizePair(preset.a, preset.b, {
      granularity: 'line',
      ignoreWhitespace: false,
      ignoreCase: false,
    })
    const { count } = analyseAmbiguity(a.tokens, b.tokens)
    expect(count).toBeGreaterThan(1)

    const { script } = diff(a.tokens, b.tokens, 'myers')
    const shares = sharesOfScript(a.tokens, b.tokens, script)
    expect(shares).not.toBeNull()

    const contested = (shares ?? []).filter((share) => !share.forced)
    expect(contested.length).toBeGreaterThan(0)
    expect(contested.length).toBeLessThan(script.length)
    for (const share of contested) expect(share.scripts).toBeLessThan(count)
  })
})

describe('the step readout', () => {
  it('names the current step and whether a tie decided it', async () => {
    render(<GraphView locale="en" dict={dict} />)
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())

    // d = 0 is the starting point and has no predecessor to tie with.
    expect(screen.getByText(dict.graph.stepStart)).toBeDefined()

    fireEvent.click(screen.getByTitle(dict.stepper.step))
    await waitFor(() => {
      const readout = screen.getByText(/d = \d+ · k = -?\d+/)
      expect(readout).toBeDefined()
    })
    // Past the start, the readout always says one or the other.
    const tie = screen.queryByText(dict.graph.stepTied)
    const noTie = screen.queryByText(dict.graph.stepNoTie)
    expect(tie === null ? noTie : tie).not.toBeNull()
  })
})
