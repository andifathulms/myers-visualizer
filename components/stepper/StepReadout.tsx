'use client'

import { Panel } from '@/components/ui/Panel'
import { format, type Dict } from '@/lib/i18n/dictionary'

/**
 * What the step under the cursor actually did, and whether it was a choice.
 *
 * The site's whole claim is that a tie-break decides which of several equally
 * minimal scripts you are shown. That was stated in prose on the home page and
 * then never shown happening — the lattice draws the frontier advancing, but
 * not the one moment where two predecessors were exactly as good and the
 * comparison, written `<` rather than `<=`, sent the path down instead of
 * right. This is that moment, named where it occurs. §6.4
 *
 * Myers greedy only. The other algorithms keep no V, and the linear-space
 * variant's predecessors live in two frontiers meeting in the middle rather
 * than in one recorded history — reading this derivation into either would be
 * a lie dressed as a readout.
 */
export function StepReadout({
  dict,
  d,
  k,
  move,
  tied,
  available,
}: {
  dict: Dict
  d: number
  k: number
  move: 'right' | 'down' | 'start'
  tied: boolean
  /** False for algorithms with no V to read the tie back out of. */
  available: boolean
}) {
  const t = dict.graph

  if (!available) {
    return (
      <Panel title={t.step} ariaLabel={t.step}>
        <p className="font-sans text-sm text-muted">{t.stepNoSteps}</p>
      </Panel>
    )
  }

  const direction = move === 'down' ? t.stepDown : move === 'right' ? t.stepRight : t.stepStart

  /*
    A card like everything around it — it was the one bordered box on the page
    that was not one — and the long half of the sentence now lives in the
    panel hint, which is where every other panel keeps its explanation. What
    is left is one short line that changes as you step.
  */
  return (
    <Panel title={t.step} hint={t.stepHint} ariaLabel={t.step}>
      <p className="font-sans text-sm text-muted">
        <span className="font-mono tabular-nums text-deepIndigo">{format(t.stepAt, { d, k })}</span>
        <span aria-hidden> · </span>
        {direction}
        {move === 'start' ? null : (
          <>
            {' · '}
            {/*
              Weight, not colour. A tie is neither the frontier nor the answer,
              and madder is reserved for the answer.
            */}
            <span className={tied ? 'font-medium text-deepIndigo' : undefined}>
              {tied ? t.stepTied : t.stepNoTie}
            </span>
          </>
        )}
      </p>
    </Panel>
  )
}
