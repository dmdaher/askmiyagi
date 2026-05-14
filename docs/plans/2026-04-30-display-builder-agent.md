# Plan: Display Builder Agent + Tutorial Pipeline Architecture

## Context

The tutorial pipeline generates tutorial steps with `displayState` (what the screen shows) and `highlightControls` (which buttons light up). The prop wiring through PanelRenderer is done. But **no agent generates the display screen components** — the React code that renders what the instrument's screen actually looks like.

For each new instrument, display screen components must be derived **directly from that instrument's own manual**, not copied or adapted from any other instrument's code. The Display Builder agent reads:
1. The manual-extractor's `pass-1-inventory.md` for the authoritative screen list + page references
2. Only the manual pages cited by that inventory (not the whole manual — avoids "lost in the middle" hallucination)
3. The shared structural pattern from `src/components/controls/DisplayContent.tsx` (the generic fallback renderer)

The agent then produces device-specific TSX components, a theme JSON, and a `screen-inventory.json` registry. The tutorial-builder downstream consumes the inventory to validate that every `displayState.screenType` it references maps to a real component.

The SOUL at `.claude/agents/display-builder.md` (165 lines) is the source of truth for agent behavior; this plan is the architectural reference for humans.

## Post-Editor Pipeline Architecture

```
Phase 4-A: Manual Extractor
  → Reads manual in 10-page buckets (sieve protocol)
  → Outputs: feature inventory, tutorial plan, batch specs, screen types per feature
  → Agent: manual-extractor (354 lines — needs trimming)

Phase 4-B: Coverage Auditor  
  → Independent verification of extraction completeness
  → Agent: coverage-auditor (222 lines)

Phase 5-X: Display Builder
  → Reads manual-extractor's pass-1-inventory.md + only the manual pages cited there
  → Generates: device-theme.json, atoms/*.tsx, screens/*.tsx, DisplayScreen.tsx, screen-inventory.json
  → Registers in device's display dispatcher (convention-based import)
  → Agent: display-builder (165 lines — SOUL at .claude/agents/display-builder.md)

Phase 5-A: Tutorial Builder (per batch)
  → Generates tutorial .ts files with displayState + panelState per step
  → References screen types that Display Builder already created
  → Agent: tutorial-builder (262 lines — needs trimming)

Phase 5-B: Tutorial Reviewer (per batch)
  → Verifies each step against manual, validates displayState accuracy
  → Agent: tutorial-reviewer (257 lines)

Tutorial PR: Creates git commit + PR
```

## How Controls + Screens Connect in a Tutorial Step

```typescript
// A single tutorial step ties everything together:
{
  highlightControls: ['LOOP_IN_CUE'],           // blue glow on button
  panelStateChanges: { LOOP_IN_CUE: { active: true, ledOn: true } },  // LED lights up
  displayState: { screenType: 'waveform', loopInPoint: 32.5 },        // screen updates
}
```

The tutorial step IS the wiring. Same step activates the control AND sets what the screen shows. TutorialRunner passes all three to the DevicePanel as props.

## Prop Chain (DONE — wiring complete)

```
TutorialRunner → displayState, zones, panelState, highlightedControls
  → makePanelFromManifest (spreads ...props)
    → PanelRenderer (accepts displayState + zones) ✅ WIRED
      → PanelShell (accepts zones → passes to Keyboard) ✅ WIRED
      → Display control renders displayState ❌ NEEDS DISPLAY COMPONENT
```

## Recommendation: New `display-builder` Agent (Multi-Pass)

### Why a Separate Agent
- **Single responsibility** — tutorial-builder writes content, display-builder writes visual components ("UI Transcoder")
- **Different skill** — Vision-to-code (Tailwind, SVG, CSS) vs tutorial authoring
- **Execution order** — display components must exist BEFORE tutorials reference them
- **SOUL size** — tutorial-builder already 262 lines; display-builder stays under 150

### Three-Pass Architecture

**Pass 1: Style Probe**
- Agent reads the most visually dense screen page in the manual
- Extracts a Device Theme JSON: background hex, font sizes, border radii, brand colors, status bar layout, display dimensions
- Output: `device-theme.json` — single source of truth for all screens

**Pass 2: Atomic Components**
- Builds the required shared atoms (StatusBar, MenuRow, ParameterRow, Indicator, ScrollHint) using the theme
- Optional atoms (ProgressBar, Waveform, KeyboardOverlay, BeatGrid, AlbumArt) only if the manual shows them
- Output: `atoms/StatusBar.tsx`, `atoms/MenuRow.tsx`, etc.
- These are reused across ALL screens — prevents visual drift

**Pass 3: Screen Assembly**
- For each screen listed in `pass-1-inventory.md`, opens only the cited pages
- Studies the layout: elements, positions, data shown, **which controls open this screen**
- Composes individual screens from theme + atoms + manual-specific layout
- Complex visuals (waveforms, beat grids, VU meters) use SVG, not CSS divs
- If a screen's diagram is unclear, writes a stub with `// TODO` and marks `confidence: 'low'` — does NOT fabricate
- Output: `WaveformScreen.tsx`, `TrackInfoScreen.tsx`, `MenuScreen.tsx`, etc.

### Per-Instrument Execution (Not Per-Batch)
- Run once per instrument, generates the full screen library
- Outputs `screen-inventory.json` listing all available screen types
- Tutorial-builder references inventory keys — no guessing what exists
- Consistent visuals across all tutorials for that instrument

### Phase Order
```
Phase 5-X: Display Builder (runs ONCE per instrument)
  → Pass 1: Style Probe → device-theme.json
  → Pass 2: Atomic Components → shared atoms/
  → Pass 3: Screen Assembly → individual screen components
  → Output: screen-inventory.json + DisplayScreen.tsx dispatcher

Phase 5-A: Tutorial Builder (runs PER BATCH)
  → References screen-inventory.json for valid screenType values
  → Writes displayState in tutorial steps

Phase 5-B: Tutorial Reviewer (runs PER BATCH)
  → Validates displayState against screen-inventory.json
  → Validates content accuracy against manual
```

### Quality Gate
No static gallery needed — quality is validated by:
1. Tutorial reviewer checks displayState accuracy against manual
2. Your testing of finished tutorials (play through and see if screens look right)
3. If a screen looks wrong, fix it and re-run the display-builder

### Output Directory
```
src/components/devices/{deviceId}/display/
├── device-theme.json          # colors, fonts, brand styling
├── atoms/                     # shared elements
│   ├── StatusBar.tsx
│   ├── MenuBackground.tsx
│   └── SoftKeyLabel.tsx
├── screens/                   # individual screen types
│   ├── WaveformScreen.tsx
│   ├── TrackInfoScreen.tsx
│   ├── MenuScreen.tsx
│   └── HotCueScreen.tsx
├── DisplayScreen.tsx           # dispatcher (screenType → component)
└── screen-inventory.json       # registry of all screen types
```

### How PanelRenderer Uses It

**Convention-based integration.** Each device's panel component imports its own DisplayScreen:

```typescript
// src/components/devices/<deviceId>/Panel.tsx
import DisplayScreen from './display/DisplayScreen';
// ...
<DisplayScreen displayState={displayState} />
```

The agent's responsibility ends at producing `display/DisplayScreen.tsx`. Wiring it into the device's panel component is a manual step (or future automation). No global registry needed for v1.

PanelRenderer's generic fallback (`src/components/controls/DisplayContent.tsx`) handles devices that don't yet have a custom DisplayScreen — they get a generic text/menu rendering until the agent generates real screens.

## What's Done vs What's Needed

| Item | Status |
|------|--------|
| PanelRenderer accepts displayState + zones | ✅ Done |
| PanelShell passes zones to Keyboard | ✅ Done |
| makePanelFromManifest auto-forwards new props | ✅ Works |
| display-builder agent SOUL | ✅ Exists (165 lines, with anti-anchoring rules added 2026-05-14) |
| Pipeline runner: add Phase 5-X | ❌ Implement (~20 LOC in scripts/pipeline-runner.ts) |
| `phase-5-display-build` enum in phase-order.ts | ❌ Add |
| Validators in checkpoint-validators.ts | ❌ Add (~80 LOC: theme, inventory, components, anti-anchoring grep) |
| tutorial-builder: keep "do NOT create" line | ✅ Stays — display-builder handles it |
| SOUL file trimming (all agents) | ❌ Separate task (not blocking) |

## Required validators (for checkpoint-validators.ts)

```typescript
validateDeviceTheme(themeJson)        // required fields, valid hex colors, displayDimensions present
validateScreenInventory(inventoryJson) // screen IDs unique, components exist as files, manualPages non-empty, all listed screens have matching TSX files
validateDisplayComponents(files)       // each entry in inventory has a matching TSX export, screen file size > 1 KB, no other-device strings (anti-anchoring grep — must not match /fantom-\d+/i or /cdj-\d+/i for unrelated devices)
validateInventoryCompleteness(inventoryJson, pass1InventoryPath) // every screen from pass-1-inventory.md has a corresponding entry (or marked confidence:'low' stub)
```

## Fix 1 (DONE): displayState + zones wired through PanelRenderer

**File:** `src/components/controls/PanelRenderer.tsx`

```typescript
export interface PanelRendererProps {
  manifest: PanelManifest;
  panelState?: PanelState;
  displayState?: DisplayState;       // ADD
  highlightedControls?: string[];
  zones?: ZoneConfig[];              // ADD
  onButtonClick?: (id: string) => void;
}
```

**Impact:** `makePanelFromManifest()` spreads `...props` to PanelRenderer, so TutorialRunner's displayState and zones will automatically flow through once PanelRenderer accepts them.

## Verification

1. Display-builder generates screen components that match the manual
2. Tutorial-builder references screen types that display-builder created
3. TutorialRunner renders displayState through PanelRenderer to device display
4. Keyboard zones render correctly for manifest-based instruments
5. Pre-existing handcrafted devices keep working (their device-folder is untouched)
6. **Anti-anchoring grep:** `grep -ri "fantom\\|cdj-3000\\|alphatheta" src/components/devices/<new-device>/display/` returns ZERO matches (excepting the new device's own ID)
7. **Inventory completeness:** every screen named in `pass-1-inventory.md` has a matching entry in `screen-inventory.json` (or a `confidence: 'low'` stub)
8. **Visual review:** user opens preview, screens render coherently against manual screenshots

## Gap audit (post-rewrite, 2026-05-14)

Categorized by whether the gap is closed in v1 or deferred.

### Closed in v1

| # | Gap | How resolved |
|---|---|---|
| G1 | Screen ↔ control binding | `controlsThatOpen` field in screen-inventory.json |
| G2 | PanelRenderer ↔ DisplayScreen integration | Convention-based per-device import |
| G3 | Default / idle screen | Every device must include `home` (or equivalent); dispatcher's `default:` branch |
| G4 | Mode detection / screen selection logic | Tutorials own screenType; agent produces pure-render components only |
| G5 | ScreenType namespace strategy | Reuse generic names where semantic matches; invent only for unique screens |
| G6 | Iteration / retry | Per-screen TSX files; manual delete + re-run for v1 |
| G7 | Failure modes | Stub component + `confidence: 'low'` in inventory; no fabrication |

### Deferred (acknowledged, not v1 blocking)

| # | Gap | Why deferred |
|---|---|---|
| G8 | Animations / transitions | Static screens fine for v1 |
| G9 | SVG complexity guardrails | Soft guideline in SOUL (< 200 lines/screen) |
| G10 | Mock content vs displayState | TouchDisplay keeps dual-mode (no change needed) |
| G11 | Photo overlay interaction | Photo overlay is a separate editor layer; no interaction |
| G12 | Manifest schema for display dimensions | Device-constants hardcoding works for v1; manifest field is v2 |
| G13 | Coverage-auditor extension (validate every manual screen has a screenType) | Added to roadmap; not in this plan |
| G14 | Validator for inventory completeness | Done — see `validateInventoryCompleteness` above |

## Remaining Plans

| Plan | File |
|------|------|
| Themes/Skins | `docs/plans/2026-04-27-themes-skins-design.md` |

---

## 2026-05 Audit Review (added 2026-05-13, rewritten 2026-05-14)

- **Status:** ACTIVE — **plan + SOUL rewritten 2026-05-14**; ready to build
- **Category:** B.II — New agent
- **Problem-confidence:** 92% — PanelRenderer wired but no agent produces display components for new instruments
- **Solution-confidence:** **86%** (was 68%) — Fantom-08 anchoring removed; pass-1-inventory inheritance specified; per-device convention for dispatcher integration; gap audit closed 7 of 14 gaps
- **Regression-safety:** **82%** (was 55%) — anti-anchoring grep validator; SOUL forbids reading other devices' display directories; failure modes specified (stub + `confidence: 'low'`, no fabrication)
- **Overall:** **82%** (was 55%) — well above the 80% ready-to-execute threshold
- **Priority within sub-tier:** #1 (only B.II plan; blocks tutorials for new instruments)
- **Effort:** **5-7 days** (was 10-14, revised down — SOUL already exists)
- **Dependencies:** Pipeline-build-phase-fixes PR-5 (reference hierarchy) is helpful but not strictly required now that anti-anchoring is baked into the SOUL + validators
- **Top 3 risks (remaining):**
  - Agent generates plausible-looking stub files that pass the > 1 KB threshold but lack real content. **Mitigation: `validateDisplayComponents` requires named TSX exports AND non-trivial content (heuristic: > 30 LOC of JSX, not just imports + return null)**
  - Inventory completeness drift — agent skips a screen from pass-1-inventory.md. **Mitigation: `validateInventoryCompleteness` cross-checks the two files**
  - Other-device contamination via shared types in `src/types/display.ts`. **Mitigation: SOUL says "extend if needed" not "match Fantom"; CI grep on the new device's directory must return zero matches for other device names**
- **A/B test strategy:**
  - Pre: no automated comparison (first run on a new instrument IS the A/B)
  - Post: run on `cdj-3000` (real device with non-trivial display); validate > 5 screen types, each with named export and non-trivial JSX; tutorial-builder dry-run; visual user review; anti-anchoring grep must return ZERO non-self matches
- **Premortem digest:** Agent reads its way around the SOUL restriction by querying `src/types/display.ts` and pattern-matching on the existing `ScreenType` union (which is Fantom-flavored). Mitigation: validator includes a check that no other device name appears in the new device's display directory; reviewer eyeballs the generated screen list against the manual.
- **What changed in the rewrite:**
  - Removed all Fantom-08 anchoring quotes
  - Added `pass-1-inventory.md` as the authoritative screen-list input
  - Added required vs optional atom catalog
  - Specified full `screen-inventory.json` schema with `controlsThatOpen`, `props`, `confidence`
  - Specified convention-based PanelRenderer integration (no global registry)
  - Specified failure mode (stub + low-confidence flag, never fabricate)
  - Closed 7 of 14 gaps from the prior audit; documented 7 deferrals with rationale
  - Added 4 validators (theme, inventory, components, inventory-completeness)
