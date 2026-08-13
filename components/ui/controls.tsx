'use client'

import type { ReactNode, SelectHTMLAttributes } from 'react'

/**
 * The interactive primitives, in one place so hit areas and states cannot
 * drift. Everything here is at least 32px tall: the old controls were 12px
 * text in a 22px box, which is fine to look at and unpleasant to click.
 */

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-sans font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40'

const TONE = {
  primary: 'border border-indigo bg-indigo text-paper hover:bg-deepIndigo',
  secondary: 'border border-rule bg-paper text-deepIndigo hover:border-indigo/60 hover:bg-cotton',
  ghost: 'border border-transparent text-indigo hover:bg-indigo/8',
  /** Pressed / selected. madder is not used here: it means "the answer". */
  active: 'border border-indigo bg-indigo/10 text-deepIndigo',
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
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
      className={`h-9 rounded-lg border border-rule bg-paper px-2.5 font-sans text-fine text-deepIndigo hover:border-indigo/60 ${className}`}
    >
      {children}
    </select>
  )
}

/** A checkbox with its label as one clickable target, sized like the rest. */
export function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  children: ReactNode
}) {
  return (
    <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-rule bg-paper px-3 font-sans text-fine text-deepIndigo hover:border-indigo/60">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5 accent-indigo"
      />
      {children}
    </label>
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
        tone === 'accent' ? 'border-madder text-deepIndigo' : 'border-rule text-muted'
      }`}
    >
      {children}
    </p>
  )
}
