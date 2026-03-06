# CLAUDE.md — Music Studio Project

## Core Principle

Always check, validate, and confirm before acting. Measure twice, cut once.

**Accuracy over speed — always.** This project extracts and catalogs information from real hardware product manuals. Every instrument is a real product with a real manual. Before designing any screen, tutorial, or control:

1. **Open the reference manual PDF** and read the specific pages. Don't work from memory or assumptions.
2. **Cross-reference the screen catalog AND the manual together** — the catalog is a summary, the manual screenshots contain visual details the catalog may miss.
3. **Validate every detail**: access paths, knob/button assignments, parameter ranges, tone names, screen layouts. Check the manual's parameter tables.
4. **Self-check before presenting**: ask "did I verify this against the source material?" If not, go back and verify.
5. **Highlighted controls must match the real workflow context** — which controls are active depends on which screen/mode the user is in. Verify per the manual.

> **Given manuals for a new instrument?** Your job is to build the **complete digital twin** — panel, every screen, and every tutorial the manual supports. Stop and read `docs/new-instrument-playbook.md` first. It's a 7-phase process (gather materials → full manual read → screen catalog → panel design → core implementation → screens → tutorials → validation). Do NOT start coding without completing Phase 0 (gather materials) and Phase 1 (full manual read). See also `docs/quality-gates.md` for the evidence standard at each phase. The Fantom 08 produced 59 tutorials across 10 categories from its manuals — aim for equivalent exhaustive coverage.

---

## First-Time Onboarding (MANDATORY)

**You MUST read the relevant docs below BEFORE writing any code.** This is not optional. The playbooks contain hard-won lessons from 8 batches and 57 tutorials. Skipping them means repeating mistakes that have already been solved.

### If given manuals for a new instrument (the primary workflow):

Follow this sequence IN ORDER. Do not skip steps. Do not start coding until Step 3.

1. **Read** `docs/new-instrument-playbook.md` — the 7-phase end-to-end pipeline
2. **Read** `docs/quality-gates.md` — the evidence standard enforced at every phase
3. **Read** `tasks/lessons.md` — 10 correction patterns (mistakes to avoid)
4. **Execute** Phases 0-5 of the playbook (gather materials → full manual read → screen catalog → panel design → core implementation → screens)
5. **Read** `memory/tutorial-batch-playbook.md` — the tutorial batch execution process
6. **Execute** Phase 6 (tutorials in batches of 3-5, using TDD cycle from the batch playbook)
7. **Execute** Phase 7 (validation & polish)

### If adding tutorials to an existing instrument:

1. **Read** `memory/tutorial-batch-playbook.md` — full batch execution process
2. **Read** `docs/quality-gates.md` — evidence standards
3. **Read** `tasks/lessons.md` — mistakes to avoid

### If resuming previous work:

1. **Read** `memory/session-log.md` — last session context

### After any correction from the user:

1. **Read** `tasks/lessons.md` — check if this pattern already exists
2. **Complete** the CORRECTION gate in `docs/quality-gates.md` — document the mistake, root cause, and prevention rule

---

## Project Overview

This is an **Interactive Music Studio** — a browser-based educational platform that builds **complete digital twins** of real hardware instruments. Given a product's manuals and photos, the goal is to create: (1) an interactive panel that visually replicates the real hardware, (2) every display screen documented in the manual, and (3) every tutorial the manual supports — achieving exhaustive coverage of the instrument's capabilities. The Fantom 08 is the reference implementation: 185-page manual → 298 screen catalog entries → 11 screen types → 59 tutorials across 10 categories.

### Devices
- **Roland Fantom 08** — Fully built interactive panel with 88-key keyboard, LCD display, zone controls, knobs, sliders, pads, transport controls
- **Boss RC-505 MK2** — Placeholder ("Coming Soon")

### Working Directories
- **Primary**: `/Users/devin/Documents/Fun & Stuff/Music/Music Studio`
- **iCloud mirror**: `/Users/devin/Library/Mobile Documents/com~apple~CloudDocs/Documents/Fun & Stuff/Music/Music Studio`
- The iCloud directory also contains Fantom hardware manuals (PDFs) and reference photos

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
│   ├── devices/      # Device-specific panels (fantom-08/, rc505-mk2/)
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
- Fantom 08 panel is 2700x580px (`PANEL_NATURAL_WIDTH` x `PANEL_NATURAL_HEIGHT` in constants), organized into sections: Zone, Common, Controller, Synth Mode, Pads
- LCD display has multiple screen types: home, zone-view, key-range, menu, write, tone-select
- Controls use 3D effects (radial gradients, box shadows) to look like real hardware
- The panel was iteratively refined to match the real Fantom 08 hardware layout

### Tutorial Content Structure
- Tutorials defined in `data/tutorials/fantom-08/` as TypeScript objects
- Each step includes: title, instruction, details, highlightedControls, panelStateChanges, displayState, zones, tips
- Categories: Basics, Zones & Splits, Sound Design, Effects, MIDI, Performance, Sequencer, Sampling
- Difficulty levels: beginner, intermediate, advanced

---

## Design Guidelines

### Panel Layout Workflow
When designing or modifying instrument panels, **always design in the terminal first** using ASCII art. Break the layout into rows and columns to communicate the structure clearly before writing any code. This lets the user review and approve the layout visually before implementation begins. Example:
```
Row 1: [ZONE 1] [ZONE 2] [ZONE 3] [ZONE 4] | [COMMON] | [SCENE]
Row 2: [Knob1] [Knob2] [Knob3] [Slider1]   | [Display] | [Pad1][Pad2]
```
This row/column approach maps directly to how we structure the panel sections and flex layouts in code.

### General
- Understand the full scope before proposing anything. Read existing code, explore related directories, and trace dependencies.
- Reuse existing functions, utilities, patterns, and components — never propose new code when suitable implementations already exist. Check `components/controls/`, `lib/`, `hooks/`, and `types/` first.
- Don't over-engineer. Only make changes that are directly requested or clearly necessary.
- Present the design approach to the user and get alignment before writing any code.
- When adding a new device panel, follow the `fantom-08/` pattern: panel component, sections, display screens.
- When adding a new tutorial, follow the `split-keyboard-zones.ts` structure and export from the device's `index.ts`.

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

- Do not rush to execute. Pause and confirm with the user before taking action, especially for:
  - Creating new files
  - Destructive or hard-to-reverse operations
  - Anything that affects shared state or is visible to others
- When corrected, stop immediately. Don't continue the old approach — listen, adjust, then proceed.
- Don't make large assumptions about user intent. Ask clarifying questions when the path forward isn't obvious.
- Match the scope of actions to what was actually requested — authorization for one thing doesn't mean authorization for everything.

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

**Skip `spec-kit` for tutorial batches** — the TypeScript `Tutorial` type IS the spec, the reference manual IS the requirements. spec-kit adds overhead with no benefit here.

**Use `spec-kit` for new features with unclear requirements** — when you need to discover WHAT to build before deciding HOW. The complementary relationship: **spec-kit = WHAT** (requirements, specifications, acceptance criteria), **superpowers = HOW** (TDD, debugging, verification, code review). For tutorial batches the "what" is already defined by the manual and the TypeScript type.

---

## Fantom 08 Reference Documents

### PDF Manuals (iCloud mirror)
- `Roland Fantom-0 Series Reference Manual.pdf` — All screens, workflows, buttons (185 pp.)
- `Roland Fantom-0 Series Parameter Guide.pdf` — All parameters: Scene, Zone, Tone types, Effects (102 pp.)
- Additional owner's manuals / MIDI docs in same directory

**iCloud path**: `/Users/devin/Library/Mobile Documents/com~apple~CloudDocs/Documents/Fun & Stuff/Music/Music Studio/`

### Hardware Photos
- `fantom_08_1.jpg`, `fantom_08_2.jpg`, `fantom_08_3.jpg` — for panel verification

### Display Screen Types → Components
| ScreenType | Component | Shows |
|---|---|---|
| `home` | `SceneSelectScreen` | Scene number/name, zone summary |
| `zone-view` | `ZoneViewScreen` | 1/4/8/16-zone grid with tones, ranges, volumes |
| `key-range` | `KeyRangeScreen` | Split point / note range editor |
| `write` | `WriteScreen` | Save confirmation dialog |
| `menu` | `MenuScreen` | Generic scrollable list |
| `tone-select` | `MenuScreen` | Category tabs + tone list |
| `effect` | `MenuScreen` | Effects parameter list |
| `mixer` | `MixerScreen` | 8/16-zone channel-strip mixer (vol, pan, solo, mute, EQ, sends) |
| `scene-edit` | `SceneEditScreen` | Tabbed scene parameter editor (9 tabs, manual p.54) |
| `zone-edit` | `ZoneEditScreen` | Tabbed zone parameter grid with INT/EXT categories (manual p.54-55) |
| `effects-edit` | `EffectsEditScreen` | Signal routing diagram with effect blocks (manual p.66-67) |

### Control ID Naming Convention
- Zone buttons: `zone-1`..`zone-8`, `zone-9-16`, `zone-select`
- Sliders/Knobs: `slider-1`..`slider-8`, `ctrl-knob-1`..`ctrl-knob-8`
- Tone categories: `tone-cat-1`..`tone-cat-16` (A.Piano, E.Piano, Organ, Keys, Guitar, Bass, Strings, Brass, Wind, Choir, Synth, Pad, FX, Drums, User, Assign)
- Pads: `pad-1`..`pad-16`
- Full list: `allFantom08ControlIds` in `src/data/panelLayouts/fantom-08.ts`

### Canonical Tutorial Example
`src/data/tutorials/fantom-08/split-keyboard-zones.ts` — 10-step beginner tutorial demonstrating all patterns (zones, display states, panel state changes, tone selection, write/save)

---

## Corrections & Lessons Learned

- **Always search before creating**: Before creating any new file (including CLAUDE.md itself), search broadly across all relevant directories to confirm it doesn't already exist. Don't limit the search to just the current directory.
- **Update this file after every correction**: When the user corrects a mistake, add the lesson here so it's never repeated.
- **Never hardcode hex colors in display components**: Always use `DISPLAY_COLORS`, `ZONE_COLORS`, or `ZONE_COLOR_MAP` from `@/lib/constants`. The `codeQuality.test.ts` test will catch violations.
- **Always validate against the reference manual PDF**: Before designing any screen, tutorial, or control — open the actual manual pages, read them, and cross-reference. Don't work from memory or assumptions.
- **Never delegate manual PDF reading to agents**: Screen layouts must be described from direct PDF reading, not from agent summaries or general knowledge. Agents describe screens from assumptions that may be incorrect.
- **Highlighted controls must match the real workflow context**: Which controls are active depends on which screen/mode the user is in. Verify per the manual's parameter tables.
- **When adding a new ScreenType, register it everywhere**: types, DisplayScreen switch cases (renderScreen + screenTitle), test validScreenTypes. The automated quality test catches forgotten registrations.
