import { describe, expect, it } from 'vitest'
import { myersGreedy } from '@/lib/diff/myers'
import {
  buildTimeline,
  FrontierCursor,
  levelAt,
  nextLevelFrame,
  nextSnakeFrame,
  pathAt,
  previousLevelFrame,
} from '@/lib/player/timeline'
import { frontierAfterLevel } from '@/lib/diff/trace'
import { fullCorpus } from '../corpus'

const A = [1, 2, 3, 4, 5, 2, 2, 7]
const B = [2, 5, 5, 1, 2, 7, 3]

function timelineFor(a: readonly number[], b: readonly number[]) {
  const { trace, script } = myersGreedy(a, b)
  return { timeline: buildTimeline(trace, script), trace, script }
}

describe('timeline', () => {
  it('has one frame per recorded step, plus the backtrack phase', () => {
    const { timeline, trace } = timelineFor(A, B)
    const stepEvents = trace.events.filter((e) => e.type === 'step').length
    expect(timeline.searchFrames).toBe(stepEvents)
    expect(timeline.totalFrames).toBe(stepEvents + timeline.path.length)
    expect(timeline.stamps).toHaveLength(stepEvents)
  })

  it('keeps madder off screen until there is an answer', () => {
    const { timeline } = timelineFor(A, B)
    expect(pathAt(timeline, 0)).toBeNull()
    expect(pathAt(timeline, timeline.searchFrames)).toBeNull()
    expect(pathAt(timeline, timeline.searchFrames + 1)).not.toBeNull()
  })

  it('draws the path backwards, ending at the full path', () => {
    const { timeline } = timelineFor(A, B)
    const first = pathAt(timeline, timeline.searchFrames + 1)
    expect(first).toEqual([timeline.path[timeline.path.length - 1]])
    expect(pathAt(timeline, timeline.totalFrames)).toEqual(timeline.path)
  })

  it('jumps forward a whole d at a time and never sticks', () => {
    const { timeline } = timelineFor(A, B)
    let frame = 0
    const seen: number[] = []
    while (frame < timeline.searchFrames) {
      seen.push(levelAt(timeline, frame))
      const next = nextLevelFrame(timeline, frame)
      expect(next).toBeGreaterThan(frame)
      frame = next
    }
    // Levels come out in order, one per jump.
    expect(seen).toEqual([...seen].sort((p, q) => p - q))
    expect(new Set(seen).size).toBe(seen.length)
  })

  it('steps back a whole d at a time', () => {
    const { timeline } = timelineFor(A, B)
    const mid = timeline.levelStarts[2] + 1
    expect(previousLevelFrame(timeline, mid)).toBe(timeline.levelStarts[2])
    expect(previousLevelFrame(timeline, timeline.levelStarts[2])).toBe(timeline.levelStarts[1])
    expect(previousLevelFrame(timeline, 0)).toBe(0)
  })

  it('jumps to the frame just after each snake', () => {
    const { timeline } = timelineFor(A, B)
    const frame = nextSnakeFrame(timeline, 0)
    expect(timeline.steps[frame - 1].snake).not.toBeNull()
    expect(nextSnakeFrame(timeline, timeline.searchFrames)).toBe(timeline.totalFrames)
  })
})

describe('FrontierCursor', () => {
  it('reconstructs V by replaying steps, matching the recorded snapshots', () => {
    const { timeline, trace } = timelineFor(A, B)
    const cursor = new FrontierCursor(timeline)
    const snapshots = trace.snapshots
    if (snapshots === null) throw new Error('expected snapshots')

    // At the end of level d, the replayed V must agree with the snapshot on
    // every diagonal belonging to that level.
    for (let d = 0; d <= trace.d; d++) {
      const end = timeline.levelStarts[d + 1] ?? timeline.searchFrames
      cursor.seek(end)
      const replayed = new Map(cursor.points().map((p) => [p.k, p.x]))
      for (const point of frontierAfterLevel(snapshots, d, A.length, B.length)) {
        expect(replayed.get(point.k)).toBe(point.x)
      }
    }
  })

  it('gives the same V whether stepped forward or seeked backward', () => {
    const { timeline } = timelineFor(A, B)
    const forward = new FrontierCursor(timeline)
    forward.seek(5)
    const expected = forward.points()

    const backward = new FrontierCursor(timeline)
    backward.seek(timeline.searchFrames)
    backward.seek(5)
    expect(backward.points()).toEqual(expected)
  })

  it('returns points ordered by k, including negative k', () => {
    const { timeline } = timelineFor([1], [2, 3, 4, 5])
    const cursor = new FrontierCursor(timeline)
    cursor.seek(timeline.searchFrames)
    const ks = cursor.points().map((p) => p.k)
    expect(ks).toEqual([...ks].sort((p, q) => p - q))
    expect(ks.some((k) => k < 0)).toBe(true)
  })

  it('clamps out-of-range seeks', () => {
    const { timeline } = timelineFor(A, B)
    const cursor = new FrontierCursor(timeline)
    cursor.seek(-10)
    expect(cursor.position).toBe(0)
    cursor.seek(9999)
    expect(cursor.position).toBe(timeline.searchFrames)
  })
})

describe('timeline over the corpus', () => {
  it.each(fullCorpus(60).map((c) => [c.name, c] as const))(
    '%s stays inside the lattice at every frame',
    (_name, c) => {
      const { timeline } = timelineFor(c.a, c.b)
      const cursor = new FrontierCursor(timeline)
      for (let frame = 0; frame <= timeline.searchFrames; frame++) {
        cursor.seek(frame)
        for (const p of cursor.points()) {
          expect(p.x).toBeGreaterThanOrEqual(0)
          expect(p.y).toBeGreaterThanOrEqual(0)
          expect(p.x).toBeLessThanOrEqual(c.a.length)
          expect(p.y).toBeLessThanOrEqual(c.b.length)
        }
      }
      expect(pathAt(timeline, timeline.totalFrames)).toEqual(timeline.path)
    },
  )
})
