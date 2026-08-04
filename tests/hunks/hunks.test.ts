import { describe, expect, it } from 'vitest'
import { buildHunks, formatUnified } from '@/lib/hunks'
import { myersGreedy } from '@/lib/diff/myers'
import { tokenizePair, DEFAULT_TOKENIZE_OPTIONS, split } from '@/lib/tokenize'
import { fullCorpus } from '../corpus'

function diffText(aText: string, bText: string, context = 3) {
  const { a, b } = tokenizePair(aText, bText, DEFAULT_TOKENIZE_OPTIONS)
  const { script } = myersGreedy(a.tokens, b.tokens)
  return buildHunks(script, a.texts, b.texts, context)
}

describe('hunks', () => {
  it('produces nothing when the inputs are identical', () => {
    expect(diffText('a\nb\nc', 'a\nb\nc')).toEqual([])
  })

  it('surrounds a change with context', () => {
    const source = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].join('\n')
    const target = ['1', '2', '3', '4', 'X', '6', '7', '8', '9'].join('\n')
    const hunks = diffText(source, target, 2)
    expect(hunks).toHaveLength(1)
    expect(hunks[0].lines.map((l) => l.text)).toEqual(['3', '4', '5', 'X', '6', '7'])
    expect(hunks[0].lines.filter((l) => l.type !== 'keep').map((l) => l.text)).toEqual(['5', 'X'])
  })

  it('splits distant changes into separate hunks', () => {
    const source = Array.from({ length: 20 }, (_, i) => String(i)).join('\n')
    const target = source.replace(/^1$/m, 'X').replace(/^18$/m, 'Y')
    expect(diffText(source, target, 1).length).toBe(2)
  })

  it('merges nearby changes into one hunk', () => {
    const source = Array.from({ length: 10 }, (_, i) => String(i)).join('\n')
    const target = source.replace(/^3$/m, 'X').replace(/^5$/m, 'Y')
    expect(diffText(source, target, 3)).toHaveLength(1)
  })

  it('writes a 1-based header and counts each side', () => {
    const hunks = diffText('a\nb\nc', 'a\nB\nc', 1)
    expect(formatUnified(hunks).split('\n')[0]).toBe('@@ -1,3 +1,3 @@')
  })

  it('reports 0 for a side with no lines', () => {
    const hunks = diffText('', 'satu\ndua')
    expect(hunks[0].aStart).toBe(0)
    expect(hunks[0].aCount).toBe(0)
    expect(hunks[0].bCount).toBe(2)
  })

  it('keeps every line linked to the op that produced it', () => {
    const { a, b } = tokenizePair('a\nb', 'a\nc', DEFAULT_TOKENIZE_OPTIONS)
    const { script } = myersGreedy(a.tokens, b.tokens)
    const hunks = buildHunks(script, a.texts, b.texts)
    for (const line of hunks.flatMap((h) => h.lines)) {
      const op = script[line.opIndex]
      expect(op.type).toBe(line.type)
      if (op.type === 'delete') expect(line.aIndex).toBe(op.aIndex)
      if (op.type === 'insert') expect(line.bIndex).toBe(op.bIndex)
    }
  })

  it('reconstructs B from the keeps and inserts, on every corpus case', () => {
    for (const c of fullCorpus(60)) {
      const aText = c.a.join('\n')
      const bText = c.b.join('\n')
      const { a, b } = tokenizePair(aText, bText, DEFAULT_TOKENIZE_OPTIONS)
      const { script } = myersGreedy(a.tokens, b.tokens)
      // Unchanged input has no hunks at all, which is the point of a diff.
      if (script.every((op) => op.type === 'keep')) continue
      const rebuilt = buildHunks(script, a.texts, b.texts, Number.MAX_SAFE_INTEGER)
        .flatMap((h) => h.lines)
        .filter((l) => l.type !== 'delete')
        .map((l) => l.text)
      expect(rebuilt, `case ${c.name}`).toEqual(split(bText, 'line'))
    }
  })
})
