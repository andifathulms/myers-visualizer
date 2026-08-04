# CLAUDE.md — Selisih

Myers diff algorithm visualizer. Edit graph, advancing frontier, `V` array, backtrack to edit script, plus algorithm comparison and the linear-space variant. Static site, GitHub Pages, no backend.

Read `PRD.md` before starting any task. It fixes scope; this file describes how to work in the repo.

**Three things shape everything:**

1. **The apply property is the backbone.** Applying a recovered edit script to A must produce B, exactly. Total, cheap, complete, and true for every algorithm and input. Nothing ships without it green.
2. **A shortest edit script is not unique.** Multiple minimal scripts routinely exist. Never assert that two implementations produce the *same script* — assert they produce the same `D`. Getting this wrong yields a test suite that fails on correct code.
3. **`V` is indexed by `k = x - y`, which can be negative.** The offset is where every Myers implementation bleeds. Centralise it, fixture it, never inline it.

---

## Stack

- Next.js 14, App Router, `output: 'export'` — static only
- TypeScript, `strict: true`
- Tailwind CSS
- Vitest
- pnpm
- No diff library. Writing the algorithm is the project. `lib/diff` never imports one, not even for comparison — patience and histogram are implemented here too.

## Commands

```bash
pnpm dev
pnpm build                 # static export to ./out
pnpm preview               # serve ./out under the production basePath
pnpm test                  # vitest watch
pnpm test:run              # vitest once — before every commit
pnpm test:apply            # apply-property across the generated corpus
pnpm test:oracle           # brute-force minimal D agreement (slow)
pnpm test:determinism
pnpm bench:render          # canvas lattice render benchmark
pnpm typecheck
pnpm lint
```

`pnpm test:apply` and `pnpm test:oracle` gate any commit touching `lib/diff`.

## Layout

```
app/
  [locale]/                # id (default), en
    graf/                  # edit graph + V strip + stepping
    banding/               # algorithm comparison
    contoh/                # preset library
components/
  lattice/                 # canvas edit graph
  vstrip/                  # V array view
  hunks/                   # unified diff output
  compare/
  stepper/
lib/
  tokenize/                # text → integer ids; granularity + whitespace options
  diff/                    # THE CORE. Pure. No React, no DOM, no clock.
    myers.ts               # greedy forward, V recording
    linear.ts              # bidirectional, middle snake, divide and conquer
    patience.ts
    histogram.ts
    backtrack.ts           # trace → EditScript
    apply.ts               # EditScript + A → B. Independent of every search.
    brute.ts               # BFS oracle, tests only
    trace.ts               # SearchTrace types, typed-array storage
    types.ts
layout/                    # lattice geometry. Pure.
workers/
  diff.worker.ts
data/
  presets/                 # inputs + documented phenomenon
tests/
  apply/
  oracle/
  edges/                   # empty, identical, disjoint, repeated elements
  determinism/
```

## Invariants

1. **`lib/diff` is pure and deterministic.** `(a, b, options) → { script, trace, stats }`. No clock, no randomness, no DOM, no React, no module-level mutable state. Byte-identical output for identical inputs.

2. **The search operates on integers, never strings.** Tokenization happens first and produces integer ids. Equality in the search is integer comparison. This is what real implementations do, it is far faster, and it makes the equality relation an explicit choice rather than a hidden one.

3. **`apply.ts` shares no code with any search.** It is the independent verifier. If it imported from `myers.ts` it would validate that file's own assumptions.

4. **Never assert script identity across algorithms or variants.** Assert `D` equality and apply-correctness. Greedy and linear-space Myers legitimately return different minimal scripts.

5. **The `V` offset lives in exactly one place.** `k` ranges over negatives; the array index is `k + offset`. Define it once in `trace.ts` or `myers.ts`, use a named accessor everywhere, and never write `V[k + something]` inline at a call site.

6. **Log the whole `V` per `d`, or you cannot backtrack.** The greedy forward pass alone cannot recover the script. Recording is not optional and its O(D²) cost is accepted and bounded by the input cap.

7. **Patience and histogram are separate algorithms, not Myers variants.** They emit the same `SearchTrace` shape at coarser granularity, but do not force them into a shared skeleton. A false abstraction here would obscure exactly what the comparison view is meant to teach.

8. **Patience and histogram are not minimal.** Never assume or assert they are. The correct assertion is `D_myers ≤ D_others`.

9. **Search runs in a worker with a step budget.** Worst-case inputs are a shipped preset; the pathological path is deliberately reachable and must never hang the UI.

10. **Input size is capped, and the cap is honest.** Above it, the lattice view is replaced with a plain message and result-only output. Never render a graph too dense to read and call it a visualisation.

11. **The lattice renders on canvas, never in the DOM.** No element per cell, at any size.

12. **Nothing is computed in a component.** Components render a `SearchTrace` or an `EditScript`.

13. **`madder` is reserved for the chosen path and the middle snake.** The advancing frontier is `turmeric`. Do not use the path colour for anything else — it means "this is the answer". See PRD §9.

## Working style

- **Prove the render before the algorithm.** M0's spike exists because the edit graph *is* the product. If a 300×300 lattice stutters, nothing downstream matters.
- **Write `apply.ts` and `brute.ts` before `myers.ts`.** The verifier and the oracle come first; then implement against them. An unverified diff implementation is untested no matter how many unit tests surround it.
- **When a test fails, suspect the offset first.** Negative `k` indexing is the most common Myers bug by a wide margin, and it produces plausible output on symmetric inputs.
- **Small increments.** Greedy Myers fully verified beats greedy plus linear-space both half-done.
- **Ask before adding an algorithm.** Each one needs its own correctness story, its own tests, and a reason to exist in the comparison view.
- **Don't touch `next.config.js` or the Actions workflow without saying so explicitly.**
- **Don't add a diff, graph, or layout dependency.** Writing them is the point.
- **Never weaken a test to make something pass**, especially in `tests/apply/`.

## Conventions

- Named exports; defaults only where Next requires them.
- Discriminated unions for edit operations and trace events, keyed on `type`. Exhaustive `switch` with a `never` default.
- No `any`. No non-null `!` in `lib/diff`.
- Integers only. Indices, `k`, `d`, and token ids are all integers. No floats in the engine.
- Follow the paper's notation in identifiers: `x`, `y`, `k`, `d`, `V`, `snake`, `N`, `M`. A reader should be able to hold the paper beside the code. This is the one place terse names are correct.
- Comments cite the paper section or figure they implement.
- Algorithm terms stay in English in code and UI; interface copy is Indonesian.
- Preset ids stable and readable: `brace-misattribution`, `pure-insert`, `worst-case`, `patience-wins`. They appear in shared URLs.
- Tailwind utilities inline; semantic tokens in `tailwind.config.ts` — `cotton`, `indigo`, `deepIndigo`, `turmeric`, `madder`, `explored`. Never raw hex in components.

## Testing rules

- `pnpm test:run` before every commit; `pnpm test:apply` and `pnpm test:oracle` before any commit touching `lib/diff` or `lib/tokenize`.
- Every algorithm, every input, every option → the apply property must hold. No exceptions and no skips.
- New algorithm → minimality-ordering assertion against Myers, plus apply-correctness.
- New variant of Myers → same `D` as greedy, never same script.
- Edge fixtures are mandatory and permanent: empty A, empty B, both empty, identical (`D = 0`), fully disjoint (`D = N + M`), single elements, heavily repeated elements.
- Bug fix → failing test first.

## Deployment

`main` builds and deploys via Actions. `basePath` must match the repository name; `.nojekyll` must exist in `out/`. Verify with `pnpm preview` before pushing.

## Framing

The site links the Myers paper and James Coglan's explainer series prominently — Coglan's is the best written explanation available and pointing to it costs nothing. State plainly that git applies additional heuristics and that this is not a claim of byte-identical parity with `git diff`.

## Current state

M0–M7 built — every milestone in PRD §10. Static export, canvas lattice, greedy Myers with `V` recording and backtrack, edit graph + `V` strip + stepping, unified diff output, presets, ambiguity enumeration, patience, histogram, linear-space Myers with the middle snake and recursion view, sharing, granularity and whitespace options, and the a11y pass.

Green: apply property and oracle agreement across the corpus for every algorithm, minimality ordering, cross-variant `D` equality, trace well-formedness, determinism, step budget at the input cap. First-load JS is 85.6 KB gzipped against the 250 KB budget.

**Two things are asserted but not machine-verified**, because no browser is installed in the environment this was built in:

- The 60fps claim. `pnpm bench:render` serves the spike page and reports mean/p95 draw time against the 16.7 ms budget, but the number has never been captured. `tests/render/frame-cost.test.ts` guards the property it depends on — per-frame work is O(frontier), not O(N·M) — which is a proxy, not a measurement. **Run the bench and record the number.**
- The animation itself. The jsdom tests cover the wiring and the accessible text, not the drawing.

Nothing has been pushed; there is no remote. The Actions workflow and `basePath` both assume the repository is named `myers-visualizer` — if it is named otherwise, `next.config.js` needs changing to match.

Two preset claims were written before they were checked, and both were false: this implementation's tie-breaking does *not* choose the misattributed brace, and two functions swapping order does not make patience win. Both presets were replaced with inputs that demonstrate the phenomenon, and `tests/presets/` now asserts each claim. **Assert a preset's phenomenon when adding one.**
