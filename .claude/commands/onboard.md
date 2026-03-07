# ONBOARD — First-Time Session Setup

Read all required documentation in the correct order based on your task. This is MANDATORY before writing any code. The docs contain hard-won lessons from 8 batches and 59 tutorials. Skipping them means repeating solved mistakes.

**Trigger:** Starting any new work session on this project.

---

## Step 0: Read Session Context

Check for previous session state:
- Read `memory/MEMORY.md` — project state, key patterns, quick reference
- Read `memory/last-session.md` (if exists) — what was done, where we left off, next steps
- Read `memory/context-checkpoints.md` (if exists) — mid-session state snapshots

These files are in: `/Users/devin/.claude/projects/-Users-devin-Documents-Fun---Stuff-Music-Music-Studio-askmiyagi/memory/`

---

## Step 1: Determine Your Task Type

Ask the user what they're working on, then follow the correct reading path:

### Path A: Given manuals for a NEW instrument

**This is the primary workflow.** You are building a complete digital twin.

Read in this EXACT order:
1. `docs/new-instrument-playbook.md` — The 7-phase end-to-end pipeline (Phases 0-7: gather materials → full manual read → screen catalog → panel design → core implementation → screens → tutorials → validation)
2. `docs/quality-gates.md` — The evidence standard enforced at every phase (5 gates, 40 questions)
3. `tasks/lessons.md` — 19 correction patterns (mistakes to avoid)
4. `CLAUDE.md` — Project instructions, architecture, conventions, control ID naming

**Then execute** Phases 0-5 of the playbook before touching tutorials.

**Key facts you must know:**
- Panel dimensions: 2700x580px (Fantom 08 reference)
- All interactive components need `'use client'`
- Colors from constants only — NEVER hardcode hex
- ASCII layout first, code second — always get user approval
- Screen catalog uses confidence tags: HIGH/MED/LOW
- Phase 1 (manual read) is the most time-intensive — use subagent parallelism for different page ranges
- NEVER delegate manual PDF reading to agents for screen layouts — agents hallucinate visual details

### Path B: Adding TUTORIALS to an existing instrument

Read in this EXACT order:
1. `memory/tutorial-batch-playbook.md` — Full batch execution process (skills chain, TDD cycle, constraints, review patterns)
2. `docs/quality-gates.md` — Evidence standards (especially PRE-BUILD + CROSS-REFERENCE gates)
3. `tasks/lessons.md` — 19 correction patterns

**Key facts you must know:**
- Batch size: 3-5 tutorials grouped by manual chapter
- TDD cycle: update test → verify fail → create file → register → verify pass
- Canonical example: `src/data/tutorials/fantom-08/split-keyboard-zones.ts`
- Registration requires 7 items (file, import, array, export, step count, total count, description)
- Skip spec-kit for tutorials — the TypeScript `Tutorial` type IS the spec
- Panel state is CUMULATIVE — each step builds on previous
- Every step needs UNIQUE displayState
- Only LED buttons can have `ledOn: true` — see cross-ref command for the complete list
- `menuItems` must be `{ label: string }` objects, NOT plain strings

**Required skills chain (invoke in order):**
1. `brainstorming` — before deciding which tutorials
2. `writing-plans` — create batch plan file
3. `using-git-worktrees` — isolated workspace
4. `executing-plans` — task-by-task execution
5. `test-driven-development` — per tutorial
6. `systematic-debugging` — when tests fail
7. `requesting-code-review` — after all tutorials
8. `receiving-code-review` — process feedback
9. `verification-before-completion` — final evidence
10. `finishing-a-development-branch` — merge/PR/cleanup

### Path C: Building a new FEATURE (non-tutorial)

Read in this EXACT order:
1. `CLAUDE.md` — Architecture, tech stack, conventions
2. `docs/quality-gates.md` — Evidence standards
3. `tasks/lessons.md` — Correction patterns (many apply to all code, not just tutorials)
4. Check `specs/` directory for any existing spec for this feature
5. Check `docs/plans/` for any existing design doc

**Key facts you must know:**
- Tech stack: Next.js 16, React 19, Zustand 5, Tailwind CSS 4, Framer Motion 12, TypeScript 5
- Path alias: `@/*` → `./src/*`
- State management: single `tutorialStore` (Zustand), plus `chatStore` for assistant
- Use spec-kit for features with unclear requirements (WHAT to build)
- Use superpowers skills for HOW to build correctly

### Path D: Resuming previous work

Read in this EXACT order:
1. `memory/last-session.md` — what was done, where we left off
2. `memory/context-checkpoints.md` — mid-session state
3. `memory/MEMORY.md` — project state overview
4. Check git status and recent commits for context

---

## Step 2: Verify Understanding

Before writing any code, confirm you can answer:
- What is the project? (Interactive Music Studio — digital twins of real instruments)
- What is the tech stack? (Next.js 16, React 19, Zustand 5, Tailwind 4, Framer Motion 12, TS 5)
- Where are source materials? (iCloud mirror: `/Users/devin/Library/Mobile Documents/com~apple~CloudDocs/Documents/Fun & Stuff/Music/Music Studio/`)
- What quality gates apply? (PRE-BUILD, POST-BUILD, CORRECTION, CROSS-REFERENCE, SELF-IMPROVEMENT)
- What's the canonical tutorial example? (`split-keyboard-zones.ts`)
- How many tutorials exist? (59 across 10 categories, 100% manual coverage)
- What's the current test count baseline? (675+)

---

## Step 3: Session Management

At session END, update continuity files:
- Prepend new section to `memory/last-session.md`: what we worked on, where we left off, next steps, key decisions, artifacts created
- After major milestones, prepend to `memory/context-checkpoints.md`: current state snapshot

These are APPEND-ONLY (prepend new sections at top) — never overwrite, to avoid clobbering concurrent instances.

---

## Project Structure Quick Reference

```
askmiyagi/src/
├── app/              # Next.js pages
├── components/
│   ├── ui/           # Shared: DeviceCard, TutorialCard, CategoryFilter, BrandingHeader
│   ├── controls/     # Hardware controls: Knob, Slider, PadButton, PanelButton
│   ├── devices/      # Device panels: fantom-08/, rc505-mk2/
│   ├── tutorial/     # TutorialRunner, StepContent, ProgressBar, NavigationControls
│   └── assistant/    # Ask Miyagi chat widget
├── data/
│   ├── devices.ts
│   ├── panelLayouts/ # Control layout definitions
│   └── tutorials/    # Tutorial content (TypeScript objects)
├── hooks/            # useTutorialEngine, usePanelState, useDisplayState
├── lib/              # Constants, noteHelpers, panelMapping, assistant/
├── store/            # Zustand stores (tutorialStore, chatStore)
└── types/            # TypeScript interfaces
```

**Key commands:**
- `npm run dev` — dev server on localhost:3000
- `npm run build` — production build (type check)
- `npm run test` — run all tests (vitest)
- `npm run test:watch` — watch mode
