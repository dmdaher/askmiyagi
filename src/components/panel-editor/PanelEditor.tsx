'use client';

import { useEffect, useState } from 'react';
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

  return (
    <div className="flex flex-col h-screen bg-[#0d0d1a]">
      <EditorToolbar />
      <div className="flex flex-1 overflow-hidden">
        <EditorWorkspace deviceId={deviceId} />
        <div className="w-72 border-l border-gray-800 bg-[#0d0d1a]">
          <PropertiesPanel />
        </div>
      </div>
      <ContextMenu />
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
        const data: MasterManifestInput = await res.json();
        if (!cancelled) {
          useEditorStore.getState().loadFromManifest(data);
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
