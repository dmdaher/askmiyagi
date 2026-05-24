# ONBOARD — First-Time Session Setup

Read these files in this order at the start of any new work session. Files 1 and 4 are auto-loaded by Claude Code; the rest must be read explicitly. The docs contain hard-won lessons from 9 months of work and ~140 PRs. Skipping them means repeating solved mistakes.

**Trigger:** Starting any new work session on this project.

---

## Step 0: Canonical Reading Order

| Order | File | What it provides |
|-------|------|------------------|
| 1 | `CLAUDE.md` (project root) | Rules, git branching, safety, pipeline hard rules, Playwright + Editor safety, impact-check trigger — **auto-loaded** |
| 2 | `docs/ARCHITECTURE.md` | End-to-end system overview, directory structure, data flow, tech stack |
| 3 | `docs/architecture/editor-preview-unification.md` | THE SharedX pattern + anti-patterns. Required reading before any editor/preview/rendering change. |
| 4 | `memory/MEMORY.md` | Index of all memory files, current state, active workstreams — **auto-loaded** |
| 5 | `memory/last-session.md` | What was just done, saved plans, what to pick up next |
| 6 | `memory/context-checkpoints.md` | Detailed mid-session state snapshots. **Read the most recent entry FULLY** — it contains exact resume steps for any in-progress work. |
| 7 | `docs/plans/2026-05-roadmap.md` | Current roadmap state — what's shipped, what's active, what's deferred |
| 8 | `~/.claude/plans/<recent-plan>.md` | Any in-flight plan from a prior session (referenced by `last-session.md` / `context-checkpoints.md`) |
| 9 | `memory/project_editor_complete_features.md` | Full editor feature inventory (read if doing editor work) |

Memory files live at: `/Users/devin/.claude/projects/-Users-devin-Documents-Fun---Stuff-Music-Music-Studio-askmiyagi/memory/`

User-level plans live at: `/Users/devin/.claude/plans/`

Also check (if relevant):
- `memory/feedback_*.md` files — every correction the user has made historically becomes a feedback rule. Browse the index in MEMORY.md.
- `memory/project_*.md` files — project state notes.

---

## Step 1: Confirm orientation

Before writing any code, you must be able to answer ALL of the following:

### Project basics
- **What is the project?** Interactive Music Studio (AskMiyagi) — digital twins of real hardware music instruments built from manufacturer PDFs. Contractor edits panel layouts; production renders tutorials.
- **Tech stack?** Next.js 16, React 19, Zustand 5, Tailwind CSS 4, Framer Motion 12, TypeScript 5, Playwright, Vitest.
- **Path alias?** `@/*` → `./src/*`
- **Source materials?** iCloud mirror: `/Users/devin/Library/Mobile Documents/com~apple~CloudDocs/Documents/Fun & Stuff/Music/Music Studio/`. Manual PDFs + reference photos live there.
- **Tutorial canonical example?** `src/data/tutorials/fantom-08/split-keyboard-zones.ts`
- **Quality gates?** PRE-BUILD, POST-BUILD, CORRECTION, CROSS-REFERENCE, SELF-IMPROVEMENT

### Git rules (NON-NEGOTIABLE — read CLAUDE.md)
- **NEVER push to `main`** — branch protection enforced.
- **NEVER create PRs targeting `main`** — all PRs target `test`.
- **NEVER run `gh pr merge` on PRs to `main`** — only the repo owner merges.
- **NEVER run `gh pr review --approve`** — agents do not approve PRs.
- **Always branch from `test`**: `git checkout -b feature/<name> origin/test`
- **Always PR to `test`**: `gh pr create --base test`
- Before pushing any branch, confirm: `git log --oneline test..HEAD` and `gh pr create --base test`.

### Editor / contractor data safety (NON-NEGOTIABLE)
- **Loading `/admin/<dev>/editor` from a Playwright script can corrupt contractor data** via auto-save. ALWAYS use `?nosave=true` URL flag. See `memory/feedback_playwright_triggers_autosave.md`.
- **Before any change that could touch contractor data**: SHA256 snapshot all 7 `.pipeline/<dev>/manifest-editor.json` files to `/tmp/`. See `memory/feedback_before_after_snapshots.md`.
- **NEVER `git checkout --` a manifest-editor.json without a backup first.** See `memory/feedback_never_checkout_contractor_data.md`.
- **For any non-trivial change, run `/impact-check`** to answer the 6 questions out loud BEFORE writing code.

### Editor / preview architecture (CRITICAL — read editor-preview-unification.md)
- Two render paths: `ControlNode.tsx` (editor) and `PanelRenderer.tsx` (preview).
- Visual primitives in `src/components/controls/` are shared between both.
- Higher-level shared rendering lives in `src/components/panel/SharedX.tsx` (so far: SharedLabel; A1 plan adds SharedCircleButton, SharedLed).
- Helpers shared via `src/lib/render-helpers.tsx` (PR #141).
- Drift CI gate: `npm run drift:verify` — editor side must show 0 changes from baseline on every PR.
- If you find yourself editing ControlNode.tsx AND PanelRenderer.tsx for the same visual change, STOP and extract a SharedX core.

### Devices (7 currently in `.pipeline/`)
- **fantom-06** (Roland synth) — 121 controls, 100 labels, keyboard, controlScale 0.3
- **cdj-3000** (Pioneer DJ player) — 63 controls, 29 circle buttons, jog wheel
- **deepmind-12** (Behringer synth) — 70+ controls, 70+ LEDs (many dual-label), keyboard
- **dj-xdj-rr** (Pioneer DJ controller) — 129 controls, no keyboard, controlScale 0.65 (auto-fit from Phase 10)
- **dj-xdj-rx3** (Pioneer DJ controller) — 148 controls
- **minimoog-model-d** (Moog synth) — 52 controls, knob-dominant
- **alphatheta-cdj3000x** (Pioneer DJ player variant) — 61 controls, large bbox

Plus `fantom-08` which is a hand-crafted production device (not in pipeline).

---

## Step 2: Worktree topology

The project uses git worktrees for parallel work streams. Each worktree has its own working tree but shares the same `.git` and (via symlink) `.pipeline/`.

| Worktree path | Branch | What it's for |
|---|---|---|
| `askmiyagi` (canonical) | varies | Reference + canonical `.pipeline/` |
| `askmiyagi-wt-phase-10` | feature branches | Phase 10 work + bug fixes |
| `askmiyagi-wt-a1-analysis` | A1 refactor branches | Renderer extraction work |
| `askmiyagi/.claude/worktrees/*` | EnterWorktree-created | Short-lived analysis tasks |

**`.pipeline/` is a symlink in every worktree** pointing to `askmiyagi/.pipeline/` (the authoritative copy). This means contractor data is shared across all worktrees — editing in one is editing for all. SHA256 byte-identity checks are essential.

**`.env.local` is NOT shared** — copy from an existing worktree when creating a new one:
```bash
cp askmiyagi-wt-phase-10/.env.local <new-worktree>/.env.local
```

To check worktree state:
```bash
git -C "/Users/devin/Documents/Fun & Stuff/Music/Music Studio/askmiyagi" worktree list
```

---

## Step 3: Determine your task type

Ask the user what they're working on, then follow the correct reading path.

### Path A: Given manuals for a NEW instrument

**This is the primary instrument-build workflow.**

Additional reading:
1. `CLAUDE.md` — Pipeline hard rules, agent orchestration, full split architecture, control ID naming
2. `docs/quality-gates.md` — The evidence standard enforced at every phase (5 gates, 40 questions)
3. `tasks/lessons.md` — Correction patterns from prior builds

**Then start the pipeline** from `/admin` dashboard (NOT terminal). The runner spawns each phase as a `claude -p` subprocess. Pipeline pauses at the layout-engine phase for contractor editing — admin sends manifest+photos to Vercel Blob, contractor positions controls, admin reviews and approves.

**Key facts you must know:**
- All interactive components need `'use client'`
- Colors from constants only — NEVER hardcode hex
- ASCII layout first, code second — always get user approval
- Screen catalog uses confidence tags: HIGH/MED/LOW
- Phase 1 (manual read) is the most time-intensive — use subagent parallelism for different page ranges
- NEVER delegate manual PDF reading to agents for screen layouts — agents hallucinate visual details

### Path B: Adding TUTORIALS to an existing instrument

Additional reading:
1. `CLAUDE.md` — Tutorial conventions, panel state rules, control ID naming
2. `docs/quality-gates.md` — Evidence standards (especially PRE-BUILD + CROSS-REFERENCE gates)
3. `tasks/lessons.md` — 19 correction patterns
4. `src/data/tutorials/fantom-08/split-keyboard-zones.ts` — Canonical tutorial example (study end-to-end)

**Key facts you must know:**
- Batch size: 3-5 tutorials grouped by manual chapter
- TDD cycle: update test → verify fail → create file → register → verify pass
- Registration requires 7 items (file, import, array, export, step count, total count, description)
- Panel state is CUMULATIVE — each step builds on previous
- Every step needs UNIQUE displayState
- Only LED buttons can have `ledOn: true`
- `menuItems` must be `{ label: string }` objects, NOT plain strings
- `tutorialControlRefs.test.ts` + `cumulative-state.integration.test.ts` run on every pre-push — your tutorials must pass them

### Path C: Editor / Renderer changes (most common 2026-05+)

Additional reading:
1. `docs/architecture/editor-preview-unification.md` — REQUIRED, the SharedX pattern
2. `~/.claude/plans/nested-coalescing-squid.md` (or current A1 plan) — what's in progress
3. `src/components/panel/SharedLabel.tsx` — pattern template for any new shared component
4. `src/lib/render-helpers.tsx` — already-shared helpers; reuse them
5. `e2e/editor-preview-baseline.ts` — drift CI implementation; understand thresholds

**Before any editor render change, /impact-check is MANDATORY.**

**Key facts:**
- Drift CI gate: editor changes from baseline = 0 (always)
- Preview changes allowed only if intentional and explained in PR
- SHA256 byte-identity on all 7 manifests REQUIRED pre/post
- Playwright with `?nosave=true` for any UI verification
- Tutorial integration tests must remain green (PanelRenderer is loaded in production tutorials)

### Path D: Resuming previous work

Read in this EXACT order:
1. `memory/MEMORY.md` — look for the 🔴 ACTIVE WORK callout at the top
2. `memory/context-checkpoints.md` — most recent entry has exact resume steps
3. `memory/last-session.md` — TL;DR pointer
4. Check git status and recent commits + open PRs (`gh pr list --state open`)
5. Read referenced plan file in `~/.claude/plans/`

---

## Step 4: Verify understanding (checkpoint)

Before writing any code, confirm you can answer:

- ✅ What is the project? (Interactive Music Studio — digital twins of real instruments)
- ✅ What is the tech stack? (Next.js 16, React 19, Zustand 5, Tailwind 4, Framer Motion 12, TS 5)
- ✅ What's the canonical tutorial example? (`split-keyboard-zones.ts`)
- ✅ What's the editor↔preview parity pattern? (SharedX core + mode-specific wrapper)
- ✅ What's the safety rule for Playwright with the editor? (`?nosave=true` mandatory)
- ✅ Where do I PR to? (`test` branch ONLY)
- ✅ How do I confirm I'm not breaking contractor data? (SHA256 byte-identity check)
- ✅ How do I confirm I'm not breaking editor↔preview parity? (`npm run drift:verify`)
- ✅ What is the current open PR landscape? (`gh pr list --state open`)
- ✅ What in-flight work am I picking up? (read most recent `context-checkpoints.md` entry)

---

## Step 5: Recent project history (essential context for any editor work)

### 2026-05 — the A1 renderer extraction era

PR #120 extracted `SharedLabel` (the proof of concept for the SharedX pattern). 9 editor↔preview parity bugs shipped in May 2026 — symptomatic of the duplication between ControlNode.tsx (854 LOC) and PanelRenderer.tsx (646 LOC). The A1 plan (`~/.claude/plans/nested-coalescing-squid.md`) extracts more shared components:

- ✅ PR #141 — render-helpers.tsx (renderLabelText, inferPortVariant, mapButtonLabelPosition, resolveDisplayContent) — PR-1 of 4
- 🔄 PR-2 — SharedCircleButton (in progress)
- ⏳ PR-3 — SharedLed (dot + dual-label + bar variants)
- ⏳ PR-4 — manifest-field-completeness.test.ts (catches silent state-threading bugs)

### Other recent significant work
- PR #138 — Phase 10 controlScale auto-fit for fresh instruments
- PR #140 — 3 editor bug fixes (label position state, circle bg transparency, z-order)
- PR #139 — Roadmap audit (21 of 31 plans shipped, 4 deferred)
- PR #131-137 — Phase 2-7 unified selection refactor (mixed selection across controls + labels)
- PR #126 — Inter font via next/font (cross-platform consistency)
- PR #120 — SharedLabel (label rendering unified)
- PR #109 — Inventory + relinks + auto-retry + admin redesign
- PR #115 — Hosted contractor history feature (50-version Blob history)

### Currently shipped & stable
- 1207+ vitest tests
- Drift CI gate (editor side must be 0)
- 7 devices in `.pipeline/` with contractor manifests
- 60 tutorials for fantom-08 (production reference)
- Pipeline runner orchestrates 12-phase instrument builds via Claude CLI subprocesses
- Hosted contractor editor + admin review flow

---

## Step 6: Known gotchas (read carefully)

| # | Gotcha | Symptom | Mitigation |
|---|---|---|---|
| 1 | `.tsx` not `.ts` for JSX | esbuild error: "Expected > but found key" | Always `.tsx` for any file with React elements |
| 2 | `background: undefined` clears `backgroundColor` | DOM has no bg, computed `rgba(0,0,0,0)` | Conditionally spread: `...(condition && { background: ... })` |
| 3 | macOS TCC revokes filesystem access mid-session | `EPERM: operation not permitted` on `.pipeline/` | Quit Terminal (⌘Q) + reopen — `killall cfprefsd` alone doesn't refresh running processes |
| 4 | Playwright editor load corrupts contractor data | Manifest SHA changes unexpectedly | `?nosave=true` URL flag + SHA256 byte-identity check |
| 5 | `git stash` fails on `.pipeline/` symlinks | "beyond a symbolic link" error | Use `cp <file> /tmp/<file>.bak` instead |
| 6 | Worktrees inherit stale `.pipeline/` | API 404s on devices that should exist | `rm -rf .pipeline && ln -s "$CANONICAL_PIPELINE" .pipeline` |
| 7 | Stacked PRs orphan on parent merge | Child PR shows "merged" but content missing | After parent merges, retarget child to test |
| 8 | New editor field skips `storeToManifest` | Field works in editor, silently absent in preview | Always thread new ControlDef fields through PanCanvas.tsx storeToManifest |
| 9 | tutorialControlRefs / cumulative-state tests fail | Tutorial step references missing control ID | Run on pre-push; never bypass — re-run after any control rename |
| 10 | `.env.local` missing in new worktrees | Dev server shows signin page; ADMIN_PASSWORD unset | Copy from existing worktree |
| 11 | `inferPortVariant` previously diverged (preview returned loose `string`) | Port labels rendered wrong variant | Fixed in PR #141 via `render-helpers.tsx` |
| 12 | `mapButtonLabelPosition` was editor-only | Preview's PanelButton got raw `'left'/'right'/'hidden'` values it couldn't render | Fixed in PR #141 |

---

## Step 7: Session management

At session END, update continuity files:
- Prepend new section to `memory/last-session.md`: what we worked on, where we left off, next steps, key decisions, artifacts created
- Prepend new section to `memory/context-checkpoints.md`: detailed mid-session state snapshot

These are APPEND-ONLY (prepend new sections at top) — never overwrite, to avoid clobbering concurrent instances.

If mid-session interrupted (TCC, accidental quit, context exhausted):
- Save state to `memory/context-checkpoints.md` with a 🔴 callout
- Add a one-line pointer at the top of `MEMORY.md` so the next instance sees it immediately
- Include: where you are, why you stopped, exact resume command, gotchas to watch for

---

## Step 8: Quick command reference

```bash
# Project structure
git -C "/Users/devin/Documents/Fun & Stuff/Music/Music Studio/askmiyagi" worktree list

# Dev server (always do this in the worktree you're working in)
cd "/Users/devin/Documents/Fun & Stuff/Music/Music Studio/askmiyagi-wt-<name>"
npm run dev  # localhost:3000

# Open PRs
gh pr list --state open

# Drift verification (REQUIRED before every PR that touches rendering)
npm run drift:capture   # save current as baseline
npm run drift:verify    # fail if editor differs from baseline
npm run drift:report    # measure NOW + print per-kind table

# Test suites
npx vitest run                                                     # all tests
npx vitest run src/lib/__tests__/<file>.test.ts                    # specific
npx vitest run src/__tests__/tutorials/                            # tutorial integrity
npx tsc --noEmit                                                   # type check
npm run build                                                      # full build

# Manifest byte-identity (REQUIRED on every PR)
TS=$(date +%s); BACKUP="/tmp/task-pre-$TS"; mkdir -p "$BACKUP"
for d in fantom-06 cdj-3000 deepmind-12 dj-xdj-rr dj-xdj-rx3 minimoog-model-d alphatheta-cdj3000x; do
  cp ".pipeline/$d/manifest-editor.json" "$BACKUP/${d}__pre.json"
  shasum -a 256 ".pipeline/$d/manifest-editor.json" | awk -v d="$d" '{print d, $1}'
done > "$BACKUP/_sha.txt"
# ... make change ...
# Then compare with current SHAs
```

---

## Project Structure Quick Reference

```
askmiyagi/
├── src/
│   ├── app/                                    # Next.js pages
│   │   ├── admin/[deviceId]/editor/            # Contractor editor (admin auth)
│   │   ├── editor/[deviceId]/                  # Hosted contractor editor (contractor auth)
│   │   ├── tutorial/[deviceId]/[tutorialId]/   # Tutorial runner
│   │   ├── preview/[deviceId]/                 # Public panel preview
│   │   └── api/                                # API routes
│   ├── components/
│   │   ├── ui/                                 # Shared: DeviceCard, TutorialCard, etc.
│   │   ├── controls/                           # Hardware control primitives — used by both editor and preview
│   │   ├── panel/                              # Shared* high-level components (SharedLabel, future SharedCircleButton, etc.)
│   │   ├── panel-editor/                       # Editor-only: ControlNode, PanCanvas, PropertiesPanel, etc.
│   │   ├── devices/                            # Hand-crafted device panels (Fantom-08 only)
│   │   ├── tutorial/                           # TutorialRunner, StepContent, ProgressBar
│   │   ├── assistant/                          # Ask Miyagi chat widget
│   │   └── admin/                              # Admin dashboard components
│   ├── data/
│   │   ├── devices.ts
│   │   ├── manifests/                          # Committed production manifests (cdj-3000, deepmind-12, fantom-06)
│   │   └── tutorials/                          # Tutorial content as TypeScript objects
│   ├── hooks/
│   ├── lib/
│   │   ├── render-helpers.tsx                  # Shared rendering helpers (PR #141)
│   │   ├── hardware-icons.ts                   # Icon registry (HARDWARE_ICONS, HARDWARE_ICON_SVGS)
│   │   ├── banner-style.ts                     # Shared banner styling
│   │   ├── label-position.ts                   # Label positioning math
│   │   ├── pipeline/                           # Pipeline runner internals
│   │   ├── makePanelFromManifest.tsx           # Production panel factory
│   │   └── hosted-storage.ts                   # Vercel Blob integration
│   ├── store/                                  # Zustand stores
│   └── types/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── architecture/editor-preview-unification.md
│   ├── plans/2026-05-roadmap.md
│   └── ...
├── e2e/                                        # Playwright specs + drift CI
├── scripts/
│   ├── pipeline-runner.ts                      # Orchestrates the 12-phase build
│   └── ...
└── .pipeline/                                  # Per-device pipeline state (contractor data)
```

**Key commands:**
- `npm run dev` — dev server on localhost:3000
- `npm run build` — production build (type check)
- `npm run test` — run all tests (vitest)
- `npm run test:watch` — watch mode
- `npm run drift:capture` / `drift:verify` / `drift:report` — editor↔preview parity
