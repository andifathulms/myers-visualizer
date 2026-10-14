import type { GlossaryIcon as Icon } from '@/lib/i18n/dictionary'

/**
 * A 40px drawing beside each glossary term, in the lattice's own vocabulary:
 * the same grid, the same diagonal threads, turmeric for the frontier, madder
 * only where the term *is* the answer (an edit script, its D, the backtrack
 * that recovers it). Decorative — the term and its gloss carry the meaning.
 */
const GRID = [8, 20, 32]

export function GlossaryIcon({ icon }: { icon: Icon }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" className="h-10 w-10 shrink-0 rounded-ctl border border-rule bg-surface">
      {icon === 'diff' || icon === 'hunk' || icon === 'tokenize' || icon === 'cost' || icon === 'v' ? null : (
        <g className="stroke-rule" strokeWidth={1}>
          {GRID.map((v) => (
            <g key={v}>
              <line x1={v} y1={8} x2={v} y2={32} />
              <line x1={8} y1={v} x2={32} y2={v} />
            </g>
          ))}
        </g>
      )}
      <Body icon={icon} />
    </svg>
  )
}

const ROUND = { strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const

function Body({ icon }: { icon: Icon }) {
  switch (icon) {
    case 'diff':
      return (
        <g>
          <rect x={8} y={12} width={24} height={5} rx={2} className="fill-removed/70" />
          <rect x={8} y={23} width={24} height={5} rx={2} className="fill-added/70" />
        </g>
      )
    case 'script':
      return <polyline points="8,8 20,20 32,20 32,32" className="stroke-madder" strokeWidth={2.5} {...ROUND} />
    case 'graph':
      return (
        <g className="stroke-indigo/70" strokeWidth={2} strokeLinecap="round">
          <line x1={8} y1={8} x2={20} y2={20} />
          <line x1={20} y1={20} x2={32} y2={32} />
        </g>
      )
    case 'd':
      return (
        <g>
          <polyline points="8,8 20,20 32,20 32,32" className="stroke-madder/30" strokeWidth={2} {...ROUND} />
          <line x1={20} y1={20} x2={32} y2={20} className="stroke-madder" strokeWidth={3} strokeLinecap="round" />
          <line x1={32} y1={20} x2={32} y2={32} className="stroke-madder" strokeWidth={3} strokeLinecap="round" />
        </g>
      )
    case 'snake':
      return <line x1={8} y1={8} x2={32} y2={32} className="stroke-indigo" strokeWidth={3} strokeLinecap="round" />
    case 'frontier':
      return (
        <g className="fill-turmeric stroke-surface" strokeWidth={1.2}>
          <circle cx={32} cy={8} r={3.5} />
          <circle cx={20} cy={20} r={3.5} />
          <circle cx={8} cy={32} r={3.5} />
        </g>
      )
    case 'k':
      return (
        <g>
          <line x1={8} y1={8} x2={32} y2={32} className="stroke-indigo/60" strokeWidth={1.5} strokeDasharray="3 3" />
          <line x1={20} y1={8} x2={32} y2={20} className="stroke-indigo" strokeWidth={2} strokeLinecap="round" />
        </g>
      )
    case 'v':
      return (
        <g className="fill-indigo/50">
          <rect x={7} y={22} width={5} height={10} rx={1} />
          <rect x={14} y={15} width={5} height={17} rx={1} />
          <rect x={21} y={10} width={5} height={22} rx={1} className="fill-turmeric" />
          <rect x={28} y={18} width={5} height={14} rx={1} />
        </g>
      )
    case 'backtrack':
      return (
        <g>
          <polyline points="32,32 32,20 20,20 8,8" className="stroke-madder" strokeWidth={2.5} {...ROUND} />
          <polyline points="12,8 8,8 8,12" className="stroke-madder" strokeWidth={2} {...ROUND} />
        </g>
      )
    case 'tie':
      return (
        <g>
          <polyline points="20,20 32,20 32,32" className="stroke-madder" strokeWidth={2.5} {...ROUND} />
          <polyline points="20,20 20,32 32,32" className="stroke-indigo/50" strokeWidth={2} {...ROUND} />
          <circle cx={20} cy={20} r={2.5} className="fill-ink" />
        </g>
      )
    case 'hunk':
      return (
        <g>
          <rect x={10} y={9} width={20} height={3} rx={1.5} className="fill-rule" />
          <rect x={10} y={16} width={20} height={3} rx={1.5} className="fill-removed/70" />
          <rect x={10} y={22} width={20} height={3} rx={1.5} className="fill-added/70" />
          <rect x={10} y={29} width={20} height={3} rx={1.5} className="fill-rule" />
          <polyline points="8,14 6,14 6,27 8,27" className="stroke-indigo" strokeWidth={1.5} {...ROUND} />
        </g>
      )
    case 'tokenize':
      return (
        <g className="fill-indigo/50">
          <rect x={7} y={12} width={7} height={7} rx={1.5} />
          <rect x={16} y={12} width={7} height={7} rx={1.5} />
          <rect x={25} y={12} width={8} height={7} rx={1.5} className="fill-turmeric" />
          <rect x={7} y={23} width={11} height={5} rx={1.5} className="fill-rule" />
          <rect x={21} y={23} width={12} height={5} rx={1.5} className="fill-rule" />
        </g>
      )
    case 'cost':
      return (
        <g>
          <polyline points="7,32 33,32" className="stroke-rule" strokeWidth={1.5} {...ROUND} />
          <path d="M7 32 C 20 31, 26 24, 33 8" className="stroke-indigo/60" strokeWidth={2} {...ROUND} />
          <path d="M7 32 C 20 31, 26 29, 33 24" className="stroke-indigo" strokeWidth={2.5} {...ROUND} />
        </g>
      )
    default: {
      const never: never = icon
      return never
    }
  }
}
