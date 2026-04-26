# Plan: LED Fix + Z-Order Feature (Move to Front/Back)

## Context

Two issues:
1. **LED dots clipped in editor** — `renderButtonLed` returns absolute-positioned dots (`-top-2`), but they're inside ControlNode's `overflow-hidden` inner div, so they get clipped. LEDs show fine in preview (PanelRenderer) because its container has no overflow clipping.
2. **Jog wheel display goes behind jog wheel** when deselected — all controls share the same static z-index (5/10/50 based on selection state), with no persistent z-order. Need Figma-style "Move to Front/Back/Forward/Backward" feature.

## Part 1: Fix LED Dots Clipped in Editor

**Problem:** `renderButtonLed()` in ControlNode.tsx returns an absolute-positioned dot (`-top-2`), but it renders inside a `<div className="overflow-hidden">` (line 856). The dot gets clipped. PanelRenderer doesn't have this issue because its control containers have no overflow clipping.

**Fix:** Remove `overflow-hidden` from the inner rendering div in ControlNode (line 856). Change to just `overflow-visible` or remove the overflow class entirely. The `overflow-hidden` was originally there to contain control visuals, but it clips LEDs and any other content that extends beyond the bounding box (like lock badges, which work because they're siblings of this div, not children).

**File:** `src/components/panel-editor/ControlNode.tsx` — line 856, change `overflow-hidden` to `overflow-visible`

**Risk:** Controls with text overflow (long on-button labels) may bleed outside their container. But this is acceptable — the container still has explicit width/height via Rnd, and the button component itself (`PanelButton`) already has its own `overflow: hidden`.

## Part 2: LED Button Style System

### Problem

The CDJ-3000 (and many DJ/synth hardware) has three distinct LED behaviors on buttons, but we only model one (`hasLed: true` → separate dot above). The real hardware has:

1. **Integrated LED button** — the button face itself illuminates in color (PLAY, CUE, HOT CUE pads, SLIP, QUANTIZE, BEAT SYNC, etc.). No separate dot — the button IS the indicator.
2. **Separate LED dot** — a small LED indicator positioned above/below/inside the button, separate from the button face. Common on synth panels (Fantom knobs, etc.).
3. **No LED** — plain button, no illumination (navigation buttons, menu buttons).

Currently `hasLed: true` always renders a separate dot via `renderButtonLed()`. There's no way to say "the button itself glows."

### Data Model

Add `ledStyle` to `ControlDef` in `manifestSlice.ts`:

```typescript
ledStyle?: 'integrated' | 'dot' | 'none';  // How the LED renders
// 'integrated' — button face lights up in ledColor (no separate dot)
// 'dot' — small LED dot above/inside button (current behavior)
// 'none' — no LED (default when hasLed is false)
```

Keep `hasLed`, `ledColor`, `ledPosition` as-is. `ledStyle` controls HOW the LED renders:
- `hasLed: true, ledStyle: 'integrated'` → button face glows with `ledColor`
- `hasLed: true, ledStyle: 'dot'` → separate dot (current behavior)
- `hasLed: true, ledStyle: undefined` → defaults to `'dot'` (backwards compat)
- `hasLed: false` → no LED regardless of ledStyle

### PanelButton Changes

Add `ledStyle` prop. When `ledStyle === 'integrated'`:
- Apply `ledColor` as the button's background/border tint (subtle glow)
- In "off" state: dim version of the color (e.g., `ledColor` at 15% opacity as background)
- In "on" state: full color glow with box-shadow
- No separate LED dot rendered above

```typescript
// Integrated LED button styling:
const isIntegrated = ledStyle === 'integrated';
const integratedStyle = isIntegrated ? {
  backgroundColor: ledOn ? ledColor : `${ledColor}15`,
  border: `1px solid ${ledOn ? ledColor : `${ledColor}40`}`,
  boxShadow: ledOn ? `0 0 8px ${ledColor}60, inset 0 0 4px ${ledColor}30` : 'none',
} : {};
```

**File:** `src/components/controls/PanelButton.tsx`

### ControlNode Changes

In `renderControl` case 'button', pass `ledStyle` to PanelButton. In `renderButtonLed`, skip rendering the dot when `ledStyle === 'integrated'`.

**File:** `src/components/panel-editor/ControlNode.tsx`

### PanelRenderer Changes

Same as ControlNode — pass `ledStyle`, render integrated style or dot accordingly.

**File:** `src/components/controls/PanelRenderer.tsx`

### Properties Panel — LED Style Selector

When a button or pad is selected and `hasLed: true`, show a style selector:

```
LED Style:
  [Integrated]  [Dot]
```

Two pill buttons. Only visible when `hasLed` is true.

**File:** `src/components/panel-editor/PropertiesPanel/index.tsx`

### Files

| File | Change |
|------|--------|
| `manifestSlice.ts` | Add `ledStyle` to ControlDef |
| `PanelButton.tsx` | Add `ledStyle` prop, integrated glow rendering |
| `ControlNode.tsx` | Pass `ledStyle`, skip dot for integrated |
| `PanelRenderer.tsx` | Same as ControlNode |
| `PropertiesPanel/index.tsx` | LED style selector pills |

### CDJ-3000 Data Fix (verified from manual + photos)

**Set `ledStyle: 'integrated'`** (button face lights up — confirmed by manual "lights up" language and photos):
- HOT_CUE_A through HOT_CUE_H (manual p.58: "buttons light up" with color table)
- SLIP (manual p.65: "button lights up", "button blinks")
- PLAY_PAUSE, CUE_BTN (visible green/amber in photos, large illuminated buttons)
- QUANTIZE, BEAT_SYNC_INST_DOUBLES, KEY_SYNC, MASTER, MASTER_TEMPO (visible in photos as illuminated)

**Set `ledStyle: 'integrated'`** (loop buttons — same physical construction as other lit buttons, likely illuminate when loop is active):
- LOOP_IN_CUE, LOOP_OUT, RELOOP_EXIT, FOUR_BEAT_LOOP, EIGHT_BEAT_LOOP

**Set `hasLed: false`** (no LED — plain button, AUTO CUE indicator is a separate element):
- TIME_MODE_AUTO_CUE

**Change type to `'led'`** (it's an indicator display, not a pressable button):
- VINYL_CDJ_INDICATOR → `type: 'led'`, keep `ledVariant: 'dual-label'`

**Keep as-is:**
- DIRECTION_LEVER — lever with indicator, `hasLed: true` is correct

### Manifest Update Flow

1. Pull latest manifest from Blob: `GET /api/hosted/panels/cdj-3000` → save to `.pipeline/cdj-3000/manifest-editor.json`
2. Apply `ledStyle` and `hasLed` fixes to the local file
3. Push back to Blob: `PUT /api/hosted/panels/cdj-3000` with updated manifest
4. Contractor sees corrected data on next editor load

## Part 3: Z-Order Feature (Move to Front/Back/Forward/Backward)

### Problem
All controls share static z-index values: `isSelected ? 50 : isGrouped ? 10 : 5`. When deselected, a control that should be "on top" (like a jog display nested inside a jog wheel) drops to the same z-index as everything else. There's no persistent z-ordering.

### How Figma Does It
- Every object has a persistent layer order
- Layers panel shows objects bottom-to-top (topmost = last rendered = visually on top)
- Four operations: Bring to Front (⌘]), Bring Forward (⌘⌥]), Send Backward (⌘⌥[), Send to Back (⌘[)
- Selected objects always render on top temporarily, but persistent order is what matters when deselected

### Data Model

Add `zOrder?: number` to `ControlDef` in `manifestSlice.ts`. Default 0. Higher = rendered later = visually on top.

```typescript
// In ControlDef:
zOrder?: number; // Persistent z-order — higher values render on top
```

### Store Actions

Add 4 actions to `ManifestSlice`:

```typescript
bringToFront: () => void;    // Set zOrder to max+1 for all selected
sendToBack: () => void;      // Set zOrder to min-1 for all selected
bringForward: () => void;    // Increment zOrder by 1 for all selected
sendBackward: () => void;    // Decrement zOrder by 1 for all selected
```

Implementation:
- `bringToFront`: find max zOrder across ALL controls, set selected controls to max+1
- `sendToBack`: find min zOrder across ALL controls, set selected controls to min-1
- `bringForward`: increment selected controls' zOrder by 1
- `sendBackward`: decrement selected controls' zOrder by 1

**File:** `src/components/panel-editor/store/manifestSlice.ts`

### ControlLayer — Sort by zOrder

Currently `Object.values(controls)` renders in insertion order. Sort by `zOrder` so higher values render later (on top):

```typescript
const topLevelControls = Object.values(controls)
  .filter((c) => !c.nestedIn)
  .sort((a, b) => (a.zOrder ?? 0) - (b.zOrder ?? 0));
```

**File:** `src/components/panel-editor/ControlLayer.tsx`

### ControlNode — Incorporate zOrder into CSS z-index

Currently: `zIndex: isSelected ? 50 : isGrouped ? 10 : 5`

New formula — keep control z-indices in the 5-105 range (unselected) and 55-155 (selected) to stay below LabelLayer (150 base) and above sections (1-99):
```typescript
const baseZ = (control.zOrder ?? 0) + 5;  // 5-105
const zIndex = isSelected ? baseZ + 50 : baseZ;  // selected: 55-155
```

**Constraint:** Max zOrder should be ~100 to prevent controls appearing above floating labels. Normalization keeps values in 0..N-1 range.

**File:** `src/components/panel-editor/ControlNode.tsx`

### Duplicate Handling

When duplicating a control, the copy gets `zOrder = original.zOrder + 1` so it renders above the original.

**File:** `src/components/panel-editor/store/manifestSlice.ts` — `duplicateSelected()`

### Z-Order Normalization

After z-order operations, normalize all controls in the same section to 0..N-1:
```typescript
function normalizeZOrder(controls: Record<string, ControlDef>, sectionId: string) {
  const sectionControls = Object.values(controls)
    .filter(c => c.sectionId === sectionId)
    .sort((a, b) => (a.zOrder ?? 0) - (b.zOrder ?? 0));
  sectionControls.forEach((c, i) => { controls[c.id] = { ...c, zOrder: i }; });
}
```

This prevents unbounded growth from repeated "Bring to Front" clicks.

### PanelRenderer — Preview Z-Order

Sort controls by zOrder in `storeToManifest()` (PanCanvas.tsx) before passing to PanelRenderer, so preview mode respects the same z-ordering as the editor.

**File:** `src/components/panel-editor/PanCanvas.tsx`

### Context Menu — Add Z-Order Options

Add after the Lock section:

```
── separator ──
Bring to Front      ⌘]
Bring Forward       ⌘⌥]
Send Backward       ⌘⌥[
Send to Back        ⌘[
```

**File:** `src/components/panel-editor/ContextMenu.tsx`

### Keyboard Shortcuts

Add to `useEditorKeyboard`:
- `⌘]` → bringToFront
- `⌘⌥]` → bringForward  
- `⌘⌥[` → sendBackward
- `⌘[` → sendToBack

**File:** `src/components/panel-editor/hooks/useEditorKeyboard.ts`

### Layers Panel — Show Z-Order

No drag-to-reorder (complex, not needed). But controls within each section should be sorted by zOrder (highest first = top of list, like Figma). Currently sorted by insertion order.

**File:** `src/components/panel-editor/LayersPanel.tsx`

### Properties Panel — Show Z-Order

Add a small z-order display in single-control properties, below lock pills:
```
Layer: 3  [↑] [↓]
```
Two buttons: move forward, move backward. Or just show the number (context menu handles the rest).

**File:** `src/components/panel-editor/PropertiesPanel/index.tsx`

## All Files to Modify

| File | Change |
|------|--------|
| `ControlNode.tsx` | Remove `overflow-hidden`, incorporate `zOrder` into z-index, pass `ledStyle`, skip dot for integrated |
| `manifestSlice.ts` | Add `zOrder` + `ledStyle` to ControlDef, add 4 z-order actions |
| `ControlLayer.tsx` | Sort controls by `zOrder` before rendering |
| `ContextMenu.tsx` | Add z-order menu items |
| `useEditorKeyboard.ts` | Add ⌘]/⌘[/⌘⌥]/⌘⌥[ shortcuts |
| `LayersPanel.tsx` | Sort controls by zOrder within sections |
| `PropertiesPanel/index.tsx` | Show z-order with up/down buttons, LED style selector |
| `PanelButton.tsx` | Add `ledStyle` prop, integrated glow rendering |
| `PanelRenderer.tsx` | Pass `ledStyle`, integrated glow for circle buttons |

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Unbounded zOrder growth (repeated Bring to Front) | Normalize to 0..N-1 after each z-order operation |
| Controls above floating labels (zOrder > 150) | Cap zOrder range to 0-100; normalization keeps it bounded |
| Controls above section selection (zOrder + 5 > 100) | Normalization keeps values small; sections at 100 when selected |
| Same zOrder — nondeterministic order | Secondary sort by control ID: `.sort((a,b) => zOrder diff || id compare)` |
| Duplicate gets wrong zOrder | Set duplicate zOrder = original + 1 |
| GroupOverlay below high-zOrder controls | Visual only (pointerEvents: none), acceptable |

## No Impact On

- Auto-save: `zOrder` and `ledStyle` serialize with controls automatically
- Pipeline: doesn't read z-order or ledStyle
- Preview/PanelRenderer: sorts controls by zOrder for consistent rendering
- Existing manifests: `zOrder` defaults to 0, `ledStyle` defaults to `'dot'` — backwards compatible
- Undo/redo: pushSnapshot captures zOrder changes like any other field
- Keyboard shortcuts: ⌘]/⌘[/⌘⌥]/⌘⌥[ are unused ([ and ] were explicitly removed)

## Verification

1. LED dots visible above buttons in editor (not clipped by overflow)
2. Set button to `ledStyle: 'integrated'` → button face glows, no separate dot
3. Set button to `ledStyle: 'dot'` → separate dot above button (current behavior)
4. Select jog display → Bring to Front → deselect → display stays on top of jog wheel
5. Right-click → z-order menu items work
6. ⌘] / ⌘[ shortcuts work
7. Layers panel shows controls in z-order (topmost first)
8. Z-order and ledStyle persist after save/reload
