# Canvas QA Framework — Control ↔ Tutorial Linkage

> Pre-flight verification gate that runs before any instrument's
> tutorial-review canvas is shown to admin. Ensures every control on the
> panel is properly wired to the tutorials that reference it, every
> tutorial step highlights the right thing, and the visual result lights
> up as expected.

## Why this exists

The admin tutorial-review canvas is **the QA step**. If it shows the wrong
controls highlighted, missing highlights, or "extra" controls that no
tutorial talks about, the admin's whole review premise breaks down. End
users see the production tutorials downstream — what admin reviews here
is what they get. Bugs caught here are 100x cheaper than bugs caught in
production.

Discovered organically: the first walkthrough of cdj-3000 showed 35% of
expected highlights silently missing (every circle button + every LED).
Visual inspection alone would have missed it — the canvas "looked fine"
because the controls were rendered, they just weren't pulsing. The
framework below catches that class of bug deterministically.

## What it validates

Five independent layers, each catches a different failure mode:

### Layer 1 — Reference Integrity (deterministic, fast)

For each control ID in any tutorial's `highlightControls`:
- **MUST** exist in `src/data/manifests/<deviceId>.json`
- If absent → **HARD FAIL**: tutorial references a control that doesn't
  render. Tutorial-builder bug, blocks the canvas.

For each control ID in the manifest:
- **SHOULD** appear in `highlightControls` of at least one tutorial step.
- If absent → **WARN**: control on the panel is never taught. Either
  the control is decorative (intentional) or the tutorial set has a
  gap. Surfaced for review; doesn't block.

### Layer 2 — Visual Highlight Verification (Playwright, slow)

For each step in each tutorial, navigate the canvas to that step, then
for each ID in `highlightControls`:
- **MUST** render the cyan glow signal (`box-shadow` matching
  `rgba(0, 170, 255, *)` in computed style somewhere in the
  `[data-control-id="X"]` subtree, OR inline `z-index: 1000`).
- If absent → **HARD FAIL**: the control exists but isn't lighting up.
  PanelRenderer / shared component bug. Caught the original SharedLed +
  SharedCircleButton regression.

Also asserts:
- **No unexpected glows** — any control NOT in `highlightControls` for
  the current step must NOT glow. Catches stale animation state, store
  bleed between tutorial switches, accidentally-highlighted neighbors.

### Layer 3 — Semantic Coherence (heuristic, advisory)

For each step, build the "control intent" text from `title` +
`instruction` + `details` + `tipText`. For every manifest control
whose `label` appears in that text:
- If that control's ID is in `highlightControls` → **GOOD**.
- If that control's ID is NOT in `highlightControls` → **REVIEW**:
  the step mentions the control by name but doesn't highlight it. Either
  a missed highlight, or the mention is contextual ("unlike the X
  button, this one…"). Surfaced for human review; doesn't block.

Conversely, every ID in `highlightControls`:
- Whose `label` does NOT appear anywhere in step text → **REVIEW**:
  control is highlighted but never named in the prose. Could be
  intentional (visual emphasis without restatement) or could be wrong.
  Surfaced.

### Layer 4 — Visual Sample (Playwright, archival)

For every step, save a cropped screenshot of the panel preview +
ProgressBar + step content. Stored at:

```
/tmp/canvas-qa/<device-id>/<tutorial-id>/step-NN.png
```

These are the **visual proof** for admin: "yes, when the tutorial says
'press the SHORTCUT button,' the SHORTCUT button is the one glowing."

### Layer 5 — Cumulative State Integrity (deterministic)

(Already covered by `validateCumulativeState` in the tutorial-builder
pipeline phase; this framework just re-asserts it.)

Walks all steps in order, builds the cumulative panel state, asserts:
- No step references a control state that conflicts with an earlier
  step's state.
- Every step's `panelStateChanges` references real manifest controls.

## What it does NOT validate (out of scope)

- **Tutorial copy quality** — grammar, tone, accuracy of the
  instructions. That's the reviewer agent's job.
- **End-user accessibility** — alt text, contrast ratio (handled by
  separate axe-core sweep in a future PR).
- **Performance** — render time, animation jank (separate Lighthouse
  pass).
- **Cross-browser** — runs in Chromium only. Other browsers caught by
  visual regression tooling downstream.

## How to run

```bash
# Default: cdj-3000 against http://localhost:3000
npx tsx e2e/canvas-qa-suite.ts

# Different device
TEST_DEVICE=fantom-08 npx tsx e2e/canvas-qa-suite.ts

# Different base URL
TEST_BASE_URL=http://localhost:3001 npx tsx e2e/canvas-qa-suite.ts
```

Output:
- Console: per-layer summary, per-step verdicts, totals
- Markdown report: `/tmp/canvas-qa/<device-id>/REPORT.md` (linkable
  screenshots, sortable table)
- Screenshots: `/tmp/canvas-qa/<device-id>/<tutorial-id>/step-NN.png`

Exit code 0 if all hard-fail layers (1+2+5) pass. Non-zero otherwise.

## When to run

| Trigger | Reason |
|---|---|
| Before opening review canvas in admin | "Is this device ready to QA?" |
| After tutorial-builder produces new tutorials | catch ID drift |
| After PanelRenderer / shared component refactor | regression sweep |
| In CI on touch of `src/components/{controls,panel}/**` | guard |
| Per-instrument acceptance gate (added to `npm run` scripts) | ship gate |

## Adding a new instrument

1. Confirm `src/data/manifests/<device>.json` exists (auto-export from
   editor handles this).
2. Confirm `.pipeline/<device>/agents/tutorial-review/tutorials.json`
   exists (tutorial-builder pause produces it).
3. Run `TEST_DEVICE=<device> npx tsx e2e/canvas-qa-suite.ts`.
4. Triage:
   - HARD FAIL → block canvas, fix root cause
   - WARN → review; either fix or annotate the gap as intentional
5. After passing, ship to admin for human review.

## Premortem — ways this framework could give false confidence

1. **Glow detection signal is partial.** If a future control variant
   uses a different highlight color or animation, the regex
   `rgba(0, 170, 255, *)` misses it. → **Mitigation**: add a constant
   `HIGHLIGHT_SIGNAL` to the framework imported from a shared module so
   any new component is forced to use the same animation. Failed
   detection → fail the layer.
2. **Animation timing race.** Framer's keyframes interpolate; sampling
   between key frames might miss the signal momentarily. → **Mitigation**:
   sample twice with a 200ms gap; pass if either sample sees the glow.
3. **Off-screen elements pause animation.** Framer optimizes
   non-visible elements. → **Mitigation** (already implemented):
   scroll the deepest expected control into view before each
   measurement.
4. **Semantic coherence false positives.** Step text says "press the
   PLAY button" but the manifest label is "PLAY/PAUSE ►/II" so substring
   match fails. → **Mitigation**: normalize labels (strip
   punctuation, split on `/`), also match shortest unique word.
5. **Hot-reload eats your changes.** Dev server caches webpack chunks.
   → **Mitigation**: run against `npm run build && npm start` in CI;
   for local runs, the framework's preflight verifies the served bundle
   includes the expected highlight color string.
6. **One bad step blocks the whole run.** If step 3 fails, steps 4-N
   never measured. → **Mitigation**: per-step try/catch, collect all
   failures, report at end. Already implemented in walkthrough.
7. **New control type added without `highlighted` plumbing.** Same
   class of bug as the SharedLed regression, just with a different
   future component. → **Mitigation**: Layer 2's "must glow" assertion
   catches it the same way; CI gate makes it a hard fail on PR.

## /impact-check

| Dimension | Status | Detail |
|---|---|---|
| 🟢 Architecture | New e2e script + doc. No production code touched. | Test-only |
| 🟢 Manifest | Read-only |
| 🟢 Blob | None |
| 🟢 Editor / preview | Read-only via Playwright |
| 🟢 Backups | n/a |
| 🟢 Verification | This IS the verification |

## Roadmap (not in this PR)

- Wire as a CI gate triggered by changes to manifests or shared panel
  components.
- Add per-instrument `npm run qa:<device>` shortcut.
- Add accessibility sweep (axe-core) as Layer 6.
- Stream report to admin diagnostics panel for live view.
