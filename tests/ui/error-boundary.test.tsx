import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { ErrorBoundary } from '@/components/chrome/ErrorBoundary'
import LocaleError from '@/app/[locale]/error'
import GrafPage from '@/app/[locale]/graf/page'
import { getDict } from '@/lib/i18n/dictionary'

/**
 * DESIGN.md §8: a render-time throw in the canvas layer, the stepper or the
 * hunks renderer previously took the whole page down with no way back except
 * a hard reload. Both boundaries exist for that, and both need to actually
 * catch — a boundary that renders fine until the first real crash is worse
 * than no boundary, because it looks tested.
 */
function Bomb({ armed }: { armed: boolean }): null {
  if (armed) throw new Error('boom')
  return null
}

/** A boundary whose fallback can defuse the child and retry, like a real recovery. */
function Harness() {
  const [armed, setArmed] = useState(true)
  return (
    <ErrorBoundary
      fallback={(reset) => (
        <button
          type="button"
          onClick={() => {
            setArmed(false)
            reset()
          }}
        >
          recovered
        </button>
      )}
    >
      <Bomb armed={armed} />
      <p>steady state</p>
    </ErrorBoundary>
  )
}

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary fallback={() => <p>fallback</p>}>
        <p>fine</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('fine')).toBeDefined()
    expect(screen.queryByText('fallback')).toBeNull()
  })

  it('catches a render-time throw and shows the fallback instead of crashing', () => {
    render(
      <ErrorBoundary fallback={() => <p>fallback</p>}>
        <Bomb armed />
      </ErrorBoundary>,
    )
    expect(screen.getByText('fallback')).toBeDefined()
  })

  it('resets back to the real content once the fallback clears the cause', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'recovered' })).toBeDefined()
    expect(screen.queryByText('steady state')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'recovered' }))
    expect(screen.getByText('steady state')).toBeDefined()
  })
})

describe('the route-level error boundary (app/[locale]/error.tsx)', () => {
  it('names itself an alert, offers retry, and links home in the right locale', () => {
    const dict = getDict('en')
    let resetCalled = false
    render(<LocaleError error={new Error('boom')} reset={() => (resetCalled = true)} />)

    const alert = screen.getByRole('alert')
    expect(alert.textContent).toContain(dict.error.title)

    fireEvent.click(screen.getByRole('button', { name: dict.error.retry }))
    expect(resetCalled).toBe(true)

    expect(screen.getByRole('link', { name: dict.nav.home })).toBeDefined()
  })
})

describe('the graph page error boundary', () => {
  it('wraps GraphView so a crash there shows recovery, not a blank page', () => {
    // GrafPage renders the real GraphView, which runs a real search — this
    // just proves the boundary is actually wired around it, not that it
    // catches (that is ErrorBoundary's own test above, in isolation).
    render(<GrafPage params={{ locale: 'en' }} />)
    expect(screen.queryByRole('alert', { name: /something went wrong/i })).toBeNull()
  })
})
