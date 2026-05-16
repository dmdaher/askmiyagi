'use client';

import { useCallback, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { useEditorStore } from './store';
import type { ControlContainer } from './store';
import { isControlSelected } from './store/selection-types';

const CONTAINER_STYLES: Record<string, React.CSSProperties> = {
  recessed: {
    background: 'rgba(0,0,0,0.15)',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  raised: {
    background: 'rgba(255,255,255,0.03)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  outlined: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.12)',
  },
  filled: {
    background: 'rgba(0,0,0,0.1)',
    border: 'none',
  },
};

interface ContainerNodeProps {
  container: ControlContainer;
}

export default function ContainerNode({ container }: ContainerNodeProps) {
  const zoom = useEditorStore((s) => s.zoom);
  const snapGrid = useEditorStore((s) => s.snapGrid);
  const selection = useEditorStore((s) => s.selection);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const moveContainer = useEditorStore((s) => s.moveContainer);
  const resizeContainer = useEditorStore((s) => s.resizeContainer);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);
  const recentlyCreatedContainerId = useEditorStore((s) => s.recentlyCreatedContainerId);

  // Phase 6b — containers go through setSelectedIds which mirrors with
  // control: prefix (see setSelectedIds in manifestSlice). isControlSelected
  // matches the legacy selectedIds.includes(id) contract for these.
  const isSelected = isControlSelected(selection, container.id);
  const isJustCreated = recentlyCreatedContainerId === container.id;
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
      pushSnapshot();
      moveContainer(container.id, dx, dy);
    },
    [container.id, moveContainer, pushSnapshot],
  );

  const handleResizeStop = useCallback(
    (_e: unknown, _dir: unknown, ref: HTMLElement, _delta: unknown, position: { x: number; y: number }) => {
      const newW = parseInt(ref.style.width, 10);
      const newH = parseInt(ref.style.height, 10);
      pushSnapshot();
      const dx = position.x - container.x;
      const dy = position.y - container.y;
      if (dx !== 0 || dy !== 0) {
        moveContainer(container.id, dx, dy);
      }
      resizeContainer(container.id, newW, newH);
    },
    [container, moveContainer, resizeContainer, pushSnapshot],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedIds([container.id]);
    },
    [container.id, setSelectedIds],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isSelected) setSelectedIds([container.id]);
      window.dispatchEvent(new CustomEvent('editor-context-menu', {
        detail: { controlId: container.id, clientX: e.clientX, clientY: e.clientY, isContainer: true },
      }));
    },
    [container.id, isSelected, setSelectedIds],
  );

  const style = CONTAINER_STYLES[container.style] ?? CONTAINER_STYLES.recessed;

  return (
    <Rnd
      position={{ x: container.x, y: container.y }}
      size={{ width: container.w, height: container.h }}
      scale={zoom}
      dragGrid={[snapGrid, snapGrid]}
      resizeGrid={[snapGrid, snapGrid]}
      resizeHandleStyles={isSelected ? {
        bottomRight: { width: 8, height: 8, right: -4, bottom: -4, background: '#6b7280', borderRadius: '50%', cursor: 'nwse-resize' },
        bottomLeft: { width: 8, height: 8, left: -4, bottom: -4, background: '#6b7280', borderRadius: '50%', cursor: 'nesw-resize' },
        topRight: { width: 8, height: 8, right: -4, top: -4, background: '#6b7280', borderRadius: '50%', cursor: 'nesw-resize' },
        topLeft: { width: 8, height: 8, left: -4, top: -4, background: '#6b7280', borderRadius: '50%', cursor: 'nwse-resize' },
      } : undefined}
      enableResizing={isSelected}
      onDragStart={handleDragStart}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      style={{
        ...style,
        borderRadius: container.borderRadius ?? 4,
        zIndex: isJustCreated ? 30 : 3, // briefly raise above controls during flash
        outline: isJustCreated
          ? '3px solid rgba(34, 197, 94, 0.95)'           // bright green during flash
          : isSelected
            ? '2px solid rgba(107,114,128,0.6)'
            : 'none',
        outlineOffset: 1,
        boxShadow: isJustCreated
          ? '0 0 24px 6px rgba(34, 197, 94, 0.6), 0 0 48px 12px rgba(34, 197, 94, 0.25)'
          : (style as React.CSSProperties).boxShadow,
        animation: isJustCreated ? 'container-flash 2.4s ease-out forwards' : undefined,
        cursor: 'move',
        pointerEvents: 'auto',
      }}
    >
      {/* Marker for click-to-find from Layers panel (queried via
          [data-container-id="..."] + scrollIntoView). Invisible. */}
      <div data-container-id={container.id} className="absolute inset-0 pointer-events-none" />
      {/* Optional label */}
      {container.label && (
        <div
          className="absolute -top-4 left-1 pointer-events-none"
          style={{ zIndex: 4 }}
        >
          <span className="text-[7px] font-medium text-gray-500 uppercase tracking-wider">
            {container.label}
          </span>
        </div>
      )}
    </Rnd>
  );
}
