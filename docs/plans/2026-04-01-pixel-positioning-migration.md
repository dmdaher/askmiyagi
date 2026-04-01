# Pixel Positioning Migration — Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Switch the codegen pipeline from percentage-based to pixel-based positioning. Editor pixels pass straight through to the generated panel. Like Figma export — no conversion, no coordinate mismatch.

**Branch:** `feature/pipeline-architecture-upgrade` (targets `test`)

---

## Why

The codegen converts editor pixels → percentages → pixels through two different coordinate spaces (full panel vs keyboard-split panel area). This double conversion causes:
- Controls rendered at wrong Y positions (shifted upward)
- Height stretching (H divided by 199px, multiplied by 361px)
- Fragile math that breaks whenever PanelShell's internal layout changes

## Design Decisions

1. **Full space + absolute keyboard** — PanelShell renders controls in the full panel space (1200×361). Keyboard is `position: absolute; bottom: 0`. No two-div height split.
2. **Pixels everywhere** — `left: 184px, top: 49px, width: 56px, height: 32px`. No percentage conversion.
3. **Panel Scale via CSS transform** — `transform: scale(panelScale)` on PanelShell wrapper. All pixels stay the same; visual scales proportionally.

## Data Flow (After)

```
Editor stores pixels (x=184, y=49, w=56, h=32)
  ↓
Codegen API passes through as-is (no conversion)
  ↓
Codegen script uses pixels directly in generated JSX
  ↓
PanelShell renders in full 1200×361 space
  ↓
Controls at exact pixel positions → matches editor
```

## What Changes

### 1. Codegen API (`src/app/api/pipeline/[deviceId]/codegen/route.ts`)

Remove all percentage conversion math. Pass editor pixels through:

```typescript
// Before (broken):
editorPosition: {
  x: Math.round((editorControl.x / canvasW) * 1000) / 10,  // → percentage
  y: Math.round((editorControl.y / panelAreaH) * 1000) / 10,
  w: Math.round((editorControl.w / canvasW) * 1000) / 10,
  h: Math.round((editorControl.h / panelAreaH) * 1000) / 10,
}

// After (clean):
editorPosition: {
  x: Math.round(editorControl.x),  // → pixels
  y: Math.round(editorControl.y),
  w: Math.round(editorControl.w),
  h: Math.round(editorControl.h),
}
```

Section bounding boxes: convert from gatekeeper percentages to pixels in the API (for SectionContainer decorative backgrounds):
```typescript
section.panelBoundingBox = {
  x: Math.round((bbox.x / 100) * canvasW),
  y: Math.round((bbox.y / 100) * canvasH),
  w: Math.round((bbox.w / 100) * canvasW),
  h: Math.round((bbox.h / 100) * canvasH),
};
```

### 2. Codegen Script (`scripts/panel-codegen.ts`)

**Flat panel controls:** Remove `(ep.w / 100) * panelWidth` conversions. Use ep values directly:
```typescript
// Before:
const pxW = Math.round((ep.w / 100) * panelWidth);
`left: '${ep.x.toFixed(1)}%',`

// After:
const pxW = ep.w;
`left: ${ep.x},`
```

**Floating labels:** Convert from percentage offsets to pixel offsets. `labelHeightPct = 1.2` → `labelHeightPx = Math.round(panelHeight * 0.012)`.

**SectionContainer:** Pass pixel values instead of percentages.

**Section-based absolute positioning:** Same change — ep values are pixels, use directly.

### 3. PanelShell (`src/components/controls/PanelShell.tsx`)

Remove the keyboard height split. Render everything in full space:

```tsx
// Before (split):
<div style={{ height: `${keyboard.panelHeightPercent}%`, position: 'relative' }}>
  {children}
</div>
<div style={{ height: `${100 - keyboard.panelHeightPercent}%` }}>
  <Keyboard />
</div>

// After (full space):
<div style={{ width, height, position: 'relative' }}>
  {children}
  <div style={{ position: 'absolute', bottom: 0, left: kbLeft, width: kbWidth, height: kbHeight }}>
    <Keyboard />
  </div>
</div>
```

Keyboard height computed from `panelHeightPercent`: `kbHeight = height * (1 - panelHeightPercent / 100)`.

### 4. SectionContainer (`src/components/controls/SectionContainer.tsx`)

Accept pixels instead of percentages:
```tsx
// Before:
left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`

// After:
left: x, top: y, width: w, height: h
```

## What Does NOT Change

- **Editor** — already stores pixels. No changes to ControlNode, manifestSlice, useAutoSave, historySlice.
- **Pipeline → editor path** — gatekeeper produces percentages, loadFromManifest converts to pixels. Untouched.
- **manifest.json** — gatekeeper output stays as percentages. Codegen API converts section bboxes to pixels during merge.
- **Fantom-08** — hand-built, doesn't use editorPosition or flat panel mode. Untouched.
- **Tutorials** — reference controls by ID. Unaffected.
- **Fluid component sizing** — PanelButton width/height props work the same with pixels.

## Verification

1. Set Fantom-06 editor to 40% scale, position controls on photo
2. Click Approve & Build
3. Playwright: screenshot editor and preview side by side
4. Compare pixel positions — should be identical
5. Verify no Y-shift, no height stretching
6. Verify Fantom-08 still renders (backward compat)
7. Test Panel Scale slider — CSS transform scales everything proportionally
8. `npx vitest run` — 990 tests pass
9. `npx tsc --noEmit` — clean TypeScript
