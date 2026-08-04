/**
 * Histogram diff — the algorithm JGit added and git ships as
 * `--histogram`.
 *
 * Also a separate algorithm, and related to patience but not the same: rather
 * than requiring an element to be unique on both sides, it builds a histogram
 * of occurrences and splits on the longest common run whose rarest element
 * occurs least often. Rare elements are the informative ones; a line that
 * appears fifty times tells you nothing about where a block went.
 *
 * Not minimal either. Assert D_myers ≤ D_histogram, never equality.
 */
import { myersGreedy } from './myers'
import { traceFromScript } from './from-script'
import type { DiffStats, EditOp, EditScript, Token } from './types'
import type { SearchTrace } from './trace'

export type HistogramResult = {
  readonly script: EditScript
  readonly trace: SearchTrace
  readonly stats: DiffStats
}

/**
 * Above this many occurrences an element is considered uninformative, and the
 * region falls back to Myers. JGit uses the same guard, for the same reason:
 * without it, a file of repeated boilerplate degrades badly.
 */
const MAX_OCCURRENCES = 64

export function histogramDiff(a: readonly Token[], b: readonly Token[]): HistogramResult {
  const ops: EditOp[] = []
  walk(a, b, 0, a.length, 0, b.length, ops)
  const script: EditScript = ops
  const { trace, stats } = traceFromScript('histogram', a, b, script)
  return { script, trace, stats }
}

type Region = { aStart: number; bStart: number; length: number; rarity: number }

function walk(
  a: readonly Token[],
  b: readonly Token[],
  aLo: number,
  aHi: number,
  bLo: number,
  bHi: number,
  out: EditOp[],
): void {
  if (aLo >= aHi && bLo >= bHi) return
  if (aLo >= aHi) {
    for (let j = bLo; j < bHi; j++) out.push({ type: 'insert', bIndex: j, token: b[j] })
    return
  }
  if (bLo >= bHi) {
    for (let i = aLo; i < aHi; i++) out.push({ type: 'delete', aIndex: i, token: a[i] })
    return
  }

  const best = findBestRegion(a, b, aLo, aHi, bLo, bHi)
  if (best === null) {
    // Nothing in common at all, or nothing rare enough to trust.
    fallback(a, b, aLo, aHi, bLo, bHi, out)
    return
  }

  walk(a, b, aLo, best.aStart, bLo, best.bStart, out)
  for (let i = 0; i < best.length; i++) {
    out.push({
      type: 'keep',
      aIndex: best.aStart + i,
      bIndex: best.bStart + i,
      token: a[best.aStart + i],
    })
  }
  walk(a, b, best.aStart + best.length, aHi, best.bStart + best.length, bHi, out)
}

/**
 * The longest common run whose rarest element is rarest overall. Ties go to
 * the longer run, then to the earliest position — so the result is
 * deterministic, which the whole engine requires.
 */
function findBestRegion(
  a: readonly Token[],
  b: readonly Token[],
  aLo: number,
  aHi: number,
  bLo: number,
  bHi: number,
): Region | null {
  const occurrences = new Map<Token, number[]>()
  for (let i = aLo; i < aHi; i++) {
    const list = occurrences.get(a[i])
    if (list === undefined) occurrences.set(a[i], [i])
    else list.push(i)
  }

  let best: Region | null = null
  let tooCommon = false

  for (let j = bLo; j < bHi; j++) {
    const positions = occurrences.get(b[j])
    if (positions === undefined) continue
    if (positions.length > MAX_OCCURRENCES) {
      tooCommon = true
      continue
    }

    for (const i of positions) {
      // Extend the common run in both directions from (i, j).
      let start = 0
      while (i - start > aLo && j - start > bLo && a[i - start - 1] === b[j - start - 1]) start++
      let end = 1
      while (i + end < aHi && j + end < bHi && a[i + end] === b[j + end]) end++

      const aStart = i - start
      const bStart = j - start
      const length = start + end

      // Rarity of the run: the count of its most common element.
      let rarity = 0
      for (let step = 0; step < length; step++) {
        const count = occurrences.get(a[aStart + step])?.length ?? 0
        if (count > rarity) rarity = count
      }

      if (
        best === null ||
        rarity < best.rarity ||
        (rarity === best.rarity && length > best.length)
      ) {
        best = { aStart, bStart, length, rarity }
      }
    }
  }

  if (best === null && tooCommon) return null
  return best
}

function fallback(
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
        out.push({ type: 'keep', aIndex: op.aIndex + aLo, bIndex: op.bIndex + bLo, token: op.token })
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
