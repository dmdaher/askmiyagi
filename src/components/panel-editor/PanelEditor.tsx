'use client';

import { useCallback, useEffect, useState } from 'react';
import { useEditorStore } from './store';
import type { MasterManifestInput } from './store';
import { isHosted } from '@/lib/env';
import EditorToolbar from './EditorToolbar';
import EditorWorkspace from './EditorWorkspace';
import PropertiesPanel from './PropertiesPanel';
import LayersPanel from './LayersPanel';
import ContextMenu from './ContextMenu';
import IssueReportModal from './IssueReportModal';
import EditorTutorial from './EditorTutorial';
import EditorHelpDrawer from './EditorHelpDrawer';
import { useEditorKeyboard } from './hooks/useEditorKeyboard';
import { useAutoSave, buildSavePayload } from './hooks/useAutoSave';
import { computeManifestVersion } from '@/lib/pipeline/manifest-version';
import { cleanupGeometry } from '@/lib/layout-inference';

interface PanelEditorProps {
  deviceId: string;
  isSandbox?: boolean;
}

/** Inner shell rendered after manifest is loaded. Hooks run unconditionally here. */
function EditorShell({ deviceId, onRestoreVersion, adminNote, isSandbox }: { deviceId: string; onRestoreVersion?: () => void; adminNote?: string | null; isSandbox?: boolean }) {
  useEditorKeyboard();
  const { saveStatus, saveNow, lastSavedAt } = useAutoSave(deviceId);

  const previewMode = useEditorStore((s) => s.previewMode);
  const setPreviewMode = useEditorStore((s) => s.setPreviewMode);
  const [buildStatus, setBuildStatus] = useState<
    'idle' | 'building' | 'approved'
  >('idle');
  const [codegenError, setCodegenError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Listen for help toggle from keyboard shortcut
  useEffect(() => {
    const handler = () => setShowHelp((s) => !s);
    window.addEventListener('editor-help-toggle', handler);
    return () => window.removeEventListener('editor-help-toggle', handler);
  }, []);

  // ── Clean Up: optional inference pass (snap rows, equalize spacing) ──────
  const handleCleanUp = useCallback(() => {
    const state = useEditorStore.getState();
    const { sections, controls, canvasWidth, canvasHeight, controlScale } = state;
    // Read cleanupGap if available (Part 3 adds this to store)
    const cleanupGap = (state as any).cleanupGap as number | undefined;

    // Push snapshot so Cmd+Z reverts the cleanup
    state.pushSnapshot();

    // Run geometry cleanup (snap alignment, equalize spacing)
    // Pass controlScale so spacing uses visual sizes, not container sizes.
    // Pass cleanupGap so the contractor's target gap is used instead of averaging.
    const cleaned = cleanupGeometry(
      sections, controls, canvasWidth, canvasHeight,
      controlScale, cleanupGap && cleanupGap > 0 ? cleanupGap : undefined,
    );

    // Apply cleaned positions — sizes are NOT modified (sacred)
    const updatedControls = { ...controls };
    const updatedSections = { ...sections };
    for (const cs of cleaned.sections) {
      if (updatedSections[cs.id]) {
        updatedSections[cs.id] = {
          ...updatedSections[cs.id],
          x: cs.x, y: cs.y, w: cs.w, h: cs.h,
        };
      }
      for (const cc of cs.controls) {
        if (updatedControls[cc.id]) {
          updatedControls[cc.id] = {
            ...updatedControls[cc.id],
            x: cc.x, y: cc.y,
            // w/h intentionally NOT overwritten — contractor sizes are sacred
          };
        }
      }
    }
    useEditorStore.setState({ sections: updatedSections, controls: updatedControls });
  }, []);

  // ── Approve & Build: take positions as-is, run codegen for polish ──────
  const handleApproveAndBuild = useCallback(async () => {
    setBuildStatus('building');
    setCodegenError(null);

    try {
      // Force-save current manifest (bypass debounce)
      const saveUrl = `${isHosted ? '/api/hosted/panels' : '/api/pipeline'}/${deviceId}${isHosted ? '' : '/manifest'}`;
      const saveRes = await fetch(saveUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSavePayload()),
      });
      if (saveRes.status === 409) {
        throw new Error('Conflict: another session saved newer changes. Reload the page.');
      }

      // Export manifest JSON — replaces codegen TSX generation.
      // Writes src/data/manifests/{deviceId}.json for production.
      const exportRes = await fetch(`/api/pipeline/${deviceId}/export-manifest`, { method: 'POST' });
      const exportBody = await exportRes.json().catch(() => ({}));
      if (!exportRes.ok) {
        throw new Error(exportBody.error ? `${exportBody.error}: ${exportBody.details || ''}` : 'Export failed');
      }

      setExportMessage(exportBody.output ?? 'Manifest exported successfully');
      setPreviewMode(true);
      setBuildStatus('approved');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setCodegenError(message);
      setBuildStatus('idle');
    }
  }, [deviceId]);

  const handleBackToEditor = useCallback(() => {
    setPreviewMode(false);
    setBuildStatus('idle');
    setCodegenError(null);
  }, []);

  const handleLooksGood = useCallback(() => {
    setBuildStatus('approved');
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0d0d1a]" data-tutorial="canvas">
      {/* <EditorTutorial deviceId={deviceId} /> */}
      <EditorToolbar
        deviceId={deviceId}
        previewMode={previewMode}
        buildStatus={buildStatus}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        onSaveNow={saveNow}
        onApproveAndBuild={handleApproveAndBuild}
        onCleanUp={handleCleanUp}
        onTogglePreview={() => {
          const next = !previewMode;
          if (next) {
            // Entering preview — clear selection so no outlines show
            useEditorStore.getState().setSelectedIds([]);
            useEditorStore.getState().setSelectedLabel(null);
          }
          setPreviewMode(next);
        }}
        onReportIssue={() => setShowIssueModal(true)}
        onRestoreVersion={onRestoreVersion}
        onToggleHelp={() => setShowHelp((s) => !s)}
        isSandbox={isSandbox}
      />

      {/* Codegen error banner — local only */}
      {!isHosted && codegenError && (
        <div className="flex h-10 items-center justify-between border-b border-red-700/40 bg-red-900/20 px-4">
          <span className="text-sm text-red-300 truncate flex-1 mr-4">
            Codegen error: {codegenError}
          </span>
          <button
            onClick={() => setCodegenError(null)}
            className="rounded border border-gray-600 bg-gray-800 px-3 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-700 flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Preview mode banner */}
      {previewMode && (
        <div className="flex h-10 items-center justify-between border-b border-amber-700/40 bg-amber-900/20 px-4">
          <span className="text-sm text-amber-300 truncate">
            {buildStatus === 'approved' && exportMessage
              ? `✓ ${exportMessage}`
              : buildStatus === 'approved'
                ? '✓ Panel exported'
                : 'Preview Mode — clean panel view (click Preview to exit)'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPreviewMode(false); setBuildStatus('idle'); setExportMessage(null); }}
              className="rounded border border-gray-600 bg-gray-800 px-3 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-700"
            >
              Back to Editor
              </button>
          </div>
        </div>
      )}

      {/* Admin feedback banner — visible inside editor while contractor works */}
      {isHosted && adminNote && !previewMode && (
        <div
          className="flex items-start gap-2 border-b border-blue-700/40 bg-blue-900/20 px-4 py-2 cursor-pointer"
          onClick={() => setNoteExpanded(!noteExpanded)}
        >
          <span className="text-blue-400 text-sm mt-0.5">📋</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-blue-400 font-medium">Reviewer feedback</p>
            <p className={`text-xs text-blue-300/80 whitespace-pre-wrap ${noteExpanded ? '' : 'line-clamp-1'}`}>
              {adminNote}
            </p>
            {!noteExpanded && adminNote.length > 80 && (
              <span className="text-[9px] text-blue-400/50">Click to expand</span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        <LayersPanel />
        <EditorWorkspace deviceId={deviceId} readOnly={previewMode} />
        <PropertiesPanel />
      </div>
      {!previewMode && <ContextMenu />}

      {showIssueModal && (
        <IssueReportModal
          deviceId={deviceId}
          onClose={() => setShowIssueModal(false)}
        />
      )}

      <EditorHelpDrawer
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        onReplayTour={() => {
          setShowHelp(false);
          window.dispatchEvent(new Event('editor-tutorial-replay'));
        }}
      />
    </div>
  );
}

export default function PanelEditor({ deviceId, isSandbox }: PanelEditorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [adminNote, setAdminNote] = useState<string | null>(null);

  // Exposed for VersionHistoryDropdown to trigger a reload after restore
  const forceReload = useCallback(() => {
    // Push current state for undo before loading restored version
    useEditorStore.getState().pushSnapshot();
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    // If the Zustand store already has data for this device (e.g., we switched
    // tabs and came back), skip the disk reload to preserve in-memory state
    // and undo history. Only fetch from disk on first load or device change.
    // BUT: if reloadKey > 0, always reload (version restore triggered it).
    // Force reload if ?reload= param is present (review flow pulls fresh data)
    const hasReloadParam = typeof window !== 'undefined' && window.location.search.includes('reload=');
    const currentStore = useEditorStore.getState();
    if (!hasReloadParam && reloadKey === 0 && currentStore.deviceId === deviceId && Object.keys(currentStore.controls).length > 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchManifest() {
      try {
        const useHostedApi = isHosted || isSandbox;

        // Check sessionStorage for a recent local save — bypasses CDN propagation delay.
        // On refresh, the server might return stale data for a few seconds due to
        // Blob CDN caching. If we saved recently, use the local copy instead.
        let data: any = null;
        let usedLocalCache = false;
        try {
          const cached = sessionStorage.getItem(`manifest-cache-${deviceId}`);
          if (cached) {
            const { data: cachedData, savedAt } = JSON.parse(cached);
            if (Date.now() - savedAt < 60000) {
              // Local save within last 60 seconds — use it directly
              data = { ...cachedData, _source: 'hosted' };
              usedLocalCache = true;
            }
            sessionStorage.removeItem(`manifest-cache-${deviceId}`);
          }
        } catch { /* sessionStorage not available */ }

        const apiUrl = `${useHostedApi ? '/api/hosted/panels' : '/api/pipeline'}/${deviceId}${useHostedApi ? '' : '/manifest'}`;

        // Fall through to server fetch if no local cache
        if (!data) {
          const res = await fetch(apiUrl, { cache: 'no-store' });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(
              body.error ?? `Failed to load manifest (${res.status})`
            );
          }
          data = await res.json();
        }

        // If we used local cache, verify in background that no OTHER session
        // saved newer data while we were away. Compare _loadedAt (our last known
        // server timestamp) against the server's current _updatedAt.
        if (usedLocalCache && !cancelled) {
          const ourLoadedAt = data._loadedAt;
          if (ourLoadedAt) {
            fetch(apiUrl, { cache: 'no-store' }).then(async (res) => {
              if (!res.ok || cancelled) return;
              const serverData = await res.json();
              const serverTime = serverData._updatedAt ? new Date(serverData._updatedAt).getTime() : 0;
              const ourTime = new Date(ourLoadedAt).getTime();
              if (serverTime > ourTime) {
                // Server has data saved AFTER our last successful save — another session.
                window.location.reload();
              }
            }).catch(() => { /* background check — non-critical */ });
          }
        }
        if (!cancelled) {
          // Accept both 'sections' (editor auto-save format) and 'editorSections' (production manifest format)
          const rawSections = data.sections ?? data.editorSections;
          if ((data._source === 'editor' || data._source === 'hosted') && rawSections && data.controls) {
            // Restore previously saved editor state (flat sections/controls)
            // API normalizes to arrays — convert back to Record<id, Def> if needed
            const sections = Array.isArray(rawSections)
              ? Object.fromEntries(rawSections.map((s: any) => [s.id, {
                  ...s,
                  // Normalize: manifest uses 'controls', editor uses 'childIds'
                  childIds: s.childIds ?? s.controls ?? [],
                }]))
              : rawSections;
            const controls = Array.isArray(data.controls)
              ? Object.fromEntries(data.controls.map((c: any) => [c.id, c]))
              : data.controls;

            // Use saved canvas dimensions if available (positions were created for that size).
            // If not saved, DON'T recompute from deviceDimensions — the positions were created
            // for the old default canvas. Let the store defaults (1200x1650) handle it.
            const canvasUpdate: Record<string, number> = {};
            if (data.canvasWidth && data.canvasHeight) {
              canvasUpdate.canvasWidth = data.canvasWidth;
              canvasUpdate.canvasHeight = data.canvasHeight;
            }
            // Restore canvas settings if saved
            if (typeof data.controlScale === 'number') {
              canvasUpdate.controlScale = data.controlScale;
            }
            if (typeof data.zoom === 'number') {
              canvasUpdate.zoom = data.zoom;
            }
            if (typeof data.cleanupGap === 'number') {
              canvasUpdate.cleanupGap = data.cleanupGap;
            }
            if (typeof data.panelScale === 'number') {
              canvasUpdate.panelScale = data.panelScale;
            }

            useEditorStore.setState({
              deviceId,
              deviceName: data.deviceName ?? '',
              manufacturer: data.manufacturer ?? '',
              sections,
              controls,
              editorLabels: data.editorLabels ?? [],
              controlGroups: data.controlGroups ?? [],
              controlContainers: data.controlContainers ?? [],
              selectedIds: [],
              lockedIds: [],
              keyboard: data.keyboard ?? null,
              _manifestVersion: data._manifestVersion ?? computeManifestVersion(data),
              _loadedAt: data._updatedAt ?? null,
              hasUserEdited: false,
              ...canvasUpdate,
            });
          } else {
            // First load — convert original pipeline manifest to editor format
            useEditorStore.getState().loadFromManifest(data as MasterManifestInput);
            // Store server timestamp for conflict detection (the if-branch sets it in setState above)
            if (data._updatedAt) {
              useEditorStore.setState({ _loadedAt: data._updatedAt });
            }
          }
          // Initialize labels from controls if not yet done (migration)
          useEditorStore.getState().initLabelsFromControls();

          // In hosted mode, capture admin note. Editor stays unlocked —
          // contractor can keep editing and re-submit at any time.
          if (isHosted) {
            setAdminNote(data._adminNote ?? null);
          }

          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      }
    }

    fetchManifest();
    return () => {
      cancelled = true;
    };
  }, [deviceId, reloadKey]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0d0d1a]">
        <div className="text-gray-500">Loading manifest...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0d0d1a]">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return <EditorShell deviceId={deviceId} onRestoreVersion={forceReload} adminNote={adminNote} isSandbox={isSandbox} />;
}
