import { describe, expect, it } from 'vitest'
import { computeGeometry } from '@/layout/lattice'
import { LatticeRenderer, type Layer } from '@/components/lattice/render'
import { buildMatchGrid, EMPTY_FRAME } from '@/components/lattice/frame'
import { NIGHT, PALETTE, paletteFor, type Palette } from '@/lib/palette'

/**
 * Canvas does not read CSS, so a theme only reaches the lattice if the
 * renderer is handed it. Record every colour it sets and check they come from
 * the palette it was given — and from nowhere else.
 */
function recordingCtx(colours: Set<string>): CanvasRenderingContext2D {
  return new Proxy({} as Record<string, unknown>, {
    get(_target, prop) {
      if (prop === 'canvas') return {}
      return () => undefined
    },
    set(_target, prop, value) {
      if ((prop === 'strokeStyle' || prop === 'fillStyle') && typeof value === 'string') colours.add(value)
      return true
    },
  }) as unknown as CanvasRenderingContext2D
}

function coloursDrawn(palette?: Palette): Set<string> {
  const colours = new Set<string>()
  const canvas = { getContext: () => recordingCtx(colours), style: {} } as unknown as HTMLCanvasElement
  const createLayer = (): Layer => ({ canvas: { style: {} } as HTMLCanvasElement, ctx: recordingCtx(colours) })
  const a = [1, 2, 3, 4]
  const b = [1, 3, 2, 4]
  const geometry = computeGeometry(a.length, b.length, 400, 400, 20)
  const renderer = new LatticeRenderer(canvas, geometry, 400, 400, { createLayer, dpr: 1, palette })
  renderer.setScene(geometry, buildMatchGrid(a, b))
  renderer.stampExplored([{ x0: 0, y0: 0, x1: 1, y1: 1 }], [{ k: 0, x: 1, y: 1 }])
  renderer.draw({
    ...EMPTY_FRAME,
    frontier: [{ k: 0, x: 1, y: 1 }],
    path: [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ],
    contestedEdges: [{ x0: 1, y0: 1, x1: 2, y1: 1 }],
    ghostPaths: [
      [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
      ],
    ],
  })
  return colours
}

describe('the renderer and the theme', () => {
  it('draws with the day palette by default', () => {
    const drawn = coloursDrawn()
    expect(drawn.size).toBeGreaterThan(0)
    for (const colour of drawn) expect(Object.values(PALETTE)).toContain(colour)
  })

  it('draws only night colours when handed the night palette', () => {
    const drawn = coloursDrawn(NIGHT)
    expect(drawn.size).toBeGreaterThan(0)
    for (const colour of drawn) expect(Object.values(NIGHT)).toContain(colour)
    // The answer is still the answer: madder, in its night value.
    expect(drawn).toContain(NIGHT.madder)
    expect(drawn).toContain(NIGHT.turmeric)
  })

  it('resolves a theme to its palette', () => {
    expect(paletteFor('light')).toBe(PALETTE)
    expect(paletteFor('dark')).toBe(NIGHT)
  })
})
