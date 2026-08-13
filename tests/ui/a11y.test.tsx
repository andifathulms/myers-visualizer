import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { GraphView } from '@/components/graf/GraphView'
import { ShareLink } from '@/components/chrome/ShareLink'
import { LocaleLang } from '@/components/chrome/LocaleLang'
import { getDict } from '@/lib/i18n/dictionary'

const dict = getDict('id')

afterEach(() => {
  window.location.hash = ''
})

/**
 * The lattice is a canvas, which is opaque to a screen reader. That is
 * acceptable only because the same information is available as text — so
 * these tests check that it actually is, rather than that an aria attribute
 * exists somewhere.
 */
describe('accessibility', () => {
  it('describes the canvas and keeps the numbers available as text', async () => {
    render(<GraphView locale="id" dict={dict} />)
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())

    const graph = screen.getByRole('img', { name: dict.a11y.graphLabel })
    expect(graph.tagName).toBe('CANVAS')

    // The same state, readable: stats and the V array.
    expect(screen.getByText(dict.graph.d)).toBeDefined()
    // Named by their headings, not by a duplicate region label on the section.
    expect(screen.getByRole('heading', { name: dict.graph.stats })).toBeDefined()
    expect(screen.getByRole('heading', { name: dict.graph.vstrip })).toBeDefined()
  })

  it('announces the current step politely as the user steps', async () => {
    const { container } = render(<GraphView locale="id" dict={dict} />)
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())

    const live = container.querySelector('[aria-live="polite"]')
    expect(live).not.toBeNull()

    act(() => {
      fireEvent.click(screen.getByTitle(dict.stepper.step))
    })
    await waitFor(() => {
      // d, k and the point reached — the numbers the picture is showing.
      expect(live?.textContent).toMatch(/d = \d+ dari \d+, diagonal k = -?\d+, titik \(\d+, \d+\)/)
    })
  })

  it('gives every stepper control an accessible name', async () => {
    render(<GraphView locale="id" dict={dict} />)
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())
    for (const label of [
      dict.stepper.reset,
      dict.stepper.stepBack,
      dict.stepper.play,
      dict.stepper.step,
      dict.stepper.end,
      dict.stepper.nextD,
      dict.stepper.nextSnake,
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeDefined()
    }
  })

  it('names every V cell with its diagonal and coordinates', async () => {
    render(<GraphView locale="id" dict={dict} />)
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())
    fireEvent.click(screen.getByTitle(dict.stepper.end))
    await waitFor(() => {
      const cells = screen.getAllByRole('button', { name: /^k = -?\d+, x = \d+, y = \d+$/ })
      expect(cells.length).toBeGreaterThan(0)
    })
  })

  it('steps with the keyboard, not only the mouse', async () => {
    render(<GraphView locale="id" dict={dict} />)
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())
    const readFrame = () => screen.getByText(/^\d+\/\d+$/).textContent

    const start = readFrame()
    act(() => {
      fireEvent.keyDown(window, { key: 'ArrowRight' })
    })
    expect(readFrame()).not.toBe(start)
    act(() => {
      fireEvent.keyDown(window, { key: 'ArrowLeft' })
    })
    expect(readFrame()).toBe(start)
  })

  it('does not autoplay when the user asks for reduced motion', async () => {
    // prefers-reduced-motion disables autoplay and keeps stepping
    // instantaneous — the controls stay usable, the animation stops. PRD §9.
    const matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })
    Object.defineProperty(window, 'matchMedia', { value: matchMedia, configurable: true })

    render(<GraphView locale="id" dict={dict} />)
    await waitFor(() => expect(screen.getByText(/^@@ /)).toBeDefined())

    const play = screen.getByTitle(dict.stepper.play)
    act(() => {
      fireEvent.click(play)
    })
    // Still showing "play", because playback never started.
    expect(screen.getByTitle(dict.stepper.play)).toBeDefined()
    expect(screen.queryByTitle(dict.stepper.pause)).toBeNull()

    Reflect.deleteProperty(window, 'matchMedia')
  })

  it('sets the document language from the locale', () => {
    render(<LocaleLang locale="en" />)
    expect(document.documentElement.lang).toBe('en')
    render(<LocaleLang locale="id" />)
    expect(document.documentElement.lang).toBe('id')
  })
})

describe('sharing', () => {
  it('puts the preset id in the hash rather than the whole input', async () => {
    render(<GraphView locale="id" dict={dict} />)
    await waitFor(() => expect(window.location.hash).toContain('p=minimal-edit'))
    expect(window.location.hash).not.toContain('a=')
  })

  it('falls back to the full text once the input is edited', async () => {
    render(<GraphView locale="id" dict={dict} />)
    await waitFor(() => expect(window.location.hash).toContain('p='))

    fireEvent.change(screen.getByLabelText(dict.input.sideA), { target: { value: 'halo' } })
    await waitFor(() => {
      expect(window.location.hash).toContain('a=halo')
      expect(window.location.hash).not.toContain('p=')
    })
  })

  it('records a non-default algorithm in the hash, and omits the default', async () => {
    render(<GraphView locale="id" dict={dict} />)
    await waitFor(() => expect(window.location.hash).toContain('g=line'))
    expect(window.location.hash).not.toContain('alg=')

    fireEvent.change(screen.getByLabelText(dict.input.algorithm, { exact: false }), {
      target: { value: 'patience' },
    })
    await waitFor(() => expect(window.location.hash).toContain('alg=patience'))
  })

  it('copies the link and says so', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    render(<ShareLink url="https://example.test/#p=minimal-edit" dict={dict} />)
    fireEvent.click(screen.getByRole('button', { name: dict.a11y.copyLink }))

    await waitFor(() => expect(screen.getByText(dict.a11y.copied)).toBeDefined())
    expect(writeText).toHaveBeenCalledWith('https://example.test/#p=minimal-edit')
  })

  it('stays quiet when the clipboard is refused', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    render(<ShareLink url="https://example.test/" dict={dict} />)
    fireEvent.click(screen.getByRole('button', { name: dict.a11y.copyLink }))

    // The URL is in the address bar regardless; nothing worth interrupting for.
    await waitFor(() => expect(writeText).toHaveBeenCalled())
    expect(screen.queryByText(dict.a11y.copied)).toBeNull()
  })
})
