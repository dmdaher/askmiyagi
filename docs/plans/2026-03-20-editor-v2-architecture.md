# Editor V2 Architecture — Complete Plan (Revised)

> **Context:** Consolidates all feedback from initial build, user testing, Gemini's architectural review, and comprehensive end-to-end gap analysis (60+ gaps identified). This is the definitive roadmap.

## Core Principles

**"Correct Topology, Approximate Geometry"**
- The pipeline must get the TOPOLOGY right (rows are rows, groups are groups)
- The contractor only fixes GEOMETRY (spacing, sizing, exact positioning)
- If a contractor has to re-group sections or change archetypes, the pipeline failed
- The editor output must be production-grade — thousands of users will see it daily

**"Everything from the Manifest"**
- The contractor should NEVER decide: button colors, shapes, LED colors, icon vs text, control grouping, or archetype assignments
- All visual and behavioral properties come from the pipeline via the manifest
- The contractor can OVERRIDE if the pipeline got it wrong, but defaults must be correct

**"Free-Form Editing, Clean Code Output"**
- Contractor drags freely against the photo overlay (Figma-style)
- On Approve, the Layout Inference Engine re-derives clean archetype parameters from final positions
- Contractor reviews inference results and can override per-section
- Codegen generates production flex/grid CSS, not brittle absolute positioning

---

## Architecture Overview

```
Pipeline Phase 0 (AI + Deterministic)
  ├── Diagram Parser (vision)
  │   ├── Extract centroids, bounding boxes, topology
  │   ├── NEW: Detect silkscreen boundary lines
  │   ├── NEW: Detect control shapes (circle vs rectangle)
  │   ├── NEW: Classify relative size (xs-xl)
  │   ├── NEW: Recognize transport-pair pattern
  │   └── NEW: Expanded typeHint vocabulary (port, slot, lever, fader)
  │
  ├── Gatekeeper (judge LLM)
  │   ├── Reconcile text + geometry → manifest
  │   ├── NEW: Visual Appearance Protocol (shape, color, style)
  │   ├── NEW: Label Rendering Protocol (icon, display mode, group labels)
  │   ├── NEW: LED Properties Protocol (color, behavior, position)
  │   ├── NEW: Interaction Model Protocol (momentary/toggle/hold, positions)
  │   ├── NEW: Control Pairing Protocol (paired controls, shared labels)
  │   ├── NEW: Nesting Protocol (jog display inside jog wheel)
  │   └── NEW: Type Accuracy Rules (ports ≠ buttons)
  │
  ├── Manifest Completeness Validator (NEW — mechanical, rules-based)
  │   ├── Check every control for required visual fields
  │   ├── Auto-fix obvious errors (label says "port" → type = "port")
  │   ├── Validate pairing symmetry, nesting validity
  │   └── Score ≥ 9.0 to pass, else retry Gatekeeper
  │
  └── Layout Engine (deterministic)
      ├── Generate CSS architecture per section
      └── NEW: Handle transport-pair archetype

Editor Session (replaces old Phases 1-3)
  ├── Load: enriched manifest → editor renders with correct components,
  │   colors, shapes, icons, LED indicators, group labels
  ├── Edit: contractor drags/resizes freely (absolute pixels)
  ├── Save: auto-saves to manifest-editor.json
  └── Approve & Build:
      ├── Layout Inference Engine: re-derives archetypes from final positions
      ├── Inference Review: contractor sees per-section results, can override
      ├── Codegen: generates clean flex/grid React components
      └── Validation: contractor reviews generated panel side-by-side

Codegen (updated)
  ├── Reads inferred archetype parameters (not raw pixel coords)
  ├── Generates flex/grid CSS (not absolute positioning)
  ├── Renders all new component types (Port, TouchDisplay, etc.)
  ├── Passes enriched fields to components (color, icon, LED props)
  ├── Renders group labels
  └── Handles nested controls (jog display inside jog wheel)
```

### Phase Architecture Decision

**The editor REPLACES pipeline phases 1-3.** The old phases (Phase 1: Section Loop with SI/PQ/Critic agents, Phase 2: Global Assembly, Phase 3: Harmonic Polish) were LLM-driven panel building. The editor + codegen replaces all of them.

Updated PHASE_ORDER:
```
pending → phase-preflight → phase-0-diagram-parser → phase-0-gatekeeper
→ phase-0-manifest-validator (NEW) → phase-0-layout-engine
→ editor-session (NEW — pauses for contractor)
→ phase-0-codegen (NEW — runs inference + codegen)
→ panel-pr → phase-4-extraction → phase-4-audit
→ phase-5-tutorial-build → tutorial-pr → completed
```

---

## Phase 1: Manifest Schema Expansion

### 1A. ManifestControl — Complete Type

```typescript
export interface ManifestControl {
  // ─── Identity (existing) ──────────────────────────────────────────
  id: string;
  verbatimLabel: string;
  type: 'button' | 'knob' | 'slider' | 'fader' | 'switch' | 'lever'
      | 'led' | 'screen' | 'encoder' | 'wheel' | 'pad'
      | 'port' | 'slot';
  section: string;
  functionalGroup: string;
  spatialNeighbors: {
    above: string | null;
    below: string | null;
    left: string | null;
    right: string | null;
  };

  // ─── Visual Appearance (NEW) ──────────────────────────────────────
  shape?: 'rectangle' | 'circle' | 'pill' | 'square';
  sizeClass?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  surfaceColor?: string | null;
  buttonStyle?: 'raised' | 'flat-key' | 'rubber' | 'transport';

  // ─── Label Rendering (NEW) ────────────────────────────────────────
  labelDisplay?: 'on-button' | 'above' | 'below' | 'left' | 'right'
               | 'icon-only' | 'hidden';
  icon?: string | null;
  primaryLabel?: string;
  secondaryLabel?: string | null;

  // ─── LED Properties (NEW) ─────────────────────────────────────────
  hasLed?: boolean;
  ledColor?: string | null;
  ledBehavior?: 'steady' | 'blink-on-activity' | 'dynamic-color';
  ledPosition?: 'above' | 'below' | 'inside' | 'ring';
  ledVariant?: 'dot' | 'dual-label' | 'bar';

  // ─── Interaction Model (NEW) ──────────────────────────────────────
  interactionType?: 'momentary' | 'toggle' | 'hold' | 'rotary' | 'slide';
  secondaryFunction?: string | null;
  positions?: number;
  positionLabels?: string[];
  encoderHasPush?: boolean;
  orientation?: 'vertical' | 'horizontal';

  // ─── Relationships (NEW) ──────────────────────────────────────────
  pairedWith?: string | null;
  sharedLabel?: string | null;
  groupId?: string | null;
  nestedIn?: string | null;
}
```

### 1B. LayoutArchetype — Add transport-pair

```typescript
export type LayoutArchetype =
  | 'grid-NxM'
  | 'single-column'
  | 'single-row'
  | 'anchor-layout'
  | 'cluster-above-anchor'
  | 'cluster-below-anchor'
  | 'dual-column'
  | 'stacked-rows'
  | 'transport-pair';
```

### 1C. MasterManifest — Device Dimensions + Group Labels

```typescript
export interface MasterManifest {
  // Existing fields...

  deviceDimensions?: {
    widthMm: number;
    depthMm: number;
  };

  groupLabels?: Array<{
    id: string;
    text: string;
    controlIds: string[];
    position: 'above' | 'below';
  }>;
}
```

### 1D. Shared Type Source

Create `src/types/manifest.ts` with the canonical ManifestControl and ManifestSection types. Both `scripts/layout-engine.ts` and `src/components/panel-editor/store/manifestSlice.ts` import from this shared source. Eliminates type drift between pipeline and editor.

---

## Phase 2: Pipeline Improvements

### 2A. Diagram Parser SOUL Update

Add to the Parser's extraction protocol:

- **Silkscreen Boundary Detection:** Look for printed lines/boxes on the panel surface. Controls inside a boundary box = one section.
- **Control Shape Detection:** Output `shape: 'circle' | 'rectangle' | 'square'` for each control based on visual analysis.
- **Relative Size Classification:** Output `sizeClass: 'xs' | 'sm' | 'md' | 'lg' | 'xl'` based on control area relative to median.
- **Transport-Pair Recognition:** If two large circular controls are in the bottom-left, flag as potential `transport-pair`.
- **Expanded typeHint vocabulary:** Add `port`, `slot`, `lever`, `fader` to the typeHint set.

### 2B. Gatekeeper SOUL Update

Add five extraction protocols:

1. **Visual Appearance Protocol** — shape, sizeClass, surfaceColor, buttonStyle for every control
2. **Label Rendering Protocol** — labelDisplay, icon, primaryLabel, secondaryLabel for every control
3. **LED Properties Protocol** — hasLed, ledColor, ledBehavior, ledPosition for controls with LEDs
4. **Interaction Model Protocol** — interactionType, secondaryFunction, positions, positionLabels, encoderHasPush
5. **Control Pairing Protocol** — pairedWith, sharedLabel, groupId, nestedIn

Add type accuracy rules:
- Physical ports/slots → type: 'port' or 'slot', NOT 'button'
- 3-position levers → type: 'lever' with positions: 3
- Encoders with push → encoderHasPush: true

### 2C. Manifest Completeness Validator (NEW phase)

Mechanical rules-based validator. Runs as `phase-0-manifest-validator` between Gatekeeper and Layout Engine.

Checks:
- Every control has: shape, sizeClass, labelDisplay set
- Every LED-type control has: ledColor set
- Every button has: buttonStyle set
- Every control with unicode arrows in label has: icon field set
- Paired controls are symmetric (A→B and B→A)
- Nested controls reference valid parent IDs
- Type accuracy: labels containing "port"/"slot"/"indicator" match their type
- Group labels reference valid control IDs

Auto-fixes:
- Label contains "port" + type is "button" → change to "port"
- Label contains "slot" + type is "button" → change to "slot"
- Label contains "indicator" + type is "button" → change to "led"
- Missing sizeClass → compute from parser bounding box area relative to median

Scoring: -0.5 per missing field, -1.0 per type error, -1.0 per broken pairing. ≥9.0 passes.

### 2D. Layout Engine Update

- Add `transport-pair` to the archetype switch in `generateTemplate`
- Accept `port` and `slot` in the ManifestControl.type union
- Pass through `deviceDimensions` in output

---

## Phase 3: New Control Components

### 3A. New Components to Build

| Component | File | Props | Visual |
|---|---|---|---|
| `Port` | `src/components/controls/Port.tsx` | `id, label, variant ('usb-a'\|'sd-card'\|'ethernet'\|'rca'), highlighted, width, height` | Dark recessed rectangle with port icon |
| `TouchDisplay` | `src/components/controls/TouchDisplay.tsx` | `id, label, variant ('main'\|'jog'), bezelWidth, showMockContent, highlighted, width, height` | Dark LCD with rounded bezel, optional waveform mockup |
| `JogDisplay` | `src/components/controls/JogDisplay.tsx` | `id, label, size, highlighted, showMockContent` | Circular LCD with dark fill |
| `DirectionSwitch` | `src/components/controls/DirectionSwitch.tsx` | `id, label, positions, positionLabels, currentPosition, ledColor, highlighted, width, height` | Flat horizontal rocker with LED dots |
| `LEDRing` | `src/components/controls/LEDRing.tsx` | `id, color, brightness, innerDiameter, outerDiameter, highlighted` | Annular LED strip |
| `JogWheelAssembly` | `src/components/controls/JogWheelAssembly.tsx` | `id, wheelSize, displaySize, ringColor, highlighted` | Composite: Wheel + JogDisplay (center) + LEDRing (outer). Single drag target. |

### 3B. PanelButton Variants

| Variant | Visual | Used for |
|---|---|---|
| `flat-key` | Low-profile key-cap style, less 3D gradient | Browse bar buttons |
| `transport` | Large, raised rubber, colored accent ring, icon display | CUE (orange), PLAY/PAUSE (green) |
| `rubber` | Small rubber toggle button | SLIP, QUANTIZE |

### 3C. Existing Component Updates

| Component | Change |
|---|---|
| `PanelButton` | Add `variant`, `surfaceColor`, `iconContent` props |
| `PadButton` | Add `color` prop for per-pad RGB colors |
| `Lever` | Add `positions`, `positionLabels`, `ledColor` props |
| `ValueDial` | Add `hasPush` prop |
| `Wheel` (jog) | Add `ringColor`, `ringOn` props |
| `LEDIndicator` | Add dynamic `color` prop support |

### 3D. Icon Library

Create `src/lib/hardware-icons.ts`:

```typescript
export const HARDWARE_ICONS: Record<string, string> = {
  'play': '▶',
  'pause': '❚❚',
  'play-pause': '▶/❚❚',
  'stop': '■',
  'record': '●',
  'fast-forward': '▶▶',
  'rewind': '◀◀',
  'skip-forward': '▶▶|',
  'skip-backward': '|◀◀',
  'arrow-left': '◀',
  'arrow-right': '▶',
  'eject': '⏏',
};
```

---

## Phase 4: Editor Updates

### 4A. Store Updates (`manifestSlice.ts`)

- Import types from shared `src/types/manifest.ts` (Phase 1D)
- Add all new fields to `ControlDef`
- Add `GroupLabelDef` type and `groupLabels` state
- Compute canvas dimensions from `deviceDimensions`:
  ```ts
  const aspectRatio = manifest.deviceDimensions
    ? manifest.deviceDimensions.widthMm / manifest.deviceDimensions.depthMm
    : CANVAS_BASE_W / CANVAS_BASE_H;
  ```
- Map `sizeClass` to pixel dimensions (replaces hardcoded DEFAULT_SIZES)
- Read `groupLabels` from manifest and position them on canvas

### 4B. ControlNode Rendering Updates

- Read `shape` → render circle vs rectangle buttons
- Read `surfaceColor` → apply as accent color
- Read `buttonStyle` → select PanelButton variant
- Read `labelDisplay` → `icon-only` renders icon large and centered, `hidden` renders no label
- Read `icon` → lookup in HARDWARE_ICONS, render at 16-20px
- Read `hasLed` + `ledColor` → show LED dot on buttons
- Read `ledVariant` → render dot vs dual-label
- Render `Port` for type `port`, `slot`
- Render `TouchDisplay` for type `screen` with variant `main`
- Render `JogWheelAssembly` when detecting wheel + nested display
- Render `DirectionSwitch` for type `lever` with positions > 2
- Handle `nestedIn` → render inside parent component

### 4C. GroupLabel Rendering

New `GroupLabelNode.tsx`:
- Draggable text element on canvas (uses Rnd)
- Auto-positioned above/below the controls it spans
- Text, fontSize, alignment from manifest groupLabels
- Rendered in SectionFrame alongside ControlNodes
- Shown in LayersPanel under each section

### 4D. Layout Inference Engine (Approve & Build)

Create `src/lib/layout-inference.ts`:

**Step 1 — Analyze positions per section:**
- Group controls by similar Y values (within 5px tolerance) → rows
- Group controls by similar X values → columns
- Detect grids (consistent row + column pattern)
- Compute gaps between adjacent controls
- Compute padding from section edges

**Step 2 — Re-derive archetype + parameters:**
- All controls similar Y → `single-row` with computed gap
- All controls similar X → `single-column` with computed gap
- Grid pattern → `grid-NxM` with cols/rows/gap
- Stacked horizontal groups → `stacked-rows` with row assignments
- Two large circles → `transport-pair`
- Fallback: absolute positioning

**Step 3 — Inference Review UI:**
```
┌─────────────────────────────────────────────┐
│ Layout Inference Results                     │
│                                              │
│ Hot Cue:      single-row, gap 12px    ✓  ✎  │
│ Loop:         grid 3x2, gap 8px       ✓  ✎  │
│ Transport:    stacked-rows, 6 rows    ✓  ✎  │
│ Beat Sync:    single-column, gap 4px  ✓  ✎  │
│ ...                                          │
│                                              │
│ [✎ = override archetype/params]              │
│                                              │
│         [Back to Editor]  [Generate]         │
└─────────────────────────────────────────────┘
```

Contractor confirms or overrides, then clicks Generate.

**Step 4 — Output:**
Write inferred parameters to `.pipeline/{deviceId}/inferred-layout.json`:
```json
{
  "sections": {
    "hot-cue": { "archetype": "single-row", "gap": 12, "padding": 8 },
    "loop": { "archetype": "grid-NxM", "gridCols": 3, "gap": 8 }
  }
}
```
Codegen reads this + manifest for component generation.

### 4E. Codegen Trigger

New API route: `POST /api/pipeline/{deviceId}/codegen`
- Runs `scripts/panel-codegen.ts` with the inferred layout
- Returns success/failure
- Called from the editor's "Generate" button after inference review

### 4F. Properties Panel Updates

New sections (read from manifest as defaults, contractor can override):

- **Visual:** Button style selector, surface color picker (preset palette)
- **LED:** Has LED toggle, LED color picker
- **Label:** Display mode (on-button/above/below/icon-only/hidden), icon selector from HARDWARE_ICONS
- **Read-only info:** Interaction type, secondary function, pairedWith, groupId (informational, not editable)

### 4G. Editor UX Constraints

- Properties panel shows manifest-derived values as defaults
- Contractor CAN override visual properties (in case pipeline got it wrong)
- Contractor CANNOT change: control type (except through override with confirmation)
- Overrides are saved alongside the manifest data so the pipeline can learn from corrections

---

## Phase 5: Codegen Updates

### 5A. CONTROL_MAP Expansion

Add to `panel-codegen.ts`:
```typescript
port:    { component: 'Port',           import: '@/components/controls/Port' },
slot:    { component: 'Port',           import: '@/components/controls/Port' },
lever:   { component: 'DirectionSwitch', import: '@/components/controls/DirectionSwitch' },
```

### 5B. Enriched Field Handling

Update `renderControl()` to pass enriched props:
- `shape` → PanelButton shape prop or circle rendering
- `surfaceColor` → accent color on buttons/pads
- `icon` + `labelDisplay: 'icon-only'` → render icon instead of text
- `buttonStyle` → PanelButton variant
- `hasLed` + `ledColor` → render LED indicator on buttons
- `ledVariant` → LED rendering variant

### 5C. Archetype Handling

- Add `transport-pair` case to `renderSectionBody`
- Read inferred layout parameters (gap, padding) for CSS generation
- Generate flex/grid CSS from archetype parameters, not absolute positioning

### 5D. Group Labels

Render `sharedLabel` text above/below paired control groups:
```tsx
<div className="text-[10px] text-gray-400 uppercase tracking-wider text-center">
  SEARCH
</div>
<div className="flex flex-row gap-2">
  <PanelButton id="search-bwd" icon="rewind" ... />
  <PanelButton id="search-fwd" icon="fast-forward" ... />
</div>
```

### 5E. Nested Controls

Handle `nestedIn` for jog display inside jog wheel:
- Detect wheel + nested display in the same section
- Generate `JogWheelAssembly` composite component
- Jog display renders inside the wheel, not as a sibling

### 5F. Screen/Display Components

Replace plain `<div>` for screen type with `TouchDisplay` component:
```typescript
screen:  { component: 'TouchDisplay', import: '@/components/controls/TouchDisplay' },
display: { component: 'TouchDisplay', import: '@/components/controls/TouchDisplay' },
```

---

## Phase 6: Pipeline Rerun & Verification

1. Update ManifestControl type (shared source)
2. Update Parser SOUL (silkscreen, shape, size, transport-pair, typeHints)
3. Update Gatekeeper SOUL (5 new protocols + type accuracy rules)
4. Build Manifest Completeness Validator + wire into pipeline
5. Update Layout Engine (transport-pair, port/slot types)
6. Build new components (Port, TouchDisplay, JogDisplay, DirectionSwitch, JogWheelAssembly, LEDRing)
7. Add PanelButton variants + update existing components
8. Build icon library
9. Update editor store (loadFromManifest, all new fields)
10. Update ControlNode (render new types + enriched fields)
11. Update PropertiesPanel (new sections)
12. Build GroupLabelNode
13. Build Layout Inference Engine
14. Wire inference into Approve & Build flow
15. Update codegen (new types, enriched fields, archetype parameters)
16. Build codegen API route
17. Update PHASE_ORDER (remove phases 1-3, add validator + editor + codegen phases)
18. Rerun CDJ-3000 pipeline
19. Open editor — verify ~80% fidelity before contractor
20. Contractor positioning pass
21. Approve & Build → inference → review → codegen
22. Verify generated panel in tutorial system

---

## Implementation Order (Parallelizable)

```
Stream A (Pipeline):          Stream B (Components):      Stream C (Editor):
1. Shared types               4. Port component           11. Store updates
2. Parser SOUL update         5. TouchDisplay              12. ControlNode updates
3. Gatekeeper SOUL update     6. JogDisplay                13. PropertiesPanel updates
   ↓                          7. DirectionSwitch           14. GroupLabelNode
Manifest Validator             8. JogWheelAssembly              ↓
   ↓                          9. PanelButton variants      15. Layout Inference Engine
Layout Engine update          10. Icon library              16. Approve & Build flow
   ↓                              ↓                        17. Codegen updates
Pipeline rerun ←──────────── All components ready ──────→ 18. Codegen API route
   ↓                                                           ↓
                        19. End-to-end verification
```

Streams A, B, C can run in parallel. They converge at step 19.

---

## Success Criteria

**After pipeline runs (before contractor):**
- All controls render with correct component type (no buttons for ports)
- All controls have correct shape, color, style from manifest
- Transport buttons show icons with colored accent rings
- Paired controls share group labels
- Jog display renders inside jog wheel
- LEDs show correct colors
- Canvas aspect ratio matches device dimensions
- Archetypes are topologically correct

**After contractor pass:**
- All controls positioned accurately against photo reference
- Spacing and sizing match hardware proportions
- No archetype changes needed (topology correct from pipeline)

**After inference + codegen:**
- Layout inference correctly identifies archetypes from contractor positions
- Contractor confirms inference results (with option to override)
- Generated panel uses clean flex/grid CSS (not absolute positioning)
- Generated panel looks production-grade
- All enriched fields pass through to component props

**What the contractor NEVER decides:**
- Button colors, shapes, or styles
- LED colors or behaviors
- Icon vs text display
- Which controls are paired
- What archetype a section uses
- How the jog wheel assembly is composed
- Interaction types (momentary/toggle/hold)

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| Gatekeeper hallucinating visual details | Manifest Completeness Validator catches missing/wrong fields. Defaults for common patterns. |
| Layout inference getting archetypes wrong | Contractor review step with per-section override before codegen |
| Archetype drift (contractor breaks layout) | Inference always re-derives archetypes. Free-form editing doesn't corrupt structural data. |
| Parser missing silkscreen boundaries | Validator checks section topology. Contractor can reassign controls between sections. |
| Enriched manifest too large/complex | All new fields are optional. Existing manifests still work (missing fields = defaults). |
| Codegen can't handle all enriched fields | Fallback rendering for unknown values. New fields enhance, never break. |

---

## Branch

Work on: `feature/pipeline-architecture-upgrade` (targets `test`)
