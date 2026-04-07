# Keyboard Awareness + Manifest Layout Quality — Design

**Date:** 2026-03-23

**Goal:** Pipeline-generated instruments correctly handle keyboards and produce non-overlapping, accurate section layouts.

## Problem

The Fantom-06 manifest has three issues:
1. **No keyboard** — controls spread across 100% of canvas height, overlapping where keys should be
2. **Overlapping sections** — scene ctrl bounding box is inside common's box, synth-mode bleeds into common
3. **Wrong grid dimensions** — 16 pads rendered as a flat row instead of 4x4 grid

Root cause: the gatekeeper SOUL doesn't know about keyboards, doesn't enforce non-overlapping bounding boxes, and doesn't detect grid layouts from photos/manual.

## Design

### 1. Manifest Schema — Keyboard Field

New top-level `keyboard` field in the manifest:

```json
{
  "keyboard": {
    "keys": 61,
    "startNote": "C2",
    "type": "standard",
    "panelHeightPercent": 35
  }
}
```

- `keys`: key count (25, 37, 49, 61, 76, 88)
- `startNote`: lowest note
- `type`: "standard" (piano keys)
- `panelHeightPercent`: percentage of instrument height that is control panel (above keyboard)

For non-keyboard instruments: `"keyboard": null`

All section bounding boxes must have y values within 0 to `panelHeightPercent`.

### 2. Shared Keyboard Component

Extract `src/components/devices/fantom-08/Keyboard.tsx` into `src/components/controls/Keyboard.tsx`.

Props:
- `keys`: number (25, 37, 49, 61, 76, 88)
- `startNote`: string (e.g., "C2")
- `zones`: ZoneConfig[] (zone coloring)
- `highlightedKeys`: number[] (MIDI notes to highlight)

Fantom-08 keeps its own copy untouched.

### 3. Gatekeeper SOUL Updates

New rules added to the gatekeeper agent instructions:

1. **Keyboard detection** — Read the manual specs page. If the instrument has keys, populate the `keyboard` field. Derive `panelHeightPercent` from the hardware photo (parser reports keyboard boundary).
2. **No overlapping bounding boxes** — Sections must not overlap. Each section gets its own exclusive x/y region.
3. **Grid detection for pads** — When the manual or photo shows a pad grid (e.g., 4x4), specify `gridRows` and `gridCols` in the manifest. Do not flatten grids into single-row archetypes.
4. **Spanning sections** — Sections like tone category buttons that span across the bottom get a bounding box reflecting their actual position (full width, thin row).
5. **Panel area constraint** — All control section bounding boxes must fit within y: 0 to `panelHeightPercent`. No controls in the keyboard area.

### 4. Codegen Update

When `manifest.keyboard` exists:
- Import shared `Keyboard` component
- Render `<Keyboard>` at the bottom of `<PanelShell>` with props from manifest
- Panel controls are positioned in the top `panelHeightPercent` area

When `manifest.keyboard` is null:
- No keyboard rendered
- Controls use full canvas height

### 5. Editor Update

`loadFromManifest` uses `panelHeightPercent` to constrain control placement:
- Canvas height stays the same (full instrument)
- Section bounding boxes convert using the panel area only
- Keyboard renders below the panel area (not editable — it's always full-width keys)

### 6. Re-run

Reset Fantom-06 pipeline to gatekeeper phase. Re-run with improved SOUL to produce corrected manifest.

## What Stays Untouched

- Fantom-08 (keeps its own Keyboard.tsx)
- CDJ-3000 (no keyboard, keyboard: null)
- All existing shared control components
- Pipeline phases and state machine
