'use client';

import { useCallback, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import { useEditorStore } from './store';
import type { ControlDef } from './store';
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
import { HARDWARE_ICONS } from '@/lib/hardware-icons';

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

/** Resolve the display text for a control — icon or label */
function resolveDisplayContent(control: ControlDef): { text: string; isIcon: boolean } {
  if (control.icon && control.labelDisplay === 'icon-only') {
    const iconChar = HARDWARE_ICONS[control.icon] ?? control.icon;
    return { text: iconChar, isIcon: true };
  }
  return { text: control.label, isIcon: false };
}

/** Compute the font size for a floating label based on control properties */
function labelFontSize(control: ControlDef): number {
  return control.labelFontSize
    ?? (control.sizeClass === 'xl' ? 11 : control.sizeClass === 'lg' ? 10 : control.sizeClass === 'sm' ? 7 : 8);
}

/** Should this control show a floating label outside the Rnd container? */
function shouldShowFloatingLabel(control: ControlDef): boolean {
  const effectivePos = control.labelDisplay ?? control.labelPosition;
  if (effectivePos === 'hidden') return false;
  if (control.labelPosition === 'on-button') {
    // on-button labels are rendered by the component itself — no floating needed
    return false;
  }
  if (!control.label) return false;
  return true;
}

/** Render the floating label element positioned absolutely outside the Rnd container.
 *  `relX` / `relY` are the control position relative to the parent section. */
function renderFloatingLabel(
  control: ControlDef,
  relX: number,
  relY: number,
  scale: number = 1,
): React.ReactNode {
  if (!shouldShowFloatingLabel(control)) return null;

  // Use visual dimensions (scaled) for label positioning
  const visW = control.w * scale;
  const visH = control.h * scale;
  const pos = control.labelPosition;
  const fontSize = labelFontSize(control);
  const effectivePos = control.labelDisplay ?? pos;

  // on-button with secondary label — float the secondary label below the control
  if (pos === 'on-button') {
    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: relX,
          top: relY + visH + 2,
          width: visW,
          zIndex: 1,
        }}
      >
        <span
          className="font-medium text-gray-500 uppercase text-center leading-tight break-words w-full block"
          style={{ fontSize: Math.max(fontSize - 2, 6) }}
        >
          {control.secondaryLabel}
        </span>
      </div>
    );
  }

  // icon-only: the icon is on the button face, the text label floats outside
  // (pos can't be 'on-button' here — that case early-returns above)
  const showPrimaryLabel = effectivePos !== 'icon-only' || pos !== 'hidden';

  // Build the label content
  const secondaryLabel = control.secondaryLabel;
  const primaryLabelText = control.primaryLabel ?? control.label;

  const labelContent = secondaryLabel && effectivePos !== 'icon-only' ? (
    <>
      <div className="flex items-center gap-1 w-full justify-center">
        <span
          className="font-medium text-gray-400 uppercase leading-tight break-words"
          style={{ fontSize }}
        >
          {renderLabelText(primaryLabelText)}
        </span>
        <span className="text-gray-600" style={{ fontSize: fontSize - 1 }}>/</span>
        <span
          className="font-medium text-gray-500 uppercase leading-tight break-words"
          style={{ fontSize: fontSize - 1 }}
        >
          {secondaryLabel}
        </span>
      </div>
    </>
  ) : (
    <>
      {showPrimaryLabel && (
        <span
          className="font-medium text-gray-400 uppercase text-center leading-tight break-words w-full block"
          style={{ fontSize }}
        >
          {renderLabelText(control.label)}
        </span>
      )}
      {secondaryLabel && (
        <span
          className="font-medium text-gray-500 uppercase text-center leading-tight break-words w-full block"
          style={{ fontSize: Math.max(fontSize - 1, 6) }}
        >
          {secondaryLabel}
        </span>
      )}
    </>
  );

  // Compute position based on labelPosition
  const labelStyle: React.CSSProperties = { zIndex: 1 };

  // Estimate label height for positioning (primary + optional secondary)
  const lineH = fontSize + 2;
  const totalLabelH = secondaryLabel ? lineH * 2 : lineH;

  switch (pos) {
    case 'above':
      labelStyle.left = relX;
      labelStyle.top = relY - totalLabelH - 2;
      labelStyle.width = visW;
      labelStyle.textAlign = 'center';
      break;
    case 'below':
    default:
      labelStyle.left = relX;
      labelStyle.top = relY + visH + 2;
      labelStyle.width = visW;
      labelStyle.textAlign = 'center';
      break;
    case 'left':
      labelStyle.top = relY + (visH - totalLabelH) / 2;
      labelStyle.left = relX - 60;
      labelStyle.width = 56;
      labelStyle.textAlign = 'right';
      break;
    case 'right':
      labelStyle.left = relX + visW + 4;
      labelStyle.top = relY + (visH - totalLabelH) / 2;
      labelStyle.width = 56;
      labelStyle.textAlign = 'left';
      break;
  }

  return (
    <div
      className="absolute pointer-events-none"
      style={labelStyle}
    >
      {labelContent}
    </div>
  );
}

/** Render a small LED dot indicator for buttons with hasLed */
function renderButtonLed(control: ControlDef) {
  if (!control.hasLed || (control.type !== 'button' && control.type !== 'pad')) return null;
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
  // For 'above', 'below', 'ring' — render above by default (handled by PanelButton's hasLed prop)
  return null;
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
                  className="font-medium text-gray-300 uppercase text-center leading-tight px-1"
                  style={{ fontSize: isIcon ? 14 : 8 }}
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

      // Determine icon content
      const iconContent = (control.icon && control.labelDisplay === 'icon-only')
        ? (HARDWARE_ICONS[control.icon] ?? control.icon)
        : undefined;

      const buttonEl = (
        <div className="relative">
          {renderButtonLed(control)}
          <PanelButton
            id={control.id}
            label={control.labelPosition === 'on-button' ? control.label : (iconContent ?? '')}
            highlighted={isSelected}
            width={visW}
            height={visH}
            variant={variant}
            surfaceColor={control.surfaceColor ?? undefined}
            iconContent={iconContent}
            hasLed={control.hasLed && control.ledPosition !== 'inside'}
            ledColor={control.ledColor ?? undefined}
            labelPosition={mapButtonLabelPosition(control.labelPosition)}
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
        const parts = control.label.split('/').map(s => s.trim());
        const topLabel = parts[0] || 'MODE A';
        const bottomLabel = parts[1] || 'MODE B';
        return (
          <div
            className="flex flex-col rounded overflow-hidden"
            style={{ width: Math.max(visW, 48), border: '1px solid #333' }}
            data-control-id={control.id}
          >
            {/* Top mode */}
            <div
              className="flex items-center justify-center py-1 px-2"
              style={{
                backgroundColor: '#0a2e1a',
                borderBottom: '1px solid #333',
              }}
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="rounded-full"
                  style={{
                    width: 6, height: 6,
                    backgroundColor: ledColor,
                    boxShadow: `0 0 4px ${ledColor}`,
                  }}
                />
                <span className="text-[8px] font-medium text-green-400 uppercase">
                  {topLabel}
                </span>
              </div>
            </div>
            {/* Bottom mode (dimmed — shows the alternate color at low opacity) */}
            <div
              className="flex items-center justify-center py-1 px-2"
              style={{ backgroundColor: '#1a1a2a' }}
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="rounded-full"
                  style={{
                    width: 6, height: 6,
                    backgroundColor: `${ledColor}33`,
                    border: `1px solid ${ledColor}66`,
                  }}
                />
                <span className="text-[8px] font-medium uppercase" style={{ color: `${ledColor}88` }}>
                  {bottomLabel}
                </span>
              </div>
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
      // Default: simple dot indicator
      return (
        <div
          className="flex flex-col items-center justify-center gap-1 rounded"
          style={{ backgroundColor: '#1a1a2a', padding: 4 }}
          data-control-id={control.id}
        >
          <div
            className="rounded-full"
            style={{
              width: 20,
              height: 20,
              backgroundColor: ledColor,
              border: `3px solid ${ledColor}44`,
              boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)',
            }}
          />
          <span className="text-[7px] text-gray-400 uppercase break-words w-full text-center leading-tight">
            {renderLabelText(control.label)}
          </span>
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
  const section = useEditorStore((s) => s.sections[sectionId]);
  const selectedIds = useEditorStore((s) => s.selectedIds);
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

  const isSelected = selectedIds.includes(controlId);
  const isMultiSelected = isSelected && selectedIds.length > 1;

  // ── Inline label editing (component-local state) ──────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Control positions are absolute canvas coords in the store.
  // Inside a SectionFrame they render relative to the section origin.
  const relX = control ? control.x - section.x : 0;
  const relY = control ? control.y - section.y : 0;

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
      if (dx === 0 && dy === 0) return;

      // Snapshot BEFORE mutation so undo restores the previous state
      pushSnapshot();
      if (isMultiSelected) {
        // Move all selected (non-locked) controls by the same delta
        moveSelectedControls(dx, dy);
      } else {
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
      // Focus the parent section so it raises above other sections
      setFocusedSection(sectionId);
      if (e.shiftKey || e.metaKey) {
        toggleSelected(controlId);
      } else {
        setSelectedIds([controlId]);
      }
    },
    [controlId, sectionId, toggleSelected, setSelectedIds, setFocusedSection],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!control) return;
      setEditValue(control.label);
      setIsEditing(true);
      // Focus the input after React renders it
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    },
    [control],
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

  if (!control || !section) return null;

  // Skip rendering for controls nested inside another (rendered by composite parent)
  if (control.nestedIn && allControls[control.nestedIn]) return null;

  const isLocked = control.locked;

  // Controls can be dragged freely — section boundaries are decorative only.

  return (
    <>
      <Rnd
        position={{ x: relX, y: relY }}
        size={{ width: control.w * controlScale, height: control.h * controlScale }}
        scale={zoom}
        dragGrid={[snapGrid, snapGrid]}
        resizeGrid={[snapGrid, snapGrid]}
        lockAspectRatio
        disableDragging={isLocked}
        enableResizing={!isLocked}
        resizeHandleStyles={isSelected ? {
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
            ? '2px solid rgba(59,130,246,0.8)'
            : 'none',
          outlineOffset: 1,
          borderRadius: 2,
          zIndex: isSelected ? 50 : 1,
          boxShadow: isSelected
            ? '0 0 8px 2px rgba(59,130,246,0.3)'
            : 'none',
          opacity: isLocked ? 0.5 : controlScale < 1 ? (isSelected ? 1 : 0.7) : 1,
          cursor: isLocked ? 'not-allowed' : 'move',
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        className="control-node"
      >
        {/* Lock icon badge (top-right) */}
        {isLocked && (
          <div
            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-[8px] text-yellow-400 border border-gray-600 pointer-events-none"
            style={{ zIndex: 20 }}
            title="Locked"
          >
            L
          </div>
        )}

        {/* Control rendering — fills the container (container = visual) */}
        <div
          className="flex h-full w-full items-center justify-center pointer-events-none overflow-hidden"
          style={{
            transform: control.rotation ? `rotate(${control.rotation}deg)` : undefined,
            transformOrigin: control.rotation ? 'center' : undefined,
          }}
        >
          {renderControl(control, isSelected, allControls, controlScale)}
        </div>
      </Rnd>

      {/* Floating label — rendered OUTSIDE the Rnd container */}
      {showLabels && renderFloatingLabel(control, relX, relY, controlScale)}

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
