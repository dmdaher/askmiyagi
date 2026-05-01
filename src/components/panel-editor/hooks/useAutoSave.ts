'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../store';
import { isHosted } from '@/lib/env';

const AUTO_SAVE_DEBOUNCE_MS = isHosted ? 1500 : 800;
const UNDO_PERSIST_DEBOUNCE_MS = 2000;
const MAX_PERSISTED_UNDO = 50;

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** Build the save payload from current store state */
function buildSavePayload() {
  const { sections, controls, editorLabels, controlGroups, controlContainers, canvasWidth, canvasHeight, _manifestVersion, controlScale, zoom, cleanupGap, panelScale, keyboard } = useEditorStore.getState();
  return { sections, controls, editorLabels, controlGroups, controlContainers, canvasWidth, canvasHeight, _manifestVersion, controlScale, zoom, cleanupGap, panelScale, keyboard };
}

/** Get the save URL for this device */
function getSaveUrl(deviceId: string) {
  const useHostedApi = isHosted || deviceId.startsWith('sandbox-');
  return `${useHostedApi ? '/api/hosted/panels' : '/api/pipeline'}/${deviceId}${useHostedApi ? '' : '/manifest'}`;
}

/**
 * Auto-save hook: subscribes to Zustand store changes (sections/controls)
 * and debounces PUTs to the manifest-editor API endpoint.
 *
 * Returns { saveStatus, saveNow } for UI display and manual save button.
 */
export function useAutoSave(deviceId: string): { saveStatus: SaveStatus; saveNow: () => Promise<void> } {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  /** Fire an immediate save (used by manual save button and flush) */
  const saveNow = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (!useEditorStore.getState().hasUserEdited) return;

    setSaveStatus('saving');
    try {
      const res = await fetch(getSaveUrl(deviceId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSavePayload()),
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 4000);
      }
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  }, [deviceId]);

  useEffect(() => {
    // Restore undo history from localStorage on mount
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
        // Ignore parse errors
      }
    }

    // Subscribe to store changes for auto-save
    const unsubSave = useEditorStore.subscribe(
      (state, prevState) => {
        if (
          state.sections === prevState.sections &&
          state.controls === prevState.controls &&
          state.editorLabels === prevState.editorLabels &&
          state.controlGroups === prevState.controlGroups &&
          state.controlContainers === prevState.controlContainers &&
          state.controlScale === prevState.controlScale &&
          state.zoom === prevState.zoom &&
          state.cleanupGap === prevState.cleanupGap &&
          state.panelScale === prevState.panelScale &&
          state.keyboard === prevState.keyboard
        ) {
          return;
        }

        const canvasChanged = state.controlScale !== prevState.controlScale ||
          state.zoom !== prevState.zoom ||
          state.cleanupGap !== prevState.cleanupGap ||
          state.panelScale !== prevState.panelScale ||
          state.keyboard !== prevState.keyboard;
        if (!canvasChanged && !useEditorStore.getState().hasUserEdited) {
          return;
        }

        if (isHosted && useEditorStore.getState().previewMode) {
          return;
        }

        // Debounce the save
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        setSaveStatus('saving');
        saveTimerRef.current = setTimeout(() => {
          if (isHosted && useEditorStore.getState().previewMode) return;

          fetch(getSaveUrl(deviceId), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildSavePayload()),
          }).then(() => {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
          }).catch(() => {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 4000);
          });
        }, AUTO_SAVE_DEBOUNCE_MS);
      },
    );

    // Subscribe to undo persistence
    const unsubUndo = useEditorStore.subscribe(
      (state, prevState) => {
        if (state.past === prevState.past) return;
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        undoTimerRef.current = setTimeout(() => {
          try {
            const toStore = useEditorStore.getState().past.slice(-MAX_PERSISTED_UNDO);
            localStorage.setItem(`editor-undo-${deviceId}`, JSON.stringify(toStore));
          } catch {
            // quota exceeded
          }
        }, UNDO_PERSIST_DEBOUNCE_MS);
      },
    );

    // Flush pending save on page close (beforeunload)
    const handleBeforeUnload = () => {
      if (saveTimerRef.current && useEditorStore.getState().hasUserEdited) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        const body = JSON.stringify(buildSavePayload());
        navigator.sendBeacon(getSaveUrl(deviceId), new Blob([body], { type: 'application/json' }));
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubSave();
      unsubUndo();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Flush pending save on unmount (route change within app)
      if (saveTimerRef.current && useEditorStore.getState().hasUserEdited) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        // Use sendBeacon for reliability — fetch may not complete during unmount
        const body = JSON.stringify(buildSavePayload());
        navigator.sendBeacon(getSaveUrl(deviceId), new Blob([body], { type: 'application/json' }));
      }
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      // Flush undo stack
      try {
        const toStore = useEditorStore.getState().past.slice(-MAX_PERSISTED_UNDO);
        localStorage.setItem(`editor-undo-${deviceId}`, JSON.stringify(toStore));
      } catch {
        // best-effort
      }
    };
  }, [deviceId]);

  return { saveStatus, saveNow };
}
