'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LatticeCanvas } from '@/components/lattice/LatticeCanvas'
import { buildMatchGrid, GHOST_PATH_CAP, type LatticeFrame } from '@/components/lattice/frame'
import { VStrip } from '@/components/vstrip/VStrip'
import { Stepper } from '@/components/stepper/Stepper'
import { Hunks } from '@/components/hunks/Hunks'
import { InputPanes } from '@/components/input/InputPanes'
import { Legend } from '@/components/chrome/Legend'
import { Panel } from '@/components/ui/Panel'
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
import { edgeOfOp, pathEdgeMap, pointKey } from '@/lib/player/hoverLink'
import type { Point } from '@/layout/lattice'
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
  /**
   * The contested op currently under the pointer or focus, from either
   * direction: a hovered/focused `Hunks` line, or a hovered lattice vertex
   * that touches it. One shared piece of state is what makes the link
   * symmetric without the two sides re-triggering each other. DESIGN.md §4.2.
   */
  const [hoveredOp, setHoveredOp] = useState<number | null>(null)
  /** Default is show — the claim is the product, not opt-in. DESIGN.md §4.3. */
  const [showAlternatives, setShowAlternatives] = useState(true)

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

  /**
   * The shown script's own path, independent of animation frame — Hunks
   * already renders the full script as soon as it exists, so the hover
   * link has to reach every line, not just the ones the frontier has
   * passed. §4.2
   */
  const shownPath = useMemo(
    () => (shownScript === null ? null : pathOf(shownScript)),
    [shownScript],
  )
  const shownEdgeMap = useMemo(
    () => (shownPath === null ? null : pathEdgeMap(shownPath)),
    [shownPath],
  )

  /** A contested line, hovered or focused — the reverse direction sets this too. */
  const handleLineHover = useCallback(
    (opIndex: number | null) => {
      if (opIndex === null || shares === null || shares[opIndex]?.forced !== false) {
        setHoveredOp(null)
        return
      }
      setHoveredOp(opIndex)
    },
    [shares],
  )

  /** A lattice vertex touching a contested edge, hovered — the reverse of the above. */
  const handleHoverPoint = useCallback(
    (point: Point | null) => {
      if (point === null || shownEdgeMap === null || shares === null) {
        setHoveredOp(null)
        return
      }
      const candidates = shownEdgeMap.get(pointKey(point)) ?? []
      const contested = candidates.find((op) => shares[op]?.forced === false) ?? null
      setHoveredOp(contested)
    },
    [shownEdgeMap, shares],
  )

  const hoverEdge = useMemo(
    () => (hoveredOp === null || shownPath === null ? null : edgeOfOp(shownPath, hoveredOp)),
    [hoveredOp, shownPath],
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
      ghostPaths: primaryPath === null || !showAlternatives ? [] : ghostPaths,
      ghostPathsCapped: primaryPath === null || !showAlternatives ? false : ghostPathsCapped,
      contestedEdges: primaryPath === null || !showAlternatives ? null : contestedRegion,
      hoverEdge,
    }),
    [
      vPoints,
      frontiers.backward,
      currentStep,
      frame,
      timeline,
      highlightK,
      primaryPath,
      showAlternatives,
      ghostPaths,
      ghostPathsCapped,
      contestedRegion,
      hoverEdge,
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
    if (!showAlternatives) {
      return `${base} ${format(dict.a11y.graphLabelHidden, { count: countLabel })}`
    }
    if (ghostPathsCapped) {
      return `${base} ${format(dict.a11y.graphLabelCapped, { count: countLabel, cap: GHOST_PATH_CAP })}`
    }
    return `${base} ${format(dict.a11y.graphLabelMany, { count: countLabel, shown: ghostPaths.length })}`
  }, [dict, primaryPath, ambiguity, showAlternatives, ghostPathsCapped, ghostPaths.length, tag])

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

  /**
   * Each selectable script's route, for the ambiguity picker's thumbnails.
   * Index 0 is the script the search produced, matching `shownScript`.
   */
  const routes = useMemo(() => {
    if (state.status !== 'done' || alternatives.length === 0) return undefined
    return alternatives.map((script, index) => pathOf(index === 0 ? state.script : script))
  }, [state, alternatives])

  /** Where each d starts on the scrubber, and where the backtrack begins. */
  const ticks = useMemo(() => {
    if (timeline === null) return []
    const levels = timeline.levelStarts.map((at, d) => ({ at, label: `d${d}` }))
    return timeline.totalFrames > timeline.searchFrames
      ? [...levels, { at: timeline.searchFrames, label: '↩' }]
      : levels
  }, [timeline])

  const t = dict.graph

  return (
    <main className="mx-auto max-w-[100rem] px-4 py-6 sm:px-gutter sm:py-8">
      <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-2">
        <h1 className="font-serif text-h2 font-medium">{t.title}</h1>
        <p className="max-w-[60ch] font-sans text-sm text-indigo">{t.lede}</p>
      </header>

      {/*
        One screen, not three stacked steps. The old Input → Watch → Result
        sequence put the lattice below the fold and the diff a full scroll
        under the player, so "move one and the others follow" could never be
        seen happening — the hover link between a diff line and its cells had
        both ends on different screens. The steps survive as headings for
        assistive tech, where reading order is still the useful structure.
      */}
      <section className="mt-4">
        <h2 className="sr-only">{t.stepInput}</h2>
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
          className="mt-5 rounded-card border border-madder/40 bg-madder/10 p-4 font-sans text-sm text-madder"
        >
          {state.message}
        </p>
      ) : null}

      {/*
        The stage and the inspector. From lg the lattice takes everything but
        a 22–24rem column of instruments that read the same search; below lg
        the instruments follow the player in one column. DESIGN.md §5: the
        core object is the largest element on the page.
      */}
      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="sr-only">{t.stepWatch}</h2>
          {tooLarge ? (
            // An unreadable graph is not a visualisation. Say so, and show the
            // result instead. §6.1
            <p className="rounded-card border border-dashed border-indigo/40 bg-surface p-5 font-sans text-sm text-indigo">
              {format(dict.input.tooLarge, { n, m, cap: VIEWABLE_CAP })}
            </p>
          ) : (
            <section className="card graph-paper overflow-hidden">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-rule bg-surface px-4 py-2.5">
                <h3 className="eyebrow">{t.canvas}</h3>
                <p className="min-w-0 font-sans text-fine text-muted">{t.canvasHint}</p>
              </div>
              {/*
                Square, and sized by the viewport's height as well as its
                width: on a laptop the whole lattice fits on one screen
                instead of running off the bottom. The floor keeps it legible
                on short windows; on a phone the width binds first and the
                lattice fills the column. The canvas itself keeps cells square
                inside this box (DESIGN.md §2.10, tests/render).
              */}
              <div className="mx-auto w-full max-w-[max(18rem,min(58rem,calc(100svh-17rem)))] px-3 pb-3 pt-2 sm:px-4">
                <p className="pb-1 font-mono text-micro text-muted">{t.axisA}</p>
                <div className="flex gap-2">
                  <div className="flex items-center" aria-hidden>
                    <p className="font-mono text-micro text-muted [writing-mode:vertical-rl]">
                      {t.axisB}
                    </p>
                  </div>
                  {/* No box of its own: the lattice sits straight on the graph paper. */}
                  <div className="aspect-square w-full">
                    <LatticeCanvas
                      n={n}
                      m={m}
                      matches={matches}
                      frame={latticeFrame}
                      stampAt={stampAt}
                      stampCount={Math.min(frame, timeline?.searchFrames ?? 0)}
                      label={graphLabel}
                      onHoverPoint={handleHoverPoint}
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
              {/* The key lives with the picture it explains. */}
              <div className="border-t border-rule bg-surface px-4 py-2.5">
                <h3 className="sr-only">{dict.legend.title}</h3>
                <Legend dict={dict} />
              </div>
            </section>
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

          {/*
            On a phone the transport sticks to the bottom edge while the stage
            is on screen — the thumb is already there, and stepping no longer
            means scrolling back up past the lattice to find the buttons.
          */}
          {timeline !== null ? (
            <div className="sticky bottom-[env(safe-area-inset-bottom,0px)] z-20 lg:static">
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
                ticks={ticks}
              />
            </div>
          ) : null}

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
              maxX={n}
            />
          ) : (
            // Showing a V strip for an algorithm that has no V would be a lie
            // dressed as a visualisation.
            <Panel title={t.vstrip}>
              <p className="font-sans text-fine text-muted">{t.noVStrip}</p>
            </Panel>
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-4">
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
            showAlternatives={showAlternatives}
            onToggleShow={setShowAlternatives}
            ghostPathsCapped={ghostPathsCapped}
            ghostCap={GHOST_PATH_CAP}
            routes={routes}
            n={n}
            m={m}
          />

          {/*
            The result sits beside the lattice, not a screen below it, so
            hovering a contested line visibly lights its cells. Its own scroll
            on wide screens keeps a long diff from pushing the instruments
            above it out of reach.
          */}
          <section className="card p-4 sm:p-5">
            <h2 className="eyebrow">{t.stepResult}</h2>
            <p className="mt-1 font-sans text-sm text-muted">{t.stepResultHint}</p>
            {/*
              Said once, above the diff, and only when there is something to
              say. A per-line number nobody has been told how to read is worse
              than no number, and on an unambiguous input there is nothing to
              explain.
            */}
            {shares !== null && hunks.length > 0 ? (
              <p className="mt-3 font-sans text-fine text-muted">
                {contestedLines > 0 ? t.contested : t.contestedNone}
              </p>
            ) : null}
            <div className="mt-3 lg:max-h-[32rem] lg:overflow-y-auto">
              <Hunks
                hunks={hunks}
                selectedOp={selectedOp}
                onSelectOp={setSelectedOp}
                hoveredOp={hoveredOp}
                onHoverOp={handleLineHover}
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
        </aside>
      </div>
    </main>
  )
}
