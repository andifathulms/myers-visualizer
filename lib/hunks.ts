/**
 * EditScript → unified-diff hunks. Pure.
 *
 * Each line keeps the index of the op that produced it, so clicking a `-` can
 * highlight the horizontal move in the lattice and a `+` the vertical one.
 * PRD §6.3.
 */
import type { EditScript } from '@/lib/diff/types'

export type HunkLine = {
  readonly type: 'keep' | 'delete' | 'insert'
  readonly text: string
  readonly aIndex: number | null
  readonly bIndex: number | null
  /** Index into the edit script — the link back to the graph. */
  readonly opIndex: number
}

export type Hunk = {
  readonly aStart: number
  readonly aCount: number
  readonly bStart: number
  readonly bCount: number
  readonly lines: readonly HunkLine[]
}

export const DEFAULT_CONTEXT = 3

export function buildHunks(
  script: EditScript,
  aTexts: readonly string[],
  bTexts: readonly string[],
  context = DEFAULT_CONTEXT,
): Hunk[] {
  const lines: HunkLine[] = []
  for (let i = 0; i < script.length; i++) {
    const op = script[i]
    switch (op.type) {
      case 'keep':
        lines.push({
          type: 'keep',
          text: aTexts[op.aIndex] ?? '',
          aIndex: op.aIndex,
          bIndex: op.bIndex,
          opIndex: i,
        })
        break
      case 'delete':
        lines.push({
          type: 'delete',
          text: aTexts[op.aIndex] ?? '',
          aIndex: op.aIndex,
          bIndex: null,
          opIndex: i,
        })
        break
      case 'insert':
        lines.push({
          type: 'insert',
          text: bTexts[op.bIndex] ?? '',
          aIndex: null,
          bIndex: op.bIndex,
          opIndex: i,
        })
        break
      default: {
        const never: never = op
        throw new Error(`unknown op ${JSON.stringify(never)}`)
      }
    }
  }

  // Keep every changed line, plus `context` unchanged lines either side.
  const keep = new Array<boolean>(lines.length).fill(false)
  let changed = false
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].type === 'keep') continue
    changed = true
    for (let j = Math.max(0, i - context); j <= Math.min(lines.length - 1, i + context); j++) {
      keep[j] = true
    }
  }
  if (!changed) return []

  const hunks: Hunk[] = []
  let index = 0
  while (index < lines.length) {
    if (!keep[index]) {
      index++
      continue
    }
    const start = index
    while (index < lines.length && keep[index]) index++
    const slice = lines.slice(start, index)

    const firstA = slice.find((l) => l.aIndex !== null)?.aIndex ?? null
    const firstB = slice.find((l) => l.bIndex !== null)?.bIndex ?? null
    const aCount = slice.filter((l) => l.type !== 'insert').length
    const bCount = slice.filter((l) => l.type !== 'delete').length
    hunks.push({
      // Unified diff is 1-based, and an empty side is reported as 0.
      aStart: aCount === 0 ? 0 : (firstA ?? 0) + 1,
      aCount,
      bStart: bCount === 0 ? 0 : (firstB ?? 0) + 1,
      bCount,
      lines: slice,
    })
  }
  return hunks
}

export function formatHunkHeader(hunk: Hunk): string {
  return `@@ -${hunk.aStart},${hunk.aCount} +${hunk.bStart},${hunk.bCount} @@`
}

export const LINE_PREFIX: Record<HunkLine['type'], string> = {
  keep: ' ',
  delete: '-',
  insert: '+',
}

/** The whole diff as text, for copying. */
export function formatUnified(hunks: readonly Hunk[]): string {
  const out: string[] = []
  for (const hunk of hunks) {
    out.push(formatHunkHeader(hunk))
    for (const line of hunk.lines) out.push(`${LINE_PREFIX[line.type]}${line.text}`)
  }
  return out.join('\n')
}
