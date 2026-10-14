import { describe, expect, it } from 'vitest'
import { PRESETS, findPreset } from '@/data/presets'
import { summarise } from '@/lib/presets/summary'

/**
 * The gallery prints these figures on every card, so they are claims, and the
 * presets' own phenomena state several of them in prose. Hold the two together.
 */
describe('preset card summaries', () => {
  it.each(PRESETS.map((p) => [p.id, p] as const))('%s: the route runs corner to corner', (_, preset) => {
    const s = summarise(preset)
    expect(s.route[0]).toEqual({ x: 0, y: 0 })
    expect(s.route[s.route.length - 1]).toEqual({ x: s.n, y: s.m })
    // Every paid step is a right or a down; the count of them is D.
    let paid = 0
    for (let i = 1; i < s.route.length; i++) {
      const dx = s.route[i].x - s.route[i - 1].x
      const dy = s.route[i].y - s.route[i - 1].y
      if (dx + dy === 1) paid++
    }
    expect(paid).toBe(s.d)
  })

  it('counts three minimal scripts for the misattributed brace, as its card says', () => {
    const preset = findPreset('brace-misattribution')
    expect(preset).toBeDefined()
    if (preset !== undefined) expect(summarise(preset).minimal).toBe(3)
  })

  it('gives the worst case D = N + M and a saturated count', () => {
    const preset = findPreset('worst-case')
    expect(preset).toBeDefined()
    if (preset === undefined) return
    const s = summarise(preset)
    expect(s.d).toBe(s.n + s.m)
    expect(s.truncated).toBe(true)
  })
})
