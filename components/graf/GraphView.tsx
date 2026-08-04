'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LatticeCanvas } from '@/components/lattice/LatticeCanvas'
import { buildMatchGrid, type LatticeFrame } from '@/components/lattice/frame'
import { VStrip } from '@/components/vstrip/VStrip'
import { Stepper } from '@/components/stepper/Stepper'
import { Hunks } from '@/components/hunks/Hunks'
import { InputPanes } from '@/components/input/InputPanes'
import { Legend } from '@/components/chrome/Legend'
import { StatBar } from '@/components/chrome/StatBar'
import { useDiff } from '@/lib/client/useDiff'
import { useDiffInputs } from '@/lib/client/useDiffInputs'
import { usePlayback } from '@/lib/client/usePlayback'
import {
  buildTimeline,
  FrontierCursor,
  levelAt,
  nextLevelFrame,
  nextSnakeFrame,
  pathAt,
  previousLevelFrame,
} from '@/lib/player/timeline'
import { AmbiguityPanel } from '@/components/ambiguity/AmbiguityPanel'
import { buildHunks } from '@/lib/hunks'
import { pathOf } from '@/lib/diff/backtrack'
import { analyseAmbiguity, minimalScripts } from '@/lib/diff/ambiguity'
import { VIEWABLE_CAP } from '@/layout/lattice'
import { format, type Dict } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/i18n/locales'

/** How many alternative minimal scripts to offer. More than a handful is noise. */
const ALTERNATIVES = 6

export function GraphView({ locale, dict }: { locale: Locale; dict: Dict }) {
  const inputs = useDiffInputs()
  const { a, b } = inputs.tokenized
  const state = useDiff(a.tokens, b.tokens, 'myers')

  const [frame, setFrame] = useState(0)
  const [highlightK, setHighlightK] = useState<number | null>(null)
  const [selectedOp, setSelectedOp] = useState<number | null>(null)
  /** 0 is the script Myers actually chose; the rest are equally minimal. §6.4 */
  const [altIndex, setAltIndex] = useState(0)

  const timeline = useMemo(() => {
    if (state.status !== 'done') return null
    return buildTimeline(state.trace, state.script)
  }, [state])

  // A new search starts from the beginning, and nothing from the old one shows.
  useEffect(() => {
    setFrame(0)
    setSelectedOp(null)
  }, [timeline])

  const { playing, speed, setSpeed, toggle, stop } = usePlayback(
    timeline?.totalFrames ?? 0,
    setFrame,
  )

  const seek = useCallback(
    (next: number) => {
      const total = timeline?.totalFrames ?? 0
      setFrame(Math.max(0, Math.min(next, total)))
      if (next >= total) stop()
    },
    [timeline, stop],
  )

  // V replayed to this frame. Forward is O(1) per step; a backward seek
  // rebuilds — the same trade the canvas's explored layer makes.
  const cursorRef = useRef<FrontierCursor | null>(null)
  const cursorTimeline = useRef<typeof timeline>(null)
  const vPoints = useMemo(() => {
    if (timeline === null) return []
    if (cursorTimeline.current !== timeline) {
      cursorRef.current = new FrontierCursor(timeline)
      cursorTimeline.current = timeline
    }
    const cursor = cursorRef.current
    if (cursor === null) return []
    cursor.seek(frame)
    return cursor.points()
  }, [timeline, frame])

  const n = a.tokens.length
  const m = b.tokens.length
  const tooLarge = n > VIEWABLE_CAP || m > VIEWABLE_CAP

  // How many equally-minimal scripts exist, and what do the alternatives look
  // like? Computed by DP over the edit graph, independently of the search.
  const ambiguity = useMemo(() => analyseAmbiguity(a.tokens, b.tokens), [a.tokens, b.tokens])
  const alternatives = useMemo(
    () => (ambiguity.count > 1 ? minimalScripts(a.tokens, b.tokens, ALTERNATIVES) : []),
    [a.tokens, b.tokens, ambiguity.count],
  )
  useEffect(() => setAltIndex(0), [alternatives])

  /**
   * The script on screen. Index 0 is what Myers chose; picking another shows
   * a different, equally minimal attribution of the same change — which is
   * the misattributed-brace lesson, made concrete.
   */
  const shownScript = useMemo(() => {
    if (state.status !== 'done') return null
    if (altIndex === 0 || alternatives.length === 0) return state.script
    return alternatives[Math.min(altIndex, alternatives.length - 1)] ?? state.script
  }, [state, altIndex, alternatives])

  const matches = useMemo(
    () => (tooLarge ? null : buildMatchGrid(a.tokens, b.tokens)),
    [a.tokens, b.tokens, tooLarge],
  )

  const currentD = timeline === null ? 0 : levelAt(timeline, frame)
  const currentStep = timeline?.steps[Math.min(frame, timeline.searchFrames - 1)] ?? null

  // Clicking a diff line highlights the move that produced it. §6.3
  const selectedPath = useMemo(() => {
    if (shownScript === null || selectedOp === null) return null
    const walked = pathOf(shownScript.slice(0, selectedOp + 1))
    return walked.slice(walked.length - 2)
  }, [shownScript, selectedOp])

  /** An alternative is shown whole, not animated: it was never searched for. */
  const altPath = useMemo(() => {
    if (altIndex === 0 || shownScript === null) return null
    return pathOf(shownScript)
  }, [altIndex, shownScript])

  const latticeFrame = useMemo<LatticeFrame>(
    () => ({
      frontier: vPoints,
      snakes:
        currentStep === null || currentStep.snake === null || frame === 0 ? [] : [currentStep.snake],
      backwardFrontier: null,
      path: selectedPath ?? altPath ?? (timeline === null ? null : pathAt(timeline, frame)),
      middleSnake: null,
      highlightK,
    }),
    [vPoints, currentStep, frame, timeline, highlightK, selectedPath, altPath],
  )

  const stamps = useMemo(() => timeline?.stamps ?? [], [timeline])
  const visibleStamps = useMemo(
    () => stamps.slice(0, Math.min(frame, stamps.length)),
    [stamps, frame],
  )

  const hunks = useMemo(() => {
    if (shownScript === null) return []
    return buildHunks(shownScript, a.texts, b.texts)
  }, [shownScript, a.texts, b.texts])

  const t = dict.graph

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <h1 className="font-serif text-3xl font-semibold">{t.title}</h1>
      <p className="mt-2 max-w-2xl font-sans text-sm text-indigo">{t.lede}</p>

      <div className="mt-6">
        <InputPanes
          locale={locale}
          dict={dict}
          aText={inputs.aText}
          bText={inputs.bText}
          granularity={inputs.granularity}
          ignoreWhitespace={inputs.ignoreWhitespace}
          onA={inputs.setA}
          onB={inputs.setB}
          onGranularity={inputs.setGranularity}
          onIgnoreWhitespace={inputs.setIgnoreWhitespace}
          onSwap={inputs.swap}
          onPreset={inputs.loadPreset}
          presetId={inputs.presetId}
        />
      </div>

      {state.status === 'error' ? (
        <p className="mt-6 rounded border border-madder bg-madder/10 p-3 font-sans text-sm text-madder">
          {state.message}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          {tooLarge ? (
            // An unreadable graph is not a visualisation. Say so, and show the
            // result instead. §6.1
            <p className="rounded border border-indigo/30 bg-indigo/5 p-4 font-sans text-sm text-indigo">
              {format(dict.input.tooLarge, { n, m, cap: VIEWABLE_CAP })}
            </p>
          ) : (
            <div className="aspect-square w-full rounded border border-indigo/20 bg-cotton">
              <LatticeCanvas
                n={n}
                m={m}
                matches={matches}
                frame={latticeFrame}
                stamps={visibleStamps}
              />
            </div>
          )}

          {timeline !== null ? (
            <div className="mt-3">
              <Stepper
                frame={frame}
                total={timeline.totalFrames}
                playing={playing}
                speed={speed}
                dict={dict}
                onSeek={seek}
                onPlayToggle={toggle}
                onNextLevel={() => seek(nextLevelFrame(timeline, frame))}
                onPreviousLevel={() => seek(previousLevelFrame(timeline, frame))}
                onNextSnake={() => seek(nextSnakeFrame(timeline, frame))}
                onSpeed={setSpeed}
              />
            </div>
          ) : null}

          <div className="mt-4">
            <Legend dict={dict} />
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <StatBar
            dict={dict}
            d={state.status === 'done' ? state.stats.d : 0}
            currentD={currentD}
            n={n}
            m={m}
            snakes={state.status === 'done' ? state.stats.snakes : 0}
            steps={timeline?.searchFrames ?? 0}
            vCells={state.status === 'done' ? state.stats.vCells : 0}
          />
          <AmbiguityPanel
            locale={locale}
            dict={dict}
            ambiguity={ambiguity}
            alternatives={alternatives.length}
            selected={altIndex}
            onSelect={(index) => {
              setAltIndex(index)
              setSelectedOp(null)
              seek(timeline?.totalFrames ?? 0)
            }}
          />
          <VStrip
            cells={vPoints}
            currentD={currentD}
            highlightK={highlightK}
            onHighlight={setHighlightK}
            label={t.vstrip}
            hint={t.vstripHint}
          />
        </aside>
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-xl font-semibold">{t.output}</h2>
        <div className="mt-3">
          <Hunks
            hunks={hunks}
            selectedOp={selectedOp}
            onSelectOp={setSelectedOp}
            emptyLabel={locale === 'id' ? 'Tidak ada perbedaan.' : 'No differences.'}
          />
        </div>
      </section>
    </main>
  )
}
