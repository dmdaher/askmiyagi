# 2026-05 Master Roadmap

> Single source of truth for plan state, priorities, attack order.
> Re-audited 2026-05-18 after PRs #139 → #146 merged/opened (8 PRs since last audit). **A1 renderer extraction COMPLETE.**

---

## TL;DR

**31 plan files audited. 23 shipped. 4 deferred/killed. 4 active. 2 in-flight PRs (#145, #146).**

### Recommended next 3 moves

1. **🥇 Path A — Tutorial-Review Pause Phase** (~3 hr, 88% conf) — gate between tutorial-build and tutorial-pr. Without it, future runs auto-PR tutorials to `test` with no review.
2. **🥈 Path B — Run CDJ-3000 to generate 23 tutorials** (½-1 day, after Path A) — first real tutorial output for a pipeline-built device.
3. **🥉 A8 — LED Parts 2 + Pre-tutorial blockers** (~5-6 hr) — `ledStyle` field + wiring LED rendering to respond to `ledOn` state. Required for tutorials to show LED feedback. (Replaces A1 in #3 slot — A1 shipped.)

---

## 📦 SHIPPED (no action needed)

Items shipped or merged. Move to historical reference.

### 2026-05-17 → 2026-05-18 — A1 Renderer extraction complete + auto-export

| # | What | PR | Plan(s) closed |
|---|---|---|---|
| ✅ | Roadmap audit pass (this doc updates) | #139 | doc-maintenance |
| ✅ | 3 editor bug fixes: label position after hidden + circle button bg + z-order | #140 | editor-bugfixes |
| ✅ | A1 PR-1 — render-helpers consolidation (renderLabelText, inferPortVariant, mapButtonLabelPosition, resolveDisplayContent) | #141 | **A1 PR-1** |
| ✅ | A1 PR-2 + 2.5 + 2.6 — SharedCircleButton + circle Rnd wrapper alignment + linked-label z-order (OFFSET=0 final) | #143 | **A1 PR-2 + emergent fixes** |
| ✅ | A1 PR-3 — SharedLed (dot + dual-label + bar variants) | #144 | **A1 PR-3** |
| 🟡 | A1 PR-4 — manifest-field-completeness test (catches storeToManifest threading bugs) | #145 OPEN | **A1 PR-4** |
| 🟡 | Auto-export production manifest on every contractor save (closes "forgot to Export" gap) + removes manual Export button | #146 OPEN | new initiative |
| 🟡 | Worktree symlink hygiene: `bin/setup-worktree.sh` + CLAUDE.md correction | PR pending | new initiative (prevents `git checkout -- .pipeline/<file>` from destroying the symlink) |

**A1 plan is now CLOSED.** All 4 planned PRs (helpers, SharedCircleButton, SharedLed, manifest-completeness test) plus 3 emergent fixes (circle wrapper alignment, linked-label z-order, OFFSET=0 wedge prevention) shipped or in-flight.

### 2026-05-15 → 2026-05-16 — Editor parity + selection unification + Phase 10

| # | What | PR | Plan(s) closed |
|---|---|---|---|
| ✅ | Drift measurement + hygiene + CI gate | #121, #122 | new initiative |
| ✅ | impact-check skill + CLAUDE.md gate | #123 | new initiative |
| ✅ | 40px preview-mode shift fix + PREVIEW MODE badge | #124 | editor-bugfixes |
| ✅ | Auto-save guardrails (`?nosave=true` + view-state) | #125 | editor safety |
| ✅ | Inter web font via `next/font` (cross-platform consistency) | #126 | font initiative |
| ✅ | Section body-only mode + showTitleBanner toggle | #127 | A.III component |
| ✅ | Hide Section toggle + drift:ci 33% faster | #128 | A.III component |
| ✅ | Onboarding docs refresh + worktree-compatible git hooks | #129 | **M1 closed** |
| ✅ | Linked labels snap to grid when control moves | #130 | A5 supporting |
| ✅ | Unified selection schema (MS1) | #131 | **A5 starts** |
| ✅ | Preflight manuals survive worktree cleanup | #132 | C1 part |
| ✅ | Label multi-select + cross-type deselect (Phase 2+3) | #133 | **A5 continues** |
| ✅ | Entity-agnostic move/delete + cross-type drag (Phase 4) | #134 | **A5 continues** |
| ✅ | MixedSelectionPanel cross-type selections (Phase 5) | #135 | **A5 continues** |
| ✅ | Delete legacy selection fields (Phase 6) | #136 | **A5 closed** |
| ✅ | Label align + distribute with auto-anchor (Phase 7) | #137 | **A7 label-align closed** |
| ✅ | Auto-fit `controlScale` for fresh instruments (Phase 10) | #138 | new initiative |

### Tonight (2026-05-14)

| # | What | PR | Where |
|---|---|---|---|
| ✅ | Throttle race fix + Figma history UI + banner refresh | #117 | live on `test` |
| ✅ | Display Builder SOUL rewrite + 4 validators + 30 unit tests | #116 | live on `test` |
| ✅ | State.json untrack (root-cause persistence fix) | #118 | live on `test` |
| ✅ | CDJ-3000 state reconstruction (10 phases + 22 display files) | #118 | live |
| ✅ | parseBatchesFromExtractor logic bug fix + 8 unit tests | #118 | live |
| ✅ | Anti-anchoring scrub for cross-device contamination | #116 / #118 | live |
| ✅ | All 10 instruments audited + state corrected | local | applied |
| ✅ | RC-505 decision — killed | n/a | archived |
| ✅ | parseBatches: tutorial batches now extracted from markdown table | #118 | live |

### Earlier 2026-05

| # | Plan | PR | Notes |
|---|---|---|---|
| ✅ | Polish banner feature | #114 | Shipped, archived |
| ✅ | Tutorial renderer parity (displayState + zones + LED state) | #101 | Shipped, archived |
| ✅ | Hosted contractor history feature (foundation) | #115 | Shipped, archived |
| ✅ | Scale drift fix | (multiple) | Shipped, archived |
| ✅ | LED indicators (L1 + L2 + L6) | (multiple) | Shipped, archived |

### 2026-04 foundations

| # | Plan | Notes |
|---|---|---|
| ✅ | PanelRenderer replaces codegen | Shipped foundation, archived |
| ✅ | Contractor flow rewrite | Shipped foundation, archived |
| ✅ | Blob backup audit fix | Shipped via #115, archived |
| ✅ | Panel editor spec | Foundational, in production |
| ✅ | Manifest repair cache cleanup | Workaround in place; deferred polish |

**Archive index:** `~/.claude/plans/archive/2026-05/MOVED.md`

---

## ❌ KILLED / DEFERRED INDEFINITELY

| # | Plan | Reason | Date |
|---|---|---|---|
| ❌ | RC-505 mk2 restart | User decision — not shipping RC-505. Dashboard registration kept for re-enable option | 2026-05-14 |
| ❌ | YouTube tutorial discovery (duplicate) | Superseded by `2026-future-tutorial-content-discovery.md` | 2026-05-13 |

---

## 🎯 ACTIVE PLANS — by Category & Tier

Numbering reset for clarity. Confidence scores updated post-merges.

---

### 🎨 Category A — Editor Hardening

#### A.I Foundation (must do first)

##### ~~A1~~ ✅ SHIPPED — Editor/Preview renderer extraction (PRs #141, #143, #144, + #145 open)
> Plan: `~/.claude/plans/nested-coalescing-squid.md` — archive on next pass.
> 5 PRs total. SharedLabel (PR #120, prior) + render-helpers (PR #141) + SharedCircleButton (PR #143) + SharedLed (PR #144) + manifest-completeness test (PR #145 open). 3 emergent fixes embedded in #143: circle Rnd wrapper alignment, linked-label z-order with OFFSET=0 wedge prevention. ControlNode ↔ PanelRenderer duplication closed.

#### A.II Quick wins (independent, < 2 hrs each)

##### A2 | Ruler tool
- 🔗 `docs/plans/2026-04-29-ruler-and-pipeline-reset.md` (ruler only; reset shipped)
- 💯 **82%** · ⏱️ 1.5-2 hr · 🎯 #1
- 📝 Figma-style edge rulers with adaptive tick density + R-key toggle. Pure view component.

##### A3 | Sizing input fixes (REMAINING — Issue 3 only)
- 🔗 `docs/plans/2026-04-30-sizing-input-fixes.md`
- 💯 **70%** · ⏱️ ~45 min · 🎯 #2
- 📝 Issue 1 (dual-label minimum) + Issue 2 (geometry backspace) shipped in `e1e341b`. **Remaining:** Issue 3 — circle button icons don't scale with button size.

##### A4 | LED z-order Part 3
- 🔗 `docs/plans/2026-04-26-led-zorder-plan.md` (Part 1 SHIPPED)
- 💯 **84%** · ⏱️ 1.5 hr · 🎯 #3
- 📝 Move-to-front/back/forward/backward + ⌘]/⌘[ shortcuts. Additive `zOrder` field on controls.

#### A.III UX features (post A1)

##### ~~A5~~ ✅ SHIPPED — Mixed selection (PRs #131–#136)
> Plan: `docs/plans/2026-05-04-mixed-selection-labels-controls-P1.md` — archive on next pass

##### A6 | Keyboard fixes + Add Control
- 🔗 `~/.claude/plans/parsed-exploring-pumpkin.md`
- 💯 **78%** · ⏱️ 4 hr · 🎯 #2
- 📝 Per-MIDI black key offsets, right-click "Add Control" modal, click-to-edit keyboard via Properties.

##### A7 | Containers + labelColor (REMAINING — label-align shipped)
- 🔗 `docs/plans/2026-04-27-label-align-containers-plan.md`
- 💯 **80%** · ⏱️ ~4 hr · 🎯 #3
- 📝 9-position labelAlign grid + auto-anchor shipped in PR #137. **Remaining:** `labelColor` field + `ControlContainer` (visual grouping primitive) + dual-label LED type mismatch fix.

##### A8 | LED Parts 2 + Pre-tutorial blockers (MERGE)
- 🔗 `docs/plans/2026-04-26-led-zorder-plan.md` (Part 2) + `docs/plans/2026-04-26-pre-tutorial-blockers.md`
- 💯 **87%** · ⏱️ 5-6 hr · 🎯 #4
- 📝 ledStyle field (integrated vs dot) + wiring LED rendering to respond to `ledOn` state. Required for tutorials to show LED feedback.

#### A.IV Design system (final pass)

##### A9 | Themes/skins
- 🔗 `docs/plans/2026-04-27-themes-skins-design.md`
- 💯 **72%** · ⏱️ 10-12 hr · 🎯 #1 — defer until A.III done
- 📝 CSS variable theming on PanelShell for monetization (premium skins).

##### A10 | Context management docs split
- 🔗 `docs/plans/2026-04-30-context-management.md`
- 💯 **60%** · ⏱️ 4-6 hr · 🎯 #2 (low urgency)
- 📝 Split monolithic `docs/ARCHITECTURE.md` into modules + `INDEX.md` status tracker.

---

### 📚 Category B — Tutorial Pipeline Unblock

#### B.I Infrastructure prerequisites — ALL SHIPPED ✅

#### B.II New agent — SHIPPED ✅

Display Builder SOUL + validators + parser fix landed in PR #116 + #118.

**Remaining B.II work for the agent to be FULLY operational:**
- Path A (tutorial-review pause phase) — see B.V below

#### B.III Parity polish — SHIPPED ✅

#### B.IV Maintenance

##### B11 | Tutorial regeneration strategy
- 🔗 `~/.claude/plans/tutorial-regeneration-strategy.md`
- 💯 **75%** · ⏱️ 1-2 days · 🎯 #1 — trigger: first hand-fix of a tutorial
- 📝 @preserve flags + diff-merge strategies. Defer until first contractor hand-edit gets clobbered by regen.

#### B.V NEW Tutorial Review Phase (added 2026-05-14)

##### B12 | Path A — Tutorial-Review Pause Phase 🎯 **NEXT PRIORITY**
- 🔗 `~/.claude/plans/2026-05-14-tutorial-generation-and-review-phase.md`
- 💯 **88%** (P:95% / S:85% / R:88%)
- ⏱️ 3 hours · 🎯 **#1 OVERALL**
- 📝 New `phase-tutorial-review` between tutorial-build and tutorial-pr. New escalation type `'tutorial-review'`. Pause for admin approval before any tutorial PR opens. Mirrors proven contractor-pause pattern.
- ⚠️ **Without this, the moment we fix anything else, the pipeline will auto-PR tutorials to `test` with no review.**

##### B13 | Path B — CDJ-3000 tutorial generation
- 🔗 Same plan as B12
- 💯 **78%** (depends on B12 shipping first)
- ⏱️ ½ to full day (mostly agent runtime)
- 🎯 #2 (after B12)
- 📝 Reset CDJ-3000 to phase-5-tutorial-build, run pipeline. parseBatches fix unlocks 5 batches / 23 tutorials. Cost ~$20-50.

##### B14 | Half B — `/admin/preview/<deviceId>` rich review UI
- 🔗 `~/.claude/plans/2026-05-instrument-preview-and-relink.md` (Half B)
- 💯 **76%** · ⏱️ 6-8 hr · 🎯 #3 — after Path A proves the basic flow
- 📝 Admin page that renders panel + steps through tutorials in real-time. Reuses TutorialRunner. Approve / undo / snooze controls.

##### B15 | Path C — Replicate Path B for other devices
- 🔗 Same plan as B12
- 💯 **70%** · variable
- 📝 alphatheta-cdj3000x, fantom-06, minimoog-model-d, dj-djs-1000. All have Layout Engine passed and are ready for extraction phase.

#### B.VI Tutorial content discovery (deferred to D)

---

### 🔧 Category C — Pipeline / Architecture

#### C.I Build phase reliability

##### C1 | Pipeline build-phase fixes (Parts A, C, E remaining)
- 🔗 `~/.claude/plans/2026-05-pipeline-build-phase-fixes.md`
- 💯 **78%** · ⏱️ ~5 hr
- Status notes:
  - Part B (post-check validators) — SHIPPED via PR #116
  - Part D (tutorial-review pause) — covered by B12 (Path A)
  - Parts A, C, E remain (display-builder reference hierarchy, auto-commit/push, branch cleanup)

#### C.II Architecture rethink

##### C2 | Instrument preview Half B
- 🔗 `~/.claude/plans/2026-05-instrument-preview-and-relink.md`
- Same plan as B14 above — listed in both categories because it serves both.

##### C3 | Relink architecture rethink
- 🔗 `~/.claude/plans/2026-05-relink-architecture-rethink.md`
- 💯 **40%** ⚠️ **DECISION REQUIRED**
- ⏱️ 30-60 min decision + 2-3 days implementation
- 📝 Multi-LED cluster labels (e.g. WAVEFORMS over 3 LEDs) currently get single-control relink suggestions which is semantically wrong. Four design options on table, no decision made. **Blocks Half B preview-relink work.**

#### C.III Plumbing cleanup

##### C4 | Manifest mutation safety
- 🔗 `~/.claude/plans/manifest-mutation-safety.md`
- 💯 **85%** · ⏱️ ~1 week · 🎯 #1 (foundational)
- 📝 Shared protocol for any control-ID mutation. First consumer: LED Layer 6 migration (already shipped). Pre-flight scan + decision tree.

##### C5 | Manifest repair cache cleanup
- 🔗 `~/.claude/plans/2026-05-manifest-repair-cache-cleanup.md`
- 💯 ~85% · ⏱️ 1 hr · 🎯 #2 (cosmetic, low priority)

#### C.IV One-off recovery — KILLED (RC-505)

---

### 🔍 Category D — Tutorial Content Discovery

##### D1 | Tutorial content discovery (canonical)
- 🔗 `~/.claude/plans/2026-future-tutorial-content-discovery.md`
- 💯 **72%** · ⏱️ 3-5 days
- 🎯 Deferred — trigger: 3+ instruments shipped with clean tutorials
- 📝 Mine YouTube transcripts for gap topics. Two modes (batch + on-demand chat).

---

### 🌐 Category E — Web / Marketing

##### E1 | Admin subdomain deployment
- 🔗 `~/.claude/plans/my-website-admin-subpages-luminous-music.md`
- 💯 **70%** · ⏱️ 6 hr · ⚠️ **PRODUCTION BLOCKER**
- 📝 `askmiyagi.music/admin` returns 404. `src/proxy.ts` is dead code — needs rename to `middleware.ts` + subdomain config + env var verification.

---

### 🛡️ Misc quick wins

##### ~~M1~~ ✅ SHIPPED — Onboard slash command fix (PR #129)

##### M2 | Dashboard sort/filter
- 🔗 `docs/plans/2026-04-18-dashboard-sort-filter.md`
- 💯 **85%** · ⏱️ 2 hr
- 📝 Sort + manufacturer filter + "Ready for Editor" toggle. ~40 LOC client-side.

---

## 📊 Attack order recommendation

### This week — first 3 sessions
1. **B12 Path A — Tutorial-Review Pause Phase** (3 hr) ← unblocks everything else in tutorial flow
2. **B13 Path B — Run CDJ-3000 tutorials** (overnight pipeline) ← first real tutorial output
3. **A8 — LED Parts 2 + Pre-tutorial blockers** (5-6 hr) ← `ledStyle` field + LED runtime state wiring (tutorial precondition)

### Next sprint — scale tutorial generation
4. **B15 Path C — replicate Path B for other devices** (variable) ← alphatheta-cdj3000x, fantom-06, minimoog-model-d
5. **A2 Ruler tool** (1.5 hr) ← Figma parity for contractor (was deferred but quick + high contractor value)

### Anytime in parallel
- **E1 Admin subdomain** (6 hr) ← production blocker but not urgent
- **M2 Dashboard sort/filter** (2 hr) ← admin workflow improvement
- **A2 Ruler tool** (1.5 hr) ← Figma parity for contractor
- **A4 LED z-order Part 3** (1.5 hr) ← Figma parity
- **A3 Issue 3** (45 min) ← circle button icon scaling

### When stable
- **C3 Relink decision** (30 min discussion) ← blocks Half B preview-relink
- **B14 Half B preview UI** (6-8 hr) ← after Path A proves the basic flow needs more
- **C1 Pipeline build-phase fixes** (5 hr) ← Parts A, C, E remaining
- **A7 Containers + labelColor** (4 hr) ← label-align already done

### Parked / decision needed
- **5 gatekeeper-failed devices** (ddj-flx4, dj-xdj-rr, fantom-07, deepmind-12, rc-505-mk2 — though rc-505 is killed) — separate strategy session
- **Deepmind-12 coverage rejection at 88.6%** — improve extraction or debate threshold
- **A9 Themes/skins** — wait for contractor demand signal

---

## 🚨 Cross-cutting protected systems — regression watch

For every active plan, check before execution:

| Protected system | At-risk plans | Mitigation pattern |
|---|---|---|
| Manifest schema | A6 (keyboard startNote), A7 (containers, labelColor), A8 (ledStyle) | Additive fields, backward-compat defaults |
| Autosave / Hosted Blob | Pull-from-hosted (latent: can overwrite local state — e.g. xdj-rr controlScale 2026-05-16) | Pre-pull `cp` backup; warn before pull if local has fields blob lacks |
| Send-to-hosted / pull workflow | A6 (keyboard) | Verify round-trip after change |
| History / undo | A4 (zOrder), A7 (containers) | New state via `pushSnapshot()` |
| Existing features | A3 (Issue 3 icon scaling) | Playwright before/after |
| Tutorial integrity | A6 (`startNote`), C4 (mutation safety) | Read-only enforcement; pre-flight scan |
| Pipeline reliability | C1, B12 (review phase) | Validators + escalation safety nets |
| Admin/contractor workflow | E1 (subdomain) | Env var pre-check, curl verification |
| Drift CI baselines | Any layout change | `drift:capture` immediately after intentional layout/font changes |

---

## 📚 Plan file inventory

### Active in `~/.claude/plans/`
```
2026-05-instrument-preview-and-relink.md  B14 / C2
2026-05-manifest-repair-cache-cleanup.md  C5
2026-05-pipeline-build-phase-fixes.md     C1 (Parts A, C, E)
2026-05-relink-architecture-rethink.md    C3
2026-05-14-tutorial-generation-and-review-phase.md  B12/B13/B15
2026-future-tutorial-content-discovery.md D1
manifest-mutation-safety.md               C4
my-website-admin-subpages-luminous-music.md  E1
parsed-exploring-pumpkin.md               A6
tutorial-regeneration-strategy.md         B11
```

### Ready to archive (✅ SHIPPED in May 2026)
```
get-up-to-speed-eager-dolphin.md                  ✅ M1 (PR #129)
nested-coalescing-squid.md                        ✅ A1 complete (PRs #141, #143, #144, #145 open)
2026-05-editor-renderer-extraction.md             ✅ A1 complete (same)
```

### Active in `docs/plans/`
```
2026-04-18-dashboard-sort-filter.md       M2
2026-04-26-led-zorder-plan.md             A4 (Part 3 only)
2026-04-26-pre-tutorial-blockers.md       A8
2026-04-27-label-align-containers-plan.md A7 (containers + labelColor remain)
2026-04-27-themes-skins-design.md         A9
2026-04-29-ruler-and-pipeline-reset.md    A2
2026-04-30-context-management.md          A10
2026-04-30-display-builder-agent.md       (REF — SOUL shipped)
2026-04-30-sizing-input-fixes.md          A3 (Issue 3 only)
2026-05-roadmap.md                        (this file)
```

### Ready to archive in `docs/plans/`
```
2026-05-04-mixed-selection-labels-controls-P1.md  ✅ A5 (PRs #131–#136)
```

### Archived to `~/.claude/plans/archive/2026-05/`
```
2026-04-05-panelrenderer-replaces-codegen.md
2026-04-07-contractor-flow-rewrite.md
2026-04-18-blob-backup-audit-fix.md
2026-05-polish-banner.md
panel-editor-spec.md
rc505-restart.md
scale-drift-fix.md
tutorial-renderer-parity.md
youtube-tutorial-discovery.md (if merged duplicate)
```

---

## How to use this roadmap

1. **At session start**: read TL;DR + Recommended next 3 moves.
2. **Picking a plan**: click the 🔗 to read the full plan file for current scoring + dependencies.
3. **After shipping**: move the plan to the "SHIPPED" section at top, archive the file.
4. **Disagreeing with a score**: edit this doc — it's the single source of truth.

---

*Last updated 2026-05-18 (post-PR #144 merge; #145 + #146 in-flight). A1 renderer extraction complete. Re-audit when 5+ plans ship or major architectural decisions land.*
