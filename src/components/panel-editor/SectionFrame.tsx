'use client';

import { useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { useEditorStore } from './store';
import ControlNode from './ControlNode';

interface SectionFrameProps {
  sectionId: string;
  zIndex?: number;
}

export default function SectionFrame({ sectionId, zIndex = 1 }: SectionFrameProps) {
  const section = useEditorStore((s) => s.sections[sectionId]);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const focusedSectionId = useEditorStore((s) => s.focusedSectionId);
  const zoom = useEditorStore((s) => s.zoom);
  const snapGrid = useEditorStore((s) => s.snapGrid);
  const moveSection = useEditorStore((s) => s.moveSection);
  const resizeSection = useEditorStore((s) => s.resizeSection);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);

  const isSelected = selectedIds.includes(sectionId);

  const sx = section?.x ?? 0;
  const sy = section?.y ?? 0;

  const handleDragStop = useCallback(
    (_e: unknown, d: { x: number; y: number }) => {
      const dx = d.x - sx;
      const dy = d.y - sy;
      if (dx !== 0 || dy !== 0) {
        pushSnapshot();
        moveSection(sectionId, dx, dy);
      }
    },
    [sx, sy, sectionId, moveSection, pushSnapshot],
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
      pushSnapshot();
      const dx = position.x - sx;
      const dy = position.y - sy;
      if (dx !== 0 || dy !== 0) {
        moveSection(sectionId, dx, dy);
      }
      resizeSection(sectionId, newW, newH);
    },
    [sx, sy, sectionId, moveSection, resizeSection, pushSnapshot],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.control-node')) return;
      e.stopPropagation();
      setSelectedIds([sectionId]);
    },
    [sectionId, setSelectedIds],
  );

  if (!section) return null;

  return (
    <Rnd
      position={{ x: section.x, y: section.y }}
      size={{ width: section.w, height: section.h }}
      scale={zoom}
      dragGrid={[snapGrid, snapGrid]}
      resizeGrid={[snapGrid, snapGrid]}
      dragHandleClassName="section-drag-handle"
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      enableResizing
      style={{
        border: isSelected
          ? '2px solid rgba(59,130,246,0.8)'
          : '1px solid rgba(255,255,255,0.1)',
        borderRadius: 4,
        backgroundColor: isSelected
          ? 'rgba(59,130,246,0.06)'
          : 'rgba(255,255,255,0.02)',
        transition: 'border-color 0.15s, background-color 0.15s',
        zIndex: isSelected ? 100 : focusedSectionId === sectionId ? 99 : zIndex,
      }}
      className="hover:border-white/20"
      onClick={handleClick}
    >
      {/* Section drag handle — grab here to move the section */}
      <div
        className="section-drag-handle flex items-center gap-2 px-2 h-7 cursor-grab active:cursor-grabbing select-none"
        style={{
          backgroundColor: isSelected ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.08)',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '3px 3px 0 0',
        }}
      >
        <span className="text-[10px] text-gray-400">⋮⋮</span>
        <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider truncate">
          {section.headerLabel ?? sectionId}
        </span>
        <span className="text-[10px] text-gray-500 ml-auto">{(section.childIds ?? []).length}</span>
      </div>

      {/* Child controls */}
      {(section.childIds ?? []).map((id) => (
        <ControlNode key={id} controlId={id} sectionId={sectionId} />
      ))}
    </Rnd>
  );
}
