# PanelRenderer Replaces Codegen

**Date:** 2026-04-05
**Goal:** Single PanelRenderer component replaces per-device generated TSX files + codegen script
**Scope:** ~300 LOC new, ~2000 LOC deleted

---

## Why

The editor's Preview mode already renders panels from manifest data using the same leaf components (PanelButton, Knob, Slider, SectionContainer) as codegen output. Codegen converts runtime data to committed TSX — an unnecessary transformation step that introduces drift risk, adds 1200 lines of maintenance surface, and requires an extra "Approve & Build" click.

---

## PanelRenderer interface

```tsx
interface PanelRendererProps {
  manifest: PanelManifest;
  panelState?: PanelState;
  highlightedControls?: string[];
  onButtonClick?: (id: string) => void;
  displayState?: any;
  zones?: any[];
}
```

Used in three places:
1. **Editor preview mode** — reads from Zustand store
2. **Admin review / navbar preview** — reads from API / Blob
3. **Production panel page** — reads from committed JSON or API

---

## What PanelRenderer renders

1. `<PanelShell>` with manufacturer, deviceName, width, height, keyboard config
2. `<SectionContainer>` for each section (dark background + optional header label)
3. Absolute-positioned control divs → leaf components (PanelButton, Knob, Slider, etc.)
   - Wired to `panelState` (active/inactive, LED state, values)
   - Wired to `highlightedControls` (glow effect)
   - Wired to `onButtonClick` (click handler)
4. Group labels (absolute-positioned spans spanning member controls)
5. Editor labels (absolute-positioned text with fontSize, alignment, multi-line)

---

## What gets deleted

- `scripts/panel-codegen.ts` (~1200 lines)
- `src/app/api/pipeline/[deviceId]/codegen/route.ts` (~260 lines)
- Generated files: `src/components/devices/fantom-06/FANTOM06Panel.tsx` + sections/*.tsx
- Generated constants: `src/lib/devices/fantom-06-constants.ts`
- "Approve & Build" button in toolbar (or repurpose to "Export Manifest")

**NOT deleted:** Fantom-08's handcrafted panel (uses DisplayScreen, stays as-is)

---

## What replaces them

- `src/components/controls/PanelRenderer.tsx` (~300 LOC)
- `data/manifests/fantom-06.json` (committed manifest file, ~50KB)
- Device registry update: `PanelComponent` for Fantom-06 wraps PanelRenderer

---

## Execution order

### Step 1: Build PanelRenderer
- Extract rendering logic from ControlNode's `renderControl()` into a standalone mapping function
- Wrap in PanelShell
- Render sections, controls, labels, group labels, keyboard
- Accept panelState + highlightedControls + onButtonClick props

### Step 2: Replace editor preview
- PanCanvas preview branch: `<PanelRenderer manifest={storeToManifest()} />`
- Create `storeToManifest()` utility converting editor Zustand state to PanelManifest shape
- Verify visual parity with current preview

### Step 3: Replace navbar preview page
- `/admin/[deviceId]/preview/page.tsx`: load manifest from API → `<PanelRenderer />`
- Remove DEVICE_REGISTRY dependency for this page

### Step 4: Replace production panel
- Commit `data/manifests/fantom-06.json` (the manifest-editor.json data)
- Update deviceRegistry.ts: Fantom-06 entry uses PanelRenderer + static JSON import
- Verify tutorials still work (same props interface)

### Step 5: Delete codegen
- Remove `scripts/panel-codegen.ts`
- Remove codegen API route
- Remove generated device files
- Update pipeline runner to skip codegen phase
- Repurpose "Approve & Build" to "Commit Manifest" (saves manifest JSON to repo)

---

## Navbar vs toolbar preview → unified

Both become `<PanelRenderer manifest={...} />` with different data sources:
- **Toolbar preview:** manifest from editor Zustand store (live edits)
- **Navbar/admin preview:** manifest from API (saved state)

The navbar preview page can optionally add panelState toggle (click controls to test interaction) — same UX it has today.

---

## Editor state sharing rule

**One editor at a time per device.** If Devin edits in the editor and saves, then clicks "Send to Contractor", contractor sees Devin's latest state. If both edit simultaneously, last-save-wins (no conflict resolution). Sequential editing is the assumed workflow.

In the hosted contractor flow:
- "Send to Contractor" uploads Devin's latest manifest to Blob
- Contractor loads from Blob, edits, saves back to Blob
- Devin reviews contractor's Blob state
- If Devin wants to make changes: pull contractor's state, edit locally, re-push

---

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Fantom-08 DisplayScreen integration | Fantom-08 stays handcrafted, not migrated |
| Bundle size (PanelRenderer imports all leaf components) | Negligible — all components are already in the bundle for the editor |
| Runtime manifest loading performance | Static import for committed JSON; no network request |
| Circle button rendering differs between editor and codegen | Standardize on one approach in PanelRenderer |
| Tutorial regression | Same props interface; verify with existing Playwright tests |
