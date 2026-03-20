'use client';

import { useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { useEditorStore } from './store';
import ControlNode from './ControlNode';

interface SectionFrameProps {
  sectionId: string;
}

export default function SectionFrame({ sectionId }: SectionFrameProps) {
  const section = useEditorStore((s) => s.sections[sectionId]);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const zoom = useEditorStore((s) => s.zoom);
  const snapGrid = useEditorStore((s) => s.snapGrid);
  const moveSection = useEditorStore((s) => s.moveSection);
  const resizeSection = useEditorStore((s) => s.resizeSection);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);

  const isSelected = selectedIds.includes(sectionId);

  const handleDragStop = useCallback(
    (_e: unknown, d: { x: number; y: number }) => {
      const dx = d.x - section.x;
      const dy = d.y - section.y;
      if (dx !== 0 || dy !== 0) {
        moveSection(sectionId, dx, dy);
        pushSnapshot();
      }
    },
    [section.x, section.y, sectionId, moveSection, pushSnapshot],
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
      // react-rnd may also shift position during resize (e.g. top/left handles)
      const dx = position.x - section.x;
      const dy = position.y - section.y;
      if (dx !== 0 || dy !== 0) {
        moveSection(sectionId, dx, dy);
      }
      resizeSection(sectionId, newW, newH);
      pushSnapshot();
    },
    [section.x, section.y, sectionId, moveSection, resizeSection, pushSnapshot],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
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
      }}
      className="hover:border-white/20"
      onClick={handleClick}
    >
      {/* Section header label */}
      {section.headerLabel && (
        <div className="px-1 pt-0.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider select-none pointer-events-none truncate">
          {section.headerLabel}
        </div>
      )}

      {/* Child controls */}
      {section.childIds.map((id) => (
        <ControlNode key={id} controlId={id} sectionId={sectionId} />
      ))}
    </Rnd>
  );
}
