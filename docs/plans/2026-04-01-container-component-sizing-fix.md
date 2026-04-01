# Container vs Component Sizing — Root Cause Analysis & Fix Plan

> **For Claude:** This is the CORE issue blocking editor-to-panel parity. Fix this before other features.

**Goal:** Make the generated panel render controls at exactly the size the contractor sees in the editor, regardless of controlScale.

**Branch:** `feature/pipeline-architecture-upgrade` (targets `test`)

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
