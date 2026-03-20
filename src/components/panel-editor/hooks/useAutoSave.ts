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
    // Restore undo history from localStorage on mount
    try {
      const stored = localStorage.getItem(`editor-undo-${deviceId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // We can't directly set the past array through public API,
          // but we can use the store's setState escape hatch.
          useEditorStore.setState({ past: parsed, future: [] });
        }
      }
    } catch {
      // Ignore parse errors from corrupted localStorage
    }

    // Subscribe to store changes for auto-save (sections + controls)
    const unsubSave = useEditorStore.subscribe(
      (state, prevState) => {
        // Only trigger if sections or controls actually changed
        if (
          state.sections === prevState.sections &&
          state.controls === prevState.controls
        ) {
          return;
        }

        // Debounce the save
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          const { sections, controls } = useEditorStore.getState();
          fetch(`/api/pipeline/${deviceId}/manifest`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sections, controls }),
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
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, [deviceId]);
}
