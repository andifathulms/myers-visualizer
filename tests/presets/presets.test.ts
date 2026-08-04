import { describe, expect, it } from 'vitest'
import { PRESETS, findPreset } from '@/data/presets'
import { DEFAULT_TOKENIZE_OPTIONS, tokenizePair } from '@/lib/tokenize'
import { myersGreedy } from '@/lib/diff/myers'
import { diff } from '@/lib/diff'
import { analyseAmbiguity, minimalScripts } from '@/lib/diff/ambiguity'
import { checkApply } from '@/lib/diff/apply'
import { buildHunks } from '@/lib/hunks'
import { hunkCount } from '@/lib/diff/types'
import { LOCALES } from '@/lib/i18n/locales'

function run(preset: (typeof PRESETS)[number]) {
  const { a, b } = tokenizePair(preset.a, preset.b, {
    ...DEFAULT_TOKENIZE_OPTIONS,
    granularity: preset.granularity,
  })
  return { a, b, ...myersGreedy(a.tokens, b.tokens) }
}

/**
 * A preset carries the phenomenon it exists to show, so the claim is asserted
 * rather than merely written down. Copy that quietly stops being true is worse
 * than no copy.
 */
describe('presets', () => {
  it('all have stable ids, both locales, and a documented phenomenon', () => {
    const ids = new Set<string>()
    for (const preset of PRESETS) {
      expect(preset.id).toMatch(/^[a-z0-9-]+$/)
      expect(ids.has(preset.id)).toBe(false)
      ids.add(preset.id)
      for (const locale of LOCALES) {
        expect(preset.title[locale].length).toBeGreaterThan(0)
        expect(preset.phenomenon[locale].length).toBeGreaterThan(20)
      }
      expect(findPreset(preset.id)).toBe(preset)
    }
  })

  it.each(PRESETS.map((p) => [p.id, p] as const))('%s applies and stays viewable', (_id, preset) => {
    const { a, b, script } = run(preset)
    expect(checkApply(a.tokens, b.tokens, script).ok).toBe(true)
    expect(a.tokens.length).toBeLessThanOrEqual(300)
    expect(b.tokens.length).toBeLessThanOrEqual(300)
  })

  it('minimal-edit really is one changed line', () => {
    const preset = findPreset('minimal-edit')
    if (preset === undefined) throw new Error('missing preset')
    const { stats } = run(preset)
    expect(stats.d).toBe(2) // one delete, one insert
  })

  it('pure-insert deletes nothing and pure-delete inserts nothing', () => {
    const insert = findPreset('pure-insert')
    const remove = findPreset('pure-delete')
    if (insert === undefined || remove === undefined) throw new Error('missing preset')
    expect(run(insert).script.some((op) => op.type === 'delete')).toBe(false)
    expect(run(remove).script.some((op) => op.type === 'insert')).toBe(false)
  })

  it('worst-case has no free diagonals at all: D = N + M', () => {
    const preset = findPreset('worst-case')
    if (preset === undefined) throw new Error('missing preset')
    const { a, b, stats, script } = run(preset)
    expect(stats.d).toBe(a.tokens.length + b.tokens.length)
    expect(script.some((op) => op.type === 'keep')).toBe(false)
  })

  /**
   * The claim this preset makes: several minimal scripts exist, and one of the
   * alternatives attributes the closing brace to the wrong function. Both
   * halves are checked — the count, and that an alternative really does put a
   * lone `}` at the head of the inserted block.
   */
  it('brace-misattribution is genuinely ambiguous, and one alternative misattributes', () => {
    const preset = findPreset('brace-misattribution')
    if (preset === undefined) throw new Error('missing preset')
    const { a, b, script } = run(preset)

    const ambiguity = analyseAmbiguity(a.tokens, b.tokens)
    expect(ambiguity.count).toBeGreaterThan(1)

    const alternatives = minimalScripts(a.tokens, b.tokens, 8)
    const firstInserted = (s: typeof script) => {
      const hunks = buildHunks(s, a.texts, b.texts, 1)
      return hunks
        .flatMap((h) => h.lines)
        .find((line) => line.type === 'insert')?.text
    }

    // Some alternative starts its inserted block with a closing brace — the
    // brace of the *previous* function, reattributed to the new one.
    expect(alternatives.map(firstInserted)).toContain('}')
    // ...and it is not the one this implementation chose, which reads cleanly.
    expect(firstInserted(script)).not.toBe('}')
    // The alternatives are genuinely different scripts, not repeats.
    expect(new Set(alternatives.map((s) => JSON.stringify(s))).size).toBe(alternatives.length)
  })

  /**
   * The claim: at equal D, patience produces the more readable diff. Both
   * halves matter — if D differed, this would be the ordinary minimality
   * trade-off rather than the interesting case.
   */
  it('patience-wins really does win, at the same D', () => {
    const preset = findPreset('patience-wins')
    if (preset === undefined) throw new Error('missing preset')
    const { a, b } = tokenizePair(preset.a, preset.b, DEFAULT_TOKENIZE_OPTIONS)

    const myers = diff(a.tokens, b.tokens, 'myers')
    const patience = diff(a.tokens, b.tokens, 'patience')

    expect(patience.stats.d).toBe(myers.stats.d)
    expect(hunkCount(patience.script)).toBeLessThan(hunkCount(myers.script))
    expect(hunkCount(patience.script)).toBe(1)
  })

  it('char-level is the paper’s figure 1, with D = 5', () => {
    const preset = findPreset('char-level')
    if (preset === undefined) throw new Error('missing preset')
    expect(preset.a).toBe('ABCABBA')
    expect(preset.b).toBe('CBABAC')
    expect(run(preset).stats.d).toBe(5)
  })
})
