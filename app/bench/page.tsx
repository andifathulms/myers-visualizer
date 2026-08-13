import type { Metadata } from 'next'
import { RenderBench } from '@/components/lattice/RenderBench'

/**
 * The render benchmark harness, not a page. robots.txt disallows it and this
 * keeps it out of an index even if something links to it directly — a search
 * result landing here would be a dead end.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}


// M0 render spike. The edit graph *is* the product: if a 300 × 300 lattice
// stutters, nothing downstream matters. Not linked from the nav.
export default function BenchPage() {
  return <RenderBench />
}
