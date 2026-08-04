/**
 * jsdom has no canvas and no ResizeObserver. The lattice renderer is measured
 * separately, in tests/render/frame-cost.test.ts — here the point is the React
 * wiring, so the drawing surface is stubbed out rather than emulated.
 */
if (typeof window !== 'undefined') {
  if (typeof window.ResizeObserver === 'undefined') {
    window.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    } as unknown as typeof ResizeObserver
  }

  const noop = () => undefined
  const stubContext = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'canvas') return {}
        return noop
      },
      set() {
        return true
      },
    },
  ) as unknown as CanvasRenderingContext2D

  HTMLCanvasElement.prototype.getContext = (() =>
    stubContext) as unknown as HTMLCanvasElement['getContext']
}
