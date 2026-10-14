import { CONTESTED, FIGURE } from '@/components/home/HeroFigure'

/**
 * The hero's edit graph at thumbnail size, in one of the states the home page
 * talks about. Same data as the hero (`FIGURE`), which tests/ui/hero-figure
 * pins to what lib/diff returns — so these small pictures inherit that check
 * instead of being a second hand-drawing to keep honest.
 *
 *   grid    — the empty grid and its free diagonals: "lay it out as a grid"
 *   search  — plus where the search looked: "find the cheapest route"
 *   read    — the route, its two paid steps marked − and +: "read it back"
 *   chosen  — the solid route with the contested cell, for the two-scripts band
 *   alt     — the other minimal route, ghosted, same cell
 *
 * Static SVG, no script: decorative beside text that already says the same.
 */
export type MiniState = 'grid' | 'search' | 'read' | 'chosen' | 'alt'

const N = 5
const CELL = 16
const PAD = 8
const p = (v: number) => PAD + v * CELL
const SIZE = PAD * 2 + N * CELL

export function MiniLattice({ state, className = '' }: { state: MiniState; className?: string }) {
  const ticks = Array.from({ length: N + 1 }, (_, i) => i)
  const route = state === 'alt' ? FIGURE.altPath : FIGURE.path
  const points = route.map(([x, y]) => `${p(x)},${p(y)}`).join(' ')
  const showRoute = state === 'read' || state === 'chosen' || state === 'alt'
  const contested = state === 'chosen' || state === 'alt'

  return (
    <svg aria-hidden viewBox={`0 0 ${SIZE} ${SIZE}`} className={`block ${className}`}>
      <rect x={p(0)} y={p(0)} width={N * CELL} height={N * CELL} className="fill-surface" />
      {ticks.map((i) => (
        <g key={i}>
          <line x1={p(i)} y1={p(0)} x2={p(i)} y2={p(N)} className="stroke-rule" strokeWidth={1} />
          <line x1={p(0)} y1={p(i)} x2={p(N)} y2={p(i)} className="stroke-rule" strokeWidth={1} />
        </g>
      ))}
      {contested ? (
        <rect
          x={p(CONTESTED.from[0])}
          y={p(CONTESTED.from[1])}
          width={(CONTESTED.to[0] - CONTESTED.from[0]) * CELL}
          height={(CONTESTED.to[1] - CONTESTED.from[1]) * CELL}
          className="fill-madder/15"
        />
      ) : null}
      {FIGURE.matches.map(([i, j]) => (
        <line
          key={`${i}-${j}`}
          x1={p(i)}
          y1={p(j)}
          x2={p(i + 1)}
          y2={p(j + 1)}
          className="stroke-indigo/60"
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
      {state === 'search'
        ? FIGURE.explored.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={p(x)} cy={p(y)} r={3.5} className="fill-turmeric stroke-surface" strokeWidth={1.5} />
          ))
        : null}
      {showRoute ? (
        <polyline
          points={points}
          fill="none"
          // madder is the answer; the alternative was not chosen, so it is
          // drawn in the lattice's ghost indigo. CLAUDE.md invariant 13.
          className={state === 'alt' ? 'stroke-indigo/50' : 'stroke-madder'}
          strokeWidth={state === 'alt' ? 2 : 2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {state === 'read' ? (
        <g className="font-mono" fontSize={11} fontWeight={600}>
          <text x={p(2.5)} y={p(2) - 4} textAnchor="middle" className="fill-removed">
            −
          </text>
          <text x={p(3) + 5} y={p(2.5) + 4} className="fill-added">
            +
          </text>
        </g>
      ) : null}
      <circle cx={p(0)} cy={p(0)} r={3} className="fill-ink" />
      <circle cx={p(N)} cy={p(N)} r={3} className="fill-ink" />
    </svg>
  )
}
