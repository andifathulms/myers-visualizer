/**
 * Patience diff — Bram Cohen's algorithm, as shipped by git as
 * `--patience`.
 *
 * A separate algorithm, not a Myers variant. It anchors on elements that
 * appear *exactly once* on each side, takes the longest increasing subsequence
 * of those anchors, and recurses between them. Regions with no unique anchor
 * fall back to Myers, exactly as git does.
 *
 * It is NOT minimal, and never assume it is: the whole point is that it trades
 * a longer edit script for a more readable one. The correct assertion is
 * D_myers ≤ D_patience. PRD §8, CLAUDE.md invariant 8.
 */
import { myersGreedy } from './myers'
import { traceFromScript } from './from-script'
import type { DiffStats, EditOp, EditScript, Token } from './types'
import type { SearchTrace } from './trace'

export type PatienceResult = {
  readonly script: EditScript
  readonly trace: SearchTrace
  readonly stats: DiffStats
}

export function patienceDiff(a: readonly Token[], b: readonly Token[]): PatienceResult {
  const ops: EditOp[] = []
  walk(a, b, 0, a.length, 0, b.length, ops)
  const script: EditScript = ops
  const { trace, stats } = traceFromScript('patience', a, b, script)
  return { script, trace, stats }
}

function walk(
  a: readonly Token[],
  b: readonly Token[],
  aLo: number,
  aHi: number,
  bLo: number,
  bHi: number,
  out: EditOp[],
): void {
  // Common prefix and suffix are free and unambiguous; taking them first is
  // what keeps the anchor search on the part that actually differs.
  while (aLo < aHi && bLo < bHi && a[aLo] === b[bLo]) {
    out.push({ type: 'keep', aIndex: aLo, bIndex: bLo, token: a[aLo] })
    aLo++
    bLo++
  }
  const suffix: EditOp[] = []
  while (aLo < aHi && bLo < bHi && a[aHi - 1] === b[bHi - 1]) {
    aHi--
    bHi--
    suffix.push({ type: 'keep', aIndex: aHi, bIndex: bHi, token: a[aHi] })
  }
  suffix.reverse()

  emitMiddle(a, b, aLo, aHi, bLo, bHi, out)
  out.push(...suffix)
}

function emitMiddle(
  a: readonly Token[],
  b: readonly Token[],
  aLo: number,
  aHi: number,
  bLo: number,
  bHi: number,
  out: EditOp[],
): void {
  if (aLo === aHi && bLo === bHi) return
  if (aLo === aHi) {
    for (let j = bLo; j < bHi; j++) out.push({ type: 'insert', bIndex: j, token: b[j] })
    return
  }
  if (bLo === bHi) {
    for (let i = aLo; i < aHi; i++) out.push({ type: 'delete', aIndex: i, token: a[i] })
    return
  }

  const anchors = uniqueCommonAnchors(a, b, aLo, aHi, bLo, bHi)
  if (anchors.length === 0) {
    // No element is unique on both sides — patience has nothing to anchor on,
    // so git falls back to Myers here, and so do we.
    fallbackToMyers(a, b, aLo, aHi, bLo, bHi, out)
    return
  }

  const chain = longestIncreasingSubsequence(anchors.map((anchor) => anchor.b))
  let aAt = aLo
  let bAt = bLo
  for (const index of chain) {
    const anchor = anchors[index]
    walk(a, b, aAt, anchor.a, bAt, anchor.b, out)
    out.push({ type: 'keep', aIndex: anchor.a, bIndex: anchor.b, token: a[anchor.a] })
    aAt = anchor.a + 1
    bAt = anchor.b + 1
  }
  walk(a, b, aAt, aHi, bAt, bHi, out)
}

function fallbackToMyers(
  a: readonly Token[],
  b: readonly Token[],
  aLo: number,
  aHi: number,
  bLo: number,
  bHi: number,
  out: EditOp[],
): void {
  const { script } = myersGreedy(a.slice(aLo, aHi), b.slice(bLo, bHi))
  for (const op of script) {
    switch (op.type) {
      case 'keep':
        out.push({
          type: 'keep',
          aIndex: op.aIndex + aLo,
          bIndex: op.bIndex + bLo,
          token: op.token,
        })
        break
      case 'delete':
        out.push({ type: 'delete', aIndex: op.aIndex + aLo, token: op.token })
        break
      case 'insert':
        out.push({ type: 'insert', bIndex: op.bIndex + bLo, token: op.token })
        break
      default: {
        const never: never = op
        throw new Error(`unknown op ${JSON.stringify(never)}`)
      }
    }
  }
}

/**
 * Elements occurring exactly once in each range, paired up and ordered by
 * their position in A. "Exactly once" is the whole idea: a line that appears
 * many times carries no information about where a block moved to.
 */
function uniqueCommonAnchors(
  a: readonly Token[],
  b: readonly Token[],
  aLo: number,
  aHi: number,
  bLo: number,
  bHi: number,
): { a: number; b: number }[] {
  const inA = new Map<Token, number>()
  for (let i = aLo; i < aHi; i++) {
    const seen = inA.get(a[i])
    inA.set(a[i], seen === undefined ? i : -1) // -1 marks "more than once"
  }
  const inB = new Map<Token, number>()
  for (let j = bLo; j < bHi; j++) {
    const seen = inB.get(b[j])
    inB.set(b[j], seen === undefined ? j : -1)
  }

  const anchors: { a: number; b: number }[] = []
  for (const [token, i] of inA) {
    if (i < 0) continue
    const j = inB.get(token)
    if (j === undefined || j < 0) continue
    anchors.push({ a: i, b: j })
  }
  anchors.sort((p, q) => p.a - q.a)
  return anchors
}

/**
 * Indices of a longest increasing subsequence — patience sorting, which is
 * where the algorithm gets its name. O(n log n).
 */
export function longestIncreasingSubsequence(values: readonly number[]): number[] {
  if (values.length === 0) return []
  const piles: number[] = [] // piles[len-1] = index of the smallest tail
  const previous = new Array<number>(values.length).fill(-1)

  for (let i = 0; i < values.length; i++) {
    let lo = 0
    let hi = piles.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (values[piles[mid]] < values[i]) lo = mid + 1
      else hi = mid
    }
    if (lo > 0) previous[i] = piles[lo - 1]
    if (lo === piles.length) piles.push(i)
    else piles[lo] = i
  }

  const chain: number[] = []
  let at = piles[piles.length - 1]
  while (at !== -1) {
    chain.push(at)
    at = previous[at]
  }
  chain.reverse()
  return chain
}
