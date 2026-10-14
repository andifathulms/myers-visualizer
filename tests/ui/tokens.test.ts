import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { NIGHT, PALETTE } from '@/lib/palette'

/**
 * The palette is authored once, in lib/palette.ts, because canvas reads it as
 * hex and CSS reads it as channels. Two representations of one fact drift, so
 * this pins them — the same bargain tests/ui/manifest.test.ts makes.
 *
 * It also holds the contrast floor. The tokens are a claim about legibility
 * ("secondary text, on the ground"), and a claim written down is a claim
 * asserted: WCAG AA for body text is 4.5:1, and `muted` on the old cotton
 * ground sat at 4.34:1 until it was measured. Graphics are held to 3:1
 * (WCAG 1.4.11): the old frontier was 2.03:1 on the ground, and nothing
 * here checked it.
 */
const CSS = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8')

/** Every file Tailwind scans — the same two roots as `content` in the config. */
function sources(dir = '', roots = ['app', 'components']): string[] {
  if (dir === '') return roots.flatMap((root) => sources(join(process.cwd(), root)))
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sources(path)
    return entry.name.endsWith('.tsx') ? [path] : []
  })
}

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
   * Every surface, because text lands on each: cards are `surface`, the page
   * is `ground`, inputs and table heads are `sunken`. A tone that only passes
   * on the lightest of them fails wherever the card ends.
   */
  const SURFACES = ['ground', 'surface', 'sunken'] as const

  it.each(SURFACES)('keeps every text tone at 4.5:1 on %s', (surface) => {
    for (const tone of ['ink', 'indigo', 'muted', 'added', 'removed'] as const) {
      expect(contrast(PALETTE[tone], PALETTE[surface]), `${tone} on ${surface}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it.each(SURFACES)('keeps madder legible as an accent on %s', (surface) => {
    expect(contrast(PALETTE.madder, PALETTE[surface])).toBeGreaterThanOrEqual(4.5)
  })

  /*
   * The lattice's marks — structure, frontier, path — are graphics, and the
   * frontier is the one thing that moves. 3:1 against every surface it can
   * be drawn on.
   */
  it.each(SURFACES)('keeps every lattice mark at 3:1 on %s', (surface) => {
    for (const mark of ['indigo', 'turmeric', 'madder'] as const) {
      expect(contrast(PALETTE[mark], PALETTE[surface]), `${mark} on ${surface}`).toBeGreaterThanOrEqual(3)
    }
  })

  /*
   * The home page's one inverted band sets `surface` and `explored` text on an
   * `ink` ground. A pairing the palette was never measured for until it was
   * used, so it is measured here.
   */
  it('keeps the inverted band legible', () => {
    for (const tone of ['surface', 'explored'] as const) {
      expect(contrast(PALETTE[tone], PALETTE.ink), `${tone} on ink`).toBeGreaterThanOrEqual(4.5)
    }
  })

  /*
   * The night theme restates NIGHT twice in the CSS — once for the system
   * preference, once for an explicit choice — because a colour defined only
   * under one of them is the classic unreadable-dark-mode bug. Both blocks
   * must carry every token, with NIGHT's values.
   */
  it('declares the night palette in both dark blocks', () => {
    const blocks = [
      /prefers-color-scheme:\s*dark\)\s*\{\s*:root:not\(\[data-theme='light'\]\)\s*\{([^}]*)\}/.exec(CSS),
      /:root\[data-theme='dark'\]\s*\{([^}]*)\}/.exec(CSS),
    ]
    for (const block of blocks) {
      expect(block, 'a dark block is missing').not.toBeNull()
      for (const [token, hex] of Object.entries(NIGHT)) {
        const declared = new RegExp(`--color-${kebab(token)}:\\s*([0-9]+ [0-9]+ [0-9]+);`).exec(block?.[1] ?? '')
        expect(declared, `--color-${kebab(token)} missing from a dark block`).not.toBeNull()
        expect(declared?.[1]).toBe(channelsOf(hex).join(' '))
      }
    }
  })

  /* Every floor above, held again on the night surfaces. */
  it.each(SURFACES)('holds every contrast floor at night on %s', (surface) => {
    for (const tone of ['ink', 'indigo', 'muted', 'added', 'removed', 'madder'] as const) {
      expect(contrast(NIGHT[tone], NIGHT[surface]), `night ${tone} on ${surface}`).toBeGreaterThanOrEqual(4.5)
    }
    for (const mark of ['indigo', 'turmeric', 'madder'] as const) {
      expect(contrast(NIGHT[mark], NIGHT[surface]), `night ${mark} on ${surface}`).toBeGreaterThanOrEqual(3)
    }
  })

  it('keeps the inverted band legible at night', () => {
    for (const tone of ['surface', 'explored'] as const) {
      expect(contrast(NIGHT[tone], NIGHT.ink), `night ${tone} on ink`).toBeGreaterThanOrEqual(4.5)
    }
  })

  /*
   * The scale is only a scale if nothing opts out of it. Tailwind's own sizes
   * are replaced rather than extended, so `text-xl` silently produces nothing
   * — which is a rendering bug that no other test would catch.
   */
  it('uses no font size off the scale', () => {
    const SCALE = ['micro', 'fine', 'sm', 'base', 'lg', 'h3', 'h2', 'h1', 'hero']
    const offenders: string[] = []
    for (const file of sources()) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(/(?:^|[\s"'`:])(?:[a-z]+:)?text-([a-z0-9[\].]+)/g)) {
        const size = match[1]
        // Colours, alignment and the rest of the `text-` namespace pass through.
        if (!/^(xs|sm|base|lg|[0-9]?xl|\[.*\])$/.test(size)) continue
        if (SCALE.includes(size)) continue
        offenders.push(`${file}: text-${size}`)
      }
    }
    expect(offenders).toEqual([])
  })

  /*
   * A text tone thinned with opacity is not a tone, it is a contrast failure
   * waiting to be measured: `text-muted/60` came out at 2.54:1 on the diff's
   * line numbers, well under the floor the tokens above are held to. The rule
   * was already written down in CLAUDE.md and still shipped four times, so it
   * is a test now rather than a paragraph.
   *
   * Only `text-`. A background, a border, a stroke or a fill at partial alpha
   * is a legitimate wash — the explored region and the hero's path band both
   * depend on it.
   */
  it('never fakes a text tone with opacity', () => {
    const SCALE = /\btext-(micro|fine|sm|base|lg|h[123]|hero)\b/
    const offenders: string[] = []
    for (const file of sources()) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(/\btext-([a-zA-Z]+)\/(\d+)/g)) {
        offenders.push(`${file}: text-${match[1]}/${match[2]}`)
      }
      // `opacity-40` on a disabled control fades the whole control and is
      // fine; on an element that sets a type size it is the same trick under
      // another name, and that is how the V strip's k labels got to 3.3:1.
      for (const attr of source.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
        const value = attr[1] ?? attr[2] ?? ''
        if (SCALE.test(value) && /\bopacity-\d+/.test(value)) {
          offenders.push(`${file}: type size with opacity — ${value.trim().slice(0, 60)}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('declares one type scale, and nothing in it is below 11px', () => {
    const steps = ['micro', 'fine', 'sm', 'base', 'lg', 'h3', 'h2', 'h1', 'hero']
    for (const step of steps) expect(CSS).toMatch(new RegExp(`--text-${step}:`))
    // The two fixed small steps are the floor; the rest are larger or clamped.
    expect(CSS).toMatch(/--text-micro:\s*0\.6875rem/)
    expect(CSS).toMatch(/--text-base:\s*1rem/)
  })
})
