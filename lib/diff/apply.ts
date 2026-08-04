/**
 * The independent verifier.
 *
 * Applying a recovered edit script to A must produce B, exactly — for every
 * algorithm, every input, every option. This file shares no code with any
 * search: if it imported from myers.ts it would be validating that file's own
 * assumptions instead of the result. It imports types only.
 *
 * PRD §8, CLAUDE.md invariant 3.
 */
import type { EditScript, Token } from './types'

export class ApplyError extends Error {
  constructor(
    message: string,
    readonly opIndex: number,
  ) {
    super(message)
    this.name = 'ApplyError'
  }
}

/**
 * Replay the script against A. Throws ApplyError the moment the script
 * disagrees with A — a script that does not describe A is not merely wrong
 * about B, it is malformed.
 */
export function apply(a: readonly Token[], script: EditScript): Token[] {
  const out: Token[] = []
  let cursor = 0

  for (let i = 0; i < script.length; i++) {
    const op = script[i]
    switch (op.type) {
      case 'keep':
      case 'delete': {
        if (op.aIndex !== cursor) {
          throw new ApplyError(
            `op ${i} (${op.type}) addresses A[${op.aIndex}] but A[${cursor}] is next`,
            i,
          )
        }
        if (cursor >= a.length) {
          throw new ApplyError(`op ${i} (${op.type}) runs past the end of A`, i)
        }
        if (a[cursor] !== op.token) {
          throw new ApplyError(
            `op ${i} (${op.type}) carries token ${op.token} but A[${cursor}] is ${a[cursor]}`,
            i,
          )
        }
        if (op.type === 'keep') out.push(op.token)
        cursor++
        break
      }
      case 'insert': {
        out.push(op.token)
        break
      }
      default: {
        const never: never = op
        throw new ApplyError(`unknown op ${JSON.stringify(never)}`, i)
      }
    }
  }

  if (cursor !== a.length) {
    throw new ApplyError(`script consumed ${cursor} of ${a.length} elements of A`, script.length)
  }
  return out
}

export type ApplyCheck =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string; readonly produced: Token[] | null }

/**
 * The apply property, as a total function: does this script take A to B?
 * Cheap enough to run on every case in the corpus.
 */
export function checkApply(a: readonly Token[], b: readonly Token[], script: EditScript): ApplyCheck {
  let produced: Token[]
  try {
    produced = apply(a, script)
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
      produced: null,
    }
  }
  if (produced.length !== b.length) {
    return {
      ok: false,
      reason: `produced ${produced.length} elements, expected ${b.length}`,
      produced,
    }
  }
  for (let i = 0; i < produced.length; i++) {
    if (produced[i] !== b[i]) {
      return {
        ok: false,
        reason: `element ${i}: produced ${produced[i]}, expected ${b[i]}`,
        produced,
      }
    }
  }
  return { ok: true }
}

/**
 * Structural check independent of apply: indices are in range, A is walked
 * strictly forward, and B is emitted strictly forward. A script can take A to
 * B while being internally incoherent about B's indices; this catches that.
 */
export function checkWellFormed(
  a: readonly Token[],
  b: readonly Token[],
  script: EditScript,
): ApplyCheck {
  let ai = 0
  let bi = 0
  for (let i = 0; i < script.length; i++) {
    const op = script[i]
    switch (op.type) {
      case 'keep':
        if (op.aIndex !== ai || op.bIndex !== bi) {
          return { ok: false, reason: `op ${i}: keep out of order`, produced: null }
        }
        if (a[ai] !== b[bi]) {
          return { ok: false, reason: `op ${i}: keep of unequal elements`, produced: null }
        }
        ai++
        bi++
        break
      case 'delete':
        if (op.aIndex !== ai) return { ok: false, reason: `op ${i}: delete out of order`, produced: null }
        ai++
        break
      case 'insert':
        if (op.bIndex !== bi) return { ok: false, reason: `op ${i}: insert out of order`, produced: null }
        bi++
        break
      default: {
        const never: never = op
        return { ok: false, reason: `unknown op ${JSON.stringify(never)}`, produced: null }
      }
    }
  }
  if (ai !== a.length || bi !== b.length) {
    return { ok: false, reason: `script ends at A[${ai}] B[${bi}]`, produced: null }
  }
  return { ok: true }
}
