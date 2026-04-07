# Container vs Component Sizing — Root Cause Analysis & Fix Plan

> **For Claude:** This is the CORE issue blocking editor-to-panel parity. Fix this before other features.

**Goal:** Make the generated panel render controls at exactly the size the contractor sees in the editor, regardless of controlScale.

**Branch:** `feature/pipeline-architecture-upgrade` (targets `test`)

---

## Research: How Figma Handles This

Figma has the same concept — a frame (container) with content inside. The key differences:

1. **No minimum sizes.** A Figma rectangle renders at whatever size you set. 4px × 4px? Fine. There's no "sm/md/lg" preset that overrides your dimensions.

2. **The frame IS the visual.** When you resize a frame, the content scales with it. There's no invisible container larger than the visual.

3. **Components scale proportionally.** A Figma component instance resizes its internals proportionally. A button at 100px wide with 12px text, resized to 50px, renders 6px text.

4. **No CSS class minimums.** Figma doesn't use Tailwind `w-8 h-6`. Everything is explicit pixel values.

Our PanelButton/Knob/Slider are built like CSS components with fixed Tailwind classes. They need to behave like Figma components — render at whatever pixel size they're told, scaling internals proportionally.

**The mindset shift:** Stop thinking of PanelButton as a "button with preset sizes." Think of it as a "visual frame that renders button-like content at any dimensions."

---

## The Root Problem

The editor and generated panel use different sizing systems:

| Aspect | Editor (ControlNode) | Generated Panel (codegen) |
|---|---|---|
| **Container** | Rnd: `w * controlScale` × `h * controlScale` | `<div>` with `width: pxW, height: pxH` |
| **Component inside** | CSS `transform: scale(controlScale)` shrinks visual | PanelButton/Knob render at FIXED minimum sizes |
| **What you see** | Small control filling small container | Oversized component overflowing small container |

### Why components don't match

PanelButton, Knob, Slider all have **hardcoded minimum sizes**:

- `PanelButton size="sm"` → Tailwind `w-8 h-6` = 32×24px minimum
- `PanelButton size="md"` → Tailwind `w-10 h-7` = 40×28px minimum
- `Knob size="sm"` → 26px diameter
- `Knob size="md"` → 34px diameter

When codegen passes `pxW=16` (40% of 40px), the button ignores it and renders at 32px minimum. The container is 16px → button overflows.

### Three failed approaches so far

1. **CSS transform on generated wrapper** → Controls shrank but containers stayed full-size → clumped layout with huge gaps
2. **Scale editorPosition w/h** → Changed positions AND sizes → scrambled the layout
3. **No scaling at all** → Full-size controls at 40%-positioned containers → massive overlapping

---

## The Fix: Fluid Component Sizing

Make PanelButton, Knob, Slider, and all control components accept **arbitrary pixel dimensions** instead of preset size classes. Components render at whatever size they're told.

### Changes Required

#### 1. PanelButton — accept `width`/`height` props

**File:** `src/components/controls/PanelButton.tsx`

Current: `size: 'sm' | 'md' | 'lg'` → hardcoded Tailwind classes
New: `width?: number; height?: number` → inline styles override Tailwind

```typescript
// If width/height provided, use them. Otherwise fall back to size class.
const style = width && height
  ? { width, height, fontSize: Math.max(width / 5, 6) }
  : undefined;
```

#### 2. Knob — accept `outerSize` at any value (already does)

Knob already accepts `outerSize` prop. Verify it works at small values (e.g., 16px).

#### 3. Slider — accept `trackHeight`/`trackWidth` at any value (already does)

Slider already accepts props. Verify small values work.

#### 4. Codegen — pass actual pixel dimensions

**File:** `scripts/panel-codegen.ts` — `renderControl()`

Current: computes `size = pxH <= 32 ? 'sm' : pxH <= 48 ? 'md' : 'lg'`
New: pass `width={pxW} height={pxH}` directly to PanelButton

```typescript
// Instead of:
`size="${btnSize}"`
// Use:
`width={${pxW}} height={${pxH}}`
```

#### 5. Remove size presets from codegen

The `sm/md/lg` selection logic becomes unnecessary. Components render at exact pixel sizes.

---

## How This Solves the Problem

At controlScale=0.4 on a 1200×361 canvas:
- Editor: knob container = 16×12.8px, visual fills container
- Codegen: `editorPosition.w = (40 * 0.4 / 1200) * 100 = 1.33%`
- Generated panel: `pxW = 1.33% * 1200 = 16px`
- PanelButton receives `width={16} height={13}` → renders at 16×13px
- **Exact match with editor**

At controlScale=1.0 (100%):
- Editor: knob container = 40×32px, visual fills container
- Codegen: `editorPosition.w = (40 / 1200) * 100 = 3.33%`
- Generated panel: `pxW = 3.33% * 1200 = 40px`
- PanelButton receives `width={40} height={32}` → renders at 40×32px
- **Also exact match**

---

## Audit Results (2026-04-01)

### Components already fluid (no changes needed):
- Knob — `outerSize` prop works at any value
- Slider — `trackHeight`/`trackWidth` props work at any value
- PadButton — `width`/`height` props already accepted
- Wheel — `width`/`height` props already accepted
- TouchDisplay — `width`/`height` props already accepted

### Components needing modification:
- **PanelButton** — hardcoded Tailwind `w-8 h-6` (sm), `w-10 h-7` (md), `w-14 h-9` (lg). Needs `width`/`height` override props.
- **ValueDial** — hardcoded size presets. Same fix.

### Pipeline impact: NONE
- Tutorials highlight by ID, not size — changing dimensions doesn't break tutorials
- PanelState is size-agnostic (active/ledOn/value only)
- sizeClass stays in manifest for hash stability + label font sizing
- Fantom-08 hand-built panel uses `size="md"` — backward compatible if we keep the prop

### Backward compatibility approach:
```typescript
// Keep size prop for Fantom-08, add width/height for pipeline panels
interface PanelButtonProps {
  size?: 'sm' | 'md' | 'lg';  // kept for backward compat
  width?: number;               // NEW — overrides size preset
  height?: number;              // NEW — overrides size preset
}
```

### Minimum viable size: ~16px
Below 16px, text and details become illegible. This is fine for the Fantom-06 at 40% scale (most controls land at 16-24px).

---

## Implementation Order

1. Update PanelButton to accept `width`/`height` props (override size presets)
2. Update Knob to handle very small outerSize values (add min clamping)
3. Update Slider to handle very small track values
4. Update codegen `renderControl()` to pass pixel dimensions as props
5. Remove sm/md/lg size selection from codegen
6. Update codegen editorPosition.w/h to use `w * controlScale`
7. Regenerate fantom-06 panel
8. Playwright: compare editor at 40% vs generated panel

## Files Changed

| File | Change |
|------|--------|
| `src/components/controls/PanelButton.tsx` | Add `width`/`height` props |
| `src/components/controls/Knob.tsx` | Verify small outerSize works |
| `src/components/controls/Slider.tsx` | Verify small trackHeight works |
| `scripts/panel-codegen.ts` | Pass pixel dimensions, remove size presets |
| `src/app/api/pipeline/[deviceId]/codegen/route.ts` | Scale w/h by controlScale |

## Files NOT Changed

- ControlNode.tsx — editor already works with container scaling
- manifestSlice.ts — stored w/h unchanged
- historySlice.ts — no impact
- useAutoSave.ts — no impact
