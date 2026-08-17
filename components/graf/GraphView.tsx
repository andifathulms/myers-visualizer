'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LatticeCanvas } from '@/components/lattice/LatticeCanvas'
import { buildMatchGrid, GHOST_PATH_CAP, type LatticeFrame } from '@/components/lattice/frame'
import { VStrip } from '@/components/vstrip/VStrip'
import { Stepper } from '@/components/stepper/Stepper'
import { Hunks } from '@/components/hunks/Hunks'
import { InputPanes } from '@/components/input/InputPanes'
import { Legend } from '@/components/chrome/Legend'
import { Panel, StepHeading } from '@/components/ui/Panel'
import { StatBar } from '@/components/chrome/StatBar'
import { useDiff } from '@/lib/client/useDiff'
import { useDiffInputs } from '@/lib/client/useDiffInputs'
import { usePlayback } from '@/lib/client/usePlayback'
import {
  buildTimeline,
  FrontierCursor,
  levelAt,
  middleSnakeAt,
  nextLevelFrame,
  regionAt,
  settledSnakesAt,
  stampAt as stampOf,
  nextSnakeFrame,
  pathAt,
  previousLevelFrame,
} from '@/lib/player/timeline'
import { AmbiguityPanel } from '@/components/ambiguity/AmbiguityPanel'
import { buildHunks } from '@/lib/hunks'
import { pathOf } from '@/lib/diff/backtrack'
import {
  analyseAmbiguity,
  contestedEdges,
  COUNT_CAP,
  minimalScripts,
  sharesOfScript,
} from '@/lib/diff/ambiguity'
import { tiedAt } from '@/lib/diff/trace'
import { StepReadout } from '@/components/stepper/StepReadout'
import { VIEWABLE_CAP } from '@/layout/lattice'
import { format, type Dict } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/i18n/locales'

/** How many alternative minimal scripts to offer. More than a handful is noise. */
const ALTERNATIVES = 6

export function GraphView({ locale, dict }: { locale: Locale; dict: Dict }) {
  const inputs = useDiffInputs()
  const { a, b } = inputs.tokenized
  const { algorithm, setAlgorithm } = inputs
  const state = useDiff(a.tokens, b.tokens, algorithm)

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

  const { playing, speed, setSpeed, toggle, stop, reducedMotion } = usePlayback(
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
  const frontiers = useMemo(() => {
    if (timeline === null) return { forward: [], backward: [] }
    if (cursorTimeline.current !== timeline) {
      cursorRef.current = new FrontierCursor(timeline)
      cursorTimeline.current = timeline
    }
    const cursor = cursorRef.current
    if (cursor === null) return { forward: [], backward: [] }
    cursor.seek(frame)
    return { forward: cursor.points(), backward: cursor.backwardPoints() }
  }, [timeline, frame])
  const vPoints = frontiers.forward

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
   * Every other minimal path, for the lattice overlay — independent of
   * which one `AmbiguityPanel` currently shows solid. Above `GHOST_PATH_CAP`
   * the polylines would be an unreadable mesh, so none are drawn and the
   * contested region carries the fact instead. DESIGN.md §4.1, §4.4.
   */
  const ghostScripts = useMemo(
    () =>
      tooLarge || ambiguity.count <= 1 ? [] : minimalScripts(a.tokens, b.tokens, GHOST_PATH_CAP + 1),
    [a.tokens, b.tokens, ambiguity.count, tooLarge],
  )
  const ghostPathsCapped = ghostScripts.length > GHOST_PATH_CAP
  const ghostPaths = useMemo(
    () => (ghostPathsCapped ? [] : ghostScripts.map(pathOf)),
    [ghostScripts, ghostPathsCapped],
  )

  /**
   * Cells some minimal paths take and others do not. A DP over the whole
   * graph, so its cost does not depend on how many scripts actually exist —
   * unlike `ghostScripts`, it stays exact and cheap even when the count is
   * astronomical. Null when the true count is past COUNT_CAP. DESIGN.md §4.1.
   */
  const contestedRegion = useMemo(
    () => (tooLarge || ambiguity.count <= 1 ? [] : contestedEdges(a.tokens, b.tokens)),
    [a.tokens, b.tokens, ambiguity.count, tooLarge],
  )

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

  /**
   * How many of the minimal scripts agree with each line of the one on screen.
   * Computed for whichever script is shown, so switching to an alternative
   * re-reads the shares rather than keeping the first script's. §6.4
   */
  const shares = useMemo(
    () => (shownScript === null ? null : sharesOfScript(a.tokens, b.tokens, shownScript)),
    [a.tokens, b.tokens, shownScript],
  )
  const contestedLines = useMemo(
    () => (shares === null ? 0 : shares.filter((share) => !share.forced).length),
    [shares],
  )

  const matches = useMemo(
    () => (tooLarge ? null : buildMatchGrid(a.tokens, b.tokens)),
    [a.tokens, b.tokens, tooLarge],
  )

  /** Only the Myers family maintains a V array; the others anchor and recurse. */
  const maintainsV = algorithm === 'myers' || algorithm === 'myers-linear'
  const currentD = timeline === null ? 0 : levelAt(timeline, frame)
  const currentStep = timeline?.steps[Math.min(frame, timeline.searchFrames - 1)] ?? null

  /**
   * Past the last search frame the player is drawing the recovered path
   * backwards from (N,M). That is a second phase, not more searching, and the
   * readout says so rather than continuing to describe a step that finished
   * several frames ago.
   */
  const backtrack = useMemo(() => {
    if (timeline === null || frame <= timeline.searchFrames) return null
    const points = timeline.path.length
    const drawn = Math.min(frame - timeline.searchFrames, points)
    // The path is walked from the end, so the point reached is counted back
    // from (N,M) — the same slice pathAt draws.
    const at = timeline.path[Math.max(0, points - drawn)] ?? { x: n, y: m }
    // Moves, not points: a seven-point path is six moves, and it is the moves
    // that become diff lines. Counting points here said "7 of 7 recovered"
    // for a six-operation script.
    return { done: Math.max(0, drawn - 1), total: Math.max(0, points - 1), x: at.x, y: at.y }
  }, [timeline, frame, n, m])

  /**
   * Was the step under the cursor decided by a tie? Read back out of the
   * recorded V rather than stored in the trace. Greedy Myers only — the
   * linear-space variant's predecessors come from two frontiers meeting, not
   * from one recorded history.
   */
  const tieReadable = algorithm === 'myers' && state.status === 'done'
  const stepTied = useMemo(() => {
    if (!tieReadable || currentStep === null || state.status !== 'done') return false
    const snapshots = state.trace.snapshots
    if (snapshots === null) return false
    return tiedAt(snapshots, currentD, currentStep.k, n, m)
  }, [tieReadable, currentStep, state, currentD, n, m])

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

  const primaryPath = useMemo(
    () => selectedPath ?? altPath ?? (timeline === null ? null : pathAt(timeline, frame)),
    [selectedPath, altPath, timeline, frame],
  )

  // Ghosts and the contested tint are both facts about the answer, so they
  // stay off the canvas until backtrack has actually produced one — the
  // same rule that keeps madder off screen until then. §4.5
  const latticeFrame = useMemo<LatticeFrame>(
    () => ({
      frontier: vPoints,
      snakes:
        currentStep === null || currentStep.snake === null || frame === 0 ? [] : [currentStep.snake],
      backwardFrontier: frontiers.backward.length === 0 ? null : frontiers.backward,
      path: primaryPath,
      // madder is reserved for the answer, and a middle snake is one: it is
      // the point both frontiers agreed on. §6.6
      middleSnake: timeline === null ? null : middleSnakeAt(timeline, frame),
      settledSnakes: timeline === null ? [] : settledSnakesAt(timeline, frame),
      region: timeline === null ? null : regionAt(timeline, frame),
      highlightK,
      ghostPaths: primaryPath === null ? [] : ghostPaths,
      ghostPathsCapped: primaryPath === null ? false : ghostPathsCapped,
      contestedEdges: primaryPath === null ? null : contestedRegion,
    }),
    [
      vPoints,
      frontiers.backward,
      currentStep,
      frame,
      timeline,
      highlightK,
      primaryPath,
      ghostPaths,
      ghostPathsCapped,
      contestedRegion,
    ],
  )

  const tag = locale === 'id' ? 'id-ID' : 'en-GB'
  /**
   * The canvas is opaque to a screen reader, so its label states the same
   * fact the overlay draws: how many minimal paths exist and how many of
   * them are actually shown. Silent before there is an answer to describe.
   * DESIGN.md §4.5.
   */
  const graphLabel = useMemo(() => {
    const base = dict.a11y.graphLabel
    if (primaryPath === null) return base
    if (ambiguity.count <= 1) return `${base} ${dict.a11y.graphLabelSingle}`
    const countLabel = ambiguity.truncated
      ? `≥ ${COUNT_CAP.toLocaleString(tag)}`
      : ambiguity.count.toLocaleString(tag)
    if (ghostPathsCapped) {
      return `${base} ${format(dict.a11y.graphLabelCapped, { count: countLabel, cap: GHOST_PATH_CAP })}`
    }
    return `${base} ${format(dict.a11y.graphLabelMany, { count: countLabel, shown: ghostPaths.length })}`
  }, [dict, primaryPath, ambiguity, ghostPathsCapped, ghostPaths.length, tag])

  // The canvas is told how far along it is and how to fetch each stamp, rather
  // than handed a freshly built prefix every frame.
  const stampAt = useCallback(
    (index: number) => (timeline === null ? { snakes: [], frontier: [] } : stampOf(timeline, index)),
    [timeline],
  )

  const hunks = useMemo(() => {
    if (shownScript === null) return []
    return buildHunks(shownScript, a.texts, b.texts)
  }, [shownScript, a.texts, b.texts])

  const t = dict.graph

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
      <header className="max-w-3xl">
        <h1 className="font-serif text-h1 font-semibold">{t.title}</h1>
        <p className="measure mt-3 font-sans text-lg text-indigo">{t.lede}</p>
      </header>

      {/*
        The page is a sequence — put something in, watch it run, read the
        result — and the headings say so. A first visitor arriving straight
        here from a shared link has no other clue what order to read it in.
      */}
      <section className="mt-10">
        <StepHeading step={1} title={t.stepInput} hint={t.stepInputHint} />
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
          shareUrl={inputs.shareUrl}
          algorithm={algorithm}
          onAlgorithm={setAlgorithm}
        />
      </section>

      {state.status === 'error' ? (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-madder/40 bg-madder/10 p-4 font-sans text-sm text-madder"
        >
          {state.message}
        </p>
      ) : null}

      <section className="mt-12">
        <StepHeading step={2} title={t.stepWatch} hint={t.stepWatchHint} />

        {/*
          Two columns from lg; on a phone the same content is one column and
          the order matters. The legend is a full card of four rows, and left
          in source order it sat between the player and the first number — so
          reading D on a 390px screen meant scrolling past the whole player
          and the legend, and then scrolling again to reach the result. The
          aside moves up and the legend goes last, where a reference belongs.
        */}
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
          <div className="flex flex-col gap-4 lg:col-start-1 lg:row-start-1">
            {tooLarge ? (
              // An unreadable graph is not a visualisation. Say so, and show the
              // result instead. §6.1
              <p className="rounded-xl border border-dashed border-indigo/40 bg-paper p-5 font-sans text-sm text-indigo">
                {format(dict.input.tooLarge, { n, m, cap: VIEWABLE_CAP })}
              </p>
            ) : (
              <Panel title={t.canvas} hint={t.canvasHint} padded={false}>
                {/*
                  The lattice is not self-describing: which axis is the old
                  text and which is the new is exactly the thing a newcomer
                  cannot guess, and getting it backwards makes the whole
                  picture read wrong.
                */}
                {/*
                  Capped, and centred rather than stretched. The lattice is
                  square, so a full-width column turns a five-line input into
                  an 800px void that pushes the controls below the fold.
                */}
                <div className="mx-auto w-full max-w-[38rem] px-4 pb-4">
                  <p className="pb-1 font-mono text-micro text-muted">{t.axisA}</p>
                  <div className="flex gap-2">
                    <div className="flex items-center" aria-hidden>
                      <p className="font-mono text-micro text-muted [writing-mode:vertical-rl]">
                        {t.axisB}
                      </p>
                    </div>
                    <div className="aspect-square w-full rounded-lg border border-rule bg-cotton/40">
                      <LatticeCanvas
                        n={n}
                        m={m}
                        matches={matches}
                        frame={latticeFrame}
                        stampAt={stampAt}
                        stampCount={Math.min(frame, timeline?.searchFrames ?? 0)}
                        label={graphLabel}
                      />
                    </div>
                  </div>
                  {/*
                    At frame 0 the lattice is an empty grid with a couple of
                    grey diagonals on it — less than the still figure in the
                    hero promises. Say that it is waiting rather than leaving
                    the reader to wonder whether it broke.
                  */}
                  {frame === 0 ? (
                    <p className="mt-3 font-sans text-fine text-muted">{t.idleCanvas}</p>
                  ) : null}
                </div>
              </Panel>
            )}

            {/*
              The canvas cannot be read, so every step is also announced. Polite,
              because stepping is user-driven and should not interrupt.
            */}
            <p aria-live="polite" className="sr-only">
              {currentStep === null || timeline === null
                ? ''
                : format(dict.a11y.stepAnnouncement, {
                    d: currentD,
                    maxD: timeline.d,
                    k: currentStep.k,
                    x: currentStep.to.x,
                    y: currentStep.to.y,
                  })}
            </p>

            {timeline !== null && currentStep !== null ? (
              <StepReadout
                dict={dict}
                d={currentD}
                k={currentStep.k}
                move={currentStep.move}
                tied={stepTied}
                available={tieReadable}
                backtrack={backtrack}
              />
            ) : null}

            {timeline !== null ? (
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
                reducedMotion={reducedMotion}
              />
            ) : null}
          </div>

          <aside className="flex flex-col gap-5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <StatBar
              dict={dict}
              d={state.status === 'done' ? state.stats.d : 0}
              currentD={currentD}
              n={n}
              m={m}
              snakes={state.status === 'done' ? state.stats.snakes : 0}
              steps={timeline?.searchFrames ?? 0}
              vCells={state.status === 'done' ? state.stats.vCells : 0}
              naiveVCells={
                // Only meaningful for the variant that avoids the recording.
                algorithm === 'myers-linear' && state.status === 'done'
                  ? (state.stats.d + 2) ** 2
                  : null
              }
              memoryWhy={
                // Greedy Myers records one row per level and nothing else, so
                // the identity holds exactly. The linear-space variant does
                // not record that way and the same sentence would be false.
                algorithm === 'myers' && state.status === 'done'
                  ? format(t.memoryWhy, {
                      side: state.stats.d + 2,
                      cells: state.stats.vCells,
                    })
                  : null
              }
            />
            {maintainsV ? (
              <VStrip
                cells={vPoints}
                currentD={currentD}
                highlightK={highlightK}
                onHighlight={setHighlightK}
                label={t.vstrip}
                hint={t.vstripHint}
                idle={t.idleVStrip}
                groupLabel={t.vstripGroup}
              />
            ) : (
              // Showing a V strip for an algorithm that has no V would be a lie
              // dressed as a visualisation.
              <Panel title={t.vstrip}>
                <p className="font-sans text-fine text-muted">{t.noVStrip}</p>
              </Panel>
            )}
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
          </aside>

          {/* A reference, so it comes after the numbers on a narrow screen. */}
          <Panel title={dict.legend.title}>
            <Legend dict={dict} />
          </Panel>
        </div>
      </section>

      <section className="mt-12">
        <StepHeading step={3} title={t.stepResult} hint={t.stepResultHint} />
        <div className="max-w-4xl">
          {/*
            Said once, above the diff, and only when there is something to say.
            A per-line number nobody has been told how to read is worse than
            no number, and on an unambiguous input there is nothing to explain.
          */}
          {shares !== null && hunks.length > 0 ? (
            <p className="mb-3 measure font-sans text-sm text-muted">
              {contestedLines > 0 ? t.contested : t.contestedNone}
            </p>
          ) : null}
          <Hunks
            hunks={hunks}
            selectedOp={selectedOp}
            onSelectOp={setSelectedOp}
            emptyLabel={locale === 'id' ? 'Tidak ada perbedaan.' : 'No differences.'}
            shares={shares}
            totalScripts={ambiguity.count}
            shareLabel={t.contestedShare}
            labels={{
              label: t.lineLabel,
              kept: t.lineKept,
              deleted: t.lineDeleted,
              inserted: t.lineInserted,
              share: t.lineShare,
            }}
            scrollLabel={t.outputScroll}
          />
        </div>
      </section>
    </main>
  )
}
