# 2026-05 Master Roadmap

> Single source of truth for plan state, priorities, attack order.
> Rebuilt 2026-05-14 after merging PRs #116, #117, #118 and post-audit cleanup.

---

## TL;DR

**31 plan files audited. 13 shipped. 4 deferred/killed. 14 active.**

### Recommended next 3 moves

1. **🥇 Path A — Tutorial-Review Pause Phase** (~3 hr, 88% conf) — gate between tutorial-build and tutorial-pr. Without it, future runs auto-PR tutorials to `test` with no review.
2. **🥈 Path B — Run CDJ-3000 to generate 23 tutorials** (½-1 day, after Path A) — first real tutorial output for a pipeline-built device.
3. **🥉 A1 Editor/Preview renderer extraction** (~7 hr) — biggest editor-quality win, stops the editor-vs-preview parity bug class at the source.

---

## 📦 SHIPPED (no action needed)

Items shipped or merged. Move to historical reference.

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

##### A1 | Editor/Preview renderer extraction
- 🔗 `~/.claude/plans/2026-05-editor-renderer-extraction.md`
- 💯 Overall: **88%** (P:95% / S:88% / R:92%)
- ⏱️ 7 hours · 4 PRs
- 🎯 Priority: #1
- 📝 Extracts ~480 LOC of duplication between `ControlNode.tsx` and `PanelRenderer.tsx`. Snapshot-based parity tests prevent future drift. Stops the editor-vs-preview bug class that's chewed up the last month of bugfix work.

#### A.II Quick wins (independent, < 2 hrs each)

##### A2 | Ruler tool
- 🔗 `docs/plans/2026-04-29-ruler-and-pipeline-reset.md` (ruler only; reset shipped)
- 💯 **82%** · ⏱️ 1.5-2 hr · 🎯 #1
- 📝 Figma-style edge rulers with adaptive tick density + R-key toggle. Pure view component.

##### A3 | Sizing input fixes
- 🔗 `docs/plans/2026-04-30-sizing-input-fixes.md`
- 💯 **64%** ⚠️ needs impact analysis · ⏱️ 2 hr · 🎯 #2
- 📝 Dual-label minimum, geometry input backspace bug, icon scaling. Risk: dual-label minimum removal could clip — Playwright test at small sizes first.

##### A4 | LED z-order Part 3
- 🔗 `docs/plans/2026-04-26-led-zorder-plan.md` (Part 1 SHIPPED)
- 💯 **84%** · ⏱️ 1.5 hr · 🎯 #3
- 📝 Move-to-front/back/forward/backward + ⌘]/⌘[ shortcuts. Additive `zOrder` field on controls.

#### A.III UX features (post A1)

##### A5 | Mixed selection labels + controls
- 🔗 `docs/plans/2026-05-04-mixed-selection-labels-controls-P1.md`
- 💯 **83%** · ⏱️ 3 hr · 🎯 #1 (gates other label features)
- 📝 Figma-like multi-select of controls + standalone labels. 10-point premortem in plan. Linked labels stay single-select.

##### A6 | Keyboard fixes + Add Control
- 🔗 `~/.claude/plans/parsed-exploring-pumpkin.md`
- 💯 **78%** · ⏱️ 4 hr · 🎯 #2
- 📝 Per-MIDI black key offsets, right-click "Add Control" modal, click-to-edit keyboard via Properties.

##### A7 | Label alignment + containers
- 🔗 `docs/plans/2026-04-27-label-align-containers-plan.md`
- 💯 **82%** · ⏱️ 5-6 hr · 🎯 #3 (depends on A5)
- 📝 9-position labelAlign grid + labelColor + ControlContainer (visual grouping). Also fixes dual-label LED type mismatch.

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

##### M1 | Onboard slash command fix
- 🔗 `~/.claude/plans/get-up-to-speed-eager-dolphin.md`
- 💯 **95%** · ⏱️ 30 min · 🎯 highest confidence in the entire roadmap
- 📝 Fix 2 dead links in `.claude/commands/onboard.md`, add canonical 5-file reading order.

##### M2 | Dashboard sort/filter
- 🔗 `docs/plans/2026-04-18-dashboard-sort-filter.md`
- 💯 **85%** · ⏱️ 2 hr
- 📝 Sort + manufacturer filter + "Ready for Editor" toggle. ~40 LOC client-side.

---

## 📊 Attack order recommendation

### This week — first 3 sessions
1. **B12 Path A — Tutorial-Review Pause Phase** (3 hr) ← unblocks everything else in tutorial flow
2. **B13 Path B — Run CDJ-3000 tutorials** (overnight pipeline) ← first real tutorial output
3. **M1 Onboard fix** (30 min, anytime) ← cheapest win in the whole roadmap

### Next sprint — editor foundation
4. **A1 Renderer extraction** (7 hr) ← biggest editor-quality unlock
5. **B15 Path C — replicate Path B for other devices** ← scale tutorial generation

### Anytime in parallel
- **E1 Admin subdomain** (6 hr) ← production blocker but not urgent
- **M2 Dashboard sort/filter** (2 hr) ← admin workflow improvement
- **A2 Ruler tool** (1.5 hr) ← Figma parity for contractor
- **A4 LED z-order Part 3** (1.5 hr) ← Figma parity

### When stable
- **C3 Relink decision** (30 min discussion) ← blocks Half B preview-relink
- **B14 Half B preview UI** (6-8 hr) ← after Path A proves the basic flow needs more
- **C1 Pipeline build-phase fixes** (5 hr) ← Parts A, C, E remaining

### Parked / decision needed
- **5 gatekeeper-failed devices** (ddj-flx4, dj-xdj-rr, fantom-07, deepmind-12, rc-505-mk2 — though rc-505 is killed) — separate strategy session
- **Deepmind-12 coverage rejection at 88.6%** — improve extraction or debate threshold
- **A9 Themes/skins** — wait for contractor demand signal

---

## 🚨 Cross-cutting protected systems — regression watch

For every active plan, check before execution:

| Protected system | At-risk plans | Mitigation pattern |
|---|---|---|
| Manifest schema | A6 (keyboard startNote), A7 (containers), A8 (ledStyle) | Additive fields, backward-compat defaults |
| Autosave / Hosted Blob | none currently | n/a |
| Send-to-hosted / pull workflow | none currently | n/a |
| History / undo | A4 (zOrder), A5 (selection), A7 (containers) | New state via `pushSnapshot()` |
| Existing features | A3 (sizing rendering) | Playwright before/after |
| Tutorial integrity | A6 (`startNote`), C4 (mutation safety) | Read-only enforcement; pre-flight scan |
| Pipeline reliability | C1, B12 (review phase) | Validators + escalation safety nets |
| Admin/contractor workflow | E1 (subdomain) | Env var pre-check, curl verification |

---

## 📚 Plan file inventory

### Active in `~/.claude/plans/`
```
2026-05-editor-renderer-extraction.md     A1
2026-05-instrument-preview-and-relink.md  B14 / C2
2026-05-manifest-repair-cache-cleanup.md  C5
2026-05-pipeline-build-phase-fixes.md     C1
2026-05-relink-architecture-rethink.md    C3
2026-05-14-tutorial-generation-and-review-phase.md  B12/B13/B15 — NEW
2026-future-tutorial-content-discovery.md D1
get-up-to-speed-eager-dolphin.md          M1
manifest-mutation-safety.md               C4
my-website-admin-subpages-luminous-music.md  E1
parsed-exploring-pumpkin.md               A6
tutorial-regeneration-strategy.md         B11
```

### Active in `docs/plans/`
```
2026-04-18-dashboard-sort-filter.md       M2
2026-04-26-led-zorder-plan.md             A4 (Part 3 only)
2026-04-26-pre-tutorial-blockers.md       A8
2026-04-27-label-align-containers-plan.md A7
2026-04-27-themes-skins-design.md         A9
2026-04-29-ruler-and-pipeline-reset.md    A2
2026-04-30-context-management.md          A10
2026-04-30-display-builder-agent.md       (REF — SOUL shipped)
2026-04-30-sizing-input-fixes.md          A3
2026-05-04-mixed-selection-labels-controls-P1.md  A5
2026-05-roadmap.md                        (this file)
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

*Last updated 2026-05-14. Re-audit when 5+ plans ship or major architectural decisions land.*
