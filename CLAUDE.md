# CLAUDE.md — Myers Visualizer

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
- Algorithm terms stay in English in code and UI. Interface copy exists in both locales; English is the default and `/id` is the second locale. Every string lives in `lib/i18n/dictionary.ts` — nothing user-visible is inline in a component.
- Preset sample text is English in both locales: it is one shared body of data, and the default locale is English.
- Preset ids stable and readable: `brace-misattribution`, `pure-insert`, `worst-case`, `patience-wins`. They appear in shared URLs.
- Tailwind utilities inline; semantic tokens in `tailwind.config.ts` — `cotton`, `indigo`, `deepIndigo`, `turmeric`, `madder`, `explored`. Never raw hex in components.

## Design system

Colour is authored in `lib/palette.ts` and restated as RGB channels in `app/globals.css`, because canvas needs hex and Tailwind needs channels to apply an alpha. A hex literal belongs in the palette and nowhere else — not in a component, not in the CSS. Sizes and rhythm are custom properties in `globals.css`, surfaced through `tailwind.config.ts`.

`tests/ui/tokens.test.ts` holds all of it: the CSS matches the palette, no stray hex, every text tone clears 4.5:1 on **both** surfaces, and nothing uses a font size off the scale.

- **Lattice tokens are normative and fixed** — `indigo`, `explored`, `turmeric`, `madder`. `madder` still means *this is the answer*: the chosen path and the middle snake, plus focus rings, and nothing else. A pressed button, a selected tab or a deleted line must not use it.
- **Surface tokens** — `cotton` is the ground, `paper` is a raised surface, `rule` is the hairline between them. Cards are `.card` (globals.css): paper, one hairline, a whisper of shadow. Grouping is what makes the tool legible; nothing should float on the ground alone.
- **Text tones** — `deepIndigo` primary, `muted` secondary (5.05:1 on cotton, 5.78:1 on paper), `indigo` for lede paragraphs. Do not use opacity to fake a text tone: `muted/60` was 2.7:1. Contrast claims here are measured by the test, not estimated — the previous `muted` advertised 5.5:1 and was 4.34:1 on the ground.
- **`added` / `removed`** are the diff output's two directions, tinted as well as coloured so the signal is not colour alone. Deliberately not `madder`.
- **Type scale** — serif (Newsreader) for headings only; sans (Inter) for interface; mono (DM Mono) for every figure, token id, and diff line. One scale, named by role, replacing Tailwind's own so an off-scale class produces nothing at all: `micro` (11px, uppercase labels with `tracking-[0.07em]`), `fine` (13px, mono figures), `sm` (14px, secondary interface), `base` (16px, **all** prose), `lg` (18px, ledes), then `h3`/`h2`/`h1`/`hero`, which clamp rather than switching at a breakpoint. Nothing smaller than 11px. Line height rides on the scale — do not add a `leading-*`. Prose gets `.measure` (64ch).
- **Rhythm** — `--space-gutter`, `--space-stack`, `--space-section`, `--space-hero`, as `px-gutter` / `py-section` and friends. The distance between two sections is a token, not a guess per page.
- **Controls** live in `components/ui/controls.tsx` — `Button`, `Field`, `Select`, `Toggle`, `Note`. Minimum 32px tall, labels above inputs, never beside. `Panel` and `StepHeading` are in `components/ui/Panel.tsx`.
- **Contestedness is a count, never a confidence.** `sharesOfScript` says how many of the minimal scripts attribute a line the way the one on screen does. It is a count over a set — nothing there claims one attribution is likelier. It is exact or absent: null above `COUNT_CAP`, never rounded. Only contested lines are badged; badging the forced ones buries the finding.
- **The tie-break is derived, not stored.** `tiedAt` reads it back out of the V history already recorded for the backtrack, so the trace format owes it nothing. Greedy Myers only — the linear-space variant's predecessors come from two frontiers meeting, and reading this derivation into it would be a lie dressed as a readout. The copy must keep saying this is *this* implementation's tie-break.
- **Every panel carries a plain-language `hint`.** Algorithm terms stay English by policy, so each one is glossed where it appears — plus the glossary on the home page. A new panel without a hint is not finished.
- **Brand assets.** Masters live in `exports/`, which is **gitignored** — it is a design output folder, not a build input. The subset the site ships is committed: `app/icon.svg` (favicon, the one-bend form), `app/apple-icon.png` (180px, iOS home screen), `public/brand/` (192/512/maskable PWA icons and the 1200×630 social card). Copy a new size in rather than pointing the build at `exports/`. The mark's own colours are `BRAND` in `lib/palette.ts` and are **not** UI tokens: the kit reserves green for the path itself, and the cream and red dots mean start and wrong-attribution — never swapped. Below 40px only the one-bend staircase is drawn; `components/chrome/BrandMark.tsx` is the only place that renders it in the interface.
- **The home page opens with the picture.** `components/home/HeroFigure.tsx` is a still edit graph in inline SVG — no JavaScript, in the first paint, since a hero that waits for hydration is not a hero. Its route is hand-drawn, so `tests/ui/hero-figure.test.tsx` asserts it against what `lib/diff` actually returns for the worked example. Change the drawing, change the assertion.
- The home page is ordered for someone who has never run `git diff`: picture → question → worked example with no jargon → the idea in three steps → why diffs blame the wrong line → notation → **the same example searched, with real d, k and V** → glossary → paper. Do not move the notation up, and keep the numeric walkthrough after it: it is the notation being used, so it has to come second. Its values are pinned to `lib/diff` by `tests/ui/walkthrough.test.ts` — hand-written numbers on this site have been wrong before.

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

Green: apply property and oracle agreement across the corpus for every algorithm, minimality ordering, cross-variant `D` equality, trace well-formedness, determinism, step budget at the input cap. First-load JS is 87.4 KB gzipped shared, 107 KB on the graph page, against the 250 KB budget.

**The M0 gate is measured.** `pnpm bench:render` builds, serves under the production basePath, drives the spike in headless Chrome and reads the numbers back, exiting non-zero if the budget is blown. On a 300×300 lattice over 220 measured frames (20 discarded as warm-up):

| | |
|---|---|
| draw mean | 0.13 ms |
| draw p95 | 0.30 ms |
| frame median | 16.70 ms — **59.9 fps** |
| frame p95 | 17.20 ms |
| budget | 16.7 ms |

Read it correctly. `draw` is CPU time submitting canvas commands, so on its own it would not prove rasterisation keeps up — the frame interval is what does: rAF held 60fps for 220 consecutive frames *while* doing this work every frame. Headless Chrome rasterises in software, so this is a conservative floor rather than a best case.

The bench is **not in CI**: a timing benchmark on a shared runner produces false failures, and puppeteer's Chrome download is a large per-run cost. `tests/render/frame-cost.test.ts` guards the property the number depends on — per-frame work is O(frontier), not O(N·M) — cheaply and deterministically, and the browser bench calibrates it. Re-run the bench after any change to `components/lattice/render.ts`.

**`pnpm test:browser` smokes the built export in real Chrome**, which is the only place two shipped paths run at all: the worker (jsdom has no `Worker`, so the unit tests only ever hit the synchronous fallback) and the painting (a jsdom canvas is a stub, so the lattice was otherwise verified by counting draw calls). It reads pixels back, confirms the worker chunk is requested, and checks the worst case at the cap — `D = 600`, 135 152 steps, 362 404 `V` cells — stays responsive.

Two things that pass came out of running it, and are worth keeping in mind:

- The hash was only read on mount, so pasting a shared link into an already-open page did nothing. It now listens for `hashchange`. Our own writes use `replaceState`, which never fires it, so there is no loop.
- At the cap there is a one-time ~100–200 ms hitch when the result lands: deserialising 135 000 trace events from the worker and building the timeline is main-thread work. The search itself never touches the main thread. Removing the timeline's parallel `stamps` array roughly halved it; going further means changing the trace wire format to typed arrays.

Still unverified: the animation as a thing to look at. The tests cover the wiring, the accessible text, the pixels and the cost — not whether it reads well.

**Deployed:** https://andifathulms.github.io/myers-visualizer/ — verified live with `SMOKE_URL=… pnpm test:browser`, 15/15.

`basePath` must match the repository name, and `scripts/postbuild.mjs` hardcodes it too when generating the service worker. Renaming the repository means changing both. That script also hardcodes `DEFAULT_LOCALE` to pick the offline navigation shell; it must match `lib/i18n/locales.ts`. `public/manifest.webmanifest` carries the basePath on every URL too — it is a static file because Next's `app/manifest.ts` route ignores `metadata.manifest` and emits a link without the basePath, which 404s silently. `tests/ui/manifest.test.ts` pins it against `lib/brand.ts`, the palette and the basePath, and `pnpm test:browser` fetches the icons for real.

Two preset claims were written before they were checked, and both were false: this implementation's tie-breaking does *not* choose the misattributed brace, and two functions swapping order does not make patience win. Both presets were replaced with inputs that demonstrate the phenomenon, and `tests/presets/` now asserts each claim. **Assert a preset's phenomenon when adding one.**
