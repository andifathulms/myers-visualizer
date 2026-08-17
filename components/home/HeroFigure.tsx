import type { Dict } from '@/lib/i18n/dictionary'

/**
 * The one thing the landing page was missing: a picture of what this is.
 *
 * The hero was headline, paragraph, two buttons — an essay's opening, on a
 * site whose whole claim is that the algorithm is watchable. A visitor had to
 * take that on trust and click. This is the same edit graph the tool draws,
 * for the same shopping list the worked example uses below, held still.
 *
 * It is inline SVG rather than the real canvas because it must be in the
 * first paint and cost no JavaScript: LatticeCanvas is a client component
 * behind a worker, and a hero that arrives after hydration is not a hero.
 * The lattice tokens are honoured exactly as PRD §9 fixes them — madder is
 * the chosen path and nothing else.
 *
 * The route drawn is the true one for milk/eggs/sugar/bread/coffee →
 * milk/eggs/salt/bread/coffee: four free diagonals, one step right, one step
 * down, D = 2. The two paid steps carry the − and + they become, which is
 * what ties the picture to the diff a reader already recognises.
 *
 * DESIGN.md §6: this example is also genuinely ambiguous — two equally short
 * routes exist, delete-then-insert or insert-then-delete — and the graph
 * page draws every alternative together (§4) rather than making a reader
 * click to find that out. Because this route is fixed, its one alternative
 * and the square of contested edges between them are known in advance and
 * pre-authored into the same static SVG: no engine, no JS, no cost, and the
 * front page states the product's central claim in the first screen instead
 * of arriving at it four sections later under "why diffs blame the wrong
 * line".
 */

/** Node spacing, in user units. The viewBox scales; this is just the grid. */
const CELL = 38
const OX = 30
const OY = 28
const N = 5

const px = (x: number) => OX + x * CELL
const py = (y: number) => OY + y * CELL

/**
 * The geometry, exported so that tests/ui/hero-figure.test.tsx can hold it
 * against what `lib/diff` actually returns for this example. A hand-drawn
 * route is a claim about the algorithm, and claims here get asserted.
 */
export const FIGURE = {
  /** (i, j) where a[i] === b[j] — the free diagonals. */
  matches: [
    [0, 0],
    [1, 1],
    [3, 3],
    [4, 4],
  ],
  /** The greedy frontier's settled endpoints for d = 0, 1, 2. */
  explored: [
    [2, 2],
    [3, 2],
    [2, 3],
  ],
  /** The shortest route, as corners: two diagonals, right, down, two more. */
  path: [
    [0, 0],
    [2, 2],
    [3, 2],
    [3, 3],
    [5, 5],
  ],
  /**
   * The one other minimal route: down then right instead of right then
   * down — insert salt before deleting sugar, rather than after. Same four
   * free diagonals, same D = 2, a different attribution of the same change.
   */
  altPath: [
    [0, 0],
    [2, 2],
    [2, 3],
    [3, 3],
    [5, 5],
  ],
} as const satisfies Record<string, readonly (readonly [number, number])[]>

/**
 * The single cell both routes disagree about — every one of its four edges
 * is on one minimal route and not the other. Asserted against
 * `contestedEdges` in tests/ui/hero-figure.test.tsx, the same as every other
 * coordinate in this file.
 */
export const CONTESTED = { from: [2, 2], to: [3, 3] } as const satisfies {
  from: readonly [number, number]
  to: readonly [number, number]
}

const { matches: MATCHES, explored: EXPLORED, path: PATH, altPath: ALT_PATH } = FIGURE

export function HeroFigure({ dict }: { dict: Dict }) {
  const t = dict.home.figure
  const ticks = Array.from({ length: N + 1 }, (_, i) => i)

  return (
    <figure className="card p-4 sm:p-5">
      <svg
        viewBox="0 0 260 250"
        role="img"
        aria-label={t.alt}
        className="w-full"
        // The grid is square; letting it stretch would tilt every diagonal,
        // and a 45° diagonal is the whole meaning of "free".
        preserveAspectRatio="xMidYMid meet"
      >
        <g aria-hidden>
          {/* The ground the lattice sits on, as on the graph page. */}
          <rect
            x={px(0)}
            y={py(0)}
            width={N * CELL}
            height={N * CELL}
            rx={4}
            className="fill-cotton/60"
          />

          {/* The grid itself. */}
          {ticks.map((i) => (
            <line
              key={`v${i}`}
              x1={px(i)}
              y1={py(0)}
              x2={px(i)}
              y2={py(N)}
              className="stroke-rule"
              strokeWidth={1}
            />
          ))}
          {ticks.map((j) => (
            <line
              key={`h${j}`}
              x1={px(0)}
              y1={py(j)}
              x2={px(N)}
              y2={py(j)}
              className="stroke-rule"
              strokeWidth={1}
            />
          ))}

          {/*
            The contested cell, beneath every other layer — structure the
            answer sits inside, not the answer itself, same as the graph
            page's tint (§4.1). Both routes cross it; only the order differs.
          */}
          <rect
            x={px(CONTESTED.from[0])}
            y={py(CONTESTED.from[1])}
            width={px(CONTESTED.to[0]) - px(CONTESTED.from[0])}
            height={py(CONTESTED.to[1]) - py(CONTESTED.from[1])}
            rx={3}
            className="fill-madder/10"
          />

          {/*
            The other equally minimal route, ghosted — indigo, not madder,
            because it was not chosen (CLAUDE.md invariant 13). Whole and
            still, the same as the graph page draws every alternative once
            the search has an answer (§4.1, §4.5).
          */}
          <polyline
            points={ALT_PATH.map(([x, y]) => `${px(x)},${py(y)}`).join(' ')}
            fill="none"
            className="stroke-indigo/40"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/*
            The answer, as a band rather than a line. Every free diagonal in
            this example happens to lie on the shortest route, so a solid path
            drawn last would hide the very structure it is exploiting — and
            the key beneath would name three things while showing two.
          */}
          <polyline
            points={PATH.map(([x, y]) => `${px(x)},${py(y)}`).join(' ')}
            fill="none"
            className="stroke-madder/30"
            strokeWidth={11}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={PATH.map(([x, y]) => `${px(x)},${py(y)}`).join(' ')}
            fill="none"
            className="stroke-madder"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Diagonal threads: the lines that are identical on both sides. */}
          {MATCHES.map(([i, j]) => (
            <line
              key={`m${i}-${j}`}
              x1={px(i)}
              y1={py(j)}
              x2={px(i + 1)}
              y2={py(j + 1)}
              className="stroke-indigo/70"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          ))}

          {/* Where the search looked and did not go. Drawn last: two of the
              three settled endpoints sit under the route. */}
          {EXPLORED.map(([x, y]) => (
            <circle
              key={`e${x}-${y}`}
              cx={px(x)}
              cy={py(y)}
              r={3.5}
              className="fill-explored stroke-indigo/30"
            />
          ))}

          <circle cx={px(0)} cy={py(0)} r={4.5} className="fill-madder" />
          <circle cx={px(N)} cy={py(N)} r={4.5} className="fill-madder" />

          {/* The two paid steps, named as the diff lines they become. */}
          <text
            x={px(2.5)}
            y={py(2) - 8}
            textAnchor="middle"
            className="fill-removed font-mono text-micro font-semibold"
          >
            {t.deleted}
          </text>
          <text
            x={px(3) + 9}
            y={py(2.5) + 4}
            className="fill-added font-mono text-micro font-semibold"
          >
            {t.inserted}
          </text>

          {/*
            Axes. Which side is which is exactly what a newcomer cannot guess,
            and getting it backwards makes the whole picture read wrong.

            The direction arrows are drawn, not written: an arrow inside the
            side label would be rotated with it and end up pointing left,
            saying the opposite of what it means.
          */}
          <text x={px(0)} y={py(0) - 12} className="fill-muted font-mono text-micro">
            {t.axisA}
          </text>
          <path
            d={`M ${px(0) + 58} ${py(0) - 16} h 14 m -4 -3.5 l 4 3.5 l -4 3.5`}
            fill="none"
            className="stroke-muted"
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Reads downward, in the direction it describes. */}
          <text
            x={px(0) - 11}
            y={py(0)}
            transform={`rotate(90 ${px(0) - 11} ${py(0)})`}
            className="fill-muted font-mono text-micro"
          >
            {t.axisB}
          </text>
          <path
            d={`M ${px(0) - 15} ${py(0) + 58} v 14 m -3.5 -4 l 3.5 4 l 3.5 -4`}
            fill="none"
            className="stroke-muted"
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-sans text-fine text-muted">
        <Key className="bg-indigo/70">{t.keyMatch}</Key>
        <Key className="bg-explored">{t.keySearch}</Key>
        <Key className="bg-madder">{t.keyPath}</Key>
        <Key className="bg-indigo/40">{t.keyAlt}</Key>
      </figcaption>
    </figure>
  )
}

function Key({ className, children }: { className: string; children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={`h-0.5 w-4 rounded-full ${className}`} />
      {children}
    </span>
  )
}
