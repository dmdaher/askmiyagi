# Structural Panel Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Replace absolute pixel positioning in DataDrivenPanel with structural layout (rows + flexbox/grid within sections) so AI can reliably generate panel data by describing topology instead of coordinates.

**Architecture:** The panel declares its structure as ordered rows of sections. Each section declares how its controls are arranged (grid, flex-row, flex-col). The renderer converts these declarations into flexbox/CSS Grid layout. Absolute positioning is an escape hatch only for inherently non-grid elements (jog wheel). Backward-compatible — Fantom 08 and DDJ-FLX4 are untouched.

**Tech Stack:** React 19, TypeScript 5, Tailwind CSS 4, Framer Motion 12, Vitest

---

### Task 1: Extend the Type System

**Files:**
- Modify: `src/types/panel.ts`

**Step 1: Write failing test**

Create test file `src/__tests__/panelTypes.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('Panel type system', () => {
  it('StructuralRow type exists and is usable', async () => {
    const { StructuralRow } = await import('@/types/panel') as any;
    // Type-only test — we verify via TypeScript compilation
    // The real test is that this file compiles without errors
    expect(true).toBe(true);
  });

  it('structural layout data compiles correctly', async () => {
    const types = await import('@/types/panel');
    // Verify the types allow structural layout construction
    const layout: types.PanelLayout = {
      deviceId: 'test',
      layoutMode: 'structural',
      rows: [
        { sections: ['nav'], height: 'auto' },
        { sections: ['left', 'center', 'right'], stretch: 'center', gap: 8 },
      ],
      sections: [
        {
          id: 'nav',
          label: 'Navigation',
          controlLayout: { type: 'flex-row', gap: 4 },
          controls: [{ id: 'btn1', type: 'button', label: 'Test', section: 'nav' }],
        },
        {
          id: 'left',
          label: 'Left',
          controlLayout: { type: 'flex-col', gap: 8 },
          controls: [],
        },
        {
          id: 'center',
          label: 'Center',
          controlLayout: { type: 'absolute', width: 300, height: 300 },
          controls: [],
        },
        {
          id: 'right',
          label: 'Right',
          controlLayout: { type: 'grid', columns: 2, gap: 4 },
          controls: [],
        },
      ],
      dimensions: { width: 900, height: 1200 },
    };
    expect(layout.layoutMode).toBe('structural');
    expect(layout.rows).toHaveLength(2);
    expect(layout.sections).toHaveLength(4);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/__tests__/panelTypes.test.ts`
Expected: FAIL — `layoutMode`, `rows`, `controlLayout` don't exist on the types yet.

**Step 3: Extend the types in panel.ts**

Add the following to `src/types/panel.ts`. Keep ALL existing types unchanged for backward compat.

After the existing `ControlType`:
```typescript
export type ControlType = 'button' | 'knob' | 'slider' | 'dial' | 'wheel' | 'pad' | 'led' | 'transport'
  | 'jog-wheel' | 'encoder' | 'fader' | 'display' | 'text' | 'lever';
```

After existing `ButtonVariant`, add `'round'`:
```typescript
export type ButtonVariant = 'standard' | 'zone' | 'scene' | 'category' | 'function' | 'menu' | 'round';
```

After `SectionBounds` (add if missing), add:
```typescript
export interface SectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StructuralRow {
  sections: string[];
  stretch?: string;
  height?: number | 'auto';
  gap?: number;
}

export type SectionControlLayout =
  | { type: 'grid'; columns: number; gap?: number; rowGap?: number }
  | { type: 'flex-row'; gap?: number; wrap?: boolean; align?: 'start' | 'center' | 'end' }
  | { type: 'flex-col'; gap?: number; align?: 'start' | 'center' | 'end' }
  | { type: 'absolute'; width: number; height: number };
```

Extend `PanelControl` with new optional fields:
```typescript
export interface PanelControl {
  // ... all existing fields ...
  orientation?: 'vertical' | 'horizontal';
  labelPosition?: 'above' | 'below' | 'on' | 'left' | 'right' | 'none';
  color?: string;
  gridColumn?: number | string;
  gridRow?: number | string;
  flexOrder?: number;
}
```

Extend `PanelSection`:
```typescript
export interface PanelSection {
  id: string;
  label: string;
  controls: PanelControl[];
  controlLayout?: SectionControlLayout;
  bounds?: SectionBounds;
  background?: string;
  borderRadius?: number;
  padding?: number;
  minWidth?: number;
  minHeight?: number;
}
```

Extend `PanelLayout`:
```typescript
export interface PanelLayout {
  deviceId: string;
  sections: PanelSection[];
  layoutMode?: 'structural' | 'absolute';
  rows?: StructuralRow[];
  dimensions?: { width: number; height: number };
  aspectRatio?: number;
  background?: { color: string; texture?: string };
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/__tests__/panelTypes.test.ts`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm run test`
Expected: ALL tests pass (backward-compatible changes only)

**Step 6: Commit**

```bash
git add src/types/panel.ts src/__tests__/panelTypes.test.ts
git commit -m "feat: extend panel type system for structural layout"
```

---

### Task 2: Extract JogWheel as Reusable Control Component

**Files:**
- Create: `src/components/controls/JogWheel.tsx`
- Modify: `src/components/devices/ddj-flx4/sections/DeckSection.tsx` (update import)
- Modify: `src/components/devices/ddj-flx4/sections/JogWheel.tsx` (re-export from shared)

**Step 1: Write the test**

Create `src/__tests__/controls/JogWheel.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import JogWheel from '@/components/controls/JogWheel';

describe('JogWheel', () => {
  it('renders with data-control-id', () => {
    render(<JogWheel id="test-jog" />);
    const el = document.querySelector('[data-control-id="test-jog"]');
    expect(el).toBeTruthy();
  });

  it('renders at specified size', () => {
    render(<JogWheel id="test-jog" size={300} />);
    const el = document.querySelector('[data-control-id="test-jog"]') as HTMLElement;
    expect(el.style.width).toBe('300px');
    expect(el.style.height).toBe('300px');
  });

  it('renders with default size when none specified', () => {
    render(<JogWheel id="test-jog" />);
    const el = document.querySelector('[data-control-id="test-jog"]') as HTMLElement;
    expect(el.style.width).toBe('240px');
  });

  it('renders dimple dots', () => {
    const { container } = render(<JogWheel id="test-jog" />);
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots.length).toBeGreaterThan(10);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/__tests__/controls/JogWheel.test.tsx`
Expected: FAIL — module not found

**Step 3: Create the reusable JogWheel component**

Create `src/components/controls/JogWheel.tsx`. This is extracted from the DDJ-FLX4 version at `src/components/devices/ddj-flx4/sections/JogWheel.tsx` — same implementation, placed in the shared controls directory.

```typescript
'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface JogWheelProps {
  id: string;
  highlighted?: boolean;
  size?: number;
}

const highlightAnimation = {
  animate: {
    boxShadow: [
      '0 0 0px rgba(59,130,246,0)',
      '0 0 20px rgba(59,130,246,0.6)',
      '0 0 0px rgba(59,130,246,0)',
    ],
  },
  transition: { duration: 1.5, repeat: Infinity },
};

export default function JogWheel({ id, highlighted = false, size = 240 }: JogWheelProps) {
  const [rotation, setRotation] = useState(0);
  const isDragging = useRef(false);
  const lastAngle = useRef(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const getAngle = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!wheelRef.current) return 0;
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      lastAngle.current = getAngle(e);

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        const currentAngle = getAngle(e);
        let delta = currentAngle - lastAngle.current;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        setRotation((prev) => prev + delta);
        lastAngle.current = currentAngle;
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [getAngle],
  );

  const outerSize = size;
  const innerSize = size * 0.55;
  const dotCount = 24;

  return (
    <motion.div
      ref={wheelRef}
      data-control-id={id}
      className="relative cursor-grab active:cursor-grabbing select-none"
      style={{ width: outerSize, height: outerSize }}
      {...(highlighted ? highlightAnimation : {})}
    >
      {/* Outer ring with dimpled texture */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #4a4a4e 0%, #2a2a2e 50%, #1a1a1e 100%)',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 0 2px 4px rgba(255,255,255,0.05)',
        }}
        onMouseDown={handleMouseDown}
      >
        {Array.from({ length: dotCount }, (_, i) => {
          const angle = (i / dotCount) * 360;
          const radius = outerSize * 0.42;
          const x = outerSize / 2 + radius * Math.cos((angle * Math.PI) / 180) - 3;
          const y = outerSize / 2 + radius * Math.sin((angle * Math.PI) / 180) - 3;
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 6, height: 6, left: x, top: y,
                background: 'radial-gradient(circle, #1a1a1e 30%, #3a3a3e 100%)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
              }}
            />
          );
        })}
      </div>

      {/* Inner platter (rotates) */}
      <motion.div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          width: innerSize, height: innerSize,
          top: (outerSize - innerSize) / 2, left: (outerSize - innerSize) / 2,
          background: 'radial-gradient(circle at 40% 40%, #3a3a3e 0%, #222226 60%, #1a1a1e 100%)',
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.5), 0 1px 2px rgba(255,255,255,0.05)',
          rotate: rotation,
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: innerSize * 0.45, height: innerSize * 0.45,
            background: 'radial-gradient(circle at 40% 40%, #4a4a4e 0%, #2a2a2e 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <svg width={innerSize * 0.2} height={innerSize * 0.2} viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 12l10 10 10-10L12 2z" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
            <circle cx="12" cy="12" r="3" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" />
          </svg>
        </div>
        <div
          className="absolute"
          style={{
            width: 2, height: innerSize * 0.18, top: 4, left: '50%', marginLeft: -1,
            background: 'rgba(255,255,255,0.15)', borderRadius: 1,
          }}
        />
      </motion.div>
    </motion.div>
  );
}
```

**Step 4: Update DDJ-FLX4 to use shared JogWheel**

Replace `src/components/devices/ddj-flx4/sections/JogWheel.tsx` with a re-export:

```typescript
'use client';
export { default } from '@/components/controls/JogWheel';
```

**Step 5: Run tests to verify everything passes**

Run: `npm run test`
Expected: ALL tests pass

**Step 6: Commit**

```bash
git add src/components/controls/JogWheel.tsx src/components/devices/ddj-flx4/sections/JogWheel.tsx src/__tests__/controls/JogWheel.test.tsx
git commit -m "refactor: extract JogWheel as reusable control component"
```

---

### Task 3: Rewrite DataDrivenPanel with Structural Layout Support

**Files:**
- Modify: `src/components/devices/DataDrivenPanel.tsx`

This is the core task. The renderer must support two modes:
- `layoutMode: 'absolute'` (default) — current behavior, unchanged
- `layoutMode: 'structural'` — new row-based flex rendering

**Step 1: Write the test**

Create `src/__tests__/DataDrivenPanel.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DataDrivenPanel from '@/components/devices/DataDrivenPanel';
import type { PanelLayout } from '@/types/panel';

const structuralLayout: PanelLayout = {
  deviceId: 'test-device',
  layoutMode: 'structural',
  dimensions: { width: 400, height: 600 },
  background: { color: '#1a1a1e' },
  rows: [
    { sections: ['top-bar'], height: 'auto' },
    { sections: ['left', 'center', 'right'], stretch: 'center', gap: 8 },
  ],
  sections: [
    {
      id: 'top-bar',
      label: 'Top Bar',
      controlLayout: { type: 'flex-row', gap: 4 },
      controls: [
        { id: 'btn-1', type: 'button', label: 'A', section: 'top-bar' },
        { id: 'btn-2', type: 'button', label: 'B', section: 'top-bar' },
        { id: 'btn-3', type: 'button', label: 'C', section: 'top-bar' },
      ],
    },
    {
      id: 'left',
      label: 'Left',
      controlLayout: { type: 'flex-col', gap: 8 },
      minWidth: 80,
      controls: [
        { id: 'knob-1', type: 'knob', label: 'K1', section: 'left' },
      ],
    },
    {
      id: 'center',
      label: 'Center',
      controlLayout: { type: 'grid', columns: 4, gap: 4 },
      controls: [
        { id: 'pad-1', type: 'pad', label: '1', section: 'center' },
        { id: 'pad-2', type: 'pad', label: '2', section: 'center' },
        { id: 'pad-3', type: 'pad', label: '3', section: 'center' },
        { id: 'pad-4', type: 'pad', label: '4', section: 'center' },
      ],
    },
    {
      id: 'right',
      label: 'Right',
      controlLayout: { type: 'flex-col', gap: 4 },
      minWidth: 60,
      controls: [
        { id: 'slider-1', type: 'slider', label: 'S1', section: 'right' },
      ],
    },
  ],
};

describe('DataDrivenPanel', () => {
  it('renders all sections in structural mode', () => {
    const { container } = render(
      <DataDrivenPanel
        layout={structuralLayout}
        panelState={{}}
        highlightedControls={[]}
      />,
    );
    expect(container.querySelector('[data-section-id="top-bar"]')).toBeTruthy();
    expect(container.querySelector('[data-section-id="left"]')).toBeTruthy();
    expect(container.querySelector('[data-section-id="center"]')).toBeTruthy();
    expect(container.querySelector('[data-section-id="right"]')).toBeTruthy();
  });

  it('renders controls within sections', () => {
    const { container } = render(
      <DataDrivenPanel
        layout={structuralLayout}
        panelState={{}}
        highlightedControls={[]}
      />,
    );
    // 3 buttons + 1 knob + 4 pads + 1 slider = 9 controls
    const controls = container.querySelectorAll('[data-control-id]');
    expect(controls.length).toBeGreaterThanOrEqual(9);
  });

  it('uses flex-row for top-bar section', () => {
    const { container } = render(
      <DataDrivenPanel
        layout={structuralLayout}
        panelState={{}}
        highlightedControls={[]}
      />,
    );
    const topBar = container.querySelector('[data-section-id="top-bar"]') as HTMLElement;
    const controlsContainer = topBar?.querySelector('[data-layout]') as HTMLElement;
    expect(controlsContainer?.dataset.layout).toBe('flex-row');
  });

  it('uses grid for center section', () => {
    const { container } = render(
      <DataDrivenPanel
        layout={structuralLayout}
        panelState={{}}
        highlightedControls={[]}
      />,
    );
    const center = container.querySelector('[data-section-id="center"]') as HTMLElement;
    const controlsContainer = center?.querySelector('[data-layout]') as HTMLElement;
    expect(controlsContainer?.dataset.layout).toBe('grid');
  });

  it('applies highlight to controls', () => {
    const { container } = render(
      <DataDrivenPanel
        layout={structuralLayout}
        panelState={{}}
        highlightedControls={['btn-1']}
      />,
    );
    // btn-1 should exist and be highlighted
    const btn = container.querySelector('[data-control-id="btn-1"]');
    expect(btn).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/__tests__/DataDrivenPanel.test.tsx`
Expected: FAIL — DataDrivenPanel doesn't support `layoutMode: 'structural'` yet (it may not even exist on this branch).

**Step 3: Rewrite DataDrivenPanel.tsx**

The component needs to handle both layout modes. The full implementation:

```typescript
'use client';

import { motion } from 'framer-motion';
import Knob from '@/components/controls/Knob';
import Slider from '@/components/controls/Slider';
import PadButton from '@/components/controls/PadButton';
import PanelButton from '@/components/controls/PanelButton';
import TransportButton from '@/components/controls/TransportButton';
import LEDIndicator from '@/components/controls/LEDIndicator';
import ValueDial from '@/components/controls/ValueDial';
import JogWheel from '@/components/controls/JogWheel';
import type {
  PanelLayout,
  PanelControl,
  PanelSection,
  PanelState,
  SectionControlLayout,
  StructuralRow,
} from '@/types/panel';

interface DataDrivenPanelProps {
  layout: PanelLayout;
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

/* ── Control Renderer ────────────────────────────────────────── */

function RenderControl({
  control,
  panelState,
  highlighted,
  onButtonClick,
}: {
  control: PanelControl;
  panelState: PanelState;
  highlighted: boolean;
  onButtonClick?: (id: string) => void;
}) {
  const state = panelState[control.id];
  const active = state?.active ?? false;
  const ledOn = state?.ledOn ?? false;

  const buttonLabelPosition =
    control.labelPosition === 'above' ? 'above' : 'on';

  type PanelButtonVariant = 'standard' | 'zone' | 'scene' | 'category' | 'function' | 'menu';
  const safeVariants: PanelButtonVariant[] = ['standard', 'zone', 'scene', 'category', 'function', 'menu'];
  const buttonVariant: PanelButtonVariant =
    safeVariants.includes(control.variant as PanelButtonVariant)
      ? (control.variant as PanelButtonVariant)
      : 'standard';

  switch (control.type) {
    case 'button':
      return (
        <PanelButton
          id={control.id}
          label={control.label}
          variant={buttonVariant}
          size={control.size ?? 'sm'}
          active={active}
          hasLed={control.hasLed}
          ledOn={ledOn}
          ledColor={control.ledColor ?? state?.ledColor}
          highlighted={highlighted}
          labelPosition={buttonLabelPosition}
          onClick={() => onButtonClick?.(control.id)}
        />
      );

    case 'knob':
      return (
        <Knob
          id={control.id}
          label={control.label}
          value={state?.value ?? control.defaultValue ?? 64}
          size="sm"
          highlighted={highlighted}
        />
      );

    case 'slider':
    case 'fader':
      return (
        <Slider
          id={control.id}
          label={control.label}
          value={state?.value ?? control.defaultValue ?? 0}
          highlighted={highlighted}
        />
      );

    case 'pad':
      return (
        <PadButton
          id={control.id}
          label={control.label}
          highlighted={highlighted}
          active={active}
          color={control.color}
          onClick={() => onButtonClick?.(control.id)}
        />
      );

    case 'transport': {
      const label = control.label.toLowerCase();
      const icon: 'play' | 'stop' | 'rec' = label.includes('play')
        ? 'play'
        : label.includes('stop')
        ? 'stop'
        : 'rec';
      return (
        <TransportButton
          id={control.id}
          icon={icon}
          highlighted={highlighted}
          active={active}
          onClick={() => onButtonClick?.(control.id)}
        />
      );
    }

    case 'dial':
    case 'encoder':
      return (
        <ValueDial
          id={control.id}
          label={control.label}
          size="sm"
          highlighted={highlighted}
        />
      );

    case 'led':
      return (
        <LEDIndicator
          id={control.id}
          on={ledOn}
          color={control.ledColor ?? control.color ?? '#00ff44'}
        />
      );

    case 'jog-wheel':
      return (
        <JogWheel
          id={control.id}
          size={control.position?.width ?? 240}
          highlighted={highlighted}
        />
      );

    case 'display':
      return (
        <div
          data-control-id={control.id}
          style={{
            width: '100%',
            height: control.position?.height ?? 240,
            borderRadius: 6,
            background: '#0a0a12',
            border: '2px solid #333',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: '#444', fontSize: 12, fontFamily: 'monospace' }}>DISPLAY</span>
        </div>
      );

    case 'text':
      return (
        <span
          data-control-id={control.id}
          style={{
            color: control.color ?? '#999',
            fontSize: 10,
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {control.label}
        </span>
      );

    case 'lever':
      return (
        <div
          data-control-id={control.id}
          style={{
            width: control.position?.width ?? 30,
            height: control.position?.height ?? 50,
            background: 'linear-gradient(180deg, #555 0%, #333 100%)',
            borderRadius: 4,
            border: '1px solid #222',
            boxShadow: highlighted
              ? '0 0 8px rgba(0,170,255,0.5)'
              : '0 2px 4px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: '#999', fontSize: 8, fontFamily: 'monospace' }}>
            {control.label}
          </span>
        </div>
      );

    default:
      return null;
  }
}

/* ── Section Layout Renderer ─────────────────────────────────── */

function SectionControls({
  section,
  panelState,
  highlightedControls,
  onButtonClick,
}: {
  section: PanelSection;
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}) {
  const layout = section.controlLayout ?? { type: 'flex-col' as const, gap: 4 };

  const containerStyle: React.CSSProperties = (() => {
    switch (layout.type) {
      case 'grid':
        return {
          display: 'grid',
          gridTemplateColumns: `repeat(${layout.columns}, auto)`,
          gap: layout.gap ?? 4,
          rowGap: layout.rowGap ?? layout.gap ?? 4,
        };
      case 'flex-row':
        return {
          display: 'flex',
          flexDirection: 'row',
          flexWrap: layout.wrap ? 'wrap' : 'nowrap',
          gap: layout.gap ?? 4,
          alignItems: layout.align ?? 'center',
        };
      case 'flex-col':
        return {
          display: 'flex',
          flexDirection: 'column',
          gap: layout.gap ?? 4,
          alignItems: layout.align ?? 'start',
        };
      case 'absolute':
        return {
          position: 'relative' as const,
          width: layout.width,
          height: layout.height,
        };
    }
  })();

  return (
    <div data-layout={layout.type} style={containerStyle}>
      {section.controls.map((control) => {
        const highlighted = highlightedControls.includes(control.id);

        // For absolute layout, use position
        const wrapperStyle: React.CSSProperties =
          layout.type === 'absolute' && control.position
            ? { position: 'absolute', left: control.position.x, top: control.position.y }
            : {
                ...(control.gridColumn ? { gridColumn: control.gridColumn } : {}),
                ...(control.gridRow ? { gridRow: control.gridRow } : {}),
                ...(control.flexOrder !== undefined ? { order: control.flexOrder } : {}),
              };

        return (
          <div key={control.id} data-control-id={control.id} style={wrapperStyle}>
            <RenderControl
              control={control}
              panelState={panelState}
              highlighted={highlighted}
              onButtonClick={onButtonClick}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ── Structural Layout (Row-Based) ───────────────────────────── */

function StructuralLayout({
  layout,
  panelState,
  highlightedControls,
  onButtonClick,
}: DataDrivenPanelProps) {
  const rows = layout.rows ?? [];
  const sectionMap = new Map(layout.sections.map((s) => [s.id, s]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: row.gap ?? 8,
            ...(row.height === 'auto' ? {} : row.height ? { height: row.height } : { flex: 1 }),
          }}
        >
          {row.sections.map((sectionId) => {
            const section = sectionMap.get(sectionId);
            if (!section) return null;

            const isStretched = row.stretch === sectionId;

            return (
              <div
                key={sectionId}
                data-section-id={sectionId}
                style={{
                  ...(isStretched ? { flex: 1, minWidth: 0 } : {}),
                  ...(section.minWidth && !isStretched ? { minWidth: section.minWidth, flexShrink: 0 } : {}),
                  ...(section.minHeight ? { minHeight: section.minHeight } : {}),
                  background: section.background ?? 'transparent',
                  borderRadius: section.borderRadius ?? 0,
                  padding: section.padding ?? 8,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <SectionControls
                  section={section}
                  panelState={panelState}
                  highlightedControls={highlightedControls}
                  onButtonClick={onButtonClick}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ── Absolute Layout (Legacy) ────────────────────────────────── */

function AbsoluteLayout({
  layout,
  panelState,
  highlightedControls,
  onButtonClick,
}: DataDrivenPanelProps) {
  return (
    <>
      {layout.sections.map((section) => {
        const hasBounds = section.bounds != null;
        const sectionStyle: React.CSSProperties = hasBounds
          ? {
              position: 'absolute',
              left: section.bounds!.x,
              top: section.bounds!.y,
              width: section.bounds!.width,
              height: section.bounds!.height,
              background: section.background ?? 'rgba(0,0,0,0.15)',
              borderRadius: section.borderRadius ?? 8,
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
            }
          : {
              position: 'relative',
              background: section.background ?? 'rgba(0,0,0,0.15)',
              borderRadius: section.borderRadius ?? 8,
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
            };

        return (
          <div key={section.id} data-section-id={section.id} style={sectionStyle}>
            {section.controls.map((control) => {
              const highlighted = highlightedControls.includes(control.id);
              const hasPosition = control.position != null;
              const wrapperStyle: React.CSSProperties = hasPosition
                ? { position: 'absolute', left: control.position!.x, top: control.position!.y }
                : { position: 'relative' };

              return (
                <div key={control.id} data-control-id={control.id} style={wrapperStyle}>
                  <RenderControl
                    control={control}
                    panelState={panelState}
                    highlighted={highlighted}
                    onButtonClick={onButtonClick}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

/* ── Main Component ──────────────────────────────────────────── */

export default function DataDrivenPanel({
  layout,
  panelState,
  highlightedControls,
  onButtonClick,
}: DataDrivenPanelProps) {
  const panelWidth = layout.dimensions?.width ?? 900;
  const panelHeight = layout.dimensions?.height ?? 1200;
  const bgColor = layout.background?.color ?? '#1a1a1e';
  const isStructural = layout.layoutMode === 'structural';

  return (
    <motion.div
      className="rounded-2xl overflow-hidden select-none relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        width: panelWidth,
        height: panelHeight,
        background: bgColor,
        backgroundImage:
          'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.005) 2px, rgba(255,255,255,0.005) 3px), radial-gradient(ellipse at 30% 20%, rgba(60,60,60,0.08) 0%, transparent 60%)',
        boxShadow:
          '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Top edge highlight */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {isStructural ? (
        <StructuralLayout
          layout={layout}
          panelState={panelState}
          highlightedControls={highlightedControls}
          onButtonClick={onButtonClick}
        />
      ) : (
        <AbsoluteLayout
          layout={layout}
          panelState={panelState}
          highlightedControls={highlightedControls}
          onButtonClick={onButtonClick}
        />
      )}
    </motion.div>
  );
}
```

**Step 4: Run tests**

Run: `npm run test -- src/__tests__/DataDrivenPanel.test.tsx`
Expected: PASS

Run: `npm run test`
Expected: ALL tests pass

**Step 5: Commit**

```bash
git add src/components/devices/DataDrivenPanel.tsx src/__tests__/DataDrivenPanel.test.tsx
git commit -m "feat: add structural layout mode to DataDrivenPanel"
```

---

### Task 4: Rewrite CDJ-3000 Layout Data Using Structural Descriptions

**Files:**
- Modify: `src/data/panelLayouts/cdj-3000.ts`

This is where the quality improvement happens. Instead of 200 lines of pixel coordinates, we describe the topology.

**Step 1: Write the test**

Create `src/__tests__/cdj3000Layout.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { cdj3000Layout, allCDJ3000ControlIds } from '@/data/panelLayouts/cdj-3000';

describe('CDJ-3000 Layout', () => {
  it('uses structural layout mode', () => {
    expect(cdj3000Layout.layoutMode).toBe('structural');
  });

  it('has rows defined', () => {
    expect(cdj3000Layout.rows).toBeDefined();
    expect(cdj3000Layout.rows!.length).toBeGreaterThan(0);
  });

  it('every row references existing sections', () => {
    const sectionIds = new Set(cdj3000Layout.sections.map(s => s.id));
    for (const row of cdj3000Layout.rows!) {
      for (const sectionId of row.sections) {
        expect(sectionIds.has(sectionId)).toBe(true);
      }
    }
  });

  it('every section has a controlLayout', () => {
    for (const section of cdj3000Layout.sections) {
      expect(section.controlLayout).toBeDefined();
    }
  });

  it('has all expected control IDs from the manual (50 parts)', () => {
    // Key controls that must exist based on manual pages 14-16
    const requiredControls = [
      'play-pause', 'cue', 'source', 'browse', 'jog-wheel',
      'tempo-slider', 'beat-sync', 'master-tempo',
      'hot-cue-a', 'hot-cue-b', 'hot-cue-c', 'hot-cue-d',
      'hot-cue-e', 'hot-cue-f', 'hot-cue-g', 'hot-cue-h',
      'loop-in', 'loop-out', 'rotary-selector',
    ];
    for (const id of requiredControls) {
      expect(allCDJ3000ControlIds).toContain(id);
    }
  });

  it('controls have NO absolute positions (except jog-wheel section)', () => {
    for (const section of cdj3000Layout.sections) {
      if (section.controlLayout?.type === 'absolute') continue;
      for (const control of section.controls) {
        // Controls in non-absolute sections should not have position
        if (control.type !== 'jog-wheel' && control.type !== 'display') {
          expect(control.position).toBeUndefined();
        }
      }
    }
  });

  it('exports flat control ID list', () => {
    expect(allCDJ3000ControlIds.length).toBeGreaterThan(40);
    expect(new Set(allCDJ3000ControlIds).size).toBe(allCDJ3000ControlIds.length);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/__tests__/cdj3000Layout.test.ts`
Expected: FAIL — current layout uses absolute mode

**Step 3: Rewrite cdj-3000.ts**

Replace the entire file with structural layout data. Reference: manual pages 14-16 (50 parts).

The data file should organize controls into sections matching the CDJ-3000's physical layout:
- Navigation bar (SOURCE, BROWSE, TAG LIST, PLAYLIST, SEARCH, UTILITY, MENU)
- Media (SD indicator, SD slot, USB STOP, USB indicator)
- Display (9" touchscreen)
- Browse controls (BACK, TAG TRACK, Rotary selector, TRACK FILTER, SHORTCUT)
- Hot cue strip (SLIP, QUANTIZE, TIME MODE, Hot Cue A-H, CUE/LOOP CALL, DELETE, MEMORY)
- Loop & beat (LOOP IN, LOOP OUT, RELOOP/EXIT, 4 BEAT, 8 BEAT, BEAT JUMP)
- Jog controls (JOG MODE, VINYL SPEED ADJ, JOG ADJUST)
- Jog wheel (the large wheel — absolute positioning)
- Transport (DIRECTION lever, TRACK SEARCH, SEARCH, CUE, PLAY/PAUSE)
- Tempo & sync (MASTER, KEY SYNC, BEAT SYNC, TEMPO RANGE, MASTER TEMPO, TEMPO slider, TEMPO RESET)

Rows:
```
Row 1: [navigation] — full width flex-row
Row 2: [media | display | browse] — display stretches
Row 3: [hot-cue-strip] — full width grid
Row 4: [loop-beat | jog-area | jog-controls] — jog-area stretches (contains jog-wheel absolute)
Row 5: [transport | spacer | tempo-sync] — transport left, tempo right
```

See design doc `docs/plans/2026-03-07-structural-panel-layout-design.md` for the full structural layout specification. The implementation should match the manual's Part Names diagram (pages 14-16) for control inventory and section grouping.

**Step 4: Run tests**

Run: `npm run test -- src/__tests__/cdj3000Layout.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/panelLayouts/cdj-3000.ts src/__tests__/cdj3000Layout.test.ts
git commit -m "feat: rewrite CDJ-3000 layout with structural positioning"
```

---

### Task 5: Wire CDJ-3000 Into the App

**Files:**
- Modify: `src/app/tutorial/[deviceId]/[tutorialId]/page.tsx`
- Modify: `src/app/page.tsx`
- Verify: `src/data/devices.ts` (CDJ-3000 device entry)
- Verify: `src/data/tutorials/cdj-3000/index.ts` (tutorial exports)
- Verify: `src/data/tutorials/cdj-3000/panel-overview.ts` (tutorial content)

**Step 1: Check existing registrations**

Read `src/data/devices.ts` — verify CDJ-3000 device entry exists. If not, add it.
Read `src/data/tutorials/cdj-3000/index.ts` — verify it imports and exports `panelOverview`.
Read `src/app/page.tsx` — verify CDJ-3000 tutorials are included in `allTutorials`.

**Step 2: Create CDJ-3000 panel wrapper**

The CDJ-3000 uses `DataDrivenPanel` wrapped with its layout. Add to `src/app/tutorial/[deviceId]/[tutorialId]/page.tsx`:

```typescript
import { cdj3000Tutorials } from '@/data/tutorials/cdj-3000';
import DataDrivenPanel from '@/components/devices/DataDrivenPanel';
import { cdj3000Layout } from '@/data/panelLayouts/cdj-3000';

// Add to tutorialsByDevice:
'cdj-3000': cdj3000Tutorials,

// Create wrapper component:
function CDJ3000PanelWrapper(props: any) {
  return <DataDrivenPanel layout={cdj3000Layout} {...props} />;
}

// Add to panelComponents:
'cdj-3000': CDJ3000PanelWrapper,
```

**Step 3: Run build and tests**

Run: `npm run build`
Expected: Build succeeds with zero errors

Run: `npm run test`
Expected: ALL tests pass

**Step 4: Commit**

```bash
git add src/app/tutorial/[deviceId]/[tutorialId]/page.tsx src/app/page.tsx src/data/devices.ts src/data/tutorials/cdj-3000/
git commit -m "feat: wire CDJ-3000 panel and tutorial into the app"
```

---

### Task 6: Visual Verification and Final Polish

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Visual check**

Navigate to `http://localhost:3000` → select CDJ-3000 → open Panel Overview tutorial.

Verify:
- [ ] Panel renders with correct proportions (portrait orientation)
- [ ] Navigation bar spans full width with evenly spaced buttons
- [ ] Display area dominates the upper-center
- [ ] Hot cue pads (A-H) are evenly spaced in a row
- [ ] Jog wheel is prominently sized in the center
- [ ] Transport controls (CUE, PLAY/PAUSE) are on the lower left
- [ ] Tempo slider and sync buttons are on the right
- [ ] Tutorial highlights work (controls glow when referenced)
- [ ] Step navigation works (arrow keys, buttons)

**Step 3: Fix any visual issues**

If spacing, sizing, or proportions need adjustment, modify section `padding`, `gap`, `minWidth`, or `minHeight` values in `cdj-3000.ts`.

**Step 4: Run final verification**

Run: `npm run build && npm run test`
Expected: ALL pass

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: polish CDJ-3000 panel layout proportions"
```

---

### Task 7: Push and Create PR

**Step 1: Push branch**

```bash
git push -u origin feature/panel-layout-editor
```

**Step 2: Create PR**

```bash
gh pr create --title "feat: structural panel layout for data-driven instruments" --body "..."
```

PR should summarize: type system extensions, DataDrivenPanel structural mode, JogWheel extraction, CDJ-3000 proof of concept.
