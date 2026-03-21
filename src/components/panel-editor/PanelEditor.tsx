'use client';

import { useCallback, useEffect, useState } from 'react';
import { useEditorStore } from './store';
import type { MasterManifestInput } from './store';
import EditorToolbar from './EditorToolbar';
import EditorWorkspace from './EditorWorkspace';
import PropertiesPanel from './PropertiesPanel';
import LayersPanel from './LayersPanel';
import ContextMenu from './ContextMenu';
import InferenceReview from './InferenceReview';
import { useEditorKeyboard } from './hooks/useEditorKeyboard';
import { useAutoSave } from './hooks/useAutoSave';
import { inferLayout, type InferredSection } from '@/lib/layout-inference';

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
  const [showInferenceReview, setShowInferenceReview] = useState(false);
  const [inferenceResults, setInferenceResults] = useState<InferredSection[]>([]);
  const [codegenError, setCodegenError] = useState<string | null>(null);

  const handleApproveAndBuild = useCallback(async () => {
    // Force-save current manifest (bypass debounce)
    const { sections, controls } = useEditorStore.getState();
    setBuildStatus('building');
    setCodegenError(null);
    try {
      await fetch(`/api/pipeline/${deviceId}/manifest`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections, controls }),
      });
    } catch {
      // Best-effort save
    }

    // Run layout inference
    const result = inferLayout(sections, controls);
    setInferenceResults(result.sections);
    setShowInferenceReview(true);
    setBuildStatus('idle');
  }, [deviceId]);

  const handleInferenceBack = useCallback(() => {
    setShowInferenceReview(false);
    setInferenceResults([]);
  }, []);

  const handleInferenceGenerate = useCallback(async (sections: InferredSection[]) => {
    setShowInferenceReview(false);
    setBuildStatus('building');
    setCodegenError(null);

    try {
      // Save inferred layout
      const saveRes = await fetch(`/api/pipeline/${deviceId}/inferred-layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections }),
      });

      if (!saveRes.ok) {
        const body = await saveRes.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to save inferred layout');
      }

      // Trigger codegen
      const codegenRes = await fetch(`/api/pipeline/${deviceId}/codegen`, {
        method: 'POST',
      });

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
    <div className="flex flex-col h-screen bg-[#0d0d1a]">
      <EditorToolbar
        previewMode={previewMode}
        buildStatus={buildStatus}
        onApproveAndBuild={handleApproveAndBuild}
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
                  href={`/dev/panel?device=${deviceId}`}
                  target="_blank"
                  rel="noopener noreferrer"
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

      <div className="flex flex-1 overflow-hidden">
        <LayersPanel />
        <EditorWorkspace deviceId={deviceId} readOnly={previewMode} />
        <div className="w-72 border-l border-gray-800 bg-[#0d0d1a]">
          <PropertiesPanel />
        </div>
      </div>
      {!previewMode && <ContextMenu />}

      {/* Inference Review Modal */}
      {showInferenceReview && (
        <InferenceReview
          sections={inferenceResults}
          onBack={handleInferenceBack}
          onGenerate={handleInferenceGenerate}
        />
      )}
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
