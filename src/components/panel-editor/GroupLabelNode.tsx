'use client';

import { useCallback, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import { useEditorStore } from './store';
import type { GroupLabel } from '@/types/manifest';

interface GroupLabelNodeProps {
  groupLabel: GroupLabel;
}

export default function GroupLabelNode({ groupLabel }: GroupLabelNodeProps) {
  const controls = useEditorStore((s) => s.controls);
  const zoom = useEditorStore((s) => s.zoom);
  const snapGrid = useEditorStore((s) => s.snapGrid);

  // Compute bounding box from the controls this label spans
  const memberControls = groupLabel.controlIds
    .map((id) => controls[id])
    .filter(Boolean);

  if (memberControls.length === 0) return null;

  const minX = Math.min(...memberControls.map((c) => c.x));
  const maxX = Math.max(...memberControls.map((c) => c.x + c.w));
  const minY = Math.min(...memberControls.map((c) => c.y));
  const maxY = Math.max(...memberControls.map((c) => c.y + c.h));

  const spanW = maxX - minX;
  const defaultH = 18;
  const labelY = groupLabel.position === 'above' ? minY - defaultH - 4 : maxY + 4;

  // Local state for position and size (persists during session)
  const [pos, setPos] = useState({ x: minX, y: labelY });
  const [size, setSize] = useState({ w: spanW, h: defaultH });
  const [isSelected, setIsSelected] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(groupLabel.text);
  const [fontSize, setFontSize] = useState(9);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragStop = useCallback(
    (_e: unknown, d: { x: number; y: number }) => {
      setPos({ x: d.x, y: d.y });
    },
    [],
  );

  const handleResizeStop = useCallback(
    (_e: unknown, _dir: unknown, ref: HTMLElement, _delta: unknown, position: { x: number; y: number }) => {
      setSize({
        w: parseInt(ref.style.width, 10),
        h: parseInt(ref.style.height, 10),
      });
      setPos({ x: position.x, y: position.y });
    },
    [],
  );

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSelected(true);
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditText(groupLabel.text);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [groupLabel.text]);

  return (
    <Rnd
      position={{ x: pos.x, y: pos.y }}
      size={{ width: size.w, height: size.h }}
      scale={zoom}
      dragGrid={[snapGrid, snapGrid]}
      resizeGrid={[snapGrid, snapGrid]}
      enableResizing
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      style={{
        zIndex: 2,
        outline: isSelected ? '1px solid rgba(147,130,246,0.6)' : 'none',
        borderRadius: 2,
        cursor: 'move',
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="flex items-center justify-center w-full h-full select-none"
        style={{
          borderBottom: groupLabel.position === 'above' ? '1px solid rgba(255,255,255,0.1)' : undefined,
          borderTop: groupLabel.position === 'below' ? '1px solid rgba(255,255,255,0.1)' : undefined,
        }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') setIsEditing(false);
              if (e.key === 'Escape') { setEditText(groupLabel.text); setIsEditing(false); }
            }}
            className="w-full bg-transparent text-center text-gray-300 uppercase tracking-widest outline-none border-b border-blue-500"
            style={{ fontSize }}
          />
        ) : (
          <span
            className="font-semibold text-gray-400 uppercase tracking-widest text-center leading-tight truncate"
            style={{ fontSize }}
          >
            {groupLabel.text}
          </span>
        )}
      </div>

      {/* Font size control (visible when selected) */}
      {isSelected && !isEditing && (
        <div
          className="absolute -bottom-6 left-0 flex items-center gap-1 bg-gray-900 border border-gray-700 rounded px-1 py-0.5"
          style={{ zIndex: 10, pointerEvents: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setFontSize(Math.max(6, fontSize - 1))}
            className="text-[9px] text-gray-400 hover:text-white w-4 h-4 flex items-center justify-center"
          >
            -
          </button>
          <span className="text-[8px] text-gray-500">{fontSize}</span>
          <button
            onClick={() => setFontSize(Math.min(16, fontSize + 1))}
            className="text-[9px] text-gray-400 hover:text-white w-4 h-4 flex items-center justify-center"
          >
            +
          </button>
        </div>
      )}
    </Rnd>
  );
}
