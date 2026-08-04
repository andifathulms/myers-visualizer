/**
 * Trace → steppable timeline. Pure: no React, no DOM, no clock.
 *
 * Step-back is free because the search is recorded, not re-run (§6.7). The
 * timeline is derived once and then read by index; nothing is recomputed
 * while stepping.
 *
 * The timeline has two phases:
 *   search    — one frame per recorded step event
 *   backtrack — one frame per edit op, the madder path drawing itself
 */
import type { EditScript, Point, Snake } from '@/lib/diff/types'
import type { Direction, SearchTrace, TraceEvent } from '@/lib/diff/trace'
import { pathOf } from '@/lib/diff/backtrack'

export type Step = {
  readonly d: number
  readonly k: number
  readonly move: 'right' | 'down' | 'start'
  readonly from: Point
  readonly mid: Point
  readonly to: Point
  readonly snake: Snake | null
  /** Linear-space runs two frontiers at once; everything else runs forward. */
  readonly direction: Direction
  /** Set on the step where the two frontiers met. Drawn in madder. §6.6 */
  readonly middleSnake: Snake | null
}

export type Stamp = {
  readonly snakes: readonly Snake[]
  readonly frontier: readonly { k: number; x: number; y: number }[]
}

export type Timeline = {
  readonly steps: readonly Step[]
  /** One stamp per step, applied to the explored wash as the step passes. */
  readonly stamps: readonly Stamp[]
  /** Index of the first step of each d, for "jump to next d". */
  readonly levelStarts: readonly number[]
  /** Indices of steps that discovered a snake, for "jump to next snake". */
  readonly snakeSteps: readonly number[]
  /** Full path of the recovered script, drawn progressively during backtrack. */
  readonly path: readonly Point[]
  readonly searchFrames: number
  readonly totalFrames: number
  readonly d: number
}

function isStep(event: TraceEvent): event is Extract<TraceEvent, { type: 'step' }> {
  return event.type === 'step'
}

export function buildTimeline(trace: SearchTrace, script: EditScript): Timeline {
  const steps: Step[] = []
  const stamps: Stamp[] = []
  const levelStarts: number[] = []
  const snakeSteps: number[] = []
  // A middle snake is announced just before the step that found it, so it is
  // attached to the step the viewer is looking at when the frontiers meet.
  let pendingMiddle: Snake | null = null

  for (const event of trace.events) {
    if (event.type === 'middleSnake') {
      pendingMiddle = event.snake
      continue
    }
    if (!isStep(event)) continue
    const snake =
      event.to.x === event.mid.x && event.to.y === event.mid.y
        ? null
        : { x0: event.mid.x, y0: event.mid.y, x1: event.to.x, y1: event.to.y }

    while (levelStarts.length <= event.d) levelStarts.push(steps.length)
    if (snake !== null) snakeSteps.push(steps.length)

    steps.push({
      d: event.d,
      k: event.k,
      move: event.move,
      from: event.from,
      mid: event.mid,
      to: event.to,
      snake,
      direction: event.direction,
      middleSnake: pendingMiddle,
    })
    pendingMiddle = null
    stamps.push({
      snakes: snake === null ? [] : [snake],
      frontier: [{ k: event.k, x: event.to.x, y: event.to.y }],
    })
  }

  const path = pathOf(script)
  return {
    steps,
    stamps,
    levelStarts,
    snakeSteps,
    path,
    searchFrames: steps.length,
    // The backtrack phase draws the path one op at a time, back to front.
    totalFrames: steps.length + path.length,
    d: trace.d,
  }
}

/**
 * V, reconstructed incrementally by replaying steps. Each step sets V[k] to
 * the end of its snake, so replaying forward *is* the V array — which is why
 * the strip and the lattice can never disagree.
 *
 * Forward is O(1) per step; only a backward seek rebuilds, exactly as the
 * canvas's explored layer does.
 */
export class FrontierCursor {
  private readonly v = new Map<number, { k: number; x: number; y: number }>()
  private readonly back = new Map<number, { k: number; x: number; y: number }>()
  private index = 0

  constructor(private readonly timeline: Timeline) {}

  get position(): number {
    return this.index
  }

  seek(target: number): void {
    const bounded = Math.max(0, Math.min(target, this.timeline.searchFrames))
    if (bounded < this.index) {
      this.v.clear()
      this.back.clear()
      this.index = 0
    }
    for (let i = this.index; i < bounded; i++) {
      const step = this.timeline.steps[i]
      const into = step.direction === 'backward' ? this.back : this.v
      into.set(step.k, { k: step.k, x: step.to.x, y: step.to.y })
    }
    this.index = bounded
  }

  /** Current V, in increasing k — the contour the lattice draws. */
  points(): { k: number; x: number; y: number }[] {
    return [...this.v.values()].sort((p, q) => p.k - q.k)
  }

  /** The backward frontier, for linear-space mode. Empty otherwise. §6.6 */
  backwardPoints(): { k: number; x: number; y: number }[] {
    return [...this.back.values()].sort((p, q) => p.k - q.k)
  }
}

/** The most recent middle snake at this frame, or null before the first. */
export function middleSnakeAt(timeline: Timeline, frame: number): Snake | null {
  for (let i = Math.min(frame, timeline.searchFrames) - 1; i >= 0; i--) {
    const found = timeline.steps[i].middleSnake
    if (found !== null) return found
  }
  return null
}

/** Which d is on screen at this frame. */
export function levelAt(timeline: Timeline, frame: number): number {
  if (timeline.searchFrames === 0) return 0
  const index = Math.min(frame, timeline.searchFrames - 1)
  return timeline.steps[Math.max(0, index)].d
}

/** First frame of the next d, for the "jump to next d" control. §6.7 */
export function nextLevelFrame(timeline: Timeline, frame: number): number {
  const current = levelAt(timeline, frame)
  const next = timeline.levelStarts[current + 1]
  return next ?? timeline.searchFrames
}

export function previousLevelFrame(timeline: Timeline, frame: number): number {
  const current = levelAt(timeline, frame)
  const start = timeline.levelStarts[current] ?? 0
  if (frame > start) return start
  return timeline.levelStarts[Math.max(0, current - 1)] ?? 0
}

export function nextSnakeFrame(timeline: Timeline, frame: number): number {
  for (const index of timeline.snakeSteps) {
    if (index >= frame) return index + 1
  }
  return timeline.totalFrames
}

/**
 * The path prefix drawn at this frame. Null during the search phase: madder
 * means "this is the answer", so it does not appear until there is one.
 */
export function pathAt(timeline: Timeline, frame: number): Point[] | null {
  if (frame <= timeline.searchFrames) return null
  const drawn = Math.min(frame - timeline.searchFrames, timeline.path.length)
  // Drawn backwards, from (N,M) toward (0,0), following the backtrack.
  return timeline.path.slice(timeline.path.length - drawn)
}
