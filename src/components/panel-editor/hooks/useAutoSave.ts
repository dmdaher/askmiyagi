'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../store';
import { isHosted } from '@/lib/env';

const AUTO_SAVE_DEBOUNCE_MS = isHosted ? 1500 : 800;
const UNDO_PERSIST_DEBOUNCE_MS = 2000;
const MAX_PERSISTED_UNDO = 50;

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

/** Build the save payload from current store state */
export function buildSavePayload() {
  const { sections, controls, editorLabels, controlGroups, controlContainers, polishBanners, canvasWidth, canvasHeight, deviceDimensions, _manifestVersion, _loadedAt, controlScale, zoom, cleanupGap, panelScale, keyboard } = useEditorStore.getState();
  // Phase 10 — `deviceDimensions` is persisted so future loads don't have
  // to re-read the raw `manifest.json` to find physical hardware size.
  // null when the gatekeeper didn't extract dimensions from the manual.
  return { sections, controls, editorLabels, controlGroups, controlContainers, polishBanners, canvasWidth, canvasHeight, deviceDimensions, _manifestVersion, _loadedAt, controlScale, zoom, cleanupGap, panelScale, keyboard };
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
 * Returns { saveStatus, saveNow, lastSavedAt } for UI display and manual save button.
 */
export function useAutoSave(deviceId: string): {
  saveStatus: SaveStatus;
  saveNow: () => Promise<void>;
  lastSavedAt: Date | null;
  /** Non-null when last save succeeded but the production auto-export was
   *  blocked by the downgrade detector (see src/lib/pipeline/exportManifest.ts).
   *  Contractor's editor data IS saved; production manifest stays at prior value.
   *  Recovery: admin reviews + uses force-export OR fixes fallback sources.
   *  Cleared on the next successful export. */
  productionExportWarning: string | null;
} {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks whether there are changes that haven't been successfully saved to blob.
  // Used by beforeunload to warn the user. Covers: pending debounce, in-flight save, failed save.
  const hasUnsavedChanges = useRef(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [productionExportWarning, setProductionExportWarning] = useState<string | null>(null);

  /** Read productionExport from a save response and update warning state. */
  const updateProductionExportWarning = useCallback((data: { productionExport?: { ok: boolean; reason?: string } | null }) => {
    const pe = data.productionExport;
    if (pe && pe.ok === false && pe.reason) {
      setProductionExportWarning(pe.reason);
    } else if (pe && pe.ok === true) {
      // Successful export clears any previous warning.
      setProductionExportWarning(null);
    }
    // pe === undefined/null (e.g., hosted mode without auto-export) — leave warning state untouched.
  }, []);

  /** Handle a successful save response — update _loadedAt for conflict detection */
  const handleSaveSuccess = useCallback((savedAt?: string) => {
    const now = savedAt ? new Date(savedAt) : new Date();
    setLastSavedAt(now);
    hasUnsavedChanges.current = false;
    // Update _loadedAt so next save uses the new timestamp for conflict detection
    useEditorStore.setState({ _loadedAt: now.toISOString() });
    // Cache saved state locally so refresh doesn't depend on CDN propagation
    try {
      sessionStorage.setItem(`manifest-cache-${deviceId}`, JSON.stringify({
        data: buildSavePayload(),
        savedAt: now.getTime(),
      }));
    } catch { /* quota exceeded — non-critical */ }
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, [deviceId]);

  /** Fire an immediate save (used by manual save button and flush) */
  const saveNow = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    setSaveStatus('saving');
    try {
      // Manual save = explicit checkpoint. Append ?backup=force&source=manual so
      // the hosted PUT route creates a history snapshot (bypassing throttle) and
      // tags it as a manual save in version history. Local pipeline route honors
      // the same params for parity.
      const url = getSaveUrl(deviceId) + (getSaveUrl(deviceId).includes('?') ? '&' : '?') + 'backup=force&source=manual';
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSavePayload()),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        handleSaveSuccess(data.savedAt);
        updateProductionExportWarning(data);
      } else if (res.status === 409) {
        setSaveStatus('conflict');
      } else {
        // Save failed — cache locally as recovery safety net
        try {
          sessionStorage.setItem(`manifest-cache-${deviceId}`, JSON.stringify({
            data: buildSavePayload(), savedAt: Date.now(),
          }));
        } catch { /* best-effort */ }
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 4000);
      }
    } catch {
      // Network error — cache locally as recovery safety net
      try {
        sessionStorage.setItem(`manifest-cache-${deviceId}`, JSON.stringify({
          data: buildSavePayload(), savedAt: Date.now(),
        }));
      } catch { /* best-effort */ }
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  }, [deviceId, handleSaveSuccess, updateProductionExportWarning]);

  // Pick up _loadedAt from store once manifest loads (store is empty at hook init time)
  useEffect(() => {
    const unsub = useEditorStore.subscribe((state, prev) => {
      if (state._loadedAt && state._loadedAt !== prev._loadedAt && !lastSavedAt) {
        setLastSavedAt(new Date(state._loadedAt));
      }
    });
    // Also check immediately in case it's already set
    const current = useEditorStore.getState()._loadedAt;
    if (current && !lastSavedAt) setLastSavedAt(new Date(current));
    return unsub;
  }, []);

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

    // GUARDRAIL: ?nosave=true URL param disables auto-save entirely.
    // For Playwright scripts that load the editor for read-only inspection,
    // tests that should never write back, or any diagnostic tool that needs
    // to interact with the editor without risking contractor data loss.
    //
    // Without this, calling setState({ zoom }) or similar from a Playwright
    // script triggers an auto-save with the CURRENT store state — which may
    // be stale (mid-hydration) and overwrite newer contractor work.
    // Observed 2026-05-15: ~270 lines of fantom-06 contractor data lost
    // during a session of drift-script Playwright runs.
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('nosave') === 'true') {
      return;
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
          state.polishBanners === prevState.polishBanners &&
          state.controlScale === prevState.controlScale &&
          state.cleanupGap === prevState.cleanupGap &&
          state.panelScale === prevState.panelScale &&
          state.keyboard === prevState.keyboard
        ) {
          // NOTE: `zoom` is intentionally NOT in the change-detection list
          // above OR the canvasChanged check below. Zoom is editor view
          // state — it's how the contractor's screen is currently rendered,
          // not what gets shipped to production. Including it caused real
          // bugs:
          //   1. Playwright scripts that set zoom for measurement triggered
          //      auto-saves with mid-hydration state.
          //   2. A contractor zooming the editor while data was loading
          //      from Blob would write stale state back, corrupting the
          //      authoritative copy.
          // Zoom persistence (so a refresh keeps the contractor's preferred
          // view) belongs in localStorage, not the manifest.
          return;
        }

        const canvasChanged = state.controlScale !== prevState.controlScale ||
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
        hasUnsavedChanges.current = true;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        setSaveStatus('saving');
        saveTimerRef.current = setTimeout(() => {
          saveTimerRef.current = null;
          if (isHosted && useEditorStore.getState().previewMode) return;

          fetch(getSaveUrl(deviceId), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildSavePayload()),
          }).then(async (res) => {
            if (res.ok) {
              const data = await res.json().catch(() => ({}));
              handleSaveSuccess(data.savedAt);
              updateProductionExportWarning(data);
            } else if (res.status === 409) {
              setSaveStatus('conflict');
            } else {
              try { sessionStorage.setItem(`manifest-cache-${deviceId}`, JSON.stringify({ data: buildSavePayload(), savedAt: Date.now() })); } catch {}
              setSaveStatus('error');
              setTimeout(() => setSaveStatus('idle'), 4000);
            }
          }).catch(() => {
            try { sessionStorage.setItem(`manifest-cache-${deviceId}`, JSON.stringify({ data: buildSavePayload(), savedAt: Date.now() })); } catch {}
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
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current) {
        // Always fire sendBeacon as safety net — covers:
        // 1. Pending debounce timer (save hasn't fired yet)
        // 2. In-flight fetch that browser might abort on close
        // 3. Previously failed save (retry on close)
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
          saveTimerRef.current = null;
        }
        const payload = buildSavePayload();
        navigator.sendBeacon(getSaveUrl(deviceId), new Blob([JSON.stringify(payload)], { type: 'application/json' }));
        try {
          sessionStorage.setItem(`manifest-cache-${deviceId}`, JSON.stringify({
            data: payload, savedAt: Date.now(),
          }));
        } catch { /* best-effort */ }
        // Show native "Leave site?" dialog
        e.preventDefault();
        e.returnValue = '';
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
        const payload = buildSavePayload();
        // Use sendBeacon for reliability — fetch may not complete during unmount
        navigator.sendBeacon(getSaveUrl(deviceId), new Blob([JSON.stringify(payload)], { type: 'application/json' }));
        // Cache locally so navigating back doesn't depend on CDN propagation
        try {
          sessionStorage.setItem(`manifest-cache-${deviceId}`, JSON.stringify({
            data: payload,
            savedAt: Date.now(),
          }));
        } catch { /* best-effort */ }
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

  return { saveStatus, saveNow, lastSavedAt, productionExportWarning };
}
