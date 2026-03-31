'use client';

import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store';

const AUTO_SAVE_DEBOUNCE_MS = 800;
const UNDO_PERSIST_DEBOUNCE_MS = 2000;
const MAX_PERSISTED_UNDO = 50;

/**
 * Auto-save hook: subscribes to Zustand store changes (sections/controls)
 * and debounces PUTs to the manifest-editor API endpoint.
 *
 * Also persists the undo stack to localStorage keyed by deviceId.
 */
export function useAutoSave(deviceId: string) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Restore undo history from localStorage on mount — but ONLY if the
    // in-memory store has an empty undo stack. The Zustand store survives
    // client-side route changes (tab switches), so the in-memory stack is
    // more recent than localStorage (which has a 2s persistence debounce).
    const currentPast = useEditorStore.getState().past;
    if (currentPast.length === 0) {
      try {
        const stored = localStorage.getItem(`editor-undo-${deviceId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            useEditorStore.setState({ past: parsed, future: [] });
          }
        }
      } catch {
        // Ignore parse errors from corrupted localStorage
      }
    }

    // Subscribe to store changes for auto-save (sections + controls)
    // Skip the first change (initial loadFromManifest) to avoid overwriting saved edits
    let isFirstChange = true;
    const unsubSave = useEditorStore.subscribe(
      (state, prevState) => {
        // Only trigger if sections, controls, or canvas settings changed
        if (
          state.sections === prevState.sections &&
          state.controls === prevState.controls &&
          state.controlScale === prevState.controlScale &&
          state.zoom === prevState.zoom
        ) {
          return;
        }

        // Skip the initial load — don't overwrite saved edits
        if (isFirstChange) {
          isFirstChange = false;
          return;
        }

        // Only save if the user has actually interacted (pointer/keyboard events).
        // This prevents programmatic state changes (loadFromManifest, restore) from
        // triggering auto-save and clobbering fresh pipeline data.
        // Canvas settings (controlScale, zoom) are always user-initiated — bypass guard.
        const canvasChanged = state.controlScale !== prevState.controlScale ||
          state.zoom !== prevState.zoom;
        if (!canvasChanged && !useEditorStore.getState().hasUserEdited) {
          return;
        }

        // Debounce the save
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          const { sections, controls, canvasWidth, canvasHeight, _manifestVersion, controlScale, zoom } = useEditorStore.getState();
          fetch(`/api/pipeline/${deviceId}/manifest`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sections, controls, canvasWidth, canvasHeight, _manifestVersion, controlScale, zoom }),
          }).catch(() => {
            // Silent fail — auto-save is best-effort
          });
        }, AUTO_SAVE_DEBOUNCE_MS);
      },
    );

    // Subscribe to store changes for undo persistence (past array)
    const unsubUndo = useEditorStore.subscribe(
      (state, prevState) => {
        if (state.past === prevState.past) return;

        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        undoTimerRef.current = setTimeout(() => {
          const { past } = useEditorStore.getState();
          try {
            const toStore = past.slice(-MAX_PERSISTED_UNDO);
            localStorage.setItem(
              `editor-undo-${deviceId}`,
              JSON.stringify(toStore),
            );
          } catch {
            // localStorage quota exceeded — silently skip
          }
        }, UNDO_PERSIST_DEBOUNCE_MS);
      },
    );

    return () => {
      unsubSave();
      unsubUndo();
      // Cancel pending debounces
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      // Flush undo stack to localStorage immediately on unmount so it
      // survives route changes even if the 2s debounce hadn't fired yet.
      try {
        const { past } = useEditorStore.getState();
        const toStore = past.slice(-MAX_PERSISTED_UNDO);
        localStorage.setItem(`editor-undo-${deviceId}`, JSON.stringify(toStore));
      } catch {
        // Best-effort
      }
    };
  }, [deviceId]);
}
