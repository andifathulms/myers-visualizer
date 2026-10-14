'use client'

import type { ReactNode, SelectHTMLAttributes } from 'react'

/**
 * The interactive primitives, in one place so hit areas and states cannot
 * drift. Everything here is at least 32px tall: the old controls were 12px
 * text in a 22px box, which is fine to look at and unpleasant to click.
 */

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-ctl font-sans font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40'

const TONE = {
  primary: 'border border-ink bg-ink text-surface hover:bg-indigo hover:border-indigo',
  secondary: 'border border-rule bg-surface text-ink hover:border-indigo/60 hover:bg-sunken',
  ghost: 'border border-transparent text-indigo hover:bg-sunken',
  /** Pressed / selected. madder is not used here: it means "the answer". */
  active: 'border border-ink bg-ink text-surface',
} as const

const SIZE = {
  sm: 'h-8 px-2.5 text-fine',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
} as const

export type ButtonTone = keyof typeof TONE
export type ButtonSize = keyof typeof SIZE

export function Button({
  onClick,
  tone = 'secondary',
  size = 'sm',
  label,
  title,
  pressed,
  disabled = false,
  className = '',
  children,
}: {
  onClick: () => void
  tone?: ButtonTone
  size?: ButtonSize
  /** Accessible name. Set it whenever the visible content is a glyph. */
  label?: string
  title?: string
  pressed?: boolean
  /** Native disabled — BASE already carries the disabled: styles. */
  disabled?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={title ?? label}
      className={`${BASE} ${SIZE[size]} ${TONE[tone]} ${className}`}
    >
      {children}
    </button>
  )
}

/**
 * A labelled control. The label sits above the input rather than beside it:
 * the toolbar used to be a single wrapping line of `label: [select]` pairs
 * that re-flowed into nonsense at every width.
 */
export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={htmlFor}
        className="font-sans text-micro font-semibold uppercase tracking-[0.07em] text-muted"
      >
        {label}
      </label>
      {children}
    </div>
  )
}

export function Select({
  className = '',
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={`h-9 rounded-ctl border border-rule bg-surface px-2.5 font-sans text-fine text-ink hover:border-indigo/60 ${className}`}
    >
      {children}
    </select>
  )
}

/**
 * A checkbox with its label as one clickable target, sized like the rest.
 *
 * `switch` draws the same native checkbox as a track and thumb, for an on/off
 * setting that changes what is drawn rather than a choice in a form. It stays
 * an `<input type="checkbox">` underneath, so it keeps its role, its name and
 * its keyboard behaviour — only the paint is different.
 */
export function Toggle({
  checked,
  onChange,
  variant = 'box',
  children,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  variant?: 'box' | 'switch'
  children: ReactNode
}) {
  if (variant === 'switch') {
    return (
      <label className="flex min-h-8 cursor-pointer items-center justify-between gap-3 font-sans text-fine text-ink">
        <span>{children}</span>
        <span className="relative inline-flex shrink-0 items-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
            className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-full"
          />
          <span
            aria-hidden
            className="h-5 w-9 rounded-full border border-rule bg-sunken transition-colors peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-madder"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-0.5 h-4 w-4 rounded-full bg-surface shadow-lift transition-transform peer-checked:translate-x-4"
          />
        </span>
      </label>
    )
  }
  return (
    <label className="flex h-9 cursor-pointer items-center gap-2 rounded-ctl border border-rule bg-surface px-3 font-sans text-fine text-ink hover:border-indigo/60">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5 accent-ink"
      />
      {children}
    </label>
  )
}

/**
 * One choice out of a few, with every option visible. A `<select>` hid the
 * four algorithms and three granularities behind a click, so nobody found
 * them; a row of segments shows the whole set at a glance.
 *
 * Built from native radio inputs, so arrow keys move between options and a
 * screen reader announces "radio, 2 of 4" without any script of ours. The
 * group carries the name; each option carries its own label.
 */
export function Segmented<T extends string>({
  name,
  label,
  value,
  options,
  onChange,
  hideLabel = false,
}: {
  /** The radio group's `name` — must be unique on the page. */
  name: string
  label: string
  value: T
  options: readonly { readonly value: T; readonly label: string }[]
  onChange: (value: T) => void
  /** Keep the name for assistive tech but drop the visible caption. */
  hideLabel?: boolean
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-1">
      <legend
        className={
          hideLabel
            ? 'sr-only'
            : 'mb-1 font-sans text-micro font-semibold uppercase tracking-[0.08em] text-muted'
        }
      >
        {label}
      </legend>
      <div className="inline-flex max-w-full flex-wrap gap-0.5 rounded-[7px] border border-rule bg-surface p-0.5">
        {options.map((option) => (
          <label key={option.value} className="relative">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className="flex h-8 cursor-pointer items-center whitespace-nowrap rounded-[5px] px-2.5 font-sans text-fine text-muted transition-colors hover:text-ink peer-checked:bg-ink peer-checked:font-medium peer-checked:text-surface peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-madder">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/**
 * A quiet aside — a fact worth stating, not an error. The rule down the left
 * carries the emphasis so the copy does not have to shout.
 */
export function Note({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'accent'
  children: ReactNode
}) {
  return (
    <p
      className={`measure border-l-2 pl-4 font-sans text-sm ${
        tone === 'accent' ? 'border-madder text-ink' : 'border-rule text-muted'
      }`}
    >
      {children}
    </p>
  )
}
