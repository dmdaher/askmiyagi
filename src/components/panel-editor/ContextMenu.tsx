'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditorStore } from './store';

interface MenuState {
  controlId: string;
  x: number;
  y: number;
}

/**
 * Portal-rendered right-click context menu for controls.
 * Listens for a custom 'editor-context-menu' event dispatched by ControlNode.
 */
export default function ContextMenu() {
  const [menu, setMenu] = useState<MenuState | null>(null);

  // Listen for the custom context menu event from ControlNode
  useEffect(() => {
    function handler(e: Event) {
      const { controlId, clientX, clientY } = (e as CustomEvent).detail;
      setMenu({ controlId, x: clientX, y: clientY });
    }

    window.addEventListener('editor-context-menu', handler);
    return () => window.removeEventListener('editor-context-menu', handler);
  }, []);

  // Close on click outside or Escape
  useEffect(() => {
    if (!menu) return;

    function handleClickOutside() {
      setMenu(null);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenu(null);
      }
    }

    // Use setTimeout so the current click event doesn't immediately close
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menu]);

  const handleDuplicate = useCallback(() => {
    const store = useEditorStore.getState();
    store.pushSnapshot();
    store.duplicateSelected();
    setMenu(null);
  }, []);

  const handleDelete = useCallback(() => {
    const store = useEditorStore.getState();
    store.pushSnapshot();
    store.deleteSelected();
    setMenu(null);
  }, []);

  const handleToggleLock = useCallback(() => {
    if (!menu) return;
    const store = useEditorStore.getState();
    store.toggleLock(menu.controlId);
    setMenu(null);
  }, [menu]);

  const handleAlign = useCallback((mode: 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom') => {
    const store = useEditorStore.getState();
    store.pushSnapshot();
    store.alignControls(mode);
    setMenu(null);
  }, []);

  const handleDistribute = useCallback((axis: 'horizontal' | 'vertical') => {
    const store = useEditorStore.getState();
    store.pushSnapshot();
    store.distributeControls(axis);
    setMenu(null);
  }, []);

  const handleGroup = useCallback(() => {
    const store = useEditorStore.getState();
    if (store.selectedIds.length >= 2) {
      store.pushSnapshot();
      store.createGroup(`Group ${(store.controlGroups as unknown[]).length + 1}`);
    }
    setMenu(null);
  }, []);

  const handleUngroup = useCallback(() => {
    const store = useEditorStore.getState();
    store.pushSnapshot();
    store.ungroupControls();
    setMenu(null);
  }, []);

  if (!menu) return null;

  const control = useEditorStore.getState().controls[menu.controlId];
  if (!control) return null;

  const isLocked = control.locked;
  const selectedCount = useEditorStore.getState().selectedIds.length;

  return createPortal(
    <div
      className="fixed"
      style={{
        left: menu.x,
        top: menu.y,
        zIndex: 9999,
      }}
    >
      <div className="min-w-[160px] rounded-md border border-gray-700 bg-gray-900 py-1 shadow-xl text-xs text-gray-300">
        {/* Duplicate */}
        <button
          className="flex w-full items-center justify-between px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
          onClick={handleDuplicate}
        >
          <span>Duplicate</span>
          <span className="text-gray-600 ml-4">Cmd+D</span>
        </button>

        {/* Delete */}
        <button
          className="flex w-full items-center justify-between px-3 py-1.5 hover:bg-gray-800 hover:text-red-400 transition-colors text-left"
          onClick={handleDelete}
        >
          <span>Delete</span>
          <span className="text-gray-600 ml-4">Del</span>
        </button>

        {/* Separator */}
        <div className="my-1 h-px bg-gray-800" />

        {/* Lock / Unlock */}
        <button
          className="flex w-full items-center px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
          onClick={handleToggleLock}
        >
          {isLocked ? 'Unlock' : 'Lock'}
        </button>

        {/* Multi-select: Alignment & Grouping */}
        {selectedCount >= 2 && (
          <>
            {/* Separator */}
            <div className="my-1 h-px bg-gray-800" />

            {/* Align */}
            <button
              className="flex w-full items-center justify-between px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
              onClick={() => handleAlign('left')}
            >
              <span>Align Left</span>
            </button>
            <button
              className="flex w-full items-center justify-between px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
              onClick={() => handleAlign('center-x')}
            >
              <span>Align Center H</span>
              <span className="text-gray-600 ml-4 text-[9px]">&#8679;H</span>
            </button>
            <button
              className="flex w-full items-center justify-between px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
              onClick={() => handleAlign('right')}
            >
              <span>Align Right</span>
            </button>
            <button
              className="flex w-full items-center justify-between px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
              onClick={() => handleAlign('top')}
            >
              <span>Align Top</span>
            </button>
            <button
              className="flex w-full items-center justify-between px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
              onClick={() => handleAlign('center-y')}
            >
              <span>Align Middle V</span>
              <span className="text-gray-600 ml-4 text-[9px]">&#8679;V</span>
            </button>
            <button
              className="flex w-full items-center justify-between px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
              onClick={() => handleAlign('bottom')}
            >
              <span>Align Bottom</span>
            </button>

            {/* Distribute (only when 3+ selected) */}
            {selectedCount >= 3 && (
              <>
                <div className="my-1 h-px bg-gray-800" />
                <button
                  className="flex w-full items-center justify-between px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
                  onClick={() => handleDistribute('horizontal')}
                >
                  <span>Distribute H</span>
                  <span className="text-gray-600 ml-4 text-[9px]">&#8984;&#8679;H</span>
                </button>
                <button
                  className="flex w-full items-center justify-between px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
                  onClick={() => handleDistribute('vertical')}
                >
                  <span>Distribute V</span>
                  <span className="text-gray-600 ml-4 text-[9px]">&#8984;&#8679;V</span>
                </button>
              </>
            )}

            {/* Separator */}
            <div className="my-1 h-px bg-gray-800" />

            {/* Group / Ungroup */}
            <button
              className="flex w-full items-center justify-between px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
              onClick={handleGroup}
            >
              <span>Group</span>
              <span className="text-gray-600 ml-4 text-[9px]">&#8984;G</span>
            </button>
            <button
              className="flex w-full items-center justify-between px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
              onClick={handleUngroup}
            >
              <span>Ungroup</span>
              <span className="text-gray-600 ml-4 text-[9px]">&#8984;&#8679;G</span>
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
