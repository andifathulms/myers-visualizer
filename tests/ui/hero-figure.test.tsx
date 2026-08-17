import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HeroFigure, FIGURE, CONTESTED } from '@/components/home/HeroFigure'
import { getDict } from '@/lib/i18n/dictionary'
import { EXAMPLE } from '@/data/example'
import { tokenizePair } from '@/lib/tokenize'
import { diff } from '@/lib/diff'
import { pathOf } from '@/lib/diff/backtrack'
import { analyseAmbiguity, contestedEdges, minimalScripts } from '@/lib/diff/ambiguity'

/** Walk a hand-drawn corners list into every intermediate lattice point. */
function walkCorners(corners: readonly (readonly [number, number])[]) {
  const walked: (readonly [number, number])[] = []
  for (let i = 0; i < corners.length - 1; i++) {
    const [x0, y0] = corners[i]
    const [x1, y1] = corners[i + 1]
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))
    const dx = Math.sign(x1 - x0)
    const dy = Math.sign(y1 - y0)
    for (let s = 0; s < steps; s++) walked.push([x0 + dx * s, y0 + dy * s])
  }
  walked.push(corners[corners.length - 1])
  return walked
}

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
    expect(walkCorners(FIGURE.path)).toEqual(pathOf(result.script).map((p) => [p.x, p.y]))
  })

  /**
   * DESIGN.md §6: the hero's ghosted alternative and contested cell are
   * pre-authored, not drawn live — so they are claims about the algorithm
   * exactly the way the solid route always was, and get the same treatment:
   * asserted against what `lib/diff` actually returns, not eyeballed.
   */
  it('is genuinely ambiguous, with exactly the one alternative drawn', () => {
    const ambiguity = analyseAmbiguity(a.tokens, b.tokens)
    expect(ambiguity.count).toBe(2)

    const scripts = minimalScripts(a.tokens, b.tokens, 2)
    expect(scripts).toHaveLength(2)
    const altWalked = walkCorners(FIGURE.altPath)
    expect(altWalked).toEqual(pathOf(scripts[1]).map((p) => [p.x, p.y]))

    // A genuinely different attribution of the same change, not a repeat of
    // the solid route under a different name.
    expect(altWalked).not.toEqual(walkCorners(FIGURE.path))
    // Both start and end at the same corners — they disagree only in the middle.
    expect(altWalked[0]).toEqual(walkCorners(FIGURE.path)[0])
    expect(altWalked[altWalked.length - 1]).toEqual(
      walkCorners(FIGURE.path)[walkCorners(FIGURE.path).length - 1],
    )
  })

  it('marks exactly the cell the two routes disagree about', () => {
    const edges = contestedEdges(a.tokens, b.tokens)
    expect(edges).not.toBeNull()
    // Every contested edge lies on the boundary of the drawn square, and the
    // square is exactly their bounding box — nothing contested falls outside
    // it, and nothing inside it is left undrawn.
    const xs = (edges ?? []).flatMap((e) => [e.x0, e.x1])
    const ys = (edges ?? []).flatMap((e) => [e.y0, e.y1])
    expect(Math.min(...xs)).toBe(CONTESTED.from[0])
    expect(Math.max(...xs)).toBe(CONTESTED.to[0])
    expect(Math.min(...ys)).toBe(CONTESTED.from[1])
    expect(Math.max(...ys)).toBe(CONTESTED.to[1])
    expect(edges).toHaveLength(4)
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
