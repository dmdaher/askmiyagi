'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import { useEditorStore } from './store';
import type { ControlDef } from './store';
import type { ControlGroup } from './store/historySlice';
import { isControlSelected, selectedControlIds } from './store/selection-types';
import { rotateAABB, rectsOverlap } from './geometry';
import PanelButton from '@/components/controls/PanelButton';
import Knob from '@/components/controls/Knob';
import Slider from '@/components/controls/Slider';
import Wheel from '@/components/controls/Wheel';
import PadButton from '@/components/controls/PadButton';
import ValueDial from '@/components/controls/ValueDial';
import Lever from '@/components/controls/Lever';
import Port from '@/components/controls/Port';
import TouchDisplay from '@/components/controls/TouchDisplay';
import JogWheelAssembly from '@/components/controls/JogWheelAssembly';
import DirectionSwitch from '@/components/controls/DirectionSwitch';
import JogDisplay from '@/components/controls/JogDisplay';
import {
  renderLabelText,
  inferPortVariant,
  mapButtonLabelPosition,
} from '@/lib/render-helpers';
import SharedCircleButton from '@/components/panel/SharedCircleButton';
import SharedLed from '@/components/panel/SharedLed';

interface ControlNodeProps {
  controlId: string;
  sectionId: string;
}

/** Render a small LED dot indicator for buttons with hasLed (dot style only).
 * PR EP3: skip the dot for any non-dot ledStyle — face/integrated/label-backlit/
 * edge-glow all render their LED via PanelButton's styled face/border/label
 * (handled by getLedStyleObject in src/components/controls/ledStyles.ts). */
function renderButtonLed(control: ControlDef) {
  if (!control.hasLed || (control.type !== 'button' && control.type !== 'pad')) return null;
  // Only ledStyle='dot' uses this separate-dot path. Everything else
  // (face/integrated/label-backlit/edge-glow) renders inline via PanelButton.
  const style = control.ledStyle ?? 'dot';
  if (style !== 'dot') return null;
  // EP-drift-fix: when ledPosition is 'inside', PanelButton's internal dot
  // renders the LED inside the button. Skip the external dot here so editor
  // and preview agree (PanelRenderer line 201's `ledPosition !== 'inside'`
  // gate already excludes this case for preview).
  if ((control.ledPosition as string | undefined) === 'inside') return null;
  const color = control.ledColor ?? '#22c55e';

  // For 'above', 'below', 'ring' — render above the control as absolute overlay.
  // (The 'inside' case is handled by PanelButton's internal dot via the
  // hasLed gate; this function early-returns above for that case.)
  return (
    <div className="absolute -top-2 left-1/2 -translate-x-1/2" style={{ zIndex: 5 }}>
      <div
        className="rounded-full"
        style={{
          width: 6,
          height: 6,
          backgroundColor: color,
          boxShadow: `0 0 4px 1px ${color}`,
        }}
      />
    </div>
  );
}

/** Render the real hardware control component based on control type */
function renderControl(control: ControlDef, isSelected: boolean, allControls: Record<string, ControlDef>, controlScale: number = 1) {
  // Visual size = container size = stored w/h * controlScale
  const visW = Math.round(control.w * controlScale);
  const visH = Math.round(control.h * controlScale);
  // Editor reads ledOn from the control's stored editor-only field. The
  // Test LEDs toolbar toggle is PREVIEW-MODE ONLY (see PanCanvas) so it
  // never affects editor rendering — keeps the edit view a pure layout
  // tool while preview becomes the LED verification surface.
  const effectiveLedOn = control.ledOn;
  // Skip controls that are nested inside another control (e.g., display nested in jog wheel)
  if (control.nestedIn && allControls[control.nestedIn]) {
    // This control is part of a composite — it will be rendered by the parent
    return null;
  }

  switch (control.type) {
    case 'button': {
      // Dual-label buttons render as LED indicator regardless of type.
      // Editor is config-time — no `ledOn` passed → SharedLed treats as
      // undefined → top row active (design-viz, matches pre-PR-3 editor).
      if (control.ledVariant === 'dual-label') {
        return (
          <SharedLed
            width={visW}
            height={visH}
            variant="dual-label"
            label={control.label}
            secondaryLabel={control.secondaryLabel}
            ledColor={control.ledColor}
            dataControlId={control.id}
          />
        );
      }
      if (control.shape === 'circle') {
        // Editor is config-time: no `ledOn`/`active`/`onClick` — those are
        // tutorial-driven and only matter in the preview render path.
        // diameter uses the SCALED visual dims (was raw `control.w` / `control.h`
        // pre-PR-2.5; pre-existing bug exposed once Phase 10 auto-fit started
        // applying controlScale < 1 — circle rendered larger than its Rnd
        // wrapper. SCALED dims match the preview render path and the wrapper.
        const diameter = Math.min(visW, visH);
        return (
          <div className="relative" data-control-id={control.id}>
            {renderButtonLed(control)}
            <SharedCircleButton
              diameter={diameter}
              label={control.label}
              icon={control.icon}
              labelPosition={control.labelPosition}
              labelDisplay={control.labelDisplay}
              labelFontSize={control.labelFontSize}
              labelColor={control.labelColor}
              surfaceColor={control.surfaceColor}
              hasLed={control.hasLed}
              ledStyle={control.ledStyle}
              ledColor={control.ledColor ?? undefined}
              ledOn={effectiveLedOn === true}
            />
          </div>
        );
      }

      // Map buttonStyle to PanelButton variant ('raised' maps to 'standard')
      const rawStyle = control.buttonStyle;
      const variant = rawStyle === 'raised' ? 'standard' : (rawStyle ?? 'standard');

      // Icons are rendered by LabelLayer (as editorLabels with icon field).
      // PanelButton only renders the button face — no icon positioning here.
      const buttonEl = (
        <div className="relative">
          {renderButtonLed(control)}
          <PanelButton
            id={control.id}
            label={control.labelPosition === 'on-button' ? control.label : ''}
            highlighted={isSelected}
            width={visW}
            height={visH}
            variant={variant}
            surfaceColor={control.surfaceColor ?? undefined}
            // EP-drift-fix: gate must MATCH PanelRenderer line 231 so editor
            // and preview produce identical PanelButton DOM (same internal-
            // dot rendering). Without this, editor passes hasLed=true to
            // PanelButton for dot-style buttons → PanelButton renders an
            // internal flex-sibling dot (~6px tall column addition), while
            // preview passes hasLed=false → no internal dot → ~4px column
            // height divergence that drift:ci catches as parity failure.
            //
            // Pass hasLed when:
            //   (a) ledPosition === 'inside' → PanelButton's internal dot
            //       is what should render (renderButtonLed skips this case)
            //   (b) ledStyle is a non-dot style (face/label-backlit/edge-
            //       glow) → PanelButton paints the full LED face
            // For default dot LEDs (no ledPosition='inside'), pass false so
            // PanelButton's internal dot is suppressed; renderButtonLed
            // above renders the SINGLE external dot.
            hasLed={!!control.hasLed && (
              (control.ledPosition as string | undefined) === 'inside'
              || (!!control.ledStyle && control.ledStyle !== 'dot')
            )}
            ledColor={control.ledColor ?? undefined}
            ledOn={effectiveLedOn === true}
            labelPosition={mapButtonLabelPosition(control.labelPosition)}
            labelFontSize={control.labelFontSize}
            ledStyle={control.ledStyle}
            labelAlign={control.labelAlign}
            labelColor={control.labelColor}
          />
        </div>
      );
      return buttonEl;
    }
    case 'knob': {
      // Subtract shadow space (4px) so the knob + shadow fits within the container
      const knobSize = Math.max(Math.min(visW, visH) - 4, 12);
      return (
        <Knob
          id={control.id}
          label=""
          highlighted={isSelected}
          outerSize={knobSize}
          innerSize={knobSize * 0.7}
        />
      );
    }
    case 'fader':
    case 'slider':
      return (
        <Slider
          id={control.id}
          label=""
          highlighted={isSelected}
          trackHeight={Math.max(visH - 10, 20)}
          trackWidth={Math.max(visW - 4, 8)}
          rotation={control.rotation}
        />
      );
    case 'led':
    case 'indicator': {
      // Editor is config-time. SharedLed dispatches on `variant`:
      //   - dual-label: ledOn=undefined → top row active (design-viz,
      //     matches pre-PR-3 editor which ignored ledOn for dual-label)
      //   - bar: ledOn=undefined → lit (design-viz, matches pre-PR-3
      //     editor's "bar always lit" behavior)
      //   - dot: pass `control.ledOn === true ? true : undefined` so the
      //     contractor's configured ledOn=true lights the dot, anything
      //     else (false/undefined) renders dim. Matches pre-PR-3 editor's
      //     `ledIsOn = control.ledOn === true` check.
      const variant: 'dot' | 'dual-label' | 'bar' =
        control.ledVariant === 'dual-label' ? 'dual-label'
        : control.ledVariant === 'bar' ? 'bar'
        : 'dot';
      // EP3b: Test LEDs toolbar toggle forces ledOn=true on every hasLed control
      const ledOnForDot = effectiveLedOn === true ? true : undefined;
      return (
        <SharedLed
          width={visW}
          height={visH}
          variant={variant}
          label={control.label}
          secondaryLabel={control.secondaryLabel}
          ledColor={control.ledColor}
          ledOn={variant === 'dot' ? ledOnForDot : undefined}
          dataControlId={control.id}
        />
      );
    }
    case 'wheel': {
      // Check if any control is nested inside this wheel (e.g., a display or ring LED)
      const nestedIds = Object.values(allControls).filter(c => c.nestedIn === control.id);
      const nestedDisplay = nestedIds.find(c => c.type === 'screen' || c.type === 'display');
      const nestedRing = nestedIds.find(c => c.type === 'led' && c.ledPosition === 'ring');

      if (nestedDisplay || nestedRing) {
        // Render as JogWheelAssembly (composite)
        return (
          <JogWheelAssembly
            id={control.id}
            label=""
            highlighted={isSelected}
            wheelSize={Math.min(visW, visH)}
            displaySize={nestedDisplay ? Math.min(nestedDisplay.w, nestedDisplay.h, 60) : 60}
            ringColor={nestedRing?.ledColor ?? undefined}
          />
        );
      }

      return (
        <Wheel
          id={control.id}
          label=""
          highlighted={isSelected}
          width={visW}
          height={visH}
        />
      );
    }
    case 'pad':
      return (
        <div className="relative">
          {renderButtonLed(control)}
          <PadButton
            id={control.id}
            label={control.labelPosition === 'on-button' ? control.label : ''}
            highlighted={isSelected}
            width={visW}
            height={visH}
            labelFontSize={control.labelFontSize}
            labelAlign={control.labelAlign}
            labelColor={control.labelColor}
          />
        </div>
      );
    case 'encoder': {
      return (
        <ValueDial
          id={control.id}
          label=""
          highlighted={isSelected}
          outerSize={Math.min(visW, visH)}
          hasPush={control.encoderHasPush}
        />
      );
    }
    case 'switch':
    case 'lever': {
      // If positions > 2, use DirectionSwitch for multi-position switches
      if (control.positions && control.positions > 2) {
        return (
          <DirectionSwitch
            id={control.id}
            label=""
            positions={control.positionLabels ?? Array.from({ length: control.positions }, (_, i) => `${i + 1}`)}
            highlighted={isSelected}
            ledColor={control.ledColor ?? undefined}
            width={visW}
            height={Math.min(visH, 16)}
          />
        );
      }
      // Lever default height is ~62px at scale=1. Derive scale from control height.
      const leverScale = visH / 62;
      return (
        <Lever
          id={control.id}
          label=""
          highlighted={isSelected}
          scale={leverScale}
          positions={control.positions}
          positionLabels={control.positionLabels}
        />
      );
    }
    case 'port':
      return (
        <Port
          id={control.id}
          label=""
          variant={inferPortVariant(control.label)}
          highlighted={isSelected}
          width={visW}
          height={visH}
        />
      );
    case 'slot':
      return (
        <Port
          id={control.id}
          label=""
          variant="sd-card"
          highlighted={isSelected}
          width={visW}
          height={visH}
        />
      );
    case 'screen':
    case 'display': {
      // Detect circular jog displays from label or shape
      const isJogDisplay = control.shape === 'circle'
        || control.label.toLowerCase().includes('jog')
        || control.nestedIn != null;
      if (isJogDisplay) {
        return (
          <JogDisplay
            id={control.id}
            label={control.labelPosition === 'on-button' ? control.label : undefined}
            size={Math.min(visW, visH)}
            highlighted={isSelected}
            showMockContent
          />
        );
      }
      return (
        <TouchDisplay
          id={control.id}
          label={control.labelPosition === 'on-button' ? control.label : undefined}
          highlighted={isSelected}
          width={visW}
          height={visH}
          showMockContent
        />
      );
    }
    default:
      return <div className="text-xs text-red-400">Unknown: {control.type}</div>;
  }
}

export default function ControlNode({ controlId, sectionId }: ControlNodeProps) {
  const control = useEditorStore((s) => s.controls[controlId]);
  const allControls = useEditorStore((s) => s.controls);
  const selection = useEditorStore((s) => s.selection);
  const [shiftHeld, setShiftHeld] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Shift') setShiftHeld(true); };
    const up = (e: KeyboardEvent) => { if (e.key === 'Shift') setShiftHeld(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const zoom = useEditorStore((s) => s.zoom);
  const snapGrid = useEditorStore((s) => s.snapGrid);
  const controlScale = useEditorStore((s) => s.controlScale);
  const showLabels = useEditorStore((s) => s.showLabels);
  const moveControl = useEditorStore((s) => s.moveControl);
  const moveSelectedControls = useEditorStore((s) => s.moveSelectedControls);
  const resizeControl = useEditorStore((s) => s.resizeControl);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);
  const toggleSelected = useEditorStore((s) => s.toggleSelected);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const setFocusedSection = useEditorStore((s) => s.setFocusedSection);
  const updateControlProp = useEditorStore((s) => s.updateControlProp);

  const controlGroups = useEditorStore((s) => s.controlGroups) as ControlGroup[];
  const isGrouped = controlGroups.some((g) => g.controlIds.includes(controlId));

  // Phase 6b — derived from unified selection. selectedIds was the legacy
  // mixed bag (controls + sections); for ControlNode's purposes we only
  // care about whether THIS control is selected and how many controls are
  // selected total (for multi-drag detection).
  const selectedIds = selectedControlIds(selection);
  const isSelected = isControlSelected(selection, controlId);
  const isMultiSelected = isSelected && selectedIds.length > 1;

  // ── Inline label editing (component-local state) ──────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Control positions are absolute canvas coords — rendered in the flat
  // ControlLayer above all sections, not inside a section's DOM.
  const relX = control?.x ?? 0;
  const relY = control?.y ?? 0;

  // PR-2.5 — circle wrapper alignment.
  //
  // For controls with `shape === 'circle'`, the visible circle is square at
  // `min(visW, visH)` while the historical Rnd wrapper was the full
  // `visW × visH` rectangle. Two consequences (both pre-existing bugs):
  //   1. When the stored `control.w !== control.h`, the wrapper extended
  //      horizontally past the visible circle — selection chrome, resize
  //      handles, and drag area sat outside the circle on the wide axis.
  //   2. When Phase 10 controlScale < 1 produced asymmetric scaling, the
  //      circle diameter (formerly unscaled `Math.min(control.w, control.h)`)
  //      rendered LARGER than the scaled wrapper — circle visually
  //      overflowed its draggable Rnd container.
  //
  // Fix: make the Rnd wrapper square at the scaled diameter for circle
  // controls, with a positional offset so the visible circle stays on-panel
  // exactly where it was. The drag handler's delta math is offset-independent
  // (dragStartRef stores the offset position, current d.x has same offset →
  // delta cancels). The resize handler's `dx = position.x - relX` math is
  // adjusted to subtract `circleOffsetX` below.
  const visWTop = Math.round(control.w * controlScale);
  const visHTop = Math.round(control.h * controlScale);
  const isCircleShape = control.type === 'button' && control.shape === 'circle';
  const wrapperW = isCircleShape ? Math.min(visWTop, visHTop) : visWTop;
  const wrapperH = isCircleShape ? Math.min(visWTop, visHTop) : visHTop;
  const circleOffsetX = isCircleShape ? (visWTop - wrapperW) / 2 : 0;
  const circleOffsetY = isCircleShape ? (visHTop - wrapperH) / 2 : 0;

  // Track drag start position for multi-select delta computation
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleDragStart = useCallback(
    (_e: unknown, d: { x: number; y: number }) => {
      // Focus parent section to bring it above others during drag/resize
      setFocusedSection(sectionId);
      dragStartRef.current = { x: d.x, y: d.y };
    },
    [],
  );

  const handleDragStop = useCallback(
    (_e: unknown, d: { x: number; y: number }) => {
      const dx = d.x - dragStartRef.current.x;
      const dy = d.y - dragStartRef.current.y;
      // Ignore zero-movement clicks (not actual drags)
      if (dx === 0 && dy === 0) return;

      // Phase 4 — cross-type drag. When the unified selection contains
      // non-control entries (labels, banners) AND this control is one of
      // them, route through moveSelection so the whole group moves in
      // lockstep. moveSelection takes its own snapshot, so skip the
      // outer pushSnapshot to avoid double-undo entries.
      const sel = useEditorStore.getState().selection;
      const ctrlSid = `control:${controlId}` as const;
      const hasNonControl = sel.some((s) => !s.startsWith('control:'));
      const isCrossTypeMulti = sel.length > 1 && sel.includes(ctrlSid) && hasNonControl;

      if (isCrossTypeMulti) {
        // Cross-type multi-drag (e.g., 1 control + 2 labels selected).
        // Caller is responsible for the snapshot — moveSelection no longer
        // snapshots internally (would create N snapshots per drag on the
        // LabelLayer mousemove path; user-reported "undo needs many
        // presses" bug). ONE snapshot here = ONE undo step for the drag.
        pushSnapshot();
        useEditorStore.getState().moveSelection(dx, dy);
      } else if (isMultiSelected) {
        // Legacy all-controls multi-drag — preserves existing behavior
        // and the tested 27-test alignment regression baseline.
        pushSnapshot();
        moveSelectedControls(dx, dy);
      } else {
        pushSnapshot();
        moveControl(controlId, dx, dy);
      }
    },
    [isMultiSelected, controlId, moveControl, moveSelectedControls, pushSnapshot],
  );

  const handleResizeStop = useCallback(
    (
      _e: unknown,
      _dir: unknown,
      ref: HTMLElement,
      _delta: unknown,
      position: { x: number; y: number },
    ) => {
      // Rnd reports the visual size (scaled). Divide by controlScale to get the stored "full size".
      const newW = Math.round(parseInt(ref.style.width, 10) / controlScale);
      const newH = Math.round(parseInt(ref.style.height, 10) / controlScale);
      // Ignore micro-resizes (< 3px in both dimensions) to prevent accidental resizes
      const deltaW = Math.abs(newW - control.w);
      const deltaH = Math.abs(newH - control.h);
      if (deltaW < 3 && deltaH < 3) return;
      // Snapshot BEFORE mutation so undo restores the previous state
      pushSnapshot();
      // Handle position shift from top/left resize handles.
      // PR-2.5: for circle controls, Rnd's `position.x/y` is relative to the
      // OFFSET wrapper origin; subtract `circleOffsetX/Y` to get the logical
      // store-relative delta.
      const dx = position.x - (relX + circleOffsetX);
      const dy = position.y - (relY + circleOffsetY);
      if (dx !== 0 || dy !== 0) {
        moveControl(controlId, dx, dy);
      }
      resizeControl(controlId, newW, newH);
    },
    [relX, relY, circleOffsetX, circleOffsetY, controlId, moveControl, resizeControl, pushSnapshot],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      // Option/Alt+Click: cycle through overlapping controls, then containers
      if (e.altKey) {
        const store = useEditorStore.getState();
        const allCtrls = store.controls;
        const cx = control?.x ?? 0;
        const cy = control?.y ?? 0;
        const cw = control?.w ?? 0;
        const ch = control?.h ?? 0;

        // EP6-C: hit-test against the rotation-aware AABB so visually
        // overlapping rotated controls cycle correctly. For axis-aligned
        // controls (rotation 0/falsy) rotateAABB returns the input
        // unchanged — same behavior as before.
        const myAABB = rotateAABB({ x: cx, y: cy, w: cw, h: ch }, control?.rotation ?? 0);
        const overlapping = Object.values(allCtrls).filter((c: any) => {
          if (!c || c.id === controlId || c.nestedIn) return false;
          const otherAABB = rotateAABB({ x: c.x, y: c.y, w: c.w, h: c.h }, c.rotation ?? 0);
          return rectsOverlap(myAABB, otherAABB);
        });

        if (overlapping.length > 0) {
          // Sort by zOrder descending — cycle top-to-bottom, then wrap
          const sorted = [control, ...overlapping].sort((a: any, b: any) => (b.zOrder ?? 0) - (a.zOrder ?? 0));
          const currentIdx = sorted.findIndex((c: any) => c.id === controlId);
          const nextIdx = (currentIdx + 1) % sorted.length;
          setSelectedIds([sorted[nextIdx].id]);
          return;
        }

        // No overlapping controls — fall back to container selection
        const containers = store.controlContainers ?? [];
        const hit = containers.find(c =>
          cx >= c.x && cx <= c.x + c.w && cy >= c.y && cy <= c.y + c.h
        );
        if (hit) {
          setSelectedIds([hit.id]);
          return;
        }
      }

      // Focus the parent section so it raises above other sections
      setFocusedSection(sectionId);

      const store = useEditorStore.getState();
      const groups = store.controlGroups as ControlGroup[];
      const group = groups.find((g) => g.controlIds.includes(controlId));

      if (e.metaKey) {
        // Cmd+click: deep-select — toggle just this individual control (bypass group)
        toggleSelected(controlId);
      } else if (e.shiftKey) {
        // Shift+click: add to selection at the group level
        // If control is in a group, add whole group. Otherwise toggle individual.
        const current = selectedControlIds(store.selection);
        if (group) {
          // Check if all members of this group are already selected
          const allIn = group.controlIds.every((id) => current.includes(id));
          if (allIn) {
            // Remove the whole group from selection
            const groupSet = new Set(group.controlIds);
            setSelectedIds(current.filter((id) => !groupSet.has(id)));
          } else {
            // Add all group members to selection
            setSelectedIds([...new Set([...current, ...group.controlIds])]);
          }
        } else {
          // Not in a group — toggle individual
          toggleSelected(controlId);
        }
      } else if (group) {
        // Plain click on grouped control: select entire group
        setSelectedIds(group.controlIds);
      } else {
        // Figma-style: if this control is ALREADY part of a multi-
        // selection (e.g., a control + labels selected via shift), a
        // plain click should preserve the selection so the user can
        // start a multi-drag. Only replace when clicking an unselected
        // control. Without this, clicking the control wipes the
        // unified `selection` (via setSelectedIds) and the drag
        // handler sees only this one control → labels get left behind.
        // Caught by Phase 4 e2e scenario [5] (drag-control-with-labels).
        const currentSel = useEditorStore.getState().selection;
        const ctrlSid = `control:${controlId}` as const;
        if (!currentSel.includes(ctrlSid)) {
          setSelectedIds([controlId]);
        }
        // else: preserve selection; drag will fan out via moveSelection.
      }
    },
    [controlId, sectionId, toggleSelected, setSelectedIds, setFocusedSection],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!control) return;

      // If this control is in a group and the whole group is selected,
      // deep-select just this control instead of opening label editor
      const groups = useEditorStore.getState().controlGroups as ControlGroup[];
      const group = groups.find((g) => g.controlIds.includes(controlId));
      if (group && selectedIds.length > 1 && group.controlIds.every((id) => selectedIds.includes(id))) {
        setSelectedIds([controlId]);
        return;
      }

      // Original behavior: open inline label editor
      setEditValue(control.label);
      setIsEditing(true);
      // Focus the input after React renders it
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    },
    [control, controlId, selectedIds, setSelectedIds],
  );

  const commitEdit = useCallback(() => {
    if (!control) return;
    if (editValue !== control.label) {
      pushSnapshot();
      updateControlProp([controlId], 'label', editValue);
    }
    setIsEditing(false);
  }, [control, controlId, editValue, updateControlProp, pushSnapshot]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        commitEdit();
      } else if (e.key === 'Escape') {
        cancelEdit();
      }
      // Shift+Enter inserts a newline (default textarea behavior)
    },
    [commitEdit, cancelEdit],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Select this control if it's not already selected
      if (!isSelected) {
        setSelectedIds([controlId]);
      }
      // Dispatch a custom event that the ContextMenu component listens for
      const detail = { controlId, clientX: e.clientX, clientY: e.clientY };
      window.dispatchEvent(new CustomEvent('editor-context-menu', { detail }));
    },
    [controlId, isSelected, setSelectedIds],
  );

  if (!control) return null;

  // Skip rendering for controls nested inside another (rendered by composite parent)
  if (control.nestedIn && allControls[control.nestedIn]) return null;

  const isLocked = control.locked;
  const isResizeLocked = control.resizeLocked;
  // Option A (K4 follow-up): tiny controls (e.g., split LED indicators) hide
  // their resize handles UNTIL selected. Rnd's 10×10 corner handles eat most
  // of the click area on a 24×24 LED, making the first select+drag awkward.
  // After click → control is selected → handles appear → user can then
  // resize freely. Larger controls keep their handles always.
  // Threshold: 32 px on the shorter axis (post-zoom).
  const isTooSmallToResize = Math.min(wrapperW, wrapperH) < 32;
  // Resize disabled while CSS rotation is applied to the visual: Rnd's
  // corner handles sit at the un-rotated bbox corners, so dragging the
  // visual-right corner actually grows H (the un-rotated vertical axis)
  // instead of the visual-width the contractor expects. This was the
  // explicit v1 mitigation in the rotation plan's premortem.
  //
  // Sliders/faders at cardinal angles (90/270) are EXEMPT — EP6-B's
  // auto-swap rotates the bbox along with the visual, so the handles
  // align naturally. Other rotated controls (knobs, buttons at any
  // angle; faders at non-cardinal angles) get the resize lock.
  //
  // To resize a rotated control: open Properties → Rotate row → set to
  // 0°, resize, then re-rotate. Custom angle input remains available.
  const isFaderType = control.type === 'fader' || control.type === 'slider';
  const isCardinalRotation = control.rotation === 90 || control.rotation === 270;
  const hasCssRotation = !!control.rotation && !(isFaderType && isCardinalRotation);
  const canResize = !isLocked && !isResizeLocked && !hasCssRotation && (isSelected || !isTooSmallToResize);

  // Controls can be dragged freely — section boundaries are decorative only.

  return (
    <>
      <Rnd
        position={{ x: relX + circleOffsetX, y: relY + circleOffsetY }}
        size={{ width: wrapperW, height: wrapperH }}
        scale={zoom}
        dragGrid={[snapGrid, snapGrid]}
        resizeGrid={[snapGrid, snapGrid]}
        // Circle controls always lock aspect ratio — a circle resized into
        // an oval looks wrong and would snap back to square on next render.
        lockAspectRatio={shiftHeld || isCircleShape}
        disableDragging={isLocked}
        enableResizing={canResize ? {
          topRight: true, bottomRight: true, bottomLeft: true, topLeft: true,
          top: false, right: false, bottom: false, left: false,
        } : false}
        resizeHandleStyles={isSelected && canResize ? {
          bottomRight: { width: 10, height: 10, right: -5, bottom: -5, background: '#3b82f6', borderRadius: '50%', cursor: 'nwse-resize' },
          bottomLeft: { width: 10, height: 10, left: -5, bottom: -5, background: '#3b82f6', borderRadius: '50%', cursor: 'nesw-resize' },
          topRight: { width: 10, height: 10, right: -5, top: -5, background: '#3b82f6', borderRadius: '50%', cursor: 'nesw-resize' },
          topLeft: { width: 10, height: 10, left: -5, top: -5, background: '#3b82f6', borderRadius: '50%', cursor: 'nwse-resize' },
        } : undefined}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        style={{
          outline: isSelected
            ? `2px solid ${isLocked ? 'rgba(234,179,8,0.6)' : 'rgba(59,130,246,0.8)'}`
            : 'none',
          outlineOffset: 1,
          borderRadius: 2,
          zIndex: (control.zOrder ?? 0) * 10 + (isSelected ? 8 : 0) + 5,
          boxShadow: isSelected
            ? isLocked ? '0 0 8px 2px rgba(234,179,8,0.2)' : '0 0 8px 2px rgba(59,130,246,0.3)'
            : 'none',
          opacity: isLocked ? 0.5 : controlScale < 1 ? (isSelected ? 1 : 0.7) : 1,
          cursor: isLocked ? 'not-allowed' : 'move',
          pointerEvents: 'auto',
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        className="control-node"
      >
        {/* Lock icon badge (top-right) */}
        {(isLocked || isResizeLocked) && (
          <div
            className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border pointer-events-none ${
              isLocked
                ? 'bg-yellow-900/80 text-yellow-400 border-yellow-600'
                : 'bg-blue-900/80 text-blue-400 border-blue-600'
            }`}
            style={{ zIndex: 20 }}
            title={isLocked ? 'Fully Locked' : 'Size Locked'}
          >
            <svg className="h-2.5 w-2.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 9a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z" />
              {isLocked && (
                <path d="M6 5a2 2 0 1 1 4 0v3H6V5z" />
              )}
            </svg>
          </div>
        )}

        {/* Control rendering — fills the container (container = visual) */}
        {/* Faders re-lay-out natively for 90/270; skip CSS rotation to avoid double-rotation. */}
        <div
          className="flex h-full w-full items-center justify-center pointer-events-none overflow-visible"
          style={(() => {
            const isFader = control.type === 'fader' || control.type === 'slider';
            const isCardinal = control.rotation === 90 || control.rotation === 270;
            const skip = isFader && isCardinal;
            return {
              transform: !skip && control.rotation ? `rotate(${control.rotation}deg)` : undefined,
              transformOrigin: !skip && control.rotation ? 'center' : undefined,
            };
          })()}
        >
          {renderControl(control, isSelected, allControls, controlScale)}
        </div>
      </Rnd>

      {/* Floating label — rendered OUTSIDE the Rnd container */}
      {/* Labels rendered by LabelLayer — not inside ControlNode */}

      {/* Inline label editor — positioned near the floating label */}
      {isEditing && (
        <div
          className="absolute"
          style={{
            left: relX,
            top: control.labelPosition === 'above'
              ? relY - 16
              : relY + control.h * controlScale + 2,
            width: Math.max(control.w * controlScale, 80),
            zIndex: 60,
            pointerEvents: 'auto',
          }}
        >
          <textarea
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleEditKeyDown}
            rows={Math.max(1, editValue.split('\n').length)}
            className="w-full bg-gray-900 border border-blue-500 text-[10px] text-white px-1 py-0.5 rounded text-center outline-none resize-none"
            style={{ maxWidth: Math.max(control.w, 80) }}
          />
        </div>
      )}
    </>
  );
}
