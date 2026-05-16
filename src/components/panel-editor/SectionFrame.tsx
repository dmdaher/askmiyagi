'use client';

import { useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { useEditorStore } from './store';
import { getFrameMode } from './store/manifestSlice';
import { isSectionSelected } from './store/selection-types';

interface SectionFrameProps {
  sectionId: string;
  zIndex?: number;
}

export default function SectionFrame({ sectionId, zIndex = 1 }: SectionFrameProps) {
  const section = useEditorStore((s) => s.sections[sectionId]);
  const selection = useEditorStore((s) => s.selection);
  const focusedSectionId = useEditorStore((s) => s.focusedSectionId);
  const zoom = useEditorStore((s) => s.zoom);
  const snapGrid = useEditorStore((s) => s.snapGrid);
  const moveSection = useEditorStore((s) => s.moveSection);
  const resizeSection = useEditorStore((s) => s.resizeSection);
  const setSectionPosition = useEditorStore((s) => s.setSectionPosition);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);

  // Phase 6b — sections are tracked via 'section:' prefix in unified selection.
  const isSelected = isSectionSelected(selection, sectionId);

  const sx = section?.x ?? 0;
  const sy = section?.y ?? 0;

  const handleDragStop = useCallback(
    (_e: unknown, d: { x: number; y: number }) => {
      const dx = d.x - sx;
      const dy = d.y - sy;
      // Ignore zero-movement clicks (not actual drags)
      if (dx === 0 && dy === 0) return;
      pushSnapshot();
      moveSection(sectionId, dx, dy);
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
      // Update section position independently — do NOT move child controls.
      // Controls have absolute coordinates and should stay in place in world space
      // when the section box is resized around them.
      if (position.x !== sx || position.y !== sy) {
        setSectionPosition(sectionId, position.x, position.y);
      }
      resizeSection(sectionId, newW, newH);
    },
    [sx, sy, sectionId, setSectionPosition, resizeSection, pushSnapshot],
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

  const mode = getFrameMode(section);

  // Hidden mode (editor only): the section renders invisibly in preview,
  // but in the editor we show a faint ghost outline so the contractor can
  // still click + select it to change its mode back. Without this branch,
  // hiding a section makes it permanently unreachable from the canvas.
  // Tutorial: hover → barely visible; selected → blue outline like other modes.
  if (mode === 'hidden') {
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
            : '1px dashed rgba(251,191,36,0.35)',  // amber-dashed = "hidden"
          borderRadius: 4,
          backgroundColor: isSelected
            ? 'rgba(59,130,246,0.06)'
            : 'transparent',
          opacity: isSelected ? 1 : 0.5,
          transition: 'border-color 0.15s, background-color 0.15s, opacity 0.15s',
          zIndex: isSelected ? 100 : focusedSectionId === sectionId ? 99 : zIndex,
        }}
        className="hover:opacity-100"
        onClick={handleClick}
      >
        <div
          data-section-id={sectionId}
          className="section-drag-handle w-full h-full cursor-grab active:cursor-grabbing flex items-start"
        >
          {/* Small amber "Hidden" pill so contractor knows what they're looking at */}
          <span
            className="ml-2 mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wider pointer-events-none"
            style={{
              backgroundColor: 'rgba(251,191,36,0.18)',
              border: '1px solid rgba(251,191,36,0.5)',
              color: '#fcd34d',
            }}
          >
            ◌ Hidden — {section.headerLabel ?? sectionId}
          </span>
        </div>
      </Rnd>
    );
  }

  // body-only mode: section frame box visible (for visual grouping of
  // controls), no header strip or title — whole section surface acts as
  // a drag handle for repositioning. Resize handles still appear on
  // hover/selection.
  if (mode === 'body-only') {
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
        {/* Drag handle covers the entire section body (no header strip).
            data-section-id stays on this element for drift verifier parity. */}
        <div
          data-section-id={sectionId}
          className="section-drag-handle w-full h-full cursor-grab active:cursor-grabbing"
        />
      </Rnd>
    );
  }

  // Header-only mode: just a floating header bar, no body/border
  if (mode === 'header-only') {
    return (
      <Rnd
        position={{ x: section.x, y: section.y }}
        size={{ width: section.w, height: 28 }}
        scale={zoom}
        dragGrid={[snapGrid, snapGrid]}
        dragHandleClassName="section-drag-handle"
        onDragStop={handleDragStop}
        enableResizing={false}
        style={{
          zIndex: isSelected ? 100 : focusedSectionId === sectionId ? 99 : zIndex,
        }}
        onClick={handleClick}
      >
        <div
          data-section-id={sectionId}
          className="section-drag-handle flex items-center gap-2 px-2 h-7 cursor-grab active:cursor-grabbing select-none rounded"
          style={{
            backgroundColor: isSelected ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
            border: isSelected ? '1px solid rgba(59,130,246,0.5)' : '1px dashed rgba(255,255,255,0.15)',
            transition: 'border-color 0.15s, background-color 0.15s',
          }}
        >
          <span className="text-[10px] text-gray-400">⋮⋮</span>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
            {section.headerLabel ?? sectionId}
          </span>
          <span className="text-[10px] text-gray-600 ml-auto">{(section.childIds ?? []).length}</span>
        </div>
      </Rnd>
    );
  }

  // Full mode: border + header + resize
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
        data-section-id={sectionId}
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

      {/* Controls rendered in flat ControlLayer above all sections */}
    </Rnd>
  );
}
