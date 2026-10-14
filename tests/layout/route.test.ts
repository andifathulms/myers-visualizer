import { describe, expect, it } from 'vitest'
import { linesOfRoute, walk } from '@/layout/route'
import { FIGURE } from '@/components/home/HeroFigure'
import { EXAMPLE } from '@/data/example'
import { LOCALES } from '@/lib/i18n/locales'

/**
 * The home page's two-scripts band reads each hero route back as diff lines.
 * The routes themselves are pinned to lib/diff by hero-figure.test.tsx; this
 * pins the reading, so the band can never show a diff its picture does not
 * draw.
 */
describe('reading a route back as lines', () => {
  it('walks corners into every node, diagonals included', () => {
    expect(walk([[0, 0], [2, 2], [3, 2]])).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 2],
    ])
  })

  it.each(LOCALES)('turns the chosen hero route into the example diff (%s)', (locale) => {
    const { a, b, diff } = EXAMPLE[locale]
    expect(linesOfRoute(FIGURE.path, a, b)).toEqual(diff)
  })

  it.each(LOCALES)('reads the alternative as the same change in the other order (%s)', (locale) => {
    const { a, b, diff } = EXAMPLE[locale]
    const alt = linesOfRoute(FIGURE.altPath, a, b)
    expect(alt).not.toEqual(diff)
    // Same lines, same counts — only the order of the two paid steps moves.
    const key = (line: { type: string; text: string }) => `${line.type}:${line.text}`
    expect(alt.map(key).sort()).toEqual(diff.map(key).sort())
    expect(alt.findIndex((l) => l.type === 'insert')).toBeLessThan(alt.findIndex((l) => l.type === 'delete'))
  })
})
