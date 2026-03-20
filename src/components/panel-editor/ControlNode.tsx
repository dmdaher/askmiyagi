'use client';

import { useCallback } from 'react';
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

/** Render the real hardware control component based on control type */
function renderControl(control: ControlDef, isSelected: boolean) {
  switch (control.type) {
    case 'button':
      return (
        <PanelButton
          id={control.id}
          label={control.label}
          highlighted={isSelected}
        />
      );
    case 'knob':
      return (
        <Knob
          id={control.id}
          label={control.label}
          highlighted={isSelected}
        />
      );
    case 'fader':
    case 'slider':
      return (
        <Slider
          id={control.id}
          label={control.label}
          highlighted={isSelected}
        />
      );
    case 'led':
    case 'indicator':
      return (
        <LEDIndicator
          id={control.id}
          highlighted={isSelected}
        />
      );
    case 'wheel':
      return (
        <Wheel
          id={control.id}
          label={control.label}
          highlighted={isSelected}
        />
      );
    case 'pad':
      return (
        <PadButton
          id={control.id}
          label={control.label}
          highlighted={isSelected}
        />
      );
    case 'encoder':
      return (
        <ValueDial
          id={control.id}
          label={control.label}
          highlighted={isSelected}
        />
      );
    case 'switch':
    case 'lever':
      return (
        <Lever
          id={control.id}
          label={control.label}
          highlighted={isSelected}
        />
      );
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
  const resizeControl = useEditorStore((s) => s.resizeControl);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);
  const toggleSelected = useEditorStore((s) => s.toggleSelected);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);

  const isSelected = selectedIds.includes(controlId);

  // Control positions are absolute canvas coords in the store.
  // Inside a SectionFrame they render relative to the section origin.
  const relX = control ? control.x - section.x : 0;
  const relY = control ? control.y - section.y : 0;

  const handleDragStop = useCallback(
    (_e: unknown, d: { x: number; y: number }) => {
      // d.x/d.y are new positions relative to the section (parent Rnd)
      // Convert delta back to canvas-space
      const dx = d.x - relX;
      const dy = d.y - relY;
      if (dx !== 0 || dy !== 0) {
        moveControl(controlId, dx, dy);
        pushSnapshot();
      }
    },
    [relX, relY, controlId, moveControl, pushSnapshot],
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
      // Handle position shift from top/left resize handles
      const dx = position.x - relX;
      const dy = position.y - relY;
      if (dx !== 0 || dy !== 0) {
        moveControl(controlId, dx, dy);
      }
      resizeControl(controlId, newW, newH);
      pushSnapshot();
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

  if (!control || !section) return null;

  return (
    <Rnd
      position={{ x: relX, y: relY }}
      size={{ width: control.w, height: control.h }}
      scale={zoom}
      dragGrid={[snapGrid, snapGrid]}
      resizeGrid={[snapGrid, snapGrid]}
      disableDragging={control.locked}
      enableResizing={!control.locked}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      style={{
        outline: isSelected
          ? '2px solid rgba(59,130,246,0.8)'
          : 'none',
        outlineOffset: 1,
        borderRadius: 2,
        zIndex: isSelected ? 10 : 1,
        boxShadow: isSelected
          ? '0 0 8px 2px rgba(59,130,246,0.3)'
          : 'none',
      }}
      onClick={handleClick}
    >
      <div className="flex h-full w-full items-center justify-center overflow-hidden pointer-events-none">
        {renderControl(control, isSelected)}
      </div>
    </Rnd>
  );
}
