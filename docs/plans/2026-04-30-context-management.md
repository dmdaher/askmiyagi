# Plan: Context Management for New Claude Instances

## Problem

Every new Claude instance starts cold. It doesn't know our architecture, recent decisions, what's been built, or what's in progress. Context gets lost between sessions. We end up re-explaining the same things, the instance makes wrong assumptions, or it breaks something that was carefully designed.

Current approach (memory files + ARCHITECTURE.md) helps but isn't structured enough. Memory files get stale. The architecture doc gets long and outdated.

## Goal

Any new Claude instance should understand the full project context in under 30 seconds of reading. It should know: what this project is, how the codebase is structured, what's been built, what's in progress, what decisions were made and why, and where to find detailed plans.

## Proposal: Modular Context System

### 1. Architecture Index (keep current ARCHITECTURE.md but modular)

Split `docs/ARCHITECTURE.md` into focused modules:

```
docs/architecture/
├── README.md              ← entry point, 50 lines max, links to modules
├── app-routes.md           ← pages + API routes
├── editor-system.md        ← panel editor components, store, hooks
├── control-components.md   ← PanelButton, Knob, Slider, etc.
├── pipeline-system.md      ← phases, agents, state machine
├── tutorial-system.md      ← TutorialRunner, store, step structure
├── data-flow.md            ← manifest loading, auto-save, export
├── contractor-flow.md      ← Blob storage, editor ↔ admin workflow
└── decisions.md            ← key architectural decisions with reasoning
```

Each module: under 100 lines. README links to all modules with one-line descriptions.

### 2. Session Handoff File (auto-updated)

At end of every session, Claude updates `memory/last-session.md` with:
- What was done (bullet points)
- What's in progress (with plan file links)
- Key decisions made this session
- Bugs found but not fixed
- What to tell the contractor

This already exists but needs to be enforced as a habit, not optional.

### 3. Active Plans Index

One file listing all active plans with status:

```
docs/plans/INDEX.md
├── [DONE] Label alignment + containers
├── [DONE] LED system + z-order
├── [ACTIVE] Display builder agent
├── [ACTIVE] Themes/skins
├── [SAVED] Pre-tutorial blockers
```

New Claude instance reads this first to know what's in flight.

### 4. Decision Log

`docs/architecture/decisions.md` — append-only log of WHY decisions were made:

```
## 2026-04-30: LED dots removed from dual-label indicator
- Decided: use background color only, no LED dots
- Why: contractor wanted same visual size as regular buttons
- Future: may add dots back per-instrument if manual shows them

## 2026-04-29: Guides don't persist across reloads
- Decided: session-only, no save to manifest
- Why: guides are workspace state, not document state (Figma pattern)
```

This prevents a new instance from re-questioning decisions that were already debated.

### 5. CLAUDE.md Updates

Add to project CLAUDE.md:
```
## Session Protocol
1. Read docs/architecture/README.md first
2. Read docs/plans/INDEX.md for active work
3. Read memory/last-session.md for recent context
4. Before implementing: check if a plan exists in docs/plans/
5. Before ending: update memory/last-session.md
```

## What NOT to Do

- Don't put code examples in architecture docs (they go stale)
- Don't duplicate info between memory files and architecture docs
- Don't write long prose — bullet points and tables only
- Don't track file line numbers (they change constantly)

## Implementation

This is a documentation restructure, not code. Can be done in one session:
1. Split ARCHITECTURE.md into modules
2. Create docs/plans/INDEX.md
3. Create docs/architecture/decisions.md with existing decisions
4. Update CLAUDE.md with session protocol
5. Clean up stale memory files

## Status
SAVED — implement when ready. Low effort, high impact for future sessions.
