'use client'

import { Component, type ReactNode } from 'react'

/**
 * DESIGN.md §8. React error boundaries have no hook form, so this stays a
 * class component — the one place in the codebase that is. Generic on
 * purpose: the graph page wraps `GraphView` in it with a fallback that
 * offers the presets and keeps the share link (below); `app/[locale]/error.tsx`
 * is Next's own route-level boundary and does not need this at all, but the
 * two exist for the same reason — a render-time throw in the canvas layer,
 * the stepper or the hunks renderer previously took the whole page down.
 */
type Props = {
  children: ReactNode
  fallback: (reset: () => void) => ReactNode
}

type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  private reset = (): void => {
    this.setState({ hasError: false })
  }

  render(): ReactNode {
    if (this.state.hasError) return this.props.fallback(this.reset)
    return this.props.children
  }
}
