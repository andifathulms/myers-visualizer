import type { Preset } from '@/data/presets'
import { diff } from '@/lib/diff'
import { analyseAmbiguity } from '@/lib/diff/ambiguity'
import { pathOf } from '@/lib/diff/backtrack'
import { tokenizePair } from '@/lib/tokenize'
import type { Point } from '@/layout/lattice'

/**
 * What a preset card shows before its paragraph: the route Myers takes, the
 * size of the lattice, D, and how many minimal scripts exist. Run at build
 * time by the static gallery page, so the thumbnails cost the visitor no
 * JavaScript and no search.
 *
 * The count is the same exact-or-capped figure the tool shows — `truncated`
 * says it saturated at COUNT_CAP, and the card says "at least" rather than
 * rounding. Contestedness is a count, never an estimate.
 */
export type PresetSummary = {
  readonly n: number
  readonly m: number
  readonly d: number
  readonly route: readonly Point[]
  readonly minimal: number
  readonly truncated: boolean
}

export function summarise(preset: Preset): PresetSummary {
  const { a, b } = tokenizePair(preset.a, preset.b, {
    granularity: preset.granularity,
    ignoreWhitespace: false,
    ignoreCase: false,
  })
  const result = diff(a.tokens, b.tokens, 'myers')
  const ambiguity = analyseAmbiguity(a.tokens, b.tokens)
  return {
    n: a.tokens.length,
    m: b.tokens.length,
    d: result.stats.d,
    route: pathOf(result.script),
    minimal: ambiguity.count,
    truncated: ambiguity.truncated,
  }
}
