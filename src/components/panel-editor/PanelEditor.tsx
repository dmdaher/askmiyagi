'use client';

import { useCallback, useEffect, useState } from 'react';
import { useEditorStore } from './store';
import type { MasterManifestInput } from './store';
import EditorToolbar from './EditorToolbar';
import EditorWorkspace from './EditorWorkspace';
import PropertiesPanel from './PropertiesPanel';
import LayersPanel from './LayersPanel';
import ContextMenu from './ContextMenu';
import IssueReportModal from './IssueReportModal';
import EditorTutorial from './EditorTutorial';
import { useEditorKeyboard } from './hooks/useEditorKeyboard';
import { useAutoSave } from './hooks/useAutoSave';
import { computeManifestVersion } from '@/lib/pipeline/manifest-version';
import { cleanupGeometry } from '@/lib/layout-inference';

interface PanelEditorProps {
  deviceId: string;
}

/** Inner shell rendered after manifest is loaded. Hooks run unconditionally here. */
function EditorShell({ deviceId }: { deviceId: string }) {
  useEditorKeyboard();
  useAutoSave(deviceId);

  const [previewMode, setPreviewMode] = useState(false);
  const [buildStatus, setBuildStatus] = useState<
    'idle' | 'building' | 'approved'
  >('idle');
  const [codegenError, setCodegenError] = useState<string | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);

  // ── Clean Up: optional inference pass (snap rows, equalize spacing) ──────
  const handleCleanUp = useCallback(() => {
    const state = useEditorStore.getState();
    const { sections, controls, canvasWidth, canvasHeight } = state;

    // Push snapshot so Cmd+Z reverts the cleanup
    state.pushSnapshot();

    // Run geometry cleanup (snap alignment, equalize spacing)
    const cleaned = cleanupGeometry(sections, controls, canvasWidth, canvasHeight);

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
    const state = useEditorStore.getState();
    const { sections, controls, canvasWidth, canvasHeight, _manifestVersion, controlScale, zoom } = state;
    setBuildStatus('building');
    setCodegenError(null);

    try {
      // Force-save current manifest (bypass debounce)
      await fetch(`/api/pipeline/${deviceId}/manifest`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections, controls, canvasWidth, canvasHeight, _manifestVersion, controlScale, zoom }),
      });

      // Trigger codegen directly — no cleanup, no inference.
      // Contractor's positions and sizes are used as-is.
      const codegenRes = await fetch(`/api/pipeline/${deviceId}/codegen`, { method: 'POST' });
      if (!codegenRes.ok) {
        const body = await codegenRes.json().catch(() => ({}));
        throw new Error(
          body.error
            ? `${body.error}: ${body.stderr || body.details || ''}`
            : 'Codegen failed'
        );
      }

      setPreviewMode(true);
      setBuildStatus('idle');
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
      <EditorTutorial deviceId={deviceId} />
      <EditorToolbar
        previewMode={previewMode}
        buildStatus={buildStatus}
        onApproveAndBuild={handleApproveAndBuild}
        onCleanUp={handleCleanUp}
        onReportIssue={() => setShowIssueModal(true)}
      />

      {/* Codegen error banner */}
      {codegenError && (
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
          <span className="text-sm text-amber-300">
            {buildStatus === 'approved'
              ? '✓ Panel generated and registered! It\'s live.'
              : 'Preview Mode — Reviewing generated panel'}
          </span>
          <div className="flex items-center gap-2">
            {buildStatus === 'approved' ? (
              <>
                <button
                  onClick={handleBackToEditor}
                  className="rounded border border-gray-600 bg-gray-800 px-3 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-700"
                >
                  Continue Editing
                </button>
                <a
                  href={`/admin/${deviceId}/preview`}
                  className="rounded border border-green-600 bg-green-700/30 px-3 py-1 text-xs text-green-300 transition-colors hover:bg-green-700/50"
                >
                  View Live Panel →
                </a>
              </>
            ) : (
              <>
                <button
                  onClick={handleBackToEditor}
                  className="rounded border border-gray-600 bg-gray-800 px-3 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-700"
                >
                  Back to Editor
                </button>
                <button
                  onClick={handleLooksGood}
                  className="rounded border border-green-600 bg-green-700/30 px-3 py-1 text-xs text-green-300 transition-colors hover:bg-green-700/50"
                >
                  Looks Good
                </button>
              </>
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
    </div>
  );
}

export default function PanelEditor({ deviceId }: PanelEditorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If the Zustand store already has data for this device (e.g., we switched
    // tabs and came back), skip the disk reload to preserve in-memory state
    // and undo history. Only fetch from disk on first load or device change.
    const currentStore = useEditorStore.getState();
    if (currentStore.deviceId === deviceId && Object.keys(currentStore.controls).length > 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchManifest() {
      try {
        const res = await fetch(`/api/pipeline/${deviceId}/manifest`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.error ?? `Failed to load manifest (${res.status})`
          );
        }
        const data = await res.json();
        if (!cancelled) {
          if (data._source === 'editor' && data.sections && data.controls) {
            // Restore previously saved editor state (flat sections/controls)
            // API normalizes to arrays — convert back to Record<id, Def> if needed
            const sections = Array.isArray(data.sections)
              ? Object.fromEntries(data.sections.map((s: any) => [s.id, {
                  ...s,
                  // Normalize: manifest uses 'controls', editor uses 'childIds'
                  childIds: s.childIds ?? s.controls ?? [],
                }]))
              : data.sections;
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
            // Restore canvas settings (controlScale, zoom) if saved
            if (typeof data.controlScale === 'number') {
              canvasUpdate.controlScale = data.controlScale;
            }
            if (typeof data.zoom === 'number') {
              canvasUpdate.zoom = data.zoom;
            }

            useEditorStore.setState({
              deviceId,
              deviceName: data.deviceName ?? '',
              manufacturer: data.manufacturer ?? '',
              sections,
              controls,
              selectedIds: [],
              lockedIds: [],
              keyboard: data.keyboard ?? null,
              _manifestVersion: data._manifestVersion ?? computeManifestVersion(data),
              hasUserEdited: false,
              ...canvasUpdate,
            });
          } else {
            // First load — convert original pipeline manifest to editor format
            useEditorStore.getState().loadFromManifest(data as MasterManifestInput);
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
  }, [deviceId]);

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

  return <EditorShell deviceId={deviceId} />;
}
