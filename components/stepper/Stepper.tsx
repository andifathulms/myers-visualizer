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
}: Props) {
  const t = dict.stepper

  // Keyboard stepping: the whole point is being able to move one step at a time.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target !== null && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return
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

  return (
    <div className="rounded-xl border border-rule bg-paper p-3">
      <div className="flex flex-wrap items-center gap-1.5">
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
          size="md"
          disabled={reducedMotion}
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

        <span aria-hidden className="mx-1.5 h-6 w-px bg-rule" />

        <Button onClick={onNextLevel} label={t.nextD}>
          <span className="font-mono">d+</span>
        </Button>
        <Button onClick={onNextSnake} label={t.nextSnake}>
          <span className="font-mono">snake</span>
        </Button>

        <div className="ml-auto flex items-center gap-2">
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

      <div className="mt-3 flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={Math.max(1, total)}
          value={frame}
          aria-label={t.progress}
          onChange={(event) => onSeek(Number(event.target.value))}
          className="h-1.5 flex-1 accent-madder"
        />
        <span className="font-mono text-fine tabular-nums text-muted">
          {frame}/{total}
        </span>
      </div>

      <p className="mt-2 font-sans text-fine text-muted">
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
