# Plan: Label Alignment + Mini Sections (Implement Now)

## Status: REVIEWED — ready for implementation

## Themes/skins plan saved separately at: docs/plans/2026-04-27-themes-skins-design.md

---

## Feature 1: On-Button Label Alignment + Color

### Context
Buttons currently center all on-button text. Pads hardcode to bottom-right. No way to position label text at specific locations within the button face (top-left, bottom-center, etc.) or control the text color. CDJ-3000 has buttons with different text colors (BEAT SYNC = white, MASTER = amber, KEY SYNC = blue).

### Data Model
Add to `ControlDef` in `manifestSlice.ts`:
```typescript
labelAlign?: 'center' | 'top-left' | 'top-center' | 'top-right'
           | 'middle-left' | 'middle-right'
           | 'bottom-left' | 'bottom-center' | 'bottom-right';
labelColor?: string;  // hex color for on-button text (default: gray-200)
```
- Default `labelAlign`: `'center'` for buttons, `'bottom-right'` for pads (preserves current behavior)
- Default `labelColor`: `undefined` (uses current hardcoded gray)

### Rendering
PanelButton and PadButton map `labelAlign` to CSS:
- `center` → `flex items-center justify-center` (current)
- `top-left` → `absolute top-1 left-1.5`
- `bottom-right` → `absolute bottom-1.5 right-2` (current pad default)
- etc.

`labelColor` overrides text color via inline style.

Works in both ControlNode (editor) and PanelRenderer (production).

### Properties Panel
When `labelPosition === 'on-button'` (except dual-label LEDs), show:
1. **3x3 dot grid** — 9 clickable dots arranged in a 3x3 grid. Click to set where text sits inside the button face. Figma-style alignment widget, compact.
2. **Color input** — small color circle + hex input for label text color.

### Scope
Any control with `labelPosition === 'on-button'`, except `ledVariant === 'dual-label'` (which has its own two-row layout).

### Files to Modify
- `src/components/panel-editor/store/manifestSlice.ts` — add `labelAlign`, `labelColor` to ControlDef
- `src/components/controls/PanelButton.tsx` — accept `labelAlign`, `labelColor` props, map to CSS
- `src/components/controls/PadButton.tsx` — accept `labelAlign`, `labelColor` props
- `src/components/panel-editor/ControlNode.tsx` — pass `labelAlign`, `labelColor` to components
- `src/components/controls/PanelRenderer.tsx` — same pass-through for production
- `src/components/panel-editor/PropertiesPanel/index.tsx` — 3x3 grid + color input
- `src/components/panel-editor/PanCanvas.tsx` — pass `labelAlign`, `labelColor` in storeToManifest
- `src/types/manifest.ts` — add fields to ManifestControl

---

## Feature 2: Mini Sections (Visual Control Containers)

### Context
Real hardware has recessed/beveled containers grouping related controls (e.g., CDJ-3000's BEAT SYNC / MASTER / KEY SYNC cluster). These aren't full sections — they're visual grouping elements. Currently no way to represent this. Groups are logical (multi-select behavior) but invisible in production.

### Data Model
New type in `manifestSlice.ts`:
```typescript
export interface ControlContainer {
  id: string;
  controlIds: string[];           // which controls are visually inside
  style: 'recessed' | 'raised' | 'outlined' | 'filled';
  x: number; y: number; w: number; h: number;
  borderRadius?: number;          // default 4
  label?: string;                 // optional small text above container
}
```
Store as `controlContainers: ControlContainer[]` on the manifest state (alongside `controlGroups`).

### Editor — Right-Click Only (v1)
**Two creation methods via context menu:**
1. Select 2+ controls → right-click → "Create Container" (auto-sizes to selection + 8px padding)
2. Right-click empty canvas → "Add Container" (default 120x80 at click position)

**After creation:**
- Container is draggable/resizable independently of controls
- Properties panel shows:
  - Style preset: 4-pill selector (Recessed / Raised / Outlined / Filled)
  - Optional label text input
  - Border radius slider
- Delete container via right-click or Properties panel (doesn't delete controls)
- `controlIds` populated automatically based on which controls are visually inside bounds

**No toolbar button for v1.** Right-click matches existing Group/Align/Z-order patterns. Add toolbar button in v2 if contractors request it.

### Key Design Decisions
- **Z-index: 2-4** (between sections at 1 and controls at 5+). NOT z=150.
- **Independent from groups** — containers are visual only, groups are behavioral
- **Absolute canvas coordinates** — controls don't position relative to container
- **No auto-resize** — "Fit to Contents" as explicit right-click action, not reactive

### Production Rendering (PanelRenderer)
Containers render as styled `div`s at z=2-4 (between sections and controls):
- **Recessed:** `background: rgba(0,0,0,0.15)`, `boxShadow: inset 0 2px 4px rgba(0,0,0,0.3)`, `borderRadius: 4px`, `border: 1px solid rgba(255,255,255,0.06)`
- **Raised:** `background: rgba(255,255,255,0.03)`, `boxShadow: 0 2px 6px rgba(0,0,0,0.3)`, `borderRadius: 4px`, `border: 1px solid rgba(255,255,255,0.08)`
- **Outlined:** `background: transparent`, `border: 1px solid rgba(255,255,255,0.12)`, `borderRadius: 4px`
- **Filled:** `background: rgba(0,0,0,0.1)`, `borderRadius: 4px`, no shadow, no border

### Relationship to Groups
Independent. Groups = logical (move together). Containers = visual (rendered box). Can exist separately or together. UI could offer "Group + Container" as a convenience action.

### Files to Modify
- `src/components/panel-editor/store/manifestSlice.ts` — add `ControlContainer` type, `controlContainers` state, CRUD actions
- `src/components/panel-editor/store/historySlice.ts` — include `controlContainers` in undo snapshots
- `src/components/panel-editor/PanCanvas.tsx` — render containers below ControlLayer
- `src/components/panel-editor/ControlNode.tsx` or new `ContainerNode.tsx` — draggable/resizable container in editor
- `src/components/controls/PanelRenderer.tsx` — render containers in production
- `src/components/panel-editor/ContextMenu.tsx` — "Create Container" menu item
- `src/components/panel-editor/PropertiesPanel/index.tsx` — container properties
- `src/components/panel-editor/hooks/useAutoSave.ts` — include `controlContainers` in auto-save
- `src/types/manifest.ts` — add ControlContainer to manifest types

---

## Design Consideration: LED Resting State (No Tint When Off)

**Status: THINK ABOUT — don't implement yet**

Currently, integrated LED buttons (`ledStyle: 'integrated'`) show a dim color tint even when `ledOn` is not set (resting/default state). This means RELOOP/EXIT, BEAT SYNC, etc. all have a visible green/blue tint in the editor and preview even though no tutorial step has activated them.

**The question:** Should the resting state show ANY tint at all?

**Option A: Zero tint when off** — Button looks completely normal (same as `hasLed: false`). LED color ONLY appears when `ledOn: true`. Clean, but you can't tell which buttons have LEDs by looking at the panel at rest.

**Option B: Very subtle tint when off (current)** — Dim hint of color so you can see which buttons are LED-capable. But this makes RELOOP/EXIT look green when it shouldn't.

**Option C: Tint only in editor, not in preview/production** — Editor shows the dim tint so the contractor knows which buttons have LEDs. Preview and production show zero tint. Best of both worlds.

**Recommendation: Option C** — The editor is a design tool where seeing LED capability is useful. The production panel should look like real hardware at rest — no color unless active.

**Implementation details (from UI/UX review):**
- Editor: 15-20% opacity tint so it reads as "hint" not "state"
- Production: zero tint when `ledOn` is undefined/false — button looks normal
- Add "Editor Hints" indicator in toolbar so contractor knows the tint is authoring-only
- The visual weight ratio (hint at ~15% vs active at ~100%) communicates "this is authoring context"

**Unified LED Selector (replaces old `ledStyle` pills):**
- [None/Dot/Glow] for ALL buttons and pads — replaces the old hidden `hasLed` + `ledStyle` split
- Delete the old `ledStyle` selector entirely — don't have two selectors
- LED Color picker only shows when Dot or Glow is selected (not None)
- No confirmation dialog when switching — Cmd+Z undo is sufficient
- Dual/Bar stay separate for `type=led`/`type=indicator` only

**Container creation naming (from UI/UX review):**
- "Wrap in Container" (from selected controls) — NOT "Create Container"
- "Add Container" (empty canvas right-click) — stays as-is
- Container selection: via Layers panel when behind controls. Consider Alt+Click to cycle stacked elements.

**Add to plan when implementing LED glow polish.**

---

## Bug Fix: Dual-Label LED Indicator Not Rendering

**Priority: HIGH** — VINYL/CDJ indicator shows as plain button instead of dual-label LED

### Problem
The VINYL_CDJ_INDICATOR control has `type: "button"` + `ledVariant: "dual-label"`. The dual-label rendering (two rows with LED dots, top/bottom glow toggle) only exists in the `case 'led'` / `case 'indicator'` branch of both ControlNode and PanelRenderer. Since `type` is `"button"`, it renders as a plain PanelButton — no LED dots, no dual-label split.

We previously changed this to `type: "led"` and pushed to Blob, but the contractor's auto-save may have reverted it (auto-save writes the full controls object back, including `type`).

### Fix (Two Parts)

**Part 1: Data fix** — Change `type` to `"led"` in the local manifest AND push to Blob. But this will keep getting reverted by auto-save unless the contractor also sees it as type `"led"` in their editor.

**Part 2: Code fix (more robust)** — In ControlNode's `case 'button'` branch, check if `ledVariant === 'dual-label'` and render the dual-label treatment instead of PanelButton. This way it works regardless of `type`. Same in PanelRenderer.

```typescript
// In renderControl, case 'button':
if (control.ledVariant === 'dual-label') {
  // Render dual-label LED treatment (same as case 'led' dual-label branch)
  // ... reuse the dual-label rendering code
}
```

### Contractor Visibility
The contractor sees a "Type" dropdown in Properties panel. They can change a control from "button" to "led" — but they likely don't know they should. The type dropdown includes: button, knob, slider, fader, led, indicator, wheel, pad, encoder, switch, lever, port, slot, screen, display.

For dual-label specifically, the contractor should see "led" or "indicator" as the type. If the pipeline sets it as "button" by mistake, the code fix (Part 2) ensures it still renders correctly.

### Files
- `src/components/panel-editor/ControlNode.tsx` — button branch: check ledVariant === 'dual-label'
- `src/components/controls/PanelRenderer.tsx` — same check in button branch
- `.pipeline/cdj-3000/manifest-editor.json` — fix type to "led" + push to Blob

---

## Feature 3: Themes/Skins (PLAN ONLY — Implement Later)

### Context
End users will be able to purchase skins/themes to customize how their instrument panel looks. This is a product feature, not a contractor feature. The contractor editor gets a preview toggle to test skins.

### Theme Definition
A theme is a named palette defined as CSS custom properties:
```typescript
interface PanelTheme {
  id: string;
  name: string;              // "Dark Industrial", "Retro Warm", "Neon Blue"
  isPremium: boolean;         // requires purchase
  variables: {
    // Panel
    panelBg: string;
    panelBorder: string;
    
    // Sections
    sectionBg: string;
    sectionBorder: string;
    sectionHeaderBg: string;
    sectionHeaderText: string;
    
    // Containers (mini sections)
    containerBg: string;
    containerBorder: string;
    containerShadow: string;
    
    // Controls
    buttonFace: string;
    buttonBorder: string;
    buttonText: string;
    knobOuter: string;
    knobInner: string;
    sliderTrack: string;
    sliderThumb: string;
    
    // Accents (per archetype)
    accentTransport: string;
    accentPerformance: string;
    accentSync: string;
    accentEffects: string;
    accentMixer: string;
  };
}
```

### Theme Scope
- **Device-level:** One theme for the whole instrument
- **Section accents:** Sections automatically get their accent from the theme based on `archetype` (transport, effects, mixer, etc.)
- **No per-control manual color picking** by users

### Architecture Readiness (What Already Exists)
All controls already have `data-control-id` attributes in the DOM.
All sections have `data-section-id` attributes.
Controls have `type` field — add `data-control-type` attribute to each component.
Sections have `archetype` — add `data-section-archetype` to SectionContainer.

### CSS Variable Approach
PanelShell wraps everything. Apply theme variables as CSS custom properties on the PanelShell root:
```tsx
<div style={{ 
  '--panel-bg': theme.variables.panelBg,
  '--button-face': theme.variables.buttonFace,
  // ... etc
}}>
```
All control components read from CSS variables instead of hardcoded colors.

### Contractor Preview
Add a "Skin Preview" dropdown to the editor toolbar (next to Preview button).
Contractor can cycle through available skins to see how positioning looks with different themes.
Purely visual — doesn't save to manifest. Resets on reload.

### User-Facing
- Skin selector on the instrument page
- Selection stored in user preferences / account
- Default skin: "Standard" (current dark theme — no migration needed)
- Premium skins require purchase (gated by `isPremium` flag)

### Migration Path
1. First: add `data-control-type` and `data-section-archetype` attributes (small, no-risk)
2. Then: define the "Standard" theme as CSS variables matching current hardcoded values
3. Then: migrate control components from hardcoded colors to CSS variables
4. Then: define 2-3 additional themes
5. Then: add theme selector UI

### Files to Modify (Eventually)
- `src/components/controls/PanelShell.tsx` — accept `theme` prop, apply CSS variables
- All control components (PanelButton, Knob, Slider, etc.) — read from CSS variables
- `src/components/controls/SectionContainer.tsx` — add `data-section-archetype`, read CSS variables
- `src/lib/themes/` — new directory for theme definitions
- `src/components/panel-editor/EditorToolbar.tsx` — skin preview dropdown
- User preferences / account system (future)

---

## Implementation Priority

1. **Feature 1** (label alignment + color) — implement now
2. **Feature 2** (mini sections / containers) — implement now
3. **Feature 3** (themes/skins) — save for later, plan is documented above

---

# Previous Plan (Pipeline LED + Pre-Tutorial Blockers)

Kept below for reference — this work is already done or tracked in MEMORY.md.

---

# Plan: Pipeline LED Style Detection + Dual-Label Fix

## Context

Two issues to address:
1. **Pipeline agents don't detect `ledStyle`** — The gatekeeper outputs `hasLed`, `ledColor`, `ledVariant`, `ledPosition`, `ledBehavior` but has no concept of `ledStyle: 'integrated' | 'dot'`. This means every new instrument requires manual correction of LED styles after pipeline extraction.
2. **Dual-label indicator can't edit both parts** — The dual-label LED (e.g., VINYL/CDJ) splits `control.label` on `/` to get top/bottom text. But the label editor is a single text field, and if the label uses `\n` instead of `/`, the split breaks.

## Part 1: Add `ledStyle` to Pipeline Type System

### Add `LEDStyle` type to `src/types/manifest.ts`

```typescript
export type LEDStyle = 'integrated' | 'dot';
```

Add to `ManifestControl` interface:
```typescript
ledStyle?: LEDStyle;
```

This makes `ledStyle` flow through the pipeline → gatekeeper → layout engine → editor, not just exist in the editor's ControlDef.

**File:** `src/types/manifest.ts`

## Part 2: Update Gatekeeper SOUL

The gatekeeper SOUL at `~/.claude/agents/gatekeeper.md` has LED instructions at lines 215-216. Add `ledStyle` detection guidance:

```markdown
- `ledStyle`: `'integrated'` if manual says "button lights up" / "illuminates" / button face changes color. 
  `'dot'` if a separate physical LED indicator sits above/below the button. 
  Default to `'integrated'` for transport buttons (PLAY, CUE), performance pads (HOT CUE), 
  and mode toggles (SLIP, QUANTIZE, SYNC). Default to `'dot'` for synth knobs/faders with LED rings.
```

**File:** `~/.claude/agents/gatekeeper.md`

## Part 3: Update Checkpoint Validators

In `src/lib/pipeline/checkpoint-validators.ts`, add validation that when `hasLed === true`, `ledStyle` should be set. Don't deduct points (it's enrichment), but log a warning.

**File:** `src/lib/pipeline/checkpoint-validators.ts`

## Part 4: Fix Dual-Label Editing + Rendering

### Problem
The dual-label LED (e.g., VINYL/CDJ indicator) has one `label` field that gets split on `/` to produce top and bottom text. The Properties panel only shows a single label text field — the contractor can't edit the top and bottom parts independently.

### Fix: Two Separate Label Fields for Dual-Label LEDs

When a control has `ledVariant === 'dual-label'`, show two text inputs in the Properties panel instead of one:

```
Top Label:  [VINYL    ]
Bottom Label: [CDJ      ]
```

Store as `label: "VINYL/CDJ"` (joined with `/`). The two inputs read from `label.split('/')` and write back as `topValue + '/' + bottomValue`.

**File:** `src/components/panel-editor/PropertiesPanel/index.tsx` — in `SingleControlProperties`, detect `ledVariant === 'dual-label'` and render two inputs instead of `<LabelEditor>`.

### Fix: Splitter Handles Both `/` and `\n`

Update the dual-label renderer to split on both `/` and `\n` for backwards compat:
```typescript
const parts = control.label.split(/[\/\n]/).map(s => s.trim()).filter(Boolean);
```

**Files:** `src/components/panel-editor/ControlNode.tsx`, `src/components/controls/PanelRenderer.tsx`

## Files to Modify

| File | Change |
|------|--------|
| `src/types/manifest.ts` | Add `LEDStyle` type, add `ledStyle` to ManifestControl |
| `~/.claude/agents/gatekeeper.md` | Add `ledStyle` detection rules |
| `src/lib/pipeline/checkpoint-validators.ts` | Add `ledStyle` warning when `hasLed` is true but `ledStyle` missing |
| `src/components/panel-editor/ControlNode.tsx` | Fix dual-label split to handle `\n` |
| `src/components/controls/PanelRenderer.tsx` | Same dual-label split fix |
| `src/components/panel-editor/PropertiesPanel/index.tsx` | Two separate label inputs for dual-label LEDs |

## Part 5: Pre-Tutorial Blockers — LED State Wiring

These must be done before CDJ-3000 (or any manifest-based) tutorials can show LED feedback.

### 5a. Integrated LED responds to `ledOn`

**Problem:** PanelButton's integrated glow (`ledStyle: 'integrated'`) is a static dim tint. It doesn't change when `ledOn=true` in panelState. Tutorials need buttons to visibly light up.

**Fix:** In PanelButton.tsx, make `integratedGlow` conditional on `ledOn`:
```typescript
const integratedGlow = (ledStyle === 'integrated' && hasLed && ledColor) ? {
  backgroundColor: ledOn ? `${ledColor}40` : `${ledColor}18`,
  border: `1px solid ${ledOn ? ledColor : `${ledColor}50`}`,
  boxShadow: ledOn
    ? `0 0 10px ${ledColor}80, inset 0 0 6px ${ledColor}40`
    : `0 0 6px ${ledColor}40, inset 0 0 3px ${ledColor}20`,
} : undefined;
```

**File:** `src/components/controls/PanelButton.tsx`

### 5b. LED indicators respond to `ledOn`

**Problem:** PanelRenderer's LED/indicator controls (dual-label, dot, bar) are hardcoded "always on". They ignore `ledOn` from panelState.

**Fix:** In PanelRenderer.tsx `renderControl`, the `case 'led'` / `case 'indicator'` block receives `ledOn` as a parameter but never uses it. Wire it:

- **dual-label:** When `ledOn=false`, swap which row is lit (bottom becomes active). Or when `ledOn=true` show top lit, `ledOn=false` show bottom lit.
- **dot:** When `ledOn=false`, show dimmed dot (`backgroundColor: '#333'`).
- **bar:** When `ledOn=false`, show dimmed bar.

**File:** `src/components/controls/PanelRenderer.tsx`

### 5c. Circle button integrated LED responds to `ledOn`

**Problem:** Same as 5a but for circle buttons rendered directly in PanelRenderer (not via PanelButton).

**Fix:** In PanelRenderer.tsx circle button case, make the integrated glow conditional on `ledOn`.

**File:** `src/components/controls/PanelRenderer.tsx`

### Existing blockers (from MEMORY.md, still pending)

- **PanelRenderer: displayState** — wire screen content so tutorials show live display (~100 LOC)
- **PanelRenderer: zones** — wire keyboard zone coloring for split/layer tutorials (~30 LOC)

## All Pre-Tutorial Blockers Summary

| Blocker | Status | Effort |
|---------|--------|--------|
| displayState for screens | Pending (memory/project_panelrenderer_displaystate.md) | ~100 LOC |
| Keyboard zone coloring | Pending (memory/project_panelrenderer_zones.md) | ~30 LOC |
| Integrated LED responds to ledOn | **NEW** — not tracked | ~10 LOC |
| LED indicators respond to ledOn | **NEW** — not tracked | ~30 LOC |
| Circle button integrated LED | **NEW** — not tracked | ~5 LOC |
| CDJ-3000 editor sizing | DONE (fixed this session) | — |

## Verification

1. Run gatekeeper on a test instrument → manifest includes `ledStyle` field
2. Dual-label indicator renders correctly with both `VINYL/CDJ` and `VINYL\nCDJ` labels
3. Existing instruments unaffected (ledStyle defaults to undefined → `'dot'` backwards compat)
4. PanelButton integrated LED brightens when ledOn=true, dims when false
5. LED indicators toggle on/off based on ledOn
6. Dual-label indicator flips active row based on ledOn
