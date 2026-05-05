'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditorStore } from './store';

interface MenuState {
  controlId: string;
  x: number;
  y: number;
  // Optional flags for non-control targets that reuse the same menu state.
  isContainer?: boolean;
  isLabel?: boolean;
  // For label menu only:
  labelId?: string;
  hasSectionId?: boolean;
  linkedControlId?: string | null;  // null/undefined for standalone labels
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

  // Listen for the label-targeted context menu event from LayersPanel's LabelRow.
  // Standalone labels get "Assign to nearest section"; linked labels get
  // "Select linked control" as a navigation shortcut.
  useEffect(() => {
    function handler(e: Event) {
      const { labelId, controlId, hasSectionId, clientX, clientY } = (e as CustomEvent).detail;
      setMenu({
        controlId: '',
        x: clientX,
        y: clientY,
        isLabel: true,
        labelId,
        hasSectionId,
        linkedControlId: controlId ?? null,
      });
    }
    window.addEventListener('editor-context-menu-label', handler);
    return () => window.removeEventListener('editor-context-menu-label', handler);
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

  const handleZOrder = useCallback((action: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward') => {
    const store = useEditorStore.getState();
    store.pushSnapshot();
    store[action]();
    setMenu(null);
  }, []);

  const handleWrapInContainer = useCallback(() => {
    const store = useEditorStore.getState();
    const ids = store.selectedIds;
    if (ids.length < 2) return;
    const ctrls = ids.map(id => store.controls[id]).filter(Boolean);
    if (ctrls.length < 2) return;
    const scale = store.controlScale ?? 1;
    const padding = 8;
    const minX = Math.min(...ctrls.map(c => c.x));
    const minY = Math.min(...ctrls.map(c => c.y));
    const maxX = Math.max(...ctrls.map(c => c.x + c.w * scale));
    const maxY = Math.max(...ctrls.map(c => c.y + c.h * scale));
    store.pushSnapshot();
    store.addContainer(
      Math.round(minX - padding),
      Math.round(minY - padding),
      Math.round(maxX - minX + padding * 2),
      Math.round(maxY - minY + padding * 2),
      ids,
    );
    setMenu(null);
  }, []);

  const handleAddEmptyContainer = useCallback(() => {
    if (!menu) return;
    const store = useEditorStore.getState();
    const zoom = store.zoom;
    const panX = store.panX;
    const panY = store.panY;
    // Convert screen coords to canvas coords
    const x = (menu.x - panX) / zoom;
    const y = (menu.y - panY) / zoom;
    store.pushSnapshot();
    store.addContainer(Math.round(x), Math.round(y), 120, 80);
    setMenu(null);
  }, [menu]);

  const handleDeleteContainer = useCallback(() => {
    if (!menu) return;
    const store = useEditorStore.getState();
    store.pushSnapshot();
    store.deleteContainer(menu.controlId);
    store.setSelectedIds([]);
    setMenu(null);
  }, [menu]);

  const handleAssignLabelToSection = useCallback(() => {
    if (!menu || !menu.isLabel || !menu.labelId) return;
    const store = useEditorStore.getState();
    store.pushSnapshot();
    store.assignLabelToNearestSection(menu.labelId);
    setMenu(null);
  }, [menu]);

  const handleSelectLinkedControl = useCallback(() => {
    if (!menu || !menu.isLabel || !menu.linkedControlId) return;
    const store = useEditorStore.getState();
    store.setSelectedIds([menu.linkedControlId]);
    setMenu(null);
  }, [menu]);

  if (!menu) return null;

  // Label-target menu — handled separately from controls/containers.
  if (menu.isLabel && menu.labelId) {
    const menuTop = Math.min(menu.y, window.innerHeight - 120);
    const menuLeft = Math.min(menu.x, window.innerWidth - 220);
    const isStandalone = !menu.linkedControlId;
    return createPortal(
      <div className="fixed" style={{ left: menuLeft, top: Math.max(8, menuTop), zIndex: 9999 }}>
        <div className="min-w-[200px] rounded-md border border-gray-700 bg-gray-900 py-1 shadow-xl text-xs text-gray-300">
          {isStandalone ? (
            <button
              className="flex w-full items-center px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
              onClick={handleAssignLabelToSection}
            >
              {menu.hasSectionId ? 'Re-assign to nearest section' : 'Assign to nearest section'}
            </button>
          ) : (
            <button
              className="flex w-full items-center px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
              onClick={handleSelectLinkedControl}
            >
              Select linked control
            </button>
          )}
        </div>
      </div>,
      document.body,
    );
  }

  const control = useEditorStore.getState().controls[menu.controlId];
  const isContainer = (menu as any).isContainer === true;

  // Container context menu
  if (isContainer) {
    return createPortal(
      <div className="fixed" style={{ left: menu.x, top: menu.y, zIndex: 9999 }}>
        <div className="min-w-[160px] rounded-md border border-gray-700 bg-gray-900 py-1 shadow-xl text-xs text-gray-300">
          <button
            className="flex w-full items-center px-3 py-1.5 hover:bg-gray-800 hover:text-red-400 transition-colors text-left"
            onClick={handleDeleteContainer}
          >
            Delete Container
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  if (!control) {
    // Empty canvas right-click — show "Add Container"
    return createPortal(
      <div className="fixed" style={{ left: menu.x, top: menu.y, zIndex: 9999 }}>
        <div className="min-w-[160px] rounded-md border border-gray-700 bg-gray-900 py-1 shadow-xl text-xs text-gray-300">
          <button
            className="flex w-full items-center px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
            onClick={handleAddEmptyContainer}
          >
            Add Container
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  const isLocked = control.locked;
  const isResizeLocked = control.resizeLocked;
  const lockLabel = isLocked ? 'Unlock' : isResizeLocked ? 'Lock Fully' : 'Lock Size';
  const selectedCount = useEditorStore.getState().selectedIds.length;

  // Clamp menu position so it doesn't overflow the viewport.
  // Anchor near the click but ensure the entire menu fits — leave at least
  // 8px from the viewport bottom and constrain max-h to remaining space.
  const menuTopRaw = Math.min(menu.y, window.innerHeight - 200);
  const menuTop = Math.max(8, menuTopRaw);
  const menuLeft = Math.min(menu.x, window.innerWidth - 200);
  const availableHeight = Math.max(200, window.innerHeight - menuTop - 16);

  return createPortal(
    <div
      className="fixed"
      style={{
        left: menuLeft,
        top: menuTop,
        zIndex: 9999,
      }}
    >
      <div
        className="min-w-[160px] overflow-y-auto rounded-md border border-gray-700 bg-gray-900 py-1 shadow-xl text-xs text-gray-300"
        style={{ maxHeight: `${availableHeight}px` }}
      >
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
          className={`flex w-full items-center justify-between px-3 py-1.5 transition-colors text-left ${
            isLocked ? 'text-gray-600 cursor-not-allowed' : 'hover:bg-gray-800 hover:text-red-400'
          }`}
          onClick={isLocked ? undefined : handleDelete}
          disabled={isLocked}
        >
          <span>Delete</span>
          <span className="text-gray-600 ml-4">Del</span>
        </button>

        {/* Separator */}
        <div className="my-1 h-px bg-gray-800" />

        {/* Lock cycle: Unlocked → Size Locked → Fully Locked → Unlocked */}
        <button
          className="flex w-full items-center px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
          onClick={handleToggleLock}
        >
          {lockLabel}
        </button>

        {/* Z-Order */}
        <div className="my-1 h-px bg-gray-800" />
        <button
          className="flex w-full items-center justify-between px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
          onClick={() => handleZOrder('bringToFront')}
        >
          <span>Bring to Front</span>
          <span className="text-gray-600 ml-4 text-[9px]">&#8984;]</span>
        </button>
        <button
          className="flex w-full items-center justify-between px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
          onClick={() => handleZOrder('bringForward')}
        >
          <span>Bring Forward</span>
          <span className="text-gray-600 ml-4 text-[9px]">&#8984;&#8997;]</span>
        </button>
        <button
          className="flex w-full items-center justify-between px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
          onClick={() => handleZOrder('sendBackward')}
        >
          <span>Send Backward</span>
          <span className="text-gray-600 ml-4 text-[9px]">&#8984;&#8997;[</span>
        </button>
        <button
          className="flex w-full items-center justify-between px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
          onClick={() => handleZOrder('sendToBack')}
        >
          <span>Send to Back</span>
          <span className="text-gray-600 ml-4 text-[9px]">&#8984;[</span>
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

            {/* Wrap in Container */}
            <div className="my-1 h-px bg-gray-800" />
            <button
              className="flex w-full items-center px-3 py-1.5 hover:bg-gray-800 hover:text-white transition-colors text-left"
              onClick={handleWrapInContainer}
            >
              Wrap in Container
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
