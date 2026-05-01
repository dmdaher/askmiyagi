# Plan: Display Builder Agent + Tutorial Pipeline Architecture

## Context

The tutorial pipeline generates tutorial steps with `displayState` (what the screen shows) and `highlightControls` (which buttons light up). The prop wiring through PanelRenderer is done. But **no agent generates the display screen components** — the React code that renders what the instrument's screen actually looks like.

Fantom-08's 40+ screen components were built by Claude agents reading the manual in a separate session. The tutorial-builder SOUL explicitly says "do NOT create the screen component." For new instruments, we need a dedicated agent.

## Post-Editor Pipeline Architecture

```
Phase 4-A: Manual Extractor
  → Reads manual in 10-page buckets (sieve protocol)
  → Outputs: feature inventory, tutorial plan, batch specs, screen types per feature
  → Agent: manual-extractor (354 lines — needs trimming)

Phase 4-B: Coverage Auditor  
  → Independent verification of extraction completeness
  → Agent: coverage-auditor (222 lines)

Phase 5-X: Display Builder (NEW — PROPOSED)
  → Reads manual screen diagrams + extractor's screen type list
  → Generates: {DeviceName}Display.tsx with screen type components
  → Registers in device's display dispatcher
  → Agent: display-builder (~120 lines)

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

### Three-Pass Architecture (from Gemini review)

**Pass 1: Style Probe**
- Agent reads the most visually dense screen page in the manual
- Extracts a Device Theme JSON: background hex, font sizes, border radii, brand colors, status bar layout
- Output: `device-theme.json` — single source of truth for all screens

**Pass 2: Atomic Components**
- Builds shared screen elements using the theme: top status bar, menu backgrounds, soft-key labels, scroll indicators, parameter rows
- Output: `atoms/StatusBar.tsx`, `atoms/MenuBackground.tsx`, etc.
- These are reused across ALL screens — prevents visual drift

**Pass 3: Screen Assembly**
- Composes individual screens from theme + atoms + manual-specific layout
- Each screen matches the manual's diagram for that screen type
- Complex visuals (waveforms, beat grids, VU meters) use SVG, not CSS divs
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
Register in device registry alongside PanelComponent:
```typescript
DEVICE_REGISTRY['cdj-3000'] = {
  PanelComponent: makePanelFromManifest(manifest),
  DisplayComponent: CDJ3000DisplayScreen,
}
```
PanelRenderer checks if a `DisplayComponent` is registered for the device and renders it for screen/display controls when `displayState` is provided.

## What's Done vs What's Needed

| Item | Status |
|------|--------|
| PanelRenderer accepts displayState + zones | ✅ Done |
| PanelShell passes zones to Keyboard | ✅ Done |
| makePanelFromManifest auto-forwards new props | ✅ Works |
| display-builder agent SOUL | ❌ Write (~120 lines) |
| Pipeline runner: add Phase 5-X | ❌ Implement |
| tutorial-builder: keep "do NOT create" line | ✅ Stays — display-builder handles it |
| SOUL file trimming (all agents) | ❌ Separate task |

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
5. Fantom-08 tutorials still work (hand-coded path unchanged)

## Remaining Plans

| Plan | File |
|------|------|
| Themes/Skins | `docs/plans/2026-04-27-themes-skins-design.md` |
