/**
 * EditScript → SearchTrace, for algorithms that do not maintain a V array.
 *
 * Patience and histogram are separate algorithms, not Myers variants: they
 * decide on anchors and recurse, and there is no frontier to watch. Forcing
 * them into the greedy skeleton would obscure exactly what the comparison view
 * exists to teach. CLAUDE.md invariant 7.
 *
 * So they emit the same trace *shape* at coarser granularity: one step per
 * non-diagonal move, each carrying the free snake that follows it. Every
 * invariant the views rely on still holds — k = x − y, a step costs exactly
 * one, a snake is a genuine run of matches — but snapshots is null, because
 * there is no V to show.
 */
import type { AlgorithmId, DiffStats, EditScript, Point, Token } from './types'
import type { SearchTrace, TraceEvent } from './trace'

export function traceFromScript(
  algorithm: AlgorithmId,
  a: readonly Token[],
  b: readonly Token[],
  script: EditScript,
): { trace: SearchTrace; stats: DiffStats } {
  const events: TraceEvent[] = []
  let x = 0
  let y = 0
  let d = 0
  let snakes = 0

  // Leading keeps: the free snake from (0,0), before any edit.
  const lead = runOfKeeps(script, 0)
  events.push({ type: 'level', d: 0, direction: 'forward' })
  if (lead > 0) {
    events.push({
      type: 'step',
      d: 0,
      k: 0,
      move: 'start',
      from: { x: 0, y: 0 },
      mid: { x: 0, y: 0 },
      to: { x: lead, y: lead },
      direction: 'forward',
    })
    snakes++
    x = lead
    y = lead
  }

  for (let i = lead; i < script.length; i++) {
    const op = script[i]
    if (op.type === 'keep') continue // consumed by the snake of the previous step

    const from: Point = { x, y }
    if (op.type === 'delete') x++
    else y++
    const mid: Point = { x, y }

    const run = runOfKeeps(script, i + 1)
    x += run
    y += run
    const to: Point = { x, y }
    if (run > 0) snakes++

    d++
    events.push({ type: 'level', d, direction: 'forward' })
    events.push({
      type: 'step',
      d,
      k: mid.x - mid.y,
      move: op.type === 'delete' ? 'right' : 'down',
      from,
      mid,
      to,
      direction: 'forward',
    })
    i += run
  }

  events.push({ type: 'reached', d, at: { x: a.length, y: b.length } })

  const stats: DiffStats = {
    d,
    n: a.length,
    m: b.length,
    snakes,
    events: events.length,
    // No V is retained: these algorithms are not the O(D²) recording case.
    vCells: 0,
    budgetExhausted: false,
  }
  return {
    trace: { algorithm, n: a.length, m: b.length, d, snapshots: null, events, stats },
    stats,
  }
}

function runOfKeeps(script: EditScript, start: number): number {
  let count = 0
  while (start + count < script.length && script[start + count].type === 'keep') count++
  return count
}
