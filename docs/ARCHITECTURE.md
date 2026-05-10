# AskMiyagi — Architecture Reference

> **Purpose:** This document is the single source of truth for understanding the AskMiyagi codebase. Read this FIRST before making any changes. Updated 2026-05-03.

---

## What Is AskMiyagi?

An interactive music studio platform that builds **digital twins** of real hardware instruments (synthesizers, DJ controllers, drum machines). Users learn their instruments through step-by-step tutorials with a visual replica of their hardware that highlights controls, shows LED states, and displays screen content in real-time.

---

## System Overview (End-to-End Flow)

```
INSTRUMENT CREATION                    EDITING                         END USER
─────────────────                     ───────                         ────────
Admin uploads manual + photos    →    Pipeline runs (AI agents)   →   Gatekeeper manifest
                                      ↓
                                      Layout Engine (deterministic)
                                      ↓
                                      manifest-editor.json
                                      ↓
                                      Admin sends to contractor (Blob)
                                      ↓
                                      Contractor positions controls
                                      ↓
                                      Admin reviews + approves
                                      ↓
                                      Export to src/data/manifests/
                                      ↓
                                      PanelRenderer renders panel  →   User sees instrument
                                      ↓
                                      Tutorial builder generates   →   User follows tutorials
                                      tutorial .ts files
```

---

## Directory Structure

```
src/
├── app/                          # Next.js App Router (pages + API routes)
│   ├── page.tsx                  # Home — device selector + tutorial search
│   ├── tutorial/[deviceId]/[tutorialId]/  # Tutorial runner
│   ├── editor/                   # Contractor panel editor (auth: contractor_access cookie)
│   │   ├── page.tsx              # List hosted panels
│   │   ├── [deviceId]/           # Edit specific panel
│   │   └── practice/             # Sandbox editor for training
│   ├── admin/                    # Pipeline dashboard (auth: admin_access cookie)
│   │   ├── page.tsx              # Dashboard with pipeline cards
│   │   └── [deviceId]/           # Pipeline detail + editor
│   ├── signin/                   # Password auth (sets cookie)
│   ├── legal/                    # Terms, Privacy, Disclaimer
│   └── api/
│       ├── pipeline/             # Pipeline management API (30+ routes)
│       │   └── [deviceId]/       # Per-device: manifest, health, logs, export, etc.
│       └── hosted/panels/        # Blob storage API (contractor editor)
│           └── [deviceId]/       # GET/PUT manifest, status, photos, history
│
├── components/
│   ├── controls/                 # Reusable instrument control components
│   │   ├── PanelRenderer.tsx     # Factory: manifest JSON → rendered panel
│   │   ├── PanelShell.tsx        # Outer wrapper (branding, texture, keyboard)
│   │   ├── SectionContainer.tsx  # Visual section boundary
│   │   ├── PanelButton.tsx       # Button (9 variants: standard, transport, rubber, etc.)
│   │   ├── Knob.tsx              # Rotary knob
│   │   ├── Slider.tsx            # Vertical/horizontal fader
│   │   ├── PadButton.tsx         # Performance pad
│   │   ├── Wheel.tsx             # Touch wheel
│   │   ├── ValueDial.tsx         # Small encoder dial
│   │   ├── Lever.tsx             # Toggle lever/switch
│   │   ├── DirectionSwitch.tsx   # Multi-position switch
│   │   ├── Port.tsx              # USB/SD/ethernet port
│   │   ├── TouchDisplay.tsx      # Touch screen display
│   │   ├── JogWheelAssembly.tsx  # Jog wheel + display composite
│   │   ├── JogDisplay.tsx        # Jog wheel center display
│   │   ├── Keyboard.tsx          # Piano keyboard with zones
│   │   └── TransportButton.tsx   # Play/pause/stop/record
│   │
│   ├── panel-editor/             # Visual panel editor system
│   │   ├── PanelEditor.tsx       # Main editor orchestrator
│   │   ├── PanCanvas.tsx         # Canvas with zoom/pan + preview mode
│   │   ├── ControlNode.tsx       # Draggable/resizable control wrapper (react-rnd)
│   │   ├── ControlLayer.tsx      # Flat layer rendering all controls (z=200)
│   │   ├── SectionFrame.tsx      # Section boundary in editor (full/header-only/hidden)
│   │   ├── LabelLayer.tsx        # Floating labels overlay
│   │   ├── LayersPanel.tsx       # Layers tree (sections → groups → controls)
│   │   ├── EditorToolbar.tsx     # Top toolbar (undo, zoom, grid, preview, submit)
│   │   ├── ContextMenu.tsx       # Right-click menu (align, group, lock, z-order)
│   │   ├── PropertiesPanel/      # Right sidebar (type, label, geometry, lock, z-order)
│   │   │   ├── index.tsx         # Main properties orchestrator
│   │   │   ├── LabelEditor.tsx   # Label text, position, font size, dual-label
│   │   │   ├── ControlTypeSelector.tsx
│   │   │   └── GeometryFields.tsx
│   │   ├── store/                # Zustand store (3 composable slices)
│   │   │   ├── index.ts          # Combined store export
│   │   │   ├── manifestSlice.ts  # Controls, sections, labels, groups, actions
│   │   │   ├── canvasSlice.ts    # Zoom, pan, grid, photo overlay, preview mode
│   │   │   └── historySlice.ts   # Undo/redo stack
│   │   ├── hooks/
│   │   │   ├── useAutoSave.ts    # Debounced save to API/Blob
│   │   │   ├── useEditorKeyboard.ts  # Keyboard shortcuts
│   │   │   ├── useMarkEdited.ts  # Track user interaction (gates auto-save)
│   │   │   └── useZoomPan.ts     # Scroll zoom + drag pan
│   │   └── [other editor components]
│   │
│   ├── admin/                    # Admin dashboard components
│   │   ├── PipelineDashboard.tsx  # Pipeline card grid
│   │   ├── PipelineDetail.tsx     # Single pipeline deep-dive
│   │   ├── ContractorSubmissions.tsx  # Review contractor work
│   │   ├── CostBreakdown.tsx      # API cost tracking
│   │   └── [15+ admin components]
│   │
│   ├── devices/                  # Hand-coded device panels (pre-manifest era)
│   │   ├── fantom-08/            # FantomPanel + 40+ display screens
│   │   ├── deepmind-12/          # DeepMindPanel + display
│   │   ├── rc505-mk2/            # RC505Panel
│   │   └── cdj-3000/             # CDJ3000Panel sections
│   │
│   ├── tutorial/                 # Tutorial runner components
│   │   ├── TutorialRunner.tsx     # Step navigator + panel rendering
│   │   ├── StepContent.tsx        # Instruction display
│   │   ├── NavigationControls.tsx # Prev/next + autoplay
│   │   └── [other tutorial UI]
│   │
│   └── ui/                       # Shared UI components
│       ├── BrandingHeader.tsx
│       ├── DeviceCard.tsx
│       └── TutorialCard.tsx
│
├── data/
│   ├── devices.ts                # Device registry (metadata)
│   ├── manifests/                # Committed production manifests (JSON)
│   │   ├── fantom-06.json
│   │   ├── cdj-3000.json
│   │   └── dj-djs-1000.json
│   ├── tutorials/                # Tutorial definitions (TypeScript)
│   │   ├── fantom-08/            # 59 tutorials, 675 tests
│   │   ├── deepmind-12/
│   │   └── rc505-mk2/
│   └── glossary/                 # Device-specific terminology
│
├── lib/
│   ├── deviceRegistry.ts         # Maps deviceId → PanelComponent + tutorials
│   ├── makePanelFromManifest.tsx  # Factory: JSON manifest → React component
│   ├── panelMapping.ts           # buildCumulativeState() for tutorials
│   ├── label-position.ts         # computeLabelPosition() shared logic
│   ├── hardware-icons.ts         # Unicode icon map (play, stop, record, etc.)
│   ├── hosted-storage.ts         # Vercel Blob API wrapper
│   ├── env.ts                    # isHosted, isDev flags
│   ├── constants.ts              # Global constants
│   ├── pipeline/                 # Pipeline orchestration
│   │   ├── state-machine.ts      # State persistence + phase transitions
│   │   ├── types.ts              # PipelinePhase, PipelineState, Escalation
│   │   ├── paths.ts              # .pipeline/ filesystem helpers
│   │   ├── checkpoint-validators.ts  # Mechanical validation
│   │   ├── cost-tracker.ts       # Token + USD tracking
│   │   └── manifest-version.ts   # Content hash for change detection
│   ├── assistant/                # AI tutorial search
│   │   ├── search.ts
│   │   ├── tutorialIndex.ts
│   │   └── responseBuilder.ts
│   └── devices/                  # Per-device constants
│
├── store/                        # Global Zustand stores
│   ├── pipelineStore.ts          # Pipeline dashboard state + SSE
│   ├── tutorialStore.ts          # Tutorial progress + cumulative state
│   └── previewStore.ts           # Access gate (invite codes)
│
├── types/
│   ├── manifest.ts               # MasterManifest, ManifestControl, ManifestSection
│   ├── panel.ts                  # PanelState, ButtonState (runtime state for tutorials)
│   ├── display.ts                # DisplayState (screen content for tutorials)
│   ├── tutorial.ts               # Tutorial, TutorialStep
│   ├── device.ts                 # DeviceInfo metadata
│   └── keyboard.ts               # ZoneConfig for keyboard coloring
│
├── hooks/                        # Shared hooks
│   ├── useTutorialEngine.ts
│   └── usePanelState.ts
│
└── __tests__/                    # Vitest test suites

scripts/
├── pipeline-runner.ts            # Main pipeline event loop (spawned as detached process)
└── layout-engine.ts              # Deterministic manifest → template converter

.claude/agents/                   # Agent SOUL files (prompt definitions)
├── gatekeeper.md                 # Judge agent — reconciles text + geometry
├── diagram-parser.md             # Vision agent — extracts spatial geometry
├── control-extractor.md          # Text agent — reads manual PDF
└── [other agents]

.pipeline/                        # Per-device pipeline working directory (gitignored)
├── <device-id>/
│   ├── state.json                # Pipeline state (phase, status, costs)
│   ├── manifest.json             # Gatekeeper output (Master Manifest)
│   ├── manifest-editor.json      # Contractor-edited manifest
│   ├── templates.json            # Layout Engine output
│   ├── runner.log                # Pipeline execution logs
│   ├── cost.json                 # Cost tracking
│   ├── input/manuals/            # PDF manuals
│   ├── input/photos/             # Hardware reference photos
│   └── agents/<agent-name>/      # Per-agent checkpoints + outputs

docs/
├── plans/                        # Design plans + architecture decisions
├── Pioneer/CDJ-3000/             # Device manuals + photos
├── Roland/fantom-06/
└── contractor-guide/             # Contractor reference docs
```

---

## Two-Tier Panel System

### Tier 1: Hand-Coded Panels (legacy, high fidelity)
- `src/components/devices/fantom-08/FantomPanel.tsx` — 59 tutorials, 40+ display screens
- `src/components/devices/deepmind-12/DeepMindPanel.tsx`
- `src/components/devices/rc505-mk2/RC505Panel.tsx`
- Full React components with custom layouts, display screens, animations
- NOT manifest-based — hand-authored for maximum visual fidelity

### Tier 2: Manifest-Based Panels (scalable, new instruments)
- `src/data/manifests/fantom-06.json`, `cdj-3000.json`, etc.
- Rendered by `PanelRenderer.tsx` from JSON manifest
- Created by pipeline → edited by contractor → exported
- `makePanelFromManifest()` wraps PanelRenderer for device registry

### Device Registry Bridge
```typescript
// src/lib/deviceRegistry.ts
DEVICE_REGISTRY = {
  'fantom-08': {
    PanelComponent: FantomPanel,           // Tier 1: hand-coded
    tutorials: fantom08Tutorials,
    dimensions: { width: 2700, height: 580 }
  },
  'fantom-06': {
    PanelComponent: makePanelFromManifest(fantom06Manifest),  // Tier 2: manifest
    tutorials: [],
    dimensions: { width: 1200, height: 361 }
  },
}
```

---

## Key Data Types

### ControlDef (Editor — manifestSlice.ts)
The editor's internal representation of a control. All fields are flat (no nesting).
```
id, label, type, sectionId, x, y, w, h, rotation,
labelPosition, labelFontSize, labelDisplay, labelAlign, labelColor,
shape, sizeClass, surfaceColor, buttonStyle, icon,
hasLed, ledColor, ledStyle, ledVariant, ledPosition, ledBehavior,
locked, resizeLocked, zOrder,
interactionType, positions, positionLabels, encoderHasPush,
nestedIn, pairedWith, functionalGroup
```

### ManifestControl (Pipeline — types/manifest.ts)
The pipeline's canonical control type. Superset of ControlDef with pipeline-specific fields.

### PanelManifest (Production — PanelRenderer.tsx)
Minimal type consumed by PanelRenderer. Subset of ControlDef focused on rendering.

### PanelState (Tutorial Runtime — types/panel.ts)
Per-control runtime state during tutorials.
```typescript
Record<controlId, { active: boolean, ledOn?: boolean, ledColor?: string, value?: number }>
```

### DisplayState (Tutorial Runtime — types/display.ts)
Screen content during tutorials (50+ fields for different screen types).

---

## Data Flow Patterns

### Pattern 1: Manifest Loading (Editor)
```
API GET /manifest → JSON → manifestSlice.loadFromManifest() → Zustand store
  → ControlNode renders each control → PanelButton/Knob/Slider/etc.
  → User edits → Zustand mutation → useAutoSave → PUT /manifest (debounced 2.5s)
```

### Pattern 2: Tutorial State Accumulation
```
Tutorial steps[] → buildCumulativeState(steps, currentIndex) → panelState
  → PanelRenderer receives panelState → each control reads active/ledOn
  → highlightedControls → glow animation overlay
```

### Pattern 3: Contractor → Admin Flow (via Blob)
```
Admin: POST send-to-hosted → writes manifest + status to Vercel Blob
Contractor: GET /api/hosted/panels/{id} → loads manifest → edits → auto-save PUT
Contractor: submits → status.json PATCH to 'submitted'
Admin: pulls from Blob → reviews → approves or requests changes
Admin: exports → writes to src/data/manifests/{id}.json (committed to git)
```

### Pattern 4: Pipeline Orchestration
```
Admin uploads manual → API spawns pipeline-runner.ts (detached process)
Runner loop: foreach phase → invokeAgent() → spawns "claude -p" subprocess
  → agent reads manual/photos → writes checkpoint → runner validates
  → if pass: advance phase → if fail: retry or escalate
  → state.json updated atomically after each phase
```

---

## Authentication

Simple cookie-based auth via `src/proxy.ts` (Next.js middleware):
- `/editor/*` requires `contractor_access` cookie = `CONTRACTOR_PASSWORD` env var
- `/admin/*` requires `admin_access` cookie = `ADMIN_PASSWORD` env var
- All other routes are public
- API routes have no auth (internal use only)

---

## State Management

| Store | Scope | Persistence |
|-------|-------|-------------|
| `useEditorStore` (Zustand, 3 slices) | Panel editor | Auto-save to API + undo stack to localStorage |
| `usePipelineStore` (Zustand) | Admin dashboard | Polling from API every 30s |
| `useTutorialStore` (Zustand) | Tutorial runner | In-memory only (resets on close) |
| `usePreviewStore` (Zustand) | Access gate | localStorage (invite code + terms) |

---

## Pipeline Phases (in order)

1. **pending** — Initial state
2. **phase-preflight** — Download manuals, validate inputs, create worktree
3. **phase-0-diagram-parser** — Vision agent extracts geometry from photos
4. **phase-0-gatekeeper** — Judge reconciles text + geometry → Master Manifest
5. **phase-0-layout-engine** — Deterministic script: manifest → template specs
6. **phase-4-extraction** — Manual extractor: Sieve protocol → tutorial curriculum
7. **phase-4-audit** — Coverage auditor: independent verification of curriculum
8. **phase-5-display-build** — Display builder: per-instrument screen components
9. **phase-5-tutorial-build** — Tutorial builder + reviewer: generate tutorial .ts files
10. **tutorial-pr** — Push branch + create GitHub PR with tutorials
11. **completed**

Pipeline pauses at layout engine for contractor editing. Resumes after admin approval.

**Archived phases (2026-05-10):** `phase-1-section-loop`, `phase-2-global-assembly`, and `phase-3-harmonic-polish` are no longer part of the active pipeline. They performed QA work (Structural Inspector, Panel Questioner, Critic) on the auto-generated layout — but with the contractor editor, the contractor IS the quality gate. The state-machine's `PHASE_ORDER` skips them; their agent SOUL files in `.claude/agents/` and the runner functions are preserved for future re-enablement.

---

## Key Architectural Decisions

| Decision | Reasoning |
|----------|-----------|
| Flat control records (not nested trees) | O(1) lookup, easier mutation, no tree traversal |
| Separate Blob storage (status.json + manifest.json) | Eliminates race condition between auto-save and admin actions |
| PanelRenderer replaces codegen | No TSX generation, panels render from committed JSON |
| Controls in absolute canvas coordinates | Section boundaries are decorative, not DOM parents |
| CSS z-index: `zOrder * 10 + (isSelected ? 8 : 0) + 5` | Selected controls stay within z-order tier, never jump above higher layers |
| Icons = editorLabels | Icons use the same label system as text — draggable, snappable, in Layers panel. One system for all annotations |
| sessionStorage cache for saves | Bridges Blob CDN propagation delay (3-7s). Client stores last save, loads from it on refresh |
| Optimistic locking (`_loadedAt` vs `_updatedAt`) | Prevents stale sessions from overwriting newer data. Server returns 409 on conflict |
| sendBeacon POST handler | `navigator.sendBeacon()` only supports POST. Separate POST export delegates to PUT handler |
| Blob `cacheControlMaxAge: 0` | Disables CDN caching on manifest+status blobs. Default 1-year cache caused stale reads |
| Keyboard keys/startNote read-only | Tutorials reference keys by absolute MIDI numbers. Changing startNote breaks zone alignment |
| Gatekeeper indicator splitting | SOUL rule: split collective LED descriptions into individual controls using diagram parser count |
| Cumulative tutorial state | No state deltas to track — just accumulate all changes up to current step |
| Pipeline worktree isolation | Each device gets own git worktree — no cross-contamination |
| Gatekeeper = judge only | Never writes templates/code, only validates and produces manifest JSON |
| Layout Engine = deterministic only | TypeScript switch statement, no LLM, no hallucination possible |

---

## Existing Data Attributes (for CSS targeting / theming)

| Attribute | Component | Purpose |
|-----------|-----------|---------|
| `data-control-id` | All control components | Unique control identifier |
| `data-section-id` | SectionContainer | Section identifier |
| `data-layer` | TouchDisplay | Bezel/scanlines/glow layers |
| `data-key-type` | Keyboard | White/black key targeting |

---

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `BLOB_READ_WRITE_TOKEN` | Both | Vercel Blob storage |
| `CONTRACTOR_PASSWORD` | Both | Editor auth (`instrument2026`) |
| `ADMIN_PASSWORD` | Both | Admin auth (`miyagi2026`) |
| `NEXT_PUBLIC_EDITOR_MODE` | Vercel only | `hosted` for contractor deployment |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| State | Zustand 5 |
| Animation | Framer Motion 12 |
| Drag/Resize | react-rnd 10 |
| Editor Tours | react-joyride 3 |
| Storage | Vercel Blob |
| Testing | Vitest + Playwright |
| Deployment | Vercel |
| AI Agents | Claude CLI (spawned by pipeline runner) |

---

## Plans on Disk

| Plan | Path | Status |
|------|------|--------|
| Label alignment + containers | `docs/plans/2026-04-27-label-align-containers-plan.md` | Ready to implement |
| Themes/skins | `docs/plans/2026-04-27-themes-skins-design.md` | Plan only (later) |
| Pre-tutorial blockers | `docs/plans/2026-04-26-pre-tutorial-blockers.md` | Partially done |
| LED + z-order | `docs/plans/2026-04-26-led-zorder-plan.md` | Done |
| PanelRenderer architecture | `docs/plans/2026-04-05-panelrenderer-replaces-codegen.md` | Reference |
| Contractor flow | `docs/plans/2026-04-07-contractor-flow-rewrite.md` | Reference |
| Editor spec | `docs/plans/panel-editor-spec.md` | Evergreen |
