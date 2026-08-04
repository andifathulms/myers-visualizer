/**
 * The shared corpus. Deterministic: no Math.random anywhere, so a failure is
 * always reproducible by case name.
 */
import type { Token } from '@/lib/diff/types'

export type Case = {
  readonly name: string
  readonly a: readonly Token[]
  readonly b: readonly Token[]
}

/**
 * Mandatory and permanent. These are the shapes where the V offset, the
 * boundary conditions and the empty-script path go wrong. CLAUDE.md testing
 * rules.
 */
export const EDGE_CASES: readonly Case[] = [
  { name: 'both-empty', a: [], b: [] },
  { name: 'empty-a', a: [], b: [1, 2, 3] },
  { name: 'empty-b', a: [1, 2, 3], b: [] },
  { name: 'identical', a: [1, 2, 3, 4], b: [1, 2, 3, 4] },
  { name: 'identical-single', a: [7], b: [7] },
  { name: 'single-different', a: [1], b: [2] },
  { name: 'disjoint', a: [1, 2, 3], b: [4, 5, 6] },
  { name: 'disjoint-long', a: [1, 1, 1, 1, 1], b: [2, 2, 2, 2, 2, 2] },
  { name: 'repeated-elements', a: [1, 1, 1, 1], b: [1, 1] },
  { name: 'all-same', a: [3, 3, 3], b: [3, 3, 3] },
  { name: 'pure-insert', a: [1, 2], b: [1, 9, 9, 2] },
  { name: 'pure-delete', a: [1, 9, 9, 2], b: [1, 2] },
  { name: 'transposition', a: [1, 2, 3, 4], b: [3, 4, 1, 2] },
  { name: 'prefix-only', a: [1, 2, 3], b: [1] },
  { name: 'suffix-only', a: [1, 2, 3], b: [3] },
  // From the paper, figure 1: ABCABBA → CBABAC, D = 5.
  { name: 'paper-figure-1', a: [1, 2, 3, 1, 2, 2, 1], b: [3, 2, 1, 2, 1, 3] },
]

/** Small LCG. Same sequence on every machine and every run. */
function lcg(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

export function generatedCorpus(count: number, maxLength = 12, seed = 0x5e115): Case[] {
  const rnd = lcg(seed)
  const cases: Case[] = []
  for (let i = 0; i < count; i++) {
    // A small alphabet forces repeated elements and ambiguity; a large one
    // forces long stretches with no free diagonals at all.
    const alphabet = 1 + Math.floor(rnd() * 5)
    const n = Math.floor(rnd() * (maxLength + 1))
    const m = Math.floor(rnd() * (maxLength + 1))
    const a: Token[] = []
    const b: Token[] = []
    for (let j = 0; j < n; j++) a.push(Math.floor(rnd() * alphabet))
    for (let j = 0; j < m; j++) b.push(Math.floor(rnd() * alphabet))
    cases.push({ name: `gen-${i}-a${alphabet}-${n}x${m}`, a, b })
  }
  return cases
}

/** Edges plus generated cases — what the apply property runs across. */
export function fullCorpus(count = 300): Case[] {
  return [...EDGE_CASES, ...generatedCorpus(count)]
}

/** Worst case: no element in common, so D = N + M. §6.8 */
export function worstCase(size: number): Case {
  return {
    name: `worst-${size}`,
    a: Array.from({ length: size }, (_, i) => i * 2),
    b: Array.from({ length: size }, (_, i) => i * 2 + 1),
  }
}
