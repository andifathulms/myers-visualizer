import { describe, expect, it } from 'vitest'
import { findPreset } from '@/data/presets'
import { DEFAULT_TOKENIZE_OPTIONS, tokenizePair } from '@/lib/tokenize'
import { analyseAmbiguity, contestedEdges, minimalScripts } from '@/lib/diff/ambiguity'
import { pathOf } from '@/lib/diff/backtrack'
import { checkApply } from '@/lib/diff/apply'
import { myersGreedy } from '@/lib/diff/myers'
import { GHOST_PATH_CAP } from '@/components/lattice/frame'

/**
 * DESIGN.md §4: minimal paths render together on the lattice. Never assert
 * script identity across alternatives (CLAUDE.md invariant 2) — every
 * assertion here is about counts and edges, not about which script an
 * alternative happens to be.
 */
function run(id: string) {
  const preset = findPreset(id)
  if (preset === undefined) throw new Error(`missing preset ${id}`)
  const { a, b } = tokenizePair(preset.a, preset.b, {
    ...DEFAULT_TOKENIZE_OPTIONS,
    granularity: preset.granularity,
  })
  return { a, b, ...myersGreedy(a.tokens, b.tokens) }
}

describe('lattice overlay data', () => {
  it('exactly one minimal path: no ghosts, no contested edges', () => {
    const { a, b } = run('pure-insert')
    const ambiguity = analyseAmbiguity(a.tokens, b.tokens)
    expect(ambiguity.count).toBe(1)

    const edges = contestedEdges(a.tokens, b.tokens)
    expect(edges).not.toBeNull()
    expect(edges).toHaveLength(0)
  })

  it('many minimal paths: ghosts and contested edges both appear, under the cap', () => {
    const { a, b, script } = run('brace-misattribution')
    const ambiguity = analyseAmbiguity(a.tokens, b.tokens)
    expect(ambiguity.count).toBeGreaterThan(1)
    expect(ambiguity.count).toBeLessThanOrEqual(GHOST_PATH_CAP)

    const scripts = minimalScripts(a.tokens, b.tokens, GHOST_PATH_CAP + 1)
    expect(scripts.length).toBeLessThanOrEqual(GHOST_PATH_CAP)
    const ghostPaths = scripts.map(pathOf)
    for (const path of ghostPaths) {
      expect(path[0]).toEqual({ x: 0, y: 0 })
      expect(path[path.length - 1]).toEqual({ x: a.tokens.length, y: b.tokens.length })
    }

    const edges = contestedEdges(a.tokens, b.tokens)
    expect(edges).not.toBeNull()
    expect(edges!.length).toBeGreaterThan(0)

    // The chosen path's own edges are never contested against themselves —
    // a contested edge is one *some* minimal scripts skip, and the chosen
    // script's edges are exactly the ones every alternative disagrees about
    // in at least one place, not the ones absent from it.
    const chosenPath = pathOf(script)
    const chosenEdgeKeys = new Set(
      chosenPath.slice(1).map((p, i) => `${chosenPath[i].x},${chosenPath[i].y}->${p.x},${p.y}`),
    )
    const contestedKeys = new Set(edges!.map((e) => `${e.x0},${e.y0}->${e.x1},${e.y1}`))
    // At least one contested edge is one the chosen script actually took —
    // that is what "some scripts take it, others don't" means for the one
    // shown solid.
    const overlap = [...chosenEdgeKeys].some((k) => contestedKeys.has(k))
    expect(overlap).toBe(true)
  })

  it('an artificially huge ambiguity is refused rather than approximated', () => {
    const { a, b } = run('worst-case')
    const ambiguity = analyseAmbiguity(a.tokens, b.tokens)
    expect(ambiguity.truncated).toBe(true)
    expect(contestedEdges(a.tokens, b.tokens)).toBeNull()
  })

  it('every alternative still applies to A and produces B — the overlay never draws a wrong answer', () => {
    const { a, b } = run('brace-misattribution')
    for (const script of minimalScripts(a.tokens, b.tokens, GHOST_PATH_CAP + 1)) {
      expect(checkApply(a.tokens, b.tokens, script).ok).toBe(true)
    }
  })
})
