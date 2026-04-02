'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DEVICE_REGISTRY } from '@/lib/deviceRegistry';

export default function PreviewPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const router = useRouter();
  const [panelState, setPanelState] = useState<Record<string, { active: boolean }>>({});
  const [highlightedControls, setHighlightedControls] = useState<string[]>([]);
  const [previewScale, setPreviewScale] = useState(1);
  const [rebuilding, setRebuilding] = useState(false);

  if (!deviceId) return null;

  const entry = DEVICE_REGISTRY[deviceId];
  const PanelComponent = entry?.PanelComponent;

  const handleButtonClick = (id: string) => {
    setPanelState(prev => ({
      ...prev,
      [id]: { active: !prev[id]?.active },
    }));
    setHighlightedControls([id]);
    setTimeout(() => setHighlightedControls([]), 1500);
  };

  const handleCanvasResize = useCallback(async (factor: number) => {
    setRebuilding(true);
    try {
      // 1. Scale the editor canvas + all controls
      const res = await fetch(`/api/pipeline/${deviceId}/manifest`);
      if (!res.ok) throw new Error('Failed to load manifest');
      const data = await res.json();

      const controls = data.controls ?? {};
      const sections = data.sections ?? {};
      const canvasW = (data.canvasWidth ?? 1200) * factor;
      const canvasH = (data.canvasHeight ?? 361) * factor;

      // Scale controls
      const scaledControls: Record<string, any> = {};
      const controlEntries = Array.isArray(controls)
        ? controls.map((c: any) => [c.id, c])
        : Object.entries(controls);
      for (const [id, ctrl] of controlEntries) {
        scaledControls[id] = {
          ...ctrl,
          x: Math.round((ctrl.x ?? 0) * factor),
          y: Math.round((ctrl.y ?? 0) * factor),
          w: Math.round((ctrl.w ?? 48) * factor),
          h: Math.round((ctrl.h ?? 32) * factor),
        };
      }

      // Scale sections
      const scaledSections: Record<string, any> = {};
      const sectionEntries = Array.isArray(sections)
        ? sections.map((s: any) => [s.id, s])
        : Object.entries(sections);
      for (const [id, sec] of sectionEntries) {
        scaledSections[id] = {
          ...sec,
          x: Math.round((sec.x ?? 0) * factor),
          y: Math.round((sec.y ?? 0) * factor),
          w: Math.round((sec.w ?? 100) * factor),
          h: Math.round((sec.h ?? 100) * factor),
        };
      }

      // 2. Save scaled state
      await fetch(`/api/pipeline/${deviceId}/manifest`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          sections: scaledSections,
          controls: scaledControls,
          canvasWidth: Math.round(canvasW),
          canvasHeight: Math.round(canvasH),
        }),
      });

      // 3. Re-run codegen
      await fetch(`/api/pipeline/${deviceId}/codegen`, { method: 'POST' });

      // 4. Reload to pick up new generated panel
      router.refresh();
      window.location.reload();
    } catch (err) {
      console.error('Canvas resize failed:', err);
    }
    setRebuilding(false);
  }, [deviceId, router]);

  return (
    <div className="h-full overflow-auto flex flex-col bg-[#0a0a0f]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-800 flex-shrink-0">
        {/* Zoom (instant) */}
        <label className="text-[10px] uppercase tracking-wider text-gray-500">Zoom</label>
        <input
          type="range"
          min={25}
          max={200}
          step={5}
          value={Math.round(previewScale * 100)}
          onChange={(e) => setPreviewScale(Number(e.target.value) / 100)}
          className="h-1 w-24 cursor-pointer accent-blue-500"
        />
        <span className="text-[10px] text-gray-400 w-8">{Math.round(previewScale * 100)}%</span>
        <button
          onClick={() => setPreviewScale(1)}
          className="text-[10px] text-gray-500 hover:text-gray-300 px-1"
        >
          Reset
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-700" />

        {/* Canvas resize (re-render) */}
        <button
          onClick={() => handleCanvasResize(0.8)}
          disabled={rebuilding}
          className="flex h-6 w-6 items-center justify-center rounded text-[10px] text-gray-400 hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30"
          title="Shrink canvas 80% (re-renders)"
        >-</button>
        <span className="text-[10px] text-gray-500">Canvas</span>
        <button
          onClick={() => handleCanvasResize(1.25)}
          disabled={rebuilding}
          className="flex h-6 w-6 items-center justify-center rounded text-[10px] text-gray-400 hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30"
          title="Grow canvas 125% (re-renders)"
        >+</button>
        {rebuilding && <span className="text-[10px] text-blue-400">Rebuilding...</span>}
      </div>

      {/* Panel */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-8">
        {PanelComponent ? (
          <div
            className="shadow-2xl"
            style={{
              transform: `scale(${previewScale})`,
              transformOrigin: 'top center',
            }}
          >
            <PanelComponent
              panelState={panelState}
              highlightedControls={highlightedControls}
              onButtonClick={handleButtonClick}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center mt-20">
            <h2 className="text-xl font-semibold text-gray-300">Panel Not Generated Yet</h2>
            <p className="text-sm text-gray-500 max-w-md">
              Use the Editor tab to position controls, then click &quot;Approve &amp; Build&quot; to generate the panel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
