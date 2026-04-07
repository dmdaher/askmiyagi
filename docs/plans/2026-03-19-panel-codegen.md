# Plan: Deterministic Panel Codegen

## Context

Phase 1 (Panel Builder) currently uses an LLM agent to read the manifest and write React components. This is slow ($10-30, 5-10 min/section), error-prone, and the agent gets confused when no existing code exists.

The manifest + Layout Engine templates already contain all the data needed. The control component library (`src/components/controls/`) is fully generic. A deterministic script can generate production components mechanically — no AI, no interpretation.

## What to build

One script: `scripts/panel-codegen.ts`

**Input:** `.pipeline/{deviceId}/manifest.json` + `.pipeline/{deviceId}/templates.json`

**Output:**
1. `src/components/devices/{deviceId}/{PascalName}Panel.tsx` — root panel
2. `src/components/devices/{deviceId}/sections/{Section}Section.tsx` — per section (13 files for CDJ-3000)
3. `src/lib/devices/{deviceId}-constants.ts` — panel dimensions, control IDs
4. Device registry update (append to `src/lib/deviceRegistry.ts`)

## Control type → component mapping

| Manifest type | Component | Import |
|---|---|---|
| button | PanelButton | @/components/controls/PanelButton |
| knob | Knob | @/components/controls/Knob |
| fader, slider | Slider | @/components/controls/Slider |
| led, indicator | LEDIndicator | @/components/controls/LEDIndicator |
| wheel | Wheel | @/components/controls/Wheel |
| pad | PadButton | @/components/controls/PadButton |
| encoder | ValueDial | @/components/controls/ValueDial |
| switch, lever | Lever | @/components/controls/Lever |
| screen, display | div (placeholder) | — |

Unknown type → hard error.

## Section generation (per archetype)

Each section file follows the Fantom pattern:
- Props: `panelState`, `highlightedControls`, `onButtonClick`
- Helper: `getState(id)`, `isHighlighted(id)`
- Layout from template archetype → JSX div structure

| Archetype | JSX structure |
|---|---|
| single-row | `flex flex-row` with controls in order |
| single-column | `flex flex-col` with controls stacked |
| grid-NxM | CSS grid with `grid-template-columns: repeat(N, 1fr)` |
| cluster-above-anchor | flex-col: grid cluster (top, heightSplits.cluster%) + anchor div (bottom, heightSplits.anchor%) |
| cluster-below-anchor | flex-col: anchor (top) + grid cluster (bottom) |
| anchor-layout | flex-col: secondary controls + anchor element |
| dual-column | grid 2 columns |
| stacked-rows | flex-col of flex-row divs |

### Nested SubZones
When containerAssignment has nested sub-zones (e.g., `anchor: { slider: [...], reset: {...} }`):
- Parent container: `flex flex-row`
- Each sub-zone: flex div with direction from `SubZone.direction`
- Import helpers `subZoneControls()` and `subZoneDirection()` from layout-engine.ts

## Root panel component

- Absolute positioning using `panelBoundingBox` (x, y, w, h as %)
- Panel canvas with computed width/height from bounding box extents
- Dark background (#1a1a1a)
- Each section wrapped in positioned div
- Passes `panelState`, `highlightedControls`, `onButtonClick` to all sections

## Files to modify/create

| File | Action |
|---|---|
| `scripts/panel-codegen.ts` | CREATE — the codegen script |
| `src/components/devices/cdj-3000/CDJ3000Panel.tsx` | GENERATED |
| `src/components/devices/cdj-3000/sections/*.tsx` | GENERATED (13 files) |
| `src/lib/devices/cdj-3000-constants.ts` | GENERATED |
| `src/lib/deviceRegistry.ts` | UPDATED (append CDJ-3000) |

## Key files to reference

| File | Why |
|---|---|
| `scripts/layout-engine.ts` | Types (MasterManifest, SubZone, TemplateSpec), CLI pattern, subZoneControls/subZoneDirection helpers |
| `.pipeline/cdj-3000/manifest.json` | 13 sections, 61 controls |
| `.pipeline/cdj-3000/templates.json` | Archetype CSS architecture per section |
| `src/components/devices/fantom-08/FantomPanel.tsx` | Root panel pattern (props, state handling, section rendering) |
| `src/components/controls/*.tsx` | Component library (all generic, no device-specific code) |
| `src/types/panel.ts` | PanelState, PanelControl, ControlType types |
| `src/lib/deviceRegistry.ts` | Registry format for new devices |

## Control component props (quick reference)

| Component | Required props | Key optional props |
|---|---|---|
| PanelButton | `id`, `label` | `variant`, `size`, `active`, `hasLed`, `ledOn`, `ledColor`, `highlighted`, `labelPosition`, `onClick` |
| Knob | `id`, `label` | `value`, `highlighted`, `size` |
| Slider | `id`, `label` | `value`, `highlighted`, `trackHeight`, `trackWidth`, `labelPosition` |
| LEDIndicator | `id` | `on`, `color`, `highlighted`, `size` |
| Wheel | `id`, `label` | `value`, `highlighted`, `width`, `height` |
| PadButton | `id`, `label` | `active`, `color`, `highlighted`, `onClick`, `width`, `height` |
| ValueDial | `id` | `label`, `highlighted`, `size` |
| Lever | `id`, `label` | `highlighted`, `scale` |

## CLI

```
npx tsx scripts/panel-codegen.ts <device-id> [--dry-run] [--panel-width N] [--panel-height N]
```

## Deferred (not blockers)

- **Theme system** — add `data-theme="pioneer-dj"` when we have a second manufacturer. One device doesn't need theme infrastructure.
- **Parameter ranges** — manifest doesn't have min/max for knobs/faders yet. Codegen uses defaults (0-127). Manual can extend later.
- **Framer-motion animations** — generate plain divs first. Add motion.div wrapper as polish pass.

## Verification

1. Run: `npx tsx scripts/panel-codegen.ts cdj-3000`
2. Check generated files exist (13 sections + panel + constants)
3. `npx tsc --noEmit` — zero errors
4. `npm run build` — builds successfully
5. Start dev server, navigate to CDJ-3000 panel — renders all sections
6. All 61 controls visible with correct types (buttons look like buttons, knobs like knobs)

## Branch

Work on: `feature/pipeline-architecture-upgrade` (targets `test`)
