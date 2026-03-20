'use client';

import { useCallback, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import { useEditorStore } from './store';
import type { ControlDef } from './store';
import PanelButton from '@/components/controls/PanelButton';
import Knob from '@/components/controls/Knob';
import Slider from '@/components/controls/Slider';
import LEDIndicator from '@/components/controls/LEDIndicator';
import Wheel from '@/components/controls/Wheel';
import PadButton from '@/components/controls/PadButton';
import ValueDial from '@/components/controls/ValueDial';
import Lever from '@/components/controls/Lever';

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
  // 'left' and 'right' don't map to PanelButton — fall back to 'on'
  return 'on';
}

/** Render the real hardware control component based on control type */
function renderControl(control: ControlDef, isSelected: boolean) {
  switch (control.type) {
    case 'button': {
      if (control.shape === 'circle') {
        const diameter = Math.min(control.w, control.h);
        return (
          <div className="flex flex-col items-center gap-1" data-control-id={control.id}>
            <div
              className="rounded-full flex items-center justify-center cursor-pointer"
              style={{
                width: diameter,
                height: diameter,
                backgroundColor: '#2a2a2a',
                border: '2px solid #444',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              <span className="text-[8px] font-medium text-gray-300 uppercase text-center leading-tight px-1">
                {control.label}
              </span>
            </div>
          </div>
        );
      }
      const btnSize: 'sm' | 'md' | 'lg' =
        control.h <= 32 ? 'sm' : control.h <= 48 ? 'md' : 'lg';
      return (
        <PanelButton
          id={control.id}
          label={control.label}
          highlighted={isSelected}
          size={btnSize}
          labelPosition={mapButtonLabelPosition(control.labelPosition)}
        />
      );
    }
    case 'knob': {
      const knobSize: 'sm' | 'md' = control.w <= 48 ? 'sm' : 'md';
      return (
        <Knob
          id={control.id}
          label={control.label}
          highlighted={isSelected}
          size={knobSize}
        />
      );
    }
    case 'fader':
    case 'slider':
      return (
        <Slider
          id={control.id}
          label={control.label}
          highlighted={isSelected}
          trackHeight={control.h - 20}
          trackWidth={control.w - 10}
        />
      );
    case 'led':
    case 'indicator': {
      if (control.ledVariant === 'dual-label') {
        // Dual-label indicator (e.g., VINYL/CDJ — top and bottom rows)
        const parts = control.label.split('/').map(s => s.trim());
        const topLabel = parts[0] || 'MODE A';
        const bottomLabel = parts[1] || 'MODE B';
        return (
          <div
            className="flex flex-col rounded overflow-hidden"
            style={{ width: Math.max(control.w, 48), border: '1px solid #333' }}
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
                    backgroundColor: '#22c55e',
                    boxShadow: '0 0 4px #22c55e',
                  }}
                />
                <span className="text-[8px] font-medium text-green-400 uppercase">
                  {topLabel}
                </span>
              </div>
            </div>
            {/* Bottom mode */}
            <div
              className="flex items-center justify-center py-1 px-2"
              style={{ backgroundColor: '#1a1a2a' }}
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="rounded-full"
                  style={{
                    width: 6, height: 6,
                    backgroundColor: '#333',
                    border: '1px solid #444',
                  }}
                />
                <span className="text-[8px] font-medium text-gray-500 uppercase">
                  {bottomLabel}
                </span>
              </div>
            </div>
          </div>
        );
      }
      // Default: simple green dot indicator
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
              backgroundColor: '#22c55e',
              border: '3px solid #166534',
              boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)',
            }}
          />
          <span className="text-[7px] text-gray-400 uppercase truncate w-full text-center leading-tight">
            {control.label}
          </span>
        </div>
      );
    }
    case 'wheel':
      return (
        <Wheel
          id={control.id}
          label={control.label}
          highlighted={isSelected}
          width={control.w}
          height={control.h}
        />
      );
    case 'pad':
      return (
        <PadButton
          id={control.id}
          label={control.label}
          highlighted={isSelected}
          width={control.w}
          height={control.h}
        />
      );
    case 'encoder': {
      const dialSize: 'sm' | 'lg' = control.w <= 48 ? 'sm' : 'lg';
      return (
        <ValueDial
          id={control.id}
          label={control.label}
          highlighted={isSelected}
          size={dialSize}
        />
      );
    }
    case 'switch':
    case 'lever': {
      // Lever default height is ~62px at scale=1. Derive scale from control height.
      const leverScale = control.h / 62;
      return (
        <Lever
          id={control.id}
          label={control.label}
          highlighted={isSelected}
          scale={leverScale}
        />
      );
    }
    case 'screen':
    case 'display':
      return (
        <div className="flex h-full w-full items-center justify-center rounded border border-gray-700 bg-gray-900 text-xs text-gray-500">
          {control.label}
        </div>
      );
    default:
      return <div className="text-xs text-red-400">Unknown: {control.type}</div>;
  }
}

export default function ControlNode({ controlId, sectionId }: ControlNodeProps) {
  const control = useEditorStore((s) => s.controls[controlId]);
  const section = useEditorStore((s) => s.sections[sectionId]);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const zoom = useEditorStore((s) => s.zoom);
  const snapGrid = useEditorStore((s) => s.snapGrid);
  const moveControl = useEditorStore((s) => s.moveControl);
  const moveSelectedControls = useEditorStore((s) => s.moveSelectedControls);
  const resizeControl = useEditorStore((s) => s.resizeControl);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);
  const toggleSelected = useEditorStore((s) => s.toggleSelected);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const updateControlProp = useEditorStore((s) => s.updateControlProp);

  const isSelected = selectedIds.includes(controlId);
  const isMultiSelected = isSelected && selectedIds.length > 1;

  // ── Inline label editing (component-local state) ──────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Control positions are absolute canvas coords in the store.
  // Inside a SectionFrame they render relative to the section origin.
  const relX = control ? control.x - section.x : 0;
  const relY = control ? control.y - section.y : 0;

  // Track drag start position for multi-select delta computation
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleDragStart = useCallback(
    (_e: unknown, d: { x: number; y: number }) => {
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
      const newW = parseInt(ref.style.width, 10);
      const newH = parseInt(ref.style.height, 10);
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
      if (e.shiftKey || e.metaKey) {
        toggleSelected(controlId);
      } else {
        setSelectedIds([controlId]);
      }
    },
    [controlId, toggleSelected, setSelectedIds],
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
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        commitEdit();
      } else if (e.key === 'Escape') {
        cancelEdit();
      }
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

  const isLocked = control.locked;

  // Detect if any part of the control extends outside its parent section bounds
  const isOutOfBounds =
    control.x < section.x ||
    control.y < section.y ||
    control.x + control.w > section.x + section.w ||
    control.y + control.h > section.y + section.h;

  return (
    <Rnd
      position={{ x: relX, y: relY }}
      size={{ width: control.w, height: control.h }}
      scale={zoom}
      dragGrid={[snapGrid, snapGrid]}
      resizeGrid={[snapGrid, snapGrid]}
      disableDragging={isLocked}
      enableResizing={!isLocked}
      onDragStart={handleDragStart}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      style={{
        outline: isOutOfBounds
          ? '2px solid rgba(239,68,68,0.8)'
          : isSelected
            ? '2px solid rgba(59,130,246,0.8)'
            : 'none',
        outlineOffset: 1,
        borderRadius: 2,
        zIndex: isSelected ? 10 : 1,
        boxShadow: isOutOfBounds
          ? '0 0 8px 2px rgba(239,68,68,0.3)'
          : isSelected
            ? '0 0 8px 2px rgba(59,130,246,0.3)'
            : 'none',
        opacity: isLocked ? 0.7 : 1,
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

      {/* Control rendering */}
      <div className="flex h-full w-full items-center justify-center overflow-hidden pointer-events-none">
        {renderControl(control, isSelected)}
      </div>

      {/* Inline label editor overlay */}
      {isEditing && (
        <div
          className="absolute inset-x-0 bottom-0 flex items-center justify-center"
          style={{ zIndex: 30, pointerEvents: 'auto' }}
        >
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleEditKeyDown}
            className="w-full bg-gray-900 border border-blue-500 text-[10px] text-white px-1 py-0.5 rounded text-center outline-none"
            style={{ maxWidth: control.w }}
          />
        </div>
      )}
    </Rnd>
  );
}
