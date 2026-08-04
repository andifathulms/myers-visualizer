# PRD — Selisih

**The Myers diff algorithm, made watchable. See the edit graph, watch the frontier expand, follow the backtrack that recovers the edit script — and find out why diffs sometimes attribute the wrong lines.**

> *selisih* (Indonesian) — difference, discrepancy, the gap between two things.
> Rename freely; the slug is used throughout as `selisih`.

| | |
|---|---|
| **Status** | Draft — pre-implementation |
| **Owner** | Andi Fathul Mukminin Salahuddin |
| **Type** | Personal portfolio project, open source, educational |
| **Deployment** | GitHub Pages (static export, no server) |
| **Language** | Indonesian-first UI; English secondary. Algorithm terms stay in English. |
| **Normative source** | Myers, *An O(ND) Difference Algorithm and Its Variations*, Algorithmica 1(2):251–266, 1986. |

---

## 1. Prior art

**James Coglan's blog series on the Myers algorithm is the canonical written explainer** and is genuinely good. Several small interactive demos exist that animate the frontier on toy inputs. The algorithm is also described directly in the paper, which is unusually readable.

What does not exist: a tool that runs **multiple diff algorithms on the same input and shows why they disagree**, or that connects the abstract edit graph to the concrete "why did git blame the wrong brace" experience that every developer has had and nobody has explained to them.

## 2. Problem

`git diff` runs on essentially every working day of a developer's life, and almost nobody knows what it does. Three specific gaps:

**The algorithm is invisible.** Diff is experienced as output. That it is a shortest-path search over a lattice — an actual graph search, with a frontier and a backtrack — is not something the output suggests.

**Ugly diffs are unexplained.** Everyone has seen a diff where a closing brace is attributed to the wrong function, or where inserting a block appears as "delete these five lines, add these seven" instead of "add two lines". Developers treat this as a quirk. It is not: **a shortest edit script is usually not unique**, and which of several equally-minimal scripts you see is decided by the algorithm's tie-breaking. That is a learnable fact with practical consequences, and no tool teaches it.

**Nobody knows why `--patience` exists.** Git ships alternative diff algorithms. The reason is that minimal is not the same as readable, and patience diff deliberately produces *longer* edit scripts that humans find easier to review. Seeing that tradeoff concretely, on the same input, is the fastest way to understand it.

## 3. The algorithm in brief

Given sequences A (length N) and B (length M), build an **edit graph**: a grid of (N+1) × (M+1) points, where point `(x, y)` means "consumed x elements of A and y of B".

| Move | Meaning | Cost |
|---|---|---|
| Right, `(x,y) → (x+1,y)` | delete `A[x]` | 1 |
| Down, `(x,y) → (x,y+1)` | insert `B[y]` | 1 |
| Diagonal, `(x,y) → (x+1,y+1)` | keep — only when `A[x] == B[y]` | **0** |

A diff is a path from `(0,0)` to `(N,M)`. The **shortest edit script** is the path with the fewest non-diagonal moves. Diagonals are free, so the algorithm is a shortest-path search where matching runs cost nothing.

Myers searches by increasing edit distance `d`. It tracks, for each **diagonal** `k = x - y`, the furthest-reaching `x` achievable with exactly `d` edits — an array `V` indexed by `k`. At each step it extends greedily along free diagonals; those maximal diagonal runs are called **snakes**. When the frontier reaches `(N,M)`, `d` is the answer, and the recorded history of `V` lets you backtrack to recover the actual script.

Runtime is O((N+M)D), which is why diff is fast in practice: real edits are small, so `D` is small.

**The variation that matters:** storing `V` for every `d` costs O(D²) memory. The linear-space refinement runs the search forward from `(0,0)` and backward from `(N,M)` simultaneously, finds the **middle snake** where they meet, and recurses on the two halves — O(N+M) space. This is the version real tools use, and it is a genuinely elegant piece of engineering worth showing.

## 4. Product thesis

**Three linked views over one recorded search**, in the pattern used across this project family: the edit graph, the `V` frontier array, and the resulting diff output. Scrub any of them and the others follow.

**Two things make it more than a demo:**

1. **Algorithm comparison.** Myers, patience, and histogram on the same input, side by side, with edit-script length and a readability contrast. Patience produces longer scripts on purpose — seeing that is the lesson.
2. **The ambiguity view.** When several minimal scripts exist, say so, show how many, and let the user see the alternatives. This is what explains the misattributed-brace problem, and it is the feature with real practical payoff.

## 5. Non-goals

- **Not a diff tool for daily use.** No file upload beyond pasting, no directory diff, no three-way merge, no patch application.
- **No merge conflict resolution.** Different algorithm, different project.
- **No syntax-aware or AST diffing.** Interesting, and a separate project.
- **No large inputs.** The edit graph is N×M; beyond a few hundred elements per side it is no longer viewable. Cap it, say so plainly, and fall back to result-only output rather than pretending to visualise something illegible.
- **No accounts, no server.** Inputs and state share by URL hash.
- **No ML.**
- **No claim to be git.** Git's Myers implementation has heuristics and fallbacks this will not reproduce. Say so rather than implying byte-identical parity.

## 6. Features

### 6.1 The edit graph — signature view
The lattice, with match positions marked so the available diagonals are visible before the search starts — the user can see the structure the algorithm will exploit. Then:

- the explored region filling as `d` increases,
- the frontier as a contour advancing outward,
- snakes drawn as continuous diagonal runs, since they are the conceptual unit,
- the final path traced back through it.

Rendered on canvas. For inputs above the viewable cap, the graph is replaced by an honest message and the result-only view.

### 6.2 The V array
The frontier as an indexed strip, one cell per diagonal `k`, updating as `d` advances. Shown beside the graph and linked to it: hovering a `k` cell highlights that diagonal in the lattice. This is the data structure the algorithm actually manipulates, and seeing it move alongside the geometry is what makes the code legible afterwards.

### 6.3 Diff output
Standard unified-diff rendering of the recovered script, with each hunk linked back to the graph segment that produced it. Click a `-` line, see the horizontal move; click a `+`, see the vertical.

### 6.4 The ambiguity view
When multiple minimal scripts exist, report the count and let the user step between them. Includes a worked preset of the misattributed-brace case, since that is the one everybody has hit.

### 6.5 Algorithm comparison
Myers, patience, and histogram on one input, side by side: script length, hunk count, and the output diffs aligned for reading. Patience will usually be longer, and the point is that longer is sometimes better — stated plainly, with the reasoning.

### 6.6 Linear-space mode
The bidirectional variant: forward and backward frontiers advancing toward each other, the middle snake highlighted when they meet, then recursion into the two subproblems. A memory counter runs beside the naive version so the O(D²) versus O(N+M) difference is a number on screen, not a claim.

### 6.7 Stepping
Play, pause, step, step back, jump to next `d`, jump to next snake, scrub, speed control. Step-back is free because the search is recorded, not re-run.

### 6.8 Input and presets
Two text panes, line or character granularity. A preset library: a minimal edit, a pure insertion, a pure deletion, a transposition, the misattributed-brace case, a case where patience clearly wins, and a worst-case input where `D` approaches N+M.

## 7. Architecture

Static Next.js 14 App Router export. No backend, no runtime fetches.

```
A, B, granularity, algorithm
  → tokenize        → sequences + equality classes
  → search (pure)   → SearchTrace (V snapshots, snakes, frontier per d)
  → backtrack       → EditScript
                    → graph | V strip | diff output | comparison
```

**`lib/diff` is pure.** `(a, b, options) → { script, trace, stats }`. No React, no DOM, no clock, no module-level mutable state. Same inputs, byte-identical output.

**One search skeleton per algorithm family, but a shared trace format.** Myers greedy and Myers linear-space share the trace type so the views work unchanged. Patience and histogram emit the same trace shape at a coarser granularity — they are different algorithms, not variants, and the code should say so rather than forcing a false abstraction.

**Tokenization is separate and explicit.** Line-level diff hashes lines into integer ids first; the search then operates on integers, never strings. This is what real implementations do, it is much faster, and it makes the equality relation an explicit, inspectable choice — including whitespace handling.

**The trace is materialised.** `V` snapshots per `d` in typed arrays, snakes in a side table, rich objects hydrated only for the step under inspection.

**Search runs in a worker** with a step budget. Worst-case inputs are a preset, so the pathological case is deliberately reachable and must not hang the UI.

## 8. Testing

**The script must apply.** Applying the recovered edit script to A must produce B exactly. This is a total, cheap, and complete correctness property — it holds for every algorithm, every input, every option. It is the backbone of the suite.

**Brute-force oracle.** For small inputs, BFS over the edit graph gives the true minimal `D`. Myers must match it exactly. Assert across a generated corpus.

**Cross-variant agreement.** Myers greedy and Myers linear-space must report the **same `D`**. They may return different scripts — several minimal scripts can exist — so assert on `D` and on apply-correctness, never on script identity. Getting this assertion wrong is itself a classic mistake.

**Minimality ordering.** Patience and histogram are *not* minimal-edit algorithms. Assert `D_myers ≤ D_patience` and `D_myers ≤ D_histogram` across the corpus. A violation means the Myers implementation is wrong.

**Determinism.** Same inputs and options produce a byte-identical trace.

**Trace well-formedness.** Every `V` snapshot is consistent with the previous one; every snake is a genuine diagonal run of matches; the frontier never retreats.

**Edge cases as fixtures.** Empty A, empty B, both empty, identical inputs (`D = 0`), completely disjoint inputs (`D = N + M`), single-element sequences, inputs with repeated elements.

## 9. Design direction

The edit graph is two sequences crossing at right angles with meaning at the intersections, which is exactly what a loom is. The material world is **tenun** — warp and weft, indigo dyeing, a pattern emerging where threads meet.

**Palette.** Undyed cotton `#E8E2D4` as ground. Indigo `#2A3D5C` for the lattice and structure, deep indigo `#1A2438` for text. Turmeric `#C9982E` for the advancing frontier — the live edge of the search. Madder red `#A63D2F` reserved for the chosen path and the middle snake, the two things that are *the answer*. A pale indigo wash for the explored region. Nothing else.

**Type.** The content is character-aligned sequences, so monospace is structural: **DM Mono** for sequences, indices, and the `V` strip, narrow enough for dense grids and with proper tabular figures. **Newsreader** for prose and headings, a screen-native serif with enough warmth for a textile register. **Inter** for controls and labels.

**Structure.** The lattice is drawn as thread rather than as cell borders — thin continuous lines, with match positions as small knots. Snakes render as unbroken diagonal threads, which is what makes them read as single units rather than sequences of cells.

**Motion.** One orchestrated moment: the frontier advancing outward in turmeric as `d` increments, snakes extending along the free diagonals, then the madder path drawing itself backward through the lattice during the backtrack. In linear-space mode, two frontiers advance toward each other and the middle snake flares when they meet. Nothing else moves. `prefers-reduced-motion` disables autoplay and keeps stepping instantaneous.

**Copy.** Indonesian first; algorithm terms stay in English — *snake*, *frontier*, *edit script*, *diagonal* — so a reader recognises them in the paper and in source code afterwards. The ambiguity view states the fact plainly: several shortest scripts exist, and the algorithm picks one by tie-breaking rather than by judgement.

## 10. Milestones

| | | |
|---|---|---|
| **M0** | Scaffold + render spike | Static export deploying, plus a canvas spike drawing a 300×300 lattice with an animated frontier at 60fps. The graph is the product; prove it renders. |
| **M1** | Engine | Tokenizer, Myers greedy, `V` recording, backtrack, edit script. Apply-property and brute-force oracle green. Console only. |
| **M2** | Graph + V views | Edit graph, frontier animation, `V` strip, linking, stepping controls. |
| **M3** | Output | Unified diff rendering, hunk-to-graph linking, presets. **Ship publicly here.** |
| **M4** | Ambiguity | Multiple-minimal-script detection and enumeration, misattributed-brace preset. |
| **M5** | Comparison | Patience and histogram, side-by-side view, minimality-ordering tests. |
| **M6** | Linear space | Bidirectional search, middle snake, recursion view, memory counter. |
| **M7** | Polish | Sharing, granularity options, whitespace handling, a11y. |

M3 is a complete useful tool. M4 is the insight nobody else offers. M6 is the piece that most impresses an engineer.

## 11. Success criteria

- Every recovered script applies to A and yields B exactly — 100% across the corpus, no exceptions.
- Myers matches the brute-force minimal `D` on every input small enough to enumerate.
- Greedy and linear-space report identical `D` on every input.
- `D_myers ≤ D_patience` and `D_myers ≤ D_histogram` everywhere.
- 300×300 lattice animates at 60fps; the UI never blocks, including on the worst-case preset.
- A user can go from pasting two texts to seeing why the diff chose one attribution over another in under three interactions.
- Fully offline after first load. JS ≤ 250 KB gzipped.

## 12. Deployment

`output: 'export'`, `basePath` matching the repository name, `images.unoptimized`, `trailingSlash: true`, `.nojekyll` in the output root. Verify under the production `basePath` with `pnpm preview` before pushing.

## 13. Risks

| Risk | Mitigation |
|---|---|
| **Graph doesn't scale and the core view is useless.** | M0 render spike. Hard input cap with an honest message and result-only fallback above it. |
| **Asserting script identity between variants.** | Minimal scripts are not unique. Assert on `D` and on apply-correctness only. This is written into the test rules because it is the mistake that looks correct. |
| **Off-by-one errors in the `V` indexing.** | `k` can be negative, so `V` needs an offset. Centralise the offset in one place, fixture it, and never inline the arithmetic. This is where every Myers implementation bleeds. |
| **O(D²) trace memory on worst-case inputs.** | Step budget, input cap, typed arrays. The worst-case preset exists to exercise this deliberately. |
| **Implying parity with git.** | State plainly that git applies additional heuristics. Do not claim byte-identical output. |
| **Scope creep into a diff/merge tool.** | §5 is binding. Three-way merge is a different project. |
