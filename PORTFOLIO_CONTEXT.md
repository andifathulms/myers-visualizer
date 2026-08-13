# PORTFOLIO_CONTEXT.md — Myers Visualizer

Raw material for a client-facing case study. Facts below are taken from the repo, not the PRD's aspirations — where the two differ, the code wins.

---

## 1. One-line summary

An interactive web tool that plays back, step by step, what happens inside `git diff` — showing on screen how a computer decides which lines of a file changed, and why it sometimes gets the attribution wrong.

## 2. The problem

`git diff` runs on essentially every working day of a developer's life, and almost nobody knows what it does. Three specific gaps the tool addresses:

- **The algorithm is invisible.** A diff is experienced only as output. That it is a shortest-path search over a grid — with an expanding search frontier and a backtracking step — is not something the output hints at.
- **Ugly diffs go unexplained.** Everyone has seen a diff attribute a closing brace to the wrong function, or render "insert 2 lines" as "delete 5, add 7". Developers treat this as a quirk. It is not: **a shortest edit script is usually not unique**, and which of several equally minimal ones you see is decided by the algorithm's tie-breaking, not by any judgement about readability. Almost no tool teaches this.
- **Nobody knows why `git --patience` exists.** Alternative diff algorithms ship with git because *minimal* is not the same as *readable*. Patience diff deliberately produces edit scripts humans review more easily. Seeing that tradeoff on the same input is the fastest way to understand it.

**Who it's for:** working developers who want to understand a tool they use daily; students and educators covering dynamic programming / graph search; and anyone reading Myers' 1986 paper who wants the diagrams to move. Secondarily it is a portfolio piece — a deliberately hard algorithm implemented from the paper, with a correctness story.

## 3. My role

Sole author. Everything in the repository was written for this project:

- **The diff engine, from the paper** — greedy Myers with `V` recording, backtrack, the linear-space bidirectional variant with the middle snake, plus patience and histogram as separate algorithms. `lib/diff/` is ~1,750 lines and **imports no diff library**; writing the algorithm is the project.
- **The verifier and the oracle first** — `apply.ts` (edit script + A → B, sharing no code with any search) and `brute.ts` (BFS over the edit graph for true minimal `D`) were written *before* `myers.ts`, so the implementation was built against an independent check rather than tested after the fact.
- **The canvas renderer and lattice geometry** — no charting or graph library; `components/lattice/render.ts` and `layout/lattice.ts` are hand-written.
- **The whole product surface** — pages, stepping/playback, `V` strip, unified diff output, ambiguity enumeration, comparison view, presets, URL-hash sharing, two locales, a11y pass.
- **The build and verification tooling** — static export postbuild + service worker (`scripts/postbuild.mjs`), production-basePath preview server, a headless-Chrome render benchmark, and a Puppeteer smoke test that drives the built export.
- **The design system and brand mark** — palette, type scale, UI primitives, icon set, PWA assets, social card.

**Used as-is:** Next.js, React, Tailwind, TypeScript, Vitest, Puppeteer. Nothing else — the dependency list is three runtime packages.

## 4. Technical approach

- **Static site, no backend.** Everything runs in the browser; state and inputs are shared by URL hash. Nothing to operate, nothing to pay for, and the whole thing works offline after first load via a generated service worker.
- **The engine is a pure function.** `(a, b, options) → { script, trace, stats }` — no React, no DOM, no clock, no randomness, no module-level state. Identical inputs produce byte-identical output. This is what makes stepping *backwards* free: the search is recorded once, and the UI replays a recording rather than re-running anything.
- **Search on integers, never strings.** Text is tokenized into integer ids first, so the search compares numbers. That's what real implementations do, it's much faster, and it turns "what counts as equal?" (line vs. character granularity, whitespace handling) into an explicit, user-visible setting instead of a hidden assumption.
- **The verifier is deliberately independent.** `apply.ts` shares no code with any search. If it imported from the Myers implementation, it would only be validating that file's own assumptions. This is the backbone of the test suite: *every* algorithm, on *every* input, under *every* option, must produce a script that applies to A and yields B exactly.
- **Never assert that two algorithms produce the same script.** Because minimal edit scripts aren't unique, greedy and linear-space Myers legitimately disagree on the script while agreeing on `D`. The suite asserts `D` equality and apply-correctness — getting this wrong yields a test suite that fails on correct code.
- **The `V` offset lives in exactly one place.** The array is indexed by `k = x − y`, which goes negative. Off-by-one there is the classic Myers bug, and it produces plausible-looking output on symmetric input. Centralised behind a named accessor, never inlined.
- **The lattice is canvas, never DOM.** No element per cell at any size. Per-frame work is O(frontier), not O(N·M) — a property guarded by a unit test and calibrated by a browser benchmark.
- **The search runs in a Web Worker with a step budget,** so the deliberately pathological worst-case preset can't hang the UI.
- **Input size is capped honestly.** Above the cap the graph is replaced with a plain message and result-only output, rather than rendering something too dense to read and calling it a visualisation.

## 5. Actual tech stack

From `package.json` — three runtime dependencies total.

| | |
|---|---|
| **Runtime deps** | Next.js 14.2.15 (App Router, `output: 'export'`), React 18.3.1, react-dom 18.3.1 |
| **Language** | TypeScript 5.5 (`strict: true`, no `any`, no non-null `!` in the engine) |
| **Styling** | Tailwind CSS 3.4 with semantic tokens; all colour literals in one `lib/palette.ts` |
| **Testing** | Vitest 2.0, @testing-library/react + jsdom (unit/UI), Puppeteer 25 (real-Chrome smoke test + render benchmark) |
| **Package manager** | pnpm 9.15 |
| **Rendering** | HTML Canvas 2D, hand-written — no D3, no charting library |
| **Concurrency** | Web Worker for the search |
| **Hosting/CI** | GitHub Pages via GitHub Actions, static export with `basePath` |
| **Offline** | Hand-generated service worker + `manifest.webmanifest` (PWA installable) |
| **Not used** | No diff library, no graph/layout library, no state-management library, no backend, no database, no analytics, no ML |

## 6. Notable features

- **The edit graph** — the lattice drawn on canvas: match positions marked before the search starts, the explored region filling as `d` increases, the frontier advancing in turmeric, snakes as unbroken diagonal threads, and the chosen path drawn back through it in madder red.
- **The `V` array strip** — the algorithm's actual data structure shown beside the graph, one cell per diagonal `k`; hovering a cell highlights that diagonal in the lattice.
- **Ambiguity enumeration** — counts how many *equally minimal* edit scripts exist for the input and lets you step between them, including a preset that demonstrates a closing brace attributed to the wrong function.
- **Four-algorithm comparison** — greedy Myers, linear-space Myers, patience and histogram on the same input, with script length, hunk count and retained `V` cells side by side. The README's own example: all four agree on `D = 5`, and patience still halves the hunk count.
- **Linear-space mode** — the bidirectional variant with two frontiers converging, the middle snake flaring where they meet, then recursion into the two halves, with a live memory counter making the O(D²) → O(N+M) difference a number on screen rather than a claim.
- **Full playback control** — play, pause, step, step back, jump by `d`, jump by snake, scrub, speed; stepping back is free because the search is recorded, not re-run.
- **8 documented presets** (`minimal-edit`, `pure-insert`, `pure-delete`, `transposition`, `brace-misattribution`, `patience-wins`, `worst-case`, `char-level`), URL-hash sharing, line/character granularity, whitespace options, two locales (English default, Indonesian at `/id`), offline/installable.

## 7. Challenges & tradeoffs

- **The render risk was retired first, then actually measured.** The signature view *is* the product, so a canvas spike drawing a 300×300 lattice came before any algorithm code. Later this was upgraded from an assertion to a measurement (`bench: measure the M0 gate instead of asserting it`): `pnpm bench:render` builds, serves under the production basePath, drives it in headless Chrome and reads the numbers back, exiting non-zero if the budget is blown — 220 measured frames, draw mean 0.13 ms, frame median 16.70 ms (59.9 fps). Deliberately **not in CI**: timing benchmarks on shared runners produce false failures, so a cheap deterministic unit test guards the property the number depends on and the browser bench calibrates it.
- **Two shipped code paths that no unit test can reach.** jsdom has no `Worker` and its canvas is a stub — so the unit suite only ever exercised the synchronous fallback and verified painting by counting draw calls. A Puppeteer smoke test against the built export (`test: smoke the built export in real Chrome`) closed both gaps by reading pixels back and confirming the worker chunk is requested. It immediately found a real bug: the URL hash was only read on mount, so pasting a shared link into an already-open tab did nothing.
- **Two preset claims were written before they were checked, and both were false.** This implementation's tie-breaking does *not* choose the misattributed brace, and two functions swapping order does not make patience win. Both presets were replaced with inputs that genuinely demonstrate the phenomenon, and `tests/presets/` now asserts each claim. The rule that came out of it — *assert a preset's phenomenon when adding one* — is written into the repo's working instructions.
- **A late reframe of the audience.** A cluster of five design/copy commits rebuilt the site around "someone who has never run `git diff`": the home page was reordered to question → worked example with no jargon → the idea in three steps → why diffs blame the wrong line → *only then* notation and glossary. Labels moved above inputs (they were re-flowing beside the wrong control at narrow widths), the lattice gained axis labels — the one thing a newcomer cannot guess and which makes the whole picture read backwards if they guess wrong — and got capped and centred, because a five-line input was rendering an 800px square that pushed the controls below the fold.
- **A default-locale pivot.** The project began Indonesian-first and was renamed and re-defaulted to English (`feat: rename to Myers Visualizer, and default to English`) — including rewriting the shared preset sample text, without disturbing the structural properties the preset assertions depend on. Both locales remain; algorithm terms deliberately stay English in both so a reader recognises them in the paper and in source code afterwards.
- **Static-export sharp edges, found by reading the built HTML.** Next's `app/manifest.ts` route ignores `metadata.manifest` and emits a link with no `basePath` — a silent 404, so no install prompt and nothing on screen to say so. The manifest is now a static file pinned by a test against the brand constants, palette and basePath. Separately, `metadataBase` already carries the basePath, so a root-relative Open Graph image got it twice.
- **A known, accepted cost.** At the input cap there's a one-time ~100–200 ms hitch when the result lands — deserialising 135,000 trace events from the worker and building the timeline is main-thread work (the search itself never touches the main thread). Dropping a parallel array roughly halved it; going further would mean changing the trace wire format to typed arrays, which was judged not worth it at the cap.
- **Scope held.** No file upload, no directory diff, no three-way merge, no AST diffing, no accounts. And the site states plainly that git applies additional heuristics — it does not claim byte-identical parity with `git diff`.

## 8. Status

**Live and deployed:** https://andifathulms.github.io/myers-visualizer/ — verified against the live URL with the smoke suite (15/15 passing).

- **Public repository:** https://github.com/andifathulms/myers-visualizer (licensed, open source).
- **Production, not prototype** — every milestone in the PRD (M0–M7) is built. Static export deployed from `main` by GitHub Actions; installable as a PWA and fully functional offline after first load.
- Working tree clean at time of writing; the full test suite, the apply property, and the brute-force oracle are green.
- **Known-unverified:** the animation *as a thing to look at*. Tests cover wiring, accessible text, pixels and cost — not whether it reads well.

## 9. Metrics

| | |
|---|---|
| **Commits** | 25 |
| **Time span** | 2026-08-04 → 2026-08-05 (first commit to last) |
| **Tracked files** | 111 |
| **TypeScript/TSX** | ~8,900 lines |
| — engine + libs (`lib/`) | 3,315 lines (of which `lib/diff/` ≈ 1,750) |
| — UI (`components/`) | 2,589 lines |
| — tests (`tests/`) | 2,123 lines |
| — app routes + layout + worker | ~700 lines |
| — build/verify tooling (`scripts/`) | 573 lines |
| **Test cases** | 152 across 24 test files |
| **Algorithms implemented from scratch** | 4 (greedy Myers, linear-space Myers, patience, histogram) + a BFS oracle |
| **Pages** | 4 public routes × 2 locales (home, graph, comparison, presets) + a benchmark route |
| **Presets** | 8, each with an asserted phenomenon |
| **Locales** | 2 (English default, Indonesian), ~530 lines of dictionary |
| **Bundle** | 87.4 KB gzipped shared first-load JS; 107 KB on the graph page — against a 250 KB budget |
| **Render** | 300×300 lattice, 220 measured frames: draw mean 0.13 ms / p95 0.30 ms; frame median 16.70 ms = 59.9 fps |
| **Worst case at the input cap** | `D = 600`, 135,152 search steps, 362,404 `V` cells — and the UI stays responsive |

*Note: the commit count is low relative to the line count — work landed in large, milestone-sized commits with detailed messages, not incremental ones.*

## 10. Suggested screenshots

1. **The edit graph mid-search** — the signature view, and the one image that carries the whole project. Capture with the explored region filled, the turmeric frontier advancing, the madder path drawn back through it, the `V` strip beside it and the ambiguity count visible.
   `app/[locale]/graf/page.tsx` → [components/graf/GraphView.tsx](components/graf/GraphView.tsx), [components/lattice/LatticeCanvas.tsx](components/lattice/LatticeCanvas.tsx), [components/lattice/render.ts](components/lattice/render.ts), [components/vstrip/VStrip.tsx](components/vstrip/VStrip.tsx)
   *(An existing export lives at `docs/media/edit-graph.png`.)*

2. **The four-algorithm comparison** — the clearest single-frame argument in the project: all four agree on `D = 5`, and patience still halves the hunk count. This is the "why does `--patience` exist" answer as a picture.
   `app/[locale]/banding/page.tsx` → [components/compare/CompareView.tsx](components/compare/CompareView.tsx)
   *(Existing export: `docs/media/comparison.png`.)*

3. **The ambiguity view on the `brace-misattribution` preset** — the count of equally minimal scripts plus the alternatives side by side. This is the insight no other tool offers and the most quotable moment for a case study.
   [components/ambiguity/AmbiguityPanel.tsx](components/ambiguity/AmbiguityPanel.tsx), [components/hunks/Hunks.tsx](components/hunks/Hunks.tsx), presets in [data/presets/index.ts](data/presets/index.ts)

4. **Linear-space mode with the middle snake** — two frontiers converging, the middle snake flaring where they meet, and the memory counter showing O(D²) vs O(N+M) as an actual number. The piece most likely to impress an engineer reviewing the work.
   [lib/diff/linear.ts](lib/diff/linear.ts) driving [components/lattice/LatticeCanvas.tsx](components/lattice/LatticeCanvas.tsx); stats in [components/chrome/StatBar.tsx](components/chrome/StatBar.tsx)

*Optional fifth:* the home page's worked example — jargon-free, and the best evidence of the "written for someone who has never run `git diff`" reframe. `app/[locale]/page.tsx`
