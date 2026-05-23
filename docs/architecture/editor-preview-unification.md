# Editor ↔ Preview Unification — Architecture and Contributor Rules

**Read this before adding any new panel feature.** The editor and the preview
must render visually identical output. Adding a feature to one and not the
other is a bug, and CI will catch it.

## The pattern: shared visual core + mode-specific wrapper

```
                ┌──────────────────────────────────┐
                │     SharedX  (panel/SharedX.tsx) │
                │     pure visual rendering        │
                │     no chrome, no interactions   │
                └────────────────┬─────────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              ▼                                     ▼
  ┌───────────────────────┐         ┌──────────────────────────┐
  │  Editor wrapper       │         │  PanelRenderer (preview) │
  │  - drag handlers      │         │  - bare delegation       │
  │  - selection outline  │         │  - no chrome             │
  │  - resize handles     │         │                          │
  │  - opacity for hidden │         │                          │
  └───────────────────────┘         └──────────────────────────┘
```

**Rule of thumb**: anything that *visually renders to pixels* lives in the
SharedX core. Anything *interactive* (drag, edit, hover, selection) lives in
the wrapper. The wrapper can pass interaction handlers down (e.g.,
`innerSpanProps={{ onMouseDown: ... }}` on `SharedLabel`), but the SharedX
component itself is mode-agnostic.

## The rule for new features

> **Adding a new control type, label feature, section style, or banner property
> means editing exactly ONE shared component.** Both modes pick it up
> automatically. If you find yourself editing the editor *and* the preview
> render paths for the same visual change, stop and extract a shared core.

The mechanical enforcement is `npm run drift:verify` in CI. If you edit one
side and the editor↔baseline drift changes, the gate fails.

## Current shared cores

| Primitive | Shared component | Editor wrapper | Preview render | Status |
|---|---|---|---|---|
| **Labels** | `src/components/panel/SharedLabel.tsx` | `src/components/panel-editor/LabelLayer.tsx` | `src/components/controls/PanelRenderer.tsx` (line ~600) | Unified in PR #120 |
| **Control bodies** | `src/components/controls/{Knob,PanelButton,Slider,Wheel,PadButton,ValueDial,Lever,Port,TouchDisplay,JogWheelAssembly,DirectionSwitch,JogDisplay}.tsx` | `src/components/panel-editor/ControlNode.tsx` (wraps in `<Rnd>` for drag) | `src/components/controls/PanelRenderer.tsx` (renders directly) | Body components already shared; wrappers are mode-specific by design |
| **Banner styles** | `src/lib/banner-style.ts` (`computeBannerBoxStyle`, `computeBannerTextStyle`) | `src/components/panel-editor/PolishBannerLayer.tsx` | `src/components/controls/PanelRenderer.tsx` (line ~500) | Style functions are shared; consuming JSX is duplicated but uses the same style outputs |
| **Sections** | None (both modes render independently) | `src/components/panel-editor/SectionFrame.tsx` | `src/components/controls/SectionContainer.tsx` (full mode) + inline header-only branch in `PanelRenderer.tsx` | Measured drift is ≤1 px horizontal; extraction deferred until drift increases |

## The verifier

`e2e/editor-preview-baseline.ts` measures every element with a `data-*-id`
attribute (`data-label-id`, `data-control-id`, `data-section-id`,
`data-banner-id`) and compares editor vs. preview pixel-for-pixel.

```bash
npm run drift:capture    # save current state as the new baseline
npm run drift:verify     # fail if editor differs from baseline
npm run drift:report     # measure RIGHT NOW + print per-kind table
                         # ("does editor agree with preview today?")
```

- `--capture` writes JSON fixtures into `e2e-snapshots/editor-preview-baseline/`.
- `--verify` compares the *current* rendered state to those fixtures and exits
  non-zero on any editor drift beyond the sub-pixel tolerance (0.1 px locally,
  0.5 px in CI to absorb Linux glyph rendering variance).
- `--report` re-measures both modes and prints a per-kind summary — use this
  to decide whether a SharedX extraction is worth doing for that primitive.

## When you add a new primitive

If you're adding something genuinely new (e.g., an LED strip, a logo badge,
a touch ribbon overlay):

1. Build it as `src/components/panel/SharedLedStrip.tsx` — pure visual.
2. Wire the editor wrapper (drag handle / selection / properties form).
3. Wire `PanelRenderer.tsx` to render it (delegate to the same shared core).
4. Run `npm run drift:report` to confirm the new element type shows 0 px
   drift between editor and preview from the start.
5. Run `npm run drift:capture` to lock the baseline.
6. Commit; the CI gate now enforces it forever.

## Anti-patterns

- **"Mode-aware monolith"** — accumulating `if (mode === 'editor')` branches
  inside a "shared" component. That's just two paths in a trench coat. Use
  two wrappers around a shared core instead.
- **"Style functions only"** — `banner-style.ts` shares only computed CSS but
  the consuming JSX duplicates in two files. This was acceptable when the JSX
  was small; if it grows, extract a `SharedBanner` component too.
- **"Add to PanelRenderer, forget the editor"** — every primitive must work
  in both modes. The CI gate catches additions on one side because the editor
  baseline drifts from itself across PRs.
- **"Manifest-data-driven drift"** — when contractor data on disk
  (`.pipeline/<device>/manifest-editor.json`) changes, baselines need
  re-capturing. That's expected and not a failure; re-run
  `npm run drift:capture` and commit.

## Hygiene

- iCloud Drive sync conflicts produce `<name> 2.<ext>` files. These are
  auto-ignored by `.gitignore`. Never `git add -f` them.
- `.pipeline/*/manifest-editor-backup-*.json` are runtime artifacts of the
  editor's auto-save throttle. Auto-ignored. Don't commit.
- `.githooks/pre-push` blocks pushing any staged `* 2.<ext>` file even if
  someone bypassed `.gitignore` with `-f`. Hook auto-installs via the
  `prepare` script on `npm install`.

## History

- **PR #120** (2026-05-13): Introduced `SharedLabel`. Eliminated 3-6 px
  text-centering drift on contractor's reported Fantom-06 labels (DEC,
  INC, SHIFT, EXIT, ENTER).
- **Phase A/B (this PR)**: Added `--report` mode, per-kind drift table,
  iCloud-dupe enforcement, CI gate workflow. Measured residual drift to
  be ≤1 px horizontal across all 3 devices — confirming labels were the
  acute problem and other primitives don't need extraction yet.
