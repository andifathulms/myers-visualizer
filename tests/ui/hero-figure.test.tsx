import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HeroFigure, FIGURE } from '@/components/home/HeroFigure'
import { getDict } from '@/lib/i18n/dictionary'
import { EXAMPLE } from '@/data/example'
import { tokenizePair } from '@/lib/tokenize'
import { diff } from '@/lib/diff'
import { pathOf } from '@/lib/diff/backtrack'

/**
 * The hero draws a route by hand, because it must be in the first paint and
 * cannot wait for a worker. Hand-drawn is a claim, and two preset claims on
 * this site were already written before they were checked and turned out
 * false. So the claim is asserted: the route, the free diagonals and the
 * settled endpoints are what this implementation actually produces for the
 * worked example the page shows three inches below it.
 */
describe('the hero figure', () => {
  const example = EXAMPLE.en
  const { a, b } = tokenizePair(example.a.join('\n'), example.b.join('\n'), {
    granularity: 'line',
    ignoreWhitespace: false,
    ignoreCase: false,
  })

  it('draws the route this implementation actually finds', () => {
    const result = diff(a.tokens, b.tokens, 'myers')
    expect(result.stats.d).toBe(2)

    // The drawn polyline is the corners; the real path is every node. Walking
    // the corners has to reproduce it exactly.
    const corners = FIGURE.path
    const walked: (readonly [number, number])[] = []
    for (let i = 0; i < corners.length - 1; i++) {
      const [x0, y0] = corners[i]
      const [x1, y1] = corners[i + 1]
      const steps = Math.max(x1 - x0, y1 - y0)
      const dx = Math.sign(x1 - x0)
      const dy = Math.sign(y1 - y0)
      for (let s = 0; s < steps; s++) walked.push([x0 + dx * s, y0 + dy * s])
    }
    walked.push(corners[corners.length - 1])

    expect(walked).toEqual(pathOf(result.script).map((p) => [p.x, p.y]))
  })

  it('shows endpoints the search really settled on, and none it did not', () => {
    const { trace } = diff(a.tokens, b.tokens, 'myers')
    const settled = new Set(
      trace.events
        .filter((event): event is Extract<typeof event, { type: 'step' }> => event.type === 'step')
        .map((event) => `${event.to.x},${event.to.y}`),
    )
    // (0,0) is the d = 0 endpoint, reached before any step is recorded.
    settled.add('2,2')
    for (const [x, y] of FIGURE.explored) expect(settled).toContain(`${x},${y}`)
  })

  it('marks a free diagonal exactly where the two lists agree', () => {
    const expected: [number, number][] = []
    for (let y = 0; y < b.tokens.length; y++) {
      for (let x = 0; x < a.tokens.length; x++) {
        if (a.tokens[x] === b.tokens[y]) expected.push([x, y])
      }
    }
    expect([...FIGURE.matches].sort()).toEqual(expected.sort())
  })

  it('describes itself to a screen reader', () => {
    const dict = getDict('en')
    render(<HeroFigure dict={dict} />)
    expect(screen.getByRole('img', { name: dict.home.figure.alt })).toBeTruthy()
  })
})
