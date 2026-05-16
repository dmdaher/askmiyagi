'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import { useEditorStore } from './store';
import type { ControlDef } from './store';
import type { ControlGroup } from './store/historySlice';
import { isControlSelected, selectedControlIds } from './store/selection-types';
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
import { HARDWARE_ICONS, HARDWARE_ICON_SVGS } from '@/lib/hardware-icons';

/** Render label text with \n as line breaks */
function renderLabelText(text: string): React.ReactNode {
  if (!text.includes('\n')) return text;
  return text.split('\n').map((line, i) => (
    <span key={i}>
      {i > 0 && <br />}
      {line}
    </span>
  ));
}

interface ControlNodeProps {
  controlId: string;
  sectionId: string;
}

/** Map editor labelPosition to PanelButton's labelPosition prop */
function mapButtonLabelPosition(
  lp: ControlDef['labelPosition'],
): 'on' | 'above' | 'below' {
  if (lp === 'on-button') return 'on';
  if (lp === 'above') return 'above';
  if (lp === 'below') return 'below';
  // 'left', 'right', 'hidden' don't map to PanelButton — fall back to 'on'
  return 'on';
}

/** Resolve the display text for a control — icon, SVG, or label */
function resolveDisplayContent(control: ControlDef): { text: string; isIcon: boolean; svgIcon?: React.ReactNode } {
  if (control.icon && control.labelDisplay === 'icon-only') {
    const svg = HARDWARE_ICON_SVGS[control.icon];
    if (svg) return { text: '', isIcon: true, svgIcon: svg };
    const iconChar = HARDWARE_ICONS[control.icon] ?? control.icon;
    return { text: iconChar, isIcon: true };
  }
  return { text: control.label, isIcon: false };
}

/** Render a small LED dot indicator for buttons with hasLed (dot style only) */
function renderButtonLed(control: ControlDef) {
  if (!control.hasLed || (control.type !== 'button' && control.type !== 'pad')) return null;
  // Integrated LED buttons glow via PanelButton styling — no separate dot
  if (control.ledStyle === 'integrated') return null;
  const color = control.ledColor ?? '#22c55e';
  const position = control.ledPosition ?? 'above';

  const ledDot = (
    <div
      className="rounded-full"
      style={{
        width: 6,
        height: 6,
        backgroundColor: color,
        boxShadow: `0 0 4px 1px ${color}`,
      }}
    />
  );

  // Position the LED relative to the button
  if (position === 'inside') {
    return (
      <div className="absolute top-1 right-1" style={{ zIndex: 5 }}>
        {ledDot}
      </div>
    );
  }
  // For 'above', 'below', 'ring' — render above the control as absolute overlay
  return (
    <div className="absolute -top-2 left-1/2 -translate-x-1/2" style={{ zIndex: 5 }}>
      {ledDot}
    </div>
  );
}

/** Infer Port variant from label text */
function inferPortVariant(label: string): 'usb-a' | 'sd-card' | 'ethernet' | 'rca' {
  const lower = label.toLowerCase();
  if (lower.includes('sd') || lower.includes('card')) return 'sd-card';
  if (lower.includes('ethernet') || lower.includes('lan') || lower.includes('link')) return 'ethernet';
  if (lower.includes('rca') || lower.includes('phono')) return 'rca';
  return 'usb-a';
}

/** Render the real hardware control component based on control type */
function renderControl(control: ControlDef, isSelected: boolean, allControls: Record<string, ControlDef>, controlScale: number = 1) {
  // Visual size = container size = stored w/h * controlScale
  const visW = Math.round(control.w * controlScale);
  const visH = Math.round(control.h * controlScale);
  // Skip controls that are nested inside another control (e.g., display nested in jog wheel)
  if (control.nestedIn && allControls[control.nestedIn]) {
    // This control is part of a composite — it will be rendered by the parent
    return null;
  }

  switch (control.type) {
    case 'button': {
      // Dual-label buttons render as LED indicator regardless of type
      if (control.ledVariant === 'dual-label') {
        const ledColor = control.ledColor ?? '#22c55e';
        const parts = control.label.split(/[\/\n]/).map(s => s.trim()).filter(Boolean);
        return (
          <div className="flex flex-col rounded overflow-hidden"
            style={{ width: visW, height: visH, border: '1px solid #333' }}
            data-control-id={control.id}>
            <div className="flex flex-1 items-center justify-center py-0.5 px-1"
              style={{ backgroundColor: '#0a2e1a', borderBottom: '1px solid #333' }}>
              <span className="text-[7px] font-medium text-green-400 uppercase truncate">{parts[0] || 'MODE A'}</span>
            </div>
            <div className="flex flex-1 items-center justify-center py-0.5 px-1"
              style={{ backgroundColor: '#1a1a2a' }}>
              <span className="text-[7px] font-medium uppercase truncate" style={{ color: `${ledColor}88` }}>{parts[1] || 'MODE B'}</span>
            </div>
          </div>
        );
      }
      if (control.shape === 'circle') {
        const diameter = Math.min(control.w, control.h);
        const { text, isIcon } = resolveDisplayContent(control);
        // Only show text inside the circle if label is on-button or icon-only
        const showInside = control.labelPosition === 'on-button' || control.labelDisplay === 'icon-only';
        const circleButton = (
          <div className="relative" data-control-id={control.id}>
            {renderButtonLed(control)}
            <div
              className="rounded-full flex items-center justify-center cursor-pointer"
              style={{
                width: diameter,
                height: diameter,
                backgroundColor: '#2a2a2a',
                border: `3px solid ${control.surfaceColor ?? '#444'}`,
                boxShadow: control.surfaceColor
                  ? `inset 0 2px 4px rgba(0,0,0,0.4), 0 0 8px ${control.surfaceColor}40, 0 1px 0 rgba(255,255,255,0.05)`
                  : 'inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {showInside && (
                <span
                  className={`font-medium uppercase text-center leading-tight ${isIcon ? 'whitespace-nowrap' : 'w-full px-1'}`}
                  style={{
                    fontSize: control.labelFontSize ?? (isIcon ? Math.max(Math.round(diameter * 0.35), 8) : 8),
                    color: control.labelColor ?? '#d1d5db',
                    overflowWrap: isIcon ? undefined : 'break-word',
                  }}
                >
                  {text}
                </span>
              )}
            </div>
          </div>
        );
        return circleButton;
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
            hasLed={control.hasLed && control.ledStyle === 'integrated'}
            ledColor={control.ledColor ?? undefined}
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
        />
      );
    case 'led':
    case 'indicator': {
      const ledColor = control.ledColor ?? '#22c55e';
      if (control.ledVariant === 'dual-label') {
        // Dual-label indicator (e.g., VINYL/CDJ -- top and bottom rows)
        const parts = control.label.split(/[\/\n]/).map(s => s.trim()).filter(Boolean);
        const topLabel = parts[0] || 'MODE A';
        const bottomLabel = parts[1] || 'MODE B';
        return (
          <div
            className="flex flex-col rounded overflow-hidden"
            style={{ width: visW, height: visH, border: '1px solid #333' }}
            data-control-id={control.id}
          >
            <div className="flex flex-1 items-center justify-center py-0.5 px-1"
              style={{ backgroundColor: '#0a2e1a', borderBottom: '1px solid #333' }}>
              <span className="text-[7px] font-medium text-green-400 uppercase truncate">{topLabel}</span>
            </div>
            <div className="flex flex-1 items-center justify-center py-0.5 px-1"
              style={{ backgroundColor: '#1a1a2a' }}>
              <span className="text-[7px] font-medium uppercase truncate" style={{ color: `${ledColor}88` }}>{bottomLabel}</span>
            </div>
          </div>
        );
      }
      if (control.ledVariant === 'bar') {
        return (
          <div
            className="flex flex-col items-center justify-center gap-1 rounded"
            style={{ backgroundColor: '#1a1a2a', padding: 4 }}
            data-control-id={control.id}
          >
            <div
              className="rounded-sm"
              style={{
                width: Math.max(visW - 8, 16),
                height: 6,
                backgroundColor: ledColor,
                boxShadow: `0 0 6px ${ledColor}`,
              }}
            />
            <span className="text-[7px] text-gray-400 uppercase break-words w-full text-center leading-tight">
              {renderLabelText(control.label)}
            </span>
          </div>
        );
      }
      // Default: simple dot indicator. Icons are rendered by LabelLayer.
      // No dark housing — the LED is a transparent-bg dot with a glow when on.
      //
      // Active/inactive state mirrors PanelRenderer (production):
      //   ledOn === true  → full color + glow (lit)
      //   ledOn === false → dim grey, no glow (off)
      //   ledOn undefined → treat as off (most synth LEDs default off)
      const ledIsOn = control.ledOn === true;
      const dotColor = ledIsOn ? ledColor : '#333';
      return (
        <div
          className="flex items-center justify-center"
          style={{ width: visW, height: visH }}
          data-control-id={control.id}
        >
          <div
            className="rounded-full flex-shrink-0"
            style={{
              width: Math.min(visW, visH) * 0.7,
              height: Math.min(visW, visH) * 0.7,
              minWidth: 6, minHeight: 6,
              backgroundColor: dotColor,
              border: ledIsOn ? `2px solid ${ledColor}44` : '1px solid #444',
              boxShadow: ledIsOn ? `0 0 6px ${ledColor}` : 'none',
            }}
          />
        </div>
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
        // moveSelection handles the snapshot internally.
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
      // Handle position shift from top/left resize handles
      const dx = position.x - relX;
      const dy = position.y - relY;
      if (dx !== 0 || dy !== 0) {
        moveControl(controlId, dx, dy);
      }
      resizeControl(controlId, newW, newH);
    },
    [relX, relY, controlId, moveControl, resizeControl, pushSnapshot],
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

        // Find all controls whose bounding box overlaps with this control
        const overlapping = Object.values(allCtrls).filter((c: any) => {
          if (!c || c.id === controlId || c.nestedIn) return false;
          return cx < c.x + c.w && cx + cw > c.x && cy < c.y + c.h && cy + ch > c.y;
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
  const isTooSmallToResize = Math.min(control.w * controlScale, control.h * controlScale) < 32;
  const canResize = !isLocked && !isResizeLocked && (isSelected || !isTooSmallToResize);

  // Controls can be dragged freely — section boundaries are decorative only.

  return (
    <>
      <Rnd
        position={{ x: relX, y: relY }}
        size={{ width: control.w * controlScale, height: control.h * controlScale }}
        scale={zoom}
        dragGrid={[snapGrid, snapGrid]}
        resizeGrid={[snapGrid, snapGrid]}
        lockAspectRatio={shiftHeld}
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
        <div
          className="flex h-full w-full items-center justify-center pointer-events-none overflow-visible"
          style={{
            transform: control.rotation ? `rotate(${control.rotation}deg)` : undefined,
            transformOrigin: control.rotation ? 'center' : undefined,
          }}
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
