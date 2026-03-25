'use client';

import { useEffect } from 'react';
import { useEditorStore } from '../store';

/**
 * Global keyboard shortcuts for the panel editor.
 * Attached at the PanelEditor level, suppressed when an input is focused
 * (e.g. inline label editing in ControlNode).
 */
export function useEditorKeyboard() {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Suppress shortcuts when focus is in an interactive element
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        tag === 'a' ||
        tag === 'button' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const store = useEditorStore.getState();
      const isMod = e.metaKey || e.ctrlKey;

      // ── Undo: Cmd/Ctrl+Z ──────────────────────────────────────────────────
      if (isMod && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        store.undo();
        return;
      }

      // ── Redo: Cmd/Ctrl+Shift+Z ────────────────────────────────────────────
      if (isMod && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        store.redo();
        return;
      }

      // ── Delete selected: Backspace or Delete ──────────────────────────────
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        store.pushSnapshot();
        store.deleteSelected();
        return;
      }

      // ── Duplicate: Cmd/Ctrl+D ─────────────────────────────────────────────
      if (isMod && e.key === 'd') {
        e.preventDefault();
        store.pushSnapshot();
        store.duplicateSelected();
        return;
      }

      // ── Zoom in: Cmd/Ctrl+= ──────────────────────────────────────────────
      if (isMod && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        store.setZoom(store.zoom + 0.1);
        return;
      }

      // ── Zoom out: Cmd/Ctrl+- ─────────────────────────────────────────────
      if (isMod && e.key === '-') {
        e.preventDefault();
        store.setZoom(store.zoom - 0.1);
        return;
      }

      // ── Toggle grid: G ────────────────────────────────────────────────────
      if (e.key === 'g' || e.key === 'G') {
        if (!isMod) {
          store.toggleGrid();
          return;
        }
      }

      // ── Toggle photo: P ───────────────────────────────────────────────────
      if (e.key === 'p' || e.key === 'P') {
        if (!isMod) {
          store.togglePhoto();
          return;
        }
      }

      // ── Toggle layers panel: L ──────────────────────────────────────────
      if (e.key === 'l' || e.key === 'L') {
        if (!isMod) {
          store.toggleLayers();
          return;
        }
      }

      // ── Control scale: [ to decrease, ] to increase ────────────────────
      if (e.key === '[') {
        store.setControlScale(store.controlScale - 0.1);
        return;
      }
      if (e.key === ']') {
        store.setControlScale(store.controlScale + 0.1);
        return;
      }

      // ── Escape: clear selection ───────────────────────────────────────────
      if (e.key === 'Escape') {
        store.setSelectedIds([]);
        return;
      }
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
}
