'use client'

import { useEffect, useRef } from 'react'
import type { Dict } from '@/lib/i18n/dictionary'

/**
 * Play, pause, step, step back, jump to next d, jump to next snake, scrub,
 * speed. §6.7 — step-back is free because the search is recorded, not re-run.
 *
 * prefers-reduced-motion disables autoplay and keeps stepping instantaneous,
 * so the controls stay usable without the animation. PRD §9.
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
}: Props) {
  const t = dict.stepper
  const scrubRef = useRef<HTMLInputElement>(null)

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
    <div className="flex flex-wrap items-center gap-2 font-sans text-xs">
      <Button onClick={() => onSeek(0)} label={t.reset}>
        ⏮
      </Button>
      <Button onClick={() => onSeek(frame - 1)} label={t.stepBack}>
        ◀
      </Button>
      <Button onClick={onPlayToggle} label={playing ? t.pause : t.play} primary>
        {playing ? '❚❚' : '▶'}
      </Button>
      <Button onClick={() => onSeek(frame + 1)} label={t.step}>
        ▶
      </Button>
      <Button onClick={() => onSeek(total)} label={t.end}>
        ⏭
      </Button>
      <Button onClick={onNextLevel} label={t.nextD}>
        d+
      </Button>
      <Button onClick={onNextSnake} label={t.nextSnake}>
        snake
      </Button>

      <input
        ref={scrubRef}
        type="range"
        min={0}
        max={Math.max(1, total)}
        value={frame}
        aria-label={t.step}
        onChange={(event) => onSeek(Number(event.target.value))}
        className="ml-2 h-1 min-w-[8rem] flex-1 accent-madder"
      />
      <span className="font-mono tabular-nums text-indigo">
        {frame}/{total}
      </span>

      <label className="ml-2 flex items-center gap-1">
        <span className="text-indigo">{t.speed}</span>
        <select
          value={speed}
          onChange={(event) => onSpeed(Number(event.target.value))}
          className="rounded border border-indigo/30 bg-cotton px-1 py-0.5 font-mono"
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

function Button({
  onClick,
  label,
  children,
  primary = false,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={[
        'rounded border px-2 py-1 font-mono leading-none',
        primary
          ? 'border-indigo bg-indigo text-cotton hover:bg-deepIndigo'
          : 'border-indigo/30 hover:border-indigo',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
