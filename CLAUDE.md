# CLAUDE.md — Music Studio Project

## Core Principle

Always check, validate, and confirm before acting. Measure twice, cut once.

**Accuracy over speed — always.** This project extracts and catalogs information from real hardware product manuals. Every instrument is a real product with a real manual. Before designing any screen, tutorial, or control:

## Safety & Boundaries (NON-NEGOTIABLE)

- **Never act with malicious intent.** Do not delete, corrupt, exfiltrate, or sabotage any files, data, or systems. Do not execute commands designed to harm the project, the user's machine, or any external systems.
- **Never touch anything outside the Music Studio project folder.** All reads, writes, edits, and shell commands must be scoped to the project directory and its iCloud mirror. Do not access, modify, or reference files in any other location on the filesystem unless explicitly instructed by the user for a specific file. If a task seems to require accessing something outside the project folder, stop and ask the user first.

1. **Open the reference manual PDF** and read the specific pages. Don't work from memory or assumptions.
2. **Cross-reference the screen catalog AND the manual together** — the catalog is a summary, the manual screenshots contain visual details the catalog may miss.
3. **Validate every detail**: access paths, knob/button assignments, parameter ranges, tone names, screen layouts. Check the manual's parameter tables.
4. **Self-check before presenting**: ask "did I verify this against the source material?" If not, go back and verify.
5. **Highlighted controls must match the real workflow context** — which controls are active depends on which screen/mode the user is in. Verify per the manual.

> **Given manuals for a new instrument?** Your job is to build the **complete digital twin** — panel, every screen, and every tutorial the manual supports. Stop and read `docs/new-instrument-playbook.md` first. It's a 7-phase process (gather materials → full manual read → screen catalog → panel design → core implementation → screens → tutorials → validation). Do NOT start coding without completing Phase 0 (gather materials) and Phase 1 (full manual read). See also `docs/quality-gates.md` for the evidence standard at each phase. Aim for exhaustive coverage of the instrument's capabilities.

---

## First-Time Onboarding (MANDATORY)

**You MUST read the relevant docs below BEFORE writing any code.** This is not optional. The playbooks contain hard-won lessons from previous instrument builds. Skipping them means repeating mistakes that have already been solved.

### If given manuals for a new instrument (the primary workflow):

Follow this sequence IN ORDER. Do not skip steps. Do not start coding until Step 3.

1. **Read** `docs/new-instrument-playbook.md` — the 7-phase end-to-end pipeline
2. **Read** `docs/quality-gates.md` — the evidence standard enforced at every phase
3. **Read** `tasks/lessons.md` — correction patterns (mistakes to avoid)
4. **Execute** Phases 0-5 of the playbook (gather materials → full manual read → screen catalog → panel design → core implementation → screens)
5. **Read** `memory/tutorial-batch-playbook.md` — the tutorial batch execution process
6. **Execute** Phase 6 (tutorials in batches of 3-5, using TDD cycle from the batch playbook)
7. **Execute** Phase 7 (validation & polish)

### If adding tutorials to an existing instrument:

1. **Read** `memory/tutorial-batch-playbook.md` — full batch execution process
2. **Read** `docs/quality-gates.md` — evidence standards
3. **Read** `tasks/lessons.md` — mistakes to avoid

### If resuming previous work:

1. **Read** `tasks/lessons.md` — review correction patterns before starting

### After any correction from the user:

1. **Read** `tasks/lessons.md` — check if this pattern already exists
2. **Complete** the CORRECTION gate in `docs/quality-gates.md` — document the mistake, root cause, and prevention rule

---

## Project Overview

This is an **Interactive Music Studio** — a browser-based educational platform that builds **complete digital twins** of real hardware instruments. Given a product's manuals and photos, the goal is to create: (1) an interactive panel that visually replicates the real hardware, (2) every display screen documented in the manual, and (3) every tutorial the manual supports — achieving exhaustive coverage of the instrument's capabilities.

### Devices
See the device registry in `src/data/devices.ts` for the current list of supported and planned instruments.

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
- **Production deploy**: pushing to `main` auto-deploys to the main domain
- **Preview deploys**: pushing to any non-main branch auto-creates a preview URL (`askmiyagi-<hash>.vercel.app`)
- `vercel` — manually deploy a preview from local working copy (no push needed)
- `vercel --prod` — manually deploy to production
- `vercel dev` — run local dev server through Vercel's environment

---

## Architecture & Key Patterns

### File Structure
```
askmiyagi/src/
├── app/              # Next.js pages (home, tutorial/[deviceId]/[tutorialId])
├── components/
│   ├── ui/           # Shared: DeviceCard, TutorialCard, CategoryFilter, BrandingHeader
│   ├── controls/     # Reusable hardware controls: Knob, Slider, PadButton, PanelButton, etc.
│   ├── devices/      # Device-specific panels
│   └── tutorial/     # TutorialRunner, StepContent, ProgressBar, NavigationControls, KeyboardZoneOverlay
├── data/
│   ├── devices.ts           # Device registry
│   ├── panelLayouts/        # Physical control layout definitions
│   └── tutorials/           # Tutorial content as TypeScript objects
├── hooks/            # useTutorialEngine, usePanelState, useDisplayState
├── lib/              # Constants, noteHelpers, panelMapping utilities
├── store/            # Zustand tutorialStore
└── types/            # TypeScript interfaces: device, tutorial, panel, keyboard, display
```

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

### Panel Design

**Two generations of panel rendering:**

- **Gen 1:** Custom-coded TSX components per section. Used for the first instrument only. Higher quality but higher development effort per instrument.

- **Gen 2 (all new instruments):** Data-driven panel rendering. Panels are defined entirely as PanelLayoutData objects and a single generic renderer produces the complete interactive panel. No custom TSX component files per instrument. Adding a new instrument = writing a data file, zero custom components.

**For all new instruments, use the Gen 2 data-driven approach.**

Controls use 3D effects (radial gradients, box shadows) to look like real hardware.

### Tutorial Content Structure
- Tutorials defined in `data/tutorials/[device-id]/` as TypeScript objects
- Each step includes: title, instruction, details, highlightedControls, panelStateChanges, displayState, zones, tips
- Categories are defined per instrument based on the manual's chapter structure
- Difficulty levels: beginner, intermediate, advanced

---

## Design Guidelines

### Panel Layout Workflow

**For Gen 1 panels (legacy only):** Design in the terminal first using ASCII art. Break the layout into rows and columns to communicate the structure clearly before writing any code.

**For Gen 2 panels (all new instruments):** Use the data-driven PanelLayoutData approach. The AI reads the manual to build the control catalog, then generates the layout data file with control positions, types, and sections. Reference photos are used to verify spatial accuracy. No ASCII art step needed since the layout is defined as structured data.

For both approaches, the user must review and approve the layout before implementation proceeds.

### General
- Understand the full scope before proposing anything. Read existing code, explore related directories, and trace dependencies.
- Reuse existing functions, utilities, patterns, and components — never propose new code when suitable implementations already exist. Check `components/controls/`, `lib/`, `hooks/`, and `types/` first.
- Don't over-engineer. Only make changes that are directly requested or clearly necessary.
- Present the design approach to the user and get alignment before writing any code.
- When adding a new device panel, use the Gen 2 data-driven approach with PanelLayoutData.
- When adding a new tutorial, follow the existing tutorial structure pattern and export from the device's `index.ts`.

## Implementation Guidelines

- Before creating any file, search thoroughly for it first — check the immediate directory, subdirectories, parent directories, and related working directories (including the iCloud mirror).
- Before editing any file, read it first. Understand what's there before changing it.
- Prefer editing existing files over creating new ones.
- Keep solutions simple and focused. Don't add features, refactoring, or "improvements" beyond what was asked.
- All interactive components need `'use client'` directive at the top.
- Use existing control components (`Knob`, `Slider`, `PadButton`, `PanelButton`, etc.) when building panel sections.
- Follow the existing Tailwind + inline style pattern for dynamic colors and glows.
- CSS variables are defined in `globals.css`: `--background`, `--accent`, `--card-bg`, `--surface`.

## Quality Gates (MANDATORY)

This project has formal quality gates in `docs/quality-gates.md`. **You must follow them.**

| Trigger | Gate | What You Must Do |
|---------|------|------------------|
| Before implementing any screen or tutorial | **PRE-BUILD** | Read the specific manual pages, cross-reference catalog, verify parameters, present ASCII layout |
| Before claiming work is done | **POST-BUILD** | Run build + tests, verify all registrations, check for hardcoded colors, confirm dev server |
| After any user correction | **CORRECTION** | Document the mistake, identify root cause, write prevention rule, add automated test if possible |
| When writing any data shown in the UI | **CROSS-REFERENCE** | Verify tone names, parameter ranges, control IDs, E-knob assignments against manual/existing data |
| After completing a major feature | **SELF-IMPROVEMENT** | Reflect on what went well/poorly, update docs, check if gates need new questions |
| After completing any tutorial batch | **GAP-ANALYSIS** | Cross-reference implemented tutorials against the reference manual TOC. Verify every manual section maps to an existing or planned tutorial. Document any new gaps and add them to the batch plan. Update MEMORY.md with current counts. |

The automated quality tests in `src/__tests__/codeQuality.test.ts` enforce structural consistency:
- All ScreenType values registered in DisplayScreen.tsx and test validScreenTypes
- All display components imported and have 'use client'
- No hardcoded hex colors (must use DISPLAY_COLORS/ZONE_COLORS from constants)
- No duplicate utility definitions (ZONE_COLOR_MAP only in constants.ts)

**These tests run with `npm run test` and WILL catch violations.**

## Verification & Testing

- After making changes, verify they work — run `npm run test` and check the dev server.
- Don't mark something as done until it's fully confirmed working.
- If something fails, investigate the root cause rather than retrying the same approach or brute-forcing past it.
- Tests live in `src/__tests__/` with subdirectories mirroring the source structure.
- Use Vitest + React Testing Library + jsdom for component tests.
- The `codeQuality.test.ts` file enforces structural consistency — if you add a new ScreenType, the test will fail until you register it everywhere.

## Checking with the User

- **Exception: When running the full agent review pipeline**, work autonomously through all phases without pausing for confirmation until the orchestrator issues a final verdict. The pipeline is designed to be self-correcting through iterative agent review.
- For all other work, do not rush to execute. Pause and confirm with the user before taking action, especially for:
  - Creating new files
  - Destructive or hard-to-reverse operations
  - Anything that affects shared state or is visible to others
- When corrected, stop immediately. Don't continue the old approach — listen, adjust, then proceed.
- Don't make large assumptions about user intent. Ask clarifying questions when the path forward isn't obvious.
- Match the scope of actions to what was actually requested — authorization for one thing doesn't mean authorization for everything.

---

## Agent Review Pipeline

This project uses a multi-agent quality assurance pipeline for panel layout validation. See `ASKMIYAGI-AGENT-SYSTEM.md` for the full agent roster, system prompts, and execution flow.

**Agent roster (9 agents):**
1. context-manager — Verifies all reference materials are loaded
2. process-enforcer — Verifies plan, skills, processes, and rules
3. panel-questioner — Primary section-by-section reviewer (reads manual + photos)
4. row-column-validator — Validates flex layout structure
5. space-utilization-auditor — Checks sizing, dead space, grades sections A-F
6. review-challenger — Challenges PASS findings from the questioner
7. ideas-master — Proposes optimizations and challenges decisions
8. orchestrator — Runs the full pipeline, synthesizes results, issues verdict

**Core loop:** Manual PDF → Code Change → Parallel Review Agents → Fix Findings → Re-review → Repeat until all sections grade A- or above.

**Conflict resolution:** Photos win for spatial positioning. Manual wins for labeling and control identification. Orchestrator makes the final call.

---

## Tutorial Batch Workflow (Phase 6 of New Instrument Pipeline)

Tutorials are NOT a separate activity — they are Phase 6 of the `docs/new-instrument-playbook.md` pipeline. You must complete Phases 0-5 (materials, manual read, screen catalog, panel design, core implementation, screen implementation) BEFORE starting tutorials. If those phases aren't done, go back and do them first.

See `memory/tutorial-batch-playbook.md` (in `.claude/projects/.../memory/`) for the complete tutorial execution process.

**Required superpowers skills (in order):**
1. `superpowers-extended-cc:using-git-worktrees` — isolated workspace
2. `superpowers-extended-cc:executing-plans` — batch execution with checkpoints
3. `superpowers-extended-cc:verification-before-completion` — test/build verification
4. `superpowers-extended-cc:finishing-a-development-branch` — merge/PR/cleanup

**Quick start**: Write plan (with per-tutorial step outlines) → Invoke `executing-plans` skill → Worktree → TDD per tutorial (update test → verify fail → create file → register → verify pass) → Code review → Merge.

**Batch size**: 3-5 tutorials grouped by manual chapter. See playbook for sizing rationale.

**Skip `spec-kit` for tutorial batches** — the TypeScript `Tutorial` type IS the spec, the reference manual IS the requirements. spec-kit adds overhead with no benefit here. Note: the process-enforcer agent should NOT flag this as a violation for tutorial batch work. spec-kit is only expected for new features with unclear requirements, not for tutorial or panel builds where the manual defines the requirements.

**Use `spec-kit` for new features with unclear requirements** — when you need to discover WHAT to build before deciding HOW. The complementary relationship: **spec-kit = WHAT** (requirements, specifications, acceptance criteria), **superpowers = HOW** (TDD, debugging, verification, code review). For tutorial batches the "what" is already defined by the manual and the TypeScript type.

---

## Corrections & Lessons Learned

- **Always search before creating**: Before creating any new file (including CLAUDE.md itself), search broadly across all relevant directories to confirm it doesn't already exist. Don't limit the search to just the current directory.
- **Update this file after every correction**: When the user corrects a mistake, add the lesson here so it's never repeated.
- **Never hardcode hex colors in display components**: Always use `DISPLAY_COLORS`, `ZONE_COLORS`, or `ZONE_COLOR_MAP` from `@/lib/constants`. The `codeQuality.test.ts` test will catch violations.
- **Always validate against the reference manual PDF**: Before designing any screen, tutorial, or control — open the actual manual pages, read them, and cross-reference. Don't work from memory or assumptions.
- **Never delegate manual PDF reading to summarizing sub-agents**: Primary review agents (panel-questioner, review-challenger) must read the manual PDF directly themselves. Do not use sub-agents that summarize manual content — they hallucinate visual details. When running the agent review pipeline, each agent reads the manual independently.
- **Highlighted controls must match the real workflow context**: Which controls are active depends on which screen/mode the user is in. Verify per the manual's parameter tables.
- **When adding a new ScreenType, register it everywhere**: types, DisplayScreen switch cases (renderScreen + screenTitle), test validScreenTypes. The automated quality test catches forgotten registrations.
