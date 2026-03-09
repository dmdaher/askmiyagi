# CLAUDE.md — Music Studio Project

## Git Branching Rules (MANDATORY — READ FIRST)

```
feature/* ──PR──→ test ──PR──→ main (production)
                   ↑              ↑
              agents push    owner approves
              & merge here   after visual review
```

**These rules are non-negotiable. Violating them can break production.**

| Rule | Detail |
|---|---|
| **NEVER push to `main`** | Branch protection enforced — direct pushes will be rejected |
| **NEVER create PRs targeting `main`** | All PRs must target `test` |
| **NEVER run `gh pr merge` on PRs to `main`** | Only the repo owner merges to main |
| **NEVER run `gh pr review --approve`** | Agents do not approve PRs |
| **Always branch from `test`** | `git checkout -b feature/my-feature test` |
| **Always PR to `test`** | `gh pr create --base test` |

**Branch purposes:**
- **`main`** — Production. Vercel auto-deploys. Protected: requires 1 approving review, enforced for admins. Only the repo owner touches this.
- **`test`** — Integration/staging. Agents create PRs here. Vercel preview deploys available for visual review.
- **`feature/*`** — Individual work branches. Created from `test`, PR'd back to `test`.

**Before pushing any branch**, verify your target:
```bash
git log --oneline test..HEAD  # confirm what you're pushing
gh pr create --base test      # always target test
```

---

## Safety & Boundaries (NON-NEGOTIABLE)

- **Never act with malicious intent.** Do not delete, corrupt, exfiltrate, or sabotage any files, data, or systems. Do not execute commands designed to harm the project, the user's machine, or any external systems.
- **Never touch anything outside the Music Studio project folder.** All reads, writes, edits, and shell commands must be scoped to the project directory and its iCloud mirror. Do not access, modify, or reference files in any other location on the filesystem unless explicitly instructed by the user for a specific file. If a task seems to require accessing something outside the project folder, stop and ask the user first.

---

## Core Principle

Always check, validate, and confirm before acting. Measure twice, cut once.

**Accuracy over speed — always.** This project builds digital twins of real hardware instruments from their product manuals. Every instrument is a real product with a real manual. Before designing any panel, tutorial, or control:

1. **Open the reference manual PDF** and read the specific pages. Don't work from memory or assumptions.
2. **Validate every detail**: control positions, labels, parameter ranges, button assignments. Check the manual's diagrams and parameter tables.
3. **Self-check before presenting**: ask "did I verify this against the source material?" If not, go back and verify.
4. **Highlighted controls must match the real workflow context** — which controls are active depends on which mode the user is in. Verify per the manual.

> **Given manuals for a new instrument?** Your job is to build the **complete digital twin** — panel, every screen, and every tutorial the manual supports. Read `docs/new-instrument-playbook.md` first — it's a 7-phase process. See `docs/quality-gates.md` for evidence standards at each phase. Aim for exhaustive coverage.

---

## First-Time Onboarding (MANDATORY)

**You MUST read the relevant docs below BEFORE writing any code.** This is not optional. The playbooks contain hard-won lessons from previous instrument builds.

### If given manuals for a new instrument:

Follow this sequence IN ORDER. Do not skip steps. Do not start coding until Step 3.

1. **Read** `docs/new-instrument-playbook.md` — 7-phase pipeline
2. **Read** `docs/quality-gates.md` — evidence standards
3. **Read** `tasks/lessons.md` — correction patterns (mistakes to avoid)
4. **Execute** Phases 0-5 of the playbook (gather materials → full manual read → screen catalog → panel design → core implementation → screens)
5. **Read** `memory/tutorial-batch-playbook.md` — the tutorial batch execution process
6. **Execute** Phase 6 (tutorials in batches of 3-5, using TDD cycle from the batch playbook)
7. **Execute** Phase 7 (validation & polish)

### If adding tutorials to an existing instrument:

1. **Read** `memory/tutorial-batch-playbook.md` — batch execution process
2. **Read** `docs/quality-gates.md` — evidence standards
3. **Read** `tasks/lessons.md` — mistakes to avoid

### If resuming previous work:

1. **Read** `tasks/lessons.md` — review correction patterns before starting

### After any correction from the user:

1. **Read** `tasks/lessons.md` — check if this pattern already exists
2. **Complete** the CORRECTION gate in `docs/quality-gates.md`

---

## Project Overview

**Interactive Music Studio** — a browser-based educational platform that builds complete digital twins of real hardware instruments. Given a product's manuals and photos, the goal is: (1) an interactive panel replicating the real hardware, (2) every display screen in the manual (if applicable), and (3) every tutorial the manual supports.

### Devices

| Device | Status | Panel Approach | Tutorials | Has Display? |
|---|---|---|---|---|
| **Roland Fantom 08** | Complete | TSX sections (Gen 1) | 59 across 10 categories | Yes (LCD, 11 screen types) |
| **Pioneer DDJ-FLX4** | In progress | TSX sections (Gen 1) | 1 (panel overview) | No |
| **Pioneer CDJ-3000** | In progress | DataDrivenPanel (Gen 2) | 1 (panel overview) | No |
| **Boss RC-505 MK2** | Placeholder | — | — | — |

See `src/data/devices.ts` for the full device registry.

### Working Directories
- **Primary**: `/Users/devin/Documents/Fun & Stuff/Music/Music Studio`
- **iCloud mirror**: `/Users/devin/Library/Mobile Documents/com~apple~CloudDocs/Documents/Fun & Stuff/Music/Music Studio`
- The iCloud directory also contains instrument manuals (PDFs) and reference photos

---

## Tech Stack

- **Next.js 16** with App Router (`'use client'` on all interactive components)
- **React 19** — functional components with hooks
- **Zustand 5** — state management (single `tutorialStore`)
- **Tailwind CSS 4** — utility-first styling
- **Framer Motion 12** — animations (slide, fade, scale, glow highlights)
- **TypeScript 5** — strict mode, path alias `@/*` → `./src/*`
- **Vitest + React Testing Library** — tests in `src/__tests__/`

### Key Commands
- `npm run dev` — dev server on localhost:3000
- `npm run build` — production build
- `npm run test` — run tests (vitest)
- `npm run test:watch` — watch mode

### Deployment (Vercel)
- **Hosted on Vercel** — connected to `dmdaher/askmiyagi` GitHub repo
- **Production deploy**: pushing to `main` auto-deploys
- **Preview deploys**: pushing to any non-main branch auto-creates a preview URL
- `vercel` — manually deploy a preview from local working copy

---

## Architecture & Key Patterns

### File Structure
```
askmiyagi/src/
├── app/              # Next.js pages (home, tutorial/[deviceId]/[tutorialId])
├── components/
│   ├── ui/           # Shared: DeviceCard, TutorialCard, CategoryFilter, BrandingHeader
│   ├── controls/     # Reusable hardware controls (see list below)
│   ├── devices/      # Device-specific panels
│   │   ├── fantom-08/          # TSX sections (Zone, Common, Controller, etc.)
│   │   ├── ddj-flx4/           # TSX sections (Deck, Mixer, Effects, Browse, etc.)
│   │   ├── rc505-mk2/          # Placeholder
│   │   └── DataDrivenPanel.tsx  # Generic renderer for structural/absolute layouts
│   └── tutorial/     # TutorialRunner, StepContent, ProgressBar, NavigationControls, KeyboardZoneOverlay
├── data/
│   ├── devices.ts           # Device registry (all 4 devices)
│   ├── panelLayouts/        # Layout definitions (fantom-08, ddj-flx4, cdj-3000)
│   └── tutorials/           # Tutorial content per device
├── hooks/            # useTutorialEngine, usePanelState, useDisplayState
├── lib/              # Constants, noteHelpers, panelMapping utilities
├── store/            # Zustand tutorialStore
└── types/            # TypeScript interfaces: device, tutorial, panel, keyboard, display
```

### Shared Control Components (`components/controls/`)
Knob, Slider, PadButton, PanelButton, JogWheel, LevelMeter, TransportButton, Encoder, HorizontalFader, Wheel, Lever, ValueDial, LEDIndicator

**Always check these before building a custom control.** If a suitable component exists, use it.

### Two Panel Approaches

**Gen 1 — TSX Sections** (Fantom 08, DDJ-FLX4):
- Hand-crafted React components per section
- Full control over layout, styling, and custom elements (e.g., ribbed encoder, slide switches)
- Best for: complex panels needing pixel-perfect hardware replication
- Pattern: `devices/<name>/<Name>Panel.tsx` + `sections/*.tsx`

**Gen 2 — DataDrivenPanel** (CDJ-3000, all new instruments):
- Panels defined entirely as PanelLayoutData objects in `data/panelLayouts/`
- Generic renderer maps control types to shared components
- Supports `structural` (row-based flex/grid) and `absolute` (pixel positioning) modes
- Best for: panels where topology can be described declaratively
- Pattern: `data/panelLayouts/<name>.ts` → `DataDrivenPanel.tsx` renders it

**For all new instruments, use the Gen 2 data-driven approach.** Gen 1 TSX sections are maintained for existing instruments only.

### Panel Dimensions
Defined in `PANEL_DIMENSIONS` in `lib/constants.ts`:
- Fantom 08: 2700x580px
- DDJ-FLX4: 2400x1263px
- CDJ-3000: 800x1100px

TutorialRunner uses this lookup — not hardcoded values.

### State Management (Zustand)
- Single store: `tutorialStore.ts`
- Holds: tutorial data, current step index, panel state, display state, highlighted controls, zones
- Panel state is **cumulative** — each step builds on previous steps' state
- Use `usePanelState` and `useDisplayState` hooks for selector-based subscriptions

### Data Flow
1. Home page → select device → filter/select tutorial
2. Navigate to `/tutorial/[deviceId]/[tutorialId]`
3. Tutorial loads into Zustand store → TutorialRunner renders device panel + overlay
4. Arrow keys or buttons navigate steps; panel state accumulates progressively

### Tutorial Content Structure
- Tutorials defined in `data/tutorials/<device-id>/` as TypeScript objects
- Each step includes: title, instruction, details, highlightedControls, panelStateChanges, displayState, zones, tips
- Categories are defined per instrument based on the manual's chapter structure
- Difficulty levels: beginner, intermediate, advanced
- Canonical example: `src/data/tutorials/fantom-08/split-keyboard-zones.ts`

---

## Panel Design Workflow

### Panel Layout Workflow

**For Gen 1 panels (legacy only):** Design in the terminal first using ASCII art. Break the layout into rows and columns to communicate the structure clearly before writing any code.

**For Gen 2 panels (all new instruments):** Use the data-driven PanelLayoutData approach. The AI reads the manual to build the control catalog, then generates the layout data file. Reference photos verify spatial accuracy. No ASCII art step needed since the layout is defined as structured data.

For both approaches, the user must review and approve the layout before implementation proceeds.

### Agent Review Pipeline

This project uses a multi-agent quality assurance pipeline for panel layout validation. See `ASKMIYAGI-AGENT-SYSTEM.md` for the full agent roster, system prompts, and execution flow.

After EVERY design change to a panel, deploy parallel review agents:

| Agent | What It Checks |
|---|---|
| **Manual Diagram** | Control numbering matches manual, controls on correct rows/columns per diagrams, labels match, nothing missing/extra |
| **Reference Photo** | Visual positioning matches real hardware, proportions correct, spatial relationships accurate |
| **Row/Column Structure** | Components on same row are in same flex/grid container, no unintentional CSS wrapping, alignment consistent |
| **Space Utilization** | No unintentional gaps >20px, components fill containers, padding proportional, justify-* properties correct |

**Conflict resolution:** Photos win for spatial positioning. Manual wins for labeling. Re-run all agents after every fix round until all approve.

**Scoring:** All sections must be A- or above. If below, apply reviewer recommendations and re-score.

### General Design Rules
- Understand the full scope before proposing anything. Read existing code first.
- Reuse existing control components — check `components/controls/` before creating custom controls.
- Present the design approach to the user and get alignment before writing any code.
- When adding a new device panel, use the Gen 2 data-driven approach with PanelLayoutData.
- When adding a new tutorial, follow the existing tutorial structure pattern and export from the device's `index.ts`.
- Controls use 3D effects (radial gradients, box shadows) to look like real hardware.
- Follow the existing Tailwind + inline style pattern for dynamic colors and glows.

---

## Implementation Guidelines

- Before creating any file, search thoroughly for it first.
- Before editing any file, read it first.
- Prefer editing existing files over creating new ones.
- Keep solutions simple and focused. Don't add features beyond what was asked.
- All interactive components need `'use client'` directive at the top.
- CSS variables are defined in `globals.css`: `--background`, `--accent`, `--card-bg`, `--surface`.

---

## Quality Gates (MANDATORY)

Formal quality gates in `docs/quality-gates.md`. **You must follow them.**

| Trigger | Gate | What You Must Do |
|---------|------|------------------|
| Before implementing any screen or tutorial | **PRE-BUILD** | Read the specific manual pages, verify parameters, present ASCII layout |
| Before claiming work is done | **POST-BUILD** | Run build + tests, verify all registrations, confirm dev server |
| After any user correction | **CORRECTION** | Document mistake, identify root cause, write prevention rule |
| When writing any data shown in the UI | **CROSS-REFERENCE** | Verify against manual/existing data |
| After completing a major feature | **SELF-IMPROVEMENT** | Reflect, update docs, check if gates need new questions |
| After completing any tutorial batch | **GAP-ANALYSIS** | Cross-reference tutorials against manual TOC, document gaps |

Automated quality tests in `src/__tests__/codeQuality.test.ts`:
- All ScreenType values registered in DisplayScreen.tsx and test validScreenTypes
- All display components imported and have 'use client'
- No hardcoded hex colors (must use DISPLAY_COLORS/ZONE_COLORS from constants)
- No duplicate utility definitions

**These tests run with `npm run test` and WILL catch violations.**

---

## Verification & Testing

- After making changes, run `npm run test` and check the dev server.
- Don't mark something as done until it's fully confirmed working.
- If something fails, investigate the root cause rather than retrying.
- Tests live in `src/__tests__/` with subdirectories mirroring source structure.
- Use Vitest + React Testing Library + jsdom for component tests.

---

## Checking with the User

- **Exception: When running the full agent review pipeline**, work autonomously through all phases without pausing for confirmation until the orchestrator issues a final verdict. The pipeline is designed to be self-correcting through iterative agent review.
- For all other work, pause and confirm before: creating new files, destructive operations, anything affecting shared state.
- When corrected, stop immediately. Listen, adjust, then proceed.
- Don't make large assumptions about user intent. Ask when the path isn't obvious.
- Match the scope of actions to what was actually requested.

---

## Tutorial Batch Workflow (Phase 6 of New Instrument Pipeline)

Tutorials are Phase 6 of `docs/new-instrument-playbook.md`. Complete Phases 0-5 first.

See `memory/tutorial-batch-playbook.md` for the complete process.

**Quick start**: Write plan → Worktree → TDD per tutorial (update test → verify fail → create file → register → verify pass) → Code review → Merge to `test`.

**Batch size**: 3-5 tutorials grouped by manual chapter.

**Skip `spec-kit` for tutorial batches** — the TypeScript `Tutorial` type IS the spec, the reference manual IS the requirements. The process-enforcer agent should NOT flag this as a violation for tutorial or panel work.

**Use `spec-kit` for new features with unclear requirements** — when you need to discover WHAT to build before deciding HOW.

---

## Per-Device Reference

### Roland Fantom 08

**Panel:** TSX sections (Gen 1) — 2700x580px. Sections: Zone, Common, Controller, Synth Mode, Pads.

**Display:** LCD with 11 screen types (home, zone-view, key-range, menu, write, tone-select, effect, mixer, scene-edit, zone-edit, effects-edit). Components in `devices/fantom-08/display/`.

**Manuals (iCloud):**
- `FANTOM-06_07_08_Reference_eng01_W.pdf` — All screens, workflows, buttons (185 pp.)
- `FANTOM-06_07_08_Parameter_eng01_W.pdf` — All parameters (102 pp.)

**Photos:** `fantom_08_1.jpg`, `fantom_08_2.jpg`, `fantom_08_3.jpg` (iCloud)

**Control IDs:** `zone-1`..`zone-8`, `slider-1`..`slider-8`, `ctrl-knob-1`..`ctrl-knob-8`, `tone-cat-1`..`tone-cat-16`, `pad-1`..`pad-16`. Full list: `allFantom08ControlIds` in `src/data/panelLayouts/fantom-08.ts`.

**Tutorials:** 59 across 10 categories. Canonical example: `src/data/tutorials/fantom-08/split-keyboard-zones.ts`.

### Pioneer DDJ-FLX4

**Panel:** TSX sections (Gen 1) — 2400x1263px, 3-column layout (Deck 1 940px | Center 476px | Deck 2 940px). Sections: DeckSection, MixerSection, EffectsSection, BrowseSection, LoopControls.

**Display:** None — no LCD screen.

**Colors:** `DDJ_FLX4_COLORS` in `lib/constants.ts` — accent orange `#F57C00`.

**Control IDs:** `d1-*`/`d2-*` (decks), `ch1-*`/`ch2-*` (mixer channels), `fx-*` (effects), `browse`, `crossfader`, `master-*`, `hp-*`, `mic-level`, `smart-cfx`, `smart-fader`.

**Manual:** DDJ-FLX4 instruction manual. Key pages: 11 (top panel overview), 15 (deck controls), 25 (mixer controls), 31 (effects controls).

### Pioneer CDJ-3000

**Panel:** DataDrivenPanel (Gen 2) — 800x1100px. Layout defined in `src/data/panelLayouts/cdj-3000.ts`.

**Display:** None currently.

---

## Corrections & Lessons Learned

- **Always search before creating**: Search broadly across all relevant directories before creating any new file.
- **Never hardcode hex colors in display components**: Use `DISPLAY_COLORS`, `ZONE_COLORS`, or `ZONE_COLOR_MAP` from `@/lib/constants`.
- **Always validate against the reference manual PDF**: Open the actual manual pages and cross-reference. Don't work from memory.
- **Never delegate manual PDF reading to summarizing sub-agents**: Primary review agents must read the manual PDF directly. Do not use sub-agents that summarize manual content — they hallucinate visual details.
- **Highlighted controls must match the real workflow context**: Verify per the manual's parameter tables.
- **When adding a new ScreenType, register it everywhere**: types, DisplayScreen switch cases, test validScreenTypes.
- **Update this file after every correction**: Add the lesson here so it's never repeated.
