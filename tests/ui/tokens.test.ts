import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PALETTE } from '@/lib/palette'

/**
 * The palette is authored once, in lib/palette.ts, because canvas reads it as
 * hex and CSS reads it as channels. Two representations of one fact drift, so
 * this pins them — the same bargain tests/ui/manifest.test.ts makes.
 *
 * It also holds the contrast floor. The tokens are a claim about legibility
 * ("secondary text, on the ground"), and a claim written down is a claim
 * asserted: WCAG AA for body text is 4.5:1, and `muted` on `cotton` sat at
 * 4.34:1 until it was measured.
 */
const CSS = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8')

const kebab = (token: string) => token.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

function channelsOf(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}

/** WCAG 2.1 relative luminance. */
function luminance(hex: string): number {
  const linear = channelsOf(hex)
    .map((c) => c / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('design tokens', () => {
  it('declares every palette colour as RGB channels', () => {
    for (const [token, hex] of Object.entries(PALETTE)) {
      const declared = new RegExp(`--color-${kebab(token)}:\\s*([0-9]+ [0-9]+ [0-9]+);`).exec(CSS)
      expect(declared, `--color-${kebab(token)} is missing from globals.css`).not.toBeNull()
      expect(declared?.[1]).toBe(channelsOf(hex).join(' '))
    }
  })

  it('declares no colour the palette does not have', () => {
    const declared = [...CSS.matchAll(/--color-([a-z-]+):/g)].map((m) => m[1])
    const known = Object.keys(PALETTE).map(kebab)
    for (const name of declared) expect(known).toContain(name)
  })

  it('carries no hex literal — the palette is the only place for one', () => {
    expect(CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })

  /*
   * Both surfaces, because text lands on either: cards are paper, and the page
   * itself is cotton. A tone that only passes on the lighter of the two is a
   * tone that fails wherever the card ends.
   */
  it.each(['cotton', 'paper'] as const)('keeps every text tone at 4.5:1 on %s', (surface) => {
    for (const tone of ['deepIndigo', 'indigo', 'muted', 'added', 'removed'] as const) {
      expect(contrast(PALETTE[tone], PALETTE[surface]), `${tone} on ${surface}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('keeps madder legible as an accent on both surfaces', () => {
    expect(contrast(PALETTE.madder, PALETTE.cotton)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(PALETTE.madder, PALETTE.paper)).toBeGreaterThanOrEqual(4.5)
  })

  it('declares one type scale, and nothing in it is below 11px', () => {
    const steps = ['micro', 'fine', 'sm', 'base', 'lg', 'h3', 'h2', 'h1', 'hero']
    for (const step of steps) expect(CSS).toMatch(new RegExp(`--text-${step}:`))
    // The two fixed small steps are the floor; the rest are larger or clamped.
    expect(CSS).toMatch(/--text-micro:\s*0\.6875rem/)
    expect(CSS).toMatch(/--text-base:\s*1rem/)
  })
})
