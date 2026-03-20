'use client';

import { useCallback, useEffect, useState } from 'react';
import { useEditorStore } from './store';
import type { MasterManifestInput } from './store';
import EditorToolbar from './EditorToolbar';
import EditorWorkspace from './EditorWorkspace';
import PropertiesPanel from './PropertiesPanel';
import ContextMenu from './ContextMenu';
import { useEditorKeyboard } from './hooks/useEditorKeyboard';
import { useAutoSave } from './hooks/useAutoSave';

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

  const handleApproveAndBuild = useCallback(async () => {
    // Force-save current manifest (bypass debounce)
    const { sections, controls } = useEditorStore.getState();
    setBuildStatus('building');
    try {
      await fetch(`/api/pipeline/${deviceId}/manifest`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections, controls }),
      });
    } catch {
      // Best-effort save
    }
    setPreviewMode(true);
    setBuildStatus('idle');
  }, [deviceId]);

  const handleBackToEditor = useCallback(() => {
    setPreviewMode(false);
    setBuildStatus('idle');
  }, []);

  const handleLooksGood = useCallback(() => {
    setBuildStatus('approved');
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#0d0d1a]">
      <EditorToolbar
        previewMode={previewMode}
        buildStatus={buildStatus}
        onApproveAndBuild={handleApproveAndBuild}
      />

      {/* Preview mode banner */}
      {previewMode && (
        <div className="flex h-10 items-center justify-between border-b border-amber-700/40 bg-amber-900/20 px-4">
          <span className="text-sm text-amber-300">
            {buildStatus === 'approved'
              ? 'Panel approved — ready for codegen.'
              : 'Preview Mode — Reviewing generated panel'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackToEditor}
              className="rounded border border-gray-600 bg-gray-800 px-3 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-700"
            >
              Back to Editor
            </button>
            {buildStatus !== 'approved' && (
              <button
                onClick={handleLooksGood}
                className="rounded border border-green-600 bg-green-700/30 px-3 py-1 text-xs text-green-300 transition-colors hover:bg-green-700/50"
              >
                Looks Good
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <EditorWorkspace deviceId={deviceId} readOnly={previewMode} />
        <div className="w-72 border-l border-gray-800 bg-[#0d0d1a]">
          <PropertiesPanel />
        </div>
      </div>
      {!previewMode && <ContextMenu />}
    </div>
  );
}

export default function PanelEditor({ deviceId }: PanelEditorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
            useEditorStore.setState({
              deviceId,
              sections: data.sections,
              controls: data.controls,
              selectedIds: [],
              lockedIds: [],
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
      <div className="flex h-screen items-center justify-center bg-[#0d0d1a]">
        <div className="text-gray-500">Loading manifest...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d0d1a]">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return <EditorShell deviceId={deviceId} />;
}
