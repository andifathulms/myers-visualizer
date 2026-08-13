import type { ReactNode } from 'react'

/**
 * A card: one surface, one job, one heading. Everything in the tool used to
 * float on the same ground with nothing but whitespace between concerns,
 * which meant the eye had no idea where the inputs ended and the search
 * began. Grouping is the cheapest legibility there is.
 *
 * `hint` is the plain-language line under the heading — one sentence saying
 * what this panel is, for a reader who does not already know.
 */
export function Panel({
  title,
  hint,
  action,
  labelledBy,
  ariaLabel,
  padded = true,
  children,
}: {
  title?: ReactNode
  hint?: ReactNode
  action?: ReactNode
  /** Passed through when a test or a screen reader needs a stable name. */
  labelledBy?: string
  ariaLabel?: string
  padded?: boolean
  children: ReactNode
}) {
  return (
    <section
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      className={`card ${padded ? 'p-4 sm:p-5' : ''}`}
    >
      {title === undefined ? null : (
        <div
          className={`mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 ${
            padded ? '' : 'px-4 pt-4'
          }`}
        >
          <div>
            <h3 className="font-sans text-micro font-semibold uppercase tracking-[0.08em] text-muted">
              {title}
            </h3>
            {hint === undefined ? null : (
              <p className="mt-1 max-w-prose font-sans text-sm text-muted">
                {hint}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

/**
 * A numbered step heading. The tool is a sequence — put something in, watch
 * it run, read the result — and saying so out loud is most of what a first
 * visitor needs.
 */
export function StepHeading({
  step,
  title,
  hint,
  id,
}: {
  step: number
  title: string
  hint?: string
  id?: string
}) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <span
        aria-hidden
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-indigo/25 bg-paper font-mono text-fine tabular-nums text-indigo"
      >
        {step}
      </span>
      <div>
        <h2 id={id} className="font-serif text-h3 font-semibold">
          {title}
        </h2>
        {hint === undefined ? null : (
          <p className="mt-1 measure font-sans text-base text-muted">{hint}</p>
        )}
      </div>
    </div>
  )
}
