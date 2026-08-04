import { RenderBench } from '@/components/lattice/RenderBench'

// M0 render spike. The edit graph *is* the product: if a 300 × 300 lattice
// stutters, nothing downstream matters. Not linked from the nav.
export default function BenchPage() {
  return <RenderBench />
}
