# Shared Style System — PanelShell + Enriched Controls

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Every pipeline-generated instrument panel automatically looks as polished as the hand-built Fantom-08 — same dark metallic aesthetic, same visual depth, same premium feel — without touching any Fantom-08 code.

**Architecture:** Extract panel chrome (background, texture, bezel, branding) into a reusable `<PanelShell>` component. Extract section backgrounds into `<SectionContainer>`. Enrich `<TouchDisplay>` with scanline/glow effects from Fantom-08's `DisplayScreen.tsx`. Simplify codegen to compose these components instead of hardcoding CSS in template literals.

**Tech Stack:** React, Framer Motion, Tailwind CSS, inline styles (matching existing control component patterns)

---

## Context

### Current State
- **15 shared control components** in `src/components/controls/` — already have rich gradients, shadows, LED glow, highlight animations. These are mature and need minimal changes.
- **Codegen** (`scripts/panel-codegen.ts`, 1707 lines) generates production React TSX. It currently hardcodes panel chrome (background, bezel, branding, texture, section backgrounds) as inline CSS in template literal strings (lines 1217-1268 for flat panel, lines 1334+ for section-based).
- **Fantom-08** hand-built in `src/components/devices/fantom-08/` — has premium visual treatments (vertical grain texture, scanline displays, section inset shadows) that shared components lack.
- **Editor** uses the same shared control components as codegen — changes to shared components benefit both.

### What Fantom-08 Has That Shared Components Don't
1. **Panel shell**: vertical grain texture (`repeating-linear-gradient(90deg, ...)`), radial light source, multi-layer box shadow, top bezel highlight, branding bar
2. **Section containers**: `rgba(0,0,0,0.12)` backgrounds, `inset 0 1px 3px` shadows, rounded corners, fade-in animations
3. **Display scanlines**: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)` overlay
4. **Display glow**: `radial-gradient(ellipse at center, rgba(40, 80, 140, 0.08) 0%, transparent 70%)`
5. **LCD bezel**: `inset 0 0 8px 2px rgba(0,0,0,0.6), inset 0 2px 4px rgba(0,0,0,0.4)`

### Design Principle
Codegen should generate **component composition with props**, not CSS. The visual quality lives in the component library. Codegen says WHAT goes WHERE — components know HOW to look.

### Constraints
- **DO NOT modify any Fantom-08 files** — `src/components/devices/fantom-08/` is untouched
- **DO NOT change control component prop interfaces** — existing codegen output must still compile
- **DO NOT change positioning logic** — still percentage-based absolute positioning from editor
- All styling matches existing patterns: inline `style={{}}` objects + Tailwind for layout

---

## Task 1: Create `<PanelShell>` Component

**Files:**
- Create: `src/components/controls/PanelShell.tsx`
- Test: `src/components/controls/__tests__/PanelShell.test.tsx`

**What it does:** Wraps every generated panel. Provides the premium dark metallic housing — background texture, bezel highlight, branding bar, multi-layer shadow. Every pipeline instrument gets this for free.

**Step 1: Write the failing test**

```tsx
// src/components/controls/__tests__/PanelShell.test.tsx
import { render, screen } from '@testing-library/react';
import PanelShell from '../PanelShell';

describe('PanelShell', () => {
  it('renders children inside the shell', () => {
    render(
      <PanelShell manufacturer="Pioneer DJ" deviceName="CDJ-3000" width={1200} height={1470}>
        <div data-testid="child">Hello</div>
      </PanelShell>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders manufacturer and device name', () => {
    render(
      <PanelShell manufacturer="Roland" deviceName="FANTOM-06" width={1200} height={361}>
        <div />
      </PanelShell>
    );
    expect(screen.getByText('Roland')).toBeInTheDocument();
    expect(screen.getByText('FANTOM-06')).toBeInTheDocument();
  });

  it('applies width and height to the container', () => {
    const { container } = render(
      <PanelShell manufacturer="Test" deviceName="Test" width={800} height={600}>
        <div />
      </PanelShell>
    );
    const shell = container.firstChild?.firstChild as HTMLElement;
    expect(shell.style.width).toBe('800px');
    expect(shell.style.height).toBe('600px');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest src/components/controls/__tests__/PanelShell.test.tsx`
Expected: FAIL — module not found

**Step 3: Write the component**

```tsx
// src/components/controls/PanelShell.tsx
'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PanelShellProps {
  manufacturer: string;
  deviceName: string;
  width: number;
  height: number;
  children: ReactNode;
}

export default function PanelShell({
  manufacturer,
  deviceName,
  width,
  height,
  children,
}: PanelShellProps) {
  return (
    <div className="w-full h-full overflow-x-auto">
      <motion.div
        className="relative rounded-2xl overflow-hidden select-none"
        style={{
          width,
          minWidth: width,
          height,
          backgroundColor: '#1a1a1a',
          boxShadow:
            '0 0 0 1px rgba(80,80,80,0.3), 0 8px 32px rgba(0,0,0,0.6), 0 2px 0 0 rgba(255,255,255,0.04) inset, 0 -2px 0 0 rgba(0,0,0,0.4) inset',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Vertical grain texture + radial light source */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: [
              'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 3px)',
              'radial-gradient(ellipse at 30% 20%, rgba(60,60,60,0.12) 0%, transparent 60%)',
            ].join(', '),
          }}
        />

        {/* Top bezel accent */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none z-30"
          style={{
            background:
              'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 70%, transparent 95%)',
          }}
        />

        {/* Branding bar */}
        <div className="absolute top-1 left-4 z-30 pointer-events-none flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase"
            style={{ color: '#737373', letterSpacing: '0.35em', fontFamily: 'system-ui, sans-serif' }}
          >
            {manufacturer}
          </span>
          <span
            className="text-[9px] font-medium uppercase"
            style={{ color: '#525252', letterSpacing: '0.2em', fontFamily: 'system-ui, sans-serif' }}
          >
            {deviceName}
          </span>
        </div>

        {/* Panel content (sections + controls) */}
        {children}
      </motion.div>
    </div>
  );
}
```

Note: This adds the **vertical grain texture** (`repeating-linear-gradient`) that the current codegen is missing — Fantom-08 has it but codegen doesn't. Now every instrument gets it.

**Step 4: Run test to verify it passes**

Run: `npx jest src/components/controls/__tests__/PanelShell.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/controls/PanelShell.tsx src/components/controls/__tests__/PanelShell.test.tsx
git commit -m "feat: add PanelShell shared component — panel chrome wrapper"
```

---

## Task 2: Create `<SectionContainer>` Component

**Files:**
- Create: `src/components/controls/SectionContainer.tsx`
- Test: `src/components/controls/__tests__/SectionContainer.test.tsx`

**What it does:** Wraps each section's controls with the dark semi-transparent background, inset shadow, and optional fade-in animation that Fantom-08 sections have.

**Step 1: Write the failing test**

```tsx
// src/components/controls/__tests__/SectionContainer.test.tsx
import { render, screen } from '@testing-library/react';
import SectionContainer from '../SectionContainer';

describe('SectionContainer', () => {
  it('renders children', () => {
    render(
      <SectionContainer id="browse" x={5} y={10} w={30} h={20}>
        <div data-testid="child">Content</div>
      </SectionContainer>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('positions absolutely with percentage values', () => {
    const { container } = render(
      <SectionContainer id="tempo" x={60} y={40} w={35} h={50}>
        <div />
      </SectionContainer>
    );
    const section = container.firstChild as HTMLElement;
    expect(section.style.left).toBe('60%');
    expect(section.style.top).toBe('40%');
    expect(section.style.width).toBe('35%');
    expect(section.style.height).toBe('50%');
  });

  it('renders header label when provided', () => {
    render(
      <SectionContainer id="fx" x={0} y={0} w={100} h={100} headerLabel="EFFECTS">
        <div />
      </SectionContainer>
    );
    expect(screen.getByText('EFFECTS')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest src/components/controls/__tests__/SectionContainer.test.tsx`
Expected: FAIL — module not found

**Step 3: Write the component**

```tsx
// src/components/controls/SectionContainer.tsx
'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SectionContainerProps {
  id: string;
  x: number;      // % of panel width
  y: number;      // % of panel height
  w: number;      // % of panel width
  h: number;      // % of panel height
  headerLabel?: string;
  children: ReactNode;
}

export default function SectionContainer({
  id,
  x,
  y,
  w,
  h,
  headerLabel,
  children,
}: SectionContainerProps) {
  return (
    <motion.div
      className="absolute rounded-lg"
      data-section-id={id}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${w}%`,
        height: `${h}%`,
        backgroundColor: 'rgba(0,0,0,0.12)',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {headerLabel && (
        <div
          className="absolute -top-4 left-2 pointer-events-none"
          style={{ zIndex: 30 }}
        >
          <span
            className="text-[8px] font-medium uppercase"
            style={{ color: '#666', letterSpacing: '0.15em' }}
          >
            {headerLabel}
          </span>
        </div>
      )}
      {children}
    </motion.div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest src/components/controls/__tests__/SectionContainer.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/controls/SectionContainer.tsx src/components/controls/__tests__/SectionContainer.test.tsx
git commit -m "feat: add SectionContainer — section background wrapper with inset shadow"
```

---

## Task 3: Enrich `<TouchDisplay>` with Scanline + Glow Effects

**Files:**
- Modify: `src/components/controls/TouchDisplay.tsx`
- Test: `src/components/controls/__tests__/TouchDisplay.test.tsx` (create if missing)

**What it does:** Adds the LCD bezel inset shadow, horizontal scanline overlay, and screen glow that Fantom-08's `DisplayScreen.tsx` has. These are visual-only overlays — no functional changes.

**Step 1: Write the failing test**

```tsx
// src/components/controls/__tests__/TouchDisplay.test.tsx
import { render } from '@testing-library/react';
import TouchDisplay from '../TouchDisplay';

describe('TouchDisplay', () => {
  it('renders scanline overlay', () => {
    const { container } = render(<TouchDisplay id="main-screen" />);
    const scanline = container.querySelector('[data-layer="scanlines"]');
    expect(scanline).toBeInTheDocument();
  });

  it('renders screen glow overlay', () => {
    const { container } = render(<TouchDisplay id="main-screen" />);
    const glow = container.querySelector('[data-layer="glow"]');
    expect(glow).toBeInTheDocument();
  });

  it('renders bezel with inset shadow', () => {
    const { container } = render(<TouchDisplay id="main-screen" />);
    const bezel = container.querySelector('[data-layer="bezel"]');
    expect(bezel).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest src/components/controls/__tests__/TouchDisplay.test.tsx`
Expected: FAIL — data-layer attributes not found

**Step 3: Modify TouchDisplay.tsx**

Add three visual overlays inside the inner screen area div (after the mock content SVG, before closing `</div>`):

```tsx
{/* LCD bezel inset shadow */}
<div
  data-layer="bezel"
  className="absolute inset-0 rounded-sm pointer-events-none"
  style={{
    boxShadow: 'inset 0 0 8px 2px rgba(0,0,0,0.6), inset 0 2px 4px rgba(0,0,0,0.4)',
  }}
/>

{/* Scanline overlay — CRT horizontal lines */}
<div
  data-layer="scanlines"
  className="absolute inset-0 pointer-events-none"
  style={{
    backgroundImage:
      'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
  }}
/>

{/* Screen glow — subtle blue vignette */}
<div
  data-layer="glow"
  className="absolute inset-0 pointer-events-none"
  style={{
    backgroundImage:
      'radial-gradient(ellipse at center, rgba(40, 80, 140, 0.08) 0%, transparent 70%)',
  }}
/>
```

Also update the inner screen background from `#0a0a14` to `#0a1a2a` (Fantom-08's display color — slightly bluer, more screen-like).

Also update the outer bezel border from `#333` to `#2a4a6a` to match Fantom-08's display border color.

**Step 4: Run test to verify it passes**

Run: `npx jest src/components/controls/__tests__/TouchDisplay.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/controls/TouchDisplay.tsx src/components/controls/__tests__/TouchDisplay.test.tsx
git commit -m "feat: enrich TouchDisplay with scanlines, screen glow, LCD bezel"
```

---

## Task 4: Update Codegen to Use `<PanelShell>`

**Files:**
- Modify: `scripts/panel-codegen.ts` (lines ~1095-1270 for flat panel, ~1334-1430 for section-based)

**What it does:** Replace hardcoded panel chrome template literals with `<PanelShell>` import and usage. Codegen gets simpler — the visual quality now lives in the component.

**Step 1: Identify the changes**

In `generateFlatPanel()` (line 1082):
- Add `PanelShell` to the import block
- Replace the `<motion.div>` with texture/bezel/branding divs with `<PanelShell>`
- Remove: texture overlay div, bezel accent div, branding bar div (these now live in PanelShell)
- Keep: section backgrounds and control renderings as children of PanelShell

In `generateSectionBasedPanel()` (line 1275):
- Same changes — replace `<motion.div>` chrome with `<PanelShell>`

**Step 2: Make the changes**

The flat panel return should become:

```tsx
return (
  <PanelShell
    manufacturer={${constPrefix}_PANEL.manufacturer}
    deviceName={${constPrefix}_PANEL.deviceName}
    width={${constPrefix}_PANEL.width}
    height={${constPrefix}_PANEL.height}
  >
    {/* Section backgrounds — decorative only */}
    ${sectionBackgrounds}

    {/* All controls — panel-level percentage positioning */}
    ${controlRenderings}

    {/* Group labels */}
    ${groupLabelRenderings}
  </PanelShell>
);
```

Add to the import generation:
```ts
imports.set('PanelShell', '@/components/controls/PanelShell');
```

**Step 3: Verify codegen still produces valid TSX**

Run: `npx tsx scripts/panel-codegen.ts cdj-3000 --dry-run`
Expected: output without errors, TSX imports PanelShell

**Step 4: Commit**

```bash
git add scripts/panel-codegen.ts
git commit -m "refactor: codegen uses PanelShell instead of hardcoded panel chrome"
```

---

## Task 5: Update Codegen Section Backgrounds to Use `<SectionContainer>`

**Files:**
- Modify: `scripts/panel-codegen.ts`

**What it does:** Replace hardcoded section background divs with `<SectionContainer>` component usage. Section backgrounds get the inset shadow, rounded corners, and fade-in animation.

**Step 1: Identify the changes**

In `generateFlatPanel()` — the `sectionBackgrounds` builder (lines ~1100-1120):
- Currently generates raw `<div>` elements with inline `backgroundColor` and `boxShadow`
- Replace with `<SectionContainer>` elements that accept the same positioning props

In `generateSectionBasedPanel()` — the section wrapper divs (lines ~1296-1322):
- Currently wraps sections in `<div>` with inline styles
- Replace with `<SectionContainer>`

**Step 2: Make the changes**

For flat panel, section backgrounds become:
```tsx
<SectionContainer
  id="${s.id}"
  x={${bb.x}}
  y={${bb.y}}
  w={${bb.w}}
  h={${bb.h}}
  headerLabel="${s.headerLabel ?? ''}"
/>
```

For section-based, the wrapper becomes:
```tsx
<SectionContainer
  id="${s.id}"
  x={${bb.x}}
  y={${bb.y}}
  w={${bb.w}}
  h={${bb.h}}
  headerLabel="${s.headerLabel ?? ''}"
>
  <${pascal}Section ... />
</SectionContainer>
```

Add to imports:
```ts
imports.set('SectionContainer', '@/components/controls/SectionContainer');
```

**Step 3: Verify codegen still produces valid TSX**

Run: `npx tsx scripts/panel-codegen.ts cdj-3000 --dry-run`
Expected: output without errors, TSX imports SectionContainer

**Step 4: Commit**

```bash
git add scripts/panel-codegen.ts
git commit -m "refactor: codegen uses SectionContainer instead of hardcoded section divs"
```

---

## Task 6: Visual Verification

**Files:** None modified — verification only

**What it does:** Verify the generated panels look correct by running codegen and checking the output visually.

**Step 1: Run codegen for CDJ-3000**

```bash
npx tsx scripts/panel-codegen.ts cdj-3000
```

Verify the generated file at `src/components/devices/cdj-3000/CDJ3000Panel.tsx`:
- Imports `PanelShell` and `SectionContainer`
- No hardcoded panel chrome (no backgroundColor: '#1a1a1a', no bezel divs)
- Controls still positioned correctly with editorPosition percentages

**Step 2: Start dev server and check visually**

```bash
npm run dev
```

Open browser to the CDJ-3000 panel. Verify:
- Dark metallic background with grain texture
- Top bezel highlight visible
- Branding bar shows "PIONEER DJ" + "CDJ-3000"
- Section backgrounds have subtle inset shadow + rounded corners
- Display screens have scanlines and blue glow
- All controls render at correct positions

**Step 3: Verify Fantom-08 is untouched**

```bash
git diff src/components/devices/fantom-08/
```

Expected: no changes

**Step 4: Run all existing tests**

```bash
npx jest --passWithNoTests
```

Expected: all pass, no regressions

**Step 5: Commit if any cleanup needed**

```bash
git commit -m "fix: visual verification cleanup"
```

---

## Dependency Order

```
Task 1 (PanelShell) ─────────────┐
                                  ├─→ Task 4 (Codegen uses PanelShell)
Task 2 (SectionContainer) ───────┤
                                  ├─→ Task 5 (Codegen uses SectionContainer)
Task 3 (TouchDisplay enrichment) ─┘
                                  └─→ Task 6 (Visual verification)
```

Tasks 1, 2, 3 are independent — can run in parallel.
Tasks 4, 5 depend on 1, 2 respectively.
Task 6 depends on all others.
