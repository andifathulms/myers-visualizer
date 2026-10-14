'use client'

import { useEffect } from 'react'
import { Button, Select } from '@/components/ui/controls'
import type { Dict } from '@/lib/i18n/dictionary'

/**
 * Play, pause, step, step back, jump to next d, jump to next snake, scrub,
 * speed. §6.7 — step-back is free because the search is recorded, not re-run.
 *
 * prefers-reduced-motion disables autoplay and keeps stepping instantaneous,
 * so the controls stay usable without the animation. PRD §9.
 *
 * Play is the only filled control on the page: for a first visitor it is the
 * single thing worth pressing, and it should be obvious which one it is. The
 * two jump controls are separated from transport by a rule, because they move
 * by a different unit — a d, a snake — rather than by a frame.
 */
type Props = {
  frame: number
  total: number
  playing: boolean
  speed: number
  dict: Dict
  onSeek: (frame: number) => void
  onPlayToggle: () => void
  onNextLevel: () => void
  onPreviousLevel: () => void
  onNextSnake: () => void
  onSpeed: (speed: number) => void
  /** Autoplay is off under prefers-reduced-motion; the controls say so. */
  reducedMotion: boolean
  /**
   * Where each d begins on the scrubber, plus where the backtrack starts.
   * The ticks show the search's own rhythm — levels get longer as d grows —
   * which a featureless track hid.
   */
  ticks?: readonly { readonly at: number; readonly label: string }[]
}

const SPEEDS = [0.5, 1, 2, 4, 16]

export function Stepper({
  frame,
  total,
  playing,
  speed,
  dict,
  onSeek,
  onPlayToggle,
  onNextLevel,
  onPreviousLevel,
  onNextSnake,
  onSpeed,
  reducedMotion,
  ticks = [],
}: Props) {
  const t = dict.stepper

  /*
   * Keyboard stepping: the whole point is being able to move one step at a
   * time. It listens on the window, so it has to stand down wherever the key
   * already means something — a form field, a select, and any pane the user
   * is scrolling with the arrows, which is how the diff is read at 320px.
   * Stealing ArrowRight there leaves the overflowing half unreachable.
   */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target !== null && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (target !== null && target.scrollWidth > target.clientWidth) return
      switch (event.key) {
        case ' ':
          event.preventDefault()
          onPlayToggle()
          break
        case 'ArrowRight':
          onSeek(frame + 1)
          break
        case 'ArrowLeft':
          onSeek(frame - 1)
          break
        case 'ArrowUp':
          onNextLevel()
          break
        case 'ArrowDown':
          onPreviousLevel()
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [frame, onSeek, onPlayToggle, onNextLevel, onPreviousLevel])

  const span = Math.max(1, total)
  // A label only where it has room: two levels a frame apart would print
  // "d0d1" on top of each other. The tick itself is always drawn.
  const MIN_GAP = 0.07
  const labelled: boolean[] = []
  let lastLabelled = -Infinity
  for (const tick of ticks) {
    const room = tick.at / span - lastLabelled >= MIN_GAP
    labelled.push(room)
    if (room) lastLabelled = tick.at / span
  }

  return (
    <div className="card p-3 sm:px-4">
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 sm:gap-x-1.5 sm:gap-y-3">
        <Button onClick={() => onSeek(0)} label={t.reset}>
          <Glyph>⏮</Glyph>
        </Button>
        <Button onClick={() => onSeek(frame - 1)} label={t.stepBack}>
          <Glyph>◀</Glyph>
        </Button>
        {/*
          Under prefers-reduced-motion the hook refuses to start the clock, so
          the button did nothing at all while still reporting itself as
          available — press it and the frame stayed at 0, with no explanation.
          Disabled is the honest state, and the reason is printed below with
          the keyboard hints where the working controls are described.
        */}
        <Button
          onClick={onPlayToggle}
          label={playing ? t.pause : t.play}
          tone="primary"
          size="lg"
          disabled={reducedMotion}
          className="!h-11 !w-11 !rounded-full !px-0"
        >
          <span aria-hidden className="text-base leading-none">
            {playing ? '❚❚' : '▶'}
          </span>
        </Button>
        <Button onClick={() => onSeek(frame + 1)} label={t.step}>
          <Glyph>▶</Glyph>
        </Button>
        <Button onClick={() => onSeek(total)} label={t.end}>
          <Glyph>⏭</Glyph>
        </Button>

        <span aria-hidden className="mx-1.5 hidden h-6 w-px bg-rule sm:block" />

        <Button onClick={onNextLevel} label={t.nextD}>
          <span className="font-mono">d+</span>
        </Button>
        <Button onClick={onNextSnake} label={t.nextSnake}>
          <span className="font-mono">snake</span>
        </Button>

        <div className="order-last flex w-full min-w-[12rem] items-center gap-3 lg:order-none lg:ml-3 lg:w-auto lg:flex-1">
          <div className="relative flex-1 pt-3.5">
            {/* Decorative: the range input carries the value and its name. */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full">
              {ticks.map((tick, index) => (
                <span
                  key={index}
                  className="absolute top-3 h-4 w-px bg-rule"
                  style={{ left: `${(tick.at / span) * 100}%` }}
                >
                  {labelled[index] ? (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 font-mono text-micro text-muted">
                      {tick.label}
                    </span>
                  ) : null}
                </span>
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={span}
              value={frame}
              aria-label={t.progress}
              onChange={(event) => onSeek(Number(event.target.value))}
              className="relative h-1.5 w-full cursor-pointer accent-ink"
            />
          </div>
          <span className="font-mono text-fine tabular-nums text-muted">
            {frame}/{total}
          </span>
        </div>

        {/* Speed is a refinement; on a phone the dock keeps to transport and scrubber. */}
        <div className="ml-auto hidden items-center gap-2 sm:flex lg:ml-2">
          <label htmlFor="speed" className="font-sans text-fine text-muted">
            {t.speed}
          </label>
          <Select id="speed" value={speed} onChange={(event) => onSpeed(Number(event.target.value))}>
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/*
        The keyboard hint is for keyboards; on a phone, where the transport
        is docked to the bottom edge, it only made the dock taller. The
        reduced-motion explanation is never hidden: it says why Play is off.
      */}
      <p className={`mt-2 font-sans text-fine text-muted ${reducedMotion ? '' : 'hidden sm:block'}`}>
        {reducedMotion ? `${t.reducedMotion} ${t.keys}` : t.keys}
      </p>
    </div>
  )
}

function Glyph({ children }: { children: string }) {
  return (
    <span aria-hidden className="text-fine leading-none">
      {children}
    </span>
  )
}
