# NEW-INSTRUMENT — Full 7-Phase Digital Twin Pipeline

Build a complete digital twin of a new instrument — interactive panel, every display screen, and every tutorial the manual supports. This is the primary workflow for this project.

**Trigger:** Given manuals/photos for a new instrument to add to the platform.

**Reference implementation:** The Fantom 08 produced 59 tutorials across 10 categories from its 185-page manual. Aim for equivalent exhaustive coverage.

---

## Prerequisites

Before starting, you MUST have:
- [ ] Read `docs/new-instrument-playbook.md`
- [ ] Read `docs/quality-gates.md`
- [ ] Read `tasks/lessons.md`
- [ ] Read `CLAUDE.md`

If you haven't read these, run `/onboard` first (Path A).

---

## Phase 0: Gather Source Materials

**Goal:** Collect everything before writing any code.

### Checklist
- [ ] **Reference Manual PDF** — The official manual documenting every screen, button, and workflow. PRIMARY source.
- [ ] **Parameter Guide PDF** (if available) — All parameters, value ranges, screen mappings. Secondary source.
- [ ] **Hardware photos** — At least 2-3 high-quality photos from different angles.
- [ ] **Owner's Manual / Quick Start** (optional) — Sometimes has clearer workflow diagrams.
- [ ] **MIDI Implementation docs** (optional) — For MIDI screens and tutorials.

### Storage Location
Put all materials in the iCloud mirror:
```
/Users/devin/Library/Mobile Documents/com~apple~CloudDocs/Documents/Fun & Stuff/Music/Music Studio/
├── [Device Name]/
│   ├── [Device] Reference Manual.pdf
│   ├── [Device] Parameter Guide.pdf
│   ├── [device]_photo_1.jpg
│   └── ...
```

### Gate Check
- Can you list all gathered materials with file paths? If not, gather more.

---

## Phase 1: Full Manual Read & Screen Catalog

**Goal:** Read every page systematically and catalog every screen, sub-screen, popup, and overlay.

### Process
1. **Read the manual cover to cover.** Don't skip. Don't skim. Every page gets read.
2. **For each screen, record:**
   - Screen name (as labeled in manual)
   - Page number (for traceability)
   - Screen type: Main, Sub-screen, Popup, Overlay, or Reference
   - How to access it (button combo, menu path, trigger condition)
   - Key UI elements visible in screenshots
   - Whether it maps to something already implemented
3. **Use subagent parallelism.** Dispatch subagents for different page ranges (e.g., pp.1-50, 51-100, etc.). Each produces a raw entry list. Then merge and deduplicate.
4. **Don't interpret yet.** Just record. Accuracy > completeness.

### CRITICAL RULE
**YOU must read the manual pages yourself for screen layouts.** Agents can search codebase, run tests, check IDs — but agents MUST NOT interpret manual content. They hallucinate visual details.

### Output
A raw catalog of ~N screen entries. (Fantom 08 produced ~200 entries from 173 pages.)

---

## Phase 2: Organize & Tag Confidence

**Goal:** Turn raw entries into a structured, confidence-tagged catalog.

### Step 2a: Organize into Chapter Files
Create `docs/[device-id]-screens/`:
```
docs/[device-id]-screens/
├── README.md                    # Index, status dashboard
├── screen-catalog.md            # Master table
├── catalog-methodology.md       # How catalog was built
├── 01-[chapter-name].md         # Chapter entries
├── 02-[chapter-name].md
└── NN-popups-overlays.md
```

Each chapter file needs: layout description (ASCII sketch), key elements, interactive elements, implementation notes.

### Step 2b: Assign Confidence Tags
| Tag | Criteria |
|-----|----------|
| **HIGH** | Screenshot clearly visible; UI elements readable |
| **MED** | Described in text but no clear screenshot; OR small/partially obscured screenshot |
| **LOW** | Inferred from brief mention; no screenshot; minimal detail |

**Be conservative.** When in doubt, tag MED or LOW.

### Step 2c: Cross-Reference Pass
1. Identify all LOW entries
2. Search full catalog for same screen in other chapters
3. Upgrade confidence if detailed documentation exists elsewhere
4. Document all upgrades

### Step 2d: Compute Overall Confidence
```
score = (HIGH * 1.0 + MED * 0.9 + LOW * 0.5) / total
```
Apply conservative adjustment for unknown unknowns.

---

## Phase 3: Panel Layout Design

**Goal:** Design the physical panel layout BEFORE writing code.

### Process
1. **Study hardware photos.** Identify all sections: buttons, knobs, sliders, pads, displays, labels.
2. **Design in ASCII first.** Present layout in terminal for user review:
   ```
   Row 1: [ZONE 1] [ZONE 2] [ZONE 3] [ZONE 4] | [COMMON] | [SCENE]
   Row 2: [Knob1] [Knob2] [Knob3] [Slider1]   | [Display] | [Pad1][Pad2]
   ```
3. **Define panel dimensions.** Fantom 08 = 2700x580px. Choose dimensions matching physical proportions.
4. **Map control IDs.** Consistent naming convention:
   - Zone buttons: `zone-1`..`zone-N`
   - Sliders: `slider-1`..`slider-N`
   - Knobs: `knob-1`..`knob-N`
   - Pads: `pad-1`..`pad-N`
   - Named buttons: `play`, `stop`, `rec`, `menu`
5. **Create panel layout data file** with all control definitions.
6. **Get user approval** on ASCII layout BEFORE implementing.

---

## Phase 4: Core Implementation

**Goal:** Build foundational files — types, device registration, panel component, display shell.

### Step-by-step
1. **Define types** in `src/types/`: device, display (ScreenType union, DisplayState), panel (control IDs, state), keyboard
2. **Register device** in `src/data/devices.ts`: `{ id, name, brand, status: 'active' }`
3. **Create panel layout** in `src/data/panelLayouts/[device-id].ts`: control IDs, sections, layout mapping
4. **Create panel component** in `src/components/devices/[device-id]/`: Panel wrapper + sections
5. **Build display shell** (`DisplayScreen.tsx`): status bar, header, content router, LCD effects

### Patterns to Follow
- `'use client'` on all interactive components
- `DISPLAY_COLORS` from `@/lib/constants` — NEVER hardcode
- `font-mono` for all LCD text
- `text-[10px]` / `text-[11px]` for display text sizes
- Framer Motion for screen transitions
- Zone colors from `ZONE_COLORS` in constants

---

## Phase 5: Screen Implementation

**Goal:** Build display screens from catalog, prioritized by tutorial needs.

### Priority Tiers
1. **Tier 1 — Core screens** for basic tutorials: home, zone view, tone select, write/save
2. **Tier 2 — Editing screens** for new tutorial categories: mixer, effects, scene edit
3. **Tier 3 — Advanced screens** for specialized tutorials: sequencer, sampler, system settings

### Per-Screen Steps
1. Read catalog entry + manual pages
2. Design in ASCII
3. Extend types (new ScreenType value, DisplayState fields)
4. Create component
5. Register in DisplayScreen (import + renderScreen switch + screenTitle switch)
6. Verify: `npm run build` + `npm run test`

### ScreenType Registration Checklist (ALL 5 required)
- [ ] ScreenType union in `types/display.ts`
- [ ] renderScreen() case in DisplayScreen.tsx
- [ ] screenTitle() case in DisplayScreen.tsx
- [ ] validScreenTypes test array
- [ ] Import in DisplayScreen.tsx

---

## Phase 6: Tutorial Content

**Goal:** Write step-by-step tutorials in batches of 3-5.

**This phase uses the tutorial batch workflow.** Run `/tutorial-batch` for each batch.

### Tutorial Structure
```typescript
export const tutorialName: Tutorial = {
  id: 'tutorial-slug',        // MUST match filename
  deviceId: 'device-id',
  title: 'Tutorial Title',
  description: 'One-line description',
  category: 'basics',         // basics, zones-splits, sound-design, effects, midi, performance, sequencer, sampling
  difficulty: 'beginner',     // beginner, intermediate, advanced
  estimatedTime: '5 min',
  steps: [
    {
      title: 'Step Title',
      instruction: 'What the user should do (physical action)',
      details: 'Why this matters / what it does',
      highlightedControls: ['control-id'],
      panelStateChanges: { 'control-id': { active: true } },
      displayState: { screenType: 'home', /* ... */ },
      zones: [/* zone data */],
      tips: ['Optional tip'],
    },
  ],
};
```

### Critical Tutorial Rules
- Panel state is CUMULATIVE — activate when used, deactivate when leaving
- Every step needs UNIQUE displayState
- `menuItems` must be `{ label: string }` objects
- Tutorial `id` must match filename (minus `.ts`)
- Control IDs must exist in `allControlIds`
- Only LED buttons can have `ledOn: true`
- Tone names must be verified against Sound List PDF
- Highlighted controls must match real workflow context

---

## Phase 7: Validation & Polish

**Goal:** Verify everything works and matches real hardware.

### Checklist
- [ ] `npm run build` — no type errors
- [ ] `npm run test` — all tests pass
- [ ] Visual comparison with hardware photos
- [ ] Each tutorial plays through start to finish
- [ ] Screen transitions smooth (Framer Motion)
- [ ] Panel controls highlight correctly during tutorials
- [ ] Display state updates correctly on each step
- [ ] Zone colors consistent between panel and display

### Final Steps
- Run `/gap-analysis` to verify manual coverage
- Run `/self-improve` to reflect on the process
- Update `memory/MEMORY.md` with final counts

---

## File Structure Template

```
src/
├── components/devices/[device-id]/
│   ├── [Device]Panel.tsx
│   ├── sections/
│   │   ├── [Section1]Section.tsx
│   │   └── ...
│   └── display/
│       ├── DisplayScreen.tsx
│       ├── [Screen1]Screen.tsx
│       └── ...
├── data/
│   ├── panelLayouts/[device-id].ts
│   └── tutorials/[device-id]/
│       ├── index.ts
│       ├── [tutorial-1].ts
│       └── ...
└── __tests__/
    ├── [Device]Panel.test.tsx
    └── tutorials/
        └── [device-id]Tutorials.test.ts

docs/
├── [device-id]-screens/
│   ├── README.md
│   ├── screen-catalog.md
│   └── ...
```
