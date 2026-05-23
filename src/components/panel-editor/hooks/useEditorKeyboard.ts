'use client';

import { useEffect } from 'react';
import { useEditorStore } from '../store';
import { selectedControlIds } from '../store/selection-types';

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
      // Phase 4 — entity-agnostic delete. When the unified `selection`
      // array has entries (multi-type selection: controls + labels +
      // banners), route through `deleteSelection` which dispatches per
      // type. Falls back to legacy `deleteSelected` (controls only)
      // when nothing is in the unified selection.
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        if (store.selection && store.selection.length > 0) {
          // deleteSelection takes its own snapshot internally
          store.deleteSelection();
        } else {
          store.pushSnapshot();
          store.deleteSelected();
        }
        return;
      }

      // ── Duplicate intentionally not bound ─────────────────────────────────
      // Control IDs are fixed at pipeline-output time; the contractor (and
      // by extension everyone, since admin doesn't hand-author panels)
      // should never mint new IDs from the editor. The store action
      // `duplicateSelected` is left dormant in case future tooling needs it,
      // but no UI path invokes it.

      // ── Align center-x: Shift+H (no Cmd/Ctrl) ───────────────────────────
      if (!isMod && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        store.pushSnapshot();
        store.alignControls('center-x');
        return;
      }

      // ── Align center-y: Shift+V (no Cmd/Ctrl) ───────────────────────────
      if (!isMod && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        store.pushSnapshot();
        store.alignControls('center-y');
        return;
      }

      // ── Distribute horizontal: Cmd/Ctrl+Shift+H ─────────────────────────
      if (isMod && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        store.pushSnapshot();
        store.distributeControls('horizontal');
        return;
      }

      // ── Distribute vertical: Cmd/Ctrl+Shift+V ───────────────────────────
      if (isMod && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        store.pushSnapshot();
        store.distributeControls('vertical');
        return;
      }

      // ── Group: Cmd/Ctrl+G ────────────────────────────────────────────────
      if (isMod && !e.shiftKey && e.key === 'g') {
        // Phase 6b — derived from unified selection.
        const selectedIds = selectedControlIds(store.selection);
        if (selectedIds.length >= 2) {
          e.preventDefault();
          store.pushSnapshot();
          store.createGroup('Group ' + ((store.controlGroups as unknown[]).length + 1));
        }
        return;
      }

      // ── Ungroup: Cmd/Ctrl+Shift+G ────────────────────────────────────────
      if (isMod && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        store.pushSnapshot();
        store.ungroupControls();
        return;
      }

      // ── Select all controls: Cmd/Ctrl+A ───────────────────────────────────
      // Input-guarded above so typing in text fields uses native select-all.
      // EP7: matches the Select Controls ▾ dropdown's "All controls" row.
      if (isMod && !e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        store.selectAllControls();
        return;
      }

      // ── Rotate selection 90° CW: Shift+Alt+R ─────────────────────────────
      // `R` alone toggles rulers; Shift+Alt+R is the rotation accelerator.
      // Each selected control rotates by +90° from its CURRENT angle (per-
      // control delta — multiple selected controls with different rotations
      // stay relatively offset). Faders/sliders auto-swap w↔h on cardinal
      // crossings via the rotateSelected store action.
      if (e.shiftKey && e.altKey && (e.key === 'R' || e.key === 'r')) {
        e.preventDefault();
        store.pushSnapshot();
        store.rotateSelected(90);
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

      // ── Toggle labels: T ───────────────────────────────────────────────
      if (e.key === 't' || e.key === 'T') {
        if (!isMod) {
          store.toggleLabels();
          return;
        }
      }

      // ── Toggle rulers: R ──────────────────────────────────────────────
      if ((e.key === 'r' || e.key === 'R') && !isMod) {
        store.toggleRulers();
        return;
      }

      // ── Z-order: Cmd+] / Cmd+[ / Cmd+Alt+] / Cmd+Alt+[ ─────────────────
      if (e.key === ']' && isMod) {
        e.preventDefault();
        store.pushSnapshot();
        if (e.altKey) {
          store.bringForward();
        } else {
          store.bringToFront();
        }
        return;
      }
      if (e.key === '[' && isMod) {
        e.preventDefault();
        store.pushSnapshot();
        if (e.altKey) {
          store.sendBackward();
        } else {
          store.sendToBack();
        }
        return;
      }

      // ── Help drawer: ? (Shift+/) ─────────────────────────────────────────
      if (e.key === '?' && !isMod) {
        e.preventDefault();
        window.dispatchEvent(new Event('editor-help-toggle'));
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
