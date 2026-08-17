import { describe, expect, it } from 'vitest'
import { edgeOfOp, pathEdgeMap, pointKey } from '@/lib/player/hoverLink'

describe('hoverLink', () => {
  const path = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 1 },
    { x: 2, y: 2 },
  ]

  it('maps each vertex to the op(s) touching it', () => {
    const map = pathEdgeMap(path)
    expect(map.get(pointKey({ x: 0, y: 0 }))).toEqual([0])
    expect(map.get(pointKey({ x: 1, y: 0 }))).toEqual([0, 1])
    expect(map.get(pointKey({ x: 2, y: 1 }))).toEqual([1, 2])
    expect(map.get(pointKey({ x: 2, y: 2 }))).toEqual([2])
  })

  it('recovers the edge for a given op index', () => {
    expect(edgeOfOp(path, 0)).toEqual({ x0: 0, y0: 0, x1: 1, y1: 0 })
    expect(edgeOfOp(path, 2)).toEqual({ x0: 2, y0: 1, x1: 2, y1: 2 })
  })

  it('returns null for an out-of-range op', () => {
    expect(edgeOfOp(path, -1)).toBeNull()
    expect(edgeOfOp(path, 3)).toBeNull()
    expect(edgeOfOp([], 0)).toBeNull()
  })

  it('a point the path never visits has no entry', () => {
    const map = pathEdgeMap(path)
    expect(map.get(pointKey({ x: 5, y: 5 }))).toBeUndefined()
  })
})
