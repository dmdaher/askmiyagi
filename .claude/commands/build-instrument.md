# BUILD-INSTRUMENT — Complete Digital Twin Pipeline

The big one. Build a complete digital twin of a new instrument from manuals to fully playable tutorials. Orchestrates all 7 phases of the new instrument playbook with every quality gate, skill, and lesson learned embedded.

**Trigger:** Given manuals and photos for a new instrument to add to the platform.

**Combines:** `/onboard` → `/new-instrument` (all 7 phases, including `/build-batch` for Phase 6) → `/gap-analysis` → `/self-improve`

**Reference implementation:** Fantom 08 = 185-page manual → 298 screen catalog entries → 11 screen types → 59 tutorials across 10 categories.

---

## Phase 0: Onboarding & Materials

### 0a: Read All Required Docs (MANDATORY)
1. `docs/new-instrument-playbook.md` — 7-phase pipeline
2. `docs/quality-gates.md` — 5 gates, 40 evidence-based questions
3. `tasks/lessons.md` — 19 correction patterns
4. `CLAUDE.md` — Architecture, conventions, control ID naming

### 0b: Gather Source Materials
- [ ] **Reference Manual PDF** — primary source for all screens, buttons, workflows
- [ ] **Parameter Guide PDF** — parameter names, ranges, value tables
- [ ] **Hardware photos** — 2-3 high-quality from different angles
- [ ] **Owner's Manual / Quick Start** (optional)
- [ ] **MIDI Implementation** (optional)

Store in iCloud mirror:
```
/Users/devin/Library/Mobile Documents/com~apple~CloudDocs/Documents/Fun & Stuff/Music/Music Studio/
├── [Device Name]/
│   ├── [Device] Reference Manual.pdf
│   ├── [Device] Parameter Guide.pdf
│   ├── [device]_photo_1.jpg
│   └── ...
```

**Gate:** Can you list all materials with file paths? If not, gather more before proceeding.

---

## Phase 1: Full Manual Read & Screen Catalog

### 1a: Read Every Page
- Read the manual cover to cover. Don't skip. Don't skim.
- Use subagent parallelism for different page ranges (agents READ raw text, but YOU interpret screen layouts)
- **CRITICAL:** Agents MUST NOT interpret manual content for screen layouts — they hallucinate visual details. Agents can extract text, but you verify screen layouts yourself.

### 1b: Record Each Screen
For every screen found:
- Screen name (as labeled)
- Page number (traceability)
- Type: Main, Sub-screen, Popup, Overlay, Reference
- Access path (button combo, menu path)
- Key UI elements from screenshots
- Mapping to existing implementations

### 1c: Output
Raw catalog of ~N entries. (Fantom 08: ~200 entries from 173 pages)

---

## Phase 2: Organize & Tag Confidence

### 2a: Create Chapter Files
```
docs/[device-id]-screens/
├── README.md
├── screen-catalog.md
├── catalog-methodology.md
├── 01-[chapter].md
├── 02-[chapter].md
└── NN-popups-overlays.md
```

Each entry: layout description (ASCII), key elements, interactive elements, implementation notes.

### 2b: Assign Confidence Tags
| HIGH | Screenshot visible, UI elements readable |
| MED | Described in text, no clear screenshot |
| LOW | Inferred from brief mention, no visual |

**Be conservative** — tag MED/LOW when in doubt.

### 2c: Cross-Reference Pass
- Find LOW entries → search for same screen in other chapters → upgrade if documented elsewhere
- Document all upgrades in methodology file

### 2d: Compute Confidence Score
```
score = (HIGH * 1.0 + MED * 0.9 + LOW * 0.5) / total
```

---

## Phase 3: Panel Layout Design

### 3a: Study Hardware Photos
Identify all physical sections: buttons, knobs, sliders, pads, displays, labels.

### 3b: Design in ASCII First
```
Row 1: [ZONE 1] [ZONE 2] [ZONE 3] [ZONE 4] | [COMMON] | [SCENE]
Row 2: [Knob1] [Knob2] [Knob3] [Slider1]   | [Display] | [Pad1][Pad2]
```

### 3c: Define Panel Dimensions
Choose dimensions matching physical proportions. (Fantom 08: 2700x580px)

### 3d: Map Control IDs
Consistent naming: `zone-N`, `slider-N`, `knob-N`, `pad-N`, `play`, `stop`, `rec`, `menu`...

### 3e: Get User Approval BEFORE Implementing

---

## Phase 4: Core Implementation

### 4a: Define Types
In `src/types/`:
- Device type in `device.ts`
- Display types in `display.ts` (ScreenType union, DisplayState)
- Panel types in `panel.ts` (control IDs, panel state)
- Keyboard types (if applicable)

### 4b: Register Device
In `src/data/devices.ts`: `{ id, name, brand, status: 'active' }`

### 4c: Create Panel Layout
In `src/data/panelLayouts/[device-id].ts`: control IDs, sections, layout mapping

### 4d: Build Panel Component
In `src/components/devices/[device-id]/`: Panel wrapper + section components

### 4e: Build Display Shell
`DisplayScreen.tsx`: status bar, header, content router, LCD visual effects

### Conventions
- `'use client'` on all interactive components
- `DISPLAY_COLORS` from constants — NEVER hardcode hex
- `font-mono` for LCD text
- `text-[10px]`/`text-[11px]` for display text
- Framer Motion for transitions
- Zone colors from `ZONE_COLORS`

---

## Phase 5: Screen Implementation

### Priority Tiers
1. **Tier 1:** Core screens for basic tutorials (home, zone view, tone select, write/save)
2. **Tier 2:** Editing screens for new categories (mixer, effects, scene edit)
3. **Tier 3:** Advanced screens (sequencer, sampler, system)

### Per-Screen Process
1. Read catalog + manual pages (PRE-BUILD)
2. Design in ASCII
3. Extend types (new ScreenType, DisplayState fields)
4. Create component
5. Register in DisplayScreen (ALL 5 places):
   - [ ] ScreenType union in `types/display.ts`
   - [ ] renderScreen() switch case
   - [ ] screenTitle() switch case
   - [ ] validScreenTypes test array
   - [ ] Import in DisplayScreen.tsx
6. Verify: `npm run build` + `npm run test`

---

## Phase 6: Tutorial Content (Use `/build-batch`)

### Batch Strategy
- Group 3-5 tutorials by manual chapter
- Follow `/build-batch` workflow for each batch
- Each batch: plan → worktree → TDD per tutorial → review → merge

### Per-Tutorial TDD Cycle
1. Update test (step count, total, description)
2. Verify FAIL
3. Create file (follow `split-keyboard-zones.ts` pattern)
4. Register (import + array + named export)
5. Verify PASS + build
6. Commit

### Tutorial Rules (Non-Negotiable)
- Panel state cumulative
- Unique displayState per step
- `menuItems: [{ label: 'X' }]`
- `id` matches filename
- Valid control IDs only
- LED claims only on LED buttons
- Tone names verified against Sound List
- Highlights match real screen context
- Realistic instructions ("Press [MENU]", not "navigate")

### Skills Chain
```
brainstorming → writing-plans → using-git-worktrees → executing-plans →
test-driven-development → systematic-debugging → requesting-code-review →
receiving-code-review → verification-before-completion → finishing-a-development-branch
```

---

## Phase 7: Validation & Polish

### Checklist
- [ ] `npm run build` — no type errors
- [ ] `npm run test` — all pass, no regressions
- [ ] Visual comparison with hardware photos
- [ ] Each tutorial plays through start to finish
- [ ] Screen transitions smooth
- [ ] Panel controls highlight correctly
- [ ] Display state updates correctly per step
- [ ] Zone colors consistent between panel and display

### Gap Analysis (Run `/gap-analysis`)
- Cross-reference all manual sections against tutorials
- Document any remaining gaps
- Update `docs/plans/[date]-gap-analysis.md`
- Update `memory/MEMORY.md`

### Self-Improvement (Run `/self-improve`)
- Reflect on what went well/poorly
- Update documentation
- Update quality gates if needed
- Update memory files

---

## File Structure Checklist

```
src/
├── components/devices/[device-id]/
│   ├── [Device]Panel.tsx           ← created
│   ├── sections/                   ← created
│   └── display/
│       ├── DisplayScreen.tsx       ← created
│       └── [Screen]Screen.tsx      ← per screen
├── data/
│   ├── devices.ts                  ← updated
│   ├── panelLayouts/[device-id].ts ← created
│   └── tutorials/[device-id]/
│       ├── index.ts                ← created
│       └── [tutorial].ts           ← per tutorial
├── types/                          ← updated
└── __tests__/
    └── tutorials/
        └── [device]Tutorials.test.ts ← created

docs/
├── [device-id]-screens/            ← created (catalog)
└── plans/                          ← batch plans
```

---

## Success Criteria

When done, you should have:
- Complete panel matching hardware photos
- Every manual screen implemented
- Tutorials covering every manual chapter
- 100% practical manual coverage (per gap analysis)
- All tests passing
- All quality gates green
- Memory files updated with final counts
